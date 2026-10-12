import { expect, test, type Page } from '@playwright/test';
import { bootTo, trackErrors } from '../../../tooling/e2eHelpers';
import { MENU_SCENE, SCENE, boot, dismissHowToPlay, menuState, pickOpponent, playFromMenu, reopen, state, tap, waitForScene } from './poolPage';

const back = (page: Page) => page.evaluate(() => window.__tzg!.back());
const textOf = (page: Page, scene: string, name: string) => page.evaluate(([s, n]) => window.__tzg!.textOf(s, n), [scene, name] as const);
const taken = (page: Page, id: string) => page.evaluate((n) => window.__tzg!.dataOf('Menu', `character-${n}`, 'taken'), id);
const selected = async (page: Page) => (await menuState(page)).selectedCharacter;

/** Play: the first step is your own character. */
async function openCharacters(page: Page): Promise<void> {
  await tap(page, 'menu-play', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('characters');
}

/** Confirms your character and waits for the opponents. */
async function toOpponents(page: Page): Promise<void> {
  await tap(page, 'character-confirm', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('picker');
}

async function start(page: Page): Promise<void> {
  await waitForScene(page, SCENE);
  await dismissHowToPlay(page);
}

test('against the computer: choose your character, then the level, see it on the table, keep it after reopening', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await openCharacters(page);
  expect(await selected(page)).toBe('fundi');
  // Every face comes from its picture file in portraits/, not the drawn backup.
  for (const id of ['fundi', 'malkia', 'bishoo', 'kichwa']) {
    expect(await page.evaluate((n) => window.__tzg!.dataOf('Menu', `character-${n}`, 'portrait'), id)).toMatch(new RegExp(`^portrait-${id}-\\d+-file$`));
  }
  expect(await textOf(page, MENU_SCENE, 'characterPicker-body')).toBeNull();
  expect(await textOf(page, MENU_SCENE, 'character-confirm')).toBe('Endelea');
  await tap(page, 'character-bonge', MENU_SCENE);
  expect(await selected(page)).toBe('bonge');
  await toOpponents(page);
  // A computer level starts the game straight away.
  await tap(page, 'opponent-hard', MENU_SCENE);
  await start(page);
  const s = await state(page);
  expect(s.players).toEqual(['Bonge', 'Mzee Kobe']);
  expect(s.status).toContain('Bonge');

  // Reopened mid-game, Continue brings back the same characters.
  await reopen(page);
  await tap(page, 'menu-continue', MENU_SCENE);
  await waitForScene(page, SCENE);
  expect((await state(page)).players).toEqual(['Bonge', 'Mzee Kobe']);
  // And they are saved again with the game, not only shown.
  await reopen(page);
  await tap(page, 'menu-continue', MENU_SCENE);
  await waitForScene(page, SCENE);
  expect((await state(page)).players).toEqual(['Bonge', 'Mzee Kobe']);

  // The next game starts with the last choice selected.
  await tap(page, 'menuButton');
  await waitForScene(page, MENU_SCENE);
  await openCharacters(page);
  expect(await selected(page)).toBe('bonge');
  expect(errors).toEqual([]);
});

test('two players: player 1 chooses, then the opponent, then player 2, who cannot take player 1’s character', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await openCharacters(page);
  await tap(page, 'character-mwamba', MENU_SCENE);
  await toOpponents(page);
  await tap(page, 'opponent-two', MENU_SCENE);

  await expect.poll(() => textOf(page, MENU_SCENE, 'characterPicker-body')).toBe('Mchezaji 2');
  expect(await taken(page, 'mwamba')).toBe(true);
  // Player 2's last-time default was Mwamba, now taken, so another is selected; tapping Mwamba does nothing.
  expect(await selected(page)).not.toBe('mwamba');
  await tap(page, 'character-mwamba', MENU_SCENE);
  expect(await selected(page)).not.toBe('mwamba');
  await tap(page, 'character-malkia', MENU_SCENE);
  expect(await textOf(page, MENU_SCENE, 'character-confirm')).toBe('Anza');
  await tap(page, 'character-confirm', MENU_SCENE);
  await start(page);
  const s = await state(page);
  expect(s.players).toEqual(['Mwamba', 'Malkia']);
  expect(s.picks).toEqual(['mwamba', 'malkia']);
  expect(errors).toEqual([]);
});

test('Back and the phone back button step back through player 2, the opponents and your character', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await openCharacters(page);
  await tap(page, 'character-kichwa', MENU_SCENE);
  await toOpponents(page);
  await tap(page, 'opponent-two', MENU_SCENE);
  await expect.poll(() => textOf(page, MENU_SCENE, 'characterPicker-body')).toBe('Mchezaji 2');

  await back(page);
  await expect.poll(async () => (await menuState(page)).panel).toBe('picker');
  await back(page);
  await expect.poll(async () => (await menuState(page)).panel).toBe('characters');
  expect(await selected(page)).toBe('kichwa');
  await toOpponents(page);
  await tap(page, 'opponent-back', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('characters');
  await tap(page, 'character-back', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
  expect(await page.evaluate(() => window.__tzg!.backLeaves())).toBe(0);
  expect(errors).toEqual([]);
});

test('New game on the table: Back from the opponents returns to your character, then to the game', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  await tap(page, 'newGameButton');
  await tap(page, 'newGameButton');
  await expect.poll(async () => (await state(page)).setupStep).toBe('characters');
  await tap(page, 'character-confirm');
  await expect.poll(async () => (await state(page)).setupStep).toBe('opponent');
  await back(page);
  await expect.poll(async () => (await state(page)).setupStep).toBe('characters');
  await back(page);
  await expect.poll(async () => (await state(page)).pickerShown).toBe(false);
  expect((await state(page)).opponent).toEqual({ kind: 'human' });

  await tap(page, 'newGameButton');
  await tap(page, 'newGameButton');
  await pickOpponent(page, 'medium', ['shangazi']);
  expect((await state(page)).players).toEqual(['Shangazi', 'Mama Ntilie']);
  expect(errors).toEqual([]);
});

test('in English the pickers are translated and the names stay as they are', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await tap(page, 'menu-settings', MENU_SCENE);
  await tap(page, 'language-en', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).locale).toBe('en');
  await tap(page, 'settings-back', MENU_SCENE);
  await openCharacters(page);
  expect(await textOf(page, MENU_SCENE, 'character-confirm')).toBe('Next');
  await toOpponents(page);
  expect(await textOf(page, MENU_SCENE, 'opponent-easy')).toBe('Dogo Mbishi (Easy)');
  await tap(page, 'opponent-two', MENU_SCENE);
  await expect.poll(() => textOf(page, MENU_SCENE, 'characterPicker-body')).toBe('Player 2');
  expect(await textOf(page, MENU_SCENE, 'character-confirm')).toBe('Start');
  expect(errors).toEqual([]);
});

test('a game saved before characters existed continues with the default characters', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await playFromMenu(page, 'easy', ['bonge']);
  expect((await state(page)).players).toEqual(['Bonge', 'Dogo Mbishi']);
  await tap(page, 'menuButton');
  await waitForScene(page, MENU_SCENE);
  // Strip the characters from the save, as an older version wrote it.
  await page.evaluate(() => {
    const raw = JSON.parse(window.localStorage.getItem('pool.match')!) as { data: Record<string, unknown> };
    delete raw.data.picks;
    window.localStorage.setItem('pool.match', JSON.stringify(raw));
  });
  await reopen(page);
  await tap(page, 'menu-continue', MENU_SCENE);
  await waitForScene(page, SCENE);
  expect((await state(page)).players).toEqual(['Fundi', 'Dogo Mbishi']);
  expect(errors).toEqual([]);
});
