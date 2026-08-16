# Lost Lagoon v3 — PR-1 karstfang (the identity prover), double-gated 4.3 → 4.4

**What we did.** Built `karstfang`, the FIRST v3 prop and the identity prover for the jungle-drowned-temple
rebuild: a Ha Long Bay fenglin limestone SEA-STACK. Two-stage Fable gate both cleared — **Stage-1 studio
4.3/5** ("SEA-STACK", after a k2→k4 convergence) and **Stage-2 in-context 4.4/5** ("contributing atmosphere
rather than surviving it"). 140 tris, gold-determinism byte-identical, behind the `?props=v3` seam. The
tropical karst LANDS — so the identity is right and the rest of the roster can proceed.

## The reusable techniques

**1. A jittered LATHE is the yaw-invariant primitive for a NATURE landmark.** A prop placed with a random
`rotY` (every nature instance is) must read the same from every yaw or the name test fails at some angles.
A `THREE.LatheGeometry` (surface of revolution) is yaw-invariant by construction. But a clean lathe reads
as a machined goblet/traffic-cone (cheap-tell #1). Fix = `jitterLathe(profile, seg, perStationAmp[])`: add
smooth PERIODIC theta-noise to each ring's radius (periodic so the seam closes; per-station amplitude so
the notch/foot rings stay clean and the belly/shoulder rings bow and disagree). Every yaw then gets a
DIFFERENT but equally-rocky outline; the top plan is an irregular polygon, not an octagon. This one move
took the form from 4.0 (holdout: "faceted funnel") to 4.3.

**2. THE SEA-STACK is a PROFILE, not a cone.** The three silhouette signals are all in the lathe profile:
(1) top-heavy — the SHOULDER (max radius, ~72% height) is wider than the foot and OVERHANGS a pinched
waterline; (2) the marine UNDERCUT — a STEEP flare from a high mid-belly to the shoulder gives a down-
facing underside; (3) chunky COLUMNAR body — the body barely tapers above the shoulder (a smooth taper to
a needle = the cone tell). The k1→k2 fix that killed the cone was making the body chunky + the foot WIDE
(a narrow foot under a wide shoulder reads as a "pot the rock sits in").

**3. Undercut shadow must come from the VERTEX BAKE — AO is gated off at runtime (uAO=0 shipped).** So a
down-facing overhang gets NO ambient-occlusion shadow in game. The dark undercut band is baked into the
tide ladder's diffuse instead: darken faces by `-nr.y` (down-facing amount). Stage-1's studio (flat rig)
hid that the front-lit sun would NOT shadow the overhang in context; Stage-2 exposed it. Fix = raise the
down-face darkening +1 stop (0.42→0.58) AND steepen the overhang (more down-facing area). Then the golden
sun + bake together read as CAST SHADOW, a distinct value zone. **Any overhang that relies on AO for its
read is invisible in this engine — bake the shadow.**

**4. KARST SCRUB is rounded blobs, NOT a parasol.** The canopy playbook (parasol pads) is for TREES
(fig/mangrove). Applying it to karst-top scrub failed twice: a flat pad read as a floating frisbee, then
(enlarged) as a sideways HAT-BRIM sticking past the rock. Karst vegetation CLINGS to the rock — so: low-
poly `IcosahedronGeometry` SCRUB BLOBS (squashed `sy<1`), a green mound capping the summit with the rock
PEAK poking THROUGH it (the single most karst-authentic beat Fable found), a second bush hugging the
shoulder flank, bases sunk into the stone (occlusion weld). Rounded masses read as vegetation at cruise
where a thin pad vanishes edge-on. **Match the foliage primitive to the plant: pads for tree canopies,
blobs for shrub/scrub.**

## Gotchas

- **The studio's "pot foot" was a studio artifact.** With no water, the jade tide band `[0,0.22]` reads as
  a separate teal pedestal. In-game the prop base seats at world y=−0.5 and the waterline (y=0) cuts near
  the foot, so the jade reads as a tide STAIN meeting real water + its MIRROR DOUBLE — the single most
  beautiful beat in the frame. **A base-band prop's waterline read can only be judged in-context; don't
  burn a studio round "fixing" the pot.** (Confirms the in-context-camera-seam lesson: Stage-1 for form,
  Stage-2 for everything the water/light/mirror touch.)
- **The in-context capture must reach `playing` state or you shoot the attract menu.** The first tap
  fast-forwards the intro (doesn't launch); loop click+Enter until `game.state==='playing'`. And on the
  weak headless runner each swiftshader frame is ~30s — a fly-burst + close loop times out at 300s, so the
  gate tool must be LEAN (small viewport, close-up only, ≤3 frames). `tools/_kfclose.mjs` is that tool;
  `tools/_kfstudio.mjs` is the Stage-1 sheet (viewport ≥ rows·cell — the row-clip law).

## What it unlocks

The `?props=v3` coexistence seam (v2 default, v3 behind the param, both byte-identical to determinism) +
the two-stage gate harness + the four techniques above are now the template for the rest of the roster:
`prasat` (hero temple, `bake:'temple'`), `figgate` + `mangrovehold` (trees, `bake:'root'`/`'lily'`),
`lotusraft` + `nagawall` (`bake:'bloom'`). Ledger polish carried forward for the family's next pass: one
asymmetric shoulder knuckle on the lathe profile; a one-vertex jitter on the jade foot-band boundary (it
terminates too crisp — "sock" edge); a small satellite scrub blob to break the backlit cap's single-convex
"tarp" silhouette.
