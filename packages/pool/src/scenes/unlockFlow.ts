import { isBackgroundId } from '../config/backgrounds';
import { isCueId } from '../config/cues';
import { isTableId } from '../config/tables';
import { computerWins } from '../progress/progress';
import type { PoolSlots } from '../progress/slots';
import type { Played } from '../progress/story';
import { announce, parseUnlock, seenKind, startUnlocks, unannounced, type UnlockKind } from '../progress/unlocks';
import type { UnlockPopup } from './UnlockPopup';

/** The journey and the wins so far, for what they unlock. */
export function playedSoFar(slots: PoolSlots): Played {
  return { story: slots.story.load().data, wins: computerWins(slots.progress.load().data) };
}

/** On a phone's first run of 0.35.0, counts what is already earned as announced. */
export function startUnlockTracking(slots: PoolSlots): void {
  const state = slots.unlocks.load().data;
  const started = startUnlocks(state, playedSoFar(slots));
  if (started !== state) slots.unlocks.save(started);
}

/**
 * Shows "Imefunguliwa!" for everything earned but not yet announced. Each closed popup is saved at
 * once (so an unlock is never shown twice, nor lost if the app closes first), and Tumia sasa puts the
 * look on. True when there was something to show.
 */
export function announceUnlocks(slots: PoolSlots, popup: UnlockPopup, done?: () => void): boolean {
  startUnlockTracking(slots);
  const keys = unannounced(slots.unlocks.load().data, playedSoFar(slots));
  popup.show(keys, {
    closed: (key, use) => {
      slots.unlocks.save(announce(slots.unlocks.load().data, key));
      if (use) useLook(slots, key);
    },
    ...(done ? { done } : {}),
  });
  return keys.length > 0;
}

function useLook(slots: PoolSlots, key: string): void {
  const { kind, id } = parseUnlock(key);
  const progress = slots.progress.load().data;
  if (kind === 'table' && isTableId(id)) slots.progress.save({ ...progress, table: id });
  if (kind === 'cue' && isCueId(id)) slots.progress.save({ ...progress, cue: id });
  if (kind === 'background' && isBackgroundId(id)) slots.progress.save({ ...progress, background: id });
}

/** The ids of a kind still marked MPYA, which are then counted as seen (their picker is opening). */
export function takeFresh(slots: PoolSlots, kind: UnlockKind): ReadonlySet<string> {
  const state = slots.unlocks.load().data;
  const ids = new Set(state.fresh.map(parseUnlock).filter((u) => u.kind === kind).map((u) => u.id));
  if (ids.size > 0) slots.unlocks.save(seenKind(state, kind));
  return ids;
}
