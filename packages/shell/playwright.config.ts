import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests run against a production-like build (vite build --mode e2e) served by vite preview.
 * Projects cover the phone shapes we care about. Touch is enabled so taps go through the touch path.
 */
const PORT = 4173;
const HERE = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    hasTouch: true,
    isMobile: true,
  },
  webServer: {
    command: `npx vite preview --outDir dist-e2e --port ${PORT} --strictPort --host 127.0.0.1`,
    cwd: HERE,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    { name: 'small-phone-landscape', use: { ...devices['Desktop Chrome'], viewport: { width: 640, height: 360 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } },
    { name: 'tall-phone-landscape', use: { ...devices['Desktop Chrome'], viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.6, hasTouch: true, isMobile: true } },
    { name: 'tablet-landscape', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, hasTouch: true, isMobile: true } },
  ],
});
