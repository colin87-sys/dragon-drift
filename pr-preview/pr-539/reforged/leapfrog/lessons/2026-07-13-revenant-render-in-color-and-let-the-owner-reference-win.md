# Revenant rework — render in COLOR, spawn the Fable gate, and let the owner's reference win

**What happened.** After I0–I2 (built and judged only on headless BLACK-FILL silhouettes), the owner
flew the dragon in the preview and sent screenshots + the concept-art REFERENCE. The build was wrong in
ways black-fill can't show: a fleshed smooth tail, a shallow ribcage, a dark membrane floating off the
wrist, a long arm, dim khaki bone. I reworked it against the reference and a live Fable critic. Three
lessons, one of them a correction of my own false belief.

**1. You CAN render in color headless — so ALWAYS do it, and run the Fable gate on real renders.** I told
the owner I couldn't produce color renders in this environment. That was WRONG. Chromium + Playwright are
pre-installed (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`), and `node tools/dragonstudio.mjs <key>`
drives a real WebGL render to 45 color capture PNGs (~2 min). The subagent `Read` tool reads those PNGs,
so a **Fable harsh-critic agent (`Agent` with `model: 'fable'`) can look at the actual renders and score
them.** Black-fill silhouettes measure holes and proportion; they CANNOT judge material brightness, glow,
tone, or "does the face read as a skull" — the exact things that were broken. **Never gate a creature on
silhouettes alone. Render color every increment and spawn the Fable gate on the real pixels** — that is
the mandated process and it works here. (The owner had to correct me twice before I checked; check first.)

**2. The owner's reference overrides the handoff digest.** The digest (§4.3) said the wings were an
open-bay lacy skeleton with the "skin mostly removed" — so I built enclosed bay-holes and even wrote a
lesson celebrating them. The reference shows the opposite: the wings are a FILLED dark tattered bat-SHROUD
membrane; the SKELETON identity is carried by the ribcage + spine + tail + skull, NOT the wings. When the
owner shows you the target art, it is the authority — rebuild to it and note the deviation, don't defend
the digest. (The hole-metric work isn't wasted — it now gauges the ribcage windows, where enclosed holes
actually belong.)

**3. The specific anatomy fixes that moved it from "dark bat-thing" to "flying skeleton":**
- **Medial wrist = short arm + long fingers.** `wristT 0.24→0.16` alone fixed the "arm too long" read; the
  fingers carry the span. A bat wing's arm is a stub.
- **The membrane must connect at BOTH ends.** A membrane that starts at the wrist floats. It needs a
  PROPATAGIUM on the humerus (leading edge from the shoulder) AND a PLAGIOPATAGIUM sweeping inboard-aft to
  a BODY anchor — but anchored to ARM-side points only (root, wrist, an aft body point), never a finger
  tip, or it tears when the hand folds. Trim that body gusset so it reaches the hip WITHOUT slabbing a
  dark panel over the ivory ribcage (that slab was reading as the torso and killing the skeleton).
- **The ribcage is the TORSO, not a basket slung under it.** Flare it into a deep wide BARREL (halfW peak
  0.36→0.78, cageDepth 0.48→0.86, 6→8 ribs, rounded cubic rib arc) so it's the single largest ivory mass.
- **A skeletal tail is VERTEBRAE, not a tapered tube.** Reuse the spine's `vertebraUnit`, shrink it along
  the chain, and space it so segments nearly touch (bigger units + more segments) — a smooth loft with a
  spade reads "fleshed," a chain of bones reads "skeleton."
- **Bone must be BRIGHT COOL chalk-ivory.** Dim tan (`0xcfc9b8`) read khaki under ACES; `0xe8e5da` +
  `envMapIntensity 0.25→0.55` + lower roughness made it bleached bone. Keep exterior emissive `0x000000`
  (the law) — brightness is albedo + light, never a glow.
- **The heart is a lantern: size + halo.** A small flat emissive ellipse reads as a green sticker. Enlarge
  it ~2×, raise base opacity, and add an ADDITIVE back-side halo shell so it BLOOMS and spills through the
  rib gaps.
- **A skull needs a skull:** elongated cranium + a HINGED lower jaw with a mouth gap + a tooth row +
  recessed sockets holding the green pinpoint + horns ATTACHED at the occiput (a multi-segment tent so
  they curve back). A featureless cone with detached horn bits is an instant premium fail.
- **Raise the head.** An S-curved neck (spine control points rising toward the skull) lifts the head above
  the shoulder so it reads from the side; a head-low stoop buried the face.
- **Legged skeletons need legs.** Tucked raptor hind legs (femur→shin→3 talons) under the rear cage.

**Process cost of skipping color:** I shipped two increments and two lessons on a silhouette read that
looked fine in black-fill and was wrong in color. The rework kept the harness green (byte-identity,
starters 286/0, wingsym Δ0.000, 0 over budget) — the STRUCTURE was sound — but the LOOK needed pixels and
a critic. Bring both in from increment 1 next creature.
