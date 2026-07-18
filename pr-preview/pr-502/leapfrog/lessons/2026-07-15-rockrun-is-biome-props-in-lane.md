# The rock run IS the biome: buildPropRun + RUN_KIT, and the sightline owns EVERYTHING

**What we did.** Built the props-in-lane Frozen rock run (`?strait2=1`): shared
`buildPropRun(plan, kit, ctx)` in obstacles.js walks the audited `rockSlicePlan` li/ri weave,
pulses a tightness scalar `T(s) = sin²((π/2)·|z|/half)` phase-locked to the rings (open trough at
the ring plane, squeeze between rings), picks the biome's own archetypes by weight with
anti-picket, scales every instance under an ABSOLUTE world-Y cap, places on the lane edges only,
and emits geometry from the environment.js factory + a data-driven under-fitting collider + a
per-section fade. `RUN_KIT.frozen` is the only biome-authored piece. Headless gate:
`tests/proprun.mjs` (cap, collider⊆visual, channel-clear, tri budget, anti-picket, determinism,
breath rhythm).

**The big lesson — capping the lane is NOT enough.** Three successive Fable-gate failures were
all "tall narrow pillars," and NONE came from the lane props (those were provably ≤ y8):
1. The biome's own DECORATIVE BANDS (bergwall h≈38 at x≈32) loom like canyon walls at deck-skim
   camera height. Fix: `addDeckSkimWindow(a,b)` — strait2 sections register their dist window;
   `writeMatrix` height-clamps band instances inside windows.
2. The `iceMouth` HEADLAND capes (~25u gateway pair) — the set-piece dressing itself. Fix: same
   absolute cap under strait2.
3. A height-clamped ICETOWER still failed — **squashing can't save a NARROW archetype**: with
   r≈3 it keeps a vertical stepped profile at any height. Narrow verticals must PARK
   (`deckSkim:'park'` on icetower + sungate), the same include/exclude rule as the lane roster.

**The reusable pattern.** A low-sightline set-piece must enforce its sightline on *every* layer
that can enter the frame — lane masses, decorative bands, gateway dressing — via ONE absolute
world-Y rule, with two enforcement modes: WIDE archetypes clamp height only (they squash into
believable pack ice; keep radius), NARROW archetypes park. Windows are registered by the
consumer (obstacles) with a long forward lead (+600, past the band render horizon) so the
unclamped leading edge never shows; rewrites are pure (rotY cached, comp pure) so re-clamping is
always safe.

**Debug pattern that found it:** dump InstancedMesh matrices from a live headless boot
(`o.instanceMatrix.array`, y-scale = |column 1|) filtered by dist/x/height — identifies WHICH
archetype a "mystery pillar" is in one probe instead of guessing from pixels. (First probe missed
it with |x|<60 — widen the net before concluding "not a band.")

**What it unlocks.** Any future biome's rock run = author `RUN_KIT.<biome>` + tag its narrow
verticals `deckSkim:'park'`. Fable gate PASSED round 3: OPEN 4.5/5, TIGHT 4.4/5 (floor 4.2) —
all three round-1 failure modes (vertical stacks, walls off frame top, mid-lane clutter) absent.
Follow-ups noted by the critic (not gating): near-camera pickup glow, sky-dome edge + mist blobs
(shipped-biome elements), shelf facet yaw jitter.
