import * as Phaser from 'phaser';
import { BALL_ART, TABLE_ART } from '../config/art';
import { TABLE_DEPTH, TABLE_LAYOUT } from '../config/layout';
import type { TableConfig } from '../config/table';
import type { Ball, TableGeometry, Vec2 } from '../physics/types';
import { ballShadowTexture, ballTexture } from './art/ballArt';
import { canvasTexture } from './art/canvasArt';
import { drawTable, type TableFrame } from './art/tableArt';

const TABLE_TEXTURE = 'pool-table';

/**
 * Draws the table and balls with the drawn art (Milestone 9, `scenes/art/`).
 * Owns the conversion between table metres and design pixels.
 */
export class TableView {
  private readonly ballSprites = new Map<number, { ball: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image }>();

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
   * Draws the static table once into a texture (ARCHITECTURE A12): Phaser rebuilds Graphics
   * geometry every frame, so static art is never left as live Graphics.
   */
  drawTable(): void {
    const topLeft = this.toDesign(0, 0);
    const rail = TABLE_LAYOUT.railWidth;
    const margin = TABLE_ART.shadow.margin;
    const outerW = this.px(this.geometry.length) + 2 * rail;
    const outerH = this.px(this.geometry.width) + 2 * rail;
    // Texture space: the outer edge of the rail is (margin, margin); the margin holds the shadow.
    const left = topLeft.x - rail - margin;
    const top = topLeft.y - rail - margin;
    const frame: TableFrame = {
      at: (x, y) => {
        const p = this.toDesign(x, y);
        return { x: p.x - left, y: p.y - top };
      },
      px: (m) => this.px(m),
      outer: { x: margin, y: margin, width: outerW, height: outerH },
      railWidth: rail,
    };
    canvasTexture(this.scene, TABLE_TEXTURE, outerW + 2 * margin, outerH + 2 * margin, (ctx) => drawTable(ctx, frame, this.geometry, this.config));
    this.scene.add.image(left, top, TABLE_TEXTURE).setOrigin(0, 0).setName('table');
  }

  /** Creates or refreshes ball sprites and their shadows. Pocketed balls are hidden. */
  syncBalls(balls: readonly Ball[]): void {
    const s = BALL_ART.shadow;
    for (const ball of balls) {
      let sprites = this.ballSprites.get(ball.id);
      if (!sprites) {
        const radius = this.px(ball.radius);
        sprites = {
          shadow: this.scene.add.image(0, 0, ballShadowTexture(this.scene, radius)).setDepth(TABLE_DEPTH.shadows),
          ball: this.scene.add.image(0, 0, ballTexture(this.scene, ball.kind, radius)).setName(`ball-${ball.id}`).setDepth(TABLE_DEPTH.balls),
        };
        this.ballSprites.set(ball.id, sprites);
      }
      const p = this.toDesign(ball.x, ball.y);
      sprites.ball.setPosition(p.x, p.y).setVisible(!ball.pocketed);
      sprites.shadow.setPosition(p.x + s.offsetX, p.y + s.offsetY).setVisible(!ball.pocketed);
    }
  }
}
