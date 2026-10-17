import * as Phaser from 'phaser';
import { MENU_BACKDROP } from '../config/layout';
import { ART_FILE_URLS, artPicture } from './art/artFiles';
import { MENU_PICTURE_KEY } from './art/menuArt';

/**
 * A picture on the page behind the see-through game canvas, scaled to cover the whole screen, so the
 * menu fills phones wider than 16:9 (the game itself scales to fit and leaves strips at the sides).
 * Dims drawn on the canvas cannot reach those strips, so `addPageDim` darkens them to match.
 */
const ELEMENT_ID = 'page-backdrop';
const STRIPS_ID = 'page-backdrop-dim';
const made = new Map<string, string>();
const dims: { color: number; alpha: number }[] = [];
let canvas: HTMLCanvasElement | null = null;

/** A URL for texture `key`: the picture file itself, or a JPEG of a drawn texture (made once). */
function pictureOf(scene: Phaser.Scene, key: string): string | null {
  const cached = made.get(key);
  if (cached) return cached;
  // Robert's picture file as it is (sharpest; the loaded image's own src is a blob URL already let
  // go); a drawn texture as a JPEG of its canvas.
  let url: string | null = null;
  const file = ART_FILE_URLS['menu-background'];
  if (key === MENU_PICTURE_KEY && file && artPicture(scene, 'menu-background')) url = new URL(file, document.baseURI).href;
  else {
    const source = scene.textures.get(key).getSourceImage();
    if (source instanceof HTMLCanvasElement) url = source.toDataURL('image/jpeg', MENU_BACKDROP.jpegQuality);
  }
  if (url) made.set(key, url);
  return url;
}

function element(id: string, style: Partial<CSSStyleDeclaration>): HTMLElement {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, { position: 'fixed', pointerEvents: 'none', ...style });
    document.body.prepend(el);
  }
  return el;
}

/** The strip dim: a box over the canvas, see-through inside, whose shadow covers everything around it. */
function placeStripDim(): void {
  const el = document.getElementById(STRIPS_ID);
  if (!el || !canvas) return;
  const r = canvas.getBoundingClientRect();
  Object.assign(el.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  const keep = dims.reduce((k, d) => k * (1 - d.alpha), 1);
  const top = dims[dims.length - 1];
  const color = Phaser.Display.Color.IntegerToColor(top?.color ?? 0);
  el.style.boxShadow = `0 0 0 100vmax rgba(${color.red}, ${color.green}, ${color.blue}, ${1 - keep})`;
}

/**
 * Shows texture `key` behind the game, covering the screen; until the scene shuts down unless `keep`
 * (the splash hands it straight on to the menu, so it does not blink off between them).
 */
export function showPageBackdrop(scene: Phaser.Scene, key: string, keep = false): void {
  const url = pictureOf(scene, key);
  if (!url) return;
  canvas = scene.game.canvas;
  // Under the game: the game's own element is lifted above it (the page background stays under both).
  const holder = canvas.parentElement;
  if (holder) Object.assign(holder.style, { position: 'relative', zIndex: '2' });
  const el = element(ELEMENT_ID, { inset: '0', zIndex: '0', backgroundSize: 'cover', backgroundPosition: 'center' });
  el.style.backgroundImage = `url("${url}")`;
  el.style.display = 'block';
  // A new scene starts with no dims (one left by a scene that ended with a panel open is gone with it).
  dims.length = 0;
  const strips = element(STRIPS_ID, { zIndex: '1', transition: `box-shadow ${MENU_BACKDROP.dimMs}ms` });
  strips.style.display = 'block';
  placeStripDim();
  scene.scale.on(Phaser.Scale.Events.RESIZE, placeStripDim);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, placeStripDim);
    if (!keep) hidePageBackdrop();
  });
}

export function hidePageBackdrop(): void {
  for (const id of [ELEMENT_ID, STRIPS_ID]) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }
  dims.length = 0;
  placeStripDim();
}

/** Darkens the strips beside the game like a dim drawn on the canvas; returns a function that ends it. */
export function addPageDim(color: number, alpha: number): () => void {
  const dim = { color, alpha };
  dims.push(dim);
  placeStripDim();
  return () => {
    const i = dims.indexOf(dim);
    if (i < 0) return;
    dims.splice(i, 1);
    placeStripDim();
  };
}

/** Changes a dim's strength (the splash fades its dim out). */
export function setPageDim(alpha: number): void {
  const top = dims[dims.length - 1];
  if (top) top.alpha = alpha;
  placeStripDim();
}
