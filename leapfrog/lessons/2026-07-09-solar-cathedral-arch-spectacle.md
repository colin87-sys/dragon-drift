# Solar CP2 — the "M-not-V" cathedral arch + withheld-regalia coronation ladder

**What we did.** Solar's Eternal apex "lacked the spectacle of an end-game dragon" from the
REAR-CHASE cam (the primary view): the four forms were the same dragon at four sizes, the apex was
inert (dead-black, flat maroon wing wall), and the rear silhouette read a spiked delta-KITE (a V),
not a monarch. CP2 fixed all three in `dragonSovereign.js` + the `solar.forms` ladder in
`dragons.js`.

**The wow move — silhouette is a FUNCTION, not a mesh.** The V came from the wing's vertical profile
being LINEAR (`y = t*0.30 + x*tan(dih)` → two flat ramps, nothing above the head). The whole monarch
read is one function swap: a two-segment **gull arch** (`wingArchY(t, halfSpan, dih, archRise)`) that
climbs steeply to a **carpal apex at t≈0.35** then descends — plus one dominant **carpal lance** per
wing at that apex (~2.6× the rank pikes). Twin spires break the skyline ABOVE the crown and FRAME the
corona ring, head enthroned in the valley → **M, not V**. The rank pikes were then DEMOTED outboard
with a steeper `0.62^i` decay so the wing reads LANCE→step→step→tip (a scale hierarchy), not a picket
fence of equals. Net cost ~repositioning, not tris (Eternal 1646→2010).

**The gotcha that bites every arch/dihedral change: the FX handles use their OWN copy of the
profile formula.** The wingtip trails + hard-bank aero-shear read `parts.tipMarker*` / `wingElements`
tip positions, which were hardcoded to the OLD `0.30 + halfSpan*tan(dih)`. If you move the geometry
and forget these, the trails detach from where the tip actually is. Fix: make the profile a
**module-level shared function** and call it from BOTH the vault geometry AND the marker/wingElements
push. (Same shape as any "two places compute the same position" bug — hoist the formula.)

**Blend, don't replace, for backward-compatible dials.** `wingArchY` fades the old linear dihedral
out as `archRise` fades in (`x*tan(dih)*(1-archRise) + arch*archRise`), so `archRise:0` is
byte-identical to the old princeling glide and the Hatchling keeps its flat delta. The ladder then
just dials `archRise` 0→0.35→0.7→1.0.

**Withheld regalia is what makes a ladder rank-able.** The old forms all wore the full crown, so
Eternal conferred nothing. CP2 GATES each regalia piece to a rung: `igniteStage` 0/1/2/3 (which
emissives are lit), `starGemBloom` 0→1 (the brow gem is ABSENT on the whelp — gate the mesh on
`bloom>0`, not just dim it), `coronaValleys>0` (no mantle collar until Radiant), `napeStar` from
Radiant, `coronaRing`/`sparTipHeat` Eternal-only. Now every form adds **light AND hardware AND more
arch** — visibly rank-able from behind. Tris monotonic 967<1302<1611<2010 is the cheap proxy the
starters test asserts.

**Anti-tacky glow doctrine held: eclipse-BY-CONSTRUCTION.** The corona is a DARK opaque 12-facet
flat-shaded annulus (`flatTriMesh`, NO torus) wearing a THIN saturated bicolour rim — a dark
moon-disk, not a smoky additive halo. That is both the premium look AND the reason it can't be
mistaken for pearl's soft halo sprite (the Fable collision veto). Same rule everywhere: saturated
emissive baked into opaque facets (sat≥0.75, value≤0.9) blooms in-colour under ACES; the ONLY
near-white elements are the tiny f3 spar tips, kept OUT of every `spineMats` array so Surge can't
detonate them to white.

**Rearward sigil for a rear-primary cam.** The brow star-gem faces AWAY from the chase cam, so the
king needed a second star the rear view actually reads — a violet `napeStar` octahedron on the
mantle crest (net-new; flag for owner approval since it's a new silhouette element).

**Verify.** `tricount` 4 forms <6000 · `wingsymprobe solar` PASS (arch/lances are mirror-built, so
symmetry is free) · `starters.mjs` +20 solar asserts (igniteStage/gem-radius/coronaRing-f3-only/
arch/carpal/nape monotonic; motif-anchor waived at f0) · blueprint + smoke green · `dragonstudio
solar r-cp2` rear silhouette reads M. Solar reaches Eternal (SSSR), so it needs its OWN test block —
the shared starters SPECS loop hard-asserts `maxTierFor===2` (starters cap at Radiant).

**What it unlocks.** A reusable pattern for "same dragon at N sizes" → a real coronation ladder:
(1) make the silhouette a blended function keyed by a 0→1 dial, (2) gate each regalia MESH (not just
its brightness) to a rung, (3) assert tris + dial monotonicity as the rank-ability proxy.
