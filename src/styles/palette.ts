/**
 * Palette: a row of overlapping rounded pills on a flat background.
 * Desktop: vertical pills side by side. Mobile: the same composition transposed
 * (horizontal pills stacked top to bottom) so it fills a portrait screen.
 */
import { rampHex } from '../core/color.ts';
import type { Palette } from '../core/palettes.ts';
import { fmt, svgDoc } from './svg.ts';

export function render(w: number, h: number, pal: Palette, mobile: boolean): string {
  const n = pal.n ?? pal.colors.length;
  const cols = rampHex(n, pal.colors);
  // Mobile lays out on a landscape canvas (W x H) and transposes it at the end.
  const [W, H] = mobile ? [h, w] : [w, h];
  const pillW = (mobile ? 0.09 : 0.095) * W;
  const pillH = (mobile ? 0.82 : 0.62) * H;
  const step = pillW * 0.55;
  const x0 = (W - (pillW + (n - 1) * step)) / 2;
  const y = (H - pillH) / 2;
  const r = fmt(pillW / 2);

  // right -> left so the first pill sits on top
  const pills = cols
    .map(
      (c, i) =>
        `<rect x="${fmt(x0 + i * step)}" y="${fmt(y)}" width="${fmt(pillW)}" height="${fmt(pillH)}" rx="${r}" fill="${c}"/>`,
    )
    .reverse()
    .join('');
  const group = mobile ? `<g transform="matrix(0 1 1 0 0 0)">${pills}</g>` : pills;
  return svgDoc(w, h, `<rect width="${w}" height="${h}" fill="${pal.bg}"/>${group}`);
}
