# ENG-C4 — ORBIT ANNULUS (`grazeForm:'orbitAnnulus'`): fly the twins' figure-eight for a lap jackpot

**What we did.** Added the second grazeForm branch on the shipped tick economy (ENG-D's forward
contract), for EITHERWING C.4. During the twins' `figureEight` setpiece, a drawn surge-pink band
rings the group centre; **co-rotating inside the band** pays ramping graze ticks (the beamEdge
economy verbatim), and completing a **full unbroken lap** (|unwrapped Δθ| ≥ 2π) is a discrete
jackpot: **+1 adrenaline rung + a 0.5s i-frame pulse**. It turns one of the audit's flagged
"boring twins" passes into a legible risk lane — orbit WITH them while their crossfire converges
through the band.

**How.** One branch appended after `slipstream` in the grazeForm cluster, plus a jackpot helper.
Lap detection = an **unwrapped angular accumulator**: each in-band frame, `dTh = wrapToPi(θ −
θ_prev)`, `orbAcc += dTh`; `|orbAcc| ≥ 2π` fires the lap and keeps the remainder (laps chain).
Plain module vars (`orbAcc/orbPrevTh/orbLaps`) on the slipstream precedent, joined to the three
reset sites + the per-arm reset in `armSetpieceForPhase`/`debugRunSetpiece` (keyed `sp.id ===
'figureEight'`). The lap payout rides only shipped seams: the rung advance fast-forwards the no-hit
ladder clock (`adrenT = Math.max(adrenT, ADREN_RUNGS[adrenRung])`) and the ladder block — which runs
later in the SAME fight tick — converts it to a rung with its own bossNote/sfx/`emit('adrenalineRung')`;
the pulse is `player.rollInvuln = Math.max(…, CONFIG.rollInvuln)`. Opt-in = one def line on EITHERWING.

**Key design calls the PRE-BUILD Fable pass locked in (why the obvious approach is wrong).**
1. **Centre on the GROUP pose (`pose.x/pose.y`), NOT the twins' instantaneous midpoint.** The tilted
   lemniscate's `sin(2θ)` component makes the true midpoint wobble ~±2.6u at *twice* the orbit
   frequency — a band tracking it would be unflyable and would violate the drawn-in-world law (the
   drawn thing must be the paid thing). The group origin is the stable centre of the eight, already
   in cluster scope, zero model coupling — same discipline as slipstream/shadowRide reading `pose`.
2. **θ accrues IN-BAND ONLY.** If the core accrued, a player could wiggle a tiny circle around the
   centre and farm laps — the §5i.B "kills parking exploits" clause applied to rotation. The core is
   unpaid, no progress, never harmful (annulus, not radius).
3. **A SECOND band mesh, not a shared one.** `slipBandMesh`'s radii (3.2–4.7) are baked into its
   RingGeometry; a shared mesh could only uniform-scale, preserving the *ratio* not the wall width —
   the drawn band would then lie about the paid band. ~80 tris built-once/hidden is the honest cost.
4. **Geometry safe by construction, no clamp/follower** (unlike slipstream, whose dive line leaves
   the envelope): `ORB_R_IN 3.6 / ORB_WALL 1.5` keeps the full annulus inside laneMaxY 22 / laneMinY
   2.5 / laneHalfWidth 13 at every k of the eight. EITHERWING has no arena constrict.

**Gotcha the POST-BUILD verify caught (test-harness, not engine).** The dead-centre and broken-lap
gates flaked until fixed. Cause: `debugRunSetpiece` sets `setpieceT = 0` but does NOT re-evaluate
the pose, so the pose sits at the **stale swayed idle station** (e.g. 4.97, 13.34) until the next
tick, when the eight snaps it to k≈0 (0, 13). A test that reads `poseX/poseY` and parks the player
BEFORE `updateBoss` lands the player at the pre-jump pose while the branch measures against the
post-jump pose → a spurious in-band frame. Two fixes: (a) a `settleEight()` that drives 2 frames
(player parked at the live centre) before measuring, so the pose is on the smooth eight; (b) keep the
broken-lap test's arcs modest (≤3 rad each side) so the unavoidable ~±1 rad one-frame pose-lag drift
can't push either partial past 2π on its own — the FULL-lap jackpot is proven separately. **Live,
the band is drawn AT the pose so both move together — no fairness issue; this is purely a headless
parking artifact.** (Slipstream never hit this because `SLIP_K_ON=0.42` gates its pocket past the
transition frame.)

**Documented side effect (accepted as jackpot flavor).** boss.js's reflect consumer gates on
`player.rollInvuln > 0` alone, so the lap's i-frame pulse also auto-swats reflectable ambers near the
player for ≤0.5s — the lap "detonates" the converging volley, which feels like a jackpot. Bounded
(non-stacking, ≥~1.8s between laps). If the preview reads it as too generous, the dial is a smaller
pulse constant or a once-per-eight ceremony gate — never a touch on the shared reflect block.

**Scope (E-queue row 9, decomposed — did NOT over-scope).** Row 9 = "ENG-A (hero) + ENG-D
(orbitAnnulus) + ENG-E (holder stagger)". The ENG-A half is ALREADY shipped (the live def's
`emitOrigins.crossfire: ['eitherTwinA','eitherTwinB']` + the `eitherMuzzle` holder volley). This PR
is the orbitAnnulus branch only. ENG-E holder-stagger and the midpoint-iris defer to their own PRs.

**Verify.** `tests/boss.mjs` **114** green (+1, stable across 4/4 reached runs): live only during the
eight; in-band ticks ramp + feed the bank; a full lap fires `orbitLap` + `adrenalineRung` + a
`rollInvuln` pulse; dead-centre is unpaid + lap-dead; a broken lap does not pay; voidmaw coexist inert
(and its sibling `slipActive` stays false — one grazeForm per boss). `bossboot` green; `bossgate
eitherwing` G1–G7 pass (hidden orb mesh invisible to the visual gates); only the eitherwing def line
changed — every other boss byte-identical. (Pre-existing entrance flakes — embertide `setEntrance`,
karnvow footwork — are unrelated and still not blind-patched.)

**Do not touch:** the `beamHeld/beamTick/beamGrace` ramp (shared — "one grazeForm per boss" keeps it
safe); the shared reflect `rollInvuln>0` block (tune the pulse constant, not the block); the
`figureEight` path numbers (the branch derives everything from the live pose). Forward: `shrinkDisc`
(KNELLGRAVE C.7) is the last graze form on this economy — ship it IN its boss's PR (its def label is
already live, so a standalone branch would hot-activate an untuned form).
