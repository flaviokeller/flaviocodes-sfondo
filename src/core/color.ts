/** sRGB <-> OKLab and OKLab colour ramps. */

export type RGB = [number, number, number]; // sRGB, 0..1
export type Lab = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
}

export function rgbToHex(c: RGB): string {
  return (
    '#' +
    c
      .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => {
  c = Math.min(1, Math.max(0, c));
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
};

export function rgbToOklab(c: RGB): Lab {
  const [r, g, b] = c.map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb([L, a, b]: Lab): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** Map t (0..1) through evenly spaced colour stops, interpolating in OKLab. */
export function ramp(t: number, colors: string[]): RGB {
  const labs = colors.map((c) => rgbToOklab(hexToRgb(c)));
  const x = Math.min(1, Math.max(0, t)) * (labs.length - 1);
  const i = Math.min(Math.floor(x), labs.length - 2);
  const f = x - i;
  const [p, q] = [labs[i], labs[i + 1]];
  return oklabToRgb([0, 1, 2].map((k) => p[k] + (q[k] - p[k]) * f) as Lab);
}

/** n evenly spaced samples of the ramp, as hex (like ramp(linspace(0, 1, n))). */
export function rampHex(n: number, colors: string[]): string[] {
  return Array.from({ length: n }, (_, i) => rgbToHex(ramp(n === 1 ? 0 : i / (n - 1), colors)));
}
