import { expect, test, type Page } from '@playwright/test';
import { bootTo, trackErrors } from '../../../tooling/e2eHelpers';
import {
  MENU_SCENE,
  SCENE,
  menuState,
  openMenuPage,
  playFromMenu,
  potTheBlack,
  reopen,
  seedWins,
  setUpBlackPot,
  state,
  tap,
  tapMenu,
  waitUntilSettled,
} from './poolPage';

/** "Imefunguliwa!" (0.35.0): a popup for each unlock, Tumia sasa, MPYA marks and the menu dots. */

const textOf = (page: Page, scene: string, name: string) => page.evaluate(([s, n]) => window.__tzg!.textOf(s, n), [scene, name] as const);
const storedJson = (page: Page, key: string) => page.evaluate((k) => JSON.parse(window.localStorage.getItem(k) ?? 'null') as { data: Record<string, unknown> } | null, key);

test('the win that opens a look shows it over the end panel; Tumia sasa puts it on, and it is marked new in Mapambo', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  // Two wins already: the third opens the Kitenge table.
  await seedWins(page, 2);
  await playFromMenu(page, 'easy');
  await setUpBlackPot(page);
  await potTheBlack(page);
  await waitUntilSettled(page);
  await expect.poll(async () => (await state(page)).unlockShown).toBe('table:kitenge');
  expect(await textOf(page, SCENE, 'unlock-name')).toBe('Kitenge');
  expect(await textOf(page, SCENE, 'unlock-kind')).toBe('Meza mpya');
  // The end panel waits: no countdown to the menu behind the popup.
  await page.waitForTimeout(500);
  expect(await textOf(page, SCENE, 'gameOver-menu')).toBe('Menyu');
  await tap(page, 'unlock-use');
  await expect.poll(async () => (await state(page)).unlockShown).toBeNull();
  expect((await storedJson(page, 'pool.progress'))!.data.table).toBe('kitenge');
  expect((await storedJson(page, 'pool.unlocks'))!.data).toEqual({ known: ['table:kitenge'], fresh: ['table:kitenge'] });

  // A red dot on Mapambo, then on Meza; the picker marks Kitenge MPYA, and once seen the dots go.
  await tap(page, 'gameOver-menu');
  await expect.poll(async () => (await menuState(page)).newDots).toEqual(['looks']);
  await openMenuPage(page, 'looks');
  await expect.poll(async () => (await menuState(page)).newDots).toEqual(['tables']);
  await tapMenu(page, 'menu-tables');
  await expect.poll(async () => (await menuState(page)).panel).toBe('tables');
  expect(await textOf(page, MENU_SCENE, 'table-kitenge-new')).toBe('MPYA');
  await tap(page, 'table-back', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).newDots).toEqual([]);
  await reopen(page);
  expect((await menuState(page)).newDots).toEqual([]);
  expect(errors).toEqual([]);
});

test('unlocks not yet shown pop up on the menu one after another, Back closes each, and they never show twice', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  // As if the app closed straight after the tenth win: three looks and Kichwa still to announce.
  await seedWins(page, 10);
  await page.evaluate(() => window.localStorage.setItem('pool.unlocks', JSON.stringify({ v: 1, data: { known: [], fresh: [] } })));
  await reopen(page);
  const shown: string[] = [];
  for (let i = 0; i < 4; i++) {
    await expect.poll(async () => (await menuState(page)).unlockShown).not.toBeNull();
    shown.push((await menuState(page)).unlockShown!);
    if (i % 2 === 0) await page.evaluate(() => window.__tzg!.back());
    else await tap(page, 'unlock-ok', MENU_SCENE);
  }
  expect(shown).toEqual(['table:kitenge', 'cue:kitenge', 'background:kanga', 'character:kichwa']);
  await expect.poll(async () => (await menuState(page)).unlockShown).toBeNull();
  // Closing a popup does not put the look on.
  expect((await menuState(page)).table).toBe('classic');

  // Kichwa is marked MPYA on the character picker, once.
  await tapMenu(page, 'menu-play');
  await expect.poll(async () => (await menuState(page)).panel).toBe('characters');
  expect(await textOf(page, MENU_SCENE, 'character-kichwa-new')).toBe('MPYA');
  await reopen(page);
  expect((await menuState(page)).unlockShown).toBeNull();
  await tapMenu(page, 'menu-play');
  await expect.poll(async () => (await menuState(page)).panel).toBe('characters');
  expect(await textOf(page, MENU_SCENE, 'character-kichwa-new')).toBeNull();
  expect(errors).toEqual([]);
});
