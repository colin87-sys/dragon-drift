# 2026-07-12 — Sky Canyon feel v2: earned rock banking + the rib speed-tunnel

**Did / learned.** The owner flew the shipped canyon arc and gave three notes; a
measured Fable diagnosis (8 seeds × 20km) turned each into a precise cause + fix.

- **Rock run read as "a straight line."** The killer was a **geometric self-cancellation**:
  the sway peaked at the section seams, but the channel *breathed open* at those exact
  seams too — so the slot was widest precisely where the curve turned, and the required
  input collapsed to ~1m. Compounding: the amp cap (3.2) throttled banking the physics
  allowed, and the `|dy|>3.2` shelf trigger turned ~half of all hops into vertical
  over-under lumps, breaking the slalom. Fix: raise the amp (5.5), **shrink the breath
  so the channel at the sway peak is NARROWER than the amplitude** (the corner can't be
  cut), a **solved seam-symmetric lane cap** (scan the whole half using the two
  seam-shared gaps so both sides compute an identical cap → C0 preserved), a tighter
  pinch, and `pickKind` gated to `|dy|>5` + never-two-over-unders-in-a-row (~75/25 mix).
  Mean centre-swing went 2.4m → 5.9m, all under the fairness budget.
- **Rib rings spawned "half in / half out" (no perfect).** The tube was built at
  `yAt(z)+1.5` while the ring sits at `gapY` and `ringCenterRadius` is **1.4** — so the
  +1.5 lift *exceeded the perfect radius*: flying the visual centre-line could NEVER
  perfect, by construction. Fix: drop the lift (tube centre ≡ ring centre); raise the
  arch height to hold the dorsal-apex sightline.
- **Rib run felt segmented, not a speed tunnel.** Causes: median 169m coverage gaps,
  **doubled ghost ribs** at seams (hoops spanned the full half while walls tiled to the
  midpoint), and the curve *flattened at every ring*. Fix: **band-limit hoop emission**
  to the abutting `[-wb,wf]` with cell-centred (staggered) sampling (kills the doubled
  ghosts), raise the `halves` clamp 80→96 (closes the gate-hop voids), a **lateral
  spine sweep** (`spineSway`: zero at each ring so a perfect stays dead-centre, peaking
  at the seams, sign-flipping per section → one long C0 S-curve — the racing-tunnel
  bank), **banked hoops** (roll into the turn), and longer runs (`spineSegments`
  [13,16]→[15,19]).

**→ Systematize.** Three reusable laws. **(1) A "breathing" width and an authored sway
must not be anti-phase** — if the channel opens where the curve turns, the challenge
self-cancels; put the tightest channel at the largest displacement. **(2) Any authored
lateral motion (sway/sweep) added to a reach-audited ring line must be sized from the
LEFTOVER slope budget AND, if it must be C0 across seams, computed from data both
neighbours share** (the two seam gaps + shared midpoint) — a per-half solve that uses
only one side's curve breaks continuity; and a bridged-gauntlet seam (asymmetric spans)
has no continuous tube, so the audit must skip it. **(3) "Dead-centre at the ring" and
"a perfect is flyable" are the SAME invariant** — any vertical/lateral offset between
the tube centre-line and the ring greater than `ringCenterRadius` silently makes perfects
impossible; assert `tubeCentre(z=0) === ring` in the flow audit forever. All of this is
enforced by `canyonflow.mjs`, which reconstructs the swept tube from the same
`canyonMath` the geometry uses (now incl. `spineSway`) and hard-gates slope ≤ budget,
seam C0, width, and dead-centre; the "banking felt" swing/must-steer number is a
REPORTED feel metric (forced steering fundamentally competes with the fairness budget,
so it's for the human on the preview, not a CI gate).

**→ Leapfrog.** True end-to-end seamlessness is bounded by the determinism contract: the
96-clamp fills every gate-hop void, but gauntlet corridors interrupt spine runs by
design (base-course gauntlets can't be moved or suppressed without breaking the gold
fixture, and ribs must never stack on a gauntlet) — so the tube is continuous *between*
gauntlet interludes, which is the honest ceiling. The `spineSway`/solved-cap machinery
is the substrate for the deferred kinematic verbs (updraft banks, current drift): sweep
the tube, keep it budgeted, keep the ring dead-centre.
