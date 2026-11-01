/** Gradient Blur: big soft colour blooms dissolving into deep black. */
import { hexToRgb } from '../../core/color.ts';
import type { Palette } from '../../core/palettes.ts';
import { rng } from '../../core/prng.ts';
import { extent } from '../../gl/extent.ts';
import scene from './gradient_blur.glsl?raw';

const MAX_BLOBS = 8;

export const gradientBlur = {
  kind: 'gl' as const,
  scene,
  uniforms(w: number, h: number, pal: Palette, mobile: boolean) {
    const r = rng(pal.seed ?? 0);
    const [xm, ym] = extent(w, h);
    const size = (xm + ym) / 2;
    const n = pal.colors.length;
    if (n > MAX_BLOBS) throw new Error(`gradient_blur supports up to ${MAX_BLOBS} colours`);
    // blobs sit along a rough diagonal sweep so colours flow into each other
    const th = Number(pal.angle ?? r.uniform(0.3, 1.2));
    const blobs: number[] = [], angles: number[] = [], colors: number[] = [];
    pal.colors.forEach((c, i) => {
      const f = (i + 0.5) / n;
      blobs.push(
        xm * (0.1 + 0.8 * (mobile ? r.uniform(0.1, 0.9) : f)) + r.normal(0, 0.05),
        ym * (0.1 + 0.8 * (mobile ? f : 1 - f)) + r.normal(0, 0.05),
        size * r.uniform(0.3, 0.55),
        size * r.uniform(0.14, 0.28),
      );
      angles.push(th + r.normal(0, 0.35));
      colors.push(...hexToRgb(c));
    });
    const pad = MAX_BLOBS - n;
    return {
      uSeed: pal.seed ?? 0,
      uGrain: Number(pal.grain ?? 0),
      uBlobs: [...blobs, ...Array(pad * 4).fill(1)],
      uBlobAngle: [...angles, ...Array(pad).fill(0)],
      uBlobColor: [...colors, ...Array(pad * 3).fill(0)],
      uBlobCount: n,
      uBg: hexToRgb(pal.bg ?? '#030206'),
      uWarp: Number(pal.warp ?? 0.22),
      uGain: Number(pal.gain ?? 1.3),
    };
  },
};
