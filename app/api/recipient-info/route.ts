import { NextResponse } from 'next/server';
import { getRecipientName, getRecipientId } from '@/lib/recipient-config';

/**
 * GET /api/recipient-info
 *
 * Returns public information about the current recipient
 * This is used by the landing page to display the recipient's name and theme
 */
export async function GET() {
  try {
    const recipientName = getRecipientName();
    const recipientId = getRecipientId();

    return NextResponse.json({
      recipientName,
      recipientId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch recipient information', details: message },
      { status: 500 }
    );
  }
}
