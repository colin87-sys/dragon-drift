# ENG-C7 SEAM — KNELLGRAVE `shrinkDisc` grazeForm (toll-ring pockets: escalating ticks, bail on the last beat)

**Status**: PRE-BUILD spec (Fable checkpoint, 2026-07-10). Design only — no code changed.
**Plan rows**: ATTACK-REWORK-PLAN §C.7 "Cracked Peal" graze row — "graze — **SHRINKING SAFE
DISC** (allocated §5i.B WE form, verbatim): toll-ring pockets with escalating ticks, bail on
the last beat"; §E.1 row D (the LAST grazeForm on the shipped tick economy — "`shrinkDisc`
(C.7 — def label already live, E.0.3)"); §E.1 build-queue row 12 (decomposed in §6 below —
this spec is deliberately NOT the whole row); §E.2 C.7 gap (ii) — "the `shrinkDisc` detector
branch (toll-ring pockets + escalating ticks + last-beat bail — the pocket geometry is
unwritten)". This spec writes it.
**Law** (BOSS-DESIGN §5i.B World-Enders row, verbatim): "**SHRINKING SAFE DISC** (10:
toll-ring pockets — escalating ticks, bail on the last beat)". Plus the cross-cutting graze
laws: dedup discrete / tick continuous; annulus not radius; reward bands DRAWN in-world;
payout richest at the scariest instant; reset-on-hit with mercy at max. Plus the §5d
knellgrave sheet: "GRAZE FORM — SHRINKING SAFE DISC: the toll ring-walls are the anatomy;
ride the shrinking safe disc through escalating ticks, bail on the last beat; offered once
per phase."
**Parent seams**: ENG-D-SEAM.md (slipstream — SHIPPED) + ENG-C4-SEAM.md (orbitAnnulus —
SHIPPED). This form rides the SAME economy and band-primitive pattern; §2–§3 only add what
neither sibling needed: a TIMED pocket armed by the fight's own volley clock instead of a
setpiece window.

⚠ **THE LIVE-LABEL FOOTGUN (this seam's defining constraint).** `bossDefs.js` knellgrave
ALREADY carries `grazeForm: 'shrinkDisc'` (verified — the def comment: "§5i.B World-Enders
graze debut: SHRINKING SAFE DISC — the toll ring-walls ARE the graze anatomy… Def-gated
(slot-6 continuous detector)"), and `boss.js` has NO `shrinkDisc` branch anywhere (verified
by grep — the string appears only in bossDefs.js). Both ENG-D lessons name this: "A def
label with no consumer is a loaded gun — the moment its branch exists it fires." So unlike
slipstream (born inert, one def line opted ASHTALON in) and orbitAnnulus (no label existed
anywhere), **the branch IS the activation**: there is no coexist-first phase on the hero.
Consequences, designed for throughout: (1) this PR touches **zero bossDefs.js bytes** —
the first grazeForm PR with no def edit at all — so rhythmprint/amberdiet/card gates are
untouched by construction; (2) the branch must be correct and tuned on first ship (the §5
gate plan is correspondingly heavier on Knellgrave-regression asserts than the siblings');
(3) the only alternative — renaming/removing the live label to stage a coexist window —
would edit the shipped def for zero player value and is rejected.

Everything below was read from CURRENT master (post ENG-D / ENG-C4 / ENG-B / ENG-C) in this
session, cited by symbol, never by line number.

---

## 1. DRIFT-CHECK — what is already live (verified by symbol)

- **The toll clock is boss.js's, not the model's.** At every volley release (the
  `chargeT <= 0` release inside the fight update — the block commented "§5f KNELLGRAVE
  (def.musicDies): every volley release IS a toll"), boss.js runs, gated `if
  (def.musicDies)`: `bellToll(w)` (sfx), `model.tollNow?.(time)` (the fairness-twin
  ring-wall), `cameraCtl.shake?.(…)`, `emit('bossToll', { k: w })` — with
  `w = 0.55 + (1 − hp/hpMax) * 0.45` (the tolls grow heavier as the fight ruins). One more
  toll fires at fight entry beside `musicKill()` (`if (def.musicDies) { musicKill();
  bellToll(1); model?.tollNow?.(time); }`) — note it does NOT `emit('bossToll')` and
  releases no volley, so it can never arm a pocket. **`executeAttack(curAttack, player)` is
  called on the very next line after the toll block** — a toll and its volley are the same
  frame. That adjacency is this seam's clock: the pocket opens ON the toll beat by
  construction, with no new toll plumbing.
- **DRIFT — there is no toll counter or toll index anywhere.** The model owns
  `let lastTollAt = -10; function tollNow(time) { lastTollAt = time; fireRing(time); }`
  (bossKnellgrave.js) and exports `tollBeat()` (returns `lastTollAt`) — but **nothing in
  boss.js reads `tollBeat`** today, and the model's ring VISUALS over-count the real tolls:
  the model runs its own `autoTollT` beat ("studio/no-controller: auto-toll on the
  accelerating beat… the auto-toll only fires in ACTIVE states (charge / dread)") — its
  condition is `tollActive && autoTollT <= 0`, which is live in-game during any charge, so
  model rings ≠ boss.js tolls. **Decision: the branch keys on nothing model-side.** It owns
  a plain boss.js counter incremented at its arm site (§3b) — the boss.js volley-release
  toll is the authoritative clock, the model's rings are its cosmetic twin (`fireRing`
  drives the `orbiters` ring-wall meshes and emits ZERO bullets — verified: it only stamps
  `userData.born` on two orbiter meshes).
- **The lethal "toll ring-walls" are the `iris` bullets, not the model rings.** The def:
  "The iris ring-walls ARE the toll (the readable beat)" — every knellgrave phase carries
  `iris` (P1 `['iris','aimed']` → P4 `['iris','fan','aimed']`). The `iris` branch in
  `executeAttack` (boss.js): "IRIS — contracting rings: each ring shrinks toward the centre
  as it closes, so camping an edge fails; the safe zone is the middle." Geometry, verbatim
  constants: `rings = quality < 0.75 ? 3 : 4`, `m = 12/16` bullets per ring,
  `rad = 10, contract = 0.62`, `slow = closing * 0.8` (`closing = B.bulletSpeed` = 28 →
  slow 22.4), `inSpd = (rad * contract) / (pose.rel / slow)` — "arrives at
  rad×(1−contract) ≈ 3.8". Centre: `cx = gax != null ? clamp(gax, ±8) : anchorX`
  (`anchorX = clamp(player.position.x * 0.7, ±8)`; `gax = resolveGapAnchor('iris')` — the
  shipped ENG-B seam, resolved ONCE at schedule time so the volley's rings stay concentric;
  knellgrave carries no `gapAnchor` today so `gax` is null), `cy = B.fightHeight` (= 13).
  Rings launch via `pending.push({ t: k * 0.4, … })`. **So one iris volley = a set of
  concentric rings contracting toward a per-volley-baked centre, whose safe middle is a
  disc that closes from ~10 down to ~3.8 as the rings arrive — the shrinking safe disc IS
  already in the game as negative space. This seam draws it and pays it.**
- **KNELLGRAVE's pose station-holds; there is no pendulum setpiece.** Outside setpieces
  the fight update holds `pose.rel = B.settleGap` (= 30), `pose.x = Math.sin(time * 0.7) *
  5.0` (the default `holdSway`), `pose.y = (def.stationY ?? B.fightHeight) + sin bob` —
  knellgrave's `stationY: 20` (the OVERHEAD LOOM). Its ONLY setpiece is `lastToll`
  (`atPhase: 3, dur: 26, moving: true, dread: true` — the P4 survival ride to rel ≈ 3
  overhead, `SETPIECE_PATHS.lastToll` verified). The "pendulum" today is MODEL-internal:
  the `swingA` rig sway on `swingPivot` ("WIDENS on charge — the §3.5 telegraph"), asserted
  live in tests/boss.mjs ("knellgrave charge WIDENS the swing arc") — so the plan
  build-queue's "`swingPivot` + its charge-widen assert" prereq is confirmed SHIPPED. The
  `pendulumSweep` SETPIECE (ENG-H) does not exist and — verdict below — is NOT needed here.
- **The grazeForm cluster + economy**: branches in order `beamEdge` → `tideEdge` →
  `shadowRide` → `holdFlinch` → `slipstream` → `orbitAnnulus`, then `if (def.beamDuel)`.
  **`shrinkDisc` appends after `orbitAnnulus`, before `def.beamDuel`** — the established
  point. Shared lets `beamHeld/beamTick/beamGrace`; payout `bulletGraze(player)` →
  `game.grazeCharge += CONFIG.BOSS.grazeGain * (game.adrenGainMult || 1)` (grazeGain 0.34).
  `holdFlinch` is the precedent for gating a form off during setpieces/shield:
  `if (def.grazeForm === 'holdFlinch' && !holdFlinchDone && !shielded && setpieceT < 0)`.
- **The three reset sites** carry slip + orb lines today and the disc vars join them: (1)
  the per-encounter reset under "§5i.B: beam-edge ramp + adrenaline ladder reset per
  encounter" (`slipRideT = 0; …` / `orbAcc = 0; …`); (2) `endEncounter()` (same lines +
  the explicit band hides `if (slipBandMesh) { slipBandMat.opacity = 0; … }`); (3)
  `resetBoss()` teardown (same pairs). Plus TWO per-seam precedents this form uses:
  `breakShield` already carries a def-gated grazeForm reset (`if (def.grazeForm ===
  'holdFlinch') { beamHeld = 0; … }`) — the disc's per-phase re-offer joins there — and
  `armSetpieceForPhase`/`debugRunSetpiece` carry the slip/orb per-arm lines (the disc needs
  NONE there; §3d says why).
- **The band primitive**: `slipBandMesh` (RingGeometry(3.2, 4.7, 40)) and `orbBandMesh`
  (3.6, 5.1) — surge-pink `0xff4fd0` additive, built once/hidden in `initBoss`, eased
  opacity `mat.opacity += (tgt − opacity) * Math.min(1, dt * 6)`, positioned at
  `(cx, cy, -(player.dist + 4))` (the player plane), explicit teardown hides. The disc
  band is a THIRD mesh with one new trick — a UNIT ring under uniform scale (§3e).
- **The label inventory** (grep `grazeForm:` in bossDefs.js): slipstream / orbitAnnulus /
  beamEdge / shadowRide / absorbColor / moteHarvest / **shrinkDisc (knellgrave)** /
  holdFlinch / tideEdge / spraySoak / medley (unmasked — the only OTHER branch-less label;
  it stays inert, untouched by this PR).
- **Test seams available**: `debugForceFight`, `debugForceCard(id)` (ENG-B's seam — arms
  `knellgrave_last` headlessly), `debugRunSetpiece(id)` (resolves the real def entry —
  `lastToll` dur 26), `debugEmitAttack(id, player, q)` (calls `executeAttack` directly and
  flushes `pending`), `bossDebugState()`, `on('…')` for emits. **There is NO forced-toll
  seam** — §5 resolves this without adding one.
- **The knellgrave suites that must stay green** (tests/boss.mjs, by banner): the geometry
  block ("swing-widen telegraph, clapper head-lift notice, dread crack-gape reveal, ruin
  ladder, named organs"), the WORST-FRAME OVERDRAW AUDIT ("shield+dread+double-toll+flood…
  ≤ 2 large additive/fresnel fills"; it audits `buildBoss(BOSSES.knellgrave, 1)` — the
  MODEL's shells — so a scene-level band in boss.js is outside its scan, same as the
  slip/orb bands were "invisible to the visual gates"), the music-death block
  ("kill→zero, restore→back, both idempotent, resetBoss restores") and its lifecycle twin
  ("the defeat fanfare restored the killed music" — knellgrave is last in BOSS_ORDER).

**Plan-vs-code drift found this pass** (each feeds a decision above): (a) no toll
counter/index exists anywhere and `model.tollBeat()` is exported but unread — the plan's
"how does the branch learn the toll count" has a null answer today; the branch adds its own
counter (§3b). (b) The model's `autoTollT` fires ring visuals during any charge in-game,
not only headless studio — model rings over-count boss.js tolls, so ring VISUALS must never
be the pocket clock. (c) The §5i.B anatomy phrase "toll-ring pockets" is ambiguous between
the model's expanding cosmetic ring-walls (zero bullets) and the iris's contracting lethal
rings; the def comment ("the iris ring-walls ARE the toll") + the payout-at-the-scariest-
instant law resolve it to the iris bullets. (d) Build-queue row 12 bundles four seams +
a def restructure with this form; §6 shows the form needs none of them (the row
over-couples — same finding shape as ENG-C4's row-9 decomposition). (e) The A.10 charge
stands: the toll's bullets CONTRACT while the sound expands — C.7-proper will flip iris →
bellMouth `spiral`, which **removes this form's anatomy from the def**; §6's forward
contract (`armDiscPocket`) is written so that flip re-anchors the pocket instead of
silently orphaning it.

---

## 2. THE MECHANIC — what the shrinking safe disc IS

### 2a. One pocket per iris toll (the "toll-ring pocket")

When a toll's volley is `iris` — the release frame where the toll block runs and
`executeAttack('iris', …)` bakes the volley's centre — a **pocket** opens: a drawn
surge-pink disc-rim at the volley's own centre `(cx, B.fightHeight)` in the player plane.
The pocket lives exactly as long as the volley's rings are inbound:

```
discDur = (rings − 1) * 0.4 + pose.rel / slow
        = 3·0.4 + 30/22.4 ≈ 2.54s   (quality 1: 4 rings)
        = 2·0.4 + 30/22.4 ≈ 2.14s   (lowQ: 3 rings)
```

and its radius shrinks from `discR0` (the schedule, §2b) down to `DISC_R_END = 3.8` — the
iris's own terminal radius (`rad × (1 − contract)`), i.e. exactly where the last ring-wall
crosses the player plane. The drawn rim is therefore an honest countdown: **the disc IS
"where the safe middle still is"; its last drawn beat coincides with the last ring's
arrival circle.**

- **Riding** = inside the rim. The PAID band (annulus not radius) is the rim itself:
  `d ∈ [discR·(1−DISC_WALL_FRAC), discR)` — hugging the shrinking wall from inside, squeezed
  toward the centre as the rings close, while the volley's own bullets converge just outside
  it (payout richest at the scariest instant; the dead centre is the iris's safe middle —
  legitimate survival, UNPAID, never harmful).
- **Escalating ticks** on two axes: (i) within a pocket the tick interval is keyed to the
  live radius — `beamTick = max(0.16, discR·0.075 − beamHeld·0.04)` — ~0.6s at R 8 down to
  ~0.29s at R 3.8 (the shrink itself accelerates the payout; `beamHeld` keeps the family's
  unbroken-contact ramp on top); (ii) across tolls, successive pockets in a phase START
  smaller (§2b), so later tolls open already-fast.
- **Bail on the last beat**: at `discAge ≥ discDur` the pocket DIES — band gone, ticks
  gone — on the same beat the final ring-wall crosses at 3.8. A rider who has been herded
  down the rim is, at that instant, standing exactly one wall-width inside a crossing
  bullet ring (~1.5u bullet spacing at m=16, r=3.8): commit INSIDE it (into the eye —
  safe, unpaid) or thread OUT through the ring (the shipped per-bullet buzz graze pays the
  crossing — dedup discrete and tick continuous coexist, per the §5i.B law's own split).
  Lingering ON the rim line is the hit — **and the punish is the existing iris bullets;
  the form itself never damages, never pushes, never resets the bank** (the slipstream
  fairness floor, verbatim).

Non-iris tolls (`aimed`/`fan`/`crossfire` releases) open no pocket — they are the threat
that keeps rim-riding scary mid-pocket (cadence 1.1–1.7s means 1–2 aimed-class volleys
land during every ~2.5s pocket). If a second iris toll fires while a pocket is live (the
rhythm machine may repeat), the new pocket REPLACES the old (single-pocket state; the band
eases to the new centre/radius; in-band contact carries the ramp through the swap, the
0.3s `beamGrace` bridges the geometry jump — no queue, no special case).

### 2b. The shrink schedule keyed to the toll count

`discTollN` counts pocket-opening (iris) tolls **within the current phase** (reset at
`breakShield`, §3d — each phase re-offers a generous first pocket, honouring the §5d sheet's
"offered once per phase" as a floor and §5f teach-before-test: P1's first pocket is the
teach).

```
discR0(n) = max(5.6, 8.0 − 0.6·(n−1))          // toll 1: 8.0 → toll 5+: 5.6
capped:     min(discR0, arenaHW − |cx| − 0.5)   // full annulus stays in-arena laterally
```

Reachability by construction: `cy` is always `B.fightHeight` 13, so vertically
13 ± 8.0 = [5, 21] ⊆ [laneMinY 2.5, laneMaxY 22]; laterally `|cx| ≤ 8` (the iris clamp)
and the `arenaHW` cap (the live constrict var, slipstream precedent — knellgrave never
constricts, so normally 13) keeps the worst case ≥ 4.5 > DISC_R_END. No follower, no
Y-clamp vars — fixed centre per pocket (§2c).

### 2c. The centre — fixed per pocket, and why (the ENG-C4 lesson applied)

Candidates, judged by "centre on the stable thing the player can read, not a wobbling
internal":

1. ~~`bellMouth` world position~~ — the bell rides `swingA` on `swingPivot` (idle
   2-frequency sway, WIDENS on charge) on top of the pose's ±5 `holdSway`: a double-wobble.
   The exact failure ENG-C4 rejected for the twin midpoint ("a band that shivered… would be
   unflyable and would violate the drawn-in-world law").
2. ~~the pose~~ — swaying ±5 at `stationY` 20: an annulus centred at y 20 exits laneMaxY 22
   for any R > 2 — unflyable.
3. **the volley's baked iris centre `(cx, B.fightHeight)`** ✓ — frozen per volley by the
   shipped iris branch itself (ENG-B deliberately resolves iris's anchor "ONCE at schedule
   time… per-ring re-resolve under the sway would smear the concentric rings"), so the
   drawn disc and the actual contracting rings are concentric BY CONSTRUCTION, for the
   pocket's whole life. It is not the boss's body — it is the toll's ANATOMY (the §5d
   sheet: "the toll ring-walls are the anatomy; the form is a body part's geometry" — for a
   bell whose attack IS a radiated wavefront, the wavefront's centre is the organ).

So `shrinkDisc` is neither a moving-centre form (slipstream's lagged follower) nor a
setpiece-window form (orbit's figure-eight): it is the cluster's first **volley-anchored,
TIMED** form — centre and duration baked at the release frame, driven by `discAge` alone
(note: `executeAttack(id, player)` has no `time` in scope — verified — so the pocket state
is age/duration counters, never absolute times).

---

## 3. THE BRANCH — pseudo-diff, by symbol

### 3a. Module state (boss.js, beside the `orbAcc` block)

```js
// §5i.B SHRINKING SAFE DISC (KNELLGRAVE's WE graze, C.7) — toll-ring pockets.
let discAge = 0, discDur = 0;   // pocket clock: age counts up; dur 0 = no pocket
let discR = 0, discR0 = 0;      // live drawn/paid radius; this pocket's start radius
let discX = 0, discY = 0;       // pocket centre — the iris volley's baked (cx, cy)
let discTollN = 0;              // pocket-opening tolls THIS PHASE (the shrink-schedule key)
const DISC_R_END = 3.8;         // the iris terminal radius: rad 10 × (1 − contract 0.62)
const DISC_WALL_FRAC = 0.30;    // the paid rim = [R·(1−frac), R) — PROPORTIONAL (see §3e)
```

### 3b. The arm site — one def-gated stash in the `iris` branch of `executeAttack`

Beside the existing `const cx = …, cy = B.fightHeight;` lines (all needed values —
`cx/cy/rings/slow/pose.rel` — are in scope exactly there; the toll block ran one line
before `executeAttack` on this same frame, so this IS the toll beat):

```js
// §5i.B SHRINKING SAFE DISC (C.7): an iris toll opens a pocket — the volley's own
// contracting safe middle, drawn and paid. Def-gated; inert for every other def.
// Gated off during the Last Toll ride (the survival exam stays pure dodge) and
// while shielded (no volley fires there anyway — belt and braces).
if (def?.grazeForm === 'shrinkDisc' && setpieceT < 0 && !shielded) {
  discTollN++;
  armDiscPocket(cx, cy, (rings - 1) * 0.4 + pose.rel / slow,
    Math.min(Math.max(5.6, 8.0 - 0.6 * (discTollN - 1)), arenaHW - Math.abs(cx) - 0.5));
}
```

with the tiny helper (the §6 forward contract — C.7-proper re-arms from its spiral branch):

```js
function armDiscPocket(cx, cy, dur, r0) {
  discX = cx; discY = cy; discAge = 0; discDur = dur; discR0 = Math.max(r0, DISC_R_END + 0.4); discR = discR0;
  emit('discPocket', { toll: discTollN, r0: discR0 });
}
```

⚠ Documented side effect: `debugEmitAttack('iris', player)` calls `executeAttack` directly,
so on a shrinkDisc def it ALSO arms a pocket. This is embraced as the deterministic test
seam (§5) — and it is why the stash carries its own def/setpiece/shield gates rather than
relying on the caller. Update `debugEmitAttack`'s "Only touches the bullet pool + pending"
comment to name the exception. (Pattern-budget suites that sweep `debugEmitAttack` over all
defs never call `updateBoss` afterward, and every reset site zeroes the pocket — no bleed.)

### 3c. The branch (grazeForm cluster, appended AFTER `orbitAnnulus`, before `def.beamDuel`)

```js
// ---- §5i.B SHRINKING SAFE DISC (KNELLGRAVE's World-Ender graze, C.7, def-gated) —
// toll-ring pockets: each iris toll opens a drawn disc at the volley's own centre,
// shrinking with the contracting ring-walls; riding the RIM (annulus, not radius —
// the dead centre is safe but UNPAID) pays ticks that ESCALATE as the disc closes;
// the pocket DIES on the last ring's beat (bail: commit inside, or thread out
// through the wall). The form punishes NOTHING — the threat stays the iris bullets.
// One grazeForm per boss; defs without grazeForm==='shrinkDisc' are inert. ----
if (def.grazeForm === 'shrinkDisc') {
  const live = discDur > 0 && setpieceT < 0 && !shielded;   // holdFlinch's gate discipline
  if (live) {
    discAge += dt;
    if (discAge >= discDur) { discDur = 0; discR = 0; beamHeld = 0; beamTick = 0; beamGrace = 0; }   // THE LAST BEAT
    else {
      discR = discR0 + (DISC_R_END - discR0) * (discAge / discDur);   // the shrink (linear, rings-honest)
      const dx = player.position.x - discX, dy = player.position.y - discY;
      const d2 = dx * dx + dy * dy, rIn = discR * (1 - DISC_WALL_FRAC);
      if (d2 < discR * discR) {
        beamGrace = 0.3;                                    // a flick across the rim doesn't reset
        if (d2 >= rIn * rIn) {                              // the RIM — annulus, not radius
          beamHeld += dt; beamTick -= dt;
          if (beamTick <= 0) {
            bulletGraze(player);                            // the payout rides the graze economy
            emit('discGraze', { r: discR, held: beamHeld, toll: discTollN });
            beamTick = Math.max(0.16, discR * 0.075 - beamHeld * 0.04);   // ESCALATING: interval ∝ radius
          }
        }
      } else if (beamGrace > 0) { beamGrace -= dt; }
      else { beamHeld = 0; beamTick = 0; }                  // real exit → the ramp resets (pocket stays)
    }
  } else if (discDur > 0) { discDur = 0; discR = 0; beamHeld = 0; beamTick = 0; beamGrace = 0; }   // setpiece/shield rose mid-pocket
  // Drive the drawn band — a UNIT ring uniformly scaled to the live radius (§3e).
  if (discBandMesh) {
    const tgt = discR > 0 ? 0.28 + Math.min(0.3, beamHeld * 0.06) : 0;
    discBandMat.opacity += (tgt - discBandMat.opacity) * Math.min(1, dt * 6);
    discBandMesh.visible = discBandMat.opacity > 0.02;
    if (discBandMesh.visible) {
      discBandMesh.position.set(discX, discY, -(player.dist + 4));
      discBandMesh.scale.setScalar(Math.max(discR, 0.001));
    }
  }
}
```

Divergences from the siblings, each deliberate:
- **Timed, not setpiece-gated** — `live` keys on the pocket's own clock; the `setpieceT <
  0` term makes the branch (and the arm) INERT through the whole `lastToll` ride: The Last
  Toll stays the pure-dodge survival exam (§5f), and the degenerate overhead geometry
  (pose.rel ≈ 3 → flight ≈ 0.13s pockets) never exists.
- **The rim ramp resets on exit but the POCKET survives** — leaving and re-entering one
  pocket restarts the tick ramp cold (beamEdge discipline), while the pocket keeps
  shrinking on its own clock (it is the volley's clock, not the player's).
- **No reset-on-hit added** — a hit already wipes the bank (`consecutiveRings`/
  `grazeCharge` in collision.js `hit()`); no shipped branch adds per-branch hit resets, and
  the disc doesn't either (mercy-at-max stays the adrenaline ladder's law, untouched).

### 3d. Resets — three sites + the per-phase re-offer; NO per-arm setpiece line

1. per-encounter reset (join the slip/orb lines under "§5i.B: beam-edge ramp + adrenaline
   ladder reset per encounter"): `discAge = 0; discDur = 0; discR = 0; discR0 = 0;
   discTollN = 0;`
2. `endEncounter()`: same line, + the band hide beside the others:
   `if (discBandMesh) { discBandMat.opacity = 0; discBandMesh.visible = false; }`
3. `resetBoss()` teardown: same pair (no pocket state or pink ring outlives teardown).
4. **`breakShield` per-phase re-offer** (the shipped def-gated precedent line
   `if (def.grazeForm === 'holdFlinch') { … }` sits exactly there):
   `if (def.grazeForm === 'shrinkDisc') { discDur = 0; discR = 0; discTollN = 0;
   beamHeld = 0; beamTick = 0; beamGrace = 0; }` — a phase advance kills any live pocket
   (the transition already wipes `pending` — "PHASE-TRANSITION HOLD") and restarts the
   shrink schedule: each phase's first pocket is generous again.
5. **`armSetpieceForPhase`/`debugRunSetpiece` get NO disc line** — unlike slip (per-stoop
   exposure re-offer) and orb (stale-θ hygiene), the disc carries no setpiece-scoped state:
   the branch's `setpieceT < 0` term already kills a live pocket the frame `lastToll` arms,
   and the ENG-C4 pose-jump gotcha (`debugRunSetpiece` leaving a stale pose for one frame)
   cannot bite a form whose centre never reads the pose at all.

### 3e. The drawn band — a THIRD mesh, and the unit-ring/proportional-wall decision

**Decision: add `discBandMesh`/`discBandMat` — `THREE.RingGeometry(1 − DISC_WALL_FRAC, 1,
48)` (a UNIT ring), uniformly scaled to `discR` per frame.** Do NOT share `slipBandMesh` or
`orbBandMesh`, and do NOT rebuild geometry per toll:

- The ENG-C4 second-band reasoning ("a shared mesh could only uniform-scale, preserving the
  radius *ratio*, not the wall width — the drawn band would lie about where the paid band
  is") is honoured by INVERSION: this form's paid wall is DEFINED as a ratio
  (`[R·(1−frac), R)`, §2a), so a uniformly-scaled unit ring draws the paid band **exactly**,
  at every radius, with zero geometry churn. Drawn == paid is a construction identity, not
  a maintenance promise. (A fixed-width wall would force RingGeometry rebuilds per FRAME —
  the shrink is continuous — pure GC churn; and a proportional wall is also the better
  read: generous rim when the disc is big and slow, razor rim on the last beats — the
  escalation made visible.)
- The siblings' baked radii (3.2–4.7 / 3.6–5.1) are meaningless to this form and their
  branches drive their own opacity/teardown — sharing would couple three forms to save two
  48-segment rings built once and hidden (the ENG-D/C4 lessons: hidden scene-level bands
  disturbed neither `bossgate` nor tiershots nor the model tri budget).
- Same recipe otherwise, copied from the orbBand block in `initBoss`: surge-pink `0xff4fd0`
  MeshBasicMaterial (`transparent, opacity 0, AdditiveBlending, depthWrite: false,
  DoubleSide, toneMapped: false, fog: false`), `name = 'discBand'`, `renderOrder =
  TIERS.arenaWall`, `frustumCulled = false`, `visible = false`; explicit hides at
  `endEncounter`/`resetBoss` (§3d).
- **FX-BUDGET note (the knellgrave sheet's own law)**: the worst-frame overdraw audit scans
  the MODEL's additive shells (`buildBoss` harness), so this scene-level mesh is outside
  the gate — but the law's spirit ("thin ring-wall, never a filled disc, value-capped")
  binds the DESIGN: wall fraction 0.30 (never a filled disc), opacity ceiling ~0.58
  (0.28 + 0.3), additive-thin, and the preview must eyeball the true worst frame
  (double-toll model rings + a live pocket band + the candle flood) — §7 risk 2.

### 3f. `bossDebugState()` — new fields

Beside `orbActive, orbAcc, orbLaps, orbR`:

```js
const discActive = def?.grazeForm === 'shrinkDisc' && discDur > 0;
… , discActive, discX, discY, discR, discR0, discTollN,
    discGeom: { rEnd: DISC_R_END, wallFrac: DISC_WALL_FRAC }
```

(The gate parks the player from `discX/discY ± discR·(1 − wallFrac/2)` — mid-rim.)

---

## 4. ACTIVATION + COEXIST — the live-label discipline

**This PR edits no def.** Activation on KNELLGRAVE is the branch's existence (the live
label consumes it); inertness everywhere else is the exact string gate
`def.grazeForm === 'shrinkDisc'` on BOTH touch points — the cluster branch AND the iris-
branch stash — so:

- Every other iris-firing boss (stormrend, marrowcoil, hollowgate, thrumswarm, brineholm,
  weftwitch, embertide, unmasked) runs the iris branch byte-behaviour-identically: the
  stash is def-gated and adds no emission, no RNG draw, no timing change.
- `medley` (unmasked) stays a branch-less label — untouched, still owed to Part D.
- "One grazeForm per boss" keeps the shared `beamHeld/beamTick/beamGrace` safe, as for all
  six shipped branches.

**Knellgrave must not regress** — what shipping the branch may NOT change, and how each is
held: (1) **the toll infrastructure** — zero lines added to the `def.musicDies` toll block
or the entry-toll line (the arm rides the iris branch instead); `bellToll`/`tollNow`/
camera-shake/`emit('bossToll')` byte-identical. (2) **music-death** — untouched
(`musicKill`/`musicRestore` paths not in this diff); the two shipped music-death test
blocks + the lifecycle defeat-path assert stay green. (3) **the fight's patterns/rhythm** —
no def bytes, no `executeAttack` emission change (the stash emits no bullets), so
rhythmprint/amberdiet/card-count gates are untouched by construction. (4) **The Last Toll**
— the survival exam gains no farm and loses no purity: the `setpieceT < 0` gates keep the
form dead for the whole ride (asserted, §5). (5) **lifecycle** — the full-roster sim (in
which knellgrave is last and kills the music) sees only two new plain-var writes per
knellgrave frame; all reset sites zero them.

---

## 5. GATE PLAN (headless, tests/boss.mjs) — mirror the shipped ENG-D block

Harness shape copied from the ENG-D block (`armAshtalon` → `forceBoss` + `debugForceFight`
+ warm-up frames → frame loop at dt 1/60 reading `bossDebugState()`, `on('…')` listeners),
as `armKnellgrave()`. Two driving modes:

- **Deterministic arm** (most asserts): `bullets.resetBossBullets();
  boss.debugEmitAttack('iris', p, 1)` — on knellgrave this bakes a volley AND arms the
  pocket (§3b's documented seam); then frame-loop `updateBoss` and park per
  `bossDebugState()`.
- **Organic arm** (the clock-integration assert): frame-loop the real fight; the rhythm
  machine picks `iris` from every phase's list; wait (bounded, ≤1500 frames) for
  `on('discPocket')` and note an `on('bossToll')` fired the same frame-batch — the pocket
  rides the real toll clock, no forced-toll seam needed (answering the plan's open
  question: none exists, and none is added).

Asserts (the pocket-law analogue of "annulus + depth-window law holds"):
1. **Arms on the toll, only in a fight** — `discActive` false after `armKnellgrave()`
   alone; true after the deterministic arm; `discPocket` carries `toll: 1` then `toll: 2`
   on a second arm (the schedule key counts).
2. **The shrink** — while active, `discR` strictly decreases frame-over-frame; final live
   frame `discR` ≈ `discGeom.rEnd` (±0.15); then `discActive` false and `discR === 0`
   (the last beat kills the pocket).
3. **Escalating ticks** — park mid-rim (`discX + discR·(1 − wallFrac/2)` recomputed per
   frame, `discY`): `discGraze` count > 0; the LAST inter-tick gap < the FIRST (the
   interval followed the radius down); `game.grazeCharge + game.consecutiveRings` strictly
   grew (the `bulletGraze` path, the shipped assert shape).
4. **Annulus, not radius** — park dead-centre `(discX, discY)` a full pocket: zero
   `discGraze`. Park outside (`discX + discR + 3`): zero. (Dead-centre is also never
   harmed BY the form: `game.health` untouched by the branch — the form never punishes.)
5. **Toll-count schedule** — pocket 2's `discR0` < pocket 1's `discR0` (read from
   `discPocket.r0`); after `boss.debugForceCard(null)` + a `breakShield`-driven phase
   advance (or a fresh encounter), the schedule re-offers (`toll` restarts at 1).
6. **Drawn-inside-the-rings honesty (the drift guard)** — during frames with
   `discAge/discDur ∈ [0.2, 0.8]` (sampled), the minimum lateral distance of live boss
   bullets from `(discX, discY)` is ≥ `discR − 0.4`: the drawn rim never leads the player
   outside the true safe middle. (This is the assert that BREAKS if someone retunes iris's
   `rad/contract/slow` without retuning `DISC_R_END` — the two are one anatomy.)
7. **Survival purity** — `debugForceCard('knellgrave_last')` +
   `debugRunSetpiece('lastToll')` + the deterministic arm attempt: `discActive` stays
   false for the whole ride (the stash and the branch are both setpiece-gated); after
   `k ≥ 1` clears the setpiece, a fresh arm works again.
8. **Coexist inert** — force `voidmaw`, `debugEmitAttack('iris', p, 1)` + 200 frames of
   orbit-the-centre driving: zero `discGraze`/`discPocket`, `discActive === false`,
   `discR === 0` throughout; and on knellgrave, `slipActive`/`orbActive` stay false (one
   grazeForm per boss, both directions).
9. **Existing suites untouched** — the knellgrave geometry block, WORST-FRAME overdraw,
   both music-death blocks, the full-roster lifecycle, rhythmprint/amberdiet: all must
   pass with zero test edits (no def bytes moved). `bossboot` green; `bossgate knellgrave`
   G1–G7 (the band is built hidden — the ENG-D/C4 precedent); `tricount`/tiershots
   unaffected (one 48-segment scene-level ring, built once).

---

## 6. SCOPE — build-queue row 12, decomposed honestly (do NOT over-scope)

Row 12 reads "ENG-A (bellMouth spiral) + ENG-B (bob-lock) + ENG-D (`shrinkDisc` branch —
label pre-wired) + ENG-H (hero) + def 4→5 phases". Verified state and the verdict:

| Piece | Status | This PR? |
|---|---|---|
| **`shrinkDisc` branch + safe Knellgrave activation** (this seam) | label live, branch absent | **YES — the whole PR**: branch + iris-branch arm + `armDiscPocket` + third band mesh + resets + debug state + gate block. **Zero def edits.** |
| ENG-H `pendulumSweep` setpiece | unbuilt (`SETPIECE_PATHS` has `lastToll` only for slot 10; the shipped "pendulum" is the model's `swingA`/`swingPivot` idle+charge sway) | **NO — defer.** The pocket anchors to the iris volley's centre and the boss.js toll clock; it never reads the pose or any setpiece. Nothing in §2–§3 references it. |
| ENG-A bellMouth `spiral` reroute | `spiral` still emits lane-anchored (E.0.6: "engine work, not a free reroute"); knellgrave has no `emitOrigins` | **NO — defer** to C.7-proper (with the forward contract below). |
| ENG-B bob-locked `movingGap` | seam shipped (hero STORMREND); knellgrave carries no `gapAnchor`; the bob source (pendulumSweep's k) doesn't exist | **NO — defer** (and carry ENG-B's flag: the ±14 sweep vs movingGap's ±9 clamp is C.7-proper's read-honesty item). |
| def 4→5 phases + `knellgrave_peal` card + iris→spiral kit change | pure C.7-proper design | **NO — defer.** |

**Why shrinkDisc does NOT require the pendulum**: the §5i.B form is anchored to "toll-ring
pockets", and the tolls + their ring-walls (the iris volleys) ship TODAY on every phase of
the live fight — the toll clock (`def.musicDies` volley-release block) and the anatomy
(the iris safe middle) are both shipped infrastructure. The pendulum is C.7's DREAD/motion
rework, orthogonal to the graze economy. Shipping the branch alone is also the SAFEST
possible discharge of the live-label debt: the smallest diff that makes the label true.

**The forward contract C.7-proper MUST honour** (the one real coupling, found in §1 drift
(e)): C.7's endgame removes `iris` from the def ("`iris` leaves the def entirely… kit
becomes `spiral/aimed/stream/movingGap/fan`") and makes the toll an EXPANDING bellMouth
`spiral`. That flip orphans this seam's arm site. The C.7 PR must therefore move the
`armDiscPocket(…)` call from the iris branch to its new toll pattern (for an expanding
wavefront the pocket inverts to "inside until the wall reaches you, bail before it
crosses" — same state, same band, same economy; recompute `dur` from the spiral's outward
speed and set the schedule against the wavefront's crossing radius), and the §5 gate block
must keep asserting `discPocket` still fires on knellgrave post-flip. `armDiscPocket` is a
named helper precisely so that move is one call site, not a redesign.

Diff surface of THIS PR: `boss.js` (module lets + one cluster branch + `armDiscPocket` +
one def-gated stash in the iris branch + reset/breakShield lines + one `initBoss` mesh
block + debug-state fields + one comment fix on `debugEmitAttack`), `tests/boss.mjs` (one
gate block). **No bossDefs.js, no model files, no config.**

---

## 7. RISKS / TUNABLES for the PR preview (the two that matter)

1. **Rim-ride difficulty and the toll→pocket causality read.** The pocket lives ~2.1–2.5s,
   shrinking while 1–2 aimed/fan/crossfire volleys land mid-pocket, under a boss whose
   body is mostly above the frame (stationY 20) — the band at the player plane is the ONLY
   pocket reference (deliberate, per C4's "the band mesh is the only honest reference").
   Headless proves reachability and payout; only the preview proves whether a weak-mobile
   player (a) connects the bell-strike to the disc appearing, and (b) can find the rim
   before it has shrunk past worth. Dials, in order: `DISC_WALL_FRAC` (0.30 — wider rim =
   easier), the `discR0` schedule (8.0 − 0.6·n, floor 5.6), the tick formula
   (`0.075/0.04/0.16` — richer or poorer), and if causality reads weak, an arm-beat flare
   on the band (opacity spike on `discPocket`, one line in the drive). Never dial: the
   annulus law, the last-beat death, the setpiece purity gate.
2. **Band prominence vs the FX-BUDGET law + payout generosity.** The disc is the roster's
   largest drawn band (R up to 8 at the player plane, ~half the frame height on approach) —
   additive surge-pink at ≤0.58 opacity with a 0.30 wall keeps it a ring-wall, not a filled
   disc, but the model worst-frame audit cannot see it (scene-level): the human must judge
   the true worst frame (double model toll-rings + pocket band + candle flood + shield) on
   preview. And frequency: iris is picked roughly every other toll, so a phase offers
   several pockets (the §5d "offered once per phase" is a floor, not a cap) — full-pocket
   rim rides pay ~6–8 ticks ≈ 2+ Surge rings. If preview reads it as a farm, the dials are
   a per-phase pocket cap or an arm cooldown (one guard in the stash), never the tick law.

---

## 8. GIT-STATUS SANITY (checkpoint protocol)

This checkpoint **created exactly one new file** — `reforged/boss-context/ENG-C7-SEAM.md`
(this spec). No source file, def, test, or doc was modified; no test, build, or game
process was run. Every symbol above — the `def.musicDies` toll block
(`bellToll`/`model.tollNow`/`emit('bossToll')`) and the entry-toll line, bossKnellgrave.js
`tollNow`/`lastTollAt`/`fireRing`/`orbiters`/`autoTollT`/`tollBeat`/`swingA`/`swingPivot`,
the `iris` branch (`rad/contract/slow/inSpd/anchorX/resolveGapAnchor/cx/cy/rings/pending`),
`executeAttack(id, player)`'s scope, the knellgrave def (`grazeForm: 'shrinkDisc'`,
`stationY`, `musicDies`, `muzzle: 'bellMouth'`, phases/cards/`lastToll`),
`SETPIECE_PATHS.lastToll`, the station-hold pose (`holdSway` default ±5 /
`def.stationY ?? B.fightHeight`), the grazeForm cluster order + the
slipstream/orbitAnnulus branches + `beamHeld/beamTick/beamGrace` + `bulletGraze`, the three
reset sites + the `breakShield` holdFlinch line + `armSetpieceForPhase`/`debugRunSetpiece`,
`initBoss`'s slip/orb band blocks, `bossDebugState`, `debugForceFight`/`debugForceCard`/
`debugEmitAttack`, config (`laneHalfWidth 13, laneMinY 2.5, laneMaxY 22, settleGap 30,
fightHeight 13, bulletSpeed 28, grazeGain 0.34`), and the tests/boss.mjs knellgrave
geometry / worst-frame / music-death / lifecycle blocks + the ENG-D gate block — was read
from live master in this session, cited by symbol, never by line number.
