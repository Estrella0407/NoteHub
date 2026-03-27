// ── TAGS PANEL (React) ──
// Replaces core/tags.ts — both the sidebar tags panel and the per-note tag chips.
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { saveHub } from '../core/storage';

/** Sidebar tags panel shown when the user clicks the Tags nav button */
export default function TagsPanel() {
  const hub = useAppStore(s => s.hub);
  const setActiveFile = useAppStore(s => s.setActiveFile);
  const setPanel = useAppStore(s => s.setPanel);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Collect all tags across all notes
  const tagMap: Record<string, number> = {};
  hub.folders.forEach(f => {
    f.notes.forEach(n => {
      (n.tags || []).forEach(t => {
        tagMap[t] = (tagMap[t] || 0) + 1;
      });
    });
  });
  const tags = Object.entries(tagMap).sort((a, b) => a[0].localeCompare(b[0]));
  const totalNotes = hub.folders.reduce((s, f) => s + f.notes.length, 0);

  const filterByTag = (tag: string) => {
    setActiveTag(tag);
    // Optionally: filter the file explorer — for now just highlights
  };

  return (
    <div id="tags-slot" style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
      <div style={{ padding: '8px 16px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.5px' }}>Tags</div>

      {tags.length === 0 ? (
        <div className="tags-empty" style={{ padding: '16px', fontSize: '13px', color: 'var(--text-dim)' }}>
          No tags yet.<br/>Open a note and add tags below the title.
        </div>
      ) : (
        <>
          {/* All notes row */}
          <div
            className={`tag-row ${activeTag === null ? 'active' : ''}`}
            onClick={() => setActiveTag(null)}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 16px', cursor: 'pointer', color: activeTag === null ? 'var(--accent)' : 'var(--text-main)', fontSize: '13px' }}
          >
            <span>All notes</span><span>{totalNotes}</span>
          </div>

          {tags.map(([tag, count]) => (
            <div
              key={tag}
              className={`tag-row ${activeTag === tag ? 'active' : ''}`}
              onClick={() => filterByTag(tag)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', cursor: 'pointer', color: activeTag === tag ? 'var(--accent)' : 'var(--text-main)', fontSize: '13px' }}
            >
              <span className="tag-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{tag}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{count}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/** Note tag chips — rendered inside the Editor component below the title */
export function NoteTags({ noteId }: { noteId: string }) {
  const hub = useAppStore(s => s.hub);
  const setHub = useAppStore(s => s.setHub);
  const currentUser = useAppStore(s => s.currentUser);
  const [tagInput, setTagInput] = useState('');

  const note = hub.folders.flatMap(f => f.notes).find(n => n.id === noteId);
  if (!note) return null;
  const tags = note.tags || [];

  const addTag = (tag: string) => {
    tag = tag.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    if (!currentUser) { alert('Please Sign In to add tags!'); return; }
    const newHub = JSON.parse(JSON.stringify(hub));
    const n = newHub.folders.flatMap((f: any) => f.notes).find((n: any) => n.id === noteId);
    if (!n) return;
    if (!n.tags) n.tags = [];
    n.tags.push(tag);
    setHub(newHub);
    saveHub();
  };

  const removeTag = (tag: string) => {
    if (!currentUser) return;
    const newHub = JSON.parse(JSON.stringify(hub));
    const n = newHub.folders.flatMap((f: any) => f.notes).find((n: any) => n.id === noteId);
    if (!n || !n.tags) return;
    n.tags = n.tags.filter((t: string) => t !== tag);
    setHub(newHub);
    saveHub();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput.replace(/,/g, ''));
      setTagInput('');
    }
  };

  return (
    <div id="note-tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px 24px', alignItems: 'center' }}>
      {tags.map(tag => (
        <span key={tag} className="note-tag-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', background: 'var(--bg-hover)', color: 'var(--text-mid)', fontSize: '11px' }}>
          {tag}
          <button onClick={() => removeTag(tag)} title="Remove tag" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '11px', padding: 0, lineHeight: 1 }}>×</button>
        </span>
      ))}
      {currentUser && (
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput(''); } }}
          placeholder="+ tag"
          className="tag-input"
          style={{ border: 'none', background: 'none', outline: 'none', color: 'var(--text-dim)', fontSize: '11px', width: '60px', padding: '2px 4px' }}
        />
      )}
    </div>
  );
}
