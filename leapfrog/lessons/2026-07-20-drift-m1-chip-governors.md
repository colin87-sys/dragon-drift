# 2026-07-20 — DRIFT M1: the gate a green suite can't be, and the lance-blind trap

**Did / learned.** Shipped DRIFT M1 (a well-flown boss fight is a SHORTER fight): the rider
chip quickens with earned DRIFT via one line at `reforged/js/boss.js:3516` —
`riderTimer = (interval / (held × driftChipMult())) × (surge ? surgeRiderMult : 1)`. The
helper `driftChipMult()` (`drift.js`) is `1 + 0.30·min(D, 0.5)` → ceiling ×1.15 (the
`chipRateMult` LAW magnitude), with TWO governors both inside the helper: **fever-EXCLUDED**
(returns 1 when `game.feverActive`) and **D-clamped**. Fable pre-assessed the number DOWN
from the plan's 0.4 to 0.30, and the harsh critic verified SHIP: A/B kill-time 0.89–0.94
(6–11% shorter, deeper on longer fights), surges still ≥3, every card resolves.

**The trap that would have shipped a hole:** the plan said "gate M1 on `tests/lockdps.mjs`."
**lockdps's deleter model is LANCE-ONLY** (`tools/lockdpsCore.mjs` sums lance pips + scar-burn;
there is no rider term anywhere in the file), so it stays green at ANY M1 value — the named
gate was **structurally blind** to the thing being changed and would have passed vacuously.
The real gates had to be written for M1: `tests/driftchip.mjs` (pure-math ceiling law + the
VOIDMAW-P1 razor) and `tests/driftm1life.mjs` (a live-lifecycle A/B).

**The other gotcha — the phase-DELETER floor is structural, not a DPS margin.** The base D=0
chip already out-carves some bosses' card-timer HP spans (VOIDMAW P1 sits at 1.007×); the
first draft asserted an absolute "chip never out-carves the card" floor and correctly FAILED
on shipped bosses. What actually holds a phase is the **shield** (only a Surge unleash breaks
it), and M1 is fever-excluded, so during the Surge that advances a phase M1 is OFF — chip can
never skip a phase regardless of its rate. The right invariant is therefore *bounded
contribution* (M1 adds ≤×1.15, is 0 at D=0/fever, never touches the base channel), not an
absolute card-timer floor.

**→ Systematize.** Three reusable rules. (1) **A test named as a gate must be able to FAIL on
the change it gates** — before trusting "gated on X.mjs," confirm X actually models the
channel you're touching; if it can't, the gate is theater and you must write the one that can.
(2) **Fever/Surge is the load-bearing exclusion for any in-boss DRIFT expression** — verify the
`surge` signal at the *call site* and the `game.feverActive` read in the *helper* are the same
signal AND that the only intra-frame divergence is the safe direction (fever-flips-ON → M1 sees
it and returns 1; the dangerous surge=true/fever=false frame must be impossible). (3) **When a
headless economy test needs the real feed pipeline, pin state through `emit()`, never a
test-only setter** — `driftm1life.mjs` pins D→1 with a captured-card emit each frame (bleed is
paused in-boss so it holds), which proves the feeds as a side effect.

**→ Leapfrog.** DRIFT's in-boss manifestations (M2 faster Surge, M1 faster chip, M4 FOV) are
now all shipped and gated; the currency is feature-complete behind the flag. Two ledger debts
the critic surfaced for their own follow-ups: (a) the **karnvow footwork seeded-assert is
flaky** — 3/17 failures reproduced on the pre-M1 base commit, spreads as low as 0.40 vs a 1.3
bar; its own comment admits the seed "doesn't cover every random consumer," so it needs a real
deterministic seed or a widened band. (b) The `driftm1life` 0.80 gut-floor is loose vs the
observed 0.889 — fine now, tighten if a future dial creeps the ratios toward 0.85. Next on the
roadmap: the parked reflect-melt owner call, then the hazard overhaul (Caldera geyser hero).
