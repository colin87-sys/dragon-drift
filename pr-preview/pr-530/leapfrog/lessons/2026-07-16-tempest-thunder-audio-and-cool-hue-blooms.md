# Tempest post-ship polish — procedural thunder audio + carrying storm-colour in the BLOOMS, not the cores

**What we did.** Two owner-requested follow-ups after the glow-up shipped: give the Surge a *voice*
(thunder), and push the brightest emissives from "clips to white" toward "reads cool storm-blue" (the
director's 4.6+ ceiling note). Two reusable lessons.

**LESSON 1 — procedural thunder = a CRACK + a delayed low ROLL + a SUB, wired through the event bus.** The
audio engine is fully synthesized (no asset files). Thunder is three layers, modeled on `bellToll`:
(1) a short **band-passed noise CRACK** (the leader stroke), (2) a **brown-noise ROLL** — integrated white
noise (`last = (last + 0.02·w)/1.02`) so it's deep, low-passed ~200 Hz, started a beat AFTER the crack and
swelled-then-decayed over ~2 s (this delayed roll is what makes it read *thunder*, not just a hit), and
(3) a swept **SUB sine** for chest weight. Randomize pitch/roll-length per call so no two fire alike; route
to `sfxBus` so it respects the mute/volume; guard on `getCtx()` so it's a no-op when the audio context
isn't up (headless). **Wire it via the event bus, not a direct import:** the visual driver (`dragon.js`)
`emit('stormThunder', {intensity})` on each Surge arc beat, and `sfx.js` `on('stormThunder', …)` plays it.
That keeps the renderer decoupled from the audio engine — the same pattern the boss music already uses.
Gate it inside the existing Surge/arc block so it's dragon-scoped and only sounds during the super.

**LESSON 2 — a white-hot core clipping to white is CORRECT; carry the colour in the BLOOM, not by dimming
the core.** The critic's note was "the brightest emissives clip toward white, so the storm hue is carried by
the blooms more than the cores." The naive fix — desaturate/dim the cores to hold blue — is wrong: a
lightning core, an eye ember, a charged crest ARE white-hot at the centre; that's the premium read. The
right fix is to make the **surrounding glow bluer** so each bright point reads white-core → blue-halo (a
cool storm-ember), which is exactly how real lightning reads. So we deepened the non-core glows (eye halo
`0xcfe0ff→0x9ac2ff`, tuft halo `0xe8ecff→0xaac6ff`, crest line `0x9cc0ff→0x7aa6ff`) and left every white
core alone. Bonus: those glow sprites/strips are NOT in the accent-lane test (only the storm-arc *emissive
materials* are capped at HSV-sat ≤0.16), so their saturation is free to move — no roster law touched.
"Carry the colour in the bloom" is the general rule whenever a bright emissive washes to white: don't fight
the clip, paint around it.

**Reusable takeaways.**
- Procedural thunder: crack (band-passed noise) + DELAYED brown-noise roll (the roll sells it) + sub sine;
  randomize per call; route to the SFX bus; wire gameplay→audio through the event bus, not a direct import.
- A white-hot emissive core SHOULD clip white — carry the identity HUE in the bloom/halo around it, not by
  dimming the core. White core + saturated halo = a premium ember.
- Soft-glow sprites/strips usually sit outside the material accent-lane tests, so their saturation is a free
  lever for tuning the colour read without touching the roster laws.
