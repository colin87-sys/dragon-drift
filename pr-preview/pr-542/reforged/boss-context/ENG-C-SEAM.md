# ENG-C SEAM — `geyser`: the roster's one new attack id (crestfall's bottom-up mirror)

**Status: PRE-BUILD SPEC (verified against live master, 2026-07-09 — post solar-spectacle merge,
post ENG-A / ENG-A-R / ENG-E / ENG-B).**
Plan of record: `ATTACK-REWORK-PLAN.md` §E.1 row C + §C.5. Hero: **BRINEHOLM** (slot 8,
Calamities), dread card `brineholm_sounding` ("THE ISLAND BREATHES — Sounding").

Files the builder touches: `js/boss.js` (one branch + one Set entry), `js/bossDefs.js`
(BRINEHOLM def-data only), `tests/boss.mjs` (two whitelist entries + one assert block).
**NOT touched:** `js/bossBullets.js` (the cull work is already paid — §0 below),
`js/bossRhythm.js` (geyser is deliberately NOT an amber carrier), `js/particles.js`
(the plume telegraph reuses `burst` as-is).

---

## 0. Verified ground truth (drift check against the plan)

### 0.1 The −16 cull floor is REAL and already pays for below-frame births — CONFIRMED

`bossBullets.js`, boss-owner branch of `updateBossBullets`, verbatim:

> ```js
> // Cull off-frame bullets. The lower y-bound is WIDENED to -16 (§5e, the
> // MARROWCOIL/BRINEHOLM below-approach need): a boss that rises through the
> // fog line and fires from below-frame is born at negative y, so a tight
> // -4 floor deleted its bullets at birth. ...
> // The shipped bosses fire from y≈13 and never reach this floor (byte-safe).
> if (s.rel < -12 || s.life <= 0 ||
>     Math.abs(s.x) > CONFIG.laneHalfWidth + 10 || s.y < -16 || s.y > 34) {
>   deactivate(i);
> }
> ```

`CONFIG.laneMinY` is **2.5** (`config.js`), so geyser's birth y = `laneMinY - 3` = **−0.5** —
15.5 m above the cull floor. The comment names BRINEHOLM's below-approach as the reason the
floor was widened. **The plan's E.0.4 claim holds exactly: no cull PR, births survive today.**
A geyser bullet rising at `vy = +5.5` crosses `laneMinY` (into the visible lane) in ~0.55 s and
reaches mid-lane (~y 9) around the time it crosses the player plane
(`settleGap 30 / (bulletSpeed 28 × 0.6) ≈ 1.79 s`). Bullet `life: 6` (set in `emitBoss`) never
binds. `s.y += s.vy * dt` in the update loop is all the motion geyser needs — no new kinematics.

### 0.2 The crestfall template (verbatim, current master)

`boss.js` `executeAttack`, the `id === 'crestfall'` branch:

> ```js
> const rows = quality < 0.75 ? 4 : 5;
> const slow = closing * 0.6;
> const dir = Math.random() < 0.5 ? 1 : -1;
> const g0 = Math.max(-6, Math.min(6, player.position.x));
> for (let k = 0; k < rows; k++) {
>   const b = activeBand[k % activeBand.length];
>   pending.push({ t: k * 0.32, fire: () => {
>     const hw = Math.min(12, arenaHW - 1), stepX = quality < 0.75 ? 3.0 : 2.3;
>     const gapC = horizonPocketX != null ? horizonPocketX : (g0 + dir * 2.5 * k);
>     const gap = Math.max(-hw + 3.4, Math.min(hw - 3.4, gapC));
>     const topY = CONFIG.laneMaxY + 3;          // spawn AT the crest, above the frame top
>     for (let x = -hw; x <= hw; x += stepX) {
>       if (Math.abs(x - gap) < 3.4) continue;   // the safe pocket (generous — a full frame)
>       emitBoss(x, topY, 0, -5.5, -slow, false, b.c, b.s);   // breaks DOWNWARD (vy) + closes (vrel)
>     }
>   } });
> }
> ```

Context symbols: `closing = B.bulletSpeed` (28) at the top of `executeAttack`; `pending` is the
module array `const pending = []` pumped in the fight update
(`pending[i].t -= dt; if (pending[i].t <= 0) { pending[i].fire(); pending.splice(i, 1); }`);
`emitBoss(x, y, vx, vy, vrel, reflectable, color, sizeMult, ...)` wraps `spawnBossBullet` with
`rel: originRel ?? pose.rel`, `life: 6`, `dmg: B.bulletDamage`. `horizonPocketX` is
EMBERTIDE-card-only (reset to null everywhere) — geyser does NOT read it; its generalized
equivalent is ENG-B's `resolveGapAnchor(id)` (§1 below).

### 0.3 DRIFT FINDING — crestfall is NOT in the budget loop's `ALL_ATTACKS`

`tests/boss.mjs` has TWO whitelists and they differ:

- The **defs known-attack whitelist** (schema section 1) — crestfall IS present:
  `['aimed', 'fan', 'spiral', 'tunnel', 'spiralStream', 'curtain', 'movingGap', 'iris',
  'stream', 'secondWave', 'crossfire', 'crestfall'].includes(a)`
- The **emission-budget loop** (section 3e) — crestfall is ABSENT:
  `const ALL_ATTACKS = ['aimed', 'fan', 'spiral', 'tunnel', 'spiralStream', 'curtain',
  'movingGap', 'iris', 'stream', 'secondWave', 'crossfire'];`

So the plan's "geyser's bullet count == crestfall's, already proven at slot 13" is proven by
identical dials + the live game, **not by an existing crestfall budget assert**. Consequence for
ENG-C: `geyser` must be added to BOTH lists (§3), and its own budget/laneSafe asserts are the
real proof. *Optional 2-line hygiene in the same PR (flag for POST-BUILD, not mandated):* add
`'crestfall'` to `ALL_ATTACKS` too — the math (§3.2) shows it passes.

### 0.4 The headless flush runs with `def`/`model` null

`debugEmitAttack` flushes `pending` immediately (`while (pending.length) { ... p.fire(); ... }`)
and the `aimed` branch carries the warning comment: *"def/model null on the headless
debugEmitAttack flush"*. The geyser branch therefore uses only null-safe reads (`def?.accent`,
`resolveGapAnchor` already guards with `def?.gapAnchor`). `burst` (particles.js) is
headless-safe: `spawn` early-returns when `acquire()` finds no pool (`if (!sp) return;`), and
`makePlayer()` in boss.mjs provides `dist: 0`, so the plume's world-z math never NaNs.

---

## 1. The `geyser` executeAttack branch (pseudo-diff, `js/boss.js`)

### 1.1 One Set entry — the wind-up class

`geyser` is a streamed multi-row pattern → it takes `B.telegraphSustained` (0.7 s), like
crestfall. The dispatch at attack-pick time is:

> `chargeDur = curAttack === 'curtain' ? B.telegraphWall : (SUSTAINED.has(curAttack) ? B.telegraphSustained : B.telegraphInstant);`

```diff
- const SUSTAINED = new Set(['tunnel', 'spiralStream', 'movingGap', 'iris', 'stream', 'secondWave', 'crestfall']);
+ const SUSTAINED = new Set(['tunnel', 'spiralStream', 'movingGap', 'iris', 'stream', 'secondWave', 'crestfall', 'geyser']);
```

### 1.2 The branch — insert directly AFTER the `crestfall` branch (the mirrors sit adjacent)

```js
} else if (id === 'geyser') {
  // GEYSER (ENG-C — the Calamities band's ONE new attack id, §5b; BRINEHOLM-only,
  // crestfall's deliberate bottom-up mirror across the 8/13 value-inversion axis).
  // THE FLOOR ERUPTS: full-width rows are born BELOW the frame (CONFIG.laneMinY - 3
  // = -0.5, safely inside the -16 cull floor bossBullets.js widened for exactly this
  // §5e need) and erupt UPWARD (vy > 0) while closing (vrel); the safe gap SLIDES
  // between rows like movingGap's. FAIRNESS (§5i.B drawn-in-world): ONE BEAT before
  // each row, spray plumes flash at the foot of every doomed column — the gap column
  // stays dark — so each eruption is read on the water line, never an unreadable wall.
  const rows = quality < 0.75 ? 4 : 5;                  // crestfall's dials, verbatim
  const slow = closing * 0.6;
  const dir = Math.random() < 0.5 ? 1 : -1;             // slide direction only (crestfall/movingGap precedent)
  const g0 = Math.max(-6, Math.min(6, player.position.x));
  const BEAT = 0.32;                                    // crestfall's row step doubles as the plume lead
  for (let k = 0; k < rows; k++) {
    const b = activeBand[k % activeBand.length];
    let gapX = null;   // sealed at PLUME time; the eruption REUSES it (the telegraph can never lie)
    const solveGap = () => {
      const hw = Math.min(12, arenaHW - 1);
      // §ENG-B: a def-authored anchor (e.g. the submerged head's live x during the
      // Sounding — the lee pocket) LOCKS the lane; resolved at plume time so plume and
      // eruption always agree. Un-opted (ENG-C ships no opt) → the player-seeded slide.
      const ax = resolveGapAnchor('geyser');
      return Math.max(-hw + 3.4, Math.min(hw - 3.4, ax != null ? ax : g0 + dir * 2.5 * k));
    };
    pending.push({ t: k * BEAT, fire: () => {           // the PLUME beat — zero bullets
      gapX = solveGap();
      const hw = Math.min(12, arenaHW - 1), stepX = quality < 0.75 ? 3.0 : 2.3;
      for (let x = -hw; x <= hw; x += stepX) {
        if (Math.abs(x - gapX) < 3.4) continue;         // the safe column shows NO plume
        tmp.set(x, CONFIG.laneMinY - 0.3, -(player.dist + pose.rel));
        burst(tmp, def?.accent ?? 0x3ad0b0, { count: 5, speed: 8, size: 0.8, life: 0.45 });
      }
    } });
    pending.push({ t: k * BEAT + BEAT, fire: () => {    // the ERUPTION, one beat later
      const gap = gapX != null ? gapX : solveGap();     // defensive — never a gapless wall
      const hw = Math.min(12, arenaHW - 1), stepX = quality < 0.75 ? 3.0 : 2.3;
      const footY = CONFIG.laneMinY - 3;                // BELOW the frame (world y −0.5)
      for (let x = -hw; x <= hw; x += stepX) {
        if (Math.abs(x - gap) < 3.4) continue;          // crestfall's safe slot, mirrored
        emitBoss(x, footY, 0, 5.5, -slow, false, b.c, b.s);   // ERUPTS upward (+vy) + closes (vrel)
      }
    } });
  }
}
```

Build notes, by symbol:
- `tmp` is the existing module-scope `const tmp = new THREE.Vector3()` in boss.js; the
  world-z convention `-(player.dist + pose.rel)` is the dying-burst precedent
  (`tmp.set(pose.x + ..., pose.y + ..., -(player.dist + pose.rel)); burst(tmp, ...)`).
  Plumes are drawn at the bullet birth plane (`pose.rel`) — same depth the columns erupt at.
- `burst` is already imported in boss.js (`import { burst } from './particles.js'`).
- Banded row colours `b.c, b.s` mirror crestfall — **zero new role colour**, `bulletcontrast`
  untouched (plan §POST row C.5).
- The pump order is safe: plume `t = k·BEAT` always precedes its row `t = k·BEAT + BEAT`, in
  both the live per-frame pump and `debugEmitAttack`'s sorted flush (stable sort; distinct t
  per pair). Row k's closure owns its own `gapX` — rows never share state.
- `pending.length = 0` on encounter start / thread-cut / felled-lie already drops queued
  geyser rows like every streamed attack — no new cleanup.
- Total pattern length @q1: last row at `5·0.32 = 1.6 s` (crestfall's 1.28 s + the one-beat
  lead) — inside P4's cadence + the 0.7 s sustained wind-up; no clock changes.

---

## 2. Whitelist + budget + laneSafe — "the gates, paid exactly once" (§5b)

BOSS-DESIGN.md §5b band-structure text, verbatim: *"The ≤1-new-id-per-band budget bounds test
cost: each new pattern pays the whitelist + emission-budget + safe-lane gates exactly once."*
The Calamities slot is unspent (plan APPENDIX: "`geyser` (the band's one slot, previously
unspent) | C.5 BRINEHOLM").

### 2.1 The two whitelist additions (`tests/boss.mjs`)

```diff
  for (const a of ph.attacks) assert(['aimed', 'fan', 'spiral', 'tunnel', 'spiralStream',
-   'curtain', 'movingGap', 'iris', 'stream', 'secondWave', 'crossfire', 'crestfall'].includes(a), `${key} attack '${a}' is known`);
+   'curtain', 'movingGap', 'iris', 'stream', 'secondWave', 'crossfire', 'crestfall', 'geyser'].includes(a), `${key} attack '${a}' is known`);
```

```diff
  const ALL_ATTACKS = ['aimed', 'fan', 'spiral', 'tunnel', 'spiralStream',
-   'curtain', 'movingGap', 'iris', 'stream', 'secondWave', 'crossfire'];
+   'curtain', 'movingGap', 'iris', 'stream', 'secondWave', 'crossfire', 'geyser'];
```

No other whitelist exists (verified: `bossRhythm.js` never validates phrase ids; `defs.mjs` has
no attack list; `AMBER_CARRIERS` is a carrier set, not a validity gate).

### 2.2 Budget math (why the concurrent-load asserts pass)

The budget loop's window is the fixed
`TRAVEL = CONFIG.BOSS.settleGap / (CONFIG.BOSS.bulletSpeed * 0.8) ≈ 1.34 s`; the plume volleys
contribute **zero** bullets (they only call `burst`).

- **@q0.7** (`rows = 4`, `stepX = 3.0`, `hw = min(12, arenaHW−1) = 12`): 9 columns per row,
  minus the `±3.4` slot (~2–3 columns) → **~6–7 bullets/row**. Rows land at t = 0.32 … 1.28
  (span 0.96 < 1.34 → all concurrent): worst ≈ **26–28 ≤ 55** ✓ (identical to crestfall's math).
- **@q1** (`rows = 5`, `stepX = 2.3`): 11 columns − ~3 → **~8/row** × 5 rows (span 1.28 < 1.34)
  ≈ **40 ≤ 160** ✓.
- `visibleCap` floor is 60 on the lowest tier (section 3e's comment: "no ~1.2s closing window
  ever holds more than ~55 bullets") — geyser never nears it, so `spawnBossBullet`'s silent
  drop can't punch random holes in a row.

### 2.3 laneSafe clears structurally

`laneSafe` scans `g ∈ [−11, 11]` for a column where every bullet has `|b.x − g| ≥ 2.2`. Every
geyser row keeps `|x − gap| < 3.4 → skip`, and `gap` is clamped to `[−hw+3.4, hw−3.4] ⊂ [−8.6,
8.6] ⊂ [−11, 11]` — so `g = gap` always clears with 1.2 m to spare, whichever way the RNG slid
it. Same guarantee crestfall's geometry gives (movingGap's per-row form is the assert template).

---

## 3. BRINEHOLM opt-in (`js/bossDefs.js` — def-data only)

Plan C.5 "Changes from shipped", adopted verbatim. This also kills the 6≡8 dread multiset
collision (`curtain`/`spiralStream` leave the def; no other boss lists `geyser`).

### 3.1 Phase attack lists

```diff
-      { atFrac: 0.45, cadence: [1.4, 1.9], attacks: ['stream', 'iris', 'fan'] },               // P3: the bound strains ...
-      { atFrac: 0.20, cadence: [1.3, 1.7], attacks: ['curtain', 'iris', 'spiralStream', 'stream'] },  // P4: Sounding (dread — the floor erupts)
+      { atFrac: 0.45, cadence: [1.4, 1.9], attacks: ['stream', 'geyser', 'fan'] },             // P3: first spouts (teach-before-test)
+      { atFrac: 0.20, cadence: [1.3, 1.7], attacks: ['geyser', 'iris', 'stream'] },            // P4: Sounding (dread — the floor FINALLY erupts)
```

P1/P2 untouched. Cards untouched (4 cards ✓ band floor; `brineholm_sounding` stays the dread).

### 3.2 Rhythm phrases — PURE ID SWAPS, timing byte-identical

The rhythmprint KS gate fingerprints **rest/gap value distributions** (bossRhythm.js: "the
rhythmprint distribution is over REST values only"), so swap ids and keep every
`beats/count/gap/rest` number unchanged — the fingerprint cannot move (plan §POST row C.5:
"rhythmprint NO (cadence untouched)"):

```diff
   P3 phrase:
-            { kind: 'burst',   attack: 'iris',   count: 2, gap: 0.5 },
+            { kind: 'burst',   attack: 'geyser', count: 2, gap: 0.5 },   // the P3 teach: plume-read at swell pace
   P4 phrase:
-            { kind: 'burst',   attack: 'curtain',      count: 2, gap: 0.45 },
+            { kind: 'burst',   attack: 'geyser',       count: 2, gap: 0.45 },
             { kind: 'burst',   attack: 'iris',         count: 2, gap: 0.45 },
             { kind: 'sustain', attack: 'stream',       beats: 2, gap: 1.4 },
-            { kind: 'burst',   attack: 'spiralStream', count: 2, gap: 0.4 },
+            { kind: 'burst',   attack: 'geyser',       count: 2, gap: 0.4 },
```

Note: the plan's "debuts P3 in a slow 3-row form" is NOT a shipped dial — row count is
quality-gated in code, exactly like crestfall (plan E.0.4 note 5 precedent: "there is no
per-def density dial"). The P3 "teach" is achieved by phrase placement at the 44 bpm tidal
drone (one geyser burst inside the roster's slowest pulse), not by a row-count variant.
Also update the stale P4 def comment ("the geyser walls (tunnel/curtain/iris)") to name geyser.

### 3.3 Amberdiet — geyser is NOT an amber carrier, and the phases keep theirs

`bossRhythm.js`: `export const AMBER_CARRIERS = new Set(['aimed', 'fan', 'crossfire',
'stream'])` — **do not add geyser** (a full-frame wall must never be parry fuel; same ruling as
curtain/movingGap/crestfall). The gates stay green because:
- `hasAmberCarrier(['stream','geyser','fan'])` (P3) and `hasAmberCarrier(['geyser','iris','stream'])`
  (P4) are true via `stream` (+ `fan` in P3).
- The amber floor's `amberSwap` can still force `stream` when the 12 s window nears lapse —
  unchanged, since the phrase timing is unchanged and `stream` remains in both phases.
- The P4 phrase keeps its `stream` sustain (the def's own comment: "the `stream` sustain
  doubles as the AMBER carrier under the geysers" — now literally true).

### 3.4 Sounding interplay — lane-wide in ENG-C; the body-tracking lee is the ENG-B follow-up

The `sounding` setpiece is `{ id: 'sounding', atPhase: 3, dur: 7.5, moving: true, dread: true }`;
`moving: true` keeps the attack clock firing while submerged (boss.js: "A `moving` setpiece
keeps the attack/rider clocks"), and its HOLD sweeps the pose at
`x: Math.sin(u * Math.PI * 2) * 6, y ≈ −7` (SETPIECE_PATHS.sounding). **ENG-C ships geyser
LANE-WIDE with the player-seeded sliding gap** — the eruption does not track the submerged body
yet. The plan's dread row ("geyser rows track the sweeping body below… the lee is the drawn
no-spawn pocket") is a **later pure-def-data opt via ENG-B**, already plumbed by this branch's
plume-time `resolveGapAnchor('geyser')` call: the def would add

```js
gapAnchor: { geyser: { part: '<submerged-head organ>', card: 'brineholm_sounding' } }
```

→ the gap LOCKS to the head's live world-x (the lee above the body = the safe pocket; the
plume line draws everywhere else). Do NOT ship that opt in ENG-C: it needs the model's named
organ verified against `partWorldPos` while dread-submerged, plus preview judgment of the
lee read. Card-gating keeps it inert in P3/P4-outside-the-dive (the `horizonPocketX` precedent,
generalized — `resolveGapAnchor` returns null when `spec.card !== activeCard?.id`).

Emitter=organ (§5f law 7) is satisfied the same way crestfall satisfies it ("the crest is the
emitter"): the arena floor/water line is the drawn emitter, and the plumes ARE its telegraph
drawn in the world.

---

## 4. Gate plan — headless asserts (`tests/boss.mjs`, section 3e, after the movingGap block)

```js
// §ENG-C geyser: the roster's ONE bottom-up pattern — born below frame, erupts upward,
// plume-led (plume beats emit zero bullets), sliding threadable gap, crestfall's budget.
{
  bullets.resetBossBullets();
  const vols = boss.debugEmitAttack('geyser', makePlayer(), 1);
  const rows = vols.filter((v) => v.bullets.length);
  assertEq(rows.length, 5, 'geyser fires 5 rows @q1 (crestfall dials; plume beats bullet-free)');
  assert(rows[0].t >= 0.32 - 1e-9, 'first eruption lands one full beat after its plume (drawn-in-world lead)');
  for (const r of rows) {
    assert(r.bullets.every((b) => b.y <= CONFIG.laneMinY - 3 + 1e-6),
      `geyser row @t${r.t.toFixed(2)} births BELOW the frame (y ≤ laneMinY − 3)`);
    assert(r.bullets.every((b) => b.vy > 0), `geyser row @t${r.t.toFixed(2)} erupts upward (vy > 0)`);
    assert(r.bullets.every((b) => b.y > -16 && b.y + b.vy * 1.0 > CONFIG.laneMinY),
      `geyser row @t${r.t.toFixed(2)} survives the cull floor and erupts INTO the lane within 1s`);
    assert(laneSafe(r.bullets), `geyser row @t${r.t.toFixed(2)} leaves a sliding threadable lane`);
  }
  bullets.resetBossBullets();
}
```

Plus, all free rides from existing gates once the two whitelist lines land:
- **Budget**: the `ALL_ATTACKS` loop asserts geyser ≤55 @q0.7 / ≤160 @q1 (math in §2.2) and
  `total > 0` (the t=0 plume volley is empty; the summed total isn't).
- **amberdiet**: `hasAmberCarrier` + the ≤12 s simulated amber gap re-run over the new P3/P4
  phrases — green by §3.3 (timing unchanged, `stream` kept).
- **rhythmprint**: KS distributions unchanged (pure id swaps, §3.2).
- **lifecycle**: section 4 drives BRINEHOLM to a kill — the phrase machine now fires geyser
  live through the real def/model path (also covers the sounding `moving` setpiece overlap).
- **bulletcontrast**: unchanged — geyser uses `activeBand` colours only.
- The plume itself is asserted **structurally** (same closure seals `gapX` for both beats; the
  one-beat lead is the `rows[0].t` assert). Its look is a preview-judgment item (§6) — particle
  bursts aren't visible to `debugActiveBullets`, by design.

POST-BUILD (per plan §POST row C.5): confirm the 6≡8 dread-multiset scan now passes.

---

## 5. 60 fps / overdraw (§5g / BOSS-DESIGN §2)

- **Zero new materials, zero additive shells.** The telegraph is `burst()` — the existing
  pooled sprite path. `burst` self-scales (`Math.round(count * quality) || 1`), `spawn`
  silently drops when the pool is dry, and pool sprites are the same non-enclosing quads every
  boss death/parry already uses. The overdraw law ("never wrap a body in an enclosing
  additive/fresnel shell… cap ~2 large additive volumes") is untouched.
- **Plume cost**: ≤8 doomed columns × `count: 5` = ≤40 pooled sprites per row-beat @q1 —
  smaller than the death-dissolve's repeating `burst(..., { count: 5 ... })` stream and the
  entrance shockwave (`count: 34`). No per-frame work outside the existing pending pump.
- **Bullet cost**: identical count and instanced-mesh path as crestfall, which ships at 60 fps
  on the heavier `skyReplace` EMBERTIDE (slot 13). BRINEHOLM's tier-3 scene is lighter.
- **No new draw calls, no new geometry, no new update-loop branches** (bullets ride the
  existing `s.y += s.vy * dt`).

---

## 6. Drift & risks

1. **[resolved] Cull floor**: CONFIRMED live (§0.1) — births at −0.5 vs floor −16; the widening
   comment names BRINEHOLM. No bossBullets change.
2. **[top risk] Telegraph honesty across the beat.** The gap MUST be sealed at plume time and
   reused by the eruption (the `gapX` closure) — recomputing at row time (crestfall recomputes;
   it can, having no plume) would let the gap drift between plume and eruption once ENG-B's
   live anchor lands, i.e. the telegraph would lie. The spec's structure makes the lie
   impossible; builders must not "simplify" the two closures into one recompute.
3. **[top risk] The Sounding fantasy is only HALF paid in ENG-C.** ENG-C ships lane-wide,
   player-seeded rows; the plan's dread promise ("rows track the sweeping body… ride the lee")
   needs the ENG-B `gapAnchor` opt (§3.4) with a verified submerged organ. Without flagging
   this, a reviewer may bounce ENG-C for not matching the plan's dread row — it matches row C
   of §E.1 exactly ("ENG-C ships the player-seeded slide"), and the opt is pure def-data later.
4. **Determinism**: origins are fully deterministic (fixed column xs, fixed `footY`, fixed
   `vy`); RNG touches ONLY the slide direction `dir` — exactly crestfall's and movingGap's
   shipped behaviour, and the laneSafe assert is direction-agnostic. The fireLanceAt law ("no
   RNG in origins") holds.
5. **Headless nulls**: the budget loop runs with `def`/`model` null (§0.4) — the branch's only
   def read is `def?.accent ?? 0x3ad0b0`. Never add an unguarded `def.` / `model.` read here.
6. **Fairness read**: worst case for the player is the gap RE-SLIDING between rows while they
   thread; the 3.4 slot vs 2.2 threadable floor plus the 0.32 s plume lead per row matches
   movingGap's proven read. Preview judgment items: plume visibility against the brine floor
   (accent 0x3ad0b0 on dark hull water) and whether `vy = 5.5` reads as "eruption" (it's
   crestfall's fall speed mirrored; the human judges feel on the PR preview).
7. **Two `quality` variables exist** (boss.js pattern dials vs particles.js pool scaling) —
   the plume count scales by the particles one automatically; don't multiply twice.
8. **Whitelist drift** (§0.3): crestfall never joined `ALL_ATTACKS`. Geyser must not repeat
   that miss — both lists in §2.1 are mandatory; the crestfall backfill is optional hygiene.
