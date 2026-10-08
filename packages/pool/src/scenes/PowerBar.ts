import * as Phaser from 'phaser';
import { COLORS, POWER_BAR, TEXT_STYLE } from '../config/layout';

/**
 * Vertical pull-back power control. Touch the bar, drag down to set power, let go to shoot.
 * Letting go below POWER_BAR.cancelBelow cancels. Purely visual state plus input maths; the
 * scene decides what a release means.
 */
export class PowerBar {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly handle: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private dragStartY: number | null = null;
  private value = 0;

  constructor(scene: Phaser.Scene, labelText: string) {
    this.graphics = scene.add.graphics().setName('powerTrack');
    this.handle = scene.add
      .rectangle(POWER_BAR.x, POWER_BAR.top, POWER_BAR.width + 12, POWER_BAR.handleHeight, COLORS.powerHandle)
      .setName('powerHandle');
    this.label = scene.add
      .text(POWER_BAR.x, POWER_BAR.top - 30, labelText, { fontFamily: TEXT_STYLE.fontFamily, fontSize: TEXT_STYLE.labelSize, color: COLORS.text })
      .setOrigin(0.5);
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
    const alpha = enabled ? 1 : 0.35;
    this.graphics.setAlpha(alpha);
    this.handle.setAlpha(alpha);
  }

  /** True if a design-pixel point should grab the bar. */
  hitTest(x: number, y: number): boolean {
    const halfWidth = POWER_BAR.width / 2 + POWER_BAR.touchPadding;
    return (
      Math.abs(x - POWER_BAR.x) <= halfWidth &&
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
    const g = this.graphics;
    const left = POWER_BAR.x - POWER_BAR.width / 2;
    g.clear();
    g.fillStyle(COLORS.powerTrack, 1);
    g.fillRect(left, POWER_BAR.top, POWER_BAR.width, POWER_BAR.height);
    g.fillStyle(COLORS.powerFill, 1);
    g.fillRect(left, POWER_BAR.top, POWER_BAR.width, POWER_BAR.height * this.value);
    this.handle.setY(POWER_BAR.top + POWER_BAR.height * this.value);
  }
}
