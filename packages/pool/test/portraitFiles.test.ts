import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AI_LEVEL_IDS } from '../src/config/ai';
import { PORTRAIT_FILES } from '../src/config/art';
import { COMPUTER_CHARACTERS, PLAYER_CHARACTERS } from '../src/config/characters';
import { PORTRAIT_FILE_URLS } from '../src/scenes/art/portraitFiles';

const dir = path.join(__dirname, '../portraits');
const ids = [...PLAYER_CHARACTERS, ...AI_LEVEL_IDS.map((level) => COMPUTER_CHARACTERS[level])].map((c) => c.id).sort();
const pictures = readdirSync(dir).filter((name) => /\.(png|jpe?g)$/i.test(name));

/** Width and height from a PNG or JPEG header. */
function pictureSize(bytes: Buffer): [number, number] {
  if (bytes.readUInt32BE(0) === 0x89504e47) return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  // JPEG: walk the segments to the frame header (SOF0-SOF15, but not DHT, JPG or DAC).
  let at = 2;
  while (at < bytes.length) {
    const marker = bytes.readUInt8(at + 1);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return [bytes.readUInt16BE(at + 7), bytes.readUInt16BE(at + 5)];
    }
    at += 2 + bytes.readUInt16BE(at + 2);
  }
  throw new Error('not a PNG or JPEG');
}

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
