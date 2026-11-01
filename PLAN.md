# PLAN: web port (SVG, CSS, JS, WebGL)

Goal: a browser-based version of the same seven styles that renders at any device size,
with a live preview and a batch PNG export. It supplements the Python generator and may
replace it later. Rewriting the Python code is explicitly fine.

## Why

- One scene function per style, parameterised by `(width, height, palette)`: device sizes
  become data, not code paths.
- Live preview (style, palette, device) instead of render-and-look.
- Flat styles become tiny resolution-independent SVG.

## Decisions (already made, revisit only with a reason)

| Topic | Decision |
|---|---|
| Tooling | Vite + TypeScript, no UI framework. Plain DOM for the preview page. |
| Flat styles (`levels`, `palette`, `retro_lines`) | Pure functions returning an SVG string. |
| Smooth styles (`blur`, `gradient_blur`, `grainy`, `influx`) | WebGL2 fragment shaders on a full-screen quad. Not pure CSS: swirling bands and lit silk cannot be done cleanly in CSS/SVG, and shaders give identical results across browsers. |
| Export | Playwright script: open the page at the exact device size, grab PNG. In-browser "download" button uses `canvas.toBlob` / SVG rasterisation. |
| Randomness | Seeded PRNG in JS (mulberry32). Layouts will NOT match the Python ones because NumPy's generator and noise lattice differ. That is accepted; match the look, not the pixels. |
| Palettes | `web/palettes.json`, generated from `wallpapers/palettes.py` by `scripts/export_palettes.py`. After the port stabilises, flip it: JSON becomes the source of truth and Python reads it. |
| Colour | Ramps interpolate in OKLab (port `core.py`: `rgb_to_oklab`, `oklab_to_rgb`, `ramp`). Do it in JS for SVG styles and in GLSL for shaders. |

## Device presets (data, `web/src/devices.ts`)

Native pixel sizes; double-check any you are unsure about before shipping:

| Name | Size |
|---|---|
| iPhone 15/16 | 1179x2556 |
| iPhone 15 Pro Max / 16 Plus | 1290x2796 |
| iPhone 16 Pro | 1206x2622 |
| iPhone 16 Pro Max | 1320x2868 |
| MacBook Air 13 | 2560x1664 |
| MacBook Pro 14 | 3024x1964 |
| MacBook Pro 16 | 3456x2234 |
| 4K 16:9 | 3840x2160 |
| 5K 16:9 | 5120x2880 |
| Ultrawide | 3440x1440 |

`mobile` = height > width. Styles may adapt layout by aspect ratio rather than device name.

## Status

- [x] 0. Scaffold (`npm run check:ramp`: JS ramp matches Python within 0.001/255)
- [x] 1. SVG styles (`levels` pixel-exact vs Python; `palette`, `retro_lines` differ only on AA edges)
- [ ] 2. WebGL harness
- [ ] 3. Shader styles
- [ ] 4. Preview UI (a minimal one exists: style/palette/device selects; `?bare&w=&h=` renders at exact size)
- [ ] 5. Batch export
- [ ] 6. Decide the future of Python

## Phases

### 0. Scaffold
- `web/`: Vite + TS project, `npm run dev`, Playwright as dev dependency.
- `src/core/`: `prng.ts` (mulberry32), `color.ts` (OKLab ramp), `devices.ts`, `palettes.ts` (typed JSON).
- Acceptance: dev server runs; a test page prints a ramp swatch that matches Python's `ramp()` output for one palette.

### 1. SVG styles (easy, do first)
Port from `wallpapers/styles/`:

- **levels**: `n` equal-height horizontal rects; colours = ramp(linspace(0,1,n), anchors).
- **retro_lines**: diagonal band. Angle 30 degrees desktop, 62 degrees mobile. Normal = (sin, cos).
  Stripe width = 0.03 x diagonal; band centre offset 0.1 x diagonal from the canvas centre;
  `colors[0]` fills one side, `colors[-1]` the other, the middle colours are stripes.
  Build with clipped polygons or a rotated `<g>` with rects. Avoid 1px seams.
- **palette** (pills): `n` rounded rects (rx = half width), painted right to left so the first
  is on top. Desktop: pill width 0.095 x w, step 0.55 x pill width, pill height 0.62 x h, group centred.
  Mobile: same composition rotated 90 degrees: pill width 0.09 x h, pill height 0.82 x w,
  stacked top to bottom. Use `viewBox` + `preserveAspectRatio="xMidYMid slice"` where it helps.
- Acceptance: all 3 palettes x desktop/mobile visually match `previews/{levels,palette,retro_lines}.jpg`.

### 2. WebGL harness
- `src/gl/`: tiny helper (compile program, full-screen triangle, uniforms, render to a canvas of
  exact `width x height`). `preserveDrawingBuffer: true` for export. Check max texture/canvas size.
- Shared GLSL chunk: hash-based value noise (cubic/quintic), `fbm`, OKLab `ramp` with up to ~6 stops
  as a uniform array, `smoothstep`, dither (+/- 0.5/255 noise), film grain.
- Coordinates: units of `sqrt(w*h)`, same as Python (`xmax = w/unit`, `ymax = h/unit`).
- Acceptance: a flat OKLab ramp renders without visible banding at 5120x2880.

### 3. Shader styles (port one at a time, compare against the Python preview sheets)
- **grainy** (easiest): `arc` mode: circle centre x = 0.5 xmax, R = 0.85 xmax (0.95 mobile), top of arc
  at y = 0.38 ymax (0.5 mobile); `s = R - d` with `d` perturbed by 0.012 x fbm(2.5). Inside: ramp over
  `[colors..., bg]` at `t = clamp(s/depth)^0.85` (depth 0.3, x1.4 mobile). Outside: halo
  `exp(min(s,0)/0.035)`, mixed from `bg` toward `colors[0]` at 0.9. `glow` mode: elliptical radial
  ramp, centre (0.5 xmax, -0.02 ymax), tilt -0.25. Grain: gaussian luma noise, amplitude 0.05, grain
  size = max(1, max(w,h)/3000) pixels.
- **blur**: domain warp with fbm (freq 0.9, 2 octaves, amp 0.2); `proj = dot(warped, dir(angle))`;
  `t = 0.5 + 0.5 sin(proj*4.2 + 1.6*fbm + phase)`; `ramp(t)`; soft blur is implicit (smooth math),
  no post blur needed.
- **gradient_blur**: per colour an anisotropic gaussian blob (rx 0.3-0.55, ry 0.14-0.28 of
  `size=(xmax+ymax)/2`, random angle near the sweep angle), weights `exp(-q*1.3)`; colour =
  weighted average; coverage = `(1 - exp(-1.3 * sum(w)))^1.6`; result = `bg + cov*(colour-bg)`.
  Blob centres/angles come from the seeded PRNG on the CPU, passed as uniforms.
- **influx**: height field = 3 warped sine swells (warp amp 0.22, k in 2.5-5.5, 0.9x on mobile);
  normals from analytic or finite-difference gradient (relief 0.22); Lambert + specular (power 40,
  light (-0.45,-0.55,0.7)); colour = `ramp(0.5 + 0.5 tanh(0.9 H + 0.35 warp_x))`, shade = 0.5 + 0.65 lambert, + 0.22 specular.
  This is the weakest style: improve while porting (less muddy darks, cleaner ribbons) rather than copying bugs.
- Acceptance per style: 3 palettes x desktop/mobile look at least as good as `previews/<style>.jpg`.

### 4. Preview UI
- Single page: selects for style, palette, device (plus "custom WxH"); live canvas/SVG scaled to fit;
  seed field + "randomise"; download PNG button; a toggle for a mock iOS lock-screen overlay
  (clock area, Dynamic Island) to check mobile composition.
- Grid view: all devices for the chosen style/palette at once.

### 5. Batch export
- `npm run export`: Playwright loops style x palette x device (default: desktop 5120x2880 and
  mobile 1290x2796, configurable) and writes `out-web/<style>/<palette>-<device>.png`.
  `out-web/` is git-ignored.
- Acceptance: the full set renders in a few minutes; spot-check 5K output for banding and seams.

### 6. Decide the future of Python
- If the web output is as good or better: keep Python only as a reference, or remove it.
- Either way, keep one palette source of truth and say which one in `CLAUDE.md`.

## Pitfalls to watch

- **Banding**: 8-bit gradients band visibly on dark scenes. Always dither in the shader, and
  add a noise overlay for any CSS gradient fallback.
- **Big canvases**: 5K WebGL canvases are fine on desktop GPUs but check `MAX_RENDERBUFFER_SIZE`;
  tile the render if needed.
- **SVG filters at 5K** (`feTurbulence`, `feGaussianBlur`) are slow and differ between browsers;
  do not use them for the smooth styles. Fine only for small decorative effects.
- **Seam artefacts** on rotated/clipped SVG stripes: overlap shapes by ~1px or use a shared edge.
- **Grain survives resize only if sized in output pixels**: generate it at export resolution.
- **Randomness is not shared** between Python and JS; do not promise identical layouts.

## Open questions for the owner

- Keep both implementations long term, or retire Python once the web version is good enough?
- Which devices actually matter (current phone, MacBook size, any external display)?
- Should wallpapers also be offered as live/animated backgrounds (the shader approach makes this
  nearly free for blur, gradient_blur and influx)? Out of scope unless asked.
