import * as Phaser from 'phaser';
import { COLORS, HUD, POWER_BAR, TEXT_STYLE, type ScreenSides } from '../config/layout';
import { powerFillTexture, powerHandleTexture, powerTrackTexture } from './art/controlsArt';

/**
 * Vertical pull-back power control. Touch the bar, drag down to set power, let go to shoot.
 * Letting go below POWER_BAR.cancelBelow cancels. Purely visual state plus input maths; the
 * scene decides what a release means.
 */
export class PowerBar {
  private readonly track: Phaser.GameObjects.Image;
  private readonly fill: Phaser.GameObjects.Image;
  private readonly handle: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.Text;
  private dragStartY: number | null = null;
  private value = 0;
  /** Centre line of the bar: right edge, or left for left-handed players. */
  private readonly x: number;

  constructor(scene: Phaser.Scene, labelText: string, sides: ScreenSides) {
    this.x = sides.controlX(POWER_BAR.x);
    const left = this.x - POWER_BAR.width / 2;
    this.track = scene.add.image(left, POWER_BAR.top, powerTrackTexture(scene)).setOrigin(0, 0).setName('powerTrack');
    this.fill = scene.add.image(left, POWER_BAR.top, powerFillTexture(scene)).setOrigin(0, 0).setName('powerFill');
    this.handle = scene.add
      .image(this.x, POWER_BAR.top, powerHandleTexture(scene, POWER_BAR.width + POWER_BAR.handleOverhang, POWER_BAR.handleHeight))
      .setName('powerHandle');
    this.label = scene.add
      .text(this.x, POWER_BAR.top - 30, labelText, { fontFamily: TEXT_STYLE.fontFamily, fontSize: TEXT_STYLE.labelSize, color: COLORS.text })
      .setOrigin(0.5);
    // Above the cue, which can reach across the controls when aiming towards them.
    for (const o of [this.track, this.fill, this.handle, this.label]) o.setDepth(HUD.depth);
    this.redraw();
  }

  get power(): number {
    return this.value;
  }

  get dragging(): boolean {
    return this.dragStartY !== null;
  }

  setLabel(text: string): void {
    this.label.setText(text);
  }

  setEnabled(enabled: boolean): void {
    const alpha = enabled ? 1 : POWER_BAR.disabledAlpha;
    for (const o of [this.track, this.fill, this.handle]) o.setAlpha(alpha);
  }

  /** True if a design-pixel point should grab the bar. */
  hitTest(x: number, y: number): boolean {
    const halfWidth = POWER_BAR.width / 2 + POWER_BAR.touchPadding;
    return (
      Math.abs(x - this.x) <= halfWidth &&
      y >= POWER_BAR.top - POWER_BAR.touchPadding &&
      y <= POWER_BAR.top + POWER_BAR.height + POWER_BAR.touchPadding
    );
  }

  begin(y: number): void {
    this.dragStartY = y;
    this.setValue(0);
  }

  move(y: number): void {
    if (this.dragStartY === null) return;
    this.setValue((y - this.dragStartY) / POWER_BAR.height);
  }

  /** Ends the drag. Returns the power to shoot with, or null if the pull was too small (cancel). */
  release(): number | null {
    if (this.dragStartY === null) return null;
    const power = this.value;
    this.dragStartY = null;
    this.setValue(0);
    return power >= POWER_BAR.cancelBelow ? power : null;
  }

  /** Shows a power the computer has chosen. Not a drag: release() ignores it and cancel() clears it. */
  showValue(value: number): void {
    this.setValue(value);
  }

  /** Abandons a drag without shooting, e.g. when the game is backgrounded. */
  cancel(): void {
    this.dragStartY = null;
    this.setValue(0);
  }

  private setValue(raw: number): void {
    const v = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0;
    this.value = v;
    this.redraw();
  }

  private redraw(): void {
    // The fill shows as far as the pull: green for a gentle shot, red at full power.
    this.fill.setCrop(0, 0, POWER_BAR.width, POWER_BAR.height * this.value);
    this.handle.setY(POWER_BAR.top + POWER_BAR.height * this.value);
  }
}
