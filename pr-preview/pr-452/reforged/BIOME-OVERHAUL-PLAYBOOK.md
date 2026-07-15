# BIOME-OVERHAUL-PLAYBOOK.md — how to bring an entire biome to premium

**Audience: a fresh session tasked with a full BIOME OVERHAUL** — one biome's SIDE PROPS
and everything that spawns in it (decorative masses, in-lane hazards, materials,
atmosphere, ambient content) brought to the same premium bar Frozen Reach now holds.
This doc distills HOW Frozen was actually done (July 2026, ~12 ledger lessons + two full
redirects) into a reusable, biome-agnostic pipeline, and then applies it to the
recommended next biome (Emberfall Caldera) as a worked example.

**What this doc is NOT:** a license to copy Frozen. Part B is the owner's hard
requirement — read it twice. What transfers between biomes is the METHOD, the PIPELINE,
and the TECHNIQUES. Never the geometry, never the palette, never the hazard forms.

Read-first stack (in order, before any code):

1. [`BIOME-DESIGN.md`](./BIOME-DESIGN.md) — the identity system (hazard + verb + anchor
   per biome), the engine facts (§2), the design laws (§3), determinism contracts.
2. [`GRAPHICS-OVERHAUL.md`](./GRAPHICS-OVERHAUL.md) — the Fable Quality-Gate protocol
   (Gates 0–3) and the Gate Log.
3. The Frozen lesson arc in `leapfrog/lessons/` (the ground truth this doc compresses):
   `2026-07-14-graphics-frozen-reach-ossuary-a1`, `…-frozen-sunset-glacier-redirect`,
   `…-sunset-glacier-massive-first-forms`, `…-natural-ice-vs-manmade-and-closeup-renders`,
   `…-obstacle-studio`, `…-frozen-bar-calved-shelf`, `…-frozen-pillar-serac-spur`,
   `…-frozen-shard-berg-chunk`, `…-hazards-selflit-ladder-context`,
   `2026-07-15-restamp-sw-so-changes-ship`.
4. `js/environment.js` (ARCHETYPES, `makeMats`/`addPropDetail`, `mergeParts`,
   `crevasseCore`, FOAM_CFG, `place()`/`writeMatrix`), `js/obstacles.js`
   (`OBSTACLE_SKINS`/`hazardMesh`/`bakeIceLadder`/`buildObstacleMesh`), `js/hazards.js`
   (the biome-hazard runtime), `js/biomes.js` (the biome's atmosphere entry).

---

# PART A — THE REUSABLE METHOD (biome-agnostic)

## A1. The end-to-end pipeline

Frozen's final shape came from this loop. Run it per element-family (props → in-lane
hazards → atmosphere → setpiece dressing), one PR each, coexist-flagged.

### Stage 0 — Look at what's actually there (render FIRST, design second)

- **Confirm the target in code before designing.** Owner language is fuzzy ("crystal
  wall" lived in three plausible places). Grep, read the actual build recipe, and state
  which geometry you're replacing. The build recipe disambiguates.
- **Render the current state and LOOK.** This environment has Chromium + Playwright and
  can render the live WebGL game headlessly (`tests/browser.mjs boot()`). Clone the
  `tools/frozenshot.mjs` pattern (boot `?biome=N&debug`, warp `player.dist`, screenshot
  at several distances) AND the `tools/frozenclose.mjs` pattern (warp, then let the sim
  RUN at timeScale 1 and burst-capture ~8 frames over ~3s). **The close, moving,
  in-gameplay framing is the truth** — a static distant frame lies about scale and
  detail, and the player's real experience is flying THROUGH the props.
- Feed the PNGs to the critic. Fable can Read images and will MEASURE (on-screen aspect
  ratios, silhouette families, value vs sky) — that beats any code review.

### Stage 1 — Fable art direction → the biome bible

Spawn a **high-effort Fable art director** with: the renders, the biome's identity
triple from BIOME-DESIGN §4 (hazard + verb + anchor boss), the owner's emotion target,
and Part B of this doc. It must deliver:

- **One generating theology sentence** that every element derives from. Frozen's was
  "cool light lives IN the ice; warm light only ever comes FROM the sun" — one sentence
  generated the material, the accents, the fog, the water, and the hero landmark. A
  biome without a theology sentence produces disconnected props.
- **The emotion.** Frozen's first concept (a bone ossuary) passed every headless gate
  and a Fable checkpoint, then died on the owner's preview: it aimed at morbid unease
  when the owner wanted AWE. Name the target emotion explicitly and check every element
  against it. Awe grammar = a FEW colossal, intact, luminous forms with negative space
  — never a rubble field of mid-size "clusters with a story" (that's mid-frequency
  noise with no focal hero).
- **The full prop roster on paper** (≥4 outline families, one hero, one foil, one
  massif — see A3), each with mass class, accent policy, and step rarity.
- **Opposition against its Law-4 twin** and against every OTHER premium biome: name the
  axis on which this biome is the opposite (Frozen vs Aurora: sunset/night, prop-hero/
  sky-hero, luminous/dark). If you can't state the inversion, the design isn't distinct
  yet.
- Write the result as a short biome bible (`reforged/<BIOME>-BIBLE.md`,
  `SUNSET-GLACIER-BIBLE.md` is the precedent) so mid-arc sessions don't re-derive it.

For big multi-target asks, the proven multi-Fable structure: art director (vision) →
same agent resumed via SendMessage for follow-up targets (keeps loaded context) →
synthesizer (assembles vision + engine facts into a build-ready spec, verifying every
cited seam against real code) → perf pass filling a pre-placed placeholder section.
Stage outputs as durable scratchpad files, not just chat context.

### Stage 2 — Studio contact sheet (per element, BEFORE wiring in)

Every prop/hazard gets judged in isolation before it ships. The pattern
(`tools/propstudio.{html,mjs}` for side props, `tools/obstaclestudio.{html,mjs}` for
in-lane hazards — clone one for the new biome):

- An **inert studio export** from the real module (`buildArchetypeMesh` /
  `buildObstacleMesh`) so **what Fable grades is what ships** — same geometry, same
  materials, at a representative in-game `(r,h,r)` instance scale. Studio-only exports,
  never imported by the running game (zero shipped-pixel change).
- Renders each element ISOLATED on a neutral stage through the game's real ACES
  pipeline, under **two rigs**: the biome's shipping key light (for Frozen that meant a
  raking low sun) + a flat neutral rig. Multi-angle: context ¾ + silhouette + **plan
  view** (a flying game's primary read is from above) + head-on.
- Every frame a pure function of (key, opts, angle, bg, rig) — no clock, no seed churn
  — so rounds are pixel-comparable.
- For hazards: render the **collision-envelope ghost** in the sheet (`opts.hitbox`) so
  fairness is provable at a glance (see A4).
- **Fable checkpoint per element, hard floor 4.2/5.** Below 4.2 = iterate with the
  critic's specific deltas, re-render the same sheet, re-score. Frozen's hazards ran
  3.9 → 4.4, 2.0 → 4.3, 2.6 → 4.3 through this loop; the studio catches "machined
  rocket", "pancake", "fused dice" for pennies, before any game wiring.

### Stage 3 — Build, behind a coexistence flag

- New archetypes register in `ARCHETYPES` with `biomes:[n]`, `build()`, `place()`,
  ≤2 materials (the `mergeParts` hard cap — a part with `mat >= 2` THROWS at build).
- **The whitelist FLIP is the coexistence mechanism, and its polarity matters:**
  default = new kit holds `[n]`, legacy roster PARKED at `[]`; `?props=v1` swaps the
  two rosters' whitelists at module init (the shipped `frozenNew`/`frozenOld` idiom in
  `environment.js`). **Never both rosters holding the biome** — that doubles density
  and reds the envcount cap. envcount's shim forces `location.search=''`, so CI always
  audits the default (new) roster.
- Every new archetype gets a `FOAM_CFG` entry — a `{r}` waterline collar (the weld
  between silhouette and reflection) or explicit `false` for fog-line massifs (a foam
  ring 30+ off-lane is a bright artifact). Update the `props` mirror in the biome's
  `biomes.js` entry alongside.
- Prime `step` values, mutually coprime across the biome's roster (anti-tiling).

### Stage 4 — In-context render (the stage that catches what the studio can't)

**The studio lies by up to a full point.** Frozen's hazards scored 4.3–4.4 in the
studio and 3.0–3.4 in-game, because the studio sky was bright and even while the biome
ships BACKLIT. The standing rule: **no score counts until it's captured in the shipping
light, in-lane, moving** — clone `tools/hazshot.mjs` (flies the showcase in-biome and
bursts frames as the dragon passes each element) and the `frozenclose` flythrough.
Judge: silhouettes hold against the biome's brightest sky region; the value ladder
still reads on camera-facing faces; magenta danger wins; the dragon roster pops
(BIOME-DESIGN Law 8).

### Stage 5 — Harsh Fable checkpoint (the gate)

The overhaul runs under the GRAPHICS-OVERHAUL **Fable Quality-Gate protocol**: Gate 1
pre-build (it catches inverted coexistence flags and missing placement mechanics before
a line of geometry — it did exactly that on Frozen A1), Gate 2 pre-merge with the
in-context captures (verdict SHIP/REVISE/RETHINK; merge only on SHIP), per-element
floor **4.2/5** on the contact sheets. Sub-floor scores get specific actionable deltas,
not vibes. Record verdicts in the PR body + the Gate Log.

### Stage 6 — Headless verification (necessary, NOT sufficient)

From `reforged/`, every PR:

- `node tools/envcount.mjs --ci` — per-archetype tris ≤150, per-biome ≤550 inst /
  ≤50k band-tris, adjacent-pair ≤90k, **side-prop additive/transparent surfaces = 0**,
  FOAM_CFG completeness.
- A **runtime `createEnvironment` NaN scan of every instanceMatrix** — envcount only
  calls `build()`, never `place()`; a `place()` that omits `tilt` produces NaN
  quaternions that corrupt the whole band and NO headless geometry tool catches it.
  Exercise the `place()`+`writeMatrix` path explicitly.
- `node tests/gold-determinism.mjs` — byte-identical (props are render-only; hazards
  ride their own RNG stream — see A4).
- `node tests/bulletcontrast.mjs` — on EVERY palette/fog/grade change.
- `node tools/tricount.mjs --ci`, `node tests/biomecycle.mjs`, the full suite.
- Hazard reskins: the numeric collider-coverage tests in `tests/hazardskin.mjs` (A4).

**Headless green ≠ good.** Every one of these was green while the ossuary looked bad.
The harness proves it builds; only eyes (Stage 4 + the owner) prove it's beautiful.

### Stage 7 — Ship: SW re-stamp, then stage the preview

- **`node tools/stamp-sw.mjs` as the LAST step before telling the owner to fly-test**,
  then commit + push `sw.js` + `buildId.js`. The service worker is cache-first within a
  content-hashed VERSION; without the re-stamp the owner's browser replays the old
  build forever. Not automatic on push. This has bitten twice.
- Stage the preview WITH the biome pin (`?biome=N&debug`) and a "what to look at" list:
  the stretch to fly, the seam to cross, the hazard to dodge, the twin biome to compare.
  The owner judges motion/feel/awe on the preview — the owner is the arbiter, and the
  owner has overturned a Fable-passed build before. Budget for one redirect.

### Stage 8 — One lesson file per change

`leapfrog/lessons/<YYYY-MM-DD>-<slug>.md` per meaningful PR (THE RULE). Graphics-track
work uses a `graphics-` slug. What/why/gotcha/reusable pattern/what it unlocks.

## A2. The MATERIAL ARCHITECTURE as a technique

These are TECHNIQUES. Each new biome applies them **with its own palette, derived from
its own theology sentence** — never another biome's hues (Part B).

1. **The shared prop materials** (`makeMats` in `environment.js`): exactly one
   `primary` + one `accent` `MeshStandardMaterial` per biome index, `flatShading:true`,
   both run through `addPropDetail`. `mergeParts` merges every archetype to ≤2 material
   groups. The primary is the biome's MASS; the accent is its withheld LIGHT.
2. **Self-lit weathering** (`addPropDetail`): world-position value noise multiplies
   diffuse (×0.86–1.12, floored at 0.62 with the baked-AO term so hemi-only-lit faces
   never crush to black spots) AND modulates emissive (×0.78–1.22). Free surface
   richness on every prop, no textures. New biome materials get this automatically —
   don't reimplement it, just route through `makeMats`.
3. **The value-ladder technique** (generalized from `bakeIceLadder` in `obstacles.js`):
   bake a **3-stop vertex-color ladder from each face's GEOMETRIC normal** onto the
   merged flat-shaded geometry — a LIGHT stop, a MID stop, a DEEP stop. One flat band
   of color becomes carved, lit mass at zero triangle cost. Generalize per biome by
   asking: **where does this biome's light come from, and what does its material
   history look like?** Frozen keyed frost/ice/shadow off world-up (sun logic); a biome
   lit from BELOW inverts the axis; a TUMBLING body must key off a fixed per-chunk
   *weathering axis* instead of world-up (orientation-invariant "material history" —
   rind / fresh fracture / deep seam) or the bake flickers as it spins. Nudge the MID
   stop's hue OFF the biome's sky so silhouettes always separate.
4. **The self-lit legibility floor** (the backlight survival trick): vertex colors only
   modulate the diffuse term, so a ladder DIES against a bright backlight (faces
   collapse to near-black emissive). Fold the ladder into emissive too — one
   `onBeforeCompile` line: `totalEmissiveRadiance *= vColor.rgb;` — and set the
   material's emissive to a bright ladder-neutral base at intensity ~0.35–0.5. Now the
   ladder reads with zero scene light. **Exempt warning/telegraph materials** (their
   pulse must stay hot and unmodulated). Counter-intuitively, raising the body's
   emissive floor LOWERS the LED-strip risk on accents (it's a contrast-ratio failure).
5. **Fake transmission that survives backlight**: the primary material's emissive IS
   the "lit from within" read (Frozen: luminous ice; the technique: emissive in the
   biome's *internal-light* hue at 0.2–0.45 intensity, mottled by the weathering
   noise). It scales with mass — a colossal wall's shadow side becomes a huge soft
   field of internal light, the money shot.
6. **Per-facet flat-shaded sun-glint**: `flatShading` + LOW roughness (0.22–0.32) on
   the primary + a different `ry` on every stacked stratum so facet corners never
   align → serrated silhouettes and shuffled specular glints for free. Faceted
   `IcosahedronGeometry(r,0)` gives 20 free glint facets (mind the indexed/non-indexed
   merge trap — `.toNonIndexed()` or the whole boot crashes).
7. **Withheld, socketed accent glow — one glow "address" per biome.** The accent NEVER
   sits flat on a face (the LED-strip / sticker tell — kill on sight). It sits
   geometrically de-lamped: recessed in a cleft between two primary-material walls,
   under a proud brow, sunken in a throat, escaping through a gap — "light escaping
   from INSIDE the mass" (`crevasseCore` is the Frozen-shaped instance of this;
   generalize the *recess grammar*, not the crack shape). Each biome fixes ONE address
   (Sanctuary through apertures, Caldera LOW in cracks, Mire high under brims, Astral
   inside the wound…) and Law-4 twins OPPOSE on it. Ration it: most archetypes carry
   NO accent; one foil archetype must be entirely bare so the lit ones feel earned.
8. **Value discipline vs the biome's own sky**: check prop value against the biome's
   fog/sky at cruise distance — prop-grey ≈ fog-peach in value was one of the ossuary's
   four killers. `hemiGround` in the biome's `light` block is the fix for black
   undersides (bounce light from the biome's floor).

## A3. THE PROP DESIGN LAWS (distilled from the Frozen arc + BIOME-DESIGN)

1. **MASSIVE-FIRST / breadth, not height.** Scale reads through BREADTH: ≥80% of
   instances must have world width ≥ height; nothing tall without a broad base
   occupying ≥50% of its width; a true spire is ONE archetype at the largest `step`
   (punctuation, not vocabulary). Real geology: shelf-fronts 5–20:1 wide, blocks ~1:1,
   terraces 2–4:1; needles are rare freaks — that's why they're landmarks.
2. **≥4 UNRELATED outline families** (the anti-picket rule): no two archetypes share a
   silhouette family. A typical premium roster: one colossal hero, one mid mass, one
   low/horizontal rest, one bare FOIL (no glow — makes the accents earned), one distant
   MASSIF on the far fog (backdrop class, `foam:false`, mass baked into the upper
   y-band if it must float — "elevated" is a GEOMETRY concern, never placement; there
   is no per-instance altitude), plus at most one paired/hero landmark.
3. **Broken silhouettes; no coursing, no man-made read.** Smooth + regular + sharply
   tapering = architecture. Irregular + jagged + broken + chunky = natural. The crown
   profile is where "natural vs built" is decided: asymmetric multi-jag broken tops at
   opposing tilts, never a centered point. Break coursing: varied block heights,
   alternating lateral offsets (zig-zag), irregular yaws so plan-view symmetry dies,
   one oversized overhanging capstone. No radial symmetry, no aligned seams, no neat
   right-angle rebates.
4. **Character lives in the SILHOUETTE via offset-stacking, never internal rotation.**
   The `(r,h,r)` instance scale SHEARS internal tilts flat — build every lean/bow/curve
   by offset-stacking segments. `rotY` re-randomizes on recycle → design
   rotation-robust (spread features radially in x AND z).
5. **Cheap is geometry, not palette.** A single cone is a traffic cone; a box is a
   crate. Every archetype is a 5–9-part cluster with a story, 40–150 tris (free at our
   scales). Parts must interpenetrate ≥25% — nothing floats, nothing perches.
6. **Restraint is the awe multiplier.** Frozen dropped from 496 instances/46.5k tris
   (ossuary clutter) to 208/15.8k (Sunset Glacier) and got BETTER. Fewer, bigger,
   with negative space.
7. **`place()` / lane-clearance discipline** (the fairness law): inner edge
   `x − ρ·r·sMax` must clear the ±13 fatal lane AND the ±16 gate veil. Compute each
   archetype's plan-radius ratio ρ from its geometry; class floors: LOW ≈14.5 (top ≤7
   may hug the route), MID ≈15.5, TALL ≈17.5 **plus an inward-tilt cap so the top never
   leans over ±16** (`tilt ≤ 1/h`), BACKDROP ≥26 with x coupled to r. Draw r FIRST,
   then couple x to it. **`place()` MUST return `tilt` explicitly** (`tilt: 0`, never
   omitted) — a missing tilt is a NaN quaternion that corrupts the band and no headless
   geometry tool sees it.
8. **Tri budget + merge truths**: ≤150 tris per archetype (envcount-enforced);
   `ConeGeometry(r,h,n)` = **3n** tris (not 2n), `Cylinder` = 4n, `Icosahedron(_,0)` =
   20, `Box` = 12. Mixed indexed/non-indexed parts must `.toNonIndexed()` before
   `mergeGeometries` or boot throws for EVERY biome. Zero transparent/additive surfaces
   in side props — overdraw is the only perf cliff; opaque props are perf-free by
   construction under the band visible-gate.

## A4. HAZARD DESIGN — each biome invents its own

There are two hazard layers, and BOTH are biome-owned:

**(a) The biome's signature hazard** (`js/hazards.js` + the `hazard` block in
`biomes.js`) — this is the identity-triple hazard from BIOME-DESIGN §4: the lethal
thing NATIVE to this biome, the anchor boss's weapon, answered by the biome's VERB.
It is **invented fresh from the biome's own identity** — its geology, its weather, its
boss. Design inputs: the verb ("what does the player DO about it"), the telegraph
(magenta, role-locked `0xff2b6a`, readable ≥90m out at max approach speed), the rhythm
(phase-offset per site so they never fire in lockstep). Plumbing is the proven
RNG-safe overlay pattern (BIOME-DESIGN §5.3): own XOR'd `mulberry32` stream, own
output array, consumption below the `inBoss`/grace returns, cursor reset in
`resume()`, `gold-determinism` byte-identical. Dodge-only until the owner unlocks
kinematic verbs. FX: slim opaque core + rim particles, never an enclosing additive
shell.

**(b) The in-lane obstacles** (`js/obstacles.js` — the three collider archetypes:
full-lane horizontal beam, vertical column, tumbling body). The COLLIDERS are engine
facts and stay byte-identical; the SKIN is 100% biome fiction. A premium biome reskins
all three via `OBSTACLE_SKINS[bi]` + the `hazardMesh(type, bi, opts)` seam (skin when
present, byte-identical primitive fallback otherwise — so ungraded biomes are provably
unchanged). **The skin answers: "what, in THIS biome's world, is a beam / a column / a
tumbling mass?"** Frozen answered with calved-ice forms; another biome must answer
from its OWN geology — never by recoloring another biome's answer (Part B).

Fairness invariants (each one has bitten; all are enforced in `tests/hazardskin.mjs`):

- **The visible silhouette contains the collider everywhere.** The beam collider has
  NO x-term — it's a full-lane wall; any visual gap = "looks passable but kills".
  Author cross-sections in DATA and export a numeric coverage function
  (`barColliderCoverage`-style: sample the collider outline at every spawn radius,
  assert containment). Shifts, rolls, yaws and non-uniform scales all eat collider
  margin — **verify coverage numerically AFTER every transform, don't trust the eye.**
- **Author in UNIT space** when r and h scale independently (widths as fractions of r,
  heights of h) so one unit-space coverage pass is scale-invariant.
- **Foot rubble / small dressing gets its own uniform (r,r,r) child scale**, never the
  tower's height stretch.
- Visual mass may extend OUTSIDE the collider (forgiving fringe) but never far below
  it in an under-gap the player will read as passable.
- **A hazard dodged sideways should be wider than tall** — lateral mass telegraphs the
  verb (owner note, banked).
- **Dynamic/moving variants: split the MATERIAL, don't swap the body** — identical
  geometry, warning-color emissive pulse on top of the biome material, so "same
  hazard, it's hot" stays legible. Keep the bounding box ~equidimensional (≤1.25:1) on
  tumbling bodies or the spin reads as a hitbox glitch.
- Kill any spin/animation the new fiction can't justify (a calved shelf can't
  barrel-roll — nor can a basalt colonnade).
- Skins score at the studio floor (4.2/5) AND in-context (Stage 4 — hazards spawn
  dead-center in the sun corridor, the worst light in the biome).

## A5. ATMOSPHERE / MATERIAL IDENTITY (the `biomes.js` retheme)

The prop kit only lands if the biome's air agrees with it. Per-biome levers, all in
the biome's `BIOMES[]` entry (the three-touch wiring rule from BIOME-DESIGN §5.1
applies to every new continuous field):

- **Palette**: `sky{top,mid,horizon,sun}`, `light{sun,sunI,hemiSky,hemiGround}` —
  `hemiGround` is the underside-rescue (bounce in the biome's floor color).
- **Dual fog**: `fog{color,near,far}` (NEAR story) + `fogFarColor` (FAR story — the
  horizon melt; mind the name trap: `fogFarColor` is a COLOR, `fogFar` a DISTANCE).
- **Height fog**: `atmos.heightK` — where does this biome's air POOL?
- **Water as subject**: `water{deep,shallow,waveAmp}` — mirror vs chop is an identity
  axis (Frozen went near-mirror to double its props; a biome may go the other way).
- **Air particles**: `ambient{color,fall,sway,size,opacity}` — direction and speed of
  drift are identity (rising embers vs still diamond dust vs sideways spume).
- **Fauna**: `fauna{color,scale,flap}` — the boss's "children" when possible.
- **Sky effects**: branchless multiply-by-zero `xMix` gates in the sky shader
  (tier-free, the cheapest premium lever).
- Every one of these changes re-runs `bulletcontrast.mjs` (Law 6) and re-checks Law 8
  (the dragon roster must pop) on renders.

## A6. THE GATE (summary — non-negotiable)

1. Fable Gate 1 pre-build, Gate 2 pre-merge (GRAPHICS-OVERHAUL protocol).
2. **Per-element harsh Fable checkpoint, hard floor 4.2/5 — scored on studio contact
   sheets AND re-scored in-context in the shipping light.** Studio-only scores don't
   count.
3. Verify before claiming: full headless suite + envcount `--ci` + NaN scan + coverage
   tests + real renders you have LOOKED at. Never claim a visual result without a PNG.
4. The owner judges feel/awe/motion on the PR preview (staged with the biome pin and a
   what-to-look-at list). The owner outranks every gate.
5. **SW re-stamp (`node tools/stamp-sw.mjs`) before every fly-test hand-off.**
6. One lesson file per change (`leapfrog/lessons/`, `graphics-` slug for this track).

---

# PART B — THE ANTI-REPLICATION MANDATE (the owner's hard requirement)

**EVERY BIOME MUST BE DISTINCT. THE OVERHAUL MUST NEVER REPLICATE FROZEN.**

Frozen Reach is the METHOD's proof, not a template. When this playbook says "do it the
way Frozen was done," it means the PIPELINE (render → art-direct → studio → gate →
in-context → ship), the TECHNIQUES (value ladder, self-lit floor, socketed glow,
massive-first, coverage tests), and the DISCIPLINE (flags, budgets, lessons). It never
means the OUTPUT. Concretely:

**What transfers:** the pipeline stages; the material TECHNIQUES of A2 applied to the
new biome's own palette; the design LAWS of A3; the fairness machinery of A4; the
gates; the tools (cloned and re-rigged per biome).

**What must NEVER transfer:**

- **Geometry/silhouettes.** No ice DNA outside Frozen/Aurora: no bergs, no seracs, no
  calved shelves, no floes, no pack-ice terraces, no glacier walls, no sun-gate pylon
  pairs re-dressed in a new color. If an archetype's `build()` would read as a Frozen
  prop with a different material, it is WRONG — delete it and derive again from the
  biome's own geology.
- **Palette.** Frozen's hues (luminous blue ice `0xbfdce6`, cyan core `0x3fc8e8`,
  rose-quartz/gold sunset fog) belong to Frozen. A new biome's ladder stops, accent
  hue, fog melt and water tint all derive from ITS theology sentence.
- **Hazard forms.** Each biome's hazards are their own creatures, invented from that
  biome's identity triple. A hazard concept that can be described as "<Frozen hazard>
  but <new material>" is banned by construction. The colliders are shared engine
  facts; the fiction is never shared.
- **The theology sentence itself.** Write a NEW one. If the new biome's sentence
  paraphrases Frozen's ("light lives in the mass, warmth comes from the sun"), you
  have designed Frozen again.

**Derivation rule:** every form in the biome answers to the biome's OWN identity —
its material (what is this world made of?), its verb (what does the player do here?),
its anchor boss (whose territory is this?), its light source (where does illumination
come from — and it must not be Frozen's low gold sun). Start from real-world reference
for the biome's OWN geology/ecology (Frozen started from tabular bergs and Khumbu
seracs; Caldera starts from columnar basalt and pahoehoe — not from bergs).

**The "Frozen-recolored" checklist** — the builder self-checks it at Stage 1 and the
Gate-2 Fable agent MUST run it explicitly on the contact sheets + in-context captures:

- [ ] Cover the colors: would any archetype's SILHOUETTE be mistaken for a Frozen
      archetype's? (Compare the contact sheets side by side.)
- [ ] Is the biome's outline-family set (A3.2) derived from ITS geology reference, not
      from {tabular wall / block pile / stepped shelf / broken horn / shelf-front}?
- [ ] Is the glow ADDRESS different from Frozen's (crevasse-cleft mid-body slivers)?
      Each biome owns its own address.
- [ ] Is the value-ladder AXIS/story its own (light source + material history), not
      frost-over-teal renamed?
- [ ] Do the hazard skins answer "what is a beam/column/tumbling mass in THIS world"
      with forms that share zero vocabulary with Frozen's answers?
- [ ] Does the atmosphere oppose its Law-4 twin on the named axis, and read as a
      different GAME in a blind screenshot test vs every shipped premium biome
      (Frozen, Aurora)? If two biomes could swap screenshots, one of them changes.
- [ ] State the biome's theology sentence and Frozen's next to each other: different
      subjects, different light sources, different verbs?

Any unchecked box = RETHINK, not REVISE. Distinctness is a ship-blocking requirement,
equal in rank to determinism and 60fps.

---

# PART C — WORKED EXAMPLE: EMBERFALL CALDERA (biome index 3)

## C1. Why Caldera is the right next biome

1. **Play order continuity.** In the current cycle players fly Frozen → Caldera
   (`CYCLE` interim order `[0,1,2,3,4,6,5]`: biome 2 hands directly into biome 3). The
   now-premium Frozen raises the bar and then the very next biome drops back to
   two 3-primitive archetypes — the contrast is the game's most visible quality cliff.
2. **The mechanics are already premium; only the visuals lag.** Caldera is
   BIOME-DESIGN's hero biome: `anchor:'ashtalon'` shipped, the geyser hazard shipped
   (`hazard:{type:'geyser'}` + `js/hazards.js`), dual-fog `fogFarColor` + `heightK`
   height-fog shipped, rising embers shipped. The overhaul is a pure LOOK arc on a
   proven substrate — lowest-risk, highest-yield.
3. **Maximal distinctness = the anti-reskin proof.** Hot vs cold, rising vs still,
   dark-mass-over-glow vs luminous-mass-over-dark, light-from-below vs
   light-from-behind. If the method produces a premium Caldera that shares NOTHING
   visible with Frozen, Part B is proven and the remaining biomes can proceed on the
   method with confidence. (It was also the planned A2 in the wall-props rollout.)

## C2. Identity (locked by BIOME-DESIGN — do not relitigate)

- **Hazard:** geyser bursts from vents — timed magenta-cored ember columns.
- **Verb:** *read the vent rhythm, weave the columns.*
- **Anchor boss:** **ASHTALON** (T2, slot 3, shipped) — the apex predator of the ember
  updrafts; its ember-wake and the biome's rising embers are ONE system.
- **Opposition axes:** vs Lumen Mire (Law-4 twin): VERTICAL / HOT / RISING where Mire
  is lateral/cool/hanging. vs Frozen: everything (C1.3).
- **Sensory signature:** rising embers, magma-seam glow, predator rumble, fire-moths.
- **Home-biome read:** ASHTALON is a charcoal silhouette with a molten slit, staged
  against a LIT ember sky — the biome must keep a glowing sky band for the boss's dark
  silhouette to cut against.

**Proposed theology sentence (Stage 1 must confirm or beat it):**
*"The world is a black crust over a living fire — every light is the fire showing
through a wound, and everything the fire touches RISES."* Light comes from BELOW and
WITHIN-THROUGH-CRACKS; mass is dark; motion is upward. (Frozen's inverse on all three.)

## C3. Current state (what you're replacing)

- **Side props:** two legacy archetypes only — `basalt` (3 primitives: two frustums +
  an accent collar, step 18) and `vent` (cone + glowing throat collar, step 42). This
  is exactly the poverty class Frozen's cones were.
- **In-lane obstacles:** the untouched primitive bar/pillar/shard tinted by
  `mats.body[3]` — `OBSTACLE_SKINS[3]` does not exist yet.
- **Materials:** `primary[3]` basalt-with-inner-heat `0x352629`/em `0x4a1208`@0.3,
  `accent[3]` magma seam `0xff5a20`/em `0xff3a08`@0.9 — usable starting hues, but flat
  (no ladder, default roughness 0.7 → no facet glints, no self-lit floor).
- **Atmosphere:** already strong (ember sky, dual fog to scorched dark, heightK 0.045,
  lava-tinted water `shallow 0xc84818` waveAmp 0.55, rising embers `fall:-2.2`,
  fire-moths). The retheme here is refinement, not rebuild.

## C4. The prop roster — fresh VOLCANIC geology, zero ice DNA

Reference doctrine (research real volcanic landforms before building, as Frozen
researched real glaciers): columnar-jointed basalt (Giant's Causeway / Svartifoss —
packed hexagonal columns, stepped colonnade terraces, fanned entablature), pahoehoe/aa
lava-flow lobes (low, wide, ropey-crusted tongues), breadcrust surfaces (dark crust
plates separated by glowing cracks), cinder/spatter cones (broad, squat, cratered),
caldera rim walls. All of it is BROAD-FIRST by nature — the massive-first law is free.

Candidate roster (~5–6 archetypes; art director refines names/mix at Stage 1; every
build obeys A3; steps prime + coprime; ≤150 tris each):

- **`colonnata`** — the MID HERO: a columnar-basalt palisade CLUSTER — a broad pack of
  hexagonal columns at stepped heights (organ-pipe top edge, but broken: varied column
  heights, a toppled column leaning on the pack, tilted fan section so no coursing
  read). Breadth 1.5–3:1. The biome's signature silhouette. Accent: NONE on most —
  this family is mostly bare mass; one variant carries a single glowing joint-crack
  low between two columns (the Caldera glow address: LOW in cracks).
- **`flowlobe`** — the LOW REST (the horizontal that makes verticals read colossal):
  a wide lava-flow tongue, 3–8:1, built from stacked crust plates with rounded lobed
  fronts; recessed ember-crack network glowing in the plate seams (top-down primary
  read: a dark tongue veined with fire). The counterpart role terrace played for
  Frozen — but a flow lobe, not a stepped shelf: lobed, ropey, front-heavy.
- **`fumarole`** — the reworked `vent`: a squat cinder cone CLUSTER (2–3 fused cones,
  breached crater rims, one sunken glowing throat per cluster — glow recessed INSIDE
  the throat, invisible from the side, a hot pool from above). Ties visually to the
  geyser hazard sites (same family the hazard vents use — the world explains the
  hazard).
- **`clinker`** — the FOIL: bare aa-rubble mound / breadcrust boulder pile, NO glow,
  desaturated warm-dark. Makes every ember accent earned; dark punctuation across the
  lava-lit water.
- **`riftwall`** — the BACKDROP MASSIF (|x| ≥ 26, x coupled to r, `foam:false` if it
  rides the height-fog): the caldera rim — a long, dark, flat-topped escarpment with
  stepped colonnade bands and ONE glowing fissure high on its face, sinking into the
  scorched-dark far fog. 4–6:1 wide.
- **`riftfang`** (punctuation ONLY — largest step, rare): a leaning volcanic
  neck/spatter spire with a broad base ≥50% of its width and a broken asymmetric
  multi-jag crown (A3.3). The ONE tall form. Optional hero variant: a paired
  half-collapsed rift gate framing the lane the way the biome's updrafts frame
  ASHTALON's dives — only if Stage 1 wants a focal landmark; it must not read as a
  gate of ice pylons in disguise (Part B checklist).

Instance statistics target: ≥80% width ≥ height; restraint over clutter (aim nearer
Frozen's shipped ~200–300 instances than the ossuary's ~500); FOAM_CFG entries for all
(lava-water foam collars read as glowing shorelines — a free win; `false` for the
massif); update the `props` mirror in `biomes.js` entry 3.

## C5. Material direction — the A2 techniques on a HOT palette

- **The Caldera value ladder** (the technique, NOT Frozen's stops): light source is
  BELOW, so the ladder inverts Frozen's logic —
  - **DOWN-faces = the HOT stop**: ember-lit undersides (deep orange-red catch-light
    from the lava floor) — the belly glows, the crown is dark;
  - **UP-faces = the COLD stop**: ash-grey cooled crust (desaturated warm grey, hue
    nudged off the ember sky so silhouettes separate);
  - **MID/verticals**: near-black basalt with a warm cast.
  Bake per-face from geometric normals, exactly the `bakeIceLadder` machinery with
  Caldera stops + axis (it already takes `{ax,ay,az,frostT,tealT}`-style options;
  generalize the stop names, don't fork the function). For tumbling bodies use the
  fixed weathering-axis variant (crusted rind / fresh black fracture / glowing seam
  zone — a material history that is proudly volcanic).
- **Self-lit floor**: fold the ladder into emissive (A2.4) so the hot belly still
  reads when a prop silhouettes against the bright ember horizon — tuned LOW on the
  grey crust stop (crust is matte and dark by theology) and warm on the belly stop.
  Exempt telegraph materials.
- **Fake transmission, Caldera dialect**: NOT Frozen's whole-body luminous mass —
  Caldera's mass stays DARK; the "light within" lives only in crack networks and
  throats (`primary[3]` emissive stays a low inner-heat smolder ~0.2–0.3; the accent
  carries the fire). The technique is the same; the ration is the opposite — that
  asymmetry IS the biome's identity.
- **Per-facet glints**: lower `primary[3]` roughness toward ~0.35–0.45 (glassy
  fresh-basalt sheen catching the ember sky), varied strata `ry` — but keep it well
  short of Frozen's 0.30 ice gloss; basalt glints are sparse and hard.
- **Glow address (fixed):** LOW, in cracks and throats — recessed seams near bases,
  sunken crater pools. Never mid-body sliver clefts (Frozen's address), never flush
  panels. Accent hue: magma orange-red (`accent[3]` family), possibly graded
  white-hot ONLY inside fumarole throats.
- **`instanceColor` note**: shared archetypes multiplying tints must keep biome-0 rows
  identity white — irrelevant for Caldera-exclusive archetypes, but don't regress it.

## C6. Atmosphere refinement

Shipped bones are good (C3). The premium pass, all standard levers (A5):

- Push the dual-fog story: ember-red near fog → scorched near-black far — the caldera
  reads DEEP, and `riftwall` sinks into it.
- `hemiGround` hot bounce (it already exists at `0x301010`; consider warming slightly
  so prop undersides pick up the lava floor — this is what SELLS the inverted ladder).
- Sky: a branchless heat-shimmer / eruption-pulse `xMix` term is the designed deferred
  sky effect (BIOME-DESIGN §5.5) — cheap, tier-free, and doubles as EMBERTIDE's
  foreshadow channel later. Keep the horizon band LIT (ASHTALON's silhouette needs it).
- Water: the lava-tinted water is the biome's second light source — verify the
  foam-collar color reads as glowing shoreline, not white surf.
- `bulletcontrast.mjs` after every change: magenta-vs-ember is this biome's hardest
  legibility case in the game (hot palette adjacent to the danger hue). If magenta
  ever struggles, the per-biome `bullets:{light,mid,dark}` override exists for exactly
  this — tune legibility there, never by desaturating the biome.

## C7. Hazards — Caldera's own creatures

**The signature hazard is shipped and stays: the GEYSER** (vents on a phase-offset
rhythm, magenta telegraph → ember-column burst; verb: read the rhythm, weave the
columns). The overhaul's job is its PRESENTATION: the burst column and telegraph get
the premium treatment (slim opaque core + rim-lit particles per the overdraw law —
no additive shells), and hazard vent sites should read as the same fumarole family as
the props so the world explains the danger. Score it in-context (Stage 4).

**The in-lane obstacle skins (`OBSTACLE_SKINS[3]`) — invented from volcanic identity**
(concepts for Stage 1/Stage 2 to gate; colliders byte-identical; all A4 invariants):

- **Beam (full-lane horizontal): the COLLAPSED COLONNADE SPAN** — a fallen palisade of
  hexagonal basalt columns lying across the lane, column ends fractured at staggered
  lengths, glowing joint-cracks where columns sheared (glow recessed between column
  faces — the Caldera address). Continuous across ±16 by DATA-authored sections +
  numeric coverage test. No spin (a fallen colonnade doesn't roll).
- **Column (vertical): the SPATTER CHIMNEY** — a squat-based volcanic neck of welded
  spatter blobs, girth held to ~78% height, broken crown, one sunken glowing throat
  vent near the top third (recessed, not a stripe). Unit-space authoring; coverage
  ring-sampled.
- **Tumbling body: the BREADCRUST BOMB** — a lava bomb: dark crust plates over a
  glowing fracture network (the vertex ladder on the fixed weathering axis: crust
  rind / black fracture / ember seam), wider than tall ~1.5:1 (lateral-dodge law),
  bounding box ≤1.25:1. **Dynamic variant**: same geometry, emissive pulse toward
  white-hot on the seam network — "same bomb, it's live."

None of these name, quote, or resemble any other biome's hazard forms — they are
basalt answers to the three collider questions, gated by the Part B checklist.

**Deferred (do not build now, per BIOME-DESIGN §10):** the geyser-LAUNCH kinematic
verb, eruption weather events. The overhaul is a look arc; verbs are owner-gated.

## C8. Rollout (one PR each, the A1 pipeline per PR)

1. **PR-1: materials + atmosphere refinement** — Caldera ladder stops + self-lit floor
   + `primary[3]`/`accent[3]` retune + fog/water/hemiGround polish. Gate: contact
   strips + `bulletcontrast` + in-context renders.
2. **PR-2: the prop kit** — studio (`propstudio` cloned/re-rigged for the ember light)
   → build the C4 roster behind the `?props=v1` whitelist flip → envcount + NaN scan →
   in-context flythrough (`frozenclose` pattern re-pinned to `?biome=3`) → Fable ≥4.2
   per archetype → owner preview.
3. **PR-3: obstacle skins** — `obstaclestudio` sheets with collider ghosts →
   `OBSTACLE_SKINS[3]` trio + `tests/hazardskin.mjs` coverage entries → in-context
   hazshot pass (score in the ember backlight) → Fable ≥4.2 each.
4. **PR-4: geyser presentation + cohesion pass** — vent-site/fumarole family unify,
   telegraph FX polish, final gameshots montage, Gate-2 on the compound result.

Each PR: full headless suite, SW re-stamp before fly-test, biome-pinned preview link
(`?biome=3&debug`), one lesson file. If the owner's preview verdict is "doesn't feel
right," stop the train and fix before migrating anything to the next biome — that is
THE RULE's whole point.

---

*After Caldera ships and the owner signs it, the next biome runs this same doc from
Part A with a fresh identity — and Part B applies to Caldera then too: the third biome
may not replicate Frozen OR Caldera. Every overhaul adds one more "must not resemble"
row to the checklist. Update this playbook's Part B list as premium biomes accumulate.*
