# In-context close-up capture: move the camera via the `cameraCtl.update` SEAM, never a `renderer.render` override

**What we did.** Built a working close-up-in-the-real-biome capture tool (`reforged/tools/_lagoonclose.mjs`)
so side props can be judged UP CLOSE in the actual water / golden light / reflection — not in the water-less
studio and not at the cruise horizon (the owner's note: *"you can't render a shot 305m away… be up close to
assess the side props"*). Used it to assess the four shipped Lost Lagoon roster props (rootbastion, wrackstone,
arcade read strongly up close; lilyraft is a deliberately-minimal 2 m rest-note pad that only reads as a
scatter). The build cost ~5 failed rendering approaches before the real seam surfaced — that seam is the lesson.

## The reusable law

**To render the live biome from an arbitrary camera pose, place the camera in the `cameraCtl.update` seam —
the ONE point the per-frame pipeline treats as the camera's ground truth. Do NOT wrap `renderer.render`.**

The trap: the obvious move is to override `dd.renderer.render(scene, cam)` and set `cam.position/lookAt`
there. It renders BLACK (only screen-anchored bits like the dragon's own water-wake foam survive). Why: the
whole frame is drawn by `renderPostFX()` (the EffectComposer), and *before* that composite the loop reads the
camera at its natural (follow-cam) position to set up everything that depends on it —
`sky.position.copy(camera.position)` (the dome FOLLOWS the camera), the god-ray sun projection
(`SUN_DIR.add(camera.position).project(camera)`), the water Reflector (copies the MAIN camera's projection),
fog. A render-override moves the camera AFTER all that, so the dome is centred on the OLD position and the
displaced camera falls outside it → black; the sun projection and reflection are computed for a camera that
no longer exists. Re-anchoring the sky inside the override doesn't save it either (the god-ray mask + composer
passes are already mis-set for the frame).

**The fix — override the camera controller, not the renderer:**
```js
const cam = dd.camera;
dd.cameraCtl.update = () => {                 // main.js calls this FIRST each frame (main.js:1846)
  if (!dd.__cam) return;                       // null → leave the camera alone
  cam.position.set(...dd.__cam.p);
  cam.up.set(0, 1, 0); cam.lookAt(...dd.__cam.t);
  cam.fov = dd.__cam.fov || 46; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
};
```
Now `syncSkyRig`, `updateEnvironment` (sky-follow), the god-ray projection, the water reflection and fog ALL
read OUR pose downstream — exactly like normal play. The biome renders correctly around any pose, god-rays ON.
**General principle: to relocate the game camera for a capture, hook the seam that runs BEFORE the frame reads
the camera, not the draw call that runs after it.** (This generalises to any engine with camera-derived
per-frame uniforms: sky domes, planar reflections, screen-space god-rays, TAA reprojection.)

## Supporting notes (reusable tool mechanics)

- **Find sky/water without a shipped seam:** traverse and match by uniform signature —
  sky = `mat.uniforms.topColor && .horizonColor && .sunGlow`; water = `.deepColor && .shallowColor`. No need to
  edit `main.js` `window.__dd` to expose them.
- **Find a real ACTIVE off-lane prop instance:** scan `InstancedMesh.instanceMatrix.array`; keep instances with
  basis-scale `hypot(col0)>1`, `y>-10`, `|x|` in the off-lane band (8–55). The arena/boss meshes have the most
  verts but are parked (scale≈0) — the scale filter skips them. Read the prop's height from `hypot(col1)` to
  frame proportionally.
- **Centre the biome on the shot:** set `player.dist` so the target prop sits ~20 m ahead (water plane follows
  `-playerDist-250`, band recycle keys off `playerDist`), then `player.speed=0` to hold it.
- **FLAT tiny props (lilyraft 2 m pads) don't hero-frame** — a lone pad picked in isolation reads as one
  submerged leaf and shows the water-speckle-at-grazing grit; they're a rest-note that reads as a *raft/scatter*,
  by design (matches the composition-pass watch note). Volumetric props (rootbastion/wrackstone/arcade) frame
  cleanly from a low outer-side vantage at ~1.15× their height.
- **Headless budget:** 4 parallel Chromium boots time out `page.screenshot` (30 s) on the weak runner — run
  capture sweeps SEQUENTIALLY.

## What it unlocks

Every future in-context close-up (prop assessment, hero portrait in the live sky, hazard-site framing) now has a
correct, reusable camera seam instead of a black frame. The four Lost Lagoon roster props are confirmed up close
in the real water; next is `campanile` (GREEN-LIGHTED build sheet ready), then `sentinel`, then the composition
pass — and this tool is how each new prop gets its up-close gate shot from now on.
