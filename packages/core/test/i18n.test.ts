import { describe, expect, it } from 'vitest';
import { createTranslator, findMissingKeys, isLocale, type StringTables } from '../src';

const tables: StringTables = {
  sw: { play: 'Cheza', score: 'Alama: {points}', onlySw: 'x' },
  en: { play: 'Play', score: 'Score: {points}', onlyEn: 'English only' },
};

describe('translator', () => {
  it('defaults to Kiswahili', () => {
    expect(createTranslator(tables).t('play')).toBe('Cheza');
  });

  it('switches locale', () => {
    const tr = createTranslator(tables);
    tr.setLocale('en');
    expect(tr.t('play')).toBe('Play');
  });

  it('fills placeholders and leaves unknown ones intact', () => {
    const tr = createTranslator(tables);
    expect(tr.t('score', { points: 40 })).toBe('Alama: 40');
    expect(tr.t('score')).toBe('Alama: {points}');
    expect(tr.t('score', { other: 1 })).toBe('Alama: {points}');
  });

  it('falls back to English, then to the key', () => {
    const tr = createTranslator(tables);
    expect(tr.t('onlyEn')).toBe('English only');
    expect(tr.t('nope')).toBe('nope');
  });

  it('ignores unsupported locales', () => {
    const tr = createTranslator(tables);
    tr.setLocale('fr' as never);
    expect(tr.locale).toBe('sw');
    expect(isLocale('fr')).toBe(false);
  });

  it('finds keys missing from each locale', () => {
    expect(findMissingKeys(tables)).toEqual({ sw: ['onlyEn'], en: ['onlySw'] });
  });
});
