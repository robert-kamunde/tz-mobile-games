import { DEFAULT_LOCALE, isLocale, type Locale } from './i18n';
import { createSaveSlot, type SaveSlot } from './save';
import type { KeyValueStore } from './storage';
import type { Logger } from './logger';

/** Player settings shared by both games. Each game stores its own copy under its own key prefix. */
export interface Settings {
  locale: Locale;
  /** 0..1 */
  soundVolume: number;
  /** 0..1 */
  musicVolume: number;
}

export const SETTINGS_SCHEMA_VERSION = 1;

export function defaultSettings(): Settings {
  return { locale: DEFAULT_LOCALE, soundVolume: 1, musicVolume: 0.7 };
}

function isVolume(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validateSettings(raw: unknown): Settings | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!isLocale(r.locale) || !isVolume(r.soundVolume) || !isVolume(r.musicVolume)) return null;
  return { locale: r.locale, soundVolume: r.soundVolume, musicVolume: r.musicVolume };
}

export function createSettingsSlot(gameId: string, store: KeyValueStore, logger?: Logger): SaveSlot<Settings> {
  return createSaveSlot<Settings>({
    key: `${gameId}.settings`,
    version: SETTINGS_SCHEMA_VERSION,
    defaults: defaultSettings,
    validate: validateSettings,
    store,
    ...(logger ? { logger } : {}),
  });
}
