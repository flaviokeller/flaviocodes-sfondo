/** mulberry32: tiny seeded PRNG, returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded RNG with the few distributions the styles need. */
export function rng(seed: number) {
  const next = mulberry32(seed);
  return {
    next,
    uniform: (a: number, b: number) => a + (b - a) * next(),
    normal: (mean = 0, sd = 1) => mean + sd * Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next()),
  };
}
