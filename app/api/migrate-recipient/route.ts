import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { getPostgresUrl } from '@/lib/db-config';
import { logger } from '@/lib/logger';
import { timingSafeEqual, isValidCredential } from '@/lib/auth-utils';

/**
 * POST /api/migrate-recipient
 *
 * Adds recipient_id column to existing notes table
 * This is a one-time migration for existing deployments
 *
 * Requires admin password for authorization
 */
export async function POST(request: NextRequest) {
  try {
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

    const connectionString = getPostgresUrl();
    if (!connectionString) {
      throw new Error('Database connection string not configured');
    }

    const sql = postgres(connectionString);

    try {
      // Add recipient_id column if it doesn't exist
      await sql`
        ALTER TABLE notes
        ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(100) NOT NULL DEFAULT 'default'
      `;

      // Create index for recipient queries
      await sql`
        CREATE INDEX IF NOT EXISTS idx_notes_recipient
        ON notes(recipient_id, timestamp DESC)
      `;

      logger.info('Migration completed: recipient_id column added');

      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully',
      });
    } finally {
      await sql.end();
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Migration error:', message);

    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: message,
      },
      { status: 500 }
    );
  }
}
