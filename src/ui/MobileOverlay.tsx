import React from 'react';
import { useAppStore } from '../store';

export default function MobileOverlay() {
  const toggleMobileMenu = useAppStore((state) => state.toggleMobileMenu);

  return (
    <div 
      className="mobile-overlay" 
      onClick={toggleMobileMenu}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 40
      }}
    />
  );
}
