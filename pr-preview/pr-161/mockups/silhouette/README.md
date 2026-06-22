# Creature silhouette — reference traces

Silhouette traces of Night Fury (Toothless) references. Two sources, two methods
— the right extractor depends on whether the background is separable:

- **Green-screen reference** → chroma key ([`extract.py`](./extract.py))
- **Busy in-game screenshot** → neural matte ([`ingame-extract.py`](./ingame-extract.py))

## A. Green-screen reference (`extract.py`)

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

```bash
pip install pillow numpy scipy scikit-image   # one-off; not shipped to the game
python3 extract.py [source.png]
```

## B. Busy in-game screenshot (`ingame-extract.py`)

| file | what it is |
|------|-----------|
| `ingame-source.jpeg` | rear-view in-game screenshot (input) |
| `ingame-silhouette-black.png` / `ingame-silhouette-white.png` | solid filled silhouette |
| `ingame-silhouette.svg` / `ingame-silhouette-outline.svg` | vector trace (232-vert path) |
| `ingame-cutout.png` | creature on transparency (neural matte) |
| `ingame-trace-overlay.png` | original + magenta boundary (accuracy proof) |

An in-game frame has **no separable background**: the dragon is dark and so are
big parts of the scene (shadowed floor, vignette, distant pillars, letterbox
bars), and the dragon is lit to nearly floor brightness in places. Chroma-key,
luminance/warmth thresholds, and GrabCut all failed — the dragon is connected to
a sea of dark background. A **neural saliency model** (`rembg` /
`isnet-general-use`) finds the foreground object regardless of background and
traces it cleanly (~19.5% coverage; wings, head, body, and the tail-to-fin all
captured).

```bash
pip install rembg onnxruntime pillow numpy scipy scikit-image  # one-off
python3 ingame-extract.py [ingame-source.jpeg]   # 1st run downloads ~170MB model
```

## How it plugs in

The studio's silhouette-overlay loop (`reforged/tools/silhouette-overlay.mjs`)
masks a concept image by a **luminance floor** — perfect for a bright dragon
over dark water, but it inverts for a **black** dragon on a **green** screen
(dragon = darkest in frame), and gives up entirely on a busy in-game scene. The
right masker depends on the source: **chroma key** when the background is one
flat colour, **neural matte** when it isn't. Both produce a clean rear/side
silhouette that the compare-against-the-build loop can score against.
