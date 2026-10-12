import type { AiLevel } from './ai';
import type { BackgroundId } from './backgrounds';
import type { CueId } from './cues';
import type { TableId } from './tables';

/**
 * Safari ya Bingwa, the story mode (docs/STORY_MODE.md). Three chapters of nine stops (Robert chose
 * three chapters, 2026-10-12), each stop one game against one character at one computer level, on a
 * table and background that suit the place, some with a twist. Win a stop to open the next.
 * Place names are not translated.
 */

/** A rule a stop adds to the game. */
export type StoryTwist =
  /** The rival breaks. */
  | { readonly kind: 'rivalBreaks' }
  /** Win within this many of your own shots, or lose. */
  | { readonly kind: 'shotLimit'; readonly shots: number }
  /** Your first foul loses the game. */
  | { readonly kind: 'oneFoul' }
  /** No spin: the spin control is off. */
  | { readonly kind: 'noSpin' };

export interface StoryStop {
  /** Stable id, kept in saves and used to name the map's stops (`stop-<id>`). */
  readonly id: string;
  readonly place: string;
  /** The character the computer plays as (any character id, config/characters.ts). */
  readonly rival: string;
  /** Plays the stop instead when the person chose `rival` as their own character. */
  readonly standIn: string;
  readonly level: AiLevel;
  readonly table: TableId;
  readonly background: BackgroundId;
  readonly twist?: StoryTwist;
}

export interface StoryChapter {
  /** Stable id; its name is the string `story.chapter.<id>`. */
  readonly id: string;
  readonly stops: readonly StoryStop[];
}

const stop = (id: string, place: string, rival: string, standIn: string, level: AiLevel, table: TableId, background: BackgroundId, twist?: StoryTwist): StoryStop => ({
  id,
  place,
  rival,
  standIn,
  level,
  table,
  background,
  ...(twist ? { twist } : {}),
});

const RIVAL_BREAKS: StoryTwist = { kind: 'rivalBreaks' };
const ONE_FOUL: StoryTwist = { kind: 'oneFoul' };
const NO_SPIN: StoryTwist = { kind: 'noSpin' };
const shotLimit = (shots: number): StoryTwist => ({ kind: 'shotLimit', shots });

export const STORY_CHAPTERS: readonly StoryChapter[] = [
  {
    id: 'dar',
    stops: [
      stop('mtaani', 'Mtaani', 'dogo-mbishi', 'dogo-mbishi', 'easy', 'classic', 'wood'),
      stop('kariakoo', 'Kariakoo', 'mama-ntilie', 'mama-ntilie', 'medium', 'kitenge', 'kanga'),
      stop('manzese', 'Manzese', 'bishoo', 'kichwa', 'medium', 'tingatinga', 'kanga', RIVAL_BREAKS),
      stop('sinza', 'Sinza', 'mjanja', 'kichwa', 'medium', 'tingatinga', 'wood'),
      stop('kigamboni', 'Kigamboni', 'mwamba', 'bonge', 'medium', 'zanzibar', 'sea', NO_SPIN),
      stop('mwenge', 'Mwenge', 'bonge', 'mwamba', 'hard', 'makonde', 'makuti'),
      stop('ubungo', 'Ubungo', 'kichwa', 'bishoo', 'hard', 'kitenge', 'kanga', shotLimit(14)),
      stop('bagamoyo', 'Bagamoyo', 'shangazi', 'malkia', 'hard', 'maasai', 'stars'),
      stop('klabu', 'Klabu ya Mzee Kobe', 'mzee-kobe', 'mzee-kobe', 'hard', 'classic', 'classic', ONE_FOUL),
    ],
  },
  {
    id: 'kaskazini',
    stops: [
      stop('morogoro', 'Morogoro', 'kaka-tunda', 'kaka-tunda', 'medium', 'kitenge', 'wood'),
      stop('dodoma', 'Dodoma', 'bwana-shamba', 'bwana-shamba', 'hard', 'classic', 'kanga'),
      stop('singida', 'Singida', 'fundi', 'mwamba', 'hard', 'makonde', 'makuti', RIVAL_BREAKS),
      stop('tanga', 'Tanga', 'mama-pweza', 'mama-pweza', 'hard', 'zanzibar', 'sea', NO_SPIN),
      stop('lushoto', 'Lushoto', 'malkia', 'shangazi', 'hard', 'tingatinga', 'stars', shotLimit(12)),
      stop('moshi', 'Moshi', 'kahawa', 'kahawa', 'hard', 'kilimanjaro', 'mountain', ONE_FOUL),
      stop('babati', 'Babati', 'bishoo', 'kichwa', 'impossible', 'maasai', 'stars'),
      stop('karatu', 'Karatu', 'mjanja', 'kichwa', 'impossible', 'maasai', 'mountain', RIVAL_BREAKS),
      stop('arusha', 'Arusha', 'mzee-simba', 'mzee-simba', 'impossible', 'kilimanjaro', 'mountain'),
    ],
  },
  {
    id: 'visiwani',
    stops: [
      stop('mwanza', 'Mwanza', 'sato', 'sato', 'hard', 'ziwa', 'lake'),
      stop('bukoba', 'Bukoba', 'dada-ndizi', 'dada-ndizi', 'hard', 'kitenge', 'lake', NO_SPIN),
      stop('kigoma', 'Kigoma', 'kapteni', 'kapteni', 'impossible', 'ziwa', 'lake'),
      stop('mbeya', 'Mbeya', 'baridi', 'baridi', 'impossible', 'makonde', 'mountain', shotLimit(12)),
      stop('iringa', 'Iringa', 'bonge', 'mwamba', 'impossible', 'tingatinga', 'makuti', ONE_FOUL),
      stop('mtwara', 'Mtwara', 'mama-ntilie', 'mama-ntilie', 'impossible', 'makonde', 'sea', RIVAL_BREAKS),
      stop('pemba', 'Pemba', 'mzee-karafuu', 'mzee-karafuu', 'impossible', 'zanzibar', 'makuti', NO_SPIN),
      stop('zanzibar', 'Zanzibar', 'malkia', 'shangazi', 'impossible', 'zanzibar', 'sea'),
      stop('fainali', 'Fainali', 'bingwa', 'bingwa', 'impossible', 'zanzibar', 'stars'),
    ],
  },
];

/** Every stop in journey order. */
export const STORY_STOPS: readonly StoryStop[] = STORY_CHAPTERS.flatMap((c) => c.stops);

/**
 * What earns a reward, a title or a character. Any one part is enough: finishing a chapter (its
 * last stop won), winning a stop, a star total, or games won against the computer (story games
 * count too).
 */
export interface StoryNeed {
  readonly chapter?: string;
  readonly stop?: string;
  readonly stars?: number;
  readonly wins?: number;
}

export interface StoryReward {
  readonly kind: 'table' | 'cue' | 'background';
  readonly id: TableId | CueId | BackgroundId;
  readonly need: StoryNeed;
}

/**
 * Looks that start locked (Robert, 2026-10-12: only two free in each kind, the rest earned by
 * playing; no buying). In journey order, each opens at its stop or after `UNLOCK_WINS_EACH` more
 * wins against the computer, whichever comes first, so quick games alone also open them all.
 */
const UNLOCK_WINS_EACH = 3;
const PLAY_UNLOCKS: readonly (readonly [StoryReward['kind'], StoryReward['id'], string])[] = [
  ['table', 'kitenge', 'kariakoo'],
  ['cue', 'kitenge', 'sinza'],
  ['background', 'kanga', 'mwenge'],
  ['table', 'maasai', 'bagamoyo'],
  ['cue', 'maasai', 'dodoma'],
  ['background', 'sea', 'tanga'],
  ['table', 'tingatinga', 'babati'],
  ['cue', 'tingatinga', 'karatu'],
  ['background', 'stars', 'bukoba'],
  ['table', 'makonde', 'mbeya'],
  ['cue', 'makonde', 'mtwara'],
  ['background', 'makuti', 'pemba'],
];

export const STORY = {
  /** Stars for a win, plus one for no foul, plus one more for also leaving this many of the rival's balls. */
  maxStars: 3,
  cleanWinBallsLeft: 3,
  /** Titles, highest first; the first earned is shown. */
  titles: [
    { id: 'bingwa', need: { chapter: 'visiwani' } },
    { id: 'mkali', need: { stars: 55 } },
    { id: 'fundi', need: { stars: 35 } },
    { id: 'mtaa', need: { stars: 15 } },
  ],
  /**
   * Looks locked in the pickers until earned; everything else is free. The first group is earned
   * only in story mode; the rest by story mode or by wins (PLAY_UNLOCKS).
   */
  rewards: [
    { kind: 'cue', id: 'champion', need: { chapter: 'dar' } },
    { kind: 'table', id: 'kilimanjaro', need: { chapter: 'kaskazini' } },
    { kind: 'background', id: 'mountain', need: { chapter: 'kaskazini' } },
    { kind: 'table', id: 'ziwa', need: { chapter: 'visiwani' } },
    { kind: 'background', id: 'lake', need: { chapter: 'visiwani' } },
    { kind: 'table', id: 'gold', need: { chapter: 'visiwani' } },
    { kind: 'background', id: 'trophies', need: { stars: 70 } },
    ...PLAY_UNLOCKS.map(([kind, id, stop], i) => ({ kind, id, need: { stop, wins: (i + 1) * UNLOCK_WINS_EACH } })),
  ] satisfies readonly StoryReward[] as readonly StoryReward[],
  /**
   * Player characters that start locked (Robert, 2026-10-12: two men, both women stay free). The
   * rest are free; DEFAULT_PICKS must stay free.
   */
  characters: [
    { id: 'bishoo', need: { chapter: 'dar' } },
    { id: 'kichwa', need: { wins: 10 } },
  ] satisfies readonly { id: string; need: StoryNeed }[] as readonly { readonly id: string; readonly need: StoryNeed }[],
} as const;
