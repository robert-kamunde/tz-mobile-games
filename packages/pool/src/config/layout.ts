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
  /** Anchored by its right edge so a longer label grows leftwards, never off screen. */
  newGame: { right: DESIGN.width - 12, y: DESIGN.height - 30 },
  /** Game-over panel over the middle of the table. */
  gameOver: { x: 590, y: 330, width: 640, height: 200, alpha: 0.82 },
  /** A second tap on New game within this time confirms it mid-match. */
  confirmMs: 3000,
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
export const CHARACTER_PICKER = {
  columns: 4,
  faceRadius: 38,
  columnSpacing: 125,
  rowSpacing: 125,
  firstRowFromTop: 175,
  /** Between a face and its name. */
  nameGap: 8,
  selectedRing: { width: 5, color: 0xf2c94c },
  /** A character player 1 already took, shown faded to player 2. */
  takenAlpha: 0.3,
  buttonsFromBottom: 46,
  /** Back sits this far left of the centre, Next/Start this far right. */
  buttonOffsetX: 140,
} as const;

/** Pickers for tables and cues: a picture of each choice in a grid, names below, Back and Choose at the bottom. */
const LOOK_PICKER_COMMON = {
  /** Between a picture's frame and its name. */
  nameGap: 4,
  selectedFrame: { width: 5, gap: 5, color: 0xf2c94c },
  /** Thin pictures (cues) still get at least this much height to tap. */
  minTouchHeight: 44,
  buttonsFromBottom: 46,
  buttonOffsetX: 140,
} as const;

export const LOOK_PICKER = {
  /** Tables at TABLE_ART.previewScale, 3 by 2, below the panel title. */
  table: { ...LOOK_PICKER_COMMON, columns: 3, columnSpacing: 345, rowSpacing: 235, firstRowFromTop: 178 },
  /** Backgrounds at BACKGROUND_ART.previewScale, 3 by 2, like the tables. */
  background: { ...LOOK_PICKER_COMMON, columns: 3, columnSpacing: 345, rowSpacing: 235, firstRowFromTop: 178 },
  /** Cues at CUE_ART.previewScale, 2 by 3. */
  cue: { ...LOOK_PICKER_COMMON, columns: 2, columnSpacing: 500, rowSpacing: 130, firstRowFromTop: 150 },
} as const;

/** Main menu. */
export const MENU = {
  x: DESIGN.width / 2,
  titleY: 82,
  /** Up to seven rows (Continue to Exit) fit between the title and the bottom edge. */
  firstButtonY: 190,
  buttonSpacing: 70,
  /** Between two buttons sharing a row. */
  pairGap: 16,
  /** A row of three (Meza, Fimbo, Mandhari) is wider than one button so each label fits. */
  tripleRowWidth: 620,
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
