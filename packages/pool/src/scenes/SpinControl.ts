import * as Phaser from 'phaser';
import { COLORS, HUD, SPIN_CONTROL, TEXT_STYLE, type ScreenSides } from '../config/layout';
import { CENTRE_TIP, controlFromTip, tipFromControl, type TipOffset } from '../controls/spin';
import { ballTexture } from './art/ballArt';
import { spinTipTexture } from './art/controlsArt';
import { textStyle } from './ui';

/**
 * Cue-ball face for choosing spin: touch or drag to move the red dot where the cue should strike.
 * The scene routes touches here and reads `tip` when the shot is played.
 */
export class SpinControl {
  private readonly face: Phaser.GameObjects.Image;
  private readonly cross: Phaser.GameObjects.Graphics;
  private readonly dot: Phaser.GameObjects.Image;
  private value: TipOffset = CENTRE_TIP;
  /** Centre of the face: right edge, or left for left-handed players. */
  readonly x: number;
  readonly y = SPIN_CONTROL.y;

  constructor(
    scene: Phaser.Scene,
    labelText: string,
    private readonly maxTipOffset: number,
    sides: ScreenSides,
  ) {
    const c = { ...SPIN_CONTROL, x: sides.controlX(SPIN_CONTROL.x) };
    this.x = c.x;
    scene.add
      .text(c.x, c.y - c.radius - c.labelGap, labelText, textStyle(TEXT_STYLE.labelSize))
      .setOrigin(0.5)
      .setName('spinLabel')
      .setDepth(HUD.depth);
    // The face is the cue ball as drawn on the table, only larger.
    this.face = scene.add.image(c.x, c.y, ballTexture(scene, 'cue', c.radius)).setName('spinControl');
    this.cross = scene.add.graphics().setName('spinCross');
    this.cross.lineStyle(1, COLORS.spinCross, c.crossAlpha);
    this.cross.lineBetween(c.x - c.radius, c.y, c.x + c.radius, c.y);
    this.cross.lineBetween(c.x, c.y - c.radius, c.x, c.y + c.radius);
    this.dot = scene.add.image(c.x, c.y, spinTipTexture(scene, c.dotRadius)).setName('spinDot');
    // Above the cue, which can reach across the controls when aiming towards them.
    for (const o of [this.face, this.cross, this.dot]) o.setDepth(HUD.depth);
  }

  get tip(): TipOffset {
    return this.value;
  }

  /** True if a design-pixel point should grab the control. */
  hitTest(x: number, y: number): boolean {
    const r = SPIN_CONTROL.radius + SPIN_CONTROL.touchPadding;
    const dx = x - this.x;
    const dy = y - SPIN_CONTROL.y;
    return dx * dx + dy * dy <= r * r;
  }

  /** Moves the dot to the touched point (pulled onto the edge if beyond it). */
  setFromPoint(x: number, y: number): void {
    this.set(tipFromControl(x - this.x, y - SPIN_CONTROL.y, SPIN_CONTROL.radius, this.maxTipOffset));
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
    this.dot.setPosition(this.x + p.x, this.y + p.y);
  }
}
