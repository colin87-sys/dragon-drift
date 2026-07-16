# ARENA PR-A — THE HOLLOW BEHIND THE SKY: a mid-fight arena swap as a value-space env override

**What we did.** Shipped the first increment of THE UNMASKED's per-stage ARENA TRANSFORMATION: on the
S1→S2 crack the world itself transforms — the player is pulled THROUGH the tear into a darker
other-dimension (the void). Empty-first: the palette swap alone, no new geometry. Built through the full
gauntlet — plan → feasibility audit → identity design → identity audit → CP1 build-spec → build → CP2.

**The load-bearing structural choice: an arena swap is a VALUE-SPACE env override, never a rig takeover.**
The whole feature is one function (`arenaSkin.applyArenaSkin(env, mix)`) that lerps the live `env` scratch
(the shared per-frame biome atmosphere object, `biomes.js computeEnv`) toward an authored VOID palette,
called once from `environment.js updateEnvironment` before the fan-out to sky/fog/lights/water/motes. **Zero
scene-graph writes, zero new meshes, zero RNG.** This makes the reparent trap that killed EMBERTIDE's
face-organs (skyReplace → `scene.add(rig)` → `partWorldPos` resolves null) STRUCTURALLY UNREACHABLE — the
shipped lance organs + THE RECKONING can't break because nothing touches the scene graph. A `readFileSync`
string-assert (`arenaSkin.js` has zero `scene.add|new THREE.Mesh|...`) proves it at the source level; the
browser test proves an organ still resolves sanely in-lane with the void live (belt to the structural
proof). **When a boss wants to "own the sky," ask first whether it can be done in VALUE space — if the one
env scratch already fans out to everything you want to change, you never need to reparent, and every
downstream system (organs, aim, muzzle) stays byte-identical by construction.**

**The mix source MUST be a STATELESS getter, not a boss-ticked ramp.** `updateEnvironment` runs in EVERY
non-paused state (menu, game-over) while `updateBoss` runs playing-only — so a ramped arena value would
strand the world dark behind the death screen (the exact `embertideSky`-in-`resetBoss` teardown hole,
which is REAL and re-confirmed). `bossArenaMix()` is a pure function of `(active, def.arenaStates, phaseIdx,
stageBeatT)` → any teardown/skip/death self-heals the env + the prop gate within one frame, no ramp to
strand. Every derived flag it feeds (`game.bossVoidSky`, the band latch) is still hard-cleared in BOTH
teardowns (the grep-both law). **A per-frame override that must survive states the boss controller doesn't
tick has to be stateless — derive it, don't accumulate it.**

**The env retint does NOT reach the biome PROP bands — they bypass it (the audit's silent-ship catch).**
The monoliths/arcshards are static-emissive InstancedMeshes recycled every frame independent of `env`, so a
pure palette swap ships the void with fully-lit biome props marching through it. Fix: a value-space
`mesh.visible` gate (`arenaPropsGate` AND-ed inside `updateBandVisibility`, re-evaluated on the mix-crossing
edge so a mid-void recycle can't flip a band back on), restored self-healing by the stateless source.
**"One scratch fans out to everything" is a claim to VERIFY per consumer — enumerate every reader; the one
that caches or bypasses the scratch is where the feature ships broken.**

**Order-of-operations catch: the void's bullet-band override had to ship in THIS PR, not the next.** The
plan deferred all band re-resolves to the heaven PR, but the default dark band `0x8f0a3c` (L .164) FAILS
all four void backgrounds — the void alone is a parry fairness break without `dark: 0xa84167` (Astral's
certified lift). A one-shot latch swaps the band when the mix first hits 1 (the reveal, in the held-fire
window; new-spawn colouring, so no in-flight bullet recolours). `tests/bulletcontrast.mjs` gained the arena
rows (import `ARENA_CONTRAST` from the module = one source of truth) — merge-blocking on any future palette
diff. **When you split a feature across PRs, re-check that each PR is INDEPENDENTLY fair; a fairness
guarantee deferred to PR N+1 is a fairness break shipped in PR N.**

**The headless test seam: skip the stage beat to snap the arena deterministically; the live ramp is
rAF-throttled.** `stageBeatT` (the arena's clock) crawls under a node-level `waitForTimeout` (headless
throttles the game loop when the scene is idle) — so the intro-beat ramp never reaches mix 1 headless.
The surge-tap SKIP path (`input.surgeTap` during a skippable beat) zeroes the beat → the stateless getter
snaps to 1 → deterministic. But note the derived flags (`voidSky`, the band latch) are set by `updateBoss`
a frame or two AFTER the getter snaps, so a test must poll until the DERIVED flag settles, not just the
getter. (The same headless-throttle nuance bit the rung-14 burn-drain — poll inside `evaluate` to keep the
loop warm.)

**A latent finding the skip exposed (out of scope, flagged): the FULL stage-2 pose sits higher than the
throttled one.** Completing the transition (the skip) puts `wingEye0` at world-y ~22.2 at the sway peak —
0.2 over the slacked comfort target (still well under the true aim ceiling ~24.6). The rung-14 organ test
measured the *throttled, partially-scaled* pose (~19.5) and greened. This is a pre-existing rung-14
comfort marginal, arena-independent (the value-space arena provably doesn't move organs); recorded here and
flagged for a rung-14 follow-up, NOT patched from the arena PR (don't reopen another increment's baseline
from yours). **A skip/complete seam can reveal that an earlier test measured a partial pose — when a snap
changes a number the old test never saw, the old test was measuring the wrong frame.**

**What it unlocks.** The APEX's "the world reacts" beat, on real rails: PR-B adds the S3 HEAVEN (which the
identity audit already found needs a boss-file focal LIFT — the shipped star-eye is darker than the gold
sky, so without it the finale reads as "a floating mask on a sunset"), then the Blanks (the void's
unfinished mask-ovals) as their own gated geometry increment, then the flood/feel iteration. The
value-space spine carries all of them.
