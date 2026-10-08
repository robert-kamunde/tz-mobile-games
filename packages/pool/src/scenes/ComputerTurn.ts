import { AI_TURN } from '../config/ai';
import type { AiDecision, ShotPlanner } from '../ai/planner';
import type { Shot, Vec2 } from '../physics/types';

/** What the computer's turn does to the table, supplied by the scene. */
export interface ComputerTurnHooks {
  /** Puts the cue ball down for ball in hand. Returns false if the spot was refused. */
  place(spot: Vec2): boolean;
  /** Current aim, and setting it (redraws the cue). */
  aim(): Vec2;
  setAim(direction: Vec2): void;
  showPower(power: number): void;
  shoot(shot: Shot): void;
}

export type ComputerPhase = 'thinking' | 'placing' | 'aiming' | 'power';

/**
 * Runs one computer turn on screen: thinks in slices that fit the frame, then shows the ball being
 * placed, the cue swinging to its line and the power filling, then shoots. The thinking itself is
 * the pure ShotPlanner; this class only paces it.
 */
export class ComputerTurn {
  private planner: ShotPlanner | null = null;
  private decision: AiDecision | null = null;
  private phase: ComputerPhase | null = null;
  private phaseMs = 0;
  /** Wall-clock time the computer has been thinking on screen. */
  private thinkMs = 0;
  private lastThinkAt: number | null = null;
  private aimFrom: Vec2 = { x: 1, y: 0 };

  constructor(
    private readonly hooks: ComputerTurnHooks,
    /** Wall clock in ms, for the per-frame thinking budget. */
    private readonly now: () => number,
  ) {}

  get active(): boolean {
    return this.phase !== null;
  }

  get currentPhase(): ComputerPhase | null {
    return this.phase;
  }

  start(planner: ShotPlanner): void {
    this.planner = planner;
    this.decision = null;
    this.thinkMs = 0;
    this.lastThinkAt = null;
    this.enter('thinking');
  }

  cancel(): void {
    this.planner = null;
    this.decision = null;
    this.phase = null;
  }

  update(deltaMs: number): void {
    if (!this.phase) return;
    this.phaseMs += deltaMs;
    switch (this.phase) {
      case 'thinking':
        return this.think();
      case 'placing':
        if (this.phaseMs >= AI_TURN.placeMs) this.startAiming();
        return;
      case 'aiming': {
        const target = this.decision!.shot.direction;
        const k = Math.min(1, this.phaseMs / AI_TURN.aimMs);
        this.hooks.setAim(blend(this.aimFrom, target, k));
        if (k >= 1) this.enter('power');
        return;
      }
      case 'power': {
        const shot = this.decision!.shot;
        const k = Math.min(1, this.phaseMs / AI_TURN.powerMs);
        this.hooks.showPower(shot.power * k);
        if (k >= 1) {
          this.cancel();
          this.hooks.shoot(shot);
        }
        return;
      }
    }
  }

  private think(): void {
    const planner = this.planner!;
    const start = this.now();
    // Phaser smooths and caps frame deltas, so on a slow phone they undercount; time on the clock is what the player waits.
    if (this.lastThinkAt !== null) this.thinkMs += Math.min(start - this.lastThinkAt, AI_TURN.maxFrameGapMs);
    this.lastThinkAt = start;
    while (!planner.done && this.now() - start < AI_TURN.frameBudgetMs) planner.work(AI_TURN.stepsPerSlice);
    const ready = planner.done && this.thinkMs >= AI_TURN.minThinkMs;
    if (!ready && this.thinkMs < AI_TURN.maxThinkMs) return;
    // On a slow phone the time limit ends the thinking; the best shot found so far is played.
    this.decision = planner.decision();
    const place = this.decision.place;
    if (place && this.hooks.place(place)) this.enter('placing');
    else this.startAiming();
  }

  private startAiming(): void {
    this.aimFrom = this.hooks.aim();
    this.enter('aiming');
  }

  private enter(phase: ComputerPhase): void {
    this.phase = phase;
    this.phaseMs = 0;
  }
}

/** Unit vector part-way from a to b (k from 0 to 1). Falls back to b if they point opposite ways. */
function blend(a: Vec2, b: Vec2, k: number): Vec2 {
  const x = a.x + (b.x - a.x) * k;
  const y = a.y + (b.y - a.y) * k;
  const len = Math.sqrt(x * x + y * y);
  return len > 1e-6 ? { x: x / len, y: y / len } : b;
}
