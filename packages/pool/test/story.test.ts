import { describe, expect, it } from 'vitest';
import { AI_LEVEL_IDS } from '../src/config/ai';
import { BACKGROUND_IDS } from '../src/config/backgrounds';
import { COMPUTER_CHARACTERS, PLAYER_CHARACTERS, STORY_CHARACTERS } from '../src/config/characters';
import { CUE_IDS } from '../src/config/cues';
import { QUIP_LINES } from '../src/config/quips';
import { STORY, STORY_CHAPTERS, STORY_STOPS } from '../src/config/story';
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
  earnedRewards,
  isChapterDone,
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
  it('has three chapters of nine stops with known rivals, stand-ins, levels and looks, rising to Bingwa', () => {
    expect(STORY_CHAPTERS.map((c) => c.stops.length)).toEqual([9, 9, 9]);
    expect(new Set(STORY_STOPS.map((s) => s.id)).size).toBe(27);
    for (const s of STORY_STOPS) {
      expect(characterById(s.rival), s.id).toBeDefined();
      expect(characterById(s.standIn), s.id).toBeDefined();
      expect(s.standIn === s.rival || PLAYER_CHARACTERS.some((c) => c.id === s.rival)).toBe(true);
      expect(AI_LEVEL_IDS).toContain(s.level);
      expect(TABLE_IDS).toContain(s.table);
      expect(BACKGROUND_IDS).toContain(s.background);
      // Every character met on the journey has catchphrases.
      expect(QUIP_LINES[s.rival], s.rival).toBeDefined();
      expect(QUIP_LINES[s.standIn], s.standIn).toBeDefined();
      if (s.twist?.kind === 'shotLimit') expect(s.twist.shots).toBeGreaterThanOrEqual(8);
    }
    // Never easier than the stop before.
    const levels = STORY_STOPS.map((s) => AI_LEVEL_IDS.indexOf(s.level));
    levels.forEach((level, i) => i > 0 && expect(level, STORY_STOPS[i]!.id).toBeGreaterThanOrEqual(i % 9 === 0 ? levels[i - 1]! - 2 : levels[i - 1]!));
    expect(STORY_STOPS.at(-1)!.rival).toBe(COMPUTER_CHARACTERS.impossible.id);
    // Every story rival is met.
    for (const c of STORY_CHARACTERS) expect(STORY_STOPS.some((s) => s.rival === c.id), c.id).toBe(true);
    // Twists come in after the first two stops.
    expect(STORY_STOPS.slice(0, 2).every((s) => !s.twist)).toBe(true);
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
    expect(MAX_STARS).toBe(81);
    expect(titleFor(defaultStory())).toBeNull();
    const first = (n: number, stars: number) => withStars(Object.fromEntries(STORY_STOPS.slice(0, n).map((s) => [s.id, stars])));
    expect(titleFor(first(5, 3))).toBe('mtaa');
    expect(titleFor(first(12, 3))).toBe('fundi');
    expect(titleFor(first(19, 3))).toBe('mkali');
    expect(titleFor(withStars(allStops(1)))).toBe('bingwa');
  });

  it('marks a chapter done when its last stop is won', () => {
    expect(isChapterDone(withStars({ klabu: 1 }), 'dar')).toBe(true);
    expect(isChapterDone(withStars({ mtaani: 3 }), 'dar')).toBe(false);
    expect(isChapterDone(withStars({}), 'nowhere')).toBe(false);
  });

  it('locks only the story rewards, each until its chapter is done or its stars are earned', () => {
    const none = defaultStory();
    const rewardIds = (kind: string) => STORY.rewards.filter((r) => r.kind === kind).map((r) => r.id as string);
    for (const id of TABLE_IDS) expect(isTableLocked(id, none), id).toBe(rewardIds('table').includes(id));
    for (const id of CUE_IDS) expect(isCueLocked(id, none), id).toBe(id === 'champion');
    for (const id of BACKGROUND_IDS) expect(isBackgroundLocked(id, none), id).toBe(rewardIds('background').includes(id));
    expect(earnedRewards(withStars({ klabu: 1 }))).toEqual(['cue:champion']);
    expect(earnedRewards(withStars({ klabu: 1, arusha: 1 }))).toEqual(['cue:champion', 'table:kilimanjaro', 'background:mountain']);
    expect(earnedRewards(withStars(allStops(1)))).toEqual(['cue:champion', 'table:kilimanjaro', 'background:mountain', 'table:ziwa', 'background:lake', 'table:gold']);
    expect(earnedRewards(withStars(allStops(3)))).toHaveLength(STORY.rewards.length);
    expect(isTableLocked('gold', withStars(allStops(1)))).toBe(false);
    expect(isBackgroundLocked('trophies', withStars(allStops(2)))).toBe(true);
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

  it('saves a story game with its stop, fouls and shots; older saves and Quick games have none', () => {
    const base = {
      opponent: { kind: 'computer', level: 'easy' },
      picks: ['fundi', 'mwamba'],
      match: startMatch(0),
      balls: rackBalls(UK_7FT_TABLE).map((b) => ({ id: b.id, x: b.x, y: b.y, pocketed: false })),
      shots: 0,
    };
    expect(validateSavedMatch(base, UK_7FT_TABLE)?.story).toBeUndefined();
    // Saved before shot limits: no shots counted yet.
    expect(validateSavedMatch({ ...base, story: { stop: 'sinza', fouls: 2 } }, UK_7FT_TABLE)?.story).toEqual({ stop: 'sinza', fouls: 2, shots: 0 });
    expect(validateSavedMatch({ ...base, story: { stop: 'ubungo', fouls: 0, shots: 5 } }, UK_7FT_TABLE)?.story).toEqual({ stop: 'ubungo', fouls: 0, shots: 5 });
    expect(validateStoryGame({ stop: 'ubungo', fouls: 0, shots: -2 })).toBeNull();
    expect(validateSavedMatch({ ...base, story: { stop: 'nowhere', fouls: 0 } }, UK_7FT_TABLE)).toBeNull();
    expect(validateStoryGame({ stop: 'sinza', fouls: -1 })).toBeNull();
  });
});
