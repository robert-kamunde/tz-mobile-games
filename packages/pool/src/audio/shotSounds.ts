import { SOUND_LOUDNESS, SOUND_MIX, type Loudness, type PoolSound } from '../config/sound';
import type { ShotEvent } from '../physics/types';

export interface SoundCue {
  readonly sound: PoolSound;
  readonly gain: number;
}

/** Contact speed to gain, 0..1. */
export function loudness(speed: number, l: Loudness): number {
  if (!Number.isFinite(speed) || speed <= l.silentBelow) return 0;
  const x = Math.min(1, (speed - l.silentBelow) / (l.fullAt - l.silentBelow));
  return x ** l.curve;
}

/** Cue strike gain for a shot power 0..1. */
export function cueGain(power: number): number {
  const p = Number.isFinite(power) ? Math.min(1, Math.max(0, power)) : 0;
  return SOUND_MIX.cueMin + (SOUND_MIX.cueMax - SOUND_MIX.cueMin) * p;
}

/**
 * Turns the physics events of one frame into sounds to play. A break makes dozens of contacts in a
 * few milliseconds; playing them all is noise and costs a slow phone, so close repeats of the same
 * sound are dropped unless clearly louder, and only a few sounds start per frame (loudest first).
 * Keeps the last step and gain per sound between frames; make a new one for each shot.
 */
export class ShotSoundMixer {
  private readonly last = new Map<PoolSound, { step: number; gain: number }>();

  frame(events: readonly ShotEvent[]): SoundCue[] {
    const cues: SoundCue[] = [];
    for (const e of events) {
      const cue = this.cueFor(e);
      if (!cue || cue.gain <= 0) continue;
      const prev = this.last.get(cue.sound);
      if (prev && e.step - prev.step < SOUND_MIX.minGapSteps && cue.gain < prev.gain * SOUND_MIX.louderBy) continue;
      this.last.set(cue.sound, { step: e.step, gain: cue.gain });
      cues.push(cue);
    }
    return cues.sort((a, b) => b.gain - a.gain).slice(0, SOUND_MIX.maxPerFrame);
  }

  private cueFor(e: ShotEvent): SoundCue | null {
    switch (e.type) {
      case 'ball':
        return { sound: 'ball', gain: loudness(e.speed, SOUND_LOUDNESS.ball) };
      case 'cushion':
        return { sound: 'cushion', gain: loudness(e.speed, SOUND_LOUDNESS.cushion) };
      case 'pocket':
        return { sound: 'pocket', gain: SOUND_MIX.pocket };
      default:
        return null;
    }
  }
}
