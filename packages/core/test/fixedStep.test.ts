import { describe, expect, it } from 'vitest';
import { FixedStepper } from '../src';

describe('FixedStepper', () => {
  const make = () => new FixedStepper({ stepMs: 10, maxStepsPerFrame: 5 });

  it('runs whole steps and carries the remainder', () => {
    const s = make();
    let n = 0;
    expect(s.advance(25, () => n++)).toEqual({ steps: 2, alpha: 0.5, droppedMs: 0 });
    expect(s.advance(5, () => n++).steps).toBe(1);
    expect(n).toBe(3);
  });

  it('produces the same total steps regardless of frame rate', () => {
    const count = (frameMs: number, frames: number) => {
      const s = make();
      let n = 0;
      for (let i = 0; i < frames; i++) s.advance(frameMs, () => n++);
      return n;
    };
    expect(count(1000 / 30, 30)).toBe(count(1000 / 120, 120));
  });

  it('caps steps per frame and drops the excess after a long stall', () => {
    const s = make();
    const r = s.advance(1000, () => {});
    expect(r.steps).toBe(5);
    expect(r.droppedMs).toBe(950);
    expect(s.advance(0, () => {}).steps).toBe(0);
  });

  it('ignores negative and non-finite frame times', () => {
    const s = make();
    for (const bad of [-5, Number.NaN, Number.POSITIVE_INFINITY]) expect(s.advance(bad, () => {}).steps).toBe(0);
  });

  it('reset discards pending time', () => {
    const s = make();
    s.advance(9, () => {});
    s.reset();
    expect(s.advance(2, () => {}).steps).toBe(0);
  });

  it('rejects invalid configuration', () => {
    expect(() => new FixedStepper({ stepMs: 0, maxStepsPerFrame: 1 })).toThrow();
    expect(() => new FixedStepper({ stepMs: 10, maxStepsPerFrame: 0 })).toThrow();
  });
});
