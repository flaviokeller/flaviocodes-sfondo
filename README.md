# wallpapers

Procedural wallpaper generator: 7 styles x 3 palettes x desktop + mobile = 42 images.
Pure Python (NumPy, SciPy, Pillow), no design tools needed. Every image is
deterministic, so re-running gives identical results.

Styles are loosely inspired by wallpaper packs on platsupply.com (not copies):

| style | look |
|---|---|
| `blur` | soft, silky swirling colour bands |
| `gradient_blur` | big colour blooms dissolving into deep black |
| `grainy` | dark scene with a glowing arc or glow and heavy film grain |
| `levels` | flat horizontal colour bands stepping through a ramp |
| `palette` | overlapping rounded pills (rotated to horizontal on mobile) |
| `influx` | silky, lit wave surfaces |
| `retro_lines` | diagonal band of flat stripes between two solid fields |

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## Use

```bash
python -m wallpapers list                          # styles + palettes
python -m wallpapers render                        # everything -> out/
python -m wallpapers render -s blur -p aurora      # one palette
python -m wallpapers render -s grainy -d mobile    # one device
python -m wallpapers render --scale 0.2 --sheets   # quick preview + contact sheets
python -m wallpapers render -f jpg                 # JPEG instead of PNG (much smaller)
```

Output: `out/<style>/<palette>-desktop.png` and `-mobile.png`;
contact sheets (with `--sheets`) in `out/sheets/<style>.jpg`.

## Sizes

Set in `wallpapers/render.py`:

- desktop 5120x2880 (16:9, 5K; downscales cleanly to 4K/1440p)
- mobile 1290x2796 (19.5:9, iPhone Pro Max; fits all current iPhones, which crop/scale)

## Tweaking

- **Colours / layout seeds:** `wallpapers/palettes.py` (documented at the top).
  Add a palette entry and re-render; no code changes.
- **Look of a style:** `wallpapers/styles/<style>.py`. Each exposes
  `render(w, h, pal, mobile) -> uint8 HxWx3` and reads optional tuning keys
  from the palette dict (e.g. `warp`, `freq`, `grain`, `gain`, `relief`).
  Per-palette overrides go in `palettes.py`.
- **New style:** add a module with `render`, register it in
  `styles/__init__.py`, add palettes under the same key.

## How it works (short)

Smooth styles are computed on a small grid (fast), upscaled bicubically, then
finished at full resolution with grain and/or 1-LSB dither to avoid banding.
Colour ramps interpolate in OKLab so mid-tones stay clean. Flat styles are
drawn directly at full resolution with 1px anti-aliased edges.

## Web port

A browser version (SVG + WebGL, live preview, per-device sizes) is planned: see `PLAN.md`.
Project conventions for Claude Code are in `CLAUDE.md`.
