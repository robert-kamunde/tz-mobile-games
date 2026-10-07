import type { Ball, Segment, Vec2 } from './types';

export type AimTarget =
  | {
      readonly type: 'ball';
      readonly ballId: number;
      /** Direction the object ball will travel (line of centres at impact). */
      readonly objectDirection: Vec2;
      /** Direction the cue ball deflects to, ignoring spin. Zero for a full-ball hit. */
      readonly cueDirection: Vec2;
    }
  | { readonly type: 'cushion' }
  | { readonly type: 'none' };

export interface AimGuide {
  /** Where the cue ball's centre will be at first contact (the "ghost ball"). */
  readonly contact: Vec2;
  readonly distance: number;
  readonly target: AimTarget;
}

/**
 * Sweeps the cue ball along a straight line and reports the first ball or cushion it would touch.
 * Used for the aiming guide and later by the AI. Ignores friction and spin (a straight-line guide).
 */
export function computeAimGuide(
  cue: Ball,
  direction: Vec2,
  balls: readonly Ball[],
  cushions: readonly Segment[],
  maxDistance: number,
): AimGuide | null {
  const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
  if (!Number.isFinite(len) || len < 1e-9 || cue.pocketed) return null;
  const d = { x: direction.x / len, y: direction.y / len };
  const p = { x: cue.x, y: cue.y };

  let best = maxDistance;
  let hitBall: Ball | null = null;
  let hitCushion = false;

  for (const other of balls) {
    if (other === cue || other.pocketed) continue;
    const t = rayCircle(p, d, other, cue.radius + other.radius);
    if (t !== null && t < best) {
      best = t;
      hitBall = other;
      hitCushion = false;
    }
  }
  for (const s of cushions) {
    const t = rayCapsule(p, d, s, cue.radius);
    if (t !== null && t < best) {
      best = t;
      hitBall = null;
      hitCushion = true;
    }
  }

  const contact = { x: p.x + d.x * best, y: p.y + d.y * best };
  let target: AimTarget = { type: 'none' };
  if (hitBall) {
    const nx = hitBall.x - contact.x;
    const ny = hitBall.y - contact.y;
    const nl = Math.sqrt(nx * nx + ny * ny);
    const n = { x: nx / nl, y: ny / nl };
    const along = d.x * n.x + d.y * n.y;
    const tx = d.x - along * n.x;
    const ty = d.y - along * n.y;
    const tl = Math.sqrt(tx * tx + ty * ty);
    const cueDirection = tl > 1e-9 ? { x: tx / tl, y: ty / tl } : { x: 0, y: 0 };
    target = { type: 'ball', ballId: hitBall.id, objectDirection: n, cueDirection };
  } else if (hitCushion) {
    target = { type: 'cushion' };
  }
  return { contact, distance: best, target };
}

/** Distance along the unit ray to where it comes within `radius` of the centre, or null. */
function rayCircle(p: Vec2, d: Vec2, centre: Vec2, radius: number): number | null {
  const mx = p.x - centre.x;
  const my = p.y - centre.y;
  const b = mx * d.x + my * d.y;
  const c = mx * mx + my * my - radius * radius;
  if (c <= 0) return b < 0 ? 0 : null; // already touching: a hit only if moving towards it
  if (b >= 0) return null; // pointing away
  const disc = b * b - c;
  if (disc < 0) return null;
  return -b - Math.sqrt(disc);
}

/** Distance along the unit ray to where a circle of `radius` first touches the segment. */
function rayCapsule(p: Vec2, d: Vec2, s: Segment, radius: number): number | null {
  const ex = s.b.x - s.a.x;
  const ey = s.b.y - s.a.y;
  const segLen = Math.sqrt(ex * ex + ey * ey);
  let best: number | null = null;
  const consider = (t: number | null) => {
    if (t !== null && (best === null || t < best)) best = t;
  };

  if (segLen > 1e-12) {
    const ux = ex / segLen;
    const uy = ey / segLen;
    const nx = -uy;
    const ny = ux;
    for (const side of [1, -1]) {
      const startDist = ((p.x - s.a.x) * nx + (p.y - s.a.y) * ny) * side;
      const closing = (d.x * nx + d.y * ny) * side;
      if (startDist < radius || closing >= 0) continue;
      const t = (radius - startDist) / closing;
      const hx = p.x + d.x * t - s.a.x;
      const hy = p.y + d.y * t - s.a.y;
      const along = hx * ux + hy * uy;
      if (along >= 0 && along <= segLen) consider(t);
    }
  }
  consider(rayCircle(p, d, s.a, radius));
  consider(rayCircle(p, d, s.b, radius));
  return best;
}
