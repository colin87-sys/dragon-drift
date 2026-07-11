# ENGAGEMENT-LOOP-AUDIT — the owner's bar, applied to the ten bosses BOSS-FEEL-AUDIT didn't cover (master @ ee5bdf1)

**Status**: ASSESSMENT (Fable pass, 2026-07-10). Read-only — no source changed. Sibling to
`BOSS-FEEL-AUDIT.md` (same house style, same contract).

**THE BAR (owner-stated)**: *"It can't just be ONE MOMENT in the whole fight. It's gotta be a
CONSISTENT ENGAGEMENT LOOP that makes it unique for that boss fight."* — a thing the player is
actively DOING and OPTIMIZING in EVERY phase, unique to that boss; never a passive stretch,
never a single gimmick bolted onto generic dodge-and-shoot, never a loop that runs out.

**Contract honored throughout**: every fix is def-gated (other bosses byte-identical), reuses
shipped machinery (the grazeForm cluster, `resolveGapAnchor`, the reflect-consumer siblings,
setpieces, the disc/orbit/slip tick economy, the survivalResolve/ghostHalf/holderStagger
authored-state grammar) over inventing systems, respects the §2 overdraw law and the ≤1-new-
attack-id band budgets; headless proves function, the owner judges feel on preview.

Verdict grid (the one-screen read; per-boss sections below):

| # | Boss | The loop, in one phrase | Verdict | Class |
|---|---|---|---|---|
| 1 | VOIDMAW | metronome turn-taking that teaches dodge→parry→graze one verb per phase | **PASS** (in slot-1 context) | teaching loop, sound |
| 2 | STORMREND | read-the-wall — but the boss-unique read ("fly into the eye") is card-gated to the FINAL card | **WEAK** | one-moment gimmick |
| 5 | EITHERWING (re-check) | parry the eye-HOLDER mid-possession → stagger — reads every phase, but the payoff is **arithmetically unreachable** (baton flips ~3s; 3 perfect parries needed) | **WEAK** | reward barely reachable (the ASHTALON shape) |
| 7 | THRUMSWARM | soak-weave the shed motes + time chip to the condense cycle — but the cycle **never scatters at station** (`condHold` 1.1s > every rest ≤0.85s) | **WEAK** | advertised read is inert (numbers, not design) |
| 9 | KARNVOW | duel-tempo dodge + parry — but the unique verbs (riposte, stare-down) fire ONCE per phase; the claimed TENNIS RALLY is deferred | **WEAK** | sparse moments, loop deferred |
| 10 | KNELLGRAVE (re-check) | toll-wall surf + resolve — runs P1–P3 and P5, but **P4 has zero tolls/pockets** and the P2 "RHYTHM PARRY card" has no consumer | **WEAK** | one dead phase + a paper mechanic |
| 11 | WEFTWITCH | read the taut thread → parry 3× → CUT → unravel + stagger + harvest bloom, every phase | **PASS** | real loop |
| 12 | ONEWING | the dodge-mirror ghost volley + parry-the-dead-half — P2→P5, but P1 is plain and the loop **self-deletes** on frame break | **WEAK** | loop runs out (the HOLLOWGATE shape, opt-in) |
| 13 | EMBERTIDE | skim the crest edge → bank Surge → the tide LOCKS a beam duel (recurring, cd 10s) → hold the line; face-shadow ride in the finale | **PASS** | real loop (one survival-card collision flagged) |
| 14 | THE UNMASKED | *(none)* — placeholder phases, dead `medley` graze label, no quotes/relics/pips/verb-shift | **FAIL** | the known Boss-14 capstone |

---

## 1. VOIDMAW (slot 1, tutorial) — PASS in context

**Loop map.** METRONOME turn-taking (`rhythm.signature:'metronome'`, every gap == the pulse,
tightening 2.1→1.85→1.6s, bossDefs.js ~:112). P1 `aimed` only — the amber parry teach, with the
explicit banner at fight entry (`if (def.tutorial) ui.bossNote('DODGE!', 'ROLL INTO AMBER SHOTS
TO PARRY', …)`, boss.js ~:1968). P2 +`fan` (find the gap). P3 +`tunnel` — rings authored at
radius 3.7 < grazeR so flying the centre SKIMS constantly (the Sentinel center-skim graze,
executeAttack tunnel branch ~:3950). Between phases: the shield bait-donut weave (the
survival-by-grazing break, ~:3132). LANCE V1 teach: `virtualLockOrgan:'faceCore'` + the tutorial
`holdSway` inequality (amp 3.2 < retention cone 4.0 — a centred player never drops the lock).

**Verdict: PASS.** The loop the player runs here IS the game's core loop — dodge → parry amber
→ graze → Surge — introduced one verb per phase on a clock that never rests longer than 2.1s
(no passive stretch is possible by construction). That is exactly the slot-1 bar ("teaches the
core loop cleanly"). Its uniqueness IS the metronome: the only boss whose tension is
consistency. Not featureless — no fix needed. The registry's staged —³ parry-job retrofit
(§5b footnote 3) stays optional polish, not a gap against this bar.

---

## 2. STORMREND (slot 2) — WEAK: the unique read exists only in the final card

### A. LOOP MAP (by symbol)

- P1 (1.00→0.66, a third of the fight): `attacks: ['fan']` — one verb, find-the-gap, repeated
  under the CRESCENDO decaying rest (bossDefs.js ~:167, ~:187). No graze form (no `grazeForm`
  key), no parry job (§5b row 2: —³, base roll-reflect only), no setpiece.
- P2: +`movingGap`/`iris`/`secondWave` — all roster-generic wall patterns, player-seeded gaps
  (the shipped ENG-B default). Still nothing to read ON THE BOSS.
- P3 (dread card `stormrend_eye`): the one boss-unique read finally arms —
  `gapAnchor: { iris: { card:'stormrend_eye', part:'focalEye' }, movingGap: { card:
  'stormrend_eye', part:'focalEye' } }` (bossDefs.js ~:135) resolved by `resolveGapAnchor`'s
  card gate: iris rings centre on the eye, the movingGap lane locks to the eye axis — "fly into
  the eye of the storm" is literally true **only while the last card is live** (~the final third
  of the fight, less if the card times out). Plus the P3 constrict (`constrictPhase: 2`).

### B. VERDICT — WEAK

This is the bar's textbook failure shape stated in its own def comment: the ENG-B lesson calls
the eye-lock the boss's identity read, and the def gates it to one card. For two-thirds of the
fight STORMREND is generic wall-dodging that HOLLOWGATE, THRUMSWARM P3, and WEFTWITCH all also
serve (same attack ids, same player-seeded gaps), differentiated only by the crescendo rest
ramp — a texture, not a verb. The player OPTIMIZES nothing stormrend-specific until hp ≤ 33%.

### C. PLAN (ranked)

**C.1 (recommended, S) — un-gate the eye: the anchor runs whenever iris/movingGap fire.**
One def edit: drop the `card:` keys → `gapAnchor: { iris: { part:'focalEye' }, movingGap:
{ part:'focalEye' } }`. Precedent: EITHERWING ships exactly this ungated form
(`gapAnchor: { iris: { part: 'threadMid' } }`, bossDefs.js ~:493). Effect: from P2 on (iris and
movingGap debut in P2 — P1's fan is untouched, no fan key exists in the map), every wall's safe
lane IS the eye's live position under the ±5 station sway — the whole fight becomes "chase the
eye", intensifying with the crescendo, climaxing in the constrict. Teach-before-test improves
(P2's slow iris teaches the read the P3 dread then weaponizes — §5f law 4).
- Coexist: stormrend def bytes only; `resolveGapAnchor` is shipped; no emission change (gap
  POSITION only — rhythmprint/amberdiet untouched by construction, the ENG-B verify precedent).
- Gate sketch: the shipped ENG-B suite's "card-off does NOT lock to the eye" assert (its G4)
  INVERTS — split, don't delete, per the ENG-LT twin-split law: the coexist leg re-targets a
  no-gapAnchor def (voidmaw movingGap stays player-seeded); the stormrend leg asserts lock in
  P2 with no card forced. laneSafe holds by construction (each read point clamps ±8/±9).
- Preview risk: **low-medium** — does P2 get too easy (the eye is a stable-ish anchor vs a
  sliding gap)? The sway keeps it moving; the crescendo tightens the timing. One def line back
  if it flattens.

**C.2 (complement, S) — give P1 a reason to be near the eye.** P1 is fan-only; the §5b staged
retrofit idea that fits the fiction: nothing new — simply move `iris` into P1's attacks/phrase
at teach pace (one slow ring measure), so the eye-read starts at volley one. Def data; the P1
rhythmprint moves (re-run the KS gate). Optional — C.1 alone clears the bar.

**C.3 — rejected: a slot-2 parry job retrofit** (new amber-carrier mechanic). The §5b —³
footnote stages it with a future polish pass; a Sentinel doesn't need a bespoke parry mechanic
to pass this bar once C.1 lands, and the Colossi debut (ORGAN BREAK) staying at slot 4 keeps
the parry ladder's teach order intact.

Effort: **S** (def data + one test split). Biggest risk: P2 difficulty feel.

---

## 5. EITHERWING (slot 5, re-check of the fresh rework) — WEAK: the loop reads every phase, but the payoff can't trigger

### A. LOOP MAP (adversarial, as requested)

The holder-stagger loop IS offered in every phase — that part of the rework landed:
- P1: `aimed` fires from `eitherMuzzle` (`emitOrigins.aimed`, bossDefs.js ~:486) carrying its
  source tag (ENG-EW); parrying it feeds the holder bank (boss.js ~:2671–2682: `snapParts
  .includes('eitherMuzzle') || includes(holderName)`).
- P2: `stream` (muzzle) + `crossfire` (the HOLDER twin's half counts — `holdState().target < 0.5
  ? 'eitherTwinA' : 'eitherTwinB'`).
- P3: `crossfire` counts; the iris contracts on `threadMid` (ungated `gapAnchor`, ~:493) — a
  true boss-anchored read in the dread.
- orbitAnnulus is NOT a loop: it lives only inside the `figureEight` setpiece windows (8s at P2
  entry, 7s at P3 entry, `setpieces` ~:477; armed once per phase — no recurrence primitive), so
  it's a once-per-phase bonus lane, ~15s across a whole fight. The holder loop is what must
  carry the bar — and as a READ, it does.

**But the payoff arithmetic is dead.** The stagger needs `HOLDER_STAGGER_PARRIES = 3` (boss.js
~:4621) PERFECT-parry rolls (+1 per roll — snapParts is perfect-only and the consumer is
roll-latched, ~:2674) **within ONE possession**, because a baton pass wipes the bank
(~:3123–3130: target flip → `partParries.delete(HOLDER_KEY)` + "THE EYE PASSES — THE COUNT
FADES"). The model flips the baton on its own timer at station: `handoffTimer = 2.4 +
Math.random() * 1.2` whenever `moving` (bossEitherwing.js ~:836), and `moving` is simply
"fighting, not shield-clamped, not in the entrance" (~:722) — **a possession lasts 2.4–3.6s**.
Holder-tagged amber arrives at phrase pace: P1 serves one `aimed` doublet (0.34s apart — ONE
roll catches both, latched to +1) per ~4.6s phrase+rest; P2's two carrier measures span ~4.6s;
P3's crossfire doublet likewise. **Max realistic bank per possession: 1–2. Required: 3.** The
stagger — the eye-drop window, the rework's headline — effectively never fires in live play.
(The ENG-EW gate passed because tests pin `debugHold`, freezing the baton — reachability was
proven with the wipe mechanism disabled.) Side effect: a parry-literate player sees the
"HOLDER FALTERS — 1/3" note immediately followed by "THE COUNT FADES" every ~3s — the loop
actively teaches that its own reward is a lie.

### B. VERDICT — WEAK

The loop is offered every phase (the rework fixed reachability of the READ), but its payoff is
unreachable by construction — the exact ASHTALON class from BOSS-FEEL-AUDIT ("the reward barely
triggers"), on a rework that shipped this week. Honest answer to the owner's question: the
holder loop gives the player something to DO every phase; it never gives them what it PROMISES.

### C. PLAN (ranked)

**C.1 (recommended, S) — fix the possession arithmetic, keep the "mid-possession" identity.**
Two dials + one semantic soften, all eitherwing-scoped:
1. Possession length: `handoffTimer = 2.4 + rnd*1.2 → 5.0 + rnd*1.6` (bossEitherwing.js ~:836;
   also the init `3.0 → 5.5`, ~:611). The handoff stays the charge tell (the eye still pins to
   the firer during wind-ups via `handoffSpeed`, ~:837) — it just stops out-running the parry
   economy. A ~5–6.6s possession spans 1–2 carrier phrases → 2–3 parry chances.
2. Wipe → DECAY: boss.js ~:3126, `partParries.delete(HOLDER_KEY)` →
   `partParries.set(HOLDER_KEY, n - 1)` — a baton pass costs one banked parry instead of all
   (the note "THE COUNT FADES" becomes literally true). Mid-possession pressure survives;
   cross-possession mastery accumulates slowly.
- Coexist: file-scoped (bossEitherwing.js is eitherwing-only) + the decay line sits inside the
  `def.holderStagger` watcher — every other def byte-identical.
- Gate sketch: the durable assert this rework was missing — **drive the LIVE baton** (no
  `debugHold` pin): sim P2 60s with scripted perfect parries at the carrier cadence
  (`setDebugPerfectParryRel` — the ENG-E law, never frame-tight) and assert ≥1 `bossEyeDrop`;
  assert a flip decays the bank by exactly 1 (not to 0); rhythmprint/amberdiet untouched (no
  def bytes move — both changes are engine/model dials).
- Preview risk: **low** — a slower baton slightly calms the twins' visual tempo; the orbit
  phase (~:723) is independent, so the figure-eight motion is untouched.

**C.2 (alternative, S) — `HOLDER_STAGGER_PARRIES 3 → 2`.** Works arithmetically at the shipped
3s possession (2 is borderline-reachable in P2/P3), but: the registry row says "3× mid-
possession" (a §5b row edit rides the PR), and the roster's canonical-3 rhyme (panes/ribs/
threads/stagger all 3) is worth keeping. Take only if C.1's slower baton reads wrong on preview.

**C.3 (rider, defer to the ASHTALON `recur` PR)** — BOSS-FEEL-AUDIT §1 C.1's setpiece `recur`
field names `figureEight` as a beneficiary: `recur` on the P2/P3 entries turns the orbit annulus
from a once-per-phase moment into a recurring lane. Correctly sequenced AFTER the primitive
lands on its hero. Zero work here beyond the def line then.

Effort: **S**. Biggest risk: none structural — two numbers and a `set` vs `delete`.

---

## 7. THRUMSWARM (slot 7) — WEAK: the advertised puzzle read never manifests at station

### A. LOOP MAP (by symbol)

What runs all fight (and is genuinely good):
- **Soak-weave**: while condensed+firing the swarm sheds surge-pink motes every 0.5–1.0s
  (`driveSwarm` → `shedSoakMote`, boss.js ~:852–876), drifting to the player's lane; weaving in
  absorbs them (`updateSoakMotes` ~:951, `bulletGraze` per soak). Continuous, every phase —
  the PRESSURE-OSTINATO's counter-verb.
- **Formation read**: the swarm's body becomes the pattern (`SWARM_ATTACK_FORM` ~:818 — walls
  condense as walls, radials as rings) — the §5f "emitter = organ" law at swarm scale.
- **Scatter-stagger parry**: any parried roll banks (+1, ~:2720); 3 → the swarm is LOCKED
  condensed for 2.5s ("can't re-scatter").
- Setpieces: `condensePass` (P2), `yourWings` (P4 dread — your recorded `poseRing` path flown
  back, ~:759–766). Chip gate: `condenseInvuln` — scattered = invulnerable.

**The defect — the condense cycle never cycles.** `driveSwarm` holds the swarm condensed
through `condHold = 1.1`s past the last shot (~:840). But the def's authored rests are
**0.5–0.85s in P1 falling to 0.5–0.72s in P4** (bossDefs.js ~:900–928), and within-phrase gaps
are 0.24–0.42s; the wind-up (`chargeT`) and `pending` drain count as firing. **No gap in the
entire fight exceeds 1.1s**, so `setCondense(0)` is unreachable at station — the swarm is
permanently condensed (permanently vulnerable), the "scattered = untouchable" deflect hint
(~:283) can never fire there, and the stagger's reward ("LOCKED condensed — a guaranteed chip
window") is a no-op because nothing ever un-locks. The driveSwarm comment states the intent —
"the swarm only SCATTERS at the phrase RESTS — brief invulnerable micro-pauses (the turn-taking
tell)" — and the numbers void it. Same find-class as MARROWCOIL in BOSS-FEEL-AUDIT: the def
looks right, the truth hides in the interaction of two constants.

### B. VERDICT — WEAK

The soak-weave + formation read is a real, consistent, unique loop — the fight does not fail
the bar outright. But the slot's REGISTRY read ("the condensation rhythm is the puzzle read",
§5b row 7) and its parry job's whole value proposition are inert at the shipped numbers. The
player optimizes soak-weaving; the condense cycle they were promised to time is a lightshow.

### C. PLAN (ranked)

**C.1 (recommended, S) — `condHold 1.1 → 0.4`** (boss.js ~:840). At 0.4s, the hi-end phrase
rests (0.72–0.85s) open a ~0.3–0.45s scatter micro-pause every phrase or two — the turn-taking
tell exists again, the deflect hint can fire, and the 2.5s stagger lock becomes a REAL reward
(guaranteed uptime where uptime is no longer free).
- Coexist **by construction**: `driveSwarm` early-returns unless `def.condenseInvuln ||
  def.grazeForm === 'absorbColor'` (~:829) — thrumswarm is the only such def; the constant is
  effectively thrumswarm-scoped.
- Fairness bound: the scatter must stay a micro-pause, not a half-fight gate — the low-end
  rests (0.5s) still don't scatter (0.5 < 0.4 + charge lead-in), so vulnerability duty-cycle
  stays high by construction.
- Gate sketch: 30s station sim per phase → assert `model.condenseLive()` dips < 0.45 at least
  N≥3 times AND condensed duty-cycle ≥ 0.75 (both directions pinned, so no future rest tune
  silently re-kills or over-kills the cycle); the stagger gate gains an assert that scatter is
  suppressed for the full 2.5s window.
- Preview risk: **low-medium** — the scatter blink must read as "untouchable", not flicker;
  the model's condense lerp rate decides (a model dial, judge on preview). Slight TTK increase
  (chip now has honest gaps) — the §5h DPS-sim duration gate catches an overshoot.

**C.2 (variant)** — key the hold to the live rest (`condHold = min(0.9, rhythmRest * 0.5)`) so
the cycle scales with any future rhythm tune. Cleaner long-term; one expression instead of a
constant. Same gates. Take C.2 if touching the line anyway — it's the same edit site.

Effort: **S** (one line + gates). Biggest risk: the blink's legibility.

---

## 9. KARNVOW (slot 9) — WEAK: duel FEEL shipped, duel LOOP deferred

### A. LOOP MAP (by symbol)

- Moment-to-moment: the tightest Calamity exchange (bimodal jab/riposte rests 0.45–1.4s,
  bossDefs.js ~:1355) of `aimed`/`crossfire`/`stream` — every phase carries amber (the lance-tip
  organ always serves parry fuel), all precision-class, almost no fills. Good TEXTURE — but the
  verbs it demands (dodge tight, parry amber) are the roster-generic economy.
- The unique verbs are all **once-per-phase or once-per-fight moments**:
  - `holdFlinch` stare-down: tiers at 1.1/2.2/3.4s held in the lance line, then
    `holdFlinchDone = true` — **offered ONCE per phase** (boss.js ~:2835–2861, reset ~:3543).
  - `reflectRiposte`: it parries YOUR reflected bullet and returns it slow + amber —
    `riposteUsed = true`, **once per phase** (~:4747–4755); the return (~:2536–2545) is
    re-reflectable — "the C1 seed of the tennis exchange", the code's own words.
  - `holdBreaker`: one shot into the reveal hold, once per fight (~:2528).
  - Setpieces `flankCutIn` (P2) / `voidmawVerdict` (P3 dread): once each (no recur).
- The registry row itself confesses the gap: parry job = "TENNIS RALLY + REFLECT-ONLY SEAL …
  **v1 SHIPPED as reflect-once riposte; full rally + seal deferred (own PR)**" (§5b row 9). And
  the §5i.A signature "your parries steal its tempo — rallies reshape its phrasing" has no
  consumer: `bossRhythm.nextStep(phaseIdx, attacks, rand, beatClock)` takes no parry input —
  the reactive layer is documentation.
- The lance paint-hunt (5 swinging `trophyCharm` lockParts) IS all-fight optimization, but it's
  the shared V2 grammar (marrowcoil/hollowgate/brineholm/knellgrave all offer paint hunts) —
  not unique to this slot.

### B. VERDICT — WEAK

Three unique beats per phase ≈ 9 moments per fight, each seconds long, on top of a generic
(if excellently tuned) dodge/parry bed. That is "moments", not "a consistent loop the player
optimizes throughout". The fight's claimed identity — the duel where initiative is contested —
exists as rhythm data and a seed, not as a loop.

### C. PLAN (ranked)

**C.1 (recommended, M) — ship the deferred rally, scoped small: RIPOSTE RECURRENCE +
ESCALATION on the shipped seed.**
- `riposteUsed` (once/phase) → `riposteCd` (~7s): the duelist answers your reflects all fight —
  parrying KARNVOW now always risks/invites the counter-read. The once-per-fight teach note
  stays (`riposteNoted`).
- The RALLY: each successful re-reflect of the riposte return escalates — the next return comes
  ~15% faster (`B.bulletSpeed * 0.62` scaling down a notch per exchange) and pays escalating
  score; at exchange 3 the rally ENDS in the duelist's flinch (reuse the `holdFlinch` payout
  ceremony ~:2848–2857 — big graze burst + "IT FLINCHED") — initiative won.
- **The detection hazard (pre-flagged, ENG-EW law):** do NOT tag the return bullet with a part
  string — karnvow has `lockParts` and no `emitOrigins`, so the ENG-EW paint guard
  (~:2712–2713) short-circuits and `paintFromParry` would brand a phantom organ. Detect the
  rally parry by a TIME WINDOW instead: a `rallyWindowT` armed when the return spawns; a parry
  consumed inside it counts as the rally answer. Zero tag, zero paint risk.
- Coexist: everything keys off `def.reflectRiposte` (already def-gated); the cd/rally state
  joins the ~:1578 reset line. No new attack id (the return is the shipped emit).
- Gate sketch: reflect → assert `bossRiposte`; re-reflect inside the window → assert a faster
  second return + the escalation payload; 3 exchanges → assert the flinch ceremony + rally
  reset; a def without `reflectRiposte` never returns (existing coexist assert stays); cd
  honored (no second riposte within 7s without a rally).
- Preview risk: **medium** — return-speed escalation must stay parryable at the roster-worst
  handling multiplier (§5h fairness baseline); the speed ladder is the dial.

**C.2 (complement, S) — `holdFlinch` recurrence**: `holdFlinchDone` → a ~10s cooldown instead
of once-per-phase, halving the payout on repeats (the ROI cap law §5i.C.5). The stare-down
becomes a rhythm the player can weave between volleys all fight. One flag → one cd + a decay
factor. Gate: two flinches in one 30s phase sim, second pays less.

**C.3 — the tempo-steal (§5i.A "parries reshape its phrasing")**: a `rhythm.nextStep` parry
input is a bossRhythm.js API change touching a shared engine — correctly its OWN PR after C.1
proves the rally reads well. Don't bundle.

Effort: **M** (C.1) + S (C.2). Biggest risk: rally return speed vs weak-mobile parry windows.

---

## 10. KNELLGRAVE (slot 10, re-check of the fresh rework) — WEAK: the loop is real and strong — and P4 drops it

### A. LOOP MAP (adversarial, as requested)

Phase by phase, does the toll-surf loop run?
- **P1–P3 — YES.** `spiral` is in every attack list + phrase (bossDefs.js ~:1179–1181,
  ~:1210–1234); each toll arms an expanding toll-wall pocket (`executeAttack` spiral branch,
  boss.js ~:3919–3938, `discCd = 1.6`), rim-riding pays escalating ticks (the shrinkDisc branch
  ~:2963), `emitOrigins.spiral: ['bellMouth']` makes the wall radiate from the swinging bell,
  and every release IS an audible/visible toll (`def.musicDies` block ~:3189–3195). The P3
  hemiola (double toll 0.1–0.16s apart) squeezes the rider with the discCd guard preventing
  double-arm. `aimed` amber runs throughout. This is the roster's best new loop.
- **P4 (Pendulum Sweep, hp 0.40→0.25 — ~15% of a 480hp fight) — NO.** Two independent gates
  kill it: (1) `attacks: ['stream', 'movingGap', 'aimed']` (~:1182) — **no `spiral` in the
  phase at all**, so no toll-walls fire even at station after the setpiece ends; (2) during the
  14s `pendulumSweep` setpiece itself, the pocket arm is gated `(ride || (setpieceT < 0 &&
  discCd <= 0))` (~:3924) and `discRideMode()` names ONLY `lastToll` (~:3417) — so even if a
  spiral fired mid-sweep, no pocket arms. What P4 offers instead: the bob-locked movingGap
  mirror (`gapAnchor.movingGap { card:'knellgrave_sweep', part:'bellMouth', scale:-0.36 }` —
  a genuine boss-read, honest across the arc per ENG-H) + a swung stream hose + generic aimed
  parry. A read, yes — but the graze/reward economy that defines this boss is **zero for the
  whole phase**. The audio toll even keeps ringing on every release (musicDies is
  attack-agnostic) — the fight SOUNDS like the loop while mechanically withholding it.
- **P5 (The Last Toll) — YES.** ENG-LT's ride mode: cadence-driven pockets, the RESOLVE meter
  (graze/parry/clapper feeds ~:369–371), the early seal-break + stagger. The exam is active.
- **The paper mechanic:** the P2 card is documented as the §5i.C **World-Ender parry DEBUT** —
  "RHYTHM PARRY CARD: parry the whole 4–6 amber chain on the TOLL's beat" (§5b row 10, def
  comment ~:1195, phrase ~:1222 `burst aimed count 4`). **No consumer exists**: no chain
  counter, no on-beat window, no completion reward anywhere in boss.js (grep: no toll-chain /
  chain-parry symbol). P2 ships a 4-amber burst that the generic economy parries one at a
  time — the band's ladder debut is data-only flavor.

### B. VERDICT — WEAK

The rework built the roster's most consistent unique loop and then authored one phase that
suspends it. P4 isn't passive (the mirror read + the sweep are active dodging) — but the
boss-defining verb (ride the toll) and its whole reward economy vanish for a phase, and the
band's advertised parry mechanic doesn't exist. Two honest dead spots in an otherwise PASS
fight.

### C. PLAN (ranked)

**C.1 (recommended, S) — the bell tolls while it swings: put `spiral` back in P4.**
Def data only: add `spiral` to P4's `attacks` and one `{ kind:'sustain', attack:'spiral',
beats:1, gap:[1.2,1.45] }` measure to the P4 phrase. Effect: at station-P4 (after the 14s
sweep — most of the phase at 72hp) the toll-walls + pockets return; during the sweep the
spiral still fires from the crossing bellMouth (emitOrigins resolves live) — the wall rains
from wherever the bell is, fictionally perfect — it just doesn't arm a POCKET yet (gate (2)).
- Coexist: knellgrave def bytes only. rhythmprint moves for P4 (re-run the KS floor);
  amberdiet unaffected (`aimed` stays).
- Gate sketch: P4 station sim 30s → assert ≥1 `discTollN` increment; sweep window → assert
  spiral emits (bullets > 0) from the mouth origin.

**C.2 (with C.1, S/M) — un-gate the pocket during the sweep, the ENG-LT way.** The
`setpieceT < 0` purity was already split ONCE for `lastToll` via the triple-gated
`discRideMode()`; extend the arm predicate with one more scoped disjunct:
`|| setpieceDef?.id === 'pendulumSweep'` **using the normal srel math** (unlike the overhead
Last Toll, the sweeping bell crosses the lane near fight rel — `srel/slow` is non-degenerate;
verify the mouth's rel range at build, the ENG-LT lesson's exact caution). Now riding the
toll-rim WHILE tracking the mirror lane is the P4 loop — the two reads compose (the §ENG-H
bob-lock says read the bell; the pocket IS the bell's toll).
- The precedent is literally this pattern: "when reversing a shipped invariant for exactly one
  case, gate it on a conjunction only that case satisfies, and split — don't delete — the test
  that encoded it" (ENG-LT lesson). The ENG-H sweep-purity test leg splits again: sweep now
  ARMS, pendulum-era `discCd` honored (unlike ride mode — the knell isn't accelerating here).
- Preview risk: **medium** — P4 is already the fight's motion-heavy phase; walls + mirror +
  pockets may over-stack on weak mobile. Ship C.1 alone first if preview says busy; C.2 is
  additive.

**C.3 (M, own PR) — wire the RHYTHM PARRY chain (the §5i.C WE debut, finally real).** A small
consumer in the reflect block (the 8th def-gated sibling): during `knellgrave_second`, count
parries of the `aimed` chain within a beat window of the toll (the `bellToll` timestamps are
already emitted per release — `emit('bossToll')` ~:3194 is the clock); a full chain parried
on-beat pays a chunk + a bell stagger (reuse `staggerT` — the 4th window sibling already exists
for survivalResolve). Def-gated on a new `rhythmParry: { card: 'knellgrave_second', chain: 4 }`
key. This is a NEW mechanic (M) — correctly its own PR with its own lesson; flagged here so the
ladder's debut stops being paper. (If deprioritized: edit §5b row 10 + the def comment to stop
claiming it — a doc lie is worse than a deferral.)

Effort: **S (C.1) / S-M (C.2) / M (C.3)**. Biggest risk: P4 visual stacking (C.2).

---

## 11. WEFTWITCH (slot 11) — PASS

**Loop map.** THREAD-CUT runs literally every phase: `aimed` (the taut-thread carrier with the
needle-pull audio tell, ~:3247, and the laserLance release visual) is in all five attack lists
(bossDefs.js ~:990–994); every parried amber banks (+1, boss.js ~:2734–2743) with the strain
SEEN (`setThreadStrain`) and HEARD (`stitchPluck`); at 3 the thread CUTS — in-flight ambers
delete, queued sub-volleys drop, the loom is STILLED 2.5s (`triggerThreadCut` ~:915–931, the
scheduling-silence window ~:3151), and once per phase the cut BLOOMS falling harvest motes to
steer through (`bloomHarvestMotes` ~:885–910, `harvestOffered` reset at the phase seam ~:3524).
Between cuts: the lattice walls (curtain/movingGap/crossfire) under the syncopated-loom
off-beat grid. The player is always either reading a taut thread, banking toward a cut,
spending a still-loom window, or steering a bloom — a consistent, unique, self-chaining loop
with no dead phase. **Verdict: PASS.** One flag (identity, not loop): "She MENDS What You
Break" has no mend mechanic — nothing re-weaves; the verb the player fights is CUT. The bar is
met regardless; if the mend fiction ever matters, it's a model/pattern-flavor pass, not a loop
fix. (Minor: `threadCutHits` counts any parried roll, not just perfect — generous, consistent
with the CUT being the accessible loop; leave unless preview says farmy.)

---

## 12. ONEWING (slot 12) — WEAK: a strong loop that starts late and self-deletes on mastery

### A. LOOP MAP (by symbol)

- **P1 (1.00→0.78, ~119 of 540 hp): plain.** `crossfire`/`aimed` + the rubato rests. The ghost
  is explicitly gated out — `emitGhostHalf` returns on `phaseIdx < 1` (boss.js ~:3784), a
  deliberate fairness gate ("one clean volley before the hardest pattern"). Active dodging,
  zero onewing-unique verbs beyond the arrival theater (noWarn ambush, `attackTimer = 0.7`
  ~:1962).
- **P2→P5: the real loop, and it's good.** EVERY volley release pairs with the dead twin's
  ghost triplet (`emitGhostHalf` called beside `executeAttack`, ~:3197) fired from the fused
  frame (`ghostMuzzle`), **aimed by the dodge-mirror** — `mirrorAim` extrapolates your recent
  `poseRing` motion forward 0.6× (~:3764–3770), so repeating a dodge feeds the ghost your next
  position: the registry's "it mirrors your last dodge" is genuinely wired. Ghost bullets are
  amber-ringed, tagged `frameGroup`; a PERFECT parry staggers it and banks toward the break
  (`GHOST_FRAME_HITS = 4`, ~:183, consumer ~:2750–2763). The loop: vary your dodges against the
  mirror + parry the dead half — moment-to-moment, unique, every volley.
- **The self-delete.** 4 perfect parries → `ghostFrameBroken`: the ghost volley STOPS
  (~:3784), the spraySoak vent fires ONCE (a 1.6s 2× graze beat, ~:3801–3811), and the living
  half enrages (`enrage = 0.7` cadence, ~:3208). From there to the felledLie finale the fight
  is EITHERWING's kit at 1.43× tempo with generic `aimed` amber — the mirror READ is gone (only
  the ghost used `mirrorAim`). Completing the registry parry job **removes the boss's unique
  loop and replaces it with nothing** — the HOLLOWGATE shape, opt-in edition. (The trade is
  authored — "breaking the frame removes the ghost volley but ENRAGES tempo" — but the enrage
  is a dial on the generic bed, not a loop.)
- The felledLie (~:2257–2264) is a great single MOMENT (the sanctioned rule-break) — cards are
  allowed to be moments; the bar is about the bed they sit on.

### B. VERDICT — WEAK

~78% of the fight runs a genuinely excellent unique loop. The two honest holes: a fifth of the
fight before it starts (longer than any other WE boss spends teaching), and a mastery path
that un-installs it. A player who does the parry job early (it takes 4 perfect parries — a
good player can finish it in P2) spends MOST of the fight loop-less at enraged tempo.

### C. PLAN (ranked)

**C.1 (recommended, S/M) — GRIEF TRANSFERENCE: after the frame breaks, the mirror moves into
the living wing.** When `ghostFrameBroken`, the living half's `aimed` (and optionally one
crossfire arm) aims via `mirrorAim` instead of your live position — magenta, unparryable, pure
dodge-read: "the grief moved into the living wing". The mirror READ (the boss's unique verb)
survives its own parry job; the trade becomes ghost-parry loop ⇄ harder mirror-dodge loop —
both loops, player's choice, which is what the §5f destructible note intended ("the player
edits the fight").
- Machinery: `mirrorAim` exists and is target-shaped (`{x,y}` — drop-in for the aim solve);
  one def-gated branch at the aimed emit site keyed `def.ghostHalf && ghostFrameBroken`.
  Zero new attack id, zero new state (both flags exist + reset at ~:1698).
- Coexist: the conjunction is onewing-only by construction. Gate: break the frame headlessly
  (4 debug perfect parries), `debugEmitAttack('aimed')`, assert the volley's aim solves to the
  mirror extrapolation (park the player, drift the poseRing, compare) and NOT the live
  position; unbroken → shipped aim byte-identical; voidmaw aimed untouched.
- Preview risk: **low-medium** — enrage (0.7) + mirror-aim may overshoot difficulty; if so the
  dial is enrage 0.7 → 0.8 in the same def-gated line, never the mirror.

**C.2 (with C.1, S) — trim the plain opener: P1 `atFrac 0.78 → 0.86`.** Def data; the fairness
gate keeps its intent (the no-warn ambush + several clean volleys still precede the ghost — the
gate is phase-INDEXED, not time-indexed, so the teach shrinks but never disappears). ~76 hp of
plain intro instead of 119. Re-run the card/def-schema gate (card atFracs move 1:1).

**C.3 (flavor, S, optional) — make the break vent RECURRING-lite**: on each post-break phase
entry, one spraySoak vent echo (the frame stump exhales). Uses `ventSpraySoak` verbatim at the
`breakShield` seam, def-gated. Only if preview says post-break feels reward-dry even with C.1.

Effort: **S/M**. Biggest risk: post-break difficulty stacking (enrage × mirror).

---

## 13. EMBERTIDE (slot 13) — PASS (one survival-card collision to fix)

**Loop map.** Three interlocking verbs, all recurring, all phases: (1) **tide-edge skim** —
continuous ramping graze on the crest bullets (`grazeForm:'tideEdge'` branch, boss.js
~:2796–2811 — contrary to the def comment's "once per phase", the branch is continuous like
beamEdge: the whole fight is a skimmable surface); (2) **the BEAM DUEL** — whenever Surge ≥50%
and off cooldown the tide LOCKS a beam and shoves you off lane-centre; holding the line 1.8s
wins a 6-graze payout + ceremony, cd 10s (~:3010–3058) — a recurring bank-then-spend rhythm the
player actively manages ALL fight (skim → bank → duel → repeat), unique to this slot; (3)
**crest-lock ambers** — `crossfire`/`stream` carriers in every phase feed the parry economy.
The finale re-verbs it: Horizon Break force-selects `crestfall` whose gap mirrors the
face-shadow pocket (`horizonPocketX = sweep * 8`, ~:3301–3306; the crestfall safe slot ~:4099)
— ride the shadow of the face that stopped looking at you. Plus the skyCrush P1 squeeze and
CRESCENDO-SETS ebbs as authored rests. No phase lacks a loop. **Verdict: PASS.**

**One flagged fix (S): the duel can hijack the survival card.** The duel arm (~:3015) checks
only `feverActive`/surge/cd — nothing gates it during `embertide_horizonbreak`, where its
forced drift (`player.position.x += …`, ~:3025) and its hold-centre demand (|x| < 3.2) directly
fight the sweeping ±8 shadow pocket the card demands you ride. A duel arming mid-card shoves
the player out of the only safe lane. One-line fix in the arm condition:
`&& !(activeCard && activeCard.survival)` — def-safe (the block is already `def.beamDuel`-
gated), zero effect on P1–P4. Gate: force the card, pin surge ≥50%, cd 0 → assert no duel arms;
card down → arms. Preview risk: none (it removes an interaction, adds nothing).

---

## 14. THE UNMASKED (slot 14, APEX) — FAIL: the finale is a schema-valid placeholder

### A. WHAT EXISTS (by symbol)

- **Model**: real — 3 stage sub-rigs built (`stagesBuilt: 3`, bossUnmasked.js: eclipse-eye →
  seraph → unveiling), the dev stage-jump selector, the reserved corona glow-shape.
- **Fight engine**: `formLifebars` is wired and works (each form a full bar; refill at the form
  seam, boss.js ~:1977, ~:3509–3512) — the multi-form skeleton is live.
- **Everything that would make it the Apex is absent, by the def's own honest admission**
  (bossDefs.js ~:1639–1641: "valid + inert now: phases/cards/rhythm below are a schema-valid
  PLACEHOLDER medley … that CP2 replaces"):
  - Phases are generic id lists (`aimed/fan/crossfire/movingGap/iris/stream`) at the SPARSEST
    cadence in the roster (stage-1 rests 2.7–4.3s) — three long, slow, fully generic dodge
    fights back-to-back (~3.5 min of it, per the hpMax comment).
  - `grazeForm: 'medley'` is a **DEAD LABEL** — no branch exists in the grazeForm cluster
    (grep-verified; the ENG-D lesson's "loaded gun" list named it: "leave inert until D"). The
    Apex has NO graze form at all right now.
  - No `setpieces`, no `emitOrigins`, no `gapAnchor`, no parry job (§5b row 14: "—"), no
    reflectTargets. The one wired §5f promise is the honest re-struck stage cards (placeholder
    names).
  - The §5f/§5b Apex contract is entirely unbuilt: per-stage roster QUOTES by stable card id,
    the destructible wing relics (each destroyed relic removes that boss's quoted card from the
    final exam), STAR PIPS, the stage-3 verb-shift surge-chase (the Radiance law), the medley
    rhythm quoting felled bosses' signatures, the one-frame VOIDMAW card glitch, the second-sun
    `handoff()` approach.

### B. VERDICT — FAIL (expected, but now measured)

Against the bar: no consistent loop, no unique loop, no loop at all — the finale is currently
the most generic fight in the roster stretched over three health bars. This is not a drifted
design; it is the known remaining capstone — ENG-LT's lesson closes with exactly this: "The
last attack-rework capstone remains **Boss-14 (UNMASKED, Part D), its own dedicated effort**."

### C. PLAN — one flag, not a fix list

**Do not patch this piecemeal.** Every small fix here (a graze branch, one quote, one relic)
would burn coexist/review budget on a def that Part D replaces wholesale. The correct move is
the dedicated Boss-14 arc, and its spec should treat THE MEDLEY as the loop answer to this
audit's bar: the Apex's "consistent unique loop" is *the roster's loops, re-served* — stage-
gated quotes of the taught graze forms (the `medley` label becomes a dispatcher over the
shipped branches — slipstream/orbit/disc/tideEdge are all built and def-gated, so the
dispatcher is routing, not new economies), the relic-destruction meta-loop (edit the final
exam), STAR PIPS banking perfect parries across stages, and the stage-3 verb-shift chase.
Everything it quotes ALREADY SHIPS — Part D is integration, which is why the fixes elsewhere
in this audit (stormrend's read, eitherwing's stagger, karnvow's rally, knellgrave's chain)
should land FIRST: the exam can only quote loops that exist and work. Sequencing note: the
`medley` dead label must gain its branch IN the Part D PR (the ENG-C7 live-label law — the
branch is the activation).

Effort: **the capstone (L/XL, own arc, own spec, two Fable passes per the ENG-LT protocol).**

---

## THE RANKED FAIL/WEAK LIST (by how broken, worst first)

1. **THE UNMASKED — FAIL.** No loop exists; the finale is placeholder. (Biggest build, so it
   schedules LAST — see build order — but it is the most broken against the bar.)
2. **EITHERWING — WEAK.** A week-old rework whose headline payoff is arithmetically
   unreachable (3 perfect parries per 2.4–3.6s possession) — worst *kind* of broken: looks
   shipped, silently isn't. Cheapest fix in this audit.
3. **STORMREND — WEAK.** No boss-unique loop for ~2/3 of the fight; the identity read is
   card-gated to the final card. One-def-line fix.
4. **THRUMSWARM — WEAK.** The registry's advertised puzzle read (condense/scatter timing)
   never manifests — one constant (1.1s) outlasts every authored rest. The soak loop saves it
   from FAIL. One-line fix.
5. **KARNVOW — WEAK.** Unique verbs are ~9 sparse moments per fight; the claimed rally loop is
   deferred by the registry's own admission.
6. **KNELLGRAVE — WEAK.** Excellent loop with one authored dead phase (P4: zero tolls, zero
   pockets) + a paper mechanic (the WE parry-card debut has no consumer).
7. **ONEWING — WEAK.** Excellent loop for ~78% of the fight; a plain first fifth, and mastery
   of the parry job deletes the loop with no replacement.

(From BOSS-FEEL-AUDIT, unchanged: ASHTALON / MARROWCOIL / HOLLOWGATE / BRINEHOLM — all
WEAK-class with plans already written.)

## RECOMMENDED BUILD ORDER (whole backlog — this audit + BOSS-FEEL-AUDIT folded)

Order logic: numbers-only fixes on bosses players hit earliest, then guarded engine
one-liners, then the two M-sized mechanics, then the recurrence primitive, then the capstone.
Each lands as its own PR + lesson file (THE RULE §2).

1. **MARROWCOIL rest/burst re-band** (FEEL §2 C.1 — S, def data). The progression sawtooth,
   felt by every player at stage 4.
2. **BRINEHOLM sway + reflectTargets** (FEEL §4 C.1+C.2 — S, two def lines). Removes an
   instant-death trap.
3. **EITHERWING holder reachability** (this audit §5 C.1 — S, two dials + wipe→decay). A
   shipped rework that doesn't function; cheapest honest win in the audit.
4. **THRUMSWARM `condHold` 0.4** (§7 C.1/C.2 — S, one line, scoped by construction). Restores
   the slot's identity read.
5. **STORMREND eye-anchor un-gate** (§2 C.1 — S, def data + test split). The earliest boss in
   the game with no unique loop becomes "chase the eye" all fight.
6. **HOLLOWGATE C.0 guard** (FEEL §3 — S, ships alone as a bug fix) then **C.1 THE DOOR
   OPENS** (M, own PR).
7. **EMBERTIDE duel/survival-card gate** (§13 — S, one line; can ride any nearby PR's test run
   but stays its own commit).
8. **KNELLGRAVE P4 toll continuity** (§10 C.1 → C.2 — S then S/M). The rework's dead phase.
9. **ONEWING grief transference + P1 trim** (§12 C.1+C.2 — S/M).
10. **ASHTALON stoop `recur` primitive** (FEEL §1 C.1 — S/M, the one new engine primitive;
    review it in isolation) — then the free riders: `recur` on EITHERWING's `figureEight`
    (§5 C.3) and, if preview asks, KARNVOW's `flankCutIn`.
11. **KARNVOW rally v2** (§9 C.1+C.2 — M). After `recur`, while recurrence semantics are fresh
    in review; the slot-9 showcase stops being a seed.
12. **KNELLGRAVE rhythm-parry chain** (§10 C.3 — M, own PR) — the §5i.C WE debut becomes real
    (or the docs stop claiming it).
13. **THE UNMASKED — Part D** (§14 — the capstone arc, two Fable passes). Last on purpose:
    the exam quotes the roster, so every loop above must work before the medley can.

This audit + BOSS-FEEL-AUDIT are the shared pre-build checkpoint for all of the above.
