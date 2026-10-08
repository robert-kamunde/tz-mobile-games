import { AI_SEARCH, type AiLevelConfig } from '../config/ai';
import type { PhysicsConfig } from '../config/physics';
import type { TableConfig } from '../config/table';
import { computeAimGuide } from '../physics/aim';
import type { Ball, BallKind, Shot, TableGeometry, Vec2 } from '../physics/types';
import type { MatchState } from '../rules/blackball';
import { easeOf, findPotLines, pathIsClear, powerForSpeed, speedToPot, unit } from './potLines';

/** A shot the AI might play, with where to put the cue ball first when it has ball in hand. */
export interface Candidate {
  readonly place: Vec2 | null;
  readonly shot: Shot;
  /** How promising it looks before it is played out; higher is tried first. */
  readonly prior: number;
}

export interface CandidateInput {
  readonly balls: readonly Ball[];
  readonly cue: Ball;
  readonly table: TableGeometry;
  readonly tableConfig: TableConfig;
  readonly physics: PhysicsConfig;
  readonly match: MatchState;
  /** Kinds the shooter may hit first. */
  readonly legal: readonly BallKind[];
  readonly level: AiLevelConfig;
  /** True if the cue ball may be put at this spot (free cloth, and behind the baulk line when required). */
  readonly canPlace: (spot: Vec2) => boolean;
}

/** Pots come first; contacts rank below every pot. */
const CONTACT_PRIOR_SCALE = 1e-3;

function strike(direction: Vec2, speed: number, physics: PhysicsConfig): Shot {
  return { direction, power: powerForSpeed(speed, physics), side: 0, height: 0 };
}

function cueAt(cue: Ball, spot: Vec2 | null): Ball {
  return spot ? { ...cue, x: spot.x, y: spot.y, pocketed: false } : cue;
}

/** The candidates worth playing out, best-looking first, at most the level's maxCandidates. */
export function primaryCandidates(input: CandidateInput): Candidate[] {
  if (input.match.phase === 'break') return breakCandidates(input);
  const spots: (Vec2 | null)[] = input.match.ballInHand ? ballInHandSpots(input) : [null];
  const pots: Candidate[] = [];
  const contacts: Candidate[] = [];
  for (const spot of spots) {
    const cue = cueAt(input.cue, spot);
    for (const line of findPotLines(cue, input.balls, input.table, input.legal)) {
      const base = speedToPot(line, input.physics);
      for (const factor of input.level.speedFactors) {
        pots.push({ place: spot, shot: strike(line.direction, base * factor, input.physics), prior: line.ease });
      }
    }
    contacts.push(...contactCandidates(input, cue, spot));
  }
  const byPrior = (a: Candidate, b: Candidate) => b.prior - a.prior;
  const reserve = Math.min(AI_SEARCH.contactReserve, contacts.length);
  const chosenPots = pots.sort(byPrior).slice(0, input.level.maxCandidates - reserve);
  const chosenContacts = contacts.sort(byPrior).slice(0, input.level.maxCandidates - chosenPots.length);
  return [...chosenPots, ...chosenContacts];
}

/** Straight at the middle of each legal ball the cue ball can reach directly. */
function contactCandidates(input: CandidateInput, cue: Ball, spot: Vec2 | null): Candidate[] {
  const out: Candidate[] = [];
  for (const target of input.balls) {
    if (target.pocketed || target.id === cue.id || !input.legal.includes(target.kind)) continue;
    const { dir, length } = unit(cue, target);
    const guide = computeAimGuide(cue, dir, input.balls, input.table.cushions, input.table.pockets, length);
    if (guide?.target.type !== 'ball' || guide.target.ballId !== target.id) continue;
    const prior = CONTACT_PRIOR_SCALE / (1 + length);
    for (const speed of AI_SEARCH.contactSpeeds) out.push({ place: spot, shot: strike(dir, speed, input.physics), prior });
  }
  return out;
}

/** Evenly spread directions from where the cue ball is: the last resort when nothing else is legal. */
export function sweepCandidates(input: CandidateInput): Candidate[] {
  const n = AI_SEARCH.sweepDirections;
  const perSide = n / 4;
  const out: Candidate[] = [];
  // Points around a square centred on the cue ball give spread-out directions without trigonometry.
  for (let i = 0; i < perSide; i++) {
    const t = -1 + (2 * i) / perSide;
    for (const p of [{ x: 1, y: t }, { x: -t, y: 1 }, { x: -1, y: -t }, { x: t, y: -1 }]) {
      const { dir } = unit({ x: 0, y: 0 }, p);
      out.push({ place: null, shot: strike(dir, AI_SEARCH.sweepSpeed, input.physics), prior: 0 });
    }
  }
  return out;
}

/** Hard at the nearest ball of the rack from a few spots behind the baulk line, with small aim offsets. */
function breakCandidates(input: CandidateInput): Candidate[] {
  const out: Candidate[] = [];
  const centreY = input.tableConfig.playWidth / 2;
  for (const offsetY of AI_SEARCH.breakSpots) {
    const spot = { x: input.cue.x, y: centreY + offsetY };
    if (!input.canPlace(spot)) continue;
    const cue = cueAt(input.cue, spot);
    let apex: Ball | null = null;
    let apexDistance = Infinity;
    for (const b of input.balls) {
      if (b.pocketed || b.id === cue.id || !input.legal.includes(b.kind)) continue;
      const d = unit(cue, b).length;
      if (d < apexDistance) {
        apex = b;
        apexDistance = d;
      }
    }
    if (!apex) continue;
    const toApex = unit(cue, apex).dir;
    const across = { x: -toApex.y, y: toApex.x };
    for (const offset of AI_SEARCH.breakOffsets) {
      const aimPoint = { x: apex.x + across.x * offset * apex.radius, y: apex.y + across.y * offset * apex.radius };
      for (const speed of AI_SEARCH.breakSpeeds) {
        out.push({ place: spot, shot: strike(unit(cue, aimPoint).dir, speed, input.physics), prior: 1 });
      }
    }
  }
  return out.slice(0, input.level.maxCandidates);
}

/**
 * Ball-in-hand spots: straight behind the ghost ball of each clear pot, at a couple of distances.
 * Ranked by how easy that straight pot is; at most the level's placementSpots.
 */
export function ballInHandSpots(input: CandidateInput): Vec2[] {
  const ranked: { spot: Vec2; ease: number }[] = [];
  const r = input.cue.radius;
  for (const target of input.balls) {
    if (target.pocketed || target.id === input.cue.id || !input.legal.includes(target.kind)) continue;
    for (const pocket of input.table.pockets) {
      const toPocket = unit(target, pocket.center);
      if (!pathIsClear(target, pocket.center, target.radius, input.balls, [target.id, input.cue.id])) continue;
      const contact = r + target.radius;
      const ghost = { x: target.x - toPocket.dir.x * contact, y: target.y - toPocket.dir.y * contact };
      for (const distance of AI_SEARCH.placementDistances) {
        const spot = { x: ghost.x - toPocket.dir.x * distance, y: ghost.y - toPocket.dir.y * distance };
        if (!input.canPlace(spot)) continue;
        if (!pathIsClear(spot, ghost, r, input.balls, [target.id, input.cue.id])) continue;
        ranked.push({ spot, ease: easeOf(1, distance, toPocket.length) });
      }
    }
  }
  ranked.sort((a, b) => b.ease - a.ease);
  const spots = ranked.slice(0, input.level.placementSpots).map((s) => s.spot);
  // Nothing clear: leave the cue ball where it is and rely on contacts and the sweep.
  return spots.length > 0 ? spots : [{ x: input.cue.x, y: input.cue.y }];
}
