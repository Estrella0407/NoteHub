import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { Icon } from '../ui/Icons';
import { saveHub } from '../core/storage';
import './TagsView.css';

export default function TagsView() {
  const hub = useAppStore(s => s.hub);
  const setHub = useAppStore(s => s.setHub);
  const openModal = useAppStore(s => s.openModal);
  const setActiveFile = useAppStore(s => s.setActiveFile);
  const setPanel = useAppStore(s => s.setPanel);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const handleCreateTag = () => {
    openModal({
      title: 'New Tag',
      placeholder: 'tag name (e.g. ideas)',
      onConfirm: (val) => {
        const t = val.trim().toLowerCase();
        if (!t) return;
        const newHub = JSON.parse(JSON.stringify(hub));
        if (!newHub.tags) newHub.tags = [];
        if (!newHub.tags.includes(t)) {
          newHub.tags.push(t);
          setHub(newHub);
          saveHub();
        }
      }
    });
  };

  // Extract all tags and their associated notes
  const tagData = useMemo(() => {
    const map: Record<string, any[]> = {};
    (hub.tags || []).forEach(t => { map[t] = []; });
    hub.folders.forEach(f => {
      f.notes.forEach(n => {
        (n.tags || []).forEach(t => {
          if (!map[t]) map[t] = [];
          map[t].push({ ...n, folderName: f.name });
        });
      });
    });
    return Object.entries(map).map(([tag, notes]) => ({
      tag,
      notes,
      count: notes.length
    })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [hub]);

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tagData;
    const lowerQ = searchQuery.toLowerCase();
    return tagData.filter(td => td.tag.toLowerCase().includes(lowerQ));
  }, [tagData, searchQuery]);

  // If activeTag is somehow removed or not set, maybe default to the first
  const currentTagData = activeTag 
    ? tagData.find(td => td.tag === activeTag)
    : filteredTags[0];
  
  const shownTag = currentTagData?.tag || null;

  const handleNoteClick = (noteId: string) => {
    setPanel('files');
    setActiveFile(noteId);
  };

  return (
    <div id="tags-view-slot">
      <div id="tags-view-header">
        <div className="global-search-wrap" style={{ maxWidth: '400px' }}>
          <Icon name="search" size={14} />
          <input
            className="global-input"
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="tags-view-body">
        {/* Left Col: Tag List */}
        <div className="tags-list-col">
          <div className="explorer-header" style={{ padding: '14px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="explorer-title">tags</span>
            <div className="explorer-actions">
              <div className="icon-btn" title="Create new tag" onClick={handleCreateTag}>
                <Icon name="newNote" size={14} />
              </div>
            </div>
          </div>
          
          {filteredTags.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--text-dim)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
              No tags found.
            </div>
          ) : (
            filteredTags.map(td => (
              <div
                key={td.tag}
                className={`tags-list-item ${shownTag === td.tag ? 'active' : ''}`}
                onClick={() => setActiveTag(td.tag)}
              >
                <div className="tag-name">
                  <span style={{ color: 'var(--accent)' }}>#</span>
                  {td.tag}
                </div>
                <div className="tag-count">{td.count}</div>
              </div>
            ))
          )}
        </div>

        {/* Right Col: Notes for selected tag */}
        <div className="tags-content-col">
          {currentTagData ? (
            <>
              <div className="tags-content-title">
                <span style={{ color: 'var(--accent)', marginRight: 8 }}>#</span>
                {currentTagData.tag}
              </div>
              <div className="tags-notes-grid">
                {currentTagData.notes.map(note => (
                  <div key={note.id} className="tag-note-card" onClick={() => handleNoteClick(note.id)}>
                    <div className="tag-note-title">{note.title || 'Untitled'}</div>
                    <div className="tag-note-preview">
                      {note.body.replace(/[#*>\-\[\]]/g, '').trim().slice(0, 120) || 'No content...'}
                    </div>
                    <div className="tag-note-meta">
                      {note.folderName} · {note.type}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-dim)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>
              Select a tag to view its notes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
