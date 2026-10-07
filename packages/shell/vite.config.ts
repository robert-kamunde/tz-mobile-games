import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    // Phaser alone is ~1.2 MB minified; warn only above that so real regressions still show.
    chunkSizeWarningLimit: 1600,
  },
  server: { host: true },
});
