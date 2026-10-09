import { describe, expect, it } from 'vitest';
import { renderSound, type SoundRecipe } from '../src/synth';

const CLICK: SoundRecipe = {
  seconds: 0.05,
  peak: 0.8,
  layers: [
    { kind: 'tone', startHz: 2000, endHz: 1800, decay: 0.01, level: 1 },
    { kind: 'noise', cutoffHz: 5000, decay: 0.004, level: 0.6 },
  ],
};

describe('synth', () => {
  it('renders the requested length, peaks exactly at the requested level and ends silent', () => {
    const s = renderSound(CLICK, 44_100, 1);
    expect(s.length).toBe(Math.round(0.05 * 44_100));
    const peak = s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(peak).toBeCloseTo(0.8, 5);
    expect(s[s.length - 1]).toBe(0);
  });

  it('is the same every time for the same seed, and noise differs with another seed', () => {
    expect(renderSound(CLICK, 22_050, 7)).toEqual(renderSound(CLICK, 22_050, 7));
    expect(renderSound(CLICK, 22_050, 7)).not.toEqual(renderSound(CLICK, 22_050, 8));
  });

  it('a recipe with no layers is silent, not NaN', () => {
    const s = renderSound({ seconds: 0.01, peak: 0.8, layers: [] }, 8000, 1);
    expect(s.every((v) => v === 0)).toBe(true);
  });

  it('rejects a bad sample rate or length', () => {
    expect(() => renderSound(CLICK, 0, 1)).toThrow();
    expect(() => renderSound({ ...CLICK, seconds: 0 }, 8000, 1)).toThrow();
  });
});
