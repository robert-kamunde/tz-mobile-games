import { expect, test, type Page } from '@playwright/test';
import { bootTo, trackErrors } from '../../../tooling/e2eHelpers';
import {
  MENU_SCENE,
  SCENE,
  boot,
  elementCenter,
  layout,
  menuState,
  potTheBlack,
  pullPower,
  reopen,
  setUpBlackPot,
  state,
  tap,
  waitForScene,
  waitUntilSettled,
} from './poolPage';

/** Text of a named text object in a scene. */
const textOf = (page: Page, scene: string, name: string) => page.evaluate(([s, n]) => window.__tzg!.textOf(s, n), [scene, name] as const);

/** Whether a button is marked as the current or last choice. */
const highlighted = (page: Page, scene: string, name: string) =>
  page.evaluate(([s, n]) => window.__tzg!.dataOf(s, n, 'highlighted'), [scene, name] as const);

const storage = (page: Page, key: string) => page.evaluate((k) => window.localStorage.getItem(k), key);

/** Menu button on the table, then Continue on the menu. */
async function menuAndContinue(page: Page): Promise<void> {
  await tap(page, 'menuButton');
  await waitForScene(page, MENU_SCENE);
  expect((await menuState(page)).continueShown).toBe(true);
  await tap(page, 'menu-continue', MENU_SCENE);
  await waitForScene(page, SCENE);
}

test('the game opens on the menu, with no Continue before a game is played', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  expect(await menuState(page)).toEqual({ continueShown: false, panel: null, locale: 'sw' });
  for (const name of ['menu-play', 'menu-stats', 'menu-rules', 'menu-settings', 'placeholderLabel']) await elementCenter(page, name, MENU_SCENE);
  expect(await page.evaluate(() => window.__tzg!.elementCenter('Menu', 'menu-continue'))).toBeNull();

  // Rules open over the menu and Back closes them.
  await tap(page, 'menu-rules', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('rules');
  expect(await textOf(page, MENU_SCENE, 'rulesPanel-body')).toContain('mweusi');
  await tap(page, 'rules-back', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();

  // Back on the picker returns to the menu without starting a game.
  await tap(page, 'menu-play', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('picker');
  await tap(page, 'opponent-back', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
  expect(await page.evaluate(() => window.__tzg!.activeScenes())).toEqual([MENU_SCENE]);
  expect(errors).toEqual([]);
});

test('Menu keeps the game: Continue brings back the same table, also after the app is reopened', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  await pullPower(page, 1);
  const afterBreak = await waitUntilSettled(page);
  await menuAndContinue(page);
  const back = await state(page);
  expect(back.balls).toEqual(afterBreak.balls);
  expect(back.match).toEqual(afterBreak.match);
  expect(back.opponent).toEqual({ kind: 'human' });
  expect(back.shots).toBe(1);

  await reopen(page);
  expect((await menuState(page)).continueShown).toBe(true);
  await tap(page, 'menu-continue', MENU_SCENE);
  await waitForScene(page, SCENE);
  const reopened = await state(page);
  expect(reopened.balls).toEqual(afterBreak.balls);
  expect(reopened.match).toEqual(afterBreak.match);
  expect(errors).toEqual([]);
});

test('closing the app mid-shot resumes the game from just before that shot', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  await pullPower(page, 0.4);
  await waitUntilSettled(page);
  const beforeSecond = await state(page);
  expect(beforeSecond.shots).toBe(1);

  await pullPower(page, 0.9);
  await expect.poll(async () => (await state(page)).steps).toBeGreaterThan(50);
  expect((await state(page)).moving).toBe(true);
  await reopen(page);
  await tap(page, 'menu-continue', MENU_SCENE);
  await waitForScene(page, SCENE);
  const resumed = await state(page);
  expect(resumed.balls).toEqual(beforeSecond.balls);
  expect(resumed.match).toEqual(beforeSecond.match);
  expect(resumed.shots).toBe(1);
  expect(resumed.moving).toBe(false);
  expect(errors).toEqual([]);
});

test('a finished game leaves no Continue, and a win against the computer is counted in Stats', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page, 'easy');
  await setUpBlackPot(page);
  await potTheBlack(page);
  const over = await waitUntilSettled(page);
  expect(over.verdict).toEqual({ kind: 'game-over', winner: 0, reason: 'black-potted' });
  expect(await storage(page, 'pool.match')).toBeNull();

  await tap(page, 'menuButton');
  await waitForScene(page, MENU_SCENE);
  expect((await menuState(page)).continueShown).toBe(false);
  await tap(page, 'menu-stats', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('stats');
  const stats = await textOf(page, MENU_SCENE, 'statsPanel-body');
  expect(stats).toContain('Kompyuta (Rahisi): umeshinda 1 kati ya 1');
  expect(stats).toContain('Kompyuta (Ngumu): umeshinda 0 kati ya 0');
  expect(stats).toContain('Wachezaji wawili: michezo 0');

  // The picker marks the last opponent.
  await tap(page, 'stats-back', MENU_SCENE);
  await tap(page, 'menu-play', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('picker');
  expect(await highlighted(page, MENU_SCENE, 'opponent-easy')).toBe(true);
  expect(await highlighted(page, MENU_SCENE, 'opponent-hard')).toBe(false);
  expect(errors).toEqual([]);
});

test('the chosen language changes every label and is kept after reopening', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await tap(page, 'menu-settings', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('settings');
  await tap(page, 'language-en', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).locale).toBe('en');
  // Settings stays open, now in English.
  expect((await menuState(page)).panel).toBe('settings');
  expect(await highlighted(page, MENU_SCENE, 'language-en')).toBe(true);
  expect(await textOf(page, MENU_SCENE, 'menu-play')).toBe('Play');

  await reopen(page);
  expect((await menuState(page)).locale).toBe('en');
  expect(await textOf(page, MENU_SCENE, 'menu-play')).toBe('Play');
  await tap(page, 'menu-play', MENU_SCENE);
  await tap(page, 'opponent-two', MENU_SCENE);
  await waitForScene(page, SCENE);
  expect((await state(page)).status).toContain('Player 1');
  expect(await textOf(page, SCENE, 'menuButton')).toBe('Menu');
  expect(errors).toEqual([]);
});

test('a damaged saved game is set aside: the menu opens normally with no Continue', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await page.evaluate(() => {
    window.localStorage.setItem('pool.match', '{"v":1,"data":{"opponent":{"kind":"human"},"balls":"broken"}');
    window.localStorage.setItem('pool.progress', 'not json at all');
  });
  await reopen(page);
  expect((await menuState(page)).continueShown).toBe(false);
  expect(await storage(page, 'pool.match.backup')).toContain('broken');
  await tap(page, 'menu-stats', MENU_SCENE);
  expect(await textOf(page, MENU_SCENE, 'statsPanel-body')).toContain('umeshinda 0 kati ya 0');
  expect(await storage(page, 'pool.progress.backup')).toBe('not json at all');

  // A new game still starts and is saved over the damaged one.
  await tap(page, 'stats-back', MENU_SCENE);
  await tap(page, 'menu-play', MENU_SCENE);
  await tap(page, 'opponent-two', MENU_SCENE);
  await waitForScene(page, SCENE);
  expect(JSON.parse((await storage(page, 'pool.match'))!).data.shots).toBe(0);
  expect(errors).toEqual([]);
});

test('the computer resumes its own turn after the game is reopened', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page, 'easy');
  await layout(page, [], { phase: 'play', current: 1, ballInHand: 'anywhere', groups: ['yellow', 'red'] });
  await reopen(page);
  await tap(page, 'menu-continue', MENU_SCENE);
  await waitForScene(page, SCENE);
  expect((await state(page)).opponent).toEqual({ kind: 'computer', level: 'easy' });
  await expect.poll(async () => (await state(page)).shots, { timeout: 15_000 }).toBe(1);
  expect(errors).toEqual([]);
});
