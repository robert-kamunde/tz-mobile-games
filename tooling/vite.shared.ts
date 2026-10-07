import { defineConfig, type UserConfig } from 'vite';

/** Vite settings shared by every game package. */
export function gameViteConfig(): UserConfig {
  return defineConfig({
    // Relative asset paths, so the build works wherever it is served from (including the Android wrapper).
    base: './',
    build: {
      target: 'es2020',
      // Phaser alone is ~1.2 MB minified; warn only above that so real regressions still show.
      chunkSizeWarningLimit: 1600,
    },
    server: { host: true },
  });
}
