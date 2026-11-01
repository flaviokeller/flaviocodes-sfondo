"""Palette: a row of overlapping rounded pills on a flat background.

Desktop: vertical pills side by side. Mobile: the same composition rotated 90
degrees (horizontal pills stacked top to bottom) so it fills a portrait screen.
"""
import numpy as np

from ..core import ramp, solid, to_uint8


def _draw(w, h, bg, cols, group_w, pill_w, pill_h):
    img = solid(w, h, bg)
    n = len(cols)
    step = (group_w - pill_w) / (n - 1)
    x0 = (w - group_w) / 2 + pill_w / 2
    cy = h / 2
    r = pill_w / 2
    hh = max(pill_h / 2 - r, 0.0)  # half length of straight part
    for i in reversed(range(n)):  # right -> left so the first pill sits on top
        cx = x0 + i * step
        xa, xb = int(max(cx - r - 2, 0)), int(min(cx + r + 3, w))
        ya, yb = int(max(cy - hh - r - 2, 0)), int(min(cy + hh + r + 3, h))
        xs = np.arange(xa, xb, dtype=np.float32)[None, :] + 0.5
        ys = np.arange(ya, yb, dtype=np.float32)[:, None] + 0.5
        dy = np.maximum(np.abs(ys - cy) - hh, 0.0)
        d = np.sqrt((xs - cx) ** 2 + dy ** 2) - r
        a = np.clip(0.5 - d, 0.0, 1.0)[..., None]  # 1px anti-aliased edge
        region = img[ya:yb, xa:xb]
        img[ya:yb, xa:xb] = region + (cols[i] - region) * a
    return img


def render(w, h, pal, mobile=False):
    n = pal.get("n", len(pal["colors"]))
    cols = ramp(np.linspace(0, 1, n), pal["colors"])
    if mobile:
        # draw on a landscape canvas, then rotate
        W, H = h, w
        pill_w = 0.09 * W
        group_w = pill_w * (1 + (n - 1) * 0.55)
        img = _draw(W, H, pal["bg"], cols, group_w, pill_w, 0.82 * H)
        img = np.ascontiguousarray(img.transpose(1, 0, 2))
    else:
        pill_w = 0.095 * w
        group_w = pill_w * (1 + (n - 1) * 0.55)
        img = _draw(w, h, pal["bg"], cols, group_w, pill_w, 0.62 * h)
    return to_uint8(img)
