import React from 'react';
import { useAppStore } from '../store';
import { signIn, signOut } from '../core/auth';
import { Icon } from './Icons';

export default function Navigation() {
  const currentPanel = useAppStore(state => state.currentPanel);
  const setPanel = useAppStore(state => state.setPanel);
  const currentUser = useAppStore(state => state.currentUser);
  const isMobileMenuOpen = useAppStore(state => state.isMobileMenuOpen);
  const toggleMobileMenu = useAppStore(state => state.toggleMobileMenu);
  const setMobileMenuOpen = useAppStore(state => state.setMobileMenuOpen);
  const isSettingsOpen = useAppStore(state => state.isSettingsOpen);
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);

  const handleNavClick = (panel: any) => {
    setSettingsOpen(false); // Close settings when navigating
    if (window.innerWidth <= 768) {
      if (panel === 'graph' || panel === 'calendar' || panel === 'tags') {
        setPanel(panel);
        setMobileMenuOpen(false); // Close mobile overlay for fullscreen views
      } else {
        if (currentPanel === panel) toggleMobileMenu();
        else { setPanel(panel); setMobileMenuOpen(true); }
      }
    } else {
      setPanel(panel);
    }
  };

  const handleSettingsClick = () => {
    setSettingsOpen(!isSettingsOpen);
  };

  return (
    <div id="nav" className="react-nav">
      <div className="nav-logo">
        <Icon name="logo" size={22} />
      </div>

      <div className={`nav-btn ${currentPanel === 'files' ? 'active' : ''}`} data-panel="files" onClick={() => handleNavClick('files')}>
        <Icon name="files" size={18} />
        <div className="nav-tooltip">File Explorer</div>
      </div>

      <div className={`nav-btn ${currentPanel === 'ai' ? 'active' : ''}`} data-panel="ai" onClick={() => handleNavClick('ai')}>
        <Icon name="aiSparkle" size={18} />
        <div className="nav-tooltip">AI Assistant</div>
      </div>

      <div className={`nav-btn ${currentPanel === 'tags' ? 'active' : ''}`} data-panel="tags" onClick={() => handleNavClick('tags')}>
        <Icon name="tags" size={18} />
        <div className="nav-tooltip">Tags</div>
      </div>

      <div className={`nav-btn ${currentPanel === 'graph' ? 'active' : ''}`} data-panel="graph" onClick={() => handleNavClick('graph')}>
        <Icon name="graph" size={18} />
        <div className="nav-tooltip">Graph View</div>
      </div>

      <div className={`nav-btn ${currentPanel === 'calendar' ? 'active' : ''}`} data-panel="calendar" onClick={() => handleNavClick('calendar')}>
        <Icon name="calendar" size={18} />
        <div className="nav-tooltip">Calendar</div>
      </div>

      <div className="nav-spacer" />

      {/* Help & Settings */}
      <div className="nav-btn" id="btn-help" onClick={() => setSettingsOpen(true)}>
        <Icon name="help" size={18} />
        <div className="nav-tooltip">Help</div>
      </div>

      <div className={`nav-btn ${isSettingsOpen ? 'active' : ''}`} id="btn-settings" onClick={handleSettingsClick}>
        <Icon name="settings" size={18} />
        <div className="nav-tooltip">Settings</div>
      </div>

      {!currentUser ? (
        <div className="nav-btn" id="btn-signin" onClick={signIn} title="Sign In using Google">
          <Icon name="signin" size={18} />
          <div className="nav-tooltip">Sign In</div>
        </div>
      ) : (
        <div className="nav-btn" id="btn-signout" onClick={signOut} title="Sign Out">
          <Icon name="signout" size={18} />
          <div className="nav-tooltip">Sign Out</div>
        </div>
      )}
    </div>
  );
}
