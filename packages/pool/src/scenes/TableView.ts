import * as Phaser from 'phaser';
import { BALL_ART } from '../config/art';
import { TABLE_DEPTH, TABLE_LAYOUT, type ScreenSides } from '../config/layout';
import type { TableConfig } from '../config/table';
import type { TableTheme } from '../config/tables';
import type { Ball, TableGeometry, Vec2 } from '../physics/types';
import { ballShadowTexture, ballTexture } from './art/ballArt';
import { PottedTube } from './PottedTube';
import type { BackgroundStyle } from '../config/backgrounds';
import { dropOtherSceneTextures, sceneTexture } from './art/backgroundArt';
import { dropOtherTableTextures, tableTexture, tableTextureOrigin } from './art/tableTexture';

/**
 * Draws the table and balls with the drawn art (Milestone 9, `scenes/art/`).
 * Owns the conversion between table metres and design pixels.
 */
export class TableView {
  private tube: PottedTube | null = null;
  private readonly ballSprites = new Map<number, { ball: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image }>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly geometry: TableGeometry,
    private readonly config: TableConfig,
    /** Left-handed players have the table moved right (`ScreenSides`). */
    private readonly sides: ScreenSides,
  ) {}

  /** Left edge of the playing area in design pixels. */
  private get originX(): number {
    return TABLE_LAYOUT.originX + this.sides.tableDx;
  }

  toDesign(x: number, y: number): Vec2 {
    return { x: this.originX + x * TABLE_LAYOUT.scale, y: TABLE_LAYOUT.originY + y * TABLE_LAYOUT.scale };
  }

  toTable(x: number, y: number): Vec2 {
    return { x: (x - this.originX) / TABLE_LAYOUT.scale, y: (y - TABLE_LAYOUT.originY) / TABLE_LAYOUT.scale };
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
  drawTable(theme: TableTheme, background: BackgroundStyle): void {
    const draw = () => tableTexture(this.scene, this.geometry, this.config, theme).key;
    const origin = tableTextureOrigin();
    let image: Phaser.GameObjects.Image;
    if (background.kind === 'plain') {
      // The plain background is the screen's own colour: only the table is drawn, as before backgrounds.
      const key = draw();
      dropOtherTableTextures(this.scene, key);
      dropOtherSceneTextures(this.scene, '');
      image = this.scene.add.image(origin.left + this.sides.tableDx, origin.top, key);
    } else {
      const key = sceneTexture(this.scene, background, draw, { x: origin.left + this.sides.tableDx, y: origin.top }, theme.id);
      dropOtherTableTextures(this.scene, '');
      dropOtherSceneTextures(this.scene, key);
      image = this.scene.add.image(0, 0, key);
    }
    image.setOrigin(0, 0).setName('table').setData('theme', theme.id).setData('background', background.id);
  }

  /** Ids of the balls in the potted-ball tube, bottom first (for tests). */
  get tubeIds(): number[] {
    return this.tube?.ids ?? [];
  }

  /** Potted balls still rolling under the table to the tube. */
  get tubeWaitingIds(): number[] {
    return this.tube?.waitingIds ?? [];
  }

  /** How long a ball from this pocket rolls under the table (browser tests). */
  tubeDelayMs(pocket: Vec2): number {
    return this.tube?.underTableMs(this.toDesign(pocket.x, pocket.y)) ?? 0;
  }

  /**
   * Creates or refreshes ball sprites and their shadows. Pocketed balls are hidden and shown in the
   * tube; `live` (balls rolling in a shot) sends newly potted ones the long way round to it.
   */
  syncBalls(balls: readonly Ball[], options: { live?: boolean } = {}): void {
    const s = BALL_ART.shadow;
    this.tube ??= new PottedTube(this.scene, this.sides, this.px(this.config.objectBallRadius), (x, y) => this.toDesign(x, y));
    this.tube.sync(balls, options.live === true);
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
