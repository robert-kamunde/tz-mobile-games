/**
 * Computer opponent tuning (GAME_DESIGN.md "Computer opponent"). Values are starting points tuned
 * with the strength ladder (`npm run ai:ladder -w @tzg/pool`), not with players yet.
 */
export type AiLevel = 'easy' | 'medium' | 'hard';

export const AI_LEVEL_IDS: readonly AiLevel[] = ['easy', 'medium', 'hard'];

export interface AiLevelConfig {
  /** Standard deviation of the aiming error, radians. */
  readonly aimError: number;
  /** Standard deviation of the power error, as a fraction of the chosen power. */
  readonly powerError: number;
  /** Most candidate shots played out on a copy of the table (the best-looking ones first). */
  readonly maxCandidates: number;
  /** Strike speeds tried for each pot, as multiples of the speed that just reaches the pocket. */
  readonly speedFactors: readonly number[];
  /** Score where the cue ball stops: the next pot after a pot, and the opponent's best pot after a miss. */
  readonly positionPlay: boolean;
  /** Ball-in-hand spots considered. */
  readonly placementSpots: number;
  /** Physics steps the AI may spend on one decision (about 5 000 per shot played out). */
  readonly maxSteps: number;
  /** The best this many shots are replayed with the aim nudged both ways and judged on the average (0 = off). */
  readonly robustTop: number;
}

export const AI_LEVELS: Readonly<Record<AiLevel, AiLevelConfig>> = {
  easy: { aimError: 0.03, powerError: 0.2, maxCandidates: 6, speedFactors: [2], positionPlay: false, placementSpots: 2, maxSteps: 80_000, robustTop: 0 },
  medium: { aimError: 0.011, powerError: 0.1, maxCandidates: 16, speedFactors: [1.6, 2.6], positionPlay: true, placementSpots: 4, maxSteps: 200_000, robustTop: 0 },
  hard: { aimError: 0.004, powerError: 0.05, maxCandidates: 30, speedFactors: [1.4, 2.2, 3.4], positionPlay: true, placementSpots: 6, maxSteps: 400_000, robustTop: 5 },
};

export const AI_SEARCH = {
  /** Cuts thinner than this (cosine of the cut angle, about 78 degrees) are not tried. */
  minCutCos: 0.2,
  /** Extra clearance when checking that a ball's path is free, metres. */
  pathMargin: 0.002,
  /** Robustness check: the aim is nudged by this many standard deviations of the level's aim error. */
  robustSpread: 1.5,
  /** Plain contacts on a legal ball (no pot intended): strike speeds tried, m/s. */
  contactSpeeds: [1.2, 2.5],
  /** Last resort when nothing legal is found: this many evenly spread directions at this speed (m/s). */
  sweepDirections: 24,
  sweepSpeed: 2,
  /** Ball in hand: the cue ball goes this far behind the ghost ball on the line of the pot, metres. */
  placementDistances: [0.2, 0.45],
  /** Plain contacts kept among the candidates even when there are many pots, so a legal fallback is always played out. */
  contactReserve: 2,
  /** Break: cue ball spots on the baulk line's side, as offsets across the table from the centre, metres. */
  breakSpots: [0, 0.15, -0.15],
  /** Break: strike speeds (m/s) and sideways offsets of the aim point on the apex ball (fractions of its radius). */
  breakSpeeds: [7, 6],
  breakOffsets: [0, 0.15, -0.15],
} as const;

/** How outcomes are scored. Only the order and rough size matter. */
export const AI_SCORES = {
  win: 10_000,
  loss: -10_000,
  foul: -400,
  rerack: 0,
  continue: 100,
  turnOver: -60,
  /** Per own ball potted on the shot. */
  perBallPotted: 15,
  /** Weight of the next pot's ease (0..1) after a pot; the same weight counts against a miss that leaves the opponent an easy pot. */
  position: 60,
} as const;

/** Pacing of a computer turn on screen. */
export const AI_TURN = {
  /** Thinking always shows for at least this long, so the turn change is readable. */
  minThinkMs: 700,
  /** Thinking stops after this much time on screen and the best shot found so far is played (slow phones). */
  maxThinkMs: 4000,
  /** A frame gap longer than this (the app was in the background) counts as only this much thinking time. */
  maxFrameGapMs: 100,
  /** Wall-clock time per frame given to thinking; the table is still, so drawing needs little. */
  frameBudgetMs: 6,
  /** Steps of thinking between clock checks within a frame (about 2 ms each on a 6x slower CPU). */
  stepsPerSlice: 40,
  /** The cue swings to the chosen line, then the power bar fills, then the shot is played. */
  aimMs: 500,
  powerMs: 450,
  /** The cue ball moves to its ball-in-hand spot over this time. */
  placeMs: 350,
} as const;
