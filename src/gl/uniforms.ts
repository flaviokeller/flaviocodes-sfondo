/** Uniforms every smooth style shares (see common.glsl). */
import { hexToRgb, rgbToOklab } from '../core/color.ts';
import type { Palette } from '../core/palettes.ts';
import type { Uniforms } from './gl.ts';

const MAX_STOPS = 8;

/** Ramp stops as a flat OKLab vec3 array, padded to MAX_STOPS. */
export function stops(colors: string[]): Uniforms {
  if (colors.length < 2 || colors.length > MAX_STOPS) throw new Error(`ramp needs 2..${MAX_STOPS} stops`);
  const flat = colors.flatMap((c) => rgbToOklab(hexToRgb(c)));
  return { uStops: [...flat, ...Array((MAX_STOPS - colors.length) * 3).fill(0)], uStopCount: colors.length };
}

export function baseUniforms(pal: Palette, defaultGrain = 0): Uniforms {
  return { uSeed: pal.seed ?? 0, uGrain: Number(pal.grain ?? defaultGrain), ...stops(pal.colors) };
}
