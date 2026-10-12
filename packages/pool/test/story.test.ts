import { describe, expect, it } from 'vitest';
import { AI_LEVEL_IDS } from '../src/config/ai';
import { BACKGROUND_IDS } from '../src/config/backgrounds';
import { COMPUTER_CHARACTERS, PLAYER_CHARACTERS } from '../src/config/characters';
import { CUE_IDS } from '../src/config/cues';
import { QUIP_LINES } from '../src/config/quips';
import { STORY, STORY_STOPS } from '../src/config/story';
import { TABLE_IDS } from '../src/config/tables';
import { createPoolSlots } from '../src/progress/slots';
import {
  MAX_STARS,
  characterById,
  defaultStory,
  isBackgroundLocked,
  isCueLocked,
  isStopOpen,
  isTableLocked,
  nextStop,
  recordStop,
  rewardsFor,
  starsFor,
  stopRival,
  titleFor,
  totalStars,
  validateStory,
  validateStoryGame,
  type StoryProgress,
} from '../src/progress/story';
import { validateSavedMatch } from '../src/progress/savedMatch';
import { UK_7FT_TABLE } from '../src/config/table';
import { rackBalls } from '../src/physics/rack';
import { startMatch } from '../src/rules/blackball';
import { MemoryStore } from '@tzg/core';

const withStars = (stars: Record<string, number>): StoryProgress => ({ character: 'fundi', stars });
const allStops = (n: number) => Object.fromEntries(STORY_STOPS.map((s) => [s.id, n]));

describe('story mode', () => {
  it('has eight stops with known rivals, stand-ins, levels and looks, rising to Bingwa', () => {
    expect(STORY_STOPS).toHaveLength(8);
    expect(new Set(STORY_STOPS.map((s) => s.id)).size).toBe(8);
    for (const s of STORY_STOPS) {
      expect(characterById(s.rival), s.id).toBeDefined();
      expect(characterById(s.standIn), s.id).toBeDefined();
      expect(s.standIn === s.rival || PLAYER_CHARACTERS.some((c) => c.id === s.rival)).toBe(true);
      expect(AI_LEVEL_IDS).toContain(s.level);
      // Stops are played on free looks, never on a reward.
      expect(TABLE_IDS).toContain(s.table);
      expect(BACKGROUND_IDS).toContain(s.background);
      expect(s.table).not.toBe(STORY.rewards.table.id);
      expect(s.background).not.toBe(STORY.rewards.background.id);
      // Every character met on the journey has catchphrases.
      expect(QUIP_LINES[s.rival], s.rival).toBeDefined();
      expect(QUIP_LINES[s.standIn], s.standIn).toBeDefined();
    }
    const levels = STORY_STOPS.map((s) => AI_LEVEL_IDS.indexOf(s.level));
    expect([...levels].sort((a, b) => a - b)).toEqual(levels);
    expect(STORY_STOPS.at(-1)!.rival).toBe(COMPUTER_CHARACTERS.impossible.id);
  });

  it('gives a stand-in when the person plays as the rival', () => {
    const sinza = STORY_STOPS.find((s) => s.id === 'sinza')!;
    expect(stopRival(sinza, 'fundi')).toBe('mjanja');
    expect(stopRival(sinza, 'mjanja')).toBe('kichwa');
    for (const s of STORY_STOPS) for (const c of PLAYER_CHARACTERS) expect(stopRival(s, c.id)).not.toBe(c.id);
  });

  it('counts stars: 0 for a loss, 1 for a win, 2 without a foul, 3 also with 3 of the rival’s balls left', () => {
    expect(starsFor(false, 0, 7)).toBe(0);
    expect(starsFor(true, 2, 7)).toBe(1);
    expect(starsFor(true, 1, 0)).toBe(1);
    expect(starsFor(true, 0, 2)).toBe(2);
    expect(starsFor(true, 0, 3)).toBe(3);
    expect(starsFor(true, 0, 7)).toBe(3);
  });

  it('keeps the best stars and opens each stop once the one before is won', () => {
    let story = defaultStory();
    expect(isStopOpen(story, 'mtaani')).toBe(true);
    expect(isStopOpen(story, 'kariakoo')).toBe(false);
    story = recordStop(story, 'mtaani', 0);
    expect(story.stars).toEqual({});
    story = recordStop(story, 'mtaani', 2);
    expect(isStopOpen(story, 'kariakoo')).toBe(true);
    expect(isStopOpen(story, 'sinza')).toBe(false);
    const same = recordStop(story, 'mtaani', 1);
    expect(same).toBe(story);
    expect(recordStop(story, 'mtaani', 3).stars.mtaani).toBe(3);
    expect(nextStop('mtaani')!.id).toBe('kariakoo');
    expect(nextStop('fainali')).toBeUndefined();
    expect(isStopOpen(story, 'nowhere')).toBe(false);
  });

  it('gives titles by stars, the top one only for beating Bingwa', () => {
    expect(MAX_STARS).toBe(24);
    expect(titleFor(defaultStory())).toBeNull();
    expect(titleFor(withStars({ mtaani: 3, kariakoo: 3 }))).toBe('mtaa');
    expect(titleFor(withStars({ mtaani: 3, kariakoo: 3, sinza: 3, mwenge: 3 }))).toBe('fundi');
    const eighteen = withStars({ mtaani: 3, kariakoo: 3, sinza: 3, mwenge: 3, bagamoyo: 3, klabu: 3 });
    expect(totalStars(eighteen)).toBe(18);
    expect(titleFor(eighteen)).toBe('mkali');
    expect(titleFor(withStars(allStops(1)))).toBe('bingwa');
  });

  it('locks only the three story rewards, until earned', () => {
    const none = defaultStory();
    for (const id of TABLE_IDS) expect(isTableLocked(id, none)).toBe(id === 'gold');
    for (const id of CUE_IDS) expect(isCueLocked(id, none)).toBe(id === 'champion');
    for (const id of BACKGROUND_IDS) expect(isBackgroundLocked(id, none)).toBe(id === 'trophies');
    expect(rewardsFor(withStars(allStops(1)))).toEqual({ table: true, cue: false, background: false });
    expect(rewardsFor(withStars({ ...allStops(2), fainali: 2 }))).toEqual({ table: true, cue: false, background: false });
    expect(rewardsFor(withStars({ ...allStops(3), fainali: 0 }))).toMatchObject({ table: false, cue: true });
    expect(rewardsFor(withStars(allStops(3)))).toEqual({ table: true, cue: true, background: true });
  });

  it('reads saves: an empty journey by default, unknown stops dropped, damaged values rejected', () => {
    expect(validateStory({ character: null, stars: {} })).toEqual(defaultStory());
    expect(validateStory({ character: 'bonge', stars: { mtaani: 2, gone: 3 } })).toEqual({ character: 'bonge', stars: { mtaani: 2 } });
    expect(validateStory({ character: 'bingwa', stars: {} })).toBeNull();
    expect(validateStory({ character: 'fundi', stars: { mtaani: 4 } })).toBeNull();
    expect(validateStory({ character: 'fundi', stars: { mtaani: 0 } })).toBeNull();
    expect(validateStory({ character: 'fundi' })).toBeNull();
    expect(validateStory(null)).toBeNull();
    const slots = createPoolSlots('pool', new MemoryStore(), UK_7FT_TABLE);
    expect(slots.story.load().data).toEqual(defaultStory());
  });

  it('saves a story game with its stop and fouls; older saves and Quick games have none', () => {
    const base = {
      opponent: { kind: 'computer', level: 'easy' },
      picks: ['fundi', 'mwamba'],
      match: startMatch(0),
      balls: rackBalls(UK_7FT_TABLE).map((b) => ({ id: b.id, x: b.x, y: b.y, pocketed: false })),
      shots: 0,
    };
    expect(validateSavedMatch(base, UK_7FT_TABLE)?.story).toBeUndefined();
    expect(validateSavedMatch({ ...base, story: { stop: 'sinza', fouls: 2 } }, UK_7FT_TABLE)?.story).toEqual({ stop: 'sinza', fouls: 2 });
    expect(validateSavedMatch({ ...base, story: { stop: 'nowhere', fouls: 0 } }, UK_7FT_TABLE)).toBeNull();
    expect(validateStoryGame({ stop: 'sinza', fouls: -1 })).toBeNull();
  });
});
