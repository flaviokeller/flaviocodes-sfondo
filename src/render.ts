/** Render any style into a fresh 2D canvas: SVG gets rasterised, GL is copied off a shared canvas. */
import { isMobile } from './core/devices.ts';
import type { Palette } from './core/palettes.ts';
import { renderGl } from './gl/gl.ts';
import type { Style } from './styles/index.ts';

// one WebGL context for the whole page; browsers cap how many can be alive at once
const glCanvas = document.createElement('canvas');

function rasterise(svg: string, w: number, h: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image(w, h);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(c);
    };
    img.onerror = () => reject(new Error('SVG rasterisation failed'));
    img.src = url;
  });
}

/**
 * Render at w x h. Compositions depend only on aspect ratio (units of sqrt(w*h)), so a
 * scaled-down size with the same aspect is a faithful, fast preview; only grain gets
 * relatively coarser.
 */
export async function renderCanvas(style: Style, pal: Palette, w: number, h: number): Promise<HTMLCanvasElement> {
  const mobile = isMobile(w, h);
  if (style.kind === 'svg') return rasterise(style.render(w, h, pal, mobile), w, h);
  renderGl(glCanvas, style.scene, w, h, style.uniforms(w, h, pal, mobile));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d')!.drawImage(glCanvas, 0, 0);
  return c;
}
