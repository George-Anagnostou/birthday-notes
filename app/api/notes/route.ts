import { NextRequest, NextResponse } from 'next/server';
import { addNote, readNotes } from '@/lib/storage';
import { logger } from '@/lib/logger';

// POST - Add a new note
export async function POST(request: NextRequest) {
  try {
    const { name, message, accessCode, images } = await request.json();

    // Verify access code
    const correctCode = process.env.ACCESS_CODE;
    if (!correctCode) {
      logger.error('ACCESS_CODE environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    if (accessCode !== correctCode) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
    }

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

    const note = await addNote(name.trim(), message.trim(), imageUrls);
    return NextResponse.json({ success: true, note });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error adding note:', message);
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    );
  }
}

// GET - Retrieve all notes (requires admin password)
export async function GET(request: NextRequest) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctPassword) {
      logger.error('ADMIN_PASSWORD environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (adminPassword !== correctPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notes = await readNotes();
    return NextResponse.json({ notes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching notes:', message);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}
