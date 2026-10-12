import type { Translator } from '@tzg/core';
import type { StoryNeed, StoryTwist } from '../config/story';
import { PLAYER_CHARACTERS } from '../config/characters';
import { characterNeed, storyStop, type Played } from '../progress/story';

/** What earns a locked thing, for its picture or the map ("Maliza Sura 1", "Shinda Kariakoo\nau mechi 3"). */
export function needText(t: Translator, need: StoryNeed): string {
  if (need.chapter) return t.t(`story.needsChapter.${need.chapter}`);
  if (need.stop) {
    const place = storyStop(need.stop)?.place ?? need.stop;
    return need.wins ? t.t('story.needsStopOrWins', { place, wins: need.wins }) : t.t('story.needsStop', { place });
  }
  if (need.wins) return t.t('story.needsWins', { wins: need.wins });
  return t.t('story.needsStars', { stars: need.stars ?? 0 });
}

/** A stop's twist, for its card and the map. */
export function twistText(t: Translator, twist: StoryTwist): string {
  return twist.kind === 'shotLimit' ? t.t('story.twist.shotLimit', { shots: twist.shots }) : t.t(`story.twist.${twist.kind}`);
}

/** The player characters not earned yet, each with what earns it, for the character picker. */
export function lockedCharacters(t: Translator, played: Played): ReadonlyMap<string, string> {
  const locked = new Map<string, string>();
  for (const c of PLAYER_CHARACTERS) {
    const need = characterNeed(c.id, played);
    if (need) locked.set(c.id, needText(t, need));
  }
  return locked;
}
