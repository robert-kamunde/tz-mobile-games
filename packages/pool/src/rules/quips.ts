import type { Random } from '@tzg/core';
import { QUIPS, QUIP_LINES, type QuipMoment } from '../config/quips';
import { opponentOf, type PlayerId, type ShotVerdict } from './blackball';

export interface Quip {
  /** Seat of the player who speaks. */
  readonly speaker: PlayerId;
  readonly moment: QuipMoment;
  /** Which of the character's lines for that moment. */
  readonly index: number;
}

/** Who could speak after a shot, and why: the shooter after a pot, the other player after a foul, the winner. */
export function quipMoment(shooter: PlayerId, verdict: ShotVerdict): { speaker: PlayerId; moment: QuipMoment } | null {
  switch (verdict.kind) {
    case 'continue':
      return { speaker: shooter, moment: 'pot' };
    case 'foul':
      return { speaker: opponentOf(shooter), moment: 'foul' };
    case 'game-over':
      return { speaker: verdict.winner, moment: 'win' };
    default:
      return null;
  }
}

/**
 * Decides whether a character says a line after a shot, and which. Not every pot or foul gets one,
 * a line is followed by a few quiet shots, and the same line is not said twice in a row.
 */
export class QuipChooser {
  private shotsSinceLine: number = QUIPS.quietShots;
  private lastKey = '';

  constructor(private readonly random: Random) {}

  afterShot(shooter: PlayerId, verdict: ShotVerdict, characterOf: (seat: PlayerId) => string): Quip | null {
    this.shotsSinceLine++;
    const at = quipMoment(shooter, verdict);
    if (!at) return null;
    if (at.moment !== 'win' && this.shotsSinceLine <= QUIPS.quietShots) return null;
    if (this.random.next() >= QUIPS.chance[at.moment]) return null;
    const character = characterOf(at.speaker);
    const lines = QUIP_LINES[character]?.[at.moment];
    if (!lines || lines.length === 0) return null;
    let index = Math.floor(this.random.next() * lines.length);
    if (lines.length > 1 && `${character}.${at.moment}.${index}` === this.lastKey) index = (index + 1) % lines.length;
    this.lastKey = `${character}.${at.moment}.${index}`;
    this.shotsSinceLine = 0;
    return { ...at, index };
  }
}
