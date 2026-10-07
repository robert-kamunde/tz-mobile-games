import * as Phaser from 'phaser';
import { AIM_GUIDE, BALL_IN_HAND, COLORS, CUE_STICK } from '../config/layout';
import type { AimGuide } from '../physics/aim';
import type { Ball, Vec2 } from '../physics/types';
import type { TableView } from './TableView';

/** Draws the aiming guide (path, ghost ball, predicted directions) and the cue stick. */
export class AimView {
  private readonly guideGraphics: Phaser.GameObjects.Graphics;
  private readonly cueGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, private readonly table: TableView) {
    this.guideGraphics = scene.add.graphics().setName('aimGuide');
    this.cueGraphics = scene.add.graphics().setName('cueStick');
  }

  hide(): void {
    this.guideGraphics.clear();
    this.cueGraphics.clear();
  }

  /** `ballInHand` adds a ring round the cue ball to show it can be dragged. */
  draw(cue: Ball, direction: Vec2, guide: AimGuide | null, power: number, ballInHand: boolean): void {
    this.drawGuide(cue, guide);
    this.drawCue(cue, direction, power);
    if (ballInHand) {
      const c = this.table.toDesign(cue.x, cue.y);
      this.cueGraphics.lineStyle(BALL_IN_HAND.ringWidth, COLORS.ballInHandRing, 1);
      this.cueGraphics.strokeCircle(c.x, c.y, BALL_IN_HAND.ringRadius);
    }
  }

  private drawGuide(cue: Ball, guide: AimGuide | null): void {
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
      if (c.x !== 0 || c.y !== 0) {
        const cueEnd = t.toDesign(guide.contact.x + c.x * follow, guide.contact.y + c.y * follow);
        g.lineStyle(AIM_GUIDE.lineWidth, COLORS.aimLine, AIM_GUIDE.alpha / 2);
        g.lineBetween(contact.x, contact.y, cueEnd.x, cueEnd.y);
      }
    }
  }

  private drawCue(cue: Ball, direction: Vec2, power: number): void {
    const g = this.cueGraphics;
    g.clear();
    const centre = this.table.toDesign(cue.x, cue.y);
    const gap = this.table.px(cue.radius) + CUE_STICK.restGap + power * CUE_STICK.maxPullBack;
    const tipX = centre.x - direction.x * gap;
    const tipY = centre.y - direction.y * gap;
    g.lineStyle(CUE_STICK.width, COLORS.cue, 1);
    g.lineBetween(tipX, tipY, tipX - direction.x * CUE_STICK.length, tipY - direction.y * CUE_STICK.length);
  }
}
