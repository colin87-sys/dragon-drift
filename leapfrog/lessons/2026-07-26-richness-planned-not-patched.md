# Richness must be planned in the build sheet, not patched into the mesh

**What we did.** After five rejected build rounds on the Fornax torso (owner: "where is
the richness"; independent critic: **1.9/5 FAIL** vs the Thunderhead Tempest bar), we
rewrote `reforged/FIRE-WYVERN-BUILDSHEET.md` so the sheet itself would have prevented all
five rounds: §2 gained a REVERSAL (the bare-spine law revoked → THE SLAG SERRATION,
0.15–0.30u blade-vanes occiput→tail-root, continuous with the tail crest), §4 was
rewritten around a Tempest-style R1–R6 rank suite with numeric relief floors, a new §4b
RICHNESS LAWS (RL1–RL7) applies to every later part, and §11 gained a render-space value
gate + structure-vs-noise warning + crop-framing assert.

**What we learned.** The root cause was not the builder — it was the sheet:

1. **A frozen law can be the defect.** The sheet's own "clean sky above the spine" law
   forced a crocodile lozenge; the builder honoured it for five rounds. When a build
   keeps failing the same way, audit the LAWS it obeys before the code that obeys them.
2. **Relief is bought in world units and judged in pixels.** At ~21px/u chase scale,
   0.008–0.016u standoffs are sub-pixel decals. Tempest's floors: vanes ~0.37u, plate
   standoff 0.055+cup, deck lift 0.05. Anything under 0.02u: delete, never tune.
3. **Every raised form owes a paired dark recess** (perimeter walls, under-gaps, gutter
   walls) or it reads as a camo patch.
4. **Value by structural role, never by index.** `i % n` material picks at 0.05–0.2u
   element size ARE military camouflage. Bright tier = continuous strokes (rails, leading
   edges), never confetti.
5. **Pale low-roughness albedo is legal light** under a withheld-emission law (Tempest
   `silverRim`): value extremes before the glow increment, no emissive.

**The gotcha.** The v1 target "endpoints spread ≥0.05 luminance" was satisfied in
MATERIAL space (0.133) while the creature rendered at median 14/255. And the metric
can't tell spread-as-structure from spread-as-noise — five rounds of probes passed while
the owner gagged. Value targets must be RENDER-space percentiles on a part-isolated mask
of an actual capture (Fornax gate: median ≥28/255, p10–p90 ≥45/255, `tools/valuegate.mjs`
to be built), and the number is necessary, never sufficient — pair it with a role-map
check and a critic judging organisation. Also: crop cameras must assert non-empty content
(two of six panels were black rectangles framing a stub — the owner was shown nothing and
nothing failed).

**The reusable pattern.** When a part fails a richness gate: (a) measure the relief gap
against the roster's premium bar in world units, (b) write the floors INTO the build
sheet as laws with numbers, (c) generalise them into a section later parts inherit,
(d) convert every judged target into the space it is actually judged in (render, not
material), (e) record any law you had to kill as an explicit REVERSAL with reasoning.

**What it unlocks.** I2's wing and I3's head/tail start from §4b instead of rediscovering
these laws; the torso rebuild has checkable floors and a gate that can actually fail;
future dragons get the "audit the frozen laws first" move for cheap.
