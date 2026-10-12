import { expect, test, type Page } from '@playwright/test';
import { bootTo, trackErrors } from '../../../tooling/e2eHelpers';
import { BACKGROUND_IDS } from '../src/config/backgrounds';
import { STORY } from '../src/config/story';
import { TABLE_IDS } from '../src/config/tables';
import { MENU_SCENE, SCENE, menuState, playFromMenu, pullPower, reopen, state, tap, waitForScene, waitUntilSettled } from './poolPage';

/** Story-only rewards stay locked here (story.spec.ts checks them). */
const isReward = (kind: string, id: string) => STORY.rewards.some((r) => r.kind === kind && r.id === id);
const FREE_TABLES = TABLE_IDS.filter((id) => !isReward('table', id));
const FREE_BACKGROUNDS = BACKGROUND_IDS.filter((id) => !isReward('background', id));

/** The table drawn in the table scene (its theme id). */
const tableOnScreen = (page: Page) => page.evaluate(() => window.__tzg!.dataOf('Table', 'table', 'theme'));

async function chooseTable(page: Page, id: string): Promise<void> {
  await tap(page, 'menu-tables', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('tables');
  await tap(page, `table-${id}`, MENU_SCENE);
  expect((await menuState(page)).selectedTable).toBe(id);
  await tap(page, 'table-confirm', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
}

test('Meza: the chosen table is played on, kept after reopening, and marked on the picker', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await tap(page, 'menu-tables', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('tables');
  expect((await menuState(page)).selectedTable).toBe('classic');
  await tap(page, 'table-back', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();

  await chooseTable(page, 'zanzibar');
  expect((await menuState(page)).table).toBe('zanzibar');
  await playFromMenu(page, 'two');
  expect(await tableOnScreen(page)).toBe('zanzibar');

  await reopen(page);
  expect((await menuState(page)).table).toBe('zanzibar');
  await tap(page, 'menu-tables', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).selectedTable).toBe('zanzibar');
  expect(errors).toEqual([]);
});

test('Back, or the phone\'s back button, leaves the table as it was', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await chooseTable(page, 'kitenge');
  for (const close of ['button', 'phone'] as const) {
    await tap(page, 'menu-tables', MENU_SCENE);
    await expect.poll(async () => (await menuState(page)).panel).toBe('tables');
    await tap(page, 'table-maasai', MENU_SCENE);
    if (close === 'button') await tap(page, 'table-back', MENU_SCENE);
    else await page.evaluate(() => window.__tzg!.back());
    await expect.poll(async () => (await menuState(page)).panel).toBeNull();
    expect((await menuState(page)).table).toBe('kitenge');
  }
  expect(await page.evaluate(() => window.__tzg!.backLeaves())).toBe(0);
  expect(errors).toEqual([]);
});

test('a game in progress continues on a newly chosen table, with the balls where they were', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await playFromMenu(page, 'two');
  expect(await tableOnScreen(page)).toBe('classic');
  await pullPower(page, 1);
  const afterBreak = await waitUntilSettled(page);
  await tap(page, 'menuButton');
  await waitForScene(page, MENU_SCENE);
  await chooseTable(page, 'makonde');
  await tap(page, 'menu-continue', MENU_SCENE);
  await waitForScene(page, SCENE);
  expect(await tableOnScreen(page)).toBe('makonde');
  expect((await state(page)).balls).toEqual(afterBreak.balls);
  expect(errors).toEqual([]);
});

test('every table draws and plays a break without errors', async ({ page }) => {
  test.slow();
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  for (const id of FREE_TABLES) {
    await chooseTable(page, id);
    await playFromMenu(page, 'two');
    expect(await tableOnScreen(page)).toBe(id);
    // A gentle break: enough to roll balls over the felt, quick to settle (Menu waits for still balls).
    const shots = (await state(page)).shots;
    await pullPower(page, 0.3);
    await expect.poll(async () => (await state(page)).shots).toBe(shots + 1);
    await waitUntilSettled(page);
    await tap(page, 'menuButton');
    await waitForScene(page, MENU_SCENE);
  }
  expect(errors).toEqual([]);
});

/** The cue drawn on the table (its style id). */
const cueOnScreen = (page: Page) => page.evaluate(() => window.__tzg!.dataOf('Table', 'cueStick', 'style'));

test('Fimbo: the chosen cue is used on the table and kept after reopening; Back keeps the old one', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await tap(page, 'menu-cues', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('cues');
  expect((await menuState(page)).selectedCue).toBe('classic');
  await tap(page, 'cue-maasai', MENU_SCENE);
  expect((await menuState(page)).selectedCue).toBe('maasai');
  await tap(page, 'cue-confirm', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
  expect((await menuState(page)).cue).toBe('maasai');

  await tap(page, 'menu-cues', MENU_SCENE);
  await tap(page, 'cue-makonde', MENU_SCENE);
  await page.evaluate(() => window.__tzg!.back());
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
  expect((await menuState(page)).cue).toBe('maasai');
  expect((await menuState(page)).table).toBe('classic');

  await playFromMenu(page, 'two');
  expect(await cueOnScreen(page)).toBe('maasai');
  await reopen(page);
  expect((await menuState(page)).cue).toBe('maasai');
  expect(errors).toEqual([]);
});

/** The background drawn behind the table (its id). */
const backgroundOnScreen = (page: Page) => page.evaluate(() => window.__tzg!.dataOf('Table', 'table', 'background'));

test('Mandhari: each background can be chosen and is drawn behind the table; the choice is kept, Back keeps the old one', async ({ page }) => {
  test.slow();
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  // The three look buttons share a row and none covers another.
  const row = await Promise.all(['menu-tables', 'menu-cues', 'menu-backgrounds'].map((n) => page.evaluate(([s, m]) => window.__tzg!.boundsOf(s, m), [MENU_SCENE, n] as const)));
  for (let i = 1; i < row.length; i++) expect(row[i]!.left).toBeGreaterThan(row[i - 1]!.right);
  for (const b of row) expect(b!.top).toBe(row[0]!.top);

  for (const id of FREE_BACKGROUNDS) {
    await tap(page, 'menu-backgrounds', MENU_SCENE);
    await expect.poll(async () => (await menuState(page)).panel).toBe('backgrounds');
    await tap(page, `background-${id}`, MENU_SCENE);
    expect((await menuState(page)).selectedBackground).toBe(id);
    await tap(page, 'background-confirm', MENU_SCENE);
    await expect.poll(async () => (await menuState(page)).background).toBe(id);
    await playFromMenu(page, 'two');
    expect(await backgroundOnScreen(page)).toBe(id);
    await tap(page, 'menuButton');
    await waitForScene(page, MENU_SCENE);
  }

  await tap(page, 'menu-backgrounds', MENU_SCENE);
  expect((await menuState(page)).selectedBackground).toBe('makuti');
  await tap(page, 'background-sea', MENU_SCENE);
  await page.evaluate(() => window.__tzg!.back());
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
  await reopen(page);
  expect((await menuState(page)).background).toBe('makuti');
  expect(errors).toEqual([]);
});
