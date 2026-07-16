# Tempest — the owner reference OUTRANKS the buildsheet: it's a scaled DRAKE, not a cloud

**What happened.** After I0 (scaffold) + I1 (a "billowed cumulonimbus cloud-mass" torso, gated to a
4.0 PASS against the buildsheet's prose), the owner posted a REFERENCE IMAGE and said the work
"looks pretty bad." The reference is a sleek dark-scaled storm **DRAKE** — a lean anatomical body
(deep keeled chest → hard waist tuck → haunch, four clawed legs, long neck, long tail) with a
near-black charcoal **dorsal shell** over a **blazing white-blue emissive UNDERBELLY** (a chevron
lightning seam + dark bolt-glyphs), a white neck crest, and the STORMFORK lightning wings. My I1
torso built a lumpy grey cloud-blob. The whole "billowed cloud" torso premise was **wrong at the
primitive level**, and every gate before this one graded it against the wrong target.

**THE LOAD-BEARING LESSON — the owner reference wins, full stop (DRAGON-DESIGN §3; the Revenant
`render-in-color-and-let-the-owner-reference-win` lesson).** A build sheet's own doctrine can be the
defect. The Tempest sheet's §B.3a specced a "billowed cloud-loft, clover of 3 lobes, rings dead by
construction" torso — and a sheet-compliant build earned "looks pretty bad." When the owner posts a
picture, **rebuild to the picture and log the deviation; do not defend the digest.** This is the
Vesper-plane-wing story repeating: the sheet literally specced the failure. Concretely: I deleted
the entire `cloverLoft`/`CLOVER`/`cloverBand`/`crestRim`/`buildDynamo` stack (the cloud kit) and the
"charcoal value tension" it created, and rebuilt from the reference. **Save the reference INTO the
repo** (`reforged/reference/tempest-owner-reference.png`, tracked) so it is the durable source of
truth every body part is built and gated against — and the owner's standing instruction is now:
*reference the image for the specific body part every time you touch one, and have Fable assess that
part of the reference before building.*

**The value tension I fought in I1 was a symptom of the wrong model.** I burned a rework trying to
lift a matte-charcoal median toward a "not-black" target under an albedo law that made it
unreachable. The reference dissolves it entirely: **the dorsal is SUPPOSED to read near-black** (it
camouflages into the storm sky); the light is not a lifted charcoal, it is a **separate emissive
organ** — the glowing underbelly. Two-value body, not one lifted value. When a value metric feels
unwinnable, suspect the MODEL before grinding the number.

**The reusable build facts banked (drake body):**
- **Anatomical loft, not a mass.** A believable drake trunk is a lofted chain with named masses in
  the RATIOS the reference shows: shoulder girdle widest, chest keel deepest (a bottom keel vertex =
  the sternum V), a hard waist tuck (**chest depth ≥ 1.5× waist**), a haunch re-swell. Get the
  side-profile silhouette to read as an animal FIRST — nothing else matters until it does (~50% of
  the gap in one move).
- **Two-value split as separate MESHES, not vertex-emissive.** MeshStandardMaterial's `vertexColors`
  tints DIFFUSE, not emissive — there is no built-in per-vertex emissive. So carry the dark-dorsal /
  glow-ventral split by assigning each loft facet to a dark material or an emissive material by its
  ring position (bottom arc = ventral glow), grouped per-material → few draws. The emissive belly is
  **always-on** (the reference glows continuously — NOT the "withheld/intermittent" lane the old
  sheet prose imagined; the owner reference overrides that too), bright enough to bloom (emissive
  intensity ~2.6), and lives in **flareMats** (Surge-flared, exempt from the warm cruise rim).
- **Lightning carried by triangulation, zero sprites.** The chevron seam = shift the ventral
  column-arc ±1 on alternating stations (a torn edge). The bolt glyphs = flip specific ventral
  facets back to a dark material (a Z knocked out of the glow). Both are just per-facet material
  assignment — no extra geometry, no sprites, deterministic.
- **A flyer still needs legs.** The reference is a QUADRUPED; a trunk with no legs reads as a slug
  from every gameplay angle. Stub four hanging limbs (thigh→shank→claw toes) at the chest keel + the
  haunch even before legs get their own pass.
- **Verify the glow on the DARK tile.** The identity is "storm-light through the hide on a dark storm
  sky" — the belly + crest must read self-lit with a bloom halo in the `whole (dark)` capture where
  the old charcoal blob vanished. That capture is the real proof, not the pale tile.

**Two measurement gotchas banked from the rebuild gate (both cost real iterations):**
- **ACES desaturates BRIGHT emissive toward white** (the channel-clip law, §C.11). The first belly
  build set the glow emissive to a bright near-white-blue at intensity 2.6 → it clipped to pure white
  (B−R 4 = "house-paint," the gate's word). The fix is NOT a bluer hue at the same brightness (that
  still clips) — it is to keep the glow PANEL dim + saturated (intensity ~0.8–1.2) so the blue
  survives the tonemap, and let only a tiny storm-heart core clip to white. In-game bloom
  re-brightens the panel without re-whitening the hue. A glow organ's job is HUE first, brightness
  second — bloom supplies the brightness.
- **The pale-backdrop value sampler is contaminated by the pale SKY.** The pale studio backdrop is
  itself a light blue-grey (≈ rgb 202,209,226, B−R ≈ 23), so any "bright + blue-biased" pixel filter
  on the pale tile measures MOSTLY SKY and pins every reading near B−R 23 regardless of the actual
  material — I chased that phantom for three renders. Measure an EMISSIVE hue on the DARK tile, where
  the sky is near-black and the glow separates cleanly (there the belly read its true B−R 83). Know
  what your metric is actually integrating before you tune to it.

**The rebuild gate cadence: REVISE → 4 ranked fixes → PASS.** The drake rebuild's first gate was
REVISE — the primitive was finally right (quadruped, dark-back, self-lit belly) but three objective
misses remained: an "orca" CHECKERBOARD belly seam (the ±1-per-station column toggle makes
axis-aligned teeth — a triangle-wave over a 4-station period makes the diagonal chevron the reference
has), the clipped-white belly, and a too-shallow "eel" trunk (the chest-depth ratio passed in the
data but not the RENDER because the absolute rings were too small — deepen the sternum keel into real
mass). Plus thread-thin legs. All four were cheap, targeted geometry/material fixes.

**Process note.** This is why the Fable loop points at the OWNER REFERENCE, not just the sheet: I had
Fable pixel-study the reference body and hand back a numbered build spec (silhouette primitive,
value/emissive map, seam/glyph structure, acceptance checks) BEFORE rebuilding, then gate the rebuild
against that same reference twice (REVISE → fixes → re-gate). The reference is the authority; the
sheet is a draft.

**What it unlocks / carries forward.** The wing (I2) is the STORMFORK — and the reference VALIDATES
§D (the wing skeleton IS a branching near-white lightning bolt), so that plan holds; build it to the
reference's wing. The head (I3) is a crested, horned draconic skull with glowing eyes (the current
stub wedge with a warm-key tan facet is wrong — build to the reference). The tail ends in a glowing
white flame-tuft. Every one of those: reference the image for that part, Fable-assess it, build, gate
against the picture.
