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
- **Organs** (all real named anatomy in `bossKnellgrave.js`, plus two byte-neutral
  empties per the EITHERWING marker precedent):
  - `lipCrack` (new empty at the candle-lit crack's terminus on the flared lip,
    y≈20, always in frame) — the WOUND, the easy anchor; the crack is the boss's
    glow-shape claim, so the brand sits on the thing the eye already reads.
  - `chainBind0`, `chainBind1` (new empties on the clapper chain's binding links,
    dangling into frame at y≈14–18) — RESTRAINTS, the Brineholm mercy grammar:
    you brand what binds the prisoner, never the prisoner. The bound figure
    (`knellFigure`/`clapperHead`) is deliberately unpaintable — if aimed at, the
    reticle stays cold (per-part honesty; "the marks will not take on the bound").
  - `virtualLockOrgan: 'bellMouth'` — V1 anchor = the muzzle (ASHTALON precedent).
  - Reachable cap: (3 lockParts + virtual) × stackMax 2 = 8 ≥ tier cap 6 ✓.
- **Fair windows:** the swing extremes (turnarounds — the proven acquisition
  shape) and the post-toll recoil beat; the lipCrack is quasi-static.
- **The ONE new rule — RESONANT RELEASE:** on this def the release beat window IS
  the toll. Music is dead here (`musicDies`), so `beatOn` is fed from the toll
  clock (`def.bpm` 60, accelerating — a small def-gated seam in boss.js). A volley
  loosed ON the toll is the perfect release: ×1.25 inside the clamp + SCAR-BURN.
  The lance thereby RIDES the fight's one read — you dodge on the beat, you
  strike on the beat.
- P4 (The Last Toll) is the survival card: sealed, honest ashen reticle, zero
  lance — unchanged, correct.
- **Utility math:** phase spans 144/120/96 → perfect full-set volley ≈ 14.4/12/9.6
  clamped, +50% burn ⇒ ~15% of each phase per toll-perfect volley. From 0% today.

**Rung 11 — WEFTWITCH (she re-weaves what you break).** *The volley gets a JOB.*
- **Organs:** `handL`, `handR` (new empties at the two working spinneret-arm
  tips — her hands are her §4b face AND her weapons; emitter = organ, §5f law 7)
  + `weftScar` (the existing named scar-stub on the broken web arm — the wound).
  `loomHeart` stays the V1 anchor (promoted paintable on a V2 boss, L183).
  Reachable: (3+1)×2 = 8 ≥ 6 ✓.
- **Fair windows:** dwell-painting her is deliberately hard (the def warns the
  loom-heart is "always emitting, never a free rest-beat paint") — so the two
  sanctioned routes are (a) the THREAD-CUT stagger (parry the taut-thread ambers
  3× → loom stilled 2.5s = the authored paint window; the fight's own parry job
  opens the lance window) and (b) V4 parry-snap off her aimed ambers directly.
- **The ONE new rule — THE VOLLEY INTERRUPTS:** when she begins stitching a safe
  lane shut (the re-weave, her anti-flee hook), the weaving hand glows; a volley
  of ≥3 pips landing during the mend CANCELS that mend and stills the loom ~1.5s.
  The lance becomes lane preservation — utility beyond the HP bar, aimed squarely
  at the thing that makes this fight hers. DPS unchanged on top (chip + burn).
- **Utility math:** spans 114/114/114/94/83 → volley clamps to ~10% everywhere;
  +burn ⇒ ~15% per full-cap release. From ~0% (V1-only) today.

**Rung 12 — ONEWING (the fled twin; it mirrors your last dodge).** *The Eitherwing
payoff.* The player painted this exact eye at rung 5.
- **Organs (all already named in `bossOnewing.js`):** `onewingEye` (the surviving
  shared eye — big, central), `frameRim` (the dead twin's frame fused as the hole
  in its chest — a worn wound/relic), `snappedThread` (the severed bead-thread —
  its registry glow-shape claim, the scar). Reachable: 3×2 = 6 = cap ✓.
- **Fair windows:** the RUBATO's held wind-ups and denied downbeats are long
  telegraphs = paint windows; the eye is the easy anchor; the ghost volley's
  ambers (already parryable per `ghostHalf`) are the V4 snap route onto the frame.
- **The ONE new rule — THE ECHO-PIP:** branding the LIVING eye also lays a
  spectral twin pip on the fused frame (ghost-pale `ghostColor` marker, no dwell
  cost, counts toward cap, renders its own brand — no phantom pips). Two halves
  of the broken whole, made lance grammar: your pips arrive in pairs, and time-to-
  cap roughly halves — the endgame generosity is the boss's own grief. Coupling:
  breaking the fused frame (the existing trade — removes the ghost volley but
  ENRAGES tempo) also kills the echo anchor (`dropLockPart`); keeping the ghost
  alive keeps your economy. A real strategic choice, both ways honest.
- **Utility math:** spans ~119/119/119/97/86 → clamped volley ≈ 10%, +burn 15%,
  reached ~2× as fast as any other Tier-4 boss. From 0% today.

**Rung 13 — EMBERTIDE (a wall of light; the read is the BEAM DUEL).** *Paint the
darkness; feed the beam.* Formally retires the stale "slot 13 lockMuted" intent.
- **Organs — the dark negative-relief features surfacing in the bright field**
  (the sanctioned value-inversion, now applied to the lance: jade brands pinned
  as dark-halo marks in light): `eyeHollowL`, `eyeHollowR` (new empties on
  `faceRig`), `mouthNotch` (named), and `leashNotch` (named — the lore scar that
  points at slot 14; branding it is the player touching the lore web).
  `virtualLockOrgan: 'faceRig'`. Reachable: (4+1)×2 = 10 ≥ 6 ✓.
- **Fair windows:** the face-relief organs are live only while the face is
  SURFACED — the rung-8 `eyeOrgan` surfacing-gate pattern generalized to a list
  (`surfaceOrgans`). Reuse, not a new rule. The leashNotch rides crest passes.
- **The ONE new rule — THE FORK IS A WEAPON:** the V3 Surge fork
  (`consumeAllLocks`) gains a def-gated consumer: pips forked into a Surge while
  the BEAM DUEL is armed (Surge ≥50%, `beamDuel`) each extend the duel window
  (+0.35s/pip; 6 pips ≈ +2.1s) — the banked brands are ammunition for the fight's
  signature mechanic. The lance's job on 13: bank a full set BEFORE the crest
  rises, then choose — loose the volley into the face (chip + burn) or fork it
  into the beam (spectacle + duel time). Boundary honesty (audit ED-8): the beam
  duel remains a SURGE mechanic; the lance feeds it, never replaces it.
- **Utility math:** spans ~110/121/121/110/88 → clamped volley ≈ 10%, +burn 15%;
  or the fork conversion. P5 (Horizon Break) is survival — sealed, honest zero.

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
  - **THE RECKONING (collection mechanic, presentation + economy):** brand all
    five relics at least once during stage 2 → stage 3's full-cap releases burn
    at `scarBurnFrac` 1.0 instead of 0.5 (§4d). Every eye across the wings snaps
    to the player when the fifth relic takes — the reveal-hold screenshot, earned
    by the lance.
- **Stage 3 — the unveiling (phases:[2]):** everything converges: `starEye`, the
  `halo` anchor, `wingRootL`/`wingRootR` relic-root empties. Full-cap on-beat
  releases into the unveiled core are the game's peak lance expression.
- **Fair windows:** stage rhythm is the roster's most SPACIOUS (the medley's
  stillness — restLo 1.2–2.7s); eyes track with lag and are caught at wing-idle
  turnarounds; relics are fixed at wing-roots (easy); the survival honesty rules
  apply during transitions (shield → sealed shimmer).
- **Utility math (the headline):** `formLifebars` ⇒ `currentPhaseHp()` returns the
  full 240 form bar, so the ROI ceiling is 24 and **the clamp never bites at the
  finale** — the lance is purely skill-limited. Base full set 12 (5% of a form),
  on-beat 15 (6.25%), +burn 22.5 (~9.4%), RECKONING-perfect 30 (**12.5% of a form
  bar per volley**). Four to six perfect volleys ≈ half a form. At boss 4 a volley
  was 6 HP (2% of hpMax); at the finale a perfect volley is 30 HP. The system the
  player has mastered for thirteen fights is, at last, loud.

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

> **`scarBurn: { minTier: 4, frac: 0.5, dur: 3.0, fullCapOnly: true }`** — a
> FULL-CAP release on a tier ≥4 boss leaves burning brands on the struck organs:
> an additional `frac × volleyTotal` paid over `dur` seconds as visible burn
> ticks (reuse the crack-tick presentation channel; damage on scheduled frames).

Why this shape:
- **It is additive and band-gated.** Tiers 1–3 are byte-identical — the shipped
  mid-game balance (bosses 4–9) does not move at all.
- **It preserves the ROI LAW instead of raising it.** The instantaneous volley
  still clamps at 10%; the burn is bounded at 0.5× the (already-clamped) volley,
  so the worst case per release is 15% of a phase, paid over 3 s, earned only by
  a complete 6-pip set. New invariant for `lockdpsCore`/`tests/lockdps.mjs`:
  `burn ≤ scarBurn.frac × volley` (and therefore `volley + burn ≤ 1.5 × roiCeil`).
- **It rewards exactly the thing the endgame organs enable** — full sets — and
  compounds with the beat bonus, so mastery (complete the set, release on the
  beat) is what grows, not raw numbers.
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
adds THE RECKONING on top: `scarBurnFrac` 0.5 → 1.0 for stage 3 after all five
relics are branded (perfect volley = 15 + 15 burn = 30 = 12.5%/form-bar).
Sign-off should confirm both halves (the quirk-as-feature and the 1.0 burn).

### 4e. The resulting trajectory (perfect full-cap release, % of current phase)

```
boss    1-3   4    5    6     7    8     9    10    11    12    13    14
now     0*    6%   5.4% 10%   5%   9%    9%   0     0     0     0     0
plan    0*    6%   5.4% 10%   5%   9%    9%   15%   15%   15%†  15%‡  9.4→12.5%(form)
```
\* V1 utility only (rate +15%, exposure ticks). † reached ~2× faster (echo-pips).
‡ or converted into beam-duel seconds via the fork. A curve that now rises to the
finale instead of cresting at boss 6.

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

- **PR0 — re-green the gate (housekeeping, blocking).** `tests/lockdps.mjs` is
  RED on master: it asserts KARNVOW is lance-inert but KARNVOW now has trophy
  lockParts. Update the roster assertions (KARNVOW → capable; ASHTALON remains
  the named V1-only example). No behavior. *Gate: lockdps + lock + boss suites
  green; `node tools/lockdps.mjs --ci` clean baseline recorded.*
- **PR1 — the ladder is data.** This doc lands; add `lockRole` to every def
  (`v1Teach | v1Pressure | v1Mover | paintTeach | sweepExam | movingSet |
  destructible | timingException | splitEcology | parrySnap | resonant |
  interrupt | echo | forkFeed | apexLedger`) + a progression test that walks
  `BOSS_ORDER` asserting: V1 before paint; first paint ≤3 targets; the
  REACHABILITY LAW for tiers ≥4 (will be RED-as-TODO for 10–14 until their PRs —
  land it `.skip`-annotated per slot and un-skip as each ships, so the ladder is
  enforced ratchet-style). No behavior.
- **PR2 — HERO: KNELLGRAVE.** Organs (2 empties + def data) + the toll-beat seam
  (def-gated `beatOn` source) + resonant-release wiring. Proves the whole thesis
  on the World-Ender opener: an endgame boss gains real lance utility while its
  gimmick (rhythm) is AMPLIFIED, not diluted. *Gates: lockdps bands (KNELLGRAVE
  enters the capable set, ~42 volleys-to-clear in band), lock.mjs, boss.mjs,
  tricount (zero delta), knellshot/tiershots; owner judges the toll-release feel
  on the PR preview.*
- **PR3 — SCAR-BURN.** Config knob (default present but `minTier: 4` means
  tiers 1–3 byte-identical), `lockLayer`/boss seam for burn ticks, extend
  `lockdpsCore` + `tests/lockdps.mjs` with the burn invariant (intentional test
  update, flagged in the PR body). ⚠ owner sign-off on the law before merge.
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
  `decayPauseWhileHidden`; KARNVOW snap-attribution. Small, independent, last.

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
- **Owner sign-off needed on:** (1) SCAR-BURN (§4b — the one new law; effective
  per-volley ceiling 10%→15% at T4+, and the invariant/test change);
  (2) EMBERTIDE fork→beam feed (§3 rung 13 — touches the Surge ladder boundary,
  audit ED-8) plus formally retiring the slot-13 `lockMuted` intent;
  (3) ONEWING echo-pip (§3 rung 12 — pips granted without dwell) and THE
  RECKONING's 1.0 burn at the Apex (§4d).
- **Open lore question:** branding EMBERTIDE's `leashNotch` touches the 13→14
  leash thread — does the brand deserve a one-line note card ("EVEN THIS WAS
  LEASHED") the first time it takes? Cheap, big lore payoff; owner call.
