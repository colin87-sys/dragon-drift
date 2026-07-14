> **SUPERSEDED / HISTORICAL** — this is the original fresh-build brief for KARNVOW. He has
> since SHIPPED; the CURRENT documents are `../REDO-BOSS-9-KARNVOW.md` (the grandeur redo) and
> `../KARNVOW-9-SPEND-PLAN.md` (the budget-spend directive). Kept for history only.

---

# BUILD BRIEF — BOSS 9: KARNVOW, "Wears the Horn It Took"

**This is a standalone handoff.** Open a fresh Claude Code session in the `dragon-drift`
repo, paste this file's path (or its contents), and work it top to bottom. It contains
everything needed to build slot 9 correctly WITHOUT the audit context that produced it. The
design work that would normally block the build (the §3b silhouette sheet, the §4b charisma
map, the presence fix) is **already drafted below** — a human approves/edits it, then you
build against it.

KARNVOW is the **Tier-3 band PEAK** and was flagged by the boss-design audit as the *least
build-ready* of the open slots: the doc had no silhouette-translation sheet for it, no
charisma map, a body speced too small for the band peak, and its showcase parry mechanic had
no engine plan. This brief closes all of that. Follow it and KARNVOW will not need a rebuild.

---

## PART 0 — ORIENTATION (read first, ~10 min)

1. **Read `LEAPFROG.md`'s THE RULE**, then the boss lessons it lists in `reforged/BOSS-DESIGN.md` §9 — at minimum **L150** (the silhouette betrays the mesh — a whale read as a battleship), **L140/L141** (band budgets are floors of ambition; presence sums per BODY; a huge boss needs a proximity beat), **L164/L165** (BRINEHOLM — the silhouette is judged at the FIGHT frame; a weak-point window is a DURATION). These are the exact failure classes this boss is at risk of.
2. **Read `reforged/BOSS-DESIGN.md`** fully, but especially: §3 design laws, §3b silhouette translation (the anti-failure discipline), §4b charisma-carrier law, §5b slot table + the KARNVOW brief + the lore web, §5f (KARNVOW's rule-breaks + dread move), §5i (rhythm AGGRESSION EXCHANGE, graze HOLD-UNTIL-FLINCH, parry TENNIS RALLY + REFLECT-ONLY SEAL), §5j (entrance *It Kept Count*), **§6 (the build recipe)**, **§7/§7b/§7c (verification + the studio gate)**.
3. **The shipped quality bar** to copy patterns from: `reforged/js/bossAshtalon.js` (moving-station duelist, tell-pose machine, HDR idiom — the closest precedent), `bossBrineholm.js` (the most recent build; its CP1-model → CP2-wire split is the pattern to follow), `bossIdol.js` (the horn tube-taper kernel KARNVOW's lance reuses; the eye/charisma rig). The retired `craghold` def in `bossDefs.js` carries the finger-chain / socket-pool / tell-pose geometry KARNVOW inherits (per §5b footnote).
4. **The iron law of this repo**: coexist → prove on a hero → migrate; never break the shipped roster; **verify before claiming** (run the tests, don't assert green). A boss is DATA + one builder file; `boss.js` needs zero changes for a new boss.
5. **The studio-first law (§7c) + the Fable gate**: every boss is judged in an ISOLATED studio FIRST (is the DESIGN right?), in-game SECOND (does it survive the world?). **You never self-judge design or integration — you spawn an independent Fable agent (via the Agent tool) as the gate**, fix what it flags, THEN post crops and STOP for the human owner's final motion/feel verdict. There are three Fable spawns (Part 4): the §3b PRE-BUILD sheet sign-off (before any geometry), the CP1 studio design gate (on the silhouette renders, before the beauty pass), and the CP2 integration gate. This layering — Fable gates, human owns the final call — is how the last three bosses avoided rebuilds. It is not optional.

**Branch & baseline (do before touching anything):**
```
git fetch origin && git checkout -b claude/boss-9-karnvow origin/master
cd reforged && node tests/run-all.mjs        # record the green baseline in your first message
```
If baseline is red, STOP and report — do not build on a broken tree.

---

## PART 1 — ⛔ THREE HUMAN DECISIONS BEFORE ANY GEOMETRY

> **The repo's own law (§3b) says the silhouette sheet + charisma map must exist AND be
> signed off BEFORE geometry — this is what stops "reads as the wrong noun" failures. Do not
> model a single vertex until a human has approved A and B and answered C. Paste these three
> to the human, collect answers, THEN start Part 4.**

**DECISION A — Approve the §3b silhouette translation sheet** (drafted in Part 2.1). The
human confirms KARNVOW *Reads as* "a lean hooded duelist riding at your side, lance couched"
and that the carrying cues / anti-reads are right. If they edit it, the edited version is
law. **Then, before any geometry, the sheet ALSO passes the §3b PRE-BUILD Fable sign-off**
(the first of three Fable spawns — see CP1.0 in Part 4): an independent Fable agent runs the
stranger test on the sheet in prose and confirms the cues/anti-reads hold. Human approval +
Fable sign-off are both required before you model a vertex.

**DECISION B — Approve the §4b seven-channel charisma map + glyph** (drafted in Part 2.2).
Faceless boss — the carriers are the cowl-glint + the lance language. Confirm the seven
channels and the doodle glyph.

**DECISION C — Engine scope for the parry showcase (the one real architecture call).**
KARNVOW is "the first boss that parries YOU." Its full showcase — **TENNIS RALLY +
REFLECT-ONLY SEAL** (§5i.C) — needs NEW bullet routing: the boss intercepts your reflected
cyan, re-emits it as an escalating returnable orb, and a "seal" phase makes it gun-immune so
parry is the only damage path. This has **no costed engine plan** (an open audit finding).
Two options:
- **(C1) v1 = the smaller shippable version** *(recommended)*: ship the brief's "parries your
  reflected bullets once — amber flash + riposte," the save-taunt entrance, and the
  AGGRESSION EXCHANGE rhythm. Defer the full escalating rally + gun-sealed phase to a
  follow-up PR. This keeps the first build inside the proven pipeline (no new bullet
  architecture on the same PR as a new model — the scope pile-up that causes rebuilds).
- **(C2) v1 = the full showcase**: build the TENNIS RALLY + REFLECT-ONLY SEAL engine now, as
  slot 9's net-new coexist-safe system. Concretely: (1) **reflect-detect** — the boss catches
  the player's reflected cyan bullet, cancels it, and spawns exactly ONE accelerating return
  orb (faster each successful return); (2) a **seal state** that disables the player's
  auto-fire for a bounded window so only parry works (one of the roster's ≤2 reflect-only
  seals — bounded, never a hard-wall lockout). **Default-OFF for every other boss
  (byte-identical legacy path).** Requires a headless test asserting a reflected bullet within
  the rally window spawns exactly one accelerating return, and that the seal RESTORES auto-fire
  on exit. Higher risk; it touches `bossBullets.js` reflection routing + a new phase state.

The recommendation is **C1**, mirroring how BRINEHOLM shipped (CP1 model → CP2 wire, showcase
depth added incrementally). **Model work (Part 4) is identical either way — it does not block
starting**, so the human can answer C while you build CP1. But the DEF and the CP2 wiring
depend on the answer.

*(One thing the human should NOT decide loosely: the palette. KARNVOW's cold cowl-glint hue
and the amber lance-tip both sit near reserved role colors — see Part 2.4. That's a separate
palette gate; flag it, don't guess.)*

---

## PART 2 — THE DESIGN ARTIFACTS (paste these into BOSS-DESIGN.md as part of the build PR)

These replace/extend the thin slot-9 §5d entry. They are written in the doc's own format
(the slot-8 block at §5d is the template). **They are drafts pending Decision A/B** — the
human's edits win.

### 2.1 — §3b SILHOUETTE TRANSLATION SHEET (fill BEFORE modeling)

> **9 KARNVOW — SILHOUETTE TRANSLATION (§3b):**
> - **Reads as:** a lean, hooded DUELIST riding at your shoulder, a long lance couched low —
>   a knight-errant / reaper-jouster, not a monster. (Stranger test: "a cloaked figure with a
>   spear, keeping pace.")
> - **Carrying cues (2–3, sized dominant, must reach the outline):**
>   1. **The LANCE** — one long, straight, asymmetric DIAGONAL breaking the vertical figure;
>      the single longest hard edge in the silhouette. Held LOW at rest, it *snaps to POINT*
>      (the telegraph). A couched straight lance says "duelist" louder than anything.
>   2. **The HOODED COWL with the EMPTY VOID** — a tall peaked hood (top of the silhouette)
>      framing a dark aperture where a face should be, with ONE cold glint deep inside. The
>      absence is the identity (the anti-mask).
>   3. **The TROPHY CHAIN** — a swinging diagonal of hanging charms breaking the clean
>      vertical with dangling, asymmetric hard points. The lore hook; the thing that says
>      "this one collects what it kills."
> - **Anti-reads (must NOT read as → forbidden primitives):**
>   - NOT a generic grim reaper: **forbidden** = a curved scythe blade (the lance is STRAIGHT
>     and couched — a jouster, not a reaper), a bell-shaped robe skirt (it has an armored
>     torso + hard pauldrons, not a shapeless cloak), a face-forward hover with no lean.
>   - NOT slot 11 WEFTWITCH's hooded shroud: **forbidden** = radial limbs / threads, a
>     symmetric front-on bust — KARNVOW is a FLANK duelist with ONE dominant diagonal (the
>     lance), always leaning into its lane.
>   - NOT a floating empty cloak / a blob: the pauldrons + lance + chain must give hard
>     shoulders and an "armed and armored" read; the cowl void must read as a deliberate dark
>     aperture (framed by a lit cowl rim), never a modeling hole.
>   - NOT Voidmaw (slot 1, cracked stone, socket PAIR): KARNVOW's void is ONE aperture, ONE
>     deep cold glint, framed by fabric/metal — living menace, not dead stone.
> - **Lit-edge plan (emissive follows anatomy; ONE focal):** the cowl RIM carries a thin cold
>   guttering glint (the character line); the LANCE seam carries Voidmaw's violet-scar, its
>   TIP igniting amber on the charge-tell (the amber-emitting ORGAN, §5i.C.3); each TROPHY
>   CHARM emits in its owed boss's palette at LOW intensity (satellite law ≤0.25). **The ONE
>   focal = the cold glint DEEP in the cowl void** — small, hottest, the mind behind the
>   indifference (NOT the lance, NOT the charms). NO level horizontal lines — the only strong
>   diagonal is the lance.
> - **Scale target (THE presence fix — this is the band PEAK; do NOT ship it thin):** the
>   figure reads ~10–11u tall, but presence comes from the FULL assembly — the couched lance
>   (~8–10u) + the trophy chain arcing wide behind/below it — reading as a Tier-3 mass, not a
>   thin pole. **Proximity is the presence lever (§3b.6):** KARNVOW rides the CLOSEST station
>   in the roster (flank at rel 12–18, cutting in toward rel ~8–10) — deliberately at your
>   shoulder. At rel ~14 a ~10u figure fills a large vertical band of the portrait; the
>   lateral cut-in is a true near-pass (the L140/L141 proximity beat). Target: the
>   figure+lance+chain assembly must read with **≥ ASHTALON-class on-screen presence** at its
>   flank station. **KARNVOW is the roster's deliberate scale-DOWN — a lean dragon-PEER, never
>   a colossus; its grandeur is personalization and dread-of-being-known, not bulk.** So the
>   tri budget rises from the old ~2k toward the **Calamities band floor (8–14k) as DETAIL, not
>   size** — spent on the trophy chain (many small charms = lore density), cowl fabric-fold
>   relief, pauldron/armor facets, the lance's horn detail, and the dread-move spectacle (§5g
>   rule 4). NEVER on bulking the figure and NEVER on additive shells. If the studio fight-frame
>   reads as a GIANT, you've overbuilt — it must read as a peer at your shoulder.
> - **Home backdrop:** PALE — KARNVOW is the Amber Wastes tenant (bleached high-noon desert,
>   BIOME-DESIGN.md). A dark tarnished-iron body on a bright warm sky reads as a near-black
>   cutout, so **judge it on the PALE backdrop FIRST (§3b.7)**: every cue must live in the
>   outline, and the lit cowl-rim / lance-seam / charms must punch to carry it.

### 2.2 — §4b SEVEN-CHANNEL CHARISMA MAP (faceless — the carriers are cowl-glint + lance)

> **9 KARNVOW — §4b carriers:**
> - **GAZE:** the cowl glint tracks with lag but *pointedly looks past/through* you — at its
>   own chain, at the lane ahead — the **indifference IS the taunt** (slot 12 owns the mutual
>   gaze; KARNVOW never grants it until the kill). Carrier = glint position + cowl angle.
> - **BLINK-analog:** the glint GUTTERS (dims + re-lights like a coal); rate = mood (steady
>   when in control, fast-guttering under pressure). *(The §4b seed: "guttering cowl-glint.")*
> - **CHARGE-TELL:** the LANCE — held low at rest; rises and its TIP ignites amber as it snaps
>   to POINT before a volley (silhouette change = the telegraph; the amber-organ, §5i.C.3).
> - **EXPRESSION (≥3 states):** the LANCE LANGUAGE — **salute** (raised vertical =
>   acknowledgment), **point** (leveled at you = challenge), **lower** (dropped = dismissal /
>   dominance) — read off the lance angle + cowl tilt.
> - **FLINCH:** the cowl RECOILS (hood jerks back, glint flares) and the trophy chain swings
>   from the impact — "it felt that."
> - **NOTICE (fight start):** the lance SALUTES — snaps to vertical, the glint flares once (the
>   trophy-hunter's respect for a worthy opponent), then lowers to couch. *(the `notice()` hook)*
> - **DEATH:** the lance DROPS and clatters; the trophy charms gutter out ONE BY ONE (each
>   owed boss's glint dying — the trophies freed); the cowl sags, the glint eases shut LAST.
>   A defeated duelist releasing what it took. (Mournful death = fan art, §4.7.)
> - **GLYPH (doodle test → boss-select chip):** a cowl peak + a diagonal couched lance + one
>   dangling **EMPTY hook**. The empty hook is also the §3 law-6 SCAR (the one asymmetric
>   memory-hook + lore gap: what does the empty hook await? — deliberately unnamed).

### 2.3 — GEOMETRY (the buildable translation — primitives, pivots, palette)

Figure ~10–11u vertical. **Cowl:** tapered extrude hood (the CRAGHOLD/tell-pose extrude
idiom) framing a recessed dark VOID socket (socket-pool precedent, craghold) with one small
HDR glint sphere deep inside (the focal — HDR-overdrive ×~2.4, `toneMapped=false`).
**Torso + pauldrons:** hard-shouldered armored box/faceted masses (not a robe) — the "armed"
read. **Lance:** Voidmaw's snapped-horn tube-taper kernel (reuse `bossIdol.js`'s horn
builder), violet-scarred seam LineSegments, on a named **`lancePivot`** (the salute/point/
lower telegraph) with a named **`lanceTip`** (the `def.muzzle` emitter + amber charge-tell).
**Trophy chain:** LineSegments strand + N small charm meshes (Ashtalon's snapped
feather-blade, one EMPTY hook, and per §5b the other owed bosses' relics), each charm a small
mesh with LOW per-charm emissive in its owed palette; the chain hangs on a pivot so it SWINGS
(the flinch + entrance flare). **Named pivots (the telegraph gate finds them by name):**
`lancePivot`, `chainPivot`, `cowlPivot`. Palette: tarnished iron `0x1c1e22` body (near-black,
lifted albedo so it reads on the pale desert sky — L162), cold cowl-glint (see 2.4), amber
lance-tip (the sanctioned organ), per-charm owed-boss glints. Wet/matte metal spec so it
reads forged, not stone. **~8–12k tris** (Calamities band; spend on chain + facets). REUSES:
horn kernel (bossIdol), tell-pose machine + socket pools (craghold), moving-station setpieces
(bossAshtalon), the eye/glint rig, `ui.bossNote` + `save.js bossLedgerStats` (shipped),
`bossKit`. NEEDS: verify `approachFrom: 'alongside'` / flank moving-station (Part 3.4).

### 2.4 — ⛔ PALETTE — FLAG FOR THE COLOR GATE, DO NOT GUESS

KARNVOW's **cold cowl-glint** must be a desaturated cold steel — and it must clear the
reserved **reflected-cyan** band. Its **amber lance-tip** is legal ONLY as the amber-emitting
organ (§5i.C.3 — the same sanction as slot 7's queen-eye), and must clear the parry-amber
role band as a paint color elsewhere. The trophy charms borrow owed-boss palettes (fine — low
intensity). **Do NOT finalize any of these hexes yourself.** Propose values, run
`node tests/bulletcontrast.mjs` and `node tools/bossgate.mjs karnvow` (G3 = zero pixels in the
danger-magenta band + accent-hue attribution), and **if any hue lands near a reserved role
color (danger magenta / parry amber / reflected cyan / surge pink), STOP and ask the human.**
Confidently picking a near-reserved hue is a known failure mode.

### 2.5 — THE DEF (add to `reforged/js/bossDefs.js`; append `'karnvow'` to `BOSS_ORDER`)

Model it on the `ashtalon` def (the closest shipped shape). Fields that are DECIDED:
```
id: 'karnvow', name: 'KARNVOW', title: 'the Trophy-Hunter',
epithet: 'Whatever Sent It',          // §5f lore gap: something SENT it — point, never answer
archetype: 'trophyDuelist',           // new archetype string; dispatch in bossModel.js
tier: 3,                              // CALAMITY band; slot-9 is the PEAK → sits HIGH
hpMax: 440,                           // Tier-3 band 360–450; PEAK sits high (sawtooth crest)
bulletColor: 0xff2b6a,               // danger magenta — role color, never per-boss
approachFrom: 'alongside',            // ⚠ Part 3.4: verify supported or reuse moving-station
muzzle: 'lanceTip',                   // emitter = organ (§5f law 7)
grazeForm: 'holdFlinch',              // ⚠ Part 3.4: verify the branch exists or reuse a tick
scale: 1.5,                           // TUNE against the studio fight-frame (Part 4)
accent: <cold cowl-glint — see 2.4, GATE>,  glow: <amber lance-tip — see 2.4, GATE>,
```
Phases (precision jobs, tightening — `aimed`/`stream`/`crossfire`, "almost no fills"):
```
phases: [
  { atFrac: 1.00, cadence: [1.4, 1.8], attacks: ['aimed', 'crossfire'] },        // P1: the duel opens
  { atFrac: 0.55, cadence: [1.3, 1.6], attacks: ['aimed', 'crossfire', 'stream'] }, // P2: it presses
  { atFrac: 0.25, cadence: [1.2, 1.5], attacks: ['stream', 'crossfire', 'aimed'] }, // P3: Voidmaw's Verdict (dread)
]
```
Cards (4 incl. dread last; names per §5f grammar `<EPITHET FRAGMENT> — <plain name>`):
```
cards: [
  { id: 'karnvow_gambit',  name: 'IT KEPT COUNT — Opening Gambit', atFrac: 1.00, timer: 24 },
  { id: 'karnvow_riposte', name: 'WEARS THE HORN — Riposte',       atFrac: 0.55, timer: 26 }, // the parry beat
  { id: 'karnvow_verdict', name: 'WEARS THE HORN — Voidmaw’s Verdict', atFrac: 0.25, timer: 28, dread: true },
]
```
Rhythm — **AGGRESSION EXCHANGE** (must clear `rhythmprint` KS-distance from all others; the
feel = tight, initiative-driven, short rests). Draft a distinct short-rest bimodal profile
and tune until `node tests/boss.mjs` passes rhythmprint:
```
rhythm: { signature: 'aggression-exchange', ticket: { bpm: 100, quantize: '1/8' }, phases: [ ... ] }
```
*The "your parries steal its tempo" reactive layer is a CP2 enhancement (Decision C) — v1's
rhythm just needs a distinct fingerprint.*
Parry job: per Decision C. C1 → `parries reflected bullets once (amber riposte)` on the
`riposte` card. C2 → the full TENNIS RALLY + REFLECT-ONLY SEAL (new bullet routing).

---

## PART 3 — DOC FIXES TO LAND IN THE SAME PR (these are settled — just do them)

**3.1** Slot-9 brief (§5b): replace "Craghold's severed finger on a trophy chain" with
"Ashtalon's snapped feather-blade on a trophy chain, and one empty hook" (CRAGHOLD is retired;
the §5d sheet + lore web already say feather-blade + hook). `grep -in 'severed finger'
reforged/BOSS-DESIGN.md` → must return nothing.

**3.2** Registry parry-job cell (§5b slot table, row 9): change `—` to
`TENNIS RALLY + REFLECT-ONLY SEAL (Calamities showcase, §5i.C)` — or, if Decision C = C1, add
`(v1: reflect-once riposte; full seal deferred)`.

**3.3** Registry palette cell (§5b row 9): add the missing glow-shape token — e.g.
`tarnished-iron·cold-glint / multi-hue trophy glints + amber organ` (per the GATE C ruling).

**3.4** Verify the two engine assumptions and record the result in the PR:
- `approachFrom: 'alongside'` — grep `boss.js` for the approach branches (`approachFrom`).
  If a flank/alongside moving-station isn't supported, it reuses the shipped
  moving-station setpiece machinery (`bossAshtalon` fires while it travels) — wire it that
  way, and note it in the §5d NEEDS line. If it needs a genuinely new branch, that's a small
  engine item — flag it to the human before building it.
- `grazeForm: 'holdFlinch'` — grep `boss.js` for the `grazeForm` branches (shipped:
  `beamEdge`, `absorbColor`, `shadowRide`). **HOLD-UNTIL-FLINCH must NOT clone slot 6's
  continuous beam-edge ride (the graze ladder demands a fresh form per band).** Recast it as a
  DISCRETE risk-tier hold: stay in the lance's threat-line through escalating proximity TIERS,
  terminated by the FLINCH EVENT (the stare-down that ends in the amber flash) — not a
  per-frame beam ride. It may reuse the slot-6 detector's PLUMBING, but it must PRESENT as
  discrete tiers + a flinch terminator; if the shipped detector can't express that, flag the
  small addition to the human. Add the GRAZE FORM line to the §5d sheet as anatomy: "GRAZE FORM
  — HOLD-UNTIL-FLINCH: the lance's threat-line is the anatomy; hold it through discrete
  proximity tiers to the amber FLINCH flash (a stare-down, not a beam-ride); offered once per
  phase."

**3.5** Lore — thief vs maker (coordinate the double-ownership with slot 14): **KARNVOW is a
THIEF/collector — it wears TAKEN trophies** (Voidmaw's horn, Ashtalon's feather-blade, one
empty hook = the next victim = you). **Slot 14 (THE UNMASKED) wears the roster's scars as the
MAKER.** They must not both claim the same physical relic with the same framing — the doc's
transfer clause is "14 reclaims the horn + feather-blade after 9 falls." Verify 14's relic
list and KARNVOW's charm list are consistent with that (or use distinct relics). Register the
empty-hook thread in the lore web: "9's empty trophy hook → what it awaits is deliberately
unnamed; it points at the player (do not resolve before slot 14 / post-game)". Do NOT invent a
referent for "something SENT it" — that's an owner lore call.

---

## PART 4 — THE BUILD PIPELINE (CP1 model → studio → CP2 wire → in-game → crops → STOP)

Follow the §6 recipe and the BRINEHOLM CP1/CP2 split exactly.

**CP1.0 — ⛔ PRE-BUILD FABLE SHEET SIGN-OFF (before any geometry — Fable spawn #1):** once the
human has approved the §3b sheet (Decision A), spawn an independent **Fable agent via the Agent
tool** and give it: the §3b laws (from BOSS-DESIGN.md), KARNVOW's translation sheet (Part 2.1),
and this task — *"You are an independent design gate. Run the §3b STRANGER TEST in prose on this
sheet: does the described black-fill silhouette read, in ~2 seconds with zero context, as a
HOODED DUELIST-KNIGHT WEARING TROPHIES — and NOT as a generic grim-reaper, NOT as Voidmaw (a
broken mask with hollow sockets), NOT as a serpent/colossus? Confirm the 2–3 carrying cues each
reach the outline and each anti-read is forbidden by a named primitive choice. Name any missing
cue or un-forbidden anti-read. Verdict: PASS / FIX (with specifics)."* **Fix the sheet until
Fable PASSes before modeling.** This is where BRINEHOLM should have been caught pre-mesh.

**CP1 — the model (studio-gated):**
1. `bossDefs.js`: add the def (Part 2.5), append `'karnvow'` to `BOSS_ORDER`.
2. New `reforged/js/bossKarnvow.js`: `export function buildKarnvow(def, quality = 1)`. Compose
   on `createBossCommon(def, quality, { shieldRadius, hpBarY })` from `bossKit.js`. Build all
   parts into an inner `rig` group (NEVER animate the root — `boss.js placeGroup` stomps
   `group.rotation`, `setDissolve` owns `group.scale`). **Every material through `kit.track()`.**
   Name the telegraph pivots (`lancePivot`, `chainPivot`, `cowlPivot`, `lanceTip`).
3. `bossModel.js`: one dispatch line — `if (def.archetype === 'trophyDuelist') return
   buildKarnvow(def, quality);`.
4. Return the handle contract (§6.4): `{ group, muzzle, orbiters(≥2, tick-animated),
   setDissolve, setCharge, setHealth, setHealthBarVisible, setShieldVisible, shatterShield,
   flash, tick(dt,time), dispose }` + the charisma hooks `setGaze(nx,ny)` and `notice()`. Wrap
   kit methods to layer emotion (`setDissolve`→the death choreography, `flash`→cowl-recoil
   flinch, `setCharge`→lance snap-to-point).
5. **Merge gotchas** (`mergeGeometries` returns null silently on mismatch): strip `uv`+`uv2`
   via `bossKit.stripForMerge` and REASSIGN (`geo = stripForMerge(geo)`), `toNonIndexed()`,
   bake transforms before merging.
6. **STUDIO GATE (§7c) — the primary design verdict:** run
   `node tools/bossstudio.mjs karnvow` → judge the contact sheets on the **PALE (home) backdrop
   FIRST**, then the black-fill + lit-edge renders (the stranger test + anti-reads from 2.1),
   then the fight-distance frame for PRESENCE (the L140/L141 check — does the assembly read at
   ≥ASHTALON mass at the flank station?). Then `node tools/bossgate.mjs karnvow` (G1–G7 pixel
   laws). Iterate the MODEL against these mechanically.
7. **⛔ CP1 FABLE DESIGN GATE (Fable spawn #2 — on the silhouette renders, BEFORE the beauty
   pass):** spawn a fresh independent **Fable agent via the Agent tool**, give it the black-fill
   + lit-edge + fight-distance renders and the bossgate G1–G7 output, and this task —
   *"Independent design gate, silhouette FIRST. On the BLACK-FILL render: stranger test = does
   it read as a hooded duelist wearing trophies? Anti-reads present? (generic reaper / Voidmaw /
   colossus). Are the cowl-void + lance + trophy-chain all in the OUTLINE? On the FIGHT-DISTANCE
   frame: does it read as a lean PEER at the flank (never a giant, never a thin pole)? On the
   LIT-EDGE render: is the ONE cold cowl-glint the focal (not over-brightened to a lamp), amber
   only on the lance/riposte, trophy glints only on the charms? Verdict PASS / FIX. Do not pass a
   failed stranger test."* Fix the MODEL and re-gate until Fable PASSes. Only then judge the
   beauty pass.
8. **POST CROPS + STOP FOR THE OWNER.** After Fable PASSes, post the studio contact sheets (idle ·
   `notice()` · `setCharge(1)` · shielded · death) + the black-fill/lit-edge renders + the
   fight-frame + Fable's verdict to the PR and **STOP for the human owner's green-light.** You do
   not proceed to CP2 or merge on your own verdict (§7b/§7c delegation protocol) — Fable gates,
   the owner owns the final call.

**CP2 — wire the live fight (separate commit, after the CP1 owner green-light):**
9. Phases/cards/rhythm fire; the `lanceTip` muzzle emits (aim solves against its `rel`); the
   AGGRESSION EXCHANGE rhythm passes `rhythmprint`; the entrance *It Kept Count* reads
   `save.js bossLedgerStats` via `ui.bossNote` (the stat-taunt) with the **MANDATORY** charm
   flare matching the player's top-killer (the escalation hinge — without it this is the
   roster's weakest entrance; the fresh-save fallback line is "NO RECORD. IT WILL START ONE.").
10. **Keep the two fire-free beats distinct (so §5d and §5f agree):** the cinematic ENTRANCE
    fires ZERO shots (Mantis rule). The ONE granted hold-breaker shot (§5f — "the trophy-hunter
    has no honor") fires during the reveal HOLD that follows `enterFight` (camera home, HUD back)
    — it is NOT part of the cinematic. Wire them as two separate beats.
11. The parry mechanic per Decision C (C1 reflect-once riposte, or C2 the full tennis-rally +
    reflect-only-seal engine + its headless test).
12. **⛔ CP2 FABLE INTEGRATION GATE (Fable spawn #3):** capture in-game at the home biome
    (`?debug&boss=100&bossIdx=8`, `?rush=all`), then spawn a fresh independent **Fable agent via
    the Agent tool** — *"Judge ONLY integration, not design (design passed at CP1). Check: it
    reads as a lean peer-scale duelist riding alongside (never a giant, never turns its cowl);
    the stat-taunt reads YOUR real run stats and the charm-flare matches your top killer (with
    the fresh-save fallback); [if C2] the tennis-rally spawns exactly one accelerating return and
    the reflect-seal disables/restores auto-fire fairly (bounded, not a hard-wall); HOLD-UNTIL-
    FLINCH reads as a discrete risk-tier stare-down, distinct from slot 6's beam-edge; the
    entrance fires zero shots and the hold-breaker shot fires only in the reveal hold;
    Voidmaw's-Verdict reads as the stolen card; bullet contrast on the pale sky; the ladder
    controller advances the run without regressing shipped bosses; HUD/title/banner collisions;
    full loop + death. Verdict PASS / FIX per item."* Resolve or explicitly re-defer each FIX.
13. Re-run all suites, post the in-game crops + Fable's integration verdict, and **STOP for the
    owner's final motion/feel call before the PR leaves draft.**

---

## PART 5 — VERIFICATION, ACCEPTANCE, GATES, DONE-WHEN

**Run (from `reforged/`), all must be green before posting:**
- `node tests/boss.mjs` — the contract: per-band tri ceiling (KARNVOW is tier 3 → the
  Calamities `TIER_BUDGETS`), quality scaling (q0.5 < q1), archetype dispatch, visible-draw
  gate, telegraph-silhouette gate (extend it with KARNVOW's named-pivot asserts:
  `lancePivot` moves the silhouette on `setCharge`; `lanceTip`/`cowlPivot`/`chainPivot` exist),
  dissolve-to-transparent, orbiter/muzzle/lifecycle, `amberdiet` (every phase serves amber ≤12s
  — the lance-tip organ), `rhythmprint` (AGGRESSION EXCHANGE distinct from all 8 others).
- `node tests/bossboot.mjs` — zero console errors AND zero untracked-material warnings.
- `node tools/bossgate.mjs karnvow` — G1–G7 (add `gate:` overrides only with a cited registry
  sanction; KARNVOW is a dark boss on a pale sky — no pale override, but confirm G2/G4 read).
- `node tools/bossstudio.mjs karnvow` — the contact sheets + silhouette renders (the merge gate).
- `node tests/run-all.mjs` — full suite still green (proves the coexist rule: the other 8
  bosses are byte-unchanged).
- `node tools/stamp-sw.mjs` — **in the same commit** as any js/css/html change (service-worker
  precache). Doc-only edits skip it.

**Acceptance checklist (self-check):**
- [ ] Studio black-fill silhouette passes the stranger test ("a hooded figure with a lance") and every 2.1 anti-read is avoided.
- [ ] Fight-frame presence reads ≥ ASHTALON at the flank station (NOT a thin pole — the L140/L141 fix held).
- [ ] All named pivots exist and `setCharge` moves the silhouette (the lance snaps to point).
- [ ] `amberdiet` + `rhythmprint` + per-band tri gate all pass; full suite green.
- [ ] No hue lands in a reserved role band (or the human signed off the palette — Part 2.4).
- [ ] Part 3 doc fixes landed; `grep -in 'severed finger'` returns nothing; registry cells filled.
- [ ] Crops posted; **stopped for the human design verdict** (studio, then in-game).

**⛔ GATES you cannot self-certify past (Fable gates the design/integration; the owner owns the
final call — you NEVER self-judge):**
- Decision A (the §3b sheet) — human approval **+ the pre-build Fable sign-off (spawn #1)** before geometry.
- Decision B (the §4b map) — human sign-off before geometry.
- Decision C (the parry engine scope) — human answer before the DEF and CP2.
- The palette (Part 2.4) — human sign-off if any hue is near a role color.
- **CP1 studio design verdict — Fable design gate (spawn #2), then the owner green-lights on posted crops.**
- **CP2 integration verdict — Fable integration gate (spawn #3), then the owner's final motion/feel call before the PR leaves draft.**
- Every Fable spawn is an **independent** Agent-tool agent (fresh, no build context) — never reuse your own judgment as the gate.

**DONE-WHEN:**
- CP1 design verdict + CP2 integration verdict both passed by the human.
- Registry row 9 flipped `open → shipped`; the §5d entry carries the approved sheet/map/geometry.
- **Append one lesson to `LEAPFROG.md`'s ledger** (what you built, the gotcha, the reusable
  pattern — e.g. "KARNVOW: the band-peak duelist got its presence from PROXIMITY + the trophy
  chain, not raw height; the lance is the silhouette AND the amber-organ AND the telegraph —
  one part, three jobs") and **add it to the §9 reading list** in BOSS-DESIGN.md.

---

## PART 6 — GUARDRAILS / DO-NOT-BREAK

- **Never touch the other 8 shipped bosses' defs, builders, or dials.** KARNVOW is additive:
  a new def + a new `bossKarnvow.js` + one dispatch line. If you find yourself editing
  `bossAshtalon.js` etc., stop — you've misunderstood the coexist rule. A def WITHOUT
  `archetype` falls back to the legacy construct; yours is opt-in via the dispatch line.
- **`boss.js` needs ZERO changes** for the model. The ONLY code outside your builder that may
  need a touch is (a) the `approachFrom: 'alongside'` branch and (b) the `holdFlinch` graze
  branch — and both should REUSE shipped machinery (moving-station setpieces; the continuous
  graze detector). If either needs genuinely new `boss.js` code, **flag it to the human first**
  — that's an engine decision, not a build step.
- **Do not build the tennis-rally / reflect-only-seal engine unless Decision C = C2.** It
  touches `bossBullets.js` reflection routing; scope it as its own PR.
- **Do not invent lore.** "Something SENT it" and "what the empty hook awaits" stay open threads.
- **Do not finalize palette near reserved role colors.** Propose, test, ask.
- **Do not merge on your own verdict.** The pipeline ends at posted crops + a human STOP,
  twice (studio, then in-game). This is the single rule that has prevented every recent rebuild.
- **The entrance charm-flare is MANDATORY** (§5j escalation guard) — without the top-killer
  charm flaring in its owed palette, *It Kept Count* is the weakest entrance in the roster.
  Wire the fresh-save fallback line too.

**WHY THIS BOSS EXISTS (weight your build + the Fable/owner gates on these two beats):**
KARNVOW's whole reason to exist is the **personalization** — the charm that flares matching
whichever boss has killed you *most*, and it quoting your *real* death count. That is what makes
a small figure land harder than a colossus; if it's treated as a nice-to-have, the fight is flat
(the audit called slot 9 the roster's weakest fight without it). The second load-bearing beat is
the **parry showcase** — the tennis rally + gun-seal window where, for a bounded moment, parry is
your only weapon should feel like a DUEL, not a lockout. A build that nails the silhouette but
whiffs these two has missed the boss.

---

### Appendix — where this came from
This brief is the slot-9 slice of a larger execution SOP derived from the 2026-07 BOSS-DESIGN
adversarial audit (100 verified findings). The audit rated KARNVOW the least build-ready open
slot — no §3b sheet, no §4b map, ~2k tris at the band peak (the L140 presence trap), and an
uncosted showcase mechanic. Parts 2–3 close every one of those. The full SOP (covering the
doc-hygiene sweep, the engine-debt decisions, and slots 10–14) exists separately; you do NOT
need it to build KARNVOW — this file is self-contained.
