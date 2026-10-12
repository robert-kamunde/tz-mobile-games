import { createRandom, findMissingKeys, type Random } from '@tzg/core';
import { describe, expect, it } from 'vitest';
import { ALL_CHARACTERS } from '../src/config/characters';
import { QUIPS, QUIP_LINES, QUIP_MOMENTS, quipKey } from '../src/config/quips';
import { QuipChooser, quipMoment } from '../src/rules/quips';
import type { ShotVerdict } from '../src/rules/blackball';
import { poolStrings } from '../src/strings';


const POT: ShotVerdict = { kind: 'continue' };
const FOUL: ShotVerdict = { kind: 'foul', reason: 'no-contact' };
const characterOf = (seat: number) => (seat === 0 ? 'fundi' : 'mzee-kobe');

/** A random source that returns the given values in turn. */
function fixed(...values: number[]): Random {
  let i = 0;
  return { next: () => values[i++ % values.length]!, normal: () => 0 };
}

describe('catchphrases', () => {
  it.each(ALL_CHARACTERS.map((c) => c.id))('%s has a line for every moment, in both languages, short enough for the bubble', (id) => {
    for (const moment of QUIP_MOMENTS) {
      const lines = QUIP_LINES[id]![moment];
      expect(lines.length).toBeGreaterThan(0);
      lines.forEach((_, i) => {
        for (const locale of ['sw', 'en'] as const) {
          const text = poolStrings[locale][quipKey(id, moment, i)];
          expect(text?.trim()).toBeTruthy();
          expect(text!.length).toBeLessThanOrEqual(QUIPS.maxLength);
        }
      });
    }
  });

  it('has lines only for characters that exist, and the string tables still match', () => {
    expect(Object.keys(QUIP_LINES).sort()).toEqual(ALL_CHARACTERS.map((c) => c.id).sort());
    expect(findMissingKeys(poolStrings)).toEqual({ sw: [], en: [] });
  });

  it('the shooter speaks after a pot, the other player after a foul, the winner at the end, nobody otherwise', () => {
    expect(quipMoment(0, POT)).toEqual({ speaker: 0, moment: 'pot' });
    expect(quipMoment(0, FOUL)).toEqual({ speaker: 1, moment: 'foul' });
    expect(quipMoment(1, { kind: 'game-over', winner: 0, reason: 'black-potted-early' })).toEqual({ speaker: 0, moment: 'win' });
    expect(quipMoment(0, { kind: 'turn-over' })).toBeNull();
    expect(quipMoment(0, { kind: 'rerack' })).toBeNull();
  });

  it('speaks only at the configured chance', () => {
    expect(new QuipChooser(fixed(QUIPS.chance.pot)).afterShot(0, POT, characterOf)).toBeNull();
    expect(new QuipChooser(fixed(QUIPS.chance.pot - 0.01, 0)).afterShot(0, POT, characterOf)).toEqual({ speaker: 0, moment: 'pot', index: 0 });
    expect(new QuipChooser(fixed(0.999, 0)).afterShot(0, { kind: 'game-over', winner: 1, reason: 'black-potted' }, characterOf)).toEqual({ speaker: 1, moment: 'win', index: 0 });
  });

  it('stays quiet for a few shots after a line, except for a win, and does not repeat a line straight away', () => {
    const chooser = new QuipChooser(fixed(0));
    expect(chooser.afterShot(0, POT, characterOf)).toEqual({ speaker: 0, moment: 'pot', index: 0 });
    for (let i = 0; i < QUIPS.quietShots; i++) expect(chooser.afterShot(0, POT, characterOf)).toBeNull();
    // Same draw again, but not the same line twice in a row.
    expect(chooser.afterShot(0, POT, characterOf)).toEqual({ speaker: 0, moment: 'pot', index: 1 });
    expect(chooser.afterShot(0, { kind: 'game-over', winner: 0, reason: 'black-potted' }, characterOf)?.moment).toBe('win');
  });

  it('over a long game, about the configured share of pots get a line', () => {
    const chooser = new QuipChooser(createRandom(7));
    let lines = 0;
    const shots = 3000;
    for (let i = 0; i < shots; i++) if (chooser.afterShot(0, POT, characterOf)) lines++;
    // At most one in quietShots + 1 shots can speak; the chance thins that further.
    expect(lines).toBeGreaterThan(shots * 0.1);
    expect(lines).toBeLessThanOrEqual(shots / (QUIPS.quietShots + 1));
  });
});
