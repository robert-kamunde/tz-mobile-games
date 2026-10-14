import { STORY } from '../config/story';
import { earnedCharacters, earnedRewards, isNeedMet, type Played } from './story';

/**
 * Unlocks announced to the player (0.35.0, Robert chose "Popup with extras", 2026-10-14). An unlock is
 * a key: `table:<id>`, `cue:<id>`, `background:<id>`, `character:<id>` or `title:<id>`.
 */
export type UnlockKind = 'table' | 'cue' | 'background' | 'character' | 'title';

export interface Unlock {
  readonly kind: UnlockKind;
  readonly id: string;
}

export interface UnlockState {
  /**
   * Unlocks already shown in the "Imefunguliwa!" popup. Null until first set: on a phone that played
   * before 0.35.0, everything earned by then counts as known, so no flood of old news.
   */
  readonly known: readonly string[] | null;
  /** Shown, but not yet looked at in its picker: marked MPYA (new) there. */
  readonly fresh: readonly string[];
}

export const UNLOCKS_VERSION = 1;

export function defaultUnlocks(): UnlockState {
  return { known: null, fresh: [] };
}

export const unlockKey = (u: Unlock): string => `${u.kind}:${u.id}`;

export function parseUnlock(key: string): Unlock {
  const at = key.indexOf(':');
  return { kind: key.slice(0, at) as UnlockKind, id: key.slice(at + 1) };
}

/** Everything earned so far: looks, characters and journey titles, in that order. */
export function earnedUnlocks(played: Played): string[] {
  return [
    ...earnedRewards(played),
    ...earnedCharacters(played).map((id) => unlockKey({ kind: 'character', id })),
    // Titles come from the journey alone; lowest first, as they are earned.
    ...[...STORY.titles]
      .reverse()
      .filter((t) => isNeedMet({ story: played.story, wins: 0 }, t.need))
      .map((t) => unlockKey({ kind: 'title', id: t.id })),
  ];
}

/** Sets `known` on the first run (0.35.0 or a new phone) to what is already earned. */
export function startUnlocks(state: UnlockState, played: Played): UnlockState {
  return state.known === null ? { ...state, known: earnedUnlocks(played) } : state;
}

/** Earned but not yet announced, oldest first. */
export function unannounced(state: UnlockState, played: Played): string[] {
  const known = new Set(state.known ?? earnedUnlocks(played));
  return earnedUnlocks(played).filter((key) => !known.has(key));
}

/** The popup for this unlock was closed: it is known, and a look or character is new in its picker. */
export function announce(state: UnlockState, key: string): UnlockState {
  const known = state.known ?? [];
  if (known.includes(key)) return state;
  const fresh = parseUnlock(key).kind === 'title' ? state.fresh : [...state.fresh, key];
  return { known: [...known, key], fresh };
}

/** Its picker was opened: the MPYA marks of that kind go. */
export function seenKind(state: UnlockState, kind: UnlockKind): UnlockState {
  const fresh = state.fresh.filter((key) => parseUnlock(key).kind !== kind);
  return fresh.length === state.fresh.length ? state : { ...state, fresh };
}

export function isFresh(state: UnlockState, kind: UnlockKind, id: string): boolean {
  return state.fresh.includes(unlockKey({ kind, id }));
}

export function hasFresh(state: UnlockState, kinds: readonly UnlockKind[]): boolean {
  return state.fresh.some((key) => kinds.includes(parseUnlock(key).kind));
}

const isKeyList = (v: unknown): v is string[] => Array.isArray(v) && v.every((k) => typeof k === 'string' && k.includes(':'));

export function validateUnlocks(raw: unknown): UnlockState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { known, fresh } = raw as Record<string, unknown>;
  if (known !== null && !isKeyList(known)) return null;
  if (!isKeyList(fresh)) return null;
  return { known, fresh };
}
