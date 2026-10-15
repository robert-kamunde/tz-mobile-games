import { expect, test, type Page } from '@playwright/test';
import { trackErrors } from '../../../tooling/e2eHelpers';
import { UK_7FT_TABLE } from '../src/config/table';
import { MENU_SCENE, SCENE, boot, dragOnTable, layout, menuState, quitGame, potTheBlack, pullPower, setUpBlackPot, state, tablePoint, tap, waitForScene, waitUntilSettled } from './poolPage';

const back = (page: Page) => page.evaluate(() => window.__tzg!.back());
const textOf = (page: Page, name: string) => page.evaluate((n) => window.__tzg!.textOf('Table', n), name);

/** Plays a game to a win by player 1 (Fundi). */
async function winGame(page: Page): Promise<void> {
  await boot(page);
  await setUpBlackPot(page);
  await potTheBlack(page);
  expect((await waitUntilSettled(page)).gameOverShown).toBe(true);
}

test('player 1 breaks, and the cue ball stays behind the baulk line while placing it', async ({ page }) => {
  await boot(page);
  const s = await state(page);
  expect(s.match).toMatchObject({ phase: 'break', current: 0, ballInHand: 'baulk' });
  expect(s.status).toContain('Fundi');
  const cue = s.balls[0]!;
  await dragOnTable(page, cue, { x: 1.0, y: 0.3 });
  const after = (await state(page)).balls[0]!;
  expect(after.x).toBeLessThanOrEqual(UK_7FT_TABLE.baulkLine + 1e-9);
  expect(after.y).toBeCloseTo(0.3, 2);
});

test('a foul gives the other player ball in hand anywhere, and the cue ball can be placed', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  // Break straight into the top-left pocket without touching a ball: a foul.
  await dragOnTable(page, { x: 0.15, y: 0.2 }, { x: 0, y: 0 });
  await pullPower(page, 0.25);
  await expect.poll(async () => (await state(page)).shots).toBe(1);
  const s = await waitUntilSettled(page);
  expect(s.verdict).toEqual({ kind: 'foul', reason: 'no-contact' });
  expect(s.match).toMatchObject({ current: 1, ballInHand: 'anywhere', phase: 'play' });
  expect(s.status).toContain('Faulo');
  expect(s.balls[0]!.pocketed).toBe(false);

  await dragOnTable(page, s.balls[0]!, { x: 0.9, y: 0.25 });
  const placed = (await state(page)).balls[0]!;
  expect(placed.x).toBeCloseTo(0.9, 1);
  expect(placed.y).toBeCloseTo(0.25, 1);
  expect(errors).toEqual([]);
});

test('the cue ball cannot be dropped on top of another ball', async ({ page }) => {
  await boot(page);
  await layout(page, [{ id: 0, x: 0.6, y: 0.45 }], { phase: 'play', ballInHand: 'anywhere' });
  const s = await state(page);
  const target = s.balls[1]!;
  await dragOnTable(page, s.balls[0]!, target);
  const cue = (await state(page)).balls[0]!;
  expect(Math.hypot(cue.x - target.x, cue.y - target.y)).toBeGreaterThanOrEqual(cue.r + target.r - 1e-9);
});

test('potting the black when on it wins; Rudia starts a match with the other player breaking, and a finished game cannot be quit', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  await setUpBlackPot(page);
  expect((await state(page)).status).toContain('Fundi');
  await potTheBlack(page);
  const over = await waitUntilSettled(page);
  expect(over.verdict).toEqual({ kind: 'game-over', winner: 0, reason: 'black-potted' });
  expect(over.gameOverShown).toBe(true);

  // Shooting is disabled after the game.
  await pullPower(page, 0.5);
  expect((await state(page)).shots).toBe(1);

  // No quitting a finished game; Rudia starts the next with the other player breaking.
  await tap(page, 'quitButton');
  await page.waitForTimeout(200);
  expect((await state(page)).quitShown).toBe(false);
  await tap(page, 'gameOver-rematch');
  await expect.poll(async () => (await state(page)).match).toMatchObject({ phase: 'break', breaker: 1, current: 1 });
  const fresh = await state(page);
  expect(fresh.gameOverShown).toBe(false);
  expect(fresh.balls.filter((b) => b.pocketed)).toEqual([]);
  expect(errors).toEqual([]);
});

test('Acha mchezo asks first; Endelea kucheza plays on, Acha gives the game to the other player', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  await layout(page, [{ id: 1, pocketed: true }], { phase: 'play', current: 1, ballInHand: null });
  await tap(page, 'quitButton');
  await expect.poll(async () => (await state(page)).quitShown).toBe(true);
  // The table ignores the player while it asks.
  await pullPower(page, 0.8);
  await page.waitForTimeout(200);
  expect((await state(page)).shots).toBe(0);
  await tap(page, 'quit-keep');
  await expect.poll(async () => (await state(page)).quitShown).toBe(false);
  expect((await state(page)).match.phase).toBe('play');

  // Back closes it too.
  await tap(page, 'quitButton');
  await expect.poll(async () => (await state(page)).quitShown).toBe(true);
  await back(page);
  await expect.poll(async () => (await state(page)).quitShown).toBe(false);

  // Player 2 is to play, so player 2 gives up and player 1 wins.
  await quitGame(page);
  const s = await state(page);
  expect(s.match).toMatchObject({ phase: 'over', winner: 0 });
  expect(s.kimbungaShown).toBe(false);
  expect(s.endButtons).toContain('gameOver-rematch');
  expect(await page.evaluate(() => localStorage.getItem('pool.match'))).toBeNull();
  const progress = JSON.parse((await page.evaluate(() => localStorage.getItem('pool.progress')))!) as { data: { twoPlayerGames: number } };
  expect(progress.data.twoPlayerGames).toBe(1);
  await tap(page, 'gameOver-rematch');
  await expect.poll(async () => (await state(page)).match.phase).toBe('break');
  expect((await state(page)).balls[1]!.pocketed).toBe(false);
  expect(errors).toEqual([]);
});

test('Kimbunga: the breaker wins before the other player shoots; the banner comes before the end panel', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  await setUpBlackPot(page);
  // Player 1 broke and has played on ever since.
  const s = await state(page);
  await layout(page, [], { current: 0 }, [4, 0]);
  expect((await state(page)).balls).toEqual(s.balls);
  await potTheBlack(page);
  await expect.poll(async () => (await state(page)).kimbungaShown, { timeout: 15_000 }).toBe(true);
  expect((await state(page)).gameOverShown).toBe(false);
  expect(await textOf(page, 'kimbunga')).toBe('KIMBUNGA!');
  // A tap skips it.
  await tap(page, 'kimbunga');
  await expect.poll(async () => (await state(page)).gameOverShown).toBe(true);
  expect((await state(page)).kimbungaShown).toBe(false);
  const progress = JSON.parse((await page.evaluate(() => localStorage.getItem('pool.progress')))!) as { data: { kimbunga: number } };
  expect(progress.data.kimbunga).toBe(1);
  expect(errors).toEqual([]);
});

test('each player sees their potted balls in a tray under their name once colours are decided', async ({ page }) => {
  await boot(page);
  // Open table: no trays yet.
  expect((await state(page)).trays).toEqual([{ potted: 0, slots: 0 }, { potted: 0, slots: 0 }]);
  const s = await state(page);
  const pottedReds = s.balls.filter((b) => b.kind === 'red').slice(0, 3).map((b) => ({ id: b.id, pocketed: true }));
  const pottedYellow = s.balls.filter((b) => b.kind === 'yellow').slice(0, 1).map((b) => ({ id: b.id, pocketed: true }));
  await layout(page, [...pottedReds, ...pottedYellow], { phase: 'play', current: 1, groups: ['yellow', 'red'], ballInHand: null });
  expect((await state(page)).trays).toEqual([{ potted: 1, slots: 7 }, { potted: 3, slots: 7 }]);
  await page.screenshot({ path: test.info().outputPath('trays.png') });
});

test('the first ball potted on an open table fills the potter\'s tray straight away', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  const s = await state(page);
  const red = s.balls.find((b) => b.kind === 'red')!;
  // Open table after the break: a red lined up on the top-left pocket, as in the black-pot setup.
  const redSpot = { x: 0.3, y: 0.2 };
  const len = Math.hypot(redSpot.x, redSpot.y);
  const cueSpot = { x: redSpot.x + (redSpot.x / len) * 0.2, y: redSpot.y + (redSpot.y / len) * 0.2 };
  await layout(page, [{ id: red.id, ...redSpot }, { id: 0, ...cueSpot }], { phase: 'play', current: 0, groups: [null, null], ballInHand: null });
  await dragOnTable(page, { x: 0.9, y: 0.6 }, { x: 0, y: 0 });
  await pullPower(page, 0.3);
  await expect.poll(async () => (await state(page)).shots).toBe(1);
  const after = await waitUntilSettled(page);
  expect(after.match.groups).toEqual(['red', 'yellow']);
  expect(after.trays[0]).toEqual({ potted: 1, slots: 7 });
  // The tray shows what is left; the name has no ball count next to it (Robert, 2026-10-11).
  expect(await page.evaluate(() => [window.__tzg!.textOf('Table', 'player-0'), window.__tzg!.textOf('Table', 'player-1')])).toEqual(['Fundi', 'Mwamba']);
  expect(errors).toEqual([]);
});

test('after a win, the end panel goes to the menu on its own after 10 seconds', async ({ page }) => {
  const errors = trackErrors(page);
  await winGame(page);
  expect(await textOf(page, 'gameOver-rematch')).toBe('Rudia');
  const seconds = (await state(page)).autoMenuSeconds!;
  expect(seconds).toBeGreaterThanOrEqual(8);
  expect(seconds).toBeLessThanOrEqual(10);
  expect(await textOf(page, 'gameOver-menu')).toMatch(/^Menyu \((9|10|8)\)$/);
  await waitForScene(page, MENU_SCENE);
  // The finished game is not offered again.
  expect((await menuState(page)).continueShown).toBe(false);
  expect(errors).toEqual([]);
});

test('after a win, a touch stops the countdown, and Menyu still goes to the menu', async ({ page }) => {
  const errors = trackErrors(page);
  await winGame(page);
  const p = await tablePoint(page, UK_7FT_TABLE.playLength / 2, UK_7FT_TABLE.playWidth / 2);
  await page.mouse.click(p.x, p.y);
  await expect.poll(async () => (await state(page)).autoMenuSeconds).toBeNull();
  expect(await textOf(page, 'gameOver-menu')).toBe('Menyu');
  await page.waitForTimeout(11_000);
  expect(await page.evaluate(() => window.__tzg!.activeScenes())).toEqual([SCENE]);
  await tap(page, 'gameOver-menu');
  await waitForScene(page, MENU_SCENE);
  expect(errors).toEqual([]);
});

test('a win shows the winner\'s face on the end panel, with confetti and a ta-da', async ({ page }) => {
  const errors = trackErrors(page);
  await winGame(page);
  expect(await page.evaluate(() => window.__tzg!.dataOf('Table', 'gameOverFace', 'character'))).toBe('fundi');
  expect((await state(page)).endCards).toEqual({ winner: 'fundi', loser: 'mwamba' });
  expect(await textOf(page, 'gameOverWinnerWord')).toBe('MSHINDI!');
  // Two players: no badges.
  expect(await textOf(page, 'gameOverFace-badge')).toBeNull();
  expect((await state(page)).confetti).toBeGreaterThan(0);
  expect((await page.evaluate(() => window.__tzg!.sound())).played.map((p) => p.name)).toContain('win');
  // Every piece clears itself away.
  await expect.poll(async () => (await state(page)).confetti, { timeout: 8_000 }).toBe(0);
  expect(errors).toEqual([]);
});

test('after a win, Rudia starts a rematch with the same players and the other player breaking', async ({ page }) => {
  const errors = trackErrors(page);
  await winGame(page);
  const before = await state(page);
  await tap(page, 'gameOver-rematch');
  await expect.poll(async () => (await state(page)).gameOverShown).toBe(false);
  const fresh = await state(page);
  expect(fresh.match).toMatchObject({ phase: 'break', breaker: 1, current: 1 });
  expect(fresh.players).toEqual(before.players);
  expect(fresh.opponent).toEqual({ kind: 'human' });
  expect(fresh.autoMenuSeconds).toBeNull();
  expect(fresh.balls.filter((b) => b.pocketed)).toEqual([]);
  expect(errors).toEqual([]);
});
