import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load all env vars from the project root (no prefix filter)
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss()],

    define: {
      // Expose non-VITE_ vars that the frontend needs via import.meta.env
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
    },

    build: {
      // Emit a clean dist/ every build
      emptyOutDir: true,
      sourcemap: false,
    },
  };
});
