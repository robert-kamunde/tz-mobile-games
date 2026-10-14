import { expect, test, type Page } from '@playwright/test';
import { bootTo, trackErrors } from '../../../tooling/e2eHelpers';
import {
  MENU_SCENE,
  SCENE,
  boot,
  chooseMatch,
  elementCenter,
  layout,
  menuState,
  openMenuPage,
  playFromMenu,
  potTheBlack,
  pullPower,
  reopen,
  setUpBlackPot,
  state,
  tap,
  tapMenu,
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
  await tapMenu(page, 'menu-continue');
  await waitForScene(page, SCENE);
}

test('the game opens on the menu, with no Continue before a game is played', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  expect(await menuState(page)).toEqual({ continueShown: false, continueStoryShown: false, page: 'main', savedDot: false, panel: null, selectedCharacter: null, selectedTable: null, selectedCue: null, selectedBackground: null, lookPage: 0, lookPages: 0, table: 'classic', cue: 'classic', hand: 'right', background: 'classic', locale: 'sw', newDots: [], unlockShown: null });
  // Robert's logo and menu pictures (art/) show, not the drawn ones.
  for (const name of ['menu-title', 'menu-background']) expect(await page.evaluate((n) => window.__tzg!.dataOf('Menu', n, 'picture'), name), name).toBe(true);
  // The main page: CHEZA, Mapambo, Takwimu, Sheria, Mipangilio; no dot while nothing is saved.
  for (const name of ['menu-playMenu', 'menu-looks', 'menu-stats', 'menu-rules', 'menu-settings', 'menu-title', 'menu-background']) await elementCenter(page, name, MENU_SCENE);
  for (const name of ['menu-savedDot', 'menu-play', 'menu-tables']) expect(await page.evaluate((n) => window.__tzg!.elementCenter('Menu', n), name)).toBeNull();
  // CHEZA holds Quick game and the journey (no Continue yet); Rudi goes back.
  await openMenuPage(page, 'play');
  for (const name of ['menu-play', 'menu-story', 'menu-back']) await elementCenter(page, name, MENU_SCENE);
  expect(await page.evaluate(() => window.__tzg!.elementCenter('Menu', 'menu-continue'))).toBeNull();
  await openMenuPage(page, 'main');
  // Mapambo holds the looks; the phone's Back goes back to the main page, not out of the game.
  await openMenuPage(page, 'looks');
  for (const name of ['menu-tables', 'menu-cues', 'menu-backgrounds']) await elementCenter(page, name, MENU_SCENE);
  await page.evaluate(() => window.__tzg!.back());
  await expect.poll(async () => (await menuState(page)).page).toBe('main');

  // Rules open over the menu and Back closes them.
  await tap(page, 'menu-rules', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('rules');
  expect(await textOf(page, MENU_SCENE, 'rulesPanel-body')).toContain('mweusi');
  await tap(page, 'rules-back', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();

  // Back on the first step (your character) returns to the menu without starting a game.
  await tapMenu(page, 'menu-play');
  await expect.poll(async () => (await menuState(page)).panel).toBe('characters');
  await tap(page, 'character-back', MENU_SCENE);
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
  await tapMenu(page, 'menu-continue');
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
  await tapMenu(page, 'menu-continue');
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
  expect(await textOf(page, MENU_SCENE, 'stats-easy-record')).toBe('1/1');
  expect(await textOf(page, MENU_SCENE, 'stats-hard-record')).toBe('0/0');
  expect(await textOf(page, MENU_SCENE, 'stats-total-games')).toBe('1');
  expect(await textOf(page, MENU_SCENE, 'stats-total-rate')).toBe('100%');
  expect(await textOf(page, MENU_SCENE, 'stats-total-streak')).toBe('1');
  expect(await textOf(page, MENU_SCENE, 'stats-friends')).toBe('Michezo na marafiki (simu moja): 0');
  // A crown on the beaten computer player only.
  expect(await page.evaluate(() => window.__tzg!.boundsOf('Menu', 'stats-easy-crown'))).not.toBeNull();
  expect(await page.evaluate(() => window.__tzg!.boundsOf('Menu', 'stats-hard-crown'))).toBeNull();

  // The picker marks the last opponent.
  await tap(page, 'stats-back', MENU_SCENE);
  await tapMenu(page, 'menu-play');
  await tap(page, 'character-confirm', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('picker');
  expect(await highlighted(page, MENU_SCENE, 'opponent-easy')).toBe(true);
  expect(await highlighted(page, MENU_SCENE, 'opponent-hard')).toBe(false);
  // Each computer player's card shows the record against them.
  expect(await textOf(page, MENU_SCENE, 'opponent-easy-record')).toBe('Umeshinda 1/1');
  expect(await textOf(page, MENU_SCENE, 'opponent-hard-record')).toBe('Bado hamjacheza');
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
  expect(await textOf(page, MENU_SCENE, 'menu-playMenu')).toBe('PLAY');
  expect(await textOf(page, MENU_SCENE, 'menu-looks')).toBe('Customise');

  await reopen(page);
  expect((await menuState(page)).locale).toBe('en');
  await openMenuPage(page, 'play');
  expect(await textOf(page, MENU_SCENE, 'menu-play')).toBe('Quick game');
  await tapMenu(page, 'menu-play');
  await chooseMatch(page, MENU_SCENE, 'two');
  await waitForScene(page, SCENE);
  expect((await state(page)).status).toContain('Fundi');
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
  expect(await textOf(page, MENU_SCENE, 'stats-easy-record')).toBe('0/0');
  expect(await textOf(page, MENU_SCENE, 'stats-total-rate')).toBe('–');
  expect(await storage(page, 'pool.progress.backup')).toBe('not json at all');

  // A new game still starts and is saved over the damaged one.
  await tap(page, 'stats-back', MENU_SCENE);
  await tapMenu(page, 'menu-play');
  await chooseMatch(page, MENU_SCENE, 'two');
  await waitForScene(page, SCENE);
  expect(JSON.parse((await storage(page, 'pool.match'))!).data.shots).toBe(0);
  expect(errors).toEqual([]);
});

test('the computer resumes its own turn after the game is reopened', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page, 'easy');
  await layout(page, [], { phase: 'play', current: 1, ballInHand: 'anywhere', groups: ['yellow', 'red'] });
  await reopen(page);
  await tapMenu(page, 'menu-continue');
  await waitForScene(page, SCENE);
  expect((await state(page)).opponent).toEqual({ kind: 'computer', level: 'easy' });
  await expect.poll(async () => (await state(page)).shots, { timeout: 15_000 }).toBe(1);
  expect(errors).toEqual([]);
});

test('after changing the language, Menu from the table opens the main menu, not Settings', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await tap(page, 'menu-settings', MENU_SCENE);
  await tap(page, 'language-en', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).locale).toBe('en');
  await tap(page, 'settings-back', MENU_SCENE);
  await tapMenu(page, 'menu-play');
  await chooseMatch(page, MENU_SCENE, 'two');
  await waitForScene(page, SCENE);
  await tap(page, 'menuButton');
  await waitForScene(page, MENU_SCENE);
  expect((await menuState(page)).panel).toBeNull();
  expect(errors).toEqual([]);
});

const exits = (page: Page) => page.evaluate(() => window.__tzg!.exits());

test('Exit with no game in progress closes the game at once', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  expect(await textOf(page, MENU_SCENE, 'menu-exit')).toBe('Toka');
  await tap(page, 'menu-exit', MENU_SCENE);
  expect(await exits(page)).toBe(1);
  expect((await menuState(page)).panel).toBeNull();
  expect(errors).toEqual([]);
});

test('Exit during a game asks first, says the game is saved, and the game continues after reopening', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  await pullPower(page, 1);
  const afterBreak = await waitUntilSettled(page);
  await tap(page, 'menuButton');
  await waitForScene(page, MENU_SCENE);

  // Back (button or phone) closes the popup without closing the game.
  await tap(page, 'menu-exit', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('exit');
  expect(await textOf(page, MENU_SCENE, 'exitPanel-body')).toContain('umehifadhiwa');
  await tap(page, 'exit-back', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
  await tap(page, 'menu-exit', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('exit');
  await page.evaluate(() => window.__tzg!.back());
  await expect.poll(async () => (await menuState(page)).panel).toBeNull();
  expect(await exits(page)).toBe(0);

  await tap(page, 'menu-exit', MENU_SCENE);
  await tap(page, 'exit-confirm', MENU_SCENE);
  expect(await exits(page)).toBe(1);

  // What the player finds when they open the app again.
  await reopen(page);
  expect((await menuState(page)).continueShown).toBe(true);
  await tapMenu(page, 'menu-continue');
  await waitForScene(page, SCENE);
  expect((await state(page)).balls).toEqual(afterBreak.balls);
  expect(errors).toEqual([]);
});

test('the opponent picker fits the friend button, four cards and Back without overlapping', async ({ page }) => {
  type Box = { left: number; top: number; right: number; bottom: number };
  const boxes = async (scene: string) =>
    (await Promise.all(['two', 'easy', 'medium', 'hard', 'impossible', 'back'].map((id) => page.evaluate(([s, n]) => window.__tzg!.boundsOf(s, n), [scene, `opponent-${id}`] as const)))) as Box[];
  const apart = (a: Box, b: Box) => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
  // The friend button above every card, Back below every card, no two cards overlapping (four in a row on the menu, two by two on the table).
  const expectApart = ([friend, ...rest]: Box[]) => {
    const back = rest.pop()!;
    rest.forEach((card, i) => {
      expect(card.top, `card ${i} below the friend button`).toBeGreaterThan(friend!.bottom);
      expect(card.bottom, `card ${i} above Back`).toBeLessThan(back.top);
      rest.slice(i + 1).forEach((other, j) => expect(apart(card, other), `cards ${i} and ${i + j + 1}`).toBe(true));
    });
  };
  await bootTo(page, MENU_SCENE);
  await tapMenu(page, 'menu-play');
  await tap(page, 'character-confirm', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('picker');
  expectApart(await boxes(MENU_SCENE));
  await tap(page, 'opponent-back', MENU_SCENE);
  await tap(page, 'character-back', MENU_SCENE);
  await playFromMenu(page, 'impossible');
  expect((await state(page)).opponent).toEqual({ kind: 'computer', level: 'impossible' });
  expect((await state(page)).players[1]).toBe('Bingwa');
});
