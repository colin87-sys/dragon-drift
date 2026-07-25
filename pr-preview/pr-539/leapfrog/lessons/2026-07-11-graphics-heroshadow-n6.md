# 2026-07-11 — N6 hero shadow: the dragon's real silhouette, and the override-flattens-sprites trap

**Did / learned.** Replaced the radial contact-blob with the dragon's REAL top-down silhouette: a tiny 128²
orthographic pass renders the dragon alone (dedicated layer 2, white override → white-on-black mask) and the
ground plane samples it **1:1** — the plane exactly covers the ortho footprint, so with `shadowCam.up=(0,0,-1)`
and the plane's `rotation.x=-π/2` the plane's `uv` equals the shadow camera's view (independently re-derived: RT
u→+X, v→−Z; plane local +X→+X, +Y→−Z — no light-space projection matrix needed). Wingbeats show in the shadow.
Wired into Settings as DRAGON SHADOW, OFF by default (blob is the shipped fallback). Reuses the god-ray "tiny aux
pass with save/restore" pattern.

**The bug the Gate-2 review caught (bank this — it's a sharp one).** The mask pass did
`dragon.traverse(o => o.layers.enable(2))` — **everything**, including the dragon's `THREE.Sprite` children (the
9×9 aura, the coreGlow). Under `scene.overrideMaterial` a Sprite renders with the override too, which **discards
its billboarding AND its opacity** — it becomes a solid-white quad fixed in the dragon's LOCAL XY plane. At level
flight that quad is edge-on to the straight-down camera → invisible → *the mask readback looked perfect and
coverage sat at a plausible 1.8%*. But the dragon **pitches** (`group.rotation.x` tracks velocity.y): in a dive/
climb the quad projects a fat white slab (9 × 9·sinθ) into the mask — a fake rectangle wider than the body,
pulsing on every climb/dive. Fix: **`traverse(o => { if (o.isMesh) o.layers.enable(2); })`** (isMesh covers
SkinnedMesh). This is the exact sprite-pollution `godrays.js` already guards against with its layer-0 mask — I
re-introduced it by traversing blind. Added a regression guard (`spriteLeak()` asserts 0 Sprites on the shadow
layer) — a static check that catches it without needing to reproduce a pitched frame.

**Also fixed / learned.** (2) The documented tier ladder wasn't wired: `renderHeroShadow` had no quality gate, so
tier2 (quality 0.35) ran the full 128² aux pass at ~37% opacity — full cost, degraded benefit, on the weakest
hardware. Added `silActive = () => silhouette && quality > 0.4`, gating BOTH the RT render and the plane material
swap (gating only the render would leave the plane sampling a frozen stale mask). (3) `FIT` 9→7 (snugger
footprint → dragon fills more of the mask → 1.8%→3% coverage, bolder shadow).

**→ Systematize.** **`scene.overrideMaterial` is a silhouette/mask tool that lies about Sprites (and anything
whose shape lives in its material, not its geometry).** When you render a group to a mask with an override,
restrict the layer/selection to `isMesh` — Sprites, Points, and Line materials don't survive the substitution as
their visible shape. And **a mask that looks correct in one pose is not verified** — the polluter here was
invisible at level flight and only appeared under pitch; test the invariant (no sprites on the layer), not just
the happy-path screenshot. Same lesson family as N4's tier2 and N5's constant-sky: the bug always hides in the
pose/tier/config the one obvious check doesn't exercise.

**Deviations (recorded).** Camera is straight top-down, not "along SUN_DIR" as the doc's N6 sketch says (top-down
is what makes the 1:1 uv trick exact + doubles as a height cue; trades a sun-angled cast for a noon drop-shadow),
and the silhouette branch drops the blob's `alt·0.18` sun-ground offset. `FIT`=14u footprint, not the sketch's
~12m. `whiteMat`-on-black vs the sketch's blackMat (trivial inversion). The in-scene `tools/shadowshot.mjs`
blob-vs-silhouette A/B is deferred — the `maskURL` readback + a live chase shot cover it for now.

**→ Leapfrog.** The dragon-only silhouette RT generalizes to the **boss** shadow (bosses visibly float over the
sea — same rig, fit to the boss bounds) and is the reusable "render one object to a tiny mask" primitive. And the
override-flattens-sprites rule now guards every future mask/silhouette pass (boss shadow, any future stencil/ID
pass).
