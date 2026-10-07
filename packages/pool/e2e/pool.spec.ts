import { expect, test, type Page } from '@playwright/test';
import { bootTo, setHidden, touchDrag, trackErrors, type PagePoint } from '../../../tooling/e2eHelpers';
import { POWER_BAR } from '../src/config/layout';
import { UK_7FT_TABLE } from '../src/config/table';

interface BallState {
  id: number;
  kind: string;
  x: number;
  y: number;
  r: number;
  pocketed: boolean;
}

interface PoolState {
  moving: boolean;
  shots: number;
  steps: number;
  aim: { x: number; y: number };
  power: number;
  balls: BallState[];
  events: string[];
}

const SCENE = 'Table';
const boot = (page: Page) => bootTo(page, SCENE);
const state = (page: Page) => page.evaluate(() => window.__tzg!.probe('pool.state') as PoolState);

/** A table point (metres) in page pixels. */
async function tablePoint(page: Page, x: number, y: number): Promise<PagePoint> {
  return page.evaluate(
    ([tx, ty]) => {
      const d = window.__tzg!.probe('pool.tableToDesign', tx, ty) as { x: number; y: number };
      return window.__tzg!.designToPage(d.x, d.y);
    },
    [x, y] as const,
  );
}

async function elementCenter(page: Page, name: string): Promise<PagePoint> {
  const p = await page.evaluate((n) => window.__tzg!.elementCenter('Table', n), name);
  expect(p, `element ${name}`).not.toBeNull();
  return p!;
}

/** Drags the power bar down by a fraction of its length and lets go. */
async function pullPower(page: Page, fraction: number, options: { cancel?: boolean } = {}): Promise<void> {
  const handle = await elementCenter(page, 'powerHandle');
  const length = await page.evaluate(
    ([top, height]) => window.__tzg!.designToPage(0, top + height).y - window.__tzg!.designToPage(0, top).y,
    [POWER_BAR.top, POWER_BAR.height] as const,
  );
  await touchDrag(page, handle, { x: handle.x, y: handle.y + length * fraction }, options);
}

async function waitUntilSettled(page: Page, timeoutMs = 30_000): Promise<PoolState> {
  await expect.poll(async () => (await state(page)).moving, { timeout: timeoutMs, intervals: [100] }).toBe(false);
  return state(page);
}

function overlaps(balls: BallState[]): string[] {
  const on = balls.filter((b) => !b.pocketed);
  const out: string[] = [];
  for (let i = 0; i < on.length; i++) {
    for (let j = i + 1; j < on.length; j++) {
      const a = on[i]!;
      const b = on[j]!;
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 1e-6) out.push(`${a.id}/${b.id}`);
    }
  }
  return out;
}

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

test('a potted cue ball comes back to its starting spot', async ({ page }) => {
  await boot(page);
  // Aim at the top-left corner pocket; the path from the cue's start is clear.
  const cue = (await state(page)).balls[0]!;
  await touchDrag(page, await tablePoint(page, 0.3, 0.3), await tablePoint(page, 0, 0));
  await pullPower(page, 0.25);
  const settled = await waitUntilSettled(page);
  expect(settled.events).toContain('pocket');
  const after = settled.balls[0]!;
  expect(after.pocketed).toBe(false);
  expect([after.x, after.y]).toEqual([cue.x, cue.y]);
});

test('re-rack restores all balls', async ({ page }) => {
  await boot(page);
  await pullPower(page, 1);
  await waitUntilSettled(page);
  await page.touchscreen.tap(...Object.values(await elementCenter(page, 'rerackButton')) as [number, number]);
  await expect.poll(async () => (await state(page)).balls.filter((b) => b.pocketed).length).toBe(0);
  const s = await state(page);
  expect(s.balls[1]).toMatchObject({ x: UK_7FT_TABLE.footSpot, y: UK_7FT_TABLE.playWidth / 2 });
  expect(s.aim).toEqual({ x: 1, y: 0 });
});

test('going to the background mid-shot freezes the table and gives the same result after returning', async ({ page }) => {
  const errors = trackErrors(page);
  // Reference: the same break with no interruption.
  await boot(page);
  await pullPower(page, 0.9);
  const reference = await waitUntilSettled(page);

  await page.reload();
  await page.waitForFunction((k) => window.__tzg?.activeScenes().includes(k), SCENE);
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
