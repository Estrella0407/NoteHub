import React, { useRef, useState, useEffect, useCallback } from 'react';
import './Editor.css';
import { useAppStore } from '../store';
import { saveHub } from '../core/storage';
import { parseMarkdown, bindMarkdownListeners } from '../core/markdown';
import type { FormatType } from '../types/index';
import { Icon } from '../ui/Icons';
import { DEFAULT_ACCENTS, NEBULA_ACCENTS, CATPPUCIN_ACCENTS } from '../ui/Theme';

export default function Editor() {
  const hub = useAppStore(state => state.hub);
  const setHub = useAppStore(state => state.setHub);
  const activeFileId = useAppStore(state => state.activeFileId);
  const currentUser = useAppStore(state => state.currentUser);

  const [activeAccents, setActiveAccents] = useState(DEFAULT_ACCENTS);

  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('notehub-prefs') || '{}');
      if (prefs.theme === 'nebula') setActiveAccents(NEBULA_ACCENTS);
      else if (prefs.theme === 'catppuccin') setActiveAccents(CATPPUCIN_ACCENTS);
    } catch {}
  }, []);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewMode, setPreviewMode] = useState(() => {
    return localStorage.getItem('notehub-preview-mode') === 'true';
  });
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);

  // Find the active note from the hub
  const activeNote = activeFileId
    ? hub.folders.flatMap(f => f.notes).find(n => n.id === activeFileId)
    : null;

  const [title, setTitle] = useState(activeNote?.title || '');
  const [body, setBody] = useState(activeNote?.body || '');

  // Sync when active file changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setBody(activeNote.body);
    }
  }, [activeFileId]);

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  const saveNote = useCallback(() => {
    if (!activeNote) return;
    const newHub = JSON.parse(JSON.stringify(hub));
    for (const f of newHub.folders) {
      const n = f.notes.find((n: any) => n.id === activeFileId);
      if (n) { n.title = title; n.body = body; break; }
    }
    setHub(newHub);
    saveHub();
  }, [activeNote, hub, activeFileId, title, body, setHub]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    // Auto-save after change
    if (!activeNote) return;
    const newHub = JSON.parse(JSON.stringify(hub));
    for (const f of newHub.folders) {
      const n = f.notes.find((n: any) => n.id === activeFileId);
      if (n) { n.title = e.target.value; break; }
    }
    setHub(newHub);
    saveHub();
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    if (!activeNote) return;
    const newHub = JSON.parse(JSON.stringify(hub));
    for (const f of newHub.folders) {
      const n = f.notes.find((n: any) => n.id === activeFileId);
      if (n) { n.body = e.target.value; break; }
    }
    setHub(newHub);
    saveHub();
  };

  const fmt = (type: string, payload?: string) => {
    if (!currentUser) { alert('Please Sign In to edit notes!'); return; }
    const ta = editorRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = ta.value.substring(s, e);
    let ins = '';

    switch (type as FormatType) {
      case 'bold':          ins = `**${sel || 'bold text'}**`; break;
      case 'italic':        ins = `*${sel || 'italic text'}*`; break;
      case 'strikethrough': ins = `~~${sel || 'strikethrough text'}~~`; break;
      case 'highlight':     ins = payload ? `=={${payload}}${sel || 'highlighted text'}==` : `==${sel || 'highlighted text'}==`; break;
      case 'h1':            ins = `\n# ${sel || 'Heading 1'}\n`; break;
      case 'h2':            ins = `\n## ${sel || 'Heading 2'}\n`; break;
      case 'h3':            ins = `\n### ${sel || 'Heading 3'}\n`; break;
      case 'ul':            ins = `\n- ${sel || 'List item'}`; break;
      case 'ol':            ins = `\n1. ${sel || 'List item'}`; break;
      case 'check':         ins = `\n- [ ] ${sel || 'Task'}`; break;
      case 'code':          ins = `\`${sel || 'code'}\``; break;
      case 'codeBlock':     ins = `\n\`\`\`\n${sel || 'code'}\n\`\`\`\n`; break;
      case 'formula':       ins = `\n$$ \n${sel || 'E = mc^2'}\n $$\n`; break;
      case 'quote':         ins = `\n> ${sel || 'Quote'}\n`; break;
      case 'hr':            ins = `\n\n---\n\n`; break;
      case 'link': { const url = prompt('Enter URL:', 'https://'); if (url) ins = `[${sel || 'link text'}](${url})`; break; }
      case 'image': { const imgUrl = prompt('Enter image URL:', 'https://'); if (imgUrl) ins = `![${sel || 'image description'}](${imgUrl})`; break; }
      case 'table': ins = `\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n`; break;
    }

    if (ins) {
      ta.focus();
      document.execCommand('insertText', false, ins);
      const newBody = ta.value;
      setBody(newBody);
      handleBodyChange({ target: { value: newBody } } as any);
    }
  };

  const togglePreview = () => {
    const newMode = !previewMode;
    setPreviewMode(newMode);
    localStorage.setItem('notehub-preview-mode', String(newMode));
    if (newMode && previewRef.current) {
      const html = parseMarkdown(body);
      previewRef.current.innerHTML = html;
      bindMarkdownListeners(previewRef.current);
    }
  };

  useEffect(() => {
    if (previewMode && previewRef.current) {
      const html = parseMarkdown(body);
      previewRef.current.innerHTML = html;
      bindMarkdownListeners(previewRef.current);
    }
  }, [previewMode, body]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (document.activeElement !== editorRef.current) return;
        switch (e.key.toLowerCase()) {
          case 'b': e.preventDefault(); fmt('bold'); break;
          case 'i': e.preventDefault(); fmt('italic'); break;
          case 'e': e.preventDefault(); togglePreview(); break;
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [previewMode]);

  if (!activeNote) {
    return (
      <div id="editor-main" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div id="empty-state" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          <p style={{ fontSize: '18px', fontFamily: 'var(--font-serif)' }}>No note selected</p>
          <p style={{ fontSize: '13px' }}>Select a note from the explorer to begin</p>
        </div>
      </div>
    );
  }

  const isGuest = !currentUser;
  const dateStr = new Date(activeNote.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const toolbarButtons = [
    { id: 'btn-fmt-bold', type: 'bold', label: 'B' },
    { id: 'btn-fmt-italic', type: 'italic', label: 'I' },
    { id: 'btn-fmt-strike', type: 'strikethrough', icon: 'striketrough' },
    { id: 'btn-fmt-highlight', type: 'highlight', icon: 'highlight' },
    { id: 'btn-fmt-h1', type: 'h1', label: 'H1' },
    { id: 'btn-fmt-h2', type: 'h2', label: 'H2' },
    { id: 'btn-fmt-h3', type: 'h3', label: 'H3' },
    { id: 'btn-fmt-ul', type: 'ul', label: '•' },
    { id: 'btn-fmt-ol', type: 'ol', label: '1.' },
    { id: 'btn-fmt-check', type: 'check', icon: 'checkbox' },
    { id: 'btn-fmt-code', type: 'code', icon: 'code' },
    { id: 'btn-fmt-code-block', type: 'codeBlock', icon: 'codeBlock' },
    { id: 'btn-fmt-formula', type: 'formula', icon: 'formula' },
    { id: 'btn-fmt-quote', type: 'quote', label: '"' },
    { id: 'btn-fmt-link', type: 'link', icon: 'link' },
    { id: 'btn-fmt-hr', type: 'hr', label: '—' },
    { id: 'btn-fmt-table', type: 'table', icon: 'table' },
  ];

  return (
    <div id="editor-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div id="editor-toolbar" style={{ display: 'flex', gap: '2px', padding: '4px 8px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {toolbarButtons.map(btn => {
          if (btn.type === 'highlight') {
            return (
              <div key={btn.id} style={{ position: 'relative', display: 'inline-flex' }}>
                <button id={btn.id} className="fmt-btn" onClick={() => setShowHighlightMenu(!showHighlightMenu)} title={btn.type} style={{ background: showHighlightMenu ? 'var(--bg-active)' : 'none', border: 'none', color: 'var(--text-mid)', cursor: 'pointer', padding: '4px 8px', fontSize: btn.icon ? '0' : '12px', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                  <Icon name={btn.icon!} size={14} />
                </button>
                {showHighlightMenu && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-editor)', border: '1px solid var(--border)', padding: '6px', display: 'flex', gap: '6px', borderRadius: '4px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                    {activeAccents.map(acc => (
                      <button key={acc.name} onClick={() => { fmt('highlight', acc.color); setShowHighlightMenu(false); }} title={acc.name} style={{ width: '16px', height: '16px', borderRadius: '50%', background: acc.color, border: 'none', cursor: 'pointer' }} />
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <button key={btn.id} id={btn.id} className="fmt-btn" onClick={() => fmt(btn.type)} title={btn.type} style={{ background: 'none', border: 'none', color: 'var(--text-mid)', cursor: 'pointer', padding: '4px 8px', fontSize: btn.icon ? '0' : '12px', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {btn.icon ? <Icon name={btn.icon} size={14} /> : btn.label}
            </button>
          );
        })}
        <button id="preview-btn" onClick={togglePreview} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: previewMode ? 'var(--accent)' : 'var(--text-mid)', cursor: 'pointer', padding: '4px 8px', fontSize: '12px' }}>
          {previewMode ? 'Edit' : <><Icon name="preview" size={13} /> Preview</>}
        </button>
      </div>

      {/* Title */}
      <div id="note-title-wrap" style={{ padding: '16px 24px 0' }}>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          readOnly={isGuest}
          style={{ width: '100%', fontSize: '24px', fontFamily: 'var(--font-serif)', background: 'none', border: 'none', color: 'var(--text-bright)', outline: 'none' }}
        />
      </div>

      {/* Meta */}
      <div id="note-meta" style={{ padding: '4px 24px', fontSize: '12px', color: 'var(--text-dim)' }}>
        <span id="meta-date">{dateStr}</span> · <span id="meta-words">{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Body */}
      <div id="note-body" style={{ flex: 1, padding: '8px 24px', overflow: 'auto' }}>
        <textarea
          ref={editorRef}
          id="editor"
          value={body}
          onChange={handleBodyChange}
          readOnly={isGuest}
          style={{
            display: previewMode ? 'none' : 'block',
            width: '100%', height: '100%', background: 'none', border: 'none',
            color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: '14px',
            lineHeight: '1.7', outline: 'none', resize: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); }
          }}
        />
        <div
          ref={previewRef}
          id="preview"
          className="markdown-preview"
          style={{ display: previewMode ? 'block' : 'none' }}
        />
      </div>

      {/* Status bar */}
      <div id="status-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', fontSize: '11px', color: 'var(--text-dim)', borderTop: '1px solid var(--border)' }}>
        <span id="status-note">{title || 'Untitled'}</span>
        <span id="status-mode">{isGuest ? 'Read-Only (Sign in to edit)' : wordCount + ' words'}</span>
        <span id="status-saved">Saved</span>
      </div>
    </div>
  );
}
