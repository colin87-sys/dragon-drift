# CP1 pre-assessment → PR-A buildspec: re-verify the moved tree, and a plan's PR-split can hide a fairness bug

**What we did.** Turned the four UNMASKED arena design docs (plan + audit, identity + audit) into a
reconciled, mechanical PR-A build spec against CURRENT master (`docs/unmasked-arena-PR-A-buildspec.md`).
Every seam re-read fresh: nothing moved (the two parallel merges since the audits' pin touched dragon
files only), and the single-consumer `computeEnv` thesis re-confirmed at `environment.js:497`.

**The catch worth the whole pass — a PR-split ordering bug the audits missed.** The plan ships the void
in PR-A but defers the bullet-band re-resolve to PR-B ("both arenas' overrides land as one mechanism").
Re-running the contrast gate: the default dark band `0x8f0a3c` (L .164) FAILS all four void backgrounds
(direct .099–.136 < .15; the layered read is dead below bg L .28). So PR-A "as planned" ships a fairness
break in its hero increment, and the T3 gate the plan itself mandates for PR-A would hard-fail on it.
**Reusable:** when a plan splits one mechanism across PRs, re-run each PR's own gates against ONLY what
that PR ships — a dependency that's satisfied "one PR later" is a regression in the window between.

**Two simplifications only a fresh code-read finds.** (1) The boss→environment per-frame channel the plan
designs already EXISTS: `updateEnvironment` takes a threaded `bossTarget` param (`environment.js:492`,
fed at `main.js:1415`) — the arena mix is just an 8th param, same idiom, no new plumbing pattern.
(2) `updateEnvironment` runs in EVERY non-paused state (gameover/menu included, `main.js:1354`) while
`updateBoss` is playing-only — so a STATELESS mix getter (`bossArenaMix()` = pure function of
`active/def/phaseIdx/stageBeatT`) makes every restore self-healing within one frame of any teardown,
where the EMBERTIDE ramp idiom needed hard-restores precisely because its state was ticked. **Reusable:
prefer a stateless getter over a ticked ramp for any boss→world signal; the snap/teardown/death-screen
cases then fall out correct by construction.**

**The prop-band gate needs the FLAG inside `updateBandVisibility`, not a one-shot write.** A naive
`mesh.visible = false` sweep gets undone by `recycleBand`'s own visibility re-evaluation (`environment.js:461`)
on the next mid-void recycle. The gate is a module flag ANDed into `updateBandVisibility` itself + an
edge-triggered re-evaluate of all bands — recycling (and the `rnd` stream) keeps running untouched, so
determinism and restore are free.

**What it unlocks.** PR-A is GO-WITH-FIXES with zero open blockers: the spec is step-by-step buildable
(new `arenaSkin.js`, stateless mix, F1 prop gate, band override in-PR, `game.bossVoidSky` cleared in BOTH
teardowns per the F12 template hole, R4 disc deferred with a pre-authorized fallback). The remaining
judgments (S2 silhouette, Astral-source read, flood motion) are Fable/owner gate items with named montage
frames, not build unknowns.
