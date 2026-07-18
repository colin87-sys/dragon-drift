# Drowned Forum PR-3 — the `viamarina` near-rail street (Fable 3.6 → 4.3 PASS ×2), and the "make debris SOLID / make recesses REAL" laws

**What we did.** Built the Forum's WAVE-A **near-rail** — a sunken-Roman SEAFRONT STREET the player skims up
close (replacing the old lagoon "weird stone things"). One archetype appended at the END of `ARCHETYPES`
behind `biomes: forumV1` (spawns only under `?props=forum`; determinism byte-identical), reusing the proven
`forumStone` + tide ladder + fresco kit from the hero (one-city). 150 tris, one material group. Gated the FULL
two-stage Fable process — studio form (Stage-1) → in-context over water (Stage-2). Stage-1 took **4 rounds**
(3.6 → 3.9 → 4.0 → 4.3) then Stage-2 passed 4.3 first look. Every round spent on exactly the cited failure.

**The street anatomy at ≤150 tris** (reusable "ruined-colonnade near-rail" recipe): ONE wide stylobate plinth
(z-long) under everything + a diminishing-ruin COLONNADE of 4 chunky 5-sided Tuscan shafts (2 tall survivors
carrying an ARCHITRAVE beam — post-and-beam = "this was BUILT" — → 2 broken full-girth columns) + the row then
DISSOLVES into 3 solid fallen DRUMS + a low broken-pier TABERNAE shopfront with a see-through DOORWAY showing a
recessed Pompeian-red fresco. That silhouette reads a "drowned seafront street" sentence with grammar, not a
block pile. Runs lane-PARALLEL (`rotY≈0/π`) so it WALLS the corridor, never blocks across it.

**THE BIG LAW #1 — lying "debris" must be CLOSED geometry, and must sit ON the deck (y = deckTop + radius).**
Two separate cheap tells killed the fallen drums for two rounds each:
- **Buried decal.** A drum modelled `CylinderGeometry` centred at a low `y` below the stylobate top pokes only
  a sliver through the deck → reads as a flat painted patch, not a volume. Lay it at **`y = deckTopY + r`** so
  the whole barrel sits above the surface.
- **See-through shell.** `CylinderGeometry(r,r,len, n, 1, true)` is **openEnded** — you see the deck straight
  through the open ends → "curled paper / folded awning," the classic see-through tell (Fable: "hollow open
  shells"). A fallen stone drum is a SOLID mass: use **`openEnded:false`** so both end caps close it. Cost is
  real (a closed 5-gon cyl ≈ 20 tris vs 10 open); budget for it.

**THE BIG LAW #2 — a flat painted plane on a solid box is NOT a recess; a real OPENING is.**
Under flat shading a fresco quad laid flush on a slab throws **no shadow facet** — it stays a decal, and the
wall still reads blank from the money angle (Fable, twice: "geometry that can't be seen doesn't count").
Recesses only read two ways: (a) an actual **opening** you can see through, or (b) **proud relief** that casts a
facet. The fix that passed: rebuild the tabernae from one slab into **two broken pier segments with a
see-through DOORWAY GAP** between them, and set the Pompeian-red fresco panel at the BACK of the wall thickness
so it reads as a shadowed painted interior seen THROUGH the opening — free depth + free shadow, and
open-fronted piers are how a tabernae actually read. (Bonus: putting the fresco inside the opening, not proud
of the lane face, killed a red single-sided-backface sliver on the lane edge.)

**THE "TWO PROPS" LAW — a set-back element needs a SHARED base, or it floats.** vm3 read as "a ruin comb + an
unrelated crate" because the tabernae wall sat at an `x` with no stylobate under it (narrow plinth beside it,
daylight gap in top-plan). Widening the stylobate so **ONE platform seats BOTH** the colonnade and the
set-back wall fused it into one object. Verify in the TOP-PLAN panel that the base footprint touches every
standing element — a floating member reads as a bug at Stage-1 and strobes as a seam in-game.

**Carry the comb the FULL length.** vm2 died at position ~3 and left the back two-thirds a bare slab
("gate+barrier, not street"). A diminishing rhythm needs REPETITION across the whole footprint: tall → broken
→ stump → and let the fallen DRUMS themselves be the far-end decay beat. A broken column is a FATTER, SHORTER
survivor with a jagged top — full girth, never a thin shell.

**Tri-budget triage — trade the least-load-bearing detail to fund the fix that gates.** Solid drums + a real
doorway didn't fit at 150 with the full colonnade. Dropped the two hero ABACUS caps (24 tris; the architrave
already proves "built," and weathered Roman shafts read as columns without a clean capital) and one stump to
buy 3 closed drums + the 2-segment opening. Spend tris where the critic is docking, not on garnish.

**The near-rail color accent must catch from the LANE-side ¾, not just plan view.** Stage-1 passed but Fable
flagged the fresco red as "shy — only birds see it": a recessed panel is occluded by its flanking pier from the
raking lane angle. Widening the doorway gap + pulling the panel slightly forward + larger made the biome's ONE
color accent glint from the lane in Stage-2 (confirmed on the mid-distance copies). On a near-rail, tune the
accent against the ACTUAL flight angle, not the studio orbit.

**What it unlocks.** The "ruined-colonnade near-rail" kit (wide stylobate + diminishing shafts + architrave +
solid drums + open-pier tabernae) is proven and reuses the hero's stone. Next PR-3 prop: **`drumfall`** (the
fallen-column foil — pre-assessed: equal-diameter drum coins scattered from one stump, tide-stained, one quiet
trumpet). **Non-blocking Stage-2 polish deferred to a future pass** (both cost tris we didn't have at 150):
chamfer the drums one step rounder (6-sided) to kill a faint close-pass "crate/ingot" read, and add ONE
lintel-less silhouette variant to the lane rotation to erase the last copy-paste tell.

**Verify:** `?biome=0&debug&props=forum&hero=viamarina` (tools/_forumclose.mjs); Stage-1 studio via
`tools/_cwstudio.mjs <tag> viamarina 11 7 0`; envcount 150 tris (all budgets green),
gold-determinism / biomecycle / bulletcontrast / propclearance / tricount all green.
