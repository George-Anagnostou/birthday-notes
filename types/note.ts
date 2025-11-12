export interface Note {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  images?: string[]; // Array of image URLs from Vercel Blob (max 5)
}

export interface NotesData {
  notes: Note[];
}
