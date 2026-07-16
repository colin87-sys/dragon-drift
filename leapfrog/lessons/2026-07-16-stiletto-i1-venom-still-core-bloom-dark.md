# 2026-07-16 — Stiletto I1: the VENOM STILL, and inverting the sac value structure

**Did / learned.** Built `chitinWaspTorso` for real — the three-mass wasp aft (proud
shingled THORAX → the pinched wasp-WAIST → the telescoping GASTER) + the draconic prow
(collared neck + one tucked raptorial forelimb pair) + THE VENOM STILL (3 hex sac windows
whose fill rises up the BREWING ladder). The first colour build put the translucent WALL
(opacity 0.72, dark tint) IN FRONT of the emissive fill and inset the fill behind it — so
the harsh Fable gate (3.4/5, FAIL) correctly read **inverted value structure**: the sac
INTERIOR was near-black and only a thin magenta rim/meniscus glowed on the segment seams —
the exact LED-strip / painted-seam cheap tell. The motif — the whole point of the
increment — was the weakest thing on the model.

The one-revise fix (→ passed): **rebuild the sac core→bloom→dark in depth order, surface
outward** — a dark sac FLOOR, then the OPAQUE emissive brew BODY sitting PROUD of the
chitin (so it is the bright interior, never occluded), then a near-white-hot MENISCUS strip
at the brew top (always drawn — the full-fill case produced NO crossing points and so no
power line, a real bug), then a LOW-opacity glass wall (0.72→0.26) as a subtle sheen, not a
dark cover. Plus: brightened the brew (a deep 0x8a1eb0 read black behind glass → 0xb43ae8
@ ei 1.0), and **demoted the placeholder eyes** (emissive 2.4→~1.0, size ↓) because two
big flat bright eyes out-glowing the hero FX stole the entire glow hierarchy — the motif
must be the dominant emissive or it reads as trim.

Gotchas:
- **A translucent wall over an emissive fill DARKENS it.** "Translucent wall + opaque fill
  behind" (the sheet's words) only reads as a bright vessel if the wall is nearly clear
  (≤~0.3 opacity) OR the fill sits proud of the wall. A 0.72 wall is a dark cover.
- **The chase camera sees the gaster's DORSAL-REAR, not its venter.** The sheet said
  "venter-centered"; the venter faces AWAY from the above-behind cam. Windows on the
  upper-rear of each (tapering) segment peek over the smaller next segment and read the
  waterline in the judged frame. (Engineering delta, flagged on the PR.)
- **The studio's warm amber key (`0xffe0b0`) is a deliberate cool-palette stress**, not a
  material bug — a warm tan tint on dark chitin in studio captures is expected; in-game
  uses the cool `rimCruise`. Don't chase it; verify the real look with `gameshots`.
- Value tiers compressed to ~0.03 L read flat-black; aiming the dorsal tier at a LIT
  violet-steel (not the plum venter) spread them ≥0.05 L (the CP4 one-liner, again).

**→ Systematize.** For ANY "filling vessel / glowing organ behind a window" motif, the
value order from the surface outward must be dark-floor → PROUD bright emissive body →
white-hot surface line → subtle low-opacity glass. Build the bright thing PROUD, never
behind a ≥0.5-opacity pane. And a "level meter" needs its surface line drawn in ALL states
including full (clip-to-top produces zero crossings). Place any read-critical glow on the
surface the JUDGED camera actually sees (dorsal-rear for a low-trailing gaster), not the
anatomically "correct" one. When a motif is the increment's whole point, verify it is the
DOMINANT emissive before the gate — a bright placeholder elsewhere (eyes) will mask it.

**→ Leapfrog.** The venom still now carries the rear-chase read on the dark shop card, so
the BREWING ladder (sacFill 0.05→1.00 across forms) will read as a real filling animation
at I5 with zero new work — the fill height already drives off `sacFill`. The core→bloom→
dark sac recipe is the template for the drip bead (I4) and any future organ-glow dragon.
