import { describe, expect, it } from 'vitest';
import { createSaveSlot, MemoryStore, createWebStore, type KeyValueStore } from '../src';

interface Stats {
  played: number;
}

const validate = (raw: unknown): Stats | null =>
  typeof raw === 'object' && raw !== null && Number.isInteger((raw as Stats).played) && (raw as Stats).played >= 0
    ? { played: (raw as Stats).played }
    : null;

function slot(store: KeyValueStore, version = 2, migrations?: Record<number, (raw: unknown) => unknown>) {
  return createSaveSlot<Stats>({ key: 'k', version, defaults: () => ({ played: 0 }), validate, store, ...(migrations ? { migrations } : {}) });
}

describe('createSaveSlot', () => {
  it('round-trips data', () => {
    const store = new MemoryStore();
    expect(slot(store).save({ played: 3 })).toBe(true);
    expect(slot(store).load()).toEqual({ data: { played: 3 }, outcome: 'loaded' });
  });

  it('returns defaults when nothing is stored', () => {
    expect(slot(new MemoryStore()).load()).toEqual({ data: { played: 0 }, outcome: 'missing' });
  });

  it.each([
    ['not json', '{oops', 'corrupt'],
    ['no envelope', '{"played":3}', 'corrupt'],
    ['null', 'null', 'corrupt'],
    ['invalid payload', '{"v":2,"data":{"played":-1}}', 'invalid'],
    ['wrong type', '{"v":2,"data":"x"}', 'invalid'],
    ['newer version', '{"v":9,"data":{"played":1}}', 'unsupported-version'],
  ])('falls back to defaults on %s', (_name, text, outcome) => {
    const store = new MemoryStore();
    store.set('k', text);
    expect(slot(store).load()).toEqual({ data: { played: 0 }, outcome });
  });

  it('migrates step by step from an older version', () => {
    const store = new MemoryStore();
    store.set('k', '{"v":0,"data":{"games":4}}');
    const migrations = {
      0: (raw: unknown) => ({ count: (raw as { games: number }).games }),
      1: (raw: unknown) => ({ played: (raw as { count: number }).count }),
    };
    expect(slot(store, 2, migrations).load()).toEqual({ data: { played: 4 }, outcome: 'migrated' });
  });

  it('discards data when a migration step is missing', () => {
    const store = new MemoryStore();
    store.set('k', '{"v":0,"data":{"played":4}}');
    expect(slot(store, 2, { 1: (raw) => raw }).load().outcome).toBe('unsupported-version');
  });

  it('treats a throwing migration as invalid data', () => {
    const store = new MemoryStore();
    store.set('k', '{"v":1,"data":{}}');
    expect(slot(store, 2, { 1: () => { throw new Error('bad'); } }).load().outcome).toBe('invalid');
  });

  it('reports a failed write instead of throwing', () => {
    const failing: KeyValueStore = { get: () => null, set: () => false, remove: () => {} };
    expect(slot(failing).save({ played: 1 })).toBe(false);
  });
});

describe('createWebStore', () => {
  it('never throws when storage access fails', () => {
    const throwing = {
      getItem() { throw new Error('denied'); },
      setItem() { throw new Error('quota'); },
      removeItem() { throw new Error('denied'); },
    } as unknown as Storage;
    const store = createWebStore(() => throwing);
    expect(store.get('a')).toBeNull();
    expect(store.set('a', 'b')).toBe(false);
    expect(() => store.remove('a')).not.toThrow();
  });

  it('handles storage that cannot even be obtained', () => {
    const store = createWebStore(() => { throw new Error('SecurityError'); });
    expect(store.get('a')).toBeNull();
    expect(store.set('a', 'b')).toBe(false);
  });
});
