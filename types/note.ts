export interface Note {
  id: string;
  name: string;
  message: string;
  timestamp: number;
}

export interface NotesData {
  notes: Note[];
}
