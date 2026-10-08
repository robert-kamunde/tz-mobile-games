import { expect, type Page } from '@playwright/test';
import { bootTo, touchDrag, type PagePoint } from '../../../tooling/e2eHelpers';
import { POWER_BAR } from '../src/config/layout';
import type { MatchState, ShotVerdict } from '../src/rules/blackball';

/** Helpers for driving the pool table in browser tests, through real touch input where a player would. */

export interface BallState {
  id: number;
  kind: string;
  x: number;
  y: number;
  r: number;
  pocketed: boolean;
}

export interface PoolState {
  moving: boolean;
  shots: number;
  steps: number;
  aim: { x: number; y: number };
  power: number;
  balls: BallState[];
  events: string[];
  match: MatchState;
  verdict: ShotVerdict | null;
  status: string;
  gameOverShown: boolean;
  trays: { potted: number; slots: number }[];
  opponent: { kind: 'human' } | { kind: 'computer'; level: string };
  computer: 'thinking' | 'placing' | 'aiming' | 'power' | null;
  pickerShown: boolean;
}

export const SCENE = 'Table';
export const state = (page: Page) => page.evaluate(() => window.__tzg!.probe('pool.state') as PoolState);

export type OpponentChoice = 'two' | 'easy' | 'medium' | 'hard';

/** Picks an opponent on the picker with a real tap. */
export async function pickOpponent(page: Page, choice: OpponentChoice): Promise<void> {
  await expect.poll(async () => (await state(page)).pickerShown).toBe(true);
  await tap(page, `opponent-${choice}`);
  await expect.poll(async () => (await state(page)).pickerShown).toBe(false);
}

/** Opens the game and picks the opponent (two players unless told otherwise). */
export async function boot(page: Page, choice: OpponentChoice = 'two'): Promise<void> {
  await bootTo(page, SCENE);
  await pickOpponent(page, choice);
}

/** A table point (metres) in page pixels. */
export async function tablePoint(page: Page, x: number, y: number): Promise<PagePoint> {
  return page.evaluate(
    ([tx, ty]) => {
      const d = window.__tzg!.probe('pool.tableToDesign', tx, ty) as { x: number; y: number };
      return window.__tzg!.designToPage(d.x, d.y);
    },
    [x, y] as const,
  );
}

export async function elementCenter(page: Page, name: string): Promise<PagePoint> {
  const p = await page.evaluate((n) => window.__tzg!.elementCenter('Table', n), name);
  expect(p, `element ${name}`).not.toBeNull();
  return p!;
}

export async function tap(page: Page, name: string): Promise<void> {
  const p = await elementCenter(page, name);
  await page.touchscreen.tap(p.x, p.y);
}

/** Drags the power bar down by a fraction of its length and lets go. */
export async function pullPower(page: Page, fraction: number, options: { cancel?: boolean } = {}): Promise<void> {
  const handle = await elementCenter(page, 'powerHandle');
  const length = await page.evaluate(
    ([top, height]) => window.__tzg!.designToPage(0, top + height).y - window.__tzg!.designToPage(0, top).y,
    [POWER_BAR.top, POWER_BAR.height] as const,
  );
  await touchDrag(page, handle, { x: handle.x, y: handle.y + length * fraction }, options);
}

export async function waitUntilSettled(page: Page, timeoutMs = 30_000): Promise<PoolState> {
  await expect.poll(async () => (await state(page)).moving, { timeout: timeoutMs, intervals: [100] }).toBe(false);
  return state(page);
}

export function overlaps(balls: BallState[]): string[] {
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


/** Drags from one table point to another (metres), e.g. to aim or to move the cue ball. */
export async function dragOnTable(page: Page, from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  await touchDrag(page, await tablePoint(page, from.x, from.y), await tablePoint(page, to.x, to.y));
}

/** Test-only position setup (e2e builds): ball spots and match state. */
export async function layout(page: Page, balls: { id: number; x?: number; y?: number; pocketed?: boolean }[], match: Partial<MatchState>): Promise<void> {
  await page.evaluate(([b, m]) => window.__tzg!.probe('pool.testLayout', b, m), [balls, match] as const);
}
