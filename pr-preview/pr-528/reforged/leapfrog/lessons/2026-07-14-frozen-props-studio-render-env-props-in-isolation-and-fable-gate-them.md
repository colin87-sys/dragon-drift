# Frozen wall-props — build a PROP STUDIO, render env props in isolation, and Fable-gate them like a dragon

**What happened.** The owner flagged the Frozen side-wall props + the Sun Gate as "cheap / skinny
spiky towers — like flying through a town," not premium. I'd been iterating them via in-game
fly-through shots at 260–700 m where you "can't see shit," and via headless env tests that were all
green. Neither surfaced the truth. The fix was to **mirror the dragon studio for environment props**:
`tools/propstudio.html` + `tools/propstudio.mjs` render ONE archetype (or the paired gate) in
ISOLATION on a neutral ACES stage with a low-sun "sunset" rig + a flat neutral rig, on dusk / pale /
dark backdrops, as a 2×2 contact sheet (front · ¾ · side · top-plan). A Fable art-director agent
(spawned with `model: "fable"`, which can Read the PNGs itself) then scored each prop /5 against a 4.2
"premium" bar, pre-assess → build → checkpoint, honestly (it FAILED terrace four rounds running — the
gate is real, not a rubber stamp). The kit went from **sungate 1.8 / icetower 2.0 / serac 2.4 /
terrace 2.6 / bergwall 3.4 / glacierwall 3.6** to **all six ≥ 4.2** (sungate 4.3, serac 4.3,
glacierwall 4.3, terrace 4.4, bergwall 4.2, icetower 4.2). In-game renders then confirmed it in
context (the gate reads as a doorway of light framing the sunset over the water mirror).

**The lesson — env props deserve the same studio + colour-gate discipline as dragons.** The dragon
work already banked "render in colour, Fable-gate from step one" (see the revenant lessons); this
extends it to the environment. A recycled InstancedMesh archetype is still a designed object and it is
INVISIBLE to the headless env guard (`envcount` proves tris/overdraw/determinism, never LOOK) and
nearly invisible in a cruise-by at 700 m. To reach the private `ARCHETYPES`/`propMats`, add one inert
export (`buildArchetypeMesh(key, opts)` — same pattern as `propDiag()`), apply the real `(r,h,r)`
instance scale so the studio shows the SHEARED read that ships, and drive it from a Playwright sheet.
~2 min per round, reproducible, no boss/fog/bloom distractions.

**Glacier-prop design laws that moved the scores (all Fable-directed, all verified in the studio):**
- **The accent must be a RECESSED crevasse, never a surface sticker.** A bright emissive rectangle laid
  ON a face reads as an LED strip / decal (the poverty pattern). Instead: an emissive core set BACK
  between two PROUD mat-0 ribs = light escaping a chasm. One helper (`crevasseCore`) reused kit-wide
  instantly unified the look. **Watch occlusion:** the emissive must be proud of whatever mass sits
  behind it in XY, and NOT tucked under a higher tier — an occluded glow reads as a dim chip.
- **A gate reads as a doorway via OFFSET-STACK convergence, not rotation.** The `(r,h,r)` instance
  scale shears baked rotations flat, but lateral per-block OFFSET survives it. Step every block's centre
  progressively toward the gap so the two pylons' silhouettes converge; cantilever the capstone furthest
  of all into the gap (an implied broken lintel). A whole-post tilt is gate-unsafe (it pushes the top
  past the ±16 gameplay-gate veil) — carry the lean in the offset stack, keep `tilt` tiny.
- **Mass beats height.** "Skinny obelisk" was the core rejection. Target ~2.5:1, not 6:1 — and since
  gate-safety caps the gap-side (+x) extent, FATTEN toward the OUTER side and in DEPTH (z), which don't
  touch the inner edge. A fat tabular base ~40 % of height anchors it.
- **Real glaciers are tabular/blocky, never man-made-regular.** Kill the "water-tower/ziggurat" read by
  breaking the coursing: varied-height blocks with offsets alternating sides (zig-zag), irregular
  per-block yaw (kills plan-view star symmetry), one oversized overhanging capstone, and OVERLAP blocks
  ≥ 25 % so they FUSE (perched blocks with clean gaps read as balancing crates).
- **No thin cards, no melting tapers.** Enforce a min block thickness (~40 % of height) so nothing reads
  as a standing plane; use STRAIGHT-walled cylinders (top r = bottom r) so a low shelf ends in a crisp
  vertical ice cliff, not a soft melting slope.
- **For a LOW prop, the top-down read is the primary read** (you fly over it). Terrace's accent had to
  be judged from the plan view: a wide flush pond = decal; two short segments = "two chips"; a tiny stub
  tucked under the top tier = invisible. What passed: ONE continuous glowing slit on the EXPOSED tread,
  the emissive floor running the FULL polyline (both segments lit, overlapping at a shared elbow, same
  rotation so the projection is unbroken), ~40 % of the tread at ~5:1, framed by two proud rims.

**Process banked.** Spawn the Fable gate to PRE-ASSESS the honest current state (that IS the failing
baseline), rework to its concrete list, re-render, CHECKPOINT, iterate anything under 4.2 unless
diminishing returns. A `model: "fable"` Agent reads the capture PNGs directly — no need to describe
them. Trims, not rebuilds, closed the last 0.1–0.2 each time. Keep the loop genuine: do not lead the
witness, do not self-certify a pass — terrace only cleared on the fourth accent attempt.

**What it cost / what held.** All additive and safe: every archetype ≤ 150 tris, `envcount` green
(Frozen band + adjacent-pair windows under cap), `gold-determinism` byte-identical every round (props
are render-only — no fixture — and the `place()` rnd-draw counts never changed, so the shared render-rnd
stream stayed put). A large visual overhaul of a whole biome's prop kit is safe when it's confined to
the archetype `build()`/`place()` bodies + one shared accent helper.
