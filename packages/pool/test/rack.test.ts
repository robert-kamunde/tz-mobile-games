import { createRandom } from '@tzg/core';
import { describe, expect, it } from 'vitest';
import { RACK_PATTERN, rackBalls } from '../src/physics/rack';
import { TABLE, simWith } from './helpers';

const exact = rackBalls(TABLE);
const blackSpot = exact.find((b) => b.kind === 'black')!;
const lastRow = RACK_PATTERN[RACK_PATTERN.length - 1]!.length;
/** The two back-corner spots of the exact rack. */
const corners = [exact[exact.length - lastRow]!, exact[exact.length - 1]!].map((b) => ({ x: b.x, y: b.y }));

describe('random rack', () => {
  it('keeps the rules of a rack for many different racks', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const balls = rackBalls(TABLE, createRandom(seed));
      // Same ids with the same colours (saved games rely on it).
      expect(balls.map((b) => [b.id, b.kind])).toEqual(exact.map((b) => [b.id, b.kind]));
      // Nothing overlaps.
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i]!;
          const b = balls[j]!;
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.radius + b.radius - 1e-12);
        }
      }
      // The black is on its spot (within the jitter), the back corners are a red and a yellow.
      const black = balls.find((b) => b.kind === 'black')!;
      expect(Math.hypot(black.x - blackSpot.x, black.y - blackSpot.y)).toBeLessThanOrEqual(TABLE.rackGap / 2 + 1e-12);
      const atCorner = corners.map((c) => balls.reduce((best, b) => (Math.hypot(b.x - c.x, b.y - c.y) < Math.hypot(best.x - c.x, best.y - c.y) ? b : best)));
      expect(atCorner.map((b) => b.kind).sort()).toEqual(['red', 'yellow']);
    }
  });

  it('puts the colours in different places from game to game', () => {
    const layouts = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      const balls = rackBalls(TABLE, createRandom(seed));
      layouts.add(balls.slice(1).sort((a, b) => a.x - b.x || a.y - b.y).map((b) => b.kind[0]).join(''));
    }
    expect(layouts.size).toBeGreaterThan(15);
  });

  it('the same full-power break plays out differently, and does not always pot a ball', () => {
    const outcomes = new Set<string>();
    let breaksWithAPot = 0;
    const games = 24;
    for (let seed = 1; seed <= games; seed++) {
      const sim = simWith(rackBalls(TABLE, createRandom(seed)));
      // Straight at the apex at full power, as Robert played it.
      sim.strike({ direction: { x: 1, y: 0 }, power: 1, side: 0, height: 0 });
      sim.runUntilSettled();
      const potted = sim.balls.filter((b) => b.pocketed && b.kind !== 'cue').map((b) => b.id);
      outcomes.add(potted.join(','));
      if (potted.length > 0) breaksWithAPot++;
    }
    console.log(`random rack: ${outcomes.size} different results in ${games} breaks, ${breaksWithAPot} potted something`);
    expect(outcomes.size).toBeGreaterThan(games / 2);
    expect(breaksWithAPot).toBeLessThan(games);
  });
});
