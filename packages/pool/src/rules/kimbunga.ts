import type { Opponent } from '../progress/opponent';
import type { PlayerId } from './blackball';

/** The person is always player 1 (id 0) against the computer. */
const PERSON: PlayerId = 0;

/**
 * Kimbunga! (0.36.0, Robert's idea, 2026-10-14): the breaker wins the game before the other player
 * has taken a single shot. Celebrated for a person only: against the computer when the person does
 * it, and in a two-player game for either player; never when the computer does it to the person.
 */
export interface KimbungaCheck {
  readonly winner: PlayerId;
  readonly breaker: PlayerId;
  /** Shots each player has played this game; null for a game saved before 0.36.0 (unknown). */
  readonly shotsBy: readonly [number, number] | null;
  readonly opponent: Opponent;
}

export function isKimbunga({ winner, breaker, shotsBy, opponent }: KimbungaCheck): boolean {
  if (!shotsBy || winner !== breaker) return false;
  if (opponent.kind === 'computer' && winner !== PERSON) return false;
  const loser: PlayerId = winner === 0 ? 1 : 0;
  return shotsBy[winner] > 0 && shotsBy[loser] === 0;
}
