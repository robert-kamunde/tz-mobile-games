/**
 * Backgrounds behind the table (Robert, 2026-10-11): looks only, all free. The table covers most of
 * the screen, so each design puts its detail where it shows: the bands above and below the table and
 * the controls column. Every colour is dark enough for the white and grey text over it; a unit test
 * checks each palette (test/backgrounds.test.ts). Shared drawing settings are in `BACKGROUND_ART`
 * (config/art.ts).
 */

export const BACKGROUND_IDS = ['classic', 'wood', 'kanga', 'sea', 'stars', 'makuti', 'trophies', 'mountain', 'lake'] as const;
export type BackgroundId = (typeof BACKGROUND_IDS)[number];

export const DEFAULT_BACKGROUND: BackgroundId = 'classic';

/**
 * What is drawn: plain (the original dark), wooden planks, a kanga with printed borders, the sea at
 * night with dhows, a starry sky with acacia trees, and a woven palm-leaf (makuti) wall.
 * Story mode adds a wall of gold cups (trophies), Kilimanjaro at dusk (mountain, chapter 2) and Lake
 * Victoria at sunset with its rocks and fishing boats (lake, chapter 3).
 */
export type BackgroundKind = 'plain' | 'planks' | 'kanga' | 'sea' | 'stars' | 'weave' | 'trophies' | 'mountain' | 'lake';

/** Every colour a background uses. */
export interface BackgroundPalette {
  readonly base: string;
  readonly dark: string;
  readonly light: string;
  readonly accent: string;
  readonly accent2: string;
}

export interface BackgroundStyle {
  readonly id: BackgroundId;
  readonly kind: BackgroundKind;
  readonly palette: BackgroundPalette;
}

export const BACKGROUNDS: Readonly<Record<BackgroundId, BackgroundStyle>> = {
  classic: { id: 'classic', kind: 'plain', palette: { base: '#101418', dark: '#0a0d10', light: '#161c21', accent: '#161c21', accent2: '#161c21' } },
  wood: { id: 'wood', kind: 'planks', palette: { base: '#3a2616', dark: '#1f140b', light: '#4d331d', accent: '#6b5a44', accent2: '#2b1c10' } },
  kanga: { id: 'kanga', kind: 'kanga', palette: { base: '#1a1d4a', dark: '#0f1130', light: '#26296b', accent: '#7a5c12', accent2: '#6b1f1f' } },
  sea: { id: 'sea', kind: 'sea', palette: { base: '#0f2a40', dark: '#07141f', light: '#1a4566', accent: '#8a8a70', accent2: '#2a2018' } },
  stars: { id: 'stars', kind: 'stars', palette: { base: '#1c1638', dark: '#0b0918', light: '#3a2a52', accent: '#9a9a90', accent2: '#060507' } },
  makuti: { id: 'makuti', kind: 'weave', palette: { base: '#4a3a1c', dark: '#2a200e', light: '#5e4a24', accent: '#3a2d14', accent2: '#1c150a' } },
  trophies: { id: 'trophies', kind: 'trophies', palette: { base: '#2a1418', dark: '#140a0c', light: '#3a1c22', accent: '#8a6a1c', accent2: '#4a3410' } },
  mountain: { id: 'mountain', kind: 'mountain', palette: { base: '#1e2340', dark: '#0e1022', light: '#33294a', accent: '#8a8aa0', accent2: '#141220' } },
  lake: { id: 'lake', kind: 'lake', palette: { base: '#13304a', dark: '#0a1828', light: '#3a2a40', accent: '#9a6a3a', accent2: '#0c0e12' } },
};

export function isBackgroundId(value: unknown): value is BackgroundId {
  return typeof value === 'string' && (BACKGROUND_IDS as readonly string[]).includes(value);
}
