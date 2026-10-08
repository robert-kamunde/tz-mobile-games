import * as Phaser from 'phaser';
import { COLORS, SPIN_CONTROL, TEXT_STYLE } from '../config/layout';
import { CENTRE_TIP, controlFromTip, tipFromControl, type TipOffset } from '../controls/spin';
import { textStyle } from './ui';

/**
 * Cue-ball face for choosing spin: touch or drag to move the red dot where the cue should strike.
 * The scene routes touches here and reads `tip` when the shot is played.
 */
export class SpinControl {
  private readonly face: Phaser.GameObjects.Arc;
  private readonly cross: Phaser.GameObjects.Graphics;
  private readonly dot: Phaser.GameObjects.Arc;
  private value: TipOffset = CENTRE_TIP;

  constructor(
    scene: Phaser.Scene,
    labelText: string,
    private readonly maxTipOffset: number,
  ) {
    const c = SPIN_CONTROL;
    scene.add
      .text(c.x, c.y - c.radius - c.labelGap, labelText, textStyle(TEXT_STYLE.labelSize))
      .setOrigin(0.5)
      .setName('spinLabel');
    this.face = scene.add.circle(c.x, c.y, c.radius, COLORS.ball.cue).setStrokeStyle(1.5, COLORS.ballOutline, 0.6).setName('spinControl');
    this.cross = scene.add.graphics().setName('spinCross');
    this.cross.lineStyle(1, COLORS.spinCross, c.crossAlpha);
    this.cross.lineBetween(c.x - c.radius, c.y, c.x + c.radius, c.y);
    this.cross.lineBetween(c.x, c.y - c.radius, c.x, c.y + c.radius);
    this.dot = scene.add.circle(c.x, c.y, c.dotRadius, COLORS.spinDot).setName('spinDot');
  }

  get tip(): TipOffset {
    return this.value;
  }

  /** True if a design-pixel point should grab the control. */
  hitTest(x: number, y: number): boolean {
    const r = SPIN_CONTROL.radius + SPIN_CONTROL.touchPadding;
    const dx = x - SPIN_CONTROL.x;
    const dy = y - SPIN_CONTROL.y;
    return dx * dx + dy * dy <= r * r;
  }

  /** Moves the dot to the touched point (pulled onto the edge if beyond it). */
  setFromPoint(x: number, y: number): void {
    this.set(tipFromControl(x - SPIN_CONTROL.x, y - SPIN_CONTROL.y, SPIN_CONTROL.radius, this.maxTipOffset));
  }

  /** Back to a centre-ball hit, after each shot. */
  reset(): void {
    this.set(CENTRE_TIP);
  }

  setEnabled(enabled: boolean): void {
    const alpha = enabled ? 1 : SPIN_CONTROL.disabledAlpha;
    for (const o of [this.face, this.cross, this.dot]) o.setAlpha(alpha);
  }

  private set(tip: TipOffset): void {
    this.value = tip;
    const p = controlFromTip(tip, SPIN_CONTROL.radius, this.maxTipOffset);
    this.dot.setPosition(SPIN_CONTROL.x + p.x, SPIN_CONTROL.y + p.y);
  }
}
