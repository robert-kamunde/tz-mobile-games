import { Emitter } from './events';
import type { Logger } from './logger';
import { silentLogger } from './logger';

/**
 * App lifecycle: tells the game when it goes to the background (pause, save) and comes back (resume).
 *
 * Sources: the page's visibilitychange and pagehide events. On Android, Capacitor's WebView
 * fires visibilitychange when the app is backgrounded. A native lifecycle source can be added later
 * through the same notifyPause/notifyResume methods.
 */
export type LifecycleEvents = { pause: { reason: string }; resume: { reason: string } };

export interface LifecycleTarget {
  readonly hidden: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export class AppLifecycle {
  private readonly emitter: Emitter<LifecycleEvents>;
  private paused: boolean;
  private readonly detachers: Array<() => void> = [];

  constructor(
    private readonly doc: LifecycleTarget,
    windowTarget: Pick<LifecycleTarget, 'addEventListener' | 'removeEventListener'> | undefined,
    private readonly logger: Logger = silentLogger,
  ) {
    this.emitter = new Emitter((error) => logger.error('lifecycle listener failed', error));
    this.paused = doc.hidden;

    const onVisibility = () => (doc.hidden ? this.notifyPause('hidden') : this.notifyResume('visible'));
    doc.addEventListener('visibilitychange', onVisibility);
    this.detachers.push(() => doc.removeEventListener('visibilitychange', onVisibility));

    if (windowTarget) {
      const onPageHide = () => this.notifyPause('pagehide');
      windowTarget.addEventListener('pagehide', onPageHide);
      this.detachers.push(() => windowTarget.removeEventListener('pagehide', onPageHide));
    }
  }

  get isPaused(): boolean {
    return this.paused;
  }

  on<K extends keyof LifecycleEvents>(event: K, listener: (payload: LifecycleEvents[K]) => void): () => void {
    return this.emitter.on(event, listener);
  }

  /** Idempotent: repeated pause signals (e.g. visibilitychange then pagehide) emit once. */
  notifyPause(reason: string): void {
    if (this.paused) return;
    this.paused = true;
    this.logger.info(`pause (${reason})`);
    this.emitter.emit('pause', { reason });
  }

  notifyResume(reason: string): void {
    if (!this.paused) return;
    this.paused = false;
    this.logger.info(`resume (${reason})`);
    this.emitter.emit('resume', { reason });
  }

  dispose(): void {
    for (const detach of this.detachers) detach();
    this.detachers.length = 0;
    this.emitter.clear();
  }
}
