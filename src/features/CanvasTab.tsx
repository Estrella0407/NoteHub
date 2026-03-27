import React, { useState, useEffect, useRef } from 'react';
import './CanvasTab.css';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { useAppStore } from '../store';
import { loadCanvasData, saveCanvasData } from '../core/storage';

export default function CanvasTab() {
  const activeFileId = useAppStore((s) => s.activeFileId);
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const saveTimeoutRef = useRef<any>(null);
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  useEffect(() => {
    if (!activeFileId) return;
    
    setIsLoading(true);
    let isMounted = true;
    
    loadCanvasData(activeFileId).then((data) => {
      if (!isMounted) return;
      
      // Default empty data if document is brand new or legacy format
      const canvasData = data && typeof data === 'object' && 'elements' in data 
        ? data 
        : { elements: [] };
        
      setInitialData(canvasData);
      setIsLoading(false);
    });
    
    return () => { 
      isMounted = false; 
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [activeFileId]);

  const handleChange = (elements: readonly any[], appState: any, files: any) => {
    if (!activeFileId) return;
    
    // Debounce the save to prevent hammering localStorage / Firestore on every stroke
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      saveCanvasData(activeFileId, {
        elements,
        files,
        // Only save minimal appState (like view position) so theme isn't hardcoded on next load
        appState: {
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
          zoom: appState.zoom,
        }
      });
    }, 1000);
  };

  if (!activeFileId || isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
        Loading Canvas...
      </div>
    );
  }

  return (
    <div id="canvas-view" style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
      <Excalidraw
        initialData={initialData}
        onChange={handleChange}
        theme={isDark ? 'dark' : 'light'}
      />
    </div>
  );
}
