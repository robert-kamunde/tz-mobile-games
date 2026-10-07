import { describe, expect, it } from 'vitest';
import { computeAimGuide } from '../src/physics/aim';
import { GEOMETRY, TABLE, cueAt, objectBall, simWith } from './helpers';

const W = TABLE.playWidth;
const R = TABLE.objectBallRadius;
const RC = TABLE.cueBallRadius;

describe('aim guide', () => {
  it('stops at the object ball for a full-ball hit, with no cue deflection', () => {
    const cue = cueAt(0.5, W / 2);
    const target = objectBall(1, 1, W / 2);
    const guide = computeAimGuide(cue, { x: 1, y: 0 }, [cue, target], GEOMETRY.cushions, GEOMETRY.pockets, 5)!;
    expect(guide.distance).toBeCloseTo(0.5 - R - RC, 9);
    expect(guide.target).toEqual({ type: 'ball', ballId: 1, objectDirection: { x: 1, y: 0 }, cueDirection: { x: 0, y: 0 } });
  });

  it('on a cut, the object and cue ball paths are at right angles', () => {
    const cue = cueAt(0.5, W / 2);
    const target = objectBall(1, 1, W / 2 + 0.03);
    const guide = computeAimGuide(cue, { x: 1, y: 0 }, [cue, target], GEOMETRY.cushions, GEOMETRY.pockets, 5)!;
    if (guide.target.type !== 'ball') throw new Error('expected a ball hit');
    const { objectDirection: o, cueDirection: c } = guide.target;
    expect(o.x * c.x + o.y * c.y).toBeCloseTo(0, 9);
    expect(o.y).toBeGreaterThan(0); // object ball goes away from the side the cue ball hit
  });

  it('reaches the cushion on an empty line', () => {
    const cue = cueAt(0.5, W / 2);
    const guide = computeAimGuide(cue, { x: 1, y: 0 }, [cue], GEOMETRY.cushions, GEOMETRY.pockets, 5)!;
    expect(guide.target.type).toBe('cushion');
    expect(guide.distance).toBeCloseTo(TABLE.playLength - RC - 0.5, 9);
  });

  it('stops at a pocket when the line runs into one', () => {
    const cue = cueAt(0.4, 0.4);
    const guide = computeAimGuide(cue, { x: -1, y: -1 }, [cue], GEOMETRY.cushions, GEOMETRY.pockets, 5)!;
    expect(guide.target).toEqual({ type: 'pocket', pocketId: 0 });
    // Ends where the centre enters the drop circle around the corner.
    expect(Math.hypot(guide.contact.x, guide.contact.y)).toBeCloseTo(TABLE.dropRadius, 9);
  });

  it('ignores pocketed balls and stops at maxDistance', () => {
    const cue = cueAt(0.5, W / 2);
    const gone = { ...objectBall(1, 0.8, W / 2), pocketed: true };
    const guide = computeAimGuide(cue, { x: 1, y: 0 }, [cue, gone], GEOMETRY.cushions, GEOMETRY.pockets, 0.1)!;
    expect(guide.target.type).toBe('none');
    expect(guide.distance).toBe(0.1);
  });

  it('returns null for a zero or invalid direction', () => {
    const cue = cueAt(0.5, W / 2);
    expect(computeAimGuide(cue, { x: 0, y: 0 }, [cue], GEOMETRY.cushions, GEOMETRY.pockets, 5)).toBeNull();
    expect(computeAimGuide(cue, { x: Number.NaN, y: 1 }, [cue], GEOMETRY.cushions, GEOMETRY.pockets, 5)).toBeNull();
  });

  it('agrees with the simulation about which ball is hit first', () => {
    const cue = cueAt(0.4, 0.3);
    const balls = [cue, objectBall(1, 0.9, 0.35), objectBall(2, 1.2, 0.45)];
    const dir = { x: 0.8, y: 0.1 };
    const guide = computeAimGuide(cue, dir, balls, GEOMETRY.cushions, GEOMETRY.pockets, 5)!;
    if (guide.target.type !== 'ball') throw new Error('expected a ball hit');

    const sim = simWith(balls);
    sim.strike({ direction: dir, power: 0.5, side: 0, height: 0 });
    sim.runUntilSettled();
    const first = sim.shotEvents().find((e) => e.type === 'ball');
    expect(first).toMatchObject({ a: 0, b: guide.target.ballId });
  });
});
