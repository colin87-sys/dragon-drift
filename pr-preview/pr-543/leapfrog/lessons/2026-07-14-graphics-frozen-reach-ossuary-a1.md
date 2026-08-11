# 2026-07-14 — graphics: Frozen Reach ossuary props (WALL-PROPS A1, the proving hero)

**Why.** First BIOME rebuild of the wall-props redesign (`WALL-PROPS-REDESIGN.md` §6 A1). Frozen was
picked as the proving hero: owner's most-hated kit (two literal single `ConeGeometry(1,1,5)` cones —
`crystal`/`crystalSmall`), lowest method risk (Aurora's ice cousin), and it banks the MARROWCOIL
foreshadow. Replaced with a 5-archetype bone-white ossuary per §4.2.

**What shipped.** `environment.js`: 5 new archetypes — `ribspire` (tall-hero kinked-blade family + fallen
tip + cleft-buried cyan sliver, 136t), `vertebrae` (mid-hero EXCLUSIVE bowed spine of 6 offset lens-discs,
NO accent, 120t), `penitentes` (7-blade hoarfrost bed, one lit core, 108t), `serac` (3-plate foil, no glow,
36t), `glacierfront` (fog-line-floating bergschrund massif, 76t). Retinted `primary[2]` toy-blue
`0x6fb7e8` → bone `0xd8d2c2` @ near-zero cool emissive (roughness 0.32 kept for facet glints). FOAM_CFG +
`biomes.js:96` props mirror updated. Frozen biome now 496 inst / 46.5k band-tris (under the 50k cap).

**Fable Gate-1 (pre-build) caught two real bugs before a line of geometry was written** — this is the
whole value of the gate:
- **The coexistence flip was INVERTED.** I planned to leave the legacy pair at `biomes:[2]` "behind a
  flag." But `biomes:[i]` IS the active gate — both rosters would draw, doubling density to 696 inst >
  the 550 envcount cap → `--ci` red. Correct mechanics: default = new kit at `[2]`, legacy PARKED at
  `[]`; `?props=v1` swaps the two rosters' whitelists at module init (the `?skyforged=0` idiom). envcount's
  shim forces `location.search=''`, so CI always audits the default v2 roster. **Rule: the whitelist FLIP
  is which roster holds `[biome]` and which holds `[]` — never both holding the biome.**
- **`place()` MUST return `tilt` explicitly, and no headless geometry tool can catch its omission.**
  `writeMatrix` does `eul.set(0, rotY, d.tilt)` — a missing `tilt` → `undefined` → NaN quaternion → the
  whole band's instance matrices corrupt. But `propDiag()` (envcount's window) only calls `build()`, never
  `place()`, so the failure is invisible to `envcount` and only shows as garbage in the browser. `vertebrae`
  and `glacierfront` (which want no lean) must return `tilt: 0`, not omit it. **Verified with a throwaway
  `createEnvironment` runtime check that scans every instanceMatrix for NaN (0/64416 floats NaN) — the
  geometry-only guard is necessary but NOT sufficient; exercise the place()+writeMatrix path too.**

**Two more Gate-1 corrections folded in:** (3) dropped a planned `vertebrae` accent sliver — §4.2 says
accent "none"; the cyan ration is carried by `ribspire` + `penitentes` only (accent-creep is exactly the
drift the gate exists to catch). (4) `glacierfront` "floats on the fog line" has NO placement mechanism —
`writeMatrix` hardcodes base `y=-0.5` and `place()` returns no altitude. Fix: bake the float into the
GEOMETRY — mass in the upper normalized band (nothing below y≈0.4) so the world base rides ~0.4·h above
water; `foam:false` hides the missing waterline weld. **Reusable: "elevated/floating" props are a geometry
concern (occupy an upper y-band), never a placement concern — there is no per-instance altitude.**

**Method notes that held (Aurora lineage).** Character lives in the SILHOUETTE via offset-stacking, never
internal rotations (the `(r,h,r)` scale shears them flat); the `vertebrae` bow is 6 discs with
progressively offset centers — survives the shear by construction. No icosahedra in any recipe → all parts
indexed → no `.toNonIndexed()` needed (that trap only bites when ico meets box/cone). Kept `serac` plates
thin (≤0.09 depth) with serration in staggered HEIGHTS, not a chunky dihedral (the crate tell). Steps
11/13/17/29/83 all prime → mutually coprime anti-tiling; `serac` reuses legacy `crystal`'s step 13 but the
two rosters are mutually exclusive under the flag so they never co-tile.

**Verification.** envcount `--ci` green (all ≤150t, 0 transparent surfaces, FOAM_CFG complete, Frozen
496/46.5k under caps); createEnvironment runtime NaN scan 0/64416; gold-determinism byte-identical
(render-only); bulletcontrast pass; tricount 0 over; biomecycle 11/11. **NOT claimed — the visual read.**
`bulletcontrast` is pure-data over `biomes.js` fog/sky and NEVER sees prop materials, so it is NOT the
Law-8/danger-magenta-over-bone proof; A1 also doesn't touch biome-2 fog/sky so C is trivially green. The
real look check is the human on the PR preview (§7.7): staged in the PR — fly Frozen, compare `?props=v1`
vs default, read magenta bullets + the roster's dragons over the bone field, tiershot vs Astral (the twin
axis), confirm the cyan ration reads as withheld (3 slivers, all in clefts).

**What it unlocks.** The A1 taste bar is set and shared: A2 (Caldera) and the B-track (Phase Gate veil,
whose hero skin is Frozen hoarfrost) can proceed. The coexistence pattern (whitelist-flip + `?props=v1`,
legacy parked) and the "verify the place() path, not just build()" discipline carry to every subsequent
biome PR. Next: A2 — Emberfall Caldera (`colonnata`/`riftfang`/`fumarole`/`clinker`/`riftwall`).
