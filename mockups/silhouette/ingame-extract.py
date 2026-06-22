#!/usr/bin/env python3
"""
Busy in-game screenshot -> silhouette + cutout + vector trace.

Unlike the green-screen reference (see extract.py), an in-game frame has NO
separable background: the dragon is dark and so are large parts of the scene
(shadowed floor, vignette, distant pillars, letterbox bars), and the dragon is
lit to nearly floor brightness in places. Chroma-key and luminance/warmth
thresholds + GrabCut all failed to separate it (the dragon is connected to a
sea of dark background). A neural saliency model (rembg / isnet-general-use)
finds the foreground object regardless of background and nails it.

Outputs (next to this script, ingame- prefixed):
  ingame-cutout.png            creature on transparency (neural matte)
  ingame-silhouette-black.png  solid filled shape, black on transparent
  ingame-silhouette-white.png  solid filled shape, white on transparent
  ingame-trace-overlay.png     original + magenta boundary (accuracy proof)
  ingame-silhouette.svg        filled vector trace
  ingame-silhouette-outline.svg stroked vector trace

Deps (one-off, not shipped to the game): rembg, onnxruntime, pillow, numpy,
scipy, scikit-image. First run downloads the isnet-general-use model (~170MB).
Run:  python3 ingame-extract.py [ingame-source.jpeg]
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure
from rembg import remove, new_session

HERE = os.path.dirname(os.path.abspath(__file__))
SRC  = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "ingame-source.jpeg")
MODEL = "isnet-general-use"   # sharper object boundaries than u2net for this scene

def main():
    inp = Image.open(SRC).convert("RGB")
    W, H = inp.size

    cut = remove(inp, session=new_session(MODEL)).convert("RGBA")
    cut.save(os.path.join(HERE, "ingame-cutout.png"))

    m = np.asarray(cut)[..., 3] > 128
    # keep the largest blob, fill interior holes, lightly de-noise the matte edge
    lbl, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
        m = lbl == (1 + int(np.argmax(sizes)))
    m = ndimage.binary_fill_holes(m)
    m = ndimage.binary_closing(m, iterations=2)
    m = ndimage.binary_opening(m, iterations=1)
    m = ndimage.binary_fill_holes(m)

    sa = (m * 255).astype(np.uint8)
    blk = np.zeros((H, W, 4), np.uint8); blk[..., 3] = sa
    Image.fromarray(blk, "RGBA").save(os.path.join(HERE, "ingame-silhouette-black.png"))
    wht = np.full((H, W, 4), 255, np.uint8); wht[..., 3] = sa
    Image.fromarray(wht, "RGBA").save(os.path.join(HERE, "ingame-silhouette-white.png"))

    edge = m ^ ndimage.binary_erosion(m, iterations=2)
    prev = np.asarray(inp).astype(np.uint8).copy(); prev[edge] = [255, 0, 255]
    Image.fromarray(prev, "RGB").save(os.path.join(HERE, "ingame-trace-overlay.png"))

    contours = sorted(measure.find_contours(m.astype(float), 0.5), key=len, reverse=True)
    simp = measure.approximate_polygon(contours[0], tolerance=1.2)  # (y, x)
    d = "M " + " L ".join(f"{x:.1f},{y:.1f}" for y, x in simp) + " Z"
    head = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
    open(os.path.join(HERE, "ingame-silhouette.svg"), "w").write(
        f'{head}\n  <path d="{d}" fill="#000" fill-rule="evenodd"/>\n</svg>\n')
    open(os.path.join(HERE, "ingame-silhouette-outline.svg"), "w").write(
        f'{head}\n  <path d="{d}" fill="none" stroke="#000" stroke-width="3" stroke-linejoin="round"/>\n</svg>\n')

    print(f"coverage {100*m.mean():.1f}%  outline {len(simp)} verts")

if __name__ == "__main__":
    main()
