# GODHEAD DETONATION — cohesion: the cross EMERGES from the fire (three elements → one blast)

**What we did.** The owner judged the detonation as *three disconnected things fighting each other*:
(1) a "holy cross", (2) the radiating core, (3) "those lines" (streaks). The cross read as a bright
DECAL laid over a living fire — same complaint pattern as the ember-boss face reference, where the
face is the fire's NEGATIVE SPACE, not a sprite on top. Fix, all in `arenaSet.js`, **0 new draws /
0 new tris** (pure ALU + one deleted geometry block):

- **A1 — kill the geometry cross.** Deleted the 4 explicit diffraction-spike quads from
  `buildDetonationGeo` (they were constant-value pixels → an overlay by construction). The cross is
  no longer geometry.
- **A1 — regrow it from the corona.** New shared 4-fold angular field `cross4(a) = pow(abs(cos(2a)),10)`
  (peaks on the 0/90/180/270 axes, ~0 off-axis; `abs` base is NaN-safe). The corona branch now:
  `b = mix(1, cells, uRoil) * frontAt(...) * (1 - 0.14·uCross·(1-cx)) * (1 + 1.6·uCross·crossGlow)`
  where `crossGlow = cx · smoothstep(0.2,0.75,n)` and `n` is the SAME domain-warped molten FBM that
  draws the corona cells. So the cross only glows **where the fire is already hot**, and DISSOLVES /
  reforms as the noise scrolls — it breathes with the flames instead of sitting still. Off-axis is
  darkened 14% = the **negative edge** (the cross is defined by the darkness around it, not just the
  bright axes). The two factors are ≈mean-preserving by construction.
- **A2 — unify the embers into the same substance.** The ember trails' colour was a life-based
  hot→violet mix (a separate law from the fire). Rewrote it to the EXACT same **radius** ramp as the
  corona/streaks — `gold(1,.85,.54) → rose(.85,.54,.39) → violet(.5,.4,.7)` over `rr/520` — so an
  ember at radius R is the same colour as the fire at radius R. Young embers get a small `(1-life)*0.3`
  hot boost (a spark, not a second palette). Trails also **migrate onto the cross axes with age**
  (`theta -= uCross·0.12·sin(4θ)·smoothstep(0.15,0.7,life)` — sin4θ attractors on the four axes) and
  a `crossW` density weight brightens the arms, so the embers reinforce the cross instead of scattering
  against it.
- **A3 — streaks bias to the arms.** Baked `cAlign = 0.78 + 0.55·|cos(2a)|^6` into the streak gain:
  the cross-aligned streaks are the bright fire-rivers of the arms, off-axis streaks dim (subtractive,
  fairness-safe). One `uCross` uniform drives corona + embers + (baked) streaks in lockstep.

**The headline lesson — an emergent feature must be GATED BY THE SAME NOISE as the substance it
emerges from, or it's still a decal.** The naïve version (`cross4` added as its own bright term) would
have been the old spike quads with extra steps — a static glyph, just shader-drawn. What makes it read
as *the fire forming a cross* is that `crossGlow` is multiplied by `smoothstep(n)` of the corona's own
FBM: the axes only light up where a molten cell happens to be, and go dark where a crack is. The cross
inherits the fire's turbulence, breath, and expansion front for free. **Emergence = shared field, not
a second field that happens to overlap.** Same rule the ember-boss face follows.

**Corollary — "one substance" means one colour LAW keyed to the same variable.** Embers stopped
looking like confetti the moment their colour was driven by *radius* (matching the corona) instead of
*life* (their own private clock). Two additive layers blend into one blast when a pixel's colour is a
function of *where it is*, not *which system drew it*.

**Fairness stayed under gate — the cross is mean-preserving by construction.** Off-axis darkening
(−14%) roughly cancels on-axis flare, and both multiply the baked `vCol` (eclipse/down-suppression
untouched). `unmaskedarena` 57/57: corridor p90 0.372 / p50 0.129, sky p95 0.848 / p50 0.482, loop
alive 90.1%, tier-2 graceful-degrade centre luma 0.294, 0 console errors (NaN law honoured — every new
`pow`/`cos` base clamped, `theta` migration and `crossW` both `abs`-based).

**Verify.** Headless confirms compile + fairness + no-NaN + loop; the software renderer **undersells**
the cross-emergence and the radius ramp (SwiftShader flattens the FBM breath), so — per the standing
rule — whether the three elements now read as ONE fire is an **owner real-GPU motion judgment** on the
PR preview. Deferred if the owner wants more after seeing it: streaks as true vein-cores sharing the
ember swirl field, and a cross-sector breathe assert (skipped now — a framebuffer-geometry gate on
SwiftShader tests the renderer's quirks more than the art, and the seraph silhouette occludes the
clean sample points).

**Reusable.** To grow a shape OUT of a procedural volume (not paste it on): define the shape as an
angular/spatial field, then **multiply it by a smoothstep of the volume's own noise** so it only
appears where the substance is dense, and darken the complement for the negative edge. Never add it as
an independent bright term.
