import type * as Phaser from 'phaser';
import { createRandom, type Random } from '@tzg/core';
import { BACKGROUND_ART } from '../../config/art';
import type { BackgroundPalette, BackgroundStyle } from '../../config/backgrounds';
import { DESIGN } from '../../config/layout';
import { canvasTexture } from './canvasArt';

const KEY_PREFIX = 'pool-bg-';

/** Where the table sits, for the picker's small pictures (design pixels, rails included). */
export interface PreviewTable {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * A background filling the design screen, drawn once into a texture. `preview` draws the small picker
 * copy at `BACKGROUND_ART.previewScale` with a plain table on it.
 */
export function backgroundTexture(scene: Phaser.Scene, style: BackgroundStyle, preview?: PreviewTable): string {
  const scale = preview ? BACKGROUND_ART.previewScale : 1;
  const key = `${KEY_PREFIX}${style.id}${preview ? '-preview' : ''}`;
  return canvasTexture(scene, key, DESIGN.width * scale, DESIGN.height * scale, (ctx) => {
    ctx.scale(scale, scale);
    drawBackground(ctx, style);
    if (preview) {
      const t = BACKGROUND_ART.previewTable;
      ctx.fillStyle = t.rail;
      ctx.fillRect(preview.left, preview.top, preview.width, preview.height);
      const rail = preview.height * 0.06;
      ctx.fillStyle = t.felt;
      ctx.fillRect(preview.left + rail, preview.top + rail, preview.width - 2 * rail, preview.height - 2 * rail);
    }
  });
}

const SCENE_PREFIX = 'pool-scene-';

/**
 * The background with the table drawn on it, as one screen-sized texture. Drawing them as two images
 * would cover most of the screen twice every frame, which a slow phone's GPU (and the test browser's
 * software renderer) feels; one image costs the same as the table alone. The separate background and
 * table textures are freed once combined.
 */
export function sceneTexture(scene: Phaser.Scene, style: BackgroundStyle, tableKey: () => string, tableAt: { x: number; y: number }, tableId: string): string {
  const key = `${SCENE_PREFIX}${tableId}-${style.id}-${Math.round(tableAt.x)}`;
  if (scene.textures.exists(key)) return key;
  const background = backgroundTexture(scene, style);
  const table = tableKey();
  canvasTexture(scene, key, DESIGN.width, DESIGN.height, (ctx) => {
    ctx.drawImage(scene.textures.get(background).getSourceImage() as CanvasImageSource, 0, 0);
    ctx.drawImage(scene.textures.get(table).getSourceImage() as CanvasImageSource, tableAt.x, tableAt.y);
  });
  scene.textures.remove(background);
  scene.textures.remove(table);
  return key;
}

/** Frees the combined background-and-table textures other than `keep` (each is several megabytes of video memory). */
export function dropOtherSceneTextures(scene: Phaser.Scene, keep: string): void {
  for (const key of scene.textures.getTextureKeys()) {
    if (key.startsWith(SCENE_PREFIX) && key !== keep) scene.textures.remove(key);
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, style: BackgroundStyle): void {
  const w = DESIGN.width;
  const h = DESIGN.height;
  const p = style.palette;
  const random = createRandom(BACKGROUND_ART.seed);
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, w, h);
  switch (style.kind) {
    case 'plain':
      break;
    case 'planks':
      drawPlanks(ctx, p, random);
      break;
    case 'kanga':
      drawKanga(ctx, p);
      break;
    case 'sea':
      drawSea(ctx, p);
      break;
    case 'stars':
      drawStars(ctx, p, random);
      break;
    case 'weave':
      drawWeave(ctx, p);
      break;
    case 'trophies':
      drawTrophies(ctx, p, random);
      break;
  }
  // Vignette, then the washes behind the text.
  const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.7);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, `rgba(0, 0, 0, ${BACKGROUND_ART.vignette.alpha})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  const b = BACKGROUND_ART.textBands;
  ctx.save();
  ctx.globalAlpha = b.alpha;
  const top = ctx.createLinearGradient(0, 0, 0, b.topEnd + b.fade);
  top.addColorStop(0, b.color);
  top.addColorStop(b.topEnd / (b.topEnd + b.fade), b.color);
  top.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, b.topEnd + b.fade);
  const bottom = ctx.createLinearGradient(0, b.bottomStart - b.fade, 0, h);
  bottom.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottom.addColorStop(b.fade / (h - b.bottomStart + b.fade), b.color);
  bottom.addColorStop(1, b.color);
  ctx.fillStyle = bottom;
  ctx.fillRect(0, b.bottomStart - b.fade, w, h - b.bottomStart + b.fade);
  ctx.restore();
}

/** Vertical planks in two shades with grain, dark gaps and a nail at each end. */
function drawPlanks(ctx: CanvasRenderingContext2D, p: BackgroundPalette, random: Random): void {
  const c = BACKGROUND_ART.planks;
  const h = DESIGN.height;
  for (let x = 0, i = 0; x < DESIGN.width; x += c.width, i++) {
    const g = ctx.createLinearGradient(x, 0, x + c.width, 0);
    g.addColorStop(0, i % 2 ? p.base : p.light);
    g.addColorStop(1, p.dark);
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, c.width, h);
    ctx.fillStyle = p.accent2;
    ctx.fillRect(x, 0, c.gap, h);
    ctx.fillStyle = p.accent;
    for (const y of [c.nailInset, h - c.nailInset]) {
      ctx.beginPath();
      ctx.arc(x + c.width / 2, y, c.nailRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = p.dark;
  ctx.globalAlpha = c.grainAlpha;
  for (let i = 0; i < c.grainLines; i++) {
    const x = random.next() * DESIGN.width;
    const sway = (random.next() - 0.5) * 6;
    ctx.lineWidth = 0.5 + random.next();
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + sway, h / 3, x - sway, (2 * h) / 3, x + sway / 2, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** A kanga: printed borders of diamonds and dots along the top and bottom, a dotted middle. */
function drawKanga(ctx: CanvasRenderingContext2D, p: BackgroundPalette): void {
  const c = BACKGROUND_ART.kanga;
  const w = DESIGN.width;
  const h = DESIGN.height;
  ctx.fillStyle = p.light;
  for (let y = c.border + c.dotSpacing / 2; y < h - c.border; y += c.dotSpacing) {
    for (let x = c.dotSpacing / 2; x < w; x += c.dotSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, c.dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const top of [0, h - c.border]) {
    ctx.fillStyle = p.dark;
    ctx.fillRect(0, top, w, c.border);
    ctx.fillStyle = p.accent;
    ctx.fillRect(0, top + 4, w, 3);
    ctx.fillRect(0, top + c.border - 7, w, 3);
    const mid = top + c.border / 2;
    const r = c.border * 0.3;
    for (let x = c.motifSpacing / 2; x < w + r; x += c.motifSpacing) {
      ctx.fillStyle = p.accent2;
      ctx.beginPath();
      ctx.moveTo(x - r, mid);
      ctx.lineTo(x, mid - r);
      ctx.lineTo(x + r, mid);
      ctx.lineTo(x, mid + r);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.arc(x, mid, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + c.motifSpacing / 2, mid, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** The sea at night: a sky fading to the horizon, a moon, waves and dhow sails along the bottom. */
function drawSea(ctx: CanvasRenderingContext2D, p: BackgroundPalette): void {
  const c = BACKGROUND_ART.sea;
  const w = DESIGN.width;
  const h = DESIGN.height;
  const sky = ctx.createLinearGradient(0, 0, 0, c.horizonY);
  sky.addColorStop(0, p.dark);
  sky.addColorStop(1, p.light);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, c.horizonY);
  ctx.fillStyle = p.base;
  ctx.fillRect(0, c.horizonY, w, h - c.horizonY);
  ctx.strokeStyle = p.light;
  ctx.lineWidth = 1.5;
  for (let y = c.horizonY + c.waveSpacing / 2, row = 0; y < h; y += c.waveSpacing, row++) {
    ctx.beginPath();
    for (let x = (row % 2) * 10; x < w; x += 20) {
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 5, y - 3, x + 10, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.arc(c.moon.x, c.moon.y, c.moon.radius, 0, Math.PI * 2);
  ctx.fill();
  // A crescent: the sky's colour bites into the moon.
  ctx.fillStyle = p.dark;
  ctx.beginPath();
  ctx.arc(c.moon.x - c.moon.radius * 0.45, c.moon.y - c.moon.radius * 0.2, c.moon.radius * 0.9, 0, Math.PI * 2);
  ctx.fill();
  // A dhow: a hull and its slanted lateen sail.
  const s = c.dhowSize;
  for (const x of c.dhows) {
    const y = c.horizonY + s * 1.6;
    ctx.fillStyle = p.accent2;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.7, y);
    ctx.lineTo(x + s * 0.7, y);
    ctx.lineTo(x + s * 0.5, y + s * 0.25);
    ctx.lineTo(x - s * 0.5, y + s * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - s * 0.1, y);
    ctx.lineTo(x - s * 0.7, y - s * 1.1);
    ctx.lineTo(x + s * 0.55, y - s * 0.2);
    ctx.closePath();
    ctx.fill();
  }
}

/** A starry sky over the savanna: stars everywhere, flat-topped acacia trees in the bottom corners. */
function drawStars(ctx: CanvasRenderingContext2D, p: BackgroundPalette, random: Random): void {
  const c = BACKGROUND_ART.stars;
  const w = DESIGN.width;
  const h = DESIGN.height;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, p.dark);
  sky.addColorStop(0.7, p.base);
  sky.addColorStop(1, p.light);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = p.accent;
  for (let i = 0; i < c.count; i++) {
    ctx.globalAlpha = 0.4 + random.next() * 0.6;
    ctx.beginPath();
    ctx.arc(random.next() * w, random.next() * h, 0.5 + random.next() * (c.maxRadius - 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = p.accent2;
  ctx.fillRect(0, h - 10, w, 10);
  const t = c.treeHeight;
  for (const x of c.trees) {
    ctx.fillRect(x - 2, h - t, 4, t);
    ctx.beginPath();
    ctx.ellipse(x, h - t, t * 0.6, t * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Woven palm leaves (makuti): over-and-under strips both ways. */
function drawWeave(ctx: CanvasRenderingContext2D, p: BackgroundPalette): void {
  const s = BACKGROUND_ART.weave.strip;
  const w = DESIGN.width;
  const h = DESIGN.height;
  for (let y = 0, row = 0; y < h; y += s, row++) {
    for (let x = 0, col = 0; x < w; x += s, col++) {
      const across = (row + col) % 2 === 0;
      const g = across ? ctx.createLinearGradient(x, y, x, y + s) : ctx.createLinearGradient(x, y, x + s, y);
      g.addColorStop(0, p.dark);
      g.addColorStop(0.5, across ? p.light : p.base);
      g.addColorStop(1, p.dark);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, s, s);
      ctx.strokeStyle = p.accent2;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
    }
  }
  ctx.fillStyle = p.accent;
  ctx.globalAlpha = 0.5;
  for (let y = s / 2; y < h; y += 2 * s) ctx.fillRect(0, y, w, 1);
  ctx.globalAlpha = 1;
}

/** Story mode's reward: a dark wine wall with rows of gold cups and a few sparkles. */
function drawTrophies(ctx: CanvasRenderingContext2D, p: BackgroundPalette, random: Random): void {
  const c = BACKGROUND_ART.trophies;
  const w = DESIGN.width;
  const h = DESIGN.height;
  const wall = ctx.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, p.dark);
  wall.addColorStop(0.5, p.light);
  wall.addColorStop(1, p.dark);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);
  for (const y of c.rows) {
    // A shelf, then cups standing on it.
    ctx.fillStyle = p.accent2;
    ctx.fillRect(0, y, w, c.shelf);
    for (let x = c.spacing / 2; x < w; x += c.spacing) drawCup(ctx, x, y, c.cupHeight, p.accent, p.accent2);
  }
  ctx.fillStyle = p.accent;
  for (let i = 0; i < c.sparkles; i++) {
    ctx.globalAlpha = 0.3 + random.next() * 0.5;
    ctx.beginPath();
    ctx.arc(random.next() * w, random.next() * h, 0.6 + random.next(), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A cup standing on `baseY`: base, stem, bowl and two handles, shaded from `light` to `dark`. */
export function drawCup(ctx: CanvasRenderingContext2D, x: number, baseY: number, height: number, light: string, dark: string): void {
  const g = ctx.createLinearGradient(x - height / 2, 0, x + height / 2, 0);
  g.addColorStop(0, dark);
  g.addColorStop(0.4, light);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.strokeStyle = g;
  const s = height / 10;
  ctx.fillRect(x - 3 * s, baseY - s, 6 * s, s);
  ctx.fillRect(x - s / 2, baseY - 4 * s, s, 3 * s);
  ctx.beginPath();
  ctx.moveTo(x - 3.5 * s, baseY - height);
  ctx.lineTo(x + 3.5 * s, baseY - height);
  ctx.quadraticCurveTo(x + 3.5 * s, baseY - 4 * s, x, baseY - 4 * s);
  ctx.quadraticCurveTo(x - 3.5 * s, baseY - 4 * s, x - 3.5 * s, baseY - height);
  ctx.fill();
  ctx.lineWidth = s * 0.8;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * 3.5 * s, baseY - height + 2.2 * s, 1.6 * s, side < 0 ? Math.PI / 2 : -Math.PI / 2, side < 0 ? (3 * Math.PI) / 2 : Math.PI / 2, side > 0);
    ctx.stroke();
  }
}
