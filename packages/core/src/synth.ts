import { createRandom } from './random';

/**
 * Tiny sound synthesiser for sound effects: a sum of decaying tones and filtered noise bursts,
 * rendered once into samples. Deterministic (seeded noise), so a sound is identical on every device
 * and in tests. Every layer can start late (`delay`) and fade in (`attack`), so one recipe can hold a
 * short sequence, such as a knock, a roll and a click.
 */
interface LayerTiming {
  /** When the layer starts, seconds from the start of the sound. Default 0. */
  readonly delay?: number;
  /** Fade-in time, seconds; a hard start sounds like a click. Default 0. */
  readonly attack?: number;
}

export interface ToneLayer extends LayerTiming {
  readonly kind: 'tone';
  /** Start and end frequency, Hz (a linear sweep; equal for a steady pitch). */
  readonly startHz: number;
  readonly endHz: number;
  /** Time for the level to fall to 1/e, seconds. */
  readonly decay: number;
  readonly level: number;
}

export interface NoiseLayer extends LayerTiming {
  readonly kind: 'noise';
  /** One-pole low-pass cut-off, Hz. */
  readonly cutoffHz: number;
  /** Optional one-pole high-pass cut-off, Hz: removes the low rumble, for a crisper burst. */
  readonly highHz?: number;
  /** Optional wobble in loudness, Hz: a rolling ball's rattle. */
  readonly tremoloHz?: number;
  readonly decay: number;
  readonly level: number;
}

export interface SoundRecipe {
  readonly seconds: number;
  /** Loudest sample after normalising, 0..1 (headroom so overlapping sounds do not clip much). */
  readonly peak: number;
  readonly layers: readonly (ToneLayer | NoiseLayer)[];
}

/** Short fade at the end so a sound never stops with a click. */
const FADE_OUT_SECONDS = 0.005;

export function renderSound(recipe: SoundRecipe, sampleRate: number, seed: number): Float32Array {
  if (!(sampleRate > 0) || !(recipe.seconds > 0)) throw new Error('renderSound needs a positive sample rate and length');
  const length = Math.max(1, Math.round(recipe.seconds * sampleRate));
  const out = new Float32Array(length);
  const random = createRandom(seed);
  for (const layer of recipe.layers) {
    const start = Math.round((layer.delay ?? 0) * sampleRate);
    const attack = (layer.attack ?? 0) * sampleRate;
    const envelope = (i: number, decay: number) => {
      const t = i / sampleRate;
      return Math.exp(-t / decay) * (attack > 0 && i < attack ? i / attack : 1);
    };
    if (layer.kind === 'tone') {
      let phase = 0;
      for (let i = 0; i + start < length; i++) {
        const hz = layer.startHz + ((layer.endHz - layer.startHz) * i) / length;
        phase += (2 * Math.PI * hz) / sampleRate;
        out[i + start]! += layer.level * envelope(i, layer.decay) * Math.sin(phase);
      }
    } else {
      const a = 1 - Math.exp((-2 * Math.PI * layer.cutoffHz) / sampleRate);
      const h = layer.highHz ? Math.exp((-2 * Math.PI * layer.highHz) / sampleRate) : 0;
      let filtered = 0;
      let lowPrev = 0;
      let high = 0;
      for (let i = 0; i + start < length; i++) {
        filtered += a * (random.next() * 2 - 1 - filtered);
        let v = filtered;
        if (layer.highHz) {
          high = h * (high + filtered - lowPrev);
          lowPrev = filtered;
          v = high;
        }
        const wobble = layer.tremoloHz ? 0.5 + 0.5 * Math.sin((2 * Math.PI * layer.tremoloHz * i) / sampleRate) : 1;
        out[i + start]! += layer.level * envelope(i, layer.decay) * wobble * v;
      }
    }
  }
  let max = 0;
  for (let i = 0; i < length; i++) max = Math.max(max, Math.abs(out[i]!));
  const fade = Math.max(1, Math.round(FADE_OUT_SECONDS * sampleRate));
  const scale = max > 0 ? recipe.peak / max : 0;
  for (let i = 0; i < length; i++) {
    const tail = length - 1 - i;
    out[i]! *= scale * (tail < fade ? tail / fade : 1);
  }
  return out;
}
