/**
 * Streamlit Markdown Editor - Entry Point
 */

import React from "react";
import ReactDOM from "react-dom/client";
import MarkdownEditor from "./MarkdownEditor";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <MarkdownEditor />
  </React.StrictMode>
);
