/** Influx: silky, flowing wave surfaces with soft lighting. */
import type { Palette } from '../../core/palettes.ts';
import { rng } from '../../core/prng.ts';
import { baseUniforms } from '../../gl/uniforms.ts';
import scene from './influx.glsl?raw';

export const influx = {
  kind: 'gl' as const,
  scene,
  uniforms(_w: number, _h: number, pal: Palette, mobile: boolean) {
    const r = rng(pal.seed ?? 0);
    const base = r.uniform(0, Math.PI);
    const swell: number[] = [], phase: number[] = [];
    for (let i = 0; i < 3; i++) {
      const th = base + r.normal(0, 0.5);
      const k = r.uniform(2.5, 5.5) * (mobile ? 0.9 : 1);
      swell.push(Math.cos(th), Math.sin(th), k, r.uniform(0.7, 1.0) / (1 + 0.35 * i));
      phase.push(r.uniform(0, 2 * Math.PI));
    }
    return {
      ...baseUniforms(pal),
      uSwell: swell,
      uSwellPhase: phase,
      uWarp: Number(pal.warp ?? 0.22),
      uRelief: Number(pal.relief ?? 0.22),
      uSpec: Number(pal.spec ?? 0.22),
      uShadeShift: Number(pal.shade_shift ?? 0.35),
    };
  },
};
