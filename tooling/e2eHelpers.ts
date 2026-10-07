import type { Page } from '@playwright/test';
import type { TestHooks } from '../packages/shell/src/testHooksApi';

export type { TestHooks };

/** Collects console errors and uncaught exceptions so every test can assert a clean run. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

/** Loads the page and waits until the given scene is running. */
export async function bootTo(page: Page, sceneKey: string): Promise<void> {
  await page.goto('/');
  await page.waitForFunction((key) => window.__tzg?.activeScenes().includes(key), sceneKey);
}

/** Simulates the app going to the background or coming back, as Android's WebView reports it. */
export async function setHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

export interface PagePoint {
  x: number;
  y: number;
}

/**
 * A one-finger touch drag through real touch events (Playwright's touchscreen only taps).
 * `holdMs` keeps the finger down at the end before lifting, like a player settling their aim.
 * `cancel` ends with a system touch cancel instead of the finger lifting.
 */
export async function touchDrag(
  page: Page,
  from: PagePoint,
  to: PagePoint,
  options: { steps?: number; holdMs?: number; cancel?: boolean } = {},
): Promise<void> {
  const steps = options.steps ?? 8;
  const cdp = await page.context().newCDPSession(page);
  const point = (p: PagePoint) => [{ x: p.x, y: p.y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(from) });
  for (let i = 1; i <= steps; i++) {
    const p = { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(p) });
  }
  if (options.holdMs) await page.waitForTimeout(options.holdMs);
  // touchCancel is what the system sends when it takes the touch away (e.g. a swipe-down gesture).
  await cdp.send('Input.dispatchTouchEvent', { type: options.cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  await cdp.detach();
}
