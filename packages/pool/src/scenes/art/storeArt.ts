import { LOGO_ART, PORTRAIT_ART, STORE_ART } from '../../config/art';
import { DESIGN } from '../../config/layout';
import { PORTRAITS } from '../../config/portraits';
import { drawBall } from './ballArt';
import { drawLogo, drawMenuBar, eightBall } from './menuArt';
import { drawPortrait, drawPortraitPicture } from './portraitArt';

/**
 * The app icon, splash screens and store pictures (Part C), drawn with the game's own art so they
 * match it. Not part of the game: `scripts/makeAppIcons.mjs` bundles this file, runs it in a
 * browser and saves the pictures. Every function draws onto a canvas of the size it is given.
 * `scripts/portraits.mjs` uses it too, for the starting face picture files.
 */
export type IconShape = 'square' | 'round' | 'foreground';

const S = STORE_ART;
const GAME_NAME = 'Bongo Pool Table';

/** The picture file rules, for the script. */
export { PORTRAIT_FILES } from '../../config/art';

/** Every character with a face. */
export const PORTRAIT_IDS = Object.keys(PORTRAITS);

/** Face picture files the script handed over, by character id; the rest are drawn. */
const pictures: Record<string, HTMLImageElement> = {};

/** For the script: use this picture file (a data URL) for a character's face in the store pictures. */
export async function usePortraitPicture(id: string, url: string): Promise<void> {
  const image = new Image();
  image.src = url;
  await image.decode();
  pictures[id] = image;
}

/** For the script: a character's drawn face as a square PNG data URL, the starting picture file. */
export function renderDrawnPortrait(id: string, size: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(size / PORTRAIT_ART.unit, size / PORTRAIT_ART.unit);
  drawPortrait(ctx, PORTRAITS[id], true);
  return canvas.toDataURL('image/png');
}

function felt(ctx: CanvasRenderingContext2D, size: number): CanvasGradient {
  const g = ctx.createRadialGradient(size * 0.45, size * 0.35, 0, size / 2, size / 2, size * 0.75);
  g.addColorStop(0, S.felt.light);
  g.addColorStop(1, S.felt.dark);
  return g;
}

function iconBalls(ctx: CanvasRenderingContext2D, size: number, scale: number): void {
  const at = (b: { x: number; y: number; r: number }) => ({
    x: size / 2 + (b.x - 0.5) * size * scale,
    y: size / 2 + (b.y - 0.5) * size * scale,
    r: b.r * size * scale,
  });
  for (const [kind, b] of [['red', S.iconBalls.red], ['yellow', S.iconBalls.yellow]] as const) {
    const p = at(b);
    shadow(ctx, p.x, p.y, p.r);
    drawBall(ctx, p.x, p.y, p.r, kind);
  }
  const e = at(S.iconBalls.eight);
  shadow(ctx, e.x, e.y, e.r);
  eightBall(ctx, e.x, e.y, e.r);
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = S.ballShadow;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.12, y + r * 0.9, r * 0.95, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawIcon(ctx: CanvasRenderingContext2D, size: number, shape: IconShape): void {
  if (shape !== 'foreground') {
    ctx.beginPath();
    if (shape === 'round') ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    else ctx.roundRect(0, 0, size, size, size * S.iconCorner);
    ctx.fillStyle = felt(ctx, size);
    ctx.fill();
  }
  iconBalls(ctx, size, shape === 'foreground' ? S.foregroundScale : 1);
}

/** The menu's bar picture, scaled to cover w × h and centred. */
function barCover(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const bar = document.createElement('canvas');
  bar.width = DESIGN.width;
  bar.height = DESIGN.height;
  drawMenuBar(bar.getContext('2d')!, DESIGN.width, DESIGN.height);
  const k = Math.max(w / DESIGN.width, h / DESIGN.height);
  ctx.drawImage(bar, (w - DESIGN.width * k) / 2, (h - DESIGN.height * k) / 2, DESIGN.width * k, DESIGN.height * k);
}

/** The logo `width` pixels wide, centred on (x, y). */
function logo(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
  const k = width / LOGO_ART.width;
  ctx.save();
  ctx.translate(x - width / 2, y - (LOGO_ART.height * k) / 2);
  ctx.scale(k, k);
  drawLogo(ctx, LOGO_ART.width, GAME_NAME);
  ctx.restore();
}

export function drawSplash(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  barCover(ctx, w, h);
  ctx.fillStyle = S.splashShade;
  ctx.fillRect(0, 0, w, h);
  logo(ctx, w / 2, h / 2, w * (w >= h ? S.splashLogoWidth.landscape : S.splashLogoWidth.portrait));
}

export function drawFeatureGraphic(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const f = S.feature;
  barCover(ctx, w, h);
  const shade = ctx.createLinearGradient(0, 0, w, 0);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  shade.addColorStop(0.6, 'rgba(0, 0, 0, 0.15)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  const logoW = w * f.logoWidth;
  const logoX = w * 0.04 + logoW / 2;
  logo(ctx, logoX, h * 0.42, logoW);
  ctx.font = `700 ${Math.round(h * 0.07)}px ${LOGO_ART.font}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = f.taglineColor;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 8;
  ctx.fillText(f.tagline, logoX, h * 0.42 + (LOGO_ART.height * logoW) / LOGO_ART.width / 2 + h * 0.1);
  ctx.shadowColor = 'rgba(0, 0, 0, 0)';
  // Three characters, overlapping, on the right.
  const r = h * f.faceRadius;
  f.faces.forEach((id, i) => {
    const cx = w * 0.66 + i * r * 1.45;
    const cy = h * 0.58 + (i === 1 ? -r * 0.35 : 0);
    ctx.save();
    ctx.translate(cx - r, cy - r);
    ctx.scale((2 * r) / 100, (2 * r) / 100);
    const picture = pictures[id];
    if (picture) drawPortraitPicture(ctx, picture);
    else drawPortrait(ctx, PORTRAITS[id]);
    ctx.restore();
  });
}

/** For the script: draws one picture onto a new canvas and returns it as a PNG data URL. */
export function render(kind: 'icon' | 'round' | 'foreground' | 'splash' | 'feature', w: number, h: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  if (kind === 'icon') drawIcon(ctx, w, 'square');
  else if (kind === 'round') drawIcon(ctx, w, 'round');
  else if (kind === 'foreground') drawIcon(ctx, w, 'foreground');
  else if (kind === 'splash') drawSplash(ctx, w, h);
  else drawFeatureGraphic(ctx, w, h);
  return canvas.toDataURL('image/png');
}
