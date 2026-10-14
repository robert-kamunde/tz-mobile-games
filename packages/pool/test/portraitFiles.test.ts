import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PORTRAIT_FILES } from '../src/config/art';
import { ALL_CHARACTERS } from '../src/config/characters';
import { PORTRAIT_FILE_URLS } from '../src/scenes/art/portraitFiles';
import { pictureSize } from './pictureSize';

const dir = path.join(__dirname, '../portraits');
const ids = ALL_CHARACTERS.map((c) => c.id).sort();
const pictures = readdirSync(dir).filter((name) => /\.(png|jpe?g)$/i.test(name));

describe('face picture files', () => {
  it('has exactly one picture per character and none for anyone else', () => {
    expect(pictures.map((name) => name.replace(/\.[^.]+$/, '')).sort()).toEqual(ids);
  });

  it('bundles every picture for the game', () => {
    expect(Object.keys(PORTRAIT_FILE_URLS).sort()).toEqual(ids);
  });

  it('keeps every picture square, the agreed size and light (npm run portraits fixes this)', () => {
    for (const name of pictures) {
      const file = path.join(dir, name);
      expect(pictureSize(readFileSync(file)), name).toEqual([PORTRAIT_FILES.size, PORTRAIT_FILES.size]);
      expect(statSync(file).size, name).toBeLessThanOrEqual(PORTRAIT_FILES.maxBytes);
    }
  });
});
