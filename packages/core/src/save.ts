import type { KeyValueStore } from './storage';
import type { Logger } from './logger';
import { silentLogger } from './logger';

/**
 * A versioned, corruption-tolerant save slot.
 *
 * Stored shape: {"v": <schemaVersion>, "data": <payload>}.
 * Loading never throws. Missing, unparseable, invalid or un-migratable data falls back to defaults,
 * and the reason is reported so it can be logged or surfaced in debugging.
 */
export interface SaveSlotOptions<T> {
  key: string;
  version: number;
  defaults: () => T;
  /** Returns the payload if it is a valid T, otherwise null. Must not trust its input. */
  validate: (raw: unknown) => T | null;
  /**
   * Upgrades a payload from an older schema version, one step at a time.
   * Keyed by the version being migrated FROM. Missing step = data is discarded.
   */
  migrations?: Record<number, (raw: unknown) => unknown>;
  store: KeyValueStore;
  logger?: Logger;
}

export type LoadOutcome = 'loaded' | 'migrated' | 'missing' | 'corrupt' | 'invalid' | 'unsupported-version';

export interface LoadResult<T> {
  data: T;
  outcome: LoadOutcome;
}

export interface SaveSlot<T> {
  load(): LoadResult<T>;
  save(data: T): boolean;
  clear(): void;
}

interface Envelope {
  v: number;
  data: unknown;
}

function isEnvelope(value: unknown): value is Envelope {
  return typeof value === 'object' && value !== null && Number.isInteger((value as Envelope).v) && 'data' in value;
}

export function createSaveSlot<T>(options: SaveSlotOptions<T>): SaveSlot<T> {
  const { key, version, defaults, validate, store, migrations = {} } = options;
  const logger = options.logger ?? silentLogger;

  const fallback = (outcome: LoadOutcome, detail?: unknown): LoadResult<T> => {
    if (outcome !== 'missing') logger.warn(`save "${key}" ${outcome}; using defaults`, detail);
    return { data: defaults(), outcome };
  };

  return {
    load() {
      const text = store.get(key);
      if (text === null) return fallback('missing');

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        return fallback('corrupt', error);
      }
      if (!isEnvelope(parsed)) return fallback('corrupt', 'missing envelope');

      let payload = parsed.data;
      let from = parsed.v;
      if (from > version) return fallback('unsupported-version', { stored: from, supported: version });

      const migrated = from < version;
      while (from < version) {
        const step = migrations[from];
        if (!step) return fallback('unsupported-version', { stored: parsed.v, missingStep: from });
        try {
          payload = step(payload);
        } catch (error) {
          return fallback('invalid', error);
        }
        from += 1;
      }

      const valid = validate(payload);
      if (valid === null) return fallback('invalid');
      return { data: valid, outcome: migrated ? 'migrated' : 'loaded' };
    },

    save(data) {
      const envelope: Envelope = { v: version, data };
      const ok = store.set(key, JSON.stringify(envelope));
      if (!ok) logger.warn(`save "${key}" could not be written`);
      return ok;
    },

    clear() {
      store.remove(key);
    },
  };
}
