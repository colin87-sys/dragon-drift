# Dragon Surge — Premium Research Digest (SUNBREAK)

Backing research for [`DRAGON-SURGE-OVERHAUL.md`](./DRAGON-SURGE-OVERHAUL.md). Four Opus
research lanes, briefed by the Fable art director, on how blockbuster + gacha games build
their signature power moments. The overhaul plan is self-sufficient; this digest preserves the
sourced tables and the provenance so an executing session can check a number against its origin.

> **Provenance caveat (read once).** All four lanes ran in an environment where **WebFetch was
> policy-blocked at the egress proxy (CONNECT 403) for every tutorial/wiki/video host**. They
> worked from **WebSearch page-text synthesis + domain knowledge**, cross-checked against named
> references. Consequence: the **mechanisms, orders, structures, and ratios are reliable**;
> individual **millisecond / luminance figures are mechanism-grounded estimates, not
> frame-data-sheet or eyedropper reads** (treat as ±15% / ±5 L). Tags used below: **[S]** sourced,
> **[F]** frame-step observation, **[D]/[derived]** craft-derived recommendation. This is exactly
> why the overhaul's §I targets are things we **measure on our own harness** (`surgeshot`,
> pixel cross-sections) rather than trusting the reference numbers — a target we can measure is a
> round we don't burn.

---

## LANE A — AAA console blockbuster ultimates & transformations

**The hypothesis it confirmed:** *dim the world, the hero becomes the light source.*
- **Bayonetta Witch Time [S]** — world slows to **1/8 (12.5%)** speed under a monochrome/purple
  desaturation wash; Bayonetta herself keeps full colour + contrast. The single strongest evidence
  for world-suppression-not-hero-wash.
- **God of War Spartan Rage [S/F]** — activation is an **anatomical ignition in order**: eyes ignite
  first → veins/muscles light core-outward → fists ignite → roar + knockback ring. World *warms &
  desaturates at the periphery* (not a colour wash); does **not** go dark, goes muted-at-edges. Meter
  **drains continuously**, hits refill; expiry is a **~300–500ms soft fade + exhale**, never a hard cut.
- **DMC5 Devil Trigger / Sin DT [S/F]** — DT: flash + energy erupts from the spine outward, expanding
  ring staggers enemies, aura **flares brighter on each hit**. **Sin DT** = the "hold-to-charge → release
  detonation" model; the *hold IS the gather*.
- **FFXVI Limit Break [S]** — Clive + sword burst into Phoenix fire; a **fiery tint holds for the whole
  buff** and lifts when the gauge empties.
- **Elden Ring buff auras [F]** — the model for an 8-second state that stays visible: **thin body-rim
  aura + intermittent flares + motes**, not a flat glow. Placidusax = transform-then-emit.
- **Sekiro [S/F]** — impact recipe: **spark burst peaks frame 1 → hitstop scaled to hit weight → held
  frame → fast whip release.** Deathblow adds slow-mo + push-in + heavy hitstop.
- **Street Fighter screen-freeze [S]** — the defensible **held-breath anchor**: a hard hit freezes
  **~15f = 250ms**; a cinematic super-flash freezes **~40–60f = 0.66–1.0s**.

**Key numbers:** first body part lit ~80ms · full eyes→spine→wings→rim cascade ~340ms (stagger,
never simultaneous) · activation ring ~180ms · APEX held-breath **200–280ms** · release hitstop
**60ms** · sustain flare every ~1.4s ±jitter · expiry fade ~450ms.

**Top-5 steals:** (1) Witch-Time inversion — suppress the world, don't wash the screen. (2) Anatomical
ignition cascade, eyes-first, ~85ms/stage. (3) Elden-Ring sustain kit (rim + non-metronome flares +
motes). (4) Held-breath APEX ~280ms at timeScale 0.125–0.25. (5) Sekiro release bundle (60ms
front-loaded hitstop + FOV punch + rim-flash + ≤40 instant sparks + ≤0.5° roll).

---

## LANE B — Gacha ultimate cinematics

**The one structural finding:** every gacha ultimate is the same 5-beat envelope —
**INTERRUPT → FRAME (claim the screen) → HELD BREATH → STRIKE → RESUME** — and the *expensive* ones
don't add beats, they spend the same beats harder. The genre's core trick is the **FRAME beat**: for
~0.4–1.5s the world is suppressed and one subject is lit as the brightest/most-saturated/most-in-focus
thing. **A 2D gacha buys that shot with a Spine portrait cut-in; a 3D game buys the identical shot with
post-process world-suppression + emissive subject dominance, co-timed to the APEX.**

**Phase budget (ms, 60fps, footage-estimated):**

| Ultimate | CALL | GATHER | APEX (held) | RELEASE | PAYLOAD | Total |
|---|---|---|---|---|---|---|
| Genshin generic 4★ | ~80 | ~250 | **none** | ~120 | ~400 | ~1.0s |
| Genshin Raiden (5★) | ~130 | ~500 | ~250 | ~130 | ~500 | ~1.8s |
| Genshin Neuvillette | ~150 | ~600 (inward gather) | ~200 | ~120 | ~700 | ~2.1s |
| HSR Acheron | ~200 | ~700 | ~300 | ~150 | ~7000+ | ~9–10s |
| HSR generic | ~150 | ~400 | ~200 | ~120 | ~800 | ~2.0s |
| ZZZ chain/ult | ~120 | ~150 | ~350 | ~100 | ~600 | ~1.6s |
| WuWa Liberation | ~100 | ~250 | ~150 | ~100 | ~600 | ~1.4s |
| PGR signature | ~120 | ~300 | ~150 | ~120 | ~700 | ~1.6s |

**The differentiator:** *generic ults have NO held frame; every premium ult has one.* CALL 80–200ms ·
GATHER 250–700ms · **APEX 150–350ms** · RELEASE 100–150ms. Setup length is nearly constant across tiers
— what "5★" buys is **screen-time of the strike (PAYLOAD)**.

**The 3-band value stack (frame-estimated L*, structure robust to ±5 L):**

```
CORE   near-achromatic, L 92–99, sat 0–15%   ← constant across ALL characters
HALO   the identity HUE lives here, L 55–75, sat 65–90%   ← the ONLY per-character knob
DARK   the hue CRUSHED to shadow, L 8–20, sat 20–40%   ← not neutral grey
```
Raiden 272° · Acheron 350° · Neuvillette 192° — **same three-band stack, one hue number changed.**
CORE:DARK luminance ratio runs **5:1 to 10:1**; below ~4:1 the drama collapses. **This is the exact
diagnosis of why a full-screen magenta wash reads cheap: the wash raises the dark field's L toward the
core, destroying the contrast ratio.** Premium *lowers* the world and *raises only the subject*.

**Efficiency thesis:** ~80% of the premium read is **near-zero-draw-call** screen-space + emissive
discipline (world-suppression grade + anatomical emissive ignition + held frame + white-core→white-bloom);
particles are the *last 20%*. Cheap ults invert this — over-spend on particles, under-spend on the grade
and the held frame. Direction is the signal: **convergence = charge, eruption = release, never both at
once.** One purposeful contracting ring beats five concentric ones.

---

## LANE C — Beam / breath-weapon / projectile VFX craft

**Anatomy census (validates ≥3 nested layers/station, tiered):**
- **SHAFT = exactly 3** — white-hot core (≤ tonemap knee) / saturated per-dragon-hue bloom sheath /
  **genuinely dark** turbulent outer wrap. (Gabriel Aguiar's canon = literally 3 open-ended cylinders,
  black-outer / bright-mid / bright-core, panned noise. Monster Hunter elder-dragon beams: mouth glows
  **blue on charge → snaps WHITE at release-lock**, white core + coloured sheath + flame outer.)
- **IMPACT = 4–5** — contact core / bloom disc / shock ring(s) / spark cluster / scorch. Impact is where
  every reference stacks the most.
- **MUZZLE = 3–4** — white core flash / hue petals / dark gather-socket / heat-shimmer.

**Flow (cheapest r160 per layer):** scrolling-UV panner on a streak-noise **DataTexture** is the primary
mechanism (1 shader uniform, 0 particles). Core scroll ~2–3 beam-lengths/s; bloom scrolls at an
**incommensurate** 1.4–1.8× so the layers never lock into a visible repeat; outer adds vertex
displacement so the silhouette *boils*. A discrete **surge-pulse** traverses muzzle→impact every ~0.4s
(the anime "power pushed down the beam" read), phase-offset from every wobble.

**Beam life:** birth = the beam **EXTENDS** muzzle→impact over **90–130ms ease-out with a ~4–6% tip
overshoot** (instant-full-length is the laser-pointer tell); bloom lags core by ~1 frame (lag = depth).
Sustain wobble = **sum of ≥2 incommensurate sines + seeded phase per layer** (core flicker 11–14 Hz /
bloom breathe 3–5 + ~7 Hz / outer sway 1.5–2.5 Hz) — never a single `Math.sin` (today's metronome).
Death = **core-LAST collapse**: outer fades (~120ms) → bloom (~80ms) → core narrows to a bright pinch and
pops (~60–80ms). ~260ms total.

**Impact numbers:** 2 shock rings (3 on shield-shatter), primary expands 0→full in **180–260ms** life
~0.6s, secondary lags ~60ms wider life 300–400ms · **24–40 sparks** speed 18–30 u/s life 0.3–0.5s ·
10–16 shield shards · scorch persists **~1.0s** · heat-shimmer 0.5–0.8s.

**Build plan — the shaft is a billboarded RIBBON, not nested cylinders:** paint all 3 value bands across
the ribbon **width (u)** in one ShaderMaterial, scroll streak-noise along its **length (v)** — one
shader, **1 draw call**, no tube seam/end-cap, faces camera so the bands read at every angle (down-axis
flatness covered by a crossed 2nd ribbon). Draw-call tally: **core ribbon (1) + outer wrap ribbon (1) +
unified additive sprite batch (1) + shock-ring pool (1) = 4 baseline, ≤7 with extras — under the ceiling
of 8.** **Reuse the existing `particles.js` batched spark pool (1 DC for all point elements) and the
8-sprite `shocks[]` double-ring pool** rather than new pools.

---

## LANE D — Screen-space juice & game-feel

**The central correction to the brief:** fighting-game supers get weight from a long **superflash
freeze** (a cinematic *pause* at activation), which is a **separate device** from impact **hitstop**
(which stays short even for heavy hits). So: **the APEX held-breath (timeScale floor ~0.25, ~200ms) IS
our superflash — done with time-dilation, not a freeze — and the RELEASE hitstop is crisp punctuation on
top, 70–90ms (not 40–60). Don't collapse the two.** Also (God of War): during hitstop, **freeze the actor,
keep particles/camera/beam moving** so the freeze never feels dead.

**Master juice table (technique × moment × magnitude × duration × curve):**

| Technique | Moment | Magnitude | Duration | Curve |
|---|---|---|---|---|
| timeScale ramp-down | CALL→GATHER | 1.0 → 0.35 | ~1.15s | easeInOutCubic |
| timeScale floor (held breath) | APEX | 0.25 | ~200ms | hold |
| timeScale release + overshoot | RELEASE | 0.25 → **1.05** → 1.0 | snap ≤50ms; settle ~250ms | decaying-spring |
| **Hitstop (first contact)** | RELEASE | freeze dragon+beam origin; particles/cam keep moving | **70–90ms** | snap in, 1-frame ease-out |
| FOV tighten | GATHER | −4 to −6° | ~1.15s | easeInOutCubic |
| FOV punch | RELEASE | **+6 to +8°** | ≤80ms out, ~300ms back | easeOutCubic |
| Screenshake micro→burst | GATHER→RELEASE | trauma 0.15→0.5 ramp, **1.0** spike | decay ~600–900ms | **trauma², rotational-dominant** |
| Full-screen flash | RELEASE | 1 frame, capped swing | ~16.7ms, single event | snap on, easeOut off |
| Bloom pulse | RELEASE→BEAM | +strength (**never lower threshold**) | up ~80ms, down ~500ms | easeOutCubic |
| Chromatic aberration spike | RELEASE→IMPACT | +0.010–0.020 (fever floor +0.013) | up ~80ms, down ~500ms | easeOutCubic |
| Vignette pulse | IMPACT | +0.10–0.18 | up ~100ms, down ~600ms | easeOutCubic |
| Exposure dip | APEX→RELEASE | −0.3 to −0.5 EV, snap back | dip over GATHER | easeIn dip, snap restore |
| Audio duck | CALL | **−8 to −12 dB** bed | held to APEX, release ~150ms | fast attack, slow release |
| Pre-impact silence | APEX | bed → near-silence | ~150–200ms gap | fade to floor |
| Impact synth hit | RELEASE | sub-bass ~40–60Hz + transient click | attack 2–5ms, decay 250–500ms | snap, expDecay |

**Hitstop tiers [S]:** Final Fight universal **6f=100ms**; Vlambeer 60–80ms; the impact→lag line is
**~130–150ms** (Celeste *shortened* pauses so they can't eat inputs). **Screenshake [S]:** Eiserloh
`shake = trauma²`, trauma∈[0,1], linear decay ~0.8–1.5/s, per-axis = `maxVal·shake·noise(seed,time·freq)`
— **3D → rotational only** (translational reads as a glitch), seeded Perlin (deterministic + non-strobing).
**Time dilation [S]:** ease *in* so the slow-mo arrives, ease *out*, then overshoot past 1.0 (~1.05) and
settle as a decaying spring.

**Radial blur — conditional GO:** a single-pass **6–8 tap half-res** radial blur, **RELEASE-only ~250ms**,
strength on the FOV-punch envelope, **off under the accessibility toggle**, **on a perf gate** (cut if it
can't hold 60fps on the weakest target). FOV-punch + CA + shake already cover ~85–90% of the read; radial
blur adds the last ~10–15% streak-toward-axis. Not a floor requirement.

**Photosensitivity guardrails (WCAG 2.3.1 / Harding-anchored [S]):**
- **≤3 flashes per second** across the *entire* sequence (a flash = a pair of opposing luminance
  transitions).
- General full-screen luminance swing **<10%** relative luminance when the darker state is <0.80 (or
  <20 cd/m² when darker frame <160 cd/m²).
- The RELEASE flash is a **single non-repeating event**; prefer edge/vignette-framed brightness or a
  **small safe area** (<~25% of frame) over a centered full-screen white.
- **No saturated-red full-screen flash** (SUNBREAK is gold/white — stay there).
- Total **CA ≤ 0.030**; ramp, never strobe. Bloom pulses **strength only**.
- Shake **rotational-dominant, ≤~1°**, seeded-noise-smooth.
- **One "Reduce flashing & motion" toggle** that disables the flash, zeroes radial blur, clamps shake
  trauma ≤0.3, halves CA/vignette pulses, softens FOV punch to ≤+3°.

---

## Sources (representative; full lists in the lane transcripts)

**A:** God of War Wiki (Spartan Rage), DMC Wiki (Devil/Sin Devil Trigger), FFXVI Wiki + Game8 (Limit Break),
Asura's Wrath Wiki, Elden Ring Wiki/Fextralife (Placidusax, Dragon Communion), Sekiro Fextralife,
Street Fighter Wiki (Screen Freeze / Frame), Bayonetta/SmashWiki (Witch Time).
**B:** Genshin Impact Wiki (Elemental Burst, i-frames), KQM frames library, TheGamer 5★ burst list,
HSR Wiki (Ultimate) + HoYoLAB (Acheron), ZZZ Wiki (Chain Attack) + Prydwen, WuWa Wiki (Resonance
Liberation), PGR Combat Guide, RealtimeVFX (Genshin Mona breakdown, Blackbody).
**C:** RealtimeVFX (UE laser breakdown, Unity shader-graph lasers, volumetric beams), Gabriel Aguiar
laser tutorials, 80.lv (Kamehameha VFX), CGHOW (Celestial Beam Niagara), Unreal Niagara beam docs,
Monster Hunter Wiki (Xeno'jiiva/Safi'jiiva/Fatalis), Kamehameha/Skyrim Fire Breath wikis, Lexdev
(Hammer of Dawn), danielilett (Fresnel).
**D:** Vlambeer "Art of Screenshake", Eiserloh "Juicing Your Cameras With Math" (GDC 2016), Sicienski
"Hitstop in Capcom Beat 'Em Ups", SmashWiki (Witch Time), Dustloop (GGST mechanics), Swink *Game Feel*,
MDN/WCAG 2.3.1 seizure guide + Xbox Accessibility Guideline 118, easing/overshoot references, sidechain
ducking + cinematic-silence references, InnoGames/dual-Kawase blur cost analyses, Unity CA docs.
