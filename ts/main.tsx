// Essential initializers
import './core/state';
import './core/firebase';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { appState } from './core/state';
import { loadHubData, loadSession } from './core/storage';
import { useAppStore } from './store';

// ── CSS: Vite bundles all of these into a single stylesheet ──
import '../css/style.css';
import '../css/canvas.css';
import '../css/ai.css';
import '../css/graph.css';
import '../css/calendar.css';
import '../css/preview.css';
import '../css/settings.css';

// Pipe the vanilla Auth/Storage events straight into our global React store!
appState.onAuthChangedCallback = async (user) => {
  useAppStore.getState().setCurrentUser(user);
  
  // Load from Firebase or localStorage
  await loadHubData(user);
  
  // Push to Zustand
  useAppStore.getState().setHub(appState.hub);
  
  // Restore session cleanly
  const session = loadSession();
  if (session) {
    if (session.activePage) useAppStore.getState().setPanel(session.activePage);
    if (session.activeTab) useAppStore.getState().setActiveFile(session.activeTab);
  } else {
    // Select first note automatically if available
    const hub = appState.hub;
    if (hub && hub.folders.length > 0 && hub.folders[0].notes.length > 0) {
      useAppStore.getState().setActiveFile(hub.folders[0].notes[0].id);
    }
  }
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
