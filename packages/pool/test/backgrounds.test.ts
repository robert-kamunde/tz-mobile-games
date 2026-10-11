import { describe, expect, it } from 'vitest';
import { BACKGROUND_ART } from '../src/config/art';
import { BACKGROUNDS, BACKGROUND_IDS, DEFAULT_BACKGROUND, isBackgroundId } from '../src/config/backgrounds';
import { COLORS } from '../src/config/layout';
import { defaultProgress, validateProgress } from '../src/progress/progress';

type Rgb = readonly [number, number, number];
const hex = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as unknown as Rgb;
const channel = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const luminance = (c: Rgb) => 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);
/** WCAG contrast ratio. */
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
/** A colour under the text-band wash, blended as the canvas does (in sRGB values). */
const washed = (c: Rgb): Rgb => {
  const w = hex(BACKGROUND_ART.textBands.color);
  const a = BACKGROUND_ART.textBands.alpha;
  return c.map((v, i) => a * w[i]! + (1 - a) * v) as unknown as Rgb;
};
const viaJson = (v: unknown): unknown => JSON.parse(JSON.stringify(v));

const WHITE = hex(COLORS.text);
const DIM = hex(COLORS.textDim);

describe('backgrounds', () => {
  it.each(BACKGROUND_IDS)('%s: the large areas keep text readable, more so under the names, status and hint', (id) => {
    const p = BACKGROUNDS[id].palette;
    for (const colour of [p.base, p.dark, p.light]) {
      // Labels in the controls column (no wash).
      expect(contrast(WHITE, hex(colour)), `${id} ${colour} white`).toBeGreaterThanOrEqual(7);
      expect(contrast(DIM, hex(colour)), `${id} ${colour} grey`).toBeGreaterThanOrEqual(4.5);
      // The bands above and below the table.
      expect(contrast(DIM, washed(hex(colour))), `${id} ${colour} grey, washed`).toBeGreaterThanOrEqual(6);
    }
  });

  it.each(BACKGROUND_IDS)('%s: small details (stars, nails, prints) stay soft enough for white text over them', (id) => {
    const p = BACKGROUNDS[id].palette;
    for (const colour of [p.accent, p.accent2]) {
      expect(contrast(WHITE, washed(hex(colour))), `${id} ${colour}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('only known ids are backgrounds', () => {
    expect(BACKGROUND_IDS.every((id) => BACKGROUNDS[id].id === id)).toBe(true);
    expect(isBackgroundId('sea')).toBe(true);
    expect(isBackgroundId('gold')).toBe(false);
    expect(isBackgroundId(undefined)).toBe(false);
  });

  it('the choice is saved; older saves and unknown values give Klasiki', () => {
    const p = { ...defaultProgress(), background: 'kanga' as const };
    expect(validateProgress(viaJson(p))).toEqual(p);
    const old = viaJson(p) as Record<string, unknown>;
    delete old.background;
    expect(validateProgress(old)?.background).toBe(DEFAULT_BACKGROUND);
    expect(validateProgress({ ...p, background: 'gold' })?.background).toBe(DEFAULT_BACKGROUND);
  });
});
