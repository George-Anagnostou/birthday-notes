import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/storage';
import { logger } from '@/lib/logger';

/**
 * Debug endpoint to manually initialize the database
 * Only works in development mode for security
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Init endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    logger.info('🔧 Manually initializing database...');
    await initializeDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('❌ Error initializing database:', message);

    // Only include stack trace in development (double-check even though endpoint is dev-only)
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        success: false,
        error: message,
        // Only expose stack traces in development for debugging
        ...(isDevelopment && error instanceof Error && {
          details: error.stack || 'No stack trace available',
        }),
      },
      { status: 500 }
    );
  }
}
