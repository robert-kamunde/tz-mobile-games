import { describe, expect, it } from 'vitest';
import { COLORS } from '../src/config/layout';
import { DEFAULT_TABLE, TABLE_IDS, TABLE_THEMES, isTableId } from '../src/config/tables';

type Rgb = readonly [number, number, number];

const hex = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as unknown as Rgb;
const fromNumber = (n: number): Rgb => [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as unknown as Rgb;
const linear = (c: Rgb): Rgb => c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as unknown as Rgb;

/** How the two common kinds of red-green colour blindness see a colour (Machado et al. 2009, full strength). */
const VISIONS: Record<string, readonly Rgb[]> = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
};

const apply = (m: readonly Rgb[], c: Rgb): Rgb => m.map((row) => Math.min(1, Math.max(0, row[0] * c[0] + row[1] * c[1] + row[2] * c[2]))) as unknown as Rgb;

/** CIE L*a*b* from linear sRGB. */
function lab(c: Rgb): Rgb {
  const xyz = [
    (0.4124 * c[0] + 0.3576 * c[1] + 0.1805 * c[2]) / 0.95047,
    0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2],
    (0.0193 * c[0] + 0.1192 * c[1] + 0.9505 * c[2]) / 1.08883,
  ].map((v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116));
  return [116 * xyz[1]! - 16, 500 * (xyz[0]! - xyz[1]!), 200 * (xyz[1]! - xyz[2]!)];
}

/** Smallest colour difference (CIE76) between a ball and a felt colour, over normal and colour-blind vision. */
function worstDifference(ball: Rgb, felt: Rgb): number {
  return Math.min(
    ...Object.values(VISIONS).map((m) => {
      const a = lab(apply(m, linear(ball)));
      const b = lab(apply(m, linear(felt)));
      return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    }),
  );
}

/**
 * Below this a ball starts to melt into the felt for someone. Classic green is exempt: red on green is
 * what real tables look like and is the hardest pair for red-green colour blindness (about 6), which is
 * why red balls carry a white spot. New tables must do clearly better.
 */
const MIN_DIFFERENCE = 25;

describe('tables', () => {
  it('has six free tables, each with its own look, the story gold table, and Classic is the default', () => {
    expect(TABLE_IDS).toHaveLength(7);
    expect(DEFAULT_TABLE).toBe('classic');
    for (const id of TABLE_IDS) expect(TABLE_THEMES[id].id).toBe(id);
    expect(new Set(TABLE_IDS.map((id) => TABLE_THEMES[id].cloth.centre)).size).toBe(7);
    const free = TABLE_IDS.filter((id) => id !== 'gold');
    expect(new Set(free.map((id) => TABLE_THEMES[id].rail.kind)).size).toBe(6);
  });

  it('every new felt keeps every ball easy to see, also for colour-blind players', () => {
    const balls = Object.entries(COLORS.ball).map(([kind, n]) => [kind, fromNumber(n)] as const);
    const failures: string[] = [];
    for (const id of TABLE_IDS) {
      if (id === 'classic') continue;
      const { centre, edge } = TABLE_THEMES[id].cloth;
      for (const [kind, ball] of balls) {
        for (const felt of [centre, edge]) {
          const d = worstDifference(ball, hex(felt));
          if (d < MIN_DIFFERENCE) failures.push(`${id} ${kind} on ${felt}: ${d.toFixed(1)}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('the check would catch a felt the colour of the red balls', () => {
    expect(worstDifference(fromNumber(COLORS.ball.red), hex('#b83030'))).toBeLessThan(MIN_DIFFERENCE);
  });

  it('accepts only known table ids', () => {
    expect(isTableId('zanzibar')).toBe(true);
    for (const bad of ['', 'Classic', 'velvet', null, 3, undefined]) expect(isTableId(bad)).toBe(false);
  });
});
