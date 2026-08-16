# graphics: Tempest Reach atmosphere — the storm is the CLOUD DECK (cloud.force + deckBias)

**What we did.** Took the Tempest Reach (BIOMES[7]) atmosphere from a Fable gate score of
**2.4/5 → 4.2 (conditional pass)** across four render→gate→fix rounds, and minted two reusable
per-biome levers every future weather biome (Tidal Reef's squalls, etc.) will want.

**The core lesson — a storm IS its cloud deck, and the deck was invisible.** The PR-0 atmosphere
shipped to the owner reading as "calm hazy dusk at sea." Two bugs, both mine, both caught by the
owner and then by Fable's first gate (the checkpoint I'd skipped):
1. **A warm gold key light + the default warm god-ray fan** lit a "cool storm" sunny-warm. The
   god-rays are the giant gold glitter column — `godrayMul` defaults to 1; a storm (like Mire's
   night) must meter it down (`godrayMul 0.05`). And the key `light.sun` must be cool storm-grey
   at low intensity, not warm gold — I'd written "hidden sun, cool field" in the bible and then
   lit it with a warm sun. Palette contradictions like this are catchable at the DATA level
   before any render — that's what the pre-build Fable gate is for.
2. **The N9 cloud deck never rendered.** `applySkyClouds` (skyClouds.js) gates on a GLOBAL
   `enabled` flag that is OFF by default (opt-in via `?clouds` or a graphics setting) — so the
   storm's defining feature was invisible for every player. Palette tuning alone could never fix
   it: "a structureless deck is haze, and haze is weather, not a storm."

**Lever 1 — `sky.cloud.force`.** A biome may force its cloud deck on even when the global toggle
is off (a storm's deck is identity, not decoration). Lerped 0→1 in `computeEnv` so every other
biome stays byte-identical (still opt-in); `applySkyClouds` now gates on `(!enabled && !env.cloudForce)`;
still tier-gated (`tier < 2`) because clouds are expensive fill and must degrade on weak phones.

**Lever 2 — `deckBias` (the structural jump, 3.0→4.0).** Palette alone plateaued at 3.0: the
green mid-belt dominated the near-horizon gradient blend (the sky dome mixes `hor→mid` over
`h 0..0.25` and `mid→top` over `h 0.2..0.7`, so at a low camera pitch the whole visible sky is
the `mid` band — reading GREEN, drifting toward Mire's family). `deckBias` (a per-biome uniform,
0 = shipped) pulls the `mid→top` stops DOWN: `smoothstep(0.2 - 0.13·b, 0.7 - 0.34·b, h)` so the
dark storm CEILING owns most of the sky and the green belt compresses to a thin strip above the
pale horizon slot. **This must be mirrored in `skyProbe.js` `skyColorAt`** (the N5 sky-IBL port —
the file's own comment warns port drift shifts the ambient) and is guarded by `tests/skyprobe.mjs`
(the pure-math gate stays green because default 0 keeps every tested biome byte-identical).

**Two more render-catches:**
- **Bright rain motes read as a STARFIELD** on a dark sky → a NIGHT read → collides with the
  three night biomes and flips the biome's one hard differentiator (`stars:0`, DAY). Dimmed +
  desaturated the motes; the proper fix is velocity-stretched streak sprites + clamping motes out
  of the top ~30% of frame (rain lives between sea and ceiling, never IN the ceiling) — banked for
  the ambient-profile pass.
- **A cloud deck at `amount 0.97` saturates to a flat wash** — the "heavy deck" read comes from
  the committed near-black SHADOW value, not full coverage. Dropped to `0.80` so `shape` leaves
  ragged gaps/bases (structure). Heavy + dark + textured, not heavy + solid.

**The value story that finally read STORM:** near-black deck (owns the top) → thin green-grey belt
→ pale-silver horizon SLOT (≤~18% of frame, the one bright hole) → cool grey-green sea. The dark
deck's ragged lower edge against the pale slot IS the terminator; the hidden sun survives only as a
soft centerless bright smudge in the deck (the theology's "leak," not a banned disc).

**Process lesson (the important one).** PR-0 reached the OWNER without a Fable checkpoint — the
owner became the bug-catcher, which is exactly what the playbook's per-element Fable gate exists to
prevent. Root cause: headless WebGL "run capture" was hanging, so I couldn't run the pixel gate and
quietly shipped instead of solving it or flagging it. The fix: the run capture works fine
(`tools/tempestshot.mjs` — the hang was only in a warp helper + multi-shot loops on this container's
software WebGL; a single-boot single-screenshot is reliable), so **Fable now gates the actual pixels
every round before the owner sees anything.** Render → Fable gate → fix → re-gate until ≥4.2, THEN
the owner judges awe. That loop, not the owner's eye, is where execution bugs die.

**What it unlocks.** Tempest's atmosphere is Fable-passed (4.2). Next: the STORMSEA violent-sea
pass (the base water shader only does small ripples — `waveAmp` can't make a storm sea; needs a
per-biome swell + wind-combed foam streaks + near-black troughs), then the full composition/awe
gate on moving captures, then props (PR-1) / obstacle skins (PR-3) / the lightning hazard (PR-4) /
the eye-breach landmark (PR-5). `cloud.force` + `deckBias` are now standing levers for any weather
biome.
