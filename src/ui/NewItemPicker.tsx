import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { saveHub } from '../core/storage';
import type { Note } from '../types/index';
import { Icon } from './Icons';

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
            <Icon name="note" size={22} className="picker-icon" />
            <span className="picker-btn-label">Note</span>
            <span className="picker-btn-sub">Markdown editor</span>
          </button>
          
          <button className="picker-btn" onClick={() => createItem('canvas')}>
            <Icon name="canvas" size={22} className="picker-icon" />
            <span className="picker-btn-label">Canvas</span>
            <span className="picker-btn-sub">Drawing &amp; diagrams</span>
          </button>
        </div>
      </div>
    </div>
  );
}
