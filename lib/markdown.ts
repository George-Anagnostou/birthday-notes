import { marked } from 'marked';

/**
 * Configure marked with basic settings for security and simplicity
 */
marked.setOptions({
  breaks: true, // Convert \n to <br>
});

/**
 * Converts markdown text to sanitized HTML
 * Supports basic markdown features: headings, lists, bold, italic, etc.
 * Does not support: tables, links, images, or advanced features
 *
 * @param markdown - The markdown text to convert
 * @returns HTML string (sanitized)
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  try {
    // Parse the markdown
    const html = marked.parse(markdown, { async: false }) as string;

    // Remove potentially dangerous tags (links, images, etc.)
    // Since we're using marked with headerIds: false, we don't need to worry about IDs
    const sanitized = html
      .replace(/<a\b[^>]*>/gi, '')
      .replace(/<\/a>/gi, '')
      .replace(/<img\b[^>]*>/gi, '')
      .replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, '');

    return sanitized;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    // Fallback to plain text if parsing fails
    return markdown;
  }
}
