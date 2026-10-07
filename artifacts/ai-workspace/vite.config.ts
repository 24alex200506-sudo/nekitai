import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const frontPort = Number(process.env.PORT ?? '3000');
const apiPort = Number(process.env.API_PORT ?? '5000');
const basePath = process.env.BASE_PATH ?? '/';
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    // В проде — пустая строка (запросы /api идут на тот же домен Vercel)
    // В деве — проксируем на локальный API сервер
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL ?? ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port: frontPort,
    strictPort: false,
    host: '0.0.0.0',
    proxy: isDev ? {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    } : undefined,
  },
  preview: {
    port: frontPort,
    host: '0.0.0.0',
  },
});
