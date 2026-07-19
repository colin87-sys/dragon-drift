# 2026-07-18 — SUNBREAK I2: anatomical ignition cascade (+ the hero-choice ceiling)

**Did / learned.** Replaced the "whole dragon lights on one frame" tell (a single uniform
`surgeMix` blend driving every emissive write) with a STAGGERED anatomical cascade — eyes→spine→
wing-bones→membrane-rim, each a sharp EVENT with an uneven onset gap, holding through a breathing
sustain, then a reverse decay (rim→wings→spine→EYE-LAST) keyed off the remaining `feverTimer` so
the body never leads the HUD gauge. Fresh Fable critic: **PASS 4.2/5** (after one revise round).
The reusable pieces:

1. **A cascade state machine + per-station envelope gates.** A rising-edge timer (`surgeCascadeT`)
   drives 4 smoothstep envelopes; each station's existing surge-emissive DELTA is multiplied by its
   `casLevel[i]`, so the post-ignition steady state is byte-identical to the shipped look and only
   the RISE staggers. Off-Surge every gate reduces to the shipped form (casLevel=0) → byte-identical.
2. **The plan's own numbers can be self-inconsistent — verify them in the pre-assess.** §C.3's
   canonical onsets (0/120/250/400ms) give gaps 120/130/150 — and 120 vs 130 is only 8.3% apart,
   failing §I-5's OWN "no two gaps within 10%" assert. The Fable pre-assess caught it before a red
   test. Retimed to **0/120/265/440** (gaps 120/145/175, ≥20% uneven). Always run the plan's
   numbers through the pre-assess arithmetic.
3. **Measure the stagger with a PURE ENVELOPE SAMPLER, not the live latch.** Headless swiftshader
   runs ~7fps, so a per-frame onset latch quantizes to ~150ms and falsely fails the uneven-gap
   assert (150/150/200). Exporting `surgeCascadeSample(t)` (the envelope as a pure function of
   cascade-time) lets the test sample at 1ms resolution, frame-clock-independent (§M.1-10 trace
   discipline). Same trick for the decay + flare envelopes.
4. **Seeded non-metronome cadence needs GUARANTEED separation, not raw random.** Raw
   `rng()*range` gaps cluster (two flares landed 5% apart, failing the ≥12% assert). Fix: three
   well-separated base gaps (≥26% apart) in a seed-SHUFFLED order — non-metronome by construction,
   deterministic (mulberry32), never two within 12%.

**Gotcha #1 — the RESTING LIVERY pre-spends the contrast.** The critic's round-one kill (2.9/5):
the ignition was a +30-50% nudge, not a 3-5× dark→light event, because the dragon was ALREADY LIT
before ignition — the aura + body + core emissive all blazed instantly on `feverActive` (un-staged),
and the silhouette-rim + violet seams idled at cruise brightness. Fix: gate the halo/body/core by the
cascade (× `casOverall`) and ARMED-DIM the cascade stations' resting emissive to ~35-40% until they
ignite (Surge-only → byte-identical off). A dark hero must be genuinely DARK where it matters, or
each station's step has no headroom. **The eye needs a SCREEN-SPACE carrier** — a 2-3px eye can never
carry beat one at rear-chase distance; no intensity parameter fixes subpixel. A head-local aura
corona flash (rising with the eye, decaying over ~0.4s) is the carrier.

**Gotcha #2 — capture-freeze is harder than it looks.** A one-shot `player.speed=0` is overridden
by speed-regen next frame, so the pose drifted 31→124m across beats and the critic (correctly)
refused to certify a cascade it couldn't compare frame-to-frame. `game.timeScale=0` is ramped back
to 1 by the slow-mo restore. What works: re-pin `player.dist` (+ `position.z`) to a captured anchor
every beat, right before the shot. Also clear ring pickups (their bright torus pollutes the read).
A cascade capture MUST pin the pose or the evidence is worthless.

**→ Systematize.** The cascade + samplers + armed-dim + eye-corona + pinned-capture form the
reusable "creature wakes up" kit — dragon-agnostic (timing identical for every dragon; identity in
hue only, per the I1 invariance law). The value-first construction (staggered LUMINANCE steps, hue
as decoration) makes it pass the colorblind greyscale-story gate. Any future "X transforms" moment
reuses it.

**→ Leapfrog + the HERO-CHOICE CEILING.** The one honest residual the critic ruled owner-not-craft:
the showcase hero (Solar Sovereign) is a BRIGHT-GOLD king whose gold plate-lances are INTENTIONALLY
STATIC — its own builder forbids them from the surge tick ("or Surge detonates to white",
`dragonSovereign.js:74`). So the dragon's PEAK luminance never changes across the cascade; only its
mid-tones travel — structurally capping the dark→light drama at ~2/3 of what this exact system
delivers on a SILHOUETTE hero (Vesper/Wraith), where ignition moves the PEAK. The cascade is proven
and correct; **the compression is the price of the bright-gold identity, and the fix (if wanted) is
a hero swap, not a dial.** This points the SUNBREAK showcase at a dark-bodied hero — and tells I5's
roster pass that the cascade will read MOST dramatically on the silhouette skins, least on the
gold-plated kings. I3 (beam) must not swallow the head/eye station or leak brightness into the
armed-dim before-state (the critic's protect-list), and must re-check the fragile spine→wings beat.
