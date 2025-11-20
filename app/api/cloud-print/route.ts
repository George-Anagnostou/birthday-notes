import { NextRequest, NextResponse } from 'next/server';
import { readNotes } from '@/lib/storage';
import { buildCloudPrintRequest, sendCloudPrintRequest } from '@/lib/cloud-print';
import { logger } from '@/lib/logger';
import { timingSafeEqual, isValidCredential } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const CLOUD_PRINT_SERVICE_URL = process.env.CLOUD_PRINT_SERVICE_URL || '';
const CLOUD_PRINT_API_KEY = process.env.CLOUD_PRINT_API_KEY;
const CLOUD_PRINT_API_SECRET = process.env.CLOUD_PRINT_API_SECRET;

/**
 * POST /api/cloud-print
 *
 * Sends birthday notes to cloud printing service for PDF generation
 * PDFs are generated as 5x7 inch color cards with decorative elements
 *
 * Request body:
 * {
 *   noteIds?: string[];          // Optional: specific note IDs to print (if omitted, prints all)
 *   encodeImages?: boolean;      // Optional: whether to encode images as base64 (default: false)
 * }
 *
 * Headers:
 * - x-admin-password: Admin password for authentication
 */
export const POST = withRateLimit(async (request: NextRequest) => {
  // Verify admin authentication
  const adminPassword = request.headers.get('x-admin-password');
  const correctPassword = process.env.ADMIN_PASSWORD;

  if (!correctPassword || !isValidCredential(correctPassword, 8)) {
    logger.error('ADMIN_PASSWORD environment variable is not set or invalid');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (!adminPassword || !timingSafeEqual(adminPassword, correctPassword)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check if cloud print service URL is configured
  if (!CLOUD_PRINT_SERVICE_URL) {
    return NextResponse.json(
      { error: 'Cloud print service URL not configured. Please set CLOUD_PRINT_SERVICE_URL environment variable.' },
      { status: 500 }
    );
  }

  // Validate URL format
  if (!CLOUD_PRINT_SERVICE_URL.startsWith('http://') && !CLOUD_PRINT_SERVICE_URL.startsWith('https://')) {
    return NextResponse.json(
      { error: `Invalid CLOUD_PRINT_SERVICE_URL: "${CLOUD_PRINT_SERVICE_URL}". URL must start with http:// or https://` },
      { status: 500 }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const {
      noteIds,
      encodeImages = false,
    } = body;

    // Fetch all notes from database
    const allNotes = await readNotes();

    // Filter notes if specific IDs were provided
    const notesToPrint = noteIds
      ? allNotes.filter(note => noteIds.includes(note.id))
      : allNotes;

    if (notesToPrint.length === 0) {
      return NextResponse.json(
        { error: 'No notes found to print' },
        { status: 400 }
      );
    }

    // Build cloud print request
    const cloudPrintRequest = await buildCloudPrintRequest(notesToPrint, {
      encodeImages,
      requestedBy: 'admin', // Could be enhanced to include actual admin user info
    });

    // Send request to cloud printing service
    const response = await sendCloudPrintRequest(
      cloudPrintRequest,
      CLOUD_PRINT_SERVICE_URL,
      CLOUD_PRINT_API_KEY,
      CLOUD_PRINT_API_SECRET
    );

    // Get the PDF binary data
    const pdfBlob = await response.blob();
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Get processing time from upstream service if available
    const processingTime = response.headers.get('X-Processing-Time-Ms');

    // Generate filename
    const filename = `birthday-cards-${cloudPrintRequest.metadata.requestId}.pdf`;

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...(processingTime && { 'X-Processing-Time-Ms': processingTime }),
        'X-Cards-Processed': notesToPrint.length.toString(),
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Cloud print error:', message);

    // Only expose error details in development
    const isDevelopment = process.env.NODE_ENV !== 'production';

    return NextResponse.json(
      {
        error: 'Failed to process cloud print request',
        ...(isDevelopment && { details: message }),
      },
      { status: 500 }
    );
  }
}, 'CLOUD_PRINT');

/**
 * GET /api/cloud-print
 *
 * Returns configuration info about cloud printing service
 */
export const GET = withRateLimit(async (request: NextRequest) => {
  // Verify admin authentication
  const adminPassword = request.headers.get('x-admin-password');
  const correctPassword = process.env.ADMIN_PASSWORD;

  if (!correctPassword || !isValidCredential(correctPassword, 8)) {
    logger.error('ADMIN_PASSWORD environment variable is not set or invalid');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (!adminPassword || !timingSafeEqual(adminPassword, correctPassword)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    configured: !!CLOUD_PRINT_SERVICE_URL,
    serviceUrl: CLOUD_PRINT_SERVICE_URL ? '[CONFIGURED]' : null,
    status: CLOUD_PRINT_SERVICE_URL ? 'ready' : 'not configured',
  });
}, 'CLOUD_PRINT_CONFIG');
