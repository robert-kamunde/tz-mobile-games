import type * as Phaser from 'phaser';
import { BALL_ART } from '../../config/art';
import { COLORS } from '../../config/layout';
import type { BallKind } from '../../physics/types';
import { canvasTexture, css } from './canvasArt';

/** Room round a ball or shadow texture for the outline and blur, pixels. */
const PAD = 4;

/** A shaded ball of one kind and size (design pixels), drawn once. Reds carry a white spot. */
export function ballTexture(scene: Phaser.Scene, kind: BallKind, radius: number): string {
  const b = BALL_ART;
  const size = 2 * (radius + PAD);
  return canvasTexture(scene, `ball-${kind}-${radius.toFixed(2)}`, size, size, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = css(COLORS.ball[kind]);
    ctx.fill();
    if (kind === 'red') {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * b.redSpot.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.redSpot.color;
      ctx.fill();
    }
    // Light from the top left: a soft highlight over the colour and a darker edge.
    const hx = cx - radius * b.highlightOffset;
    const hy = cy - radius * b.highlightOffset;
    const shade = ctx.createRadialGradient(hx, hy, 0, cx, cy, radius);
    shade.addColorStop(0, b.highlightColor);
    shade.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
    shade.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
    shade.addColorStop(1, b.edgeShade);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.lineWidth = b.outline.width;
    ctx.strokeStyle = b.outline.color;
    ctx.stroke();
    const sx = cx - radius * b.shine.offset;
    const sy = cy - radius * b.shine.offset;
    const shine = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * b.shine.radius);
    shine.addColorStop(0, b.shine.color);
    shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shine;
    ctx.fillRect(sx - radius, sy - radius, 2 * radius, 2 * radius);
  });
}

/** The soft shadow a ball casts on the cloth. */
export function ballShadowTexture(scene: Phaser.Scene, radius: number): string {
  const s = BALL_ART.shadow;
  const size = 2 * (radius * s.scale + PAD + s.blur);
  return canvasTexture(scene, `ball-shadow-${radius.toFixed(2)}`, size, size, (ctx, w, h) => {
    ctx.filter = `blur(${s.blur / 2}px)`;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius * s.scale, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.filter = 'none';
  });
}
