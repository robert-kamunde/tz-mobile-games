import * as Phaser from 'phaser';
import { getServices } from '@tzg/shell';
import { DESIGN, KIMBUNGA_BANNER } from '../config/layout';
import { SOUND_MIX } from '../config/sound';
import { loadPoolSounds } from './poolSounds';
import { textStyle } from './ui';

/**
 * "KIMBUNGA!" (0.36.0): a big gold word bouncing in over the table with a line under it, a burst of
 * sparkles and a fanfare, when a game is won from the break. It goes after `showMs` or on a tap, and
 * then `done` runs (the end panel follows). Named `kimbunga` (the word) and `kimbunga-line`.
 */
export class KimbungaBanner {
  private objects: (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth)[] = [];
  private timer: Phaser.Time.TimerEvent | null = null;
  private done: (() => void) | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    loadPoolSounds(scene);
  }

  get visible(): boolean {
    return this.objects.length > 0;
  }

  /** Shows the banner centred at `x`, with `title` big and `line` under it. */
  show(x: number, title: string, line: string, done: () => void): void {
    this.hide();
    const b = KIMBUNGA_BANNER;
    this.done = done;
    const dim = this.scene.add.rectangle(DESIGN.width / 2, DESIGN.height / 2, DESIGN.width, DESIGN.height, b.dim.color, b.dim.alpha).setInteractive();
    dim.on('pointerdown', () => this.finish());
    const word = this.scene.add
      .text(x, b.y, title, { ...textStyle(b.size, b.color), fontStyle: 'bold', stroke: b.stroke, strokeThickness: b.strokeWidth })
      .setShadow(b.shadow.x, b.shadow.y, b.shadow.color, b.shadow.blur, true, true)
      .setOrigin(0.5)
      .setName('kimbunga');
    const text = this.scene.add
      .text(x, word.y + word.height / 2 + b.lineGap, line, { ...textStyle(b.lineSize), align: 'center', fontStyle: 'bold' })
      .setOrigin(0.5, 0)
      .setName('kimbunga-line');
    this.objects.push(dim, word, text);
    for (const o of this.objects) o.setDepth(b.depth);
    word.setScale(b.fromScale);
    this.scene.tweens.add({ targets: word, scale: 1, duration: b.inMs, ease: 'Back.Out' });
    this.sparkles(x, b.y);
    getServices(this.scene).sound.play('kimbunga', SOUND_MIX.kimbunga);
    this.timer = this.scene.time.delayedCall(b.showMs, () => this.finish());
  }

  /** Gold stars bursting out from the word and fading. */
  private sparkles(x: number, y: number): void {
    const s = KIMBUNGA_BANNER.sparkles;
    for (let i = 0; i < s.count; i++) {
      const angle = (i / s.count) * Math.PI * 2;
      const star = this.scene.add
        .star(x + Math.cos(angle) * s.from, y + Math.sin(angle) * s.from, 5, s.inner, s.radius, s.colors[i % s.colors.length])
        .setDepth(KIMBUNGA_BANNER.depth + 1);
      this.scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * s.to,
        y: y + Math.sin(angle) * s.to,
        alpha: 0,
        angle: 180,
        duration: s.ms,
        ease: 'Cubic.Out',
        onComplete: () => star.destroy(),
      });
    }
  }

  /** Closes it now (a tap, the time is up, or Back) and runs `done` once. */
  finish(): void {
    const done = this.done;
    this.hide();
    done?.();
  }

  private hide(): void {
    this.timer?.remove();
    this.timer = null;
    this.done = null;
    for (const o of this.objects) o.destroy();
    this.objects = [];
  }
}
