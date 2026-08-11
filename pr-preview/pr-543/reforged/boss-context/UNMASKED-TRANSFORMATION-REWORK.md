# THE UNMASKED — TRANSFORMATION REWORK PLAN (S1→S2 "the crack" + S2→S3 "the unveiling")

**Why this doc exists.** Owner review (2026-07): boss 14's stage transformations "aren't
cinematic or impactful — I'm not even sure there IS one; I thought S1→S2 the eye cracks and
the 2nd-stage boss comes out, but I don't see any of that." Two high-effort Fable assessments
confirmed it: both transitions are real and wired into the live fight, but both are 2.0s
crossfades with **no phrasing** — the good machinery (fire-free hold, deferred name card, the
all-eyes snap rig, slow-mo punch) all fires at the END of a morph nobody can read.

**Verdicts:** S1→S2 = **2/10** · S2→S3 = **3/10**.

**The shared thesis both plans converge on:** *a transformation is a BEAT MAP, not an ease* —
a piecewise, pure-function-of-`k` choreography in the model + a beat table the harness reads for
camera/audio. Honor the boss's design law (`BUILD-BOSS-14` Part 6.2): **the stillness is the
point — ZERO camera hijack.** All violence is geometry + light; the harness contributes only
shakes ≤1.5, the existing slow-mo channel, and sound. The all-eyes-snap on arrival is "the
screenshot of the game" and must land on a §4 capture-safe hold.

**The model has EVOLVED past the original build brief:** the brief's Stage 2 was "the Ophanim"
(wheels of eyes); the owner replaced it with the SIX-WING SERAPH (`BOSS-DESIGN.md` §5d:1066,
"SERAPH, not Ophanim — owner direction 2026-07"). These plans target the seraph that is
actually in `bossUnmasked.js`, honoring the brief's *transformation intent* (crack open →
unfurl → all eyes snap; wings mantle full → core unveils).

---

## 0. THE SHARED SEAM — build this FIRST, as its own commit

Both transitions depend on one refactor. Landing it once, first, keeps the two choreographies
conflict-free (the one-file-per-lesson spirit applied to code).

**`js/bossUnmasked.js`**
- Replace `const TRANS_DUR = 2.0` (line 793) with per-kind durations:
  `const TRANS_DURS = { crack: 6.0, unveil: 4.8 }`.
- `tickBody` (line 882): advance `transT + dt / TRANS_DURS[transKind]`.
- Export a spec (keep `stageTransitionDur` as a legacy alias = `TRANS_DURS.crack` for boss.js's
  current read): `stageTransitionSpec(n)` → for `n===1` (crack) `{dur:6.0, revealAt:5.6, beats:[…]}`,
  for `n===2` (unveil) `{dur:4.8, revealAt:2.1, throwAt:1.6, beats:[…]}`.
- Also export a per-transition **beat table** `stageBeats` so the harness owns camera/audio and
  the model owns visuals (the existing contract split). Example entry:
  `{ t: 3.6, shake: 1.2, slowMo: 0.35, sfx: 'shatter' }`.

**`js/boss.js`**
- `beginStageBeat` (1087–1092): accept the target phase index (call site 3805 passes
  `phaseIdx+1`; intro path 2096 passes `debugStagePin-1`); read
  `model.stageTransitionSpec?.(n) ?? { dur: model.stageTransitionDur }`; store
  `stageBeatRevealAt`, `stageBeatThrowAt`, and per-beat fire flags.
  `attackTimer = max(attackTimer, spec.dur + STAGE_REVEAL_HOLD)`.
- Raise `STAGE_REVEAL_HOLD` 0.7 → **1.6** (only stage-transition bosses = UNMASKED reach this,
  so no roster blast radius; also satisfies §4's own "~1.6s hold" number).
- Add a **beat dispatcher** in the stageBeat block (2318–2329): fire `model.stageBeats` entries
  as `stageBeatT` crosses each `t` (shake / `game.slowMoTimer` / sfx). Both clocks advance by the
  same dt → no drift under slow-mo. Move the existing reveal punch (2320–2327) to trigger at
  `stageBeatRevealAt` instead of `stageBeatDur`.
- **Fix the reveal card name** (2324): `def.cards[phaseIdx]?.name || def.name` — the reveal now
  announces the real stage title ON the eye-snap (today `def.phases[]` has no `name`, so it shows
  the generic boss name; the real title fires 2s early at shield-break via `beginCard`).
- **Freeze the card/capture timer** during the beat: gate the decrement (~2615) on
  `stageBeatT < 0` (or credit `stageBeatDur + STAGE_REVEAL_HOLD` into the card timer at
  `beginCard`) so the cinematic never taxes the capture window.
- **Suppress the lance reticle** while `stageBeatT >= 0` (file-header CP2 note; lockLayer.js
  entrance-suppression precedent) — it currently sits dead-center of the payoff frame.

**Hard contract to preserve (both transitions):** `setStageMorph` / `setStage3` must stay PURE
FUNCTIONS OF `k` — the studio `morph` dial scrubs arbitrarily, and `setDebugStage`/the skip path
jump to endpoints. `k ∈ {0,1}` must remain byte-for-byte the shipped poses (add a headless
snapshot assertion of stage1/stage2/stage3 world matrices + material states at the endpoints).
The only stateful elements (shard fling, latched snaps) must fully reset from any `k` and from
`setDebugStage` — test by scrubbing the dial 0→1→0.5→0.

---

## 1. S1→S2 — "THE CRACK" (target 6.0s + 1.6s hold)

**Target experience — "the sun holds its breath, cracks, shatters, and something with wings
opens its eyes."** Camera never moves.

| Beat | Time | What happens |
|---|---|---|
| 0 · STILLING | 0.00–1.00 | Against the still-flying shield shards, the sun goes DEAD still — corona breathe stops & dims to embers, motes freeze, hood snaps to full wrath aperture, pupil-seed saccades dead-center & constricts to a pinpoint. Sub-bass swell. (Costs nothing; buys contrast.) |
| 1 · FIRST CRACK | 1.00–1.35 | One hero fissure snaps diagonally across the SCLERA itself — a dark jagged line on the white-hot eye, extending in stepped jolts; where it exits onto the black disc it inverts to a hot gold-white bleed. Micro-shake 0.35, glass-crack report. Eye light gutters −15%. |
| 2 · PROPAGATION | 1.35–2.90 | Three crack families spider out from the hero fissure's endpoints across the visible band, each birthing in a discrete jolt ~0.4s apart (tick of shake + click). Corona destabilizes (asymmetric flicker). Seed skitters. |
| 3 · STRAIN | 2.90–3.60 | The sun tries to hold: stage-1 rig swells 1.00→1.05 (inhale — anticipation), cracks flare HDR ×2.2, white light leaks from a backlight disc BEHIND the silhouette plane, hood rattles. Choir swells. |
| 4 · SHATTER | 3.60–4.00 | The burst frame. Backlight flares to the brightest frame of the fight; disc/eye/hood collapse to nothing in 0.25s INSIDE the flash; ~12 dark disc-shards fling radially in-plane, spinning, silhouetted against the light. Shake 1.2, 0.35s slow-mo tick, shatter boom. |
| 5 · UNFURL | 4.00–5.60 | Out of the dying light: a closed dark BUD (seraph, all wings folded near-vertical, scale 0.62). It unfurls upper→upmid→middle→lower ~0.18s apart, each easing to its shipped splay with a small overshoot-settle, rig grows to 1.0. Backlit — pure silhouette — and every eye SHUT (dark empty sockets). The blind wings ARE the dread. |
| 6 · ALL EYES OPEN | 5.60–6.00 | Payoff frame: in ~0.15s all ~20 eyes OPEN at once (pale sclerae, gold irises, catchlights flaring), the great eye un-squints, `allSnap()` locks every pupil dead-on the player. Existing punch lands HERE: shake 1.5, 0.9s slow-mo, "II — Wheels Within Wheels" card, milestone sting. |
| 7 · HOLD | 6.00–7.60 | 1.6s screenshot-safe hold: wings frozen mid-breath (snapK), fire held, card timer frozen, reticle suppressed. |

**Build plan — `js/bossUnmasked.js`:**
- **Beat-map `setStageMorph(k)`** (rewrite 751–765) as piecewise over named K-constants
  (`K_CRACK0=0.167, K_PROP=0.225, K_STRAIN=0.483, K_SHATTER=0.60, K_BUD=0.667, K_EYES=0.933`).
- **Re-author the crack so it is SEEN** (the heart of the fix):
  - *Hero sclera-fissure (new):* one AUTHORED polyline (not random — §3.6 asymmetric reveal-scar)
    from lower-left disc rim diagonally across the almond, exiting upper-right under the hood.
    Built as TWO co-located tapered quad strips — a **near-black opaque core** (MeshBasic
    `0x040302`, z≈1.40, in FRONT of the eye's front face ≈1.3) and a wider **additive gold
    underglow** (z≈1.36). Rendering physics the current build ignores: additive light is invisible
    on the HDR-white sclera, so OVER THE EYE the crack must be DARK; over the black disc the gold
    bleed carries it. ~2 draws.
  - *Re-seat the disc families:* rebuild `crackSeams` (133–179) as 3 birth-staged families rooted
    at the hero fissure's endpoints, angle-constrained INTO the visible band (avoid the bright
    segments landing behind the almond), z lifted to 0.2, and **INVERT the brightness taper** (hot
    where visible, currently hot where hidden). 3 meshes → independent births (draws are free).
    Per-family opacity `smooth(birth_k, birth_k+0.04, k)`; birth flash via `crackMat.color` scalar
    (toneMapped=false → >1 blooms) ×1→×2.2 across BEAT 3; all die at `K_SHATTER`.
- **Strain + collapse:** `stage1.scale` flat 1.0 until `K_STRAIN`, swell to 1.05 by `K_SHATTER`,
  then drop to 1e-4 by `K_SHATTER+0.04` (0.25s collapse hidden inside the flash) — replacing the
  leisurely 0.35–0.72 shrink. Hood rattle ±0.04 on `lidPivot.position.y`.
- **Shatter debris + backlight:**
  - *Shards:* clone the bossKit shatter grammar as ~12 (lowQ 8) **opaque near-black** flattened
    tetra wedges (overdraw-free), parented to `rig` (NOT stage1 — scales to 0; NOT `group` —
    law 9), flung radially in the disc plane with spin, scale-decay ~0.9s, hidden at end. Use a
    SEEDED stream for directions/spins (kit uses `Math.random` — don't, here). Optional gold
    fringe as LineSegments (§2-exempt).
  - *Backlight:* ONE additive disc at z≈−1.2 (behind every wing; wings at z −0.2…−0.65), radius
    ≈DISC_R, reusing the corona's vertex-color radial falloff (bright core → black edge → no hard
    rim). Opacity 0 → dim through BEAT 3 → full flash at `K_SHATTER` → 0 by k 0.90. This is the
    sanctioned "backlight disc strictly behind the silhouette plane" pattern (§2).
- **The unfurl:** add per-shoulder `foldZ` (rotation toward vertical) + `foldOrder` to the
  `shoulders` entries (470–485). `unfurlK = smooth(K_BUD, K_EYES, k)`; shoulder loop (955–960):
  `rotation.z = lerp(foldZ_signed, baseTarget, wingEase(unfurlK, foldOrder))` + a +6%
  overshoot-settle; breath/flare terms × unfurlK. `stage2.scale = 0.62 + 0.38·unfurlK`;
  `stage2.visible` from `k > K_SHATTER` (not 0.005 — kills the current early z-fight poke). At
  k=1, unfurlK=1 → byte-identical shipped pose.
- **Eyes shut → ALL EYES OPEN:** while `k < K_EYES` hide `scleraMesh/irisMesh/catchMesh`, all
  `pupils[]`, `greatIris/greatPupil/greatCatch`; KEEP `socketMesh/greatSocket` (dark empty
  sockets — the blind wings); squint `greatEye.scale.y` to 0.12·GH. At `k ≥ K_EYES` flip all
  visible, restore scales, rely on the completion `allSnap()` (885). Merged meshes → two
  visibility flips = the cheapest big beat in the plan.

**Budget audit (§2):** worst frame is BEAT 4 — backlight (large additive #1) + corona (force
`coronaMat.color`→0 by `K_SHATTER` so it's dead before the flash peaks) + dying crack quads +
shield gone (its 0.7s fling ended ~3s earlier). ≤2 large additive at every instant, sequenced
never stacked. Shards opaque, LineSegments exempt. New geometry ≈ +1–1.5k tris on the 30k
tier-5 budget. **One 60fps flag:** the backlight must stay a bounded disc (~radius 4.7, well
under half the frame), never a screen-filling plane, and flare ~0.4s only.

---

## 2. S2→S3 — "THE UNVEILING" (target 4.8s + 0.7s hold)

**Target experience — "The seraph closes its eye. What opens is not an eye."** Built on
REVERSAL: stage 2's whole identity is *watching*, so the transformation begins with the
unthinkable — **it stops watching you.** Camera never moves.

| Beat | Time | What happens |
|---|---|---|
| 0 · SHATTER (exists) | 0.0 | Shield bursts, shake 1.6, white sparks — the wound that starts it. |
| 1 · GATHER | 0.0–1.0 | Every peripheral pupil abandons the player and converges INWARD on the core (the field of gazes collapses to a point). Wings fold slightly IN (anticipation). Great pupil constricts; catchlights dim. Low rumble. |
| 2 · EYE CLOSES | 1.0–1.6 | The great eye SHUTS — sclera/iris/pupil squash to a dark seam; catchlight dies. ~0.3s the center of the final boss is dark and still. Optional letterbox in. |
| 3 · THE THROW | 1.6–2.1 | Wings THROW open in ~0.45s — folded → 1.3× overshoot past final span (upper pair ~+0.6 rad total, 4× the current entire mantle, in ¼ the time). Camera kick 0.8, wing-boom. Halo KINDLES behind the silhouette (flash hot → settle) — backlight for the throw. |
| 4 · IGNITION | 2.1–2.5 | The shut eye-line SPLITS: starburst SHOOTS outward (rays 15%→112% overshoot in ~0.35s, HDR flash ×2.6 decaying), star-eye pops in at 1.35× & settles, gold particle burst. **Reveal punch HERE:** shake 1.5, 0.9s slow-mo STARTS at ignition (dilates the rays mid-flight — the money frame), card "WHAT WORE THE SKY — Every Verdict at Once", `allSnap(2.6)` — every wing eye snaps from core back to YOU. |
| 5 · HELD STARE | 2.5–4.8 (+0.7) | Wings settle overshoot → new resting mantle (wider than stage 2 ever stood). Halo breathes 0.7; rays settle to their pulse; every eye + star-eye locked, catchlights flared. The screenshot of the game: full-span wings, gold starburst, halo, twenty locked eyes — capture-safe. |

**Build plan — `js/bossUnmasked.js`:** rewrite `setStage3(k3)` (773–783) as authored envelopes,
all pure functions of `k3`, no RNG (geometry untouched):
```
const fold    = smooth(0.02, 0.18, k3);   // GATHER: wings fold in
const closeK  = smooth(0.16, 0.32, k3);   // the great eye shuts
const throwK  = smooth(0.33, 0.44, k3);   // THE THROW
const igniteK = smooth(0.44, 0.52, k3);   // IGNITION
const settleK = smooth(0.55, 0.88, k3);   // overshoot decays
```
- **Mantle envelope** (module `mantleK`, consumed by tickBody):
  `mantleK = -0.35*fold + 1.65*throwK - 0.30*settleK` → 0 at k3=0 (stage 2 byte-identical), peaks
  1.30 at the throw, exactly 1.00 at k3=1. tickBody line 959: `+ s.flareZ * 0.34 * mantleK`
  (MANTLE_MAX 0.24 → 0.34). `setDebugStage(3)` → `setStage3(1)` → `mantleK=1` automatically.
- **Great-eye close:** store authored `focalParts` scales (626–641) at build; drive
  `scale.y = baseY * (1 - 0.94*closeK)`; `greatCatch.visible = closeK<0.6`; replace the 782 swap
  with `e.visible = k3 < 0.44` (by then the eye is a 6%-height dark seam → no pop; the split reads
  as the seam bursting).
- **Starburst ignition:** `burstMat.opacity = smooth(0.44,0.50,k3)*0.95`;
  `starPivot.scale = 0.15 + 0.97*igniteK + 0.12*igniteK*(1-settleK)` (shoot to 1.12, settle ~1.0 —
  verify exactly 1.0 at k3=1); flash `burstFlash = igniteK*(1-smooth(0.52,0.66,k3))*1.6` folded
  into the tick's `burstMat.color` multiplier (1003): `pulse + burstFlash` (HDR ×~2.5, toneMapped
  off → blooms ~0.6s, decays). **Raise the settled ray presence** so S3's signature survives 30m:
  bake ray base width 0.11→0.16 and settled pulse floor 0.85→1.0 (the one steady-state brightness
  change; judge on preview).
- **Halo kindle:** `halo3Mat.opacity = smooth(0.34,0.42,k3)*0.7*(1 + 0.9*(throwK - settleK*0.9))`
  — snaps in behind the throw (~1.2 effective), settles to 0.7. z −0.9, behind the silhouette
  plane — lawful backlight.
- **Kill the group inflate** (drop the 777 `stage3.scale` ramp; per-element pops replace it). Add
  a star-eye pop: `×(1 + 0.35*(igniteK - smooth(0.5,0.62,k3)))` on starEye/iris/pupil/catch.
- **Gaze converge (GATHER):** `convergeK = fold*(1 - smooth(0.30,0.40,k3))`. In the pupil loop
  (977–985): `tgx = mix(gazeX + bias*(1-snapK), clamp(-u.base.x*0.5,-1,1), convergeK)` (+ y); great
  pupil `gk *= (1 - 0.5*convergeK)`. Apply AFTER the snap mix so converge wins over any live
  reckoning snap.
- **The snap:** fire `allSnap(2.6)` ONCE when k3 crosses 0.46 (latched flag inside the unveil
  transition, reset on `transKind` set); make the completion snap at 885 conditional on
  `done === 'crack'` so the unveil doesn't re-trigger a weaker 0.8s snap over the held stare.

**Harness — `js/boss.js`:** at `stageBeatT >= stageBeatThrowAt` fire once: `shake 0.8`,
`sfx.phase(true,2)`. Move the reveal block to `stageBeatRevealAt` (shake 1.5, slowMo 0.9 — now
dilating the ignition, not the aftermath) + two gold `burst()` sprays at boss center (the
breakShield idiom — transient, zero sustained overdraw). Card name fix (see §0). Optional
`ui.letterbox?.(true/false)` around the fire-free window (EMBERTIDE crush idiom; zero render cost).

**Budget:** no new additive geometry — steady-state stage-3 additive load unchanged (starburst +
halo, shield down during the beat → within the ~2-large-volume cap). The "flood of light" is HDR
color multipliers on EXISTING materials + transient particles + bloom.

**Eye-field drift constraint:** the ~8 elbow eyes are merged static meshes that DON'T ride the
wing pivots, so the held mantle is capped (~0.34 rad); the 6 curated watcher eyes (517–535) are
wing-independent and unaffected. The 1.3× overshoot's larger transient drift is masked by the
ignition flash + slow-mo at that exact instant — but this is what the PR preview must judge; if
feathers visibly slide off eyes, drop overshoot to 1.15 before dropping MANTLE_MAX.

---

## 3. TESTS (`tests/boss.mjs`)
- Existing survive: the `z3 > z2 + 0.1` mantle check (passes with MANTLE_MAX 0.34) and the
  endpoint visibility checks.
- Add (S2→S3): mid-unveil k3=0.30 → focal eye visible but scale.y shrunk >50%; k3=0.48 → focal
  hidden, burst opacity >0.5, upper-wing rotation exceeds its k3=1 value (overshoot proof); k3=1
  → mantleK exactly 1, burst/halo at settled values, `setDebugStage(3)` state identical to a
  completed transition.
- Add (both): endpoint byte-identity snapshot assertion (k∈{0,1} world matrices + material states
  unchanged vs shipped).

## 4. RISKS
- **Determinism (the `crnd` trap, 146–150):** all new geometry (hero fissure jitter, shard
  dirs/spins) takes NEW private `mulberry32` seeds — never the main `rnd` stream, or the stage-2
  pupil biases / scar / seraph silently move. Re-authoring the existing `crnd` cracks is safe
  (`crnd` feeds nothing else). All animation envelopes are pure functions of `transT` → zero new
  build-time RNG consumption.
- **Scrub/skip statefulness** is the likeliest bug class — shard state + every visibility flip +
  latched snaps must fully reset from any `k` and from `setDebugStage` (S2→S3 skip path too).
- **Reckoning interplay:** relics are phase-gated `[1]` → reckoning can't fire during the unveil;
  same-frame `allSnap` is harmless (`snapT` is max-based). Converge-over-snap priority handles the
  visual edge.
- **Pacing:** ~7.6s (S1→S2) / ~5.5s (S2→S3) fire-free is apex-sanctioned (the def's own rhythm
  doc calls the finale's grandeur stillness) but it's the OWNER'S call on the preview — the beat
  map makes it trivial to compress (shrink the middle beats first, never the stilling/gather or
  the hold).
- **bossgate G7** counts large additive volumes by bounding sphere — the resting-invisible
  backlight disc may need `visible=false` at opacity 0 (or a sanction note) to pass.

## 5. BUILD ORDER
1. **The shared seam (§0)** — its own commit; even with today's visuals it adds phrasing.
2. **S1→S2 crack re-author (§1 crack block)** — the owner's literal complaint; judge at studio
   dial k ≈ 0.2 / 0.35 / 0.55.
3. **S1→S2 strain + shatter + backlight** — judge k ≈ 0.58–0.65 + the fling live.
4. **S1→S2 unfurl + eyes-shut/eyes-open + snap** — judge k ≈ 0.70–1.0.
5. **S2→S3 choreography (§2)** — envelopes + mantle + close/ignite + harness beats.

Each step is studio-verifiable via the `morph` dial and shippable alone.

**Verify:** `node tests/boss.mjs`, `tricount`, `tiershots` at the S1→S2 BEAT-4 frame + the S2→S3
climax frame, `bossgate unmasked`, `bossstudio.mjs` crops at the beat midpoints, `run-all`
(roster inertness), then the **PR preview for motion/feel** (the repo's law: the human judges
feel). Land a `leapfrog/lessons/` file per THE RULE — the reusable pattern is *"a transformation
is a beat map, not an ease: pure-function-of-k piecewise phrasing + a harness beat table, with
additive volumes sequenced, never stacked."*

---

## KEY FILE ANCHORS
- `js/bossUnmasked.js`: `setStageMorph` 751–765 · `setStage3` 773–783 · mantle 955–960 ·
  `TRANS_DUR` 793 · transition tick 881–886 · crack geo 133–179 · shoulders 470–485 · export 1016
- `js/boss.js`: `beginStageBeat` 1087–1092 · beat update 2301–2329 · breakShield 3780–3826 ·
  reckoning 4977–5006 · card-timer decrement ~2615
- `js/bossDefs.js`: def 1716–1836 (phases 1786–1790, cards 1793–1797)
- `tests/boss.mjs`: 439–468
