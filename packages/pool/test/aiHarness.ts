import { createRandom } from '@tzg/core';
import { ShotPlanner } from '../src/ai/planner';
import { AI_LEVELS, type AiLevel } from '../src/config/ai';
import { DEFAULT_PHYSICS } from '../src/config/physics';
import { SIMULATION_LOOP } from '../src/config/layout';
import { respawnCueBall } from '../src/physics/placement';
import { PoolSimulation } from '../src/physics/simulation';
import { countGroups, resolveShot, startMatch, type MatchState, type PlayerId, type ShotVerdict } from '../src/rules/blackball';
import { summarizeShot } from '../src/rules/shotSummary';
import { GEOMETRY, TABLE, rackedSim } from './helpers';

export interface GameRecord {
  readonly winner: PlayerId | null;
  readonly shots: number;
  /** Each shot: who played it and what the rules made of it. */
  readonly turns: readonly { readonly player: PlayerId; readonly verdict: ShotVerdict }[];
  /** Physics steps spent thinking, per decision. */
  readonly thinkSteps: readonly number[];
}

/** Plays one decision for match.current on sim, the way the table scene does. Returns the new match state. */
export function playAiTurn(sim: PoolSimulation, match: MatchState, level: AiLevel, seed: number) {
  const planner = new ShotPlanner({ balls: sim.balls, table: GEOMETRY, tableConfig: TABLE, physics: DEFAULT_PHYSICS, match }, AI_LEVELS[level], createRandom(seed));
  planner.work(Number.MAX_SAFE_INTEGER);
  const decision = planner.decision();
  if (decision.place) {
    const placed = sim.placeCueBall(decision.place.x, decision.place.y);
    if (placed !== 'ok') throw new Error(`AI chose an illegal spot: ${placed}`);
  }
  const counts = countGroups(sim.balls);
  const struck = sim.strike(decision.shot);
  if (struck !== 'ok') throw new Error(`AI shot refused: ${struck}`);
  sim.runUntilSettled();
  const result = resolveShot(match, summarizeShot(sim.shotEvents(), sim.balls), counts);
  return { result, decision, thinkSteps: planner.steps };
}

/** A whole game between two AI levels; player 0 breaks. Stops after maxShots with no winner. */
export function playAiGame(levels: readonly [AiLevel, AiLevel], seed: number, maxShots = 150): GameRecord {
  let sim = rackedSim();
  let match = startMatch(0);
  const turns: { player: PlayerId; verdict: ShotVerdict }[] = [];
  const thinkSteps: number[] = [];
  for (let shot = 0; shot < maxShots; shot++) {
    const turn = playAiTurn(sim, match, levels[match.current], seed * 1000 + shot);
    const result = turn.result;
    thinkSteps.push(turn.thinkSteps);
    turns.push({ player: match.current, verdict: result.verdict });
    match = result.state;
    if (match.phase === 'over') return { winner: match.winner, shots: shot + 1, turns, thinkSteps };
    if (result.verdict.kind === 'rerack') sim = rackedSim();
    if (sim.cueBall.pocketed && !respawnCueBall(sim, TABLE.cueStart, TABLE.playWidth / 2, SIMULATION_LOOP.respawnSearchStep)) {
      throw new Error('no free spot for the cue ball');
    }
  }
  return { winner: null, shots: maxShots, turns, thinkSteps };
}

