/** Small helpers shared by the SVG styles. */
export const fmt = (v: number) => +v.toFixed(3);

export const svgDoc = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
