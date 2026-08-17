# 2026-08-17 — Wing lab I1.1: three unrelated-looking defects were one mis-parented vertex

**Did / learned.** I1 won STRUCTURE and lost SILHOUETTE. The director's read was that a black
rectangle in the pure-black tile, a flat blue card catching the rim light at apex, and a
measured 0.77 u of root travel over the beat were **one bug wearing three faces**: the
plagiopatagium's inboard-aft corner was anchored far down the flank *inside the rotating wing
group*, with a machine-straight free edge running to it. He was right, and the fix is a
principle worth keeping:

**A vertex that must read as attached to the BODY belongs in the body's frame. If it must live
on the wing, put it ON the rotation centre** — the pivot is the one point a rotation about the
pivot cannot move, so a corner placed there has drift identically zero, and the root reads as a
*cusp*, which has no square corner to find. Flank coverage then becomes a static, body-frame
**skirt**, and the wing laps over it (measured: 0.193 chord).

The shape of that skirt is where the second lesson is. Drawn as its own lobe it *crossed* the
wing's trailing edge in planform, and the union of two outlines that graze each other grew
three sharp notches (86° / 97° / 100°). Redrawn as a **continuation of the wing's own trailing
line** — its outer edge runs out to the wing TE's aft-most point and only becomes the
silhouette aft of it — the two merge into one unbroken curve. **Two curved outlines that cross
make corners; two that meet end-to-end do not.**

Third: `mid` moved from the shoulder to the elbow landmark via a second −anchor
(`mid.position = +E`, `fore.position = −E`), driven at amplitude 0. The −anchor makes the
assembled rest pose byte-identical, which is exactly why it is dangerous: a mis-parented part
is invisible in every still and only rips in motion. The sheets that SPAN the elbow stay
proximal — a membrane welded across a moving joint tears, and keeping them on `pivot` is also
what holds root drift at zero.

**→ Systematize.** The reusable output is `wing-lab/tools/wingquadprobe.mjs`, which turns
"zero quadrilaterals detectable in the pure-black tiles" into a measurement: render the wing
alone in pure black, trace the outline (Moore-neighbour), simplify at 1 px, flag any vertex
where two runs straight over ≥30 px meet at 75–105°. Four things it taught about writing an
image-space assertion, all of which cost a round:

1. **Douglas–Peucker cannot simplify a CLOSED contour as one run** — the start-to-end chord is
   degenerate, every perpendicular distance is 0, and the whole outline collapses to two
   points while reporting a clean pass. Split at the far end first.
2. **Seed the trace on the largest connected component.** Antialiasing leaves isolated dark
   specks; seeding on one returns a 1-pixel "outline" that passes.
3. **Reject corners on the canvas border** and frame the subject before measuring — a clipped
   shape makes right angles with the *frame*, and those drown the real signal.
4. **A metric tightened after seeing a failure must be re-validated for teeth.** The turn angle
   alone was not the discriminator: a trailing arc cut to 0.22–0.30 of bay width leaves every
   scallop cusp closing at ~88°. Straightness is. The control run is the proof — it clears
   `forgewing`, `tempest`, `revenant`, `vesper` and still fires on `aurumToro`'s faceted blade.
   **Run the new gate against the shipped roster before trusting your own pass.**

Also generalised into `wlRender`: a `wingOnly` mode that hides non-wing meshes *before* the
camera fit. The first version climbed one node too far up the graph, kept the whole dragon, and
made a tail rudder fin read as a rectangle "in the wing" — pixels attributed to the wrong part
are worse than no pixels.

**→ Leapfrog.** Root drift, skirt overlap and silhouette corner count are now three numbers
printed beside the landmark table, so I2/I3/I4 inherit a root that is *assertably* safe instead
of a root somebody has to re-eyeball. More broadly: this round replaced two arguments about
pixels with two probes, and both probes are dragon-agnostic — any future wing, and any body
part with a free edge, can be held to "no card edges in the silhouette" and "no vertex that
must stay put is on a rotating group" without a critic in the loop.
