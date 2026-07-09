# ATTACK-REWORK-PLAN.md — the adversarial boss attack-pattern audit + rework

**Scope:** attack patterns only — `phases[].attacks`, `cards[]`, dread delivery, rhythm/graze/parry
interplay — for BOSS_ORDER slots 1–13, plus the slot-14 quote plan. This is a DESIGN document;
no code is changed by it. Everything cites `bossDefs.js` defs, `boss.js` pattern functions and
`SETPIECE_PATHS`, `BOSS-DESIGN.md` §§4b/5b/5c/5f/5g/5h/5i, and the existing
`boss-context/audit/BOSS-AUDIT-REPORT.md` (cited as AUDIT). Citations are by **symbol and quote,
never line number** (anchors drift — AUDIT §3.A already caught that failure mode).

**Ground rules honored throughout:**
- ≤1 NEW attack id per band (§5b). This plan spends exactly **one**: `geyser` (Calamities band,
  debuts at slot 8 BRINEHOLM). Every other rework composes the existing vocabulary
  (`aimed fan spiral tunnel spiralStream movingGap iris stream crossfire curtain secondWave
  ribThread crestfall yourWings`) or is emitter/telegraph plumbing on an existing id (the
  sanctioned `firePaneRadial` precedent — a reroute, not an id).
- §5f dread NAMES are kept everywhere (they're allocated identity); what gets reworked is
  **delivery**. Where a name is currently a lie in code, that is called out explicitly.
- Craghold is RETIRED (§5b footnote ¹); its def still exists in `bossDefs.js`
  (`id: 'craghold'`) but it is not audited — ASHTALON owns slot 3.
- Where the code already fixed something the doc/audit flagged, it is credited and NOT reworked.

---

## 0. TL;DR VERDICT TABLE

| # | Boss | Verdict | Is the dread REAL? | One-line evidence |
|---|------|---------|--------------------|-------------------|
| 1 | VOIDMAW | **SOLID** | Yes (spectacle-dread) | `tunnel` debuts at the dread card; center-line is a genuine graze goldmine (rings sized < grazeR by design comment) |
| 2 | STORMREND | **NEEDS-WORK** | **No — additive unlock** | dread = P2 set + `iris` + tighter cadence; counter-verb is the default dodge; the "Heart of the Storm" has no heart |
| 3 | ASHTALON | **NEEDS-WORK** | Half — pose real, answer missing | `stoopingStrike` setpiece is a true climb-hold-dive; the §5f answer "surge INTO the dive gap" has no mechanic (SLIPSTREAM unshipped, AUDIT §3.B.2) |
| 4 | MARROWCOIL | **NEEDS-WORK** | Half — shape real, parry job dead | `closingRibs` constricts for real; ORGAN BREAK "never shipped" (AUDIT §3.B.1), THREAD-THE-GAP scoring absent |
| 5 | EITHERWING | **NEEDS-WORK** | **No — the dread's headline is the vocabulary's default** | "simultaneous mirrored crossfire" is what `crossfire` does for every boss, from fixed `[-10, 10]`, ignoring the twins' actual positions |
| 6 | HOLLOWGATE | **SOLID** | Yes | pane-radial reroute + PANE BREAK + `roseJudgment` portcullis close = real geometry, real non-default verb; one collision (see 8) resolved on 8's side |
| 7 | THRUMSWARM | **SOLID** | Yes | `yourWings` replays the player's recorded path (`wingsPath = poseRing.slice(-70)`); formation-as-telegraph (`SWARM_ATTACK_FORM`) is unique; only its cadence dials overshoot (Part B) |
| 8 | BRINEHOLM | **NEEDS-WORK** | **No — fantasy inverted** | P4 dread attack set is the *identical multiset* to Hollowgate's P4; "the floor erupts in geyser curtains" but no shipped pattern travels upward |
| 9 | KARNVOW | **DULL** | **No — a nostalgia replay answered by dodge** | 5 attack ids total, 3 cards (under the Calamities 4–5 floor), cadence slower than slot 7; the dread quotes boss 1 verbatim and asks nothing new |
| 10 | KNELLGRAVE | **DULL** | Survival card real; the rest is a name-shaped void | kit = `aimed/fan/iris/crossfire` (Sentinel vocabulary) at a World-Ender slot; "Pendulum Sweep" contains no pendulum; the toll's bullets CONTRACT while sound expands |
| 11 | WEFTWITCH | **NEEDS-WORK** | Half — the stated counter-read is not wired | dread's answer is "read which lane her hands never touched," but `curtain`'s gap is placed by `-Math.sign(player.position.x)` — the hands tell you nothing |
| 12 | ONEWING | **SOLID** | Yes | dodge-mirror ghost volley (`emitGhostHalf` + `poseRing` extrapolation), frame-break parry ladder, RUBATO feints, the lying FELLED card — the WE band's best fight |
| 13 | EMBERTIDE | **NEEDS-WORK** | **Broken by one def line** | Horizon Break sets `horizonPocketX` (the face-shadow pocket) but only `crestfall` reads it — and `crestfall` is **not in P5's attack list** |

Bosses needing rework in Part C: **2, 3, 4, 5, 8, 9, 10, 11, 13.** Solid and untouched: 1, 6, 7, 12
(each gets only a note). New attack id spent: **`geyser`** at slot 8 (Calamities band budget).

---

## PART A — THE AUDIT, BOSS BY BOSS

Format per boss: current kit (quoted from the def) → dread (def + card + code geometry) →
judgment against §5f laws 1/2/3/4/5/7 + the §5c band contract → verdict.

> **Building any of this?** Start at **PART E** (end of file): the build queue, the honest
> spec-gap ledger, the per-rework gate list, and the checkpoint-agent protocol. Parts A–D are
> the design; Part E is how a fresh session ships it without breaking the roster.

### A.1 — VOIDMAW (slot 1, Sentinel) — SOLID

**Kit** (`id: 'voidmaw'`): P1 `['aimed']` → P2 `['aimed','fan']` → P3 `['aimed','fan','tunnel']`,
cadence 1.9–2.5 → 1.4–1.9, `rhythm.signature: 'metronome'`. Cards `voidmaw_verdict` /
`voidmaw_cloven` / `voidmaw_splitter` (dread).

**Dread** — *"HOLLOW JUDGMENT — Sky-Splitting Verdict"* (`voidmaw_splitter`). Geometry: `tunnel`
debuts here — "a succession of bullet-RINGS rushing at you… its centre weaving side to side"
(executeAttack), rings deliberately sized under grazeR ("flying the centre still SKIMS the whole
ring → constant grazing").

**Judgment.** 3-move core ✓ (aimed = parry, fan = weave, tunnel = read/thread). Phase grammar ✓
(strict introduce→develop→twist; each phase adds exactly one id). Teach-before-test ✓ — this IS
the teacher. Emitter=organ ✓ via `def.muzzle` fallback + L148 wiring for aimed. Turn-taking ✓
(metronome is the point). The dread's answer — hold the weaving tube's center and farm the skim —
is mildly counterintuitive for a first boss (instinct says flee the rings) and is explicitly the
graze goldmine. For slot 1's "a duel" contract, correct. **Do not touch.**

One honest ding, accepted: the dread's counter-verb is still dodge-family. §5f law 2 allows
"spectacle-dread for early" bosses; slot 1 is where the exemption belongs.

### A.2 — STORMREND (slot 2, Sentinel) — NEEDS-WORK

**Kit** (`id: 'stormrend'`): P1 `['fan']` → P2 `['fan','movingGap']` → P3
`['fan','movingGap','iris']`, `rhythm.signature: 'crescendo'`. Cards `stormrend_wall` /
`stormrend_squall` / `stormrend_eye` (dread).

**Cross-check credit:** AUDIT §4 scored Stormrend "0 — NONE. No named card or dread move anywhere
in the doc." The **code has since fixed the existence problem** — `stormrend_eye` with
`dread: true` ships in `bossDefs.js`. Don't re-litigate absence. Litigate quality.

**Dread** — *"EYE OF THE GALE — Heart of the Storm"* (`stormrend_eye`). Geometry: the P3 set is
P2's set plus `iris` at cadence tightened from `[1.6, 2.1]` to `[1.4, 1.9]`. `iris` = "contracting
rings… the safe zone is the middle" (executeAttack) — thematically apt (fly into the eye of the
storm), but:

**Charges.**
1. **The dread is an additive unlock, not a twist.** §5f law 3: "Twist = ONE systemic change,
   NOT just 'same + faster'." P3 is literally P2 + one id + faster. The `iris` that carries the
   dread's name is the same `iris` five later bosses fire; nothing marks this one as the *Heart*.
2. **The counter-verb is the default.** §5f law 2 demands a "COUNTERINTUITIVE answer that uses a
   non-default verb." Iris's answer is dodge-to-center — the exact answer `tunnel` taught one
   boss earlier. A player arrives pre-solved.
3. **Teach-before-test violated on its own card**: `iris` debuts *inside* the dread phase — the
   first contracting ring the player ever sees is the near-lethal named one.
4. **No parry job** (§5b footnote ³ admits slots 1–3 carry only base roll-reflect) — but `fan` IS
   amber in code (`emitBoss(..., true)` in the fan branch), so the raw material exists.

**Band contract** (§5c "a duel"): met. The failure is §5f law 2/3, not the band. **Rework C.1.**

### A.3 — ASHTALON (slot 3, Colossi opener) — NEEDS-WORK

**Kit** (`id: 'ashtalon'`): P1 `['aimed','stream']` → P2 `['fan','stream','crossfire']` → P3
`['stream','spiralStream','secondWave']`, `rhythm.signature: 'ambush-rest'`, setpieces
`circlingPass` (P2, moving) + `stoopingStrike` (P3, moving, dread). Cards `ashtalon_stoop` /
`ashtalon_circle` / `ashtalon_strike` (dread).

**Cross-check credit:** the §5i.C "immediate hotfix: ASHTALON P3 currently 0% amber" is **shipped**
— `stream`'s code comment: "Every 4th tick is AMBER-tipped (reflectable): the §5i C.1 parry-diet
hotfix… so stream-heavy dread phases (ASHTALON P3, MARROWCOIL P3) still meet the AMBER FLOOR."
Amberdiet: fixed. Don't rework.

**Dread** — *"EMBER HUNT — Stooping Strike"* (`ashtalon_strike`). The `stoopingStrike` setpiece is
genuinely excellent: "climb + HOLD (the 2–3s ritual pose)" then a squared-easing plunge
(`e = ((k - 0.42) / 0.30) ** 2` — "the diving acceleration"), firing the whole way. Held ritual ✓,
screen-filling motion ✓, emitter=organ ✓ (the hunter itself is the pattern origin).

**Charges.**
1. **The named answer does not exist.** §5f assigns "answer: surge INTO the dive gap." Nothing in
   the fight rewards surging into the dive; the §5i.B SLIPSTREAM graze form ("ride the stoop's
   wake — a moving safe pocket with collision walls") is confirmed absent (AUDIT §3.B.2: "All
   three Colossi graze forms absent"). As shipped, the correct play against the roster's first
   moving dread is… sidestep. Default verb. The dread's terror-to-mastery conversion (law 2's
   whole point) has no rail to run on.
2. **P3's non-stream ids are off-brand.** `spiralStream` is a station-keeping rotating emitter
   ("arms of bullets sweep around" from `anchorX`, the player-side lane anchor) — a FILL, on the
   boss whose §5b brief says "fast but sparse" and whose slot brief bans fills by identity
   ("closing + cadence — fast but sparse"). The hunter briefly impersonates a turret.

**Band contract** (§5c Colossi, "the fight moves"): met and then some — this is the shipped
exemplar. **Rework C.2 (surgical: replace one id, ship the allocated graze form).**

### A.4 — MARROWCOIL (slot 4, Colossi) — NEEDS-WORK

**Kit** (`id: 'marrowcoil'`): P1 `['aimed','fan']` → P2 `['iris','stream','crossfire']` → P3
`['iris','movingGap','spiralStream','stream']`, `rhythm.signature: 'burst-sustain'`, setpieces
`ribThread` (P2, moving) + `closingRibs` (P3, moving, dread), `muzzle: 'skullGroup'`. Cards
`marrowcoil_surface` / `marrowcoil_rings` / `marrowcoil_closing` (dread).

**Cross-check credit:** P3 amber is data-fixed — the def comment on P3: "`stream` added as the
AMBER carrier (§5i C.1 data-tune…)." The `ribThread` flyby is AUDIT's "roster's best shipped
fight beat" (5/5). The BURST-vs-SUSTAIN rhythm def is live.

**Dread** — *"MARROW — The Closing Ribs"* (`marrowcoil_closing`). The `closingRibs` setpiece holds
at `HOLD_REL = 13` with a ±11 lateral sweep while "the model constricts the ribcage one pair at a
time" — real constriction, real pose.

**Charges.**
1. **The allocated parry job is a ghost.** §5b slot table: "rib-slam ambers → ORGAN BREAK (Colossi
   debut): parry a rib-slam's ambers N× → that rib CRACKS, its pattern component deleted." AUDIT
   §3.B.1: "**ORGAN BREAK never shipped**… shipped slot 6's PANE BREAK is documented as a reuse of
   a debut that never happened, breaking §5f law 4 (teach-before-test) in the live game." The
   dread has no parry read at all; its ambers are the generic stream tip.
2. **Emitter=organ is aspiration, not geometry, for the ring patterns.** The slot brief promises
   "ring/iris fills emit as expanding bone-white rings off the coil circles." In code, `iris`
   anchors at `anchorX` (`player.position.x * 0.7`) and `B.fightHeight` — the rings come from the
   player's side of the lane, not the coil. (The L148 wiring note sanctions this — "Lane-shaped
   patterns (iris/tunnel/curtain) keep their lane geometry" — but for the boss whose *body is the
   arena*, the sanction wastes the identity.)
3. **THREAD-THE-GAP scoring** ("tighter+later = bigger chunk, consecutive threads chain") absent
   (AUDIT §3.B.2), so threading the closing ribs pays the same as any buzz tick — the "graze
   goldmine" clause of its §5f assignment is unpaid.
4. **P1 opener collision**: `['aimed','fan']` is byte-identical to Hollowgate P1 and Thrumswarm P1
   (see Part B).

**Verdict: NEEDS-WORK** — the skeleton (literally) is right; the promised interior mechanics are
missing. **Rework C.3.**

### A.5 — EITHERWING (slot 5, Colossi peak) — NEEDS-WORK

**Kit** (`id: 'eitherwing'`): P1 `['aimed','movingGap']` → P2 `['crossfire','secondWave','stream']`
→ P3 `['crossfire','movingGap','iris']`, `rhythm.signature: 'call-response'`, setpieces
`figureEight` at both P2 and P3 (P3 flagged dread). Cards `eitherwing_divide` /
`eitherwing_baton` / `eitherwing_both` (dread).

**Dread** — *"EITHER/OR — Both Halves at Once"* (`eitherwing_both`), §5f: "the eye splits its
light: simultaneous mirrored crossfire."

**Charges.**
1. **The dread's headline mechanic is the vocabulary's default behavior.** `crossfire` in
   executeAttack: "two flanking emitters fire converging aimed spreads" — `for (const ex of
   [-10, 10])`. Every crossfire, on every boss, is already "simultaneous mirrored" fire from both
   flanks. Karnvow P1 fires it. Ashtalon P2 fires it. The twins' *one* unique claim — "the twins
   ARE the ±10 flank emitters" (§5b slot brief) — is not in the geometry: the emit x is the
   constant `[-10, 10]` whatever the `figureEight` lemniscate is doing with the actual bodies.
   During the dread the twins dive past the camera (`rel` sweeps 26 → −6, "the near lobe crosses
   BEHIND the player") while their supposed gunfire keeps arriving from two fixed lane posts
   nobody is standing on. That is a §5f law 7 violation *dressed as compliance*.
2. **P3 vs P2 is a reshuffle.** P2 `crossfire/secondWave/stream` → P3 `crossfire/movingGap/iris`:
   crossfire persists, two wall-ids swap for two other wall-ids. The one real twist available —
   CALL-AND-RESPONSE collapsing into OVERLAP ("overlapping only at the dread card," §5i table) —
   is a rhythm-def property the geometry never confirms, because the origins never move (see 1).
3. **ORGAN BREAK reuse** ("parry the holder's amber volley 3× mid-possession → the handoff
   STAGGERS, the eye DROPS") — dead, same as slot 4 (AUDIT §3.B.1). The kill-order duo law
   ("whichever twin holds the eye when the pair breaks fires the desperation card alone", §5f Duo
   law) has no player-facing lever without it.
4. **ORBIT ANNULUS** (its allocated §5i.B graze form, "co-rotate with the figure-eight inside a
   drawn band") — absent (AUDIT §3.B.2). The Colossi *peak* ships with the Sentinel graze kit.

**Band contract**: "anti-flee peak (crossfire/secondWave/movingGap with alternating origins)" —
the *alternating origins* clause is the unmet one. **Rework C.4.**

### A.6 — HOLLOWGATE (slot 6, Calamities opener) — SOLID

**Kit** (`id: 'hollowgate'`): P1 `['aimed','fan']` → P2 `['curtain','movingGap','aimed']` → P3
`['spiral','stream','fan']` → P4 `['spiralStream','curtain','iris','stream']`,
`rhythm.signature: 'verse-chorus'`, `muzzle: 'roseHub'`, setpieces `archPass` + `roseJudgment`
(dread), `destructiblePanes`.

**Dread** — *"THE DOOR PRAYS — Rose Judgment"* (`hollowgate_judgment`). Delivery is real: the
`destructiblePanes` branch at the top of executeAttack reroutes `spiral`/`spiralStream` through
`firePaneRadial` — "the window's live panes ARE the emitters… parrying a pane's amber cracks it
(PANE BREAK). Cracked panes drop their arm." The `roseJudgment` setpiece holds at `HOLD_REL = 15`
while "the model CLOSES the portcullis and blazes all 8 panes." Emitter=organ genuinely delivered;
parry job (PANE BREAK) shipped and non-default; the player sculpts the pattern by shooting or
parrying panes. §5f laws 1/2/5/7 pass on real geometry.

**Notes, not reworks:**
- Its P4 attack multiset `{spiralStream, curtain, iris, stream}` is **identical** to Brineholm's
  P4 `{curtain, iris, spiralStream, stream}` — the collision is charged to slot 8 (A.8), because
  Hollowgate's half of the set is transformed by pane-radial and Brineholm's is transformed by
  nothing.
- Teach-before-test wrinkle: PANE BREAK is documented as an ORGAN BREAK *reuse* but is actually
  the debut in the live game (AUDIT §3.B.1). Fixing slot 4 (C.3) retroactively repairs the ladder;
  no change needed at 6.
- P1 `['aimed','fan']` opener collision — resolved by the C.3/C.5 opener diffs, not here.

### A.7 — THRUMSWARM (slot 7, Calamities) — SOLID

**Kit** (`id: 'thrumswarm'`): P1 `['aimed','fan']` → P2 `['spiral','stream','aimed']` → P3
`['curtain','movingGap','fan']` → P4 `['spiralStream','crossfire','stream','iris']`,
`rhythm.signature: 'pressure-ostinato'`, `muzzle: 'queenGroup'`, setpieces `condensePass` +
`yourWings` (dread).

**Dread** — *"A THOUSAND — Your Own Wings"* (`thrumswarm_wings`). Fully real: `armSetpieceForPhase`
snapshots `wingsPath = poseRing.slice(-70)` and the `yourWings` path function replays the player's
own recorded x/y ("the lateral x/y REPLAYS what the player just flew, clamped to the arena for
fairness") with a close flyby to min rel ~3. The counterintuitive answer is a genuine read: the
copy flies your PAST — safety is wherever you *weren't*, which punishes habitual dodge loops and
rewards deliberately "poisoning" your own recording before the card. `SWARM_ATTACK_FORM` maps
every attack id to a swarm formation ("the swarm condenses into the shape, then the shape fires")
— the strongest emitter=organ implementation in the roster, because the body IS the pattern.
SCATTER STAGGER parry job shipped (referenced by `lockDeflected`'s `condenseLive < 0.45` seal).

**Note, not a rework:** its cadence dials (P4 `[1.05, 1.4]`) undercut the Calamities 1.2 floor and
out-pace both slot 9 and most of the WE band — a **dial retune, Part B finding B-3**, not a
pattern problem. Keep every mechanic.

### A.8 — BRINEHOLM (slot 8, Calamities relief) — NEEDS-WORK

**Kit** (`id: 'brineholm'`): P1 `['stream','aimed']` → P2 `['stream','tunnel','aimed']` → P3
`['stream','iris','fan']` → P4 `['curtain','iris','spiralStream','stream']`,
`rhythm.signature: 'tidal-drone'`, `muzzle: 'brineMaw'`, setpiece `sounding` (P4, moving, dread),
`destructibleShackles` + the shipped mercy mechanic ("each shackle freed EARLY relaxes the cadence
in the bound phases," the def-gated `mercy` multiplier at the attack-release seam).

**Dread** — *"THE ISLAND BREATHES — Sounding"* (`brineholm_sounding`), §5f: "it dives; the whole
arena floor erupts in geyser curtains; spectacle-dread."

**Charges.**
1. **Nothing erupts.** The `sounding` setpiece is real (sinks to `SINK_Y = -7`, "HOLDS under while
   the arena floor erupts in geyser curtains" per its own comment) — but the *patterns that fire
   during the hold* are `curtain`/`iris`/`spiralStream`/`stream`, all of which spawn at lane
   coordinates and close toward the player with `vy = 0` (curtain) or contract inward (iris).
   Not one bullet in the game travels **upward from below the frame**. The only vertical-entry
   pattern in the codebase is `crestfall` — which falls DOWN and is "EMBERTIDE-only (listed in
   its phases); every other boss never selects it" (executeAttack comment). The dread's entire
   fantasy is carried by the boss model submerging while the bullets behave like everyone else's.
2. **The dread attack set is an identical multiset to Hollowgate's P4** — `{curtain, iris,
   spiralStream, stream}` — two slots apart in the same band, and Brineholm has no pane-radial
   equivalent to transform its copies. The band contracted "the fight is a scene" (§5c) delivers
   the same scene twice.
3. Its §5i.B graze forms (SHADOW-RIDE + SPRAY-SOAK) — SPRAY-SOAK on freed shackles has code
   presence (`soakT` reset in the encounter-reset line), SHADOW-RIDE ("the whale's lee vs
   geysers") is anatomically impossible while geysers don't exist.

**What's right and kept:** TIDAL DRONE as the deliberate band breather (AUDIT §6 cleared it),
SHACKLE BREAK mercy (shipped, distinctive, the roster's only mercy-as-mechanics), the maw muzzle,
`tunnel` in P2 as the rising-ring read. **Rework C.5 — this is where the Calamities band's ≤1 new
attack id gets spent (`geyser`), because the fantasy is unreachable by composition:** every
existing wall id enters from ahead or above; "below" needs one new emitter direction, and slot 8
is the below-approach boss (`approachFrom` fog-line identity, §5b "below-horizon").

### A.9 — KARNVOW (slot 9, Calamities PEAK) — DULL

**Kit** (`id: 'karnvow'`): P1 `['aimed','crossfire']` → P2 `['aimed','crossfire','stream']` → P3
`['aimed','fan','tunnel']`, cadence `[1.4,1.8] → [1.3,1.6] → [1.2,1.5]`,
`rhythm.signature: 'aggression-exchange'`, `muzzle: 'lanceTip'`, setpieces `flankCutIn` +
`voidmawVerdict` (dread), `reflectRiposte` (shipped v1: "reflect-once riposte: one per phase").
Cards `karnvow_gambit` / `karnvow_riposte` / `karnvow_verdict` (dread).

**Cross-check credit:** the GRANDEUR REDO shipped (§5b row: "authored Voidmaw's-Verdict seal +
arena-scale festoon + de-wizarded lance-head"), the `voidmawVerdict` loom setpiece is authored,
and the riposte v1 is live — "the parried shot comes BACK a beat after the swat" with its teach
note ("IT PARRIED YOUR PARRY — SWAT IT BACK"). Those are real. They are also not enough.

**The case for DULL (AUDIT already named it "the awe trough at the difficulty peak" — this is the
combat-side evidence):**
1. **Five attack ids across the whole fight** (`aimed, crossfire, stream, fan, tunnel`) — four of
   them Sentinel-era precision shots, at the band's *difficulty peak*, in the band contracted for
   "the fight is a scene." Slot 9's fight is a Tier-1 fight with better lore.
2. **Three cards / three phases** against the §5g Calamities floor of "4–5 cards." The band peak
   ships the band's thinnest move-set — thinner than the band's designated *breather* (Brineholm:
   4 cards).
3. **The challenge peak is slower than the mid-band.** P3 cadence `[1.2, 1.5]` vs Thrumswarm P4
   `[1.05, 1.4]` — the slot billed "tightest Tier 3 cadence" (§5b brief) is out-paced two slots
   earlier (AUDIT §3.E.2 flagged the doc side; the code numbers confirm it).
4. **The dread is a museum piece.** *"WEARS THE HORN — Voidmaw's Verdict"* quotes boss 1's P3
   verbatim — def comment: "P3 QUOTES boss-1's dread set VERBATIM (aimed/fan/tunnel…)." As lore,
   inspired. As a test: the player answers the roster's FIRST exam again, eight slots later, with
   the same default verbs it was solved with the first time. §5f law 2 demands a counterintuitive
   non-default answer; the shipped answer is "dodge, as taught in the tutorial." The quote makes
   the fight *easier* than its own P2 (aimed/crossfire/stream at similar cadence with the cut-in).
5. **The allocated showcase is deferred exactly where it was needed.** §5i.C Calamities debut:
   "TENNIS RALLY + REFLECT-ONLY SEAL (9, the showcase: it bats your cyan back as one big
   returnable orb, faster each return; its seal phase makes parry temporarily the only gun…)".
   The §5b row admits "full rally + seal deferred (own PR)." The one mechanic that would make the
   duel a duel is the one that didn't ship.

**Rework C.6 — the deepest rework in this plan.**

### A.10 — KNELLGRAVE (slot 10, World-Ender opener) — DULL

**Kit** (`id: 'knellgrave'`): P1 `['iris','aimed']` → P2 `['iris','crossfire','aimed']` → P3
`['iris','fan','aimed']` → P4 `['iris','fan','aimed']` (survival), cadence 1.4–1.7 → 1.1–1.4,
`rhythm.signature: 'music-locked'`, `muzzle: 'bellMouth'`, `musicDies`, setpiece `lastToll` (P4,
26s, dread+survival). Cards `knellgrave_first` / `knellgrave_second` (rhythm-parry) /
`knellgrave_sweep` / `knellgrave_last` (dread, survival).

**What's real:** the toll infrastructure is the best audio-fairness work in the roster — every
volley release strikes `bellToll(w)` with weight growing as hp falls ("the final tolls are FELT"),
`model.tollNow` fires the reverberation + "expanding ring-wall… the FAIRNESS TWIN," the
`lastToll` setpiece rides the bell overhead (rel ≈ 3, "the mouth above your head, the bound
prisoner straining") through nine accelerating tolls, and MUSIC-LOCKED quantization
(`rhythm.ticket` + `getBeatClock`) exists. The Second Toll rhythm-parry card is allocated and its
amber carrier (`aimed` in every phase) is in the def.

**The case for DULL:**
1. **The bullets contradict the sound.** A toll RADIATES — energy expanding outward from the
   source. `tollNow`'s expanding ring-wall is a *bulletless model visual*; the actual pattern
   attached to every toll is `iris` — "contracting rings: each ring shrinks toward the centre."
   The fight's one physical idea (sound made visible) is geometrically **inverted** in the only
   layer that can kill you. Meanwhile the id that IS an expanding radial — `spiral`, "Instant
   radial burst: bullets fly OUTWARD from the boss" — sits unused in the def.
2. **"Pendulum Sweep" contains no pendulum.** Card `knellgrave_sweep`, def comment "the
   perpendicular cross" — its phase set is `['iris','fan','aimed']`, i.e. P2 with `crossfire`
   swapped for `fan`. Nothing in `fan`'s geometry (a ±8 spread aimed at the player) sweeps,
   swings, or crosses the lane laterally. The slot brief promised "pendulum swings cross the
   lane"; the def never staged the swing. A World-Ender card is named after an attack that does
   not exist.
3. **Sentinel vocabulary at a World-Ender slot.** The whole kit is `aimed/fan/iris/crossfire` —
   every id debuted in slots 1–5. §5c WE contract: "Attacks originate OFF-lane (threads from
   above, pendulum sweeps across…)" — *nothing* here originates off-lane except the survival
   setpiece's pose. The band's category-of-experience promise ("the lane breaks") is carried
   entirely by the entrance and the dead music.
4. **Four cards** vs the §5g WE floor of "5–6 cards" — at the band opener, defensible on the
   sawtooth; combined with 1–3, it reads as thin rather than gentle.
5. The dread itself (*"IT RINGS — The Last Toll"*) is legitimately good — survival exam, honest
   seal, the overhead ride, decaying-rest acceleration. It is the only part of the fight whose
   delivery matches its name. AUDIT §4: "entrance-heavy, fight-light" — confirmed at the
   pattern layer. **Rework C.7.**

### A.11 — WEFTWITCH (slot 11, World-Ender) — NEEDS-WORK

**Kit** (`id: 'weftwitch'`): five phases permuting `aimed/curtain/movingGap/crossfire/iris/stream`
(P1 `['aimed','curtain']` … P5 `['curtain','movingGap','crossfire','aimed']`),
`rhythm.signature: 'syncopated-loom'`, `muzzle: 'loomHeart'`, `threadCut` (shipped: the `aimed`
release rides the laserLance beam visual + `stitchPluck`, and the THREAD-CUT stagger window stills
the loom — "any wind-up cancels, nothing new is drawn").

**Dread** — *"SHE MENDS — Warp and Weft"* (`weftwitch_warpweft`), §5f: "the whole arena re-woven
in one pass: every lane stitches shut except the one her hands never touched," def comment: "its
counter is reading which lane the hands AVOID."

**Charges.**
1. **The stated counter-read is not wired.** The dread's wall is `curtain`, whose gap is computed
   from the *player*: "Gap sits toward your opposite side… `-Math.sign(player.position.x || 1) *
   5.5`." `movingGap` seeds from `player.position.x` too. Her hands can mime anything; the safe
   lane is placed by where YOU are standing, same as Stormrend's P2. The §5f answer ("read the
   hands") is currently a *lie the doc tells the player* — the §5i "reading-load" identity this
   slot owns has no object to read.
2. **Five phases of wall-id permutation.** P2 `curtain/aimed/movingGap` → P5
   `curtain/movingGap/crossfire/aimed`: across 5 cards the kit gains exactly `crossfire`, `iris`,
   `stream` in the middle and returns to its P2 set for the dread. §5f law 3's
   introduce→develop→twist→desperation reads here as introduce→shuffle→shuffle→shuffle→repeat-P2.
3. **Dread-set subset collision with Embertide**: P5 `{curtain, movingGap, crossfire, aimed}` ⊇
   Embertide P5 `{curtain, movingGap, crossfire}` — two WE bosses' final phases differ by one
   `aimed`. (Also charged in Part B.)
4. CANCEL-CONVERT MOTE HARVEST (its §5i.B graze form) unshipped — thread-cuts don't bloom.

**What's right and kept:** THREAD-CUT → STAGGER (shipped, allocated, distinct), the beam-visual
`aimed` (the loom is musical), HUD-sew rule-break, SYNCOPATED LOOM off-beat quantization.
**Rework C.8 — a telegraph-wiring rework, zero new ids.**

### A.12 — ONEWING (slot 12, World-Ender) — SOLID

**Kit** (`id: 'onewing'`): five phases over `crossfire/aimed/movingGap/secondWave/fan`,
`rhythm.signature: 'rubato-feint'` ("delays are FIXED per attack, animation-held, never
randomized"), `muzzle: 'livingWing'`, `ghostHalf`.

**Dread** — *"WOULD NOT DIE — The Missing Wing"* (`onewing_missingwing`): the old dual attack
performed alone, the dead half arriving as ghost-bullets. Delivery is real and layered:
`emitGhostHalf` fires "amber-ringed GHOST bullets, aimed by the dodge-MIRROR (poseRing)" — the
mirror extrapolates "~0.4s of recent dodge" forward, so reactive dodging feeds the ghost aim (the
anti-flee apex, §5b brief "it mirrors your last dodge"); perfect-parrying the ghost half 4×
(`GHOST_FRAME_HITS`) breaks the frame, which removes the ghost volley but enrages the living
half's tempo ~30% (`enrage = 0.7` on the attack timer) — a real, player-authored trade. The lying
FELLED card is armed per-encounter (`felledLieUsed`). Counter-verb: parry, non-default,
teach-lineage from slot 5 ✓ (Vergil grammar per §5f Duo law).

**One note, not a rework:** P3 `['secondWave','fan','aimed']` and P4 `['crossfire','fan','aimed']`
are near-identical *as geometry* — the phases are actually distinguished by the RUBATO feint
schedule (P4 "The Denied Downbeat" is the feint card), which is rhythm-side and legitimate. Accept,
but Part D deliberately quotes P5, not P3/P4.

### A.13 — EMBERTIDE (slot 13, World-Ender peak) — NEEDS-WORK

**Kit** (`id: 'embertide'`): five phases; `crestfall` debuts P3 ("the crest crosses the whole
frame"); P4 `['curtain','iris','crestfall','crossfire']`; P5 (dread/survival)
`['curtain','movingGap','crossfire']`. `rhythm.signature: 'crescendo-sets'` (the designed
Stormrend echo), `muzzle: 'crestPivot'`, `skyReplace`, `beamDuel` (shipped: Surge≥50% crest-lock
duel with the hold-the-line graze payout), hpMax 552 = the WE sawtooth peak.

**Dread** — *"SKY SET LOOSE — Horizon Break"* (`embertide_horizonbreak`, survival): "the tide
crests the whole frame; the safe pocket is where the face is — hide in its shadow."

**The charge — one def line kills the dread:**
- The card wiring is real: while `activeCard.id === 'embertide_horizonbreak'`, the face "LOOKS
  AROUND on a slow autonomous sweep (it stops tracking you)" and `horizonPocketX = sweep * 8` —
  the moving shadow pocket exists.
- The ONLY consumer of `horizonPocketX` is `crestfall`: "During HORIZON-BREAK it instead LOCKS to
  the live face-shadow pocket… so you ride the shadow, not a rhythm."
- **P5's attack list is `['curtain','movingGap','crossfire']` — `crestfall` is not in it.** So
  during the roster's second survival card, the shadow sweeps, the face performs, and the walls
  that actually fire (`curtain`, `movingGap`) place their gaps by `player.position.x` exactly as
  they do for Stormrend. The player who obeys the card's fiction — ride the shadow — flies into
  curtain segments; the player who ignores the face entirely survives fine. The dread's
  counterintuitive answer is not merely missing, it is *punished*.

Also: P5 is the Weftwitch-subset collision (A.11.3), and the P5 comment's own justification
("`crossfire` kept for the amberdiet floor, §5i.C survival exemption") shows the set was chosen
for CI, not for the card. Everything else — crestfall itself, the sky-replace, the beam duel
(correctly reclassified as the Surge mechanic per AUDIT G-1†, with the parryable crest-lock
volley as the amber floor) — is the true band peak. **Rework C.9 is a three-line def fix.**

---

## PART B — THE ESCALATION CURVE

Method: fun/spectacle scored from AUDIT §4's awe table adjusted by Part A's *combat* findings
(AUDIT scored the speced fight; this scores the shipped pattern layer); challenge scored from
cadence dials × pattern load × verb demands. 0–5 each.

| # | Boss | Fun (patterns) | Challenge | Attention type (§5i seq. law) | Curve note |
|---|------|------|------|------|------|
| 1 | VOIDMAW | 2 | 1 | reading (teach) | correct floor |
| 2 | STORMREND | 2 | 2 | reading (walls) | **adjacent same-type as 1** — both reading-load; acceptable at the teach rung only if 2's dread gets a distinct verb (C.1 fixes) |
| 3 | ASHTALON | 4 | 3 | execution (pursuit) | the band opener out-fun's the band peak — see 5 |
| 4 | MARROWCOIL | 4 | 3 | reading (thread geometry) | rib flyby carries it |
| 5 | EITHERWING | 3 | 3.5 | execution (converge) | **the Colossi PEAK under-peaks**: its dread is default-crossfire (A.5), so 5 plays *flatter than 3* — the first sawtooth tooth is blunted |
| 6 | HOLLOWGATE | 4 | 3 | reading (panes/walls) | correct gentle opener, spectacle-forward ✓ |
| 7 | THRUMSWARM | 5 | **4.5** | execution (ostinato) | **the challenge curve peaks HERE, two slots early** — P4 cadence `[1.05,1.4]` undercuts the 1.2 band floor and out-paces slots 9–11 and 13 |
| 8 | BRINEHOLM | 3 | 2.5 | reading/relief (drone) | breather by design ✓ — but its dread repeats 6's dread set, so the band's back half rhymes with its front half |
| 9 | KARNVOW | **2** | **3** | execution (precision) | **the inversion**: the Calamities difficulty peak is slower than slot 7 and thinner (3 cards) than the band breather. Fun trough + challenge trough at the designated PEAK — the sawtooth's second tooth is missing entirely |
| 10 | KNELLGRAVE | 2.5 | 3 | reading (rhythm grid) | opener-gentler ✓, but gentler than the previous *trough*, not the previous peak — the WE band opens from a hole |
| 11 | WEFTWITCH | 3.5 | 3.5 | reading (lattice grid) | **adjacent same-type as 10** — two consecutive quantized-grid reading fights (toll grid → loom grid). §5i sequencing law violation; C.7/C.8 must split them (10 becomes spatial-rhythm/dodge-execution on the swing, 11 stays pure reading) |
| 12 | ONEWING | 4.5 | 4.5 | execution (feints) | correct riser |
| 13 | EMBERTIDE | 4.5 (5 with C.9) | 5 | execution (fill apex) | the peak is real — minus its broken dread pocket |
| 14 | UNMASKED | 5 | 5 | medley | summit, respected (Part D) |

**Findings (the ones the reworks must answer):**

- **B-1 — the sawtooth's designated peaks are its actual weak points.** Peaks are contracted at
  5, 9, 13 (§5b principle 6). As shipped: 5's dread is the vocabulary's default (A.5), 9 is a
  double trough (A.9), and 13's dread mechanic is unreachable (A.13). Only 13 is near-fixed by
  data. C.4, C.6, C.9 exist precisely to restore the three teeth.
- **B-2 — identical openers, three fights out of five.** `['aimed','fan']` is P1 for Marrowcoil,
  Hollowgate, AND Thrumswarm (and near-P1 for Voidmaw). Three first-impressions in the
  mid-roster play identically for the opening ~20 seconds regardless of silhouette. C.3 re-opens
  Marrowcoil (aimed+iris-off-the-coil); Hollowgate keeps aimed/fan (the verse IS its identity —
  "door-prayer verses (low aimed murmur)"); Thrumswarm's is excused by formation-delivery
  (`SWARM_ATTACK_FORM` makes its `fan` a swarm-shape, visibly different) — with 4 changed, no two
  adjacent openers repeat.
- **B-3 — the cadence ladder inverts at 7** (AUDIT §3.E.2 doc-side; code confirms): Thrumswarm P4
  `[1.05, 1.4]` ≤ Weftwitch P5 `[1.05, 1.4]` = the WE band's tightest, and < Karnvow P3
  `[1.2, 1.5]`. Recommendation (data-only, no pattern change): lift Thrumswarm P3/P4 to the 1.2
  Calamities floor (`[1.2, 1.55]` / `[1.2, 1.5]`) and let its PRESSURE OSTINATO signature carry
  the density feel (it has no true rests — it does not need illegal dials to feel relentless);
  C.6 tightens Karnvow to the true band ceiling.
- **B-4 — dread-set collisions cluster where the bands should be proving variety**: 6≡8
  (identical multiset), 11⊇13 (subset), and 2/13 share the crescendo-wall feel legitimately (the
  designed leash echo, §5b lore web) — the first two are accidents, fixed in C.5 (geyser-led
  Sounding) and C.9 (crestfall-led Horizon Break); after those, no two dread phases in the
  roster share more than two ids.
- **B-5 — attention-type adjacency violations**: 1→2 (reading→reading, tolerated at the teach
  rungs), 10→11 (reading-grid→reading-grid, NOT tolerated at Tier 4 — C.7 moves Knellgrave's
  middle phases to swing-dodge execution, restoring the alternation:
  10 execution-rhythm → 11 reading → 12 execution → 13 execution-fill — with 12/13 differing by
  feint-read vs fill-read, which §5i's own table sanctions as different loads).

---

## PART C — THE REWORKS

Format per boss: the 3–5 move core as a build table (move | pose/organ | pattern shape | best
verb | amber | rhythm role), then the dread card spec, then the uniqueness diff. Every move
composes existing ids unless flagged. All reworks keep the §5f dread NAMES, the def's `rhythm`
signature, hp/TTK band placement, and lance-plan compatibility (each table names its lock
interplay per `docs/lance-boss-progression-plan.md`).

### C.1 — STORMREND (slot 2) — give the Heart a heart

Zero new ids. Data + one telegraph rig. Keep 3 cards (Sentinel band).

| Move | Pose / organ | Pattern shape | Best verb | Amber | Rhythm role |
|---|---|---|---|---|---|
| Gale Wall | rings flare wide, eye steady | `fan` (existing) | dodge | fan is amber in code ✓ | crescendo ramp steps |
| Shifting Squall | rings tilt + sidle laterally | `movingGap` | dodge (track the slide) | — | ramp density mid |
| Returning Gust | rings CONTRA-rotate (the visible tell) | `secondWave` (add to P2) | **graze** — the offset second spread brushes the spot you just left; hold your lane and skim it | — | the ramp's off-beat kick |
| Storm's Iris (teach) | outer rings detach and orbit wide | `iris`, slow form, **moved to P2** | dodge-to-center | — | pre-chorus |
| DREAD: Heart of the Storm | ALL rings align coplanar and spin up — the 2.5s held ritual; the eye brightens to white | `iris` ×3 chained back-to-back + `aimed` fired straight down the center line from `focalEye` | **parry-in-the-pocket** | the center-line `aimed` triplets (amber) | the CRESCENDO hard-cut: full silence, then the chain |

**Dread spec — "EYE OF THE GALE — Heart of the Storm" (name kept).** Ritual: the rings align into
one full-frame concentric cage (AUDIT §4's own suggested lift, now the shipped shape). Three iris
rings chain with no rest between; the safe center is a narrow corridor on the boss's eye axis —
but the eye FIRES amber `aimed` triplets straight down that corridor on the beat. The
counterintuitive answer: the storm's only calm is *inside* it, and you must **parry the
lightning while standing in the eye** — flee outward (default) and the contracting rings collect
you. Graze goldmine: every contracting ring skims the corridor-holder three times per chain
(annulus law ✓), plus the parry chain. Teach-before-test ✓: iris now debuts in P2 slow form;
amber-aimed parry taught by Voidmaw P1. Phase grammar ✓: P3's twist is the chain+corridor (one
systemic change), not "+1 id faster."

**Uniqueness diff:** silhouette = rings aligning coplanar (no other boss has a ring-alignment
tell); the parry job (corridor parry under contraction) collides with nobody — Voidmaw parries in
open lane, Knellgrave parries on a time grid, this parries in a *place*. Rhythm: CRESCENDO's hard
cut stays its fingerprint. Lance: V1-only per the lance ladder ("wall pressure teaches
reacquire") — the corridor is also the natural V1 hold-line, so the dread doubles as lock
practice. Amberdiet ✓ (every phase carries fan or aimed).

### C.2 — ASHTALON (slot 3) — pay the stoop's promised answer

Zero new ids. One id swap + the already-allocated SLIPSTREAM graze form (charged to the §5i.B
graze ladder where it has sat designed-but-unbuilt, NOT to the attack-id budget).

| Move | Pose / organ | Pattern shape | Best verb | Amber | Rhythm role |
|---|---|---|---|---|---|
| Tracking Hose | visor slit drags across you | `stream` (kept) | dodge (peel-away arc) | every-4th-tick amber ✓ shipped | the sforzando after silence |
| Circling Fan | mantle-fold on the orbit | `fan` during `circlingPass` (kept) | dodge | fan amber ✓ | fired FROM the moving orbit — ambush accents |
| Converging Cut | wings scissor at the orbit's near pass | `crossfire` timed to `circlingPass` k≈0.5 (kept) | parry | crossfire amber ✓ | the near-pass punctuation |
| Second Gust | recovery climb after the stoop | `secondWave` (kept, P3) | graze | — | the exhale after the dive |
| DREAD: Stooping Strike | climb + 2–3s HOLD, then the squared dive (shipped setpiece) | `stream` raining from the diver + **SLIPSTREAM**: a drawn moving safe pocket trailing the dive line, collision walls at its edges | **surge INTO the dive gap** (the §5f-named answer, finally real) | the dive-stream's amber ticks | AMBUSH-REST: the hold IS the rest |

**Changes from shipped:** P3 `spiralStream` → **removed** (the off-brand turret fill, A.3.2);
replaced by `fan` so P3 = `['stream','fan','secondWave']` — sparse, fast, pursuit-shaped,
consistent with "closing + cadence — fast but sparse." The dread rework is one graze-form ship +
one rule: while the stoop's SLIPSTREAM pocket is ridden ≥0.8s, a Surge release inside it grants
the exposure window (the "surge INTO the dive gap" answer) — counter-verb = surge, non-default ✓,
and the pocket's edge-walls make it the graze goldmine (per-frame ramping ticks, the §5i.B
continuous-form detector that AUDIT notes shipped with slot 6's beam-edge — reuse it).

**Uniqueness diff:** the only boss whose dread answer is *chase it downward*. No silhouette/rhythm
change. Lance: adopts the lance plan's Rung-2 recommendation surface (two phase-gated wing
brands) without pattern impact — the circling rest-beats are the paint windows the plan asks for.

### C.3 — MARROWCOIL (slot 4) — make the body the emitter it claims to be

Zero new ids. One emitter reroute (pane-radial precedent) + the allocated ORGAN BREAK +
THREAD-THE-GAP scoring (both already designed and budgeted; AUDIT §3.B.1/2 says ship them).

| Move | Pose / organ | Pattern shape | Best verb | Amber | Rhythm role |
|---|---|---|---|---|---|
| Skull Hose | jaw hinges open (`muzzle: 'skullGroup'` ✓) | `aimed` / `stream` (kept) | parry | shipped ✓ | SUSTAIN texture |
| Coil Rings | a coil circle flexes + whitens one beat before | `iris` **rerouted: rings spawn centred on the flexing coil circle's live world pos** (the `firePaneRadial` precedent — a reroute of an existing id, not a new id) | dodge/thread | — | SUSTAIN |
| Rib Slam | one rib pair glows, slams inward | `movingGap` whose gap = the surviving rib aperture, prefixed by the rib's amber strain volley (`aimed` ×3 from that rib) | **parry ×N → ORGAN BREAK: the rib CRACKS, its movingGap rows are deleted for the rest of the fight** (the allocated Colossi parry debut, §5b slot table, verbatim) | the rib strain volley | BURST |
| Tail Sweep | tail telegraphs the lateral | `secondWave` (add P2) | graze | — | BURST kick |
| DREAD: The Closing Ribs | shipped `closingRibs` setpiece — pairs constrict one at a time | each closing pair fires its Rib Slam as it closes; the aperture's thread is scored by **THREAD-THE-GAP** (clearance+lateness, chains) | parry (break ribs mid-dread) or thread (score) | rib volleys + stream tip | BURST-dominant, "walls dominate" (shipped rhythm comment kept) |

**Changes from shipped:** P1 becomes `['aimed','iris']` (kills the B-2 triple-opener; the coil
rings ARE the boss's first impression — "read the bone rings" was P1's own comment, now true);
`fan` moves to P2. ORGAN BREAK makes the dread §5f-law-2 compliant: the counterintuitive answer to
a constricting cage is to *stand in front of the slamming rib and parry its strain volley* — you
break the cage by refusing to flee it. This also repairs Hollowgate's teach ladder (PANE BREAK
becomes the reuse it was documented as). THREAD-THE-GAP pays the "graze goldmine" clause.

**Uniqueness diff:** the only boss whose walls can be permanently edited by parry (Hollowgate's
panes are edited by gunfire+parry; ribs are parry-only — the diff is the input). Rhythm untouched.
Lance ✓: the lance plan's Rung-3 "sweep exam" maps 1:1 — ribs are already the lock parts; broken
ribs leave `paintableParts()` by the shipped pane/shackle liveness convention.

### C.4 — EITHERWING (slot 5) — make the twins the emitters

Zero new ids. One emitter change + the allocated ORBIT ANNULUS graze form + ORGAN BREAK reuse.

| Move | Pose / organ | Pattern shape | Best verb | Amber | Rhythm role |
|---|---|---|---|---|---|
| The Holder's Volley | the eye-bearing twin flares | `aimed`/`stream` **emitted from the holder's live position** (via `partWorldPos` — the L148 muzzle seam, per-twin) | parry | the eye's volley (amber = anatomy ✓ §5i.C law 3) | the CALL |
| The Dark Half's Wall | the eyeless twin mantles | `movingGap` / `secondWave` from ITS side | dodge | — | the RESPONSE |
| Baton Cross | the handoff arc lights between them | `crossfire` **rerouted: the two emit points are the twins' live positions** (not `[-10, 10]`) — during `figureEight` the converge angle changes every pass | dodge (read the angle) | crossfire amber ✓ | the phrase boundary — the baton IS the bar line |
| DREAD: Both Halves at Once | the eye SPLITS — both twins blaze mid-lemniscate | simultaneous holder-volley from BOTH moving twins + `iris` centred on the thread midpoint between them | **graze-orbit**: ORBIT ANNULUS — co-rotate with the figure-eight inside the drawn band; a full unbroken lap = +1 level + i-frame pulse (allocated §5i.B, verbatim) — the answer to "everything converges" is to *fly the same eight they do* | both twins' volleys | CALL-AND-RESPONSE **overlapping** — the only card where A and B phrases stack (the shipped rhythm comment finally made geometric) |

**Parry job (allocated, now shipped):** "parry the holder's amber volley 3× mid-possession → the
handoff STAGGERS, the eye DROPS to the thread midpoint for a 2.5s bonus-damage window" (§5b slot
table, verbatim — ORGAN BREAK reuse). This also arms the §5f Duo-law kill-order read.

**Why this is now a real dread:** with twin-origin crossfire, "simultaneous mirrored" finally
means something — every other boss's crossfire converges from static ±10; Eitherwing's converges
from two bodies crossing a lemniscate, so the safe wedge rotates continuously. The
counterintuitive answer is motion-matching (orbit), not evasion, and the annulus is drawn
in-world (§5i.B law). Silhouette/hook/palette untouched; rhythm untouched.

**Cost honesty:** per-twin emit origins are emitter plumbing on existing ids (the same
`resolveEmitOrigin` seam `def.muzzle` uses), not a new attack id — but it IS engine work; charge
it to the §5f engine ledger next to the pane-radial entry, and it is the one rework here that
can't ship as def-data alone.

### C.5 — BRINEHOLM (slot 8) — spend the Calamities id: `geyser`

**THE ONE NEW ATTACK ID IN THIS PLAN — `geyser`, charged to the Calamities band budget (§5b
"≤1 new attack id per band"; the band's slot has been unspent — slots 6/7/9 composed or rerouted).
Gate cost (per §5b): whitelist + emission-budget + safe-lane gates, paid exactly once.**

**`geyser` spec (crestfall's mirror, buildable from its code shape):** timed full-width rows
spawn at `CONFIG.laneMinY - 3` (below frame) with `vy > 0` — columns ERUPT upward into the lane
and close (`vrel` as usual); the safe gap slides between rows like `movingGap`'s. Telegraph:
one beat before each row, spray plumes flash at the foot of each doomed column (the drawn-in-world
fairness law); the gap column shows no plume. Same row/step/quality dials as `crestfall`
(`rows = quality < 0.75 ? 4 : 5`), so the emission budget is already proven at 13. No stacked
additive shells — plumes reuse the existing burst particle path. 60fps: identical bullet count to
`crestfall`, which ships on the heavier `skyReplace` boss.

| Move | Pose / organ | Pattern shape | Best verb | Amber | Rhythm role |
|---|---|---|---|---|---|
| Tidal Hose | the maw exhales (`muzzle: 'brineMaw'` ✓) | `stream` (kept) | parry | ✓ shipped | the drone's long swell |
| Rising Rings | the gullet glows up through the water | `tunnel` (kept, P2) | thread | — | swell crest |
| Shackle Strain | a post's chain snaps taut | `aimed` ×3 strain volley from the post (SHACKLE BREAK ✓ shipped mercy — untouched) | parry ×3 → post SNAPS + 2× SPRAY-SOAK beat | the strain volley ✓ | the drone's only staccato |
| First Spouts | fin-sails shiver along the ridge | `geyser` (NEW — debuts P3 in a slow 3-row form: teach-before-test) | dodge (read the plumes) | — | swell break |
| DREAD: Sounding | shipped `sounding` setpiece — it dives, holds submerged, sweeps | **geyser-led**: P4 = `['geyser','iris','stream']` — the floor finally erupts; during the submerged hold, geyser rows track the sweeping body below (the plume line IS the boss's position — emitter=organ from *underneath*) | **SHADOW-RIDE**: the surfacing brow's lee is the drawn no-spawn pocket — ride the body you can't see by the wake you can (the §5i.B anatomy form, finally anatomically possible) | stream ticks + strain volleys pre-dive | TIDAL DRONE: the dive is the roster's longest authored rest — then everything |

**Changes from shipped:** P3 `['stream','iris','fan']` → `['stream','geyser','fan']` (slow teach
form); P4 `['curtain','iris','spiralStream','stream']` → `['geyser','iris','stream']`. This kills
the 6≡8 dread multiset collision (B-4) — `curtain` and `spiralStream` leave the def entirely; no
other boss fires `geyser`. The dread's counter-verb (ride the lee — positioning BY the boss's
submerged body, against the instinct to flee the eruption line) is non-default and the SPRAY-SOAK
/ lee-pocket pair is the graze goldmine. Card count stays 4 ✓ band floor.

**Uniqueness diff:** the roster's only bottom-up pattern (13 owns top-down via `crestfall` — the
pair are deliberate mirrors across the 8/13 value-inversion axis already flagged in §5b). Rhythm
untouched (slowest pulse, the relief texture). Lance ✓: split ecology per the lance plan Rung 7 —
eye sealed while down, shackles brandable throughout (shipped behavior, kept).

### C.6 — KARNVOW (slot 9) — the duel must duel back

Zero new attack ids. The rework = ship the **allocated** TENNIS RALLY + REFLECT-ONLY SEAL
(§5i.C Calamities debut — already budgeted in the parry ladder and flagged uncosted by AUDIT
§3.B.6; this plan is its design spec) + restructure 3 phases/cards → 4 + make the quote a test.

| Move | Pose / organ | Pattern shape | Best verb | Amber | Rhythm role |
|---|---|---|---|---|---|
| Opening Gambit | lance salute → point (`muzzle: 'lanceTip'` ✓) | `aimed` triplets (kept) | parry | ✓ | your parries steal its tempo (shipped AGGRESSION EXCHANGE, kept) |
| Cross Guard | lance high, trophy chain swings wide | `crossfire` **rerouted asymmetric: one origin = lanceTip, one = the trailing chain's live pos** (same per-organ seam as C.4) — the converge is never mirror-symmetric again | dodge (read the lance side) | ✓ | the exchange's answer phrase |
| Pressing Stream | the cut-in (`flankCutIn` kept) | `stream` while it draws level | dodge | tick amber ✓ | the press |
| THE RALLY | it BATS your reflected cyan back as one big returnable orb, faster each return (§5i.C verbatim; the shipped `reflectRiposte` v1 — "the parried shot comes BACK a beat after the swat" — is the proven seed: v2 loops it, +15% speed per return, cap 4 returns) | the orb (a re-emitted reflected bullet — existing bullet plumbing, not an attack id) | **parry, repeatedly, on an accelerating beat** | the orb is the amber | each completed rally = a trophy charm flares in its owner's palette + a long exposure window (the AUDIT §4 lift, made mechanical) |
| DREAD: Voidmaw's Verdict | shipped `voidmawVerdict` loom + the authored seal | boss-1's `aimed/fan/tunnel` quote KEPT — but **violet-AMBER**: each tunnel ring carries one amber gem (the horn fragment) at a random clock position; parrying the gem SHATTERS that ring (the C.3 rib grammar, taught at 4 and 6) | **parry-through**: fly AT the ring's gem — the counterintuitive inversion of the slot-1 lesson (boss 1 taught "hold the center"; the worn horn corrupts the verdict: now the center is death and the gem is the door) | the ring gems + aimed | the quote fires at true band-ceiling cadence `[1.05, 1.35]` (fixes B-3's "tightest Tier 3" lie) |

**Phase/card restructure (3 → 4, meeting the §5g Calamities 4–5 floor):**
`karnvow_gambit` (1.00) → **NEW CARD `karnvow_rally` "IT KEPT COUNT — The Rally"** (0.70; the
tennis debut, with the REFLECT-ONLY SEAL: for the card's first ~6s the duelist is gun-sealed and
only rally returns damage it — the allocated ≤2-seal budget's slot-9 half, §5i.C verbatim; the
seal resolves on the first completed rally, so it can never hard-wall: timeout hatch per card
schema) → `karnvow_riposte` (0.45) → `karnvow_verdict` (0.25, dread).

**Why this un-DULLs the peak:** the fight gains the band's missing mechanic (rally), a fourth
card, a cadence that actually peaks, and a dread whose answer inverts the tutorial instead of
replaying it — §5f law 2 satisfied with a parry read (feeding the law-7 ≥4-dreads-parry quota,
which AUDIT G-2 says is under-allocated: with C.3, C.6, and 12's shipped ghost-parry, the quota
is met at 4/5/9/12 + 6's pane-break). Turn-taking sharpens: every rally ends in the roster's most
legible exposure state (the charm flare). Lance ✓: adopts the lance plan's Rung-8 long-term
suggestion verbatim — P1 muted duel (shipped `lockMuted` + "THE MARKS WILL NOT TAKE" note), one
trophy becomes paintable per completed rally, full set in the dread.

### C.7 — KNELLGRAVE (slot 10) — the toll must radiate

Zero new attack ids. Two reroutes (both on the pane-radial precedent), one new setpiece path
(setpieces are free — `SETPIECE_PATHS` precedent: every boss has authored ones), phases 4 → 5.

| Move | Pose / organ | Pattern shape | Best verb | Amber | Rhythm role |
|---|---|---|---|---|---|
| The Toll | the bell strikes (`muzzle: 'bellMouth'` ✓, `bellToll`/`tollNow` kept) | **`spiral` rerouted to emit from `bellMouth`'s live world pos** — an EXPANDING radial burst off the bell on every quantized toll: the bullets finally agree with the sound (and with `tollNow`'s ring-wall visual, which becomes the pattern's own telegraph twin) | dodge (be off the ring line when it strikes) | — | MUSIC-LOCKED: one burst per toll, `ticket`-quantized ✓ |
| The Chain | the clapper-figure strains, candle gutters | `aimed` ambers ON consecutive tolls (burst measures on the beat grid) | **RHYTHM PARRY** — the allocated WE debut, kept verbatim: parry the 4–6 chain on the toll's beat | ✓ the chain | The Second Toll card's spine |
| PENDULUM SWEEP | **new setpiece `pendulumSweep`**: the whole bell SWINGS across the lane in 2–3 widening arcs (x sweeps ±14, rel dips to ~12 at each bob nadir — the lastToll path grammar, sideways) | `stream` pouring from `bellMouth` **while the muzzle itself swings** — the tracking hose's origin arcing overhead IS the pendulum cross; plus `movingGap` rows whose gap is phase-LOCKED opposite the bob (read the bell, not the wall) | dodge (execution — be where the bell isn't; fixes B-5's 10↔11 reading-adjacency) | stream ticks ✓ | the mid-fight arrhythmia the toll grid makes legible |
| The Cracked Peal (NEW card, phases 4→5) | the crack gapes; a double-strike | two `spiral` tolls a half-beat apart (a hemiola inside MUSIC-LOCKED — still on the grid, subdivided) | graze — **SHRINKING SAFE DISC** (allocated §5i.B WE form, verbatim): toll-ring pockets with escalating ticks, bail on the last beat | aimed ✓ | the acceleration's first warning |
| DREAD: The Last Toll | shipped `lastToll` overhead ride + full clapper reveal — UNTOUCHED | nine accelerating `spiral` tolls from overhead (the expanding rings now rain outward from rel ≈ 3 above you — the same survival exam, finally in the toll's true geometry) | pure dodge (survival ✓, amberdiet exemption ✓ — `aimed` stays in the phase list per the shipped comment) | phase-list aimed (CI) | the decaying-rest acceleration, kept |

**Card ladder becomes:** `knellgrave_first` (1.00) → `knellgrave_second` (0.72, rhythm parry) →
**`knellgrave_peal`** (0.55, NEW) → `knellgrave_sweep` (0.40, now with an actual pendulum) →
`knellgrave_last` (0.25, dread/survival). Five cards ✓ §5g WE floor.

**Why this un-DULLs the slot:** the fight's one idea (sound made visible) finally has bullets
that obey it; the WE contract's "pendulum sweeps across / attacks originate OFF-lane" is met by
the swinging emitter (off-lane by construction); `iris` leaves the def entirely (it was the
inversion) — kit becomes `spiral/aimed/stream/movingGap/fan`, of which the spiral-from-organ and
swung-stream feel like nothing else in the roster. Silhouette/palette/rhythm untouched; the
clapper reveal and the music-death rule-break untouched. Lance ✓: per the lance plan Rung 9,
stays no-lock (the toll owns the fight) — or, at most, the plan's own suggestion (clapper-only
during toll recoil) with no pattern impact.

### C.8 — WEFTWITCH (slot 11) — wire the hands to the walls

Zero new ids. One telegraph-wiring change + one graze form (allocated).

| Move | Pose / organ | Pattern shape | Best verb | Amber | Rhythm role |
|---|---|---|---|---|---|
| First Thread | a hand draws one taut line (`threadCut` beam ✓ kept) | `aimed` + laserLance visual (shipped) | **THREAD-CUT parry** (allocated ✓ shipped: stagger + volley delete) | the taut thread's pre-fire flash ✓ | the off-beat accent |
| Warp Rising | both hands stitch downward | `curtain` — **gap placement rewired during her cards: the gap = the one lane column her hands visibly SKIP one beat earlier** (the hands sew each doomed column with a lit thread; the unsewn lane is safe). Player-sign placement is dropped for this def | **read** (the boss, not the bullets) | — | on-grid verse |
| Cross-Stitch | hands cross the loom | `crossfire` from the two hands' live positions (the C.4 per-organ seam, reused — she has two hands as Eitherwing has two bodies; her diff: the origins are 4m apart on one body, a narrow-X converge no other boss has) | dodge | ✓ | the syncopated kick |
| Mote Harvest | a cut thread bursts | **CANCEL-CONVERT MOTE HARVEST** (allocated §5i.B WE form, verbatim): cut threads bloom into falling surge-pink motes; steer the bloom | graze | — | the reward beat after every parry |
| DREAD: Warp and Weft | the full re-weave — hands blur across every lane | 5-row `curtain` chain, all gaps hand-telegraphed (per Warp Rising's wiring), the safe lane CONSTANT across all 5 rows but marked ONLY by the hands' one untouched column; `movingGap` interleaved with its gap on the same column | **read + hold**: find the unsewn lane once, then trust it while everything else closes (counterintuitive: the instinct under a 5-wall chain is to track each wall; the answer is to stop tracking walls entirely) — or THREAD-CUT parry the amber selvage thread to delete the next row outright | the selvage thread before each row ✓ | SYNCOPATED LOOM: rows land BETWEEN the beats you learned (kept) |

**Why this fixes the dread:** "the one her hands never touched" becomes literally true — the §5f
answer stops being a lie (A.11.1). The read-verb dread also cements 11 as the WE band's
reading-load slot (B-5 alternation). Distinct vs every other wall boss: Stormrend/Embertide gaps
are positional, Knellgrave's is bob-locked, hers is *performed* — the only boss you beat by
watching hands. P3/P4 sets pruned so no phase repeats another verbatim (P5 keeps
`curtain/movingGap/crossfire/aimed` but the wiring makes it play unlike 13's — and C.9 changes
13's set anyway, dissolving the subset collision from both sides). Lance ✓: lance plan Rung-9's
thread-knot suggestion is compatible (knots = paintable organs exposed during the stagger window);
V1 `loomHeart` kept.

### C.9 — EMBERTIDE (slot 13) — three def lines

The band peak needs no redesign — it needs its dread connected. Rework = data:

1. **P5 attacks: `['curtain','movingGap','crossfire']` → `['crestfall','crossfire']`.**
   `crestfall` is the only consumer of `horizonPocketX`; putting it in the Horizon Break phase
   makes the face-shadow pocket govern the actual bullets — "you ride the shadow, not a rhythm"
   (crestfall's own comment) becomes true during the one card built on it. `crossfire` stays as
   the amberdiet phase-lister (survival exemption, per the shipped def comment — unchanged).
2. **P5 crestfall density: rows 5, gap slot kept generous (the shipped `±3.4` pocket)** — the
   survival exam is chase-the-shadow, not thread-the-needle; the timer stays the escape hatch.
3. **P2 diff for the 11⊇13 collision (B-4):** P2 `['curtain','movingGap','crossfire']` →
   `['curtain','secondWave','crossfire']` — the sets-stack phase gains the returning-gust read
   (a wave that comes back is more tide than a sliding gap anyway), and no Weftwitch phase is a
   superset of any Embertide phase afterward.

Dread name, survival flag, beam duel, sky-replace, crescendo-sets rhythm, TTK: all untouched.
Counter-verb: ride-the-shadow is a positioning-by-boss-gaze verb — non-default, §5f ✓ — and
TIDE-EDGE + FACE-SHADOW POCKET (its allocated §5i.B form) finally has its pocket. Lance ✓: the
lance plan's Rung-9 inversion (beam/crest-lock, normal Lance off) is untouched.

### C.10 — the SOLID four (1, 6, 7, 12): explicitly no rework

Recorded so no future session "improves" them: Voidmaw's teaching metronome, Hollowgate's
pane-sculpting, Thrumswarm's formation-mirror (dials only, B-3), Onewing's grief-rubato are the
roster's proof that the §5f laws work when delivery matches the def. Any change requires new
owner direction, not this plan.

---

## PART D — BOSS 14: THE MEDLEY (quote map + the finale's own beats)

Frame respected as spec'd (§5b/§5f, GIVEN): 3 forms, each a full bar (eclipse → seraph → the
unveiling), zero new attack ids, quotes by **stable card id**, stage-2 all-eyes-snap +
reflect-only seal, destructible relics that delete quotes, stage-3 verb-shift surge-chase, final
dread *"WHAT WORE THE SKY — Every Verdict at Once."* All quotes below are the **post-Part-C**
versions — the exam tests the reworked curriculum, which is the point of fixing the curriculum
first.

### D.1 — Stage 1: THE ECLIPSE (quotes bosses 1–4)

The lidded disc fights with borrowed Sentinel/Colossi verdicts — gentle by Apex standards (the
sawtooth opener law), every quote at its ORIGINAL band cadence +0 (the nostalgia is the trap;
stage 2 breaks it). Emitter=organ: all stage-1 fire originates at `muzzle: 'focalEye'` — the eye
that watched every prior fight now performs them.

| Order | Quoted card (stable id) | What fires | Weave into the stage |
|---|---|---|---|
| 1st verse | `voidmaw_splitter` | the weaving `tunnel` | opens the stage — the mask-maker quotes its first mask; METRONOME envelope |
| 2nd | `stormrend_eye` (C.1 form) | the iris-chain + eye-corridor amber | the corridor now points at the SECOND SUN's eye — parry down the stare; CRESCENDO envelope + hard cut |
| 3rd | `ashtalon_strike` (C.2 form) | the disc itself performs the climb-hold-STOOP (the eclipse dives — the stage's one motion beat) with dive-stream + SLIPSTREAM pocket | AMBUSH-REST: the hold before the dive is stage 1's authored rest-look |
| 4th | `marrowcoil_closing` (C.3 form) | rib-slam `movingGap` + coil-`iris`, ORGAN-BREAK grammar live (the corona ring segments stand in as "ribs" — parry a segment's strain volley to crack it) | BURST-vs-SUSTAIN; closing the verse ladder ends stage 1's bar |

Rhythm: the stage's `medley` envelope walks the four quoted signatures in slot order — the
"rhythm exam" (§5i) made literal. Amber floor: stormrend corridor + marrowcoil strain volleys.

### D.2 — Stage 2: THE SERAPH (quotes bosses 5–8 + its own attack + the seal)

The crack, the unfurl, the wings. Quotes now come from the seraph's ANATOMY, not the eye — each
quoted boss is assigned the wing-organ that rhymes with it (emitter=organ at Apex scale):

| Order | Quoted card (stable id) | Organ that performs it | Weave |
|---|---|---|---|
| 1st | `eitherwing_both` (C.4 form) | the two LOWEST wings detach into a scissor pair and fly the lemniscate, twin-origin crossfire + midpoint iris | CALL-AND-RESPONSE overlap |
| 2nd | `hollowgate_judgment` | the wing-EYE clusters fire pane-radial (each open eye = a pane; shooting/parrying an eye's amber shuts that eye and deletes its radial arm — PANE BREAK grammar on the seraph's own eyes) | VERSE–CHORUS |
| 3rd | `thrumswarm_wings` | loose feathers shed into a mote-swarm that condenses into YOUR dragon and replays `wingsPath` (the shipped `poseRing` plumbing, re-armed) | PRESSURE OSTINATO |
| 4th | `brineholm_sounding` (C.5 form) | the halo ring dips below frame; `geyser` rows erupt tracking its submerged arc; ride the lee | TIDAL DRONE — the stage's breather quote, deliberately placed before the snap |
| — | **THE SNAP (own beat, GIVEN)** | every eye across all six wings snaps to the player at once — the reveal hold, the screenshot | full pattern silence: the roster's loudest rest-beat |
| 5th | **own unique: "EVERY EYE — Parallax Regard"** | `stream` with its origin CYCLING across the ~20 wing-eyes per tick (the pane-radial-class reroute — same id, migrating organ; each eye's own tracking lag, per the §5b sheet, braids the hose) — a multi-origin weave no single-muzzle boss can produce; every 4th tick amber ✓ | the stage's dense chorus |
| — | **THE REFLECT-ONLY SEAL (GIVEN, placed here per AUDIT G-5)** | immediately after the snap: the GREAT central eye LIDS SHUT — gun-sealed; only Parallax Regard's amber ticks, parried back into the lid, crack it open (3 returns). Teach lineage: Karnvow's rally (C.6) taught batting amber at a sealed duelist four slots earlier ✓ law 4. Resolves ≤ the card window; ≤2-seal budget closed (9 + 14) | parry-only bar — the stage's twist (one systemic change ✓ law 3) |

### D.3 — Stage 3: THE UNVEILING (quotes bosses 9–13 + its own attack + the verb-shift)

| Order | Quoted card (stable id) | How it arrives | Weave |
|---|---|---|---|
| 1st | `karnvow_verdict` (C.6 form) | the hall of mirrors: 14 quotes 9 quoting 1 — the violet-amber tunnel with parryable ring-gems; the twice-worn verdict is the lore web's leash-chain made playable | AGGRESSION EXCHANGE |
| 2nd | `knellgrave_last` (C.7 form) | THREE accelerating toll-`spiral`s from the halo (thinned from nine — fairness cap), the halo tolling like the bell it out-ranks | MUSIC-LOCKED — and the game's music dies for exactly these three tolls (quoting 10's rule-break inside 14's honest frame) |
| 3rd | `weftwitch_warpweft` (C.8 form) | the halo's RAYS are the hands: they visibly skip one lane, then the curtain chain lands — read the rays | SYNCOPATED LOOM |
| 4th | `onewing_missingwing` | ghost volley aimed by the dodge-mirror (`poseRing` extrapolation) from the ONE wing the seraph now holds folded — the grief quote | RUBATO/FEINT |
| 5th | `embertide_horizonbreak` (C.9 form) | ONE `crestfall` set whose pocket locks to the GREAT EYE's own cast shadow (`horizonPocketX` grammar, the gaze sweeping) — hide in the regard of the thing you're killing | CRESCENDO SETS |
| — | **THE VERB-SHIFT: the surge-chase (GIVEN)** | the shroud opens; dodging stops. "THE UNVEILING — Closer Than It Appears": wing-feather `curtain` rows strobe open in sequence toward the core — a collapsing corridor the player SURGES down to strike the core before it re-veils (Radiance law, §5f verb-shift climax; STAR PIPS multiply the strike). Composed entirely of `curtain` timing — no new id | the stage's own attack is a road, not a wall |
| last | **FINAL DREAD: "WHAT WORE THE SKY — Every Verdict at Once"** | below | below |

**The final dread — assembly spec.** One quote from EVERY felled boss at once, thinned to
fairness caps:

- **Component per boss (the cheapest signature atom of each reworked card):** 1 one tunnel ring ·
  2 one iris + corridor amber · 3 one stoop-line stream · 4 one rib-slam row · 5 one twin-origin
  crossfire pair · 6 one pane-radial arm · 7 one 2s path-replay ghost · 8 one geyser row ·
  9 one gem-ring · 10 one toll-spiral · 11 one hand-telegraphed curtain row · 12 one
  ghost-mirror triplet · 13 one crestfall row locked to the eye-shadow pocket.
- **Fairness caps:** ≤2 wall-class components live simultaneously (rotating roster of 4–5
  components per 4s "verse," cycling so all 13 appear across three verses); total live bullets
  under the shipped per-quality visible cap (each component is its source card at 1-row/1-arm
  thinning); **the safe line is authored**: each verse's active components inherit their
  signatures' REST beats staggered so one dodge-line always exists — the medley's safe path IS
  the rhythm exam.
- **Amber floor:** the 9-gem and 2-corridor components are amber; the 10-toll chain is the
  rhythm-parry beat — the dread feeds the parry diet (law 7) at the exam.
- **Relic edits (GIVEN — the player edits the finale):** the five wing-root relics are shootable
  from stage 2 onward; each destroyed relic DELETES its boss's component from Every Verdict at
  Once: **horn → the Voidmaw tunnel ring** (and with it 9's gem-ring inherits the violet — the
  quote-of-a-quote collapses to one component) · **snapped feather-blade → the Ashtalon
  stoop-stream** · **chain link → the Brineholm geyser row** · **thread spool → the Weftwitch
  curtain row** · **bell shard → the Knellgrave toll-spiral**. Five deletions maximum: the exam
  never thins below 8 components (still screen-filling), and destroying relics costs stage-2/3
  DPS time the player chooses to spend — mastery is picking WHICH verdicts you'll face.
- Counter-verb: the dread's answer is the whole game — but its counterintuitive core is that the
  safe line follows the REST beats, i.e. the player survives by reading rhythm, not space
  (the medley signature's promise cashed).

**Apex band budget: zero new attack ids spent ✓** (Parallax Regard and the surge-chase corridor
are reroutes/timing on `stream`/`curtain`; the seal, snap, relics, and verb-shift are mechanics
already allocated to 14 by §5f/§5i). Apex graze (AUDIT G-4's unsatisfiable-law fix, adopted
here): `grazeForm: 'medley'` quotes each felled boss's graze form during its quote — slipstream
under 3's stoop, annulus under 5's lemniscate, lee under 8's geysers, shrinking disc under 10's
tolls, shadow-pocket under 13's crest.

---

## APPENDIX — LEDGERS

**New-attack-id budget:**
| Band | Spend | Where | Gate cost |
|---|---|---|---|
| Sentinels | — (reworks compose `iris/aimed/secondWave`) | C.1 | — |
| Colossi | — (reroutes + allocated graze/parry forms only) | C.2–C.4 | emitter-seam engine work at C.4 (ledgered, not an id) |
| Calamities | **`geyser`** (the band's one slot, previously unspent) | C.5 BRINEHOLM | whitelist + emission-budget + safe-lane gates, once (§5b) |
| World-Enders | — (`crestfall` already spent the slot; C.7/C.8/C.9 compose) | — | one new setpiece path (`pendulumSweep`) — setpieces are outside the id budget by precedent |
| Apex | — (zero-new-id law kept) | Part D | — |

**Allocated-but-unshipped mechanics this plan turns into specs (all pre-budgeted in §5i, per
AUDIT §3.B — no new allocations invented):** ORGAN BREAK (C.3, reused C.4), SLIPSTREAM (C.2),
THREAD-THE-GAP scoring (C.3), ORBIT ANNULUS (C.4), TENNIS RALLY + slot-9 seal (C.6), SHRINKING
SAFE DISC (C.7), CANCEL-CONVERT MOTE HARVEST (C.8), Apex graze medley (D).

**Dread counter-verb census (post-rework, §5i.C law 7 needs ≥4 parry-fed):**
1 dodge-graze · 2 **parry** · 3 surge · 4 **parry** · 5 graze-orbit+parry · 6 **parry**
(pane-break, shipped) · 7 read · 8 position/graze · 9 **parry** · 10 dodge (survival, exempt) ·
11 read (+parry option) · 12 **parry** (shipped) · 13 position (shadow) · 14 rhythm-read.
Quota met with margin; no two adjacent slots share a dread verb.

**TTK/economy:** no hp changes anywhere; cadence changes only at 7 (lift to band floor, B-3) and
9 (tighten to band ceiling, C.6) — both move TOWARD their §5b band tables, so the DPS-sim gate
(when it lands, AUDIT §3.C.1) sees less variance, not more. Amberdiet: every reworked phase names
its carrier in its move table; survival cards (10, 13) keep the shipped list-exemption verbatim.

---

## PART E — BUILD ORDER, SPEC-COMPLETENESS & THE CHECKPOINT PROTOCOL

Appended by the implementability audit (2026-07). Parts A–D are the design; this part is the
build + verification layer on top of it. Every claim below was **re-verified against the live
code** at write time (symbols and quotes, never line numbers). Nothing in A–D is re-litigated;
where the code has moved past the plan's claims, E.0 records the correction and the C-entry
stands otherwise.

### E.0 — GROUND TRUTH FOR BUILDERS (paths, real gate names, code-vs-plan corrections)

**Where things actually live** (a fresh session's first trap): the boss gates are
`reforged/tests/boss.mjs` and `reforged/tools/bossgate.mjs` — NOT the repo-root `tests/`/`tools/`
directories, which hold an older suite. Everything runs from `reforged/`:
`node tests/boss.mjs` · `node tests/bossboot.mjs` · `node tools/bossgate.mjs <bossId> [--studio]`
· `node tools/bossstudio.mjs` · `node tools/tiershots.mjs` · `node tools/tricount.mjs`
· `node tests/bulletcontrast.mjs` · `node tools/stamp-sw.mjs` (same commit as any shipped change).

**The real gate names** (cite these, not paraphrases):
- `tests/boss.mjs`: tri ceiling per `TIER_BUDGETS`; named-pivot **telegraph** gates ("setCharge
  must MOVE geometry" — per-boss, e.g. "knellgrave charge WIDENS the swing arc"); **amberdiet**
  (`hasAmberCarrier` on every phase list + a simulated fire-to-fire "amber volley every ≤12s";
  `AMBER_CARRIERS = new Set(['aimed', 'fan', 'crossfire', 'stream'])` — nothing else counts);
  **rhythmprint** (pairwise gap-distribution distinctness, `KS_FLOOR = 0.20`, every boss vs every
  other); §3e **emission budget** (`ALL_ATTACKS` whitelist; worst concurrent load ≤55 @ q0.7,
  ≤160 @ q1, via `debugEmitAttack`) + **laneSafe** ("2D fills must leave their designed safe lane
  (≥2.2 half-width somewhere)" — asserted on `curtain` and `movingGap`); full-roster
  **lifecycle**-to-a-kill sim; per-sheet geometry asserts (rib clearance, twin ΔL, pane wedges…);
  a headless **beamEdge detector** assert ("annulus + depth-window law holds") — the precedent any
  new grazeForm branch must copy; a live **THREAD-CUT + moteHarvest integration** sim.
- `tools/bossgate.mjs`: G1–G7 as specced in §7b, implemented, with the sanctioned value-inversion
  overrides (`gate.pale`, and EMBERTIDE's `inverted`/`frameFill`); `--studio` runs the same
  pixel gate on isolated studio frames (§7c).
- `tests/bulletcontrast.mjs`: pure-data check of every biome × role colour (danger magenta, the
  3-band ladder, `REFLECT_AMBER`, `REFLECTED_CYAN`) against fog AND horizon. **There is no
  "role-pair distance" gate** — do not cite one. What it DOES enforce that matters here:
  role colours are FIXED ("the player learns 'amber = parryable'… once, globally — L93").

**Code-truth corrections to Parts A–D and the APPENDIX** (verified against `bossDefs.js` +
`boss.js`; these UPDATE the "allocated-but-unshipped" ledger above):
1. **CANCEL-CONVERT MOTE HARVEST is SHIPPED**, not unshipped (A.11.4 and the APPENDIX list are
   stale): weftwitch's def carries `grazeForm: 'moteHarvest'`, `boss.js` implements it ("§5i
   CANCEL-CONVERT MOTE HARVEST (WEFTWITCH, grazeForm 'moteHarvest'): the CUT…"), and
   `tests/boss.mjs` drives it live. **C.8's "Mote Harvest" row is already in the game — do not
   rebuild it**; C.8 shrinks to the hand-telegraph wiring + the per-organ crossfire.
2. **SHADOW-RIDE's detector is SHIPPED** (brineholm def `grazeForm: 'shadowRide'` + the boss.js
   branch "SHADOW-RIDE (BRINEHOLM's Calamities graze, def-gated)"). What A.8.3 correctly says is
   missing is the *geysers it rides against* — C.5 pays the fiction, not the detector.
3. **SHRINKING SAFE DISC is half-wired**: knellgrave's def ALREADY carries
   `grazeForm: 'shrinkDisc'` — but `boss.js` has **no `shrinkDisc` branch**. A def label with no
   engine consumer. Same story for the Apex: unmasked's def already carries `grazeForm: 'medley'`
   with no branch. C.7 and Part D inherit pre-reserved labels; only the detectors are owed.
4. **The bullet cull floor is already widened** — `bossBullets.js`: "The lower y-bound is WIDENED
   to -16 (§5e, the MARROWCOIL/BRINEHOLM below-approach need)… the wider floor only lets
   legitimately-low-born bullets travel into frame." `geyser` births at `CONFIG.laneMinY - 3`
   (≈ −0.5) survive today; the §5e "widen the cull bounds" roadmap item is PAID. No cull PR.
5. **C.9 item 2 is a no-op as written**: crestfall's rows are quality-gated in code
   (`rows = quality < 0.75 ? 4 : 5`) and the pocket `±3.4` is hardcoded — there is no per-def
   density dial to set. C.9 is items 1 + 3 only (two attack-list lines). Still FULLY SPEC'D —
   just smaller than advertised.
6. **C.7's "spiral rerouted to emit from `bellMouth`" is engine work, not a free reroute**: the
   base `spiral` branch emits from `anchorX, B.fightHeight` (the player-side lane anchor), NOT
   from `emitOrigin`/`def.muzzle`; only the hollowgate pane-radial override redirects it. The
   reroute needs the E.1 ENG-A seam like everyone else.
7. **Verified TRUE where the plan leaned on it**: the continuous-graze detector family shipped
   exactly as C.2 claims — `beamEdge` (hollowgate), reused verbatim by `tideEdge` (embertide),
   `shadowRide` (brineholm), `holdFlinch` (karnvow), with the `beamHeld/beamTick/beamGrace` ramp
   and "one grazeForm per boss" as the standing convention. Bullets already carry per-part tags
   (`emitBoss`'s `tag` param → `tag = 'rosePane' + tag` under `destructiblePanes`), and
   `routePartDamage`'s `PART_SYS` table is deliberately extensible ("Each entry names the def
   flag + the model's own hit-test/crack/alive/live hooks"). `resolveEmitOrigin` resolves ONE
   origin from `def.muzzle` via `model.partWorldPos`; `partWorldPos` itself already resolves
   arbitrary named parts (hand pivots, `ghostMuzzle`) — the primitive exists, the per-attack
   multi-origin consumer does not. `crossfire` is hardcoded `for (const ex of [-10, 10])`.

### E.1 — BUILD QUEUE (coexist → prove on a hero → migrate; every row its own PR)

**Ordering rationale:** the defect fix first (C.9 is a bug, not a rework); then every def-data
rework (cheap, independent, each restores a Part-B finding); then the engine seams, each proven
on ONE hero boss before its other consumers land; Tier-1 boss PRs in slot order so the sawtooth
teeth (5, 9, 13) come back in play order; Part D dead last — "the exam tests the reworked
curriculum" (Part D intro), so it cannot start before C.1–C.9 merge.

**TIER-0 — def-data / telegraph-only (a fresh chat builds these from the C-table + E.3):**

| Q | PR | Edits (all in `bossDefs.js` unless noted) | Prereq | Coexists with (shipped code it leans on) | "Prove on a hero" means |
|---|---|---|---|---|---|
| 1 | **C.9a EMBERTIDE** (the defect fix — FIRST) | P5 attacks → `['crestfall','crossfire']`; P2 → `['curtain','secondWave','crossfire']` (drop C.9 item 2 — E.0.5) | none | `horizonPocketX` + its crestfall consumer, both shipped | drive `embertide_horizonbreak` and watch `gapC = horizonPocketX` govern the live rows — the shadow finally kills/saves |
| 2 | **C.2a ASHTALON id swap** | P3 `spiralStream` → `fan` (P3 = `['stream','fan','secondWave']`) | none | all four ids shipped | P3 plays sparse-pursuit, no turret fill |
| 3 | **C.3a MARROWCOIL opener** | P1 → `['aimed','iris']`, `fan` moves to P2 (kills B-2) | none | `iris` shipped (still lane-anchored until ENG-B — an honest intermediate state, noted in the PR) | first 20s no longer identical to slots 6/7 |
| 4 | **B-3 THRUMSWARM dials** | P3/P4 cadence → `[1.2, 1.55]` / `[1.2, 1.5]` | none | PRESSURE OSTINATO signature carries the density feel | rhythmprint still clears vs all 13; the fight still feels relentless (human judges on preview) |
| 5 | **C.1a STORMREND teach fix** | `iris` (slow form) moves to P2; `secondWave` added to P2 | none | both ids shipped | iris no longer debuts inside the dread (law 4 fixed even before the new dread lands) |

**ENGINE SEAMS — small, def-gated, roster-byte-inert PRs (Tier-1 prerequisites):**

| ENG | Seam (what gets built) | Grounding | Unblocks | Hero (prove here first) |
|---|---|---|---|---|
| A | **Per-organ / multi-origin emit**: def/card-gated origin override per attack id — resolve named parts via `model.partWorldPos` per emitter (crossfire's `[-10,10]` → a resolved pair; per-emitter time-to-impact per §5e: "`aimVel` assumes `pose.rel` — crossfire's inline t is the template") | `resolveEmitOrigin` + `firePaneRadial` precedents | C.4 (twins), C.6 (lance+chain crossfire), C.7 (bellMouth spiral — E.0.6), C.8 (hands), D (Parallax Regard) | **EITHERWING (C.4)** |
| B | **Authored-gap/anchor provider**: def/card-gated override of player-sign gap placement (`curtain`'s `-Math.sign(player.position.x \|\| 1) * 5.5`, movingGap's seed, iris's `anchorX`) — generalize the `horizonPocketX` precedent (an authored pocket a pattern reads) into a per-def hook instead of a boss-13 global | `horizonPocketX` → crestfall | C.1b (eye-axis corridor), C.3 (rib aperture), C.7 (bob-locked gap), C.8 (hand-skipped lane) | **WEFTWITCH (C.8) or STORMREND (C.1b)** |
| C | **`geyser` id**: new executeAttack branch — crestfall's mirror (births at `CONFIG.laneMinY - 3`, `vy > 0`, rows/step/gap dials copied); plume telegraph one beat early; append to `ALL_ATTACKS` + add its laneSafe/concurrent asserts | crestfall branch quoted in C.5; cull floor already −16 (E.0.4) | C.5, D stage 2 | **BRINEHOLM (C.5)** — it IS the hero |
| D | **New grazeForm branches** on the shipped tick economy (`beamHeld/beamTick/beamGrace`): `slipstream` (C.2b), `orbitAnnulus` (C.4), `shrinkDisc` (C.7 — def label already live, E.0.3). Each ships with a headless assert copying "beamEdge detector: annulus + depth-window law holds" | beamEdge/tideEdge/shadowRide branches | C.2b, C.4, C.7 | **ASHTALON slipstream (C.2b)** — the simplest of the three |
| E | **Parry-per-part attribution + PART_SYS third entry**: parried amber bullets already carry part tags (E.0.7) — add a parry-side counter per tag (today the only parry counter is Onewing's `GHOST_FRAME_HITS`; `partHits` counts SHOT damage) + a `destructibleRibs`-style `PART_SYS` row with model `crack/hit/alive/live` hooks | `PART_SYS` ("prove on HOLLOWGATE's panes… extend… with zero new plumbing") | C.3 (ORGAN BREAK), C.4 (holder stagger), C.6 (gem shatter variant) | **MARROWCOIL (C.3)** |
| F | **Rally loop + card-scoped gun seal**: `riposteReturnT` is a one-shot timer — build the looping orb state (accel per return, cap 4, completion/miss resolution) + a card-scoped reflect-only seal (none exists; `lockMuted` is lance-only) | `reflectRiposte` v1 seam | C.6, D stage-2 seal | **KARNVOW (C.6)** |
| G | **THREAD-THE-GAP scorer**: clearance+lateness measured at the crossing frame + a chain window (math authored at PRE-BUILD — see E.2 C.3 row) | crossing-graze check in `bossBullets.js` (`prevRel > 0 && s.rel <= 0`) | C.3 | **MARROWCOIL (C.3)** |
| H | **`pendulumSweep` setpiece**: new `SETPIECE_PATHS` entry (setpieces are outside the id budget by precedent — APPENDIX). Fires-while-moving has precedent ("Runs MOVING so crossfire keeps raining from wherever the pass carries" — circlingPass); suppression is per-setpiece (`ribThread` holds `attackTimer` explicitly) | `SETPIECE_PATHS` registry + `lastToll` path grammar | C.7 | **KNELLGRAVE (C.7)** |

**TIER-1 boss PRs (after their ENG rows; slot order):**

| Q | PR | Needs | Coexists with | "Prove on a hero" means |
|---|---|---|---|---|
| 6 | **C.1b STORMREND dread** | ENG-B (eye-axis iris center) + one card-gated iris×3 chain + the coplanar-ring model rig (named pivot for the telegraph gate) | shipped `stormrend_eye` card | corridor-parry is geometrically forced: fleeing outward dies to contraction, the corridor holds amber `aimed` on the beat |
| 7 | **C.2b ASHTALON slipstream** | ENG-D (`slipstream`) | shipped `stoopingStrike` setpiece | riding the pocket ≥0.8s + Surge release = the exposure window; the §5f answer "surge INTO the dive gap" exists in geometry |
| 8 | **C.3b MARROWCOIL interior** | ENG-B (rib aperture + coil-iris) + ENG-E + ENG-G | shipped `closingRibs`, rib pivots ("Named per-rib root pivots (5 pairs, L/R)"), stream amber | parry a rib's strain volley ×N → that rib's rows verifiably vanish for the rest of the fight |
| 9 | **C.4 EITHERWING** | ENG-A (hero) + ENG-D (`orbitAnnulus`) + ENG-E (holder stagger) | shipped `figureEight`, twin anatomy asserts in boss.mjs | crossfire origins visibly track the lemniscate; the annulus lap pays; the ±10 posts are gone |
| 10 | **C.5 BRINEHOLM geyser** | ENG-C (hero) | shipped `sounding`, `shadowRide` detector (E.0.2), SHACKLE mercy | rows erupt from below-frame tracking the submerged body; 6≡8 dread collision dead (`curtain`/`spiralStream` leave the def) |
| 11 | **C.6 KARNVOW** | ENG-A (asymmetric crossfire) + ENG-E (gem shatter) + ENG-F (hero) + def restructure 3→4 cards + cadence `[1.05,1.35]` | shipped riposte v1, `voidmawVerdict` loom, `lockMuted` | a completed rally exists start-to-finish; the seal resolves on it; the verdict quote's gems parry-shatter rings |
| 12 | **C.7 KNELLGRAVE** | ENG-A (bellMouth spiral) + ENG-B (bob-lock) + ENG-D (`shrinkDisc` branch — label pre-wired) + ENG-H (hero) + def 4→5 phases | shipped toll infra (`bellToll`/`tollNow`), `swingPivot` + its charge-widen assert, MUSIC-LOCKED `rhythm.ticket` | the toll's bullets expand FROM the bell; the pendulum crosses the lane with the muzzle |
| 13 | **C.8 WEFTWITCH** | ENG-A (hands) + ENG-B (hero: hand-skipped lane) + model hand-choreo (E.2) | shipped `threadCut`, `moteHarvest` (E.0.1 — already live) | the unsewn lane is decided a beat early and the hands SHOW it; player-sign placement provably off for this def |
| 14+ | **PART D** (split: stage plumbing → stage-1/2/3 quote PRs → finale + relics) | ALL of C.1–C.9 merged + the quote-by-card-id player + stage-swap rig (§5e Apex row) + relic system (see E.2 row D) | `grazeForm: 'medley'` label (already on the def, E.0.3) | each stage's quotes are the POST-C forms, verified per quote |

### E.2 — SPEC-COMPLETENESS LEDGER (the honest answer to "can any chat build this?")

**Verdicts:** FULLY = a fresh session ships it from the C-table + E.3 alone. SPLIT = the def-data
half ships alone; the rest waits on a named seam. NEEDS SEAM = the C-entry's intent is clear but
the load-bearing engineering is unwritten — the named gap below is what a PRE-BUILD checkpoint
must design before code.

| Rework | Verdict | Buildable today, as written | The missing seam — named, specific |
|---|---|---|---|
| C.1 | **SPLIT** | C.1a (iris→P2, secondWave→P2) | **C.1b:** (i) card-gated iris center on the eye axis — iris anchors at `anchorX` (player-side); needs ENG-B; (ii) the ×3 no-rest chain — a card-scoped cadence override, no precedent besides the card-gated `horizonPocketX`; (iii) the coplanar ring-alignment rig is MODEL work (new named pivot for the telegraph gate) that the C-table calls "one telegraph rig" without a sheet. |
| C.2 | **SPLIT** | C.2a (id swap) | **C.2b SLIPSTREAM:** the C-entry says "a drawn moving safe pocket… collision walls at its edges" — *what edge contact does is unspecified* (damage? push-out? both differ wildly in feel); the ≥0.8s ride timer and the Surge-release exposure hook have no defined state carrier. Detector economy itself is genuinely a beamEdge copy (E.0.7) — the gap is the pocket's rules, not the ticks. |
| C.3 | **NEEDS SEAM — the deepest gap in the plan** | C.3a (opener) only | ORGAN BREAK is quoted from §5b as if self-executing; it is not: (i) **parry→rib attribution** — bullets carry part tags but *nothing counts parries per tag* (`partHits` counts shots; `GHOST_FRAME_HITS` counts parries but is Onewing-global, not per-part); (ii) **rib→gap mapping** — "the gap = the surviving rib aperture": 5 rib pairs to a movingGap x-position is an unwritten function, and the authored gap must still clear the laneSafe ≥2.2 gate; (iii) "its movingGap rows are deleted" — deletion semantics (future volleys? in-flight rows?) unspecified; (iv) coil-iris needs the model to expose coil-circle world positions by name for `partWorldPos`; (v) **THREAD-THE-GAP math** — "clearance+lateness, chains" has no formula, no window, no HUD surface. |
| C.4 | **NEEDS SEAM** | nothing ships def-only | (i) twin-origin crossfire = ENG-A (hardcoded `[-10,10]` today); (ii) **ORBIT ANNULUS lap detection** — "a full unbroken lap" around a *moving lemniscate midpoint* is real math (angle accumulation about a moving center, break conditions) the plan never writes; (iii) the drawn band visual; (iv) holder-stagger = ENG-E family (parry-count per twin) + the 2.5s eye-drop window state. |
| C.5 | **MOSTLY SPEC'D** — the best Tier-1 spec in the plan | def swaps; the `geyser` branch is genuinely derivable from the quoted crestfall shape; cull already safe (E.0.4); shadowRide detector already live (E.0.2) | (i) plume telegraph: "plumes reuse the existing burst particle path" — *which* function is unnamed (PRE-BUILD names it); (ii) geyser-tracks-the-submerged-body: the mapping from the `sounding` path's x to the plume line is one line of code that nobody wrote; (iii) the `ALL_ATTACKS` + laneSafe/≤55 asserts (mechanical, but they ARE the §5b "whitelist + emission-budget + safe-lane gates" the APPENDIX charges — they live in `tests/boss.mjs` §3e, nowhere else). |
| C.6 | **NEEDS SEAM — second deepest** | cadence + 3→4 card ladder (def-data) | (i) **the rally orb state machine** — "existing bullet plumbing, not an attack id" *understates it*: `riposteReturnT` is a one-shot timer; loop, +15%/return, cap 4, completion detection, and the miss-consequence are all unbuilt state; (ii) **the REFLECT-ONLY SEAL** — no card-scoped gun-seal primitive exists (`lockMuted` mutes the LANCE only); the "resolves on first completed rally + timeout hatch" needs the card schema's hatch wired to a new seal state; (iii) **"violet-AMBER" collides with the fixed-role-colour law** — `REFLECT_AMBER` is pinned globally and `bulletcontrast` has no violet-amber row; resolve as *amber gems on violet rings* (zero new role colour) or pay a new bulletcontrast row and accept the taught-grammar risk — a PRE-BUILD decision, currently unmade; (iv) gem-at-clock-position + parry→*that ring* shatters = per-ring bullet grouping + a group-delete op that doesn't exist. |
| C.7 | **NEEDS SEAM** | 5-phase/5-card def structure; `swingPivot` + charge-widen assert already shipped; `shrinkDisc` label pre-wired (E.0.3) | (i) spiral-from-bellMouth = ENG-A, not a free reroute (E.0.6); (ii) the `shrinkDisc` detector branch (toll-ring pockets + escalating ticks + last-beat bail — the pocket geometry is unwritten); (iii) **hemiola scheduling** — "two `spiral` tolls a half-beat apart" needs a subdivision hook on the `rhythm.ticket` quantizer that doesn't exist; (iv) bob-locked movingGap = ENG-B (gap phase-locked opposite the pendulum — the phase source is the setpiece's k, a new coupling); (v) `pendulumSweep` path constants (±14 sweep, rel ~12 nadir) are given — the ENG-H entry itself is low-risk. |
| C.8 | **NEEDS SEAM — third deepest** | almost nothing def-only; **Mote Harvest row already SHIPPED (E.0.1) — strike it from the build** | **The hand-telegraph is a new information channel, not a wiring tweak:** (i) the gap must be *decided one beat EARLY* — `executeAttack` decides gap placement at fire time; telegraph-then-fire needs the decision hoisted into a pre-telegraph step that also drives the model; (ii) "the one lane column her hands never touched" needs a **lane-column quantization** (curtain today is continuous x with a slot-width gap — "columns" don't exist as a concept); (iii) the model needs a hand-sew choreography API (per-column lit-thread animation, one beat ahead — no current telegraph is per-position; `setCharge` is a scalar); (iv) the dread's 5-row constant-gap chain + selvage-thread amber (parry deletes the next row) is a card-gated composite on top of (i)–(iii). Cross-Stitch = ENG-A (cheap once A lands). |
| C.9 | **FULLY SPEC'D** | all of it — two def lines (item 2 is a no-op, E.0.5) | — |
| B-3 | **FULLY SPEC'D** | two cadence dials | — (must re-clear rhythmprint, E.3) |
| D stages 1–3 quotes | **FRAME SPEC'D, SYSTEM UNBUILT** | nothing | **The quote-by-stable-card-id player is the plan's largest unbuilt system** — no mechanism exists for one boss to fire another boss's card (patterns key off the LIVE def; "quotes by stable card id" implies a cross-def pattern invoker + per-quote thinning). Also: stage-swap rig machinery (§5e Apex row, "builder-internal dissolve between sub-rigs"), the seraph organ→quote assignment (each quote re-anchored to a wing organ = ENG-A at scale), Parallax Regard's N-origin cycling. |
| D finale + relics | **FRAME SPEC'D, SYSTEM UNBUILT** | nothing | The "rotating roster of 4–5 components per 4s verse" fairness scheduler is a new system (not a pattern); the authored safe line ("components inherit their signatures' REST beats staggered") needs a rest-beat composer; the 5-relic shoot-to-delete map needs a relic part system (PART_SYS-adjacent but with cross-stage persistence); `grazeForm: 'medley'` has a def label and no branch (E.0.3). |

**The three most under-specified seams, ranked** (the direct answer to the owner's question):
**1) C.3 ORGAN BREAK + THREAD-THE-GAP** (parry-per-part attribution, rib→gap mapping, deletion
semantics, scoring math — four unknowns stacked); **2) C.6 rally + seal + violet-amber** (a
state machine sold as "existing plumbing", a primitive that doesn't exist, and an unresolved
collision with the fixed-role-colour law); **3) C.8 hand-telegraph** (a new pre-telegraph
information channel + lane quantization + a model choreography API, sold as "telegraph-wiring").
A fresh chat can build C.9, B-3, C.2a, C.3a, C.1a, and (with care) C.5 today; everything else
needs its PRE-BUILD checkpoint to author the seam first.

### E.3 — PER-REWORK VERIFICATION CHECKLIST (real gates only)

**Universal, every PR, no exceptions** (from `reforged/`): `node tests/boss.mjs` +
`node tests/bossboot.mjs` fully green (the suite runs EVERY boss — the lifecycle sim is the
roster-regression net); **the shipped-roster byte-invariant**: the PR diff touches ONLY the named
def block and/or the new def-gated engine branches — every other boss's def byte-identical, and
every new engine path gated so a def without the flag never enters it (the coexist rule, §6);
`node tools/stamp-sw.mjs` in the same commit; §7c ORDER: studio verdict BEFORE in-game captures,
post both, STOP for the human. **No automated gate exists for dread-set collisions (B-4), opener
collisions (B-2), or counter-verb geometry — those are POST-BUILD checkpoint duties (E.4), by
construction.**

| Rework | Must re-pass (beyond universal) | Dial/collision movers flagged |
|---|---|---|
| C.9a | amberdiet (P5 keeps `crossfire` — a listed carrier ✓; P2 keeps `crossfire` ✓); `bossgate embertide --studio` with its `inverted`/`frameFill` overrides still green | NO rhythmprint mover (cadence untouched). The one check that matters is the geometry trace: during `embertide_horizonbreak`, live rows obey `gapC = horizonPocketX` |
| B-3 | **rhythmprint** (dials move — KS ≥ 0.20 vs all others must re-clear); amberdiet re-sim | cadence mover by definition; nothing else |
| C.1a | amberdiet (P2 gains `secondWave`, keeps `fan` ✓); rhythmprint unchanged (dials kept) | teach-ladder only |
| C.1b | telegraph gate — the coplanar rig needs a NAMED pivot and `setCharge` must move it; `tricount`/`TIER_BUDGETS` (rig adds tris); bossgate G5 + studio black-fill/lit-edge renders (§7c L150); amberdiet (dread `aimed` ✓ carrier) | possible G5/G7 mover (new aligned-ring visual — watch the additive-volume count) |
| C.2a | amberdiet (P3 keeps `stream`+`fan` ✓); emission §3e untouched | none |
| C.2b | the new ENG-D headless detector assert (copy "beamEdge detector: annulus + depth-window law holds"); no pixel gate sees graze forms — the POST-BUILD agent traces the pocket by hand | none (no cadence/phase change) |
| C.3b | amberdiet (P1 `aimed` ✓, P3 `stream` ✓); **laneSafe on movingGap with AUTHORED rib-aperture gaps** (the authored gap must still clear ≥2.2 — this is where ENG-B can silently fail the fill gate); rib-pivot telegraph asserts (already shipped — keep green); `tricount` (crack states); lifecycle | rhythmprint NO (signature/cadence kept); dread-set unchanged |
| C.4 | emission §3e (crossfire from moving origins — same bullet counts, assert stays green); eitherwing per-sheet asserts in boss.mjs (twin ΔL, handoff travel, ribbon telegraph) must survive the emitter change; ENG-D annulus assert; bossgate G5; studio | rhythmprint NO; **B-4 scan: P3 set changes — POST-BUILD re-runs the multiset scan** |
| C.5 | **`ALL_ATTACKS` gains `geyser`** + its ≤55 @ q0.7 concurrent assert + a laneSafe-style designed-gap assert (the §5b gate cost, paid once — APPENDIX); amberdiet (P4 keeps `stream` ✓ — note `geyser` and `iris` are NOT carriers); bulletcontrast unchanged (geyser uses the existing `activeBand` colours — zero new role colour); lifecycle | rhythmprint NO (cadence untouched); **kills the 6≡8 collision — POST-BUILD confirms the multiset scan now passes** |
| C.6 | **rhythmprint** (cadence → `[1.05,1.35]` + a 4th phase/card — the print moves, must re-clear vs all); amberdiet (dread phase: `aimed` is the carrier — `tunnel` is NOT in `AMBER_CARRIERS`); **bulletcontrast IF any new colour ships** (E.2 C.6.iii — prefer the zero-new-colour resolution); lifecycle (new card in the kill path); ENG-F rally sim assert (add one: seal resolves ≤ card window — the "never hard-wall" claim made executable) | cadence + card-count mover; dread verb flips to parry (census row already says so ✓) |
| C.7 | **rhythmprint** (4→5 phases + hemiola — the biggest print move in the plan); amberdiet (every phase carries `aimed` or `stream` per the C-table ✓); telegraph (the shipped "knellgrave charge WIDENS the swing arc" assert must survive the pendulumSweep model work); emission (`spiral` already in `ALL_ATTACKS` ✓); ENG-D shrinkDisc assert; `tools/knellshot.mjs` exists — reuse for the per-boss captures; studio | print + phase-count mover; `iris` leaves the def — amberdiet re-sim mandatory |
| C.8 | amberdiet (unchanged carriers); the shipped "THREAD-CUT + §5i moteHarvest INTEGRATION… drive a LIVE fight" sim must stay green (the rework touches her live fight loop); studio hand-choreo shots as per-sheet extra states; bossgate G5 if the hand rig changes charge silhouette | rhythmprint NO; **dissolves the 11⊇13 subset from her side — POST-BUILD multiset scan** |
| D (each stage PR) | everything above for whatever it quotes + `tricount` per stage rig + bossgate G1–G7 per stage (stage 2/3 likely need their own `gate:` block decisions) + `tiershots` (the roster sheet gains the Apex) + bulletcontrast if the finale adds any colour | the medley print is definitionally distinct, but the KS gate runs on defs — PRE-BUILD must decide how a 3-stage def encodes `rhythm` without breaking the print sim |

### E.4 — THE CHECKPOINT-AGENT PROTOCOL (two Fable high-effort passes per build)

The studio law "verify before claiming" made a gate. Two checkpoint agents bracket every
non-trivial build. Both are **Fable, high effort**, spawned fresh (no builder context bleed —
the POST agent especially must not inherit the builder's optimism). Reusable: the same two
prompts run for every rework; only the C-entry/E-rows swapped in.

**PRE-BUILD CHECKPOINT (spec-writer, adversarial about drift).**
- **Inputs:** the rework's Part-C entry + its E.1 queue row + its E.2 ledger row; the CURRENT
  `bossDefs.js` def block and every `boss.js` symbol the entry cites (re-read live — the code
  moves between plan and build; that is this agent's reason to exist); the boss's §5d sheet;
  §7b/§7c.
- **Output — a concrete implementation spec:** (1) exact def edits as before/after blocks;
  (2) for Tier-1: the engine wiring — which function, which def/card gate, and the coexist
  argument ("every def without the flag is byte-unchanged" must be provable from the diff shape);
  where the E.2 row says NEEDS SEAM, this agent AUTHORS the seam (the rib→gap function, the lap
  math, the seal state) — that design is the deliverable; (3) the E.3 gate list instantiated:
  which asserts to ADD (new grazeForm assert, geyser laneSafe, rally-resolves sim), not merely
  re-run; (4) the studio shot list — states × backdrops per §7c, incl. per-sheet extra states
  (crack states, hand-choreo poses); (5) a **drift report**: every plan citation re-verified,
  corrections listed E.0-style. **If drift contradicts the rework's premise, STOP and escalate —
  never improvise a new design inside the checkpoint.**
- **Skip test:** skipped only when Part C/E already IS the edit list (see the tier rule below).

**POST-BUILD CHECKPOINT (adversarial verifier — the gate for "done").**
- **Inputs:** the full diff; the gate transcripts (`tests/boss.mjs`, `tests/bossboot.mjs`,
  `tools/bossgate.mjs` incl. `--studio`); the studio/tiershot captures; the rework's C-entry.
- **Checks, in order:**
  - **(a) THE GEOMETRY FORCES THE VERB** — the plan's core test. Trace emit origin, gap
    placement, and velocity IN THE DIFF and confirm the named counter-verb is the geometry's
    best answer — never trust the card name (the A.5 failure: "the emit x is the constant
    `[-10, 10]` whatever the `figureEight` lemniscate is doing"; the A.13 failure: "the player
    who ignores the face entirely survives fine"). Distrust names; trust coordinates.
  - **(b) DISTINCTNESS** — rhythmprint KS quoted from the gate output for both slot NEIGHBORS
    (not just the global min); the **dread-set multiset scan by hand from the defs** (no
    automated gate exists — B-4 regression is this agent's job); the C-table's uniqueness diff
    confirmed against the roster.
  - **(c) DIET + INVARIANT** — amberdiet output quoted per phase; the `git diff` audited line
    by line for the byte-invariant: only the named def block + the new def-gated branches.
  - **(d) NO NEW COLLISION** — B-2 opener scan, B-4 dread scan, and the APPENDIX counter-verb
    census still true ("no two adjacent slots share a dread verb").
- **Output:** `PASS`, or `REWORK-AGAIN:` findings — each naming a symbol and the geometric or
  gate evidence, never a vibe. A PASS is required before the PR posts its crops and stops for
  the human (§7c order; the human verdict is still the merge condition — this gate replaces the
  builder's self-verdict, not the owner's).

**Which reworks get which:**
- **BOTH checkpoints, mandatory:** every ENG-x PR (PRE is where seams get designed — this is
  where plans rot), and C.2b, C.3b, C.4, C.5, C.6, C.7, C.8, every Part D stage. C.4 and C.6
  restore two of the three sawtooth peaks (B-1) — for them, both checkpoints are non-negotiable
  regardless of apparent scope.
- **POST-only (light — gates + ONE geometry trace):** C.9a (peak 13's restoration, but the edit
  list is already exact; its single trace: `gapC = horizonPocketX` live during the card),
  C.2a, C.3a, C.1a, B-3 (its trace: the rhythmprint transcript).
- **C.1b:** PRE optional (it consumes ENG-B rather than designing it), POST at full depth (it
  claims a new counter-verb on a shipped boss).
- **Rule of thumb, for reworks this plan didn't foresee:** PRE-BUILD whenever the E.2 verdict
  says NEEDS SEAM (or the model gains a rig); POST-BUILD always — full depth when the change
  claims a counter-verb, moves a rhythm/cadence dial, or edits any dread set; light otherwise.

**Ledger law (unchanged, restated because checkpoints don't exempt it):** every merged PR
appends its lesson to `LEAPFROG.md` — what the seam turned out to be, what the gate caught,
the reusable pattern. The checkpoint outputs are the raw material; the builder writes the entry.
