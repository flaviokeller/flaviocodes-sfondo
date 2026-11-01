/**
 * Minimal preview. URL params: style, palette, device or w+h, bare (render at exact
 * size with no chrome, for screenshots/export).
 */
import { DEVICES, isMobile } from './core/devices.ts';
import { renderGl } from './gl/gl.ts';
import { PALETTES } from './core/palettes.ts';
import { STYLES } from './styles/index.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const styleSel = $<HTMLSelectElement>('style');
const paletteSel = $<HTMLSelectElement>('palette');
const deviceSel = $<HTMLSelectElement>('device');
const stage = $<HTMLDivElement>('stage');
const params = new URLSearchParams(location.search);
const canvas = document.createElement('canvas');

const options = (sel: HTMLSelectElement, items: [string, string][], value?: string | null) => {
  sel.replaceChildren(...items.map(([v, label]) => new Option(label, v)));
  if (value && items.some(([v]) => v === value)) sel.value = value;
};

function size(): [number, number] {
  const w = Number(params.get('w')), h = Number(params.get('h'));
  if (w && h) return [w, h];
  const d = DEVICES.find((d) => d.id === deviceSel.value) ?? DEVICES[0];
  return [d.w, d.h];
}

function draw() {
  const pal = PALETTES[styleSel.value][paletteSel.value];
  const [w, h] = size();
  const style = STYLES[styleSel.value];
  const mobile = isMobile(w, h);
  if (style.kind === 'svg') {
    stage.innerHTML = style.render(w, h, pal, mobile);
  } else {
    // one canvas (and WebGL context) for the page's lifetime
    stage.replaceChildren(canvas);
    renderGl(canvas, style.scene, w, h, style.uniforms(w, h, pal, mobile));
  }
  const url = new URL(location.href);
  url.searchParams.set('style', styleSel.value);
  url.searchParams.set('palette', paletteSel.value);
  url.searchParams.set('device', deviceSel.value);
  history.replaceState(null, '', url);
}

options(styleSel, Object.keys(STYLES).map((s) => [s, s]), params.get('style'));
const fillPalettes = (value?: string | null) =>
  options(paletteSel, Object.keys(PALETTES[styleSel.value]).map((p) => [p, p]), value);
fillPalettes(params.get('palette'));
options(deviceSel, DEVICES.map((d) => [d.id, `${d.name} (${d.w}x${d.h})`]), params.get('device') ?? '5k');
document.body.classList.toggle('bare', params.has('bare'));

styleSel.onchange = () => { fillPalettes(); draw(); };
paletteSel.onchange = draw;
deviceSel.onchange = () => { params.delete('w'); params.delete('h'); draw(); };
draw();
