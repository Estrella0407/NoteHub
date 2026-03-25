import type { Hub, Tab } from '../types/index';

export const appState = {
  hub: { folders: [] } as Hub,
  currentUser: null as {
    uid: string;
    displayName: string | null;
    email: string | null;
    getIdToken: () => Promise<string>;
  } | null,
  
  openTabs: [] as Tab[],
  activeTab: null as string | null,
  
  previewMode: false,
  highlightColor: undefined as string | undefined,
  currentPanel: undefined as string | undefined,
  componentsLoaded: false,
  
  onAuthChangedCallback: undefined as ((user: any) => void) | undefined,
};
