# CLAUDE.md

Procedural wallpaper generator in the browser. Seven styles (blur, gradient_blur, grainy,
levels, palette, influx, retro_lines), each with 3 palettes, rendered at any device size.
Flat styles are SVG, smooth styles are WebGL2 shaders. The styles are original
compositions; do not reproduce any existing wallpaper pack.

Design decisions, measured facts and pitfalls: `docs/architecture.md`.

## Commands

```bash
npm install && npx playwright install chromium
npm run dev            # preview UI; ?bare&style=&palette=&w=&h= renders full size, sets body[data-ready]
npm run export         # all styles x palettes -> out-web/ (flags: see scripts/export.ts)
npm run previews       # refresh the committed contact sheets in previews/
npm run typecheck
npm run build          # static site in dist/
```

`/test/ramp.html` (dev server) renders a 5K dark ramp to check the shader dither.

## Layout

- `src/palettes.json`: all palettes, the single source of truth (keys documented in README).
- `src/core/`: OKLab colour + ramp, seeded PRNG, device presets, typed palettes.
- `src/styles/`: flat styles (`*.ts` returning an SVG string) and `gl/` shader styles
  (`*.glsl` + `*.ts` for uniforms), registered in `src/styles/index.ts`.
- `src/gl/`: WebGL2 harness and `common.glsl` (noise, ramp, grain, dither).
- `src/render.ts`: any style to a canvas. `src/main.ts`: preview UI. `src/ui/overlay.ts`: iOS lock screen.
- `scripts/`: `export.ts`, `previews.ts`, shared `browser.ts` (Vite + headless Chromium).

## Conventions

- Styles are pure and deterministic: same `(w, h, palette)` gives the same image.
  Per-palette `seed` changes layout, never colours.
- Coordinates are in units of `sqrt(w*h)` so shape density looks the same on every aspect ratio.
- Interpolate colour ramps in OKLab, not sRGB.
- Smooth styles always end with grain/1-LSB dither (in `common.glsl`); flat styles have none.
- New palettes go in `src/palettes.json` only; no code change should be needed.
- Do not commit rendered images (`out-web/`); `previews/` is the exception (low-res sheets).
- When changing a style, render it and actually look at it (desktop, and mobile with the
  lock-screen overlay); this is a visual project and numbers do not tell you whether it looks right.

## Known weak spots

- `blur` and `gradient_blur` are loose interpretations: fewer, wider bands and blobs than a
  hand-made design would have.
- Some seeds give large flat areas; try seeds in the preview (Randomise) and write the good
  one into `src/palettes.json`.
- The lock-screen overlay is approximate (points at @3x), not an Apple asset.
