# 2026-08-12 — FORNAX value rounds: the flag, the def, and the camera lie before the dials do

**Did / learned.** Ten more blind head rounds + eight hide rounds against the Rathalos bar
(scores head 1.5→2.8, hide 2.1→2.4). The lasting finds were never shape dials — they were
three classes of *silent lie* between authored intent and judged pixels:

1. **The material flag.** Two hide critics called the wing membrane "one flat fill" — because
   `mkMat` never set `vertexColors: true`, so every painted band was ignored. **LAW: when a
   critic repeats a complaint about paint you shipped, check the material flags before
   repainting.** (Corollary found same day: vertex colors MULTIPLY the material color — a
   dark vertex base makes lightening the material a no-op; author one of the two white.)
2. **The def finish hooks.** Six rounds of "glossy black plastic / chrome streak" traced to
   `dragonModel.js` defaults (`roughness 0.38, metalness 0.12`, full envmap) on the smooth
   neck spheres — fixed by def hooks `bodyRoughness / bodyMetalness / bodyEnvIntensity`.
   Same class as the earlier `rimCruise`-is-a-color and `eyeEmissiveI 2.2`-ACES-clips-to-cream
   finds. **The new-dragon def checklist is now: scales, horn, rimCruise(+Base), half-bright
   apexSeam, feverWing/wingMembraneEmissive black, eyeEmissiveI, bodyRoughness/Metalness/Env.**
3. **The camera. ** The face-front mugshot stacked the chest under the head, poisoning six
   rounds of "neck wider than skull / starburst" reads; the wing-4× crop showed only
   undersides where the chord banding can't exist. Both channels were switched to the
   harness's honest hero tiles and the change was logged in the loop file, not hidden.
   **Meta-law extension: verify the MEASUREMENT means verify the crop too — measure what the
   camera actually frames before burning a round on geometry that's out of frame.**

**Identity under critique.** Critics repeatedly pushed toward a generically lighter dragon;
the identity laws held by converting their asks instead of obeying them: "add ember seams"
became a banked coal-bed *inside the maw* (glow at an opening, law 1) after the literal seam
strips rendered as LED tape and were reverted the same round; "brighten the hide" became
warm cooling-coal bias on raised char within the ladder (R≥G≥B, warmth-emitted law intact).

**→ Systematize.** The plateau diagnosis ladder, in order: (1) measure the built geometry
against the ask; (2) if met, measure the *pixels* (probe the crop); (3) if the pixels
disagree with authored paint, check material flags and def finish hooks; (4) only then
change shape. Every FORNAX plateau broke at step 2 or 3, never at 4.

**→ Leapfrog.** A future hero build should wire the def checklist and `vertexColors` from
I0 and stage hero-angle crops from round 1 — the ~8 rounds these lies cost FORNAX are the
cheapest thing the next dragon inherits.
