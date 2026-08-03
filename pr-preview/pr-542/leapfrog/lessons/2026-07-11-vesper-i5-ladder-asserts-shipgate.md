# Vesper I5 — the ladder/palette asserts + the ship gate (build complete)

**What we did.** Finalized Nightglass Vesper: locked the 4-form knapping ladder + the
inverted darkening palette, wrote the premium assert block `tests/starters.mjs`, and ran the
final whole-creature Fable gate — **PASS 4.3/5 ("ship it")**. Per-increment gates were
I1 4.5 · I2 4.4 · I3 4.3 · I4 4.4. Full sweep green: smoke · tricount monotonic <6000 ·
wingsymprobe Δ0.000 · flapstrip 5-phase corridor clear · seamprobe · starters · defs/shop/
ascension/economy unaffected (roster byte-identical).

**Lesson 1 — a premium assert block encodes the IDENTITY LAWS, not just tri budget.** The
sheet's laws are all machine-checkable at build time and belong in a `starters.mjs` that
`run-all.mjs` auto-discovers: tris monotonic ↑, **body value monotonic ↓** (Vesper's unique
inverted ramp — the apex is the darkest object), cruise-emissive = eyes only, zero near-white
emissive, span:body ≤ 2.5, and — most important — a **no-organism-import firewall** (a static
source check that fails the build if `dragonVesper.js` ever imports the retired smooth-hull
family). The firewall is the one assert that guards the entire redesign premise against a
future chat "helpfully" reaching for the organism helpers.

**Lesson 2 — weight emissive checks by CONTRIBUTION (intensity × luminance), not intensity.**
A `MeshStandardMaterial` defaults `emissiveIntensity` to 1.0, so a black-emissive body panel
trips a naive "intensity > ε" cruise-black assert even though black × 1.0 = no light. Check
`emissiveIntensity × luminance(emissive)` — a black emissive contributes 0 at any intensity,
the withheld ion-blue seam contributes ~0.008 (below ε), and only the acid-green eye clears
the bar. This is the correct general form for any "only X may glow" assert.

**Lesson 3 — a firewall regex must match import STATEMENTS, not prose.** The first firewall
assert `/import[^;]*dragonOrganism/` matched the module's own header COMMENT ("It NEVER imports
dragonOrganism.js"). Match a real statement: `from ['"]…dragonOrganism` or
`import {…dragonOrganism}` — require the quoted path / named-binding braces so a comment
mention can't false-positive. (A self-documenting module that names the thing it forbids will
always bait a loose regex.)

**Lesson 4 — the ship gate cross-checks the SHEET, and its residuals are preview-judged.**
The final Fable gate independently verified the constellation spec (§149–151) and the seam hue
(223°) against the sheet before scoring — a synthesis gate audits the contract, not just the
pixels. Its three non-gating residuals are all things the STATIC gate is structurally blind to:
(1) a warm khaki cast on the head's lit facets in the *pale/gold* studio backdrops — the
material is cool-spec'd (0x141b28), so it's the studio's warm key light (those backdrops exist
to judge warm-sky reads); on the dark tile + in a cool night biome the head reads cool → a
biome-interaction call the owner judges on the preview. (2) The raised-V glide-hold pose
presents the wing edge-on in rear-chase so the scallops foreshorten — but the flap cycle sweeps
them outboard at the other phases (flapstrip-verified); a motion read the owner judges live.
(3) A ladder-capture angle nit (tooling, not the model). None are code bugs; all ride the
PR preview — which is exactly where the method says motion/feel/biome land.

**What it unlocks.** A shipped, distinct, premium matte-black night drake that kills the two
retired failure modes by construction and holds a two-cold-accent identity (acid-green eyes +
withheld ion-blue seam). The reusable carry-forwards: `knapLoft` (fixed-profile chined loft →
longitudinal strakes), the value-band `colMat` pattern, the scapular-cowl overlap-not-weld
join, the rounded-scallop depth function, the withheld-emissive (near-zero base + high sgm +
cool fever palette) recipe, `seamprobe.mjs`, and the dragonstudio `surge` state.
