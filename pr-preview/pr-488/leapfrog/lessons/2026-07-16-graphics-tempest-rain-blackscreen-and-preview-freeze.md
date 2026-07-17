# Tempest rain: the black-screen hunt — three gotchas, one method

**What we did.** Shipped storm rain for Tempest Reach (biome 7). The owner saw, in sequence:
"no rain at all", then a *full-black scene* (HUD only) — on **both** PC and iPhone, while the
live site + every other biome rendered fine and every headless capture here rendered fine.
Chased it to ground and shipped a rain that finally renders on real hardware.

The saga produced **three separate reusable gotchas** and **one debugging method** that matter far
beyond rain.

---

## Gotcha 1 — a merge-conflicted PR silently FREEZES its preview (no build, no error)

For ~1h the owner tested a preview that **never contained the code I was pushing**. Cause: the
PR went `mergeable_state: "dirty"` (conflict with master, after another biome PR merged), and
**GitHub does not build `pull_request` previews for a conflicted PR** — it can't create the
test-merge commit, so no workflow run is created at all (not failed, not cancelled — *absent*).
The preview stayed frozen at the last clean build; every commit after was invisible.

- **Tell:** you push, the PR-preview bot never re-comments, and the deployed `buildId.js` /
  file tree never changes. Runs filtered by branch show nothing new; other PRs deploy fine.
- **Verify what's ACTUALLY deployed**, never assume a push == a deploy. Read the gh-pages tree
  directly: `git show origin/gh-pages:pr-preview/pr-<N>/reforged/js/buildId.js` and
  `git ls-tree origin/gh-pages pr-preview/pr-<N>/reforged/js/<file>.js`. If the file you added
  isn't there, it never shipped.
- **Fix:** resolve the conflict (merge master in). Here only the two *generated* stamp files
  (`buildId.js`, `sw.js`) truly clashed — resolve with `--ours` then re-stamp; the biome code
  auto-merged clean. `mergeable_state` flips to `clean` → the preview builds again immediately.
- Related: `pr-preview.yml` shares ONE static `concurrency: group: gh-pages`
  (`cancel-in-progress:false`) across all PRs, so a busy queue can also delay a deploy — but the
  conflict-freeze is the total one.

## Gotcha 2 — behind-camera billboarded quads with a manual perspective divide BLACK real GPUs

The rain was billboarded quads (custom ShaderMaterial). Drops are distributed **all around the
camera, including behind it**, so many quads straddled the camera plane (`clip.w ≤ 0`). The
vertex shader computed a varying as `vScreenX = clip.x / clip.w`, and the mesh was
`side: THREE.DoubleSide`. On **conformant GPUs (both desktop + mobile)** those near-plane-
straddling double-sided triangles rasterize **screen-wide** and blanked the whole framebuffer.
**Headless SwiftShader clips them cleanly**, so it rendered perfectly in every test + screenshot
— the bug was invisible to the entire local harness.

- This is distinct from (and survived) a NaN-billboard fix: guarding the degenerate
  `cross(fallDir, viewDir)` and discarding NaN alpha (`if(!(a>0.003)) discard`) did NOT fix the
  black — the cause was the geometry straddling `w=0`, not a NaN.
- **Law:** for a camera-surrounding particle field, do NOT hand-roll `clip.x/clip.w` varyings on
  double-sided quads. Either cull behind-camera instances, or — the robust fix we shipped —
  **use `THREE.LineSegments` + `LineBasicMaterial`**: no custom shader, no billboard math, no
  manual perspective divide, no double-sided geometry. Lines clip cleanly at the near plane, so
  none of the screen-wide-triangle failure modes exist. Per-vertex RGBA (color attribute
  `itemSize: 4` → `USE_COLOR_ALPHA`) gives a bright-head→transparent-tail streak taper;
  `material.opacity` carries the `rainMix` gate.

## Gotcha 3 — headless software GL is NOT a proxy for real-GPU CORRECTNESS

We already knew headless under-renders reflective/bloom (brightness). This adds: **SwiftShader
also *tolerates* undefined/degenerate behavior that real GPUs render as garbage/black** — NaN
geometry, near-plane straddles, double-side edge cases. So "renders fine + 0 console errors
headless" proves *nothing* about a real-device black. Silent black on hardware ⇒ suspect
undefined-behavior geometry, not a crash (a crash would log).

---

## The method that actually worked — BISECT ON THE OWNER'S HARDWARE

Two inspection-based guesses (render-path, then NaN) were both wrong because I can't reproduce a
real-GPU-only bug in a software-GL container. What cracked it in ONE round: ship **per-feature
URL kill-switches** (`?norain`, `?noclouds`, `?stormsea=0`) and have the owner load a few URLs.
Every URL with rain ON was black; every URL with rain OFF rendered (clouds + storm-sea ON in the
working cases) → rain, conclusively, no theory. Also shipped an **on-screen error catcher**
(inline in `index.html`, before the module parse: hooks `window.onerror`, `unhandledrejection`,
`webglcontextlost`, and filtered `console.error`) so a real device with no console can show the
fault — its *silence* (no red bar) was itself the clue that ruled out crashes/shader-link errors
and pointed at silent undefined-behavior geometry.

**Reusable rule:** when a bug is real-device-only and unreproducible in the harness, stop
inspecting and **instrument for a bisect the owner can run** — feature kill-switches +
on-screen error surfacing. One test round > N inspection guesses.

## Also

- Re-enabled the on-screen `build …` stamp under `?biome=` pins too (was `?debug`-only after the
  UI-premium overhaul) — confirming *which* build a device loaded is essential to rule out stale
  cache during a deploy hunt. Player URLs never carry `?biome=`, so players still never see it.
- Rain look is intentionally **simple-but-safe** right now (plain streaks). Premium density/depth
  is the follow-up, now that it renders on device — "working then beautiful", never the reverse.
