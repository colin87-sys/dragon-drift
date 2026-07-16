# Unify the rock run with the biome props: it's SATURATION of the glow, not intensity

**What we did.** Owner fly-tested the fixed rock run: "improved, but it really detracts from the
beauty of the biome. Wondering if we use the biome props themselves brought in close to BE the
rock run, or whether we just match the same color." Fable's call (and the right one): **match the
material, don't rebuild from props.** Retuned the calved-wall/arch/mouth ice to the biome
side-props' luminous "Sunset Glacier" glow, and reskinned the Frozen boundary setpieces. Fable
4.1 → cleared 4.2 on one dial.

## The strategic call: color-match beats props-as-rock-run
The owner's instinct was "build the run FROM the prop kit (bergwall/serac) brought in close." Fable
rejected it: **the shape language was never the mismatch — the glow HUE was.** Calved blocks
bounding a water channel is literally what a glacier does at its edge; a canyon of fresh-calved ice
inside a field of weathered bergwalls is good variety, not a clash. Rebuilding from props would burn
the just-shipped, gated calved-canyon system (coverage invariants, ring clearance, occlusion, entry
kit) and re-fight the collider contract with masses never authored to contain a winding channel —
"a week of risk to buy what a material retune delivers in a day." **Escape hatch if shapes ever DO
bother the owner: seed prop bergs in a shoulder band OUTSIDE the collider channel — zero collider
risk.** LESSON: when a new system "doesn't match" an established one, diagnose whether the gap is
SHAPE or MATERIAL before you rebuild geometry — here color/glow was ~80% of the read.

## THE dial that mattered: match the props' emissive SATURATION, not its brightness
The biome props glow with `emissive 0x357088` (a *deep, saturated* teal) @0.42 — tuned to "glow from
every side in backlight" (fake transmission). My walls floored at `emissive 0xcfe4f0` (pale near-white)
→ chalky, matte, sitting ON the biome instead of IN it.

- **First attempt (4.1, one dial short):** I moved the emissive toward teal but picked `0x4f8ea6` =
  (79,142,166) — *lighter and LESS saturated* than the props' `0x357088` = (53,112,136). Result: the
  walls glowed when the sun hit them but went **inert/matte on the SHADOW side**, where the props stay
  alive. The instinct "it looks subtle, push intensity" is the TRAP — cranking intensity with the
  `×vColor` emissive fold blows out the frost caps toward the LED-strip failure the ledger warns about.
- **The fix (cleared 4.2):** set the wall emissive base to the props' EXACT `0x357088` and *trimmed*
  intensity 0.5 → 0.45. **Saturation, not intensity.** A saturated base means the belly/shadow faces
  carry visible teal COLOR even when unlit — that's what wakes up the matte near-walls so they read as
  self-lit ice from every side, matching the props' transmission promise.
- Verification that pins it: shoot a **shadow-side angle** (near wall between camera and sun, its
  camera-facing faces unlit). A pale/desaturated base hides its own failure there; the saturated base
  is confirmed only when the shadowed near-wall carries teal. Trust that frame, not the sunlit ones.

## Don't touch the shared hazard ladder — give the walls their OWN stops + material
`_FROST/_MIDICE/_BELLY` and `mats.frostIce` are shared with the gated 4.4 hazards (bar/pillar/shard).
So the retune is **walls-only**, via: (1) a parameterized `bakeIceLadder(geo, { stops })` with a
wall-only `_WALL_LADDER` (frost near-white, mid toward `0xbfdce6`, belly deepened toward the teal);
(2) a shared `glacierWallMat()` used by every wall/arch/mouth site (seaStack, buildCanyonWallMass,
iceArch, iceMouth) — a per-instance clone of frostIce with the glacier hues. Hazards stay byte-identical
(hazardskin 12/12). CENTRALIZE the material in one helper so all four build sites move together and the
next biome's palette is a one-line swap.

## The "dark strip / large arch" the owner saw = the boundary SETPIECES, not the rock run
`buildBiomeGate`/`buildMegaArch` (setpieces.js) use a flat per-biome `stoneMat` with **emissive @0.06**
— no self-lit floor, so in backlight the towers/beam/torus collapse to near-black. That was the owner's
"dark vertical strip" (a gate leg) and "large arch." Fix (same pass, Frozen-first): swap the
`biomeIdx===2` stone to the luminous glacier material (`0xbfdce6` / `0x357088` @0.42). Zero tris; kills
every near-black element. NOTE the geometry is still machined cylinders/torus — a full rebuild in the
premium **Sun Gate** language (offset-stacked converging pylons, calved lintel, recessed crevasse-core)
is the SEPARATE follow-up job; the material swap is the cheap stopgap that makes it stop reading black now.

## What's banked / next
- Reusable: diagnose shape-vs-material before rebuilding; **match a prop's glow by its SATURATION, not
  intensity** (and verify on the shadow-side frame); parameterized ladder stops + one shared wall
  material so a biome reskin is a palette swap; the setpiece emissive-floor fix.
- Follow-ups (separate jobs): rebuild the biomeGate/megaArch GEOMETRY in Sun-Gate language; roll the
  glacier wall kit to the other biomes (each a ~one-line palette block); optional prop shoulder-band if
  the owner still wants the props literally in the run.
