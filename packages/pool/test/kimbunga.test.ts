import { describe, expect, it } from 'vitest';
import { isKimbunga } from '../src/rules/kimbunga';
import { defaultProgress, recordGame, validateProgress } from '../src/progress/progress';
import type { Opponent } from '../src/progress/opponent';

const computer: Opponent = { kind: 'computer', level: 'easy' };
const friend: Opponent = { kind: 'human' };

describe('Kimbunga', () => {
  it('is the breaker winning before the other player shot', () => {
    expect(isKimbunga({ winner: 0, breaker: 0, shotsBy: [5, 0], opponent: computer })).toBe(true);
    expect(isKimbunga({ winner: 0, breaker: 0, shotsBy: [5, 1], opponent: computer })).toBe(false);
  });

  it('counts for either player in a two-player game', () => {
    expect(isKimbunga({ winner: 1, breaker: 1, shotsBy: [0, 7], opponent: friend })).toBe(true);
    expect(isKimbunga({ winner: 0, breaker: 0, shotsBy: [3, 0], opponent: friend })).toBe(true);
  });

  it('never when the computer does it to the person', () => {
    expect(isKimbunga({ winner: 1, breaker: 1, shotsBy: [0, 6], opponent: computer })).toBe(false);
  });

  it('never for the player who did not break, or when the shots are not known (an older save)', () => {
    expect(isKimbunga({ winner: 1, breaker: 0, shotsBy: [1, 4], opponent: friend })).toBe(false);
    expect(isKimbunga({ winner: 0, breaker: 0, shotsBy: null, opponent: computer })).toBe(false);
  });

  it('is counted in the progress, and an older save starts from none', () => {
    const once = recordGame(defaultProgress(), computer, 0, true);
    expect(once.kimbunga).toBe(1);
    expect(once.vsComputer.easy).toEqual({ played: 1, won: 1 });
    expect(recordGame(once, friend, 1, true).kimbunga).toBe(2);
    expect(recordGame(once, computer, 0).kimbunga).toBe(1);
    const { kimbunga: _, ...older } = once;
    expect(validateProgress(older)?.kimbunga).toBe(0);
    expect(validateProgress(once)?.kimbunga).toBe(1);
  });
});
