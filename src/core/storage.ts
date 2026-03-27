// ── STORAGE ──
// Hub metadata  → users/{uid}                    { hub: {...}, prefs: {...} }
// Canvas data   → users/{uid}/canvases/{nid}     { data: "<json>", updatedAt: "..." }
//
// Guest / offline fallback → localStorage:
//   'hub'                  → hub JSON
//   'notehub_canvas_{nid}' → Excalidraw JSON string

import type { Hub, Note, Folder, Prefs, Session } from '../types/index';
import { appState } from './state';
import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAppStore } from '../store';

export function saveHub(): void {
  // Strip any canvas blobs before writing — canvas lives in its own subcollection
  const clean = _stripCanvasData(useAppStore.getState().hub);

  const currentUser = useAppStore.getState().currentUser;
  if (currentUser && db) {
    const prefs: Prefs = {
      theme:    localStorage.getItem('hub-theme')     || 'dark',
      accent:   localStorage.getItem('hub-accent')    || '#e0af68',
      fontSize: localStorage.getItem('hub-font-size') || '16',
    };

    setDoc(doc(db, 'users', currentUser.uid), { hub: clean, prefs }, { merge: true })
      .catch((err: Error) => {
        console.error('Firestore saveHub error:', err);
      });
  } else {
    try {
      localStorage.setItem('hub', JSON.stringify(clean));
    } catch (e) {
      console.error('localStorage saveHub error:', e);
    }
  }
}

export async function loadHubData(user: typeof appState.currentUser): Promise<void> {
  if (user && db) {
    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data() as { hub?: Hub; prefs?: Prefs };
        const hub = data.hub || _defaultHub();
        _normaliseHub(hub);
        useAppStore.getState().setHub(hub);

        // Restore cloud preferences
        if (data.prefs) {
          if (data.prefs.theme)    localStorage.setItem('hub-theme',     data.prefs.theme);
          if (data.prefs.accent)   localStorage.setItem('hub-accent',    data.prefs.accent);
          if (data.prefs.fontSize) localStorage.setItem('hub-font-size', data.prefs.fontSize);
        }
        return;
      }
    } catch (err) {
      console.error('Firestore loadHubData error:', err);
    }
  }

  // Guest / fallback
  let parsed: Hub | null = null;
  try { parsed = JSON.parse(localStorage.getItem('hub') || 'null') as Hub; } catch (e) {}
  const hub = (parsed && parsed.folders) ? parsed : _defaultHub();
  _normaliseHub(hub);
  useAppStore.getState().setHub(hub);
}

/**
 * Persist Excalidraw JSON for one canvas note.
 *   Signed-in → Firestore users/{uid}/canvases/{nid}
 *   Guest     → localStorage  notehub_canvas_{nid}
 */
export async function saveCanvasData(nid: string, canvasJSON: string | object): Promise<void> {
  const jsonStr = typeof canvasJSON === 'string'
    ? canvasJSON
    : JSON.stringify(canvasJSON);

  const currentUser = useAppStore.getState().currentUser;
  if (currentUser && db) {
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'canvases', nid), {
        data:      jsonStr,
        updatedAt: new Date().toISOString(),
        uid:       currentUser.uid,
      });
      return; // success — don't fall through to localStorage
    } catch (err) {
      console.error('Firestore saveCanvasData error — falling back to localStorage:', err);
    }
  }

  // Guest / fallback
  try {
    localStorage.setItem(`notehub_canvas_${nid}`, jsonStr);
  } catch (e) {
    console.error('localStorage saveCanvasData error:', e);
  }
}

/**
 * Load Excalidraw JSON for one canvas note.
 * Returns a parsed object, or null if nothing has been saved yet.
 */
export async function loadCanvasData(nid: string): Promise<object | null> {
  const currentUser = useAppStore.getState().currentUser;
  if (currentUser && db) {
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid, 'canvases', nid));

      if (snap.exists()) {
        const raw = snap.data().data as string | object;
        return typeof raw === 'string' ? JSON.parse(raw) as object : raw;
      }
    } catch (err) {
      console.error('Firestore loadCanvasData error — trying localStorage:', err);
    }
  }

  // Guest / fallback
  const local = localStorage.getItem(`notehub_canvas_${nid}`);
  if (local) {
    try { return JSON.parse(local) as object; } catch { return null; }
  }
  return null;
}

/**
 * Delete canvas data when a canvas note is deleted.
 * Safe to call even if the document doesn't exist yet.
 */
export async function deleteCanvasData(nid: string): Promise<void> {
  const currentUser = useAppStore.getState().currentUser;
  if (currentUser && db) {
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'canvases', nid));
    } catch (err) {
      console.error('Firestore deleteCanvasData error:', err);
    }
  }
  // Always clean up localStorage too (covers the fallback path)
  localStorage.removeItem(`notehub_canvas_${nid}`);
}

// Lookup helpers
export function getNote(nid: string): Note | undefined {
  for (const f of useAppStore.getState().hub.folders) {
    const n = f.notes.find(n => n.id === nid);
    if (n) return n;
  }
  return undefined;
}

export function getFolder(fid: string): Folder | undefined {
  return useAppStore.getState().hub.folders.find(f => f.id === fid);
}

/** Deep-clone the hub and strip any canvasData fields so they never bloat the hub doc. */
function _stripCanvasData(hub: Hub): Hub {
  const clone = JSON.parse(JSON.stringify(hub)) as Hub;
  clone.folders.forEach(f => f.notes.forEach(n => delete n.canvasData));
  return clone;
}

/** Back-compat: ensure every note has a type, and no stale canvasData blob. */
function _normaliseHub(hub: Hub): void {
  hub.folders.forEach(f => {
    f.notes.forEach(n => {
      // Only default to 'note' if missing; preserve 'canvas' etc.
      if (!n.type) n.type = 'note';
      delete n.canvasData;
    });
  });
}

function _defaultHub(): Hub {
  return {
    folders: [
      {
        id: 'f1', name: 'Quick Notes', open: true,
        notes: [
          {
            id: 'n1', type: 'note', title: 'Welcome to NoteHub',
            body: `# Welcome to hub\n\nThis is your personal knowledge base. Start capturing your thoughts, ideas, and research.\n\n## Getting Started\n\n- Create new notes with the **+** button\n- Organize notes into folders\n- Use Markdown for rich formatting\n\n## Markdown Supported\n\n**Bold**, *italic*, \`inline code\`\n\n> Blockquotes for important callouts\n\n\`\`\`\ncode blocks too\n\`\`\`\n\n---\n\nHappy writing!`,
            created: new Date().toISOString(),
          },
          {
            id: 'n2', type: 'note', title: 'Ideas',
            body: `# Ideas\n\n- [ ] Build something cool\n- [ ] Learn a new skill\n- [x] Set up this hub\n\n## Big Picture\n\nSome *larger* ideas worth exploring...\n`,
            created: new Date().toISOString(),
          },
        ],
      },
      {
        id: 'f2', name: 'Projects', open: false,
        notes: [
          {
            id: 'n3', type: 'note', title: 'Project Alpha',
            body: `# Project Alpha\n\n**Status:** In Progress\n\n## Goals\n\n1. Define scope\n2. Research phase\n3. Execute\n\n---\n\nNotes go here...`,
            created: new Date().toISOString(),
          },
        ],
      },
      { id: 'f3', name: 'Archive', open: false, notes: [] },
    ],
  };
}

export function saveSession(): void {
  const state = useAppStore.getState();
  const session: Session = {
    openTabs:   state.openTabs.map(t => ({ id: t.id, fid: t.fid })),
    activeTab:  state.activeFileId,
    activePage: state.currentPanel || 'files',
    timestamp:  Date.now(),
  };
  localStorage.setItem('notehub-session', JSON.stringify(session));
}

export function loadSession(): Session | null {
  const data = localStorage.getItem('notehub-session');
  if (!data) return null;
  const parsed = JSON.parse(data) as Session;
  // Optional: expire session after 7 days
  if (Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) return null;
  return parsed;
}
