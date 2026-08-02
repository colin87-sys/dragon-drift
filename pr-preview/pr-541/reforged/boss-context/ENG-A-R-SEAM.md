# ENG-A-R — Directional roll-parry reflect onto body parts (PRE-BUILD spec)

**The reverse of ENG-A.** ENG-A (`def.emitOrigins` + `resolveEmitOrigins`, merged) made the
boss's OUTGOING fire come from its body parts. ENG-A-R makes the player's REFLECTED bullets
always LAND on a hittable body part, biased by the dodge-roll's direction — never into the
hollow centre.

**Owner intent (verbatim):** *"when I attack or parry stuff back to the boss, the bullets can
just hit empty air, like the space between marrowcoil's ribs. I always wanted it to hit a
certain spot. maybe if you parry and dodge roll from the right to the left, you swat the
bullet to the left side of the boss, and vice versa. but it should always be hitting
something."*

**Owner-approved aim model (decided, not re-litigated): directional + auto-snap.** Roll
direction BIASES the side; the system SNAPS to the nearest hittable part on that side; no
part on that side → nearest-anywhere; no target set at all → the shipped centre aim. A
reflect NEVER whiffs.

**Hero: MARROWCOIL** (ribs + skull). Composes with ENG-E (ORGAN BREAK) but does not ship it.

---

## 0. The defect, verified in live code

`reflectBossBullets` (`reforged/js/bossBullets.js`) aims every swatted bullet at the boss's
geometric centre:

```js
// Flip it back at the boss.
s.owner = 'player';
s.targetRel = settleGap;
s.tx = bossX; s.ty = bossY;
s.vrel = CONFIG.BOSS.bossSpeed;
const t = Math.max((settleGap - s.rel) / CONFIG.BOSS.bossSpeed, 0.05);
s.vx = (bossX - s.x) / t;
s.vy = (bossY - s.y) / t;
```

The one call site (`boss.js`, inside `updateBoss`'s fight branch) passes the **pose centre**
— `const pose = { x: 0, y: B.fightHeight, rel: B.settleGap }`:

```js
if (player.rollInvuln > 0) {
  // In Surge, EVERY bullet is reflectable (not just the amber ones).
  const r = reflectBossBullets(player, B.reflectWindow, B.settleGap, pose.x, pose.y, surge,
    adrenRung >= 4 ? 1.3 : 1);   // R4 parry burst
```

Reflected (`owner 'player'`) bullets fly STRAIGHT (no homing — the wisp fan/home/lunge
branch is `owner === 'lance'` only; *"Rider/reflected fly straight"*). Arrival, in
`updateBossBullets`:

```js
if (s.rel >= s.targetRel) {
  const dx = s.x - s.tx, dy = s.y - s.ty;
  if (dx * dx + dy * dy < bossR * bossR) {
    emit('bossDamage', { amount: s.dmg, kind: s.owner, x: s.x, y: s.y, part: s.part });
  }
```

`bossR = CONFIG.BOSS.bossHitRadius` (4.2). Note the arrival test is distance from the **aim
point** `(s.tx, s.ty)`, not from any live body geometry — so a centre-aimed reflect on
MARROWCOIL "hits" for damage while the bullet visibly flies through the gap between ribs.
The damage economy is fine; the READ is a lie, and ENG-E ("break the rib you aim at")
cannot be built on it. ENG-A-R fixes WHERE it lands; it must not change HOW MUCH.

---

## 1. The hittable-part set — a per-def `reflectTargets`, resolved like `resolveEmitOrigins`

**Is there already a queryable set?** Yes, three, but none is the right one to consume raw:

- `model.partWorldPos(name, out)` — attached to EVERY boss handle in `buildBoss`
  (`bossModel.js`): *"this resolves one by name — CACHED … writing its live world position
  into `out`, or null if the name is absent (callers fall back to the boss centre)."* This
  IS the position primitive ENG-A-R reuses.
- `lockCandidates()` (`boss.js`) — *"if (def.lockParts) for (const lp of def.lockParts)
  out.push(lp.part); if (def.virtualLockOrgan) out.push(def.virtualLockOrgan);"* — the
  lance-lock enumeration.
- `paintableParts()` — the phase-filtered, liveness-filtered (`lockPartDead`), eye-seal
  aware paint set.

**Why not reuse `lockParts`/`paintableParts` directly:** the lock layer is a
PROGRESSION-gated economy (`saveData.flags.lockUnlocked`, phase gates, venting exemptions).
A reflect landing on a rib is *physics*, not economy — it must work on a fresh save, during
amber vents, in every phase. And a def may legitimately want reflect anchors that aren't
lance organs (a big shield boss, say). So: **new def field, mirroring `emitOrigins`'s
shape**, plain data in `bossDefs.js`:

```js
// bossDefs.js, marrowcoil def (the ONLY def that gains it in ENG-A-R):
reflectTargets: ['ribPivotL1', 'ribPivotR1', 'ribPivotL3', 'ribPivotR3', 'skullGroup'],
```

All five names exist today: the rib pivots are authored in `bossMarrowcoil.js`
(``pivot.name = `ribPivot${sx < 0 ? 'L' : 'R'}${h}` `` — the same four L1/R1/L3/R3 the def's
`lockParts` and the `RIB_EMITTERS` amber vents already use), and `skullGroup` is the def's
`muzzle`/`virtualLockOrgan` (`skull.name = 'skullGroup'` in `bossModel.js`).

**NEW resolver in `boss.js`, beside `resolveEmitOrigins` (same conversion, same guard):**

```js
// ENG-A-R: resolve the def's reflect-target parts to live bullet-frame anchors.
// null when un-opted (→ shipped centre aim, byte-identical). Parts at/behind the
// player plane are skipped (the resolveEmitOrigins rel<=0.5 guard — a target behind
// you would solve a bullet flying away). Unlike emit, an EMPTY result must NOT skip
// anything: the caller falls back to centre — a reflect always fires back.
const _rtV = new THREE.Vector3();
function resolveReflectTargets(player) {
  const names = def?.reflectTargets;
  if (!names || !model?.partWorldPos) return null;
  const out = [];
  for (const name of names) {
    const w = model.partWorldPos(name, _rtV);
    if (!w) continue;
    const rel = -w.z - player.dist;
    if (rel <= 0.5) continue;
    out.push({ x: w.x, y: w.y, rel, part: name });
  }
  return out.length ? out : null;   // empty → null → centre (never-whiff, unlike emit's SKIP)
}
```

World→bullet frame is verbatim `resolveEmitOrigins`: *"(wx,wy,wz) → { x, y, rel: -wz -
player.dist }"*. Deliberate semantic difference from emit, stated in the comment: emit's
empty array means *"SKIP the volley — never fall back to posts nobody occupies"*; reflect's
empty result means **fall back to centre**, because the swat already happened and the
bullet must go somewhere.

**Coexist default:** every def without `reflectTargets` → `resolveReflectTargets` returns
null → `reflectBossBullets` receives `targets = null` → the shipped
`s.tx = bossX; s.ty = bossY; s.targetRel = settleGap` path runs byte-identical. Headless
suites that call `reflectBossBullets` with the old 7-arg form get `targets = null` by
default — every existing §3c/3d assert passes untouched.

(Future ENG-E note: when a rib becomes destructible, compose with the `lockPartDead`
liveness idiom so a cracked rib leaves the set — not needed for this increment.)

---

## 2. The aim math (inside `reflectBossBullets`, per swatted bullet)

New trailing parameter: `reflectBossBullets(player, windowRel, settleGap, bossX, bossY,
all = false, dmgBonus = 1, targets = null)`. Replace the four target lines; keep the
`vx/vy` solve shape:

```js
const isPerfect = s.rel <= (debugPerfectRel ?? CONFIG.BOSS.perfectParryRel);
// ENG-A-R target pick: roll-favored side first, else nearest-anywhere, else centre.
let tx = bossX, ty = bossY, trel = settleGap, aimPart = null;
if (targets) {
  const dir = player.lastRollDir || 0;            // ±1; 0 (or absent) = unbiased
  let best = null, bestD = Infinity, side = null, sideD = Infinity;
  for (const c of targets) {
    const ddx = c.x - s.x, ddy = c.y - s.y, d2 = ddx * ddx + ddy * ddy;
    if (d2 < bestD) { bestD = d2; best = c; }
    if (dir && (c.x - bossX) * dir > REFLECT_SIDE_EPS && d2 < sideD) { sideD = d2; side = c; }
  }
  const pick = side || best;                      // auto-snap: side, else anywhere
  if (pick) {
    tx = pick.x; ty = pick.y;
    trel = Math.max(pick.rel, 4);                 // the fireLanceAt floor
    aimPart = pick.part;
  }
}
s.owner = 'player';
s.targetRel = trel;
s.tx = tx; s.ty = ty;
s.aimPart = aimPart;                              // NEW slot field (see §4)
s.vrel = CONFIG.BOSS.bossSpeed;
const t = Math.max((trel - s.rel) / CONFIG.BOSS.bossSpeed, 0.05);
s.vx = (tx - s.x) / t;
s.vy = (ty - s.y) / t;
```

Module const in `bossBullets.js`: `const REFLECT_SIDE_EPS = 0.5;` (tunable; no CONFIG bloat
for v1).

**"Side" definition — part.x vs BOSS CENTRE (`bossX = pose.x`), not vs the player.** The
owner said "the left side of *the boss*"; `bossX` is already an argument (zero plumbing);
and a player parked off-lane must not flip which rib counts as "left". The `> REFLECT_SIDE_EPS`
strict test makes a centre-line part (`skullGroup`, x ≈ 0 ≈ pose.x) belong to NEITHER side —
it is the anywhere-fallback anchor, never a side pick, so a directional roll always prefers
a true flank rib when one is ahead.

**Direction sign convention** (matches `tryRoll(dir)` / `input.rollRequest`: right = +1,
left = −1): *"dodge roll from the right to the left"* = leftward roll = `dir −1` → favored
candidates have `(c.x - bossX) * (−1) > EPS`, i.e. `c.x < bossX − 0.5` — the boss's
screen-LEFT side. The swat continues the roll's momentum. `dir +1` mirrors.

**Nearest metric:** squared lateral distance in the bullet frame from the swatted bullet's
own `(s.x, s.y)` — each bullet of a multi-swat picks its own target, so a cluster of
parried ambers fans across the ribs instead of converging on one point (and each future
ENG-E hit lands where it visually should). `rel` is excluded from the metric — all
candidates sit near `settleGap` and x/y is the read that matters.

**New slot fields (additive, inert defaults):** `aimPart: null` in `makeSlot()`, reset in
`spawnBossBullet` (`s.aimPart = null;`). It is diagnostics + the ENG-E hook + gate
observability; nothing in the update loop reads it.

**Degenerate cases:**
- `targets === null` (un-opted, or all resolved parts behind plane) → centre aim, shipped
  numbers verbatim.
- `dir === 0` (no roll direction known — e.g. headless `makePlayer()`) → `side` stays null
  → nearest-anywhere. Still never centre when a target set exists.
- Favored side empty (part-sparse side, or a flank rib culled behind-plane mid-flythrough)
  → nearest-anywhere. **The auto-snap chain guarantees no whiff at every rung.**
- Part behind plane → already skipped at resolve (`rel <= 0.5`, the
  `resolveEmitOrigins`/`emitRibBullets` guard: *"rib already at/behind the player → skip
  (would fly away)"*).
- Surge (`all = true`): every swatted bullet takes the same pick logic — bias applies, fine.

`s.dmg`, `s.color`, `s.life`, the perfect/normal mults, `s.part` — all untouched (see §4).

---

## 3. Roll-direction source — `player.lastRollDir` (the minimal thread)

**What exists:** `player.roll = { t, dur, dir }` (`player.js`: *"{ t, dur, dir } while a
barrel roll is active"*), set by `tryRoll(dir)`; `dir` is ±1 from every input path
(keyboard double-tap / Shift+dir, touch steer-flick `Math.sign(vx)`, second-finger swipe) —
the sign is uniform and clean.

**The gap (load-bearing, verified in `config.js`):** `rollDuration: 0.45` but
`rollInvuln: 0.5` — and `player.update` nulls the roll at duration
(`if (this.roll.t >= this.roll.dur) this.roll = null;`) while the reflect seam gates on
`player.rollInvuln > 0`. So for the final ~50 ms of every parry-eligible window
`player.roll` is null and `roll.dir` is unreadable. Reading `roll?.dir` alone would make
late perfect-parries silently lose their bias; reading `velocity.x` is corrupted by
counter-steer.

**The fix — one persistent field on `player` (`player.js`):**
- declare `lastRollDir: 0,` beside `rollInvuln: 0,`
- in `tryRoll(dir)`: `this.lastRollDir = dir;` (next to `this.rollInvuln = CONFIG.rollInvuln;`)
- in `reset()`: `this.lastRollDir = 0;`

Because `rollInvuln` is granted ONLY by `tryRoll`, whenever the reflect seam runs
(`rollInvuln > 0`) `lastRollDir` is exactly the direction of the roll that granted the
current i-frames — no staleness window, no extra plumbing. `reflectBossBullets` reads it
off the `player` param it already receives (`player.lastRollDir || 0`), so **no signature
change is needed for direction** — only the trailing `targets` arg is new. Headless callers
(`makePlayer()` in `tests/boss.mjs` has no such field) get `undefined → 0` → unbiased
nearest-anywhere, and with `targets` omitted, the shipped centre path.

**Call site change (`boss.js`, the one `reflectBossBullets` call):**

```js
if (player.rollInvuln > 0) {
  const r = reflectBossBullets(player, B.reflectWindow, B.settleGap, pose.x, pose.y, surge,
    adrenRung >= 4 ? 1.3 : 1, resolveReflectTargets(player));
```

Resolution cost: ≤5 cached `partWorldPos` lookups, only while `rollInvuln > 0` (≤0.5 s per
roll) — nothing at 60fps steady-state.

---

## 4. Hit attribution — the retarget is damage-neutral and ENG-E-ready

Two attribution channels exist, and ENG-A-R touches neither's semantics:

1. **`s.part` — the SOURCE-organ tag.** Set at spawn (*"an optional source-part tag …
   rides the bullet so a REFLECTED amber lands its damage on the part it came from"*).
   `reflectBossBullets` never writes `s.part` (verified: it flips
   owner/targetRel/tx/ty/vrel/vx/vy/color/dmg/life only) — so the V4 perfect-parry
   `snapParts` harvest, the HOLLOWGATE numeric pane tag (*"the crack router weights
   `typeof part === 'number'` as reflected-full, so the bullet's tag must stay a
   number"*), and the WEFTWITCH/KARNVOW parry stagings are all byte-identical. `aimPart`
   is a SEPARATE new field precisely so aim never aliases source.

2. **Landing x/y — the routing ENG-E will consume.** Arrival emits the bullet's ACTUAL
   position: *"`x`/`y` are the bullet's ACTUAL landing point (not the aim target — the
   fallback routing must test where the shot really hit …)"*. The handler is
   `on('bossDamage', (e) => damageBoss(e.amount, e.kind, e))` → `routePartDamage(e)`,
   whose fallback is `idx = model[sys.hit](e.x - pose.x, e.y - pose.y)` — boss-local
   landing-point hit-test. **So yes: aiming at part P's world-x makes the landing
   attribute to P** the moment a def has a `PART_SYS` hit-test for it. That is the ENG-E
   synergy — *roll left to aim the parry at rib L1, and the same parry's landed hits are
   the ones that crack it* — with zero further wiring in this seam.

**On MARROWCOIL today the damage number is provably unchanged:** its def has neither
`destructiblePanes` nor `destructibleShackles`, so `routePartDamage` falls through its
`if (!def?.[sys.flag] …) continue;` guard for both `PART_SYS` rows and returns 0 —
centre-aimed or rib-aimed alike. `amount` is `s.dmg` (mults untouched), `kind` is
`'player'` (KARNVOW's `reflectRiposte` keys on `kind === 'player'` only — unaffected, and
KARNVOW is un-opted anyway). Retargeting moves WHERE it lands, never how much, when, or
what it feeds.

**Caution for future opt-ins (not this increment):** on a `PART_SYS` boss (HOLLOWGATE,
BRINEHOLM), landing ON a part routes a 0.5-weight fallback hit that centre-aim used to
miss *"by design"* (`routePartDamage` comment). Opting those defs into `reflectTargets`
deliberately changes their part economy and needs its own gate pass. Hero scope keeps this
moot.

---

## 5. Gate plan (`reforged/tests/boss.mjs`)

**Observability first:** extend `debugActiveBullets()` with `tx: s.tx, ty: s.ty,
targetRel: s.targetRel, aimPart: s.aimPart` — its own comment sanctions this (*"Existing
consumers read x/y only — the extra fields are additive-safe"*). Add
`export function debugReflectTargets(player) { return resolveReflectTargets(player); }`
in `boss.js` beside `debugLockCandidates`/`debugPaintables` (same test-seam idiom).

New block after §3c, mirroring its exact driving idiom (spawn amber at `rel 2` near the
player → call `reflectBossBullets(makePlayer(), CONFIG.BOSS.reflectWindow,
CONFIG.BOSS.settleGap, 0, CONFIG.BOSS.fightHeight, …)`):

1. **Coexist (no set):** omit `targets` → the reflected slot has
   `tx === 0 && ty === CONFIG.BOSS.fightHeight && targetRel === CONFIG.BOSS.settleGap &&
   aimPart === null`. (Plus: the entire existing §3c/3d suite passing unmodified IS the
   byte-identity gate.)
2. **Roll bias picks the correct side:** `targets = [{x:-4, y:13, rel:30, part:'L'},
   {x:4, y:13, rel:30, part:'R'}, {x:0, y:13, rel:30, part:'skull'}]`;
   `p.lastRollDir = -1` → `aimPart === 'L'`, `tx === -4`; `p.lastRollDir = +1` → `'R'`.
   Centre-line `'skull'` never wins a sided pick (the EPS law).
3. **Auto-snap fallback (never whiff):** all targets on the left, `lastRollDir = +1` →
   `aimPart` is a left part (nearest-anywhere), NEVER `(0, fightHeight)`.
   `lastRollDir = 0` → nearest-anywhere.
4. **Damage/economy invariance:** with a part target, run to arrival and assert
   `bossDamage` amount `=== 18 * CONFIG.BOSS.reflectDamageMult` — mirror the existing
   `reflDmg` assert verbatim; same for the perfect mult. Perfect-parry an amber spawned
   with `part: 'ribPivotL1'` + targets → `snapParts` still `['ribPivotL1']` (source tag
   preserved; aim ≠ attribution).
5. **Hero integration:** boot a live `marrowcoil` fight (the WEFTWITCH thread-cut sim is
   the template: find an in-window `reflectable` via `debugActiveBullets()`, set player on
   it, `player.rollInvuln = 0.1`, `p.lastRollDir = ±1`, step). Assert every `owner
   'player'` bullet's `(tx, ty)` matches an entry of `debugReflectTargets(player)` (ε
   0.01) and differs from the pose centre; with `lastRollDir = -1` assert the picked
   part's x < 0 when any left-side candidate was resolved.
6. **Behind-plane:** during a synthetic flythrough (or by feeding a `targets` array whose
   flank entries were pre-filtered), assert the resolver's `rel <= 0.5` skip and the
   null→centre fallback.

No geometry changes → `tricount`/`tiershots` untouched. No damage/TTK/amber-economy change
(§4) → the amberdiet gate and TTK sims are unaffected; the retarget only moves WHERE the
bullet lands.

---

## 6. Hero + scope

**Ships in ENG-A-R:**
- `bossBullets.js`: `targets` param + side/nearest pick + `aimPart` slot field +
  `debugActiveBullets` fields (+ `REFLECT_SIDE_EPS`).
- `boss.js`: `resolveReflectTargets` + the one call-site arg + `debugReflectTargets`.
- `player.js`: `lastRollDir` (declare / set in `tryRoll` / clear in `reset`).
- `bossDefs.js`: `reflectTargets` on **marrowcoil only** —
  `['ribPivotL1','ribPivotR1','ribPivotL3','ribPivotR3','skullGroup']` (two anchors per
  flank + the skull as the centre-line/fallback anchor; the same organs the player already
  knows as lance/amber anatomy — §5i.C law 3, *"Amber is ANATOMY, never paint"*).
- Tests per §5.

**Explicitly NOT in scope:** ORGAN BREAK / rib HP (ENG-E — but note the compose: ENG-A-R
delivers the aim verb and the landing-point attribution ENG-E's rib hit-test will read;
*roll to aim at a rib, parry to break it*); homing for `'player'` bullets (straight flight
kept — the wisp steer stays `owner 'lance'` only); any other def opt-in (EITHERWING's
moving twins and the `PART_SYS` bosses each need their own pass, §7); any change to swat
eligibility, damage mults, perfect windows, heal/streak/score (all upstream or untouched).

---

## 7. Drift & risks

1. **Roll direction at the seam — mostly clean, one real gap (the load-bearing find).**
   `roll.dir` exists and is ±1 from every input path, but `rollInvuln` (0.5) outlives
   `roll` (nulled at `rollDuration` 0.45), so the last ~50 ms of every parry window — the
   PERFECT-parry-rich tail — has no live `dir`. The `lastRollDir` field closes it exactly
   (only `tryRoll` grants invuln). Without it, late perfects silently lose bias — the
   scheme genuinely needs this one threaded signal.
2. **Directional aim must never make reflects harder to land — guaranteed by
   construction.** Swat eligibility (`d2 > 9` near-player test, window, reflectable flag)
   is untouched, and the arrival check measures distance from the AIM POINT within
   `bossHitRadius` 4.2 — a retargeted bullet cannot mechanically miss. The snap chain
   (side → anywhere → centre) has no empty rung. The only "miss" mode left is visual
   (risk 3).
3. **Moving parts:** the aim solves ONCE at swat; flight ≈ *(settleGap−1.5)/bossSpeed ≈
   0.55 s* (config's own comment). MARROWCOIL's bob + `closingRibs` pivot rotation can
   drift a rib a small distance in that time — the bullet still "hits" (arrival is vs
   tx/ty) but may land visually just off the bone. Acceptable for the hero (slow, huge
   anchors); it is WHY EITHERWING's lemniscate twins are excluded — opting fast movers in
   needs a near-arrival re-resolve (deferred, not spec'd).
4. **`PART_SYS` economy on future opt-ins** (§4 caution): rib-accurate landings turn the
   *"aimed at the centre miss the part by design"* assumption off for any pane/shackle
   boss given `reflectTargets` — a deliberate, gated, per-def decision later; zero effect
   in this increment.
5. **Fairness vs the old always-centre homing:** damage, timing (±(trel−settleGap)/
   bossSpeed ≪ 0.1 s; `trel` floored at 4 like `fireLanceAt`), heal, streaks, riposte, and
   snap-paint are all invariant; the delta is trajectory + landing point + the new aim
   READ. Flythrough edge (`ribThread`): flank ribs cull behind-plane → set thins to skull
   → then centre-fallback — degrades gracefully to shipped behavior, never to a whiff.
