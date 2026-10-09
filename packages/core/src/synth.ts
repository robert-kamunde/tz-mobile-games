import { createRandom } from './random';

/**
 * Tiny sound synthesiser for placeholder sound effects: a sum of decaying tones and filtered noise
 * bursts, rendered once into samples. Deterministic (seeded noise), so a sound is identical on every
 * device and in tests. Placeholders only, until recorded sounds exist (docs/ASSETS.md).
 */
export interface ToneLayer {
  readonly kind: 'tone';
  /** Start and end frequency, Hz (a linear sweep; equal for a steady pitch). */
  readonly startHz: number;
  readonly endHz: number;
  /** Time for the level to fall to 1/e, seconds. */
  readonly decay: number;
  readonly level: number;
}

export interface NoiseLayer {
  readonly kind: 'noise';
  /** One-pole low-pass cut-off, Hz. */
  readonly cutoffHz: number;
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
    if (layer.kind === 'tone') {
      let phase = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const hz = layer.startHz + ((layer.endHz - layer.startHz) * i) / length;
        phase += (2 * Math.PI * hz) / sampleRate;
        out[i]! += layer.level * Math.exp(-t / layer.decay) * Math.sin(phase);
      }
    } else {
      const a = 1 - Math.exp((-2 * Math.PI * layer.cutoffHz) / sampleRate);
      let filtered = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        filtered += a * (random.next() * 2 - 1 - filtered);
        out[i]! += layer.level * Math.exp(-t / layer.decay) * filtered;
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
