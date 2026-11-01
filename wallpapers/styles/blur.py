"""Blur: soft, colourful, swirling bands (inspired by 'Blur Wallpapers 01')."""
import numpy as np
from scipy.ndimage import gaussian_filter

from ..core import fbm, finish, grid, ramp, upscale


def render(w, h, pal, mobile=False):
    seed = pal.get("seed", 0)
    rng = np.random.default_rng(seed)
    g = grid(w, h, 640)
    X, Y = g.X, g.Y

    # domain warp -> flowing, silky bands
    amp = pal.get("warp", 0.2)
    Xw = X + amp * fbm(rng, X, Y, 0.9, 2)
    Yw = Y + amp * fbm(rng, X, Y, 0.9, 2)

    th = pal.get("angle", rng.uniform(0, np.pi))
    proj = Xw * np.cos(th) + Yw * np.sin(th)
    freq = pal.get("freq", 4.2)
    t = 0.5 + 0.5 * np.sin(proj * freq + 1.6 * fbm(rng, X, Y, 0.9, 2) + rng.uniform(0, 6.28))

    img = ramp(t, pal["colors"])
    for c in range(3):
        img[..., c] = gaussian_filter(img[..., c], pal.get("blur", 3.0))
    return finish(upscale(img, w, h), grain=pal.get("grain", 0.0), seed=seed)
