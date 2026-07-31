# ENG-B — AUTHORED-GAP / ANCHOR PROVIDER (`def.gapAnchor`) — implementation spec

**PRE-BUILD checkpoint output (design only; no code changed).** Plan row: E.1 ENG-B — "def/card-gated
override of player-sign gap placement … generalize the `horizonPocketX` precedent into a per-def hook."
Read against CURRENT master (post solar-spectacle merge). Everything below cites live symbols/quotes.

**The defect (verified live, all three branches):** the walls' dreads say "read the boss to find the
safe lane," but every gap is seeded from the PLAYER:

- `curtain` (boss.js `executeAttack`):
  `const gap = Math.max(-hw + slot, Math.min(hw - slot, -Math.sign(player.position.x || 1) * 5.5));`
  with `hw = Math.min(12, arenaHW - 1)` and `slot = 3.0` — the lane is placed on your opposite side.
- `movingGap`: `const g0 = Math.max(-6, Math.min(6, player.position.x));` then, per row (computed at
  SCHEDULE time, outside the `pending` fire closure):
  `const gap = Math.max(-9, Math.min(9, g0 + dir * 2.6 * k));` — the slide starts where YOU are.
- `iris`: `const cx = anchorX, cy = B.fightHeight;` where
  `const anchorX = Math.max(-8, Math.min(8, player.position.x * 0.7));` — the ring centre follows you.
  (⚠ `anchorX` is shared by `tunnel` and `spiralStream` — ENG-B must touch ONLY iris's read of it.)

There is nothing on the boss to read; the "answer" tracks the player. The ONE shipped exception is the
precedent to generalize: EMBERTIDE's `crestfall` reads a card-gated global —
`const gapC = horizonPocketX != null ? horizonPocketX : (g0 + dir * 2.5 * k);` — resolved INSIDE the
row's fire closure, where `horizonPocketX = sweep * 8` is set in `updateBoss` only while
`activeCard && activeCard.id === 'embertide_horizonbreak'` (else `horizonPocketX = null`). That is
exactly the right shape (authored, card-gated, live per row, null = shipped path) hardcoded to boss 13.

---

## 1. The data shape — `def.gapAnchor`

Mirror `def.emitOrigins` (ENG-A, shipped: `emitOrigins: { crossfire: ['eitherTwinA','eitherTwinB'],
aimed: ['eitherMuzzle'], … }` on eitherwing): **one per-def map keyed by attack id**, values are small
data-only descriptor objects (no functions — defs are data):

```js
// bossDefs.js — data only. A spec authors WHERE an attack's safe gap / ring centre sits.
gapAnchor: {
  //  <attackId>: { part?, x?, offset?, card? }
  iris:      { card: 'stormrend_eye', part: 'focalEye' },
  movingGap: { card: 'stormrend_eye', part: 'focalEye' },
},
```

Descriptor fields (all optional except one of `part`/`x`):

| field | meaning |
|---|---|
| `part` | named model part; the anchor is its live WORLD-X via `model.partWorldPos(part, v)` (same primitive `resolveEmitOrigins`/`resolveReflectTargets` use) |
| `x` | fixed lane x. Used when no `part`, **and** as the fallback when `part` doesn't resolve (missing part / headless) |
| `offset` | added to the resolved x (e.g. "one lane left of the hand") |
| `card` | spec is active only while `activeCard?.id === card` — the `horizonPocketX` gate, generalized. Omit for def-wide |

**Why this shape and not the alternatives:**
- *Not another `horizonPocketX`-style global per boss:* that couples `updateBoss` to each boss's fiction
  (the current code resets `horizonPocketX` in four places: encounter start, `endEncounter`, hard reset,
  and the card check). A def map needs zero per-boss engine state and zero reset plumbing.
- *Not a card-level map (`card.gapAnchor`):* cards are tiny `{ id, name, atFrac, timer }` records; a
  `card` field on the def-level spec keeps ALL anchor authoring in one place and keeps the map's shape
  1:1 with `emitOrigins` (per-attack-id keys), which builders already know.
- *Not function-valued:* headless tests and the ledger's "defs are data" rule; a descriptor is
  greppable, diffable, and the resolver stays the single place with logic.
- Coexist default: **no `gapAnchor` key → `resolveGapAnchor` returns `null` → the shipped player-sign
  placement, byte-identical** (the same null-contract as `resolveEmitOrigins`' "un-opted → shipped path").

**Worked HERO example (STORMREND — see §4):** during the dread card `stormrend_eye` ("EYE OF THE GALE —
Heart of the Storm", `atFrac: 0.33, dread: true`), `iris` rings centre on the storm's eye
(`focalEye`, the named HDR core in bossMandala.js — `eyeMesh.name = 'focalEye'`) and `movingGap`'s
safe lane LOCKS to the eye's axis. "Fly into the eye of the storm" becomes literally true, and since
the fight-station bob sways the whole rig (`pose.x = Math.sin(time * (sway?.freq ?? 0.7)) * (sway?.amp
?? 5.0)` — ±5 m, slow), the eye is a *legible moving anchor*, the same grammar as `horizonPocketX`'s
`sweep * 8` shadow ride.

## 2. The resolver + the three read points

**Resolver** — lives in boss.js beside `resolveEmitOrigins`/`resolveReflectTargets`, same
module-scoped scratch-vector idiom:

```js
// §ENG-B: resolve a def-authored gap anchor for attack id → a lane X, or null
// (null = take the shipped player-derived placement, byte-identical). Card-gated
// specs (the horizonPocketX precedent) are inert outside their card. Semantics on
// failure mirror resolveReflectTargets' never-whiff flip, NOT emit's SKIP: a wall
// must ALWAYS have a fair gap, so an unresolvable anchor falls back to the shipped
// placement instead of skipping or emitting a gapless wall.
const _gapV = new THREE.Vector3();
function resolveGapAnchor(id) {
  const spec = def?.gapAnchor?.[id];
  if (!spec) return null;                                       // un-opted
  if (spec.card && activeCard?.id !== spec.card) return null;   // card-gated, card not live
  let x = null;
  if (spec.part && model?.partWorldPos) {
    const w = model.partWorldPos(spec.part, _gapV);
    if (w) x = w.x;                                             // live world-x of the organ
  }
  if (x == null && typeof spec.x === 'number') x = spec.x;      // fixed-x author / part fallback
  if (x == null) return null;                                   // nothing resolvable → shipped
  return x + (spec.offset ?? 0);
}
```

Notes: no `player` parameter — unlike emit origins there is no world→bullet-frame `rel` conversion
(the gap is a lane X only), so the resolver needs nothing from the player; adding one later is
non-breaking. The resolver returns the authored x **unclamped** — each read point pushes it through
its own SHIPPED clamp (§3), so fairness bounds stay per-pattern and the diff at each branch is minimal.

**Read point 1 — `curtain`** (instant volley; one resolve at fire time):

```js
-    const gap = Math.max(-hw + slot, Math.min(hw - slot, -Math.sign(player.position.x || 1) * 5.5));
+    const ax = resolveGapAnchor('curtain');   // §ENG-B: authored lane (null = shipped player-sign)
+    const gap = Math.max(-hw + slot, Math.min(hw - slot,
+      ax != null ? ax : -Math.sign(player.position.x || 1) * 5.5));
```

**Read point 2 — `movingGap`** (streamed rows; resolve INSIDE each row's fire closure, the crestfall
`horizonPocketX` idiom, so a moving anchor tracks live). The shipped `const gap = …` line moves from
schedule time into the closure — byte-identical for un-opted defs because `g0`, `dir`, `k` are already
frozen per-row and the expression has no RNG or live reads:

```js
     for (let k = 0; k < rows; k++) {
-      const gap = Math.max(-9, Math.min(9, g0 + dir * 2.6 * k));
       const b = activeBand[k % activeBand.length];
       pending.push({ t: k * 0.3, fire: () => {
+        // §ENG-B: an authored anchor LOCKS the lane (re-resolved live per row — a moving
+        // organ tracks); un-opted keeps the shipped slide from the player-seeded g0.
+        const ax = resolveGapAnchor('movingGap');
+        const gap = Math.max(-9, Math.min(9, ax != null ? ax : g0 + dir * 2.6 * k));
```

Authored semantics = **LOCK, not slide** (crestfall's own comment: "During HORIZON-BREAK it instead
LOCKS to the live face-shadow pocket") — which is exactly what the consumers want: C.8's dread wants
"the safe lane CONSTANT across all 5 rows"; C.3b wants the surviving rib's aperture; C.7 tracks the bob.

**Read point 3 — `iris`** (streamed rings; ONE resolve at schedule time, deliberately):

```js
-    const cx = anchorX, cy = B.fightHeight;
+    const ax = resolveGapAnchor('iris');   // §ENG-B: authored ring centre (e.g. the storm's eye)
+    const cx = ax != null ? Math.max(-8, Math.min(8, ax)) : anchorX;
+    const cy = B.fightHeight;
```

Why schedule-time here when movingGap resolves per-row: the 3–4 rings of one iris volley must stay
**concentric** ("the safe zone is the middle" — the whole read); per-ring re-resolve under the ±5 sway
would smear the iris into a tube with no middle. The anchor moving BETWEEN volleys is the feature.
The `±8` clamp mirrors `anchorX`'s own shipped clamp, so an authored iris has the identical envelope.
`tunnel`/`spiralStream`/`crestfall` are untouched (`anchorX` itself is not modified; `crestfall` keeps
`horizonPocketX` as-is — migrating EMBERTIDE onto `gapAnchor` is an explicit NON-goal: its anchor is a
computed sweep, not a part, and the dread is shipped and green; churn there buys nothing).

## 3. laneSafe safety (the clamp argument)

The gate (tests/boss.mjs): `laneSafe = (v, half = 2.2) => { for (let g = -11; g <= 11; g += 0.25) {
if (v.every((b) => Math.abs(b.x - g) >= half)) return true; } … }`, asserted for `curtain` ("curtain
leaves a threadable safe lane") and every `movingGap` row.

Clamping is done **at the read points by the shipped clamps**, never skipped, so an authored x can
never place the lane off-arena:

| branch | clamp the authored x flows through | skip half-width | proof laneSafe holds |
|---|---|---|---|
| curtain | `Math.max(-hw + slot, Math.min(hw - slot, …))` → ±8 (hw 11, slot 3.0) | `< slot` = 3.0 | gap ∈ [−8, 8] ⊂ scan range [−11, 11]; at g = gap every bullet is ≥ 3.0 > 2.2 away |
| movingGap | `Math.max(-9, Math.min(9, …))` | `< 2.6` | gap ∈ [−9, 9]; at g = gap all ≥ 2.6 > 2.2 |
| iris | `Math.max(-8, Math.min(8, …))` (mirrors `anchorX`) | n/a (no wall fill; laneSafe not asserted for iris) | identical envelope to shipped `anchorX` ±8 |

So **any** authored value — including a hostile `x: 40` — lands inside the shipped fairness bounds,
and the wall's designed skip-window (3.0 / 2.6) exceeds the 2.2 threadable minimum by construction.
The gate is driven with an anchor actually set via `debugEmitAttack` on the opted hero (§5, assert
G3/G5) — including one deliberately out-of-arena `x` to exercise the clamp.

## 4. The HERO — STORMREND, card-gated eye anchor (C.1b-lite)

**Drift note first (plan row B says "curtain's gap … Hero STORMREND curtain/iris"):** current
STORMREND has **no `curtain`** — the 2026-07 rebalance trimmed its kit to the `fan → +movingGap →
+iris` core (def comment: "trimmed the shipped 8-attack spread — curtain/stream/aimed/secondWave/
crossfire — down to this 3-move core"). The hero therefore opts in **`iris` + `movingGap`**, both in
its P2/P3 `attacks[]`. `curtain`'s read point still ships and is gated headlessly (G1/G5 coexist +
clamp asserts) — WEFTWITCH's C.8 is its first def consumer.

**Hero opt-in (bossDefs.js, `stormrend`, data only):**

```js
// §ENG-B hero: during the dread card the storm's gaps are the EYE's — iris rings
// centre on focalEye and movingGap's lane locks to the eye axis ("fly into the eye
// of the storm" is literally true; the ±5 station sway makes it a legible moving
// read, the horizonPocketX grammar). Outside the card: shipped player placement.
gapAnchor: {
  iris:      { card: 'stormrend_eye', part: 'focalEye' },
  movingGap: { card: 'stormrend_eye', part: 'focalEye' },
},
```

Why this is the minimal proof: def-data only + the seam; zero model work (`focalEye` is an existing
named part — LANCE V1 already targets it via `virtualLockOrgan: 'focalEye'`); card-gated so P1/P2
teach phases are untouched (P2's slow-teach iris keeps the shipped player-side centre); the P3 dread
card gets a real boss-read TODAY. **Deferred to C.1b proper (NOT this PR):** the iris ×3 no-rest
chain (card-scoped cadence override), the amber `aimed` triplets down the corridor, the coplanar
ring-alignment model rig + its telegraph gate. ENG-B ships the provider + this opt-in only.

**One test seam ships with the PR** (the card gate is untestable headlessly otherwise — cards arm at
hp fractions): a `debugForceCard(id)` export beside the existing "PR3 test seams"
(`debugBankLocks`/`debugRaiseShield` precedent):

```js
export function debugForceCard(id) {   // test seam: arm/clear a def card without driving hp
  const c = (id && def?.cards?.find((c) => c.id === id)) || null;
  activeCard = c; cardTimer = c ? (c.timer ?? 24) : 0;
  return !!c;
}
```

**POST-BUILD trace confirms:** with `stormrend_eye` forced and the player parked at x = +6, (a) the
`movingGap` bullet-free lane sits at `debugPartWorldPos('focalEye').x` on EVERY row (not at +6, and
not sliding row-to-row); (b) `iris` ring centres average to the eye's x (±clamp), not `+6 * 0.7`;
(c) `laneSafe` green on every authored row; (d) card cleared → both revert to the shipped
player-seeded placement; (e) volley bullet counts identical carded vs not (gap POSITION only).

## 5. Gate plan (tests/boss.mjs, new §ENG-B block after the §ENG-A-R block; same idiom)

- **G1 — coexist fence (headless, def/model null):** `debugEmitAttack('curtain', makePlayer(), 1)`
  (makePlayer is x = 0 → `-Math.sign(0 || 1) * 5.5 = −5.5`): assert every bullet has
  `Math.abs(b.x - (-5.5)) >= 3.0 - 1e-6` AND some bullet within 3.0 of `+5.5` — the gap is AT −5.5,
  not merely "a lane exists" (placement byte-identical, stronger than laneSafe alone).
- **G2 — opted path (live):** `forceBoss(player, BOSS_ORDER.indexOf('stormrend'))` +
  `debugForceFight` + ~30 `updateBoss` ticks (the ENG-A settle idiom); `debugForceCard('stormrend_eye')`;
  `eyeX = debugPartWorldPos('focalEye').x`. With `player.position.x = 6`:
  `debugEmitAttack('movingGap', player, 1)` → every non-empty row: all bullets
  `Math.abs(b.x - eyeX) >= 2.6 - EPS` (the lane is the EYE's, not the player's), and row k's clear
  lane equals row 0's (LOCK, no slide). `debugEmitAttack('iris', player, 1)` → per ring,
  `|mean(b.x) − clamp(eyeX, ±8)| < 0.3` (rings are symmetric about cx).
- **G3 — laneSafe both ways:** `laneSafe(r.bullets)` green on every authored `movingGap` row (G2 data)
  and on the un-carded rows; the shipped 3e block (curtain/movingGap laneSafe + the ≤55/≤160
  concurrent-load budget over `ALL_ATTACKS`) stays green untouched — no emission change.
- **G4 — card gate off:** `debugForceCard(null)` (or a card id mismatch) → `movingGap` row 0's clear
  lane back at `clamp(player.x, ±6)`; `iris` centre back at `player.x * 0.7`. Anchors are inert
  outside their card.
- **G5 — clamp fairness (authored, out-of-arena):** `BOSSES` is exported — in-test, set
  `BOSSES.stormrend.gapAnchor.movingGap = { card: 'stormrend_eye', x: 40 }` (restore after),
  re-force, emit → the lane sits at the +9 clamp and `laneSafe` is green; same for curtain via a
  temporary `gapAnchor.curtain = { card: 'stormrend_eye', x: -40 }` → lane at −8. An authored gap is
  never unreachable.
- **G6 — no-diet/print/emission movers:** per-volley bullet counts equal carded vs un-carded (G2 vs
  G4, same q — position only); no def `rhythm`/`cadence`/`attacks` field changes in this PR →
  rhythmprint byte-identical by construction; `curtain`/`movingGap`/`iris` emit no amber on either
  path (`emitBoss(…, false, …)` throughout all three branches) → amberdiet untouched.

## 6. Forward contracts + scope fence

ENG-B ships: the resolver, the three read points, the STORMREND opt-in, `debugForceCard`, the G1–G6
gates. **It does NOT ship any dread composition.** The four consumers, and what each will add on top:

- **C.1b STORMREND eye corridor:** already half-served by the hero. Adds the ×3 chain (card-scoped
  cadence override — a NEW seam, not this one), corridor ambers from `focalEye` (that half is ENG-A:
  `emitOrigins: { aimed: ['focalEye'] }`), and the ring-alignment rig. Consumes the hero's
  `gapAnchor` unchanged.
- **C.3b MARROWCOIL rib aperture:** "movingGap whose gap = the surviving rib aperture." The model
  handle already exposes `liveRibs` / `ribAlive` / `crackRib` (bossMarrowcoil.js, §ENG-E — plumbed
  through the `RIB_SYS` registry in boss.js). The resolver grows ONE branch in that PR — a dynamic
  descriptor, e.g. `{ ribAperture: true }` → pick the surviving rib pair's pivot world-x from
  `model.liveRibs()` (rib index → `ribPivot*` name, the existing `ribTagToIdx` mapping inverted).
  Deliberately NOT in ENG-B: it's marrowcoil-shaped logic with its own gates (the E.4 row already
  flags "laneSafe on movingGap with AUTHORED rib-aperture gaps … where ENG-B can silently fail the
  fill gate" — that laneSafe run belongs to C.3b's PR, and the clamp (§3) is what makes it passable).
- **C.7 KNELLGRAVE bob-locked gap:** "movingGap rows whose gap is phase-LOCKED opposite the bob."
  Once ENG-H's `pendulumSweep` setpiece exists with a named bell part, the def opts in
  `{ part: 'bellMouth', offset: <opposite> }` — or a computed descriptor if "opposite the bob"
  needs `−x`; either way the per-row live resolve (read point 2) already gives bob-tracking for free.
  ⚠ the pendulum sweeps x ±14 — outside movingGap's ±9 clamp at the extremes; C.7 must author the
  offset/ratio so the READ stays honest where the clamp bites (flagged in §7).
- **C.8 WEFTWITCH hand-skipped lane:** hands exist as named pivots today
  (bossWeftwitch.js: `pivot.name = \`handPivot${side}\``). Her cards opt `curtain`/`movingGap` into
  `{ card: …, part: 'handPivotL'/'…R', offset: … }` or a fixed choreo-driven `x`. Her real ask is the
  ONE-BEAT-EARLY decision (§7 risk 2) — the tell-time hook is HER PR's addition, on this seam's rails.

## 7. Drift & risks (verified against current master)

1. **All three branches ARE player-placed today — confirmed** (quotes in the header). Also confirmed:
   the attack is *selected* at telegraph-arm time (`curAttack = step.id … chargeT = chargeDur;
   model.setAttackTell?.(curAttack)`) but the gap is *computed* at fire time
   (`if (chargeT <= 0) { … executeAttack(curAttack, player) }`) — 0.5–0.72 s later
   (`telegraphWall: 0.72` for curtain). Nothing in the shipped game draws the gap during the tell,
   so ENG-B's fiction depends on the anchor PART being visible — true for `focalEye` (the single
   brightest thing on the boss, per bossMandala's focal-point law).
2. **The "decide one beat EARLY" problem (C.8) — fire-time resolution is enough for the HERO, not for
   WEFTWITCH.** For a continuously-readable anchor (the eye, the bob) the player reads the organ
   itself, live — no pre-commit needed. C.8's hands must SHOW the skipped lane during the telegraph,
   i.e. the gap must be decided when the tell arms. That is a small additive hook for C.8's PR, on
   this seam: an opt-in `atTell: true` spec field; at the telegraph-arm site (beside
   `model.setAttackTell?.(curAttack)`) resolve once into a held module var, and have
   `resolveGapAnchor` return the held value while the volley it armed is in flight. NOT built in
   ENG-B — the hero doesn't need it, and building it un-consumed violates the coexist rule.
3. **Moving-anchor fairness:** per-row live resolve means a fast anchor could out-run the player
   between rows. The eye sways ≤ ±5 at 0.7 rad/s → ≤ ~1.8 x-units over a 1.2 s row stream at worst —
   well inside the 2.6 half-width lane. The clamp (§3) guarantees reachability even for hostile
   anchors (pendulum nadir at ±14 clamps to ±9), but a clamped anchor DECOUPLES the lane from the
   organ at the extremes — a literalism break, not a fairness break; C.7/C.8 must author their
   offsets to keep the read honest inside the clamp range. Flag this in each consumer PR's POST-BUILD.
4. **Headless determinism:** `resolveGapAnchor` needs `model.partWorldPos` — in the headless
   `debugEmitAttack` fence def/model are null → `null` → shipped path (same guard shape as
   `resolveEmitOrigins`' `if (!names || !model?.partWorldPos) return null`). The `x` fallback keeps a
   part-less spec deterministic everywhere.
5. **movingGap closure move:** relocating the `gap` computation into the fire closure is the one
   non-additive touch; it is provably byte-identical un-opted (no RNG, all inputs frozen per-row) and
   G1/G3 pin it. `iris`'s schedule-time single resolve is a deliberate asymmetry (concentric rings —
   §2); do not "fix" it to per-ring.
6. **Do not touch:** `anchorX` itself (tunnel/spiralStream share it), the `crestfall`/`horizonPocketX`
   pair (shipped dread, C.9a traced it green), `SUSTAINED`, telegraph durations, any `def.rhythm`.
