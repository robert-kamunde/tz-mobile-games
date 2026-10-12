import { ALL_CHARACTERS, type Character } from '../config/characters';
import { STORY, STORY_CHAPTERS, STORY_STOPS, type StoryChapter, type StoryNeed, type StoryReward, type StoryStop } from '../config/story';
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

/** A story game while it is played: the stop, the person's fouls (for the stars) and shots (for a shot limit). */
export interface StoryGame {
  readonly stop: string;
  readonly fouls: number;
  readonly shots: number;
}

export function storyStop(id: string): StoryStop | undefined {
  return STORY_STOPS.find((s) => s.id === id);
}

/** Any character by id, player or computer. */
export function characterById(id: string): Character | undefined {
  return ALL_CHARACTERS.find((c) => c.id === id);
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

/** The chapter a stop belongs to. */
export function chapterOf(stop: string): StoryChapter | undefined {
  return STORY_CHAPTERS.find((c) => c.stops.some((s) => s.id === stop));
}

/** A chapter is done when its last stop is won. */
export function isChapterDone(story: StoryProgress, chapter: string): boolean {
  const stops = STORY_CHAPTERS.find((c) => c.id === chapter)?.stops ?? [];
  const last = stops[stops.length - 1];
  return last !== undefined && (story.stars[last.id] ?? 0) > 0;
}

/** What has been played so far, for what it earns: the journey, and games won against the computer. */
export interface Played {
  readonly story: StoryProgress;
  readonly wins: number;
}

/** Any one part of the need is enough. */
export function isNeedMet(played: Played, need: StoryNeed): boolean {
  const { story, wins } = played;
  return (
    (need.chapter !== undefined && isChapterDone(story, need.chapter)) ||
    (need.stop !== undefined && (story.stars[need.stop] ?? 0) > 0) ||
    (need.stars !== undefined && totalStars(story) >= need.stars) ||
    (need.wins !== undefined && wins >= need.wins)
  );
}

/** The title earned so far (an id under `story.title.*`), or null before the first one. Titles come from the journey alone. */
export function titleFor(story: StoryProgress): string | null {
  return STORY.titles.find((t) => isNeedMet({ story, wins: 0 }, t.need))?.id ?? null;
}

/** The locked looks earned so far, as `<kind>:<id>`. */
export function earnedRewards(played: Played): string[] {
  return STORY.rewards.filter((r) => isNeedMet(played, r.need)).map((r) => `${r.kind}:${r.id}`);
}

/** The reward that keeps a look locked, or undefined when the look is free or already earned. */
export function lockedBy(kind: StoryReward['kind'], id: string, played: Played): StoryReward | undefined {
  return STORY.rewards.find((r) => r.kind === kind && r.id === id && !isNeedMet(played, r.need));
}

export function isTableLocked(id: TableId, played: Played): boolean {
  return lockedBy('table', id, played) !== undefined;
}

export function isCueLocked(id: CueId, played: Played): boolean {
  return lockedBy('cue', id, played) !== undefined;
}

export function isBackgroundLocked(id: BackgroundId, played: Played): boolean {
  return lockedBy('background', id, played) !== undefined;
}

/** What still earns a locked player character, or undefined when it can be played. */
export function characterNeed(id: string, played: Played): StoryNeed | undefined {
  const lock = STORY.characters.find((c) => c.id === id);
  return lock && !isNeedMet(played, lock.need) ? lock.need : undefined;
}

/** The player characters earned so far, of those that start locked. */
export function earnedCharacters(played: Played): string[] {
  return STORY.characters.filter((c) => isNeedMet(played, c.need)).map((c) => c.id);
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
  // `shots` is new with shot limits (0.25.0): a game saved before has counted none.
  const shots = r.shots === undefined ? 0 : r.shots;
  if (!Number.isInteger(shots) || (shots as number) < 0) return null;
  return { stop: r.stop, fouls: r.fouls as number, shots: shots as number };
}
