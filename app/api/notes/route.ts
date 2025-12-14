import { NextRequest, NextResponse } from 'next/server';
import { addNote, readNotes } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { timingSafeEqual, isValidCredential } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit-middleware';
import { getRecipientId } from '@/lib/recipient-config';

// POST - Add a new note
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    logger.info('📝 Note submission started');
    const body = await request.json();
    const { name, message, accessCode, images } = body;

    logger.debug('Request body received:', {
      hasName: !!name,
      hasMessage: !!message,
      hasAccessCode: !!accessCode,
      imageCount: images?.length || 0,
      messageLength: message?.length || 0
    });

    // Get recipient ID from environment
    let recipientId: string;
    try {
      recipientId = getRecipientId();
      logger.debug('Recipient ID retrieved:', recipientId);
    } catch (error) {
      logger.error('Failed to get recipient ID:', error);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify access code
    const correctCode = process.env.ACCESS_CODE;
    if (!correctCode || !isValidCredential(correctCode, 4)) {
      logger.error('ACCESS_CODE environment variable is not set or invalid');
      return NextResponse.json(
        { error: 'Server configuration error: ACCESS_CODE not configured' },
        { status: 500 }
      );
    }
    if (!accessCode || !timingSafeEqual(accessCode, correctCode)) {
      logger.warn('Invalid access code attempt');
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
    }
    logger.debug('Access code verified successfully');

    // Validate input
    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Name is too long (max 100 characters)' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    // Validate images array
    const imageUrls = images || [];
    if (!Array.isArray(imageUrls)) {
      return NextResponse.json(
        { error: 'Images must be an array' },
        { status: 400 }
      );
    }

    if (imageUrls.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 images allowed' },
        { status: 400 }
      );
    }

    logger.info('💾 Saving note to database...', {
      recipientId,
      nameLength: name.trim().length,
      messageLength: message.trim().length,
      imageCount: imageUrls.length
    });

    const note = await addNote(name.trim(), message.trim(), recipientId, imageUrls);

    logger.info('✅ Note saved successfully', { noteId: note.id });
    return NextResponse.json({ success: true, note });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('❌ Error adding note:', { message, stack });

    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to save note';
    if (message.includes('database') || message.includes('postgres') || message.includes('connection')) {
      errorMessage = 'Database connection error. Please try again.';
      logger.error('Database connection issue detected');
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}, 'NOTE_SUBMIT');

// GET - Retrieve all notes for current recipient (requires admin password)
export const GET = withRateLimit(async (request: NextRequest) => {
  try {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recipient ID from environment to filter notes
    let recipientId: string;
    try {
      recipientId = getRecipientId();
    } catch (error) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const notes = await readNotes(recipientId);
    return NextResponse.json({ notes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching notes:', message);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}, 'NOTE_VIEW');
