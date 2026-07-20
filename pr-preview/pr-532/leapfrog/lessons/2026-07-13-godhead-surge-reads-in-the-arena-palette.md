# GODHEAD heaven — the Dragon Surge reads in the arena's gold, not the default magenta

**What we did.** The owner's "the background changes randomly" was TWO stacked mechanisms (see the perf
lesson for the tier-oscillation half). This is the OTHER half: firing **Dragon Surge** in the S3 heaven
washed the owner-locked gold sky **80% magenta / 70% violet** for the 8s surge duration (`environment.js`
`feverMix` sky tint + `postfx.js` magenta `lift` wash), then reverted — a magenta hole punched in the
godhead's gold, triggered by a graze meter, so it read as random.

**The design question the owner raised (and the right answer).** "Will the rest of the game get a
different surge color? It needs consistency — unless the final boss gets a specially-designed surge."
The reframe that resolves it: **surge colour is already NOT globally fixed** — it's per-equipped-dragon
(`setFeverWarm`/`setFeverTint`: magenta default, a FIERY ember variant for fire dragons — `environment.js:359,385`).
And the heaven is already a **total palette takeover** (sky/water/fog/light all overridden to the
godhead's gold). So Surge reading gold in the arena isn't an inconsistent one-off — it's **the arena's
palette law applying to surge like it applies to everything else**; the magenta is what *broke* the
arena's identity. Consistent *as a mechanic* (surge always adapts to its world), and it reuses the
EXISTING warm-surge machinery — no new bespoke system.

**How (3 files, value-space, 0 draws, 0 perf, 0 fairness risk):**
- `environment.js updateEnvironment`: drive `feverWarm` toward the FIERY variant by `heavenWarm =
  clamp(arenaMix − 1)` (0 in biome/void → 1 as the heaven settles), `max`'d with the per-dragon target.
  The sky tint + aurora go warm-gold. `feverWarm` is `× feverMix` in the shader, so it's a **no-op until
  the player actually surges** — no effect on the resting heaven.
- `postfx.js`: the surge screen-wash is `lift` (intensity) × `liftTint` (hue, magenta by default). Added
  `setFeverArenaWarm(k)` + a `_WARM_LIFT` ember-gold, and lerp the tint magenta→gold by `_arenaWarm`.
  The pulse INTENSITY is untouched (surge still reads), only the HUE warms.
- `main.js`: `setFeverArenaWarm(clamp(bossArenaMix() − 1))` each frame beside `updatePostFX`.

**The lesson — when a global effect clashes with a bespoke arena, don't recolor the effect globally;
gate the recolor to the arena on the arena's OWN state, reusing the effect's existing variant hooks.**
Surge stays magenta everywhere else (its identity is intact); only inside the godhead's world does it
speak the godhead's gold. A per-dragon system already existed to make this a two-line reuse, not a new
mechanic — the win was recognising the heaven as "just another palette context" the existing
`feverWarm` knob already models. Driving it off `arenaMix` (the same window water/skin/embers ride)
means it fades in/out with the unveiling for free and reverts byte-clean off the heaven.

**Verify.** A surge-forced heaven capture (`/tmp/surgecap.mjs`: force `feverActive`, hold `feverTimer`,
let the damps settle) reads warm amber-gold, not magenta — surge still legible (whole-frame lift, dragon
glow, aberration). `unmaskedarena` 57/57 (the grade is surge-gated, so the settled-heaven fairness
probes are unaffected), 0 console errors. Real-GPU motion is the owner's call. NaN law untouched (no new
shader math — a JS-side uniform lerp).

**Reusable.** Effects with a per-context variant knob (here `feverWarm`/`liftTint`) can be re-pointed at
a NEW context (an arena) by driving that knob off the context's existing engage window (`arenaMix`),
`max`'d with the prior driver — no new uniform, no new draw, auto-reverting, and consistent-as-a-mechanic.
