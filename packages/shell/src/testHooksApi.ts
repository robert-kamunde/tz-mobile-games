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
}

declare global {
  interface Window {
    __tzg?: TestHooks;
  }
}
