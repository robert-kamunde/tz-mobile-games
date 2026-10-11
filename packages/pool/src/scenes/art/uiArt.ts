import type * as Phaser from 'phaser';
import { UI_ART } from '../../config/art';
import { canvasTexture } from './canvasArt';

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, h / 2, w / 2));
}

/** A button's face, `width` × `height` design pixels. */
export function buttonTexture(scene: Phaser.Scene, width: number, height: number, highlighted: boolean): string {
  const b = UI_ART.button;
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  return canvasTexture(scene, `button-${w}x${h}-${highlighted ? 'on' : 'off'}`, w, h, (ctx) => {
    const half = b.edge.width / 2;
    // The lip: the whole shape in shadow, with the face drawn over all but its bottom.
    roundedRect(ctx, half, half, w - b.edge.width, h - b.edge.width, b.radius);
    ctx.fillStyle = b.lip.color;
    ctx.fill();
    const [top, bottom] = highlighted ? b.highlight : b.face;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    roundedRect(ctx, half, half, w - b.edge.width, h - b.edge.width - b.lip.height, b.radius);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = b.edge.width;
    ctx.strokeStyle = b.edge.color;
    roundedRect(ctx, half, half, w - b.edge.width, h - b.edge.width, b.radius);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(b.radius, b.edge.width + 1);
    ctx.lineTo(w - b.radius, b.edge.width + 1);
    ctx.strokeStyle = b.shine;
    ctx.stroke();
  });
}

/** A panel's box, `width` × `height` design pixels, fully opaque (the panel sets its own alpha). */
export function panelTexture(scene: Phaser.Scene, width: number, height: number): string {
  const p = UI_ART.panel;
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  return canvasTexture(scene, `panel-${w}x${h}`, w, h, (ctx) => {
    const half = p.edge.width / 2;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, p.top);
    g.addColorStop(1, p.bottom);
    roundedRect(ctx, half, half, w - p.edge.width, h - p.edge.width, p.radius);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = p.edge.width;
    ctx.strokeStyle = p.edge.color;
    ctx.stroke();
    const i = p.inner.inset;
    roundedRect(ctx, i, i, w - 2 * i, h - 2 * i, p.radius - i);
    ctx.lineWidth = p.inner.width;
    ctx.strokeStyle = p.inner.color;
    ctx.stroke();
  });
}
