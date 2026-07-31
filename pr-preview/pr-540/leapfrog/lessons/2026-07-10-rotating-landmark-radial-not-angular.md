# A landmark that SPINS every frame can only be fixed RADIALLY — angular gaps time-average to nothing; and reshape solid regalia, ghost only membranes/shadow

**What we did.** Round 2 of Solar's rear-chase visibility (CP3.2). After #347 (camera + wing-fade +
corona oculus) the owner still couldn't see past two things: the corona RING BODY and the twin medial
carpal spires (the M's uprights). Both are load-bearing identity, so the fix had to open the sightline
without breaking the silhouette. A high-effort Fable spatial pass produced the plan; we built it.

**The reusable discovery: if an element ROTATES continuously, every ANGULAR feature of it is
time-averaged away in play — only RADIAL / opacity / reach changes have real effect.** Solar's corona
crawls every frame (`dragon.js:484`, `rotateZ(dt*0.15..0.5)`, full rev ~42s, the WHOLE group —
streamers, mullions, gems). That silently invalidates a whole class of "fixes" that look right in a
static capture: re-angling the streamer rays away from the corridor, arranging the mullions into an X,
widening the "skip 12 o'clock" gap to protect the M skyline — all of them sweep through every clock
position within seconds, so their occlusion (and their protection) is the *average over all angles*, not
the spawn-phase arrangement you see in a screenshot. Corollary bug we logged: CP3's "streamers skip 12
o'clock so the M is untouched" only holds at spawn; the crawl already violates it periodically. **Before
you design an angular fix for a landmark, check whether it spins. If it does, the only levers are:
transparency (ghost it), radius (shrink/trim reach), or position (sink/move the whole thing).** A static
`gameshots` frame will happily lie to you about a rotating element.

**Second reusable idea: GHOST membranes and shadow, but RESHAPE solid regalia.** Two occluders, two
different fixes — on purpose:
- The corona's dark umbra BAND is *shadow*, so it earned the wing-fade contract: `transparent, opacity
  0.74`. The eclipse survives because it reads by **silhouette + saturated-rim contrast**, not by
  opacity — a 0.74 near-black band over a bright canyon still composites near-black; the rim, gold
  tracery, oculus and gems stay fully opaque. You now see the horizon THROUGH the umbra at every spin
  phase (the oculus from #347 couldn't help — it opens the center r<0.45, but the occluding band is the
  annulus at r 0.88–1.06; different region).
- The twin spires are *solid gold regalia* (near-white sparTip at f3), so we did NOT ghost them —
  translucent metal reads as broken identity / the exact cheap-glow the buildsheet exists to kill.
  Instead we RESHAPED: splayed them outboard (roll −0.18 → −0.34) out of the ±6–9° swerve corridor into
  a wider, more majestic "chalice" valley, then thinned the shaft (0.22 → 0.17, still ≥8px, still ~2.6×
  the rank pikes) and flipped the inner-face crockets outboard off the valley. **Opacity is for
  membranes and shadow; reshape is for regalia.**

**Gotcha — a single-layer transparent shell needs its BACK face deleted, not just the flag.** The corona
band was two coincident layers (front band + back disk). Setting `opacity 0.74` on both gives (0.26)² ≈
7% transmission = still opaque. We deleted the back-disk push (−32 tris) so a sightline crosses ONE
0.74 layer (26% show-through), and set the front band `DoubleSide` so the ring still reads from the
shop-front. Transparency on a closed shell is a no-op until you make it single-layer.

**Gotcha — `tricount` reported the apex unchanged after a real −32-tri geometry deletion.** Don't trust
a single tool's headline number as proof your edit is live; the RENDER is the proof. smoke (live build,
0 errors) + a fresh `gameshots` crop showing the actual visual change is what confirmed the edits took.
(Budget was never in question — 3499/6000 either way — so we didn't rabbit-hole the discrepancy, but
noted it: verify edits landed via the artifact that shows the change, not a summary statistic.)

**Process that held (from the #347 lesson):** uniform shop+gameplay everywhere (no `preview` split —
none was needed); silhouette-affecting changes (the splay) ride the PR preview with before/after pairs
for the owner to judge feel; wingsymprobe stays green because the splay is one Euler constant the
`scale.x=-1` mirror inherits. Verify with the rear-chase `gameshots` crop, never the showcase cam.

**What it unlocks.** Add "does it spin?" to the rear-chase occluder triage: for a rotating landmark,
skip every angular idea and reach straight for opacity/radius/position. And keep the ghost-vs-reshape
split explicit — membrane/shadow → ghost (single-layer!); solid regalia → reshape (splay/thin/relocate).
