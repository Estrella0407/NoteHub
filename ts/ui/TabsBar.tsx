// ── TABS BAR (React) ──
// Replaces tabs.ts + the renderTabs() logic from notes.ts
import React from 'react';
import { useAppStore } from '../store';
import { saveHub } from '../core/storage';

export default function TabsBar() {
  const hub = useAppStore(s => s.hub);
  const activeFileId = useAppStore(s => s.activeFileId);
  const setActiveFile = useAppStore(s => s.setActiveFile);
  const openTabs = useAppStore(s => s.openTabs ?? []);
  const setOpenTabs = useAppStore(s => s.setOpenTabs);

  const findNote = (id: string) => hub.folders.flatMap(f => f.notes).find(n => n.id === id);

  const closeTab = (tid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openTabs.filter(t => t.id !== tid);
    setOpenTabs(remaining);
    if (activeFileId === tid) {
      const next = remaining.length ? remaining[remaining.length - 1] : null;
      setActiveFile(next?.id ?? null);
    }
  };

  if (!openTabs.length) return null;

  return (
    <div id="tabs-bar" style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border)', minHeight: '32px' }}>
      {openTabs.map(tab => {
        const note = findNote(tab.id);
        if (!note) return null;
        const isCanvas = note.type === 'canvas';
        const isActive = tab.id === activeFileId;

        return (
          <div
            key={tab.id}
            className={`tab${isActive ? ' active' : ''}${isCanvas ? ' tab--canvas' : ''}`}
            onClick={() => setActiveFile(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px', color: isActive ? 'var(--text-bright)' : 'var(--text-mid)', borderRight: '1px solid var(--border)', background: isActive ? 'var(--bg-active)' : 'transparent', whiteSpace: 'nowrap' }}
          >
            {isCanvas && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.7 }}>
                <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              </svg>
            )}
            <span>{note.title || 'Untitled'}</span>
            {tab.modified && <span className="tab-modified" style={{ color: 'var(--accent)', marginLeft: '2px' }}>●</span>}
            <span className="tab-close" onClick={(e) => closeTab(tab.id, e)} style={{ marginLeft: '6px', opacity: 0.5, cursor: 'pointer' }}>
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </span>
          </div>
        );
      })}
    </div>
  );
}
