# Dragon Drift — Leapfrog Studios

**Before doing anything, read [`LEAPFROG.md`](./LEAPFROG.md)** (the frozen playbook +
historical lessons archive) **and skim [`leapfrog/lessons/`](./leapfrog/lessons/)** for
the newest lessons. Together they are the accumulated state of the art for this repo,
written so each session starts from everything the last one learned and **leapfrogs from
there** (`leapfrog^leapfrog`). (`node tools/build-ledger.mjs` assembles both into one
scroll.)

Then follow THE RULE in that file:

1. **Read `LEAPFROG.md` + `leapfrog/lessons/` first.**
2. **After every meaningful change, add a lesson as a NEW FILE**
   `leapfrog/lessons/<YYYY-MM-DD>-<slug>.md` (what we did, what we learned, the gotcha,
   the reusable pattern, what it unlocks). ⚠ Do NOT append to `LEAPFROG.md` and do NOT
   use a sequential `L###` number — one file per lesson is what keeps parallel chats from
   colliding on the ledger. See [`leapfrog/lessons/README.md`](./leapfrog/lessons/README.md).
3. **Build systems, not one-offs.** Coexist → prove on a hero → migrate; never break
   the shipped roster.
4. **Verify before claiming** (headless tests + `tricount` + `tiershots`); the human
   judges motion/feel on the PR preview.

The live game is in `reforged/`. Everything is 100% procedural (no asset files),
vanilla Three.js r160, no build step, and must hold 60fps on weak mobile.

**Designing or touching a BOSS?** Read [`reforged/BOSS-DESIGN.md`](./reforged/BOSS-DESIGN.md)
first — it distills the boss research, design laws, the tier ladder, the archetype
architecture, and the SHORT list of ledger lessons that matter for boss work (so you don't
read the whole ledger for it).

**Designing or building a DRAGON / rideable creature?** Read
[`reforged/DRAGON-DESIGN.md`](./reforged/DRAGON-DESIGN.md) FIRST — the shape-agnostic dragon
creation method (learnt the hard way taking Vesper from a 1.5/5 "plane with bumps" to shipped):
the failure modes to kill on sight (plane wings, stick limbs, LED-strip glow, flat-black
poverty), how to get real DEPTH / THICKNESS / RICHNESS, the reusable fingered-membrane WING kit,
the tail-chain + wrist-fold MOTION kit (the −anchor + mirror rigging gotchas), withheld
component glow, the cruise-visible tier ladder, the Fable-critic-per-checkpoint process, and the
verification harness. Read it so you start rich on turn one instead of building a stick dragon.

**Tuning or building a WING-FLAP animation?** Read
[`reforged/FLAP-DESIGN.md`](./reforged/FLAP-DESIGN.md) first — the flap playbook: the 3-segment
articulated-wing rig, the full dial vocabulary, the design laws (kill the glide-hold "plank", deep
lag so the wing curls not tilts, and THE DEPTH-PROJECTION TRAP — why a correct wrist fold is
invisible at the top of the upstroke and how the in-plane apex-sweep fixes it), the tuning recipe,
the reference dial sets (Vesper / Revenant / Tempest), and the verify harness (trust geometry over
a critic's pixels). Read it before turning flap knobs, so you don't spend three rounds on one plank.

**Designing or touching a BIOME / the environment?** Read
[`reforged/BIOME-DESIGN.md`](./reforged/BIOME-DESIGN.md) first — the biome playbook: the
8-biome lineup, the identity system (hazard + verb + anchor boss per biome), the
boss↔biome coupling, the determinism-safe hazard-injection pattern, and the
increment-by-increment rollout.

**Designing or touching GRAPHICS / rendering?** (renderer, post-FX, lighting, shadows,
sky, water, fog, materials/surface shaders, particles) Read
[`reforged/GRAPHICS-OVERHAUL.md`](./reforged/GRAPHICS-OVERHAUL.md) first — the overhaul
roadmap toward a 9–10/10 look: the ranked initiative backlog, the Fable Quality-Gate
protocol (a high-effort Fable spawn kicks off the work and gates every PR + phase), the
branching strategy, and the hero (**Azure Drake**). Graphics **lessons follow THE RULE like
everything else** — a NEW FILE in [`leapfrog/lessons/`](./leapfrog/lessons/) with a
`graphics-` slug (the one-file-per-lesson convention already keeps parallel streams
conflict-free); the graphics Gate Log lives in `GRAPHICS-OVERHAUL.md`.
