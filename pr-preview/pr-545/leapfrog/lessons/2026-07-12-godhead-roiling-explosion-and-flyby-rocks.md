# GODHEAD DETONATION — "radiating lines" → roiling EXPANDING particulate explosion + rock flyby

**What we did.** Owner feedback on the premium pass: the fire "just seems like cheaper strong radiating
LINES," and the rocks should fly PAST the camera (huge, whooshing) but never in the lane. A Fable VFX
plan drove three changes in `arenaSet.js`.

**Diagnosis (why it read as lines).** ~80% of the lit area was 64 discrete tapered streak-quads over
black — geometrically a fan of spokes no matter the texture inside them; the veins only scrolled ALONG
the ray (no lateral advection → "god-rays with shimmer"); the radius was STATIC (the reference's defining
beat — the cloud GROWS outward over ~1s — was absent); and the particulate was ~10× too sparse (160
embers). The reference's "substance" is thousands of fine CURVED dust trails + an expansion shockwave.

**Fix 1 — the particulate MASS (the biggest read change).** Embers 160 → **1536 stretched motion-trails**
on CURVED, coherently-braiding paths. Still ONE static-geometry shader-driven draw, zero per-frame CPU.
Each billboard is stretched along its **analytic velocity tangent** (`dc/dlife` of the path → a streak,
not a dot). Curvature = a per-trail swirl whose amplitude is sampled from a **smooth harmonic field over
the launch angle** at build time, so NEIGHBOURING trails braid together (a curl READ) instead of jittering
independently — coherence is what separates "curl" from "noise." **The lesson: to read as fluid/curl,
neighbouring particles must share their swirl (sample it from a smooth field over a shared coordinate),
not roll it independently.**

**Fix 2 — the EXPANSION FRONT.** A shared `frontAt(r)` = a gaussian luminance crest travelling outward
(period 4.6s), faded to zero at max radius and re-born at the core → a SEAMLESS growth pulse, multiplied
into the embers AND every detonation layer. The whole blast visibly GROWS outward every few seconds
(§3 stillness: expansion is allowed, only rotation is forbidden). This is the "shockwave" the reference
has and the fan lacked.

**Fix 3 — corona billows, streaks DEMOTED.** Widened the corona 280→340 (the billowing fire mass), and
cut the streak fan 64→48 + thinner (W 6.5→4.2) + added lateral FBM advection so each streak SNAKES like
a dust rivulet, not a straight ray. The corona's +47% area is PAID FOR by the streak fan's ~50% fill cut
→ net large-additive-volume fill +10–15%, **volume COUNT stays 2** (corona + ignite mandorla). Did NOT
add a separate volumetric dust plane — a 3rd large additive layer is the measured overdraw cliff; the
1536-trail particulate carries the outer roil instead.

**Fix 4 — rock FLYBY (owner ask B).** Split the 30 debris into 22 background (unchanged conveyor) + **8
FLYBY** huge rocks (s 5–9u) that come close and whoosh PAST the camera. **The key geometric insight: the
lane keep-out must be a CONE that WIDENS with proximity** — a near rock spreads outward on screen, so a
flat `|x|≥25` (fine for the far conveyor) is NOT sufficient once rocks come near. The path `x = side·
max(26, 11.7 + 1.3·s + 1.15·d)` (d = camera-relative depth; 11.7 = max camera-x, 1.3·s = tumble radius,
1.15 = the C·tan(fov/2)·aspect slope with margin) provably keeps every rock outside the central screen
column at ANY depth/FOV; z travels far→behind-camera so the recycle is offscreen (no pop). Verified by a
baked `debrisFlybyMargin ≥ 0` (min over the path of x − the k=1.0 clearance) — ships at 1.6. Bullets are
`depthTest:false`/top render-order → occlusion is structurally impossible.

**The timing-marginal exhale bit again.** 1536 trails are heavier to RASTERISE headless, so the
fixed exhale poll (28×120ms) finished one frame short (~50% flake). The exhale genuinely COMPLETES (a
real GPU blinks through it); the software renderer just needed more frames — bumped the poll 28→40. NOT a
shrink-the-art fix (the void-legibility precedent), because these are sparse fine sprites, not a
screen-filling volume, and the owner wants the density.

**Verify.** `unmaskedarena` 56 green (new: flyby-margin ≥ 0; ember count 1536; extended exhale poll):
corridor p90 ~0.35 / p50 0.13, sky p95 0.827 / p50 0.476 (watch p50 — the particulate + front pulse
raised it 0.44→0.48, still under 0.55). loop 94%. `tricount` 0-over. NaN-safe (every pow clamped;
`inversesqrt(max(1e-6,…))` on the tangent; `exp` of finite; hash fract-only). Real-GPU owner **motion**
preview mandatory. `boss`/`organs` untouched.
