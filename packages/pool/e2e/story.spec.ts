import { expect, test, type Page } from '@playwright/test';
import { bootTo, trackErrors } from '../../../tooling/e2eHelpers';
import { STORY, STORY_STOPS } from '../src/config/story';
import {
  MENU_SCENE,
  SCENE,
  dismissHowToPlay,
  dragOnTable,
  dragSpin,
  elementCenter,
  layout,
  menuState,
  openMenuPage,
  playFromMenu,
  potTheBlack,
  pullPower,
  reopen,
  seedWins,
  setUpBlackPot,
  state,
  tap,
  tapMenu,
  waitForScene,
  waitUntilSettled,
} from './poolPage';

/** Safari ya Bingwa (story mode): the map, its stops, stars and story-only rewards. */

const STORY_SCENE = 'Story';

interface StoryState {
  character: string | null;
  stars: Record<string, number>;
  total: number;
  title: string | null;
  rewards: string[];
  open: string[];
  chapter: string;
  card: string | null;
  choosing: boolean;
  selectedCharacter: string | null;
}

const storyState = (page: Page) => page.evaluate(() => window.__tzg!.probe('pool.story') as StoryState);
const textOf = (page: Page, scene: string, name: string) => page.evaluate(([s, n]) => window.__tzg!.textOf(s, n), [scene, name] as const);
const dataOf = (page: Page, scene: string, name: string, key: string) => page.evaluate(([s, n, k]) => window.__tzg!.dataOf(s, n, k), [scene, name, key] as const);
const back = (page: Page) => page.evaluate(() => window.__tzg!.back());
const litStars = async (page: Page) => {
  let lit = 0;
  for (let i = 0; i < 3; i++) if (await dataOf(page, SCENE, `gameOverStar-${i}`, 'lit')) lit++;
  return lit;
};

/** Writes a journey straight into the save, as an earlier session would have left it, and reopens the game. */
async function seedJourney(page: Page, character: string, stars: Record<string, number>): Promise<void> {
  // What the seeded journey earned counts as already announced (no unlock popups).
  await page.evaluate((data) => {
    window.localStorage.setItem('pool.story', JSON.stringify({ v: 1, data }));
    window.localStorage.removeItem('pool.unlocks');
  }, { character, stars });
  await reopen(page);
}

/** One star at every stop before `stop`, so it is open. */
const upTo = (stop: string) => Object.fromEntries(STORY_STOPS.slice(0, STORY_STOPS.findIndex((s) => s.id === stop)).map((s) => [s.id, 1]));

/** From the menu to the map; on a first visit, choose the journey's character. */
async function openMap(page: Page, character?: string): Promise<void> {
  await tapMenu(page, 'menu-story');
  await waitForScene(page, STORY_SCENE);
  if (!character) return;
  await expect.poll(async () => (await storyState(page)).choosing).toBe(true);
  await tap(page, `character-${character}`, STORY_SCENE);
  await tap(page, 'character-confirm', STORY_SCENE);
  await expect.poll(async () => (await storyState(page)).character).toBe(character);
  await expect.poll(async () => (await storyState(page)).choosing).toBe(false);
}

/** On the map: tap a stop, then Cheza, and wait for its game. */
async function playStop(page: Page, stop: string): Promise<void> {
  await tap(page, `stop-${stop}`, STORY_SCENE);
  await expect.poll(async () => (await storyState(page)).card).toBe(stop);
  await tap(page, 'stopCard-play', STORY_SCENE);
  await waitForScene(page, SCENE);
  await dismissHowToPlay(page);
  await expect.poll(async () => (await state(page)).story?.stop).toBe(stop);
}

async function winCleanly(page: Page): Promise<void> {
  await setUpBlackPot(page);
  await potTheBlack(page);
  expect((await waitUntilSettled(page)).gameOverShown).toBe(true);
}

test('the first visit asks for the journey character, and only the first stop is open', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await openMenuPage(page, 'play');
  expect(await textOf(page, MENU_SCENE, 'menu-play')).toBe('Mchezo wa haraka');
  expect(await textOf(page, MENU_SCENE, 'menu-story')).toBe('Safari ya Bingwa');

  // Back on the first visit's picker leaves story mode without saving a character.
  await openMap(page);
  await expect.poll(async () => (await storyState(page)).choosing).toBe(true);
  await back(page);
  await waitForScene(page, MENU_SCENE);

  await openMap(page, 'bonge');
  const s = await storyState(page);
  expect(s).toMatchObject({ character: 'bonge', total: 0, title: null, open: ['mtaani'], card: null, chapter: 'dar' });
  expect(await textOf(page, STORY_SCENE, 'story-chapter')).toBe('Sura 1: Dar es Salaam');
  // The next chapters can be looked at, all closed; there is nothing before the first.
  expect(await page.evaluate(() => window.__tzg!.elementCenter('Story', 'story-prevChapter'))).toBeNull();
  await tap(page, 'story-nextChapter', STORY_SCENE);
  await expect.poll(async () => (await storyState(page)).chapter).toBe('kaskazini');
  expect(await dataOf(page, STORY_SCENE, 'stop-morogoro', 'open')).toBe(false);
  await tap(page, 'story-nextChapter', STORY_SCENE);
  await expect.poll(async () => (await storyState(page)).chapter).toBe('visiwani');
  expect(await page.evaluate(() => window.__tzg!.elementCenter('Story', 'story-nextChapter'))).toBeNull();
  await tap(page, 'story-prevChapter', STORY_SCENE);
  await tap(page, 'story-prevChapter', STORY_SCENE);
  await expect.poll(async () => (await storyState(page)).chapter).toBe('dar');
  expect(await dataOf(page, STORY_SCENE, 'stop-kariakoo', 'open')).toBe(false);
  // A closed stop does not open its card.
  await tap(page, 'stop-kariakoo', STORY_SCENE);
  await page.waitForTimeout(300);
  expect((await storyState(page)).card).toBeNull();

  // The card opens on the first stop; the phone's back button closes it, then goes to the menu.
  await tap(page, 'stop-mtaani', STORY_SCENE);
  await expect.poll(async () => (await storyState(page)).card).toBe('mtaani');
  expect(await textOf(page, STORY_SCENE, 'stopCard-play')).toBe('Cheza');
  await back(page);
  await expect.poll(async () => (await storyState(page)).card).toBeNull();
  await back(page);
  await waitForScene(page, MENU_SCENE);

  // The character is kept, and can be changed on the map.
  await openMap(page);
  expect((await storyState(page)).character).toBe('bonge');
  await tap(page, 'story-change', STORY_SCENE);
  await expect.poll(async () => (await storyState(page)).choosing).toBe(true);
  expect(await textOf(page, STORY_SCENE, 'character-confirm')).toBe('Sawa');
  await tap(page, 'character-fundi', STORY_SCENE);
  await tap(page, 'character-confirm', STORY_SCENE);
  await expect.poll(async () => (await storyState(page)).character).toBe('fundi');
  expect(errors).toEqual([]);
});

test('a clean win at the first stop gives three stars and opens the next stop', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await openMap(page, 'malkia');
  await playStop(page, 'mtaani');
  const s = await state(page);
  expect(s.opponent).toEqual({ kind: 'computer', level: 'easy' });
  expect(s.picks[0]).toBe('malkia');
  expect(s.players[1]).toBe('Dogo Mbishi');
  expect(s.looks).toMatchObject({ table: 'classic', background: 'wood' });
  expect(s.match).toMatchObject({ phase: 'break', current: 0 });

  await winCleanly(page);
  expect(await litStars(page)).toBe(3);
  expect((await state(page)).endButtons).toEqual(['gameOver-next', 'gameOver-rematch', 'gameOver-menu']);
  expect(await textOf(page, SCENE, 'gameOver-next')).toBe('Endelea');
  expect(await textOf(page, SCENE, 'gameOver-menu')).toMatch(/^Ramani \(\d+\)$/);

  await tap(page, 'gameOver-menu');
  await waitForScene(page, STORY_SCENE);
  const after = await storyState(page);
  expect(after.stars).toEqual({ mtaani: 3 });
  expect(after.open).toEqual(['mtaani', 'kariakoo']);
  expect(await dataOf(page, STORY_SCENE, 'stop-mtaani', 'stars')).toBe(3);
  expect(errors).toEqual([]);
});

test('Endelea plays the next stop on its own table, against its own rival', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await openMap(page, 'fundi');
  await playStop(page, 'mtaani');
  await winCleanly(page);
  await tap(page, 'gameOver-next');
  await expect.poll(async () => (await state(page)).story?.stop).toBe('kariakoo');
  const s = await state(page);
  expect(s.gameOverShown).toBe(false);
  expect(s.opponent).toEqual({ kind: 'computer', level: 'medium' });
  expect(s.players[1]).toBe('Mama Ntilie');
  expect(s.looks).toMatchObject({ table: 'kitenge', background: 'kanga' });
  expect(errors).toEqual([]);
});

test('a loss gives no stars and keeps the next stop closed; Rudia plays the stop again', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await openMap(page, 'fundi');
  await playStop(page, 'mtaani');
  // The black potted while reds are still on the table: the person loses.
  const black = (await state(page)).balls.find((b) => b.kind === 'black')!;
  await layout(page, [{ id: black.id, x: 0.3, y: 0.2 }, { id: 0, x: 0.3 + 0.2 * (0.3 / 0.36), y: 0.2 + 0.2 * (0.2 / 0.36) }], { phase: 'play', current: 0, groups: ['red', 'yellow'], ballInHand: null });
  await potTheBlack(page);
  expect((await waitUntilSettled(page)).gameOverShown).toBe(true);
  expect(await litStars(page)).toBe(0);
  expect((await state(page)).endButtons).toEqual(['gameOver-rematch', 'gameOver-menu']);

  await tap(page, 'gameOver-rematch');
  await expect.poll(async () => (await state(page)).gameOverShown).toBe(false);
  expect((await state(page)).story).toEqual({ stop: 'mtaani', fouls: 0, shots: 0 });

  await tap(page, 'menuButton');
  await waitForScene(page, MENU_SCENE);
  await openMap(page);
  expect(await storyState(page)).toMatchObject({ stars: {}, open: ['mtaani'] });
  expect(errors).toEqual([]);
});

test('a foul costs stars, and a lower result keeps the best stars', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await seedJourney(page, 'fundi', { mtaani: 3 });
  await openMap(page);
  await playStop(page, 'mtaani');
  // Break straight into a pocket without touching a ball: a foul by the person.
  await dragOnTable(page, { x: 0.15, y: 0.2 }, { x: 0, y: 0 });
  await pullPower(page, 0.25);
  await expect.poll(async () => (await state(page)).shots).toBe(1);
  await waitUntilSettled(page);
  expect((await state(page)).story).toEqual({ stop: 'mtaani', fouls: 1, shots: 1 });

  await winCleanly(page);
  expect(await litStars(page)).toBe(1);
  expect(await textOf(page, SCENE, 'gameOverNote')).toContain('nyota 3');
  await tap(page, 'gameOver-menu');
  await waitForScene(page, STORY_SCENE);
  expect((await storyState(page)).stars).toEqual({ mtaani: 3 });
  expect(errors).toEqual([]);
});

test('untouched, the end panel goes back to the map', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await openMap(page, 'fundi');
  await playStop(page, 'mtaani');
  await winCleanly(page);
  await waitForScene(page, STORY_SCENE);
  expect((await storyState(page)).stars).toEqual({ mtaani: 3 });
  // The finished stop is not offered as Continue.
  await back(page);
  await waitForScene(page, MENU_SCENE);
  expect(await menuState(page)).toMatchObject({ continueShown: false, continueStoryShown: false });
  expect(errors).toEqual([]);
});

test('a story game left half-way continues as the same stop, and its win counts', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await openMap(page, 'fundi');
  await playStop(page, 'mtaani');
  await reopen(page);
  expect(await menuState(page)).toMatchObject({ continueShown: false, continueStoryShown: true });
  await tapMenu(page, 'menu-continueStory');
  await waitForScene(page, SCENE);
  const s = await state(page);
  expect(s.story).toEqual({ stop: 'mtaani', fouls: 0, shots: 0 });
  expect(s.looks).toMatchObject({ table: 'classic', background: 'wood' });
  expect(s.players[1]).toBe('Dogo Mbishi');
  await winCleanly(page);
  expect(await litStars(page)).toBe(3);
  // The phone's back button on the end panel goes to the map, as Ramani does.
  await back(page);
  await waitForScene(page, STORY_SCENE);
  expect((await storyState(page)).stars).toEqual({ mtaani: 3 });
  expect(errors).toEqual([]);
});

test('if the person plays as a stop rival, a stand-in takes the stop', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await seedJourney(page, 'mjanja', upTo('sinza'));
  await openMap(page);
  await playStop(page, 'sinza');
  const s = await state(page);
  expect(s.picks[0]).toBe('mjanja');
  expect(s.players[1]).toBe('Kichwa');
  expect(errors).toEqual([]);
});

test('story rewards are locked in the pickers until earned, and can be chosen after', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await tapMenu(page, 'menu-tables');
  await expect.poll(async () => (await menuState(page)).panel).toBe('tables');
  expect(await textOf(page, MENU_SCENE, 'table-gold-label')).toBe('Dhahabu');
  expect(await textOf(page, MENU_SCENE, 'table-gold-lock')).toBe('Mshinde Bingwa');
  await tap(page, 'table-gold-touch', MENU_SCENE);
  await page.waitForTimeout(200);
  expect((await menuState(page)).selectedTable).not.toBe('gold');
  await tap(page, 'table-back', MENU_SCENE);

  const all = Object.fromEntries(STORY_STOPS.map((s) => [s.id, 3]));
  await seedJourney(page, 'fundi', all);
  for (const [kind, button, id, panel] of [
    ['table', 'menu-tables', 'gold', 'tables'],
    ['cue', 'menu-cues', 'champion', 'cues'],
    ['background', 'menu-backgrounds', 'trophies', 'backgrounds'],
  ] as const) {
    await tapMenu(page, button);
    await expect.poll(async () => (await menuState(page)).panel).toBe(panel);
    await tap(page, `${kind}-${id}-touch`, MENU_SCENE);
    await tap(page, `${kind}-confirm`, MENU_SCENE);
    await expect.poll(async () => (await menuState(page))[kind]).toBe(id);
  }
  await openMap(page);
  expect(await storyState(page)).toMatchObject({ total: 81, title: 'bingwa', chapter: 'visiwani' });
  expect((await storyState(page)).rewards).toHaveLength(STORY.rewards.length);
  expect(errors).toEqual([]);
});

test('in English, the journey and its end panel speak English', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await tap(page, 'menu-settings', MENU_SCENE);
  await tap(page, 'language-en', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).locale).toBe('en');
  await tap(page, 'settings-back', MENU_SCENE);
  expect(await textOf(page, MENU_SCENE, 'menu-playMenu')).toBe('PLAY');
  await openMenuPage(page, 'play');
  expect(await textOf(page, MENU_SCENE, 'menu-story')).toBe("Champion's Journey");
  await openMap(page, 'fundi');
  expect(await textOf(page, STORY_SCENE, 'story-title')).toBe("Champion's Journey");
  await playStop(page, 'mtaani');
  await winCleanly(page);
  expect(await textOf(page, SCENE, 'gameOver-next')).toBe('Next stop');
  expect(await textOf(page, SCENE, 'gameOver-menu')).toMatch(/^Map \(\d+\)$/);
  expect(errors).toEqual([]);
});

test('twist: the rival breaks at Manzese', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await seedJourney(page, 'fundi', upTo('manzese'));
  await openMap(page);
  await tap(page, 'stop-manzese', STORY_SCENE);
  expect(await textOf(page, STORY_SCENE, 'stopCard-body')).toContain('Sharti: mpinzani anapasua');
  await tap(page, 'stopCard-play', STORY_SCENE);
  await waitForScene(page, SCENE);
  await dismissHowToPlay(page);
  expect((await state(page)).match).toMatchObject({ breaker: 1 });
  expect(errors).toEqual([]);
});

test('twist: one foul loses at Mzee Kobe\'s club', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await seedJourney(page, 'fundi', upTo('klabu'));
  await openMap(page);
  await playStop(page, 'klabu');
  await dragOnTable(page, { x: 0.15, y: 0.2 }, { x: 0, y: 0 });
  await pullPower(page, 0.25);
  await expect.poll(async () => (await state(page)).shots).toBe(1);
  const s = await waitUntilSettled(page);
  expect(s.gameOverShown).toBe(true);
  expect(s.match).toMatchObject({ phase: 'over', winner: 1 });
  expect(await textOf(page, SCENE, 'gameOverDetail')).toBe('Fundi alicheza faulo');
  expect(await litStars(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('twist: no spin at Kigamboni', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await seedJourney(page, 'fundi', upTo('kigamboni'));
  await openMap(page);
  await playStop(page, 'kigamboni');
  await dragSpin(page, 0.6, -0.6);
  expect((await state(page)).spin).toEqual({ side: 0, height: 0 });
  expect(errors).toEqual([]);
});

test('twist: a shot limit counts down and running out loses, also after Continue', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await seedJourney(page, 'fundi', upTo('ubungo'));
  await openMap(page);
  await playStop(page, 'ubungo');
  expect((await state(page)).status).toContain('mapigo 14 yamebaki');
  // The game is saved when it is closed; then, as if 13 shots had been played before that.
  await reopen(page);
  await page.evaluate(() => {
    const raw = JSON.parse(window.localStorage.getItem('pool.storyMatch')!) as { data: { story: { shots: number } } };
    raw.data.story.shots = 13;
    window.localStorage.setItem('pool.storyMatch', JSON.stringify(raw));
  });
  await tapMenu(page, 'menu-continueStory');
  await waitForScene(page, SCENE);
  expect((await state(page)).status).toContain('mapigo 1 yamebaki');
  // The break: a legal shot that does not win, the last one allowed.
  await pullPower(page, 0.3);
  await expect.poll(async () => (await state(page)).shots).toBe(1);
  const s = await waitUntilSettled(page);
  expect(s.gameOverShown).toBe(true);
  expect(s.story).toMatchObject({ stop: 'ubungo', shots: 14 });
  expect(await textOf(page, SCENE, 'gameOverDetail')).toBe('Fundi amemaliza mapigo yake');
  expect(errors).toEqual([]);
});

test('a story win counts toward wins: the third win opens the Kitenge table, said on the end panel', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await seedWins(page, 2);
  await openMap(page, 'fundi');
  await playStop(page, 'mtaani');
  await winCleanly(page);
  await expect.poll(() => textOf(page, SCENE, 'gameOverNote')).toBe('Zawadi: meza ya Kitenge!');
  expect(errors).toEqual([]);
});

test('a stop card names the look it earns', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await seedJourney(page, 'fundi', upTo('kariakoo'));
  await openMap(page);
  await tap(page, 'stop-kariakoo', STORY_SCENE);
  await expect.poll(async () => (await storyState(page)).card).toBe('kariakoo');
  expect(await textOf(page, STORY_SCENE, 'stopCard-body')).toContain('Zawadi: meza ya Kitenge!');
  expect(errors).toEqual([]);
});

test('a Quick game never replaces a story game: both are kept, each with its own Continue', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await openMap(page, 'fundi');
  await playStop(page, 'mtaani');
  await pullPower(page, 0.3);
  const story = await waitUntilSettled(page);
  await tap(page, 'menuButton');
  await waitForScene(page, MENU_SCENE);
  expect(await menuState(page)).toMatchObject({ continueShown: false, continueStoryShown: true });
  // A new Quick game, left half-way too.
  await playFromMenu(page, 'two');
  expect((await state(page)).story).toBeNull();
  await pullPower(page, 0.3);
  const quick = await waitUntilSettled(page);
  await reopen(page);
  expect(await menuState(page)).toMatchObject({ continueShown: true, continueStoryShown: true, page: 'main', savedDot: true });
  await elementCenter(page, 'menu-savedDot', MENU_SCENE);
  // Inside CHEZA both buttons share a row, side by side, and the dot is gone.
  await openMenuPage(page, 'play');
  expect((await menuState(page)).savedDot).toBe(false);
  const [a, b] = await Promise.all(['menu-continue', 'menu-continueStory'].map((n) => page.evaluate(([s, m]) => window.__tzg!.boundsOf(s, m), [MENU_SCENE, n] as const)));
  expect(b!.left).toBeGreaterThan(a!.right);
  expect(b!.top).toBe(a!.top);
  expect(await textOf(page, MENU_SCENE, 'menu-continueStory')).toBe('Endelea na safari');

  await tapMenu(page, 'menu-continueStory');
  await waitForScene(page, SCENE);
  expect((await state(page)).story).toMatchObject({ stop: 'mtaani' });
  expect((await state(page)).balls).toEqual(story.balls);
  await tap(page, 'menuButton');
  await waitForScene(page, MENU_SCENE);
  await tapMenu(page, 'menu-continue');
  await waitForScene(page, SCENE);
  expect((await state(page)).story).toBeNull();
  expect((await state(page)).balls).toEqual(quick.balls);
  expect(errors).toEqual([]);
});

test('a story game saved by an older version, in the Quick game save, moves to Continue journey', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await openMap(page, 'fundi');
  await playStop(page, 'mtaani');
  await reopen(page);
  await page.evaluate(() => {
    window.localStorage.setItem('pool.match', window.localStorage.getItem('pool.storyMatch')!);
    window.localStorage.removeItem('pool.storyMatch');
  });
  await reopen(page);
  expect(await menuState(page)).toMatchObject({ continueShown: false, continueStoryShown: true });
  expect(await page.evaluate(() => window.localStorage.getItem('pool.match'))).toBeNull();
  await tapMenu(page, 'menu-continueStory');
  await waitForScene(page, SCENE);
  expect((await state(page)).story).toMatchObject({ stop: 'mtaani' });
  expect(errors).toEqual([]);
});
