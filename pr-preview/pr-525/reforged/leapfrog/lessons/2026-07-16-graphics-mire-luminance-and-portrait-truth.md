# Lumen Mire: test in PORTRAIT, and a night biome needs its own biolume LUMINANCE

**What we did.** Owner fly-tested the PR-2 build on a phone and asked "where's the luminance?" — the
Mire read near-black without the surge mechanic lighting the sky. Two corrections landed: (1) all
in-context captures moved to the PHONE'S PORTRAIT aspect; (2) a luminance pass lifting the biome's own
bioluminescent ambient. Determinism byte-identical, biomecycle 11/11, bulletcontrast re-passed.

## Reusable lessons

1. **TEST IN THE SHIPPING ASPECT RATIO — the game is PORTRAIT, and a landscape crop lied about the
   whole Canopy Law.** Every `_mireshot`/frozenshot-style capture defaulted to landscape (1120×700).
   The game ships PORTRAIT (~1320×2868, ratio 0.46). Because the camera's fov 72 is the VERTICAL fov,
   a portrait frame shows FAR more vertical field — so the overhead `drape` canopy (crown at world y
   28–34) that was 0% visible in the landscape crop is clearly hanging into the top of frame on the
   phone. Fable gated the Canopy Law 3.4 "0% occlusion" on landscape stills that structurally could
   not show it. **Rule: capture at the device aspect (portrait 640×1386 here) before judging anything
   about vertical composition — roof, sky share, horizon crop, top-band occlusion.** The landscape
   harness is now a lie for this game.

2. **"Dark night, glow pops" is NOT "near-black" — a nocturnal biome still needs its own ambient
   LUMINANCE, and it must come from the biome's own light logic.** The owner locked "dark night, glow
   pops," which we read too literally as crushed-black sky + ambient. On a real phone (no surge) there
   was nothing to see the world BY. The surge mechanic looked great only because it floods the SKY
   with light — proving the scene needs a luminance source. The fix, staying on-theology ("the drowned
   forest makes its own light"): raise the biome's OWN biolume, never a lit sky (that's Aurora/surge's
   grammar) —
   - **Luminous MIST is the biggest ambient lever:** `fog.color 0x141a14 → 0x263420` (a glowing
     warm-green haze that carries light through the air), `fogFarColor → 0x5e4e2e`, `horizon → 0x5c4a28`
     — a warm amber biolume-haze glow low behind the canopy (readable backdrop WITHOUT a sky curtain).
   - **Lift the ambient fill so surfaces aren't crushed:** `hemiSky 0x141c18 → 0x3a4e32` (warm-green
     biolume), `hemiGround 0x2a1e0c → 0x483212` (amber floor bounce), `sunI 0.85 → 1.25`.
   - **Brighter/denser motes + biolume water:** motes opacity 0.7→0.9, size 0.5→0.58; water shallow
     `0x0c1a18 → 0x18382c` (green biolume in the water).
   Result: a luminous, readable bioluminescent night that still blind-tests distinct from Aurora
   (warm-amber-dominant vs cool-teal sky). The FOCAL glow (hero mushroom, shelf-fungi, light-lanes)
   still arrives in PR-3 — this pass fixes the AMBIENT floor so the world is visible before the hero.

3. **When a luminance lift breaks the danger bullet, move the FOG/haze into the layered-read window,
   not the bullet (the Lost Lagoon rule, re-confirmed).** Brightening the amber haze to L≈0.23–0.24
   put it in the contrast dead zone just under the role-locked magenta danger bullet (L 0.363, ΔL 0.13
   FAIL). Fix: push the haze BRIGHTER into `[0.28, 0.75]` (horizon `0x5c4a28`, fogFar `0x5e4e2e`,
   L≈0.29–0.30) — which clears the bullet AND adds the luminance the owner wanted. Re-run
   `bulletcontrast` after every palette move.

## What it unlocks

The Mire now has a readable, luminous bioluminescent-night ambient on the phone, and the capture
harness tells the truth about vertical composition. Next: fold this into the PR-2 revision (the roof
already works in portrait — re-gate Fable on PORTRAIT captures; the drape may need far less rework than
the landscape gate implied), land the mote-variance + corner-streak carry-forwards, then PR-3's hero.
