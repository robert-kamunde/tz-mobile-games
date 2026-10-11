// Draws the app icon, splash screens and store graphics (Part C) at every size Android and Google
// Play need, into the Android project and store/. The drawing is the game's own art
// (src/scenes/art/storeArt.ts), bundled here and run in a headless browser.
// Run with `npm run icons -w @tzg/pool`.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { build } from 'vite';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const res = path.join(root, 'android/app/src/main/res');
const store = path.join(root, 'store');

// Launcher icon sizes in pixels per screen density: legacy icon (48 dp) and adaptive foreground (108 dp).
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
// Splash images per density (landscape; portrait is the same size turned).
const SPLASH = { mdpi: [480, 320], hdpi: [800, 480], xhdpi: [1280, 720], xxhdpi: [1600, 960], xxxhdpi: [1920, 1280] };

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

async function render(kind, w, h, file) {
  const url = await tab.evaluate(([k, ww, hh]) => window.StoreArt.render(k, ww, hh), [kind, w, h]);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
}

for (const [density, k] of Object.entries(DENSITIES)) {
  const legacy = Math.round(48 * k);
  const fg = Math.round(108 * k);
  const dir = path.join(res, `mipmap-${density}`);
  await render('icon', legacy, legacy, path.join(dir, 'ic_launcher.png'));
  await render('round', legacy, legacy, path.join(dir, 'ic_launcher_round.png'));
  // Adaptive foreground: the launcher crops to the middle 66 of 108 dp, so the balls stay inside that.
  await render('foreground', fg, fg, path.join(dir, 'ic_launcher_foreground.png'));
  const [w, h] = SPLASH[density];
  await render('splash', w, h, path.join(res, `drawable-land-${density}`, 'splash.png'));
  await render('splash', h, w, path.join(res, `drawable-port-${density}`, 'splash.png'));
}
await render('splash', 480, 320, path.join(res, 'drawable', 'splash.png'));
await render('icon', 512, 512, path.join(store, 'icon-512.png'));
await render('feature', 1024, 500, path.join(store, 'feature-graphic-1024x500.png'));
await browser.close();
console.log('icons, splash screens and store graphics written');
