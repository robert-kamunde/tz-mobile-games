import type { Logger } from './logger';
import { silentLogger } from './logger';

/**
 * Closes the game for good (the menu's Exit button). Only offered where an app can close itself:
 * in the Android app, not on a web page. `prepare` runs first, so nothing waiting to be saved is lost.
 */
export class AppExit {
  private closes = 0;

  constructor(
    readonly available: boolean,
    private readonly prepare: () => void,
    private readonly close: () => void,
    private readonly logger: Logger = silentLogger,
  ) {}

  exit(): void {
    if (!this.available) return;
    try {
      this.prepare();
    } catch (error) {
      // Better to close with an unsaved setting than to leave the player stuck in the app.
      this.logger.error('could not prepare to exit', error);
    }
    this.closes += 1;
    this.close();
  }

  /** How many times the game was closed (for tests). */
  get exitCount(): number {
    return this.closes;
  }
}
