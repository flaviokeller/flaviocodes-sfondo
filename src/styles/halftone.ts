/**
 * Halftone: a hexagonal dot grid printing one large soft blob. Dot area follows the blob's
 * density (so it reads as tone, like print halftone) and dot colour follows the ramp.
 */
import { ramp, rgbToHex } from '../core/color.ts';
import type { Palette } from '../core/palettes.ts';
import { fmt, svgDoc } from './svg.ts';

export function render(w: number, h: number, pal: Palette, mobile: boolean): string {
  const unit = Math.sqrt(w * h);
  const step = Number(pal.step ?? 0.022) * unit;
  const rowH = (step * Math.sqrt(3)) / 2;
  const cx = Number(pal.cx ?? 0.62) * w;
  const cy = Number(mobile ? (pal.cy_m ?? 0.62) : (pal.cy ?? 0.55)) * h;
  const R = Number(pal.radius ?? 0.45) * unit;
  const maxR = step * 0.48;
  // quantise colours so identical fills can share one <g> (keeps the SVG small at 5K)
  const LEVELS = 24;
  const fills = Array.from({ length: LEVELS }, (_, i) => rgbToHex(ramp(i / (LEVELS - 1), pal.colors)));
  const groups: string[][] = fills.map(() => []);

  for (let row = -1; row * rowH < h + step; row++) {
    const y = row * rowH;
    const off = row % 2 ? step / 2 : 0;
    for (let x = off - step; x < w + step; x += step) {
      const d = Math.hypot(x - cx, y - cy) / R;
      const v = Math.exp(-d * d);
      const rad = maxR * Math.sqrt(v);
      if (rad < 0.4) continue;
      groups[Math.round(v * (LEVELS - 1))].push(`<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(rad)}"/>`);
    }
  }
  const body = groups.map((g, i) => (g.length ? `<g fill="${fills[i]}">${g.join('')}</g>` : '')).join('');
  return svgDoc(w, h, `<rect width="${w}" height="${h}" fill="${pal.bg}"/>${body}`);
}
