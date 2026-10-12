// Gets the face pictures in portraits/ ready for the game. Run with `npm run portraits -w @tzg/pool`
// after adding or swapping a picture:
// - a character with no picture gets its drawn face saved as <id>.png (the starting set);
// - any picture that is not a square of PORTRAIT_FILES.size pixels, or is too big a file, is cut to
//   its middle square and resized; a photo-like PNG that stays too big is saved as <id>.jpg instead.
// Pictures are only rewritten when they need it, so running it twice changes nothing.
import { readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { dataUrl, openStoreArt, portraitFiles, portraitsDir } from './storeArtPage.mjs';

const { tab, close } = await openStoreArt();
const { ids, rules } = await tab.evaluate(() => ({ ids: window.StoreArt.PORTRAIT_IDS, rules: window.StoreArt.PORTRAIT_FILES }));
const save = (file, url) => writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));

const files = portraitFiles();
for (const { id, file } of files) {
  if (!ids.includes(id)) console.warn(`${path.basename(file)}: no character has the id "${id}", so the game ignores it`);
}
for (const id of ids) {
  const mine = files.filter((f) => f.id === id);
  if (mine.length > 1) {
    console.error(`${id}: ${mine.length} pictures (${mine.map((f) => path.basename(f.file)).join(', ')}); keep one`);
    process.exitCode = 1;
    continue;
  }
  if (mine.length === 0) {
    save(path.join(portraitsDir, `${id}.png`), await tab.evaluate(([i, s]) => window.StoreArt.renderDrawnPortrait(i, s), [id, rules.size]));
    console.log(`${id}.png: drawn face saved`);
    continue;
  }
  const { file, type } = mine[0];
  const bytes = statSync(file).size;
  const fitted = await tab.evaluate(
    async ([url, wantType, r, bytesNow]) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (image.width === r.size && image.height === r.size && bytesNow <= r.maxBytes) return null;
      const canvas = document.createElement('canvas');
      canvas.width = r.size;
      canvas.height = r.size;
      const ctx = canvas.getContext('2d');
      const side = Math.min(image.width, image.height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, r.size, r.size);
      const asIs = canvas.toDataURL(wantType, r.jpegQuality);
      // base64 is 4 characters per 3 bytes.
      if (wantType === 'image/jpeg' || ((asIs.length - asIs.indexOf(',') - 1) * 3) / 4 <= r.maxBytes) return { url: asIs, type: wantType, was: [image.width, image.height] };
      return { url: canvas.toDataURL('image/jpeg', r.jpegQuality), type: 'image/jpeg', was: [image.width, image.height] };
    },
    [dataUrl(file, type), type, rules, bytes],
  );
  if (!fitted) continue;
  const out = fitted.type === type ? file : path.join(portraitsDir, `${id}.jpg`);
  save(out, fitted.url);
  if (out !== file) unlinkSync(file);
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  console.log(`${path.basename(out)}: ${fitted.was.join('x')} ${kb(bytes)} -> ${rules.size}x${rules.size} ${kb(readFileSync(out).length)}`);
}
await close();
