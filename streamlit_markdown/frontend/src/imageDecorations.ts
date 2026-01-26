/**
 * CodeMirror extension to collapse base64 image data URLs
 * Shows a friendly placeholder instead of long base64 strings
 */

import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

/**
 * Widget that displays a collapsed image placeholder
 */
class ImagePlaceholderWidget extends WidgetType {
  private filename: string;
  private isExpanded: boolean = false;

  constructor(filename: string) {
    super();
    this.filename = filename || "image";
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement("span");
    wrapper.className = "cm-image-placeholder";
    wrapper.title = "Click to expand/collapse base64 data";
    wrapper.innerHTML = `📷 <span class="cm-image-filename">[${this.filename}]</span>`;
    return wrapper;
  }

  eq(other: ImagePlaceholderWidget): boolean {
    return other.filename === this.filename;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

/**
 * Find all base64 image markdown patterns and create decorations
 */
function findBase64Images(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;
  const text = doc.toString();
  
  // Pattern: ![alt](data:image/...;base64,...)
  // We want to collapse just the base64 data part, keeping ![alt]( visible
  const pattern = /!\[([^\]]*)\]\((data:image\/[^;]+;base64,)([A-Za-z0-9+/=]+)\)/g;
  
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const altText = match[1];
    const dataPrefix = match[2]; // "data:image/png;base64,"
    const base64Data = match[3];
    
    // Only collapse if base64 is longer than 100 chars
    if (base64Data.length > 100) {
      // Calculate positions
      const startOfMatch = match.index;
      const startOfBase64 = startOfMatch + 2 + altText.length + 2 + dataPrefix.length; // ![alt](data:...;base64,
      const endOfBase64 = startOfBase64 + base64Data.length;
      
      // Get filename from alt text or use default
      const filename = altText || "image";
      
      // Create a replace decoration for the base64 data
      const decoration = Decoration.replace({
        widget: new ImagePlaceholderWidget(filename),
      });
      
      builder.add(startOfBase64, endOfBase64, decoration);
    }
  }
  
  return builder.finish();
}

/**
 * ViewPlugin that manages the decorations
 */
const imageDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = findBase64Images(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = findBase64Images(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * Theme for the image placeholder styling
 */
const imageDecorationTheme = EditorView.baseTheme({
  ".cm-image-placeholder": {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "sans-serif",
    cursor: "pointer",
    display: "inline-block",
    verticalAlign: "middle",
    userSelect: "none",
  },
  ".cm-image-filename": {
    fontWeight: "500",
  },
  // Dark theme variant
  "&.cm-focused .cm-image-placeholder:hover, .cm-image-placeholder:hover": {
    backgroundColor: "#2563eb",
  },
});

/**
 * Export the complete extension
 */
export const imageDecorations = [imageDecorationPlugin, imageDecorationTheme];
