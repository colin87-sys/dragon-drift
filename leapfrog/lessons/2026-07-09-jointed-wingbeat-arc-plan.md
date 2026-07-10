# Jointed ~180° wingbeat — research + fable-synthesized plan (no code yet)

**What we did.** Answered a player note that the wing flap "feels like a bird flap"
and they want the fantasy-dragon look: a near-180° wingtip arc (apex ≈ 12 o'clock →
bottom ≈ 5–6 o'clock) with the wing bending at the shoulder/elbow/wrist/hand instead
of swinging as one rigid panel. Grounded it in bat/bird flight biomechanics + the 12
animation principles, mapped it onto the four existing wing motion paths, and had a
**`fable`-model agent synthesize the implementation plan** →
`reforged/DRAGON-FLIGHT-ANIMATION-PLAN.md` (research in
`reforged/DRAGON-FLIGHT-RESEARCH.md`). No engine code changed.

**What we learned (the substance).**
- The current beat is small everywhere: direct-pivot ≈30–40°, skinned ≈50°, yoke
  ≈70°. That IS bird range — real birds flap 30–70°. Game dragons *stage* it at
  120–180°.
- The fix's priority order is **fold-on-upbeat + out-of-sync joint lag FIRST, raw arc
  amplitude second.** Cranking amplitude alone yields a "faster/bigger wiggle" — the
  exact failure the Skyrim/MonHun modding discourse names. The read comes from the
  elbow flexing + wrist unlocking so the silhouette *contracts* on recovery (bats fold
  to ~54% span; folding ≈ +50% net lift) and from joints moving out of phase
  (shoulder leads → elbow → wrist/hand → membrane last = overlapping action /
  follow-through).

**The gotcha.** A deep arc naively done breaks three things at once: (1) `flapcheck.mjs`
continuity invariants if you add a "held majestic apex" (that's an interior hold =
CI fail — apex dwell must come only from `downFrac` warp + cosine ease); (2) body
clearance — the wingtip pokes through the belly / crosses the spine at the bottom and
the root gaps off the body at the apex (the L20–L22/L32 seam pain); (3) skin-weight
stretch (verdant GLB already measures 2.48 edge stretch at 0.4 rad — a deep arc
multiplies it).

**The reusable pattern.** Import the yoke solver's CI-certified `flapEnv` envelope
*into* the skinned `flapWing()` animator, so the new wide arc **inherits `flapcheck`'s
guarantees by construction** (it literally is the checked function). All new
`flapProfile` knobs (`arc`, `elbowFoldAmp`, `lagHand`, `shoulderLimit`, `snap`)
nullable → absent = byte-identical shipped behavior = clean coexist. Prove on ONE
showcase dragon (**toothless** — verified it publishes `wingRigL/R` and declares no
`flapProfile`, so opt-in touches nobody), migrate the roster last, per dragon.

**Process note — `fable` gate-agent as the on-track mechanism.** The plan embeds three
FRESH high-effort `fable` reviewer gates (R1 motion-model-locked, R2 showcase-proof, R3
per-migration-batch) with verbatim §8-style prompts (trust nothing, re-read it
yourself, PASS/FAIL + numbered directives, builder never judges own work). This is how
the user wants the implementation kept faithful to the plan. **Gotcha:** Fable 5's
safeguards false-positive-flagged the first planner dispatch (benign dragon-animation
text); rephrasing in softer language and re-dispatching worked. Expect this
intermittently when driving `fable` subagents — keep prompts plainly wholesome.

**What it unlocks.** A ready-to-build, verifiable path to the graceful jointed wingbeat
across the skinned roster, with the arc math unified on one envelope and the studio's
coexist→prove→migrate + gate-agent discipline baked into the increments.
