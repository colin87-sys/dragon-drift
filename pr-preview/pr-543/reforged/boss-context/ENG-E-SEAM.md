# ENG-E SEAM — Parry-per-part attribution + `destructibleRibs` (PART_SYS third entry)

**Hero: MARROWCOIL (C.3 ORGAN BREAK slice).** Plan row: ATTACK-REWORK-PLAN.md §E.1 row E; the
allocation is BOSS-DESIGN.md §5b slot 4, verbatim: *"rib-slam ambers → ORGAN BREAK (Colossi
debut): parry a rib-slam's ambers N× → that rib CRACKS, its pattern component deleted"*, and the
§5i.C parry ladder: *"ORGAN BREAK (4: … parry as sculptor; reused at 5 on the eye-holder)"*.

This is a PRE-BUILD implementation spec, authored from the live code (all citations are live
symbols/quotes). Everything below is def-gated on a new `destructibleRibs` flag — a def without
it never enters any new path (the PART_SYS coexist rule: *"a boss without the flag/hooks never
enters it"*).

---

## 0. What the live code already gives us (verified)

- **Rib bullets already carry per-rib part tags.** `emitRibBullets` (boss.js) iterates
  `RIB_EMITTERS = ['ribPivotL1', 'ribPivotR1', 'ribPivotL3', 'ribPivotR3']` and passes the pivot
  NAME as `emitBoss`'s trailing `part` param: *"V4 (PR4): the amber carries its SOURCE RIB's
  name — a perfect parry snaps a brand onto the organ that fired it"*. The tag is a **string**
  (`'ribPivotL1'`), unlike HOLLOWGATE's **numeric** pane tags (`firePaneRadial` passes `idx`).
- **The tag survives the parry.** `reflectBossBullets` (bossBullets.js) flips the slot in place
  (`s.owner = 'player'`) and never touches `s.part`; on a PERFECT parry it dedupes the tag into
  `snapParts` (*"a PERFECT parry knows which organ fired the bullet … Deduped; nulls (untagged
  emitters) skipped"*) and returns `{ total, perfect, snapParts }`. The reflected bullet later
  arrives and emits `bossDamage` **with the tag**: `emit('bossDamage', { amount: s.dmg, kind:
  s.owner, x: s.x, y: s.y, part: s.part })`.
- **No per-part parry counter exists.** The `snapParts` consumers today (boss.js roll-parry
  block, inside `if (!rollParried)`): (1) the V4 LOCK-SNAP `paintFromParry` loop (perfect-only,
  ≤ `snapPerVolley`); (2) three def-gated GLOBAL counters — `staggerHits` (THRUMSWARM, ≥3),
  `threadCutHits` (WEFTWITCH, ≥`THREAD_CUT_HITS`), `ghostFrameHits` (ONEWING, ≥`GHOST_FRAME_HITS`
  = 4, keyed to the single tag `'frameGroup'`). None is per-part. `partHits` (the `PART_SYS`
  ledger) counts SHOT/arrival damage, not parries.
- **`routePartDamage` is string-blind, so it is naturally inert for rib tags:** `let idx =
  (typeof e.part === 'number') ? e.part : -1;` then the `sys.hit` landing-point fallback. A rib
  row that declares no `hit` hook leaves `idx = -1` → `continue`. We keep it that way (see §2 —
  single-ledger law).
- **The model has named per-rib pivots but NO crack API.** bossMarrowcoil.js builds ten pivots —
  `pivot.name = `ribPivot${sx < 0 ? 'L' : 'R'}${h}`` for `h` 0..4 × `sx` of `[-1, 1]` (*"D3
  (CANONICAL): each rib is its OWN mesh on its OWN ROOT PIVOT (ribPivotL0..4 / ribPivotR0..4)"*),
  collected in `ribPivots` (`{ pivot, idx: h, sx, R }`). The returned handle exposes
  `setSetpiece/setCharge/…` but **no** `crackRib`/`ribAlive`/`liveRibs` — the model API is a
  prerequisite ENG-E ships (§3).
- **The pattern-deletion precedent:** `crackPane` (bossHollowgate.js) — *"A cracked pane goes
  dark + its radial is deleted from the composite (both the visual wedge and the pattern arm
  that fires along it)"* — plus `firePaneRadial` (boss.js): *"Cracked panes emit nothing — their
  radial is deleted from the composite"*, plus the brand cleanup `dropLockPart('rosePane' + i)`
  and the `lockPartDead` liveness filter (*"a lockPart backed by a DESTRUCTIBLE sub-part must
  leave the paintable set when that sub-part dies"*).
- **Reset conventions:** `partHits.clear()` runs at encounter init (*"§5f: per-part crack
  counters reset per encounter (panes + shackles)"*); model-side cracked state (`crackedPanes`
  Set) lives in the builder closure, so it resets with the per-fight model rebuild.

### The load-bearing DRIFT (read this before building)

**The plan's "rib-slam ambers" do not exist at station today.** The only per-rib-tagged ambers
fire during the `ribThread` setpiece's thread beat — boss.js: `if (setpieceDef.id ===
'ribThread') { … if (k < 0.34 && pose.rel > -5 && pose.rel < 8) { ribEmitT += dt; if (ribEmitT
>= 0.32) { ribEmitT = 0; emitRibBullets(player); } } }` — i.e. ~2.9s of an 8.5s setpiece that
runs once per fight (P2, `atPhase: 1`). MARROWCOIL P3's amber carrier is `stream` (skull-origin
via `muzzle: 'skullGroup'`, untagged), and `movingGap` is a generic sliding-gap wall (boss.js
`id === 'movingGap'` branch) with **zero rib coupling** — the "gap = the surviving rib aperture"
mapping is ENG-B scope (C.3b), not shipped. Consequence: without a second amber window, ORGAN
BREAK would be reachable only inside one 2.9s window per fight. §4a below ships the minimal fix
(a rib strain amber during `closingRibs`), which is also what makes the dread §5f-law-7
compliant (*"The dread move feeds the diet … its counterintuitive answer is a parry read"*).

---

## 1. The parry-per-part counter (`partParries`)

**Data:** one module-level Map in boss.js, next to `partHits`:

```js
const RIB_BREAK_PARRIES = 3;   // N (§5b "N×") — the roster's canonical 3: PART_CRACK_HITS = 3,
                               // staggerHits ≥ 3, PANE BREAK "parry … 3×" (§5b slot 6),
                               // EITHERWING holder "3× mid-possession" (§5b slot 5).
                               // GHOST_FRAME_HITS = 4 is the outlier (a frame dismantle, not an organ).
const partParries = new Map(); // part-tag (string name) → banked PERFECT parries (ENG-E ledger)
```

- **Keyed by the tag string** exactly as `snapParts` carries it (`'ribPivotL1'`), so the ledger
  is generic for the later reuses (C.4 holder stagger keys per-twin tags, C.6 gem shatter keys
  per-ring tags) — the Map never hardcodes ribs.
- **Fed at the parry moment**, from `reflectBossBullets`'s returned `snapParts` — the plan's
  "parry-side counter per tag". Increment is **+1 per parry burst per tag** (snapParts is
  deduped per burst, and the whole consumer runs once per roll via the `rollParried` latch) — a
  single 4-amber volley can bank at most +1 on each distinct rib, never insta-crack one rib
  (the GHOST-STAGGER grammar: parries are counted per roll, not per bullet).
- **Perfect-only** (owner-consistent, see §7 for the dial): `snapParts` is perfect-only by
  construction, the V4 LOCK-SNAP on these SAME bullets is *"owner-ruled PERFECT-ONLY"*, the
  shipped snap teach on this boss already says *'PERFECT-PARRY TO BRAND THE SOURCE'*, and the
  shipped parry-counter precedent (ONEWING `ghostFrameHits`) is perfect-fed. A non-perfect
  parry still reflects the amber for damage — it just doesn't bank toward the break.
- **Reset per encounter:** `partParries.clear()` on the same line/block as `partHits.clear()`.
  (Model-side cracked state resets via the per-fight model rebuild, like `crackedPanes`.)
- **Distinct from the two existing counters, by contract:** `partHits` = SHOT/arrival damage,
  weighted (`e.w ?? (typeof e.part === 'number' ? 1 : 0.5)`), fed by `routePartDamage` inside
  `damageBoss`; `GHOST_FRAME_HITS` = parry-fed but Onewing-GLOBAL (one int, one hardwired tag);
  `partParries` = parry-fed AND per-tag. Ribs use `partParries` ONLY (next section).

**Consumer block** — placed inside the existing perfect-parry consumer (`if (player.rollInvuln >
0) { const r = reflectBossBullets(…); if (r.total > 0) { … if (!rollParried) { … } } }`),
**above** the V4 snap-paint loop (so a crack lands before `paintFromParry` runs its
`!lockPartDead(tag)` guard — no paint-then-drop churn on the breaking parry), sibling to the
`def.condenseInvuln` / `def.threadCut` / `def.ghostHalf` blocks:

```js
// §5i.C ORGAN BREAK (MARROWCOIL — the Colossi parry DEBUT, §5b slot 4): a PERFECT parry
// of a rib's amber banks toward THAT rib's crack; at RIB_BREAK_PARRIES the rib CRACKS and
// its pattern component is deleted for the rest of the fight (parry as sculptor). Surge
// reflects don't count (§5i.C law 4 — free-for-all, not the amber read). Def-gated; inert
// for every other boss. NOT gated on lockUnlocked (a boss mechanic, not the lance system —
// the ghostHalf precedent).
if (def.destructibleRibs && !surge && r.snapParts.length) {
  for (const tag of r.snapParts) {
    const idx = ribTagToIdx(tag);                        // -1 for non-rib / unknown tags
    if (idx < 0 || !(model.ribAlive?.(idx) ?? false)) continue;   // over-crack guard
    const n = (partParries.get(tag) ?? 0) + 1;
    partParries.set(tag, n);
    if (n >= RIB_BREAK_PARRIES) breakRib(idx);
    else {
      // The banked parry is SEEN + HEARD (the THREAD-CUT CP2 lesson: "the counter was
      // invisible") — the ghost-stagger note grammar, plus the model recoil.
      model.hurt?.(0.4);
      ui.bossNote?.(`✦ RIB CRACKING — ${n}/${RIB_BREAK_PARRIES} ✦`, 'PARRY ITS AMBER AGAIN', 'gold', 1.1);
    }
  }
}
```

`ribTagToIdx` (boss.js, next to `lockPartDead` — the same name↔index seam convention as
`rosePaneN`/`shacklePostN`): parse `/^ribPivot([LR])([0-4])$/` → `ring * 2 + (L ? 0 : 1)`
(canonical index below), else `-1`.

---

## 2. The `PART_SYS` third row — `destructibleRibs`

Mirrors the two shipped rows (quoted here so the shape is unambiguous):

```js
{ flag: 'destructiblePanes', crack: 'crackPane', hit: 'paneHitTest', alive: 'paneAlive', live: 'livePanes',
  key: 'pane', note: ['✦ PANE SHATTERED ✦', 'ITS RADIAL IS SILENCED'], event: 'bossPaneBreak',
  lockName: (i) => 'rosePane' + i },
{ flag: 'destructibleShackles', crack: 'crackShackle', hit: 'shackleHitTest', broken: 'shackleBroken', live: 'liveShackles',
  key: 'shackle', … lockName: (i) => 'shacklePost' + i },
```

**New row:**

```js
// MARROWCOIL ribs (ENG-E): the ONLY parry-fed row — its counter is the partParries
// ledger (perfect parries at the roll), NEVER routePartDamage's shot ledger. counter:
// 'parry' makes routePartDamage skip it explicitly (belt); it also declares no `hit`
// hook, so the landing-point fallback can never route to it (suspenders).
{ flag: 'destructibleRibs', crack: 'crackRib', alive: 'ribAlive', live: 'liveRibs',
  key: 'rib', note: ['✦ RIB CRACKED ✦', 'ITS VOLLEY IS SILENCED'], event: 'bossRibBreak',
  counter: 'parry',
  lockName: (i) => 'ribPivot' + (i % 2 ? 'R' : 'L') + (i >> 1) },
```

**`routePartDamage` gets ONE new guard** at the top of the loop body: `if (sys.counter ===
'parry') continue;`. Rationale — the **single-ledger law**: every perfect parry produces a
reflected bullet that later ARRIVES carrying the same string tag (`bossDamage` with
`part: 'ribPivotL1'`). If ribs also counted on arrival, one parry would double-book across two
ledgers with two thresholds (and rider chips could gunfire-sculpt a rib, contradicting §5b's
uniqueness diff: *"Hollowgate's panes are edited by gunfire+parry; ribs are parry-only — the
diff is the input"*). With the guard, the arriving reflected rib amber still deals its normal
reflect damage through `damageBoss` — it just doesn't feed `partHits`. (Today the string tag
already falls through harmlessly; the explicit guard is future-proofing for when someone adds a
rib hit-test.)

**The break executor.** Extract the crack ceremony from `routePartDamage`'s threshold branch
into a shared helper so the parry path and the shot path fire identical ceremonies:

```js
// Extracted verbatim from routePartDamage's `if (n >= PART_CRACK_HITS && model[sys.crack](idx))`
// branch: shieldShatter sfx, accent burst at group.position, cameraCtl.shake(0.6),
// ui.bossNote(sys.note), emit(sys.event, { [sys.key]: idx, left: model[sys.live]?.().length ?? 0 }),
// dropLockPart(sys.lockName(idx)), optional sys.spray → ventSprayBeat(). Returns the +6 bonus.
function applyPartBreak(sys, idx) { … return 6; }
```

`routePartDamage` calls it and returns the 6 (byte-identical behavior for panes/shackles — pure
extraction). The parry path calls:

```js
function breakRib(idx) {
  if (!model.crackRib?.(idx)) return;                       // idempotent (crackPane precedent)
  const bonus = applyPartBreak(RIB_SYS, idx);               // ceremony + dropLockPart + event
  damageBoss(bonus, 'rider');                               // §5i.C law 4: "sculpting visibly
                                                            // accelerates the kill" — the same
                                                            // +6 chip a pane break awards.
}
```

Note the ordering: the CRACK itself is unconditional (parry jobs never gate on hp state — the
ghost frame breaks even mid-anything); only the bonus chip routes through `damageBoss`, whose
own `shielded` early-return may eat it (acceptable: no damage through a shield, ever).

**`lockPartDead` gets a third branch** (the PR6 liveness convention — a cracked rib must leave
the paintable set and never take a lance):

```js
if (def.destructibleRibs && part.startsWith('ribPivot')) {
  return !(model.ribAlive?.(ribTagToIdx(part)) ?? true);
}
```

**What a cracked rib deletes from the pattern (the §5b "pattern component"), exactly:**

1. **Its amber volley — permanently.** `emitRibBullets` and the new `emitRibStrain` (§4a) skip
   dead ribs: inside the `RIB_EMITTERS` loop, `if (def.destructibleRibs && !(model.ribAlive?.(
   ribTagToIdx(name)) ?? true)) continue;` — the `firePaneRadial` precedent (*"Cracked panes
   emit nothing"*). Also skip that rib's `amberVent.set(name, …)` (a dead rib stops venting;
   its live entry expires on its own 2.2s clock — no cleanup needed).
2. **Its constrict arc — permanently.** The model hides the rib and the `closingRibs` dread
   loses that arc (*"each pivot ROTATES its rib inward up to ~50°"* — the tick loop skips
   cracked pivots, §3), so the P3 constricting cage keeps a permanent flyable/grazeable gap
   where the rib was. This is the physical, felt half of the deletion.
3. **NOT the `movingGap` gap-set.** There is no rib→gap coupling in live code to delete
   (verified: the `movingGap` branch seeds `g0` from `player.position.x` — pure player-sign
   placement). *"its movingGap rows are deleted"* (§5b/C.3) lands with **ENG-B's authored-gap
   provider (C.3b)**, whose rib-aperture mapping MUST read `model.liveRibs()` as its source of
   truth — that forward contract is the reason `liveRibs()` returns the full live set (§3), not
   just the emitter subset. ENG-E ships the seam C.3b consumes; it does not fake the mapping.

**In-flight bullets from a just-cracked rib are left alive** (parryable/dodgeable as normal) —
deleting in-flight amber is THREAD-CUT's verb (`cutBossAmbers`), a different mechanic's identity.

---

## 3. The MARROWCOIL model API (bossMarrowcoil.js — the prerequisite)

The ribs are **named and addressable** (`ribPivotL0..L4` / `ribPivotR0..R4`, found by name by
the telegraph gate and `partWorldPos`) but have **no crack/liveness API** — the returned handle
must add one, mirroring the pane API shape (`crackPane`/`paneAlive`/`livePanes`/`paneCount`/
`crackedCount`):

**Canonical rib index** = build order of the `ribPivots` array: `i = h * 2 + (sx < 0 ? 0 : 1)`
→ even = Left, odd = Right; `L0=0, R0=1, L1=2, R1=3, L2=4, R2=5, L3=6, R3=7, L4=8, R4=9`
(matches `lockName: (i) => 'ribPivot' + (i % 2 ? 'R' : 'L') + (i >> 1)` in §2).

```js
const crackedRibs = new Set();
function crackRib(i) {
  if (i == null || i < 0 || i > 9 || crackedRibs.has(i)) return false;   // idempotent-false
  crackedRibs.add(i);
  ribPivots[i].pivot.visible = false;    // the arc is GONE — a hole in the cage
  // OPTIONAL (crackPane stub precedent — panes add one dark TetrahedronGeometry(0.34) at
  // crack time): one small dark jag at the root so the break reads as a wound, not a
  // deletion. One tiny mesh, once per crack, ≤4 cracks/fight — within the tricount law.
  // NO debris, NO fragments (§E scope: "a rib hides/cracks, doesn't spawn debris").
  return true;
}
function ribAlive(i) { return i >= 0 && i < 10 && !crackedRibs.has(i); }
function liveRibs() { const o = []; for (let i = 0; i < 10; i++) if (!crackedRibs.has(i)) o.push(i); return o; }
function ribCount() { return 10; }
function crackedRibCount() { return crackedRibs.size; }
```

- **Tick change (one line):** the constrict loop (`for (const rb of ribPivots) { … rb.pivot.
  rotation.z += … }`) skips cracked ribs: `if (crackedRibs.has(ribPivots.indexOf(rb))) continue;`
  (or carry the canonical index on the `rb` record at build time — cleaner). A hidden pivot
  costs nothing to rotate, but skipping keeps `rotation.z` frozen for any future capture read
  and is self-documenting.
- **Export** the five functions on the returned handle (next to `setSetpiece`).
- **NO `ribHitTest`.** The row declares no `hit` hook (§2): ribs are parry-fed only, so a
  landing-point hit test would be dead code — and geometrically treacherous anyway (the ribs
  ride coiling dorsal vertebrae; pane/shackle hit tests work on near-static local frames).
  Add one only if a future reuse needs gunfire routing.
- **The scar rib (`ribPivotL2`, index 4)** is crackable in principle but UNREACHABLE (it is not
  in `RIB_EMITTERS` and not a `lockPart` — no tagged amber ever carries its name). Hiding it
  would also hide its scar fragment/marrow-seam children; harmless and unreachable, note only.
- **Budget:** zero new persistent geometry; ≤1 optional tiny stub per crack, ≤4 reachable
  cracks per fight. Nothing per-frame.

**Def change (bossDefs.js, marrowcoil only):** add `destructibleRibs: true,` beside `lockParts`
with a comment tying it to §5b slot 4 and this seam. The four breakable ribs are exactly the
four `lockParts`/`RIB_EMITTERS` (L1/R1/L3/R3 → indices 2/3/6/7) — the def needs no list; the
reachable set IS "ribs that fire tagged amber".

---

## 4. Teach-before-test + coexist

**The ladder debt this repays:** the parry ladder says ORGAN BREAK is the **Colossi debut
(slot 4)**, and the shipped HOLLOWGATE (slot 6) PANE BREAK is documented as its *reuse*
(BOSS-DESIGN §5b slot 6: *"PANE BREAK (Calamities ORGAN-BREAK reuse)"*) — but the debut never
shipped (AUDIT §3.B.1). ENG-E retroactively makes the ladder honest: the debut finally exists
upstream of its reuses (6 = panes, shipped; 5 = holder stagger, C.4; 11 = gem shatter, C.6 —
both of which reuse the `partParries` ledger with their own tags/thresholds).

**Teach:** nothing new to invent — the shipped V4 snap teach on this exact boss already names
the input (*'ITS AMBER GUARDS IT' / 'PERFECT-PARRY TO BRAND THE SOURCE'*, `driveSnapTeach`,
marrowcoil-gated), and the per-parry `✦ RIB CRACKING — n/3 ✦` progress note (§1) self-teaches
the count the same way `✦ GHOST STAGGER — n/4 ✦` and `✦ THREAD FRAYING — n/3 ✦` do. The break
ceremony (`✦ RIB CRACKED ✦ / ITS VOLLEY IS SILENCED`) names the payoff. Teach-before-test order
inside the fight: the ribThread ambers (P2) are the low-stakes first read; the closingRibs
strain ambers (P3, §4a) are the test where breaking pays into the dread itself.

### 4a. The strain-amber window (the minimal reachability fix — part of this slice)

Without it, all rib-tagged ambers live in ribThread's one ~2.9s window (§0 drift) and the break
is a ghost twice over. Ship `emitRibStrain(player)` in boss.js next to `emitRibBullets`:

- **Gate:** called from the setpiece branch, `if (setpieceDef.id === 'closingRibs' &&
  def.destructibleRibs)` — double-gated (the setpiece is marrowcoil-only via `def.setpieces`;
  the flag keeps the seam honest and lets a def opt out).
- **Window:** `0.22 ≤ k ≤ 0.8` — exactly the `closingRibs` path's constrict-hold segment
  (`SETPIECE_PATHS.closingRibs`: hold at `HOLD_REL = 13`, lateral sweep).
- **Cadence:** its own accumulator at 0.55s (reuse the `ribEmitT` reset convention — boss.js
  already resets `ribEmitT = 0; headShotT = 0; // reset the sub-cadences for the next pass`).
- **Emit:** for each `name` of `RIB_EMITTERS` with `model.ribAlive(ribTagToIdx(name))`: resolve
  `model.partWorldPos(name)`, guard `rrel > 0.5` (the `emitRibBullets` guard), fire **one** slow
  amber aimed at the player — `aimVelFrom({x: rx, y: ry, rel: rrel}, px, py, B.bulletSpeed *
  0.8)` → `emitBoss(rx, ry, v.vx, v.vy, -B.bulletSpeed * 0.8, true, null, 1, null, rrel, name)` —
  and `amberVent.set(name, fightNow + 2.2)` (the C3 dwell-exemption, as in `emitRibBullets`).
  **Why not reuse `emitRibBullets` verbatim:** its spine-convergence kinematics
  (`(crel - rrel) / T`) produce `vrel ≈ 0` when the boss holds at rel 13 — bullets would hover
  at the boss, never reaching the player. The strain amber must close normally.
- **Budget/determinism:** ≤4 bullets per 0.55s tick (~7/s) during one 6s setpiece — far under
  the §3e emission gates; zero RNG (deterministic origins + player aim, the `fireLanceAt`
  "deterministic: slot parity, no RNG" law).
- **Diet honesty:** this adds runtime ambers during a setpiece (like ribThread's), not a def
  `attacks[]`/`rhythm` change — `amberdiet`/`rhythmprint` inputs are untouched (§5).

The FULL C.3b "Rib Slam" (per-rib `aimed` ×3 strain volley prefixing a rib-aperture `movingGap`)
replaces/extends this when ENG-B lands; `emitRibStrain` is deliberately shaped as its seed.

**Coexist proof (the §6 rule):**
- Every new engine path is behind `def.destructibleRibs` (the parry block §1, the strain emit
  §4a, the `emitRibBullets` liveness skip, the `lockPartDead` branch) or behind
  `sys.counter === 'parry'` + missing model hooks (the PART_SYS row — `routePartDamage`'s
  existing `if (!def?.[sys.flag] || !model?.[sys.crack]) continue;` already skips it for every
  def without the flag AND every model without `crackRib`).
- The `applyPartBreak` extraction is behavior-preserving for panes/shackles (same calls, same
  order, same return).
- Every other boss's def is byte-identical; MARROWCOIL's def gains exactly one line.
- The shipped MARROWCOIL behavior without parries is unchanged: all 10 ribs alive → every skip
  is a no-op, ribThread emits exactly as today; the ONLY unconditional addition is the strain
  amber during closingRibs (def-gated, and part of the C.3 slice this seam exists to ship).

---

## 5. Gate plan (headless, `node tests/boss.mjs` + `node tests/bossboot.mjs`)

Mirror the shipped pane/shackle test shapes (boss.mjs: *"hollowgate crackPane(2) cracks a live
pane"* / *"is idempotent"* / *"cracked pane leaves 7 live"* / mesh-hidden assert; *"brineholm
shackleHitTest never reroutes to a broken post"*) and the §3c reflect harness (spawn via
`bullets.spawnBossBullet({ owner: 'boss', … reflectable: true, … })` → `reflectBossBullets` →
pump `updateBossBullets`).

**A. Model tier (buildBoss(BOSSES.marrowcoil, 1), no fight):**
1. `liveRibs().length === 10`; all ten `ribPivot{L,R}{0..4}` found by name (extend the existing
   named-pivot asserts).
2. `crackRib(2)` → true; `crackRib(2)` again → false (idempotent); `ribAlive(2)` false;
   `liveRibs().length === 9`; `group.getObjectByName('ribPivotL1').visible === false`.
3. Tick through a `setSetpiece(1, { id: 'closingRibs', dread: true })` envelope: the cracked
   pivot's `rotation.z` stays frozen while a live pivot's moves (the constrict-skip).

**B. Tag plumbing (bullets module, no boss):**
4. Spawn a reflectable amber with `part: 'ribPivotL1'` at `rel ≤ CONFIG.BOSS.perfectParryRel`;
   `reflectBossBullets(…).snapParts` includes `'ribPivotL1'` (locks the E.0.7 claim in a test).
5. Pump to arrival: the `bossDamage` event carries `part: 'ribPivotL1'` (string) — and, on a
   `destructibleRibs` fight, `partHits` stays empty (the single-ledger guard).

**C. Full loop (live fight — the driving seams already exist):** use `debugForceFight` +
`setDebugPerfectParryRel` (*"widens the PERFECT window so the V4 snap-parry is testable without
frame-tight timing"* — never frame-tight timing in CI). Drive three parry bursts: per burst,
spawn one `part: 'ribPivotL1'` amber near the test player, set `player.rollInvuln > 0`, run the
boss update, then drop `rollInvuln` to re-latch `rollParried`.
6. After burst 1 and 2: no `bossRibBreak`; after burst 3: `bossRibBreak` fired with
   `{ rib: 2, left: 9 }`, `liveRibs()` drops to 9.
7. **Deletion:** run `debugRunSetpiece('ribThread')`, tick into `k < 0.34`:
   `debugActiveBullets()` contains rib-tagged parts for live emitters but never `'ribPivotL1'`;
   run `debugRunSetpiece('closingRibs')`, tick into the hold window: strain ambers appear
   (`reflectable: true`, `part` set) for live ribs only.
8. **Permanence:** tick long / cross a phase; `liveRibs()` still 9 (model state, no re-arm).
9. **Over-crack guard:** a 4th perfect parry tagged `'ribPivotL1'` changes nothing (no event,
   no count growth — the `ribAlive` skip); parries tagged with a never-emitting name no-op.
10. **Brand liveness:** after the crack, `lockPartDead('ribPivotL1')` is true → it leaves
    `paintableParts()` and `paintFromParry('ribPivotL1')` is refused (the PR6 convention).
11. **Ceremony chip:** the break applied the +6 (hp delta) when unshielded.

**D. Coexist inertness:**
12. A non-`destructibleRibs` fight (e.g. HOLLOWGATE): perfect-parry a string-tagged amber →
    `partParries` untouched beyond flag-gated code (no `bossRibBreak` ever), pane behavior
    byte-identical (the extracted `applyPartBreak` covered by the EXISTING pane-break asserts
    staying green).
13. The whole of `tests/boss.mjs` + `tests/bossboot.mjs` green (the roster net), including §3e
    emission-budget/laneSafe with the strain emit active; `amberdiet`/`rhythmprint`/lifecycle
    inputs untouched (no `attacks[]`, no `phases`, no `rhythm`, no card changes anywhere).

**E. Capture seam:** add `debugCrackRib(i)` mirroring `debugCrackPane` verbatim (crack +
`dropLockPart(lockName(i))`) so preview/tiershots can show a broken cage without driving parries.

---

## 6. Scope boundary

**ENG-E ships:** the `partParries` parry-side ledger + consumer block (§1); the
`destructibleRibs` PART_SYS row + `applyPartBreak` extraction + `routePartDamage` parry-row
guard + `lockPartDead` rib branch + `ribTagToIdx` (§2); the MARROWCOIL model rib API
(`crackRib`/`ribAlive`/`liveRibs`/`ribCount`/`crackedRibCount` + constrict-skip) (§3); the
C.3 ORGAN-BREAK slice: emit-suppression deletion + the `closingRibs` strain amber (§4a); the
def flag; the gates + `debugCrackRib` (§5).

**ENG-E does NOT ship:**
- **C.3b / ENG-B:** the authored rib-aperture `movingGap` gap (the rib→gap mapping, the
  laneSafe-cleared authored pocket) — its provider will read `liveRibs()`.
- **ENG-G:** THREAD-THE-GAP scoring (its own seam; the crossing-frame math is unwritten there,
  not here).
- **C.4 holder stagger / C.6 gem shatter:** later reuses of the `partParries` ledger with their
  own tags, thresholds, and payoffs (stagger window / ring group-delete — the group-delete op
  is C.6's own gap).
- **ENG-A-R (reflect-to-part, the owner's idea):** today `reflectBossBullets` aims every
  reflect at the pose centre (`s.tx = bossX; s.ty = bossY` from the caller's `pose.x, pose.y`).
  ENG-A-R will aim the reflect at the **nearest hittable part, roll-directed** — it rides three
  things ENG-E touches: (a) `partWorldPos` per-part positions (already universal), (b) a
  per-def LIVE part-set with liveness — which is exactly the PART_SYS rows' `live`/`alive`
  hooks + the `lockPartDead` conventions ENG-E extends to a third family, and (c) arrival
  attribution via the preserved `s.part` → `bossDamage.part` chain this seam leans on. Build
  ENG-E's hooks as specified and ENG-A-R needs zero rework here — it swaps the aim target and
  (optionally) stamps `s.part` at reflect time with the CHOSEN part, which the single-ledger
  guard (§2) already tolerates.

---

## 7. Drift & risks (ranked)

1. **The "rib-slam ambers" premise is ahead of the code** (§0 drift): no per-rib ambers exist
   outside ribThread's ~2.9s window; P3's amber is the untagged skull `stream`; `movingGap` has
   no rib coupling. ENG-E's answer is the §4a strain window — the one place this seam adds
   emission rather than plumbing. If the owner wants ENG-E strictly emission-neutral, cut §4a
   and accept that ORGAN BREAK is reachable only in ribThread (honest but nearly dead — ~9
   volleys/fight, and the payoff (a gap in the P3 cage) lands in a phase that then offers no
   rib ambers at all); the spec recommends shipping §4a.
2. **Perfect-only vs any-parry** (the deliberate strictness choice): §5b says only "parry N×";
   panes count ANY reflected arrival (plus half-weight gunfire). Ribs-perfect-only makes the
   debut stricter than its shipped reuse. Chosen because the same bullets' V4 snap is
   owner-ruled perfect-only (two rules on one volley would be incoherent), `snapParts` is
   already perfect-only (any-parry needs a new `reflectBossBullets` return field), and the
   ONEWING counter precedent is perfect-fed. **Owner dial:** if playtest says too strict, add
   an `allParts` (any-parry) return alongside `snapParts` and count those at the same N —
   one-line consumer change, no ledger change. Mitigations already in: N=3 (not 4), the n/3
   progress note, the perfect-heal making perfects rewarding, `?parry` widening for playtest.
3. **Once-per-roll counting:** the whole consumer sits inside `if (!rollParried)` — a player
   holding one long roll through a 4-amber volley banks +1 per rib maximum. Correct (matches
   ghost/stagger/thread grammar) but worth naming: N=3 means three SEPARATE rolls per rib.
   With ~9 ribThread volleys + ~8 strain ticks per closingRibs, a parry-literate player can
   break 1–2 ribs per fight — the intended "sculptor, not demolisher" pace.
4. **Float/timing:** perfect-parry classification is `s.rel <= perfectParryRel` at swat time —
   frame-rate sensitive at 60fps margins; CI must drive through `setDebugPerfectParryRel`
   (shipped for exactly this) and never assert on raw frame counts. The strain amber's
   `rrel > 0.5` guard inherits `emitRibBullets`' behind-plane protection; `aimVelFrom` clamps
   `t ≥ 0.05` so no divide-by-zero at degenerate rel.
5. **Double-ledger hazard** (designed away, verify in review): the reflected rib amber arrives
   with its string tag; without §2's `counter: 'parry'` guard a future rib `hit` hook would
   silently create a second crack path. Test B.5 pins it.
6. **`applyPartBreak` extraction risk:** it must keep the pane/shackle branch byte-equivalent
   (same sfx/burst/shake/note/event/dropLockPart/spray order, same `return 6` consumed as
   `partBonus`). The existing pane/shackle suites are the net; touch nothing else in
   `routePartDamage`.
7. **Model-index coupling:** the canonical index (§3) depends on the `ribPivots` build order
   (`for h { for sx of [-1,1] }`). Carry the canonical index on the `ribPivots` records at
   build time (don't recompute by position later) and assert the name↔index round-trip in the
   model-tier test so a future model reorder fails loudly.
