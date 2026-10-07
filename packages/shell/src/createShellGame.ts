import * as Phaser from 'phaser';
import type { LogLevel, StringTables } from '@tzg/core';
import { createServices, registerServices, type Services } from './services';
import { installTestHooks } from './testHooks';
import { RotateOverlay } from './rotateOverlay';

export type Orientation = 'landscape' | 'portrait';

export interface ShellOptions {
  /** Short id, used as the storage key prefix. Never change it after release or players lose their saves. */
  gameId: string;
  /** Design resolution. The game is scaled to fit the screen and letterboxed. */
  design: { width: number; height: number };
  orientation: Orientation;
  backgroundColor: string;
  strings: StringTables;
  scenes: Phaser.Types.Scenes.SceneType[];
  parent: string | HTMLElement;
  logLevel?: LogLevel;
  /** String key shown when the phone is held the wrong way. Must exist in every string table. */
  rotateMessageKey: string;
}

export interface ShellGame {
  game: Phaser.Game;
  services: Services;
  rotateOverlay: RotateOverlay;
}

export function createShellGame(options: ShellOptions): ShellGame {
  if (options.scenes.length === 0) throw new Error('createShellGame needs at least one scene');

  const services = createServices({
    gameId: options.gameId,
    strings: options.strings,
    logLevel: options.logLevel ?? 'info',
  });

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: options.backgroundColor,
    // Low-end phones: cap the canvas resolution at the design size instead of the device pixel ratio.
    scale: {
      parent: options.parent,
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: options.design.width,
      height: options.design.height,
    },
    input: { activePointers: 2 },
    disableContextMenu: true,
    banner: false,
    scene: options.scenes,
    callbacks: {
      preBoot: (g) => registerServices(g, services),
    },
  });

  // Phaser's own visibility handling only resets its clock and relies on the browser throttling
  // requestAnimationFrame. That is not guaranteed in every WebView, so the shell halts the game
  // loop itself: no updates, no rendering, no battery use while in the background.
  services.lifecycle.on('pause', () => game.pause());
  services.lifecycle.on('resume', () => game.resume());
  if (services.lifecycle.isPaused) game.pause();

  const rotateOverlay = new RotateOverlay(options.orientation, services.translator, options.rotateMessageKey);
  installTestHooks(game, services, rotateOverlay);
  services.logger.info(`booted ${options.gameId} ${options.design.width}x${options.design.height} ${options.orientation}`);
  return { game, services, rotateOverlay };
}
