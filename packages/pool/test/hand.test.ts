import { describe, expect, it } from 'vitest';
import { TABLE_ART, TUBE_ART } from '../src/config/art';
import { DESIGN, POWER_BAR, SPIN_CONTROL, TABLE_LAYOUT, TUBE, screenSides } from '../src/config/layout';
import { UK_7FT_TABLE } from '../src/config/table';
import { buildTableGeometry } from '../src/physics/geometry';
import { defaultProgress, validateProgress } from '../src/progress/progress';

const LENGTH = buildTableGeometry(UK_7FT_TABLE).length;
const viaJson = (v: unknown): unknown => JSON.parse(JSON.stringify(v));

/** Left and right edges of the table as drawn (rails and shadow margin included), for a hand. */
function tableEdges(dx: number): [number, number] {
  const outer = TABLE_LAYOUT.railWidth + TABLE_ART.shadow.margin;
  const left = TABLE_LAYOUT.originX + dx;
  return [left - outer, left + LENGTH * TABLE_LAYOUT.scale + outer];
}

/** Left and right edges of the controls column (spin face and power handle, the widest parts). */
function controlEdges(x: (v: number) => number): [number, number] {
  const half = Math.max(SPIN_CONTROL.radius, (POWER_BAR.width + POWER_BAR.handleOverhang) / 2);
  return [Math.min(x(SPIN_CONTROL.x), x(POWER_BAR.x)) - half, Math.max(x(SPIN_CONTROL.x), x(POWER_BAR.x)) + half];
}

describe('left-handed layout', () => {
  it('right-handed is the layout as written', () => {
    const right = screenSides('right', LENGTH);
    expect(right.tableDx).toBe(0);
    expect(right.controlX(POWER_BAR.x)).toBe(POWER_BAR.x);
  });

  it('left-handed mirrors the screen: controls at the left edge, the table the same distance from the right edge', () => {
    const right = screenSides('right', LENGTH);
    const left = screenSides('left', LENGTH);
    const [rTableLeft, rTableRight] = tableEdges(right.tableDx);
    const [lTableLeft, lTableRight] = tableEdges(left.tableDx);
    expect(lTableLeft).toBeCloseTo(DESIGN.width - rTableRight, 6);
    expect(lTableRight).toBeCloseTo(DESIGN.width - rTableLeft, 6);
    const [cLeft, cRight] = controlEdges(left.controlX);
    const [rcLeft, rcRight] = controlEdges(right.controlX);
    expect(cLeft).toBeCloseTo(DESIGN.width - rcRight, 6);
    expect(cRight).toBeCloseTo(DESIGN.width - rcLeft, 6);
    // On screen, and the controls never cover the table.
    expect(cLeft).toBeGreaterThanOrEqual(0);
    expect(cRight).toBeLessThan(lTableLeft + TABLE_ART.shadow.margin);
    expect(lTableRight).toBeLessThanOrEqual(DESIGN.width);
  });

  it('the choice is saved; older saves and unknown values give right-handed', () => {
    const p = { ...defaultProgress(), hand: 'left' as const };
    expect(validateProgress(viaJson(p))).toEqual(p);
    const old = viaJson(p) as Record<string, unknown>;
    delete old.hand;
    expect(validateProgress(old)?.hand).toBe('right');
    expect(validateProgress({ ...p, hand: 'both' })?.hand).toBe('right');
  });
});

describe('potted-ball tube', () => {
  const radius = UK_7FT_TABLE.objectBallRadius * TABLE_LAYOUT.scale;
  const half = radius + TUBE.clearance + TUBE.wall;

  it('fits between the screen edge and the table rail, mirrored for the left hand', () => {
    for (const hand of ['right', 'left'] as const) {
      const sides = screenSides(hand, LENGTH);
      const [tableLeft, tableRight] = tableEdges(sides.tableDx).map((e, i) => e + (i === 0 ? TABLE_ART.shadow.margin : -TABLE_ART.shadow.margin));
      const x = sides.controlX(TUBE.x);
      expect(x - half).toBeGreaterThanOrEqual(0);
      expect(x + half).toBeLessThanOrEqual(DESIGN.width);
      if (hand === 'right') expect(x + half).toBeLessThan(tableLeft!);
      else expect(x - half).toBeGreaterThan(tableRight!);
    }
  });

  it('holds all 15 object balls between its end caps', () => {
    const inside = TUBE.bottom - TUBE.top - 2 * TUBE_ART.cap.height;
    expect(15 * (2 * radius + TUBE.gap)).toBeLessThan(inside - (TUBE.entryY - TUBE.top + half));
  });
});
