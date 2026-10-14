import { MemoryStore, backupKey } from '@tzg/core';
import { describe, expect, it } from 'vitest';
import { defaultProgress, recordGame, validateProgress } from '../src/progress/progress';
import { restoreBalls, toSavedBalls, validateSavedMatch, type SavedMatch } from '../src/progress/savedMatch';
import { createPoolSlots } from '../src/progress/slots';
import { DEFAULT_PICKS } from '../src/config/characters';
import { validateOpponent } from '../src/progress/opponent';
import { startMatch, validateMatchState, type MatchState } from '../src/rules/blackball';
import { TABLE, rackedSim } from './helpers';

const PLAY: MatchState = { breaker: 0, current: 1, phase: 'play', groups: ['red', 'yellow'], ballInHand: 'anywhere', winner: null };

function savedAfterBreak(): SavedMatch {
  const sim = rackedSim();
  sim.strike({ direction: { x: 1, y: 0.01 }, power: 1, side: 0, height: 0 });
  sim.runUntilSettled();
  if (sim.cueBall.pocketed) throw new Error('test break potted the cue ball; pick another');
  return { opponent: { kind: 'computer', level: 'medium' }, picks: ['bonge', 'malkia'], match: PLAY, balls: toSavedBalls(sim.balls), shots: 1 };
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

  it('keeps the shots by each player for Kimbunga; a missing or broken count only drops it', () => {
    const saved = { ...savedAfterBreak(), shotsBy: [1, 0] as const };
    expect(validateSavedMatch(viaJson(saved), TABLE)?.shotsBy).toEqual([1, 0]);
    for (const shotsBy of [undefined, [1], [1, -1], 'x']) {
      const raw = viaJson(saved) as Record<string, unknown>;
      if (shotsBy === undefined) delete raw.shotsBy;
      else raw.shotsBy = shotsBy;
      const loaded = validateSavedMatch(raw, TABLE);
      expect(loaded).not.toBeNull();
      expect(loaded!.shotsBy).toBeUndefined();
    }
  });

  it('a game saved before characters existed, or with bad characters, loads with the default ones', () => {
    for (const picks of [undefined, ['fundi', 'fundi'], ['nobody', 'fundi'], 'fundi']) {
      const raw = viaJson(savedAfterBreak()) as Record<string, unknown>;
      if (picks === undefined) delete raw.picks;
      else raw.picks = picks;
      expect(validateSavedMatch(raw, TABLE)?.picks).toEqual(DEFAULT_PICKS);
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
    expect(p.vsComputer).toEqual({ easy: { played: 2, won: 1 }, medium: { played: 0, won: 0 }, hard: { played: 1, won: 0 }, impossible: { played: 0, won: 0 } });
    expect(p.twoPlayerGames).toBe(1);
  });

  it('round-trips and keeps the last opponent', () => {
    const p = { ...recordGame(defaultProgress(), { kind: 'computer', level: 'medium' }, 0), lastOpponent: { kind: 'computer', level: 'medium' } as const };
    expect(validateProgress(viaJson(p))).toEqual(p);
    expect(validateProgress(viaJson(defaultProgress()))).toEqual(defaultProgress());
  });

  it('an older save without the Impossible level keeps its stats and starts Impossible at zero', () => {
    const p = recordGame(defaultProgress(), { kind: 'computer', level: 'hard' }, 0);
    const old = viaJson(p) as RawProgress;
    delete old.vsComputer.impossible;
    expect(validateProgress(old)).toEqual(p);
  });

  it.each([
    ['more wins than games', (p: RawProgress) => (p.vsComputer.easy = { played: 1, won: 2 })],
    ['a damaged level', (p: RawProgress) => (p.vsComputer.hard = 'lots')],
    ['a fractional count', (p: RawProgress) => (p.twoPlayerGames = 1.5)],
    ['a bad last opponent', (p: RawProgress) => (p.lastOpponent = { kind: 'robot' })],
  ])('rejects %s', (_name, change) => {
    const raw = viaJson(defaultProgress()) as RawProgress;
    change(raw);
    expect(validateProgress(raw)).toBeNull();
  });

  it('keeps the last characters, and an older save without them keeps its stats', () => {
    const p = { ...defaultProgress(), lastPicks: ['malkia', 'fundi'] as const };
    expect(validateProgress(viaJson(p))).toEqual(p);
    const old = viaJson(recordGame(defaultProgress(), { kind: 'human' }, 0)) as Record<string, unknown>;
    delete old.lastPicks;
    expect(validateProgress(old)).toEqual({ ...recordGame(defaultProgress(), { kind: 'human' }, 0), lastPicks: null });
    expect(validateProgress({ ...p, lastPicks: ['fundi', 'fundi'] })?.lastPicks).toBeNull();
  });

  it('keeps the chosen table; an older save, or a table that no longer exists, plays on Classic and keeps its stats', () => {
    const p = { ...recordGame(defaultProgress(), { kind: 'human' }, 0), table: 'maasai' as const };
    expect(validateProgress(viaJson(p))).toEqual(p);
    const old = viaJson(p) as Record<string, unknown>;
    delete old.table;
    expect(validateProgress(old)).toEqual({ ...p, table: 'classic' });
    expect(validateProgress({ ...p, table: 'velvet' })).toEqual({ ...p, table: 'classic' });
  });

  it('keeps the chosen cue; an older save or an unknown cue gives Klasiki', () => {
    const p = { ...defaultProgress(), cue: 'makonde' as const };
    expect(validateProgress(viaJson(p))).toEqual(p);
    const old = viaJson(p) as Record<string, unknown>;
    delete old.cue;
    expect(validateProgress(old)?.cue).toBe('classic');
    expect(validateProgress({ ...p, cue: 'gold' })?.cue).toBe('classic');
  });

  it('counts wins in a row against the computer; a loss ends the streak but keeps the best', () => {
    const easy = { kind: 'computer', level: 'easy' } as const;
    let p = defaultProgress();
    for (const winner of [0, 0, 0, 1, 0] as const) p = recordGame(p, easy, winner);
    expect(p.streak).toEqual({ current: 1, best: 3 });
    // Two-player games leave the streak alone.
    expect(recordGame(p, { kind: 'human' }, 1).streak).toEqual({ current: 1, best: 3 });
    expect(validateProgress(viaJson(p))).toEqual(p);
  });

  it('an older save without a streak, or a broken one, starts the streak at zero and keeps the stats', () => {
    const p = recordGame(defaultProgress(), { kind: 'computer', level: 'hard' }, 0);
    const old = viaJson(p) as Record<string, unknown>;
    delete old.streak;
    expect(validateProgress(old)).toEqual({ ...p, streak: { current: 0, best: 0 } });
    expect(validateProgress({ ...p, streak: { current: 4, best: 2 } })?.streak).toEqual({ current: 0, best: 0 });
    expect(validateProgress({ ...p, streak: 'x' })?.vsComputer).toEqual(p.vsComputer);
  });

  it('opponent validation accepts only known opponents', () => {
    expect(validateOpponent({ kind: 'human', extra: 1 })).toEqual({ kind: 'human' });
    expect(validateOpponent({ kind: 'computer', level: 'hard' })).toEqual({ kind: 'computer', level: 'hard' });
    expect(validateOpponent({ kind: 'computer' })).toBeNull();
    expect(validateOpponent(null)).toBeNull();
  });
});
