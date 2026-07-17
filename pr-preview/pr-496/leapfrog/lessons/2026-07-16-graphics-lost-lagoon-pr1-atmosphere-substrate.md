# Lost Lagoon PR-1: the atmosphere substrate transforms 100% of pixels first (biome consolidation)

**What we did.** Opened a full premium overhaul consolidating the old **Sunken Sanctuary + Amber
Wastes** into ONE biome — **THE LOST LAGOON** (a lost, hidden watery paradise of drowned ruins at
golden hour; NatGeo × Ghost of Tsushima × BotW). Fable-directed (full build sheet →
`reforged/LOST-LAGOON-BIBLE.md`), gated per-element. PR-1 is the **atmosphere + materials
substrate**: a pure `biomes.js` biome-0 data retune (sky/fog/water/light/particles/fauna), no props
yet. Fable-gated **4.4/5** on the first pass. Determinism byte-identical, biomecycle 11/11.

## Reusable lessons

1. **The cheapest PR transforms the most pixels — do it first.** PR-1 touched only the biome-0
   atmosphere fields (jade water `0x07262e→0x2b7a70` waveAmp 0.42, dual-fog humid-teal→rose-apricot,
   heightK 0.03 mist, jade `hemiGround` bounce, petal particles, egret fauna) and it flipped the
   whole biome's identity — a navy "ocean at dusk" became an unmistakable jade lagoon. The legacy
   placeholder props now read as drowned ruins against it *for free*. Prove the substrate reads as a
   NEW biome (blind-test vs every shipped premium biome) BEFORE building a single prop; the props
   land on a foundation that's already stronger than they are.

2. **A biome's distinctness lives in the WATER + near-fog, not the sky.** Three biomes now stage a
   low gold sun (Frozen far-fog, Caldera horizon, Lagoon). The blind-test passes because the LOWER
   HALF of every frame is jade (water) + humid teal (near-fog) while the gold is only a horizon
   accent. The standing rule when a frame drifts toward a sibling's sunset: **deepen the jade, never
   add gold.** The sky is the shared element; the ground plane is where identity is won.

3. **The bulletcontrast dead-zone is a real gate, and the role-locked magenta danger bullet can
   only be fixed by moving the FOG.** `tests/bulletcontrast.mjs`: a bullet clears a background if
   `|L_bullet − L_bg| ≥ 0.15` (direct) OR the layered outline/core read covers it
   (`L_bg ∈ [0.28, 0.75]`). Our first fog `0x214a52` (L≈0.26) sat in the dead zone — too bright for
   the magenta danger bullet (L≈0.36) to clear directly, too dark for the layered read. Danger is
   role-locked (hue/L fixed), so the ONLY lever is the fog: nudge it to `0x2a5a62` (L≈0.31) so it
   enters the layered-read window and every bullet clears. Re-run `bulletcontrast` after ANY palette
   move; if danger fails, move the fog, not the bullet.

4. **Consolidating two biomes = retheme one slot, ABSORB the other's role, retire it from CYCLE
   LAST.** The Wastes' bleached-bone becomes the Lagoon's above-tide ladder stop; its "brightest
   breather" role passes to the golden hour. BIOMES[1] stays appended (indices are IDs — never
   renumber); its archetypes park behind `?props=v1`; the `CYCLE` drop is its own PR done LAST, after
   the owner signs the hero — never retire the breather before the paradise can carry the slot.

## What it unlocks

The Lost Lagoon identity is proven at the substrate level (theology "the light passes THROUGH,
window by window, down to the water"; a position-keyed TIDE ladder; gilt-in-apertures glow; the only
green/vegetated biome in the cycle). PR-2 builds the hero `rotunda` (a pierced dome — a curve no
shipped biome owns) on this foundation, which will get its mirror reflection and tide-band gradient
for free. Full plan + roster + hazards + anti-replication audit in `reforged/LOST-LAGOON-BIBLE.md`.
