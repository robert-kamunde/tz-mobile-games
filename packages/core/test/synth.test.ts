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

  it('a delayed layer is silent until its start, and an attack starts it softly', () => {
    const rate = 8000;
    const s = renderSound({ seconds: 0.1, peak: 1, layers: [{ kind: 'tone', startHz: 500, endHz: 500, decay: 0.05, level: 1, delay: 0.05 }] }, rate, 1);
    expect(s.slice(0, 0.05 * rate).every((v) => v === 0)).toBe(true);
    expect(s.slice(0.05 * rate).some((v) => v !== 0)).toBe(true);
    const hard = renderSound({ seconds: 0.05, peak: 1, layers: [{ kind: 'noise', cutoffHz: 3000, decay: 0.02, level: 1 }] }, rate, 1);
    const soft = renderSound({ seconds: 0.05, peak: 1, layers: [{ kind: 'noise', cutoffHz: 3000, decay: 0.02, level: 1, attack: 0.01 }] }, rate, 1);
    const early = (x: Float32Array) => x.slice(0, 0.002 * rate).reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(early(soft)).toBeLessThan(early(hard) / 2);
  });

  it('a high-pass on noise removes the low end, and a tremolo makes it wobble', () => {
    const rate = 22_050;
    const recipe = (extra: object): SoundRecipe => ({ seconds: 0.2, peak: 1, layers: [{ kind: 'noise', cutoffHz: 4000, decay: 10, level: 1, ...extra }] });
    // Mean over short windows tracks the low frequencies.
    const lowEnergy = (x: Float32Array) => {
      let sum = 0;
      for (let i = 0; i + 64 <= x.length; i += 64) sum += Math.abs(x.slice(i, i + 64).reduce((a, b) => a + b, 0) / 64);
      return sum;
    };
    expect(lowEnergy(renderSound(recipe({ highHz: 1500 }), rate, 3))).toBeLessThan(lowEnergy(renderSound(recipe({}), rate, 3)) / 2);
    const wobbly = renderSound(recipe({ tremoloHz: 10 }), rate, 3);
    // At 10 Hz the level dips to nothing every 0.1 s: around 0.075 s it is near silent.
    const near = wobbly.slice(Math.round(0.073 * rate), Math.round(0.077 * rate)).reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(near).toBeLessThan(0.05);
  });
});
