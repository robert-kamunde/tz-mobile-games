import { describe, expect, it } from 'vitest';
import { ALL_CHARACTERS, DEFAULT_PICKS, MAX_NAME_LENGTH, PLAYER_CHARACTERS, STORY_CHARACTERS } from '../src/config/characters';
import { seatCharacter, validatePicks, withDistinctPicks } from '../src/progress/characters';
import { PORTRAITS } from '../src/config/portraits';

const all = ALL_CHARACTERS;

describe('characters', () => {
  it('has 8 player characters, 6 men and 2 women (Robert: 75% / 25%)', () => {
    expect(PLAYER_CHARACTERS).toHaveLength(8);
    expect(PLAYER_CHARACTERS.filter((c) => c.gender === 'male')).toHaveLength(6);
    expect(PLAYER_CHARACTERS.filter((c) => c.gender === 'female')).toHaveLength(2);
  });

  it('has 10 story rivals, about three men to each woman', () => {
    expect(STORY_CHARACTERS).toHaveLength(10);
    expect(STORY_CHARACTERS.filter((c) => c.gender === 'female')).toHaveLength(2);
  });

  it('gives every character a unique id and name that fits the player panel', () => {
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
    expect(new Set(all.map((c) => c.name)).size).toBe(all.length);
    for (const c of all) {
      expect(c.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(c.name.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
      expect(PORTRAITS[c.id], `portrait for ${c.id}`).toBeDefined();
    }
  });

  it('has a portrait for every character and none for anyone else', () => {
    expect(Object.keys(PORTRAITS).sort()).toEqual(all.map((c) => c.id).sort());
  });

  it('starts with two different player characters', () => {
    expect(validatePicks([...DEFAULT_PICKS])).toEqual(DEFAULT_PICKS);
  });

  it('puts the computer character in player 2’s seat against the computer', () => {
    expect(seatCharacter(1, { kind: 'computer', level: 'hard' }, ['bonge', 'malkia']).name).toBe('Mzee Kobe');
    expect(seatCharacter(0, { kind: 'computer', level: 'hard' }, ['bonge', 'malkia']).name).toBe('Bonge');
    expect(seatCharacter(1, { kind: 'human' }, ['bonge', 'malkia']).name).toBe('Malkia');
  });

  it('never lets both players be the same character', () => {
    expect(withDistinctPicks('bonge', 'malkia')).toEqual(['bonge', 'malkia']);
    const [a, b] = withDistinctPicks('fundi', 'fundi');
    expect(a).toBe('fundi');
    expect(b).not.toBe('fundi');
    expect(validatePicks(['fundi', 'fundi'])).toBeNull();
  });

  it('accepts only two known player characters from a save', () => {
    expect(validatePicks(['kichwa', 'shangazi'])).toEqual(['kichwa', 'shangazi']);
    for (const bad of [null, 'fundi', ['fundi'], ['fundi', 'mzee-kobe'], ['fundi', 3], ['fundi', 'bonge', 'malkia']]) expect(validatePicks(bad)).toBeNull();
  });
});
