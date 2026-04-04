import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: 'localhost',
    port: 3020,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
