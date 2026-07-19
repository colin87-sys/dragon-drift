# 2026-07-19 — DRIFT hero build: the currency ships as one event-bus subscriber

**Did / learned.** Built the DRIFT momentum currency (DRIFT-BUILD-PLAN.md items 4-6) behind
`CONFIG.DRIFT.enabled` / `?drift=1`, default OFF — roster byte-identical (gold-determinism +
auroraflow + boss suites green). The whole currency is ONE new module (`js/drift.js`) that
subscribes to the existing event bus — `ring/gate/orb/roll/nearMiss/goldEmber/flowChain/
bossReflect/bossCard/...` all already emit, so feeding a new economy needed **zero emitter
edits**. Expression rides the shipped `canyonSlip` co-scale chain as a second factor
(`player.js`: steer ×, targetSpeed ×, assist ÷) so reachability stays fair by construction;
the §2 middle-path ruling landed as: base factor ×1.15 open-sky only (1 in canyons/bosses),
flow canyon = overdrive (the SAME meter drives the slip target to ×1.30; a missed gate is a
−0.35 severity dent, not the old wipe), boss = different expression (bleed paused, fight
verbs feed, M2 surge-charge boost with the D≤0.5 in-boss clamp; M1 stays A/B-gated OUT).
§4a governors baked in: F2 pays nothing while `feverActive` (fever IS Surge — a listener-side
`!feverActive` gate implemented the `!surge` governor with no payload change), F1/F2 carry
per-encounter caps reset on `bossStart`. Perfect radius half-compensates (§3.3) via a
`driftPerfectRadius()` consumed inside `collect()` — no signature churn. Telegraphs
time-normalize via one optional `speedAbs` param on `updateObstacles` (k = speed/65),
passed only when drift is on.

**Gotcha.** The headless test's own arithmetic tripped the meter's 0-floor: a dent bigger
than the current meter clamps, so "expected = a + b − dent" assertions must first feed
headroom. The floor is a feature (never negative), but tests must respect it.

**→ Systematize.** Two patterns. (1) **New economies = new subscribers, never new emitters:**
if the event bus already narrates the game (97 emit names), a whole currency is one module +
one config block + a handful of expression taps — blast radius stays reviewable. (2) **The
listener-side governor:** when an emit lacks a flag you need (bossReflect has no `surge`
field), check whether a game-state read at listen time (`game.feverActive`) IS the flag —
zero payload migrations. Also: any "second factor" on speed MUST ride the full co-scale
chain (steer, target, assist) — a speed-only multiply silently breaks the reach audit.

**→ Leapfrog.** The meter now exists, is provable headless (`tests/drift.mjs`), and got its
v1 face in the same PR — the EMBER KEEL lives INSIDE the `.gauntlet-x` slug box
(replace-not-stack; anchors untouched); `uitokens` rule (d) rejected the first draft's
`width` transition, forcing compositor-only motion (scaleX fill + translateX head) — the
test harness enforcing the perf laws is the leapfrog working as designed. Next: the owner
feel-pass on `?drift=1` against the plan's numeric gates (≥50% connective flight above
×1.05, longest dead stretch ≤8s), then the crest fold-in porting its verbs into the Keel's
overdrive state. The flowChain crest/score still runs in parallel when the flag is on —
the fold (score + crest retirement) is deliberately deferred to the Keel PR per §7's
score-policy ruling.
