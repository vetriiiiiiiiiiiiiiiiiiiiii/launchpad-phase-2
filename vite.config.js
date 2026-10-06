import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, strictPort: true,
    proxy: { '/api': 'http://localhost:8787', '/uploads': 'http://localhost:8787' },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // three.js is only needed near the launches; keep it in its own chunk
        manualChunks: { three: ['three'] },
      },
    },
  },
});
