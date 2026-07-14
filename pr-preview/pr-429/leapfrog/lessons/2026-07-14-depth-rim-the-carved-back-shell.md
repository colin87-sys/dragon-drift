# Depth rim-light — a rim SEPARATES (it isn't brightness), and the depth-carved back-shell renders it

**What we did.** Composition #1 v1 ("fire-rim the boss") was rejected: owner wanted **"a super subtle glow
around the rim of the boss to give depth"** and said the fire version "ruins the contrast of the boss vs the
background." Two Fable specialists (art director for the LOOK, engineer for the TECHNIQUE) diagnosed it and
the redo is a clean subtle depth rim. This supersedes the `fire-carved-seraph` lesson's *approach* (its
diagnosis of the existing igniteK system stands; its fire *execution* was wrong).

**The headline art lesson — a rim light's job is SEPARATION, and brightening a dark subject's edge toward the
background's value CAMOUFLAGES it instead.** A silhouette is read at its boundary. The fire edge pushed the
boundary pixels into the *same hue and luminance band as the bright blast behind them* → where edge ≈
background, the contour doesn't glow, it **disappears**. Then bloom (crossing threshold 1.0) physically smears
those bright boss-edge pixels *across* the figure/ground line into the sky, mixing the two. So a bright edge on
a dark-subject-vs-bright-background did the exact opposite of a rim: it deleted the contrast the silhouette is
built on. **A rim must contrast with the background it separates from** — against a bright field that means a
dark subject is *already* separated by value; the rim's only jobs are (a) a whisper of edge that says "3D form,
not flat cutout" and (b) INTERIOR modeling (wing-over-wing), which is dark-on-dark and contrast-safe. Never
luminance that competes with the background.

**The technique — the depth-carved dilated back-shell (renders a clean rim where fresnel can't).** Fresnel
(`pow(1−|dot(n,v)|,k)`) fails on flat camera-facing cards: it's ~0 exactly where the rim must live (the
silhouette is flat faces facing you) and glitters on the 0.05u side-walls. The clean answer:
- Clone the subject's geometry into a **shell**, dilate each vertex **radially outward in a merged-local XY
  frame**: `p.xy += (p.xy / max(length(p.xy),1e-3)) * uRimW` — a CONSTANT-width dilation of the true outline
  (normal-based dilation moves flat faces in Z, not outward; pivot-relative scaling makes the rim ∝ distance).
- Place the shell **just BEHIND** the real geometry (z −0.6 wing-local), additive, `depthWrite:false`, but
  **depth-TESTED**. The subject's own opaque geometry (which writes depth) then **razor-cuts the shell**: shell
  fragments behind the subject are early-z rejected; only the thin band that peeks OUTSIDE the silhouette
  survives. **The depth buffer is the edge detector** — the inner edge is pixel-exact and tracks every
  animation (breath, mantle, fold) for free, zero plumbing.
- Parent the shell to the subject's animated pivot → it inherits scale/mirror/breath registration.
- Cost: +1 draw per part (8 wings → +8), only while engaged; visible fill ≈ outline × ~2px (interior early-z
  rejected) → NOT a large additive volume (the ≤2 cap is about coverage, not draw count). Bonus: dilated
  feathers fill inter-feather gaps narrower than 2·uRimW → the "light burning through the gaps" read for free.

**The bloom/probe law (measured twice now) — the bloom HALO is the cost, not the source pixels.** A
broad-area median/quantile probe (sky p50, corridor p90) is nearly insensitive to a thin line but brutally
sensitive to a bloom halo (the fire tips = ~0.11 of a +0.13 blowup; a tight ridge only −0.017). So: keep the
rim **below the bloom threshold by construction** (`RIM_MAX ≤ 0.3` linear; even where two shells overlap ≤ 0.6
< 1.0) — no HDR term anywhere — and the thin outline covers ~1–3% of the band → the median can't move. This
recovered real margin (the fire version was a 0.545 knife-edge; the shell lands well under).

**Art numbers (the plug-ins):** hue **warm rose-bronze `0xd79a66`** (the blast's gold *grazing* dark matte
feathers — reflected light; NOT saturated fire = camouflage, NOT cool moonlight = that's the void's identity),
`uRimW 0.16`, root-fade `smoothstep(1.6, 3.2, fanR)` (even along the fan, not a fingertip bias), **upper-arc
weight** `smoothstep(-0.05, 0.45, ndcY)` (crown/blast-facing lit, lower feathers → 0 = dark, spares the parry
corridor), one energy dial `RIM_MAX 0.30` hard-capped sub-bloom. Squint test governs sign-off: the frame must
still read as *one huge dark angel punched out of gold light*, now with a hair of edge depth.

**What stayed (subtract, then add one clean thing):** deleted the fire-tip emissive; reverted the mandorla to
its shipped soft aura; KEPT the existing modest bronze re-tint/emissive (it was already ~80% of a correct
sub-bloom painted rim); added only the shell. `?rim=depth|fire|old` A/B (all byte-identical at igniteK 0).
`voidK` path untouched + mutually exclusive.

**Verify.** smoke + bossboot zero-error (the standalone shell ShaderMaterial compiles; the position-only geo
clone/merge is NaN-free — clamped normalize + clamped w-divide). `unmaskedarena`: `rimShellVis === true` +
`rimGlow > 0.9` in the settled heaven, `false`/`0` at the S2 pin + void; sky p50 well under 0.55 (the depth rim
barely moves it, unlike the fire version). **Owner judges on real GPU:** whether the sub-bloom band reads as
"whisper" or "invisible" after ACES/bloom (the background's own bloom may already provide half the wrap — if
so, dial down), 1–2px shimmer with heaven MSAA off (escalation: a second shell at 2×width/half brightness for a
stepped falloff), and the squint test. Dial: `RIM_MAX` (0→cap).
