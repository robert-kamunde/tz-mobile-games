import { COMPUTER_CHARACTERS, type Character } from '../config/characters';
import { STORY, STORY_STOPS, type StoryStop } from '../config/story';
import type { BackgroundId } from '../config/backgrounds';
import type { CueId } from '../config/cues';
import type { TableId } from '../config/tables';
import { playerCharacter } from './characters';

/** Story mode on this phone: who the person plays as, and their best stars at each stop. */
export interface StoryProgress {
  /** The person's character for the journey; null until they start it. */
  readonly character: string | null;
  /** Best stars (1-3) per stop id; a stop not yet won is missing. */
  readonly stars: Readonly<Record<string, number>>;
}

export const STORY_VERSION = 1;

export function defaultStory(): StoryProgress {
  return { character: null, stars: {} };
}

/** A story game while it is played: the stop, and the person's fouls so far (for the stars). */
export interface StoryGame {
  readonly stop: string;
  readonly fouls: number;
}

export function storyStop(id: string): StoryStop | undefined {
  return STORY_STOPS.find((s) => s.id === id);
}

/** Any character by id, player or computer. */
export function characterById(id: string): Character | undefined {
  return playerCharacter(id) ?? Object.values(COMPUTER_CHARACTERS).find((c) => c.id === id);
}

/** Who the computer plays as at a stop: its rival, or the stand-in if the person took the rival. */
export function stopRival(stop: StoryStop, person: string): string {
  return stop.rival === person ? stop.standIn : stop.rival;
}

/**
 * Stars for a finished stop game: 0 for a loss; 1 for a win, 2 without a foul, 3 without a foul
 * and with at least `cleanWinBallsLeft` of the rival's balls still on the table.
 */
export function starsFor(won: boolean, fouls: number, rivalBallsLeft: number): number {
  if (!won) return 0;
  if (fouls > 0) return 1;
  return rivalBallsLeft >= STORY.cleanWinBallsLeft ? 3 : 2;
}

/** Keeps the best result at a stop. */
export function recordStop(story: StoryProgress, stop: string, stars: number): StoryProgress {
  if (stars <= (story.stars[stop] ?? 0)) return story;
  return { ...story, stars: { ...story.stars, [stop]: stars } };
}

export function totalStars(story: StoryProgress): number {
  return STORY_STOPS.reduce((sum, s) => sum + (story.stars[s.id] ?? 0), 0);
}

export const MAX_STARS = STORY_STOPS.length * STORY.maxStars;

/** A stop can be played once every stop before it is won. */
export function isStopOpen(story: StoryProgress, stop: string): boolean {
  const index = STORY_STOPS.findIndex((s) => s.id === stop);
  return index >= 0 && STORY_STOPS.slice(0, index).every((s) => (story.stars[s.id] ?? 0) > 0);
}

/** The stop after this one, if any. */
export function nextStop(stop: string): StoryStop | undefined {
  const index = STORY_STOPS.findIndex((s) => s.id === stop);
  return index >= 0 ? STORY_STOPS[index + 1] : undefined;
}

const finalWon = (story: StoryProgress) => (story.stars[STORY_STOPS[STORY_STOPS.length - 1]!.id] ?? 0) > 0;

const earned = (story: StoryProgress, need: { readonly needsFinal: boolean; readonly stars: number }) =>
  (!need.needsFinal || finalWon(story)) && totalStars(story) >= need.stars;

/** The title earned so far (an id under `story.title.*`), or null before the first one. */
export function titleFor(story: StoryProgress): string | null {
  return STORY.titles.find((t) => earned(story, t))?.id ?? null;
}

/** Story-only looks, and whether each is earned. */
export interface StoryRewards {
  readonly table: boolean;
  readonly cue: boolean;
  readonly background: boolean;
}

export function rewardsFor(story: StoryProgress): StoryRewards {
  const r = STORY.rewards;
  return { table: earned(story, r.table), cue: earned(story, r.cue), background: earned(story, r.background) };
}

/** Looks that stay locked until story mode earns them. Everything else is free. */
export function isTableLocked(id: TableId, story: StoryProgress): boolean {
  return id === STORY.rewards.table.id && !rewardsFor(story).table;
}

export function isCueLocked(id: CueId, story: StoryProgress): boolean {
  return id === STORY.rewards.cue.id && !rewardsFor(story).cue;
}

export function isBackgroundLocked(id: BackgroundId, story: StoryProgress): boolean {
  return id === STORY.rewards.background.id && !rewardsFor(story).background;
}

export function validateStory(raw: unknown): StoryProgress | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const character = r.character === null || r.character === undefined ? null : typeof r.character === 'string' && playerCharacter(r.character) ? r.character : undefined;
  if (character === undefined) return null;
  if (typeof r.stars !== 'object' || r.stars === null) return null;
  const stars: Record<string, number> = {};
  for (const [id, value] of Object.entries(r.stars as Record<string, unknown>)) {
    // A stop removed in an update is dropped; a bad value means the save is damaged.
    if (!storyStop(id)) continue;
    if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > STORY.maxStars) return null;
    stars[id] = value as number;
  }
  return { character, stars };
}

/** The story part of a saved game, or null when it is not a story game or the data is bad. */
export function validateStoryGame(raw: unknown): StoryGame | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.stop !== 'string' || !storyStop(r.stop)) return null;
  if (!Number.isInteger(r.fouls) || (r.fouls as number) < 0) return null;
  return { stop: r.stop, fouls: r.fouls as number };
}
