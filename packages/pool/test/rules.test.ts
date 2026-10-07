import { describe, expect, it } from 'vitest';
import { isOnBlack, legalFirstContacts, resolveShot, startMatch, type GroupCounts, type MatchState } from '../src/rules/blackball';
import { summarizeShot, type ShotSummary } from '../src/rules/shotSummary';
import type { BallKind, ShotEvent } from '../src/physics/types';
import { cueAt, objectBall } from './helpers';

const FULL: GroupCounts = { red: 7, yellow: 7 };

/** A clean shot: hits `first`, pots `potted`, something reaches a cushion. Override any field. */
function shot(first: BallKind | null, potted: BallKind[] = [], extra: Partial<ShotSummary> = {}): ShotSummary {
  return { firstContact: first, potted, cueBallPotted: false, cushionAfterContact: true, objectBallsToCushion: 4, ...extra };
}

/** Match state after the break, with player 0 to play and the given groups. */
function playing(groups: MatchState['groups'] = [null, null], current: 0 | 1 = 0): MatchState {
  return { ...startMatch(0), phase: 'play', current, groups, ballInHand: null };
}

const RED_YELLOW: MatchState['groups'] = ['red', 'yellow'];

describe('break', () => {
  it('starts with the breaker placing the cue ball behind the baulk line', () => {
    expect(startMatch(1)).toEqual({ breaker: 1, current: 1, phase: 'break', groups: [null, null], ballInHand: 'baulk', winner: null });
  });

  it('a pot on the break keeps the breaker at the table, with the table still open', () => {
    const r = resolveShot(startMatch(0), shot('red', ['yellow']), FULL);
    expect(r.verdict).toEqual({ kind: 'continue' });
    expect(r.state).toMatchObject({ phase: 'play', current: 0, groups: [null, null], ballInHand: null });
    expect(r.groupsAssigned).toBe(false);
  });

  it('a legal break with no pot passes the turn', () => {
    const r = resolveShot(startMatch(0), shot('red', [], { objectBallsToCushion: 2 }), FULL);
    expect(r.verdict).toEqual({ kind: 'turn-over' });
    expect(r.state.current).toBe(1);
  });

  it('fewer than two balls to a cushion and no pot is an illegal break (foul)', () => {
    const r = resolveShot(startMatch(0), shot('red', [], { objectBallsToCushion: 1 }), FULL);
    expect(r.verdict).toEqual({ kind: 'foul', reason: 'illegal-break' });
    expect(r.state).toMatchObject({ current: 1, ballInHand: 'anywhere', phase: 'play' });
  });

  it('cue ball potted on the break is a foul', () => {
    const r = resolveShot(startMatch(0), shot('red', ['red'], { cueBallPotted: true }), FULL);
    expect(r.verdict).toEqual({ kind: 'foul', reason: 'cue-ball-potted' });
  });

  it('black potted on the break means a re-rack with the same breaker (R3)', () => {
    const r = resolveShot(startMatch(1), shot('red', ['black'], { cueBallPotted: true }), FULL);
    expect(r.verdict).toEqual({ kind: 'rerack' });
    expect(r.state).toEqual(startMatch(1));
  });
});

describe('open table', () => {
  it('potting one colour claims it, and the opponent gets the other', () => {
    const r = resolveShot(playing([null, null], 1), shot('yellow', ['yellow', 'yellow']), FULL);
    expect(r.groupsAssigned).toBe(true);
    expect(r.state.groups).toEqual(['red', 'yellow']);
    expect(r.verdict).toEqual({ kind: 'continue' });
    expect(r.state.current).toBe(1);
  });

  it('hitting one colour and potting the other still claims the potted colour', () => {
    const r = resolveShot(playing(), shot('red', ['yellow']), FULL);
    expect(r.state.groups).toEqual(['yellow', 'red']);
  });

  it('potting both colours keeps the table open and the turn', () => {
    const r = resolveShot(playing(), shot('red', ['red', 'yellow']), FULL);
    expect(r.groupsAssigned).toBe(false);
    expect(r.state.groups).toEqual([null, null]);
    expect(r.verdict).toEqual({ kind: 'continue' });
  });

  it('hitting the black first is a foul', () => {
    expect(resolveShot(playing(), shot('black'), FULL).verdict).toEqual({ kind: 'foul', reason: 'wrong-ball-first' });
  });

  it('a foul never assigns groups, even if a colour went down', () => {
    const r = resolveShot(playing(), shot('red', ['red'], { cueBallPotted: true }), FULL);
    expect(r.verdict.kind).toBe('foul');
    expect(r.state.groups).toEqual([null, null]);
  });

  it('nothing potted passes the turn', () => {
    expect(resolveShot(playing(), shot('red'), FULL).verdict).toEqual({ kind: 'turn-over' });
  });

  it('potting the black on an open table loses', () => {
    const r = resolveShot(playing(), shot('red', ['black']), FULL);
    expect(r.verdict).toEqual({ kind: 'game-over', winner: 1, reason: 'black-potted-early' });
    expect(r.state).toMatchObject({ phase: 'over', winner: 1 });
  });
});

describe('groups assigned', () => {
  it('potting an own ball keeps the turn', () => {
    expect(resolveShot(playing(RED_YELLOW), shot('red', ['red']), FULL).verdict).toEqual({ kind: 'continue' });
  });

  it("hitting the opponent's ball first is a foul with ball in hand anywhere (R1)", () => {
    const r = resolveShot(playing(RED_YELLOW), shot('yellow', ['red']), FULL);
    expect(r.verdict).toEqual({ kind: 'foul', reason: 'wrong-ball-first' });
    expect(r.state).toMatchObject({ current: 1, ballInHand: 'anywhere' });
  });

  it("potting an opponent's ball is a foul even with an own ball potted too", () => {
    expect(resolveShot(playing(RED_YELLOW), shot('red', ['red', 'yellow']), FULL).verdict).toEqual({ kind: 'foul', reason: 'opponent-ball-potted' });
  });

  it('missing every ball is a foul', () => {
    expect(resolveShot(playing(RED_YELLOW), shot(null, [], { cushionAfterContact: false }), FULL).verdict).toEqual({
      kind: 'foul',
      reason: 'no-contact',
    });
  });

  it('no pot and no cushion after contact is a foul', () => {
    expect(resolveShot(playing(RED_YELLOW), shot('red', [], { cushionAfterContact: false }), FULL).verdict).toEqual({
      kind: 'foul',
      reason: 'no-cushion',
    });
  });

  it('the cue ball going in after a good pot is still a foul', () => {
    expect(resolveShot(playing(RED_YELLOW), shot('red', ['red'], { cueBallPotted: true }), FULL).verdict).toEqual({
      kind: 'foul',
      reason: 'cue-ball-potted',
    });
  });

  it('a foul by player 1 gives player 0 ball in hand', () => {
    const r = resolveShot(playing(RED_YELLOW, 1), shot('red'), FULL);
    expect(r.state).toMatchObject({ current: 0, ballInHand: 'anywhere' });
  });

  it('a clean shot after ball in hand clears it', () => {
    const r = resolveShot({ ...playing(RED_YELLOW), ballInHand: 'anywhere' }, shot('red'), FULL);
    expect(r.state.ballInHand).toBeNull();
  });
});

describe('the black', () => {
  const onBlack: GroupCounts = { red: 0, yellow: 3 };

  it('a player with their colour cleared must hit the black first', () => {
    expect(isOnBlack(playing(RED_YELLOW), 0, onBlack)).toBe(true);
    expect(legalFirstContacts(playing(RED_YELLOW), onBlack)).toEqual(['black']);
    expect(resolveShot(playing(RED_YELLOW), shot('yellow'), onBlack).verdict).toEqual({ kind: 'foul', reason: 'wrong-ball-first' });
  });

  it('potting the black legally wins, in any pocket (R2)', () => {
    expect(resolveShot(playing(RED_YELLOW), shot('black', ['black']), onBlack).verdict).toEqual({
      kind: 'game-over',
      winner: 0,
      reason: 'black-potted',
    });
  });

  it('potting the black with the cue ball loses', () => {
    expect(resolveShot(playing(RED_YELLOW), shot('black', ['black'], { cueBallPotted: true }), onBlack).verdict).toEqual({
      kind: 'game-over',
      winner: 1,
      reason: 'black-potted-with-foul',
    });
  });

  it("potting the black along with an opponent's ball loses", () => {
    expect(resolveShot(playing(RED_YELLOW), shot('black', ['yellow', 'black']), onBlack).verdict).toMatchObject({ kind: 'game-over', winner: 1 });
  });

  it('potting the last own ball and the black in one shot loses (not on the black yet)', () => {
    expect(resolveShot(playing(RED_YELLOW), shot('red', ['red', 'black']), { red: 1, yellow: 4 }).verdict).toEqual({
      kind: 'game-over',
      winner: 1,
      reason: 'black-potted-early',
    });
  });

  it('a foul while on the black gives ball in hand but does not lose', () => {
    const r = resolveShot(playing(RED_YELLOW), shot('black', [], { cushionAfterContact: false }), onBlack);
    expect(r.verdict).toEqual({ kind: 'foul', reason: 'no-cushion' });
    expect(r.state.phase).toBe('play');
  });

  it('refuses to resolve a shot after the match is over', () => {
    const over = resolveShot(playing(RED_YELLOW), shot('black', ['black']), onBlack).state;
    expect(() => resolveShot(over, shot('red'), onBlack)).toThrow();
  });
});

describe('shot summary from physics events', () => {
  const balls = [cueAt(0.3, 0.3), objectBall(1, 1, 0.3, 'red'), objectBall(2, 1.2, 0.3, 'yellow'), objectBall(3, 1.3, 0.3, 'black')];

  it('records first contact, cushions after contact, pots and break cushions', () => {
    const events: ShotEvent[] = [
      { type: 'cushion', step: 1, ball: 0 },
      { type: 'ball', step: 5, a: 0, b: 2 },
      { type: 'ball', step: 6, a: 1, b: 2 },
      { type: 'ball', step: 7, a: 0, b: 1 },
      { type: 'cushion', step: 9, ball: 1 },
      { type: 'cushion', step: 10, ball: 1 },
      { type: 'pocket', step: 12, ball: 3, pocket: 2 },
      { type: 'pocket', step: 14, ball: 0, pocket: 4 },
    ];
    expect(summarizeShot(events, balls)).toEqual({
      firstContact: 'yellow',
      potted: ['black'],
      cueBallPotted: true,
      cushionAfterContact: true,
      objectBallsToCushion: 1,
    });
  });

  it('a cushion before the first contact does not count', () => {
    const events: ShotEvent[] = [
      { type: 'cushion', step: 1, ball: 0 },
      { type: 'ball', step: 5, a: 0, b: 1 },
    ];
    expect(summarizeShot(events, balls)).toMatchObject({ firstContact: 'red', cushionAfterContact: false });
  });

  it('no events means no contact', () => {
    expect(summarizeShot([], balls)).toMatchObject({ firstContact: null, potted: [], cueBallPotted: false });
  });

  it('an unknown ball id is a bug and throws', () => {
    expect(() => summarizeShot([{ type: 'pocket', step: 1, ball: 99, pocket: 0 }], balls)).toThrow();
  });
});

describe('rules with the real simulation', () => {
  it('a full-power break is legal and its result is decided without errors', async () => {
    const { rackedSim } = await import('./helpers');
    const sim = rackedSim();
    sim.strike({ direction: { x: 1, y: 0.01 }, power: 1, side: 0, height: 0 });
    sim.runUntilSettled();
    const summary = summarizeShot(sim.shotEvents(), sim.balls);
    expect(summary.firstContact).toBe('red');
    expect(summary.objectBallsToCushion).toBeGreaterThanOrEqual(2);
    const r = resolveShot(startMatch(0), summary, FULL);
    expect(r.verdict.kind === 'foul' && r.verdict.reason === 'illegal-break').toBe(false);
  });
});
