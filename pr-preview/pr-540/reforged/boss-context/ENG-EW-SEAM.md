# ENG-EW SEAM — EITHERWING holder-stagger + midpoint-iris (the rest of §C.4 / E-queue row 9)

**Status**: PRE-BUILD spec (Fable checkpoint, 2026-07-10). Design only — no code changed, nothing run.
**Plan rows**: ATTACK-REWORK-PLAN §C.4 parry job, verbatim: *"parry the holder's amber volley 3×
mid-possession → the handoff STAGGERS, the eye DROPS to the thread midpoint for a 2.5s bonus-damage
window"* (= BOSS-DESIGN §5b slot-5 row, word for word; §5i.C ladder: ORGAN BREAK *"reused at 5 on
the eye-holder"*). Plus the §C.4 dread row's `iris` clause: *"`iris` centred on the thread midpoint
between them"*. §E.1 row 9's third leg ("ENG-E (holder stagger)") — the two pieces the SHIPPED
ENG-C4 seam (§6/§7 there) explicitly deferred to this PR.
**Parent ledgers**: ENG-E-SEAM.md (the `partParries` parry ledger — SHIPPED on MARROWCOIL);
ENG-C4-SEAM.md (`orbitAnnulus` — SHIPPED); ENG-B (`resolveGapAnchor` + the iris `gax` read — SHIPPED).
Nothing here invents machinery those three didn't already prove.

Everything below was read from CURRENT master this session, cited by symbol, never by line number.

---

## 1. DRIFT-CHECK — what is already live (verified by symbol)

- **The ledger is waiting for us by name.** boss.js `partParries` comment, verbatim: *"Generic for
  later reuses (C.4 holder, C.6 gems)"*; `RIB_BREAK_PARRIES = 3` comment: *"the roster's canonical 3
  (panes/stagger/holder)"*. The reflect consumer (inside `if (player.rollInvuln > 0) { const r =
  reflectBossBullets(…) … if (!rollParried) { … } }`) already stacks FOUR def-gated sibling blocks in
  this order: ORGAN BREAK (`def.destructibleRibs`), V4 snap-paint (`def.lockParts`), SCATTER-STAGGER
  (`def.condenseInvuln` → `staggerHits >= 3 → staggerT = 2.5` + `emit('bossStagger')`), THREAD-CUT
  (`def.threadCut`), GHOST-HALF (`def.ghostHalf`). The holder block is a fifth sibling.
- **`staggerT` is a SHARED, multi-consumer window var**: declared once ("`>0` = the queen is
  STAGGERED"), armed by both thrumswarm (`staggerHits >= 3`) and weftwitch (`triggerThreadCut`), and
  consumed per-def — `driveSwarm` (locked condensed) vs the fight-tick scheduling chain's
  `else if (def.threadCut && staggerT > 0)` branch (decay + `chargeT = 0; model.setCharge(0);
  model.setAttackTell?.(null)` — the loom stilled). One boss at a time ⇒ no collision. The eitherwing
  window is a third def-gated consumer of the SAME var, same chain.
- **⚠ THE LOAD-BEARING DRIFT — the holder's ambers carry NO source tag today.** `emitBoss(x, y, vx,
  vy, vrel, reflectable, color, sizeMult, coreColor, originRel, part = null)` has the trailing `part`
  param, and `emitRibBullets`/`emitRibStrain`/`emitGhostHalf` all pass one — but every
  `resolveEmitOrigins`-driven emit (the `aimed`, `stream`, and `crossfire` opted paths) calls
  `emitBoss(o.x, o.y, …, o.rel)` and STOPS at `o.rel`. `resolveEmitOrigins` itself returns only
  `{ x, y, rel }` (its sibling `resolveReflectTargets` already returns `part: name` — the in-file
  precedent). So "parry the holder's amber" is currently unattributable: `r.snapParts` is empty of
  eitherwing strings. **Tagging is the first half of this PR** (§2a).
- **The plan wording "Parry job (allocated, now shipped)" in §C.4 is a drift**: "shipped" is true of
  the ALLOCATION (the §5b slot table + the eitherMuzzle origin plumbing), not the mechanic — no
  `holderStagger` consumer, no eye-drop API, no holder tag exists anywhere in boss.js /
  bossEitherwing.js / bossDefs.js (grepped). §E.1 row 9 + the ENG-C4/holder-volley lessons agree:
  deferred, i.e. THIS spec.
- **The model has possession state but no read API and no drop beat.** bossEitherwing.js:
  `holdT` (0 = A holds, 1 = B holds), `holdTarget`, `handoffTimer` (flips `holdTarget` when
  `charge <= 0.15 && handoffTimer <= 0 && moving`, re-arms `2.4 + Math.random() * 1.2`), `debugHold`
  (pinned via the exported `setDebugHandoff`), and the seat math `eyeF = 0.1 + holdT * 0.8` →
  `_eye.copy(_sa).lerp(_sb, eyeF)` + `glideLift`. The returned handle exposes `eyeWorldLocalPos /
  twinSeparation / threadLength / setDebugHandoff / twinBodyLum` — **no holder getter, no drop**.
  Both must be added (§3). The handoff chain order matters: `entranceU` → `debugHold` →
  `charge > 0.15` (pin) → timer flip; the drop guard inserts AFTER `debugHold` so tests keep control.
- **The thread midpoint is already computed every tick and not exposed**: `const mid =
  _sa.clone().lerp(_sb, 0.5)` (the ember-motes anchor). `partWorldPos` is attached GENERICALLY in
  bossModel.js `buildBoss` (cached `getObjectByName` — *"a boss that names nothing stays
  byte-unchanged"*), so ONE named empty at `mid` makes the midpoint def-addressable (§4).
- **`iris` is ALREADY in eitherwing's P3** — def `phases[2].attacks: ['crossfire', 'movingGap',
  'iris']` and the rhythm P3 phrase carries `{ attack: 'iris' }`. The midpoint-iris is therefore a
  pure `gapAnchor` opt-in: **zero phase/card/rhythm/attack-set change, rhythmprint + amberdiet inputs
  byte-identical, no B-4 multiset re-scan** (the plan's §E.3 "P3 set changes" warning was for the
  full C.4, whose set change already shipped).
- **The iris branch is gapAnchor-ready** (shipped ENG-B): `const gax = resolveGapAnchor('iris');
  const cx = gax != null ? Math.max(-8, Math.min(8, gax)) : anchorX, cy = B.fightHeight;` — resolved
  **ONCE per volley** (*"not per-ring … so the volley's rings stay concentric"*), clamped ±8, and
  `anchorX = Math.max(-8, Math.min(8, player.position.x * 0.7))` — i.e. today eitherwing's dread iris
  centres on the PLAYER. `resolveGapAnchor` supports `{ part }` via `model.partWorldPos` with the
  null → shipped-placement fallback. **No new resolve path is needed** (§4).
- **The V4 snap-paint hazard (found this session, must be designed away).** lockLayer.js
  `paintFromParry(part)` accepts ANY non-empty string (its only guards: `typeof part === 'string'`,
  fight running, cap, deflected, dedupe) — it does NOT check `def.lockParts` membership. The snap
  loop's guard is `typeof tag === 'string' && !lockPartDead(tag)`, and `lockPartDead` only knows
  panes/shackles/ribs → returns false for `'eitherMuzzle'`/`'eitherTwinA'`/`'eitherTwinB'`. Eitherwing
  HAS `lockParts` (`eyeRig`/`seekerFin`/`seekerScar`) so its snap loop RUNS — the moment holder ambers
  carry tags, a perfect parry would lance-brand the muzzle/twin bodies, violating the def's own law
  (*"The twins' dart BODIES are never lockable (LAW §II.9)"*). §2c ships the one-line guard. (ONEWING
  is safe today only because it declares NO `lockParts`, so its whole snap block is skipped —
  `'frameGroup'` never reaches `paintFromParry`.)
- **P3 reachability**: eitherwing's `emitOrigins` = `{ crossfire: ['eitherTwinA','eitherTwinB'],
  aimed: ['eitherMuzzle'], stream: ['eitherMuzzle'] }`, but `aimed` lives only in P1 and `stream`
  only in P2 — **P3 (the dread, where the stagger pays most) has NO eitherMuzzle carrier**. The
  ENG-E precedent (the strain-amber reachability fix) applies, but here it costs ZERO new emission:
  count the HOLDER TWIN's half of `crossfire` too (§2b). The seeker's half never counts — the §5f
  duo-law "parry the LIT side" read.

---

## 2. PIECE 1 — HOLDER-STAGGER (boss.js)

### 2a. Tag the opted emits (the missing attribution)

`resolveEmitOrigins` gains `part: name` in its pushed record (copy the field from
`resolveReflectTargets`, which already does exactly this); the three opted emit sites append the tag:

- `aimed` opted loop: `emitBoss(o.x, o.y, v.vx, v.vy, -closing, true, null, 1, null, o.rel, o.part)`
- `stream` opted per-tick loop: same append (`…, o.rel, o.part`)
- `crossfire` opted loop: `emitBoss(o.x, o.y, …, -slow, true, null, 1, null, o.rel, o.part)`

Tags that result: `crossfire` ambers carry `'eitherTwinA'`/`'eitherTwinB'`; `aimed`/`stream` ambers
carry `'eitherMuzzle'` (the holder's node by construction — `muzzle.position.set(holderPos…)` follows
`aHolds` every tick). The un-opted else-branches are untouched (`emitOrigins` is eitherwing-only
across bossDefs.js, verified by grep — every other boss's bullets stay tagless, byte-identical).
The tag survives the parry and the arrival unchanged (`reflectBossBullets` flips owner, never
`s.part`; dedupes perfect tags into `snapParts` — the ENG-E-proven chain). No `amberVent` entries:
these names are not dwell-paintable organs.

**Arrival-side inertness (the single-ledger law, already satisfied)**: a reflected holder amber
arrives as `bossDamage` with a string `part`; `routePartDamage` skips it — `typeof e.part ===
'number' ? e.part : -1`, then every `PART_SYS` row fails `if (!def?.[sys.flag] || …) continue`
(eitherwing carries no destructible flag). **No PART_SYS row is added** — the stagger is a timer,
not a part death, so there is nothing for the shot ledger to own.

### 2b. The ledger block (fifth sibling in the reflect consumer)

Module state, beside `RIB_BREAK_PARRIES`/`partParries`:

```js
const HOLDER_STAGGER_PARRIES = 3;    // §5b slot 5 verbatim "3× mid-possession" — the canonical 3
const HOLDER_KEY = 'eitherHolder';   // the partParries key (synthetic — the possession, not a node)
let holderPrevTarget = null;         // last seen holdTarget — a flip = the baton passed (the reset edge)
```

The block — inserted inside `if (!rollParried)`, directly **below the ORGAN BREAK block and above the
V4 snap-paint loop** (the same slot ENG-E claimed, same reasons — consume before paint):

```js
// §5i.C ORGAN-BREAK REUSE (EITHERWING, §5b slot 5): a PERFECT parry of the HOLDER's
// amber — the eitherMuzzle volley (aimed/stream) or the holder twin's half of the
// crossfire — banks toward the stagger; at 3 mid-possession the handoff STAGGERS and
// the eye DROPS to the thread midpoint (a 2.5s strike window). The bank dies with the
// baton (§2d). Surge reflects don't count (§5i.C law 4). Def-gated; inert otherwise.
if (def.holderStagger && !surge && staggerT <= 0 && r.snapParts.length && model.holdState) {
  const holderName = model.holdState().target < 0.5 ? 'eitherTwinA' : 'eitherTwinB';
  if (r.snapParts.includes('eitherMuzzle') || r.snapParts.includes(holderName)) {
    const n = (partParries.get(HOLDER_KEY) ?? 0) + 1;
    partParries.set(HOLDER_KEY, n);
    if (n >= HOLDER_STAGGER_PARRIES) staggerHolder(player);
    else {
      model.hurt?.(0.4);   // the eitherwing hurt(): the HOLDER recoils, the seeker darts protectively
      ui.bossNote?.(`✦ THE HOLDER FALTERS — ${n}/${HOLDER_STAGGER_PARRIES} ✦`, 'PARRY ITS VOLLEY AGAIN', 'gold', 1.1);
    }
  }
}
```

Grammar notes, each from a shipped precedent: +1 per ROLL, not per bullet (`snapParts` deduped per
burst, the whole consumer latched by `rollParried` — the ENG-E "+1 per rib per roll" rule; the
`includes(…) || includes(…)` collapses a mixed muzzle+twin burst to +1). **Perfect-only** by
construction (`snapParts` is perfect-only) — the same owner-ruled strictness ENG-E chose, on the
same reasoning (the V4 snap on these very bullets is perfect-only); the any-parry softening is the
identical one-line dial ENG-E documented. `staggerT <= 0` stops banking DURING the window (no
chained re-stagger off the dropped eye's leftover ambers). `model.hurt?.(0.4)` is anatomically
perfect here: bossEitherwing `hurt(amt)` sets `painTwin = holdT < 0.5 ? 0 : 1` — the holder recoils.

### 2c. The snap-paint guard (the hazard fix, one line, provably behavior-preserving)

In the V4 snap loop, the paint condition gains a membership check scoped to emit-tagged defs:

```js
if (typeof tag === 'string' && !lockPartDead(tag) &&
    (!def.emitOrigins || def.lockParts.some((lp) => lp.part === tag))) paintFromParry(tag);
```

Proof of preservation: defs WITHOUT `emitOrigins` short-circuit to shipped behavior (marrowcoil's
rib tags, hollowgate's bridged `rosePane` tags, karnvow — all unchanged); the ONLY `emitOrigins` def
is eitherwing, whose ambers carry no tags today (nothing to change) and whose new tags
(`eitherMuzzle`/`eitherTwinA`/`eitherTwinB`) are exactly what must never paint. Its real lockParts
(`eyeRig`/`seekerFin`/`seekerScar`) never appear as bullet tags, so nothing it could paint is lost.
(Do NOT widen the guard to all defs in this PR — whether a non-lockPart pane's parry may paint is
hollowgate's own question, not ours.)

### 2d. Mid-possession = the bank dies with the baton (the reset edge)

In the fight tick's per-def model-drive region — beside the `def.eyeWeakPoint`/`model.setEyeUp`
block (the shipped precedent for exactly this kind of def-gated per-frame model read):

```js
// §5b slot 5 "mid-possession": the banked parries belong to THIS possession — a baton
// pass (holdTarget flip) clears them. Flips only happen at charge<=0.15 rests (the eye
// PINS to the firer during a wind-up), so a mid-volley bank is never eaten.
if (def.holderStagger && model.holdState) {
  const t = model.holdState().target;
  if (holderPrevTarget != null && t !== holderPrevTarget && (partParries.get(HOLDER_KEY) ?? 0) > 0) {
    partParries.delete(HOLDER_KEY);
    ui.bossNote?.('THE EYE PASSES — THE COUNT FADES', '', 'gold', 0.9);   // the reset is SEEN (thread-cut CP2 lesson)
  }
  holderPrevTarget = t;
}
```

`'eitherMuzzle'`-tagged ambers count toward whichever possession the parry lands in (the muzzle IS
the current holder); only crossfire needs the `holderName` read. Attribution lag (fired by A, parried
after a flip to B) is bounded by the charge pin and named as a tunable (§7).

### 2e. The stagger + the window (`staggerHolder`, the swarm grammar — NOT `applyPartBreak`)

`applyPartBreak` deliberately does NOT fit and is not touched: it is a part-DEATH ceremony
(`model[sys.crack]`, `dropLockPart(sys.lockName(idx))`, a `left:` live-count event, the +6 chip) —
the stagger kills no part, drops no brand, has no index. The fit is SCATTER-STAGGER's shape:

```js
function staggerHolder(player) {
  partParries.delete(HOLDER_KEY);
  staggerT = 2.5;                                  // the shared window var (thrumswarm/weftwitch precedent)
  model.dropEye?.(2.5);                            // the model beat (§3): the eye UNSEATS and falls to the thread midpoint
  if (chargeT > 0) { chargeT = 0; model.setCharge(0); model.setAttackTell?.(null); }   // the wind-up dies with the drop
  ui.bossNote?.('✦ THE HANDOFF STAGGERS ✦', 'THE EYE DROPS — STRIKE IT', 'gold', 2.4);
  sfx.milestone?.(); cameraCtl.shake?.(0.8); model.hurt?.(0.6);
  emit('bossEyeDrop', {});
}
```

The window consumer — a sibling branch in the scheduling chain, appended directly after
`else if (def.threadCut && staggerT > 0)` (mutually exclusive by def, identical shape):

```js
} else if (def.holderStagger && staggerT > 0) {
  // §5b slot 5 window: NOBODY holds the eye — no wind-up arms, nothing new schedules
  // (whoever holds the eye fires next; the eye is on the floor). In-flight bullets and
  // already-queued pending sub-volleys still land (deleting in-flight is THREAD-CUT's
  // verb, not ours). The chain's `if (shielded)` precedes us, so a shield freezes the
  // window rather than double-spending it.
  staggerT = Math.max(0, staggerT - dt);
  if (chargeT > 0) { chargeT = 0; model.setCharge(0); model.setAttackTell?.(null); }
}
```

**The "2.5s bonus-damage window", reconciled with shipped grammar**: no roster stagger is a damage
MULTIPLIER — thrumswarm's is "chip finally lands" (locked condensed), weftwitch's is "the loom is
stilled". Eitherwing is always chippable, so its bonus is (a) 2.5s of scheduling silence = free
uninterrupted rider-chip + gun uptime, and (b) the payoff the def already built: `eyeRig` is a
lockPart (*"the EASY primary — the smoothed anchor … carries the brand across the handoff"*), and a
DROPPED eye parks that organ nearly still at the thread midpoint — the fight's easiest lance beat,
worth `lanceDmgEach` per painted pip on the Surge spend. If the owner rules "bonus-damage" means a
literal multiplier, the dial is a kind-scoped `staggerT > 0` factor inside `damageBoss` — named in
§7, default absent.

### 2f. Resets

- `initBoss` already runs `partParries.clear()` (covers `HOLDER_KEY`) and `staggerT = 0` (the
  slot-7 swarm reset line) — add `holderPrevTarget = null;` on that same line.
- Model-side drop state dies with the per-fight model rebuild (the `crackedPanes` convention).
- No `endEncounter`/`resetBoss` additions needed beyond that one var: `staggerT` and the ledger are
  already covered by the shipped lines, and the model is torn down.

---

## 3. THE MODEL API (bossEitherwing.js — the minimal hooks)

Two functions + one guard, mirroring the "diagnostics + pins" section's conventions:

```js
let eyeDropT = 0, dropEase = 0;
function holdState() { return { t: holdT, target: holdTarget, drop: eyeDropT }; }
function dropEye(dur = 2.5) { if (dyingK <= 0 && entranceU == null) eyeDropT = Math.max(eyeDropT, dur); }
```

Tick integration (all inside `tickBody`, in the existing beats):

1. **Handoff freeze** — the handoff chain gains one guard AFTER `debugHold` (tests keep override
   priority) and BEFORE the charge pin: `else if (eyeDropT > 0) { /* the eye is DOWN — no flip,
   no pin; handoffTimer holds */ }`. `holdT`/`holdTarget` stay untouched, so recovery re-seats on
   the SAME holder — no target flip, so the §2d watcher never mistakes recovery for a baton pass.
2. **The drop seat** — after the shipped seat math (`_eye.copy(_sa).lerp(_sb, eyeF)` + `glideLift`):
   decay `eyeDropT`; ease `dropEase` toward `eyeDropT > 0 ? 1 : 0` (the `sockGlow` easing idiom,
   `* Math.min(1, dt * 6)`); then
   `if (dropEase > 0.01) { const dm = _sa.clone().lerp(_sb, 0.5); eyeRig.position.lerp(dm.setY(dm.y - 0.9), dropEase); }`
   — the eye sags ~0.9 BELOW the thread at its midpoint (the thread droops `-0.25` at mid, so the
   dropped orb reads clearly OFF the strand, "on the floor" of the formation). Both sockets go dark
   while nobody holds it: fold `dropEase` into the existing intensity drives — `eyeK *= (1 -
   dropEase * 0.55)` (guttering, not dead), pupil dilated (`pupilBase + dropEase * 0.5` — the model's
   own "dilation = death" grammar, borrowed for the stun), `glint.visible` keeps its existing rule.
   Recovery is free: `dropEase` eases back and the shipped seat math retakes the position.
3. **Export** `holdState, dropEye` on the returned handle (beside `setDebugHandoff`).

No new geometry, no new materials, no new draws — `tricount`/`tiershots` inputs untouched. The
`orientDart`/thread/beads code paths are untouched (the thread still spans socket-to-socket; only
the eye's seat overrides). `setDissolveEmotive`/entrance guard in `dropEye` keeps the death/entrance
choreography owner of those states.

**The midpoint node (shared with Piece 2)** — in the builder, beside the `splitCore` add:
`const threadMid = new THREE.Object3D(); threadMid.name = 'threadMid'; rig.add(threadMid);`
and in the motes beat (where `mid` is already computed): `threadMid.position.copy(mid);`. A named
EMPTY — byte-neutral, the exact `seekerFin`/`seekerScar` precedent (*"zero geometry (byte-neutral,
tricount unchanged)"*). `partWorldPos` resolves it via the generic bossModel.js accessor for free.

---

## 4. PIECE 2 — MIDPOINT-IRIS (one def line, zero engine change)

**Decision: the TRUE thread midpoint via `gapAnchor: { iris: { part: 'threadMid' } }` — the group
pose is NOT the anchor here, inverting ENG-C4's call, for a reason worth recording.** ENG-C4 §2b
rejected the true midpoint because the tilted lemniscate's `sin(2θ)` term wobbles it (`ayr =
sin(th * 2) * ORBIT_R * 0.5 * spread`, ~±1.5 rig-local → ~±2.4 world at `scale: 1.55`) at twice the
orbit frequency — fatal for a CONTINUOUSLY-DRAWN band that must be flyable. The iris has the
opposite geometry of trust: the branch resolves its centre **once per volley** (*"resolved ONCE here
(not per-ring) so the volley's rings stay concentric"*) — a snapshot, so the wobble never shivers
anything; the rings are born concentric on where the thread-mid truly IS (the ember motes + the
dread's split-light beads mark that exact spot in-world — the drawn thing is the paid thing), and
the ±8 clamp bounds the worst case (station `pose.x` sway + ±2.4 wobble stays inside). The group
pose would also cost MORE: `resolveGapAnchor` speaks only `spec.part` / `spec.x` — a pose-anchored
iris would need a new resolve mode, while `{ part: 'threadMid' }` rides the shipped branch verbatim.

- **No card gate.** `iris` exists only in P3's attack list, and P3's card IS `eitherwing_both` — the
  attack list already gates it; an ungated spec keeps the anchor testable through `debugEmitAttack`
  (the ENG-B lesson: card-gated specs are headless-hostile).
- **Known limitation, stated honestly**: the gapAnchor contract is X-only (`cy = B.fightHeight` in
  the iris branch). The midpoint's Y (±3.5 during the eight, less at station) is not tracked;
  extending gapAnchor to Y is new engine surface this PR does not open (§7 tunable).
- **Fallback safety is shipped behavior**: if `partWorldPos('threadMid')` ever returns null (absent
  node), `resolveGapAnchor` returns null → `anchorX` → the player-derived shipped iris. Never a
  broken volley.

---

## 5. THE DEF OPT-IN (bossDefs.js, eitherwing only — two lines)

```js
eitherwing: {
  …
  // §5b slot 5 ORGAN-BREAK reuse (ENG-EW): perfect-parry the HOLDER's amber 3× mid-
  // possession → the handoff staggers, the eye drops to the thread midpoint (2.5s window).
  holderStagger: true,
  // §C.4 dread (ENG-EW): the P3 iris contracts on the twins' THREAD MIDPOINT (the named
  // threadMid empty), not the player — resolved once per volley through the ENG-B seam.
  gapAnchor: { iris: { part: 'threadMid' } },
  …                                              // phases/cards/rhythm/emitOrigins UNCHANGED
}
```

Every other boss byte-identical. Rhythmprint/amberdiet inputs untouched (no attack/phase/cadence/
color change anywhere; the tags ride existing ambers).

---

## 6. GATE PLAN (headless, reforged/tests/boss.mjs) — mirror the ENG-E blocks + the ENG-C4 harness

**A. Model tier** (extend the shipped eitherwing block that already asserts named twins/eyeRig/
eyeThread/eitherScar/ribbonPivots + uses `setDebugHandoff`):
1. `holdState()` exists and tracks `setDebugHandoff(0)` → `{ target: 0 }`, `setDebugHandoff(1)` →
   `{ target: 1 }`; `group.getObjectByName('threadMid')` exists, and after ticks its world-x sits at
   the mean of the two socket world positions (recompute from `eyeThread`'s endpoints or
   `partWorldPos('eitherTwinA'/'B')` ± the socket offset — assert within a loose 1.5u).
2. `dropEye(2.5)` → over ~0.5s of ticks `eyeWorldLocalPos()` leaves the holder seat and lands within
   ~1.2 of the thread midpoint, BELOW it (the sag); `holdState().drop > 0`; force `debugHold` flips
   during the drop still honored (the guard sits after `debugHold`). After 2.5s+ease the eye
   re-seats at the `holdT` seat (recovery) and `drop === 0`.
3. **The shipped handoff-travel assert stays green untouched** (its `setDebugHandoff(0→1)` sweep
   never calls `dropEye`).

**B. Tag plumbing** (the ENG-E harness shape — `spawnBossBullet` + `reflectBossBullets`, no boss):
4. After forcing eitherwing (`boss.forceBoss(p, BOSS_ORDER.indexOf('eitherwing'))` +
   `boss.debugForceFight(p)`), `debugEmitAttack('crossfire', p)` bullets carry
   `part: 'eitherTwinA'|'eitherTwinB'`; `debugEmitAttack('aimed', p)` ambers carry
   `part: 'eitherMuzzle'` (extends the shipped ENG-A origin asserts, which are positional).
5. A perfect-parried `'eitherMuzzle'` amber shows up in `snapParts` — and **no lock paint happens**:
   `lockPaint` never fires for `'eitherMuzzle'`/`'eitherTwinA'` (the §2c guard), while a painted
   `eyeRig` via the normal dwell path still works (guard preserves real lockParts).

**C. Full loop** (live fight; `setDebugPerfectParryRel` widened — never frame-tight in CI):
6. Force the holder (`setDebugHandoff(0)`), drive three parry bursts of `'eitherMuzzle'`-tagged
   ambers (spawn → `rollInvuln` pulse → `updateBoss` → drop `rollInvuln` to re-latch `rollParried`):
   after bursts 1–2 NO `bossEyeDrop` (the n/3 bank only); after burst 3 `bossEyeDrop` fires,
   `holdState().drop > 0`, and the scheduling chain is silent (no new `chargeT`, no new bullets
   beyond pending) for ~2.5s of frames.
7. **Not before the threshold, and not across a baton**: bank 2, flip possession
   (`setDebugHandoff(1)`, tick once — the §2d watcher clears), bank a 3rd → NO `bossEyeDrop`
   (the count died with the baton); two more banks → fires at a fresh 3.
8. **Holder-side crossfire counts, seeker-side doesn't**: with holder forced to A, a parried
   `'eitherTwinA'` amber banks (+1); a parried `'eitherTwinB'` amber alone banks nothing.
9. **Surge reflects don't count** (drive one burst with `surge` forced — 0 bank), and banking is
   frozen during the window (`staggerT <= 0` gate).
10. **Midpoint-iris centres on the anchor, not the player**: park the player at x = −8, tick a few
    frames (the model publishes `threadMid`), `debugEmitAttack('iris', p)` → the mean x of each
    ring's bullets ≈ `debugPartWorldPos('threadMid').x` (within ~1.0, post-clamp), and ≥ 3u away
    from `anchorX = −5.6` — the player-derived placement is provably NOT taken.
11. **Coexist inert**: force `voidmaw` (no `holderStagger`, no `gapAnchor`) — parried string-tagged
    ambers bank nothing, no `bossEyeDrop` ever, `debugEmitAttack('iris')` centres player-derived;
    force `marrowcoil` — the ENG-E organ-break asserts still pass untouched (same consumer, sibling
    blocks); force `onewing` — `'frameGroup'` behavior unchanged (no lockParts → no snap block).

**D. What must stay green** (the roster net, no thresholds moved): the shipped eitherwing model-tier
asserts (twin ΔL via `twinBodyLum`, handoff travel, ribbon telegraph, thread length), the ENG-A
per-organ emit block, the **ENG-C4 `armEitherwing` orbitAnnulus gate** (`orbGraze`/`orbitLap`/
dead-centre/broken-lap/coexist — we touch neither the grazeForm cluster nor the setpieces), the
eitherwing "never fires the frame-tagged ghost half" assert (our tags ≠ `'frameGroup'`), the ENG-E +
ENG-B + pane/shackle suites, `bossboot`, `bossgate eitherwing` G1–G7 (no visual change beyond the
existing eyeRig moving — the drop is a fight-state pose, not a capture state), `amberdiet`/
`rhythmprint` (inputs byte-identical). Known pre-existing flakes (karnvow footwork, embertide
entrance) remain not-ours, per the ENG-E lesson.

---

## 7. SCOPE + the 2 risks/tunables that matter

**Ships**: the emit-side tags (§2a) + snap-guard (§2c); the holder ledger block + baton reset +
`staggerHolder` + the window branch (§2b/2d/2e); the model `holdState`/`dropEye`/`threadMid` (§3);
two def lines (§5); the gate blocks (§6); `bossDebugState` additions (`holderParries:
partParries.get(HOLDER_KEY) ?? 0`, `holdTarget`/`eyeDrop` via `model.holdState?.()` — the slip/orb
field precedent). **Does NOT ship**: C.6 gem-shatter (its own `partParries` reuse), any Y-tracking
gapAnchor extension, any damage multiplier, any change to `applyPartBreak`/`routePartDamage`/
the grazeForm cluster/`reflectBossBullets`.

1. **Threshold tightness vs possession length (the intensity dial).** Full intent: 3 PERFECT parries
   inside ONE possession, where idle handoffs flip every 2.4–3.6s. The charge pin (`charge > 0.15`
   holds the eye) means real possessions stretch across whole volleys, and `'eitherMuzzle'` counting
   is possession-agnostic at parry time — but a median player may still see the bank die repeatedly
   in P1 (one `aimed` volley ≈ one roll ≈ +1 per possession). **The fairness hatch is layered in**:
   the reset is VISIBLE ("THE EYE PASSES — THE COUNT FADES"), it can never eat a mid-volley bank
   (flips only at rests), and the progress note teaches the count. Dials, in order of gentleness:
   count any-parry (the ENG-E documented one-liner), survive ONE baton (decay to n−1 instead of
   delete), lengthen `handoffTimer`'s re-arm. The threshold 3 itself is §5b-verbatim — tune around
   it, not through it.
2. **The window's worth + the iris's X-only truth (the feel dials).** (a) 2.5s of scheduling silence
   + a parked `eyeRig` may read as too quiet for the Colossi PEAK (or too generous stacked with a
   fresh lance Surge) — the dials are the window length and, only if the owner asks, the kind-scoped
   damage factor in `damageBoss` (§2e); never touch the shared `staggerT` semantics. (b) The
   midpoint-iris authors X only (`cy = B.fightHeight` is the shipped branch) and snapshots a wobbling
   point — on the preview the rings must visibly own the thread-mid/motes spot; if they read as
   "vaguely boss-ward", the dial is an `offset` in the spec or (bigger, separate PR) a Y-aware
   gapAnchor. Watch both on the PR preview during `eitherwing_both`.

**Plan-vs-code drift flagged upward**: (i) §C.4's "Parry job (allocated, now shipped)" — the
mechanic is NOT shipped, only the allocation + origin plumbing (this spec is the ship); (ii) the
plan's "parry the holder's amber volley" presumes attributable ambers — the opted emit paths drop
the `part` today (§1); (iii) §5b's "bonus-damage window" has no shipped multiplier grammar — this
spec reads it as the roster's stagger-window grammar + the parked-organ lance payoff (§2e), owner to
confirm; (iv) P3 carries no `aimed`/`stream`, so muzzle-only counting would strand the mechanic
outside the dread — holder-side crossfire counting is the zero-emission reachability fix (§1).

---

## 8. GIT-STATUS SANITY (checkpoint protocol)

This checkpoint **created exactly one new file** — `reforged/boss-context/ENG-EW-SEAM.md` (this
spec). No source file, def, test, or doc was modified BY THIS CHECKPOINT; no test, build, or game
process was run. (`git status` also shows in-flight PARALLEL work not from this session — an ENG-G
`threadTheGap` diff on MARROWCOIL touching boss.js/bossDefs.js/config.js/ui.js plus an untracked
`ENG-G-SEAM.md`. Audited: its hunks are additive `gapThread*` machinery + per-row notes on
curtain/movingGap/geyser and never touch the reflect consumer, the iris `gax` read, `staggerT`,
eitherwing's def, or bossEitherwing.js — nothing in this spec is invalidated. Symbols here were
read from the LIVE WORKING TREE, i.e. master + that diff.)
Every symbol cited (`partParries`/`RIB_BREAK_PARRIES`/`applyPartBreak`/`routePartDamage`/
`lockPartDead`/`PART_SYS`/`breakRib`, the reflect consumer + `rollParried` + `snapParts`,
`staggerT`/`staggerHits`/`triggerThreadCut` + the `def.threadCut` window branch, `resolveEmitOrigins`
/`resolveReflectTargets`/`resolveGapAnchor` + the iris `gax`/`anchorX`/`cy` reads, `emitBoss`'s
`part` param, `emitRibBullets`/`emitGhostHalf` tag precedents, `paintFromParry`'s guards,
bossModel.js `buildBoss`'s generic `partWorldPos`, bossEitherwing.js `holdT`/`holdTarget`/
`handoffTimer`/`debugHold`/`setDebugHandoff`/`eyeF`/`glideLift`/`hurt`/`socketWorldLocal`/the motes'
`mid`/`muzzle('eitherMuzzle')`, the eitherwing def block, the shipped test blocks (`armEitherwing`,
the ENG-A emit asserts, the twin-anatomy asserts, the frameGroup coexist assert), and the
ONEWING/HOLLOWGATE/KARNVOW lockParts audits) was read from live master in this session, by symbol,
never by line number.
