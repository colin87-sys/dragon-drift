# The wing spec that never described a wing

**What we did.** Rebuilt the Fornax wing after the owner rejected it on sight, and — more
importantly — closed the hole in `DRAGON-ANATOMY-REFERENCE.md` and `FIRE-WYVERN-BUILDSHEET.md`
that produced it. Four Opus research passes (segment proportions · membrane planform · leading-edge
sweep · how artists actually construct wings) fed a new **ref §4.9 PLANFORM** section and a
rewritten buildsheet §5, plus a new `tools/planformprobe.mjs` gate (P0–P11).

---

## The gotcha, and it is the whole lesson

**The buildsheet specified how Fornax DIFFERED from Vesper, and never specified a wing.**

§5 was a page of real, carefully-argued numbers: `archRise 0.12` (against Vesper's 0.4),
`wristT 0.30`, bay sag ≤0.10, a notch floor, propatagium area share, the DoubleSide emissive trap.
Every one of those is a *differentiator* or a *mechanism*. Not one of them is a **wing**. There was
no arm chain, no body attachment line, no chord distribution, no leading-edge sweep, and no
vertical profile.

So a builder could follow the sheet perfectly and still produce a membrane fanning from a single
hub — which is exactly what happened. The reference had the identical hole: it had settled
bat-vs-pterosaur topology, digit decay ratios and membrane area shares, and **never once said what
a wing looks like**. Every future winged creature in the repo would have inherited it.

> **The reusable form: a spec made only of deltas against a shipped asset is not a spec.**
> If someone who had never seen the donor read your section, could they build the thing? If the
> answer is "no, they'd need to look at Vesper first", the section is a diff, not a design.

Check for this by reading a spec section with the comparison asset deleted from your mind. What is
left is what you actually specified.

---

## Second gotcha: a SETTLED entry can be wrong, and the bar is falsification

SETTLED said *"Bat fan, 4 digits, dominant D1 — not the pterosaur spar"*, justified by
*"a single spar degenerates to the paper-dart read."* That premise is false. The paper dart is
caused by a straight trailing edge, a planar zero-camber membrane, and no joint break in the
leading edge — **not by spar count**. A fan with those three defects is a dart with extra spokes.

Two independent Fable passes overturned it at 5/5, and the fix that mattered (build an arm) was
identical under either topology.

> **Rule: a SETTLED entry is protected against re-arguing the TASTE, not against falsifying the
> PREMISE.** If you can show the stated reason is factually wrong, it reopens. If you just prefer
> the other option, it does not. Record the reversal *with the falsified premise visible* — the
> struck-through entry is more useful than a clean one, because the failure mode ("misattributed a
> real failure to the wrong cause") is what recurs.

---

## Third gotcha: THE PLANFORM IS AN X/Z TABLE, AND A WING IS NOT

This one nearly shipped. The rebuilt wing **passed all twelve planform assertions** — wrist
station, forward offset, chevron angle, concave trailing edge, monotonic chord, aspect ratio,
root seam, the lot — and then rendered from the shipped rear-chase camera as a **razor line:
31% wide, 9% tall.**

Because a planform is x and z. Nothing in P1–P10 looked at **Y**. A flat horizontal membrane is
*edge-on* to a behind-and-above camera, and the one view the spec was written to serve was the one
view it could not describe.

The fix is the gull curve (rise +0.035 L at the elbow, **+0.085 L at the wrist**, +0.065 L at the
tip — a shallow M, never a straight V), now ref §4.9.4b and assertion **P11**.

> **Camber is not the gull.** Camber is a chordwise bulge (6–10% of chord); the gull is a spanwise
> rise (8.5% of L). Different axes. A build needs both, and having one does not excuse the other.

---

## Probe lessons (three, all the same shape)

The probe caught four real defects the eye had not yet named — the propatagium scaled off the wrong
chord, the wrist claws punching forward through the leading edge, the boss doing the same, and the
bone leading the membrane at the shoulder. It also produced three **false** failures, each from
measuring the wrong thing:

1. **Vertex sampling under-measures silhouettes.** The spar is a prism with vertices only at its 9
   joint rings; between them the outline is a long quad edge with no vertex on it. A vertex-only
   probe read the spar at the joints and dropped to the membrane in between — a ±0.05u sawtooth on
   a smooth line, which the corner detector reported as a "146° wrist". **Sample along triangle
   EDGES.** Any probe measuring a silhouette from vertices under-samples every long thin face.
2. **Geometry resolution must exceed probe resolution.** 24 spanwise membrane strips against 40
   probe bins meant bins landed *between* strips and read as gaps. If the harness out-samples the
   mesh, it measures its own sampling error.
3. **Don't locate a feature by a detector with a free knob.** A sliding-window angle scan put the
   wrist at 0.297 (W=2) or 0.273 (W=3) — and picking the window that passes is choosing the
   answer. Worse, on a *correct* wing the propatagium deliberately **hides** the wrist, so there is
   no corner in the outline to find. **The wrist is a skeletal fact: read it off the rig.** The rig
   is still built geometry, not a declared constant.

And the standing one, honoured: **a widened target is not a pass.** The mesh-count check failed at
76/72 after the arm/hand rig split. Instead of raising it, two materials came out — the spar's
pale duty rail (a bright dashed line down a bone is cheap-tell #1 anyway; the pale tier moved to
the knuckles, where it marks structure instead of tracing an outline) and the propatagium's char
tier. 72/72, and the design improved.

---

## What it unlocks

- **`tools/planformprobe.mjs` is creature-agnostic** (falls back to any mesh under the wing pivot
  when a build has no part tags), so it is a roster-wide gate, not a Fornax tool. Run against the
  shipped roster it fails Vesper 8/12 and Tempest 8/12 — ⚠ on *untagged* geometry, so those runs
  are a lead to investigate, **not** a verdict, and nothing was changed on either.
- **P2 is the highest-value assertion in the harness.** Max forward deviation of the leading edge
  from the shoulder→tip chord, ÷ L, band 0.085–0.125. The rejected wing measured **0.035**. One
  number, on turn one, instead of a full increment and an owner rejection.
- Ref §4.9 now carries the arm chain, elbow law, sweep table, gull curve, chord distribution,
  trailing-edge concavity law, attachment line, propatagium law, construction order, the
  behind-and-above view notes, and a 17-item "what this rules out" — normative for **every** winged
  creature, both topologies.

## One more, on authoring against a measurement

The forward-offset band is stated for the **visible** leading edge; a bone chain is authored as a
**centreline**. Spar thickness plus propatagium bulge put ~0.026 L between them. Solving the
centreline to the top of the band measured 0.125 against a 0.125 ceiling — passing by 0.0002, which
is a coincidence, not a pass. **Author the centreline well inside the band you intend to measure,
and never accept a number that lands on its own limit.**
