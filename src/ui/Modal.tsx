import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';

export default function Modal() {
  const modal = useAppStore(state => state.modal);
  const closeModal = useAppStore(state => state.closeModal);
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modal.isOpen) {
      setVal('');
      if (modal.showInput) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [modal.isOpen, modal.showInput]);

  if (!modal.isOpen) return null;

  const handleConfirm = () => {
    if (modal.onConfirm) modal.onConfirm(val);
    closeModal();
  };

  return (
    <div 
      id="modal-overlay" 
      className="show" 
      onClick={closeModal} 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div 
        id="modal-box" 
        onClick={e => e.stopPropagation()} 
        style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: '12px', width: '320px', color: 'var(--text-main)', border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
      >
        <div id="modal-title" style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px', color: 'var(--text-bright)' }}>{modal.title}</div>
        
        {!modal.showInput && (
          <div id="modal-message" style={{ marginBottom: '24px', color: 'var(--text-mid)', lineHeight: 1.5 }}>
            {modal.message}
          </div>
        )}
        
        {modal.showInput && (
          <input 
            ref={inputRef}
            id="modal-input" 
            style={{ width: '100%', padding: '10px 12px', marginBottom: '24px', borderRadius: '6px', background: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border)', outline: 'none' }}
            placeholder={modal.placeholder} 
            value={val} 
            onChange={e => setVal(e.target.value)} 
            onKeyDown={e => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') closeModal();
            }}
          />
        )}
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="modal-btn cancel" onClick={closeModal} style={{ background: 'transparent', color: 'var(--text-mid)', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px' }}>Cancel</button>
          <button id="modal-confirm" onClick={handleConfirm} style={{ background: 'var(--accent)', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            {modal.showInput ? 'Create' : 'Yes'}
          </button>
        </div>
      </div>
    </div>
  );
}
