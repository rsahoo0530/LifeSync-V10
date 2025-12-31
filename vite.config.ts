import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // Cleaned up—Gemini likely uses import.meta.env.VITE_GEMINI_API_KEY now, but this keeps backward compat
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),  // Better: point to /src instead of root (common convention)
      },
    },
    base: '/',  // Important for Vercel—ensures assets load from root
    build: {
      outDir: 'dist',  // Explicit, just in case
    },
  };
});
