# DRAGON-FLIGHT-ANIMATION-PLAN.md — The Graceful Wingbeat Arc (jointed ~180° flap)

The wing-motion analog of `DRAGON-DESIGN.md` / `BOSS-DESIGN.md`: the thesis, the
strategy decision, the motion model in numbers, the constraint ledger, the phased
increments, and the reviewer-gate prompts for upgrading the dragon wingbeat from a
"bird flutter" to the sweeping, jointed fantasy-dragon flap.

Grounding: the dragon-flight research brief (bat/bird kinematics + animation craft +
the game-dragon "wiggle not flap" failure mode), read alongside
`js/dragonWingFlap.js`, `js/wingFlapSolver.js`, `js/dragon.js` ~L600–800,
`js/wingDebugPose.js`, `tests/flapcheck.mjs`, and `DRAGON-DESIGN.md` §3/§8. Every
number below traces to one of those. **This document is a plan — no code changes ship
with it.** Studio rules apply throughout: build systems not one-offs; coexist → prove
on one showcase dragon → migrate the roster last; verify before claiming; one
`leapfrog/lessons/` file per meaningful change; the human judges motion/feel on the
deployed PR preview (no WebGL in CI).

---

## §0 EXECUTION LOG (live)

- **2026-07-10 — SHOWCASE RETARGETED TO `azure`** (user directive: "do it on azure first").
  Azure is the FEATHERED falcon starter on the **direct-pivot** path (arm `wingPivot` →
  per-feather `wingBladePivots`), not the skinned membrane path §2 assumed — so the arc was
  built on azure's own rig (no new bones, falcon identity preserved). The envelope-import +
  fold-on-up-beat + out-of-sync-cascade THESIS holds; only the carrier changed.
- **Shipped (nullable knobs; roster byte-identical):** `model.flapArc {apexDeg 80, bottomDeg
  68, downFrac 0.58}` (arm arc off `flapEnv`), `flapFoldSweep 2.5` (rearward comb sweep = the
  real fold for a rigid comb → recovery 0.50× downstroke), `flapTipFold 0.7` +
  `flapTipFoldLag −0.14` (fold leads recovery, rakes back), `flapBladeCascade {amp 0.2,
  lag 1.35}`. Wired into BOTH `dragon.js` (live) and `wingDebugPose.js` (the freeze poser, so
  captures are truthful — L137). New gate `tests/flapcascade.mjs` (auto-run by run-all).
- **Gate R1 (motion model locked): PASS** (fresh `fable` critic, round 2). Round 1 FAILed on
  reversed fold + apex spine-crossing + shallow bottom; directives applied; round 2 re-rendered
  byte-identical pins and PASSed. Measured: apex tip +63° (~1 o'clock), settle tip −52°
  (~5 o'clock), fold 0.50×, no spine crossing, only azure changed. blueprint 4/4 · starters
  201/0 · flapcascade 5/5 · tricount unchanged.
- **R2 polish notes (carried, non-blocking):** (1) apex reads ~1 o'clock not 12 — pushing
  higher (`apexDeg`↑ / softer `flapTipFoldLag`) trades away the fold (verified: 66° costs
  0.50→0.65× fold), so it's a FEEL choice for the human. (2) Port the live per-blade cascade
  (`0.02+0.10·fr + sw`) into `poseBladePivots`' cycle branch so the pins match live exactly
  (currently a static splay; benign for every invariant). (3) The `±1.12×` arc elevation clamp
  can flat-top the apex under boost/climb/decel amplitude (×1.35) — check against the
  no-interior-hold law at the flight-state-composition increment (soft-limit vs hard-clip).
- **Awaiting the human's feel judgment on the PR preview** (drama/bottom depth, beat speed),
  then R2 (fold+cascade+composition polish) → roster migration to the other direct-pivot combs.

## §1 Thesis — why the beat reads stiff, and what actually fixes it

The current beat is a small, symmetric, near-rigid swing. Measured from shipped code:
the **direct-pivot** path swings `flapAmp` 0.52 cruise / 0.7 boost rad ≈ **30–40°
total**; the **skinned** path's shoulder swings `sin(phase)·0.52·flapAmp·strength` ≈
**±25° (~50° total)** with the elbow at only `elbowAmp 0.28` of that and the wrist
fold capped at `foldAmp 0.28`; the deepest path, the **yoke** solver, reaches ~+24°/
−46° (`yokeElevDeg 24`, `downDepth 1.9`) ≈ **a ~70° arc**. Real birds flap 30–70° —
which is exactly why it reads as a bird flutter. Polished game dragons *stage* the
arc at ~120–180°: wingtip near **12 o'clock** at the top of the up-beat, **5–6
o'clock** at the bottom of the down-beat.

But raw amplitude is the SECOND ingredient, not the first. The research is
unambiguous: what separates "living wing" from "rigid panel" is the **jointed
cascade** — on the up-beat the **elbow flexes and the wrist unlocks** so the span
visibly contracts (bats fold to ~54% span on the upstroke; folding is worth ~50% net
lift over a rigid recovery), and the joints move **out of sync**: shoulder leads →
elbow follows → wrist/hand trails → membrane last. The Skyrim/Monster-Hunter player
discourse names our exact failure: "stretches the wings out and gives them a wiggle."
Raising amplitude without the fold + lag produces a *faster, bigger wiggle*. So the
fix, in priority order: (1) a **deep fold on the up-beat** that changes the
silhouette, (2) **out-of-sync joint lag** so parts lead and follow, (3) a **timing
asymmetry** — the down-beat is the slower, broader power stroke — and only then
(4) the **wide staged arc** (apex ~12 o'clock, bottom ~5–6 o'clock). All four ride
one envelope so they compose instead of stacking hacks.

## §2 Strategy decision — which motion path carries the wide jointed beat

**DECISION: extend the SKINNED path — `flapWing()` in `js/dragonWingFlap.js`, driven
by `model.flapProfile` — and adopt the yoke solver's proven `flapEnv` envelope into
it, rather than extending the yoke solver itself.**

The honest weighing:

- **Skinned (`dragonWingFlap.js`)** already IS the anatomy the player is describing:
  a real shoulder→elbow→wrist bone cascade with per-joint phase lag (`lagElbow 0.20`,
  `lagWrist 0.95`) and anatomical clamps (`elbowLimit [−0.55, 0.85]`, `wristLimit
  [−0.7, 0.7]`). Its deficiency is purely quantitative: symmetric `sin(phase)` beat,
  small amplitudes, tight limits. It is data-driven per dragon (`model.flapProfile`,
  grammar-registered in `creatureGrammar.js:85–89`), so the whole upgrade can land as
  **nullable profile knobs — absent knobs = byte-identical shipped behavior**, the
  cleanest possible coexist story. Because the bones deform a skinned membrane, a
  bending elbow actually bends the WING SURFACE — the "different parts of the wing
  lead and follow" read is physically carried by the mesh.
- **Yoke (`wingFlapSolver.js`)** has the better BEAT MATH — `flapEnv` is a time-warped
  cosine with `downFrac` timing asymmetry and `downDepth` bottom control, and it is
  the only path with a CI continuity gate (`tests/flapcheck.mjs`). But its chain
  (yoke→inner→mid→tip) is a curl ladder, not an arm: it has no elbow-flexion concept,
  its "fold" is a curl channel, and its rig parts (`wingYokeL/R`) exist on only two
  dragons (Bull `aurumToro`, Seraph `pearl`). Making it do anatomical folding means
  teaching a spline to be an arm — more work for a worse fit.
- **Synthesis (the systems move):** import `flapEnv`/`curlEnv` — pure math, zero scene
  objects — INTO `dragonWingFlap.js` as the skinned path's new beat source. One
  envelope, two consumers; the flapcheck invariants apply verbatim to the new arc
  because it literally is the checked function. Direct-pivot/wingParts/lobe paths are
  untouched; the yoke path optionally gets a config-only arc deepening at the very
  end (§5 I6) since its solver already supports it.

**Showcase dragon: `toothless` (Night Fury, SSR).** Verified in code: its builder
`nightFuryWings` publishes the skinned rig (`dragonNightFury.js:971–972`,
`wingRigL/R: { shoulder, elbow, wrist, side, profile: model.flapProfile || null }`),
and its def (`dragons.js:593`) declares **no `flapProfile`** — it rides `DEFAULTS`
today, so giving it an explicit profile is a pure opt-in with zero effect on anyone
else. It is the archetypal fantasy dragon the player is picturing, it already has
`tailWhip/bodyWhip/tailSteer` secondary motion that will compound the follow-through
read, its five-finger membrane hull deforms continuously with the bones (no rigid
panel seams), and it is NOT a starter — so the §8 starter aesthetics gate and
`tests/starters.mjs` bands are not at risk while we iterate. Other skinned riders
(`ember` via `emberMembraneWings`, the hull elementals `fire`/`water`/`earth` via
`hullWings`, `verdant` via the GLB auto-rig, plus any `dragonWings.js`
skinnedMembrane / organism / unifiedHull rigs — enumerate with
`grep -rn "wingRigL" reforged/js` at migration time) migrate LAST, each with its own
tuned profile, per the coexist→prove→migrate rule.

## §3 The motion model, concretely

All new knobs live in `model.flapProfile` (grammar-registered like the existing four)
and are **nullable — absent = shipped behavior**. The showcase numbers below are
starting values for toothless; the reviewer gates tune them.

### 3a The envelope (arc + timing asymmetry)

Replace the skinned beat's `Math.sin(phase)` with the shared solver envelope when a
profile declares an arc:

- `flapProfile.arc = { apexDeg: 78, bottomDeg: 62, downFrac: 0.58 }` (nullable).
- Internally: `env = flapEnv(phase, { downFrac, downDepth: bottomDeg/apexDeg })`
  ranges +1 (apex) … −bottomDeg/apexDeg (bottom); shoulder target =
  `−side · env · apexDeg(rad) · ampMod · strength`.
- **Why these numbers:** research: elevation/depression are independently tunable;
  a readable game beat pushes elevation ~+80–90° and depression −60…−90°. Shoulder
  +78° plus the distal curl of a lagged flexing elbow+wrist (~+25° more at the tip)
  puts the WINGTIP near vertical ≈ **12 o'clock**. Bottom −62° with the arm at full
  extension (fold ≈ 0 at the bottom, §3c) puts the tip at ≈ **5 o'clock** (clock
  math: 3:00 = 0°, 12:00 = +90°, 5:00 = −60°, 6:00 = −90°). Total staged tip arc
  ≈ **165–175°** — the near-180° read — while the SHOULDER never exceeds ±80°, which
  is what keeps the seam and body clearances solvable (§4b).
- `downFrac 0.58`: the down-beat takes 58% of the cycle — the slower, heavier,
  broader power stroke; the up-beat is the quick folded recovery. (Yoke sample ships
  0.56; birds show greater ventral excursion + slower power half.)
- Ease lives only at the extremes: `flapEnv` is the exact function `flapcheck.mjs`
  certifies — pendulum ease at apex/bottom, max velocity through horizontal, no
  interior hold. We inherit its guarantees instead of re-deriving them.

### 3b Composition with flight state + growth (must not fight the machinery)

- `dragon.js` L609–615 already modulates `flapSpeed` (boost ×11/6, dive ×0.45, decel
  ×0.82, inhale calm) and `flapAmp` (boost 0.7 vs 0.52, dive ×0.3, climb ×1.3, decel
  ×1.25, inhale ×0.55) BEFORE the animator runs. The new arc treats the authored
  `apexDeg/bottomDeg` as the CRUISE arc and applies `ampMod = flapAmp / 0.52` as a
  multiplier around it — so a dive still tucks the arc small, a climb still opens it,
  boost grows it ~×1.35, and the inhale mantle still shrinks the stroke. No new state
  plumbing; the multipliers keep their meaning.
- `formStrength`/`formSpeed` (`dragonWingFlap.js:100–108`): `strength` keeps scaling
  the swing + whip + fold exactly as today (hatchling 0.42 → eternal 1.0), applied to
  the enveloped beat the same way it is applied to the sine today.
- The aero/surge skew (`surgeSharp` pow-warp at L58) and the spread/bank/tuck layers
  keep operating on the normalized envelope value — they compose because the envelope
  still ranges over a normalized beat, only its waveform and asymmetry changed.
- The integrated beat clock is untouched: `flapPhase += dt·flapSpeed`, wrapped mod
  2π, one shared master phase, L/R sign-mirror, lag only WITHIN a wing.

### 3c The joint fold on the up-beat (the silhouette-changing ingredient)

- **Elbow:** keep the lagged swing (`elbowAmp` 0.28 → ~0.34 on the showcase) and add
  `elbowFoldAmp: 0.5` (new, nullable): an up-beat-only flexion term
  `upFold(phase − lagElbow) · elbowFoldAmp · strength` that draws the forearm inboard
  during recovery and releases to full extension for the down-beat. `curlEnv`-style
  construction guarantees flexion ≈ max near the apex, ≈ 0 at the bottom — the
  extended straight wing at the deepest point, per the biomechanics (elbow/wrist
  EXTEND on the power stroke).
- **Wrist:** raise `foldAmp` 0.28 → ~0.45 on the showcase and widen the clamps
  per-profile: `elbowLimit [−1.15, 0.9]`, `wristLimit [−1.2, 0.85]` (DEFAULTS stay
  [−0.55, 0.85] / [−0.7, 0.7] — shipped dragons unchanged). The existing
  `upFold = max(0, sin(phase + lagWrist))` machinery already folds only on the
  up-beat; it inherits the envelope phase.
- **Span contraction (the §3 wing-law / §7-style check):** with elbow flexion + wrist
  fold at recovery, the measured wingtip-to-root span at the `recovery` pin must be
  **≤ 0.65×** the `downstroke`-pin span on the showcase (bats: ~0.54; the shipped
  fold-pin law says ≤ 0.7). This is what makes the up-beat read as a FOLD, not a
  rotation in place.

### 3d The out-of-sync cascade (shoulder → elbow → wrist/hand → membrane)

- Existing knobs carry most of it: `lagElbow` 0.20 → **0.35** rad and `lagWrist`
  ~**1.0** rad on the showcase (heavier/distal parts drag farther and stop later —
  overlapping action). One new knob: `lagHand: 1.35` (nullable) drives a trailing
  pitch on the wrist's `rotation.x` so the membrane trailing edge visibly arrives
  LAST — today the wrist pitch is a fixed `feather·0.16` with no lag of its own.
- The `feather` scalar stays computed upstream in `dragon.js` (`sin(phase+π·0.55)`);
  the profile only adds the lagged trailing term inside `flapWing`, keeping one
  clock and one caller contract.
- **Damping honesty:** `flapWing` chases targets through `damp(…, λ 9–14, dt)`. At a
  ~3× deeper arc and boost `flapSpeed ≈ 11`, a λ12 chase will visibly round off the
  extremes (the apex never quite reaching 12 o'clock). Add nullable
  `flapProfile.snap` (λ multiplier, showcase ~1.5) IF the captures show mushy
  extremes — measure first, don't pre-tune.

### 3e Joint-limit clamps (a deep arc must never self-intersect)

1. **Shoulder clamp** (new, per-profile): `shoulderLimit: [−(bottomDeg+8°),
   +(apexDeg+8°)]` in radians — the bank/tuck/spread ADDITIVE layers can never push
   the elevation past the authored arc + 8°.
2. **Bottom rule:** `bottomDeg ≤ 70°` hard ceiling. Beyond ~70° the extended wing
   sweeps under the belly toward the spine plane; 5–6 o'clock is reached at 60–70°
   with the tip's extra length, no need to gamble.
3. **Apex rule:** the inboard-drawing flexion at the apex is capped by `elbowLimit`
   so mirrored tips cannot meet: headless assert at the `apex` pin that in the
   dragon's own frame `tipR.x > 0.15·span` and `tipL.x < −0.15·span` (no spine
   crossing), and at `settle`/bottom that the tip stays below-outboard of the
   shoulder with positive clearance from the torso hull.
4. `elbowLimit`/`wristLimit` remain the existing clamp mechanism — widened by
   profile, never removed.

### 3f Showcase profile (toothless, starting values — gates tune)

```js
flapProfile: {
  arc: { apexDeg: 78, bottomDeg: 62, downFrac: 0.58 },   // wide asymmetric beat
  lagElbow: 0.35, lagWrist: 1.0, lagHand: 1.35,          // the cascade
  elbowAmp: 0.34, elbowFoldAmp: 0.5, foldAmp: 0.45,      // fold on the up-beat
  elbowLimit: [-1.15, 0.9], wristLimit: [-1.2, 0.85],    // widened, still clamped
}
```

## §4 Constraints & what goes wrong if this is rushed

- **(a) `flapcheck.mjs` invariants with a bigger arc.** Apex reaches +1, bottom
  reaches −downDepth, exactly one up + one down stroke, BOTH horizontal crossings >
  0.25× peak velocity, near-zero velocity only within 0.07 cycle of the turnarounds,
  curl ≈1 apex / ≈0 bottom. Avoided by construction: the new arc IS `flapEnv`, the
  gated function. The tempting shortcut that breaks it: a "held majestic apex" via a
  flat-topped waveform — that is an interior hold and a CI failure; apex dwell comes
  only from `downFrac` warping + the cosine's natural ease. The plan extends the
  gate's coverage to skinned-arc dragons (§5 I2) so this stays true forever.
- **(b) Body clearance at both extremes.** At the bottom the wingtip must not poke
  through the body or cross the spine (§3e rules 2–3); at the apex the wing root
  must not gap off the body — the body-seam trouble the hull arc fought (LEAPFROG
  L20–L22/L32: seams read as broken geometry). Toothless's one-piece hull skin
  deforms with the bones, but a ±80° shoulder will stretch skin weights beyond
  anything shipped: run the seam/weight suites (`tests/nightfury.mjs`,
  `tests/shingle.mjs`, `tests/skinnedwing.mjs`) and judge the apex/settle pins
  zoomed (`tools/wingcrop.mjs`) before calling it clean. For `verdant` (GLB) this is
  the migration blocker: its measured max membrane edge stretch is 2.48 at today's
  0.4 rad flap (`dragons.js:1519`) — a deep arc multiplies that; verdant migrates
  last, behind its own stretch probe.
- **(c) Amplitude without fold+lag = faster flutter.** The failure the research
  names. Enforced by INCREMENT ORDER: the fold + cascade increment (I3) must pass
  its reviewer gate before the arc is considered "locked"; an arc-only build is
  never shown as done.
- **(d) Never regress the shipped roster.** Every knob nullable; `DEFAULTS`
  untouched; profile-absent output proven byte-identical by a golden-sample test
  (I1). Full gates every increment: `node tests/blueprint.mjs`, `node
  tools/tricount.mjs --ci`, run-all suites; other dragons' flapstrips compared at
  R3. The shipped `?wingDebug` freeze (`wingDebugPose.js` calls the same `flapWing`)
  automatically pins the new motion — no parallel poser is built (§6.6 law).
- **(e) The chase camera over-reads up-motion and under-reads down-motion**
  (`flapstrip.mjs` header). Amplitude judgments happen on flapstrip's REAL-camera
  frames, never on face-on studio renders alone.

## §5 Phased increments (each independently shippable + verifiable)

Every increment: commit small, push, PR preview rebuilds; append one
`leapfrog/lessons/<date>-<slug>.md`. "Headless" = the automated proof; "Human" = the
motion/feel judgment on the deployed preview (no WebGL in CI).

**I1 — Envelope plumbing, zero visual change (the coexist proof).**
Import `flapEnv` into `dragonWingFlap.js`; read nullable `flapProfile.arc` +
`elbowFoldAmp`/`lagHand`/`shoulderLimit`/`snap`; register them in
`creatureGrammar.js`. No dragon declares them yet.
Headless: NEW `tests/flapcascade.mjs` golden-sample check — for a DEFAULTS profile
(no `arc`), joint targets across 64 phases match the old math to 1e−12; `node
tests/flapcheck.mjs`; `node tools/tricount.mjs --ci`; `node tests/blueprint.mjs`.
Human: spot-check toothless + ember on the preview — explicitly UNCHANGED.

**I2 — The wide asymmetric arc on toothless only.**
Add `flapProfile.arc {apexDeg 78, bottomDeg 62, downFrac 0.58}` + `shoulderLimit` to
toothless's def; extend `tests/flapcascade.mjs` to run the flapcheck `analyze()`
invariants over every skinned dragon that declares an `arc` (same 7 checks: apex,
bottom, one up + one down, fast crossings, no interior hold, fold ≈ max at apex /
≈ 0 at bottom).
Headless: `node tests/flapcascade.mjs`, `node tests/flapcheck.mjs`, `node
tools/tricount.mjs --ci`, `node tests/blueprint.mjs`, `node tests/nightfury.mjs`.
Captures: `node tools/flapstrip.mjs toothless 3` (confirm the tool's equip flow on a
skinned key — the `?wingDebug` pin already covers the skinned path; fix the tool in
this increment if it balks) + `?wingDebug=apex|downstroke|settle` preview pins.
Human: the tip visibly sweeps 12 → 5 o'clock; the down-beat reads slower/heavier.
→ **CHECKPOINT R1 (motion model locked) — §6 reviewer gate.**

**I3 — The fold + cascade on toothless (the "living wing" increment).**
Add `elbowFoldAmp 0.5`, `foldAmp 0.45`, `lagElbow 0.35`, `lagHand 1.35`, widened
`elbowLimit`/`wristLimit`.
Headless: I2's suite PLUS new flapcascade asserts — recovery-pin span ≤ 0.65× the
downstroke-pin span (tip world positions, §3c); no-spine-crossing + body-clearance
asserts at apex/settle pins (§3e); `node tests/skinnedwing.mjs`, `node
tests/shingle.mjs`.
Captures: `node tools/flapstrip.mjs toothless 3`; `node tools/wingcrop.mjs` on the
recovery + apex pins (seam/fold close-ups); `node tools/silhouette.mjs toothless
rear --pose=recovery` vs `--pose=downstroke` (the outline must visibly narrow).
Human: joints visibly lead/follow; the up-beat FOLDS.

**I4 — Flight-state composition + polish on the showcase.**
Verify the deep arc composes with every blend layer: boost/surge (sharper power
stroke, swept look), dive tuck (arc collapses toward glide), climb/decel spread,
inhale mantle, hard-bank tuck/open asymmetry. Tune `snap` only if extremes read
mushy in captures.
Headless: flapcascade sweep — drive `flapAmp` across [0.3×…1.35×] cruise and
`turnBias ±0.28` and assert all joint targets stay inside their clamps (the additive
layers can never break §3e); full run-all.
Captures: flapstrip at cruise + a boost-held capture; `?wingDebug=fold|bank` pins;
`node tools/gameshots.mjs` chase frames.
Human: boost feels like a power pulse, dive glides, nothing pops.
→ **CHECKPOINT R2 (showcase proof) — §6 reviewer gate, then the human's preview
verdict on motion/feel. STOP for the user's go before migration.**

**I5 — Roster migration (last, batched, reversible).**
Enumerate skinned riders (`grep -rn "wingRigL" reforged/js`); author a tuned
`flapProfile.arc` per dragon in batches: (1) `ember` — starter: full
`tests/starters.mjs` + its §8 gate protocol applies, arc kept moderate (its membrane
rides ONE static hand group under the shoulder — L162 — so it carries less visible
wrist articulation; sell the read with shoulder arc + elbow fold); (2) hull
elementals `fire`/`water`/`earth` (`tests/hull.mjs`); (3) `verdant` LAST behind a
GLB membrane-stretch probe (edge stretch at the new extremes must stay within ~1.5×
its measured 2.48 baseline, else clamp its arc down). Each batch: flapstrip per key,
per-key suites, full gates. A dragon that can't pass keeps DEFAULTS — migration is
opt-in per dragon, never forced.
→ **CHECKPOINT R3 (roster gate) — §6 reviewer gate BEFORE the first batch lands,
re-run per batch on the migrated captures.**

**I6 (optional dessert) — Yoke-path deepening, config only.**
Bull/Seraph (`aurumToro`, `pearl`) get a deeper arc purely via `model.flap` numbers
(e.g. Seraph `yokeElevDeg 24 → ~32`, `downDepth 1.9 → ~2.1` ⇒ ≈ +32°/−67°): zero
solver changes, `tests/flapcheck.mjs` gates it automatically, flapstrip + human
preview judge it. Ship only if the deepened skinned beat makes the yoke pair look
stiff by contrast.

## §6 Checkpoint reviewers — the independent quality gates

Mirror of DRAGON-DESIGN §8: at each checkpoint, spawn a **FRESH high-effort reviewer
agent on the `fable` model** with the verbatim prompt below + the capture paths +
the headless test output. The builder NEVER judges its own motion. Quote the verdict
verbatim in the PR. FAIL → apply the numbered directives exactly → re-capture → a
NEW fresh reviewer. After ~4 rounds of churn, consolidate directives into one frozen
work order (MARROWCOIL law). These reviewers are the mechanism that keeps the build
faithful to THIS plan — a build that drifts from §3's model without a PASS is not
"done" no matter what the builder reports.

### R1 — after I2: the motion model is locked (arc + timing)

=========================== R1 REVIEWER PROMPT (verbatim) ===========================
You are the independent MOTION GATE for Dragon Drift's wingbeat-arc upgrade
(checkpoint R1: arc + timing asymmetry on the showcase dragon, toothless), spawned
with fresh eyes. Trust nothing you were told beyond this prompt: re-read
reforged/DRAGON-FLIGHT-ANIMATION-PLAN.md §1, §3a–3b, §3e and §4 yourself, read
reforged/js/dragonWingFlap.js and reforged/tests/flapcheck.mjs as they now stand,
and open every capture image at the provided paths yourself (the flapstrip montage
/tmp/flap-toothless-strip.png plus the per-phase crops, and the ?wingDebug pin
frames). Builder self-reports run generous — assume flaws exist and hunt for them.
Check strictly, for THIS checkpoint only:
1. ARC: across the strip's five phases, does the WINGTIP actually travel the wide
   staged arc — near 12 o'clock at the apex frame, near 5–6 o'clock at the
   settle/bottom frame — or is it still a shallow ±30° flutter? Estimate the angles
   from the pixels and say the numbers.
2. ASYMMETRY: is the down-beat visibly the broader, heavier half (downFrac 0.58 —
   the downstroke frames should span more of the cycle and press deeper than the
   recovery frames rise)?
3. CONTINUITY: did `node tests/flapcheck.mjs` AND the skinned-arc extension in
   `node tests/flapcascade.mjs` pass in the provided output — apex/bottom reached,
   one up + one down, both horizontal crossings fast, no interior hold? A held or
   flat-topped apex is a FAIL even if it looks majestic.
4. CLEARANCE: in the settle/bottom frame, does the wingtip poke through the body,
   cross under the spine, or clip the tail? In the apex frame, does the wing root
   gap off the body (a visible seam)?
5. SCOPE: is any dragon other than toothless changed in the diff or the captures?
If any needed image is missing, ambiguous, or differs between two runs of the same
capture command, your verdict is a demanded re-capture, not a judgment. Return
exactly one of: "PASS — proceed" (optionally with polish notes), or "FAIL" +
NUMBERED surgical directives (specific knobs, degrees, radians — the builder applies
them verbatim). Your entire final message is the verdict. Do not soften it.
=====================================================================================

### R2 — after I3+I4: the showcase-dragon proof (fold + cascade + composition)

=========================== R2 REVIEWER PROMPT (verbatim) ===========================
You are the independent MOTION GATE for Dragon Drift's wingbeat-arc upgrade
(checkpoint R2: the jointed fold + out-of-sync cascade + flight-state composition,
proven on the showcase dragon toothless), spawned with fresh eyes. Trust nothing you
were told beyond this prompt: re-read reforged/DRAGON-FLIGHT-ANIMATION-PLAN.md §1,
§3c–3f and §4, reforged/DRAGON-DESIGN.md §3's "fold must change the silhouette"
clause, and reforged/js/dragonWingFlap.js as it now stands; open every capture at
the provided paths yourself (flapstrip montage + per-phase crops, the wingcrop
close-ups of the recovery and apex pins, the silhouette --pose=recovery vs
--pose=downstroke pair, the fold/bank pin frames, and the boost-state capture).
Builder self-reports run generous — hunt for the flaws. Check strictly, for THIS
checkpoint only:
1. THE FOLD: in the recovery frames, does the up-beat visibly FOLD — elbow flexed,
   wrist unlocked, the wing outline clearly NARROWER than the downstroke outline
   (the plan demands recovery span ≤ 0.65× downstroke span; verify the headless
   assert passed AND that the narrowing is obvious in the silhouette pair)? A wing
   that rotates in place at full span is a FAIL regardless of arc size.
2. THE CASCADE: comparing consecutive strip frames, do the joints visibly lead and
   follow OUT OF SYNC — shoulder ahead, elbow behind it, wrist/hand trailing most,
   membrane trailing edge arriving last — or does the wing still move as one flat
   panel with every part at the same phase?
3. THE POWER STROKE: is the down-beat visibly the broad, extended, heavier half
   (arm straight at the bottom, membrane pressed) against a tight, quick, folded
   recovery?
4. COMPOSITION: in the boost capture does the beat read as a sharper power pulse
   (not merely faster fluttering); in the fold/bank pins do the tuck and bank
   asymmetry still work; does anything visibly fight the inhale/dive/climb layers?
5. CONTINUITY + CLEARANCE: flapcheck + flapcascade output all green (no interior
   hold introduced by the fold terms); no body poke-through at the bottom, no
   spine-crossing tips at the apex, no root gapping in the close-up crops.
6. SCOPE: toothless only — no other dragon's motion or geometry changed.
If any needed image is missing, ambiguous, or differs run-to-run, demand a
re-capture instead of judging. Return exactly one of: "PASS — proceed" (optionally
with polish notes), or "FAIL" + NUMBERED surgical directives (specific knobs,
degrees, span ratios). Your entire final message is the verdict. Do not soften it.
=====================================================================================

### R3 — before (and per batch during) I5: the roster-migration gate

=========================== R3 REVIEWER PROMPT (verbatim) ===========================
You are the independent MOTION GATE for Dragon Drift's wingbeat-arc upgrade
(checkpoint R3: roster migration — run once BEFORE the first migrated batch lands,
then once per batch), spawned with fresh eyes. Trust nothing you were told beyond
this prompt: re-read reforged/DRAGON-FLIGHT-ANIMATION-PLAN.md §2 (the migration
order and per-dragon caveats), §3f, §4d–4e and §5-I5, and open every capture at the
provided paths yourself: the showcase (toothless) flapstrip as the reference read,
each migrated dragon's flapstrip, AND a flapstrip of at least one NOT-yet-migrated
skinned dragon plus one non-skinned dragon (a yoke or direct-pivot key) as
regression controls. Builder self-reports run generous — hunt for the flaws. Check
strictly, for THIS checkpoint only:
1. NO REGRESSION: do the control dragons' strips match their pre-migration
   captures (provided as baselines)? Any visible change on a dragon that declares
   no `flapProfile.arc` is an automatic FAIL — the knobs are contractually
   nullable.
2. PER-DRAGON FIT: does each migrated dragon carry the wide jointed beat in ITS OWN
   anatomy — ember's arc moderated per the plan (its membrane rides one static hand
   group and cannot articulate the wrist; the read must come from shoulder arc +
   elbow fold), the hull elementals without seam tearing, verdant (if included)
   without membrane smudge/stretch artifacts at the extremes?
3. THE READ, EVERYWHERE: on every migrated strip — wingtip near 12 o'clock apex and
   5–6 o'clock bottom, visible up-beat fold narrowing the outline, visible
   lead/follow cascade, down-beat as the heavier half. A dragon that only got
   "bigger flutter" is a FAIL for that dragon (name it).
4. SUITES: flapcheck, flapcascade, blueprint, tricount --ci, starters.mjs (for
   ember), nightfury/hull/skinnedwing/glbrig suites — all green in the provided
   output.
5. CLEARANCE per dragon: no body poke-through, spine crossing, or root gapping on
   any migrated dragon's bottom/apex frames.
If any needed image or baseline is missing, ambiguous, or differs run-to-run,
demand a re-capture instead of judging. A batch may PASS with named dragons
EXCLUDED (they keep DEFAULTS) — say exactly which and why. Return exactly one of:
"PASS — proceed" (optionally with polish notes), or "FAIL" + NUMBERED surgical
directives per dragon. Your entire final message is the verdict. Do not soften it.
=====================================================================================

## §7 Definition of done + open questions for the human

**DONE means, all together:**
1. Toothless (and each migrated dragon) shows a staged wingtip arc of ~150–175°
   (apex ≈ 12 o'clock, bottom ≈ 5–6 o'clock at cruise) on the real chase camera.
2. The up-beat visibly folds (recovery span ≤ 0.65× downstroke span on the showcase,
   headless-measured) and the joints read out of sync — shoulder leads, elbow
   follows, wrist/hand trails, membrane last.
3. The down-beat is the slower, broader power half (`downFrac ≥ 0.56`).
4. `tests/flapcheck.mjs` + the new `tests/flapcascade.mjs` (identity golden-sample,
   envelope invariants for skinned-arc dragons, span-contraction, clearance asserts)
   + `tests/blueprint.mjs` + `tools/tricount.mjs --ci` + the touched-path suites all
   green; every dragon WITHOUT an `arc` profile proven byte-identical.
5. R1/R2/R3 reviewer verdicts quoted verbatim in the PR, all ending in PASS; the
   human has approved motion/feel on the PR preview at R2 and at merge.
6. One `leapfrog/lessons/` file per increment; `DRAGON-DESIGN.md` §3's motion rows
   updated if any starter's declared path/character changed.

**Open questions for the human:**
1. Character split: should every skinned dragon get the full ~170° staged arc, or
   should heavier dragons (hull elementals) keep a shallower, slower beat as an
   identity difference? (The knobs support either; the plan assumes per-dragon
   tuning.)
2. Toothless bottom depth: −62° (5 o'clock) is the safe spec; do you want to try
   −70° (5:30) if the clearance asserts hold, for extra drama?
3. Is I6 (deepening Bull/Seraph's yoke arc via config) wanted, or do the angel/bull
   wings deliberately keep their current stately ~70° beat?
4. Verdant (GLB): if its membrane stretch exceeds the probe at the new extremes, do
   we clamp its arc down (keep it in the family) or exclude it (keeps DEFAULTS)?
5. Flap FREQUENCY: the plan deepens the arc without slowing the base beat
   (`flapSpeed 6` cruise). A ~15% slower cruise beat would sell weight further —
   want that tried on the showcase at I4, or is run pacing tuned to the current
   rhythm?
