# The Surge "washed white wings" was the fresnel RIM, not the emissive — publishing a mat into `spineMats` silently opts it into BOTH the flare AND the rim, and a strong rim over a DENSE emissive field creams it

**Did.** Owner on the reforged fire phoenix's Dragon Surge: first "it's a white mess," then — critically —
"retain its ORIGINAL colours with strong ACCENTS of surge, not a full transform." Chased the "washed white
wings" through ~40 render iterations and a full Fable VFX-composition pass. Landed a genuinely fiery surge:
the wings now hold their cruise orange-gold fire, the drama carried by accents (white-hot heart, embers,
ignition burst) + a **warm fiery Surge sky** (not the default magenta). The wing wash — the thing that
resisted everything — turned out to be a **self-inflicted rim regression**.

**Learned #1 — `spineMats` is an OVERLOADED channel: joining it opts a material into the Surge FLARE *and*
the fresnel RIM.** The rig does `for (const m of spineMats) applyRim(m, …)` at build, and `updateRim(col,
rimStrength)` every frame with `rimStrength = (0.5 + surgeMix·0.7)·quality` → ~**1.2 on Surge** vs 0.5 cruise.
Earlier, to make the wings flare on Surge, I published the wing `hotRibbon` feathers + membrane into the
wing's `spineMats`. That *also* subjected them to the surge rim — and a strong fresnel rim over a **dense,
overlapping** emissive feather field lights the whole sheet at grazing angles → it brightens to **cream**.
The fix was to put the wing `spineMats` back to just the thin gilt accents `[gold, roseGold, orange]` and
leave the broad feathers/membrane OUT: no flare, no rim, they keep their cruise fire. White-fraction on the
surge crop dropped from ~5% to <1% and the wings read as saturated orange-gold. **If you add a material to
`spineMats` for the flare, you have also added it to the rim — check both, especially for broad/dense areas.**

**Learned #2 — when a screen effect resists every material change, ISOLATION-RENDER the pipeline, don't keep
tuning the object.** I burned an enormous number of renders tuning the wing *materials* (bright → white; dim →
the dark diffuse shows as **tan** under the lit scene; saturated diffuse → still cream; base-intensity `ribI`
headroom → no change). None worked because the wash wasn't in the material at all. What finally cracked it was
a disciplined isolation pass — one render each with the fever **grade** neutralised (no change), the fever
**bloom** killed via a threshold spike (no change), which left the **rim** as the only fever-coupled thing
still touching the wings. Two cheap diagnostic renders would have saved thirty. The banked rule: **prove
which pipeline STAGE owns a symptom (material / light / rim / bloom / grade / tonemap) by disabling stages one
at a time, BEFORE tuning within a stage.** A green-diffuse test earlier proved the wings *were* the hotRibbon
feathers; a stage-isolation test should have immediately followed.

**Learned #3 — the fire phoenix's Surge was MAGENTA, and that fights a warm dragon.** The sky shader hard-codes
a magenta/violet fever palette (`mix(horizon, vec3(1.0,0.35,0.85), feverMix·0.8)`) + cyan/magenta aurora — a
game-wide "Dragon Surge is magenta" identity. For a FIRE rebirth that pink cast desaturates the warm dragon
toward cream in the reflections/ambient and just reads wrong. Added a nullable **`feverWarm`** uniform +
`setFeverWarm(def.fireTrails)` (env.js), blending the fever sky/aurora to warm ember for fire dragons only
(magenta preserved at `feverWarm 0` for everyone else). This is the general hook for per-archetype Surge
palettes — the rebirth sky should match the dragon's element.

**Learned #4 — "make X ignite on Surge" for an already-emissive element is mostly RESTRAINT + rim/effects, not
MORE emissive.** The owner's decisive note ("retain original colours + strong accents, it's too much") was the
real design: a fire dragon is *already* fire, so Surge should hold its cruise look and add SELECTIVE strong
accents (heart core blaze, gilt regalia edges, a warm sky, an ignition ember-burst, denser embers) rather than
recolour/brighten the whole creature — brightening only feeds the bloom/rim into a wash. The white the owner
first rejected came from additive trail/aura/mote sprites with hard-coded COOL textures + white cores (fixed:
warm textures via a `makeGlowTexture(rgb, coreRgb)` param, ember-ramped motes, an ambered/shrunk aura, the
body speed-trail pushed off the silhouette) — but the *wing* wash specifically was the rim.

**Gotchas banked:**
1. **A near-black "pink-proof" diffuse becomes TAN, not black, when you dim its emissive under a lit scene** —
   the fire mats are emissive-DOMINANT by design, so dimming them on Surge reveals the dark diffuse which the
   scene light lifts to dull tan. Don't "dim to avoid bloom"; keep the emissive and remove the *washer*.
2. **`surgeshot.mjs` catches a random flap phase** — raised-wing (upstroke) frames catch the sky/light and read
   lightest; judge the TREATMENT across several frames (or a strip), not one pose, and pair renders with a
   headless white-fraction/hue probe (`min(R,G,B)>threshold`) so "cream" is a number, not a vibe.
3. **`feverWarm`/sprite fire-trail changes are all gated on `def.fireTrails`** (+ `feverWarm` defaults 0) so the
   whole roster's magenta Surge is byte-identical — the additive/nullable discipline again.

**→ Unlocks.** `spineMats = flare + rim` is now a known coupling: the reusable rule is *audit rim exposure when
you publish a mat for flare*, and for broad/dense emissive fields prefer a flare-only channel over `spineMats`.
Plus the pipeline-stage isolation habit (disable grade → bloom → rim → light, one at a time) as the FIRST move
on any "screen effect washes my object" bug, and `feverWarm` as the per-element Surge-palette hook.
