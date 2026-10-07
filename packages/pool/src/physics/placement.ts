import type { PoolSimulation } from './simulation';

/**
 * Puts the cue ball back on the table at the first free spot, starting from the preferred point and
 * stepping along the table's length, then across it. Returns false only if no spot is free
 * (practically impossible with 16 balls).
 *
 * Milestone 1 practice behaviour. Milestone 2 replaces it with ball in hand chosen by the player.
 */
export function respawnCueBall(sim: PoolSimulation, preferredX: number, preferredY: number, stepSize: number): boolean {
  if (!(stepSize > 0)) throw new Error(`stepSize must be > 0, got ${stepSize}`);
  const { length, width } = sim.table;
  const columns = Math.ceil(length / stepSize);
  const rows = Math.ceil(width / stepSize);
  for (let row = 0; row <= rows; row++) {
    // Try the preferred line first, then alternate either side of it.
    const offset = (row % 2 === 0 ? 1 : -1) * Math.ceil(row / 2) * stepSize;
    const y = preferredY + offset;
    for (let col = 0; col <= columns; col++) {
      const x = preferredX + col * stepSize;
      const wrapped = x > length ? x - length : x;
      if (sim.placeCueBall(wrapped, y) === 'ok') return true;
    }
  }
  return false;
}
