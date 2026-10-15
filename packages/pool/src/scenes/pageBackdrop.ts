import * as Phaser from 'phaser';
import { MENU_BACKDROP } from '../config/layout';

/**
 * A picture behind the game canvas, filling the strips the 16:9 game leaves on wider phones. The game
 * scales to fit (shell), so nothing Phaser draws can reach those strips; a page element can. The
 * picture is a small blurred copy of a texture, made once per texture and stretched to cover.
 */
const ELEMENT_ID = 'page-backdrop';
const made = new Map<string, string>();

function pictureOf(scene: Phaser.Scene, key: string): string | null {
  const cached = made.get(key);
  if (cached) return cached;
  const source = scene.textures.get(key).getSourceImage() as CanvasImageSource;
  const b = MENU_BACKDROP;
  const canvas = document.createElement('canvas');
  canvas.width = b.width;
  canvas.height = b.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.filter = `blur(${b.blur}px) brightness(${b.brightness})`;
  ctx.drawImage(source, 0, 0, b.width, b.height);
  const url = canvas.toDataURL('image/jpeg', b.jpegQuality);
  made.set(key, url);
  return url;
}

/**
 * Shows texture `key`, blurred, behind the game; until the scene shuts down unless `keep` (the splash
 * hands it straight on to the menu, so it does not blink off between them).
 */
export function showPageBackdrop(scene: Phaser.Scene, key: string, keep = false): void {
  const url = pictureOf(scene, key);
  if (!url) return;
  let el = document.getElementById(ELEMENT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = ELEMENT_ID;
    el.setAttribute('aria-hidden', 'true');
    // Under the game: the game's own element is lifted above it (the page background stays under both).
    Object.assign(el.style, { position: 'fixed', inset: '0', zIndex: '0', backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' });
    document.body.prepend(el);
    const holder = scene.game.canvas.parentElement;
    if (holder) Object.assign(holder.style, { position: 'relative', zIndex: '1' });
  }
  el.style.backgroundImage = `url("${url}")`;
  el.style.display = 'block';
  if (!keep) scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => hidePageBackdrop());
}

export function hidePageBackdrop(): void {
  const el = document.getElementById(ELEMENT_ID);
  if (el) el.style.display = 'none';
}
