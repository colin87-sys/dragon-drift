# Revenant — a LANTERN is lit BONE, not a bright core (and the skull needs holes)

**Context.** Fable gate climbed 3.5 → 2.82 → 3.37 → 3.75 (FAIL on polish, not identity — veto/firewall
both clear). Three blockers left, all localised to the rear-chase money camera, all fixed this pass.

**1. "A lantern, not a lamp" means the light lands on the BONE — not that the core is bright.**
The heart ember was hue-correct and no longer a sticker, but at the rear-chase cam it was a ~34×70px
glint on a 500px dragon: the ribcage *interior read black*. Making the ember bigger/brighter alone
would just have re-made the white-lamp problem. The fix that actually reads as a lantern is **lighting
the inner rib faces green** — route only the two INWARD faces of each rib beam (the faces touching the
heart-side vertex) to a `boneLit` material (bone albedo washed ~45% toward grave-green + a `0x1a5230`
emissive self-glow). Now the cage glows *from within*: the ribs read as **bone fused with the fire**
(the reference's whole trick), the ember + a wider anisotropic additive bloom spill green across the
gaps, and the outer rib faces stay ivory so the skeleton still wins the silhouette. Measured green
pixels at rear-chase went ~100 → **1108** (Fable's bar was 400+), bbox 34×70 → 188×118, with the bloom
centre held greener-than-white on purpose. **Key insight: earlier I *removed* the inner green tint
because on flat ribbon-ribs it stacked into concentric rings viewed axially. On BEAM ribs it's safe and
correct — only the inner faces are tinted and they self-occlude from behind, so green shows in the gaps
(the wanted spill), never as full rings.** The geometry change (ribbon→beam) is what unlocked re-adding
the tint that had been a bug before. Same idea, different substrate, opposite outcome.

**2. An emissive that clips its dominant channel DESATURATES toward white — that's why the eye read
"cream/holy."** The eye emissive was `0x76ff68` (R118 **G255** B104) at intensity ~1.6. G is already
maxed, so ×1.6 clips G and lifts R/B → the rendered pixel drifts to a pale cream — the single most
holy-leaning element on a skeleton. Fix: a **low-R grave-green** (`0x4ef072`, R78) at a **lower
intensity** (0.6+0.45·glow ≈ 1.05 at f3) so no channel clips and the hue stays saturated green. Rule:
for a coloured emissive to *stay* that colour, keep `channel × intensity < 255` on the brightest
channel — a maxed channel is a desaturation-to-white waiting to happen.

**3. A skeleton's SKULL must be fenestrated or it reads fleshed.** The skull was a solid unbroken loft
— fine as a shape, wrong as bone, because a real skull is mostly holes (orbit, nasal fenestra, temporal
arch). Fix: a reusable `pocket(cx,cy,cz,rx,ry,side)` that builds a **recessed dark cup** (rim ring at
the surface → a floor point sunk inward along −x/+z) in the `recess` (umber-green) tier. Three per side
— deep eye orbit + nasal fenestra + temporal/cheek void — so the skull shows real see-through-reading
voids in profile instead of a solid wedge. Cheap (a handful of tris each), and it's what flips "fleshed
head" to "skull."

**4. Know when a gate METRIC is unwinnable and stop grinding it.** Fable's bleach-ladder check medians
only *lit* facets (luma ≥ 120). Darkening f0's albedo to open the f0→f1 gap **raised** its measured
median — the newly-dim pixels fell below 120 and were culled into the excluded "shroud" bucket, leaving
only the brightest (near-clipping) facets. The lit facets sit at the tonemap knee and can't be
separated by albedo at all. The bleach still reads to a human (f0 carries more *shadow* area), but the
metric is measuring the wrong thing. Lesson: when two albedo changes move a metric the wrong way,
you're fighting the measurement, not the art — set a sensible value, note the artifact, move on. Don't
sink the money-camera work chasing a comparison-render number.

**Still additive.** Roster byte-identical, starters 286/0, blueprint 4/4, wingsym Δ0.000, 1523/6000
tris. Process held: pre-assess → work → gate, every fix a numeric checkable Fable directive.
