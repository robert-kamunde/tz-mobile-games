import { expect, test } from '@playwright/test';
import { trackErrors } from '../../../tooling/e2eHelpers';
import { TABLE_LAYOUT, TUBE } from '../src/config/layout';
import { UK_7FT_TABLE } from '../src/config/table';
import { boot, layout, potTheBlack, setUpBlackPot, state, waitUntilSettled } from './poolPage';

const ballPx = UK_7FT_TABLE.objectBallRadius * TABLE_LAYOUT.scale;

test('potted balls show in the tube: already potted at once, a newly potted ball rolls in on top', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  expect((await state(page)).tube).toEqual([]);
  await setUpBlackPot(page);
  const s = await state(page);
  const reds = s.balls.filter((b) => b.kind === 'red').map((b) => b.id);
  expect(s.tube).toEqual(reds);
  const black = s.balls.find((b) => b.kind === 'black')!.id;
  await potTheBlack(page);
  // The black goes in on top of the reds (with the random rack the shot can sink a yellow after it too).
  await expect.poll(async () => (await state(page)).tube.slice(0, reds.length + 1)).toEqual([...reds, black]);
  // It comes to rest on top of the last red, inside the tube (slowly, with four test browsers sharing the machine).
  const box = (name: string) => page.evaluate((n) => window.__tzg!.boundsOf('Table', n), name);
  await expect.poll(async () => {
    const [top, below, tube] = [await box(`tube-${black}`), await box(`tube-${reds[reds.length - 1]}`), await box('tube')];
    // Ball images carry a few pixels of padding, so compare centres: one ball's width (plus the gap) apart, in line.
    const mid = (b: { left: number; right: number; top: number; bottom: number }) => ({ x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 });
    const [t, u] = [mid(top!), mid(below!)];
    return Math.abs(u.y - t.y - (2 * ballPx + TUBE.gap)) < 0.5 && Math.abs(t.x - u.x) < 0.5 && top!.top > tube!.top;
  }, { timeout: 30_000 }).toBe(true);

  // Balls back on the table leave the tube.
  await waitUntilSettled(page);
  await layout(page, reds.map((id) => ({ id, pocketed: false, x: 0.5 + id * 0.06, y: 0.45 })), { phase: 'play', ballInHand: null });
  expect((await state(page)).tube[0]).toBe(black);
  expect(errors).toEqual([]);
});
