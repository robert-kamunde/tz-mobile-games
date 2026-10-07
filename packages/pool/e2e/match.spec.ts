import { expect, test, type Page } from '@playwright/test';
import { trackErrors } from '../../../tooling/e2eHelpers';
import { UK_7FT_TABLE } from '../src/config/table';
import { boot, dragOnTable, elementCenter, layout, pullPower, state, waitUntilSettled } from './poolPage';

const tap = async (page: Page, name: string) => {
  const p = await elementCenter(page, name);
  await page.touchscreen.tap(p.x, p.y);
};

test('player 1 breaks, and the cue ball stays behind the baulk line while placing it', async ({ page }) => {
  await boot(page);
  const s = await state(page);
  expect(s.match).toMatchObject({ phase: 'break', current: 0, ballInHand: 'baulk' });
  expect(s.status).toContain('Mchezaji 1');
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

test('potting the black when on it wins, and New game starts a match with the other player breaking', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  const s = await state(page);
  const reds = s.balls.filter((b) => b.kind === 'red').map((b) => ({ id: b.id, pocketed: true }));
  const black = s.balls.find((b) => b.kind === 'black')!;
  // Black 0.36 m from the top-left pocket, cue ball 0.2 m behind it on the same line.
  const blackSpot = { x: 0.3, y: 0.2 };
  const len = Math.hypot(blackSpot.x, blackSpot.y);
  const cueSpot = { x: blackSpot.x + (blackSpot.x / len) * 0.2, y: blackSpot.y + (blackSpot.y / len) * 0.2 };
  await layout(page, [...reds, { id: black.id, ...blackSpot }, { id: 0, ...cueSpot }], { phase: 'play', current: 0, groups: ['red', 'yellow'], ballInHand: null });
  expect((await state(page)).status).toContain('Mchezaji 1');

  await dragOnTable(page, { x: 0.9, y: 0.6 }, { x: 0, y: 0 });
  await pullPower(page, 0.3);
  await expect.poll(async () => (await state(page)).shots).toBe(1);
  const over = await waitUntilSettled(page);
  expect(over.verdict).toEqual({ kind: 'game-over', winner: 0, reason: 'black-potted' });
  expect(over.gameOverShown).toBe(true);

  // Shooting is disabled after the game.
  await pullPower(page, 0.5);
  expect((await state(page)).shots).toBe(1);

  await tap(page, 'newGameButton');
  await expect.poll(async () => (await state(page)).match).toMatchObject({ phase: 'break', breaker: 1, current: 1 });
  const fresh = await state(page);
  expect(fresh.gameOverShown).toBe(false);
  expect(fresh.balls.filter((b) => b.pocketed)).toEqual([]);
  expect(errors).toEqual([]);
});

test('New game during a match needs a second tap', async ({ page }) => {
  await boot(page);
  await layout(page, [{ id: 1, pocketed: true }], { phase: 'play' });
  await tap(page, 'newGameButton');
  await page.waitForTimeout(200);
  let s = await state(page);
  expect(s.match.phase).toBe('play');
  expect(s.balls[1]!.pocketed).toBe(true);

  await tap(page, 'newGameButton');
  await expect.poll(async () => (await state(page)).match.phase).toBe('break');
  s = await state(page);
  expect(s.balls[1]!.pocketed).toBe(false);
});
