import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import capacitorConfig from '../capacitor.config';
import { COLORS } from '../src/config/layout';
import { defaultTips, validateTips } from '../src/progress/tips';

const root = path.resolve(__dirname, '..');
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');
const res = 'android/app/src/main/res';

/** Width and height from a PNG file's header. */
function pngSize(file: string): [number, number] {
  const b = readFileSync(path.join(root, file));
  expect(b.subarray(1, 4).toString('ascii'), file).toBe('PNG');
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

describe('Android project', () => {
  const gradle = read('android/app/build.gradle');
  const appId = capacitorConfig.appId!;

  it('uses one app id everywhere', () => {
    expect(appId).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
    expect(gradle).toContain(`applicationId "${appId}"`);
    expect(gradle).toContain(`namespace = "${appId}"`);
    expect(read(`${res}/values/strings.xml`)).toContain(`<string name="package_name">${appId}</string>`);
    const activity = read(`android/app/src/main/java/${appId.split('.').join('/')}/MainActivity.java`);
    expect(activity).toContain(`package ${appId};`);
  });

  it('takes its version from package.json, in a form that gives a growing version code', () => {
    const version = (JSON.parse(read('package.json')) as { version: string }).version;
    expect(version).toMatch(/^\d+\.\d{1,2}\.\d{1,2}$/);
    expect(gradle).toContain("parse(file('../../package.json'))");
    expect(gradle).toContain('versionName gamePackage.version');
  });

  it('is landscape only, with the game name', () => {
    expect(read('android/app/src/main/AndroidManifest.xml')).toContain('android:screenOrientation="sensorLandscape"');
    expect(capacitorConfig.appName).toBe('Bongo Pool Table');
    expect(read('scripts/makeAppIcons.mjs')).toContain("const GAME_NAME = 'Bongo Pool Table';");
    expect(read(`${res}/values/strings.xml`)).toContain('<string name="app_name">Bongo Pool Table</string>');
  });

  it('has an icon and a splash screen at every screen density', () => {
    const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
    for (const [d, k] of Object.entries(densities)) {
      expect(pngSize(`${res}/mipmap-${d}/ic_launcher.png`)).toEqual([48 * k, 48 * k]);
      expect(pngSize(`${res}/mipmap-${d}/ic_launcher_round.png`)).toEqual([48 * k, 48 * k]);
      expect(pngSize(`${res}/mipmap-${d}/ic_launcher_foreground.png`)).toEqual([108 * k, 108 * k]);
      const [w, h] = pngSize(`${res}/drawable-land-${d}/splash.png`);
      expect(w).toBeGreaterThan(h);
      expect(pngSize(`${res}/drawable-port-${d}/splash.png`)).toEqual([h, w]);
    }
    expect(pngSize('store/icon-512.png')).toEqual([512, 512]);
  });

  it('opens on the game background colour, with the icon on Android 12 and newer', () => {
    // Android 12+ ignores the splash image: the theme's background and icon are what players see.
    const launch = read(`${res}/values/styles.xml`).split('name="AppTheme.NoActionBarLaunch"')[1]!.split('</style>')[0]!;
    expect(launch).toContain('<item name="windowSplashScreenBackground">@color/splash_background</item>');
    expect(launch).toContain('<item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher</item>');
    expect(read(`${res}/values/splash.xml`)).toContain(`<color name="splash_background">${COLORS.background}</color>`);
    expect(capacitorConfig.backgroundColor).toBe(COLORS.background);
    expect(read('scripts/makeAppIcons.mjs')).toContain(`const DARK = '${COLORS.background}';`);
    expect(pngSize('store/feature-graphic-1024x500.png')).toEqual([1024, 500]);
  });
});

describe('one-time tips save', () => {
  it('starts unseen and keeps only a true or false flag', () => {
    expect(defaultTips()).toEqual({ howToPlaySeen: false });
    expect(validateTips({ howToPlaySeen: true })).toEqual({ howToPlaySeen: true });
    expect(validateTips({ howToPlaySeen: true, extra: 1 })).toEqual({ howToPlaySeen: true });
    for (const bad of [null, 'yes', {}, { howToPlaySeen: 'true' }, { howToPlaySeen: 1 }]) expect(validateTips(bad)).toBeNull();
  });
});
