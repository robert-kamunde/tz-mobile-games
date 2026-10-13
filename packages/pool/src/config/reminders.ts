/**
 * Play reminders (Robert chose "Build now", 2026-10-13): one phone notification at a time, set when
 * the game goes to the background and removed when it comes back. Kept gentle so players do not
 * turn them off or uninstall.
 */
export const REMINDERS = {
  /** Only after the player has been away at least this long. */
  awayHours: 24,
  /** And at least this long after the last reminder shown. */
  gapHours: 48,
  /** Shown at this local hour (evening, when people play pool), never at night or early morning. */
  hour: 18,
  /** A look counts as close when at most this many more wins open it. */
  closeWins: 1,
} as const;
