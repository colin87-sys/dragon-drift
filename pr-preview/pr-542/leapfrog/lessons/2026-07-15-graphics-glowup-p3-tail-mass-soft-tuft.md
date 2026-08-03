# Tempest glow-up P3 — tail mass for the REAR projection + a soft nested-shell glow (kill the hard diamond)

**What we did.** Phase 3 of the Tempest glow-up (the director's #3 mass + #6 tuft, batched as one tail
pass). First cut scored **3.6/REVISE**; the fix cut scored **4.3/APPROVE**. Two reusable lessons, both from
the REVISE.

**LESSON 1 — a solid additive mesh has a HARD silhouette edge; a soft glow needs a falloff, and nested
shells fake it DOM-free.** The tuft's "always-lit point of light" was a single additive
`OctahedronGeometry` at uniform opacity. Every interior pixel has the SAME alpha, so its outline is a hard
polygon — it "clipped to a white DIAMOND." Bumping the octa detail (rounder mesh) did NOTHING, because
roundness isn't the problem — uniform alpha is. Two DOM-free ways to get a real radial falloff: (a) per-
vertex alpha fanning to 0 at a rim, or (b) **NESTED shells** — 4 concentric additive octas at growing
radius and shrinking opacity (0.13/0.10/0.075/0.05). Additive accumulation is DENSE where all shells
overlap (centre) and THIN at the outer rim (only the biggest, faintest shell), so it reads as a soft radial
glow with no hard edge. Nested shells because a **CanvasTexture sprite is NOT an option in this repo**: the
geometry tests build the dragon in Node (no `document`), so `document.createElement('canvas')` throws. Any
procedural-glow trick in a part-builder must be pure geometry + materials, never canvas/DOM.

**LESSON 2 — world-space mass does NOT equal silhouette mass; thicken for the PROJECTION you're judged in.**
The tail was beefed and the SIDE profile stopped reading as a rope — but the checkpoint's money angle is
REAR-CHASE, where the tail foreshortens toward the camera and a modest radius bump vanishes. "The extra
girth is real in world-space but doesn't survive the rear projection." Fix: thicken harder AND raise the
radius FLOOR (`rAt` base 0.152→0.172, additive floor 0.012→0.020, falloff exponent 0.60→0.58) so the near-
camera segments stay fat under foreshortening. Verify mass on the angle you're graded on, not the flattering
one.

**Other fixes that landed:** tuft tongues broadened (w 0.11→0.17) and WEBBED between adjacent bellies back
to the socket so the splay reads as one flared flame, not a spider of strings (the tongues are storm-ticked
→ near-off in studio-dim, blaze in Surge, which also gives the tuft its cruise↔Surge differentiation for
free — no extra plumbing). Fuller splay (tuftN 5→8).

**The one that DIDN'T land (carried forward) — a faint additive strip gets eaten.** The "carry lightning
onto the spine" ask was a thin always-on additive `spineCharge` ribbon along the dorsal ridge crest. It did
not read: at opacity 0.4, chW 0.02, tucked at the vane bases, it's too faint/narrow/occluded to show as a
charged line, especially under bloom over a bright bg (additive adds little over already-bright pixels).
Lesson: a thin faint additive line buried in geometry won't register as a "charged line" — it needs real
width + intensity ON TOP of the ridge, or it should be carried by more lit blade-caps (`arcCore`) instead
of a separate strip. Rolled into the next pass rather than its own round.

**Reusable takeaways.**
- Soft glow = alpha FALLOFF, not a rounder solid mesh. Nested additive shells (dense-centre/faint-rim) give
  it with zero DOM — required here because part-builders run in Node for the geometry tests.
- Thicken/verify mass on the PROJECTION you're judged in (rear-chase foreshortens); raise the radius floor,
  not just the base.
- A storm-ticked accent gives cruise↔Surge state differentiation for free (off-with-hints vs blaze) — don't
  build separate surge plumbing for it.
- A thin faint additive line buried between geometry gets eaten (especially under bloom over bright bg);
  a "charged line" read needs width + intensity on top, or lit component caps.
