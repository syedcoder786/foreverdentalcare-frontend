/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // On localhost the SPA calls /api on its own origin and Vite forwards to the local Spring Boot backend.
  // This keeps the refresh-token cookie first-party (SameSite=Strict) without CORS complications.
  // On Vercel the same /api calls are forwarded to the Oracle Cloud backend by vercel.json.
  const apiProxy = {
    '/api': {
      target: env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:8080',
      changeOrigin: false,
    },
  };
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: apiProxy,
    },
    // `npm run preview` (local test of the production build) uses the same local backend.
    preview: {
      port: 4173,
      proxy: apiProxy,
    },
    build: {
      rollupOptions: {
        output: {
          // Long-lived vendor chunks: app deploys don't invalidate cached libraries.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            motion: ['motion/react'],
            data: ['@tanstack/react-query', 'axios'],
            forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  };
});
