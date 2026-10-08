import { MemoryStore, backupKey } from '@tzg/core';
import { describe, expect, it } from 'vitest';
import { defaultProgress, recordGame, validateProgress } from '../src/progress/progress';
import { restoreBalls, toSavedBalls, validateSavedMatch, type SavedMatch } from '../src/progress/savedMatch';
import { createPoolSlots } from '../src/progress/slots';
import { validateOpponent } from '../src/progress/opponent';
import { startMatch, validateMatchState, type MatchState } from '../src/rules/blackball';
import { TABLE, rackedSim } from './helpers';

const PLAY: MatchState = { breaker: 0, current: 1, phase: 'play', groups: ['red', 'yellow'], ballInHand: 'anywhere', winner: null };

function savedAfterBreak(): SavedMatch {
  const sim = rackedSim();
  sim.strike({ direction: { x: 1, y: 0.01 }, power: 1, side: 0, height: 0 });
  sim.runUntilSettled();
  if (sim.cueBall.pocketed) throw new Error('test break potted the cue ball; pick another');
  return { opponent: { kind: 'computer', level: 'medium' }, match: PLAY, balls: toSavedBalls(sim.balls), shots: 1 };
}

/** JSON round trip, as storage does. */
const viaJson = (v: unknown): unknown => JSON.parse(JSON.stringify(v));

describe('match state validation', () => {
  it('accepts a fresh match and a match in play', () => {
    expect(validateMatchState(viaJson(startMatch(1)))).toEqual(startMatch(1));
    expect(validateMatchState(viaJson(PLAY))).toEqual(PLAY);
  });

  it.each([
    ['finished', { ...PLAY, phase: 'over', winner: 0 }],
    ['unknown phase', { ...PLAY, phase: 'warmup' }],
    ['bad player', { ...PLAY, current: 2 }],
    ['same colour twice', { ...PLAY, groups: ['red', 'red'] }],
    ['half-decided groups', { ...PLAY, groups: ['red', null] }],
    ['break with groups', { ...startMatch(0), groups: ['red', 'yellow'] }],
    ['break by the wrong player', { ...startMatch(0), current: 1 }],
    ['baulk ball in hand after the break', { ...PLAY, ballInHand: 'baulk' }],
    ['not an object', 'match'],
  ])('rejects %s', (_name, raw) => {
    expect(validateMatchState(viaJson(raw))).toBeNull();
  });
});

describe('saved game', () => {
  it('round-trips through JSON and restores the same table', () => {
    const saved = savedAfterBreak();
    const loaded = validateSavedMatch(viaJson(saved), TABLE);
    expect(loaded).toEqual(saved);
    const balls = restoreBalls(loaded!.balls, TABLE);
    const fresh = rackedSim().balls;
    for (const b of balls) {
      const s = saved.balls.find((x) => x.id === b.id)!;
      const kind = fresh.find((x) => x.id === b.id)!.kind;
      expect([b.x, b.y, b.pocketed, b.kind, b.vx, b.vy]).toEqual([s.x, s.y, s.pocketed, kind, 0, 0]);
    }
  });

  const tamper = (change: (s: Record<string, unknown> & { balls: Record<string, unknown>[] }) => void) => {
    const raw = viaJson(savedAfterBreak()) as Record<string, unknown> & { balls: Record<string, unknown>[] };
    change(raw);
    return validateSavedMatch(raw, TABLE);
  };

  it.each([
    ['a missing ball', (s: { balls: unknown[] }) => s.balls.pop()],
    ['an extra ball', (s: { balls: unknown[] }) => s.balls.push({ id: 16, x: 1, y: 0.5, pocketed: false })],
    ['a repeated id', (s: { balls: Record<string, unknown>[] }) => (s.balls[2]!.id = s.balls[1]!.id)],
    ['a ball off the table', (s: { balls: Record<string, unknown>[] }) => (s.balls[3]!.x = 5)],
    ['a non-number position', (s: { balls: Record<string, unknown>[] }) => (s.balls[3]!.y = '0.4')],
    ['a potted cue ball', (s: { balls: Record<string, unknown>[] }) => (s.balls[0]!.pocketed = true)],
    ['two balls on one spot', (s: { balls: Record<string, unknown>[] }) => {
      const on = s.balls.filter((b) => !b.pocketed);
      on[1]!.x = on[0]!.x;
      on[1]!.y = on[0]!.y;
    }],
    ['an unknown opponent', (s: Record<string, unknown>) => (s.opponent = { kind: 'computer', level: 'expert' })],
    ['a negative shot count', (s: Record<string, unknown>) => (s.shots = -1)],
    ['a finished match', (s: Record<string, unknown>) => (s.match = { ...PLAY, phase: 'over', winner: 0 })],
  ])('rejects %s', (_name, change) => {
    expect(tamper(change as never)).toBeNull();
  });

  it('a damaged saved game loads as no game, is backed up, and never throws', () => {
    const store = new MemoryStore();
    const slots = createPoolSlots('pool', store, TABLE);
    store.set('pool.match', '{"v":1,"data":{"opponent":{"kind":"human"}}}');
    expect(slots.match.load()).toEqual({ data: null, outcome: 'invalid' });
    expect(store.get(backupKey('pool.match'))).toContain('human');
    expect(slots.match.save(savedAfterBreak())).toBe(true);
    expect(slots.match.load().outcome).toBe('loaded');
    slots.match.clear();
    expect(slots.match.load()).toEqual({ data: null, outcome: 'missing' });
  });
});

type RawProgress = { vsComputer: Record<string, unknown>; [key: string]: unknown };

describe('progress', () => {
  it('counts games against each level and two-player games', () => {
    let p = defaultProgress();
    p = recordGame(p, { kind: 'computer', level: 'easy' }, 0);
    p = recordGame(p, { kind: 'computer', level: 'easy' }, 1);
    p = recordGame(p, { kind: 'computer', level: 'hard' }, 1);
    p = recordGame(p, { kind: 'human' }, 1);
    expect(p.vsComputer).toEqual({ easy: { played: 2, won: 1 }, medium: { played: 0, won: 0 }, hard: { played: 1, won: 0 } });
    expect(p.twoPlayerGames).toBe(1);
  });

  it('round-trips and keeps the last opponent', () => {
    const p = { ...recordGame(defaultProgress(), { kind: 'computer', level: 'medium' }, 0), lastOpponent: { kind: 'computer', level: 'medium' } as const };
    expect(validateProgress(viaJson(p))).toEqual(p);
    expect(validateProgress(viaJson(defaultProgress()))).toEqual(defaultProgress());
  });

  it.each([
    ['more wins than games', (p: RawProgress) => (p.vsComputer.easy = { played: 1, won: 2 })],
    ['a missing level', (p: RawProgress) => delete p.vsComputer.hard],
    ['a fractional count', (p: RawProgress) => (p.twoPlayerGames = 1.5)],
    ['a bad last opponent', (p: RawProgress) => (p.lastOpponent = { kind: 'robot' })],
  ])('rejects %s', (_name, change) => {
    const raw = viaJson(defaultProgress()) as RawProgress;
    change(raw);
    expect(validateProgress(raw)).toBeNull();
  });

  it('opponent validation accepts only known opponents', () => {
    expect(validateOpponent({ kind: 'human', extra: 1 })).toEqual({ kind: 'human' });
    expect(validateOpponent({ kind: 'computer', level: 'hard' })).toEqual({ kind: 'computer', level: 'hard' });
    expect(validateOpponent({ kind: 'computer' })).toBeNull();
    expect(validateOpponent(null)).toBeNull();
  });
});
