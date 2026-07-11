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

**→ Unlocks.** The pattern "add rig DOF by publishing a nested `isBone` chain / per-part pivots, offset
to preserve rest, rippled by an existing nullable rig loop" is the general, roster-safe way to add
fluidity to ANY welded element (tail, wing, mane, crest, boss appendage) with a byte-identical still.
And the mirror-vs-sign double-flip rule applies to every `scale.x=−1` mirrored assembly that also feeds
a per-side rig term.
