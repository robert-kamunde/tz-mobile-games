import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

/**
 * Shared Playwright setup for every game package. Tests run against a production-like build
 * (vite build --mode e2e) served by vite preview, on the phone shapes we care about, with touch on.
 */
export function phoneTestConfig(options: { packageDir: string; port: number }): PlaywrightTestConfig {
  const { packageDir, port } = options;
  return defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    fullyParallel: true,
    reporter: [['list']],
    use: { baseURL: `http://127.0.0.1:${port}`, hasTouch: true, isMobile: true },
    webServer: {
      command: `npx vite preview --outDir dist-e2e --port ${port} --strictPort --host 127.0.0.1`,
      cwd: packageDir,
      url: `http://127.0.0.1:${port}`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    projects: [
      { name: 'small-phone-landscape', use: { ...devices['Desktop Chrome'], viewport: { width: 640, height: 360 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } },
      { name: 'tall-phone-landscape', use: { ...devices['Desktop Chrome'], viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.6, hasTouch: true, isMobile: true } },
      { name: 'tablet-landscape', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, hasTouch: true, isMobile: true } },
    ],
  });
}
