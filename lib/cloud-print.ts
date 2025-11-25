import crypto from 'crypto';
import { Note } from '@/types/note';
import {
  CloudPrintRequest,
  CloudPrintCardData,
  PrintImage,
  CloudPrintMetadata,
} from '@/types/cloud-print';
import { logger } from './logger';
import { fetchWithTimeout, FetchTimeoutError } from './fetch-utils';

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
      // Fetch image with 10-second timeout to prevent hanging
      const response = await fetchWithTimeout(url, {}, 10000);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      printImages.push({
        source: base64,
        type: 'base64',
        originalUrl: url,
        mimeType: blob.type,
      });
    } catch (error: unknown) {
      // Provide specific error message for timeouts vs other failures
      if (error instanceof FetchTimeoutError) {
        logger.error(`Image fetch timeout for ${url}: ${error.message}`);
      } else {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to fetch image ${url}:`, message);
      }
      // Fall back to URL if fetch fails or times out
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
    birthdayName?: string;
  } = {}
): Promise<CloudPrintRequest> {
  const {
    encodeImages = false,
    requestedBy,
    birthdayName,
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
    birthdayName,
  };
}

/**
 * Sends a print request to the cloud printing service
 * Returns the response containing the PDF as binary data
 */
export async function sendCloudPrintRequest(
  request: CloudPrintRequest,
  cloudPrintServiceUrl: string,
  apiKey?: string,
  apiSecret?: string
): Promise<Response> {
  const body = JSON.stringify(request);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add authentication headers if API key and secret are provided
  if (apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Extract the path from the URL for signature generation
    const url = new URL(cloudPrintServiceUrl);
    const path = url.pathname;

    // Generate HMAC signature
    const message = `${timestamp}.POST.${path}.${body}`;
    const signature = crypto.createHmac('sha256', apiSecret)
      .update(message)
      .digest('hex');

    headers['X-API-Key'] = apiKey;
    headers['X-Timestamp'] = timestamp;
    headers['X-Signature'] = signature;
  }

  // Fetch with 60-second timeout (PDF generation can be resource-intensive)
  const response = await fetchWithTimeout(
    cloudPrintServiceUrl,
    {
      method: 'POST',
      headers,
      body,
    },
    60000
  );

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
