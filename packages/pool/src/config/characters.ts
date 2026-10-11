import type { AiLevel } from './ai';

/**
 * Characters (GAME_DESIGN.md "Characters"). They change only how a player looks and is named, never
 * how the game plays. Names are Tanzanian street nicknames (Robert, 2026-10-11: fun, nothing vulgar) and are not translated. Faces are PLACEHOLDERS (a coloured
 * circle with an initial) until the art pass (docs/ASSETS.md).
 */
export type Gender = 'male' | 'female';

export interface Character {
  /** Stable id, kept in saves and used to name the picker's faces (`character-<id>`). */
  readonly id: string;
  readonly name: string;
  readonly gender: Gender;
  /** Placeholder face: fill colour and the letter drawn on it. */
  readonly faceColor: number;
  readonly initial: string;
}

/**
 * The characters a person can play as. Robert asked for 75% men and 25% women (2026-10-11): 6 and 2.
 * The order is the order on the picker.
 */
export const PLAYER_CHARACTERS: readonly Character[] = [
  { id: 'fundi', name: 'Fundi', gender: 'male', faceColor: 0x8d5524, initial: 'F' },
  { id: 'malkia', name: 'Malkia', gender: 'female', faceColor: 0xa0522d, initial: 'M' },
  { id: 'mwamba', name: 'Mwamba', gender: 'male', faceColor: 0x6b4226, initial: 'M' },
  { id: 'bonge', name: 'Bonge', gender: 'male', faceColor: 0x7b4a2a, initial: 'B' },
  { id: 'shangazi', name: 'Shangazi', gender: 'female', faceColor: 0x9c5a3c, initial: 'S' },
  { id: 'mjanja', name: 'Mjanja', gender: 'male', faceColor: 0x5c3a21, initial: 'M' },
  { id: 'bishoo', name: 'Bishoo', gender: 'male', faceColor: 0x86502e, initial: 'B' },
  { id: 'kichwa', name: 'Kichwa', gender: 'male', faceColor: 0x734328, initial: 'K' },
];

/** The computer plays as one fixed character per level: a cheeky kid, the street food seller, the old master. */
export const COMPUTER_CHARACTERS: Readonly<Record<AiLevel, Character>> = {
  easy: { id: 'dogo-mbishi', name: 'Dogo Mbishi', gender: 'male', faceColor: 0x4a6fa5, initial: 'D' },
  medium: { id: 'mama-ntilie', name: 'Mama Ntilie', gender: 'female', faceColor: 0x8e5a9e, initial: 'N' },
  hard: { id: 'mzee-kobe', name: 'Mzee Kobe', gender: 'male', faceColor: 0x5f6b73, initial: 'K' },
  /** Impossible (0.16.0): the champion of the street tables. Name chosen by Claude, for Robert to confirm. */
  impossible: { id: 'bingwa', name: 'Bingwa', gender: 'male', faceColor: 0x8a6d1c, initial: 'B' },
};

/** Player 1 and player 2 before anyone has chosen. */
export const DEFAULT_PICKS: readonly [string, string] = ['fundi', 'mwamba'];

/** Longest name that fits the player panel next to the ball count on a small phone. */
export const MAX_NAME_LENGTH = 12;
