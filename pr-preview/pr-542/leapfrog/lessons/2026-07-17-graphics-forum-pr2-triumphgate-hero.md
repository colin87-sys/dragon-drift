# Drowned Forum PR-2 — the `triumphgate` hero (Fable 2.7 → 4.3 PASS), and the tide-ladder-on-a-box law

**What we did.** Built the Forum's WAVE-A hero — a sunken-Roman TRIUMPHAL ARCH — appended at the END of
`ARCHETYPES` behind `biomes: forumV1` (spawns only under `?props=forum`; determinism byte-identical). 144
tris, 2 material groups. Landed the material kit beside its first consumer (per the PR-1 lesson): a
re-stopped forum tide ladder (`bake:'forum'`), a Pompeian-red fresco (`bake:'fresco'`), and a dedicated
`forumStone` material. Gated it through the FULL two-stage Fable process — studio form → in-context over
water — and iterated **13 rounds / 5 Fable gates** from 2.7 to a 4.3 PASS. The trajectory is the lesson.

**The arch anatomy at ≤150 tris** (the reusable Roman-arch recipe): two piers (split, see below) + a
half-torus voussoir ring `TorusGeometry(R, tube, 3, 6, π)` springing at 50% H + a clean box SOFFIT capping
the bay (a coffered tunnel of real depth, never a flat cut) + a full-width projecting CORNICE (the single
strongest "Roman" horizontal tell) + a solid ATTIC cap with one shoulder a dropped/yawed fracture + a small
recessed GILT coffer (mat 1) in the soffit. Pier ≥ ¾ span (no croquet-hoop). That silhouette name-tests
"triumphal arch" unprompted.

**THE BIG LAW — a position-keyed value ladder needs VERTICES at its band boundaries.**
The tide ladder (travertine crown / algae line / drowned slate-teal base) is a per-vertex vColor bake. On a
plain full-height pier BOX there are no vertices between the foot and the top, so the bake can only
INTERPOLATE corner-to-corner → a smooth gradient that the dusk fog washes to one flat khaki (Fable stalled
at 3.5–3.9 on exactly this: "no ladder, Caesars-Palace white"). The fix that broke through: **SPLIT the pier
into two stacked boxes at the tide line** — the seam is a real geometric edge, so the bake reads a crisp
drowned→crown COURSE there. Traded the engaged pilasters to pay for it (the crisp value-structure now
articulates the pier, so a blank-slab read is no longer the risk). **Any box prop that must show a horizontal
material band — waterline, strata, a painted register — needs an edge loop / a box seam AT the band, or the
band won't read.** (The lathe / jitter-lathe props get this for free from their many rings; boxes don't.)

**Per-VERTEX, not per-FACE, for a TILTED band.** First attempt keyed the tilt per-face
(`key = faceCentroidY − tiltX·faceCentroidX`); the box's two triangles per quad split the diagonal into hard
CHEVRON WEDGES ("dazzle-camo," Fable 3.1). Water doesn't stain in chevrons. Keying per-VERTEX against ONE
tilted plane makes the stain wrap continuously. And once the crisp read comes from a geometric SEAM, drop the
baked tilt to near-level and let the **instance `tilt`** (bradyseism lean ~4–7°) supply the angle — cleaner
than fighting the triangulation.

**`ladderEmissive` carries the ladder in BACKLIGHT — so the drowned stop must be MID, not near-black.**
Flying into the low dusk sun, the near/front pier face is backlit; diffuse ≈ 0, so the bands survive ONLY
through the emissive fold (`totalEmissiveRadiance *= vColor`). Two calibrations mattered: (1) don't borrow
`lagoonStone` — its warm emissive (@0.26, tuned for the jade band) lifts the forum's dark base toward cream
and clips the crown; a dedicated `forumStone` (0xbcb492 @0.28) is right. (2) A deep near-black drowned stop
crushes to pure black backlit; a **mid slate-teal** stop holds its hue in shadow. Dark-for-separation and
light-enough-to-not-crush is the needle — mid-teal + a gentle base-darken threaded it.

**The capture yaw MUST match the money face, or you gate the wrong side for rounds.** `_forumclose`'s cam
sits up-lane; the first `rotY` pin (=π) turned the decorated front DOWN-lane, so every Fable frame judged the
blank back ("off-centre opening, absent gilt" — all artifacts of shooting the wrong face). Pin the money
face toward the approaching player (`rotY ≈ ±0.32`, front greets up-lane), and harden the capture pin (revert
crash/damage state each tick) or the parked player collides and you get red-flash / "CRASHED" frames.
**Verify the capture is showing the face you designed before trusting a critic's read.**

**Process note (the owner's question that reset this):** the two-stage Fable gate is not optional garnish —
self-gating "looks solid to me" shipped a 2.7. Spawn the harsh critic (`model: fable`) per checkpoint, attach
the PNG by absolute path, ask for /5 + the single biggest failure + the one highest-leverage fix, and LOOP.
It converged 2.7 → 3.1 → 3.5 → 3.8 → 3.9 → 4.3, each round spending on exactly the cited failure. The owner
still outranks it, but the number keeps you honest.

**What it unlocks.** The forum stone kit (ladder + fresco + `forumStone` + gilt) is proven; the next WAVE-A
props (`viamarina`, `drumfall`, `aqueduct`…) reuse it. **Still open for PR-2:** the Sinking-Gates HAZARD
reskin (the shipped `gate` fresnel-veil obstacle → the descending triumphal arch, colliders byte-identical).

**Verify:** `?biome=0&debug&props=forum&hero=triumphgate` (tools/_forumclose.mjs); envcount 144 tris,
gold-determinism / biomecycle / bulletcontrast / propclearance / tricount all green.
