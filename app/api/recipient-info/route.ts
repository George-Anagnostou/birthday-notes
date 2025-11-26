import { NextResponse } from 'next/server';
import { getRecipientName } from '@/lib/recipient-config';

/**
 * GET /api/recipient-info
 *
 * Returns public information about the current recipient
 * This is used by the landing page to display the recipient's name
 */
export async function GET() {
  try {
    const recipientName = getRecipientName();

    return NextResponse.json({
      recipientName,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch recipient information', details: message },
      { status: 500 }
    );
  }
}
