# Lost Lagoon v3 — PR-0 palette substrate (jungle drowned temple)

**What we did.** Laid the palette substrate for the ground-up Lagoon prop rebuild (LOST-LAGOON-HANDOFF
§7.2) BEFORE building any v3 prop, so every new form inherits the warm-and-green golden-hour identity
from its first render instead of being retuned prop-by-prop. Five moves, all render-only:

1. **Crown → honey.** `_LAG_BLEACH` moved off the old cold bone-bleach `0xe6d3a8` (that value is
   Glacier/Hollowgate turf) to warm HONEY `0xe8c98f` — SE-Asian limestone at golden hour. The Lagoon is
   the cycle's only warm-AND-green biome; the crown was the one stop still reading cold.
2. **Foliage → three stops.** `bakeLilyFoliage` went from a 2-stop normal key (olive / shadow) to a
   3-stop value ladder: sunlit olive-gold `0x9fae4a` → mid **fern** `0x55803e` → shadow jungle `0x27452c`
   (deeper + more saturated, so the green never rhymes with the Mire's biolume teal). The middle band
   opens at `upThresh − 0.45`, so a leaf (`upThresh 0.35`) gets olive-top/fern-flank/shadow-underside
   (three zones), while a root (`upThresh 0.75`) keeps its flanks shadow (its mid band sits ≥0.30) — the
   strangling-dark read is preserved. One threshold, one bake.
3. **`bake:'temple'`** — a SECOND stone geology (`bakeTempleLadder`: amber crown / moss-verdigris tide /
   laterite drowned) sharing the karst limestone's material + draw group via the composite per-part tag,
   so a drowned temple can read as different stone from sea-karst without a second material.
4. **`bake:'bloom'`** — lotus-bloom blush (`bakeBloom`: lit petal `0xf2c7a6` / deeper body `0xc98a6e`),
   a second warm hue the roster lacked, deliberately NOT magenta-adjacent (that lane is role-locked to
   danger bullets — bulletcontrast law). Diffuse only; gilt stays the only warm emitter.
5. **Water shallow → jade-turquoise** `0x2f8578` (from `0x2b7a70`) in `biomes.js` — El Nido jade, greener-
   biased. The palette law: **deepen the jade, never the gold; never blue water.**

**The reusable pattern — palette substrate as its own PR.** A prop-vocabulary rebuild's palette belongs
in a PR-0 that ships the bakes + hues with NO new geometry consuming them yet. `temple`/`bloom` are latent
until PR-2/PR-4 build props that tag parts with them; adding the merge buckets now is free (no existing
part carries the tag, so every current output is byte-identical) and means karstfang/prasat land on a
finished palette in round one, not round three.

**Gotcha / why it's determinism-safe.** All five moves are render-only vertex-colour / material hue
changes. `tests/gold-determinism.mjs` stays byte-identical (it checks rings/obstacles/embers, never prop
vColors), `envcount` green (no tri change), `bulletcontrast` green (the jade-water nudge kept the LOST
LAGOON magenta-danger contrast — no new failing row). The composite-bake tag system (foliage-bake lesson)
extends by **adding a bucket + a bake fn, never reclassifying after the merge** — each tagged subset is
baked before the final merge so per-vertex colours survive it.

**What it unlocks.** The full v3 roster (karstfang → prasat → figgate → mangrovehold → lotusraft →
nagawall) now has: honey karst limestone, amber temple sandstone, three jungle greens, lotus blush, and
jade tidewater — every hue the six nameable silhouettes need, on one 2-material contract.
