# PR-B BUILD SPEC — THE UNMASKED × THE UNVEILED HEAVEN (S2→S3 unveiling, the lit judgment-court)

**Status:** CP1 PRE-ASSESSMENT — reconciled, mechanical build spec. NO code has changed.
**Verdict: GO-WITH-FIXES** (all fixes folded in as build steps; one design-level catch corrected
here — §3's exhale channel: audit F7's "minimal mix→0 ease" as literally written would replay
the void BACKWARDS through the gold flood on the kill. Nothing blocks starting today.)
**Verified against:** master @ `6c8069a` (2026-07-11) — PR-A SHIPPED (`81d7e39` + CP2 fixes
`6c8069a`); every seam below re-read from the live tree this session; every contrast number
re-derived with `tests/bulletcontrast.mjs`'s own `lum()` (run, not copied).
**Scope:** the S2→S3 arena — phase 2 stops holding the void (PR-A's interim rule) and opens THE
UNVEILED HEAVEN; the boss-file S3 focal LIFT (identity-audit F-2 must-fix); the god-ray SWELL +
FAIRNESS CAP (F-1b); light-rain via the existing motes; the minimal natural-kill exhale (audit
F7). **OUT:** the Blanks (own gated increment), the AUTHORED death exhale + grade biases +
flood-feel tuning (PR-C), any dedicated rain-particle system (PR-C, §8.3).

---

## 0. Reconciliation — what the fresh code-read confirmed, moved, simplified, and caught

| Claim (docs) | Fresh verdict |
|---|---|
| PR-A infra as its spec describes | **CONFIRMED, minor line drift:** `bossArenaMix()` `boss.js:1628` (spec said ~1613); injection `environment.js:519`; signature + `arenaMix` 8th param `:501`; prop gate `:507-511` + `updateBandVisibility` conjunct `:449`; god-ray suppression `postfx.js:382` (spec said :379); `arenaFlood` preset `postfx.js:164`; def gate `bossDefs.js` `arenaStates: true`; both-teardown clears `boss.js:1904`/`:5502` |
| **NEW — placement luck** | The per-frame arena drive (`boss.js:2214-2219`: `bossVoidSky` + the band latch) runs **BEFORE `updateBoss`'s `if (!active) … return` (`:2220`)** — so the natural-kill EXHALE state (§3) can decay right there, post-kill, while the game keeps playing. No new update thread needed. |
| God-ray intensity "hardcoded in main.js ~:1423-1430" | **MOVED/REFINED:** main.js `:1426-1437` computes the sun-facing BASE (`min(sunFacing,1) * 0.6` → `setGodRaySun`), but the per-frame intensity COMPOSE already lives in `postfx.js:354-363` (`inten = _grIntensity * (1 − feverMix·0.45)` → `uIntensity`, self-disables < 0.004). **The cleanest swell seam is a `setGodRayBoost(k)` postfx export composed at `:356`** — one line in main.js threads the k; the fever damp composes for free (§6). |
| **NEW — silent-ship catch (voidSky window)** | PR-A's `game.bossVoidSky = arenaMixNow > 0.5` (`boss.js:2215`) has **no upper bound** — under the extended mix domain the HEAVEN would inherit the void's god-ray suppression and the #1 holy carrier would never switch on, with every shipped test green. PR-B bounds it: `> 0.5 && < RAY_ON (1.6)` (§4). |
| **NEW — the heaven needs NO band override** | Re-derived this session (§10-T3 table): all six role colours PASS both heaven backgrounds — including the **void-latched dark `0xa84167` (L .352: .381/.392 direct)** and **every biome light/mid override that can merge in** (Wastes light `0xa98392` L .550: .183/.194 direct; Sanctuary/Mire dark `0xaf4f73` L .400: PASS — moot, the latch overwrites dark). **The PR-A latch simply persists through the heaven; no second band mechanism, no un-latch, no heaven `bullets:{}` entry.** The identity doc's "default band-light may then need no override" (L280) is confirmed: band-light default `0xffc6dc` (L .830) passes layered on both (bg ≤ .75 keeps the layered read alive). |
| **NEW — fogFarColor ceiling catch** | The identity doc never authored the heaven's `fogFarColor` (schema-completeness requires it). A natural "brighter gold at distance" pick (e.g. `0xdec992`, L **.790**) sits ABOVE the .75 layered cliff — a background the gate never checks but the sky's lowest band sinks into (`environment.js:330`). **Author `fogFarColor = the fog hex `0xd4b982`** (L .732, already gate-covered) — "distance dissolves into light" is carried by fog/horizon; no new background luminance class (§1). |
| Light-rain = "likely NEW particles" (transformation audit §2 fear) | **MOOT — the identity already authored the rain as MOTES** (`ambColor 0xffe9b8 / ambFall +0.5 / ambSway 0.25`), and the mote pool is one existing 1200-point `THREE.Points` (`ambient.js:11,47`) fully env-driven. Gold light-rain = env values in `HEAVEN_HEX`, **zero new draws, zero new particles** (§8). Density boost (fixed COUNT) is the only thing that would need new plumbing → deferred to PR-C. |
| Boss S3 rig constants (identity-audit F-2) | **CONFIRMED against the live file:** `halo3Mat` accent-additive, opacity ·0.7, retinted per-frame `bossUnmasked.js:1004`; `burstMat` hot-base→black-tip vertex fade `:704`, retinted `:1003`; star-eye sclera = shared static `greatScleraMat 0x8f8365` (L .516 — darker than heaven mid .666/horizon .744) `:629,719`; catchlight = shared `catchMat` (`0xfff6e6`×2.4, toneMapped=false) written per-frame in the stage-2 block `:966` (stage2 stays visible in S3). The lift seams are exactly these four materials (§5). `def.accent = 0xf0e0a0`. S3 fires amber (`'fan'` in phase 3 + amberdiet) — confirmed in the def. |
| T1 organ×arena conjunction "extends `unmaskedorgans.mjs`" | **DOC DRIFT:** PR-A folded the conjunction INTO `tests/unmaskedarena.mjs` (`:93-103`, wingEye0 in-lane with the void live); `unmaskedorgans.mjs` has no arena asserts. PR-B extends `unmaskedarena.mjs` the same way (wingRootL/R × heaven) — do NOT create a parallel. |
| T5 draw-call delta | **REPLACED at CP2:** `renderer.info` is racy headless (main loop resets per frame) — the shipped test proves no-new-draws STRUCTURALLY (string-assert). PR-B extends the structural proof; no numeric delta (§10-T2). |
| **NEW — false-green catch (test tightening)** | The shipped/planned S3 asserts use `mix >= 0.99` — still true if the heaven FAILS to engage and phase 2 stays stuck at the void (mix 1). Every S3 arena assert must tighten to **`mix >= 1.99`** or the whole PR can silently not-ship (§10). |
| Fairness probe feasibility | `tools/silhouetteCore.mjs` exports `decodePNG` — the god-ray corridor luminance probe (F-1b made mechanical) is buildable in-repo with no new dependency (§6.3). |

---

## 1. `js/arenaSkin.js` — HEAVEN_HEX + GOLD_FLOOD_HEX (schema-complete, ceiling-legal)

### 1.1 THE HEAVEN — all 27 env fields (keys ≡ `ARENA_ENV_KEYS`; L per the gate's own `lum()`)

| field | value | L | note |
|---|---|---|---|
| `skyTop` | `0x6f88ad` | .523 | cool steel-blue ZENITH — the anti-sunset signal |
| `skyMid` | `0xc9a860` | .666 | the gold body of the light |
| `skyHorizon` | `0xd9bc7e` | **.744** | the GOLD BENCH — ceiling-legal (0.006 headroom; covenant §9.4) |
| `sunGlow` | `0xfff0cc` | .943 | small warm glow region (accepted small-area, like the shipped gate treats it) |
| `fogColor` | `0xd4b982` | **.732** | distance dissolves into LIGHT |
| `fogNear` / `fogFar` | `70` / `380` | — | the court is vast (vs the void's 45/240 pocket) |
| `fogFarColor` / `fogFarMix` | `0xd4b982` / `1` | .732 | **= the fog hex — the §0 ceiling catch** (never author this above .75) |
| `lightSun` / `lightSunI` | `0xfff2d0` / `1.9` | — | warm-white key; the water sun-streak returns via `env.sunGlow` |
| `hemiSky` / `hemiGround` | `0xcfd8e8` / `0x8a7a58` | — | cool-over-warm fill |
| `waterDeep` / `waterShallow` / `waveAmp` | `0x5f7aa8` / `0xc4b98e` / `0.5` | .469 / .722 | the bright glassy sea; shallow ≤ .75 |
| `ambColor` / `ambFall` / `ambSway` | `0xffe9b8` / `+0.5` / `0.25` | — | **GOLD LIGHT-RAIN** — slow descent (the inversion of the void's −0.45 up-dust) |
| `ambSize` / `ambOpacity` | `0.55` / `0.85` | — | TUNE — slightly larger/denser than biome default so the rain reads (identity omitted; completeness requires them) |
| `faunaColor` / `faunaScale` / `faunaFlap` | `0xffe9b8` / `0` / `0` | — | the court is empty (F3.1; colour moot at scale 0) |
| `starMix` | `0` | — | the pinholes are OUTSHONE — the hollow was this heaven shuttered |
| `whaleMix` / `flybyMix` | `0` / `0` | — | nothing lives here |

### 1.2 THE GOLD FLOOD (the S2→S3 unveiling mid-palette — all TUNE, PR-C iterates)

Warm-white gold `~0xfff0c8` (L .942), the §3.2 "light blooms outward FROM the boss" carrier:

`skyTop 0xffeecb · skyMid 0xfff0c8 · skyHorizon 0xfff4d4 · sunGlow 0xffffff ·
fogColor 0xfff0c8 · fogNear 25 · fogFar 300 · fogFarColor 0xfff0c8 · fogFarMix 1 ·
lightSun 0xfff0c8 · lightSunI 2.2 · hemiSky 0xffe8c0 · hemiGround 0xbfa070 ·
waterDeep 0xc0a878 · waterShallow 0xffe9bf · waveAmp 0.4 ·
ambColor 0xffffff · ambFall 0.2 · ambSway 0.3 · ambSize 0.45 · ambOpacity 0.7 ·
faunaColor 0xffffff · faunaScale 0 · faunaFlap 0 · starMix 0 · whaleMix 0 · flybyMix 0`

(`starMix 0` → the pinhole-stars die INSIDE the bloom — "all that light was always behind the
dark". `fogNear 25` → the flood swallows by nearness, the PR-A grammar. Accepted transient, one
line in the PR body: the rider's fixed-cyan chip shots keep firing through the beat and clear the
gold flood at **.165 direct** — barely, briefly, and stated.)

### 1.3 Exports + the extended apply function (mix domain 0..2 + the FADE channel)

```js
export const HEAVEN_HEX = { …§1.1… };
export const GOLD_FLOOD_HEX = { …§1.2… };
// ARENA_CONTRAST gains ONE row — the latched void band PERSISTS through the heaven (§0):
export const ARENA_CONTRAST = [
  { name: 'THE HOLLOW (void arena)',    fog: 0x0a0514, horizon: 0x1a0b2e, bullets: VOID_BULLETS },
  { name: 'THE UNVEILED HEAVEN (arena)', fog: 0xd4b982, horizon: 0xd9bc7e, bullets: VOID_BULLETS },
];
```

```js
const HEAVEN = bake(HEAVEN_HEX), GOLDFLOOD = bake(GOLD_FLOOD_HEX);
const BIOME = bake(VOID_HEX);   // scratch REUSED to snapshot the live biome for the fade (values overwritten)

// mix 0..1 = ordinary→(FLOOD)→VOID (PR-A curve, byte-identical);
// mix 1..2 = VOID→(GOLD FLOOD)→HEAVEN (the unveiling, same T0=0.45 grammar);
// fade 1 = full arena; fade<1 = the natural-kill EXHALE — the arena dissolves STRAIGHT
// into the live biome sky (never runs the 0..2 curve backwards — §3's catch).
export function applyArenaSkin(env, mix, fade = 1) {
  if (!(mix > 0) || !(fade > 0)) return;                      // zero writes ⇒ byte-identical
  if (fade >= 1) { applyMix(env, mix); return; }              // byte-exact path (no extra lerp)
  copyInto(BIOME, env);                                       // snapshot the live biome (alloc-free)
  applyMix(env, mix);
  blend(env, BIOME, 1 - fade);                                // heaven → the returned sky, directly
}
function applyMix(env, mix) {
  if (mix <= 1) {                                             // PR-A branch, UNTOUCHED
    if (mix < T0) blend(env, FLOOD, sstep(mix / T0));
    else { copyInto(env, FLOOD); blend(env, VOID, sstep((mix - T0) / (1 - T0))); }
  } else {
    const m = Math.min(1, mix - 1);
    if (m < T0) { copyInto(env, VOID); blend(env, GOLDFLOOD, sstep(m / T0)); }
    else { copyInto(env, GOLDFLOOD); blend(env, HEAVEN, sstep((m - T0) / (1 - T0))); }
  }
}
```

- **Continuity at mix 1 is exact both ways** (below: VOID at k=1; above: `copyInto(VOID)` +
  blend k=0) — no pop at the S2→S3 seam, asserted pure-node (§10-T2).
- **mix 2 ⇒ HEAVEN byte-exact from any source biome** (the flood copy severs the source) —
  source-independence holds for the heaven exactly as it does for the void.
- The string-assert stays satisfied: tables + Color math only, zero scene-graph shapes.

---

## 2. `boss.js` — the mix source keyed by phaseIdx (`bossArenaMix()` extended, still stateless) + `bossArenaFade()`

**Decision (the task's keying question): extend the SCALAR domain to 0..2, not a parallel kind
param.** The existing 8th param, the prop gate (`arenaMix >= 0.45`), and the band latch
(`>= 1`) all stay correct with zero churn; `applyArenaSkin` owns the phase→palette mapping (the
def stays a boolean, as PR-A's §6 promised). A `kind` string is exposed on the DEBUG seam only
(§7). The one new channel that genuinely can't ride the scalar — the exhale — is a second
getter threaded as the 9th param (mirroring how `bossTarget`/`arenaMix` were added; not a
fragile parallel: same call, same style, same self-heal).

```js
// boss.js — replaces the PR-A body at :1628 (same exports position; still a pure function of
// fight state + the exhale channel below). Mix 0..1 = the void (PR-A), 1..2 = the heaven.
export function bossArenaMix() {
  if (!active) return exhaleT > 0 ? exhaleMix : 0;   // natural-kill EXHALE: HOLD the arena; fade carries the return
  if (!def?.arenaStates || phaseIdx < 1) return 0;
  if (stageBeatT >= 0 && stageBeatSkippable) {       // dev stage-pin intro: blend from arena 0 to the pinned arena
    const end = phaseIdx >= 2 ? 2 : 1;               // (a pinned-S3 boot sweeps 0→2 THROUGH the void — a 2s recap,
    return ss01(stageBeatT / stageBeatDur) * end;    //  no ordinary→void pop; dev-only path, stated)
  }
  if (stageBeatT >= 0 && phaseIdx === 1) return ss01(stageBeatT / stageBeatDur);       // the CRACK (PR-A)
  if (stageBeatT >= 0 && phaseIdx === 2) return 1 + ss01(stageBeatT / stageBeatDur);   // the UNVEILING (NEW)
  return phaseIdx >= 2 ? 2 : 1;                      // settled: S2 void · S3 heaven (replaces "void holds through S3")
}
// ss01 = the existing clamp+smoothstep helper (:1633-1634 factored).

// THE EXHALE (audit F7's minimal natural-kill ease — CORRECTED here: easing the MIX back down
// would replay heaven→gold-flood→void→white-flood in reverse, a strobe. Instead the mix HOLDS
// and a fade channel dissolves the arena straight into the live biome sky — O4's read.)
let exhaleT = 0, exhaleMix = 0;                       // module state, render-side only
const ARENA_EXHALE_DUR = 2.5;                         // O4's ~2.5s "the sky it stole is given back"
export function bossArenaFade() {
  return (!active && exhaleT > 0) ? ss01(exhaleT / ARENA_EXHALE_DUR) : 1;
}
```

**State writes (grep-both law — every site named):**
- `endEncounter` (`:1873`, beside the `:1904` flag clears): `const m = bossArenaMix();
  if (def?.arenaStates && m > 0) { exhaleMix = m; exhaleT = ARENA_EXHALE_DUR; }` — captured
  BEFORE `active = false` (`:1900`). Non-arena bosses never set it (coexist ✓).
- Decay: in the per-frame drive block (`:2214`, which runs before the `!active` return):
  `if (exhaleT > 0) exhaleT = Math.max(0, exhaleT - dt);`
- `startBossEncounter` (beside `:1675`): `exhaleT = 0; exhaleMix = 0;` (a new fight cancels a
  stale exhale).
- `resetBoss` (beside `:5502`): `exhaleT = 0; exhaleMix = 0;` — **the hard snap stands** (F7:
  resetBoss keeps the snap; the getter returns 0 next frame; env + props self-heal).

Traced behaviours (fresh, against the live state machine):
- **Natural kill in S3:** heaven holds under slow-mo + FELLED (mix frozen at `exhaleMix` 2),
  then dissolves to the ordinary sky over 2.5s under the surge grant's magenta (fever policy:
  the player's light wins — carried from PR-A, no damping in the heaven either). Snaps clean:
  at `exhaleT = 0` the getter returns 0 → `applyArenaSkin` early-returns.
- **Player death post-kill mid-exhale** (possible — terrain): `updateBoss` stops, the exhale
  freezes behind the death screen (matches the PR-A void-death behaviour); `resetBoss` on the
  next run hard-clears. Stated, accepted.
- **Mid-fight unveil (the real path):** `breakShield` runs `beginStageBeat(false)` +
  `phaseIdx→2` in the same frame → mix ramps 1→2 over `TRANS_DUR 2.0` in lockstep with
  `model.setPhase(2)`'s unveil morph. Void→heaven seam pop-free by §1.3 continuity.
- **Every other boss / flight / menu:** unchanged PR-A traces; mix 0; byte-identical.

---

## 3. `boss.js` — the per-frame drive block (`:2214-2219`) extended

```js
const arenaMixNow = bossArenaMix();
const arenaFadeNow = bossArenaFade();
// VOID window (the §0 silent-ship catch): suppression holds through the void and releases as
// the unveil passes t≈0.6 (mix RAY_ON 1.6) — the god-ray SWITCH-ON beat (identity §3.2).
game.bossVoidSky = arenaMixNow > 0.5 && arenaMixNow < RAY_ON;        // RAY_ON = 1.6
// HEAVEN god-ray swell signal, 0..1: ramps over the last 0.4 of the unveil, full at mix 2,
// eases out with the exhale. Cleared in BOTH teardowns beside bossVoidSky (grep-both law).
game.bossHeavenRays = Math.max(0, Math.min(1, (arenaMixNow - RAY_ON) / (2 - RAY_ON))) * arenaFadeNow;
if (def?.arenaStates && !arenaBandApplied && arenaMixNow >= 1) { …unchanged PR-A latch… }
if (exhaleT > 0) exhaleT = Math.max(0, exhaleT - dt);
// THE FOCAL LIFT drive (§5): the boss's light LEADS the world — full by the gold-flood peak
// (mix 1+T0), so the burst igniting reads as the CAUSE of the heaven arriving (identity §3.2).
if (active && model) model.setArenaHeaven?.(ss01((arenaMixNow - 1) / 0.45));
```

- `game.bossHeavenRays = 0` added to the clear lines at `:1904` (endEncounter) and `:5502`
  (resetBoss) beside `bossVoidSky` — the embertideSky template hole, third verse (F12).
- **The unveil kick** — `breakShield` (`:3839-3845`) gains the gold twin of the crack flood:
  ```js
  if (def.arenaStates && phaseIdx === 0) kick('arenaFlood');
  else if (def.arenaStates && phaseIdx === 1) kick('arenaUnveil');   // NEW
  ```
  `postfx.js KICK_PRESETS`: `arenaUnveil: { flashFrames: 1, bloom: 0.32, lift: 0.45 }`
  (within caps 0.36/0.6; tier 1 halves, tier 2 no-ops — Law-10 stated: the palette lerp alone
  carries the unveiling on weak mobile).

---

## 4. `environment.js` + `main.js` — the fade thread (9th param) + the prop gate conjunct

```js
// environment.js:501 — extend the signature (the PR-A pattern, one more slot):
export function updateEnvironment(dt, camera, time, playerDist, feverActive = false,
                                  playerSpeed = 0, bossTarget = 0, arenaMix = 0, arenaFade = 1) {
  const hideProps = arenaMix >= 0.45 && arenaFade >= 0.5;   // :507 — props return mid-exhale,
  …                                                          // masked by the surge wash (TUNE 0.4-0.6)
  applyArenaSkin(env, arenaMix, arenaFade);                  // :519 — the one call, third arg
```

```js
// main.js:1422 — thread it:
updateEnvironment(dt, camera, t, player.dist, game.feverActive, player.speed,
                  bossGradeTarget(), bossArenaMix(), bossArenaFade());
```

No import cycle (unchanged: `environment.js → arenaSkin.js → THREE` only; `bossArenaFade` joins
`bossArenaMix` in main.js's existing boss.js import).

---

## 5. `bossUnmasked.js` — THE S3 FOCAL LIFT (identity-audit F-2's must-fix, arena-gated, inert off-heaven)

**Why (measured, F-2):** the S3 star-eye sclera is L .516 — *darker than the heaven's mid sky
(.666) and horizon (.744)*; the halo/burst are accent-additive and wash toward the same gold
hue; the burst's black ray-tips contribute nothing additive, so the radiance visibly SHORTENS
on a bright sky. Unlifted, the poster frame is the L219 owner-rejected shape ("a floating mask
on a sunset").

**Mechanism — the `setBrandedRelics` precedent: one model method, driven by boss.js (§3), zero
model-internal state coupling to the fight machine:**

```js
// bossUnmasked.js — near setStage3. heavenK 0 ⇒ STRUCTURALLY inert (guarded writes below).
let heavenK = 0;
function setArenaHeaven(k) { heavenK = Math.max(0, Math.min(1, k)); }
// captured base beside IRIS_BASE/CATCH_BASE (:832-833):
const SCLERA_BASE = greatScleraMat.color.clone();
// exported in the model return (:1016+): setArenaHeaven, debugArenaLift: () => ({
//   k: heavenK, sclera: greatScleraMat.color.getHex() })
```

In `tickBody`'s existing `stage3.visible` block (`:1000-1008`) — the ONLY place the lift
writes, so stages 1/2 never execute a byte of it:

```js
if (stage3.visible) {
  starPivot.rotation.z = time * 0.06;
  const pulse = 0.85 + Math.sin(time * 0.8 * TAU) * 0.15 + charge * 0.3;
  const lift = 1 + heavenK * BURST_LIFT;                                  // ×1 at heavenK 0 — byte-identical floats
  burstMat.color.copy(_c.set(def.accent)).multiplyScalar(pulse * lift);   // :1003 — the radiance re-lengthens
  halo3Mat.color.copy(_c.set(def.accent))
    .multiplyScalar((0.8 + Math.sin(time * 0.5 * TAU) * 0.12) * (1 + heavenK * HALO_LIFT));  // :1004
  if (heavenK > 0) {                                                      // GUARDED: zero writes off the heaven
    greatScleraMat.color.copy(SCLERA_BASE).multiplyScalar(1 + heavenK * SCLERA_LIFT);  // the star-eye brightens past the sky
    catchMat.color.multiplyScalar(1 + heavenK * CATCH_LIFT);              // after :966's per-frame write — composes with snapK
  } else if (greatScleraMat.color.getHex() !== SCLERA_BASE.getHex()) {
    greatScleraMat.color.copy(SCLERA_BASE);                               // one-frame restore on any heaven→off edge (dev re-pin)
  }
  …starPupil tracking unchanged…
}
```

**Authored magnitudes (ALL TUNE — the O-B2 owner playtest gate, §9.2):**
`SCLERA_LIFT 0.5` (sclera L .516 → ≈ .77, above the horizon — the focal re-takes §3-law-2),
`HALO_LIFT 0.6`, `BURST_LIFT 0.9` (hot base ×~1.9 — the additive threshold crossing moves
outward, restoring visible ray length), `CATCH_LIFT 0.8`.

**Guarantees, stated:**
- **Stages 1/2 + the lance organs untouched:** all writes live inside `stage3.visible`;
  `heavenK` can only be > 0 at mix > 1 (phaseIdx 2 + `arenaStates`); the halo/burst multipliers
  are ×1 at k 0 (numerically byte-identical to the shipped per-frame writes); the sclera/catch
  extra writes are `if (heavenK > 0)`-guarded — **S3 in any non-heaven context renders
  byte-identical** (none exists today; coexist-clean by construction, asserted §10-T2).
- **Shared-material honesty:** `greatScleraMat` also paints the S2 focal `greatEye` — visible
  simultaneously only during the unveil's first half (k3 < 0.5, under the gold flood); the
  transient lift on it is invisible and stated. `catchMat` paints the whole eye-field's
  catchlights — in the heaven ALL catchlights brighten (part of the lift's read: the seraph's
  eyes are the darkness's stars; stated, owner judges).
- **Determinism:** zero `rnd`/`Math.random` anywhere in the lift; pure per-frame math (the
  PR-A lesson's rule holds).
- **sunGlow placement (audit F-2c's second option):** NOT moved in PR-B — the lift is the
  chosen fix; the glow region already sits behind the boss whose own focal now out-brights it.
  If the Gate-2 poster frame still flags, moving `sunGlow` low onto the bench is a one-hex
  env change reserved for PR-C (pre-authorized fallback, the R4-disc pattern).

---

## 6. God-rays — THE SWELL + THE FAIRNESS CAP (identity-audit F-1b)

### 6.1 The seam (postfx export; main.js threads one call)

```js
// postfx.js — beside setGodRaySun (:117):
let _grBoost = 0;                                   // 0..1 heaven signal (game.bossHeavenRays)
const GODRAY_HEAVEN_SWELL = 0.75;                   // O-B1 owner dial: max +75% over base
const GODRAY_INTEN_CAP = 1.0;                       // hard authored ceiling on uIntensity
export function setGodRayBoost(k) { _grBoost = Math.max(0, Math.min(1, k)); }

// postfx.js:356 — the compose (fever damp composes for free; suppression at :382 untouched):
const inten = Math.min(GODRAY_INTEN_CAP,
  _grIntensity * (1 - postfx._feverMix * 0.45) * (1 + _grBoost * GODRAY_HEAVEN_SWELL));
```

```js
// main.js — one line in the god-ray block (:1426-1437), after setGodRaySun:
setGodRayBoost(game.bossHeavenRays || 0);
```

Base max is `0.6` (main.js sunFacing feed) → swollen max `1.05`, capped `1.0`. Suppression
composition: the void window (§3) keeps `bossVoidSky` true through mix 1.6, so the shafts
SWITCH ON exactly as the boost ramps in — the identity's t≈0.6 "we have arrived" cue, one
mechanism. Tier 1/2: no god-rays at all (`_grTier0` gate) — Law-10 stated; the tier-1/2 heaven
is carried by palette + rain (`ambSize/ambOpacity` are tier-independent — the F-4c compensator).

### 6.2 Why a cap AND a probe

The shader adds `uTint · shaft · uIntensity` linearly over the composited scene
(`godrays.js:120`) — an effective-background lift the byte-space gate never sees. The layered
read dies when effective bg L crosses **.75**; the heaven's horizon already sits at .744.
The authored cap bounds the input; only a rendered frame bounds the OUTPUT.

### 6.3 THE FAIRNESS PROBE (F-1-heaven made mechanical — merge-blocking)

In `tests/unmaskedarena.mjs`'s browser part, at the settled pinned-S3 heaven (reveal done,
no volley on screen): `page.screenshot()` → `decodePNG` (`tools/silhouetteCore.mjs`, in-repo)
→ compute per-pixel `lum()` (the gate's own weights) over **the bullet corridor** (central
region: x 25–75% of width, y 30–85% of height — where the lane's ±10 × y≤22 bullets actually
read; constants TUNE, stated in the test) → assert **p95 luminance ≤ 0.75**. The p95 targets
the bright tail (sky + boosted shafts); the dark seraph pixels only make the assert stricter
for the shafts. If the probe fails: lower `GODRAY_HEAVEN_SWELL` (the owner's dial trades holy
carry vs parry margin — O-B1) — the probe, not taste, is the authority.

---

## 7. Debug seam — `__dd.bossArenaState()` extended (main.js `:354-360`)

```js
bossArenaState: () => ({
  mix: bossArenaMix(),                               // 0..2 now (0..1 void · 1..2 heaven)
  kind: (m => m <= 0 ? 'none' : m <= 1 ? 'void' : 'heaven')(bossArenaMix()),   // the task's kind field
  fade: bossArenaFade(),                             // 1 in-fight · <1 during the kill exhale
  voidSky: !!game.bossVoidSky,
  heavenRays: game.bossHeavenRays || 0,              // the god-ray swell signal
  propBandsHidden: debugArenaProps(),
  skyDim: debugSkyDim(),
  bandDark: bossDebugState()?.bandDark,
  lift: bossDebugModelLift(),                        // boss.js: () => model?.debugArenaLift?.() ?? null
}),
```

**NEW dev seam `__dd.bossFell()`** (boss.js export `debugFell()` → `endEncounter(lastPlayer)`
iff active) — the only way to exercise the natural-kill exhale headless; ~3 lines, dev-only,
same class as `bossFelledLie`.

---

## 8. Light-rain — decision: MOTES IN PR-B, dedicated streaks DEFERRED

1. **In PR-B (recommended, spec'd §1.1):** the rain IS the existing 1200-point mote pool
   re-skinned by `HEAVEN_HEX` (`ambColor 0xffe9b8 · ambFall +0.5 · ambSway 0.25 · ambSize 0.55
   · ambOpacity 0.85`). **Zero new draws, zero overdraw delta, zero new particles** — the §2
   cliff is not approached. Known softener, stated: the in-fight mote budget
   (`ambient.js:133`, `× (1 − 0.55·bossMix)` with bossMix ≈ 0.6) dims the rain ~33% during the
   fight — by design (bullets own the extremes); the owner judges density on the preview.
2. **DEFER to PR-C (recommended):** any dedicated rain-streak system (elongated sprites /
   line-rain, a density boost beyond the fixed COUNT). That is the one genuinely new-draw,
   overdraw-priced item in the heaven — exactly the Blanks-class deferral PR-A used. If the
   Gate-2 montage says the rain reads thin, PR-C budgets it with its own §2 probe +
   on-device pass.

---

## 9. Decision defaults (resolved for the builder; two owner gates named)

1. **O-B1 — god-ray fairness cap:** ship `GODRAY_HEAVEN_SWELL 0.75` / `GODRAY_INTEN_CAP 1.0`,
   corridor probe (§6.3) as the merge-blocking authority. Owner may raise the swell only until
   the probe fails — the trade (the #1 holy carrier vs the parry margin) is theirs, the
   arithmetic isn't.
2. **O-B2 — the focal-lift magnitude** (§5's four constants): a real look change to the
   finale's poster — **owner playtest gate on the PR preview** + the named Fable Gate-2 frame
   "S3 boss pop on gold". Too low = the L219 failure; too high = the boss blooms into a second
   sun and the dark-cutout inversion dies. The spec's values are authored starts.
3. **Light-rain:** motes-only in PR-B; streaks/density PR-C (§8).
4. **Heaven ceiling covenant (identity-audit F-1a):** keep horizon `.744` — the T3 arena rows
   are ALREADY merge-blocking on any palette diff (shipped PR-A mechanism, heaven row added
   §10-T3), and this spec states the covenant: **no future pass may raise any heaven
   background hex above L .75; "more heavenly" spends god-ray/mote/sun-streak budget, never
   sky luminance.** (Re-authoring to ~.72 remains the fallback if the owner prefers margin
   over the exact authored gold.)
5. **Mirror floor + fever policy: carried from PR-A unchanged** (tier-0-only reflection
   disclosed; the player's light wins in BOTH arenas — a surge in the heaven is the player's
   rebellion against the verdict-light; no damping term).

---

## 10. TESTS + GO GATES (exact assertions)

### T2 — `tests/unmaskedarena.mjs` extensions
**Pure-node:**
- Schema completeness now loops ALL FOUR tables (`VOID/FLOOD/HEAVEN/GOLD_FLOOD_HEX`): each
  enumerates exactly `ARENA_ENV_KEYS` (a missing heaven field silently inherits the biome —
  the F3.4 leak, per-table now).
- Byte-identity at mix 0 (unchanged) + **fade 0 ⇒ zero writes** (`applyArenaSkin(env, 2, 0)`
  changes nothing).
- Mix 1 ⇒ VOID exact (unchanged — PR-A's contract holds). **Mix 2 ⇒ HEAVEN exact** from
  multiple dists (source-independence).
- **Seam continuity:** every field at mix `1 − 1e-4` vs `1 + 1e-4` within tolerance (no pop at
  S2→S3, by construction, proven).
- **Fade math:** at (2, 0.5) every scalar sits between biome and heaven values; monotone in fade.
- String-assert unchanged (tables + Color math only).
**Browser (one boot, extending the shipped recipe):**
- Pin S3 (`bossSetStage(3)`) → spawn → forceFight → surgeTap skip → poll:
  **`mix >= 1.99`** (the §0 false-green tightening), `kind === 'heaven'`,
  `voidSky === false`, `heavenRays > 0.9`, `propBandsHidden === true`, `skyDim === 0`,
  `bandDark === 0xa84167` (the latch persists through the heaven).
- **Organ×heaven conjunction** (the embertide-lesson point, in the same boot):
  `bossPartWorldPos('wingRootL'/'wingRootR')` resolve in-lane (`|x| ≤ 10.4`, `8 < y < 25`)
  with the heaven LIVE — the S3 dwell organs never moved (value-space proof, S3 edition).
- **The focal lift is live + reverts:** `lift.k > 0.99` and `lift.sclera !== 0x8f8365` in the
  heaven; after `bossReset()` → fresh S2 pin → `lift.k === 0` and `lift.sclera === 0x8f8365`
  (byte-identity of the lift OFF the heaven).
- **S2 regression:** the shipped S2 block unchanged and still asserts `mix` in [0.99, 1.01] +
  `voidSky === true` (the void window's new upper bound must NOT un-suppress the void).
- **Exhale** (via the new `__dd.bossFell()`): at settled heaven call it → poll: `fade`
  decreases while `mix` HOLDS ≥ 1.99 (never descends through the void — the §2 catch,
  asserted), then both reach 0/1-restored within ~4s; props + band + flags restored.
- **Teardown:** `bossReset()` from mid-heaven → next frame mix 0, fade 1, `heavenRays === 0`,
  voidSky false, props visible, band `0x8f0a3c` (hard snap stands).
- **THE FAIRNESS PROBE** (§6.3): settled-heaven screenshot corridor **p95 lum ≤ 0.75**.
- Coexist: the shipped EMBERTIDE/VOIDMAW block unchanged (mix 0 + skyDim disjointness).

### T3 — `tests/bulletcontrast.mjs`
One-line data change (the heaven `ARENA_CONTRAST` row, §1.3) — the shipped CP2-M2 loop then
auto-covers **every biome × heaven band merge** with the latched dark. Expected (re-derived
this session, the gate's own `lum()` — vs fog .732 / horizon .744):

| colour | L | fog | horizon |
|---|---|---|---|
| danger `0xff2b6a` | .363 | .369 direct PASS | .381 direct PASS |
| band-light default `0xffc6dc` | .830 | layered PASS | layered PASS |
| band-light Wastes `0xa98392` | .550 | .183 direct PASS | .194 direct PASS |
| band-mid default `0xff4f9a` | .478 | .255 direct PASS | .266 direct PASS |
| band-dark (latched `0xa84167`) | .352 | .381 direct PASS | .392 direct PASS |
| reflect-amber `0xffc23c` | .774 | **layered** PASS (direct .041) | **layered** PASS (direct .030) |
| reflected-cyan `0x66ddff` | .777 | layered PASS (.045) | layered PASS (.033) |

Zero new KNOWN_EXCEPTIONS (the F2 resolution: amber/cyan pass at this ceiling, which is the
whole point of .744). Merge-blocking on any future heaven-palette diff (the §9.4 covenant's
enforcement arm).

### T4 + suite
`gold-determinism.mjs` untouched-green (no RNG anywhere in PR-B; exhale state is render-side).
`boss.mjs`, `unmaskedorgans.mjs`, `unmaskedreckoning.mjs` (S3 fight logic untouched — env
only), `bossboot.mjs`, `run-all.mjs` green.

### Shots — `tools/arenashots.mjs` extension
Add frames per source: `unveil` (t≈0.5 of the S2→S3 beat) + `heaven` (S3 settled). Sources:
Sanctuary + Astral (shipped) + **AMBER WASTES (`dist ≈ 2250`) — MANDATORY** (identity-audit
F-4: the gold→gold worst case; the heaven's "somewhere else" must be carried by the cool
zenith + shafts + rain + blue sea). Named Fable Gate-2 frames: **"S3 boss pop on gold"** (the
poster, O-B2) · **"amber parry-identity on gold" + "amber inside a lit shaft"** (F-1c's feel
gate) · **"Wastes-source heaven ≠ desert at noon"** · "holy vs washed on tier 1/2" (rain-only
carriers) · the unveil motion ("light blooms FROM the boss" — headless-unprovable, Fable/owner
only).

---

## 11. Determinism + budget (the standing laws, checked)

- **RNG:** zero new draws on any `rnd` stream; `level.js` untouched; the lift/exhale/boost are
  pure per-frame math.
- **Draws/meshes:** ZERO new — rain reuses the mote pool; the swell reuses the god-ray pass;
  the lift rewrites existing material colors. The structural no-new-draws assert extends
  unchanged.
- **Overdraw:** no new additive surfaces; the halo/burst brighten but their screen coverage is
  unchanged; the god-ray pass is the same fullscreen pass at the same tier gate.
- **Per-frame cost:** +~27 lerps during the unveil (same as the crack), +1 snapshot copy ONLY
  during the 2.5s exhale, +4 material writes in the S3 heaven tick. Nothing at mix 0.

## 12. Residual risks, ranked

1. **Amber-vs-gold parry-feel metamerism (F-1c)** — the hue channel is dead in the heaven;
   outline+core carry it. Gate-passing but feel-unproven: the named HARD owner/Fable frame.
   Escape valves if it fails: the `light: 0xff9ec4` band override (passes, pre-derived) does
   NOT help amber (fixed role colour) — the real lever is Surge (everything parryable in the
   stage that fires most) + shaft corridor discipline. Judged, not assumed.
2. **The focal-lift magnitude (O-B2)** — the poster frame's look rides four TUNE constants;
   owner playtest gate. Fallback pre-authorized: sunGlow-to-the-bench (PR-C, one hex).
3. **God-ray-cap vs holy-read tension (O-B1)** — the probe may force the swell below "gallery
   of witnesses" impact; tier-0-only anyway. The probe is the authority; the owner owns the
   trade.
4. **Exhale feel** — a half-faded heaven could read muddy for ~1s; masked by slow-mo + FELLED
   + surge magenta. PR-C's authored exhale is the budgeted iteration; the mechanism (fade
   channel) is final, the curve is not.
5. **Rain thinness** (fixed COUNT × in-fight mote dim) — montage-judged; PR-C density
   increment pre-named (§8.2).
6. **Graphics-branch collision** — `postfx.js` (+preset, +boost export, +compose line),
   `main.js` (+1 line in the god-ray block), `environment.js` (+1 param, +1 conjunct): all
   named seams; flag the PR to the graphics stream per GRAPHICS-OVERHAUL protocol; the
   schema-completeness assert remains the collision insurance.
7. **Wastes-source heaven read (F-4)** — mandatory montage row; carried by
   zenith/shafts/rain/sea, judged not assumed.

## 13. BUILD ORDER (step-by-step)

1. **`js/arenaSkin.js`** — `HEAVEN_HEX` + `GOLD_FLOOD_HEX` (§1.1/1.2, incl. the fogFarColor
   catch), the heaven `ARENA_CONTRAST` row, `applyMix` split + the fade channel (§1.3).
2. **`js/boss.js`** — `bossArenaMix()` phase-keyed 0..2 + `bossArenaFade()` + exhale state
   with all four reset sites (§2); drive block: voidSky window, `game.bossHeavenRays`,
   `model.setArenaHeaven`, exhale decay (§3); `kick('arenaUnveil')` at the unveil;
   `debugFell()`; `bossDebugModelLift()`.
3. **`js/bossUnmasked.js`** — `setArenaHeaven` + the four guarded lift writes in the
   `stage3.visible` block + `SCLERA_BASE` capture + `debugArenaLift` export (§5).
4. **`js/postfx.js`** — `setGodRayBoost` + `GODRAY_HEAVEN_SWELL/INTEN_CAP` + the `:356`
   compose + the `arenaUnveil` preset (§3/§6).
5. **`js/environment.js`** — the 9th param + `applyArenaSkin(env, arenaMix, arenaFade)` + the
   prop-gate fade conjunct (§4).
6. **`js/main.js`** — thread `bossArenaFade()`; `setGodRayBoost(game.bossHeavenRays || 0)`;
   extend `__dd.bossArenaState` (+kind/fade/heavenRays/lift) + `__dd.bossFell` (§7).
7. **Tests** — extend `tests/unmaskedarena.mjs` (pure-node tables/seam/fade + browser heaven/
   lift/exhale/probe, §10-T2) + the `bulletcontrast.mjs` row (§10-T3); tighten every S3 mix
   assert to ≥ 1.99; run T4 + suite.
8. **`tools/arenashots.mjs`** — unveil/heaven frames + the Wastes source; generate the montage.
9. **Lesson file** `leapfrog/lessons/2026-07-11-<slug>.md` (THE RULE — new file, no L###) +
   Fable Gate-2 on the montage (the §10 named frames); owner judges the unveil motion, the
   S3 pop, the amber feel, and the exhale on the PR preview.

---

## VERDICT: **GO-WITH-FIXES**

PR-A's spine carries the heaven exactly as designed — the scalar mix extends to 0..2 with the
def untouched, the latch and prop gate stay correct for free, and the heaven needs NO band
mechanism at all (re-derived: every colour × every biome merge passes both heaven backgrounds
with the void's latched dark). The fixes folded in: the **exhale fade channel** (the mix-ease
as written in audit F7 would strobe backwards through the void — the one design-level catch of
this pass), the **voidSky upper bound** (without it the heaven silently inherits the void's
god-ray suppression and the #1 holy carrier never fires, all tests green), the **fogFarColor
ceiling** (an unauthored field one careless hex from the .75 cliff), the **≥1.99 test
tightening** (mix ≥ 0.99 can't tell a stuck void from a live heaven), and the **corridor
fairness probe** (F-1b's effective-background risk made merge-blocking with in-repo tooling).
The two genuinely open judgments — the focal-lift magnitude and the amber-on-gold parry feel —
are owner/Fable gates with pre-authorized fallbacks, not build blockers.
