# Tempest I1 — the billowed cloud-mass, the caged dynamo, and the charcoal value tension

**What we did.** Increment I1 of the Thunderhead Tempest: `cumulonimbusTorso` for real — a
billowed CHARCOAL cloud-mass built as a CLOVER-LOFT (3-lobe billowed cross-sections + a small
per-station rotation = a diagonal turbulence weave), diffuse silver-lining rims, scapular storm
cowls, and the CAGED DYNAMO storm-heart at the sternum on the real transparent `coreGlow` hook.
Landed behind a fresh harsh Fable gate that returned **REVISE** first pass (avg 3.4) — the expected
one-rework-per-checkpoint — then **PASS** after the rework. Wings/head/tail stay the I0 stubs
(STORMFORK = I2, stormbrow + virga = I3, the Storm Circuit = I4).

**The reusable engine facts (banked):**
- **`cloverLoft` = the `knapLoft` pattern + a per-station `rot`.** knapLoft welds shared profile
  indices into longitudinal strakes and *deliberately cannot rotate* (that is what makes it
  strakes). Add a small alternating ±10–14° rotation per station and those columns skew into a
  DIAGONAL TURBULENCE WEAVE — it kills lateral rings (adjacent stations out of phase) AND straight
  strakes (columns wobble). A 9-point clover-of-3-lobes profile (`r(θ)=1+0.30·cos(3θ+90°)`) gives
  the billowed convex lobes that read as cloud-mass, not a smooth tube.
- **The caged dynamo rides `coreGlow` but idles DARK.** The rig ticks `coreGlow.material.opacity`
  (dragon.js:1159: floor `userData.base` → boost×1.5 → fever blaze), so the hook needs a transparent
  mesh. Tempest's identity is INTERMITTENT ("threatens, not withholds"), so `userData.base` is set
  LOW (~0.06) → the core is near-invisible in cruise; the visible "generator" read is carried by the
  OPAQUE vanes + hash-jittered hub around it. It ignites at I4 (the storm tick) / Surge. Recessed +
  ≥60% belly-occluded so it is never an enclosed framed hole or a continuous lantern (anti-reskin).

**THE LOAD-BEARING LESSON — a rendered-value target can be UNREACHABLE under an albedo LAW, and the
fix is spatial spread + a floor, not albedo inflation.** The I0 gate set a target of pale-tile body
median L 0.17–0.28. But the SETTLED charcoal law fixes the body ALBEDO at HSL-L 0.20–0.26, and a
matte flat-shaded body under the game/studio light rig (warm key ~1.7, sky-hemisphere ~0.8–1.0, ACES
exposure 0.92) renders most facets at FILL-ONLY → albedo 0.21 renders to **median ~0.09**. Reaching a
rendered median of 0.17 would need albedo ~0.4 — which breaks the asserted law and washes out the
CHARGING ladder. **The absolute rendered-median target was an albedo-units calibration error.** The
gate's own re-ruling: it is unreachable-as-stated — but do NOT just log-and-skip; there are three
legitimate within-law levers:
1. **Use the full band SPATIALLY.** The law fixes albedo 0.20–0.26; render ONE flat value and you get
   a bimodal "black body + white stripe" poster with no mid-tone. Put the lightest tier (~0.26) on
   lit lobe CRESTS and the darkest (~0.20) in shadow CREASES (band by column radius) — the mid-tone
   cloud gradient AND the billow read, for free, fully legal. Highest-value lever.
2. **A hue-matched emissive FLOOR is not albedo.** A tiny uniform cool-charcoal emissive
   (`CLOUD_FLOOR 0x070a12`) simulates a cloud's ambient self-scatter so crevices don't crush to
   black. Must be uniform + hue-matched or it reads as GLOW (the LED-strip failure). This REVISES the
   future §B.8 "body emissive = 0x000000" inventory assert to "≤ a tiny hue-matched floor" — the
   design gate approved the lever; log it so I5's starters block asserts the floor, not pure black.
3. **Re-anchor the metric to where it is physically meaningful:** whole-body median ≥2× Vesper
   same-rig; p75 in 0.20–0.30 (mid-tone presence); and top-planform torso-band 0.17–0.28 (up-facets
   DO see the fill). Net r1→r2: f3 median 0.088→0.135, p90 0.40→0.314 (bimodal extreme gone), and
   f0 (0.171) now reads clearly lighter than f3 (0.135) — the ladder step landed as a side effect.

**GOTCHA — the whole-dragon value median is CONTAMINATED by whatever is still a stub.** Half the
silhouette pixels at I1 are the still-dark STUB wing membrane, so the whole-dragon median under-reads
the TORSO. Sample the part you actually built (a torso-band crop) to gauge it honestly; the
whole-dragon number lifts when the STORMFORK wing (opaque tiers + silver caps) lands at I2.

**GOTCHA — the "silver lining" wants to be an INTERRUPTED, TAPERED accent, not a crest-tracing
ribbon.** Tracing a rim along the ROTATING lobe crest across the whole body produced three
full-length ZIGZAG stripes — the gate read them as a tech racing-livery, not "the sun behind a
cloud," and they out-read everything. Fix: ONE short dorsal dash over the middle ~40% of the body,
width HANN-tapered to zero at both ends, on the dorsal crest only, capped under the (future) eyes.
A lining lives where a lobe crest meets the silhouette and NOWHERE else.

**GOTCHA — a cowl built as a flat plate reads as a CARDBOARD BOX (90° silhouette corners).** Loft it
(a mini clover cap, ≥8 faces, blended into the shoulder lobe); overlap > weld still holds, but the
plate itself must be a rounded volume, never a right-angled card.

**The process point.** The gate REVISE was the system working: a first-try PASS means the bar is too
soft. The r1 critic localised four concrete must-fixes (livery / cowl-box / slim-silhouette /
bimodal-value), each a cheap, targeted change; the RESUMED r1→r2 comparison is sharper than a fresh
spawn. The builder never judged its own output. Roster stays byte-identical (additions only); the
four prescribed suites + wingsymprobe Δ0.000 + smoke all green.

**What it unlocks.** I2 builds `stormforkWings` (the STORMFORK bolt-frame, §D) on a torso that now
reads as a broad, value-graded, silver-lined cloud-mass — and the whole-dragon value lifts into band
once the wing carries its own 4 tiers + silver caps instead of the dark stub sheet.
