import type { Logger } from './logger';
import { silentLogger } from './logger';

/** Handles a back press; returns true if it did something (or deliberately ignored it). */
export type BackHandler = () => boolean;

/**
 * Android's back button. Screens add a handler while they are showing; a press asks the most
 * recently added handler first, then older ones. When none handles it, the app is sent away
 * (`leave`), which is what back does on a phone's home screen of an app.
 */
export class BackButton {
  private readonly handlers: BackHandler[] = [];
  private leaves = 0;

  constructor(
    private readonly leave: () => void,
    private readonly logger: Logger = silentLogger,
  ) {}

  /** Adds a handler and returns a function that removes it (safe to call twice). */
  add(handler: BackHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const i = this.handlers.lastIndexOf(handler);
      if (i >= 0) this.handlers.splice(i, 1);
    };
  }

  press(): void {
    for (let i = this.handlers.length - 1; i >= 0; i--) {
      try {
        if (this.handlers[i]!()) return;
      } catch (error) {
        // A broken screen must not throw the player out of the app.
        this.logger.error('back handler failed', error);
        return;
      }
    }
    this.leaves += 1;
    this.leave();
  }

  /** How many presses sent the app away (for tests). */
  get leaveCount(): number {
    return this.leaves;
  }
}
