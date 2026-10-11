import * as Phaser from 'phaser';
import { CUE_ART } from '../config/art';
import { AIM_GUIDE, BALL_IN_HAND, COLORS, CUE_STICK, TABLE_DEPTH } from '../config/layout';
import type { AimGuide } from '../physics/aim';
import type { Ball, Vec2 } from '../physics/types';
import type { TableView } from './TableView';
import { cueShadowTexture, cueTexture } from './art/cueArt';

/** Draws the aiming guide (path, ghost ball, predicted directions) and the cue stick. */
export class AimView {
  private readonly guideGraphics: Phaser.GameObjects.Graphics;
  private readonly cueGraphics: Phaser.GameObjects.Graphics;
  private readonly cue: Phaser.GameObjects.Image;
  private readonly cueShadow: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, private readonly table: TableView) {
    this.guideGraphics = scene.add.graphics().setName('aimGuide').setDepth(TABLE_DEPTH.aim);
    // The tip is the image's left end, so rotating about it points the cue along the aim.
    this.cueShadow = scene.add.image(0, 0, cueShadowTexture(scene)).setOrigin(0, 0.5).setAlpha(CUE_ART.shadow.alpha).setDepth(TABLE_DEPTH.aim).setVisible(false);
    this.cue = scene.add.image(0, 0, cueTexture(scene)).setOrigin(0, 0.5).setName('cueStick').setDepth(TABLE_DEPTH.aim).setVisible(false);
    this.cueGraphics = scene.add.graphics().setName('ballInHandRing').setDepth(TABLE_DEPTH.aim);
  }

  hide(): void {
    this.guideGraphics.clear();
    this.cueGraphics.clear();
    this.cue.setVisible(false);
    this.cueShadow.setVisible(false);
  }

  /**
   * `ballInHand` adds a ring round the cue ball to show it can be dragged. `showCuePath` draws the
   * cue ball's direction after contact (only right for a shot with no top or back spin).
   */
  draw(cue: Ball, direction: Vec2, guide: AimGuide | null, power: number, ballInHand: boolean, showCuePath: boolean): void {
    this.drawGuide(cue, guide, showCuePath);
    this.drawCue(cue, direction, power);
    if (ballInHand) {
      const c = this.table.toDesign(cue.x, cue.y);
      this.cueGraphics.lineStyle(BALL_IN_HAND.ringWidth, COLORS.ballInHandRing, 1);
      this.cueGraphics.strokeCircle(c.x, c.y, BALL_IN_HAND.ringRadius);
    }
  }

  private drawGuide(cue: Ball, guide: AimGuide | null, showCuePath: boolean): void {
    const g = this.guideGraphics;
    g.clear();
    if (!guide) return;
    const t = this.table;
    const from = t.toDesign(cue.x, cue.y);
    const contact = t.toDesign(guide.contact.x, guide.contact.y);

    g.lineStyle(AIM_GUIDE.lineWidth, COLORS.aimLine, AIM_GUIDE.alpha);
    g.lineBetween(from.x, from.y, contact.x, contact.y);
    g.strokeCircle(contact.x, contact.y, t.px(cue.radius));

    if (guide.target.type === 'ball') {
      const follow = AIM_GUIDE.followLength;
      const { objectDirection: o, cueDirection: c } = guide.target;
      const objectEnd = t.toDesign(guide.contact.x + o.x * (follow + cue.radius), guide.contact.y + o.y * (follow + cue.radius));
      const objectStart = t.toDesign(guide.contact.x + o.x * cue.radius, guide.contact.y + o.y * cue.radius);
      g.lineBetween(objectStart.x, objectStart.y, objectEnd.x, objectEnd.y);
      if (showCuePath && (c.x !== 0 || c.y !== 0)) {
        const cueEnd = t.toDesign(guide.contact.x + c.x * follow, guide.contact.y + c.y * follow);
        g.lineStyle(AIM_GUIDE.lineWidth, COLORS.aimLine, AIM_GUIDE.alpha / 2);
        g.lineBetween(contact.x, contact.y, cueEnd.x, cueEnd.y);
      }
    }
  }

  private drawCue(cue: Ball, direction: Vec2, power: number): void {
    this.cueGraphics.clear();
    const centre = this.table.toDesign(cue.x, cue.y);
    const gap = this.table.px(cue.radius) + CUE_STICK.restGap + power * CUE_STICK.maxPullBack;
    const tipX = centre.x - direction.x * gap;
    const tipY = centre.y - direction.y * gap;
    // The cue lies behind the tip, pointing away from the aim.
    const angle = Math.atan2(-direction.y, -direction.x);
    this.cue.setPosition(tipX, tipY).setRotation(angle).setVisible(true);
    this.cueShadow.setPosition(tipX + CUE_ART.shadow.offsetX, tipY + CUE_ART.shadow.offsetY).setRotation(angle).setVisible(true);
  }
}
