/** Style registry. SVG styles return an SVG string; WebGL styles come in phase 3. */
import type { Palette } from '../core/palettes.ts';
import * as levels from './levels.ts';
import * as palette from './palette.ts';
import * as retroLines from './retro_lines.ts';

export interface SvgStyle {
  kind: 'svg';
  render(w: number, h: number, pal: Palette, mobile: boolean): string;
}

export const STYLES: Record<string, SvgStyle> = {
  levels: { kind: 'svg', render: levels.render },
  palette: { kind: 'svg', render: palette.render },
  retro_lines: { kind: 'svg', render: retroLines.render },
};
