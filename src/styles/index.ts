/** Style registry. SVG styles return an SVG string; GL styles supply a scene shader + uniforms. */
import type { Palette } from '../core/palettes.ts';
import type { Uniforms } from '../gl/gl.ts';
import { blur } from './gl/blur.ts';
import { contours } from './gl/contours.ts';
import { glass } from './gl/glass.ts';
import { gradientBlur } from './gl/gradient_blur.ts';
import { grainy } from './gl/grainy.ts';
import { influx } from './gl/influx.ts';
import * as dunes from './dunes.ts';
import * as halftone from './halftone.ts';
import * as levels from './levels.ts';
import * as palette from './palette.ts';
import * as retroLines from './retro_lines.ts';
import * as truchet from './truchet.ts';

export interface SvgStyle {
  kind: 'svg';
  render(w: number, h: number, pal: Palette, mobile: boolean): string;
}

export interface GlStyle {
  kind: 'gl';
  /** GLSL defining `vec3 scene(vec2 p)`, appended to common.glsl. */
  scene: string;
  uniforms(w: number, h: number, pal: Palette, mobile: boolean): Uniforms;
}

export type Style = SvgStyle | GlStyle;

export const STYLES: Record<string, Style> = {
  blur,
  gradient_blur: gradientBlur,
  grainy,
  influx,
  levels: { kind: 'svg', render: levels.render },
  palette: { kind: 'svg', render: palette.render },
  retro_lines: { kind: 'svg', render: retroLines.render },
  contours,
  dunes: { kind: 'svg', render: dunes.render },
  halftone: { kind: 'svg', render: halftone.render },
  glass,
  truchet: { kind: 'svg', render: truchet.render },
};
