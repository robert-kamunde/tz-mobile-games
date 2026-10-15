import { expect, test } from '@playwright/test';
import { trackErrors } from '../../../tooling/e2eHelpers';
import { AI_TURN } from '../src/config/ai';
import { boot, layout, overlaps, pullPower, state, tap, waitUntilSettled } from './poolPage';

test('Play on the menu opens the opponent picker, and the person breaks the first game against the computer', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page, 'easy');
  const picked = await state(page);
  expect(picked.opponent).toEqual({ kind: 'computer', level: 'easy' });
  // The person breaks the first game against the computer.
  expect(picked.match).toMatchObject({ phase: 'break', current: 0 });
  expect(picked.computer).toBeNull();
  expect(errors).toEqual([]);
});

test("the computer plays its turn on its own, and the player's controls do nothing meanwhile", async ({ page }) => {
  const errors = trackErrors(page);
  // The scene logs who played each shot ("shot 2: player 2, power ...").
  const shooters: string[] = [];
  page.on('console', (m) => {
    const match = /shot (\d+): player (\d)/.exec(m.text());
    if (match) shooters.push(`${match[1]}:${match[2]}`);
  });
  await boot(page, 'easy');
  // After a break: open table, the computer to play.
  await pullPower(page, 1);
  await waitUntilSettled(page);
  await layout(page, [], { phase: 'play', current: 1, ballInHand: null, groups: [null, null] });
  await expect.poll(async () => (await state(page)).computer).toBe('thinking');
  expect((await state(page)).status).toContain('Dogo Mbishi');

  // Try to shoot during the computer's turn: it must not count as a shot.
  await pullPower(page, 0.8);
  await expect.poll(async () => (await state(page)).shots, { timeout: 15_000 }).toBe(2);
  const settled = await waitUntilSettled(page);
  await page.waitForTimeout(300);
  expect((await state(page)).shots).toBe(2);
  expect(shooters).toEqual(['1:1', '2:2']);
  expect(overlaps(settled.balls)).toEqual([]);
  expect(settled.events).not.toContain('escaped');
  expect(errors).toEqual([]);
});

test('with ball in hand the computer places the cue ball legally and shoots', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page, 'medium');
  await layout(page, [], { phase: 'play', current: 1, ballInHand: 'anywhere', groups: ['yellow', 'red'] });
  await expect.poll(async () => (await state(page)).shots, { timeout: 15_000 }).toBe(1);
  const settled = await waitUntilSettled(page);
  expect(overlaps(settled.balls)).toEqual([]);
  expect(settled.verdict).not.toBeNull();
  expect(errors).toEqual([]);
});

test("Acha mchezo on the computer's turn stops it while asking; quitting is the person's loss", async ({ page }) => {
  await boot(page, 'hard');
  await layout(page, [], { phase: 'play', current: 1, ballInHand: null });
  await expect.poll(async () => (await state(page)).computer).toBe('thinking');
  await tap(page, 'quitButton');
  await expect.poll(async () => (await state(page)).quitShown).toBe(true);
  expect((await state(page)).computer).toBeNull();
  await page.waitForTimeout(500);
  expect((await state(page)).shots).toBe(0);
  // Endelea kucheza: the computer takes its turn after all.
  await tap(page, 'quit-keep');
  await expect.poll(async () => (await state(page)).computer).not.toBeNull();
  await expect.poll(async () => (await state(page)).shots, { timeout: 15_000 }).toBe(1);
  await waitUntilSettled(page);
  await layout(page, [], { phase: 'play', current: 0, ballInHand: null });
  await tap(page, 'quitButton');
  await tap(page, 'quit-confirm');
  await expect.poll(async () => (await state(page)).gameOverShown).toBe(true);
  expect((await state(page)).match).toMatchObject({ phase: 'over', winner: 1 });
  // The computer's win: its face on the panel, no confetti and no ta-da.
  expect(await page.evaluate(() => window.__tzg!.dataOf('Table', 'gameOverFace', 'character'))).toBe('mzee-kobe');
  expect((await state(page)).confetti).toBe(0);
  expect((await page.evaluate(() => window.__tzg!.sound())).played.map((p) => p.name)).not.toContain('win');
  const progress = JSON.parse((await page.evaluate(() => localStorage.getItem('pool.progress')))!) as { data: { vsComputer: { hard: { played: number; won: number } }; streak: { current: number } } };
  expect(progress.data.vsComputer.hard).toEqual({ played: 1, won: 0 });
  expect(progress.data.streak.current).toBe(0);
});

/**
 * Thinking runs in slices inside each frame. The test browser renders in software and the CPU
 * throttle makes single frames noisy (U2), so this compares average CPU time per frame while the
 * hardest level thinks with the same table while the player is aiming: the difference is the AI's
 * share and must stay near its per-frame budget.
 */
test('thinking adds little more than its budget to each frame on a 6x slower CPU @timing', async ({ page }) => {
  await boot(page, 'hard');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  const measure = async () => {
    await page.evaluate(() => window.__tzg!.resetFrameCpuStats());
    await page.waitForTimeout(1500);
    return page.evaluate(() => window.__tzg!.frameCpuStats());
  };
  const position = { phase: 'play', ballInHand: 'anywhere', groups: ['yellow', 'red'] } as const;
  await layout(page, [], { ...position, current: 0 });
  const idle = await measure();
  await layout(page, [], { ...position, current: 1 });
  await expect.poll(async () => (await state(page)).computer).toBe('thinking');
  const thinking = await measure();
  const summary = `player aiming ${idle.averageMs.toFixed(1)} ms/frame, computer thinking ${thinking.averageMs.toFixed(1)} ms/frame (max ${thinking.maxMs.toFixed(1)}), budget ${AI_TURN.frameBudgetMs} ms`;
  test.info().annotations.push({ type: 'hard-thinking@6x', description: summary });
  console.log(`6x CPU throttle: ${summary}`);
  expect(thinking.frames).toBeGreaterThan(5);
  expect(thinking.averageMs - idle.averageMs).toBeLessThan(AI_TURN.frameBudgetMs + 6);
  // It still makes its shot (the time limit ends the thinking on a slow device).
  await expect.poll(async () => (await state(page)).shots, { timeout: 30_000 }).toBe(1);
});
