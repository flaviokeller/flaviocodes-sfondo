/**
 * Truchet: Smith tiles (two quarter-circle arcs per tile, randomly rotated) forming
 * continuous meanders. Regions between arcs are two-coloured: in tile (i, j) with
 * orientation o the middle region takes colour (i + j + o) % 2 and the corner discs the
 * other one, which matches across every tile edge. Arcs are stroked in a third colour.
 * Tile edges are snapped to whole pixels so neighbouring fills never show a seam.
 */
import type { Palette } from '../core/palettes.ts';
import { rng } from '../core/prng.ts';
import { fmt, svgDoc } from './svg.ts';

export function render(w: number, h: number, pal: Palette, mobile: boolean): string {
  const r = rng(pal.seed ?? 0);
  const [c0, c1, line] = pal.colors;
  const unit = Math.sqrt(w * h);
  const T = Number(mobile ? (pal.tile_m ?? 0.15) : (pal.tile ?? 0.19)) * unit;
  const cols = Math.ceil(w / T) + 1;
  const rows = Math.ceil(h / T) + 1;
  const x0 = (w - cols * T) / 2;
  const y0 = (h - rows * T) / 2;
  const sw = fmt(Number(pal.stroke ?? 0.18) * T);
  const X = (i: number) => Math.round(x0 + i * T);
  const Y = (j: number) => Math.round(y0 + j * T);

  const discs: string[] = [];
  const arcs: string[] = [];
  const odd: string[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const o = r.next() < 0.5 ? 0 : 1;
      const [xa, xb, ya, yb] = [X(i), X(i + 1), Y(j), Y(j + 1)];
      const rad = fmt((xb - xa + yb - ya) / 4);
      // the two arc centres: top-left + bottom-right (o = 0) or top-right + bottom-left (o = 1)
      const corners: [number, number, number, number][] =
        o === 0 ? [[xa, ya, 1, 1], [xb, yb, -1, -1]] : [[xb, ya, -1, 1], [xa, yb, 1, -1]];
      const middleOdd = (i + j + o) % 2 === 1;
      if (middleOdd) odd.push(`M${xa} ${ya}H${xb}V${yb}H${xa}Z`);
      for (const [cx, cy, sx, sy] of corners) {
        const sweep = sx * sy > 0 ? 1 : 0;
        const ax = `${fmt(cx + sx * Number(rad))} ${cy}`;
        const ay = `${cx} ${fmt(cy + sy * Number(rad))}`;
        const arc = `M${ax}A${rad} ${rad} 0 0 ${sweep} ${ay}`;
        // the quarter disc inside this arc takes the other colour
        discs.push(`<path d="${arc}L${cx} ${cy}Z" fill="${middleOdd ? c0 : c1}"/>`);
        arcs.push(arc);
      }
    }
  }
  return svgDoc(
    w,
    h,
    `<rect width="${w}" height="${h}" fill="${c0}"/>` +
      `<path d="${odd.join('')}" fill="${c1}" shape-rendering="crispEdges"/>` +
      discs.join('') +
      `<path d="${arcs.join('')}" fill="none" stroke="${line}" stroke-width="${sw}"/>`,
  );
}
