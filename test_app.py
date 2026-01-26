"""
Test script for streamlit-markdown component
"""

import streamlit as st
from streamlit_markdown import st_markdown, get_markdown_content

st.set_page_config(
    page_title="Streamlit Markdown Test",
    page_icon="📝",
    layout="wide"
)

st.title("📝 Streamlit Markdown Editor Test")

# Theme selection
theme = st.sidebar.selectbox("Theme", ["auto", "light", "dark"])
preview_position = st.sidebar.selectbox("Preview Position", ["right", "bottom", "tab"])
show_preview = st.sidebar.checkbox("Show Preview", value=True)

# Initial content
initial_content = """# Welcome to Streamlit Markdown Editor

This is a **markdown editor** with live preview support.

## Features

- Bold text with **double asterisks**
- Italic text with *single asterisks*
- ~~Strikethrough~~ text

### Code Examples

Inline code: `print("Hello World")`

Code block:
```python
def greet(name):
    return f"Hello, {name}!"
```

### Lists

1. First item
2. Second item
3. Third item

- Bullet point
- Another bullet
  - Nested bullet

### Task List

- [x] Completed task
- [ ] Pending task
- [ ] Another pending task

### Blockquote

> This is a blockquote.
> It can span multiple lines.

### Links

[Visit GitHub](https://github.com)

### Table

| Name | Role |
|------|------|
| Alice | Developer |
| Bob | Designer |

---

Try pasting an image! 📷
"""

# Editor
st.subheader("Editor")
result = st_markdown(
    value=initial_content,
    placeholder="Start typing your markdown...",
    height=500,
    theme=theme,
    preview=show_preview,
    preview_position=preview_position,
    key="main_editor"
)

# Show result
st.subheader("Raw Content")
content = get_markdown_content(result)
st.code(content, language="markdown")

st.info(f"Content length: {len(content)} characters")
