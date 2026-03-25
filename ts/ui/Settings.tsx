// ── SETTINGS PANEL (React) ──
// Matches the old settings.html structure. Uses settings.css for all styling.
// Opened via Navigation btn-settings, or btn-help (which opens shortcuts tab).

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { saveHub } from '../core/storage';
import { signOut } from '../core/auth';
import { Icon } from './Icons';

type ThemeName = 'dark' | 'light' | 'nebula' | 'catppuccin';
type SettingsTab = 'appearance' | 'editor' | 'files' | 'calendar' | 'account' | 'shortcuts' | 'about';

const THEMES: { name: ThemeName; label: string }[] = [
  { name: 'dark', label: 'Dark' },
  { name: 'light', label: 'Light' },
  { name: 'nebula', label: 'Nebula' },
  { name: 'catppuccin', label: 'Catppuccin' },
];

const ACCENTS = [
  { color: '#c8903a', name: 'Amber' },
  { color: '#5a9a6a', name: 'Sage' },
  { color: '#5a7ec8', name: 'Blue' },
  { color: '#a05ac8', name: 'Violet' },
  { color: '#c85a7a', name: 'Rose' },
  { color: '#c8c05a', name: 'Gold' },
];

const THEME_VARS: Record<string, Record<string, string>> = {
  dark: { '--bg-base': '#0f0e0d', '--bg-sidebar': '#141210', '--bg-explorer': '#181614', '--bg-editor': '#111010', '--bg-hover': '#1e1b18', '--bg-active': '#252018', '--border': '#2a2520', '--border-soft': '#1e1b17', '--text-dim': '#5a5248', '--text-mid': '#8a7f72', '--text-main': '#cec5b8', '--text-bright': '#e8ddd0' },
  light: { '--bg-base': '#f5f2ee', '--bg-sidebar': '#ede9e3', '--bg-explorer': '#e8e3dc', '--bg-editor': '#f8f5f0', '--bg-hover': '#e0dbd3', '--bg-active': '#d9d2c0', '--border': '#d0c8bc', '--border-soft': '#dcd6ce', '--text-dim': '#b0a898', '--text-mid': '#7a6e60', '--text-main': '#3a332a', '--text-bright': '#1a1510' },
  nebula: { '--bg-base': '#13161d', '--bg-sidebar': '#1f2330', '--bg-explorer': '#181b24', '--bg-editor': '#13161d', '--bg-hover': '#2a2f3f', '--bg-active': '#39415c', '--border': '#39415c', '--border-soft': '#2a2f3f', '--text-dim': '#5a607a', '--text-mid': '#878da6', '--text-main': '#e8eaf0', '--text-bright': '#fcfdff' },
  catppuccin: { '--bg-base': '#1e1e2e', '--bg-sidebar': '#181825', '--bg-explorer': '#11111b', '--bg-editor': '#1e1e2e', '--bg-hover': '#313244', '--bg-active': '#45475a', '--border': '#585b70', '--border-soft': '#313244', '--text-dim': '#6c7086', '--text-mid': '#9399b2', '--text-main': '#cdd6f4', '--text-bright': '#a6adc8' },
};

const NAV_ITEMS: { tab: SettingsTab; icon: string; label: string; section?: string }[] = [
  { tab: 'appearance', icon: 'settings', label: 'Appearance', section: 'General' },
  { tab: 'editor', icon: 'note', label: 'Editor' },
  { tab: 'files', icon: 'folder', label: 'Files & hub' },
  { tab: 'calendar', icon: 'calendar', label: 'Calendar' },
  { tab: 'account', icon: 'signin', label: 'Account', section: 'Account' },
  { tab: 'shortcuts', icon: 'search', label: 'Shortcuts' },
  { tab: 'about', icon: 'help', label: 'About' },
];

export default function Settings() {
  const currentUser = useAppStore(state => state.currentUser);
  const hub = useAppStore(state => state.hub);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [theme, setTheme] = useState(localStorage.getItem('hub-theme') || 'dark');
  const [accent, setAccent] = useState(localStorage.getItem('hub-accent') || '#c8903a');
  const [fontSize, setFontSize] = useState(localStorage.getItem('hub-font-size') || '13');
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [icalUrl, setIcalUrl] = useState(localStorage.getItem('hub-ical-url') || '');
  const [icalEnabled, setIcalEnabled] = useState(localStorage.getItem('hub-ical-enabled') === 'true');

  useEffect(() => {
    const profile = localStorage.getItem('hub-profile');
    if (profile) {
      const p = JSON.parse(profile);
      setProfileName(p.name || '');
      setProfileEmail(p.email || '');
    }
  }, []);

  // Settings button → open settings
  useEffect(() => {
    const openSettings = () => { setActiveTab('appearance'); setIsOpen(true); };
    const btn = document.getElementById('btn-settings');
    btn?.addEventListener('click', openSettings);
    return () => btn?.removeEventListener('click', openSettings);
  }, []);

  // Help button → open shortcuts tab
  useEffect(() => {
    const openHelp = () => { setActiveTab('shortcuts'); setIsOpen(true); };
    const btn = document.getElementById('btn-help');
    btn?.addEventListener('click', openHelp);
    return () => btn?.removeEventListener('click', openHelp);
  }, []);

  const applyTheme = (name: string) => {
    const r = document.documentElement;
    r.setAttribute('data-theme', name);
    const vars = THEME_VARS[name];
    if (vars) Object.entries(vars).forEach(([k, v]) => r.style.setProperty(k, v));
    setTheme(name);
    localStorage.setItem('hub-theme', name);
  };

  const applyAccent = (color: string) => {
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-glow', color + '26');
    setAccent(color);
    localStorage.setItem('hub-accent', color);
  };

  const handleFontSize = (val: string) => {
    setFontSize(val);
    document.documentElement.style.setProperty('font-size', val + 'px');
    localStorage.setItem('hub-font-size', val);
  };

  const saveProfile = () => {
    localStorage.setItem('hub-profile', JSON.stringify({ name: profileName, email: profileEmail }));
  };

  const saveIcal = () => {
    localStorage.setItem('hub-ical-url', icalEnabled ? icalUrl : '');
    localStorage.setItem('hub-ical-enabled', icalEnabled ? 'true' : 'false');
  };

  const exportHub = (format: string) => {
    const h = JSON.parse(localStorage.getItem('hub') || '{}');
    let blob: Blob, name: string;
    if (format === 'json') {
      blob = new Blob([JSON.stringify(h, null, 2)], { type: 'application/json' });
      name = 'hub-export.json';
    } else {
      let md = '';
      (h.folders || []).forEach((f: any) => { f.notes?.forEach((n: any) => { md += `# ${n.title}\n\n${n.body}\n\n---\n\n`; }); });
      blob = new Blob([md], { type: 'text/markdown' });
      name = 'hub-export.md';
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
  };

  const clearHub = () => {
    if (confirm('This will permanently delete all notes and folders. Are you sure?')) {
      localStorage.removeItem('hub');
      location.reload();
    }
  };

  if (!isOpen) return null;

  const noteCount = hub.folders.reduce((a, f) => a + f.notes.length, 0);

  return (
    <div className="settings-overlay open" onClick={() => setIsOpen(false)}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="settings-header">
          <div className="settings-header-left">
            <Icon name="settings" size={16} />
            <span>Settings</span>
          </div>
          <div className="settings-close" onClick={() => setIsOpen(false)}>
            <Icon name="close" size={14} />
          </div>
        </div>

        <div className="settings-body">

          {/* Sidebar nav */}
          <nav className="settings-nav">
            {NAV_ITEMS.map(item => (
              <React.Fragment key={item.tab}>
                {item.section && <div className="settings-nav-section-label">{item.section}</div>}
                <div
                  className={`settings-nav-item ${activeTab === item.tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.tab)}
                >
                  <Icon name={item.icon} size={14} />
                  {item.label}
                </div>
              </React.Fragment>
            ))}
          </nav>

          {/* Tab content */}
          <div className="settings-content">

            {/* ── APPEARANCE ── */}
            {activeTab === 'appearance' && (
              <div className="settings-tab active">
                <div className="settings-tab-title">Appearance</div>

                <div className="settings-group">
                  <div className="settings-group-label">Theme</div>
                  <div className="theme-grid">
                    {THEMES.map(t => (
                      <div key={t.name} className={`theme-card ${theme === t.name ? 'active' : ''}`} onClick={() => applyTheme(t.name)}>
                        <div className={`theme-preview ${t.name}-preview`}>
                          <div className="tp-sidebar" />
                          <div className="tp-content">
                            <div className="tp-line long" />
                            <div className="tp-line med" />
                            <div className="tp-line short" />
                          </div>
                        </div>
                        <span>{t.label}</span>
                        <div className="theme-check">✓</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="settings-group">
                  <div className="settings-group-label">Accent Color</div>
                  <div className="accent-grid">
                    {ACCENTS.map(a => (
                      <div key={a.color} className={`accent-dot ${accent === a.color ? 'active' : ''}`}
                        style={{ background: a.color }} title={a.name} onClick={() => applyAccent(a.color)} />
                    ))}
                    <div className="accent-dot custom-accent" title="Custom">
                      <input type="color" value={accent} onChange={e => applyAccent(e.target.value)} />
                      <Icon name="settings" size={12} />
                    </div>
                  </div>
                </div>

                <div className="settings-group">
                  <div className="settings-group-label">Font Size</div>
                  <div className="slider-row">
                    <span className="slider-label">11px</span>
                    <input type="range" className="settings-slider" min={11} max={18} value={fontSize}
                      onChange={e => handleFontSize(e.target.value)} />
                    <span className="slider-label">18px</span>
                    <span className="slider-value">{fontSize}px</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── EDITOR ── */}
            {activeTab === 'editor' && (
              <div className="settings-tab active">
                <div className="settings-tab-title">Editor</div>
                <div className="settings-group">
                  <div className="settings-group-label">Editing</div>
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-label">Spell check</div>
                      <div className="settings-row-desc">Underline misspelled words in the editor</div>
                    </div>
                    <label className="toggle"><input type="checkbox" defaultChecked /><span className="toggle-track"><span className="toggle-thumb" /></span></label>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-label">Line numbers</div>
                      <div className="settings-row-desc">Show line numbers in the editor gutter</div>
                    </div>
                    <label className="toggle"><input type="checkbox" /><span className="toggle-track"><span className="toggle-thumb" /></span></label>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-label">Focus mode</div>
                      <div className="settings-row-desc">Dim surrounding paragraphs while writing</div>
                    </div>
                    <label className="toggle"><input type="checkbox" /><span className="toggle-track"><span className="toggle-thumb" /></span></label>
                  </div>
                </div>
              </div>
            )}

            {/* ── FILES ── */}
            {activeTab === 'files' && (
              <div className="settings-tab active">
                <div className="settings-tab-title">Files & hub</div>
                <div className="settings-group">
                  <div className="settings-group-label">hub</div>
                  <div className="settings-info-card">
                    <div className="info-row"><span className="info-label">Location</span><span className="info-value">localStorage / browser</span></div>
                    <div className="info-row"><span className="info-label">Total notes</span><span className="info-value">{noteCount}</span></div>
                    <div className="info-row"><span className="info-label">Total folders</span><span className="info-value">{hub.folders.length}</span></div>
                  </div>
                </div>
                <div className="settings-group">
                  <div className="settings-group-label">Export</div>
                  <div className="btn-row">
                    <button className="settings-btn" onClick={() => exportHub('json')}>
                      <Icon name="files" size={13} /> Export as JSON
                    </button>
                    <button className="settings-btn" onClick={() => exportHub('md')}>
                      <Icon name="files" size={13} /> Export as Markdown
                    </button>
                  </div>
                </div>
                <div className="settings-group">
                  <div className="settings-group-label danger-label">Danger Zone</div>
                  <div className="danger-card">
                    <div className="danger-row">
                      <div>
                        <div className="settings-row-label">Clear all notes</div>
                        <div className="settings-row-desc">Permanently delete all notes and folders</div>
                      </div>
                      <button className="settings-btn danger" onClick={clearHub}>Clear hub</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── CALENDAR ── */}
            {activeTab === 'calendar' && (
              <div className="settings-tab active">
                <div className="settings-tab-title">Calendar</div>
                <div className="settings-group">
                  <div className="settings-group-label">Google Calendar — iCal Feed</div>
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-label">Display Google Calendar events</div>
                      <div className="settings-row-desc">Events are read-only and shown alongside your local events</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={icalEnabled} onChange={e => setIcalEnabled(e.target.checked)} />
                      <span className="toggle-track"><span className="toggle-thumb" /></span>
                    </label>
                  </div>
                </div>
                <div className="settings-group">
                  <div className="settings-group-label">iCal URL</div>
                  <input type="text" className="profile-input" value={icalUrl} onChange={e => setIcalUrl(e.target.value)}
                    placeholder="Paste your Google Calendar secret iCal address here…" style={{ width: '100%', marginBottom: 6 }} />
                  <div className="settings-hint">To find your iCal URL: Google Calendar → Settings → your calendar → "Secret address in iCal format"</div>
                  <div style={{ marginTop: 12 }}>
                    <button className="settings-btn accent" onClick={saveIcal}>Save & Sync</button>
                    <button className="settings-btn" style={{ marginLeft: 8 }} onClick={() => { setIcalUrl(''); setIcalEnabled(false); saveIcal(); }}>Disconnect</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── ACCOUNT ── */}
            {activeTab === 'account' && (
              <div className="settings-tab active">
                <div className="settings-tab-title">Account</div>
                <div className="settings-group">
                  <div className="settings-group-label">Profile</div>
                  <div className="profile-card">
                    <div className="avatar"><Icon name="signin" size={26} /></div>
                    <div className="profile-info">
                      <input className="profile-input" type="text" placeholder="Your name" value={profileName} onChange={e => setProfileName(e.target.value)} />
                      <input className="profile-input" type="email" placeholder="your@email.com" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} />
                    </div>
                  </div>
                  <button className="settings-btn accent" style={{ marginTop: 12 }} onClick={saveProfile}>Save Profile</button>
                </div>
                <div className="settings-group">
                  <div className="settings-group-label danger-label">Session</div>
                  <div className="danger-card">
                    <div className="danger-row">
                      <div>
                        <div className="settings-row-label">Sign out</div>
                        <div className="settings-row-desc">You will be returned to the login page</div>
                      </div>
                      <button className="settings-btn danger" onClick={signOut}>Sign Out</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SHORTCUTS ── */}
            {activeTab === 'shortcuts' && (
              <div className="settings-tab active">
                <div className="settings-tab-title">Keyboard Shortcuts</div>
                <div className="settings-group">
                  <div className="settings-group-label">Navigation</div>
                  <div className="shortcut-list">
                    <div className="shortcut-row"><span>New note</span><div className="keys"><kbd>Ctrl</kbd><kbd>N</kbd></div></div>
                    <div className="shortcut-row"><span>New folder</span><div className="keys"><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>N</kbd></div></div>
                    <div className="shortcut-row"><span>Open search</span><div className="keys"><kbd>Ctrl</kbd><kbd>K</kbd></div></div>
                    <div className="shortcut-row"><span>Toggle sidebar</span><div className="keys"><kbd>Ctrl</kbd><kbd>B</kbd></div></div>
                    <div className="shortcut-row"><span>Close tab</span><div className="keys"><kbd>Ctrl</kbd><kbd>W</kbd></div></div>
                    <div className="shortcut-row"><span>Settings</span><div className="keys"><kbd>Ctrl</kbd><kbd>,</kbd></div></div>
                  </div>
                </div>
                <div className="settings-group">
                  <div className="settings-group-label">Editor</div>
                  <div className="shortcut-list">
                    <div className="shortcut-row"><span>Bold</span><div className="keys"><kbd>Ctrl</kbd><kbd>B</kbd></div></div>
                    <div className="shortcut-row"><span>Italic</span><div className="keys"><kbd>Ctrl</kbd><kbd>I</kbd></div></div>
                    <div className="shortcut-row"><span>Toggle preview</span><div className="keys"><kbd>Ctrl</kbd><kbd>E</kbd></div></div>
                    <div className="shortcut-row"><span>Save</span><div className="keys"><kbd>Ctrl</kbd><kbd>S</kbd></div></div>
                    <div className="shortcut-row"><span>Indent</span><div className="keys"><kbd>Tab</kbd></div></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ABOUT ── */}
            {activeTab === 'about' && (
              <div className="settings-tab active">
                <div className="settings-tab-title">About</div>
                <div className="settings-group">
                  <div className="about-logo">
                    <Icon name="logo" size={48} />
                    <div className="about-name">hub</div>
                    <div className="about-version">Version 1.0.0</div>
                  </div>
                  <div className="settings-info-card" style={{ marginTop: 20 }}>
                    <div className="info-row"><span className="info-label">Built with</span><span className="info-value">React · TypeScript · Vite</span></div>
                    <div className="info-row"><span className="info-label">Storage</span><span className="info-value">localStorage + Firebase</span></div>
                    <div className="info-row"><span className="info-label">Fonts</span><span className="info-value">Instrument Serif · JetBrains Mono</span></div>
                  </div>
                  <div className="about-desc">
                    A lightweight, offline-first note-taking app inspired by Obsidian. Your notes stay in your browser — no server, no sync, no account required.
                  </div>
                </div>
              </div>
            )}

          </div>{/* /settings-content */}
        </div>{/* /settings-body */}
      </div>{/* /settings-panel */}
    </div>
  );
}
