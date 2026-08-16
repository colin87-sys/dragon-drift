# Drowned Forum PR-4 — the `aqueduct` far-massif (Fable 3.7 → 4.5 PASS), the ODD-SEGMENT round-arch law, and far-massif capture

**What we did.** Built the Forum's FAR-MASSIF — the monumental horizon element (replaces the lagoon `rampart`):
a TWO-TIER arcade of ROUND sky-through arches, the top tier smaller + more numerous (the single most Roman
cue), marching into the fog. One archetype appended at the END of `ARCHETYPES` behind `biomes: forumV1`
(determinism byte-identical), one pierced-BufferGeometry front face (evolving the `arcade` technique),
`foam:false`, ZERO glow, shared tide ladder. 150 tris. Fable pre-assessed, one build round, one arch-roundness
fix → 4.5 PASS.

**THE ODD-SEGMENT ROUND-ARCH LAW (the reusable win).** A low-poly semicircular arch's roundness is decided by
segment-count PARITY, not just count. **An EVEN segment count puts a vertex exactly at the crown → a pointed /
gothic apex. An ODD count puts a SEGMENT across the crown → the eye completes the circle → a true Roman round
arch.** My lower arch at 4 segments read gothic (Fable's arch kill-condition, 3.7 FAIL); the upper arch at 3
segments read round. The fix was 4→**5** segments on the lower arch — same geometry, one parity flip, and it
went round. This applies to EVERY silhouette arch in this Roman city (aqueduct, arena, portico). Use 3/5/7, not
4/6.

**THE WORLD-ASPECT ELLIPSE GOTCHA (restated from `arcade`).** The `(r,h,r)` placement scale multiplies object-x
by r and object-y by h INDEPENDENTLY (r≈100, h≈18.5 → h/r≈0.185). So a WORLD-semicircular arch must be built as
an ELLIPSE in object space (vertical semi-axis (r/h)≈5.4× the horizontal). Design every dimension in WORLD
units and divide by the nominal `(R_NOM, H_NOM)` at build time (`wx=X/R_NOM`, `wy=Y/H_NOM`); the arch helper
sweeps `x = cx − wx(S)·cos(a)`, `y = spring + wy(rise)·sin(a)` so after the scale it's a true circle. And
**couple h to r in `place()`** (`h = 0.185·r·(0.97+0.06·rnd)`) — independent draws swing arch roundness ±40%
and half your instances go pointed or flat.

**Far-massif TECHNIQUE:** a SINGLE pierced front-face `BufferGeometry` (a `v[]` array + `q`/`t` push helpers),
single-sided (+z), no back face — through the holes you see SKY, never a back wall (the arcade did front+back;
the aqueduct's identity is sky-through, so front-only halves the tris and is *more* correct). Piers split at the
tide band (edge loop → dead-level jade). Jamb returns (front→back at the hole edges) give the holes 2m-masonry
thickness. Decay told LEFT→RIGHT as TWO gradients ending at different points: the **upper tier dies first**
(survives over lower bays 0–2, ends ragged), then a lower bay breaks, then pier stumps step DOWN into the water
(last drowned below the tide line). Two gradients = "the sea ate this for centuries," not "the modeler stopped."
KILL a floating springer-stub / architrave with no support under it (a cheap tell — Fable).

**THE STUDIO CAN'T FRAME A FAR MASSIF — capture it in-context.** `_cwstudio` (and the isolated studio in
general) is tuned for compact hero props; a 72-unit-long, 18-tall massif frames edge-on / tiny / flat and the
arch rhythm never reads (I nearly mis-diagnosed a correct build as broken). A far-massif's ONLY real view is
DISTANT on the horizon — so gate it there. Built `tools/_forumfar.mjs`: hero-pins the far prop, finds an
instance at ANY |x| (far massifs sit 80–130 off-lane; `_forumclose` filters |x|>60 OUT), and shoots it (a) from
the lane across the water and (b) a dead-front elevation SQUARE to the +z face (camera at `p.z + r·1.15`, NOT
along ±x — that shoots the wall edge-on and reads as a solid block, a camera bug that cost a frame).

**Placement:** step 97, comp floor 0.45 + arrivalPark (arcade/rampart horizon rhythm, thins in the breaths),
`foam:false` (a bright collar 80+ off-lane is an artifact), r 90–125, inner edge ~80–105 (the center third stays
empty for the gate), yaw side-based + ONE-SIGNED jitter ≤ ±20° so the diagonal always swings the decaying far
end AWAY from the lane (perspective recession into the fog, never a lane-crosser), tilt ~1–2° subsidence.

**One-city tie:** same `forumStone` + tide ladder + ROUND arches as the hero; but SKELETAL (pier 0.31×span, holes
outnumber stone — the inverse of the hero's one-hole-in-chunky-mass), NO attic, NO gilt, NO glow, value
compressed in the gold-umber fog band. It belongs to the city and never rivals the hero.

**What it unlocks.** The pierced-front-face two-tier-arcade kit + the odd-segment round-arch law + `_forumfar.mjs`
are proven; reused by the arena, portico, and any future Roman arch. **PR-4 remaining:** `pinisle` (the stone-pine
Lorrain side-frame). Then the first full money-shot processional capture.

**Verify:** `HERO=aqueduct node tools/_forumfar.mjs <tag>` (in-context far view + elevation); envcount 150 tris,
gold-determinism / biomecycle green (a new END-appended archetype is render-only for determinism).
