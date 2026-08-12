# Jade premium CP4 — the koi-mask HEAD CHISEL + TAIL REGALIA rhyme, Fable 4.3 PASS (4 rounds)

**Did.** Fourth checkpoint of the Jade Serpent premium pass. Chiselled the smooth koi head into an
**angular eastern-dragon mask** (planed snout, brow-overhang lip, dark eye-socket wedge with a proud
green gem eye, jaw chine) and gave the leaf-fork **TAIL** the fan-crown's ribbed-ray vocabulary
(raised midrib + herringbone veins + fan-frequency pleat striping + serrated lobed silhouette + a
welded near-white tip-seat + gleam crest) so the tail reads as an intentional bookend, not an
afterthought taper. Both behind default-off dials (`koiMask`, `tailRegalia`) — other forms/dragons
byte-identical. Cleared the harsh Fable gate at **4.3/5** (H1 4.5 head · H2 4.0 tail · H3 4.5 rhyme ·
H4 4.5 value · H5 4.0 cruise) after **FOUR** revise rounds (2.2 → 3.2 → 3.6 → 4.0 → 4.3).

**The build (shipped dials, apex):** `koiMask 1.0, eyeScale 0.95, tailRegalia true` + eyeMat emissive
`0x37d67f @ 0.9`, fork `Llen ×1.78 + 5 pleat stripes`. Head chisel is jade-only (koiSkull is used
only by jade); the tail regalia re-lofts through the frozen ribbon; zero net tri budget concern
(apex still under 6000). Head geometry displacement moves verts without changing count → the §7 head
asserts + ribbonspine identity still pass.

**The 4-round climb — each round killed exactly one cheap tell (the pattern to expect):**
- **R1 (2.2 FAIL): flat-black head + illegible tail + cameras never closed.** The head read as
  near-black poverty in every frame (SUN_DIR is −z, so the head faces the sun and its camera-facing
  side is *backlit/shadowed*), and the paint-only "chisel" + a socket-darkening pass made it *worse*.
  The tail regalia was sub-pixel. **Lesson: a backlit head needs a self-illumination FLOOR (like the
  body fans carry), not just albedo — and a feature must be captured at a framing that shows it.**
- **R2 (3.2): lifted the head out of black** (shell emissive floor + albedo step) but the chisel was
  soft value only → "rounded bulb," and the muzzle read plastic-lime. Tail scaled but veins
  invisible. **Lesson: a chisel must live in the SILHOUETTE (geometry), not paint on a smooth loft.**
- **R3 (3.6): chiselled in geometry** (flat snout top-plane + brow-overhang lip + eye-socket recess) +
  de-plasticked (emissive 0.55→0.38, desaturate 12%) → real angular mask. But the enlarged eye
  **blew out to a white headlamp** (over-bloom tell) that erased the socket/brow it was meant to sit
  in. **Lesson: fixing one tell (flat-black) by over-cranking emissive just trades it for another
  (blown-glow); the target is a CONTAINED core, not maximum brightness.**
- **R4 (4.0 → 4.3): tamed the eye** (emissive 2.2→0.9, greener 0x37d67f, eyeScale 1.1→0.95) so it
  reads as a green gem in a dark socket; **flipped the fork shading** so the RAISED crests catch light
  (core→bloom→dark) instead of the midrib darkening to mud; added **fan-frequency pleat striping** so
  the fork explicitly speaks the fans' language. The last 0.3 was three micro-fixes, each closing one
  axis.

**The camera-framing lesson (cost ~1.5 rounds of thrash):** closeups of SMALL elements on a coiling
body are the hard part, not the geometry. Geometry-anchored studio cams are unreliable here —
`scene.traverse` for "the biggest mesh" grabs the WATER/terrain plane, and index-banding the dragon
buffer lands on the fan region (fans dominate the vertex count), not the leaf-fork. What worked:
select the dragon body by its unique `frustumCulled === false` marker; for the tail, judge it in the
**top** (biased tailward) + **chase** frames where it reliably reads, rather than fighting a dedicated
closeup; capture power-states at steady-state; and expect stray environmental boost/Surge rings on
any given frame — re-shoot for a clean one. **Trust the gameplay-framing renders over a fragile
"hero closeup" — if a feature only reads in an impossible camera, it doesn't read in the game.**

**The rider-bead red herring (documented so nobody re-chases it):** the CP3 gate flagged "~7 dark
neck beads." Hunting them cost real effort — `buildDragonModel` produces only 3 spheres (2 eyes +
nape), the offline probe's "7 dark spheres" were a coordinate/stale artifact, and the LIVE scene
probe finally found them: `1a1020` spheres **parented to Scene** (not the dragon group), a
runtime slipstream/rider trail — a SHARED rider cosmetic, dark-purple (not jade), **not jade dragon
geometry**. Correctly out of scope for a dragon-model pass. **Lesson: when a critic flags an element,
confirm it's actually YOUR geometry (probe the live scene: material hue + parent) before spending a
single fix on it — and name/prove out-of-scope items instead of chasing them.**

**Non-blocking residuals (future polish, don't re-gate):** (1) the eye core still reads pale-mint,
not fully saturated jade, at the closeup angle; (2) the top-frame apex cam should back off ~5% so the
fork tip stops kissing the corner; (3) herringbone veins are waived as evidence-limited (visible as
ridging, not confirmable as a herringbone pattern at the fork's on-screen size).

**Reusable takeaways.** (1) A backlit hero element needs an emissive FLOOR, not just albedo, or it
reads black in the shipped lighting. (2) Chisel in SILHOUETTE (geometry) — paint on a smooth loft
reads as a bulb. (3) A glowing gem wants a CONTAINED core in a dark surround; over-cranking emissive
trades flat-black for blown-glow. (4) A raised ridge should CATCH light (core→bloom→dark), not be
painted dark — darkening a proud crest reads as mud from above. (5) To make appendage B "rhyme"
appendage A, give it A's actual frequency vocabulary (here: fan-frequency pleat striping), not just a
similar shape. (6) Each harsh-critic round tends to expose exactly ONE dominant tell; fix that, don't
scattershot. (7) Confirm a flagged element is your geometry (live-scene probe: hue + parent) before
fixing it. (8) Judge small features in reliable gameplay frames; a feature that needs an impossible
camera doesn't exist in-game. (9) Motion stays frozen — head displacement + tail regalia re-loft
through the ribbon; the identity proof + starters asserts catch any slip.
