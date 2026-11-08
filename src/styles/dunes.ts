/**
 * Dunes: stacked sand ridges, back to front, each a flat fill with a lighter rim on its crest.
 * Ridge heights are skewed sines (gentle windward slope, steeper lee side) plus two smaller
 * harmonics, all in units of sqrt(w*h) so the dunes keep their shape on any aspect ratio.
 */
import { ramp, rampHex, rgbToHex } from '../core/color.ts';
import type { Palette } from '../core/palettes.ts';
import { rng } from '../core/prng.ts';
import { fmt, svgDoc } from './svg.ts';

const SAMPLES = 480;

export function render(w: number, h: number, pal: Palette, mobile: boolean): string {
  const r = rng(pal.seed ?? 0);
  const n = pal.n ?? 6;
  const cols = rampHex(n, pal.colors);
  const unit = Math.sqrt(w * h);
  const top = Number(mobile ? (pal.top_m ?? 0.42) : (pal.top ?? 0.32));
  const amp = Number(pal.amp ?? 0.05);
  const rim = Math.max(1, Number(pal.rim ?? 0.004) * unit);

  const layers = cols.map((c, i) => {
    const base = h * (top + ((1 - top) * 0.85 * i) / (n - 1 || 1));
    const a = amp * unit * (0.6 + (0.8 * i) / n); // nearer dunes are taller
    const k = r.uniform(1.1, 1.8) / (1 + 0.2 * i); // and wider
    const [p1, p2, p3] = [r.uniform(0, 6.28), r.uniform(0, 6.28), r.uniform(0, 6.28)];
    const pts: string[] = [];
    for (let s = 0; s <= SAMPLES; s++) {
      const x = (s / SAMPLES) * w;
      const u = x / unit;
      const th = k * 6.28 * u + p1;
      const y =
        base -
        a * (Math.sin(th + 0.9 * Math.sin(th)) + 0.18 * Math.sin(2.3 * th + p2) + 0.04 * Math.sin(5.1 * th + p3));
      pts.push(`${fmt(x)} ${fmt(y)}`);
    }
    const crest = `M${pts.join('L')}`;
    const lit = rgbToHex(ramp(0.4, [c, '#ffffff']));
    return (
      `<path d="${crest}L${w} ${h}L0 ${h}Z" fill="${c}"/>` +
      `<path d="${crest}" fill="none" stroke="${lit}" stroke-width="${fmt(rim)}"/>`
    );
  });
  return svgDoc(w, h, `<rect width="${w}" height="${h}" fill="${pal.bg}"/>${layers.join('')}`);
}
