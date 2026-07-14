# ENG-H SEAM — KNELLGRAVE C.7-proper: the `pendulumSweep` setpiece + the iris→bellMouth-spiral toll flip (+ bob-locked gap, 4→5 phases, The Cracked Peal)

**Status**: PRE-BUILD spec (Fable checkpoint, 2026-07-10). Design only — no code changed.
**Plan rows**: ATTACK-REWORK-PLAN §C.7 "the toll must radiate" (all five table rows); §E.1
build-queue row 12 — the parts the shipped shrinkDisc PR (ENG-C7-SEAM §6) deliberately
deferred: **ENG-A bellMouth spiral + ENG-B bob-lock + ENG-H hero setpiece + def 4→5 phases +
`knellgrave_peal` card + the iris→spiral kit change**; §E.2 C.7 gaps (i)/(iii)/(iv)/(v);
§A.10 (the DULL verdict this PR discharges: "the bullets contradict the sound", "'Pendulum
Sweep' contains no pendulum", "Sentinel vocabulary at a World-Ender slot", "four cards vs
the §5g WE floor").
**Laws**: BOSS-DESIGN §5c WORLD-ENDERS contract ("Attacks originate OFF-lane… **pendulum
sweeps across**"), the §5d slot-10 sheet ("each toll emits **expanding** ring-walls (iris
inverted)… pendulum swings cross the lane"), §5g WE row ("5–6 cards"), the FX-BUDGET /
overdraw law ("NEVER on stacked additive volumes"; knellgrave's worst-frame gate: ≤2 large
additive/fresnel fills), §5f law 7 (emitter = organ), §5i.C (survival amber exemption —
`aimed` stays in the survival phase list).
**Parent seams**: ENG-C7-SEAM.md (shrinkDisc — SHIPPED; its §6 forward contract is a hard
input here), ENG-B-SEAM.md (gapAnchor — SHIPPED; its §6 C.7 row + §7.3 clamp-honesty flag),
ENG-A (per-organ emit — SHIPPED; `stream` is already wired per-tick, `spiral` is not).

Everything below was read from CURRENT master in this session, cited by symbol, never by
line number.

---

## 1. DRIFT-CHECK — what is actually live (each feeds a §2–§5 decision)

- **knellgrave really has 4 phases + 4 cards + no `knellgrave_peal`** (bossDefs.js
  `knellgrave`: `phases` P1–P4 all carrying `iris`; `cards` = `knellgrave_first/second/
  sweep/last`). The def-schema gate (tests/boss.mjs §1b) enforces `cards.length ===
  phases.length`, **`card.atFrac === its phase's atFrac`**, unique ids, name ≤44 chars with
  the `" — "` grammar, and EXACTLY ONE dread card, LAST. So 4→5 phases forces a 5-card
  ladder with aligned atFracs — the plan's ladder is buildable as-is. (Plan gives the
  Second Toll 0.72; shipped is 0.70 — keep 0.70, zero value in moving it.)
- **`spiral` IS lane-anchored today** (E.0.6 confirmed): the base `spiral` branch in
  `executeAttack` emits `emitBoss(anchorX, B.fightHeight, cos(a)*9, sin(a)*9, -slow)` with
  `slow = closing * 0.78`, `n = quality < 0.75 ? 8 : 11`, `anchorX = clamp(player.x*0.7,
  ±8)`. It never reads `emitOrigin` or `resolveEmitOrigins`. **But `aimed`/`fan` already
  emit from the bell**: `resolveEmitOrigin(player)` (first line of `executeAttack`)
  resolves `def.muzzle` (`'bellMouth'`) via `model.partWorldPos` into `emitOrigin` with a
  pose fallback — so during any setpiece the aimed tolls already ride the moving mouth.
  Only the radial needs ENG-A wiring.
- **`stream` re-resolves ENG-A origins PER TICK** (`resolveEmitOrigins('stream', player)`
  inside each tick's `pending` fire closure). The plan's "stream pouring from bellMouth
  while the muzzle itself swings" is therefore **pure def data**: `emitOrigins: { stream:
  ['bellMouth'] }`. No engine edit for the hose.
- **DRIFT — the hemiola needs NO new quantizer hook.** E.2 C.7 (iii) says "a subdivision
  hook on the `rhythm.ticket` quantizer that doesn't exist". Verified false twice over:
  (a) bossRhythm.js already implements `'1/8'` (`quantize()`: `div = R.ticket.quantize ===
  '1/8' ? beatClock.beatLen / 2 : beatClock.beatLen`, with a 0.28s rest floor), and (b) the
  phrase machine already has `{ kind: 'burst', attack, count, gap }`. Two spiral releases
  `count: 2, gap ~0.12` land ≈ `gap + telegraphInstant (0.5)` ≈ 0.6–0.8s apart — the
  double-strike inside a 1.25–1.5s phase gap IS the hemiola, as phrase data.
- **DRIFT — the beat clock SURVIVES the music-death.** `musicKill()` (sfx.js) only fades
  `musicBus.gain` to 0; `getBeatClock()` nulls on `!musicActive || bgSuspended || !ctx`,
  none of which musicKill touches — so knellgrave's `ticket` quantization is genuinely
  live during the silence, riding the muted track's grid. (Fictional nit — "the toll is
  the only clock" is audio-true, grid-false — no action; noted so nobody "fixes" it.)
  Headless, `simulatePhase` passes no beatClock → **rhythmprint/amberdiet never see the
  ticket**; phrase edits are the only print movers.
- **The shipped shrinkDisc grew a cooldown the seam didn't spec**: the iris-branch arm is
  gated `… && discCd <= 0` with `discCd = 1.6` on arm and a per-frame decrement at the top
  of the `def.grazeForm === 'shrinkDisc'` cluster branch ("a breather between pockets").
  §3 keeps it — and it is load-bearing for the Peal (the second toll of a burst can never
  double-arm; see §3d).
- **The shipped ENG-C7 gate block drives pockets via `debugEmitAttack('iris', …)`** and
  asserts the radius **shrinks monotonically to `discGeom.rEnd`** and that **successive
  pockets open smaller** (`r0s[1] < r0s[0]`). All three invert or dissolve under the flip —
  the block must be rewritten in place, not merely kept green (§7).
- **`dread: true` on a mid-fight setpiece would fire the Last Toll's one-way reveal
  early.** bossKnellgrave.js: `setSetpiece(k, sdef)` sets `dreadK = (sdef && sdef.dread) ?
  setpieceK : 0`, and `tickBody` ratchets `skyOpen = Math.max(skyOpen, clamp01((ruinK -
  0.5) / 0.2) * dreadK)` — the "BELL BREAKS ALL THE WAY THROUGH" sky-tear, explicitly "a
  P4-only beat" that never heals. At the sweep phase (hp ≤ 0.40 → `ruinK` ≥ 0.60) a
  dread-flagged sweep peaks `dreadK` at 1 → **up to a FULL sky-tear two cards early**,
  plus the crack-gape/clapper-strain reveal. Decision in §2: `pendulumSweep` ships
  **without** the dread flag; the swing-widen the flag would have bought comes from a
  2-line model hook instead. (This deviates from the build brief's "dread: true" —
  deliberately, with the symbol above as the reason. The Last Toll stays the only reveal.)
- **`def.setpieces` is already the array form** (`setpieces: [{ id: 'lastToll', atPhase:
  3, … }]`) and `setpieceForPhase(idx)` does an array `find` — a second entry is a pure
  data add. `armSetpieceForPhase` holds fire only `if (!sp.moving)`; a `moving` setpiece
  keeps the attack machine + the `def.musicDies` toll block live (the sweep FIRES).
- **The ENG-B descriptor cannot say "opposite"**: `resolveGapAnchor` supports `part / x /
  offset / card` only — `offset` is additive, there is no mirror/ratio. The ENG-B seam §6
  and its ledger lesson both pre-flagged this exact consumer ("⚠ the ±14 pendulum
  out-runs movingGap's ±9 clamp at the extremes… author the offset/ratio so the READ
  stays honest where the clamp bites"). §4 adds the one-line `scale` field.
- **Geometry constants for the sweep** (bossKnellgrave.js): `swingPivot` at `PIVOT_Y =
  9.5`; `bellMouth` at `(0, -8.6, 1.2)` under it (world-y ≈ pose.y + 0.9·1.75 ≈ pose.y +
  1.6 at rest; lateral mouth offset ≈ `sin(rotation.z) · 8.6 · scale 1.75`); `swingA`
  amplitude today = `0.10 + charge·0.16 + dreadK·0.10` (idle arc ~±0.14 rad → mouth ±~2u).
  `def.scale: 1.75`, `stationY: 20`, station pose `x = sin(time·0.7)·5`, `rel = settleGap
  30`. CONFIG: `laneHalfWidth 13, laneMinY 2.5, laneMaxY 22, fightHeight 13, bulletSpeed
  28, telegraphInstant 0.5`.

---

## 2. THE `pendulumSweep` SETPIECE (ENG-H hero)

### 2a. The path — new `SETPIECE_PATHS` entry, beside `lastToll`

The bell leaves the overhead loom and swings across the lane in **three widening arcs**
about an unseen yoke far above the frame — the `lastToll` grammar turned sideways. A real
pendulum read: **lowest + nearest + fastest mid-crossing, high + far + slow at the
extremes** (x and the y/rel dip are phase-locked through `arc = 1 − ph²`).

```js
// KNELLGRAVE — PENDULUM SWEEP (§5c WE "pendulum sweeps across the lane"; C.7 ENG-H):
// three widening arcs about an unseen yoke above the frame. MOVING — the P4 kit keeps
// firing: stream pours from the crossing bellMouth (emitOrigins, per tick), movingGap's
// safe lane LOCKS opposite the bob (gapAnchor scale −0.4, §ENG-B), aimed rides the
// muzzle (resolveEmitOrigin). Counter-verb: READ THE SWING — be where the bell is not.
pendulumSweep(k) {
  const B = CONFIG.BOSS;
  const env = k < 0.30 ? easeInOut(k / 0.30) : k > 0.86 ? easeInOut((1 - k) / 0.14) : 1;
  const ph = Math.sin(k * Math.PI * 6);       // three full arcs = six lane-crossings
  const arc = (1 - ph * ph) * env;            // 0 at the extremes → 1 at each bob nadir
  return {
    x: ph * 14 * env,                         // the ±14 sweep (§C.7 constants, verbatim)
    y: 20 - 9 * arc,                          // yoke-high 20 at the ends → 11 crossing (mouth ≈ 12.6, mid-band)
    rel: B.settleGap - 18 * arc,              // 30 → ~12 at each nadir (the crossing comes AT you)
    roll: -ph * 0.16 * env,                   // hangs INTO the arc (the chain points at the unseen yoke)
  };
},
```

Checks, by construction: k=0 and k=1 return `(0, 20, 30)` = the station pose (stationY 20)
— seamless in/out. Nadir: mouth world-y ≈ 11 + 1.6 = **12.6, the middle of the flying
band** — the muzzle genuinely crosses the lane, not the sky above it. Extremes: |x| 14 +
swing ≈ ±16 mouth-x — **off-lane by construction** (the §5c WE contract, finally true).
Lateral speed at a crossing ≈ 14·6π/14 ≈ 18.8 u/s < the player's 24 — outrunnable =
readable. `rel` floor 12 → no body pass behind the camera, no `nearMiss` whoosh (threshold
rel 8 — deliberate: this is a scythe, not a flyby), and every wavefront born at the nadir
still has ≥ 12/21.84 ≈ 0.55s of flight (the fairness floor on reaction, = the CEILING-LAW
number the config itself cites).

**Def entry** (data): `{ id: 'pendulumSweep', atPhase: 3, dur: 14, moving: true }` — armed
by `armSetpieceForPhase` on entering P4 (the `knellgrave_sweep` phase, §5), once per phase
entry, inside the card's 26s timer. **`moving: true`** (attacks + tolls keep firing —
`flankCutIn`/`condensePass` precedent). **NO `dread` flag** — §1's `skyOpen` ratchet; the
Last Toll keeps sole ownership of the reveal. **No `armSetpieceForPhase`/`debugRunSetpiece`
per-arm state line** — the sweep carries no accumulator (slip/orb precedent lines are
def-id-gated and untouched).

### 2b. The model hook — the swing itself widens (2 lines, bossKnellgrave.js)

Without `dread`, `setSetpiece(sin(kπ), sdef)` would move only the pose. The pendulum must
also SWING its own pivot (the §3.5 silhouette telegraph doing its job at setpiece scale).
Precedent: "MARROWCOIL reads it [the 2nd arg] to tell a fly-through pass from its
Closing-Ribs dread" — the model may key on `sdef.id`:

- in `setSetpiece`: `sweepK = (sdef && sdef.id === 'pendulumSweep') ? setpieceK : 0;`
  (new closed-over scalar beside `dreadK`);
- in `tickBody`: `ampTarget = 0.10 + charge * 0.16 + dreadK * 0.10 + sweepK * 0.30;`

Worst `swingA` ≈ 0.56 rad (sweep peak + full charge) → mouth lateral offset ≈ ±8.0 on top
of pose ±14 → **worst |bellMouth.x| ≈ 22.0** (the §4 scale is sized to this). Zero tris,
zero materials, zero new additive volumes — `tricount`/G1–G7/worst-frame untouched; the
shipped "knellgrave charge WIDENS the swing arc" assert measures charge vs idle with no
setpiece (`sweepK` 0) → byte-identical values.

**Counter-verb**: read the swing. The threat model during the 14s beat: the crossing bell
+ its `stream` hose (origin = the arcing mouth, re-aimed per tick), `movingGap` walls
whose lane mirrors the bob (§4), `aimed` tolls from the muzzle. Be where the bell is not;
the mirrored lane SAYS where that is.

---

## 3. THE TOLL FLIP — iris→bellMouth `spiral`, and the moved/inverted `armDiscPocket`
(the ENG-C7 §6 forward contract, paid)

### 3a. The `spiral` branch gains ENG-A origins (never-whiff, not SKIP)

In `executeAttack`'s `id === 'spiral'` branch (after the `def?.destructiblePanes`
pane-radial early-return, which keeps HOLLOWGATE's path untouched):

```js
} else if (id === 'spiral') {
  // Instant radial burst: bullets fly OUTWARD from the boss as they close.
  // §C.7: a def may opt the radial's origin onto an organ (emitOrigins.spiral) —
  // the toll radiates FROM the bell. Fallback semantics are resolveReflectTargets'
  // NEVER-WHIFF, not ENG-A's SKIP: the def.musicDies toll block rang the bell on
  // this same frame, so a silent (bullet-less) toll would break audio-fairness —
  // an unresolvable organ falls back to emitOrigin (def.muzzle, pose-backed),
  // never to a skipped volley. Un-opted defs: anchorX, byte-identical.
  const os = resolveEmitOrigins('spiral', player);
  const o = os ? (os[0] ?? { x: emitOrigin.x, y: emitOrigin.y, rel: emitOrigin.rel }) : null;
  const scx = o ? o.x : anchorX, scy = o ? o.y : B.fightHeight, srel = o ? o.rel : pose.rel;
  const n = quality < 0.75 ? 8 : 11;
  spiralPhase += 0.6;
  const slow = closing * 0.78;
  // §5i.B pocket arm — MOVED HERE from the iris branch (ENG-C7 §6 contract), §3b.
  if (def?.grazeForm === 'shrinkDisc' && setpieceT < 0 && !shielded && discCd <= 0) {
    discTollN++;
    discCd = 1.6;
    armDiscPocket(scx, scy, srel / slow, SPIRAL_OUT_SPD * (srel / slow));
  }
  for (let i = 0; i < n; i++) {
    const a = spiralPhase + (i / n) * Math.PI * 2;
    if (o) emitBoss(scx, scy, Math.cos(a) * SPIRAL_OUT_SPD, Math.sin(a) * SPIRAL_OUT_SPD, -slow, false, null, 1, null, srel);
    else   emitBoss(anchorX, B.fightHeight, Math.cos(a) * SPIRAL_OUT_SPD, Math.sin(a) * SPIRAL_OUT_SPD, -slow);
  }
}
```

`SPIRAL_OUT_SPD = 9` — a named const replacing the two literal `9`s (the pocket's honesty
depends on it, §3b). The un-opted emit call is the shipped line byte-for-byte (no 10th
arg); the opted call adds only the origin's `rel` (the `aimed`-branch ENG-A idiom). One
declared part → same bullet count → the §3e emission-budget sweep (defless
`debugEmitAttack` → un-opted path) is untouched by construction. Multi-part spiral defs
would multiply count — knellgrave declares exactly one; note left in the branch comment.

**The iris branch loses the whole def-gated stash** (`discTollN++ / discCd = 1.6 /
armDiscPocket(…)` and its comment) — nothing else. Every other iris consumer was already
byte-identical (the stash was def-gated); post-flip the iris branch is stash-free for
everyone. `debugEmitAttack`'s comment names the arm-site exception — update it from iris
to spiral.

### 3b. The pocket INVERTS: inside until the wall reaches you, bail before it crosses

The spiral's n bullets are all born AT the centre `(scx, scy)` with lateral speed
`SPIRAL_OUT_SPD` and closing speed `slow` — so the wavefront's lateral radius is **exactly
`9·t`**, and it crosses the player plane at `t = srel/slow` at radius `9·srel/slow`
(station: ≈ 9·28/21.84 ≈ 11.5). The pocket becomes a **growing** drawn disc that IS that
wavefront:

- `armDiscPocket(cx, cy, dur, r1)` — re-signed: `discX/discY` as before; `discAge = 0;
  discDur = dur` (= `srel/slow` — "recompute dur from the outward speed", the contract's
  words); **`discR1 = Math.max(r1, 3)`** replaces `discR0` (start radius is always 0);
  `discR = 0`; `emit('discPocket', { toll: discTollN, r1: discR1 })`. One call site, as
  the helper was named for.
- Branch interp flips: `discR = discR1 * (discAge / discDur)` — **drawn == wavefront is a
  construction identity** (both are linear in age from 0; the unit-ring band mesh scales
  to it unchanged).
- The paid band stays the rim from INSIDE: `d ∈ [discR·(1−DISC_WALL_FRAC), discR)` —
  unchanged predicate, inverted meaning: hug the expanding wall from inside as it pushes
  you outward. The dead centre stays safe and UNPAID (annulus, not radius — unchanged).
- **Escalating ticks flip to the clock**: the shipped `discR·0.075` formula would
  DE-escalate on a growing radius. Replace with
  `beamTick = Math.max(0.14, (discDur - discAge) * 0.30 - beamHeld * 0.03)` — ~0.4s ticks
  at open → 0.14s as the crossing lands (richest at the scariest instant, preserved).
- **Bail before it crosses**: at `discAge >= discDur` the pocket dies exactly as shipped
  (band gone, ramp wiped). At that beat the bullets ARE at the drawn rim's outer edge —
  lingering ON the rim line is the hit; the bail is one step INWARD (always available,
  always safe — the fairness hatch is the disc's own interior; the form still punishes
  nothing, damages nothing, resets no bank).
- **Reachability**: at station the centre is the mouth (`|x| ≤ ~7` under sway+swing,
  y ≈ 21.6 — in-lane at the top edge); the rim's LOWER arc sweeps down through the band
  as it grows (y = 21.6 − R → ~10 at crossing). The gate parks on the lower rim (§7).
  No lateral cap on `r1` — capping would make the drawn ring lie about the wavefront;
  off-arena rim arcs simply aren't rideable, the lower arc always is.
- **Cross-toll schedule is retired** (it was `discR0 = 8.0 − 0.6·(n−1)`; a start radius
  no longer exists). Escalation across the fight now comes from (i) the cadence ladder
  itself (1.4→1.1 — pockets arrive faster), (ii) the toll weight `w` growing with damage,
  and (iii) **The Cracked Peal's squeeze** (§3d). `discTollN` stays (the emit payload +
  per-phase re-offer accounting); all reset sites swap `discR0 = 0` for `discR1 = 0`,
  nothing else moves (`breakShield` re-offer line, per-encounter reset, `endEncounter`,
  `resetBoss` teardown — all shipped).
- `bossDebugState`: `discR0` → `discR1`; `discGeom` → `{ outSpd: SPIRAL_OUT_SPD,
  wallFrac: DISC_WALL_FRAC }` (`DISC_R_END` is deleted with its last consumer —
  grep-clean).

### 3c. The def kit change (exact, byte-cited)

`iris` leaves the knellgrave def entirely (every `attacks[]` entry and every rhythm-phrase
`attack: 'iris'` measure — §5 has the full before/after). `spiral` + the two opt-ins
arrive:

```js
muzzle: 'bellMouth',                       // (shipped — unchanged)
emitOrigins: { spiral: ['bellMouth'], stream: ['bellMouth'] },   // §C.7: the toll radiates from the bell; the sweep's hose swings with it
gapAnchor: { movingGap: { card: 'knellgrave_sweep', part: 'bellMouth', scale: -0.4 } },  // §4
```

The `iris` engine branch, `SUSTAINED` membership, and every other def's iris usage are
untouched. `grazeForm: 'shrinkDisc'` stays (the label's meaning inverts with its one
consumer; BOSS-DESIGN's §5i.B "shrinking safe disc" phrasing should gain a one-line
errata in this PR's doc pass: *the safe disc's TIME shrinks; post-C.7 the wall expands*).

### 3d. The Cracked Peal's double toll (and why `discCd` is load-bearing)

The peal phrase (§5) is `{ kind: 'burst', attack: 'spiral', count: 2, gap: [0.1, 0.16] }`
→ two full toll releases (each runs the `def.musicDies` block: `bellToll(w)`,
`model.tollNow`, camera tick, `emit('bossToll')`) ≈ 0.6–0.8s apart — the model's
`fireRing` already fires a primary + 0.14s echo per toll and the worst-frame audit already
audits "double-toll", so the spectacle is pre-paid. The FIRST toll arms the pocket; the
SECOND is inside `discCd = 1.6` and **arms nothing — by design**: its unmarked wavefront
expands INSIDE the live pocket, half a beat younger, squeezing the rider between an inner
wall coming up behind them and the drawn rim ahead. "Bail on the last beat" sharpens to
"bail before the SECOND wall" — escalation with zero new state. (Do NOT "fix" the cd to
let it double-arm; single-pocket state + replace-on-arm would cut pocket #1 short and
un-draw a wavefront that is still lethal.)

---

## 4. ENG-B BOB-LOCK — `movingGap` reads the bell (and the ±14 vs ±9 honesty decision)

`resolveGapAnchor` gains ONE field (the extension its own seam pre-authorized as
"offset/ratio"): `scale`, multiplicative, applied before `offset`:

```js
return x * (spec.scale ?? 1) + (spec.offset ?? 0);
```

Default 1 → every shipped descriptor (stormrend's hero, the G5 in-test specs) is
byte-identical. The knellgrave opt-in (§3c) is card-gated to `knellgrave_sweep` (the only
phase whose kit carries `movingGap`), `part: 'bellMouth'`, **`scale: -0.4`**.

**The honesty decision** (the flagged ENG-B item, resolved): neither clamp the bob-lock
nor widen movingGap's ±9 clamp. The plan's own wording is "gap **phase-LOCKED opposite**
the bob (read the bell, not the wall)" — a mirror, not a tracker — so the lock maps the
mouth's FULL worst-case envelope (±22, §2b) through `scale −0.4` into **±8.8 ⊂ ±9: the
shipped clamp NEVER engages**, and the read is honest at every point of the arc by
construction (the safe lane is always exactly the bell's position mirrored at 0.4×; no
regime where the lane silently stops answering the bell). movingGap's per-row re-resolve
inside the fire closure (read point 2, shipped) makes the lock LIVE across the 5-row
stream — the lane genuinely swims against the swing. laneSafe stays green by the shipped
clamp-table argument (gap ∈ [−8.8, 8.8], skip half-width 2.6 > 2.2). Card down → shipped
player-seeded slide returns (stormrend-hero grammar).

Non-decisions, stated: `curtain`/`iris`/`geyser` read points untouched; EMBERTIDE's
`horizonPocketX` untouched; no `atTell` hook (the bell is a continuously-readable anchor —
ENG-B §7.2's own carve-out; the one-beat-early channel stays C.8's).

---

## 5. DEF 4→5 PHASES + `knellgrave_peal` (minimal restructure, gates satisfiable)

```js
phases: [
  { atFrac: 1.00, cadence: [1.4, 1.7],  attacks: ['spiral', 'aimed'] },            // P1 The First Toll — teach: the toll RADIATES; ride its rim
  { atFrac: 0.70, cadence: [1.3, 1.6],  attacks: ['spiral', 'aimed'] },            // P2 The Second Toll — RHYTHM PARRY: the 4–6 aimed chain on the beat
  { atFrac: 0.55, cadence: [1.25, 1.5], attacks: ['spiral', 'aimed'] },            // P3 The Cracked Peal — double tolls (hemiola), the squeeze
  { atFrac: 0.40, cadence: [1.2, 1.45], attacks: ['stream', 'movingGap', 'aimed'] },// P4 Pendulum Sweep — the setpiece phase (the swung hose + mirrored lanes)
  { atFrac: 0.25, cadence: [1.1, 1.4],  attacks: ['spiral', 'fan', 'aimed'] },     // P5 The Last Toll (survival) — 'aimed' kept for amberdiet (§5i.C)
],
cards: [
  { id: 'knellgrave_first',  name: 'IT RINGS — The First Toll',   atFrac: 1.00, timer: 24 },
  { id: 'knellgrave_second', name: 'IT RINGS — The Second Toll',  atFrac: 0.70, timer: 26 },
  { id: 'knellgrave_peal',   name: 'IT RINGS — The Cracked Peal', atFrac: 0.55, timer: 24 },  // NEW — §C.7; 27 chars, " — " grammar ✓
  { id: 'knellgrave_sweep',  name: 'IT RINGS — Pendulum Sweep',   atFrac: 0.40, timer: 26 },  // atFrac 0.45 → 0.40 (the plan ladder)
  { id: 'knellgrave_last',   name: 'IT RINGS — The Last Toll',    atFrac: 0.25, timer: 30, dread: true, survival: true },
],
setpieces: [
  { id: 'pendulumSweep', atPhase: 3, dur: 14, moving: true },
  { id: 'lastToll',      atPhase: 4, dur: 26, moving: true, dread: true },   // atPhase 3 → 4 (the ride follows its phase)
],
```

Kit = `spiral/aimed/stream/movingGap/fan` — the §C.7 line verbatim (`crossfire` leaves
with P2's restructure; the Second Toll's chain is `aimed`, per the C-table's own "The
Chain" row). `rhythm.phases` grows to 5, phrase sketches (kinds/attacks are the spec; gap
numbers are the builder's dials, print-gated):

- P1: `sustain spiral ×2 gap [1.4,1.6]` + `sustain aimed ×1` — the metronome, restated in
  the true geometry.
- P2: `sustain spiral ×2 gap [1.25,1.45]` + **`burst aimed count 4 gap [0.5,0.62]`** — the
  rhythm-parry chain (BOSS-DESIGN §5d slot-10 row: "a 4–6 amber chain on the TOLL's
  beat"), now explicit phrase data instead of riding crossfire.
- P3: **`burst spiral count 2 gap [0.1,0.16]`** + `sustain aimed ×1 gap [1.3,1.5]` — the
  hemiola (§3d).
- P4: `sustain stream ×1` + `sustain movingGap ×1` + `sustain aimed ×1`, gaps [1.2,1.45]
  — the sweep bed.
- P5: `sustain spiral ×2` with the shipped decaying-rest acceleration + `sustain aimed ×1`
  — nine accelerating tolls, now expanding from overhead (rel ≈ 3 → `srel/slow` ≈ 0.04–0.1s
  pockets would be degenerate, which is exactly why the arm's `setpieceT < 0` gate keeps
  the form dead for the whole ride — shipped behaviour, unchanged).
- `ticket` stays `{ bpm: 60, quantize: '1/4' }` — no quantizer change needed (§1); flip to
  `'1/8'` only if the preview wants the peal snapped tighter (the hook exists).

**Gate satisfiability, named**: def-schema (5≡5, atFracs aligned/descending, one dread
LAST, ids stable, names ≤44 with " — ") ✓ by the block above. **amberdiet**: every phase
lists `aimed`; P4 also lists `stream` (both in `AMBER_CARRIERS`); worst simulated amber
gap is P1/P3's ~2 spiral beats ≈ 4–5s ≪ 12s, and `amberSwap`'s floor forcing backstops
the tails. **rhythmprint**: the biggest print move in the plan (E.3) — headless
`simulatePhase` sees the new gaps/bursts (never the ticket); the signature stays
"accelerating metronome, now with burst doubles", which moves it AWAY from every
uniform-gap neighbour; POST-BUILD must quote KS vs karnvow and weftwitch (both slot
neighbours) as well as the global min ≥ 0.20. **card-floor**: 5 cards = the §5g WE floor.
**emission budget**: no new id, spiral counts unchanged, movingGap/stream dials untouched.

---

## 6. COEXIST / REGRESSION — what may not move, and how it's held

1. **Every other def byte-identical** (the E.3 universal invariant): engine edits are (a)
   the spiral branch — un-opted path byte-for-byte (§3a), gated on `def.emitOrigins.spiral`
   / `def.grazeForm`; (b) `resolveGapAnchor`'s `scale ?? 1`; (c) the disc helper/branch —
   knellgrave is the label's only carrier; (d) a new `SETPIECE_PATHS` key nobody else's
   def names; (e) the model hook keyed on `sdef.id === 'pendulumSweep'`. HOLLOWGATE's
   pane-radial spiral early-returns before the new code; voidmaw/marrowcoil spirals take
   the `null`-origins path.
2. **Music-death**: zero lines in `musicKill`/`musicRestore`/the `def.musicDies` toll
   block/the entry-toll line. Both music-death test blocks + the lifecycle defeat-restore
   assert must pass with zero test edits.
3. **The Last Toll purity**: `SETPIECE_PATHS.lastToll` untouched; the card stays
   dread+survival+LAST; the pocket arm + branch stay `setpieceT < 0`-gated (no farm, pure
   dodge — the shipped purity gate re-passes with its driver flipped to spiral); the
   sky-tear/reveal stays exclusively `lastToll`-dread-driven (§2's no-dread decision IS
   this regression's fix, pre-emptively).
4. **The shipped ENG-C7 gate**: kept as the same block, rewritten where the geometry
   inverted (§7 items 3–5) — `discPocket` must still fire on knellgrave, the annulus/
   never-damages/coexist/purity laws must still hold verbatim.
5. **Worst-frame overdraw**: the pendulum adds NO additive volume (pose + rotation only);
   the toll flip adds none (bullets + the ONE shipped scene-level `discBandMesh`, reused
   as-is); the model audit ("shield+dread+double-toll+flood ≤ 2 large fills") re-passes
   untouched — there is no third large additive volume to audit. The true in-game worst
   frame (sweep nadir + double-toll rings + a live band + candle flood) is scene-level and
   invisible to the gate: the human judges it on the PR preview, explicitly.
6. **Model gates**: geometry block (swing-widen, notice, ruin ladder, named organs) —
   untouched paths; `tricount`/`TIER_BUDGETS`/tiershots — zero new geometry; bossgate
   knellgrave G1–G7 incl. the `gate.presence.comYMax` override — silhouette states
   unchanged at capture poses. `tools/knellshot.mjs` re-used for captures; shot list:
   sweep nadir mid-crossing (the scythe frame), sweep extreme (off-lane loom), a peal
   double-wavefront with the band live, the P5 overhead spiral rain.
7. **Lifecycle**: knellgrave is last in BOSS_ORDER; the sim now crosses five shields, two
   setpieces, five cards — the survival hatch (`cardTimer → endCard`) and phase-floor
   shields are untouched mechanics, so the kill completes; the sim IS the regression net
   for the restructure.

---

## 7. GATE PLAN (tests/boss.mjs; `armKnellgrave()` harness shape from the shipped block)

New §ENG-H block + the in-place rewrite of the §ENG-C7 block:

1. **Sweep geometry** — `debugRunSetpiece('pendulumSweep')` (resolves the REAL def entry,
   dur 14); frame-loop sampling `debugPartWorldPos('bellMouth')` + `bossDebugState()`:
   max |mouth.x| ≥ 11 with ≥ 4 sign changes (it CROSSES the lane, repeatedly); min mouth.y
   ≤ 14 and ≥ laneMinY (it dips into the band, never under it); min `poseRel` ∈ [11, 13]
   (the nadir dip, and never a behind-camera pass); pose returns to station at k ≥ 1
   (`setpiece` false, `poseRel` = 30).
2. **Bob-lock** — force knellgrave + `debugForceCard('knellgrave_sweep')` +
   `debugRunSetpiece('pendulumSweep')`, player parked at x = +6;
   `debugEmitAttack('movingGap', p, 1)` mid-sweep: every non-empty row's clear lane sits
   at `clamp(−0.4 · mouthX_at_that_row's_fire_frame, ±9)` (every bullet ≥ 2.6 − ε away;
   some bullet within 2.6 of the player-seeded +6 lane — the lane is the BELL's, not
   yours), rows track the moving mouth (row lanes differ while it swings), `laneSafe`
   green on every row; `debugForceCard(null)` → the shipped g0 slide returns; a hostile
   in-test `scale` (e.g. −2) still lands inside ±9 (the clamp fence, ENG-B G5 idiom).
3. **The flip (ENG-C7 rewrite)** — drivers change `debugEmitAttack('iris', …)` →
   `debugEmitAttack('spiral', …)` throughout the block. Pocket #1: `discPocket` fires with
   `toll: 1`; `discR` **strictly increases**; final live `discR` ≈ `discR1` (±0.25) with
   `discR1` ≈ `SPIRAL_OUT_SPD · discDur` (±0.3); dies on the beat (`discR === 0`).
   **Honesty**: on sampled live frames, max lateral distance of live boss bullets from
   `(discX, discY)` ∈ [discR − 0.4, discR + 0.4] — the drawn rim IS the wavefront (breaks
   if anyone retunes `SPIRAL_OUT_SPD`/`slow` unpaired). The old shrink/`rEnd`/`r0s[1] <
   r0s[0]` asserts are deleted with the geometry that defined them.
4. **Rim economy (inverted park)** — park on the LOWER rim
   (`discX, discY − discR·(1 − wallFrac/2)`, recomputed per frame): `discGraze` ticks > 0,
   last inter-tick gap < first (escalates toward the crossing), bank grows; park
   dead-centre a full pocket: zero ticks; park outside (`discY − discR − 3`): zero;
   `game.health` untouched (the form never punishes). An iris volley
   (`debugEmitAttack('iris', p, 1)`) on knellgrave arms NOTHING (the arm site moved).
5. **The peal squeeze + cd** — two back-to-back `debugEmitAttack('spiral')` (Δt < 1.6s):
   exactly ONE `discPocket`; pocket #1's `discDur`/`discR1` unchanged by the second toll;
   after `discCd` lapses a third spiral re-arms (`toll: 2`). Purity twins: during
   `debugRunSetpiece('pendulumSweep')` AND during `lastToll` (+`knellgrave_last`), a
   spiral arms no pocket; after each clears, arms again.
6. **Coexist** — stormrend fires `spiral` via `debugEmitAttack`: zero
   `discPocket`/`discGraze`, and every bullet born AT `(anchorX, B.fightHeight)` (the
   un-opted origin, byte-identical); the shipped stormrend-iris coexist assert stays.
7. **Existing suites, zero test edits except the named rewrites**: def-schema (now 5≡5),
   geometry, worst-frame, both music-death blocks, lifecycle, laneSafe/§3e budgets,
   `bossboot`; rhythmprint + amberdiet re-run and QUOTED (the print is a declared mover —
   if KS < 0.20 vs any boss, the phrase gaps are the dial, never the burst kinds).

---

## 8. RISKS / TUNABLES for the preview (the two that matter)

1. **The sweep's feel is the whole hero** — dur 14 / 3 arcs / the ±14–y11–rel12 triplet /
   roll 0.16 / `sweepK` 0.30 are ONE coupled read: too fast and the mirrored lane is the
   only survivable read (the bell becomes noise), too slow and it's a loom, not a scythe.
   Headless proves crossings/reachability; only the human judges whether the arc reads as
   MASS swinging (the SotC frame) on weak-mobile framerates. Dials in order: dur (14→16),
   arcs (3→2), the rel dip (12→14), `sweepK`. Never dial: `moving: true`, the no-dread
   decision (§1), the station-continuity endpoints.
2. **Pocket density + band prominence post-flip** — every station toll is now
   pocket-eligible (`discCd 1.6` ≈ every toll at P1 cadence) and each pocket is shorter
   (~1.28s) with a bigger terminal ring (~11.5 vs 8.0): more frequent, larger, briefer
   pink rings at the player plane. If the preview reads busy or farmy: raise `discCd`
   (1.6 → ~3.2, every other toll — the shipped "less busy" intent), then the tick formula
   (`0.30/0.03/0.14`), then band base opacity. Never dial: the annulus law, the
   drawn==wavefront identity (no radius cap), the last-beat death, the setpiece purity
   gates.

---

## 9. GIT-STATUS SANITY (checkpoint protocol)

This checkpoint **created exactly one new file** — `reforged/boss-context/ENG-H-SEAM.md`
(this spec). No source file, def, test, tool, or doc was modified by this session; no
test, build, or game process was run. ⚠ The working tree was NOT clean at write time: a
parallel **ENG-G (THREAD-THE-GAP) build is in flight** (uncommitted edits to boss.js —
`gapThread*` state, a scorer block, per-row hooks inside the `curtain`/`movingGap`/
`crestfall`/`geyser` fire closures, two new `bossDebugState` fields — plus bossDefs.js
marrowcoil, config.js, ui.js, tests/boss.mjs; and untracked ENG-EW-SEAM.md /
ENG-G-SEAM.md). Verified: **no knellgrave/spiral/disc/setpiece symbol cited above is
modified by that diff** (its disc-line hunks are unmodified context). Two shared-surface
touch points for the ENG-H builder to rebase across once ENG-G lands: the `movingGap`
fire closure (ENG-G adds a row-registration line beside the `resolveGapAnchor` read this
spec also edits) and the `bossDebugState` return object. Every claim above was read from live master this session and cited by
symbol: boss.js (`SETPIECE_PATHS.lastToll/flankCutIn/condensePass/figureEight`,
`setpieceForPhase`/`armSetpieceForPhase`/`clearSetpiece`/`debugRunSetpiece`/the setpiece
runner + `holdSway` station hold, the `def.musicDies` toll block + `executeAttack`
adjacency, the `spiral`/`iris`/`movingGap`/`stream`/`crestfall`/`geyser` branches,
`resolveEmitOrigin`/`resolveEmitOrigins`/`aimVelFrom`, `resolveGapAnchor`,
`armDiscPocket`/the `shrinkDisc` cluster branch/`discCd`/`discBandMesh`/`bossDebugState`/
`debugPartWorldPos`/`debugForceCard`/`debugEmitAttack`, `arenaHW`, `SUSTAINED`),
bossKnellgrave.js (`swingPivot`/`PIVOT_Y`/`bellMouth`/`swingA`/`ampTarget`/`setSetpiece`/
`dreadK`/`ruinK`/`skyOpen`/`tollNow`/`fireRing`/`orbiters`/`autoTollT`/`tollBeat`),
bossDefs.js knellgrave (phases/cards/setpieces/`grazeForm`/`muzzle`/`stationY`/`scale`/
`musicDies`/`rhythm.ticket`/`gate.presence`), bossRhythm.js (`quantize` incl. `'1/8'`,
`kind: 'burst'`, `nextStep`, `simulatePhase`'s no-beatClock contract), sfx.js
(`musicKill`/`getBeatClock`/`bellToll`), bossModel.js (`partWorldPos` wrapper), config.js
(lane bounds/`settleGap`/`fightHeight`/`bulletSpeed`/`telegraphInstant`), tests/boss.mjs
(the def-schema card/phase asserts, the knellgrave geometry/worst-frame/music-death/
lifecycle blocks, the §ENG-C7 gate block), BOSS-DESIGN.md (§5c WE contract, §5d slot-10
sheet, §5g card floor, FX-BUDGET law), ENG-C7-SEAM.md §6, ENG-B-SEAM.md §6/§7 + its
ledger lesson. Drift found this pass: the live `'1/8'`+`burst` hemiola hooks (E.2 C.7.iii
stale), the beat clock surviving `musicKill`, the un-specced `discCd`, the `skyOpen`
dread-flag hazard, the missing `scale` field, and the three shipped disc asserts that
invert — each resolved in §1–§5 above. The builder's PR must add its own
`leapfrog/lessons/` file on merge (THE RULE §2); this spec is not that lesson.
