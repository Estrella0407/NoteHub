import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Serve from project root
  root: '.',
  plugins: [react()],
  // Point Vite to our TS entry
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // Optimise big deps so Vite pre-bundles them
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'd3', 'fabric', '@excalidraw/excalidraw'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  }
});
