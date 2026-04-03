import React, { useEffect } from 'react';
import { useAppStore } from './store';
import Navigation from './ui/Navigation';
import FileExplorer from './ui/FileExplorer';
import Workspace from './ui/Workspace';
import MobileOverlay from './ui/MobileOverlay';
import Modal from './ui/Modal';
import ContextMenu from './ui/ContextMenu';
import Settings from './ui/Settings';
import NewItemPicker from './ui/NewItemPicker';

export default function App() {
  const isMobileMenuOpen = useAppStore((state) => state.isMobileMenuOpen);

  useEffect(() => {
    const notifyInterval = setInterval(() => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      if (localStorage.getItem('hub-notifs-enabled') !== 'true') return;
      try {
        const evs = JSON.parse(localStorage.getItem('hub-cal-events') || '[]');
        const notified = JSON.parse(localStorage.getItem('hub-notified-events') || '{}');
        const now = new Date();
        let changed = false;

        evs.forEach((ev: any) => {
          if (!ev.start) return;
          const d = new Date(ev.start);
          const diffMin = (d.getTime() - now.getTime()) / 60000;
          
          if (diffMin > 0 && diffMin <= 10 && !notified[ev.id]) {
            const n = new Notification(`Upcoming Event: ${ev.title}`, {
              body: `Starting at ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
            });
            n.onclick = () => {
               window.focus();
               if (ev.extendedProps?.linkedNoteId) {
                  useAppStore.getState().setActiveFile(ev.extendedProps.linkedNoteId);
                  useAppStore.getState().setPanel('files');
               } else {
                  useAppStore.getState().setPanel('calendar');
               }
            };
            notified[ev.id] = true;
            changed = true;
          }
        });
        if (changed) localStorage.setItem('hub-notified-events', JSON.stringify(notified));
      } catch {}
    }, 60000);
    return () => clearInterval(notifyInterval);
  }, []);

  return (
    <div className={`app-root ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {isMobileMenuOpen && <MobileOverlay />}

      <Navigation />
      <FileExplorer />
      <Workspace />

      {/* Global Overlays */}
      <Modal />
      <ContextMenu />
      <Settings />
      <NewItemPicker />
    </div>
  );
}
