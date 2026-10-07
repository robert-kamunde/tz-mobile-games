import { silentLogger, type Logger } from '@tzg/core';
import type { PhysicsConfig } from '../config/physics';
import { CUE_BALL_ID } from './rack';
import type { Ball, Shot, ShotEvent, TableGeometry } from './types';

interface PreparedSegment {
  ax: number;
  ay: number;
  dx: number;
  dy: number;
  lengthSq: number;
}

export type StrikeResult = 'ok' | 'balls-moving' | 'cue-ball-pocketed' | 'invalid-shot';

export type PlaceResult = 'ok' | 'balls-moving' | 'outside-table' | 'in-pocket' | 'touches-cushion' | 'overlaps-ball' | 'invalid-position';

/**
 * Deterministic pool simulation on a fixed time step.
 *
 * Model: each ball has a linear velocity, top/back spin (as contact-point velocity) and side spin.
 * A ball skids while its contact point slips on the cloth, then rolls. Ball-ball impacts exchange
 * momentum along the line of centres only (no throw); cushions bounce the speed into the cushion
 * with restitution and apply friction to the contact slip, which is how side spin bends rebounds.
 *
 * Same starting state + same shots = identical results on any device, at any frame rate.
 */
export class PoolSimulation {
  readonly balls: Ball[];
  private readonly segments: PreparedSegment[];
  private readonly dt: number;
  private readonly maxShotSteps: number;
  private stepIndex = 0;
  private shotStart = 0;
  private moving = false;
  private events: ShotEvent[] = [];

  constructor(
    readonly table: TableGeometry,
    readonly physics: PhysicsConfig,
    balls: Ball[],
    private readonly logger: Logger = silentLogger,
  ) {
    if (!(physics.stepSeconds > 0)) throw new Error(`invalid stepSeconds ${physics.stepSeconds}`);
    const ids = new Set(balls.map((b) => b.id));
    if (ids.size !== balls.length) throw new Error('ball ids must be unique');
    if (!balls.some((b) => b.id === CUE_BALL_ID)) throw new Error('a cue ball (id 0) is required');
    this.balls = balls;
    this.dt = physics.stepSeconds;
    this.maxShotSteps = Math.round(physics.maxShotSeconds / physics.stepSeconds);
    this.segments = table.cushions.map(({ a, b }) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      return { ax: a.x, ay: a.y, dx, dy, lengthSq: dx * dx + dy * dy };
    });
    this.moving = this.balls.some(isBallMoving);
  }

  get isMoving(): boolean {
    return this.moving;
  }

  get steps(): number {
    return this.stepIndex;
  }

  get cueBall(): Ball {
    // The constructor guarantees it exists.
    return this.balls.find((b) => b.id === CUE_BALL_ID)!;
  }

  /** Events since the last strike, in the order they happened. */
  shotEvents(): readonly ShotEvent[] {
    return this.events;
  }

  strike(shot: Shot): StrikeResult {
    if (this.moving) return 'balls-moving';
    const cue = this.cueBall;
    if (cue.pocketed) return 'cue-ball-pocketed';

    const { direction, power, side, height } = shot;
    const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (![len, power, side, height].every(Number.isFinite) || len < 1e-9) {
      this.logger.warn('rejected invalid shot', shot);
      return 'invalid-shot';
    }
    const p = this.physics;
    const dx = direction.x / len;
    const dy = direction.y / len;
    const speed = p.minShotSpeed + clamp(power, 0, 1) * (p.maxShotSpeed - p.minShotSpeed);

    // Keep the tip inside a circle of radius maxTipOffset on the face of the ball.
    let a = side;
    let b = height;
    const offset = Math.sqrt(a * a + b * b);
    if (offset > p.maxTipOffset) {
      a = (a / offset) * p.maxTipOffset;
      b = (b / offset) * p.maxTipOffset;
    }

    cue.vx = dx * speed;
    cue.vy = dy * speed;
    // A strike at height h gives spin 5*v*h/(2R^2); h = 2R/5 is natural roll (s = -v).
    cue.sx = -2.5 * b * cue.vx;
    cue.sy = -2.5 * b * cue.vy;
    // Right-hand side (a > 0) spins the ball clockwise seen from above.
    cue.wz = (-2.5 * a * speed) / cue.radius;

    this.events = [];
    this.shotStart = this.stepIndex;
    this.moving = true;
    return 'ok';
  }

  /** Places the cue ball, e.g. for ball in hand. Refuses spots that overlap anything. */
  placeCueBall(x: number, y: number): PlaceResult {
    if (this.moving) return 'balls-moving';
    if (!Number.isFinite(x) || !Number.isFinite(y)) return 'invalid-position';
    const cue = this.cueBall;
    const r = cue.radius;
    if (x < r || x > this.table.length - r || y < r || y > this.table.width - r) return 'outside-table';
    for (const pocket of this.table.pockets) {
      const reach = pocket.dropRadius + r;
      const ox = x - pocket.center.x;
      const oy = y - pocket.center.y;
      if (ox * ox + oy * oy < reach * reach) return 'in-pocket';
    }
    // With the standard geometry the checks above already keep the ball off the cushions;
    // this guards against table configs whose jaws reach into the playing rectangle.
    for (const s of this.segments) {
      if (distanceSqToSegment(x, y, s) < r * r) return 'touches-cushion';
    }
    for (const other of this.balls) {
      if (other === cue || other.pocketed) continue;
      const min = r + other.radius;
      const ox = other.x - x;
      const oy = other.y - y;
      if (ox * ox + oy * oy < min * min) return 'overlaps-ball';
    }
    cue.x = x;
    cue.y = y;
    cue.vx = cue.vy = cue.sx = cue.sy = cue.wz = 0;
    cue.pocketed = false;
    return 'ok';
  }

  /** Advances one fixed step. Cheap no-op while nothing moves. */
  step(): void {
    if (!this.moving) return;
    this.stepIndex += 1;
    const balls = this.balls;

    for (const ball of balls) {
      if (isBallMoving(ball)) this.applyCloth(ball);
    }
    for (const ball of balls) {
      if (ball.pocketed) continue;
      ball.x += ball.vx * this.dt;
      ball.y += ball.vy * this.dt;
    }
    this.collideBalls();
    for (const ball of balls) {
      if (ball.pocketed) continue;
      this.collideCushions(ball);
      this.checkPockets(ball);
    }

    this.moving = balls.some(isBallMoving);
    if (this.moving && this.stepIndex - this.shotStart >= this.maxShotSteps) {
      this.logger.warn(`shot did not settle after ${this.physics.maxShotSeconds}s; stopping all balls`);
      for (const ball of balls) stopBall(ball);
      this.events.push({ type: 'timeout', step: this.stepIndex });
      this.moving = false;
    }
  }

  /** Runs until every ball has stopped. Returns the number of steps taken. Used by tests and, later, the AI. */
  runUntilSettled(): number {
    const start = this.stepIndex;
    while (this.moving) this.step();
    return this.stepIndex - start;
  }

  private applyCloth(ball: Ball): void {
    const p = this.physics;
    const g = p.gravity;
    const dt = this.dt;

    const ux = ball.vx + ball.sx;
    const uy = ball.vy + ball.sy;
    const slip = Math.sqrt(ux * ux + uy * uy);
    const slide = p.slidingFriction * g * dt;

    if (slip > 3.5 * slide) {
      // Skidding: friction opposes the slip. Slip shrinks 3.5x faster than the velocity changes.
      const nx = ux / slip;
      const ny = uy / slip;
      ball.vx -= slide * nx;
      ball.vy -= slide * ny;
      ball.sx -= 2.5 * slide * nx;
      ball.sy -= 2.5 * slide * ny;
    } else {
      // Slip ends within this step: settle into exact rolling, then apply rolling resistance.
      ball.vx -= (2 / 7) * ux;
      ball.vy -= (2 / 7) * uy;
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      const roll = p.rollingResistance * g * dt;
      if (speed <= roll || speed < p.stopSpeed) {
        ball.vx = 0;
        ball.vy = 0;
      } else {
        const k = (speed - roll) / speed;
        ball.vx *= k;
        ball.vy *= k;
      }
      ball.sx = -ball.vx;
      ball.sy = -ball.vy;
    }

    const spinDecel = ((2.5 * p.spinFriction * g) / ball.radius) * dt;
    if (Math.abs(ball.wz) <= spinDecel) ball.wz = 0;
    else ball.wz -= ball.wz > 0 ? spinDecel : -spinDecel;

    const speedSq = ball.vx * ball.vx + ball.vy * ball.vy;
    const slipX = ball.vx + ball.sx;
    const slipY = ball.vy + ball.sy;
    const stopSq = p.stopSpeed * p.stopSpeed;
    if (speedSq < stopSq && slipX * slipX + slipY * slipY < stopSq) {
      ball.vx = ball.vy = ball.sx = ball.sy = 0;
      // Side spin on a ball that has stopped has no further effect.
      ball.wz = 0;
    } else if (Math.abs(ball.wz) < p.stopSideSpin && speedSq < stopSq) {
      ball.wz = 0;
    }
  }

  private collideBalls(): void {
    const balls = this.balls;
    const e = this.physics.ballRestitution;
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i]!;
      if (a.pocketed) continue;
      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j]!;
        if (b.pocketed) continue;
        const nx0 = b.x - a.x;
        const ny0 = b.y - a.y;
        const min = a.radius + b.radius;
        const distSq = nx0 * nx0 + ny0 * ny0;
        if (distSq >= min * min) continue;

        const dist = Math.sqrt(distSq);
        // Exactly coincident centres cannot happen in play; pick a fixed axis so the result stays deterministic.
        const nx = dist > 1e-12 ? nx0 / dist : 1;
        const ny = dist > 1e-12 ? ny0 / dist : 0;
        const invA = 1 / a.mass;
        const invB = 1 / b.mass;
        const invSum = invA + invB;

        // Separate the overlap in proportion to inverse mass.
        const overlap = min - dist;
        a.x -= nx * overlap * (invA / invSum);
        a.y -= ny * overlap * (invA / invSum);
        b.x += nx * overlap * (invB / invSum);
        b.y += ny * overlap * (invB / invSum);

        const approach = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (approach <= 0) continue;
        const impulse = ((1 + e) * approach) / invSum;
        a.vx -= impulse * invA * nx;
        a.vy -= impulse * invA * ny;
        b.vx += impulse * invB * nx;
        b.vy += impulse * invB * ny;
        this.events.push({ type: 'ball', step: this.stepIndex, a: a.id, b: b.id });
      }
    }
  }

  private collideCushions(ball: Ball): void {
    const p = this.physics;
    const r = ball.radius;
    for (const s of this.segments) {
      closestPointOnSegment(ball.x, ball.y, s, closest);
      const qx = closest.x;
      const qy = closest.y;
      const ox = ball.x - qx;
      const oy = ball.y - qy;
      const distSq = ox * ox + oy * oy;
      if (distSq >= r * r || distSq < 1e-18) continue;

      const dist = Math.sqrt(distSq);
      const nx = ox / dist; // from the cushion towards the ball
      const ny = oy / dist;
      ball.x = qx + nx * r;
      ball.y = qy + ny * r;

      const vn = ball.vx * nx + ball.vy * ny;
      if (vn >= 0) continue;
      // Tangent direction (n rotated +90 degrees).
      const tx = -ny;
      const ty = nx;
      const vt = ball.vx * tx + ball.vy * ty;

      // Contact-point slip along the cushion; friction removes part of it, trading speed and side spin.
      const contactSlip = vt - r * ball.wz;
      const tangentialChange = -(2 / 7) * p.cushionFriction * contactSlip;
      const newVt = vt + tangentialChange;
      ball.wz += ((5 / 7) * p.cushionFriction * contactSlip) / r;
      const newVn = -p.cushionRestitution * vn;

      ball.vx = newVn * nx + newVt * tx;
      ball.vy = newVn * ny + newVt * ty;

      // Top/back spin: the component into the cushion reverses with the ball, so a rolling ball keeps rolling.
      const sn = ball.sx * nx + ball.sy * ny;
      const st = ball.sx * tx + ball.sy * ty;
      const newSn = -p.cushionRestitution * sn;
      ball.sx = newSn * nx + st * tx;
      ball.sy = newSn * ny + st * ty;

      this.events.push({ type: 'cushion', step: this.stepIndex, ball: ball.id });
    }
  }

  private checkPockets(ball: Ball): void {
    for (const pocket of this.table.pockets) {
      const ox = ball.x - pocket.center.x;
      const oy = ball.y - pocket.center.y;
      if (ox * ox + oy * oy < pocket.dropRadius * pocket.dropRadius) {
        this.pocketBall(ball, pocket.center.x, pocket.center.y);
        this.events.push({ type: 'pocket', step: this.stepIndex, ball: ball.id, pocket: pocket.id });
        return;
      }
    }
    const m = this.physics.escapeMargin;
    if (ball.x < -m || ball.y < -m || ball.x > this.table.length + m || ball.y > this.table.width + m) {
      this.logger.error(`ball ${ball.id} escaped the table at (${ball.x.toFixed(3)}, ${ball.y.toFixed(3)})`);
      this.pocketBall(ball, ball.x, ball.y);
      this.events.push({ type: 'escaped', step: this.stepIndex, ball: ball.id });
    }
  }

  private pocketBall(ball: Ball, x: number, y: number): void {
    ball.pocketed = true;
    ball.x = x;
    ball.y = y;
    stopBall(ball);
  }
}

function isBallMoving(ball: Ball): boolean {
  return !ball.pocketed && (ball.vx !== 0 || ball.vy !== 0 || ball.sx !== 0 || ball.sy !== 0);
}

function stopBall(ball: Ball): void {
  ball.vx = ball.vy = ball.sx = ball.sy = ball.wz = 0;
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Scratch point reused by the hot path so stepping allocates nothing. */
const closest = { x: 0, y: 0 };

function closestPointOnSegment(x: number, y: number, s: PreparedSegment, out: { x: number; y: number }): void {
  let t = ((x - s.ax) * s.dx + (y - s.ay) * s.dy) / s.lengthSq;
  t = clamp(t, 0, 1);
  out.x = s.ax + t * s.dx;
  out.y = s.ay + t * s.dy;
}

function distanceSqToSegment(x: number, y: number, s: PreparedSegment): number {
  closestPointOnSegment(x, y, s, closest);
  const ox = x - closest.x;
  const oy = y - closest.y;
  return ox * ox + oy * oy;
}
