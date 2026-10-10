/** One-time help already shown to the player, so it is not shown again (`pool.tips`). */
export interface PoolTips {
  /** The "how to play" panel on the first game. */
  readonly howToPlaySeen: boolean;
}

export const TIPS_VERSION = 1;

export function defaultTips(): PoolTips {
  return { howToPlaySeen: false };
}

export function validateTips(raw: unknown): PoolTips | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const seen = (raw as Record<string, unknown>).howToPlaySeen;
  return typeof seen === 'boolean' ? { howToPlaySeen: seen } : null;
}
