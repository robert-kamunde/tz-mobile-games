import { createRandom } from '@tzg/core';
import { TABLE_ART } from '../../config/art';
import type { TableConfig } from '../../config/table';
import type { MakondeRail, MarkerStyle, ShukaRail, TableTheme, TingatingaRail, KitengeRail, ZanzibarRail } from '../../config/tables';
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

type Box = TableFrame['outer'];

/**
 * The table, drawn once: shadow, rails in the table's style, cushions, cloth, pockets, jaws, the
 * baulk line and sight marks. The cushion noses and jaws are drawn where the physics has them, so
 * the picture and the play agree.
 */
export function drawTable(ctx: CanvasRenderingContext2D, frame: TableFrame, geometry: TableGeometry, config: TableConfig, theme: TableTheme): void {
  const a = TABLE_ART;
  const { outer, at, px } = frame;
  const play = { ...at(0, 0), width: px(geometry.length), height: px(geometry.width) };

  // Shadow on the floor, then the rails.
  ctx.save();
  ctx.shadowColor = a.shadow.color;
  ctx.shadowBlur = a.shadow.blur;
  ctx.shadowOffsetY = a.shadow.offsetY;
  ctx.fillStyle = '#000000';
  roundRect(ctx, outer.x, outer.y, outer.width, outer.height, a.rail.cornerRadius);
  ctx.fill();
  ctx.restore();
  drawRails(ctx, frame, theme);

  // Cushion strip, then the cloth inside it.
  const cw = a.cushion.width;
  ctx.fillStyle = theme.cushion;
  ctx.fillRect(play.x - cw, play.y - cw, play.width + 2 * cw, play.height + 2 * cw);
  drawCloth(ctx, play, theme.cloth);

  // Pockets: a dark hole with depth and a rim on the rail.
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
  ctx.strokeStyle = theme.cushion;
  ctx.lineWidth = a.cushion.jawWidth;
  for (const s of geometry.cushions) line(ctx, at(s.a.x, s.a.y), at(s.b.x, s.b.y));
  ctx.strokeStyle = a.cushion.nose;
  ctx.lineWidth = a.cushion.noseWidth;
  for (const s of geometry.cushions) line(ctx, at(s.a.x, s.a.y), at(s.b.x, s.b.y));

  // Baulk line.
  ctx.strokeStyle = a.baulk.color;
  ctx.lineWidth = a.baulk.width;
  line(ctx, at(config.baulkLine, 0), at(config.baulkLine, geometry.width));

  drawMarkers(ctx, frame, geometry, theme.marker);
}

// ---- Rails ------------------------------------------------------------------------------------

function drawRails(ctx: CanvasRenderingContext2D, frame: TableFrame, theme: TableTheme): void {
  const r = TABLE_ART.rail;
  const { outer } = frame;
  const thickness = frame.railWidth - TABLE_ART.cushion.width;
  const rail = theme.rail;
  ctx.save();
  roundRect(ctx, outer.x, outer.y, outer.width, outer.height, r.cornerRadius);
  ctx.clip();
  switch (rail.kind) {
    case 'wood':
      drawWood(ctx, outer, rail);
      break;
    case 'zanzibar':
      drawWood(ctx, outer, rail);
      eachRail(ctx, outer, thickness, (length) => drawZanzibar(ctx, length, thickness, rail));
      break;
    case 'makonde':
      drawWood(ctx, outer, rail);
      eachRail(ctx, outer, thickness, (length) => drawMakonde(ctx, length, thickness, rail));
      break;
    case 'kitenge':
      fill(ctx, outer, rail.base);
      eachRail(ctx, outer, thickness, (length) => drawKitenge(ctx, length, thickness, rail));
      break;
    case 'shuka':
      fill(ctx, outer, rail.base);
      eachRail(ctx, outer, thickness, (length) => drawShuka(ctx, length, thickness, rail));
      break;
    case 'tingatinga': {
      let section = 0;
      eachRail(ctx, outer, thickness, (length) => {
        section = drawTingatinga(ctx, length, thickness, rail, section);
      });
      break;
    }
  }
  ctx.restore();
  // Bevel: light on the outer top edge, dark on the inner edge next to the cushion.
  ctx.lineWidth = r.bevelWidth;
  ctx.strokeStyle = r.bevelLight;
  roundRect(ctx, outer.x + r.bevelWidth / 2, outer.y + r.bevelWidth / 2, outer.width - r.bevelWidth, outer.height - r.bevelWidth, r.cornerRadius);
  ctx.stroke();
  ctx.strokeStyle = r.bevelDark;
  ctx.strokeRect(outer.x + thickness, outer.y + thickness, outer.width - 2 * thickness, outer.height - 2 * thickness);
}

/**
 * Runs `draw` once per rail (top, right, bottom, left) with the canvas turned so the rail runs left
 * to right: x along it from 0 to `length`, y from the outer edge (0) in to the cushion (`thickness`).
 * Each rail is clipped to its mitred shape, so patterns meet neatly at the corners.
 */
function eachRail(ctx: CanvasRenderingContext2D, outer: Box, thickness: number, draw: (length: number) => void): void {
  const rails = [
    { x: outer.x, y: outer.y, turn: 0, length: outer.width },
    { x: outer.x + outer.width, y: outer.y, turn: 1, length: outer.height },
    { x: outer.x + outer.width, y: outer.y + outer.height, turn: 2, length: outer.width },
    { x: outer.x, y: outer.y + outer.height, turn: 3, length: outer.height },
  ];
  for (const r of rails) {
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate((r.turn * Math.PI) / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r.length, 0);
    ctx.lineTo(r.length - thickness, thickness);
    ctx.lineTo(thickness, thickness);
    ctx.closePath();
    ctx.clip();
    draw(r.length);
    ctx.restore();
  }
}

function fill(ctx: CanvasRenderingContext2D, box: Box, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(box.x, box.y, box.width, box.height);
}

/** Wood: a gradient down the table and long faint grain lines, slightly wavy. */
function drawWood(ctx: CanvasRenderingContext2D, outer: Box, wood: { light: string; mid: string; dark: string; grainColor: string; grainAlpha: number }): void {
  const r = TABLE_ART.rail;
  const gradient = ctx.createLinearGradient(0, outer.y, 0, outer.y + outer.height);
  gradient.addColorStop(0, wood.light);
  gradient.addColorStop(0.5, wood.mid);
  gradient.addColorStop(1, wood.dark);
  ctx.fillStyle = gradient;
  ctx.fillRect(outer.x, outer.y, outer.width, outer.height);
  const random = createRandom(r.seed);
  ctx.strokeStyle = wood.grainColor;
  for (let i = 0; i < r.grainLines; i++) {
    ctx.globalAlpha = wood.grainAlpha * (0.4 + 0.6 * random.next());
    ctx.lineWidth = 0.5 + random.next();
    ctx.beginPath();
    if (i % 2 === 0) {
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
}

/** Zanzibar door: a carved rope along the outer edge and a row of brass studs along the inner edge. */
function drawZanzibar(ctx: CanvasRenderingContext2D, length: number, thickness: number, rail: ZanzibarRail): void {
  const ropeY = thickness * 0.2;
  const { rope, stud } = rail;
  ctx.strokeStyle = rope.color;
  ctx.lineWidth = rope.width;
  for (let x = -rope.twist; x < length; x += rope.twist) line(ctx, { x, y: ropeY + rope.twist / 3 }, { x: x + rope.twist, y: ropeY - rope.twist / 3 });
  const studY = thickness - stud.radius - 2.5;
  for (let x = stud.spacing / 2; x < length; x += stud.spacing) brassStud(ctx, x, studY, stud.radius, stud.light, stud.dark);
}

function brassStud(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, light: string, dark: string): void {
  const g = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.35, radius * 0.1, x, y, radius);
  g.addColorStop(0, light);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** Makonde carving: a zigzag groove between two border grooves, each cut dark with a light edge. */
function drawMakonde(ctx: CanvasRenderingContext2D, length: number, thickness: number, rail: MakondeRail): void {
  const g = rail.groove;
  const inset = thickness * 0.2;
  const cut = (offset: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = g.width;
    ctx.beginPath();
    for (let x = 0, up = true; x <= length + g.step; x += g.step / 2, up = !up) {
      const y = (up ? inset : thickness - inset) + offset;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    line(ctx, { x: 0, y: inset / 2 + offset }, { x: length, y: inset / 2 + offset });
    line(ctx, { x: 0, y: thickness - inset / 2 + offset }, { x: length, y: thickness - inset / 2 + offset });
  };
  cut(0, g.dark);
  cut(g.width * 0.6, g.light);
}

/** Kitenge print: bands along both edges, rings down the middle and small dots between them. */
function drawKitenge(ctx: CanvasRenderingContext2D, length: number, thickness: number, rail: KitengeRail): void {
  const band = thickness * 0.14;
  ctx.fillStyle = rail.band;
  ctx.fillRect(0, 0, length, band);
  ctx.fillRect(0, thickness - band, length, band);
  const mid = thickness / 2;
  const { ring, dot } = rail;
  for (let x = ring.spacing / 2; x < length + ring.spacing; x += ring.spacing) {
    circle(ctx, x, mid, ring.radius, ring.outer);
    circle(ctx, x, mid, ring.radius * 0.7, ring.inner);
    circle(ctx, x, mid, ring.radius * 0.3, ring.centre);
    for (const [dx, dy] of [[0.5, -0.22], [0.5, 0.22]] as const) circle(ctx, x + ring.spacing * dx, mid + thickness * dy, dot.radius, dot.color);
  }
}

/** Maasai shuka: a check of stripes both ways over red, and a line of beads by the cushion. */
function drawShuka(ctx: CanvasRenderingContext2D, length: number, thickness: number, rail: ShukaRail): void {
  for (const s of rail.stripes) {
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = s.color;
    for (let x = s.offset; x < length; x += rail.repeat) ctx.fillRect(x, 0, s.width, thickness);
    for (let y = s.offset; y < thickness; y += rail.repeat) ctx.fillRect(0, y, length, s.width);
  }
  ctx.globalAlpha = 1;
  const { beads } = rail;
  const y = thickness - beads.radius - 1.5;
  for (let x = beads.spacing / 2, i = 0; x < length; x += beads.spacing, i++) circle(ctx, x, y, beads.radius, beads.colors[i % beads.colors.length]!);
}

/**
 * Tingatinga painting: the rail is cut into bold coloured sections outlined in black, each with a
 * row of dots and a wave. Returns the next section's colour index, so the colours run on round the table.
 */
function drawTingatinga(ctx: CanvasRenderingContext2D, length: number, thickness: number, rail: TingatingaRail, firstSection: number): number {
  const sections = Math.max(1, Math.round(length / (thickness * 3)));
  const width = length / sections;
  let index = firstSection;
  for (let s = 0; s < sections; s++, index++) {
    const section = rail.sections[index % rail.sections.length]!;
    const x0 = s * width;
    ctx.fillStyle = section.fill;
    ctx.fillRect(x0, 0, width, thickness);
    for (let x = x0 + rail.dot.spacing / 2; x < x0 + width; x += rail.dot.spacing) circle(ctx, x, thickness * 0.3, rail.dot.radius, section.dots);
    const w = rail.wave;
    ctx.strokeStyle = w.color;
    ctx.lineWidth = w.width;
    ctx.beginPath();
    for (let x = x0; x <= x0 + width; x += 1) {
      const y = thickness * 0.68 + Math.sin(((x - x0) / w.length) * Math.PI * 2) * w.height;
      if (x === x0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = rail.outline;
    ctx.lineWidth = rail.outlineWidth;
    line(ctx, { x: x0, y: 0 }, { x: x0, y: thickness });
  }
  return index;
}

// ---- Cloth and marks --------------------------------------------------------------------------

function drawCloth(ctx: CanvasRenderingContext2D, play: { x: number; y: number; width: number; height: number }, colors: TableTheme['cloth']): void {
  const c = TABLE_ART.cloth;
  const cx = play.x + play.width / 2;
  const cy = play.y + play.height / 2;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(play.width, play.height) / 2);
  glow.addColorStop(0, colors.centre);
  glow.addColorStop(1, colors.edge);
  ctx.fillStyle = glow;
  ctx.fillRect(play.x, play.y, play.width, play.height);
  const random = createRandom(c.seed);
  for (let i = 0; i < c.speckles; i++) {
    ctx.fillStyle = random.next() < 0.5 ? `rgba(255, 255, 255, ${c.speckleAlpha})` : `rgba(0, 0, 0, ${c.speckleAlpha})`;
    ctx.fillRect(play.x + random.next() * play.width, play.y + random.next() * play.height, 1, 1);
  }
}

/** Sights on the rail, centred across it, evenly between the pockets. */
function drawMarkers(ctx: CanvasRenderingContext2D, frame: TableFrame, geometry: TableGeometry, marker: MarkerStyle): void {
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
  for (const m of marks) {
    switch (marker.kind) {
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(m.x, m.y - marker.halfSize);
        ctx.lineTo(m.x + marker.halfSize, m.y);
        ctx.lineTo(m.x, m.y + marker.halfSize);
        ctx.lineTo(m.x - marker.halfSize, m.y);
        ctx.closePath();
        ctx.fillStyle = marker.color;
        ctx.fill();
        // A thin dark edge keeps the mark readable on a patterned rail.
        ctx.strokeStyle = d.outline;
        ctx.lineWidth = d.outlineWidth;
        ctx.stroke();
        break;
      case 'stud':
        brassStud(ctx, m.x, m.y, marker.radius, marker.light, marker.dark);
        break;
      case 'bead':
        marker.colors.forEach((color, i) => circle(ctx, m.x, m.y, marker.radius * (1 - i / marker.colors.length), color));
        break;
      case 'inlay':
        circle(ctx, m.x, m.y, marker.radius, marker.color);
        ctx.strokeStyle = marker.rim;
        ctx.lineWidth = d.outlineWidth;
        ctx.stroke();
        break;
    }
  }
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
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
