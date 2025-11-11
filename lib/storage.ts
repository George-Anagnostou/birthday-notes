import fs from 'fs';
import path from 'path';
import { Note, NotesData } from '@/types/note';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Read all notes from file
export function readNotes(): Note[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(NOTES_FILE)) {
      return [];
    }
    const data = fs.readFileSync(NOTES_FILE, 'utf-8');
    const parsed: NotesData = JSON.parse(data);
    return parsed.notes || [];
  } catch (error) {
    console.error('Error reading notes:', error);
    return [];
  }
}

// Write notes to file
export function writeNotes(notes: Note[]): void {
  try {
    ensureDataDir();
    const data: NotesData = { notes };
    fs.writeFileSync(NOTES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing notes:', error);
    throw error;
  }
}

// Add a new note
export function addNote(name: string, message: string): Note {
  const notes = readNotes();
  const newNote: Note = {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    message,
    timestamp: Date.now(),
  };
  notes.push(newNote);
  writeNotes(notes);
  return newNote;
}
