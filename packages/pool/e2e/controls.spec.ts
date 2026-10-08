import { expect, test, type Page } from '@playwright/test';
import { trackErrors } from '../../../tooling/e2eHelpers';
import { DEFAULT_PHYSICS } from '../src/config/physics';
import { FINE_AIM } from '../src/config/layout';
import { aimAngle, boot, dragFineAim, dragOnTable, dragSpin, layout, pullPower, state, waitUntilSettled } from './poolPage';

const MAX = DEFAULT_PHYSICS.maxTipOffset;

/** Red 0.36 m from the top-left pocket, cue ball 0.2 m behind it on the same line, aimed at the pocket. */
const RED_SPOT = { x: 0.3, y: 0.2 };
const LEN = Math.hypot(RED_SPOT.x, RED_SPOT.y);
const CUE_SPOT = { x: RED_SPOT.x + (RED_SPOT.x / LEN) * 0.2, y: RED_SPOT.y + (RED_SPOT.y / LEN) * 0.2 };

async function straightPot(page: Page): Promise<void> {
  const s = await state(page);
  const red = s.balls.find((b) => b.kind === 'red' && !b.pocketed)!;
  await layout(page, [{ id: 0, ...CUE_SPOT, pocketed: false }, { id: red.id, ...RED_SPOT }], {
    phase: 'play',
    current: 0,
    groups: ['red', 'yellow'],
    ballInHand: null,
  });
  await dragOnTable(page, { x: 0.9, y: 0.6 }, { x: 0, y: 0 });
}

test('the spin dot sets where the cue strikes: topspin follows, backspin draws, and it resets after each shot', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  const results: Record<string, { verdict: unknown; cueDistance: number }> = {};
  for (const [name, dy] of [['follow', -1], ['draw', 1]] as const) {
    await straightPot(page);
    await dragSpin(page, 0, dy);
    const set = (await state(page)).spin;
    expect(set.side).toBeCloseTo(0, 6);
    expect(set.height).toBeCloseTo(-dy * MAX, 2);

    const shots = (await state(page)).shots;
    await pullPower(page, 0.3);
    await expect.poll(async () => (await state(page)).shots).toBe(shots + 1);
    const played = (await state(page)).lastShot!;
    expect(played.height).toBeCloseTo(-dy * MAX, 2);
    // Reset as soon as the shot is played; touching the control while balls roll changes nothing.
    expect((await state(page)).spin).toEqual({ side: 0, height: 0 });
    await dragSpin(page, 1, 0);
    expect((await state(page)).spin).toEqual({ side: 0, height: 0 });

    const settled = await waitUntilSettled(page);
    const cue = settled.balls[0]!;
    results[name] = { verdict: settled.verdict, cueDistance: Math.hypot(cue.x, cue.y) };
  }
  // Same pot: with follow the cue ball runs on after the red into the pocket; with draw it comes back past where it started.
  expect(results.follow!.verdict).toEqual({ kind: 'foul', reason: 'cue-ball-potted' });
  expect(results.draw!.verdict).toEqual({ kind: 'continue' });
  expect(results.draw!.cueDistance).toBeGreaterThan(LEN + 0.2);
  expect(errors).toEqual([]);
});

test('fine aim turns the aim a little each way, and a cancelled touch never shoots', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  const start = aimAngle((await state(page)).aim);
  await dragFineAim(page, 200);
  const turned = aimAngle((await state(page)).aim) - start;
  // About 200 design pixels of drag; touch positions are rounded to page pixels.
  expect(turned).toBeGreaterThan(190 * FINE_AIM.radiansPerPixel);
  expect(turned).toBeLessThan(210 * FINE_AIM.radiansPerPixel);

  await dragFineAim(page, -200);
  expect(aimAngle((await state(page)).aim) - start).toBeCloseTo(0, 2);

  await dragFineAim(page, 100, { cancel: true });
  await page.waitForTimeout(200);
  const s = await state(page);
  expect(s.shots).toBe(0);
  expect(s.moving).toBe(false);
  // The strip still works after the cancel.
  const before = aimAngle(s.aim);
  await dragFineAim(page, -100);
  expect(aimAngle((await state(page)).aim)).toBeLessThan(before);
  // Chrome reports its own notice when a page cannot cancel a system touch cancel; it is not the game's error.
  expect(errors.filter((e) => !e.startsWith('Ignored attempt to cancel a touchcancel'))).toEqual([]);
});

test("spin and fine aim do nothing during the computer's turn", async ({ page }) => {
  await boot(page, 'hard');
  await layout(page, [], { phase: 'play', current: 1, ballInHand: null, groups: ['yellow', 'red'] });
  await expect.poll(async () => (await state(page)).computer).toBe('thinking');
  const aim = (await state(page)).aim;
  await dragSpin(page, 0, -1);
  await dragFineAim(page, 150);
  const s = await state(page);
  expect(s.spin).toEqual({ side: 0, height: 0 });
  if (s.computer === 'thinking') expect(s.aim).toEqual(aim);
  // The computer still plays its own centre-ball shot.
  await expect.poll(async () => (await state(page)).shots, { timeout: 15_000 }).toBe(1);
  const shot = (await state(page)).lastShot!;
  expect([shot.side, shot.height]).toEqual([0, 0]);
});
