import * as Phaser from 'phaser';
import { getServices, onBackButton, registerTestProbe } from '@tzg/shell';
import { DESIGN, MENU, SPLASH } from '../config/layout';
import { loadArtFiles } from './art/artFiles';
import { logoTexture, menuBackgroundTexture } from './art/menuArt';
import { loadPortraitFiles } from './art/portraitFiles';
import { addPageDim, setPageDim, showPageBackdrop } from './pageBackdrop';
import { SCENE_KEYS } from './sceneKeys';

/**
 * The first screen (0.39.0): the logo big over the menu picture while the pictures load, then the
 * logo glides up into its place on the menu and the menu starts. Phones on Android 12 and newer only
 * flash the app icon before this, so this is the splash most players see.
 */
export class SplashScene extends Phaser.Scene {
  static readonly KEY = SCENE_KEYS.splash;
  private leaving = false;

  constructor() {
    super(SplashScene.KEY);
  }

  preload(): void {
    // The menu's pictures load here, behind the splash; the menu then finds them ready.
    loadPortraitFiles(this);
    loadArtFiles(this);
  }

  create(): void {
    const s = SPLASH;
    this.leaving = false;
    const background = menuBackgroundTexture(this);
    // The picture itself lies behind the see-through canvas, covering the whole screen (pageBackdrop);
    // this copy stays hidden and only names the spot tests tap.
    this.add.image(0, 0, background).setOrigin(0).setName('splash-background').setVisible(false);
    showPageBackdrop(this, background, true);
    const dim = this.add.rectangle(DESIGN.width / 2, DESIGN.height / 2, DESIGN.width, DESIGN.height, s.dim.color, s.dim.from).setInteractive();
    addPageDim(s.dim.color, s.dim.from);
    const logo = logoTexture(this, getServices(this).translator.t('menu.title'));
    const image = this.add
      .image(MENU.x, s.logoY, logo.key)
      .setDisplaySize(logo.width * s.logoScale, logo.height * s.logoScale)
      .setName('splash-logo')
      .setAlpha(0);
    this.tweens.add({ targets: image, alpha: 1, duration: s.inMs, ease: 'Sine.Out' });

    const leave = () => {
      if (this.leaving) return;
      this.leaving = true;
      this.tweens.add({ targets: dim, alpha: 0, duration: s.outMs, ease: 'Sine.InOut', onUpdate: () => setPageDim(s.dim.from * dim.alpha) });
      this.tweens.add({
        targets: image,
        y: MENU.titleY,
        displayWidth: logo.width,
        displayHeight: logo.height,
        duration: s.outMs,
        ease: 'Cubic.InOut',
        onComplete: () => this.scene.start(SCENE_KEYS.menu, {}),
      });
    };
    const timer = this.time.delayedCall(s.inMs + s.holdMs, leave);
    dim.on('pointerdown', () => {
      timer.remove();
      leave();
    });
    // Back waits: the menu follows in a moment.
    onBackButton(this, () => true);
    registerTestProbe('pool.splash', () => ({ leaving: this.leaving }));
  }
}
