# Drowned Forum — breaking the small-prop METRONOME (the count pyramid was fine; the SAMENESS wasn't)

**What we did.** The owner, playing the shipped default biome 0 on his phone, reported "a lot of the smaller props
repeating." A Fable audit against the objective instance census confirmed it and split the problem cleanly; two cheap
levers (P1 + P2) took the metronome from **9/11 frames → 2–3/12** (Fable's own pass bar was ≤4/12), breaths now
one-sided. Determinism byte-identical; the fix even freed tri budget (49 914 → 48 754).

**COUNT PYRAMID ≠ ON-SCREEN READ. Two different things, judged separately.** The forum's density is a deliberate
pyramid — 64 drumfall → … → 2 arena — so the cheap foils PRICE the rare heroes (a hero reads as an *event* because
grey stone was spent around it; the owner's own favourite frame proved the law works). That pyramid was never the
problem and must not be gutted. The problem was **sameness at a given count**: a foil bed is a POPULATION (you
register texture); a metronome is when you recognise the SAME INDIVIDUAL again. The line between them is a product of
four factors, and the forum's foils maxed all four: single-mesh silhouette × high count × a high breath-floor ×
near-field stacking. **When "too many props" comes in from playtest, don't cut the counts — first ask which axis
(mesh variety / floor / stacking / rest-cadence) actually crossed into recognition.**

**P1 — FLANK-STAGGER THE MONOCULTURE (the biggest win, two numbers, zero tris).** The breaths had become a ~70% rail
monoculture because BOTH mirror-variants (viamarina + viamarinaM) carried `comp.floor 0.30` — the kit's highest — on
BOTH flanks. So an open stretch was "both horizons lined with identical posts." Fix: drop the MIRROR's breath floor
0.30→0.05, keep the primary at 0.30. Now a breath keeps its rail on ONE flank (the walled-corridor rationale
survives) while the OTHER opens to the fog line. "Both horizons of identical posts" → "a rail one side, open gold
water the other" — the single strongest image-fix, and it costs two characters of config. **A paired/mirrored prop
should almost never share the same breath floor on both flanks — stagger them so the rest-register isn't a solo.**

**P2 — THIN + WIDEN THE SINGLE-MESH FOIL.** drumfall was 64 of ONE mesh at a narrow size envelope. Step 29→34
(64→54, still the most common prop — pyramid intact) plus a wide per-instance size spread (r 6–9→6–10.5, h 7–9→
5.5–10). **A ~2:1 size spread across a field of one mesh is the cheapest possible "these are different ruins" signal
— a wide COLLAPSE-STATE envelope (some barely break the tide, some stand tall) beats adding meshes.** Height is
vertical-only, so widening it is free of lane-clearance risk.

**WHAT WE DIDN'T DO, ON PURPOSE.** basilica (54) is high but it's a continuous dark WALL — walls don't count as
individuals, so leave it. Heroes stay rare (that's the vision). roofline (new, 38) is the MODEL foil — differentiated
on hue AND silhouette AND placement — so it never metronomes; keep it. The residual 2–3/12 are all congregation
PEAKS, where both-sided density is intended; the only remaining tell there is the single rail SILHOUETTE, which is a
named structural lever (a second, genuinely-different rail survival variant) held **in reserve, keyed to owner feel**
— not spent pre-emptively, because 2–3/12 is under bar and peaks are meant to be the loudest part of the cycle.

**PROCESS: a deferred non-blocking flag + real-play confirmation = a blocking fix.** Fable had itself flagged the
"pier-post metronome" in the PR-8 full-cycle review and logged it as a non-blocking fast-follow. The owner
independently reproducing it on a phone is what upgraded it. **When a human confirms a flaw you already deferred,
it's no longer deferrable — the deferral was a bet that it wouldn't matter in play, and play just settled the bet.**

**What it unlocks.** The count-pyramid-vs-on-screen-read split (cut sameness, not counts); flank-stagger for any
paired prop's breath floor; the wide-size-envelope clone-breaker for single-mesh foils; and the rule that a
playtest-confirmed deferred flag becomes blocking.

**Verify:** `node tools/envcount.mjs` (band 48 754 < 50 000); `node tests/gold-determinism.mjs` byte-identical;
`node tests/biomecycle.mjs` 14/0; two-sweep `_forumscene.mjs` full-cycle strip judged IN ORDER → metronome ≤4/12,
breaths one-sided (Fable re-count 2–3/12, PASS).
