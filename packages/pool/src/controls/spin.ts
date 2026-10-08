/**
 * Where the cue tip meets the cue ball, chosen on the spin control: a picture of the ball seen from
 * behind the cue. Up is topspin (follow), down is backspin (draw), right is right-hand side.
 */
export interface TipOffset {
  /** Fraction of the ball's radius, + to the right. */
  readonly side: number;
  /** Fraction of the ball's radius, + above centre. */
  readonly height: number;
}

export const CENTRE_TIP: TipOffset = { side: 0, height: 0 };

/**
 * Maps a point on the control (offset from its centre, screen pixels, y down) to a tip offset. The
 * control's edge is the largest offset the physics allows; points beyond it are pulled onto it.
 */
export function tipFromControl(dx: number, dy: number, controlRadius: number, maxTipOffset: number): TipOffset {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || controlRadius <= 0) return CENTRE_TIP;
  let x = dx / controlRadius;
  let y = -dy / controlRadius;
  const len = Math.sqrt(x * x + y * y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  // "+ 0" turns -0 into 0, so a centre hit compares and prints as plain zero.
  return { side: x * maxTipOffset + 0, height: y * maxTipOffset + 0 };
}

/** The inverse, for drawing the dot: a tip offset as a point on the control (y down). */
export function controlFromTip(tip: TipOffset, controlRadius: number, maxTipOffset: number): { x: number; y: number } {
  return { x: (tip.side / maxTipOffset) * controlRadius, y: (-tip.height / maxTipOffset) * controlRadius };
}
