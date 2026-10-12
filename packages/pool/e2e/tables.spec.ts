import { expect, test, type Page } from '@playwright/test';
import { bootTo, trackErrors } from '../../../tooling/e2eHelpers';
import { BACKGROUND_IDS } from '../src/config/backgrounds';
import { STORY } from '../src/config/story';
import { TABLE_IDS } from '../src/config/tables';
import { MENU_SCENE, SCENE, menuState, playFromMenu, pullPower, reopen, seedWins, state, tap, waitForScene, waitUntilSettled } from './poolPage';

/** Earned looks stay locked here (the unlock tests below and story.spec.ts check them). */
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
  await chooseTable(page, 'zanzibar');
  for (const close of ['button', 'phone'] as const) {
    await tap(page, 'menu-tables', MENU_SCENE);
    await expect.poll(async () => (await menuState(page)).panel).toBe('tables');
    await tap(page, 'table-classic', MENU_SCENE);
    if (close === 'button') await tap(page, 'table-back', MENU_SCENE);
    else await page.evaluate(() => window.__tzg!.back());
    await expect.poll(async () => (await menuState(page)).panel).toBeNull();
    expect((await menuState(page)).table).toBe('zanzibar');
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
  await chooseTable(page, 'zanzibar');
  await tap(page, 'menu-continue', MENU_SCENE);
  await waitForScene(page, SCENE);
  expect(await tableOnScreen(page)).toBe('zanzibar');
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
  await tap(page, 'cue-zanzibar', MENU_SCENE);
  expect((await menuState(page)).selectedCue).toBe('zanzibar');
  await tap(page, 'cue-confirm', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
  expect((await menuState(page)).cue).toBe('zanzibar');

  await tap(page, 'menu-cues', MENU_SCENE);
  await tap(page, 'cue-classic', MENU_SCENE);
  await page.evaluate(() => window.__tzg!.back());
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
  expect((await menuState(page)).cue).toBe('zanzibar');
  expect((await menuState(page)).table).toBe('classic');

  await playFromMenu(page, 'two');
  expect(await cueOnScreen(page)).toBe('zanzibar');
  await reopen(page);
  expect((await menuState(page)).cue).toBe('zanzibar');
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
  const last = FREE_BACKGROUNDS[FREE_BACKGROUNDS.length - 1]!;
  expect((await menuState(page)).selectedBackground).toBe(last);
  await tap(page, 'background-classic', MENU_SCENE);
  await page.evaluate(() => window.__tzg!.back());
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
  await reopen(page);
  expect((await menuState(page)).background).toBe(last);
  expect(errors).toEqual([]);
});

const dataOf = (page: Page, name: string, key: string) => page.evaluate(([n, k]) => window.__tzg!.dataOf('Menu', n, k), [name, key] as const);
const textOf = (page: Page, name: string) => page.evaluate((n) => window.__tzg!.textOf('Menu', n), name);
const visible = (page: Page, name: string) => page.evaluate((n) => window.__tzg!.boundsOf('Menu', n) !== null, name);

test('only two of each look are free; the others show a padlock and what earns them, a page at a time', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  expect(FREE_TABLES).toEqual(['classic', 'zanzibar']);
  expect(FREE_BACKGROUNDS).toEqual(['classic', 'wood']);
  for (const kind of ['table', 'background'] as const) {
    const ids = kind === 'table' ? TABLE_IDS : BACKGROUND_IDS;
    await tap(page, `menu-${kind}s`, MENU_SCENE);
    await expect.poll(async () => (await menuState(page)).panel).toBe(`${kind}s`);
    expect(await menuState(page)).toMatchObject({ lookPage: 0, lookPages: 2 });
    expect(await visible(page, `${kind}-prevPage`)).toBe(false);
    // Page 1: the first eight; the ninth waits on page 2.
    for (const id of ids.slice(0, 8)) expect(await visible(page, `${kind}-${id}`), id).toBe(true);
    expect(await visible(page, `${kind}-${ids[8]!}`)).toBe(false);
    // A locked one cannot be chosen.
    const lockedId = ids[2]!;
    expect(await dataOf(page, `${kind}-${lockedId}-touch`, 'locked')).toBe(true);
    await tap(page, `${kind}-${lockedId}-touch`, MENU_SCENE);
    expect((await menuState(page))[kind === 'table' ? 'selectedTable' : 'selectedBackground']).toBe('classic');
    await tap(page, `${kind}-${ids[1]!}`, MENU_SCENE);
    await tap(page, `${kind}-nextPage`, MENU_SCENE);
    await expect.poll(async () => (await menuState(page)).lookPage).toBe(1);
    expect(await visible(page, `${kind}-${ids[8]!}`)).toBe(true);
    expect(await visible(page, `${kind}-${ids[0]!}`)).toBe(false);
    expect(await visible(page, `${kind}-nextPage`)).toBe(false);
    // The bottom of the page is on screen, above the buttons.
    const label = await page.evaluate((n) => window.__tzg!.boundsOf('Menu', n), `${kind}-${ids[8]!}-label`);
    const button = await page.evaluate((n) => window.__tzg!.boundsOf('Menu', n), `${kind}-confirm`);
    expect(label!.bottom).toBeLessThan(button!.top);
    // The choice made on page 1 is kept across pages.
    await tap(page, `${kind}-prevPage`, MENU_SCENE);
    await expect.poll(async () => (await menuState(page)).lookPage).toBe(0);
    await tap(page, `${kind}-confirm`, MENU_SCENE);
    await expect.poll(async () => (await menuState(page))[kind]).toBe(ids[1]);
  }
  await tap(page, 'menu-cues', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('cues');
  expect(await menuState(page)).toMatchObject({ lookPage: 0, lookPages: 1 });
  expect(await textOf(page, 'cue-kitenge-label')).toBe('Kitenge: Shinda Sinza au mechi 6');
  expect(errors).toEqual([]);
});

test('a look opens at its story stop or after enough wins, and the picker opens on the page of the saved choice', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await seedWins(page, 3);
  await tap(page, 'menu-tables', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('tables');
  expect(await dataOf(page, 'table-kitenge-touch', 'locked')).toBe(false);
  expect(await dataOf(page, 'table-maasai-touch', 'locked')).toBe(true);
  await tap(page, 'table-back', MENU_SCENE);
  // A journey with Bingwa beaten has earned the Ziwa table, on page 2.
  await page.evaluate(() => window.localStorage.setItem('pool.story', JSON.stringify({ v: 1, data: { character: 'fundi', stars: { fainali: 1 } } })));
  await reopen(page);
  await chooseTable(page, 'kitenge');
  await tap(page, 'menu-tables', MENU_SCENE);
  await tap(page, 'table-nextPage', MENU_SCENE);
  await tap(page, 'table-ziwa', MENU_SCENE);
  await tap(page, 'table-confirm', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).table).toBe('ziwa');
  await tap(page, 'menu-tables', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('tables');
  expect(await menuState(page)).toMatchObject({ lookPage: 1, selectedTable: 'ziwa' });
  expect(errors).toEqual([]);
});
