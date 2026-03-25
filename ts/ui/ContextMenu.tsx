import React, { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store';
import { getNote, getFolder, saveHub, deleteCanvasData } from '../core/storage';
import { exportNoteToPDF } from '../components/importExport';
import type { Note } from '../types/index';

export default function ContextMenu() {
  const contextMenu = useAppStore(state => state.contextMenu);
  const closeContextMenu = useAppStore(state => state.closeContextMenu);
  const setRenamingFileId = useAppStore(state => state.setRenamingFileId);
  const hub = useAppStore(state => state.hub);
  const setHub = useAppStore(state => state.setHub);
  const setActiveFile = useAppStore(state => state.setActiveFile);
  const openModal = useAppStore(state => state.openModal);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside (but NOT on the menu itself)
  useEffect(() => {
    if (!contextMenu.isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      closeContextMenu();
    };
    // Use setTimeout so the opening right-click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [contextMenu.isOpen, closeContextMenu]);

  if (!contextMenu.isOpen) return null;

  const { nid, fid } = contextMenu;

  const handleOpen = () => {
    if (nid) setActiveFile(nid);
    closeContextMenu();
  };

  const handleRename = () => {
    if (nid) setRenamingFileId(nid);
    closeContextMenu();
  };

  const handleDuplicate = () => {
    if (!nid || !fid) { closeContextMenu(); return; }
    const note = getNote(nid);
    const folder = getFolder(fid);
    if (note && folder) {
      const newHub = JSON.parse(JSON.stringify(hub));
      const targetFolder = newHub.folders.find((f: any) => f.id === fid);
      if (targetFolder) {
        const copy: Note = { ...note, id: 'n' + Date.now(), title: note.title + ' (copy)', created: new Date().toISOString() };
        const idx = targetFolder.notes.findIndex((n: any) => n.id === nid);
        targetFolder.notes.splice(idx + 1, 0, copy);
        setHub(newHub);
        saveHub();
        setActiveFile(copy.id);
      }
    }
    closeContextMenu();
  };

  const handleExportPdf = () => {
    if (nid) exportNoteToPDF(nid);
    closeContextMenu();
  };

  const handleDelete = () => {
    if (!nid || !fid) { closeContextMenu(); return; }
    // Capture values before closing
    const noteId = nid;
    const folderId = fid;
    closeContextMenu();
    // Open confirm modal after closing context menu
    openModal({
      title: 'Delete Note',
      message: 'Delete this note permanently?',
      showInput: false,
      onConfirm: () => {
        const currentHub = useAppStore.getState().hub;
        const newHub = JSON.parse(JSON.stringify(currentHub));
        const targetFolder = newHub.folders.find((f: any) => f.id === folderId);
        if (targetFolder) {
          targetFolder.notes = targetFolder.notes.filter((n: any) => n.id !== noteId);
          useAppStore.getState().setHub(newHub);
          saveHub();
          deleteCanvasData(noteId);
          // Clear active file if it was the deleted note
          if (useAppStore.getState().activeFileId === noteId) {
            useAppStore.getState().setActiveFile(null);
          }
        }
      }
    });
  };

  return (
    <div id="ctx-menu" ref={menuRef} style={{ display: 'block', left: contextMenu.x, top: contextMenu.y }}>
      <div className="ctx-item" onClick={handleOpen}>Open</div>
      <div className="ctx-item" onClick={handleRename}>Rename</div>
      <div className="ctx-item" onClick={handleDuplicate}>Duplicate</div>
      <div className="ctx-sep" />
      <div className="ctx-item" onClick={handleExportPdf}>Export PDF</div>
      <div className="ctx-sep" />
      <div className="ctx-item danger" onClick={handleDelete}>Delete</div>
    </div>
  );
}
