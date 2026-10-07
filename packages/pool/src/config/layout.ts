/**
 * Screen layout and look, in design pixels (the game is drawn at 1280x720 and scaled to fit).
 * All colours are placeholders until the art pass (docs/ASSETS.md).
 */
export const DESIGN = { width: 1280, height: 720 } as const;

export const TABLE_LAYOUT = {
  /** Pixels per metre of table. */
  scale: 560,
  /** Top-left corner of the playing area (cushion noses). */
  originX: 58,
  originY: 104,
  /** Wooden rail drawn around the cushions. */
  railWidth: 34,
} as const;

export const COLORS = {
  background: '#101418',
  rail: 0x5b3a1e,
  cloth: 0x1d6b3a,
  cushion: 0x15502b,
  pocket: 0x050505,
  baulkLine: 0xffffff,
  ball: { cue: 0xf5f5f0, red: 0xc62828, yellow: 0xf2c94c, black: 0x111111 },
  ballOutline: 0x000000,
  aimLine: 0xffffff,
  cue: 0xd9b38c,
  powerTrack: 0x2a2f36,
  powerFill: 0xf2994a,
  powerHandle: 0xffffff,
  text: '#ffffff',
  textDim: '#b8c2bd',
  ballInHandRing: 0xf2c94c,
  overlay: 0x0b0e11,
  accent: '#f2994a',
  buttonText: '#101418',
  buttonBackground: '#ffffff',
} as const;

export const HUD = {
  /** Status line centred over the table. */
  status: { x: 570, y: 36, wrapWidth: 480, lineSpacing: -2 },
  /** Player panels at the two top corners of the table. */
  players: { y: 36, leftX: 58, rightX: 1082, chipRadius: 13, gap: 10, inactiveAlpha: 0.45 },
  /**
   * Potted-ball tray under each player's name: one slot per ball of their colour, filled as they
   * are potted. Sits between the name and the top rail (rail starts at y 70).
   */
  tray: { y: 60, ballRadius: 9, spacing: 22, emptyAlpha: 0.35, outlineWidth: 1.5 },
  placeholder: { x: 24, y: DESIGN.height - 22 },
  hint: { x: 570, y: DESIGN.height - 22 },
  /** Anchored by its right edge so a longer label grows leftwards, never off screen. */
  newGame: { right: DESIGN.width - 12, y: DESIGN.height - 30, padding: { x: 14, y: 10 } },
  /** Game-over panel over the middle of the table. */
  gameOver: { x: 570, y: 330, width: 640, height: 200, alpha: 0.82 },
  /** A second tap on New game within this time confirms it mid-match. */
  confirmMs: 3000,
} as const;

export const BALL_IN_HAND = {
  /** A touch this close to the cue ball (design pixels) picks it up instead of aiming. */
  grabRadius: 44,
  ringRadius: 24,
  ringWidth: 3,
} as const;

export const POWER_BAR = {
  x: 1190,
  top: 150,
  height: 440,
  width: 44,
  handleHeight: 26,
  /** Releasing below this fraction cancels the shot instead of playing a feeble one. */
  cancelBelow: 0.04,
  /** Extra touch area around the bar, so it is easy to grab on a small phone. */
  touchPadding: 30,
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
  width: 8,
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
} as const;
