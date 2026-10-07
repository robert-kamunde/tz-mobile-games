import { expect, test, type Page } from '@playwright/test';

/** Collects console errors and uncaught exceptions so every test can assert a clean run. */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__tzg?.activeScenes().includes('Placeholder'));
}

async function setHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

async function tapElement(page: Page, name: string): Promise<void> {
  const point = await page.evaluate((n) => window.__tzg!.elementCenter('Placeholder', n), name);
  expect(point, `element "${name}" should exist`).not.toBeNull();
  await page.touchscreen.tap(point!.x, point!.y);
}

test('boots cleanly and keeps rendering', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  const before = await page.evaluate(() => window.__tzg!.frames());
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => window.__tzg!.frames());
  expect(after).toBeGreaterThan(before);
  expect(errors).toEqual([]);
});

test('canvas fits the screen at 16:9 with no page scrolling', async ({ page }) => {
  await boot(page);
  const m = await page.evaluate(() => {
    const r = document.querySelector('canvas')!.getBoundingClientRect();
    return {
      left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height,
      vw: window.innerWidth, vh: window.innerHeight,
      scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight,
    };
  });
  expect(m.left).toBeGreaterThanOrEqual(-0.5);
  expect(m.top).toBeGreaterThanOrEqual(-0.5);
  expect(m.right).toBeLessThanOrEqual(m.vw + 0.5);
  expect(m.bottom).toBeLessThanOrEqual(m.vh + 0.5);
  expect(m.w / m.h).toBeCloseTo(16 / 9, 1);
  // Fills one dimension completely (letterboxed in the other).
  expect(Math.max(m.w / m.vw, m.h / m.vh)).toBeGreaterThan(0.98);
  expect(m.scrollW).toBeLessThanOrEqual(m.vw);
  expect(m.scrollH).toBeLessThanOrEqual(m.vh);
});

test('starts in Kiswahili, a tap switches language, and the choice survives a restart', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  expect(await page.evaluate(() => window.__tzg!.locale())).toBe('sw');
  await tapElement(page, 'languageButton');
  await expect.poll(() => page.evaluate(() => window.__tzg!.locale())).toBe('en');
  await page.reload();
  await page.waitForFunction(() => window.__tzg?.activeScenes().includes('Placeholder'));
  expect(await page.evaluate(() => window.__tzg!.locale())).toBe('en');
  expect(errors).toEqual([]);
});

test('rapid repeated taps leave a consistent state', async ({ page }) => {
  await boot(page);
  for (let i = 0; i < 9; i++) await tapElement(page, 'languageButton');
  await expect.poll(() => page.evaluate(() => window.__tzg!.locale())).toBe('en');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('shell-demo.settings')!).data.locale);
  expect(stored).toBe('en');
});

test('pauses when backgrounded, saves, and resumes', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  await page.evaluate(() => localStorage.clear());

  await setHidden(page, true);
  expect(await page.evaluate(() => window.__tzg!.paused())).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('shell-demo.settings'))).not.toBeNull();
  const hiddenFrames = await page.evaluate(() => window.__tzg!.frames());
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__tzg!.frames())).toBe(hiddenFrames);

  await setHidden(page, false);
  expect(await page.evaluate(() => window.__tzg!.paused())).toBe(false);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__tzg!.frames())).toBeGreaterThan(hiddenFrames);
  expect(errors).toEqual([]);
});

test('recovers from corrupted saved settings', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('shell-demo.settings', '{not json'));
  const errors = trackErrors(page);
  await boot(page);
  expect(await page.evaluate(() => window.__tzg!.locale())).toBe('sw');
  expect(errors).toEqual([]);
});

test('still runs when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, get: () => { throw new Error('SecurityError'); } });
  });
  const errors = trackErrors(page);
  await boot(page);
  await tapElement(page, 'languageButton');
  await expect.poll(() => page.evaluate(() => window.__tzg!.locale())).toBe('en');
  expect(errors).toEqual([]);
});

test('no rotate prompt when held sideways', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => window.__tzg!.rotatePromptVisible())).toBe(false);
  await expect(page.locator('#rotate-overlay')).toBeHidden();
});

test('asks to rotate when held upright, and clears after rotating', async ({ page }) => {
  await boot(page);
  const vp = page.viewportSize()!;
  await page.setViewportSize({ width: vp.height, height: vp.width });
  await expect(page.locator('#rotate-overlay')).toBeVisible();
  await expect(page.locator('#rotate-overlay')).toHaveText('Zungusha simu yako ilale ili ucheze');
  await page.setViewportSize(vp);
  await expect(page.locator('#rotate-overlay')).toBeHidden();
});

test('keeps a usable frame rate with a 6x slower CPU', async ({ page }) => {
  await boot(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  const start = await page.evaluate(() => window.__tzg!.frames());
  await page.waitForTimeout(2000);
  const fps = ((await page.evaluate(() => window.__tzg!.frames())) - start) / 2;
  test.info().annotations.push({ type: 'fps@6x', description: fps.toFixed(1) });
  console.log(`fps at 6x CPU throttle: ${fps.toFixed(1)}`);
  expect(fps).toBeGreaterThan(25);
});

test('a game opened in the background waits, then starts when shown', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  });
  const errors = trackErrors(page);
  await page.goto('/');
  await page.waitForFunction(() => window.__tzg !== undefined);
  expect(await page.evaluate(() => window.__tzg!.paused())).toBe(true);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__tzg!.frames())).toBe(0);
  await setHidden(page, false);
  await page.waitForFunction(() => window.__tzg?.activeScenes().includes('Placeholder'));
  expect(errors).toEqual([]);
});
