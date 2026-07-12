# THE UNMASKED — Finale Completion Plan: FEASIBILITY AUDIT

> **Editor's correction (verified by the orchestrator against current master `7f4d583`):**
> the audit blames the "tree moved" on PR #373 — that attribution is WRONG (#373 is a
> graphics-optimization PR that never touched UNMASKED). The medley/graze work landed via an
> earlier boss-rework merge. The *substance* stands and was re-verified in code: the graze
> medley IS shipped (`bossDefs.js` unmasked `grazeMedley: ['holdFlinch','orbitAnnulus','shrinkDisc']`;
> the dispatcher `grazeFormNow()` at boss.js:3632-3642; tests at boss.mjs:4174+), the def attacks
> already carry real per-stage quotes (stage-3 `spiral` arms shrinkDisc), and F1 (the lance can
> crack a branded relic via `routePartDamage`/`PART_CRACK_HITS` 3), F3 (`lockdpsCore` reads no
> attack cadence → the plan's "re-run lockdps" mitigation is false-green), and F5 (surge-chase
> under-scoped) all check out. **Takeaway unchanged: re-baseline the plan against current master
> before building.**

**Auditing:** `docs/unmasked-finale-completion-plan.md` (+ its lesson
`leapfrog/lessons/2026-07-11-unmasked-finale-completion-plan.md`).
**Verified against:** master @ `aac0080` — `reforged/js/boss.js` (5,773 lines),
`bossUnmasked.js`, `bossDefs.js:1715` (`unmasked`), `bossRhythm.js`,
`tools/lockdpsCore.mjs`, `tests/lockdps.mjs`, `tests/boss.mjs`,
`tests/unmaskedreckoning.mjs`, `entranceScripts.js`, `environment.js`, `save.js`,
`lockLayer.js`, `main.js`, `BOSS-DESIGN.md`.
**Verdict: NOT BUILDABLE AS WRITTEN** — same as every prior CP1. Two findings are
plan-invalidating (F1, F2), one GO gate is false-green (F3), and one increment is a
whole increment that already shipped. The bones are good; the ground-truth table is
stale and three contracts need rework before a line of code.

---

## 0. THE HEADLINE: the tree moved under the plan

The plan's "EXISTS vs MUST BE BUILT" table was snapshotted **before PR #373 merged**
(`7f4d583`, plus #371/#372). PR #373 carried three UNMASKED medley PRs
(`20d0894`, `a91ffd9`, `36ba204`, `a8edfbb`) that ship a large chunk of what the plan
schedules as INC-2 and part of INC-1's premise. Every `boss.js` line the plan cites has
drifted ~+120 lines (the file is 5,773 lines now, was 5,650). Concretely, on master
TODAY:

- `grazeForm:'medley'` is **NOT a dead string**. `grazeFormNow()` exists
  (`boss.js:3640-3643`), dispatching on a shipped def field
  `grazeMedley: ['holdFlinch','orbitAnnulus','shrinkDisc']` (`bossDefs.js:1766`).
- The def carries `setpieces: [{ id:'figureEight', atPhase:1, dur:8, moving:true,
  recur:12 }]` (hosts the stage-2 orbit band) and `gapThread: true` (stage-2
  MARROWCOIL quote), and stage 3's attack list was already restruck `iris→spiral`
  **specifically to arm the shrinkDisc toll-wall** (`bossDefs.js:1791`, and the
  rhythm phrase at `bossDefs.js:1832` with the warning comment that the swap must hit
  the phrase too).
- All of this is **CI-tested**: `tests/boss.mjs:4174-4380` pins per-stage
  `medleyForm` (`holdFlinch`/`orbitAnnulus`/`shrinkDisc`), inertness of unquoted
  stages, and byte-identical scalar resolution for every other def.
- Phase-seam medley-state wipes exist (`boss.js:3850-3855`, `:2085-2086`).

A builder following the plan as written would **rebuild a shipped, owner-gated,
tested system and remap its stages** — the exact "regress the shipped roster"
failure THE RULE exists to prevent.

---

## 1. FINDINGS, ranked by silent-ship danger

### F1 — INC-3's branded-then-destructible closes the lockout but opens ACCIDENTAL DESTRUCTION BY THE LANCE ITSELF (critical, silent-ship)

The lockout half is sound. Verified: `reckoningBranded` is a grow-only Set reset only
on both teardowns (`boss.js:1855`, `:5398`); branding rides `lockPaint`
(`boss.js:4983`); `applyPartBreak → dropLockPart` (`:5177`) drops the pip but never
the Set entry. Gate destructibility on `reckoningBranded.has(name)` and an unbranded
relic genuinely cannot die. The order-matrix test is provable with existing seams
(`__dd.bossReckoning()/bossBurns()/emit` — `tests/unmaskedreckoning.mjs`).

**The hole is the other direction.** In `routePartDamage` (`boss.js:5194-5217`), a hit
with no numeric `e.part` routes by **landing point** at weight **0.5**, and
`PART_CRACK_HITS = 3` (`:5120`). Lances are homed **at relic organs by the core paint
loop** (`fireLanceAt` targets the part's world pos and its arrival "counts half
(landing-point route)" — `:4841-4864`), and the Surge fork (`:1535`) and cap
auto-volley do the same. So: brand `relicHorn`, keep playing the lance loop normally,
and **~6 lance arrivals (two partial volleys) destroy the trophy** — no deliberate
choice, no gunfire aimed. The plan's design ("the trade is the design", exam-editing
as a chosen sacrifice) silently becomes "relics self-destruct as a side effect of the
RECKONING play that branded them." Failure scenario: player brands all five, volleys
through stage 2, arrives at stage 3 with 3 relics dead, 3 exam measures deleted and
the kill-screenshot trophy row gutted — and never chose any of it.

**Minimal fix (must be specified before build):** the relic PART_SYS row needs a
*deliberate-destruction verb*: (a) thread `kind` into `routePartDamage` (its callers
have it — `damageBoss(amount, kind, e)`) and exclude `'lance'` arrivals for the relic
row, and/or (b) a per-row `crackHits` override (the relic row at ~12, not the global
3). Note also: since relics never emit bullets, **no route ever reaches them at full
weight** (`typeof e.part === 'number'` never true for relics), so with default dials
the "deliberate" path is ALSO only 0.5-weight splash — the verb question is a real
design gap, not a tuning nit. **This is a new owner decision (D8, §5 below).**

Secondary INC-3 gaps, each cheap but must be named: a new `lockPartDead` clause for
relics (`boss.js:4790-4805` is a hardcoded per-family chain — the plan's
"existing lockParts-eviction seam" is not generic; a `relic` branch must be added or
the reticle leads to corpses); relic hit-tests aren't phase-gated, so a stage-3
landing can still route to a (branded) stage-2 relic — decide and test; the
exam-edit filter is **new `bossRhythm.js` plumbing** (see F8), not "riding shipped
plumbing".

### F2 — INC-2 is ALREADY SHIPPED, and the plan's proposed mapping was unbuildable anyway (plan-invalidating)

See §0 for what shipped. Strike INC-2 entirely. Two extra teeth:

1. The plan's mapping (S1 `orbitAnnulus` on the corona, S2 `holdFlinch`, S3
   `shrinkDisc`) **could not have been built as written**: `orbitAnnulus` only arms
   while a `figureEight` setpiece is live (`boss.js:3188`, `:5741` —
   `setpieceT >= 0 && setpieceDef?.id === 'figureEight'`), and stage 1 has no
   setpiece; `holdFlinch` requires `setpieceT < 0` (`boss.js:3092`), and the shipped
   stage 2 runs a *recurring* figureEight (`recur:12`) that would dead-zone the
   stare-down for large fractions of the bar. The shipped permutation
   (S1 holdFlinch — bullet-free, survives the sparse stage-1 rests; S2 orbit hosted
   on its own figureEight; S3 shrinkDisc off `spiral`) is the feasible one. The
   general lesson stands: **graze forms carry per-boss ARMING PRECONDITIONS (setpiece
   ids, attack ids, toll cadences), not just `def.grazeForm` labels** — the plan's
   reuse review checked capability, not arming.
2. Any INC-1 change must **preserve the shipped couplings** (F4) or it regresses a
   merged system with green CI.

### F3 — INC-1's balance GO gate is FALSE-GREEN: lockdps is rhythm-blind (silent-ship)

`lockdpsCore.mjs` consumes **only** `hpMax`/`formLifebars`/`lockParts`/card `timer`s
/`CONFIG.LOCK` (`phaseSpans` `:20-29`, `bossEconomy` `:91-159`,
`deleterTtk = phaseHp / worstDps` `:141`). **No cadence, no rhythm, no attack list
ever enters.** The pinned 4.15/3.60/3.18 margins and the 35.4s-vs-34 stage-3 pin
(`tests/lockdps.mjs:149-175`) will read identically no matter how brutal or empty the
medley is. The plan's mitigation for its #2-ranked risk — "re-run lockdps in the
INC-1 loop; tune rests until green" — **always passes and can never catch the
regression it names.** Worse, the lesson file enshrines the same error ("the medley
isn't just data-swap: it re-prices the fight… re-clear lockdps").

The real exposure is different and currently uncovered by ANY gate: **honest-play
kill time vs the 26/30/34 card timers** under the new fire density. (Mitigating
context, verified: a card timeout only downgrades capture to SURVIVED, it never
walls progress — `boss.js:241` — so the failure is "the finale's capture/dread
economy silently degrades", not a hard lock.) **Fix:** replace the INC-1 lockdps gate
with (a) the rhythmprint/amberdiet/emission gates it already names (those ARE
phrase-driven and real), plus (b) a new headless fire-density/TTK instrument (60s
per-stage sim already exists in spirit via `simulatePhase`; add a shots-per-window +
expected-clear-time readout) and (c) an explicit owner decision whether 26/30/34
retune with the real medley. Keep `lockdps` in the suite — it guards INC-3/INC-4's
`lockParts`/timer edits — but stop calling it the medley's gate.

### F4 — INC-1's quote table collides with shipped load-bearing couplings (silent-ship)

The attack lists are no longer inert placeholder data; they are the graze medley's
arming fuel:

- **Stage 3 must keep `spiral` in BOTH `phases[2].attacks` AND `rhythm.phases[2]`'s
  phrase** — the shrinkDisc toll-wall arms off the fired spiral (`boss.js:4293`;
  def comment at `bossDefs.js:1832` says exactly this). The plan's Stage III table
  has spiral, but by lineage ("Knellgrave's toll-and-chain"), not as a named
  invariant — a later tuning pass could swap it out and silently kill the stage-3
  graze form. Name it as a hard constraint + CI assert.
- **Stage 2 must keep `movingGap`** (feeds `gapThread`).
- **`gapThread` is def-level, stage-scoped only by construction** ("only stage 2's
  attack list carries a wall attack" — `bossDefs.js:1773`). The plan's Stage III adds
  `curtain`, `movingGap`, `crestfall` (all in the WALL set, `tests/boss.mjs:4311`)
  and geyser to Stage II — so gapThread rows would start registering in stage 3
  too. That's a design change to a shipped system, not a data swap: either scope
  gapThread by phase or accept + test the new scoring surface.
- **`crestfall` is NOT in the emission-budget sweep** — `ALL_ATTACKS`
  (`tests/boss.mjs:2018`) omits it (it IS in the known-id check at `:85`). The plan's
  claim "every id … already in the tests/boss.mjs ALL_ATTACKS list" is false for its
  stage-III centerpiece. Add crestfall to the sweep (and make it pass laneSafe) in
  the same PR.
- Cross-def safety **verified good** (the plan asked): `crestfall`'s horizonPocket
  lock is card-gated (`horizonPocketX` set only under
  `activeCard.id === 'embertide_horizonbreak'`, `boss.js:3586-3591`; null → plain
  sliding gap); `geyser`'s gap anchor is def-opted (`resolveGapAnchor`, un-opted →
  player-seeded) and its plumes use `def.accent`. Both fire def-agnostically. The
  boot-test the plan demands is still right; expect it to pass.
- Exam identity (see F8): cards are 1:1 with phases — the dread card IS phase 3, so
  "stage III's era quote" and "the exam phrase" are the SAME `rhythm.phases[2]`
  entry. The plan half-knows this; it must commit (see F8) before the table is
  signable.

### F5 — INC-4 "re-skins the existing shield-break path" — that path does not exist for this purpose (under-scoped, 2–3 PRs)

Verified machinery: `strikeSurge` (`boss.js:1448-1466`) branches
`shielded → breakShield(player)`, else a chip; `breakShield` (`:3780-3886`) ALWAYS
either advances the phase or, on the last phase, sets `pendingDeath` (`:3884`). There
is no reusable "shield-break re-skin" for a repeatable mid-form chase cycle. The
re-veil cycle needs, minimum, four NEW controller seams:

1. **A seal state** in `damageBoss` + `lockDeflected()` (the L197 survival-seal
   precedent at `:5274` and `:2721+` is the template but is card-coupled; the veil
   seal is a new latch). It MUST be in `lockDeflected()` or lances/burns void into
   the seal (the one-deflect law; `surgeForkLances` `:1515` and `updateBurns`
   `:5075` both key on it).
2. **A new Surge-resolution branch** in `strikeSurge`: sealed-not-shielded must
   route to "arm the chase beat", never to the chip (which the seal would deflect)
   and never to `breakShield` (which on form 3 means instant death).
3. **A setpiece arm path outside phase entry** — `armSetpieceForPhase`
   (`:839-849`, `:3839`) only fires at phase seams; the chase arms on a Surge tap.
4. **A purity-gate exemption**: while ANY setpiece runs, the shrinkDisc pocket is
   killed (`:3187-3209` exempts only `ride`/`pendulumSweep`), so the plan's "the
   stage-III graze quote keeps feeding Surge" fuel loop is dead during every chase
   beat unless the chase setpiece is added to the exemption — or accepted as the
   between-cycles-only fuel design. Decide explicitly.

Also interacts with the shipped stage-2 recur-figureEight (fine — different phase)
and the reckoning charge-kill idiom (`:4991-4994` — the plan correctly copies it).
Star pips themselves are genuinely small: the perfect-parry edge exists
(`emit('bossReflect', { perfect, streak })`, `:2829`), loss-on-hit can key off the
hit that resets `game.parryPerfectStreak`. Headless drivability is real
(`input.surgeTap` seam, `main.js:290`). Verdict: buildable, but as **PR-a (seal +
cycle + pips, headless-green) and PR-b (chase choreography + fill audit + owner
rounds)** — the plan's single MEDIUM increment under-names 4 new seams and its
"reuses existing machinery" framing is the exact class of claim this audit exists to
kill. The KNELLGRAVE worst-frame fill-area template exists (`tests/boss.mjs:1461-1522`).

### F6 — INC-5 is confirmed a multi-PR arc; one dependency is avoidable

The §5h schedule is real and locked (`BOSS-DESIGN.md:1417-1420`; C1 clause `:948-949`)
— the plan builds to it, correctly. Verified feasible: `runSeed` exists
(`main.js:130`, `game.runSeed`) so deterministic placement is buildable; the sky-dome
render pattern is exactly as claimed (`environment.js:284` `fog: false`, `:290`
`sunDir`); `bossLedger` is the aperture source (`save.js:307`). Honest size: **2–3
PRs**, not one (system+guards+tests; the two latched beats + seed-on-load migration;
biome sky-read polish across 8 biomes on tiershots). One improvement that deletes a
cross-increment dependency: **retire the landmark on
`bossLedgerStats('unmasked').kills > 0`**, not on INC-7's `companionShard` flag — the
retirement then ships inside INC-5 and INC-7 stops being load-bearing for sky
correctness. Eligibility guards, flag latching, and the no-camera-hijack beat design
are all consistent with the code.

### F7 — INC-6 is buildable on the real entrance engine; two claims need adjusting

The script schema is pure data/functions with OPTIONAL camera (`entranceScripts.js:1-19`;
`vigilLights` is the shipped 0s-hijack precedent, `bossDefs.js:590`), the driver owns
skip/slow-mo/HUD/announce/`releaseCineSlow` (`boss.js:2112-2135`), and running under
`flythrough` gets the gaze exclusion (`:3579`). `approachFrom` branches are as
claimed (side/above/below/ahead/condense/sides/horizon, `:1729-1766`) — `'landmark'`
is new and the banner dir map at `:1810-1811` must add `'landmark' → 'top'` (the plan
names this). Adjustments: (a) the **handoff geometry is genuinely new math** — the
landmark is camera-relative sky-tier with NO world spot (unlike `horizonSeed`'s fixed
world position, `:539`), so "start pose derived from the landmark's screen bearing"
is a camera-space→world conversion, not a reuse; the plan's same-frame screenshot-diff
gate is the right proof, keep it. (b) The **reticle-suppression CP2 task may be
partially moot**: `updateLockLayer` already only runs in phase `'fight'`
(`lockLayer.js:99-101`) — verify what actually draws during the frozen reveal before
building a suppression system. (c) §5j row 14 also names the **held choir partial**
foreshadow (`getBossEta()`, "or cut") — the plan lists the seam as EXISTS but no
increment ships or cuts it; surface it to the owner.

### F8 — The exam-edit and cardPhrase both touch bossRhythm.js, which the plan calls zero-new-plumbing

`makeRhythm(def)` closes over `def.rhythm` at encounter start (`boss.js:1660`) and
the module's coexist rule is "nothing here mutates the def" (`bossRhythm.js:31-32`).
Therefore: (a) tagging measures with source relics is data, fine; (b) **filtering the
exam phrase against `liveRelics` at card entry requires a new machine seam** (a
phrase-mask parameter or a filtered re-`reset`) — small, but it's shared-module
plumbing with 13 other consumers, and it needs its own coexist assert. And (c) the
cardPhrase question resolves itself: cards↔phases are strictly 1:1, so the dread card
IS `rhythm.phases[2]` — there is no "phase-3 amble THEN the exam" without new
plumbing. Recommendation: **collapse them** (the exam IS stage 3's phrase; zero new
code; the `embertide_horizonbreak`-style force-select at `boss.js:3517` is available
if a card-scoped attack override is ever wanted) and record that in D1.

### F9 — Every line-number citation in the plan is stale (cosmetic, but a builder trap)

Post-#373, `boss.js` anchors moved ~+120 lines (e.g. RECKONING listener :4861→:4983,
burnGate :4914→:5035, PART_SYS :5006→:5130, lockParts-eviction :4668→:4790,
teardown reset :5277→:5398, approach branches :1723→:1729). The concepts all
verified; the numbers didn't. Re-cite at build time; never paste from the plan.

### F10 — INC-7 verdict: buildable as written (smallest real increment)

No companion/follower system exists (verified: no hits outside def comments). Death
seam (`felledRun.add`/`bossFelledCard`, `boss.js:1927-1942`), `saveData.flags`
persistence, and the guards are all real. New surface: one ambient module + a
`main.js` ordinary-run hookup + the flag matrix. With F6's retirement change, INC-7
loses its only cross-system coupling. Keep the §4 cuteness gate owner-side.

### F11 — Budgets & laws: the plan's numbers hold (verified, no finding)

Tier-5 = 30k tris/120 draws; landmark ~300 tris/2-3 draws, shard ~150, sag +0 —
noise. Additive adds (landmark corona, chase worst-frame) are covered by the
fill-area template (`tests/boss.mjs:1522`). No InstancedMesh. Determinism: the
model-side rnd-stream discipline is already demonstrated in-file (the crack-seam
private stream comment, `bossUnmasked.js:146-150`); INC-3's sag is transform-only —
compliant. Star pips are HUD-canvas, zero scene draws. `Math.random` in
geyser/crestfall slide-dir is the shipped gameplay convention, not a model-build
stream — no violation.

---

## 2. Per-increment verdicts

| Increment | Verdict |
|---|---|
| **INC-1** medley data | **BUILDABLE WITH NAMED FIXES** — re-baseline on shipped couplings (F4), replace the false-green lockdps gate (F3), add crestfall to the emission sweep, resolve the exam identity (F8), then it is genuinely small. |
| **INC-2** graze medley | **ALREADY SHIPPED** (PR #373; CI at tests/boss.mjs:4174-4380). Strike it. Do not remap the stages. |
| **INC-3** destructible relics | **BLOCKED on D2 + new D8** (destruction verb/threshold — F1), then BUILDABLE WITH THE NAMED FIXES (kind-aware routing or per-row crackHits; lockPartDead relic clause; bossRhythm filter seam; phase-gating decision). Cheapest increment to drop, as the plan says. |
| **INC-4** surge-chase + pips | **UNDER-SCOPED (2 PRs + owner rounds)** — four new controller seams the plan calls "re-skinning" (F5). Star pips alone are small and could even ship in PR-a. HARD OWNER GATE stands. |
| **INC-5** second-sun landmark | **UNDER-SCOPED (2–3 PRs)** — the plan already half-admits this ("MEDIUM-LARGE", the C1 citation). Feasible on verified seams (runSeed, sky dome, bossLedger). Retire via ledger, not the INC-7 flag (F6). |
| **INC-6** handoff + Don't Move | **BUILDABLE WITH THE NAMED FIXES** — the entrance engine genuinely supports it; the handoff conversion math is new, not reused (F7); check the reticle task isn't moot; surface the choir-partial cut. HARD OWNER GATE stands. |
| **INC-7** companion shard | **BUILDABLE AS WRITTEN** (F10). |

## 3. Corrected build sequence

1. **INC-1′** — medley data, re-baselined: keep `spiral`(S3, phrase+attacks) and
   `movingGap`(S2) as named invariants; decide gapThread scoping; crestfall into
   `ALL_ATTACKS`; exam == phase-3 phrase; new fire-density/TTK instrument replaces
   the lockdps GO line; rhythmprint/amberdiet/emission + boot-fire of every id.
   (Needs D1, D6, D7.)
2. **INC-3′** — destructible relics under the F1-fixed contract. (Needs D2 + D8;
   droppable without downstream damage — the exam simply ships unedited.)
3. **INC-4a** — veil seal + re-veil cycle + star pips, headless-green (the four
   seams of F5 named in the PR). **INC-4b** — chase choreography + fill audit +
   owner iteration. (Needs D3.)
4. **INC-5a/5b** — landmark system, then beats + seed-on-load + biome polish;
   parallel-safe with 2–3 (disjoint files); retirement via bossLedger. (Needs D4
   confirm only.)
5. **INC-6** — handoff + *Don't Move* (after INC-5). (Owner gate on the stillness.)
6. **INC-7** — the shard capstone. (Needs D5.)

## 4. Must-fix-before-build (short list)

1. **Re-baseline the plan against master @aac0080**: strike INC-2, adopt the shipped
   graze mapping + couplings, refresh all line cites (F2, F4, F9).
2. **Close the INC-3 accidental-destruction hole**: specify the destruction
   verb/channel + threshold for branded relics before any PART_SYS edit (F1).
3. **Replace INC-1's lockdps GO gate** with a phrase-driven TTK/density instrument;
   record that lockdps cannot see rhythm (F3) — and fix the companion lesson, which
   teaches the same false mechanism.
4. **Re-spec INC-4 as two PRs** with the four new controller seams named (seal,
   surge-resolve branch, off-phase setpiece arming, disc purity exemption) (F5).
5. **Commit the exam identity** (exam == stage-3 phrase; the liveRelics filter is a
   named new bossRhythm seam with a coexist assert) (F8).

## 5. Owner decisions that genuinely block starting

- **D1** (quote table + exam) — blocks INC-1′; must now be signed against the
  SHIPPED couplings (spiral/movingGap invariants, gapThread scoping) and the
  exam-identity resolution.
- **D2 + NEW D8** (do relics destroy at all; if so, by WHAT verb, at what
  threshold) — blocks INC-3′ outright. D8 is the decision the plan is missing.
- **D3** (chase shape + cycle count + pip multiplier) — blocks INC-4a's state
  machine.
- **NEW D9** (do the 26/30/34 card timers retune with the real medley) — blocks
  calling INC-1′ balance-done; cheap to answer.
- D4 is confirm-only (§5h already locks the schedule); D5/D6/D7 (+ the choir-partial
  cut) are non-blocking and can land with their increments.
