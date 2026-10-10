import type * as Phaser from 'phaser';
import type { Services } from './services';
import type { RotateOverlay } from './rotateOverlay';
import type { TestHooks } from './testHooksApi';

type Probe = (...args: unknown[]) => unknown;
const probes = new Map<string, Probe>();

/**
 * Lets a game expose read-only state to browser tests (e.g. ball positions). Does nothing outside
 * e2e builds, so release builds keep no references.
 */
export function registerTestProbe(name: string, probe: Probe): void {
  if (import.meta.env.MODE !== 'e2e') return;
  probes.set(name, probe);
}

export function installTestHooks(game: Phaser.Game, services: Services, rotateOverlay: RotateOverlay): void {
  if (import.meta.env.MODE !== 'e2e') return;

  let frames = 0;
  game.events.on('poststep', () => {
    frames += 1;
  });

  const cpu = { frames: 0, totalMs: 0, maxMs: 0, startedAt: 0 };
  game.events.on('prestep', () => {
    cpu.startedAt = performance.now();
  });
  game.events.on('postrender', () => {
    const ms = performance.now() - cpu.startedAt;
    cpu.frames += 1;
    cpu.totalMs += ms;
    cpu.maxMs = Math.max(cpu.maxMs, ms);
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
      return designToPage(b.centerX, b.centerY);
    },
    textOf(sceneKey, name) {
      const obj = game.scene.getScene(sceneKey)?.children.getByName(name);
      return obj && 'text' in obj && typeof obj.text === 'string' ? obj.text : null;
    },
    dataOf(sceneKey, name, key) {
      const obj = game.scene.getScene(sceneKey)?.children.getByName(name);
      return (obj?.getData(key) as unknown) ?? null;
    },
    sound: () => ({ state: services.sound.state, played: [...services.sound.log] }),
    back: () => services.back.press(),
    backLeaves: () => services.back.leaveCount,
    frameCpuStats: () => ({ frames: cpu.frames, averageMs: cpu.frames ? cpu.totalMs / cpu.frames : 0, maxMs: cpu.maxMs }),
    resetFrameCpuStats() {
      cpu.frames = 0;
      cpu.totalMs = 0;
      cpu.maxMs = 0;
    },
    designToPage,
    probe(name, ...args) {
      const probe = probes.get(name);
      if (!probe) throw new Error(`no test probe named "${name}"`);
      return probe(...args);
    },
  };

  function designToPage(x: number, y: number): { x: number; y: number } {
    const rect = game.canvas.getBoundingClientRect();
    return { x: rect.left + (x * rect.width) / game.scale.width, y: rect.top + (y * rect.height) / game.scale.height };
  }
}
