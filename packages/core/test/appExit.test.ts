import { describe, expect, it } from 'vitest';
import { AppExit } from '../src/appExit';

describe('AppExit', () => {
  it('saves first, then closes', () => {
    const calls: string[] = [];
    const exit = new AppExit(true, () => calls.push('prepare'), () => calls.push('close'));
    exit.exit();
    expect(calls).toEqual(['prepare', 'close']);
    expect(exit.exitCount).toBe(1);
  });

  it('does nothing where the game cannot close itself (a web page)', () => {
    const calls: string[] = [];
    const exit = new AppExit(false, () => calls.push('prepare'), () => calls.push('close'));
    exit.exit();
    expect(calls).toEqual([]);
    expect(exit.exitCount).toBe(0);
  });

  it('still closes if saving fails', () => {
    let closed = false;
    const exit = new AppExit(true, () => { throw new Error('storage full'); }, () => { closed = true; });
    exit.exit();
    expect(closed).toBe(true);
  });
});
