import type * as Phaser from 'phaser';
import { CONTROLS_ART } from '../../config/art';
import { POWER_BAR } from '../../config/layout';
import { canvasTexture } from './canvasArt';
import { roundRect } from './tableArt';

/** Power bar track: a dark rounded slot with an inner shadow. */
export function powerTrackTexture(scene: Phaser.Scene): string {
  const t = CONTROLS_ART.track;
  return canvasTexture(scene, 'power-track', POWER_BAR.width, POWER_BAR.height, (ctx, w, h) => {
    const r = w / 2;
    roundRect(ctx, 0, 0, w, h, r);
    ctx.fillStyle = t.color;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.shadowColor = t.innerShadow;
    ctx.shadowBlur = t.innerShadowBlur;
    ctx.lineWidth = t.innerShadowWidth;
    ctx.strokeStyle = t.innerShadow;
    // A thick stroke just outside the edge casts its blur inwards.
    const o = t.innerShadowWidth / 2;
    roundRect(ctx, -o, -o, w + 2 * o, h + 2 * o, r);
    ctx.stroke();
    ctx.restore();
    ctx.lineWidth = t.borderWidth;
    ctx.strokeStyle = t.border;
    roundRect(ctx, t.borderWidth / 2, t.borderWidth / 2, w - t.borderWidth, h - t.borderWidth, r);
    ctx.stroke();
  });
}

/** The power fill at full power; the bar shows the top part of it, cropped to the pull. */
export function powerFillTexture(scene: Phaser.Scene): string {
  const stops = CONTROLS_ART.powerFill;
  return canvasTexture(scene, 'power-fill', POWER_BAR.width, POWER_BAR.height, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    stops.forEach((color, i) => g.addColorStop(i / (stops.length - 1), color));
    roundRect(ctx, 0, 0, w, h, w / 2);
    ctx.fillStyle = g;
    ctx.fill();
  });
}

/** The grip the player pulls: a rounded bar with ridges. */
export function powerHandleTexture(scene: Phaser.Scene, width: number, height: number): string {
  const c = CONTROLS_ART.handle;
  return canvasTexture(scene, 'power-handle', width, height, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, c.light);
    g.addColorStop(1, c.dark);
    roundRect(ctx, 0, 0, w, h, c.radius);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = c.ridge;
    ctx.lineWidth = c.ridgeWidth;
    for (let i = 1; i <= c.ridges; i++) {
      const y = (h * i) / (c.ridges + 1);
      ctx.beginPath();
      ctx.moveTo(w * c.ridgeInset, y);
      ctx.lineTo(w * (1 - c.ridgeInset), y);
      ctx.stroke();
    }
  });
}

/** The cue-tip marker on the spin face. */
export function spinTipTexture(scene: Phaser.Scene, radius: number): string {
  const c = CONTROLS_ART.spinTip;
  const size = 2 * (radius + c.edgeWidth);
  return canvasTexture(scene, `spin-tip-${radius}`, size, size, (ctx, w, h) => {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.lineWidth = c.edgeWidth;
    ctx.strokeStyle = c.edge;
    ctx.stroke();
  });
}
