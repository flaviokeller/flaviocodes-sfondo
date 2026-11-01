# sfondo

Procedural wallpapers, rendered in the browser at any device size: 7 styles × 3 palettes,
for phones and desktops. Every image is deterministic, so the same style, palette and size
always give the same pixels. Flat styles are SVG; smooth styles are WebGL2 shaders.

Styles:

| style | look |
|---|---|
| `blur` | soft, silky swirling colour bands |
| `gradient_blur` | big colour blooms dissolving into deep black |
| `grainy` | dark scene with a glowing arc or glow and heavy film grain |
| `levels` | flat horizontal colour bands stepping through a ramp |
| `palette` | overlapping rounded pills (horizontal on mobile) |
| `influx` | silky, lit wave surfaces |
| `retro_lines` | diagonal band of flat stripes between two solid fields |

Contact sheets for all of them are in [`previews/`](previews).

## Setup

```bash
npm install
npx playwright install chromium   # only needed for export / previews
```

## Use

```bash
npm run dev        # preview: style, palette, device, seed, iOS lock-screen overlay, PNG download
npm run export     # every style x palette -> out-web/<style>/<palette>-<device>.png
npm run export -- --styles blur,influx --palettes aurora --devices desktop,iphone-air,3440x1440
npm run previews   # refresh previews/*.jpg
npm run build      # static site in dist/
```

Export devices: `desktop` (5120×2880), `mobile` (1290×2796), any preset id from
`src/core/devices.ts`, or `WxH` (up to 16384 per side). The full default set takes about
10 seconds on an M1 Pro.

## Palettes

All palettes live in [`src/palettes.json`](src/palettes.json), grouped by style. Add an
entry and it shows up in the preview and export; no code change needed.

Common keys:

- `colors`: hex stops; what they mean depends on the style (below).
- `bg`: background colour, where the style has one.
- `seed`: changes the random layout, never the colours. Use Randomise in the preview to
  find a good one.

Per style (all optional unless noted):

| style | `colors` | other keys |
|---|---|---|
| `blur` | ramp stops (2-8) | `warp` 0.2, `freq` 4.2, `angle` (random) |
| `gradient_blur` | one blob each (up to 8) | `bg`, `warp` 0.22, `gain` 1.3, `angle` (random) |
| `grainy` | ramp from rim to deep (`bg` is appended) | `mode` `arc` or `glow`, `grain` 0.05; arc: `top` 0.38, `top_m` 0.5, `depth` 0.3, `halo` 0.035; glow: `cx` 0.5, `cy` -0.02, `cy_m` (mobile, defaults to `cy`), `rx` 0.55, `ry` 0.62, `tilt` -0.25, `gamma` 0.9 |
| `levels` | ramp anchors | `n` bands |
| `palette` | ramp anchors | `bg` (required), `n` pills |
| `influx` | ramp stops, dark to light | `warp` 0.22, `relief` 0.22, `spec` 0.22, `shade_shift` 0.35 |
| `retro_lines` | first = top-left field, last = bottom-right field, rest = stripes | `angle` 30, `angle_m` 62, `stripe` 0.03, `offset` 0.1 |

Smooth styles also accept `grain` (amplitude of film grain; 0 by default except `grainy`).

## How it works

- Coordinates are in units of `sqrt(w*h)`, so a composition keeps its density on every
  aspect ratio, and a small preview looks like the full-size export.
- Colour ramps interpolate in OKLab, so mid-tones stay clean.
- Shaders end with a 1-LSB dither, so dark gradients don't band at 5K.

More detail, including the measured checks behind these choices, is in
[`docs/architecture.md`](docs/architecture.md).

## Deploy

`netlify.toml` builds the static preview (`npm run build` → `dist/`); PRs get deploy previews.

## License

[MIT](LICENSE)
