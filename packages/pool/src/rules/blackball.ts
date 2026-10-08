import type { Ball, BallKind } from '../physics/types';
import type { ShotSummary } from './shotSummary';

/*
 * Blackball rules engine (GAME_DESIGN.md "Rules decisions" and "Rules as built").
 * Pure functions over plain data: no Phaser, no physics, no randomness. The scene asks it what a
 * finished shot means and shows the result.
 */

export type PlayerId = 0 | 1;
export type Group = 'red' | 'yellow';

/** Where the next player may put the cue ball, if anywhere. */
export type BallInHand = 'baulk' | 'anywhere' | null;

export interface MatchState {
  readonly breaker: PlayerId;
  readonly current: PlayerId;
  /** 'break' until the break shot is played; 'over' once someone has won. */
  readonly phase: 'break' | 'play' | 'over';
  /** Group of each player, indexed by PlayerId. Both null while the table is open. */
  readonly groups: readonly [Group | null, Group | null];
  readonly ballInHand: BallInHand;
  readonly winner: PlayerId | null;
}

export type FoulReason =
  | 'no-contact'
  | 'wrong-ball-first'
  | 'cue-ball-potted'
  | 'opponent-ball-potted'
  | 'no-cushion'
  | 'illegal-break';

export type GameOverReason = 'black-potted' | 'black-potted-early' | 'black-potted-with-foul';

export type ShotVerdict =
  | { readonly kind: 'continue' }
  | { readonly kind: 'turn-over' }
  | { readonly kind: 'foul'; readonly reason: FoulReason }
  | { readonly kind: 'rerack' }
  | { readonly kind: 'game-over'; readonly winner: PlayerId; readonly reason: GameOverReason };

export interface ShotResult {
  readonly state: MatchState;
  readonly verdict: ShotVerdict;
  /** Set when this shot decided who has reds and who has yellows. */
  readonly groupsAssigned: boolean;
}

/** Object balls of each group still on the table when the shot was played. */
export interface GroupCounts {
  readonly red: number;
  readonly yellow: number;
}

export interface BlackballConfig {
  /** A break is legal if it pots an object ball or drives at least this many object balls to a cushion. */
  readonly breakCushionBalls: number;
}

/** Counts the red and yellow balls still on the table. */
export function countGroups(balls: readonly Ball[]): GroupCounts {
  let red = 0;
  let yellow = 0;
  for (const b of balls) {
    if (b.pocketed) continue;
    if (b.kind === 'red') red += 1;
    else if (b.kind === 'yellow') yellow += 1;
  }
  return { red, yellow };
}

export const BLACKBALL_RULES: BlackballConfig = { breakCushionBalls: 2 };

export function startMatch(breaker: PlayerId): MatchState {
  return { breaker, current: breaker, phase: 'break', groups: [null, null], ballInHand: 'baulk', winner: null };
}

export const opponentOf = (player: PlayerId): PlayerId => (player === 0 ? 1 : 0);

/** True when the player's own group is cleared and only the black remains for them. */
export function isOnBlack(state: MatchState, player: PlayerId, counts: GroupCounts): boolean {
  const group = state.groups[player];
  return group !== null && counts[group] === 0;
}

/** The ball kinds the current player may legally hit first. */
export function legalFirstContacts(state: MatchState, counts: GroupCounts): readonly BallKind[] {
  if (state.phase === 'break') return ['red', 'yellow', 'black'];
  const group = state.groups[state.current];
  if (group === null) return ['red', 'yellow'];
  return counts[group] === 0 ? ['black'] : [group];
}

/**
 * Decides what a finished shot means. `counts` are the group balls on the table before the shot.
 * Throws if called after the match is over (a caller bug).
 */
export function resolveShot(
  state: MatchState,
  shot: ShotSummary,
  counts: GroupCounts,
  config: BlackballConfig = BLACKBALL_RULES,
): ShotResult {
  if (state.phase === 'over') throw new Error('resolveShot called after the match ended');
  const shooter = state.current;
  const opponent = opponentOf(shooter);
  const isBreak = state.phase === 'break';
  const ownGroup = state.groups[shooter];
  const blackPotted = shot.potted.includes('black');
  const foul = findFoul(state, shot, counts, config);

  // The black decides the game before anything else (R2: any pocket; R3: re-rack on the break).
  if (blackPotted) {
    if (isBreak) {
      return { state: startMatch(state.breaker), verdict: { kind: 'rerack' }, groupsAssigned: false };
    }
    const wasOnBlack = isOnBlack(state, shooter, counts);
    if (wasOnBlack && foul === null) return gameOver(state, shooter, 'black-potted');
    return gameOver(state, opponent, wasOnBlack ? 'black-potted-with-foul' : 'black-potted-early');
  }

  if (foul !== null) {
    return {
      state: { ...state, phase: 'play', current: opponent, ballInHand: 'anywhere' },
      verdict: { kind: 'foul', reason: foul },
      groupsAssigned: false,
    };
  }

  const pottedGroupBalls = shot.potted.filter((k): k is Group => k === 'red' || k === 'yellow');

  if (isBreak) {
    // The table stays open after the break, whatever was potted.
    const verdict: ShotVerdict = pottedGroupBalls.length > 0 ? { kind: 'continue' } : { kind: 'turn-over' };
    return { state: nextTurn(state, verdict), verdict, groupsAssigned: false };
  }

  if (ownGroup === null) {
    // Open table: potting only one colour claims it; potting both keeps the table open.
    if (pottedGroupBalls.length === 0) return { state: nextTurn(state, { kind: 'turn-over' }), verdict: { kind: 'turn-over' }, groupsAssigned: false };
    const first = pottedGroupBalls[0]!;
    const single = pottedGroupBalls.every((k) => k === first);
    const verdict: ShotVerdict = { kind: 'continue' };
    if (!single) return { state: nextTurn(state, verdict), verdict, groupsAssigned: false };
    const other: Group = first === 'red' ? 'yellow' : 'red';
    const groups: [Group | null, Group | null] = shooter === 0 ? [first, other] : [other, first];
    return { state: { ...nextTurn(state, verdict), groups }, verdict, groupsAssigned: true };
  }

  const verdict: ShotVerdict = pottedGroupBalls.includes(ownGroup) ? { kind: 'continue' } : { kind: 'turn-over' };
  return { state: nextTurn(state, verdict), verdict, groupsAssigned: false };
}

/** First foul that applies, in the order a referee would call it, or null. */
function findFoul(state: MatchState, shot: ShotSummary, counts: GroupCounts, config: BlackballConfig): FoulReason | null {
  if (shot.firstContact === null) return 'no-contact';
  if (!legalFirstContacts(state, counts).includes(shot.firstContact)) return 'wrong-ball-first';
  if (shot.cueBallPotted) return 'cue-ball-potted';

  const ownGroup = state.groups[state.current];
  if (ownGroup !== null) {
    const opponentGroup: Group = ownGroup === 'red' ? 'yellow' : 'red';
    if (shot.potted.includes(opponentGroup)) return 'opponent-ball-potted';
  }

  if (state.phase === 'break') {
    const legalBreak = shot.potted.length > 0 || shot.objectBallsToCushion >= config.breakCushionBalls;
    return legalBreak ? null : 'illegal-break';
  }
  if (shot.potted.length === 0 && !shot.cushionAfterContact) return 'no-cushion';
  return null;
}

function nextTurn(state: MatchState, verdict: ShotVerdict): MatchState {
  const current = verdict.kind === 'continue' ? state.current : opponentOf(state.current);
  return { ...state, phase: 'play', current, ballInHand: null };
}

function gameOver(state: MatchState, winner: PlayerId, reason: GameOverReason): ShotResult {
  return {
    state: { ...state, phase: 'over', winner, ballInHand: null },
    verdict: { kind: 'game-over', winner, reason },
    groupsAssigned: false,
  };
}
