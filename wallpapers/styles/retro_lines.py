"""Retro Lines: a diagonal band of flat stripes between two solid fields."""
import math

import numpy as np

from ..core import hex_to_rgb, to_uint8


def render(w, h, pal, mobile=False):
    colors = [hex_to_rgb(c) for c in pal["colors"]]
    n = len(colors)
    theta = math.radians(pal.get("angle_m", 62) if mobile else pal.get("angle", 30))
    diag = math.hypot(w, h)

    # signed distance (px) across the stripes: normal points to the bottom-right
    nx, ny = math.sin(theta), math.cos(theta)
    xs = (np.arange(w, dtype=np.float32) + 0.5 - w / 2) * nx
    ys = (np.arange(h, dtype=np.float32) + 0.5 - h / 2) * ny
    u = ys[:, None] + xs[None, :]

    sw = pal.get("stripe", 0.03) * diag
    total = sw * (n - 2)
    start = pal.get("offset", 0.1) * diag - total / 2
    edges = [start + i * sw for i in range(n - 1)]

    img = np.empty((h, w, 3), np.float32)
    img[:] = colors[0]
    for i, e in enumerate(edges):
        a = np.clip(u - e + 0.5, 0.0, 1.0)[..., None]  # 1px AA at each edge
        img += (colors[i + 1] - img) * a
    return to_uint8(img)
