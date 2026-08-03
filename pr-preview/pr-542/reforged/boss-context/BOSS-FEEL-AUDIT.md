# BOSS-FEEL-AUDIT — four owner playtest complaints, verified by symbol (master @ ee5bdf1)

**Status**: ASSESSMENT (Fable pass, 2026-07-10). Read-only — no source changed. Each section:
(A) VERIFY what the code actually does, (B) ROOT CAUSE, (C) ranked buildable PLAN.
**Contract honored throughout**: graze form + parry job survive every fix; every fix is def-gated
(other bosses byte-identical); no new large additive fills (§2 overdraw law / FX-BUDGET);
shipped machinery reused over invented; headless proves function, owner judges feel on preview.

Verdict grid (the one-screen read):

| # | Boss | Owner said | Code says | Class |
|---|---|---|---|---|
| 1 | ASHTALON | "the dive only happens once" | **TRUE** — `stoopingStrike` arms once per fight (P3 entry), pocket live ~3.2s total | design gap |
| 2 | MARROWCOIL | "too aggressive for a stage 4" | **TRUE** — its `rhythm` phrases out-pace BOTH neighbours (~160 volleys/min P3 vs slot-5 peak's ~103); the def's `cadence` row looks in-band, the aggression hides in the phrase data | data tune |
| 3 | HOLLOWGATE | "all panes broken → DPS drops, boring" | **TRUE + a literal bug** — `spiralStream` goes fully SILENT with 0 live panes; amber/graze/lance economies all decay with pane count; no authored all-broken state | bug + design gap |
| 4 | BRINEHOLM | "fly to the wall to lock side shackles and die" | **TRUE, and a prior fix half-landed** — commit 06a235e pulled posts to world ±6.75 assuming pose.x=0, but the default `holdSway` (±5.0) swings the outer post to ±11.75, 1.25m off the fatal ±13 wall; the lock is FLY-based (`coneCandidate` tests PLAYER x/y, 2.6m/axis) | regression of intent |

---

## 1. ASHTALON — "the dive only happens once, so you can't surf the slipstream"

### A. VERIFY (owner is RIGHT)

- The dive is the `stoopingStrike` setpiece: `bossDefs.js` ashtalon
  `setpieces: [{ id:'circlingPass', atPhase:1, dur:7.0 }, { id:'stoopingStrike', atPhase:2, dur:5.5, dread:true }]`.
- Setpieces arm ONLY in `armSetpieceForPhase(idx)` (boss.js), called from exactly two places:
  the phase-advance path inside the shield-break handler (`armSetpieceForPhase(phaseIdx)`,
  ~:3535) and the `?bossPhase=N` debug jump (~:1981). Phases only advance forward on hp
  thresholds → **`stoopingStrike` runs exactly once per fight**, on entering P3 (hp ≤ 33%).
  There is no cooldown, no re-arm loop, no recurrence field anywhere in the runner
  (`setpieceT`/`setpieceDef`; `clearSetpiece()` at `k >= 1` and it never returns).
- The slipstream pocket is a sub-slice of that one run: the graze branch
  (`def.grazeForm === 'slipstream'`, ~:2870) gates on
  `setpieceT/dur >= SLIP_K_ON` with `SLIP_K_ON = 0.42` → live for k ∈ [0.42, 1] =
  **0.58 × 5.5s ≈ 3.2s of ridable pocket per FIGHT**. The `×2` exposure needs
  `slipRideT >= 0.8` inside that window plus a banked Surge (`activateSurge` hook, ~:3468).
- Worse: the runner aborts a setpiece if the shield rises mid-beat
  (`if (setpieceT >= 0) clearSetpiece()` in the `!shielded` else-arm, ~:2460) — an
  ill-timed break can erase even the one stoop.
- The machinery already ANTICIPATES repetition: `armSetpieceForPhase` re-offers slip state
  **"per stoop"** (`if (sp.id === 'stoopingStrike') { slipExposeUsed = false; slipRideT = 0; }`,
  ~:804 — same reset duplicated in the `debugRunSetpiece` test seam ~:5041). The comments say
  "per stoop"; the fight only ever has one.

### B. ROOT CAUSE

The graze form's entire economy hangs on a **once-per-fight, last-third-only, 3.2-second**
window. A player who dies in P3, or spends the stoop dodging (the correct first-encounter
read), never touches the slipstream at all. The AMBUSH–REST signature promises "sforzando
stoopS" (plural, def comment); the arming law (`atPhase`, once) delivers one. This is not a
tuning miss — the setpiece system simply has no recurrence primitive, and slipstream was
bolted to the only trigger that exists.

### C. PLAN (ranked)

**C.1 (recommended) — RECURRING STOOP: a def-gated `recur` field on the setpiece entry.**
- Def: `{ id:'stoopingStrike', atPhase: 2, dur: 5.5, moving: true, dread: true, recur: 9 }`
  (~9s quiet between stoops → 2–3 stoops inside the 26s dread card, each with its own
  pocket + re-offered exposure).
- Engine: one module `let setpieceRecurCd = 0` + one block in the fight update's
  station-keeping arm (beside the `clearSetpiece()` abort, ~:2460):
  when `setpieceT < 0 && !shielded`, find `sp = setpieceForPhase(phaseIdx)`; if `sp?.recur`,
  count `setpieceRecurCd` down and re-call the arm path (same body as `armSetpieceForPhase`
  — reuse it) when it hits 0; reset the cd on every arm. Reset the cd at the three
  slipstream reset sites (encounter start ~:1571, `endEncounter` ~:1757, `resetBoss` ~:4880).
- Coexist: **only a def carrying `recur` re-arms.** Voidmaw/stormrend carry no setpieces at
  all (the lifecycle test already asserts they never arm one); every other setpiece def omits
  `recur` → `undefined` → the block no-ops. One ashtalon def line + one guarded engine block.
- Reuse: the entire slip pocket, band mesh, exposure, and per-stoop reset ship today —
  recurrence multiplies them with zero new graze code. AMBUSH–REST is STRENGTHENED (the
  circling rest between stoops IS the signature's dread).
- Optionally also `recur: 12` on `circlingPass` (P2) so the hunter never becomes a loom —
  preview-judged, ship the P3 recur first.
- Gate sketch (tests/boss.mjs): drive ashtalon into P3 with hp pinned, simulate 30s →
  assert ≥2 `stoopingStrike` arms (count `slipExposeUsed` resets or watch `setpieceT`
  restarts); assert a second ride ≥0.85s + Surge fires a second `slipExposed`; assert
  voidmaw 60s sim never sets `setpieceT ≥ 0` (existing assert stays green); rhythmprint
  untouched (recurrence doesn't touch the cadence seam — moving setpieces leave clocks live).
- Preview risk: **medium-low** — cadence of terror; too-frequent stoops could read as spam.
  The 9s dial is the whole risk surface; owner tunes on preview.

**C.2 — widen the one window (cheap complement, not a substitute).**
`SLIP_K_ON 0.42 → 0.30` (the pocket fades in through the late hold — the band already draws
a 0.14-opacity pre-tell from k ≥ 0.2, ~:2900) and/or stoop `dur 5.5 → 7.0` (stretches the
ridable slice to ~4.9s). Only slipstream reads `SLIP_K_ON` and only ashtalon is slipstream →
coexist safe. Does NOT answer "only happens once"; ship it WITH C.1, not instead.

**C.3 — arm the stoop in P2 as well** (swap `circlingPass` out or move it to P1). Rejected
as primary: costs the circling identity beat (`setpieceForPhase` resolves one setpiece per
phase via `.find`), and still yields only 2 fixed dives. C.1 subsumes it.

Effort: **S/M** (one engine block + one def line + gate). Biggest risk: stoop frequency feel.

---

## 2. MARROWCOIL — "too aggressive for a stage 4"

### A. VERIFY (owner is RIGHT; the aggression hides in `rhythm`, not `cadence`)

The def's `cadence` rows look perfectly in-band (P1 [1.5,2.0] → P3 [1.3,1.7] — identical
envelope to ashtalon and eitherwing, above the Colossi 1.3 floor). But `cadence` is the
FALLBACK; with a `rhythm` block the phrase machine (`bossRhythm.js`) owns live pacing:
after every shot it waits the measure's `gap`, and only after the whole phrase the
`restLo..restHi` rest. Summing the authored phrases (shots ÷ (Σgaps + mean rest)):

| Phase | ASHTALON (slot 3) | **MARROWCOIL (slot 4)** | EITHERWING (slot 5 PEAK) | HOLLOWGATE (slot 6, tier 3) |
|---|---|---|---|---|
| P1 | ~2 shots / 3.4s ≈ 35/min | 6 / ~3.8s ≈ **95/min** | 3 / ~2.9s ≈ 62/min | 6 / ~7.5s ≈ 48/min |
| P2 | ~4 / 3.9s ≈ 62/min | 12 / ~5.1s ≈ **140/min** | 5 / ~2.9s ≈ 103/min | 7 / ~6.4s ≈ 66/min |
| P3/P4 | ~7 / 4.8s ≈ 88/min | 10 / ~3.8s ≈ **160/min** | 4 / ~2.3s ≈ 103/min | 10 / ~6.4s ≈ 93/min (P4 dread) |

- **The slot-4 boss out-fires the slot-5 sawtooth peak in every phase, by ~1.4–1.6×, and
  out-fires the tier-3 opener's DREAD phase by ~1.7×.** §5b principle 6 (rising sawtooth,
  peak at slot 5) is inverted.
- Rest floors: marrowcoil P2 `restLo 1.1` / P3 `restLo 0.9` (with `restDist:'decaying'` —
  bossRhythm ramps restHi→restLo over `DECAY_STEPS = 4` repeats, so the fight KEEPS
  hitting the 0.9s floor). Eitherwing's P3 floor is 1.45; hollowgate's P4 floor is 2.0.
  Marrowcoil idles faster at stage 4 than anything until THRUMSWARM (slot 7).
- Burst tightness: marrowcoil P3 opens `{ burst, movingGap, count: 3, gap: 0.14 }` — THREE
  5-row lane-denial walls in 0.42s (each row a full `noteGapThreadRow` wall with its own
  player-seeded gap — three DIFFERENT gaps to thread back-to-back), then 2 `spiralStream`s
  0.16s apart (each streaming 6–9 sub-volleys off `pending`). 0.14/0.16 are the tightest
  burst gaps in the shipped roster (hollowgate dread: 0.22–0.26; eitherwing: 0.26).
- The dread stacks a third layer: `closingRibs` is `moving: true` → the P3 phrase keeps
  firing at ~160/min through the 6s hold, PLUS `emitRibStrain` (~:2452) adds up to 4 ambers
  every 0.55s, PLUS the cage itself constricts. (The strain volley is the ENG-E
  owner-approved reachability fix — its cadence is the designated LAST-RESORT dial, per the
  ENG-E lesson; don't reach for it first.)
- Not the culprits: `hpMax 300` (mid-band, correct); telegraphs (SUSTAINED wind-ups are the
  shared `telegraphSustained`, unchanged); `ratioBurst` (documentation only — bossRhythm
  never reads it); bullet count per volley (shared pattern dials).

### B. ROOT CAUSE

Pure def-data: the `rhythm.phases[].{restLo,restHi}` floors and the P2/P3 burst
`count`/`gap` values were authored ~one band hotter than the slot's neighbours, and the
`decaying` rest distribution guarantees the player repeatedly experiences the floor. The
BURST-vs-SUSTAIN signature itself (the identity) doesn't require these absolute values —
it requires the burst:sustain RATIO to climb per phase, which survives any uniform slowdown.

### C. PLAN (ranked — all pure `bossDefs.js` marrowcoil data; zero engine code)

**C.1 (recommended) — re-band the rests + soften the wall cluster.**
Exact dials, marrowcoil `rhythm.phases` only:
- P2: `restLo 1.1 → 1.5`, `restHi 1.7 → 2.1`; `crossfire count 3 → 2`, `gap 0.16 → 0.22`.
- P3: `restLo 0.9 → 1.3`, `restHi 1.5 → 1.9`; `movingGap count 3 → 2`, `gap 0.14 → 0.22`;
  `spiralStream gap 0.16 → 0.22`.
- P1: untouched (95/min opener is hot but teaches; judge after P2/P3 land — second-notch
  dial if preview still reads hot: `iris gap 0.18 → 0.24`).
Estimated result: P2 ≈ 105/min, P3 ≈ 120/min — still the densest Colossus (BURST-vs-SUSTAIN
keeps its bite, `decaying` keeps tightening toward each slam), but the walls arrive as a
readable pair, not a triple, and the floor rest rises above the slot-5 peak's.
- **DO NOT touch** (identity + CI): the `attacks` lists (`amberdiet` reads
  `def.phases[].attacks`; `stream` is the P3 amber carrier), `restDist` shapes
  (uniform/bimodal/decaying ARE the fingerprint), `ticket` bpm 84, `ratioBurst` doc values,
  `setpieces` (ribThread/closingRibs), `destructibleRibs`/ORGAN BREAK, `grazeForm:
  'threadTheGap'`, `hpMax`, `emitRibStrain`'s 0.55s (owner-approved; last-resort dial),
  `DECAY_STEPS` (global — touching it moves every decaying boss).
- Coexist: one def's rhythm numbers; every other boss byte-identical by construction.
- Gate sketch: `rhythmprint` re-run (the fingerprint moves — assert it still clears the
  KS-distance floor against ALL 13 others, esp. eitherwing whose P3 rest band [1.45,1.65]
  is now nearer); `amberdiet` unchanged (attack lists untouched); a new band-order assert
  is the durable win: **sim 60s per phase for slots 3/4/5 and assert
  volleys/min(slot 4) ≤ volleys/min(slot 5) per matching phase index** — the sawtooth as
  CI, so no future tune re-inverts it.
- Preview risk: **low** — numbers-only, reversible in one line each. The one feel question
  is whether the dread still terrifies with 2 walls; the closingRibs cage + strain ambers
  still stack on top, so it should.

**C.2 — thread-the-gap as the pressure valve (complement).** Keep C.1's P3 numbers hotter
(movingGap stays 3) but make threading PAY the escape: the ENG-G chain already multiplies
consecutive threads — no change needed, just a smaller C.1 (rests only). Rejected as
primary: the owner's complaint is raw pressure, and stage-4 players don't have the chain
skill yet; §5i.C law 6 says rewards must never be the only way to survive.

Effort: **S** (def data + test). Biggest risk: rhythmprint KS proximity to eitherwing
(mitigated: different `restDist` shapes and different phrase structures).

---

## 3. HOLLOWGATE — "shatter all the panes → DPS drops badly, gets boring"

### A. VERIFY (owner is RIGHT, and one half of it is a plain bug)

What all-panes-broken actually does, by symbol:

1. **`spiralStream` goes literally silent — asymmetric with `spiral`** (`executeAttack`,
   ~:3846): `spiral` does `if (firePaneRadial(player, spiralPhase)) return;` —
   `firePaneRadial` returns `false` when `model.livePanes()` is empty, so `spiral` FALLS
   THROUGH to the generic radial. But `spiralStream` unconditionally pushes 9 pending
   `firePaneRadial` closures and `return`s — with 0 live panes **each closure no-ops and
   the entire volley emits zero bullets**. P4's phrase LEADS with
   `{ burst, spiralStream, count: 3 }` → the dread chorus is three silences.
2. **The amber diet decays linearly with pane count → 0.** Each pane radial carries exactly
   one amber centre per live pane per volley (`const amber = j === 0; … amber ? idx : null`,
   ~:3832). At 8 panes the fight rains parryable amber; at 0 the only ambers left are
   `stream`'s every-4th-tick tips and `aimed`/`fan`. Less amber → less parry → less
   perfect-heal, less Surge bank, no PANE-BREAK +6 chips → **the player's kill rate
   visibly collapses exactly when they finish the parry job** — a direct inversion of
   §5i.C law 4 ("chip always progresses; parry ACCELERATES") and of the ENG-E "sculpting
   visibly accelerates the kill" contract (`applyPartBreak` returns +6 precisely for this).
3. **The lance ladder collapses.** 5 of the 6 paintable organs are panes
   (`lockParts: rosePane1/2/3/5/7`); every break fires `dropLockPart` (~:4647) and the PR6
   liveness filter (`lockPartDead`, ~:4407) removes the corpse — fully sculpted, only
   `roseHub` remains brandable → the stack/cap economy is a stub.
4. **The graze read dies with the beams.** `grazeForm:'beamEdge'` still ticks on any nearby
   bullet (`beamContact` scans all boss bullets, bossBullets.js:982), but the designed read
   — "ride a pane's radial" — no longer exists; what's left is incidental.
5. **Nothing marks the state.** `bossPaneBreak` already emits `left: livePanes().length`
   (~:4644), the model has `crackedCount()`, but no consumer reacts to `left === 0`. The
   door the player fully unmade never opens. The pupil/gaze system keeps ticking on ghosts.

### B. ROOT CAUSE

Two-part: (i) a **fallthrough bug** — `spiralStream`'s pane branch lacks `spiral`'s
empty-pane guard, deleting the dread phase's lead attack; (ii) a **missing terminal state**
— the destructible system was built pane-by-pane (each break correctly deletes one radial)
but nobody authored what TOTAL victory over the window means, so full sculpt lands as
pure subtraction: fewer bullets, fewer ambers, fewer organs, same hp bar.

### C. PLAN (ranked)

**C.0 (ship regardless, S) — the guard.** In `executeAttack`:
`else if (id === 'spiralStream' && model.livePanes().length) { …pane path… }` — empty
window falls through to the generic spiralStream exactly like `spiral` does. Def-gated
already (`def.destructiblePanes`); hollowgate-only by construction. Gate: crack all 8 via
`model.crackPane(i)` headlessly, `debugEmitAttack('spiralStream')`, assert bullet count > 0.

**C.1 (recommended, M) — "THE DOOR OPENS": a def-gated breach state on the last pane.**
Fiction: the panes were the prayer; break all eight and the Door That Prays finally OPENS —
and what's behind it is worse, and exposed.
- Trigger: in the `bossPaneBreak` consumer path (or directly in `applyPartBreak`'s caller),
  `if (def.destructiblePanes && left === 0) breached = true` — one module flag, reset at the
  three teardown sites (the `crippled`/`ghostFrameBroken` reset lines ~:1698/:4853 are the
  exact precedent to sit beside).
- Ceremony (all shipped calls): `ui.bossNote('✦ THE DOOR OPENS ✦', 'THE THRESHOLD IS BARE', …)`
  + `cameraCtl.shake` + `sfx.shieldShatter` — the `applyPartBreak` ceremony vocabulary; the
  model side can brighten the hub through the existing emissive tiers (no new additive
  shell — §2/FX-BUDGET: the void stays a VOID; bloom does any flooding, the KNELLGRAVE
  candle-flood ruling).
- Reward loop 1 — **the bare hub is a weak-point**: one line in `damageBoss` beside
  `if (crippled) amount *= 2.4;` (~:4788): `if (breached) amount *= 1.5;` (def-gated by
  construction — `breached` only ever sets for `destructiblePanes` defs). Full sculpt is
  now the FASTEST kill: law 4 monotonicity restored. This alone answers "DPS drops".
- Reward loop 2 — **the amber diet survives the breach**: post-C.0, generic `spiralStream`
  fires but carries no amber. Cheapest honest fix: in the pane branch's stead, when
  `breached`, tag the generic radial's every-Nth bullet amber from the `roseHub` origin
  (`def.muzzle` already routes origin there; the `amber ? idx : null` grammar at ~:3832 is
  the pattern — hub ambers feed parry→Surge with no part to crack, like ashtalon's stream
  tips). Meets `amberdiet`'s 12s window in P3/P4 without leaning solely on `stream`.
- Reward loop 3 (the "interesting mechanic", preview-judged) — **fly the threshold**: when
  breached, anchor `iris` on the hub via the ENG-B seam — hollowgate def gains
  `gapAnchor: { iris: { part: 'roseHub' } }` and `resolveGapAnchor` (~:3671) does the rest…
  gated live only when breached via a `spec.card`-style conditional (one `if (spec.breach &&
  !breached) return null;` arm in `resolveGapAnchor` — dormant for every def that doesn't
  author `breach: true`, the ENG-G dormant-alias pattern). The contracting rings now close
  ON the open door; the safe pocket is THROUGH it — the fight's last read is literally
  flying the threshold. Precedents: eitherwing's `gapAnchor: { iris: { part: 'threadMid' } }`
  (shipped), the ENG-LT survival-resolve authored-state grammar, the ONEWING
  `ghostFrameBroken` break-all→state-flip (~:2752, incl. its enrage sibling at ~:3208 if the
  owner wants breach to also QUICKEN the door — offer, don't default).
- Coexist: every piece keys off `def.destructiblePanes`/`breached`/an authored `breach`
  descriptor — brineholm's shackles and marrowcoil's ribs never set `breached` (their
  PART_SYS rows don't hit the `left===0` consumer unless opted; gate asserts it).
- Gate sketch: crack 8 panes live → assert `breached`, assert `spiralStream` emits, assert
  ≥1 amber in a 12s P4 window, assert `damageBoss(10)` chips 15, assert iris gap x ≈ hub
  world-x while breached and player-seeded when not; assert brineholm shackle-break ×3
  does NOT set `breached`; full-roster byte-inertness (only hollowgate def + the guarded
  branches).
- Preview risk: **medium** — does the breach READ at 30m (a dark hole must feel like an
  opening, not a deletion)? The model may need one opaque-geometry beat (light shafts are
  LineSegments — overdraw-exempt, L124). Owner judges.

**C.2 — pane regeneration ("it re-leads its glass").** Rejected: re-weaving what the player
breaks is WEFTWITCH's claimed identity axis (slot 11, "She Mends What You Break") — a §5b
anti-collision violation — and it breaks the CAVE-law permanence that makes sculpting feel
real (the ENG-E "permanent hole in the cage" contract).

**C.3 — a full new breach ATTACK.** Rejected as scoped: the Calamities band's ≤1-new-id
budget is SPENT (`geyser`, ENG-C lesson). Everything in C.1 remixes shipped ids — that
constraint is load-bearing, not stylistic.

Effort: **C.0 = S; C.1 = M.** Biggest risk: the breach must read as an event, not a bug.

---

## 4. BRINEHOLM — "to lock the side shackles you fly to the wall and die"

### A. VERIFY (owner is RIGHT; a prior fix addressed the wrong frame)

- **The wall is instant death**: `collision.js:81` — `if (p.x > CONFIG.laneHalfWidth || …) crash(player,'wall')`,
  `laneHalfWidth: 13`, no `inBoss` guard, and BRINEHOLM never narrows/softens the arena.
- **The lock is FLY-based, not aim-based**: `lockLayer.js coneCandidate` tests the PLAYER's
  own x/y against the organ's live world x/y — `|px − w.x| < L.coneXY && |py − w.y| < L.coneXY`
  with `coneXY: 2.6` ("LAW — NEVER per-boss", config.js:172) then `dwellTime 0.35s` (retention
  cone 4.0). To brand a shackle you must FLY your dragon to within ~2.6m of the post and sit.
- **The July-7 fix (06a235e, in master) forgot the sway.** It pulled `SHACKLE_X` outer posts
  `±5.5/6.5 → ±4.5` (bossBrineholm.js:324; ×`scale 1.5` = world ±6.75) and claimed "~6m of
  margin" — **computed at pose.x = 0**. But the brineholm def sets no `holdSway`, so
  station-keeping applies the DEFAULT sway `pose.x = sin(time·0.7)·5.0` (boss.js ~:2466).
  The outer post's true world x oscillates **±1.75 … ±11.75** (period ~9s, lateral speed up
  to 3.5 u/s). At the outer swing the acquire cone forces the player into x ∈ [9.15, 13):
  **≤ 1.25m of margin to the fatal wall while chasing a moving target through a 0.35s dwell
  — less than one dodge flick.** The commit's own test asserts static `|x| < 8` with "> 4m
  wall margin" — the assert omits the sway term, which is why CI stayed green while the
  feel regressed.
- Compounding: during P3 (`brineholm_bound`, the natural shackle phase — `lockParts` gate
  the posts `phases: [0,1,2]`), `geyser` fires full-width bottom-up walls whose single safe
  gap is player-seeded/sliding — a player parked at x ≈ 10 has the wall on one side and the
  eruption pattern on the other. The `shadowRide` lee (`|px − pose.x| < 9·1.5·0.55 ≈ ±7.4`
  of pose.x) is CENTRED under the head, so the graze lane actively teaches "stay central" —
  the opposite of where the outer posts live.
- Also verified: the registry's "parry a post's strain-volley 3×" is only half-wired — the
  P3 `fan` (the def-comment's "shackle amber") emits UNTAGGED ambers from the maw
  (`executeAttack` fan branch ~:3897: no part tag), brineholm has **no `reflectTargets`**,
  so reflected ambers fly at the hull centre and credit posts only via the landing-point
  fallback at half weight (`routePartDamage` w = 0.5, ~:4666) — near-accidental. The remote
  way to work a side post barely exists.

### B. ROOT CAUSE

Three stacked mechanisms: (1) organ world-x = `pose.x + local·scale`, and the un-overridden
default `holdSway` (±5.0) re-donates the excursion the July-7 pull-in removed; (2) V1
acquisition is positional by design (the cone LAW cannot be widened per-boss), so lateral
organs price lateral exposure; (3) the ±13 wall is the game's one unconditional
instant-kill, and the outer posts' excursion peaks 1.25m from it. The prior fix moved the
anatomy in the LOCAL frame and measured safety in the WORLD frame at sway-zero.

### C. PLAN (ranked)

**C.1 (recommended, S) — calm the island: def `holdSway` override.**
One def line: `holdSway: { amp: 1.6, freq: 0.5 }` (precedent: voidmaw's teach override
`holdSway: { amp: 3.2, freq: 0.6 }`, bossDefs.js:76 — the seam is shipped and def-gated).
Outer post max world x = 6.75 + 1.6 = **8.35** → acquire from x ≈ 5.75 (inside edge),
**≥ 4.65m of true wall margin at the worst swing** — more than the graze annulus. Fiction
lands FOR free: a bottom-anchored island shouldn't strafe ±5m; near-still bulk is the SotC
read the slot brief claims. Side benefit: the shadowRide lee and the geyser plume anchors
also stop wandering ±5.
- Coexist: one brineholm def line; the default path is untouched for every other def.
- Gate sketch: the durable assert the July-7 test missed —
  `max_i(|SHACKLE_X[i]|·scale + swayAmp(def)) ≤ laneHalfWidth − (coneXY + 2)` (i.e. ≤ 8.4)
  where `swayAmp(def) = def.holdSway?.amp ?? 5.0` — **the sway term in the margin math**,
  so no future def tune can silently re-arm the trap. Plus: lockdps brineholm row unchanged
  (the posts don't move locally), bossgate G1–G7 (G3 is the known pre-existing flake).
- Preview risk: **low** — does the calmer hull read as too static? The model's own breathing
  (`bound` strain, fin-sails) carries idle motion at ≥2 frequencies (§3 law 7) independent
  of pose sway.

**C.2 (recommended WITH C.1, S) — give the promised remote verb: `reflectTargets`.**
One def line: `reflectTargets: ['shacklePost0', 'shacklePost1', 'shacklePost2', 'eyeRig']`
(the ENG-A-R sibling, verbatim marrowcoil grammar). Roll-directed parries now snap to the
post you lean toward and credit it through `routePartDamage`'s landing-point path — the
registry's SHACKLE BREAK parry job becomes workable from lane-safe centre, and flying in
to paint becomes the greedy option instead of the only one. Optional third notch (defer
until preview asks): tag the P3 `fan`'s outer ambers with post indices (the pane
`amber ? idx : null` grammar) for full-weight parry credit.
- Coexist: def-gated (`resolveReflectTargets` no-ops without the field); gate = parry a fan
  amber with a roll toward post 0, assert `partHits('shackle:0')` grows, ×6 (half-weight)
  snaps the post; assert marrowcoil's reflect suite untouched.

**C.3 — pull `SHACKLE_X` in again (±4.5 → ±3.2) or lift `SHACKLE_Y`.** Works arithmetically
(max 9.8 even under full default sway) but treats the symptom: every future lateral organ
on any boss re-derives the same trap, and the posts crowd the snout (the silhouette pays).
Only take this if the owner rejects the calmer hull on preview. The y-axis variant is a
dead end: the posts already sit near fight height; the death axis is x.

**C.4 — aim-vector (reticle-based) acquisition for lateral organs.** Rejected: `coneXY` is
marked LAW/never-per-boss, V1 is positional by architecture (L175/L177 chose retention
smoothing over aim-vector precisely to keep one aim model), and a per-boss fork of
acquisition is a permanent complexity tax for one geometry bug that C.1 dissolves.

Effort: **S** (two def lines + one model-test margin assert). Biggest risk: none structural
— the sway amp number is the only feel dial.

---

## BUILD ORDER (recommended)

1. **MARROWCOIL rest/burst re-band** (§2 C.1) — S, def-data only, unblocks the progression
   sawtooth at the point every player hits first. No engine risk; rhythmprint is the only CI
   to watch.
2. **BRINEHOLM sway + reflectTargets** (§4 C.1+C.2) — S, two def lines + the sway-aware
   margin gate. Removes an instant-death trap; the gate permanently closes the class of bug.
3. **HOLLOWGATE C.0 guard** (§3) — S, ships alone as a bug-fix PR (a silent dread volley is
   a correctness bug, not a feel call); then **C.1 THE DOOR OPENS** — M, its own PR, the one
   genuinely new (small) state in this audit, riding crippled/gapAnchor/ceremony precedents.
4. **ASHTALON stoop recurrence** (§1 C.1 + C.2) — S/M, the one new engine primitive
   (`recur`), so it goes last where the review attention is undivided; it also gives every
   future moving boss (KARNVOW's flankCutIn, EITHERWING's figureEight) a free repetition
   dial — build a system, prove it on this hero.

Each lands as its own PR with its own leapfrog lesson file (one file per lesson,
`leapfrog/lessons/2026-07-XX-<slug>.md` — THE RULE §2); this audit is the shared pre-build
checkpoint for all four.
