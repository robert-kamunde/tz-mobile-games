import { describe, expect, it } from 'vitest';
import { RollingSpot } from '../src/scenes/rollingSpot';

const R = 0.026;

/** Rolls a spot from the origin in small steps along a direction. */
function roll(distance: number, dir = { x: 1, y: 0 }, steps = 200): RollingSpot {
  const spot = new RollingSpot(0.2);
  for (let i = 0; i <= steps; i++) spot.rollTo({ x: (dir.x * distance * i) / steps, y: (dir.y * distance * i) / steps }, R);
  return spot;
}

describe('RollingSpot', () => {
  it('starts on top, facing the viewer', () => {
    const v = new RollingSpot(0.2).view;
    expect(v).toMatchObject({ dx: 0, dy: 0, squash: 1, visible: true });
  });

  it('a quarter turn to the right brings the spot round to the leading edge', () => {
    const v = roll((Math.PI / 2) * R).view;
    expect(v.dx).toBeCloseTo(1, 3);
    expect(v.dy).toBeCloseTo(0, 3);
    expect(v.squash).toBeCloseTo(0, 3);
  });

  it('goes under after half a turn and comes back on top after a full turn', () => {
    expect(roll(Math.PI * R).view.visible).toBe(false);
    const full = roll(2 * Math.PI * R).view;
    expect(full.visible).toBe(true);
    expect(full.squash).toBeCloseTo(1, 3);
  });

  it('rolls the way the ball moves, down the table too', () => {
    const v = roll(0.5 * R, { x: 0, y: 1 }).view;
    expect(v.dy).toBeGreaterThan(0.4);
    expect(Math.abs(v.dx)).toBeLessThan(1e-9);
  });

  it('ignores a jump (a placement or a new rack) and starts again on top after reset', () => {
    const spot = new RollingSpot(0.2);
    spot.rollTo({ x: 0, y: 0 }, R);
    spot.rollTo({ x: 1, y: 0 }, R);
    expect(spot.view.squash).toBeCloseTo(1, 9);
    spot.rollTo({ x: 1.01, y: 0 }, R);
    expect(spot.view.squash).toBeLessThan(1);
    spot.reset();
    expect(spot.view).toMatchObject({ dx: 0, dy: 0, squash: 1 });
  });

  it('stays on the ball after a long game of small rolls', () => {
    const spot = roll(40, { x: 0.6, y: 0.8 }, 20_000);
    const { dx, dy, squash } = spot.view;
    expect(Math.hypot(dx, dy, squash)).toBeCloseTo(1, 9);
  });
});

describe('RollingSpot.placeAt', () => {
  it('moves the ball without turning it, and the next roll starts from there', () => {
    const spot = new RollingSpot(0.2);
    spot.rollTo({ x: 0, y: 0 }, R);
    spot.placeAt({ x: 0.05, y: 0 });
    expect(spot.view.squash).toBe(1);
    spot.rollTo({ x: 0.05 + (Math.PI / 2) * R, y: 0 }, R);
    expect(spot.view.dx).toBeCloseTo(1, 6);
  });
});
