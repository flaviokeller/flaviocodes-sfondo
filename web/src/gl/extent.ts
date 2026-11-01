/** Canvas extent in units of sqrt(w*h): [xmax, ymax], same as Python's grid(). */
export const extent = (w: number, h: number): [number, number] => {
  const unit = Math.sqrt(w * h);
  return [w / unit, h / unit];
};
