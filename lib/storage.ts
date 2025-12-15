import postgres from 'postgres';
import { Note } from '@/types/note';
import { getPostgresUrl, isDevelopment } from './db-config';
import { logger } from './logger';

/**
 * Storage layer using Vercel Postgres
 * This replaces the previous file-based storage which doesn't work on Vercel's serverless infrastructure
 *
 * Environment-aware: Automatically uses dev or prod database based on NODE_ENV
 */

// Lazy SQL client creation - only create when actually needed
let sql: ReturnType<typeof postgres> | null = null;
let initPromise: Promise<void> | null = null;

function getSQL() {
  if (!sql) {
    const connectionString = getPostgresUrl();
    if (!connectionString) {
      logger.error('Database connection string not configured', {
        nodeEnv: process.env.NODE_ENV,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasPostgresUrlDev: !!process.env.POSTGRES_URL_DEV
      });
      throw new Error('Database connection string not configured');
    }
    logger.info('Initializing database connection', {
      environment: isDevelopment() ? 'development' : 'production'
    });
    // Create postgres.js client (which @vercel/postgres uses under the hood)
    sql = postgres(connectionString);
  }
  return sql;
}

// Auto-initialize database on first access
// Uses promise-based singleton pattern to prevent race conditions
async function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeDatabase();
  }
  await initPromise;
}

// Read all notes from database (optionally filtered by recipient_id)
export async function readNotes(recipientId?: string): Promise<Note[]> {
  try {
    await ensureInitialized();

    const sql = getSQL();

    // If recipient_id is provided, filter by it; otherwise return all notes
    const rows = recipientId
      ? await sql<(Note & { images: any })[]>`
          SELECT id, name, message, timestamp, images, recipient_id
          FROM notes
          WHERE recipient_id = ${recipientId}
          ORDER BY timestamp DESC
        `
      : await sql<(Note & { images: any })[]>`
          SELECT id, name, message, timestamp, images, recipient_id
          FROM notes
          ORDER BY timestamp DESC
        `;

    // Parse images from JSON and ensure it's always an array
    // Also ensure timestamp is a number (Postgres BIGINT can be returned as string)
    return rows.map(row => {
      let parsedImages: string[] = [];

      if (row.images) {
        if (typeof row.images === 'string') {
          try {
            parsedImages = JSON.parse(row.images);
          } catch (error) {
            logger.error(`Failed to parse images JSON for note ${row.id}:`, error);
            parsedImages = [];
          }
        } else {
          parsedImages = row.images;
        }
      }

      return {
        ...row,
        timestamp: typeof row.timestamp === 'string' ? parseInt(row.timestamp, 10) : row.timestamp,
        images: parsedImages,
        recipient_id: row.recipient_id || 'default',
      };
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error reading notes:', message);
    // If table doesn't exist yet, return empty array
    return [];
  }
}

// Add a new note
export async function addNote(
  name: string,
  message: string,
  recipientId: string,
  images: string[] = []
): Promise<Note> {
  const newNote: Note = {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name,
    message,
    timestamp: Date.now(),
    images,
    recipient_id: recipientId,
  };

  try {
    await ensureInitialized();

    const sql = getSQL();
    await sql`
      INSERT INTO notes (id, name, message, timestamp, images, recipient_id)
      VALUES (${newNote.id}, ${newNote.name}, ${newNote.message}, ${newNote.timestamp}, ${sql.json(newNote.images || [])}, ${newNote.recipient_id})
    `;

    logger.info('Note saved successfully', { noteId: newNote.id, recipientId: newNote.recipient_id });
    return newNote;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error adding note:', {
      message,
      recipientId: newNote.recipient_id,
      imageCount: newNote.images?.length || 0
    });
    throw error;
  }
}

// Initialize database (create table if it doesn't exist)
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database schema...');
    const sql = getSQL();

    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        images JSONB DEFAULT '[]'::jsonb,
        recipient_id VARCHAR(100) NOT NULL DEFAULT 'default',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_notes_timestamp ON notes(timestamp DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_notes_recipient ON notes(recipient_id, timestamp DESC)
    `;

    logger.info('Database initialized successfully');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error initializing database:', message);
    throw error;
  }
}
