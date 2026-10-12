/**
 * Tables the player can choose (Robert, 2026-10-11): looks only, all free. Patterns go on the rails;
 * the felt stays plain so every ball is easy to see on it, and each felt colour is checked against
 * the four ball colours, also for colour-blind players (test/tables.test.ts).
 * Shared sizes (rail width, cushion width, pockets) stay in `config/art.ts` and `config/layout.ts`.
 */

export const TABLE_IDS = ['classic', 'zanzibar', 'kitenge', 'maasai', 'tingatinga', 'makonde', 'gold', 'kilimanjaro', 'ziwa'] as const;
export type TableId = (typeof TABLE_IDS)[number];

export const DEFAULT_TABLE: TableId = 'classic';

/** Wood with a gradient across the table and faint grain lines. */
export interface WoodRail {
  readonly kind: 'wood';
  readonly light: string;
  readonly mid: string;
  readonly dark: string;
  readonly grainColor: string;
  readonly grainAlpha: number;
}

/** Zanzibar doors: dark carved wood, a carved rope border and rows of brass studs. */
export interface ZanzibarRail extends Omit<WoodRail, 'kind'> {
  readonly kind: 'zanzibar';
  readonly rope: { readonly color: string; readonly width: number; readonly twist: number };
  readonly stud: { readonly light: string; readonly dark: string; readonly radius: number; readonly spacing: number };
}

/** Kitenge print: a base colour with repeating rings and dots between two bands. */
export interface KitengeRail {
  readonly kind: 'kitenge';
  readonly base: string;
  readonly band: string;
  readonly ring: { readonly outer: string; readonly inner: string; readonly centre: string; readonly radius: number; readonly spacing: number };
  readonly dot: { readonly color: string; readonly radius: number };
}

/** Maasai shuka: red with blue and black checks, and a beadwork line next to the cushion. */
export interface ShukaRail {
  readonly kind: 'shuka';
  readonly base: string;
  /** Stripes across both ways, each repeated every `repeat` pixels. */
  readonly stripes: readonly { readonly color: string; readonly offset: number; readonly width: number; readonly alpha: number }[];
  readonly repeat: number;
  readonly beads: { readonly colors: readonly string[]; readonly radius: number; readonly spacing: number };
}

/** Tingatinga painting: bold coloured sections outlined in black, with dots and waves. */
export interface TingatingaRail {
  readonly kind: 'tingatinga';
  readonly sections: readonly { readonly fill: string; readonly dots: string }[];
  readonly outline: string;
  readonly outlineWidth: number;
  readonly dot: { readonly radius: number; readonly spacing: number };
  readonly wave: { readonly color: string; readonly width: number; readonly length: number; readonly height: number };
}

/** Makonde ebony: near-black wood with carved zigzag grooves. */
export interface MakondeRail extends Omit<WoodRail, 'kind'> {
  readonly kind: 'makonde';
  readonly groove: { readonly light: string; readonly dark: string; readonly width: number; readonly step: number };
}

export type RailStyle = WoodRail | ZanzibarRail | KitengeRail | ShukaRail | TingatingaRail | MakondeRail;

/** Sight marks on the rails. */
export type MarkerStyle =
  | { readonly kind: 'diamond'; readonly color: string; readonly halfSize: number }
  | { readonly kind: 'stud'; readonly light: string; readonly dark: string; readonly radius: number }
  | { readonly kind: 'bead'; readonly colors: readonly string[]; readonly radius: number }
  | { readonly kind: 'inlay'; readonly color: string; readonly rim: string; readonly radius: number };

export interface TableTheme {
  readonly id: TableId;
  readonly rail: RailStyle;
  /** Felt: lighter in the middle, darker to the edges. */
  readonly cloth: { readonly centre: string; readonly edge: string };
  /** Rubber cushions and pocket jaws: a darker shade of the felt. */
  readonly cushion: string;
  readonly marker: MarkerStyle;
}

export const TABLE_THEMES: Readonly<Record<TableId, TableTheme>> = {
  classic: {
    id: 'classic',
    rail: { kind: 'wood', light: '#8a5a2e', mid: '#6b4220', dark: '#3d2410', grainColor: '#24140a', grainAlpha: 0.1 },
    cloth: { centre: '#2a8f50', edge: '#1a6a38' },
    cushion: '#155a2e',
    marker: { kind: 'diamond', color: '#efe2c4', halfSize: 4 },
  },
  zanzibar: {
    id: 'zanzibar',
    rail: {
      kind: 'zanzibar',
      light: '#5a3720',
      mid: '#3e2414',
      dark: '#22130a',
      grainColor: '#0f0805',
      grainAlpha: 0.14,
      rope: { color: '#7a5434', width: 2, twist: 6 },
      stud: { light: '#ffe9a8', dark: '#9a6f1c', radius: 2.6, spacing: 22 },
    },
    cloth: { centre: '#23938f', edge: '#16686a' },
    cushion: '#11585a',
    marker: { kind: 'stud', light: '#fff2c4', dark: '#a87a20', radius: 4.5 },
  },
  kitenge: {
    id: 'kitenge',
    rail: {
      kind: 'kitenge',
      base: '#c2461c',
      band: '#23306b',
      ring: { outer: '#23306b', inner: '#f2b705', centre: '#23306b', radius: 6.5, spacing: 26 },
      dot: { color: '#f7e7c1', radius: 1.6 },
    },
    cloth: { centre: '#3170c0', edge: '#20518f' },
    cushion: '#1b467c',
    marker: { kind: 'diamond', color: '#f7e7c1', halfSize: 4 },
  },
  maasai: {
    id: 'maasai',
    rail: {
      kind: 'shuka',
      base: '#c3222b',
      stripes: [
        { color: '#1d3f8f', offset: 0, width: 5, alpha: 0.85 },
        { color: '#111111', offset: 9, width: 2, alpha: 0.7 },
        { color: '#111111', offset: 15, width: 2, alpha: 0.7 },
      ],
      repeat: 24,
      beads: { colors: ['#ffffff', '#1d3f8f', '#f2b705', '#2e8b3e', '#111111'], radius: 1.7, spacing: 5 },
    },
    cloth: { centre: '#5b7a91', edge: '#435c6f' },
    cushion: '#38505f',
    marker: { kind: 'bead', colors: ['#ffffff', '#f2b705', '#1d3f8f'], radius: 4.5 },
  },
  tingatinga: {
    id: 'tingatinga',
    rail: {
      kind: 'tingatinga',
      sections: [
        { fill: '#f2b705', dots: '#d6331f' },
        { fill: '#1f8fd1', dots: '#ffffff' },
        { fill: '#3aa845', dots: '#f2b705' },
        { fill: '#e8571e', dots: '#111111' },
      ],
      outline: '#111111',
      outlineWidth: 2,
      dot: { radius: 1.8, spacing: 9 },
      wave: { color: '#111111', width: 1.5, length: 18, height: 3 },
    },
    cloth: { centre: '#8456bd', edge: '#623c93' },
    cushion: '#55337f',
    marker: { kind: 'inlay', color: '#ffffff', rim: '#111111', radius: 3.5 },
  },
  makonde: {
    id: 'makonde',
    rail: {
      kind: 'makonde',
      light: '#3a2c22',
      mid: '#211913',
      dark: '#0e0a07',
      grainColor: '#000000',
      grainAlpha: 0.2,
      groove: { light: 'rgba(214, 180, 140, 0.45)', dark: 'rgba(0, 0, 0, 0.7)', width: 1.5, step: 10 },
    },
    cloth: { centre: '#6d7d78', edge: '#56645f' },
    cushion: '#47534f',
    marker: { kind: 'inlay', color: '#e9dfc6', rim: '#5a4636', radius: 3.5 },
  },
  // Dhahabu (gold), story mode's reward for beating Bingwa: ebony with gold rope and studs.
  gold: {
    id: 'gold',
    rail: {
      kind: 'zanzibar',
      light: '#2e2620',
      mid: '#1a1410',
      dark: '#0a0806',
      grainColor: '#000000',
      grainAlpha: 0.2,
      rope: { color: '#c9a227', width: 2, twist: 6 },
      stud: { light: '#fff2b0', dark: '#b8860b', radius: 2.8, spacing: 20 },
    },
    cloth: { centre: '#3d4fa8', edge: '#2b3a80' },
    cushion: '#24316b',
    marker: { kind: 'stud', light: '#fff2b0', dark: '#b8860b', radius: 4.5 },
  },
  // Kilimanjaro, story chapter 2's reward: coffee-wood rails carved with snowy peaks, dusk felt.
  kilimanjaro: {
    id: 'kilimanjaro',
    rail: {
      kind: 'makonde',
      light: '#6b4a30',
      mid: '#4a3020',
      dark: '#2a1a10',
      grainColor: '#140c06',
      grainAlpha: 0.16,
      groove: { light: 'rgba(240, 240, 248, 0.7)', dark: 'rgba(0, 0, 0, 0.55)', width: 1.5, step: 12 },
    },
    cloth: { centre: '#4e4a8c', edge: '#383569' },
    cushion: '#2f2c5a',
    marker: { kind: 'inlay', color: '#f4f4fa', rim: '#3a2618', radius: 3.5 },
  },
  // Ziwa (the lake), story chapter 3's reward: papyrus-green rails crossed by fishing net, with float beads; lake-blue felt.
  ziwa: {
    id: 'ziwa',
    rail: {
      kind: 'shuka',
      base: '#3a5426',
      stripes: [
        { color: '#e8f0f4', offset: 0, width: 1.5, alpha: 0.55 },
        { color: '#22331a', offset: 8, width: 3, alpha: 0.7 },
      ],
      repeat: 16,
      beads: { colors: ['#f2b705', '#ffffff', '#e8571e'], radius: 1.7, spacing: 6 },
    },
    cloth: { centre: '#2f6f8f', edge: '#21526b' },
    cushion: '#1d4a5e',
    marker: { kind: 'bead', colors: ['#f2b705', '#ffffff', '#e8571e'], radius: 4.5 },
  },
};

export function tableTheme(id: TableId): TableTheme {
  return TABLE_THEMES[id];
}

export function isTableId(value: unknown): value is TableId {
  return typeof value === 'string' && (TABLE_IDS as readonly string[]).includes(value);
}
