/**
 * Screen layout and look, in design pixels (the game is drawn at 1280x720 and scaled to fit).
 * Art settings (textures drawn at start-up) are in config/art.ts.
 */
export const DESIGN = { width: 1280, height: 720 } as const;

export const TABLE_LAYOUT = {
  /**
   * Pixels per metre of table. 539 (was 560 before the potted-ball tube, 0.18.0) leaves room for the
   * tube between the screen edge and the table on the side away from the controls.
   */
  scale: 539,
  /** Top-left corner of the playing area (cushion noses). */
  originX: 96,
  originY: 104,
  /** Wooden rail drawn around the cushions (the cushion strip is the inner part of it, config/art.ts). */
  railWidth: 34,
} as const;

/** Which side the power bar and spin control sit on (Settings, Robert's request 2026-10-11). */
export const HANDS = ['right', 'left'] as const;
export type Hand = (typeof HANDS)[number];
export const DEFAULT_HAND: Hand = 'right';

export function isHand(value: unknown): value is Hand {
  return typeof value === 'string' && (HANDS as readonly string[]).includes(value);
}

/**
 * Where things go on the table screen for a hand. Right is the layout as written in this file. Left
 * mirrors the controls column (power bar, spin) to the left edge, swaps the Menu
 * and New game corners, and moves the table, with everything drawn on, above or below it, right by the
 * same gap, so the screen is a mirror image. New game then grows rightwards ("Gusa tena kuanza upya"
 * is wide), clear of the fine-aim strip.
 */
export interface ScreenSides {
  readonly hand: Hand;
  /** Added to every x on or around the table: table, balls, player panels, status, hint, fine aim, game over, panels over the table. */
  readonly tableDx: number;
  /** Where something in the controls column or a bottom corner (Menu, New game) goes. */
  controlX(x: number): number;
  /** Horizontal origin for something anchored by one edge, so it grows away from the mirrored corner. */
  controlOriginX(originX: number): number;
}

/** `tableLength` is the playing area's length in metres. */
export function screenSides(hand: Hand, tableLength: number): ScreenSides {
  if (hand === 'right') return { hand, tableDx: 0, controlX: (x) => x, controlOriginX: (o) => o };
  // The playing area spans originX .. originX + length; mirrored it starts at width - that end.
  const tableDx = DESIGN.width - 2 * TABLE_LAYOUT.originX - tableLength * TABLE_LAYOUT.scale;
  return { hand, tableDx, controlX: (x) => DESIGN.width - x, controlOriginX: (o) => 1 - o };
}

/** Drawing order on the table: ball shadows, balls, then the aim guide and cue above them; the HUD is above all. */
export const TABLE_DEPTH = { shadows: 1, balls: 2, aim: 3 } as const;

export const COLORS = {
  background: '#101418',
  ball: { cue: 0xf5f5f0, red: 0xc62828, yellow: 0xf2c94c, black: 0x111111 },
  ballOutline: 0x000000,
  aimLine: 0xffffff,
  spinCross: 0x101418,
  fineAimTrack: 0x1c2228,
  fineAimTick: 0xb8c2bd,
  text: '#ffffff',
  textDim: '#b8c2bd',
  ballInHandRing: 0xf2c94c,
  overlay: 0x0b0e11,
  accent: '#f2994a',
  buttonText: '#101418',
} as const;

export const HUD = {
  /** Above the table, balls and cue stick; below panels. */
  depth: 10,
  /** Status line centred over the table. */
  status: { x: 590, y: 36, wrapWidth: 480, lineSpacing: -2 },
  /** Player panels at the two top corners of the table. */
  players: { y: 36, leftX: 96, rightX: 1082, chipRadius: 17, gap: 10, inactiveAlpha: 0.45 },
  /** The player's face sits inside the chip, which shows round it as a ring in their ball colour. */
  face: { radius: 14 },
  /**
   * Potted-ball tray under each player's name: one slot per ball of their colour, filled as they
   * are potted. Sits between the name and the top rail (rail starts at y 70).
   */
  tray: { y: 60, ballRadius: 9, spacing: 22, emptyAlpha: 0.35, outlineWidth: 1.5 },
  /** Menu button, bottom left (anchored by its left edge). */
  menu: { left: 12, y: DESIGN.height - 30 },
  /** Between the bottom rail (ends at y 631) and the fine-aim strip. */
  hint: { x: 590, y: 668 },
  /** Acha mchezo, anchored by its right edge so a longer label grows leftwards, never off screen. */
  quit: { right: DESIGN.width - 12, y: DESIGN.height - 30 },
  /**
   * End-of-game panel over the middle of the table (scenes/EndPanel.ts): who won and why, stars in
   * story mode, then Endelea (story: next stop), Rudia (a rematch) and Menyu (story: Ramani, the map).
   * The last counts down and leaves on its own unless the screen is touched (Robert, 2026-10-12: 10 s).
   */
  gameOver: {
    x: 590,
    y: 330,
    width: 640,
    height: 320,
    alpha: 0.86,
    padTop: 26,
    lineGap: 12,
    /** Button row, from the panel's centre; wider buttons when there are only two. */
    buttonsDy: 108,
    buttonWidths: { two: 230, three: 186 },
    buttonGap: 18,
    star: { radius: 19, inner: 8.5, spacing: 50, lit: 0xf2c94c, unlit: 0x3a4248, outline: 0x101418 },
    /** The winner's face (0.37.0), centred on the panel's top edge in a gold ring; the title starts `gap` below it. */
    face: { radius: 54, ring: 6, ringColor: 0xf2c94c, gap: 10 },
    autoMenuMs: 10_000,
    tickMs: 250,
  },
  /**
   * Catchphrase bubble under the speaker's panel, over the top rail and the edge of the felt; it
   * points up at their face and goes after `QUIPS.showMs`.
   */
  quip: { top: 84, padX: 14, padY: 8, radius: 12, tailWidth: 16, tailHeight: 10, textSize: '22px', fill: 0xffffff, alpha: 0.95, textColor: '#101418' },
} as const;

/** Buttons: text on a solid background. */
export const BUTTON = {
  padding: { x: 14, y: 10 },
  width: 440,
  /** Side-by-side choices in a panel row. */
  rowWidth: 260,
  rowGap: 24,
} as const;

/** Panels (opponent picker, stats, rules, settings): dark box, title, optional text, buttons, optional Back. */
export const PANEL = {
  titleTop: 40,
  /** Space between the title, the text and the first button. */
  gap: 28,
  buttonSpacing: 72,
  /** Between a row's label and its choices. */
  rowLabelGap: 12,
  /** Back button's distance above the bottom edge. */
  backBottom: 46,
  bodyLineSpacing: 6,
  sideMargin: 40,
  /** The panel's tap-catching box is all but invisible; the drawn panel shows instead. */
  hitAlpha: 0.01,
  /** Above the table and the HUD. */
  depth: 20,
  /** Over the middle of the table (the in-game opponent picker, five choices and Back); the table shows faintly through it. */
  overTable: { x: 590, y: 360, width: 600, height: 560, alpha: 0.94 },
  /** Over the main menu, hiding it completely so its buttons do not show through the text. */
  overMenu: { x: DESIGN.width / 2, y: DESIGN.height / 2, width: 1100, height: 660, alpha: 1 },
} as const;

/**
 * Character picker: a grid of faces in a panel, with Back and Next/Start side by side at the bottom.
 * Offsets are from the panel's top edge and centre, so it fits both the table and the menu panel.
 */
/**
 * "Cheza na nani?" (0.34.0, Robert asked for a better look): a wide button to play a friend, then
 * a card per computer player with their face, strength as 1-4 filled dots and the level's name, and
 * the person's record against them. Four in a row over the menu; two by two in the smaller panel
 * over the table, with the face beside the text. Offsets are from the panel's top edge.
 */
export const OPPONENT_PICKER = {
  gap: 14,
  /** Over the menu: tall cards, face on top. */
  wide: { minAreaWidth: 900, columns: 4, friendFromTop: 160, cardsFromTop: 222, sideMargin: 40, cardHeight: 330, faceRadius: 60, faceFromTop: 82 },
  /** Over the table: short cards, face at the left, all above Back. */
  compact: { columns: 2, friendFromTop: 150, cardsFromTop: 186, sideMargin: 24, cardHeight: 130, faceRadius: 30, faceInset: 12, textGap: 10 },
  strength: { radius: 7, gap: 6, on: 0xf2c94c, off: 0x3a4440 },
  /** Spacing of a card's lines: inside its top edge (compact), under the face (wide), and between lines. */
  lines: { top: 10, underFace: 10, afterName: 6, afterDots: 4, beforeRecord: { wide: 10, compact: 2 } },
  card: { fill: 'rgba(255, 255, 255, 0.05)', solidFill: 'rgba(14, 20, 19, 0.92)', edge: 'rgba(226, 181, 74, 0.55)', edgeWidth: 1.5, chosenEdge: '#f2c94c', chosenWidth: 4, radius: 14 },
} as const;

/**
 * Takwimu (0.34.0): five big totals across the top, a row per computer player with a win bar and a
 * crown once beaten, and games with friends at the bottom. Over the menu (PANEL.overMenu).
 */
export const STATS_PANEL = {
  sideMargin: 50,
  totals: { fromTop: 94, height: 124, gap: 14, numberSize: '44px', numberColor: '#f2c94c', numberTop: 10, labelGap: 0, labelPad: 8 },
  rows: {
    fromTop: 236,
    height: 64,
    gap: 8,
    faceRadius: 25,
    faceInset: 12,
    nameGap: 14,
    /** The win bar starts this far from the row's left edge and stops `barRight` short of its right edge. */
    barLeft: 340,
    barRight: 190,
    barHeight: 16,
    track: 0x26302d,
    fill: 0x3fae6a,
    recordGap: 16,
    crownSize: 34,
    crownInset: 22,
  },
  /** Games with friends, under the rows. */
  friendsGap: 14,
} as const;

/**
 * "Imefunguliwa!" (0.35.0): one popup per new unlock, over everything, in the middle of the screen.
 * Distances are from the panel's top unless named otherwise.
 */
export const UNLOCK_POPUP = {
  area: { x: DESIGN.width / 2, y: DESIGN.height / 2, width: 600, height: 480, alpha: 1 },
  kindFromTop: 92,
  picture: { fromTop: 200, width: 320, height: 150, faceRadius: 68, badgeSize: 120 },
  nameFromTop: 292,
  nameSize: '38px',
  nameColor: '#f2c94c',
  messageGap: 8,
  buttons: { fromBottom: 52, width: 230, gap: 24 },
  /** Gold sparkles bursting out from the picture over the popup. */
  sparkles: { count: 24, from: 70, to: 300, radius: 13, inner: 6, ms: 1000, colors: [0xf2c94c, 0xffe58a, 0xffffff] },
  /** Above every other panel, including the end-of-game panel. */
  depth: 30,
} as const;

/**
 * Kimbunga! (0.36.0): big gold word over the table, a line under it and sparkles, before the end
 * panel. It stays `showMs`, or until tapped. Centred on the table (moved by the hand setting).
 */
export const KIMBUNGA_BANNER = {
  x: 590,
  y: 300,
  size: '120px',
  color: '#f2c94c',
  stroke: '#5a3a00',
  strokeWidth: 10,
  shadow: { x: 0, y: 6, color: '#000000', blur: 12 },
  lineGap: 14,
  lineSize: '30px',
  /** Grows from this scale with a little bounce. */
  fromScale: 0.2,
  inMs: 450,
  showMs: 2600,
  sparkles: { count: 32, from: 60, to: 420, radius: 15, inner: 7, ms: 1300, colors: [0xf2c94c, 0xffe58a, 0xffffff] },
  dim: { color: 0x000000, alpha: 0.45 },
  depth: 25,
} as const;

/**
 * Confetti when a person wins (0.37.0): paper pieces fall from above the screen over the table,
 * drifting and spinning, and fade out by `fallMs` plus the longest `delayMs`.
 */
export const CONFETTI = {
  count: 90,
  /** Each piece starts somewhere between these x positions (design pixels), above the screen. */
  fromX: 140,
  toX: 1100,
  startY: -30,
  endY: 720,
  width: { min: 8, max: 14 },
  height: { min: 12, max: 22 },
  drift: 120,
  spins: 3,
  fallMs: { min: 1800, max: 3000 },
  /** Turning paper looks thinner: width squeezes to `flutterScale` and back every 2 x `flutterMs`. */
  flutterMs: { min: 150, max: 350 },
  flutterScale: 0.3,
  delayMs: 700,
  colors: [0xf2c94c, 0xe53935, 0x43a047, 0x1e88e5, 0xfb8c00, 0xffffff, 0x8e24aa],
  /** Over the table and the end panel, under the unlock popup. */
  depth: 22,
} as const;

/** First launch (0.37.0): "Chagua lugha / Choose language" over the menu, two big buttons. */
export const LANGUAGE_PANEL = { area: { x: DESIGN.width / 2, y: DESIGN.height / 2, width: 600, height: 270, alpha: 1 } } as const;

/** Acha mchezo? over the table: who wins if you quit, then Acha and Endelea kucheza. */
export const QUIT_PANEL = { area: { x: 590, y: 340, width: 560, height: 360, alpha: 0.96 } } as const;

/** The MPYA (new) mark on a newly unlocked look or character in its picker. */
export const NEW_MARK = { fill: 0xc62828, edge: 0xf2c94c, text: '#ffffff', padX: 6, padY: 1, size: '20px', inset: 2 } as const;

export const CHARACTER_PICKER = {
  columns: 4,
  faceRadius: 38,
  columnSpacing: 125,
  /** Room under each face for its name and, while locked, what earns it (wrapped to the column). */
  rowSpacing: 150,
  firstRowFromTop: 175,
  /** Between a face and its name, and a name and a locked character's tag. */
  nameGap: 8,
  lockTagGap: 4,
  /** The MPYA mark's top right corner, out from the face's top right. */
  newMark: { dx: 14, dy: 4 },
  /** A name and its lock text wrap to the column, less this gap between neighbours. */
  labelGap: 8,
  selectedRing: { width: 5, color: 0xf2c94c },
  /** A character player 1 already took, shown faded to player 2. */
  takenAlpha: 0.3,
  buttonsFromBottom: 46,
  /** Back sits this far left of the centre, Next/Start this far right. */
  buttonOffsetX: 140,
} as const;

/** Pickers for tables and cues: a picture of each choice in a grid, names below, Back and Choose at the bottom. */
const LOOK_PICKER_COMMON = {
  /** Between a picture's frame and its name, and a name and a locked look's tag. */
  nameGap: 4,
  lockTagGap: 6,
  selectedFrame: { width: 5, gap: 5, color: 0xf2c94c },
  /** Thin pictures (cues) still get at least this much height to tap. */
  minTouchHeight: 44,
  buttonsFromBottom: 46,
  buttonOffsetX: 140,
  /**
   * More choices than one page holds: ‹ › page arrows in the bottom corners, level with Back and
   * Choose (Robert chose pages over scrolling, 2026-10-12). The page number follows the title.
   */
  pageNav: { arrowDx: 440, arrowWidth: 64 },
} as const;

export const LOOK_PICKER = {
  /** Tables at TABLE_ART.previewScale, 4 by 2 a page, below the panel title. */
  table: { ...LOOK_PICKER_COMMON, columns: 4, rows: 2, lockOnOneLine: false, columnSpacing: 262, rowSpacing: 235, firstRowFromTop: 178 },
  /** Backgrounds at BACKGROUND_ART.previewScale, 4 by 2 a page, like the tables. */
  background: { ...LOOK_PICKER_COMMON, columns: 4, rows: 2, lockOnOneLine: false, columnSpacing: 262, rowSpacing: 235, firstRowFromTop: 178 },
  /** Cues at CUE_ART.previewScale, 2 by 4 a page; rows are low, so a locked cue's name and what earns it share one line. */
  cue: { ...LOOK_PICKER_COMMON, columns: 2, rows: 4, lockOnOneLine: true, columnSpacing: 500, rowSpacing: 108, firstRowFromTop: 140 },
  /** How many are open (0.34.0): at the panel's top left, beside the title ribbon. */
  progress: { left: 50, top: 46, gap: 6, width: 200, height: 8, track: 0x2a3330, fill: 0xf2c94c },
  /** A look story mode has not earned yet: faded, with a padlock and what earns it. */
  locked: { alpha: 0.35, padlock: { width: 26, height: 20, shackle: 9, color: 0xd0d6d3 } },
} as const;

/**
 * Main menu (Robert, 2026-10-13): a big CHEZA (Play) button, then pairs (Mapambo and Takwimu, Sheria and
 * Mipangilio) and Toka. CHEZA and Mapambo open sub pages of one column with Rudi at the bottom.
 */
export const MENU = {
  x: DESIGN.width / 2,
  /** Centre of the logo; Robert's picture logo (0.31.0) is about 200 high, so the buttons start lower. */
  titleY: 108,
  main: {
    /** CHEZA, bigger than the rest because it is what most people came for. */
    playY: 258,
    playWidth: 520,
    playFontSize: '40px',
    /** The rows of pairs and Toka below CHEZA. */
    firstRowY: 360,
    rowSpacing: 80,
  },
  /** Quick game, journey and Continue (CHEZA); tables, cues and scenery (Mapambo). Up to five rows with Rudi. */
  sub: { firstButtonY: 236, buttonSpacing: 76 },
  /** Between two buttons sharing a row. */
  pairGap: 16,
  /** A row of two is wider than one button so each label fits. */
  pairRowWidth: 620,
  /** The dot on CHEZA when a game or journey is waiting to be continued, inset from the top-right corner. */
  savedDot: { radius: 8, inset: 12, color: 0xf2994a, outline: 0x101418, outlineWidth: 2 },
  /** A red dot on Mapambo and on Meza, Fimbo or Mandhari: a newly unlocked look not yet looked at (0.35.0). */
  newDot: { radius: 7, inset: 10, color: 0xc62828, outline: 0xf2c94c, outlineWidth: 2 },
} as const;

/**
 * The see-through tube potted balls roll into (Robert, 2026-10-11), joined to the table on the side
 * away from the controls. Written for the right hand (tube at the left edge); `ScreenSides.controlX`
 * mirrors it. Balls stack from the bottom in the order they were potted.
 */
export const TUBE = {
  x: 34,
  top: 76,
  bottom: 626,
  /** Inside half-width beyond a ball's radius, and the glass wall. */
  clearance: 3,
  wall: 3,
  /** Where potted balls come in: a short pipe from the table's rail near the top corner pocket. */
  entryY: 96,
  /** Gap between stacked balls. */
  gap: 1,
  /** How fast a ball falls, design pixels per second squared, and the most a fall takes. */
  gravity: 2600,
  maxFallMs: 650,
  /** Time to roll along the pipe into the tube. */
  pipeMs: 140,
  /**
   * The roll under the table before the pipe (Robert, 2026-10-14): a ball takes longer from a far
   * pocket. Its wait is the straight-line distance on screen from its pocket to the pipe's mouth at
   * this speed (design pixels per second), at most `maxMs`. The corner by the tube is almost instant;
   * the far corners take about 1.4 s.
   */
  underTable: { speed: 800, maxMs: 1600 },
} as const;

export const BALL_IN_HAND = {
  /** A touch this close to the cue ball (design pixels) picks it up instead of aiming. */
  grabRadius: 44,
  ringRadius: 24,
  ringWidth: 3,
} as const;

export const POWER_BAR = {
  x: 1190,
  top: 250,
  height: 340,
  width: 44,
  handleHeight: 26,
  /** The handle is this much wider than the bar, so it is easy to see under a thumb. */
  handleOverhang: 12,
  disabledAlpha: 0.35,
  /** Releasing below this fraction cancels the shot instead of playing a feeble one. */
  cancelBelow: 0.04,
  /** Extra touch area around the bar, so it is easy to grab on a small phone. */
  touchPadding: 30,
} as const;

/** Spin control: a cue-ball face above the power bar. Its edge is the physics' largest tip offset. */
export const SPIN_CONTROL = {
  x: 1190,
  y: 142,
  radius: 44,
  dotRadius: 9,
  /** Extra touch area around the face. */
  touchPadding: 18,
  /** Label above the face. */
  labelGap: 22,
  crossAlpha: 0.35,
  disabledAlpha: 0.35,
} as const;

/**
 * Fine aim: a strip under the table, between the Menu and New game buttons. Dragging along it turns
 * the aim by `radiansPerPixel` per design pixel (the whole strip turns it about 17 degrees).
 */
export const FINE_AIM = {
  x: 590,
  y: 702,
  width: 600,
  height: 30,
  radiansPerPixel: 0.0005,
  /** Moving tick marks show the strip turning. */
  tickSpacing: 18,
  tickHeight: 14,
  tickWidth: 2,
  touchPadding: 14,
  disabledAlpha: 0.35,
} as const;

export const AIM_GUIDE = {
  /** How far the guide line may reach, metres. */
  maxDistance: 3,
  /** Length of the predicted object-ball and cue-ball paths after contact, metres. */
  followLength: 0.18,
  lineWidth: 2,
  alpha: 0.75,
} as const;

export const CUE_STICK = {
  length: 360,
  /** Gap between the cue tip and the ball at zero power, and extra pull-back at full power, pixels. */
  restGap: 10,
  maxPullBack: 90,
} as const;

export const SIMULATION_LOOP = {
  /** A slow frame runs at most this many physics steps; beyond that the shot plays slower instead of freezing. */
  maxStepsPerFrame: 100,
  /** Search step when finding a free spot for a potted cue ball before ball in hand, metres. */
  respawnSearchStep: 0.06,
} as const;

export const TEXT_STYLE = {
  fontFamily: 'system-ui, sans-serif',
  // Sizes are design pixels. On a common 360-px-tall phone they render at half size, so nothing
  // below 20 (10 CSS px) is used.
  hintSize: '20px',
  statusSize: '24px',
  playerSize: '24px',
  titleSize: '52px',
  buttonSize: '28px',
  labelSize: '20px',
  /** Longer text in panels (rules, stats). */
  bodySize: '22px',
} as const;

/**
 * Story mode's map (scenes/StoryScene.ts): the eight stops on a winding path, the person's face,
 * title and stars at the top, the three story rewards along the bottom.
 */
export const STORY_MAP = {
  title: { x: DESIGN.width / 2, y: 40 },
  /** The person: face, name, title and stars, top left. */
  person: { x: 70, y: 112, faceRadius: 34, textX: 116 },
  change: { right: DESIGN.width - 24, y: 112 },
  /** The chapter's name with arrows to the other chapters, under the title. */
  chapterNav: { x: DESIGN.width / 2, y: 104, arrowDx: 250, arrowWidth: 64 },
  /** Stop centres for a chapter's nine stops: five left to right, then four back. */
  stops: [
    { x: 150, y: 250 }, { x: 395, y: 290 }, { x: 640, y: 250 }, { x: 885, y: 290 }, { x: 1130, y: 250 },
    { x: 1010, y: 470 }, { x: 765, y: 500 }, { x: 520, y: 470 }, { x: 275, y: 500 },
  ],
  stopRadius: 40,
  ring: { width: 5, won: 0xf2c94c, open: 0xffffff },
  lockedAlpha: 0.35,
  path: { color: 0xc9a227, alpha: 0.6, width: 6, dash: 14, gap: 10 },
  /** Under each stop: its place, then its stars. */
  placeGap: 8,
  starsGap: 34,
  star: { radius: 9, inner: 4, spacing: 22, lit: 0xf2c94c, unlit: 0x3a4248 },
  cup: { size: 30, dx: 36, dy: -34 },
  padlock: { width: 22, height: 18, shackle: 8, color: 0xd0d6d3 },
  /**
   * Reward cards along the bottom (0.34.0): a picture, the name, what earns it and a progress bar,
   * a green tick once earned. They sit right of Back and share the row, up to `maxWidth` each.
   */
  rewards: {
    top: 604,
    height: 104,
    left: 150,
    right: DESIGN.width - 20,
    gap: 12,
    maxWidth: 320,
    /** A cue lies corner to corner, this share of the diagonal long. */
    picture: { inset: 10, width: 76, height: 60, cueLength: 0.95 },
    textGap: 10,
    lineGap: 2,
    /** Right of the progress text, to the card's right edge. */
    bar: { height: 8, gap: 10, track: 0x34403c, fill: 0xf2c94c, earned: 0x3fae6a },
    tick: { size: 28, inset: 6 },
  },
  back: { left: 24, y: DESIGN.height - 30 },
  /** The stop card over the map. */
  card: { x: DESIGN.width / 2, y: DESIGN.height / 2, width: 700, height: 520, alpha: 1 },
  dim: { color: 0x05070a, alpha: 0.72 },
} as const;
