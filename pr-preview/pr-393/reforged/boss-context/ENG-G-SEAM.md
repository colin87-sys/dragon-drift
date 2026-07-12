# ENG-G SEAM — THREAD-THE-GAP scoring (the lane-denial family: `curtain` / `movingGap` / `crestfall` / `geyser`)

**Status**: PRE-BUILD spec (Fable checkpoint, 2026-07-10). Design only — no code changed, nothing run.
**Owner decision (fixed input to this spec)**: the reward is **player-facing** — a visible
"THREADED" flourish + a combo/score bump when you fly cleanly through a wall attack's
authored safe gap. Teach + reward the skill visibly. Designed to that; no silent-bank-only
variant is considered.
**Plan rows**: ATTACK-REWORK-PLAN §E.1 row **G** — "THREAD-THE-GAP scorer: clearance+lateness
measured at the crossing frame + a chain window (math authored at PRE-BUILD)… seed = the
crossing-graze check in `bossBullets.js` (`prevRel > 0 && s.rel <= 0`)… hero **MARROWCOIL
(C.3)**"; §C.3 dread row — "the aperture's thread is scored by THREAD-THE-GAP
(clearance+lateness, chains)"; §E.2 C.3 gap **(v)** — "THREAD-THE-GAP math — 'clearance+
lateness, chains' has no formula, no window, no HUD surface." This spec authors all three.
**Law** (BOSS-DESIGN §5i.B Colossi row, verbatim): "**THREAD-THE-GAP scored by
clearance+lateness** (4: the ribs — tighter+later = bigger chunk, consecutive threads
chain)". Plus the cross-cutting graze laws: **dedup discrete** (one award per row — this
form is discrete, NOT a tick form); graze never punishes; payout richest at the scariest
instant; reset-on-hit.
**Sibling seams**: ENG-D (slipstream), ENG-C4 (orbitAnnulus), ENG-C7 (shrinkDisc) — all
continuous tick forms on the `beamHeld/beamTick/beamGrace` ramp. THREAD-THE-GAP deliberately
does **not** ride that ramp: a thread is a discrete event at a crossing frame, so it takes
the *other* half of the §5i.B dedup law ("dedup discrete / tick continuous") — the
`orbitLapJackpot` / `holdFlinch`-tier ceremony, not the beamEdge tick economy.

Everything below was read from CURRENT master in this session, cited by SYMBOL, never line
number.

---

## 1. DRIFT-CHECK — what is already live (verified by symbol)

- **The crossing check the plan cites is real and where it says.** `updateBossBullets`
  (bossBullets.js) resolves every boss-owned bullet on the frame it crosses the player
  plane: `if (prevRel > 0 && s.rel <= 0)` → inside `hitRi` = `hitPlayer(...)` + deactivate;
  inside `grazeRi` (`(s.r + R * CONFIG.BOSS.grazeScale) * grazeBonus`) = `bulletGraze(player)`.
  One graze per bullet, at its crossing frame — the shipped dedup-discrete exemplar.
- **The wall family's gap is authored, known, and local to `executeAttack`.** All four
  branches compute a single lane-x `gap` before emitting, and *exclude* the safe slot:
  - `curtain`: `gap = clamp(resolveGapAnchor('curtain') ?? -Math.sign(player.position.x||1)*5.5)`,
    slot half-width `slot = 3.0`, full-height columns `y` from `CONFIG.laneMinY + 2.5` to
    `CONFIG.laneMaxY - 2`, fired **instantly** (no `pending`), `vrel = -closing*0.66`.
  - `movingGap`: per-row `pending.push` closures; `gap = clamp(resolveGapAnchor('movingGap')
    ?? g0 + dir*2.6*k)`, skip `|x-gap| < 2.6`; TWO y-bands at `cy ± 2.4` where `cy` clamps
    the player's live y at fire time; `vrel = -closing*0.9`.
  - `crestfall`: per-row closures; `gapC = horizonPocketX != null ? horizonPocketX : (g0 +
    dir*2.5*k)`, skip `|x-gap| < 3.4`; one row-line born at `topY = CONFIG.laneMaxY + 3`
    falling at `vy = -5.5`; `vrel = -closing*0.6`.
  - `geyser`: plume beat (zero bullets) seals `gapX` via `solveGap()`, the ERUPTION beat
    reuses it ("the telegraph can never lie"); skip `|x-gap| < 3.4`; row-line born at
    `footY = CONFIG.laneMinY - 3` rising at `vy = +5.5`; `vrel = -closing*0.6`.
- **Row bullets inherit `pose.rel`.** `emitBoss(x, y, vx, vy, vrel, ...)` defaults
  `rel: originRel ?? pose.rel` — no wall branch passes `originRel`, so a row's birth depth
  IS `pose.rel` at its fire closure. A fire-time ledger snapshotting `pose.rel` tracks the
  real bullets exactly.
- **The reward vocabulary already ships.** Course-mode gate threading (`threadGate` in
  collision.js) pays `CONFIG.gateScore(150) × game.combo × game.scoreMult`, advances
  `game.combo` by `CONFIG.comboStep`, and fires `ui.gatePopup(points)` — whose text is
  literally **`THREADED +N`** (cyan) — plus `sfx.gate()`, `gateThreadBurst(player.position)`,
  `emit('gate')`. The word, chime, and particle for "you flew through the gap" already exist;
  ENG-G reuses the read, not the function (threading a boss wall must NOT bump `gatesRun` /
  ring-fever plumbing — see §5).
- **Discrete-jackpot ceremony precedent**: `orbitLapJackpot` (boss.js) = `ui.bossNote?.(...)`
  + `model.flash?.()` + `sfx.milestone?.()` + `emit('orbitLap', ...)` + an adrenaline
  fast-forward. Surge-bank feed precedent: `holdFlinch` pays via **repeated `bulletGraze(player)`
  calls** (`for (let i = 0; i <= tier; i++) bulletGraze(player)`), inheriting the gem HUD,
  `grazeCharge → consecutiveRings` conversion, and stats in one call.
- **Reset-on-hit is centralized.** `hit()` (collision.js), `cause === 'bullet'` block:
  increments `game.bossHitsTakenRun` and zeroes `consecutiveRings/grazeCharge/grazeStreak/
  parryStreak/parryPerfectStreak`. `game.bossHitsTakenRun` is the observable a boss.js-local
  chain can watch — no collision.js edit needed.
- **State precedent**: plain module `let`s in boss.js (`holdTier`, `slipRideT`, `discTollN`,
  …) joined to the three reset sites: the `activeCard = null; cardTimer = 0; …` clusters in
  `startBossEncounter`, `endEncounter`, and `resetBoss`.
- **Hero def state**: `bossDefs.js` `marrowcoil` has **NO `grazeForm` today** (verified —
  the label list covers ashtalon/eitherwing/hollowgate/brineholm/thrumswarm/knellgrave/
  karnvow/weftwitch/onewing/embertide/unmasked; voidmaw/stormrend/marrowcoil are bare). No
  ENG-C7-style loaded-gun label: the opt-in line is genuinely new, and the coexist-first
  ship order (branch inert → one def line arms the hero) is available — use it.
- **MARROWCOIL fires a wall TODAY**: P3 (`atFrac: 0.33`, the closingRibs dread phase)
  `attacks: ['iris', 'movingGap', 'spiralStream', 'stream']` — the hero pays out before C.3b
  ever lands.

**Drift flagged (plan/design-doc vs live code):**
1. **§5d marrowcoil sheet says "Scoring wiring arrives with the slot-6 continuous-graze
   detector."** Stale framing: slot 6's `beamContact` shipped long ago and no thread scorer
   arrived with it; more importantly the §5i.B **dedup law forbids** a continuous detector
   here — a thread is one event per wall row. This spec supersedes that clause with a
   discrete crossing-ledger. Not premise-breaking (the sheet's *scoring math* — clearance +
   lateness, chains — is honored verbatim); record the correction in the build lesson.
2. **"Thread" namespace is crowded**: `def.threadCut` + `threadCut` plumbing (WEFTWITCH
   parry), `ribThread` (setpiece id), `threadGate` (course gates). All new symbols here are
   prefixed **`gapThread`** to stay grep-distinct.
3. Plan §A row 4 ("THREAD-THE-GAP scoring absent, AUDIT §3.B.2") — still true on master;
   nothing pre-shipped under another name (grep: no scorer touches the wall gaps).

---

## 2. DETECTION — the fire-time row ledger (authored truth, not a scan)

**Rejected alternatives** (why the ledger wins):
- *Tag wall bullets + aggregate at the bossBullets crossing check*: puts per-boss wall
  bookkeeping inside the pooled hot loop; needs per-row aggregation across ~10 slots;
  bossBullets.js is deliberately boss-agnostic (it imports collision.js, never boss.js).
- *Geometry scan of live bullets at the player plane* ("find the empty lane"): fragile —
  reconstructs at runtime what `executeAttack` already knows exactly, false-positives on
  sparse non-wall patterns, and breaks the moment two walls overlap.
- **Chosen: record each row at its fire closure** — the same `gap` variable the bullets and
  (for geyser) the telegraph use. The detector can never disagree with the wall it scores.

**The ledger.** New module array in boss.js, plain-var precedent:

```js
let gapThreadRows = [];   // { gapX, halfW, yLo, yHi, vy, rel, vrel, age, hits0, inGapT }
```

`noteGapThreadRow(gapX, halfW, yLo, yHi, vy, vrel)` — pushes a row **iff
`gapThreadActive()`** (§5), snapshotting `rel: pose.rel` (matching `emitBoss`'s default) and
`hits0: game.bossHitsTakenRun`. Four call sites inside `executeAttack`, each AFTER the
branch's own gap clamp, INSIDE the closure that actually emits (so a `pending`-wipe at
`breakShield` — `pending.length = 0` — never records a row whose bullets never existed):

| branch | call placement | halfW | yLo / yHi | vy |
|---|---|---|---|---|
| `curtain` | after `gap` (instant branch body) | `slot` (3.0) | `CONFIG.laneMinY + 2.5` / `CONFIG.laneMaxY - 2` | 0 |
| `movingGap` | inside each row's `fire` closure, after `gap` | 2.6 | `cy - 2.4` / `cy + 2.4` | 0 |
| `crestfall` | inside each row's `fire` closure, after `gap` | 3.4 | `topY` / `topY` | −5.5 |
| `geyser` | inside the **ERUPTION** closure only (never the plume), after `gap` | 3.4 | `footY` / `footY` | +5.5 |

The halfW values are the branches' own skip constants — if a branch's dial moves, the
recorded halfW moves with it (record the local, don't re-derive).

**The walker.** `updateGapThreadRows(dt, player)` — called once per fight tick inside
`updateBoss`, adjacent to the grazeForm cluster (beside the `def.grazeForm === 'beamEdge'`
block). Per frame:

1. **Chain hygiene** (top of walker):
   `if (game.bossHitsTakenRun !== gapThreadHitsMark) { gapThreadStreak = 0;
   gapThreadHitsMark = game.bossHitsTakenRun; }` — ANY bullet hit breaks the chain
   (reset-on-hit law), with zero collision.js edit. Then
   `if (fightNow - gapThreadLastT > GAP_THREAD_CHAIN_S) gapThreadStreak = 0` — the chain
   window (`fightNow` is the existing fight-clock mirror).
2. Per row: `prevRel = row.rel; row.rel += row.vrel * dt; row.age += dt;`
   while `0 < row.rel <= GAP_THREAD_WATCH_REL`, accumulate the **lateness clock**:
   `if (|px - row.gapX| < row.halfW) row.inGapT += dt`.
3. **The crossing frame** (`prevRel > 0 && row.rel <= 0`) — evaluate exactly once, then
   splice the row (dedup-discrete: one verdict per row, ever):
   - `clean` = `game.bossHitsTakenRun === row.hits0` (no bullet hit — from any pattern —
     across the row's whole flight; you cannot tank through a wall and still get paid);
   - `inGap` = `|px - row.gapX| < row.halfW`;
   - `exposed` = `row.yLo + row.vy*row.age - GAP_THREAD_YPAD <= py <= row.yHi +
     row.vy*row.age + GAP_THREAD_YPAD` (the wall actually swept the player's height — this
     is the "dodging around a wall ≠ threading its gap" test: ducking under a crestfall
     sheet or floating above a movingGap band pays nothing);
   - all three → `gapThreadAward(player, row)`; otherwise silently drop (graze never
     punishes — a missed thread is only a chain that doesn't grow).
4. Safety cull: `row.rel < -2 || row.age > 12` → splice (a phase seam mid-flight leaves
   bullets flying — `breakShield` wipes `pending`, not live bullets — so in-flight rows stay
   scoreable through the seam, matching what the player sees).

Frame-order independence: the walker integrates `rel` with the same `dt` the bullets get,
but the verdict never compares against bullet slots — `hits0` + player position make the
result identical whether `updateBossBullets` ran before or after `updateBoss` this frame.

---

## 3. THE MATH (the §E.2 C.3(v) formula, authored here)

Measured at the crossing frame:

```
clearance = halfW - |px - gapX|                       // metres to the nearest doomed column edge
edge  = clamp01(1 - clearance / halfW)                // 0 = dead-centre … →1 = kissing the wall
late  = clamp01(1 - inGapT / GAP_THREAD_LATE_S)       // 1 = dove in at the last instant, 0 = camped
chain = 1 + GAP_THREAD_CHAIN_K * min(gapThreadStreak, GAP_THREAD_CAP)   // streak BEFORE this thread
points = round(CONFIG.BOSS.threadScore * (1 + 0.5*edge + 0.5*late) * chain
               * game.combo * game.scoreMult)
```

- **tighter + later = bigger chunk** — verbatim §5i.B: `edge` pays wall-huggers (payout
  richest at the scariest instant — the same annulus instinct as every sibling form: the
  edge-hugger is also inside the shipped crossing-graze annulus of the boundary columns, so
  the two rewards land together by geometry, not by code), `late` pays the brave commit over
  the gap-camper. Both are bonuses on a full base — camping the safe lane is still a thread,
  it just pays the floor.
- **consecutive threads chain** — `gapThreadStreak++` (cap `GAP_THREAD_CAP = 9`) on every
  award; `gapThreadLastT = fightNow`. Chain multiplier caps at `1 + 0.25*9 ≈ ×3.25`. A
  5-row movingGap volley threaded end-to-end escalates row by row — the §C.3 "chains" read.
- Starting dials (all tunable, human judges feel): `CONFIG.BOSS.threadScore = 75` (half a
  gate — `gateScore` 150 — per row; a full 5-row volley ≥ one gate, ≥ a parry),
  `GAP_THREAD_LATE_S = 1.2`, `GAP_THREAD_CHAIN_K = 0.25`, `GAP_THREAD_CHAIN_S = 6.0`,
  `GAP_THREAD_WATCH_REL = 8`, `GAP_THREAD_YPAD = 2.2`. Only `threadScore` goes in
  `CONFIG.BOSS` (it's economy); the rest are boss.js module consts on the `SLIP_*`/`ORB_*`
  precedent.

---

## 4. THE REWARD — visible flourish + combo + surge feed (`gapThreadAward`)

All through shipped symbols:

1. **Score**: `game.score += points` (formula above).
2. **The flourish** — a *light* pop, not the banner: new one-liner `ui.threadPopup(points,
   streak)` in ui.js beside `gatePopup`, modeled on `parryPopup`'s streak form:
   `this._popup(streak > 1 ? `THREADED ×${streak} +${points}` : `THREADED +${points}`,
   'cyan')`. Same word + colour as the course-gate `gatePopup` — deliberately: it is the
   same skill, and slot 1–2 players already know what THREADED means. Plus
   `gateThreadBurst(player.position)` (add it to boss.js's existing `./particles.js` import
   beside `burst`) and `sfx.gate?.()` — the shipped thread chime, optional-chained like
   every boss.js sfx call.
3. **Streak milestones only** touch the big banner: at streak 3 and 6,
   `ui.bossNote?.('✦ THREADED ×N ✦', 'STAY IN THE GAP', 'gold', 1.6)` — `bossNote` is
   `_noteBusy`-gated, so this can never spam over a phase announcement.
4. **Surge-bank feed** — the `holdFlinch` precedent verbatim: `bulletGraze(player)` called
   `1 + (edge > 0.5 ? 1 : 0)` times. One call = `grazeScore(12)` score + spark + graze chime
   + `emit('bossGraze')` + `grazeCharge += grazeGain(0.34)` with the whole-gem conversion —
   the gem HUD moves, the player SEES the wall pay into Surge. Do NOT feed `grazeCharge`
   directly (would fork the conversion loop and desync `grazesRun` stats).
5. **Telemetry/feats hook**: `emit('gapThread', { streak: gapThreadStreak, edge, late,
   points })` — the events.js bus, sibling of `slipGraze`/`orbGraze`/`discGraze`.
6. `gapThreadStreak++`, `gapThreadLastT = fightNow`.

**No double-count with the graze economy**: the shipped per-bullet crossing grazes on the
gap's boundary columns keep firing from `updateBossBullets` untouched — that layer is
per-bullet, this layer is per-row, and the row is spliced at its verdict. The only
intentional overlap is the §4.4 feed, which is an authored jackpot (holdFlinch-sanctioned),
not an accidental re-count.

---

## 5. GATE + COEXIST (the def key, and why every other boss is byte-inert)

**The key**: `gapThreadActive()` = `def?.grazeForm === 'threadTheGap' || def?.gapThread ===
true`.

- **Hero (this build)**: MARROWCOIL adds ONE def line — `grazeForm: 'threadTheGap'` — its
  §5i.B Colossi allocation, landing in the empty grazeForm slot verified in §1. That is the
  only shipped-def byte change in the PR.
- **The family alias (`def.gapThread`)**: the owner scoped the reward to the whole
  lane-denial family, but every other wall boss's `grazeForm` slot is already spent
  (stormrend is bare today but CRESCENDO work may claim it; hollowgate `beamEdge`; embertide
  `tideEdge`; weftwitch `moteHarvest`; brineholm `shadowRide`). `gapThread: true` is the
  composable opt-in that doesn't burn a grazeForm slot — **dormant in this build** (no def
  carries it; an unused predicate arm with an existing branch is safe — the inverse of the
  ENG-C7 loaded-gun, which was a live label with no branch). Migration = one def line per
  boss, each its own tiny PR after the human judges the hero (coexist → prove on a hero →
  migrate, THE RULE #3).
- **Coexist argument, provable from the diff shape**: `noteGapThreadRow` early-returns unless
  `gapThreadActive()` → for every un-opted def the ledger is empty forever → the walker
  no-ops → zero new state transitions, zero emits, zero UI. No emission, cadence, telegraph,
  colour, or def byte changes anywhere else: **rhythmprint, amberdiet, laneSafe, telegraph,
  bulletcontrast all untouched by construction.** `threadTheGap` does not read or write
  `beamHeld/beamTick/beamGrace`, so the one-grazeForm-per-boss ramp-sharing invariant is
  irrelevant to it (flag for the ledger: it's the first grazeForm value with no tick ramp).
- **No false positives by design**: award requires in-gap ∧ exposed ∧ clean at an authored
  row's own crossing frame. Vertical escapes fail `exposed`; slaloming between doomed
  columns fails `inGap`; tanking fails `clean`; non-wall attacks never enter the ledger.
- **Resets**: `gapThreadRows.length = 0; gapThreadStreak = 0; gapThreadLastT = -1e9;
  gapThreadHitsMark = 0;` joined to the three shipped reset clusters (`startBossEncounter`,
  `endEncounter`, `resetBoss`) — the ENG-D teardown lesson (never strand fight state).
- **Debug surface** (additive fields on `bossDebugState()`, the `slipActive/orbAcc/discR`
  precedent): `gapThreadStreak`, `gapThreadRows: gapThreadRows.map(r => ({ gapX, halfW,
  rel: r.rel }))`.

---

## 6. ANTI-FARM + FAIRNESS

- **One award per row, ever** — the row is spliced at its verdict (dedup-discrete law). Rows
  are finite (≤5/volley) and the BOSS owns the supply via its own cadence — the player
  cannot induce walls, only answer them.
- **Camping pays the floor, not the ceiling** — `late = 0` for a gap-camper; the `edge`
  bonus asks you to hug the doomed column, which is exactly where the shipped hit annulus
  lives. Risk buys reward; parking buys base rate.
- **A hit voids and breaks** — `clean` (hits0 snapshot) voids the row; the hits-mark watch
  zeroes the streak; both piggyback the same `game.bossHitsTakenRun` counter the shipped
  reset-on-hit block already drives.
- **Bounded surge feed** — ≤2 `bulletGraze` per row (≤0.68 gem-fraction), ≤5 rows/volley,
  chain caps at ×3.25 on SCORE only (never on the surge feed). The feed is deliberately
  smaller than the shipped edge-column crossing grazes a tight thread already earns.
- **Never punishes** — a failed/dodged/absent thread costs nothing (§5i.B law); the wall's
  threat stays its bullets, unchanged.
- **`horizonPocketX` interaction** (EMBERTIDE crestfall lock): inert this build (embertide
  is un-opted); when migrated, threading the face-shadow pocket pays — which is the §5d
  "ride the shadow" read, aligned, but re-tune `threadScore` vs `tideEdge` ticks then.

---

## 7. HEADLESS GATE PLAN (tests/boss.mjs, the ENG-D sim template)

New §ENG-G block on the shipped harness (`makePlayer` + `game.health = 1e9` +
`boss.forceBoss(p, BOSS_ORDER.indexOf('marrowcoil'))` + `boss.debugForceFight(p)` +
`boss.updateBoss(1/60, p, t)` stepping + `on('gapThread', …)` listener). NOTE:
`debugEmitAttack` requires a booted def for the ledger gate (its standalone flush runs with
the live module `def` — boot the hero first, as the ENG-B tests already do).

1. **Row-record fidelity**: boot marrowcoil, `debugEmitAttack('movingGap', p)` → assert
   `bossDebugState().gapThreadRows.length === rows` and each `gapX` sits inside the safe
   lane the volley scan finds (ties the ledger to the laneSafe ≥2.2 clearance gate — the
   detector and the fill can never disagree).
2. **THREADED fires only for a clean in-gap crossing**: park `p.position.x` at
   `gapThreadRows[0].gapX`, `p.position.y` inside the row band; step `updateBoss` until the
   rows cross → assert ≥1 `gapThread`, `game.score` rose, `gapThreadStreak ≥ 1`,
   `grazeCharge + consecutiveRings` rose (the surge feed landed).
3. **Out-of-gap pays nothing**: same drive, `p.position.x` parked mid-wall (a doomed column)
   → assert 0 `gapThread` AND (the wall hit them → `bossHitsTakenRun` rose →
   `gapThreadStreak === 0`).
4. **Dodging around ≠ threading**: `movingGap` with `p.position.y` moved far above the
   recorded band (`yHi + vy·age + YPAD`) before crossing, x in-gap → assert 0 `gapThread`
   (the `exposed` test — the false-positive gate). Repeat shape for `crestfall` (duck under
   the falling line).
5. **Chain escalates, hit breaks it**: thread two consecutive volleys inside
   `GAP_THREAD_CHAIN_S` → capture per-award `points` from the emit payload, assert
   `points₂ > points₁` and `gapThreadStreak ≥ 2`; then land one bullet hit
   (`hitPlayer`-path, park in fire for a frame) → assert `gapThreadStreak === 0`; a thread
   after the chain window (advance `fightNow` past 6s idle) restarts at streak 1.
6. **Edge/late dials point the right way**: two single-row drives, x at `gapX` (edge≈0,
   camped) vs `gapX + halfW − 0.3` entered late → assert the second award's `points` is
   strictly larger (the "tighter+later = bigger chunk" law, executable).
7. **Coexist**: boot voidmaw (no walls) — 10 simulated seconds, assert `gapThreadRows`
   empty, 0 emits; boot **stormrend** and thread a `movingGap` gap perfectly — assert 0
   `gapThread` (un-opted def: the gate holds even for a boss that FIRES walls); assert
   `bossDebugState()` new fields exist and read inert.
8. **Seam hygiene**: arm rows, force `breakShield` mid-flight → in-flight rows still resolve
   (bullets weren't wiped), no row survives `endEncounter`/`resetBoss`.

**Must stay green** (E.3 universal + marrowcoil rows): full `node tests/boss.mjs` +
`node tests/bossboot.mjs`; **rhythmprint untouched** (zero cadence movers); **amberdiet
untouched** (zero emission changes — P3's `stream` carrier as shipped); laneSafe (incl. the
authored-gap ≥2.2 asserts); the shipped rib-pivot telegraph + ENG-E organ-break asserts
(marrowcoil's own regression net); lifecycle sim (roster net); the shipped-roster
byte-invariant — the diff touches boss.js (ledger/walker/award), ui.js (`threadPopup`
one-liner), config.js (`threadScore`), bossDefs.js (ONE marrowcoil line), tests; every other
def byte-identical. `node tools/stamp-sw.mjs` in the build commit; §7c order (studio verdict
before captures) applies only if the build adds any visual beyond the popup/burst — none is
specced, so tiershots/bossgate should be unmoved.

---

## 8. THE TWO BIGGEST RISKS / TUNABLES

1. **Economy inflation on wall-heavy phases.** Marrowcoil P3 (the dread phase) rolls
   `movingGap` in a 4-attack kit at cadence [1.3, 1.7] — every wall volley now pays up to
   ~5 threads + ≤10 surge-feed grazes on top of the shipped edge grazes. If Surge charges
   visibly faster in P3 than the roster norm, the levers are (in order): the `bulletGraze`
   feed count (drop the edge-doubling), `threadScore`, `GAP_THREAD_CHAIN_K`. POST-BUILD
   should measure gems/minute on a scripted P3 thread-everything run vs shipped master
   before the human plays it.
2. **The `exposed` window on the moving-line walls (`crestfall`/`geyser`).** The row is a
   sweeping LINE; `GAP_THREAD_YPAD = 2.2` must be wide enough that a legitimate thread
   counts at 30fps dt-skew, yet tight enough that ducking the whole sheet never pays. Gate
   §7.4 pins the negative; the positive margin is a feel dial only the preview can judge.
   If it proves twitchy, the fallback is honest: award those two ids on `inGap ∧ clean`
   only when the row-line is within the lane band at crossing — computed from the same
   record, no new state.

---

## 9. GIT-STATUS SANITY (this checkpoint)

This PRE-BUILD pass created **one new file** — `reforged/boss-context/ENG-G-SEAM.md` — and
touched nothing else: no source, no defs, no tests edited; no test suite, tool, or build
run (design-only, per the checkpoint protocol). `git status` should show exactly this file
as new/untracked. The build PR that implements it is a separate, future diff with the shape
pinned in §7.
