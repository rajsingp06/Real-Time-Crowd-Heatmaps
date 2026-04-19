import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080,
    strictPort: true,
    host: true
  },
  preview: {
    port: 8080,
    strictPort: true,
  }
});
