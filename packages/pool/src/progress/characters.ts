import { COMPUTER_CHARACTERS, DEFAULT_PICKS, PLAYER_CHARACTERS, type Character } from '../config/characters';
import type { PlayerId } from '../rules/blackball';
import type { Opponent } from './opponent';

/** The characters chosen for player 1 and player 2 (ids from PLAYER_CHARACTERS, never the same twice). */
export type CharacterPicks = readonly [string, string];

/** The person is player 1 against the computer, which is player 2. */
const COMPUTER_SEAT: PlayerId = 1;

export function playerCharacter(id: string): Character | undefined {
  return PLAYER_CHARACTERS.find((c) => c.id === id);
}

/**
 * Who sits in a seat: the computer's character for its level (or `rival`, a story stop's character),
 * otherwise the pick for that seat.
 */
export function seatCharacter(seat: PlayerId, opponent: Opponent, picks: CharacterPicks, rival?: Character): Character {
  if (opponent.kind === 'computer' && seat === COMPUTER_SEAT) return rival ?? COMPUTER_CHARACTERS[opponent.level];
  return playerCharacter(picks[seat]) ?? playerCharacter(DEFAULT_PICKS[seat])!;
}

/** The first character, in picker order, other than `taken`. */
export function firstOtherThan(taken: string): string {
  return PLAYER_CHARACTERS.find((c) => c.id !== taken)!.id;
}

/** Picks for a new choice, from the last ones: player 2 moves off player 1's character if needed. */
export function withDistinctPicks(first: string, second: string): CharacterPicks {
  return [first, second === first ? firstOtherThan(first) : second];
}

/** Valid picks read from untrusted data, or null: two different known player characters. */
export function validatePicks(raw: unknown): CharacterPicks | null {
  if (!Array.isArray(raw) || raw.length !== 2) return null;
  const [a, b] = raw as unknown[];
  if (typeof a !== 'string' || typeof b !== 'string' || a === b) return null;
  if (!playerCharacter(a) || !playerCharacter(b)) return null;
  return [a, b];
}
