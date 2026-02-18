# Bug Report: Image Paste Race Condition — Images Never Reach Python

## Summary

When a user pastes/drops an image into the editor, the image data (`pendingImages`) is lost due to a **race condition between the image handler and the `onChange` callback**. The debounced `setComponentValue` from the image paste is cancelled by the immediately-following `onChange` call, which uses a stale (empty) images array from a React closure.

**Result:** The image file is never saved to disk. The raw base64 data URL stays embedded in the markdown content, causing:
1. Images lost on reload (base64 not persisted as a file)
2. Massive payload bloat (multi-MB base64 strings in content)
3. Editor crash on subsequent save/reload due to payload size

---

## Reproduction Steps

1. Open a playbook (or any document) in the editor
2. Paste an image (Ctrl+V)
3. The image appears inline in the editor (as a `data:` URL)
4. Press Save → content is saved to the database
5. Press Save again → editor closes or crashes
6. Reopen the document → image is gone

---

## Root Cause Analysis

### Relevant code (decompiled from `MarkdownEditor.tsx` → minified JS)

```javascript
// State declarations
const [content, setContent] = useState(defaultValue || "");   // f, p
const [pendingImages, setPendingImages] = useState([]);        // m, g

// Debounced setComponentValue (k)
const debouncedSend = useCallback((content, images) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
        Streamlit.setComponentValue({ content, images });
        if (images.length > 0) setPendingImages([]);  // clear after send
    }, debounceMs);  // 800ms
}, [debounceMs]);

// Editor onChange handler (T)
const onChange = useCallback((newContent) => {
    setContent(newContent);
    debouncedSend(newContent, m);  // ← uses `m` from closure = stale!
}, [m, debouncedSend]);            // `m` is pendingImages STATE, 
                                   // but NOT yet updated when paste fires onChange

// Image handler (x) — called on paste/drop
const handleImageFile = useCallback(async (file) => {
    const dataUrl = await readAsDataURL(file);
    const markdownImg = `![${file.name}](${dataUrl})`;
    
    if (imageUploadEnabled) {
        const imageData = { data: dataUrl, filename: file.name, placeholder: dataUrl, mimeType: file.type };
        setPendingImages(prev => {
            const newImages = [...prev, imageData];
            debouncedSend(content, newImages);  // ← starts debounce timer WITH images ✅
            return newImages;
        });
    }
    return markdownImg;
}, [content, imageUploadEnabled, debouncedSend]);
```

### The race

When the user pastes an image, this sequence happens **synchronously within a single event loop tick**:

```
1. handlePaste fires
   └→ handleImageFile(file)
       └→ setPendingImages([imageData])          // React state update (batched, not yet applied)
       └→ debouncedSend(content, [imageData])    // ✅ Timer A starts: will send images after 800ms

2. Editor content changes (markdown image string was inserted)
   └→ onChange(newContent)
       └→ debouncedSend(newContent, m)           // ❌ `m` is still [] (stale closure!)
                                                  //    Timer A is CANCELLED, Timer B starts
                                                  //    Timer B will send { content, images: [] }

3. 800ms later → Timer B fires
   └→ setComponentValue({ content: "..![img](data:...)...", images: [] })
   // Images array is EMPTY → Python never saves the file
```

**The core issue:** `onChange` captures `pendingImages` (`m`) via closure at the time `useCallback` last ran. When `setPendingImages` is called in the image handler, React batches the state update — the new value is NOT available to the `onChange` closure until the next render. But `onChange` fires immediately after the paste (because the editor content changed), cancelling the image handler's debounce timer.

---

## Proposed Fixes

### Option A: Use a `useRef` for pendingImages (Recommended)

Keep pending images in a `useRef` so both `onChange` and `handleImageFile` always read/write the latest value without depending on React render cycles:

```tsx
const pendingImagesRef = useRef<ImageData[]>([]);

const debouncedSend = useCallback((content: string) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
        const images = pendingImagesRef.current;
        Streamlit.setComponentValue({ content, images });
        if (images.length > 0) {
            pendingImagesRef.current = [];
        }
    }, debounceMs);
}, [debounceMs]);

const onChange = useCallback((newContent: string) => {
    setContent(newContent);
    debouncedSend(newContent);  // images read from ref inside the timeout
}, [debouncedSend]);

const handleImageFile = useCallback(async (file: File) => {
    const dataUrl = await readAsDataURL(file);
    const markdownImg = `![${file.name}](${dataUrl})`;
    
    if (imageUploadEnabled) {
        const imageData = { data: dataUrl, filename: file.name, placeholder: dataUrl, mimeType: file.type };
        pendingImagesRef.current = [...pendingImagesRef.current, imageData];
        debouncedSend(content);  // Timer will pick up images from ref
    }
    return markdownImg;
}, [content, imageUploadEnabled, debouncedSend]);
```

**Why this works:** The `setTimeout` callback inside `debouncedSend` reads `pendingImagesRef.current` at execution time (not closure capture time), so it always has the latest images regardless of which caller started the timer.

### Option B: Bypass debounce for image uploads

When images are pending, send immediately instead of debouncing:

```tsx
const sendToStreamlit = useCallback((content: string, images: ImageData[]) => {
    if (images.length > 0) {
        // Images present — send immediately, don't debounce
        clearTimeout(timerRef.current);
        Streamlit.setComponentValue({ content, images });
        setPendingImages([]);
    } else {
        // Text-only change — debounce normally
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            Streamlit.setComponentValue({ content, images: [] });
        }, debounceMs);
    }
}, [debounceMs]);
```

### Option C: Use a flag to skip onChange after paste

Set a short-lived flag during paste to prevent `onChange` from overriding the pending image data:

```tsx
const pasteInProgressRef = useRef(false);

// In handleImageFile:
pasteInProgressRef.current = true;
setTimeout(() => { pasteInProgressRef.current = false; }, 50);

// In onChange:
if (!pasteInProgressRef.current) {
    debouncedSend(newContent, pendingImagesRef.current);
}
```

---

## Impact

This bug affects **every image paste/drop operation** when `imageUploadEnabled` is `true`. The image data never reaches the Python backend, so no file is ever written to `image_upload_path`. The raw base64 data URL gets stored in the content as a multi-MB string, causing downstream performance issues and eventual data loss on reload.
