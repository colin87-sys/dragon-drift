# Drowned Forum PR-8 close-out — the pinisle FLATTEN→overshoot→LENS arc + the full-cycle Fable gate

**What we did.** Closed Fable's four PR-8 harsh-critic conditions on the default-flipped Drowned Forum
(biome 0): (a) full-1500m-cycle capture strip, (b) fix the pinisle canopy silhouette, (c) the arena-suppression
rarity trade-off, (d) roofline deferred. The instructive part is (b): a two-round geometry fight that is a clean
worked example of the DRAGON/AAA "kill the cheap tell, but don't overshoot into the OPPOSITE tell" law.

**THE PINISLE ARC: PALM → PLANE → LENS.** The stone-pine islet's canopy was 3 squashed `ConeGeometry` pads.
- **Round 0 (shipped):** apex rise + counter-tilts → the top edge was ragged/radial at some yaws = **the PALM
  tell** (could mis-caption as a palm, the wrong tree).
- **Round 1 (flatten):** killed the apex (h 0.055→0.030, ~7% rise), pulled tilts toward 0, tightened the stagger.
  The palm read died — but a near-zero-height cone is a **razor**: from the side it collapses to a paper line, and
  the 3 separate pads at staggered y read as **two detached blades with a see-through gap** = **THE PLANE TELL**
  (paper wings / biplane — the house-style kills this on sight). Fable FAILED it 3.6/5. *Flattening a cone does not
  give you a flat-topped solid; it gives you a sheet of paper, because a cone's apex is a POINT with no body.*
- **Round 2 (lens) — PASS 4.3, "ship it":** the fix a flat-topped-solid actually needs is a **tapered LENS**, not
  a flattened cone: `CylinderGeometry(rTop 0.40, rBot 0.30, depth 0.13, 6)` — a truncated cone. Flat top stays
  horizontal at every yaw, but now there's a **visible sloped RIM FACE at side yaw + real depth**, and it's ONE
  piece so there's no blade gap. A second small lens sunk to INTERPENETRATE the crown body adds the wind-sheared
  droop as a fused second tier (no air gap). **The reusable rule: to read as a flat-topped solid with body, use a
  truncated cone / cylinder (a rim face + closed top + closed bottom), NEVER a squashed cone (razor + point).**

**THE OVERSHOOT-PAIR CATALOG (for any silhouette fix).** Fable's two verdicts name a matched pair of opposite
tells around the target: PALM (too radial/ragged) ↔ PLANE (too flat/thin) ↔ DRUM (too thick/machined). The target
sits in the middle: flatter-than-tall (≈2.5–3× wider than deep) with a real but modest rim. When you kill one tell,
**explicitly check the sheet for its opposite** before claiming done — round 1 traded palm for plane; the round-2
lens was checked against BOTH "still a razor?" and "now a drum?" and cleared both. Don't fix one axis blind.

**CHEAPER, NOT COSTLIER.** The lens (one `CylinderGeometry` + one small shoulder) came in at **fewer** merged tris
than the 3 cones it replaced (pinisle 117→110 merged; biome band 49730→49436 < 50000). A correct primitive is often
cheaper than a pile of wrong ones — don't assume "more solid" means "more tris."

**THE FULL-CYCLE STRIP GATE (condition a).** Two 6-frame `_forumscene.mjs` sweeps (d0 120 + 900, step 130) tile the
whole 1500m biome-0 cycle from the natural chase camera, portrait, HUD hidden, obstacles+gate-veil cleared. Fable
read all 11 in ORDER (one frame was a red damage-flash caught mid-capture — skipped) and scored the *cycle*, not a
hero shot: PASS 4.3, "the drowned-city register lands." **A per-prop studio sheet can't catch cycle-scale flaws;**
the full-cycle strip surfaced three the studio never would — (1) a **second-half palette drain** (the gold mirror
goes pale milk-mauve past ~1000m — reads as two biomes stitched at 1000m), (2) **pier-post stubble as a metronome**
(same-diameter cylinder fields in 9/11 frames), (3) **only ONE true breath in 1500m** (cycle A is unbroken corridor
pressure 127→777m). All three are non-blocking fast-follows, logged for the next PR.

**THE CAPTURE-TIMEOUT GOTCHA.** Wrapping the sweep in `timeout 115 node _forumscene.mjs` KILLED it mid-boot (the
Playwright boot + game-to-`playing` handshake alone is ~60–90s; frames then land ~every 15–20s). Let the harness
background-timeout own it, or budget ≥180s — don't cap a capture below its boot time. A red-tinted first frame is a
`dmgFlash` caught on the first `player.dist` teleport; it's a transient, not the look — skip it, don't re-shoot.

**Condition (c) — accept + note, don't couple.** `forumArenaAt` is the crown's ELIGIBILITY predicate, but the
step-900/perSide-1 double-kill means the single slot lands at only ~30% of eligible congregations, so the aqueduct
suppresses at ~70% of spots with no crown to replace it. A true presence-conditional predicate would have to
replicate the arena band's +900 recycle lattice = a fragile coupling to band internals. The gap is mild + localised
(one flank loses its aqueduct; the opposite flank's basilica/arcade still stands), so we took the explicitly-allowed
option 2: **accept as-is with an owner-visible code comment + PR note**, rather than couple two systems to chase a
cosmetic 15%. *When the clean fix means coupling two independent systems for a mild cosmetic gain, a documented
accept beats the coupling.*

**What it unlocks.** The flat-topped-solid = truncated-cone/lens primitive (never a squashed cone); the
overshoot-pair check (kill a tell → verify its opposite on the same sheet); the two-sweep full-cycle strip as the
cycle-scale gate that a studio sheet can't replace; the capture-timeout floor; and the "accept + note beats coupling"
call for cosmetic band-interaction gaps.

**Verify:** `node tools/envcount.mjs` (THE DROWNED FORUM 49436 < 50000); `node tests/gold-determinism.mjs`
byte-identical; `node tests/biomecycle.mjs` 14/0; `node tools/forumleak.mjs` green; re-shoot
`node tools/_forumstudio.mjs <tag> pinisle 26 20 0` → the side tile shows a rimmed lens, not a razor; full cycle via
two `_forumscene.mjs` sweeps → coherent drowned Roman city, gold first half.
