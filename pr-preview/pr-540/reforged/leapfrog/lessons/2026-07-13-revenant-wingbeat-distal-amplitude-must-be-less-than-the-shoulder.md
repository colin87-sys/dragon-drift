# Revenant wingbeat — distal amplitude ≥ proximal IS the "broken-linkage" tell

**The symptom (owner, watching it fly):** the wingbeat read stiff and mechanical — a distinct elbow +
wrist double-bend, like a linkage, not a wing. The wing inherited the shared 3-segment `wingParts`
poser (shoulder `pivot` → forearm `mid` → wrist `tip`, each rotated by its own amplitude + phase lag).

**The root cause, one number:** the Revenant's dials were `rootAmp 0.6, midAmp 0.34, tipAmp 0.55`. The
WRIST amplitude (0.55) was nearly as big as the shoulder and BIGGER than the forearm — so the distal
joints swung as hard as the proximal one. That is the textbook broken-linkage read: real wings are
**shoulder-driven**, with the forearm and wrist only *trailing* the arc as follow-through. **If the elbow
or wrist bends as much as (or more than) the shoulder, it reads as a mechanism, not an anatomy.**

**The fix — arc OWNERSHIP, not just "less bend."** Fable (pre-assessment) gave a checkable target that
made this precise:
- **Shoulder owns 75–85% of the total swept arc**; forearm 10–15%; wrist 5–10%. Hard rule: forearm+wrist
  ≤ ~25%, and each strictly LESS than the shoulder.
- The big arc lives in the shoulder amplitude (`rootAmp 1.0`), and a recovery-peak lift (`apexRoot 0.62`,
  which is asymmetric — only the up half of the beat) raises the top to ~12 o'clock.
- Distal joints kept small but ALIVE (`midAmp 0.18`, `tipAmp 0.10`) and **moving the same rotational
  direction as the shoulder** (continuing the arc, never counter-bending — a counter-bend is what makes
  the "double-bend"), lagged 12%/18% of the beat so the membrane billows behind.
Result dials: `rootAmp 1.0, apexRoot 0.62, midAmp 0.18, tipAmp 0.10, midLag 0.7, tipLag 1.1, glidePow
1.15`. Fable gate: **PASS** — raised-V recovery, ~4:30 downstroke (not collapsed to 6:00), one continuous
shoulder-led spar.

**Gate-able clock target for any flap (reusable):** measure the wing spar from the shoulder, 12=up,
3=horizontal-out, 6=down. Top of beat **12:00–12:30** raked slightly BACK; bottom **~5:00** (never 6:00 =
closed-umbrella collapse); neutral glide **~2:00–2:30** raised dihedral; total sweep ~150°. The four reads
to FAIL on: broken-linkage (distal ≥ shoulder / counter-bend), paddle-flat (distal zeroed → rigid board),
insect-buzzy (high-freq low-amp), metronome (perfectly symmetric up/down — add a top hold + quicker
downstroke), windshield-wiper (one flat plane — needs fore-aft rake between recovery and downstroke).

**How to gate motion headless.** You can't watch a beat in a still, but you CAN freeze both extremes:
`silhouette.mjs <key> rearfit --pose=recovery` and `--pose=downstroke` (rear = flap plane face-on → the
clock reads cleanly; side = the fore-aft rake). Black-fill silhouettes are perfect here — the question is
spar ANGLE and joint BEND, which colour would only obscure. (The colour `flapstrip.mjs` chase-cam strip is
the gameplay-feel companion, but it's slow ~5 min; the two frozen extremes answer the geometry gate.)

**The process that caught it early (owner-directed): PRE-ASSESS → work → GATE.** Spawning Fable to validate
the APPROACH *before* building — and to hand back a numeric target (the clock angles + the 75–85% ownership
split) — meant I built to a spec I could then grade against, instead of tuning amplitudes blind. The
pre-assessment also flagged three overshoot traps (don't zero the distal joints; keep them same-direction;
keep asymmetric top-hold timing) that a naive "just cut mid/tip to zero" would have walked straight into.
