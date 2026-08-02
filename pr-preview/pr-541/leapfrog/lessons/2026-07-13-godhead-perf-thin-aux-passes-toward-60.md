# GODHEAD perf — thinning the aux-pass rates toward a locked 60 (and why the depth-mask is deferred)

**What we did.** After the wing + Phoenix merges, the owner sat at ~50fps and asked how to reach 60. A
headless profile of the settled heaven pinned the remaining cost: **169 visible layer-0 meshes**, and
the two full-scene aux passes each re-render them — the **water mirror** (~169 draws) and the **god-ray
occlusion mask** (~169, black override, god-rays confirmed active in the heaven). Those two passes, not
the main render, are the ~10fps that's left.

**The clean structural fix — and why it's deferred.** The right answer is to DERIVE the god-ray mask
from the composer's DEPTH buffer (sky = far → lit, geometry → occluder) in one fullscreen pass, deleting
the 169-draw re-render entirely. But the composer RT is `samples: 4` MSAA HalfFloat with **no depth
texture**, and resolving a multisampled depth texture for a shader read is **driver-dependent on mobile
Safari** — a real-device risk that headless (SwiftShader) cannot validate. Shipping it unverified could
break god-rays on the owner's phone. So the depth-mask is deferred to a **capability-gated** follow-up
(probe multisample-depth support at init; fall back to the scene-render mask where it fails).

**The verifiable wins shipped instead (low-risk, headless-checkable):**
- **Near-freeze the mirror in the settled heaven** (`water.js`): `arenaDropK > 0.9` → 1/8 rate (was
  1/4). The sea there is a dim deck dropped 30u and the "sea answers the blast" gold column is the
  ANALYTIC `sunColor` specular, not the mirror — so an 8-frame-stale reflection is imperceptible. ~−21
  draws/frame avg in the arena.
- **Thin the god-ray mask to ~1/3** (`godrays.js`, was 1/2): the shafts are broad, radial-blurred
  divine columns and the occluder silhouette moves slowly, so a few-frame-stale mask can't be seen. Kept
  staggered off the mirror's parity so the two passes still don't stack. ~−28 draws/frame avg.

**The headline lesson — a full-scene aux pass has TWO cost dials: how many meshes it redraws, and how
OFTEN. When you can't cheaply cut the count (depth-derive), cut the RATE — but only as far as the
consumed signal's motion tolerates.** A planar reflection on a dim/static surface and a broad
radial-blurred shaft field both tolerate a stale buffer for several frames; a sharp mirror or a
crisp-edged effect would not. Match the duty-cycle to the visual bandwidth of what reads the buffer, and
stagger multiple aux passes onto different frames so a heavy frame never carries two.

**Verify.** `unmaskedarena` 57/57, `passbudget` 19/0, a settled-heaven still shows the shafts + gold
reflection column unchanged. The rate cuts are ~−49 draws/frame avg in the arena on top of the wing +
Phoenix merges — the real-GPU fps is the owner's preview call. **Deferred (the bigger win):** the
depth-derived god-ray mask (eliminates the ~169-draw pass), capability-gated for the MSAA-depth resolve.

**Reusable.** To cut a scene-doubling aux pass without a structural rewrite: lower its refresh RATE to
the motion tolerance of whatever samples its buffer (dim/static/broad → several frames stale is free),
gate the aggressive rate on the phase where the buffer matters least, and keep parallel aux passes on
opposite parities. Reserve the structural rewrite (depth-derive, MRT) for when the rate cut isn't
enough — and gate anything touching multisample-depth behind a device capability probe + fallback.
