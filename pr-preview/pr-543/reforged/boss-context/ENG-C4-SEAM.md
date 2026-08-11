# ENG-C4 SEAM — EITHERWING C.4: the `orbitAnnulus` grazeForm (fly the twins' figure-eight)

**Status**: PRE-BUILD spec (Fable checkpoint, 2026-07-10). Design only — no code changed.
**Plan rows**: ATTACK-REWORK-PLAN §C.4 dread row — "**graze-orbit**: ORBIT ANNULUS — co-rotate with
the figure-eight inside the drawn band; a full unbroken lap = +1 level + i-frame pulse (allocated
§5i.B, verbatim)"; §E.1 row D (grazeForm branches on the shipped tick economy); §E.1 build-queue
row 9 ("ENG-A (hero) + ENG-D (`orbitAnnulus`) + ENG-E (holder stagger)" — decomposed in §7 below).
**Law** (BOSS-DESIGN §5i.B Colossi row, verbatim): "**ORBIT ANNULUS** (5: co-rotate with the
figure-eight inside a drawn band; a full unbroken lap = +1 level + i-frame pulse)". Plus the graze
laws: dedup discrete / tick continuous; annulus not radius; reward bands DRAWN in-world; payout
richest at the scariest instant; reset-on-hit with mercy at max.
**Parent seam**: ENG-D-SEAM.md — SHIPPED. This form rides the SAME economy and band primitive;
nothing here is invented that slipstream didn't already prove.

Everything below was read from CURRENT master (post ENG-A / holder-volley / ENG-E / ENG-D / ENG-C).

---

## 1. DRIFT-CHECK — what is already live (verified by symbol)

- **The slipstream branch shipped exactly as its seam spec'd.** boss.js grazeForm cluster now ends
  with `if (def.grazeForm === 'slipstream') { … }` (comment banner "§5i.B SLIPSTREAM (ASHTALON's
  Colossi graze, C.2b, def-gated)"), sitting immediately BEFORE the `if (def.beamDuel)` block.
  **`orbitAnnulus` inserts directly AFTER the slipstream branch, before `def.beamDuel`** — the
  cluster's established append point.
- **The shared tick economy is live**: module lets `beamHeld` / `beamTick` / `beamGrace` (boss.js,
  beside `holdTier`/`holdFlinchDone`), payout via `bulletGraze(player)` → `game.grazeCharge +=
  CONFIG.BOSS.grazeGain * (game.adrenGainMult || 1)` (collision.js), ramp verbatim
  `beamTick = Math.max(0.18, 0.5 - beamHeld * 0.07)`.
- **The three reset sites carry the slip vars today** and the new orbit vars join the same lines:
  (1) the per-encounter reset — `slipRideT = 0; slipExposeT = 0; slipExposeUsed = false;
  slipWasLive = false;` under the `// §5i.B: beam-edge ramp + adrenaline ladder reset per
  encounter` comment; (2) `endEncounter()` — same line + the explicit band hide
  `if (slipBandMesh) { slipBandMat.opacity = 0; slipBandMesh.visible = false; }`;
  (3) `resetBoss()` teardown — same pair under `// §5i.B SLIPSTREAM teardown`.
- **The band primitive exists**: `slipBandMesh`/`slipBandMat` built once/hidden in `initBoss` —
  `THREE.RingGeometry(SLIP_R_IN, SLIP_R_IN + SLIP_WALL, 40)` + additive surge-pink `0xff4fd0`
  MeshBasicMaterial, `renderOrder = TIERS.arenaWall`, `frustumCulled = false`, driven with the
  eased-opacity pattern (`slipBandMat.opacity += (tgt - opacity) * Math.min(1, dt * 6)`).
- **EITHERWING's def carries NO `grazeForm`** (bossDefs.js `eitherwing:` block read end to end —
  confirmed absent) and **no def anywhere carries `'orbitAnnulus'`** (`grep grazeForm bossDefs.js`:
  slipstream/beamEdge/shadowRide/absorbColor/moteHarvest/shrinkDisc/holdFlinch/tideEdge/spraySoak/
  medley — no orbit label). So unlike `shrinkDisc` there is NO live-label footgun: the branch is
  born inert and EITHERWING opts in with one def line.
- **EITHERWING's setpieces** (bossDefs.js): `{ id: 'figureEight', atPhase: 1, dur: 8.0, moving:
  true }` (P2) and `{ id: 'figureEight', atPhase: 2, dur: 7.0, moving: true, dread: true }` (P3,
  Both Halves at Once). A setpiece arms ONCE per phase (`armSetpieceForPhase(phaseIdx)` at the
  fight-entry call site and again in `breakShield` at the phase advance) and clears at path end
  (`if (k >= 1) clearSetpiece();`), so the annulus window is one 8.0s beat in P2 and one 7.0s beat
  in P3 per encounter.
- **ENG-A is already fully opted-in on the def**: `emitOrigins: { crossfire: ['eitherTwinA',
  'eitherTwinB'], aimed: ['eitherMuzzle'], stream: ['eitherMuzzle'] }` — the twins are the live
  emitters TODAY (row 9's "ENG-A (hero)" is DONE; see §7).
- **ENG-E shipped its ledger on MARROWCOIL only** (`partParries` Map + `applyPartBreak`); the C.4
  holder-stagger reuse is explicitly deferred by both the ENG-E and holder-volley lessons.

---

## 2. THE ANCHOR — the moving midpoint, and why the centre is `pose.x/pose.y`

### 2a. The group pose IS the lemniscate's centre

During any moving setpiece the runner (fight branch, `setpieceT >= 0 && !shielded`) writes the
group pose from the path every frame:

```js
setpieceT += dt;
const k = Math.min(setpieceT / setpieceDef.dur, 1);
const p = SETPIECE_PATHS[setpieceDef.id](k);
pose.x = p.x; pose.y = p.y; pose.rel = p.rel;
```

`SETPIECE_PATHS.figureEight(k)` (boss.js), verbatim shape: plateau envelope
(`env = k < 0.15 ? k/0.15 : k > 0.85 ? (1-k)/0.15 : 1`), `LAPS = 2`, and

```js
x: Math.sin(th * 0.5) * 3 * env,               // slow group drift; the ±x scissor is the twins' local orbit
y: B.fightHeight + Math.sin(th) * 3.5 * env,   // slightly above/below player height on each pass
rel: B.settleGap + (dive - B.settleGap) * env, // station(26-ish) → rel −6 (past the camera) → station
```

So while `figureEight` runs, **`pose.x ∈ [−3, 3]` and `pose.y ∈ [9.5, 16.5]`** (fightHeight 13
± 3.5) — a slowly wandering centre — while `pose.rel` sweeps station → −6 → back ("the near lobe
crosses BEHIND the player"). `pose`, `setpieceT`, `setpieceDef` are module-scope and already read
by the cluster (the slipstream branch keys on exactly these) — **everything the annulus needs is
in scope; zero model coupling.**

### 2b. The twins are LOCAL children — and why the annulus does NOT track their midpoint

bossEitherwing.js: the twins orbit the group origin on a tilted lemniscate —
`orbitPhase += dt * (0.55 + charge * 0.25 + setpieceK * 0.3)`, `ORBIT_R = 5.2`, `TILT = 0.62`,
seats `posA = [cx + ax, cy + ay, ZSEP]`, `posB = [cx + bx, cy + by, -ZSEP]` →
`twinA.twin.position.set(...)`. Their world positions are published by name
(`twin.name = 'eitherTwinB' : 'eitherTwinA'` in `buildTwin`) and resolved per-volley by ENG-A's
`resolveEmitOrigins` via `partWorldPos` (test hook: the pre-existing `debugPartWorldPos` —
the ENG-A lesson's gotcha). **The graze branch does not need any of that.** Two reasons the
annulus centres on the GROUP pose, not the instantaneous twin midpoint:

1. **The true twin midpoint wobbles.** B rides 180° out of phase, so the x-components cancel but
   the tilted `sin(2θ)` component does NOT: midpoint = `(cx − ayr·st, cy + ayr·ct)` with
   `ayr = sin(2θ)·ORBIT_R·0.5·spread` — up to ~±2.6 local units at TWICE the orbit frequency. A
   band that shivered by several units at ~2 rad/s would be unflyable and would violate the
   drawn-in-world law (the drawn thing must be the paid thing). The group origin is the STABLE
   centre of the eight — which is what "co-rotate with the figure-eight" means.
2. **Precedent discipline**: slipstream/shadowRide/holdFlinch all compute their region from
   `pose`, never from model internals. The branch stays a pure READ on module state.

(The `cx/cy` drift term is ≤ ±0.6/±0.4 and the ~1.55 def scale applies to twin locals, not to
`pose` — the 1.5u wall band absorbs the residual difference between "group origin" and "where the
eight visually centres".)

### 2c. Geometry + reachability (chosen by construction, no clamp needed)

```
ORB_R_IN = 3.6    // inner radius — inside is the CORE: unpaid, no lap progress (annulus not radius)
ORB_WALL = 1.5    // the band; ticks + lap accrual live in [R_IN, R_IN + WALL)   → R_OUT = 5.1
```

- Vertical: worst top = 16.5 + 5.1 = **21.6 ≤ laneMaxY 22**; worst bottom = 9.5 − 5.1 = **4.4 ≥
  laneMinY 2.5** (config.js). Lateral: 3 + 5.1 = **8.1 ≤ laneHalfWidth 13**. The full annulus is
  reachable at every k **by construction** — no follower, no clamp (design divergence from
  slipstream, whose dive line exits the envelope; the eight never does). EITHERWING has no arena
  constrict, so `arenaHW` stays 13 for it.
- Lap feasibility: mid-band circumference ≈ 2π·4.35 ≈ 27u; at `lateralSpeed 24` /
  `verticalSpeed 18` (config.js) a mixed-axis orbit sustains ~15 u/s tangential → a lap in
  ~1.8s against a 7.0–8.0s window. **2–3 unbroken laps are earnable; one is comfortable.**
- The twins' own crossing radius (~5.2 local × scale ≈ 8u) sits OUTSIDE `R_OUT = 5.1` — at the
  near lobe (rel < 8, where the shipped `sfx.nearMiss` whoosh fires via `prevPassRel`) the bodies
  whip past just beyond the wall while twin-origin crossfire converges through it: **payout
  richest at the scariest instant**, no geometry collision.
- Live window = the whole setpiece (`setpieceT >= 0 && setpieceDef?.id === 'figureEight'`). Unlike
  the stoop (whose first 42% is a station climb, hence `SLIP_K_ON`) the eight moves from k = 0 —
  no K_ON gate. It runs at BOTH P2 and P3, which is teach-before-test (§5f law 4): P2's eight is
  the teach lap, P3's dread eight (with mirrored twin crossfire) is the exam.

---

## 3. THE BRANCH — pseudo-diff, by symbol

### 3a. Module state (boss.js, beside the `slipRideT` block)

```js
// §5i.B ORBIT ANNULUS (EITHERWING's Colossi graze, C.4) — fly the figure-eight WITH them.
let orbAcc = 0;         // unwrapped Δθ accumulator (radians) while band contact is unbroken
let orbPrevTh = null;   // last frame's atan2 about the pose centre (null = no contact yet)
let orbLaps = 0;        // laps completed THIS setpiece (debug/ceremony)
const ORB_R_IN = 3.6;   // safe-core radius — inside is UNPAID + no lap progress (annulus not radius)
const ORB_WALL = 1.5;   // the band; ticks + θ accrual live in [R_IN, R_IN+WALL)
```

No follower vars (`slipX/slipY` analogues) — the centre is `pose.x/pose.y` directly, frame-fresh
from the setpiece runner. No once-per-setpiece latch (`slipExposeUsed` analogue) — laps chain by
design; the jackpot self-limits (§3c).

### 3b. The branch (grazeForm cluster, appended AFTER `slipstream`, before `def.beamDuel`)

```js
// ---- §5i.B ORBIT ANNULUS (EITHERWING's Colossi graze, C.4, def-gated) — co-rotate
// with the twins' figure-eight inside a drawn band about the group centre. In-band
// contact pays ramping ticks (the beamEdge economy verbatim); a full UNBROKEN lap
// (|unwrapped Δθ| ≥ 2π) is the discrete jackpot: +1 adrenaline rung + an i-frame
// pulse. The band punishes NOTHING; the threat stays the twins' converging volleys.
// One grazeForm per boss; defs without grazeForm==='orbitAnnulus' are inert. ----
if (def.grazeForm === 'orbitAnnulus') {
  const live = setpieceT >= 0 && setpieceDef?.id === 'figureEight';
  if (live) {
    const dx = player.position.x - pose.x, dy = player.position.y - pose.y;
    const d2 = dx * dx + dy * dy, rOut = ORB_R_IN + ORB_WALL;
    const inBand = d2 >= ORB_R_IN * ORB_R_IN && d2 < rOut * rOut;
    if (inBand || beamGrace > 0) {
      const th = Math.atan2(dy, dx);
      if (orbPrevTh != null) {
        let dTh = th - orbPrevTh;
        dTh -= Math.round(dTh / (Math.PI * 2)) * Math.PI * 2;   // wrap to (−π, π]
        orbAcc += dTh;                                          // unwrapped accumulator
        if (Math.abs(orbAcc) >= Math.PI * 2) {                  // ---- THE LAP ----
          orbAcc -= Math.sign(orbAcc) * Math.PI * 2;            // keep the remainder (laps chain)
          orbLaps++;
          orbitLapJackpot(player);                              // §3c
        }
      }
      orbPrevTh = th;
    }
    if (inBand) {
      beamGrace = 0.3;                                          // bridge a wing-flick across the wall
      beamHeld += dt; beamTick -= dt;
      if (beamTick <= 0) {
        bulletGraze(player);                                    // ticks ride the graze economy
        emit('orbGraze', { held: beamHeld, acc: orbAcc });
        beamTick = Math.max(0.18, 0.5 - beamHeld * 0.07);       // the beamEdge ramp verbatim
      }
    } else if (beamGrace > 0) { beamGrace -= dt; }
    else { beamHeld = 0; beamTick = 0; orbAcc = 0; orbPrevTh = null; }   // real break → lap progress dies
  } else { beamHeld = 0; beamTick = 0; beamGrace = 0; orbAcc = 0; orbPrevTh = null; }
  // Drive the drawn band (see §3e): centre at the live pose, player plane.
  if (orbBandMesh) {
    const tgt = live ? 0.3 + Math.min(0.3, beamHeld * 0.06) : 0;
    orbBandMat.opacity += (tgt - orbBandMat.opacity) * Math.min(1, dt * 6);
    orbBandMesh.visible = orbBandMat.opacity > 0.02;
    if (orbBandMesh.visible) orbBandMesh.position.set(pose.x, pose.y, -(player.dist + 4));
  }
}
```

Divergences from slipstream, each deliberate:
- **The CORE is not "riding".** Slipstream's core is the safe pocket (its fantasy); the annulus's
  interior is where the dread's iris/crossfire converge, and — decisive — **θ accrual from inside
  a tight radius would let a player wiggle a 1u circle around the centre and farm laps.** In-band-
  only accrual is the §5i.B "kills parking exploits" clause applied to rotation. Dead-centre:
  unpaid, no progress, never harmful.
- **Grace-bridged accrual**: during grace frames θ still updates and accrues (wrap-safe: 0.3s at
  lap speed ≈ 0.9 rad < π), so a flick across the wall costs nothing — consistent with the shipped
  "a wing-flick across the wall doesn't reset". A REAL break zeroes `orbAcc` — a broken lap does
  not pay, ever.
- Direction-agnostic (`Math.abs`) — either rotation sense laps; the remainder subtraction keeps
  consecutive laps honest (no banked over-rotation loss).

### 3c. The lap jackpot ("+1 level + i-frame pulse"), on shipped seams only

```js
function orbitLapJackpot(player) {
  // +1 LEVEL — an adrenaline-ladder rung advance, paid through the ladder's own
  // ceremony: fast-forward the no-hit clock to the next rung threshold; the
  // NO-HIT ADRENALINE LADDER block (same fight tick, below the cluster) advances
  // the rung with its shipped bossNote/sfx/emit('adrenalineRung').
  if (adrenRung < 5) adrenT = Math.max(adrenT, ADREN_RUNGS[adrenRung]);
  // I-FRAME PULSE — the shipped i-frame field (collision.js `hit()` ignores
  // non-terrain causes while rollInvuln > 0). Non-stacking.
  player.rollInvuln = Math.max(player.rollInvuln, CONFIG.rollInvuln);   // 0.5s
  ui.bossNote?.('◎ FULL ORBIT ◎', 'FLY THE EIGHT — UNTOUCHABLE', 'gold', 2.0);
  model.flash?.(0.6); sfx.milestone?.();
  emit('orbitLap', { laps: orbLaps, held: beamHeld });
}
```

Cited seams, verified live:
- **"+1 level" = one `adrenRung`.** The NO-HIT ADRENALINE LADDER block (boss.js, banner
  `// ---- NO-HIT ADRENALINE LADDER (global §5i.B meta spine) ----`) advances via
  `while (adrenRung < 5 && adrenT >= ADREN_RUNGS[adrenRung]) { adrenRung++; … emit('adrenalineRung',
  { rung: adrenRung }); }` with `ADREN_RUNGS = [6, 13, 21, 30, 40]`, and publishes effects every
  tick: `setGrazeBonus(...)` (rung 1 magnet ×1.18, composed MAX with `soakT`) and
  `game.adrenGainMult = adrenRung >= 2 ? 1.5 : 1`. **The cluster runs BEFORE the ladder block in
  the same fight update** (slipstream ≈ ln 2687-region, ladder ≈ ln 2780-region — cited by order,
  not number), so the fast-forwarded `adrenT` converts to a rung + full ceremony the SAME frame.
  Reset-on-hit stays the ladder's own law (a hit zeroes `adrenT`/`adrenRung`; at rung 5 the
  ONE-HIT SHIELD absorbs — mercy at max, untouched). At rung 5 a lap still pulses + emits (the
  while-loop no-ops) — acceptable; the rung ceiling is the ladder's, not ours.
- **The i-frame field is `player.rollInvuln`** (player.js field, set to `CONFIG.rollInvuln`
  (= 0.5, config.js) in `tryRoll`, decayed in the player update; collision.js `hit()`:
  `if (player.rollInvuln > 0 && cause !== 'ground' && cause !== 'ceiling') return;`). There is no
  other shipped i-frame carrier; a new mercy field would mean new collision plumbing for zero fantasy
  gain. **Documented side effect (accepted as flavor)**: boss.js's reflect consumer gates on
  `if (player.rollInvuln > 0)` alone, so the pulse also swats reflectable ambers near the player
  for ≤0.5s (`reflectBossBullets(...)`). Bounded: non-stacking, once per ≥~1.8s lap, and the
  announce/streak side is deduped by `rollParried`. It makes the jackpot FEEL like a jackpot (the
  lap detonates the converging volley); if preview says too generous, the dial is a smaller pulse
  constant, never a touch on the shared reflect block.

### 3d. Resets — the three sites + the two arm seams

Join the existing slip lines verbatim-adjacent (one added line each):
1. per-encounter reset (under `// §5i.B: beam-edge ramp + adrenaline ladder reset per encounter`):
   `orbAcc = 0; orbPrevTh = null; orbLaps = 0;`
2. `endEncounter()`: same line, + the band hide beside slip's:
   `if (orbBandMesh) { orbBandMat.opacity = 0; orbBandMesh.visible = false; }`
3. `resetBoss()` teardown: same pair (coexist floor — no state or pink ring outlives teardown).

Per-arm hygiene (the slipstream `stoopingStrike` re-offer precedent, one line at BOTH seams —
`armSetpieceForPhase` and `debugRunSetpiece`, which each already carry
`if (sp.id === 'stoopingStrike') { slipExposeUsed = false; slipRideT = 0; }`):

```js
if (sp.id === 'figureEight') { orbAcc = 0; orbPrevTh = null; orbLaps = 0; }   // §5i.B ORBIT ANNULUS: fresh accumulator per eight (inert otherwise)
```

**Answering the ENG-D §5 open question directly**: `debugRunSetpiece` needs this per-arm
*accumulator* reset (stale-θ hygiene + test determinism across back-to-back gate blocks) but NO
re-offer latch — there is no `slipExposeUsed` analogue because laps are repeatable by design.
Keyed on the setpiece id alone, exactly like the slip line: plain-var reset, inert for every def
that never arms `figureEight`.

### 3e. The drawn band — a SECOND mesh, decided

**Decision: add `orbBandMesh`/`orbBandMat` — do NOT share `slipBandMesh`.** Rationale:
- The radii are **baked into the geometry**: `slipBandMesh` is `RingGeometry(3.2, 4.7, 40)`; the
  orbit band is (3.6, 5.1). A shared mesh could only differ by uniform scale, which preserves the
  radius *ratio*, not the wall width — the drawn band would lie about where the paid band is, the
  one sin the drawn-in-world law exists to prevent. Rebuilding geometry per form at runtime is
  churn for nothing.
- "One grazeForm per boss" means the two are never visible together, but sharing would couple the
  two branches' opacity drives and teardown lines for a saving of ~80 triangles built once and
  hidden (the ENG-D lesson: the hidden slip band didn't disturb `bossgate`/tiershots; a second one
  won't either — it is scene-level, outside the model `tricount`).

Build in `initBoss`, copying the slipBand block verbatim with the new radii: same
`0xff4fd0` surge-pink additive recipe (`transparent, opacity 0, AdditiveBlending, depthWrite:
false, DoubleSide, toneMapped: false, fog: false`), `name = 'orbBand'`, `renderOrder =
TIERS.arenaWall`, `frustumCulled = false`, `visible = false`. Driven only inside the branch (§3b);
hidden explicitly at teardown (§3d) — the slip precedent's explicit-hide discipline, kept.

### 3f. `bossDebugState()` — new fields

Extend the returned object (precedent: `slipActive, slipX, slipY, slipRideT, slipExposeT,
slipR: { in, wall }` are already published there) with:

```js
const orbActive = def?.grazeForm === 'orbitAnnulus' && setpieceT >= 0 && setpieceDef?.id === 'figureEight';
… , orbActive, orbAcc, orbLaps, orbR: { in: ORB_R_IN, wall: ORB_WALL }
```

The centre needs no new field — `poseX`/`poseY` are already in the debug state and ARE the centre
(§2a). The gate parks/steers the player from `poseX/poseY + orbR`.

---

## 4. EITHERWING OPT-IN (bossDefs.js) — one line

```js
eitherwing: {
  …
  grazeForm: 'orbitAnnulus',   // §5i.B Colossi graze (C.4) — co-rotate with the eight; a full unbroken lap = +1 rung + i-frame pulse
  setpieces: [
    { id: 'figureEight', atPhase: 1, dur: 8.0, moving: true },                // (unchanged)
    { id: 'figureEight', atPhase: 2, dur: 7.0, moving: true, dread: true },   // (unchanged)
  ],
  …
}
```

No phases/cards/rhythm/emitOrigins change — **rhythmprint byte-identical**, every other boss
byte-identical. The branch derives everything from the live pose at runtime.

---

## 5. GATE PLAN (headless, tests/boss.mjs) — mirror the shipped ENG-D block

Copy the shipped ENG-D block's harness shape (its `armAshtalon` closure → `boss.forceBoss(p,
BOSS_ORDER.indexOf('ashtalon')); boss.debugForceFight(p);` warm-up frames → `debugRunSetpiece` →
1/60 frame loop reading `bossDebugState()`), as `armEitherwing()` +
`boss.debugRunSetpiece('figureEight')`. Note `debugRunSetpiece` resolves the REAL def entry via
`def.setpieces.find((s) => s.id === id)` — for eitherwing that's the atPhase-1 entry, **dur 8.0**
(assert timing against 8.0; the `{ id, dur: 8.0 }` unknown-id fallback coincides here but the def
entry is what resolves — the ENG-D §6.5 loophole doesn't bite). Headless purity note (why the
ladder assert is stable): the boss test loop drives `boss.updateBoss` only — collision.js never
runs, so `game.bossHitsTakenRun` can't move and the ladder never resets mid-assert.

Driving pattern per frame while `st.orbActive`: steer the player AROUND the centre —

```js
phi += 3.0 * dt;   // rad/s → a lap in ~2.1s, comfortably inside the 8s window
p.position.x = st.poseX + (st.orbR.in + st.orbR.wall / 2) * Math.cos(phi);
p.position.y = st.poseY + (st.orbR.in + st.orbR.wall / 2) * Math.sin(phi);
```

Asserts (the lap-law analogue of the shipped "annulus + depth-window law"):
1. **Live only during the eight** — `orbActive === false` before `debugRunSetpiece('figureEight')`
   and after the path completes (`setpiece: false`).
2. **In-band ticks ramp + feed the bank** — `orbGraze` count > 0 over the orbit;
   `game.grazeCharge + game.consecutiveRings` strictly grew (the `bulletGraze` path, same assert
   shape as ENG-D's).
3. **A full lap fires the jackpot** — `on('orbitLap')` fired with `laps ≥ 1`;
   `on('adrenalineRung')` observed (`{ rung: 1 }` from a fresh encounter — the fast-forwarded
   `adrenT` converts the same tick); `p.rollInvuln > 0` on the lap frame (the pulse landed).
   A second continued lap fires `orbitLap` again with `laps: 2` (the remainder chains).
4. **Dead-centre is unpaid AND lap-dead** — park at `(st.poseX, st.poseY)` for ~2s: zero
   `orbGraze`, zero `orbitLap`, `orbAcc` stays 0 (core accrues nothing — the parking-exploit kill).
5. **Outside is nothing** — park at `poseX + 12`: zero ticks, zero laps.
6. **A broken lap does NOT pay** — drive φ through ~4.9 rad (~280°), park outside for > 0.3s (let
   the grace lapse; the ENG-D break-test's inner-loop pattern), re-enter and drive the remaining
   ~1.4 rad: assert NO `orbitLap` and `bossDebugState().orbAcc` restarted below the pre-break value
   (the accumulator died with the break).
7. **Coexist** — force `voidmaw`, `debugRunSetpiece('figureEight')` (the path exists in
   `SETPIECE_PATHS`, the fallback arms it), orbit the pose exactly as in (3): zero `orbGraze` /
   `orbitLap`, `orbAcc === 0`, `orbActive === false` throughout (the def-string gate holds even
   with the setpiece running). Also assert `slipActive === false` stays false for eitherwing
   (one grazeForm per boss — the sibling branch is inert).
8. **Existing suites untouched**: the shipped eitherwing twin-anatomy/ENG-A asserts
   (`boss.forceBoss(player, BOSS_ORDER.indexOf('eitherwing'))` block) and the full ENG-D block must
   stay green — no emission, rhythm, or def field other than `grazeForm` changes.

No `tricount`/`tiershots` impact (one more built-once hidden 40-segment ring, scene-level);
`bossboot` + `bossgate eitherwing` must stay green (hidden mesh, per the ENG-D lesson's precedent).

---

## 6. SCOPE — E-queue row 9, decomposed honestly (do NOT over-scope)

Row 9 reads "ENG-A (hero) + ENG-D (`orbitAnnulus`) + ENG-E (holder stagger)". Verified state:

| Piece | Status | This PR? |
|---|---|---|
| ENG-A twin-origin crossfire (the ±10 posts gone) | **SHIPPED** — def `emitOrigins.crossfire: ['eitherTwinA','eitherTwinB']`, live asserts in boss.mjs | No — done |
| ENG-A holder volley (`aimed`/`stream` from `eitherMuzzle`) | **SHIPPED** (holder-volley lesson; def carries all three keys) | No — done |
| **`orbitAnnulus` grazeForm** (this seam) | absent — no branch, no label anywhere | **YES — the whole PR**: branch + jackpot + second band mesh + resets + debug state + one def line + gate block |
| ENG-E holder stagger ("parry the holder's amber 3× mid-possession → handoff STAGGERS, eye DROPS") | ledger (`partParries`/`applyPartBreak`) shipped on MARROWCOIL only; the eitherwing reuse needs its own amber source-tags, threshold, and a model eye-drop API | **NO — defer** to its own PR (both the ENG-E and holder-volley lessons name it deferred) |
| C.4 dread `iris` centred on the thread midpoint | emitter/anchor work on another seam (ENG-B-family) | **NO — defer** |

So row 9's "the annulus lap pays" is THIS PR; "crossfire origins visibly track the lemniscate; the
±10 posts are gone" is already true on master. Diff surface: boss.js (module lets + one branch +
one jackpot helper + reset/arm lines + initBoss mesh block + debug-state fields), bossDefs.js (one
line), tests/boss.mjs (one gate block). Nothing else.

---

## 7. RISKS / TUNABLES for the PR preview (the two that matter)

1. **Lap effort vs. window** — `ORB_R_IN/ORB_WALL` and the implicit lap time (~1.8s) against the
   7.0s dread eight, flown while twin-origin crossfire converges through the band and the near
   lobe dives past the camera (`rel → −6`: for ~a beat the centre you're orbiting is visually
   BEHIND you — the band mesh at the player plane is the only honest reference, which is exactly
   why it's drawn). If weak-mobile players can't close a lap in the dread, the dials are the
   radii (smaller ring = shorter lap), never the accumulator law. Headless proves reachability;
   only the preview proves *feel*.
2. **Jackpot generosity** — one lap = +1 rung + 0.5s of i-frames that also auto-swat ambers (the
   `rollInvuln > 0` reflect consumer, §3c). Chained laps in P2's 8s teach window could bank rung
   2 (`adrenGainMult 1.5`) before the dread. Bounded (ladder resets on hit; pulse non-stacking;
   ~1.8s minimum between pulses), but the human should judge whether FULL ORBIT reads as earned
   catharsis or a farm; the dials are the pulse constant and, if needed, jackpot-once-per-eight
   (an `orbLaps`-gated ceremony downgrade) — both one-line tunes that don't touch the law.

---

## 8. GIT-STATUS SANITY (checkpoint protocol)

This checkpoint **created exactly one new file** — `reforged/boss-context/ENG-C4-SEAM.md` (this
spec). No source file, def, test, or doc was modified; no test, build, or game process was run.
Every symbol above (`SETPIECE_PATHS.figureEight`, the slipstream branch + `SLIP_*` consts, the
`NO-HIT ADRENALINE LADDER` block + `ADREN_RUNGS`/`adrenRung`/`setGrazeBonus`/`game.adrenGainMult`,
`bulletGraze`, `armSetpieceForPhase`/`debugRunSetpiece`/`clearSetpiece`, `bossDebugState`,
`slipBandMesh`/`initBoss`, `player.rollInvuln`/`CONFIG.rollInvuln`/collision `hit()`, the
eitherwing def + `emitOrigins`, `buildTwin`/`orbitPhase`/`ORBIT_R`/`TILT`/`eitherMuzzle`, the
ENG-D gate block in tests/boss.mjs) was read from live master in this session, cited by symbol,
never by line number.
