import { createPool, type VercelPool } from '@vercel/postgres';
import { Note } from '@/types/note';
import { getPostgresUrl, isDevelopment } from './db-config';

/**
 * Storage layer using Vercel Postgres
 * This replaces the previous file-based storage which doesn't work on Vercel's serverless infrastructure
 *
 * Environment-aware: Automatically uses dev or prod database based on NODE_ENV
 */

// Lazy pool creation - only create when actually needed
let pool: VercelPool | null = null;

function getPool(): VercelPool {
  if (!pool) {
    pool = createPool({
      connectionString: getPostgresUrl(),
    });
  }
  return pool;
}

// Helper to get SQL client
function getSQL() {
  return getPool().sql;
}

// Read all notes from database
export async function readNotes(): Promise<Note[]> {
  try {
    if (isDevelopment()) {
      console.log('📊 Reading from DEV database');
    }

    const sql = getSQL();
    const { rows } = await sql<Note & { images: any }>`
      SELECT id, name, message, timestamp, images
      FROM notes
      ORDER BY timestamp DESC
    `;

    // Parse images from JSON and ensure it's always an array
    return rows.map(row => ({
      ...row,
      images: row.images ? (typeof row.images === 'string' ? JSON.parse(row.images) : row.images) : [],
    }));
  } catch (error) {
    console.error('Error reading notes:', error);
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
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    message,
    timestamp: Date.now(),
    images,
  };

  try {
    if (isDevelopment()) {
      console.log('📝 Writing to DEV database');
    }

    // Store images as JSON string for compatibility
    const imagesJson = JSON.stringify(newNote.images || []);

    const sql = getSQL();
    await sql`
      INSERT INTO notes (id, name, message, timestamp, images)
      VALUES (${newNote.id}, ${newNote.name}, ${newNote.message}, ${newNote.timestamp}, ${imagesJson}::jsonb)
    `;

    return newNote;
  } catch (error) {
    console.error('Error adding note:', error);
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

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
