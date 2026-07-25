# graphics — the ascension ramp multiplies `fx.auraIdle` up to ~10×, and an additive aura is background-relative

**Symptom (owner, flying it):** the chalk-ivory Revenant looked "weird and cheap" — flooded GREEN — when
skimming low over the green-lit water biome, but clean when flying high. "It's just how light goes on the
dragon." A Fable graphics diagnosis (live headless A/B) found it, and it was NOT the scene lights.

**Root cause: the idle AURA sprite, silently amplified by the ascension ramp.** The Revenant authored a
whisper (`fx.auraIdle: 0.03`) because its ghost-fire is "a lantern, not a lamp." But
`ascension.js` does `auraIdle = min(0.6, authored + 0.09·tier + 0.012·radiance)` — at Tier 3 that's
**0.30, a 10× swell** the def never consented to. `dragon.js` then drives a **9×9 world-unit,
AdditiveBlending, grave-green** billboard on the dragon at ~0.25 cruise opacity. That's the permanent
lamp the buildsheet forbids.

**Why altitude "cured" it — additive blending is BACKGROUND-RELATIVE.** An additive sprite adds its color
to whatever is *behind* it on the canvas. Low over water, the disc covers midtone sunset water + sun
glitter → `+green` saturates into a vivid pool that envelops the bone and even tips pixels over the bloom
threshold (extra green smeared by UnrealBloom). High up, the same disc sits on near-black sky → `+green`
over ~0.02 linear is a faint halo. The light rig never changed with altitude; the *canvas behind the
sprite* did. **Lesson: never diagnose an additive-sprite wash against the sky alone — test it over
midtone water. And a glow that reads fine in the studio can still flood the creature in a bright biome.**

**The fix — a def dial, not a global light change (Revenant-only, zero fps):**
1. **`fx.auraIdleRamp` (default 1)** honored in `ascension.js`:
   `auraIdle = min(0.6, authored + (0.09·tier + 0.012·radiance)·auraIdleRamp)`. Default 1 → **every
   existing dragon is arithmetically identical** (the data dial IS the coexistence gate — no flag
   plumbing). The Revenant sets `auraIdleRamp: 0`: its ascension tell is the HOLLOWING ladder
   (ribWindows/coreBlaze/bleach), not an aura lamp.
2. **`heartBloom.layers.set(1)`** — a genuine bug: the Grave-Heart bloom sprite was the one glow sprite
   missing the layer-1 tag every other glow sprite in the codebase sets, so it was being MIRRORED under
   the dragon in the water (`water.js` renders layer 0 only) and punching a hole in the god-ray occlusion
   mask. Main cam has layer 1 on, so the on-screen glow is unchanged.

**Reusable gotchas banked:**
- `ascension.js` scales authored `fx.*` values hard at high tiers — **any def built around WITHHELD glow
  MUST set the ramp dial**, or ascension re-installs the very lamp the design withholds.
- Additive billboards are **background-relative**; a background-dependent "it's gone when I fly up" bug is
  the fingerprint of an additive sprite, not a light.
- Glow sprites belong on **layer 1** so they stay out of the water mirror + god-ray mask — a roster-wide
  invariant worth a traversal guard (assert every dragon's `isSprite` has `layers.mask & 1 === 0`).

**Verification:** roster byte-identical (`tricount --ci`, default ramp = same math), starters 286/0,
blueprint 4/4, wingsym Δ0.000, zero new draw calls / zero fps cost. The green-wash itself is a
biome+aura interaction (not visible in the studio backdrops) — the owner judges it on the live preview
over the water biome; a `greenwashshot` altitude-pinned montage (green-excess metric, assert
`G_low ≤ 1.15·G_high`) is the gateable headless artifact if we want to lock it.
