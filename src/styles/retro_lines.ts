/** Retro Lines: a diagonal band of flat stripes between two solid fields. */
import type { Palette } from '../core/palettes.ts';
import { fmt, svgDoc } from './svg.ts';

export function render(w: number, h: number, pal: Palette, mobile: boolean): string {
  const colors = pal.colors;
  const n = colors.length;
  const theta = (Number(mobile ? (pal.angle_m ?? 62) : (pal.angle ?? 30)) * Math.PI) / 180;
  const diag = Math.hypot(w, h);
  const sw = Number(pal.stripe ?? 0.03) * diag;
  const start = Number(pal.offset ?? 0.1) * diag - (sw * (n - 2)) / 2;

  // Rotate so local +x is the stripe normal (sin θ, cos θ), pointing bottom-right.
  // Each colour is a half-plane x >= edge painted over the previous one: no gaps, no seams.
  const rot = fmt(90 - (theta * 180) / Math.PI);
  const D = fmt(diag);
  const fields = colors
    .slice(1)
    .map((c, i) => `<rect x="${fmt(start + i * sw)}" y="${-D}" width="${2 * D}" height="${2 * D}" fill="${c}"/>`)
    .join('');
  return svgDoc(
    w,
    h,
    `<rect width="${w}" height="${h}" fill="${colors[0]}"/>` +
      `<g transform="translate(${w / 2} ${h / 2}) rotate(${rot})">${fields}</g>`,
  );
}
