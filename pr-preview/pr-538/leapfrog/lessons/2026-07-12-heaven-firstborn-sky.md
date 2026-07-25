# THE FIRSTBORN SKY (PR-K) — the S3 cosmos pivot: paint the identity on the dome, hang ONE star behind the boss

**What we did.** Replaced THE UNMASKED's stage-3 arena (the judgment-court cathedral, owner-pivoted-
away) with an astral/nebula cosmos — the S2 hollow KINDLING into creation — without touching the S2
void, the mix machinery, or the wing base angles. Five phases: **P1** `HEAVEN_HEX` rewritten to a
deep space-indigo vault + violet-magenta nebula mid-lift, the gold horizon band recast as the
GALACTIC PLANE, `starMix 1.0` (the S2 pinholes bloom to a firmament + the dome's night-aurora veil
comes alive for free), the sky-cloud FBM re-tinted warm gold-rose at `cloudAmount 0.35` (= nebula
gas), the mote pool re-skinned to rising stardust (`ambFall −0.10`); **P2** the sea drops ~30u to a
dim-violet near-dead-calm HAZE-DECK inside the exact heaven window (`water.js` — `k = smoothstep
(1.45,1.85,mix) × fade`, threaded through main.js since water.js→boss.js would cycle through
environment.js; the Reflector needed ZERO work — it derives its mirror plane from the mesh world
transform per render; `contactShadow.js` fades with the same `getArenaDropK()`); **P3** `arenaSet.js`
v3 — column/lancets/rose DELETED, replaced by THE GODHEAD STAR at ~420m on-axis, y 100 (hot core +
vast corona + 4 diffraction spikes, 364 tris, ONE draw, layer 1, ±2% breath, never spins) plus an
owner-A/B **galaxy-core spiral** variant (`setStarMode('spiral')` — 3 STATIC log-spiral gas arms,
452 tris, same breath, §3 stillness: never rotated); **P4** the mantle settle coefficient −0.30 →
−1.10 (`bossUnmasked.js` — settled endpoint 1.65−0.35−1.10 = **0.20**: the throw overshoot 1.30 is
untouched, the HELD S3 pose reads ≈ S2 at fight distance).

**The headline lesson — THE NEAR-SIDE-ANCHOR LAW.** The court's real structural failure wasn't
values, it was PARALLAX: near-field side elements (lancets at |x| 19–28, ~30–200m out) + the
stable-room anchor (`set.position.z = -playerDist`) = furniture that visibly RIDES the player.
The two poses that are immune: (a) **dome-painted** — anything expressed through the sky shader
(nebula = the existing cloud FBM band re-tinted; firmament = starMix) is camera-locked and
parallax-perfect BY CONSTRUCTION, and costs ZERO new draws because the dome already draws; (b)
**far on-axis** — a single element ≥250m ahead moves ~1° while the boss moves ~13° under the same
lateral input, i.e. parallax-invisible. Nothing sits at |x| 19–28 anymore. A cosmos self-grounds:
"nothing floats arbitrarily" is free when the set IS the sky.

**The gotcha — size far-axis art to the BOSS SILHOUETTE, not to the sky band.** The seraph's wing
fan subtends ≈±27° from the rail camera; the first Godhead Star build (corona R 105, spikes ±175 @
420m ⇒ ±14°/±22°) was **100% eclipsed** — the shot showed nothing. The fix is also the strongest
composition: embrace the ECLIPSE (rhyming S1's eclipsed sun) — core stays hidden behind the seraph
(it peeks in lateral motion), while the corona (R 240, slow (1−r)^1.4 falloff so the OUTER half
still carries light) and the vertical spike (±320) bloom AROUND the black figure. Same law hit the
spiral twice: a centre-weighted brightness profile concentrates all its light in the occluded zone
— mid-weight it (`t^0.6·(1−t)^0.9`) so the visible outer sweep reads. **Corollary: any additive
element behind the boss needs its value profile designed for the NON-occluded region.**

**Free wins to reuse.** (1) The below-horizon arc of the corona/spikes is depth-occluded by the
opaque water plane — the star "rises off the galactic plane" with zero masking work, and the parry
corridor never sees it (corridor p90 moved 0.331→0.370 with the star on). (2) The haze-deck drop is
ONE line in `updateWater` + a window k, and the wing-clearance deficit the court documented as
unreachable (needs +25u lift, organ gate caps at +2) dissolves — the deck now sits 28u+ below the
worst wingtip. (3) Headless screenshot tools MUST re-force `setArenaSetQuality(0)` and POLL
`debugArenaSet().k > 0.9` before each capture — adaptive quality re-drops the tier mid-run under
swiftshader and silently hides the set (two "empty" A/B shots cost two reshoots).

**Verify.** `unmaskedarena` 47 (new: haze-deck y ≤ −25 in-window / undropped at mix 0 and in the
void / restored after exhale / wing clearance ≥ 10u / star mode lock) · `boss` 126 (the settled-
mantle assert re-authored: |Δz| ∈ (0.001, 0.1) — near-S2, not full-open) · `bulletcontrast` (fog
0x352b52 L .188 ≤ .202) · `unmaskedorgans` · `unmaskedreckoning` · `skyclouds` · `water` · `smoke`
all green. Settled numbers: water y −30, dropK 1.0, wingMin −0.6…−2.8 (clearance ~28u), corridor
p90 0.370 ≤ .75, sky p95 0.801 ≤ .90, sky p50 0.363 ≤ .55. Draws: +1 (the star; both modes built,
one visible). Mix-0 control byte-identical (tests + screenshot).

**What it unlocks.** The finale arc is now dark → dark-KINDLED (void → firstborn sky) with ~80% of
the identity in one palette table; the star is a single dial-set for owner iteration and the
supernova/spiral A/B is a one-line `setStarMode` swap; the anchor law + the eclipse-profile rule
generalize to every future far-field boss backdrop (Embertide-class sky proxies included).
