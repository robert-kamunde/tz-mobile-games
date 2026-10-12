/**
 * Cues the player can choose (Robert, 2026-10-11): looks only and all free, one to match each table.
 * Every cue plays exactly the same. Shape and the parts every cue shares (tip, ferrule, lengths)
 * stay in `CUE_ART` (config/art.ts).
 */

export const CUE_IDS = ['classic', 'zanzibar', 'kitenge', 'maasai', 'tingatinga', 'makonde', 'champion'] as const;
export type CueId = (typeof CUE_IDS)[number];

export const DEFAULT_CUE: CueId = 'classic';

/** What is drawn on the butt and grip, over its base colour. */
export type CueDecor =
  /** A plain grip wrap with one stripe. */
  | { readonly kind: 'wrap'; readonly color: string; readonly stripe: string }
  /** Brass rings, as on a Zanzibar door: at these fractions of the length from the tip. */
  | { readonly kind: 'rings'; readonly at: readonly number[]; readonly width: number; readonly light: string; readonly dark: string; readonly wrap: string }
  /** A kitenge-print grip: rings with a centre dot along it. */
  | { readonly kind: 'kitenge'; readonly base: string; readonly ring: string; readonly centre: string; readonly spacing: number }
  /** A beaded grip: rows of coloured beads, Maasai style, over a check-striped butt. */
  | { readonly kind: 'beads'; readonly colors: readonly string[]; readonly spacing: number; readonly stripe: string }
  /** Painted colour bands with black edges and dots, Tingatinga style. */
  | { readonly kind: 'bands'; readonly colors: readonly string[]; readonly edge: string; readonly dot: string }
  /** Bone-white inlaid diamonds along an ebony butt, Makonde style. */
  | { readonly kind: 'inlay'; readonly color: string; readonly spacing: number; readonly wrap: string };

export interface CueStyle {
  readonly id: CueId;
  readonly shaft: { readonly light: string; readonly dark: string };
  readonly butt: { readonly light: string; readonly dark: string };
  readonly decor: CueDecor;
  readonly buttCap: string;
}

export const CUE_STYLES: Readonly<Record<CueId, CueStyle>> = {
  classic: {
    id: 'classic',
    shaft: { light: '#f0d9a8', dark: '#c9a46a' },
    butt: { light: '#6b3a1c', dark: '#3b1e0c' },
    decor: { kind: 'wrap', color: '#1d1d1d', stripe: '#c62828' },
    buttCap: '#111111',
  },
  zanzibar: {
    id: 'zanzibar',
    shaft: { light: '#ead0a0', dark: '#bf9960' },
    butt: { light: '#4a2c18', dark: '#22130a' },
    decor: { kind: 'rings', at: [0.62, 0.7, 0.74, 0.92, 0.96], width: 2.5, light: '#ffe9a8', dark: '#9a6f1c', wrap: '#2a1a0e' },
    buttCap: '#9a6f1c',
  },
  kitenge: {
    id: 'kitenge',
    shaft: { light: '#f0d9a8', dark: '#c9a46a' },
    butt: { light: '#3a4a8f', dark: '#1c2658' },
    decor: { kind: 'kitenge', base: '#c2461c', ring: '#f2b705', centre: '#23306b', spacing: 9 },
    buttCap: '#23306b',
  },
  maasai: {
    id: 'maasai',
    shaft: { light: '#f0d9a8', dark: '#c9a46a' },
    butt: { light: '#d8343c', dark: '#8f161c' },
    decor: { kind: 'beads', colors: ['#ffffff', '#1d3f8f', '#f2b705', '#2e8b3e', '#111111'], spacing: 3.2, stripe: '#1d3f8f' },
    buttCap: '#111111',
  },
  tingatinga: {
    id: 'tingatinga',
    shaft: { light: '#f0d9a8', dark: '#c9a46a' },
    butt: { light: '#f2b705', dark: '#c98f00' },
    decor: { kind: 'bands', colors: ['#1f8fd1', '#3aa845', '#e8571e', '#f2b705', '#8456bd'], edge: '#111111', dot: '#ffffff' },
    buttCap: '#111111',
  },
  makonde: {
    id: 'makonde',
    shaft: { light: '#e6d2b0', dark: '#b8996c' },
    butt: { light: '#3a2c22', dark: '#0e0a07' },
    decor: { kind: 'inlay', color: '#e9dfc6', spacing: 14, wrap: '#16100b' },
    buttCap: '#e9dfc6',
  },
  // Fimbo ya Bingwa, story mode's reward at 18 stars: black and gold.
  champion: {
    id: 'champion',
    shaft: { light: '#f3e2b8', dark: '#cfae72' },
    butt: { light: '#26201a', dark: '#080706' },
    decor: { kind: 'rings', at: [0.6, 0.64, 0.7, 0.88, 0.92, 0.96], width: 3, light: '#fff2b0', dark: '#b8860b', wrap: '#14100c' },
    buttCap: '#c9a227',
  },
};

export function isCueId(value: unknown): value is CueId {
  return typeof value === 'string' && (CUE_IDS as readonly string[]).includes(value);
}
