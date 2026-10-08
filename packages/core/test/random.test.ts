import { describe, expect, it } from 'vitest';
import { createRandom } from '../src/random';

describe('createRandom', () => {
  it('repeats the same sequence for the same seed and differs for another', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    const c = createRandom(43);
    const seqA = Array.from({ length: 5 }, () => a.next());
    expect(Array.from({ length: 5 }, () => b.next())).toEqual(seqA);
    expect(Array.from({ length: 5 }, () => c.next())).not.toEqual(seqA);
  });

  it('stays in [0, 1) and normal() has mean about 0 and spread about 1', () => {
    const r = createRandom(7);
    let min = 1;
    let max = 0;
    for (let i = 0; i < 10_000; i++) {
      const v = r.next();
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThan(1);
    const n = 20_000;
    let sum = 0;
    let sq = 0;
    for (let i = 0; i < n; i++) {
      const v = r.normal();
      sum += v;
      sq += v * v;
    }
    const mean = sum / n;
    expect(Math.abs(mean)).toBeLessThan(0.03);
    expect(Math.abs(sq / n - mean * mean - 1)).toBeLessThan(0.05);
  });

  it('rejects a non-finite seed', () => {
    expect(() => createRandom(Number.NaN)).toThrow();
  });
});
