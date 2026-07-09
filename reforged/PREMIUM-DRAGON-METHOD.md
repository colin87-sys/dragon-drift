# PREMIUM-DRAGON-METHOD.md — the SSSR dragon playbook

**Read this BEFORE starting a premium (SSSR) dragon rebuild — Pearl, Obsidian, and any apex after
them.** It is the distilled method from the Solar "Eclipse Dragon-King" rebuild (CP1 sculpt + CP2
spectacle), written so the next dragon starts from everything Solar learned and **leapfrogs the
CP1→"it's inert"→CP2 detour** — the single biggest time sink. The domain deep-dives live in
[`BOSS-DESIGN.md`](./BOSS-DESIGN.md) and [`BIOME-DESIGN.md`](./BIOME-DESIGN.md); this is the
**premium-dragon** counterpart. The worked reference implementation is
[`SOLAR-ECLIPSE-BUILDSHEET.md`](./SOLAR-ECLIPSE-BUILDSHEET.md) + `js/dragonSovereign.js`. The
lower-level engine/art laws this method assumes are in [`DRAGON-DESIGN.md`](./DRAGON-DESIGN.md) and
[`MODEL-CREATION.md`](./MODEL-CREATION.md) — read them for the per-form tri/overdraw budgets, the
eye-size ladder, the hue-hold law, and the blueprint grammar (this doc does not repeat them).

The core lesson in one line: **a gate-passing sculpt is not a grind-worthy dragon.** Solar passed the
static sculpt gate and still felt inert in play, because the gate is blind to MOTION and to
SPECTACLE. Bake the spectacle requirements in from round 1 and you gate once, not twice.

---

## 0. The fixed context every premium dragon designs against

- **The live game is `reforged/`.** 100% procedural (no asset files), vanilla Three.js r160, no build
  step, must hold **60fps on weak mobile**. Low-poly doctrine: FEWER, LARGER, confidently-faceted
  forms carried by SILHOUETTE.
- **Tri budget is PER FORM, not per dragon: each form < 6000 tris** on HIGH (`tricount --ci`'s per-form
  ceiling; ~13000 on ULTRA — see `DRAGON-DESIGN.md` §1). Solar's apex is ~2.2k, so there is large
  headroom — headroom is NOT a target; spend it only on silhouette/spectacle that reads.
- **Transparent/additive drawables are separately budgeted** (wisps, trails, motes): keep them few
  (Solar: apex ≤ 8, hard ceiling 12, alpha overlap ≤ 2 layers/px) and never as a glow crutch — see
  §3b + `DRAGON-DESIGN.md`. And **no repeated detail below ~8px at the 250px chase distance** (the law
  that killed Solar's 7-plate corona) — verify density at chase scale in a capture.
- **REAR-CHASE CAM IS THE PRIMARY VIEW** (behind + slightly above, at chase distance). This is THE
  design constraint, not a footnote. Players see the DORSAL/rear of the dragon; **the face is ~0% of
  the play view** — do not spend your best geometry or brightest emissive on it. (Solar's blazing brow
  star-gem faces away from the chase cam; we added a rearward `napeStar` to compensate. Design the rear
  first.) The requirement is that YOUR hero mass OWNS the rear frame — wherever it lives. Wings are
  often the largest surface, but nothing entitles them to the hero role: Phoenix's hero is the
  tail-train, and her wings are deliberately slender. Do not assume a wing-dominant layout.
- **Every dragon flies with its body long axis LEVEL.** The chase cam and the flap rig assume a
  horizontal body; a reared/upright/coiled-upright posture fights the rig and reads wrong. Vertical
  drama comes from DIALS ON APPENDAGES (wing dihedral/rake, tail lift, a crest), never from tilting
  the body. (If a referent is an upright/rampant pose — a rearing knight, a standing firebird — you
  translate that energy into raised appendages on a level body.)
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
  1. **Silhouette family** — Solar owns the M / cathedral-arch + twin-carpal-spires; Phoenix owns the
     bottom-heavy comet-train. Each new dragon needs a *different* signature shape. "A strong, specific,
     readable silhouette" is the requirement; the *answer* must be unique and must not repeat a shipped
     one. (A halo-shaped referent like Pearl is allowed BUT see §3b — it must differ from Solar's
     annulus in anchor/construction/read and clear the comparison veto.)
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

**Two shape-AGNOSTIC levers that guarantee SILHOUETTE-level difference (relational — they never
prescribe a shape). Reach for these FIRST, before palette; they're the cheapest way to clear the veto.
⚠ Each shipped dragon RETIRES the option it used — pick one that appears in NO shipped sheet.**
- **Compositional inversion — put your hero MASS in a frame region no shipped dragon uses.** Menu of
  regions (not exhaustive): top-heavy (Solar) · bottom-heavy (Phoenix) · lateral/symmetric-spread ·
  enveloping/radial (mass wraps the body) · forward-of-mass · asymmetric-offset. Two dragons whose mass
  lives in different regions cannot be confused — a stronger guarantee than a hue swap. **Top and bottom
  are now SPENT (Solar, Phoenix); the next dragon must pick another region.**
- **A different profile-FUNCTION family** — if silhouette comes from a curve/function keyed by a dial
  (§2), pick a mathematically different family than every shipped one. Menu: interior-peak (Solar's
  two-segment arch) · terminal-peak monotonic rake (Phoenix) · flat/drooped · broken-stepped ·
  concave-cupped · multi-lobed/scalloped. **Interior-peak and terminal-peak are SPENT; pick another.**
- **Housekeeping:** list the retired regions + function-families at the top of your sheet's
  distinctiveness table so the NEXT dragon sees what's taken. (This is how "examples become the next
  answer" is prevented — the menu shrinks, forcing genuine novelty.)

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
   Coexist → prove on a hero → migrate. **Rebuilding an EXISTING dragon? Coexist at the ROSTER level
   too:** author the rebuild as a NEW `DRAGONS` key (e.g. `phoenixEmpress`) that mirrors the original's
   rarity/cost/stats, leaving the shipped def byte-identical, so the owner can compare old-vs-new
   in-game before a later, owner-gated migrate/retire. Don't mutate the shipped dragon in place until
   that call.
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

- **Silhouette test, run in round 1 (shape-AGNOSTIC):** render the sheets
  (`node tools/dragonstudio.mjs <key> r0`), open the pure rear silhouette artifact
  (`reforged-captures/dragon-<key>-f3-sil-rear-r0.png`), and ask **"is this a SPECIFIC, memorable, instantly-nameable shape unique
  to this dragon — or a generic spiked delta-kite (a V)?"** The failure mode is genericness, not "not
  being an M." Solar's *answer* happened to be an **M** (twin carpal spires above a crowned head
  enthroned in the valley) because its referent is a monarch — but **the M belongs to Solar; do NOT
  reuse it.** Pearl and Obsidian each need a different specific shape. The transferable lesson is only
  the mechanism: a strong rear read comes from making the silhouette a deliberate **function/curve**
  (Solar baked an arch into the wing's vertical profile), not a flat mesh you hope reads — the *curve
  you choose* is yours to invent.
- **"Own the dark sky" test, round 1:** open the DARK-backdrop tile
  (`reforged-captures/dragon-<key>-f3-glide-dark-r0.png`, the rear-chase is its top-left panel). It
  must own the frame with **≥3 distinct COLOURED light structures** and **no dead-black / dead-empty
  center.** (A LIGHT-bodied dragon owns a dark sky by its lit SILHOUETTE + accent structures, not by a
  glowing body — the test is "does it read and hold", not "is it dark".) Solar failed this first pass
  (dim corona + black body center); the fix was a bright camera-facing rim + a "spine of light".
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

> ⚠ **Vocabulary note:** "regalia / coronation / confers / crown" is shorthand for *"withheld signature
> HARDWARE revealed per rung."* The persona need NOT be royal — a predator can earn its killing tools, a
> spirit its manifestation, a machine its armament. Don't let the royal wording pull your dragon toward a
> monarch (Solar is a king; that's Solar's, not the method's).

**(a) Growth-ladder payoff = signature-hardware WITHHOLDING + an ignition ramp.**
- **Gate the MESH, not just its brightness.** The whelp must LACK regalia the apex has, so ascending
  visibly confers it. Solar: the Hatchling has no star-gem, no mantle collar, no corona ring, no
  carpal spires, a linear (un-arched) wing, a stub tail. Each is gated on a dial that arrives on a
  rung (`starGemBloom>0`, `coronaValleys>0`, `coronaRing>0`, `carpalLance>0`, `archRise`,
  `napeStar>0`). If every form wears the full crown, Eternal confers nothing (Solar's original bug).
- **Ignition ramp:** a single `igniteStage` 0/1/2/3 dial gates WHICH emissives are lit, driven through
  a stage-aware material factory (Solar's `sovereignMats(def, glow, stage)` — copy this structure).
  Each form adds light AND hardware AND more of the signature silhouette move.
- **Cheap proxy the tests assert:** tris **monotonic increasing** across forms + YOUR regalia dials
  monotonic (Solar's happened to be gem/ring/arch — yours are your own). See `tests/starters.mjs` solar
  block — a premium reaches Eternal so it needs its OWN assert block; the shared loop hard-asserts
  `maxTierFor===2`.

**(b) Earned premium light — the anti-tacky doctrine (NON-NEGOTIABLE).**
- **Glow = emissive baked into OPAQUE flat-shaded facets, in SATURATED bloom-safe hues (sat ≥ 0.75,
  value ≤ 0.9)** so it blooms IN ITS OWN COLOUR under ACES + UnrealBloom. **Never additive
  washout shells** — that is the "tacky old dragon" look the owner rejected.
- **The law is VALUE CONTRAST, not "dark body" — your body may be dark OR light.** The premium read
  comes from a strong value gap between an OPAQUE MATTE body field and a THIN SATURATED emissive accent,
  so the glow reads jeweled, not smoky. Solar and Phoenix chose a DARK body + bright rims (a dark
  dragon). A LIGHT-bodied dragon (e.g. Pearl the white halo-knight) INVERTS it: a pale opaque body with
  saturated/darker or coloured accents and restrained emissive lines. **Do not read this doctrine as
  "make it dark"** — that would push every dragon to the same tone (a §0.5 sameness fail). The
  invariant is: matte opaque body + a contrasting saturated accent; the tone is yours.
- **At most ONE near-white element, and ZERO is fine** (the cap is a ceiling, not a required feature —
  don't add a white jewel just because Solar had one). If you do use it, keep it a tiny footprint
  (Solar: the f3 spar tips) and OUT of every `spineMats`/`accentMats` array, or the Surge tick lerps it
  to white and detonates the clip budget.
- **The reusable TECHNIQUE is "opaque matte volume + a thin saturated rim/edge" — apply it to YOUR
  regalia's shape.** It reads jeweled and can't be mistaken for a soft additive halo. It transfers to a
  crest, gorget, plume-heart, gem cluster, mantle edge — whatever your regalia is. **What is OFF-LIMITS
  is Solar's specific CONSTRUCTION** — a 12-facet flat-shaded ANNULUS at the dorsal yoke. If your
  referent identity genuinely IS halo-shaped (Pearl), it is not banned outright, but it must differ in
  ANCHOR, construction, and read from Solar's corona and clear the Fable comparison veto against a Solar
  corona tile. (`flatTriMesh`, never a `TorusGeometry`, is the build primitive to reuse — code plumbing,
  not a look.)

**(c) A signature silhouette — a DIFFERENT one per dragon.** One memorable, unmistakable geometric
idea that reads in pure silhouette AND owns the dark sky. Solar's was the cathedral arch + twin carpal
spires framing the eclipse ring — **that specific idea is spent; Pearl and Obsidian must each invent a
genuinely different one** (a different wing plan, a different crown/regalia form, a different dark-sky
light signature). Run the same two round-1 CHECKS against your new idea (is-it-specific-not-generic,
owns-the-dark-sky), but the idea being checked must be yours, not Solar's.

---

## 3.5 THE FAILURE-MODE FIREWALL — turn gate-discoveries into PRE-conditions (why this saves ~5 rounds)

Solar's Fable gate climbed 1.10 → 4.19 over ~7 rounds, then needed a whole second campaign (CP2). The
low first score was NOT because the design was hard — it was because the sheet let the builder start
from a near-blank brief and *negotiate the actual design at the gate*. Rounds 1–5 were spent
REDISCOVERING nameable failure modes one at a time. The fix is structural: **every failure the gate is
known to catch becomes a PRE-CONDITION the first build must satisfy before it is allowed near a
(high-effort, expensive) Fable round.** Do this and the first submission scores ~3.5 instead of ~1.1,
so the gate becomes VERIFICATION (2–3 rounds) instead of DISCOVERY (7–10), and you never ship an inert
dragon that needs a second spectacle campaign.

**These are QUALITY invariants, not a look.** ⚠ Read them as "don't be thin / muddy / generic / washed
out / inert" — NOT as "build Solar." None of them dictates a silhouette shape, a palette, or a motif;
those stay unique per §0.5. Where an invariant touches silhouette it forbids GENERICNESS and THINNESS,
never a particular outline.

**The firewall — hard invariants the FIRST build must pass (each is a real Solar-"before" failure or a
ledger lesson):**
1. **Confident faceted MASS, never spider-thin spars.** The retired Solar read as an insect/kite of thin
   equal-weight sticks with no surface. Wings/tail/crest must be built from FEWER, LARGER filled facets
   with real width — a reader must see mass, not a wireframe of spikes. (Your mass can live anywhere —
   Solar's in a wing wall, Phoenix's in a train fan + covert sheet — but it must EXIST.)
2. **A DOMINANT element + a real scale hierarchy.** Not a picket fence of equal spikes. One clear hero
   form, then graded supporting ranks (Solar: carpal lance ≫ pikes ≫ tips). "Everything the same size"
   is an automatic P0.
3. **A specific, mass-bearing SILHOUETTE that reads at rear-chase distance — not a thin kite/delta.**
   Run the §2 shape-AGNOSTIC test in round 0 (specific-not-generic + owns-the-dark-sky). The SHAPE is
   yours (§0.5); the firewall only forbids the generic thin-spike outline.
4. **Your hero mass FILLS the rear frame.** The retired Solar's rear view was nearly empty. No empty
   rear frame, no dead/empty center void. WHICH region it fills from and WITH WHICH PARTS is yours
   (§0.5 compositional inversion) — "fills," not "rises" (rising is Solar's top-line; a bottom-heavy or
   enveloping design fills without rising), and no mandated part inventory.
5. **Clean, deliberate EDGES — no ragged/torn trailing edges.** The retired membrane edges looked
   shredded. Scallops/serrations are fine if DESIGNED; accidental jaggedness is a P0.
6. **Opaque matte body + a CONTRASTING saturated emissive accent — no additive washout, no olive/khaki
   "gold".** The §3b value-contrast doctrine, enforced up front: strong value gap between the matte body
   field and the lit edges/tips (body dark OR light — not necessarily dark); ≤1 tiny near-white (zero OK).
7. **No muddy/noisy surface texture.** The retired leopard-spot skin read as noise. Large confident
   colour fields; detail comes from FACETS and emissive lines, not busy texture.
8. **The spectacle triad is PRESENT in the sheet (§3), not deferred.** Withheld regalia + ignition ramp,
   earned light, a signature silhouette — so you never ship, playtest, feel "inert," and reopen a CP2.

**ROUND-0 SELF-AUDIT (the cheap gate before the expensive one).** Before spending a high-effort Fable
round, the implementing agent runs `node tools/dragonstudio.mjs <key> r0` (renders the full sheet set
for every reachable form) and audits the apex tiles — `dragon-<key>-f3-sil-rear-r0.png`,
`dragon-<key>-f3-glide-dark-r0.png` (rear-chase = its top-left panel), and the ladder sheet — HARSHLY
against the 8 invariants above + the §0.5 distinctiveness axes, then fixes every obvious violation. Cheap self-gate first, expensive Fable gate second — so **Fable never
sees a build below ~3.5.** This does NOT replace the Fable gate (see §5 — the high-effort Fable
checkpoints remain essential and non-negotiable); it raises the floor Fable starts from so the gate
verifies in 2–3 rounds instead of discovering over 7–10.

**PRE-SCORE THE SHEET.** The build sheet carries, before a line of code: this firewall checklist, the
per-rubric-axis TARGET scores (aim every §5 axis ≥ 3.5 at round-0, no axis a known P0), the
rear-chase/spectacle/silhouette requirements, and the reusable-kit inventory (§6). A pre-scored sheet
is the actual time-saver — the design is decided on the sheet, not litigated at the gate.

**RECORD SETTLED DECISIONS + AUDIT RULINGS — so the next chat doesn't re-litigate them.** As owner
decisions get made and audits rule on suspects (e.g. "this dial that echoes a shipped dragon is
kept-as-justified because <reason>, not leakage"), write them into a **"SETTLED — do NOT re-litigate"**
block near the TOP of the sheet, each with its reasoning or a pointer to it. A design/build handoff to a
fresh implementation chat MUST read that block first. Without it, every new chat re-opens the same
resolved calls (rename this dial? is the persona too close? is the tone a clone?) and burns the rounds
the pre-score was meant to save. Closed calls stay closed unless the builder raises a real objection to
the owner — never silently changed.

---

## 4. Verify by FAILURE-CLASS (four tools, four failure modes)

A green budget check says nothing about whether the dragon renders in flight. Run all of these; each
catches a class the others are blind to. All from `reforged/`:

| Class | Tool | Catches |
|---|---|---|
| **Budget** | `node tools/tricount.mjs --ci` (whole roster; NO key arg — it reports every dragon, per-form ceiling; exits 1 if any form is over) | tris/form, over per-form 6000, non-monotonic ladder |
| **Integrity** | `node tests/blueprint.mjs` | bad builder/shader/layer names, roster validation |
| **Runtime** | `node tests/smoke.mjs` (headless browser flight) | **per-frame crashes → invisible dragon** (two such bugs only surfaced here, NOT in tricount/blueprint) |
| **Symmetry** | `node tools/wingsymprobe.mjs <key>` | asymmetric wings across the flap poses (mirror-built geometry must stay PASS) |
| **Aesthetics** | `node tools/dragonstudio.mjs <key> <round>` (e.g. `<key> r0`; renders the FULL sheet set for every reachable form to `reforged-captures/`) | rendered ladder + rear-chase + dark-sky + sil-rear sheets — the evidence the Fable gate reads |
| **Also run** | `node tests/starters.mjs` | per-form geometry asserts incl. the premium's own ladder block |

Runtime gotchas that produced the "invisible dragon" crashes (guard against them):
- A torso builder must return `coreGlow` as a **mesh or `null`**, never a color number — the
  orchestrator only builds the real back-glow sprite (with the `userData.base` the flight tick reads)
  when `coreGlow` is falsy; a number makes it skip that and crash on `.userData.base` every frame.
- A new TORSO must publish the full ATTACH CONTRACT the orchestrator + other parts consume:
  `wingRootL/R`, `headBase`, `tailAnchor`, `halfWidthAt`, `bodyMidY`, `riderSocket`, plus
  `parts.spinePoints` and the `motifAnchor`. Copy the exact list + shapes from
  `SOLAR-ECLIPSE-BUILDSHEET.md` §4 — a missing field null-derefs at build.
- The wing rig MUST publish `wingPivotL/R`, `wingMidL/R`, `wingTipL/R`, and a tip `marker` (FX handle)
  or the flap path null-derefs and the dragon fails to select. **The FX marker + `wingElements` tip
  use their OWN copy of the wing profile formula** — if you change the wing's vertical profile
  (dihedral/arch), update BOTH or the wingtip trails + aero-shear detach from the moved tip.

---

## 5. The Fable gate — one combined brief, run as a ratchet (HIGH-EFFORT, non-negotiable)

**The high-effort Fable checkpoints are the most important quality mechanism in this method — do not
skip, downgrade, or replace them.** The firewall + round-0 self-audit (§3.5) do NOT remove the gate;
they make each gate round CHEAP by ensuring Fable only ever sees a ~3.5+ build, so the gate VERIFIES
in 2–3 rounds instead of DISCOVERING over 7–10. Always spawn Fable at high effort, and run it as a
standing checkpoint at every critical step (design synthesis, apex-first PASS, each spectacle change,
and any owner-facing checkpoint). The cheap self-gate raises the floor; the expensive Fable gate is
still what certifies the ceiling.

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
  motion/feel call (idle coil not whipping the tail across the cam, the flap cycle, surge pulse, wake,
  any fold/fan display) and flag any net-new silhouette element for approval.

**Fable works in THREE modes — use the right one (all high-effort):**
1. **SYNTHESIZE** (design) — at the start, hand Fable the REFERENT and the constraints and have it
   author the plan (the "referent → Fable-synthesized plan" step). **Feed it the referent IMAGES
   directly** (it has the Read tool) — a plan anchored to the owner's actual references beats a generic
   one. If the owner named a specific look, pass those image paths.
2. **DIAGNOSE** (targeted) — when ONE part underdelivers, brief Fable to diagnose just that part and
   return a concrete fix plan (Solar's tail went from "afterthought" to a passing hero this way). Scope
   it narrowly; tell it NOT to re-litigate the parts that already passed.
3. **GRADE** (the gate) — the PASS/FAIL ratchet above.
For the DISTINCTIVENESS veto in any mode, **hand Fable comparison tiles** (a Solar tile, plus the
nearest roster neighbours) so "does it read like a shipped dragon?" is judged against pixels, not memory.

**Calibrate the gate on the SHIPPED dragon FIRST.** Before grading your new build, run the exact same
Fable brief on the currently-shipped version of the dragon (or, for a net-new dragon, the nearest
shipped roster neighbour) — it should FAIL / score low. If a fresh gate PASSES the thing you're
replacing, the brief is too soft and the pipeline is broken — harden it before trusting any PASS. The
old-vs-new delta is also the owner's compare evidence (§1 roster coexistence).

**Checkpoint discipline (this is important):** run a high-effort Fable checkpoint at EVERY critical step
— design synthesis, apex-first PASS, each spectacle change, and before every owner-facing checkpoint —
and gate on PASS before proceeding to the next step. Do not batch changes past a failing gate.

**Surface the ONE load-bearing decision to the human BEFORE banking a frozen sheet.** Every design has a
single choice everything else hangs on (Phoenix: "hero = the streaming train vs the front wing-spread").
Present that one choice and get it blessed before writing the full build sheet — don't freeze a sheet on
an unconfirmed core, and don't bury the human in small choices that have obvious defaults.

---

## 6. Reuse, don't re-derive — but only the PLUMBING (copy the CODE, not the look)

Everything in this section is code infrastructure — factory structures, dials, helpers, test harnesses.
Copying it does NOT make your dragon look like Solar (see §0.5). What must be authored FRESH per dragon:
the part builders (wings/torso/head/tail geometry), the palette, the regalia motif, and the signature
silhouette. "Copy the structure" below always means the *data/code shape*, never the *visual result*.
**You never start from the stick again:** Solar was told "build fresh, don't reuse the failed parts"
because the old parts were below standard — but that quality floor is now PROVEN. Pearl/Obsidian/Phoenix
start from this kit's quality floor (adapt the patterns) while their identity stays 100% unique. Reusing
the KIT is the opposite of reusing the LOOK.

> ⚠ **When mining `SOLAR-ECLIPSE-BUILDSHEET.md` (or any shipped sheet), take only CONTRACTS — the
> attach list, the return shapes, the dial-wiring, the test patterns. Do NOT shop its DESIGN features**
> (a specific dial like `pinionSlots`, a "banner-lift per form" beat, a motif). Design features are that
> dragon's look; lifting them is how sameness sneaks in through the back door. Contracts are plumbing;
> features are look.

- **`sovereignMats(def, glow, stage)`** in `js/dragonSovereign.js` — the stage-aware material factory:
  per-stage emissive-intensity ladders, saturated bloom-safe hues, `userData.baseEmissive/baseIntensity`
  for the surge tick. Copy the FACTORY STRUCTURE (a per-stage dictionary of materials); author your own
  materials inside it with your own hues, counts, and slots. **Re-hueing alone is NOT distinctiveness** —
  same wings in a new colour is exactly the sameness we're avoiding; the geometry that consumes these
  materials MUST be a new builder.
- **The ignition-ramp dial** (`igniteStage` 0/1/2/3) + the withheld-regalia gating pattern (§3a).
- **The matte-body + camera-facing-rim TECHNIQUE** (§3b — value contrast, body dark OR light) — build
  it with `flatTriMesh` (never `TorusGeometry`) and apply it to YOUR regalia shape. Do NOT reuse Solar's
  annulus/ring — that shape is Solar's signature; the reusable part is the opaque-matte + saturated-rim
  *construction*, not the ring.
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

Do these in round 1 so you skip Solar's 7-round climb AND its second pass entirely:

0. **Roster-neighbour survey (required first sheet section).** Enumerate your nearest shipped neighbours
   by hue-family AND silhouette (read `js/dragons.js` + black-fill/`dragonstudio` tiles), and list the
   silhouette-regions + profile-function families ALREADY RETIRED by shipped dragons (§0.5). Your design
   must avoid all of them. (Solar: top-heavy M / interior-peak arch. Phoenix: bottom-heavy train /
   terminal-peak rake.) This is the anti-sameness map — do it before designing, not after.
1. Anchor to the referent; have Fable synthesize the plan (one combined sculpt+spectacle+rear-chase
   brief). **PRE-SCORE the sheet** (§3.5): bake in the firewall checklist, the reusable-kit inventory,
   and per-axis target scores before any code.
2. Author builders default-off; only the hero opts in. Start from the KIT's quality floor (§6) — never
   the stick.
3. Build the apex (Eternal) FIRST. In the SAME pass, satisfy the FIREWALL (§3.5) + rear-chase primacy +
   the spectacle triad — a signature silhouette that passes specific-not-generic + owns-the-dark-sky
   (its shape is YOURS, not Solar's), an ignition ramp, and the opaque-emissive lighting doctrine.
4. Then subtract down the ladder: gate each regalia MESH to a rung so every form adds hardware + light.
5. **ROUND-0 self-audit** (§3.5): render one capture, audit HARD against the firewall + distinctiveness
   axes, fix obvious violations — so the build is ~3.5+ BEFORE Fable sees it.
6. Verify by failure-class (tricount, blueprint, smoke/flight, wingsymprobe, dragonstudio) → then the
   HIGH-EFFORT combined Fable gate (§5), run as a standing checkpoint, to PASS (now 2–3 rounds).
7. Checkpoint the human on the live preview for motion/feel + any net-new element, before finalizing.

**Handing a finished sheet to a fresh IMPLEMENTATION chat?** The handoff prompt must point it at (in
order) the method, the sheet, and — FIRST among the sheet's sections — the **"SETTLED — do NOT
re-litigate"** block (§3.5), so it builds the audited design instead of re-deriving it. An
implementation chat's job is to BUILD the contract (apex-first, round-0 self-audit, verify-by-class,
high-effort Fable gate to PASS, owner motion checkpoint), not to redesign it; closed calls stay closed
unless it raises a real objection to the owner.

**Pearl and Obsidian each need their OWN signature idea, tone, and palette** — reuse the METHOD and the
CODE PATTERNS, never a shipped dragon's silhouette/tone/motif/hue (the roster's anti-collision rule; see
`BOSS-DESIGN.md` §5b for the same principle applied to bosses). Note the tone axis explicitly: Solar and
Phoenix are both DARK-bodied — a third dark dragon would be tonal sameness even with a distinct
silhouette, so a light-bodied or otherwise tonally-distinct dragon is now the un-taken lane (§3b). The
net win: the ladder / silhouette / rear-chase / spectacle requirements Solar discovered late are INPUTS
to your build sheet from the first line.
