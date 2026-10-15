import { expect, test } from '@playwright/test';
import { trackErrors } from '../../../tooling/e2eHelpers';
import { MENU_SCENE, elementCenter, waitForScene } from './poolPage';

const SPLASH_SCENE = 'Splash';
const active = (page: import('@playwright/test').Page) => page.evaluate(() => window.__tzg!.activeScenes());

test('the game opens on the splash: the logo over the menu picture, then the menu with the logo in its place', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.waitForFunction((key) => window.__tzg?.activeScenes().includes(key), SPLASH_SCENE);
  await expect(page.locator('#page-backdrop')).toBeVisible();
  const logo = await page.evaluate((s) => window.__tzg!.boundsOf(s, 'splash-logo')!, SPLASH_SCENE);
  // Big, in the middle.
  expect((logo.top + logo.bottom) / 2).toBeCloseTo(360, -1);
  expect(await active(page)).toEqual([SPLASH_SCENE]);
  await waitForScene(page, MENU_SCENE);
  const title = await page.evaluate((s) => window.__tzg!.boundsOf(s, 'menu-title')!, MENU_SCENE);
  expect(logo.right - logo.left).toBeGreaterThan(title.right - title.left);
  await expect(page.locator('#page-backdrop')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a tap skips the wait on the splash', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.waitForFunction((key) => window.__tzg?.activeScenes().includes(key), SPLASH_SCENE);
  const started = Date.now();
  const p = await elementCenter(page, 'splash-background', SPLASH_SCENE);
  await page.touchscreen.tap(p.x, p.y);
  await waitForScene(page, MENU_SCENE);
  // The glide alone (SPLASH.outMs) and no hold.
  expect(Date.now() - started).toBeLessThan(1600);
  expect(errors).toEqual([]);
});

test('Back on the splash waits; the menu still follows', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.waitForFunction((key) => window.__tzg?.activeScenes().includes(key), SPLASH_SCENE);
  await page.evaluate(() => window.__tzg!.back());
  expect(await page.evaluate(() => window.__tzg!.exits())).toBe(0);
  await waitForScene(page, MENU_SCENE);
  expect(errors).toEqual([]);
});
