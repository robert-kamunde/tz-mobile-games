import type * as Phaser from 'phaser';
import { UI_ART } from '../../config/art';
import { canvasTexture } from './canvasArt';

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, h / 2, w / 2)));
}

/** A vertical gradient from `top` to `bottom` over `y0..y1`. */
function vertical(ctx: CanvasRenderingContext2D, y0: number, y1: number, top: string, bottom: string): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
}

/**
 * A button's face, `width` × `height` design pixels: teal-green, or gold for main actions and the
 * current choice (0.32.0).
 */
export function buttonTexture(scene: Phaser.Scene, width: number, height: number, gold: boolean): string {
  const b = UI_ART.button;
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  return canvasTexture(scene, `button-${w}x${h}-${gold ? 'gold' : 'teal'}`, w, h, (ctx) => {
    const e = b.edge.width;
    const half = e / 2;
    const faceH = h - e - b.lip.height;
    // The lip: the whole shape in shadow, with the face drawn over all but its bottom.
    roundedRect(ctx, half, half, w - e, h - e, b.radius);
    ctx.fillStyle = b.lip.color;
    ctx.fill();
    const [top, bottom] = gold ? b.gold : b.face;
    roundedRect(ctx, half, half, w - e, faceH, b.radius);
    ctx.fillStyle = vertical(ctx, 0, faceH, top, bottom);
    ctx.fill();
    // Gloss over the top half.
    roundedRect(ctx, half + e, half + e, w - 3 * e, faceH / 2 - e, b.radius - e);
    ctx.fillStyle = b.gloss;
    ctx.fill();
    // Bevel: light inside the top edge, shade inside the bottom.
    const v = b.bevel;
    ctx.lineWidth = v.width;
    roundedRect(ctx, e + v.width / 2, e + v.width / 2, w - 2 * e - v.width, faceH - e - v.width, b.radius - e);
    ctx.strokeStyle = vertical(ctx, 0, faceH, v.light, v.dark);
    ctx.stroke();
    // Thin border: gold round the teal face, a dark gold round the gold one.
    ctx.lineWidth = e;
    ctx.strokeStyle = gold ? b.edge.goldColor : b.edge.color;
    roundedRect(ctx, half, half, w - e, h - e, b.radius);
    ctx.stroke();
  });
}

/**
 * A panel's box, `width` × `height` design pixels, fully opaque (the panel sets its own alpha): a
 * dark inside in a wooden frame with a gold edge (0.32.0).
 */
export function panelTexture(scene: Phaser.Scene, width: number, height: number): string {
  const p = UI_ART.panel;
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  return canvasTexture(scene, `panel-${w}x${h}`, w, h, (ctx) => {
    const half = p.edge.width / 2;
    const f = p.frame;
    // The wooden frame: the whole shape in wood, with fine grain running along it.
    roundedRect(ctx, half, half, w - p.edge.width, h - p.edge.width, p.radius);
    ctx.fillStyle = vertical(ctx, 0, h, f.light, f.dark);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = f.grain;
    ctx.lineWidth = 1;
    for (let y = f.grainSpacing / 2; y < h; y += f.grainSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      // A slight wave so it reads as grain, not stripes.
      ctx.bezierCurveTo(w / 3, y - 1.5, (2 * w) / 3, y + 1.5, w, y);
      ctx.stroke();
    }
    ctx.restore();
    // The dark inside.
    const i = f.width;
    roundedRect(ctx, i, i, w - 2 * i, h - 2 * i, p.radius - i / 2);
    ctx.fillStyle = vertical(ctx, i, h - i, p.top, p.bottom);
    ctx.fill();
    ctx.lineWidth = p.inner.width;
    ctx.strokeStyle = p.inner.color;
    ctx.stroke();
    // Gold round the outside.
    roundedRect(ctx, half, half, w - p.edge.width, h - p.edge.width, p.radius);
    ctx.lineWidth = p.edge.width;
    ctx.strokeStyle = p.edge.color;
    ctx.stroke();
  });
}

/**
 * A red ribbon for a panel's title, like the one on the logo: notched ends that fold back behind
 * it. `width` × `height` is the ribbon's front; the texture adds the folds below it.
 */
export function ribbonTexture(scene: Phaser.Scene, width: number, height: number): { key: string; width: number; height: number } {
  const r = UI_ART.panel.ribbon;
  const w = Math.ceil(width + 2 * r.notch);
  const h = Math.ceil(height + r.tailDrop);
  const key = canvasTexture(scene, `ribbon-${w}x${h}`, w, h, (ctx) => {
    const front = { left: r.notch, right: w - r.notch, top: 0, bottom: height };
    // The folded-back ends: a darker red, lower down, with a notch cut into the outer end.
    ctx.fillStyle = r.tail;
    for (const side of [-1, 1]) {
      const inner = side < 0 ? front.left + r.notch : front.right - r.notch;
      const outer = side < 0 ? 0 : w;
      ctx.beginPath();
      ctx.moveTo(inner, r.tailDrop);
      ctx.lineTo(outer, r.tailDrop);
      ctx.lineTo(outer + side * -r.notch * 0.7, r.tailDrop + height / 2);
      ctx.lineTo(outer, h);
      ctx.lineTo(inner, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.rect(front.left, front.top + r.edgeWidth / 2, front.right - front.left, height - r.edgeWidth);
    ctx.fillStyle = vertical(ctx, 0, height, r.top, r.bottom);
    ctx.fill();
    ctx.lineWidth = r.edgeWidth;
    ctx.strokeStyle = r.edge;
    ctx.stroke();
  });
  return { key, width: w, height: h };
}
