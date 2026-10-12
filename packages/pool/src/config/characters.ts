import type { AiLevel } from './ai';

/**
 * Characters (GAME_DESIGN.md "Characters"). They change only how a player looks and is named, never
 * how the game plays. Names are Tanzanian street nicknames (Robert, 2026-10-11: fun, nothing vulgar) and are not translated. Each has a drawn portrait
 * (config/portraits.ts).
 */
export type Gender = 'male' | 'female';

export interface Character {
  /** Stable id, kept in saves and used to name the picker's faces (`character-<id>`). */
  readonly id: string;
  readonly name: string;
  readonly gender: Gender;
}

/**
 * The characters a person can play as. Robert asked for 75% men and 25% women (2026-10-11): 6 and 2.
 * The order is the order on the picker.
 */
export const PLAYER_CHARACTERS: readonly Character[] = [
  { id: 'fundi', name: 'Fundi', gender: 'male' },
  { id: 'malkia', name: 'Malkia', gender: 'female' },
  { id: 'mwamba', name: 'Mwamba', gender: 'male' },
  { id: 'bonge', name: 'Bonge', gender: 'male' },
  { id: 'shangazi', name: 'Shangazi', gender: 'female' },
  { id: 'mjanja', name: 'Mjanja', gender: 'male' },
  { id: 'bishoo', name: 'Bishoo', gender: 'male' },
  { id: 'kichwa', name: 'Kichwa', gender: 'male' },
];

/** The computer plays as one fixed character per level: a cheeky kid, the street food seller, the old master. */
export const COMPUTER_CHARACTERS: Readonly<Record<AiLevel, Character>> = {
  easy: { id: 'dogo-mbishi', name: 'Dogo Mbishi', gender: 'male' },
  medium: { id: 'mama-ntilie', name: 'Mama Ntilie', gender: 'female' },
  hard: { id: 'mzee-kobe', name: 'Mzee Kobe', gender: 'male' },
  /** Impossible (0.16.0): the champion of the street tables. Name chosen by Claude, confirmed by Robert 2026-10-12. */
  impossible: { id: 'bingwa', name: 'Bingwa', gender: 'male' },
};

/**
 * Rivals met only in Safari ya Bingwa's chapters 2 and 3 (Robert chose three chapters, 2026-10-12):
 * people from other parts of Tanzania, named by Claude. The computer plays as them at the stop's level.
 */
export const STORY_CHARACTERS: readonly Character[] = [
  { id: 'kaka-tunda', name: 'Kaka Tunda', gender: 'male' },
  { id: 'bwana-shamba', name: 'Bwana Shamba', gender: 'male' },
  { id: 'mama-pweza', name: 'Mama Pweza', gender: 'female' },
  { id: 'kahawa', name: 'Kahawa', gender: 'male' },
  { id: 'mzee-simba', name: 'Mzee Simba', gender: 'male' },
  { id: 'sato', name: 'Sato', gender: 'male' },
  { id: 'dada-ndizi', name: 'Dada Ndizi', gender: 'female' },
  { id: 'kapteni', name: 'Kapteni', gender: 'male' },
  { id: 'baridi', name: 'Baridi', gender: 'male' },
  { id: 'mzee-karafuu', name: 'Mzee Karafuu', gender: 'male' },
];

/** Every character, for faces and catchphrases. */
export const ALL_CHARACTERS: readonly Character[] = [...PLAYER_CHARACTERS, ...Object.values(COMPUTER_CHARACTERS), ...STORY_CHARACTERS];

/** Player 1 and player 2 before anyone has chosen. */
export const DEFAULT_PICKS: readonly [string, string] = ['fundi', 'mwamba'];

/** Longest name that fits the player panel next to the ball count on a small phone. */
export const MAX_NAME_LENGTH = 12;
