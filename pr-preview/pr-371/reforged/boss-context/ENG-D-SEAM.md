# ENG-D SEAM — new grazeForm branches on the shipped tick economy (hero: ASHTALON SLIPSTREAM, C.2b)

**Status**: PRE-BUILD spec (Fable checkpoint, 2026-07-09). Design only — no code changed.
**Plan row**: ATTACK-REWORK-PLAN §E.1 row D — "New grazeForm branches on the shipped tick economy
(`beamHeld/beamTick/beamGrace`): `slipstream` (C.2b), `orbitAnnulus` (C.4), `shrinkDisc` (C.7)…
Hero: ASHTALON slipstream (C.2b) — the simplest of the three."
**Laws** (BOSS-DESIGN §5i.B, quoted): "dedup discrete / tick continuous (one graze per bullet;
per-frame ticking only for beams/pockets — kills parking exploits); annulus not radius (a too-close
edge always exists); reward bands are DRAWN in-world (pink sheaths/annuli — rail depth is hard to
judge); payout richest at the scariest instant; reset-on-hit with a mercy shield at max."

Everything below was read from CURRENT master (post solar-spectacle merge, post ENG-A/A-R/E/B).

---

## 1. THE PATTERN — how a grazeForm branch is added

### 1a. The shipped detector family (what exists today)

All graze forms live in ONE def-gated cluster inside `boss.js`'s fight update, immediately after
the roll-parry block and before the `def.beamDuel` block. Each branch is entered ONLY on an exact
string match — the "one grazeForm per boss" convention is stated in the shipped comments:

> `// slot-6 continuous-graze detector + the beamHeld/beamTick/beamGrace ramp verbatim`
> `// (one grazeForm per boss); shipped bosses without grazeForm==='tideEdge' are inert. ----`

Shipped branches: `def.grazeForm === 'beamEdge'` (hollowgate), `'tideEdge'` (embertide),
`'shadowRide'` (brineholm), `'holdFlinch'` (karnvow). Plus two forms handled OUTSIDE the cluster:
`'absorbColor'` (thrumswarm, `updateSoakMotes` — "inert unless grazeForm='absorbColor'"),
`'moteHarvest'` (weftwitch, the cut-thread bloom). `'spraySoak'` (onewing) is honoured at the
frame-break vent ("data label is honoured here (the vent), inert for every other def").
`'shrinkDisc'` (knellgrave) and `'medley'` (unmasked) are **def labels with NO branch today**
(plan E.0.3) — see §5 scope.

### 1b. The SHARED tick economy (module state, boss.js)

```js
let beamHeld = 0;              // seconds of unbroken beam contact (the ramp)
let beamTick = 0;              // countdown to the next tick payout
let beamGrace = 0;             // seconds of contact-loss tolerated before reset
```

Reset in THREE places (a new form's state must join all three):
1. the per-encounter reset — the block commented
   `// §5i.B: beam-edge ramp + adrenaline ladder reset per encounter (rung-0 = neutral).`
   (`beamHeld = 0; beamTick = 0; beamGrace = 0;` beside `holdTier = 0; holdFlinchDone = false;`);
2. `endEncounter()` — `beamHeld = 0; beamTick = 0; beamGrace = 0; adrenRung = 0; adrenT = 0;`;
3. `resetBoss()` teardown — same line under
   `// §5i.B: neutralise the ladder's published effects on teardown (coexist floor).`

### 1c. The TEMPLATE branch, verbatim (beamEdge — copy this shape)

```js
// ---- §5i.B RIDE-THE-BEAM-EDGE (def-gated continuous graze) ----
if (def.grazeForm === 'beamEdge') {
  if (beamContact(player, 7)) {
    beamGrace = 0.3;                                   // bridge the gaps between a radial's bullets
    beamHeld += dt;
    beamTick -= dt;
    if (beamTick <= 0) {
      bulletGraze(player);                             // the payout rides the normal graze economy
      emit('beamGraze', { held: beamHeld });
      beamTick = Math.max(0.18, 0.5 - beamHeld * 0.07);   // the ramp: longer contact → faster ticks
    }
  } else if (beamGrace > 0) {
    beamGrace -= dt;                                   // grace: contact briefly lost, ramp holds
  } else {
    beamHeld = 0; beamTick = 0;                        // contact broken → the ramp resets
  }
}
```

The economy is always: **contact → refresh grace + accrue held + count down tick → payout
`bulletGraze(player)` + `emit('<form>Graze', { held })` + ramp the tick interval; brief loss →
grace decays, ramp holds; real loss → held/tick zero.**

Two detector styles exist for the "contact" predicate:
- **bullet-annulus** — `beamContact(player, depthHi)` (bossBullets.js), a PURE QUERY: "≥1 boss
  bullet ahead (0 < rel ≤ depthHi) whose lateral offset sits inside the graze annulus (outside its
  hit radius — a too-close edge always exists, annulus-not-radius law). PURE QUERY, no payout: the
  caller (boss.js) owns the tick clock, the ramp, and the dedup story". Used by beamEdge/tideEdge.
- **pose-derived geometric region** — shadowRide's `inLee` (player x within `halfW * 0.55` of
  `pose.x`, `player.position.y < pose.y - 2`, `Math.abs(pose.rel - B.settleGap) < 22`) and
  holdFlinch's `inLine`. No bullets consulted; the region is computed from the boss's live `pose`.

SLIPSTREAM is the **second style with a MOVING centre resolved from the live setpiece pose**.

### 1d. The payout sink (the Surge bank)

`bulletGraze(player)` (collision.js) — score + `nearMissSparks` + `sfx.graze(streak)` +
`emit('bossGraze')`, then:

```js
game.grazeCharge += CONFIG.BOSS.grazeGain * (game.adrenGainMult || 1);
while (game.grazeCharge >= 1) {
  game.grazeCharge -= 1;
  game.consecutiveRings = Math.min(game.consecutiveRings + 1, game.feverThreshold);
}
```

`consecutiveRings >= feverThreshold` is Surge-ready; in a boss, Surge is unleashed MANUALLY
(`input.surgeTap` → `activateSurge(player)` — "NB: no auto-trigger here").

### 1e. Coexist proof

A def without `grazeForm`, or with a different value, never enters the branch (exact string gate).
State vars are plain module lets zeroed at the three reset sites for every def (the shipped
precedent even resets holdFlinch vars unconditionally in `breakShield` — "CP2 per-phase re-offers
(def-gated setpiece… plain var resets, inert otherwise)"). New constants and a hidden mesh add
zero behaviour for un-opted defs.

---

## 2. SLIPSTREAM — the hero, in depth (ASHTALON, C.2b)

### 2a. What the plan demands (C.2, quoted)

> "DREAD: Stooping Strike | climb + 2–3s HOLD, then the squared dive (shipped setpiece) | `stream`
> raining from the diver + **SLIPSTREAM**: a drawn moving safe pocket trailing the dive line,
> collision walls at its edges | **surge INTO the dive gap** (the §5f-named answer, finally real)"

> "The dread rework is one graze-form ship + one rule: while the stoop's SLIPSTREAM pocket is
> ridden ≥0.8s, a Surge release inside it grants the exposure window… and the pocket's edge-walls
> make it the graze goldmine (per-frame ramping ticks, the §5i.B continuous-form detector… reuse it)."

E.2 row C.2b names the open design gaps this spec closes: *"what edge contact does is unspecified
(damage? push-out?…); the ≥0.8s ride timer and the Surge-release exposure hook have no defined
state carrier."*

**Decisions**: edge contact = **ramping graze ticks, never damage or push-out** (graze never
punishes — the §5i.B fairness floor; the "collision walls" are where the ticks live, the actual
punishment stays the existing dive-stream bullets outside the pocket). State carriers = two new
plain module vars (`slipRideT`, `slipExposeT`) + a per-stoop latch (`slipExposeUsed`), on the
holdFlinch plain-var precedent. **No new phase/state-machine state.**

### 2b. The anchor — ASHTALON's stoop, live representation

`bossDefs.js` ashtalon: `setpieces: [{ id: 'circlingPass', atPhase: 1, … }, { id:
'stoopingStrike', atPhase: 2, dur: 5.5, moving: true, dread: true }]`. C.2a already shipped the id
swap (P3 `spiralStream` → `fan`; see the def's `// §C.2a` comments). **The def has NO `grazeForm`
today** — C.2b adds it.

The path (`SETPIECE_PATHS.stoopingStrike(k)`, boss.js), verbatim:

```js
stoopingStrike(k) {
  const B = CONFIG.BOSS;
  const TOP_Y = B.fightHeight + 8, TOP_REL = B.settleGap + 4;   // (21, 34) — high and drawn back
  const DIVE_Y = 5, DIVE_REL = 10;                              // plunge low and near
  if (k < 0.42) {                    // climb + HOLD (the 2–3s ritual pose)
    const t = easeInOut(k / 0.42);
    return { x: 0, y: B.fightHeight + (TOP_Y - B.fightHeight) * t, rel: B.settleGap + (TOP_REL - B.settleGap) * t };
  }
  if (k < 0.72) {                    // STOOP — accelerate down and in
    const e = ((k - 0.42) / 0.30) ** 2;   // squared = the diving acceleration
    return { x: 0, y: TOP_Y + (DIVE_Y - TOP_Y) * e, rel: TOP_REL + (DIVE_REL - TOP_REL) * e };
  }
  const t = easeInOut((k - 0.72) / 0.28);   // recover to station
  return { x: 0, y: DIVE_Y + (B.fightHeight - DIVE_Y) * t, rel: DIVE_REL + (B.settleGap - DIVE_REL) * t };
}
```

The runner (fight branch, `setpieceT >= 0 && !shielded`): `setpieceT += dt; const k =
Math.min(setpieceT / setpieceDef.dur, 1); const p = SETPIECE_PATHS[setpieceDef.id](k); pose.x =
p.x; pose.y = p.y; pose.rel = p.rel;` — so during the stoop, `pose` IS the live dive line, and
`setpieceT`, `setpieceDef`, `pose` are module-scope, already read by the grazeForm cluster
(holdFlinch gates on `setpieceT < 0`). **Everything the pocket needs is already in scope.**

Dive numbers: with `dur: 5.5`, the dive segment (k 0.42→0.72) lasts 1.65s and drops y 21→5
(~9.7 u/s); recover (k 0.72→1) lasts 1.54s. Rideable window ≈ 3.2s — the ≥0.8s ride is earnable
with margin.

### 2c. The pocket geometry (the moving safe pocket + its walls)

The pocket is a **disc in the player plane** (like shadowRide's lee — player rel is 0 by
definition; only x/y matter) whose centre is a **lagged follower of the live dive pose** (the wake
trails the dive line), clamped to the flyable envelope for fairness:

```
SLIP_R_IN   = 3.2     // safe-core radius (inside: riding, no ticks — annulus not radius)
SLIP_WALL   = 1.5     // the edge-wall band; ticks live in [R_IN, R_IN+WALL)
SLIP_FOLLOW = 4       // 1/s follower rate — the wake lag (~2.4u at full dive speed)
SLIP_K_ON   = 0.42    // pocket is LIVE from the dive knee to path end (k in [0.42, 1])
SLIP_Y_MIN  = 4, SLIP_Y_MAX = 18   // centre clamp — the full annulus stays reachable
                                   // (player envelope: laneHalfWidth 13, laneMaxY 22)
```

Per frame while active: `slipX += (pose.x - slipX) * Math.min(1, dt * SLIP_FOLLOW)` (same for
`slipY` against `clamp(pose.y, SLIP_Y_MIN, SLIP_Y_MAX)`; also clamp `slipX` to
`±(arenaHW - SLIP_R_IN - SLIP_WALL)` — `arenaHW` is the live module var the constrict showpiece
drives, so the pocket obeys a narrowed arena by construction). On activation (first active frame)
snap the follower to the clamped pose so the pocket never sweeps in from a stale position.

- **riding** = `dx*dx + dy*dy < (SLIP_R_IN + SLIP_WALL)²` where `dx = player.position.x - slipX`
  etc. Riding accrues `slipRideT += dt` and refreshes `beamGrace = 0.3`.
- **edge contact (the wall)** = riding AND `dx*dx + dy*dy >= SLIP_R_IN²` — the annulus band. Only
  edge contact runs the `beamHeld/beamTick` ramp + `bulletGraze` payout (annulus-not-radius:
  parking dead-centre is safe but UNPAID; hugging the wall while the dive-stream whips past is the
  goldmine — payout richest at the scariest instant).
- leaving the pocket: `beamGrace` bridges 0.3s (a wing-flick across the wall doesn't reset), then
  `beamHeld = 0; beamTick = 0; slipRideT = 0` — the ramp AND the ride timer reset together.

### 2d. The exact pseudo-diff, by symbol

**(1) boss.js module state** — beside `let holdTier = 0; … holdFlinchDone`:

```js
let slipRideT = 0;        // §5i.B SLIPSTREAM: seconds riding the stoop's wake pocket (grace-bridged)
let slipExposeT = 0;      // >0 = the "surge INTO the dive gap" exposure window (amplified chip)
let slipExposeUsed = false; // once per stoop (re-offered when a stoop arms)
let slipX = 0, slipY = 0; // the pocket centre (lagged follower of the dive pose)
```

**(2) boss.js — the new branch**, appended to the grazeForm cluster after `holdFlinch`:

```js
// ---- §5i.B SLIPSTREAM (ASHTALON's Colossi graze, C.2b, def-gated) — ride the
// stoop's WAKE: a drawn moving safe pocket trailing the dive line; its edge-walls
// are the graze goldmine (ramping ticks — the beamEdge economy verbatim). Riding
// ≥0.8s arms the §5f answer: a Surge release inside grants the exposure window.
// One grazeForm per boss; defs without grazeForm==='slipstream' are inert. ----
if (def.grazeForm === 'slipstream') {
  const live = setpieceT >= 0 && setpieceDef?.id === 'stoopingStrike'
    && (setpieceT / setpieceDef.dur) >= SLIP_K_ON;
  if (live) {
    if (!slipWasLive) { slipX = pose.x; slipY = clampY(pose.y); }   // snap on arm
    slipX += (clampX(pose.x) - slipX) * Math.min(1, dt * SLIP_FOLLOW);
    slipY += (clampY(pose.y) - slipY) * Math.min(1, dt * SLIP_FOLLOW);
    const dx = player.position.x - slipX, dy = player.position.y - slipY;
    const d2 = dx * dx + dy * dy, rOut = SLIP_R_IN + SLIP_WALL;
    if (d2 < rOut * rOut) {
      beamGrace = 0.3; slipRideT += dt;
      if (d2 >= SLIP_R_IN * SLIP_R_IN) {          // the WALL — annulus, not radius
        beamHeld += dt; beamTick -= dt;
        if (beamTick <= 0) {
          bulletGraze(player);                    // the payout rides the graze economy
          emit('slipGraze', { held: beamHeld, ride: slipRideT });
          beamTick = Math.max(0.18, 0.5 - beamHeld * 0.07);   // the beamEdge ramp verbatim
        }
      }
    } else if (beamGrace > 0) { beamGrace -= dt; }
    else { beamHeld = 0; beamTick = 0; slipRideT = 0; }
  } else { beamHeld = 0; beamTick = 0; beamGrace = 0; slipRideT = 0; }
  slipWasLive = live;
  if (slipExposeT > 0) slipExposeT = Math.max(0, slipExposeT - dt);
  // drive slipBandMesh here — see (5)
}
```

(`clampX/clampY` inline as described in §2c; `slipWasLive` is one more plain let.)

**(3) `activateSurge(player)`** — after `emit('surge');`, before `surgeSeq = { … }`:

```js
// §5f C.2b "surge INTO the dive gap": releasing Surge while RIDING the stoop's
// slipstream pocket (≥0.8s unbroken) EXPOSES the hunter — amplified chip window.
if (def?.grazeForm === 'slipstream' && !slipExposeUsed && slipRideT >= 0.8) {
  slipExposeUsed = true; slipExposeT = 2.5;
  ui.bossNote?.('✦ INTO THE DIVE GAP ✦', 'THE HUNTER IS EXPOSED', 'gold', 2.4);
  model.flash(0.8); sfx.milestone?.();
  emit('slipExposed', { ride: slipRideT });
}
```

The unshielded Surge release already resolves as a real chip — `strikeSurge`:
`if (shielded) breakShield(player); else { … damageBoss(B.surgeBeamDamage ?? 14, 'surge') }` —
and the stoop always runs unshielded (the runner gates `setpieceT >= 0 && !shielded`), so the
sequence is: release inside the pocket → exposure opens → the surge beam itself lands amplified →
2.5s of amplified follow-up chip while Surge's double-rider fire is live. Counter-verb = surge,
non-default, exactly the §5f-named answer.

**(4) `damageBoss`** — one line beside the shipped amp precedent
`if (crippled) amount *= 2.4;`:

```js
if (slipExposeT > 0) amount *= 2;   // §5f C.2b exposure window (only ever set for slipstream defs)
```

**(5) The drawn band** — see §2e.

**(6) Resets** — add `slipRideT = 0; slipExposeT = 0; slipExposeUsed = false; slipWasLive = false;`
at the three sites of §1b, and re-offer per stoop in `armSetpieceForPhase` /
`debugRunSetpiece` (`slipExposeUsed = false; slipRideT = 0;` — plain var reset, inert otherwise,
the breakShield precedent).

**(7) `bossDebugState()`** — extend the returned object (precedent: `soakT`, `ghostFrameHits`
already live there) with `slipX, slipY, slipRideT, slipExposeT, slipActive` (+ export
`SLIP_R_IN`/`SLIP_WALL` via the state or a `debugSlipGeom()` — the test must park on the wall).

### 2e. The drawn-in-world band (new primitive, on the beamDuel precedent)

**There is NO shipped reward-band draw primitive.** Survey of the live code:
- beamEdge/tideEdge draw nothing — their "band" is carried by the bullets themselves
  (bossBullets.js: graze-bait darkens the core to "a hollow 'donut' — reads as a DIFFERENT thing";
  the annulus is per-bullet).
- shadowRide's band is model-side (the leviathan's bulk IS the lee); holdFlinch's line is implied
  by the lance. Neither draws an overlay.
- The closest precedent is EMBERTIDE's duel beam, built once hidden in `initBoss(sc)`:
  `// EMBERTIDE BEAM DUEL beam: a bright additive shaft locked from the crest to the ship during a
  duel (built once, hidden; only ever shown for def.beamDuel).` and driven per-frame:
  `beamDuelMat.opacity += (tgt - beamDuelMat.opacity) * Math.min(1, dt * 6);
  beamDuelMesh.visible = beamDuelMat.opacity > 0.02;`

**Spec**: add `slipBandMesh` in the same `initBoss` block — a
`THREE.RingGeometry(SLIP_R_IN, SLIP_R_IN + SLIP_WALL, 40)` +
`THREE.MeshBasicMaterial({ color: 0xff4fd0, transparent: true, opacity: 0,
blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
fog: false })` — **surge-pink** (0xff4fd0 is the shipped reward hue: the surge beamGlow and the
`strikeSurge` burst; the soak motes are described as "surge-pink stays the reward colour — the
graze grammar outranks her gold"). Built once, hidden; renderOrder below the bullet tiers so
bullets always read on top.

Per-frame drive (inside the branch): position at `(slipX, slipY, -(player.dist + 4))` (a small
fixed rel ahead so the annulus reads at the player plane without sitting in the camera), face the
camera, opacity target `live ? 0.3 + Math.min(0.3, beamHeld * 0.06) : 0` (brighter as the ramp
climbs — the payout is SEEN ramping), eased exactly like `beamDuelMat`. During the HOLD
(k 0.2→SLIP_K_ON) fade in at ≤0.12 opacity as the telegraph ("the hold IS the rest" — the band
forming is the tell to get under the dive line). Hide (`opacity = 0; visible = false`) in
`endEncounter` and `resetBoss` (the beamDuel mesh relies on the branch to fade — a fight torn down
mid-stoop must not strand a pink ring; make this explicit).

### 2f. Fairness

- The pocket punishes NOTHING: no damage, no push-out, no reset-on-graze; the only "collision" is
  the shipped dive-stream bullets that exist anyway (no emission change — §4).
- Reachability: centre clamped to y [4, 18] / x inside `arenaHW` minus the annulus; follower lag
  (rate 4/s vs ~9.7 u/s dive) softens the chase; the ride needs only 0.8 of ~3.2 rideable seconds.
- Parking is unpaid (annulus-not-radius) but never harmful; the ramp resets on real exit only
  (0.3s grace, the shipped bridge).
- Reset-on-hit stays global (a hit already wipes `consecutiveRings`/`grazeCharge` in
  collision.js's `hit()` — the bank is the thing at stake; branch-local ramp semantics mirror the
  four shipped branches, which do not add per-branch hit resets).

---

## 3. ASHTALON OPT-IN (bossDefs.js)

One def line plus nothing else — the stoop setpiece it needs is already shipped:

```js
ashtalon: {
  …
  grazeForm: 'slipstream',   // §5i.B Colossi graze (C.2b) — ride the stoop's wake; surge INTO the dive gap
  setpieces: [
    { id: 'circlingPass',   atPhase: 1, dur: 7.0, moving: true },
    { id: 'stoopingStrike', atPhase: 2, dur: 5.5, moving: true, dread: true },   // (unchanged)
  ],
  …
}
```

C.2a (the P3 `spiralStream` → `fan` id swap) is already live in the def — this PR is C.2b only.
No phases/cards/rhythm change (`rhythmprint byte-identical` stays true). The pocket derives
everything else (centre, timing) from the live setpiece pose at runtime.

---

## 4. GATE PLAN (headless, tests/boss.mjs)

Mirror the shipped gate — its exact banner is
`ok('beamEdge detector: annulus + depth-window law holds (continuous graze, §5i.B)')` — with a
new block, driving pattern copied from the karnvow holdFlinch live drive (`forceBoss` →
frame loop → `boss.updateBoss(dt, player, t)` with `boss.bossDebugState()` reads) plus
`debugForceFight` + `debugRunSetpiece('stoopingStrike')` (the shipped capture seam: "arm a named
setpiece LIVE from the current fight… without having to drive the boss down to the phase that
arms it").

```
forceBoss(player, BOSS_ORDER.indexOf('ashtalon')); debugForceFight(player);
debugRunSetpiece('stoopingStrike');
on('slipGraze', …); on('slipExposed', …);
frame loop (dt = 1/60, player.dist += cruiseSpeed*dt, fever decay as in the karnvow block):
  st = bossDebugState();
  when st.slipActive → park the player ON THE WALL: (st.slipX + (R_IN + WALL/2), st.slipY)
```

Asserts (the "annulus + depth-window law" analogue for a pose-region form):
1. **The pocket exists only while the stoop's dive is live** — `slipActive` false before
   `debugRunSetpiece` and after the path completes (`setpiece: false` in debug state).
2. **Riding the wall ramps** — `slipGraze` ticks fire, tick count over the ride is ≥ the count
   implied by the un-ramped 0.5s interval (the ramp accelerated), `game.grazesRun` grew, and
   `slipRideT` climbs monotonically while parked.
3. **Annulus, not radius** — park dead-centre (`st.slipX, st.slipY`) for 1s: `slipRideT` grows but
   NO `slipGraze` tick fires (the too-close core is unpaid).
4. **Break → reset** — park at `st.slipX + 12`: after the 0.3s grace, `bossDebugState().slipRideT
   === 0` (and the next ride starts its ramp cold — first tick back at the 0.5s interval).
5. **The pocket stays in the arena** — every active frame: `|slipX| <= CONFIG.laneHalfWidth -
   R_OUT` and `SLIP_Y_MIN <= slipY <= SLIP_Y_MAX` (with laneMaxY 22 / laneHalfWidth 13).
6. **Feeds the Surge bank** — `game.grazeCharge + game.consecutiveRings` strictly grew across the
   ride (the `bulletGraze` path, same assert shape as the shipped "a graze charges the surge
   meter").
7. **The §5f answer** — ride ≥0.8s, then `game.consecutiveRings = game.feverThreshold;
   input.surgeTap = true;` → `slipExposed` fires, `slipExposeT > 0`; drive frames until the
   `bossHit` with `kind: 'surge'` and assert the hp delta ≈ 2 × `B.surgeBeamDamage ?? 14` (the
   amp landed); a release with `slipRideT < 0.8` (fresh stoop, immediate tap) does NOT fire
   `slipExposed`.
8. **Coexist** — drive one non-slipstream boss (e.g. voidmaw) a few hundred frames and assert no
   `slipGraze`/`slipExposed` ever fires and `slipRideT` stays 0 (the inert-branch floor).

**No emission/rhythm change to verify**: the branch calls no spawn/emit-attack path — its only
writes are the graze economy (`bulletGraze`), the two new vars, and the band mesh. The proof is
structural (review) + the existing suites: the shipped rhythmprint/def gates and
`tests/run-all.mjs` must stay green untouched, and `tricount`/`tiershots` are unaffected (one
40-segment ring mesh, built once). A graze form is a READ on the existing fight, exactly like
shadowRide.

---

## 5. FORWARD CONTRACTS + SCOPE (orbitAnnulus, shrinkDisc)

Both ride the SAME economy (branch in the cluster, `beamHeld/beamTick/beamGrace` verbatim,
`bulletGraze` payout, drawn band via the §2e primitive, debug-state extension, three-site resets).
What each ADDS beyond the slipstream pattern:

- **`orbitAnnulus` (EITHERWING, C.4)** — §5i.B: "co-rotate with the figure-eight inside a drawn
  band; a full unbroken lap = +1 level + i-frame pulse." Anchor: the `figureEight` setpiece path
  (group rel-dive: "rel sweeping 26 → −6 → back") + the twins' local lemniscate in
  bossEitherwing.js (`orbitPhase += dt * (0.55 + charge * 0.25 + setpieceK * 0.3)`); the C.4
  emitter seam already publishes the twins' live positions (bossDefs: "§ENG-A: crossfire fires
  from the two twins' LIVE lemniscate positions"). NEW pieces: an annulus about the moving
  lemniscate midpoint (`pose.x/pose.y` — the group IS the midpoint), an **unwrapped angular
  accumulator** (Δθ of `atan2(player.y - pose.y, player.x - pose.x)` summed while contact is
  unbroken; |acc| ≥ 2π → lap), and the lap payout (+1 level = an `adrenRung` advance via the
  shipped ladder seam, + `player.rollInvuln` pulse for the i-frame). Ticks while in-band ride the
  shared ramp; a lap is the discrete jackpot.
- **`shrinkDisc` (KNELLGRAVE, C.7)** — §5i.B: "toll-ring pockets — escalating ticks, bail on the
  last beat." Anchor: the toll clock (boss.js drives `model.tollNow?.(time)` at each ring-strike;
  bossKnellgrave's `tollNow(time) { lastTollAt = time; fireRing(time); }` owns the expanding
  ring-walls). NEW pieces: a safe-disc radius schedule keyed to the toll count (shrinks each
  toll), tick interval scaled by the shrink (escalating — richest on the last beat), and the
  bail read (the final toll's wall crossing the disc; the punish is the existing ring-wall
  bullets, never the form). ⚠ **The def label is ALREADY LIVE** — bossDefs knellgrave carries
  `grazeForm: 'shrinkDisc'` with no branch (plan E.0.3: "A def label with no engine consumer").
  **The moment a `shrinkDisc` branch exists it activates on the shipped roster.**

**Scope recommendation**: ENG-D ships the branch pattern + SLIPSTREAM on ASHTALON **only**.
`orbitAnnulus` lands with the C.4 Eitherwing PR (it needs the twins'-seam context anyway);
`shrinkDisc` lands with the C.7 Knellgrave PR — NOT as a cheap follow-on — because of the live
label: shipping the branch outside C.7 would hot-activate an untuned form on a shipped boss,
violating "never break the shipped roster." Cheap-follow-on is fine for orbitAnnulus if C.4 slips,
since eitherwing's def carries no grazeForm today (opt-in stays a def edit).

---

## 6. DRIFT & RISKS

1. **No drawn-band primitive exists — one must be added** (§2e). Bounded: one RingGeometry mesh on
   the beamDuel built-once/hidden/eased pattern. Risks: (a) visual collision with the lock/reticle
   rings and bullet outlines — mitigate with surge-pink 0xff4fd0 (the established reward hue; amber
   = parry, magenta = danger, cyan = lock) and a renderOrder below bullets; (b) stranded visibility
   on teardown — hide explicitly in `endEncounter`/`resetBoss` (the beamDuel mesh has no such
   guard; do better).
2. **The exposure needs NEW (small) state, not a reused window** — surveyed: `staggerT` is
   swarm-coupled (`condenseInvuln` locks/consumes it), the lock-layer `exposureWindow`
   (`!shielded && chargeT <= 0 && pending.length === 0 && attackTimer > 0`) is a teach-context
   READ, not a damage window. The carriers are `slipRideT`/`slipExposeT`/`slipExposeUsed` plain
   vars + the shipped amp seam in `damageBoss` (`if (crippled) amount *= 2.4;` precedent). Risk:
   ×2 for 2.5s stacking with Surge's double-rider could over-reward P3 — bounded by
   once-per-stoop (`slipExposeUsed`) and by Surge itself being the banked resource; tune the
   multiplier (2.0 → 1.6) on preview feel, not in this seam.
3. **Pocket chase fairness** — the squared dive moves ~9.7 u/s vertically; if the follower + clamps
   are mistuned the pocket outruns weak-mobile players and the ≥0.8s ride becomes elite-only.
   Gate 5 pins the envelope; the human judges feel on the PR preview (the checkpoint's tunables:
   `SLIP_FOLLOW`, `SLIP_Y_MIN/MAX`, `SLIP_R_IN`, `SLIP_WALL`).
4. **Ramp-state sharing** — `beamHeld/…` are shared across forms ("one grazeForm per boss" makes
   this safe), but slipstream also zeroes them when the pocket is not live (the stoop is the only
   graze venue for ashtalon — deliberate, mirrors holdFlinch's `setpieceT < 0` discipline). Keep
   the holdFlinch phase-seam precedent in mind: `breakShield` already zeroes the ramp def-gated on
   `'holdFlinch'`; slipstream needs no such line because its branch zeroes on every non-live frame.
5. **`debugRunSetpiece` default-arm loophole** — it falls back to `{ id, dur: 8.0, moving: true }`
   for an unknown id; the gate must arm the REAL def entry (ashtalon has it, so `sp` resolves to
   `dur: 5.5` — assert `slipActive` timing against 5.5, not 8).
