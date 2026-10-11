import type * as Phaser from 'phaser';
import { CUE_ART } from '../../config/art';
import { CUE_STICK } from '../../config/layout';
import { canvasTexture } from './canvasArt';

export const CUE_TEXTURE = 'cue-stick';
export const CUE_SHADOW_TEXTURE = 'cue-stick-shadow';

/** Thickness at a distance from the tip: the cue tapers from tip to butt. */
function halfWidth(x: number, length: number): number {
  return (CUE_ART.tipWidth + ((CUE_ART.buttWidth - CUE_ART.tipWidth) * x) / length) / 2;
}

/**
 * The cue, drawn lying along x with the tip at x = 0 and tapering to the butt: tip, ferrule, maple
 * shaft, dark butt wood, a grip wrap with a stripe, and a cap.
 */
export function cueTexture(scene: Phaser.Scene): string {
  const c = CUE_ART;
  const length = CUE_STICK.length;
  return canvasTexture(scene, CUE_TEXTURE, length, c.buttWidth, (ctx, w, h) => {
    const mid = h / 2;
    const half = (x: number) => halfWidth(x, w);
    const body = (from: number, to: number) => {
      ctx.beginPath();
      ctx.moveTo(from, mid - half(from));
      ctx.lineTo(to, mid - half(to));
      ctx.lineTo(to, mid + half(to));
      ctx.lineTo(from, mid + half(from));
      ctx.closePath();
    };
    const band = (from: number, to: number, light: string, dark: string) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, dark);
      g.addColorStop(0.4, light);
      g.addColorStop(1, dark);
      ctx.fillStyle = g;
      body(from, to);
      ctx.fill();
    };
    const buttStart = w * c.buttStart;
    band(0, c.tip.length, c.tip.color, c.tip.color);
    band(c.tip.length, c.tip.length + c.ferrule.length, c.ferrule.color, c.ferrule.color);
    band(c.tip.length + c.ferrule.length, buttStart, c.shaft.light, c.shaft.dark);
    band(buttStart, w - c.buttCap.length, c.butt.light, c.butt.dark);
    band(w * c.wrap.start, w * c.wrap.end, c.wrap.color, c.wrap.color);
    const stripe = (w * (c.wrap.start + c.wrap.end)) / 2;
    band(stripe - 1, stripe + 1, c.wrap.stripe, c.wrap.stripe);
    band(w - c.buttCap.length, w, c.buttCap.color, c.buttCap.color);
  });
}

/** The cue's outline in black, for its shadow on the table. */
export function cueShadowTexture(scene: Phaser.Scene): string {
  const length = CUE_STICK.length;
  return canvasTexture(scene, CUE_SHADOW_TEXTURE, length, CUE_ART.buttWidth, (ctx, w, h) => {
    const mid = h / 2;
    ctx.beginPath();
    ctx.moveTo(0, mid - halfWidth(0, w));
    ctx.lineTo(w, mid - halfWidth(w, w));
    ctx.lineTo(w, mid + halfWidth(w, w));
    ctx.lineTo(0, mid + halfWidth(0, w));
    ctx.closePath();
    ctx.fillStyle = '#000000';
    ctx.fill();
  });
}
