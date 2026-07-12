# PR-A BUILD SPEC — THE UNMASKED × THE HOLLOW BEHIND THE SKY (S1→S2 void swap, EMPTY-FIRST)

**Status:** CP1 PRE-ASSESSMENT — reconciled, mechanical build spec. NO code has changed.
**Verdict: GO-WITH-FIXES** (fixes are folded into this spec as build steps; one plan-level
ordering bug found and corrected here — §4. Nothing blocks starting today.)
**Verified against:** master @ `cb9a85a` (2026-07-11), re-read from live code this session.
Since the audits' pin (`fee8d07`) only PR #374 merged — `dragonSurfaceLayers/Tail/Torso/dragons.js`
(Azure rear-chase) — **zero arena seams moved; every line number below re-verified fresh.**
**Scope:** the plan's PR-A (`docs/unmasked-arena-transformation-plan.md` §8) with the audits'
must-fixes folded in, EMPTY-FIRST per the identity doc §1.4: **zero new meshes, zero
scene-graph writes.** The Blanks, the heaven (S2→S3), the god-ray SWELL, and the authored
death exhale are OUT (Blanks = own gated increment; heaven/swell = PR-B; exhale = PR-C).

---

## 0. Reconciliation — what the fresh code-read confirmed, simplified, and caught

| Claim (docs) | Fresh verdict |
|---|---|
| `computeEnv` single consumer | **CONFIRMED** — exactly one call in `js/`: `environment.js:497` (grep this session) |
| Stage-beat clock + same-frame lockstep | **CONFIRMED** — `beginStageBeat` `boss.js:3805` + `model.setPhase` `:3822` both inside `breakShield`; `stageBeatDur ≡ model.stageTransitionDur ≡ TRANS_DUR 2.0` (`boss.js:1088`, `bossUnmasked.js:793,1018`) |
| Both teardown templates | **CONFIRMED** — `endEncounter` `boss.js:1873` / `resetBoss` `:5416`; and F12's hole re-confirmed: `resetBoss` never clears `game.embertideSky` — we clear our flags in BOTH |
| Prop bands bypass env (F1) | **CONFIRMED** — recycled every frame at `environment.js:494`; static emissive mats `:76-91`; `updateBandVisibility` kill-switch `:440-443` |
| `bossArena.js` name collision | **CONFIRMED** — `game.bossArenaHW/HY` (`gameState.js:51`, `boss.js:1884-1887`). **Module name: `js/arenaSkin.js`** (unique grep) |
| Void palette vs the gate | **RE-DERIVED this session** with the gate's own `lum()` — matches the identity audit exactly (table in §9-T3) |
| **NEW — simplification** | `updateEnvironment` **already takes a threaded boss param**: `bossTarget` (`environment.js:492`, fed `bossGradeTarget()` at `main.js:1415`). The arena mix threads the identical way — an 8th param. No new plumbing pattern needed. |
| **NEW — restore semantics** | `updateEnvironment` runs in **every non-paused state** (`main.js:1354` block → `:1415`), including `gameover` and menu — so a stateless mix source self-heals the env + prop gate within one frame of any teardown. `updateBoss` (`main.js:1231`) runs only while `playing` — so the mix source MUST be a stateless getter, never a boss-ticked ramp (the embertideSky trap, `boss.js:1869-1873` comment). |
| **NEW — plan ordering BUG (must fix in PR-A)** | The plan defers the bullet-band re-resolve to PR-B ("both arenas' band overrides land here as one mechanism"). But the **default dark band `0x8f0a3c` (L .164) FAILS all four void backgrounds** (direct .099–.136 < .15; layered dead below bg .28 — re-derived this session). Shipping PR-A without the `dark: 0xa84167` override is a fairness break in the hero increment, and the T3 gate this spec mandates would catch it as a hard fail. **The void's band override ships IN PR-A** (§4). |

---

## 1. NEW MODULE — `reforged/js/arenaSkin.js` (~120 lines, all data + pure math)

Render-only. Imports **THREE only** (node-importable via `tools/three-resolver.mjs`, the
`bulletcontrast.mjs`→`biomes.js` precedent, so the contrast gate and pure-node tests consume
the same source of truth). **Zero scene-graph writes, zero meshes, zero RNG** — enforced by
the narrowed string-assert (§9-T2).

### 1.1 Exports

```js
export const VOID_HEX   = { /* the 27-field table below, raw hexes + scalars */ };
export const FLOOD_HEX  = { /* ditto */ };
export const VOID_BULLETS = { dark: 0xa84167 };          // Astral's certified lift (biomes.js:150)
export const ARENA_CONTRAST = [                           // consumed by tests/bulletcontrast.mjs (§9-T3)
  { name: 'THE HOLLOW (void arena)', fog: 0x0a0514, horizon: 0x1a0b2e, bullets: VOID_BULLETS },
];
export function applyArenaSkin(env, mix) { … }            // the ONE renderer entry point
export const ARENA_ENV_KEYS = [...COLOR_KEYS, ...SCALAR_KEYS];  // schema-completeness gate (§9-T2)
```

### 1.2 THE VOID — all 27 `env` fields (schema-complete per audit F3.4; keys = `biomes.js:173-187` exactly)

| field | value | note |
|---|---|---|
| `skyTop` | `0x050208` | near-black violet (L .012) — never #000 |
| `skyMid` | `0x0d0618` | bruise gradient (L .034) |
| `skyHorizon` | `0x1a0b2e` | THE BRUISE BAND at wing height (L .066) |
| `sunGlow` | `0x000000` | **the sun is GONE** (water sun-streak dies automatically — the tint call reuses `env.sunGlow`, `environment.js:515`) |
| `fogColor` | `0x0a0514` | the pocket (L .028) |
| `fogNear` / `fogFar` | `45` / `240` | world swallowed ~200 m |
| `fogFarColor` / `fogFarMix` | `0x120a24` / `1` | violet depth, not black cutoff |
| `lightSun` / `lightSunI` | `0x9a8fd8` / `0.55` | cold starlight key |
| `hemiSky` / `hemiGround` | `0x241a3a` / `0x05030a` | cold fill |
| `waterDeep` / `waterShallow` / `waveAmp` | `0x030208` / `0x140a26` / `0.15` | the fitting mirror (O5) |
| `ambColor` / `ambFall` / `ambSway` | `0xcfc2ee` / `−0.45` / `0.4` | mask-dust falls UP (Caldera negative-fall precedent) |
| `ambSize` / `ambOpacity` | `0.4` / `0.9` | TUNE (identity doc omitted; completeness requires them) |
| `faunaColor` / `faunaScale` / `faunaFlap` | `0xcfc2ee` / `0` / `0` | **birds collapse** — `ambient.js:199` scales by `faunaScale` (audit F3.1) |
| `starMix` | `1` | the pinholes |
| `whaleMix` / `flybyMix` | `0` / `0` | nothing lives here (`ambient.js:165,208`) |

### 1.3 THE FLOOD (S1→S2 crack mid-palette — authored start values, ALL marked TUNE for PR-C)

`skyTop 0xcfc2f2 · skyMid 0xe8dcff · skyHorizon 0xf2ecff · sunGlow 0xffffff ·
fogColor 0xe8dcff · fogNear 25 · fogFar 260 · fogFarColor 0xe8dcff · fogFarMix 1 ·
lightSun 0xe8dcff · lightSunI 2.0 · hemiSky 0xd8ccf0 · hemiGround 0x8a7ca8 ·
waterDeep 0x8a7cb8 · waterShallow 0xd8ccf0 · waveAmp 0.3 ·
ambColor 0xffffff · ambFall 0 · ambSway 0.5 · ambSize 0.4 · ambOpacity 0.6 ·
faunaColor 0xffffff · faunaScale 0 · faunaFlap 0 · starMix 0 · whaleMix 0 · flybyMix 0`

(`starMix 0` in the flood → the pinhole-stars *fade in during the drain*, which is the §3.1
"they are simply there" beat. Fauna zeroed from the flood's first frame so the whale never
crosses it.)

### 1.4 The apply function (per-frame, alloc-free, byte-identical at mix 0)

```js
const T0 = 0.45;                                   // flood peak on the beat clock (plan §4)
const sstep = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
export function applyArenaSkin(env, mix) {
  if (!(mix > 0)) return;                          // mix 0 ⇒ ZERO writes ⇒ byte-identical (T2 proof)
  if (mix < T0) blend(env, FLOOD, sstep(mix / T0));                 // live biome sky → the flood
  else { copy(env, FLOOD); blend(env, VOID, sstep((mix - T0) / (1 - T0))); }  // flood → void
}
```

- `blend(env, tgt, k)`: `env[key].lerp(tgt[key], k)` for the COLOR keys, scalar lerp for the
  rest. `copy` = `.copy()` / assignment. FLOOD/VOID are `THREE.Color` tables **baked once at
  module load** from the hex exports — no per-frame allocation.
- **Source-independence by construction:** past t=0.45 the live biome is out of the equation
  (`copy(FLOOD)` first), so at mix 1 the env is the VOID table byte-exactly, from any biome,
  including mid-fight biome-seam crossings.
- Continuity at T0 is exact (branch 1 at k=1 lands on FLOOD; branch 2 at k=0 starts there).
- **Curve decision (audit F10 nit 2):** the arena eases `sstep` while the model's `transT`
  advances linearly with easing inside its setters (`bossUnmasked.js:882`). Endpoints align by
  construction; the few-percent mid-curve drift is accepted and stated here. Clamp handled at
  the mix source (§2).

---

## 2. THE MIX SOURCE — `bossArenaMix()` in `boss.js`, threaded exactly like `bossGradeTarget()`

**Stateless getter** (a pure function of fight state) — this is what makes every snap path
(skip tap, resetBoss, game-over freeze) correct with no ramp to strand:

```js
// Near bossGradeTarget() (boss.js:1613). PR-A: stages 2 AND 3 hold the void (interim rule,
// plan §8 — a void→ordinary pop at the unveil would be worse); PR-B maps phaseIdx 2 → heaven.
export function bossArenaMix() {
  if (!active || !def?.arenaStates || phaseIdx < 1) return 0;
  // A beat that STARTED from the ordinary sky blends 0→1 on the shared clock: the mid-fight
  // S1→S2 crack (phaseIdx===1), or ANY intro beat (stageBeatSkippable — the dev stage-pin
  // path enters from the ordinary approach sky: audit F6's from-arena-0 rule).
  if (stageBeatT >= 0 && (phaseIdx === 1 || stageBeatSkippable))
    return sstep(Math.min(1, stageBeatT / stageBeatDur));   // clamp — stageBeatT overruns into the 0.7s reveal hold (audit F10 nit 1)
  return 1;
}
```

Traced behaviours (all verified against the live state machine):
- **Every other boss / non-fight flight:** `def.arenaStates` undefined → `0` → `applyArenaSkin`
  early-returns with zero writes → **byte-identical** (the coexistence proof).
- **UNMASKED S1:** `phaseIdx 0` (`startBossEncounter` `boss.js:1647`; `debugPhaseJump` applies
  only at `enterFight` `:2075`) → `0` through warn/approach/fight-S1.
- **Mid-fight crack:** `breakShield` runs `beginStageBeat(false)` (`:3805`) then `phaseIdx++`
  (`:3811`) in the same frame → next frames blend 0→1 over 2.0 s, world and model in lockstep.
- **S2→S3 advance:** `phaseIdx 2`, beat running, not skippable → returns `1` (void holds — PR-A
  interim; no pop).
- **Dev pin S2/S3 (`bossSetStage` → intro beat `:2096-2101`):** skippable beat → blends from
  arena 0 (F6). **Skip tap** (`:2310-2316`) zeroes the beat → getter snaps to 1 the same frame
  `setDebugStage` cuts the model (`bossUnmasked.js:796-800`). Snap-correct by statelessness.
- **Player death mid-void:** `updateBoss` stops (playing-only, `main.js:1231`) but the getter
  still reads `active/phaseIdx` → void persists behind the death screen (the EMBERTIDE
  behaviour, correct); `resetBoss` on the next run → `active=false` → 0 → env + props restore
  on the very next `updateEnvironment` frame (which runs in every non-paused state).
- **Natural kill:** `endEncounter` → `active=false` → snap to 0 under the FELLED card.
  **Accepted PR-A interim** (audit F7 assigns the minimal ease to PR-B): the snap is masked by
  the kill's slow-mo + FELLED card + the surge grant (`game.feverActive=true`, `boss.js:1897`)
  repainting the sky magenta that same frame. State this in the PR body.

**Threading (main.js:1415, one line + one import):**

```js
updateEnvironment(dt, camera, t, player.dist, game.feverActive, player.speed,
                  bossGradeTarget(), bossArenaMix());
```

**environment.js (signature + one call):**

```js
export function updateEnvironment(dt, camera, time, playerDist, feverActive = false,
                                  playerSpeed = 0, bossTarget = 0, arenaMix = 0) {
  …
  const env = computeEnv(playerDist);   // :497 — unchanged
  applyArenaSkin(env, arenaMix);        // THE injection — before the fan-out (:499-537), so
                                        // sky uniforms, scene.fog, sun/hemi, setWaterTint AND
                                        // updateAmbient(…env…) all read the overridden scratch
```

No import cycle: `environment.js → arenaSkin.js → THREE` only. (`environment.js` must never
import `boss.js` — `boss.js` already imports `setSkyFade` from `environment.js`.)

---

## 3. THE F1 PROP-BAND GATE (value-space `visible`, self-healing restore + belt-and-braces)

The bands bypass `env` entirely (recycled every frame at `environment.js:494`; static
emissive materials `:76-91`) — without this gate the void contains fully-lit Astral
monoliths and the R2 read fails silently (audit F1).

**Mechanism — all inside `environment.js` (~10 lines):**

```js
let arenaPropsGate = false;   // F1: bands forced off while the void owns the sky

// in updateEnvironment, BEFORE the recycleBand loop (:494), so this frame's recycles
// already respect it:
const hideProps = arenaMix >= 0.45;                  // the flood peak masks the pop (fog.near
if (hideProps !== arenaPropsGate) {                  //  is already crashing to ~25 there)
  arenaPropsGate = hideProps;
  for (const band of bands) updateBandVisibility(band);   // re-evaluate ALL bands on the edge
}

// updateBandVisibility (:440-443) gains ONE conjunct — the §5.4 kill-switch idiom extended:
band.mesh.visible = !arenaPropsGate && band.data.some(…unchanged…);
```

- **Recycle-safety:** `recycleBand`'s own `updateBandVisibility` call (`:461`) now respects the
  gate, so a mid-void recycle can never flip a band back on (the failure a naive
  `mesh.visible=false` one-shot would have).
- **Recycling keeps running** (the loop at `:494` is untouched) → the `rnd` stream advances
  identically, positions stay warm → restore is free and **determinism holds** (visibility
  only; zero `rnd` consumption added — the determinism/rnd-stream law).
- **Restore path 1 (primary, self-healing):** any teardown → `bossArenaMix()` returns 0 →
  the next `updateEnvironment` frame (runs in ALL non-paused states incl. gameover/menu,
  `main.js:1354`) flips the gate and re-evaluates every band. Covers `endEncounter`,
  `resetBoss`, and the death screen.
- **Restore path 2 (belt-and-braces, the rung-14 double-teardown law):** `resetEnvironment`
  (`environment.js:481`, the new-run reseed) additionally sets `arenaPropsGate = false` before
  reseeding — so even a restart from a paused void frame reseeds visible.
- **Debug read:** `export function debugArenaProps() { return arenaPropsGate; }` (consumed by
  `__dd.bossArenaState()`, §7).

Which bands: **all of them** (the gate is global — in-fight the window only ever contains the
source biome's archetypes anyway, and gating all is what makes S2 source-independent).

---

## 4. THE BAND OVERRIDE — ships in PR-A (the ordering fix from §0)

Default dark `0x8f0a3c` fails every void background; `dark: 0xa84167` (Astral's certified
lift, `biomes.js:150`) passes all four with .29–.34 direct margins (re-derived, §9-T3).
`activeBand` is resolved once at encounter start (`boss.js:1653`) and bullets take their
colour at spawn — so the swap is a one-time re-resolve when the void arrives, in the held-fire
window (fire held for `dur + 0.7s`, `beginStageBeat` `:1091`; `pending` wiped `:3800`).

**Mechanism — a mix-crossing latch in `updateBoss` (robust to the reveal path AND the dev
skip path, which never reaches the reveal block `:2318-2328`):**

```js
// per-frame in updateBoss (near the embertideSky drive, :2182-2185):
if (active && def?.arenaStates && !arenaBandApplied && bossArenaMix() >= 1) {
  arenaBandApplied = true;
  // resolveBand order is [light, dark, mid] (boss.js:1113-1117) — slot 1 is dark:
  activeBand = [activeBand[0], { c: VOID_BULLETS.dark, s: activeBand[1].s }, activeBand[2]];
}
```

- Timing = the reveal frame (mix hits 1 at `t = dur`) — new-spawn-only colouring means the
  first bullets of stage 2 are born in the new band; pre-burst stragglers die out in the held
  window (accepted transient, plan §4). The rider's cyan chip shots keep firing through the
  beat (audit F10) — fixed role colour, passes the void (L .749/.712 direct), non-issue.
- **Resets (grep-both law, the rung-14 latch lesson):** `arenaBandApplied = false` at
  `startBossEncounter` (beside `activeBand = resolveBand(…)` `:1653`), in `endEncounter`
  (beside `activeBand = BAND` `:1881`) and in `resetBoss` (beside `:5461`). `activeBand`
  itself already restores in both teardowns — verified.

---

## 5. GOD-RAY SUPPRESSION + THE FLOOD KICK (the two `postfx.js` one-liners)

**Suppression** — the void has no sun; the shipped idiom is `game.embertideSky` at
`postfx.js:379`:

```js
// boss.js, per-frame in updateBoss beside the embertideSky drive (:2185):
game.bossVoidSky = bossArenaMix() > 0.5;
// postfx.js:379 becomes:
if (postfx.godRayPass && (game.embertideSky || game.bossVoidSky)) postfx.godRayPass.enabled = false;
```

`game.bossVoidSky = false` **hard-cleared in BOTH teardowns** (`endEncounter` beside `:1873`,
`resetBoss` beside `:5416`) — the embertideSky template has exactly this hole in `resetBoss`
(audit F12, re-confirmed this session); implement to the assert, not the template. No
`gameState.js` declaration needed (the embertideSky idiom assigns dynamically). Note: while
the player is dead mid-void, `updateBoss` stops but the flag correctly stays `true` (no sun on
the death screen either); `resetBoss` clears it.

**The flood kick** — `kick()` takes a preset NAME (`postfx.js:164`; audit F4 — the plan's
object-literal call does not exist):

```js
// postfx.js KICK_PRESETS (:147-162), one entry (caps: bloom ≤ 0.36 / lift ≤ 0.6, :138 — legal):
arenaFlood: { flashFrames: 1, bloom: 0.30, lift: 0.40 },
// boss.js breakShield, at the beat start (:3805) — def-gated to the S1→S2 crack only:
if (model.stageTransitionDur && def.phases[phaseIdx + 1]) {
  beginStageBeat(false);
  if (def.arenaStates && phaseIdx === 0) kick('arenaFlood');   // NEW: import { kick } from './postfx.js'
}
```

New import `boss.js → postfx.js`: no cycle (`postfx.js` does not import `boss.js`; it takes
`bossTarget` as a param). Tier degradation, stated in the PR per Law 10: tier 1 halves the
kick, tier 2 no-ops it — the flood read on weak mobile is carried by the palette lerp alone.
The dev intro beat gets no kick (dev-only path; keep it minimal).

---

## 6. DEF GATE — `bossDefs.js` unmasked block (`:1715`)

One line in the def (beside `stages: 3`):

```js
arenaStates: true,   // ARENA transformation (arenaSkin.js): S1 ordinary sky → S2+ THE HOLLOW
                     // BEHIND THE SKY (PR-A holds the void through S3; PR-B adds the heaven)
```

Boolean now; PR-B keys phaseIdx→arena inside `arenaSkin.js`, not the def. Every other def is
untouched → `bossArenaMix()` returns 0 for the entire roster by the `def?.arenaStates` guard.

---

## 7. DEBUG SEAM — `__dd.bossArenaState()` (main.js `:288` block)

```js
bossArenaState: () => ({
  mix: bossArenaMix(),                       // boss.js export (§2)
  voidSky: !!game.bossVoidSky,
  propBandsHidden: debugArenaProps(),        // environment.js export (§3)
  skyDim: debugSkyDim(),                     // environment.js: () => skyDim — proves the
}),                                          // EMBERTIDE channel stayed at 0 (disjointness)
bandDark: () => bossDebugState()?.bandDark,  // OR extend bossDebugState (:5734) with
                                             // bandDark: activeBand[1].c  (T2 band assert)
```

(`bossSetStage` `:351`, `bossSetDefIdx` `:331`, `spawnBoss` `:296`, `bossForceFight` `:308`,
`bossReset` `:353`, `renderer` `:289` all verified live — the T-recipes below reuse them
unchanged.)

---

## 8. DECISION DEFAULTS (the minor blockers, resolved for the builder)

1. **Mirror floor (plan O5) — CONFIRM-AND-SHIP as authored.** Zero code: the void water values
   flow through `setWaterTint` at every tier; the actual reflection is the tier-0 `Reflector`
   (`water.js:2-14`), lower tiers get the analytic sky fake (its sparkle passes for
   star-shimmer, nothing mirrors the boss). **Disclose "star-mirror is tier-0 only" in the PR
   body** (identity audit F-7.1) — Law-10 stated degradation, not a fix.
2. **Fever death-wash — the player's light wins. ZERO code in PR-A.** The seam, named:
   `feverMix` composes in the sky shader AFTER the env colors (`environment.js:314-334`) and
   motes lerp toward `feverColor` (`ambient.js:128`); `endEncounter` grants
   `game.feverActive = true` (`boss.js:1897`). PR-A deliberately adds no damping term
   (identity §6.3's recommendation). Surface for a one-line owner sign-off in the PR; a
   damp-uniform remains possible later without unwinding anything.
3. **R4 backlight disc — DEFER from PR-A (recommended).** The identity audit is right that the
   value axis is ~zero (real wing mats are lit `MeshStandard` `0x30303a-0x484852`, not the
   quoted lid hex) and the disc is LIKELY — but building it inside PR-A breaks the two
   strongest guarantees this PR sells: the **zero-new-mesh empty-first contract** and the
   **absolute no-scene-graph string-assert** on the new module. Instead: (a) the Gate-2
   montage carries a named "S2 silhouette vs the bruise band" frame from the Astral source;
   (b) if flagged, the disc lands as its own micro-file (`js/voidBacklight.js`, one
   non-enclosing additive disc strictly behind the silhouette plane, driven by the same
   `bossArenaMix()`, torn down in both teardowns) in the same review cycle — pre-authorized
   here so the gate can A/B instead of bouncing the PR. The temperature axis (gold eyes as
   the only warmth) + lit-edge carry are real and may pass without it.
4. **God-ray SWELL + heaven + authored exhale + grade bias:** OUT — PR-B/PR-C, per the
   corrected sequence. PR-A's god-ray story is suppression only (§5).

---

## 9. TESTS + GO GATES (exact assertions)

### T1 — extend `tests/unmaskedorgans.mjs` (the reparent-safety × live-arena conjunction)
Per stage, in the existing per-stage fresh forceFight boots (recipe `:34-38` unchanged),
after the sampling loop add `const arena = await page.evaluate(() => window.__dd.bossArenaState())`:
- S1: `arena.mix === 0` (zero-default identity holds IN a live S1 fight).
- S2: `arena.mix >= 0.99 && arena.voidSky === true && arena.propBandsHidden === true` — the
  void is LIVE **in the same boot whose in-lane organ asserts already ran** (`wingEye0..5` +
  relics `|x| ≤ 10.4, y ≤ 22`). The conjunction is the embertide-lesson point: an arena that
  only engages off the organs' path is the documented false-green.
- S3: `arena.mix >= 0.99` (PR-A interim: the void holds).
- All stages: `arena.skyDim === 0` (the EMBERTIDE sky channel provably never engaged).
(The 15 s sampling window comfortably outlasts the 2.7 s pinned intro beat, so reading arena
state after the loop needs no extra waits.)

### T2 — NEW `tests/unmaskedarena.mjs` (pure-node part + browser part)
**Pure-node (three-resolver, the bulletcontrast import style):**
- **Schema completeness (audit F3.4):** `new Set(ARENA_ENV_KEYS)` equals
  `new Set(Object.keys(computeEnv(0)))` — when the graphics stream adds env fields the arena
  fails LOUDLY instead of leaking biome clouds into the void.
- **Byte-identity at mix 0:** snapshot `computeEnv(d)` (hexes + scalars) for several dists,
  `applyArenaSkin(env, 0)`, assert every field unchanged (the early-return proof).
- **Void-exact at mix 1:** `applyArenaSkin(env, 1)` → every field equals `VOID_HEX`.
- **String-assert (F8-narrowed):** `js/arenaSkin.js` source has zero matches for
  `scene\.add|\.parent\s*=|new THREE\.(Mesh|Group|Points|InstancedMesh|Sprite|Line)\b`
  (never the plan's `\.add(` — `Color.lerp/copy` math is legitimate).
**Browser (boot):**
- **(b) coexist:** forced EMBERTIDE (idx 12) fight → `bossArenaState().mix === 0` throughout
  + `skyDim > 0` engages as shipped; forced VOIDMAW (idx 0) → mix 0. (boss.mjs covers the
  broad roster; this pins the two sky-owning systems disjoint — R9.)
- **(c) sync/snap:** pin S2 → spawn → forceFight → poll: mix reaches ≥ 0.99 within
  `TRANS_DUR + STAGE_REVEAL_HOLD + 1s`; fresh boot: pin S2, mid-intro set
  `__dd.input.surgeTap = true` → next poll `mix === 1` (the skip snap).
- **(d) teardown:** at S2 mix 1 → `__dd.bossReset()` → next frame `mix === 0`,
  `game.bossVoidSky === false`, `propBandsHidden === false`. (endEncounter's restore is
  by-construction — the getter is stateless and its two flags are cleared in both teardowns;
  asserted headless on the resetBoss path, stated for the kill path.)
- **(e) band:** at S2 mix 1 `bandDark === 0xa84167`; after reset `0x8f0a3c`.
- **(T5, folded in) perf:** pinned-S1 boot vs pinned-S2 boot,
  `__dd.renderer.info.render.calls` delta **≤ 0** (audit F5 — whale/flyby suppression may
  DECREASE draws; never `=== 0`), and no new additive surfaces (none exist to add).

### T3 — extend `tests/bulletcontrast.mjs`
`import { ARENA_CONTRAST } from '../js/arenaSkin.js'` and append its rows to the existing
biome loop (same six colours, same `passBg`, zero new KNOWN_EXCEPTIONS). Expected (re-derived
this session with the gate's own `lum()`):

| colour | vs void fog L.028 | vs void horizon L.066 |
|---|---|---|
| danger `0xff2b6a` | .335 PASS | .298 PASS |
| band-light `0xffc6dc` | .802 PASS | .765 PASS |
| band-mid `0xff4f9a` | .450 PASS | .412 PASS |
| band-dark **override `0xa84167`** | .324 PASS | .286 PASS (default `0x8f0a3c`: .136/.099 FAIL — the §4 fix) |
| reflect-amber `0xffc23c` | .746 PASS | .708 PASS |
| reflected-cyan `0x66ddff` | .749 PASS | .712 PASS |

This is merge-blocking on any future arena-palette diff (the identity audit's covenant).

### T4 — determinism
`tests/gold-determinism.mjs` green untouched: the feature adds no RNG anywhere (the blend is
pure math; the prop gate is visibility-only and the recycle loop + `rnd` stream run
identically) and never touches `level.js`.

### Suite
`boss.mjs`, `unmaskedreckoning.mjs`, `bossboot.mjs`, `run-all.mjs` green.

### Shots — `tools/arenashots.mjs` (tiershots harness pattern)
Montage rows: **Astral source (MANDATORY — the worst case: `stars:1` makes `starMix` a
no-op there, identity-audit F-4)** + Sanctuary source × {S1 pinned · flood t≈0.5 (screenshot
~1.1 s after forceFight with the S2 intro beat running) · S2 settled}. Named Gate-2 judgment
frames: "another dimension, not dimmer" **from Astral** (carried there by sun-gone +
fog-swallow 45/240 vs Astral's 80/420 + mirror-calm water + up-dust + the monoliths
VANISHING — the prop gate is a big Astral delta); "S2 silhouette vs the bruise band" (expect
the R4 disc verdict here); the flood motion. PR-A's gate judges **"another dimension," not
"workshop"** (the workshop claim belongs to the Blanks increment — identity audit F-6).

---

## 10. DETERMINISM + BUDGET (the standing laws, checked)

- **RNG:** zero new draws on any `rnd` stream; `level.js` untouched; prop recycling unchanged.
- **Draw calls:** zero new meshes/draws; uniform + scalar writes on existing objects only;
  whale/flyby/bands can only REMOVE draws in-void (hence delta ≤ 0).
- **Per-frame cost:** ~27 lerps + one boolean when mix > 0; ONE comparison when mix = 0
  (early return). No allocation (baked Color tables).
- **Overdraw:** unchanged (no additive surfaces added; the sky dome draw is the same draw).

---

## 11. RESIDUAL RISKS, RANKED

1. **S2 silhouette dark-on-dark (R4)** — the value axis is ~zero on the real wing materials;
   temperature + lit-edges must carry it. Gate risk, not silent-ship risk (named Gate-2
   frame; disc fallback pre-authorized §8.3).
2. **Astral-source void read (F-4)** — the two loudest channels (stars, violet) are ~zero
   deltas from the anchor biome; sun-gone/swallow/mirror/up-dust/prop-vanish must carry it.
   Mandatory montage row; judged, not assumed.
3. **Flood motion feel** — "pulled through" vs "a fade" is headless-unprovable; owner/Fable
   preview only. The values in §1.3 are starts, not promises (PR-C is the budgeted iteration).
4. **Prop-gate pop at t=0.45** — masked by the flood peak + fog.near≈25; if visible on
   preview, tune the threshold (any value in 0.4–0.6 works mechanically).
5. **Natural-kill snap void→ordinary** — accepted PR-A interim (masked by slow-mo + FELLED +
   the surge grant); the minimal ease lands in PR-B (audit F7).
6. **Graphics-branch collision** — `environment.js` (+2 seams: signature + one call + the
   band-gate conjunct) and `postfx.js` (+2 one-liners) are graphics-owned files; diffs are
   confined to the named seams; flag the PR to the graphics stream for its phase-start rebase
   (GRAPHICS-OVERHAUL protocol). The schema-completeness assert (T2) is the standing
   collision insurance.
7. **Completion-plan def merge** — both streams edit the unmasked def block; textual
   conflicts only; rebase-and-go (plan §7).

---

## 12. BUILD ORDER (step-by-step)

1. **`js/arenaSkin.js`** — the hex tables (§1.2/1.3), baked Color tables, `applyArenaSkin`
   (§1.4), `ARENA_CONTRAST`/`VOID_BULLETS`/`ARENA_ENV_KEYS` exports.
2. **`boss.js`** — `bossArenaMix()` (§2) + the `game.bossVoidSky` per-frame drive (§5) + the
   `arenaBandApplied` latch (§4) + `kick('arenaFlood')` at the crack (§5) + resets for the
   latch and flag in `startBossEncounter`, `endEncounter`, AND `resetBoss` (grep-both law).
3. **`environment.js`** — the 8th param + the `applyArenaSkin(env, arenaMix)` call (§2) + the
   `arenaPropsGate` mechanism with the `updateBandVisibility` conjunct (§3) +
   `resetEnvironment` clear + `debugArenaProps`/`debugSkyDim` exports.
4. **`main.js`** — thread `bossArenaMix()` at `:1415`; add `__dd.bossArenaState` (+`bandDark`).
5. **`postfx.js`** — the suppression `||` at `:379`; the `arenaFlood` preset.
6. **`bossDefs.js`** — `arenaStates: true` on unmasked.
7. **Tests** — T2 `tests/unmaskedarena.mjs` (new), T1 extension, T3 extension; run T4 + suite.
8. **`tools/arenashots.mjs`** + generate the montage (Astral row mandatory).
9. **Lesson file** (`leapfrog/lessons/2026-07-11-<slug>.md`, THE RULE) + Fable Gate-2 on the
   montage; owner judges the crack flood + the void read on the PR preview.

---

## VERDICT: **GO-WITH-FIXES**

The thesis holds in current code better than the plan knew (the boss→environment channel
already exists as the `bossTarget` param; `updateEnvironment` running in all non-paused
states makes restore self-healing). All audit must-fixes for PR-A are folded in as concrete
mechanics (F1 prop gate, F3.1 fauna fields, F4 preset, F6 intro-from-arena-0, F8 narrowed
assert, F5 delta ≤ 0, F12 both-teardown flag clears). The one NEW catch this pass adds — the
**void band override must ship in PR-A, not PR-B** (§0/§4) — is specified and gated (T3 would
hard-fail without it). No blocker remains; the two genuinely open judgments (S2 silhouette,
Astral-source read) are gate items with pre-authorized fallbacks, not build blockers.
