# AURORA SHALLOWS — build plan (Fable, 2026-07-13). Commit to repo with PR-0.

**Concept:** a NIGHT biome at BIOMES[6] — "the polar mirror-sea where the sky dances" — whose
signature is an AUTHENTIC aurora-borealis drapery sky. Themes the Sky Canyon flow run.

## THE ONE THING (authenticity)
The sharp, undulating, BRIGHT LOWER BORDER — a bottom edge, not a middle. Real curtains are
bottom-anchored: a crisp saturated yellow-green base that waves with the folds, rays streaming UP
from it, an exponentially fading top going faintly crimson, a thin rose skirt below — at
crawl-and-breathe pace. Generic game auroras are symmetric rainbow ribbons scrolling too fast.
If the border term survives every tier + tuning pass, it reads as northern lights.

## Aurora technique (js/auroraSky.js, spliced into the sky dome like N9 clouds)
- Renders INSIDE the dome fragment (added into opaque dome color) → ZERO overdraw (not an additive shell).
- Uniform-branched `if (uAuroraMix > 0.0001)` so the other 6 biomes pay ~0 ALU.
- Seam-free noise on `normalize(d.xz)` (fixes N9's atan seam at the root).
- Curtain math per layer: domain-warped FBM folds → sheet density (thin edge-on) → vertical ray
  striations → SHARP lower border `smoothstep` at fold-driven elevation h0 + exp fade up → physics
  ramp keyed on height-above-border: rose fringe → yellow-green core (557.7nm) → faint crimson top.
- 2 layers tier0 / 1 tier1 / 1 layer no-rays tier2 (a quiet arc = still authentic).
- Motion: fold crawl (~90s to cross), breathing (incommensurate 7s+23s sines), rays shimmer 5×,
  world parallax ≈ 0 (a racing aurora looks fake). A slow `act` envelope morphs quiet arc↔drapery.
- Palette uniforms (physics-fixed, not per-biome): green 0x54ff86, red 0xb0303c, fringe 0xd06a8a
  (desaturated rose, NOT the danger magenta 0xff2b6a). Brightness ceiling ~0.85 (under bloom).
- Probe-invisible (like N9); world green-glow via the biome palette cast (free) + optional hemi
  breathing pulse. Water Reflector mirrors it for FREE (the money shot on the still sea).
- tier2 sky-dome dither becomes MANDATORY here (near-black + dim green = worst-case banding).

## Biome identity (BIOMES[6])
NIGHT biome, breather (hazard deferred, Wastes precedent). Verb: CARVE THE FLOW. Anchor banked:
THE SKYWEFT (aurora ribbon-serpent, weapon = the veil hazard). Low FLAT props (floe + iceFang) so
the sky owns the frame (opposition to Frozen's TALL spires). Stillest water in the game (waveAmp
0.2) = the mirror. Near-black indigo sky, moon (not sun), stars 0.85, cloud ~0. Slots between Mire
and Astral (night crescendo: biolume → aurora → cosmos). Flow harmony: aurora green sits between
jade-ring-green and flow-cyan → one cool family; kept legible (yellow-shift + soft field vs
saturated compact objects; cyan stays Windvault/Crest-only).

## Cycle refactor (PR-0 prerequisite — makes appending BIOMES[6] a NO-OP until CYCLE gains 6)
- biomes.js: `CYCLE=[0,1,2,3,4,5]`; `biomeAt` uses `CYCLE[block % CYCLE.length]`.
- ⚠ SEAM the docs missed: level.js:30 setPiecesBetween computes `biomeIndex: k % BIOMES.length`
  DIRECTLY (bypasses biomeAt) → route through CYCLE too, else set-piece palettes diverge.
- Determinism: course gen is biome-blind → gold-determinism BYTE-IDENTICAL (no rev). The eventual
  flip shifts visuals + Caldera's unfixtured hazard blocks (legal, stated).
- Doc: amend BIOME-DESIGN §0 "8 biomes" lock → 9 (owner's idea); renumber Tempest→7, Reef→8.
  Cycle orders: interim [0,1,2,3,4,6,5]; +Tempest [0,1,7,2,3,4,6,5]; final [0,1,8,7,2,3,4,6,5].

## Rollout (each Fable-Quality-Gated, coexist→hero→migrate)
- PR-0: CYCLE refactor (no-op) + setPieces seam fix + doc renumber. Verify: env-diff 2 cycles byte-identical, D, A.
- PR-1 (HERO): js/auroraSky.js + `?aurora=1` force + tier2 dither + star attenuation. Prove on
  `?flowrun&aurora=1` over Astral BEFORE the biome exists. Byte-identical when no biome declares aurora.
  Gate 1+2; tools/aurorashot.mjs; bandshot; real-phone stress. Human judges MOTION on preview.
- PR-2: append BIOMES[6] (full sheet) + 7th mats/tints/skins/palettes; CYCLE unchanged + `?biome=6` warp.
- PR-3: floe/iceFang props + mirror-water tuning + hemi ground-glow pulse.
- PR-4: THE FLIP — CYCLE=[0,1,2,3,4,6,5]. ✅ DONE. Owner flies the full cycle on preview. gold-determinism
  unaffected. Also delivered (Fable cycle-integration plan): (a) **boss-free dream** — `snapBossDist`
  lookahead-2 guard + trigger guard + foreshadow-toll mute (fights TRAVEL 2-5 blocks, so the block-before is
  suppressed too); (b) **smooth seams** — `auroraMix` gets its OWN wider ramp (450m in / 300m out) in
  computeEnv, branch-gated to byte-identity elsewhere, + a continuous god-ray gate (no 0.5-threshold pop);
  (c) run length kept at 1500m (~30-45s dream; ~50-70s boss-free), with `[0,1,2,3,4,6,6,5]` double-block as a
  one-line data dial if the owner wants it longer. Tests: `auroraflip.mjs` (new), `biomecycle.mjs`/`aurora.mjs
  §6` rewritten (the "no cycled biome lights aurora" assert flips), `tools/auroseam.mjs` (new seam filmstrip).
- PR-5 (default-off CONFIG.flowBiomeBias=0): biome-weighted canyonTypeWeights through the single
  canyonRnd draw (flow-heavy in biome 6). Re-pins canyonframe knowingly when flipped.
- PR-6+: veil hazard; THE SKYWEFT anchor (own session); aurora audio bed; horizon foreshadow.

## Key risks: reads generic (→ the ONE thing + montage vs reference forms); OLED banding (→ tier2
dither + bandshot gate); motion swim (→ time-driven, parallax≈0); danger-magenta collision (→ dim
rose fringe + bulletcontrast); perf on 60% surface (→ uniform-branch + real-phone stress).

## Owner decision points to surface:
1. Slotting between Mire & Astral (interim CYCLE [0,1,2,3,4,6,5]) — OK?
2. The §0 "8 biomes" lock → 9 (their own idea; just needs written amendment).
3. Flow-bias (PR-5) default-off — flip only after they approve the biome.
