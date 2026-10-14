import type * as Phaser from 'phaser';
import { BALL_ART } from '../../config/art';
import { COLORS } from '../../config/layout';
import type { BallKind } from '../../physics/types';
import { canvasTexture, css } from './canvasArt';

/** Room round a ball or shadow texture for the outline and blur, pixels. */
const PAD = 4;

/** A shaded ball of one kind and size (design pixels), drawn once. Reds carry a white spot. */
export function ballTexture(scene: Phaser.Scene, kind: BallKind, radius: number): string {
  const size = 2 * (radius + PAD);
  return canvasTexture(scene, `ball-${kind}-${radius.toFixed(2)}`, size, size, (ctx, w, h) => drawBall(ctx, w / 2, h / 2, radius, kind));
}

/**
 * A ball on the table in three layers, so a red ball's spot can roll between them (0.32.0): the
 * plain colour, then the spot (`ballSpotTexture`), then the light and shine (`ballShadeTexture`).
 */
export function ballBaseTexture(scene: Phaser.Scene, kind: BallKind, radius: number): string {
  const size = 2 * (radius + PAD);
  return canvasTexture(scene, `ball-base-${kind}-${radius.toFixed(2)}`, size, size, (ctx, w, h) => drawBallBase(ctx, w / 2, h / 2, radius, kind, false));
}

/** The red ball's white spot, facing the viewer; squashed and moved as the ball rolls. */
export function ballSpotTexture(scene: Phaser.Scene, radius: number): string {
  const r = radius * BALL_ART.redSpot.radius;
  const size = 2 * (r + PAD);
  return canvasTexture(scene, `ball-spot-${radius.toFixed(2)}`, size, size, (ctx, w, h) => {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
    ctx.fillStyle = BALL_ART.redSpot.color;
    ctx.fill();
  });
}

/** The light, edge, outline and shine over a ball, transparent elsewhere. */
export function ballShadeTexture(scene: Phaser.Scene, radius: number): string {
  const size = 2 * (radius + PAD);
  return canvasTexture(scene, `ball-shade-${radius.toFixed(2)}`, size, size, (ctx, w, h) => drawBallShade(ctx, w / 2, h / 2, radius));
}

/** Draws a shaded ball centred on (cx, cy); also used for the store pictures (scripts/storeArt.ts). */
export function drawBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, kind: BallKind): void {
  drawBallBase(ctx, cx, cy, radius, kind, true);
  drawBallShade(ctx, cx, cy, radius);
}

function drawBallBase(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, kind: BallKind, spot: boolean): void {
  const b = BALL_ART;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = css(COLORS.ball[kind]);
  ctx.fill();
  if (kind === 'red' && spot) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * b.redSpot.radius, 0, Math.PI * 2);
    ctx.fillStyle = b.redSpot.color;
    ctx.fill();
  }
}

function drawBallShade(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  const b = BALL_ART;
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
