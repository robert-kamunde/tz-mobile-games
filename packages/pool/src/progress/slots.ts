import { createSaveSlot, type KeyValueStore, type Logger, type SaveSlot } from '@tzg/core';
import type { TableConfig } from '../config/table';
import { PROGRESS_VERSION, defaultProgress, validateProgress, type PoolProgress } from './progress';
import { TIPS_VERSION, defaultTips, validateTips, type PoolTips } from './tips';
import { SAVED_MATCH_VERSION, validateSavedMatch, type SavedMatch } from './savedMatch';
import { REMINDERS_VERSION, defaultReminderPrefs, validateReminderPrefs, type ReminderPrefs } from './reminders';
import { STORY_VERSION, defaultStory, validateStory, type StoryProgress } from './story';

/** The pool game's save slots, under the game's key prefix (e.g. `pool.match`). */
export interface PoolSlots {
  /** The Quick game in progress; loads null when there is none (or it was unreadable). */
  readonly match: SaveSlot<SavedMatch | null>;
  /**
   * The story game in progress, kept apart so a Quick game never replaces it (Robert, 2026-10-13).
   * Before 0.27.0 a story game was saved in `match`; `moveStoryGame` moves it here.
   */
  readonly storyMatch: SaveSlot<SavedMatch | null>;
  readonly progress: SaveSlot<PoolProgress>;
  readonly tips: SaveSlot<PoolTips>;
  /** Story mode: the journey's character and the stars won (0.24.0). */
  readonly story: SaveSlot<StoryProgress>;
  /** Play reminders: the Settings switch and when reminders were set (0.28.0). */
  readonly reminders: SaveSlot<ReminderPrefs>;
}

export function createPoolSlots(gameId: string, store: KeyValueStore, table: TableConfig, logger?: Logger): PoolSlots {
  const log = logger ? { logger } : {};
  return {
    match: createSaveSlot<SavedMatch | null>({
      key: `${gameId}.match`,
      version: SAVED_MATCH_VERSION,
      defaults: () => null,
      validate: (raw) => validateSavedMatch(raw, table),
      store,
      ...log,
    }),
    storyMatch: createSaveSlot<SavedMatch | null>({
      key: `${gameId}.storyMatch`,
      version: SAVED_MATCH_VERSION,
      defaults: () => null,
      // Only a story game belongs here.
      validate: (raw) => {
        const saved = validateSavedMatch(raw, table);
        return saved?.story ? saved : null;
      },
      store,
      ...log,
    }),
    progress: createSaveSlot<PoolProgress>({
      key: `${gameId}.progress`,
      version: PROGRESS_VERSION,
      defaults: defaultProgress,
      validate: validateProgress,
      store,
      ...log,
    }),
    tips: createSaveSlot<PoolTips>({
      key: `${gameId}.tips`,
      version: TIPS_VERSION,
      defaults: defaultTips,
      validate: validateTips,
      store,
      ...log,
    }),
    story: createSaveSlot<StoryProgress>({
      key: `${gameId}.story`,
      version: STORY_VERSION,
      defaults: defaultStory,
      validate: validateStory,
      store,
      ...log,
    }),
    reminders: createSaveSlot<ReminderPrefs>({
      key: `${gameId}.reminders`,
      version: REMINDERS_VERSION,
      defaults: defaultReminderPrefs,
      validate: validateReminderPrefs,
      store,
      ...log,
    }),
  };
}

/** A story game saved before 0.27.0 sits in the Quick game slot: moves it to its own slot. */
export function moveStoryGame(slots: PoolSlots): void {
  const saved = slots.match.load().data;
  if (!saved?.story) return;
  if (slots.storyMatch.load().data === null) slots.storyMatch.save(saved);
  slots.match.clear();
}
