import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Saat development, /api diteruskan ke server PHP supaya cookie sesi tetap satu origin.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_API_TARGET || 'http://127.0.0.1:8000', changeOrigin: false },
    },
  },
});
