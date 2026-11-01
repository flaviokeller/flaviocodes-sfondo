"""Shared helpers: colour handling, smooth noise, upscaling, grain, output."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates

# --------------------------------------------------------------------------
# Colour
# --------------------------------------------------------------------------

_M1 = np.array(
    [[0.4122214708, 0.5363325363, 0.0514459929],
     [0.2119034982, 0.6806995451, 0.1073969566],
     [0.0883024619, 0.2817188376, 0.6299787005]], dtype=np.float64)
_M2 = np.array(
    [[0.2104542553, 0.7936177850, -0.0040720468],
     [1.9779984951, -2.4285922050, 0.4505937099],
     [0.0259040371, 0.7827717662, -0.8086757660]], dtype=np.float64)
_M1_INV = np.linalg.inv(_M1).astype(np.float32)
_M2_INV = np.linalg.inv(_M2).astype(np.float32)
_M1 = _M1.astype(np.float32)
_M2 = _M2.astype(np.float32)


def hex_to_rgb(h: str) -> np.ndarray:
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255.0


def srgb_to_lin(c):
    c = np.asarray(c, dtype=np.float32)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(np.float32)


def lin_to_srgb(c):
    c = np.clip(c, 0.0, 1.0).astype(np.float32)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055).astype(np.float32)


def rgb_to_oklab(rgb):
    lms = srgb_to_lin(rgb) @ _M1.T
    return np.cbrt(lms) @ _M2.T


def oklab_to_rgb(lab):
    lms = (lab @ _M2_INV.T) ** 3
    return lin_to_srgb(lms @ _M1_INV.T)


def ramp(t, colors) -> np.ndarray:
    """Map scalar field ``t`` (0..1, any shape) through evenly spaced colour stops.

    Interpolation happens in OKLab so mid-tones stay clean (no muddy greys).
    Returns float32 sRGB of shape ``t.shape + (3,)``.
    """
    labs = np.stack([rgb_to_oklab(hex_to_rgb(c)) for c in colors]).astype(np.float32)
    pos = np.linspace(0.0, 1.0, len(colors))
    t = np.clip(t, 0.0, 1.0)
    out = np.stack([np.interp(t, pos, labs[:, k]) for k in range(3)], axis=-1)
    return oklab_to_rgb(out.astype(np.float32))


def solid(w: int, h: int, hex_color: str) -> np.ndarray:
    return np.broadcast_to(hex_to_rgb(hex_color), (h, w, 3)).copy()


# --------------------------------------------------------------------------
# Coordinate grid + smooth noise
# --------------------------------------------------------------------------

@dataclass
class Grid:
    X: np.ndarray
    Y: np.ndarray
    xmax: float
    ymax: float


def grid(w: int, h: int, work: int = 640) -> Grid:
    """Low-res coordinate grid. Units are sqrt(w*h), so shape density feels the
    same on desktop and mobile. Smooth styles render here and get upscaled."""
    s = work / max(w, h)
    ww, hh = max(2, round(w * s)), max(2, round(h * s))
    unit = (w * h) ** 0.5
    xmax, ymax = w / unit, h / unit
    xs = (np.arange(ww) + 0.5) / ww * xmax
    ys = (np.arange(hh) + 0.5) / hh * ymax
    X, Y = np.meshgrid(xs, ys)
    return Grid(X.astype(np.float32), Y.astype(np.float32), xmax, ymax)


def noise(rng, X, Y, freq):
    """Smooth value noise (cubic), roughly unit variance, sampled at X/Y."""
    gx = int(np.ceil(float(X.max()) * freq)) + 4
    gy = int(np.ceil(float(Y.max()) * freq)) + 4
    lat = rng.standard_normal((gy, gx)).astype(np.float32)
    coords = np.stack([Y * freq + 1.5, X * freq + 1.5]).astype(np.float32)
    return map_coordinates(lat, coords, order=3, mode="nearest")


def fbm(rng, X, Y, freq, octaves=3, gain=0.5):
    tot, amp, norm = 0.0, 1.0, 0.0
    for o in range(octaves):
        tot = tot + amp * noise(rng, X, Y, freq * 2 ** o)
        norm += amp * amp
        amp *= gain
    return (tot / np.sqrt(norm)).astype(np.float32)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


# --------------------------------------------------------------------------
# Upscale / grain / output
# --------------------------------------------------------------------------

def upscale(img: np.ndarray, w: int, h: int) -> np.ndarray:
    """Bicubic upscale of a float32 HxWx3 image (smooth content only)."""
    chans = [
        np.asarray(Image.fromarray(np.ascontiguousarray(img[..., c], dtype=np.float32))
                   .resize((w, h), Image.BICUBIC))
        for c in range(3)
    ]
    return np.clip(np.stack(chans, axis=-1), 0.0, 1.0)


def finish(img: np.ndarray, grain: float = 0.0, dither: bool = True, seed: int = 0) -> np.ndarray:
    """Add film grain and/or 1-LSB dither (kills banding), return uint8 RGB."""
    h, w, _ = img.shape
    rng = np.random.default_rng(seed + 12345)
    img = img.astype(np.float32, copy=True)
    if grain > 0:
        # grain gets a bit coarser on big canvases so it survives downscaling
        gs = max(1.0, max(w, h) / 3000.0)
        gh, gw = max(2, round(h / gs)), max(2, round(w / gs))
        n = rng.standard_normal((gh, gw), dtype=np.float32)
        if (gh, gw) != (h, w):
            n = np.asarray(Image.fromarray(n).resize((w, h), Image.BILINEAR))
        img += (n * grain)[..., None]
    if dither:
        img += (rng.random(img.shape, dtype=np.float32) - 0.5) / 255.0
    return (np.clip(img, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8)


def to_uint8(img: np.ndarray) -> np.ndarray:
    return (np.clip(img, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8)
