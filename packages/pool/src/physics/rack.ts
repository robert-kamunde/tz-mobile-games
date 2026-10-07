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

/** Cue ball (id 0) at the start position plus the 15 racked object balls (ids 1-15). */
export function rackBalls(t: TableConfig): Ball[] {
  const spacing = 2 * t.objectBallRadius + t.rackGap;
  const rowStep = (spacing * Math.sqrt(3)) / 2;
  const balls: Ball[] = [makeCueBall(t)];
  RACK_PATTERN.forEach((row, i) => {
    row.forEach((kind, k) => {
      const y = t.playWidth / 2 + (k - (row.length - 1) / 2) * spacing;
      balls.push(makeBall(balls.length, kind, t.footSpot + i * rowStep, y, t));
    });
  });
  return balls;
}
