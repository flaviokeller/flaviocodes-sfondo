/** Style registry. SVG styles return an SVG string; GL styles supply a scene shader + uniforms. */
import type { Palette } from '../core/palettes.ts';
import type { Uniforms } from '../gl/gl.ts';
import { blur } from './gl/blur.ts';
import { gradientBlur } from './gl/gradient_blur.ts';
import { grainy } from './gl/grainy.ts';
import { influx } from './gl/influx.ts';
import * as levels from './levels.ts';
import * as palette from './palette.ts';
import * as retroLines from './retro_lines.ts';

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
};
