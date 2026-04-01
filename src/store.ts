import { create } from 'zustand';
import type { Hub, Tab } from './types/index';

interface AppState {
  hub: Hub;
  currentUser: any;
  activeFileId: string | null;
  currentPanel: 'files' | 'search' | 'graph' | 'calendar' | 'canvas' | 'ai' | 'tags';
  isMobileMenuOpen: boolean;
  openTabs: Tab[];
  isSettingsOpen: boolean;

  renamingFileId: string | null;
  modal: { isOpen: boolean; title: string; message: string; placeholder: string; showInput: boolean; onConfirm?: (value: string) => void };
  contextMenu: { isOpen: boolean; x: number; y: number; nid: string | null; fid: string | null };

  setHub: (hub: Hub) => void;
  setCurrentUser: (user: any) => void;
  setActiveFile: (id: string | null) => void;
  setPanel: (panel: string) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  setRenamingFileId: (id: string | null) => void;
  setOpenTabs: (tabs: Tab[]) => void;
  openModal: (cfg: { title: string; message?: string; placeholder?: string; showInput?: boolean; onConfirm: (value: string) => void }) => void;
  closeModal: () => void;
  setSettingsOpen: (isOpen: boolean) => void;
  openContextMenu: (x: number, y: number, nid: string, fid: string) => void;
  closeContextMenu: () => void;
  pickerFolderId: string | null;
  openPicker: (fid: string | undefined) => void;
  closePicker: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  hub: { folders: [] },
  currentUser: null,
  activeFileId: null,
  currentPanel: 'files',
  isMobileMenuOpen: false,
  isSettingsOpen: false,
  openTabs: [],
  renamingFileId: null,
  modal: { isOpen: false, title: '', message: '', placeholder: '', showInput: false },
  contextMenu: { isOpen: false, x: 0, y: 0, nid: null, fid: null },
  pickerFolderId: null,

  setHub: (hub) => set({ hub }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setActiveFile: (id) => set((state) => {
    if (!id) return { activeFileId: null };
    const note = state.hub.folders.flatMap(f => f.notes).find(n => n.id === id);
    if (!note) return { activeFileId: id };
    const fid = state.hub.folders.find(f => f.notes.some(n => n.id === id))?.id || '';
    const alreadyOpen = state.openTabs.some(t => t.id === id);
    return {
      activeFileId: id,
      openTabs: alreadyOpen ? state.openTabs : [...state.openTabs, { id, fid }],
      // Switch panel to canvas if the note is a canvas
      currentPanel: note.type === 'canvas' ? 'canvas' : (state.currentPanel === 'canvas' ? 'files' : state.currentPanel),
    };
  }),
  setPanel: (panel) => set({ currentPanel: panel as any }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  setRenamingFileId: (id) => set({ renamingFileId: id }),
  setOpenTabs: (tabs) => set({ openTabs: tabs }),
  openModal: (cfg) => set({ modal: { isOpen: true, title: cfg.title, message: cfg.message || '', placeholder: cfg.placeholder || '', showInput: cfg.showInput !== false, onConfirm: cfg.onConfirm } }),
  closeModal: () => set((state) => ({ modal: { ...state.modal, isOpen: false } })),
  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  openContextMenu: (x, y, nid, fid) => set({ contextMenu: { isOpen: true, x, y, nid, fid } }),
  closeContextMenu: () => set((state) => ({ contextMenu: { ...state.contextMenu, isOpen: false } })),
  openPicker: (fid) => set({ pickerFolderId: fid }),
  closePicker: () => set({ pickerFolderId: null }),
}));

