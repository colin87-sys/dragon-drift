# Tempest flap animation — the depth-projection trap, and trusting geometry over a critic's pixels

**What happened.** The owner said the flap "feels like one plank" and wanted Revenant's shoulder-led
~12→5 o'clock beat with the wing itself "more in motion." Four Fable gate rounds took it from a held-glide
plank to a real articulated wingbeat. Three of the four rounds taught something reusable; the last two are
the load-bearing ones because they're about *why a correct fix can keep failing a visual gate*.

**THE GLIDE-HOLD DIAL IS THE PLANK.** The first diagnosis: the wing had `glidePow 1.9`
(`shape=sign(sin)·|sin|^1.9`), which HOLDS the glide pose and barely pulses, plus no `apexRoot` lift. That's
the "one plank held in a glide" the owner felt. The fix that started it: near-sinusoid `glidePow ~1.1` (beats
continuously), `apexRoot` to lift the recovery toward vertical, and deep root→mid→tip lags so the hand trails.
Matching a shipped dragon the owner already likes (Revenant's dials) is the fast start — but it was only the
start; the owner's "more in motion" needed three more rounds.

**THE DEPTH-PROJECTION TRAP — a wrist fold about the FLAP axis is INVISIBLE at the top of the upstroke,
because there the wing is vertical and that axis points at the camera.** This is the big one. I deepened the
hand's phase-lag so the hand never aligns with the forearm at either extreme (correct!) and the segment math
confirmed a real −9°/+17° wrist reversal. It STILL read as a straight blade at recovery. Fable nailed why:
at the top of the upstroke the wing is near-vertical, so the fold — which happens about the flap (z) axis —
projects into *depth* (toward/away from the chase camera), not into the silhouette. The camera literally
cannot see a fold whose hinge points at it. **Cranking fold amplitude never fixes this** — it just deepens an
invisible fold and makes mid-stroke floppier. The fix is to change the fold's AXIS at the pose where it's
invisible: add an in-plane wrist SWEEP (rotation.y, hand swept aft in the wing's plane) driven by the
shoulder's *unlagged* apex (`apexUp(phase)`, high at recovery) so it blends in only near the top. That turns
the fold into a dogleg the rear camera can actually see. Reusable rule: **match the articulation axis to the
silhouette the money camera sees at that pose — an articulation that projects into depth is craft the player
never sees.** (New opt-in dial `tipApexSweep`, defaulting 0 → roster untouched; mirrored into `wingDebugPose.js`
so the freeze/studio captures match live flight — always edit the poser in BOTH files in lockstep.)

**AMPLITUDE THAT COMPUTES RIGHT CAN STILL BE INVISIBLE.** An earlier round set the phase offset correctly but
the wrist-fold amplitude was tiny (−2.3° hand droop). Fable: "−2.3° over a 100px hand is ~4px — swallowed by
strut noise; phase-correct in the spreadsheet, a plank on screen." A geometrically-real articulation below the
pixel-noise floor at gameplay distance doesn't exist. But the ceiling matters too: the whole shipped roster
uses tiny tip amps (Revenant 0.09); going 10× would read as a rubber hose. The window was `tipAmp ~0.8`
(visible fold, still structural) — verified by rendering the mid-stroke pose to check it wasn't floppy.

**TRUST GROUND-TRUTH GEOMETRY OVER A CRITIC'S PIXEL MEASUREMENT — a confident critique built on a noisy
measurement is still wrong.** The final gate measured the two wings on an in-GAME screenshot and reported a
stark asymmetry (left 16–20° dogleg, right 5–8° plank), diagnosed a mirror sign-bug, and even predicted the
numbers (6+14 vs |6−14|=8) — a *very* convincing story that pattern-matched the known −anchor+mirror gotcha.
It was WRONG. A direct dump of the posed world coordinates showed the wings mirror-identical to 3 decimals
(R wingtip (2.342,5.531,0.396) ↔ L (−2.342,5.531,0.396); `wingsymprobe` Δ0.000). The sweep is added to
`rotation.y` *identically* to the existing `tipSweepBase` that already mirrors correctly via the `scale.x=−1`
wrapper — no per-wing sign, no bug possible. The "asymmetry" was the critic's own admitted noise: one wing sat
against a dark cluttered city/water background and its edge-extraction was unreliable (it flagged "no stable
structure" itself), while the clean wing measured 16–20° (past its own 12° bar). **When a critic's conclusion
is contradicted by exact geometry AND its failure was on data it flagged as noisy, the geometry wins — then
remove the confound rather than argue.** The confound was the game background; re-shooting the SAME recovery
pose on the neutral STUDIO stage (`dsRender` state:'recovery', pale bg) gave both wings against a flat backdrop
where the symmetric gull-wing dogleg is unmistakable on both sides. A verification that fails should first be
asked *"is the MEASUREMENT trustworthy?"* before you "fix" a bug that the ground truth says isn't there.

**Tooling banked (all reusable, kept):** `_onephase.mjs` (one browser boot per node process — the 5-boot
flapstrip crashes the shared browser on the 3rd boot in this env; render extremes one process at a time);
`_montage.mjs` (stitch stills into a labelled strip, canvas-only, no game boot); `_recshot.mjs` (clean
neutral-stage capture of ANY wingDebug state — the studio only ships glide/fold/bank, so this shoots recovery/
downstroke on the pale backdrop for noise-free measurement); `_handprobe.mjs` (dump L/R wrist+tip WORLD
positions at a pose — the ground-truth symmetry check that beats a pixel measurement). Env gotcha: browser boot
is ~3 min and flaky; render detached with `nohup` so a mid-turn user message doesn't kill the job, and always
COMMIT+PUSH the dial change before rendering (a container reclaim reset the branch to an older clone mid-session;
the work survived only because it was pushed — the remote is the backup, the container is not).

**What it unlocks.** The Tempest flap is now a big shoulder-led ~12→5 o'clock beat where the wing visibly
curls/uncurls through the stroke: hand droops off the arm at the apex (via the in-plane apex sweep so the rear
camera sees it), trails high at the bottom, and travels the fold out the wing mid-stroke — symmetric to 3
decimals, no tear, all suites green, roster untouched. The owner judges final feel on the live preview. Next:
I4 (the storm strike/Surge tick) + I5 (the ladder asserts + tests/starters.mjs) — systems, not motion.
