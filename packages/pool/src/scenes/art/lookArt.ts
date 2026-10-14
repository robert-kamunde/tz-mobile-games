import type * as Phaser from 'phaser';
import { CUE_ART, TABLE_ART } from '../../config/art';
import { BACKGROUNDS, type BackgroundId } from '../../config/backgrounds';
import { CUE_STYLES, type CueId } from '../../config/cues';
import { TABLE_LAYOUT } from '../../config/layout';
import { UK_7FT_TABLE } from '../../config/table';
import { TABLE_THEMES, type TableId } from '../../config/tables';
import { buildTableGeometry } from '../../physics/geometry';
import { backgroundTexture, backgroundThumbTexture, type PreviewTable } from './backgroundArt';
import { cueTexture } from './cueArt';
import { tableTexture } from './tableTexture';

export type LookKind = 'table' | 'cue' | 'background';

/**
 * The picture of a table, cue or scenery, as in the Mapambo pickers. Scenery shows with a plain
 * table where the real one stands, unless `sceneryAlone` (the journey's reward cards, too small for it).
 */
export function lookTexture(scene: Phaser.Scene, kind: LookKind, id: string, sceneryAlone = false): string {
  const geometry = buildTableGeometry(UK_7FT_TABLE);
  if (kind === 'table') return tableTexture(scene, geometry, UK_7FT_TABLE, TABLE_THEMES[id as TableId], TABLE_ART.previewScale).key;
  if (kind === 'cue') return cueTexture(scene, CUE_STYLES[id as CueId], CUE_ART.previewScale);
  if (sceneryAlone) return backgroundThumbTexture(scene, BACKGROUNDS[id as BackgroundId]);
  return backgroundTexture(scene, BACKGROUNDS[id as BackgroundId], previewTable(geometry.length));
}

/** Where the table sits on the table screen (right hand, rails included), for the background previews. */
function previewTable(length: number): PreviewTable {
  const l = TABLE_LAYOUT;
  const playHeight = UK_7FT_TABLE.playWidth * l.scale;
  return { left: l.originX - l.railWidth, top: l.originY - l.railWidth, width: length * l.scale + 2 * l.railWidth, height: playHeight + 2 * l.railWidth };
}
