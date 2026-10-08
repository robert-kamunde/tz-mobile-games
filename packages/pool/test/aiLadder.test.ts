import { describe, expect, it } from 'vitest';
import { AI_LEVEL_IDS, type AiLevel } from '../src/config/ai';
import { playAiGame } from './aiHarness';

/**
 * Strength ladder: each level plays the one below it over many games, breaking alternately.
 * Slow (minutes), so it runs only with `npm run ai:ladder -w @tzg/pool`; results go in TESTING.md.
 */
const GAMES = Number(process.env.AI_LADDER_GAMES ?? 20);

interface LevelStats {
  shots: number;
  fouls: number;
  pots: number;
  maxThinkSteps: number;
}

describe.runIf(process.env.AI_LADDER === '1')('AI strength ladder', () => {
  const pairs: [AiLevel, AiLevel][] = [];
  for (let i = 1; i < AI_LEVEL_IDS.length; i++) pairs.push([AI_LEVEL_IDS[i]!, AI_LEVEL_IDS[i - 1]!]);

  it.each(pairs)('%s beats %s more often than not', (stronger, weaker) => {
    let strongerWins = 0;
    let unfinished = 0;
    let totalShots = 0;
    const stats: Record<string, LevelStats> = {};
    for (const level of [stronger, weaker]) stats[level] = { shots: 0, fouls: 0, pots: 0, maxThinkSteps: 0 };
    for (let game = 0; game < GAMES; game++) {
      // Alternate who breaks so the break does not decide the ladder.
      const levels: [AiLevel, AiLevel] = game % 2 === 0 ? [stronger, weaker] : [weaker, stronger];
      const record = playAiGame(levels, game + 1);
      totalShots += record.shots;
      record.turns.forEach((turn, i) => {
        const s = stats[levels[turn.player]]!;
        s.shots += 1;
        if (turn.verdict.kind === 'foul') s.fouls += 1;
        if (turn.verdict.kind === 'continue') s.pots += 1;
        s.maxThinkSteps = Math.max(s.maxThinkSteps, record.thinkSteps[i]!);
      });
      if (record.winner === null) unfinished += 1;
      else if (levels[record.winner] === stronger) strongerWins += 1;
    }
    const summary = `${stronger} v ${weaker}: ${strongerWins}/${GAMES} wins for ${stronger}, ${unfinished} unfinished, ${(totalShots / GAMES).toFixed(1)} shots/game; ${JSON.stringify(stats)}`;
    console.log(summary);
    expect(unfinished).toBe(0);
    expect(strongerWins).toBeGreaterThan(GAMES / 2);
  }, 3_600_000);
});
