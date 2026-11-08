export interface NoteAuthor {
  _id: string;
  name: string;
}

export interface Note {
  noteId: string;
  content: string;
  /** ISO-8601 UTC timestamps set by the backend. */
  createdAt: string;
  updatedAt: string;
  /** Null if the author's account no longer exists. */
  createdBy: NoteAuthor | null;
}
