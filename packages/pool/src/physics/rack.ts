import type { Random } from '@tzg/core';
import type { TableConfig } from '../config/table';
import type { Ball, BallKind } from './types';

/**
 * Blackball rack, apex first, apex towards the head cushion. The black is in the middle of the
 * third row and the two back corners are different colours. 7 reds, 7 yellows.
 */
export const RACK_PATTERN: readonly (readonly BallKind[])[] = [
  ['red'],
  ['yellow', 'red'],
  ['red', 'black', 'yellow'],
  ['yellow', 'red', 'yellow', 'red'],
  ['red', 'yellow', 'yellow', 'red', 'yellow'],
];

export const CUE_BALL_ID = 0;

/** How many balls of a kind the rack holds (7 for each colour). */
export const countInRack = (kind: BallKind): number => RACK_PATTERN.flat().filter((k) => k === kind).length;

function makeBall(id: number, kind: BallKind, x: number, y: number, t: TableConfig): Ball {
  const isCue = kind === 'cue';
  return {
    id,
    kind,
    radius: isCue ? t.cueBallRadius : t.objectBallRadius,
    mass: isCue ? t.cueBallMass : t.objectBallMass,
    x,
    y,
    vx: 0,
    vy: 0,
    sx: 0,
    sy: 0,
    wz: 0,
    pocketed: false,
  };
}

export function makeCueBall(t: TableConfig, x = t.cueStart, y = t.playWidth / 2): Ball {
  return makeBall(CUE_BALL_ID, 'cue', x, y, t);
}

/**
 * Cue ball (id 0) at the start position plus the 15 racked object balls (ids 1-15). A ball's id
 * always has the same colour (saved games rely on it).
 *
 * With `random` the rack is set up as a person would (Robert, 2026-10-11: the same full-power break
 * potted a ball every game): the reds and yellows go in a random order, keeping the black in the
 * middle of the third row and the two back corners different colours, and every ball sits up to half
 * the rack gap off its exact spot. The same break then plays out differently each game. Without
 * `random` the rack is the exact pattern (tests).
 */
export function rackBalls(t: TableConfig, random?: Random): Ball[] {
  const spacing = 2 * t.objectBallRadius + t.rackGap;
  const rowStep = (spacing * Math.sqrt(3)) / 2;
  const spots: { x: number; y: number; kind: BallKind }[] = [];
  RACK_PATTERN.forEach((row, i) => {
    row.forEach((kind, k) => {
      spots.push({ x: t.footSpot + i * rowStep, y: t.playWidth / 2 + (k - (row.length - 1) / 2) * spacing, kind });
    });
  });
  // order[n] is the spot ball n+1 goes to.
  const order = spots.map((_, n) => n);
  if (random) shuffleColours(order, spots, random);
  const balls: Ball[] = [makeCueBall(t)];
  spots.forEach((patternSpot, n) => {
    const spot = spots[order[n]!]!;
    let { x, y } = spot;
    if (random) {
      // Each ball moves at most half the gap (a square inside that circle), so neighbours never overlap.
      const reach = (t.rackGap / 2) * Math.SQRT1_2;
      x += (2 * random.next() - 1) * reach;
      y += (2 * random.next() - 1) * reach;
    }
    balls.push(makeBall(balls.length, patternSpot.kind, x, y, t));
  });
  return balls;
}

/** Shuffles which spot each red and yellow takes; the black keeps its spot and the back corners differ in colour. */
function shuffleColours(order: number[], spots: readonly { kind: BallKind }[], random: Random): void {
  const coloured = order.filter((n) => spots[n]!.kind !== 'black');
  const targets = [...coloured];
  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [targets[i], targets[j]] = [targets[j]!, targets[i]!];
  }
  coloured.forEach((ball, i) => (order[ball] = targets[i]!));
  const lastRow = RACK_PATTERN[RACK_PATTERN.length - 1]!.length;
  const cornerA = spots.length - lastRow;
  const cornerB = spots.length - 1;
  const ballAt = (spot: number) => order.indexOf(spot);
  const kindAt = (spot: number) => spots[ballAt(spot)]!.kind;
  if (kindAt(cornerA) === kindAt(cornerB)) {
    // Swap corner B's ball with the first ball of the other colour that is not on a corner.
    const want = kindAt(cornerA) === 'red' ? 'yellow' : 'red';
    const swapWith = order.findIndex((spot, ball) => spots[ball]!.kind === want && spot !== cornerA && spot !== cornerB);
    const b = ballAt(cornerB);
    [order[b], order[swapWith]] = [order[swapWith]!, order[b]!];
  }
}
