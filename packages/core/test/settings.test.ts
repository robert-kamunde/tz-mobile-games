import { describe, expect, it } from 'vitest';
import { createSettingsSlot, defaultSettings, MemoryStore, validateSettings } from '../src';

describe('settings', () => {
  it('defaults to Kiswahili', () => {
    expect(defaultSettings().locale).toBe('sw');
  });

  it('round-trips through a save slot, namespaced per game', () => {
    const store = new MemoryStore();
    const slot = createSettingsSlot('pool', store);
    slot.save({ locale: 'en', soundVolume: 0.5, musicVolume: 0 });
    expect(store.get('pool.settings')).not.toBeNull();
    expect(createSettingsSlot('pool', store).load().data).toEqual({ locale: 'en', soundVolume: 0.5, musicVolume: 0 });
    expect(createSettingsSlot('daladala', store).load().outcome).toBe('missing');
  });

  it.each([
    [{ locale: 'fr', soundVolume: 1, musicVolume: 1 }],
    [{ locale: 'sw', soundVolume: 2, musicVolume: 1 }],
    [{ locale: 'sw', soundVolume: Number.NaN, musicVolume: 1 }],
    [{ locale: 'sw', soundVolume: 1 }],
    [null],
  ])('rejects invalid settings %#', (raw) => {
    expect(validateSettings(raw)).toBeNull();
  });
});
