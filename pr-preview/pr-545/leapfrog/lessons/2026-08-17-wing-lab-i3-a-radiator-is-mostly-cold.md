# 2026-08-17 — Wing lab I3: a radiator is mostly cold, and a budget probe must be able to fail HIGH

**Did.** Built `90-SYNTHESIS.md` §7 in full on `forgewing`: the zone-A ventral forge window
(one hard-bordered pane, rim stage 0 / core stage 1), zone-B artery members lit on the
*existing* dark vein doublets, mid-panel secondaries at the power stroke, an outer recruit +
capillary flash at ignition, three incommensurate rhythms, §7.4 temper rings, and a
GPU-resident §7.5 ember shed — all in **2 draws per wing** and **+784 tris for the pair**
(3,076 → the ≤3,000 target's neighbourhood, ceiling 4,000; whole form 5,397 of 6,000).
Plus the two Round-3 carry-ins: the mirror-plane BACKLIT re-shoot with an L/R assertion, and
seeded jitter on the cord-end teeth.

## The five findings

**1. "Emissive fraction of one wing's projected area" is meaningless until you name the
camera — and the honest camera is the one that can SEE it.** The first ventral crop was a
guessed "below and behind" (`dir −0.30, −0.46, 0.84`) and it reported **7 fire pixels**: at
glide this wing carries ~45° of dihedral, so its ventral normal measures
**(0.795, −0.601, 0.085)** and the guessed axis was 84° off it — the wing was edge-on to the
camera that was supposed to be looking at its underside. Measured from the wing's own ventral
normal the same geometry reads 1,808 fire pixels. **Derive the money cam from the posed
geometry** (one `Matrix3` on the pivot's world matrix, per pose) instead of eyeballing a
direction; the numbers in the pose table are in the repo now. From the chase camera the same
budget reads ~0%, which is the *design* working (the radiator is withheld) and would have
been a §7.1 pass for entirely the wrong reason.

**2. Kill #67 has a second half nobody had used: a BAND test must be shown to fail HIGH as
well as low.** Every control in this lab so far proved a metric could notice an absence. A
budget is a two-sided claim — 3–6% fails at 2% *and* at 11% — so `wingfire.mjs` runs a floor
control (`uFireGain 0`: every pane still masked as fire, none of them lit → 0.00%) **and** a
ceiling control (the ignition geometry judged against the cruise band → 10.96%). The ceiling
control is the one that would have caught a wing that quietly lit everything at once.

**3. A recruitment ladder decays into one always-on state if you split it on the wrong
coordinate.** "Cruise lights the proximal half of the vessel lines" was implemented as
`mid-t < 0.335` — and every segment of a tree that terminates at t = 0.60 is proximal by that
test, so 100% of zone B lit at cruise and the power stroke added nothing. The split that works
is on the **tree**, not on a span coordinate: orders 1–2 (trunk + first fork) at cruise, order
3 at power, order 4 withheld entirely to the ignition capillary flash. Measured: zone B
1.42% of the wing, and the state totals separate cleanly (0.95 / 3.59 / 7.71 / 10.92%).

**4. Sharing one generated tree between the field and the geometry is right, and it forces a
clip you would not otherwise think of.** The artery ribbons are built from the *same*
`vesselSegments()` list the I2 `DataTexture` stamps, offset onto the side the rasteriser put
the artery on (`s = −off`) — so every glowing hairline runs against the wider dark vein it
belongs to, and the I2 field is byte-identical. But the tree's trunks start inboard of the
forge window and run straight through it, so drawn as-is the arteries read as **red pencil
strokes ruled across the forge door** (and inside a 0.9-luma pane a 0.26-luma line is
invisible anyway — the pixels cost the read and bought nothing). Zone B is now clipped against
zone A's outline: it radiates *from* the window's border, which is what "doublets radiating
from A" actually means.

**5. ACES decides where your "clip to white" lives, and the ramp exponent is the dial.**
Authored deep orange `#ff5410` (linear 1.000 / 0.0889 / 0.0052 — R ≥ G ≥ B strictly, never a
white core), the tone-mapper reads ~55× the base emitter as white. With a `pow(1−r, 3.1)`
core ramp a THIRD of the pane sat above 0.90 luma and the window was a pale egg with an orange
edge. `pow(1−r, 5.5)` keeps the clipped core near 3% of the pane and puts the rest in F1's
0.55–0.85 band. Measured clipped-white: **0.00 / 0.32 / 0.48 / 0.58%** of wing area across the
four states, against the ≤1% ceiling, with `frac(B>G) = 0` and `frac(G>R) = 0` on every lit
emissive pixel in every state.

## Two harness bugs the controls caught (both were in the apparatus, not the wing)

- **A mask material is harness state, and `wlMutate` was writing to it.** A multi-pass scan
  swaps every mesh onto a role mask; a mutation collector that finds materials *by mesh role*
  then finds the masks. The known-bad `{color: 0x3c2b1f}` recoloured `MASK_MEM`, the classifier
  stopped recognising membrane pixels, and the probe reported **n = 0 membrane pixels** and
  "fired" for a reason with nothing to do with the wing. Fix: mask materials carry
  `userData.wlMask` and both collectors filter them out; and the scan now applies state and
  mutation **once**, before the passes, with `keepFire` stopping any pass from re-applying
  them. General law: **anything the harness swaps in must be un-writable by the harness's own
  mutation hook.**
- **FX are not surface.** The ember shed is a Mesh (a rod needs an orientation) but its life
  cycle lives in the vertex shader, so a mask pass without that displacement labels the wrong
  pixels — and in a pure-black silhouette tile 48 additive rods become detached black
  rectangles outside the outline, i.e. the quad probe starts measuring FX. Tagged `wlFX`,
  hidden in every scan and in every silhouette tile, the same rule the harness already applied
  to Sprites and Points.

## Reusable

- **`wingFirePatch` / `wingEmberPatch`** (`dragonSurfaceShader.js`): a per-vertex *stage
  threshold* + `step()` gate is how you get §7.1's "abrupt skip, never feathered" for free —
  the buffer is non-indexed and every triangle carries one stage, so a state border is a
  discontinuity rather than a smoothstep you have to defend. A per-vertex colour multiplier on
  one emissive material carries a whole temperature table in one draw. And **pack the
  recruitment stage into the integer part of a phase seed** when the life cycle only reads its
  fraction — a staged particle then costs no second attribute.
- **`material.specularColor = vec3(0)` on an emitter.** three.js gives every dielectric
  F0 = 0.04, so a switched-OFF black pane still shows a grey specular ghost — and a ghost makes
  "emissive fraction" unmeasurable, because an off window stops reading exactly zero. Zero the
  specular on anything whose only job is to emit.
- **`wingfire.mjs`** — bands, clipped white, the thermal-ramp hue law, the L/R mirror-plane
  assertion, five negative controls each naming the ONE metric it trips. Reporting every metric
  for every control fills the sheet with red herrings; a "✗ PROBE IS BROKEN" on a metric the
  control was never aimed at is how a real failure gets skipped.

**Unlocks.** The I3 FIRE gate can be judged on numbers, and I4 inherits a state machine
(`group.userData.forgeFire.setState`) already wired to the shipped `flareMats` contract, so
the flap and the fold can drive load and ignition without new plumbing.
