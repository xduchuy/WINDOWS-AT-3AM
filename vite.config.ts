import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 5000,
  },
  optimizeDeps: {
    exclude: ['@babylonjs/core', '@babylonjs/loaders', '@babylonjs/materials'],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
