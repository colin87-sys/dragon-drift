# Process — GATE graphics work by LOOKING at the rendered frame, not just the numeric probes

**What happened.** The boss "fire-rim" (composition #1 v1) shipped to the owner looking wrong — bright fire
tips that camouflaged the silhouette instead of a subtle depth rim. The owner asked the fair question: *"Was
this pre-assessed and gate-checked to see if the output matched the vision?"* The honest answer was **no** —
and the miss was entirely avoidable.

**The failure was a PROCESS gap, not (only) a design gap.** For the boss rim I did: Fable PLAN → build →
TECHNICAL verify (unmaskedarena probes, smoke/bossboot green) → ship to owner. What I skipped: **looking at the
rendered picture against the vision.** The Fable plan *itself* said "item 1 gets its own Gate-1/Gate-2 pass" and
I didn't run it. Worse: **the capability was already there** — `unmaskedarena.mjs` calls `page.screenshot()` to
measure pixel *brightness*; I read the numbers off that screenshot and never opened the image. A 30-second look
would have made "these are bright fire tongues, not a subtle rim" obvious before it ever reached the owner's
phone. The first visual judgment was the owner's — a wasted round-trip.

**Two compounding gaps (name both):** (1) the written vision itself was off — Fable wrote "hot gold fire-edged
rim / eclipse," which didn't match what the owner pictured ("super subtle glow for depth"); a second Fable
art-director pass corrected the *vision*. (2) There was no visual gate on the OUTPUT, so nothing caught the
mismatch regardless of whose vision was right. Relaying a plan faithfully is not the same as verifying the
build matches intent.

**The rule — for any GRAPHICS/composition change with a visual intent, LOOK at a rendered frame before
shipping to the human.** The main model CAN view images (Read a PNG); subagents cannot (Agent takes text) — so
the visual gate is the MAIN loop's job, not something to delegate. The mechanism (now a kept tool,
`reforged/tests/_rimshot.mjs`): drive the browser harness to the target state
(`bossSetDefIdx/bossSetStage/spawnBoss/bossForceFight` → wait for the arena flags), `page.screenshot({path})`,
then Read the PNG and self-critique against the written vision. Do this BETWEEN "tests green" and "ship to
owner," every time the change has a look.

**Honest caveat that must ride with it — SwiftShader is not the real GPU.** The headless renderer under-renders
bloom/ACES and lit the boss browner/lighter than the owner's phone. So the visual gate reliably catches GROSS
mismatches ("bright fire vs subtle rim," blown highlights, wrong colour, missing element, black smears) but
CANNOT judge the final subtle read (whether a whisper-rim lands as "whisper" or "invisible" after real bloom).
State which of the two a given finding is. The owner's real-GPU preview stays the final arbiter of subtle
feel/motion — the gate's job is to stop the OBVIOUSLY-wrong builds from ever costing him a round-trip.

**Reusable takeaway.** "Tests pass" ≠ "looks right." Numeric invariants (fairness probes, margins, byte-identity)
prove the change is *safe and correct-by-spec*; they say nothing about whether it *matches the visual
intent*. Those are different verifications and BOTH are owed before a look-sensitive change reaches the human.
The image was one Read away the whole time.
