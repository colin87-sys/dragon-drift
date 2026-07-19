# THE GODHEAD DETONATION — hotfix: `pow(negative)` NaN → real-GPU black screen (+ the stale-build red herring)

**What happened.** The merged detonation rendered perfectly on the headless software renderer (ANGLE +
SwiftShader) and my desktop captures, but on the owner's **real GPU** (tier-0 PC) the S3 finale went
**totally black** — no sky, no boss, just the HUD. A high-effort Fable audit + this diagnosis split the
reports into two distinct things:

1. **The early "where's the loop?" reports were a STALE BUILD.** The on-screen build stamp is a
   deterministic content hash (`tools/stamp-sw.mjs`, sha256/12 over the sorted asset list, re-generated
   at deploy). The owner's `0dfe2d84a497` is master *before* PR #399 (no detonation code at all — the
   "bright vertical column + dark boss" is the pre-PR supernova star's vertical diffraction spike). A
   service-worker / GitHub-Pages `max-age=600` HTTP cache served pre-merge master. **The committed
   `js/buildId.js` is NOT the deployed stamp** (deploys re-stamp), so there was no way to map it by eye.
2. **The real black screen (post-merge build `638853e65db9`) was a shader NaN.**

**The headline bug — `pow(x, y)` with `x < 0` is UNDEFINED in GLSL; real GPUs return NaN, and one NaN
fragment in an additive layer BLACKENS THE WHOLE SCREEN through bloom.** The shock-ring fragment did
`pow(sin(t * 3.14159265), 1.4)`. At the ring band's rim, `t` (a `varying`) interpolates *epsilon past*
[0,1] at primitive edges, so `sin(t·π)` goes epsilon-negative → `pow(negative, 1.4)` = **NaN**. On a
real driver the NaN propagates; the bloom pass samples + blurs the framebuffer, smearing the NaN across
every texel → a black composite. **SwiftShader swallows it (returns 0/finite), which is exactly why
headless never caught it.** Same latent trap in the streak/wisp `edge = pow(1 - abs(2·uv.y - 1), 1.2)`
(interpolated `uv.y` can exceed [0,1] → base < 0 → NaN).

**The fix (surgical, 4 GLSL edits):** clamp EVERY `pow` base ≥ 0 — `pow(max(0.0, <base>), k)` — on the
ring band, the streak edge, and the wisp edge (the tip-decay/falloff bases were already `max`-guarded).
Also **deleted `precision mediump float;`** from all three fragment shaders (inherit three's injected
`precision highp float;`): mediump makes `uTime` fp16 on Apple GPUs (the scroll quantizes/freezes after
long uptime) and creates a highp-VS/mediump-FS varying pair; highp everywhere is safer and matches.

**The process lesson — headless SwiftShader is NOT real-GPU verification for CUSTOM SHADERS.** It
tolerates undefined `pow`, NaN, and precision mismatches that real Metal/D3D/Vulkan drivers reject or
propagate. Rules going forward:
- **Audit every custom fragment shader for `pow(negative)` / `0.0/0.0` / `log`/`sqrt` of negatives, and
  clamp the base.** A single NaN in an additive/bloomed layer is a whole-screen black, not a local glitch.
- **A custom `ShaderMaterial` is not "verified" by a headless capture** — it needs a real-GPU pass (a
  human on the PR preview on real hardware, not just the software-renderer PNG). The repo rule "the human
  judges motion on the preview" must mean a real GPU, and shader PRs should say so explicitly.
- **Publish the expected build stamp on merge** (`node reforged/tools/stamp-sw.mjs` on the merge commit)
  and never judge the live site without matching the on-screen stamp — this class already bit the repo
  once (`7d6da29` "Re-stamp service worker … so the surge fixes actually reach browsers").

**Verify.** `unmaskedarena` 55 green (loop alive 99.8%, corridor p90 0.344 / p50 0.127, sky p95 0.843 /
p50 0.365; one timing-marginal exhale flake, green on re-run). The NaN path itself can't be reproduced
headlessly (SwiftShader doesn't emit the NaN), so the clamp is a correctness fix confirmed by code +
spec; final proof is the owner on a real GPU.

**Still open (follow-up, not this hotfix): tier-2 graceful degrade.** `setArenaSetQuality(tier≥2)` hides
the ENTIRE detonation on weak mobile, and sky clouds/bloom are off there too — so the flagship spectacle
is deleted on the "60fps weak mobile" target platform. A `drawRange` subset (core + brightest streaks +
one ring) at tier 2 instead of a hard hide, plus a pinned-tier-2 capture in the protocol, is the real
fix — deferred so this crash hotfix stays surgical and fast to verify.
