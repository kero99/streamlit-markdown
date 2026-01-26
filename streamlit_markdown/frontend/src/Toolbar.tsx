/**
 * Markdown Editor Toolbar Component
 * 
 * Provides formatting buttons for common markdown operations.
 */

import React, { useCallback } from "react";
import { ToolbarButton } from "./types";

interface ToolbarProps {
  config: ToolbarButton[];
  theme: "light" | "dark";
  editorRef: React.RefObject<any>;
  previewVisible: boolean;
  onTogglePreview: () => void;
  readonly: boolean;
}

// Toolbar button icons (using simple SVG icons)
const icons: Record<string, JSX.Element> = {
  bold: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M4 2h4.5a2.5 2.5 0 0 1 2.5 2.5v.5a2.5 2.5 0 0 1-1.17 2.12A2.5 2.5 0 0 1 11 9.5v.5A2.5 2.5 0 0 1 8.5 12.5H4V2zm2 2v2.5h2.5a.5.5 0 0 0 .5-.5v-1.5a.5.5 0 0 0-.5-.5H6zm0 4.5V10.5h2.5a.5.5 0 0 0 .5-.5V9a.5.5 0 0 0-.5-.5H6z"/>
    </svg>
  ),
  italic: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M6 2.75A.75.75 0 0 1 6.75 2h4.5a.75.75 0 0 1 0 1.5h-1.56l-1.88 9h1.44a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5h1.56l1.88-9H6.75A.75.75 0 0 1 6 2.75z"/>
    </svg>
  ),
  strikethrough: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M7.58 6.5c-.54-.24-.86-.5-.86-.96 0-.58.56-.96 1.35-.96.62 0 1.18.21 1.66.58a.75.75 0 1 0 .9-1.2A4.36 4.36 0 0 0 8.07 3c-1.67 0-2.85 1.03-2.85 2.54 0 .52.14.96.37 1.32H2.75a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H7.58zM8.5 9.86c.82.36 1.27.78 1.27 1.5 0 .72-.65 1.14-1.48 1.14-.76 0-1.43-.28-1.96-.77a.75.75 0 1 0-1.02 1.1A4.33 4.33 0 0 0 8.29 14c1.75 0 2.98-1.03 2.98-2.64 0-.67-.22-1.21-.55-1.64l-2.22.14z"/>
    </svg>
  ),
  heading1: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M3 2.75A.75.75 0 0 1 3.75 2h.5a.75.75 0 0 1 .75.75V7h6V2.75A.75.75 0 0 1 11.75 2h.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V8.5H5v4.75a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V2.75z"/>
    </svg>
  ),
  heading2: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M3 2.75A.75.75 0 0 1 3.75 2h.5a.75.75 0 0 1 .75.75V7h4V2.75A.75.75 0 0 1 9.75 2h.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V8.5H5v4.75a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V2.75z"/>
      <text x="12" y="13" fontSize="6" fontWeight="bold">2</text>
    </svg>
  ),
  heading3: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M3 2.75A.75.75 0 0 1 3.75 2h.5a.75.75 0 0 1 .75.75V7h4V2.75A.75.75 0 0 1 9.75 2h.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V8.5H5v4.75a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V2.75z"/>
      <text x="12" y="13" fontSize="6" fontWeight="bold">3</text>
    </svg>
  ),
  "unordered-list": (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M2 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3.75-1.5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5zm0 5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5zm0 5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5zM2 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
    </svg>
  ),
  "ordered-list": (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M2.003 2.5a.5.5 0 0 0-.723-.447l-1.003.5a.5.5 0 0 0 .446.895l.28-.14V6H.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-.497V2.5zM5.75 2.5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5zm0 5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5zm0 5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5zM.924 10.32l.003-.004a.851.851 0 0 1 .144-.153A.66.66 0 0 1 1.5 10c.195 0 .306.068.374.146a.57.57 0 0 1 .128.376c0 .453-.269.682-.8 1.078l-.035.025C.692 11.98 0 12.495 0 13.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 0-1H1.123c.07-.106.2-.232.436-.409l.144-.107c.49-.364 1.297-.966 1.297-1.984 0-.347-.1-.692-.328-.951C2.426 9.27 2.02 9 1.5 9c-.286 0-.54.058-.756.163a1.625 1.625 0 0 0-.456.31 1.343 1.343 0 0 0-.22.29l-.002.004a.5.5 0 0 0 .858.515z"/>
    </svg>
  ),
  checklist: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M2.5 1.75a.25.25 0 0 1 .25-.25h10.5a.25.25 0 0 1 .25.25v12.5a.25.25 0 0 1-.25.25H2.75a.25.25 0 0 1-.25-.25V1.75zM2.75 0A1.75 1.75 0 0 0 1 1.75v12.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 15 14.25V1.75A1.75 1.75 0 0 0 13.25 0H2.75zm9.03 5.28a.75.75 0 0 0-1.06-1.06L6.5 8.44 5.28 7.22a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0l4.75-4.75z"/>
    </svg>
  ),
  code: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M4.72 3.22a.75.75 0 0 1 1.06 1.06L2.06 8l3.72 3.72a.75.75 0 0 1-1.06 1.06L.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25zm6.56 0a.75.75 0 1 0-1.06 1.06L13.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06l4.25-4.25a.75.75 0 0 0 0-1.06l-4.25-4.25z"/>
    </svg>
  ),
  "code-block": (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25V1.75zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25H1.75zm4.47 3.97a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 1 1-1.06-1.06L7.69 8 6.22 6.53a.75.75 0 0 1 0-1.06zm-2.44 0a.75.75 0 0 1 0 1.06L2.31 8l1.47 1.47a.75.75 0 1 1-1.06 1.06l-2-2a.75.75 0 0 1 0-1.06l2-2a.75.75 0 0 1 1.06 0z"/>
    </svg>
  ),
  link: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25zm-.025 5.45a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 1 0 4.95 4.95l1.25-1.25z"/>
    </svg>
  ),
  image: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h.94a.76.76 0 0 1 .03-.03l6.077-6.078a1.75 1.75 0 0 1 2.412-.06L14.5 10.31V2.75a.25.25 0 0 0-.25-.25H1.75zm12.5 11H4.81l5.048-5.047a.25.25 0 0 1 .344-.009l4.298 3.889v.917a.25.25 0 0 1-.25.25zm1.75-.25V2.75A1.75 1.75 0 0 0 14.25 1H1.75A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25zM5.5 6a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zM7 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
    </svg>
  ),
  quote: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M1.75 2.5h12.5a.25.25 0 0 1 .25.25v10.5a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25V2.75a.25.25 0 0 1 .25-.25zM14.25 1H1.75A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25V2.75A1.75 1.75 0 0 0 14.25 1zM3.5 7.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75zm.75 3.75a.75.75 0 0 1 0-1.5h4.5a.75.75 0 0 1 0 1.5h-4.5z"/>
    </svg>
  ),
  "horizontal-rule": (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M0 7.75A.75.75 0 0 1 .75 7h14.5a.75.75 0 0 1 0 1.5H.75A.75.75 0 0 1 0 7.75z"/>
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M1.5 2.75a.75.75 0 0 1 1.5 0v2.94L5.53.97A.75.75 0 0 1 6.59 2.03L3.81 5.25H7a6 6 0 1 1 0 12H5.75a.75.75 0 0 1 0-1.5H7a4.5 4.5 0 1 0 0-9H3.56l2.78 3.22a.75.75 0 1 1-1.14.98L1.53 6.63a.75.75 0 0 1-.03-1V2.75z"/>
    </svg>
  ),
  redo: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M14.5 2.75a.75.75 0 0 0-1.5 0v2.94L10.47.97A.75.75 0 0 0 9.41 2.03l2.78 3.22H9a6 6 0 1 0 0 12h1.25a.75.75 0 0 0 0-1.5H9a4.5 4.5 0 1 1 0-9h3.44l-2.78 3.22a.75.75 0 1 0 1.14.98l3.67-4.25a.75.75 0 0 0 .03-1V2.75z"/>
    </svg>
  ),
  "preview-toggle": (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 0 1 0-1.798c.45-.678 1.367-1.932 2.637-3.023C4.33 2.992 6.019 2 8 2zM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717zM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10z"/>
    </svg>
  ),
};

// Toolbar button titles
const titles: Record<string, string> = {
  bold: "Bold (Ctrl+B)",
  italic: "Italic (Ctrl+I)",
  strikethrough: "Strikethrough",
  heading1: "Heading 1",
  heading2: "Heading 2",
  heading3: "Heading 3",
  "unordered-list": "Bullet List",
  "ordered-list": "Numbered List",
  checklist: "Task List",
  code: "Inline Code",
  "code-block": "Code Block",
  link: "Insert Link",
  image: "Insert Image",
  quote: "Blockquote",
  "horizontal-rule": "Horizontal Rule",
  undo: "Undo (Ctrl+Z)",
  redo: "Redo (Ctrl+Y)",
  "preview-toggle": "Toggle Preview",
};

// Markdown syntax for each button
const markdownSyntax: Record<string, { prefix: string; suffix: string; block?: boolean; placeholder?: string }> = {
  bold: { prefix: "**", suffix: "**", placeholder: "bold text" },
  italic: { prefix: "*", suffix: "*", placeholder: "italic text" },
  strikethrough: { prefix: "~~", suffix: "~~", placeholder: "strikethrough text" },
  heading1: { prefix: "# ", suffix: "", block: true, placeholder: "Heading 1" },
  heading2: { prefix: "## ", suffix: "", block: true, placeholder: "Heading 2" },
  heading3: { prefix: "### ", suffix: "", block: true, placeholder: "Heading 3" },
  "unordered-list": { prefix: "- ", suffix: "", block: true, placeholder: "List item" },
  "ordered-list": { prefix: "1. ", suffix: "", block: true, placeholder: "List item" },
  checklist: { prefix: "- [ ] ", suffix: "", block: true, placeholder: "Task item" },
  code: { prefix: "`", suffix: "`", placeholder: "code" },
  "code-block": { prefix: "```\n", suffix: "\n```", block: true, placeholder: "code" },
  link: { prefix: "[", suffix: "](url)", placeholder: "link text" },
  image: { prefix: "![", suffix: "](url)", placeholder: "alt text" },
  quote: { prefix: "> ", suffix: "", block: true, placeholder: "quote" },
  "horizontal-rule": { prefix: "\n---\n", suffix: "", block: true },
};

const Toolbar: React.FC<ToolbarProps> = ({
  config,
  theme,
  editorRef,
  previewVisible,
  onTogglePreview,
  readonly,
}) => {
  // Apply markdown formatting
  const applyFormatting = useCallback((action: ToolbarButton) => {
    if (readonly || !editorRef.current?.view) return;
    
    const view = editorRef.current.view;
    const { from, to } = view.state.selection.main;
    const selectedText = view.state.sliceDoc(from, to);
    const syntax = markdownSyntax[action];
    
    if (!syntax) return;
    
    let newText: string;
    let newCursorPos: number;
    
    if (selectedText) {
      // Wrap selected text
      newText = syntax.prefix + selectedText + syntax.suffix;
      newCursorPos = from + syntax.prefix.length + selectedText.length + syntax.suffix.length;
    } else {
      // Insert placeholder
      const placeholder = syntax.placeholder || "";
      newText = syntax.prefix + placeholder + syntax.suffix;
      newCursorPos = from + syntax.prefix.length + placeholder.length;
    }
    
    // For block-level syntax, ensure we're at line start
    if (syntax.block && from > 0) {
      const lineStart = view.state.doc.lineAt(from).from;
      if (from !== lineStart) {
        newText = "\n" + newText;
      }
    }
    
    view.dispatch({
      changes: { from, to, insert: newText },
      selection: { anchor: newCursorPos }
    });
    
    view.focus();
  }, [editorRef, readonly]);

  // Handle undo/redo
  const handleHistoryAction = useCallback((action: "undo" | "redo") => {
    if (readonly || !editorRef.current?.view) return;
    
    const view = editorRef.current.view;
    // Import and execute history commands
    if (action === "undo") {
      document.execCommand("undo");
    } else {
      document.execCommand("redo");
    }
    view.focus();
  }, [editorRef, readonly]);

  // Handle button click
  const handleClick = useCallback((action: ToolbarButton) => {
    if (action === "preview-toggle") {
      onTogglePreview();
    } else if (action === "undo" || action === "redo") {
      handleHistoryAction(action);
    } else {
      applyFormatting(action);
    }
  }, [applyFormatting, handleHistoryAction, onTogglePreview]);

  return (
    <div className="toolbar">
      {config.map((button, index) => {
        if (button === "|") {
          return <div key={`sep-${index}`} className="toolbar-separator" />;
        }
        
        const isActive = button === "preview-toggle" && previewVisible;
        
        return (
          <button
            key={button}
            className={`toolbar-button ${isActive ? "active" : ""}`}
            title={titles[button] || button}
            onClick={() => handleClick(button)}
            disabled={readonly && button !== "preview-toggle"}
          >
            {icons[button] || button}
          </button>
        );
      })}
    </div>
  );
};

// CSS for toolbar
const toolbarStyles = `
.toolbar {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  gap: 2px;
  flex-wrap: wrap;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s, color 0.15s;
}

.toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-button svg {
  width: 16px;
  height: 16px;
}

.toolbar-separator {
  width: 1px;
  height: 24px;
  margin: 0 4px;
}

.st-markdown-editor.light .toolbar-separator {
  background-color: #d0d7de;
}

.st-markdown-editor.dark .toolbar-separator {
  background-color: #30363d;
}
`;

// Inject styles
const styleElement = document.createElement("style");
styleElement.textContent = toolbarStyles;
document.head.appendChild(styleElement);

export default React.memo(Toolbar);
