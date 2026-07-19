# Drowned Forum PR-6 — the `colossus` bronze hand: the value-collapse cure, the verdigris exposure-key, and the HUD-arc pareidolia trap (Fable 2.9 → 3.1 → 4.15 → PASS)

**What we did.** Built PR-6's second landmark — a drowned COLOSSUS FRAGMENT: a giant bronze hand
(4 graduated fingers + rooted opposed thumb + hollow forearm stump) breaking the waterline on the
arcade flank at `|x| 46–58`, UNDER the wall cornice (the register law from the pharos lesson — one
tower over the walls, everything else mass-not-height beneath them). It ships the `verdigrisBronze`
material the ship-sheet wrongly claimed PR-1 landed (grep-clean; the pharos lesson logged the debt).
Three FAIL rounds before PASS — each taught a distinct, transferable law.

**THE VALUE-COLLAPSE LAW: `metalness` with no env map is a black hole, not a shine.** Round-2 FAILED
at 3.1 — "the lit face is darker than the water," 85% of the hand's pixels below 18% luma. Cause:
`metalness: 0.18` on a MeshStandard with NO environment map. A metal with nothing to reflect renders
to near-black — metalness is "replace diffuse with reflection," and reflection of nothing is void. The
cure is a THREE-PART lift, all needed together: drop `metalness` to ~0.05, raise `roughness` to ~0.55
(kills the specular pinch), and add a **bright emissive floor** (`emissive:0xc4b697, emissiveIntensity:0.40`)
so shadowed bronze faces read as *dark bronze*, not silhouette. After: palm-front 0.32, finger-sun-side
0.37, lit faces reach 0.77, below-18%-luma pixels 85% → 2.1%. **Any procedural metal in this repo (no
IBL) must be lit as an emissive-floored near-dielectric, never as real metal.**

**THE EXPOSURE-KEY MUST BE A GRADIENT, NOT A HARD KEY (or the material quarantines).** Round-1 FAILED
at 2.9 — the thumb baked 95% teal patina, the palm 5%, because the verdigris zones were a hard normal
key (`nr.y > 0 → patina, else bronze`) and one part's average normal fell entirely on one side. The fix:
a smooth 3-zone LERP over a band — `if (nr.y < -0.25) dark; else t = clamp((nr.y+0.10)/0.55); lerp
bronze→patina` — so every part gets both albedos across its own curvature. Corollary of the
verdigris/verdigrisBronze family: a per-vertex exposure bake has NO curvature knowledge, so raised-edge
gilt and crevice-dark must be GEOMETRIC (separate part tags: `bronzeEdge` bars, `void` cavity floors),
never keyed from the normal.

**THE HUD-ARC PAREIDOLIA TRAP: verify a "smile" is GEOMETRY before you carve it out.** Round-3 landed
FAIL-NARROW 4.15 — "one deletion from PASS": a curved dashed teal arc across the palm-front that "sits
exactly where a mouth goes." I nearly chased it as geometry (I *did* delete the gilt finger-root slivers
that sat beneath it). The arc was the **screen-space `#hud` gauntlet stamina-arc** — an SVG overlay at
fixed screen-center, NOT colossus geometry. Proof (the verify-before-claiming law, A/B not assertion):
capture the SAME camera twice, once with `#hud` `display:none`. HUD-visible → the dashed teal arc sits
under the `×1.25` badge over the palm; HUD-hidden → gone, clean bronze. It only pareidolias into a smile
because the STUDIO capture centres the hand under the HUD; in real play the colossus is a flank prop at
`|x| 46–58`, never screen-centre, so the arc never overlaps it. **Fix belongs in the CAPTURE TOOL, not
the model:** `_colossus.mjs` now hides `#hud` before the screenshot (frame the geometry, not the overlay).
This is a general studio-capture law — a centred hero prop will collect every screen-space HUD element as
a false surface feature; hide the HUD for any geometry-judgement capture.

**A dim dashed overlay slips a saturated-teal pixel probe — trust the A/B, not the threshold.** The teal
counter (`g−r>45 && b−r>15 && gg>120`) showed near-identical counts HUD-on vs HUD-off (1.70% vs 1.64%),
because the arc is semi-transparent dashes blending over bronze — its pixels don't clear a saturated-teal
gate, and the residual "teal" is the *intended* verdigris patina + water reflection, not an arc. The
conclusive evidence was the visual A/B (arc present-then-absent under the identical camera), not a number.
Probes disambiguate value collapse (luma histograms are unambiguous); they do NOT adjudicate a faint
overlay — the eye + the mechanism (hide the source, watch it vanish) does.

**GILT WITHHELD, not placed.** Any bright mark on the open palm front reads as a mouth at the play angle,
so the round-3 gilt reward (finger-root crevice slivers) is PARKED to a later deep-crevice-glint polish
pass — not on the palm face. Withheld-glow law (gilt count ≤4/13) satisfied by absence for now.

**What it unlocks.** The emissive-floored-metal cure and the gradient exposure-key are reusable for every
procedural bronze/metal in the roster (no IBL exists). The HUD-hide capture law protects every future
centred-hero studio shot. PASS at Fable's stated 4.3. **Non-gating polish PARKED (Fable):** deepen the
forearm-hollow read (the cavity floor reads shallow at range); +0.03 luma on the palm front; watch the
flat-tape finger faces (planar teal up-faces want a slight crown or a value break); place the withheld
gilt as a deep-crevice glint off the palm face. Verify: `HERO=colossus node tools/_colossus.mjs`
(HUD hidden); tricount ≤150/prop (~145); envcount green; gold-determinism byte-identical; biomecycle 12/0.
