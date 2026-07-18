# Drowned Forum walls — curing the "cardboard cutout" close read on a single-face wall (basilica flatness, 3.9 FAIL → 4.4 PASS in 2 rounds)

**What we did.** The `basilica` framing wall reads great in the flythrough (it fills the Forum's missing
mid-ground "ice-shelf" register — big lane-parallel masses that frame the corridor and give the small props
a scale to be subordinate to) but the owner flew UP to it and it read "weirdly FLAT, like a cardboard cutout."
Root cause: it's a single pierced FRONT-FACE BufferGeometry — ~1.2-world masonry thickness on a 34-tall wall
(a **3.5% sheet-metal ratio**; real heavy masonry reads ~10% of height), a true KNIFE EDGE on the leading end,
and a fully coplanar face. Two harsh-Fable rounds cured it in **+12 tris then +0 tris** (146/150 total), NO
back face.

**THE FIX IS SILHOUETTE-EDGE THICKNESS, NOT A CLOSED BOX.** The wall sits lane-parallel at |x|32–42; the
player is always on the center lane seeing it BROADSIDE, never behind it. So a back face is money spent where
no one looks (the aqueduct's sky-through ruling, inverted: the aqueduct needs no back because its identity is
*openings*; the wall needs thickness only on the edges the approach vector actually sees). Round 1 added, on the
silhouette edges only: (a) deepen the existing top caps to a back plane at `z = zf−0.10` (~3.5-world); (b) a
full-height END CAP cross-section on the tall leading end, split at the tide band; (c) a shear-return
cross-section on the broken end (a ruin showing its section is a free narrative cue); (d) vertical STEP-RETURN
side-quads on the taller course at each parapet skyline break — silhouette-against-sky is where thickness
registers hardest from flight altitude; (e) z-jitter the parapet courses ±0.01 so they stop being one coplanar
sheet. **Non-indexed `v[]` = each quad gets its own flat facet normal → a two-tone lit corner = the read of
mass, for free.**

**THE TELL MIGRATES — fix the skyline and the eye drops to the next-flattest thing.** Round 1 killed the
knife-edge (Fable: skyline fixed) but scored 3.9 FAIL because the flat read **jumped to the window openings**,
which now read as "pure black stickers punched in the face." A cutout cure isn't done when the first flat
element is fixed; re-gate and chase the tell down the value hierarchy until nothing re-asserts the single-sheet
read.

**THE Y-KEYED-BAKE COORDINATE-SPACE TRAP (the round-2 root cause, and it's a general one).** `bakeReveal`
paints a lit-sill→dark-up gradient keyed to **object Y**, hard-coded to the range `0.12→0.56` — tuned for
small props whose doorways live there. But a TALL wall is built in a `wy(Y)=Y/H_NOM` space, so its windows sit
at object Y `0.56→0.73` — entirely PAST the gradient, which clamps them all to `_VOID` = uniform black
stickers. **Any normal/height-keyed bake (reveal, fresco, bloom, the tide ladder) silently mis-fires when a new
archetype uses a different object-space scale than the bake was authored for.** The fix: parametrize the bake
(`bakeReveal(geo, y0, span)`), add a `bake:'revealHi'` bucket, and pass the archetype's real band
(`revealHi:{ y0: wy(SILL), span: wy(CROWN−SILL) }`). Watch for this whenever you reuse a bake across a big
scale jump.

**DEEPEN EXISTING GEOMETRY BEFORE YOU SPEND TRIS.** Fable budgeted +4 tris for two lit jamb quads; we spent
**0** by deepening the jambs/backers that already existed (`jambW`: `zf→zTop` instead of `zf→zb`) so
flatShading gives the sun-side jamb a warm lit sliver + the interior a shadow falloff — a real hole in a thick
wall, on all six windows, not two. Deepening a plane's z is free; adding a quad is not. Stay stingy.

**Capture caveat (recurring).** The `_forumclose` auto-framer keeps grabbing a far END-ON orbit down the length
of many instances → thin-fin silhouettes + floating parapet caps (the no-back-face angle). That is NOT a play
angle. Judge the BROADSIDE frame (the complaint angle) + the portrait flythrough; ignore the fin-orbit.

**What it unlocks.** The silhouette-edge thickness kit + the tell-migration discipline + the Y-keyed-bake
scale-trap are reusable for every big wall/massif (aqueduct promotion, colossus, arena walls in later PRs).
Basilica is PASS (4.4, gate angle 4.3). **Non-gating polish parked** (Fable): brighten the sill end of the
reveal ~15–20% so the falloff survives on the smallest windows; check the one center-right window with a
gray backer + cyan streak (possible missing backer vs. legit see-through); nick the floating gray notch on the
top-left parapet + the gray triangle at the mid-frame seam base.

**Verify:** `HERO=basilica node tools/_forumclose.mjs <tag>` (broadside frame) + `_forumscene.mjs` portrait
flythrough; envcount 146 tris; gold-determinism byte-identical, biomecycle 12/0, bulletcontrast green.
