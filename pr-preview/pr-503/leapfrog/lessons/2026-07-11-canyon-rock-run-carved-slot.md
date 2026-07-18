# 2026-07-11 — Sky Canyon PR-3: the rock run refounded as a "carved slot"

**Did / learned.** The Rock Run was the owner's #1 unfun canyon: it stacked THREE
simultaneous demands on one stretch — the audited ring line, an **un-audited ±5m sway**,
a mid-slalom **pinch to ~4.5m**, AND **overhead stalactite arches** forcing a vertical
duck every other slice — while the channel centre **teleported** at every seam (it used
raw `gx + sway(f)`, no neighbour threading, and a fixed 36m depth vs 55–150m ring
spacing). Refounded it on the ribcage's proven substrate (`canyonMath`): ONE threaded,
span-adaptive channel whose centre is the same eased ring-line the ribcage uses plus a
**slope-budgeted** sway, and the overhead arches are **deleted** — the vertical squeeze
is the `'overunder'` beat's job. **One axis at a time.** Shipped behind
`CONFIG.canyonRockV2` (flag off = the old `stackRun` verbatim, byte-identical rollback).

**The reusable trick — sway as leftover-headroom, not a fixed amplitude.** The old sway
was a constant ±5 with no idea what the ring line was already demanding, so it could push
past what the dragon can steer. v2 sizes the sway per half from the *remaining* slope
budget after the threaded centre's own easing peak: `A ≤ (BUDGET_X − easePeak)·2·eh/π`,
then capped by the lane-edge margin, then by the artistic `canyonSwayAmp`. The channel
is therefore **swayy where the ring line is calm and calms where the ring line is
demanding** — always under budget (audit: worst rock slope 0.129 vs 0.217 budget), and
seam-continuous because the amplitude is computed from data both neighbours share (the
sway sign flips per section, like the old `cos` phase, so seams meet C0).

**→ Systematize.** Two laws. **(1) One axis at a time above base speed** — never stack
a lateral weave and a vertical duck on the same 50m; give each demand its own beat
(`'split'` = weave, `'overunder'` = duck). Deleting the arches was the fix, not tuning
them. **(2) Any additive motion layered on a reach-audited path must be sized from the
path's LEFTOVER budget, not a constant** — the same shape will serve future kinematic
verbs (updraft sway, current drift): measure what the base line already spends, spend
only the rest. Both are enforced by the flow audit (`canyonflow.mjs` now covers rock:
channel slope ≤ budget, seam continuity, in-lane width + ring reachability), which
consumes the SAME `rockSlicePlan` the geometry builder does — the audit can't drift from
the game. Ship-behind-a-flag with the old body kept one PR is the coexist→prove→migrate
default: the human judges feel on the preview, and one flip reverts.

**→ Leapfrog.** With both canyon set-pieces now obeying the ribcage's law (one readable
tube, one demand at a time, tight where you can aim and open where you can't, protected
exit from PR-1), the Sky Canyon is a coherent system rather than three unrelated hazards.
The `canyonMath` module (ease/halves/band/centre/rockSlicePlan + the budget constants) is
the substrate for the deferred canyon verbs (geyser-launch, updraft) and for a possible
third `'flow'` run type — all of which can now be authored against a proven,
audit-guarded fairness envelope instead of re-derived by hand.
