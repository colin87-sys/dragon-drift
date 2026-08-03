# Audit a build sheet against the REAL rig before building — a passed concept can still cite dials that don't exist

**What we did.** Turned the Gravelight Revenant concept sheet (PASSED v0 + §R + §F, appeal-ranked #1 of
the Fresh Five) into a build-ready v1 (`WRAITH-GRAVELIGHT-BUILDSHEET.md` §B): research DNA (dracolich /
Durnehviir / Dragapult) folded into the anatomy, every hero element mapped to a CITED engine path, the
overdraw counted per drawable, and an I0–I5 increment plan. Also marked the Revenant first-in-build in
`FRESH-DRAGONS-SYNTHESIS.md` (owner call; the Tempest `pulseTimer` tranche moves to the first timed
dragon built after it).

**The gotcha — three v0 numbers had NO rig hook.** The concept sheet (which passed two harsh gates!)
specified `downFrac 0.38` (flap-envelope asymmetry), per-finger micro-lag `0.05·rank`, and a `clickStep
0.08` sway quantize. Grepping `dragon.js` + the Vesper def shows none of these exist: the wingParts
poser drives pivot/mid/tip only (no per-finger channel), and the envelope dials are `glidePow /
tipLag / flapAmp / flapBias / rootAmp / midAmp / tipAmp`. Gates judge silhouettes and budgets — they do
NOT grep the rig. So a "feasibility-passed" sheet can still carry motion dials that are pure fiction
until someone reads the tick. The v1 fix: substitutions recorded IN the sheet (glidePow+tipLag carry
the SNAP; finger-lag CUT; clickStep deferred default-off), never silently "figured out during the build."

**The reusable pattern — read the material tick before wiring any glow family:**
- `parts.coreGlow` (dragon.js:1147–1151) is a real, underused hook: floor → ×1.5 boost breathe →
  ×(1+1.4·sgm) Surge blaze — but it drives `material.opacity`, so the mesh MUST be `transparent:true`.
  If your law says "opaque emissive core," using this hook is a counted overdraw amendment, not a freebie.
- `spineMats` get the GLOBAL WARM cruise rim `0xfff0d8` (dragon.js:222/1185). Any cool/hue-locked
  emissive family (the Revenant's 118° grave-light) must ride `materials.flareMats` instead
  (dragon.js:83 — Surge-flared, never rim-lit), or the warm rim quietly pollutes the hue lane.
- The fever defaults are hostile to every cool dragon: `feverWing 0xff44cc` magenta (1135), `feverEye
  0xff66ee` magenta (1194), `surgeHi 0xfff8e8` white-gold (1156), plus `bodyMat.emissiveIntensity`
  ticked to 0.12 in cruise (1193 — harmless ONLY if body emissive is 0x000000). Override table in the
  def, one row per hook, each with its dragon.js line — and assert the fever-state hues in tests, since
  one missed hook is invisible until the first Surge.
- Overdraw budgets must be COUNTED per drawable, not asserted by vibe: the Revenant's cruise census
  landed at exactly 5/5 (2 hems + heart + wisp + trail) and the Surge at 8/8 — which is what forced the
  Surge wisp default from 3 down to 2. A budget with zero slack is fine if the sheet names the
  first two things to cut (wisp shortens, heart goes opaque).

**A second doc-vs-code catch:** the Vesper sheet's changelog claims a `tests/starters.mjs` premium
assert block landed — grep says no `vesper` block exists in `tests/`; the real in-repo premium
precedents are the Solar (:281) and Molten (:326) blocks. Cite code truth, not a sheet's changelog.

**What it unlocks.** The Revenant can be built increment-by-increment with zero rig surprises: every
motion/glow claim in §B either cites a shipped mechanism (`knapLoft` per-column bands for the
cavity-interior read, the isBone −anchor tail chain, the scapular-cowl overlap, the coreGlow tick) or
is explicitly substituted/deferred. The same pre-build rig audit (grep the dials, read the tick, count
the drawables) should be the standing step between "sheet PASSED" and "branch cut" for the remaining
four of the Fresh Five.
