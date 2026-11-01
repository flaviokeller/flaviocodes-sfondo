// Contact sheets for orientation: previews/<style>.jpg, desktop thumbnails on top, mobile below.
// Low-res on purpose; they are committed, so keep them small.
//
//   npm run previews
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PALETTES } from '../src/core/palettes.ts';
import { startBrowser } from './browser.ts';

const out = fileURLToPath(new URL('../previews', import.meta.url));
const { base, browser, close } = await startBrowser();
const page = await browser.newPage();
await page.goto(base);
await mkdir(out, { recursive: true });

for (const style of Object.keys(PALETTES)) {
  // runs in the page, importing the app's own modules from the Vite server
  const jpeg = await page.evaluate(async (style) => {
    const load = (path: string) => import(/* @vite-ignore */ path);
    const { renderCanvas } = await load('/src/render.ts');
    const { STYLES } = await load('/src/styles/index.ts');
    const { PALETTES } = await load('/src/core/palettes.ts');
    const TH = 360, PAD = 24, desk = [640, TH], mob = [Math.round((TH * 1290) / 2796), TH];
    const names = Object.keys(PALETTES[style]);
    const sheet = document.createElement('canvas');
    sheet.width = PAD + names.length * (desk[0] + PAD);
    sheet.height = PAD + 2 * (TH + PAD);
    const ctx = sheet.getContext('2d')!;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, sheet.width, sheet.height);
    for (const [i, name] of names.entries()) {
      const x = PAD + i * (desk[0] + PAD);
      ctx.drawImage(await renderCanvas(STYLES[style], PALETTES[style][name], desk[0], desk[1]), x, PAD);
      const m = await renderCanvas(STYLES[style], PALETTES[style][name], mob[0], mob[1]);
      ctx.drawImage(m, x + (desk[0] - mob[0]) / 2, 2 * PAD + TH);
    }
    return sheet.toDataURL('image/jpeg', 0.88);
  }, style);
  await writeFile(`${out}/${style}.jpg`, Buffer.from(jpeg.slice(jpeg.indexOf(',') + 1), 'base64'));
  console.log(`previews/${style}.jpg`);
}
await close();
