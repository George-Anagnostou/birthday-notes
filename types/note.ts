export interface Note {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  images?: string[]; // Array of image URLs from Vercel Blob (max 5)
  recipient_id: string; // Identifies which birthday recipient this note is for
}

export interface NotesData {
  notes: Note[];
}
