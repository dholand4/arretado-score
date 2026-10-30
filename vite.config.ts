import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
  // Publica o código minificado e sem mapas do código-fonte.
  build: { sourcemap: false },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/utils/testSetup.ts'],
    css: false,
  },
});
