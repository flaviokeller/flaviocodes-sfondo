// Batch export: render style x palette x device to out-web/<style>/<palette>-<device>.png.
// Starts its own Vite server and drives headless Chromium on the GPU via the ?bare page.
//
//   npm run export
//   npm run export -- --styles blur,influx --palettes aurora --devices desktop,iphone-16-pro,3440x1440
//
// Devices: "desktop" (5120x2880), "mobile" (1290x2796), any id from src/core/devices.ts, or WxH.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { DEVICES } from '../src/core/devices.ts';
import { PALETTES } from '../src/core/palettes.ts';
import { startBrowser } from './browser.ts';

const { values: args } = parseArgs({
  options: {
    styles: { type: 'string' },
    palettes: { type: 'string' },
    devices: { type: 'string', default: 'desktop,mobile' },
    out: { type: 'string', default: fileURLToPath(new URL('../out-web', import.meta.url)) },
    jobs: { type: 'string', default: '3' },
  },
});
const list = (s?: string) => s?.split(',').map((x) => x.trim()).filter(Boolean);

const PRESETS: Record<string, [number, number]> = { desktop: [5120, 2880], mobile: [1290, 2796] };
function device(name: string): [number, number] {
  if (PRESETS[name]) return PRESETS[name];
  const d = DEVICES.find((d) => d.id === name);
  if (d) return [d.w, d.h];
  const m = /^(\d+)x(\d+)$/.exec(name);
  if (m) return [Number(m[1]), Number(m[2])];
  throw new Error(`unknown device "${name}" (use desktop, mobile, a device id or WxH)`);
}

const styles = list(args.styles) ?? Object.keys(PALETTES);
for (const s of styles) if (!PALETTES[s]) throw new Error(`unknown style "${s}"`);
const jobs = styles.flatMap((style) =>
  Object.keys(PALETTES[style])
    .filter((p) => !args.palettes || list(args.palettes)!.includes(p))
    .flatMap((palette) => list(args.devices)!.map((dev) => ({ style, palette, dev, size: device(dev) }))),
);
if (!jobs.length) throw new Error('nothing to export (check --styles / --palettes)');

const { base, browser, close } = await startBrowser();

const t0 = Date.now();
let done = 0, failed = 0;
async function run(job: (typeof jobs)[number]) {
  const [w, h] = job.size;
  const start = Date.now();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(`${base}?bare&style=${job.style}&palette=${job.palette}&w=${w}&h=${h}`);
    await page.waitForSelector('body[data-ready], #stage .error', { timeout: 120_000 });
    // non-waiting query: a locator would auto-wait 30s for an error that usually never appears
    const err = await page.evaluate(() => document.querySelector('#stage .error')?.textContent ?? null);
    if (err || errors.length) throw new Error(err ?? errors.join('; '));
    const png = await page.evaluate(() => document.querySelector('canvas')!.toDataURL('image/png'));
    const file = `${args.out}/${job.style}/${job.palette}-${job.dev}.png`;
    await mkdir(`${args.out}/${job.style}`, { recursive: true });
    await writeFile(file, Buffer.from(png.slice(png.indexOf(',') + 1), 'base64'));
    console.log(`[${++done}/${jobs.length}] ${file.replace(`${args.out}/`, '')} ${w}x${h} ${((Date.now() - start) / 1000).toFixed(1)}s`);
  } catch (e) {
    failed++;
    console.error(`FAILED ${job.style}/${job.palette}-${job.dev}: ${e instanceof Error ? e.message : e}`);
  } finally {
    await page.close();
  }
}

const queue = [...jobs];
await Promise.all(
  Array.from({ length: Math.max(1, Number(args.jobs)) }, async () => {
    while (queue.length) await run(queue.shift()!);
  }),
);
await close();
console.log(`${done} written, ${failed} failed in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${args.out}`);
if (failed) process.exit(1);
