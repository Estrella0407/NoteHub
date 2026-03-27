export type ThemeName = 'dark' | 'light' | 'nebula' | 'catppuccin';

export const THEMES: { name: ThemeName; label: string }[] = [
  { name: 'dark', label: 'Dark' },
  { name: 'light', label: 'Light' },
  { name: 'nebula', label: 'Nebula' },
  { name: 'catppuccin', label: 'Catppuccin' },
];

export const DEFAULT_ACCENTS = [
  { color: '#c8903a', name: 'Amber' },
  { color: '#5a9a6a', name: 'Sage' },
  { color: '#5a7ec8', name: 'Blue' },
  { color: '#a05ac8', name: 'Violet' },
  { color: '#c85a7a', name: 'Rose' },
  { color: '#c8c05a', name: 'Gold' },
];

export const NEBULA_ACCENTS = [
  { color: '#f96b5b', name: 'Solar' },
  { color: '#8cc7c4', name: 'Nebula' },
  { color: '#2c687b', name: 'Nova' },
  { color: '#9b8ec7', name: 'Pulsar' },
  { color: '#ec8f8d', name: 'Crimson' },
  { color: '#ffe2af', name: 'Stardust' },
];

export const CATPPUCIN_ACCENTS = [
  { color: '#fab387', name: 'Peach' },
  { color: '#a6e3a1', name: 'Green' },
  { color: '#89b4fa', name: 'Blue' },
  { color: '#cba6f7', name: 'Mauve' },
  { color: '#f2cdcd', name: 'Flamingo' },
  { color: '#f9e2af', name: 'Yellow' },
];

export const THEME_VARS: Record<string, Record<string, string>> = {
  dark: { '--bg-base': '#0f0e0d', '--bg-sidebar': '#141210', '--bg-explorer': '#181614', '--bg-editor': '#111010', '--bg-hover': '#1e1b18', '--bg-active': '#252018', '--border': '#2a2520', '--border-soft': '#1e1b17', '--text-dim': '#5a5248', '--text-mid': '#8a7f72', '--text-main': '#cec5b8', '--text-bright': '#e8ddd0' },
  light: { '--bg-base': '#f5f2ee', '--bg-sidebar': '#ede9e3', '--bg-explorer': '#e8e3dc', '--bg-editor': '#f8f5f0', '--bg-hover': '#e0dbd3', '--bg-active': '#d9d2c0', '--border': '#d0c8bc', '--border-soft': '#dcd6ce', '--text-dim': '#b0a898', '--text-mid': '#7a6e60', '--text-main': '#3a332a', '--text-bright': '#1a1510' },
  nebula: { '--bg-base': '#0f0f14', '--bg-sidebar': '#15151c', '--bg-explorer': '#1b1b24', '--bg-editor': '#0f0f14', '--bg-hover': '#22222d', '--bg-active': '#292936', '--border': '#313141', '--border-soft': '#22222d', '--text-dim': '#656a76', '--text-mid': '#9196a1', '--text-main': '#cdd0d5', '--text-bright': '#f0f0f2' },
  catppuccin: { '--bg-base': '#1e1e2e', '--bg-sidebar': '#181825', '--bg-explorer': '#11111b', '--bg-editor': '#1e1e2e', '--bg-hover': '#313244', '--bg-active': '#45475a', '--border': '#585b70', '--border-soft': '#313244', '--text-dim': '#6c7086', '--text-mid': '#9399b2', '--text-main': '#cdd6f4', '--text-bright': '#a6adc8' },
};
