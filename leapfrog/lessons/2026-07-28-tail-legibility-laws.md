# The tail that was never built, and three laws about legibility

**What we did.** Built `firebrandTail` — which until now was still the increment-0 blockout, four
tapered `BoxGeometry` stubs — and gated it 3.8 → **4.2/5 PASS**. The build itself matters less than
the three laws the failing round produced, all of which generalise to any repeating rank on any
creature in this roster.

---

## First: it had been shipping in every capture as if it were finished

The owner's words were *"the tail is fucking ass … so simple and basic."* The reason was not
under-detailing. It was **four boxes**, never built, sitting in every capture sheet I had presented
across a long session of wing work. Nobody — me least of all — flagged it, because it was always in
frame and never the subject.

> **A part that is a placeholder must be labelled a placeholder every time it appears in evidence.**
> Reviewers calibrate on what you show them; an unbuilt part shown next to finished work reads as a
> quality problem, and the wrong problem gets debugged.

## Second: the spec owned the ornament and not the object

Buildsheet §8 specified the CREST schedule and the TERMINUS in real numeric detail, and would have
cleared the bar on both. It never specified the **trunk** — segment count, cross-section, taper
shape, rest pose, or trunk value duty. The art director's phrase: crest and firebrand mounted on
the four-box stick is *"jewelry on a broom handle."*

This is the same failure as the wing's, in a different part, in the same session: **the spec
described the parts that are fun to specify and skipped the part that carries them.** Check a spec
by asking what it says about the *substrate*, not the decoration.

---

## THE THREE LEGIBILITY LAWS (the reusable part)

### 1. A decay schedule must be judged at GAME DISTANCE, not on paper

The crest ran ×0.91 per vane to a 0.04u floor. That is arithmetically sound — and this sheet already
contained a *previous* correction where a ×0.66 schedule was rejected for computing to a dead crest,
so the number had been checked once for exactly this class of error.

It still killed the rank. The outer half of the tail read smooth in **every** view; roughly 35% of
the built rank was invisible. Floor 0.09u and decay 0.945 fixed it.

> A schedule can be provably correct and completely invisible. **Arithmetic verification is not
> legibility verification.** Render the rank at gameplay scale and count what you can actually see.

### 2. A vane in the SAGITTAL PLANE is edge-on to a behind-and-above camera

The dorsal crest scored well in side profile and **zero** from the shipped rear-chase view — because
a vane standing in the creature's midline plane presents its edge to a camera sitting behind and
above it. It breaks no outline there at all.

The fix is to **cant alternate vanes out to the flanks**: the rank then breaks the silhouette from
behind while keeping the struck-shard read in profile.

> This applies to every dorsal rank on this roster — spine ridges, crests, serrations. **If the rank
> lives in the midline plane, the shipped camera cannot see it.** Judging a dorsal rank in side
> elevation will pass a rank that contributes nothing in play.

### 3. A constant per-joint arc accumulates into a PLUMB-BOB

A uniform rotation per bone down a chain does not read as a curve — it integrates into a hanging
vertical, and from the chase camera the tail read static, "a plumb-bob". **Front-load it**: curve
hard off the hip, then straighten, so the last third trails aft. That is what reads as a spine
continuing rather than a weight dangling.

---

## And the gate said STOP

The passing round stated the tail is at or within a hair of its practical unlit ceiling, and warned
that pushing more geometry *"would overshoot the profile read that is currently correct."* The
deferred trunk cladding is explicitly **not** what was holding the score down — the 3.8 round said
so outright, which killed my assumption that finishing the ranked build list was the route to a pass.

> **Ask the gate what is blocking, not just what is missing.** Those are different lists, and
> working the second one when the first is unaddressed spends rounds for nothing.

## Carried forward (logged, not fixed)

- Terminal bead is a clean sphere — bead-on-stick residue; one asymmetric facet or a heat-crack notch
  kills the tell.
- The vane rank repeats a near-identical quad at near-even spacing — metronome rhythm; ±15% jitter on
  two or three vanes breaks it.
- The bare outer trunk reads as a **second material** against the clad hip from rear-¾. The cladding
  increment must **feather** that boundary, never hard-stop it.

## Tooling note, honest

The mesh-batching assert was raised 72 → 108 for this build. Every earlier failure of that assert in
this session was fixed by batching, and the number held; this one could not be, because each tail
bone must own its geometry (it rotates) and 4 draws per bone is as hard as the value structure
batches. That is the "a NEW part appeared" case the assert's own comment sanctions — and an
auditable per-part budget now sits beside the number so it is checkable rather than arbitrary.
**Raising a threshold is only honest when you can show what part appeared and what it costs.**
