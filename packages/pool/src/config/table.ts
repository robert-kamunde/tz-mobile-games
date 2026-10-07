/**
 * Table and ball dimensions, in metres. Approximates a UK 7 ft bar table as used for Blackball.
 * These numbers are from published standard sizes, not measured on a table in Tanzania (KNOWN_ISSUES U4).
 */
export interface TableConfig {
  /** Playing area between the cushion noses. x runs along the length, y across the width. */
  readonly playLength: number;
  readonly playWidth: number;
  /** Gap between the two cushion noses at a corner pocket. */
  readonly cornerMouth: number;
  /** Gap between the two cushion noses at a middle pocket. */
  readonly middleMouth: number;
  /** How far the pocket jaws run back from the cushion nose. */
  readonly jawLength: number;
  /** How much each middle-pocket jaw narrows towards the back of the pocket. */
  readonly middleJawTaper: number;
  /** A ball drops once its centre is within this distance of the pocket's drop point. */
  readonly dropRadius: number;
  /** Middle pocket drop point, measured outwards from the cushion line. */
  readonly middleDropDepth: number;
  /** Baulk line distance from the head cushion. The cue ball starts behind it. */
  readonly baulkLine: number;
  /** Where the cue ball is placed for the break and after it is potted (Milestone 1 practice only), from the head cushion. */
  readonly cueStart: number;
  /** Apex of the rack, measured from the head cushion. */
  readonly footSpot: number;
  readonly objectBallRadius: number;
  readonly cueBallRadius: number;
  /** Only the ratio between masses matters to the simulation. */
  readonly objectBallMass: number;
  readonly cueBallMass: number;
  /** Space left between racked balls so they do not start overlapping. */
  readonly rackGap: number;
}

export const UK_7FT_TABLE: TableConfig = {
  playLength: 1.83,
  playWidth: 0.915,
  cornerMouth: 0.089,
  middleMouth: 0.095,
  jawLength: 0.06,
  middleJawTaper: 0.008,
  dropRadius: 0.03,
  middleDropDepth: 0.03,
  baulkLine: 0.366,
  cueStart: 0.25,
  footSpot: 1.3725,
  objectBallRadius: 0.0254,
  cueBallRadius: 0.0238,
  objectBallMass: 0.13,
  cueBallMass: 0.13,
  rackGap: 0.0002,
};
