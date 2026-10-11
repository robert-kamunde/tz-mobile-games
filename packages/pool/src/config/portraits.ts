/**
 * How each character's portrait is drawn (Milestone 9 Part B, drawn by `scenes/art/portraitArt.ts`).
 * Simple, friendly cartoon faces built from a few parts, so each character reads at a glance even at
 * the small size in the player panel. Keyed by character id (config/characters.ts).
 */

export type Hair = 'bald' | 'short' | 'fade' | 'afro' | 'cornrows' | 'greySides';
export type Headwear =
  | { readonly kind: 'wrap'; readonly color: string; readonly accent: string }
  | { readonly kind: 'cap' | 'capBack'; readonly color: string; readonly accent: string }
  | { readonly kind: 'kofia'; readonly color: string; readonly accent: string };
export type Beard = 'stubble' | 'moustache' | 'goatee' | 'full';
export type Mouth = 'smile' | 'grin' | 'smirk' | 'pout' | 'calm';

export interface PortraitLook {
  /** Circle behind the head. */
  readonly background: string;
  readonly skin: string;
  readonly hair: Hair;
  readonly hairColor: string;
  readonly shirt: string;
  /** A collar or apron over the shirt. */
  readonly collar?: string;
  readonly mouth: Mouth;
  /** Wider face and neck. */
  readonly round?: boolean;
  /** Smaller head and bigger eyes. */
  readonly young?: boolean;
  readonly headwear?: Headwear;
  readonly beard?: Beard;
  readonly glasses?: 'clear' | 'dark';
  readonly earrings?: string;
  readonly chain?: string;
}

export const PORTRAITS: Readonly<Record<string, PortraitLook>> = {
  // The expert: a work cap and a moustache.
  fundi: { background: '#2f5d8a', skin: '#7a4a2a', hair: 'short', hairColor: '#1a1a1a', shirt: '#1f4e79', collar: '#e0a030', mouth: 'smile', beard: 'moustache', headwear: { kind: 'cap', color: '#e07a1f', accent: '#ffffff' } },
  // The queen: a gold headwrap and earrings.
  malkia: { background: '#6a2c70', skin: '#8a5a3a', hair: 'short', hairColor: '#1a1a1a', shirt: '#8e44ad', mouth: 'smile', earrings: '#f2c94c', headwear: { kind: 'wrap', color: '#f2b705', accent: '#8e2a6a' } },
  // The rock: bald with stubble.
  mwamba: { background: '#4a4f55', skin: '#5e3a22', hair: 'bald', hairColor: '#1a1a1a', shirt: '#6b7378', mouth: 'calm', beard: 'stubble' },
  // The big guy: a round face and a wide grin.
  bonge: { background: '#8a2d2d', skin: '#6e4227', hair: 'fade', hairColor: '#141414', shirt: '#c0392b', mouth: 'grin', round: true },
  // Auntie: a kitenge headwrap and glasses.
  shangazi: { background: '#2e6b3a', skin: '#7a4b2c', hair: 'short', hairColor: '#1a1a1a', shirt: '#27ae60', mouth: 'smile', glasses: 'clear', earrings: '#e8e8e8', headwear: { kind: 'wrap', color: '#e06a1a', accent: '#1f4fa0' } },
  // The clever one: a cap turned back, a smirk and a chain.
  mjanja: { background: '#3b3b58', skin: '#6a3f22', hair: 'short', hairColor: '#141414', shirt: '#222222', mouth: 'smirk', chain: '#d4af37', headwear: { kind: 'capBack', color: '#2c3e50', accent: '#e74c3c' } },
  // The sharp dresser: a neat fade, dark glasses, a white collar.
  bishoo: { background: '#1f6f78', skin: '#7d4e2e', hair: 'fade', hairColor: '#111111', shirt: '#34495e', collar: '#ffffff', mouth: 'smirk', glasses: 'dark', beard: 'goatee' },
  // The brain: glasses and a tall afro.
  kichwa: { background: '#3d5a80', skin: '#6b4126', hair: 'afro', hairColor: '#161616', shirt: '#2980b9', mouth: 'calm', glasses: 'clear' },
  // The stubborn youngster: a big cap and a pout.
  'dogo-mbishi': { background: '#c48a00', skin: '#7f5030', hair: 'short', hairColor: '#141414', shirt: '#f1c40f', mouth: 'pout', young: true, headwear: { kind: 'cap', color: '#2471a3', accent: '#ffffff' } },
  // The food seller: a red headwrap and a white apron.
  'mama-ntilie': { background: '#9c3d54', skin: '#7a4a2c', hair: 'short', hairColor: '#1a1a1a', shirt: '#c0392b', collar: '#f4f1ea', mouth: 'grin', round: true, earrings: '#f2c94c', headwear: { kind: 'wrap', color: '#d63031', accent: '#f2c94c' } },
  // The old master: a white kofia, grey beard and glasses.
  'mzee-kobe': { background: '#5f6b73', skin: '#5e3b24', hair: 'greySides', hairColor: '#c8c8c8', shirt: '#8b6b4a', mouth: 'calm', beard: 'full', glasses: 'clear', headwear: { kind: 'kofia', color: '#f4f1ea', accent: '#c9a227' } },
  // The champion: cornrows, dark glasses and a gold chain.
  bingwa: { background: '#7a5c12', skin: '#583620', hair: 'cornrows', hairColor: '#101010', shirt: '#111111', collar: '#d4af37', mouth: 'smirk', glasses: 'dark', chain: '#f2c94c', beard: 'goatee' },
};
