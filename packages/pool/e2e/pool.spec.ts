import { expect, test } from '@playwright/test';
import { setHidden, touchDrag, trackErrors } from '../../../tooling/e2eHelpers';
import { UK_7FT_TABLE } from '../src/config/table';
import { SCENE, boot, overlaps, pickOpponent, pullPower, state, tablePoint, waitUntilSettled } from './poolPage';

test('opens on a racked table in Kiswahili with no errors', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  const s = await state(page);
  expect(s.balls).toHaveLength(16);
  expect(s.balls.filter((b) => b.pocketed)).toEqual([]);
  expect(s.moving).toBe(false);
  expect(await page.evaluate(() => window.__tzg!.locale())).toBe('sw');
  expect(errors).toEqual([]);
});

test('dragging on the table aims the cue at the finger', async ({ page }) => {
  await boot(page);
  const cue = (await state(page)).balls[0]!;
  const target = { x: cue.x + 0.3, y: cue.y - 0.2 };
  const from = await tablePoint(page, cue.x + 0.3, cue.y + 0.2);
  const to = await tablePoint(page, target.x, target.y);
  await touchDrag(page, from, to);
  const { aim } = await state(page);
  const expected = Math.atan2(target.y - cue.y, target.x - cue.x);
  // Within about 1 degree: touch positions are rounded to whole page pixels.
  expect(Math.abs(Math.atan2(aim.y, aim.x) - expected)).toBeLessThan(0.02);
});

test('pulling the power bar shoots, and the balls settle without overlapping', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  await pullPower(page, 0.8);
  await expect.poll(async () => (await state(page)).shots).toBe(1);
  const settled = await waitUntilSettled(page);
  expect(settled.events).toContain('ball');
  expect(settled.events).not.toContain('escaped');
  expect(settled.events).not.toContain('timeout');
  expect(overlaps(settled.balls)).toEqual([]);
  const moved = settled.balls.filter((b) => b.id !== 0 && Math.hypot(b.x - UK_7FT_TABLE.footSpot, b.y - UK_7FT_TABLE.playWidth / 2) > 0.2);
  expect(moved.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('a tiny pull cancels instead of shooting', async ({ page }) => {
  await boot(page);
  await pullPower(page, 0.01);
  await page.waitForTimeout(200);
  const s = await state(page);
  expect(s.shots).toBe(0);
  expect(s.moving).toBe(false);
  expect(s.power).toBe(0);
});

test('a touch cancelled by the system does not shoot', async ({ page }) => {
  await boot(page);
  await pullPower(page, 0.8, { cancel: true });
  await page.waitForTimeout(200);
  const s = await state(page);
  expect(s.shots).toBe(0);
  expect(s.power).toBe(0);
  // The bar still works afterwards.
  await pullPower(page, 0.5);
  await expect.poll(async () => (await state(page)).shots).toBe(1);
});

test('controls are ignored while balls are moving', async ({ page }) => {
  await boot(page);
  await pullPower(page, 1);
  await expect.poll(async () => (await state(page)).moving).toBe(true);
  const aimBefore = (await state(page)).aim;
  await pullPower(page, 0.5);
  await touchDrag(page, await tablePoint(page, 0.9, 0.1), await tablePoint(page, 0.9, 0.8));
  const s = await state(page);
  expect(s.shots).toBe(1);
  expect(s.aim).toEqual(aimBefore);
  await waitUntilSettled(page);
});

test('going to the background mid-shot freezes the table and gives the same result after returning', async ({ page }) => {
  // Plays two full breaks; slow when the other browser tests run alongside.
  test.setTimeout(60_000);
  const errors = trackErrors(page);
  // Reference: the same break with no interruption.
  await boot(page);
  await pullPower(page, 0.9);
  const reference = await waitUntilSettled(page);

  await page.reload();
  await page.waitForFunction((k) => window.__tzg?.activeScenes().includes(k), SCENE);
  await pickOpponent(page, 'two');
  await pullPower(page, 0.9);
  await expect.poll(async () => (await state(page)).steps).toBeGreaterThan(200);
  await setHidden(page, true);
  const frozen = await state(page);
  await page.waitForTimeout(500);
  expect((await state(page)).steps).toBe(frozen.steps);
  await setHidden(page, false);
  const resumed = await waitUntilSettled(page);

  expect(resumed.balls).toEqual(reference.balls);
  expect(errors).toEqual([]);
});

/**
 * CPU budget check. The test browser draws with a software renderer, so frames per second here
 * measure that renderer, not a phone GPU (KNOWN_ISSUES U2). CPU time per frame is what this
 * environment can judge: it must stay well inside a 60 fps frame (16.7 ms) on a 6x slower CPU.
 */
test('a full break stays inside the frame budget on a 6x slower CPU', async ({ page }) => {
  await boot(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await pullPower(page, 1);
  await page.evaluate(() => window.__tzg!.resetFrameCpuStats());
  const startFrames = await page.evaluate(() => window.__tzg!.frames());
  const t0 = Date.now();
  await page.waitForTimeout(2000);
  const cpu = await page.evaluate(() => window.__tzg!.frameCpuStats());
  const fps = ((await page.evaluate(() => window.__tzg!.frames())) - startFrames) / ((Date.now() - t0) / 1000);
  const summary = `cpu avg ${cpu.averageMs.toFixed(2)} ms, max ${cpu.maxMs.toFixed(1)} ms, ${cpu.frames} frames, ${fps.toFixed(1)} fps (software renderer)`;
  test.info().annotations.push({ type: 'break@6x', description: summary });
  console.log(`break at 6x CPU throttle: ${summary}`);
  expect(cpu.frames).toBeGreaterThan(10);
  expect(cpu.averageMs).toBeLessThan(8);
  const settled = await waitUntilSettled(page, 60_000);
  expect(overlaps(settled.balls)).toEqual([]);
});
