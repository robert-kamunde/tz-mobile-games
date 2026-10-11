import type * as Phaser from 'phaser';
import { CUE_ART } from '../../config/art';
import type { CueDecor, CueStyle } from '../../config/cues';
import { CUE_STICK } from '../../config/layout';
import { canvasTexture } from './canvasArt';

export const CUE_SHADOW_TEXTURE = 'cue-stick-shadow';

/** Thickness at a distance from the tip: the cue tapers from tip to butt. */
function halfWidth(x: number, length: number): number {
  return (CUE_ART.tipWidth + ((CUE_ART.buttWidth - CUE_ART.tipWidth) * x) / length) / 2;
}

/**
 * A cue, drawn lying along x with the tip at x = 0 and tapering to the butt: tip, ferrule, shaft,
 * butt, the cue's own decoration and a cap. `scale` above 1 draws a larger copy (the cue picker).
 */
export function cueTexture(scene: Phaser.Scene, style: CueStyle, scale = 1): string {
  const c = CUE_ART;
  const key = `cue-stick-${style.id}${scale === 1 ? '' : `-${scale}`}`;
  return canvasTexture(scene, key, CUE_STICK.length * scale, c.buttWidth * scale, (ctx) => {
    ctx.scale(scale, scale);
    const w = CUE_STICK.length;
    const h = c.buttWidth;
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
    /** A round-looking section: dark at the edges, light just above the middle. */
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
    const capStart = w - c.buttCap.length;
    band(0, c.tip.length, c.tip.color, c.tip.color);
    band(c.tip.length, c.tip.length + c.ferrule.length, c.ferrule.color, c.ferrule.color);
    band(c.tip.length + c.ferrule.length, buttStart, style.shaft.light, style.shaft.dark);
    band(buttStart, capStart, style.butt.light, style.butt.dark);
    ctx.save();
    body(buttStart, capStart);
    ctx.clip();
    drawDecor(ctx, style.decor, { buttStart, capStart, gripStart: w * c.grip.start, gripEnd: w * c.grip.end, mid, half }, band);
    ctx.restore();
    band(capStart, w, style.buttCap, style.buttCap);
    // Shade over the decoration too, so it looks round rather than printed flat.
    const shade = ctx.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    shade.addColorStop(0.4, 'rgba(255, 255, 255, 0.12)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = shade;
    body(buttStart, capStart);
    ctx.fill();
  });
}

interface CueParts {
  readonly buttStart: number;
  readonly capStart: number;
  readonly gripStart: number;
  readonly gripEnd: number;
  readonly mid: number;
  readonly half: (x: number) => number;
}

type Band = (from: number, to: number, light: string, dark: string) => void;

function drawDecor(ctx: CanvasRenderingContext2D, decor: CueDecor, p: CueParts, band: Band): void {
  const dot = (x: number, y: number, r: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  switch (decor.kind) {
    case 'wrap': {
      band(p.gripStart, p.gripEnd, decor.color, decor.color);
      const stripe = (p.gripStart + p.gripEnd) / 2;
      band(stripe - 1, stripe + 1, decor.stripe, decor.stripe);
      break;
    }
    case 'rings': {
      band(p.gripStart, p.gripEnd, decor.wrap, decor.wrap);
      for (const f of decor.at) {
        const x = f * CUE_STICK.length;
        band(x - decor.width / 2, x + decor.width / 2, decor.light, decor.dark);
      }
      break;
    }
    case 'kitenge': {
      band(p.gripStart, p.gripEnd, decor.base, decor.base);
      for (let x = p.gripStart + decor.spacing / 2; x < p.gripEnd; x += decor.spacing) {
        const r = p.half(x) * 0.75;
        dot(x, p.mid, r, decor.ring);
        dot(x, p.mid, r * 0.45, decor.centre);
      }
      break;
    }
    case 'beads': {
      // Check stripes across the butt, then rows of beads on the grip.
      ctx.fillStyle = decor.stripe;
      ctx.globalAlpha = 0.7;
      for (let x = p.buttStart + 6; x < p.gripStart; x += 10) ctx.fillRect(x, 0, 2.5, p.mid * 2);
      ctx.globalAlpha = 1;
      let i = 0;
      for (let x = p.gripStart + decor.spacing / 2; x < p.gripEnd; x += decor.spacing) {
        const r = decor.spacing * 0.42;
        for (const dy of [-1, 1]) dot(x, p.mid + dy * p.half(x) * 0.45, r, decor.colors[(i + (dy > 0 ? 2 : 0)) % decor.colors.length]!);
        i++;
      }
      break;
    }
    case 'bands': {
      const count = decor.colors.length;
      const width = (p.capStart - p.buttStart) / count;
      decor.colors.forEach((color, i) => {
        const from = p.buttStart + i * width;
        band(from, from + width, color, color);
        for (let x = from + 4; x < from + width - 2; x += 6) dot(x, p.mid, 0.9, decor.dot);
        ctx.fillStyle = decor.edge;
        ctx.fillRect(from - 0.75, 0, 1.5, p.mid * 2);
      });
      break;
    }
    case 'inlay': {
      band(p.gripStart, p.gripEnd, decor.wrap, decor.wrap);
      for (const [from, to] of [[p.buttStart, p.gripStart], [p.gripEnd, p.capStart]] as const) {
        for (let x = from + decor.spacing / 2; x < to - 2; x += decor.spacing) {
          const r = p.half(x) * 0.7;
          ctx.fillStyle = decor.color;
          ctx.beginPath();
          ctx.moveTo(x - r * 1.6, p.mid);
          ctx.lineTo(x, p.mid - r);
          ctx.lineTo(x + r * 1.6, p.mid);
          ctx.lineTo(x, p.mid + r);
          ctx.closePath();
          ctx.fill();
        }
      }
      break;
    }
  }
}

/** The cue's outline in black, for its shadow on the table (the same for every cue). */
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
