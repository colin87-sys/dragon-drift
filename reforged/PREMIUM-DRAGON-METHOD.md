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

- **Silhouette test, run in round 1:** render the pure rear silhouette (`dragonstudio … sil-rear`) and
  ask **"does the rear read as an M, not a kite (a V)?"** Solar's wow move was one geometric idea: a
  V-delta reads as a spiked kite; monarchs (Bahamut, Bewilderbeast) have the **M** — twin carpal
  spires rising ABOVE a crowned head enthroned in the valley between them. If the rear top-line is two
  flat ramps, you have a kite. Make the wing's vertical profile a **function** (an arch), not a mesh
  you hope reads.
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
- **Eclipse-by-construction** (the reusable "dark + rim" motif): a DARK opaque body wearing a THIN
  saturated rim reads as jeweled, not smoky — and can't be mistaken for a soft additive halo. Solar's
  corona = a 12-facet flat annulus (`flatTriMesh`, NO torus): dark moon-disk + a bright camera-facing
  violet/amber rim. Reuse the shape for any "halo/orb/gem-ring" motif.

**(c) A signature silhouette.** One memorable, unmistakable geometric idea that reads in pure
silhouette AND owns the dark sky. Solar: the cathedral arch + twin carpal spires framing the eclipse
ring. Pearl and Obsidian each need their OWN one-idea signature (do not reuse the arch) — but run the
same two round-1 checks against it (M-not-kite, owns-the-dark-sky).

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
  ≤ 2, plus binary VETOES (Solar used: washout = any large emissive blooming to white; collision = the
  corona mistakable for pearl's halo). Iterate round by round — Solar went 1.10 → 4.19 (CP1) and
  3.77 → 4.13 → 4.27 → 4.33 (CP2). **The rendered captures are the evidence each round, not vibes.**
- **ONE combined brief that grades sculpt + spectacle + rear-chase together**, so you gate once. Weight
  the rubric toward the rear-chase tile: rear-chase dark-sky read, ladder-rankability-from-behind,
  silhouette-majesty (M-not-kite, scale hierarchy), premium-not-tacky glow, apex signature. Feed it
  the rear-chase + dark-sky + sil-rear + ladder sheets and tell it to **judge the rear-chase tile
  first.**
- **The gate is BLIND to motion.** After it PASSes, hand the human the live PR preview for the
  motion/feel call (idle coil not whipping the tail across the cam, the flap cycle, surge pulse,
  wake) and flag any net-new silhouette element for approval.

---

## 6. Reuse, don't re-derive (copy these from Solar)

- **`sovereignMats(def, glow, stage)`** in `js/dragonSovereign.js` — the stage-aware material factory:
  per-stage emissive-intensity ladders, saturated bloom-safe hues, `userData.baseEmissive/baseIntensity`
  for the surge tick. Copy the STRUCTURE; re-hue per dragon.
- **The ignition-ramp dial** (`igniteStage` 0/1/2/3) + the withheld-regalia gating pattern (§3a).
- **The eclipse-by-construction opaque annulus** (§3b) — `flatTriMesh` dark body + camera-facing
  saturated rim, for any halo/ring/orb motif.
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
