import { AI_LEVEL_IDS, type AiLevel } from '../config/ai';

/** Who player 2 is: another person on the same phone, or the computer at a level. */
export type Opponent = { readonly kind: 'human' } | { readonly kind: 'computer'; readonly level: AiLevel };

/** Stable short id, also used to name the picker's buttons: two, easy, medium, hard. */
export function opponentId(o: Opponent): string {
  return o.kind === 'computer' ? o.level : 'two';
}

export const OPPONENTS: readonly Opponent[] = [{ kind: 'human' }, ...AI_LEVEL_IDS.map((level) => ({ kind: 'computer', level }) as const)];

/** Returns a valid Opponent read from untrusted data, or null. */
export function validateOpponent(raw: unknown): Opponent | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.kind === 'human') return { kind: 'human' };
  if (r.kind === 'computer' && AI_LEVEL_IDS.includes(r.level as AiLevel)) return { kind: 'computer', level: r.level as AiLevel };
  return null;
}
