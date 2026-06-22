# Creature silhouette — green-screen reference trace

A clean silhouette traced from a green-screen Night Fury (Toothless) reference,
plus the same shape as a cutout and a vector outline. Produced by
[`extract.py`](./extract.py) — re-run it on any green-screen reference.

| file | what it is |
|------|-----------|
| `source.png` | the original green-screen reference (input) |
| `silhouette-black.png` / `silhouette-white.png` | **solid filled silhouette**, on transparent — the accurate full-creature trace |
| `silhouette.svg` / `silhouette-outline.svg` | vector trace of the same shape (384-vert path) |
| `cutout.png` | the **inverse of the green background**: creature kept, green keyed out, green-spill suppressed |
| `trace-overlay.png` | the original with a magenta boundary drawn — the accuracy proof |

## How it works

The green screen is keyed out by **greenness** (`G − max(R, B)`), which is high
on the background and `≤ 0` on the black dragon — a sharply bimodal split with a
wide empty valley, so the thresholds aren't delicate. Background is the green
region **connected to the image border**, so interior green (the Night Fury's
green eyes) stays part of the body instead of punching holes. The mask is then
hole-filled, reduced to its largest blob, and lightly de-jagged before tracing.

## Why this exists / how it plugs in

The studio's silhouette-overlay loop
(`reforged/tools/silhouette-overlay.mjs`) masks a concept image by a **luminance
floor** — perfect for a bright dragon over dark water, but useless for a
**black** creature on a **green** screen, where the dragon is the *darkest*
thing in frame. Chroma-keying the green produces a clean concept mask for that
same compare-against-the-build loop, for any green-screen reference.

## Regenerate

```bash
pip install pillow numpy scipy scikit-image   # one-off; not shipped to the game
python3 extract.py [source.png]
```
