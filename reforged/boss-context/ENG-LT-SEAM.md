# ENG-LT SEAM — KNELLGRAVE "The Last Toll" rework: the ride-mode toll-wall (un-gating the survival graze) + the survival RESOLVE meter (seal-break-early + bell stagger) + the CLAPPER seam (the one hit that threads the seal)

**Status**: PRE-BUILD spec (Fable checkpoint, 2026-07-10). Design only — no code changed, nothing run.
**Problem row (owner playtest, confirmed in code §1)**: P5 "The Last Toll" (`knellgrave_last`,
survival + the `lastToll` overhead ride) is a ~26–30s window with **no chip** (the `damageBoss`
survival seal), **no graze reward** (the shrinkDisc form is `setpieceT < 0`-gated at both the arm
site and the cluster branch), and **no parry** (the `spiral` tolls emit `reflectable: false`) — a
pure wait-out-the-timer. The intent was a pure-dodge exam; it lands as "fly around aimlessly."
**The rework (owner approved the direction — all three, integrated)**: (1) UN-GATE the ENG-H
toll-wall graze during the survival ride (ride-mode pockets driven off the TOLL CADENCE, because
the shipped `srel/slow` geometry is degenerate overhead); (2) a RESOLVE meter — riding the walls,
parrying the seal-era ambers, and striking the clapper fill it; full = the seal breaks EARLY
(the same `endCard()` hook the outlast path uses) + the bell STAGGERS (the shared `staggerT`
grammar, 4th def-gated consumer); (3) the bound CLAPPER as the seal's one weak point (rider chip,
up close — a scoped carve-out ABOVE the seal check in `damageBoss` that feeds the meter, never hp).
**⚠ This REVERSES a shipped design decision** — ENG-C7 call #4 ("Gated OFF during The Last Toll…
the survival ride stays pure dodge") and the shipped ENG-H purity gate's `lastToll` leg. The
reversal is scoped to knellgrave's survival ride ONLY (every other setpiece, incl. `pendulumSweep`,
stays pocket-free); the outlast path stays untouched (the meter is a SECOND, faster resolution,
never a harder one — §5f "no card ever hard-walls a weaker player" is load-bearing here).
**Laws**: BOSS-DESIGN §5f survival-card grammar ("timeout is the escape hatch"), §5i.B graze laws
(annulus not radius · drawn == paid · richest at the scariest instant · never punishes), §5i.C
law 4 (Surge reflects don't count) & law 6 (never punish declining), the FX-BUDGET/overdraw law
(knellgrave worst-frame audit: ≤2 large additive/fresnel fills; toll rings ≤10% frame fill), §4b
(the clapper is knellgrave's charisma carrier — the strike feedback lives on the existing rig).
**Parent seams**: ENG-H-SEAM.md (the toll flip — SHIPPED at b3692da, #350; this spec edits its
gates), ENG-C7-SEAM.md (the disc engine — SHIPPED; its "Do not touch: the `setpieceT < 0` purity
gates" line is the decision this PR formally reverses, with the owner verdict as authority),
ENG-EW-SEAM.md (the reflect-consumer sibling grammar + `staggerT` reuse — SHIPPED, #344).

Everything below was read from CURRENT master (b3692da) this session, cited by symbol, never by
line number.

---

## 1. DRIFT-CHECK — what is actually live (each feeds a §2–§5 decision)

**The premise, verified verbatim:**
- **The seal**: `damageBoss` (boss.js) — `if (activeCard && activeCard.survival) { model?.flash?.(0.12); sfx.shieldPing?.(); return; }`,
  sitting ABOVE every kind check, so **Surge deflects too** during the seal (this PR keeps that —
  the carve-out is rider-kind only, §4). `lockDeflected()` returns true on
  `activeCard && activeCard.survival`, so lances never fly during the seal (kept).
- **The outlast hatch**: the fight-tick card block — `if (cardTimer <= 0) { if (activeCard.survival) { endCard(); } else { cardExpired = true; … } }`.
  `endCard()` computes `captured = game.bossHitsTakenRun === cardHits0 && !cardExpired`, ledgers
  via `recordBossCard`, nulls `activeCard`, zeroes `cardTimer`. **The early resolution (§3) calls
  this exact hook** — no second resolution path exists or is invented.
- **DRIFT (stale comment, harmless)**: the bossDefs.js card-schema comment says a survival
  "timeout snaps hp past atFrac" — **no hp snap exists in code**, and none is needed: the survival
  card is P5 (the LAST phase) and `breakShield` already parked hp exactly at its `atFrac` floor
  (0.25·hpMax) on entry. Flag for a one-line comment fix in this PR's doc pass; do NOT "implement"
  the snap.
- **Both graze gates**: the `spiral`-branch arm site —
  `if (def?.grazeForm === 'shrinkDisc' && setpieceT < 0 && !shielded && discCd <= 0)` — and the
  cluster branch's `const live = discDur > 0 && setpieceT < 0 && !shielded;` ("holdFlinch's gate
  discipline"). Both gates are edited in §2; nothing else in the disc machinery moves.
- **The tolls are non-reflectable AND untagged**: both spiral emits pass
  `emitBoss(…, -slow, false, null, 1, null, srel)` / `emitBoss(…, -slow)` — `reflectable = false`,
  no `part` tag (signature: `emitBoss(x, y, vx, vy, vrel, reflectable = false, color, sizeMult,
  coreColor, originRel, part = null)`). **But P5 is NOT parry-dead at runtime**: the P5 rhythm
  phrase carries `{ kind: 'sustain', attack: 'aimed', beats: 1 }` and the aimed branch emits
  `reflectable: true` — live amber DOES fly during the seal (the §5i.C amberdiet exemption is
  about the CI gate reading `def.phases[].attacks`, not about runtime emission). The parry return
  then deflects on the seal. **This is the parry feed's carrier (§3c)** — zero new emission.
- **The ride geometry** (`SETPIECE_PATHS.lastToll`): dur 26, `moving: true`, `dread: true`
  (def `setpieces: [{ id: 'pendulumSweep', atPhase: 3, dur: 14, moving: true }, { id: 'lastToll',
  atPhase: 4, dur: 26, moving: true, dread: true }]`). k ∈ [0.22, 0.82] holds
  `{ x: sin·2.2, y: 15.5 ± 0.5, rel: 3 ± 1.5 }` — the overhead ride. `moving: true` ⇒
  `armSetpieceForPhase` leaves the attack/rider clocks live (only `!sp.moving` suppresses), so the
  P5 phrase + the `def.musicDies` toll block (`bellToll(w)`, `model.tollNow`, camera tick,
  `emit('bossToll', { k: w })` on every release) keep firing through the ride. **Card timer 30 vs
  ride dur 26**: the outlast path has a ~4s SEALED STATION TAIL after the ride returns — §2f.

**Why the naive un-gate fails (the overhead srel problem, quantified):**
- `resolveEmitOrigins('spiral', player)` skips any origin with `rel <= 0.5` ("behind/at the plane
  → would fly away"). The bellMouth sits at swingPivot-local `(0, −8.6, 1.2)` → world z-offset
  ≈ 2.1 toward the player (scale 1.75), so during the ride (`pose.rel` 1.5–4.5) the mouth's rel
  ≈ −0.6…2.4 — **sometimes skipped entirely**, falling back to
  `os[0] ?? { …emitOrigin }` where `resolveEmitOrigin` (def.muzzle, same node) has **no rel
  guard** — `srel` can be ≤ 0.5 or negative. Even when resolvable, `srel/slow`
  (slow = `B.bulletSpeed`·0.78 = 21.84) ≈ **0.05–0.2s** → a pocket that dies before one tick, at
  terminal radius 9·dur ≈ 0.5–2u. The ENG-C7/ENG-H specs both pre-flagged this exact degeneracy as
  the reason for the gate. **Decision: ride-mode pockets never read `srel` — they are driven off
  the TOLL CADENCE (§2b), and the honesty identity survives because the wavefront's PLANE-PROJECTED
  lateral radius is `SPIRAL_OUT_SPD·t` regardless of rel** (bullets born at the mouth expand
  laterally at exactly 9 u/s; owner-`boss` bullets live until `rel < −12 || life <= 0`, so the
  drawn ring keeps tracking real bullets even after they cross the player plane).
- **`discCd = 1.6` would strangle the climax**: P5's spiral-to-spiral gaps run ~1.0s inside the
  phrase pair and the rest DECAYS 1.5→0.9 ("the toll accelerates toward the last beat") — a
  kept cd silently drops pockets exactly when the exam is richest. Ride mode neither consults nor
  sets `discCd` (§2c). The ENG-H "do not fix the cd" law is **station/peal-scoped and stays**:
  the peal's `burst count 2 gap 0.1–0.16` lives in P3, never in ride mode.
- **Replace-on-arm is SAFE in ride mode only**: the shipped objection ("would cut pocket #1 short
  and un-draw a still-lethal wavefront") assumed a wall still flying toward the plane. Overhead,
  each toll's plane-crossing spends itself ~`srel/slow` ≈ 0.1s after the toll; by the next toll
  the superseded ring's plane threat is long past. §2c makes the fresh toll supersede the live
  pocket — pockets TIGHTEN as the knell accelerates, escalation for free.

**The machinery being reused (verified live):**
- Disc state: `discAge/discDur`, `discR/discR1` (grows 0 → r1), `discX/discY`,
  `discTollN`, `discCd`, `SPIRAL_OUT_SPD = 9`, `DISC_WALL_FRAC = 0.30`;
  `armDiscPocket(cx, cy, dur, r1)` (one call site, `discR1 = Math.max(r1, 3)`,
  `emit('discPocket', { toll: discTollN, r1 })`); the tick payout `bulletGraze(player)` +
  `emit('discGraze', { r, held, toll })` + `beamTick = Math.max(0.14, (discDur − discAge)·0.30 −
  beamHeld·0.03)` (already keyed on the CLOCK, so it transplants to ride mode unchanged — richest
  as the pocket dies, and in ride mode the pocket dies ON/near the next toll, the scariest
  instant); `beamGrace = 0.3` flick-forgiveness; the `discBandMesh` unit ring
  (`RingGeometry(1 − DISC_WALL_FRAC, 1, 48)`, `AdditiveBlending`, scene-level, drawn at
  `-(player.dist + 4)`, `GRAZE_BAND_BASE 0.4` + `GRAZE_BAND_RAMP` ramp). Resets at four sites:
  `startBossEncounter`, `endEncounter`, `resetBoss`, and the `?bossPhase` jump block — §3d adds
  the resolve vars to the same lines.
- The graze economy: `bulletGraze` (collision.js) → `game.grazeCharge += CONFIG.BOSS.grazeGain
  (0.34)` → whole units into `game.consecutiveRings` (capped at `feverThreshold`). Ride ticks pay
  it unchanged; RESOLVE (§3) is fed BESIDE it, not instead of it.
- `staggerT`: shared window var; consumers are def-gated and mutually exclusive —
  `driveSwarm`'s decay is inside `def.condenseInvuln || grazeForm === 'absorbColor'` (knellgrave
  never enters); the scheduling chain runs `if (shielded) … else if (def.threadCut && staggerT >
  0) … else if (def.holderStagger && staggerT > 0) … else if (chargeT > 0) …` — §3b appends a
  fourth sibling `else if (def.survivalResolve && staggerT > 0)`. `if (shielded)` preceding means
  a shield freezes the window (inherited semantics). `startBossEncounter` already zeroes
  `staggerT` per encounter.
- The damage plumbing: ONE arrival path — bossBullets.js emits
  `emit('bossDamage', { amount, kind: s.owner, x: s.x, y: s.y, part: s.part })` when a boss-ward
  bullet reaches `s.targetRel` within `bossHitRadius (4.2)` of its own `(tx, ty)`; boss.js
  subscribes `on('bossDamage', (e) => damageBoss(e.amount, e.kind, e))`. `x/y` are the ACTUAL
  landing point (the CP2 "gunfire can sculpt a sub-part" law) — the clapper carve-out (§4) tests
  them. `fireRiderShot` aims `lockAimTarget() ?? pose centre` — and **knellgrave declares NO
  `lockParts` and NO `virtualLockOrgan`** (verified: the def has neither; the grep of lock fields
  jumps weftwitch → karnvow), so on knellgrave the rider ALWAYS aims the pose centre
  (`riderShotInterval 0.5`, i.e. ~2 chips/s). Two §4 consequences: (a) the strike verb cannot be
  aim-based — it is PROXIMITY-based (dart under the bell); (b) the V4 snap-paint loop is gated
  `… && def.lockParts` so it NEVER runs for knellgrave — **and must stay that way: the ENG-EW
  guard `(!def.emitOrigins || def.lockParts.some(…))` would TypeError on a `def.emitOrigins` def
  with no `lockParts` if a string-tagged amber ever reached it. Knellgrave HAS `emitOrigins`.
  This PR therefore adds NO part tags to any knellgrave emit** (the spiral is untagged and stays
  untagged; the parry feed reads `r.total`, never `snapParts`).
- `routePartDamage`/`PART_SYS`: rows are `destructiblePanes/destructibleShackles/RIB_SYS` —
  knellgrave carries none, and the clapper is NOT a part death (no crack, no `left:` count, no +6
  chip), so **no PART_SYS row is added**; the carve-out lives in `damageBoss` above the seal (§4),
  the `applyPartBreak` ceremony deliberately does not fit (the ENG-EW `staggerHolder` reasoning,
  verbatim).
- The model (bossKnellgrave.js): `clapperPivot` (bellGroup-local `(0, 1.4, 0.5)`; DROPS to
  y ≈ −0.5 at full dread via `clapperPivot.position.y = 1.4 − dreadK·1.9 − noticeK·1.3 + judder`),
  `clapperHead` (clapperPivot-local `(0, −9.8, 1.05)`) — with `swingPivot` at `PIVOT_Y 9.5` and
  `bellGroup` at `(0, −2.0, 0)`, the head's group-local y at full dread ≈ 9.5 − 2.0 − 0.5 − 9.8 =
  −2.8 → **≈ 4.9u BELOW the pose centre** (scale 1.75), swinging laterally with
  `clapperPivot.rotation.z = lag − swingPivot.rotation.z·0.35`. The mouth (`bellMouth`, world ≈
  pose + (swing·lateral, +1.6, −2.1 rel)) and the head therefore BRACKET the pose centre — the
  §4 radii are sized to this. Both nodes resolve through the generic bossModel.js `buildBoss`
  `partWorldPos` (cached `getObjectByName`; `clapperHead` is asserted named in the model-tier
  test). `hurt(amt)` at > 0.25 seeds `painT` + `ringKick` — **the bell RINGS on a hit, the §4b
  FLINCH carrier: the strike feedback is entirely pre-built, zero new geometry/materials**.
  `setSetpiece(k, sdef)` → `dreadK` (survival reveal) / `sweepK`; `skyOpen = Math.max(skyOpen,
  clamp01((ruinK − 0.5)/0.2)·dreadK)` is driven by the SETPIECE, not the card — **an early
  `endCard()` does not touch the reveal** (the ride keeps running, dreadK keeps peaking; at P5
  `ruinK ≈ 0.75` so the tear reaches full with dreadK). `tollNow → fireRing` (orbiter primary +
  0.14s echo) untouched. `figureMat/headMat` emissive already ramp with `dreadK`
  (`0.07 + lift·0.18 + dreadK·0.42…`) — **the clapper is already LIT during the ride; the "weak
  point glow" costs zero new fills**.
- The FX gate: tests/boss.mjs worst-frame audit walks **`kd.group` only** (shield + charge +
  `setSetpiece(1, {dread:true})` + `setHealth(0.15)` + double `tollNow`; additive/fresnel meshes
  > 10% frame fill; `bigShells.length <= 2`; each `tollRing` ≤ 10%). `discBandMesh` is
  SCENE-level — **invisible to the gate**, exactly as ENG-H §6.5 recorded. This PR adds band
  on-time DURING the fight's busiest frame (dread flood + skyOpen + accelerating double rings +
  candle slit at 2.3× + camera ticks) — the #1 preview risk (§8.1). The band's shape mitigates:
  a 0.7–1.0 ratio annulus at opacity ≤ 0.4+ramp, and ride pockets REPLACE early as the knell
  accelerates, so late-ride radii (the busiest frames) are the SMALLEST.
- The test seams: `debugForceCard(id)` (arms a real def card, returns bool),
  `debugRunSetpiece(id)` (resolves the REAL def entry — `lastToll` dur 26), `debugEmitAttack`
  (drives `executeAttack` + flushes pending; the arm site runs inside it),
  `debugPartWorldPos(part)`, `debugForceFight`, `bossDebugState()` (already returns `discActive/
  discX/discY/discR/discR1/discTollN/discGeom{outSpd,wallFrac}`) — §7's whole plan drives through
  shipped seams plus the two new fields (§3d). The `armKnellgrave()` harness (reset → `forceBoss`
  → `debugForceFight` → 6 settle frames) is copied verbatim from the shipped ENG-H block, and the
  ENG-EW lesson's law applies: **every re-arm calls `boss.resetBoss()` first**.
- **The shipped gate that must be REWRITTEN in place**: the ENG-H "Survival purity" loop drives
  `[['knellgrave_sweep', 'pendulumSweep'], ['knellgrave_last', 'lastToll']]` and asserts NO pocket
  arms during either. The `pendulumSweep` leg is LAW and stays; the `lastToll` leg asserts the
  exact behavior this PR reverses — rewritten to assert the ride pocket ARMS (§7.1). Every other
  knellgrave suite (def-schema 5≡5, geometry, worst-frame, music-death ×2, lifecycle, the ENG-H
  wall/honesty/peal/coexist blocks, rhythmprint KS 0.26, amberdiet) is untouched **by
  construction**: zero phase/card/rhythm/attack edits, zero model edits, zero new geometry.
- **Known non-issue (pre-existing, not ours)**: a parry return during ANY moving setpiece targets
  `(pose.x, pose.y, settleGap 30)` at reflect time (the `reflectBossBullets` call site passes
  `B.settleGap`), so mid-ride returns "arrive" at empty rel 30 and still emit `bossDamage` —
  shipped behavior for every moving setpiece (flankCutIn, ribThread…), consumed here by the seal
  (kind 'player' deflects; §4 counts rider only). Do not fix in this PR.

---

## 2. MECHANIC 1 — RIDE MODE: the toll-wall grazes during The Last Toll

### 2a. The predicate (one helper, four readers)

```js
// §ENG-LT RIDE MODE: the ONE survival ride where the toll-wall graze stays live.
// Triple-gated — the label (grazeForm), the def opt-in (survivalResolve), and the
// setpiece IDENTITY (only knellgrave's def names 'lastToll') — so every other
// setpiece/def, incl. pendulumSweep, keeps the shipped setpieceT<0 purity.
function discRideMode() {
  return !!(def && def.grazeForm === 'shrinkDisc' && def.survivalResolve
    && setpieceT >= 0 && setpieceDef && setpieceDef.id === def.survivalResolve.setpiece);
}
```

Readers: the spiral arm site (§2c), the cluster branch (§2d), `bossDebugState` (§3d), the
one-shot hint (§2e). The def opt-in is §5.

### 2b. The pocket is driven off the TOLL CADENCE, not `srel/slow`

`const RIDE_POCKET_DUR = 1.8;` — engine const beside `SPIRAL_OUT_SPD`. Chosen against the P5
phrase: spiral gaps ~0.95–1.15 inside the pair, ~2.9–3.6 across the aimed+rest seam (rest decays
1.5→0.9). At 1.8s: a pair's second toll REPLACES the live pocket at age ~1.0 (rim ≈ 9 — pockets
tighten as the knell accelerates); across the long seam the pocket dies on its own clock at
terminal radius `9·1.8 = 16.2` and the band breathes dark for ~1–1.7s until the next toll. The
drawn radius `discR = discR1·(discAge/discDur) = 9·age` **IS the true wavefront's plane-projected
lateral radius at every age** (bullets expand laterally at exactly `SPIRAL_OUT_SPD` from the
mouth, invariant of rel) — drawn == wavefront survives overhead as a construction identity, no
radius cap, no lie. Centre: `(scx, scy)` from the shipped origin resolve — the mouth's live world
x/y whether the opted path resolves or the never-whiff fallback fires (both are bellMouth-backed;
only rel differs, and ride mode never reads it). At ride pose the centre sits ≈ (±2–4, ~17) —
in-band; the rim's LOWER arc sweeps the whole flying band as it grows.

**The loop this buys** (the counter-verb): a toll rings → the burst crosses the plane in ~0.1s
in a tight radius under the mouth (the danger is UNDER the bell) → the pink rim pushes outward
from under the bell — ride it out through escalating ticks → the next toll kills-and-re-arms it
at radius 0 back at the mouth → dart back IN (where the clapper hangs, §4) and ride out again.
In-and-out breathing on the accelerating knell — the rhythm exam, made active.

### 2c. The arm site (the `spiral` branch — the only arm-site edit in the PR)

Shipped:

```js
if (def?.grazeForm === 'shrinkDisc' && setpieceT < 0 && !shielded && discCd <= 0) {
  discTollN++;
  discCd = 1.6;
  armDiscPocket(scx, scy, srel / slow, SPIRAL_OUT_SPD * (srel / slow));
}
```

Becomes:

```js
const ride = discRideMode();
if (def?.grazeForm === 'shrinkDisc' && !shielded
    && (ride || (setpieceT < 0 && discCd <= 0))) {
  discTollN++;
  if (ride) {
    // §ENG-LT RIDE MODE: overhead the mouth's rel is degenerate or behind-plane
    // (srel/slow ≈ 0.05–0.2s — the §ENG-C7 gate's own reason), so the pocket rides
    // the TOLL CADENCE: dur = RIDE_POCKET_DUR, r1 = SPIRAL_OUT_SPD·dur. The drawn
    // ring stays the wavefront's PLANE-PROJECTED radius (9·t regardless of rel —
    // the honesty identity survives overhead). REPLACE-ON-ARM: a fresh toll
    // supersedes the live pocket (its plane threat spent ~0.1s after its toll) —
    // pockets tighten as the knell accelerates. discCd is neither consulted nor
    // set (the accelerating knell outruns 1.6s; the peal law is station-scoped).
    armDiscPocket(scx, scy, RIDE_POCKET_DUR, SPIRAL_OUT_SPD * RIDE_POCKET_DUR);
  } else {
    discCd = 1.6;   // §5i.B breather + the Cracked Peal single-arm (§ENG-H — unchanged)
    armDiscPocket(scx, scy, srel / slow, SPIRAL_OUT_SPD * (srel / slow));
  }
}
```

The un-opted/station path is byte-equivalent (`ride` false ⇒ the shipped condition + the shipped
body). `discTollN` keeps counting ride tolls (the `discPocket` emit payload + gate accounting).
`armDiscPocket` itself is untouched — one helper, both modes.

### 2d. The cluster branch (`def.grazeForm === 'shrinkDisc'` in the fight tick)

Two line-edits, nothing else:

```js
const ride = discRideMode();
const live = discDur > 0 && !shielded && (setpieceT < 0 || ride);
```

- The tick payout, the `beamTick` clock formula, `beamGrace`, the band drive, dead-centre-unpaid,
  the last-beat death — ALL unchanged (the clock formula is already time-keyed, so ticks still
  escalate toward the pocket's death = the next toll = the scariest instant; §5i.B holds).
- Inside the paid-tick body, ONE added line feeds the meter (§3a):
  `if (ride && activeCard && activeCard.survival) feedResolve(RESOLVE_GRAZE);`
  — gated on the live seal so post-break riding pays graze only (the meter is spent).
- The `else if (discDur > 0)` kill branch now fires on `shielded` or a NON-ride setpiece rising
  mid-pocket (pendulumSweep purity preserved verbatim); a shield mid-ride still kills the pocket.

### 2e. Edges, decided

- **Ride end (k ≥ 1 → `clearSetpiece`)**: a still-live ride pocket survives into station
  (`setpieceT < 0` satisfies `live`) and dies on its own ≤1.8s clock — honest (it still projects
  its wavefront) and brief. The outlast path's ~4s sealed station tail (card 30 vs ride 26) then
  re-offers NORMAL station pockets through the shipped `setpieceT < 0 && discCd <= 0` gate — the
  reward loop never goes dark while the seal holds.
- **Early seal-break mid-ride**: `discRideMode()` doesn't read the card — ride pockets continue
  through the post-break ride (now with chip landing), feeding graze but not resolve.
- **The one-shot teach** (the `swarmDeflectHinted`/`eyeDeflectHinted` precedent): a per-encounter
  `resolveHinted` flag; on the first frame `ride` is true, `ui.bossNote?.('✦ THE PRISONER STRAINS
  — THE SEAL CAN BREAK ✦', 'RIDE THE TOLL RIMS · STRIKE THE CLAPPER', 'gold', 3.2)`. Placed at the
  top of the cluster branch (where `ride` is already computed). Reset in `startBossEncounter`.

---

## 3. MECHANIC 2 — SURVIVAL RESOLVE: the meter, the early seal-break, the stagger

### 3a. State + the feed (module scope, beside the disc block)

```js
// §ENG-LT SURVIVAL RESOLVE (def.survivalResolve — knellgrave-only): active play
// during the seal fills a meter; full = the seal breaks EARLY + the bell staggers.
// A SECOND resolution, never a harder one: the outlast timer path is untouched.
let resolveK = 0;              // 0..1 across the live survival card
let resolveNoted = 0;          // thirds announced (the visible-progress law, thread-cut CP2 lesson)
let resolveHinted = false;     // one-shot ride teach (§2e)
const RESOLVE_GRAZE  = 0.02;   // per discGraze tick on the ride wall (§2d)
const RESOLVE_PARRY  = 0.10;   // per parried ROLL of the seal-era aimed ambers (§3c)
const RESOLVE_STRIKE = 0.055;  // per scoped clapper strike through the seal (§4)

function feedResolve(amt) {
  if (!def?.survivalResolve || !(activeCard && activeCard.survival) || resolveK >= 1) return;
  resolveK = Math.min(1, resolveK + amt);
  emit('bossResolve', { k: resolveK });
  const third = Math.floor(resolveK * 3);
  if (third > resolveNoted && resolveK < 1) {
    resolveNoted = third;
    ui.bossNote?.(`✦ THE BELL FALTERS — ${third}/3 ✦`, 'RIDE THE TOLLS · STRIKE THE CLAPPER', 'gold', 1.1);
    model.hurt?.(0.3);         // the bell shivers at each third (ringKick — pre-built feedback)
  }
  if (resolveK >= 1) breakSurvivalSeal();
}
```

Economy (worked, so the builder tunes from a baseline, not a guess): pockets arm on ~2 of 3
releases (aimed tolls ring but don't arm); a ridden cycle pays ~5–8 ticks (~0.10–0.16) +
2s darting under the bell ≈ 4 rider chips (~0.22) + a parried roll when the aimed lands (~0.10).
Mixed skilled play fills in ~4–6 toll cycles ≈ **15–22s of the 26s ride** (≈ 60–75% of the 30s
timer); ride-only or strike-only play fills late or not quite — the timer hatch catches both.
Pure outlast: identical to shipped.

### 3b. The break (the payoff beat) + the window branch

```js
function breakSurvivalSeal() {
  // §ENG-LT: resolve the card through the SAME hook the outlast path uses (endCard —
  // capture stays "hitless + timer un-expired", §5f; an early hitless break IS a
  // capture, deliberately: mastery shortens the exam AND banks the card). Then the
  // bell STAGGERS — 2.5s of scheduling silence (the shared staggerT grammar, 4th
  // def-gated consumer) while chip lands again. The ride setpiece keeps running:
  // the reveal is dreadK's (setpiece-driven), not the card's — the payoff window
  // plays out under the gaping, straining bell at rel≈3.
  endCard();
  staggerT = 2.5;
  if (chargeT > 0) { chargeT = 0; model.setCharge(0); model.setAttackTell?.(null); }
  model.hurt?.(1.0); model.flash?.(1.0);          // the bell RINGS its own stagger
  cameraCtl.shake?.(1.2);
  sfx.shieldShatter?.();
  ui.bossNote?.('✦ THE SEAL BREAKS ✦', 'THE BELL STAGGERS — STRIKE', 'gold', 2.4);
  emit('bossSealBreak', { early: true });
}
```

The window consumer — the fourth mutually-exclusive sibling, appended directly after the
`else if (def.holderStagger && staggerT > 0)` branch in the scheduling chain (identical shape;
`if (shielded)` precedes, so a shield freezes rather than double-spends; in-flight bullets and
queued `pending` sub-volleys still land — deleting in-flight is THREAD-CUT's verb, not ours):

```js
} else if (def.survivalResolve && staggerT > 0) {
  // §ENG-LT: the staggered bell schedules nothing for 2.5s — free chip + gun uptime
  // directly under the gaping mouth (rider aims the pose centre at rel≈3; lances
  // re-arm the instant the card nulls — lockDeflected's seal clause released).
  staggerT = Math.max(0, staggerT - dt);
  if (chargeT > 0) { chargeT = 0; model.setCharge(0); model.setAttackTell?.(null); }
}
```

No damage multiplier (no roster stagger is one — the ENG-EW §2e reconciliation, reused verbatim).
The payoff = the card banked early + 2.5s silence + chip resumed with the boss at its closest,
plus the shipped kill-chain from there (P5 floor is 0 → shield → Surge → death; if hp floors
MID-ride the shipped `setpieceT >= 0 && !shielded` else-branch aborts the setpiece cleanly —
"shield rose mid-beat", already handled).

### 3c. The parry feed (the reflect consumer — a 6th def-gated sibling)

Inside the `if (!rollParried)` latch (beside the ribs/holder/scatter/thread-cut blocks, order
irrelevant to them — it touches none of their state):

```js
// §ENG-LT: parrying the seal-era aimed ambers feeds RESOLVE (+1 per ROLL — the
// rollParried latch; perfect not required: the survival exam is dodge-first, parry
// is bonus). Surge reflects don't count (§5i.C law 4). Reads r.total, NEVER
// snapParts — knellgrave ambers are untagged and MUST stay untagged (§1: the V4
// snap-guard TypeErrors on a lockParts-less emitOrigins def; do not tag emits).
if (def.survivalResolve && !surge && activeCard && activeCard.survival && r.total > 0) {
  feedResolve(RESOLVE_PARRY);
}
```

The carrier exists today (§1: P5's live `aimed` phrase) — zero emission changes. The return
still deflects on the seal (unchanged); the ROLL is what pays, which also honors §5i.C law 6
(declining costs nothing — the meter has two other feeds and the timer hatch).

### 3d. Resets + debug surface

- `beginCard(idx)`: after `activeCard` is set — `if (activeCard && activeCard.survival) {
  resolveK = 0; resolveNoted = 0; }` (fresh per arm; covers the live path AND the `?bossPhase`
  jump, which routes through `beginCard`).
- `startBossEncounter`: `resolveK = 0; resolveNoted = 0; resolveHinted = false;` on the
  `staggerT = 0; staggerHits = 0; …` line.
- `endEncounter` + `resetBoss`: `resolveK = 0; resolveNoted = 0;` beside the disc teardown lines.
  (Four sites + beginCard — grep `resolveK` on rebase, the ENG-H lesson's rule.)
- `bossDebugState()`: add `discRide: discRideMode(), resolveK` (the slip/orb/holder field
  precedent). The gate plan drives on both.

UI stays note-based (the FALTERS thirds + the break banner — the holder-stagger n/3 grammar). If
the preview wants a drawn meter, that is a ui.js pass in its OWN PR (§8.3) — this PR ships the
mechanic legible through notes + the pink ramp + the bell's shivers.

---

## 4. MECHANIC 3 — THE CLAPPER SEAM: the one hit that threads the seal

Inserted in `damageBoss` **after the `labPacifist` early-return, BEFORE the survival-seal
check** (the carve-out must win the frame the seal would otherwise eat):

```js
// §ENG-LT THE CLAPPER SEAM (def.survivalResolve.weakPart — knellgrave-only): during
// the survival seal the bound clapper is the ONE thing that answers a hit. Scoped
// FOUR ways so the seal never leaks: (1) only while the seal runs; (2) RIDER chip
// only — 'player' returns stay the parry economy's (§3c, no double-dip), 'surge'
// stays fully sealed (shipped), 'lance' never flies (lockDeflected); (3) the
// LANDING POINT must fall within CLAPPER_HIT_R of the part's live world x/y;
// (4) the PLAYER must be within CLAPPER_NEAR of it — knellgrave has no lockParts/
// virtualLockOrgan (§1) so rider chip always aims the pose centre ~1.6–4.9u off
// the clapper: without (4) the meter would fill from across the arena; with it,
// "dart under the bell, into the toll bursts" is the verb. NO hp moves — the
// fairness hatch stays intact; the strike feeds RESOLVE and the bell RINGS.
if (activeCard && activeCard.survival && def.survivalResolve?.weakPart
    && kind === 'rider' && e && e.x != null && e.y != null && lastPlayer) {
  const w = model?.partWorldPos?.(def.survivalResolve.weakPart, _wpV);
  if (w
      && Math.hypot(e.x - w.x, e.y - w.y) <= CLAPPER_HIT_R
      && Math.hypot(lastPlayer.position.x - w.x, lastPlayer.position.y - w.y) <= CLAPPER_NEAR) {
    model.hurt?.(0.5);                 // the bell RINGS the strike (ringKick + painT — §4b FLINCH)
    bellToll(0.3, 0.35);               // a quiet answering toll — diegetic, unmistakably NOT the deflect ping
    emit('bossClapperHit', {});
    feedResolve(RESOLVE_STRIKE);
    return;                            // consumed — never falls through to the seal's flash/ping
  }
}
```

Constants (beside `RESOLVE_*`): `const CLAPPER_HIT_R = 6.0;` `const CLAPPER_NEAR = 7.0;`
`const _wpV = new THREE.Vector3();` (own scratch — `_muzV` belongs to the emit resolve).

**Why these radii (from §1's measured geometry)**: at full dread the mouth→head assembly spans
pose-centre +1.6 down to −4.9 with the swing wandering both laterally up to ~4u; rider chips LAND
at the pose centre, so `CLAPPER_HIT_R 6.0` (measured about `clapperHead`) covers the pose-centre
landing at every swing phase — the LANDING test is the scope fence (a future pattern landing
elsewhere can't feed), while `CLAPPER_NEAR 7.0` is the actual skill gate: the player must sit in
the toll bursts' birth zone (radius ≈ `9·srel/slow` ≈ 0.5–2u around the mouth, crossing every
1–2.5s) to feed strikes. The lore surface is BOSS-DESIGN's own: the shield already frames "the
WEAK POINT — the bell mouth / clapper"; the strike rings the bell and jolts the prisoner
(`hurt` → ringKick + the strain judder already running at dreadK 1) — the "fly close, do
nothing" beat becomes "dart in, ring the bell off its own captive."

Not done, deliberately: no hp chip (the seal's fairness semantics stay absolute — §5f); no
PART_SYS row / no crack ceremony (nothing dies); no lockParts/aim-anchor additions (would change
rider aim + wake the snap-guard hazard, §1); no new glow mesh (dreadK already lights the figure —
the worst-frame audit re-passes untouched because the model diff is zero).

---

## 5. THE DEF OPT-IN (bossDefs.js, knellgrave only — one key) + doc errata

```js
// §ENG-LT THE LAST TOLL REWORK (owner playtest: the survival exam under-delivered
// as passive). REVERSES the shipped "the survival ride stays pure dodge" gate,
// knellgrave-only: (1) ride-mode toll-wall pockets driven off the TOLL CADENCE
// (the srel/slow geometry is degenerate overhead — §ENG-LT §2); (2) SURVIVAL
// RESOLVE — riding the rims, parrying the seal-era aimed ambers, and striking the
// clapper fill a meter that breaks the seal EARLY + staggers the bell (a second,
// FASTER resolution; outlasting the timer still succeeds untouched); (3) the bound
// clapper is the seal's one weak point (rider chip, up close — no hp, feeds the
// meter). setpiece: which SETPIECE_PATHS id the ride-mode graze binds to;
// weakPart: the partWorldPos node the seal-era carve-out tests.
survivalResolve: { setpiece: 'lastToll', weakPart: 'clapperHead' },
```

Every other def byte-identical. Zero phase/card/rhythm/attack/setpiece edits — rhythmprint,
amberdiet, def-schema, emission-budget inputs untouched by construction.

**Doc pass (same PR, small)**: (a) the stale "timeout snaps hp past atFrac" schema comment
(§1); (b) the def's `setpieces` comment ("a pure-dodge exam — the card's seal deflects all
damage") gains the rework clause; (c) BOSS-DESIGN one-line erratas: §5d slot-10 GRAZE FORM
("offered once per phase" → "+ rides The Last Toll on the toll cadence"), §5f survival-card
bullet (slot 10 = "outlast OR resolve — the seal can be broken early by active play; the timeout
hatch is untouched"), §5i.C's "for a dodge-only player…" framing where it names slot 10. (d) The
builder's PR adds its own `leapfrog/lessons/` file (THE RULE §2) — this spec is not that lesson.

---

## 6. COEXIST / REGRESSION — what may not move, and how it's held

1. **Every other boss byte-identical.** Engine edits are: the arm-site condition (collapses to
   shipped when `ride` false — and `ride` requires `grazeForm === 'shrinkDisc'` + `def.
   survivalResolve` + `setpieceDef.id === def.survivalResolve.setpiece`: knellgrave is the only
   `shrinkDisc` carrier AND the only `survivalResolve` carrier AND the only def naming
   `lastToll`); the cluster `live` line (same predicate); `feedResolve`/`breakSurvivalSeal`
   (def-gated at entry); the reflect-consumer sibling (def-gated); the scheduling-chain sibling
   (def-gated, appended after holderStagger — thrumswarm/weftwitch/eitherwing branches
   unreachable for knellgrave and vice versa); the `damageBoss` carve-out (def-gated +
   survival-card-gated + kind-gated). EMBERTIDE — the roster's OTHER survival card
   (`embertide_horizonbreak`) — carries no `survivalResolve` and no `shrinkDisc`: its seal
   deflect, crestfall override, and horizon pocket are byte-identical (§7.6 asserts it).
2. **`pendulumSweep` stays pure.** `discRideMode()` is id-gated to `lastToll`; a sweep rising
   mid-pocket still kills it (§2d); the shipped sweep purity assert re-passes unchanged (§7.1).
3. **Knellgrave's own P1–P3 station game untouched**: the station arm path (incl. `discCd 1.6`
   and the peal single-arm law) is the shipped bytes; the ENG-H wall/honesty/rim/peal/iris-inert/
   stormrend-coexist gate blocks re-pass untouched.
4. **The outlast hatch untouched**: the card-timeout branch is not edited; a player who never
   feeds the meter gets the shipped fight verbatim (§7.5 asserts the timer path still resolves).
5. **The reveal untouched**: `skyOpen`/`dreadK` are setpiece-driven; early `endCard()` doesn't
   touch `setSetpiece` inputs. The dread model suites (crack-gape, sky-tear ratchet, shed plates
   under the frozen seal) re-pass byte-identically — zero model edits.
6. **Worst-frame/tricount/tiershots**: zero model geometry/material changes; the audit re-passes
   untouched. The scene-level band's added on-time during the dread frame is gate-invisible
   (§1) — named preview item §8.1, with the ride-band opacity multiplier as the standing dial.
7. **Music-death / lifecycle**: zero lines near `musicKill`/`musicRestore`/the toll block. The
   full-roster lifecycle sim neither parries nor rides pockets nor darts under the bell — it
   outlasts on the shipped timer path, which is untouched.
8. **The lance layer**: `lockDeflected()` untouched (seal clause intact); knellgrave still
   declares no lock surface; no tags added anywhere (§1's TypeError fence).

---

## 7. GATE PLAN (tests/boss.mjs — extend the §ENG-H block's `armKnellgrave` harness; every
re-arm through `boss.resetBoss()` first, the ENG-EW lesson)

1. **The purity twin SPLITS (the deliberate reversal, rewritten in place).** The shipped loop
   over `[['knellgrave_sweep','pendulumSweep'], ['knellgrave_last','lastToll']]` becomes:
   - sweep leg (LAW, kept verbatim): `debugForceCard('knellgrave_sweep')` +
     `debugRunSetpiece('pendulumSweep')` + `debugEmitAttack('spiral')` → NO `discPocket`,
     `discActive === false`.
   - lastToll leg (REWRITTEN): `debugForceCard('knellgrave_last')` +
     `debugRunSetpiece('lastToll')` + `debugEmitAttack('spiral')` → `discPocket` FIRES;
     `bossDebugState()`: `discRide === true`, `discR1 === discGeom.outSpd * 1.8 ± 1e-6`
     (RIDE_POCKET_DUR, srel-free), centre within the mouth's envelope
     (`|discX| ≤ 8`, `discY` ∈ [12, 22]); the wall GROWS and dies by ~1.8s parked dead-centre.
2. **Replace-on-arm + no-cd in ride mode**: two `debugEmitAttack('spiral')` Δt < 1.6s during the
   ride → TWO `discPocket` emits (`toll` 1 then 2 — the station single-arm inverts here, by
   design); the second arm resets `discAge` (radius restarts ~0). Station twin (no setpiece):
   the shipped peal assert (exactly ONE pocket inside 1.6s) re-passes untouched.
3. **The ride rim pays + feeds**: during the ride, park on the lower rim per frame
   (`discY − discR·(1 − wallFrac/2)`, the shipped idiom): `discGraze` ticks > 0, last inter-tick
   gap < first, `game.grazeCharge + consecutiveRings` grows, AND `bossDebugState().resolveK`
   grows; `game.health` untouched (the form never punishes). Dead-centre + outside: zero ticks,
   zero resolve.
4. **The meter breaks the seal early + staggers**: with the card live, drive `resolveK` to 1
   (loop scoped clapper strikes via `emit('bossDamage', { amount: 2, kind: 'rider', x, y })` at
   `debugPartWorldPos('clapperHead')` with the player parked beside it — deterministic, no
   bullet flight): `bossSealBreak` fires once; `activeCard` is null before the timer ran;
   `bossCard` resolved with `captured: true` (hitless run); a follow-up
   `damageBoss(10, 'rider')`-shaped event now CHIPS hp; for ~2.5s no new `chargeT` arms
   (scheduling silence), then scheduling resumes; `resolveK` stays 1/feeds stop (no re-break).
5. **The fairness hatch intact**: fresh arm, never feed — tick the card timer past 30 →
   `endCard` resolves via the timeout branch exactly as shipped (bossCard fires, seal releases,
   `bossSealBreak` NEVER fires).
6. **The carve-out is scoped (the seal never leaks)**: during the seal —
   (a) a rider-kind landing at `clapperHead` with the player FAR (> CLAPPER_NEAR): hp unchanged,
   resolve unchanged (the deflect ate it); (b) a rider-kind landing at the pose centre with the
   player far: same; (c) a rider-kind landing at the clapper with the player NEAR: hp unchanged,
   `resolveK` +RESOLVE_STRIKE, `bossClapperHit` fired; (d) kind 'surge' at the clapper, player
   near: fully deflected (no feed); (e) a parried roll of a live P5 aimed amber (the ENG-E
   harness shape: spawn amber → `rollInvuln` pulse → `updateBoss`): +RESOLVE_PARRY once per roll,
   and with `surge` forced: zero.
7. **Coexist**: EMBERTIDE + `debugForceCard('embertide_horizonbreak')` — landing-point hits at
   any node deflect with zero resolve state (no `survivalResolve`); voidmaw/stormrend: parried
   rolls feed nothing, `bossDebugState().resolveK === 0`, `discRide === false` everywhere;
   stormrend spiral still opens no pocket (shipped assert, untouched).
8. **What must stay green with zero edits**: def-schema (5≡5, dread LAST), the knellgrave
   geometry/worst-frame/music-death ×2/lifecycle suites, the ENG-H wall-growth/honesty/rim/peal/
   iris-inert/coexist asserts, the ENG-B/ENG-EW/ENG-E suites, laneSafe + emission budgets,
   `bossboot`; rhythmprint + amberdiet re-run and QUOTED (inputs byte-identical — any movement
   means a def byte leaked). Known pre-existing flakes (embertide `setEntrance`, karnvow
   footwork, `bossrushui` stage-jump, bossgate palette on complex models) remain not-ours.

---

## 8. RISKS / TUNABLES for the preview (this reverses a shipped decision AND touches the
fight's busiest frame — what the human must judge)

1. **The band on the fight's worst frame (the #1 risk).** The ride draws the surge-pink annulus
   during the dread reveal — candle flood + skyOpen tear + double toll rings + camera ticks —
   and the worst-frame gate cannot see a scene-level mesh (§1). Headless proves the wall
   FUNCTIONS; only the preview proves the frame doesn't tip the overdraw cliff on weak mobile or
   drown the reveal (the fight's second "holy shit" must stay the PRISONER, not the pink). Dials
   in order: a ride-only band opacity multiplier (×0.7 on `GRAZE_BAND_BASE/RAMP`, one line in
   the band drive), `RIDE_POCKET_DUR` 1.8 → 1.4 (smaller terminal rings), band base opacity
   global. Never dial: the annulus law, drawn == wavefront-projection (no radius cap), the
   last-beat death, the sweep purity gate.
2. **The exam's difficulty identity (the design reversal itself).** The owner approved activating
   the exam — but the ride must still READ as a survival dread card, not a farm. If the preview
   feels farmy: RESOLVE_* down (grazes 0.02→0.015, strikes 0.055→0.04), or drop the parry feed
   (the one OPTIONAL feed — delete one block). If it feels unreachable: strikes up, or
   CLAPPER_NEAR 7→9. Judge the target: mixed skilled play breaking at ~60–75% of the timer,
   pure dodge unchanged. Never dial: the outlast hatch, the seal's hp semantics (the clapper
   never chips), Surge staying sealed.
3. **Legibility of the meter + the strike.** Notes + bell-shivers + the answering `bellToll(0.3)`
   must make the loop teachable in one attempt (the hint fires once). If the preview says the
   meter is invisible: a thin resolve bar under the card timer is a ui.js follow-up PR (named,
   not shipped here). If the strike feedback reads as a deflect: raise the answering toll's
   weight/volume (one line) — never reuse `sfx.shieldPing` for the strike (the deflect owns it).
4. **The stagger beat's weight.** 2.5s silence + `hurt(1.0)` + shake may read thin for "the
   payoff beat" under a bell already at full dread spectacle. Dials: `staggerT` 2.5→3.0, a
   second `model.hurt` pulse mid-window. Never: a damage multiplier (no roster stagger is one),
   `skyOpen`/dreadK coupling (the reveal is the setpiece's).

**Plan-vs-code drift flagged upward**: (i) the brief's "~26s" conflates the ride (26) with the
seal (timer 30) — the design handles the 4s sealed station tail explicitly (§2e); (ii) the
bossDefs schema comment's phantom "hp snap" on survival timeout (§1 — stale, fix the comment);
(iii) the brief's "the meter fills and breaks the seal early + staggers the bell — cite the
hook": the hook is `endCard()` (the outlast path's own), plus `staggerT = 2.5` as the 4th
def-gated consumer — a distinct "seal break state" was considered and REJECTED (a second
resolution enum would fork capture/ledger semantics `endCard` already owns); (iv) the
`eyeWeakPoint`/`setEyeUp` submerge-window precedent the brief offered does NOT fit mechanic 3
(it gates WHEN general chip lands via a model window; the clapper needs WHERE + WHO-kind through
an absolute seal) — the shape used instead is a scoped pre-seal carve-out in `damageBoss`, the
same altitude as the riposte/condense/eye blocks already stacked there; (v) knellgrave's missing
lock surface (no `lockParts`/`virtualLockOrgan`) makes rider aim centre-locked — the strike verb
is therefore proximity-gated, and emit-tagging is FORBIDDEN this PR (the ENG-EW snap-guard
TypeError fence, §1).

---

## 9. VERDICT + GIT-STATUS SANITY

**GO-WITH-CORRECTIONS** — buildable first-time from this spec + the cited code, with the
corrections this drift-check already folded in (they are the spec, not open items): ride pockets
must be cadence-driven (never `srel/slow` — degenerate/behind-plane overhead), `discCd` must be
bypassed in ride mode (1.6 > the climax gaps), replace-on-arm is ride-only (the station peal law
stays), the strike verb must be player-proximity-gated (centre-locked rider aim), rider-kind
only (no parry double-dip, Surge stays sealed), and no emit tags on knellgrave (the snap-guard
fence). The two judgment calls a builder must NOT re-open without the owner: the reversal itself
(owner-approved) and early-break-counts-as-capture (§3b, deliberate). The one genuinely
preview-owned unknown is §8.1 (band vs the dread frame) — shippable behind its named dials.

**Git-status sanity**: this checkpoint **created exactly one new file** —
`reforged/boss-context/ENG-LT-SEAM.md` (this spec). No source file, def, test, tool, or doc was
modified; no test, build, or game process was run. The working tree was CLEAN at master
b3692da (#350 ENG-H merged, #344 ENG-EW merged) before this file; `git status` shows only this
untracked spec. Every symbol cited above was read from that tree this session: boss.js
(`damageBoss` + the seal/riposte/condense/eye/part-routing stack, `lockDeflected`,
`beginCard`/`endCard`/`cardHits0`/`cardExpired`/the card-timeout branch, `SETPIECE_PATHS.
lastToll/pendulumSweep`, `setpieceForPhase`/`armSetpieceForPhase`/`clearSetpiece`/the setpiece
runner/`debugRunSetpiece`, the `spiral` branch + `resolveEmitOrigin`/`resolveEmitOrigins`
(the `rel <= 0.5` skip + never-whiff fallback), `armDiscPocket` + the shrinkDisc cluster branch +
`discCd`/`discTollN`/`discR1`/`SPIRAL_OUT_SPD`/`DISC_WALL_FRAC`/`beamTick`/`beamGrace`/
`discBandMesh`/`GRAZE_BAND_*`, `staggerT` + `driveSwarm` + the threadCut/holderStagger window
branches + the reflect consumer (`rollParried`/`r.total`/`snapParts`/the V4 snap-guard),
`RIB_BREAK_PARRIES`/`partParries`/`PART_SYS`/`routePartDamage`/`applyPartBreak`,
`fireRiderShot`/`lockCandidates`, the `def.musicDies` toll block + `bellToll`, `breakShield`/
`startBossEncounter`/`endEncounter`/`resetBoss`/the `?bossPhase` block resets,
`debugForceCard`/`debugForceFight`/`debugEmitAttack`/`debugPartWorldPos`/`bossDebugState`),
bossBullets.js (`emitBoss`'s signature, the `bossDamage` arrival emit + `bossHitRadius`, boss
bullet lifetime `rel < −12`, `reflectBossBullets`'s target pick + `settleGap` call site),
collision.js (`bulletGraze`/`grazeCharge`/`consecutiveRings`), bossKnellgrave.js (`swingPivot`/
`PIVOT_Y`/`bellGroup`/`clapperPivot`/`clapperHead`/`bellMouth`/`setSetpiece`/`dreadK`/`sweepK`/
`ruinK`/`skyOpen`/`ampTarget`/`hurt`/`tollNow`/`fireRing`/the material dread ramps/the handle
export), bossModel.js (`buildBoss`'s generic `partWorldPos`), bossDefs.js (the full knellgrave
def + the lock-field roster grep), config.js (`bossHitRadius`/`grazeGain`/`riderShotInterval`/
`bulletSpeed`), tests/boss.mjs (the knellgrave model-tier/worst-frame audit/music-death blocks,
the §ENG-H `armKnellgrave` wall/honesty/rim/peal/purity/iris/coexist asserts), BOSS-DESIGN.md
(§5d slot-10 sheet + FX-BUDGET law, §5f card/survival grammar, §5i.B/§5i.C), ENG-H-SEAM.md,
ENG-EW-SEAM.md, ENG-C7/ENG-H/ENG-EW ledger lessons. Drift found this pass: the stale hp-snap
schema comment, the `rel <= 0.5` origin skip vs the ride's fallback, the cd-vs-climax-gap
collision, the centre-locked rider aim (no lock surface), the snap-guard TypeError fence, the
timer-vs-ride 4s tail, and the purity gate's lastToll leg as a shipped assert that must be
rewritten — each resolved in §1–§7 above.
