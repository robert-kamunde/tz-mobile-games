/**
 * Look of the drawn art (Milestone 9): colours, sizes and how much texture. Drawn by the game at
 * start-up into textures (`scenes/art/`), so there are no image files to download. A designer can
 * replace any texture with an image under the same key later (docs/ASSETS.md).
 */
export const TABLE_ART = {
  /** Shadow round the table on the background: the texture is this much bigger on every side. */
  shadow: { margin: 20, blur: 18, offsetY: 6, color: 'rgba(0, 0, 0, 0.6)' },
  /** Wooden rail: a gradient across its width, grain lines, rounded outer corners and a bevel. */
  rail: {
    light: '#8a5a2e',
    mid: '#6b4220',
    dark: '#3d2410',
    cornerRadius: 18,
    bevelWidth: 3,
    bevelLight: 'rgba(255, 230, 190, 0.35)',
    bevelDark: 'rgba(0, 0, 0, 0.45)',
    grainLines: 90,
    grainAlpha: 0.1,
    grainColor: '#24140a',
    seed: 7,
  },
  /** Sight marks on the rails: 3 between each pair of pockets on the long rails, 3 on each short rail. */
  diamond: { color: '#efe2c4', halfSize: 4, perGap: 3 },
  /** Rubber cushion strip between the cloth and the wood, and the pocket jaws. */
  cushion: { width: 12, color: '#155a2e', nose: 'rgba(255, 255, 255, 0.16)', noseWidth: 1.5, jawWidth: 4 },
  /** Cloth: lighter in the middle, darker to the edges, with faint speckle so it does not look flat. */
  cloth: { centre: '#2a8f50', edge: '#1a6a38', speckles: 1800, speckleAlpha: 0.06, seed: 11 },
  pocket: { inner: '#000000', outer: '#1b1b1b', rim: '#1e120a', rimWidth: 4 },
  baulk: { color: 'rgba(255, 255, 255, 0.32)', width: 1.5 },
} as const;

export const BALL_ART = {
  /** Shading: a soft highlight towards the top left and a darker edge. */
  highlightOffset: 0.35,
  highlightColor: 'rgba(255, 255, 255, 0.55)',
  edgeShade: 'rgba(0, 0, 0, 0.45)',
  /** Small bright reflection. */
  shine: { offset: 0.42, radius: 0.22, color: 'rgba(255, 255, 255, 0.9)' },
  outline: { width: 1, color: 'rgba(0, 0, 0, 0.5)' },
  /** Shadow on the cloth, drawn under each ball. */
  shadow: { offsetX: 2, offsetY: 3, scale: 1.05, color: 'rgba(0, 0, 0, 0.35)', blur: 3 },
  /**
   * Reds carry a white spot so the two colours differ by more than colour alone (colour-blind
   * players). Fraction of the ball radius.
   */
  redSpot: { radius: 0.36, color: '#ffffff' },
} as const;

export const CUE_ART = {
  /** Thickness at the tip and at the butt, design pixels (the length is CUE_STICK.length). */
  tipWidth: 6,
  buttWidth: 11,
  tip: { length: 4, color: '#3b6fb6' },
  ferrule: { length: 10, color: '#f4efe4' },
  shaft: { light: '#f0d9a8', dark: '#c9a46a' },
  /** Fraction of the length from the tip where the darker butt wood starts, and the grip wrap. */
  buttStart: 0.62,
  butt: { light: '#6b3a1c', dark: '#3b1e0c' },
  wrap: { start: 0.74, end: 0.92, color: '#1d1d1d', stripe: '#c62828' },
  buttCap: { length: 6, color: '#111111' },
  shadow: { offsetX: 3, offsetY: 5, alpha: 0.3 },
} as const;

/** The controls beside and under the table: power bar, spin face and fine-aim strip. */
export const CONTROLS_ART = {
  track: { color: '#1c2228', border: '#3b444e', borderWidth: 2, innerShadow: 'rgba(0, 0, 0, 0.5)', innerShadowBlur: 8, innerShadowWidth: 6 },
  /** Power fill, from a gentle pull (top) to full power (bottom). */
  powerFill: ['#3fbf6a', '#f2c94c', '#e8553d'],
  handle: { light: '#ffffff', dark: '#c9cfd6', ridge: 'rgba(0, 0, 0, 0.25)', ridges: 3, ridgeWidth: 1.5, ridgeInset: 0.3, radius: 6 },
  /** Cue-tip marker on the spin face: chalk blue with a light edge. */
  spinTip: { color: '#2f6fd0', edge: '#ffffff', edgeWidth: 2 },
} as const;
