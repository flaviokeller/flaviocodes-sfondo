"""Gradient Blur: big soft colour blooms dissolving into deep black."""
import numpy as np
from scipy.ndimage import gaussian_filter

from ..core import fbm, finish, grid, hex_to_rgb, upscale


def render(w, h, pal, mobile=False):
    seed = pal.get("seed", 0)
    rng = np.random.default_rng(seed)
    g = grid(w, h, 640)
    X, Y = g.X, g.Y
    colors = [hex_to_rgb(c) for c in pal["colors"]]
    bg = hex_to_rgb(pal.get("bg", "#030206"))

    amp = pal.get("warp", 0.22)
    Xw = X + amp * fbm(rng, X, Y, 1.1, 3)
    Yw = Y + amp * fbm(rng, X, Y, 1.1, 3)

    size = (g.xmax + g.ymax) / 2
    # place blobs along a rough diagonal sweep so colours flow into each other
    n = len(colors)
    th = pal.get("angle", rng.uniform(0.3, 1.2))
    wsum = np.zeros_like(X)
    acc = np.zeros(X.shape + (3,), np.float32)
    for i, col in enumerate(colors):
        f = (i + 0.5) / n
        cx = g.xmax * (0.1 + 0.8 * (f if not mobile else rng.uniform(0.1, 0.9))) + rng.normal(0, 0.05)
        cy = g.ymax * (0.1 + 0.8 * (1 - f if not mobile else f)) + rng.normal(0, 0.05)
        rx = size * rng.uniform(0.3, 0.55)
        ry = size * rng.uniform(0.14, 0.28)
        a = th + rng.normal(0, 0.35)
        dx, dy = Xw - cx, Yw - cy
        u = (dx * np.cos(a) + dy * np.sin(a)) / rx
        v = (-dx * np.sin(a) + dy * np.cos(a)) / ry
        wi = np.exp(-(u * u + v * v) * 1.3)
        wsum += wi
        acc += wi[..., None] * col
    color = acc / (wsum[..., None] + 1e-6)
    cov = 1.0 - np.exp(-pal.get("gain", 1.3) * wsum)
    cov = cov ** 1.6  # deeper blacks, punchier colour
    img = bg + cov[..., None] * (color - bg)
    for c in range(3):
        img[..., c] = gaussian_filter(img[..., c], 1.5)
    return finish(upscale(img, w, h), grain=pal.get("grain", 0.0), seed=seed)
