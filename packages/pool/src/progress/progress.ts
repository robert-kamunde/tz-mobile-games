import { AI_LEVEL_IDS, type AiLevel } from '../config/ai';
import type { PlayerId } from '../rules/blackball';
import { validateOpponent, type Opponent } from './opponent';

/** Results and preferences kept between games. */
export interface LevelRecord {
  readonly played: number;
  readonly won: number;
}

export interface PoolProgress {
  /** Games finished against each computer level, and how many the player won. */
  readonly vsComputer: Readonly<Record<AiLevel, LevelRecord>>;
  /** Two-player games finished on this phone. */
  readonly twoPlayerGames: number;
  /** The opponent chosen last time, marked on the picker. */
  readonly lastOpponent: Opponent | null;
}

export const PROGRESS_VERSION = 1;

/** The person is always player 1 (id 0) against the computer. */
const PERSON: PlayerId = 0;

export function defaultProgress(): PoolProgress {
  const vsComputer = Object.fromEntries(AI_LEVEL_IDS.map((level) => [level, { played: 0, won: 0 }])) as Record<AiLevel, LevelRecord>;
  return { vsComputer, twoPlayerGames: 0, lastOpponent: null };
}

/** Counts a finished game. */
export function recordGame(progress: PoolProgress, opponent: Opponent, winner: PlayerId): PoolProgress {
  if (opponent.kind === 'human') return { ...progress, twoPlayerGames: progress.twoPlayerGames + 1 };
  const before = progress.vsComputer[opponent.level];
  const after = { played: before.played + 1, won: before.won + (winner === PERSON ? 1 : 0) };
  return { ...progress, vsComputer: { ...progress.vsComputer, [opponent.level]: after } };
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
    if (typeof entry !== 'object' || entry === null) return null;
    const { played, won } = entry as Record<string, unknown>;
    if (!isCount(played) || !isCount(won) || won > played) return null;
    vsComputer[level] = { played, won };
  }
  return { vsComputer, twoPlayerGames: r.twoPlayerGames, lastOpponent: last };
}
