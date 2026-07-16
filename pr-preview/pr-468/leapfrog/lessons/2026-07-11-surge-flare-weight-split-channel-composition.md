# Surge glow is a PUBLISHING problem, and composing it needs a per-mat flare weight SPLIT into colour vs intensity (because bloom white-outs any already-bright mat the instant you raise intensity)

**Did.** Owner on the reforged fire phoenix: *"in Surge the body glows but the wings don't — the wings should be
the majority glow, the body an accent, blending with the tail/wingtip fire trail."* Ran the Fable
design-director → plan → build → harsh-critic loop. Result: the Surge now ignites the WINGS as the hero
(warm gold-fire across the span, hottest at the tips → pours into the ember trail) with the body reading as
bright accent strokes over a warm field, on a new reusable **per-material flare-weight** system. Critic:
3.4→ship after two dial cuts, "SHOW-THE-OWNER: YES." All rest gates byte-identical throughout (starters
286/286, wingsym Δ0) — the whole change is Surge-only re-lighting, zero geometry.

**Learned #1 — "X doesn't glow on Surge" is almost always a PUBLISHING gap, not a shading bug.** The rig's
Surge flare loop (`dragon.js`) only re-lights materials that a part hands into the aggregated `spineMats`
(assembled in `dragonModel.js`). The torso published its whole fire palette → the body blazed. The wings
published only `[gold, roseGold, orange]` (trim, not surface); their dominant fire mats — the `hotRibbon`
feather/streamer ramp, and the four **membrane** mats which were *locals inside `buildOneSunWing` and never
returned at all** — never reached the loop. Fix = publish them: export the membrane locals via
`wg.userData.flareMats`, collect them per-side in the wings builder, and return
`spineMats: [...trim, ...M.hotRibbon, ...memFlareMats]`. Before writing a shader, grep what each part
actually publishes.

**Learned #2 — a UNIFORM flare loop can't compose; a per-mat weight can — but ONE weight is not enough.** The
loop applied the same colour-lerp + intensity-gain to every published mat, so there was no way to say "hero"
vs "accent." Adding `userData.flareWeight` (nullable, ⇒1) gives hierarchy. BUT a single weight **couples the
colour shift and the intensity gain**, and under aggressive bloom that fails: the wing feathers' base
emissive is ~2.0 — already at the tone-map/bloom knee — so *any* intensity gain instantly white-outs them
into a featureless slab (erasing every membrane band / covert rank / finger you modelled). The fix is to
**split the weight into two independent channels**:
- `flareColorWeight` → how far the emissive lerps toward `surgeHi` (this is what reads as "it's glowing").
- `flareIntensityWeight` → how much the emissive intensity climbs (this is what BLOOMS).
- Fallback chain `flareColorWeight ?? flareIntensityWeight ?? flareWeight ?? 1` keeps every other dragon
  arithmetically identical (byte-identical no-op — verified: weights live only in the phoenix file + the loop).

Now a **broad face** (the membrane) can shift strongly toward gold (high colour weight = "the majority of the
wing glows") while its intensity stays LOW (no slab bloom), and an **already-bright thin ribbon** (the
feathers) can hot-shift its tip hue with near-zero intensity gain (colour lerp alone carries the "flared"
read). That decoupling is the whole game.

**Learned #3 — the tip-hot gradient must ride the COLOUR channel; intensity inverts it.** I first ramped
intensity UP outboard to make the tips hottest. Wrong: outboard crossed the bloom knee FIRST and went whitest
(hue-saturation *decreasing* exactly where I wanted gold to peak — the gradient inverted on screen). Correct:
hold intensity uniformly low across the panel and ramp the **colour weight** outboard (memHot 0.5 →
memDeep 0.95). Gold tips that survive tone-mapping, because they were never over-bright.

**Learned #4 — `surgeHi` colour is a first-class dial; a near-white default washes fire to white.** The dragon
was falling back to the engine default `surgeHi ≈ 0xfff8e8` (near-white), so even a correct colour lerp pulled
the fire toward cream. Setting a **saturated hot-gold** `surgeHi` (0xff9e2e) — consistent with this dragon's
existing warm-gold `feverWing`/`feverWash` Rebirth identity — makes the flare read as *incandescent gold-fire*
even at high brightness. Match `surgeHi` to the element's fire identity, don't inherit celestial white.

**Gotchas banked:**
1. **`surgeshot.mjs` catches a RANDOM flap phase at t=2.4s steady surge** — judge the light/hue TREATMENT,
   not the wing pose; small weight changes are easy to mis-read across phase-varying stills. The material
   treatment being principled (low intensity + colour ramp + deep surgeHi) matters more than any one frame.
2. **Rose-gate the SURGE frame, not just rest** (pink was historically only gated at rest) — but the pink
   SKY/`feverWash` backdrop is scene, exempt; only the DRAGON pixels count. Here the dragon fringes warm-peach
   at worst, never rose — the pure-emissive dark-diffuse fire basis holds under the white-gold flare.
3. **The heart core is (correctly) OUT of `spineMats`** → it stays the single hottest apex point untouched,
   and its bloom bleeds over the inner wing at raised-wing flap phases (reads as extra white there — it's the
   core, not the wing mats).
4. **An orphan runtime material is a silent dead-end**: this dragon's `wingMat` is the wing module's `ivory`
   instance, which no wing mesh uses — the rig's "glow around the wings" swell writes to nothing. Don't repoint
   it; publish the real surfaces into the flare list instead.

**→ Unlocks.** The **split-channel flare weight** (`flareColorWeight` / `flareIntensityWeight`, nullable) is
the reusable knob for composing ANY dragon's (or boss's) Surge/power-up glow: decide per-mat what reads as
hero vs accent, shift broad faces by hue without blooming, keep thin bright fire from white-out — and it costs
nothing on every dragon that doesn't tag a weight. Plus the general diagnosis rule: **"element X doesn't react
to the power-up" → check what that part publishes into the shared flare/rim list first.**
