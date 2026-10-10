// Draws the PLACEHOLDER app icon, splash screens and store graphics, at every size Android and
// Google Play need, into the Android project and store/. Run with `npm run icons -w @tzg/pool`.
// Real art replaces this script's drawings (docs/ASSETS.md); the sizes below stay the same.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const res = path.join(root, 'android/app/src/main/res');
const store = path.join(root, 'store');

/** Must match `appName` in capacitor.config.ts (checked by test/android.test.ts). */
const GAME_NAME = 'Bongo Pool Table';
const FELT = '#1d5c3a';
const DARK = '#101418';
const ACCENT = '#f2c94c';

// Launcher icon sizes in pixels per screen density: legacy icon (48 dp) and adaptive foreground (108 dp).
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
// Splash images per density (landscape; portrait is the same size turned).
const SPLASH = { mdpi: [480, 320], hdpi: [800, 480], xhdpi: [1280, 720], xxhdpi: [1600, 960], xxxhdpi: [1920, 1280] };

/** Three balls (red, black, yellow) filling `scale` of a square of side `size`. */
function balls(size, scale) {
  const r = (size * scale) / 4.4;
  const ball = (cx, cy, rr, color, spot) =>
    `<div style="position:absolute;left:${cx - rr}px;top:${cy - rr}px;width:${2 * rr}px;height:${2 * rr}px;border-radius:50%;
      background:radial-gradient(circle at 35% 30%, rgba(255,255,255,.45), ${color} 45%, rgba(0,0,0,.6) 100%), ${color};">
      ${spot ? `<div style="position:absolute;left:${rr * 0.55}px;top:${rr * 0.55}px;width:${rr * 0.9}px;height:${rr * 0.9}px;border-radius:50%;background:#fff;"></div>` : ''}
    </div>`;
  const c = size / 2;
  return ball(c - 1.25 * r, c + 0.55 * r, 0.75 * r, '#c62828') + ball(c + 1.25 * r, c + 0.55 * r, 0.75 * r, '#f9a825') + ball(c, c - 0.25 * r, r, '#111', true);
}

const page = (body, w, h, bg) =>
  `<html><body style="margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${bg};position:relative;font-family:system-ui,sans-serif">${body}</body></html>`;

function icon(size, shape) {
  const radius = shape === 'round' ? '50%' : `${size * 0.18}px`;
  return page(`<div style="position:absolute;inset:0;border-radius:${radius};background:${FELT};overflow:hidden">${balls(size, 0.9)}</div>`, size, size, 'transparent');
}

function splash(w, h) {
  const s = Math.min(w, h);
  const iconSize = s * 0.42;
  return page(
    `<div style="position:absolute;left:${(w - iconSize) / 2}px;top:${h * 0.5 - iconSize * 0.75}px;width:${iconSize}px;height:${iconSize}px;border-radius:${iconSize * 0.18}px;background:${FELT};overflow:hidden">${balls(iconSize, 0.9)}</div>
     <div style="position:absolute;left:0;right:0;top:${h * 0.5 + iconSize * 0.4}px;text-align:center;color:${ACCENT};font-size:${s * 0.09}px;font-weight:600">${GAME_NAME}</div>
     <div style="position:absolute;right:${s * 0.03}px;bottom:${s * 0.02}px;color:#8a949e;font-size:${s * 0.035}px">PLACEHOLDER</div>`,
    w,
    h,
    DARK,
  );
}

function featureGraphic(w, h) {
  const box = h * 0.64;
  const textLeft = h * 0.18 + box + h * 0.12;
  return page(
    `<div style="position:absolute;left:${h * 0.18}px;top:${(h - box) / 2}px;width:${box}px;height:${box}px;border-radius:${box * 0.18}px;background:${FELT};overflow:hidden">${balls(box, 0.9)}</div>
     <div style="position:absolute;left:${textLeft}px;top:${h * 0.34}px;white-space:nowrap;color:${ACCENT};font-size:${h * 0.11}px;font-weight:700">${GAME_NAME}</div>
     <div style="position:absolute;left:${textLeft}px;top:${h * 0.54}px;white-space:nowrap;color:#e8edf2;font-size:${h * 0.065}px">Pool ya bar, mfukoni mwako</div>
     <div style="position:absolute;right:${h * 0.04}px;bottom:${h * 0.03}px;color:#8a949e;font-size:${h * 0.05}px">PLACEHOLDER</div>`,
    w,
    h,
    DARK,
  );
}

const browser = await chromium.launch();
const tab = await browser.newPage();
async function render(html, w, h, file) {
  mkdirSync(path.dirname(file), { recursive: true });
  await tab.setViewportSize({ width: w, height: h });
  await tab.setContent(html);
  await tab.screenshot({ path: file, omitBackground: true });
}

for (const [density, k] of Object.entries(DENSITIES)) {
  const legacy = Math.round(48 * k);
  const fg = Math.round(108 * k);
  const dir = path.join(res, `mipmap-${density}`);
  await render(icon(legacy, 'square'), legacy, legacy, path.join(dir, 'ic_launcher.png'));
  await render(icon(legacy, 'round'), legacy, legacy, path.join(dir, 'ic_launcher_round.png'));
  // Adaptive foreground: the launcher crops to the middle 66 of 108 dp, so the balls stay inside that.
  await render(page(balls(fg, 0.55), fg, fg, 'transparent'), fg, fg, path.join(dir, 'ic_launcher_foreground.png'));
  const [w, h] = SPLASH[density];
  await render(splash(w, h), w, h, path.join(res, `drawable-land-${density}`, 'splash.png'));
  await render(splash(h, w), h, w, path.join(res, `drawable-port-${density}`, 'splash.png'));
}
await render(splash(480, 320), 480, 320, path.join(res, 'drawable', 'splash.png'));
await render(icon(512, 'square'), 512, 512, path.join(store, 'icon-512.png'));
await render(featureGraphic(1024, 500), 1024, 500, path.join(store, 'feature-graphic-1024x500.png'));
await browser.close();
console.log('icons, splash screens and store graphics written');
