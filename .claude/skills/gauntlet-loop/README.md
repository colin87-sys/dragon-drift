# gauntlet-loop (vendored skill)

Source: https://github.com/robonuggets/gauntlet-loop

Technique by Matt Shumer. Skill implementation by Jay E (RoboNuggets).
Licensed CC BY 4.0 — see `LICENSE`.

`SKILL.md` is vendored verbatim from the upstream repo
(`.claude/skills/gauntlet-loop/SKILL.md`). To update, re-copy it from upstream
rather than editing in place, so the attribution above stays accurate.

## What it does

Turns a goal into one short, paste-ready prompt that makes an agent set a
concrete quality bar, split the work into small judgeable pieces, run a builder
and a separate harsh critic on each, compare blind against the bar, and loop
until it wins.

Invoke with `/gauntlet-loop`, or just say "gauntlet this" / "make a gauntlet
prompt for X".

## Why it fits this repo

It is the same shape as the Fable-critic-per-checkpoint process already used for
dragons (`reforged/DRAGON-DESIGN.md`) and the gate-convergence protocol in
`reforged/AAA-PIPELINE.md`: a named bar, a separate harsh judge, and an exit
condition that is *winning the comparison*, never a round count. Use it to
generate the loop prompt for new hero work where no gate doc exists yet.
