"""Grainy Gradients: dark canvas, glowing arc or glow, heavy film grain."""
import numpy as np
from scipy.ndimage import gaussian_filter

from ..core import fbm, finish, grid, hex_to_rgb, ramp, upscale


def _arc(g, rng, pal, mobile):
    X, Y, xm, ym = g.X, g.Y, g.xmax, g.ymax
    colors, bg = pal["colors"], pal["bg"]
    cx = xm * 0.5
    R = xm * (0.95 if mobile else 0.85)
    top = ym * (pal.get("top_m", 0.5) if mobile else pal.get("top", 0.38))
    cy = top + R
    d = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2) + 0.012 * fbm(rng, X, Y, 2.5, 2)
    s = R - d  # > 0 below the arc edge
    depth = pal.get("depth", 0.3) * (1.4 if mobile else 1.0)
    inside = ramp(np.clip(s / depth, 0, 1) ** 0.85, colors + [bg])
    sigma = pal.get("halo", 0.035)
    halo = np.exp(np.minimum(s, 0) / sigma)[..., None]
    bgc, hot = hex_to_rgb(bg), hex_to_rgb(colors[0])
    outside = bgc + (hot - bgc) * halo * 0.9
    return np.where((s >= 0)[..., None], inside, outside).astype(np.float32)


def _glow(g, rng, pal, mobile):
    X, Y, xm, ym = g.X, g.Y, g.xmax, g.ymax
    colors, bg = pal["colors"], pal["bg"]
    cx = xm * pal.get("cx", 0.5)
    cy = ym * pal.get("cy", -0.02)
    rx = xm * pal.get("rx", 0.55) * (1.1 if mobile else 1.0)
    ry = ym * pal.get("ry", 0.62) * (0.55 if mobile else 1.0)
    Xw = X + 0.05 * fbm(rng, X, Y, 1.5, 2)
    Yw = Y + 0.05 * fbm(rng, X, Y, 1.5, 2)
    tilt = pal.get("tilt", -0.25)
    dx, dy = Xw - cx, Yw - cy
    u = (dx * np.cos(tilt) + dy * np.sin(tilt)) / rx
    v = (-dx * np.sin(tilt) + dy * np.cos(tilt)) / ry
    q = np.sqrt(u * u + v * v)
    return ramp(q ** pal.get("gamma", 0.9), colors + [bg])


def render(w, h, pal, mobile=False):
    seed = pal.get("seed", 0)
    rng = np.random.default_rng(seed)
    g = grid(w, h, 720)
    img = (_arc if pal.get("mode", "arc") == "arc" else _glow)(g, rng, pal, mobile)
    for c in range(3):
        img[..., c] = gaussian_filter(img[..., c], 1.5)
    return finish(upscale(img, w, h), grain=pal.get("grain", 0.05), seed=seed)
