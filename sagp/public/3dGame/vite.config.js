import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist3',
    rollupOptions: {
      input: './src/main.js',
      output: {
        entryFileNames: 'assets/game.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        format: 'iife',
        name: 'CyberGuard',
      },
    },
  },
  server: {
    port: 3000,
  },
});
