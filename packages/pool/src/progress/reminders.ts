import { REMINDERS } from '../config/reminders';
import { STORY, STORY_STOPS } from '../config/story';
import type { SavedMatch } from './savedMatch';
import { characterById, isNeedMet, isStopOpen, stopRival, storyStop, type Played } from './story';

/** The player's reminder choices and when reminders were set, saved as `pool.reminders`. */
export interface ReminderPrefs {
  /** The Settings switch; on by default (nothing is shown until the phone allows it). */
  readonly on: boolean;
  /** Whether the player was already asked to allow notifications (once, after a first win). */
  readonly asked: boolean;
  /** When the last reminder was due to show (ms), for the gap between reminders. */
  readonly lastShown: number | null;
  /** When the reminder set on leaving is due (ms); null when none is waiting. */
  readonly waiting: number | null;
}

export const REMINDERS_VERSION = 1;

export function defaultReminderPrefs(): ReminderPrefs {
  return { on: true, asked: false, lastShown: null, waiting: null };
}

const time = (v: unknown): v is number | null => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0);

export function validateReminderPrefs(raw: unknown): ReminderPrefs | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.on !== 'boolean' || typeof r.asked !== 'boolean' || !time(r.lastShown) || !time(r.waiting)) return null;
  return { on: r.on, asked: r.asked, lastShown: r.lastShown, waiting: r.waiting };
}

const HOUR_MS = 3_600_000;

/**
 * When a reminder set now should show: at least `awayHours` from now and `gapHours` after the last
 * one shown, at the next `hour` o'clock (local time) after that.
 */
export function reminderTime(now: Date, lastShown: number | null): Date {
  const earliest = Math.max(now.getTime() + REMINDERS.awayHours * HOUR_MS, lastShown === null ? 0 : lastShown + REMINDERS.gapHours * HOUR_MS);
  const at = new Date(earliest);
  at.setHours(REMINDERS.hour, 0, 0, 0);
  if (at.getTime() < earliest) at.setDate(at.getDate() + 1);
  return at;
}

/** Coming back: a reminder whose time has passed counts as shown; any other is dropped. */
export function afterReturn(prefs: ReminderPrefs, now: Date): ReminderPrefs {
  if (prefs.waiting === null) return prefs;
  return { ...prefs, waiting: null, lastShown: prefs.waiting <= now.getTime() ? prefs.waiting : prefs.lastShown };
}

/** What the reminder is about, most useful first. */
export type ReminderPick =
  | { readonly kind: 'storyGame'; readonly place: string; readonly rival: string }
  | { readonly kind: 'quickGame' }
  | { readonly kind: 'unlock'; readonly look: 'table' | 'cue' | 'background'; readonly id: string; readonly wins: number }
  | { readonly kind: 'nextStop'; readonly place: string; readonly rival: string }
  | { readonly kind: 'play' };

export interface ReminderState {
  readonly played: Played;
  readonly storyGame: SavedMatch | null;
  readonly quickGame: SavedMatch | null;
}

/**
 * An unfinished story game, then an unfinished Quick game, then a look one or two wins away, then
 * the next stop of a journey under way, else an invitation to play.
 */
export function pickReminder(state: ReminderState): ReminderPick {
  const { played, storyGame, quickGame } = state;
  const person = played.story.character;
  const stop = storyGame?.story ? storyStop(storyGame.story.stop) : undefined;
  if (stop) return { kind: 'storyGame', place: stop.place, rival: characterById(stopRival(stop, person ?? ''))!.name };
  if (quickGame) return { kind: 'quickGame' };
  for (const r of STORY.rewards) {
    const left = r.need.wins === undefined ? Infinity : r.need.wins - played.wins;
    if (left > 0 && left <= REMINDERS.closeWins && !isNeedMet(played, r.need)) return { kind: 'unlock', look: r.kind, id: r.id, wins: left };
  }
  if (person) {
    const next = STORY_STOPS.find((s) => isStopOpen(played.story, s.id) && !(played.story.stars[s.id] ?? 0));
    if (next) return { kind: 'nextStop', place: next.place, rival: characterById(stopRival(next, person))!.name };
  }
  return { kind: 'play' };
}
