# THE UNMASKED — Finale Completion Plan (encounter + spectacle)

**Status:** DESIGN PLAN, pre-feasibility-audit. No code has changed.
**Scope:** completing slot 14's ENCOUNTER — the medley, the second-sun landmark +
handoff, the surge-chase, the companion shard, the destructible relics, star pips,
and the *Don't Move* entrance. **Separate from and downstream of the shipped lance
rung** (PR #372: crackSeam/wingEye/relic/wingRoot organs + THE RECKONING + the
0.20 finale burn), which every increment below must keep working byte-for-byte.
**Authority docs:** `reforged/BOSS-DESIGN.md` §1/§2/§3b/§4b/§5b-row-14/§5c/§5f/§5g/
§5h/§5i/§5j, `reforged/js/bossUnmasked.js` (the live model), `bossDefs.js`
`unmasked` (~:1714), `docs/lance-progression-redesign.md` §Band-5,
`leapfrog/lessons/2026-07-11-unmasked-finale-authored-eyes-and-reckoning.md`.

---

## 0. Executive summary

The model is nearly done; the FIGHT is not. All three stage sub-rigs exist and
transition live (`setPhase` → crack/unveil, `TRANS_DUR 2.0`, `allSnap`), the
lance organs + RECKONING shipped, and the def is schema-complete — but the
attacks/rhythm are explicitly a PLACEHOLDER medley, `grazeForm: 'medley'` is a
declared string with **no boss.js branch behind it (dead today)**, the def has
**no `entrance` field** (plain `'ahead'` approach — thirteen bosses get authored
entrances and the finale gets none), the second sun does not exist anywhere in
the codebase, and there is no companion-shard system at all. The plan is seven
increments, each an independently-shippable def-gated PR with a GO gate,
ordered fight-first (headless-provable) → spectacle (owner-gated) → capstone:

> **INC-1 The Medley (data)** → **INC-2 The Graze Medley (one small seam)** →
> **INC-3 Destructible Relics (branded-then-destructible)** → **INC-4 Surge-Chase
> + Star Pips (the verb-shift ending)** → **INC-5 The Second-Sun Landmark** →
> **INC-6 `handoff()` + the *Don't Move* entrance** → **INC-7 The Companion Shard.**

Honest sizing up front (the rung-14 "no new empties" precedent): INC-5 is the
big one — the §5h second-sun schedule is a full environment/save/progression
system that a previous session (KNELLGRAVE, Decision C1) already deferred once
because of its size. INC-4 is the FEEL-riskiest (verb-shift endings live or die
on the owner playtest). INC-1/2/3 are genuinely small because the plumbing they
ride (phrase machine, graze forms, PART_SYS destructibles) all shipped for
earlier bosses.

---

## 1. Ground truth — what EXISTS vs what must be BUILT

Reconciling the model header's reserved list ("THE MEDLEY, STAR PIPS, the
relics, the surge-chase, the second-sun landmark + handoff()") against master
after the lance merge:

### EXISTS (verified in code — do not rebuild)

| Piece | Where | Notes |
|---|---|---|
| 3 stage sub-rigs + live stage machine | `bossUnmasked.js` `stage1/2/3`, `setPhase`→`transKind` crack/unveil, `setStageMorph`/`setStage3`, `TRANS_DUR 2.0`, `stageTransitionDur` handle field | boss.js `beginStageBeat` holds fire through the transition + reveal (`:1073`, `:3735`); `debugStagePin` dev stage-jump (`:52`, `bossState().stagePin`) |
| `formLifebars` 3×240 flow | `bossDefs.js:1721`, boss.js `:2072/:3744/:4564/:5252`; `lockdpsCore.phaseSpans` fixed | each form = full bar → shield → Surge through → refill |
| Lance organs (all 3 stages) | `crackSeamL/R`, `wingEye0..5`, `relicHorn/Blade/Link/Spool/Shard`, `wingRootL/R`; `lockParts` phase-gated | comfort-verified at scale 2.4 (the rung-14 lesson) |
| THE RECKONING | boss.js `reckoningBranded`/`reckoningDone` (`:259-263`), lockPaint collector (`:4861`), `burnGate:'reckoning'` zeroing (`:4914`), eye-snap + charge-kill hold, reset on BOTH teardowns (`:1847`, `:5277`), `setBrandedRelics` presentation | tests: `tests/unmaskedorgans.mjs`, `tests/unmaskedreckoning.mjs` |
| Relics as NON-destructible trophy anchors | `bossUnmasked.js:544` ("NON-destructible… so THE RECKONING can never be locked out"), `:734` notes the FULL destroy→sag system reserved | the CP1 finding this plan's INC-3 must re-resolve |
| Charisma channels | gaze/blink/charge/expression/flinch/notice/death + `allSnap` (the all-eyes lock), wrath iris-redden, mantle-flare | §4b satisfied at model level |
| Phrase machine + CI gates | `bossRhythm.js` (measures, restDist uniform/bimodal/decaying, `ticket`, AMBER floor), `tests/boss.mjs` `rhythmprint` (AGGREGATE pairwise KS) + `amberdiet` + emission budget | the medley is def DATA on this machine |
| Graze-form implementations | boss.js def-gated: `slipstream`, `orbitAnnulus` (`:1241`), `beamEdge`, `absorbColor`, `shadowRide`, `holdFlinch` (`:3042`), `shrinkDisc` (`:1259`), `moteHarvest`, `tideEdge` | ALL single-form-per-boss (`def.grazeForm === 'x'` literals) |
| Destructible sub-part plumbing | boss.js `PART_SYS` (`:5006-5017`: ribs/panes/shackles), `routePartDamage`, `applyPartBreak`, lockParts-eviction (`:4668-4677`), debug crack hooks (`:5447`) | the generalized system INC-3 extends with a 4th entry |
| Entrance engine | `entranceScripts.js` `ENTRANCE_SCRIPTS` (11 scripts), boss.js shared driver (skip/slow-mo/gaze-exclusion), `approachFrom` branches side/above/below/ahead/condense/sides/horizon (`:1723-1760`) | `'landmark'` branch + a `dontMove` script are NEW |
| Horizon-seed precedent | `bossDefs.js:586` (`horizonSeed: true`, HOLLOWGATE), boss.js `updateHorizonSeed` (`:504-543`, peeks `nextBossDist`, fog-haze emergence, FIXED world spot), `bossModel.js buildHorizonSeed` dispatcher | per-ENCOUNTER, ~1 biome of lead. The second sun needs a different, run-scoped lifetime — reuse the fog-exempt build pattern, NOT the seed lifecycle |
| Fog-exempt sky-anchored rendering | `environment.js` sky dome (`fog:false` `:284`, camera-following, `sunDir` uniform `:290`) | the landmark's render pattern |
| Surge + beam-duel machinery | graze-charged Surge in boss fights (emptied at fight end, main.js `:1320`), shield-break-by-Surge per form, `def.beamDuel` state block (boss.js `:309-315`, `:3222`) | the chase reuses Surge + the seal lesson (L197: seal ≠ `shielded`) |
| Save ledger + flags | `save.js bossLedger` `[[bossId,kills,deathsTo]]` (`:307`), `saveData.flags` (e.g. `reckoningTaught`) | drives aperture notches, felled-gating, shard persistence |
| Audio foreshadow + music seams | `getBossEta()` (boss.js `:502`), FORESHADOW_TOLLS pattern, `musicKill/Restore` | 14's held choir partial rides the same pattern |
| scarBurn finale economy | `fracBySlot.unmasked 0.20`, burn-frac laws, stage-3 timer margin pinned (35.4s vs 34) in `tests/lockdps.mjs` | any cadence change must re-clear this |

### MUST BE BUILT (this plan)

1. **THE MEDLEY** — real per-stage roster quotes (attacks + rhythm + restruck
   cards + the exam dread card). Today's def says PLACEHOLDER in three places.
2. **THE GRAZE MEDLEY** — `grazeForm: 'medley'` is currently a no-op string;
   needs a per-stage resolution seam + three quoted forms.
3. **Destructible relics (destroy→sag)** — upgrade the shipped anchors under a
   contract that provably cannot lock out THE RECKONING.
4. **STAR PIPS** — the Apex parry debut (§5i.C: ≤3 banked perfect-parry stars
   multiplying final-stage Surge damage, all lost on a hit). Nothing exists.
5. **The surge-chase** — the §5f verb-shift climax (stage 3 stops being
   pattern-dodging; reach the core before it re-veils). Nothing exists.
6. **The second-sun landmark** (§5h schedule) + **`handoff()` approach** +
   **the *Don't Move* entrance** (§5d row 14 ENTRANCE, §5j registry row 14 —
   the def has no `entrance` field today) + the reticle suppression noted in
   the model header (`bossUnmasked.js:28-32`).
7. **The companion-shard mascot echo** (§8 backlog, §5c APEX contract). No
   companion/follower system exists anywhere in `js/`.

### Stale text to correct while we're in there (cheap, honest)

- Model header + def comment still say "STAGE 2 the OPHANIM" / card
  `'II — Wheels Within Wheels'` — the owner retired wheels for the SERAPH
  (§5d row 14). INC-1 restrikes the card; the comments update in the same PR.
- The def's "~20 eyes" prose: the live model has 8 elbow eyes + 6 watcher
  eyes + the great eye (the rung-14 lesson corrected this). Comment fix only.

---

## 2. Design — the five scope items (+ star pips), decided concretely

### A. THE MEDLEY (the zero-new-id thesis, made real)

**Law recap:** ≤1 new attack id per band; the finale's thesis is ZERO — it
re-strikes the tested vocabulary (§5b row 14, §5f law 4: "slot 14 is an EXAM
over the roster's taught mechanics, zero new ids"). Every id below already
exists in `boss.js executeAttack` and the `tests/boss.mjs ALL_ATTACKS` list.

**Per-stage era quotes (the recommendation — owner may veto pairings):**

| Stage | Era quoted | Attack ids (all existing) | Rhythm quote (`rhythm.phases[i]`) |
|---|---|---|---|
| **I — the Second Sun** | SENTINELS (1–2) | `aimed`, `fan`, `tunnel`, `iris` | METRONOME at sky scale — a single fixed pulse (uniform, degenerate rest), the SLOWEST pulse in the roster (restLo=restHi ≈ 3.0). Voidmaw's teacher-clock, stretched: the sun is unhurried. Amber: `aimed`/`fan`. |
| **II — the Seraph** | COLOSSI + CALAMITIES (3–9) | `stream` (Ashtalon's hose), `crossfire` (Eitherwing's flanks), `spiral` (Thrumswarm's radial), `movingGap` (the wall that moves), `geyser` (Brineholm's floor — see the verify note), `aimed` | CALL-AND-RESPONSE quoted as BIMODAL rest — tight A-B response gaps + one long handoff breath (the Eitherwing baton at six-wing scale). Amber: `crossfire`/`stream`/`aimed`. |
| **III — the Unveiling** | WORLD-ENDERS (10–13) + the exam | `spiral`+`aimed` (Knellgrave's toll-and-chain), `curtain`+`movingGap` (Weftwitch's lattice), `secondWave` (Onewing's returning ghost), `crestfall` (Embertide's crest — the leash-chain lore payoff), `crossfire` | CRESCENDO-SETS quoted as `decaying` — tightening sawtooth sets (Embertide's ramp, which itself quoted Stormrend: the full leash chain 2←13←14 audible in one envelope). Amber: `crossfire`/`aimed`. |

**The dread card** — `WHAT WORE THE SKY — Every Verdict at Once` (kept, already
in the def): the exam. "At once" is implemented as a **serial tight interleave**,
NOT concurrent emission — the attack machine is strictly serial by design (§5i
ground truth) and the emission-budget gate caps density; a phrase whose measures
walk one signature attack per felled era, thinned (~7–8 measures, gaps 0.8–1.0,
one `decaying` rest), reads as "everything you survived, back to back" while
staying under caps. Genuinely-concurrent emission would be new engine plumbing
for one card — flagged and REJECTED here; the auditor should sanity-check the
serial version's density against `emission-budget` instead.

- **Static roster quote, not ledger-driven, for v1.** By lifetime-ladder
  construction the player has felled all 13 before slot 14, so filtering the
  exam by `bossLedger` kills ≈ the full roster anyway; static is deterministic,
  testable, and immune to boss-select/debug entry states. Ledger-driven
  filtering is a listed post-v1 nicety. (Owner decision D1.)
- **Card restrikes (same PR):** `'I — The Second Sun'` stays;
  `'II — Wheels Within Wheels'` → a seraph-true name (draft: `'II — The
  Unfurling'`; §5f grammar allows the stage-numbered restrike `"II — THE
  UNMASKED"` — owner picks, D6). Dread card name unchanged. Card `id`s are
  STABLE and never change (save schema law) — display names only.
- **The one-frame VOIDMAW title glitch** (§5f rule-break, "it made the masks"):
  a ui.js title-card variant flag (`glitchName: 'VOIDMAW'`, one frame at card
  strike). Tiny, but it touches the shared title-card path — ship it in INC-1
  behind a def flag, default-off for every other def. (Owner may cut, D7.)

**Verify-before-build notes (the auditor should press here):**
- `geyser` and `crestfall` debuted as EMBERTIDE/BRINEHOLM kit; confirm their
  emitters make no def-specific assumptions when fired by another boss
  (`crestfall` at boss.js `:4277` reads generic dials; its horizonPocket LOCK
  is gated on `activeCard.id === 'embertide_horizonbreak'` (`:3462`) so the
  finale gets the plain form — good — but this must be boot-tested, not assumed).
  Fallback if either misbehaves: swap `geyser`→`curtain`, `crestfall`→`iris`;
  the era read survives.
- **rhythmprint self-collision**: the gate is pairwise on AGGREGATE gap
  distributions (`tests/boss.mjs:171`), so quoting one boss's envelope in one
  stage still mixes into a distinct aggregate — but quote at SHIFTED tempo
  anyway (stage I slower than Voidmaw's 2.1s pulse; stage III's decay range
  offset from Embertide's). Run the gate; do not eyeball it.
- **TTK/lockdps re-clearance is mandatory**: the placeholder cadences priced
  the stage-3 margin at 35.4s vs the 34s timer (feasibility doc, pinned in
  `tests/lockdps.mjs`). The real medley CHANGES fire density → re-run
  `lockdps` + the not-a-phase-deleter invariant; tune `restLo/restHi` until
  green. This is the exact trap the rung-14 lesson flagged (a wrong HP-shape
  model red-gates honest tuning — here the model is right and the TUNING moves).

### B. The second-sun PERSISTENT LANDMARK + `handoff()` (§5h, §5c, §5j)

**What §5h already locked (build to this, don't re-design):** seeded
permanently at the **first Calamity kill**, with a scripted ~4s first-appearance
beat; fixed **~22° off `SUN_DIR`**; **fog-exempt**; **static within a run**;
escalates by **LID APERTURE only** — one notch per band cleared, never
blinking, only ever opening further; the half-open **"it turned"** beat lands
after slot 13. KNELLGRAVE's Decision C1 defers seeding to "an Apex session that
seeds-on-load for saves with ≥1 Calamity kill" — that session is INC-5.

**Architecture (reuse over invention):**
- **NOT the `horizonSeed` lifecycle** — that system is per-encounter, keyed to
  `nextBossDist`, and despawns. The second sun is an AMBIENT RUN-STATE object:
  a new small module (`js/secondSun.js`) owned by `environment.js`'s
  update loop, built once per run when eligible, riding the camera like the
  sky dome (`material.fog = false`, camera-relative placement at ~22° off the
  dome's `sunDir`, drawn in the sky layer so bullets/boss render over it —
  render-order LAW).
- **Geometry = a distant-LOD reuse of the stage-1 recipe** (black disc + soft
  corona + ONE heavy lid at aperture `k`), NOT a second full build of
  `buildUnmasked` (no kit, no organs, no eye tracking — 2 draws, ~300 tris,
  one small additive ring far from the overdraw cliff). The lid aperture is
  the only animated dial and it moves ONCE per band-clear event, not per frame.
- **Aperture source of truth:** `save.js bossLedger` — notches =
  bands fully cleared (Calamities felled → notch 1, World-Enders → notch 2…),
  computed at run start; **static within the run** (§5h) means no mid-run
  re-read except the scripted beats.
- **Scripted beats (both def/flag-gated, both skippable-by-being-missable):**
  the 4s first-appearance beat (rider line + a slow lid half-lift on the
  horizon; ride the existing `ui.bossNote` + look-yaw fallback seam — NO
  camera hijack, the §5j law 6 budget stays intact for the entrance) and the
  post-13 "it turned" beat (the disc's gaze line re-aims down-lane; one rider
  line). Both fire once, latched in `saveData.flags`.
- **Eligibility guards:** not in rush (`rushMode`), not in canyon, not while
  `game.inBoss`, not after the finale is felled (INC-7 retires it). Determinism:
  placement is a run-constant from the run seed + `sunDir`; zero
  `Date.now`/`Math.random` in the per-frame path.
- **`handoff()` (INC-6):** a new `approachFrom: 'landmark'` branch (the §5j
  engine list names it) + `secondSun.handoff()` — at warn-start the approach
  start pose is derived FROM the landmark's current screen bearing/scale
  (the boss group fades in AT the landmark as the landmark hides — a swap at
  matched angular size, the continuity trick), then eases to station.
  **Graceful degrade is a hard requirement:** no landmark (rush, boss-select,
  fresh save via debug, canyon re-entry) → the branch falls back to the
  shipped `'ahead'` behavior byte-identically. The banner stays HONEST and
  on-time from `top` (row 14 has no banner rule-break).
- **The *Don't Move* entrance (INC-6, same PR as handoff):** an
  `ENTRANCE_SCRIPTS.dontMove` entry per the §5d row-14 choreography — ZERO
  camera hijack, 1.2s dilate @0.28, HUD hide, the lid peels, the revealed
  pupil live-tracks the player's lane-x with the ~0.35s wet lag (self-feed
  `setGaze`; continuous live stick-tracking is 14's EXCLUSIVE claim), one
  fast saccade to dead-center at window end, aperture contract = the NOTICE
  debut. Runs under the existing `flythrough` phase name for the gaze
  exclusion; rider lines whispered; `releaseCineSlow` on skip/exit/reset (the
  §5j leak gotcha). Plus the model-header CP2 task: **suppress the lance
  lock-on reticle during the frozen-cam reveal** (lockLayer.js has
  entrance-suppression precedent per the header note).

### C. The SURGE-CHASE (the §5f verb-shift climax) + STAR PIPS

**What it is (from the design canon):** "stage 3 abandons pattern-dodging —
the shroud opens and the fight becomes a surge-chase … to reach the core
before it re-veils. Endings are remembered by what the player did last."
(§5f Verb-shift climax; "through the wheels" is pre-seraph text — now
"through the mantled wings.")

**Reconciliation with existing machinery (the recommendation):** the finale's
LAST form-bar ending is upgraded from "generic shield → Surge → dissolve" to
an authored **RE-VEIL CYCLE**:
1. At form-3 low HP (the dread card's tail) the core **SEALS** — damage
   immunity at `damageBoss` per the L197 law (**NOT the `shielded` state**,
   which suppresses attacks and aborts setpieces; the unfillable bar is the
   tell). The wings visibly fold over the star-eye (`setStage3` k eased down —
   the model can already do this; add a small `setVeil(k)` wrapper so the
   fight can close/open the mantle without re-running the full unveil).
2. The medley keeps firing THIN (the survival-card amber exemption pattern);
   the stage-III graze quote (INC-2) keeps feeding Surge — the chase's fuel
   loop is the graze ladder the roster taught.
3. On Surge tap, the existing shield-break path is re-skinned as the CHASE
   BEAT: a `SETPIECE_PATHS` entry pulls the boss from station through a
   proximity pass (rel eases 30 → ~6 — the wings flank the player's frame,
   the MARROWCOIL `ribThread`/L155 precedent, NO camera takeover — L156 is
   the binding over-reach lesson: author the drama into what the boss does
   from a fixed viewport) while the mantle opens; the player's Surge lands
   IN the unveiled core. Repeat ≤2 cycles; the final one is the kill and
   flows into the existing emotive dissolve.
4. **The ONE addressed line** (§5f rule-break, banked for stage 3): fired on
   the first re-veil ("It is not looking at the dragon."-class line, owner
   words) — a `ui.bossNote` string, nothing structural.

**STAR PIPS (§5i.C Apex debut — ships in the same increment because the two
mechanics interlock):** perfect parries during the finale bank ≤3 stars
(HUD pips near the Surge bar); each star multiplies the surge-chase strike's
damage (draft ×1.25/star → up to ~×1.75); ALL stars lost on taking a hit.
Wiring: the perfect-parry event already exists (perfect tier, perfect-parry
heal law) — add a def-gated `starPips` counter in boss.js + a small ui pip
row + the multiplier at the chase strike. Deterministic, headless-testable.
The medley's amber floor (every stage carries carriers) guarantees the
opportunity supply.

**Honest sizing:** the seal/cycle state machine + one setpiece path + pips is
a MEDIUM increment, and it is the plan's FEEL cliff — the whole thing is an
ending, and endings are owner-judged. Build the mechanics headless-green,
then expect 1–2 owner iteration rounds on the pass choreography.

### D. The COMPANION-SHARD mascot echo (§8, §5c "leaves a companion-shard echo")

**Nothing exists to reuse as a system** (grep: no companion/follower/pet in
`js/`); what exists to reuse as PARTS: the L142 real-eye recipe + the stage-1
mote materials (a tiny gold-rimmed eye-shard, ~150 tris, 2–3 draws), the
dragon's own banking/lag idioms for follow motion, and `saveData.flags` for
persistence.

**Minimal buildable version (v1 — recommended):**
- On the finale's death resolve, ONE shard detaches from the dissolve (a
  scripted 2s beat inside the existing death flow — the corona's last fleck
  drifts to the player and settles into a trailing offset; rider line).
- `saveData.flags.companionShard = true`; from then on ORDINARY runs spawn
  the shard trailing the player (a lag-follow at a fixed offset behind/above
  the dragon, two idle frequencies, occasional blink — it is a CHARACTER,
  §4 anthropomorphism threshold: two dots + intentional motion).
- The second sun is RETIRED from the sky the same flag-read (the antagonist →
  mascot conversion is the sky-vacancy + the shard in one beat).
- Guards: not in boss fights (clean-arena law), not in canyon; pure cosmetic —
  no gameplay effect in v1 (any buff is an economy question, deferred).
- **Run-scoped vs permanent:** recommend PERMANENT (all subsequent runs) —
  that's the §5c contract reading ("leaves a companion-shard echo" as the
  post-game state) and the fan-art engine. Owner decision D5 (with a settings
  toggle escape hatch if it reads cloying).
- **The lore law:** the shard is the "exactly one new gap for post-game"
  pointer (§5b row 14) — it must POINT (an occasional glance at the horizon,
  an unexplained gold fleck) and never answer. One authored idle beat, no
  dialogue system.

### E. Destructible RELICS (destroy→sag) — without ever locking THE RECKONING

**The contract (the critical decision, recommended): BRANDED-THEN-DESTRUCTIBLE.**
A relic is INVULNERABLE (today's shipped anchor behavior, bit-for-bit) until
it has been branded at least once; a BRANDED relic becomes a destructible
trophy (destroy → sag). Why this beats the alternatives:
- *Destruction-counts-as-claimed* lets gunfire substitute for the lance and
  un-earns THE RECKONING (the lance ladder's showcase — the redesign doc calls
  it "the top of the ladder"); it also creates a second unlock path every
  future tuning session must reason about.
- *Indestructible-until-branded* IS this contract's first half; stating it as
  branded-then-destructible makes the second half explicit.
- **The lockout is then impossible BY CONSTRUCTION:** `reckoningBranded` is a
  Set of names that only grows within a fight; a relic can only die AFTER its
  name is in the Set, so `reckoningBranded.size` can never be starved by
  destruction. No new invariant needed beyond a test that asserts the
  ordering gate.

**Mechanics (all riding shipped plumbing):**
- boss.js `PART_SYS` gains a 4th entry: `{ flag: 'destructibleRelics', crack:
  'crackRelic', hit: 'relicHitTest', alive: 'relicAlive', live: 'liveRelics',
  lockName: (i) => def.reckoningRelics[i] }` — exactly the pane/shackle shape.
  `routePartDamage` gets the branded-gate: relic damage routes only when
  `reckoningBranded.has(name)` (unbranded → today's body damage, unchanged).
- Model side: `crackRelic(i)` = the destroy→sag rite — the trophy's mount
  gives, the body tips/dangles (a small authored droop transform, no physics),
  the palette glow GUTTERS OUT (the KARNVOW death-grammar quote: charms
  gutter one by one) — materials stay `track()`ed so dissolve holds.
- **Lance-coexist seams (each one is a named test):** a destroyed relic (a)
  leaves the paintable set via the existing lockParts-eviction seam
  (`:4668-4677` pattern) so the reticle never offers a corpse; (b) keeps its
  `reckoningBranded` membership (the latch is by-name, already dedup-safe);
  (c) stays `shimmerExclude`d (moot once dark, but assert no shimmer-pool
  re-entry); (d) never resurrects on form transitions; (e) both teardown
  paths reset `liveRelics` (the rung-14 double-teardown lesson, verbatim).
- **The payoff (why destroy at all): the exam edit** (§5f destructibles,
  slot 14: "each destroyed relic removes that boss's quoted card from the
  final exam — the player edits the finale"). Concretely: the INC-1 dread-card
  phrase tags measures with a source relic (`relicHorn`→the Voidmaw measure,
  `relicBlade`→Ashtalon's, `relicLink`→Brineholm's `geyser`,
  `relicSpool`→Weftwitch's lattice measure, `relicShard`→Knellgrave's
  toll measure); the exam phrase is filtered against `liveRelics` at card
  entry. Five of the ~8 exam measures are editable; the rest are load-bearing
  (the exam never empties — fairness floor: ≥3 measures always remain).
- **The trade is the design:** destroying a branded relic deletes its exam
  quote but FORFEITS its steady claimed glow (cosmetic) and — the teeth —
  each destroyed relic REDUCES the star-pip cap by… **no.** Keep v1 clean:
  the trade is exam-thinning vs the trophy row's completeness on the kill
  screenshot. Anything economy-flavored is an owner call (D2b), not a default.

---

## 3. The increments (each = one PR, one GO gate)

Common to ALL increments: def-gated / flag-gated so every other def is
byte-identical; `node tests/run-all.mjs` green (esp. `boss.mjs`, `bossboot.mjs`,
`defs.mjs`, `lockdps.mjs`, `unmaskedorgans.mjs`, `unmaskedreckoning.mjs`,
`entrance.mjs`, save-migration); `node tools/stamp-sw.mjs` in the same commit;
a new `leapfrog/lessons/<date>-<slug>.md` per merge; crops posted, builder
STOPS for the design verdict (§7 delegation protocol).

### INC-1 — THE MEDLEY (def data + card restrike) — SMALL, ships first
- **Does:** replaces the placeholder `phases[].attacks` + `rhythm.phases` with
  the §2A quote table; restrikes card II's name; adds the def-gated one-frame
  VOIDMAW glitch flag (default off); tags dread-card measures with source
  relics (inert until INC-3 reads them); updates stale Ophanim/"~20 eyes"
  comments.
- **New plumbing:** at most a `cardPhrase` override so the dread card can run
  its own exam phrase distinct from phase 3's amble (verify whether the
  existing card→phase 1:1 machinery + a 3rd rhythm phase entry already
  suffices — if the card system force-selects per-card attacks à la
  `embertide_horizonbreak` (`:3462`), reuse THAT seam, zero new code).
- **Proves (headless):** `rhythmprint` KS floor vs all 13; `amberdiet` every
  stage; emission budget on the exam; `lockdps` margins re-cleared (the
  stage-3 timer-34 pin); boot with `?debug&boss=100&bossIdx=13` firing every
  listed id (incl. `geyser`/`crestfall` from a non-native def — the verify
  note).
- **GO gate:** all CI green + a 60s-per-stage headless fire log showing the
  era read (attack sequence dump). **Owner gate:** the FEEL of the three
  tempos + the exam density on the PR preview.

### INC-2 — THE GRAZE MEDLEY (one seam + three quotes) — SMALL
- **Does:** a `grazeFormFor(def, phaseIdx)` resolver at every
  `def.grazeForm === '…'` site (or cheaper: one resolved variable updated at
  phase advance); `unmasked` maps `'medley'` → per-stage
  `['orbitAnnulus', 'holdFlinch', 'shrinkDisc']`:
  S1 the ORBIT ANNULUS drawn ON the corona ring (Eitherwing's quote — the
  anatomy is already a drawn ring); S2 HOLD-UNTIL-FLINCH on the great eye's
  stare-line (Karnvow's quote; reuses `beamHeld` plumbing, the flinch is the
  shipped `flinchFlash` skitter); S3 the SHRINKING SAFE DISC as the mantle
  closes (Knellgrave's quote; the disc is the narrowing wing aperture —
  feeds the chase's Surge hunger by design).
- **Coexist:** every other def resolves to its scalar form via the same
  function — assert byte-identical behavior (the resolver returns
  `def.grazeForm` unless it's `'medley'`).
- **Proves:** per-stage forced-fight sims (`debugStagePin` 1/2/3, each in its
  OWN fresh boot — the rung-14 harness lesson) showing each form arms, pays,
  and disarms at stage exit; existing per-form tests untouched.
- **GO gate:** headless sims + phase-advance reset checks (`:2077-2078`
  pattern). **Owner gate:** the drawn bands' legibility at sky scale.

### INC-3 — DESTRUCTIBLE RELICS (branded-then-destructible + exam edit) — MEDIUM
- **Does:** §2E in full — PART_SYS entry, branded gate at `routePartDamage`,
  model `crackRelic`/`relicHitTest`/`liveRelics` + the sag rite, lockParts
  eviction, exam-measure filtering, both-teardown resets.
- **Proves (extend `tests/unmaskedreckoning.mjs`):** (1) unbranded relic takes
  N hits → zero relic damage, body damage unchanged; (2) brand→destroy →
  `reckoningDone` still reachable with 2 destroyed (order matrix); (3) the
  IMPOSSIBILITY assert: no code path can remove a name from
  `reckoningBranded` or destroy an unbranded relic; (4) destroyed relic's
  tagged measure absent from the exam stream, ≥3 measures floor holds; (5)
  reset on `endEncounter` AND `resetBoss`; (6) dissolve traversal still clean
  (bossboot untracked-material warnings = 0).
- **GO gate:** the matrix test + lance suite green. **Owner gate:** the sag
  rite's read (does a dead trophy read as MOURNED, not broken geometry) +
  whether relic destruction should exist at all (D2 — this increment is the
  cheapest to drop if the owner prefers sacred trophies).

### INC-4 — SURGE-CHASE + STAR PIPS (the ending) — MEDIUM, FEEL-CRITICAL
- **Does:** §2C — the re-veil seal (damage-immunity, NOT `shielded`),
  `setVeil(k)` model wrapper, the chase `SETPIECE_PATHS` entry (proximity
  pass, no camera takeover), Surge-strike resolve into the core, ≤2 cycles,
  star-pip bank/HUD/multiplier/loss-on-hit, the ONE addressed rider line,
  the re-struck stage title cards if not already landed ("II/III — THE
  UNMASKED", §5f honest restrike).
- **Charge-kill law:** every hold/seal transition clears the in-flight
  wind-up (`chargeT=0; setCharge(0); setAttackTell(null)`) — the rung-14
  CP2 lesson, verbatim, or a volley lands mid-spectacle.
- **Proves:** headless — seal engages at the threshold with the bar visibly
  unfillable; medley keeps firing thin through the seal (amber exemption
  logged); surge tap → setpiece runs → damage lands ×(1+0.25·stars); pips
  reset on hit; kill resolves into the shipped emotive dissolve; skip/death
  during the chase releases every latch (slow-mo sentinel, setpiece,
  seal) on both teardowns. Worst-frame additive-fill audit during the chase
  (halo + starburst + surge shell + kit shield — the §2 cliff; the
  KNELLGRAVE FILL-AREA test is the template).
- **GO gate:** the latch/teardown matrix + fill audit. **HARD OWNER PLAYTEST
  GATE:** the chase pass choreography, pacing of the re-veil cycles, star-pip
  legibility. Budget 1–2 redo rounds; the L156 no-camera-takeover law is
  non-negotiable going in.

### INC-5 — THE SECOND-SUN LANDMARK (persistent presence) — MEDIUM-LARGE
- **Does:** §2B's ambient system — `js/secondSun.js`, environment.js hookup,
  ledger-driven aperture notches, first-appearance + "it turned" beats
  (flag-latched), eligibility guards, seeds-on-load for saves with ≥1
  Calamity kill (the C1 clause).
- **Proves (headless, a new `tests/secondsun.mjs`):** absent on fresh save /
  rush / canyon / inBoss; present + fog-exempt + STATIC on an eligible run
  (poll its world transform across 10s — zero drift); aperture pure function
  of the ledger (notch table asserted); beats latch once; zero per-frame
  allocation/`Math.random`; draw/tri delta ≤ 3 draws; save-migration green.
- **GO gate:** the above + `tricount`/perf delta ≈ 0. **Owner gate:** the
  sky read on every biome (esp. PALE skies — the corona needs the shipped
  dark separation-halo trick from stage 1; judge on tiershots across biomes).

### INC-6 — `handoff()` + *DON'T MOVE* (the approach + entrance) — MEDIUM
- **Does:** `approachFrom: 'landmark'` branch (+ its banner `dir` mapping to
  `top`), `secondSun.handoff()` (matched-scale swap → ease to station),
  `ENTRANCE_SCRIPTS.dontMove` per the §5d choreography (zero hijack, 1.2s
  dilate, live stick-tracking, saccade, NOTICE debut), reticle suppression
  during the frozen reveal (lockLayer precedent), def gains
  `entrance: 'dontMove'` + `approachFrom: 'landmark'`.
- **Degrade law (hard):** no landmark → `'ahead'` byte-identical; rush replays
  get the shortened variant (the §5j rush rule); skip lands at station with
  every latch released.
- **Proves:** `tests/entrance.mjs` pattern — skip path, slow-mo sentinel,
  banner honest/on-time, gaze-exclusion (the `placeGroup` stomp gotcha,
  boss.js `:1158`-class), reticle suppressed during the window and restored
  after, degrade path boots clean from boss-select and rush.
- **GO gate:** entrance suite + degrade matrix. **HARD OWNER PLAYTEST GATE:**
  the stillness itself — "after thirteen entrances of escalating motion,
  nothing moves but its attention." If it reads as a loading screen, the fix
  is in the pupil's lag/saccade timing, not in adding motion (the §5j band
  boundary: 13 is the sky in maximum motion, 14 perfectly still — protect it).

### INC-7 — THE COMPANION SHARD (the capstone) — SMALL-MEDIUM
- **Does:** §2D — the death-beat detach, `saveData.flags.companionShard`,
  the ordinary-run trailing shard (lag-follow, blink, the one pointing idle),
  second-sun retirement on the same flag, guards.
- **Proves:** headless — flag set exactly on unmasked defeat (not on other
  bosses, not on game-over mid-fight); next boot spawns the shard and NOT the
  second sun; shard absent in boss/canyon; save migration; zero effect on any
  pre-fell save.
- **GO gate:** flag matrix + boot suite. **Owner gate:** cuteness calibration
  (the §4 pupil-size law: too big goes googly) + permanence (D5).

---

## 4. Budgets & laws checklist (the gates every increment answers to)

- **60fps weak mobile / overdraw cliff (§2):** the only additive adds in this
  plan are the landmark corona (small, far) and the chase worst-frame; both
  get FILL-AREA audits (≤2 large additive volumes incl. kit shield; the
  KNELLGRAVE worst-frame test is the copy source). No InstancedMesh anywhere
  (L126). Tri deltas: relic sag +0, shard ~150, landmark ~300 — noise against
  the 30k Apex budget; draws stay under the ≤120 gate (currently far below).
- **≤1-new-attack-id-per-band:** ZERO new ids (the thesis); the exam is a
  phrase, not an id. CI: the def's attack lists ⊆ `ALL_ATTACKS`.
- **Determinism / rnd-stream discipline:** no model geometry changes in
  INC-1/2/4/6/7; INC-3's sag is transform-only (no new seeded draws — but the
  rung-14 rule applies to ANY model insertion: nothing seeded is built after
  the relics, verify before touching); landmark seeded from run seed, static.
- **Frontality/silhouette (§3/§3b):** no silhouette changes except the sag
  (authored, mirrored-placement law — the sag is the ONE new asymmetry and it
  is player-EARNED, which §3.6 permits as memory hook) and the veil cycle
  (reuses the signed-off mantle poses).
- **Charisma/seven-channel (§4b):** already built in the model; INC-4 adds the
  veil as a CHARGE-TELL extension and INC-6 debuts NOTICE as authored — no
  new channels needed; the shard is its own micro-carrier (blink + gaze).
- **Fairness:** amber floor per stage (CI); the seal follows the survival-card
  honesty rules (unfillable bar, attacks keep firing, outlasting never
  hard-walls — Surge is graze-fed and grazing is always available); star pips
  reward, never punish declining (§5i.C law 6).
- **Render-order LAW:** landmark + shard live in the sky/ambient tiers, never
  over bullets.

## 5. Risks, ranked by ship-danger

| # | Risk | Failure mode | Mitigation | Verifiable |
|---|---|---|---|---|
| 1 | **RECKONING lockout regression** (INC-3) | a destroyed-unbranded relic makes the finale burn permanently unreachable — the silent-ship trap CP1 flagged | branded-then-destructible makes it impossible by construction; the order-matrix test is the merge condition | headless |
| 2 | **lockdps / timer-margin regression** (INC-1) | real medley cadence pushes stage-3 TTK past the 34s timer → the not-a-phase-deleter gate red-flags, or worse, ships a card that times out honest play | re-run lockdps in the INC-1 loop; tune rests, never bullet count | headless |
| 3 | **Surge-chase reads as a cutscene** (INC-4) | camera/agency over-reach — the exact L156 rejection (owner rejected it 2× on MARROWCOIL) | no camera takeover, player keeps stick, boss moves not the camera; budget redo rounds | HARD OWNER GATE |
| 4 | **The entrance stillness fails** (INC-6) | *Don't Move* reads as nothing-happening after 13 kinetic entrances | the read is carried by the pupil-drag (the player PERFORMS it); tune lag/saccade, protect the 13/14 extremes | HARD OWNER GATE |
| 5 | **Handoff pop** (INC-6) | landmark→boss swap mismatches scale/bearing → continuity breaks at the fight's most-watched moment | matched angular-size swap + a same-frame screenshot diff in the entrance test; degrade path always available | headless geometry + owner |
| 6 | **rhythmprint collision** (INC-1) | quoting envelopes verbatim collides the aggregate KS with a quoted boss | tempo-shift every quote; the gate is CI | headless |
| 7 | **`geyser`/`crestfall` cross-def assumptions** (INC-1) | patterns emit wrong-origin/wrong-shape from a non-native def | boot-test both from the unmasked def before committing the table; fallback ids named | headless |
| 8 | **Chase worst-frame overdraw** (INC-4) | halo + starburst + surge shell + shield stack past the cliff on-device | fill-area audit + on-device pass (the feasibility doc already demands a real-phone pass for stage 2) | headless audit + device |
| 9 | **Landmark on pale skies** (INC-5) | white corona vanishes / reads as a UFO on bright biomes | the shipped stage-1 dark separation-halo; tiershots across all biomes | owner on crops |
| 10 | **Exam density unfairness** (INC-1) | "Every Verdict at Once" thinned wrong → wall-with-no-hole | emission-budget CI + safe-lane checks; serial interleave keeps per-volley density at taught levels | headless + owner |
| 11 | **Shard reads cloying / distracting** (INC-7) | the mascot conversion lands as clutter | small, dark-bodied, §3-law-8 satellite discipline; settings escape hatch | owner |
| 12 | **Save-flag leaks** (INC-5/7) | aperture/beat/shard flags survive into states they shouldn't (rush, fresh saves, migration) | flag matrix tests + save-migration suite | headless |

## 6. Explicitly OUT of scope / deferred

- **Post-game content** answering the shard's gap, EX cards, NG+ parry
  reserves (poise bar, amber bank, …) — §5f/§5i reserves stay parked.
- **Ledger-driven exam filtering** (quote only felled bosses) — post-v1 (D1).
- **Sentinel entrance retrofits** (slots 1/2/4 staged scripts) — not this arc.
- **A relic-destruction economy** (score/ember trades) — owner-initiated only.
- **Concurrent multi-pattern emission** for the exam — rejected (§2A); the
  serial interleave is the design.
- **Victory tableau / auto-capture share card** (§8 backlog) — the kill
  slow-mo + FELLED card suffice for v1.
- **Any lance/scarBurn retune** — the 0.20 frac and the lance organ set are
  SHIPPED and frozen; this plan only protects them.

## 7. Recommended build sequence + the owner decisions

**Sequence:** INC-1 → INC-2 → INC-3 → INC-4 → INC-5 → INC-6 → INC-7.
Fight-side first because each is headless-provable and the placeholder fight
is the largest gap between shipped and promised; spectacle second because
INC-6 depends on INC-5 and both are owner-gated; the capstone last because its
emotional weight depends on everything before it being real. INC-5 can run in
parallel with INC-3/4 by a second session if desired (disjoint files:
environment/save vs boss/model) — the only shared seam is the def.

**Decisions the OWNER must make before build starts:**
- **D1 — The medley quote table** (§2A): sign off the per-stage id sets +
  the exam measure list; static-vs-ledger exam (recommend static).
- **D2 — Relic destructibility:** (a) confirm branded-then-destructible, or
  keep relics sacred and DROP INC-3 (the exam then ships unedited — cheap
  cut, nothing else depends on it); (b) any economy teeth on destruction
  (recommend none).
- **D3 — The surge-chase shape:** ≤2 re-veil cycles + proximity-pass strike
  (recommended) vs a single-cycle minimal seal; star-pip multiplier value.
- **D4 — Second-sun schedule confirmation:** first-Calamity-kill seeding +
  per-band aperture notches + retroactive seed-on-load (all per §5h/C1) —
  confirm no schedule change before INC-5 is built.
- **D5 — Shard permanence:** permanent across runs (recommended) vs
  run-scoped; appearance sign-off (the cute/dreadful dial).
- **D6 — Card II restrike name** (`'II — The Unfurling'` vs `'II — THE
  UNMASKED'` stage grammar).
- **D7 — The one-frame VOIDMAW glitch:** ship in INC-1 (default) or cut.
