# Drowned Forum PR-6 — the `pharos` leaning lighthouse: the SHEAR-not-offset lean, breath-gated punctuation, and the vertical-note register (Fable 3.4 → 4.3 PASS)

**What we did.** Built PR-6's LEAD landmark — a rare LEANING LIGHTHOUSE standing in the open-mirror BREATHS
where the wall rhythm breaks. It's the biome's ONE vertical exclamation (the composition was three HORIZONTAL
registers — rail / trees / walls — every skyline a level cornice; nothing vertical anywhere). Fable chose it as
the lead ("never debug two new systems in one prop": the pharos has exactly ONE unknown — the punctuation
placement — on all-proven technique and ZERO new bake). One revise round: 3.4 → 4.3.

**THE LEAN LAW — a step-offset tilts the CENTROID; only a SHEAR tilts the EDGES (and the eye reads edges).**
My round-1 lean was accumulated tier x-offsets (each tier stepped inboard). The centroid math was honest
(offset/H ≈ 0.13 ≈ 7.4°) but it FAILED the gate as a "plumb chimney in disguise": every tier is still an
axis-aligned box, so every silhouette EDGE stays 90.0° vertical — the eye reads a staggered ziggurat, not a
lean. Pisa reads leaning because its EDGES tilt. The fix is the repo's `skewX(geo, k)` (`x += k·(y−yRef)`,
comment at env ~380): build the tiers CENTRED, then shear the whole merged geometry so every windward edge
tilts into ONE continuous diagonal (parallelogram faces). **Taper (setback insets) and lean (shear) are then
ORTHOGONAL — it tapers like a Pharos AND leans like Pisa, neither reading as the other.** Under the `(r,h,r)`
instance scale the world lean = `r·k/h` (a skew is affine → survives the non-uniform scale; rx/rz rotations do
NOT — the flatten law). With r=0.5h coupled, k=0.26 → world 0.13 → ~7.4°. This is THE transferable fix for
"axis-aligned silhouette = Minecraft" on any leaning/wind-carved vertical.

**PUNCTUATION = the breathGate: a landmark reads because a wall rhythm BREAKS for it.** New engine flag
`breathGate: 0.05` in the `bi===0` branch: the landmark survives ONLY where `lagoonComp(dist) < breathGate`
(the ph≈0.52–0.84 deep-breath trough where the wall floor thins to near-empty), then a duty hash
(`heroHash(bIdx*13+7) >= 0.6` → park) keeps it 1–2 per ~1500m (a lighthouse every breath is a metronome).
Reused `flankAlt:'wall'` so it stands on the flank where the NEXT congregation's wall will rise (breath ph>0.5
rounds peakIdx up → the exact hash the basilica evaluates — free narrative consistency). NO comp block: a
landmark renders full-size-or-absent, never the comp scale lottery (the Frozen hero law). Pure/render-only →
gold-determinism byte-identical. The three rejected readings (a gap on a wall-bearing stretch — no per-gap seam
on an 80m single-instance wall; corridor-center — that belongs to the gate + sun-path by standing law) are
why the BREATH is the only correct home.

**THE REGISTER LAW: a counterweight only counts if nothing shares its register.** The pharos sits at world top
52–62 ≈ 1.5× the tallest wall (28–40) — a SOLO fourth note ABOVE the monument register. Corollary now law for
the rest of PR-6: the colossus stays UNDER the wall cornice (mass+strangeness, not height, ~14–20), the portico
in the pantheon band (~15–22). One tower over the walls; everything else under them, or the skyline goes noise.

**CAPTURE: the auto-framers cut the crown off a 55m prop — write a full-tower tool.** `_forumclose`/`_forumfar`
are tuned for 15–40-wide props; they framed only the pharos's lower tiers. `tools/_pharos.mjs` frames the WHOLE
height pulled back + a front-¾ that shows the cross-lane lean + an IN-CONTEXT view at lane altitude ~250m (the
in-game read Fable demanded — a rare breath-gated prop won't appear at a fixed flythrough distance). The lean
must be CROSS-LANE (inboard toward the sun-path), never down-lane: a down-lane lean is edge-on to the player and
invisible (the FLAP depth-projection trap, applied to a tower).

**THE DISTANT LIGHT.** A dark open fire-chamber loggia (4 corner piers + pyramid cap) holding ONE recessed gilt
ember (mat 1), read only THROUGH the pier voids — the withheld-glow law (gilt count ≤4/13). Round-1 the ember
was a fat flat quad = a "yellow sticker"; shrinking it (hw 0.13→0.09) + taller made it a lantern FLAME between
the piers. It now reads as a warm point at 250m, but backlit-by-sun in the breath the fog eats its saturation —
the parked polish (fog-exempt/emissive-boost past ~150m) is what upgrades "a pale pixel" into "the one distant
light." `forumdark` bake gives the whole tower repoussoir value + apricot-lit setback ledges for free.

**SHIP-SHEET DEBT LOGGED.** The build sheet §5 claims PR-1 landed `verdigrisBronze` into the material kit — it
did NOT (grep clean). The colossus (PR-6 #2) must add it — a normal-keyed exposure bake (rain-washed up-faces →
teal patina, pre-darkened ~15% for forumStone's ×0.28 emissive fold; sheltered → dark bronze; raised edges +
gilt crevices GEOMETRIC via part tags, since per-vertex bakes have no curvature). Do not assume it exists.

**What it unlocks.** The skewX-lean fix, the breathGate punctuation mechanism, and the register law are reusable
for the rest of PR-6 (colossus next — arcade flank, |x|46–58, congregation-side, under the cornice; portico last,
on sameness probation) + PR-7 (arena). PASS 4.3. **Non-gating polish PARKED (Fable, priority order):** fog-exempt
the ember (highest value); ember core→bloom structure; twin-variety hash on the broken-pier index (two instances
broke the same corner in one frame); break the base-tier mosaic arc's symmetry (it pareidolias into a smile at
studio range).

**Verify:** `HERO=pharos node tools/_pharos.mjs` (full tower + ¾ + in-context 250m); envcount 118 tris +
FOAM_CFG; gold-determinism byte-identical, biomecycle 12/0.
