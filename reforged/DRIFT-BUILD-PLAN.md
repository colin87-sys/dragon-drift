# DRIFT BUILD PLAN — systems, boss momentum, gauntlets + THE EMBER KEEL

*Child of [`FLOW-OVERHAUL-PLAN.md`](./FLOW-OVERHAUL-PLAN.md) (the merged parent — read it
for the diagnosis and the DRIFT north star; none of that is repeated here). This doc is the
**reconciled** output of two follow-on Fable design threads, each put through the parent's
adversary-audit step: Thread 1 (DRIFT systems/timing/boss/gauntlets — critic verdict
**GO-WITH-CHANGES, correctness 4.5/5**) and Thread 2 (the DRIFT HUD meter — critic verdict
**HARDEN-THEN-SHIP the meter, CUT the Ward from v1**). Where the critic cut or changed a
proposal, this doc records the post-audit verdict, not the original. The audit again caught
~⅓ of each draft — and surfaced two bugs that ship TODAY, no DRIFT required.*

---

## 0. TL;DR

- **Two shipped bugs are P0 prerequisites** — the unswept fatal gate (a speed-tunneling
  crash/skip lottery reachable at today's speeds) and crystal-wall survivors inside boss
  fights (the owner's reported bug; a one-line fix). DRIFT raises top speed, so both must
  land **before** the cap does.
- **One design question only the owner can answer blocks all DRIFT code** — does DRIFT
  *replace* `flowChain` or sit *alongside* it? §2. Do not start the currency until it's ruled.
- All DRIFT application is **consumption-side** — seed geometry stays byte-identical; the
  governor's honest invariant is "DRIFT contributes nothing above 130 m/s," **not** "the
  world never exceeds 130" (the shipped spine boost-out already peaks ~151, `config.js:214-217`).
- The HUD gets **one** element — THE EMBER KEEL — which *replaces* the combo slug **and**
  the Sky-Canyon flow crest: net element count goes **down** one. The boss "Ward" repurpose
  is **cut** from v1.

---

## 1. P0 PREREQUISITES — two confirmed bugs, shipped today

### Bug A — the UNSWEPT FATAL GATE (ship as a today-bug fix; hard prerequisite to DRIFT)

Rings are plane-swept — the catch test fires on the `prevDist < r.dist ≤ dist` crossing
(`rings.js:145`) so no frame rate can skip one. The **fatal gate is not**: it's a per-frame
overlap test `Math.abs(dz) < c.thick + R` (`collision.js:171`) with window
`2 × (thick 1.5 + playerRadius 1.2) = 5.4 m` (`level.js:564`, `config.js:7`), under a rawDt
cap of 0.05 s (`main.js:1652`).

The math: at ~108–121 m/s (orb 80 × ramp 1.35 = the priced `lineDesignSpeed` 108,
`config.js:23`; × High Winds 1.12 = 121 — **reachable TODAY, no DRIFT**) a 20 fps frame
moves 6.05 m > 5.4 m → ~**11% of slow frames skip the gate entirely** (no crash, no thread,
no phase — a lottery). At the DRIFT worst case 139 m/s: ~22%. The whole collider loop is
also `!game.inBoss`-gated (`collision.js:133`), which is correct (clean-arena law) but means
nothing else backstops it.

**FIX:** make the gate crossing swept at the lerped x/y — and it MUST resolve **all three
outcomes**, not just crash: **thread** (`threadGate`, `collision.js:200-203`), **phase**
(the Surge phase-through branch, `collision.js:180-198`), **crash**. A swept gate that only
kills would confiscate the reward exactly when the player is playing best.

*Consciously left unswept:* bar and shard are also per-frame tests (`collision.js:150-168`)
but they're non-fatal and a skip favors the player. Note it; don't fix it.

### Bug B — CRYSTAL WALLS INSIDE BOSS FIGHTS (the owner's reported bug; one line)

Boss entry wipes obstacles ahead with a **constant**: `clearAhead(player.dist + 800)`
(`boss.js:1869`). But the spawner lead is **speed-scaled**: `max(500, speed × 7)`
(`main.js:281`, `config.js:256-257`). Crossover: 800/7 = **114.3 m/s** — routinely exceeded,
especially by a canyon-DEFERRED encounter firing the moment the canyon ends
(`boss.js:2350-2353`) while the slip is still decaying → ~130 m/s → up to a ~111 m band of
already-spawned walls surviving past the 400 m exit buffer. The survivors are pure
decoration — colliders are skipped in a boss (`collision.js:133`) but the mesh and its
beacon still draw and pulse (`obstacles.js:2816-2824`). Un-threadable scenery mid-fight.

**FIX: `clearAhead(Infinity)`** at `boss.js:1869`. Verified safe: `clearAhead` removes
obstacle **entries only** (`obstacles.js:2959-2963`); a fight travels kilometres at the
locked 65 while `spawnAhead()` lays nothing (`main.js:284-288`); post-boss content comes
from NEW chunks and the grace band (`main.js:290-298`). Nothing behind Infinity is needed.

**VERDICT: REMOVE — do not repurpose the accidental survivors.** Speed-dependent presence
= a non-deterministic arena, and the clean-arena law is load-bearing (`main.js:284-288`).
**Keep the BEAT** as a future *authored*, flag-gated boss card: a boss deliberately raises
a crystal veil; a Surge + roll SHATTERS it (the `shatterT` FX already ships,
`obstacles.js:2805-2811`) for a DRIFT chunk + a stagger. Authored, deterministic, earned —
everything the accident wasn't.

---

## 2. ⚠ THE OPEN OWNER DECISION — blocks all DRIFT code

**Does DRIFT REPLACE `flowChain`, or sit ALONGSIDE it?** Only the owner can answer; every
downstream number (caps, bleed, the Keel's fold-in) shapes itself around it.

**Option A — REPLACE (unify combo + flowChain into DRIFT).** One currency, one meter, one
mental model; the Keel legitimately absorbs the flow crest. **But this smuggles a mechanics
change:** the flow run's stake today is *zero-on-miss* (`rings.js:264-266`) and its pump
peaks at slip **1.30** (`config.js:162-166`); DRIFT caps at **1.15** and *bleeds-never-
zeroes*. Flow runs lose both their hard stake and their higher ceiling — the game's current
best moment gets *softer and slower* unless the canyon amplification is retuned to
compensate.

**Option B — ALONGSIDE (DRIFT is the connective layer; flow runs keep their own pump).**
The shipped flow identity is untouched; DRIFT threads the ~80% between. **But** two
momentum currencies coexist (the exact "slipstream already means three things" naming
hazard the parent flagged), the canyonSlip chain multiplies **both** factors (1.30 × 1.15
= 1.50 at stack — the co-scale keeps it fair by construction but the tunneling math and
telegraph windows must be sized to it), and the HUD needs the Keel *and* the crest.

Present both; **do not decide it here.** The Keel ships either way (§6) — but the crest
fold-in is **last**, after this ruling (§6, info-loss).

---

## 3. Q1 — DRIFT-SPEED TIMING (the graded-window law, honestly applied)

**The law (geyser-law-clean):** survival is NEVER frame-gated; the PERFECT is *spatial*
precision at a deterministic crossing frame. The canyonSlip co-scale chain
(`player.js:27-31,165,214` — steer ×slip, targetSpeed ×slip, assist axes ÷slip) makes the
**saturated** steering-to-velocity ratio invariant, so the reach audit
(`level.js:220-238`) holds at any co-scaled speed. **But do not overclaim "invariant by
construction":** `moveAccel: 6` (`config.js:17`) is a TIME-domain damp (~0.5 s settle =
59% of an 0.85 s hop but 76% of an 0.66 s hop), so effective authority *per metre* still
degrades at the fat end. Hence the fixes:

1. **The swept gate** — Bug A, §1. Nothing else matters until it lands.
2. **FREEZE the catch radius at 3.9** (`config.js:112`). The ring glass is an affordance
   contract — "inside the glass = caught" (`rings.js:38-39`). Never scale it with speed;
   a lying aperture is worse than a hard one.
3. **HALF-compensate the perfect radius:** `perfectR = 1.4 × (1 + 0.6 × (F_total − 1))`
   → 1.53 at cap (base 1.4 = `ringCenterRadius`, `config.js:64`). `F_total` is the
   **co-scaled product only** — ramp/winds/orb are already priced into `lineDesignSpeed`
   108 and get no compensation. The 0.6 coefficient is a **GUESS** (the transient math
   suggests ~0.7+); A/B it with `tests/flowmeter.mjs`.
4. **Perfects PAY MORE at speed:** score ×1.30, DRIFT +0.10 vs +0.06 plain. Risk = reward —
   fast perfects become the best DRIFT sustain, so the skill loop points at the hard thing.
5. **TIME-NORMALIZE the gate telegraphs:** the beacon and core-glow ramps are fixed-METRE
   fades — beacon `(dz − 120)/130` (`obstacles.js:2817`), core `(200 − dz)/150`
   (`obstacles.js:2823`). Scale both by `k = max(1, smoothedSpeed / 65)` so the ~3–4 s
   telegraph holds at any speed. "Windows appear earlier" done honestly — **geometry never
   moves**, only the light comes on sooner.
6. **THE GOVERNOR:** `F = min(1 + 0.15·D, 130 / preDriftTarget)`. The honest invariant is
   "**DRIFT contributes nothing above 130 m/s**" — NOT "the world never exceeds 130" (the
   spine boost-out already peaks ~151, `config.js:214-217`). Consumption-side only: never
   suppress window SPAWNS by speed — that forks the course and breaks determinism.

All six are consumption-side → seed geometry byte-identical, the dual-profile determinism
test (parent §6) stays the gate.

---

## 4. Q2 — THE BOSS KEEPS DRIFT ALIVE AT LOCKED 65

The fight is event-rich — **97 unique `emit()` event names ship across `js/`** (64 emit
sites in `boss.js` alone) — so DRIFT feeds **listener-side, zero emitter edits, the 65-lock
untouched** (`player.js:217`).

**SHIP (feeds):**

| Feed | DRIFT | Source event | Notes |
|---|---|---|---|
| **F2** parry / riposte | +0.03 / +0.06 | `bossReflect` (`boss.js:2999`) / `bossRiposte` (`boss.js:5490,5501`) | streak already resets on a bullet hit (`collision.js:357-365`) |
| **F3** CLEAN spell-card | +0.15 | `bossCard` with the ENGINE's own `captured` flag (`boss.js:1074-1078`) | do NOT re-derive a hit-delta; `captured` also requires beating the timer — better anti-gaming for free |
| **F4** ride-the-mechanic | +0.04 | `slipGraze` / `orbitLap` / `gapThread` / `discPocket` / `beamGraze` (all shipped emits) | the boss's own verbs pay the connective currency |

**TUNE before ship:** **F1 graze-weave is INFLATIONARY as written** — the graze streak caps
at 30 (`collision.js:391`), so a per-graze Σ0.006·k ≈ +2.8 D pins the cap in one weave.
Shrink the coefficient **and** add a per-encounter cap ~+0.25.

**Bleed rules:** bleed **PAUSES** in a boss (the fight amplifies, never confiscates);
a hit −0.10 (a drop, never zero); defeat +0.20, carried into the grace band
(`main.js:290-298`) so you exit the fight faster than you entered.

**DRIFT manifestation at locked speed** (speed can't move, so what does?):

- **SHIP M2:** surge charge `grazeGain 0.34 × (1 + 0.3·D)` (`config.js:545`) — high DRIFT
  charges Surge faster.
- **SHIP M4:** FOV push + wind-streaks stay on through the fight (fixed-cost uniforms).
- **A/B M1:** rider fire `0.5 / (1 + 0.4·D)` (`config.js:566`) = a genuinely SHORTER
  fight — but the chip-DPS ledger is tuned to two decimals (`config.js:475-488`, the
  lockdps margins), so **re-run `tests/lockdps.mjs` + the kill-time sim gates first**.
- **CUT M3** (graze-band widening at high DRIFT): a positive-feedback loop that
  double-dips M2. Dead.

---

## 5. Q3b — GAUNTLETS

Gauntlets already feed DRIFT via `emit('ring')`/`emit('nearMiss')` — **zero code touched**.

**ADD:** a listener-side clean-run capstone **+0.12** on `gauntletCleared`
(`main.js:1736-1740`) — but "clean" needs the damage event's payload (`collision.js:353`):
`gauntletCleared` alone fires regardless of damage, so the listener must window a
damage-free span, not trust the event.

**DO NOT** make gauntlets slip-amplifier zones. The generator already refuses to stack
canyon + gauntlet (`level.js:647-662`) — the roles are deliberate: **canyons AMPLIFY
momentum, gauntlets TEST it.** A gauntlet that speeds you up is a canyon with worse walls.

---

## 6. THE DRIFT METER — "THE EMBER KEEL" (Thread 2, reconciled)

**SHIP the Keel:** the meter IS a piece of the ember line pulled into the HUD — a burning
hairline that **kindles** (a white-hot head draws left→right igniting coal-beads) and
**bleeds** (the head recedes, the length cools to char; floor = always ≥1 live coal — the
never-zero contract made visible). Built from the shipped flow-crest kit (the
`fc-trk`/`fc-fill`/`fc-ghost` triple, `ui.js:1208-1257`; the crest already "reuses the
stamina-arc SVG technique," `ui.js:585-589`). Value structure per AAA-PIPELINE:
**core** (2px white-hot caret head) → **bloom** (dragonfire ramp, reversed) → **dark**
(recessed char keyline).

- **REPLACE-not-STACK:** it replaces the combo slug AND the Sky-Canyon flow crest → net
  HUD element count DOWN one. It sits in the gauntlet cluster on the multiplier line, in
  the slug's box — **never grow the multiplier-line px budget** or it breaks the
  boss-note/spell-card px-affine anchors at `calc(64% + 54px)` (`style.css:2048-2059`).
- **Cheap:** fill writes are change-detected ≤4 Hz — cheaper than today's per-frame 60 Hz
  stamina-cell `setAttribute`s (`ui.js:870-876`).
- **Division of labour:** WORLD owns sensation (FOV/speed/streaks + `emberArc`/guide-line
  beads brightening at high drift); the HUD owns only the Keel. LIFE pips + SURGE gems
  untouched.

**CRITIC-MANDATED CHANGES (this is the spec — the pre-audit draft is dead):**

- **SHIP-BLOCKER 1 — COLOUR.** The danger token is `#ff4636` red-orange
  (`style.css:108`) — NOT magenta — and under the colour-blind presets it remaps to
  **amber/gold** (`style.css:110-113`) = the Keel's own hue. So DRIFT must read by
  **FORM + VALUE** (a charred horizontal line vs climbing diamonds), verified in all three
  CVD presets. "No state hue-only" is already law (`HUD-REDESIGN.md:467-471`).
- **SHIP-BLOCKER 2 — TWO FEVERS.** Surge fever already ignites the whole cluster. **KILL
  the "Drift Fever" ceremony**; use a stepped tier-4 glow instead (the crest heat-step
  precedent, `style.css:667-670`). One fever per game.
- **CUT "THE WARD" from v1** (the boss dead-bar repurpose). It edits a DOC-PROTECTED
  element (`HUD-REDESIGN.md:92-93,134-135` — the sealed arc "dims 40% and freezes"; the
  DIM is how the seal *reads*), it triple-reports a hit, double-reports graze (the cyan
  SKIMS chip already exists), and it's mechanically underspecified (does a ward charge
  absorb a hit? unstated). The dead-bar complaint is REAL — but its fix needs an **owner
  ruling amending the governing doc** plus its own spec, not a ride-along on the meter PR.
  v1 leaves the shipped sealed state untouched.
- **HARDEN:** register the Keel in hudState relevance (rest-ghost to 0.30 at cruise) —
  but never-zero DRIFT makes the `.combo`-gated slug rule permanently true
  (`ui.js:940-942`), so the Keel needs a **new rest rule**, not the slug's. Write the
  reduced-motion block. Numeric legibility gates: head ≥2 device px at `--hud-scale` 0.85;
  keel ≥48px at feverThreshold−8 portrait; head-vs-track luminance delta measured over the
  brightest biome.
- **INFO-LOSS (acknowledge, don't hide):** folding the flow crest loses the best-of-run
  notch, the knock-vs-shatter drop verbs (`ui.js:1239-1248`), and Sky-Canyon's cyan
  run-identity. And unifying combo+flowChain smuggles the §2 mechanics change. **Fold the
  crest in LAST, after the owner signs off the regressions.**

---

## 7. MISSED-ITEM POLICIES (the audit's extras)

- **A swept gate must AWARD, not just kill** — folded into Bug A's fix spec (§1).
- **Score-economy policy is needed:** DRIFT raises rings/sec → score/sec, which moves the
  challenge-link comparability the parent's §6 protects. Precedent exists —
  `glideAssistScoreMult` (`config.js:77-81`) already prices an assist into score. Write
  the DRIFT score policy (flat? priced? capped?) as its own small ruling before the cap
  ships; don't let it emerge from tuning.

---

## 8. THE ORDERED BUILD LIST

**P0 — prerequisites (ship today, no DRIFT flag):**
1. Bug A — swept fatal gate, all three outcomes (thread/phase/crash) + a headless
   crossing-at-speed test.
2. Bug B — `clearAhead(Infinity)` (`boss.js:1869`).
3. ⚖ **Obtain the §2 owner ruling** (REPLACE vs ALONGSIDE). Blocks everything below.

**CORE (behind `driftEnabled`, parent §5):**
4. The DRIFT currency + canyonSlip second factor + governor (§3.6) + freeze-catch-radius
   (§3.2) + time-normalized telegraphs (§3.5).
5. Boss feeds F2/F3/F4 + bleed-pause + hit/defeat deltas (§4); F1 with shrunk coefficient
   + per-encounter cap.
6. Gauntlet clean-run capstone (§5).
7. THE EMBER KEEL (§6) — Keel first, crest fold-in LAST after the §2 ruling + regression
   sign-off.

**TUNE-LATER / A-B:**
8. Perfect-radius coefficient 0.6 → A/B vs ~0.7 (`tests/flowmeter.mjs`).
9. Perfect pay ×1.30 / +0.10 curve.
10. M1 rider-fire scaling — gated on `tests/lockdps.mjs` + kill-time sim.
11. F1 graze coefficient + cap values.

**CUT (dead, do not revive without new evidence):**
- Repurposing accidental boss-crystal survivors (§1 Bug B verdict).
- M3 graze-band widening (§4).
- Drift Fever as a second ceremony (§6).
- THE WARD in v1 (§6).
- Gauntlets as slip-amplifier zones (§5).
- Speed-scaled catch radius (§3.2).
- Spawn-side window suppression (§3.6 — determinism fork).

**FUTURE (authored, flag-gated, own PR):** the boss crystal-veil SHATTER card (§1 Bug B).

---

## 9. VERIFY

- **Determinism:** `tests/gold-determinism.mjs` + the parent's dual-profile test (same
  seed, cruiser vs max-chain input → byte-identical geometry). Every §3 fix is
  consumption-side, so this must stay green untouched.
- **Tunneling:** a headless crossing test at 121 and 139 m/s × 20 fps asserting the swept
  gate resolves thread/phase/crash — never a skip.
- **Feel numbers:** `tests/flowmeter.mjs` for the perfect-radius A/B and the parent §6
  criteria (≥50% connective flight above ×1.05, longest zero-momentum stretch ≤8 s).
- **Boss economy:** `tests/lockdps.mjs` before any M1 change; F-feed caps asserted in a
  boss-sim test (one weave must not pin the cap).
- **HUD:** the §6 legibility gates + all three CVD presets + reduced-motion; `tricount` /
  `tiershots` unchanged (no new world geometry).
- **Three judges (AAA-PIPELINE):** machine numbers above → harsh Fable ≥4.2 on the Keel in
  the judged frame → owner feel on the PR preview ("does the gap between canyons now feel
  like part of the run?").
