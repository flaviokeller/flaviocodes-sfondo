/**
 * Preview page. State lives in the URL: style, palette, device (or device=custom&w=&h=),
 * seed, overlay=1, view=grid. `bare` renders the exact full size with no chrome and sets
 * body[data-ready] when done (used for screenshots/export).
 */
import { DEVICES, isMobile } from './core/devices.ts';
import { PALETTES, type Palette } from './core/palettes.ts';
import { renderCanvas } from './render.ts';
import { STYLES } from './styles/index.ts';
import { lockScreenSvg, SCREEN_RADIUS } from './ui/overlay.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const styleSel = $<HTMLSelectElement>('style');
const paletteSel = $<HTMLSelectElement>('palette');
const deviceSel = $<HTMLSelectElement>('device');
const custom = $<HTMLDivElement>('custom');
const cw = $<HTMLInputElement>('cw');
const ch = $<HTMLInputElement>('ch');
const seedIn = $<HTMLInputElement>('seed');
const overlayIn = $<HTMLInputElement>('overlay');
const downloadBtn = $<HTMLButtonElement>('download');
const stage = $<HTMLDivElement>('stage');
const viewButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-view]')];

const params = new URLSearchParams(location.search);
const bare = params.has('bare');
let view = params.get('view') === 'grid' ? 'grid' : 'single';

const GRID_HEIGHT = 300; // css px per thumbnail row

// ---------- state ----------

const options = (sel: HTMLSelectElement, items: [string, string][], value?: string | null) => {
  sel.replaceChildren(...items.map(([v, label]) => new Option(label, v)));
  if (value && items.some(([v]) => v === value)) sel.value = value;
};

function size(): [number, number] {
  if (deviceSel.value === 'custom') {
    const [w, h] = [Number(cw.value), Number(ch.value)];
    const ok = (v: number) => Number.isInteger(v) && v >= 16 && v <= 16384;
    if (!ok(w) || !ok(h)) throw new Error(`custom size must be whole numbers from 16 to 16384 (got ${cw.value}×${ch.value})`);
    return [w, h];
  }
  const d = DEVICES.find((d) => d.id === deviceSel.value) ?? DEVICES[0];
  return [d.w, d.h];
}

/** The palette with the seed override applied (styles without randomness ignore it). */
function palette(): Palette {
  const pal = PALETTES[styleSel.value][paletteSel.value];
  return seedIn.value === '' ? pal : { ...pal, seed: Number(seedIn.value) };
}

function syncControls() {
  // GL styles always take a seed; SVG styles only when their palettes define one
  const pal = PALETTES[styleSel.value][paletteSel.value];
  const seeded = STYLES[styleSel.value].kind === 'gl' || pal.seed !== undefined;
  seedIn.disabled = !seeded;
  $<HTMLButtonElement>('randomise').disabled = !seeded;
  seedIn.placeholder = seeded ? String(pal.seed ?? 0) : 'n/a';
  custom.hidden = deviceSel.value !== 'custom';
  viewButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
}

function syncUrl() {
  const url = new URL(location.href);
  const q = url.searchParams;
  q.set('style', styleSel.value);
  q.set('palette', paletteSel.value);
  q.set('device', deviceSel.value);
  for (const [k, v] of [['w', cw.value], ['h', ch.value]] as const)
    deviceSel.value === 'custom' ? q.set(k, v) : q.delete(k);
  seedIn.value === '' ? q.delete('seed') : q.set('seed', seedIn.value);
  overlayIn.checked ? q.set('overlay', '1') : q.delete('overlay');
  view === 'grid' ? q.set('view', 'grid') : q.delete('view');
  history.replaceState(null, '', url);
}

// ---------- drawing ----------

/** A rendered preview of w x h, displayed at dispW x dispH css px, with optional overlay. */
async function frame(w: number, h: number, dispW: number, dispH: number): Promise<HTMLElement> {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const s = Math.min(1, (dispW * dpr) / w);
  const canvas = await renderCanvas(STYLES[styleSel.value], palette(), Math.max(16, Math.round(w * s)), Math.max(16, Math.round(h * s)));
  const el = document.createElement('div');
  el.className = 'frame';
  el.style.width = `${dispW}px`;
  el.style.height = `${dispH}px`;
  el.append(canvas);
  if (overlayIn.checked && isMobile(w, h)) {
    el.insertAdjacentHTML('beforeend', lockScreenSvg(w, h));
    el.style.borderRadius = `${dispW * SCREEN_RADIUS}px`;
  }
  return el;
}

let token = 0;

function errorEl(what: string, e: unknown): HTMLElement {
  const p = document.createElement('p');
  p.className = 'error';
  p.textContent = `${what}: ${e instanceof Error ? e.message : e}`;
  return p;
}

async function draw() {
  const mine = ++token;
  syncControls();
  syncUrl();
  try {
    if (bare) {
      const [w, h] = size();
      const canvas = await renderCanvas(STYLES[styleSel.value], palette(), w, h);
      stage.replaceChildren(canvas);
      document.body.dataset.ready = '1';
      return;
    }
    stage.classList.toggle('grid', view === 'grid');
    if (view === 'single') {
      const [w, h] = size();
      const box = stage.getBoundingClientRect();
      const fit = Math.min((box.width - 8) / w, (box.height - 8) / h);
      const el = await frame(w, h, Math.round(w * fit), Math.round(h * fit));
      if (mine === token) stage.replaceChildren(el);
    } else {
      const figures: HTMLElement[] = [];
      for (const d of DEVICES) {
        const el = await frame(d.w, d.h, Math.round((GRID_HEIGHT * d.w) / d.h), GRID_HEIGHT);
        if (mine !== token) return;
        const fig = document.createElement('figure');
        const open = document.createElement('button');
        open.title = `Open ${d.name}`;
        open.append(el);
        open.onclick = () => {
          deviceSel.value = d.id;
          view = 'single';
          draw();
        };
        fig.append(open);
        fig.insertAdjacentHTML('beforeend', `<figcaption>${d.name}<br>${d.w}×${d.h}</figcaption>`);
        figures.push(fig);
      }
      stage.replaceChildren(...figures);
    }
  } catch (e) {
    if (mine === token) stage.replaceChildren(errorEl('Render failed', e));
  }
}

async function download() {
  downloadBtn.disabled = true;
  try {
    const [w, h] = size();
    downloadBtn.textContent = `Rendering ${w}×${h}…`;
    const canvas = await renderCanvas(STYLES[styleSel.value], palette(), w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) throw new Error('PNG encoding failed');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${styleSel.value}-${paletteSel.value}-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  } catch (e) {
    stage.prepend(errorEl('Download failed', e));
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Download PNG';
  }
}


// ---------- wiring ----------

options(styleSel, Object.keys(STYLES).map((s) => [s, s.replace('_', ' ')]), params.get('style'));
const fillPalettes = (value?: string | null) =>
  options(paletteSel, Object.keys(PALETTES[styleSel.value]).map((p) => [p, p]), value);
fillPalettes(params.get('palette'));
options(
  deviceSel,
  [...DEVICES.map((d): [string, string] => [d.id, `${d.name} (${d.w}×${d.h})`]), ['custom', 'Custom…']],
  params.get('device') ?? (params.has('w') ? 'custom' : '5k'),
);
cw.value = params.get('w') ?? '2560';
ch.value = params.get('h') ?? '1440';
seedIn.value = params.get('seed') ?? '';
overlayIn.checked = params.get('overlay') === '1';
document.body.classList.toggle('bare', bare);

styleSel.onchange = () => {
  fillPalettes();
  seedIn.value = '';
  draw();
};
paletteSel.onchange = () => {
  seedIn.value = '';
  draw();
};
deviceSel.onchange = draw;
overlayIn.onchange = draw;
let typing: number | undefined;
for (const el of [cw, ch, seedIn])
  el.oninput = () => {
    clearTimeout(typing);
    typing = window.setTimeout(draw, 250);
  };
$<HTMLButtonElement>('randomise').onclick = () => {
  seedIn.value = String(Math.floor(Math.random() * 10000));
  draw();
};
viewButtons.forEach((b) => (b.onclick = () => ((view = b.dataset.view!), draw())));
downloadBtn.onclick = download;
let resizing: number | undefined;
window.addEventListener('resize', () => {
  if (bare || view === 'grid') return;
  clearTimeout(resizing);
  resizing = window.setTimeout(draw, 150);
});
draw();
