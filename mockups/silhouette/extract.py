#!/usr/bin/env python3
"""
Green-screen reference -> clean silhouette + cutout + vector trace.

The studio's silhouette-overlay loop (reforged/tools/silhouette-overlay.mjs)
masks a concept image by a LUMINANCE FLOOR -- great for a bright dragon over
dark water, useless for a BLACK creature on a GREEN screen (the dragon is the
*darkest* thing in frame). This script keys out the green instead, so a
green-screen reference can feed that same compare-against-the-build loop.

Outputs (next to this script):
  cutout.png            green removed, original creature pixels, spill-suppressed
  silhouette-black.png  solid filled shape, black on transparent
  silhouette-white.png  solid filled shape, white on transparent
  trace-overlay.png     original + magenta boundary (accuracy proof)
  silhouette.svg        filled vector trace
  silhouette-outline.svg stroked vector trace

Deps (one-off, not shipped to the game): pillow, numpy, scipy, scikit-image.
Run:  python3 extract.py [source.png]
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure

HERE = os.path.dirname(os.path.abspath(__file__))
SRC  = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "source.png")

# greenness separates a green screen (high) from anything else (<=0 on the
# black dragon). The histogram is sharply bimodal with a wide empty valley,
# so the exact thresholds are not delicate.
T_BG = 60.0   # greenness above this = confidently background
T_FG = 10.0   # greenness below this = confidently creature (soft key between)

def main():
    im = Image.open(SRC).convert("RGB")
    a  = np.asarray(im).astype(np.float32)
    H, W = a.shape[:2]
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    greenness = G - np.maximum(R, B)

    # Background = green pixels CONNECTED TO THE BORDER. Interior green (the
    # Night Fury's eyes) is therefore kept as part of the body -> no holes.
    green = greenness > T_BG
    lbl, _ = ndimage.label(green)
    border = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
    border.discard(0)
    bg = np.isin(lbl, list(border))
    creature = ~bg

    # keep the largest blob, fill pinholes, lightly de-jag the AA edge
    clbl, cn = ndimage.label(creature)
    if cn > 1:
        sizes = ndimage.sum(np.ones_like(clbl), clbl, range(1, cn + 1))
        creature = clbl == (1 + int(np.argmax(sizes)))
    creature = ndimage.binary_fill_holes(creature)
    creature = ndimage.binary_closing(creature, iterations=2)
    creature = ndimage.binary_opening(creature, iterations=1)
    creature = ndimage.binary_fill_holes(creature)

    # --- cutout: soft alpha + green-spill suppression (clamp G to max(R,B)) ---
    alpha = np.clip((T_BG - greenness) / (T_BG - T_FG), 0, 1)
    alpha = np.where(bg & (greenness > T_BG), 0.0, alpha)
    rgb = a.copy()
    rgb[..., 1] = np.minimum(rgb[..., 1], np.maximum(rgb[..., 0], rgb[..., 2]))
    cut = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    Image.fromarray(cut, "RGBA").save(os.path.join(HERE, "cutout.png"))

    # --- solid silhouettes ---
    sa = (creature * 255).astype(np.uint8)
    blk = np.zeros((H, W, 4), np.uint8); blk[..., 3] = sa
    Image.fromarray(blk, "RGBA").save(os.path.join(HERE, "silhouette-black.png"))
    wht = np.full((H, W, 4), 255, np.uint8); wht[..., 3] = sa
    Image.fromarray(wht, "RGBA").save(os.path.join(HERE, "silhouette-white.png"))

    # --- accuracy proof: magenta boundary over the original ---
    edge = creature ^ ndimage.binary_erosion(creature, iterations=2)
    prev = np.asarray(im).astype(np.uint8).copy(); prev[edge] = [255, 0, 255]
    Image.fromarray(prev, "RGB").save(os.path.join(HERE, "trace-overlay.png"))

    # --- vector trace: marching squares + Douglas-Peucker ---
    contours = sorted(measure.find_contours(creature.astype(float), 0.5),
                      key=len, reverse=True)
    simp = measure.approximate_polygon(contours[0], tolerance=1.2)  # (y, x)
    d = "M " + " L ".join(f"{x:.1f},{y:.1f}" for y, x in simp) + " Z"
    head = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
    open(os.path.join(HERE, "silhouette.svg"), "w").write(
        f'{head}\n  <path d="{d}" fill="#000" fill-rule="evenodd"/>\n</svg>\n')
    open(os.path.join(HERE, "silhouette-outline.svg"), "w").write(
        f'{head}\n  <path d="{d}" fill="none" stroke="#000" stroke-width="3" stroke-linejoin="round"/>\n</svg>\n')

    print(f"coverage {100*creature.mean():.1f}%  outline {len(simp)} verts")

if __name__ == "__main__":
    main()
