# A radial `flamePlume` gives a tail 3-D VOLUME; wave+flare+clump keep it from being a feather-duster; and "burning trailing fire" is an EFFECTS reuse (publish emit anchors), not a new system

**Did.** Two more owner passes on the reforged fire phoenix's TAIL, each run through the Fable
design-director → plan → per-checkpoint critic loop. (1) "Flat blob, worst rear-chase" → rebuilt the
tail as a **radial hollow cone of fire** (the `flamePlume` helper). (2) "Too straight, like a feather
duster" + "can the tail and wing trailing edges have a burning trailing-fire effect?" → added lateral
**wave**, tip **flare**, and **clump** spacing to break the radial sameness, and wired a **trailing-fire
FX** by *reusing the game's existing phoenix ember-mote system*. Critic: 4.5/5, "duster is dead,
SHOW-THE-OWNER: YES." All corridor/rose/symmetry/tri gates stayed green throughout.

**Learned #1 — to give a trailing element real VOLUME under a corridor law, build it RADIALLY around
an axis with the downward freedom clamped by construction.** The flat tail was flat because every
ribbon lay in one horizontal plane (face normals all ±y) spread ±2 in x but ±0.06 in y — a 30:1 sheet.
The fix is `flamePlume(n, base, axis, opts)`: ribbons rooted on an **upward-biased egg ring** around the
axis (`rx`, `ryUp>ryDn`), each converging on a shared **gather point** with a helical **twist**. That
reads as a teardrop (swell→waist→point) from *every* camera. The corridor law ({y<0.30, z>0.85}) only
bounds DOWN, so: the **axis climbs** (`dir.y≈+0.10`), the arc leaves a **gap at pure-bottom** (arcDeg
310, not 360), and — the key trick — the outward bow/wave/flare are multiplied by a **belly clamp**
`bc = 0.35 + 0.65·max(0, cosφ)` that goes to a floor in the bottom sector. Downward freedom is removed
*by construction*, so the corridor scan can't fail no matter how the ladder dials move. Rear-chase (the
camera the tail points away from) is carried by a real lofted **root cone + white-hot throat** (a round
nozzle, not a flat shelf) + the ring's tall cross-section — five depth layers where there was one lump.

**Learned #2 — a radial sheaf of equal converging ribbons is a "feather duster"; three cheap terms fix
it.** Even angular spacing + one shared gather point + zero lateral undulation = N straight bristles in
a fan. The cures, all on the atom/helper:
- **wave** (new `flameFeather` opt `{amp,cycles,phase}`): a root-anchored lateral sine on the
  centreline — this is the term the *planform* actually sees (the radial bow is foreshortened there).
- **flare** (new opt): the tip breathes OUTWARD past 70% instead of pinching to a point → licks, not
  needles.
- **clump** (`flamePlume` `clumpAmp`): `phi += clumpAmp·sin(2.6·phi)` — uneven spacing. Because it's an
  **odd function of φ**, the −φ ribbon lands at the exact mirror of +φ, so the plume stays bilaterally
  symmetric (the "never jitter by index parity" rule — parity breaks mirror; odd-in-φ preserves it).
- Plus a structural move: split the one uniform sheaf into a near-body **bloom tier** (short, holds the
  volume) + a **streamer tier** of just a few long waved/flaring ribbons with offshoot **tendrils** →
  the comet *condenses* past the waist into a few flowing licks instead of ending everywhere at once.

**Learned #3 — "burning trailing fire" is an EFFECTS thing, and the phoenix rig already has the
system.** Don't build a shader or a new particle pool. The rig (`dragon.js`) already sheds additive
**ember-mote sprites** for `archetype:'phoenix'` — but from ONE point (`tailSegs[0.6]`, and our tail
published a single `segs` entry). The whole fix is **publish more emit anchors**: the model returns
`parts.emberEmitters` — `THREE.Object3D` markers parented into the **animated** wing `mid` groups (at
the trailing-streamer tips) and the tail group (streamer/core tips + throat) — and the rig **round-robins
the mote source across them** when the field is present (`emberEmitters ? emberEmitters[idx++%n] : …old`).
Fire then peels off the whole trailing edge + tail length, riding the flap/sway pose. Determinism
binds the model BUILD, not the rig LOOP — the loop uses `time`/`Math.random` freely, so all the
*animation* lives there; the model only publishes static hookpoints. Cost: pool 34→44, ~12–25
concurrent additive sprites = same class as the existing boost trail. Additive orange can only raise R
and G, so it **cannot** create a rose flat-fill → the pink gate is safe by construction.

**Gotchas banked:**
1. **Additive + nullable is how you touch a shared rig/assembly without regressing the roster.**
   `parts.emberEmitters` is `null` for every dragon that doesn't publish it → byte-identical no-op.
   Verified programmatically (11 aft anchors at f3 for phoenixReforged, `null` for shipped `phoenix`)
   *before* trusting it — a headless `buildDragonModel` + `getWorldPosition` check is cheap insurance.
2. **`2>&1 | tail` on a node command HIDES a crash** (pipe exit code = tail's success), so an `&&`
   chain marches on over a silently-failed render and you diff stale captures. Run the render bare, or
   check for the "wrote … round rNN" line. (Re-bit me twice this session, with the cwd-reset gotcha.)
3. **Pure-emissive fire mats weren't in the tail's `accentMats`**, so Rebirth Surge never flared the
   tail — publish the element's own materials in `accentMats` (they carry `baseEmissive/baseIntensity`)
   or the signature Surge beat skips it.
4. Low-poly tip polish: a `tipW=0` thin ribbon reads as a "floating pale needle" at zoom; give even
   sparks a small lobe (`tipW≈0.20`) and hard `seg:4` offshoots a `seg:5` + a gentle wave so kinks
   "bend" instead of "snap."

**→ Unlocks.** `flamePlume` (corridor-clamped radial fire volume) + the wave/flare/clump atom terms are
a reusable **3-D fire-plume kit** for any comet/rocket/spirit-trail/boss-jet. And "shed FX off the
model by publishing `parts.emberEmitters` markers into the animated rig groups, round-robined by the
existing emitter loop" is the general, roster-safe pattern for trailing-edge effects — reuse the pool,
publish anchors, gate on a nullable field.
