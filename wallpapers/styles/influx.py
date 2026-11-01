"""Influx: silky, flowing wave surfaces with soft lighting."""
import numpy as np
from scipy.ndimage import gaussian_filter

from ..core import fbm, finish, grid, ramp, upscale


def render(w, h, pal, mobile=False):
    seed = pal.get("seed", 0)
    rng = np.random.default_rng(seed)
    g = grid(w, h, 1100)
    X, Y = g.X, g.Y

    amp = pal.get("warp", 0.22)
    wx = fbm(rng, X, Y, 0.9, 3)
    Xw = X + amp * wx
    Yw = Y + amp * fbm(rng, X, Y, 0.9, 3)

    # height field: a few warped sine "swells"
    H = np.zeros_like(X)
    base = rng.uniform(0, np.pi)
    for i in range(3):
        th = base + rng.normal(0, 0.5)
        k = rng.uniform(2.5, 5.5) * (0.9 if mobile else 1.0)
        a = rng.uniform(0.7, 1.0) / (1 + 0.35 * i)
        H += a * np.sin(k * (Xw * np.cos(th) + Yw * np.sin(th)) + rng.uniform(0, 6.28))
    H = gaussian_filter(H, 1.0)

    # normals -> diffuse + specular
    dx = g.xmax / X.shape[1]
    gy, gx = np.gradient(H, dx)
    s = pal.get("relief", 0.22)
    nx, ny, nz = -s * gx, -s * gy, np.ones_like(H)
    inv = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx * inv, ny * inv, nz * inv
    L = np.array([-0.45, -0.55, 0.7], np.float32)
    L /= np.linalg.norm(L)
    Hh = L + np.array([0, 0, 1], np.float32)
    Hh /= np.linalg.norm(Hh)
    lam = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1)
    spec = np.clip(nx * Hh[0] + ny * Hh[1] + nz * Hh[2], 0, 1) ** 40

    t = 0.5 + 0.5 * np.tanh(0.9 * H + 0.35 * wx)
    base_col = ramp(t, pal["colors"])
    shade = 0.5 + 0.65 * lam
    img = base_col * shade[..., None] + spec[..., None] * pal.get("spec", 0.22)
    return finish(upscale(img, w, h), grain=pal.get("grain", 0.0), seed=seed)
