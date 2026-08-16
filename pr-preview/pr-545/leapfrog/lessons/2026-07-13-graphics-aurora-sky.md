# 2026-07-13 — Aurora PR-1: the authentic aurora curtain, spliced into the one sky-dome draw

**Why.** Aurora Shallows (BIOMES[6], night biome, owner's idea) needs a signature sky that reads as
REAL northern lights, not a decal ribbon. The hero deliverable is the aurora itself — provable on
`?flowrun&aurora=1` BEFORE the biome data exists (the owner tried the flag on the PR-0 plumbing and
saw nothing, because only the cycle refactor had shipped). This PR makes the curtain actually render.

**Did.** New `js/auroraSky.js` (AURORA_HEAD uniforms + self-contained `_aHash`/`_aNoise`, AURORA_BODY
curtain math, `auroraUniforms`, `applyAurora`/`setAuroraForced`/`setAuroraQuality`), spliced into the
existing sky-dome fragment in `environment.js` exactly like the N9 clouds — ADDED into the opaque dome
color, never a transparent shell (zero overdraw). Added the optional `auroraMix` biome channel
(0 in every shipped biome → byte-identical), the `?aurora=1` force read + tier switch in `main.js`,
`tests/aurora.mjs` (34/34), and `tools/aurorashot.mjs` (four time-spaced frames so the motion reads).

**The Gate-2 catch (why the montage gate is not optional).** The first render read as green *clouds*,
not curtains — Fable scored it 4/10 and found an **inverted color ramp**: `v = (hy-h0)*3` is 0 AT the
border, so `mix(fringe, green, smoothstep(0,0.12,v))` painted the brightest bottom line ROSE and only
faded to green ABOVE it — the rose skirt had literally stolen THE ONE THING (the green border). Fixed
by keying the ramp on elevation directly: `mix(uAurFringe, uAurGreen, smoothstep(h0-0.02, h0+0.005, hy))`.
Four more tuning edits took it to a curtain: a thin **hot-line** (`exp(-(hy-h0)*28)` × the intensity, so
the border is 2–3× the column — a real border POPS, it isn't just where the decay starts), a **second
fold octave** + bigger `h0` undulation amplitude (one octave = a single ruler-straight swell across the
FOV; the octave gives per-fold hairpins), a **narrower sheet** (`exp(-u*u*6)` not `*3` — a ribbon
silhouette, not a 20°-wide wash) with a **height shear** (`u += (hy-h0)*1.5*(fold-0.5)` — the top drifts
off its anchored border → "hanging fabric at an angle"), and **squared ray noise** (rn*rn sharpens
whisper striations into rays). Split the green into a diffuse column (0x54ff86) + a hotter 557.7nm border
(0x86ff5c). Lesson: a procedural sky effect is not done when it compiles and is the right hue — the
montage-vs-reference gate is where "plausible green" becomes "reads as the real phenomenon," and a
one-line ramp inversion can silently invert the entire identity thesis.

**The Gate-3 composition catch (the owner flew it and it read wrong).** The tuned curtain was
authentic in ISOLATION but composed badly in the frame: it clustered to one side, had a hard "invisible
line" across its bottom, and never touched the horizon. Fable's composition study (spawned on the owner's
request, with aurora-photography research) found each was structural, not a tuning miss: (1) the fixed
azimuth gaussians (`exp(-dot(az,axis)²)`) put each layer's bright locus at a fixed compass bearing —
dead-centre of the forward view was *mathematically* empty (`e^-37`); (2) the `below = smoothstep(h0…)`
cut went to exact zero with the brightest hot-line pixels sitting on it → it *was* a clip; (3) nothing in
the shader referenced the horizon at all, and the sub-border rose fringe was being multiplied to zero by
the cut before it could descend. The fix is a reusable **horizon-anchoring model**: (a) key the main arc
to the *damped travel direction* (`uAurFwd`, λ=0.35 → world-anchored during a weave, recentres over
~6–8s — never pinned decal-like, never lost off-frame) and gate it with a wide `smoothstep` envelope
across the forward hemisphere instead of a narrow gaussian, so it spans ~130° through centre; (b) drop
the border to the horizon at the arc *flanks* (`h0` keyed on `envC = clamp(dot(az,uAurFwd))`) so the ends
dive behind the world and foreground props/ridges crop it for free (the dome is already drawn after the
world → early-z occlusion was always free, it just had nothing to occlude because sky and land occupied
disjoint elevation bands); (c) replace the hard cut with `max(body, 0.30*skirt)` where
`skirt=exp(min(hy-h0,0)*9)` — a luminous rose underside so the border stands ON light; (d) add a
horizon airglow band `exp(-abs(hy)*7)` the curtains rise out of (brightest AT the sea-line, meeting its
own mirror reflection at the seam). Lesson: **an effect can be authentic in isolation and still fail as a
shot** — a sky element has to be composed against the horizon and the foreground silhouette, keyed to
where the player is looking, or it reads as a floating decal no matter how physically correct the hue and
border are. Compose the frame, not just the phenomenon.

**The Gate-4 art-direction pass (basic/tacky → premium).** The composed curtain read cheap because it was
a uniform mid-bright *green wall*. Fable's study (with aurora science) found the tell is VALUE + COLOR +
TRANSLUCENCY, and — crucially — the premium version cost *nothing extra* because one of the six noise evals
was a duplicate (a `az*6.4` octave whose args never depended on the loop index `L`, re-evaluated per layer);
hoisting it funded a new fine-detail octave at net-zero. Banked patterns: (1) **A premium glow is mostly DARK
with concentrated luminous filaments, not a bright uniform wash** — drop the sheet floor (0.30→0.06 under a
steep `pow`) so fold minima go to real dark-sky gaps *between* curtains; concentrate brightness in the thin
hot border + fold knots (raise the hot-line gain, and a SPLIT output gain `0.55 + 0.45*hot*below` so only the
thin cores cross the bloom threshold). Bright-and-thin reads expensive; bright-and-wide reads screensaver.
(2) **Color = altitude physics gated by a rare eruption envelope.** Green owns the border+column (always),
a teal cools the mid column (always — that alone kills the mono-green), and violet base / pink overlap /
*additive* red crown appear ONLY when an activity envelope crosses a threshold (`erupt = smoothstep((act-0.72)/0.28)`)
— so most of the run is an elegant green/teal and a full-color eruption blooms for ~30s every few minutes.
The rarity IS the awe; a permanent rainbow reads tacky. The red MUST be brighter than the green and *added*,
not mixed (a darker red mixed over green just muddies it — the Gate-2 lesson's cousin). (3) **Translucency is
the single strongest "glowing gas not a decal" cue** — key star attenuation off LOCAL core brightness
(`aurLum += I*(0.25+0.75*hot*below)`), not total luminance, so stars burn through the faint column and vanish
only at the border/knots; the env.js consumer stays byte-identical, only the *meaning* of aurLum changes.
(4) **Individual rays, not a picket fence** — domain-warp the ray coordinate by the fold (irregular spacing),
stagger ray HEIGHTS (`rayTall` decays slower where `rn²→1` so bright rays reach higher), and a per-ray sin
shimmer — all free. (5) A near-free faint **back veil** (reuse a hoisted sample, ray-less, contributes ~0 to
aurLum so stars pass through) adds a layer of depth. All of it degrades by tier for free (tier1/2 keep the
color+value+translucency, lose only the extra layer/detail octave), and a `?auract=` debug override lets one
montage show quiet vs eruption without waiting minutes for the live envelope.

**Reusable patterns banked.**
- **THE ONE THING is a single shader term you protect through every tier + tuning pass.** What makes
  a procedural aurora read as authentic (vs a generic scrolling rainbow ribbon) is the **bottom-anchored
  curtain**: a SHARP, bright, per-fold-undulating LOWER BORDER (`below = smoothstep(h0-ε, h0+ε, d.y)`,
  NOTHING below it), rays streaming UP, an exp fade to a faint crimson top — driven by a physics ramp
  keyed on *height above the border* (rose fringe → 557.7nm yellow-green core AT the border →
  desaturating green → crimson only when active). Generic auroras are vertically symmetric and scroll
  too fast. Encode the identity thesis as one guarded term; the test asserts its shape so a later
  "cleanup" can't quietly symmetric-ize it away.
- **Seam-free dome noise: sample on `normalize(d.xz)`, never an `atan` azimuth.** The unit-circle point
  is periodic BY CONSTRUCTION, so there is no 2π wrap seam to hide — it fixes at the root the azimuth
  seam N9's clouds still carry. Cheaper than atan, too.
- **Motion is TIME-driven with world-parallax ≈ 0.** A racing aurora is the classic fake tell (the
  N9 0.02→0.002 parallax lesson, and 10× more sensitive at "100 km"). Fold crawl + two incommensurate
  breathing sines + a very slow act-envelope (quiet arc ↔ full drapery) give life without swim. All
  phases JS-wrapped (`time % 4096`) so endless runs never hit float32 shimmer (the uCloudDrift lesson).
- **The optional-channel identity pattern scales to a THIRD consumer.** `env.auroraMix` lerps from
  `a.aurora||0` (like `starMix`, like `cloudAmount`); a uniform branch `if (uAuroraMix > 0.0001)` means
  the other biomes pay ~0 ALU and the sky is byte-for-byte the shipped gradient. `gold-determinism` and
  the whole existing suite stay green with no fixture rev because course gen is biome-blind AND no biome
  declares aurora yet. A new sky feature costs one env field + one lerp + one branch.
- **Couplings that must stay identity-when-off go through the same mix, hoisted above the branch.**
  `aurLum` is declared `=0` ABOVE the `if` so the star-dimming (`star *= 1 - 0.65*aurLum`) reads a
  real value in every biome and is a no-op at 0 — the exact cCov-hoist trick N9 used for sun occlusion.
  The surge night-veil is suppressed under the real aurora via `* (1 - uAuroraMix)` (two auroras
  stacked read as noise), and the tier2 banding dither is gated `* uAuroraMix` (near-black + dim green
  is the worst-case OLED banding — mandatory here, harmless elsewhere).
- **Self-contained noise symbols avoid a splice-order collision.** AURORA_HEAD carries its OWN
  `_aHash`/`_aNoise` rather than reusing the cloud noise — two `${HEAD}` chunks concatenated into one
  fragment must not assume the other's helpers exist or match signatures. Prefix-namespace per feature.
- **A preview flag must stage the CORRECT viewing context, not just toggle the feature.** `?aurora=1`
  first force-enabled the curtain in whatever (daytime) biome the flow run landed in — and an aurora over
  a sunlit sky is a physics lie (real auroras are only visible against a dark sky), so the preview
  MISREPRESENTED the feature and the owner rightly called it out. Fixed with a preview-only `uAurNight`
  uniform (driven by the SAME `forced` flag) that sinks the dome to night indigo, kills the sun, and
  lights the stars — so the preview reads like the shipping NIGHT biome will. It's 0 in all real gameplay
  (the actual biome supplies its own dark palette), so determinism/identity is untouched. General rule:
  when you preview a feature that only makes sense in one environment, the force flag must also SET that
  environment, or the preview lies about the feature.
- **Booting the montage tool under real WebGL IS the shader-compile test.** A GLSL error in a spliced
  `${AURORA_BODY}` won't throw in JS — Three logs a GL error and renders wrong. `tools/aurorashot.mjs`
  reaching four screenshots proves the program linked; the pure test can't.

**Leapfrog.** The authentic curtain is live and provable on `?flowrun&aurora=1`, byte-identical when
off. Next in the Aurora rollout: **PR-2** appends `BIOMES[6]` (full biome sheet + 7th mats/skins/
palettes, `?biome=6` warp), **PR-3** the flat floe/iceFang props + mirror-water (the still sea reflects
the curtain for free), **PR-4** THE FLIP (`CYCLE=[0,1,2,3,4,6,5]`), then the veil hazard + THE SKYWEFT
anchor. Full plan: `reforged/AURORA-SHALLOWS-PLAN.md`. Human judges MOTION on the preview.
