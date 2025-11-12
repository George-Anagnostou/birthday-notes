import { NextResponse } from 'next/server';
import { getEnvironmentInfo } from '@/lib/db-config';

/**
 * Debug endpoint to check environment configuration
 * Only works in development mode for security
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoint only available in development' },
      { status: 403 }
    );
  }

  const info = getEnvironmentInfo();

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    envVars: {
      POSTGRES_URL_DEV: process.env.POSTGRES_URL_DEV ? '✅ Set (length: ' + process.env.POSTGRES_URL_DEV.length + ')' : '❌ Not set',
      POSTGRES_URL: process.env.POSTGRES_URL ? '✅ Set (length: ' + process.env.POSTGRES_URL.length + ')' : '❌ Not set',
      BLOB_READ_WRITE_TOKEN_DEV: process.env.BLOB_READ_WRITE_TOKEN_DEV ? '✅ Set (length: ' + process.env.BLOB_READ_WRITE_TOKEN_DEV.length + ')' : '❌ Not set',
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? '✅ Set (length: ' + process.env.BLOB_READ_WRITE_TOKEN.length + ')' : '❌ Not set',
    },
    detectedConfig: info,
  });
}
