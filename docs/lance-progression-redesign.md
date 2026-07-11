# Lance progression redesign — the utility ladder

Date: 2026-07-10
Status: DESIGN PLAN (no code). Supersedes `docs/lance-boss-progression-plan.md`
(2026-07-08). That doc solved the TEACHING order (its rungs 1–8 are kept nearly
verbatim); it explicitly accepted a lance-free endgame ("fine if the gimmick owns
the fight") and a forever-flat chip economy. The owner has rejected that outcome:
the lance must stay a genuinely useful DPS/utility channel through the endgame and
peak at the finale. This doc replaces the old rungs 9+ and adds the economy arc.

Grounding: `reforged/js/lockLayer.js` (the live V1–V5 layer + `lanceDmgEach`),
`reforged/js/config.js` `LOCK` (LAW/TUNE legend), `reforged/js/bossDefs.js`
(BOSS_ORDER + per-def lock data), `reforged/tools/lockdpsCore.mjs` +
`reforged/tests/lockdps.mjs` (the economy invariants), `reforged/BOSS-DESIGN.md`
(§5b registry, §5c band contracts, §5d sheets), and the live boss models
(`bossKnellgrave.js`, `bossWeftwitch.js`, `bossOnewing.js`, `bossEmbertide.js`,
`bossUnmasked.js`) whose named `Object3D`s are the organ candidates below.

---

## 1. Diagnosis — it dies out midway and is dead by the finale

### 1a. Where the lance is today (verified against `bossDefs.js` on this date)

| # | Boss | Tier | hpMax | Lance status NOW |
|---|------|------|-------|------------------|
| 1 | VOIDMAW | 1 | 180 | V1 only (`faceCore`), cap 0 — inert by design (tutorial) |
| 2 | STORMREND | 1 | 220 | V1 only (`focalEye`), cap 0 — inert by design |
| 3 | ASHTALON | 2 | 290 | V1 only (`visorSlit`) — inert by design (mover stress test) |
| 4 | MARROWCOIL | 2 | 300 | 4 rib organs + skull virtual, cap 3 — ACTIVE (first paint) |
| 5 | EITHERWING | 2 | 330 | eyeRig + seekerFin + seekerScar, cap 3 — ACTIVE (moving) |
| 6 | HOLLOWGATE | 3 | 360 | 5 rose panes + hub, cap 5 — ACTIVE (destructible) |
| 7 | THRUMSWARM | 3 | 380 | queenGroup only → reachable cap 2 — barely active |
| 8 | BRINEHOLM | 3 | 410 | eye + 3 shackles (P0–2), cap 5 → 2 in P4 — ACTIVE |
| 9 | KARNVOW | 3 | 440 | 5 trophy charms + lanceTip virtual, cap 5 — ACTIVE (not muted) |
| 10 | KNELLGRAVE | 4 | 480 | NO lock data — **INERT** |
| 11 | WEFTWITCH | 4 | 520 | V1 only (`loomHeart`), no lockParts — **INERT** |
| 12 | ONEWING | 4 | 540 | NO lock data — **INERT** |
| 13 | EMBERTIDE | 4 | 552 | NO lock data — **INERT** |
| 14 | THE UNMASKED | 5 | 240×3 forms | V1 only (`focalEye`) — **INERT** |

### 1b. The DPS trajectory (base full-cap volley as % of the current phase's HP)

Computed from the live kernel `lanceDmgEach(pips, phaseHp) = min(2.0, 0.10·phaseHp/pips)`
per pip, per-phase spans from each def's `atFrac` ladder:

```
boss    4     5     6      7      8         9      10  11  12  13  14
volley  6.0   6.0   10→7.2 4.0    10→4      10     0   0   0   0   0
%phase  ~6%   ~5.4% ~10%   3.5–6% 8.7→4.9%  5–9%   0   0   0   0   0
```

The curve **peaks at boss 6** (HOLLOWGATE, where the ROI clamp bites in every
phase — the lance is at its ceiling), dips at 7 (single organ ⇒ 2 pips), recovers
through 8–9, and **flatlines at zero for the entire Tier-4 band and the Apex** —
five consecutive fights, roughly the back 40% of the game by HP.

### 1c. Why, precisely

1. **No organs = no lance.** `paintableParts()` needs `def.lockParts`; slots
   10/12/13 have no lock data at all and 11/14 are V1-aim-only. A V1 anchor's
   whole utility is `chipRateMult` 1.15 + ≤3 exposure ticks of 1.0 — rounding
   error against 480–552 HP pools.
2. **The cap ladder is unreachable paper at the top.** `capByTier` promises
   6 pips at Tier 4/5 — the HIGHEST caps in the game — and not one Tier-4/5 boss
   has a single paintable organ. The ladder's promise inverts into an insult.
3. **Even where active, the economy is flat by LAW.** `volleyRoiFrac` 0.10 hard-
   clamps every volley to ≤10% of the current phase HP, and `beatMult` 1.25 is
   applied INSIDE the clamp. There is no growth axis anywhere: a boss-6 volley and
   a hypothetical boss-13 volley are the same ~10 damage. The player's mastery of
   the system stops paying at the exact moment the game asks for its finale.
4. Stale intent debris: the `bossDefs.js` comment block still says
   `lockMuted: true … (slot 13)` — a plan to ash the reticle on EMBERTIDE that was
   never wired and that this doc formally retires. `lockMuted` is set on no boss.
5. `tests/lockdps.mjs` is currently RED on master: it still asserts KARNVOW is
   lance-inert, but KARNVOW gained its trophy-charm `lockParts` (CP2). The gate
   must be re-greened before any economy work (see §6, PR0).

---

## 2. Design thesis

> **The lance is how the dragon CLAIMS a boss.** Every rung teaches you to brand
> one new kind of anatomy; by the Apex you can brand everything the game ever
> showed you — and the brands finally *burn*.

Utility (not just teaching) escalates band by band:

- **SENTINELS (1–2)** — *the lance is your AIM.* V1 retarget + rate bonus +
  exposure cracks. A duel accelerant.
- **COLOSSI (3–5)** — *the lance is a second damage channel.* Paint & volley
  debuts; ~6% of a phase per full volley.
- **CALAMITIES (6–9)** — *the lance is a TOOL.* Volleys sculpt the fight: crack
  panes, free shackles, reclaim trophies; ~10% of a phase per volley at cap.
- **WORLD-ENDERS (10–13)** — *the lance is an ANSWER.* Each lane-breaking gimmick
  gets a lance counter that rides the fight's one puzzle read, and full-cap
  releases gain **SCAR-BURN** (§4): the brands bite for the first time — up to
  ~15% of a phase per perfect volley.
- **APEX (14)** — *the lance is the ledger.* The Unmasked quotes every pattern
  era; the lance quotes every organ era (eye, wound, relic-trophy, constellation)
  and, with all five relics reclaimed, fires the game's strongest volleys —
  ~10–12.5% of a full form bar each — at the boss whose per-form phase pool means
  the ROI clamp never bites (see §4d).

Non-negotiables carried forward: player verbs stay fixed; one puzzle read per
fight — every lance expression below RIDES its boss's read, never adds a second
one; ≤1 new lance rule per rung; the lance is never mandatory (the dodge/parry
fight stays winnable lance-free; kill-timers untouched); every organ is a visible
weak point / weapon / wound / restraint / trophy / exposed organ with a fair
acquisition window.

---

## 3. The 14-rung utility ladder

Format per rung: identity hook → lance role & utility this fight → organs +
fair windows → the ONE new rule → delta vs shipped.

### Band 1 — SENTINELS: the lance is your aim

**Rung 1 — VOIDMAW (shattered mask).** V1 teach, unchanged. `faceCore` is big,
central, stable: learn that greening the reticle retargets rider fire (+15% rate)
and pays crack ticks in exposure windows. *New rule: the aim-line exists.*
Delta: none (shipped).

**Rung 2 — STORMREND (eye of the storm, wall pressure).** V1 under pressure,
unchanged. `focalEye` + fan/movingGap teaches leave-and-reacquire (coyote, drain,
re-lock memory). *New rule: the lock survives your dodge.* Delta: none (shipped).

### Band 2 — COLOSSI: the lance becomes a damage channel

**Rung 3 — ASHTALON (the hunter that never holds station).** Stays V1-only —
this is deliberate (the def carries the LAW comment: pure mover stress test) and
the LAST inert rung in the game. Utility framing: on a boss that closes and
overtakes, the 1.15 rate bonus and exposure ticks after dive passes are the
duel's edge; the player masters holding a line on a MOVING anchor before paint
ever asks them to. *New rule: the anchor moves.* Delta: none. (The old plan's
alternative — two wing organs — is rejected; it fights the def's own LAW.)

**Rung 4 — MARROWCOIL (the body is the arena).** First paint. Polish: gate the
rib organs by phase so the first lesson is gentle — P1 offers `ribPivotL1`/`R1`
only (2 ribs + the skull virtual = a 3-pip teach at cap 3), P2+ opens all four
(`phases` gating already exists on lockParts — the BRINEHOLM pattern). Windows:
aimed/iris P1 air; parry-snap (V4) is the sanctioned paint path for venting ribs.
*New rule: paint & volley.* Delta: one def edit (add `phases` to two rib entries).

**Rung 5 — EITHERWING (one eye passed between two bodies).** Moving organs,
unchanged: `eyeRig` easy anchor (smoothed across the handoff), `seekerFin`/
`seekerScar` caught at lemniscate reversals. Cap 3 = the full set — the first
"complete the set" fight. *New rule: organs move and hand off.* Delta: none.
(Remember this eye — rung 12 pays it off.)

### Band 3 — CALAMITIES: the lance becomes a tool

**Rung 6 — HOLLOWGATE (rose-window face, destructible panes).** Unchanged. The
5 panes + hub; broken panes leave the set (liveness). Utility spike is real here:
`lanceWeight` 0.5 counts toward PART_CRACK_HITS, so volleys help crack the panes
the parry job is also sculpting — the first fight where the lance CHANGES the
fight, not just the HP bar. This is also where the clamp first bites every phase
(~10%/volley): the mid-game ceiling. *New rule: organs can die.* Delta: none.

**Rung 7 — THRUMSWARM (chip lands only while condensed).** The deliberate
single-organ timing exception (reachable cap 2 via `queenGroup` × stackMax).
Polish for the feel-bad: pause brand `decay` while the swarm is SCATTERED
(def-gated `decayPauseWhileHidden`, riding the same liveness seam that seals the
organ) — your banked work survives the boss's own rhythm instead of fizzling
during a phase you cannot act in. *New rule: the organ only sometimes exists.*
Delta: one small def-gated rule; decay behavior for every other boss untouched.

**Rung 8 — BRINEHOLM (shackled, not hostile).** Unchanged: the eye (sealed while
submerged, `eyeOrgan`) vs the 3 shackle restraints (phase-gated, destructible,
mercy mechanic — volleys help SNAP posts early and soften P3). *New rule: organs
have different JOBS.* Delta: none. Note the pattern debuted here —
surfacing-gated organs — is reused at rung 13.

**Rung 9 — KARNVOW (wears the horn it took; the first boss that parries YOU).**
Unchanged data (5 trophy charms + lanceTip virtual, cap 5, NOT muted — the old
doc's `lockMuted` claim was wrong then and stays wrong). Utility focus: this is
the V4 mastery exam — the riposte returns your bullet as amber; a PERFECT parry
snaps a brand (`paintFromParry`) onto the charm that answers it. Polish: make the
riposte's snap ATTRIBUTE to the nearest swinging charm so the rally literally
reclaims his collection one mark at a time. *New rule: parry IS paint.* Delta:
snap-attribution tuning only.

### Band 4 — WORLD-ENDERS: the lance becomes an answer (and starts to bite)

The band-level economy unlock — **SCAR-BURN** (§4) — debuts at rung 10 and rides
every Tier-4/5 full-cap release. Per-boss, each rung still adds exactly ONE
fight rule, and each rule is the boss's own hook spoken in lance grammar.

**Rung 10 — KNELLGRAVE (the bell; the read is RHYTHM).** *The metronome fight.*
**AS SHIPPED (PR2a organs merged; PR2b resonant release + SCAR-BURN in progress) —
this section is corrected to the LIVE 5-phase def, superseding the original spec.**
- **Organs (as built, verified `tests/knellorgans.mjs`):**
  - `virtualLockOrgan: 'knellWound'` — the WOUND / V1 focal: a byte-neutral empty at
    the front-left LIP-BITE RIM (the lit candle-mouth the toll escapes from), placed
    clear of the bound clapper's head and low enough to stay in the flight lane
    (§CP2 — the original mouth-interior placement read as branding the prisoner's
    face and was moved).
  - `lockParts: [knellBindL, knellBindR]` — the two chain-BIND restraints on the
    clapper's wrist cuffs (iron, not the person). The bound figure
    (`knellFigure`/`clapperHead`) is deliberately unpaintable.
  - Reachable cap: wound(virtual) + 2 binds = 3 targets × stackMax 2 = **6 = tier cap**
    (the shipped set is tighter than the original spec's `lipCrack`+2 chainlinks+`bellMouth`
    = 8; a deliberate, in-lane, prisoner-clear choice).
- **Fair windows:** the swing extremes (turnarounds) and the post-toll recoil beat.
- **The ONE new rule — RESONANT RELEASE (§CP1 corrected):** the release tell is the
  boss's own TOLL (bell + ring-wall + shake). ⚠ Music being dead (`musicDies`) does
  NOT null the beat clock — `musicKill` only mutes the bus; `getBeatClock()` stays
  live, so the generic `beatOn` here is a silent, illegible coin-flip. The fix:
  def-gated on `musicDies`, `ctx.beatOn` is keyed to the real toll edge (leading:
  `chargeT ≤ beatWindow`; trailing: within `beatWindow` of the last attack toll), and
  the grid-aligned cap fuse is suppressed. `def.bpm` is inert legacy data (nothing
  reads it) — the toll cadence lives in the phrase gaps. A MANUAL loose ON the toll is
  the perfect release: ×1.25 inside the clamp + SCAR-BURN. You dodge on the toll, you
  strike on the toll.
- **P5** (The Last Toll, not P4 — the def has 5 phases) is the survival card: sealed,
  zero lance. (PR2a fix: a held lock during the seal no longer leaks rider chip into
  the clapper-resolve seam — §CP2 `e.part == null` gate.)
- **Utility math (live 5-phase def, spans 144/72/72/72/120, card timers 24/26/24/26/30):**
  full on-tell set volley ≈ 14.4 / 7.2 / 7.2 / 7.2 / 12.0 (ROI-clamped); burn frac 0.25 ⇒
  +25% of the clamped volley (≈+2.5% of a phase). Not-a-phase-deleter worst margin
  ≈ **1.25 (P2 and P4, the tightest; P3 is 1.35)** — passing, ~22% thinner than the doc's
  earlier fiction (computed on a dead 4-phase def). ⚠ This margin certifies the
  CALIBRATED-HUMAN model (`REALISTIC_PER_PIP 1.35`); the runtime has no per-release
  cooldown, so a TAS-limit burnFloor-per-toll could exceed it — a hard bound would need a
  burn ICD (owner-level, deferred, §CP2 SHOULD-FIX-4). Human play is gated by the toll
  cadence + the 0.24s window. From 0% (V1-only) today.

**Rung 11 — WEFTWITCH (she re-weaves what you break).** *The volley gets a JOB.*
**AS SHIPPED (organs + SCAR-BURN increment; the rule follows) — corrected against the
live code by the §CP1 pre-audit, which found the original spec wrong twice over.**
- **Organs (verified `tests/weftorgans.mjs`):** `lockParts: [palmL, palmR]` — her two
  weaving HANDS (her §4b face AND her weapons; the real nodes are `palmL`/`palmR` on
  `handPivotL/R`, NOT "spinneret-arm tips" — the original prose was wrong). `loomHeart`
  stays the V1 anchor (paintable on a V2 boss). loomHeart(virtual) + 2 palms = 3 targets
  × stackMax 2 = **6 = cap** (the KNELLGRAVE shape). ⚠ `weftScar` is NOT a lock organ:
  the anti-spider "no limb below horizontal" law puts the whole crown above `laneMaxY 22`
  (weftScar world y ~24) — unaimable (the PR2a reachability LAW). If a 3rd target is ever
  wanted, the `rosette` knots (world y ~10–18, "motifs of what she's mended") beat the
  grief-wound.
- **Fair windows (§CP2 corrected):** the palms are MOVING organs — Y is safe by a wide
  margin, and their base+station-sway X stays in reach (~14/15.6), but the gaze-chase
  (flying at a palm PUSHES it away, +~3.9) and the thread-cut recoil (+~3.4) push ONE palm
  TRANSIENTLY out of reach. This is designed intermittent reach (Colossi+ moving-organ
  grammar): **loomHeart is the reliable anchor** (it sways but has no gaze/cast carrot, so
  it never dodges you), the mirror palm stays reachable, and `freshenLocks` banks the set
  over the ~9s sway cycle. So the cap-6 bank is achievable but HARDER than "plain dwell-
  painting" — a preview/playtest judges the FEEL. The THREAD-CUT stagger (parry ambers 3×
  → loom stilled) is a bonus paint window (but `quietDwellMult` slows dwell there, and the
  cut recoil throws the near palm out — paint loomHeart + the far palm during it). NOT
  parry-locked — the amber floor (CI-guaranteed ≤12s/phase) supplies enough amber.
- **⚠ PREVIEW NOTE (§CP2 S2 — the amber-vocabulary read):** the brand shimmer + marker +
  tether land on her HANDS, which are also her §4b face AND the amber charge-tell carrier
  (the taut thread flashes amber between them). MARROWCOIL teaches "its amber guards it —
  parry to brand"; on WEFTWITCH the identical amber read guards nothing (her palms never
  `amberVent`). Not a correctness bug (colours are role-separated; no meter/double-dip),
  but a taught-vocabulary + legibility stack the human must judge on the preview. If it
  reads badly, PR4b's amber-tagging is the natural place to wire the vent.
- **The burn tell:** her music is LIVE (`musicDies` is KNELLGRAVE-only), so the perfect
  release is the normal on-beat tap (`getBeatClock`, unchanged) — her stitch-pluck already
  lands on that grid. SCAR-BURN is a ONE-LINE add (`fracBySlot.weftwitch 0.30`).
- **THE ONE NEW RULE — SHIPPED (PR4b): THE VOLLEY TEARS, SHE MENDS.** (The original "a
  volley INTERRUPTS her mend" was UNIMPLEMENTABLE — no mid-phase mend exists; `restitchWeb`
  fires only at phase seams, cosmetically, and the Surge-fork auto-looses there. Inverted.)
  A DELIBERATE ≥`burnFloor`-pip release (a manual tap OR the cap auto-loose — never a decay
  fizzle or the Surge `fork`) TEARS a web sector (`restitchWeb`, cosmetic) → she stops to
  re-weave it → a ~2.5s mid-phase MEND window (the shared `staggerT` the `def.threadCut`
  consumer drains). "She mends what you break" made playable; her identity beat plays MORE.
  Guards (all shipped + tested `weftmend.mjs`): ONCE/phase; the trigger keeps live ambers
  alive (deleting them stays parry's verb) but WIPES queued `pending` so the window is quiet;
  the thread-cut bank now carries a `staggerT<=0` guard so a mend can't chain a thread-cut.
  Her hands keep WEAVING through the mend (no stillness freeze) — moving organs, so the
  window's reliable paint is the loomHeart anchor, NOT a free 6-cap buffet (§CP1 PR4b).
  ⚠ **P5 BALANCE — a HARD owner GO gate:** the mend is a free once/phase paint window, and
  her P5 not-a-phase-deleter margin is the thinnest in the endgame (~1.08). The static model
  cannot see windows (the `REALISTIC_PER_PIP` calibrated-human caveat IS the margin here), so
  the P5 dread-card playthrough is a required pre-merge sign-off. If it plays under the line,
  the dials in order: hands-work-harder, window 2.5→1.8s, once/FIGHT — never the ROI/burn
  numbers. (NB the dead-config `quietDwellMult` is NOT a brake — it is wired to nothing.)
- **DEFERRED to PR4c (its own gate):** V4 parry-snap — her `aimed` is 3 real bullets (not a
  beam), but they fire from the loom, so the HONEST wiring spawns the side bullets FROM her
  hands (`palmL`/loom/`palmR`, count unchanged) + vents the palms amber (resolving the S2
  amber-vocabulary note), NOT a dishonest palm-tag on loom-fired bullets and NOT `emitOrigins`
  (6 bullets). Her palms are already dwell-paintable, so parry-snap is a bonus, not required.
- **Utility math:** spans 114/114/114/94/83 → volley clamps to ~10% everywhere; on-beat
  burn frac 0.30 ⇒ +~3% per full-set release. ⚠ Her P5 is the thinnest endgame not-a-phase-
  deleter margin (~1.08) — a named GO gate (headless persona + a real dread-card playthrough
  before the rule ships). From ~0% (V1-only) today.

**Rung 12 — ONEWING (the fled twin; it mirrors your last dodge).** *The Eitherwing
payoff.* The player painted this exact eye at rung 5.
- **Organs (all already named in `bossOnewing.js`):** `onewingEye` (the surviving
  shared eye — big, central), `frameRim` (the dead twin's frame fused as the hole
  in its chest — a worn wound/relic), `snappedThread` (the severed bead-thread —
  its registry glow-shape claim, the scar). Reachable: 3×2 = 6 = cap ✓.
- **Fair windows:** the RUBATO's held wind-ups and denied downbeats are long
  telegraphs = paint windows; the eye is the easy anchor; the ghost volley's
  ambers (already parryable per `ghostHalf`) are the V4 snap route onto the frame.
- **The ONE new rule — THE ECHO-PIP (SPECTRAL, revised per feasibility §8B):**
  branding the LIVING eye also lays a spectral twin pip on the fused frame
  (ghost-pale `ghostColor` marker, no dwell cost, renders its own brand — no
  phantom pips). Two halves of the broken whole, made lance grammar: your pips
  arrive in pairs. BUT the ghost is spectral — it strikes at **0.5× damage
  (`echoDmgMult`), leaves NO scar/burn, and does not count toward `burnFloor`** —
  because a free full-strength ghost per paint doubles throughput and, combined
  with on-tell partial releases, turns ONEWING's smaller late phases into a
  phase-deleter (the balance snag §8B/§8C catches). "The dead twin answers, but
  lighter." Coupling: breaking the fused frame (the existing trade — removes the
  ghost volley but ENRAGES tempo) also kills the echo anchor (`dropLockPart`);
  keeping the ghost alive keeps the extra (half-strength) pips. A real strategic
  choice, both ways honest.
- **Narration (owner: "won't be obvious without some narration"):** every time an
  eye-mark echoes, a paler twin mark lights on the dead twin's frame with a brief
  connecting pulse so the pairing reads; plus two one-time hint lines in the game's
  existing lock-teach idiom — "THE DEAD TWIN ANSWERS / YOUR FIRST MARK ECHOES ONTO
  ITS FRAME" on the first echo, and "ONLY THE FIRST MARK ECHOES" the instant a
  second mark does not echo (new `saveData.flags.echoTaught` gate alongside
  `lockTaught`/`snapTaught`).
- **Utility math (CORRECTED against the live def — the old ~119/119/119/97/86 was stale;
  P2's atFrac moved 0.78→0.86, so P1 is a thin 76-HP phase):** spans **76/162/119/97/86**,
  deleter margins **1.13 / 1.94 / 1.42 / 1.11 / 1.04** (burnFrac 0.30; the echo, not the burn,
  is the escalation — at 0.35 the P5 full-release hit exactly 1.00). ⚠ P5/P4/P1 owner-playtest GO.
  Old note: spans ~119/119/119/97/86 → clamped volley ≈ 10%, +burn ~15% on
  a full on-tell set; echoes reach cap faster but at half strength, so the phase
  stays above its card timer (§8C). From 0% today.

**Rung 13 — EMBERTIDE (a wall of light; the read is the BEAM DUEL).** *Paint the
darkness; feed the beam.* Formally retires the stale "slot 13 lockMuted" intent.
- **Organs — the dark negative-relief features surfacing in the bright field**
  (the sanctioned value-inversion, now applied to the lance: jade brands pinned
  as dark-halo marks in light): `eyeHollow0`, `eyeHollow1`, `mouthNotch`, and
  `leashNotch` (the lore scar that points at slot 14; branding it is the player
  touching the lore web) — **all four already exist as named nodes in the model,
  plus `faceRig`; no new empties needed** (feasibility §1e/§8F). `virtualLockOrgan:
  'faceRig'`. Reachable: (4+1)×2 = 10 ≥ 6 ✓.
- **Fair windows:** the face-relief organs are live only while the face is
  SURFACED — the rung-8 `eyeOrgan` surfacing-gate pattern generalized to a list
  (`surfaceOrgans`). Reuse, not a new rule. The leashNotch rides crest passes.
- **The ONE new rule — THE FORK IS A WEAPON:** the V3 Surge fork
  (`consumeAllLocks`) gains a def-gated consumer: pips forked into a Surge while
  the BEAM DUEL is armed (Surge ≥50%, `beamDuel`) each extend the duel window
  (+0.35s/pip; 6 pips ≈ +2.1s) — the banked brands are ammunition for the fight's
  signature mechanic. The lance's job on 13: bank a full set BEFORE the crest
  rises, then choose — loose the volley into the face (clamped ~10% chip, NO burn)
  or fork it into the beam (spectacle + duel time). Boundary honesty (audit ED-8):
  the beam duel remains a SURGE mechanic; the lance feeds it, never replaces it.
  (CP1 correction: NO burn — config is right, the "chip + burn" wording above was
  stale; the fork-extend IS 13's escalation, as ONEWING's echo was 12's. And the
  organs are STATION-SPACE proxies, not the sky-face nodes — skyReplace reparents
  the rig out of partWorldPos's reach and the face sits at world-Y 150+; §CP1.)
- **Utility math:** spans 110/121/121/110/88 (verified live) → clamped volley ≈ 10%,
  no burn; the fork-extend adds duel TIME not damage (invisible to lockdpsCore).
  Deleter margins 1.6-2.3 (comfortable). P5 (Horizon Break) is survival — sealed,
  honest zero (the survival card → lockDeflected; the duel refuses to arm there).

### Band 5 — THE APEX: the lance's showcase

**Rung 14 — THE UNMASKED (quotes every pattern era; wears every scar as a relic).**
*The lance quotes every ORGAN era.* Zero new lance rules — like the boss's zero
new attack ids, the finale is the tested vocabulary at full power. The def
already declares the intent ("the ~20 eyes (STAGE 2) become per-eye lock parts at
CP2"); this plan is that CP2, shaped.

- **Stage 1 — the eclipse disc (phases:[0]):** the Sentinel quote. V1 aim on
  `focalEye` through the lid; two paintable wound organs on the crack seams
  (`crackSeamL`/`crackSeamR` empties on the named `crackSeams` geometry),
  paintable during post-string exposure — rungs 1–2 and 4 replayed at sky scale.
  Reachable (2+1)×2 = 6 ✓.
- **Stage 2 — the seraph (phases:[1]):** the constellation + the reliquary.
  - Six curated **watcher eyes** among the ~20 (`wingEye0..5` anchor empties at
    authored, mirrored positions across the six wings — the eye meshes are merged,
    so anchors are required anyway; curation bounds shimmer, §5). The EITHERWING
    moving-eye lesson at ×6.
  - The five **relics** wired to the wing-roots — `relicHorn` (Voidmaw),
    `relicBlade` (Ashtalon), `relicLink` (Brineholm's chain-maker),
    `relicSpool` (Weftwitch), `relicShard` (Knellgrave) — the KARNVOW trophy
    lesson quoted at the top of the lore web. Branding a relic flashes that
    boss's palette + a one-note quote of its theme (pure presentation).
  - **THE RECKONING (collection mechanic, presentation + economy — retuned per
    owner to ~1/3, §8D):** brand all five relics at least once during stage 2 →
    THE RECKONING *unlocks* the finale burn: stage 3's on-tell releases go from NO
    burn to `scarBurnFrac` **0.20** (not the old 1.0 — that made the perfect-lance
    player ~52% of clear pace; 0.20 lands ~31.5%, a hair under a third by design).
    Every eye across the wings snaps to the player when the fifth relic takes — the
    reveal-hold screenshot, earned by the lance. The finale still owns the biggest
    RAW numbers in the game (the huge form-bar makes its volleys the largest
    anywhere); its "peak" feel is spectacle + absolute size, not a dominating share.
- **Stage 3 — the unveiling (phases:[2]):** everything converges: `starEye`, the
  `halo` anchor, `wingRootL`/`wingRootR` relic-root empties. On-tell releases
  into the unveiled core (post-RECKONING, burning at frac 0.20) are the game's
  peak lance expression.
- **Fair windows:** stage rhythm is the roster's most SPACIOUS (the medley's
  stillness — restLo 1.2–2.7s); eyes track with lag and are caught at wing-idle
  turnarounds; relics are fixed at wing-roots (easy); the survival honesty rules
  apply during transitions (shield → sealed shimmer).
- **Utility math (the headline):** `formLifebars` ⇒ `currentPhaseHp()` returns the
  full 240 form bar, so the ROI ceiling is 24 and **the clamp never bites at the
  finale** — the lance is purely skill-limited. Base full set 12 (5% of a form),
  on-beat 15 (6.25%), and post-RECKONING an on-tell release burns at frac 0.20 →
  +3 burn = 18 (**7.5% of a form bar per volley**); across the fight that is
  ~31.5% of clear pace (~1/3, the owner's target — §8D), NOT the ~52% the old
  frac 1.0 produced. At boss 4 a volley was 6 HP (2% of hpMax); at the finale an
  on-tell volley is 18 HP into the largest bars in the game. The system the player
  has mastered for thirteen fights is, at last, loud — without dominating.

---

## 4. The economy escalation — how chip learns to bite

### 4a. What stays LAW, untouched

- `volleyRoiFrac` 0.10 — **the base-volley clamp is NOT changed.** Every base
  and beat volley still obeys `volley ≤ 0.10 × phaseHp`; both existing lockdps
  invariants stay green as written.
- `capByTier {1:0, 2:3, 3:5, 4:6, 5:6}` — unchanged. The Tier-4/5 cap of 6 stops
  being paper the moment §3 gives those bosses organs. **New companion rule
  (add as a test): REACHABILITY LAW — every tier ≥4 boss must reach its full tier
  cap in at least one phase** (`peakCap === tierCap`), so the ladder can never
  silently regress into paper again.
- `dwellTime`, `stackMax`, `capFuse`, `beatMult`-inside-the-clamp, `lanceDmg` 2.0,
  fan bearings — unchanged.

### 4b. The ONE new law — SCAR-BURN ⚠ (owner sign-off required)

> **OWNER DECISION (2026-07-10, REVISED — supersedes the "perfect full-cap"
> framing; see feasibility §8A for the full derivation): the burn is earned by a
> DELIBERATE MANUAL loose fired ON the boss's tell (the toll, the crest, the beat),
> at WHATEVER charge you are holding above a floor of `burnFloor` (3) painted pips.**
> You choose: fire a partial charge on the tell to get the burn, or bank longer for
> a bigger plain volley that AUTO-FIRES with no burn (the safe fallback). The
> boss's tell — not your charge state — drives the timing, so the window is as wide
> as the player wants. This fixes the owner's objection that a "full-cap perfect
> release" is a razor-thin ~1s window AND that the beat-aligned cap auto-release
> already lands on-beat for free (it would un-earn the burn). The burn fraction
> still RAMPS by boss; the big payoff stays at the finale.

> **`scarBurn: { minTier: 4, onTellOnly: true, burnFloor: 3, echoDmgMult: 0.5, dur: 3.0, fracBySlot: { knellgrave: 0.25, weftwitch: 0.30, onewing: 0.35, embertide: /* via beam fork — no burn */, unmasked: 0.20 } }`**
> — a manual ON-TELL loose of ≥ `burnFloor` pips on a tier ≥4 boss leaves burning
> brands on the struck organs: an extra `frac × volleyTotal` paid over `dur`
> seconds as visible burn ticks (reuse the crack-tick presentation channel; damage
> on scheduled frames). The cap AUTO-release never burns; a non-tell loose is
> today's plain volley. (`onTellOnly` means "fired on the tell," NOT "full cap.")

Why this shape:
- **The reward tracks the difficulty of the timing** (owner directive). The
  window that triggers the burn is each boss's signature tell — KNELLGRAVE's toll
  beat, WEFTWITCH's re-weave, the finale's RECKONING. Harder tell → bigger burn.
  The opener asks for an easy-ish on-beat and pays ~+2.5% of a phase; the finale
  the showcase number.
- **It reuses an existing release path** (the manual `tap`/`requestLoose` seam) —
  it is actually LESS code, not a new subsystem (feasibility §8A).
- **It is additive and band-gated.** Tiers 1–3 are byte-identical — the shipped
  mid-game balance (bosses 4–9) does not move at all.
- **It preserves the ROI LAW instead of raising it.** The instantaneous volley
  still clamps at 10%; the burn is bounded per-boss (frac 0.20–0.35 across the
  endgame, ≤+~15% of a phase on a full-set on-tell release, scaling DOWN for
  partial releases). Per-pip damage stays capped, so spamming small on-tell
  releases yields the SAME damage-per-second as banking big — no runaway (§8A/§8C).
  New invariant for `lockdpsCore`/`tests/lockdps.mjs`: `burn ≤ scarBurn.frac(boss)
  × volley` and `volley + burn ≤ (1 + frac) × roiCeil`.
- **It rewards exactly the thing the endgame organs enable** — full sets loosed on
  the beat — so mastery (complete the set, release on the tell) is what grows, not
  raw numbers. A player who ignores timing sees no change from today.
- **Fiction-true:** the game's verb is BRANDING; at World-Ender tier the brands
  finally scar. "The lance bites" is a picture, not a tooltip.
- Rejected alternatives, for the record: a tiered `volleyRoiFracByTier`
  (raises the LAW itself and barely moves outcomes — at 6×2.0=12 raw, most Tier-4
  ceilings only pinch small phases); per-tier `lanceDmg` (touches every path
  incl. the fork, harder to reason about); an endgame stack raise to 3 (dead knob
  — cap 6 already binds first).

### 4c. Sustained-DPS sanity check

Full-cap cycle = 6×(dwell 0.35 + paintCooldown 0.22) + capFuse 1.0 ≈ 4.4 s ideal,
~7–8 s realistic under fire (dodging between paints; `volleyCadence` in
`lockdpsCore` models the ideal). A perfect Tier-4 cycle therefore lands ~15% of a
phase every ~7.5 s ⇒ ≈2%/s of a phase. Against card timers of 26–34 s/phase, a
skilled lance player contributes roughly a third of the clear pace — a genuinely
helpful DPS channel, nowhere near a phase-deleter, and entirely optional (rider
chip + parry + Surge still clear inside the timers with lance untouched).
Pure-lance volleys-to-clear stays inside the test's sane band (e.g. KNELLGRAVE
≈ 42 volleys ∈ [20,130]).

### 4d. The Apex exception, stated loudly ⚠

On a `formLifebars` boss, `currentPhaseHp()` returns the FULL form bar (240), so
the ROI ceiling (24) exceeds any raw volley (≤15 on-beat) — **the clamp never
bites at the finale by construction.** This is an existing property of the
shipped code, not a change; this plan treats it as the intended crescendo and
adds THE RECKONING on top (RETUNED to ~1/3 per owner, §8D): branding all five
relics UNLOCKS the stage-3 burn from NONE to `scarBurnFrac` **0.20** (on-tell
release = 15 + 3 burn = 18 = 7.5%/form-bar), landing the perfect-lance player at
~31.5% of clear pace — a hair under a third, so the finale never creeps up.
Sign-off should confirm both halves (the quirk-as-feature and the 0.20 unlock).

### 4e. The resulting trajectory (full-set ON-TELL release, % of current phase)

```
boss    1-3   4    5    6     7    8     9    10      11      12      13     14
now     0*    6%   5.4% 10%   5%   9%    9%   0       0       0       0      0
plan    0*    6%   5.4% 10%   5%   9%    9%   12.5%   13%     13.5%†  ‡      9.4→12.5%(form)
```
\* V1 utility only (rate +15%, exposure ticks). Endgame numbers are the PERFECT
full-cap release (a sloppy release stays at today's plain clamp — no burn). The
burn RAMPS by difficulty (owner directive): opener +2.5% → 12,13 higher →
finale RECKONING the showcase. † reached faster via SPECTRAL echo-pips (half
damage, no scar — §8B). ‡ EMBERTIDE
converts pips into beam-duel seconds via the fork rather than a burn volley. A
curve that now rises to the finale instead of cresting at boss 6 — and only for
players who earn the timing.

### 4f. Audiovisual escalation ⚠ (OWNER REQUIREMENT, 2026-07-10)

The owner's directive, verbatim: *"make appropriate visual and sound to mark these
as different — they should be meaningfully different in the sense that it looks more
powerful and sounds that way."* This is a HARD gate, not polish: a new lance tier
that does more damage but reads/sounds like the old volley is NOT shippable. Each
escalation rung must be legibly, audibly bigger than the one before it.

- **Plain volley (bosses 4–9, unchanged):** the shipped jade wisps + `sfxLance2`
  release. This is the BASELINE the endgame must visibly out-class.
- **A PERFECT release (on-tell):** already distinct today (the on-beat snap/juice)
  — the endgame keeps this as the "you nailed it" read and builds on it.
- **SCAR-BURN (tier ≥4, earned):** the struck organ keeps a burning brand —
  hotter/whiter core, a lingering ember plume + heat-shimmer on the mark, and a
  layered burn SFX (a searing sustain under the impact, not just a louder ping).
  The wisps themselves read heavier (thicker/hotter ribbon) so the volley LOOKS
  like it will leave a scar before it lands. It must be unmistakable that this hit
  is doing more than a normal one.
- **THE RECKONING (finale showcase):** the top of the ladder — the biggest, most
  overdriven version (all five relic-brands igniting at once, a screen-scale
  release beat, the fullest SFX stack). It should feel like the payoff the whole
  run's lance practice was building toward.

Constraints on the spectacle: honor §2's overdraw cliff (ember plume = thin
line/point-class FX + bloom, never a big additive shell), and keep the SFX in the
existing `sfxLance*` family so it reads as the SAME weapon grown up, not a new one.
The audiovisual step is a named deliverable in every endgame boss's PR, gated at
review — a damage change without the matching look/sound is incomplete.

---

## 5. Organ selection rules (reaffirmed + extended)

Rules 1–8 from the 2026-07-08 doc are incorporated unchanged (organs/wounds/
emitters/bindings/trophies, never hull; visible from the 30 m rail camera; fair
acquisition window; focal-first; destructible ⇒ leaves `paintableParts()`;
per-part sealing over whole-layer; never mandatory; cap follows authored target
count). New rules introduced by this plan:

9. **Negative-relief organs are legal on a value-inverted boss** (EMBERTIDE): the
   brandable thing may be a DARKNESS in light; the brand mark must then carry a
   dark halo so it reads against the bright field (verify via the lens/bullet
   visibility tooling, L-2026-07-10 lens lesson).
10. **Surfacing-gated organs must use the liveness/seal seam** (`eyeOrgan` →
    generalized `surfaceOrgans`) — sealed honesty (ashen shimmer), never a silent
    dwell that can't complete.
11. **Granted pips always render their own brand marker** (echo-pips, parry
    snaps): a pip without a marker is a phantom (the `paintFromParry` type-guard
    lesson). Echo anchors die with their part (`dropLockPart`).
12. **Constellation sets are CURATED:** when the anatomy shows many of a kind
    (~20 eyes), lockable organs are an authored, mirrored subset (≤6–8), placed
    as named empties; and the organ SHIMMER budget is capped at ~6 concurrent
    breathes (nearest-unpainted priority) — shimmer is additive overlay and §2's
    overdraw cliff is the one real perf axis here.
13. **Some anatomy is honorably unpaintable:** bound prisoners (KNELLGRAVE's
    clapper figure) and the empty trophy hook (KARNVOW) stay cold-reticle by
    design; if the player lines them up, the reticle's refusal is itself lore.
14. **REACHABILITY LAW (testable):** every tier ≥4 boss reaches its full tier cap
    in at least one phase. No more paper ceilings.

All new organ targets are **named empty `Object3D`s** — zero triangles, zero
draws (the EITHERWING marker precedent: "byte-neutral metadata; model + tricount
unchanged").

---

## 6. Rollout plan — coexist → prove on a hero → migrate

Every increment is def-gated data + one consumer; a def without the new field is
byte-identical (the established LOCK pattern: "neutral at rung 0"). No shipped
boss's balance moves except where this doc says so.

> **THE FABLE CRITIC GATE (standing rule — owner directive 2026-07-10).** Every PR
> in this rollout passes an ADVERSARIAL Fable review at two checkpoints, in the
> repo's BOSS-DESIGN §3b gate tradition — a HARSH critic whose job is to find the
> flaw, not to approve:
> - **CP1 — pre-build design critique (BEFORE writing code):** the mechanic/design
>   approach is handed to a Fable critic to attack — does it fight an existing
>   system, is the causality sound, does it honor the boss's one read, what's the
>   balance/fairness/perf risk, what's the anti-read. Code is not written until the
>   named flaws are answered.
> - **CP2 — pre-commit critique (AFTER implementation + green gates):** the diff is
>   handed to a Fable critic to attack — correctness, coexist-safety, the
>   byte-identical claim for untouched bosses, hidden regressions, and whether it
>   actually delivers the intended feel (not just passes tests). Findings are fixed
>   or explicitly dispositioned before commit/merge.
> The human owner remains the FINAL gate for any LAW change (SCAR-BURN, cap/ROI).
> The critic advises; it does not approve on the owner's behalf.

> **LIVE STATUS (2026-07-10).** PR0 ✅. PR2a (KNELLGRAVE organs) ✅ merged #349.
> PR2b/PR3 (KNELLGRAVE resonant on-toll release + SCAR-BURN + PR2a blocker fixes)
> ✅ merged #355. PR4a (WEFTWITCH organs + SCAR-BURN) ✅ merged #356. PR4b
> (WEFTWITCH's "THE VOLLEY TEARS, SHE MENDS" rule) ✅ merged #360. Lock-organ COMFORT
> pass (WEFTWITCH palms + placeGroup wander/wobble dials; the new 10.4 comfort LAW —
> "reachable ≠ comfortable") ✅ #363 (owner-playtested GOOD). **NOW BUILDING: ONEWING
> (rung 12) — the INVERTED spectral echo: dwell the DEAD frame (`frameGroup` +
> `frameRoot`), the FIRST mark on each grants a half-strength GHOST pip on the
> out-of-lane living eye (`echoTarget`), "pips arrive in pairs" (2 ghosts, cap→6).
> Owner picks: 2 ghosts + HONEST SACRIFICE. ✅ merged #365 (CP2-cleared: Surge-fork
> ghost-halving, parry-snap exclusion, felled-break gate, candidate delist). **NOW
> BUILDING: EMBERTIDE (rung 13) — the beam duel.** CP1 RE-SPEC (plan unbuildable):
> EMBERTIDE is `skyReplace`, so enterFight REPARENTS the rig → `partWorldPos` returns
> null for every face node (silently-dead lance), and the sky-face sits at world-Y
> 150+/|x| 90-420 (camera-locked, no dial reaches it). BUILD: 3 STATION-SPACE proxy
> organs on `group` (`eyeMarkL/R`, `mouthMark`, in-lane/comfort-legal) + `crestPivot`
> V1 anchor; the model draws the dark-halo brand ON the sky-face node
> (`setBrandedFeatures`). DROP the surfacing-gate (face never submerges → dead code).
> The ONE rule — THE FORK IS A WEAPON: pips forked while the beam duel is armed extend
> it (+0.35s/pip; adds TIME not damage → invisible to lockdpsCore). NO burn (config
> right, doc line stale — the fork-extend is 13's escalation). Tests DRIVE the
> post-reparent live fight (a naive test greens on a dead lance). ⚠ owner-playtest:
> the aim-in-lane/brand-on-face read + the auto-armed duel timing. CP2 diff critic pending.**
> V4 WEFTWITCH parry-snap → PR4c (deferred). Then
> PR7 THE UNMASKED → PR8 mid-ladder polish → PR9 elemental loadout.
> **Standing process: every rung gets a CP1 pre-audit + a CP2 diff critic (owner
> directive); the human owner is the final gate on any damage LAW.**
> **Learned in PR2a (a reachability LAW for every remaining boss): an organ is
> only lockable if its WORLD Y ≤ `laneMaxY` (22) across its whole animation — the
> aim cone tests player-Y vs organ-Y, and the static `lockdpsCore` model has no
> camera, so it will call an unreachable organ "capable." High/overhead bosses
> (the World-Enders trend big + high) must place anchors DOWN in the lane; verify
> per boss in the real engine (`tests/knellorgans.mjs` is the template — sample
> the full animation and assert the MAX y, not one frame).**

- **PR0 — re-green the gate (housekeeping, blocking). ✅ DONE (commit `36b754d`).**
  `tests/lockdps.mjs` asserted KARNVOW lance-inert but KARNVOW now has trophy
  lockParts; the assertion was corrected (KARNVOW → capable; ASHTALON remains the
  named V1-only example). Baseline `node tools/lockdps.mjs --ci` green.
- **PR1 — the ladder is data.** This doc lands; add `lockRole` to every def
  (`v1Teach | v1Pressure | v1Mover | paintTeach | sweepExam | movingSet |
  destructible | timingException | splitEcology | parrySnap | resonant |
  interrupt | echo | forkFeed | apexLedger`) + a progression test that walks
  `BOSS_ORDER` asserting: V1 before paint; first paint ≤3 targets; the
  REACHABILITY LAW for tiers ≥4 (will be RED-as-TODO for 10–14 until their PRs —
  land it `.skip`-annotated per slot and un-skip as each ships, so the ladder is
  enforced ratchet-style). No behavior.
- **PR2a — HERO: KNELLGRAVE organs. ✅ MERGED (PR #349).** wound(virtual) + 2 bind
  restraints on the clapper cuffs → cap 6, 53 volleys-in-band; the bound prisoner
  stays unpaintable. Regression guard `tests/knellorgans.mjs`. An endgame boss
  gains real lance utility, purely additively.
- **PR2b / PR3 — KNELLGRAVE resonant on-toll release + SCAR-BURN. ⏳ IN PROGRESS.**
  (a) The toll-beat seam: KNELLGRAVE's music is dead (`musicDies` → `getBeatClock`
  null), so `ctx.beatOn` is fed from the toll clock (def-gated) — a manual release
  landing ON the toll is the perfect/resonant release. (b) SCAR-BURN config knob
  (`minTier: 4`, so tiers 1–3 byte-identical) + the `lockLayer`/boss burn-tick
  seam: an on-tell (perfect) partial release of ≥`burnFloor` pips leaves a burn =
  `frac × volley` over `dur`; the cap auto-release never burns; deflect pauses the
  burn (the one-deflect rule). Extend `lockdpsCore` + `tests/lockdps.mjs` with the
  burn invariant (intentional test update, flagged in the PR body). Distinct hotter
  audiovisual read (§4f). ⚠ owner sign-off on the burn LAW before merge. *Gates:
  lockdps bands + burn invariant, lock.mjs, boss.mjs, knellorgans, tricount.*
- **PR4 — WEFTWITCH.** Hand/scar organs + mend-interrupt consumer in her
  re-weave controller. *Extra gate: the interrupt must never fire during the
  survival-critical mends if any are authored as guaranteed — review with her
  phase table.*
- **PR5 — ONEWING.** Organs (already-named nodes) + echo-pip rule +
  frame-break↔echo coupling.
- **PR6 — EMBERTIDE.** Relief-organ empties + `surfaceOrgans` gating (generalize
  the BRINEHOLM seam) + fork→beam consumer. ⚠ owner sign-off (Surge-ladder
  boundary). Retire the `lockMuted (slot 13)` comment in the same PR.
- **PR7 — THE UNMASKED.** Stage-gated lockParts (`phases:[0]/[1]/[2]`), wing-eye
  + relic anchors, shimmer budget, THE RECKONING. Aligns with the def's own CP2
  note. This is the biggest PR; if the relic system (model line ~621, planned
  destructible relics) hasn't landed yet, split: eyes first, relics+RECKONING
  ride the relic PR.
- **PR8 — mid-ladder polish.** MARROWCOIL P1 rib gating; THRUMSWARM
  `decayPauseWhileHidden`; KARNVOW snap-attribution. Small, independent.
- **PR9 — ELEMENTAL LOADOUT (owner design-direction, §8E; Phase-2).** A per-dragon
  `lanceEffect` field beside the existing `lanceTint`/`lanceRune` (today cosmetic
  only), unlocked at a dragon's Eternal/top form via the existing grind economy.
  Ship three: **Standard** (universal on-tell burst — what the free Azure Drake
  and every un-ascended dragon flies), **Ember** (the SCAR-BURN reframed as the
  DOT element's signature), **Frost** (a short boss-slow — the one Yellow-risk
  item: needs a new boss-tempo hook). Element = a build choice at the roost;
  per-boss organs + on-tell timing stay the in-fight skill (clean division of
  labor, no added in-fight complexity). ⚠ Gated on Standard passing the reformed
  not-a-phase-deleter invariant AND a new **iso-budget** per-element invariant
  (§8E): every element delivers the SAME total on-tell budget as Standard —
  reshaped in time or traded for utility, never more raw damage — and the free
  starter on Standard must clear the entire game. Grinding buys STRATEGY, never
  power; progression never sits behind a purchase. Comes AFTER the per-boss ladder
  is built and proven.

Per-PR verification, always: `tests/lockdps.mjs`, `tests/lock.mjs`,
`tests/boss.mjs`, `node tools/lockdps.mjs --ci`, `tricount`, `tiershots`; feel is
judged by the human on the PR preview (CLAUDE.md rule 4). Each PR adds its
`leapfrog/lessons/` file.

---

## 7. Risks & open questions

- **Perf / overdraw (§2 — THE cliff):** organ markers are empties (free); the
  risk is presentation — shimmer overlays and tether lines on many-organ bosses.
  Mitigations: shimmer budget ≤6 concurrent (rule 12); tethers/ribbons are
  line-class (exempt); burn ticks reuse the existing crack-tick FX. Verify on the
  UNMASKED stage 2 with a real-phone pass before PR7 merges.
- **Fairness:** the lance stays optional everywhere — no phase requires pips to
  progress; kill-timers and lance-free winnability untouched (the sim gates
  already drive Surge-only kills). The mend-interrupt (11) and fork-feed (13) are
  accelerants, never keys.
- **Puzzle-read collision (the biggest design risk):** each endgame rule was
  chosen to ride the fight's ONE read — toll rhythm (10), the re-weave (11), the
  twin-mirror (12), the beam duel (13). Review each hero PR against §5b
  principle 5 explicitly; if any lance rule starts reading as a second puzzle,
  cut the rule before cutting the organs.
- **KNELLGRAVE beat source:** `musicDies` means `getBeatClock()` may be silent;
  the toll-clock seam is new plumbing. Fallback if it fights us: judge resonance
  at the boss seam by toll-ring passage instead of the music clock.
- **Static model drift:** `lockdpsCore` doesn't model burn, echo-pips, or
  fork-feed. PR3/PR5/PR6 must extend the core (and its tests) in the same PR as
  the mechanic, or the balance tool silently under-reports the endgame lance.
- **`formLifebars` ROI quirk (§4d):** confirm the finale's clamp-free volleys are
  intended (recommended: yes — it IS the crescendo).
- **Thin-margin phases (measure in-game, §8C):** WEFTWITCH P5 (~1.08×) and
  ONEWING P5 (~1.04×) clear only just above their card timers under ideal
  perfect-lance play — named GO gates on PR4/PR5 (confirm with the headless
  lance-persona + a real playthrough before merge).
- **Elemental combinatorial surface (§8E):** per-dragon effects mean EVERY
  dragon × boss combo must stay in the fair band. Tamed by the iso-budget rule
  (every element = Standard's total budget, reshaped) + a new per-element
  invariant; PR9 is gated on it. Frost's boss-slow hook is the one new subsystem.
- **Owner sign-off needed on:** (1) SCAR-BURN as an on-tell PARTIAL release
  (§4b/§8A — the one new law; effective per-volley ceiling ≤+15% at T4+, and the
  invariant/test change); (2) EMBERTIDE fork→beam feed (§3 rung 13 — touches the
  Surge ladder boundary, audit ED-8) plus formally retiring the slot-13
  `lockMuted` intent; (3) ONEWING SPECTRAL echo-pip (§3 rung 12 — half-damage,
  no-scar granted pips + the narration beat) and THE RECKONING's **0.20** finale
  burn (~1/3 of clear pace, §4d/§8D); (4) the elemental/per-dragon direction as a
  Phase-2 PR9 (§8E).
- **Open lore question:** branding EMBERTIDE's `leashNotch` touches the 13→14
  leash thread — does the brand deserve a one-line note card ("EVEN THIS WAS
  LEASHED") the first time it takes? Cheap, big lore payoff; owner call.
