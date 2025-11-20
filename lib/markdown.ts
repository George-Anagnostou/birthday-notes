import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from './logger';

/**
 * Configure marked with basic settings for security and simplicity
 */
marked.setOptions({
  breaks: true, // Convert \n to <br>
});

/**
 * Escape HTML entities to prevent XSS attacks
 * Used as fallback when markdown parsing fails
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

/**
 * Converts markdown text to sanitized HTML using DOMPurify
 *
 * Uses industry-standard DOMPurify library for comprehensive XSS protection.
 * Supports basic markdown features: headings, lists, bold, italic, images
 * Does not support: tables, links, or advanced features
 *
 * @param markdown - The markdown text to convert
 * @returns HTML string (sanitized with DOMPurify)
 *
 * @example
 * ```typescript
 * const html = renderMarkdown('**Hello** _world_!');
 * // Returns: '<p><strong>Hello</strong> <em>world</em>!</p>'
 * ```
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  try {
    // Parse the markdown to HTML
    const html = marked.parse(markdown, { async: false }) as string;

    // Sanitize with DOMPurify
    const sanitized = DOMPurify.sanitize(html, {
      // Allowed HTML tags
      ALLOWED_TAGS: [
        // Headings
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        // Paragraphs and line breaks
        'p', 'br',
        // Text formatting
        'strong', 'em', 'b', 'i', 'u', 'del', 'code', 'pre',
        // Lists
        'ul', 'ol', 'li',
        // Images (but not links or tables)
        'img',
        // Block quotes
        'blockquote',
        // Horizontal rules
        'hr',
      ],
      // Allowed attributes (very restrictive)
      ALLOWED_ATTR: [
        'src',   // For images
        'alt',   // For image alt text
        'class', // For styling
      ],
      // Additional security options
      ALLOW_DATA_ATTR: false,           // No data-* attributes
      ALLOW_UNKNOWN_PROTOCOLS: false,   // Only http(s), data: protocols
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|data):)/i, // Only http(s) and data: URIs
      KEEP_CONTENT: true,                // Keep content of removed tags
      RETURN_TRUSTED_TYPE: false,        // Return string, not TrustedHTML
    });

    // Add our custom class to images for consistent styling
    const withStyledImages = sanitized.replace(
      /<img\b/gi,
      '<img class="birthday-card-image"'
    );

    return withStyledImages;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error parsing markdown:', message);
    // Fallback to escaped plain text if parsing fails to prevent XSS
    return escapeHtml(markdown);
  }
}
