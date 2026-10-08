import type { Vec2 } from '../physics/types';

/**
 * Turns an aim direction by a small angle in radians. Table coordinates have y pointing down the
 * screen, so a positive angle turns the aim clockwise as the player sees it. Returns a unit vector.
 */
export function rotateAim(direction: Vec2, angle: number): Vec2 {
  if (!Number.isFinite(angle)) return direction;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const x = direction.x * c - direction.y * s;
  const y = direction.x * s + direction.y * c;
  const len = Math.sqrt(x * x + y * y);
  return len > 1e-9 ? { x: x / len, y: y / len } : direction;
}
