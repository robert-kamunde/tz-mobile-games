import { expect, test } from '@playwright/test';
import { bootTo, trackErrors } from '../../../tooling/e2eHelpers';
import { MENU_SCENE, menuState, reopen, tap } from './poolPage';

/** The very first launch asks for the language (0.37.0); every other test starts with it chosen. */
test.use({ storageState: { cookies: [], origins: [] } });

const back = (page: import('@playwright/test').Page) => page.evaluate(() => window.__tzg!.back());

test('a new install asks for the language once, before the menu', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('language');
  expect(await page.evaluate(() => window.__tzg!.textOf('Menu', 'languagePanel-title'))).toBe('Chagua lugha / Choose language');
  // Back does not skip it, and the menu underneath cannot be tapped.
  await back(page);
  expect(await page.evaluate(() => window.__tzg!.backLeaves())).toBe(0);
  expect((await menuState(page)).panel).toBe('language');
  await tap(page, 'firstLanguage-en', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).locale).toBe('en');
  expect((await menuState(page)).panel).toBeNull();
  expect(await page.evaluate(() => window.__tzg!.textOf('Menu', 'menu-playMenu'))).toBe('PLAY');
  await reopen(page);
  expect(await menuState(page)).toMatchObject({ panel: null, locale: 'en' });
  expect(errors).toEqual([]);
});

test('Kiswahili on the first launch keeps the game in Kiswahili', async ({ page }) => {
  await bootTo(page, MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('language');
  await tap(page, 'firstLanguage-sw', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
  expect((await menuState(page)).locale).toBe('sw');
  await reopen(page);
  expect((await menuState(page)).panel).toBeNull();
});

test('a player whose settings were saved by an older version is not asked', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pool.settings', JSON.stringify({ v: 1, data: { locale: 'en', soundVolume: 1, musicVolume: 0.7 } })));
  await bootTo(page, MENU_SCENE);
  expect(await menuState(page)).toMatchObject({ panel: null, locale: 'en' });
});
