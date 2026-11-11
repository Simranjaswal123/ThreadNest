import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // The browser talks to this dev server, which forwards /api calls to the backend.
    // That way the login cookie works without any cross-origin settings.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
