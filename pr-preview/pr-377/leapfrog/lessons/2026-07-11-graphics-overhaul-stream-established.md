# 2026-07-11 — Graphics overhaul stream established (roadmap + high-effort Fable gate ladder)

**Did / learned.** Stood up the graphics overhaul as a governed, multi-PR workstream aimed at pushing the look
from a strong ~7/10 to 9–10/10 within the r160 / no-build / procedural / 60fps-weak-mobile constraints. Created
`reforged/GRAPHICS-OVERHAUL.md` (a ranked 13-initiative / 4-phase roadmap — dithering, renderer contract,
PBR-Neutral tone mapping, particle batching, procedural SH-probe IBL, projected hero shadow, sun-aware surface
shaders, atmosphere/height-fog, sky clouds, water 2.0, tier1 pass-budget uplift, grade v2, biome weather) with
a **Fable Quality-Gate ladder**, and added a `CLAUDE.md` pointer. **Gotcha caught mid-flight:** the branch was
cut 298 commits back and I initially designed a *separate single-file* `GRAPHICS-LEDGER.md` to dodge
`LEAPFROG.md` tail-append conflicts — but merging `master` revealed the repo had **already** solved that with
the one-file-per-lesson `leapfrog/lessons/` convention (see `2026-07-08-conflict-free-ledger.md`). A standalone
append ledger is precisely the anti-pattern that convention forbids, so I deleted it and folded graphics into
the repo rule with a `graphics-` slug prefix for grouping.

**→ Systematize.** Two reusable systems fell out. (1) **The high-effort Fable gate ladder** for any quality-
critical multi-PR effort: **Gate 0 kickoff** (greenlight before any code) → **Gate 1** mandatory pre-build
design check per initiative → **Gate 2** blocking pre-merge gate (score ≥ 8 + adherence checklist: scope /
technique-match / coexistence-flag / zero-default identity / tier degradation / headless verification / lesson
filed) → **Gate 3** phase-boundary review vs the target bar. Each gate is an *actual* `Agent(model:"fable")`
spawn instructed for max thoroughness, judging from screenshot artifacts (no WebGL in CI). (2) **Sync before you
design conflict-avoidance:** always pull `master` first — a stale branch made me re-invent a solution the repo
already shipped. Conflict isolation for a parallel stream is: same-repo integration branch (merge to `master`
only at phase boundaries) + the existing one-file-per-lesson ledger + "new systems go in new files," *not* a
fork and *not* a bespoke ledger.

**→ Leapfrog.** The overhaul branch is now a template for any large art/engine push: a durable roadmap doc that
governs from line one, a Fable gate ladder that keeps ~20 PRs from drifting off the quality bar, and a hero
(Azure Drake) to prove each initiative on before roster migration. First concrete step: prototype the `?tm=`
tone-mapping chunk-override spike to produce the ACES/AgX/Neutral montage for the one taste decision, then run
Gate 0.
