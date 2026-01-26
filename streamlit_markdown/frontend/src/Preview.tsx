/**
 * Markdown Preview Component
 * 
 * Renders markdown content as HTML with syntax highlighting
 * and GitHub Flavored Markdown support.
 */

import React, { useMemo } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

// Import highlight.js styles
import "highlight.js/styles/github.css";
import "highlight.js/styles/github-dark.css";

interface PreviewProps {
  content: string;
  theme: "light" | "dark";
  height: number;
}

/**
 * Custom URL transform that allows data URLs (base64 images)
 * while still applying default security sanitization for other URLs
 */
const customUrlTransform = (url: string): string => {
  // Allow data URLs for embedded images
  if (url.startsWith("data:")) {
    return url;
  }
  // Use default transform for other URLs (applies security sanitization)
  return defaultUrlTransform(url);
};

const Preview: React.FC<PreviewProps> = ({ content, theme, height }) => {
  // Memoize markdown rendering for performance
  const renderedContent = useMemo(() => {
    if (!content || content.trim() === "") {
      return (
        <div className="preview-empty">
          Nothing to preview
        </div>
      );
    }

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        urlTransform={customUrlTransform}
        components={{
          // Custom link handling - open in new tab
          a: ({ node, children, href, ...props }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props}
            >
              {children}
            </a>
          ),
          // Custom checkbox for task lists
          input: ({ node, type, checked, ...props }) => {
            if (type === "checkbox") {
              return (
                <input 
                  type="checkbox" 
                  checked={checked} 
                  disabled 
                  {...props} 
                />
              );
            }
            return <input type={type} {...props} />;
          },
          // Custom code block styling
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !className;
            
            if (isInline) {
              return (
                <code className="inline-code" {...props}>
                  {children}
                </code>
              );
            }
            
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Custom image with loading and error handling
          img: ({ node, src, alt, ...props }) => {
            return (
              <img 
                src={src} 
                alt={alt || ""} 
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
                {...props}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }, [content]);

  return (
    <div 
      className={`preview-panel ${theme === "dark" ? "hljs-dark" : "hljs-light"}`}
      style={{ height: `${height}px`, overflowY: "auto" }}
    >
      {renderedContent}
    </div>
  );
};

export default React.memo(Preview);
