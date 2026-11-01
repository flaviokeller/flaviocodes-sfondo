# CLAUDE.md

Procedural wallpaper generator. Seven styles (blur, gradient_blur, grainy, levels,
palette, influx, retro_lines), each with 3 palettes, rendered for desktop and mobile.
The styles are loosely inspired by wallpaper packs on platsupply.com; they are
original compositions, not copies. Do not try to reproduce any specific
pack pixel for pixel.

Two implementations are planned:

1. **Python (done, `wallpapers/`)**: NumPy/SciPy/Pillow, pixel-exact PNG output. Treat it
   as the reference and batch renderer.
2. **Web (to build, `web/`)**: SVG, CSS, JS and WebGL, with a live preview and
   per-device sizing. See `PLAN.md` for the full plan and port notes.

## Commands (Python)

```bash
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
python -m wallpapers list
python -m wallpapers render --scale 0.2 --sheets    # fast preview + contact sheets in out/sheets
python -m wallpapers render -s blur -p aurora -d mobile
python scripts/export_palettes.py                    # palettes.py -> web/palettes.json
```

`out/` is git-ignored. `previews/` holds committed contact sheets (low-res, for
orientation only; re-render to refresh).

## Commands (web)

```bash
cd web && npm install && npx playwright install chromium
npm run dev            # preview; ?style=&palette=&device= or ?bare&w=&h= for exact-size output
npm run typecheck
npm run check:ramp     # JS OKLab ramp vs Python (needs ../.venv)
```

## Layout

- `wallpapers/core.py`: OKLab colour ramps, coordinate grid, noise/fbm, upscale, grain/dither.
- `wallpapers/styles/*.py`: one `render(w, h, pal, mobile) -> uint8 HxWx3` per style.
- `wallpapers/palettes.py`: all palettes (documented at the top). Single source of truth for now.
- `wallpapers/render.py`: sizes, job planning, contact sheets.
- `scripts/export_palettes.py`, `web/palettes.json`: palette export for the web port.

## Conventions

- Keep style functions pure and deterministic: same `(w, h, palette)` gives the same image.
  Per-palette `seed` changes layout, never colours.
- Coordinates are in units of `sqrt(w*h)` so shape density looks the same on every aspect ratio.
- Interpolate colour ramps in OKLab, not sRGB.
- Smooth styles: compute on a small grid, upscale, then add grain/1-LSB dither at full
  resolution (avoids 8-bit banding). Flat styles: draw at full resolution with 1px anti-aliasing,
  no dither.
- New palettes go in `palettes.py` only; no code change should be needed.
- Do not commit rendered images (`out/`).
- When changing a style, re-render a preview and actually look at it; this is a visual
  project and numbers do not tell you whether it looks right.

## Known weak spots

- `influx` is the loosest match to its reference and can look muddy where dark shading
  meets orange/cream stops. First candidate for improvement. (The web port's shading fixes the mud: `web/src/styles/gl/influx.glsl`.)
- `blur` and `gradient_blur` are looser interpretations: fewer, wider bands and blobs than a
  hand-made design would have.
- Mobile layouts are only checked as thumbnails; verify against iOS lock-screen overlays
  (clock at top, Dynamic Island) before treating them as final.
