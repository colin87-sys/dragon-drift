# BIOME-OVERHAUL-PLAYBOOK.md — how to bring an entire biome to premium

---

## ⛔ ROLE & GATING CONTRACT — READ FIRST. NON-NEGOTIABLE. BINDS EVERY BIOME CHAT.

This is the governing contract for every biome overhaul. It binds the agent running this chat
(the **driver**), whatever model it is. If it conflicts with your urge to make progress, **THIS
WINS.** Breaking it is a process failure, not a shortcut. It exists because the driver holds the
pen and, left to momentum, self-judges the art and ships un-directed work — which is exactly what
this forbids. **FABLE is the art director and the sole judge. YOU are the grunt and the hands.**

**Your role — grunt + hands ONLY.**
- You DO: research legwork, mechanical implementation of Fable's direction, running tools / tests /
  captures, wiring, git/PR bookkeeping.
- You DO **NOT**: judge visual quality, decide something "looks good / premium / awe-worthy / done,"
  choose or invent art direction, or ship. **Those are FABLE'S EXCLUSIVE AUTHORITY.** You have ZERO
  authority to assess how anything looks. If you notice yourself forming an opinion on whether art
  is good — **STOP.** That judgment is Fable's; spawn Fable.

**GATE 1 — nothing is BUILT without a Fable PRE-ASSESS on record.**
You may not create or edit ANY prop / hazard / material / composition / scene file until you have
(a) spawned a Fable art-director agent to pre-assess that element, (b) received its written
plan/build-sheet, and (c) **pasted its verdict into the chat.** No pre-assess artifact on record →
you are BLOCKED. Do not "just start." Do not self-plan the art.

**GATE 2 — nothing SHIPS without a Fable CHECKPOINT ≥4.2 on record.**
You may not commit as done, mark a PR ready, merge, re-stamp the SW for fly-test, or call any
element "finished" until a harsh Fable checkpoint scoring that element **≥4.2/5** (awe = the target,
per Part 0) is on record and **pasted.** Green headless tests + a clean diff are NECESSARY but NOT
SUFFICIENT — they prove fairness/perf, never that it looks premium. **Only Fable clears the look.**

**Un-fakeable artifacts.** "On record" = Fable's ACTUAL returned output pasted in this chat — its
plan (Gate 1) and its score (Gate 2). You may not paraphrase, predict, assume, pre-empt, or
substitute your own judgment for Fable's verdict. If Fable has not run, the gate is NOT met.

**Self-audit — every turn.** Before ending any turn in which you built, edited, or shipped an art
element, confirm a Gate-1 pre-assess exists for it AND — if you shipped — a Gate-2 ≥4.2 checkpoint
exists for it. If either is missing, you broke this contract: revert or gate the work and get Fable
before doing anything else.

---

## ENGINEER AUDIT — 2026-07-15 (post-handoff hardening pass; claims verified against code)

**Verified against the repo (cites added inline where a builder touches the seam):**
all referenced tools/tests exist and run from `reforged/` (`tools/envcount.mjs --ci`,
`tools/propclearance.mjs --ci`, `tools/frozenshot.mjs` / `frozenclose.mjs` /
`hazshot.mjs`, `tools/propstudio.*` / `obstaclestudio.*`, `tools/stamp-sw.mjs`,
`tools/tricount.mjs --ci`, `tests/hazardskin.mjs`, `tests/gold-determinism.mjs`,
`tests/bulletcontrast.mjs`, `tests/biomecycle.mjs`, `tests/browser.mjs`); every
envcount budget figure (envcount.mjs:73-90); the A2 material numbers
(environment.js:95-155; obstacles.js:113-121, 183-199); the A3.8 tri arithmetic
(measured against the repo's three.js: Cone = 3n, Cylinder = 4n, Icosa(_,0) = 20,
Box = 12); the A4 collider facts and skin contracts (obstacles.js:866-991); the C3
current state (biomes.js:109-138; environment.js:454-472); `CYCLE = [0,1,2,3,4,6,5]`
(biomes.js:212); geyser plumbing (level.js:75, 593; hazards.js); all ten read-first
lesson files exist in `leapfrog/lessons/`.

**Corrected in this pass:**
- **Clearance floors (A3.7):** the 14.5/15.5/17.5/26 "class floors" and the
  `tilt ≤ 1/h` cap are FROZEN-TUNED per-archetype values (environment.js:330-452),
  not universal classes. The universal facts are the ±13 fatal lane
  (`CONFIG.laneHalfWidth`, config.js:4), the ±16 gate veil, and the 14.5 fairness
  floor (`laneHalfWidth + 1.5`) audited by `tools/propclearance.mjs` — a tool the
  draft never mentioned. ⚠ propclearance CI-enforces ONLY biome 2 today
  (`SCOPE_BIOME`, propclearance.mjs:39); the overhaul PR must widen it.
- **`bakeIceLadder` (A2.3/C5):** the `stops:{frost,mid,belly}` option ALREADY exists
  (obstacles.js:608-611) — no generalization work needed — but omitted `stops`
  silently defaults to Frozen's blue ice. Now a named trap + a mechanical Part B
  checklist item.
- **Skin registry symbol:** it is `SKIN_BUILDERS[bi]` (obstacles.js:851), not
  `OBSTACLE_SKINS[bi]` — corrected everywhere. New trap documented: `hazardMesh`'s
  skinned-shard branch hardcodes `mats.frostIce`/`mats.moverIce` (obstacles.js:897),
  so a non-Frozen shard skin requires a small seam extension or it ships Frozen ice.
- **`props` mirror:** it lives in each biome's `BIOMES[]` entry (Caldera's at
  biomes.js:134, not ~96) and is documentation — the live spawn whitelist is the
  archetype's `biomes:[n]` array.
- **Caldera roster names (C4):** confirmed free placeholders (no code symbols), BUT
  `WALL-PROPS-REDESIGN.md` §4.3 holds an older Caldera spec reusing the same names
  with different roles/steps — an explicit supersede note was added.
- **NaN scan (Stage 6):** no shipped harness exists; clarified as a check the builder
  scripts (envcount never calls `place()`; the failure mode is environment.js:1021).
- Removed the out-of-scope set-piece mention from A1 (this doc covers side props +
  spawn content + hazards + materials ONLY).
- C6: Caldera already ships `bullets:{dark:0xa84167}` (biomes.js:137).

**Residual risks / assumptions to confirm at build time:**
- Live counts move: envcount on 2026-07-15 measured Frozen 228 inst / ~29.4k band
  tris and Caldera 144 / ~7.8k (Frozen+Caldera IS an adjacent pair in CYCLE — re-run
  `envcount --ci` after every roster PR; the historical figures quoted in A3.6
  (496→208) are lesson-era history, not current numbers).
- `tests/hazardskin.mjs` coverage functions are Frozen-specific; Caldera authors its
  own coverage exports (A4) — budget that work into PR-3.
- `propstudio` iterates `frozenPropKeys()` (environment.js:710); cloning it for
  another biome means parameterizing that key list.
- The Fable/owner gate scores, redirect history, and studio-vs-in-game gaps cited
  from the Frozen arc were taken from the ledger lessons, not re-derived.

---

**Audience: a fresh session tasked with a full BIOME OVERHAUL** — one biome's SIDE PROPS
and everything that spawns in it (decorative masses, in-lane hazards, materials,
atmosphere, ambient content) brought to the same premium bar Frozen Reach now holds.
This doc distills HOW Frozen was actually done (July 2026, ~12 ledger lessons + two full
redirects) into a reusable, biome-agnostic pipeline, and then applies it to the
recommended next biome (Emberfall Caldera) as a worked example.

**The bar for every one of these overhauls is defined in PART 0 — THE AWE DOCTRINE.
Read it before Part A.** 4.2/5 is the pass gate; AWE is the target. Part 0 is standing
owner doctrine: it applies to every biome overhaul, not any one biome, and it is
first-class — equal in rank to determinism, 60fps, and Part B distinctness.

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
   (`SKIN_BUILDERS`/`hazardMesh`/`bakeIceLadder`/`buildObstacleMesh`), `js/hazards.js`
   (the biome-hazard runtime), `js/biomes.js` (the biome's atmosphere entry).

---

# PART 0 — THE AWE DOCTRINE (standing; EVERY biome overhaul inherits this)

This part outranks everything below it except the owner. It is not per-biome guidance
— it is the STANDING bar and the STANDING art-direction workflow that every overhaul
(Caldera, and every biome after it) runs before and through Part A's pipeline. A
session that executes Part A perfectly but skips Part 0 has built a well-verified
mediocre biome.

## 0.1 THE AWE BAR — the primary success criterion

**The bar for every biome is NOT "good enough." It is: a player looks at the scene
and thinks "wow, this game is absolutely beautiful."** AAA-premium — the reaction a
flagship console title earns, not "impressive for procedural vanilla Three.js." That
sentence is the primary success criterion of a biome overhaul; everything in Part A
is machinery for reaching it without breaking the game.

Rank order, so no session confuses the floor with the target:

- **4.2/5 is the FLOOR** — the per-element pass gate (A1 Stage 2/5, A6). A 4.2 means
  an element is ALLOWED to ship. It does not mean the biome is done.
- **AWE is the TARGET** — the biome-level criterion the assembled overhaul is judged
  against, on the moving in-context flythrough and the owner's preview. A biome can
  pass every element gate and still fail the overhaul: Frozen's ossuary was exactly
  this failure (every headless gate green, a Fable checkpoint passed, owner verdict
  NO — it aimed at unease when the bar was awe).

A biome overhaul is DONE when the flythrough makes the sentence true, and not before.
Budget iteration for the gap between "all elements ≥4.2" and "absolutely beautiful" —
that gap is where the real art direction happens.

## 0.2 SCENE COMPOSITION is a first-class deliverable

A beautiful scene is COMPOSED, not accumulated. Premium props in an un-art-directed
scene read as a prop catalog, not a place — composition is a deliverable with its own
spec and its own checkpoint, never a side effect of nice props. Per biome, the
following are explicitly art-directed (in the Stage-1 bible, as a **composition
script**) and then verified on captures:

- **Framing** — what the player's forward view down the lane actually serves: what
  flanks the corridor, what the sky band holds, what the water doubles. The lane is
  the camera dolly; design the shot it takes.
- **Depth layering** — deliberate fore/mid/background reads: in-lane hazards (fore),
  the prop roster (mid), massifs sinking into the far fog (back). Each layer must
  separate in value and scale; the dual-fog story (A5) is the layering instrument.
- **Silhouette** — the skyline the biome cuts against its own sky: where it's jagged,
  where it rests, where the one tall punctuation mark stands (A3.1–A3.3).
- **A COLOR SCRIPT** — the deliberate palette progression of the scene: sky → fog →
  mass → accent → water → danger magenta, with named relationships (what's warm vs
  cool, what's saturated vs held back, what the eye's one "expensive" hue is). Derived
  from the theology sentence, checked against `bulletcontrast` and Law 8.
- **Light + time-of-day mood** — where the key light comes from, what it rakes across,
  what it silhouettes, and the mood that time-of-day choice buys (Frozen's low sunset
  sun was a composition decision before it was a lighting value).
- **Atmosphere** — mist/haze/fog/height-fog/particles as COMPOSITION tools: what they
  veil, what they separate, where the air pools, what drifts through the frame.
- **Reflections / water** — where relevant, the water is half the frame: mirror vs
  chop is a composition choice (double the heroes, or scatter them).
- **Focal hierarchy** — where the eye goes FIRST, second, third, in a typical stretch.
  If everything asks for attention, nothing is the hero.
- **Negative space** — restraint as composition law (A3.6): the empty stretches are
  what make the colossal forms land. Design the emptiness, don't just tolerate it.
- **THE MOTION READ** — the scene is experienced at flight speed, not as a hero frame.
  Compose the FLYTHROUGH: how layers parallax, the rhythm of dense → empty → hero
  moment, how often a designed shot crosses the view, whether the composition still
  reads in the 3 seconds a player actually has. A static frame that scores 5/5 and a
  flythrough that reads as noise = a failed composition.

**The composition earns its own Fable checkpoint** — scored on the Stage-4 moving
in-context captures as its own line item beside the per-element scores (floor 4.2/5,
target the 0.1 bar). Element scores never substitute for it; see A6.

## 0.3 THE REFERENCE NORTH STAR

The standing visual target for the game: **a cross between Ghost of Tsushima and
Breath of the Wild, shot like National Geographic.**

- **Ghost of Tsushima** — painterly cinematic color, bold saturated color fields, wind
  and atmosphere as living mood, the guiding-the-eye discipline of its composition.
- **Breath of the Wild** — stylized, READABLE sense-of-place and wonder: clean forms
  that carry identity at distance, a world that invites the eye toward landmarks.
- **National Geographic** — the natural awe/realism of nature-documentary photography:
  real geology and real light doing something extraordinary, the patience of a held
  wide shot, the sense that this place EXISTS.

Each biome's art direction STUDIES these for PRINCIPLES — composition, color
relationships, light, mood — **never to copy their content, assets, scenes, or
landmarks** (0.5 / Part B). The output of reference study is composition laws and
palette logic in the biome's own vocabulary, never "build the thing from that game."

## 0.4 THE RESEARCH → FABLE-SYNTHESIZES WORKFLOW (how art direction runs)

This is the mandatory shape of the art-direction work, per biome:

1. **Fable is the ACTIVE art director and owns the vision end to end** — from Stage 1
   through every checkpoint through Gate 2 and the final composition score. Not a
   one-shot critic: the same directing intelligence, resumed (SendMessage keeps its
   loaded context), across the whole arc.
2. **Fable does NOT do the grunt research itself.** Fable decides WHAT to research and
   HOW — the reference questions, the real-world subjects, the specific unknowns —
   then **delegates the research to Opus**: spawn general/Explore/web-research agents
   to study the reference games' scene composition (0.3) and real-world / National
   Geographic references for THIS biome's subject (its geology/ecology, color
   palettes, lighting, atmospheric depth).
3. **Opus gathers and reports the research back. Then Fable SYNTHESIZES it** into the
   plan / build sheet: the biome bible (Stage 1), the color script, the composition
   laws (0.2), the prop + hazard roster, the material direction, the phased build
   order. Research is raw material; the bible is Fable's synthesis, not a paste of
   findings.
4. **Fable stays the art director through every checkpoint** — studio contact sheets,
   in-context captures, the composition checkpoint, Gate 2 — so the vision that
   directed the research is the one grading the pixels.

Stage the research digest and the synthesized bible as durable files (scratchpad
digest → `reforged/<BIOME>-BIBLE.md`), so mid-arc sessions inherit the vision instead
of re-deriving it.

## 0.5 AWE NEVER LICENSES REPLICATION (Part 0 ↔ Part B — critical)

"Make it absolutely beautiful" is not permission to (a) literally copy a reference
game's content, assets, scenes, or landmarks, or (b) replicate another Dragon Drift
biome's look, shapes, or palette because that biome already scored well. **Beauty is
DERIVED from THIS biome's own identity, material, and light** — its theology sentence,
its geology, its verb, its boss. The north star (0.3) supplies grammar; the biome
supplies every noun. These two doctrines reinforce each other: the most awe-inducing
version of a biome is the one only IT could be, and a biome that borrows another's
beauty has failed BOTH bars at once. Part B gates this mechanically — including the
AWE-SOURCE row in the "Frozen-recolored" checklist.

---

# PART A — THE REUSABLE METHOD (biome-agnostic)

## A1. The end-to-end pipeline

Frozen's final shape came from this loop. Run it per element-family (props → in-lane
hazards → atmosphere/ambient), one PR each, coexist-flagged.

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
and Part 0 + Part B of this doc. It runs the **Part 0.4 workflow** — Fable directs the
research questions, delegates the gathering to Opus agents (reference-game composition
per 0.3 + real-world/NatGeo references for this biome's subject), then SYNTHESIZES the
reports into the bible — and it must deliver:

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
- **The scene-composition script (Part 0.2)** — framing, depth layers, silhouette
  skyline, the color script, light/time-of-day mood, atmosphere, water/reflection
  role, focal hierarchy, negative space, and the motion read at flight speed, for
  THIS biome. It is a first-class deliverable and will be scored as its own
  checkpoint at Stage 4/A6.
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

- An **inert studio export** from the real module (`buildArchetypeMesh`,
  environment.js:682 / `buildObstacleMesh`, obstacles.js:983) so **what Fable grades is
  what ships** — same geometry, same materials, at a representative in-game `(r,h,r)`
  instance scale. Studio-only exports, never imported by the running game (zero
  shipped-pixel change). Note: propstudio iterates `frozenPropKeys()`
  (environment.js:710) — parameterize the key list (or add a per-biome export) when
  cloning for a new biome.
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
  ≤2 materials (the `mergeParts` hard cap, environment.js:170 — a part with `mat >= 2`
  throws at build (`groups[p.mat]` is undefined); `envcount` builds every archetype
  headless to catch exactly this before it takes down every biome's boot).
- **The whitelist FLIP is the coexistence mechanism, and its polarity matters:**
  default = new kit holds `[n]`, legacy roster PARKED at `[]`; `?props=v1` swaps the
  two rosters' whitelists at module init (the shipped `frozenNew`/`frozenOld` idiom in
  `environment.js`). **Never both rosters holding the biome** — that doubles density
  and reds the envcount cap. envcount's shim forces `location.search=''`, so CI always
  audits the default (new) roster.
- Every new archetype gets a `FOAM_CFG` entry (environment.js:650) — a `{r}` waterline
  collar (the weld between silhouette and reflection; elliptical `{rx,rz}` for thin
  footprints) or explicit `false` for fog-line massifs (a foam ring 30+ off-lane is a
  bright artifact). Update the `props: [...]` mirror array in the biome's `BIOMES[]`
  entry alongside (biomes.js — Caldera's is line ~134). The mirror is documentation;
  the LIVE spawn whitelist is the archetype's own `biomes:[n]` array — keep both in
  sync or the doc lies to the next session.
- Prime `step` values, mutually coprime across the biome's roster (anti-tiling).

### Stage 4 — In-context render (the stage that catches what the studio can't)

**The studio lies by up to a full point.** Frozen's hazards scored 4.3–4.4 in the
studio and 3.0–3.4 in-game, because the studio sky was bright and even while the biome
ships BACKLIT. The standing rule: **no score counts until it's captured in the shipping
light, in-lane, moving** — clone `tools/hazshot.mjs` (flies the showcase in-biome and
bursts frames as the dragon passes each element) and the `frozenclose` flythrough.
Judge: silhouettes hold against the biome's brightest sky region; the value ladder
still reads on camera-facing faces; magenta danger wins; the dragon roster pops
(BIOME-DESIGN Law 8). **This is also where the Part 0.2 COMPOSITION CHECKPOINT is
scored** — on the MOVING captures, as its own line item: depth layers separate,
focal hierarchy leads the eye, the color script holds, negative space lands, and the
flythrough — not just a hero frame — points at the 0.1 awe bar.

### Stage 5 — Harsh Fable checkpoint (the gate)

The overhaul runs under the GRAPHICS-OVERHAUL **Fable Quality-Gate protocol**: Gate 1
pre-build (it catches inverted coexistence flags and missing placement mechanics before
a line of geometry — it did exactly that on Frozen A1), Gate 2 pre-merge with the
in-context captures (verdict SHIP/REVISE/RETHINK; merge only on SHIP), per-element
floor **4.2/5** on the contact sheets. Sub-floor scores get specific actionable deltas,
not vibes. Record verdicts in the PR body + the Gate Log.

### Stage 6 — Headless verification (necessary, NOT sufficient)

From `reforged/`, every PR:

- `node tools/envcount.mjs --ci` — per-archetype tris ≤150 AND instances ≤170
  (2×ceil(900/step)), per-biome ≤550 inst / ≤50k band-tris, adjacent-pair ≤90k
  (walked over `CYCLE`), **side-prop additive/transparent surfaces = 0**, FOAM_CFG
  completeness (caps: envcount.mjs:73-90; the GRANDFATHER tri list is frozen — never
  add an entry).
- `node tools/propclearance.mjs --ci` — the lane-clearance audit (A3.7): worst-case
  inner edge vs the 14.5 fairness floor + the ±16 gate veil, computed from each
  archetype's measured ρ over a brute-force `place()` lattice. ⚠ It CI-enforces ONLY
  biome 2 today (`SCOPE_BIOME`, propclearance.mjs:39) — the overhaul PR must widen
  enforcement to its biome and clear that biome's pre-existing "stray" rows instead of
  inheriting them.
- A **runtime NaN scan of every instanceMatrix** — there is NO shipped harness for
  this: envcount only calls `build()`, never `place()`. A `place()` that omits `tilt`
  produces NaN quaternions (`writeMatrix` seats `d.tilt` straight into `eul.set`,
  environment.js:1021) that corrupt the whole band, and no headless geometry tool sees
  it. Script the check yourself (the propclearance 4-draw `place()` lattice is the
  pattern — assert every returned `x/h/r/tilt` is finite) AND eyeball a booted
  `?biome=N` render.
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
3. **The value-ladder technique** (`bakeIceLadder(geo, opts)`, obstacles.js:608 —
   already biome-parameterizable, no generalization work needed: `opts` takes the
   key axis `{ax,ay,az}` (default world +Y), the two thresholds `{frostT,tealT}`
   (defaults 0.35/−0.30), and the three stop colors `stops:{frost,mid,belly}`): bake a
   **3-stop vertex-color ladder from each face's GEOMETRIC normal** onto the merged
   flat-shaded geometry — a LIGHT stop, a MID stop, a DEEP stop. One flat band of color
   becomes carved, lit mass at zero triangle cost. ⚠ **FROZEN TRAP: when `stops` is
   omitted the function defaults to Frozen's `_FROST/_MIDICE/_BELLY` blue-ice hues
   (obstacles.js:595)** — every non-Frozen call site MUST pass `stops` explicitly, at
   every call. (The stop KEYS are just names; what is NOT parameterizable is the
   structure — exactly three hard-thresholded stops, per-face flat assignment.)
   Derive the ladder per biome by asking: **where does this biome's light come from, and what does its material
   history look like?** Frozen keyed frost/ice/shadow off world-up (sun logic); a biome
   lit from BELOW inverts the axis; a TUMBLING body must key off a fixed per-chunk
   *weathering axis* instead of world-up (orientation-invariant "material history" —
   rind / fresh fracture / deep seam) or the bake flickers as it spins. Nudge the MID
   stop's hue OFF the biome's sky so silhouettes always separate.
4. **The self-lit legibility floor** (the backlight survival trick): vertex colors only
   modulate the diffuse term, so a ladder DIES against a bright backlight (faces
   collapse to near-black emissive). Fold the ladder into emissive too — the shipped
   `withLadderEmissive(mat)` helper (obstacles.js:113) is exactly this one
   `onBeforeCompile` line: `totalEmissiveRadiance *= vColor.rgb;` — and set the
   material's emissive to a bright ladder-neutral base at intensity ~0.35–0.5
   (Frozen's `frostIce` ships `0xcfe4f0 @ 0.42`, obstacles.js:183 — that HUE is
   Frozen's; a new biome builds its OWN `vertexColors:true` material and wraps it,
   never clones `frostIce`). Now the ladder reads with zero scene light. **Exempt
   warning/telegraph materials** (`moverIce` is deliberately un-wrapped — its pulse
   must stay hot and unmodulated). Counter-intuitively, raising the body's
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
7. **`place()` / lane-clearance discipline** (the fairness law). The UNIVERSAL,
   code-enforced facts: the fatal lane is ±13 (`CONFIG.laneHalfWidth`, config.js:4),
   the Phase-Gate veil is ±16, and the worst-case inner edge
   `|x| − ρ·r·sMax − lean(h·yMax·|tilt|)` must clear the fairness floor
   `laneHalfWidth + 1.5 = 14.5` — all audited by `tools/propclearance.mjs`, which
   measures each archetype's true plan-radius ρ from its geometry and brute-forces
   `place()` over a 4-draw rnd lattice (run the tool; don't hand-derive ρ). The quoted
   "class floors" — LOW ≈14.5 (terrace; its top ≤7 lets it hug the route), MID ≈15.5
   (serac), TALL ≈17.5 (icetower) **plus an inward-tilt cap so the top never leans over
   ±16** (icetower implements it as `tilt ≤ 1/h`, environment.js:427), BACKDROP
   26 + 1.01·r (glacierwall, whose ρ≈1.0 forced the strong coupling) — are
   **FROZEN-TUNED per-archetype values from the PR-1 lane fix (environment.js:330-452),
   NOT universal engine classes.** A new biome derives its own floors the same way:
   draw r FIRST, couple x to r using the archetype's own measured ρ, keep the inner
   edge ≥14.5, and re-verify with propclearance (⚠ which CI-enforces only biome 2
   today — `SCOPE_BIOME`, propclearance.mjs:39 — widen it in the overhaul PR).
   **`place()` MUST return `tilt` explicitly** (`tilt: 0`, never omitted) — a missing
   tilt is a NaN quaternion (`writeMatrix`, environment.js:1021) that corrupts the band
   and no headless geometry tool sees it.
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

**(b) The in-lane obstacles** (`js/obstacles.js` — three collider archetypes, type
keys and envelopes: `bar` = full-lane horizontal beam (box: `|dz| < r`,
`|y−cy| < r·0.75`, **NO x-term**), `pillar` = vertical column (cylinder from the
floor: horiz `< r·0.65`, `y < h`), `shard` = tumbling body (sphere: dist `< r·0.70`);
spawn ranges bar r 0.7–1.1, pillar r 1.6–3.0 / h 8–21, shard r 1.3–2.6 —
obstacles.js:947-951). The COLLIDERS are engine facts and stay byte-identical; the
SKIN is 100% biome fiction. A premium biome reskins all three by registering a builder
trio in `SKIN_BUILDERS[bi]` (obstacles.js:851 — module-private; Frozen's `2:` entry is
the only one) behind the `hazardMesh(type, bi, p)` seam (skin when present,
byte-identical primitive fallback otherwise — so ungraded biomes are provably
unchanged). Skin return contracts (obstacles.js:866-902): bar →
`{ parts: [{geo, mat}…], ref }`, group-scaled `(1, s, s)` with `s = r/ref` (x spans
the lane); pillar → `{ tower, rubble }` part lists (tower scales `r×h×r`, rubble
`r×r×r` seated at the foot); shard → `{ geo }` (uniform r scale). ⚠ **FROZEN-LEAK
TRAP: the skinned-shard branch of `hazardMesh` HARDCODES `mats.frostIce` /
`mats.moverIce` (obstacles.js:897)** — a new biome's shard skin must extend that seam
to per-biome materials or it silently ships Frozen's ice on its own geometry. **The
skin answers: "what, in THIS biome's world, is a beam / a column / a tumbling
mass?"** Frozen answered with calved-ice forms; another biome must answer from its
OWN geology — never by recoloring another biome's answer (Part B).

Fairness invariants (each one has bitten; the Frozen instances are enforced in
`tests/hazardskin.mjs` — the coverage functions there are Frozen-specific, so a new
biome authors its OWN numeric coverage exports mirroring `barColliderCoverage`
(obstacles.js:908) / `pillarColliderCoverage` / `shardColliderSupport` and adds its
own test entries):

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
3. **The COMPOSITION checkpoint + the AWE BAR (Part 0).** The assembled scene gets its
   own Fable score on the moving in-context captures against the 0.2 composition
   script — floor 4.2/5, target "wow, this game is absolutely beautiful" (0.1).
   Per-element scores never substitute for it; a roster of 4.2s that composes into
   noise fails here.
4. Verify before claiming: full headless suite + envcount `--ci` + NaN scan + coverage
   tests + real renders you have LOOKED at. Never claim a visual result without a PNG.
5. The owner judges feel/awe/motion on the PR preview (staged with the biome pin and a
   what-to-look-at list). The owner outranks every gate — and the owner's bar is
   Part 0.1, not the floor.
6. **SW re-stamp (`node tools/stamp-sw.mjs`) before every fly-test hand-off.**
7. One lesson file per change (`leapfrog/lessons/`, `graphics-` slug for this track).

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
  hue, fog melt and water tint all derive from ITS theology sentence. The mechanical
  leak paths are NAMED, and each is a silent default — guard them explicitly:
  (1) `bakeIceLadder` without an explicit `stops:` defaults to Frozen's
  `_FROST/_MIDICE/_BELLY` blue ice (obstacles.js:595,611); (2) the skinned-shard
  branch of `hazardMesh` hardcodes `mats.frostIce`/`mats.moverIce`
  (obstacles.js:897); (3) cloning `frostIce` / `glacierWallMat` or reusing
  `_WALL_LADDER` imports Frozen's emissive base and wall stops; (4) reusing
  `crevasseCore` imports Frozen's accent GEOMETRY (generalize the recess grammar,
  never the crack shape — A2.7).
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

**The awe bar is bounded by this mandate (Part 0.5 — read them together):** the Part 0
demand for "absolutely beautiful" is NEVER an excuse to lift a reference game's
content, scenes, or assets (the north star is studied for principles only), and NEVER
an excuse to replicate another Dragon Drift biome's look, shapes, or palette because
that biome already proved beautiful. Chasing awe by borrowing fails BOTH doctrines at
once: it isn't distinct, and it isn't this biome's beauty. Awe is reached by pushing
the biome's OWN identity, material, and light further — not by reaching for someone
else's.

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
- [ ] AWE-SOURCE (Part 0.5): for each designed beauty beat (the hero landmark, the
      color script's money hue, the signature light moment), name the biome-native
      source it derives from — its material, its light, its identity triple. Any beat
      whose honest description is "the shot from <reference game>" or "<other premium
      biome>'s composition, retinted" is a copy: RETHINK it, don't retint it.
- [ ] MECHANICAL GREP (run it, don't eyeball — this is the check that catches a
      silent recolor): in the new kit's diff, every `bakeIceLadder(` call passes an
      explicit `stops:`; zero references to `_FROST`, `_MIDICE`, `_BELLY`,
      `_WALL_LADDER`, `mats.frostIce`, `mats.moverIce`, `glacierWallMat`,
      `crevasseCore`, or Frozen's hex literals (`0xbfdce6`, `0x3fc8e8`, `0x357088`,
      `0xcfe4f0`, `0xd8f6ff`).

Any unchecked box = RETHINK, not REVISE. Distinctness is a ship-blocking requirement,
equal in rank to determinism and 60fps.

---

# PART C — WORKED EXAMPLE: EMBERFALL CALDERA (biome index 3)

## C1. Why Caldera is the right next biome

1. **Play order continuity.** In the current cycle players fly Frozen → Caldera
   (`CYCLE` interim order `[0,1,2,3,4,6,5]`: biome 2 hands directly into biome 3). The
   now-premium Frozen raises the bar and then the very next biome drops back to
   two ≤3-primitive archetypes — the contrast is the game's most visible quality cliff.
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
  an accent collar, step 18) and `vent` (cone + glowing throat collar, step 42) —
  environment.js:455-472; mirrored as `props: ['basalt','vent']` at biomes.js:134.
  This is exactly the poverty class Frozen's cones were. (envcount 2026-07-15:
  Caldera 144 inst / ~7.8k band tris — huge headroom under the 550/50k caps.)
- **In-lane obstacles:** the untouched primitive bar/pillar/shard tinted by
  `mats.body[3]` — `SKIN_BUILDERS[3]` does not exist yet (obstacles.js:851 holds only
  the Frozen `2:` entry).
- **Materials:** `primary[3]` basalt-with-inner-heat `0x352629`/em `0x4a1208`@0.3,
  `accent[3]` magma seam `0xff5a20`/em `0xff3a08`@0.9 — usable starting hues, but flat
  (no ladder, default roughness 0.7 → no facet glints, no self-lit floor).
- **Atmosphere:** already strong (ember sky, dual fog to scorched dark, heightK 0.045,
  lava-tinted water `shallow 0xc84818` waveAmp 0.55, rising embers `fall:-2.2`,
  fire-moths). The retheme here is refinement, not rebuild.

## C4. The prop roster — fresh VOLCANIC geology, zero ice DNA

> **Authority note:** `WALL-PROPS-REDESIGN.md` §4.3 contains an OLDER Caldera roster
> spec that reuses several of these names (`colonnata`/`riftfang`/`fumarole`/
> `clinker`/`riftwall`) with different roles and steps. **THIS playbook supersedes it
> for the Caldera overhaul.** None of the names below exist in code (only a "fumarole
> cone" comment at environment.js:464) — they are placeholders the Stage-1 art
> director is free to redefine. One fact from the older doc IS worth keeping: geyser
> hazards spawn from level data (`level.js#overlayBiomeHazards`), not from the `vent`
> archetype, so retiring `vent` cannot touch the hazard (gold-determinism proves it
> anyway).

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
- **`riftwall`** — the BACKDROP MASSIF (backdrop floor derived from its OWN measured ρ
  per A3.7 — Frozen's glacierwall needed `26 + 1.01·r` because its ρ≈1.0; couple x to
  r, verify with propclearance, `foam:false` if it rides the height-fog): the caldera rim — a long, dark, flat-topped escarpment with
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
  Caldera stops + axis (the function already takes
  `{ax, ay, az, frostT, tealT, stops:{frost, mid, belly}}` — obstacles.js:608; pass
  the Caldera stops via `stops:` at EVERY call site, because omitting it silently
  defaults to Frozen's blue ice; don't fork the function). For tumbling bodies use the
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
  this — Caldera ALREADY ships a lifted dark band (`bullets: { dark: 0xa84167 }`,
  biomes.js:137): retune legibility there, never by desaturating the biome.

## C7. Hazards — Caldera's own creatures

**The signature hazard is shipped and stays: the GEYSER** (vents on a phase-offset
rhythm, magenta telegraph → ember-column burst; verb: read the rhythm, weave the
columns). The overhaul's job is its PRESENTATION: the burst column and telegraph get
the premium treatment (slim opaque core + rim-lit particles per the overdraw law —
no additive shells), and hazard vent sites should read as the same fumarole family as
the props so the world explains the danger. Score it in-context (Stage 4).

**The in-lane obstacle skins (`SKIN_BUILDERS[3]`) — invented from volcanic identity**
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
   `SKIN_BUILDERS[3]` trio (+ the per-biome shard-material seam extension from A4 —
   `hazardMesh` hardcodes Frozen ice for skinned shards today) + Caldera coverage
   exports + `tests/hazardskin.mjs` entries → in-context hazshot pass (score in the
   ember backlight) → Fable ≥4.2 each.
4. **PR-4: geyser presentation + cohesion pass** — vent-site/fumarole family unify,
   telegraph FX polish, final gameshots montage, Gate-2 on the compound result.

Each PR: full headless suite, SW re-stamp before fly-test, biome-pinned preview link
(`?biome=3&debug`), one lesson file. If the owner's preview verdict is "doesn't feel
right," stop the train and fix before migrating anything to the next biome — that is
THE RULE's whole point.

---

*After Caldera ships and the owner signs it, the next biome runs this same doc from
Part 0 with a fresh identity — the awe bar and the research → Fable-synthesizes
workflow are standing, not per-biome — and Part B applies to Caldera then too: the third biome
may not replicate Frozen OR Caldera. Every overhaul adds one more "must not resemble"
row to the checklist. Update this playbook's Part B list as premium biomes accumulate.*
