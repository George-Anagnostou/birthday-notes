import { NextRequest, NextResponse } from 'next/server';
import { getEnvironmentInfo } from '@/lib/db-config';
import { logger } from '@/lib/logger';

/**
 * Health check endpoint to verify environment configuration
 * Useful for debugging production issues
 */
export async function GET(request: NextRequest) {
  try {
    const envInfo = getEnvironmentInfo();

    // Check for admin password in request (optional security)
    const adminPassword = request.headers.get('x-admin-password');
    const isAdmin = adminPassword === process.env.ADMIN_PASSWORD;

    // Basic health info (always available)
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envInfo.environment,
    };

    // Detailed info (only with admin password)
    if (isAdmin) {
      return NextResponse.json({
        ...health,
        config: {
          postgres: envInfo.postgresUrl,
          blob: envInfo.blobToken,
          cloudPrint: envInfo.cloudPrintUrl,
          recipientId: process.env.RECIPIENT_ID || '❌ Not configured',
          recipientName: process.env.RECIPIENT_NAME || '❌ Not configured',
          accessCode: process.env.ACCESS_CODE ? '✅ Configured' : '❌ Not configured',
          adminPassword: process.env.ADMIN_PASSWORD ? '✅ Configured' : '❌ Not configured',
          nodeEnv: process.env.NODE_ENV,
        },
      });
    }

    // Public health check (minimal info)
    return NextResponse.json(health);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Health check failed:', message);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
      },
      { status: 500 }
    );
  }
}
