import type { SoundRecipe } from '@tzg/core';

/**
 * Sound effects, synthesised at start-up (docs/ASSETS.md); recordings may replace them later under the
 * same names. Version 2 (Part C, 0.19.0): each sound is built like the real thing, from a few short
 * ringing modes, band-limited noise for the contact, and soft starts so nothing clicks harshly.
 */
export type PoolSound = 'cue' | 'ball' | 'cushion' | 'pocket' | 'underRoll' | 'tubeRoll' | 'tubeLand' | 'tap' | 'unlock' | 'kimbunga' | 'win';

export const SOUND_RECIPES: Readonly<Record<PoolSound, SoundRecipe>> = {
  // Leather tip on the cue ball: a dull "tock". A low wooden body, the ball's own ring, a soft scuff.
  cue: {
    seconds: 0.07,
    peak: 0.7,
    layers: [
      { kind: 'tone', startHz: 760, endHz: 620, decay: 0.012, level: 1, attack: 0.0006 },
      { kind: 'tone', startHz: 1480, endHz: 1400, decay: 0.006, level: 0.35, attack: 0.0006 },
      { kind: 'tone', startHz: 3300, endHz: 3250, decay: 0.004, level: 0.25 },
      { kind: 'noise', cutoffHz: 4000, highHz: 900, decay: 0.004, level: 0.7, attack: 0.0004 },
    ],
  },
  // Ball on ball: the bright, glassy click of resin balls, a few ringing modes that die away fast.
  ball: {
    seconds: 0.08,
    peak: 0.8,
    layers: [
      { kind: 'tone', startHz: 3650, endHz: 3600, decay: 0.014, level: 1 },
      { kind: 'tone', startHz: 5900, endHz: 5850, decay: 0.008, level: 0.45 },
      { kind: 'tone', startHz: 8300, endHz: 8250, decay: 0.004, level: 0.2 },
      { kind: 'tone', startHz: 1150, endHz: 1100, decay: 0.005, level: 0.3 },
      { kind: 'noise', cutoffHz: 9000, highHz: 2000, decay: 0.0018, level: 0.8 },
    ],
  },
  // Ball on cushion: a soft rubber thump with a little knock from the wooden rail behind it.
  cushion: {
    seconds: 0.15,
    peak: 0.7,
    layers: [
      { kind: 'tone', startHz: 190, endHz: 120, decay: 0.035, level: 1, attack: 0.002 },
      { kind: 'tone', startHz: 410, endHz: 380, decay: 0.012, level: 0.4, attack: 0.001 },
      { kind: 'noise', cutoffHz: 1300, highHz: 120, decay: 0.012, level: 0.6, attack: 0.001 },
    ],
  },
  // Into a pocket: a hollow wooden knock and the ball dropping away under the table.
  pocket: {
    seconds: 0.3,
    peak: 0.8,
    layers: [
      { kind: 'tone', startHz: 270, endHz: 190, decay: 0.04, level: 1, attack: 0.001 },
      { kind: 'tone', startHz: 540, endHz: 500, decay: 0.014, level: 0.4, attack: 0.001 },
      { kind: 'noise', cutoffHz: 700, highHz: 80, decay: 0.03, level: 0.5, attack: 0.001 },
      { kind: 'noise', cutoffHz: 900, highHz: 180, decay: 0.12, level: 0.28, delay: 0.07, attack: 0.04, tremoloHz: 26 },
    ],
  },
  // The return under the table (0.30.0): a soft, low rumble. Played again and again, overlapping,
  // for as long as a ball is on its way, so a far pocket rumbles longer than a near one.
  // 0.32.0: deeper and softer (lower cutoff, slower fade-in, gentler flutter) after Robert found it loud.
  underRoll: {
    seconds: 0.3,
    peak: 0.7,
    layers: [{ kind: 'noise', cutoffHz: 300, highHz: 45, decay: 0.13, level: 1, attack: 0.1, tremoloHz: 14 }],
  },
  // Along the short pipe into the tube: a brighter roll on glass.
  tubeRoll: {
    seconds: 0.15,
    peak: 0.7,
    layers: [{ kind: 'noise', cutoffHz: 1100, highHz: 220, decay: 0.06, level: 1, attack: 0.03, tremoloHz: 30 }],
  },
  // The click of a ball landing on the balls (or the cap) in the tube.
  tubeLand: {
    seconds: 0.06,
    peak: 0.7,
    layers: [
      { kind: 'tone', startHz: 3500, endHz: 3450, decay: 0.012, level: 1 },
      { kind: 'tone', startHz: 5700, endHz: 5650, decay: 0.006, level: 0.45 },
      { kind: 'noise', cutoffHz: 8000, highHz: 2000, decay: 0.0015, level: 0.8 },
    ],
  },
  // A button press (0.32.0): a soft, short wooden tick, quieter than any sound on the table.
  tap: {
    seconds: 0.05,
    peak: 0.6,
    layers: [
      { kind: 'tone', startHz: 1250, endHz: 1050, decay: 0.008, level: 1, attack: 0.001 },
      { kind: 'tone', startHz: 2600, endHz: 2500, decay: 0.003, level: 0.25 },
      { kind: 'noise', cutoffHz: 3500, highHz: 700, decay: 0.002, level: 0.4, attack: 0.0005 },
    ],
  },
  // Something unlocked (0.35.0): a bright rising bell arpeggio (C, E, G, high C) with a sparkle on top.
  unlock: {
    seconds: 1.1,
    peak: 0.7,
    layers: [
      { kind: 'tone', startHz: 523, endHz: 523, decay: 0.22, level: 0.8, attack: 0.004 },
      { kind: 'tone', startHz: 659, endHz: 659, decay: 0.22, level: 0.8, attack: 0.004, delay: 0.1 },
      { kind: 'tone', startHz: 784, endHz: 784, decay: 0.24, level: 0.8, attack: 0.004, delay: 0.2 },
      { kind: 'tone', startHz: 1047, endHz: 1047, decay: 0.4, level: 1, attack: 0.004, delay: 0.3 },
      { kind: 'tone', startHz: 2094, endHz: 2094, decay: 0.3, level: 0.25, attack: 0.004, delay: 0.3 },
      { kind: 'noise', cutoffHz: 9000, highHz: 4000, decay: 0.15, level: 0.12, attack: 0.05, delay: 0.32, tremoloHz: 22 },
    ],
  },
  // Kimbunga! (0.36.0): a gust of wind sweeping in, then a bold rising fanfare (G, C, E, G, high C).
  kimbunga: {
    seconds: 1.6,
    peak: 0.75,
    layers: [
      { kind: 'noise', cutoffHz: 1800, highHz: 250, decay: 0.18, level: 0.5, attack: 0.25, tremoloHz: 9 },
      { kind: 'tone', startHz: 392, endHz: 392, decay: 0.18, level: 0.75, attack: 0.004, delay: 0.35 },
      { kind: 'tone', startHz: 523, endHz: 523, decay: 0.18, level: 0.75, attack: 0.004, delay: 0.47 },
      { kind: 'tone', startHz: 659, endHz: 659, decay: 0.2, level: 0.8, attack: 0.004, delay: 0.59 },
      { kind: 'tone', startHz: 784, endHz: 784, decay: 0.22, level: 0.85, attack: 0.004, delay: 0.71 },
      { kind: 'tone', startHz: 1047, endHz: 1047, decay: 0.5, level: 1, attack: 0.004, delay: 0.83 },
      { kind: 'tone', startHz: 523, endHz: 523, decay: 0.5, level: 0.5, attack: 0.004, delay: 0.83 },
      { kind: 'tone', startHz: 2094, endHz: 2094, decay: 0.35, level: 0.25, attack: 0.004, delay: 0.83 },
      { kind: 'noise', cutoffHz: 9000, highHz: 4000, decay: 0.2, level: 0.12, attack: 0.05, delay: 0.85, tremoloHz: 22 },
    ],
  },
  // A person won (0.37.0), with the confetti: a quick, happy "ta-da" (G, C, then a held C-E-G chord).
  win: {
    seconds: 1.0,
    peak: 0.7,
    layers: [
      { kind: 'tone', startHz: 392, endHz: 392, decay: 0.08, level: 0.7, attack: 0.004 },
      { kind: 'tone', startHz: 523, endHz: 523, decay: 0.08, level: 0.7, attack: 0.004, delay: 0.1 },
      { kind: 'tone', startHz: 523, endHz: 523, decay: 0.35, level: 0.8, attack: 0.004, delay: 0.22 },
      { kind: 'tone', startHz: 659, endHz: 659, decay: 0.35, level: 0.7, attack: 0.004, delay: 0.22 },
      { kind: 'tone', startHz: 784, endHz: 784, decay: 0.35, level: 0.7, attack: 0.004, delay: 0.22 },
      { kind: 'tone', startHz: 1568, endHz: 1568, decay: 0.2, level: 0.15, attack: 0.004, delay: 0.22 },
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
  /** The return: under the table (repeated every `underRollEveryMs`), along the pipe, and landing. */
  /** 0.32.0: about a third of the 0.30.0 level (0.35), which Robert found too loud. */
  underRoll: 0.12,
  underRollEveryMs: 220,
  tubeRoll: 0.4,
  tubeLand: 0.55,
  /** Every button press. */
  tap: 0.3,
  /** The "Imefunguliwa!" popup. */
  unlock: 0.6,
  /** The Kimbunga! banner. */
  kimbunga: 0.7,
  /** A person's win, with the confetti. */
  win: 0.6,
  /**
   * Thinning: a sound of the same kind within this many physics steps (1 ms each) of the last one is
   * dropped unless it is at least this much louder, and at most this many sounds start per frame.
   */
  minGapSteps: 25,
  louderBy: 1.5,
  maxPerFrame: 4,
} as const;
