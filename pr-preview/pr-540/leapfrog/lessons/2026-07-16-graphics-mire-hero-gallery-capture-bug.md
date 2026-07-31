# Mire hero gallery: the studio capture bug that made every option look like option A

**Context:** Owner reset the Lumen Mire hero to "obvious glow" and asked for renders of
several hero shapes to *choose from*. I built 4 parked candidates (archway / world-tree /
mushroom / swamp-blooms) and a studio driver that wrote a per-candidate PNG plus a stacked
comparison sheet, then sent them.

## The gotcha (two compounding presentation bugs, zero code-logic bugs)

The owner replied: **"u literally just did a and b only."** The candidates were fine — the
*delivery* was broken in two ways, and both are easy to miss because the archetypes
themselves built and passed every gate:

1. **The per-candidate screenshot always captured cell 0.** The driver did
   `page.screenshot({ clip: {x:0,y:0,width:CELL,height:CELL} })` after compositing each
   candidate into its sheet cell. But the sheet canvas is a `display:block` overlay pinned
   at `0,0`, so clipping the viewport top-left grabs **sheet cell 0 (candidate A) every
   time** — all four `/tmp/mire-cand-*.png` files came out byte-identical (same file size
   was the tell). Fix: grab the actual GL canvas via `gl.toDataURL()`
   (`preserveDrawingBuffer` is already on) exposed as `window.psGrab()`, not a viewport clip
   the overlay can clobber.
2. **A tall stacked sheet truncates on display.** The comparison sheet was 2 cols × 4 rows.
   At `deviceScaleFactor:2` it's ~2480×4960; the viewer/Read only shows the top band, so the
   owner saw rows A + B and nothing below. Fix: a **compact square gallery (2×2)** fits all
   four in one non-truncating image.

**Reusable rule:** when a studio composites into an overlay canvas AND writes individual
files, capture the individual files off the GL canvas directly (`toDataURL`), and keep any
multi-item gallery **square-ish (≤2 rows)** so it survives display downscaling. A byte-for-byte
identical file size across "different" renders means you're capturing the same pixels.

## The design half: "mushroom done right" for a top-down chase cam

The first candCap repeated the shipped hero's fatal move — glow on the cap *underside*, which
the elevated down-looking chase cam occludes behind the dark cap (reads dark = "random
pixels"). For **obvious glow you put the emitter where the gameplay camera looks: on top.**
candCap redesigned = glowing cap **dome** + bright crown boss on top + a thin dark gill-rim
band and dark stalk purely for silhouette definition. Now it reads as a glowing mushroom from
above. (Kept ≤150 tris: sphere dome 9×3 half, rim 9-seg open, boss 6×3 = 111 tris.)

## What it unlocks

The owner can now actually see and pick the hero. Whatever they choose gets sculpted up from
its parked candidate; the losers get deleted. The capture fix also hardens `mireherostudio`
for every future multi-option render.
