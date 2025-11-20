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
let isInitialized = false;

function getSQL() {
  if (!sql) {
    const connectionString = getPostgresUrl();
    if (!connectionString) {
      throw new Error('Database connection string not configured');
    }
    // Create postgres.js client (which @vercel/postgres uses under the hood)
    sql = postgres(connectionString);
  }
  return sql;
}

// Auto-initialize database on first access
async function ensureInitialized() {
  if (!isInitialized) {
    await initializeDatabase();
    isInitialized = true;
  }
}

// Read all notes from database
export async function readNotes(): Promise<Note[]> {
  try {
    await ensureInitialized();

    const sql = getSQL();
    const rows = await sql<(Note & { images: any })[]>`
      SELECT id, name, message, timestamp, images
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
  images: string[] = []
): Promise<Note> {
  const newNote: Note = {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name,
    message,
    timestamp: Date.now(),
    images,
  };

  try {
    await ensureInitialized();

    // Store images as JSON string for compatibility
    const imagesJson = JSON.stringify(newNote.images || []);

    const sql = getSQL();
    await sql`
      INSERT INTO notes (id, name, message, timestamp, images)
      VALUES (${newNote.id}, ${newNote.name}, ${newNote.message}, ${newNote.timestamp}, ${imagesJson}::jsonb)
    `;

    return newNote;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error adding note:', message);
    throw error;
  }
}

// Initialize database (create table if it doesn't exist)
export async function initializeDatabase(): Promise<void> {
  try {
    const sql = getSQL();

    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        images JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_notes_timestamp ON notes(timestamp DESC)
    `;

    logger.info('Database initialized successfully');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error initializing database:', message);
    throw error;
  }
}
