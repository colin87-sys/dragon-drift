# Graphics Ledger — Dragon Drift

**Append-only lessons ledger for the graphics/rendering overhaul.** This is the graphics-stream twin of
`../LEAPFROG.md`. It exists as a *separate* file on purpose: the boss/creature stream appends to `LEAPFROG.md`,
the graphics stream appends here, so the two never tail-conflict when their PRs merge.

## THE RULE (graphics edition)

1. **Read [`GRAPHICS-OVERHAUL.md`](./GRAPHICS-OVERHAUL.md) first** — the roadmap, the Fable gate protocol, the
   branching strategy, and the hero (**Azure Drake**).
2. **After every merged graphics PR, append a lesson here** (what we did, what we learned, the gotcha, the
   reusable pattern) and add a **Gate Log** row below.
3. **Build systems, not one-offs.** Coexist behind a flag → prove on the hero (Azure) → migrate; never break the
   shipped roster or look.
4. **Verify before claiming** — headless tests + the screenshot gates (`bandshot` / `tonemapshots` / `skyshot` /
   `gameshots` / `tiershots`); the human judges motion/feel on the PR preview.
5. **Every PR clears its Fable Quality Gate** (score ≥ 8 + full adherence checklist) before merge; each phase
   ends with a Fable phase-review against the 9–10 bar.

> Cross-cutting lessons that also matter to the boss/creature stream may be cross-linked from `LEAPFROG.md`, but
> the graphics *record of work* lives here.

---

## Gate Log

One row per merged graphics PR (verdict from its pre-merge Fable gate).

| PR | Initiative | Fable score | Verdict | Notes |
|----|-----------|-------------|---------|-------|
| —  | (rows appended as PRs land) | — | — | — |

---

## Lessons

### L0 — Graphics stream established (this PR)

**Did:** stood up the graphics overhaul as a durable, governed workstream — created
`GRAPHICS-OVERHAUL.md` (the ranked 13-initiative / 4-phase roadmap toward a 9–10/10 look, with the Fable
Quality-Gate protocol and the branching strategy), created this ledger, and added a `CLAUDE.md` pointer that
redirects graphics lessons here instead of `LEAPFROG.md`.

**Learned / why it's shaped this way:**
- The overhaul is ~20 PRs landing alongside a heavy boss PR stream. The dominant merge-conflict source is
  **append-only-ledger tail contention**, not the graphics code (which is mostly in separate files). A separate
  ledger removes ~80% of the conflict risk on its own.
- **Same repo, long-lived integration branch** (`claude/procgen-graphics-optimization-qfbk7o`), merging to
  `master` only at the 4 phase boundaries — chosen over a fork, which would drift and concentrate all conflict
  pain into one terminal re-integration.
- **New systems go in new files** (`skyProbe.js`, `atmosphere.js`, `particleBatch.js`, `weather.js`,
  `toneMap.js`); the few shared-file edits (`main.js` renderer/quality region, `biomes.js` channels) land early
  and stay regionally bounded.
- Hero is **Azure Drake** (most complete, owner-approved). Azure is feather-winged with no surface-shader patches
  today, so it's the hero for the creature-agnostic majority of initiatives; N7's membrane-transmission effect is
  validated secondarily on a membrane dragon.

**Reusable pattern:** when a large multi-PR initiative must coexist with an active parallel stream, give it (a)
its own append-only ledger, (b) an integration branch that meets `master` only at controlled phase boundaries,
and (c) a hard "new code → new files" bias. Conflicts then only occur at the handful of genuinely shared files,
which you schedule early and keep small.

**Next:** Phase 0 — N2 (renderer contract) → N1 (dithering + `tools/bandshot.mjs`) → N3 tone-map scaffolding
(`?tm=`) → N3 decision → N4 (ParticleBatch). Start by building prototype #2 (the `?tm=` chunk-override spike) to
produce the ACES/AgX/Neutral montage for the one taste decision.
