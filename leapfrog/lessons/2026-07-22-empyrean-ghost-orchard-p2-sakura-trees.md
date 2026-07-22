# 2026-07-22 — Empyrean Ghost Orchard P2: ghost sakura hero trees

**Did / learned.** Shipped Phase 2 of the Empyrean ghost orchard: procedural ghost sakura hero
trees (`js/orchardTree.js`), placed ceremonially in the biome, with two petal columns threading
their canopies (the water→canopy→sky sentence). Studio-gate Fable **4.3**, in-biome Fable **4.4**.
One tree geo instanced as TWO `InstancedMesh`es (trunk + canopy sharing per-instance matrices → 2
draw calls for all trees), gated on `empyOrchardMix` (0 → byte-identical elsewhere). The hard-won
lessons:

- **Textureless low-poly canopies cannot show topologically-ENCLOSED interior sky-holes.** Fable's
  studio checklist imported a texture-era metric ("≥2 enclosed background regions ≥1.5% of canopy
  bbox"). It is *unachievable* on a filled, one-sided, flat-shaded canopy: whatever gap you open in
  the near foliage, a hull behind it fills it in projection. Real engines punch leaf-gaps with
  alpha-textured cards — forbidden here (100% procedural, no textures). Chasing it burned ~6
  iterations. **The technique that DOES give see-through:** delete the ±z cap faces of an
  icosa-hull so it becomes a *ring band with a tunnel along the camera axis* (`holeZ` in
  `orchardTree.js`); placed where sky sits behind it (crown-top, rearmost hull) it reads as a real
  hole and costs FEWER tris. It still only reaches ~0.8-1% (neighbours occlude), so —
- **Gate airiness with a composite metric, not enclosed-hole topology** (Fable's ruling, now the
  standing tree spec): `fillFrac ≤0.45 at ¾` (canopy fills <45% of its bbox) **+** `notchFrac ≥12%`
  (sky bitten into the silhouette between its own edges) **+** `≥1 see-through ≥0.5%` (holed-hull
  tunnel). This is what "not a blob / sky in the crown" actually means for textureless foliage.
- **The canopy lives on a knife-edge between "pink blob" and "five balloons."** Too much
  overlap+rose → a saturated lollipop (killed by: rose only on downward faces `ny<-0.30` at a low
  per-hull `roseFrac`, crown fully pale, ≤8-10% rose coverage). Too much separation → floating
  clumps (killed by: ~25-30% hull interpenetration + a visible trunk/limb armature threading up
  into the crown as connective tissue). The spiky per-vertex jitter (±22-38%) cuts the notches that
  read as airiness *without* splitting the mass.
- **In-biome, a pale prop disappears against other pale props unless you separate by HUE, not just
  value.** The bone-white tree first read as "more frost-coral pillars" next to the bone-pale
  structMix arches. Fix: tint the whole canopy mass a pale-ROSE blush (`[L, 0.86L, 0.93L]`, hue
  ~332°, S~0.15 — pastel-legal) while keeping the trunk bone-white. Warm-cream canopy vs
  cool-lavender pillars = instant material separation AND it buys the sakura identity past 40m
  (plain white read as generic frost). Blush ≠ blob: S~0.15 pale wash is not the S~0.5 saturated
  accent.
- **Thread the NEAREST-in-view instance, not a fixed one.** First threading glued 2 petal rafts to
  fixed tree indices; the prominent tree in frame was usually a *different* index, so its column was
  absent and the sentence read as three separate words. Fix: each frame pick the two nearest trees
  ahead of the camera and ride their bases; fan those columns wide through the canopy band (y~6-14)
  so ≥30% of petals overlap the canopy silhouette. Now the tree you're passing always carries its
  own rising column.

**→ Systematize.** Reusable kit for **any procedural low-poly hero foliage/prop on a pale field**:
1. **Airiness = fillFrac + notchFrac + holed-hull tunnels**, never enclosed-hole counts. Bake the
   see-through with `holeZ` (delete ±cameraAxis cap faces) where sky is behind; it's cheaper than a
   solid hull.
2. **Pale-on-pale separation is a HUE problem.** Give the hero a legal-accent blush the ambient
   masses don't have; keep one sub-element (trunk) in the neutral family so it still belongs.
3. **Value ladder + per-face grain + two-tone accents** port straight from the P1 petal lesson:
   authored saturation is a budget ACES spends, not the output; a flat pale prop washes white.
4. **Ceremonial cadence has a floor:** "sparse" still needs ≥1-2 heroes near camera every frame
   (here 62m spacing, 10 instances) or a cruising player sees an empty cycle. Scale the elders
   (×1.35) so at least one hero owns ≥15% of frame height.
5. **Couple emitter-to-hero by nearest-in-view**, re-asserted each frame over the emitter's own
   recycle — the general pattern for "prop B animates at prop A" when both are world-anchored and
   recycled.
6. **Headless capture rigs that FLY the player must sweep obstacles every poll:** a heavier scene
   (always-drawn `frustumCulled=false` instances) slows the software renderer enough that the
   autopilot over-steps into a live obstacle between shots (caught the CRASHED! screen). Clearing
   per-poll, not per-shot, fixes it.

**→ Leapfrog.** P2 completes the water→canopy→sky sentence and the reusable ghost-tree kit. Fable's
three non-blocking polish notes are the P3/next-pass backlog: **(1)** distance-compensated blush
(lerp canopy S 0.15→0.22 or a faint rose far-LOD rim so sakura survives the fog past 40m); **(2)**
a mid-trunk branch whorl / trunk-hugging petal wisps so a ~19m elder still reads as a TREE when its
canopy exits the top of frame (the bare-pole artifact); **(3)** a ~15% cap on near-plane petal
scale so foreground petals don't occlude the Mote/lane. And the holed-hull tunnel + composite
airiness metric now unblock **P3 — the bleach-koi breach** (a koi arcs up, bleaches dark→pearl,
dissolves into rising petals at the apex) which reuses the petal kit at the canopy line.
