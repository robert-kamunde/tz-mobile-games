// Opens the game's store art (src/scenes/art/storeArt.ts) in a headless browser, for the scripts that
// save pictures: makeAppIcons.mjs and portraits.mjs. The page has it as window.StoreArt.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { build } from 'vite';

export const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const portraitsDir = path.join(root, 'portraits');

const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

/** The face picture files: [{ id, file, type }]. */
export function portraitFiles() {
  return readdirSync(portraitsDir)
    .filter((name) => TYPES[path.extname(name).toLowerCase()])
    .map((name) => ({ id: path.basename(name, path.extname(name)), file: path.join(portraitsDir, name), type: TYPES[path.extname(name).toLowerCase()] }));
}

export const artDir = path.join(root, 'art');

/** Robert's pictures in art/ (logo, menu-background, icon): [{ id, file, type }]. */
export function artFiles() {
  return readdirSync(artDir)
    .filter((name) => TYPES[path.extname(name).toLowerCase()])
    .map((name) => ({ id: path.basename(name, path.extname(name)), file: path.join(artDir, name), type: TYPES[path.extname(name).toLowerCase()] }));
}

/** A file as a data URL. */
export function dataUrl(file, type) {
  return `data:${type};base64,${readFileSync(file).toString('base64')}`;
}

export async function openStoreArt() {
  const bundle = await build({
    configFile: false,
    logLevel: 'warn',
    build: {
      write: false,
      minify: false,
      lib: { entry: path.join(root, 'src/scenes/art/storeArt.ts'), formats: ['iife'], name: 'StoreArt', fileName: 'storeArt' },
    },
  });
  const code = (Array.isArray(bundle) ? bundle[0] : bundle).output[0].code;
  const browser = await chromium.launch();
  const tab = await browser.newPage();
  await tab.setContent('<html><body></body></html>');
  await tab.addScriptTag({ content: code });
  return { tab, close: () => browser.close() };
}
