// ── AI PANEL (React) ──
// Uses ai.css for styling (imported in main.tsx).
// Full AI assistant with chat, voice input, and note/canvas/diagram generation.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store';
import { saveHub, saveCanvasData } from '../core/storage';
import type { Note } from '../types/index';

const CLOUD_FUNCTION_URL = 'https://cloudflare-ai.wxchong2480.workers.dev';
type AiMode = 'note' | 'canvas' | 'mermaid';

interface ChatBubble {
  id: number;
  role: 'user' | 'ai' | 'error';
  text: string;
  pill?: { label: string; noteId: string };
}

export default function AiPanel() {
  const hub = useAppStore(s => s.hub);
  const setHub = useAppStore(s => s.setHub);
  const currentUser = useAppStore(s => s.currentUser);
  const setActiveFile = useAppStore(s => s.setActiveFile);
  const setPanel = useAppStore(s => s.setPanel);

  const [mode, setMode] = useState<AiMode>('note');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Thinking');
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const historyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceAccumRef = useRef('');
  const nextId = useRef(0);

  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [bubbles]);

  const addBubble = useCallback((role: ChatBubble['role'], text: string, pill?: ChatBubble['pill']) => {
    setBubbles(prev => [...prev, { id: nextId.current++, role, text, pill }]);
  }, []);

  const placeholders: Record<AiMode, string> = {
    note: 'Describe a note to create…',
    canvas: 'Describe a diagram to draw…',
    mermaid: 'Describe a chart…',
  };

  const handleSubmit = async () => {
    if (loading) return;
    const text = prompt.trim();
    if (!text) return;
    if (!currentUser) { addBubble('error', 'Please sign in to use the AI assistant.'); return; }
    setPrompt('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    addBubble('user', text);
    setLoading(true);
    setLoadingText('Thinking');

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ prompt: text, mode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(`Cloud Function returned ${res.status}: ${body.error || 'unknown'}`);
      }
      const data = await res.json();
      setLoading(false);
      await renderResult(data, mode);
    } catch (err: any) {
      setLoading(false);
      addBubble('error', `Error: ${err.message || 'Request failed.'}`);
    }
  };

  const renderResult = async (data: any, m: AiMode) => {
    const fid = hub?.folders[0]?.id;
    if (!fid) { addBubble('error', 'No folder found.'); return; }

    if (m === 'note' && data.markdown) {
      setLoadingText('Writing note');
      await createNoteFromAI(data, fid);
    } else if (m === 'mermaid' && data.mermaid) {
      setLoadingText('Building diagram');
      await createMermaidNoteFromAI(data, fid);
    } else if (m === 'canvas' && data.fabricObjects) {
      setLoadingText('Drawing canvas');
      await createCanvasFromAI(data, fid);
    } else {
      addBubble('error', 'AI returned an unexpected response.');
    }
  };

  const createNoteFromAI = async (data: any, fid: string) => {
    const title = data.title || 'AI Note';
    const id = 'n' + Date.now() + Math.random().toString(36).slice(2, 8);
    const newHub = JSON.parse(JSON.stringify(hub));
    const folder = newHub.folders.find((f: any) => f.id === fid);
    if (!folder) return;
    const note: Note = { id, type: 'note', title, body: data.markdown, created: new Date().toISOString(), tags: ['ai-generated'] };
    folder.notes.unshift(note);
    folder.open = true;
    setHub(newHub);
    saveHub();
    setActiveFile(id);
    setPanel('files');
    addBubble('ai', `Created note "${title}"`, { label: 'Open note', noteId: id });
  };

  const createMermaidNoteFromAI = async (data: any, fid: string) => {
    const title = data.title || 'AI Diagram';
    const id = 'n' + Date.now() + Math.random().toString(36).slice(2, 8);
    const body = `# ${title}\n\n\`\`\`mermaid\n${data.mermaid.trim()}\n\`\`\`\n`;
    const newHub = JSON.parse(JSON.stringify(hub));
    const folder = newHub.folders.find((f: any) => f.id === fid);
    if (!folder) return;
    const note: Note = { id, type: 'note', title, body, created: new Date().toISOString(), tags: ['ai-generated', 'diagram'] };
    folder.notes.unshift(note);
    folder.open = true;
    setHub(newHub);
    saveHub();
    setActiveFile(id);
    setPanel('files');
    addBubble('ai', `Created diagram "${title}"`, { label: 'Open diagram', noteId: id });
  };

  const createCanvasFromAI = async (data: any, fid: string) => {
    const title = data.title || 'AI Canvas';
    const id = 'c' + Date.now() + Math.random().toString(36).slice(2, 8);
    const newHub = JSON.parse(JSON.stringify(hub));
    const folder = newHub.folders.find((f: any) => f.id === fid);
    if (!folder) return;
    const note: Note = { id, type: 'canvas', title, body: '', created: new Date().toISOString() };
    folder.notes.unshift(note);
    folder.open = true;
    setHub(newHub);
    saveHub();
    if (data.fabricObjects) {
      await saveCanvasData(id, JSON.stringify({ objects: data.fabricObjects }));
    }
    setActiveFile(id);
    setPanel('files');
    addBubble('ai', `Created canvas "${title}"`, { label: 'Open canvas', noteId: id });
  };

  // Voice input
  const toggleVoice = () => {
    if (voiceActive) { stopVoice(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { addBubble('error', 'Voice input not supported in this browser.'); return; }
    voiceAccumRef.current = '';
    setVoiceActive(true);
    setVoiceTranscript('Listening…');
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      voiceAccumRef.current += final;
      setVoiceTranscript((voiceAccumRef.current + interim).trim() || 'Listening…');
    };
    rec.onerror = () => stopVoice();
    rec.onend = () => stopVoice();
    rec.start();
    recognitionRef.current = rec;
  };

  const stopVoice = () => {
    setVoiceActive(false);
    setVoiceTranscript('');
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    const text = voiceAccumRef.current.trim();
    if (text) {
      setPrompt(text);
      setTimeout(handleSubmit, 400);
    }
    voiceAccumRef.current = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div id="explorer-ai-pane" style={{ display: 'flex' }}>

      {/* Voice overlay */}
      {voiceActive && (
        <div id="ai-voice-overlay" style={{ display: 'flex' }} onClick={stopVoice}>
          <div id="ai-voice-pulse" />
          <div id="ai-voice-transcript">{voiceTranscript}</div>
          <button>Stop & Send</button>
        </div>
      )}

      {/* Mode bar */}
      <div id="ai-mode-bar">
        {(['note', 'canvas', 'mermaid'] as AiMode[]).map(m => (
          <button key={m} className={`ai-mode-btn ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>
            {m === 'note' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
            {m === 'canvas' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>}
            {m === 'mermaid' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="17.5" y1="10" x2="17.5" y2="17.5"/><line x1="10" y1="17.5" x2="17.5" y2="17.5"/></svg>}
            {m === 'mermaid' ? 'Diagram' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Chat history */}
      <div id="ai-history" ref={historyRef}>
        {bubbles.map(b => (
          <div key={b.id} className={`ai-bubble ${b.role}`}>
            {b.text}
            {b.pill && (
              <div className="ai-result-pill" onClick={() => { setActiveFile(b.pill!.noteId); setPanel('files'); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                {b.pill.label}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Thinking status */}
      {loading && (
        <div id="ai-status" style={{ display: 'flex' }}>
          <span className="ai-thinking-dots"><span>.</span><span>.</span><span>.</span></span>
          <span id="ai-status-text">{loadingText}</span>
        </div>
      )}

      {/* Input row */}
      <div id="ai-input-row">
        <div id="ai-input-wrap">
          <textarea
            ref={textareaRef}
            id="ai-input"
            value={prompt}
            onChange={e => { setPrompt(e.target.value); autoResize(e.target); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[mode]}
            rows={2}
          />
        </div>
        <div id="ai-actions">
          <button className={`ai-action-btn ${voiceActive ? 'recording' : ''}`} id="ai-voice-btn" onClick={toggleVoice} title="Voice input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
          </button>
          <button className="ai-action-btn" id="ai-clear-btn" onClick={() => setBubbles([])} title="Clear chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
          <button className="ai-action-btn accent" id="ai-send-btn" onClick={handleSubmit} disabled={loading} title="Send (Enter)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
