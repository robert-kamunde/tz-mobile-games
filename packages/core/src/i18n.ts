import type { Logger } from './logger';
import { silentLogger } from './logger';

/** Kiswahili is the default language for both games (see docs/GAME_DESIGN.md). */
export const SUPPORTED_LOCALES = ['sw', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'sw';

export type StringTable = Readonly<Record<string, string>>;
export type StringTables = Readonly<Record<Locale, StringTable>>;
export type Params = Readonly<Record<string, string | number>>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export interface Translator {
  readonly locale: Locale;
  setLocale(locale: Locale): void;
  /** Returns the string for key, with {name} placeholders replaced. Falls back to English, then to the key itself. */
  t(key: string, params?: Params): string;
}

const PLACEHOLDER = /\{(\w+)\}/g;

export function createTranslator(tables: StringTables, initial: Locale = DEFAULT_LOCALE, logger: Logger = silentLogger): Translator {
  let locale: Locale = initial;
  const reportedMissing = new Set<string>();

  const lookup = (key: string): string => {
    const own = tables[locale][key];
    if (own !== undefined) return own;
    const reportKey = `${locale}:${key}`;
    if (!reportedMissing.has(reportKey)) {
      reportedMissing.add(reportKey);
      logger.warn(`missing string "${key}" for locale "${locale}"`);
    }
    return tables.en[key] ?? key;
  };

  return {
    get locale() {
      return locale;
    },
    setLocale(next) {
      if (!isLocale(next)) {
        logger.warn(`ignored unsupported locale "${String(next)}"`);
        return;
      }
      locale = next;
    },
    t(key, params) {
      const text = lookup(key);
      if (!params) return text;
      return text.replace(PLACEHOLDER, (match, name: string) => {
        const value = params[name];
        return value === undefined ? match : String(value);
      });
    },
  };
}

/** Lists keys present in one locale but missing in another. Used by tests so tables never drift apart. */
export function findMissingKeys(tables: StringTables): Record<Locale, string[]> {
  const all = new Set<string>();
  for (const locale of SUPPORTED_LOCALES) for (const key of Object.keys(tables[locale])) all.add(key);
  const result = {} as Record<Locale, string[]>;
  for (const locale of SUPPORTED_LOCALES) {
    result[locale] = [...all].filter((key) => !(key in tables[locale])).sort();
  }
  return result;
}
