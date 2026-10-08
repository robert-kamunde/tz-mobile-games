import { describe, expect, it } from 'vitest';
import { DEFAULT_PHYSICS } from '../src/config/physics';
import { rotateAim } from '../src/controls/fineAim';
import { CENTRE_TIP, controlFromTip, tipFromControl } from '../src/controls/spin';
import { TABLE, cueAt, objectBall, simWith } from './helpers';

const R = 44;
const MAX = DEFAULT_PHYSICS.maxTipOffset;

describe('spin control', () => {
  it('the centre is a centre-ball hit', () => {
    expect(tipFromControl(0, 0, R, MAX)).toEqual({ side: 0, height: 0 });
  });

  it('up is topspin, down is backspin, right is right-hand side, each reaching the largest offset at the edge', () => {
    expect(tipFromControl(0, -R, R, MAX)).toEqual({ side: 0, height: MAX });
    expect(tipFromControl(0, R, R, MAX)).toEqual({ side: 0, height: -MAX });
    expect(tipFromControl(R, 0, R, MAX)).toEqual({ side: MAX, height: 0 });
    expect(tipFromControl(-R / 2, 0, R, MAX).side).toBeCloseTo(-MAX / 2, 12);
  });

  it('a touch beyond the edge is pulled onto it, keeping its direction', () => {
    const tip = tipFromControl(3 * R, -3 * R, R, MAX);
    expect(Math.hypot(tip.side, tip.height)).toBeCloseTo(MAX, 12);
    expect(tip.side).toBeCloseTo(tip.height, 12);
  });

  it('bad input gives a centre hit', () => {
    expect(tipFromControl(Number.NaN, 0, R, MAX)).toBe(CENTRE_TIP);
    expect(tipFromControl(5, 5, 0, MAX)).toBe(CENTRE_TIP);
  });

  it('the dot is drawn where the touch was', () => {
    for (const [dx, dy] of [[10, -20], [-30, 5], [0, 0]] as const) {
      const p = controlFromTip(tipFromControl(dx, dy, R, MAX), R, MAX);
      expect(p.x).toBeCloseTo(dx, 9);
      expect(p.y).toBeCloseTo(dy, 9);
    }
  });

  it("the control's top and bottom give follow and draw in the simulation", () => {
    const W = TABLE.playWidth;
    const afterImpact = (dy: number) => {
      const tip = tipFromControl(0, dy, R, MAX);
      const sim = simWith([cueAt(0.6, W / 2), objectBall(1, 0.9, W / 2)]);
      sim.strike({ direction: { x: 1, y: 0 }, power: 0.3, ...tip });
      while (!sim.shotEvents().some((e) => e.type === 'ball')) sim.step();
      for (let i = 0; i < 300; i++) sim.step();
      return sim.cueBall.vx;
    };
    expect(afterImpact(-R)).toBeGreaterThan(0.1);
    expect(afterImpact(R)).toBeLessThan(-0.1);
  });
});

describe('fine aim', () => {
  it('a positive angle turns the aim clockwise on screen (y points down)', () => {
    const d = rotateAim({ x: 1, y: 0 }, 0.01);
    expect(d.y).toBeGreaterThan(0);
    expect(Math.atan2(d.y, d.x)).toBeCloseTo(0.01, 12);
  });

  it('turns by exactly the angle asked and back again, keeping a unit vector', () => {
    const start = { x: 0.6, y: -0.8 };
    let d = start;
    for (let i = 0; i < 1000; i++) d = rotateAim(d, 0.0005);
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1, 12);
    expect(Math.atan2(d.y, d.x) - Math.atan2(start.y, start.x)).toBeCloseTo(0.5, 9);
    for (let i = 0; i < 1000; i++) d = rotateAim(d, -0.0005);
    expect(d.x).toBeCloseTo(start.x, 9);
    expect(d.y).toBeCloseTo(start.y, 9);
  });

  it('ignores a non-number angle', () => {
    expect(rotateAim({ x: 1, y: 0 }, Number.NaN)).toEqual({ x: 1, y: 0 });
  });
});
