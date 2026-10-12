import type * as Phaser from 'phaser';
import { portraitFileKey } from './portraitArt';

/**
 * The character face pictures in packages/pool/portraits, one per character named `<id>.png` or
 * `<id>.jpg` (config/art.ts PORTRAIT_FILES). Vite bundles whatever files are there, so swapping a
 * picture and rebuilding changes the face with no code change; the app carries them, so they work
 * offline.
 */
const FILES = import.meta.glob('../../../portraits/*.{png,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** Picture URL by character id. */
export const PORTRAIT_FILE_URLS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(FILES).map(([file, url]) => [file.slice(file.lastIndexOf('/') + 1, file.lastIndexOf('.')), url]),
);

/**
 * Queues every picture not loaded yet; call from a scene's preload. A picture that fails to load is
 * skipped and that character keeps the drawn face.
 */
export function loadPortraitFiles(scene: Phaser.Scene): void {
  for (const [id, url] of Object.entries(PORTRAIT_FILE_URLS)) {
    const key = portraitFileKey(id);
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  }
}
