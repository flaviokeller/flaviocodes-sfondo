/** Blur: soft, colourful, swirling bands. */
import type { Palette } from '../../core/palettes.ts';
import { rng } from '../../core/prng.ts';
import { baseUniforms } from '../../gl/uniforms.ts';
import scene from './blur.glsl?raw';

export const blur = {
  kind: 'gl' as const,
  scene,
  uniforms(_w: number, _h: number, pal: Palette) {
    const r = rng(pal.seed ?? 0);
    return {
      ...baseUniforms(pal),
      uWarp: Number(pal.warp ?? 0.2),
      uFreq: Number(pal.freq ?? 4.2),
      uAngle: Number(pal.angle ?? r.uniform(0, Math.PI)),
      uPhase: r.uniform(0, 2 * Math.PI),
    };
  },
};
