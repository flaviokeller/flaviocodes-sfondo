# Architecture and decisions

Longer-form notes behind `CLAUDE.md`. The project started as a Python/NumPy renderer and
was ported to the browser; the Python version was retired in Nov 2026 (it is in git history
before the move to the repo root if you ever need it as a reference).

## Why the browser

- One scene per style, parameterised by `(width, height, palette)`: device sizes are data,
  not code paths.
- Live preview (style, palette, device, lock-screen overlay) instead of render-and-look.
- Flat styles are tiny resolution-independent SVG.

## Decisions

| Topic | Decision |
|---|---|
| Tooling | Vite + TypeScript, no UI framework. Plain DOM for the preview page. |
| Flat styles (`levels`, `palette`, `retro_lines`, `dunes`, `halftone`, `truchet`) | Pure functions returning an SVG string. Overlapping shapes painted in order, so there are no seams. |
| Smooth styles (`blur`, `gradient_blur`, `grainy`, `influx`, `contours`, `glass`) | WebGL2 fragment shaders on one full-screen triangle (`src/gl/`). CSS/SVG cannot do swirling bands or lit silk cleanly, and shaders give the same result in every browser. |
| Shared shader code | `src/gl/common.glsl`: integer hash, Catmull-Rom value noise + fbm, OKLab ramp (stops converted to OKLab on the CPU), grain sized in output pixels, 1-LSB dither. A style only writes `vec3 scene(vec2 p)`. |
| Randomness | Seeded PRNG on the CPU (mulberry32, `src/core/prng.ts`) for layout parameters passed as uniforms; seeded integer hashes on the GPU for noise. |
| Rendering | `src/render.ts` turns any style into a 2D canvas: SVG is rasterised, GL is copied off one shared WebGL canvas (browsers cap live contexts). Preview, grid, download and export all use it. |
| Export | `scripts/export.ts` starts Vite, drives headless Chromium on the GPU through `?bare`, saves the canvas as PNG. ~10 s for the full set at 5K on an M1 Pro. |
| Palettes | `src/palettes.json` is the single source of truth. |
| Max size | 16384 px per side (common GPU limit). Bigger sizes are an error, never clamped. |

## Measured facts worth keeping

- The OKLab ramp matched the old Python `ramp()` within 0.001/255.
- Noise: quintic value noise creased visibly at lattice points (kinks on the grainy arc).
  Catmull-Rom fixed it. Its std (~0.7) matches the old Python noise, which is what the warp
  amplitudes were tuned for.
- `influx` used to multiply sRGB for shading, which turned cream/orange into brown. It now
  shifts along the ramp (`shade_shift`) and scales OKLab lightness.
- At 5K, a dark ramp shows no steps (column means within 0.04 LSB of exact). Long runs of
  identical pixels in exports are flat colour (background, ramp end stop), not banding.

## Pitfalls

- **Banding**: 8-bit gradients band on dark scenes. Always keep the shader dither.
- **SVG filters at 5K** (`feTurbulence`, `feGaussianBlur`) are slow and differ between
  browsers; do not use them for the smooth styles.
- **Grain** is sized in output pixels, so previews (rendered at display size) look slightly
  coarser than full-size exports.
- **Playwright locators auto-wait** (30 s default). Use `page.evaluate` for "is it there?"
  checks in scripts, or every job silently takes 30 s.

## Open questions

- Live/animated wallpapers: the shader styles could animate nearly for free (`blur`,
  `gradient_blur`, `influx`). Out of scope unless wanted.
- Hosting the preview: `npm run build` produces a ~24 KB static site (GitHub Pages would do).
