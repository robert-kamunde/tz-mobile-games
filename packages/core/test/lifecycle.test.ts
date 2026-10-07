import { describe, expect, it } from 'vitest';
import { AppLifecycle, Emitter, type LifecycleTarget } from '../src';

class FakeDoc implements LifecycleTarget {
  hidden = false;
  private readonly handlers = new Map<string, Set<() => void>>();
  addEventListener(type: string, fn: () => void) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(fn);
  }
  removeEventListener(type: string, fn: () => void) {
    this.handlers.get(type)?.delete(fn);
  }
  fire(type: string) {
    for (const fn of this.handlers.get(type) ?? []) fn();
  }
  count(type: string) {
    return this.handlers.get(type)?.size ?? 0;
  }
}

describe('AppLifecycle', () => {
  it('pauses and resumes on visibility changes, once each', () => {
    const doc = new FakeDoc();
    const win = new FakeDoc();
    const life = new AppLifecycle(doc, win);
    const events: string[] = [];
    life.on('pause', ({ reason }) => events.push(`pause:${reason}`));
    life.on('resume', ({ reason }) => events.push(`resume:${reason}`));

    doc.hidden = true;
    doc.fire('visibilitychange');
    win.fire('pagehide');
    doc.hidden = false;
    doc.fire('visibilitychange');
    doc.fire('visibilitychange');

    expect(events).toEqual(['pause:hidden', 'resume:visible']);
  });

  it('starts paused if the page is already hidden', () => {
    const doc = new FakeDoc();
    doc.hidden = true;
    expect(new AppLifecycle(doc, undefined).isPaused).toBe(true);
  });

  it('a throwing listener does not stop the others', () => {
    const doc = new FakeDoc();
    const life = new AppLifecycle(doc, undefined);
    let reached = false;
    life.on('pause', () => { throw new Error('boom'); });
    life.on('pause', () => { reached = true; });
    life.notifyPause('test');
    expect(reached).toBe(true);
  });

  it('dispose removes all DOM listeners', () => {
    const doc = new FakeDoc();
    const win = new FakeDoc();
    new AppLifecycle(doc, win).dispose();
    expect(doc.count('visibilitychange')).toBe(0);
    expect(win.count('pagehide')).toBe(0);
  });
});

describe('Emitter', () => {
  it('unsubscribe stops delivery', () => {
    const e = new Emitter<{ x: number }>();
    const got: number[] = [];
    const off = e.on('x', (v) => got.push(v));
    e.emit('x', 1);
    off();
    e.emit('x', 2);
    expect(got).toEqual([1]);
  });
});
