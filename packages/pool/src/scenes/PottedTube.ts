import * as Phaser from 'phaser';
import { getServices } from '@tzg/shell';
import { TUBE_ART } from '../config/art';
import { TABLE_DEPTH, TABLE_LAYOUT, TUBE, type ScreenSides } from '../config/layout';
import { SOUND_MIX } from '../config/sound';
import type { Ball, Vec2 } from '../physics/types';
import { ballTexture } from './art/ballArt';
import { canvasTexture } from './art/canvasArt';

/** Where Bounce.Out first reaches the bottom (1 / 2.75 of the way). */
const FIRST_BOUNCE = 1 / 2.75;

/**
 * Above the balls on the table's edge, below the aim guide: the glass front sits over the tube's
 * balls. The shadow lies on the table picture (depth 0) under everything else.
 */
const DEPTH = { shadow: TABLE_DEPTH.shadows - 0.5, back: TABLE_DEPTH.shadows, balls: TABLE_DEPTH.balls, front: TABLE_DEPTH.balls + 0.5 };

/**
 * The see-through tube potted balls roll into (Robert, 2026-10-11). Looks only: it follows the
 * balls' `pocketed` flags, so it is right after a new game, a saved game or a test layout. A ball
 * potted during play rolls in along the pipe and drops onto the stack; balls already potted when
 * the table opens are simply shown, in ball-number order (the save does not keep the potting order).
 * Before the pipe, a potted ball rolls unseen under the table for longer the farther its pocket is
 * from the tube (0.30.0), so balls take their place in the order they arrive.
 */
export class PottedTube {
  private readonly order: { id: number; image: Phaser.GameObjects.Image }[] = [];
  /** Balls rolling in: when they started, how long the fall takes, and whether the landing click played. */
  private readonly rolling = new Map<Phaser.GameObjects.Image, { n: number; start: number; fallMs: number; landed: boolean }>();
  /** Balls still under the table, hidden: when each reaches the pipe. */
  private readonly underTable: { id: number; image: Phaser.GameObjects.Image; at: number }[] = [];
  private nextRumble = 0;
  /** Design-pixel geometry, for the right hand; `x()` mirrors it for the left. */
  private readonly half: number;
  /** The rail's outer edge, where the pipe goes under the table. */
  private readonly pipeEnd: number;
  /** Where a ball comes out: just clear of the collar, so it never shows over the rail. */
  private readonly ballStart: number;
  /** How far the drawing reaches past the rail's edge: the collar's overhang and its shadow on the rail. */
  private readonly beyondRail: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sides: ScreenSides,
    private readonly ballRadius: number,
    /** Table metres to design pixels: a potted ball rests at its pocket's centre. */
    private readonly toDesign: (x: number, y: number) => Vec2,
  ) {
    const inner = ballRadius + TUBE.clearance;
    this.half = inner + TUBE.wall;
    this.pipeEnd = TABLE_LAYOUT.originX - TABLE_LAYOUT.railWidth;
    const c = TUBE_ART.collar;
    this.beyondRail = c.overhang + c.contact.width;
    this.ballStart = this.pipeEnd + c.overhang - c.width - ballRadius;
    const left = TUBE.x - this.half;
    const width = this.pipeEnd + this.beyondRail - left;
    const height = TUBE.bottom - TUBE.top;
    const flip = sides.hand === 'left';
    const at = (key: string, depth: number, dx = 0, dy = 0) =>
      scene.add
        .image(this.x(left + width / 2) + (flip ? -dx : dx), TUBE.top + height / 2 + dy, key)
        .setFlipX(flip)
        .setDepth(depth);
    const s = TUBE_ART.shadow;
    at(this.shadowTexture(width, height), DEPTH.shadow, s.dx, s.dy).setName('tube-shadow');
    at(this.texture('back', width, height), DEPTH.back).setName('tube');
    at(this.texture('front', width, height), DEPTH.front);
    // Moved by hand each frame from the scene clock rather than with tweens, so a slow or busy
    // frame can only make the roll jerky, never leave a ball stuck halfway.
    const step = () => this.roll();
    scene.events.on(Phaser.Scenes.Events.UPDATE, step);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, step));
  }

  private roll(): void {
    const now = this.scene.time.now;
    this.reachPipe(now);
    for (const [image, r] of this.rolling) {
      const t = now - r.start;
      const along = Math.min(1, t / TUBE.pipeMs);
      image.x = this.x(this.ballStart + (TUBE.x - this.ballStart) * along);
      // Coming out from under the collar, out of the dark.
      image.setAlpha(Math.min(1, along / TUBE_ART.fadeInAlong));
      const fall = Math.min(1, Math.max(0, (t - TUBE.pipeMs) / r.fallMs));
      image.y = TUBE.entryY + (this.restY(r.n) - TUBE.entryY) * Phaser.Math.Easing.Bounce.Out(fall);
      // The first touch down of the bounce.
      if (!r.landed && fall >= FIRST_BOUNCE) {
        r.landed = true;
        this.play('tubeLand');
      }
      if (fall >= 1) this.rolling.delete(image);
    }
  }

  /** Balls whose time under the table is up enter the pipe and take the next place; the rest rumble on. */
  private reachPipe(now: number): void {
    if (this.underTable.length === 0) return;
    this.underTable.sort((a, b) => a.at - b.at);
    while (this.underTable.length > 0 && this.underTable[0]!.at <= now) {
      const { id, image, at } = this.underTable.shift()!;
      const n = this.order.length;
      this.order.push({ id, image });
      image.setPosition(this.x(this.ballStart), TUBE.entryY).setAlpha(0).setVisible(true);
      const fall = this.restY(n) - TUBE.entryY;
      const fallMs = Math.min(TUBE.maxFallMs, Math.sqrt((2 * fall) / TUBE.gravity) * 1000);
      // Timed from when it was due, so a slow frame cannot stretch the roll.
      this.rolling.set(image, { n, start: at, fallMs, landed: false });
      this.play('tubeRoll');
    }
    if (this.underTable.length > 0 && now >= this.nextRumble) {
      this.play('underRoll');
      this.nextRumble = now + SOUND_MIX.underRollEveryMs;
    }
  }

  private play(name: 'underRoll' | 'tubeRoll' | 'tubeLand'): void {
    getServices(this.scene).sound.play(name, SOUND_MIX[name]);
  }

  /** Ids in the tube, bottom first (balls still under the table are not in it yet). */
  get ids(): number[] {
    return this.order.map((o) => o.id);
  }

  /** Ids still rolling under the table (browser tests). */
  get waitingIds(): number[] {
    return this.underTable.map((u) => u.id);
  }

  /** How long a ball potted in the pocket at this design point rolls under the table, in ms. */
  underTableMs(pocket: Vec2): number {
    const d = Math.hypot(pocket.x - this.x(this.pipeEnd), pocket.y - TUBE.entryY);
    return Math.min(TUBE.underTable.maxMs, (d / TUBE.underTable.speed) * 1000);
  }

  /** Mirrors a right-hand x for the player's hand. */
  private x(x: number): number {
    return this.sides.controlX(x);
  }

  /** Where the n-th ball from the bottom rests. */
  private restY(n: number): number {
    const step = 2 * this.ballRadius + TUBE.gap;
    return TUBE.bottom - TUBE_ART.cap.height - this.ballRadius - n * step;
  }

  /**
   * Brings the tube in line with the balls: potted object balls in, any back on the table out. Only
   * a ball potted during a shot (`live`) rolls in; others (a new game, a saved game, a test layout)
   * are simply shown.
   */
  sync(balls: readonly Ball[], live: boolean): void {
    const potted = balls.filter((b) => b.kind !== 'cue' && b.pocketed);
    const pottedIds = new Set(potted.map((b) => b.id));
    if ([...this.order, ...this.underTable].some((o) => !pottedIds.has(o.id))) {
      // A new game or a test layout: start again and show what is potted without rolling it in.
      for (const o of [...this.order, ...this.underTable]) {
        this.rolling.delete(o.image);
        o.image.destroy();
      }
      this.order.length = 0;
      this.underTable.length = 0;
    }
    const animate = live;
    const inTube = new Set([...this.ids, ...this.waitingIds]);
    for (const ball of potted) if (!inTube.has(ball.id)) this.add(ball, animate);
  }

  private add(ball: Ball, animate: boolean): void {
    const image = this.scene.add.image(0, 0, ballTexture(this.scene, ball.kind, this.ballRadius)).setDepth(DEPTH.balls).setName(`tube-${ball.id}`);
    if (!animate) {
      image.setPosition(this.x(TUBE.x), this.restY(this.order.length));
      this.order.push({ id: ball.id, image });
      return;
    }
    // Hidden until it reaches the pipe; the rumble starts at once.
    image.setVisible(false);
    const now = this.scene.time.now;
    if (this.underTable.length === 0) this.nextRumble = now;
    this.underTable.push({ id: ball.id, image, at: now + this.underTableMs(this.toDesign(ball.x, ball.y)) });
  }

  /** The tube and pipe's outline, in texture pixels: the pipe stops at the rail's edge. */
  private outline(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const pipeTop = TUBE.entryY - TUBE.top - this.half;
    ctx.beginPath();
    ctx.roundRect(0, 0, 2 * this.half, h, this.half);
    ctx.rect(this.half, pipeTop, w - this.beyondRail - this.half, 2 * this.half);
  }

  /** The soft shadow under the tube and pipe, drawn once, centred like the tube with room for the blur. */
  private shadowTexture(width: number, height: number): string {
    const s = TUBE_ART.shadow;
    const pad = 2 * s.blur;
    const key = `tube-shadow-${Math.round(width)}x${Math.round(height)}-${this.ballRadius.toFixed(2)}`;
    return canvasTexture(this.scene, key, width + 2 * pad, height + 2 * pad, (ctx, w) => {
      // Only the blurred shadow is wanted: the shape is drawn off the canvas and its shadow thrown back on.
      const away = 2 * w;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = s.blur;
      ctx.shadowOffsetX = away;
      ctx.translate(pad - away, pad);
      this.outline(ctx, width, height);
      ctx.fillStyle = '#000';
      ctx.fill();
    });
  }

  /** The tube's glass, pipe and caps, drawn once: the back (inside) and the front (glass over the balls). */
  private texture(layer: 'back' | 'front', width: number, height: number): string {
    const a = TUBE_ART;
    const r = this.ballRadius;
    return canvasTexture(this.scene, `tube-${layer}-${Math.round(width)}x${Math.round(height)}-${r.toFixed(2)}`, width, height, (ctx, w, h) => {
      const tubeW = 2 * this.half;
      const pipeTop = TUBE.entryY - TUBE.top - this.half;
      const mouthX = w - this.beyondRail;
      const shape = () => this.outline(ctx, w, h);
      if (layer === 'back') {
        shape();
        ctx.fillStyle = a.inside;
        ctx.fill();
        return;
      }
      shape();
      ctx.fillStyle = a.glass;
      ctx.fill();
      ctx.lineWidth = a.edgeWidth;
      ctx.strokeStyle = a.edge;
      ctx.beginPath();
      ctx.roundRect(a.edgeWidth / 2, a.edgeWidth / 2, tubeW - a.edgeWidth, h - a.edgeWidth, this.half);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tubeW - a.edgeWidth / 2, pipeTop);
      ctx.lineTo(mouthX, pipeTop);
      ctx.moveTo(tubeW - a.edgeWidth / 2, pipeTop + 2 * this.half);
      ctx.lineTo(mouthX, pipeTop + 2 * this.half);
      ctx.stroke();
      // The pipe darkens towards the table, as it goes under it.
      const m = a.mouth;
      const fadeFrom = Math.max(tubeW, mouthX - m.fadeRadii * r);
      const dark = ctx.createLinearGradient(fadeFrom, 0, mouthX, 0);
      dark.addColorStop(0, 'rgba(0, 0, 0, 0)');
      dark.addColorStop(1, `rgba(0, 0, 0, ${m.fadeAlpha})`);
      ctx.fillStyle = dark;
      ctx.fillRect(fadeFrom, pipeTop, mouthX - fadeFrom, 2 * this.half);
      // The metal collar where the pipe goes under the rail, and its shadow on the rail.
      const c = a.collar;
      const cy = TUBE.entryY - TUBE.top;
      const collarTop = cy - this.half - c.extra;
      const collarH = 2 * (this.half + c.extra);
      const collarRight = mouthX + c.overhang;
      const contact = ctx.createLinearGradient(collarRight, 0, collarRight + c.contact.width, 0);
      contact.addColorStop(0, c.contact.color);
      contact.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = contact;
      ctx.fillRect(collarRight, collarTop + 1, c.contact.width, collarH - 2);
      const metal = ctx.createLinearGradient(0, collarTop, 0, collarTop + collarH);
      metal.addColorStop(0, a.cap.dark);
      metal.addColorStop(0.35, a.cap.light);
      metal.addColorStop(1, a.cap.dark);
      ctx.fillStyle = metal;
      ctx.beginPath();
      ctx.roundRect(collarRight - c.width, collarTop, c.width, collarH, c.radius);
      ctx.fill();
      // A bright streak down the front.
      ctx.fillStyle = a.shine.color;
      ctx.beginPath();
      ctx.roundRect(tubeW * a.shine.x, this.half, tubeW * a.shine.width, h - 2 * this.half, tubeW * a.shine.width);
      ctx.fill();
      // Metal caps at both ends.
      for (const y of [0, h - a.cap.height]) {
        const g = ctx.createLinearGradient(0, 0, tubeW, 0);
        g.addColorStop(0, a.cap.dark);
        g.addColorStop(0.35, a.cap.light);
        g.addColorStop(1, a.cap.dark);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(0, y, tubeW, a.cap.height, Math.min(a.cap.height / 2, r / 3));
        ctx.fill();
      }
    });
  }
}
