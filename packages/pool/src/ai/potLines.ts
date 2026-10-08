import { AI_SEARCH } from '../config/ai';
import type { PhysicsConfig } from '../config/physics';
import { computeAimGuide } from '../physics/aim';
import type { Ball, BallKind, Pocket, TableGeometry, Vec2 } from '../physics/types';

/**
 * Straight-line shot geometry for the AI: which pots are on from a cue ball position and how easy
 * they look. No physics here; candidates are judged later by playing them out (planner.ts).
 */

/** A pot of one ball into one pocket with the cue ball where it is. */
export interface PotLine {
  readonly targetId: number;
  readonly pocketId: number;
  /** Unit direction to strike the cue ball (towards the ghost ball). */
  readonly direction: Vec2;
  /** Cosine of the cut angle: 1 is straight, smaller is thinner. */
  readonly cutCos: number;
  readonly cueDistance: number;
  readonly objectDistance: number;
  /** 0..1, higher is easier: straighter and shorter. */
  readonly ease: number;
}

/** A rolling ball keeps this fraction of its strike speed once its skid ends (solid sphere, 5/7). */
const ROLLING_SPEED_FRACTION = 5 / 7;

export function unit(from: Vec2, to: Vec2): { dir: Vec2; length: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  return { dir: length > 1e-12 ? { x: dx / length, y: dy / length } : { x: 0, y: 0 }, length };
}

/** True if a ball of `radius` can travel from a to b without touching any ball not in `ignore`. */
export function pathIsClear(a: Vec2, b: Vec2, radius: number, balls: readonly Ball[], ignore: readonly number[]): boolean {
  const { dir, length } = unit(a, b);
  for (const other of balls) {
    if (other.pocketed || ignore.includes(other.id)) continue;
    const ox = other.x - a.x;
    const oy = other.y - a.y;
    const along = ox * dir.x + oy * dir.y;
    const t = along < 0 ? 0 : along > length ? length : along;
    const cx = ox - dir.x * t;
    const cy = oy - dir.y * t;
    const min = radius + other.radius + AI_SEARCH.pathMargin;
    if (cx * cx + cy * cy < min * min) return false;
  }
  return true;
}

/** How easy a pot looks, 0..1. Distances are in metres; a long cut pot scores low. */
export function easeOf(cutCos: number, cueDistance: number, objectDistance: number): number {
  return (cutCos * cutCos) / (1 + cueDistance + 2 * objectDistance);
}

/**
 * Every pot of a ball of a legal kind into a pocket, from `cue`, where the cue ball reaches the ghost
 * ball without touching anything else first and the object ball's line to the pocket is clear.
 * Sorted easiest first.
 */
export function findPotLines(cue: Ball, balls: readonly Ball[], table: TableGeometry, legal: readonly BallKind[]): PotLine[] {
  const lines: PotLine[] = [];
  for (const target of balls) {
    if (target.pocketed || target.id === cue.id || !legal.includes(target.kind)) continue;
    for (const pocket of table.pockets) {
      const line = potLine(cue, target, pocket, balls, table);
      if (line) lines.push(line);
    }
  }
  return lines.sort((a, b) => b.ease - a.ease);
}

function potLine(cue: Ball, target: Ball, pocket: Pocket, balls: readonly Ball[], table: TableGeometry): PotLine | null {
  const toPocket = unit(target, pocket.center);
  const contactDistance = cue.radius + target.radius;
  const ghost = { x: target.x - toPocket.dir.x * contactDistance, y: target.y - toPocket.dir.y * contactDistance };
  const toGhost = unit(cue, ghost);
  if (toGhost.length < 1e-6) return null;
  const cutCos = toGhost.dir.x * toPocket.dir.x + toGhost.dir.y * toPocket.dir.y;
  if (cutCos < AI_SEARCH.minCutCos) return null;
  if (!pathIsClear(target, pocket.center, target.radius, balls, [target.id, cue.id])) return null;
  // The cue ball must reach this ball first (not another ball, a cushion or a pocket).
  const guide = computeAimGuide(cue, toGhost.dir, balls, table.cushions, table.pockets, toGhost.length + contactDistance);
  if (guide?.target.type !== 'ball' || guide.target.ballId !== target.id) return null;
  return {
    targetId: target.id,
    pocketId: pocket.id,
    direction: toGhost.dir,
    cutCos,
    cueDistance: toGhost.length,
    objectDistance: toPocket.length,
    ease: easeOf(cutCos, toGhost.length, toPocket.length),
  };
}

/** The easiest pot available to whoever plays next from `cue`, 0 if none. */
export function bestEase(cue: Ball, balls: readonly Ball[], table: TableGeometry, legal: readonly BallKind[]): number {
  const lines = findPotLines(cue, balls, table, legal);
  return lines.length > 0 ? lines[0]!.ease : 0;
}

/**
 * Strike speed (m/s) at which the object ball just about reaches the pocket, ignoring cushions and
 * spin: rolling distance under rolling resistance, the cut's loss of speed, and the cue ball's skid.
 */
export function speedToPot(line: PotLine, physics: PhysicsConfig): number {
  const deceleration = physics.rollingResistance * physics.gravity;
  const objectSpeed = Math.sqrt(2 * deceleration * line.objectDistance);
  const cueSpeedAtContact = objectSpeed / line.cutCos;
  const rolling = Math.sqrt(cueSpeedAtContact * cueSpeedAtContact + 2 * deceleration * line.cueDistance);
  return rolling / ROLLING_SPEED_FRACTION;
}

/** Power (0..1) for a strike speed in m/s, clamped to the cue's range. */
export function powerForSpeed(speed: number, physics: PhysicsConfig): number {
  const p = (speed - physics.minShotSpeed) / (physics.maxShotSpeed - physics.minShotSpeed);
  return p < 0 ? 0 : p > 1 ? 1 : p;
}
