# Stiff motion is a RIG-DEGREES-OF-FREEDOM problem, not a geometry problem: give a welded element hinges (a nested tail CHAIN, per-feather blade PIVOTS) and let the EXISTING nullable rig loops ripple them — rest pose stays byte-identical by construction

**Did.** Owner on the reforged fire phoenix: *"it looks great but the motion is the issue. it's quite
stiff. the tail might move but it definitely needs more joint for fluidity. I also wonder if the wings
could also improve with more fluidity."* Ran the Fable director → plan → harsh-critic loop. The fix was
**purely articulation**, not a re-sculpt: (1) the tail — one rigid joint → a **4-joint nested chain**
driven by the rig's travelling-wave `tailWhip`; (2) the wings — fully welded under one shoulder hinge →
**14 per-blade flutter pivots** (7/wing) rippled by the rig's existing blade-lag comb. All static gates
stayed green and the **rest pose is byte-identical to the prior ship** — the motion is added without
touching how the dragon looks when still.

**Learned #1 — "stiff" almost always means too few animated joints, and the cure is to add hinges
that DEGENERATE to the current pose at rest.** The tail already had a travelling-wave driver in the rig
(`tailWhip`: `coil=sin(time·rate − i·0.6)·coilAmp·lock`, `lock=(i+1)/nTail`) — but the model published
`segs` of length 1, so the "wave" was one joint = a rigid swing. The whole fix was **publish a real
chain**: build seg0→seg1→seg2→seg3 as nested Groups, offset each child by the inter-joint vector so the
assembled rest pose is unchanged, mark them `isBone=true` (preview-tick tear guard), and
`segs.push(...chain)`. The rig loop was already correct; it just finally had 4 joints to walk.
Motion-captured proof the wave now travels: cruise yaw amplitude **grows toward the tip** (seg0 ±0.036
→ seg3 ±0.124 rad) and a hard turn makes a **progressive curve** (seg0 −0.13 → seg3 −0.55 rad), where
before every number past joint 0 was zero.

**Learned #2 — quad-bin the element's geometry across the new joints so the WHOLE thing flexes, not
just the root.** A chain is useless if all the fire still hangs off seg0. Distribute each emitted quad
to the joint whose axial span contains the quad's centroid (`jIdxOf(center)`), reparent the mesh to
that joint, and **compensate its position by −cumOff[k]** (the joint's cumulative offset from root) so
world-rest is preserved. Byte-identical rest + per-joint flex is the combination that lets you add
fluidity to a shipped-looking element with zero visual regression at rest.

**Learned #3 — a welded wing gets fluidity from per-feather PIVOTS wrapping each blade at its root,
and the rig already has the loop (`wingBladePivotsR/L`).** The wing's stiffness was structural: all
geometry welded under `mid`, only the shoulder hinge moved. The cheap fix (CP-W1) is a `bladeWrap(grp,
base)` helper — put each long primary fire-feather in a Group hinged at its root: `pivot.position =
base`, `grp.position = −base` → world-rest byte-identical, and `rotation.z` now articulates that one
feather. Publish the pivots as `parts.wingBladePivotsR/L` and the rig's nullable blade-lag comb ripples
them (each feather trails the flap a beat behind, amplitude `0.05+0.09·fr` deepening outboard).
Captured: blade0 ±0.038 → blade6 ±0.104 rad, and the L wing byte-identical to R.

**THE GOTCHA (cost me the first wingsym run) — the rig's `b.side` is for wings whose L geometry is NOT
mirrored; if your L wing is already `scale.x = −1`, pass `side:1` for BOTH.** The blade-lag loop does
`pivot.rotation.z = b.side·static + swing`. My L wing is a `scale.x=−1` mirror of the canonical +X
wing, so the scale ALREADY flips rotation.z's visual sense. Passing the `−1` loop-side on top
**double-flipped** it → the wingsym probe caught an apex-pose asymmetry of Δ0.147 (only in `dYmin` — the
lowest feather). Setting `side:1` on both wings (let the scale do the mirror) → Δ0.000 across all five
flap poses. **Rule: a mirror transform and a sign convention both flip; use exactly one, never both.**
The `swing` term is un-signed and rode the mirror correctly the whole time — only the static splay term
was wrong, which is why the failure was a small residual, not gross.

**Banked process gotchas:**
1. **`timeout N node …` piped/backgrounded fights the harness.** A `timeout 200`-wrapped flapstrip got
   SIGTERM'd (143) mid-render while a *second* copy I'd launched contended on the same `/tmp/flap-*.png`
   paths → glide+recovery rendered, then stall. Run ONE render, let it finish, read the task-output
   file (not the shell) for the "wrote … strip" line.
2. **A still frame can't show motion — capture the rig numerically.** The believable proof of "fluid"
   is the per-joint/per-blade amplitude table from a headless rig tick (`scene.traverse` for named
   pivots, sample `rotation` over N frames), not a screenshot. The flap-STRIP (5 poses) shows pose/read
   quality; the number table shows the wave actually travels. Bring both to the critic.
3. **Name your animated pivots** (`p.name='sunBladePivot'`, `pivot.name='sunfireTailPivot'`) so a probe
   can find them by `getObjectByName`/`traverse` without guessing among anonymous Groups.

**Critic round (r46 → r47) — three things the harsh pass caught that the first cut got wrong, and
the fixes are more reusable than the original:**

- **A "vertical undulation" that reads as a pose, not motion, is a BIAS bug.** My first `undX` was
  `undA·lock·(sin(…) − 0.35)` with `undA=0.05`: the `−0.35` DC term dominated the tiny sine, so a
  numeric capture of `rotation.x` showed a monotonic drift (a static droop) with almost no oscillation
  — and the rear-chase camera, which sees the tail END-ON, reads the vertical axis, so the one axis
  that matters was the dead one. Fix: raise the amplitude until the **cumulative** tip-pitch RANGE is
  comparable to the lateral wave's (0.20 vs 0.36 rad here), and *verify it as a ± range over frames*,
  never a point sample. Also: phase-lag spreads CANCEL — `i·0.9` rad/joint over 4 joints (>½ cycle of
  spread) killed half the cumulative swing; `i·0.7` recovered it. Match the coil's lag family when you
  want the cumulative to survive.
- **On a NESTED chain the per-joint rudder/coil COMPOUNDS** (world tip ≈ Σ locals ≈ 2.5× the base on a
  4-joint tail). The single-joint tail turned ~30°; the same rig code on a 4-joint chain hooked to
  ~77° — a J-rudder, not grace. The tell: a probe reading `n.rotation.y` returns LOCAL rotations; the
  visible curl is their SUM. Fix = a nullable `tailRudderScale` (0.5) trimming the turn gain so the
  *cumulative* lands where the single-joint one did (~25°). **When you multiply an element's joint
  count, re-budget any per-joint gain against the new cumulative — the old constant now stacks.**
- **Up-bias a vertical wave and its corridor-safety becomes BY CONSTRUCTION.** The corridor law only
  bounds DOWN (low-aft mass). Bias the undulation so its most-DOWN phase sits at/above the rest pose
  (here max cumulative pitch = −0.03 rad, i.e. still *up* of rest, because `sin(…) − 0.20` never goes
  positive enough to pitch below rest): then the animated tail is bounded by the rest pose, the rest
  pose already passes the static corridor gate, so **the animated tail passes too without a dynamic
  sweep** — the "remove the freedom by construction, don't test for it" trick, applied to time instead
  of space. Belt-and-braces: also multiply the undulation by `cruise` (= `1 − bankHard·0.7`) so a tail
  yaw-swung into |x| on a hard bank can't simultaneously dip low.
- **The `b.side` double-flip has a twin in verification:** a still frame cannot show whether "fluid"
  is real. Bring the critic BOTH a pose strip (read/silhouette) AND a numeric per-joint amplitude table
  (the wave actually travels) — the critic on r46 correctly refused to credit the vertical axis until
  it saw ranges, not point samples. Believe the harsh read; it was right on all three.

**→ Unlocks.** The pattern "add rig DOF by publishing a nested `isBone` chain / per-part pivots, offset
to preserve rest, rippled by an existing nullable rig loop" is the general, roster-safe way to add
fluidity to ANY welded element (tail, wing, mane, crest, boss appendage) with a byte-identical still.
Plus three transferable rules banked this pass: (1) match phase-lag family to the cumulative you want;
(2) re-budget per-joint gain when you add joints (locals compound); (3) up-bias a wave to make its
corridor safety hold by construction. And the mirror-vs-sign double-flip rule applies to every
`scale.x=−1` mirrored assembly that also feeds a per-side rig term.
