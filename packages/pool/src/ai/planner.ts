import type { Random } from '@tzg/core';
import { AI_SCORES, AI_SEARCH, type AiLevelConfig } from '../config/ai';
import type { PhysicsConfig } from '../config/physics';
import type { TableConfig } from '../config/table';
import { CUE_BALL_ID } from '../physics/rack';
import { PoolSimulation } from '../physics/simulation';
import type { Ball, Shot, TableGeometry, Vec2 } from '../physics/types';
import { countGroups, legalFirstContacts, resolveShot, type GroupCounts, type MatchState, type ShotResult } from '../rules/blackball';
import { summarizeShot } from '../rules/shotSummary';
import { primaryCandidates, sweepCandidates, type Candidate, type CandidateInput } from './candidates';
import { bestEase } from './potLines';

export interface PlannerInput {
  /** The table as it stands; copied, never changed. */
  readonly balls: readonly Ball[];
  readonly table: TableGeometry;
  readonly tableConfig: TableConfig;
  readonly physics: PhysicsConfig;
  /** The AI is match.current. */
  readonly match: MatchState;
}

export interface AiDecision {
  /** Where to put the cue ball first (ball in hand), or null to leave it. */
  readonly place: Vec2 | null;
  /** The shot to play, with the level's aim and power error already applied. */
  readonly shot: Shot;
  /** The shot the AI meant to play. */
  readonly intended: Shot;
  /** What the AI expected from the intended shot, or null if it found nothing to try. */
  readonly expected: ShotResult['verdict'] | null;
  readonly score: number;
}

/** One candidate played out, plus the scores of its aim-error variants (Hard's robustness check). */
interface Outcome {
  readonly candidate: Candidate;
  readonly score: number;
  readonly verdict: ShotResult['verdict'];
  readonly variantScores: number[];
}

/** A shot to play out. Variants of an earlier outcome name it as their owner. */
interface Job {
  readonly candidate: Candidate;
  readonly owner: Outcome | null;
}

interface Evaluation {
  readonly job: Job;
  readonly sim: PoolSimulation;
  readonly counts: GroupCounts;
}

/** Played when no candidate could be tried at all (should not happen): a gentle shot up the table. */
const FALLBACK_SHOT: Shot = { direction: { x: 1, y: 0 }, power: 0.3, side: 0, height: 0 };

/**
 * Chooses the computer's shot. It plays candidate shots out on copies of the table with the real
 * physics, asks the rules engine what each one means, and keeps the best. The work is done in
 * slices (`work`) so the game can spread it over frames; the result does not depend on how the work
 * is sliced. Pure and deterministic for a given Random seed.
 */
export class ShotPlanner {
  /** Snapshot of the table when planning started, so later changes to the caller's balls cannot leak in. */
  private readonly balls: readonly Ball[];
  private readonly queue: Job[];
  private readonly candidateInput: CandidateInput;
  private readonly outcomes: Outcome[] = [];
  private robustSet: Outcome[] | null = null;
  private current: Evaluation | null = null;
  private sweepAdded = false;
  private stepsUsed = 0;
  private finished = false;
  private decided: AiDecision | null = null;
  private evaluated = 0;

  constructor(
    private readonly input: PlannerInput,
    private readonly level: AiLevelConfig,
    private readonly random: Random,
  ) {
    if (input.match.phase === 'over') throw new Error('the match is over; nothing to plan');
    this.balls = input.balls.map((b) => ({ ...b }));
    const cue = this.balls.find((b) => b.id === CUE_BALL_ID);
    if (!cue) throw new Error('no cue ball');
    const placeProbe = this.copySim();
    this.candidateInput = {
      balls: this.balls,
      cue,
      table: input.table,
      tableConfig: input.tableConfig,
      physics: input.physics,
      match: input.match,
      legal: legalFirstContacts(input.match, countGroups(this.balls)),
      level,
      canPlace: (spot) => {
        if (input.match.ballInHand === 'baulk' && spot.x > input.tableConfig.baulkLine) return false;
        return placeProbe.placeCueBall(spot.x, spot.y) === 'ok';
      },
    };
    this.queue = primaryCandidates(this.candidateInput).map((candidate) => ({ candidate, owner: null }));
  }

  get done(): boolean {
    return this.finished;
  }

  get steps(): number {
    return this.stepsUsed;
  }

  /** Candidates fully played out so far. */
  get evaluatedCount(): number {
    return this.evaluated;
  }

  /** Thinks for at most `maxSteps` physics steps. Returns true when finished. */
  work(maxSteps: number): boolean {
    let budget = maxSteps;
    while (!this.finished && budget > 0) {
      if (!this.current && !this.startNext()) {
        this.finished = true;
        break;
      }
      const ev = this.current!;
      while (ev.sim.isMoving && budget > 0 && this.stepsUsed < this.level.maxSteps) {
        ev.sim.step();
        budget -= 1;
        this.stepsUsed += 1;
      }
      if (!ev.sim.isMoving) {
        this.judge(ev);
        this.current = null;
      }
      if (this.stepsUsed >= this.level.maxSteps) this.finished = true;
    }
    return this.finished;
  }

  /**
   * The chosen shot with its error applied. May be called before thinking is finished (time limit):
   * the best shot found so far is used. The same planner always returns the same decision.
   */
  decision(): AiDecision {
    if (this.decided) return this.decided;
    this.finished = true;
    const best = this.bestOutcome();
    const chosen = best?.candidate ?? this.queue[0]?.candidate ?? null;
    const intended = chosen?.shot ?? FALLBACK_SHOT;
    this.decided = {
      place: chosen?.place ?? null,
      intended,
      shot: this.withError(intended),
      expected: best?.verdict ?? null,
      score: best ? effectiveScore(best) : AI_SCORES.foul,
    };
    return this.decided;
  }

  private startNext(): boolean {
    for (;;) {
      if (this.queue.length === 0) this.refillQueue();
      const job = this.queue.shift();
      if (!job) return false;
      const sim = this.copySim();
      const { place, shot } = job.candidate;
      if (place && sim.placeCueBall(place.x, place.y) !== 'ok') continue;
      const counts = countGroups(sim.balls);
      if (sim.strike(shot) !== 'ok') continue;
      this.current = { job, sim, counts };
      return true;
    }
  }

  /** After the main candidates: the direction sweep if nothing legal was found, then Hard's robustness check. */
  private refillQueue(): void {
    const best = this.bestOutcome();
    if (!this.sweepAdded && (!best || best.score <= AI_SCORES.foul)) {
      this.sweepAdded = true;
      this.queue.push(...sweepCandidates(this.candidateInput).map((candidate) => ({ candidate, owner: null })));
      return;
    }
    if (this.robustSet || this.level.robustTop <= 0) return;
    // Replay the best few with the aim nudged either way; a shot that only works when hit perfectly loses out.
    this.robustSet = [...this.outcomes]
      .filter((o) => o.score > AI_SCORES.foul)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.level.robustTop);
    const nudge = AI_SEARCH.robustSpread * this.level.aimError;
    for (const owner of this.robustSet) {
      for (const e of [nudge, -nudge]) {
        this.queue.push({ candidate: { ...owner.candidate, shot: turned(owner.candidate.shot, e) }, owner });
      }
    }
  }

  /** Best so far. Once the robustness check has started, only the shots in it compete, on their average score. */
  private bestOutcome(): Outcome | null {
    const pool = this.robustSet && this.robustSet.length > 0 ? this.robustSet : this.outcomes;
    let best: Outcome | null = null;
    // Ties keep the earlier (better-looking) candidate, so results do not depend on float noise.
    for (const o of pool) if (!best || effectiveScore(o) > effectiveScore(best)) best = o;
    return best;
  }

  private judge(ev: Evaluation): void {
    this.evaluated += 1;
    const result = resolveShot(this.input.match, summarizeShot(ev.sim.shotEvents(), ev.sim.balls), ev.counts);
    const score = this.score(result, ev);
    if (ev.job.owner) ev.job.owner.variantScores.push(score);
    else this.outcomes.push({ candidate: ev.job.candidate, score, verdict: result.verdict, variantScores: [] });
  }

  private score(result: ShotResult, ev: Evaluation): number {
    const shooter = this.input.match.current;
    const verdict = result.verdict;
    switch (verdict.kind) {
      case 'game-over':
        return verdict.winner === shooter ? AI_SCORES.win : AI_SCORES.loss;
      case 'rerack':
        return AI_SCORES.rerack;
      case 'foul':
        return AI_SCORES.foul;
      case 'continue': {
        const potted = ownBallsPotted(ev, result.state.groups[shooter] ?? null);
        let score = AI_SCORES.continue + AI_SCORES.perBallPotted * potted;
        if (this.level.positionPlay) score += AI_SCORES.position * this.nextEase(ev.sim, result.state);
        return score;
      }
      case 'turn-over': {
        let score = AI_SCORES.turnOver;
        if (this.level.positionPlay) score -= AI_SCORES.position * this.nextEase(ev.sim, result.state);
        return score;
      }
    }
  }

  /** How easy the next pot is for whoever plays next, from the table after the shot. */
  private nextEase(sim: PoolSimulation, next: MatchState): number {
    const cue = sim.cueBall;
    if (cue.pocketed) return 0;
    return bestEase(cue, sim.balls, sim.table, legalFirstContacts(next, countGroups(sim.balls)));
  }

  private withError(shot: Shot): Shot {
    const aimed = turned(shot, this.random.normal() * this.level.aimError);
    const power = shot.power * (1 + this.random.normal() * this.level.powerError);
    return { ...aimed, power: power < 0 ? 0 : power > 1 ? 1 : power };
  }

  private copySim(): PoolSimulation {
    return new PoolSimulation(this.input.table, this.input.physics, this.balls.map((b) => ({ ...b })));
  }
}

/** The shot's direction turned by a small angle (radians): add a sideways part and renormalise, no trigonometry. */
function turned(shot: Shot, angle: number): Shot {
  const d = shot.direction;
  const x = d.x - d.y * angle;
  const y = d.y + d.x * angle;
  const len = Math.sqrt(x * x + y * y);
  return { ...shot, direction: { x: x / len, y: y / len } };
}

function effectiveScore(o: Outcome): number {
  if (o.variantScores.length === 0) return o.score;
  let sum = o.score;
  for (const v of o.variantScores) sum += v;
  return sum / (o.variantScores.length + 1);
}

function ownBallsPotted(ev: Evaluation, group: 'red' | 'yellow' | null): number {
  const after = countGroups(ev.sim.balls);
  if (group) return ev.counts[group] - after[group];
  return ev.counts.red - after.red + ev.counts.yellow - after.yellow;
}

