# Drowned Forum PR-2 (hazard) — reskinning the Phase Gate as the Sinking Triumphal Arch (Fable 2.1 → 4.3)

**What we did.** Reskinned the shipped biome-0 `gate` obstacle (the fresnel Phase Gate) into a sunken-Roman
coursed-ashlar toll-arch, under `?props=forum` only. Fable-gated it through SIX harsh rounds
(2.1 → 3.7 → 3.8 → 3.7 → 4.0 → 4.3 PASS). The shipped gate is byte-identical everywhere else.

**PROCESS LAW (learned the hard way, twice): a harsh Fable assessment at EVERY checkpoint is not optional.**
Self-gating "looks solid to me" shipped a 2.1 hazard AND (earlier) a 2.7 hero. The owner had to call it out
twice. §10 is LAW: spawn `model: fable`, attach the PNG by absolute path, ask for /5 + the single biggest
failure + the one highest-leverage fix, and LOOP until ≥4.2 BEFORE showing the owner. Every round the number
moves because it spends on exactly the cited failure. Do this for props, hazards, AND compositions.

**THE COLLIDER IS GAP-MATH, SO A RESKIN IS DIFFICULTY-FREE.** `collision.js` tests the gate purely against
`c.gapX/gapY/gapW/gapH`; the mesh never enters the test. Swapping the mesh cannot change difficulty —
"colliders byte-identical" is true by construction. Verify this first for any hazard reskin.

**CONSISTENCY IS A HARD GATE (owner): the hazard must be the SAME stone as the props.** The gate first used
its own flat grey block palette — it read as imported Victorian brick beside the triumphgate's travertine
(the one-city test, §12). The fix: bake the gate blocks with the SAME forum tide ladder (travertine crown /
algae / drowned slate-teal base, keyed by WORLD HEIGHT — the gate stands in the water at y≈0) on the SAME
`forumStone` material (exported `getForumStone()` from environment.js, whose `ladderEmissive` fold carries the
ladder backlit). A hazard reskin should reuse the biome's material + bake, never invent a parallel one.

**A BACKLIT GATE IS A SILHOUETTE — so an arch must read as the SHAPE OF THE HOLE + RADIAL voussoirs, not as
value or relief.** Rounds 3.7–3.8 failed because I tried to make the arch read with value-alternated blocks
and "proud" relief — both DIE when the gate silhouettes against the low dusk sun (no shadow line, no value).
What finally read (4.0+): (1) CARVE a clean semicircular hole (the rectangular collider bay + a semicircle
above it — collider stays the rectangle, the arched top is bonus clearance); (2) ring the hole edge with
tight RADIAL voussoir wedges (each `rotateZ(θ−π/2)` so its long axis points at the arch centre) — a radial
fan reads as an arch in pure silhouette; (3) keep the arch SURROUND solid (no erosion punching light through
above the apex, which severs the keystone); (4) seat the magenta keystone AS the apex wedge (a wide-top
trapezoid via `CylinderGeometry(rTop>rBot, h, 4)`), touching the ring — not a floating chip a course above.

**NO VOUSSOIR WITHOUT WALL BEHIND IT (the 4.0→4.3 score-mover).** The safe bay floats to an arbitrary lane
position, so a full semicircular ring can hang its flank off the wall edge into open sky — a silhouette-level
structural lie the eye flags at cruise. Clamp the fan to the span the wall actually covers (`backed(vx,vy)`):
near the lane edge it becomes a clean broken HALF-arch (ruin-appropriate), never a levitating fan.

**MATCH THE MASONRY GRAMMAR TO THE SCALE — research it, don't eyeball it (owner: "not the same city").**
The gate first read as a different building from the hero even with the same material, because it used SMALL
running-bond blocks = **opus latericium** (thin brick FACING over concrete — a HOUSE technique). A monumental
gate / triumphal arch was built in **opus quadratum**: a handful of LARGE squared ashlar blocks, joints as
VALUE only (a dark mortar GAP is the loudest brick tell — kill it, blocks TOUCH), ~5–6 blocks across the
whole span not 12+, ~5 courses, 70% smooth mass / 30% faint coursing so it reads like the hero's smooth
travertine piers. The one-city test is a HARD gate; when two props share a biome, they must share the
construction technique, not just the palette. (Fable art-direction consult + a quick web search on Roman wall
types settled it — a monument is quadratum, a house is latericium/reticulatum.)

**ERODE A HEIGHT, NEVER PUNCH HOLES (kills the AI-slop floaters + battlement teeth).** Random per-block
erosion leaves floaters (a removed block below orphans the one above) and, with gaps, reads as crenellation
teeth. Instead erode a CONTIGUOUS broken-top HEIGHT profile per fixed x-column that steps by whole courses —
every surviving block still sits on the course below (attached by construction) and touches its neighbours
(a clean stepped ruin edge, not teeth). Zero tolerance: if a block's mass doesn't connect, it doesn't spawn.

**Keep 100% of the safe-route affordances — fairness isn't the place to be creative.** The reskin only swaps
the deadly barrier's material/geometry and warm-retints the cyan Sanctuary affordances (frame/brackets/core/
beacon → gilt); it never removes or narrows them. The arch dressing sits OUTSIDE the fixed collider bay.

**Capture gotchas:** full-game gate captures stall headless GPU readback at 1280×820 @1.4 — use ~1100×720 @1.0
(§9). Harden the health-pin to revert crash/damage/`state` each tick or the parked player crashes into the
"CRASHED"/"SECOND WIND?" overlay. Gates are sparse — probe several dists. Near-miss spark particles (magenta)
appear when the dragon is parked IN the gate; tell Fable to ignore them.

**Status:** PR-2 complete — hero (`triumphgate`, Fable 4.3) + hazard (gate reskin, Fable 4.3). Next: PR-3
(`viamarina` near-rail + `drumfall` foil), reusing the proven forum stone kit.

**Verify:** `?biome=0&debug&props=forum` (tools/_forumgate.mjs); node --check js/obstacles.js;
gold-determinism / envcount / bulletcontrast green; shipped gate unchanged (`PROPS_FORUM && bi===0`, false in
normal play and headless).
