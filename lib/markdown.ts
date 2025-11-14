import { marked } from 'marked';
import { logger } from './logger';

/**
 * Configure marked with basic settings for security and simplicity
 */
marked.setOptions({
  breaks: true, // Convert \n to <br>
});

/**
 * Sanitize image tags to only allow safe attributes
 */
function sanitizeImageTags(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (match) => {
    // Extract src and alt attributes only
    const srcMatch = match.match(/src=["']([^"']*)["']/i);
    const altMatch = match.match(/alt=["']([^"']*)["']/i);

    const src = srcMatch ? srcMatch[1] : '';
    const alt = altMatch ? altMatch[1] : '';

    // Only allow http(s) URLs and data URLs
    if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:'))) {
      return `<img src="${src}" alt="${alt}" class="birthday-card-image" />`;
    }

    // If invalid src, return empty string
    return '';
  });
}

/**
 * Converts markdown text to sanitized HTML
 * Supports basic markdown features: headings, lists, bold, italic, images
 * Does not support: tables, links, or advanced features
 *
 * @param markdown - The markdown text to convert
 * @returns HTML string (sanitized)
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  try {
    // Parse the markdown
    const html = marked.parse(markdown, { async: false }) as string;

    // Sanitize images (allow but restrict attributes)
    const withSafeImages = sanitizeImageTags(html);

    // Remove potentially dangerous tags (links, tables, etc.)
    const sanitized = withSafeImages
      .replace(/<a\b[^>]*>/gi, '')
      .replace(/<\/a>/gi, '')
      .replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, '');

    return sanitized;
  } catch (error) {
    logger.error('Error parsing markdown:', error);
    // Fallback to plain text if parsing fails
    return markdown;
  }
}
