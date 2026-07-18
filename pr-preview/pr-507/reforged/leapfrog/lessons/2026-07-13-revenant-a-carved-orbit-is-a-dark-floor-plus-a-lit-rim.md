# Revenant finish pass — a carved orbit is a dark floor PLUS a lit rim; a flat panel is a sticker

**Context.** Fable 3.92 (from 3.83) — "the identity is done; this fails on three finishable, local
defects." Three surgical fixes to cross toward 4.0, all on the shipped rear-chase read.

**1. A recessed void needs a LIT RIM, not just a dark floor.** Last pass gave the skull pockets a deep
near-black floor (luma ~8–12) — Fable confirmed the ORBIT read as recessed, but the shallower nasal
fenestra still read as "a flat painted chevron." The missing cue: a **bright bone lip flaring outward
from the rim**. A hole reads as carved when the eye sees the bone edge catch light AND the interior
fall to shadow — the value CONTRAST across the rim is the read, not the darkness alone. Added a thin
outward-flared bone-lip ring around every pocket (rim vertices pushed out along `rim−floor` + a small
+y bevel). Now each fenestra is a bright rim around a black void = a carved orbit, uniformly, including
the shallow ones. Rule: dark floor makes a hole possible; the lit rim makes it read.

**2. A single flat triangle flat-shades to ONE value → it reads as a 2-D sticker.** The plagiopatagium
root-gusset was one big triangle from arm to the hip anchor; at rear-¾ it floated over the ribcage as a
flat black decal. Fix: insert a **crease vertex lifted out of the panel plane**, splitting it into two
facets. Flat shading then gives the two halves different values across the fold, so it reads as a
folded 3-D membrane. A membrane panel wants ≥2 facets with a real fold — a lone triangle is always a
sticker under flat shading.

**3. Overlapping "detail" flakes become SHARD CLUTTER where masses converge.** The scapular cowls were
3 overlapping bone flakes per side "so the wing emerges from under a shoulder blade." Individually fine;
at the rear-chase money cam they crisscrossed the neck + wing-root into an unparseable jumble — the one
region of the primary view Fable couldn't read. Collapsing them to ONE clean quad shoulder-blade per
side fixed it. Where three masses already meet (neck, scapula, wing root), added small facets read as
noise, not richness — simplify the convergence zone, detail the open areas.

**Still additive.** Roster byte-identical, starters 286/0, wingsym Δ0.000, 1579/6000 tris. Process held:
pre-assess → work → gate; every fix a numeric checkable Fable directive ("visible lit rim on every
fenestra"; "≤3 elements between the wing arms"; "no unbroken black panel over the cage").
