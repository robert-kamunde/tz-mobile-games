import type { Translator } from '@tzg/core';
import type { StoryNeed, StoryTwist } from '../config/story';

/** What earns a story reward, for a locked picture or the map ("Maliza Sura 1", "Pata nyota 70"). */
export function needText(t: Translator, need: StoryNeed): string {
  return need.chapter ? t.t(`story.needsChapter.${need.chapter}`) : t.t('story.needsStars', { stars: need.stars ?? 0 });
}

/** A stop's twist, for its card and the map. */
export function twistText(t: Translator, twist: StoryTwist): string {
  return twist.kind === 'shotLimit' ? t.t('story.twist.shotLimit', { shots: twist.shots }) : t.t(`story.twist.${twist.kind}`);
}
