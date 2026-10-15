import type * as Phaser from 'phaser';
import { CONFETTI } from '../config/layout';

/**
 * Confetti when a person wins (0.37.0, Robert's idea): paper pieces in bright colours fall from
 * above the screen over the table, drifting sideways and spinning, and fade out. Looks only; each
 * piece removes itself, so nothing is left behind. `active` is the number still falling (tests).
 */
export class Confetti {
  private pieces = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  get active(): number {
    return this.pieces;
  }

  /** Throws one burst, spread across the screen from `dx` (the table's offset for the hand setting). */
  burst(dx = 0): void {
    const c = CONFETTI;
    const between = (min: number, max: number) => min + Math.random() * (max - min);
    for (let i = 0; i < c.count; i++) {
      const x = between(c.fromX, c.toX) + dx;
      const piece = this.scene.add
        .rectangle(x, c.startY, between(c.width.min, c.width.max), between(c.height.min, c.height.max), c.colors[i % c.colors.length])
        .setAngle(between(0, 360))
        .setDepth(c.depth);
      this.pieces += 1;
      const duration = between(c.fallMs.min, c.fallMs.max);
      const flutter = between(c.flutterMs.min, c.flutterMs.max);
      this.scene.tweens.add({
        targets: piece,
        y: c.endY,
        x: x + between(-c.drift, c.drift),
        angle: piece.angle + between(-360, 360) * c.spins,
        // Spinning paper flutters: it looks thinner as it turns.
        // A whole number of flutters within the fall, so the tween (and the piece) ends with it.
        scaleX: { from: 1, to: c.flutterScale, yoyo: true, repeat: Math.max(0, Math.floor(duration / (2 * flutter)) - 1), duration: flutter },
        alpha: { from: 1, to: 0, ease: 'Quad.In' },
        delay: between(0, c.delayMs),
        duration,
        onComplete: () => {
          piece.destroy();
          this.pieces -= 1;
        },
      });
    }
  }
}
