import type * as Phaser from 'phaser';
import type { Character } from '../config/characters';
import { COLORS, TEXT_STYLE } from '../config/layout';
import { textStyle } from './ui';

/**
 * A character's face. PLACEHOLDER: a coloured circle with an initial until the art pass replaces it
 * with a drawn portrait (docs/ASSETS.md).
 */
export class Face {
  readonly circle: Phaser.GameObjects.Arc;
  readonly initial: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, radius: number, name: string) {
    this.circle = scene.add.circle(x, y, radius, COLORS.overlay).setName(name);
    // The letter scales with the face but never below the smallest readable text size.
    const size = Math.max(parseInt(TEXT_STYLE.labelSize, 10), Math.round(radius * 1.1));
    this.initial = scene.add.text(x, y, '', { ...textStyle(`${size}px`), fontStyle: 'bold' }).setOrigin(0.5);
  }

  show(character: Character): this {
    this.circle.setFillStyle(character.faceColor);
    this.initial.setText(character.initial);
    return this;
  }

  get objects(): (Phaser.GameObjects.Arc | Phaser.GameObjects.Text)[] {
    return [this.circle, this.initial];
  }

  setDepth(depth: number): this {
    this.circle.setDepth(depth);
    this.initial.setDepth(depth);
    return this;
  }

  setAlpha(alpha: number): this {
    this.circle.setAlpha(alpha);
    this.initial.setAlpha(alpha);
    return this;
  }

  destroy(): void {
    this.circle.destroy();
    this.initial.destroy();
  }
}
