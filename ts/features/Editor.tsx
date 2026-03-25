import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store';
import { saveHub } from '../core/storage';
import { parseMarkdown, bindMarkdownListeners } from '../core/markdown';
import type { FormatType } from '../types/index';

export default function Editor() {
  const hub = useAppStore(state => state.hub);
  const setHub = useAppStore(state => state.setHub);
  const activeFileId = useAppStore(state => state.activeFileId);
  const currentUser = useAppStore(state => state.currentUser);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewMode, setPreviewMode] = useState(false);

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

  const fmt = (type: string) => {
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
      case 'highlight':     ins = `==${sel || 'highlighted text'}==`; break;
      case 'h1':            ins = `\n# ${sel || 'Heading 1'}\n`; break;
      case 'h2':            ins = `\n## ${sel || 'Heading 2'}\n`; break;
      case 'h3':            ins = `\n### ${sel || 'Heading 3'}\n`; break;
      case 'ul':            ins = `\n- ${sel || 'List item'}`; break;
      case 'ol':            ins = `\n1. ${sel || 'List item'}`; break;
      case 'check':         ins = `\n- [ ] ${sel || 'Task'}`; break;
      case 'code':          ins = sel.includes('\n') ? `\`\`\`\n${sel || 'code'}\n\`\`\`` : `\`${sel || 'code'}\``; break;
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
    setPreviewMode(!previewMode);
    if (!previewMode && previewRef.current) {
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

  const toolbarButtons: Array<{ id: string; type: string; label: string }> = [
    { id: 'btn-fmt-bold', type: 'bold', label: 'B' },
    { id: 'btn-fmt-italic', type: 'italic', label: 'I' },
    { id: 'btn-fmt-strike', type: 'strikethrough', label: 'S' },
    { id: 'btn-fmt-h1', type: 'h1', label: 'H1' },
    { id: 'btn-fmt-h2', type: 'h2', label: 'H2' },
    { id: 'btn-fmt-h3', type: 'h3', label: 'H3' },
    { id: 'btn-fmt-ul', type: 'ul', label: '•' },
    { id: 'btn-fmt-ol', type: 'ol', label: '1.' },
    { id: 'btn-fmt-check', type: 'check', label: '☐' },
    { id: 'btn-fmt-code', type: 'code', label: '</>' },
    { id: 'btn-fmt-quote', type: 'quote', label: '"' },
    { id: 'btn-fmt-link', type: 'link', label: '🔗' },
    { id: 'btn-fmt-hr', type: 'hr', label: '—' },
    { id: 'btn-fmt-table', type: 'table', label: '⊞' },
  ];

  return (
    <div id="editor-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div id="editor-toolbar" style={{ display: 'flex', gap: '2px', padding: '4px 8px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {toolbarButtons.map(btn => (
          <button key={btn.id} id={btn.id} className="fmt-btn" onClick={() => fmt(btn.type)} title={btn.type} style={{ background: 'none', border: 'none', color: 'var(--text-mid)', cursor: 'pointer', padding: '4px 8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            {btn.label}
          </button>
        ))}
        <button id="preview-btn" onClick={togglePreview} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: previewMode ? 'var(--accent)' : 'var(--text-mid)', cursor: 'pointer', padding: '4px 8px', fontSize: '12px' }}>
          {previewMode ? 'Edit' : 'Preview'}
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
        <span id="status-mode">{isGuest ? 'Read-Only (Sign in to edit)' : previewMode ? 'Preview' : 'Edit'}</span>
        <span id="word-count">{wordCount} words</span>
        <span id="status-saved">Saved</span>
      </div>
    </div>
  );
}
