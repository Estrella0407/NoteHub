// ── CORE DATA MODELS ──
// These interfaces define the shape of all NoteHub data structures.
// TypeScript will enforce these shapes everywhere they are used.

export interface Note {
  id: string;
  type: 'note' | 'canvas';
  title: string;
  body: string;
  created: string;         // ISO date string
  tags?: string[];
  canvasData?: string;     // transient; stripped before cloud save
}

export interface Folder {
  id: string;
  name: string;
  open: boolean;
  notes: Note[];
}

export interface Hub {
  folders: Folder[];
  tags?: string[];
}

export interface Tab {
  id: string;
  fid: string;
  modified?: boolean;
}

export interface Prefs {
  theme: string;
  accent: string;
  fontSize: string;
}

export interface Session {
  openTabs: Tab[];
  activeTab: string | null;
  activePage: string;
  timestamp: number;
}

export type NoteType = 'note' | 'canvas';
export type FormatType =
  | 'bold' | 'italic' | 'strikethrough' | 'highlight'
  | 'h1' | 'h2' | 'h3'
  | 'ul' | 'ol' | 'check'
  | 'code' | 'codeBlock' | 'formula' | 'quote' | 'hr'
  | 'link' | 'image' | 'table';
