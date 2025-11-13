import { Note } from '@/types/note';
import {
  CloudPrintRequest,
  CloudPrintCardData,
  PrintImage,
  CloudPrintMetadata,
} from '@/types/cloud-print';

/**
 * Generates a unique request ID
 */
export function generateRequestId(): string {
  return `print-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Formats a timestamp into a human-readable date string
 */
export function formatDateForPrint(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Converts image URLs to PrintImage format
 * By default uses URLs directly, but can be configured to fetch and encode as base64
 */
export async function prepareImages(
  imageUrls: string[] = [],
  encodeAsBase64: boolean = false
): Promise<PrintImage[]> {
  if (!encodeAsBase64) {
    // Return URLs as-is for the cloud service to fetch
    return imageUrls.map(url => ({
      source: url,
      type: 'url' as const,
      originalUrl: url,
    }));
  }

  // Fetch and encode images as base64
  const printImages: PrintImage[] = [];

  for (const url of imageUrls) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      printImages.push({
        source: base64,
        type: 'base64',
        originalUrl: url,
        mimeType: blob.type,
      });
    } catch (error) {
      console.error(`Failed to fetch image ${url}:`, error);
      // Fall back to URL if fetch fails
      printImages.push({
        source: url,
        type: 'url',
        originalUrl: url,
      });
    }
  }

  return printImages;
}

/**
 * Converts a Blob to base64 data URI
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a Note to CloudPrintCardData
 */
export async function noteToCardData(
  note: Note,
  encodeImages: boolean = false
): Promise<CloudPrintCardData> {
  const images = await prepareImages(note.images, encodeImages);
  const formattedDate = formatDateForPrint(note.timestamp);

  return {
    note,
    images,
    formattedDate,
    // renderedContent can be added later if needed for server-side rendering
  };
}

/**
 * Builds a complete cloud print request from notes
 */
export async function buildCloudPrintRequest(
  notes: Note[],
  options: {
    encodeImages?: boolean;
    requestedBy?: string;
  } = {}
): Promise<CloudPrintRequest> {
  const {
    encodeImages = false,
    requestedBy,
  } = options;

  // Convert notes to card data
  const cards = await Promise.all(
    notes.map(note => noteToCardData(note, encodeImages))
  );

  // Build metadata
  const metadata: CloudPrintMetadata = {
    requestId: generateRequestId(),
    requestedBy,
    requestedAt: Date.now(),
    totalCards: cards.length,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
  };

  return {
    cards,
    metadata,
  };
}

/**
 * Sends a print request to the cloud printing service
 * Returns the response containing the PDF as binary data
 */
export async function sendCloudPrintRequest(
  request: CloudPrintRequest,
  cloudPrintServiceUrl: string
): Promise<Response> {
  const response = await fetch(cloudPrintServiceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Try to get error message from response
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Cloud print service error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  // Verify we received a PDF
  const contentType = response.headers.get('content-type');
  if (contentType !== 'application/pdf') {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Expected PDF but received ${contentType}: ${errorText}`);
  }

  return response;
}
