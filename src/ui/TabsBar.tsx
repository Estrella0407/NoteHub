// ── TABS BAR (React) ──
// Replaces tabs.ts + the renderTabs() logic from notes.ts
import React from 'react';
import { useAppStore } from '../store';
import { saveHub } from '../core/storage';
import { Icon } from './Icons';

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
              <Icon name="canvas" size={10} />
            )}
            <span>{note.title || 'Untitled'}</span>
            {tab.modified && <span className="tab-modified" style={{ color: 'var(--accent)', marginLeft: '2px' }}>●</span>}
            <span className="tab-close" onClick={(e) => closeTab(tab.id, e)} style={{ marginLeft: '6px', opacity: 0.5, cursor: 'pointer' }}>
              <Icon name="close" size={10} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
