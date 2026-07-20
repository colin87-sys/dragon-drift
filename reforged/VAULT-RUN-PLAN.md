# VAULT RUN — build-ready plan ("hopscotch on fire", Emberfall Caldera)

**Status:** PLAN — rev 2 (post-audit, post-owner). Rev 1 scored **3.5/5 challenge-first**
(below the 4.2 floor): the skill was mis-placed on forward-arrival timing (unfair at high
fixed speed), the fairness math failed the real speed band, and five architecture seams
were unsound. This rev folds in the owner's authoritative decisions + all five blockers.
Nothing built. All numbers are STARTING dials, single-sourced in a proposed `CONFIG.VAULT`
block so retuning never forks math. **Read first:** `LEAPFROG.md` + `leapfrog/lessons/`,
`BIOME-DESIGN.md` (§5.3, §8, §10), this file. Structure follows `ROCKRUN-STRAIT-HANDOFF.md`.

---

## THE GOAL (owner's words + the mandate)

> The latest Rock Run was rejected as **"beautiful but BORING — there was no challenge."**

The Vault Run is built **CHALLENGE-FIRST**. It is a skill test with a mastery curve,
failure that stings (but is fair), and a reason to replay for a clean chain. Beauty
serves the challenge; any choice that is prettier-but-easier gets cut. Every section
answers: *where is the challenge, and how does it escalate?*

**The mandate:** `BIOME-DESIGN.md §10` names **Caldera geyser-LAUNCH (impulse, the
`tryRoll` velocity-kick pattern)** as the FIRST kinematic verb sanctioned for adoption;
rollout row 10+ sanctions it "behind default-off data." This run opens the two empty run
axes at once: **VERTICAL movement** and **FORCE-DRIVEN movement**. The three shipped runs
(rock/spine/flow) are all continuous lateral thumb-steering; the Vault Run is discrete,
explosive, and vertical.

**The concept — the same object read two ways.** Caldera's magenta geyser vents
(`js/hazards.js`, biome increment 3) are a dodge-only HAZARD in normal cruise. Inside the
Vault Run, a vent you **commit a dive into as it erupts** launches you into a ballistic
arc; thread the reward ring on the way up; dive to the next vent; repeat 14–18 times down
a rhythm that progressively desyncs and crowds. In cruise the vent burns you; in the run
the launch reading REPLACES the burn on a launch entry (owner decision #1). The duality is
the setting, not a damage tax.

---

## THE OWNER'S THREE DECISIONS (authoritative — they shape everything below)

1. **No damage for a mistimed / shallow launch entry.** At a fast fixed speed (e.g. Solar
   at boost) the player cannot precisely control forward arrival, so punishing arrival is
   unfair. A poor entry yields a WEAKER launch (lower apex, less chain) — never a burn.
   The vent's burn stays ONLY in normal Caldera cruise. (The telegraphed apex GATE-vent
   can still deal the shipped burn if unrolled — but that is a dodge the player *controls*
   with a timed roll input, not entry timing.)
2. **Skill = dive-quality, not forward-arrival-timing** (the Alto / Tiny-Wings principle:
   forward motion is automatic; skill lives in the action you PRESS). The skill lives on
   axes controllable at ANY speed: **(a)** WHICH vent to commit to (lateral routing among
   ripe vs charging vents), **(b)** HOW cleanly you DIVE into the erupting core — a
   committed low dive into the base = full launch; a lazy high skim = weak launch (dive
   depth/line is 100% player-controlled regardless of forward speed), **(c)** steering the
   arc through the apex ring, **(d)** rolling the apex gate (a timed input), **(e)** aiming
   the dive into the next vent. Forward-arrival is demoted to "nice when the cadence lines
   up," never a pass/fail gate.
3. **No floor/sea consequence on descent.** Missing the next vent already breaks the chain
   + slows the world — sufficient self-inflicted stakes. A non-lethal water-skim BOUNCE
   (touch sea → knocked off your line, a control cost not health) is held in RESERVE as a
   named tuning dial only, not shipped.

---

## THE DESIGN

### 1. WHERE IS THE CHALLENGE? (the skill, precisely)

Five stacked skills, introduced in order, all active by the finale — **all controllable at
any dragon speed** (the rev-1 fix):

1. **THE ROUTE (which vent).** From act B, a segment presents 2+ vents offset laterally,
   out of phase: one erupting NOW, others charging. Read the field (the shipped `charge²`
   telegraph, `hazards.js:97-98`, brightens late so ripeness is legible ~90m out) and lane
   yourself onto the one that will be ripe when you arrive. Pure lateral steering — full
   authority at every speed.
2. **THE DIVE (how cleanly).** The core skill. A **committed low dive into the vent base**
   (steep descent line, entry near the base) → full impulse → threads the apex ring. A
   **lazy high skim across the top** → weak impulse → apex falls short → ring missed. Dive
   quality is a pure function of the player's Y line and entry depth at the crossing frame
   (§3) — 100% player-controlled at any forward speed. This is where "the action you press"
   lives.
3. **STEER THE ARC (the force is not a cutscene).** On the rise the jet owns Y; the player
   keeps ~55% lateral authority to bend toward laterally-offset apex rings (±4 mid-acts).
   **DIVE-CANCEL** (§4) makes the descent a decision on every arc. ~70% lateral authority
   returns on the descent for the dive-aim into the next vent.
4. **THE APEX ROLL (a timed input).** From act B's back half, an off-line **gate vent**
   erupts across your apex line — its column has no Y test (`hazards.js:116-122`) so it
   clips you at apex unless you **barrel-roll through it** (the shipped 0.5s i-frames,
   `CONFIG.rollInvuln`). This is the one place the shipped burn survives — a telegraphed,
   player-controlled dodge, not an entry tax.
5. **AIM THE NEXT DIVE.** The descent line is chosen to arrive on the next chosen vent's
   base with a committed dive angle — chaining skill (b) into (a) into (b).

**Anti-passivity guarantee (kept from rev 1, strengthened).** There is no auto-launch,
no proximity magnetism, no cutscene. The launch fires ONLY when the player's position
enters the erupting cylinder — the exact shipped collision test, read a second way — AND
only scales to full strength on a clean dive. A passive player gets weak launches, missed
apex rings, a dead chain, and a barren low corridor. The reduced-input ballistic phase
(~40–50% of run time) is broken up by dive-cancel + a mid-arc demand pulled into act B
(gate vent / alt-side cluster) so no stretch plays as passive float (the auditor's flag).

### 2. THE THREE READINGS OF AN ERUPTING VENT (the duality, damage-free inside the run)

One eruption window (0.8s, `CONFIG.hazardBurstDur`). Inside a vault run:

| Entry | Result |
|---|---|
| **Clean dive into an erupting base** (dive quality `d ≥ ~0.9`) | Full derived impulse → arc apexes **on the fixtured ring** (§3, exact by construction). +3 chain. Crown flash. **No damage — ever, for any entry timing** (owner #1). |
| **Shallow / late dive into an erupting vent** (`d < 0.9`) | Weaker impulse → apex falls short of the ring → apex ring missed, only low pickups catchable. +1 chain. **Still no damage.** The lost ring + weaker slipstream IS the cost. |
| **Dormant / not-yet-erupting crossing** | Nothing fires (matches shipped: collision only while erupting). No launch, no apex ring → **chain = 0** via the rings.js miss branch flow uses. The dead vent + slowing world is the read. |

The burn (`hitPlayer(…, CONFIG.hazardDamage, 'geyser')`) survives inside the run in exactly
ONE place: an **unrolled apex GATE-vent** (skill 4) — telegraphed, roll-clearable, player's
call. Entry timing is never punished.

### 3. THE BALLISTIC ARC + THE FIXED-RING FAIRNESS PROOF (B2/B3/B4 solved together)

Today the player has no gravity — `velocity.y` is damped toward `axes.y × verticalSpeed ×
steer` (`player.js:167`). The launch adds a bounded state:

```
player.launch = { t, vy0, g }        // set on a launch entry; null otherwise
on entry:  entryY = position.y at the crossing frame            // ANY height (B4)
           d      = diveQuality(entry depth, descent angle) ∈ [dMin 0.7 .. 1.0]  // skill (b)
           vy0    = d · √(2·g·(ring.y − entryY))                // DERIVED to the FIXTURED ring
while active:
           velocity.y = vy0 − g·t     (input Y ignored on the rise)
           near apex (|vy| < floatBand 5): g × apexFloatGravMult 0.55 → ~0.34s hang
           lateral authority × 0.55 (rise) / 0.70 (descent)
           FORWARD SPEED capped: targetSpeed damps toward VAULT.launchCruise (58) — boost/orb
                                 intake suspended ("the jet owns your momentum") (B3)
           dive-cancel (§4): a tap zeros the float and restores g early
ends when: position.y ≤ handbackY 5.5  OR  t > 2.8s (failsafe)
handback:  velocity.y eased into the normal damp over 0.3s (no floor-slam)
```

**B2 — NEVER move the ring; derive the impulse to it.** The apex reward ring is a normal
fixtured canyon ring, generated deterministically by the vault segment (pure function of
segment fields, zero runtime mutation — the rev-1 "reposition ring in-run" sin is deleted).
The VENT is placed in generation at `ring.dist − ringLead` into the **non-fixtured**
`out.hazards`. At runtime the impulse is **derived from the ring**: `vy0 = d·√(2g·(ring.y −
entryY))`. For a clean dive (`d=1`) the vertical apex equals `ring.y` and lands at the
ring's distance (`ringLead = launchCruise·√(2(ring.y−entryY_nominal)/g)`, computed per
segment in generation). **`out.rings` is byte-identical forever** → `gold-determinism.mjs`
(`JSON.stringify(out.rings)`) passes at `vault:0` AND at the V4 flip; old challenge links
stay valid. This also kills **B4**: because `vy0` scales with the *actual* `entryY`, a
player cruising at y8 launches to the same ring as one at y3.5 — no laneMaxY-fighting
overshoot. (Fallback if any residual overshoot appears: an entry mouth-band note clamps the
usable entry window; not expected given the derivation.)

**B3 — cap forward speed during launch, then the honest table over the FULL band.** The
rev-1 table stopped at 80; the repo's reach-audit speed is `lineDesignSpeed = 80×1.35 =
108` (`config.js:23`), and vault slip stacks on boost+orb (`player.js:214`). Capping
forward speed to `launchCruise 58` during the launch state (suspending boost/orb, damping
down) normalizes carry so the arc is speed-invariant AND makes the dive line controllable
on every dragon. With `g=24, launchCruise=58, ring.y=17, entryY=3.5` (Δ=13.5): `vy0(d=1)
= √648 = 25.5`, apex time `T = 1.06s`, `ringLead ≈ 61.5m`, apex = **17.0 = ring.y** ✓. The
honest fairness axis is now **dive quality**, not forward speed (which is capped). Height at
the ring's distance is `entryY + 2dΔ − Δ`:

| dive quality `d` | height at the ring | vs ring catch band 13.4–20.6 |
|---|---|---|
| 1.00 (clean base dive) | 17.0 | **center — perfect** |
| 0.95 | 15.6 | caught |
| 0.90 | 14.3 | caught (edge) |
| 0.85 | 12.9 | **missed** (below floor) |
| ≤0.80 (lazy skim) | ≤11.6 | missed |

So a clean dive threads the ring **at any dragon, any entry height, by construction**; a
sloppy dive legibly misses. The **placement function and the `?debug=reach` audit share ONE
implementation** — a float-inclusive integrator (W4: `apexFloatGravMult 0.55` adds ~0.34s
hang, so the closed-form parabola under-reads the arc near apex; the audit must integrate
the actual float term, not the float-less parabola). Retuning `g/launchCruise/dMin`
re-derives this table from the shared function.

### 4. DIVE-CANCEL + ESCALATION (14–18 segments, three acts + finale)

**DIVE-CANCEL (the anti-cutscene insurance).** A tap (a gesture distinct from roll — they
never contend) cuts the apex float and restores full `g`, trading float safety for an
earlier arrival at the next vent. Player-initiated (no control theft), deterministic,
physics-constant (a cancel, not an escalation). It makes the descent a DECISION on every
arc: hang for a laterally-distant apex cluster, or cancel to catch a tight next-vent
cadence. Pairs with the dive-quality entry to keep the ballistic phase active.

`CONFIG.vaultSegments: [14, 18]`. One segment = one (or, mid-run, several) vent + its
fixtured apex ring + dressing. Act boundaries are fractions of run length (like
`spineFinaleSegs`) so any length keeps the shape. **Escalation is demand-side ONLY** —
routing, dive precision, apex hazards, arc-steering, dive-cancel decisions. Impulse physics
(`g`, `launchCruise`, float) is CONSTANT all run so the learned motor model never lies
(escalating physics is fake difficulty).

| Act | New demand |
|---|---|
| **A — TEACH** (~20%) | 1 vent, wide base, generous `teachWarn 1.6`. Learn the dive: commit low, thread the ring, aim the next dive. On-cadence so arrival is easy. |
| **B — TEST** (~40%) | 2 vents per segment (the ROUTE choice); lateral apex offsets ±4 (steer the arc); **first gate vent OR alt-side apex cluster pulled in here** (the mid-arc demand — kills passive float early); dive-cancel becomes useful for cadence. |
| **C — PRESSURE** (~30%) | 3 vents / tighter phase spread; gate vents at apex (roll beat); apex clusters on the opposite side from the next vent (steer up, then dive-cancel across); dive-quality threshold sharpened by narrower ripe windows. |
| **FINALE — FULL BOIL** (~10%) | Continuous chaining, no level-off; the **double-jet** (respec below). |

**The double-jet, respec'd (W3 — the rev-1 version was geometrically impossible: forward
motion is monotonic so two vents 8m apart in *distance* are both crossed in ~0.25s, and
"crown to a mid apex" contradicted fixed physics).** Corrected: two vents separated
**LATERALLY ~8m**, at a **forward separation of one arc-carry (~60–95m)**, firing one beat
apart. Dive the first (its fixtured ring sits at a mid height ~y13) → launch to the mid
ring → steer laterally across on float → **dive-cancel** down onto the second vent (offset,
erupting a beat later) → launch to the run's max ring (y19, `canyonGapYHi`) worth double
chain. Both launches are full-impulse clean dives (physics stays fixed); the "mid" vs "max"
difference is the two rings' fixtured heights, not a weaker crown.

**The fork (risk/reward, kept).** Mid/late segments can offer a near LOW vent (safe, lean
ring) vs a far HIGH vent (richer apex cluster + gold spray, tighter route). Both arcs
ring-catchable by construction (audit both). Priced in routing/precision difficulty, never
in prettiness.

### 5. THE REWARD LOOP (why nail a clean chain)

`game.vaultChain` — the flow-run chain model (`game.flowChain`; `powerups.js:130-144`,
`rings.js:232-266`), for discrete beats:

- **Build:** +3 clean launch (`d≥0.9`) · +1 weak launch · +2 apex ring (+3 perfect) · +1
  per apex-cluster orb.
- **Drop:** missed apex ring → **0** (the hard reset, flow's law). Weak launch just earns
  less — no halving (there is no burn to pair it with anymore).
- **Spend — SPEED (the felt reward), toned per W1.** Vault branch at the ONE slipstream
  seam (`player.js:157-164`): `slipTarget = 1 + VAULT.slipPerChain(0.015) × min(chain, cap
  20)` → **≤1.30** at full chain, NOT 1.40. `config.js:164-166` records FLOW was toned
  1.40→1.30 because on Solar the slip compounded on the high speed-stat and read "TOO
  fast"; vault is the mode where forward speed most directly gates the arc, so it starts
  conservative. **The launch state is slip-EXEMPT by construction** (B3 caps forward speed
  during launch), so slip only rushes the ground/dive phase between arcs — it can never
  break the fixed-apex ring catch. Co-scale on the ground phase is still automatic
  (`canyonSlip` multiplies `targetSpeed` AND `steer`, `assistAxes` divides by it).
- **Spend — SCORE:** orb/ring bonus × `1 + 0.10 × min(chain, 20)` (×1…×3, the
  `CONFIG.FLOW.chainStep` formula; never × fever — no double-dip).
- **The replay hook:** `vaultChainBest` + an **ALL-CLEAN** flag (every launch `d≥0.9`) →
  "VAULT MASTERED" recap line + bonus. The run is completable sloppy; a clean chain is
  visibly, numerically different.
- **HUD:** the low-noise `FLOW ×N.N`-style milestone pop + a crown flash on a clean dive.
  Primary feedback is the world speeding up. No new persistent meter in V1–V3.

**Resets:** `vaultChain = 0` and `player.launch = null` on the run-end crossing, `bossStart`
flush, `game.reset()` (`main.js:579,1645`; `gameState.js:145` — the flow lines, extended)
**and `resume()`** (a launch state surviving into a boss arena is a bug an auditor will
hunt).

### 6. THE RISK MODEL (why pressure, not lethal — no health tax on skill)

- **Poor dive → weak launch → missed apex ring → chain = 0.** No damage (owner #1). The
  wasted segment, the dead slipstream (the world audibly/visibly slows), and the re-route
  problem ARE the sting. Chain-zero is the punishment that lasts.
- **Dormant crossing → chain = 0**, same structural cost.
- **Apex gate vent, unrolled → the shipped 25 burn.** The only in-run damage, and it is a
  telegraphed, roll-clearable dodge the player controls (skill 4). Roll too early and the
  0.5s i-frames expire inside the 0.8s column — a real window.
- **Floor / sea on descent → nothing** (owner #3). The reserve dial `seaSkimBounce` (touch
  sea → a lateral/vertical knock off your line, control cost not health) is specced but
  DEFAULT OFF; ship only if the owner finds the descent too consequence-free.
- **Ceiling:** vault joins flow in the `collision.js:127` ceiling-chip exemption
  (`canyonRun !== 'flow'` → also `!== 'vault'`) — chipping a player for riding OUR jet is
  fake difficulty. The `laneMaxY 22` firm clamp still bounds everything; the derived-impulse
  arc (B2/B4) apexes on the ring well under it, so the clamp is a safety net, not a wall the
  arc fights.

### 7. THE FEEL DIALS (proposed `CONFIG.VAULT` — starting values)

```js
VAULT: {
  // physics — CONSTANT all run (never escalate)
  gravity: 24,              // m/s² during the launch state
  launchCruise: 58,         // forward-speed cap during launch (B3) — boost/orb suspended, slip-exempt
  apexFloatGravMult: 0.55,  // g multiplier while |vy| < floatBand → ~0.34s hang (float-inclusive audit, W4)
  floatBand: 5,             // m/s
  steerRiseMult: 0.55,      // lateral authority on the rise
  steerFallMult: 0.70,      // lateral authority on the descent (dive-aim)
  handbackY: 5.5, handbackEase: 0.3,
  // dive quality (skill b) — impulse = diveQuality · √(2g·(ring.y − entryY))
  diveQualityMin: 0.70,     // a total skim floors here (still a weak launch, never a burn)
  diveThreadThresh: 0.90,   // d ≥ this threads the apex ring (see §3 table)
  diveDepthRef: 4.0,        // m below the vent top that counts as a "committed" base dive
  diveAngleRef: 0.6,        // descent-line steepness (|vy|/|v|) for a full-quality dive
  // layout (rings are FIXTURED — vents placed at ring.dist − ringLead, derived per segment)
  ventsPerSeg: [1, 2, 3, 2],// per act A/B/C/finale (the ROUTE choice)
  apexOffsetX: [0, 4, 4, 8],// lateral apex-ring / double-jet offset cap per act
  teachWarn: 1.6,           // act-A per-vent warn override (biome default 1.3)
  spacing: [[110,110],[90,150],[85,120],[70,95]],  // m arc-carry spacing per act
  // chain (FLOW-pattern, toned)
  slipPerChain: 0.015, chainCap: 20, chainStep: 0.10,   // slip ≤ 1.30 (W1)
  chainClean: 3, chainWeak: 1, chainRing: 2, chainRingPerfect: 3,
  // RESERVE — default off
  seaSkimBounce: 0,         // owner #3 dial: >0 = non-lethal sea-touch knock (control cost, no health)
},
vaultSegments: [14, 18],
```

`canyonTypeWeights` gains `vault: 0` (below). Vent cycle constants stay the shipped biome
values (`warn 1.3` / `hazardBurstDur 0.8` / `hazardIdle 2.6` / `radius 3.2`) except the
act-A `teachWarn` override — the vault must FEEL like the same object the player dodges in
open Caldera, or the hazard-is-tool duality dies.

---

## THE ARCHITECTURE

### Reusable vs Caldera-specific

- **Reusable (the LAUNCH KIT):** the `player.launch` ballistic state + speed cap + float +
  dive-cancel + handback; `diveQuality` from player kinematics; the impulse-derived-to-a-
  fixtured-ring construction; the per-vent ARM scheduler (B5); the chain→slipstream
  coupling (already generalized by flow). This is the §10 ladder's substrate: **Reef
  waterspouts** later = the same second-reading on the `waterspout` hazard type with its
  own dials; **Tempest updrafts** (sustained +vy) are a *different* verb — don't force them
  through this kit.
- **Caldera-specific (data only):** the vent visuals (shipped), the dial block, the biome
  lock, act tables, the double-jet layout.

### The seams, one by one (all cited, all re-verified this rev)

1. **Scheduling** — `startCanyon(ring, out, forced, bNext)` (`level.js:859`). Add `'vault'`
   to `CANYON_MODES` (`level.js:32`) and `vault: 0` to `CONFIG.canyonTypeWeights`
   (`config.js:174`). Type comes from ONE `canyonRnd()` draw mapped through cumulative
   weights — a 0 weight leaves every threshold untouched → **byte-identical shipped
   distribution** (the proven `flow:0` rollback dial). Segment count from
   `CONFIG.vaultSegments`. Force harness: extend `CANYON_FORCE` (`level.js:16-18`) with
   `?vaultrun` / `?canyon=vault`; `?canyon=all` cycles 4 via the existing counter.

2. **B1 — the biome lock keys on the WORLD CYCLE, never `biomeIndexAt`.** `biomeIndexAt`
   honours `?biome=` (the debug force), and course generation must not be steerable by a
   URL param (the biome-blind contract `gold-determinism` relies on — `level.js:82-87`
   warns this verbatim, and `?biome=3` would otherwise steer gen). Mirror `auroraBlock`
   (`level.js:88`): add a `caldera: 1` flag to `BIOMES[3]` (the 'EMBERFALL CALDERA' entry,
   `biomes.js:111`; no such flag exists today) and a `calderaBlock(k) = !!BIOMES[CYCLE[k %
   CYCLE.length]]?.caldera`. A drawn `vault` type converts to a real vault only when its
   mouth's block `calderaBlock(k)` is true (and the run span stays inside the Caldera
   block); else it demotes to `rock`. **`CANYON_FORCE === 'vault'` bypasses the lock** for
   the harness — exactly as `snapBackToAurora` early-returns on `CANYON_FORCE`
   (`level.js:96`). Spec the same bypass for `?canyon=all` and any force path (W7).

3. **Draw discipline** — a canyon consumes exactly 3 `canyonRnd()` draws (type, length,
   swaySign) + 1 per segment (`seg.seed`). The vault adds **ZERO new `canyonRnd` draws**:
   all per-segment randomness (vent count/offsets, fork side, gate presence, per-vent phase
   offset) derives from a local `mulberry32(seg.seed)`. This keeps `canyonframe.mjs`
   (frame≡chunk granularity invariance, 12-seed sweep) valid by construction.

4. **B2 — segment emission never mutates a fixtured ring.** `pickKind` gains `vaultpad`;
   `emitSegment` (`level.js:776`) vault branch generates its apex ring on the segment's
   ring line **as a pure function of segment fields** (author it high, deterministically —
   NOT a runtime reposition), then places the launch vent into `out.hazards` at
   `ring.dist − ringLead` (ringLead derived per §3 from `ring.y`, nominal entry, and
   `launchCruise`), tagged `{ launch: 1, phaseOffset, warn? }`. Approach embers + apex
   cluster orbs go into the non-fixtured `out.orbs`/`out.embers` tagged `vault: 1` (the flow
   `flow:1` tag law — filter audits to owned content). ⚠ the tag must be **plumbed through
   `addHazard`/`addOrb`** — the flow PR-3 lesson: a dropped flag is silently inert until it
   turns load-bearing. `out.rings` is untouched → fixture byte-identical. (The rev-1
   STRAIT-precedent crutch is dropped, W6: STRAIT is default-OFF, has no `CONFIG.canyonStrait`
   key wired, and itself keys on `biomeIndexAt` — not a license.)

5. **Suppression exemption** — `overlayBiomeHazards`'s canyon filter removes ambient vents
   inside canyon windows; it must exempt `launch`-tagged vents (the run places them) while
   still suppressing free-running ambient Caldera vents inside the vault window (the run
   owns its rhythm).

6. **B5 — ARM each vent per-segment; do not anchor the whole schedule at run entry.**
   Anchoring `fireAt` once at entry means the chain-driven slip (→1.30) makes the player
   outrun the schedule → drift accumulates → desync reads as randomness → passivity (the
   exact failure). And there is no brake (`player.js:209-218`: `targetSpeed` floor is
   `baseSpeed·ramp·slip`; you can only arrive EARLIER by boosting), so a base anchor makes
   late-firing vents uncorrectable — the rev-1 "±1.3s authority" was really `[−1.3s, 0]`.
   **Fix:** resolve each vent's `fireAt` when the player crosses `vent.dist − armDist` from
   the player's CURRENT speed + the seg-seed phase offset, so the erupt window is guaranteed
   catchable on arrival and drift cannot accumulate. Pure function of placement data + one
   value sampled at one crossing per vent → deterministic, consumption-side,
   fixture-invisible. Bias any residual offset to the early-firing (boost-approachable)
   side. **With owner #2 (dive-quality) + B3 (speed cap), arrival timing is no longer a
   pass/fail gate at all** — arming just guarantees a ripe window; the skill is WHICH vent
   and HOW you dive.

7. **The launch reading** — in `updateHazards` (`hazards.js:116-122`), the shipped cylinder
   test gains one branch: `if (v.launch && game.canyonRun === 'vault')` → compute `entryY`
   + `diveQuality`, derive `vy0`, set `player.launch`, fire chain events; **no `hitPlayer`
   on the entry, at any timing** (owner #1). A `launch` vent outside a vault run (it never
   exists there) would fall through to the shipped burn — belt and braces.

8. **The force** — `player.launch` integration in `player.update` (§3), beside the existing
   force precedents: `laneMaxY` firm clamp (`player.js:171-174`), boss wall clamp
   (`:178-182`), skyCrush ceiling (`:186-189`), the `tryRoll` velocity kick (`:110-120` —
   the §10-named pattern), the slipstream seam (`:157-164`), and the `targetSpeed` seam
   (`:209-218` — where the launch speed cap lives). **Determinism-legal:**
   `tests/gold-determinism.mjs` fixtures only rings/obstacles/goldEmbers from generation;
   player kinematics are never fixtured.

9. **Roll economy (W5)** — `rollCooldown 1.2s` > time-to-apex `1.06s`. Since a mistimed
   entry no longer burns (owner #1), the rev-1 entry-recovery roll pressure evaporates, so
   the roll budget is clean: **one roll per arc, reserved for the apex gate.** Gates are ≥1
   segment (~1 arc, ~2s) apart, so the 1.2s cooldown always clears before the next gate.
   Stated so it's designed, not discovered. (Dive-cancel is a SEPARATE input from roll —
   they never contend.)

10. **Glide assist retarget** — `assistAxes` (`player.js:14-32`) steers at the next ring
    (now at apex height). In a vault run: while grounded, target the next chosen launch
    vent's mouth (the route); during launch, target the ring. Without this the accessibility
    setting drags a beginner up the sky past every vent — found in planning, cite in review.

11. **Exit** — finale launches land ~70–95m before `canyonEnds`; `canyonExitBuffer 400`
    (`config.js`) already reserves the decompression air (the exit-decompression lesson
    names "geyser launch" as the beat this law was built for). Clear `player.launch` +
    `vaultChain` on the end-crossing. **W2 correction:** `resume()` (`level.js:980-1007`) is
    NOT draw-free — it draws the main `rnd()` at `level.js:1002` (`untilGauntlet`). The vault
    adds **no *canyonRnd* draws** in `resume()`; it only reseats cursors with FIXED offsets
    like the existing `nextGold`/`nextHazard` reseats (`level.js:1003-1006`), and nulls
    `player.launch`/`vaultChain`. Never zero `velocity.x` at any vault clamp — the fatal-wall
    re-arm lesson (flow PR-1 blocker); use inward/downward kicks or eased handback.

### Perf (the overdraw law)

Zero new FX classes: launch vents ARE the shipped geyser meshes (slim opaque core + small
additive base flare + rim `burst()` embers). Crown flash = one `burst()` call. Apex clusters
= existing pooled orbs/embers. Guide arcs (if any) = `LineSegments` (exempt). No new large
additive volumes — the ~2-volume budget stays reserved for a boss that may follow. Never
animate instanceMatrix per-frame. `tricount --ci` trivially green.

---

## BUILD MOVES IN ORDER + THE GATE

**Process (non-negotiable):** every move gets a Fable **pre-assess before** and a
**harsh-critic checkpoint after**, hard floor **4.2/5**, no cheating the gate. The owner
judges motion/feel on the PR preview. Every move ships flag-gated OFF (`vault: 0` absent
from live config = byte-identical), lands a NEW lesson `leapfrog/lessons/<date>-vault-
<slug>.md`, and **re-stamps the SW (`node tools/stamp-sw.mjs`) as the LAST step** before
any fly-test ask. Fly-test URL: **`?vaultrun`** (the force flag — NOT `?biome=3`, which must
not steer gen; the harness bypasses the CYCLE lock, B1). Live Caldera reach is via the
natural cycle.

**Move V1 — the naked verb (plumbing + dive-launch + arc).**
`CANYON_MODES` + `canyonTypeWeights.vault: 0` + `?vaultrun` + the `caldera` CYCLE flag/lock
(B1); vault emission (pure high ring, launch-tagged vents at `ring.dist − ringLead`, act-A
layout); `diveQuality` + derived `vy0` (B2/B4); `player.launch` state + speed cap (B3) +
float + handback; per-vent ARM scheduler (B5); dive-cancel; suppression exemption; assist
retarget; ceiling exemption; resets everywhere incl. `resume()`. *Coexistence:* `vault:0` →
`gold-determinism.mjs` byte-identical (rings untouched by construction); `canyonframe`
12-seed sweep green; `canyonflow`/`canyon`/`hazardskin`/`smoke` green; `tricount --ci`.
*Gate:* Fable pre-assess of §1–3; post-build critic flies `?vaultrun` (route → dive → apex
ring → dive-cancel → next vent) ≥4.2 on **challenge legibility** (can you SEE the dive is
the skill?). New `tests/canyonvault.mjs`: the §3 dive-quality crossing table from the shared
integrator (float-inclusive, W4), impulse derived to the fixtured ring at multiple entry
heights (B4), speed-cap holds through the arc (B3), ARM determinism (B5), reset coverage.
Assert couplings ACTIVE, not damped ceilings (headless rAF throttling — flow PR-3 lesson).

**Move V2 — the skill depth (routing, chain, stakes).**
Multi-vent segments (the ROUTE choice) + phase spread from `seg.seed`; `vaultChain`
build/drop/zero + slipstream branch (≤1.30, W1, launch-exempt) + score mult + HUD pop;
missed-ring = chain zero (rings.js vault key). *Coexistence:* all V1 guarantees;
`flowmeter`/`stamina` untouched-green. *Gate:* Fable critic scores the FAILURE loop — is a
weak launch readable as "my dive was lazy," a miss as "I dove into a dead vent"? ≥4.2. Reach
audit: `?debug=reach` vault extension — every apex ring hop audited against the LAUNCH
integrator + `diveThreadThresh` (a clean dive threads by construction; the audit confirms
the *routing* geometry is reachable with `steerRiseMult` lateral authority), zero warns
across a 12-seed sweep. Forward-speed axis is capped, so the audit varies dive quality +
lateral offset, not cruise speed.

**Move V3 — escalation + choice (acts B-late/C/finale).**
Apex gate vents (roll beat, the one in-run burn) + the first gate pulled into act B (the
mid-arc demand); fork segments (LOW/HIGH, both arcs audited); finale continuous chaining +
the respec'd lateral double-jet (W3); dive-quality threshold sharpened per act. *Gate:*
Fable critic plays acts back-to-back: does difficulty ESCALATE (not just vary)? Is the
double-jet a showcase or a coin-flip? ≥4.2. Owner preview ask: "fly three runs — where did
you flow, where did you fumble the dive, did you want a fourth?"

**Move V4 — feel polish + the ship decision.**
Float/handback/dive-cancel tuning from preview notes; crown flash + launch trail (within the
perf law); recap line + `vaultChainBest` + ALL-CLEAN bonus. Then the weight flip is the
OWNER's call on the preview (proposal `rock 30 / spine 30 / flow 25 / vault 15`,
Caldera-locked so effective frequency is lower). *Coexistence at the flip:* rings are
byte-identical by B2, so the flip changes only *which* runs appear (like flow's ship), not
existing ring geometry. Rollback is `vault: 0`, proven since V1.

---

## KEY FILES / SYMBOLS

- `js/level.js` — `startCanyon` (:859), `CANYON_MODES` (:32), `CANYON_FORCE` (:16-18),
  `auroraBlock` (:88) + `snapBackToAurora` CANYON_FORCE bypass (:96), `emitSegment` (:776),
  `overlayBiomeHazards` + canyon filter, `canyonRnd` (:70, `^0x2f9b4e17`), `resume`
  (:980-1007, main-`rnd()` draw at :1002 — W2), REACH_AUDIT (:8).
- `js/hazards.js` — vent cycle (:81-84), jet envelope (:88-93), telegraph (:97-101),
  collision/burn (:116-122), `addHazard` (:45), `resetHazards` (:135). 139 lines.
- `js/player.js` — `update` (:122), slipstream seam (:157-164), clamps (:171-189),
  `targetSpeed`/no-brake seam (:209-218), `tryRoll` (:110-120), `assistAxes` (:14-32).
- `js/collision.js` — `hitPlayer`, ceiling chip (:127, the flow exemption to extend).
- `js/config.js` — `canyonTypeWeights` (:174), `lineDesignSpeed` (:23), `FLOW` slip note
  (:162-169), `laneMaxY 22` (:6), roll keys, `hazardBurstDur/Idle/Damage`.
- `js/biomes.js` — `BIOMES[3]` 'EMBERFALL CALDERA' (:111, add `caldera:1`), `CYCLE`
  (:212 `[0,1,2,3,4,6,5]`), `biomeIndexAt`.
- `js/main.js` — hazard spawn, `bossStart` flush, reset, chain resets (:579,:1645);
  `js/gameState.js` (:145).
- Tests/tools — `gold-determinism.mjs`, `canyonframe.mjs`, `canyonflow.mjs`, `canyon.mjs`,
  `hazardskin.mjs`, `smoke.mjs`, `run-all.mjs`; `tools/tricount.mjs`, `tools/hazshot.mjs` +
  `archshot.mjs`, `tools/stamp-sw.mjs` (LAST step).
- Docs — `BIOME-DESIGN.md` §5.3/§8/§10, `ROCKRUN-STRAIT-HANDOFF.md`; lessons: flow PR-1/PR-3,
  exit-decompression, restamp-sw, vertical keep-out cone.

## WHAT NOT TO DO

- **No auto-launch, no proximity magnetism, no cutscene.** The vent is DIVEN INTO while
  erupting; strength scales with dive quality. Control theft beyond the documented authority
  damps is "beautiful but boring" in motion.
- **Never punish forward-arrival timing** (owner #1). No burn on any launch entry, early or
  late; a poor entry is a *weaker launch*, not damage. The only in-run burn is the
  telegraphed apex gate vent (a roll the player controls).
- **Never move a fixtured ring** (B2). Rings are generated pure in the vault segment; the
  vent is placed relative to them and the impulse is derived to them. `out.rings` stays
  byte-identical forever.
- **Never key the biome lock on `biomeIndexAt`** (B1) — it honours `?biome=` and would make
  gen URL-steerable. Key on `CYCLE`/the `caldera` flag; the force flag bypasses.
- **Never anchor the whole fire schedule at run entry** (B5) — the chain slip makes the
  player outrun it and there is no brake. Arm per vent from current speed at
  `vent.dist − armDist`.
- **Never escalate the physics** (impulse/gravity/float/cap) across the run — escalate the
  demands (routing, dive precision, apex hazards).
- **No new `canyonRnd` draws** beyond 3 + 1/segment; derive from `seg.seed`. No fields on
  fixtured rings/obstacles/golds.
- **No enclosing additive shell** on any column (§8); no new large additive volumes.
- **Never `velocity.x = 0` at a soft boundary** the run's end re-arms behind (flow PR-1
  blocker) — inward/downward kicks or eased handback.
- **Don't ship a persistent vault meter in V1–V3** — the slipstream IS the meter (flow's
  PR-4 ordering).
- **Don't let a roll grant a full launch** — dive quality, not tech, sets launch strength;
  and keep the roll budget for the apex gate (W5).

## ASSUMPTIONS (flagged; risky ones ⚠)

1. ⚠ **`diveQuality` is a new runtime measure** — nothing shipped scores an entry line.
   Deterministic and fixture-invisible (pure function of `entryY` + descent angle at the
   crossing frame), but the FEEL (does a "clean dive" read as a skill the player can learn
   and improve?) is unproven until the V1 preview. This is the whole run's load-bearing
   skill; if it reads as opaque, the fallback is a simpler binary (entry below the vent
   mid-band = full, above = weak) with a clearer tell.
2. ⚠ **The per-vent ARM scheduler (B5)** guarantees a catchable window on arrival — but if
   the owner wants the *routing read* to include "this vent is on cooldown, take the other,"
   arming every vent to be ripe could flatten the route choice. Tunable via `armDist` and
   how many vents per segment arm vs free-run; flagged for the V2 preview.
3. ⚠ **Pressure-not-lethal + no-arrival-punish is now a strong bet on the owner's challenge
   bar.** With no burn on entry and no floor cost, ALL stakes are chain-zero + lost speed.
   If the V2/V3 preview says "still too soft," the tightening dials are `diveThreadThresh`
   (sharper dive precision), tighter routing, and the reserve `seaSkimBounce` — never a
   return to entry-timing damage.
4. The launch speed cap (B3) assumes capping to `launchCruise 58` reads as "the jet carries
   you," not a jarring brake. If the deceleration feels like a wall, ease the cap in over
   ~0.15s rather than snapping.
5. `?canyon=all` cycling to 4 modes and the aurora `forced='flow'` override are orthogonal
   (forced flow wins; aurora blocks are outside Caldera).

## OPEN QUESTIONS FOR THE OWNER

1. **Dive-quality readability:** is a graded dive score (planned) the right skill surface,
   or would you rather a crisp binary (below vent-mid = full launch, above = weak) that's
   easier to read at a glance? (This is the run's core skill — worth deciding early.)
2. **The reserve `seaSkimBounce`:** leave the descent fully consequence-free (planned,
   owner #3), or turn on the non-lethal sea knock so a botched dive line costs you control
   (not health)?
3. **Ship weight:** is `vault: 15` (Caldera-locked, so rarer in practice) the right live
   share, and does flow give up the points?
4. **The double-jet finale:** ship inside V3, or hold it for a later showcase PR after
   you've flown acts A–C?
5. **Route difficulty:** how aggressive should the multi-vent ROUTE choice get — 3 vents
   with tight phase spread in act C (planned), or keep it to 2 and lean on dive precision?
6. **Economy:** should ALL-CLEAN / `vaultChainBest` feed feats/daily now, or after the run
   earns its slot?
