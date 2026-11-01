/** Grainy Gradients: dark canvas, glowing arc or glow, heavy film grain. */
import { hexToRgb } from '../../core/color.ts';
import type { Palette } from '../../core/palettes.ts';
import { extent } from '../../gl/extent.ts';
import { baseUniforms, stops } from '../../gl/uniforms.ts';
import scene from './grainy.glsl?raw';

const num = (pal: Palette, key: string, fallback: number) => Number(pal[key] ?? fallback);

export const grainy = {
  kind: 'gl' as const,
  scene,
  uniforms(w: number, h: number, pal: Palette, mobile: boolean) {
    const [xm, ym] = extent(w, h);
    const bg = pal.bg ?? '#000000';
    const R = xm * (mobile ? 0.95 : 0.85);
    const top = ym * (mobile ? num(pal, 'top_m', 0.5) : num(pal, 'top', 0.38));
    return {
      ...baseUniforms(pal, 0.05),
      ...stops([...pal.colors, bg]),
      uMode: pal.mode === 'glow' ? 1 : 0,
      uBg: hexToRgb(bg),
      uHot: hexToRgb(pal.colors[0]),
      uArc: [xm * 0.5, top + R, R],
      uArcShape: [num(pal, 'depth', 0.3) * (mobile ? 1.4 : 1), num(pal, 'halo', 0.035)],
      uGlow: [
        xm * num(pal, 'cx', 0.5),
        ym * num(pal, 'cy', -0.02),
        xm * num(pal, 'rx', 0.55) * (mobile ? 1.1 : 1),
        ym * num(pal, 'ry', 0.62) * (mobile ? 0.55 : 1),
      ],
      uGlowShape: [num(pal, 'tilt', -0.25), num(pal, 'gamma', 0.9)],
    };
  },
};
