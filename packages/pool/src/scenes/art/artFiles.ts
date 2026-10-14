import type * as Phaser from 'phaser';

/**
 * The logo and menu background pictures in packages/pool/art (config/art.ts ART_FILES). Vite bundles
 * whatever files are there, so swapping a picture and rebuilding changes it with no code change; the
 * app carries them, so they work offline. The icon picture there is only for `npm run icons`.
 */
const FILES = import.meta.glob('../../../art/{logo,menu-background}.{png,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export type ArtFileId = 'logo' | 'menu-background';

/** Picture URL by id. */
export const ART_FILE_URLS: Readonly<Partial<Record<ArtFileId, string>>> = Object.fromEntries(
  Object.entries(FILES).map(([file, url]) => [file.slice(file.lastIndexOf('/') + 1, file.lastIndexOf('.')), url]),
);

export function artFileKey(id: ArtFileId): string {
  return `art-file-${id}`;
}

/** The loaded picture, or null (not there, or it failed to load: the drawn art is used). */
export function artPicture(scene: Phaser.Scene, id: ArtFileId): CanvasImageSource | null {
  const key = artFileKey(id);
  return scene.textures.exists(key) ? (scene.textures.get(key).getSourceImage() as CanvasImageSource) : null;
}

/** Queues the pictures not loaded yet; call from a scene's preload. */
export function loadArtFiles(scene: Phaser.Scene): void {
  for (const [id, url] of Object.entries(ART_FILE_URLS) as [ArtFileId, string][]) {
    const key = artFileKey(id);
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  }
}
