/**
 * TypeScript type definitions for Streamlit Markdown Editor
 */

import { ComponentProps } from "streamlit-component-lib";

/**
 * Toolbar button types
 */
export type ToolbarButton =
  | "bold"
  | "italic"
  | "strikethrough"
  | "heading1"
  | "heading2"
  | "heading3"
  | "unordered-list"
  | "ordered-list"
  | "checklist"
  | "code"
  | "code-block"
  | "link"
  | "image"
  | "quote"
  | "horizontal-rule"
  | "undo"
  | "redo"
  | "preview-toggle"
  | "|"; // Separator

/**
 * Theme options
 */
export type ThemeMode = "light" | "dark" | "auto";

/**
 * Preview position options
 */
export type PreviewPosition = "right" | "bottom" | "tab";

/**
 * Component arguments passed from Python
 */
export interface MarkdownEditorArgs {
  defaultValue: string | null;
  placeholder: string;
  height: number;
  theme: ThemeMode;
  toolbar: ToolbarButton[];
  preview: boolean;
  previewPosition: PreviewPosition;
  readonly: boolean;
  debounceMs: number;
  imageUploadEnabled: boolean;
}

/**
 * Props for the main editor component
 */
export interface MarkdownEditorProps extends ComponentProps {
  args: MarkdownEditorArgs;
}

/**
 * Image upload data structure
 */
export interface ImageUploadData {
  data: string;          // Base64 encoded image data
  filename: string;      // Original or generated filename
  placeholder: string;   // Placeholder text in markdown
  mimeType: string;      // MIME type of the image
}

/**
 * Component return value sent to Python
 */
export interface ComponentValue {
  content: string;
  images: ImageUploadData[];
}

/**
 * Toolbar action callback
 */
export type ToolbarAction = (
  view: any,  // CodeMirror EditorView
  action: ToolbarButton
) => void;

/**
 * Toolbar button configuration
 */
export interface ToolbarButtonConfig {
  id: ToolbarButton;
  icon: string;
  title: string;
  action?: (view: any) => void;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  background: string;
  foreground: string;
  caret: string;
  selection: string;
  lineHighlight: string;
  gutterBackground: string;
  gutterForeground: string;
  gutterBorder: string;
}
