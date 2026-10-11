import * as Phaser from 'phaser';
import { TUBE_ART } from '../config/art';
import { TABLE_DEPTH, TABLE_LAYOUT, TUBE, type ScreenSides } from '../config/layout';
import type { Ball, BallKind } from '../physics/types';
import { ballTexture } from './art/ballArt';
import { canvasTexture } from './art/canvasArt';

/** Above the balls on the table's edge, below the aim guide: the glass front sits over the tube's balls. */
const DEPTH = { back: TABLE_DEPTH.shadows, balls: TABLE_DEPTH.balls, front: TABLE_DEPTH.balls + 0.5 };

/**
 * The see-through tube potted balls roll into (Robert, 2026-10-11). Looks only: it follows the
 * balls' `pocketed` flags, so it is right after a new game, a saved game or a test layout. A ball
 * potted during play rolls in along the pipe and drops onto the stack; balls already potted when
 * the table opens are simply shown, in ball-number order (the save does not keep the potting order).
 */
export class PottedTube {
  private readonly order: { id: number; image: Phaser.GameObjects.Image }[] = [];
  /** Balls rolling in: when they started and how long the fall takes. */
  private readonly rolling = new Map<Phaser.GameObjects.Image, { n: number; start: number; fallMs: number }>();
  private seen = false;
  /** Design-pixel geometry, for the right hand; `x()` mirrors it for the left. */
  private readonly half: number;
  private readonly pipeEnd: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sides: ScreenSides,
    private readonly ballRadius: number,
  ) {
    const inner = ballRadius + TUBE.clearance;
    this.half = inner + TUBE.wall;
    this.pipeEnd = TABLE_LAYOUT.originX - TABLE_LAYOUT.railWidth + TUBE_ART.pipeOverlap;
    const left = TUBE.x - this.half;
    const width = this.pipeEnd - left;
    const height = TUBE.bottom - TUBE.top;
    const flip = sides.hand === 'left';
    const at = (key: string, depth: number) =>
      scene.add
        .image(this.x(left + width / 2), TUBE.top + height / 2, key)
        .setFlipX(flip)
        .setDepth(depth);
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
    for (const [image, r] of this.rolling) {
      const t = now - r.start;
      const along = Math.min(1, t / TUBE.pipeMs);
      image.x = this.x(this.pipeEnd + (TUBE.x - this.pipeEnd) * along);
      const fall = Math.min(1, Math.max(0, (t - TUBE.pipeMs) / r.fallMs));
      image.y = TUBE.entryY + (this.restY(r.n) - TUBE.entryY) * Phaser.Math.Easing.Bounce.Out(fall);
      if (fall >= 1) this.rolling.delete(image);
    }
  }

  /** Ids in the tube, bottom first. */
  get ids(): number[] {
    return this.order.map((o) => o.id);
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

  /** Brings the tube in line with the balls: potted object balls in, any back on the table out. */
  sync(balls: readonly Ball[]): void {
    const potted = balls.filter((b) => b.kind !== 'cue' && b.pocketed);
    const pottedIds = new Set(potted.map((b) => b.id));
    if (this.order.some((o) => !pottedIds.has(o.id))) {
      // A new game or a test layout: start again and show what is potted without rolling it in.
      for (const o of this.order) {
        this.rolling.delete(o.image);
        o.image.destroy();
      }
      this.order.length = 0;
      this.seen = false;
    }
    const animate = this.seen;
    this.seen = true;
    const inTube = new Set(this.ids);
    for (const ball of potted) if (!inTube.has(ball.id)) this.add(ball.id, ball.kind, animate);
  }

  private add(id: number, kind: BallKind, animate: boolean): void {
    const n = this.order.length;
    const image = this.scene.add.image(this.x(TUBE.x), this.restY(n), ballTexture(this.scene, kind, this.ballRadius)).setDepth(DEPTH.balls).setName(`tube-${id}`);
    this.order.push({ id, image });
    if (!animate) return;
    image.setPosition(this.x(this.pipeEnd), TUBE.entryY);
    const fall = this.restY(n) - TUBE.entryY;
    const fallMs = Math.min(TUBE.maxFallMs, Math.sqrt((2 * fall) / TUBE.gravity) * 1000);
    this.rolling.set(image, { n, start: this.scene.time.now, fallMs });
  }

  /** The tube's glass, pipe and caps, drawn once: the back (inside) and the front (glass over the balls). */
  private texture(layer: 'back' | 'front', width: number, height: number): string {
    const a = TUBE_ART;
    const r = this.ballRadius;
    return canvasTexture(this.scene, `tube-${layer}-${Math.round(width)}x${Math.round(height)}-${r.toFixed(2)}`, width, height, (ctx, w, h) => {
      const tubeW = 2 * this.half;
      const pipeTop = TUBE.entryY - TUBE.top - this.half;
      const shape = () => {
        ctx.beginPath();
        ctx.roundRect(0, 0, tubeW, h, this.half);
        ctx.rect(this.half, pipeTop, w - this.half, 2 * this.half);
      };
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
      ctx.lineTo(w, pipeTop);
      ctx.moveTo(tubeW - a.edgeWidth / 2, pipeTop + 2 * this.half);
      ctx.lineTo(w, pipeTop + 2 * this.half);
      ctx.stroke();
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
