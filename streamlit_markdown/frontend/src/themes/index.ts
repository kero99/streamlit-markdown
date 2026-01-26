/**
 * Theme definitions for Streamlit Markdown Editor
 */

import { EditorView } from "@codemirror/view";

/**
 * Light theme configuration
 */
export const lightTheme = EditorView.theme({
  "&": {
    backgroundColor: "#ffffff",
    color: "#24292f",
  },
  ".cm-content": {
    caretColor: "#24292f",
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  ".cm-cursor": {
    borderLeftColor: "#24292f",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "#b3d7ff",
  },
  ".cm-activeLine": {
    backgroundColor: "#f6f8fa",
  },
  ".cm-gutters": {
    backgroundColor: "#f6f8fa",
    color: "#8c959f",
    border: "none",
    borderRight: "1px solid #d0d7de",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#ebeef1",
  },
  // Markdown syntax highlighting
  ".cm-header": {
    color: "#0550ae",
    fontWeight: "bold",
  },
  ".cm-strong": {
    fontWeight: "bold",
    color: "#24292f",
  },
  ".cm-emphasis": {
    fontStyle: "italic",
    color: "#24292f",
  },
  ".cm-strikethrough": {
    textDecoration: "line-through",
  },
  ".cm-link": {
    color: "#0969da",
    textDecoration: "underline",
  },
  ".cm-url": {
    color: "#0969da",
  },
  ".cm-code": {
    backgroundColor: "#f6f8fa",
    color: "#cf222e",
    fontFamily: "'Fira Code', monospace",
  },
  ".cm-quote": {
    color: "#57606a",
    borderLeft: "4px solid #d0d7de",
    paddingLeft: "16px",
  },
}, { dark: false });

/**
 * Dark theme configuration
 */
export const darkTheme = EditorView.theme({
  "&": {
    backgroundColor: "#0d1117",
    color: "#c9d1d9",
  },
  ".cm-content": {
    caretColor: "#c9d1d9",
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  ".cm-cursor": {
    borderLeftColor: "#c9d1d9",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "#264f78",
  },
  ".cm-activeLine": {
    backgroundColor: "#161b22",
  },
  ".cm-gutters": {
    backgroundColor: "#0d1117",
    color: "#484f58",
    border: "none",
    borderRight: "1px solid #21262d",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#161b22",
  },
  // Markdown syntax highlighting
  ".cm-header": {
    color: "#58a6ff",
    fontWeight: "bold",
  },
  ".cm-strong": {
    fontWeight: "bold",
    color: "#c9d1d9",
  },
  ".cm-emphasis": {
    fontStyle: "italic",
    color: "#c9d1d9",
  },
  ".cm-strikethrough": {
    textDecoration: "line-through",
  },
  ".cm-link": {
    color: "#58a6ff",
    textDecoration: "underline",
  },
  ".cm-url": {
    color: "#58a6ff",
  },
  ".cm-code": {
    backgroundColor: "#161b22",
    color: "#ff7b72",
    fontFamily: "'Fira Code', monospace",
  },
  ".cm-quote": {
    color: "#8b949e",
    borderLeft: "4px solid #30363d",
    paddingLeft: "16px",
  },
}, { dark: true });

/**
 * Get theme based on mode
 */
export const getTheme = (mode: "light" | "dark") => {
  return mode === "dark" ? darkTheme : lightTheme;
};

/**
 * CSS styles for the editor container
 */
export const containerStyles = {
  light: {
    container: {
      backgroundColor: "#ffffff",
      border: "1px solid #d0d7de",
      borderRadius: "6px",
    },
    toolbar: {
      backgroundColor: "#f6f8fa",
      borderBottom: "1px solid #d0d7de",
    },
    toolbarButton: {
      color: "#57606a",
      hoverBackground: "#ebeef1",
    },
    preview: {
      backgroundColor: "#ffffff",
      borderLeft: "1px solid #d0d7de",
      color: "#24292f",
    },
    scrollbar: {
      track: "#f6f8fa",
      thumb: "#d0d7de",
    },
  },
  dark: {
    container: {
      backgroundColor: "#0d1117",
      border: "1px solid #30363d",
      borderRadius: "6px",
    },
    toolbar: {
      backgroundColor: "#161b22",
      borderBottom: "1px solid #30363d",
    },
    toolbarButton: {
      color: "#8b949e",
      hoverBackground: "#21262d",
    },
    preview: {
      backgroundColor: "#0d1117",
      borderLeft: "1px solid #30363d",
      color: "#c9d1d9",
    },
    scrollbar: {
      track: "#161b22",
      thumb: "#30363d",
    },
  },
};
