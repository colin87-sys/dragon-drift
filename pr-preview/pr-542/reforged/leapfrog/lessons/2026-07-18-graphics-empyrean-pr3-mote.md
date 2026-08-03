# THE EMPYREAN PR-3 — THE MOTE (the black focal point) + the generalized landmark slot

**What we did.** Landed the Mote (EMPYREAN-BIBLE.md §8) — the biome's one true-dark object, the
signature of the Inversion Law made concrete.

- **Generalized the sky-whale slot into a declared landmark.** `BIOMES[5]` sets `whale: 1` (to
  drive the landmark MIX — it rides `whaleMix`, so the Mote fades in over the 400m Aurora seam,
  arriving as the light does) **+** `landmark: 'mote'` (selects WHICH landmark). `computeEnv`
  derives `env.moteMix` = the whale-mix portion belonging to a `'mote'` biome, and the whale MESH
  (`ambient.js`) now shows only the **non-mote remainder** (`whaleMix − moteMix`) — so a mote biome
  renders the Mote and the whale stays hidden, with the legacy whale path byte-identical elsewhere.
- **The Mote is a SKY-SHADER term, not a mesh — deliberately.** It has to ZERO the stars inside
  its radius (the hole-vs-object firewall), and the stars live in the sky shader, so an in-shader
  disc gets the occlusion for free by drawing AFTER the star term. It's also fog-exempt at a fixed
  world bearing (like the sun), which is natural in the dome shader. §8 explicitly offers this
  ("a sky-shader term — disc + limb + the star occlusion are a few lines of math").
- **The disc:** opaque black `0x050308` at `normalize(0.12, 0.055, -1)` (ahead, just above the
  dissolve, inside the reserved 30° easement), a **hard ≈1px coverage edge** (the sharpest thing in
  frame), replacing (not blending) whatever's inside → stars/sky wink out behind it. A **one-sided
  hairline pearl limb** (~r/28, ≤+1 value step, non-gold/non-corona — eclipse optics) hugs one arc
  and fades on the opposite limb. **Scripted monotonic growth** 1.5°→3° via `uMoteGrow` = biome-
  local progress (`((dist % L)+L)%L / L`) — below conscious notice frame-to-frame, unmistakable
  court-to-court; a fixed-bearing landmark is never *approached*, so the growth is authored.

**Gotchas / lessons.**

1. **A landmark "kind" can't lerp — split the MIX instead.** You can't crossfade a string
   (`'whale'`↔`'mote'`). The clean pattern: keep the numeric mix (`whaleMix`) as the fade driver,
   and derive a per-kind sub-mix (`moteMix = whaleMix restricted to landmark==='mote'`) so the
   renderer picks geometry vs shader-term by which sub-mix is live. The whale mesh reads
   `whaleMix − moteMix`, so the two landmark kinds are mutually exclusive and both crossfade the
   seam for free.
2. **The hole-vs-object firewall is why the Mote is in the sky shader.** A black circle on a
   skybox reads as a *rendering bug / punched hole* unless it visibly OCCLUDES something. Drawing
   the disc AFTER the stars (same shader) and REPLACING the colour inside its radius makes the
   stars wink out behind it — which a hole never can. A mesh would occlude via depth but couldn't
   touch the in-shader stars; the shader term nails both.
3. **The SH probe needs no 4th touch here.** Unlike the blooms (steady-state radiance the ambient
   must answer), the Mote SUBTRACTS a tiny far-horizon disc of radiance — negligible for the SH DC
   and role-locked dark by design — so `skyColorAt` is left untouched (skyprobe stays byte-identical).
4. **Clear the new gate in the arena skin too.** `moteMix` joins `empyMix`/`nacreMix` in
   `applyArenaSkin`'s explicit silence-as-the-arena-floods, so the Mote doesn't hang over THE
   UNMASKED's void/heaven (the boss BECOMES the Mote when the coupling lands — boss-side work).

**The reusable pattern.** A fixed-bearing sky LANDMARK = a `uMoteMix`-style gate + a `dot(d, DIR)`
angular-distance disc drawn after the sky's own layers (so it occludes them) + a scripted-growth
uniform from biome-local progress. Kind-selection rides a sub-mix of an existing fade, never a
non-lerpable string.

**What it unlocks.** The corridor of stones now converges on the black point (the leading line =
the flight line). Deferred within PR-3's bible scope but not blocking: the **arrival-park** (≥450m
clean at the Aurora seam) and the full **Breach** seam-grade land with PR-4's `writeMatrix` biome-5
composition engine (there are no Empyrean-specific props to gate until then). Next: PR-4 (the
`sentinel` hero + composition engine, built to `EMPYREAN-PROP-REFERENCE.md`), PR-5 (roster +
`inkShoal`), PR-6 (gravity-wells).

**Verify.** appshell (Mote GLSL compiles, no console errors), gold-determinism + skyprobe
byte-identical, biomecycle green. Captures `?biome=5`: the disc reads as the one true-dark point at
the corridor's vanishing point, just above the dissolve.
