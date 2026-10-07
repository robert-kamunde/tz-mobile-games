import * as Phaser from 'phaser';
import { COLORS, TABLE_LAYOUT } from '../config/layout';
import type { TableConfig } from '../config/table';
import type { Ball, TableGeometry, Vec2 } from '../physics/types';

const TABLE_TEXTURE = 'pool-table';
const BALL_OUTLINE = 1.5;

/**
 * Draws the table and balls. Placeholder art: flat shapes only (docs/ASSETS.md).
 * Owns the conversion between table metres and design pixels.
 */
export class TableView {
  private readonly ballSprites = new Map<number, Phaser.GameObjects.Image>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly geometry: TableGeometry,
    private readonly config: TableConfig,
  ) {}

  toDesign(x: number, y: number): Vec2 {
    return { x: TABLE_LAYOUT.originX + x * TABLE_LAYOUT.scale, y: TABLE_LAYOUT.originY + y * TABLE_LAYOUT.scale };
  }

  toTable(x: number, y: number): Vec2 {
    return { x: (x - TABLE_LAYOUT.originX) / TABLE_LAYOUT.scale, y: (y - TABLE_LAYOUT.originY) / TABLE_LAYOUT.scale };
  }

  /** Length in metres to design pixels. */
  px(metres: number): number {
    return metres * TABLE_LAYOUT.scale;
  }

  /** True if a design-pixel point is over the table, rails included. */
  containsDesignPoint(x: number, y: number): boolean {
    const topLeft = this.toDesign(0, 0);
    const bottomRight = this.toDesign(this.geometry.length, this.geometry.width);
    const rail = TABLE_LAYOUT.railWidth;
    return x >= topLeft.x - rail && x <= bottomRight.x + rail && y >= topLeft.y - rail && y <= bottomRight.y + rail;
  }

  /**
   * Draws the static table once into a texture. Phaser rebuilds Graphics geometry every frame,
   * so static art is not left as live Graphics (ARCHITECTURE A12).
   */
  drawTable(): void {
    const topLeft = this.toDesign(0, 0);
    const w = this.px(this.geometry.length);
    const h = this.px(this.geometry.width);
    const rail = TABLE_LAYOUT.railWidth;
    // Texture space: the outer edge of the rail is (0, 0).
    const left = topLeft.x - rail;
    const top = topLeft.y - rail;
    const at = (x: number, y: number) => {
      const p = this.toDesign(x, y);
      return { x: p.x - left, y: p.y - top };
    };

    const g = this.scene.make.graphics({}, false);
    g.fillStyle(COLORS.rail, 1);
    g.fillRect(0, 0, w + 2 * rail, h + 2 * rail);
    g.fillStyle(COLORS.cloth, 1);
    g.fillRect(rail, rail, w, h);

    // Pocket openings: dark areas behind each mouth, drawn generously so the jaws read clearly.
    g.fillStyle(COLORS.pocket, 1);
    const pocketRadius = this.px(Math.max(this.config.cornerMouth, this.config.middleMouth) / 2 + this.config.dropRadius / 2);
    for (const pocket of this.geometry.pockets) {
      const c = at(pocket.center.x, pocket.center.y);
      g.fillCircle(c.x, c.y, pocketRadius);
    }

    // Cushion noses and jaws, as the physics sees them.
    g.lineStyle(4, COLORS.cushion, 1);
    for (const s of this.geometry.cushions) {
      const a = at(s.a.x, s.a.y);
      const b = at(s.b.x, s.b.y);
      g.lineBetween(a.x, a.y, b.x, b.y);
    }

    g.lineStyle(1, COLORS.baulkLine, 0.35);
    const baulk = at(this.config.baulkLine, 0);
    g.lineBetween(baulk.x, baulk.y, baulk.x, baulk.y + h);

    g.generateTexture(TABLE_TEXTURE, Math.ceil(w + 2 * rail), Math.ceil(h + 2 * rail));
    g.destroy();
    this.scene.add.image(left, top, TABLE_TEXTURE).setOrigin(0, 0).setName('table');
  }

  /** Creates or refreshes ball sprites. Pocketed balls are hidden. */
  syncBalls(balls: readonly Ball[]): void {
    for (const ball of balls) {
      let sprite = this.ballSprites.get(ball.id);
      if (!sprite) {
        sprite = this.scene.add.image(0, 0, this.ballTexture(ball)).setName(`ball-${ball.id}`);
        this.ballSprites.set(ball.id, sprite);
      }
      const p = this.toDesign(ball.x, ball.y);
      sprite.setPosition(p.x, p.y);
      sprite.setVisible(!ball.pocketed);
    }
  }

  /** One small texture per ball kind and size, drawn once. */
  private ballTexture(ball: Ball): string {
    const radius = this.px(ball.radius);
    const key = `ball-${ball.kind}-${radius.toFixed(2)}`;
    if (this.scene.textures.exists(key)) return key;
    const size = Math.ceil(2 * radius + 2 * BALL_OUTLINE);
    const g = this.scene.make.graphics({}, false);
    g.fillStyle(COLORS.ball[ball.kind], 1);
    g.fillCircle(size / 2, size / 2, radius);
    g.lineStyle(BALL_OUTLINE, COLORS.ballOutline, 0.6);
    g.strokeCircle(size / 2, size / 2, radius);
    g.generateTexture(key, size, size);
    g.destroy();
    return key;
  }
}
