# Calved Canyon — the reusable premium canyon-WALL kit (Frozen rock run)

**What we did.** Replaced the Frozen rock-run's picket-fence of `ConeGeometry` shard
spikes (owner: "absolutely hideous, not a vibe") with stacked, sheared, **calved ice-block
canyon walls**. Fable-gated 3.3 → **4.4/5 in-game** (studio AND backlit sunset). Wired into
`seaStack`'s Frozen branch (`bi===2`); the collider boxes, winding channel, breathe, ring
pocket and per-instance fade are all unchanged — only the mesh + material changed. Other
biomes keep the cone `seaStack` (coexist, don't break the roster). Canyon runs on its own
rng stream → gold-determinism byte-identical.

**The decision that framed it (Fable):** rock runs are a **HYBRID** — one shared wall
generator + kit, biome-swapped by a ~10-line palette block. Not fully unified (kills biome
identity), not 7 bespoke systems (7× build + 7× fairness-audit for an 8-second set-piece).
The channel/collider/fade contract is already biome-agnostic; only the skin swaps.

## The reusable kit (for the next biome's walls)

**1. Sheared-box COLUMN recipe.** Each wall mass = columns of 3 sheared boxes:
recessed **foot** (undercut waterline) → proud **re-flare body** (juts over the foot → its
underside throws the ladder's teal) → stepped-back **crest** (broken ridge). Authored in
UNIT space (x in hw, y in h=26, z in hz) so one fairness pass covers every mass size. **SHEAR,
never rotate** — on a 26-tall wall a 0.15rad rotate walks the top ~3u sideways into the
channel; shearing keeps top faces pointing UP (frost survives) and the ±hw check exact. Box =
12 tris; 36–144 tris/mass, one merge → one draw call.

**2. THE build order that worked — stepping BEFORE batter.** This is the process lesson:
- **Step first** (z-step + height-step the columns): hard-alternate column depth (front/back)
  so the grazing flight angle sees side RETURN faces = thickness; stagger tier tops so every
  block top is a shelf. This alone took 3.3→3.9. *Root cause it fixed:* a normal-based value
  ladder is **occluded by flush same-height geometry** — the flight camera saw only vertical
  (mid) faces, so frost/teal (baked correctly) never faced the camera. The fix is geometric,
  not a richer bake, and **zero tris**.
- **Batter second** (lean the channel face back above band-top + `frostT` 0.30→0.32): adds the
  per-face mid→frost gradient and the calved lean. 3.9→4.4.
- Doing them in that order let each render isolate what it earned. **Bank this: expose the
  ladder's faces to the camera before enriching the bake.**

**3. The self-lit ladder survives backlighting — but `clone()` drops it.** Reused
`bakeIceLadder` (world-up, static-lit) + `withLadderEmissive`. **GOTCHA (cost us nothing only
because Fable caught it pre-build): `Material.clone()` does NOT copy `onBeforeCompile`** — a
plain `mats.frostIce.clone()` silently loses the emissive fold and the wall dies black at
dusk. Always `withLadderEmissive(mats.frostIce.clone())` — re-wrap AFTER cloning.

**4. Per-entry FADE FLOOR.** `spireFades` faded to 0.35 — tuned for thin cone spikes (see
the weave THROUGH them at boost). A solid calved wall ghosts out at 0.35 (in-game regressed
4.4→4.0). Fix: a per-entry `floor` field, `opacity = floor + (1−floor)·smoothstep`; Frozen
walls **0.75** (channel is read from the gap, not through the wall), cone stacks keep 0.35.
Hold 0.75 — the residual translucency is the "seeing into deep ice" depth read; 0.80 flattens
it. **A solid wall and a spike field need different see-through.**

**5. Socket-fades-with-wall contract + the ABSOLUTE-units scale trap.** Rationed crevasse
sockets (countdown on `e`, 1 per 2–3 eligible masses, alternating sides via L/R interleave):
- **Size in ABSOLUTE WORLD UNITS, never a fraction of hw** — masses run to hw≈12, so a
  proportional socket becomes a lit window (the LED failure at scale). Width 0.75w, 2 collinear
  slivers 2.2h at cy±1.5 (flight line y8–12), dark backing 5.6h (frames the ~5.2h glow pair
  with a tight 0.2h margin — DON'T shrink to 4.8h or the glow tips poke past the recess = LED-
  on-a-face).
- **Glow floor = wall floor (0.75), same `spireFades` entry** → the crack always belongs to
  its wall (anti-floating-LED). **Dark backing stays OPAQUE** so the recess reads as a hole-
  with-light even as the wall thins near. Modest emissive + the existing shared `frostGlow`
  breathe — bloom does the "glow," so the source stays faint.

**6. Frost-cap calibration.** `frostT` 0.32 crowns the top ~25–30% as a cap; 0.30 over-frosts
the upper HALF (eats the mid rung, blooms into haze). Wall-bake only — never touch the shipped
bar/pillar bakes.

**Fairness.** `wallColliderCoverage()` (in `tests/hazardskin.mjs`) validates the authoring
invariants structurally: body channel-face ≥0.90hw (strict improvement over cones' ~0.5hw),
no channel poke, crest covers the ±0.6hw band AFTER the hw-proportional batter (a fixed-angle
batter uncovers narrow crests — fixed-world recede vs hw-scaled margin). The collider (`box()`)
is untouched, so gameplay is identical.

**What it unlocks.** Caldera next, then a sweep — each biome is a ~10-line param block (palette
3-stop ladder + accent glow + silhouette knobs) reusing this whole generator, per Fable's
rollout plan. The kit (recipe + build order + fade floor + socket contract + cap calibration)
is now proven end-to-end in the shipping backlit context.
