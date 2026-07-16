# 2026-07-12 — N11 pass-budget: giving tier1 the wow, and the tier-uplift identity contract

**Did / learned.** God-rays + planar water reflection were **tier-0 only** — so the mid-range phones that make up
most of the player base (tier1) never saw the two effects that most define the look. N11 cheapens both enough that
tier1 keeps them, while tier0 and tier2 stay **byte-identical**. The Gate-1 Fable design check returned ADJUST(7)
and every one of the seven was load-bearing — this initiative would have shipped bugs without it.

**The identity contract for a TIER UPLIFT is different from a toggle, and it's the whole design.** Every prior
graphics initiative was a Settings toggle: "default OFF, byte-identical when off." N11 has no toggle — it changes
what the *adaptive quality tier* does. So the contract becomes **"tier0 and tier2 byte-identical; tier1
intentionally changes."** That reframes every decision: the shared mask-scale constant can't just drop 0.5→0.25
globally (that's a real change to shipped tier0 for no reason) — it must be **per-tier** (0.5 tier0 / 0.25 tier1).
The god-ray sample count and intensity scale must be written such that the tier0 values equal the existing
defaults (uSamples 40, ×1.0) so tier0 is bit-identical while tier1 gets 24 / ×0.5. **→ Bank: when an initiative
moves a capability *down* the tier ladder instead of gating it behind a flag, the identity target is "the tiers
you didn't mean to touch," and the cleanest proof is that the untouched tiers write their pre-existing constants.**

**Three concrete traps Gate-1 caught (all verified against the real code, none guessable):**
1. **The rebuild seam key was incomplete.** `setWaterReflective` early-returned on `useReflection === reflective`.
   But tier0 and tier1 are *both* reflective — only the mirror **resolution** differs (768 vs 384), and
   `textureWidth` is a construction-time Reflector option. So a tier0↔tier1 swap would no-op and leave the mirror
   at the wrong size. Fix: the seam key is `{reflective, mirrorRes}`, rebuild if *either* changed. **→ when a
   rebuild is keyed on state, the key must include EVERY constructor input that can change, not just the obvious
   boolean.**
2. **The far-plane clamp target was wrong by one indirection.** The plan was "clamp the mirror camera's far to
   `fogFar+50`." But `Reflector.js` copies the **main** camera's `projectionMatrix` into the virtual camera
   (`virtualCamera.projectionMatrix.copy(camera.projectionMatrix)`) — setting the mirror camera's far does
   nothing. The clamp has to wrap the incoming **main** camera (save far → `updateProjectionMatrix` → render →
   restore), and read the **live per-material** `fogFar` uniform, because `sharedUniforms` is only synced at
   rebuild while `updateWater` writes the material clone every frame. **→ before "clamp the mirror," read how the
   mirror actually derives its projection — planar reflectors usually inherit the source camera wholesale.**
3. **The verification file didn't exist as imagined.** The spec said "extend `tests/composer.mjs`" — but that's
   the **audio composition** engine test (`js/composer.js`), nothing to do with the post-FX composer. New file
   `tests/passbudget.mjs`; `run-all.mjs` auto-discovers it. **→ verify a named test file is what its name implies
   before planning to extend it.**

**Half-rate reflection: the stale matrix is a feature, not a bug to fix.** Rendering the mirror every other frame
means on skip frames the water samples last frame's RT. The instinct is to at least update the `textureMatrix` so
the reflection stays registered — that's exactly wrong: a fresh matrix against a stale texture makes the
reflection **swim**. Skipping the whole `onBeforeRender` freezes texture *and* matrix together — matched
staleness, no swim. Two guards make it safe: the parity counter is bumped in `updateWater` (once per **presented
frame**), never in `onBeforeRender` (which any extra scene render — e.g. the god-ray mask pass — would corrupt),
and `rebuildWater` resets parity to 0 so a freshly-built 384² RT never presents its initial black frame. Half-rate
ships at **tier1 only** (judged against *no reflection at all* → pure uplift); tier0 half-rate waits for the owner's
judder call on the preview (it's the N10d roughness-blur trigger).

**A hazard the doc missed, that only reading the sizing code surfaced.** The god-ray mask RT is sized in **CSS
pixels** (`window.innerWidth * scale`, no `pixelRatio`). Quarter-res on a ~390-CSS-px phone — exactly the tier1
device class — is a ~98px-wide mask; any lower and thin occluders (ring rims, wingtips) fall out and shafts bleed
through solid objects. Guard: a hard `Math.max(96, …)` per-axis floor (a no-op at tier0 for any viewport ≥192px,
so tier0 stays identical). The escape hatch if the preview still shows bleed is tier1 scale 0.35, not a floor bump.

**Verification that actually exercised the runtime, not just the math.** `tests/passbudget.mjs` (19/19) asserts
the full tier truth table functionally — the Reflector constructs headless on the CPU, so `createWater(0/1/2)`
really builds 768/384/cheap and `getRenderTarget().width` proves it; `setPostTier(0/1/2)` really writes uSamples
40/24 via a stubbed `postfx` object (composer null → `applySize` early-outs, no WebGL). Then a headless boot at
each pinned tier confirmed the *live* path: tier0 → Reflector 768 + god-rays on; tier1 → Reflector 384 + god-rays
on; 0 console errors. The A/B (`tools/tier1shot.mjs`, freeze-at-warp, CDP capture) is the owner-facing proof:
same Sanctuary frame, tier1 goes from flat-sky/shading-only-water to shafts + a real reflected skyline.

**→ Leapfrog.** Phase 2 (world & atmosphere) is complete: N15 → N8 → N9 → N10a/b/c → N11. The tier-uplift identity
pattern ("prove the tiers you didn't touch by having them write their old constants") is the template for any
future "push an effect down the tier ladder" work, and `waterReflState()`/`postTierState()` are the reusable
introspection seams. Next is Phase 3 (N12 grade v2 / AA close / shop DOF → N13 weather), or the N10d reflection
blur if the owner's tier1 preview shows half-rate judder.
