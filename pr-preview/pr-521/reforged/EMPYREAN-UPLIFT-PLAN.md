# THE EMPYREAN — UPLIFT PLAN (5.8 → ≥8.5/10)

**Trigger.** Owner playtest ("could do with more things… pretty lifeless") + an independent harsh
art-director audit of an 11-frame burst (7 desktop views incl. a live 3-frame motion burst, 2 portrait
phone frames; obstacles/hazards/boss off): **5.8/10**. Sub-scores: identity/composition 7.5, color/value
6.0, **life/motion 4.0 ("embalmed, not serene")**, density/variety 4.5, mobile readability 7.0. Verdict:
"a strong single image shipped as a biome… in motion the world is a diorama."

**Goal.** ≥8.5/10 from the SAME independent-critic protocol (fresh critic, same burst rig
`tools/_empyburst.mjs`, no anchoring). The critic's ranked gaps sum to +4.4; this plan executes the top
six fully and folds 7–8 into them, discounting for overlap → expected landing 8.5–9.0.

**Laws that bind every increment** (from EMPYREAN-BIBLE/PROP-REFERENCE + ledger lessons — the audit
found no theology violations, and the uplift must not introduce one):
1. No sun/shadow/specular; no warmth, no green; pastel S≤0.30. **Motion must come from drift/hue/dark
   accents, never from brightness spikes or glints** (ACES-on-bright-field: you cannot win on
   saturation/brightness — win on hue separation + contrast-from-below).
2. **The Mote owns true black.** All new dark accents (koi, ink-motes, the mirror smudge) stay clearly
   above its floor; the court-level dark budget is audited per frame, not per element.
3. Default-0 gates on every change (`empyMix`/`shoalMix` pattern): every other biome byte-identical,
   full guard suite green per commit (gold-determinism, biomecycle, skyprobe, appshell, bulletcontrast,
   envcount, tricount, propclearance).
4. **The portrait-azimuth law** (2026-07-19 lesson): the FOV spec is vertical — anything that must be
   seen on a phone lives within ~±13° azimuth; separate stacked elements by ELEVATION. Every gate
   includes the portrait frame.
5. Budgets: ≤150 tris/prop instance, ≤2 material groups, instanced/merged geometry, point sprites for
   motes; 60fps on weak mobile (tier gates on per-frame matrix writers).
6. Seeded-deterministic placement for anything course-coupled (props); ambient-pool randomness is fine.
7. Sub-pixel shader bands don't render — size rims/hairlines in PIXELS (≥1.5–2px at 85°).

---

## The increments (one PR each, Fable-gated ≥4.2 on desktop + portrait burst frames)

### PR-A — THE LIFE PASS (critic gap 1 + 7, +~1.0, the owner's pain)
The biome owns almost no motion: the live burst shows only one koi school + pickups moving. Root cause
found in the burst diagnosis: the rising pearl-motes are **invisible pale-on-pale** — the Empyrean's
brightness eats its particle life; the ink-koi proved the recipe (dark drift marks read, pale motes
don't).
- **Mote star-drift + breathing halo:** slow time-drift/twinkle of the starfield INSIDE the disc
  (sky-shader term, environment.js); the occultation halo breathes a few % on a long period. No new
  brightness; the one dark object becomes visibly *alive* — the finale's heartbeat.
- **Two more ink-koi schools** (reuse the instanced kit + portrait law): a FAR high school (smaller,
  slower — depth cue) and a NEAR-LOW school crossing over the water off-lane (fills the phone's dead
  bottom third, gap 7). Different periods/anchors so at any moment ≥1 school is in the portrait window.
  Elevation-separated from each other and the Mote band.
- **Ink-drop lumen-motes:** a sparse dedicated layer (~40–60 point sprites) of LARGER, slightly
  ink-violet rising motes with per-mote sine bob — visible against the bright field (the ink recipe),
  clearly above the Mote's dark floor. A few large slow ones cross LOW near the camera (gap 7).
- **Nacre vein scroll:** slow uv-scroll on the water's vein/iridescence term (hue movement, not
  brightness) so the floor breathes.
- Gate check: live-burst A/B — the critic's "what moves?" question must list ≥5 biome-owned movers.

### PR-B — THE RING COURT (gap 2, +~0.8)
One prop family = interchangeable early/mid/late. Add the two missing silhouette families **with a
Fable-audited mini-reference written FIRST** (the unspecced "haloarc" was dropped in PR-5 precisely
because building without a reference is the slop risk; the audit has now effectively specced the need):
- **Broken ring-arch segments** ("halo shards"): pale bone-nacre arc fragments — some lane-spanning,
  some stumps; lens cross-section, rose only on the fracture lips, bedded, ≤150 tris/instance.
- **Shard-cluster shrines:** low tiered crystalline clusters off-lane (the vertical counterpart of the
  pearlshoal's horizontal rest note).
- **Distance-staged identity:** seeded density weighting by lane band — arch fragments EARLY, stone
  courts MID (existing), dense shard field + ONE full ring gate LATE on the Mote approach. Early/mid/
  late must silhouette-differ at a glance (the critic's interchangeability test).

### PR-C — THE GODHEAD GATE (gap 4 + the standing boss-coupling debt, +~0.6)
The landmark is undersold and the white gate beneath it is "illegible mush" — which is THE UNMASKED's
pre-existing structure, already flagged in the backlog as warm-brown at some pitches (theology clash).
Fold both into one PR:
- Thin bright **eclipse-rim arc** on the disc edge (px-sized per law 7) + a wider soft halo gradient —
  contrast-from-below, already the Mote's proven mechanism.
- **Rebuild the gate** beneath the disc: legible pearl-palette structure at 2–3× present read,
  recoloured from warm-brown to bone-nacre/rose (kills the boss↔biome clash). Gated to biome 5 visuals
  only; boss behaviour untouched.

### PR-D — THE NACRE MIRROR (gap 3 + 8, +~0.6)
The water reads as gradient, not water — but specular glints are theology-illegal. The inversion-safe
substitutes:
- **The Mote's dark mirror-smudge** on the centerline (water term keyed to moteMix/uMoteGrow): a soft
  vertical blur-reflection of the one dark object — deepens the inversion instead of breaking it. Dark
  budget: capped well above true black (~L50 floor), it is the Mote's own budget, not a new dark.
- **Iridescence shimmer drift:** animate the existing rose↔lilac interference bands' phase (hue motion,
  zero brightness spikes).
- **Tighten prop reflections** (gap 8): slab-shaped soft silhouettes under the stones instead of blob
  smears.

### PR-E — STONES OF LIGHT (gap 5, +~0.5)
The slabs are the one matte-concrete material in a biome about light:
- Extend the `_bakeRamp` ladder with a **hue ramp** (violet base-shadow → pearl body → rose-warm-but-
  legal crown drift ≤S0.30) and a subtle bright CORE-EDGE line on the lens rim (≥1.5px) — richness via
  hue, not brightness (law 1). Keep the gated value-ladder carry (crown-light → base-dip) that already
  passed; this adds hue variety on top.
- **Tip variety:** per-instance cap profiles (canted cut / crystalline twin-facet / sheared stump) and
  tip hue drifting rose↔violet instead of one identical salmon cap. Stay inside the apex-spike law
  (~13° slant, de-jittered top ring).

### PR-F — RIBBON SKY (gap 6, +~0.4)
The nebula blooms render as hard-edged static triangles ("lerp artifacts, not light"):
- Soften bloom falloffs (gaussian edges) and reshape into 2–3 **curved ribbons** with a very slow
  undulation term; keep the two-bloom hue separation (rose ~318° + blue-violet ~253°, ≥25° apart) that
  beat ACES. Slightly lift zenith star presence (R7 field) for upper-dome interest.

---

## Sequencing, verification, exit

- **Order: A → B → C → D → E → F.** A first (biggest lift + owner's pain). B second (density is the
  next-largest and unlocks staged framing for everything after). C before D so the mirror (D) reflects
  the upgraded landmark. E/F are polish multipliers.
- **Per PR:** measure locally first (`_empyregate.mjs` for sky/Mote/water numbers; `_empyburst.mjs`
  re-shoot incl. portrait + live burst) → converge → Fable-model gate ≥4.2 (exclusion masks, real FOV
  stated) → full guard suite → merge. One lesson file per PR (THE RULE).
- **Score checkpoints:** after PR-B and PR-D, a fresh independent critic re-runs the FULL holistic
  burst protocol (same prompt shape as the 5.8 audit, no anchoring). Expected trajectory ≈ 6.8–7.2
  after A+B, ≈ 8.0–8.5 after C+D.
- **Exit gate:** after PR-F (or earlier if a checkpoint clears it), a fresh independent critic scores
  the biome **≥8.5/10** on the full burst. If a checkpoint stalls (<+0.5 from projection), stop and
  re-audit the plan instead of pushing forward.

## Risk register
- **ACES washout:** any "brighter" idea fails; every increment above moves hue/dark/drift, not
  brightness. Measure with `_empyregate` HSV sampling before gating.
- **Dark-budget creep:** koi ×3 schools + ink-motes + mirror-smudge all add darks — audit the summed
  dark mass per frame (the Mote must stay the darkest AND the largest dark); tune counts down first.
- **Determinism:** prop staging (PR-B) must ride the seeded placement path; run gold-determinism +
  biomecycle every commit.
- **Perf:** new movers are instanced/point-sprite only; tier-gate every per-frame matrix writer;
  envcount budgets green; verify tier-2 degraded frames still read.
- **Boss coupling (PR-C):** visual-only recolour/enlarge behind biome-5 gates; boss logic untouched;
  bossboot/boss tests green.
