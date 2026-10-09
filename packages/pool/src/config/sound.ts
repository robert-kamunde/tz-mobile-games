import type { SoundRecipe } from '@tzg/core';

/**
 * Placeholder sound effects, synthesised at start-up (docs/ASSETS.md). Replace with recordings in
 * the sound pass; the names stay the same.
 */
export type PoolSound = 'cue' | 'ball' | 'cushion' | 'pocket';

export const SOUND_RECIPES: Readonly<Record<PoolSound, SoundRecipe>> = {
  // Leather tip on the cue ball: a short dull tick.
  cue: {
    seconds: 0.05,
    peak: 0.7,
    layers: [
      { kind: 'tone', startHz: 950, endHz: 700, decay: 0.008, level: 1 },
      { kind: 'noise', cutoffHz: 3000, decay: 0.006, level: 0.8 },
    ],
  },
  // Ball on ball: a bright click.
  ball: {
    seconds: 0.06,
    peak: 0.8,
    layers: [
      { kind: 'tone', startHz: 2600, endHz: 2450, decay: 0.012, level: 1 },
      { kind: 'tone', startHz: 4100, endHz: 4000, decay: 0.006, level: 0.4 },
      { kind: 'noise', cutoffHz: 7000, decay: 0.003, level: 0.7 },
    ],
  },
  // Ball on cushion: a soft low thud.
  cushion: {
    seconds: 0.12,
    peak: 0.7,
    layers: [
      { kind: 'tone', startHz: 150, endHz: 110, decay: 0.04, level: 1 },
      { kind: 'noise', cutoffHz: 900, decay: 0.02, level: 0.6 },
    ],
  },
  // Ball dropping into a pocket: a hollow knock and a short rumble.
  pocket: {
    seconds: 0.3,
    peak: 0.8,
    layers: [
      { kind: 'tone', startHz: 230, endHz: 160, decay: 0.05, level: 1 },
      { kind: 'tone', startHz: 95, endHz: 70, decay: 0.12, level: 0.8 },
      { kind: 'noise', cutoffHz: 500, decay: 0.08, level: 0.5 },
    ],
  },
};

/** Fixed seed for the noise in the recipes, so every phone gets the same sounds. */
export const SOUND_SEED = 1;

/** How loud a contact is: silent below `silentBelow`, full at `fullAt` (m/s), a gentle curve between. */
export interface Loudness {
  readonly silentBelow: number;
  readonly fullAt: number;
  /** Below 1 lifts soft hits so they stay audible. */
  readonly curve: number;
}

export const SOUND_LOUDNESS: Readonly<{ ball: Loudness; cushion: Loudness }> = {
  ball: { silentBelow: 0.03, fullAt: 4, curve: 0.6 },
  cushion: { silentBelow: 0.05, fullAt: 3, curve: 0.6 },
};

export const SOUND_MIX = {
  /** Cue strike gain at the softest and hardest power. */
  cueMin: 0.3,
  cueMax: 1,
  pocket: 0.9,
  /**
   * Thinning: a sound of the same kind within this many physics steps (1 ms each) of the last one is
   * dropped unless it is at least this much louder, and at most this many sounds start per frame.
   */
  minGapSteps: 25,
  louderBy: 1.5,
  maxPerFrame: 4,
} as const;
