# 2026-07-17 — Jade: the fresh spine-frame skeleton + matching the studio reference

**Did / learned.** The Jade build sheet reverse-engineered a *gorge-chase* North Star and evolved the
shipped `koiSerpent`/`silkFinWings` rig in place. But the owner's actual target was the **studio render
IMG_7739** — a long S-coiling koi with a ROW of broad rounded pleated web-fans down the body and a
leaf-fork tail. Trying to hit that on the shipped rig failed: the wing-pivot fans cluster at one shoulder
and can't distribute or orient down a coil; the body only S-curves at *runtime* so the static/showcase
body is a straight stub. After the owner said "start fresh, develop the bones properly," a purpose-built
torso module (`dragonJadeSerpent`) cleared the veto in one architecture change: **loft the tube along a
real spine curve with a per-station frame (tangent / up-normal / side-binormal); mount the fans BY the
frame; emit fans + leaf-fork tail into the single body mesh so they ride the swim wave.** Fresh bones beat
three rounds of pushing the wrong rig uphill.

Four concrete gotchas the rounds surfaced:
- **The shared head builder paints the skull from `mats.bodyMat.color`.** A vertex-coloured torso sets
  `bodyMat.color = 0xffffff` (hue lives in the vertex attribute), so the koi head rendered WHITE. Fix:
  hand the head a jade-*coloured* sibling material (`headBodyMat.color.set(jade)`) while the body mesh
  keeps its white/vertex-colour material. And the skull lifts its dorsal crown ×1.95 — on a mid-jade base
  that blows out to **chartreuse/khaki** on the muzzle; pick the head base value so ×1.95 lands mid-jade.
- **"Remove the pearl" ≠ `pearlStage:0`.** Stage 0 is the *whelp bead size*, not "off" — the pearl always
  builds. To actually drop it (it read as a floating jaw orb), switch `parts.wings:'none'` (or gate the
  builder). Verify a "removed" element is gone at EVERY tier — it survived at T0 after the glide frames
  were clean.
- **Teal fans were LIGHTING, not vertex colour.** Every fan vertex was green, yet the pleat valleys read
  teal — the cool studio ambient reflecting off pale facets. Two fixes together: `envMapIntensity:0` (no
  sheen band) + a **green emissive floor** (`bodyGlow ~0.2`) so shadowed facets self-illuminate green.
  Also make pleat/rim contrast **value-only** (`multiplyScalar`), never a hue lerp to a different colour,
  or adjacent spokes alternate blue/green.
- **`flatShading:true` + low env** is what buys the matte "paper-craft" read; a fresnel rim + envMap gloss
  is the loudest "default shader" tell and it was washing out the dorsal ribbon.

**→ Systematize.** (1) **Confirm WHICH reference before building** — a build sheet's North Star can differ
from the owner's actual target; a wrong-reference build burns rounds looking polished-but-wrong. Ask/verify
the target image first. (2) **When the rig fights you for >2 rounds on a structural read (distribution,
orientation, coil), suspect the BONES, not the dials** — a purpose-built spine-frame loft is the reusable
tool for any "fins/limbs mounted along a curved body" creature (mount by the frame, emit into the wave
mesh). (3) **Jade-only builders can be reshaped freely** — grep who references a builder; if one def uses
it, there's no coexist/byte-identity tax, so don't gate behind nullable dials. (4) **A starter that changes
architecture needs its starters.mjs asserts re-homed** — guard the shared `measure()` for absent
wing lobes and route the new creature to its own assert set (`bodyFinCreature` flag) instead of forcing the
wing-lobe/motif/span asserts. (5) The colour gotchas above generalise: **debug "wrong hue" by asking
vertex-colour vs lighting first** — a uniformly-coloured mesh that reads two-tone is lighting/ambient, fixed
with emissive floor + env, not a vertex re-tint.

**→ Leapfrog.** The Fable-gated ladder went 2.1→2.7→3.40→3.60 across the redesign, veto cleared once the
skeleton was right; the remaining work is pure finish (matte, one-hue fans, head wedge). The reusable asset
is `dragonJadeSerpent` itself — a spine-frame koi/eel torso that any future serpentine creature (or a
biome eel/river-boss) can adopt: curve + frame + girth + emit-fins-into-the-wave, all in one mesh. Next: a
`flatShading`-aware facet-density dial so the paper-craft read is a knob, not a hand-tuned K.
