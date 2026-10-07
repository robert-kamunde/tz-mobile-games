import { describe, expect, it } from 'vitest';
import { FixedStepper } from '@tzg/core';
import { DEFAULT_PHYSICS } from '../src/config/physics';
import { respawnCueBall } from '../src/physics/placement';
import { RACK_PATTERN, rackBalls } from '../src/physics/rack';
import type { Shot } from '../src/physics/types';
import {
  GEOMETRY, TABLE, cueAt, layoutProblems, objectBall, powerFor, rackedSim, seededRandom, simWith, snapshot, totalEnergy,
} from './helpers';

const P = DEFAULT_PHYSICS;
const g = P.gravity;
const L = TABLE.playLength;
const W = TABLE.playWidth;
const NATURAL_ROLL = 0.4; // tip height (fraction of R) that gives pure rolling from the start

const shot = (x: number, y: number, power: number, side = 0, height = 0): Shot => ({ direction: { x, y }, power, side, height });

describe('table and rack', () => {
  it('has six pockets and a closed cushion outline', () => {
    expect(GEOMETRY.pockets).toHaveLength(6);
    expect(GEOMETRY.cushions).toHaveLength(18);
  });

  it('racks 7 reds, 7 yellows, the black in the middle of row 3, cue ball behind the baulk line', () => {
    const balls = rackBalls(TABLE);
    const count = (k: string) => balls.filter((b) => b.kind === k).length;
    expect([count('cue'), count('red'), count('yellow'), count('black')]).toEqual([1, 7, 7, 1]);
    expect(RACK_PATTERN[2]![1]).toBe('black');
    const back = RACK_PATTERN[4]!;
    expect(back[0]).not.toBe(back[back.length - 1]);
    expect(balls[0]!.x).toBeLessThan(TABLE.baulkLine);
    expect(layoutProblems(balls)).toEqual([]);
  });
});

describe('rolling and sliding', () => {
  it('a rolling ball stops after v^2 / (2 * rolling deceleration)', () => {
    const sim = simWith([cueAt(0.25, W / 2)]);
    const speed = 0.5;
    expect(sim.strike(shot(1, 0, powerFor(speed), 0, NATURAL_ROLL))).toBe('ok');
    sim.runUntilSettled();
    const expected = (speed * speed) / (2 * P.rollingResistance * g);
    expect(sim.cueBall.x - 0.25).toBeCloseTo(expected, 2);
    expect(sim.cueBall.y).toBe(W / 2);
    expect(sim.isMoving).toBe(false);
  });

  it('a stun shot skids, then rolls at 5/7 of its speed', () => {
    const sim = simWith([cueAt(0.1, W / 2)]);
    const speed = 1;
    sim.strike(shot(1, 0, powerFor(speed), 0, 0));
    let steps = 0;
    while (Math.abs(sim.cueBall.vx + sim.cueBall.sx) > 1e-12) {
      sim.step();
      steps += 1;
    }
    expect(sim.cueBall.vx).toBeCloseTo((5 / 7) * speed, 2);
    // Skid time = 2v / (7 * mu_s * g).
    expect(steps * P.stepSeconds).toBeCloseTo((2 * speed) / (7 * P.slidingFriction * g), 2);
  });

  /** Cue ball's x velocity shortly after it hits a ball straight on, for a given tip height. */
  function cueVelocityAfterImpact(height: number): number {
    const sim = simWith([cueAt(0.6, W / 2), objectBall(1, 0.9, W / 2)]);
    sim.strike(shot(1, 0, powerFor(2), 0, height));
    while (!sim.shotEvents().some((e) => e.type === 'ball')) sim.step();
    for (let i = 0; i < 300; i++) sim.step();
    return sim.cueBall.vx;
  }

  it('backspin draws the cue ball back after a straight hit', () => {
    expect(cueVelocityAfterImpact(-0.5)).toBeLessThan(-0.1);
  });

  it('topspin makes the cue ball follow through', () => {
    expect(cueVelocityAfterImpact(0.5)).toBeGreaterThan(0.1);
  });
});

describe('collisions', () => {
  function stepUntilEvent(sim: ReturnType<typeof simWith>, type: string) {
    for (let i = 0; i < 100_000; i++) {
      const before = sim.balls.map((b) => ({ vx: b.vx, vy: b.vy }));
      sim.step();
      if (sim.shotEvents().some((e) => e.type === type)) return before;
    }
    throw new Error(`no ${type} event`);
  }

  it('a full-ball hit passes most of the speed on, as restitution predicts', () => {
    const sim = simWith([cueAt(0.5, W / 2), objectBall(1, 0.6, W / 2)]);
    sim.strike(shot(1, 0, powerFor(3)));
    const before = stepUntilEvent(sim, 'ball');
    const v = before[0]!.vx;
    const e = P.ballRestitution;
    expect(sim.balls[1]!.vx / v).toBeCloseTo((1 + e) / 2, 2);
    expect(sim.balls[0]!.vx / v).toBeCloseTo((1 - e) / 2, 2);
    expect(sim.balls[0]!.vy).toBe(0);
  });

  it('with perfectly elastic balls a cut sends them off at 90 degrees', () => {
    const sim = simWith([cueAt(0.5, W / 2), objectBall(1, 0.7, W / 2 + 0.03)], { ballRestitution: 1 });
    sim.strike(shot(1, 0, powerFor(3)));
    stepUntilEvent(sim, 'ball');
    const [c, o] = [sim.balls[0]!, sim.balls[1]!];
    const cos = (c.vx * o.vx + c.vy * o.vy) / (Math.sqrt(c.vx ** 2 + c.vy ** 2) * Math.sqrt(o.vx ** 2 + o.vy ** 2));
    expect(Math.abs(cos)).toBeLessThan(0.01);
  });

  it('a cushion returns the speed into it scaled by cushion restitution', () => {
    const sim = simWith([cueAt(L / 4, 0.3)]);
    sim.strike(shot(0.6, -0.8, powerFor(2), 0, NATURAL_ROLL));
    const before = stepUntilEvent(sim, 'cushion');
    const after = sim.cueBall;
    expect(after.vy / before[0]!.vy).toBeCloseTo(-P.cushionRestitution, 2);
    expect(after.vx).toBeGreaterThan(0);
    expect(after.vx).toBeLessThanOrEqual(before[0]!.vx);
  });

  it('left and right side spin bend the rebound by equal and opposite amounts', () => {
    const run = (side: number) => {
      const sim = simWith([cueAt(L / 2, W / 2)]);
      sim.strike(shot(1, 0, powerFor(2), side, 0));
      sim.runUntilSettled();
      return sim.cueBall.y - W / 2;
    };
    const right = run(0.3);
    const left = run(-0.3);
    expect(Math.abs(right)).toBeGreaterThan(0.01);
    expect(left).toBeCloseTo(-right, 12);
    expect(run(0)).toBe(0);
  });
});

describe('pockets', () => {
  it('a ball sent down the diagonal drops in the corner pocket', () => {
    const sim = simWith([cueAt(0.4, 0.4)]);
    sim.strike(shot(-1, -1, powerFor(1.5)));
    sim.runUntilSettled();
    expect(sim.cueBall.pocketed).toBe(true);
    expect(sim.shotEvents()).toContainEqual(expect.objectContaining({ type: 'pocket', ball: 0, pocket: 0 }));
  });

  it('a ball sent straight at the middle pocket drops', () => {
    const sim = simWith([cueAt(L / 2, W / 2)]);
    sim.strike(shot(0, 1, powerFor(1.5)));
    sim.runUntilSettled();
    expect(sim.shotEvents()).toContainEqual(expect.objectContaining({ type: 'pocket', ball: 0, pocket: 4 }));
  });

  it('a ball rolling along the cushion past a middle pocket at speed can stay up', () => {
    const r = TABLE.cueBallRadius;
    const sim = simWith([cueAt(0.3, r + 0.001)]);
    sim.strike(shot(1, 0, powerFor(4), 0, NATURAL_ROLL));
    sim.runUntilSettled();
    // Just checks nothing breaks: the ball either drops or stays on the table legally.
    expect(sim.shotEvents().some((e) => e.type === 'escaped' || e.type === 'timeout')).toBe(false);
    expect(layoutProblems(sim.balls)).toEqual([]);
  });
});

describe('robustness', () => {
  it('maximum power in every direction never tunnels through a cushion or jaw', () => {
    const steps = 72;
    for (let i = 0; i < steps; i++) {
      const angle = (2 * Math.PI * i) / steps; // test-side only: the simulation itself uses no trig
      for (const start of [cueAt(L / 2, W / 2), cueAt(0.1, 0.1), cueAt(L - 0.1, W - 0.12)]) {
        const sim = simWith([start]);
        sim.strike(shot(Math.cos(angle), Math.sin(angle), 1));
        sim.runUntilSettled();
        const bad = sim.shotEvents().filter((e) => e.type === 'escaped' || e.type === 'timeout');
        expect(bad, `angle ${i}`).toEqual([]);
        expect(layoutProblems(sim.balls), `angle ${i}`).toEqual([]);
      }
    }
  });

  it('random shots on a full rack always settle legally, with no overlaps and no escapes', () => {
    const rand = seededRandom(1234);
    let sim = rackedSim();
    for (let i = 0; i < 40; i++) {
      if (sim.cueBall.pocketed || sim.balls.filter((b) => !b.pocketed).length < 4) sim = rackedSim();
      const a = rand() * 2 * Math.PI;
      const result = sim.strike(shot(Math.cos(a), Math.sin(a), rand(), rand() - 0.5, rand() - 0.5));
      expect(result).toBe('ok');
      sim.runUntilSettled();
      const bad = sim.shotEvents().filter((e) => e.type === 'escaped' || e.type === 'timeout');
      expect(bad, `shot ${i}`).toEqual([]);
      expect(layoutProblems(sim.balls), `shot ${i}`).toEqual([]);
    }
  });

  it('a full-power break never gains energy at any step (no side spin)', () => {
    const sim = rackedSim();
    sim.strike(shot(1, 0.01, 1, 0, 0.2));
    let last = totalEnergy(sim.balls);
    let increases = 0;
    while (sim.isMoving) {
      sim.step();
      const now = totalEnergy(sim.balls);
      if (now > last * (1 + 1e-9) + 1e-12) increases += 1;
      last = now;
    }
    expect(increases).toBe(0);
  });

  it('settles a full-power break well inside the time limit', () => {
    const sim = rackedSim();
    sim.strike(shot(1, 0, 1));
    const steps = sim.runUntilSettled();
    expect(steps * P.stepSeconds).toBeLessThan(P.maxShotSeconds / 2);
  });
});

describe('determinism', () => {
  it('the same break gives a bit-for-bit identical result', () => {
    const run = () => {
      const sim = rackedSim();
      sim.strike(shot(1, 0.013, 0.9, 0.1, -0.2));
      sim.runUntilSettled();
      return snapshot(sim.balls);
    };
    expect(run()).toBe(run());
  });

  it('frame rate does not change the result', () => {
    const run = (frameMs: () => number) => {
      const sim = rackedSim();
      const stepper = new FixedStepper({ stepMs: P.stepSeconds * 1000, maxStepsPerFrame: 1000 });
      sim.strike(shot(1, -0.02, 1, -0.1, 0.1));
      while (sim.isMoving) {
        stepper.advance(frameMs(), () => sim.step());
      }
      return snapshot(sim.balls);
    };
    const rand = seededRandom(7);
    const at60 = run(() => 1000 / 60);
    expect(run(() => 1000 / 30)).toBe(at60);
    expect(run(() => 1000 / 144)).toBe(at60);
    expect(run(() => 5 + rand() * 60)).toBe(at60);
  });
});

describe('input validation', () => {
  it('rejects bad shots and shots while balls move', () => {
    const sim = rackedSim();
    expect(sim.strike(shot(0, 0, 0.5))).toBe('invalid-shot');
    expect(sim.strike(shot(1, 0, Number.NaN))).toBe('invalid-shot');
    expect(sim.strike(shot(Number.POSITIVE_INFINITY, 0, 0.5))).toBe('invalid-shot');
    expect(sim.strike(shot(1, 0, 0.5))).toBe('ok');
    expect(sim.strike(shot(1, 0, 0.5))).toBe('balls-moving');
  });

  it('clamps power and tip offset', () => {
    const over = simWith([cueAt(0.5, W / 2)]);
    over.strike(shot(1, 0, 5, 1, 1));
    expect(over.cueBall.vx).toBeCloseTo(P.maxShotSpeed, 10);
    // Tip limited to maxTipOffset on the diagonal: side component = 0.5 / sqrt(2).
    const side = P.maxTipOffset / Math.SQRT2;
    expect(over.cueBall.wz).toBeCloseTo((-2.5 * side * P.maxShotSpeed) / TABLE.cueBallRadius, 6);
  });

  it('refuses a strike when the cue ball is pocketed', () => {
    const sim = simWith([cueAt(0.4, 0.4)]);
    sim.strike(shot(-1, -1, powerFor(1.5)));
    sim.runUntilSettled();
    expect(sim.strike(shot(1, 0, 0.5))).toBe('cue-ball-pocketed');
  });

  it('only places the cue ball on free cloth', () => {
    const sim = rackedSim();
    const first = sim.balls[1]!;
    expect(sim.placeCueBall(first.x, first.y)).toBe('overlaps-ball');
    expect(sim.placeCueBall(-0.1, 0.3)).toBe('outside-table');
    expect(sim.placeCueBall(0.03, 0.03)).toBe('in-pocket');
    expect(sim.placeCueBall(Number.NaN, 0.3)).toBe('invalid-position');
    expect(sim.placeCueBall(0.3, 0.3)).toBe('ok');
    expect([sim.cueBall.x, sim.cueBall.y]).toEqual([0.3, 0.3]);
    sim.strike(shot(1, 0, 0.5));
    expect(sim.placeCueBall(0.3, 0.5)).toBe('balls-moving');
  });
});

describe('cue ball respawn (practice mode)', () => {
  it('uses the preferred spot when it is free', () => {
    const sim = simWith([cueAt(0.4, 0.4)]);
    sim.strike(shot(-1, -1, powerFor(1.5)));
    sim.runUntilSettled();
    expect(respawnCueBall(sim, TABLE.cueStart, W / 2, 0.06)).toBe(true);
    expect([sim.cueBall.x, sim.cueBall.y, sim.cueBall.pocketed]).toEqual([TABLE.cueStart, W / 2, false]);
  });

  it('finds the next free spot when the preferred one is taken', () => {
    const sim = simWith([cueAt(0.4, 0.4), objectBall(1, TABLE.cueStart, W / 2)]);
    sim.strike(shot(-1, -1, powerFor(1.5)));
    sim.runUntilSettled();
    expect(respawnCueBall(sim, TABLE.cueStart, W / 2, 0.06)).toBe(true);
    expect(sim.cueBall.pocketed).toBe(false);
    expect(layoutProblems(sim.balls)).toEqual([]);
  });
});
