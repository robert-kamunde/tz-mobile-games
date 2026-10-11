import type * as Phaser from 'phaser';

/**
 * Draws a texture once with the 2D canvas API (gradients, blur and paths that Phaser's Graphics
 * cannot do in every renderer). Returns the key; a texture that already exists is reused, so a
 * scene restart costs nothing.
 */
export function canvasTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
): string {
  if (scene.textures.exists(key)) return key;
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  const texture = scene.textures.createCanvas(key, w, h);
  if (!texture) throw new Error(`could not create texture ${key}`);
  draw(texture.context, w, h);
  texture.refresh();
  return key;
}

/** `0xrrggbb` to a CSS colour. */
export function css(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
