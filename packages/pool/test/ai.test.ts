import { createRandom } from '@tzg/core';
import { describe, expect, it } from 'vitest';
import { findPotLines, powerForSpeed, speedToPot } from '../src/ai/potLines';
import { ShotPlanner, type PlannerInput } from '../src/ai/planner';
import { AI_LEVELS, AI_LEVEL_IDS, type AiLevelConfig } from '../src/config/ai';
import { DEFAULT_PHYSICS } from '../src/config/physics';
import type { Ball } from '../src/physics/types';
import { countGroups, resolveShot, startMatch, type MatchState } from '../src/rules/blackball';
import { summarizeShot } from '../src/rules/shotSummary';
import { playAiGame, playAiTurn } from './aiHarness';
import { GEOMETRY, TABLE, cueAt, objectBall, rackedSim, simWith } from './helpers';

const PLAY: MatchState = { ...startMatch(0), phase: 'play', ballInHand: null };
const ON_REDS: MatchState = { ...PLAY, groups: ['red', 'yellow'] };
/** Hard's search with no execution error, so tests see what it means to play. */
const PERFECT: AiLevelConfig = { ...AI_LEVELS.hard, aimError: 0, powerError: 0 };

function plannerFor(balls: Ball[], match: MatchState, level: AiLevelConfig = PERFECT, seed = 1): ShotPlanner {
  const input: PlannerInput = { balls, table: GEOMETRY, tableConfig: TABLE, physics: DEFAULT_PHYSICS, match };
  return new ShotPlanner(input, level, createRandom(seed));
}

/** Plays the decision on a copy of the table and returns what the rules make of it. */
function playOut(balls: Ball[], match: MatchState, planner: ShotPlanner) {
  const sim = simWith(balls.map((b) => ({ ...b })));
  const d = planner.decision();
  if (d.place) expect(sim.placeCueBall(d.place.x, d.place.y)).toBe('ok');
  const counts = countGroups(sim.balls);
  expect(sim.strike(d.shot)).toBe('ok');
  sim.runUntilSettled();
  return { sim, result: resolveShot(match, summarizeShot(sim.shotEvents(), sim.balls), counts) };
}

describe('pot lines', () => {
  // A red near the top-right corner pocket, with the cue ball straight behind it.
  const corner = GEOMETRY.pockets.find((p) => p.id === 2)!; // top right
  const red = objectBall(1, TABLE.playLength - 0.3, 0.3);
  const toPocket = { x: corner.center.x - red.x, y: corner.center.y - red.y };
  const len = Math.sqrt(toPocket.x ** 2 + toPocket.y ** 2);
  const u = { x: toPocket.x / len, y: toPocket.y / len };
  const cue = cueAt(red.x - u.x * 0.5, red.y - u.y * 0.5);

  it('finds a straight pot, aimed at the ghost ball', () => {
    const lines = findPotLines(cue, [cue, red], GEOMETRY, ['red']);
    const line = lines.find((l) => l.pocketId === corner.id)!;
    expect(line).toBeDefined();
    expect(line.cutCos).toBeGreaterThan(0.999);
    expect(line.direction.x * u.x + line.direction.y * u.y).toBeGreaterThan(0.9999);
    expect(lines[0]).toBe(line); // the straight pot is the easiest
  });

  it('skips a pot when a ball blocks the object ball or the cue ball', () => {
    const inFront = objectBall(2, red.x + u.x * 0.15, red.y + u.y * 0.15, 'yellow');
    expect(findPotLines(cue, [cue, red, inFront], GEOMETRY, ['red']).some((l) => l.pocketId === corner.id)).toBe(false);
    const between = objectBall(3, red.x - u.x * 0.25, red.y - u.y * 0.25, 'yellow');
    expect(findPotLines(cue, [cue, red, between], GEOMETRY, ['red']).some((l) => l.pocketId === corner.id)).toBe(false);
  });

  it('only offers legal balls', () => {
    expect(findPotLines(cue, [cue, red], GEOMETRY, ['yellow'])).toEqual([]);
  });

  it('asks for more speed for longer pots and clamps power to the cue range', () => {
    const line = findPotLines(cue, [cue, red], GEOMETRY, ['red'])[0]!;
    expect(speedToPot({ ...line, objectDistance: line.objectDistance * 2 }, DEFAULT_PHYSICS)).toBeGreaterThan(speedToPot(line, DEFAULT_PHYSICS));
    expect(powerForSpeed(0, DEFAULT_PHYSICS)).toBe(0);
    expect(powerForSpeed(100, DEFAULT_PHYSICS)).toBe(1);
  });
});

describe('shot planner', () => {
  it('pots a simple ball and expects to', () => {
    const corner = GEOMETRY.pockets.find((p) => p.id === 2)!;
    const red = objectBall(1, corner.center.x - 0.35, corner.center.y + 0.25);
    const balls = [cueAt(0.9, 0.5), red, objectBall(9, 0.3, 0.7, 'yellow'), objectBall(15, 0.5, 0.2, 'black')];
    const planner = plannerFor(balls, ON_REDS);
    planner.work(Number.MAX_SAFE_INTEGER);
    expect(planner.decision().expected?.kind).toBe('continue');
    const { result, sim } = playOut(balls, ON_REDS, planner);
    expect(result.verdict.kind).toBe('continue');
    expect(sim.balls.find((b) => b.id === 1)!.pocketed).toBe(true);
  });

  it('decides the same however the thinking is sliced', () => {
    const sim = rackedSim();
    const first = playAiTurn(sim, startMatch(0), 'medium', 3); // a break, to get an open table
    const balls = sim.balls.map((b) => ({ ...b }));
    const match = first.result.state;
    if (match.phase === 'over') throw new Error('unexpected end');
    const whole = plannerFor(balls, match, AI_LEVELS.medium, 9);
    whole.work(Number.MAX_SAFE_INTEGER);
    const sliced = plannerFor(balls, match, AI_LEVELS.medium, 9);
    while (!sliced.work(97));
    expect(sliced.decision()).toEqual(whole.decision());
    expect(sliced.steps).toBe(whole.steps);
  });

  it.each(AI_LEVEL_IDS)('%s stays within its thinking limit', (id) => {
    const planner = plannerFor(rackedSim().balls, startMatch(0), AI_LEVELS[id]);
    planner.work(Number.MAX_SAFE_INTEGER);
    expect(planner.done).toBe(true);
    expect(planner.steps).toBeLessThanOrEqual(AI_LEVELS[id].maxSteps);
    expect(planner.evaluatedCount).toBeGreaterThan(0);
  });

  it('a decision taken early (time limit) is still a playable shot', () => {
    const planner = plannerFor(rackedSim().balls, startMatch(0));
    planner.work(10);
    const d = planner.decision();
    expect(d.shot.power).toBeGreaterThan(0);
    expect(Math.hypot(d.shot.direction.x, d.shot.direction.y)).toBeCloseTo(1, 9);
    expect(planner.done).toBe(true);
  });

  it('breaks from behind the baulk line and the break is legal', () => {
    const balls = rackedSim().balls;
    const planner = plannerFor(balls, startMatch(0));
    planner.work(Number.MAX_SAFE_INTEGER);
    const d = planner.decision();
    expect(d.place).not.toBeNull();
    expect(d.place!.x).toBeLessThanOrEqual(TABLE.baulkLine);
    expect(d.intended.power).toBeGreaterThan(0.8);
    expect(['continue', 'turn-over']).toContain(playOut(balls, startMatch(0), planner).result.verdict.kind);
  });

  it('with ball in hand, puts the cue ball on a legal spot and pots', () => {
    const balls = [cueAt(0.3, 0.3), objectBall(1, 1.2, 0.5), objectBall(2, 0.7, 0.2, 'yellow'), objectBall(15, 1.5, 0.7, 'black')];
    const match: MatchState = { ...ON_REDS, ballInHand: 'anywhere' };
    const planner = plannerFor(balls, match);
    planner.work(Number.MAX_SAFE_INTEGER);
    const d = planner.decision();
    expect(d.place).not.toBeNull();
    expect(simWith(balls.map((b) => ({ ...b }))).placeCueBall(d.place!.x, d.place!.y)).toBe('ok');
    expect(playOut(balls, match, planner).result.verdict.kind).toBe('continue');
  });

  it('when its only ball is hidden behind an opponent ball, still finds a legal hit', () => {
    // Red against the top cushion, a wall of yellows between it and the cue ball.
    const balls = [
      cueAt(0.4, 0.6),
      objectBall(1, 0.4, 0.06),
      objectBall(2, 0.34, 0.3, 'yellow'),
      objectBall(3, 0.4, 0.3, 'yellow'),
      objectBall(4, 0.46, 0.3, 'yellow'),
      objectBall(15, 1.5, 0.5, 'black'),
    ];
    const planner = plannerFor(balls, ON_REDS);
    planner.work(Number.MAX_SAFE_INTEGER);
    expect(planner.decision().expected?.kind).not.toBe('foul');
    expect(playOut(balls, ON_REDS, planner).result.verdict.kind).not.toBe('foul');
  });

  it('on the black, plays to win', () => {
    const corner = GEOMETRY.pockets.find((p) => p.id === 0)!; // top left
    const balls = [cueAt(0.7, 0.45), objectBall(15, corner.center.x + 0.3, corner.center.y + 0.25, 'black'), objectBall(9, 1.4, 0.5, 'yellow')];
    const planner = plannerFor(balls, ON_REDS);
    planner.work(Number.MAX_SAFE_INTEGER);
    expect(planner.decision().expected).toEqual({ kind: 'game-over', winner: 0, reason: 'black-potted' });
  });

  it("predicts exactly what its intended shot does (the copy of the table is faithful)", () => {
    let balls = rackedSim().balls;
    let match = startMatch(0);
    for (let shot = 0; shot < 8 && match.phase !== 'over'; shot++) {
      const planner = plannerFor(balls, match, PERFECT, shot);
      planner.work(Number.MAX_SAFE_INTEGER);
      const { result, sim } = playOut(balls, match, planner);
      expect(result.verdict).toEqual(planner.decision().expected);
      // Carry on from the played position until the cue ball needs placing.
      if (sim.cueBall.pocketed || result.verdict.kind === 'rerack') break;
      balls = sim.balls;
      match = result.state;
    }
  });

  it('refuses to plan after the match is over', () => {
    expect(() => plannerFor(rackedSim().balls, { ...PLAY, phase: 'over', winner: 1 })).toThrow();
  });
});

describe('AI against AI', () => {
  it('a whole game between two Easy players ends with a winner', () => {
    const record = playAiGame(['easy', 'easy'], 1);
    expect(record.winner).not.toBeNull();
    expect(record.turns.at(-1)!.verdict.kind).toBe('game-over');
  }, 60_000);
});

