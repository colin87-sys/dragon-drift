# Revenant — render in COLOUR and run the Fable gate from increment ONE (the reference is the authority)

**What happened.** I built the Revenant torso (I1) and wings (I2) judging them only by headless BLACK-FILL
silhouettes + the hole-metric — structurally "passing" the whole way. Then the owner flew it, posted a
screenshot and the concept-art reference, and the truth landed: the wings were the wrong architecture
(a lacy open-bay wing where the reference is a filled dark bat-shroud), the tail read fleshed (a smooth
tube+spade, not vertebrae), the ribcage was a shallow half-pipe not a flared barrel, the arm was too
long (wrist not medial), the membrane floated at the wrist instead of connecting into the body, and the
whole thing was too small. A fresh Fable colour-gate then scored the build **2.2/5 (FAIL)** with an
11-point list. After the rework it scored **4.0/5 (PASS)**. Both facts were invisible to the silhouette
tools I'd been trusting.

**The lesson — black-fill proves STRUCTURE, never LOOK. Colour-render + adversarial-gate from step one.**
The hole-metric was genuinely useful (it caught the inverted aperture ladder, it proved enclosure), but a
silhouette answers exactly one question: "is the shape/topology right?" It is BLIND to: material value
(the bone read dim khaki, not bright ivory), which mass dominates (the dark membrane swallowed the ivory
torso — invisible in a mono fill), whether a glow reads as a lantern or a sticker, and whether the whole
thing reads holy/gruesome/toy. Those are the things that decide if a premium creature ships. **Chromium +
Playwright were available the entire time** (`tools/dragonstudio.mjs` renders 45 colour captures in ~2
min) — I wrongly assumed headless meant no WebGL and skipped it. Do NOT make that assumption: render in
colour and spawn the Fable gate at the FIRST increment, not after the owner catches it.

**The reference photo is the contract; the digest is an interpretation.** The HANDOFF digest said "open-bay
wing, holes-in-the-fill." The concept art said "filled dark bat-shroud membrane; the skeleton read lives in
the ribcage + spine + tail + skull." When the owner hands you a reference, it OUTRANKS your reading of the
spec doc — the doc is a lossy summary of an intent the picture shows directly. I rebuilt the wing from
"lacy skeleton" to "filled shroud" on the owner's word and it was correct.

**Anatomy notes that made it read (all owner/Fable-directed, all verified in colour):**
- **Bat wing = SHORT arm, LONG fingers.** Medialise the wrist (`wristT` 0.24→0.16); the fingers carry the
  span. A long humerus reads as a stiff paddle-arm.
- **A membrane must connect to the BODY, not float at the wrist.** Propatagium on the humerus (membrane
  starts at the shoulder) + a plagiopatagium/root-gusset sweeping inboard-aft to the hip — anchored to
  ARM-side points only so it folds without tearing. Trim it, though: too big a root sheet becomes a black
  slab that swallows the ivory torso from the rear-chase.
- **The mass centre must be the identity.** For a skeleton that's the ribcage: a DEEP flared barrel (8
  ribs, wide + deep) that IS the torso, not a shallow hoop slung under the spine.
- **A skeletal tail is VERTEBRAE, not a taper.** Reuse the spine's `vertebraUnit`, sized to nearly touch
  (spacing ≈ centrum length) so it reads as a bone chain, not a dotted line or a smooth rod.
- **A skull needs a skull:** elongated cranium + a HINGED lower jaw with a mouth gap + discrete pyramid
  teeth + recessed eye sockets holding the pinpoint + horns ATTACHED at the occiput (floating horn bits
  read as a bug). A featureless cone is an instant tell.
- **Bright COOL chalk-ivory bone.** The bone was dim/khaki; a premium skeleton is the brightest, coolest
  mass in frame. Raise albedo + envMap; keep exterior emissive `0x000000` (brightness from light, never a
  glow — the glow is the heart's alone).
- **A caged glow is a lantern, not a sticker:** enlarge it to fill the cage, add a dim additive halo shell
  so it BLOOMS and spills through the rib gaps (contained teal-green, never a white/holy bloom).

**Process banked (owner-directed): pre-assess → work → gate.** Spawn Fable to validate the APPROACH and
hand back a checkable target BEFORE building, then build to it, then gate the render. Catches a wrong
direction before the work is sunk (exactly what a from-the-start colour gate would have caught here).

**What it cost / what held.** The whole rework stayed additive: existing roster byte-identical (comm-diff
0 changed rows), `starters` 286/0, `wingsymprobe` Δ0.000, 0 over tri budget, creaturestress peak
unchanged. So a large visual overhaul is safe when it's confined to one self-registering module + its def.
