# Revenant — give the FIRE a body and the BONE mass (a billboard reads as a sticker; a flat ribbon reads as wire)

**Context.** Two Fable gates in a row localised the same class of miss at the rear-chase money
camera: things that were *technically* the right shape/colour still read CHEAP because they had no
volume. The gate went 3.5 → 2.82 (a regression from over-correcting the heart to a faint smudge) →
**3.37** after this pass. The three fixes rhyme: **a flat primitive that faces the camera reads as a
sticker or a wire; give it a 3-D body and it reads as an object.**

**1. The caged fire: a billboard sprite is a STICKER; a small irregular EMBER MESH is a flame.**
The heart went through every wrong shape: an additive pale-mint sprite (blew to a white-hot reticle
disc), then a normal-blended green sprite (killed the white but now read as a "flat mint rectangle
card floating behind glass" — a perfect straight edge + a perfect circular bloom = obviously a decal).
The fix that finally reads: **a vertex-jittered icosahedron with an unlit saturated grave-green
`MeshBasicMaterial`** (G−R ≈ 122, so it can never sum/desaturate to white — the firewall the sprite
kept tripping), seated ON the spine centre-line between the rib roots (the sprite had projected
*right* of the spine), with a **wider anisotropic additive bloom** behind it (scaled taller-than-wide
along the barrel, low-R/B green) for the through-the-windows spill. A real lump has no card-edge and
no axial base-ring, so it kills BOTH prior failures at once (the white reticle AND the flat sticker).
Determinism-safe jitter: hash the vertex index (`sin(i*12.9898)*43758…`), never `Math.random()`.
**It's still the `coreGlow` hook** — a Mesh works as well as a Sprite because dragon.js ticks
`coreGlow.material.opacity` (needs `transparent:true` + `userData.base`); emissive/basic brightness
then carries the ember at gameplay distance where the faint sprite had washed out.

**2. Ribs: a flat 2-tri ribbon shows only its EDGE from behind → it reads as WIRE.** The ribs were
flat blades whose width lay in *z* (fore-aft). From the rear-chase camera (looking down −z) you see
the thin edge, so seven of them stacked read as "nested wire brackets / a whisk," not a cage. The fix
is **mass in the view plane**: extrude each rib centre-line as a **4-sided diamond BEAM** (cross-
section = the z-axis × the in-plane normal to the arc tangent). Now every rib has four flat-shaded
faces → a lit top vs a shaded underside (the chamfer that says *carved bone*), and real width facing
the rear camera. Cheap (≈ +330 tris for the whole cage, 1173→1499 of a 6000 ceiling). **Rule:
anything the money camera sees end-on needs cross-section there, or a flat face is a wire/blade tell.**

**3. A per-tier albedo ramp can still render FLAT — spread it until the CLIMB is monotonic.** The
bleach ladder had four distinct body hexes but rendered at medians 185/184/185/188 — the bright end
was near-saturating under tonemapping, compressing the top. Fix: **widen the ramp downward** (f0 a
genuinely DIM least-bleached bone ~0xabaeb6, f3 the brightest chalk ~0xedeff4) so the climb survives
tonemapping. Measure the *rendered* median, not the source hex — the law is "value rises up the
tiers," and that's a claim about pixels, not palette entries.

**Bonus firewall note — warm vs cool is set by ALBEDO, blue-skull is set by LIGHT.** The bone read
"warm-tan" on a neutral pale BG (the albedo genuinely was warm: B < R) — fixed by cooling the whole
family to a cool-neutral ivory (B a hair over R) + zeroing envMap. But the "slate-blue skull" is NOT
a material defect: the skull uses the *same* bone material as the body; it just faces UP into the
studio's cool fill light, so its facets catch more blue. `envMapIntensity=0` didn't change it →
proof it's the light, not a reflection. It reads correct ivory in the **dark game lighting** (the
shipped view); the blue only appears under the bright-pale studio rig. Don't chase a lighting artifact
with a warm albedo — that just re-trips the "no warm bone" firewall. Flag it as a bright-sky caveat
for the owner instead.

**Process held (owner-directed): pre-assess → work → GATE, and let the critic localise the camera.**
Every one of these was a numeric, checkable Fable directive ("no straight core edge > 1/3 of the
core; brightest core pixel G−R ≥ 70"; "median rib strip ≥ 6px, ≥ 2 facet values"; "monotonic median
climb ≥ 8 levels/tier"). Building to a measurable target beats "make it look better." **Still additive:**
existing roster byte-identical, starters 286/0, wingsym Δ0.000, blueprint 4/4, 0 over tri budget.
