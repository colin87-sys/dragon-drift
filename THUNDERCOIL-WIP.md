# Thundercoil — work-in-progress handoff

> Transient state that is NOT yet in code. For the full history read `LEAPFROG.md`
> (the lessons ledger, the source of truth) and the commits on this branch.
> Delete this file once the open step below is done.

## Branch / PR
- Branch: `claude/thundercoil-dragon-continue-7hb2zq`
- PR: #175 (draft)

## Where it stands (done + committed)
- Thundercoil is an asset-backed dragon: AI **body** GLB (`reforged/assets/models/thundercoil.glb`)
  with a procedural **slither** (shader spine-wave), correct flight orientation
  (`def.glb {rotY: π, rotX: -0.30, scale: 3.6, ...}` in `reforged/js/dragons.js`).
- Wings were tried two ways: authored membrane, then a SEPARATE AI wing GLB on the flap rig
  (`thundercoil_wing.glb` + `def.glb.wingMesh`). The human judged the separate wing too
  off-style (photoreal vs the game's cel-shaded look) and asked to regenerate the WHOLE
  dragon with wings attached, in the game's art direction.

## OPEN STEP (in-flight, not in code yet)
Replace the dragon with a NEW unified winged mesh, generated in the game's cel-shaded style.
- Concept image generated + APPROVED-pending: Higgsfield image job `ef3b73e4-a8b1-4d36-a6ab-4eb1ec6f19e4`
  (single 3/4 hero view, winged storm-serpent, cel-shaded). Find it via `show_generations(type:'image')`.
- Next: `generate_3d image_to_3d` (textured, no rig) from that image → download GLB →
  overwrite `reforged/assets/models/thundercoil.glb` → `node tools/stamp-sw.mjs`.
- Then retire the separate-wing path (`def.glb.wingMesh` + `thundercoil_wing.glb`) since
  the new mesh includes wings.
- ANIMATION decision for fused wings: the wings are part of the body mesh (no bones), so to
  flap them, add a shader vertex deform that segments wing-verts (|local x| beyond the body
  radius) and rotates them about a fore-aft shoulder hinge by `sin(flapPhase)` — same
  shader-deform technique as the slither, combined in one vertex stage. Drive `flapPhase`
  from `dragon.js` (reuse the speed-norm). Add a `tests/` math gate like `slither.mjs`.
- Re-tune `def.glb {rotY,rotX,scale,shoulder,slither}` for the new mesh on the preview
  (use `tools/gameshots.mjs` / a 1-tier boot; GLBs can't render headlessly).

## How to resume in a fresh session
1. Open the session on branch `claude/thundercoil-dragon-continue-7hb2zq`.
2. Read `LEAPFROG.md` (bottom = newest lessons) and this file.
3. Say "continue the Thundercoil winged-dragon replacement" — pick up at OPEN STEP.
