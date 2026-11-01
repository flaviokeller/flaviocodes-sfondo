/** Contours: topographic isolines of a seeded mountain range. */
import { hexToRgb } from '../../core/color.ts';
import type { Palette } from '../../core/palettes.ts';
import { rng } from '../../core/prng.ts';
import { extent } from '../../gl/extent.ts';
import { baseUniforms } from '../../gl/uniforms.ts';
import scene from './contours.glsl?raw';

export const contours = {
  kind: 'gl' as const,
  scene,
  uniforms(w: number, h: number, pal: Palette) {
    const r = rng(pal.seed ?? 0);
    const [xm, ym] = extent(w, h);
    const count = Number(pal.peaks ?? 3);
    const peaks: number[] = [];
    for (let i = 0; i < 3; i++) {
      peaks.push(xm * r.uniform(0.15, 0.85), ym * r.uniform(0.15, 0.85), r.uniform(0.18, 0.32));
    }
    return {
      ...baseUniforms(pal),
      uPeaks: peaks,
      uPeakCount: count,
      uLevels: Number(pal.levels ?? 22),
      uLine: Number(pal.line ?? 0.0004),
      uBg: hexToRgb(pal.bg ?? '#0a1216'),
    };
  },
};
