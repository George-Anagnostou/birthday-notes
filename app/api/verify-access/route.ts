import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const correctCode = process.env.ACCESS_CODE || 'birthday2024';

    if (code === correctCode) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false }, { status: 401 });
    }
  } catch (error) {
    logger.error('Error verifying access:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
