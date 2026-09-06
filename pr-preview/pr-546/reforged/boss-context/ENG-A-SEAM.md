# ENG-A — Per-organ / multi-origin emit (PRE-BUILD spec)

**Seam row (plan §E.1):** def/card-gated origin override per attack id — resolve named parts
via `model.partWorldPos` per emitter; crossfire's `[-10,10]` → a resolved pair; per-emitter
time-to-impact per §5e ("`aimVel` assumes `pose.rel` — crossfire's inline t is the template").
**Hero: EITHERWING (C.4).** Unblocks C.4 (twins), C.6 (lance+chain), C.7 (bellMouth spiral),
C.8 (hands), Part D (Parallax Regard).

**The defect (verified live):** the `crossfire` branch of `executeAttack` fires from
hardcoded lane posts — `for (const ex of [-10, 10])` — with origin y `pose.y` and an inline
time-to-impact `const t = Math.max(pose.rel / slow, 0.05)`. EITHERWING's dread
("EITHER/OR — Both Halves at Once") is supposed to be simultaneous fire from two twins
crossing a lemniscate; today the bullets come from fixed posts nobody occupies.

---

## 1. The data shape — `def.emitOrigins` (per-attack-id part-name map)

```js
// bossDefs.js, on the eitherwing def (the ONLY def that gains it in ENG-A):
emitOrigins: { crossfire: ['eitherTwinA', 'eitherTwinB'] },
```

A plain map on the def: **attack id → ordered array of model part names**. Each name is
resolved fresh at fire time via `model.partWorldPos(name)`; each resolved part is one
emitter that fires the branch's full per-emitter volley (crossfire: `each` bullets), with
its own origin `{x, y, rel}` and its own time-to-impact.

**Why this shape (against the precedents):**

- `def.muzzle` precedent (`resolveEmitOrigin`): *"`def.muzzle` is data (bossDefs.js);
  `partWorldPos` is on every model handle (bossModel.js)"* — ENG-A is the same seam
  pluralized and scoped per attack id. A single global list would be wrong: C.4 wants
  crossfire from the twins but `aimed` from the (single, dynamic) holder muzzle; C.6 wants
  ONLY crossfire asymmetric (`['lanceTip', 'trophyCharm5']`) while `aimed` stays on
  `muzzle: 'lanceTip'`. Per-id keys give that for free.
- `destructiblePanes` precedent (`firePaneRadial`): the def-gated per-attack emit override
  is checked at the top of the branch (`if (def?.destructiblePanes && model?.livePanes)`),
  and un-opted defs never enter it. `emitOrigins` gates identically:
  `def?.emitOrigins?.[id]` — absent field, absent key, or null model → shipped path.
- `RIB_EMITTERS` / `emitRibBullets` precedent: multi-part emit with per-part rel and a
  behind-plane guard (`if (rrel <= 0.5) continue;`) already exists as a hardcoded one-off;
  ENG-A is that pattern made data-driven.

**Not card-gated in ENG-A.** The plan says "def/card-gated"; C.4's Baton Cross reroutes
crossfire in the *regular* phases too (P2 `['crossfire','secondWave','stream']`, P3
`['crossfire','movingGap','iris']`), so the def level is what the hero needs. Because
resolution happens at fire time through one function (`resolveEmitOrigins`, below), a later
card layer can shadow the map there (e.g. `activeCard?.emitOrigins?.[id] ??
def?.emitOrigins?.[id]`) without touching any branch — deferred to the first card consumer
(Part D). Do NOT build it now.

**Naming:** plural `emitOrigins` (the def field) vs the existing module singleton
`emitOrigin` (the `resolveEmitOrigin` output). Distinct symbols; do not rename the singleton.

---

## 2. The code change (pseudo-diff by symbol, all in `reforged/js/boss.js`)

### 2a. NEW `resolveEmitOrigins(id, player)` — beside `resolveEmitOrigin`

```js
// ENG-A per-organ emit: resolve an attack id's def-declared emitter parts to live
// origins in the bullet frame. Returns null when the def doesn't opt this id in
// (→ caller takes the shipped path, byte-identical) or when NO declared part is
// resolvable/ahead (→ caller SKIPS the volley — never fall back to posts nobody
// occupies; that is the defect this seam removes). world → bullet frame exactly
// as resolveEmitOrigin: (wx,wy,wz) → { x, y, rel: -wz - player.dist }.
const _emoV = new THREE.Vector3();
function resolveEmitOrigins(id, player) {
  const names = def?.emitOrigins?.[id];
  if (!names || !model?.partWorldPos) return null;      // un-opted → shipped path
  const out = [];
  for (const name of names) {
    const w = model.partWorldPos(name, _emoV);
    if (!w) continue;
    const rel = -w.z - player.dist;
    if (rel <= 0.5) continue;   // behind/at the plane → would fly away (emitRibBullets guard)
    out.push({ x: w.x, y: w.y, rel });
  }
  return out;   // possibly [] — opted-in but nothing ahead → SKIP, don't post-fire
}
```

Semantics contract (load-bearing for coexist + the dive):
- `null` = "not opted in" → shipped code runs.
- `[]` = "opted in, but every declared part is unresolvable or behind the player plane"
  → the branch emits **nothing** for this volley. During `figureEight` the near lobe
  carries the twins to rel −6 (path: `rel: B.settleGap + (dive - B.settleGap) * env`,
  `dive = 26 - near * 32`); a crossfire landing exactly there must go silent, not
  resurrect the ±10 posts behind the player's back.
- Non-empty = one volley per element, per-emitter t.

### 2b. NEW `aimVelFrom(o, ...)` + `aimVel` becomes a wrapper (arithmetic-identical)

```js
// Solve the lateral velocity that puts a bullet on a target point as it closes,
// FROM an arbitrary origin o = {x, y, rel} (per-emitter time-to-impact, §5e).
function aimVelFrom(o, targetX, targetY, closing) {
  const t = Math.max(o.rel / closing, 0.05);
  return { vx: (targetX - o.x) / t, vy: (targetY - o.y) / t };
}
function aimVel(targetX, targetY, closing) { return aimVelFrom(emitOrigin, targetX, targetY, closing); }
```

Today's `aimVel` body is exactly `const t = Math.max(emitOrigin.rel / closing, 0.05);
return { vx: (targetX - emitOrigin.x) / t, vy: (targetY - emitOrigin.y) / t };` — the
wrapper is the same operations on the same object; un-opted output is bit-identical.

### 2c. `crossfire` branch (the hero consumer)

```js
} else if (id === 'crossfire') {
    const each = quality < 0.75 ? 4 : 5;
    const slow = closing * 0.95;
+   // ENG-A: def-gated per-organ origins (eitherwing: the two twins). Un-opted
+   // defs take the shipped ±10 posts below, byte-identical.
+   const origins = resolveEmitOrigins('crossfire', player);
+   if (origins) {
+     for (const o of origins) {
+       for (let i = 0; i < each; i++) {
+         const off = (i / (each - 1) - 0.5) * 5;
+         const t = Math.max(o.rel / slow, 0.05);          // PER-EMITTER time-to-impact
+         emitBoss(o.x, o.y, (px + off - o.x) / t, (py - o.y) / t, -slow, true, null, 1, null, o.rel);
+       }
+     }
+   } else {
      for (const ex of [-10, 10]) {
        for (let i = 0; i < each; i++) {
          const off = (i / (each - 1) - 0.5) * 5;
          const t = Math.max(pose.rel / slow, 0.05);
          emitBoss(ex, pose.y, (px + off - ex) / t, (py - pose.y) / t, -slow, true);
        }
      }
+   }
  }
```

Notes:
- Same `px, py` (the lead-adjusted target already computed at the top of `executeAttack`),
  same `each`, same spread `off`, same `-slow` vrel, same `reflectable=true` (amber — the
  `AMBER_CARRIERS` contract holds on both paths). Bullet count with 2 origins ==
  shipped count with 2 posts.
- The opted path passes `o.rel` as `emitBoss`'s `originRel` param (the shipped signature:
  `emitBoss(x, y, vx, vy, vrel, reflectable, color, sizeMult, coreColor, originRel, part)`)
  so the bullet is born on the twin's actual depth plane, exactly as `emitRibBullets`
  passes `rrel`. The shipped path keeps NOT passing it (defaults to `pose.rel`).
- Spawn-in is untouched: `spawnBossBullet` does `s.age = 0; // reset the spawn-in ramp`
  per bullet regardless of origin. Amber/tag/color flow through `emitBoss` unchanged.
- Per-emitter t means a nearer twin's spread arrives sooner — that is the §5e law
  (each emitter converges honestly from where it is), and it's what makes the converge
  angle "change every pass" (C.4). Do NOT sync arrival times across emitters (the
  constant-T convergence of `emitRibBullets` is a different, deliberate design there).

### 2d. `aimed` + `stream` (the C.4-dread family — wired, dormant until a def opts in)

`aimed` (instant; the shipped body currently loops `aimVel(px + i * 1.6, py, closing)` from
`emitOrigin`):

```js
+   const origins = resolveEmitOrigins('aimed', player);
+   if (origins) {
+     for (const o of origins) for (let i = -1; i <= 1; i++) {
+       const v = aimVelFrom(o, px + i * 1.6, py, closing);
+       emitBoss(o.x, o.y, v.vx, v.vy, -closing, true, null, 1, null, o.rel);
+     }
+   } else { ...shipped 3-bullet loop, verbatim... }
```

Keep the `def?.threadCut` beam-visual block ABOVE this, untouched (it keys off the def,
not the origin; WEFTWITCH is un-opted in ENG-A).

`stream` (deferred; sub-volleys are `pending` closures): resolve **inside the closure**, at
fire time — the twins move between ticks. This matches the shipped doctrine: the update
loop re-resolves before flushing (`resolveEmitOrigin(player);   // keep the body-origin
current for deferred sub-volleys`), and `debugEmitAttack`'s synchronous flush calls the
same closures, so headless behavior matches live.

```js
      pending.push({ t: k * 0.14, fire: () => {
+       const origins = resolveEmitOrigins('stream', player);   // re-resolve per tick (twins move)
+       if (origins) {
+         for (const o of origins) {
+           const v = aimVelFrom(o, player.position.x, player.position.y, slow);
+           emitBoss(o.x, o.y, v.vx, v.vy, -slow, amber, null, 1, null, o.rel);
+         }
+       } else {
          const v = aimVel(player.position.x, player.position.y, slow);
          emitBoss(emitOrigin.x, emitOrigin.y, v.vx, v.vy, -slow, amber, null, 1, null, emitOrigin.rel);
+       }
      } });
```

The amber cadence stays per-TICK (`(k % 4) === 3`): an opted 2-origin stream fires 2 amber
bullets on the amber tick — a richer parry beat, counts doubled only for opted defs.

**Branches NOT wired in ENG-A:** `fan`, `secondWave`, `spiral`, `iris`, everything else.
C.7's "spiral from bellMouth" is a *future* consumer: the shipped `spiral` emits from
`anchorX, B.fightHeight` (E.0.6: "engine work, not a free reroute") and its consumption
lands with C.7 on this same resolver. Do not touch those branches now.

### 2e. What does NOT change

`resolveEmitOrigin` (singular), `emitOrigin`, `emitBoss`, `spawnBossBullet`, the
`firePaneRadial`/`destructiblePanes` reroute, `fireRing`, all other branches, all cadence /
phrase / `bossRhythm.js` code. No new attack id (the id budget is untouched — this is
emitter plumbing on existing ids, per C.4's "cost honesty").

**Docs the builder also touches (convention, not code):** append one line to the
BOSS-DESIGN.md §5e ledger next to the pane-radial/emitter entries — e.g. *"Per-attack
multi-origin emit: `def.emitOrigins` map, resolved via `partWorldPos` per emitter with
per-emitter time-to-impact; proven on EITHERWING crossfire (SMALL)"* — and add a
`leapfrog/lessons/<date>-eng-a-multi-origin-emit.md` lesson per THE RULE.

---

## 3. The COEXIST guarantee (why un-opted is provably byte-identical)

1. **One gate, data-absent by default.** The only entry to new code is
   `def?.emitOrigins?.[id]` inside `resolveEmitOrigins`. `grep emitOrigins
   reforged/js/bossDefs.js` today → zero hits; ENG-A adds the field to exactly one def
   (eitherwing) under exactly one key (`crossfire`). Every other def, and every other
   eitherwing attack id, returns `null` → the `else` branch — which is the shipped loop
   **moved verbatim, not rewritten**. The diff shape makes this reviewable: the shipped
   `[-10,10]` loop, the shipped `aimed` loop, and the shipped `stream` closure body must
   appear character-identical inside their `else`.
2. **The `aimVel` wrapper is arithmetic-identical** (§2b): same reads of the same
   `emitOrigin` object, same `Math.max`, same divisions — no float-order change.
3. **Headless null-def path unchanged.** `debugEmitAttack` runs with `def`/`model` null
   (the shipped comment: "def/model null on the headless debugEmitAttack flush");
   `resolveEmitOrigins` returns `null` on its first check, so every existing gate exercises
   the shipped loops.
4. **The convention-level proof** is the same one the roster already uses (there is no
   global byte-hash; the tests enforce coexist via explicit inertness asserts, e.g. "a
   non-ghostHalf boss (eitherwing) never fires the frame-tagged ghost half"): ENG-A adds
   the mirror-image inertness assert (§4) that an un-opted boss's crossfire origins are
   exactly `{−10, +10}` at `pose.y`/`pose.rel`.

---

## 4. The gate plan (`reforged/tests/boss.mjs`)

**Re-run, expect green untouched:**
- **Emission budget** (`ALL_ATTACKS`, worst window ≤55 @q0.7 / ≤160 @q1 via
  `debugEmitAttack`): runs def-null → shipped paths → identical counts.
- **laneSafe**: only asserted on `curtain`/`movingGap` fills — branches untouched.
- **amberdiet**: `AMBER_CARRIERS = new Set(['aimed', 'fan', 'crossfire', 'stream'])` in
  `bossRhythm.js` is untouched; both crossfire paths emit `reflectable=true`; the ≤12s
  amber-gap simulation is over rhythm rests, not origins.
- **rhythmprint**: KS distance over REST distributions only ("the rhythmprint distribution
  is over REST values only") — origin-blind; ENG-A never touches cadence/phrase.
- **lifecycle**: every boss in `BOSS_ORDER` to a real kill — eitherwing's kill now emits
  crossfire from the twins; bullets still spawn/close/cull through the same pool.
- **eitherwing per-sheet asserts** (twin ΔL, handoff travel, ribbon telegraph, and the
  existing `eitherwing exposes both named twins (eitherTwinA/B)` assert) must survive —
  no model change is made, so they will.
- `node tools/build-ledger.mjs` sanity + `tricount`/`tiershots` per THE RULE (no geometry
  change expected — tricount byte-flat).

**NEW asserts (one new section in boss.mjs, after the eitherwing geometry section):**

Drive: the shipped idiom at the ghost-half inertness check —
`boss.forceBoss(p, BOSS_ORDER.indexOf('eitherwing'))`, tick `boss.updateBoss(1/60, p, t)`
until fighting (or `boss.debugForceFight(p)` to land the fight instantly), then
`bullets.resetBossBullets()` + `boss.debugEmitAttack('crossfire', p)` — `debugEmitAttack`
reads the module-level live `def`/`model`, and `debugActiveBullets()` returns
`{ x, y, vx, vy, rel, reflectable, part, ... }` per bullet.

1. **Opted origins == the twins (the seam works).** Read
   `boss.debugPartWorldPos('eitherTwinA')` / `('eitherTwinB')`, convert each to the bullet
   frame (`rel = -z - p.dist`), emit one crossfire, assert: every bullet's `(x, y, rel)`
   matches one twin within ε (0.01), BOTH twins are represented, total ==
   `2 * each` (== the shipped 2-post count at that quality), and every bullet is
   `reflectable` (amber carrier preserved).
2. **Origins TRACK the moving parts.** Tick the fight a few seconds (the lemniscate
   `orbitPhase` advances while moving; or `debugRunSetpiece('figureEight')` + ticks), reset
   the pool, emit again: assert the new volley's origin set differs from volley 1's AND
   still matches the twins' fresh `debugPartWorldPos` values — origins are resolved
   per-volley, not cached.
3. **Un-opted is inert (the coexist fence).** With def/model null (plain
   `debugEmitAttack('crossfire', makePlayer(), 1)` before any fight, as the budget gate
   does): assert every bullet's `x ∈ {−10, +10}` exactly and `rel === CONFIG.BOSS.settleGap`.
   Then the live-fight variant on a NON-opted boss (voidmaw, the existing `forceBoss`
   pattern): same ±10 assert — the field's absence, not headlessness, is what gates.
4. **Budget spot-check for the opted path:** the opted volley @q0.7 emits `2*4 = 8`,
   trivially ≤55 — assert count equality opted-vs-shipped rather than re-deriving the
   window math.
5. *(Optional, cheap)* **stream re-resolution:** temporarily set
   `BOSSES.eitherwing.emitOrigins.stream = ['eitherTwinA','eitherTwinB']` in the test
   (restore after — defs are plain imported objects), emit `stream` mid-fight while
   ticking, assert per-tick origins move with the twins and amber ticks carry 2 ambers.
   If def mutation feels too invasive, defer this assert to C.4 — the closure code is
   identical in shape to crossfire's.

**Implications summary:** un-opted bosses — none, by construction (§3). Eitherwing — same
bullet COUNT per crossfire volley, moved origins; amber diet unchanged (crossfire still the
P2/P3 carrier); rhythm untouched; the only behavioral delta a gate could see is origin
coordinates, which no shipped gate reads.

---

## 5. The EITHERWING hero application (C.4's first slice — what ENG-A ships)

**The opt-in (bossDefs.js, eitherwing def):**

```js
emitOrigins: { crossfire: ['eitherTwinA', 'eitherTwinB'] },
```

**Model readiness: WIRED-READY — zero model edits for ENG-A.** `bossEitherwing.js` names
both twin pivots at build time: `twin.name = seeker ? 'eitherTwinB' : 'eitherTwinA'`
(A = the holder half, "brighter; holds the eye at idle"; B = the seeker, "the eyeless,
scarred twin"). The shared accessor (`bossModel.js buildBoss`) resolves them by
`getObjectByName` with a cache and returns live world positions — and `tickBody` writes the
lemniscate into exactly these pivots every frame (`twinA.twin.position.set(...)` /
`twinB.twin.position.set(...)`, `sin(th)`/`sin(2th)` with twin B at `th + π`), so
`partWorldPos('eitherTwinA')` IS the moving twin. boss.mjs already asserts both names
resolve ("eitherwing exposes both named twins (eitherTwinA/B)").

**The holder's volley is NOT ENG-A code.** The C.4 table routes `aimed`/`stream` "from the
holder's live position (via `partWorldPos` — the L148 muzzle seam, per-twin)". The model
already ticks an unnamed holder-following node: `const muzzle = new THREE.Object3D();`
… `// Muzzle follows the eye-holder` … `const holderPos = aHolds > 0.5 ?
twinA.twin.position : twinB.twin.position; muzzle.position.set(...)`. Because the holder is
*dynamic* (`holdT`), a static two-name `emitOrigins` entry cannot express it — but the
existing single-origin `def.muzzle` seam can, once the node is named. C.4 (not ENG-A) does:
`muzzle.name = 'eitherMuzzle'` (one line in `bossEitherwing.js`; the exact WEFTWITCH
precedent — her def.muzzle resolves to a dedicated marker `muzzle.name = 'loomHeart'` on
`group`) + `muzzle: 'eitherMuzzle'` in the def. The dread's "simultaneous holder-volley
from BOTH twins" then uses ENG-A (`emitOrigins.aimed`/`.stream = ['eitherTwinA',
'eitherTwinB']`, card-scoped when the card layer exists). ENG-A must merely leave the
`aimed`/`stream` consumers in place for it (§2d) — which it does.

**POST-BUILD checkpoint should trace:**
- Origins track the lemniscate: two consecutive crossfire volleys in a live eitherwing
  fight have different origin pairs, each equal to the twins' `partWorldPos` at fire time
  (assert 1 + 2 above green).
- The ±10 posts are gone **for eitherwing**: no crossfire bullet born at x = ±10 /
  `pose.y` / `pose.rel` unless a twin genuinely stands there (assert on twin-equality, not
  on x ≠ ±10 — a twin can legitimately cross x ≈ ±10 mid-figure-eight... the lemniscate
  `ORBIT_R` bounds this; equality-to-twin is the robust form).
- The dread fires from the bodies: `debugFireAttack('crossfire', player)` under `?debug`
  during `figureEight` for the PR-preview eyeball (the human judges motion/feel); the
  near-lobe silent-volley behavior (both twins rel ≤ 0.5 → no bullets) observed and sane.
- The roster fence: assert 3 (un-opted ±10) green; full `tests/boss.mjs` green;
  rhythmprint/amberdiet untouched.

**Other consumers (readiness noted, NOT designed here):** KARNVOW — `lanceTip` named
(`lanceTip.name = 'lanceTip'`, already `def.muzzle` + `virtualLockOrgan`), chain parts
named `chainPivot` + `trophyCharm0..5` (`trophyCharm5` is the empty hook — the natural
"trailing chain's live pos" for C.6's asymmetric `['lanceTip', 'trophyCharm5']`); NOTE
KARNVOW ships its OWN `partWorldPos` that falls back to the muzzle instead of null on a
miss — a typo'd part name there silently emits from the lance tip, so C.6's asserts must
compare against the chain part, not just non-null. WEFTWITCH — `handPivotL`/`handPivotR`
named; ready for C.8's `emitOrigins: { crossfire: ['handPivotL','handPivotR'] }`.
KNELLGRAVE bellMouth — unverified (C.7 also needs the `spiral` branch consumer, §2d).

---

## 6. Drift & risks

1. **RISK — the figureEight near lobe puts BOTH twins behind the player plane** (the path
   dives rel 26 → −6; crossfire "keeps raining from wherever the pass carries them"). With
   the `[]`-means-skip contract a volley landing in the near lobe emits nothing. This is
   deliberate (posts-behind-your-back bullets are the defect; `emitRibBullets` set the
   skip precedent) but it is a live-feel change the human must judge: eitherwing P2/P3
   crossfire during the setpiece occasionally goes silent for a beat. Amber floor risk is
   low (the pass is ~7–8s, twins are ahead except the brief crossing; `stream`/`aimed`
   remain carriers in the same phases) — but POST-BUILD should watch it. Mitigation knob
   if needed later: lower the guard from 0.5 only, never restore posts.
2. **RISK — per-emitter t changes crossfire's arrival texture for the hero.** Shipped
   crossfire arrives as one simultaneous converge (both posts share `pose.rel`); twin
   origins at different depths arrive staggered. That's the §5e law and the C.4 intent
   ("the converge angle changes every pass"), but it's a feel change only the PR preview
   can validate. Do not "fix" it by syncing t.
3. **Drift check — plan assumptions verified TRUE:** `crossfire` is hardcoded
   `for (const ex of [-10, 10])` ✓; `resolveEmitOrigin` resolves ONE origin from
   `def.muzzle` ✓; `firePaneRadial` is the def-gated per-attack override precedent ✓;
   `partWorldPos` resolves arbitrary named parts on every handle ✓; eitherwing def has NO
   `muzzle` field today (its aimed/stream currently fire from the pose centre — so ENG-A
   moves crossfire only; "the posts are gone" is a crossfire claim until C.4 adds the named
   muzzle) ✓.
4. **Trap — WEFTWITCH's `muzzle: 'loomHeart'` looks like a name mismatch but is not**: the
   rig group is `'loomHeartRig'` and the knot `'weftLoomHeart'`, but a dedicated marker
   exists (`muzzle.name = 'loomHeart'; group.add(muzzle)`). Do not "fix" names; and reuse
   this marker pattern for eitherwing's future `eitherMuzzle`.
5. **Harness subtlety:** `debugEmitAttack` does `pending.length = 0` and expects the caller
   to reset the bullet pool — the new asserts must `bullets.resetBossBullets()` between
   volleys and never interleave with a mid-fight pending queue they care about; and because
   it flushes closures synchronously, the `stream` closure's *internal* re-resolve (§2d) is
   what keeps headless == live.
6. **Scope boundary:** ENG-A ships the resolver + `aimVelFrom` + the `crossfire`/`aimed`/
   `stream` consumers + the eitherwing `crossfire` opt-in + the new asserts. It does NOT
   ship: the C.4 dread composition (midpoint iris, orbitAnnulus = ENG-D, holder stagger =
   ENG-E), the eitherwing named-muzzle/def.muzzle add, graze/parry work, card-scoped
   overrides, or any other boss's opt-in (C.6/C.7/C.8 land on this seam in their own PRs).
