# The studio rig must BE the biome's light, or it lies to you (Mire glowtree)

**Context:** Stage 2 of the Mire ensemble — `glowtree`, the far-beacon world-tree — passed the
studio gate (Fable 4.4/5) and then **vanished in-game**. The studio-first workflow the owner
mandated (build in studio → Fable ≥4.2 → in-game money-shot 2nd confirm) is exactly what caught it.

## The trap (why a 4.4 studio asset was invisible in play)

The Mire is a **self-lit biome**: `biomes.js` biome 4 has sun intensity **0.2** and a dark hemi —
there is essentially no key light. A prop's in-game luminance ≈ `emissiveIntensity × ladder-vColor ×
fog-survival`. The `mireherostudio` rig, meanwhile, poured **hemi 0.9 + three dirs (0.45/0.4/0.35)**
onto the prop — roughly **4× the biome's actual incident light**. So a deliberately-dim tier-2 beacon
(`mireFarLiving` @1.15, kept under the arch's @2.3 for depth hierarchy) looked great in the studio and
was a **faint dark dome** in the game. Two compounding killers the flattering rig hid:
1. **Self-lit gap:** at @1.15 with no key light, the emissive alone is dim.
2. **Fog tax:** the beacon's money-shot distance is ~150m (heroShift 150, flank prop). three.js fogs
   the FINAL fragment — emissive included — so linear fog (near 48 / far 255) eats **~50%** at 155m.
   The arch never hit this because it's judged at 0–60m at @2.3.

## The fixes (Fable 60-ruling), all one-pass, deterministic

1. **Brightness at the source:** `mireFarLiving` 1.15 → **1.8** (hard cap of record 1.9; dial the
   ladder/clearing past that, never the constant). Ladder `base` [0.45,0.34,0.18] → **[0.62,0.47,0.26]**
   so the whole canopy joins the beacon instead of a white pinprick. Now sits between arch 2.3 (tier 1)
   and cap 1.6 (tier 3); after the fog haircut its *perceived* crown ~0.9 keeps the eye's near>far order.
2. **Occlusion:** the beacon gets its OWN clearing, mirroring the arch corridor but **one-sided** —
   generalized `mireGateClearPeak(dist)` → **`mireHeroClearPeak(dist, shift, rare)`** returning the kept
   peak INDEX; arch calls `(dist,0,0.5)`, tree calls `(dist,150,0.4)`; identical hashes so clearing +
   beacon never disagree. New `treeClear` half-widths (reedveil 34 = all, boleveil 58 = all on the
   parity flank; canopywall/drape kept as backdrop/roof). Parks only the tree's parity flank so the
   lone lantern stands in its own opened water (crown + reflection twin) while the far flank keeps its wall.
3. **THE SYSTEMIC FIX — make the studio honest.** Recalibrate `makeRig('mire')` to the biome's ACTUAL
   values: `HemisphereLight(0x12101a,0x4c3818,1.0)`, key `0xff9a3c @0.2`, floor `@0.15`, rim `@0.1`, AND
   add `scene.fog = Fog(0x473217,48,255)` + a **far-band (150m dolly) capture** for far props. Rule of
   record: **the 'mire' studio rig is the biome's light or it is nothing.** Under the honest rig the tree
   at @1.8 reads as a solid bright gold beacon (near AND at 155m+fog), predicting the in-game read.

## Reusable laws

- **A studio gate is only trustworthy if its rig matches the biome's incident light.** A flattering
  portrait rig passes assets that die in a dark self-lit biome. Copy the biome's hemi/sun/fog verbatim.
- **Far-band props must be judged WITH fog at their real viewing distance**, not at flattering portrait
  distance — add a distance+fog capture to the gate for any beacon/background archetype.
- **In a self-lit biome, emissiveIntensity is the whole game.** Budget it against the fog tax at the
  prop's actual read distance, and keep a documented cap so the tier hierarchy holds.
- Verifying a dim prop in a busy scene via frozen frames is unreliable (gameplay boost-boxes occlude,
  the debug camera overrides manual moves, lane curve pushes flank props off-screen, parity puts the
  beacon on the far flank). The honest-rig near render + a fog-accurate far render are the cleaner reads.

## Status
All machine gates green (determinism byte-identical, envcount 148 tris, propclearance 18.0, biomecycle
11/11). Brightness validated near + far. The in-game LIVE 2nd-confirm is the owner's (PR preview) — the
final judge on feel per the workflow. Escalation dials if still thin: `baseY 0.40→0.30`, boleveil
`treeClear 58→52`; never push intensity past 1.9 or dim the arch. (Follow-up: the far-band studio
framing aim still over-zooms — a tooling fix, not a blocker.)
