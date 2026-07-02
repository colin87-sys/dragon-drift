# Dragon Drift — Leapfrog Studios

**Before doing anything, read [`LEAPFROG.md`](./LEAPFROG.md).** It is this studio's
playbook and append-only **lessons ledger** — the accumulated state of the art for
this repo, written so each session starts from everything the last one learned and
**leapfrogs from there** (`leapfrog^leapfrog`).

Then follow THE RULE in that file:

1. **Read `LEAPFROG.md` first.**
2. **After every meaningful change, append a lesson** to its ledger (what we did, what
   we learned, the gotcha, the reusable pattern).
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
