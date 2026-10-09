import type * as Phaser from 'phaser';
import { renderSound } from '@tzg/core';
import { getServices } from '@tzg/shell';
import { SOUND_RECIPES, SOUND_SEED, type PoolSound } from '../config/sound';

const REGISTRY_KEY = 'pool.soundsLoaded';

/** Renders the placeholder sounds into the sound board once per game (a few milliseconds). */
export function loadPoolSounds(scene: Phaser.Scene): void {
  if (scene.registry.get(REGISTRY_KEY)) return;
  const sound = getServices(scene).sound;
  for (const name of Object.keys(SOUND_RECIPES) as PoolSound[]) {
    sound.add(name, renderSound(SOUND_RECIPES[name], sound.sampleRate, SOUND_SEED));
  }
  scene.registry.set(REGISTRY_KEY, true);
}
