/**
 * Small seeded random number generator (mulberry32). Same seed, same sequence, on every device.
 * Used where a game needs randomness that tests can repeat, such as AI aiming error.
 */
export interface Random {
  /** Uniform in [0, 1). */
  next(): number;
  /** Roughly standard normal (mean 0, standard deviation 1), from the sum of uniforms. */
  normal(): number;
}

/** Uniform draws summed for normal(); 12 gives variance 1 without scaling. */
const NORMAL_TERMS = 12;

export function createRandom(seed: number): Random {
  if (!Number.isFinite(seed)) throw new Error(`invalid seed ${seed}`);
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = (): number => {
    let sum = 0;
    for (let i = 0; i < NORMAL_TERMS; i++) sum += next();
    return sum - NORMAL_TERMS / 2;
  };
  return { next, normal };
}
