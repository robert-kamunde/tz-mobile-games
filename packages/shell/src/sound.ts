import type { AppLifecycle, Logger } from '@tzg/core';

/** One sound actually started, for browser tests. */
export interface PlayedSound {
  readonly name: string;
  readonly gain: number;
}

/** Most sounds playing at once; more are dropped (a slow phone must not choke on a busy break). */
const MAX_VOICES = 8;
/** Plays kept for tests. */
const LOG_LENGTH = 200;

/**
 * Plays short sound effects through Web Audio. Phones block sound until the first touch, so the
 * board unlocks on the first pointer-down; until then, and while the app is in the background,
 * sounds are skipped rather than queued (a late burst would be worse than silence). If the device
 * has no Web Audio, or it fails, the game simply plays silently.
 */
export class SoundBoard {
  private readonly context: AudioContext | null;
  private readonly buffers = new Map<string, AudioBuffer>();
  private voices = 0;
  private unlocked = false;
  private readonly played: PlayedSound[] = [];

  constructor(
    private readonly lifecycle: AppLifecycle,
    private readonly logger: Logger,
    /** Current volume, 0 (off) to 1. */
    private readonly volume: () => number,
    createContext: () => AudioContext | null = defaultContext,
  ) {
    this.context = this.tryCreate(createContext);
    if (!this.context) return;
    const unlock = () => {
      document.removeEventListener('pointerdown', unlock, true);
      this.unlocked = true;
      if (!lifecycle.isPaused) this.resumeContext();
    };
    document.addEventListener('pointerdown', unlock, true);
    lifecycle.on('pause', () => void this.context!.suspend().catch((e: unknown) => logger.warn('audio suspend failed', e)));
    lifecycle.on('resume', () => {
      if (this.unlocked) this.resumeContext();
    });
  }

  /** Sample rate sounds should be rendered at (falls back to a common rate when there is no audio). */
  get sampleRate(): number {
    return this.context?.sampleRate ?? 44_100;
  }

  /** "running" when sound can be heard, otherwise why not (for tests and the log). */
  get state(): string {
    return this.context ? this.context.state : 'unavailable';
  }

  add(name: string, samples: Float32Array): void {
    if (!this.context) return;
    try {
      const buffer = this.context.createBuffer(1, samples.length, this.context.sampleRate);
      buffer.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
      this.buffers.set(name, buffer);
    } catch (error) {
      this.logger.warn(`could not load sound "${name}"`, error);
    }
  }

  /** Plays a loaded sound at a gain from 0 to 1 (scaled by the volume setting). */
  play(name: string, gain: number): void {
    const ctx = this.context;
    const level = Math.min(1, Math.max(0, gain)) * this.volume();
    if (!ctx || ctx.state !== 'running' || level <= 0 || this.voices >= MAX_VOICES || this.lifecycle.isPaused) return;
    const buffer = this.buffers.get(name);
    if (!buffer) {
      this.logger.warn(`no sound named "${name}"`);
      return;
    }
    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const amp = ctx.createGain();
      amp.gain.value = level;
      source.connect(amp).connect(ctx.destination);
      this.voices += 1;
      source.onended = () => {
        this.voices -= 1;
        source.disconnect();
        amp.disconnect();
      };
      source.start();
      this.played.push({ name, gain: level });
      if (this.played.length > LOG_LENGTH) this.played.shift();
    } catch (error) {
      this.logger.warn(`could not play sound "${name}"`, error);
    }
  }

  /** Recent plays, oldest first (browser tests). */
  get log(): readonly PlayedSound[] {
    return this.played;
  }

  private resumeContext(): void {
    void this.context!.resume().catch((e: unknown) => this.logger.warn('audio resume failed', e));
  }

  private tryCreate(createContext: () => AudioContext | null): AudioContext | null {
    try {
      const ctx = createContext();
      if (!ctx) this.logger.warn('no Web Audio; the game will be silent');
      return ctx;
    } catch (error) {
      this.logger.warn('could not start audio; the game will be silent', error);
      return null;
    }
  }
}

function defaultContext(): AudioContext | null {
  return typeof AudioContext === 'function' ? new AudioContext() : null;
}
