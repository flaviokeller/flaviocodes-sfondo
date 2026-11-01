/** Color Levels: flat horizontal bands stepping through a colour ramp. */
import { rampHex } from '../core/color.ts';
import type { Palette } from '../core/palettes.ts';
import { svgDoc } from './svg.ts';

export function render(w: number, h: number, pal: Palette): string {
  const n = pal.n ?? pal.colors.length;
  const bands = rampHex(n, pal.colors);
  // Band i starts on the first pixel row with floor(row * n / h) == i, like the Python version.
  // Each rect runs to the bottom and later ones paint over it, so there are no seams.
  const rects = bands.map((c, i) => {
    const y = Math.ceil((i * h) / n);
    return `<rect x="0" y="${y}" width="${w}" height="${h - y}" fill="${c}"/>`;
  });
  return svgDoc(w, h, `<g shape-rendering="crispEdges">${rects.join('')}</g>`);
}
