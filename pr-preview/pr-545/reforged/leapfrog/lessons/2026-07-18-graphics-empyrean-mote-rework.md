# THE EMPYREAN — the MOTE rework to the Fable-model bar (3.4 → 4.4 PASS)

**What we did.** Reworked the shipped Mote (the biome's one true-dark focal disc) against the Fable-MODEL
gate's 3.4/5 REVISE, in two revision rounds, to **4.4/5 PASS**. Five defects, five fixes:

1. **The limb was ERASED by its own disc.** The one-sided pearl hairline band `[_mR, _mR·1.036]` sat almost
   entirely INSIDE the disc's `_core` coverage `[0, _mR+0.0022]`, and the disc `mix(col, black, _core)` ran
   AFTER the `col += limb` — so the disc wiped ~96% of the limb ("measurably absent"). Fix: draw the core
   FIRST, then add the rim OUTSIDE the edge so the disc can't touch it.
2. **The rim band was SUB-PIXEL.** Even drawn outside, `_lw ≈ 0.0009 rad ≈ 0.9px` → AA flattened it to
   nothing. A 2–3px band renders at full brightness. **Any hairline thinner than ~1.5px will not render —
   size the band in pixels (px/rad = disc_radius_px / _mR_rad), not in radians blind.**
3. **The "half-size" was a FOV measurement error, not a code bug.** Fable measured the disc at 3.94° using
   an ASSUMED 55° FOV; the game's real vertical FOV is ~77–92° (dynamic, speed-eased), so the same 43–45px
   disc is actually ~5.5–7° — in band. I "fixed" it by scaling `_mR` up 1.7× → 8.2° (too big) before
   catching it. **Always read `__dd.camera.fov` for the true px→degree factor; never trust an assumed FOV.**
   (And the disc grows across the biome via `uMoteGrow`, which drifts with `player.dist` — PIN the distance
   in the capture or the measured size varies run-to-run.)
4. **The notch (easement in 3D) — solved by PLACEMENT, not culling.** A right-flank sentinel speared the disc
   because the Mote sat at azimuth ~6.8° RIGHT (`_mDir` x=0.12), inside the right-prop zone. Moving it to the
   lane's CLEAR CENTRAL corridor (`_mDir` x=0) — the vanishing point the stone corridor already converges
   toward — puts it where no prop reaches: every prop is `|x|≥14`, so when it's near enough to READ (not
   fog-dissolved) its azimuth is >~2.7°, outside the centred disc. **A fixed-bearing sky landmark clears the
   props by SITTING IN THE LANE GAP, not by a per-frame cone-cull** (which would pop). Bonus: the corridor
   now leads the eye straight into a whole disc — better composition, not just a fix.
5. **The pearl rim CANNOT out-bright the luminous void — win contrast from BELOW.** The killer lesson: on the
   near-white bright-void sky, the pixels sit at the ACES white-shoulder, so a bright rim SATURATES —
   strength 0.09→0.17 moved the measured rim +26→+27. You cannot brighten a rim past the tonemap ceiling.
   The fix is an **OCCULTATION**: dim the sky in a soft ring AROUND the disc (a total eclipse darkens the sky
   toward totality — an occultation, not a light source → theology-legal in a "darkness=threat" biome). Start
   the halo just OUTSIDE the rim band (so it doesn't dim the rim with it) and make it DEEPER behind the rim's
   one arc (`+_limbSide`) → the rim reads by contrast-from-below (delta +27 → +43). The halo alone did 90% of
   the work: it turned "a bare black sticker" into "a mass pressing into the sky" (Fable's words). **When a
   bright feature can't clear a bright field, darken its surround — the eclipse reads as the halo + rim as a
   whole, not the rim's absolute brightness.**

**The interior "fleck leak-through" was mostly a non-issue.** Stars are erased (the Mote `mix` runs AFTER the
star add). The few remaining interior dots are foreground ambient MOTES crossing IN FRONT — which Fable's own
rule permits ("foreground crossing may stay"); measured ~1–2% lifted, well under the 10% Fable flagged on the
old (star-contaminated, smaller) disc. No mote cone-cull needed.

**The verify harness (reusable).** `tools/_empyregate.mjs` grew a Fable-METHOD Mote sampler: find the disc by
dark-threshold bbox (use L<16 — the value-laddered stones are L~40+ and contaminate a L<45 threshold),
diameter→degrees via the REAL `camera.fov`, a per-degree limb ring scan (inner band `edge+0.5..3.5` MAX minus
same-angle outer `edge+7..11`, to cancel the sky gradient → best-arc vs opposite-arc delta), core-sum, and an
interior >+60 census. Matching the critic's own measurement protocol lets you converge locally instead of
burning a ~3-min Fable round per tweak.

**Owner call honoured.** The owner picked "atmosphere" for the earlier re-gate and left the Mote; this round
was a later explicit "Mote rework" request. The player-dragon-out-darks-the-Mote item (a roster/model concern,
not the Mote shader) stays a flag for the roster owners, not fixed here.

**Verify.** Fable-model 4.4/5 PASS (true-dark 5.0 / hard-edge 4.7 / whole-disc 4.4 / eclipse-optics 3.8 /
size-placement 4.5 / theology 4.8; all prior REVISE items cleared). All behind `uMoteMix` (0 elsewhere →
byte-identical): gold-determinism + skyprobe byte-identical, biomecycle 12/0, appshell no console errors.
Started on a FRESH branch off the merged master (PR #499 shipped) — a new PR, not the merged one.
