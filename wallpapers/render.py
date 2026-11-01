"""Job planning, rendering and contact sheets."""
from __future__ import annotations

from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from PIL import Image

from .palettes import PALETTES
from .styles import STYLES

# Desktop 16:9 at 5K. Mobile = 19.5:9 modern iPhone (Pro Max logical pixels,
# scales down cleanly to the standard 6.1" models).
DESKTOP = (5120, 2880)
MOBILE = (1290, 2796)


def plan(styles=None, palette=None, devices=("desktop", "mobile")):
    jobs = []
    for style in styles or STYLES:
        for name in PALETTES[style]:
            if palette and name != palette:
                continue
            for dev in devices:
                jobs.append((style, name, dev))
    return jobs


def _size(dev, scale):
    w, h = DESKTOP if dev == "desktop" else MOBILE
    return max(16, round(w * scale)), max(16, round(h * scale))


def render_one(job, out_dir, scale=1.0, fmt="png"):
    style, name, dev = job
    w, h = _size(dev, scale)
    arr = STYLES[style](w, h, PALETTES[style][name], mobile=(dev == "mobile"))
    path = Path(out_dir) / style / f"{name}-{dev}.{fmt}"
    path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.fromarray(arr)
    if fmt == "png":
        img.save(path, compress_level=6)
    else:
        img.save(path, quality=95, subsampling=0)
    return str(path)


def render_all(jobs, out_dir, scale=1.0, fmt="png", workers=2):
    if workers <= 1:
        return [render_one(j, out_dir, scale, fmt) for j in jobs]
    with ProcessPoolExecutor(workers) as ex:
        futs = [ex.submit(render_one, j, out_dir, scale, fmt) for j in jobs]
        return [f.result() for f in futs]


def contact_sheet(out_dir, sheet_dir, styles=None, fmt="png", thumb=360, pad=24):
    """One image per style: desktop thumbnails on top, mobile below."""
    sheet_dir = Path(sheet_dir)
    sheet_dir.mkdir(parents=True, exist_ok=True)
    made = []
    for style in styles or STYLES:
        names = list(PALETTES[style])
        rows = []
        for dev in ("desktop", "mobile"):
            ims = []
            for n in names:
                p = Path(out_dir) / style / f"{n}-{dev}.{fmt}"
                if p.exists():
                    im = Image.open(p).convert("RGB")
                    im.thumbnail((thumb * 2, thumb) if dev == "desktop" else (thumb, thumb * 2),
                                 Image.LANCZOS)
                    ims.append(im)
            if ims:
                rows.append(ims)
        if not rows:
            continue
        width = pad + sum(im.width + pad for im in max(rows, key=lambda r: sum(i.width for i in r)))
        height = pad + sum(max(i.height for i in r) + pad for r in rows)
        sheet = Image.new("RGB", (width, height), (240, 240, 240))
        y = pad
        for r in rows:
            x = pad
            for im in r:
                sheet.paste(im, (x, y))
                x += im.width + pad
            y += max(i.height for i in r) + pad
        path = sheet_dir / f"{style}.jpg"
        sheet.save(path, quality=90)
        made.append(str(path))
    return made
