# Stiletto: art-director LOCK → engineer consolidation = a build-ready contract in one pass

**What we did.** Belladonna Stiletto's design ran the new two-role pipeline: a Fable ART DIRECTOR
reconciled the v0 build sheet with four concept images and issued a LOCK document
(`reforged/BELLADONNA-ARTDIRECTION-LOCK.md` — taste rulings, image corrections, feasibility
guardrails, an explicit "hand-the-engineer" section); then a Fable ENGINEER consolidated
`reforged/VENOM-BELLADONNA-BUILDSHEET.md` into a single v1 build-ready contract (§1–§10, Revenant
§B / Tempest v3 depth) implementing the lock exactly, with v0 + the §R/§F critic passes demoted
to a "do not build from here" appendix. Synthesis doc updated; queue unchanged (slot 3).

**What we learned (the pipeline).** Splitting AUTHORITY (the AD lock owns taste; the sheet
prose loses wherever they diverge) from MECHANICS (the engineer owns engine truth, and may
record deltas from the lock only where the census/rig forces it, each one flagged for sign-off)
kills the reconciliation burden that plagued the layered Tempest sheet era. The lock's
"hand-the-engineer" section is the key artifact: every ruling arrives already phrased as a
buildable feature + a law, so consolidation is translation, not re-design. Two recorded
engineering deltas this pass, both census-forced and owner-flagged: Surge bead motes 2→1
(default; 2nd behind perf-HUD proof — the Revenant wisp precedent) and the "0.35 phase"
disambiguated to radians at the rig hook (0.35 of the beat cycle = 0.35·2π ≈ 2.20 rad).

**The reusable design rule (hybrid creatures): DRAGON SKELETON, INSECT ANATOMY KIT.** A hybrid
reads as a dragon-that-evolved-X, never X-scaled-up, when the FORWARD half (head, neck, limbs —
the parts that answer "what animal is this") stays draconic and the exotic kit lives AFT (the
parts that answer "which dragon is this"). Stiletto: draconic skull-mask + 2–3-plate collared
neck + ONE tucked raptorial forelimb pair forward; wasp waist/3-window gaster/needle/four wings
aft. Corollaries that generalize: replace N thin alien limbs with one lofted clawed pair (six
insect legs = failure modes 2+7 and the loudest "bug" tell — and the tucked pair feeds the
rear-fill CORE mass for free); let an exotic appendage occupy the horn SLOT at horn GAUGE
(antennae base ≥0.12× head width) instead of adding horns beside it; keep the flight posture the
GAME's (horizontal, rear-chase) and rotate concept-art drama into the dorsal line-of-action.

**The engine gotcha (check for near-miss rig hooks before speccing new ones — then say WHY
they don't fit).** `parts.auxWingPivots` is confirmed ABSENT from `js/dragon.js`, but the rig
already runs a secondary wing pair: `wingPivot2L/R` (dragon.js:56–57/198/881–889, the Obsidian
T4 shadow flap). It is UNUSABLE for Stiletto's four-wing hum — in-phase (no 0.35 offset), fixed
0.6× amp, z-only, and it beats the direct-pivot `rootFlap` sinusoid, a DIFFERENT waveform from
the wingParts glide-hold `shape()` the forewings ride (the pairs would visibly disagree). The
honest spec therefore: a new nullable `parts.auxWingPivots = [{pivotL, pivotR, phase, ampScale}]`
ticked in ≤12 guarded lines at the END of the wingParts branch (reusing its local `shape()`/
`rootA`/bank amp so fore and hind share one waveform), patterned on the shipped
`wingBladePivotsL/R` null-array walker (62–63/207–208/862–871). Land rig surgery at I0, tiny,
with the no-op byte-identity proof (tricount FORM-row multiset + wingsymprobe re-baseline),
before any geometry depends on it.

**The census trick (N translucent panels = 1 drawable).** Stiletto's 3 sac windows share one
material and one static parent (the gaster) → merged into ONE `flatTriMesh`: 3 windows cost 1
transparent drawable, and the opaque emissive fills behind them cost zero. Plus opaque wing
hems (the Tempest fallback made native), the four-TRUE-wing budget lands at 6/6 cruise, 8/8
Surge, ≤2 alpha layers per ray. Generalizes: any multi-window motif on a rigid parent should
merge its transparency before counting it.

**What it unlocks.** The AD-lock → consolidation pipeline is now proven on two sheets (Tempest
v3 self-consolidation, Stiletto lock-driven) and is the template for the remaining Fresh Five;
Stiletto is BUILD-READY behind Tempest in the queue, and the `auxWingPivots` spec doubles as
the roster's generic "extra flapping pair" hook (any future multi-wing creature reuses it).
