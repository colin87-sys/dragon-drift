# Tempest I4 — the storm tick: the single-writer firewall, existing channels AS travel buckets, and the hum/peak reconciliation

**What happened.** Wired the shared `pulseTimer` into the rig and added the guarded storm tick that
makes the Tempest's near-white circuit BEHAVE like a live wire — a breathing hum at idle, lightning
strikes that travel root→tip, and a Surge "break." The scaffold (`pulseTimer.js` + the `?strikePin`
passthrough) had shipped at I0; I4 is the wiring. Three moves are the reusable lessons.

**THE SINGLE-WRITER FIREWALL — two engine truths force the arc mats into their OWN channel, touched
by nothing else.** The rig has two mechanisms that would each silently clobber a hand-animated
emissive: (a) `spineMats` get the global WARM cruise rim `0xfff0d8` — poison for a 255°/near-white
family; (b) the flare loop's else-branch RESETS every `spineFlareMat`'s `emissiveIntensity` to its
base EVERY non-surge frame, erasing anything written earlier. So the storm circuit can live in
NEITHER `spineMats` NOR `flareMats`. The fix: a new `parts.stormArcMats` channel that dragonModel
collects and ONLY the storm tick writes. Keyed on `parts.stormArcMats` existing (null for every other
dragon), the tick is a no-op for the roster → byte-identical. Reusable rule: **when you need to
per-frame animate a material the shared loops also touch, don't fight them — give the material its
own collected channel that the shared loops skip, and gate your writer on that channel existing.**

**THE EXISTING EMISSIVE CHANNELS ARE ALREADY THE TRAVEL BUCKETS — no geometry surgery needed.** The
spec wanted the strike to TRAVEL root→tip via 3 position-buckets, and I first assumed that meant
re-bucketing every glow push in four part-builders into new position-tagged materials (a large, risky
edit to a shipped dragon's idle look). It didn't. The circuit already uses 3+ SEPARATE shared
materials by ROLE — `heartCore` (sternum dynamo), `arcSeam` (spine/veins/arm-crest), `arcCore`+
`edgeMat` (tips/fork/tuft/crown) — and that role split IS a coarse root→mid→tip split. Tagging each
existing material with a `stormBucket` (0/1/2) and offsetting its strike envelope +0.04·bucket s gave
the traveling bolt with ZERO geometry change (tris identical, idle look preserved). Reusable: **before
multiplying materials to get a spatial effect, check whether the mats you already have are separated
along the axis you need — a role split is often a position split in disguise.**

**THE TRAVEL OFFSET NEEDS AN ENV-HISTORY RING — `state()` only gives you NOW.** The pulseTimer's
`state().env01` is the strike intensity at the current instant; to make bucket _b_ lag by 0.04·_b_ s
you need the envelope as it was 0.04·_b_ s AGO. Keep a tiny ring of recent `{t, env}` and read back to
the wanted timestamp per bucket. Cheap (≤24 entries covers the ~0.12 s travel), deterministic, and it
degrades cleanly: the root bucket (offset 0) and any pinned capture read the live env directly.

**THE HUM/PEAK RECONCILIATION — a "studio-legibility" placeholder had to become the real dynamic
range, and the ratio assert caught the one mat I got wrong.** The shipped idle circuit was pushed
bright (base = `humFloor · mul`, mul 2.4–3.2) so the strips read near-white in the no-bloom studio —
an explicit placeholder the buildsheet said "the I4 storm tick will cap." I4 is where the strip stops
being a static lamp and becomes hum→strike: idle drops to the true `hum(form)` (0.30→0.90 up the
ladder) and the strike lifts it to `peak(form)` (1.2→2.4), so the **strike:idle ratio lands in the
[2.2, 4.0] band** — "reads as an event, never an ignition-from-dark." I baked `stormHum`/`stormPeak`
per mat at build time (humFloor/peakFloor are in scope) so the tick needs no form lookup. The headless
ratio assert immediately flagged `edgeMat` at 4.17 (its `rel` weight was too low, so its idle sat too
dim under the fixed peak) — a one-number fix, but exactly the kind of off-by-a-hair the machine catch
is for. **Bake the derived per-mat dynamics at build time and assert the ratio in a headless test; it
catches the starved channel a render would only hint at.**

**Gotchas banked.** (1) `?strikePin` freezes the schedule for pixel-comparable captures — pin(0) = the
standing/hum frame, pin(0.5) = the strike peak; the tick calls `pin(STRIKE_PIN)` every frame (null =
live), so a pinned build is a static, reproducible spectacle frame. (2) The dynamo "kick" writes
`coreGlow.userData.base` PRE-READ (the tick runs just before the coreGlow block, scaling its base by
1+0.5·env), honoring "one writer per channel — the hook owns opacity, the tick only scales the base."
(3) Each part builds its OWN `tempestMats`, so the arc mats are per-part instances — tag them at
creation (in the factory) so every instance carries the bucket/cap/hum/peak regardless of which part
emits it.

**THE GATE — and the BLOOM-KNEE lesson the ratio assert could not see.** The hum frame PASSED the
harsh Fable gate (reads as a lightning garment, not ignition-from-dark), but the strike REVISED (3.4):
it read as an *atmospheric* event — a cyan scene wash + fog bloom — rather than a punch on the wire.
The cause is invisible to the emissiveIntensity ratio assert: the pre-render caps (2.4/2.0) sit ABOVE
the in-game bloom-saturation knee, so at idle the strip cores already clip white, and the strike's
extra emissive spills into screen-space bloom (the scene) instead of brightening cores that have no
headroom left. The fix that moved it: scale hum + peak + cap together by ONE `BLOOM_SCALE` (0.6) — the
ratio stays in band, but the whole range drops BELOW the knee, so the strike lands as a visible CORE
brightening on the struts. Reusable law: **a healthy emissive ratio is necessary but not sufficient —
if the whole range sits above the bloom knee, both ends clip and the "event" leaks into atmosphere;
tune the ABSOLUTE level against the bloom knee, not just the ratio.** (A headless ratio test can't see
this — it needs a render; the studio needs a `strike` state added so this is gate-able without flying
through an ember pickup that occludes the torso — the one deferred piece.)

**What it unlocks.** The Tempest now wears the storm as MOTION, not a static coat: the circuit breathes
at idle, lightning strikes travel from the sternum out to the wingtips/crown/tail on a deterministic
burst-cluster clock biased to the wingbeat's downstroke, and Surge breaks it open. Single guarded tick,
roster byte-identical, suites green (`tests/stormtick.mjs` asserts the ratio band / caps / three-bucket
travel / roster-safety), hum gated PASS + strike improved to punch on the wire. Remaining POLISH (owner
judges the flicker/travel in motion on the preview): push the strike a touch further on-wire, fire the
tail/spine more at peak (the "lightning jacket, not full garment" note), and add the studio `strike`
state for ember-free gating. Then I5 — the CHARGING ladder asserts + `tests/starters.mjs`. The reusable
storm scheduler (`pulseTimer.js`) is ready for Tocsin's ring pulses to reuse.
