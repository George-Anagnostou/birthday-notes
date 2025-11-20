import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const correctCode = process.env.ACCESS_CODE;

    if (!correctCode) {
      logger.error('ACCESS_CODE environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (code === correctCode) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false }, { status: 401 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error verifying access:', message);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
