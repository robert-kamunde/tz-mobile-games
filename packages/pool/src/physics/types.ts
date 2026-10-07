/*
 * Pool physics data types. Everything in src/physics is plain TypeScript: no Phaser, no DOM,
 * and no trigonometry, hypot, exp/log/pow or random numbers: their results may differ between
 * JavaScript engines, which would break determinism. Only + - * / and square roots are used
 * (enforced by test/purity.test.ts).
 */

export type BallKind = 'cue' | 'red' | 'yellow' | 'black';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Ball {
  readonly id: number;
  readonly kind: BallKind;
  readonly radius: number;
  readonly mass: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /**
   * Top/back spin, stored as the velocity it gives the ball's contact point with the cloth.
   * A ball rolling without slipping has (sx, sy) = -(vx, vy).
   */
  sx: number;
  sy: number;
  /** Side spin: angular velocity around the vertical axis, rad/s, counter-clockwise positive. */
  wz: number;
  pocketed: boolean;
}

export interface Segment {
  readonly a: Vec2;
  readonly b: Vec2;
}

export interface Pocket {
  readonly id: number;
  readonly center: Vec2;
  readonly dropRadius: number;
}

export interface TableGeometry {
  readonly length: number;
  readonly width: number;
  readonly cushions: readonly Segment[];
  readonly pockets: readonly Pocket[];
}

/** A cue strike. direction must be a unit vector. */
export interface Shot {
  readonly direction: Vec2;
  /** 0..1 of the configured speed range. */
  readonly power: number;
  /** Tip offset from centre as a fraction of the radius: side (+ right) and height (+ above centre). */
  readonly side: number;
  readonly height: number;
}

export type ShotEvent =
  | { readonly type: 'ball'; readonly step: number; readonly a: number; readonly b: number }
  | { readonly type: 'cushion'; readonly step: number; readonly ball: number }
  | { readonly type: 'pocket'; readonly step: number; readonly ball: number; readonly pocket: number }
  | { readonly type: 'escaped'; readonly step: number; readonly ball: number }
  | { readonly type: 'timeout'; readonly step: number };
