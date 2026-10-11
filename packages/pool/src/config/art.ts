/**
 * Look of the drawn art (Milestone 9): colours, sizes and how much texture. Drawn by the game at
 * start-up into textures (`scenes/art/`), so there are no image files to download. A designer can
 * replace any texture with an image under the same key later (docs/ASSETS.md).
 */
export const TABLE_ART = {
  /** Shadow round the table on the background: the texture is this much bigger on every side. */
  shadow: { margin: 20, blur: 18, offsetY: 6, color: 'rgba(0, 0, 0, 0.6)' },
  /** Rail shape and finish shared by every table; colours and patterns are per table (config/tables.ts). */
  rail: {
    cornerRadius: 18,
    bevelWidth: 3,
    bevelLight: 'rgba(255, 230, 190, 0.35)',
    bevelDark: 'rgba(0, 0, 0, 0.45)',
    grainLines: 90,
    seed: 7,
  },
  /** Sight marks on the rails: 3 between each pair of pockets on the long rails, 3 on each short rail. */
  diamond: { perGap: 3, outline: 'rgba(0, 0, 0, 0.55)', outlineWidth: 1 },
  /** Rubber cushion strip between the cloth and the rail, and the pocket jaws (colour per table). */
  cushion: { width: 12, nose: 'rgba(255, 255, 255, 0.16)', noseWidth: 1.5, jawWidth: 4 },
  /** Faint speckle on the felt so it does not look flat (colours per table). */
  cloth: { speckles: 1800, speckleAlpha: 0.06, seed: 11 },
  pocket: { inner: '#000000', outer: '#1b1b1b', rim: '#1e120a', rimWidth: 4 },
  baulk: { color: 'rgba(255, 255, 255, 0.32)', width: 1.5 },
  /** Small pictures of each table on the table picker: this fraction of the real size. */
  previewScale: 0.27,
} as const;

/** Backgrounds behind the table (designs and colours per background in config/backgrounds.ts). */
export const BACKGROUND_ART = {
  /**
   * The bands above and below the table hold the player names, status and hint, so they get a dark
   * wash over the design (faded in over `fade` pixels) to keep the text easy to read.
   */
  textBands: { color: '#101418', alpha: 0.5, topEnd: 72, bottomStart: 648, fade: 18 },
  /** Darker towards the edges of the screen. */
  vignette: { alpha: 0.45 },
  planks: { width: 64, gap: 3, grainLines: 260, grainAlpha: 0.18, nailRadius: 2.5, nailInset: 20 },
  kanga: { border: 64, motifSpacing: 44, dotSpacing: 36, dotRadius: 2.5 },
  sea: { horizonY: 600, moon: { x: 1240, y: 30, radius: 14 }, waveSpacing: 12, dhows: [90, 640, 1180], dhowSize: 34 },
  stars: { count: 260, maxRadius: 1.6, trees: [60, 1225], treeHeight: 64 },
  weave: { strip: 22 },
  seed: 23,
  /** Small pictures on the background picker, with a simple table on them so the choice is clear. */
  previewScale: 0.24,
  previewTable: { rail: '#5a3a1e', felt: '#1f7a46' },
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
  /** Tip and ferrule are the same on every cue; wood and decoration are per cue (config/cues.ts). */
  tip: { length: 4, color: '#3b6fb6' },
  ferrule: { length: 10, color: '#f4efe4' },
  /** Fraction of the length from the tip where the butt starts, and where the grip is. */
  buttStart: 0.62,
  grip: { start: 0.74, end: 0.92 },
  buttCap: { length: 6 },
  shadow: { offsetX: 3, offsetY: 5, alpha: 0.3 },
  /** Cues on the cue picker: this many times their real size. */
  previewScale: 1.25,
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

/**
 * Character portraits (config/portraits.ts says who looks how). Geometry is in a 100-unit square
 * that the drawing scales to the texture; the face sits a little above the middle with the
 * shoulders cut off by the round frame.
 */
export const PORTRAIT_ART = {
  /** Texture pixels per design pixel, so faces stay sharp when a big phone scales the game up. */
  resolution: 2,
  unit: 100,
  /** Everything inside the frame is drawn this much bigger, about this point, so the face fills it. */
  zoom: 1.2,
  zoomAt: { x: 50, y: 42 },
  head: { x: 50, y: 47, rx: 20, ry: 24, roundRx: 23.5, roundRy: 23, youngScale: 0.9, youngDrop: 5 },
  /** Light on the face from the top left. */
  skinLight: 'rgba(255, 255, 255, 0.16)',
  skinShade: 'rgba(0, 0, 0, 0.22)',
  neck: { halfWidth: 8, roundHalfWidth: 10.5, top: 62, bottom: 84 },
  shoulders: { y: 104, rx: 44, ry: 28 },
  collar: { depth: 14, width: 12 },
  ear: { dy: 1, radius: 4.5 },
  hairline: 34,
  eyes: { dx: 8, dy: -2, rx: 3.8, ry: 3, youngGrow: 1.2, pupil: 1.9, white: '#f7f3ea', dark: '#1a120c' },
  brows: { dy: -8, halfLength: 4, width: 2 },
  nose: { dy: 6, halfWidth: 3.2, depth: 2.2 },
  mouth: { dy: 14, halfWidth: 6.5, lip: '#4a1f14', teeth: '#fbf8f2' },
  beard: { stubbleTop: 8, stubbleAlpha: 0.35, fullTop: 11, moustacheDy: 10.5, goateeDy: 19 },
  glasses: { radius: 5.6, width: 1.6, frame: '#1c1c1c', dark: 'rgba(15, 15, 20, 0.88)', glint: 'rgba(255, 255, 255, 0.35)' },
  earring: { radius: 2.4, dy: 8 },
  chain: { y: 82, sag: 9, width: 2.2, pendant: 3.2 },
  afro: { dy: -14, radius: 26 },
  cap: { crownDy: -11, crownRx: 22.5, crownRy: 15, brimDy: -11, brimRx: 25, brimRy: 4.5, button: 2.2 },
  wrap: { dy: -21, rx: 25, ry: 19, band: 5, knot: { dy: -36, rx: 7, ry: 5 }, dots: 7 },
  kofia: { top: -38, bottom: -14, halfWidth: 19.5, band: 5 },
  /** Thin dark line round the frame. */
  frame: { width: 2.5, color: 'rgba(0, 0, 0, 0.55)' },
} as const;

/** Buttons and panels (Milestone 9 Part B): rounded, softly lit, with a thin gold edge on panels. */
export const UI_ART = {
  button: {
    radius: 12,
    /** Top and bottom of the face, normal and highlighted (the current or last choice). */
    face: ['#ffffff', '#dfe5ea'],
    highlight: ['#ffd96a', '#e0a92a'],
    /** A darker lip along the bottom so the button looks raised. */
    lip: { height: 3, color: 'rgba(0, 0, 0, 0.28)' },
    edge: { width: 1, color: 'rgba(0, 0, 0, 0.35)' },
    /** Shine along the top edge. */
    shine: 'rgba(255, 255, 255, 0.6)',
  },
  panel: {
    radius: 18,
    /** Lighter at the top, darker at the bottom; the panel's own alpha still applies. */
    top: '#1c252d',
    bottom: '#0b0e11',
    edge: { width: 2, color: 'rgba(242, 201, 76, 0.55)' },
    inner: { inset: 5, width: 1, color: 'rgba(255, 255, 255, 0.08)' },
  },
} as const;

/**
 * The menu (Milestone 9 Part B): a neighbourhood pool bar at night, no drinks anywhere (Robert,
 * 2026-10-11). Painted two-tone wall, a barred window, a cue rack, string lights, a lamp glowing
 * behind the buttons, a counter with a radio, and the edge of a pool table along the bottom. Detail
 * stays at the sides; the middle is kept calm for the buttons.
 */
export const MENU_ART = {
  wall: { top: '#2f6b66', bottom: '#214c48', lowerTop: 430, lower: '#6b3b22', lowerDark: '#4a2816', stripe: '#e0a030', stripeHeight: 8 },
  floor: { top: 600, color: '#3a3532', dark: '#24201e', tile: 80 },
  /** Warm light from a lamp above the middle of the room. */
  glow: { x: 640, y: 120, radius: 560, color: 'rgba(255, 214, 140, 0.30)' },
  lamp: { x: 640, top: 0, cord: 18, shadeWidth: 120, shadeHeight: 34, color: '#1f3d2a', rim: '#d4a64a', bulb: '#fff3c4' },
  lights: { y: 34, sag: 46, spacing: 54, radius: 5, colors: ['#ff5a4f', '#ffd24a', '#4fd36b', '#4fb3ff', '#ff8ad8'], glow: 14 },
  window: { x: 46, y: 150, width: 200, height: 190, frame: '#c9c2b4', sky: ['#0d1830', '#1d3157'], bars: '#2b2b2b', barSpacing: 24, stars: 14 },
  rack: { x: 268, y: 214, width: 48, height: 300, wood: '#6b4423', cues: ['#c8a165', '#a0522d', '#d9b77d', '#8b5a2b'] },
  counter: { x: 974, y: 470, width: 306, height: 150, top: '#8a5a32', front: '#5e3a1e', panel: '#4b2e17', edge: '#2b1a0c' },
  radio: { x: 1010, y: 418, width: 110, height: 52, body: '#b23a2a', grille: '#2b2b2b', dial: '#f2c94c' },
  board: { x: 1000, y: 150, width: 230, height: 160, frame: '#7a5230', slate: '#1d2a22', chalk: 'rgba(240, 240, 230, 0.75)' },
  fan: { x: 1130, y: 60, blade: 90, color: '#3a3a3a' },
  table: { top: 640, rail: '#5a3a1e', railDark: '#3a2412', felt: '#1f7a46', feltDark: '#145233', railHeight: 26 },
  /** Darker round the edges, so the eye lands on the buttons. */
  vignette: 'rgba(0, 0, 0, 0.55)',
  /** Darkens the middle a little more so white button labels and the panel stay readable. */
  centreShade: { width: 700, color: 'rgba(0, 0, 0, 0.18)' },
} as const;

/** The title logo on the menu: "BONGO" in gold with the 8-ball as its first O, "POOL TABLE" on a banner. */
export const LOGO_ART = {
  width: 620,
  height: 150,
  word: { size: 92, y: 66, letterGap: 4, fill: ['#fff1a8', '#f2c94c', '#c98a12'], stroke: '#3b1f08', strokeWidth: 8, shadow: 'rgba(0, 0, 0, 0.5)' },
  ball: { color: '#111111', spot: '#ffffff', shine: 'rgba(255, 255, 255, 0.55)' },
  banner: { y: 124, height: 40, width: 360, fill: '#c0392b', dark: '#7d241b', text: '#ffffff', size: 26, notch: 14 },
  /** Kept on the logo's text (the font is the game's own). */
  font: 'system-ui, sans-serif',
} as const;
