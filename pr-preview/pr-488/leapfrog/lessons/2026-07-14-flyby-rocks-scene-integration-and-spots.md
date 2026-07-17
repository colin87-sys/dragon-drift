# Flyby asteroids — seating them in the scene (kill the spots, escape the wrong-colour fog)

**What we did.** The premium-asteroid rebuild fixed the SHAPE (owner confirmed the sculpt reads as believable
rock), but two surface problems remained on the owner's phone: (1) "weird spots" — scattered bright gold-rose
dots on the near-black bodies, and (2) the rocks looked "out of place / pasted on" — flat black cut-outs sitting
ON the warm blast rather than IN it. A Fable art-director pass diagnosed both and prescribed a shader-only fix
(no new passes/draws, net CHEAPER than what shipped).

**Spots — the lesson: on a near-black body, ANY embedded emissive speckle reads as a blemish, no matter how
"correctly attached."** The prior pass had *cavity-gated* the molten glow (`uCrackCol * smoothstep(vCav) *
n3(vObjP*6) * vHeat`) to fix the earlier "khaki-camo floating decal" complaint — i.e. it fixed ATTACHMENT. But
the body luminance is ~0.03 and the ember peak was ~1.8× a warm colour → a 30–60× local contrast pop that
crossed the bloom threshold → glowing dots. Attachment was never the problem; SCALE + CONTRAST on a dark body
was. Fix: **remove the ember term entirely** (these are asteroids near a blast, not lava bombs). The owner
flagged this same term twice under two different symptoms ("camo veins" → "weird spots") — when a decorative
term keeps generating complaints, delete it, don't keep re-shaping it. (Deleting it also removed the single most
expensive op in the shader — one full `n3()` — paying for all the integration work below.)

**The "pasted on" ROOT CAUSE we'd missed — the rocks were being fogged toward the WRONG colour.**
`MeshStandardMaterial` defaults `fog: true`, and the heaven's scene fog is a LOCKED dark violet (`0x352b52`,
near 60 / far 340, bullet-contrast-locked in arenaSkin). The conveyor rocks span camera-distance ~85–570m, so
the engine was already applying aerial perspective — toward flat dark violet, against a bright warm additive
blast (the detonation is `fog:false`/additive/tonemap-off). **Atmospheric perspective toward the wrong colour is
worse than none** — it erases the sculpt's surface at exactly the distances most rocks live, painting matte
violet-black stickers. The lesson: **when an object looks "cut-out" against a coloured backdrop, check whether
the scene fog is dragging it toward a colour that fights the backdrop** — a dark occluder in a warm scene must
either receive the warm fog or opt out and paint its own.

**The integration recipe (all inside the existing `onBeforeCompile`, one master dial `uSeatK`, `?noseat` A/B):**
1. **Warm blast FILL on the body** (not just the rim): `outgoingLight += diffuseColor.rgb * uFillCol *
   (0.5 + 2.3·ndotS²)`. Driven by the existing view-space `uStarDir`; `diffuseColor.rgb` already carries
   albedo×AO×mottle so crevices auto-receive less and stone stays stone-coloured (not repainted). This is the
   fix for "black hole body" — the blast is a huge warm light; let the body catch it.
2. **Lift the AO floor** `0.28 → 0.45`: on a 0.03-luminance body, 0.28 is indistinguishable from black; 0.45
   keeps a legible ~2.3:1 crevice tier that reads as shadowed stone (§3.2 value-tier endpoints).
3. **Escape the violet fog** (`fog:false`) and paint a warm in-shader haze toward the blast gas instead:
   `mix(outgoingLight, uHazeCol 0x8a6046, smoothstep(110,470,dist)·0.72)`. `uHazeCol` sits BELOW the mid-annulus
   blaze so distant rocks read as dark shapes INSIDE the glowing gas, not glowing themselves. Applied after
   rim/fill so distance also mutes the rim (correct aerial behaviour). This is the biggest "belong" lever.
4. **Soft lit-edge halo** `uRimCol * pow(rimBase,1.1) * warm * 0.16` — a broad warm shoulder distinct from the
   thin `pow(rimBase,2.6)` rim, so the silhouette transitions as a gradient, not a razor cut against the bloom.

**The balance law — dark ENOUGH to stay a silhouette-occluder, warm-lit ENOUGH to be stone in the scene.** The
owner liked "dark rock against the blast"; the failure was going ALL the way to black. Targets: blast-lit body
mid-tone ~0.09–0.15, shadow side ~0.035–0.06, hazed-distant ~0.12, vs the blast ~0.5–0.8 — rocks stay the
darkest large element (4–6× darker than the blast) but every pixel now sits above the black-hole floor.
Fairness preserved: opaque, `layers.set(1)`, still dark occluders below every probe cap; a warm-dark body is a
*better* bullet backdrop than a bloom-fringed black hole (less silhouette shimmer).

**Verify.** smoke + bossboot zero-error; `unmaskedarena` margins/ledger/tris/minX UNTOUCHED (no geometry/
placement change). Probe direction is UP (rock pixels ~0.02→~0.10) but bounded far under the gates (sky p50 ships
~0.40 and rock pixels stay below it → can't move the median; p95 owned by the detonation column; corridor caps
unaffected — rocks keep |x|≥25). Removing the ember term *lowers* peak rock luminance (bloom feed down =
fairness-positive). The auroraMix red is pre-existing. **Owner judges on the real GPU:** spots gone, body reads
as warm-lit stone, distant rocks melt into the gas, silhouette still emphatically dark. If milky, the first dials
down are haze 0.72→0.55 then fill 2.3→1.8. Net per-fragment ALU is NEGATIVE (removed n3 + the fog chunk > added
fill/haze/wrap) — the fix is cheaper than the bug.
