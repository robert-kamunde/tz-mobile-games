import type * as Phaser from 'phaser';
import type { Services } from './services';
import type { RotateOverlay } from './rotateOverlay';
import type { TestHooks } from './testHooksApi';

export function installTestHooks(game: Phaser.Game, services: Services, rotateOverlay: RotateOverlay): void {
  if (import.meta.env.MODE !== 'e2e') return;

  let frames = 0;
  game.events.on('poststep', () => {
    frames += 1;
  });

  window.__tzg = {
    frames: () => frames,
    activeScenes: () => game.scene.getScenes(true).map((s) => s.scene.key),
    locale: () => services.translator.locale,
    paused: () => services.lifecycle.isPaused,
    rotatePromptVisible: () => rotateOverlay.visible,
    elementCenter(sceneKey, name) {
      const scene = game.scene.getScene(sceneKey);
      const obj = scene?.children.getByName(name) as Phaser.GameObjects.Components.GetBounds | null | undefined;
      if (!obj) return null;
      const b = obj.getBounds();
      const rect = game.canvas.getBoundingClientRect();
      const sx = rect.width / game.scale.width;
      const sy = rect.height / game.scale.height;
      return { x: rect.left + b.centerX * sx, y: rect.top + b.centerY * sy };
    },
  };
}
