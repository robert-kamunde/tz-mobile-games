import type { AiLevel } from './ai';
import type { BackgroundId } from './backgrounds';
import type { CueId } from './cues';
import type { TableId } from './tables';

/**
 * Safari ya Bingwa, the story mode (docs/STORY_MODE.md; Robert approved the plan 2026-10-12): eight
 * stops, each one game against one character at one computer level, on a table and background
 * that suit the place. Win a stop to open the next. Names of places are not translated.
 */
export interface StoryStop {
  /** Stable id, kept in saves and used to name the map's stops (`stop-<id>`). */
  readonly id: string;
  readonly place: string;
  /** The character the computer plays as (a player or computer character id, config/characters.ts). */
  readonly rival: string;
  /** Plays the stop instead when the person chose `rival` as their own character. */
  readonly standIn: string;
  readonly level: AiLevel;
  readonly table: TableId;
  readonly background: BackgroundId;
}

export const STORY_STOPS: readonly StoryStop[] = [
  { id: 'mtaani', place: 'Mtaani', rival: 'dogo-mbishi', standIn: 'dogo-mbishi', level: 'easy', table: 'classic', background: 'wood' },
  { id: 'kariakoo', place: 'Kariakoo', rival: 'mama-ntilie', standIn: 'mama-ntilie', level: 'medium', table: 'kitenge', background: 'kanga' },
  { id: 'sinza', place: 'Sinza', rival: 'mjanja', standIn: 'kichwa', level: 'medium', table: 'tingatinga', background: 'wood' },
  { id: 'mwenge', place: 'Mwenge', rival: 'bonge', standIn: 'mwamba', level: 'hard', table: 'makonde', background: 'makuti' },
  { id: 'bagamoyo', place: 'Bagamoyo', rival: 'shangazi', standIn: 'malkia', level: 'hard', table: 'maasai', background: 'stars' },
  { id: 'klabu', place: 'Klabu ya Mzee Kobe', rival: 'mzee-kobe', standIn: 'mzee-kobe', level: 'hard', table: 'classic', background: 'classic' },
  { id: 'zanzibar', place: 'Zanzibar', rival: 'malkia', standIn: 'shangazi', level: 'impossible', table: 'zanzibar', background: 'sea' },
  { id: 'fainali', place: 'Fainali', rival: 'bingwa', standIn: 'bingwa', level: 'impossible', table: 'zanzibar', background: 'stars' },
];

export const STORY = {
  /** Stars for a win, plus one for no foul, plus one more for also leaving this many of the rival's balls. */
  maxStars: 3,
  cleanWinBallsLeft: 3,
  /** Titles by total stars, highest first; the last needs the final stop won (see `titleFor`). */
  titles: [
    { id: 'bingwa', stars: 0, needsFinal: true },
    { id: 'mkali', stars: 18, needsFinal: false },
    { id: 'fundi', stars: 12, needsFinal: false },
    { id: 'mtaa', stars: 6, needsFinal: false },
  ],
  /** Story-only looks and what earns them: the final won, or a star total. */
  rewards: {
    table: { id: 'gold', needsFinal: true, stars: 0 },
    cue: { id: 'champion', needsFinal: false, stars: 18 },
    background: { id: 'trophies', needsFinal: false, stars: 24 },
  },
} as const;
