# HANDOFF — Build the Gravelight Revenant (Dragon Drift)

**For the next chat.** Everything you need to start building the **Gravelight Revenant** — the first of
the "Fresh Five" premium dragons — from a cold start. The design phase is DONE and merged to `master`
(PR #404). Your job is the BUILD. Read this top-to-bottom, then read the two canonical docs it points
to, then cut the branch and run increment I0.

---

## 0. TL;DR — where we are

- The **Fresh Five** premium dragon plan is merged to `master`: `reforged/FRESH-DRAGONS-SYNTHESIS.md`
  (index + anti-collision + build order) and five `*-BUILDSHEET.md` files. All five passed three critic
  gates (a Fable design pass + an Opus rear-chase gate + a Fable round-2 gate).
- The owner picked the **Gravelight Revenant** to build FIRST (it ranked #1 of the five on appeal).
- Its **build-ready v1 contract** is `reforged/WRAITH-GRAVELIGHT-BUILDSHEET.md` **§B** — research-grounded
  (D&D dracolich · Skyrim Durnehviir · Pokémon Dragapult) and feasibility-audited against the real engine.
  **§B is the authority. This handoff is a digest of it — when they disagree, §B wins.**
- Nothing has been built yet. No `js/dragonRevenant.js` exists. Roster is byte-identical.
- Two concept images were generated for art direction (external, not in repo) — a low-poly chalk-ivory
  skeleton with a hollow ribcage glowing grave-green through the ribs, tattered bone-finger wings with
  open gaps, a vertebra tail, green eye-sockets. That is the target look.

## 1. FIRST ACTIONS (read order — do not skip)

1. `reforged/DRAGON-DESIGN.md` — THE METHOD (the premium-creature playbook): the 13 failure modes to kill
   on sight, the wing kit, the motion kit (−anchor tail chain, `wingParts` wrist fold, the mirror
   convention), glow-as-components, the tier ladder, the verification harness §9, the pre-ship checklist.
   This is your rubric and it OVERRIDES intuition.
2. `reforged/WRAITH-GRAVELIGHT-BUILDSHEET.md` — the WHOLE file. §0–§10 are the concept + the two prior
   gate passes (§R Opus rear-chase, §F Fable round-2 — their rulings are SETTLED). **§B is your build
   contract.** §B.6 is the feasibility audit; §B.7 is the increment plan; §B.8 is the test spec.
3. `reforged/VESPER-NIGHTGLASS-BUILDSHEET.md` + `js/dragonVesper.js` — the reference PREMIUM build. The
   Revenant reuses its PATTERNS heavily (knapLoft, the fingered-bat wing recipe, splitFan isBone chain,
   the scapular cowl overlap, the mats factory, the outer-wrapper mirror). Cite these, don't reinvent.
4. `CLAUDE.md` + skim the newest `leapfrog/lessons/` — especially the four from 2026-07-13 (the Fresh-Five
   method, the two rear-chase gates, and **`2026-07-13-audit-the-sheet-against-the-real-rig-before-building.md`**
   — read that one, it's why §B's substitutions exist).

## 2. THE PROCESS (non-negotiable, from CLAUDE.md + DRAGON-DESIGN §8)

- **Coexist → prove on the hero → migrate.** New builders self-register DEFAULT-OFF in a fresh module;
  a new roster key opts in; **everything already shipped stays byte-identical (prove it with tricount +
  the roster tests).** Build the APEX form first, gate it to PASS, then ladder DOWN.
- **The Fable gate is MANDATORY and the builder never judges its own work.** Each increment ends with a
  FRESH high-effort **Fable** harsh-critic spawn judging REAL renders against this sheet (numeric bar:
  avg ≥4.0, no axis ≤2, binary vetoes). FAIL → apply its numbered directives verbatim → re-gate.
  Budget ~1 rework per increment; a first-try pass means the bar was too soft.
- **THE RULE:** after every meaningful change add a NEW lesson file `leapfrog/lessons/<YYYY-MM-DD>-<slug>.md`
  (one file per lesson — never edit LEAPFROG.md, never a sequential L### number). A missing lesson per
  checkpoint is a process defect.
- **Verify before claiming** (harness in §7 below). The human judges motion/feel/tone on the PR preview —
  the gate is structurally blind to those.

## 3. GIT / BRANCH PROTOCOL (important — PR #404 already merged)

PR #404 is **merged and closed** — it is finished; do NOT reuse it or stack commits on its history.
Follow-up work is a FRESH change:
```
git fetch origin master
git checkout -B claude/dragon-concept-research-ormkdg origin/master   # same branch name, restarted from master
# ... do the build work, commit ...
git push -u origin claude/dragon-concept-research-ormkdg              # force-with-lease OK if it only carried merged history
```
Then open a NEW draft PR (it is a new PR, not #404). Commit messages end with the repo's Co-Authored-By +
Claude-Session trailers. Never push to a different branch without explicit permission.

---

## 4. THE REVENANT — build-ready digest (authority: WRAITH-GRAVELIGHT §B)

### 4.1 Identity contract
- key `revenant` (fully additive) · `name:'Gravelight Revenant'` · `title:'Nothing stays buried'` ·
  `rarity:'SSR'`/`maxRarity:'SSSR'` · `cost:2400` · `stats { speed 1.09, handling 1.12, drain 0.78,
  regen 1.24 }` · `fx.auraColor '84,240,78'` · `accentHue: 0x54f04e` · `forms[]` accretive length 4 ·
  `maxTierFor===3` · `hasStyle`.
- **Frozen identity laws (SETTLED — do not re-litigate):** light through bone (ghost-fire seen only
  THROUGH apertures, never painted ON bone — *"a lantern, not a lamp"*); **BLEACHING** (body value RISES
  up the ladder — the mirror of Vesper's darkening); elegant undeath (clean bone, crescent cutouts, NO
  gore/flesh/red); zero warm hues / zero gold (the Pearl firewall); build vehicle = a NEW
  `js/dragonRevenant.js` bone-lattice ASSEMBLY (forbidden imports: the organism/smooth-hull family).

### 4.2 The read
- **One-word rear silhouette: SKELETON** — the roster's only holes-in-the-black-fill dragon. Lean
  bone-frame, strong draconic wing OUTLINE with clean interior crescent through-holes, dorsal vertebra
  ridge saw-lining the top edge. ONE connected outline component; holes interior only; every rear-visible
  wing-bay hole ≥0.05 planform (≥~8px at the 250px chase read — the §F pixel-floor).
- **Landmark punctuation (4):** wing-bay through-holes framed by finger bones; the dorsal spine-gap
  grave-light leak (the rear-chase carrier, ANIMATED by the gap-pulse); lit tail-vertebra gaps + the
  spectral wisp tip trailing toward the lens; antler-tines breaking the skull outline.
- **Motif — THE GRAVE HEART:** an opaque-faceted (but see §4.4) emissive teardrop caged in the ribs,
  grave-green `0x54f04e` (heart-cap `0x9af08a` → base `0x2e8a3a`), seen only through the rib windows;
  grows as the cage opens. Growth verb: **HOLLOWING**.

### 4.3 The builders — `js/dragonRevenant.js` (self-registering, nullable default-off dials)
Names are LOCKED. Reuse the cited `dragonVesper.js` patterns; fresh geometry.
- **`ossuaryTorso`** — vertebra beam + hollow rib cage + keel/pelvis + scapular cowls + the Grave Heart.
  Publishes the full attach contract (`wingRoot(side)`, `headBase`, `tailAnchor`, `keelTopAt`,
  `halfWidthAt`, `bodyMidY`, `riderSocket`), `spinePoints` (≥2 inflections: skull-low stoop → rise over
  pelvis → tail counter-lift), `motifAnchor` (cage center), and **`coreGlow` = the Grave Heart mesh**
  (the real Solar hook — NOT the Vesper `coreGlow:null` guard). `vertebraUnit(z,s)` (~26 tris: centrum
  mini-loft + a 4-tri neural-spine TENT + 2 nubs) is the shared repeating element for neck (3→5) +
  dorsal (9) + tail (8→12); ACCUMULATE all units into ≤3 `flatTriMesh` per tier (never 26 meshes — the
  Pearl 253-draw lesson). Rib hoops = ≤6 arc staves/side with TRUE through-window voids between them;
  f0 seals them with an inset (never coplanar) cartilage panel.
- **`phalanxShroudWings`** (the HERO) — the Vesper fingered-bat recipe with the skin mostly removed:
  arm (humerus+radius bone-tents, elbow ≥20°, wrist at `wristT 0.24`) → **4 metacarpal fingers**,
  `lenFrac [1,.80,.62,.46]` (dominant + decay), each a bowed `ridge()` tent with a rim-catch cap →
  SHROUD panels on the OUTER two bays only (inner bays = through-gap by OMISSION, free fill), trailing
  edge = 2 clean swept CRESCENT bites (≥4-seg béziers, cup 0.30) → ONE connected single-layer translucent
  hem band. `wingParts 3` (pivot/mid/tip), hand carries fingers+panels+hem as one rigid sheet with the
  −anchor rest pose, LEFT via an OUTER `lmirror scale.x=−1` wrapper. Apex span:body 2.4×, sweep 22°,
  dihedral 12°. Fold ≤0.60 of glide and the through-gaps VANISH when folded (the transformation).
- **`revenantSkullHead`** — a true draconic skull (~16 facets), 6-tooth row, 2 back-swept antler-TINES
  (NOT 4 horns), RECESSED orbit sockets with a floating pinpoint octahedron eye (`0x76f068`) seated
  ~0.6 socket-depth inside; socket:skull ladder 34→18% while pinpoint intensity RISES (waif→wraith).
  Socket vents (Surge). `feverEye 0x9af08a` overrides the rig's magenta default.
- **`vertebraeWhipTail`** — an isBone 4-joint −anchor chain (verbatim Vesper `splitFan` pattern) of
  vertebra units → spade → a **spectral wisp tip** (single-layer translucent taper, cruise NON-emissive
  = spectral by transparency, Surge-flared). `wispLen` 0→0.55 up the ladder.

### 4.4 THE ENGINE-TRUTH GOTCHAS (why §B differs from the concept — DO NOT re-break these)
These are real hooks/traps read from `js/dragon.js` this session. Getting one wrong ships a silent defect.
- **The Grave Heart uses the real `parts.coreGlow` hook** (dragon.js:1147–1151 ticks `material.opacity`:
  floor → ×1.5 boost-breathe → Surge blaze). That hook REQUIRES `transparent:true` — so the heart is the
  ONE sanctioned transparent mesh in the cage (single layer along any ray; ≥0.08 clearance from every
  stave so no z-fight). Counted in overdraw.
- **The grave-light family (gap-leaks, socket vents, wisp) MUST go in `materials.flareMats`, NOT
  `spineMats`.** spineMats get the global WARM cruise fresnel rim (`0xfff0d8`) which would pollute the
  118° hue. flareMats are Surge-flared but never rim-lit. (This is the Pearl-firewall's plumbing.)
- **Exterior bone emissive MUST be `0x000000`.** The rig ticks `bodyMat.emissiveIntensity` (0.12 cruise /
  0.35 Surge, dragon.js:1193); black emissive makes that a no-op → "no lit exterior bone" survives.
- **Full fever-palette override.** The rig defaults to MAGENTA on Surge — override EVERY hook
  (`feverWing 0x000000` = wings stay silhouette, `feverEye 0x9af08a`, `surgeHi 0x8af07e`, `feverWash`,
  trail/boostTrail) or it renders hot-pink / white-gold. §B.4c has the full table with dragon.js lines.
- **Substitutions (v0 dials that have NO rig hook):** `downFrac` → the SNAP rides `glidePow 1.6` +
  `tipLag 1.2` + `flapAmp 0.85`/`flapBias 0.9` (all real dials); per-finger micro-lag → CUT from v1
  (sub-pivots = rig surgery); `clickStep` bone-rattle → deferred default-off. A nullable `downFrac`
  poser easing is a FLAGGED optional engine need, not required for v1.
- **Overdraw budget:** cruise 5/5 transparent (2 hems + heart + wisp + trail); Surge 8/8 (Surge wisp
  cards default **2**, not 3 — the 3rd is behind perf-HUD proof). ≤2 alpha layers on any chase ray.
- **The hollow-cage render (proven feasible):** the whole cage is OPAQUE, windows are geometry ABSENCE
  (nothing to sort), the far-side inner rib faces are painted the umber-green `recess 0x464b3d` tier via
  `knapLoft`'s per-column matOrFn so the cavity reads deep while the holes stay true holes.

### 4.5 The HOLLOWING ladder (4 forms — f0 Grave Whelp · f1 First Waking · f2 Open Cage · f3 Gravelight Revenant)

| dial | f0 | f1 | f2 | f3 | assert |
|---|---|---|---|---|---|
| `ribWindows`/side | 0 sealed | 2 | 4 | 6 | exact {0,2,4,6} |
| hole-fraction (side) | 0 | 0.08 | 0.16 | 0.26 | ±0.03, ↑, each ≥px-floor |
| wing through-gap (planform) | 0.18 | 0.26 | 0.34 | 0.38 | ↑; f3 ∈ 0.30–0.42; bay ≥0.05 |
| `coreBlaze` | 0.15 | 0.40 | 0.70 | 1.00 | ↑ |
| `socketVent` | 0 | 0 | 0.5 | 1.0 | ↑ |
| vertebrae neck/dorsal/tail | 3/9/8 | 4/9/9 | 4/9/10 | 5/9/12 | total 20→26 ↑ |
| lit tail gaps / `gapPulse` | 0/off | 0/off | 1/on | 3/on | ↑ |
| fingers / shroud panels | 2/1 | 3/1 | 4/2 | 4/2 | {2,3,4,4} |
| `crescentDepth` | 0 | 0.5 | 0.8 | 1.0 | ↑ |
| `wispLen` (×tail) | 0 | 0 | 0.30 | 0.55 | ↑ |
| span:body | 1.6× | 1.9× | 2.2× | 2.4× | ↑, apex ≤2.5 |
| socket:skull | 34% | 28% | 22% | 18% | ↓ (pinpoint intensity ↑) |
| body hex (BLEACH) | `0x9a9284` | `0xaaa392` | `0xbdb6a4` | `0xcfc9b8` | **value monotonic ↑** |
| `glowLevel` | 0.25 | 0.5 | 0.75 | 1.0 | ↑ |
| tri target | ~1.7k | ~2.5k | ~3.5k | ~4.7k | ↑, ±20%, <6000 |

Growth-verb asserts: HOLLOWING = hole-fraction ↑ + ribWindows ↑ + litGaps ↑ + throughGap ↑;
BLEACHING = body value ↑. Every rung adds a CATEGORY (aperture + light + a silhouette move), not scale.

### 4.6 BUILD INCREMENT PLAN (coexist → hero → ladder; one fresh Fable gate per increment)
- **I0 — stub + tooling + calibration.** Add the `revenant` key (additive; roster byte-identical) +
  `js/dragonRevenant.js` with 4 placeholder builders satisfying the attach/flap contract. LAND the
  silhouette **hole-metric** (`holeMetric()` in `tools/silhouetteCore.mjs` + `--holes` on `silhouette.mjs`
  — a flood-fill on the coverage buffer; retro-useful as the roster's MITTEN detector). Calibrate the
  Fable gate on Pearl + Phoenix tiles with the standing veto *"does any frame read holy instead of
  haunted?"* before building any bone.
- **I1 — `ossuaryTorso` + THE GRAVE HEART.** Vertebra beam + neck + rib cage + f0 seal + keel/pelvis/
  scapulars + heart on the coreGlow hook. Gate: cage reads DESIGNED bone at 250px (not damage); heart
  reads lantern-not-lamp; no holy read on the pale backdrop.
- **I2 — `phalanxShroudWings`.** Bones → panels → crescents → hem → fold. Gate: gap band 0.30–0.42 +
  per-hole px-floor headless; fold ≤0.60 transformation; wingsymprobe Δ0.000; trio black-fill vs
  Vesper's wing family (must not read as re-skinned Vesper).
- **I3 — `revenantSkullHead` + `vertebraeWhipTail`.** Skull/sockets/pinpoints/tines/teeth; tail chain +
  spade + wisp. Gate: socket waif→wraith ladder in face crops; tail-ray alpha count; tine no-tangent.
- **I4 — the HAUNTING.** Gap-leak discs + gap-pulse tick (static fallback allowed) + socket vents +
  Surge wisp cards + the FULL fever-override table. Gate: two-state cruise/Surge proof (seamprobe
  pattern) + Surge corridor glare check + the 8/8 overdraw recount.
- **I5 — the HOLLOWING ladder.** `forms[]` (accretive, length 4) + the `tests/starters.mjs` `revenant`
  block (§B.8) + tricount ladder + full capture set. Gate: full-ladder verdict; then the PR preview
  carries the residuals (§4.8) to the human.

Each gate is a FRESH high-effort Fable spawn; FAIL → numbered directives applied verbatim; builder never
judges its own output. Add a lesson file per increment.

### 4.7 VERIFICATION HARNESS (run from `reforged/`, per increment + full at I5)
- Suites: `node tests/blueprint.mjs` · `node tools/tricount.mjs --ci` (FULL roster — prove byte-identity)
  · `node tests/starters.mjs` · `node tools/creaturestress.mjs --ci` (co-resident draws).
- Studio: `node tools/dragonstudio.mjs revenant` — all 4 forms, states glide/fold/bank/surge, angles
  rear-chase/side/rear-¾/top, deterministic phase, 3 backdrops (the PALE backdrop is the primary
  silhouette judge + the ivory-on-bright-sky risk frame; the warm-gold backdrop is the Pearl-firewall
  stress frame).
- Black fills: `tools/silhouette.mjs revenant side|rear|top [form] --holes` (+ `--wings-only`).
- Motion: `tools/flapstrip.mjs` 5-phase corridor check (±10° empty at ALL phases + folded);
  `tools/wingsymprobe.mjs` Δ0.000; the two-state cruise/Surge pair (seamprobe pattern).
- In-game: `tools/gameshots.mjs` (`?cleanshot`) — integration/biome legibility only, never aesthetics.
- The `tests/starters.mjs` `revenant` block asserts (full list in §B.8): tris ↑ <6000; hole-fraction
  {0,.08,.16,.26} ↑ with px-floors; outline = 1 connected component; **body value ↑ (BLEACH invert)**;
  Pearl firewall (sat ≤0.12, zero gold-family diffuse, zero warm emissive); lantern law (cruise emissive
  = heart ≥70% + pinpoints/gaps ≤30%, every bone mat emissive == 0x000000); fever firewall (all
  fever-state hues ∈ 118°±20); ladder dials monotonic; wing law (fingers {2,3,4,4}, dominant decay,
  elbow ≥20°); rig contract (wingPivot/Mid/Tip exist, fold ≤0.60, wingsym Δ0, 4 isBone tail joints);
  ≥2 spine inflections; the no-organism-import firewall.

### 4.8 Gate-blind residuals (the human judges these on the PR preview)
The SNAP beat feel (glidePow+tipLag vs the optional `downFrac`); open-cage legibility at gameplay
distance (bump hole-fraction +0.02 if apex reads solid); TONE — haunted vs gruesome in a pastel-leaning
game; ivory-on-bright-sky presence (the inverse of Vesper's dark-shop problem); the gap-pulse dance
speed ω (necromantic vs blinky; static-swell fallback); the wisp tip in motion + Surge wisp count 2-vs-3
on the perf HUD; the `clickStep` bone-rattle (deferred, default-off).

## 5. Open owner calls (flag on the build PR; don't block on them)
1. Final key/cost (`revenant` / 2400 — owner may re-slot).
2. Tone ruling: haunted vs gruesome (default: elegant undeath, no gore).
3. `clickStep` bone-rattle quantize (default OFF).
4. Surge wisp count 2 vs 3 (default 2 per the overdraw budget).
5. The optional nullable `downFrac` poser easing (only if the SNAP needs it on preview).

## 6. The other four (for context — build order after Revenant)
**Revenant → Tempest → Stiletto → Tocsin → Sylph.** Tempest lands the shared `js/pulseTimer.js`
(deterministic seeded strike/ring clock) that Tocsin reuses; Stiletto carries the one rig extension
(nullable `parts.auxWingPivots` for its 2nd wing pair); Sylph (aurora hood) is last (riskiest fill-rate).
Their sheets: `TEMPEST-THUNDERHEAD`, `VENOM-BELLADONNA`, `RESONANCE-TOCSIN`, `AURORA-SYLPH`
`-BUILDSHEET.md`. Master index: `FRESH-DRAGONS-SYNTHESIS.md`.

---
*Design phase merged in PR #404 (2026-07-13). This handoff = the digest; `WRAITH-GRAVELIGHT-BUILDSHEET.md`
§B is the authority. Next action: cut the branch (§3) and run I0.*
