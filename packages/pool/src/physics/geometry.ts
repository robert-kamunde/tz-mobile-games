import type { TableConfig } from '../config/table';
import type { Pocket, Segment, TableGeometry, Vec2 } from './types';

const v = (x: number, y: number): Vec2 => ({ x, y });
const seg = (a: Vec2, b: Vec2): Segment => ({ a, b });

/**
 * Builds the cushion outline and pockets. The outline is the line of the cushion noses: a ball's
 * centre stays at least one radius from every segment. Pocket jaws are short segments running
 * outwards from each pocket mouth, so a ball can only leave the table through a pocket.
 *
 * Pocket ids: 0 top-left, 1 top-middle, 2 top-right, 3 bottom-right, 4 bottom-middle, 5 bottom-left
 * (y = 0 is the top edge).
 */
export function buildTableGeometry(t: TableConfig): TableGeometry {
  const L = t.playLength;
  const W = t.playWidth;
  const c = t.cornerMouth / Math.SQRT2; // distance from the corner to each cushion nose
  const j = t.jawLength / Math.SQRT2; // corner jaws run diagonally outwards
  const halfMid = t.middleMouth / 2;
  const midX = L / 2;

  const cushions: Segment[] = [
    // Top rail, split by the middle pocket.
    seg(v(c, 0), v(midX - halfMid, 0)),
    seg(v(midX + halfMid, 0), v(L - c, 0)),
    // Bottom rail.
    seg(v(c, W), v(midX - halfMid, W)),
    seg(v(midX + halfMid, W), v(L - c, W)),
    // Head (left) and foot (right) rails.
    seg(v(0, c), v(0, W - c)),
    seg(v(L, c), v(L, W - c)),
    // Corner jaws: parallel pairs running out along the diagonal.
    seg(v(c, 0), v(c - j, -j)),
    seg(v(0, c), v(-j, c - j)),
    seg(v(L - c, 0), v(L - c + j, -j)),
    seg(v(L, c), v(L + j, c - j)),
    seg(v(L - c, W), v(L - c + j, W + j)),
    seg(v(L, W - c), v(L + j, W - c + j)),
    seg(v(c, W), v(c - j, W + j)),
    seg(v(0, W - c), v(-j, W - c + j)),
    // Middle jaws: run straight out, narrowing slightly.
    seg(v(midX - halfMid, 0), v(midX - halfMid + t.middleJawTaper, -t.jawLength)),
    seg(v(midX + halfMid, 0), v(midX + halfMid - t.middleJawTaper, -t.jawLength)),
    seg(v(midX - halfMid, W), v(midX - halfMid + t.middleJawTaper, W + t.jawLength)),
    seg(v(midX + halfMid, W), v(midX + halfMid - t.middleJawTaper, W + t.jawLength)),
  ];

  const pockets: Pocket[] = [
    v(0, 0),
    v(midX, -t.middleDropDepth),
    v(L, 0),
    v(L, W),
    v(midX, W + t.middleDropDepth),
    v(0, W),
  ].map((center, id) => ({ id, center, dropRadius: t.dropRadius }));

  return { length: L, width: W, cushions, pockets };
}
