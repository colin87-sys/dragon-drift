# 2026-07-12 — Flow-tube PR-2: the carve (from guide-line to demand-line)

**Why.** Owner playtested PR-1 (the flow skeleton) and said it *"just feels like a normal
run where you collect rings and speed boosts."* Correct, and structural: PR-1's ribbon rode
`centre()`'s eased **ring line** — the exact curve normal flight already follows — so the
player changed nothing and collected everything. A scoring chain on top of that would just be
bookkeeping over ordinary flight. The fix has to move **the line itself** off the path you'd
fly anyway. (A Fable design pass produced the redesign; this is PR-2 of it.)

**Did.** Re-pathed the flow ribbon into a **walls-free SLALOM** — new pure `flowWeave(seg,
bk, fw)` in `canyonMath.js`, the *same grammar as `spineSway`* (zero at every ring plane →
a perfect stays flyable; peaks at the seams; sign-flips per section → one long C0 S-curve),
but at flow's max amplitude on **both axes** (lateral + a gentle vertical corkscrew whose
apexes cycle x/y for a helix no sibling has). The orb + ember ribbon = base ring line +
weave, so the visible line and the pickup line are one curve. New dials
`canyonFlowWeaveAmp 7.0` / `canyonFlowWeaveAmpY 2.5`; both 0 = byte-identical PR-1 rollback.

Result (measured, `canyon.mjs` flow block): the carve sits at **97% of the X steering budget**
(slope 0.210/0.217, Y 0.145/0.163) with mean apex ~3.2m — as big as fairness allows, crossing
every ring dead-centre. Each run type now owns a distinct verb: **rock = forced carve between
walls; spine = held nerve in a tube; flow = free carve at max amplitude** (its only ceiling is
the steering budget, because there are no walls to cap it — the rock-lesson's `aLane` binder
doesn't apply).

**The three things that fought me (all determinism-safe, pure functions of segment fields):**
- **spineSway needs per-BAND emission, not backward-full-span.** The sway returns to zero at
  a ring only because ADJACENT segments' bands each contribute their half and tile at the
  seam. Emitting one segment's ribbon over the whole backward span holds the seam value
  (never returns to 0 at the previous ring) → wrong. Emit over `band(seg)` `[-wb,+wf]`; the
  gate orb stays dead-centre (weave 0 at z=0). (An arch-per-gap avoids per-band but has a
  C1 kink — a steering *reversal* — at each ring; spineSway crosses the ring smoothly with
  the apex at the seam. Use the smooth model.)
- **Per-band coverage needs uncapped easing halves.** With `halves` capped at 96 (the rock
  cap), a band only reaches ±96 from its ring → coverage holes on 192–260m spans. Add
  `'flowgate'` to `SPINE_FILL` so its halves grow to `span·0.6` and `band` caps them at
  `span/2` → adjacent half-gaps tile edge-to-edge, full coverage. Safe because flowgate's
  "geometry" is a torus + weightless orbs (the mesh-cost reason rock stays capped is absent).
- **Detect gauntlet bridges by inter-SEGMENT distance, not orb-gap width.** A 342m bridge
  whose two ends' bands reach toward each other leaves a ~250m *orb* gap — under a naïve
  260m orb-gap threshold it read as a contiguous failure. Also: a segment's `span` and the
  previous segment's `spanFwd` can DISAGREE across a gauntlet (`span` is distance to the
  immediate prev ring, which may be a gauntlet-internal ring 62m back, while `spanFwd` is
  342m to the next flow segment) — so bridge detection must use consecutive flow-segment
  dists, and the re-catchable guarantee is checked only on the contiguous ribbon.

**Verification added.** `canyon.mjs` flow block now asserts: carve slope ≤ `BUDGET_X/Y`
(flyable), weave == 0 at every ring plane (perfect stays flyable), and an **anti-inert guard**
(mean apex ≥ 3.0m) so a future dial/trim change can't silently flatten the carve back to the
PR-1 straight line — the rock lesson's "measure the lever" law applied preemptively. Full
suite green; `gold-determinism` byte-identical (fixtured streams untouched, no new RNG draw —
`swaySign` was already drawn); `canyonframe` invariant holds (all pure functions of segment
fields).

**Checkpoint review caught (Fable — folded in).**
- **BLOCKER: the vertical corkscrew broke C0 at half the seams.** The Y sign flipped every
  OTHER section (`(runIdx>>1)%2`) while the X sign flips every section — so at seams where
  the Y parity didn't flip, the Y weave jumped ~A (a 4.5m vertical STEP in the ribbon). The
  tests missed it because the slope loop resets per segment (never samples across a seam).
  The deeper trap: the actual band seam is at **zn≈±0.83**, not ±1 — the ease half (0.6·span)
  is LONGER than the half-to-seam (0.5·span), so NO basis is zero at the real seam, and C0
  needs the per-section sign flip on BOTH axes. Fix: `siY = siX` (flip per section); the
  corkscrew survives because the X and Y *bases* differ (X `sin(π/2·zn)` peaks at the seam,
  Y `sin(π·zn)` peaks at the mid-half) → the apexes stay quarter-phase offset regardless of
  sign. **Two standing laws:** (1) a per-axis phase whose sign pattern differs from a
  C0-critical axis must still satisfy C0 at the *real* seam — and the real seam is the
  band-abut plane (zn = half-to-seam / ease-half < 1), not zn=1. (2) When two axes must both
  hold C0, vary the BASIS for a phase offset, never the sign.
- **The guards couldn't SEE the bug** (the class the last sibling review flagged): the
  slope loop reset `prev` per segment, `weaveAtRing` only sampled z=0, the apex guard only
  tracked X, and all guards sampled the pure `flowWeave`, not the EMITTED orbs. Added: a
  **cross-seam C0 check** (evaluate both segments' carved line at the shared midpoint), a
  **Y apex guard**, and an **emitted-orb deviation guard** (map each ribbon orb to its owning
  ring, measure lateral offset from the base line) — so a level.js regression that drops the
  weave fails, not just a canyonMath one.
- **Should-fixes:** the gate-orb skip window was centred on z=0 but the gate orb is at z=−8
  (a ribbon orb could land ~1m from it) → also skip `|z+8|<6`; and the fill guard gated the
  whole band on the backward `span` → gate the backward half on `span` and the forward half
  on `spanFwd`/`bridgedFwd` separately (else a big backward gap kills the forward half and
  opens a hole in the NEXT gate). Both fixed.

**Leapfrog.** PR-2 ships ALONE with an explicit owner stop-point: *"does it read as a
different mode in 2 seconds?"* If the carve alone doesn't land, stop before building the
momentum (PR-3: chain-driven slipstream) on top of it — coexist→prove→migrate, and don't
build a meter over an unproven hook (the exact mistake the original flow plan was about to
make). `flowWeave` is the reusable pattern for any fair, budget-bounded, walls-free carve.
