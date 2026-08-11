# 2026-08-11 — Vendored the `gauntlet-loop` skill into `.claude/skills/`

**Did / learned.** Installed the [gauntlet-loop](https://github.com/robonuggets/gauntlet-loop)
skill at `.claude/skills/gauntlet-loop/` (SKILL.md verbatim upstream + LICENSE +
a README carrying the CC BY 4.0 attribution). Skills in `.claude/skills/<name>/SKILL.md`
are auto-discovered — no `settings.json` registration, no build step, so a skill is
"installed" the moment the file is committed. Gotcha: vendored third-party skills rot
silently. Keeping SKILL.md **byte-identical to upstream** and pushing every local
deviation into a sibling README is what makes a future re-pull a plain `cp` instead of
a merge.

**→ Systematize.** The skill encodes the same law this repo already runs on: a bar that
is *named, fetchable, comparable*, a **separate** harsh critic with fresh context, and an
exit condition that is winning a blind A/B — never a round count. That is exactly the
Fable-critic-per-checkpoint loop in `reforged/DRAGON-DESIGN.md` and the gate-convergence
protocol in `reforged/AAA-PIPELINE.md`, generalised past dragons. Its failure list is the
one to check when a gate passes suspiciously fast: vague bar → critic invents the
comparison and approves everything; builder judging itself; score-out-of-10 drift instead
of a binary A/B. Any new gate doc should name a fetchable reference, not a rubric.

**→ Leapfrog.** Gives us a generator for gate protocols in domains that don't have a
design doc yet (audio, UI/HUD, biome dressing) — ask for the gauntlet prompt first, run
it, and let the resulting loop *produce* the doc, rather than hand-writing another
`*-DESIGN.md` from scratch. Vendoring pattern also stands on its own: `.claude/skills/`
is now a live extension point for this repo, so future tooling (tricount/tiershots
wrappers, ledger hygiene) can ship as skills instead of prose in CLAUDE.md.
