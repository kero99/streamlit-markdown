/**
 * Streamlit Markdown Editor - Main Component
 * 
 * A markdown editor with live preview, dark theme support,
 * and image paste/drop capabilities.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Streamlit, withStreamlitConnection } from "streamlit-component-lib";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";

import { MarkdownEditorProps, ComponentValue, ImageUploadData } from "./types";
import { lightTheme, darkTheme } from "./themes";
import { imageDecorations } from "./imageDecorations";
import Toolbar from "./Toolbar";
import Preview from "./Preview";

import "./themes/light.css";
import "./themes/dark.css";
import "./MarkdownEditor.css";

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ args }) => {
  const {
    defaultValue,
    placeholder,
    height,
    theme: themeMode,
    toolbar: toolbarConfig,
    preview: showPreview,
    previewPosition,
    readonly,
    debounceMs,
    imageUploadEnabled,
  } = args;

  // State
  const [content, setContent] = useState<string>(defaultValue || "");
  const [pendingImages, setPendingImages] = useState<ImageUploadData[]>([]);
  const [previewVisible, setPreviewVisible] = useState<boolean>(showPreview);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDefaultValueRef = useRef<string | null>(defaultValue);

  // Fix 2 (frontend): Only update content from defaultValue when it genuinely
  // changes from the Python side. When Python sends null, it means "no change",
  // so the editor keeps its own internal state.
  useEffect(() => {
    if (!isInitialized) {
      // First mount: apply the initial defaultValue
      if (defaultValue != null) {
        setContent(defaultValue);
        lastDefaultValueRef.current = defaultValue;
      }
      setIsInitialized(true);
      return;
    }

    // Subsequent renders: only update if Python sent a non-null, changed value
    if (defaultValue != null && defaultValue !== lastDefaultValueRef.current) {
      setContent(defaultValue);
      lastDefaultValueRef.current = defaultValue;
    }
  }, [defaultValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect Streamlit theme
  useEffect(() => {
    if (themeMode === "auto") {
      // Check Streamlit's theme
      const isDark = document.body.classList.contains("stApp") && 
        (document.documentElement.getAttribute("data-theme") === "dark" ||
         window.matchMedia("(prefers-color-scheme: dark)").matches);
      setResolvedTheme(isDark ? "dark" : "light");
      
      // Listen for theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      setResolvedTheme(themeMode === "dark" ? "dark" : "light");
    }
  }, [themeMode]);

  // Update frame height
  useEffect(() => {
    Streamlit.setFrameHeight(height + 50); // Extra for toolbar
  }, [height]);

  // Debounced update to Streamlit
  const sendValueToStreamlit = useCallback((value: string, images: ImageUploadData[]) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      const componentValue: ComponentValue = {
        content: value,
        images: images,
      };
      Streamlit.setComponentValue(componentValue);

      // Fix 4: Clear pending images after they have been sent to Python,
      // so they aren't re-transmitted on every subsequent keystroke.
      if (images.length > 0) {
        setPendingImages([]);
      }
    }, debounceMs);
  }, [debounceMs]);

  // Handle content change
  const handleChange = useCallback((value: string) => {
    setContent(value);
    sendValueToStreamlit(value, pendingImages);
  }, [pendingImages, sendValueToStreamlit]);

  // Handle image paste/drop
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        
        // Always use base64 in the markdown for immediate preview
        const markdownImage = `![${file.name}](${base64Data})`;
        
        // If image upload is enabled, also send the image data to Python for saving
        if (imageUploadEnabled) {
          const imageData: ImageUploadData = {
            data: base64Data,
            filename: file.name,
            placeholder: base64Data, // Use base64 as the placeholder to replace
            mimeType: file.type,
          };
          
          setPendingImages(prev => {
            const updated = [...prev, imageData];
            // Send update with new image
            sendValueToStreamlit(content, updated);
            return updated;
          });
        }
        
        resolve(markdownImage);
      };
      reader.readAsDataURL(file);
    });
  }, [content, imageUploadEnabled, sendValueToStreamlit]);

  // Handle paste event
  const handlePaste = useCallback(async (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const markdownImage = await handleImageUpload(file);
          // Insert at cursor position
          if (editorRef.current?.view) {
            const view = editorRef.current.view;
            const { from } = view.state.selection.main;
            view.dispatch({
              changes: { from, insert: markdownImage },
              selection: { anchor: from + markdownImage.length }
            });
          }
        }
        break;
      }
    }
  }, [handleImageUpload]);

  // Handle drop event
  const handleDrop = useCallback(async (event: React.DragEvent) => {
    const files = event.dataTransfer?.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        event.preventDefault();
        const markdownImage = await handleImageUpload(file);
        // Insert at cursor position
        if (editorRef.current?.view) {
          const view = editorRef.current.view;
          const { from } = view.state.selection.main;
          view.dispatch({
            changes: { from, insert: markdownImage + "\n" },
            selection: { anchor: from + markdownImage.length + 1 }
          });
        }
        break;
      }
    }
  }, [handleImageUpload]);

  // Toggle preview
  const togglePreview = useCallback(() => {
    setPreviewVisible(prev => !prev);
  }, []);

  // Get CodeMirror theme
  const editorTheme = useMemo(() => {
    return resolvedTheme === "dark" ? darkTheme : lightTheme;
  }, [resolvedTheme]);

  // CodeMirror extensions
  const extensions = useMemo(() => [
    markdown(),
    EditorView.lineWrapping,
    editorTheme,
    ...imageDecorations,
  ], [editorTheme]);

  // Render layout based on preview position
  const renderEditor = () => (
    <div 
      className="editor-wrapper"
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <CodeMirror
        ref={editorRef}
        value={content}
        height={`${height - 40}px`}
        extensions={extensions}
        onChange={handleChange}
        placeholder={placeholder}
        editable={!readonly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          rectangularSelection: true,
          crosshairCursor: false,
          highlightSelectionMatches: true,
          history: true,
        }}
      />
    </div>
  );

  const renderPreview = () => (
    <Preview
      content={content}
      theme={resolvedTheme}
      height={height - 40}
    />
  );

  return (
    <div 
      ref={containerRef}
      className={`st-markdown-editor ${resolvedTheme}`}
      style={{ height: `${height}px` }}
    >
      <Toolbar
        config={toolbarConfig}
        theme={resolvedTheme}
        editorRef={editorRef}
        previewVisible={previewVisible}
        onTogglePreview={togglePreview}
        readonly={readonly}
      />
      
      <div className={`editor-container ${previewPosition}`}>
        {previewPosition === "tab" ? (
          <>
            <div className="tab-bar">
              <button 
                className={`tab-button ${activeTab === "editor" ? "active" : ""}`}
                onClick={() => setActiveTab("editor")}
              >
                Editor
              </button>
              <button 
                className={`tab-button ${activeTab === "preview" ? "active" : ""}`}
                onClick={() => setActiveTab("preview")}
              >
                Preview
              </button>
            </div>
            <div className="tab-content">
              {activeTab === "editor" ? renderEditor() : renderPreview()}
            </div>
          </>
        ) : (
          <>
            <div className={`editor-pane ${!previewVisible ? "full-width" : ""}`}>
              {renderEditor()}
            </div>
            {previewVisible && (
              <div className="preview-pane">
                {renderPreview()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default withStreamlitConnection(MarkdownEditor);
