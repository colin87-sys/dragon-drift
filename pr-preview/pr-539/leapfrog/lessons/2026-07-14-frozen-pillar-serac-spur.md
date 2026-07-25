# Frozen pillar reskin — the Serac Spur (and: boxes beat frustums for ice)

**What we did.** Reskinned the Frozen `pillar` from a plain 6-gon cone spike to a SERAC
SPUR: a leaning zig-zag stack of 5 sheared, yawed, offset angular ice blocks with a
seg-3 RE-FLARE (a block stepping out over the one below → a deep-teal overhang), a blunt
sheared top wedge, a single tilted socketed crevasse crack, and a squat foot-rubble arc.
Fable-gated **4.3/5 (ship)**. 84 tris. Reuses the bar's `bakeIceLadder` + `mats.frost*`.

**The big lesson: for procedural ICE, sheared BOXES beat hex frustums.** The first build
followed the pre-assess literally — stacked hexagonal `CylinderGeometry` frustums. It
rendered as a **machined rocket / lighthouse** with a **party-hat cone tip**: radial
symmetry + smooth caps read as manufactured, not calved. Pivoting to a stack of sharp-
edged sheared boxes (the proven bar idiom, applied vertically) fixed it in one shot —
irregular offsets + alternating yaw + no radial symmetry = calved ice, and box top/bottom
faces feed the frost/teal value ladder directly. **Angular > round for ice; symmetry reads
manmade.** (Boxes are also cheaper: 232 tris of capped hex frustums → 84 tris of boxes.)

**Independent r/h scaling — author in UNIT space.** The pillar spawns r≈1.6–3.0 (radius)
× h≈8–21 (height), scaled independently. Author every block's half-widths + offsets as
fractions of **r** and its heights as fractions of **h**, build the geometry in unit space
(centred, base at y=−0.5), then in `hazardMesh` scale the tower mesh `(r, h, r)`. Because
both the collider (radius 0.65r, full height h) and the geometry scale the same way in each
axis, the fairness check is **scale-invariant** — one unit-space pass covers all (r,h).

**Rubble must NOT inherit the height stretch.** Foot rubble scaled with the tower would
smear into spires at h=21. Fix: the rubble is a SEPARATE child mesh scaled `(r, r, r)` only,
seated at the foot (local y = −h/2). Author chunks squat (height ≤ ½ width) so the uniform
r-scale keeps them chunky at any tower height. (Same "visual scale can betray the read"
family as the bar's icicle-hang cap.)

**Occlusion on a yawed body — attach the accent to a face, not a plane.** A flat seam plane
at a fixed z got swallowed because the yawed blocks' fronts poke past it (their corners
reach further +z than the plane). Fix: build the crevasse in the chosen block's LOCAL frame
(on its own +z face, proud) and apply that block's yaw+offset, so it rides the face instead
of floating behind it. Single narrow, tilted (follows the block's shear, not plumb) sliver
in a dark socket → a lit fracture, not a window pane. (Two stacked rectangular glow panes =
instant "lit window / architecture" — killed by going to one tilted crack.)

**Coverage to 80%, top exempt by design.** The collider is a full-height cylinder but any
spike tapers, so the top can't cover it — the shipped cone was worse (top ~60% hollow). The
serac keeps girth (≥0.67r apothem − offset) to ~78% height and only the top ~20% tapers
inside — a *strict, provable improvement*. `pillarColliderCoverage()` samples the 0.65r
circle at a ring of angles across heights 0→0.78 and asserts containment; `hazardskin.mjs`
enforces it. **Verify the box coverage numerically — yaw + offset + shear all eat margin.**

**Reserve frost-white for genuinely up-facing ledges (Fable checkpoint note).** The big
tilted top face was catching frost-white (ny high) and risked washing out against pale
cruise sky — the exact spot the old needle dissolved. Cheap fix: make the top block more
upright + smaller so its bright sky-facing area shrinks and it holds its silhouette. (Banked
rule for the shard: don't let a large high face go white against the sky — it's a hazard-read
regression, not just an art nit.)

**What it unlocks.** The Frozen hazard kit is now two shipped members on one system
(`hazardMesh` + `bakeIceLadder` + `mats.frost*` + the numeric coverage test). The shard
(berg chunk) is the third and reuses all of it.
