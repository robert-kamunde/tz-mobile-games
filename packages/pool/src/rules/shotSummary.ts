import { CUE_BALL_ID } from '../physics/rack';
import type { Ball, BallKind, ShotEvent } from '../physics/types';

/** What happened in one shot, in the terms the rules care about. */
export interface ShotSummary {
  /** Kind of the first ball the cue ball touched, or null if it touched none. */
  readonly firstContact: BallKind | null;
  /** Object balls potted this shot, in order (cue ball excluded). */
  readonly potted: readonly BallKind[];
  readonly cueBallPotted: boolean;
  /** True if any ball, cue ball included, reached a cushion after the first contact. */
  readonly cushionAfterContact: boolean;
  /** Distinct object balls that touched a cushion at any point (used to judge the break). */
  readonly objectBallsToCushion: number;
}

/** Turns the simulation's event log into a ShotSummary. Pure. */
export function summarizeShot(events: readonly ShotEvent[], balls: readonly Ball[]): ShotSummary {
  const kinds = new Map(balls.map((b) => [b.id, b.kind] as const));
  const kindOf = (id: number): BallKind => {
    const kind = kinds.get(id);
    if (!kind) throw new Error(`shot event refers to unknown ball ${id}`);
    return kind;
  };
  let firstContact: BallKind | null = null;
  let contactIndex = -1;
  const potted: BallKind[] = [];
  let cueBallPotted = false;
  let cushionAfterContact = false;
  const cushionBalls = new Set<number>();

  for (const [index, event] of events.entries()) {
    switch (event.type) {
      case 'ball':
        if (contactIndex < 0 && (event.a === CUE_BALL_ID || event.b === CUE_BALL_ID)) {
          const other = event.a === CUE_BALL_ID ? event.b : event.a;
          firstContact = kindOf(other);
          contactIndex = index;
        }
        break;
      case 'cushion':
        if (contactIndex >= 0) cushionAfterContact = true;
        if (event.ball !== CUE_BALL_ID) cushionBalls.add(event.ball);
        break;
      case 'pocket':
      case 'escaped':
        // An escaped ball is a physics bug that is logged elsewhere; for the rules it left the table like a pot.
        if (event.ball === CUE_BALL_ID) cueBallPotted = true;
        else potted.push(kindOf(event.ball));
        break;
      case 'timeout':
        break;
    }
  }

  return { firstContact, potted, cueBallPotted, cushionAfterContact, objectBallsToCushion: cushionBalls.size };
}
