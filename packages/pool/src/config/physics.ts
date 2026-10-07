/**
 * Simulation tuning. Friction and restitution values are starting points chosen for feel and
 * will be tuned in play-testing; they are not measured from real cloth.
 */
export interface PhysicsConfig {
  /** Fixed simulation step. Small enough that the fastest ball moves well under one radius per step. */
  readonly stepSeconds: number;
  readonly gravity: number;
  /** Cloth friction while the ball skids (slip between ball and cloth). */
  readonly slidingFriction: number;
  /** Cloth resistance once the ball rolls without slipping. */
  readonly rollingResistance: number;
  /** Deceleration factor for spin around the vertical axis (side spin). */
  readonly spinFriction: number;
  /** Ball-to-ball bounce: 1 is perfectly elastic. */
  readonly ballRestitution: number;
  /** Cushion bounce for the speed into the cushion. */
  readonly cushionRestitution: number;
  /** Fraction of the cushion contact slip removed per impact (0 none, 1 all). Lets side spin change the rebound. */
  readonly cushionFriction: number;
  /** Below these a ball is considered stopped. */
  readonly stopSpeed: number;
  readonly stopSideSpin: number;
  /** Strike speed range for the cue ball, m/s. */
  readonly minShotSpeed: number;
  readonly maxShotSpeed: number;
  /** Largest cue-tip offset from the ball centre, as a fraction of the radius. */
  readonly maxTipOffset: number;
  /** Safety limit: a shot that has not settled after this long is stopped and logged. */
  readonly maxShotSeconds: number;
  /** A ball whose centre gets this far outside the playing area is treated as escaped (a bug) and removed. */
  readonly escapeMargin: number;
}

export const DEFAULT_PHYSICS: PhysicsConfig = {
  stepSeconds: 0.001,
  gravity: 9.81,
  slidingFriction: 0.2,
  rollingResistance: 0.012,
  spinFriction: 0.022,
  ballRestitution: 0.94,
  cushionRestitution: 0.75,
  cushionFriction: 0.2,
  stopSpeed: 0.005,
  stopSideSpin: 0.5,
  minShotSpeed: 0.15,
  maxShotSpeed: 7,
  maxTipOffset: 0.5,
  maxShotSeconds: 60,
  escapeMargin: 0.15,
};
