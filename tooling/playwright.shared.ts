import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

/**
 * Shared Playwright setup for every game package. Tests run against a production-like build
 * (vite build --mode e2e) served by vite preview, on the phone shapes we care about, with touch on.
 */
const TIMING = /@timing/;

const PHONES = [
  { name: 'small-phone-landscape', use: { ...devices['Desktop Chrome'], viewport: { width: 640, height: 360 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } },
  { name: 'tall-phone-landscape', use: { ...devices['Desktop Chrome'], viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.6, hasTouch: true, isMobile: true } },
  { name: 'tablet-landscape', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, hasTouch: true, isMobile: true } },
];

/** Local storage every test starts with (`name` to `value`), e.g. a first-launch choice already made. */
export type StartingStorage = Readonly<Record<string, string>>;

export function phoneTestConfig(options: { packageDir: string; port: number; storage?: StartingStorage }): PlaywrightTestConfig {
  const { packageDir, port, storage } = options;
  const baseURL = `http://127.0.0.1:${port}`;
  const storageState = storage ? { cookies: [], origins: [{ origin: baseURL, localStorage: Object.entries(storage).map(([name, value]) => ({ name, value })) }] } : undefined;
  return defineConfig({
    testDir: './e2e',
    // Tests that play several shots run in a software renderer, four at a time; with a random rack
    // (0.16.0) they take 20 to 30 s, so 30 s left no room. Frame time is checked by @timing instead.
    timeout: 60_000,
    fullyParallel: true,
    reporter: [['list']],
    use: { baseURL, hasTouch: true, isMobile: true, ...(storageState ? { storageState } : {}) },
    webServer: {
      command: `npx vite preview --outDir dist-e2e --port ${port} --strictPort --host 127.0.0.1`,
      cwd: packageDir,
      url: `http://127.0.0.1:${port}`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    projects: [
      ...PHONES.map((phone) => ({ ...phone, grepInvert: TIMING })),
      // Frame-time checks (titles tagged @timing) measure CPU time per frame, which other tests running
      // at the same time would inflate. They run after all the others, one at a time, on the small phone
      // (the game draws at one design size, A8, so the screen size does not change the work).
      { ...PHONES[0]!, name: 'timing', grep: TIMING, workers: 1, dependencies: PHONES.map((p) => p.name) },
    ],
  });
}
