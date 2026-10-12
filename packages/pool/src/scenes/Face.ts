import type * as Phaser from 'phaser';
import type { Character } from '../config/characters';
import { COLORS } from '../config/layout';
import { portraitTexture } from './art/portraitArt';

/**
 * A character's face: their picture file, or drawn portrait without one, over a named circle. The circle is
 * what tests find and what the picker makes tappable; the portrait covers it.
 */
export class Face {
  readonly circle: Phaser.GameObjects.Arc;
  readonly portrait: Phaser.GameObjects.Image;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly radius: number,
    name: string,
  ) {
    this.circle = scene.add.circle(x, y, radius, COLORS.overlay).setName(name);
    this.portrait = scene.add.image(x, y, portraitTexture(scene, '', radius)).setDisplaySize(2 * radius, 2 * radius);
  }

  show(character: Character): this {
    const key = portraitTexture(this.scene, character.id, this.radius);
    this.portrait.setTexture(key).setDisplaySize(2 * this.radius, 2 * this.radius);
    this.circle.setData('character', character.id).setData('portrait', key);
    return this;
  }

  get objects(): (Phaser.GameObjects.Arc | Phaser.GameObjects.Image)[] {
    return [this.circle, this.portrait];
  }

  setDepth(depth: number): this {
    this.circle.setDepth(depth);
    this.portrait.setDepth(depth);
    return this;
  }

  setAlpha(alpha: number): this {
    this.circle.setAlpha(alpha);
    this.portrait.setAlpha(alpha);
    return this;
  }

  destroy(): void {
    this.circle.destroy();
    this.portrait.destroy();
  }
}
