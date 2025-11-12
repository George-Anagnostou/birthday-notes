import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/storage';

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
    console.log('🔧 Manually initializing database...');
    await initializeDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
    });
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
      { status: 500 }
    );
  }
}
