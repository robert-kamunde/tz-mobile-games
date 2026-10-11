import type * as Phaser from 'phaser';
import { TABLE_ART } from '../../config/art';
import { TABLE_LAYOUT } from '../../config/layout';
import type { TableConfig } from '../../config/table';
import type { TableTheme } from '../../config/tables';
import type { TableGeometry } from '../../physics/types';
import { canvasTexture } from './canvasArt';
import { drawTable, type TableFrame } from './tableArt';

const KEY_PREFIX = 'pool-table-';

export interface TableTexture {
  readonly key: string;
  /** Design-pixel position of the texture's top-left corner at full size (the shadow margin included). */
  readonly left: number;
  readonly top: number;
}

/**
 * The table in a theme, drawn once into a texture at `scale` of its real size (1 on the table, smaller
 * for the picker's previews). The shadow margin is inside the texture.
 */
export function tableTexture(scene: Phaser.Scene, geometry: TableGeometry, config: TableConfig, theme: TableTheme, scale = 1): TableTexture {
  const l = TABLE_LAYOUT;
  const rail = l.railWidth;
  const margin = TABLE_ART.shadow.margin;
  const outerW = geometry.length * l.scale + 2 * rail;
  const outerH = geometry.width * l.scale + 2 * rail;
  const left = l.originX - rail - margin;
  const top = l.originY - rail - margin;
  // Texture space: the outer edge of the rail is (margin, margin); the margin holds the shadow.
  const frame: TableFrame = {
    at: (x, y) => ({ x: l.originX + x * l.scale - left, y: l.originY + y * l.scale - top }),
    px: (m) => m * l.scale,
    outer: { x: margin, y: margin, width: outerW, height: outerH },
    railWidth: rail,
  };
  const key = `${KEY_PREFIX}${theme.id}${scale === 1 ? '' : `-${scale}`}`;
  canvasTexture(scene, key, (outerW + 2 * margin) * scale, (outerH + 2 * margin) * scale, (ctx) => {
    ctx.scale(scale, scale);
    drawTable(ctx, frame, geometry, config, theme);
  });
  return { key, left, top };
}

/**
 * Frees full-size table textures other than `keep`: one is a few megabytes of video memory, and a
 * low-end phone should not hold one per table the player has tried.
 */
export function dropOtherTableTextures(scene: Phaser.Scene, keep: string): void {
  for (const key of scene.textures.getTextureKeys()) {
    if (key.startsWith(KEY_PREFIX) && key !== keep && !key.slice(KEY_PREFIX.length).includes('-')) scene.textures.remove(key);
  }
}
