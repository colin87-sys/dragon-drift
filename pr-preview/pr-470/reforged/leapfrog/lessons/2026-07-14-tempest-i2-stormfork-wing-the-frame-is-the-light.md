# Tempest I2 — the STORMFORK wing: the FRAME is the light, and glow-width must not track tent-width

**What happened.** I built the STORMFORK (the hero wing): a bolt-frame whose skeleton IS a frozen
forked lightning bolt — a `boltArm` gull arch with 3 kink-knuckles (single global Y-max at K2, the
fold), a Y-fork branching AT K3, decaying aft rays, cupped OPAQUE membrane bays, an open fork-crotch
V-notch, silver rim-caps, a hum-lit near-white glow frame, and the crackle-churn blade pivots. First
gate = REVISE; one targeted fix round = PASS. The revision is the reusable lesson.

**THE LOAD-BEARING FAILURE — "a lit EDGE is not a lit GARMENT." The wing read as a dark bat-membrane
with a glowing front edge, the exact reskin the whole build fights.** The cause was subtle and
mechanical: my `boltRidge` painted the glow as a thin ribbon whose width was a FRACTION of the
structural tent width (`gwB = wB * 0.5`). The arm tent is thick (`wB 0.16·hs`) so its bright strip
read; the aft rays are thin (`wB 0.06·hs`) so their bright strip was a thread swamped by the dark
charcoal tent sides. Result: the arm crest lit, everything aft of the fold went dark — "bat wing +
lit edge." **The glow that carries a reference's identity must be sized to READ, not scaled off the
structural member it rides.** The fix: make the glow a WIDE 4-face CAP (~0.82 of the ridge width,
lifted proud) on EVERY bolt regardless of its tent width, with the charcoal showing only as a thin
shadow-bevel down the side. Every ray/prong then reads near-white at cruise — a lit forked skeleton
webbed with dark cloud (the reference verbatim). *When a lit component reads on the thick member and
dies on the thin one, the bug is that the light is a fraction of the member, not an authored width.*

**The value-BALANCE fix that converts "bat wing" → "forked bolt": chop the big dark triangle so
every dark bay is FLANKED by lit frame.** Even with the rays lit, one huge undivided near-black
membrane triangle (dominant ray → first aft ray) still read as bat-webbing. The reference's membrane
is many SMALL dark bays between bright rays, so bright:dark is ~balanced and "forked bolt" reads
instantly. Two moves did it: (1) insert the fork PRONG tip into the membrane fan so the big triangle
splits into small bays; (2) deepen the inter-lobe cusps (cup 0.42, bay-centre drop 0.13). The
fork-crotch (F0→prong) is a DEEP cup (0.62) toward the fork vertex K3 — its trailing edge notches
hard inward = the open V-notch (a concave notch, NOT an enclosed aperture — the anti-lantern C-guard
holds). *Bright:dark balance is a silhouette lever: lots of small dark pockets flanked by light reads
"skeleton"; one big dark field with a lit rim reads "membrane."*

**The garment doctrine, applied to a LIMB (reusing I1's material flow).** The wing's near-white arc
mats (`arcSeam`/`arcCore` + the knife-edge) are returned in **`flareMats`**, NOT `spineMats` — the
rig merges wing `spineMats` into the global spineMats (which get the warm cruise rim `0xfff0d8`, poison
for a 255° family) and merges wing `flareMats` into the global flare list (held at
`userData.baseIntensity = humFloor·mul` by the flare loop's else-branch every non-surge frame). So the
wing frame hums lit at idle today with ZERO new engine code, and the I4 storm tick becomes the single
writer later. Same pattern the torso used; the wing calls `tempestMats(def, glow)` fresh, so its arc
instances are separate from the body's — both hum independently, no conflict. (Verified via
dragonModel.js: `wingsResult.spineMats → spineMats`, `wingsResult.flareMats → flareMats`.)

**The bolt = a beveled BRIGHT BAR proud of a RECESSED membrane (carved depth on the wing).** Each
`boltRidge` is now: a thin charcoal tent (the shadowed side + the occlusion bevel) + a WIDE near-white
glow cap on top (the lit bar) + a silver rim-cap on the ridgeline. The membrane bay centres drop below
the frame so each bolt OCCLUDES the dark cloud floor — depth from geometry occluding geometry, the
same carved-depth law the body's ranks use, never a painted value. That's the difference between
"passes silhouette" and "reads crafted" up close (the wing-4× crop is the tell).

**Reusable build facts banked (STORMFORK kit):**
- **`boltArm` is ONE module-level waypoint fn** (BOLT_T/Y/Z), piecewise-LINEAR, shared by geometry +
  tip markers + tests (the detach-gotcha law). The anti-sawtooth discipline is machine-checkable and
  passed by construction: rear-projection (X-Y) breaks 23°/51°/20° (all ∈[18,60], K1≥20, K2 the single
  global max), a single global Y-max at K2, and the STEP delivered by the **Z jogs in TOP planform**
  (plan jogs don't project astern, so the rear silhouette stays an arch). Verify the breaks in pure
  math (no THREE/DOM) — I caught the K1/K3 angles being marginal and re-tuned the waypoints before
  rendering.
- **The fold rig is Vesper verbatim:** pivot→mid(arm root→K1→K2)→tip(HAND at K2); `tip.position=K`,
  `hand.position=−K` (−anchor → rest pose byte-identical); LEFT = outer `lmirror scale.x=−1` wrapper
  PARENTING the pivot (never on the pivot). The top-planform render is the symmetry proof (mirror-clean).
- **The crackle-churn blade pivots** (`wingBladePivotsL/R` = `[{pivot, idx, side}]`): idx0 a Group AT
  K3 owning the branch prong+spur, idx1 at the aftmost aft-ray root (=K). Each pivot's geometry is
  authored in absolute coords then flushed with a `−anchor` offset so it rotates about the pivot node
  with boundary verts AT the node (no tear). The rig's lag walker (dragon.js:864) phase-lags them for
  free (nullable → every other dragon unaffected).
- **A batching accumulator per group** (arm / hand / each blade pivot) → a `−anchor`-offset flush →
  ~10 draws/wing with the whole kit. Concatenating tri arrays IS the merge.

**Process — the Fable loop, both ends.** BEFORE building: a fresh Fable studied the reference WING
specifically and handed back a numbered build spec (topology tree, kink structure, membrane shape,
glow read, carved-depth ranks, the 3 failure modes) — so I built to the picture, not just the sheet.
AFTER building: a SEPARATE fresh Fable gate (builder never judges own output) returned REVISE with 4
ranked buildable fixes → one fix round → PASS on the same agent re-gating the revision. The two crops
the gate named as "where pass/fail lives" (top-planform + wing-4×) are exactly where the fix showed.

**Roster integrity + a stale-assert fix banked.** The 52 other models stayed byte-identical
(tricount --ci diff clean; only tempest's own forms grew). One PRE-EXISTING failure surfaced —
`defs.mjs` asserted "exactly 9 SSSR procedural dragons" but the roster now has 11 (revenant + tempest
were added since that count was last set); it failed identically on HEAD before my edit. Updated the
count to 11 (tempest is a legitimate new SSSR dragon contributing to it) so the branch/CI is green.
*Adding a rarity-carrying dragon can trip a hardcoded roster-count assert authored before it existed;
grep the tests for the count when you add one.*

**What it unlocks.** The hero limb is landed and gated: the wing reads as the reference's lit forked
bolt-frame on dark cloud from every angle (top-planform + rear-¾ sing; rear-chase reads "BOLT"), with
Revenant-density carved craft up close. Two polish items ride the PR preview for later increments
(the root/shoulder junction is a touch busy where the frame meets the dorsal scutes — tidy at the
cowl pass; verify the wide glow caps keep their lit-top/shadowed-side/silver-rim at Surge peak, not a
blown white blob — confirm on a strike-frame when the I4 storm tick lands). Next: I3 (stormbrowHead —
kills the stub's warm-tan head-top band the gate keeps flagging — + virgaTail glowing crest + bolt-
tuft), then I4 the storm tick, then I5 the ladder + tests/starters.mjs.
