# 2026-07-14 — graphics: Sunset Glacier v2 — the "massive-first" ice-form fix

**Why.** Owner flew the first Sunset Glacier build: the atmosphere was premium but "they all kinda look
all long and skinny which doesn't make any sense cause mountains don't look like that. Push further." Dead
right — every prop was the same tall-thin spire.

**The diagnosis (a Fable art director MEASURED it off the renders).** Feeding the actual screenshots to the
critic (it can Read PNGs) beat any code review: it measured on-screen aspect at ~1:15–1:20 per spire, every
silhouette the same needle family, the one believable prop being the single low `floeshelf` pan — "the
entire middle of the mass spectrum was missing: no blocks, no walls, no terraces; the eye pattern-matches
fence pickets, not glacier." Root cause in code: every archetype's `place()` had h ≫ r (candle h30-52 ×
r5-8 ≈ 6-8:1 skinny; the distant `glacierwall` shipped at h6-10 = shorter than the foam rings → invisible).

**The load-bearing lesson: real ice/mountains read as scale through BREADTH, not height — invert the
ratio.** The reference doctrine, now banked: tabular bergs / ice-shelf fronts are **5:1–20:1 WIDE** (breadth
is what the brain reads as "impossibly big"); seracs are house-sized **~1:1** blocks; terraces are 2-4:1
wide steps; even the Matterhorn is ~1:1 base-to-summit and **grows from a mountain, never a stick in flat
water**; true needles (Cerro Torre) are rare freaks — which is why they're landmarks. So: **≥80% of prop
instances must have world width ≥ height; a true spire is ONE archetype at the largest step (punctuation,
not vocabulary); nothing tall without a broad base occupying ≥50% of its width; ≥4 UNRELATED outline
families so no two archetypes share a silhouette (the anti-picket rule).**

**What shipped (v2 roster, replacing the slim-candle kit).** `bergwall` (NEW hero — sheer tabular berg
wall, ~1.2:1 wide, colossal, huge planar facets catch the sun as gold sheets) · `serac` (NEW — chunky
icosahedral block-pile ~1:1, ~90 flat facets = the richest per-tri surface, replaces the deleted `sail`) ·
`terrace` (reworked `floeshelf` — stepped ice staircase, 3-8:1 wide) · `pinnacle` (reworked `candle` — a
broad-based horn, **step 48→120** so it's rare punctuation) · `sungate` (reworked — massive Argonath pylons,
not needles; still `paired`) · `glacierwall` (**re-`place()` only**: h6-10→14-22, r24-38→34-50 = a true
58-85-wide ice-shelf front — one number fixed the "small cluster at the horizon" far read). Broad-to-
vertical instance ratio flipped from ~inverted to **86% mass / 14% punctuation** — that single statistic IS
the owner's critique, fixed. The render confirmed it: a varied ice archipelago (broad walls + terraces +
chunky blocks + a few peaks), believable as real ice, holding presence at distance.

**Aspect comes from BOTH `place().r` AND geometry footprint.** The `(r,h,r)` instance scale means a broad
prop needs high `r` AND geometry that fills (or exceeds, via `sx`) its ±0.6 footprint — bergwall/glacierwall
use `sx:1.4` so world width ≈ 1.7×r. Bumping `r` alone on a slim recipe just fattens a needle.

**Richness within budget (no textures, ≤150 tris, opaque):** cyan accent moved from "core sliver inside a
blade" to **"light escaping a crevasse in massive ice"** (recessed face seams, fracture plates, flush
melt-ponds) — glow INSIDE mass reads as depth; glow AS the whole object (the sail) read as neon signage.
Plus per-facet sun variance (a different `ry` on every stacked stratum so facet corners never align →
serrated silhouettes + shuffled glints), stepped self-shadow bands (bakeAO darkens re-entrant corners for
free), and the emissive-transmission fake that scales with mass (a 40u wall's shadow side = a huge soft
blue field, the "lit from within" money shot).

**GOTCHA (again, now permanent): three.js `ConeGeometry(r,h,n)` = 3n tris (2n side + n base cap), NOT 2n;
`CylinderGeometry(...,n)` = 4n; `Icosahedron(_,0)` = 20; `Box` = 12.** And an archetype mixing Icosahedron
(non-indexed) with Box/Cylinder (indexed) must `.toNonIndexed()` the indexed parts or `mergeGeometries`
throws at boot (the `berg` rule) — `serac` does this; envcount + the createEnvironment NaN scan catch it.

**Verify.** envcount `--ci` green (all ≤150t, Frozen 244 inst/26k tris under caps, serac's mixed-index merge
built clean); createEnvironment 0-NaN (56 meshes); gold-determinism byte-identical (render-only);
bulletcontrast pass; biomecycle 11/11; tricount 0 over. **Look confirmed on real renders at 700/1500/2600**
— varied massive believable ice, not a picket of needles.

**Still open:** owner's read on the preview (the arbiter); then push further if wanted, sky sun-pillar,
Cathedral Berg landmark, and the **mobile 60fps optimization pass**. `WALL-PROPS-REDESIGN.md §4.2` still
documents the abandoned ossuary and needs rewriting to the Sunset Glacier v2 doctrine before A2.
