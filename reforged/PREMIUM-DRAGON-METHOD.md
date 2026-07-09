# PREMIUM-DRAGON-METHOD.md — the SSSR dragon playbook

**Read this BEFORE starting a premium (SSSR) dragon rebuild — Pearl, Obsidian, and any apex after
them.** It is the distilled method from the Solar "Eclipse Dragon-King" rebuild (CP1 sculpt + CP2
spectacle), written so the next dragon starts from everything Solar learned and **leapfrogs the
CP1→"it's inert"→CP2 detour** — the single biggest time sink. The domain deep-dives live in
[`BOSS-DESIGN.md`](./BOSS-DESIGN.md) and [`BIOME-DESIGN.md`](./BIOME-DESIGN.md); this is the
**premium-dragon** counterpart. The worked reference implementation is
[`SOLAR-ECLIPSE-BUILDSHEET.md`](./SOLAR-ECLIPSE-BUILDSHEET.md) + `js/dragonSovereign.js`.

The core lesson in one line: **a gate-passing sculpt is not a grind-worthy dragon.** Solar passed the
static sculpt gate and still felt inert in play, because the gate is blind to MOTION and to
SPECTACLE. Bake the spectacle requirements in from round 1 and you gate once, not twice.

---

## 0. The fixed context every premium dragon designs against

- **The live game is `reforged/`.** 100% procedural (no asset files), vanilla Three.js r160, no build
  step, must hold **60fps on weak mobile**. Low-poly doctrine: FEWER, LARGER, confidently-faceted
  forms carried by SILHOUETTE. Whole dragon **< 6000 tris** (Solar's 4 forms: 968 / 1336 / 1736 /
  2184).
- **REAR-CHASE CAM IS THE PRIMARY VIEW** (behind + slightly above, at chase distance). This is THE
  design constraint, not a footnote. Players see: wings (~70% of frame), dorsal spine/mantle, tail
  trailing toward the lens. **The face is ~0% of the play view** — do not spend your best geometry or
  brightest emissive on it. (Solar's blazing brow star-gem faces away from the chase cam; we had to
  add a rearward `napeStar` sigil to compensate. Design the rear first.)
- **4 forms = a coronation ladder**, resolved by `ascension.js::ascendedDef` merging `def.forms[t]`
  cumulatively into `def.model` (later forms override earlier keys; booleans stay set). Starters (SSR)
  cap at form 2; premiums (SSSR) reach Eternal (form 3).

---

## 0.5 DISTINCTIVENESS IS A HARD GATE — reuse the METHOD, never the LOOK (read this first)

**This playbook must NOT make the dragons look alike. If any resemblance to Solar — or between
Pearl and Obsidian — creeps in, that is an automatic FAIL, no matter how well it scores otherwise.**
Draw a hard line between two kinds of "reuse":

- **REUSE the METHOD + the PLUMBING (look-neutral, encouraged).** The process order (§1), the
  verify-by-failure-class tools (§4), the Fable gate (§5), and the *code infrastructure* — a
  stage-aware material-factory *structure*, an `igniteStage`-style dial, the `flatTriMesh` helper, the
  `wingsymprobe`/`smoke` probes, `ascendedDef`'s form-merge. These are containers and harnesses; they
  produce no shapes and dictate no palette. Two dragons built with the same material factory look no
  more alike than two songs cut in the same studio.
- **NEVER reuse the LOOK (a hard veto).** Every premium dragon MUST differ from Solar and from each
  other on **all five** of these axes — treat them as a checklist:
  1. **Silhouette family** — Solar owns the M / cathedral-arch + twin-carpal-spires. Pearl and Obsidian
     each need a *different* signature shape (a plume, a mantle, a coil, a halo-crown, a fan — whatever;
     just not the arch). "A strong, specific, readable silhouette" is the requirement; the *answer*
     must be unique.
  2. **Wing architecture** — Solar has membrane vault-bays with carpal lances. Author a *new* wing
     builder with a genuinely different construction (feather, sail, crystalline vane, ribbon, none…);
     do not re-skin `lanceVaultWings`.
  3. **Regalia motif** — Solar owns the eclipse *ring/corona* + brow star-gem. A ring is Solar's; pick
     a different jewel/crest/aura *form*.
  4. **Palette + glow hue** — distinct base + accent + emissive hues per dragon (roster anti-collision).
  5. **Signature growth beat** — what the ladder *reveals* should feel unique (Solar: wings learning to
     arch into a cathedral). Pearl/Obsidian each get their own reveal.

The method GUARANTEES fresh geometry as long as you follow §1 step 2 (new builders, authored fresh,
default-off) — you are never editing Solar's builders, you are writing new ones next to them. The risk
is only in the *design choices*, so make distinctiveness an explicit **Fable veto** in the brief:
*"does any part read like Solar or another shipped dragon? — if yes, FAIL."* (This is the same roster
anti-collision rule bosses use — `BOSS-DESIGN.md` §5b: no two may share silhouette family, hook, or
palette swatch/glow-shape.)

Everywhere below that a Solar specific is named (the arch, the corona ring, a violet hue), it is an
**illustration of a technique**, not a thing to copy. The reusable part is always the *how* (opaque
emissive, camera-facing rim, withheld-then-revealed regalia), never the *what* (a ring, an M, violet).

---

## 1. The method — the thought process, in order

1. **Referent → Fable-synthesized plan.** Anchor to a real referent (Solar→Bahamut→Eclipse), research
   it, then have a **high-effort Fable agent** synthesize the build plan. A real-world anchor + an
   independent aesthetic brain beats designing cold. (Pearl and Obsidian each already have a referent
   identity — start there.)
2. **New builders, default-off, prove on the hero.** Author fresh part builders that self-register in
   the recipe registry (`registerTorso/registerWings/registerHead/registerTail` in
   `js/dragonRecipe.js`); only the hero `def.parts` opts in. **The shipped roster never breaks.**
   Coexist → prove on a hero → migrate.
3. **Build the APEX (Eternal / form 3) FIRST, gate it to PASS.** It is the hardest and most
   constrained form. Do not tune four forms before you know the top one works — the ladder is
   subtraction from the apex, not addition toward it.
4. **Build the growth ladder as a CORONATION ARC.** Each rung adds a CATEGORY (new hardware **and**
   more light), never just scale. See §3 — this is the part Solar had to discover late.
5. **Verify by FAILURE-CLASS** (§4). Different tools catch different failure classes; a green tricount
   tells you nothing about whether the dragon renders in flight.
6. **Human judges MOTION/FEEL on the live PR preview.** The Fable gate is blind to motion (idle coil,
   flap cycle, surge, wake). Flag the motion items explicitly and let the human call them.

---

## 2. Rear-chase primacy (the constraint that reorders everything)

Design the SILHOUETTE and the DORSAL/WING surfaces for the behind-and-above view. Concretely:

- **Silhouette test, run in round 1 (shape-AGNOSTIC):** render the pure rear silhouette
  (`dragonstudio … sil-rear`) and ask **"is this a SPECIFIC, memorable, instantly-nameable shape unique
  to this dragon — or a generic spiked delta-kite (a V)?"** The failure mode is genericness, not "not
  being an M." Solar's *answer* happened to be an **M** (twin carpal spires above a crowned head
  enthroned in the valley) because its referent is a monarch — but **the M belongs to Solar; do NOT
  reuse it.** Pearl and Obsidian each need a different specific shape. The transferable lesson is only
  the mechanism: a strong rear read comes from making the silhouette a deliberate **function/curve**
  (Solar baked an arch into the wing's vertical profile), not a flat mesh you hope reads — the *curve
  you choose* is yours to invent.
- **"Own the dark sky" test, round 1:** render the apex on a DARK backdrop
  (`dragonstudio … glide-dark`). It must own the frame with **≥3 distinct COLOURED light structures**
  and **no dead-black center void.** Solar failed this first pass (dim corona + black body center);
  the fix was a bright camera-facing corona rim + a "spine of light" (emissive gem caps down the
  dorsal keel).
- **A flat decorative sheet aligned to the body's long axis is EDGE-ON to the chase cam** and
  foreshortens to a sliver (Solar's tail fins vanished dead-astern). If a fin/vane must read from
  behind, **cant its face toward the camera** (rotate its normal off the sagittal plane; alternate
  L/R down a row to stay balanced). Same rule for any emissive RIM: the bright band must FACE the
  camera, not sit edge-on to it (Solar's first corona put the rim on the thin depth-edge = invisible;
  the fix moved it to the camera-facing front annulus).

---

## 3. The spectacle triad — bake in from round 1, NOT as a CP2

This is the whole time-saving. Solar discovered these AFTER CP1 passed and needed a second pass. For
Pearl/Obsidian they are **inputs to the build sheet.**

**(a) Growth-ladder payoff = regalia WITHHOLDING + an ignition ramp.**
- **Gate the MESH, not just its brightness.** The whelp must LACK regalia the apex has, so ascending
  visibly confers it. Solar: the Hatchling has no star-gem, no mantle collar, no corona ring, no
  carpal spires, a linear (un-arched) wing, a stub tail. Each is gated on a dial that arrives on a
  rung (`starGemBloom>0`, `coronaValleys>0`, `coronaRing>0`, `carpalLance>0`, `archRise`,
  `napeStar>0`). If every form wears the full crown, Eternal confers nothing (Solar's original bug).
- **Ignition ramp:** a single `igniteStage` 0/1/2/3 dial gates WHICH emissives are lit, driven through
  a stage-aware material factory (Solar's `sovereignMats(def, glow, stage)` — copy this structure).
  Each form adds light AND hardware AND more of the signature silhouette move.
- **Cheap proxy the tests assert:** tris **monotonic increasing** across forms + gem/ring/arch dials
  monotonic (see `tests/starters.mjs` solar block — a premium reaches Eternal so it needs its OWN
  assert block; the shared starters loop hard-asserts `maxTierFor===2`).

**(b) Earned premium light — the anti-tacky doctrine (NON-NEGOTIABLE).**
- **Glow = emissive baked into OPAQUE flat-shaded facets, in SATURATED bloom-safe hues (sat ≥ 0.75,
  value ≤ 0.9)** so it blooms IN ITS OWN COLOUR under ACES + UnrealBloom. **Never additive
  washout shells** — that is the "tacky old dragon" look the owner rejected.
- **At most ONE near-white element**, tiny footprint (Solar: the f3 spar tips, a few dozen px at chase
  distance). It MUST stay out of every `spineMats`/`accentMats` array, or the Surge tick lerps it to
  white and detonates the clip budget.
- **The reusable TECHNIQUE is "dark opaque body + thin saturated rim" — NOT a ring.** A dark opaque
  volume wearing a thin saturated emissive rim reads as jeweled, not smoky, and can't be mistaken for a
  soft additive halo. That *technique* transfers to whatever regalia form YOUR dragon has (a crest, a
  gorget, a plume-heart, a gem cluster, a mantle edge). **Solar spent this technique on a ring (the
  12-facet `flatTriMesh` eclipse corona) — the RING is Solar's signature and is OFF-LIMITS to the
  others.** Do not build another annulus/halo; apply the dark-body-bright-rim *construction* to a
  different shape. (`flatTriMesh`, never a `TorusGeometry`, is the build primitive to reuse — that's
  code plumbing, not a look.)

**(c) A signature silhouette — a DIFFERENT one per dragon.** One memorable, unmistakable geometric
idea that reads in pure silhouette AND owns the dark sky. Solar's was the cathedral arch + twin carpal
spires framing the eclipse ring — **that specific idea is spent; Pearl and Obsidian must each invent a
genuinely different one** (a different wing plan, a different crown/regalia form, a different dark-sky
light signature). Run the same two round-1 CHECKS against your new idea (is-it-specific-not-generic,
owns-the-dark-sky), but the idea being checked must be yours, not Solar's.

---

## 4. Verify by FAILURE-CLASS (four tools, four failure modes)

A green budget check says nothing about whether the dragon renders in flight. Run all of these; each
catches a class the others are blind to. All from `reforged/`:

| Class | Tool | Catches |
|---|---|---|
| **Budget** | `node tools/tricount.mjs <key>` | tris/form, over-6000, non-monotonic ladder |
| **Integrity** | `node tests/blueprint.mjs` | bad builder/shader/layer names, roster validation |
| **Runtime** | `node tests/smoke.mjs` (headless browser flight) | **per-frame crashes → invisible dragon** (two such bugs only surfaced here, NOT in tricount/blueprint) |
| **Symmetry** | `node tools/wingsymprobe.mjs <key>` | asymmetric wings across the flap poses (mirror-built geometry must stay PASS) |
| **Aesthetics** | `node tools/dragonstudio.mjs <key> <round>` | rendered ladder + rear-chase + dark-sky + sil-rear sheets — the evidence the Fable gate reads |
| **Also run** | `node tests/starters.mjs` | per-form geometry asserts incl. the premium's own ladder block |

Runtime gotchas that produced the "invisible dragon" crashes (guard against them):
- A torso builder must return `coreGlow` as a **mesh or `null`**, never a color number — the
  orchestrator only builds the real back-glow sprite (with the `userData.base` the flight tick reads)
  when `coreGlow` is falsy; a number makes it skip that and crash on `.userData.base` every frame.
- The wing rig MUST publish `wingPivotL/R`, `wingMidL/R`, `wingTipL/R`, and a tip `marker` (FX handle)
  or the flap path null-derefs and the dragon fails to select. **The FX marker + `wingElements` tip
  use their OWN copy of the wing profile formula** — if you change the wing's vertical profile
  (dihedral/arch), update BOTH or the wingtip trails + aero-shear detach from the moved tip.

---

## 5. The Fable gate — one combined brief, run as a ratchet

- **An independent, harsh Fable critic** (`Agent` tool, `model: "fable"`, `subagent_type: "Plan"`,
  high effort) is the quality ratchet. Give it a **numeric PASS bar**: weighted average ≥ 4.0, no axis
  ≤ 2, plus binary VETOES. **Make DISTINCTIVENESS a standing veto (§0.5): "does any part read like
  Solar or another shipped dragon — silhouette family, wing construction, regalia motif, palette, or
  glow-shape? If yes, FAIL regardless of scores."** (Solar's own vetoes were washout = a large emissive
  blooming to white, and collision = its corona mistakable for Pearl's halo.) Iterate round by round —
  Solar went 1.10 → 4.19 (CP1) and 3.77 → 4.13 → 4.27 → 4.33 (CP2). **The rendered captures are the
  evidence each round, not vibes.**
- **ONE combined brief that grades sculpt + spectacle + rear-chase together**, so you gate once. Weight
  the rubric toward the rear-chase tile: rear-chase dark-sky read, ladder-rankability-from-behind,
  silhouette-strength (**is it a specific memorable shape, not a generic kite** — NOT "is it an M";
  that was Solar's answer), premium-not-tacky glow, apex signature, and the distinctiveness veto above.
  Feed it the rear-chase + dark-sky + sil-rear + ladder sheets and tell it to **judge the rear-chase
  tile first** — and, for the distinctiveness veto, hand it a Solar tile to compare against.
- **The gate is BLIND to motion.** After it PASSes, hand the human the live PR preview for the
  motion/feel call (idle coil not whipping the tail across the cam, the flap cycle, surge pulse,
  wake) and flag any net-new silhouette element for approval.

---

## 6. Reuse, don't re-derive — but only the PLUMBING (copy the CODE, not the look)

Everything in this section is code infrastructure — factory structures, dials, helpers, test harnesses.
Copying it does NOT make your dragon look like Solar (see §0.5). What must be authored FRESH per dragon:
the part builders (wings/torso/head/tail geometry), the palette, the regalia motif, and the signature
silhouette. "Copy the structure" below always means the *data/code shape*, never the *visual result*.

- **`sovereignMats(def, glow, stage)`** in `js/dragonSovereign.js` — the stage-aware material factory:
  per-stage emissive-intensity ladders, saturated bloom-safe hues, `userData.baseEmissive/baseIntensity`
  for the surge tick. Copy the FACTORY STRUCTURE (a per-stage dictionary of materials); author your own
  materials inside it with your own hues, counts, and slots. "Re-hue" is the floor, not the ceiling —
  same wings in a new colour is the exact sameness we are avoiding; the geometry that consumes these
  materials is a new builder.
- **The ignition-ramp dial** (`igniteStage` 0/1/2/3) + the withheld-regalia gating pattern (§3a).
- **The dark-body + camera-facing-rim TECHNIQUE** (§3b) — build it with `flatTriMesh` (never
  `TorusGeometry`) and apply it to YOUR regalia shape. Do NOT reuse Solar's annulus/ring — that shape
  is Solar's signature; the reusable part is the opaque-dark + saturated-rim *construction*, not the
  ring.
- **The probes:** `tools/wingsymprobe.mjs` and the headless-flight `tests/smoke.mjs` — the two tools
  that catch the failure classes tricount/blueprint miss.
- **The ladder assert pattern** — a premium's own block in `tests/starters.mjs` (it reaches Eternal, so
  it can't ride the form-2-capped starter loop): tris monotonic, dials monotonic, motif-anchor waived
  where regalia is withheld at f0.
- **Surge-tick discipline:** anything that must keep its own hue (near-white spar tips, corona rim,
  rearward sigil) stays OUT of `spineMats`/`accentMats`; anything that should flare toward `surgeHi`
  goes in. Verify in `js/dragon.js` (the spine-mats surge loop).

---

## 7. The leapfrog for Pearl & Obsidian (the checklist)

Do these in round 1 so you skip Solar's second pass entirely:

1. Anchor to the referent; have Fable synthesize the plan (one combined sculpt+spectacle+rear-chase
   brief).
2. Author builders default-off; only the hero opts in.
3. Build the apex (Eternal) FIRST. In the SAME pass, design for rear-chase primacy and the spectacle
   triad — a signature silhouette that passes M-not-kite + owns-the-dark-sky, an ignition ramp, and
   the opaque-emissive lighting doctrine.
4. Then subtract down the ladder: gate each regalia MESH to a rung so every form adds hardware + light.
5. Verify by failure-class (tricount, blueprint, smoke/flight, wingsymprobe, dragonstudio) → then the
   combined Fable gate to PASS.
6. Checkpoint the human on the live preview for motion/feel + any net-new element, before finalizing.

**Pearl and Obsidian each need their OWN signature idea and palette** — reuse the METHOD and the CODE
PATTERNS, never Solar's arch/corona/hue (the roster's anti-collision rule; see `BOSS-DESIGN.md` §5b
for the same principle applied to bosses). The net win: the ladder / silhouette / rear-chase / spectacle
requirements Solar discovered late are INPUTS to your build sheet from the first line.
