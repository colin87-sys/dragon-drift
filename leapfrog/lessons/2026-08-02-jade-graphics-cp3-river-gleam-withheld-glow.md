# Jade premium CP3 — the WITHHELD river-gleam (per-vertex mask + Surge flood), Fable 4.3 PASS

**Did.** Third checkpoint of the Jade Serpent premium pass. Gave the serpent a **withheld glow** — a
mint self-illumination that lights ONLY the withheld tips (fan-ray crests, tail-leaf points, whisker
beads, a thin dorsal line) and stays a quiet dew at cruise but FLOODS on Surge — jade's answer to the
Tempest's storm-edge ignition. Cleared the harsh Fable gate at **4.3/5** (bar 4.2; G1 4.5 discipline ·
G2 4.5 surge payoff · G3 4 placement · G4 4.5 color · G5 4 cheap-tell) after **two** revise rounds.
Zero new tris (the mask is a value attribute) and it re-lofts through the frozen ribbon for free.

**The build (shipped, apex-only behind `riverGleam`):** a per-vertex `aGlow` float attribute
(lockstep with `colors`, 0 = matte tube → 1 = a withheld tip) + a chained `onBeforeCompile` that adds
`uGleam · aGlow · mint` to `totalEmissiveRadiance` after `#include <emissivemap_fragment>`. dragon.js
pulses the shared `uGleam` uniform OBJECT (stashed on `bodyMat.userData.gleamU`): a cruise dew off the
swim clock × `(1 + 3.6·casOverall)` so Surge floods it. Dials: `gleamColor 0x8ff5cf, gleamBase 0.85`.
The tube's own vertex colour + emissive floor are untouched — the glow is TRULY withheld (the tube
never lights), which is the whole point.

**Architecture gotchas (the plumbing that isn't obvious):**
- **A single vertex-colored mesh can't do withheld glow with uniform `emissive`** — that lights every
  vertex equally. You need a per-vertex MASK. The engine's Surge system drives whole `spineMats`
  materials (uniform flood) — wrong tool here. A per-vertex `aGlow` + a `uGleam` uniform is the fit,
  and it's well-precedented (`arenaSet` aHeat, `dragonWings` `totalEmissiveRadiance *= vColor`).
- **Build the mask LOCKSTEP with `colors`** (one `glow.push` per `colors.push`, ~9 sites) + a final
  `while (glow.length < vcount) glow.push(0)` pad guard. A stamp-style post-hoc fill can't work because
  the glow varies WITHIN an emit block (fan rim vs hub).
- **`dragonModel.js` swaps the model's `bodyMat` to `torsoResult.mats.bodyMat`** — which for jade is
  the HEAD sibling clone, not the tube material. So dragon.js's module `bodyMat` is the head clone.
  Share the SAME `gleamU` object onto `headBodyMat.userData` too, or the per-frame drive writes a
  uniform nothing is bound to. (Also: patch the shader AFTER the head clone so the head program stays
  stock, and set a `customProgramCacheKey` to partition it.)
- **Chain, never overwrite, `onBeforeCompile`** (the L4 lesson) — inlined the wrap here to avoid an
  atmosphere import in the torso builder, so a later atmosphere bind survives.

**The lessons that cost the two rounds (2.9 → 3.9 → 4.3):**
- **Round 1 (2.9 FAIL): cruise dew was invisible + Surge caught the entrance cinematic.** `gleamBase
  0.4` was swamped by the bright sky + emissive floor → the "withheld dew" read as OFF (half the
  concept absent). And the Surge capture at 1.4s caught the shipped one-shot Surge ENTRANCE cinematic
  (arc-crown shockwave rings + a gold world-grade) mid-flight → the critic (correctly) tripped the
  **onion-ring cheap-tell**. Fixes: raise the floor ~3×, and **capture Surge at STEADY-STATE** (wait
  ~3.8s past the entrance flourish) so the DRAGON ignites, not the screen. Lesson: **a withheld glow's
  cruise level must be tuned against the actual scene brightness + the material's own emissive floor,
  not in the abstract** — and **capture power-states past their entrance cinematic** or you gate the
  game's FX, not your model.
- **Round 2 (3.9 FAIL, narrow): the mask was tip-ONLY, so Surge rim-lit instead of flooding.** With
  the mask non-zero only at the rim (`u>0.9`), raising intensity only brightened the rim → a PROFILE
  shot read as "rim-lit cutouts / silhouette," not burning fans. Fix: **grade the mask along the whole
  ray-crest (inner→rim), scaled by the pleat `ridge`** so the recessed bays stay dark (structure
  survives the flood) — then the full crest burns at Surge while the pleats still read. And **restore
  the cruise→surge RATIO**: a tip-only bright cruise + a tempered multiplier had compressed the delta;
  the fix is a LOW cruise floor (rim-weighted dew) × a BIG surge multiplier (~4× delta), not both ends
  nudged toward the middle. Lesson: **the shape of a glow's spatial mask decides whether "brighter"
  reads as "more area lit" or just "hotter edge"** — for a flood you need coverage, and put the drama
  in the multiplier off a restrained floor.
- **Value structure survives the flood only if the dark parts STAY dark.** Scaling the mask by `ridge`
  keeps the bays unlit even at max Surge, so core→bloom→dark reads in BOTH states — that's what makes
  it read as the creature's anatomy lighting up, not a sprite swap.

**Scope discipline (accepted by the critic):** a row of 7 dark neck beads (a head→neck blend
sphere-stack from the shared `draconic` head builder, dark-jade `#123026`, its OWN meshes — found via
a runtime sphere-probe) is NOT part of the gleam system and NOT a CP3 regression → **deferred to CP4
(head chisel)**, which owns the head. Don't chase another checkpoint's geometry to clear a gate; name
it, prove it's out of scope, book it. **CP4 MUST light those beads** (G3 is capped at 4 until then).

**Verify.** `ribbonspine` **27/0** (the `aGlow` attribute is a new channel — doesn't touch the
position/color identity proof, and the mask re-lofts intrinsically since tips stay tips), `tricount`
apex unchanged (value-only), `starters` 461/0. Captures via `_herojade.mjs`, now with a SURGE block
(`game.feverActive=true; feverTimer=99999`, wait 3.8s to steady-state) → surge-top (money shot),
surge-side (profile truth: burning fans or silhouette?), surge-q34.

**Reusable takeaways.** (1) Withheld glow on a single vertex-colored mesh = a per-vertex mask
attribute + a `uGleam` uniform patched via chained `onBeforeCompile`, NOT uniform material emissive.
(2) Build mask arrays lockstep with colors + a pad guard. (3) Know which material your per-frame code
actually holds — `dragonModel` swaps `bodyMat` to the head clone; share the uniform object. (4) Tune a
withheld cruise level against real scene brightness + the emissive floor. (5) Capture power-states at
STEADY-STATE, past their entrance cinematic, or you gate the FX not the model. (6) A flood needs mask
COVERAGE (grade inner→rim), not just a hotter edge; keep the dark parts dark (scale by ridge) so value
structure survives. (7) Put the cruise→surge drama in the multiplier off a low floor. (8) Defer
out-of-scope geometry to the checkpoint that owns it — name it, don't chase it.
