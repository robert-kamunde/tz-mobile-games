import type { Vec2 } from '../physics/types';

/**
 * Where the white spot on a red ball shows as the ball rolls (Robert, 2026-10-14). Looks only: the
 * physics does not track the balls' turning, so the spot follows how far the ball has moved, as if
 * it always rolled without slipping. The spot is a point on the ball's surface, a unit vector in
 * (x right, y down the table, z into the table); the viewer looks down from -z, so it shows while
 * z < 0. It starts on top, facing the viewer.
 */
export class RollingSpot {
  private x = 0;
  private y = 0;
  private z = -1;
  private last: Vec2 | null = null;

  constructor(
    /** A jump longer than this (metres) is a placement or a new rack, not a roll: the spot stays put. */
    private readonly maxStep: number,
  ) {}

  /** Moves the ball to `pos` (metres), turning the spot by the distance rolled. */
  rollTo(pos: Vec2, radius: number): void {
    const last = this.last;
    this.last = { x: pos.x, y: pos.y };
    if (!last) return;
    const dx = pos.x - last.x;
    const dy = pos.y - last.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0 || distance > this.maxStep) return;
    // Rolling turns the ball about the axis up x direction, by distance / radius. Up (towards the
    // viewer) is (0, 0, -1), so the axis is (dy, -dx, 0) / distance.
    const kx = dy / distance;
    const ky = -dx / distance;
    const angle = distance / radius;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    // Rodrigues' rotation with k = (kx, ky, 0).
    const dot = kx * this.x + ky * this.y;
    const crossX = ky * this.z;
    const crossY = -kx * this.z;
    const crossZ = kx * this.y - ky * this.x;
    const nx = this.x * c + crossX * s + kx * dot * (1 - c);
    const ny = this.y * c + crossY * s + ky * dot * (1 - c);
    const nz = this.z * c + crossZ * s;
    // Renormalise so rounding cannot grow or shrink it over a long game.
    const n = Math.hypot(nx, ny, nz);
    this.x = nx / n;
    this.y = ny / n;
    this.z = nz / n;
  }

  /** Moves the ball to `pos` without turning it (a placement, a new rack, a loaded game). */
  placeAt(pos: Vec2): void {
    this.last = { x: pos.x, y: pos.y };
  }

  /** Back on top, as for a new rack. */
  reset(): void {
    this.x = 0;
    this.y = 0;
    this.z = -1;
    this.last = null;
  }

  /**
   * How to draw it: the centre offset as fractions of the ball's radius, how much it is squashed
   * towards the edge (1 facing the viewer, 0 side on), the direction of that squash, and whether it
   * is on the near side.
   */
  get view(): { dx: number; dy: number; squash: number; angle: number; visible: boolean } {
    return { dx: this.x, dy: this.y, squash: -this.z, angle: Math.atan2(this.y, this.x), visible: this.z < 0 };
  }
}
