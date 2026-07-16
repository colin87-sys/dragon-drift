# Mire ensemble Stages 3+4: the carriers (glowshroom mid + glowbloom near) + the band-tri squeeze

**Context:** Completing the four-form ensemble. Stage 1 arch (merged) + Stage 2 lantern-spire (hero
beacon) are the LANDMARKS; Stages 3+4 are the CARRIERS that fill the composition — the recurring
mid-ground stamp and the near-lane breadcrumbs. Both passed Fable studio gates (owner asleep; Fable
≥4.2 was the pass bar).

## glowshroom — MID carrier (Fable 65-gate: 3.6 REVISE → fixed → PASS)
The tier-3 mushroom. Studio gate caught it as a flat blown dome and prescribed two 0-tri fixes:
1. **A carrier ladder.** New `mireCarrierLadder` = stock mireLiving values (0xffc23a/0xf79a2e **@1.6
   unchanged** — do NOT reuse the hero @2.3/@1.8 or you promote the tier) + vertexColors + ladderEmissive.
   `bakeMireLadder(baseY 0.66, apexY 1.10)` keyed to the CAP span → crown-boss white core → dome gold
   bloom → dome-edge dark. Value structure without a new intensity tier.
2. **The mottle seating bug.** Dark mottle patches were authored at y 0.80–0.83 but the dome shell at
   that radius sits at y 0.88–0.91 — the patches were BURIED 0.03–0.06 under the shell, only a sliver
   poking out. Fix: seat each center ON the shell (`y = 0.70 + 0.62·√(0.42²−d²)` minus 0.02) and TILT
   ~0.5 rad outward (rz = −0.5·x/d, rx = +0.5·z/d) so the whole flattened patch lies on the shoulder.
   **Lesson: a decal/patch on a curved shell must be seated from the shell equation, not eyeballed — an
   authored y that looks right in your head buries it.**

## glowbloom — NEAR scatter (Fable 66-gate: 4.4 PASS first pass)
Tier-4 pale afterglow (new `mireEmberLiving` @0.85 — blooms are NEAR so they pay ~no fog tax; the
dimmest tier by hue AND intensity, never competing with the heroes). 4 faceted octahedron bulbs in dark
calyx cups (the husk = the dark lip beyond every glow rim) on 3-seg stalks at WIDE height stagger
(0.50–0.95 — a narrow stagger collapses to "one row" under the chase cam's vertical compression).

## THE BAND-TRI SQUEEZE (the activation gotcha)
Activating both carriers blew the **LUMEN MIRE 50000 band-tri cap** (54442) — envcount counts the whole
instance BUFFER (step-derived), not just the comp-active instances, so a dense carrier is expensive even
though comp parks most of it. The Mire is already the heaviest biome (dense reedveil/drape screens +
two heroes = ~39.7k before carriers), leaving only ~10k for both carriers. Fix: trim tris (shroom dome
9→7 seg, boss 6,3→5,2 → 117t; bloom calyx 5→4 seg → 112t) AND raise steps above Fable's spec (shroom
37→45, bloom 29→36) to shrink the buffers. Landed at 49992/50000. **Rule: on the Mire (or any near-cap
biome), budget a new carrier's `tris × (biomeCoverage/step)` against the remaining band headroom BEFORE
picking Fable's density — the step is a tri lever, not just a rhythm lever.** Density is slightly below
Fable's spec as a result; flag at the full-ensemble gate.

## Composition wiring
- Both are `comp:{floor,sMin,sMax,glow:true}` + `arrivalPark` (off the first 200m so the seam reads as
  black mirror). glow carriers clear the easement AND the immediate arch-gate water via a new pure
  `nearArchGate(dist)` (±40m of a kept arch peak — tighter than the dark-screen corridor; the caps are
  the arch's chorus on APPROACH, never inside its glow-water).
- All gates green: determinism byte-identical, envcount 49992 (all budgets), propclearance clear
  (shroom 27.1; bloom 14.9 clears the 14.5 floor — the ±16 veil warn is fine for near-lane breadcrumbs),
  biomecycle 11/11, bulletcontrast, insts.

## Status
Full four-form ensemble LIVE (arch hero + spire beacon + shroom carrier + bloom scatter). Next: the
full-ensemble in-game gate (MS-1/2/3 montage, ≥45%-mirror troughs, blind biome line-up) + owner's live read.
