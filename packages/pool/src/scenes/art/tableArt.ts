import { createRandom } from '@tzg/core';
import { TABLE_ART } from '../../config/art';
import type { TableConfig } from '../../config/table';
import type { TableGeometry, Vec2 } from '../../physics/types';

/** Where the table sits in the texture: table metres to texture pixels, and the sizes in pixels. */
export interface TableFrame {
  /** Table metres to texture pixels. */
  readonly at: (x: number, y: number) => Vec2;
  /** Metres to pixels. */
  readonly px: (metres: number) => number;
  /** Outer edge of the rail, in texture pixels. */
  readonly outer: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly railWidth: number;
}

/**
 * The table, drawn once: shadow, wooden rail with grain and diamonds, cushions, cloth, pockets,
 * jaws and the baulk line. The cushion noses and jaws are drawn where the physics has them, so the
 * picture and the play agree.
 */
export function drawTable(ctx: CanvasRenderingContext2D, frame: TableFrame, geometry: TableGeometry, config: TableConfig): void {
  const a = TABLE_ART;
  const { outer, railWidth, at, px } = frame;
  const play = { ...at(0, 0), width: px(geometry.length), height: px(geometry.width) };

  // Shadow on the floor, then the wood.
  ctx.save();
  ctx.shadowColor = a.shadow.color;
  ctx.shadowBlur = a.shadow.blur;
  ctx.shadowOffsetY = a.shadow.offsetY;
  ctx.fillStyle = a.rail.mid;
  roundRect(ctx, outer.x, outer.y, outer.width, outer.height, a.rail.cornerRadius);
  ctx.fill();
  ctx.restore();
  drawRailWood(ctx, frame);

  // Cushion strip, then the cloth inside it.
  const cw = a.cushion.width;
  ctx.fillStyle = a.cushion.color;
  ctx.fillRect(play.x - cw, play.y - cw, play.width + 2 * cw, play.height + 2 * cw);
  drawCloth(ctx, play);

  // Pockets: a dark hole with depth and a rim on the wood.
  const pocketRadius = px(Math.max(config.cornerMouth, config.middleMouth) / 2 + config.dropRadius / 2);
  for (const pocket of geometry.pockets) {
    const c = at(pocket.center.x, pocket.center.y);
    const hole = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, pocketRadius);
    hole.addColorStop(0, a.pocket.inner);
    hole.addColorStop(0.7, a.pocket.inner);
    hole.addColorStop(1, a.pocket.outer);
    ctx.fillStyle = hole;
    ctx.beginPath();
    ctx.arc(c.x, c.y, pocketRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = a.pocket.rim;
    ctx.lineWidth = a.pocket.rimWidth;
    ctx.stroke();
  }

  // Jaws and cushion noses, as the physics sees them.
  ctx.lineCap = 'round';
  ctx.strokeStyle = a.cushion.color;
  ctx.lineWidth = a.cushion.jawWidth;
  for (const s of geometry.cushions) line(ctx, at(s.a.x, s.a.y), at(s.b.x, s.b.y));
  ctx.strokeStyle = a.cushion.nose;
  ctx.lineWidth = a.cushion.noseWidth;
  for (const s of geometry.cushions) line(ctx, at(s.a.x, s.a.y), at(s.b.x, s.b.y));

  // Baulk line.
  ctx.strokeStyle = a.baulk.color;
  ctx.lineWidth = a.baulk.width;
  line(ctx, at(config.baulkLine, 0), at(config.baulkLine, geometry.width));

  drawDiamonds(ctx, frame, geometry);
}

function drawRailWood(ctx: CanvasRenderingContext2D, frame: TableFrame): void {
  const r = TABLE_ART.rail;
  const { outer } = frame;
  ctx.save();
  roundRect(ctx, outer.x, outer.y, outer.width, outer.height, r.cornerRadius);
  ctx.clip();
  const wood = ctx.createLinearGradient(0, outer.y, 0, outer.y + outer.height);
  wood.addColorStop(0, r.light);
  wood.addColorStop(0.5, r.mid);
  wood.addColorStop(1, r.dark);
  ctx.fillStyle = wood;
  ctx.fillRect(outer.x, outer.y, outer.width, outer.height);
  // Grain: long faint lines along the rails, slightly wavy.
  const random = createRandom(r.seed);
  ctx.strokeStyle = r.grainColor;
  for (let i = 0; i < r.grainLines; i++) {
    ctx.globalAlpha = r.grainAlpha * (0.4 + 0.6 * random.next());
    ctx.lineWidth = 0.5 + random.next();
    const horizontal = i % 2 === 0;
    ctx.beginPath();
    if (horizontal) {
      const y = outer.y + random.next() * outer.height;
      ctx.moveTo(outer.x, y);
      ctx.bezierCurveTo(outer.x + outer.width / 3, y + (random.next() - 0.5) * 4, outer.x + (2 * outer.width) / 3, y + (random.next() - 0.5) * 4, outer.x + outer.width, y);
    } else {
      const x = outer.x + random.next() * outer.width;
      ctx.moveTo(x, outer.y);
      ctx.bezierCurveTo(x + (random.next() - 0.5) * 4, outer.y + outer.height / 3, x + (random.next() - 0.5) * 4, outer.y + (2 * outer.height) / 3, x, outer.y + outer.height);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // Bevel: light on the outer top edge, dark on the inner edge next to the cushion.
  ctx.lineWidth = r.bevelWidth;
  ctx.strokeStyle = r.bevelLight;
  roundRect(ctx, outer.x + r.bevelWidth / 2, outer.y + r.bevelWidth / 2, outer.width - r.bevelWidth, outer.height - r.bevelWidth, r.cornerRadius);
  ctx.stroke();
  const inset = frame.railWidth - TABLE_ART.cushion.width;
  ctx.strokeStyle = r.bevelDark;
  ctx.strokeRect(outer.x + inset, outer.y + inset, outer.width - 2 * inset, outer.height - 2 * inset);
}

function drawCloth(ctx: CanvasRenderingContext2D, play: { x: number; y: number; width: number; height: number }): void {
  const c = TABLE_ART.cloth;
  const cx = play.x + play.width / 2;
  const cy = play.y + play.height / 2;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(play.width, play.height) / 2);
  glow.addColorStop(0, c.centre);
  glow.addColorStop(1, c.edge);
  ctx.fillStyle = glow;
  ctx.fillRect(play.x, play.y, play.width, play.height);
  const random = createRandom(c.seed);
  for (let i = 0; i < c.speckles; i++) {
    ctx.fillStyle = random.next() < 0.5 ? `rgba(255, 255, 255, ${c.speckleAlpha})` : `rgba(0, 0, 0, ${c.speckleAlpha})`;
    ctx.fillRect(play.x + random.next() * play.width, play.y + random.next() * play.height, 1, 1);
  }
}

/** Sights on the wood, centred in the wooden part of each rail, evenly between the pockets. */
function drawDiamonds(ctx: CanvasRenderingContext2D, frame: TableFrame, geometry: TableGeometry): void {
  const d = TABLE_ART.diamond;
  const wood = frame.railWidth - TABLE_ART.cushion.width;
  const off = TABLE_ART.cushion.width + wood / 2; // pixels outside the cushion nose
  const L = geometry.length;
  const W = geometry.width;
  const marks: Vec2[] = [];
  for (let i = 1; i <= d.perGap; i++) {
    const f = i / (d.perGap + 1);
    for (const x of [f * (L / 2), L / 2 + f * (L / 2)]) {
      const top = frame.at(x, 0);
      const bottom = frame.at(x, W);
      marks.push({ x: top.x, y: top.y - off }, { x: bottom.x, y: bottom.y + off });
    }
    const left = frame.at(0, f * W);
    const right = frame.at(L, f * W);
    marks.push({ x: left.x - off, y: left.y }, { x: right.x + off, y: right.y });
  }
  ctx.fillStyle = d.color;
  for (const m of marks) {
    ctx.beginPath();
    ctx.moveTo(m.x, m.y - d.halfSize);
    ctx.lineTo(m.x + d.halfSize, m.y);
    ctx.lineTo(m.x, m.y + d.halfSize);
    ctx.lineTo(m.x - d.halfSize, m.y);
    ctx.closePath();
    ctx.fill();
  }
}

function line(ctx: CanvasRenderingContext2D, a: Vec2, b: Vec2): void {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
