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
    /**
     * Rounded top (0.33.0, Robert's "whole table" depth): across each rail, darker at both edges and
     * lit along a crown `crownAt` of the way in from the outside.
     */
    crown: { edge: 'rgba(0, 0, 0, 0.24)', light: 'rgba(255, 240, 210, 0.16)', crownAt: 0.35 },
  },
  /** Sight marks on the rails: 3 between each pair of pockets on the long rails, 3 on each short rail. */
  diamond: { perGap: 3, outline: 'rgba(0, 0, 0, 0.55)', outlineWidth: 1 },
  /** Rubber cushion strip between the cloth and the rail, and the pocket jaws (colour per table). */
  cushion: {
    width: 12,
    nose: 'rgba(255, 255, 255, 0.16)',
    noseWidth: 1.5,
    jawWidth: 4,
    /** Rounded rubber (0.33.0): shaded where it meets the rail, lit along the nose. */
    shade: { rail: 'rgba(0, 0, 0, 0.38)', nose: 'rgba(255, 255, 255, 0.2)' },
    /** The soft shadow the cushions throw on the cloth along every edge. */
    clothShadow: { width: 9, color: 'rgba(0, 0, 0, 0.3)' },
  },
  /** Faint speckle on the felt so it does not look flat (colours per table). */
  cloth: {
    speckles: 1800,
    speckleAlpha: 0.06,
    seed: 11,
    /** Lamp light (0.33.0): a warm pool in the middle, `radius` of the half-diagonal, and darker corners. */
    lamp: { glow: 'rgba(255, 246, 220, 0.12)', radius: 0.55, corners: 'rgba(0, 0, 0, 0.22)' },
  },
  /**
   * Pockets (0.33.0): looking down into a hole, the bottom is black and sits towards the table's
   * middle (`bottomShift` of the radius), so the inside wall shows on the far side, lit by the lamp.
   * A leather rim catches the light on the side towards it.
   */
  pocket: {
    inner: '#000000',
    wall: '#3a3129',
    wallLit: '#806a55',
    bottomShift: 0.4,
    bottomEnd: 0.42,
    rim: '#1e120a',
    rimLight: 'rgba(255, 222, 170, 0.45)',
    rimWidth: 4,
    /**
     * Leather cups (0.33.1, Robert saw wood in the corner outside the hole): each pocket's leather
     * covers the rail from the hole to the table's edge, filling the corner on corner pockets.
     */
    cup: { light: '#4a2e1c', dark: '#1c110a', edge: 'rgba(0, 0, 0, 0.55)', edgeWidth: 1.5 },
  },
  /** A potted ball sinks into the hole: it shrinks, darkens and fades over `ms`. */
  sink: { ms: 220, scale: 0.55, tint: 0x2a2a2a },
  baulk: { color: 'rgba(255, 255, 255, 0.32)', width: 1.5 },
  /** Small pictures of each table on the table picker: this fraction of the real size. */
  previewScale: 0.22,
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
  /** Shelves at these heights (in the bands above and below the table and between), cups along them. */
  trophies: { rows: [62, 360, 700], shelf: 5, spacing: 56, cupHeight: 34, sparkles: 120 },
  /** Kibo's flat top stands in the right-hand column, clear of the status line; its long slope runs down the left. */
  mountain: { stars: 90, base: 470, top: 22, topLeft: 1060, topRight: 1250, snowLine: 62, trees: [70, 1210], treeHeight: 56 },
  /** The horizon sits just under the top band; the sun sets in the right-hand column. */
  lake: { horizonY: 64, sun: { x: 1200, radius: 30 }, shimmer: 9, rocks: [[110, 600], [1180, 560]], boats: [200, 520, 900, 1150], boatSize: 26 },
  seed: 23,
  /** Small pictures on the background picker, with a simple table on them so the choice is clear. */
  previewScale: 0.18,
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
  /**
   * The spot rolls with the ball (0.32.0). A ball moving further than this between two frames
   * (metres) was placed, not rolled, and its spot stays put. Near the edge the spot fades out.
   */
  rollingSpot: { maxStep: 0.2, fadeBelow: 0.25 },
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

/**
 * Character face pictures (0.20.0): one file per character in packages/pool/portraits, named
 * `<character id>.png` (or .jpg). Swapping a file changes that face; a missing file falls back to
 * the drawing above. `npm run portraits -w @tzg/pool` squares and shrinks new files to this size.
 */
/**
 * Robert's pictures for the title logo, menu background and app icon (0.31.0), in packages/pool/art:
 * `logo.png` (transparent), `menu-background.jpg` (16:9) and `icon.jpg` (square, used only by
 * `npm run icons`). Each replaces the drawn version; without the file the drawn one is used.
 */
export const ART_FILES = {
  /** Shown in the game (the icon is not). */
  inGame: ['logo', 'menu-background'],
  /** Largest file allowed in the app, so the pictures stay light on a low-end phone. */
  maxBytes: 400_000,
  /** The logo picture's width on the menu, design pixels (its height follows the picture). */
  logoWidth: 396,
} as const;

export const PORTRAIT_FILES = {
  /** Width and height of every file, in pixels. The game crops it to a circle. */
  size: 512,
  /** Largest file allowed in the app, so twelve faces stay light on a low-end phone. */
  maxBytes: 300_000,
  /** Quality when the script saves a photo-like face as JPEG. */
  jpegQuality: 0.88,
} as const;

/** Buttons and panels (Milestone 9 Part B): rounded, softly lit, with a thin gold edge on panels. */
export const UI_ART = {
  /**
   * Buttons (0.32.0, Robert asked for a premium feel): deep teal-green with a thin gold border, a
   * soft bevel and cream bold text. Main actions (`primary`) and the current or last choice
   * (`highlighted`) are gold with dark text.
   */
  button: {
    radius: 12,
    /** Top and bottom of the face. */
    face: ['#1f7a63', '#0e4a3b'],
    gold: ['#ffe08a', '#d29a2a'],
    /** A darker lip along the bottom so the button looks raised; it closes up while pressed. */
    lip: { height: 4, color: 'rgba(0, 0, 0, 0.45)' },
    edge: { width: 1.5, color: '#e2b54a', goldColor: '#7a5212' },
    /** Bevel: light along the top inside edge, shade along the bottom. */
    bevel: { width: 2, light: 'rgba(255, 255, 255, 0.28)', dark: 'rgba(0, 0, 0, 0.25)' },
    /** A soft gloss over the top half of the face. */
    gloss: 'rgba(255, 255, 255, 0.10)',
    text: { color: '#fff3d6', goldColor: '#2a1a06', bold: true },
    /** Text shadow under the cream text, and a faint light one under the dark gold text. */
    textShadow: { dy: 2, blur: 2, color: 'rgba(0, 0, 0, 0.6)', goldColor: 'rgba(255, 255, 255, 0.35)' },
    /** Pressed: drawn this much smaller, so it sinks in under the finger. */
    pressScale: 0.95,
  },
  /**
   * Popups (0.32.0): a dark wooden frame with a gold edge, a red ribbon under the title like the
   * logo's, the screen around dimmed, and a short pop-in.
   */
  panel: {
    radius: 18,
    /** Inside the frame, lighter at the top; the panel's own alpha still applies. */
    top: '#1b2622',
    bottom: '#0b0f0d',
    frame: { width: 14, light: '#8a5428', dark: '#3c2210', grain: 'rgba(0, 0, 0, 0.18)', grainSpacing: 5 },
    edge: { width: 2, color: '#e2b54a' },
    inner: { width: 1.5, color: 'rgba(226, 181, 74, 0.6)' },
    ribbon: { padX: 46, padY: 8, notch: 16, top: '#d23a2c', bottom: '#8f1d14', edge: '#f2c94c', edgeWidth: 1.5, tailDrop: 6, tail: '#6b130c' },
    dim: { color: 0x0b0e11, alpha: 0.55 },
    /**
     * What earns a locked character or look (0.34.0, Robert: it read like part of the name): a small
     * gold-edged tag with a padlock under the name.
     */
    lockTag: { padX: 10, padY: 4, iconWidth: 18, radius: 8, fill: 'rgba(40, 28, 8, 0.85)', edge: '#c9a03a', text: '#f2c94c', icon: '#f2c94c' },
    pop: { ms: 180, fromScale: 0.92, ease: 'Back.Out' },
    /** A crown on a beaten computer player (Takwimu), a tick on an earned journey reward (0.34.0). */
    crown: { fill: '#f2c94c', edge: '#8a6414', jewel: '#c62828' },
    tick: { fill: '#3fae6a', edge: '#1d5c37', mark: '#ffffff' },
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

/** The potted-ball tube (config/layout.ts `TUBE`): tinted glass with metal end caps. */
export const TUBE_ART = {
  glass: 'rgba(170, 210, 230, 0.16)',
  /** Light enough that the black ball shows against it. */
  inside: 'rgba(190, 215, 230, 0.24)',
  edge: 'rgba(220, 240, 255, 0.55)',
  edgeWidth: 1.5,
  /** Bright streak down the front of the glass, drawn over the balls. */
  shine: { x: 0.3, width: 0.16, color: 'rgba(255, 255, 255, 0.28)' },
  cap: { height: 9, light: '#c9d1d8', dark: '#6b747c' },
  /**
   * Where the pipe meets the table. 0.32.0 ended it in a dark oval, which Robert found looked stuck
   * on; 0.33.1 fits a metal collar instead, like the tube's caps: `width` wide, `extra` taller than the
   * pipe on each side, reaching `overhang` onto the rail, with a soft `contact` shadow on the rail
   * beside it. The pipe darkens towards the collar over `fadeRadii` ball radii, and a ball fades in
   * as it comes out from under it.
   */
  /** A ball coming out of the pipe is fully seen this far along it. */
  fadeInAlong: 0.5,
  collar: { width: 6, extra: 3, overhang: 2, radius: 2, contact: { width: 6, color: 'rgba(0, 0, 0, 0.45)' } },
  mouth: { fadeRadii: 2.5, fadeAlpha: 0.75 },
  /** Soft shadow the tube and pipe cast on the background, offset down and away from the light. */
  shadow: { color: 'rgba(0, 0, 0, 0.45)', blur: 7, dx: 4, dy: 6 },
} as const;

/**
 * App icon, splash screens and store pictures (Part C), drawn by `scenes/art/storeArt.ts` with the
 * game's own drawing code and saved by `scripts/makeAppIcons.mjs`.
 */
export const STORE_ART = {
  /** Felt behind the icon's balls; the adaptive icon's background colour matches the edge. */
  felt: { light: '#2a8f55', dark: '#1d5c3a' },
  iconCorner: 0.18,
  /** Balls on the icon, as fractions of its size: the 8-ball in front, a red and a yellow behind. */
  iconBalls: { eight: { x: 0.5, y: 0.56, r: 0.25 }, red: { x: 0.27, y: 0.36, r: 0.17 }, yellow: { x: 0.73, y: 0.36, r: 0.17 } },
  /** The adaptive icon's foreground must keep to the middle 66 of 108 dp. */
  foregroundScale: 0.58,
  ballShadow: 'rgba(0, 0, 0, 0.35)',
  /** Splash: the menu's bar, darkened, with the logo over it. */
  splashShade: 'rgba(0, 0, 0, 0.35)',
  /** Logo box width as a fraction of the screen width (the lettering fills about two thirds of the box). */
  splashLogoWidth: { landscape: 0.7, portrait: 1.25 },
  /** Robert's picture logo (0.31.0) is taller for its width: it fits within these fractions of the splash. */
  splashPictureLogo: { maxWidth: 0.8, maxHeight: 0.5 },
  /**
   * Robert's icon picture on the adaptive icon's foreground layer (108 dp, of which launchers show the
   * middle 72 dp): drawn this fraction of the layer wide, so the visible window shows 80% of it.
   */
  foregroundPictureScale: 90 / 108,
  feature: {
    tagline: 'Pool ya bar, mfukoni mwako',
    taglineColor: '#ffffff',
    logoWidth: 0.52,
    /** Characters shown on the right of the feature graphic. */
    faces: ['malkia', 'fundi', 'bingwa'],
    faceRadius: 0.17,
  },
} as const;
