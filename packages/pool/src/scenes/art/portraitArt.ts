import type * as Phaser from 'phaser';
import { PORTRAIT_ART } from '../../config/art';
import { PORTRAITS, type PortraitLook } from '../../config/portraits';
import { canvasTexture } from './canvasArt';

const P = PORTRAIT_ART;
const FULL = Math.PI * 2;

/** The head as drawn: centre, half-width and half-height in portrait units. */
interface Head {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
  /** 1, or smaller for a young face. */
  readonly s: number;
}

/**
 * A character's round portrait, `radius` design pixels, made once. The face comes from the
 * character's picture file when one was loaded (portraitFiles.ts), otherwise it is drawn (Milestone 9
 * Part B). Returns the texture key; an unknown id gets a plain disc so a damaged save never breaks a
 * screen.
 */
export function portraitTexture(scene: Phaser.Scene, id: string, radius: number): string {
  const size = Math.ceil(2 * radius * P.resolution);
  const fileKey = portraitFileKey(id);
  const picture = scene.textures.exists(fileKey) ? (scene.textures.get(fileKey).getSourceImage() as Picture) : null;
  return canvasTexture(scene, `portrait-${id}-${size}${picture ? '-file' : ''}`, size, size, (ctx, w) => {
    ctx.save();
    ctx.scale(w / P.unit, w / P.unit);
    if (picture) drawPortraitPicture(ctx, picture);
    else drawPortrait(ctx, PORTRAITS[id]);
    ctx.restore();
  });
}

/** A loaded picture file. */
export type Picture = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

/** Texture key of a character's loaded picture file. */
export function portraitFileKey(id: string): string {
  return `portrait-file-${id}`;
}

/**
 * A picture file as a portrait, in the same 100-unit frame as the drawing: the middle square of the
 * picture, cropped to the circle, with the same thin frame.
 */
export function drawPortraitPicture(ctx: CanvasRenderingContext2D, picture: Picture): void {
  const c = P.unit / 2;
  const w = picture.width;
  const h = picture.height;
  const side = Math.min(w, h);
  ctx.save();
  ellipse(ctx, c, c, c, c);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(picture, (w - side) / 2, (h - side) / 2, side, side, 0, 0, P.unit, P.unit);
  ctx.restore();
  frame(ctx);
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, FULL);
}

function fill(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * The drawn portrait in a 100-unit frame: round with a thin frame, or `square` with neither (the
 * starting picture files, which the game crops itself).
 */
export function drawPortrait(ctx: CanvasRenderingContext2D, look: PortraitLook | undefined, square = false): void {
  const c = P.unit / 2;
  ctx.save();
  if (square) {
    ctx.beginPath();
    ctx.rect(0, 0, P.unit, P.unit);
  } else ellipse(ctx, c, c, c, c);
  ctx.clip();
  fill(ctx, look?.background ?? '#444a50');
  if (look) {
    ctx.translate(P.zoomAt.x, P.zoomAt.y);
    ctx.scale(P.zoom, P.zoom);
    ctx.translate(-P.zoomAt.x, -P.zoomAt.y);
    const h = P.head;
    const s = look.young ? h.youngScale : 1;
    const head: Head = {
      x: h.x,
      y: h.y + (look.young ? h.youngDrop : 0),
      rx: (look.round ? h.roundRx : h.rx) * s,
      ry: (look.round ? h.roundRy : h.ry) * s,
      s,
    };
    // Back to front: body, hair behind the head, head, then everything on the face.
    body(ctx, look, head);
    if (look.hair === 'afro' && !look.headwear) {
      ellipse(ctx, head.x, head.y + P.afro.dy * s, P.afro.radius * s, P.afro.radius * s * 0.85);
      fill(ctx, look.hairColor);
    }
    faceShape(ctx, look, head);
    hair(ctx, look, head);
    if (look.beard) beard(ctx, look, head);
    eyes(ctx, look, head);
    nose(ctx, look, head);
    mouth(ctx, look, head);
    if (look.beard === 'moustache' || look.beard === 'full' || look.beard === 'goatee') moustache(ctx, look, head);
    if (look.glasses) glasses(ctx, look.glasses, head);
    if (look.headwear) headwear(ctx, look, head);
    if (look.earrings) {
      for (const side of [-1, 1]) {
        ellipse(ctx, head.x + side * head.rx, head.y + (P.ear.dy + P.earring.dy) * s, P.earring.radius, P.earring.radius);
        fill(ctx, look.earrings);
      }
    }
    if (look.chain) chain(ctx, look.chain);
  }
  ctx.restore();
  if (!square) frame(ctx);
}

function frame(ctx: CanvasRenderingContext2D): void {
  const c = P.unit / 2;
  ellipse(ctx, c, c, c - P.frame.width / 2, c - P.frame.width / 2);
  ctx.lineWidth = P.frame.width;
  ctx.strokeStyle = P.frame.color;
  ctx.stroke();
}

function body(ctx: CanvasRenderingContext2D, look: PortraitLook, head: Head): void {
  const n = P.neck;
  const sh = P.shoulders;
  ellipse(ctx, P.unit / 2, sh.y, sh.rx, sh.ry);
  fill(ctx, look.shirt);
  const half = look.round ? n.roundHalfWidth : n.halfWidth;
  ctx.fillStyle = look.skin;
  ctx.fillRect(head.x - half, n.top, 2 * half, n.bottom - n.top);
  // Shadow under the chin.
  ctx.fillStyle = P.skinShade;
  ctx.fillRect(head.x - half, n.top, 2 * half, (n.bottom - n.top) / 3);
  if (look.collar) {
    const top = sh.y - sh.ry;
    const cl = P.collar;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(head.x + side * half, top);
      ctx.lineTo(head.x + side * (half + cl.width), top + 1);
      ctx.lineTo(head.x + side * (half * 0.2), top + cl.depth);
      ctx.closePath();
      fill(ctx, look.collar);
    }
  }
}

function faceShape(ctx: CanvasRenderingContext2D, look: PortraitLook, head: Head): void {
  for (const side of [-1, 1]) {
    ellipse(ctx, head.x + side * head.rx, head.y + P.ear.dy * head.s, P.ear.radius * head.s, P.ear.radius * head.s * 1.2);
    fill(ctx, look.skin);
  }
  ellipse(ctx, head.x, head.y, head.rx, head.ry);
  fill(ctx, look.skin);
  const g = ctx.createRadialGradient(head.x - head.rx * 0.4, head.y - head.ry * 0.4, 0, head.x, head.y, head.ry * 1.1);
  g.addColorStop(0, P.skinLight);
  g.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
  g.addColorStop(1, P.skinShade);
  ellipse(ctx, head.x, head.y, head.rx, head.ry);
  fill(ctx, g as unknown as string);
}

/** Runs `draw` with drawing limited to the head. */
function onHead(ctx: CanvasRenderingContext2D, head: Head, draw: () => void): void {
  ctx.save();
  ellipse(ctx, head.x, head.y, head.rx, head.ry);
  ctx.clip();
  draw();
  ctx.restore();
}

/** Hair over the top of the head, down to a curved hairline `line` units from the head's centre. */
function hairCap(ctx: CanvasRenderingContext2D, head: Head, line: number, color: string, alpha = 1): void {
  onHead(ctx, head, () => {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(head.x - head.rx - 1, head.y);
    ctx.lineTo(head.x - head.rx - 1, head.y - head.ry - 1);
    ctx.lineTo(head.x + head.rx + 1, head.y - head.ry - 1);
    ctx.lineTo(head.x + head.rx + 1, head.y);
    ctx.quadraticCurveTo(head.x, head.y - line * 1.25, head.x - head.rx - 1, head.y);
    fill(ctx, color);
    ctx.globalAlpha = 1;
  });
}

function hair(ctx: CanvasRenderingContext2D, look: PortraitLook, head: Head): void {
  if (look.headwear && look.headwear.kind === 'wrap') return;
  const line = (P.head.y - P.hairline) * head.s;
  switch (look.hair) {
    case 'bald': {
      // A shine on the top of the head.
      ellipse(ctx, head.x - head.rx * 0.35, head.y - head.ry * 0.7, head.rx * 0.3, head.ry * 0.12);
      fill(ctx, P.skinLight);
      break;
    }
    case 'short':
      hairCap(ctx, head, line, look.hairColor);
      break;
    case 'fade':
      hairCap(ctx, head, line * 0.8, look.hairColor, 0.45);
      hairCap(ctx, head, line * 1.15, look.hairColor);
      break;
    case 'afro':
      hairCap(ctx, head, line * 0.95, look.hairColor);
      break;
    case 'cornrows': {
      hairCap(ctx, head, line, look.hairColor);
      onHead(ctx, head, () => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(head.x + i * head.rx * 0.22, head.y - head.ry);
          ctx.quadraticCurveTo(head.x + i * head.rx * 0.32, head.y - line, head.x + i * head.rx * 0.3, head.y - line * 0.55);
          ctx.stroke();
        }
      });
      break;
    }
    case 'greySides':
      onHead(ctx, head, () => {
        ctx.fillStyle = look.hairColor;
        const top = head.y - line;
        const height = line * 1.1;
        ctx.fillRect(head.x - head.rx - 1, top, head.rx * 0.32, height);
        ctx.fillRect(head.x + head.rx * 0.68 + 1, top, head.rx * 0.32, height);
      });
      break;
  }
}

function beard(ctx: CanvasRenderingContext2D, look: PortraitLook, head: Head): void {
  const b = P.beard;
  if (look.beard === 'stubble' || look.beard === 'full') {
    const full = look.beard === 'full';
    onHead(ctx, head, () => {
      ctx.globalAlpha = full ? 1 : b.stubbleAlpha;
      ctx.beginPath();
      const top = head.y + (full ? b.fullTop : b.stubbleTop) * head.s;
      const side = head.y + (full ? 4 : -2);
      ctx.moveTo(head.x - head.rx - 1, side);
      ctx.quadraticCurveTo(head.x, top + (full ? 2 : 6), head.x + head.rx + 1, side);
      ctx.lineTo(head.x + head.rx + 1, head.y + head.ry + 1);
      ctx.lineTo(head.x - head.rx - 1, head.y + head.ry + 1);
      ctx.closePath();
      fill(ctx, look.hairColor);
      ctx.globalAlpha = 1;
    });
    if (full) {
      // The beard hangs a little below the chin.
      ellipse(ctx, head.x, head.y + head.ry * 0.95, head.rx * 0.6, head.ry * 0.28);
      fill(ctx, look.hairColor);
    }
  } else if (look.beard === 'goatee') {
    ellipse(ctx, head.x, head.y + b.goateeDy * head.s, head.rx * 0.22, head.ry * 0.14);
    fill(ctx, look.hairColor);
  }
}

function moustache(ctx: CanvasRenderingContext2D, look: PortraitLook, head: Head): void {
  const y = head.y + P.beard.moustacheDy * head.s;
  const half = P.mouth.halfWidth * head.s * (look.beard === 'moustache' ? 1.15 : 0.95);
  ctx.beginPath();
  ctx.moveTo(head.x - half, y + 2);
  ctx.quadraticCurveTo(head.x - half * 0.5, y - 2.5, head.x, y - 0.8);
  ctx.quadraticCurveTo(head.x + half * 0.5, y - 2.5, head.x + half, y + 2);
  ctx.quadraticCurveTo(head.x, y + 0.6, head.x - half, y + 2);
  fill(ctx, look.beard === 'full' ? look.hairColor : '#141414');
}

function eyes(ctx: CanvasRenderingContext2D, look: PortraitLook, head: Head): void {
  const e = P.eyes;
  const grow = look.young ? e.youngGrow : 1;
  const y = head.y + e.dy * head.s;
  for (const side of [-1, 1]) {
    const x = head.x + side * e.dx * head.s;
    ellipse(ctx, x, y, e.rx * grow * head.s, e.ry * grow * head.s);
    fill(ctx, e.white);
    // A smirk looks sideways.
    const look_ = look.mouth === 'smirk' ? 1 : 0;
    ellipse(ctx, x + look_, y + 0.3, e.pupil * grow, e.pupil * grow);
    fill(ctx, e.dark);
    // Brows: angled down in the middle for a pout, raised for a grin.
    const b = P.brows;
    const by = y + b.dy * head.s + (look.mouth === 'grin' ? -1 : 0);
    const tilt = look.mouth === 'pout' ? 1.5 : look.mouth === 'smirk' && side === 1 ? -1.2 : 0;
    ctx.beginPath();
    ctx.moveTo(x - side * b.halfLength, by + tilt);
    ctx.lineTo(x + side * b.halfLength, by - tilt * 0.3);
    ctx.lineWidth = b.width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = look.hair === 'greySides' ? look.hairColor : e.dark;
    ctx.stroke();
  }
}

function nose(ctx: CanvasRenderingContext2D, look: PortraitLook, head: Head): void {
  const n = P.nose;
  const y = head.y + n.dy * head.s;
  const half = n.halfWidth * head.s * (look.round ? 1.15 : 1);
  ctx.beginPath();
  ctx.moveTo(head.x - half, y);
  ctx.quadraticCurveTo(head.x, y + n.depth * 1.6, head.x + half, y);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = P.skinShade;
  ctx.stroke();
}

function mouth(ctx: CanvasRenderingContext2D, look: PortraitLook, head: Head): void {
  const m = P.mouth;
  const x = head.x;
  const y = head.y + m.dy * head.s;
  const half = m.halfWidth * head.s;
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = m.lip;
  ctx.beginPath();
  switch (look.mouth) {
    case 'smile':
      ctx.moveTo(x - half, y - 1);
      ctx.quadraticCurveTo(x, y + 4, x + half, y - 1);
      ctx.stroke();
      break;
    case 'grin':
      ctx.moveTo(x - half * 1.15, y - 1.5);
      ctx.quadraticCurveTo(x, y + 7, x + half * 1.15, y - 1.5);
      ctx.closePath();
      fill(ctx, m.lip);
      ctx.beginPath();
      ctx.moveTo(x - half, y - 1);
      ctx.quadraticCurveTo(x, y + 1.2, x + half, y - 1);
      ctx.lineTo(x + half * 0.8, y + 1.5);
      ctx.quadraticCurveTo(x, y + 2.6, x - half * 0.8, y + 1.5);
      ctx.closePath();
      fill(ctx, m.teeth);
      break;
    case 'smirk':
      ctx.moveTo(x - half * 0.8, y + 0.5);
      ctx.quadraticCurveTo(x + half * 0.2, y + 1.6, x + half, y - 2);
      ctx.stroke();
      break;
    case 'pout':
      ellipse(ctx, x, y + 0.5, half * 0.42, 2.2);
      fill(ctx, m.lip);
      break;
    case 'calm':
      ctx.moveTo(x - half * 0.75, y);
      ctx.quadraticCurveTo(x, y + 1.4, x + half * 0.75, y);
      ctx.stroke();
      break;
  }
}

function glasses(ctx: CanvasRenderingContext2D, kind: 'clear' | 'dark', head: Head): void {
  const g = P.glasses;
  const y = head.y + P.eyes.dy * head.s;
  const r = g.radius * head.s;
  for (const side of [-1, 1]) {
    const x = head.x + side * P.eyes.dx * head.s;
    ellipse(ctx, x, y, r, r * 0.85);
    if (kind === 'dark') fill(ctx, g.dark);
    ctx.lineWidth = g.width;
    ctx.strokeStyle = g.frame;
    ctx.stroke();
    // A small glint on each lens.
    ellipse(ctx, x - r * 0.35, y - r * 0.3, r * 0.28, r * 0.16);
    fill(ctx, g.glint);
    // Arms to the ears.
    ctx.beginPath();
    ctx.moveTo(x + side * r, y - 1);
    ctx.lineTo(head.x + side * head.rx, y - 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(head.x - P.eyes.dx * head.s + r, y - 1);
  ctx.quadraticCurveTo(head.x, y - 3, head.x + P.eyes.dx * head.s - r, y - 1);
  ctx.stroke();
}

function headwear(ctx: CanvasRenderingContext2D, look: PortraitLook, head: Head): void {
  const hw = look.headwear!;
  const s = head.s;
  switch (hw.kind) {
    case 'cap':
    case 'capBack': {
      const c = P.cap;
      const cy = head.y + c.crownDy * s;
      ctx.beginPath();
      ctx.ellipse(head.x, cy, c.crownRx * s, c.crownRy * s, 0, Math.PI, FULL);
      ctx.closePath();
      fill(ctx, hw.color);
      if (hw.kind === 'cap') {
        // The peak, seen from the front.
        ellipse(ctx, head.x, head.y + c.brimDy * s, c.brimRx * s, c.brimRy * s);
        fill(ctx, hw.color);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fill();
        ellipse(ctx, head.x, cy - c.crownRy * s * 0.5, c.button * 1.8 * s, c.button * 1.5 * s);
        fill(ctx, hw.accent);
      } else {
        // Turned back: the strap opening and its band show at the front.
        ctx.fillStyle = hw.accent;
        ctx.fillRect(head.x - c.crownRx * s, cy - 2.5 * s, 2 * c.crownRx * s, 2.5 * s);
        ellipse(ctx, head.x, cy - c.crownRy * s * 0.45, c.crownRx * s * 0.28, c.crownRy * s * 0.25);
        fill(ctx, look.hairColor);
      }
      ellipse(ctx, head.x, cy - c.crownRy * s, c.button * s, c.button * s);
      fill(ctx, hw.accent);
      break;
    }
    case 'wrap': {
      const w = P.wrap;
      const cy = head.y + w.dy * s;
      ellipse(ctx, head.x, cy, w.rx * s, w.ry * s);
      fill(ctx, hw.color);
      // Folds and a printed pattern.
      ctx.save();
      ellipse(ctx, head.x, cy, w.rx * s, w.ry * s);
      ctx.clip();
      ctx.fillStyle = hw.accent;
      for (let i = 0; i < w.dots; i++) {
        const a = (i / w.dots) * Math.PI + Math.PI;
        ellipse(ctx, head.x + Math.cos(a) * w.rx * 0.6 * s, cy + Math.sin(a) * w.ry * 0.55 * s, 2.2, 2.2);
        ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = hw.accent;
      ctx.fillRect(head.x - w.rx * s * 0.95, cy + w.ry * s * 0.62, 2 * w.rx * s * 0.95, w.band * s * 0.6);
      ellipse(ctx, head.x + w.knot.rx * 0.6, head.y + w.knot.dy * s, w.knot.rx * s, w.knot.ry * s);
      fill(ctx, hw.color);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.stroke();
      break;
    }
    case 'kofia': {
      const k = P.kofia;
      const top = head.y + k.top * s;
      const bottom = head.y + k.bottom * s;
      const half = k.halfWidth * s;
      ctx.beginPath();
      ctx.moveTo(head.x - half, bottom);
      ctx.lineTo(head.x - half, top + 3);
      ctx.quadraticCurveTo(head.x, top - 2, head.x + half, top + 3);
      ctx.lineTo(head.x + half, bottom);
      ctx.quadraticCurveTo(head.x, bottom + 3, head.x - half, bottom);
      fill(ctx, hw.color);
      // Embroidered band: a zigzag in the accent colour.
      ctx.beginPath();
      const steps = 8;
      for (let i = 0; i <= steps; i++) {
        const x = head.x - half + (2 * half * i) / steps;
        const y = bottom - k.band * s + (i % 2 === 0 ? 0 : k.band * s * 0.6);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = hw.accent;
      ctx.stroke();
      break;
    }
  }
}

function chain(ctx: CanvasRenderingContext2D, color: string): void {
  const c = P.chain;
  const half = P.neck.halfWidth * 1.6;
  const x = P.unit / 2;
  ctx.beginPath();
  ctx.moveTo(x - half, c.y - c.sag * 0.5);
  ctx.quadraticCurveTo(x, c.y + c.sag, x + half, c.y - c.sag * 0.5);
  ctx.lineWidth = c.width;
  ctx.strokeStyle = color;
  ctx.stroke();
  ellipse(ctx, x, c.y + c.sag * 0.55, c.pendant, c.pendant);
  fill(ctx, color);
}
