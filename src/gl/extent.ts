/** Canvas extent in units of sqrt(w*h): [xmax, ymax]. Matches `p` in common.glsl. */
export const extent = (w: number, h: number): [number, number] => {
  const unit = Math.sqrt(w * h);
  return [w / unit, h / unit];
};
