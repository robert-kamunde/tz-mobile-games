import { expect, test } from '@playwright/test';
import { trackErrors } from '../../../tooling/e2eHelpers';
import { TABLE_LAYOUT, TUBE } from '../src/config/layout';
import { UK_7FT_TABLE } from '../src/config/table';
import { buildTableGeometry } from '../src/physics/geometry';
import { boot, dragOnTable, layout, potTheBlack, pullPower, setUpBlackPot, state, waitUntilSettled } from './poolPage';

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

test('a ball potted in the far corner rolls under the table, rumbling, before it reaches the tube', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  // Pocket ids: 0 top-left (by the tube), 1 top-middle, 2 top-right, 3 bottom-right, 4 bottom-middle, 5 bottom-left.
  const delays = (await state(page)).tubeDelays;
  expect(delays[0]).toBeLessThan(150);
  expect(Math.max(...delays)).toBe(delays[3]);
  expect(delays[3]).toBeGreaterThan(1200);
  expect(delays[3]).toBeLessThanOrEqual(TUBE.underTable.maxMs);
  for (const far of [1, 4, 5]) expect(delays[far]).toBeGreaterThan(delays[0]!);

  // Player 1 on the black, lined up on the bottom-right pocket.
  const { length: L, width: W } = buildTableGeometry(UK_7FT_TABLE);
  const s = await state(page);
  const reds = s.balls.filter((b) => b.kind === 'red').map((b) => ({ id: b.id, pocketed: true }));
  const black = s.balls.find((b) => b.kind === 'black')!.id;
  const dir = { x: 0.3 / Math.hypot(0.3, 0.2), y: 0.2 / Math.hypot(0.3, 0.2) };
  const blackSpot = { x: L - 0.3, y: W - 0.2 };
  const cueSpot = { x: blackSpot.x - dir.x * 0.2, y: blackSpot.y - dir.y * 0.2 };
  await layout(page, [...reds, { id: black, ...blackSpot }, { id: 0, ...cueSpot }], { phase: 'play', current: 0, groups: ['red', 'yellow'], ballInHand: null });
  const heard = (await page.evaluate(() => (window.__tzg!.sound() as { played: unknown[] }).played.length));
  await dragOnTable(page, { x: L - 0.9, y: W - 0.6 }, { x: L, y: W });
  await pullPower(page, 0.3);

  // First under the table and not yet in the tube, then in the tube on top of the reds.
  await expect.poll(async () => (await state(page)).tubeWaiting, { intervals: [20] }).toEqual([black]);
  expect((await state(page)).tube).not.toContain(black);
  await expect.poll(async () => (await state(page)).tube.slice(0, reds.length + 1), { timeout: 15_000 }).toEqual([...reds.map((r) => r.id), black]);
  expect((await state(page)).tubeWaiting).toEqual([]);
  const sounds = await page.evaluate(() => (window.__tzg!.sound() as { played: { name: string }[] }).played.map((p) => p.name));
  const after = sounds.slice(heard);
  for (const name of ['pocket', 'underRoll', 'tubeRoll']) expect(after, name).toContain(name);
  await expect.poll(async () => (await page.evaluate(() => (window.__tzg!.sound() as { played: { name: string }[] }).played.map((p) => p.name))).slice(heard)).toContain('tubeLand');
  expect(errors).toEqual([]);
});
