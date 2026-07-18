# MOBILE GRAPHICS DIET — keep the look, spend the milliseconds where a phone can see them

> Status: PLANNED (Fable-audited). Owner intent (2026-07-18): "for mobile I need to cut
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
| Extra full-screen passes | bandwidth (worst) | low | 3 ShaderPasses + bloom chain (`postfx.js:288-311`) |
| MSAA on a post RT | bandwidth resolve | ~invisible | 4× on HalfFloat RT (`postfx.js:286`) |
| Planar reflection (2nd scene pass) | vertex+fill+RT | ~invisible in motion | water mirror 768²/384² (`water.js:539-545`) |
| Full-res god-ray march | fill | same at half-res | 40 taps full-res (`godrays.js:265`, F2) |
| Chromatic aberration | needs the pass | reads as blur on small screens | tier0 only already (`postfx.js:395`) |
| Additive overdraw (geysers/gates/particles) | fill | thins fine | F3 ungated (`obstacles.js:413-532`) |
| Tonemap+grade+vignette+dither in ONE pass | ~free | high | ✅ already (`GradingShader`) |
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

**D1 — Cruise MSAA 4→0 on mobile tiers (F1). The big one.**
Arena already proves the lever (`main.js:1414-1439`); extend it: composer RT `samples`
becomes tier-scoped — tier0-desktop 4, tier0-mobile 2, tier1+ 0. Edge AA loss is masked
by dynRes scaling + the grading dither; industry answer to "no MSAA budget" is exactly
this. Expected ~arena-class gain (up to +10fps) in cruise. Keep `?msaa0/?msaa4` A/B.

**D2 — Half-res god-ray march (F2).** The march is a full-res fullscreen pass
(`postfx.js:299-301`); shafts are soft by construction — render at half res (¼ the
fill, ~75% of the pass free), composite up. Mask already runs at 0.5/0.25 duty 1/3;
untouched. No visible change at phone size (verify: skyprobe + side-by-side stills).

**D3 — Water mirror: earlier, cheaper exits.** Tier1 already halves rate + 384²; add:
mobile tier0 mirror 512² (from 768²), and extend the boss-diet mirror freeze
(`water.js:601-612`) to any sustained res-floor state, not just bosses. Planar
reflection is the classic first cut industry-wide; we keep it in cruise where it's the
water's identity, freeze it under load where nobody's looking at water.

**D4 — Additive overdraw diet (F3).** Geyser/gate/hazard additive FX are always-on
ungated fill in the forward view (`obstacles.js:413-532`, `hazards.js:59-64`). Give them
a `setFxQuality(QUALITY_SCALARS[tier])` hook like particles already have
(`particles.js:29`): thin sprite counts, shrink quads (crop transparent borders), skip
garnish below 0.5. Also add the missing quality hook to the comet-wake trail
(`dragonCometWake.js` — currently the only per-frame FX with no gate).

**D5 — Fold grading into OutputPass (F4) + boss Rung 2.** One fewer full-screen
store/load for every frame on every device; zero visual change (same math, one pass).
Then finish boss-diet Rung 2 (rain/sea/halo levers — wired, `main.js:1583-1596`, never
applied) so the 20fps boss floor gets its second rung.

**D6 — Tier-gate the dragon surface shader (deferred until measured).** The Worley
cellular-scales patch is two 27-tap 3D loops per fragment
(`dragonSurfaceShader.js:88-128`) — fine at cruise screen coverage, a spike risk when
the dragon fills the frame (photo/shop/cutscene, boss close-ups). Add a `uSurfTier`
that swaps Worley→normal-map-free flat scales at tier≥1 **only if** a probe shows it
matters; rim/SSS/iridescence stay (they're the look).

**Explicit non-cuts:** don't touch bloom (measured innocent, 07-13 control ~0); don't
raise the dpr cap (rejected, `GRAPHICS-OVERHAUL.md:575`); don't gate skyIbl/propAO
(free); don't add an AA pass to replace MSAA (FXAA = the full-screen pass we just
removed, and it blurs the dither).

## D. Mobile vs desktop: one new axis, not a fork

Add a boot-time `deviceClass` (coarse-pointer/touch + UA-CH heuristic, overridable
`?device=mobile|desktop`) consumed ONLY where this plan names it (D1 samples, D3 mirror
res). Everything else stays on the existing measured tier/dynRes ladders — they already
distinguish real capability better than any UA sniff, and desktop keeps 4× MSAA, 768²
mirror, full-res march (D2 applies everywhere; it's invisible on desktop too, but ship
it behind `?grhalf` A/B first). No second render path, no palette fork: tier2's
palette-breaking look stays the floor of last resort, protected by the capable-floor
rule (`main.js:1524-1528`).

## E. Order + gates

D1 → D2 → D5(fold) → D4 → D3 → D5(rung2) → D6(probe first). Each PR: run-all green,
tricount/tiershots/bandshot unchanged where the feature is off, owner-phone
`?debug=perf` numbers in the PR body (target: Tempest boss min ≥40, cruise p95 ≤20ms at
res ≥0.73), Fable Gate 2 ≥8 on stills at phone-scale viewport. Lesson file per landing.

## F. What success looks like

The phone stops paying for: an invisible MSAA resolve, a full-res march for soft
shafts, a mirrored world it can't see under load, and unbounded additive fill — while
keeping every feature a player can actually point at: the graded warm image, the lit
hero, AO-grounded props, the dither that makes gradients premium. That's the industry
mobile recipe (Genshin/Fortnite low tiers) applied with our own measurements, and it
converges with the existing F-series instead of inventing a parallel plan.
