import { sql } from '@vercel/postgres';
import { Note } from '@/types/note';

/**
 * Storage layer using Vercel Postgres
 * This replaces the previous file-based storage which doesn't work on Vercel's serverless infrastructure
 */

// Read all notes from database
export async function readNotes(): Promise<Note[]> {
  try {
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
    // Store images as JSON string for compatibility
    const imagesJson = JSON.stringify(newNote.images || []);

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
