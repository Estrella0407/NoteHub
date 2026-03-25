import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { saveHub } from '../core/storage';
import type { Note } from '../types/index';

export default function NewItemPicker() {
  const pickerFolderId = useAppStore(state => state.pickerFolderId);
  const closePicker = useAppStore(state => state.closePicker);
  const hub = useAppStore(state => state.hub);
  const setHub = useAppStore(state => state.setHub);
  const setActiveFile = useAppStore(state => state.setActiveFile);
  const openModal = useAppStore(state => state.openModal);

  const pickerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside of the picker modal (on the overlay)
  useEffect(() => {
    if (!pickerFolderId) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && pickerRef.current.contains(e.target as Node)) return;
      closePicker();
    };
    // Defer to avoid immediate close from the trigger click event
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [pickerFolderId, closePicker]);

  if (!pickerFolderId) return null;

  const createItem = (type: 'note' | 'canvas') => {
    closePicker();
    const title = type === 'canvas' ? 'New Canvas' : 'New Note';
    const placeholder = type === 'canvas' ? 'Canvas name...' : 'Note name...';
    const folderId = pickerFolderId;

    openModal({
      title,
      placeholder,
      onConfirm: (name: string) => {
        const id = (type === 'canvas' ? 'c' : 'n') + Date.now() + Math.random().toString(36).substring(2, 8);
        const newHub = JSON.parse(JSON.stringify(useAppStore.getState().hub));
        const folder = newHub.folders.find((f: any) => f.id === folderId);
        if (!folder) return;

        const note: Note = {
          id,
          type,
          title: name || (type === 'canvas' ? 'Untitled Canvas' : 'Untitled Note'),
          body: type === 'canvas' ? '' : `# ${name || 'Untitled Note'}\n\n`,
          created: new Date().toISOString()
        };

        folder.notes.unshift(note);
        folder.open = true;
        
        useAppStore.getState().setHub(newHub);
        saveHub();
        useAppStore.getState().setActiveFile(id);
      }
    });
  };

  return (
    <div id="new-item-overlay" className="open" style={{ zIndex: 1000 }}>
      <div id="new-item-picker" ref={pickerRef}>
        <p className="picker-label">What do you want to create?</p>
        <div className="picker-options">
          <button className="picker-btn" onClick={() => createItem('note')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span className="picker-btn-label">Note</span>
            <span className="picker-btn-sub">Markdown editor</span>
          </button>
          
          <button className="picker-btn" onClick={() => createItem('canvas')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
            <span className="picker-btn-label">Canvas</span>
            <span className="picker-btn-sub">Drawing &amp; diagrams</span>
          </button>
        </div>
      </div>
    </div>
  );
}
