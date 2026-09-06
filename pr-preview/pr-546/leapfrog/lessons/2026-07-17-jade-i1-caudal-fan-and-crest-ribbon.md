# 2026-07-17 — Jade AAA I1: the grand fan-bloom + crest ribbon, evolve-in-place

**Did / learned.** Built increment 1 of the Jade Serpent AAA elevation (buildsheet §3a) — the
torso half of the hero. Two additions to the SHIPPED `koiSerpent` builder, both behind nullable
default-off dials:
- **THE GRAND FAN-BLOOM (`caudalBloom`).** Rewrote the `moonTail` block as a 3-blade split caudal
  fan — twin canted lyre crescents (dominant) + a median dorsal veil — **independently
  station-sampled (M=16, decoupled from the ring count N)** so the trailing split resolves into
  countable prongs even at N=23. Each blade is an M×3 grid (root→mid→edge = 2 height-quads),
  both windings; the crescent mid-row **carves INWARD on the webs** (`midInset = −cb·0.12·h·(1−rayMask)`)
  so 3 ray flutes read without growing the outline; the median veil lives in x=0 (sagittal,
  edge-on to the rear cam) and takes value bands only, no carve. All fan verts are pushed into
  the tube's `positions/colors/indices` BEFORE the `bodyWave` snapshot, so the whole fan whips
  with the swim for free — zero new tick.
- **The dorsal crest ribbon (`crestRibbon`).** Pure diffuse vertex paint in the ring colour loop,
  symmetric about the dorsal apex by *angular distance* (`dA = |a − π/2|`, falloff `^0.6`) so at
  odd K=13 (no vertex at 90°) the painted centroid stays on-axis. Zero emissive, zero geometry.

The load-bearing trick for coexist: structure the branch as `if (cb>0) {new fan} else if
(moonTail>0) {OLD strips verbatim}`. The old block is byte-for-byte untouched, and the new
height coefficients are **continuous with the old strips at cb→0** (crescent 1.55 ≈ shipped 1.55,
median 0.68 ≈ shipped 0.675) so nothing jumps at the f0→f1 ladder step.

**Verified:** byte-identity — dials off → jade f0 **2510** and the full roster **unchanged**
(tricount FORM-row multiset). Dials live → f0 2510 (ribbon is paint-only, +0 tris) / f1 **4458** /
f2 **5380** (pre-gems), **matching the sheet's predicted numbers exactly, zero NaN**. starters
493/0 with the re-pinned `triTargets [2550,3900,5300]` (B4 — the re-pin MUST land in the same
change as `caudalBloom`, or f1 4458 > the old 3680×1.2=4416 ceiling reddens CI). blueprint /
smoke / slither green. Rear silhouette confirms the split blossom reads with the median edge-on.

**→ Systematize.** (1) **Independent station-sampling is the fix for "the split aliases into a
sawtooth":** when a feature (a notch, a fork) needs more resolution than the host mesh's rings
give, sample the feature on its OWN parameter M and interpolate the host station between
bracketing rings — you get sub-ring detail without retessellating the tube (which would break
byte-identity). (2) **Continuity-at-dial-0 is a stronger coexist proof than a hard branch:** make
the new dial's coefficients converge to the shipped constants as the dial → 0, so the ladder has
no visible seam even though the code path forks. (3) **Odd-K sagittal paint leans off-axis** — a
raw `sin>0.9` cut paints a band centred ~7° off; weight the two straddling columns by an angular
falloff and the centroid re-centres (measure it with a centreline pixel check, not a geometry
probe).

**→ Leapfrog.** The torso now publishes a wave-locked fan and a dorsal light tier; I2 makes the
LIGHT travel it (pearl-chain via `userData.baseIntensity`, the lyre gems as `waveRiders`, the
streamer split) and closes the orchestrator-forwarding bug (B1) so jade's pearl-breath tick runs
in-game for the first time. The caudal silhouette growth is measured (f2 rear-fill up double
digits) and routed to the OWNER on the PR — not self-sanctioned (§3a.7).
