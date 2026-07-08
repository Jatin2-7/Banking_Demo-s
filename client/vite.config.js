import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Same-origin /api in dev avoids CORS and works when the browser is not on localhost (e.g. LAN IP).
      // Must match the backend port (server/.env PORT, default 3001).
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
});
