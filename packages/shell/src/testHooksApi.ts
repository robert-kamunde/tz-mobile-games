/*
 * Shared between the game (which installs the hooks) and the Node-side browser tests (which read them).
 * Kept free of imports so the test project can include it without pulling in Phaser.
 */

/**
 * Read-only state for automated browser tests. Only installed in builds made with `--mode e2e`,
 * so release builds expose nothing on window.
 */
export interface TestHooks {
  frames(): number;
  activeScenes(): string[];
  locale(): string;
  paused(): boolean;
  rotatePromptVisible(): boolean;
  /** Center of a named UI element in page (CSS) pixels, so tests can tap it like a player would. */
  elementCenter(sceneKey: string, name: string): { x: number; y: number } | null;
  /**
   * CPU time per frame (game update + render submission) since the last reset, in ms. GPU raster time
   * is not included: the test browser renders in software, so only the CPU side is meaningful there.
   */
  frameCpuStats(): { frames: number; averageMs: number; maxMs: number };
  resetFrameCpuStats(): void;
  /** Converts a point in design pixels (e.g. 1280x720 space) to page (CSS) pixels. */
  designToPage(x: number, y: number): { x: number; y: number };
  /** Calls a game-specific probe registered with registerTestProbe. Throws for an unknown name. */
  probe(name: string, ...args: unknown[]): unknown;
}

declare global {
  interface Window {
    __tzg?: TestHooks;
  }
}
