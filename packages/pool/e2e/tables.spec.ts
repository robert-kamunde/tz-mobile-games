import { expect, test, type Page } from '@playwright/test';
import { bootTo, trackErrors } from '../../../tooling/e2eHelpers';
import { TABLE_IDS } from '../src/config/tables';
import { MENU_SCENE, SCENE, menuState, playFromMenu, pullPower, reopen, state, tap, waitForScene, waitUntilSettled } from './poolPage';

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
  for (const id of TABLE_IDS) {
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
