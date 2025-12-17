import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getBlobToken, isDevelopment } from '@/lib/db-config';
import { logger } from '@/lib/logger';

/**
 * API route for uploading images to Vercel Blob
 * Accepts multipart/form-data with image files
 * Returns array of blob URLs
 *
 * Environment-aware: Automatically uses dev or prod blob storage based on NODE_ENV
 *
 * NOTE: Images are automatically compressed on the client to ~2MB before upload.
 * The 5MB limit here acts as a safety net for edge cases.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (safety net - client compresses to ~2MB)
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Map MIME types to safe file extensions
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export async function POST(request: NextRequest) {
  try {
    if (isDevelopment()) {
      logger.debug('📸 Uploading to DEV blob storage');
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    // Validate number of files
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 images allowed' },
        { status: 400 }
      );
    }

    // Get environment-specific blob token
    const blobToken = getBlobToken();

    // Debug logging to help diagnose production issues
    logger.info('🔍 Blob token check:', {
      hasToken: !!blobToken,
      tokenPrefix: blobToken ? blobToken.substring(0, 15) + '...' : 'none',
      environment: isDevelopment() ? 'development' : 'production',
      availableEnvVars: {
        BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
        BLOB_PROD_READ_WRITE_TOKEN: !!process.env.BLOB_PROD_READ_WRITE_TOKEN,
        BLOB_DEV_READ_WRITE_TOKEN: !!process.env.BLOB_DEV_READ_WRITE_TOKEN,
        BLOB_READ_WRITE_TOKEN_DEV: !!process.env.BLOB_READ_WRITE_TOKEN_DEV,
      }
    });

    if (!blobToken) {
      const envVar = isDevelopment() ? 'BLOB_READ_WRITE_TOKEN_DEV' : 'BLOB_READ_WRITE_TOKEN';
      return NextResponse.json(
        { error: `Blob storage not configured. Please set ${envVar} environment variable.` },
        { status: 500 }
      );
    }

    // Validate and upload each file
    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
          { status: 400 }
        );
      }

      // Validate file size (should rarely trigger due to client-side compression)
      if (file.size > MAX_FILE_SIZE) {
        logger.warn(`Unexpectedly large file received: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        return NextResponse.json(
          { error: `File too large: ${file.name}. Please try re-selecting the image.` },
          { status: 400 }
        );
      }

      // Generate unique filename with environment prefix
      // Use validated MIME type to determine extension (not user-supplied filename)
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 9);
      const extension = MIME_TO_EXTENSION[file.type] || 'jpg';
      const envPrefix = isDevelopment() ? 'dev' : 'prod';
      const filename = `birthday-photos/${envPrefix}/${timestamp}-${randomString}.${extension}`;

      // Upload to Vercel Blob with environment-specific token
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: false,
        token: blobToken,
      });

      uploadedUrls.push(blob.url);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Enhanced error logging for blob upload issues
    logger.error('Error uploading images:', {
      message,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      fullError: error,
    });

    return NextResponse.json(
      { error: 'Failed to upload images', details: message },
      { status: 500 }
    );
  }
}
