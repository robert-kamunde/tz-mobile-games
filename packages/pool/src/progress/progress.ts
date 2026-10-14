import { AI_LEVEL_IDS, type AiLevel } from '../config/ai';
import { DEFAULT_BACKGROUND, isBackgroundId, type BackgroundId } from '../config/backgrounds';
import { DEFAULT_CUE, isCueId, type CueId } from '../config/cues';
import { DEFAULT_HAND, isHand, type Hand } from '../config/layout';
import { DEFAULT_TABLE, isTableId, type TableId } from '../config/tables';
import type { PlayerId } from '../rules/blackball';
import { validatePicks, type CharacterPicks } from './characters';
import { validateOpponent, type Opponent } from './opponent';

/** Results and preferences kept between games. */
export interface LevelRecord {
  readonly played: number;
  readonly won: number;
}

/** Wins in a row against the computer: now, and the most ever. */
export interface WinStreak {
  readonly current: number;
  readonly best: number;
}

export interface PoolProgress {
  /** Games finished against each computer level, and how many the player won. */
  readonly vsComputer: Readonly<Record<AiLevel, LevelRecord>>;
  /** Two-player games finished on this phone. */
  readonly twoPlayerGames: number;
  /** The opponent chosen last time, marked on the picker. */
  readonly lastOpponent: Opponent | null;
  /** The characters chosen last time, selected on the picker. Saves from before 0.9 have none. */
  readonly lastPicks: CharacterPicks | null;
  /** The table to play on (Meza on the menu). Saves from before 0.11 have none: Classic. */
  readonly table: TableId;
  /** The cue shown on the table (Fimbo on the menu). Saves from before 0.12 have none: Klasiki. */
  readonly cue: CueId;
  /** Controls on the right or, for left-handed players, the left (Settings). Saves from before 0.14 have none: right. */
  readonly hand: Hand;
  /** Behind the table (Mandhari on the menu). Saves from before 0.15 have none: Klasiki. */
  readonly background: BackgroundId;
  /** Wins in a row against the computer (Takwimu). Saves from before 0.34 have none: counting starts at 0. */
  readonly streak: WinStreak;
}

export const PROGRESS_VERSION = 1;

/** The person is always player 1 (id 0) against the computer. */
const PERSON: PlayerId = 0;

export function defaultProgress(): PoolProgress {
  const vsComputer = Object.fromEntries(AI_LEVEL_IDS.map((level) => [level, { played: 0, won: 0 }])) as Record<AiLevel, LevelRecord>;
  return { vsComputer, twoPlayerGames: 0, lastOpponent: null, lastPicks: null, table: DEFAULT_TABLE, cue: DEFAULT_CUE, hand: DEFAULT_HAND, background: DEFAULT_BACKGROUND, streak: { current: 0, best: 0 } };
}

/** Games won against the computer at every level, story games included. */
export function computerWins(progress: PoolProgress): number {
  return AI_LEVEL_IDS.reduce((sum, level) => sum + progress.vsComputer[level].won, 0);
}

/** Counts a finished game. */
export function recordGame(progress: PoolProgress, opponent: Opponent, winner: PlayerId): PoolProgress {
  if (opponent.kind === 'human') return { ...progress, twoPlayerGames: progress.twoPlayerGames + 1 };
  const before = progress.vsComputer[opponent.level];
  const won = winner === PERSON;
  const after = { played: before.played + 1, won: before.won + (won ? 1 : 0) };
  const current = won ? progress.streak.current + 1 : 0;
  const streak = { current, best: Math.max(progress.streak.best, current) };
  return { ...progress, vsComputer: { ...progress.vsComputer, [opponent.level]: after }, streak };
}

const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;

export function validateProgress(raw: unknown): PoolProgress | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!isCount(r.twoPlayerGames)) return null;
  const last = r.lastOpponent === null ? null : validateOpponent(r.lastOpponent);
  if (r.lastOpponent !== null && last === null) return null;
  if (typeof r.vsComputer !== 'object' || r.vsComputer === null) return null;
  const vs = r.vsComputer as Record<string, unknown>;
  const vsComputer = {} as Record<AiLevel, LevelRecord>;
  for (const level of AI_LEVEL_IDS) {
    const entry = vs[level];
    // A level added in an update (Impossible, 0.16.0) is missing from older saves: no games yet.
    if (entry === undefined) {
      vsComputer[level] = { played: 0, won: 0 };
      continue;
    }
    if (typeof entry !== 'object' || entry === null) return null;
    const { played, won } = entry as Record<string, unknown>;
    if (!isCount(played) || !isCount(won) || won > played) return null;
    vsComputer[level] = { played, won };
  }
  // Missing (an older save) or unreadable picks only lose the remembered choice, never the stats.
  const lastPicks = validatePicks(r.lastPicks);
  // Likewise a missing or unknown table (say, one removed in an update) falls back to Classic.
  const table = isTableId(r.table) ? r.table : DEFAULT_TABLE;
  const cue = isCueId(r.cue) ? r.cue : DEFAULT_CUE;
  const hand = isHand(r.hand) ? r.hand : DEFAULT_HAND;
  const background = isBackgroundId(r.background) ? r.background : DEFAULT_BACKGROUND;
  return { vsComputer, twoPlayerGames: r.twoPlayerGames, lastOpponent: last, lastPicks, table, cue, hand, background, streak: validateStreak(r.streak) };
}

/** A missing (older save) or broken streak starts again from nothing; the other stats stay. */
function validateStreak(raw: unknown): WinStreak {
  if (typeof raw !== 'object' || raw === null) return { current: 0, best: 0 };
  const { current, best } = raw as Record<string, unknown>;
  if (!isCount(current) || !isCount(best) || current > best) return { current: 0, best: 0 };
  return { current, best };
}
