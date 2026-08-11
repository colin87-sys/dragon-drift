# A biome-scoped hero-rim lever: the optional-channel pattern reaches the HERO, not just the world

**What we did.** After the halo + aerial levers landed the Mire frame at Fable 4.2, Fable's one remaining
note was *"a magnificent stage and a small actor"* — the drake reads as a ~30px dark smudge at cruise,
because against the Mire's bright ember horizon a backlit animal needs a **rim in the sky's colour** (NatGeo
law), and the shipped cruise rim (0.5 warm cream `0xfff0d8`) is sub-threshold at that screen size. Fable
spec'd **Option B**: a per-biome backlit-rim lever, default-0, riding the exact `propAerial`/`godrayMul`
optional-channel pattern — so it's a *system* (any biome with a bright horizon types one line), not a
one-off, and every other biome + skin stays byte-identical.

**The key architectural insight — the optional-channel pattern isn't only for world/atmosphere.** We'd used
it for god-rays, motes, aerial-perspective (all environment). This is the first time a `biomes.js` optional
channel drives a **hero-facing** system (the dragon's rim). It works because the consumer
(`dragon.js`'s per-frame rim block) reads a plain JS signal (`getHeroRim()` → `{k, color}` from
`environment.js`), NOT a shader uniform — **zero GLSL change**, so no recompile, no program variant, and the
byte-identity proof is pure arithmetic.

**The byte-identity proof (why the other 6 biomes + 12 skins are untouched).** `updateRim` gained one
defaulted param: `updateRim(color, strength, boost = 0)`, and the strength line became
`(strength + boost * (u.wing ? 0.35 : 1)) * (u.mul ?? 1)`. At `boost = 0` this reduces **exactly** to the
shipped `strength * (u.mul ?? 1)` — so any biome that doesn't set `heroRim` (envLerp → 0) drives the
shipped expression. The lever `k` is 0 everywhere but the Mire; `dragon.js` passes `lever.k * quality` as
the boost. This is the same "default reduces to the shipped line" identity the aerial lever uses, applied to
a JS multiply instead of a shader mix.

**The wing-chrome guard (cheap-tell #4: rim is per-surface).** A cruise-tuned rim raise washes flat faceted
wings in a chrome outline the rounded body doesn't get — the reason `def.rimWingMul` already exists. So the
boost is tagged per-material: `applyRim(wingMat, {…, wing: true})`, and wings take the biome boost at
**×0.35** BEFORE the skin's own `mul`. So a skin's existing tame (Tempest wing `mul` 0.22) or kill
(`rimBodyMul 0`) still rules the sum — the boost can't resurrect a rim a skin deliberately suppressed. Body
+ spines stay untagged (a thin crest line catching full backlight is correct).

**Hue-lerp cap keeps cold-identity skins legible.** The rim hue lerps toward the biome backlight
(`_rimCol.lerp(lever.color, min(0.65, k*1.1))`) but is **capped at 0.65** so a cold-identity skin (the
Tempest's storm-steel edge) keeps a third of its own hue even in the ember Mire. And the lever lerp happens
BEFORE the Surge lerp, so Surge still takes the hue over everything (unchanged).

**The trail-puff fix is a THIRD falloff curve — don't reuse the aura's.** The 2–3 stacked blue balls under
the drake in stills were the wake/boost puffs (`makeGlowTexture`, 0.8-alpha shoulder to r=0.3 = the balloon).
Tempting to reuse `makeAuraTexture`, but that curve carries ~8× *less* energy (built for a 9-unit disc) and
would near-kill the in-motion ribbon on 0.8–4.7-unit puffs. New `makeTrailTexture`: core-hot, **no held
shoulder**, dead by r=0.7, ~¼ energy — then **opacity-compensated at the call sites** (trail 0.65→0.85,
boost 0.8→0.95; fire 0.32→0.40 / 0.4→0.50) so the moving thread keeps its centreline luminance. **Why the
motion read survives:** a moving trail reads from *overlapping cores along the flight path* (spawn every
0.009–0.035s), not each puff's skirt — the skirt only ever mattered when `timeScale 0` froze 2–3 puffs into
a coaxial pile. Result: a beaded energy thread, not a smoke sausage (the withheld-glow direction). The
warm-cream `coreRgb` stop is preserved so fire dragons' additive exhaust still can't sum to white. This part
is **global** (all skins) — intentional, because it's the registered broad-shoulder cheap-tell fix, gated
with a fire-dragon control frame.

**Scope discipline (Fable's own ruling).** Option A (global rim raise) would re-break every hand-tuned skin
(the Tempest's 1.25/0.22 took a multi-round glow-up) across 8 biomes; Option C (baked per-model rim ladder)
is 12+ skins of roster work and can't follow the biome's backlight colour. Both need an OWNER decision; B
does not (default-0, JS-only, one-biome blast radius). **When a hero-facing change could be global, per-biome,
or per-model, prefer the per-biome default-0 lever — it's the smallest reversible blast radius and it makes
the change a reusable system.** Keep C in the pocket for a future close-up hero pass (shop/showcase).

**Verify.** Machine gates green (determinism, biomecycle 12/12, graphicsfoundation, heroshadow, insts,
surgefx, water 24/24, propaerial 11/11, no console errors). In-game low-altitude boost frame at the arch:
the drake reads as a lit winged silhouette (hero PointLight underglow + ember edge) instead of a smudge, and
the boost trail is spaced beads not a balloon stack. Capture gotcha (again): the dist-jump lets the drake
rise and `timeScale 0` freezes the chase cam before it catches a forced-low `y` — you must hold `position.y`
low across ~14 LIVE frames so the camera settles behind the low drake against the bright water/horizon (where
the rim is judged), THEN freeze.

**What it unlocks.** The optional-channel pattern is now proven for hero-facing systems, not just the world —
future biomes can backlight the dragon in their own horizon hue with one data line, and the per-surface
`wing`-damp + `mul` stack is a reusable guard for any global additive rim boost.
