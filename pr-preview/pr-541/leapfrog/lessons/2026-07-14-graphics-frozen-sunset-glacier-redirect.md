# 2026-07-14 — graphics: Frozen redirect — ossuary REJECTED on preview → "The Sunset Glacier"

**Why.** The A1 Frozen "bone ossuary" (ribspire/vertebrae/penitentes/serac) passed every headless gate and
a harsh Fable Gate-2 (6/10 REVISE) — then the OWNER flew the real preview and rejected it outright: "weird,
doesn't make sense, no beauty or awe." A Fable art-director assessment + my own eyes on a render confirmed
it. Rebuilt the biome as **THE SUNSET GLACIER**.

**THE load-bearing lesson: I can render the game, and I must — headless green ≠ good.** I had claimed "no
WebGL in CI, I can't see the preview." The owner corrected me: this environment has Chromium + Playwright
(the repo's own `tests/browser.mjs boot()` renders a live WebGL scene). I wrote `tools/frozenshot.mjs`
(boots `?biome=2`, warps through distances, screenshots new vs `?props=v1`) and looked. The truth was
instant and damning: the ossuary read as a **small dark backlit CLUTTER-CLUMP** near the horizon — the
bone-white never showed (props silhouette to near-black against the bright sun), no scale, no hero, aimed
at unease not awe. **Every numeric guard (envcount, determinism, tri caps, even the 0-NaN place() scan)
was green while the thing looked bad.** Rule, now permanent: for any visual change, RENDER IT AND LOOK
(and show the owner the PNG) before claiming it works. The geometry-vs-appearance gap is total; the harness
proves it builds, only eyes prove it's beautiful.

**Why the ossuary concept was wrong (not just under-polished).** (1) A "half-buried skeleton" needs
anatomy/continuity/texture to read — flat-shaded instanced primitives at flight speed can't pronounce it,
so the player asks "what IS this?" (fails BIOME-DESIGN Law 2, screenshot-readable). (2) It aimed at
morbid unease; the owner wanted awe — wrong emotion cleanly hit. (3) Compositionally it was NOISE: ~247
mid-size broken props/side, every one a "cluster with a story" (fracture beats, fallen tips, tooth-beds) =
mid-frequency static with no focal hero. **Awe is the opposite grammar: a FEW colossal, intact, luminous
forms with negative space** — Journey/SotC/a real glacier, not a rubble field. (4) The light was
withheld: a biome named FROZEN with no ice cue (dead bone-grey `0xd8d2c2 @0.05` emissive), and prop-grey ≈
fog-peach in value so silhouettes dissolved to mush.

**The redirect — "The Sunset Glacier" (bible: `reforged/SUNSET-GLACIER-BIBLE.md`).** Frozen = the
MONUMENTAL biome: a corridor of colossal LUMINOUS blue-ice spires rising from a low fog-sea, rimmed gold by
a sunset shining *through* the ice, with a paired-spire **Sun Gate** framing the low sun. The theology that
generates everything: **cool light lives IN the ice; warm light only ever comes FROM the sun.** Distinct
from Aurora (the other, owner-approved ice biome) by inversion: Aurora = night / sky-hero / dark-low ice /
green-in-sky; Frozen = sunset / prop-hero / luminous-colossal ice / gold-on-blue-in-the-ice. Every element
themed (a Fable "total biome" brainstorm): props, DIAMOND-DUST air (fall 3.5→0.35 = stillness), luminous
ice material, dual-fog melt + heightK fog-sea, golden-mirror water, gilded soarers, and free wins found in
shipped systems (occlusion-masked god-rays → the Sun Gate carves real light shafts; the whale-slot → a
future Cathedral Berg landmark; the water mirror doubles everything).

**What shipped this pass (render-driven, two iterations).** biomes.js Frozen retheme (sky.sun hotter, near
fog cool rose-quartz `0xbfa9c0` + `fogFarColor 0xffa268` dual-fog melt, hemiGround `0x6b5a66` fog-sea
bounce that fixes the black-underside problem, water near-mirror `waveAmp 0.22` over `0x0e2440` deeps,
diamond-dust motes, soarer fauna, `atmos.heightK 0.05`). makeMats primary[2] → luminous `0xbfdce6` @
emissive `0x357088×0.42`; accent[2] → cyan core `0x3fc8e8×0.85`. Five new archetypes replace the ossuary:
`candle`/`sungate`(paired)/`sail`/`floeshelf`/`glacierwall`; `makeBand` gained a `paired` path (shared
per-slot dist jitter so gate-posts land at the same z on both sides — render-only, determinism-safe).
Frozen dropped from 496 inst/46.5k tris to **208/15.8k** (the ~2/3 restraint the awe read needs).

**The premium iteration that mattered (owner: "premium or it's a fail; detail, depth, richness").** First
render: the atmosphere was a huge win but the spires read as **thin reedy needles** (aspect ~10:1, backlit
to silhouette). Fix: chunkier faceted towers (broad 3-strata frustum stacks, base r 3.5→5-8, less taper),
a fused companion blade for richness-without-clutter, a taller visible cyan core seam, and emissive 0.32→
0.42 so the ice glows lit-from-within in backlight. Second render: faceted blue-ice towers with real
rim-light + gold glints, mirrored in the golden water — a genuine premium sunset glacier. **GOTCHA banked:
three.js `ConeGeometry(r,h,n)` = 3n tris (2n sides + n base cap), NOT 2n — my candle blew the 150 cap at
164 before I recounted.**

**Verify.** envcount `--ci` green (all props ≤150t, Frozen 208/15.8k under caps, 0 transparent surfaces);
createEnvironment 0-NaN; gold-determinism byte-identical (render-only + paired jitter is off the level rng);
bulletcontrast pass (magenta stays legible over the new sunset palette); biomecycle 11/11. Look confirmed
on real renders at 700/1500/2600m.

**Still open (next passes, per the bible sequencing + owner's bar).** Judge scale/awe up-close on the
preview with the owner (the arbiter of "premium"); then sky SUN PILLAR (branchless xMix), the flyby
generalization, the Cathedral Berg landmark, and the **mobile 60fps optimization pass** the owner
requested. `WALL-PROPS-REDESIGN.md §4.2` still documents the rejected ossuary and must be rewritten to this
vision (it is the authority downstream builders read). Do NOT migrate the method to A2+ until Frozen clears
the owner's awe bar.
