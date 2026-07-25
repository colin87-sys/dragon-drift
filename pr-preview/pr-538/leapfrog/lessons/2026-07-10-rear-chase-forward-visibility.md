# Rear-chase forward visibility: fix the CAMERA globally, the OCCLUDER bug locally, and prefer a UNIFORM design fix over a shop/gameplay split

**What we did.** The owner played post-CP3 Solar and couldn't see obstacles ahead — blind crashes.
A high-effort Fable diagnosis split the cause three ways, and each got the fix that matched its scope:

1. **Camera was a GLOBAL problem, fixed globally.** The chase declination was only ~5.2°, so the horizon
   (where obstacles first appear) sat too low/behind the dragon for EVERY dragon — Solar just made it
   obvious by being the biggest occluder. Fix belonged in `cameraController.js`, not in Solar: raised
   `targetHeight` 3.6→4.6, nudged `targetBack` 12.3→13.2, lowered `lookTarget` y +1.0→+0.5 so the
   obstacle band lifts into frame. **Lesson: if the same failure would hit any dragon, fix the shared
   system, not the hero.** (A "middle" pose — height 4.2 / look-y 0.7 — is on standby if the owner finds
   the new one too floaty on the live preview; the human judges feel, not a headless shot.)

2. **A real occluder BUG, fixed at the source.** Solar's membrane material factory `mem()` built OPAQUE
   mats — it never set `transparent:true`+`opacity`, so the wing wall (70% of the frame) blacked out
   everything behind it. The wing-fade contract (opacity ~0.82 so obstacles show through wings) is a
   whole-roster invariant; Solar had silently violated it. **Lesson: opacity is INERT without the
   `transparent` flag — a wing that "should" fade but was authored opaque is a bug, not a style choice.
   Grep new premium mats for the transparent-wing recipe before shipping.**

3. **A design occluder, fixed UNIFORMLY — not with a shop/gameplay split.** CP3's rose-window mullions
   converged to dead-centre (r 0.12), screening the one forward sightline through the corona ring. The
   tempting fix was a `preview`-flag split: full rose window in the shop, drop/thin spokes in gameplay.
   We threaded the flag… then threw it away. **The better fix was uniform AND more authentic:** make the
   mullions spring from a central OCULUS ring (r 0.45) instead of the centre, leaving the aperture inside
   (r<0.40) as open glass. Real rose windows radiate spokes from an inner medallion, never the dead
   centre — so this reads as *more correct* in the shop while opening the see-through center in gameplay.
   One geometry, both contexts, +32 tris.

**The reusable idea: prefer a UNIFORM fix that's authentic to the motif over a shop/gameplay MISMATCH.**
A `preview`-flag split means the thing the player grinds toward is not the thing they fly — it needs
owner sign-off, doubles the surface to maintain, and risks the "that's not what I bought" feeling. Before
reaching for the split, ask: *is there a single form that satisfies BOTH the spectacle read and the
gameplay sightline?* Here the cathedral vocabulary already had the answer (an oculus). When the motif
itself offers a shape that's prettier AND less occluding, the split is a false dilemma. Keep `preview`
splits for cases where the two genuinely can't reconcile (precedent: the aim marker at
`dragonModel.js:260`), not for occlusion you can sculpt your way out of.

**Gotcha — thread-then-revert cleanly.** We wired `opts`→torso builder→`preview` across `dragonModel.js`
+ `dragonSovereign.js`, then the uniform fix made it dead code. Reverted BOTH files fully so the commit
carries only the geometry change — an unused threaded param isn't "future infra," it's a reader trap.
`git diff --stat` after the revert (model diff empty) is the check.

**What it unlocks.** A rear-chase visibility triage: (a) is the horizon in frame for all dragons? →
camera. (b) is the biggest frame-filler honoring the transparent-wing contract? → material bug. (c) does
a signature landmark screen the forward sightline? → look for a motif-authentic reshape (oculus, arch,
open lattice) BEFORE a shop/gameplay split. Verify with `gameshots.mjs` (real chase-cam crop), not just
the showcase cam — the showcase cam frames the dragon from the front and hides exactly this failure.
