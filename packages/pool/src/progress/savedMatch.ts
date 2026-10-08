import type { TableConfig } from '../config/table';
import { CUE_BALL_ID, rackBalls } from '../physics/rack';
import type { Ball } from '../physics/types';
import { validateMatchState, type MatchState } from '../rules/blackball';
import { validateOpponent, type Opponent } from './opponent';

/**
 * A game in progress, as saved on the phone (ARCHITECTURE A17). Only what cannot be derived is
 * stored: ball kinds, sizes and masses come from the rack, so a save cannot change them.
 */
export interface SavedBall {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly pocketed: boolean;
}

export interface SavedMatch {
  readonly opponent: Opponent;
  readonly match: MatchState;
  readonly balls: readonly SavedBall[];
  /** Shots played in this game so far (seeds the computer's aim and numbers the log). */
  readonly shots: number;
}

export const SAVED_MATCH_VERSION = 1;

/** Overlap allowed between two saved balls, metres: rounding only, never a real overlap. */
const OVERLAP_TOLERANCE = 1e-6;

export function toSavedBalls(balls: readonly Ball[]): SavedBall[] {
  return balls.map((b) => ({ id: b.id, x: b.x, y: b.y, pocketed: b.pocketed }));
}

/** A fresh rack with the saved positions applied: the balls to put back on the table. */
export function restoreBalls(saved: readonly SavedBall[], table: TableConfig): Ball[] {
  const byId = new Map(saved.map((b) => [b.id, b]));
  return rackBalls(table).map((ball) => {
    const s = byId.get(ball.id);
    if (!s) throw new Error(`saved game has no ball ${ball.id}`);
    return { ...ball, x: s.x, y: s.y, pocketed: s.pocketed };
  });
}

/**
 * Returns the saved game if it describes a legal table and match, otherwise null. Rejects anything
 * a bug or hand-edited storage could produce: missing or extra balls, positions off the table,
 * overlapping balls, a potted cue ball, or an impossible match state.
 */
export function validateSavedMatch(raw: unknown, table: TableConfig): SavedMatch | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const opponent = validateOpponent(r.opponent);
  const match = validateMatchState(r.match);
  if (!opponent || !match) return null;
  if (!Number.isInteger(r.shots) || (r.shots as number) < 0) return null;
  if (!Array.isArray(r.balls)) return null;

  const rack = rackBalls(table);
  if (r.balls.length !== rack.length) return null;
  const balls: SavedBall[] = [];
  const seen = new Set<number>();
  // A resting ball can sit in a pocket mouth, slightly outside the cushion rectangle.
  const margin = table.jawLength;
  for (const item of r.balls as unknown[]) {
    if (typeof item !== 'object' || item === null) return null;
    const b = item as Record<string, unknown>;
    if (!Number.isInteger(b.id) || seen.has(b.id as number) || !rack.some((k) => k.id === b.id)) return null;
    if (typeof b.x !== 'number' || typeof b.y !== 'number' || typeof b.pocketed !== 'boolean') return null;
    if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) return null;
    if (b.x < -margin || b.x > table.playLength + margin || b.y < -margin || b.y > table.playWidth + margin) return null;
    seen.add(b.id as number);
    balls.push({ id: b.id as number, x: b.x, y: b.y, pocketed: b.pocketed });
  }
  if (balls.find((b) => b.id === CUE_BALL_ID)?.pocketed !== false) return null;

  const restored = restoreBalls(balls, table).filter((b) => !b.pocketed);
  for (let i = 0; i < restored.length; i++) {
    for (let j = i + 1; j < restored.length; j++) {
      const a = restored[i]!;
      const c = restored[j]!;
      const dx = a.x - c.x;
      const dy = a.y - c.y;
      const min = a.radius + c.radius - OVERLAP_TOLERANCE;
      if (dx * dx + dy * dy < min * min) return null;
    }
  }
  return { opponent, match, balls, shots: r.shots as number };
}
