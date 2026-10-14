import { describe, expect, it } from 'vitest';
import { STORY_CHAPTERS } from '../src/config/story';
import { defaultStory, recordStop, type Played } from '../src/progress/story';
import {
  announce,
  defaultUnlocks,
  earnedUnlocks,
  hasFresh,
  isFresh,
  seenKind,
  startUnlocks,
  unannounced,
  validateUnlocks,
} from '../src/progress/unlocks';

const nothing: Played = { story: defaultStory(), wins: 0 };
/** Every stop of chapter 1 won with two stars (18): the chapter is done and the first title earned. */
const darDone = (): Played => ({ story: STORY_CHAPTERS[0]!.stops.reduce((s, stop) => recordStop(s, stop.id, 2), defaultStory()), wins: 0 });

describe('unlock popups', () => {
  it('a new phone has nothing earned and nothing to announce', () => {
    const state = startUnlocks(defaultUnlocks(), nothing);
    expect(state.known).toEqual([]);
    expect(unannounced(state, nothing)).toEqual([]);
  });

  it('on the first run after an update, what was already earned is not announced again', () => {
    const played = { ...darDone(), wins: 12 };
    const state = startUnlocks(defaultUnlocks(), played);
    expect(unannounced(state, played)).toEqual([]);
    // Even before the first run is saved, nothing old is announced.
    expect(unannounced(defaultUnlocks(), played)).toEqual([]);
  });

  it('announces what a game earned: looks by wins, then the chapter reward, Bishoo and a title by the journey', () => {
    const state = startUnlocks(defaultUnlocks(), nothing);
    expect(unannounced(state, { ...nothing, wins: 3 })).toEqual(['table:kitenge']);
    const keys = unannounced(state, darDone());
    expect(keys).toContain('cue:champion');
    expect(keys).toContain('character:bishoo');
    expect(keys).toContain('title:mtaa');
    expect(keys).toEqual(earnedUnlocks(darDone()));
  });

  it('an announced look or character is MPYA until its picker opens; a title never is', () => {
    let state = startUnlocks(defaultUnlocks(), nothing);
    for (const key of ['table:kitenge', 'character:bishoo', 'title:mtaa']) state = announce(state, key);
    expect(state.known).toEqual(['table:kitenge', 'character:bishoo', 'title:mtaa']);
    expect(unannounced(state, { ...darDone(), wins: 3 })).not.toContain('table:kitenge');
    expect(isFresh(state, 'table', 'kitenge')).toBe(true);
    expect(isFresh(state, 'title', 'mtaa')).toBe(false);
    expect(hasFresh(state, ['table', 'cue', 'background'])).toBe(true);
    state = seenKind(state, 'table');
    expect(hasFresh(state, ['table', 'cue', 'background'])).toBe(false);
    expect(isFresh(state, 'character', 'bishoo')).toBe(true);
    // Announcing twice changes nothing.
    expect(announce(state, 'character:bishoo')).toBe(state);
  });

  it('validates saves: a missing or broken save loads as the default', () => {
    const state = announce(startUnlocks(defaultUnlocks(), nothing), 'table:kitenge');
    expect(validateUnlocks(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(validateUnlocks({ known: null, fresh: [] })).toEqual(defaultUnlocks());
    expect(validateUnlocks({ known: 'x', fresh: [] })).toBeNull();
    expect(validateUnlocks({ known: [], fresh: [3] })).toBeNull();
    expect(validateUnlocks(null)).toBeNull();
  });
});
