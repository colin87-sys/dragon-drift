# The two-value wing: the black "cord" was a shared near-black material + migrated floor (2026-07-20)

**What happened.** The owner kept seeing "giant thick black parts of the wing cord" on the
seraph — for a long time, across my previous "fixes." I'd twice guessed it was "the covert
region" and lifted it with an emissive floor; the owner still saw black. This time: a
material-ID diagnostic (`?wingparts` — each wing part flat-colored) pinned the exact geometry,
and a Fable technical-art diagnosis (pixel-classified against the real render) found THREE
stacked causes I'd missed.

**The real causes.**
1. **A single shared material made a two-value wing.** `buildAngelWing` takes one `material` that
   overrides coverts, under-lens, arm AND the covert strips — so the whole inner half of each wing
   was ONE near-black value, while the flight feathers were the brighter rim. Bright-blades +
   black-inner reads as "the black part" no matter the absolute luma. The "thick" mass is the
   broad UNDER-LENS backing; the "bumpy" edge is the scallop covert strips riding on it.
2. **An emissive floor on ONE family migrates the black, it doesn't kill it.** My floor lifted the
   covert `baseMat` from luma ~5→35, but the un-floored flight ranks (`rimMatB`) then became the
   darkest thing (median 25, below the L31 sky). The darkness moved; the owner still saw holes.
   Floor ALL material families or the black just relocates.
3. **Vertex-color ramps multiply DIFFUSE only** in stock three.js — invisible exactly where the
   wing is dark (unlit faces show only emissive). So the per-feather `valueBand` drew NO structure
   on the shadowed covert faces: a featureless black sheet, not feathers.

**The fix (measured, on the home-biome backdrop).** (a) A distinct MID tier (`midMaterial`) for the
covert strips + under-lens — albedo LADDER×1.35 + a warm-slate emissive floor that CARRIES the
per-wing rank separation (albedo is invisible unlit). (b) Real emissive floors on all three families
so nothing drops below sky. (c) An `onBeforeCompile` one-liner —
`totalEmissiveRadiance = emissive * vColor` — so the `valueBand` ramp draws feather structure on
unlit faces. (d) Extend the void/ignite arena states to lerp the MID tier's emissive so the cord
rises WITH the rims live (a diffuse-only lerp is invisible on unlit covert faces). Result: covert
luma 35→**59** (~1.6× the L37 sky), flight 29→**44**, three readable steps, no pixel below sky.

**The reusable laws.**
- **Diagnose geometry with a material-ID render, don't guess.** `?wingparts` flat-colors each part;
  the culprit is unambiguous. Three guesses cost more than one diagnostic.
- **A wing's interior needs its own value tier.** One shared near-black material = a two-value
  object. Root→covert→flight wants THREE tiers (registry tell #12), and for unlit regions the
  separation must live in EMISSIVE, not albedo.
- **An emissive floor must cover every material family, or the black migrates to the un-floored one.**
- **To make a vertex-color value ramp survive shadow, multiply emissive by vColor** (`onBeforeCompile`);
  the stock pipeline only applies it to diffuse.
