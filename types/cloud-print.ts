import { Note } from './note';

/**
 * Image data that can be either a URL or base64-encoded
 */
export interface PrintImage {
  /** Image source - either URL or base64 data URI */
  source: string;

  /** Image type (url or base64) */
  type: 'url' | 'base64';

  /** Original URL if available */
  originalUrl?: string;

  /** MIME type of the image */
  mimeType?: string;
}

/**
 * Enhanced note data optimized for printing
 */
export interface CloudPrintCardData {
  /** Original note data */
  note: Note;

  /** Processed images ready for printing */
  images: PrintImage[];

  /** Formatted date string for display */
  formattedDate: string;

  /** Rendered HTML content (with markdown processed) */
  renderedContent?: string;
}

/**
 * Metadata about the print request
 */
export interface CloudPrintMetadata {
  /** Unique identifier for this print request */
  requestId: string;

  /** Who initiated the print request */
  requestedBy?: string;

  /** Timestamp when request was created */
  requestedAt: number;

  /** Total number of cards in this request */
  totalCards: number;

  /** Environment (dev/prod) */
  environment: 'development' | 'production';

  /** Application version or build info */
  appVersion?: string;
}

/**
 * Main request payload sent to cloud printing service
 *
 * Cards are generated as 5x7 inch portrait PDFs in color with decorative elements.
 * Physical printing options (paper type, copies) are handled by the printer, not the PDF service.
 *
 * The cloud service returns the PDF directly as binary data with Content-Type: application/pdf
 * rather than uploading to storage and returning URLs.
 */
export interface CloudPrintRequest {
  /** Array of birthday cards to generate as PDFs */
  cards: CloudPrintCardData[];

  /** Request metadata */
  metadata: CloudPrintMetadata;

  /** Name of the birthday person (optional) */
  birthdayName?: string;
}
