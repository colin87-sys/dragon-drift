# Rib-run marrow-fire — self-illuminate the racing line, scaled by biome darkness (I1)

**What we did.** The owner, playing, said the rib/Dragon-Spine canyon "doesn't read well enough
when playing." Fable's diagnosis (a PLAN task first, per "check with fable for a proper plan"): NOT
globally too dark — in *dark biomes* (worst: the Lumen Mire, sun 0.2) the ivory bone's value
collapses and fog erases the sway curve, so you can't see the bank early enough to carve it. The
guidance surface is thin hoops + a dorsal vertebra chain; darkness eats exactly the elements that
telegraph the turn. I1 makes the racing line itself luminous, scaled by biome darkness, spine-only,
render-only. Fable gate: round 1 **3.9** (amber-tape flat-wash) → dial → round 2 **4.3 SHIP**.

## The three coupled moves (each a default-1 CONFIG dial; 0 ⇒ byte-identical shipped path)
- **M1b rib value-ladder** (`spineRibLadder`): a **`boneMat()` FACTORY**, not a patch on `mats.bone`.
  Every spine gate clones its `fadeMat` per instance and **r160 `Material.clone/copy` drops
  `onBeforeCompile` + live uniform refs** (the never-clone-Skyforged trap) — so a bare clone would
  strip the shader. The factory returns a fresh armed material per gate; `customProgramCacheKey`
  collapses them onto ONE compiled program (the `glacierWallMat`/`markerSurface` precedent). A
  per-vertex 3-stop ladder is baked from geometry (warm crown → cool ivory mid → near-dark belly)
  and folded into diffuse + emissive so each hoop self-reads as a gradient arc.
- **M1a dorsal marrow chain** (`spineMarrowGlow`): the existing dorsal vertebrae split onto ONE
  shared soul-fire-family material (`0x2f7a54`, dim + DESATURATED below the reward-ring green:
  S 0.61 < ring 0.76), gradient-cored per-vertex (calBarFissure discipline) — a lit chain tracing
  `xAt(z)+sway(z)` along the roof. Shared + **never cloned** (ribcage sections are `noDissolve` → no
  per-instance fade), so the clone-carry trap can't reach it; intensity written once per frame (the
  soul-fire pattern).
- **M2 dark-biome bone-lume** (`spineBoneLumeMix`): `boneLume = clamp01(1 − keyLuma(env)/KEY_KNEE)`
  from the already-lerped `computeEnv` light rig, via ONE shared uniform ref (`boneLumeRef`, the
  markerFlow pattern) + one intensity write; scales the EMISSIVE terms only (never diffuse, never a
  flat lift). Seam-safe for free (computeEnv lerps its inputs).

## Reusable patterns banked
- **Factory + customProgramCacheKey for per-instance-cloned materials.** When a material is cloned
  per instance AND needs an `onBeforeCompile` shader patch, you cannot patch the base (clone drops
  it) — write a factory that returns a fresh armed material and give them all the same cache key so
  they share one program. Dynamic per-frame terms ride a shared uniform *ref object*, not a
  per-material write.
- **The per-biome darkness term (`keyLuma` knee).** `keyLuma = sunI·luma(sun) + 0.5·(luma(hemiSky)+
  luma(hemiGround))` from the biome rig. **Color-management gotcha:** r160 `ColorManagement` is on →
  `Color` components are LINEAR, so compute keyLuma in linear space and use `KEY_KNEE 0.72` (probe it
  — one headless line printing keyLuma per biome decides linear-vs-raw; the fallback raw-sRGB knee is
  0.95). Verified: Mire waxes to lume 0.84; **every bright biome clamps to exactly 0** (Wastes 1.79×
  knee, Lagoon 1.47×, … — the in-shader term is an exact `1.0 + 0.0` identity). This is how you lift
  a dark biome without washing the bright ones — scale emissive by `1−keyLuma/knee`, not a flat crank.

## THE dial lesson: emissive gain vs the diffuse value-ladder (Fable D3)
Round 1 shipped `BONE_LUME_GAIN 2.2` → Mire hoop emissive `0.26·(1+2.2·0.84)` = **×2.85**. Against
the Mire's 0.114 key light, the emissive **outshouted the baked diffuse ladder ~6:1** and painted
every arc one uniform bright gold — the carefully-baked crown→belly gradient was multiplied into a
channel nobody could see (**amber-tape flat-wash tell**), AND the ×2.85 hoops out-brightened the
deliberately-dim beacons so the marrow chain went invisible. **The fix was NOT to touch the ladder
stops — it was to lower the emissive gain so the diffuse ladder survives:** `2.2 → 1.2` (×2.85 →
×2.0). Arcs dropped from *luminous* to *lit* (matte bone), the gradient returned, and the beacons
resolved for free (less hoop glare). **Rule: when a baked value-ladder reads flat, suspect an
emissive/self-light term drowning it before you touch the ladder authoring — dim the glow, not the
stops.** (Fable rejected the last notch 1.2→1.0: ~8% dim, sub-threshold, can't turn 2:1 into 2.5:1
or conjure beacons — it would only shave the tunnel-read margin. Don't metronome-tune a scalar.)

## Verification gotchas banked (headless capture of a rare set-piece)
- **`?ribcage` forces a SPINE run; the FIRST canyon is ~900m in.** The spine spans ~15–19 segments.
- **DON'T `?seed=N` to stabilize it** — a fixed seed trips the guaranteed-aurora-flow injection
  (`canyonAuroraFlowShadow` converts spine→flow near an aurora block), giving teal-sky open-water
  frames with no Mire tunnel. Capture UNSEEDED and pick the dists where the tunnel is actually in
  view (an art gate doesn't need determinism; that's machine-gated separately).
- **`boneLadder` material COUNT in the scene ≠ tunnel-in-view** — pooled/faded mats persist. Eyeball
  the frames or project world positions to the frustum; don't trust a scene-graph material count.
- **On/off A/B by separate boots drifts** (per-boot physics settle + mote/water phase) — the roof
  lesson again. Trust the deterministic geometry + a stable-station number over a noisy whole-frame
  diff. The reliable wash-guard number came from the straight station, not the curve.
- **Crown-belly ratio on a 3/4-torus:** the hoop is open at the belly, so a "belly" rectangle samples
  lit WATER/reflection, not bone — my crude sample read 1.39:1 while the true bone gradient was ~2:1.
  Fable arbitrated for the visible-bone pixels over the contaminated rectangle. Sample the mark, not
  a rectangle that catches the background.

## Watch items (Fable D5 — owner preview, NOT revise material) & what's next
- Ivory mid-stop reads at close range only (the Mire's warm key re-warms it at tunnel distance) — F2
  flag, owner's call on the preview.
- Dorsal beacon count in the STRAIGHT tunnel is ~2 visible (below the specced ≥4); the beacon's
  irreplaceable job is the TURN apex and that reads. Denser chain = beacon spacing/placement work
  (a later lever), NOT lume gain — stops/hex/knee stay frozen.
- Apex-beacon brightness runs bright on a bank (bloom-white core) — fine where it's the only signal;
  re-check the S≤0.65 / ≤0.65×ring-luma ceilings only if a beacon ever shares a frame with a ring.
- **Fast-follows from the C1 plan, still open:** I2 fog-relief (lookahead at slip speed), I3 throat +
  boost-out depth beacons, M4/M5 (racing-line thread is owner-gated — a permanent steering assist).
