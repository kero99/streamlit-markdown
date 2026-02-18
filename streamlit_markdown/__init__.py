"""
Streamlit Markdown Editor Component

A markdown editor with live preview, dark theme support, and image paste capabilities.
Designed for Streamlit applications.
"""

import os
import json
import base64
import hashlib
import logging
from pathlib import Path
from typing import Optional, List, Union
import streamlit.components.v1 as components

logger = logging.getLogger(__name__)

# --- Per-key caches to avoid redundant work across reruns ---
# Fix 1: Cache base64 conversion results so images aren't re-read from disk every render
_image_conversion_cache: dict = {}  # key -> (value_hash, converted_value)
# Fix 2: Track last-sent defaultValue so we skip re-transmitting unchanged content
_last_sent_default: dict = {}  # key -> value_hash

_RELEASE = True

if not _RELEASE:
    _st_markdown = components.declare_component(
        "streamlit_markdown", 
        url="http://localhost:3001"
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    if not os.path.isdir(build_dir):
        raise FileNotFoundError(
            "streamlit_markdown frontend build not found. "
            "If you installed from source, build the frontend and reinstall, "
            "or install a release that includes the build artifacts."
        )
    _st_markdown = components.declare_component("streamlit_markdown", path=build_dir)


# Default toolbar configuration for markdown editing
DEFAULT_TOOLBAR = [
    "bold", "italic", "strikethrough",
    "|",
    "heading1", "heading2", "heading3",
    "|",
    "unordered-list", "ordered-list", "checklist",
    "|",
    "code", "code-block",
    "|",
    "link", "image",
    "|",
    "quote", "horizontal-rule",
    "|",
    "undo", "redo",
    "|",
    "preview-toggle"
]


def st_markdown(
    value: str = "",
    placeholder: str = "Write your markdown here...",
    height: int = 400,
    theme: str = "auto",
    toolbar: Optional[List[str]] = None,
    preview: bool = True,
    preview_position: str = "right",
    image_upload_path: Optional[str] = None,
    readonly: bool = False,
    debounce_ms: int = 800,
    max_content_size: Optional[int] = 200_000,
    key: Optional[str] = None
) -> dict:
    """
    Streamlit Markdown Editor with live preview.

    Parameters
    ----------
    value : str
        The initial markdown content when the editor first renders.
    placeholder : str
        Placeholder text shown when the editor is empty.
    height : int
        Height of the editor in pixels. Default: 400.
    theme : str
        Color theme: "light", "dark", or "auto" (follows Streamlit theme).
        Default: "auto".
    toolbar : list or None
        List of toolbar buttons to display. Use "|" for separator.
        Available buttons:
        - Text: "bold", "italic", "strikethrough"
        - Headings: "heading1", "heading2", "heading3"
        - Lists: "unordered-list", "ordered-list", "checklist"
        - Code: "code", "code-block"
        - Insert: "link", "image"
        - Block: "quote", "horizontal-rule"
        - Actions: "undo", "redo", "preview-toggle"
        Default: Full toolbar.
    preview : bool
        Whether to show live preview. Default: True.
    preview_position : str
        Position of preview panel: "right", "bottom", or "tab".
        Default: "right".
    image_upload_path : str or None
        Local folder path to store pasted/dropped images.
        If None, images are embedded as base64 in markdown.
    readonly : bool
        Make the editor read-only. Default: False.
    debounce_ms : int
        Debounce delay in milliseconds for value updates. Default: 800.
        Higher values reduce reruns and improve performance for large documents.
    max_content_size : int or None
        Maximum content size in bytes before a warning is logged.
        Set to None to disable the check. Default: 200,000 (~200KB).
    key : str or None
        Unique key for this component instance.

    Returns
    -------
    dict
        Dictionary containing:
        - "content": str - The current markdown content
        - "images": list - List of image upload requests (if any)
    """
    if toolbar is None:
        toolbar = DEFAULT_TOOLBAR.copy()

    # --- Fix 5: Warn if content is very large ---
    if max_content_size and value and len(value.encode("utf-8")) > max_content_size:
        logger.warning(
            "streamlit-markdown: content size (%d bytes) exceeds max_content_size "
            "(%d bytes). Large documents with embedded images may cause performance "
            "issues or WebSocket errors.",
            len(value.encode("utf-8")),
            max_content_size,
        )

    # --- Fix 1: Cache the base64 conversion result per key ---
    cache_key = key or "__default__"
    value_hash = hashlib.md5((value or "").encode("utf-8")).hexdigest()

    cached = _image_conversion_cache.get(cache_key)
    if cached and cached[0] == value_hash:
        preview_value = cached[1]
    else:
        preview_value = _convert_images_to_base64(value) if value else value
        _image_conversion_cache[cache_key] = (value_hash, preview_value)

    # --- Fix 2: Only send defaultValue when it genuinely changes ---
    last_hash = _last_sent_default.get(cache_key)
    if last_hash == value_hash:
        # Content hasn't changed from Python side — don't re-transmit
        send_default = None
    else:
        send_default = preview_value
        _last_sent_default[cache_key] = value_hash

    # Prepare component args
    component_args = {
        "defaultValue": send_default,
        "placeholder": placeholder,
        "height": height,
        "theme": theme,
        "toolbar": toolbar,
        "preview": preview,
        "previewPosition": preview_position,
        "readonly": readonly,
        "debounceMs": debounce_ms,
        "imageUploadEnabled": image_upload_path is not None,
    }

    # Get component value
    component_value = _st_markdown(
        **component_args,
        key=key,
        default={"content": preview_value, "images": []}
    )

    # Handle image uploads if path is specified
    if image_upload_path and component_value and component_value.get("images"):
        updated_content = component_value.get("content", "")
        
        for image_data in component_value.get("images", []):
            if image_data.get("data") and image_data.get("placeholder"):
                # Save image and get path
                saved_path = _save_image(
                    image_data["data"],
                    image_upload_path,
                    image_data.get("filename", "image.png")
                )
                # Replace placeholder with actual path in content
                if saved_path:
                    updated_content = updated_content.replace(
                        image_data["placeholder"],
                        saved_path
                    )
        
        return {"content": updated_content, "images": []}

    return component_value if component_value else {"content": value, "images": []}


def _save_image(base64_data: str, upload_path: str, filename: str) -> Optional[str]:
    """
    Save a base64 encoded image to the specified path.
    
    Parameters
    ----------
    base64_data : str
        Base64 encoded image data (with or without data URI prefix).
    upload_path : str
        Directory path to save the image.
    filename : str
        Suggested filename for the image.
    
    Returns
    -------
    str or None
        Relative path to the saved image, or None if save failed.
    """
    try:
        # Remove data URI prefix if present
        if "," in base64_data:
            base64_data = base64_data.split(",", 1)[1]
        
        # Decode image data
        image_bytes = base64.b64decode(base64_data)
        
        # Generate unique filename using hash
        content_hash = hashlib.md5(image_bytes).hexdigest()[:8]
        
        # Get file extension from original filename
        ext = Path(filename).suffix if filename else ".png"
        if not ext:
            ext = ".png"
        
        # Create unique filename
        unique_filename = f"img_{content_hash}{ext}"
        
        # Ensure upload directory exists
        upload_dir = Path(upload_path)
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Save file
        file_path = upload_dir / unique_filename
        file_path.write_bytes(image_bytes)
        
        # Return relative path for markdown
        return str(file_path)
        
    except Exception as e:
        print(f"Error saving image: {e}")
        return None


import re
import mimetypes

def _convert_images_to_base64(content: str) -> str:
    """
    Convert local image paths in markdown to base64 data URLs for preview.
    
    Parameters
    ----------
    content : str
        Markdown content that may contain local image paths.
    
    Returns
    -------
    str
        Markdown content with local images converted to base64.
    """
    if not content:
        return content
    
    # Pattern to match markdown images: ![alt](path)
    img_pattern = r'!\[([^\]]*)\]\(([^)]+)\)'
    
    def replace_with_base64(match):
        alt_text = match.group(1)
        img_path = match.group(2)
        
        # Skip if already a data URL or http URL
        if img_path.startswith('data:') or img_path.startswith('http://') or img_path.startswith('https://'):
            return match.group(0)
        
        # Try to read the local file
        try:
            path = Path(img_path)
            if path.exists() and path.is_file():
                # Read and encode to base64
                image_bytes = path.read_bytes()
                base64_data = base64.b64encode(image_bytes).decode('utf-8')
                
                # Determine MIME type
                mime_type, _ = mimetypes.guess_type(str(path))
                if not mime_type:
                    mime_type = 'image/png'
                
                # Return markdown with base64 data URL
                return f'![{alt_text}](data:{mime_type};base64,{base64_data})'
        except Exception:
            pass
        
        # Return original if file not found or error
        return match.group(0)
    
    return re.sub(img_pattern, replace_with_base64, content)


def get_markdown_content(result: Union[dict, str, None]) -> str:
    """
    Helper function to extract markdown content from st_markdown result.
    
    Parameters
    ----------
    result : dict, str, or None
        The return value from st_markdown()
    
    Returns
    -------
    str
        The markdown content string.
    """
    if result is None:
        return ""
    if isinstance(result, str):
        return result
    if isinstance(result, dict):
        return result.get("content", "")
    return ""
