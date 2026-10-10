import { createSaveSlot, type KeyValueStore, type Logger, type SaveSlot } from '@tzg/core';
import type { TableConfig } from '../config/table';
import { PROGRESS_VERSION, defaultProgress, validateProgress, type PoolProgress } from './progress';
import { TIPS_VERSION, defaultTips, validateTips, type PoolTips } from './tips';
import { SAVED_MATCH_VERSION, validateSavedMatch, type SavedMatch } from './savedMatch';

/** The pool game's save slots, under the game's key prefix (e.g. `pool.match`). */
export interface PoolSlots {
  /** The game in progress; loads null when there is none (or it was unreadable). */
  readonly match: SaveSlot<SavedMatch | null>;
  readonly progress: SaveSlot<PoolProgress>;
  readonly tips: SaveSlot<PoolTips>;
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
  };
}
