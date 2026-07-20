# MOBILE GRAPHICS DIET — keep the look, spend the milliseconds where a phone can see them

> Status: PLANNED — Fable-audited (round 1: REVISE 6.5 → all 5 required fixes applied
> below; see Gate Log at bottom). Owner intent (2026-07-18): "for mobile I need to cut
> things and only keep things with the most graphical progress per fps — trim things that
> don't add much but eat a lot of fps." Desktop keeps the full chain.
>
> Grounded in: an industry research pass (Arm post-FX guidance, Vulkan tile-based
> best-practice, Fortnite/Genshin mobile tiering, three.js mobile practice) + a full
> audit of our pipeline (`GRAPHICS-PERF-PLAN.md`, tier system `main.js:1360-1634`,
> `postfx.js`, `godrays.js`, `water.js`). Follows THE RULE: coexist → prove on a hero
> (owner's phone, Tempest boss) → migrate; never break the shipped roster.

## A. The physics we're planning against

On tile-based mobile GPUs (Mali/Adreno/Apple) the budget currency is **bandwidth and
fill, not ALU**. Every extra full-screen pass or render-to-texture forces a full-frame
store+reload of the tile memory; resolution cost is quadratic. Our own measurements agree
with the literature exactly:

- Halving draw calls (~550→252) moved fps **0**; `?pr=1` alone hit 60 with ALL effects on
  (`GRAPHICS-PERF-PLAN.md:110-115`). We are fill-bound, full stop.
- `?msaa0` alone = 60fps at full 1.5× res in the arena (F1 basis). MSAA is "free" on tile
  GPUs only direct-to-canvas; resolving a 4× HalfFloat composer RT (`postfx.js:284-287`)
  is the opposite — it's our single most expensive invisible feature.
- Owner phone, Tempest boss: gpu 48ms vs sim+draw 2ms — min 20fps
  (`leapfrog/lessons/2026-07-18-graphics-boss-fight-perf-diet.md`).

Industry verdict-per-technique, mapped to us:

| Technique | Mobile cost class | Value on a 6" screen | We do |
|---|---|---|---|
| Extra full-screen passes | bandwidth (worst) | low | RenderPass + bloom chain + 2 ShaderPasses (godray, grading) + OutputPass (`postfx.js:288-311`) |
| MSAA on a post RT | bandwidth resolve | ~invisible | 4× on HalfFloat RT (`postfx.js:286`) |
| Planar reflection (2nd scene pass) | vertex+fill+RT | ~invisible in motion | water mirror 768²/384² (`water.js:539-545`) |
| Full-res god-ray march | fill | same at half-res | 40 taps full-res (`godrays.js:265`, F2) |
| Chromatic aberration | needs the pass | reads as blur on small screens | tier0 only already (`postfx.js:375,380`) |
| Additive overdraw (geysers/gates/particles) | fill | thins fine | F3 ungated (`obstacles.js:413-532`, `hazards.js:163-165,188-192`) |
| Grade+vignette+dither in ONE pass | ~free | high | ✅ (`GradingShader`) — but tonemap is a SEPARATE OutputPass (`postfx.js:303,305`); fusing them is D2's win |
| Vertex AO, baked lighting, SH sky probe | free at runtime | high | ✅ propAO, skyIbl rung 1 |
| Fresnel rim / emissive in-material | cheap ALU | high (the "lit hero" read) | ✅ dragon surface |
| Blob/contact shadow | pennies | grounds the hero | ✅ default blob |
| Dithered gradients | ~free | kills banding | ✅ N1 |
| Resolution scale as throttle | the #1 lever | ~invisible to 1.5× | ✅ dynRes floor 0.45 |

**Headline: our KEEP column is already industry-correct.** The diet is not "delete
features" — it's five surgical fill cuts (mostly already named F1–F4 + boss Rung 2),
plus tier-gating the three things the tier system currently can't see.

## B. What we KEEP on every mobile tier (the graphical progress, protected)

ACES/Neutral tonemap · the single grading pass (sat/vibrance/contrast/vignette/**dither**)
· sky-IBL SH probe (CPU, free) · prop vertex AO (baked, free) · dragon surface fresnel
rim + iridescence + membrane SSS (small screen coverage in cruise) · blob contact shadow
· instanced props · atmosphere far-color mix · aurora quiet arc · particle thinning.
These are the highest perceived-quality-per-ms items we own; none of them is why the
phone drops frames.

## C. The cuts — ranked by ms recovered per point of look lost

Each is one PR, Gate 2 Fable-scored, proven on the owner-phone hero probes
(`?debug=perf`, Tempest boss + Aurora Shallows cruise), tiershots/bandshot for regression.

**D1 — Cruise MSAA diet on mobile (F1). The big one — shipped carefully.**
Arena already proves the lever (`main.js:1414-1439`). Composer RT `samples` becomes
**deviceClass-scoped, set ONCE at boot** — desktop 4, mobile 2 — NOT per-tier: a
per-tier delta would realloc both composer RTs (`postfx.js:346-352`) on every 0↔1
oscillation that capable devices are *designed* to make (`main.js:1524-1528`), a
recurring hitch on exactly the good phones. Mobile 2→0 only via the existing dynRes
STAGES ladder (a rung before resolution trims), with the arena's `skipQualityFrames=2`
guard (`main.js:1438`) wired so the realloc frame never feeds the tier signal, and
never re-raised un-masked. Honest caveats the round-1 audit demanded: the `?msaa0`=60
measurement is the *heaven arena* (soft additive, no hard edges) — cruise has hard
silhouettes and is already resolution-trimmed, so **A/B 2× on-device before ever
shipping 0** (F1 wanted exactly this), expected gain is real but unproven in cruise;
and mobile STAGE 0 is then **no longer byte-identical to the shipped look** — stated
here explicitly, and the tiershots/dynRes stage-0 invariant must be re-scoped to
desktop. Keep `?msaa0/?msaa2/?msaa4` A/B. Edge loss mitigation: dynRes dither + no
FXAA replacement (that would re-add the pass we're cutting).

**D2 — Fold grading into OutputPass (F4). Zero look lost — so it ranks second.
✓ LANDED 2026-07-19 (first rung shipped; Gate 2 REVISE→addressed — see Gate Log).**
Tonemap (`OutputPass`) and grade/vignette/dither (`GradingShader`) were TWO
full-screen passes; they are now ONE fused `OutputGradePass` (default) — removing a
full-frame store+load of the multisampled HalfFloat RT (an MSAA store+resolve+reload,
since the old `OutputPass` hop wrote into the 4× RT) on every frame on every device.
`?gradefold=0` restores the shipped two-pass chain (the A/B / refutation control);
both shapes are assembled from the SAME grade GLSL strings so the control can't
drift. **Identity is EXACT (≤1 LSB) only at aberration 0** — the whole tier-1
mobile-diet audience (chromatic aberration is tier-0-only, `_aberrationOn=false` at
tier1) plus all low-speed play. **With CA active it's a JUSTIFIED, inherent
deviation:** the old chain bilinear-filtered the *already-encoded* intermediate at
the 3 CA offsets, but the fold removed that intermediate, so the fused pass filters
*linear HDR then encodes* per tap — since encode is non-linear the two differ on
glint edges (up to ~105/255 on ~0.1–0.3% of pixels at live CA; meanΔ ≈ 0.07 LSB, an
edge-local split, not a global cast; arguably the more physically-correct
dispersion). `tests/gradefold.mjs` pins BOTH regimes (ab 0 ≤1 LSB; ab 0.025 →
>8-LSB fraction <1%, meanΔ <1 LSB). The Gate-2 correction: the earlier
"byte-target-identical, never a math change" was an overclaim; the fold is still the
right zero-look-at-rest first rung, and by this plan's own metric (ms per look lost) a
free pass-merge outranks every cut that spends look — but the deviation is now
recorded, not papered over (D1 explicitly gives up byte-identity next, so the
ladder's identity claims have to be exactly as strong as stated).

**D3 — Half-res god-ray march (F2).** The march is a full-res fullscreen pass
(`postfx.js:299-301`); shafts are soft by construction — render at half res (¼ the
fill, ~75% of the pass free), composite up. Mask already runs at 0.5/0.25 duty 1/3;
untouched. No visible change at phone size (verify: skyprobe + side-by-side stills).
Ship behind `?grhalf` A/B first; applies to desktop too once proven.

**D4 — Additive overdraw diet (F3).** Geyser/gate/hazard additive FX are always-on
ungated fill in the forward view (`obstacles.js:413-532`; vent flare sprites
`hazards.js:163-165,188-192`). Give them a quality hook riding
`QUALITY_SCALARS[tier]` exactly like `setParticleQuality` (`particles.js:29`): thin
sprite counts, shrink quads (crop transparent borders), skip garnish below 0.5. Also
add the missing quality hook to the comet-wake trail (`dragonCometWake.js` — currently
the only per-frame FX with no gate).

**D5 — Water mirror: cheaper ceiling + a properly-latched cruise freeze.** Tier1
already halves rate + 384². Add: mobile mirror ceiling 512² (from 768²) — safe, rides
the construction seam (`water.js:669-675`). The boss-diet freeze
(`water.js:601-612`) may extend to cruise **only with the same latch discipline the
07-18 lesson was built on**: engage only under a masking event (biome crossfade /
tunnel carve) after sustained res-floor `owned:false`, release only under the next
masking event, never restore un-masked, one-way per stretch — otherwise a
recovered device snaps a stale mirror RT back to live mid-flight, the exact
mid-play pop the lesson exists to prevent. If no clean masking seam exists in open
cruise, ship only the 512² ceiling and drop the freeze extension.

**D6 — Boss diet Rung 2.** The rain/sea/halo levers are computed but collapsed at
`main.js:1602` (`engaged = bossDietRung >= 1`) — actually apply rung 2 so the 20fps
boss floor gets its second step. Same one-way latch + FELLED-wash release as Rung 1.

**D7 — Tier-gate the dragon surface shader (probe first, build maybe).** The v2
`cellularScalesNormalPatch` (`dragonSurfaceShader.js:145-190+`) adds derivative
height-field sampling on top of the 27-tap Worley cell loop (v1 patch,
`dragonSurfaceShader.js:88-128`, one loop). First PROBE: which patch does the shipped
roster actually compile, and does full-frame dragon coverage (photo/shop/boss
close-up) actually spike on-device? The perf plan classed this minor. Only if the
probe shows a spike: `uSurfTier` swaps to flat scales at tier≥1; rim/SSS/iridescence
stay (they're the look).

**Explicit non-cuts:** don't touch bloom (measured innocent, 07-13 control ~0); don't
raise the dpr cap (rejected, `GRAPHICS-OVERHAUL.md:575`); don't gate skyIbl/propAO
(free); don't add an AA pass to replace MSAA (FXAA = the full-screen pass we just
removed, and it blurs the dither).

## D. Mobile vs desktop: one new axis, not a fork

The 07-18 lesson's reusable is "no device-class sniffing — hang the cut off the
resolution-floor `owned:false` handoff." We honor that: everything that CAN ride the
measured tier/dynRes/floor signals DOES (the MSAA 2→0 rung, the mirror freeze, all
D3/D4/D6 gates). `deviceClass` (coarse-pointer/touch + UA-CH heuristic, overridable
`?device=mobile|desktop`) exists ONLY for the two proactive boot-time choices no
measured signal can make before the first frame: D1's composer `samples` (4 vs 2,
set once, never touched live) and D5's mirror ceiling (768² vs 512², construction
seam). Known cosmetic misfire: touch laptops/tablets classify mobile — acceptable,
override exists. No second render path, no palette fork: tier2's palette-breaking
look stays the floor of last resort, protected by the capable-floor rule
(`main.js:1524-1528`).

## E. Order + gates

D2(fold, free) → D1(MSAA, A/B 2× first) → D3(march) → D4(overdraw) → D5(mirror) →
D6(rung 2) → D7(probe first). Each PR: run-all green; tricount/tiershots/bandshot
unchanged where the feature is off (identity checks — these ARE machine-gateable).
The fps targets (Tempest boss min ≥40, cruise p95 ≤20ms at res ≥0.73) are
**on-device-only**: headless/SwiftShader cannot measure GPU fill
(`GRAPHICS-PERF-PLAN.md:322-327`), so they're procedural Gate-Log entries from the
owner phone via `?debug=perf`, never claimed from CI. Known blind spot: tiershots
run desktop-class and will NOT catch the mobile MSAA/mirror look change — that
regression is judged on Fable stills at a phone-scale viewport + owner preview.
Fable Gate 2 ≥8 per PR. Lesson file per landing.

## Gate Log

| Date | Gate | Verdict | Score | Notes |
|---|---|---|---|---|
| 2026-07-18 | Plan audit (round 1) | REVISE | 6.5 | 5 required fixes: hazards.js cite, surface-shader v1/v2 cite, tonemap-pass claim, D3 latch discipline, D1 realloc/byte-identical — all applied in this revision; fold promoted to D2, deviceClass shrunk to boot-only |
| 2026-07-19 | D2 Gate 2 (pre-merge) | REVISE→addressed | 7.5→9 | Fable independently re-verified: shared GLSL token-identical vs `git show`; per-tap encode correct; N3 `CUSTOM_TONE_MAPPING` present + pixel-proven under `?tm=neutral`; `?gradefold=0` reconstructs shipped chain; handle stability; tier degradation correct (no new hook); guard green. **Real catch:** the "byte-target-identical" claim held only at aberration 0 — with CA active the fold filters linear-then-encodes vs the old encode-then-filter, diverging up to ~105/255 on ~0.1–0.3% of glint-edge pixels (both evidence probes + the guard had frozen frames at ab≈0, blind to it). Fixes applied: claim corrected to a recorded justified deviation (postfx.js comments, this doc, lesson); `gradefold.mjs` extended with a forced-aberration A/B pinning the envelope (ab 0 ≤1 LSB; ab 0.025 → >8-LSB <1%, meanΔ <1 LSB); owner CA-active A/B still shot for the preview; 22→21 count nit fixed. Fable: "with those landed this is a 9 and a clean SHIP." Human judges the CA-active surge moment on the preview |
| 2026-07-20 | D1 Gate 2 (pre-merge) | SHIP | 8.5→9 | Fable independently re-verified the five attack points: (1) `samples` set ONCE in the RT constructor, no tier path (`applyQuality`/`setPostTier`) touches it — the oscillation-realloc trap holds; (2) `deviceClass()` runs only at module load (BASE_MSAA/MSAA_DYN/`__dd.gfx`), never per-frame; (3) desktop/CI byte-identical by construction (`BASE_MSAA=4`, `MSAA_DYN` false → STAGES unchanged, `arenamsaa` passes unmodified), the `?msaadyn` 2→0 rung default-off + spliced before res trims, arena restores to base 2 on mobile; (4) no TDZ (BASE_MSAA builds its own URLSearchParams before `urlParams`; `__dd.gfx` assigned after STAGES); (5) no fps claims from CI. **Found (flag-gated correctness holes in the A/B seam):** F1 — `applyQuality` + `setDynRes(false)` reset the ladder but didn't restore `samples`, so a ?msaadyn-engaged 0 stranded (permanently on dynRes-off, where the governor block is then gated out); F2 — arena exit restored to base even when the rung still held 0. Both fixed via a `dynMSAATarget()` single-source-of-truth restored on every reset path (msaadiet 26/26). SHIP (default path clean); the rung stays default-off until F1/F2 + a masked-re-raise discipline + the owner's on-device 2× A/B number land. run-all 114/114 |

## F. What success looks like

The phone stops paying for: an invisible MSAA resolve, a full-res march for soft
shafts, a mirrored world it can't see under load, and unbounded additive fill — while
keeping every feature a player can actually point at: the graded warm image, the lit
hero, AO-grounded props, the dither that makes gradients premium. That's the industry
mobile recipe (Genshin/Fortnite low tiers) applied with our own measurements, and it
converges with the existing F-series instead of inventing a parallel plan.
