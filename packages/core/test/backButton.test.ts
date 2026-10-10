import { describe, expect, it } from 'vitest';
import { BackButton } from '../src';

describe('BackButton', () => {
  it('leaves the app when no screen handles the press', () => {
    let left = 0;
    const back = new BackButton(() => (left += 1));
    back.press();
    expect(left).toBe(1);
    expect(back.leaveCount).toBe(1);
  });

  it('asks the most recent handler first and stops at the first that handles it', () => {
    const calls: string[] = [];
    const back = new BackButton(() => calls.push('leave'));
    back.add(() => (calls.push('menu'), true));
    back.add(() => (calls.push('panel'), false));
    back.press();
    expect(calls).toEqual(['panel', 'menu']);
  });

  it('a removed handler is no longer asked, and removing twice is harmless', () => {
    const calls: string[] = [];
    const back = new BackButton(() => calls.push('leave'));
    const remove = back.add(() => (calls.push('table'), true));
    remove();
    remove();
    back.press();
    expect(calls).toEqual(['leave']);
  });

  it('a handler that throws is logged and does not leave the app', () => {
    const errors: string[] = [];
    const logger = { debug() {}, info() {}, warn() {}, error: (m: string) => errors.push(m), child() { return logger; } };
    let left = 0;
    const back = new BackButton(() => (left += 1), logger as never);
    back.add(() => {
      throw new Error('broken');
    });
    back.press();
    expect(left).toBe(0);
    expect(errors).toEqual(['back handler failed']);
  });
});
