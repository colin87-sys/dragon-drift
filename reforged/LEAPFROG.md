
### L133 — Ventral anatomy: deep chest + tucked abdomen (derived, since a rear view is blind to the belly)
Human noted the belly read flat. A rear chase-cam shows ZERO ventral data, so per the no-guessing rule the belly
is DERIVED (stated) from dragon anatomy + the existing dorsal: redesigned `BODY_SCULPT.Be(ny)` to two narrow
gaussians — a deep CHEST bulge (ny~0.32) and rounded HIPS (ny~0.62) — so the GAP between them IS the abdominal
tuck. Result on the side/below renders: prominent chest -> belly tucks in -> hips round, the classic deep-chest
line; banding even improved (1.9%). Lesson: **model the belly profile as chest-bump + hip-bump with a gap, not
one blob — the negative space between the masses is what reads as the abdomen.** Also: faint horizontal lines in
the side render were the cosmic MATERIAL texture, not geometry banding — confirmed by the gate (verify the metric
before "fixing" a non-bug).
