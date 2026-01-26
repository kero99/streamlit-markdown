"""
Image Handler for Streamlit Markdown Editor

Provides utilities for managing images in markdown content,
including storage, retrieval, and cleanup operations.
"""

import os
import re
import base64
import hashlib
import shutil
from pathlib import Path
from typing import List, Optional, Set, Tuple
from datetime import datetime


class ImageHandler:
    """
    Handles image storage and management for the markdown editor.
    
    This class provides methods for:
    - Saving images from base64 data
    - Extracting image references from markdown
    - Cleaning up orphaned images
    - Managing image storage paths
    
    Designed to be reusable across different projects.
    """
    
    # Regex pattern to find image references in markdown
    MARKDOWN_IMAGE_PATTERN = re.compile(r'!\[([^\]]*)\]\(([^)]+)\)')
    
    def __init__(self, base_path: str, subfolder: Optional[str] = None):
        """
        Initialize the ImageHandler.
        
        Parameters
        ----------
        base_path : str
            The base directory for storing images.
        subfolder : str, optional
            Optional subfolder within base_path (e.g., playbook ID).
        """
        self.base_path = Path(base_path)
        if subfolder:
            self.storage_path = self.base_path / str(subfolder)
        else:
            self.storage_path = self.base_path
        
        # Ensure storage directory exists
        self.storage_path.mkdir(parents=True, exist_ok=True)
    
    def save_image(
        self, 
        image_data: bytes, 
        filename: Optional[str] = None,
        extension: str = ".png"
    ) -> str:
        """
        Save image data to the storage path.
        
        Parameters
        ----------
        image_data : bytes
            Raw image bytes.
        filename : str, optional
            Custom filename. If not provided, generates from content hash.
        extension : str
            File extension. Default: ".png"
        
        Returns
        -------
        str
            Relative path to the saved image.
        """
        # Generate filename from content hash if not provided
        if not filename:
            content_hash = hashlib.md5(image_data).hexdigest()[:12]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"img_{timestamp}_{content_hash}{extension}"
        
        # Ensure correct extension
        filename_path = Path(filename)
        if not filename_path.suffix:
            filename = f"{filename}{extension}"
        
        # Save file
        file_path = self.storage_path / filename
        file_path.write_bytes(image_data)
        
        return str(file_path)
    
    def save_base64_image(
        self, 
        base64_data: str, 
        filename: Optional[str] = None
    ) -> Optional[str]:
        """
        Save a base64 encoded image.
        
        Parameters
        ----------
        base64_data : str
            Base64 encoded image data (with or without data URI prefix).
        filename : str, optional
            Custom filename.
        
        Returns
        -------
        str or None
            Path to saved image, or None if decoding failed.
        """
        try:
            # Extract MIME type and data from data URI
            extension = ".png"
            if base64_data.startswith("data:"):
                header, base64_data = base64_data.split(",", 1)
                # Extract extension from MIME type
                if "image/jpeg" in header or "image/jpg" in header:
                    extension = ".jpg"
                elif "image/gif" in header:
                    extension = ".gif"
                elif "image/webp" in header:
                    extension = ".webp"
                elif "image/svg" in header:
                    extension = ".svg"
            
            # Decode and save
            image_bytes = base64.b64decode(base64_data)
            return self.save_image(image_bytes, filename, extension)
            
        except Exception as e:
            print(f"Error saving base64 image: {e}")
            return None
    
    def get_image(self, path: str) -> Optional[bytes]:
        """
        Retrieve image data from storage.
        
        Parameters
        ----------
        path : str
            Path to the image file.
        
        Returns
        -------
        bytes or None
            Image data, or None if file not found.
        """
        try:
            file_path = Path(path)
            if file_path.exists():
                return file_path.read_bytes()
            
            # Try relative to storage path
            file_path = self.storage_path / path
            if file_path.exists():
                return file_path.read_bytes()
            
            return None
        except Exception as e:
            print(f"Error reading image: {e}")
            return None
    
    def get_image_as_base64(self, path: str) -> Optional[str]:
        """
        Get image as base64 data URI.
        
        Parameters
        ----------
        path : str
            Path to the image file.
        
        Returns
        -------
        str or None
            Base64 data URI, or None if file not found.
        """
        image_data = self.get_image(path)
        if image_data:
            extension = Path(path).suffix.lower()
            mime_types = {
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".gif": "image/gif",
                ".webp": "image/webp",
                ".svg": "image/svg+xml"
            }
            mime_type = mime_types.get(extension, "image/png")
            encoded = base64.b64encode(image_data).decode("utf-8")
            return f"data:{mime_type};base64,{encoded}"
        return None
    
    def extract_image_paths(self, markdown_content: str) -> Set[str]:
        """
        Extract all image paths referenced in markdown content.
        
        Parameters
        ----------
        markdown_content : str
            Markdown text content.
        
        Returns
        -------
        set
            Set of image paths found in the markdown.
        """
        matches = self.MARKDOWN_IMAGE_PATTERN.findall(markdown_content)
        return {path for _, path in matches if not path.startswith(("http://", "https://", "data:"))}
    
    def list_stored_images(self) -> List[str]:
        """
        List all images in the storage directory.
        
        Returns
        -------
        list
            List of image file paths.
        """
        image_extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
        images = []
        
        if self.storage_path.exists():
            for file in self.storage_path.iterdir():
                if file.is_file() and file.suffix.lower() in image_extensions:
                    images.append(str(file))
        
        return images
    
    def cleanup_orphaned_images(
        self, 
        markdown_content: str, 
        dry_run: bool = False
    ) -> List[str]:
        """
        Remove images not referenced in the markdown content.
        
        Parameters
        ----------
        markdown_content : str
            Current markdown content.
        dry_run : bool
            If True, only return list without deleting. Default: False.
        
        Returns
        -------
        list
            List of orphaned image paths (deleted or would be deleted).
        """
        # Get referenced images
        referenced = self.extract_image_paths(markdown_content)
        
        # Normalize paths for comparison
        referenced_normalized = set()
        for path in referenced:
            normalized = Path(path).resolve()
            referenced_normalized.add(str(normalized))
            # Also add just the filename for matching
            referenced_normalized.add(Path(path).name)
        
        # Find orphaned images
        orphaned = []
        for stored_image in self.list_stored_images():
            stored_path = Path(stored_image)
            # Check if stored image is referenced
            is_referenced = (
                str(stored_path.resolve()) in referenced_normalized or
                stored_path.name in referenced_normalized or
                stored_image in referenced
            )
            
            if not is_referenced:
                orphaned.append(stored_image)
                if not dry_run:
                    try:
                        stored_path.unlink()
                    except Exception as e:
                        print(f"Error deleting {stored_image}: {e}")
        
        return orphaned
    
    def delete_all_images(self) -> int:
        """
        Delete all images in the storage directory.
        
        Returns
        -------
        int
            Number of images deleted.
        """
        count = 0
        for image_path in self.list_stored_images():
            try:
                Path(image_path).unlink()
                count += 1
            except Exception as e:
                print(f"Error deleting {image_path}: {e}")
        return count
    
    def delete_storage(self) -> bool:
        """
        Delete the entire storage directory.
        
        Returns
        -------
        bool
            True if successful, False otherwise.
        """
        try:
            if self.storage_path.exists():
                shutil.rmtree(self.storage_path)
            return True
        except Exception as e:
            print(f"Error deleting storage directory: {e}")
            return False
    
    def copy_images_to(
        self, 
        markdown_content: str, 
        destination: str
    ) -> Tuple[str, int]:
        """
        Copy all referenced images to a new location and update paths.
        
        Parameters
        ----------
        markdown_content : str
            Markdown content with image references.
        destination : str
            Destination directory.
        
        Returns
        -------
        tuple
            (Updated markdown content, number of images copied)
        """
        dest_path = Path(destination)
        dest_path.mkdir(parents=True, exist_ok=True)
        
        count = 0
        updated_content = markdown_content
        
        for match in self.MARKDOWN_IMAGE_PATTERN.finditer(markdown_content):
            alt_text, image_path = match.groups()
            
            # Skip URLs and data URIs
            if image_path.startswith(("http://", "https://", "data:")):
                continue
            
            source_path = Path(image_path)
            if not source_path.exists():
                source_path = self.storage_path / Path(image_path).name
            
            if source_path.exists():
                # Copy to destination
                dest_file = dest_path / source_path.name
                shutil.copy2(source_path, dest_file)
                
                # Update path in content
                updated_content = updated_content.replace(
                    f"]({image_path})",
                    f"]({dest_file})"
                )
                count += 1
        
        return updated_content, count
