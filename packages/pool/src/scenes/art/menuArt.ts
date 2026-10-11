import type * as Phaser from 'phaser';
import { LOGO_ART, MENU_ART } from '../../config/art';
import { DESIGN } from '../../config/layout';
import { canvasTexture } from './canvasArt';

const FULL = Math.PI * 2;

/** Same scatter every time (stars, chalk marks), so the picture never changes between visits. */
function scatter(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** The menu's background: a pool bar at night (MENU_ART), drawn once. */
export function menuBackgroundTexture(scene: Phaser.Scene): string {
  return canvasTexture(scene, 'menu-bar', DESIGN.width, DESIGN.height, (ctx, w, h) => drawMenuBar(ctx, w, h));
}

export function drawMenuBar(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const m = MENU_ART;
  // Wall: painted upper half, darker lower half with a bright stripe between.
  const wall = ctx.createLinearGradient(0, 0, 0, m.wall.lowerTop);
  wall.addColorStop(0, m.wall.top);
  wall.addColorStop(1, m.wall.bottom);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, m.wall.lowerTop);
  const lower = ctx.createLinearGradient(0, m.wall.lowerTop, 0, m.floor.top);
  lower.addColorStop(0, m.wall.lower);
  lower.addColorStop(1, m.wall.lowerDark);
  ctx.fillStyle = lower;
  ctx.fillRect(0, m.wall.lowerTop, w, m.floor.top - m.wall.lowerTop);
  ctx.fillStyle = m.wall.stripe;
  ctx.fillRect(0, m.wall.lowerTop - m.wall.stripeHeight, w, m.wall.stripeHeight);
  // Floor tiles.
  ctx.fillStyle = m.floor.color;
  ctx.fillRect(0, m.floor.top, w, h - m.floor.top);
  ctx.strokeStyle = m.floor.dark;
  ctx.lineWidth = 2;
  for (let x = -w; x < 2 * w; x += m.floor.tile) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + (x - w / 2) * 0.6, m.floor.top);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  windowWithBars(ctx);
  cueRack(ctx);
  chalkBoard(ctx);
  counter(ctx);
  radio(ctx);
  fan(ctx);

  // Lamp light on the wall behind the buttons.
  const g = m.glow;
  const glow = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
  glow.addColorStop(0, g.color);
  glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  lamp(ctx);
  stringLights(ctx, w);
  poolTableEdge(ctx, w, h);

  const c = m.centreShade;
  const shade = ctx.createLinearGradient(w / 2 - c.width / 2, 0, w / 2 + c.width / 2, 0);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(0.5, c.color);
  shade.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.45, w / 2, h / 2, w * 0.72);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, m.vignette);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

function windowWithBars(ctx: CanvasRenderingContext2D): void {
  const s = MENU_ART.window;
  const sky = ctx.createLinearGradient(0, s.y, 0, s.y + s.height);
  sky.addColorStop(0, s.sky[0]);
  sky.addColorStop(1, s.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(s.x, s.y, s.width, s.height);
  const rnd = scatter(7);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < s.stars; i++) {
    ctx.beginPath();
    ctx.arc(s.x + rnd() * s.width, s.y + rnd() * s.height * 0.6, 0.8 + rnd(), 0, FULL);
    ctx.fill();
  }
  // A slice of moon.
  ctx.fillStyle = '#f4ecd0';
  ctx.beginPath();
  ctx.arc(s.x + s.width * 0.72, s.y + s.height * 0.26, 16, 0, FULL);
  ctx.fill();
  ctx.fillStyle = s.sky[0];
  ctx.beginPath();
  ctx.arc(s.x + s.width * 0.72 + 7, s.y + s.height * 0.26 - 4, 14, 0, FULL);
  ctx.fill();
  // Burglar bars: uprights and a sun-ray pattern at the top, as on many shop windows.
  ctx.strokeStyle = s.bars;
  ctx.lineWidth = 3;
  for (let x = s.x + s.barSpacing; x < s.x + s.width; x += s.barSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, s.y);
    ctx.lineTo(x, s.y + s.height);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(s.x, s.y + s.height / 2);
  ctx.lineTo(s.x + s.width, s.y + s.height / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(s.x + s.width / 2, s.y + s.height / 2, s.width * 0.28, Math.PI, FULL);
  ctx.stroke();
  ctx.lineWidth = 10;
  ctx.strokeStyle = s.frame;
  ctx.strokeRect(s.x, s.y, s.width, s.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(s.x - 8, s.y + s.height + 5, s.width + 16, 10);
}

function cueRack(ctx: CanvasRenderingContext2D): void {
  const r = MENU_ART.rack;
  ctx.fillStyle = r.wood;
  ctx.fillRect(r.x, r.y, r.width, 16);
  ctx.fillRect(r.x, r.y + r.height - 20, r.width, 20);
  r.cues.forEach((color, i) => {
    const x = r.x + 8 + i * ((r.width - 16) / (r.cues.length - 1));
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = 3 + i * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, r.y - 30);
    ctx.lineTo(x + (i - 1.5) * 1.5, r.y + r.height - 6);
    ctx.stroke();
    ctx.strokeStyle = '#f4efe4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, r.y - 30);
    ctx.lineTo(x, r.y - 22);
    ctx.stroke();
  });
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(r.x, r.y + 16, r.width, 4);
}

function chalkBoard(ctx: CanvasRenderingContext2D): void {
  const b = MENU_ART.board;
  ctx.fillStyle = b.frame;
  ctx.fillRect(b.x - 8, b.y - 8, b.width + 16, b.height + 16);
  ctx.fillStyle = b.slate;
  ctx.fillRect(b.x, b.y, b.width, b.height);
  // Scores in chalk: tally marks, so the picture needs no words in either language.
  ctx.strokeStyle = b.chalk;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  const rnd = scatter(42);
  for (let row = 0; row < 4; row++) {
    const y = b.y + 26 + row * 34;
    ctx.beginPath();
    ctx.moveTo(b.x + 18, y);
    ctx.lineTo(b.x + 18 + 50 + rnd() * 20, y + (rnd() - 0.5) * 3);
    ctx.stroke();
    const marks = 2 + Math.floor(rnd() * 7);
    for (let i = 0; i < marks; i++) {
      const x = b.x + 110 + i * 13 + Math.floor(i / 5) * 8;
      if (i % 5 === 4) {
        ctx.beginPath();
        ctx.moveTo(x - 56, y + 4);
        ctx.lineTo(x + 2, y - 10);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y - 12);
        ctx.lineTo(x + (rnd() - 0.5) * 2, y + 10);
        ctx.stroke();
      }
    }
  }
  // Chalk dust at the bottom.
  ctx.fillStyle = 'rgba(240, 240, 230, 0.12)';
  ctx.fillRect(b.x, b.y + b.height - 14, b.width, 14);
}

function counter(ctx: CanvasRenderingContext2D): void {
  const c = MENU_ART.counter;
  ctx.fillStyle = c.front;
  ctx.fillRect(c.x, c.y, c.width, c.height);
  ctx.fillStyle = c.panel;
  const panels = 3;
  const gap = 14;
  const pw = (c.width - gap * (panels + 1)) / panels;
  for (let i = 0; i < panels; i++) ctx.fillRect(c.x + gap + i * (pw + gap), c.y + 26, pw, c.height - 44);
  ctx.fillStyle = c.top;
  ctx.fillRect(c.x - 12, c.y - 4, c.width + 12, 18);
  ctx.fillStyle = c.edge;
  ctx.fillRect(c.x - 12, c.y + 14, c.width + 12, 4);
}

function radio(ctx: CanvasRenderingContext2D): void {
  const r = MENU_ART.radio;
  ctx.fillStyle = r.body;
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.width, r.height, 8);
  ctx.fill();
  ctx.fillStyle = r.grille;
  ctx.beginPath();
  ctx.arc(r.x + 28, r.y + r.height / 2, 17, 0, FULL);
  ctx.fill();
  ctx.fillStyle = r.dial;
  ctx.fillRect(r.x + 56, r.y + 12, 44, 10);
  ctx.beginPath();
  ctx.arc(r.x + 66, r.y + 36, 6, 0, FULL);
  ctx.arc(r.x + 90, r.y + 36, 6, 0, FULL);
  ctx.fill();
  // Aerial.
  ctx.strokeStyle = '#bdbdbd';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r.x + r.width - 12, r.y);
  ctx.lineTo(r.x + r.width + 30, r.y - 60);
  ctx.stroke();
}

function fan(ctx: CanvasRenderingContext2D): void {
  const f = MENU_ART.fan;
  ctx.fillStyle = f.color;
  ctx.fillRect(f.x - 2, 0, 4, f.y);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(f.x + side * f.blade / 2, f.y + 4, f.blade / 2, 6, 0, 0, FULL);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(f.x, f.y + 4, 14, 10, 0, 0, FULL);
  ctx.fill();
}

function lamp(ctx: CanvasRenderingContext2D): void {
  const l = MENU_ART.lamp;
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(l.x, l.top);
  ctx.lineTo(l.x, l.top + l.cord);
  ctx.stroke();
  const y = l.top + l.cord;
  ctx.fillStyle = l.bulb;
  ctx.beginPath();
  ctx.ellipse(l.x, y + l.shadeHeight, l.shadeWidth / 2 - 6, 6, 0, 0, FULL);
  ctx.fill();
  ctx.fillStyle = l.color;
  ctx.beginPath();
  ctx.moveTo(l.x - 14, y);
  ctx.lineTo(l.x + 14, y);
  ctx.lineTo(l.x + l.shadeWidth / 2, y + l.shadeHeight);
  ctx.lineTo(l.x - l.shadeWidth / 2, y + l.shadeHeight);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = l.rim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(l.x - l.shadeWidth / 2, y + l.shadeHeight);
  ctx.lineTo(l.x + l.shadeWidth / 2, y + l.shadeHeight);
  ctx.stroke();
}

function stringLights(ctx: CanvasRenderingContext2D, w: number): void {
  const s = MENU_ART.lights;
  // Two loops of wire, each sagging between three nails.
  const spans: [number, number][] = [
    [0, w * 0.36],
    [w * 0.64, w],
  ];
  for (const [x0, x1] of spans) {
    const at = (t: number) => ({ x: x0 + (x1 - x0) * t, y: s.y + 4 * s.sag * t * (1 - t) });
    ctx.strokeStyle = '#151515';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let t = 0; t <= 1.001; t += 0.05) {
      const p = at(t);
      if (t === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    const n = Math.floor((x1 - x0) / s.spacing);
    for (let i = 1; i < n; i++) {
      const p = at(i / n);
      const color = s.colors[i % s.colors.length]!;
      const glow = ctx.createRadialGradient(p.x, p.y + s.radius, 0, p.x, p.y + s.radius, s.glow);
      glow.addColorStop(0, color);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = glow;
      ctx.fillRect(p.x - s.glow, p.y + s.radius - s.glow, 2 * s.glow, 2 * s.glow);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + s.radius, s.radius * 0.8, s.radius, 0, 0, FULL);
      ctx.fill();
    }
  }
}

function poolTableEdge(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const t = MENU_ART.table;
  const felt = ctx.createLinearGradient(0, t.top + t.railHeight, 0, h);
  felt.addColorStop(0, t.felt);
  felt.addColorStop(1, t.feltDark);
  ctx.fillStyle = felt;
  ctx.fillRect(0, t.top + t.railHeight, w, h - t.top - t.railHeight);
  const rail = ctx.createLinearGradient(0, t.top, 0, t.top + t.railHeight);
  rail.addColorStop(0, t.rail);
  rail.addColorStop(1, t.railDark);
  ctx.fillStyle = rail;
  ctx.fillRect(0, t.top, w, t.railHeight);
  // Diamonds on the rail.
  ctx.fillStyle = '#f4efe4';
  for (let x = w / 8; x < w; x += w / 8) {
    ctx.beginPath();
    ctx.moveTo(x, t.top + t.railHeight / 2 - 4);
    ctx.lineTo(x + 4, t.top + t.railHeight / 2);
    ctx.lineTo(x, t.top + t.railHeight / 2 + 4);
    ctx.lineTo(x - 4, t.top + t.railHeight / 2);
    ctx.fill();
  }
  // A few balls resting near the near edge, at the sides.
  const balls: [number, string][] = [
    [120, '#d63031'],
    [168, '#f2c94c'],
    [930, '#111111'],
    [980, '#f7f3ea'],
  ];
  for (const [x, color] of balls) {
    const y = t.top + t.railHeight + 26;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 14, 16, 6, 0, 0, FULL);
    ctx.fill();
    const g = ctx.createRadialGradient(x - 6, y - 6, 1, x, y, 17);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    g.addColorStop(0.35, color);
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, FULL);
    ctx.fill();
  }
}

/** The title logo (LOGO_ART) for the game's name, e.g. "Bongo Pool Table". */
export function logoTexture(scene: Phaser.Scene, title: string): string {
  return canvasTexture(scene, `logo-${title}`, LOGO_ART.width, LOGO_ART.height, (ctx, w) => drawLogo(ctx, w, title));
}

export function drawLogo(ctx: CanvasRenderingContext2D, w: number, title: string): void {
  const L = LOGO_ART;
  const [first = '', ...rest] = title.toUpperCase().split(' ');
  const word = L.word;
  ctx.font = `900 ${word.size}px ${L.font}`;
  ctx.textBaseline = 'middle';
  const letters = [...first];
  // The first O is an 8-ball, as wide as an O.
  const ballIndex = letters.indexOf('O');
  const widths = letters.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + word.letterGap * (letters.length - 1);
  let x = (w - total) / 2;
  const fill = ctx.createLinearGradient(0, word.y - word.size / 2, 0, word.y + word.size / 2);
  word.fill.forEach((c, i) => fill.addColorStop(i / (word.fill.length - 1), c));
  letters.forEach((ch, i) => {
    const cw = widths[i]!;
    if (i === ballIndex) {
      eightBall(ctx, x + cw / 2, word.y + 2, word.size * 0.38);
      ctx.font = `900 ${word.size}px ${L.font}`;
      ctx.textBaseline = 'middle';
    } else {
      ctx.lineJoin = 'round';
      ctx.shadowColor = word.shadow;
      ctx.shadowOffsetY = 5;
      ctx.shadowBlur = 6;
      ctx.lineWidth = word.strokeWidth;
      ctx.strokeStyle = word.stroke;
      ctx.strokeText(ch, x, word.y);
      ctx.shadowColor = 'rgba(0, 0, 0, 0)';
      ctx.fillStyle = fill;
      ctx.fillText(ch, x, word.y);
    }
    x += cw + word.letterGap;
  });
  if (rest.length === 0) return;
  // The banner: a ribbon with notched ends.
  const b = L.banner;
  const left = (w - b.width) / 2;
  const top = b.y - b.height / 2;
  ctx.fillStyle = b.dark;
  for (const side of [-1, 1]) {
    const ex = side < 0 ? left - 26 : left + b.width + 26;
    const ix = side < 0 ? left + 6 : left + b.width - 6;
    ctx.beginPath();
    ctx.moveTo(ix, top + 6);
    ctx.lineTo(ex, top + 6);
    ctx.lineTo(ex + side * -b.notch, top + 6 + b.height / 2);
    ctx.lineTo(ex, top + 6 + b.height);
    ctx.lineTo(ix, top + 6 + b.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = b.fill;
  ctx.fillRect(left, top, b.width, b.height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(left, top, b.width, b.height / 3);
  ctx.font = `800 ${b.size}px ${L.font}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = b.text;
  const label = rest.join(' ').split('').join(String.fromCharCode(0x200a));
  ctx.fillText(label, w / 2, b.y + 1);
  ctx.textAlign = 'start';
}

export function eightBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const B = LOGO_ART.ball;
  ctx.fillStyle = LOGO_ART.word.stroke;
  ctx.beginPath();
  ctx.arc(x, y, r + LOGO_ART.word.strokeWidth / 2, 0, FULL);
  ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, '#555555');
  g.addColorStop(0.5, B.color);
  g.addColorStop(1, '#000000');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, FULL);
  ctx.fill();
  ctx.fillStyle = B.spot;
  ctx.beginPath();
  ctx.arc(x - r * 0.12, y - r * 0.12, r * 0.42, 0, FULL);
  ctx.fill();
  ctx.fillStyle = B.color;
  ctx.font = `900 ${Math.round(r * 0.62)}px ${LOGO_ART.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('8', x - r * 0.12, y - r * 0.08);
  ctx.textAlign = 'start';
  ctx.fillStyle = B.shine;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.42, y - r * 0.5, r * 0.18, r * 0.1, -0.6, 0, FULL);
  ctx.fill();
}
