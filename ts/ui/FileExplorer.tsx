import React, { useState } from 'react';
import { useAppStore } from '../store';
import { saveHub } from '../core/storage';
import AiPanel from '../features/AiPanel';
import type { Note } from '../types/index';

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
        >
          ✨ AI
        </button>
      </div>

      {/* ── Files Tab ── */}
      <div id="explorer-files-pane" style={{ display: activeTab === 'files' ? 'block' : 'none' }}>
        <div className="explorer-header">
          <span className="explorer-title">hub</span>
          <div className="explorer-actions">
            <div className="icon-btn" title="New note or canvas" onClick={() => useAppStore.getState().openPicker(hub.folders[0]?.id)}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </div>
            <div className="icon-btn" title="New folder" onClick={newFolder}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
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
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor"><polyline points={folder.open ? "6 9 12 15 18 9" : "9 18 15 12 9 6"}/></svg>
                  </span>
                  <span className="folder-icon">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
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
                          <svg className={`file-type-icon ${isCanvas ? 'canvas-icon' : ''}`} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {isCanvas ? (
                              <><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></>
                            ) : (
                              <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>
                            )}
                          </svg>

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
