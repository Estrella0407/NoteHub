import React from 'react';
import { useAppStore } from '../store';
import { signIn, signOut } from '../core/auth';
import { Icon } from './Icons';

export default function Navigation() {
  const currentPanel = useAppStore(state => state.currentPanel);
  const setPanel = useAppStore(state => state.setPanel);
  const currentUser = useAppStore(state => state.currentUser);
  const toggleMobileMenu = useAppStore(state => state.toggleMobileMenu);

  return (
    <div id="nav" className="react-nav">
      <div className="nav-logo">
        <Icon name="logo" size={22} />
      </div>

      <div className={`nav-btn ${currentPanel === 'files' ? 'active' : ''}`} data-panel="files" onClick={() => setPanel('files')}>
        <Icon name="files" size={18} />
        <div className="nav-tooltip">File Explorer</div>
      </div>

      <div className={`nav-btn ${currentPanel === 'ai' ? 'active' : ''}`} data-panel="ai" onClick={() => setPanel('ai')}>
        <Icon name="aiSparkle" size={18} />
        <div className="nav-tooltip">AI Assistant</div>
      </div>

      <div className={`nav-btn ${currentPanel === 'tags' ? 'active' : ''}`} data-panel="tags" onClick={() => setPanel('tags')}>
        <Icon name="tags" size={18} />
        <div className="nav-tooltip">Tags</div>
      </div>

      <div className={`nav-btn ${currentPanel === 'graph' ? 'active' : ''}`} data-panel="graph" onClick={() => setPanel('graph')}>
        <Icon name="graph" size={18} />
        <div className="nav-tooltip">Graph View</div>
      </div>

      <div className={`nav-btn ${currentPanel === 'calendar' ? 'active' : ''}`} data-panel="calendar" onClick={() => setPanel('calendar')}>
        <Icon name="calendar" size={18} />
        <div className="nav-tooltip">Calendar</div>
      </div>

      <div className="nav-spacer" />

      {/* Help & Settings — no onClick/setPanel here; Settings.tsx listens for clicks on these IDs */}
      <div className="nav-btn" id="btn-help">
        <Icon name="help" size={18} />
        <div className="nav-tooltip">Help</div>
      </div>

      <div className="nav-btn" id="btn-settings">
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
