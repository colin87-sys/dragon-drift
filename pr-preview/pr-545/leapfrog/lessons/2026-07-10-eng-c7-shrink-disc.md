# ENG-C7 — SHRINKING SAFE DISC (`grazeForm:'shrinkDisc'`): a volley-anchored timed pocket, and discharging a live-label footgun with ZERO def edits

**What we did.** Shipped the third and last graze form on the shared tick economy, completing the
trilogy (slipstream → orbitAnnulus → shrinkDisc). For KNELLGRAVE, each **iris toll** now opens a
drawn surge-pink disc at the volley's own contracting centre; riding the **rim** (annulus, not the
safe core) pays graze ticks that **escalate as the disc shrinks**, and the pocket **dies on the last
ring's beat** — bail inside (into the eye, safe) or thread out through the wall. The floor-shrinking
"safe middle" of the iris was always in the game as negative space; this seam draws it and pays it.

**The defining constraint — the live-label footgun.** KNELLGRAVE's def *already carried*
`grazeForm: 'shrinkDisc'` with no engine branch (a "loaded gun" — flagged in the ENG-D lesson). So
unlike slipstream (born inert, opted in by a def line) and orbitAnnulus (no label existed), **the
branch IS the activation** — there's no coexist-first phase on the hero, and the branch had to be
correct + tuned on first ship. Designed around it: **this is the first grazeForm PR that edits ZERO
def bytes** (verified: `git diff bossDefs.js` empty). Because no def moved, rhythmprint/amberdiet/card
gates are untouched *by construction* — the whole risk collapses to the engine branch + Knellgrave
regression, which the gate block covers heavily.

**The form is a new shape: volley-anchored + TIMED.** Neither a moving-centre follower (slipstream)
nor a setpiece-window form (orbit). The pocket's centre and duration are **baked at the iris release
frame** — `armDiscPocket(cx, cy, dur, r0)` stashes the volley's own `(cx, B.fightHeight)` and
`dur = (rings−1)·0.4 + pose.rel/slow`, then the branch drives it by `discAge` alone (note:
`executeAttack(id, player)` has NO `time` in scope — the pocket state is age/duration counters, never
absolute times). The shrink is `discR = lerp(discR0 → DISC_R_END, discAge/discDur)`, ending exactly at
the iris terminal radius `rad·(1−contract) = 3.8` — where the last ring crosses. So the drawn rim is
an honest countdown concentric with the real rings (ENG-B resolves the iris anchor once, so both stay
concentric for the pocket's whole life).

**Key design calls the PRE-BUILD Fable pass locked in.**
1. **Centre on the volley's baked iris centre, not the bell or the pose.** The `bellMouth` rides
   `swingA` on `swingPivot` on top of ±5 `holdSway` (a double-wobble); the pose sways at `stationY 20`
   (an annulus there exits `laneMaxY 22`). Both are the exact unflyable/dishonest cases ENG-C4 rejected.
   The iris centre is frozen per volley — the toll's *anatomy*, not the boss's body.
2. **Escalating ticks on the radius, not a fixed ramp:** `beamTick = max(0.16, discR·0.075 − beamHeld·0.04)`
   — the shrink itself accelerates the payout (richest at the scariest instant), plus the family's
   unbroken-contact ramp on top.
3. **A THIRD band mesh — but a UNIT ring uniformly scaled.** The ENG-C4 "don't share, a scaled ring
   preserves the *ratio* not the *width*" objection is honored by INVERSION: this form's paid wall is
   DEFINED as a ratio `[R·(1−0.30), R)`, so a scaled unit `RingGeometry(0.7, 1, 48)` draws exactly the
   paid band at every radius — drawn == paid is a construction identity, zero geometry churn (a
   fixed-width wall would force a RingGeometry rebuild every frame, since the shrink is continuous).
4. **Gated OFF during The Last Toll** (`setpieceT < 0` on both the arm and the branch): the survival
   ride stays pure dodge, and the degenerate overhead geometry (`pose.rel ≈ 3`) never makes a pocket.
5. **No toll counter existed** (`model.tollBeat()` is exported but unread, and the model's `autoTollT`
   ring visuals over-count real tolls) — so the branch keys on nothing model-side; it owns a plain
   boss.js `discTollN` incremented at the arm site, reset per phase in `breakShield`.

**Test-seam note.** `debugEmitAttack('iris', p)` calls `executeAttack` directly, so on a shrinkDisc
def it also arms a pocket — embraced as the deterministic gate driver (the arm carries its own
def/setpiece/shield gates so this is safe; `debugEmitAttack`'s comment updated to name the exception).
The gate measures within the clean pocket window before any natural re-arm (guarded by watching
`discTollN`), and the dead-centre/coexist asserts are lag-free because the pocket centre is fixed
(unlike orbit's moving centre — no `settleEight` dance needed).

**Scope (build-queue row 12, decomposed).** The row bundles ENG-H (pendulum setpiece), ENG-B bob-lock,
ENG-A bellMouth spiral, and a 4→5 phase expansion. **shrinkDisc needs none of them** — it anchors to
the iris volley + the shipped toll clock, never the pose or a setpiece. Tightest PR = branch + iris-arm
+ `armDiscPocket` + third band + resets + gate. Forward contract: C.7-proper flips `iris → bellMouth
spiral` (removing this form's anatomy from the def), so `armDiscPocket` is a named helper — that flip
moves ONE call site (re-anchor to the expanding wavefront), not a redesign, and the gate keeps asserting
`discPocket` still fires post-flip.

**Verify.** `tests/boss.mjs` **115** green (+1, stable 5/5): arms on the toll only in a fight; shrinks
monotonically to the ring terminal then dies; rim ride pays escalating ticks (last gap < first) + feeds
the bank; dead-centre AND outside are unpaid + the form never damages; successive tolls open smaller
pockets; The Last Toll ride stays pocket-free; stormrend firing iris opens no pocket (inert branch,
sibling slip/orb also false). `bossboot` green. **Zero bossDefs bytes changed** — only `boss.js`
(branch) + `tests/boss.mjs` (gate); the knellgrave geometry/worst-frame/music-death/lifecycle suites
pass untouched.

**`bossgate knellgrave` G3 — a NEW finding, unlike slip/orb (whose bands never showed at capture).**
Knellgrave G3 (palette) FAILS on clean master already (accent attribution 12–16% < the ≥25% threshold —
pre-existing, not this PR). BUT an A/B (3 runs each) shows this branch WORSENS it: danger-band body
pixels ~1% (clean) → ~5% (mine), accent 12–16% → 6–8%. Cause: unlike slipstream/orbit — whose bands
only draw during setpieces that never coincide with the P1-settle capture — **shrinkDisc's pocket arms
on P1 iris tolls, so its surge-pink ring (hue ~318°, within the ±25° danger window of ~342°) is often
on-screen AND large at the capture**, adding danger-hued pixels and diluting accent. This is real signal
that the band is (a) too prominent / arms too freely (spec risk #2: "per-phase pocket cap or arm
cooldown"), and (b) reads too close to the danger role-colour despite being the sanctioned reward hue.
bossgate is a `tools/` preview tool (not in `run-all` CI), and the gate was already red on clean, so
this does not block — but band prominence + the reward-vs-danger read is a live PREVIEW-JUDGMENT item
(paired with the OPPOSITE complaint on Eitherwing's orbit band reading too SUBTLE — the two reveal the
band-prominence dial isn't yet consistent across the trilogy). (The pre-existing embertide
`setEntrance` / karnvow footwork entrance flakes remain unrelated and un-patched.)

**Follow-up in the same PR — reward-band UNIFICATION (owner call: "clear & consistent").** The A/B
finding + owner playtest surfaced that the three graze bands were tuned inconsistently: Eitherwing's
orbit ring was too faint to notice, Knellgrave's disc dominated the frame and read as danger. Fixed by
sharing one look across all three: `GRAZE_BAND_COLOR = 0xff8ce6` (a lighter, ~0.45-saturation reward
pink — pulled clearly off the deep ~0.69-saturation danger-magenta so a reward never reads as a threat;
the #1 preview tunable), and a shared `GRAZE_BAND_BASE 0.4 / RAMP 0.32` opacity drive (bumped from
~0.3 so even the small orbit ring is legible). Knellgrave "less frequent": a `discCd = 1.6s` arm
cooldown so pockets no longer stack on every iris toll (one ring at a time, a visible gap between) —
the spec's own risk-#2 mitigation. Geometry/paid-band widths unchanged (gameplay balance untouched);
this is a pure look/frequency pass. The gate test's toll-schedule sub-assert now gathers pocket #2
ORGANICALLY from the live fight (the cooldown blocks a back-to-back forced arm — that IS the intended
behaviour). Lesson within the lesson: **headless tests prove a graze form FUNCTIONS, never that it's
VISIBLE or reads as reward-not-threat — that gap is exactly what the owner's "I don't see it" caught,
and only the preview closes it.**

**Do not touch:** the `iris` `rad/contract/slow` constants without retuning `DISC_R_END` (assert #6 in
the gate guards this — they are one anatomy); the `setpieceT < 0` purity gates; `DISC_WALL_FRAC` is the
draw AND the pay (one ratio — changing it changes both, as intended). This retires the last graze-form
forward contract on the shared economy; `medley` (UNMASKED, Part D) is the only branch-less label left.
