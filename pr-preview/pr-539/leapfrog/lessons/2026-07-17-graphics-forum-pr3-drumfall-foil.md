# Drowned Forum PR-3 — the `drumfall` fallen-column FOIL (Fable 3.4 → 3.8 → 4.4 PASS ×2), and the "show ONE round face" law

**What we did.** Built the Forum's LOW COMMON FOIL — the cheap quiet rest-note that "prices the gilt"
(no gilt, no glow, ladder-only). One archetype appended at the END of `ARCHETYPES` behind `biomes: forumV1`
(spawns only under `?props=forum`; determinism byte-identical), reusing the hero's `forumStone` + tide ladder.
Evolves the role of the v2 `wrackstone` foil into pure Roman drums. 140 tris, ONE material group, step 29
(interleaves densely with the near-rail's step 23 without exact overlap). Gated the full two-stage Fable
process; Stage-1 took **3 rounds** (3.4 → 3.8 → 4.4) then Stage-2 passed 4.3.

**The fallen-column recipe at ≤150 tris:** a surviving column STUB (subtle entasis, closed disc top) carrying
ONE flared Doric CAPITAL (the "quiet trumpet" — the prop's only flourish, withheld everywhere else so the
hero's gilt still reads rich), plus equal-diameter drum "coins" (they are slices of ONE column) scattered down
a fall LINE. Same read-as-a-sentence logic as the viamarina comb: stump at one end + coins trailing away =
"the column stood HERE and fell THAT way." A random pile reads as rubble; a directed trail reads as
architecture.

**THE BIG LAW — a low-poly cylinder only reads "column drum" when it SHOWS a round BREAK FACE to camera.**
This is the whole ballgame for drum/coin props, and it cost two rounds. A flat-shaded 5–6-sided cylinder is
a faceted prism; from most angles (especially the side profile of a *lying* drum, and the top-plan of any
drum) it reads as a **crate/box**, not a column slice. Fable failed df2 (3.4) and df3 (3.8) on exactly this —
"the coins are crates," "no panel shows a circular break face," "the far half is a pallet spill." What
converts the read is a single **circular face presented flat to the camera**. Two sub-laws:
- **Stand a coin ON END (or steeply leaning) so its round face cants at the camera.** A lying drum's side is a
  rectangle regardless of segment count — the round-ness only exists at the END CAP, so you must aim an end
  cap at the viewer. One on-end coin near the anchor is NOT enough; the FAR end of a scatter needs its own
  round face or that half still reads as crates. df4 passed (4.4) the moment BOTH ends of the trail showed a
  circular face.
- **8 sells round where the face shows; 6 is fine where it doesn't.** Bump only the coins whose circular face
  addresses the camera to 8-sided (a clean octagon reads round); leave lying/hidden-end drums at 5–6 (their
  silhouette is a rectangle anyway). This spends the tri budget exactly where roundness is legible.
- **Aim it at the ACTUAL studio/lane camera.** The `propstudio` front-¾ camera dir is `[0.72,0.26,0.82]`
  (toward +x,+y,+z); a coin stood on end with a small rz+ry lean cants its top face straight at that family,
  unoccluded. Verify the face LANDS in a panel — a round face aimed at a wall you never shoot is worth zero
  (the triumphgate money-face lesson, restated for drums).

**Seat lying debris ON the deck (y = groundY + radius), never centred low.** Restated from viamarina: a drum
centred below the ground plane pokes a sliver through and reads as a flat decal. Every coin sits at `y = R`
(lying) or on its base (standing).

**The Doric capital: grow the echinus OUT of the shaft, no gap — a flat plate hovering over a stub reads as a
table.** df1/df2 failed the capital as "an oversized floating tabletop." The fix that landed (Fable df3): an
echinus frustum whose BASE radius = the stub-top radius exactly (zero gap, it grows from the shaft) flaring UP
to a compact abacus seated directly on it. Keep it SMALL — a wide abacus re-reads as a table. (Known residual:
if the echinus top radius exceeds the abacus half-width the echinus rim "wings" past the abacus corners; a
non-fail cosmetic — Fable explicitly said don't spend tris on it.)

**The tide ladder as a LEVEL waterline, not moss.** A scatter of low drums wants the drowned-teal band to read
as submerged FEET (dark, low) with travertine crowns — "a waterline that ignores them," one level line across
the whole field. Keep `forumWaterY` low enough (0.14) that the drowned band sits on the feet; too high and the
algae green rides the TOP faces and reads as lichen (Fable df2/df3). (Residual: from directly overhead the top
faces still catch algae — a plan-view-only artifact the player never sees.)

**Placement — turn the LOUD face to the lane, jitter to kill copy-paste.** Fable's Stage-2 note: orient the
scatter so the sliced-column PROFILE (the loud side/¾ view) faces the flight lane and the weak down-the-length
end-on view turns away from the approach → bias the fall line lane-parallel (`rotY = (side>0?π:0) ± 0.6rad`).
The ±0.6 jitter plus per-instance r/h/x/tilt spread keeps a COMMON foil from reading as a stamp down the lane
(the viamarina copy-paste note, designed-out from the start here).

**What it unlocks.** The drum-coin vocabulary (equal-diameter closed cylinders, on-end round-face coins,
stump+capital anchor, level tide stain) is proven and reused by every future Forum ruin (`forumfield`,
`pantheon` portico drums, the PR-4 pillar hazard). **PR-3 (viamarina near-rail + drumfall foil) is complete —
both props two-stage gated.** Non-blocking polish deferred to a future pass (Fable Stage-2, "do NOT hold the
PR"): add ~0.3–0.5u minimum coin-to-coin spacing on the nearest coins so the closest-approach cluster never
welds into one lump.

**Verify:** `?biome=0&debug&props=forum&hero=drumfall` (tools/_forumclose.mjs); Stage-1 studio via
`tools/_cwstudio.mjs <tag> drumfall 8 4 0.6`; envcount 140 tris (all budgets green),
gold-determinism / biomecycle / bulletcontrast / propclearance / tricount all green.
