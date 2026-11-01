/** Glass: a few long diagonal folds, faceted and lit, with a light crease highlight. */
import type { Palette } from '../../core/palettes.ts';
import { rng } from '../../core/prng.ts';
import { extent } from '../../gl/extent.ts';
import { baseUniforms } from '../../gl/uniforms.ts';
import scene from './glass.glsl?raw';

const MAX_FOLDS = 5;

export const glass = {
  kind: 'gl' as const,
  scene,
  uniforms(w: number, h: number, pal: Palette, mobile: boolean) {
    const r = rng(pal.seed ?? 0);
    const [xm, ym] = extent(w, h);
    const count = Math.min(MAX_FOLDS, Number(pal.folds ?? 4));
    // creases run roughly corner to corner; their normals fan out a little around one angle
    const base = Math.atan2(xm, ym) + (mobile ? 0.15 : 0) + r.normal(0, 0.12);
    const span = xm * Math.cos(base) + ym * Math.sin(base);
    const folds: number[] = [];
    for (let i = 0; i < MAX_FOLDS; i++) {
      const th = base + r.normal(0, 0.18);
      const [nx, ny] = [Math.cos(th), Math.sin(th)];
      const c = span * ((i + 0.5) / count + r.normal(0, 0.06));
      const slope = r.uniform(0.3, 0.7) * (i % 2 ? 1 : -1);
      folds.push(nx, ny, c, slope);
    }
    // ramp runs across the folds, from the top-left corner to the bottom-right
    const dir = [xm / Math.hypot(xm, ym), ym / Math.hypot(xm, ym)];
    return {
      ...baseUniforms(pal, 0.035),
      uFolds: folds,
      uFoldCount: count,
      uDir: dir,
      uDirSpan: [0, 1 / Math.hypot(xm, ym)],
      uRelief: Number(pal.relief ?? 0.9),
      uSpec: Number(pal.spec ?? 0.18),
      uShadeShift: Number(pal.shade_shift ?? 0.3),
    };
  },
};
