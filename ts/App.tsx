import React from 'react';
import { useAppStore } from './store';
import Navigation from './ui/Navigation';
import FileExplorer from './ui/FileExplorer';
import Workspace from './components/Workspace';
import MobileOverlay from './ui/MobileOverlay';
import Modal from './ui/Modal';
import ContextMenu from './ui/ContextMenu';
import Settings from './ui/Settings';
import NewItemPicker from './ui/NewItemPicker';

export default function App() {
  const isMobileMenuOpen = useAppStore((state) => state.isMobileMenuOpen);

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
