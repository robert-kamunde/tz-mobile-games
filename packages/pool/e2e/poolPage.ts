import { expect, type Page } from '@playwright/test';
import { bootTo, touchDrag, type PagePoint } from '../../../tooling/e2eHelpers';
import { POWER_BAR, SPIN_CONTROL } from '../src/config/layout';
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
  tube: number[];
  /** Potted balls still rolling under the table, and each pocket's time to the tube (ms, pocket ids 0-5). */
  tubeWaiting: number[];
  tubeDelays: number[];
  /** Red balls' white dot: where it sits on the ball (fractions of the radius) and whether it is on top. */
  spots: { id: number; dx: number; dy: number; visible: boolean }[];
  /** Potted balls still shown sinking into their pocket. */
  sinking: number[];
  events: string[];
  match: MatchState;
  verdict: ShotVerdict | null;
  status: string;
  gameOverShown: boolean;
  /** Seconds before the end panel goes to the menu on its own; null when it will not. */
  autoMenuSeconds: number | null;
  /** The end panel's buttons showing, left to right. */
  endButtons: string[];
  trays: { potted: number; slots: number }[];
  /** The catchphrase showing and whose it is. */
  quip: { speaker: number; text: string } | null;
  hand: 'right' | 'left';
  /** Design-pixel centres of the spin face and fine-aim strip, and the playing area's left edge: they move for left-handed players. */
  controls: { spin: { x: number; y: number }; fineAim: { x: number; y: number }; tableLeft: number; tableRight: number };
  opponent: { kind: 'human' } | { kind: 'computer'; level: string };
  computer: 'thinking' | 'placing' | 'aiming' | 'power' | null;
  /** Acha mchezo? is asking. */
  quitShown: boolean;
  /** The KIMBUNGA! banner is showing. */
  kimbungaShown: boolean;
  /** Shots by each player this game; null when not known (a laid-out position or an older save). */
  shotsBy: [number, number] | null;
  /** The unlock shown in the "Imefunguliwa!" popup, or null. */
  unlockShown: string | null;
  players: [string, string];
  picks: [string, string];
  howToPlayShown: boolean;
  spin: { side: number; height: number };
  lastShot: { direction: { x: number; y: number }; power: number; side: number; height: number } | null;
  /** The story stop being played and the person's fouls; null in Quick game. */
  story: { stop: string; fouls: number } | null;
  looks: { table: string; cue: string; background: string };
}

export interface MenuState {
  /** Continue for a Quick game, and for a story game. */
  continueShown: boolean;
  continueStoryShown: boolean;
  /** The main page, CHEZA ('play') or Mapambo ('looks'). */
  page: 'main' | 'play' | 'looks';
  /** The dot on CHEZA saying a game or journey is waiting. */
  savedDot: boolean;
  panel: 'picker' | 'characters' | 'tables' | 'cues' | 'backgrounds' | 'stats' | 'rules' | 'settings' | 'exit' | null;
  selectedCharacter: string | null;
  /** Selected on the open table picker. */
  selectedTable: string | null;
  selectedCue: string | null;
  selectedBackground: string | null;
  /** The open look picker's page (from 0) and how many it has. */
  lookPage: number;
  lookPages: number;
  /** The saved table choice. */
  table: string;
  /** The saved cue choice. */
  cue: string;
  /** The saved hand (Settings). */
  hand: 'right' | 'left';
  /** The saved background. */
  background: string;
  locale: string;
  /** Menu buttons with a red new-unlock dot. */
  newDots: string[];
  /** The unlock shown in the "Imefunguliwa!" popup, or null. */
  unlockShown: string | null;
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

export type OpponentChoice = 'two' | 'easy' | 'medium' | 'hard' | 'impossible';

/**
 * Goes through New game's choices with real taps: player 1's character (`characters[0]` if given,
 * else the one selected), then the opponent, then player 2's character for two players.
 */
export async function chooseMatch(page: Page, scene: string, choice: OpponentChoice, characters: readonly string[] = []): Promise<void> {
  const shown = (name: string) => page.waitForFunction(([s, n]) => window.__tzg!.elementCenter(s, n) !== null, [scene, name] as const);
  await shown('character-confirm');
  if (characters[0]) await tap(page, `character-${characters[0]}`, scene);
  await tap(page, 'character-confirm', scene);
  await shown(`opponent-${choice}`);
  await tap(page, `opponent-${choice}`, scene);
  if (choice !== 'two') return;
  await shown('character-confirm');
  if (characters[1]) await tap(page, `character-${characters[1]}`, scene);
  await tap(page, 'character-confirm', scene);
}

/** Acha mchezo with real taps: asks, then Acha; waits for the end panel. */
export async function quitGame(page: Page): Promise<void> {
  await tap(page, 'quitButton');
  await expect.poll(async () => (await state(page)).quitShown).toBe(true);
  await tap(page, 'quit-confirm');
  await expect.poll(async () => (await state(page)).gameOverShown).toBe(true);
}

/** From the main menu: Play, pick the characters and opponent, and wait for the table. */
export async function playFromMenu(page: Page, choice: OpponentChoice, characters: readonly string[] = []): Promise<void> {
  await tapMenu(page, 'menu-play');
  await expect.poll(async () => (await menuState(page)).panel).toBe('characters');
  await chooseMatch(page, MENU_SCENE, choice, characters);
  await waitForScene(page, SCENE);
  await dismissHowToPlay(page);
}

/** Closes the one-time "how to play" panel if it shows (a player's first game). */
export async function dismissHowToPlay(page: Page): Promise<void> {
  if (!(await state(page)).howToPlayShown) return;
  await tap(page, 'howToPlay-ok');
  await expect.poll(async () => (await state(page)).howToPlayShown).toBe(false);
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

/** Which menu page holds each button that is not on the main page. */
const MENU_PAGE_OF: Record<string, 'play' | 'looks'> = {
  'menu-continue': 'play',
  'menu-continueStory': 'play',
  'menu-play': 'play',
  'menu-story': 'play',
  'menu-tables': 'looks',
  'menu-cues': 'looks',
  'menu-backgrounds': 'looks',
};

/** Opens a menu page with real taps (Rudi first when another sub page is open). */
export async function openMenuPage(page: Page, which: 'main' | 'play' | 'looks'): Promise<void> {
  const current = (await menuState(page)).page;
  if (current === which) return;
  if (current !== 'main') {
    await tap(page, 'menu-back', MENU_SCENE);
    await expect.poll(async () => (await menuState(page)).page).toBe('main');
  }
  if (which === 'main') return;
  await tap(page, which === 'play' ? 'menu-playMenu' : 'menu-looks', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).page).toBe(which);
}

/** Taps a menu button, opening CHEZA or Mapambo first when the button lives there. */
export async function tapMenu(page: Page, name: string): Promise<void> {
  await openMenuPage(page, MENU_PAGE_OF[name] ?? 'main');
  await tap(page, name, MENU_SCENE);
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

/**
 * Test-only position setup (e2e builds): ball spots and match state. Who has shot so far is unknown
 * (so no Kimbunga) unless `shotsBy` is given.
 */
export async function layout(page: Page, balls: { id: number; x?: number; y?: number; pocketed?: boolean }[], match: Partial<MatchState>, shotsBy?: [number, number]): Promise<void> {
  await page.evaluate(([b, m, by]) => window.__tzg!.probe('pool.testLayout', b, m, by), [balls, match, shotsBy ?? null] as const);
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

/** Design pixels to page pixels (the canvas is scaled to fit the screen). */
async function designPoint(page: Page, x: number, y: number): Promise<PagePoint> {
  return page.evaluate(([dx, dy]) => window.__tzg!.designToPage(dx, dy), [x, y] as const);
}

/** Drags on the spin control from its centre to a point given in control radii (x right, y down). */
export async function dragSpin(page: Page, x: number, y: number): Promise<void> {
  const c = (await state(page)).controls.spin;
  const r = SPIN_CONTROL.radius;
  await touchDrag(page, await designPoint(page, c.x, c.y), await designPoint(page, c.x + x * r, c.y + y * r));
}

/** Drags along the fine-aim strip by a distance in design pixels (+ right), starting at its centre. */
export async function dragFineAim(page: Page, designDx: number, options: { cancel?: boolean } = {}): Promise<void> {
  const f = (await state(page)).controls.fineAim;
  await touchDrag(page, await designPoint(page, f.x, f.y), await designPoint(page, f.x + designDx, f.y), { steps: 12, ...options });
}

export const aimAngle = (aim: { x: number; y: number }) => Math.atan2(aim.y, aim.x);

/**
 * Writes games won against the computer straight into the save, as earlier play would have, and
 * reopens the game. What they unlock counts as already announced.
 */
export async function seedWins(page: Page, wins: number): Promise<void> {
  await page.evaluate((won) => {
    const raw = window.localStorage.getItem('pool.progress');
    const data = raw ? (JSON.parse(raw) as { data: Record<string, unknown> }).data : null;
    const vsComputer = { ...((data?.vsComputer as Record<string, unknown>) ?? {}), easy: { played: won, won } };
    const base = data ?? { twoPlayerGames: 0, lastOpponent: null, lastPicks: null, table: 'classic', cue: 'classic', hand: 'right', background: 'classic' };
    window.localStorage.setItem('pool.progress', JSON.stringify({ v: 1, data: { ...base, vsComputer } }));
    // Seeded as if played before 0.35.0: what this earns counts as already announced (no popups).
    window.localStorage.removeItem('pool.unlocks');
  }, wins);
  await reopen(page);
}
