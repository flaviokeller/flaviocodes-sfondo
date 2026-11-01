"""Color Levels: flat horizontal bands stepping through a colour ramp."""
import numpy as np

from ..core import hex_to_rgb, ramp, to_uint8


def render(w, h, pal, mobile=False):
    colors = pal["colors"]
    n = pal.get("n", len(colors))
    bands = ramp(np.linspace(0, 1, n), colors)  # (n, 3)
    rows = (np.arange(h) * n) // h
    img = np.broadcast_to(bands[rows][:, None, :], (h, w, 3))
    return to_uint8(img)
