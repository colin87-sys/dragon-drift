# Thundercoil — work-in-progress handoff

> Transient state that is NOT yet judged on the preview. For the full history read
> `LEAPFROG.md` (the lessons ledger, the source of truth) and the commits on this branch.
> Delete this file once the human signs off the unified winged mesh on the preview.

## Branch / PR
- Branch: `claude/thundercoil-dragon-continue-7hb2zq`
- PR: #175 (draft)

## Where it stands (done + committed)
- Thundercoil is now a **single UNIFIED winged GLB** (`reforged/assets/models/thundercoil.glb`),
  generated `image_to_3d` (textured, no rig) from the approved cel-shaded winged concept
  (Higgsfield image `ef3b73e4`, 3D job `d01ab50b`). 30,925 tris, 7.8 MB, one mesh — wings
  reconstructed cleanly and read as bat-membranes from the chase cam.
- The separate-wing path is **retired**: `thundercoil_wing.glb` deleted, `def.glb.wingMesh`
  removed, the wingMesh load branch removed from `dragonGlb.js`. The authored membrane wings
  remain ONLY as the headless / no-asset fallback (the `glbcontract` test needs them); they're
  hidden in-browser the moment the fused mesh loads (`def.glb.fusedWings`).
- Native mesh pose stands VERTICAL — spine along local **+Y** (head +Y → tail −Y), wingspan
  along ±X — so placement lays it into the chase plane: `def.glb { scale: 3.9, rotY: 0,
  rotX: -1.2, fusedWings: true }`. Verified in the real renderer (head into −Z toward the sun,
  forked tail +Z toward camera, wings spread ±X).
- **Two procedural motions, both shader vertex deforms** on the GLB body material
  (`dragonGlb.js attachBodyDeform`), kept reactive by `dragon.js`:
  - SLITHER: traveling spine wave, now along the **Y** spine (`def.glb.slither {amp,freq,speed}`).
  - WING-FLAP: verts past `|localX|>hingeX` rotate about a fore-aft hinge by `−side·amp·sin(phase)`
    so both wings beat together (`def.glb.wing {hingeX,hingeZ,amp}`). `dragon.js` advances the
    flap phase reactively (quicker on boost). Math gates: `tests/slither.mjs` + `tests/wingflap.mjs`.
- Green headless: glb / glbcontract / slither / wingflap / defs / blueprint / flapcheck / ascension.
  `stamp-sw` re-run (110 assets, only `thundercoil.glb` precached).

## OPEN STEP (preview tuning only — no code change needed)
Judge + fine-tune on the PR preview (GLBs can't render headlessly in CI):
- `def.glb.rotX` / `scale` — the body still drapes a touch vertically (the coiled source pose);
  nudge the pitch if a flatter flight line reads better.
- `def.glb.wing {hingeX, amp}` — confirm the flap hinge sits at the true wing root and the beat
  depth looks right (wings shouldn't tear from the body or clip it).
- `def.glb.slither {amp, freq}` — judge the body coil feel at speed.
- Material tint/emissive on the PBR mesh is limited (documented GLB tradeoff); the electric-blue
  accents come from the baked texture.

## How to resume in a fresh session
1. Open the session on branch `claude/thundercoil-dragon-continue-7hb2zq`.
2. Read `LEAPFROG.md` (bottom = newest lessons) and this file.
3. The unified winged mesh is in; remaining work is preview tuning of `def.glb` knobs above.

## Local screenshot loop (this environment)
- Playwright's pinned browser build mismatches the pre-installed Chromium. Install playwright
  globally (`npm i -g playwright`, browsers are at `/opt/pw-browsers`), then point the shot
  tooling at the system binary: `PW_CHROMIUM_EXE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
  `tests/browser.mjs` has no executablePath override committed — add a temporary one (and revert it)
  if you need an in-engine GLB screenshot. `tools/glbinspect.mjs` reports a GLB's bbox/extent
  headlessly (no renderer) to deduce native orientation.
