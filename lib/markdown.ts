import { marked } from 'marked';
import { logger } from './logger';

/**
 * Configure marked with basic settings for security and simplicity
 */
marked.setOptions({
  breaks: true, // Convert \n to <br>
});

/**
 * Escape HTML entities to prevent XSS attacks
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
      // Escape the alt attribute to prevent XSS
      return `<img src="${src}" alt="${escapeHtml(alt)}" class="birthday-card-image" />`;
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

    // Remove potentially dangerous tags and attributes
    const sanitized = withSafeImages
      // Remove links
      .replace(/<a\b[^>]*>/gi, '')
      .replace(/<\/a>/gi, '')
      // Remove tables
      .replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, '')
      // Remove script tags and their contents
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove style tags and their contents
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove iframe, object, embed tags
      .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '')
      // Remove event handler attributes (onclick, onerror, onload, etc.)
      .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')
      // Remove javascript: protocol
      .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
      .replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');

    return sanitized;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error parsing markdown:', message);
    // Fallback to escaped plain text if parsing fails to prevent XSS
    return escapeHtml(markdown);
  }
}
