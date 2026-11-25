/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // In development the SPA calls /api on its own origin and Vite forwards to Spring Boot.
      // This keeps the refresh-token cookie first-party (SameSite=Strict) without CORS complications.
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: false,
        },
      },
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
