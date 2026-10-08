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

export interface MenuState {
  continueShown: boolean;
  panel: 'picker' | 'stats' | 'rules' | 'settings' | null;
  locale: string;
}

export const SCENE = 'Table';
export const MENU_SCENE = 'Menu';
export const state = (page: Page) => page.evaluate(() => window.__tzg!.probe('pool.state') as PoolState);
export const menuState = (page: Page) => page.evaluate(() => window.__tzg!.probe('pool.menu') as MenuState);

/** Waits until only the given scene runs (scene changes take a frame). */
export async function waitForScene(page: Page, key: string): Promise<void> {
  await page.waitForFunction((k) => {
    const active = window.__tzg?.activeScenes() ?? [];
    return active.length === 1 && active[0] === k;
  }, key);
}

export type OpponentChoice = 'two' | 'easy' | 'medium' | 'hard';

/** Picks an opponent on the table's picker (after New game) with a real tap. */
export async function pickOpponent(page: Page, choice: OpponentChoice): Promise<void> {
  await expect.poll(async () => (await state(page)).pickerShown).toBe(true);
  await tap(page, `opponent-${choice}`);
  await expect.poll(async () => (await state(page)).pickerShown).toBe(false);
}

/** From the main menu: Play, pick the opponent, and wait for the table. */
export async function playFromMenu(page: Page, choice: OpponentChoice): Promise<void> {
  await tap(page, 'menu-play', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('picker');
  await tap(page, `opponent-${choice}`, MENU_SCENE);
  await waitForScene(page, SCENE);
}

/** Opens the game and starts a new game from the menu (two players unless told otherwise). */
export async function boot(page: Page, choice: OpponentChoice = 'two'): Promise<void> {
  await bootTo(page, MENU_SCENE);
  await playFromMenu(page, choice);
}

/** Reloads the page, as when Android kills the app and the player opens it again, and waits for the menu. */
export async function reopen(page: Page): Promise<void> {
  await page.reload();
  await waitForScene(page, MENU_SCENE);
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

export async function elementCenter(page: Page, name: string, scene = SCENE): Promise<PagePoint> {
  const p = await page.evaluate(([s, n]) => window.__tzg!.elementCenter(s, n), [scene, name] as const);
  expect(p, `element ${name} in ${scene}`).not.toBeNull();
  return p!;
}

export async function tap(page: Page, name: string, scene = SCENE): Promise<void> {
  const p = await elementCenter(page, name, scene);
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

/** Player 1 on the black (reds all potted), with the black lined up on the top-left pocket. */
export async function setUpBlackPot(page: Page): Promise<void> {
  const s = await state(page);
  const reds = s.balls.filter((b) => b.kind === 'red').map((b) => ({ id: b.id, pocketed: true }));
  const black = s.balls.find((b) => b.kind === 'black')!;
  // Black 0.36 m from the top-left pocket, cue ball 0.2 m behind it on the same line.
  const blackSpot = { x: 0.3, y: 0.2 };
  const len = Math.hypot(blackSpot.x, blackSpot.y);
  const cueSpot = { x: blackSpot.x + (blackSpot.x / len) * 0.2, y: blackSpot.y + (blackSpot.y / len) * 0.2 };
  await layout(page, [...reds, { id: black.id, ...blackSpot }, { id: 0, ...cueSpot }], { phase: 'play', current: 0, groups: ['red', 'yellow'], ballInHand: null });
}

/** After setUpBlackPot: aims at the pocket and shoots (one more shot than before). */
export async function potTheBlack(page: Page): Promise<void> {
  const shots = (await state(page)).shots;
  await dragOnTable(page, { x: 0.9, y: 0.6 }, { x: 0, y: 0 });
  await pullPower(page, 0.3);
  await expect.poll(async () => (await state(page)).shots).toBe(shots + 1);
}
