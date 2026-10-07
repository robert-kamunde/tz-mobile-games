import type { Logger } from './logger';
import { silentLogger } from './logger';

/**
 * Minimal key-value persistence. Implementations must never throw:
 * storage can be unavailable (private mode, full disk, cleared WebView data).
 */
export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): boolean;
  remove(key: string): void;
}

export class MemoryStore implements KeyValueStore {
  private readonly data = new Map<string, string>();
  get(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  set(key: string, value: string): boolean {
    this.data.set(key, value);
    return true;
  }
  remove(key: string): void {
    this.data.delete(key);
  }
}

/** Wraps a Web Storage object (localStorage) so every failure becomes a logged, non-fatal result. */
export function createWebStore(getStorage: () => Storage | undefined, logger: Logger = silentLogger): KeyValueStore {
  const storage = (): Storage | undefined => {
    try {
      return getStorage();
    } catch (error) {
      logger.warn('storage unavailable', error);
      return undefined;
    }
  };
  return {
    get(key) {
      try {
        return storage()?.getItem(key) ?? null;
      } catch (error) {
        logger.warn(`read failed for "${key}"`, error);
        return null;
      }
    },
    set(key, value) {
      const s = storage();
      if (!s) return false;
      try {
        s.setItem(key, value);
        return true;
      } catch (error) {
        logger.warn(`write failed for "${key}"`, error);
        return false;
      }
    },
    remove(key) {
      try {
        storage()?.removeItem(key);
      } catch (error) {
        logger.warn(`remove failed for "${key}"`, error);
      }
    },
  };
}
