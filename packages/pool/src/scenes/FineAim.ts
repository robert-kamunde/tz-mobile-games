import * as Phaser from 'phaser';
import { CONTROLS_ART } from '../config/art';
import { COLORS, FINE_AIM, HUD, type ScreenSides } from '../config/layout';

/**
 * Fine-aim strip: drag along it to turn the aim a little. Tick marks slide with the finger so the
 * player sees it working. Returns angles; the scene turns the aim.
 */
export class FineAim {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private lastX: number | null = null;
  /** Total drag in design pixels, for drawing the ticks. */
  private offset = 0;
  /** Centre of the strip, under the table wherever it sits. */
  readonly x: number;
  readonly y = FINE_AIM.y;

  constructor(scene: Phaser.Scene, sides: ScreenSides) {
    this.x = FINE_AIM.x + sides.tableDx;
    this.graphics = scene.add.graphics().setName('fineAim').setDepth(HUD.depth);
    this.redraw();
  }

  get dragging(): boolean {
    return this.lastX !== null;
  }

  hitTest(x: number, y: number): boolean {
    const f = FINE_AIM;
    return Math.abs(x - this.x) <= f.width / 2 + f.touchPadding && Math.abs(y - f.y) <= f.height / 2 + f.touchPadding;
  }

  begin(x: number): void {
    this.lastX = x;
  }

  /** Returns the angle to turn the aim by for this finger movement (radians, + clockwise). */
  move(x: number): number {
    if (this.lastX === null || !Number.isFinite(x)) return 0;
    const dx = x - this.lastX;
    this.lastX = x;
    this.offset += dx;
    this.redraw();
    return dx * FINE_AIM.radiansPerPixel;
  }

  end(): void {
    this.lastX = null;
  }

  setEnabled(enabled: boolean): void {
    this.graphics.setAlpha(enabled ? 1 : FINE_AIM.disabledAlpha);
  }

  private redraw(): void {
    const f = FINE_AIM;
    const g = this.graphics;
    const left = this.x - f.width / 2;
    g.clear();
    g.fillStyle(COLORS.fineAimTrack, 1);
    g.fillRoundedRect(left, f.y - f.height / 2, f.width, f.height, f.height / 2);
    g.lineStyle(CONTROLS_ART.track.borderWidth, Phaser.Display.Color.HexStringToColor(CONTROLS_ART.track.border).color, 1);
    g.strokeRoundedRect(left, f.y - f.height / 2, f.width, f.height, f.height / 2);
    g.fillStyle(COLORS.fineAimTick, 1);
    const shift = ((this.offset % f.tickSpacing) + f.tickSpacing) % f.tickSpacing;
    // Ticks stay clear of the rounded ends.
    const inset = f.height / 2;
    for (let x = left + inset + shift; x < left + f.width - inset; x += f.tickSpacing) {
      g.fillRect(x - f.tickWidth / 2, f.y - f.tickHeight / 2, f.tickWidth, f.tickHeight);
    }
  }
}
