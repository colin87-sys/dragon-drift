# Dragon Drift — Dragon Surge Premium Overhaul · **SUNBREAK**

**Target: rebuild Dragon Surge — the player's signature power moment — from a magenta screen-wash +
a two-cylinder beam into an AAA transformation-with-payoff** that reads like a God of War rage or a
Hoyoverse burst, inside the hard constraints: **vanilla Three.js r160, no build step, 100% procedural
(zero new asset files), additive/alpha sprites via `DataTexture`, ≤150 visible particles, ≤8 added
draw calls for the whole beam, 60fps on weak mobile, deterministic seeded jitter (no `Math.random`),
and it must coexist with the shipped roster.**

> **Single source of truth for the Surge overhaul.** Governed like [`GRAPHICS-OVERHAUL.md`](./GRAPHICS-OVERHAUL.md)
> / [`UI-PREMIUM-OVERHAUL.md`](./UI-PREMIUM-OVERHAUL.md): the **Fable Quality-Gate protocol** (Gate 0
> kickoff → Gate 1 pre-build → Gate 2 pre-merge → Gate 3 phase review; verdicts in the Gate Log at the
> bottom), lessons as new `leapfrog/lessons/<date>-surge-…` files (one file per lesson — never append
> here), **one initiative per PR**, and **coexist → prove on the hero → migrate; never break the shipped
> roster.** No WebGL in CI: headless asserts + `tools/surgeshot.mjs` are the machine checks; the **owner
> judges motion/feel on the PR preview.** Built to the doctrine in [`AAA-PIPELINE.md`](./AAA-PIPELINE.md)
> (value-structure law, cheap-tell registry, three-judge split).

Inputs synthesized here: the **art director's brief** (codename SUNBREAK, 6 pillars, dual beat
timelines, 15 targets), a **file:line map of the current system**, and **four research lanes** (AAA
ultimates · gacha cut-ins · beam-weapon VFX craft · screen-space juice) — distilled in the companion
[`DRAGON-SURGE-RESEARCH.md`](./DRAGON-SURGE-RESEARCH.md). This document is self-sufficient; read the
digest for sourced tables and the provenance caveat.

---

## A. North star — the **SUNBREAK** design language

> **SUNBREAK: the sky dims and the dragon becomes the light source.**
> A Surge is a **transformation with a payoff**, not a filter. For its duration the game inverts its
> lighting relationship: **the world steps down one value (desaturate + darken toward the dragon's own
> shadow-hue), and the DRAGON ignites in a strict anatomical sequence** — eyes → spine → wing-bones →
> membrane rim — until it is the brightest, most saturated, most in-focus thing in the frame. The combat
> ultimate is the game's single most authored moment: **charge → held-breath → release**, with time and
> camera as FX layers. Every hero element — dragon, muzzle, beam, impact — obeys one law: a near-white
> **CORE** → a per-dragon-hue **BLOOM** → a **DARK** field.

**THE SIGNATURE MOMENT (the frame we build toward — the box-art frame):** *the last instant of ultimate
charge* — world at ~25% time-scale and stepped down, the dragon rim-lit entirely by its own gathering
muzzle-orb, energy streaks flowing **into** the mouth against a slow camera push-in — **held ~250ms of
near-silence** before the beam erases the frame. **If a screenshot of that beat doesn't look like key
art, SUNBREAK has failed.**

---

## B. Current-state diagnosis — what's cheap, and why (file:line)

The whole live system is driven by one boolean, `game.feverActive` (`gameState.js:22`), mirrored to
`player.feverActive` (`player.js:225`). The ambient visual transform fires whenever `feverActive` is
true. **`feverActive` has THREE rising edges** (corrected by the feasibility audit — §M.1-6): (1) the
**cruise auto-trigger** on the 8th ring thread in open flight (`collision.js:258` — its own
`juiceEvent('surgeStart')` + `emit('surge')`, fires every run, mid-cruise, dozens of times/session);
(2) the **boss surge tap** `activateSurge()` (`boss.js:3920`), which sets `feverActive` **and** kicks the
beam cinematic (`surgeSeq`, `boss.js:3944`) — this is the only edge that fires the ultimate; (3) the
**boss-kill carry-over** (`boss.js:1986`) into the grace band. Fever is **hit-cancellable instantly**
(`collision.js:351,364`) and **refreshed +1.2s per ring** (`collision.js:249`) — so the beat clocks in
§D key off *remaining* `feverTimer`, not elapsed time (§M.1-5). The `?debug=fever` path (`main.js:1665`)
forces it for capture.

| # | The tell (owner-visible) | Where it lives | The SUNBREAK law that kills it |
|---|---|---|---|
| 1 | **Magenta screen-WASH** — the #1 fix | `postfx.js:97` default `[0.10,0.03,0.08]`, applied `:429-453`; sky `feverMix` `environment.js:3292-3301` | A wash **raises** the world's luminance toward the core, destroying the 5:1–10:1 CORE:DARK contrast that makes a subject read as "the brightest thing." **Replace with world-SUPPRESSION** (desaturate + exposure-dip + vignette, tinted to the dragon's *dark-hue band*, not grey). §C.2 |
| 2 | **Whole dragon lights on one frame** | `surgeMix` ramp `dragon.js:1636`, all emissive writes keyed off it in one block `:1641-1841` | Transformation must **cascade** through the anatomy over ~340ms, staggered eyes→spine→wing-bones→rim. Simultaneous = toy; sequenced = AAA. §C.3 |
| 3 | **Flat always-on glow for 8s** | wing/spine/rim held at `surgeMix` target `dragon.js:1641-1822` | An 8s constant-max state goes invisible in ~2s. Structure it: loud ignition → **breathing sustain with 2–4 seeded non-metronome flares** → **felt decay**. §D.1 |
| 4 | **Beam = two solid cylinders (onion ring)** | build `boss.js:1391-1398` (`CylinderGeometry` white core r0.22 + magenta glow r0.75, additive) | A soft beam is an **alpha falloff with 3 value bands painted across a ribbon's width**, not nested solid meshes (which ring). §E |
| 5 | **Metronome beam wobble** | single `Math.sin` length wobble `boss.js:1459-1460` | Wobble = **sum of ≥2 incommensurate sines + seeded phase per layer.** §E.3 |
| 6 | **Beam pops in full-length, 0.55s, dies uniformly** | `BEAM_TIME=0.55` `boss.js:1157`, scale-to-length `:1459` | Beam **extends** over ~110ms, **flows** longitudinally, and dies **core-LAST**. §E.3 |
| 7 | **Ultimate uses only `shake(1.4)`** | `strikeSurge` `boss.js:1487` | Time and camera are FX layers: slow-mo into the cast, **held-breath APEX**, hitstop + FOV punch on release, trauma² shake. §F |
| 8 | **Charge is a swelling orb with no direction** | `muzzleOrb` `boss.js:1401-1404,1431-1442` | Charge = energy **converging inward**. Direction is the signal — convergence = charge, eruption = release, **never both at once**. §E.2 |
| 9 | **CHARGE/BEAM are symmetric (~0.5s/0.55s)** | `CHARGE_TIME 0.5` / `BEAM_TIME 0.55` `boss.js` | Asymmetric anticipation: long escalating inward GATHER → a beat of withheld silence → a release that out-brightens everything the charge showed. §D.2 |

**What already works and is PRESERVED:** the per-dragon palette hooks (`feverWing`/`feverEye`/`feverWash`/
`surgeHi`/`surgeMotes` in `dragons.js`), the Tempest's arc-crown storm circuit (`dragon.js:1659-1750`) as
the model for a per-dragon signature accent, the fire-dragon warm override (`setFeverWarm`
`environment.js:66`), the biome ember override (`biomes.js:483-485`), the batched spark pool + 8-sprite
`shocks[]` ring pool in `particles.js`, and the existing juice machinery (hitstop, `timeScale`, camera
`kick()` table, FOV control, CA, vignette, bloom-with-no-cream, god-rays).

---

## C. The universal grammar (the shared skeleton — build ONCE, all dragons inherit)

### C.1 The three-band value law (the one law under everything)
Every hero element — dragon body, muzzle, beam shaft, impact — carries **CORE → BLOOM → DARK**:
```
CORE   near-white, L 92–99, sat < 15%   ← CONSTANT across the whole roster; carries the brightness
BLOOM  the per-dragon HUE, L 55–75, sat 65–90%   ← the ONLY per-dragon knob; carries the colour
DARK   the hue crushed to shadow, L 8–20, sat 20–40%   ← never neutral grey
```
**The core carries brightness; the bloom carries hue.** Never blow the core past the tonemap knee into a
hueless white smear, and never tint the core (a magenta core blooms muddy and trips the no-cream law).
CORE:DARK luminance ratio must stay **≥ 5:1**.

### C.2 World-suppression, not screen-wash (**the single biggest fix**)
Delete the magenta additive wash. In its place, on Surge, drive a screen-space grade:
**saturation ×0.6 · exposure −0.4 EV · vignette +0.14**, with the darkening **tinted toward the active
dragon's DARK band** (`surgeDark`, §H), not grey. Ramp in over the ignition/GATHER, hold through sustain/
APEX, release over decay/aftermath. The dragon becomes the brightest object because **the world stepped
down**, not because we added colour. This is the 3D equivalent of a gacha cut-in: world recedes, subject
dominates, co-timed. (Reuse `postfx.js` `setFeverTint` plumbing — repurpose it from an additive tint to a
suppression grade; keep the fire-dragon and heaven/gold overrides.)

### C.3 The anatomical ignition cascade (transformation, not tint)
On Surge rising edge, ignite the dragon's own emissive in staggered stages (uneven spacing — not
100/100/100 — to dodge the metronome tell). Drive from `surgeAnimT` (`dragon.js:1608`, already armed on
the rising edge) as a **staged** envelope, not a single blend:

| Stage | t (ms) | Channel (existing hook) |
|---|---|---|
| Eyes | 0 → 120 | `eyeMat.emissive` → `feverEye` (`dragon.js:1828`) |
| Spine front (nose→tail) | 120 → 400 | `spineFlareMats` toward `surgeHi` (`dragon.js:1779-1802`) — travel it, don't flat-lerp |
| Wing-bones (root→tip) | 250 → 620 | wing glow/`feverWing` (`dragon.js:1641-1648`) |
| Membrane rim + wingtip trails | 400 → 900 | fresnel rim (`dragon.js:1803-1822`) + wingtip trails (`dragon.js:1856-1874`) |

Cost is ~0 draw calls — it's emissive ramps on the dragon's own mesh. **The world grade (§C.2) ramps
AFTER the dragon ignites** — dragon leads, world follows (measurable: §I-6).

### C.4 Determinism & the cheap-tell registry
All jitter — flare cadence, shake, spark directions, wobble phase — from **`mulberry32` / index-hash**,
never `Math.random`; Surge-off frames stay byte-identical to the shipped roster. Every element is checked
against the AAA-PIPELINE registry: no flat tape, no LED-strip always-on, no onion rings, no white smear,
no metronome, no chrome outline. Photosensitivity caps live in the module, not the call site (§G).

---

## D. The two beat timelines (final, reconciled numbers)

### D.1 Ambient / sustain Surge (~8s, `feverDuration`)

| Beat | Window | What happens |
|---|---|---|
| **PRIME** | −0.4 → 0s | Last gauge pip fills: the dragon's hint-glow points **flicker-stutter 2–3× (seeded)**; audio pre-swell. Told on the body, not just the HUD. |
| **IGNITION** | 0 → 0.9s | Anatomical cascade (§C.3) + one `surgeStart` camera kick (trauma 0.6) + FOV snap +4° + timeScale dip 1.0→0.6→1.0 over ~250ms. One **radial mote eruption** (ambient erupts; combat converges). World grade (§C.2) ramps in *after* the dragon lights. |
| **SUSTAIN** | 0.9 → 6.5s | Breathing glow: **2–4 flare-ripples** travel eyes→rim, cadence ~1.4s **±200ms seeded jitter** (no two gaps within 10%). Constant micro rotational shake trauma≈0.05, CA +0.005 (Nuclear-Throne "felt not seen"). Motes shed in the existing pool; sky wash/aurora are the *halo*, the dragon is the *core*. |
| **DECAY** | 6.5 → 8s | Reverse cascade: rim dims first → wings → spine retreats tail→nose → **eye holds last (final 300ms)**. World grade lifts with a slight overshoot-and-settle. **HUD gauge drain and body decay must agree — the HUD is never ahead of the body** (`dragonBond.js` `setSurge` ↔ `dragon.js`; cf. `ec9e88e` gauntlet-follow fix). |

### D.2 Combat ultimate (~3.4s vs today's ~1.05s)

| Beat | Window | What happens |
|---|---|---|
| **CALL** | 0 → 0.15s | Trigger accepted: one-frame rim-flash, **audio ducks −10 dB**, `timeScale` begins easing 1.0→0.35, ~250ms i-frames granted (activation always feels authoritative). |
| **GATHER** | 0.15 → 1.3s | Muzzle orb grows through 3 value stages (dark gas → hue bloom → white core). **16–24 sprites CONVERGE into the mouth** on a shrinking radius, brightening the ignition cascade as they arrive. Camera push-in + **FOV tighten −5°**, exposure dips −0.4 EV, world darkens toward `surgeDark`. Shake ramps trauma 0.15→0.5. Escalation stepped in ~3 seeded sub-swells (not linear). Sub-bass rumble swells. |
| **APEX (held breath)** | 1.3 → 1.55s | **~250ms** — convergence STOPS, timeScale floor **0.25**, audio near-silence (~180ms gap), orb at max compression, world grade at max suppression, dragon emissive at CORE peak. **Freeze the flap on the most silhouette-legible pose** (wings high/spread) with only a ±4% L breathing pulse. **This is the signature frame** (§A). *This is our "superflash" — done with time-dilation, not a hard freeze.* |
| **RELEASE** | 1.55 → 1.63s | Beam fires. **Hitstop 70–90ms** on first contact — **freeze the dragon + beam origin, keep particles/camera/beam moving** (GoW). timeScale snaps back to **1.05** (≤50ms) then settles to 1.0 (~250ms decaying spring). **FOV punch +7°** (≤80ms out, ~300ms back). One capped full-screen flash (§G). Muzzle recoil; the ignition cascade slams to maximum in one beat. |
| **BEAM & IMPACT** | 1.63 → 2.6s | Shaft with flowing core (§E). Impact = contact core + **2 shock rings** + **24–40 seeded spark clusters** + **glass-break shield-shatter** when `breakShield()` fires (`boss.js:3950` — the 999-shield burst earns its own read). Bloom pulse (+strength), CA spike (+0.015), vignette pulse, optional RELEASE-only radial blur (§F/§G). god-rays swell along the beam axis. |
| **AFTERMATH** | 2.6 → 3.4s | Beam collapses **core-LAST** (§E.3). Lingering scorch-glow on the boss fades ~1s, drifting embers, muzzle heat-shimmer. Camera settles with **one soft over-correction**. The dragon exhales — glow drops to sustain level (not zero) if ambient Surge continues; else the DECAY cascade (§D.1). |

---

## E. The combat beam — an anatomy, not a cylinder

### E.1 The shaft = a billboarded **ribbon** with all 3 bands painted across its width
Replace the two `CylinderGeometry` meshes (`boss.js:1391-1398`) with a camera-facing ribbon (2-tri strip
muzzle→boss) whose `ShaderMaterial` paints the value stack across the **width (u)**: `u≈0.5` → white core
(≤ tonemap knee, thin), mid-u → saturated per-dragon **bloom** hue, edges → **dark** wrap → α0. Scroll a
streak-noise `DataTexture` along the **length (v)** for flow. **One shader, 1 draw call, no tube
seam/end-cap, reads at every camera angle.** A crossed 2nd ribbon (outer turbulent wrap, vertex-displaced,
1 DC) covers the down-axis flat case and adds the boiling dark frame.

### E.2 Muzzle & impact — reuse existing pools
- **Muzzle** (3–4 layers via the batched additive sprite pool): white core flash + 2–3 hue bloom petals +
  dark gather-socket + heat-shimmer. During GATHER the mouth glow is the dragon's hue; **it snaps toward
  white at the APEX→RELEASE lock** (Monster Hunter tell).
- **Impact** (4–5 layers): route **entirely through `particles.js`** — the batched **SPARK pool** (1 DC
  for contact core + 24–40 sparks + 10–16 shield shards + drifting embers + scorch) and the **8-sprite
  `shocks[]` double-ring pool** (primary ring 0→full 180–260ms life ~0.6s; secondary lags ~60ms, wider,
  life 300–400ms; a 3rd ring only on shield-shatter).

### E.3 Beam life
- **Birth:** the core tip **extends** muzzle→impact over **~110ms ease-out with a ~5% tip overshoot**;
  bloom lags core ~16ms (lag = depth); outer wrap fills last (~150ms). Never instant-full-length.
- **Sustain wobble:** **sum of ≥2 incommensurate sines + seeded phase per layer** — core flicker 11–14 Hz,
  bloom breathe 3–5 Hz + ~7 Hz, outer sway 1.5–2.5 Hz. A discrete **surge-pulse** traverses muzzle→impact
  every ~0.4s (phase-offset from all wobbles). No layer shares or is a clean multiple of another.
- **Death:** **core-LAST collapse** — outer fades (~120ms) → bloom (~80ms) → core narrows to a bright
  pinch and pops (~60–80ms). ~260ms total, inside AFTERMATH.

### E.4 Draw-call budget
> ⚠ **Audit correction (§M.1-2/3):** the "unified additive sprite batch (1 DC)" is **opt-in and OFF by
> default** — on the shipped path it's 1 DC *per sprite*. This budget holds only if `particleBatch` is
> flipped on (owner call) OR the counts are cut for the per-sprite path; `shocks[]` is 1 DC *per live
> ring*; the muzzle needs dedicated persistent sprites (+3–4 DC). And the new impact must **replace** the
> legacy `strikeSurge`/`breakShield` bursts (~88 sprites) against the shared 150 cap, not add to them.

Under the batched path: core ribbon (1) + outer-wrap ribbon (1) + unified additive sprite batch /
muzzle+impact points (1) + shock-ring pool (1) = **4 baseline; ≤7 with a crossed 3rd core ribbon, a
dedicated over-bright impact core, and heat-shimmer — under the ceiling of 8.** Shaft particles = **0**
(meshes). Peak concurrent particles ≈ **82** (≤150) *only if the new load replaces the legacy bursts*.
Zero per-frame allocations in the hot path (needs a no-clone `gatherPulse` variant, §M.1-2).

---

## F. Juice & game-feel tuning sheet (the implementer's starting dials)

The two devices are **distinct — do not collapse them**: the **APEX held-breath is time-dilation** (the
cinematic "look at it" pause, our superflash); the **RELEASE hitstop is a short hard freeze** (punctuation,
70–90ms). See the full master table in [`DRAGON-SURGE-RESEARCH.md`](./DRAGON-SURGE-RESEARCH.md) §Lane D.

> ⚠ **Audit correction (§M.1-1/8):** `timeScale` is **owned by the slow-mo system** — the surge sequencer
> must run on **rawDt** (else the ultimate is ~2× too long), take `timeScale` through a **single conductor
> with priority** over cine-slow/lethal-save, **zero `slowMoTimer` before `hitstop()`** at RELEASE, and
> bypass `hitstopCooldownMs`. The GoW "freeze actor, keep particles/camera/beam moving" needs rawDt
> plumbed to those call sites during hitstop. The trauma²-rotational shake is **new work** (current shake
> is translational `Math.random`).

Headlines:

- **timeScale:** ease-in 1.0→0.35 over GATHER (easeInOutCubic) → floor **0.25** held ~250ms at APEX →
  snap to **1.05** in ≤50ms at RELEASE → settle 1.0 over ~250ms (decaying spring).
- **Hitstop:** **70–90ms** first contact; freeze actor+beam origin, keep particles/camera moving.
- **FOV:** tighten **−5°** over GATHER; punch **+7°** in ≤80ms at RELEASE; settle ~300–600ms.
- **Screenshake:** Eiserloh `shake = trauma²`, trauma∈[0,1], decay ~1.2/s; **rotational-dominant, ≤~1°**;
  per-axis = `maxVal · trauma² · noise(seed, time·freq)` (seeded Perlin — deterministic + non-strobing).
  Ramp 0.15→0.5 through GATHER, spike **1.0** at RELEASE.
- **Post-FX pulse stack** (shared envelope: ~80–120ms attack synced to RELEASE, ~500–600ms easeOut
  release): bloom **+strength only** (never lower threshold — no-cream law `postfx.js:445-453`), CA
  **+0.015** (fever floor is +0.013 — the spike must exceed it), vignette **+0.14**, exposure dip −0.4 EV
  at APEX snapping back on release.
- **Radial blur:** conditional — single-pass **6–8 tap half-res, RELEASE-only ~250ms**, on the FOV-punch
  envelope, **off under the accessibility toggle, on a perf gate** (cut if it can't hold 60fps on the
  weakest target; FOV+CA+shake cover ~85–90% without it).
- **Audio (procedural synth, via the event bus — renderer emits, `sfx` subscribes):** duck the bed
  **−10 dB** at CALL (fast attack, slow release ~150ms), **~180ms near-silence before RELEASE**, impact =
  transient click (attack 2–5ms) + sub-bass fundamental ~40–60Hz (content <150–200Hz) decaying ~250–500ms;
  a low rumble swells through GATHER.

---

## G. Photosensitivity guardrails (this is a flashing-lights feature — hard caps)

Anchored to WCAG 2.3.1 / Harding thresholds. **Ship none of §D–§F without these:**
- **≤3 flashes/sec** across the *entire* Surge/ultimate sequence.
- General full-screen luminance swing **<10%** relative luminance (darker state <0.80). No luminance
  swing **>60 L twice within 500ms** (machine-assert on captured frame sequences).
- The RELEASE flash is a **single non-repeating event**; prefer edge/vignette-framed or **small-safe-area**
  (<~25% of frame) brightness over centered full-screen white.
- **No saturated-red full-screen flash** (SUNBREAK is gold/white — stay there).
- Total **CA ≤ 0.030**; bloom pulses **strength only**; shake **rotational ≤~1°**, seeded-smooth.
- **One "Reduce flashing & motion" toggle** (extend the existing settings toggle from the EMBERSIGHT
  vitals work): disables the flash, zeroes radial blur, clamps shake trauma ≤0.3, halves CA/vignette
  pulses, softens FOV punch to ≤+3°, keeps the timeScale/pose beats (those aren't photosensitivity risks).

---

## H. Per-dragon palette schema — one skeleton, ten voices

Ship the SUNBREAK ritual once; each dragon supplies **one hue** and the grammar sings in its voice. Map
onto the existing fields (`dragons.js`) — do not invent a parallel system.

> ⚠ **Audit correction (§M.1-7):** `surgeHalo`/`surgeDark` are **new fields with fallbacks**
> (`surgeHalo ?? surgeHi`), **not** a collapse of `feverWing`+`surgeHi` (solar/phoenix split them
> deliberately; a halo derived from a black wing = a black beam). `feverWing` **survives** as the
> wing-channel override (0x000000 sentinel intact). `feverWash` the *field* retires only after the shared
> kick-tint default hue is decided. Coupling the sky/aurora wash (`environment.js:3292-3301,3422-3446`) to
> `surgeDark` is **unscoped** — couple it or make an explicit "sky stays biome-hued" decision.

```
surgeCore  = near-white, L≈96, faint (~8%) lean of the dragon's hue   // CONSTANT value; carries brightness
surgeHalo  = dragonHue, sat ≈78%, L ≈64        // the ONE per-dragon knob (drives bloom sheath + wing/rim)
surgeDark  = dragonHue, sat ≈32%, L ≈14        // the world-suppression tint (§C.2) — ties world to dragon
```
- `surgeHalo` derives from / replaces the intent of `feverWing`+`surgeHi`; `surgeDark` is new (drives the
  §C.2 grade). `feverEye` stays as the identity eye-flash; `surgeMotes` still selects arcane-vs-ember mote
  character; `feverWash` retires (the wash is gone) — its per-dragon *hue* migrates into `surgeDark`.
- **Silhouette skins** (`feverWing:0x000000`, e.g. Vesper/Wraith) keep a black wing but still get the
  cascade via rim + eye + spine (withheld-glow doctrine — the rim is the tell).
- **Signature accent (optional, one per dragon):** the Tempest's arc-crown (`dragon.js:1659-1750`) is the
  template — a per-dragon flourish on the shared skeleton (storm arcs, phoenix ember-bloom, sovereign
  arcane motes). New dragons inherit the full skeleton with palette-only data (measurable: §I-15).

---

## I. Numeric targets / measurables (machine-verifiable — a target we measure is a round we don't burn)

Verified via `tools/surgeshot.mjs` (extend for APEX/beam/impact seams) + pixel cross-sections + headless
state-machine asserts. Where research evidence beat the director's guess, the evidence won (noted).

**Value structure** — 1) Beam mid-shaft cross-section (dark-sky): ≥3 monotone zones, core L≥235, bloom L
120–200 with per-dragon channel ordering, outer L≤70; core width ≤30% of beam width. 2) Core never blown:
<1% of beam pixels at flat (255,255,255); bloom HSV sat ≥0.45. 3) Muzzle orb at APEX: 3-zone radial
cross-section, 2.2–2.8× shaft width. 4) Impact = ≥3 separable elements in a zoom crop; primary ring
0→full in 180–260ms with alpha falloff (no onion rings).
**Timing** — 5) Ignition cascade: eye-flash ≤120ms; full cascade at 900±100ms; ≥3 station timestamps
(eyes/spine/wings) separated ≥150ms; **stagger uneven** (no two gaps within 10%). 6) Readability: at
+250ms mean body emissive L ≥ 2× pre-Surge **while world grade saturation is still ≥0.85 of baseline**
(dragon leads, world follows). 7) Sustain flares: 2–4 over the window, inter-flare gaps seeded (no two
within 10%), zero `Math.random`. 8) Ultimate: GATHER ≥1.0s, APEX 230–270ms, **hitstop 70–90ms**
*(revised up from the brief's 40–60 per Lane D — supers use a separate superflash; ours is the APEX)*,
timeScale floor 0.22–0.28, return overshoot ≤1.06 settling ≤300ms. 9) Beam: core extends over 90–130ms
(not instant); core-last collapse (outer→bloom→core order asserted); wobble = ≥2 incommensurate freqs
(FFT shows no single dominant spike).
**Camera/screen** — 10) FOV −4..−6° over GATHER, +6..+8° punch ≤80ms at RELEASE, settle ≤600ms. Shake
trauma 0.15→0.5 ramp, 1.0 spike, <0.2 by beam end, rotational-dominant. 11) CA +0.010–0.020 spike over
the +0.013 fever floor, decays ~400ms, total ≤0.030. 12) Bloom +0.25–0.4 strength ≤250ms, threshold held.
**Photosensitivity** — 13) No luminance swing >60 L twice within 500ms; ≤3 flashes/sec; release flash one
frame-pair; caps in-module. **Budget/determinism** — 14) ≤150 visible particles; beam ≤8 added DC; zero
per-frame alloc in the ultimate hot path; 60fps on the weak-mobile tier (define the low-tier version of
*every* beat — §J). 15) Surge-off frames byte-identical pre/post (seams behind normally-undefined globals,
`__ddSurgeForce` pattern); all hue deltas sourced only from §H fields.

---

## J. Mobile tier fallbacks (define the low-tier version of every beat, not "off")

Adaptive `setPostTier` degrades gracefully — but SUNBREAK's read must survive the weak tier because the
**S-tier value is ~0-draw-call screen-space** (world-suppression grade + emissive ignition + held frame +
time/camera). Keep those on every tier; degrade the *particle/blur* garnish:
- **Low tier:** full cascade + world grade + APEX + hitstop + FOV + shake + core ribbon; convergence
  sprites 16→8; skip the outer-wrap 2nd ribbon (core ribbon carries the 3 bands alone); impact sparks
  24→14; **radial blur OFF**; heat-shimmer off.
- **Mid tier:** + outer-wrap ribbon, full sprite counts, radial blur perf-gated.
- **High tier:** + crossed 3rd core ribbon, dedicated over-bright impact core, god-rays swell, radial blur.

---

## K. Increment plan (coexist → hero → migrate; one PR each; Fable gate per phase)

Build order follows the dependency: **the ambient cascade is the shared skeleton the ultimate slams to
maximum**, so it comes first.

- **I0 — Tooling & seams.** Extend `tools/surgeshot.mjs` for APEX / mid-beam / impact captures; add the
  `__ddSurgeForce`-style force flags (undefined in play → byte-identical); suppress tutorial modals in
  captures. Baseline `tests/surgefx.mjs`. *(Tooling before spectacle.)*
- **I1 — World-suppression grade (§C.2).** The single biggest fix: kill the magenta wash, add the
  suppression grade + `surgeDark`. Prove on the hero dragon; keep fire/heaven overrides. Gate on the
  CORE:DARK ratio target (§I-6).
- **I2 — Anatomical ignition cascade (§C.3) + PRIME/DECAY (§D.1).** Stage `surgeAnimT`; sequence eyes→
  spine→wings→rim; add breathing sustain flares + reverse-cascade decay. Gate on §I-5/7.
- **I3 — The beam anatomy (§E).** Ribbon shaft with in-shader 3 bands + flow; muzzle/impact through the
  existing pools; birth-extend + non-metronome wobble + core-last collapse. Gate on §I-1..4, 9.
- **I4 — Time & camera choreography (§F) + APEX (§D.2).** GATHER convergence, held-breath, release
  hitstop/FOV/flash, post-FX pulse stack, radial-blur perf gate, audio via the event bus. Gate on §I-8,
  10–13 + the signature-frame critic pass.
- **I5 — Per-dragon accent pass (§H) + tier fallbacks (§J) + test battery.** Migrate the roster to the
  `surgeCore/Halo/Dark` schema (palette-only per dragon); wire one signature accent where it earns it;
  lock the low/mid/high beats. Gate on §I-14/15 + roster byte-identity.

**Three-judge split each gate:** the **machine** verifies §I; a **fresh harsh Fable critic (≥4.2/5)**
judges the **APEX signature frame** and a **mid-beam frame** on real captures (never the builder); the
**owner** judges the human-only residuals — flash comfort, slow-mo nausea, audio taste/level, 8s-sustain
fatigue, per-biome hue temperature — each a one-line dial.

---

## L. Tests spec

- Extend `tests/surgefx.mjs`: assert the ignition-cascade **order + timestamps** (eyes<spine<wings<rim,
  gaps ≥150ms, uneven), sustain-flare **seeded non-metronome** cadence, and the **core-last** beam collapse
  order, all by driving the state machine headlessly.
- New `tests/surgebeam.mjs`: beam cross-section value-band asserts (§I-1..3), draw-call ceiling (≤8),
  peak-particle ceiling (≤150), zero-alloc hot-path check.
- New `tests/surgejuice.mjs`: timeScale floor/overshoot window, hitstop 70–90ms, FOV punch magnitude/
  timing, **photosensitivity** luminance-swing cap (§I-13) — all from recorded state traces.
- `tools/surgeshot.mjs`: add `?debug=surge&seam=apex|beam|impact` montage output for the critic.
- Keep the roster laws as tests; a red test is design feedback, not an obstacle. Roster byte-identity guard.

---

## M. Feasibility audit & Gate Log

### M.1 Fable feasibility audit — **verdict: FEASIBLE WITH CORRECTIONS**

A fresh Fable agent audited this plan against the actual code (not the plan's claims). Verdict: the
pillars are sound and unusually well-matched to the codebase — the grade-arbiter, `kick`, capture-seam,
and pool patterns SUNBREAK needs all exist, the file:line map is ~95% accurate, and **no pillar needs
rethinking** — but the plan was written against an idealized version of three subsystems: a batched
particle pool that is actually **opt-in/OFF by default**, a `timeScale` channel that is actually **owned
by the slow-mo system**, and a **boss-only trigger that also fires in cruise**. Section verdicts:
architecture **YELLOW** · timeScale **YELLOW** · beam ribbon **GREEN** (2 risks) · particle/DC budget
**RED-as-written (fixable)** · per-dragon schema **YELLOW** · photosensitivity **GREEN** (1 fix) ·
timeline realism **YELLOW** · increments/tests **GREEN** (2 fixes).

**The 10 must-fix corrections (land before I1):**

1. **Run the ultimate sequencer on rawDt** — `timeScale` exists (`gameState.js:69`, applied
   `main.js:1652`) and dt-scaling is uniform (no fixed physics step), so flooring to 0.25 is safe and the
   boss/bullets slowing with it is the desired read. BUT `updateSurgeBeam` uses **scaled** dt, so a 1.15s
   GATHER at timeScale 0.35 becomes ~3s wall-clock (ultimate → ~6–7s). The sequencer must run on
   **rawDt** (§D.2 numbers are wall-clock). Surge takes `timeScale` through a **single new conductor with
   priority** over cine-slow (`boss.js:2238,2466,2484`) and lethal-save (`collision.js:53`) — not another
   raw writer. At RELEASE it must **zero `slowMoTimer` before calling `hitstop()`** (`juice.js:25` refuses
   hitstop while slow-mo runs; `main.js:1647` kills live hitstop under slow-mo) and **bypass the 180ms
   `hitstopCooldownMs`** (`config.js:595`) for the release beat.
2. **Fix the particle draw-call story (the RED item).** The "unified additive sprite batch (1 DC)" is
   **opt-in and OFF by default** (`save.js:33 particleBatch:false`; `particles.js:40-45`) — on the shipped
   path it's **one DC per visible sprite**, so §E.4's counts are 40–80 DC, not 1. Resolve by **either**
   (a) flipping `particleBatch` default on (owner decision — carries a documented far-burst fog deviation,
   `particles.js:112-118`), **or** (b) restating §E.4's budget for the per-sprite path with cut counts.
   Also: `shocks[]` is **1 DC per live ring** (2–3 rings = 2–3 DC), not "(1)"; the muzzle's 3–4 layers
   need **dedicated persistent sprites** (the `boss.js:1170-1185` shimmer-pool pattern), not fire-and-
   forget pool sprites (+3–4 DC — still ≤8). Convergence streaks reuse `gatherPulse()` (`particles.js:252`)
   — but add a no-clone variant (it `.clone()`s twice/spark, `:264,272`) for the zero-alloc target.
3. **Surge impact REPLACES the legacy bursts, never stacks.** The release moment already spends ~88
   sprites (`strikeSurge` 24+18 `boss.js:1481-1482`, `breakShield` 26+20 `boss.js:3963-3964`, the dragon's
   18-ember ignition `dragon.js:1612-1628`) against the shared quality-scaled `VISIBLE_CAP=150`
   (`particles.js:17`). I3 must **delete/absorb** those, or the new authored layers silently fail to spawn
   (`acquire()` returns null on overflow). Peak-82 holds only if the new load replaces the old.
4. **Exposure dip goes through `renderer.toneMappingExposure`, composed into `main.js:1641`** — NOT a
   grading-pass uniform (grading runs post-OutputPass on display-referred colour; a "−0.4 EV" there is not
   exposure, and grading is absent at tier 2). `main.js:1641` overwrites exposure every frame, so the dip
   must be folded into that line (bonus: works at tier 2, which §J needs). Desat + vignette + dark-tint go
   through a **new arbiter channel** in the grading pass (HUD-grade-arbiter pattern, `postfx.js:191-203`),
   **keeping `lift/liftTint` alive** — it's shared machinery for the kick presets (`goldenEmber`,
   `arenaFlood`, the 1-frame flash, `postfx.js:433-439`). Kill only the `_feverMix` wash term; preserve the
   fire/heaven overrides (`_arenaWarm`, `postfx.js:110-113`).
5. **DECAY keys off remaining `feverTimer`, not elapsed time** — refresh (+1.2s/ring) must re-enter
   SUSTAIN mid-decay, and the **instant hit-cancel** (`collision.js:351,364`) needs a fast-path reverse
   cascade (~0ms, the `sfx.surgeFizzle` visual). **Define the interrupted-ultimate rule:** a bullet hit
   during the now-1.55s GATHER cancels fever (`collision.js:364`) — today's 0.5s charge makes this rare, a
   long charge makes it common. **Recommendation: grant i-frames CALL→RELEASE** (≤1.6s), since fever
   already grants reflect/phasing for the window.
6. **One-conductor dedupe of the three rising edges (§B).** Ambient IGNITION (emissive cascade) runs on
   ALL three edges; its **timeScale/camera beats are suppressed when `surgeSeq` owns the moment** (one
   conductor). The cruise auto-trigger's time-dip is an **owner-gated dial** (it would fire dozens of
   times/session — a real feel/fatigue call).
7. **`surgeHalo`/`surgeDark` are NEW fields with fallbacks, not a collapse of existing ones.** Don't merge
   `feverWing`+`surgeHi` — the solar/phoenix dragons deliberately split them (`dragons.js:988-992`: wings
   blaze while spine stays fire-hued), and deriving a halo from `feverWing:0x000000` yields a black beam.
   Use `surgeHalo ?? surgeHi`, `surgeDark` derived from the old wash hue; **`feverWing` survives** as the
   wing-channel override (0x000000 sentinel intact). `feverWash` the *field* retires only after the
   kick-tint default hue is decided (its `liftTint` is shared with the kick flashes). **Sky coupling is
   unscoped:** `environment.js`'s `feverMix` sky shift (`3292-3301`) + aurora curtains (`3422-3446`) are a
   *second, independent* magenta wash with a hardcoded warm/magenta binary — either couple it to
   `surgeDark` (new work) or make an explicit "sky stays biome-hued" decision.
8. **Named build risks:** **prewarm the ribbon shader at `initBoss`** (`renderer.compile`/hidden-frame —
   a fresh `ShaderMaterial` compiles on first use → mid-fight hitch on weak mobile); **re-gate the
   wingtip-trail hook** — `dragon.js:1856-1874` is gated on `boosting && spineGlow≥0.5` and only exists on
   elite forms, so cascade stage-4 needs its own gate and a non-elite fallback; add a **flap pose-pin
   dial** (the flap advances with scaled dt — it slows 4× at APEX, it does not pin to a silhouette pose);
   **plumb rawDt to `updateParticles`/`cameraCtl`/`surgeSeq` during hitstop** for the GoW selective freeze
   (hitstop is a global `dt*=0.05`, `main.js:1657` — freezing particles/camera/beam too); **build the
   trauma²-rotational shake as NEW work** — current shake is translational `Math.random`
   (`cameraController.js:352-357`), the exact glitch-read Lane D warns against.
9. **Compress repeat casts + fix the I2/I4 ordering.** 3.4s exceeds every premium reference except
   Acheron's payload (Lane B: 1.4–2.1s total), and the move is repeatable (gauge refills 2–3×/fight).
   **Full ritual on the first cast per fight; compressed GATHER (~0.6–0.7s, total ~2.2s) on repeats** —
   also bounds slow-mo-nausea exposure. And **strip I2's IGNITION to emissive-only** (its gate is emissive
   timestamps §I-5/7 anyway) so it doesn't depend on I4's timeScale conductor — or pull the conductor
   forward into I1.
10. **Retarget the un-assertable tests.** §I-13's luminance-swing assert is impractical on swiftshader
    (~30s+/frame) — assert on **recorded driving-envelope traces** (lift/flash/exposure state) plus 1–2
    anchor frames. §I-14's "zero-alloc hot path" isn't headlessly assertable — make it a **review-checklist
    item or an instrumented allocation counter**. Cascade timestamps need a `trailDebug()`-style
    introspection export from `dragon.js` (established pattern). Everything else (cross-sections, DC
    ceiling via `renderer.info.render.calls`, the `__ddSurgeForce` seam per the `__ddArcForce` precedent
    `dragon.js:1743`) is assertable as written.

**Also correct in §G:** there is **no existing "reduce flashing & motion" toggle** — what exists is
scattered `prefers-reduced-motion` gating + the EMBERSIGHT accessibility group (`save.js:34-37`). Add one
boolean there + a settings row (`ui.js`), and make OS `prefers-reduced-motion` imply it (house
convention). The RELEASE flash via `kick()` is a **no-op at tier 2** (`postfx.js:229`) — if the flash must
read on weak devices, use the DOM-flash fallback (`ui.lanceFlash`/`#jade-flash`); the photosensitivity
asserts must test the tier that actually flashes.

### M.2 Gate Log

| Gate | Phase | Verdict | Notes |
|---|---|---|---|
| 0 | Kickoff (this plan) | ✅ FEASIBLE WITH CORRECTIONS | SUNBREAK brief + 4 research lanes synthesized; Fable audit folded into §M.1 (10 corrections). Pillars sound, no rethink; 3 subsystem-idealization fixes gate I1. |

---

## N. Provenance

Research method + sources + the WebFetch-blocked caveat: [`DRAGON-SURGE-RESEARCH.md`](./DRAGON-SURGE-RESEARCH.md).
Mechanisms/structures are reliable; individual ms/L figures are mechanism-grounded estimates — which is
exactly why §I targets are measured on our own harness, not trusted from the references.
