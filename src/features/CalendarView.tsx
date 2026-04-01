import React, { useEffect, useRef, useState } from 'react';
import './CalendarView.css';
import { useAppStore } from '../store';

declare const FullCalendar: any;

interface CalEvent {
  id: string; title: string; start: string | null;
  end?: string | null; backgroundColor?: string; borderColor?: string;
  extendedProps?: { description?: string; source?: string };
}

const CORS_PROXY = 'https://corsproxy.io/?';
const COLORS = ['#7ee8a2', '#5bc8f5', '#f7c87b', '#f76b6b', '#b57fff', '#ff9eb5'];

function calLoad(): CalEvent[] { try { return JSON.parse(localStorage.getItem('hub-cal-events') || '[]'); } catch { return []; } }
function calSave(ev: CalEvent[]): void { try { localStorage.setItem('hub-cal-events', JSON.stringify(ev)); } catch (e) { console.error(e); } }

export default function CalendarView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const setPanel = useAppStore(state => state.setPanel);
  const fcRef = useRef<any>(null);
  const [calTitle, setCalTitle] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [evTitle, setEvTitle] = useState('');
  const [evStart, setEvStart] = useState('');
  const [evEnd, setEvEnd] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evColor, setEvColor] = useState('#7ee8a2');

  useEffect(() => {
    if (!containerRef.current || typeof FullCalendar === 'undefined') return;
    if (fcRef.current) { fcRef.current.destroy(); fcRef.current = null; }

    const fc = new FullCalendar.Calendar(containerRef.current, {
      initialView: 'dayGridMonth', height: '100%', headerToolbar: false,
      firstDay: 1, editable: true, selectable: true, dayMaxEvents: true,
      events: async (_fi: any, ok: any, fail: any) => {
        try {
          const icalUrl = localStorage.getItem('hub-ical-url') || '';
          let icalEvents: CalEvent[] = [];
          if (icalUrl) {
            try {
              const res = await fetch(CORS_PROXY + encodeURIComponent(icalUrl));
              if (res.ok) { /* parse ical if needed */ }
            } catch { /* ignore */ }
          }
          ok([...calLoad(), ...icalEvents]);
        } catch (e) { fail(e); }
      },
      datesSet(i: any) { setCalTitle(i.view.title); },
      dateClick(i: any) {
        setEditingId(null); setEvTitle(''); setEvDesc(''); setEvColor('#7ee8a2');
        setEvStart(i.dateStr + 'T09:00'); setEvEnd(i.dateStr + 'T10:00');
        setModalOpen(true);
      },
      eventClick(i: any) {
        const ev = i.event;
        if (ev.extendedProps?.source === 'ical') { alert(ev.title); return; }
        setEditingId(ev.id); setEvColor(ev.backgroundColor || '#7ee8a2');
        setEvTitle(ev.title || '');
        const fmt = (dt: Date | null) => { if (!dt) return ''; const d = new Date(dt); const p = (n: number) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); };
        setEvStart(fmt(ev.start)); setEvEnd(fmt(ev.end || ev.start));
        setEvDesc(ev.extendedProps?.description || '');
        setModalOpen(true);
      },
      eventDrop(i: any) { persistEvent(i.event); },
      eventResize(i: any) { persistEvent(i.event); },
    });
    fc.render(); fcRef.current = fc;
    setCalTitle(fc.view.title);

    return () => { fc.destroy(); };
  }, []);

  function persistEvent(fcEv: any) {
    if (fcEv.extendedProps?.source === 'ical') return;
    const evs = calLoad();
    const idx = evs.findIndex(e => e.id === fcEv.id);
    const u: CalEvent = { id: fcEv.id, title: fcEv.title, start: fcEv.start?.toISOString(), end: fcEv.end?.toISOString(), backgroundColor: fcEv.backgroundColor, borderColor: fcEv.borderColor, extendedProps: fcEv.extendedProps };
    if (idx !== -1) evs[idx] = u; else evs.push(u);
    calSave(evs);
  }

  function saveEvent() {
    const title = evTitle.trim() || 'Untitled Event';
    if (!evStart) return;
    const evs = calLoad();
    if (editingId) {
      const i = evs.findIndex(e => e.id === editingId);
      if (i !== -1) evs[i] = { ...evs[i], title, start: evStart, end: evEnd || evStart, backgroundColor: evColor, borderColor: evColor, extendedProps: { description: evDesc } };
    } else {
      const id = 'ev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      evs.push({ id, title, start: evStart, end: evEnd || evStart, backgroundColor: evColor, borderColor: evColor, extendedProps: { description: evDesc } });
    }
    calSave(evs);
    fcRef.current?.refetchEvents();
    setModalOpen(false);
  }

  function deleteEvent() {
    if (!editingId) return;
    calSave(calLoad().filter(e => e.id !== editingId));
    fcRef.current?.getEventById(editingId)?.remove();
    setModalOpen(false);
  }

  const btnStyle: React.CSSProperties = { background: 'none', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' };

  return (
    <div id="calendar-slot">
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: '8px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => setPanel('files')} style={btnStyle}>← Back</button>
        <button onClick={() => fcRef.current?.prev()} style={btnStyle}>‹</button>
        <button onClick={() => fcRef.current?.today()} style={btnStyle}>Today</button>
        <button onClick={() => fcRef.current?.next()} style={btnStyle}>›</button>
        <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-bright)', marginLeft: '8px' }}>{calTitle}</span>
        <button onClick={() => { setEditingId(null); setEvTitle(''); setEvDesc(''); setEvColor('#7ee8a2'); setEvStart(''); setEvEnd(''); setModalOpen(true); }} style={{ ...btnStyle, marginLeft: 'auto', background: 'var(--accent)', color: 'white', border: 'none' }}>+ Event</button>
      </div>
      <div ref={containerRef} id="fc-root" style={{ flex: 1 }} />

      {/* Event Modal */}
      {modalOpen && (
        <div onClick={() => setModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-base)', padding: '24px', borderRadius: '12px', width: '360px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px', color: 'var(--text-bright)' }}>{editingId ? 'Edit Event' : 'New Event'}</h3>
            <input value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="Event title" style={{ width: '100%', padding: '8px', marginBottom: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-main)', outline: 'none' }} />
            <input type="datetime-local" value={evStart} onChange={e => setEvStart(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-main)' }} />
            <input type="datetime-local" value={evEnd} onChange={e => setEvEnd(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-main)' }} />
            <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="Description" rows={2} style={{ width: '100%', padding: '8px', marginBottom: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-main)', resize: 'none' }} />
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setEvColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: evColor === c ? '2px solid var(--text-bright)' : '2px solid transparent' }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {editingId && <button onClick={deleteEvent} style={{ ...btnStyle, color: 'var(--danger, #f7768e)', borderColor: 'var(--danger, #f7768e)' }}>Delete</button>}
              <button onClick={() => setModalOpen(false)} style={btnStyle}>Cancel</button>
              <button onClick={saveEvent} style={{ ...btnStyle, background: 'var(--accent)', color: 'white', border: 'none' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
