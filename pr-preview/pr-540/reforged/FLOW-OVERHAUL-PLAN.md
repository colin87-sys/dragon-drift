# FLOW OVERHAUL — "It doesn't flow" → one continuous, accelerating ride

*Produced 2026-07-18 by a Fable-directed research pipeline: 6 parallel research agents
(3 code audits of `reforged/` + 3 external game-design studies) → a Fable gameplay-director
synthesis → a harsh Fable critic that fact-checked the plan against the shipped code. This
doc is the **reconciled** result: where the director and the critic disagreed, the critic's
code-grounded correction wins (it read the files). Read §1–§2 for the why, §5 for what to
actually build.*

---

## 0. TL;DR

**The game already built its best flow system — the `canyonSlip` co-scaling pump — and then
locked it inside occasional FLOW canyons.** The other ~80% of the run has no momentum thread:
combo is score-only (never touches speed/FOV/camera), and boost bleeds faster than you can
refill it, so the default state is a slow cruise between isolated set-piece spikes. That gap —
peaks separated by valleys where the game mechanically *confiscates* momentum — is what "doesn't
flow" feels like.

**The fix is not more content. It's one always-on momentum currency** (call it **DRIFT**) that
every verb feeds, that physically manifests as world-speed + FOV + wind-streaks, that **bleeds
but never zeroes**, and that every set-piece **amplifies** instead of resetting. Freeing the
system that already exists is **~200 lines on rails that already ship.** Everything else in the
plan should be judged by whether it feeds that one currency — and about a third of the first-draft
plan didn't survive contact with the code.

**The critic's headline finding: a global speed multiplier already ships** — the "High Winds"
daily mod (`mods.speed: 1.12`, `daily.js:20` → `player.js:213`) with zero geometry divergence.
So the scariest risk (does variable speed break the deterministic course?) is ~80% retired by
existing precedent. **The course is DISTANCE-indexed — confirmed by reading `level.js`.**

---

## 1. THE DIAGNOSIS (why it doesn't flow)

**Root cause:** the one "hold the line → the world rushes faster" system (`flowChain` → `canyonSlip`)
lives *only* while `game.canyonRun === 'flow'`, and the connective majority of the run has no
momentum thread at all.

Contributing causes, each fact-checked against the shipped code:

1. **The connective tissue is dead air.** `combo` (max ×5) is a *score multiplier only* — `collect()`
   touches score/stamina/fever but never speed (`rings.js:183-215`); `player.update` derives speed
   from ramp/boost/orb/mods/`canyonSlip` only (`player.js:209-218`). Between set-pieces there is
   nothing to *sustain*, so nothing to flow *with*.
2. **Boost is a net-negative bleed.** Drain 20/s (`config.js:36`) vs ~10.5–16/s max ring income;
   full bar 110 = **5.5 s of boost**; even Surge's ×0.65 relief (→13/s) can't break even. The
   "hold-boost-and-carve" fantasy is mechanically unsustainable — play collapses to ~47 m/s cruise.
3. **Set-piece exits are momentum cliffs.** Flow-canyon exit hard-zeros the pump (`game.flowChain = 0`,
   `main.js:1715`). Boss entry locks speed to `cruiseSpeed:65`, disables boost (`player.js:127`),
   stops rings + zeros combo (`rings.js:145`, `main.js:1814`), and the pump is *never referenced in
   `boss.js`*. So for 1–3 minutes the game you were playing stops and a different one runs.
4. **The best system is hidden and under-taught.** The pump has no HUD meter, appears in ≤46% of
   canyons (rock archetype disabled + aurora bias), and players never learn it exists.
   *(Correction to the first-draft diagnosis: the ribbon-orb "contradiction" is mostly already fixed
   in code — orbs sit on the carved line, the centre gate orb is drop-exempt, and a drop halves rather
   than zeros, `powerups.js:137-145`. What's missing is the HUD telling the player any of it.)*
5. **The dodging layer is decoration.** 3 of 4 obstacle types are authored *outside* the flight
   envelope by construction (`level.js:262-308`), so they read as scenery you drift past; only the
   fatal gate forces a line. **6 of 8 biomes have no native hazard** (only Caldera geyser + Tempest
   lightning ship). *(Correction: `difficulty()` is distance-based and is NOT flat — it ramps over
   1800 m then keeps a +0.25 tail slope forever, `level.js:174`. The thing that plateaus at 90 s is
   the separate **time** speed-ramp, `config.js:20-22`. So the honest lever is the speed ramp, not the
   difficulty curve.)*

---

## 2. THE NORTH STAR

**The feel:** *You are always one good move away from going faster — and the world visibly, audibly
leans into you when you do.*

**The connective thread — DRIFT** (the game is called Dragon *Drift* and nothing in it is named drift;
also, "slipstream" already means three different things in the code, so the new currency needs its own
name). One persistent momentum currency, an evolution of the existing `combo`/`flowChain` pair, that:

- is **fed by every verb** — rings, barrel rolls, near-misses, pump carves, dives, boss grazes;
- **physically manifests** as a world-speed multiplier + FOV push + wind-streak post-FX (a fixed-cost
  shader uniform, **not** particle scaling);
- **bleeds, never zeroes** — mistakes and empty stretches drain it like a savings account; only death
  empties it;
- is **amplified** inside canyons and bosses rather than replaced or confiscated.

Rings feed it, boost spends it at ~break-even while it's high, Surge is its overdrive, canyons compound
it, bosses test it. One loop, no valleys.

---

## 3. THE RESEARCH, IN ONE SCREEN

**External games converge on one root cause and one cure.** Every great flow game (Tiny Wings, Alto,
OlliOlli, Tony Hawk, Race the Sun, Sonic, Panzer Dragoon, Furi, Hades) treats momentum as a **savings
account you spend and refill, never reset to zero**, and makes the *gap* between beats part of the loop.
The transferable laws that shaped this plan:

- **Speed IS the score** and skill visibly buys more of it — drive the *feeling* with fixed-cost post-FX
  (FOV, streaks, vignette), never particle counts (Alto, Race the Sun).
- **A combo that survives empty stretches is the connective tissue** — give a low-effort "manual"
  (the barrel roll) so a skilled player bridges ring-less sea (OlliOlli, Tony Hawk).
- **Forgiving graded windows, never binary frame-perfect-or-crash** — this is the geyser-timing law,
  externally confirmed: reward precision, never require it. Superman 64 rings are the anti-pattern;
  Sonic rings (on the fast line) are the pattern.
- **Compose ride-LINES** (trough → ring-arc → swell), don't scatter obstacles.
- **Bosses are a PEAK in one continuous rhythm, not a separate game** (Panzer Dragoon / Star Fox /
  Sonic keep the same camera, controls, and verbs). Reuse the ride verbs AS combat verbs (Furi ships
  10 bosses on 4 verbs; Titan Souls on 2). Telegraph → calm-before-storm → seamless gear-shift →
  phased crescendo → recovery exhale (Hades hard-codes a non-combat room before every boss).

**The wind-run verdict** (both the code audit and the pump research agree): the owner's "wind run"
is **~80% already built** — `flowChain` *is* skateboard pumping. Build it (if at all) as a **vertical
potential-energy pump orthogonal to the existing lateral carve** — static, player-entered updraft
pockets, dive-to-convert on a gradient payout, zero penalty for skipping. A *separate* wind-momentum
system would just duplicate `flowChain` and is rejected. **The geyser run stays rejected** — a hazard
that erupts on a cycle you must sync to is unfair against the dragon's fixed forward speed.

---

## 4. THE DIRECTOR'S PLAN (as proposed) vs THE CRITIC'S VERDICT

Each initiative below carries the critic's **KEEP / FIX / CUT** verdict after fact-checking the code.

| # | Initiative | Verdict | The code reality that decided it |
|---|---|---|---|
| **P0.1** | **DRIFT Everywhere** — combo tier drives persistent world-speed × + FOV + streaks, reusing the `canyonSlip` co-scale rail | **KEEP** (the whole plan lives or dies here) | The `canyonSlip` rail is real and *better than the plan knew*: it already co-scales speed AND steering AND divides the assist axes (`player.js:27-31,165-167`), which is what keeps reachability fair. **Must** be a second factor in that exact chain, never a parallel speed path. |
| **P0.2** | Boost break-even while chaining (drain → ~12) | **FIX** | Drain 12 = *infinite* boost; it deletes boost-as-resource AND Surge's ×0.65 relief (13/s). **Save: drain ~15 at combo tier ≥3** → long boost, never free; Surge stays meaningful. |
| **P0.3** | Kill momentum cliffs (flow-exit convert 50%, post-boss ramp, boss entry preserves DRIFT) | **FIX** | Flow-exit convert is a real one-liner. But "400 m dead air" is false — the buffer suppresses gates/obstacles only; rings/orbs/embers still spawn (`level.js:759-770`), so **skip the run-out**. `RUSH_BREATHER` is a rush-mode *constant* (`boss.js:68`), not portable — the post-boss ramp is honest **new** spawner code on `resume()` (M, not S). Carry the *currency*, not velocity — keep the cruise lock. |
| **P0.4** | Roll-manual + pump meter | **FIX** | Combo has **no time decay** (resets only on miss/damage), so "roll holds decay" protects against nothing — **cut it**. Roll-through-ring triple: keep. The orb mechanic is ~80% already fixed — **ship the HUD + explanation, don't re-engineer the mechanic.** |
| **P0.5** | Difficulty as a slope | **FIX** | Diagnosis misread the code: `difficulty()` is distance-based with a forever +0.25 tail (`level.js:174`); the plateau is the *time* speed-ramp. **Do NOT move pillars in-lane** — fairness is by construction (`pathClearance:5` + reach audit). **Save: shrink `pathClearance` + scale gate cadence with distance, behind a seed version.** |
| **P1.1** | **The WIND RUN** (vertical pump, updraft pockets) | **SHELVE / downscope** | Not redundant (vertical *is* a new verb) — but the flight envelope is y∈2.5–22 (`config.js:5-6`); "rise to bank altitude" has **~13 usable metres**, a full dive lasts **<1 s**. There is no altitude to bank without a locally raised ceiling (touches camera, spawn bands, gate clamps, reach audit) → that's an **L**, its own PR. **Downscope now: "updraft pockets feed DRIFT directly" inside the current envelope (S, shippable).** |
| **P1.2** | Ride-Lines (spline-arc rings) | **FIX → reuse** | `emberArc` already traces the ideal line (`level.js:376-390`) and the flow ribbon already IS a spline emitter. New emitters are redundant. **Save: raise emberArc density + wire near-miss → DRIFT (one line).** |
| **P1.3** | Drift Fever (sustained-max overdrive) | **KEEP** | Deterministic run-state function; magnetized rings are a position-lerp (no perf cost); Surge precedent exists. One guard: don't double-dip the fever score mult. |
| **P1.4** | Biome Hazard Pass (fill the 6 empty biomes) | **KEEP** | Verified: exactly two `hazard:` blocks ship. New hazards must be **dodged in space, never in time** (the shipped geyser is pulse-timed yet legal because you weave around it laterally, zero knockback). One biome per PR; `hazardRnd` stream makes it determinism-safe. |
| **P1.5** | Boss Gear-Shift (approach trough → gear-shift → recovery) | **FIX → merge** | The encounter already has warn→approach phases (`boss.js:119`) — build the trough into the *existing* approach phase, don't add a pre-state. Currency-bank at entry: keep, respects the cruise lock. |
| **P1.6** | Ride-Verb Boss Pass | **CUT core, salvage 1 prototype** | **Boost re-enable: CUT** — `player.js:125-127` frees the 2nd finger for the Surge tap (a mobile UX decision) and bullet speeds are tuned against `cruiseSpeed:65`; re-enabling re-tunes every volley across 14 bosses. **~20 s mini-boss cadence: CUT** — near-constant rig build/teardown is the worst 60fps item in the plan. The LOCK layer is the shipped combat verb (LAW-tagged). **Salvage:** `spawnBossRingHoop` already exists — prototype "fly the hoop-chain = chip + DRIFT" on ONE hero boss, flag-gated, boost stays off, LOCK untouched. |
| **P2** | Rock-archetype "obstacle run", boss×biome×run coupling, daily mutators | **SHELVE** | Fine as direction, zero design work now. The rock kit is preserved behind `canyonTypeWeights.rock:0` — revival costs nothing to wait. |

**Deliberately rejected (the guardrails):** pulse-timed hazards (geyser run); a separate wind-momentum
system parallel to `flowChain`; bosses as their own mode; removing bosses from the run; a standalone
new obstacle mode; combo hard-resets anywhere; particle-scaled speed feedback / updraft fountains;
new boss-only controls (reticle/extra buttons); boss failure ending the endless run.

---

## 5. THE HARDENED SHORTLIST — build this, in this order

**BUILD:**

1. **P0.1′ "DRIFT Everywhere"** — the currency, fed off the **event bus** (`emit('ring'/'roll'/'nearMiss'/'orb'/'flowChain'…)` already fires everywhere, so one new subscriber module feeds DRIFT with *zero edits to any emitter*). Apply it as a **second factor in the `canyonSlip` co-scale chain** (never a parallel speed path), damped, cap **×1.15**. **Re-spec `miss()`/damage from hard-reset to a tier-DROP** (this is the real design decision — combo as shipped IS a reset currency, which contradicts "bleeds never zeroes"; resolve it before writing code). FOV push + fixed-cost wind-streak uniform. Behind a `driftEnabled` flag.
2. **P0.4b + P0.4a′** — pump-meter HUD + drop-explanation (mechanic untouched); roll-through-ring triple (decay-hold cut).
3. **P0.3a + P0.3c** — flow-exit converts `flowChain`→DRIFT at 50% (`main.js:1715`; skip the run-out); boss entry banks DRIFT as graze/shield credit.
4. **P0.2′** — `staminaDrain` → **15** while combo tier ≥3 (never break-even 12).
5. **P0.5′** — extend `speedRampEnd`/tail slope + scale gate cadence & `pathClearance` with distance, behind a seed version. **No in-lane pillars.**
6. **P0.3b** — post-boss re-entry ramp via a `resume()` hook (budget it as an honest M).
7. **P1.3** Drift Fever → **P1.4** biome hazards (one per PR, space-dodge law) → **P1.5′** gear-shift merged into the approach phase → **P1.2′** as an emberArc-density dial.

**PROTOTYPE ONLY (flag-gated, one hero boss):** rings-as-chip via the existing `spawnBossRingHoop`;
boost stays disabled; LOCK layer untouched; one tell vocabulary. Owner judges feel before any migration.

**SHELVE:** the full Wind Run (until a raised-ceiling set-piece envelope is designed as its own PR — or
ship the S-sized "pockets feed DRIFT" version inside the current envelope); all of P2.

**KILL:** boost re-enable in boss; the ~20 s mini-boss cadence; pillars on the reward line; the
roll-holds-decay no-op; new spline-arc ring emitters; the redundant ring-arc run-out; drain-12
break-even boost.

---

## 6. THE HERO PROOF (build first, prove before migrating)

**Build #1 (DRIFT Everywhere) behind `driftEnabled`, default off for the shipped roster.** Hero = the
standard daily-challenge seed, played start → first boss → first flow canyon. It attacks the root cause
directly: it gives the connective 80% its missing thread, makes boost sustainable as a *skill reward*
(cruise stays the floor), and gives the roll a connective job. Everything else amplifies this thread;
nothing else works without it.

**Verify with the existing harness** (`reforged/tests/flowmeter.mjs`, `tools/tricount.mjs`,
`tools/tiershots.mjs`) plus **two additions the critic requires:**

- **Tunneling check.** Stacked worst-case speed ≈ orb 80 × ramp 1.35 × winds 1.12 × drift 1.15 ≈
  **139 m/s** → ~7 m/frame at the 20 fps rawDt floor, vs gate thickness 1.5 (`level.js:564`) and
  `canyonThick` 2.2. Rings are already plane-swept; **verify obstacle/gate collision is plane-swept too —
  if any test is per-frame-sphere, the drift cap waits on fixing it.**
- **Dual-profile determinism test.** Same seed, two synthetic input profiles (cruiser vs max-chain) →
  assert byte-identical geometry output. Cheap, retires the determinism risk forever.

**Numeric success criteria:**

- ≥ **50%** of connective flight above ×1.05 world speed (currently ~0% — combo touches nothing).
- Boost uptime per run ≥ **3×** current (from ~5.5 s/bar rationing to sustained-while-chaining).
- Longest zero-momentum stretch ≤ **8 s** outside deliberate breathers.
- **No frame-time regression** on the weak-mobile reference (the feedback is one shader uniform + FOV
  lerp; also measure `ringCount()` at cap — spawn lead grows with speed, `config.js:256-257`).
- Same seed → identical geometry (dual-profile test) + challenge-link score comparability.
- Owner check: *"does the gap between canyons now feel like part of the run?"* — the question this whole
  plan answers.

---

## 7. OPEN RISKS still live after the audit

1. **miss()/damage re-spec is a real design fork**, not a wiring detail — combo as shipped hard-resets
   (`rings.js:263`, `collision.js:348`); "bleeds never zeroes" requires re-specing it to a tier-drop.
   Decide the exact drop curve before P0.1.
2. **Speed compounds difficulty** — faster world + tighter gate cadence stack; ×1.15 is a starting guess
   and may need ×1.10, or telegraph distance scaled with DRIFT.
3. **Boost break-even tuning** — drain 15 @ tier ≥3 needs real passes so stamina still matters and Surge
   keeps its identity.
4. **The boss prototype is a fork in the road** — rings-as-chip competes with the shipped LOCK grammar;
   the owner must judge whether one hero boss keeps its identity before any migration talk.
5. **"Bleed not zero" could flatten stakes** — bleed rates need a real curve, and death-as-only-zero must
   actually feel consequential.
6. **HUD load** — reuse, don't add. Ring-heat already shows combo/flow (`rings.js:113-115`), the UI has a
   speed-tunnel ignition state (`ui.js:888`). Show DRIFT in the *world* (FOV, streaks, heat); one number
   max on the HUD, zero new gauges.

---

*Process note: this plan is the output of a 6-research-agent → Fable-director → harsh-Fable-critic
pipeline. The critic's fact-checks (High-Winds precedent, distance-indexing, the event bus as the
implementation spine, the ~13 m wind-run envelope, the boost-disable UX rationale) corrected the
director in several places — which is exactly why the audit step exists. Build §5 top-down; judge every
future addition by whether it feeds DRIFT.*
