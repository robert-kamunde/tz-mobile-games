import { DEFAULT_PHYSICS, type PhysicsConfig } from '../src/config/physics';
import { UK_7FT_TABLE } from '../src/config/table';
import { buildTableGeometry } from '../src/physics/geometry';
import { makeCueBall, rackBalls } from '../src/physics/rack';
import { PoolSimulation } from '../src/physics/simulation';
import type { Ball, BallKind } from '../src/physics/types';

export const TABLE = UK_7FT_TABLE;
export const GEOMETRY = buildTableGeometry(TABLE);

/** Small seeded PRNG (mulberry32) so "random" tests are repeatable. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function objectBall(id: number, x: number, y: number, kind: BallKind = 'red'): Ball {
  return { id, kind, radius: TABLE.objectBallRadius, mass: TABLE.objectBallMass, x, y, vx: 0, vy: 0, sx: 0, sy: 0, wz: 0, pocketed: false };
}

export function simWith(balls: Ball[], physics: Partial<PhysicsConfig> = {}): PoolSimulation {
  return new PoolSimulation(GEOMETRY, { ...DEFAULT_PHYSICS, ...physics }, balls);
}

export function cueAt(x: number, y: number): Ball {
  return makeCueBall(TABLE, x, y);
}

export function rackedSim(physics: Partial<PhysicsConfig> = {}): PoolSimulation {
  return simWith(rackBalls(TABLE), physics);
}

/** Power (0..1) that gives the requested strike speed. */
export function powerFor(speed: number, p: PhysicsConfig = DEFAULT_PHYSICS): number {
  return (speed - p.minShotSpeed) / (p.maxShotSpeed - p.minShotSpeed);
}

export function totalEnergy(balls: readonly Ball[]): number {
  let e = 0;
  for (const b of balls) {
    if (b.pocketed) continue;
    // Linear + rotational (solid sphere: I = 2/5 m R^2; |w_horizontal| = |s| / R).
    e += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);
    e += 0.2 * b.mass * (b.sx * b.sx + b.sy * b.sy);
    e += 0.2 * b.mass * b.radius * b.radius * b.wz * b.wz;
  }
  return e;
}

export function snapshot(balls: readonly Ball[]): string {
  return JSON.stringify(balls.map((b) => [b.id, b.x, b.y, b.vx, b.vy, b.sx, b.sy, b.wz, b.pocketed]));
}

/** Asserts every ball on the table is inside the cloth and no two balls overlap. */
export function layoutProblems(balls: readonly Ball[], tolerance = 1e-6): string[] {
  const problems: string[] = [];
  const onTable = balls.filter((b) => !b.pocketed);
  // A ball can legitimately rest in a pocket mouth, so the box allows the jaw depth.
  const m = TABLE.jawLength;
  for (const b of onTable) {
    if (b.x < -m || b.y < -m || b.x > TABLE.playLength + m || b.y > TABLE.playWidth + m) {
      problems.push(`ball ${b.id} off the table at (${b.x}, ${b.y})`);
    }
    for (const [k, s] of GEOMETRY.cushions.entries()) {
      const ex = s.b.x - s.a.x;
      const ey = s.b.y - s.a.y;
      const t = Math.min(1, Math.max(0, ((b.x - s.a.x) * ex + (b.y - s.a.y) * ey) / (ex * ex + ey * ey)));
      const d = Math.sqrt((b.x - s.a.x - t * ex) ** 2 + (b.y - s.a.y - t * ey) ** 2);
      if (d < b.radius - tolerance) problems.push(`ball ${b.id} inside cushion ${k} by ${b.radius - d}`);
    }
  }
  for (let i = 0; i < onTable.length; i++) {
    for (let j = i + 1; j < onTable.length; j++) {
      const a = onTable[i]!;
      const b = onTable[j]!;
      const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
      if (d < a.radius + b.radius - tolerance) problems.push(`balls ${a.id} and ${b.id} overlap by ${a.radius + b.radius - d}`);
    }
  }
  return problems;
}
