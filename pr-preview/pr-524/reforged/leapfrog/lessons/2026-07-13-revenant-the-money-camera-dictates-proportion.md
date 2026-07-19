# Revenant — the MONEY CAMERA dictates proportion (fix the read from where the player looks)

**Context.** After the reference rework the Revenant scored 3.83 (marginal fail). Every failing point
was at the **rear-chase primary camera** — side and rear-¾ were already near-premium. The lesson: a
creature can be beautifully built at the turntable angles and still fail, because the player only ever
sees it from ONE angle. Grade and tune from that angle first.

**The three fixes were all PROPORTION at the rear-chase, not new geometry:**
- **The identity mass must be the mass CENTRE from behind.** The ribcage+heart is the Revenant's identity,
  but from the chase cam it hung small and low *under* the wing shoulders — the dragon read as "two wings
  with a green pendant." Fix: enlarge the cage ~25% AND lift it (spring the ribs from ABOVE the spine, not
  just below) so the glowing barrel sits in the shoulder line. A mass that IS the identity has to occupy
  the centre of the silhouette the player actually sees.
- **Don't let the secondary mass out-weigh the identity.** The dark shroud wings were oversized and near-
  black, so bone lost the silhouette — it read "stealth glider," not "skeleton." Fix: cut wing area ~15%
  and lift the membrane ONE value step (near-black → dark charcoal) so the bright ivory bone wins ~60/40.
  Value + area are the two levers; a big near-black shape always wins a silhouette unless you shrink it or
  lift its value.
- **A feature must read as itself at distance, or it reads as the wrong thing.** The skull was small and
  the horns thin, so from behind the head read as "insect antennae on a small head," not a dragon skull.
  Fix: scale the skull ~20% up and rebuild the horns SHORTER + THICKER (a 4-sided chunky ram-horn, not a
  flat antler blade). Thin + tall = antenna; short + thick = horn — the silhouette proportion is the whole
  read, not the polycount.

**Process note (holds): pre-assess → work → gate, and let the CRITIC name the camera.** The Fable gate
didn't just score — it localised every miss to the rear-chase and gave proportion deltas (~25% cage, ~15%
wing, ~20% skull). Numeric, checkable directives beat "make it better." Apply verbatim, re-render the
money-camera tile, re-gate.

**Still additive.** All proportion changes were dials/params inside the one module + its def: existing
roster byte-identical (0 changed rows), starters 286/0, wingsym Δ0.000, 0 over tri budget.
