import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ART_FILES } from '../src/config/art';
import { ART_FILE_URLS } from '../src/scenes/art/artFiles';
import { pictureSize } from './pictureSize';

const dir = path.join(__dirname, '../art');
const file = (name: string) => path.join(dir, name);

describe("Robert's art pictures", () => {
  it('bundles the logo and menu background for the game, and not the icon', () => {
    expect(Object.keys(ART_FILE_URLS).sort()).toEqual([...ART_FILES.inGame].sort());
  });

  it('keeps the logo a transparent PNG, the background 16:9 and the icon square', () => {
    const logo = readFileSync(file('logo.png'));
    // PNG colour type 6: RGBA.
    expect(logo.readUInt8(25)).toBe(6);
    const [bw, bh] = pictureSize(readFileSync(file('menu-background.jpg')));
    expect(bw / bh).toBeCloseTo(16 / 9, 1);
    const [iw, ih] = pictureSize(readFileSync(file('icon.jpg')));
    expect(iw).toBe(ih);
    expect(iw).toBeGreaterThanOrEqual(1024);
  });

  it('keeps the pictures in the game light', () => {
    for (const name of ['logo.png', 'menu-background.jpg']) expect(statSync(file(name)).size, name).toBeLessThanOrEqual(ART_FILES.maxBytes);
  });
});
