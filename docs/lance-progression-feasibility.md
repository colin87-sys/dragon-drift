# Lance progression redesign — FEASIBILITY + BALANCE + VERIFICATION pass

Date: 2026-07-10
Status: ANALYSIS (no code). Pressure-tests `docs/lance-progression-redesign.md`
(same date) against the live code, the real `lockdps` economy table, and the
test/tool suite, so the eventual implementation cannot break the game.

Ground truth verified today, on this tree (`36b754d`):

- `node tools/lockdps.mjs --ci` → exit 0. `node tests/lockdps.mjs` → 5 checks green.
  **The plan's §1c.5 / §6 PR0 ("re-green the gate — KARNVOW assertion is RED") is
  ALREADY DONE** — commit `36b754d` fixed the stale assertion; the test file now
  names KARNVOW lance-capable. PR0 can be struck from the rollout; the clean
  baseline it asked for exists.
- The live table (today): 14 bosses, **6 lance-capable** (MARROWCOIL 51 volleys /
  EITHERWING 57 / HOLLOWGATE 42 / THRUMSWARM 97 / BRINEHOLM 56 / KARNVOW 45),
  and all five tier-4/5 slots print `lance inert — no paint targets (V1 aim only)`.
  The plan's diagnosis (§1) is numerically accurate.

Verdict up front: **BUILDABLE, WITH CAVEATS.** Every proposed mechanic has a real
seam or a small extension — nothing requires a new engine. Two items are the
watch-list: (1) ONEWING's echo-pip is the only mechanic that can mathematically
threaten the "not a phase-deleter" bar (fix below: echo on first paint only, not
on stacks, enforced by a new NOT-A-PHASE-DELETER invariant); (2) THE UNMASKED's
relics + RECKONING depend on a model system the model file explicitly reserves
for later (`bossUnmasked.js:619` — "RELICS (§8) are RESERVED FOR CP2") — the
plan's own split advice must be binding, not optional.

---

## 1. Feasibility per mechanic — is the seam there?

Legend: **GREEN** = def data + existing seams; **YELLOW** = small code extension,
one consumer, testable headlessly; **RED** = depends on a subsystem that doesn't
exist yet.

### 1a. SCAR-BURN (perfect-gated, ramped) — YELLOW

The seams:

- **Perfect detection already exists** at `lockLayer.js releaseVolley()` (~L564):
  `onBeat = source === 'tap' && !!ctx.beatOn`, and the `lockVolley` event already
  carries `{ perfect, full, count, dmgEach }`. SCAR-BURN's trigger is exactly
  `full && perfect` — zero new state-machine plumbing for the *gate*.
- **The burn itself cannot live in lockLayer.** The module owns no damage
  schedule (its only damage paths are `ctx.fireLance` per wisp and
  `ctx.damageBoss` exposure ticks). The burn is 3 s of scheduled ticks that must
  (a) pause under THE ONE DEFLECT RULE and (b) die on phase advance — both are
  boss-seam facts. Home it in `boss.js` as a small `burns[]` list
  `{part, remaining, perSec}` fed by the `lockVolley` listener (the same place
  `brandLoose` already rides, `boss.js:~1408`), ticking `damageBoss(amt,
  'lockburn', {part})` while `!deflected`, cleared in the phase-advance /
  `resetBoss` blocks that already clear `beamDuelT`. Config lands as the plan's
  `LOCK.scarBurn` block.
- **⚠ Definition decision (owner):** does the beat-ALIGNED cap auto-release
  count as "perfect"? PR-B made `source:'cap'` land on the beat *for free*
  (`beatAlignedFuse()`, `boss.js:1433`). If auto-release burns, the "earned, not
  automatic" directive is hollow — the player banks 6 pips and the game times
  the burn for them. **Recommendation: perfect = manual tap on the tell only**
  (`full && source==='tap' && beatOn`), consistent with the existing E1/snap law
  ("a manual volley earns the grid only via a perfect tap — 'on the beat' is
  the reward, not a freebie"). This also means the burn never fires headlessly
  by accident (beatOn is null with no clock), which keeps every existing
  kill-time test byte-identical without a single guard.

Files touched: `config.js` (LOCK.scarBurn), `boss.js` (burn list + listener +
phase/reset clears + FX), `lockLayer.js` **unchanged** (the event already says
everything), `lockdpsCore.mjs` + `tests/lockdps.mjs` (same PR — §3). Risk:
moderate — new scheduled-damage machinery, but one consumer, event-driven,
fully unit-testable with a fabricated ctx + event capture.

### 1b. KNELLGRAVE organs + resonant release — GREEN organs / YELLOW beat source

- Model audit (`bossKnellgrave.js`): `bellMouth` **exists** (L782, it is
  `def.muzzle`). `knellFigure` (L695) and `clapperHead` (L728) exist — the
  honorably-unpaintable rule is FREE (non-candidates never acquire; the reticle
  stays cold by construction, no code). `lipCrack` and `chainBind0/1` do **not**
  exist — they are the plan's two-three new **empties** (byte-neutral, the
  EITHERWING precedent), with obvious parent anchors: the `knellLip` ring
  (L521) / `knellCrack` strip (L571) for the wound, and `swingPivot`→chain
  nodes so the binds inherit the pendulum (turnaround acquisition — the proven
  shape). `partWorldPos` resolves by node name; a def-lint like `tests/lock.mjs`
  T2.12 must cover them.
- Reachable cap: 3 lockParts + `virtualLockOrgan:'bellMouth'` = 4 targets × 2
  stacks = 8 ≥ tier cap 6 ✓ (the REACHABILITY LAW holds; `paintableParts()`
  already promotes the virtual to paintable — the T2.18 seam).
- **⚠ The beat source is REQUIRED plumbing, not polish.** `ctx.beatOn` is
  computed from `getBeatClock()` (`boss.js:2540`) and KNELLGRAVE **kills the
  music** (`musicDies`, `boss.js:2258` calls `musicKill()`), so on the hero boss
  `beatOn` is null forever → no perfect release → **SCAR-BURN and beatMult are
  unreachable on the very boss that debuts them.** The def-gated toll clock
  (`def.bpm` 60, accelerating — the model already exposes `tollNow`) feeding
  the `beatOn` computation must ship *in the KNELLGRAVE PR*, with a unit test
  (a fabricated toll clock produces `beatOn` windows). The plan lists this as a
  §7 risk; this pass upgrades it to a PR2 gate.
- P4 (Last Toll) is a runtime survival-card seal (deflected) — the static model
  cannot see it (§5). Decide: leave the three organs un-phase-gated (model says
  P4 volley 12, whole-fight base ≈ 42–43 volleys — matches the plan's "≈42") or
  gate them `[0,1,2]` (P4 falls to bellMouth 2 pips; total ≈ 62). Either is in
  band; **recommend un-gated** (the runtime seal already enforces zero lance in
  P4, and the model stays closest to the plan's published numbers).

### 1c. WEFTWITCH organs + mend-interrupt — GREEN organs / YELLOW interrupt

- Model audit (`bossWeftwitch.js`): `weftScar` **exists** (L293). The hands
  exist as named rigs — `handPivotL/R` (L346), `palmL/R` (L350) — so the plan's
  "new empties handL/handR" can be either def data naming `palmL`/`palmR`
  directly or two tip empties; both byte-neutral. `loomHeart` exists as a named
  muzzle Object3D (L953). Reachable (3+1)×2 = 8 ≥ 6 ✓.
- The mend-interrupt (volley ≥3 pips landing during a re-weave cancels it,
  stills the loom ~1.5 s) is a **new consumer** in her archetype controller:
  count lance arrivals (`bossHit` kind 'lance' / the wisp-arrival callback)
  inside the mend window, or trigger on `lockVolley {count≥3}` + arrival delay.
  Def-gated, additive, no lockLayer change. The plan's own PR4 gate stands:
  prove no survival-critical mend is cancellable.
- Balance note (fairness, §2): this is the boss where organ ACQUISITION is
  hardest by design (loom always emitting; sanctioned windows = the 2.5 s
  thread-cut stagger + V4 snaps). A full 6-set through 0.35 s dwells + 0.22 s
  cooldowns costs ~3.4 s of continuous painting — more than one stagger window.
  The lance is optional here (fine), but "useful" depends on the stagger
  cadence; the PR4 preview must confirm a median player banks a full set at
  least once per phase. If not, the tune is the stagger duration, never the
  ROI/burn numbers.

### 1d. ONEWING echo-pips — YELLOW, with the plan's stated seam being WRONG

- Model audit (`bossOnewing.js`): **all three organs already exist as named
  nodes** — `onewingEye` (L534), `frameRim` (L495), `snappedThread` (L598).
  Zero new geometry, zero new empties. 3×2 = 6 = cap ✓ (exactly reachable —
  the frame-break trade then really costs you the cap, as designed).
- **The grant seam:** the plan implies pips-without-dwell ride an existing
  path. The candidate, `paintFromParry(part)` (`lockLayer.js:623`), is the
  wrong tool for echoes, for three concrete reasons: (1) it sets
  `S.paintCd = paintCooldown`, so every echo would *throttle the player's next
  dwell paint* — the mechanic would slow the flow it exists to speed; (2) on an
  existing pip it *refreshes* instead of stacking, so "pips arrive in pairs"
  dies after the first pair (an eye second-stack would not echo); (3) it calls
  `paintHop`, releasing the player's aim mid-stack. **Required: one new small
  export** — `grantPip(part, {stack: true})` — that pushes/stacks a lock,
  `freshenLocks()`, emits `lockPaint {granted: true}`, respects cap/stackMax/
  deflect, and touches neither `paintCd` nor the aim. Boss.js listens for
  `lockPaint {part:'onewingEye'}` and grants onto `frameRim`. Rule 11 (marker)
  is then FREE: anything in `S.locks` gets a live marker via
  `lockHudState().locks` and the existing per-lock resolve loop. Rule 11's
  "dies with its part": `dropLockPart('frameRim')` exists (L653) — the frame
  break must call it (same pattern as the pane/shackle crack branch).
- **⚠ The one real balance decision — echo must NOT fire on stacks.** See §2:
  echo-on-stack collapses time-to-cap to 4 completions (cadence 3.28 s) and
  under FOCUS (dwell ×0.5 — a LAW the plan never multiplies in) to ~2.6 s,
  at which point ideal pure-perfect-lance clears P2/P3 (118.8 HP, timers 26 s)
  in ~20.6 s — **under the card timer**. Echo-on-first-paint-only (5
  completions, 3.85 s / 3.0 s focused) keeps every margin ≥1.15×. This is a
  design cut, cheap now, painful after ship.

### 1e. EMBERTIDE relief organs + surfaceOrgans + fork-feed — GREEN/GREEN/YELLOW

- Model audit (`bossEmbertide.js`): **all four organs already exist** —
  `eyeHollow0` / `eyeHollow1` (L303-304 — ⚠ the plan's names `eyeHollowL/R`
  are wrong; use the model's `0/1` names in the def), `mouthNotch` (L306),
  `leashNotch` (L129), `faceRig` (L161). Better than the plan promised: zero
  new empties needed. (4+1)×2 = 10 ≥ 6 ✓.
- `surfaceOrgans`: `paintableParts()` (`boss.js:4282`) has the single-organ
  special case (`def.eyeWeakPoint`/`def.eyeOrgan` + `model.eyeIsUp()`).
  Generalizing to a `def.surfaceOrgans` list + a model liveness callback is a
  contained edit of one function — **coexist rule: add the list path alongside
  the eyeOrgan path; BRINEHOLM's def is not migrated** (its bytes and its
  `tests/lockdps.mjs` 5/5/5/2 fixture stay identical).
- Fork→beam feed: the fork consumer is `surgeForkLances()` (`boss.js:1409`)
  — it already calls `consumeAllLocks()` (which carries `{part, stacks}` out,
  pips included — yes, the pips leave with the fork today). The feed is a
  def-gated branch at the top: if `def.beamDuel && beamDuelT > 0`, add
  `0.35 × pips` to `beamDuelT` (all module-local state, `boss.js:287`) and
  skip the lances (the choice the plan describes: face OR beam). One wrinkle
  verified: a live duel does survive Surge activation (the `!game.feverActive`
  check only gates *starting* duels, `boss.js:2960`), so the feed's timing
  window is real. Note the payoff is surge-economy, not HP (`beamDuelWon` pays
  6 grazes + a note, `boss.js:2978`) — the feed cannot move TTK invariants at
  all, which makes it the *safest* endgame mechanic in the plan.
- P5 (Horizon Break) is a runtime survival seal — same static-model note as
  KNELLGRAVE P4.

### 1f. THE UNMASKED — YELLOW (stages/eyes) + RED (relics/RECKONING)

- Model audit (`bossUnmasked.js`): `focalEye` (L193), `crackSeams` (L178, the
  named cracks geometry — the two `crackSeamL/R` paint empties are new,
  byte-neutral), `halo` (L562), `starEye` (L606) exist. The ~20 stage-2 eyes
  are **merged meshes** (`eyeScleras`/`eyeIrises`, L529-538) — the 6 curated
  `wingEye0..5` anchor empties are new and REQUIRED (the plan is right), placed
  on the named `wing_<key>_<side>` pivots. `wingRootL/R` do not exist yet —
  two more empties.
- Stage gating via `lockParts[].phases: [0]/[1]/[2]` is the shipped BRINEHOLM
  seam and composes correctly with `formLifebars`: `phaseIdx` still advances
  per form, and `currentPhaseHp()` returns the full 240 bar (`boss.js:4166`) —
  the §4d clamp-free crescendo is confirmed real, an existing property.
- **Relics: RED until the relic model system lands.** `bossUnmasked.js:619`:
  "RELICS (§8) are RESERVED FOR CP2 … destructible relics with their per-relic
  palette + destroy→sag behaviour; no seed here." There is nothing to hang
  `relicHorn`…`relicShard` on today. THE RECKONING (brand-all-5 → frac 1.0) is
  itself small — a `lockPaint` listener + a fight flag + a frac override — but
  it rides the relic PR. **The plan's §6 PR7 split ("eyes first, relics +
  RECKONING ride the relic PR") must be the committed plan, not a fallback.**
- Shimmer budget (rule 12, ≤6 concurrent breathes): presentation cap in the
  shimmer renderer — small, but it is the ONLY perf-relevant item on this boss
  (§3, perf gate) and must ship in the same PR as the stage-2 organs.

### Feasibility scorecard

| Mechanic | Seam status | Rating | Files |
|---|---|---|---|
| SCAR-BURN gate (perfect detect) | exists (`releaseVolley` onBeat + `lockVolley{perfect,full}`) | GREEN | — |
| SCAR-BURN ticks/FX | new small subsystem at the boss seam | YELLOW | boss.js, config.js |
| KNELLGRAVE organs | 1 named + 2–3 new empties | GREEN | bossKnellgrave.js, bossDefs.js |
| KNELLGRAVE toll→beatOn | new def-gated clock plumbing (REQUIRED for the hero) | YELLOW | boss.js:2540, sfx seam |
| WEFTWITCH organs | all resolvable on existing named nodes | GREEN | bossDefs.js (+2 optional empties) |
| WEFTWITCH mend-interrupt | new consumer in re-weave controller | YELLOW | boss.js (archetype block) |
| ONEWING organs | all three already named | GREEN | bossDefs.js |
| ONEWING echo grant | needs NEW `grantPip()` export (paintFromParry unsuitable) | YELLOW | lockLayer.js, boss.js |
| EMBERTIDE organs | all four already named (fix `eyeHollow0/1` names in plan) | GREEN | bossDefs.js |
| `surfaceOrgans` generalization | contained edit of `paintableParts()` (coexist w/ eyeOrgan) | YELLOW | boss.js:4282 |
| EMBERTIDE fork-feed | 3-line def-gated branch in `surgeForkLances` | GREEN/YELLOW | boss.js:1409 |
| UNMASKED stage organs + eyes | existing phases seam + ~10 new empties + shimmer cap | YELLOW | bossUnmasked.js, bossDefs.js |
| UNMASKED relics + RECKONING | relic model system does not exist (`:619`) | **RED (blocked)** | rides relic PR |

---

## 2. Balance — "helpful, never broken" (the real arithmetic)

All numbers below computed against today's live spans (`hpMax × atFrac` from
`bossDefs.js`), the shipped kernel `lanceDmgEach = min(2.0·mult, 0.10·phaseHp/pips)`,
and the cadence model `6×(0.35+0.22)+1.0 = 4.42 s` ideal per full volley.

### 2a. Per-boss proposed economy (full cap 6, per phase)

```
                span     roiCeil  base    beat    perfect+burn      card timer
KNELLGRAVE .25  144      14.40    12.00   14.40   18.00  (12.5%)    24
                120      12.00    12.00   12.00   15.00  (12.5%)    26
                 96       9.60     9.60    9.60   12.00  (12.5%)    26
                120*     12.00    12.00   12.00   15.00  (12.5%)    30   *P4 runtime-sealed
WEFTWITCH .30   114.4×3  11.44    11.44   11.44   14.87  (13.0%)    26/26/28
                 93.6     9.36     9.36    9.36   12.17  (13.0%)    28
                 83.2     8.32     8.32    8.32   10.82  (13.0%)    32
ONEWING .35     118.8×3  11.88    11.88   11.88   16.04  (13.5%)    24/26/26
                 97.2     9.72     9.72    9.72   13.12  (13.5%)    28
                 86.4     8.64     8.64    8.64   11.66  (13.5%)    30
EMBERTIDE beam  110–121  ~11–12   11–12   11–12   = beat (no burn)  28–30
UNMASKED .5/1.0 240/form 24.00    12.00   15.00   22.5 → 30 (9.4→12.5%) 26/30/34
```

Cross-checks against the plan: §4e's trajectory row (12.5% / 13% / 13.5% / ‡ /
9.4→12.5%) is **exactly reproduced** ✓. But **§3 rung 10's utility math is
stale**: it still says "+50% burn ⇒ ~15% of each phase" — written before the
owner's ramp; at frac 0.25 KNELLGRAVE's perfect total is 12.5%, as §4e says.
Fix the plan text so PR2 doesn't implement the 0.5 by accident. (Also fix
`eyeHollowL/R` → the model's `eyeHollow0/1`, §1e.)

### 2b. The sane band (the existing test, unchanged semantics)

Base (non-perfect) volleys-to-clear and TTK — **the numbers the current
`tests/lockdps.mjs` band asserts — do not move at all for bosses 4–9** (burn is
tier-gated ≥4 and additive-on-perfect only). New bosses enter the band at:

```
KNELLGRAVE  ~42 base volleys (P4 un-gated) · TTK ~190s     ∈ [20,130] / (30,600) ✓
WEFTWITCH    50                · TTK ~221s                  ✓
ONEWING      50                · TTK ~221s                  ✓
EMBERTIDE    52                · TTK ~230s                  ✓
THE UNMASKED 60 (20/form ×3)   · TTK ~265s                  ✓
```

Perfect-path (beat+burn) volleys-to-clear: 32 / 40 / 40 / 50 / 30 — all
comfortably above a proposed perfect-band floor of 24 (§3). Nothing approaches
the trivialization edge of 20.

### 2c. The "not a phase-deleter" bar — the one real red flag

Bar: ideal pure-perfect-lance (every volley full-cap, on-tell, burn included,
zero dodge downtime — strictly unattainable in play) must not clear a phase
faster than its spell-card timer.

At standard cadence (4.42 s/volley) every phase in the game passes: 8 perfect
volleys × 4.42 = **35.4 s** vs timers 24–34 s (worst margin: UNMASKED stage 3,
35.4/34 = 1.04× — acceptable for the sanctioned crescendo, but pin it in a
test). EMBERTIDE 44.2 s vs 28–30 ✓ everywhere.

**ONEWING breaks the bar if echoes ride stacks.** Time-to-cap completions:

- echo on paint AND stack → 4 completions → cadence 3.28 s → 8×3.28 = **26.2 s**
  vs P2/P3 timers 26 s — margin ~1.0×, gone;
- add FOCUS (dwell ×0.5, a shipped LAW the plan never multiplies in) →
  cadence ≈ 2.58 s → **20.6 s < 24 s** — ideal lance now deletes P1 *inside its
  card timer*, and V4 snaps push it further under.
- echo on FIRST paint only → 5 completions → 3.85 s → **30.8 s** vs 24–26 s
  (margin 1.18–1.28×), and ~23.8 s under focus — at the line but on the right
  side, with the dodge-downtime reality providing the rest.

**Recommendation (opinionated): ship echo-on-first-paint-only, and add the
NOT-A-PHASE-DELETER invariant (§3) with the focus-less cadence so the ratio is
enforced forever.** If the owner wants paired stacks for feel, the compensator
is dropping ONEWING's frac 0.35 → 0.25; do not ship both halved-cadence and the
band-max burn.

### 2d. Is the lance "roughly a third, optional"?

- Rider chip with a held line: `1.4 / 0.5 s × 1.15 = 3.22 HP/s`. Perfect lance,
  realistic ~7.5 s cycles (plan §4c's own under-fire estimate): KNELLGRAVE P1
  `18/7.5 = 2.4 HP/s` — **~43% of the lance+chip total, ~40% of the required
  card pace** (144 HP / 24 s = 6 HP/s). With Surge/parry damage in the mix the
  as-played share lands ~25–35%: the "roughly a third" claim holds at tier 4.
- At the finale it deliberately runs hotter: RECKONING lance ≈ `30/7.5 = 4 HP/s`
  vs the ~7 HP/s stage-3 pace ⇒ up to ~50% of clear pace for a player nailing
  every release — that is the crescendo, but say it out loud at sign-off:
  **stage 3 lance is closer to "half" than "a third" for a perfect player.**
- Optionality: no proposed rule gates progress on pips (mend-interrupt and
  fork-feed are accelerants; survival cards stay sealed; kill-timers untouched).
  Fairness windows exist per boss (toll turnarounds + quasi-static lipCrack;
  thread-cut stagger + snaps; RUBATO wind-ups; surfacing windows + crest
  passes; the Apex's restLo 1.2–2.7 s stillness) — each ≥ the 0.35 s dwell by
  an order of magnitude except WEFTWITCH, which is the deliberate hard case
  (§1c note: preview-verify a median player fills a set once per phase).
- **RECKONING cannot spiral:** frac is a constant 1.0, burn = 1.0 × 15 = 15,
  total 30 ≤ (1+1.0) × roiCeil 24 = 48 ✓; burn totals are fixed per release
  (concurrent burns from fast cycles overlap in time but never compound), the
  clamp input is the form bar (240, constant per form), and there is no
  burn-begets-burn path (burn ticks are `damageBoss`, not releases). The only
  spiral-shaped risk would be burn ticks feeding crack/parry systems — specify
  that `'lockburn'` damage carries **no** lanceWeight toward PART_CRACK_HITS
  and charges no meters (test it, §3).

---

## 3. Verification strategy — what a PR must not be able to sneak past

### 3a. New `lockdpsCore.mjs` invariants (prototype, mirrors existing style)

First, teach the model burn (same PR as the mechanic — the plan's §7 "static
model drift" risk becomes a rule): in `bossEconomy`, given
`LOCK.scarBurn = { minTier, dur, fracBySlot }`:

```js
const sbFrac = (LOCK.scarBurn && tier >= LOCK.scarBurn.minTier)
  ? (LOCK.scarBurn.fracBySlot?.[def.id] ?? 0) : 0;
// per phase, alongside volley/volleyBeat:
const burn = sbFrac * volleyBeat;             // burn rides the PERFECT volley
const perfectTotal = volleyBeat + burn;
const toClearPerfect = perfectTotal > 0 ? Math.ceil(phaseHp / perfectTotal) : Infinity;
```

Then in `invariantBreaches(economies, LOCK, opts = {})` — `opts.reachabilityExempt`
is the shrinking rollout ratchet (see §6):

```js
// 4. SCAR-BURN BOUND: the burn can never exceed its declared fraction of the
//    (already-clamped) perfect volley — the LAW's own arithmetic, re-derived.
if (p.burn > sbFrac * p.volleyBeat + eps)
  out.push(`${e.id} phase ${i + 1}: burn ${p.burn.toFixed(2)} > ${sbFrac} × perfect volley ${p.volleyBeat.toFixed(2)}`);

// 5. TOTAL-RELEASE CEILING: perfect volley + burn ≤ (1 + frac) × the ROI ceiling
//    — the effective per-release law (10% → ≤(1+frac)·10% of the phase, 20% max).
if (p.perfectTotal > (1 + sbFrac) * p.roiCeil + eps)
  out.push(`${e.id} phase ${i + 1}: perfect+burn ${p.perfectTotal.toFixed(2)} breaches (1+${sbFrac})×ROI ceil ${((1 + sbFrac) * p.roiCeil).toFixed(2)}`);

// 6. BURN-FRAC LAWS: ≤1.0 everywhere (the RECKONING is the ceiling), zero below
//    minTier, and non-decreasing along BOSS_ORDER (the owner's difficulty ramp).
if (sbFrac > 1 + eps) out.push(`${e.id}: scarBurn frac ${sbFrac} > 1.0`);
if (e.tier < (LOCK.scarBurn?.minTier ?? 4) && sbFrac > 0)
  out.push(`${e.id}: tier ${e.tier} boss has a scarBurn frac (mid-game must not move)`);
// (ramp check runs once over the ordered economies list:)
//   prevFrac > frac + eps && frac > 0  →  `${e.id}: burn frac ${frac} regresses below ${prev.id}'s ${prevFrac}`

// 7. REACHABILITY LAW (the paper-cap regression guard): every tier ≥4 boss not
//    on the rollout ratchet reaches its full tier cap in ≥1 phase.
if (e.tier >= 4 && !(opts.reachabilityExempt ?? []).includes(e.id)) {
  if (!e.lanceCapable)
    out.push(`${e.id}: tier ${e.tier} boss is lance-inert (REACHABILITY LAW)`);
  else if (e.peakCap < tierCap)
    out.push(`${e.id}: peak cap ${e.peakCap} < tier cap ${tierCap} (paper ladder)`);
}

// 8. NOT-A-PHASE-DELETER: ideal pure-perfect-lance (volleyCadence at the boss's
//    effective completions-to-cap) never clears a phase inside its card timer.
//    completions = capPips, minus granted pips (def.echoPips ⇒ capPips − echoes).
const idealClear = p.toClearPerfect * volleyCadence(effCompletions(def, p.capPips), LOCK);
if (isFinite(idealClear) && cardTimer(def, i) && idealClear < cardTimer(def, i) - eps)
  out.push(`${e.id} phase ${i + 1}: ideal perfect-lance clears in ${idealClear.toFixed(1)}s < card timer ${cardTimer(def, i)}s (phase-deleter)`);
```

Invariant 8 is the one that mechanically forbids the §2c ONEWING failure mode:
echo-on-stack (4 completions) fails it under any frac ≥ 0.3; echo-on-first-only
passes. It also permanently pins the UNMASKED stage-3 margin (35.4 vs 34).

### 3b. `tests/lockdps.mjs` additions

- Wire the new breaches (they arrive free via `invariantBreaches`; pass the
  ratchet list explicitly so un-skipping is a visible diff).
- **THE MID-GAME FREEZE FIXTURE** — pin the shipped six exactly (this is the
  byte-identity guard for tiers ≤3 in economy space):
  `assertEq(volleys, {marrowcoil:51, eitherwing:57, hollowgate:42, thrumswarm:97, brineholm:56, karnvow:45}[id])`
  for every tier ≤3 capable boss, plus `assertEq(brine.phases caps, 5/5/5/2)`
  (already present). Any endgame PR that shifts one of these numbers fails
  loudly and on purpose.
- Per hero PR, extend the capable-roster expectations: capable count 6→7→…→11;
  per new boss `peakCap === 6`; base volleys/TTK inside the untouched band
  (expected: KNELLGRAVE ≈42, WEFTWITCH 50, ONEWING 50, EMBERTIDE 52,
  UNMASKED 60 — the existing [20,130]/(30,600) band needs **no widening**).
- New perfect-path band: `toClearPerfect` total per boss ∈ [24, 130]
  (expected 32/40/40/50/30) — catches a frac typo (e.g. 2.5 for 0.25) that the
  ceiling invariant alone might survive on a big-span phase.
- Config lints: `scarBurn.minTier === 4`; `fracBySlot` keys ⊂ tier-≥4 ids;
  UNMASKED frac 1.0 is the max.

### 3c. `tests/lock.mjs` unit cases (fabricated-ctx sketches)

- **T-B1 perfect gate:** bank to cap (`__testBank`), `requestLoose()` with
  `ctx.beatOn = false` → `lockVolley {perfect: false}` and ZERO burn callbacks;
  same frames with `beatOn: true` → `perfect: true` and the burn seam fires.
  A NON-full on-beat tap (`pips < cap`) also does NOT burn (full-cap is part of
  the gate). A tier-3 ctx never burns regardless (minTier).
- **T-B2 deflect pauses burn:** start a burn, run frames with
  `ctx.deflected = true` → `damageBoss('lockburn')` calls stop; clear the
  deflect → remaining ticks resume; total burn damage over the run equals
  `frac × volleyTotal ± tick-quantization` (never more).
- **T-B3 burn dies on the seam:** phase advance / `clearLocks('transition')`
  mid-burn → no further ticks (no cross-phase bleed — keeps invariant 5's
  single-phase accounting honest). And `'lockburn'` damage adds no crack hits
  and charges no meters.
- **T-E1 echo grant:** ctx with `paintables: ['onewingEye','frameRim','snappedThread']`;
  dwell-paint the eye → `lockCount() === 2`, `lockHudState().locks` has TWO
  markers with the FRAME's world x/y on the second (rule 11 — no phantom), the
  player's `paintCd`/aim are untouched by the grant (the §1d gotcha, asserted).
  Echo at cap: bank 5 of 6, paint the eye → count 6 not 7. Echo blocked while
  `deflected`. `dropLockPart('frameRim')` (frame death) removes the echo pip +
  its marker and resets the fuse.
- **T-E2 echo does NOT ride stacks** (if the §2c recommendation is taken):
  stack the eye to 2 → frame still holds exactly 1 echo pip.
- **T-F1 beam feed:** def-gated ctx with the duel armed → the fork consumer
  drains pips (`consumeAllLocks` → `lockCount() === 0`), fires ZERO
  `fireLance` calls, extends the duel window by `0.35 × pips`, and emits its
  feed event; duel NOT armed → today's fork lances, byte-identical
  (`tests/lock.mjs` T3.4 stays green untouched).
- **T-R1 resonant beatOn:** the toll-clock ctx produces `beatOn` windows at
  the toll edge ± beatWindow with music dead; a headless/no-clock ctx yields
  `beatOn` null → no perfect, no burn (the determinism spine, §3d).

### 3d. Kill-time invariance / determinism (the mid-game must not move)

Must stay green, byte-identical, with zero test-file edits:

- `tests/wisps.mjs` T-W2/T-W8 — wisp arrival-frame invariance (burn FX must
  reuse the crack-tick presentation channel precisely so no wisp/vrel law is
  touched; damage stays on scheduled frames).
- `tests/gold-determinism.mjs`, `tests/boss.mjs`, `tests/bossrush.mjs`,
  `tests/bossboot.mjs` — boot/kill-time/economy determinism. SCAR-BURN's
  perfect gate is `beatOn`-dependent and `beatOn` is null headless, so these
  stay identical *by construction* if the recommendation in §1a (manual-tap
  perfect only) is taken — one more reason to take it.
- The §3b mid-game freeze fixture is the economy-space half of the same guard.
- `tests/lock.mjs` T2.x/T3.x — every existing state-machine behavior (deflect
  rule, strip, fork, loose) unchanged; the new exports are additive.

### 3e. Headless vs the human preview

`node tests/run-all.mjs` (sequential, first-failure) proves: state-machine
correctness, economy invariants + bands, model organ resolution (T2.12-style
def-lints per new boss), boot/determinism, tri/draw budgets. It CANNOT prove:
release feel, the §4f "reads more powerful" ladder, window fairness under real
patterns, or overdraw on a real phone.

Manual preview checklist, per endgame PR (the §4f HARD gate, made concrete):

1. Side-by-side reads: plain volley → perfect release → SCAR-BURN → (Apex)
   RECKONING each *visibly and audibly* out-class the previous (heavier ribbon,
   burning brand + ember plume + heat shimmer, layered searing sustain in the
   `sfxLance*` family). A damage change without its AV step = incomplete PR.
2. The burn brand persists ~3 s on the struck organ and pauses visibly ashen
   under deflect (sealed honesty).
3. Boss-specific: KNELLGRAVE toll-release feel (dodge-on-beat = strike-on-beat,
   no second metronome); WEFTWITCH mend-cancel legibility + no survival-mend is
   cancellable + a median player fills a set per phase; ONEWING echo marker
   reads ghost-pale ON the frame (no phantom), frame-break kills it; EMBERTIDE
   dark-halo brands legible in the bright field (the lens/bullet-visibility
   tooling, rule 9); UNMASKED ≤6 concurrent shimmers, the fifth-relic eye-snap
   moment, transitions stay sealed-honest.
4. Lance-free winnability spot-check on each hero (the fight clears on
   dodge/parry/Surge inside its timers with the lance untouched).

### 3f. Perf gate (§2 of BOSS-DESIGN: overdraw is THE cliff)

- Organ anchors: named empties — zero tris, zero draws. `node tools/tricount.mjs`
  must show **zero delta** on every organ-only PR (gate it in the PR body).
- Burn FX: reuse the crack-tick channel + bloom on existing marks. Ember plume
  and heat shimmer must be **line/point-class or thin-strip** primitives
  (LineSegments are exempt from the cliff; thin ribbons are the shipped wisp
  law — "the overdraw law is area, not intensity"). **Never** an additive shell
  around the organ; the screen-wide RECKONING beat is a postfx kick + existing
  juice budget (`JUICE.events`), not new additive volume. Hard cap unchanged:
  ~2 large additive volumes on screen including the kit shield.
- Shimmer: rule 12's ≤6 concurrent breathes is the budget; UNMASKED stage 2 is
  the worst case → **real-phone pass before PR7 merges** (the plan already says
  this; make it the PR7 GO gate). If in doubt, add a burn-FX axis to
  `tools/stress.html` and read the HUD on-device (`tools/stress.mjs` for
  relative curves).
- Screenshot fixtures per hero: `tools/knellshot.mjs`, `tools/weftshots.mjs`,
  `tools/tiershots.mjs` (+ a onewing/embertide shot tool as those PRs land),
  `tools/loudshots.mjs` baseline for the new SFX layers.

---

## 4. The reviewer's guardrail checklist (run on EVERY endgame-lance PR)

1. **Mid-game frozen:** `tests/lockdps.mjs` freeze fixture green (51/57/42/97/
   56/45 + BRINEHOLM 5/5/5/2); no `bossDefs.js` diff outside the PR's slot; no
   `LOCK` LAW value changed (`volleyRoiFrac` 0.10, `capByTier`, `beatMult`
   inside the clamp, `lanceDmg` path untouched).
2. **Invariants green:** `node tools/lockdps.mjs --ci` exit 0 with the new
   breaches active (ROI, beat-in-clamp, cap ladder, burn bound, total-release
   ceiling, frac laws, REACHABILITY for this PR's slot un-ratcheted,
   NOT-A-PHASE-DELETER).
3. **Bands:** base volleys ∈ [20,130] and TTK ∈ (30,600) for the new boss;
   perfect-path total ∈ [24,130].
4. **No mandatory lance:** the fight's sim/preview clears lance-free inside its
   card timers; no mechanic keys progress on pips.
5. **Determinism:** `tests/wisps.mjs`, `tests/gold-determinism.mjs`,
   `tests/boss.mjs`, `tests/bossrush.mjs` green with zero edits; headless
   `beatOn` remains null-safe (no burn without a clock).
6. **Perf:** tricount zero-delta for organ data; no new additive shells; shimmer
   ≤6; tiershots/boss shots updated; UNMASKED PRs need the on-device pass.
7. **§4f AV ladder present:** the PR demonstrably looks/sounds one rung bigger
   (preview checklist §3e item 1) — reviewer blocks on damage-without-AV.
8. **Model extended with the mechanic:** any PR adding burn/echo/feed also
   extends `lockdpsCore` + its tests in the SAME PR (no silent under-reporting).
9. **A `leapfrog/lessons/` file ships with the PR** (repo law).

---

## 5. Risks, unknowns, and what needs real measurement

**What the static model proves:** every number in §2 — clamps, ceilings, bands,
ideal cadences, reachable caps, the phase-deleter ratios. These are exact
(config × HP model) and now regression-guarded.

**What it cannot prove (lockdpsCore runs no fight loop):**

- **As-played paint cadence.** The 7.5 s "realistic" cycle is an assumption;
  real cadence under dodge pressure, V4 snap frequency, and the echo's true
  speedup need a **headless lance-persona**: extend the sim driver (today
  `driveKill` only fires Surge) with a persona that (a) banks via the existing
  `__testBank`/`bossBankLocks` seams on a schedule derived from each boss's rest
  windows, (b) fires `requestLoose` on `beatOn` edges, (c) records per-channel
  damage attribution via the `bossHit{kind}` tags (`'lance'`/`'lockburn'`/
  rider/surge). Deliverable: measured lance share-of-kill per boss — the number
  that validates "roughly a third" (§2d) and the finale's ~50%.
- **WEFTWITCH window sufficiency** (§1c) — stagger cadence vs set-fill rate is
  a feel measurement, not arithmetic.
- **Fork-feed value** — +2.1 s of duel is ~7 extra graze ticks + a near-assured
  duel win; whether that *feels* worth six banked brands vs a 12-damage volley
  is preview territory. If it under-reads, tune `+s/pip`, never the ROI.
- **Overdraw on UNMASKED stage 2** — on-device only (§3f).
- **Burn/phase-boundary edge:** a volley that kills a phase mid-burn — §3c T-B3
  pins the chosen rule (burn dies on the seam); confirm the *feel* of losing
  tail damage at a phase kill is acceptable (it mirrors today's clamp behavior).

**Owner sign-offs still open (inherited from the plan, sharpened here):**
(1) SCAR-BURN law + the perfect-definition decision (§1a — recommend manual-tap
only); (2) the ONEWING echo-stack cut (§2c — recommend first-paint-only);
(3) EMBERTIDE fork-feed Surge-boundary + retiring the `lockMuted (slot 13)`
comment; (4) §4d both halves (clamp-free finale + 1.0 RECKONING burn), noting
the perfect-player finale lance share runs ~half, not a third; (5) the
`leashNotch` lore card.

---

## 6. Staged rollout with GO/NO-GO gates (refining plan §6)

Ordering principle: the riskiest *balance* assumption is "a perfect-gated burn
at the smallest frac feels rewarding without breaking a phase" — prove it on
the cheapest boss first. KNELLGRAVE is that boss: 3 organs (2 already have
homes to hang on), quasi-static easy anchor, 4 phases, the smallest frac
(0.25), and it forces the one scary piece of plumbing (the toll beat source)
immediately. The plan's order is right; the gates below make it enforceable.

- **PR0 — DONE** (`36b754d`): gate re-greened; baseline recorded in this doc.
- **PR1 — ladder-as-data + the ratchet.** `lockRole` per def; progression test
  walking `BOSS_ORDER`; land invariants 6–8 (§3a) with
  `reachabilityExempt = ['knellgrave','weftwitch','onewing','embertide','unmasked']`
  — each hero PR deletes its own entry (the visible-diff ratchet).
  *GO gate:* all suites green, zero behavior diff (`lockdps` table byte-identical).
- **PR2 — HERO: KNELLGRAVE (organs + toll-beat + resonant release; NO burn yet).**
  Proves: endgame organs on a shipped model, the REACHABILITY un-skip, the
  beat-source plumbing (T-R1), fair windows on the swing.
  *GO gate:* lockdps shows KNELLGRAVE capable, peakCap 6, ~42 volleys in band;
  freeze fixture untouched; tricount zero-delta; knellshot/tiershots pass;
  owner preview: toll-release feels like the fight's own rhythm (no second
  metronome). *NO-GO:* if the toll→beatOn seam fights the music architecture,
  fall back to judging resonance at the boss seam by toll-ring passage (plan
  §7) before writing any burn code.
- **PR3 — SCAR-BURN (config + boss-seam ticks + model extension + AV rung 1).**
  Smallest frac only (0.25, KNELLGRAVE). Extends `lockdpsCore` + tests in the
  same PR (§3a-c). ⚠ owner sign-off on the law + perfect-definition before merge.
  *GO gate:* invariants 4–6 green; T-B1/2/3 green; determinism suite untouched;
  preview shows the burn rung of the §4f ladder; measured (persona or hand-
  played) phase pace confirms no card-timer pressure.
- **PR4 — WEFTWITCH** (organs on existing nodes + mend-interrupt, frac 0.30).
  *GO gate:* survival-mend audit vs her phase table; set-fill-per-phase
  preview check (§1c); band entry 50 volleys.
- **PR5 — ONEWING** (organs + `grantPip` + echo-first-only + frame-break
  coupling, frac 0.35). *GO gate:* invariant 8 green **with the echo modeled**
  (`effCompletions = 5`); T-E1/E2 green; the frame-break trade previews as a
  real choice.
- **PR6 — EMBERTIDE** (def data on the four existing organs + `surfaceOrgans`
  generalization + fork-feed). ⚠ owner sign-off (Surge boundary); retire the
  stale `lockMuted` comment. *GO gate:* BRINEHOLM fixture byte-identical
  (coexist proof for the surfacing seam); T-F1 green; dark-halo legibility pass.
- **PR7a — UNMASKED stages + eyes + shimmer budget** (no relics).
  *GO gate:* on-device overdraw pass on stage 2; stage-gated caps 6/6/6;
  invariant 8 pins the 35.4 vs 34 margin.
- **PR7b — relics + RECKONING** — **blocked on the relic model system**
  (`bossUnmasked.js:619`); rides that PR. *GO gate:* frac 1.0 only via the
  RECKONING flag; perfect-band 30; the eye-snap reveal previews.
- **PR8 — mid-ladder polish** (MARROWCOIL P1 gating, THRUMSWARM
  `decayPauseWhileHidden`, KARNVOW snap-attribution) — last, independent, each
  with its own freeze-fixture update flagged as intentional.

Cheapest real proof that endgame lance is fun AND balanced: **PR2+PR3 on
KNELLGRAVE** — one boss, one new law at its gentlest setting, the full
verification spine online, and every later PR is then data + one consumer
walking through gates that already exist.
