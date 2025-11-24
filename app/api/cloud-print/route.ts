import { NextRequest, NextResponse } from 'next/server';
import { readNotes } from '@/lib/storage';
import { buildCloudPrintRequest, sendCloudPrintRequest } from '@/lib/cloud-print';
import { getCloudPrintUrl } from '@/lib/db-config';
import { logger } from '@/lib/logger';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const CLOUD_PRINT_API_KEY = process.env.CLOUD_PRINT_API_KEY;
const CLOUD_PRINT_API_SECRET = process.env.CLOUD_PRINT_API_SECRET;
const BIRTHDAY_NAME = process.env.BIRTHDAY_NAME;

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
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const adminPassword = request.headers.get('x-admin-password');
  if (adminPassword !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get environment-aware cloud print service URL
  const cloudPrintServiceUrl = getCloudPrintUrl();

  logger.info(`📤 Cloud print request to: ${cloudPrintServiceUrl}`);

  // Check if cloud print service URL is configured
  if (!cloudPrintServiceUrl) {
    return NextResponse.json(
      { error: 'Cloud print service URL not configured. Please set CLOUD_PRINT_SERVICE_URL or CLOUD_PRINT_SERVICE_URL_DEV environment variable.' },
      { status: 500 }
    );
  }

  // Validate URL format
  if (!cloudPrintServiceUrl.startsWith('http://') && !cloudPrintServiceUrl.startsWith('https://')) {
    return NextResponse.json(
      { error: `Invalid cloud print service URL: "${cloudPrintServiceUrl}". URL must start with http:// or https://` },
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
      birthdayName: BIRTHDAY_NAME,
    });

    // Send request to cloud printing service
    const response = await sendCloudPrintRequest(
      cloudPrintRequest,
      cloudPrintServiceUrl,
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

  } catch (error) {
    logger.error('Cloud print error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process cloud print request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cloud-print
 *
 * Returns configuration info about cloud printing service
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const adminPassword = request.headers.get('x-admin-password');
  if (adminPassword !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const cloudPrintServiceUrl = getCloudPrintUrl();

  return NextResponse.json({
    configured: !!cloudPrintServiceUrl,
    serviceUrl: cloudPrintServiceUrl ? '[CONFIGURED]' : null,
    status: cloudPrintServiceUrl ? 'ready' : 'not configured',
  });
}
