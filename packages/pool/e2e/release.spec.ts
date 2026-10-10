import { expect, test, type Page } from '@playwright/test';
import { bootTo, trackErrors } from '../../../tooling/e2eHelpers';
import { MENU_SCENE, SCENE, boot, menuState, pullPower, reopen, state, tap, waitForScene, waitUntilSettled } from './poolPage';

/** Presses Android's back button (the app routes the real one to the same place). */
const back = (page: Page) => page.evaluate(() => window.__tzg!.back());
const leaves = (page: Page) => page.evaluate(() => window.__tzg!.backLeaves());
const textOf = (page: Page, scene: string, name: string) => page.evaluate(([s, n]) => window.__tzg!.textOf(s, n), [scene, name] as const);

/** From the menu: Play, two players, without closing the "how to play" panel. */
async function startFirstGame(page: Page): Promise<void> {
  await tap(page, 'menu-play', MENU_SCENE);
  await tap(page, 'opponent-two', MENU_SCENE);
  await waitForScene(page, SCENE);
}

test('the first game explains the controls once, and the table waits until it is closed', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await startFirstGame(page);
  expect((await state(page)).howToPlayShown).toBe(true);
  expect(await textOf(page, SCENE, 'howToPlay-body')).toContain('kipimo cha nguvu');

  // A pull on the power bar meanwhile does nothing.
  await pullPower(page, 1);
  expect((await state(page)).shots).toBe(0);

  await tap(page, 'howToPlay-ok');
  await expect.poll(async () => (await state(page)).howToPlayShown).toBe(false);
  await pullPower(page, 1);
  expect((await waitUntilSettled(page)).shots).toBe(1);

  // Not again: neither on a new game nor after reopening the app.
  await tap(page, 'newGameButton');
  await tap(page, 'newGameButton');
  await tap(page, 'opponent-two');
  expect((await state(page)).howToPlayShown).toBe(false);
  await reopen(page);
  await startFirstGame(page);
  expect((await state(page)).howToPlayShown).toBe(false);
  expect(errors).toEqual([]);
});

test('back on the menu closes a panel or the picker first, then leaves the app', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await tap(page, 'menu-stats', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('stats');
  await back(page);
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();

  await tap(page, 'menu-play', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('picker');
  await back(page);
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
  expect(await leaves(page)).toBe(0);

  await back(page);
  expect(await leaves(page)).toBe(1);
  expect(await page.evaluate(() => window.__tzg!.activeScenes())).toEqual([MENU_SCENE]);
  expect(errors).toEqual([]);
});

test('back on the table closes the help or the picker, waits while balls roll, then goes to the menu with the game kept', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await startFirstGame(page);
  await back(page);
  await expect.poll(async () => (await state(page)).howToPlayShown).toBe(false);
  expect(await page.evaluate(() => window.__tzg!.activeScenes())).toEqual([SCENE]);

  await pullPower(page, 1);
  await expect.poll(async () => (await state(page)).moving).toBe(true);
  await back(page);
  expect(await page.evaluate(() => window.__tzg!.activeScenes())).toEqual([SCENE]);
  const settled = await waitUntilSettled(page);

  await tap(page, 'newGameButton');
  await tap(page, 'newGameButton');
  await expect.poll(async () => (await state(page)).pickerShown).toBe(true);
  await back(page);
  await expect.poll(async () => (await state(page)).pickerShown).toBe(false);
  expect((await state(page)).shots).toBe(settled.shots);

  await back(page);
  await waitForScene(page, MENU_SCENE);
  expect((await menuState(page)).continueShown).toBe(true);
  expect(await leaves(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('the game makes no outside network requests and keeps playing with the network off', async ({ page, baseURL }) => {
  const outside: string[] = [];
  const origin = new URL(baseURL!).origin;
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(origin) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    outside.push(url);
    return route.abort();
  });
  const errors = trackErrors(page);
  await boot(page);
  await page.context().setOffline(true);
  await pullPower(page, 1);
  expect((await waitUntilSettled(page)).shots).toBe(1);
  await tap(page, 'menuButton');
  await waitForScene(page, MENU_SCENE);
  await tap(page, 'menu-continue', MENU_SCENE);
  await waitForScene(page, SCENE);
  expect((await state(page)).shots).toBe(1);
  expect(outside).toEqual([]);
  expect(errors).toEqual([]);
});
