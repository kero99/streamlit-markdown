# Streamlit Markdown Editor

A powerful markdown editor component for Streamlit with live preview, dark theme support, and image paste capabilities.

## Features

- 📝 **Live Preview** - See your markdown rendered in real-time
- 🌙 **Dark Theme Support** - Automatic or manual theme switching
- 🖼️ **Image Paste/Drop** - Paste or drop images directly into the editor
- 📁 **Local Image Storage** - Store images in local folders
- 🛠️ **Customizable Toolbar** - Configure which buttons to show
- ⚡ **Fast Performance** - Built with CodeMirror 6 for speed
- 📱 **Responsive Design** - Works on all screen sizes
- 🔄 **Auto Base64 Collapse** - Long base64 images are collapsed in editor for readability

## Installation

```bash
pip install streamlit-markdown
```

### Install from GitHub

```bash
pip install git+https://github.com/kero99/streamlit-markdown.git
```

## Quick Start

```python
import streamlit as st
from streamlit_markdown import st_markdown, get_markdown_content

# Basic usage
result = st_markdown(
    value="# Hello World\n\nStart writing...",
    height=400
)

# Get the markdown content
content = get_markdown_content(result)
st.write("You wrote:", content)
```

## Advanced Usage

### Dark Theme

```python
content = st_markdown(
    value="",
    theme="dark",  # "light", "dark", or "auto"
    height=500
)
```

### Custom Toolbar

```python
content = st_markdown(
    value="",
    toolbar=[
        "bold", "italic", "|",
        "heading1", "heading2", "|",
        "unordered-list", "ordered-list", "|",
        "link", "image", "|",
        "preview-toggle"
    ]
)
```

### Image Upload with Local Storage

```python
result = st_markdown(
    value="",
    image_upload_path="./assets/images/"
)
# Images are saved to disk and paths stored in markdown
content = get_markdown_content(result)
```

### Preview Position

```python
# Side by side
content = st_markdown(value="", preview_position="right")

# Stacked
content = st_markdown(value="", preview_position="bottom")

# Tabs
content = st_markdown(value="", preview_position="tab")
```

### Read-Only Mode

```python
st_markdown(
    value=existing_content,
    readonly=True,
    preview=True,
    preview_position="tab"
)
```

---

## Database Integration

### Storing Markdown with Images

**Option 1: Store with File Paths (Recommended)**

```python
from streamlit_markdown import st_markdown, get_markdown_content

result = st_markdown(
    value=existing_content,
    image_upload_path="./assets/images/"
)

# Content contains file paths: ![img](assets/images/img_abc123.png)
content = get_markdown_content(result)
db.save(document_id, content)
```

**Option 2: Store with Base64 Inline**

```python
result = st_markdown(value=existing_content)
# No image_upload_path = images stay as base64
content = get_markdown_content(result)
db.save(document_id, content)
```

### Complete Integration Example

```python
import streamlit as st
import uuid
from streamlit_markdown import st_markdown, get_markdown_content

def load_document(doc_id):
    return db.query("SELECT content FROM documents WHERE id = %s", (doc_id,))

def save_document(doc_id, content):
    db.execute("UPDATE documents SET content = %s WHERE id = %s", (content, doc_id))

# Load existing content
doc_id = st.session_state.get("doc_id", str(uuid.uuid4()))
existing_content = load_document(doc_id) or ""

# Editor
result = st_markdown(
    value=existing_content,
    image_upload_path=f"./assets/{doc_id}/",
    height=500
)

# Save
if st.button("Save"):
    content = get_markdown_content(result)
    save_document(doc_id, content)
    st.success("Saved!")
```

### Image Handling Flow

```
User pastes image
       ↓
Frontend: Embed as base64 for preview
       ↓
Python: Save to disk, replace with file path
       ↓
Database: Store markdown with file paths
       ↓
On Load: Convert file paths back to base64 for preview
```

---

## API Reference

### `st_markdown()`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `str` | `""` | Initial markdown content |
| `placeholder` | `str` | `"Write your markdown here..."` | Placeholder text |
| `height` | `int` | `400` | Editor height in pixels |
| `theme` | `str` | `"auto"` | Theme: "light", "dark", or "auto" |
| `toolbar` | `list` | Full toolbar | List of toolbar buttons |
| `preview` | `bool` | `True` | Show live preview |
| `preview_position` | `str` | `"right"` | Preview position: "right", "bottom", "tab" |
| `image_upload_path` | `str` | `None` | Local folder for images |
| `readonly` | `bool` | `False` | Read-only mode |
| `debounce_ms` | `int` | `300` | Debounce delay for updates |
| `key` | `str` | `None` | Unique component key |

### Return Value

Returns a dictionary:
```python
{
    "content": str,  # The markdown content
    "images": list   # Pending image uploads (internal use)
}
```

### `get_markdown_content(result)`

Helper function to extract markdown content:
```python
result = st_markdown(value="# Hello")
content = get_markdown_content(result)  # Returns "# Hello"
```

### Toolbar Buttons

Available toolbar buttons:
- Text: `bold`, `italic`, `strikethrough`
- Headings: `heading1`, `heading2`, `heading3`
- Lists: `unordered-list`, `ordered-list`, `checklist`
- Code: `code`, `code-block`
- Insert: `link`, `image`
- Block: `quote`, `horizontal-rule`
- Actions: `undo`, `redo`, `preview-toggle`
- Separator: `|`

---

## Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8501:8501"
    volumes:
      - ./assets:/app/assets  # Persist uploaded images
```

---

## Development

### Building from Source

```bash
cd streamlit-markdown/streamlit_markdown/frontend
npm install
npm run build
cd ../..
pip install -e .
```

### Running in Dev Mode

```bash
# Terminal 1: Start frontend dev server
cd streamlit_markdown/frontend
npm start

# Terminal 2: Run Streamlit app with RELEASE=False
streamlit run your_app.py
```

---

## Troubleshooting

### Images not displaying in preview
- Check that the file path exists and app has read access
- The component auto-converts local paths to base64 for preview

### Component not found error
```bash
cd streamlit_markdown/frontend
npm install && npm run build
cd ../..
pip install -e .
```

---

## License

MIT License

## Credits

This project is based on [streamlit-quill](https://github.com/okld/streamlit-quill).

Built with:
- [Streamlit](https://streamlit.io/)
- [CodeMirror 6](https://codemirror.net/)
- [React Markdown](https://github.com/remarkjs/react-markdown)
