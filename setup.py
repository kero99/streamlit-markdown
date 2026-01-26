"""
Streamlit Markdown Editor
=========================

A markdown editor component for Streamlit with:
- Live preview
- Dark theme support
- Image paste/drop capabilities
- Custom toolbar
- Local image storage

Installation
------------
    pip install streamlit-markdown

Usage
-----
    from streamlit_markdown import st_markdown

    content = st_markdown(
        value="# Hello World",
        theme="dark",
        height=500
    )
"""

from pathlib import Path
import setuptools

# Read README for long description
readme_path = Path(__file__).parent / "README.md"
long_description = readme_path.read_text(encoding="utf-8") if readme_path.exists() else ""

setuptools.setup(
    name="streamlit-markdown",
    version="1.0.0",
    author="Jungl3 SoC",
    author_email="",
    description="Markdown editor with live preview for Streamlit",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/jungl3-soc/streamlit-markdown",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[
        "Development Status :: 4 - Beta",
        "Environment :: Web Environment",
        "Framework :: Streamlit",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Text Editors",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=[
        "streamlit >= 1.0.0",
    ],
    package_data={
        "streamlit_markdown": [
            "frontend/build/**/*",
        ],
    },
)
