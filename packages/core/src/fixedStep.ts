/**
 * Fixed-timestep accumulator. Game simulation (physics, rules) advances in equal steps
 * regardless of frame rate, so a shot behaves the same on a 30 fps and a 120 fps phone.
 */
export interface FixedStepConfig {
  /** Simulation step length in milliseconds. */
  stepMs: number;
  /**
   * Upper bound on steps per frame. Prevents the "spiral of death" on slow devices or after a long stall:
   * excess time is dropped, so the game slows down instead of freezing.
   */
  maxStepsPerFrame: number;
}

export interface StepResult {
  steps: number;
  /** Fraction (0..1) of a step left in the accumulator, for render interpolation. */
  alpha: number;
  droppedMs: number;
}

export class FixedStepper {
  private accumulatorMs = 0;

  constructor(private readonly config: FixedStepConfig) {
    if (!(config.stepMs > 0)) throw new Error(`stepMs must be > 0, got ${config.stepMs}`);
    if (!Number.isInteger(config.maxStepsPerFrame) || config.maxStepsPerFrame < 1) {
      throw new Error(`maxStepsPerFrame must be an integer >= 1, got ${config.maxStepsPerFrame}`);
    }
  }

  /** Advances by a frame's elapsed time and calls step() zero or more times. Negative or non-finite input is ignored. */
  advance(frameMs: number, step: (stepMs: number) => void): StepResult {
    const elapsed = Number.isFinite(frameMs) && frameMs > 0 ? frameMs : 0;
    this.accumulatorMs += elapsed;

    let steps = 0;
    while (this.accumulatorMs >= this.config.stepMs && steps < this.config.maxStepsPerFrame) {
      step(this.config.stepMs);
      this.accumulatorMs -= this.config.stepMs;
      steps += 1;
    }

    let droppedMs = 0;
    if (this.accumulatorMs >= this.config.stepMs) {
      droppedMs = this.accumulatorMs - (this.accumulatorMs % this.config.stepMs);
      this.accumulatorMs -= droppedMs;
    }

    return { steps, alpha: this.accumulatorMs / this.config.stepMs, droppedMs };
  }

  /** Discards pending time, e.g. when resuming from the background so no catch-up burst happens. */
  reset(): void {
    this.accumulatorMs = 0;
  }
}
