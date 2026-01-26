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

## Installation

```bash
pip install streamlit-markdown
```

## Quick Start

```python
import streamlit as st
from streamlit_markdown import st_markdown

# Basic usage
content = st_markdown(
    value="# Hello World\n\nStart writing...",
    height=400
)

st.write("You wrote:", content.get("content", ""))
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

### Image Upload

```python
content = st_markdown(
    value="",
    image_upload_path="./assets/images/"
)
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
    "images": list   # Pending image uploads
}
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

## Image Handler

For advanced image management:

```python
from streamlit_markdown import ImageHandler

handler = ImageHandler("./assets", subfolder="my-doc")

# Save image
path = handler.save_base64_image(base64_data)

# Clean up orphaned images
orphaned = handler.cleanup_orphaned_images(markdown_content)
```

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

## License

MIT License

## Credits

Built with:
- [Streamlit](https://streamlit.io/)
- [CodeMirror 6](https://codemirror.net/)
- [React Markdown](https://github.com/remarkjs/react-markdown)
