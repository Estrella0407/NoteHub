import React, { useState } from 'react';
import { useAppStore } from '../store';
import { saveHub } from '../core/storage';
import AiPanel from '../features/AiPanel';
import type { Note } from '../types/index';
import { Icon } from './Icons';

export default function FileExplorer() {
  const currentPanel = useAppStore((state) => state.currentPanel);
  const setPanel = useAppStore((state) => state.setPanel);
  const hub = useAppStore((state) => state.hub);
  const setHub = useAppStore((state) => state.setHub);
  const activeFileId = useAppStore((state) => state.activeFileId);
  const renamingFileId = useAppStore((state) => state.renamingFileId);
  const setRenamingFileId = useAppStore((state) => state.setRenamingFileId);
  const openContextMenu = useAppStore((state) => state.openContextMenu);
  const openModal = useAppStore((state) => state.openModal);
  const currentUser = useAppStore((state) => state.currentUser);

  const [search, setSearch] = useState('');

  // Hide explorer on full screen views
  const isFullScreen = currentPanel === 'graph' || currentPanel === 'calendar';
  const activeTab = currentPanel === 'ai' ? 'ai' : 'files';

  const toggleFolder = (fid: string) => {
    const newHub = JSON.parse(JSON.stringify(hub));
    const folder = newHub.folders.find((f: any) => f.id === fid);
    if (folder) {
      folder.open = !folder.open;
      setHub(newHub);
      saveHub();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, noteId: string, folderId: string) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, noteId, folderId);
  };

  const handleRenameCommit = (noteId: string, folderId: string, newTitle: string) => {
    const newHub = JSON.parse(JSON.stringify(hub));
    const folder = newHub.folders.find((f: any) => f.id === folderId);
    if (folder) {
      const note = folder.notes.find((n: any) => n.id === noteId);
      if (note) {
        note.title = newTitle.trim() || 'Untitled';
        setHub(newHub);
        saveHub();
      }
    }
    setRenamingFileId(null);
  };

  const newFolder = () => {
    if (!currentUser) { alert('Please Sign In first!'); return; }
    openModal({
      title: 'New Folder', placeholder: 'Folder name...',
      onConfirm: (name: string) => {
        const id = 'f' + Date.now() + Math.random().toString(36).substring(2, 8);
        const newHub = JSON.parse(JSON.stringify(hub));
        newHub.folders.push({ id, name: name || 'New Folder', open: true, notes: [] });
        setHub(newHub);
        saveHub();
      }
    });
  };

  return (
    <div id="explorer" style={{ display: isFullScreen ? 'none' : 'flex' }}>

      {/* ── Tab bar ── */}
      <div id="explorer-tabs">
        <button
          className={`explorer-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setPanel('files')}
        >
          Files
        </button>
        <button
          className={`explorer-tab ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setPanel('ai')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Icon name="aiSparkle" size={16} style={{ marginTop: '3px' }} />
          <span>AI</span>
        </button>
      </div>

      {/* ── Files Tab ── */}
      <div id="explorer-files-pane" style={{ display: activeTab === 'files' ? 'block' : 'none' }}>
        <div className="explorer-header">
          <span className="explorer-title">hub</span>
          <div className="explorer-actions">
            <div className="icon-btn" title="New note or canvas" onClick={() => useAppStore.getState().openPicker(hub.folders[0]?.id)}>
              <Icon name="newNote" size={14} />
            </div>
            <div className="icon-btn" title="New folder" onClick={newFolder}>
              <Icon name="newFolder" size={14} />
            </div>
          </div>
        </div>

        <div id="search-wrap">
          <input
            id="search"
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div id="file-tree">
          {hub.folders.map((folder) => {
            const isMatch = (text: string) => text.toLowerCase().includes(search.toLowerCase());
            const filteredNotes = folder.notes.filter(n => search === '' || isMatch(n.title) || isMatch(n.body));

            return (
              <div key={folder.id} className={`folder ${folder.open ? 'open' : ''}`}>
                <div className="folder-header" onClick={() => toggleFolder(folder.id)}>
                  <span className="folder-arrow">
                    <Icon name={folder.open ? "chevronDown" : "chevronRight"} size={10} />
                  </span>
                  <span className="folder-icon">
                    <Icon name="folder" size={12} />
                  </span>
                  <span className="folder-name">{folder.name}</span>
                  <span className="folder-count">{folder.notes.length}</span>
                </div>

                {folder.open && (
                  <div className="folder-children">
                    {filteredNotes.map((note) => {
                      const isCanvas = note.type === 'canvas';
                      const isActive = note.id === activeFileId;
                      const isRenaming = note.id === renamingFileId;

                      return (
                        <div
                          key={note.id}
                          className={`file-item ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            if (!isRenaming) {
                              useAppStore.getState().setActiveFile(note.id);
                            }
                          }}
                          onContextMenu={(e) => handleContextMenu(e, note.id, folder.id)}
                        >
                          <Icon 
                            name={isCanvas ? 'canvas' : 'note'} 
                            size={11} 
                            className={`file-type-icon ${isCanvas ? 'canvas-icon' : ''}`} 
                          />

                          {isRenaming ? (
                            <input
                              autoFocus
                              className="file-rename-input"
                              type="text"
                              defaultValue={note.title || 'Untitled'}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={(e) => handleRenameCommit(note.id, folder.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameCommit(note.id, folder.id, e.currentTarget.value);
                                if (e.key === 'Escape') setRenamingFileId(null);
                              }}
                              style={{ width: '100%', outline: 'none', background: 'var(--bg-dark)', color: 'var(--text)', border: '1px solid var(--accent)', borderRadius: '4px', padding: '2px 4px' }}
                            />
                          ) : (
                            <span className="file-name">{note.title || 'Untitled'}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI Tab ── */}
      <div id="explorer-ai-pane" style={{ display: activeTab === 'ai' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
        <AiPanel />
      </div>

    </div>
  );
}
