# VAULT RUN — build-ready plan ("hopscotch on fire", Emberfall Caldera)

**Status:** PLAN — adversarial-audit draft. Nothing built. All numbers below are STARTING
dials, single-sourced in a proposed `CONFIG.VAULT` block so retuning never forks math.
**Read first:** `LEAPFROG.md` + `leapfrog/lessons/`, `BIOME-DESIGN.md` (§5.3, §8, §10),
this file. Doc structure follows `ROCKRUN-STRAIT-HANDOFF.md`.

---

## THE GOAL (owner's words + the mandate)

> The latest Rock Run was rejected as **"beautiful but BORING — there was no challenge."**

The Vault Run is built **CHALLENGE-FIRST**. It is a timing/skill test with a mastery
curve, failure that stings (but is fair), and a reason to replay for a clean chain.
Beauty serves the challenge; any choice that is prettier-but-easier gets cut. Every
section below answers: *where is the challenge, and how does it escalate?*

**The mandate:** `BIOME-DESIGN.md §10` names **Caldera geyser-LAUNCH (impulse, the
`tryRoll` velocity-kick pattern)** as the FIRST kinematic verb sanctioned for adoption,
and rollout row 10+ sanctions it "behind default-off data." This run opens the two empty
run axes at once: **VERTICAL movement** and **FORCE-DRIVEN movement**. The three shipped
runs (rock/spine/flow) are all continuous lateral thumb-steering; the Vault Run is
discrete, explosive, and vertical.

**The concept:** Caldera's magenta geyser vents — today a dodge-only HAZARD
(`js/hazards.js`, shipped as biome increment 3) — become launch pads inside the run.
Fly into a vent **as it erupts** and its jet pops you vertically into a ballistic arc;
thread the reward ring at apex; dive to the next vent; repeat 14–18 times down a
rhythm that progressively desyncs. **The same object, two readings:** enter the jet at
its birth and it launches you; enter it late and it burns you (the exact shipped
`hitPlayer(player, CONFIG.hazardDamage, 'geyser')` burn); cross a dormant vent and
nothing happens — except the apex ring above it is now unreachable and your chain dies.

---

## THE DESIGN

### 1. WHERE IS THE CHALLENGE? (the skill, precisely)

Four stacked skills, introduced in order, all active by the finale:

1. **The READ (time the entry).** Each vent telegraphs with the shipped charge ramp —
   the base flare brightens `charge²` over `warn` seconds (`hazards.js:97-98`), so the
   tell reads late and sharpens toward the fire moment. The player must cross the vent
   cylinder inside the **CROWN window** — the first `crownFrac` seconds of the 0.8s
   eruption. Crown entry = full launch. Entry in the rest of the burst = a real launch
   but weaker (lower apex) **and the shipped burn** (25 damage, zero knockback,
   roll-clearable). Dormant crossing = no launch at all.
2. **SPEED MANAGEMENT (make the read possible).** Vent fire times are scheduled (see
   §Architecture) so a player holding their entry cruise speed arrives on the crown in
   the teach act — then per-vent desync grows to ±1.1s. The correction tools are the
   ones the game already has: **boost** (65 vs base 35 m/s — arrive sooner) and
   **feathering off boost** (arrive later). Over a ~100m approach that's ±1.3s of
   authority — more than half a vent period (4.7s), so recovery from a miss is always
   possible *with a good read*, never free.
3. **STEER THE ARC (the force is not a cutscene).** During the launch the player keeps
   ~55% lateral authority and zero vertical authority on the rise (the jet owns Y).
   Apex ring clusters offset laterally up to ±4 in the mid-acts — you steer the arc,
   you don't ride an elevator. On the descent, ~70% authority returns for the dive-aim
   at the next vent.
4. **THE APEX ROLL + THE FORK (mastery acts).** From act C, an off-line **gate vent**
   erupts timed to your apex crossing — its column is an infinite-height cylinder
   (collision has no Y test, `hazards.js:116-122`), so it clips you at apex unless you
   **barrel-roll through it** (the shipped 0.5s i-frames). And fork segments offer a
   near, early-firing LOW vent (safe, lean reward) vs a far, later-firing HIGH vent
   (richer apex cluster + gold spray, tighter timing) — a real risk/reward choice
   priced in timing difficulty, not in prettiness.

**Anti-passivity guarantee:** there is no auto-launch. Proximity does nothing. The
launch fires ONLY when the player's position enters the erupting cylinder — the exact
collision test that deals damage today, read a second way. A player who does nothing
gets zero launches, zero apex rings, zero chain, and flies a barren low corridor. The
run rewards exactly the skill it tests.

### 2. THE TIMING MODEL (the crown / the burn / the miss)

One eruption window (0.8s, `CONFIG.hazardBurstDur`), three readings inside the vault:

| Entry moment | Name | Result |
|---|---|---|
| First `crownFrac` of the burst (0.40s teach → 0.30 → 0.20s finale) | **PERFECT (crown)** | Full impulse `vy0 = 26`. +3 chain. Crown flash. No damage — you ARE the jet's crown. |
| Rest of the burst | **GOOD (scorched)** | 0.8× impulse (`vy0 ≈ 20.8` → apex ~y12.5 — the y17 apex ring is **legibly out of reach**, only low pickups catchable). +1 chain. **The burn**: `hitPlayer(…, 'geyser')`, 25 damage — UNLESS roll i-frames are live. Rolling into a late jet is the advanced recovery: no damage, but still 0.8× and no crown bonus. Timing stays strictly better than tech. |
| Charging / idle (dormant crossing) | **MISS** | Nothing fires — mechanically free (matches shipped behavior: collision only while erupting). The punishment arrives structurally: the segment's ring sits at launch apex, unreachable without the launch → **ring miss → chain = 0** via the same rings.js miss branch flow uses. No new miss-detection code; the ring IS the miss detector. |

**Same-jet latch:** the launching vent is marked *consumed* for that eruption the frame
it grants a launch, so rising inside your own column doesn't trigger the burn reading
0.2s later. The latch clears when the vent's next cycle begins. (An auditor will attack
this seam first; it is specced, not assumed. `invulnTime 1.0` additionally masks
double-hits but must not be the mechanism — it would eat legitimate gate-vent hits.)

### 3. THE BALLISTIC ARC (the new player state — and why the ring is always fair)

Today the player has **no gravity** — `velocity.y` is damped toward
`axes.y × verticalSpeed × steer` (`player.js:167`). The launch adds a bounded state:

```
player.launch = { t, vy0, g }        // set on crown/good entry; null otherwise
while active:  velocity.y = vy0 − g·t     (input Y ignored on rise)
               near apex (|vy| < 5): g × apexFloatGravMult (0.55) → ~0.26s of hang
               lateral authority × launchSteerMult (0.55 rise / 0.70 descent)
ends when:     position.y ≤ handbackY (5.5)  OR  t > 2.8s (failsafe)
handback:      velocity.y eased into the normal damp over 0.3s (no floor-slam)
```

With `vy0 = 26, g = 24`: apex **+14.1m** above entry (y≈3.5 → **17.6**), time-to-apex
1.08s, full arc ≈ 2.2s (~2.45s with float), carry ≈ 80–95m at in-run speeds. Headroom
check: apex 17.6 + float drift < `canyonCeilingY 21` < `laneMaxY 22` < worst-case
camera 27 — the arc fits the shipped vertical envelope with margin.

**The fixed-ring fairness proof (put this in the audit, cite it to the critic):** the
apex ring for each segment is placed at a fixed distance `ringLead ≈ 44m` past its vent
at `y ≈ 17`. Crossing height `y(t) = 3.5 + 26t − 12t²` at `t = ringLead / v`:

| forward v (m/s) | crossing y |
|---|---|
| 35 (base) | 17.2 |
| 49 (base × 1.40 slip) | 17.2 |
| 65 (boost) | 15.6 |
| 80 (orb) | 14.2 |

Ring radius is 3.6 → a y17 ring's catch band is 13.4–20.6: **every speed in the game's
band catches the ring after a crown entry.** But the PERFECT-ring judgment (center
hit) only lands near the design speeds — so speed discipline is rewarded on top of
timing, without ever making the ring unfair. Retuning `vy0/g/ringLead` re-derives this
table; the placement formula and the audit share one function so they cannot drift.

### 4. ESCALATION (14–18 segments, three acts + finale)

`CONFIG.vaultSegments: [14, 18]`. One segment = one vent + one repositioned ring +
its dressing. Act boundaries are fractions of `runTotal` (like `spineFinaleSegs`), so
any length keeps the shape.

| Act | Segments | Spacing | Desync band | Crown | New demand |
|---|---|---|---|---|---|
| **A — TEACH** | 1–3 (~20%) | 110m fixed | ±0.0s (on-schedule) | 0.40s | The verb. First launch is nearly free: hold speed, hit the crown, thread the ring, dive. Vents use a longer 1.6s warn here (per-vent override) so the read is generous. |
| **B — TEST** | 4–9 (~40%) | 90–150m varied | ±0.6s | 0.30s | Speed management (boost to early vents, feather for late), lateral apex offsets ±4 (steer the arc), first fork segment. |
| **C — PRESSURE** | 10–14 (~30%) | 90–120m | ±1.1s | 0.25s | Gate vents at apex (roll-through beat), second/third forks, ring offsets to ±4 with the gate vent BETWEEN launch and ring. |
| **FINALE — FULL BOIL** | last 2–3 (~10%) | 85m | ±0.8s (readable, but no cruise room) | 0.20s | Continuous chaining: the dive must aim directly into the next charging crown — no level-off between. Last segment: the **double-jet** — two vents 8m apart firing one beat apart; crown the first to a mid apex, steer across on float, drop into the second's crown as it fires, popping to the run's max ring (y19, `canyonGapYHi`) worth double chain. |

**Escalation is demand-side only** — spacing, desync, crown width, apex hazards, forks.
Impulse and arc physics stay constant all run so the player's learned motor model never
lies to them. (Escalating the physics is how you fake difficulty; escalating the
demands on a fixed verb is how you build mastery.)

### 5. THE REWARD LOOP (why nail a clean chain)

`game.vaultChain` — the flow-run chain model (`game.flowChain`, powerups.js:130-144,
rings.js:232-266), retuned for discrete beats:

- **Build:** +3 crown launch · +1 scorched launch · +2 apex ring (+3 perfect ring) ·
  +1 per apex cluster orb.
- **Drop:** burned (GOOD entry without i-frames) → `floor(chain/2)`. Missed apex ring →
  **0** (the hard reset — identical to flow's law).
- **Spend — SPEED, the felt reward:** vault branch at the ONE slipstream seam
  (`player.js:157-164`): `slipTarget = 1 + VAULT.slipPerChain(0.02) × min(chain, cap 20)`
  → **1.40 world-rush at full chain**, above spine's 1.325. Co-scale is automatic —
  `canyonSlip` already multiplies `targetSpeed` AND `steer`, and `assistAxes` divides by
  it, so every reachability ratio stays valid by construction (the proven flow guarantee).
- **Spend — SCORE:** orb/ring bonuses × `1 + 0.10 × min(chain, 20)` (×1…×3, the exact
  `CONFIG.FLOW.chainStep` formula; never × fever — the no-double-dip rule).
- **The recap hook:** `vaultChainBest` + an **ALL-CROWNS** flag (every launch perfect) →
  "VAULT MASTERED" recap line + score bonus. This is the replay reason: the run is
  beatable scorched-and-sloppy, but a clean chain is visibly, numerically different.
- **HUD:** the low-noise `FLOW ×N.N`-style milestone pop + a crown flash on perfect.
  The primary feedback is the world speeding up. No new persistent meter in V1–V3.

**Resets:** `vaultChain = 0` on run-end crossing, `bossStart` flush, and `game.reset()`
(`main.js:579,1645`, `gameState.js:145` — the flow lines, extended). `player.launch =
null` in the same three places **plus** `resume()` — a launch state surviving into a
boss arena is a bug an auditor will hunt for.

### 6. THE RISK MODEL (why pressure, not lethal)

Failure states, and why each is shaped as it is:

- **Mistimed (late) entry** → the burn: 25 damage, roll-clearable, zero knockback —
  byte-identical to the shipped hazard hit. Four sloppy launches in a run is ~most of a
  health bar: real attrition, still recoverable. **Why not lethal:** a 10–20s run that
  can one-shot you teaches avoidance, not mastery — players would skip vents (passive)
  rather than attempt crowns. Attrition + chain loss punishes *every* error while
  keeping the player in the loop attempting the NEXT crown, which is where the learning
  happens. The chain zero is the sting that lasts — it drains the slipstream under you
  (the world audibly/visibly slows) and kills the multiplier.
- **Missed vent** → structural: apex ring unreachable → chain = 0. No damage — the
  wasted segment + dead slipstream + the 4.7s re-sync problem IS the cost.
- **Gate vent at apex, unrolled** → the same 25 burn + halve. Roll timing is the
  counter (0.5s i-frames vs a 0.8s column — a real window, not a freebie: roll too
  early and the i-frames expire inside the column).
- **Floor/sea during dives:** KEEP the shipped floor behavior (unlike flow's damage
  exemption). The dive is a skill surface; an exemption would make the descent
  consequence-free. The handback easing (§3) prevents *unavoidable* slams; avoidable
  ones are the player's. ⚠ flagged as an owner question — this is the harshest dial.
- **Ceiling:** vault joins flow in the `collision.js:127` ceiling-chip exemption
  (`canyonRun !== 'flow'` → `!== 'flow' && !== 'vault'`). The arc's apex is designed at
  17.6–19; chipping a player for riding OUR jet 2m high would be a fake difficulty.
  The `laneMaxY 22` firm clamp still bounds everything.

### 7. THE FEEL DIALS (proposed `CONFIG.VAULT` block — starting values)

```js
VAULT: {
  // physics (constant all run — never escalate these)
  impulseVy: 26,            // m/s crown impulse → apex +14.1m
  goodImpulseMult: 0.8,     // scorched launch → apex +9.0m (ring unreachable, legibly)
  gravity: 24,              // m/s² during launch state
  apexFloatGravMult: 0.55,  // g multiplier while |vy| < floatBand
  floatBand: 5,             // m/s — the apex hang window (~0.26s extra)
  steerRiseMult: 0.55,      // lateral authority on the rise
  steerFallMult: 0.70,      // lateral authority on the descent (dive-aim)
  handbackY: 5.5,           // launch ends below this; vy eased over handbackEase
  handbackEase: 0.3,        // s
  // timing (crown escalates by act; see acts table)
  crownFrac: [0.40, 0.30, 0.25, 0.20],   // per act A/B/C/finale, × hazardBurstDur=0.8
  teachWarn: 1.6,           // act-A per-vent warn override (biome default 1.3)
  desyncBand: [0.0, 0.6, 1.1, 0.8],      // s, per act — arrival error vs schedule
  // layout
  ringLead: 44,             // m past vent → the fixed-ring fairness table (§3)
  ringApexY: 17,            // acts A–C; finale double-jet crown ring at 19 (canyonGapYHi)
  approachY: [3.5, 5.0],    // in-run ring/approach altitude clamp (STRAIT-clamp pattern)
  spacing: [[110,110],[90,150],[90,120],[85,85]],  // m per act
  apexOffsetX: [0, 4, 4, 3],// lateral apex-ring offset cap per act
  // chain (FLOW-pattern)
  slipPerChain: 0.02, chainCap: 20, chainStep: 0.10,
  chainCrown: 3, chainGood: 1, chainRing: 2, chainRingPerfect: 3,
},
vaultSegments: [14, 18],
canyonTypeWeights: { rock: 35, spine: 35, flow: 30, vault: 0 },   // 0 = shipped dist.
```

Vent cycle constants stay the shipped biome values (`warn 1.3` / `hazardBurstDur 0.8` /
`hazardIdle 2.6` / `radius 3.2` / `hazardDamage 25`) except the act-A warn override —
the vault must FEEL like the same object the player dodges in open Caldera, or the
hazard-is-tool duality (the whole concept) dies.

---

## THE ARCHITECTURE

### Reusable vs Caldera-specific

- **Reusable (the LAUNCH KIT):** the `player.launch` ballistic state + handback; the
  crown/good/miss window classifier on an erupting-column entry; the consumed-vent
  latch; the runtime fire-schedule anchor; the chain→slipstream coupling (already
  generalized by flow). This is deliberately the §10 ladder's substrate: **Reef
  waterspouts** later = same second-reading on the `waterspout` hazard type with its
  own impulse dials; **Tempest updrafts** (sustained +vy) are a different verb and NOT
  this kit — don't force them through it.
- **Caldera-specific (data only):** the vent visuals (shipped), the dial block above,
  the biome lock, act tables, the double-jet finale layout.

### The seams, one by one (all cited)

1. **Scheduling** — `startCanyon(ring, out, forced, bNext)` (`level.js:859`). Add
   `'vault'` to `CANYON_MODES` (`level.js:32`) and `vault: 0` to
   `CONFIG.canyonTypeWeights` (`config.js:174`). The type comes from ONE `canyonRnd()`
   draw mapped through cumulative weights — a 0 weight leaves `wtot` and every
   threshold untouched → **byte-identical shipped distribution** (the proven `flow:0`
   rollback dial). Segment count from `CONFIG.vaultSegments` in the existing lo/hi
   pattern (`level.js:879-882`). Force harness: extend `CANYON_FORCE` (`level.js:15-18`)
   with `?vaultrun` / `?canyon=vault`; `?canyon=all` cycles 4 via the existing counter.
2. **Draw discipline** — a canyon consumes exactly 3 `canyonRnd()` draws (type, length,
   swaySign) + 1 per segment (`seg.seed`, `level.js:956`). The vault adds **ZERO new
   `canyonRnd` draws**: all per-segment randomness (desync offset, fork side, apex
   offset, gate-vent presence) derives from a local `mulberry32(seg.seed)`. This also
   keeps `canyonframe.mjs` (frame≡chunk granularity invariance, 12-seed sweep) valid by
   construction.
3. **Biome lock** — vault only converts when `biomeIndexAt(mouth) === 3` AND the run's
   estimated span stays inside Caldera (span vs `biomeLength 1500` / `biomeTransition
   150`); otherwise the drawn type demotes to `rock`. Precedent: the aurora
   type-targeted bleed (`level.js:871-873`) already converts types on span/biome
   predicates — deterministic, and only reachable when `vault > 0`.
4. **Segment emission** — `pickKind` gains `vaultpad`; `emitSegment` (`level.js:776`)
   vault branch: repositions the segment's ring to the arc apex (`ringApexY`,
   `ringLead` past the vent) or the low approach band — **ring mutation in-run is the
   STRAIT precedent** (`level.js:695` clamps `ring.y` under a flag). Emits the vent
   into `out.hazards` tagged `{ launch: 1, fireOffset, burstDur?, warn? }`, approach
   embers + apex cluster orbs into the non-fixtured `out.orbs`/`out.embers` tagged
   `vault: 1` (the flow `flow:1` tag law — filter audits to owned content). ⚠ the tag
   must be **plumbed through `addHazard`/`addOrb`** — the flow PR-3 lesson: a dropped
   flag is silently inert until it turns load-bearing.
5. **Suppression exemption** — `overlayBiomeHazards`'s canyon filter
   (`level.js:623-628`) removes ambient vents inside canyon windows. It must exempt
   `launch`-tagged vents (they are placed BY the run) while still suppressing ambient
   Caldera vents inside the vault window — the run owns its rhythm; a free-running
   ambient vent inside it is noise.
6. **The fire schedule (runtime, deterministic, no RNG)** — the shipped vent cycle is
   `(time + phase·period) % period` (`hazards.js:81`): free-running, aesthetic. A skill
   run can't ride free phases — worst case is a 4.7s hover. Instead: when `main.js`
   crosses the vault `canyonStarts` marker it records `t0 = game.time` and `v0 =
   player.speed`; each launch vent k resolves `fireAt_k = t0 + (dist_k − dist_0)/v0 +
   fireOffset_k` (offset from `seg.seed`, per the act's desync band), cycling with the
   shipped period thereafter. A player holding entry speed meets act-A crowns exactly;
   desync + spacing variance then force active speed management. Pure function of
   placement data + two values captured at one marker crossing — consumption-side,
   fixture-invisible, and self-scaling to any `speedRamp` stage.
7. **The launch reading** — in `updateHazards` (`hazards.js:116-122`), the existing
   cylinder test gains one branch: `if (v.launch && game.canyonRun === 'vault' &&
   !v.consumed)` classify entry vs `fireAt` (crown/good) → set `player.launch`, latch
   `v.consumed`, chain events; else fall through to the shipped `hitPlayer` burn.
   Outside a vault run a `launch` vent behaves exactly like a shipped vent (it never
   exists there anyway — belt and braces).
8. **The force** — `player.launch` integration in `player.update` (§3), beside the
   existing force precedents: `laneMaxY` firm clamp (`player.js:171-174`), boss wall
   clamp (`:178-182`), skyCrush ceiling (`:186-189`), the `tryRoll` velocity kick
   (`:110-120` — the §10-named pattern), and the slipstream seam (`:157-164`).
   **Determinism-legal:** `tests/gold-determinism.mjs` fixtures only
   rings/obstacles/goldEmbers from generation — player kinematics are never fixtured.
9. **Glide assist retarget** — `assistAxes` (`player.js:14-32`) steers at the next
   ring. In a vault run the next ring is at y17 — assist would drag a beginner up the
   sky and past every vent. Vault branch: target the next launch vent's mouth
   (`x = vent.x, y = approach band`) while grounded; during launch, target the ring.
   Without this, the accessibility setting breaks the run — found in planning, cite in
   review.
10. **Exit** — the launch state must survive the run-end marker gracefully: finale
    launches land ~85m before `canyonEnds`; `canyonExitBuffer 400` (`config.js:196`)
    already reserves the decompression air (the exit-decompression lesson names
    "geyser launch" explicitly as the beat this law was built for). Clear
    `player.launch` + `vaultChain` on the end-crossing; `resume()` (`level.js:980`)
    reseats with NO draws (shipped behavior — verify the vault adds no cursor of its
    own beyond what segments carry). Never zero `velocity.x` at any vault clamp — the
    fatal-wall re-arm lesson (flow PR-1 blocker).

### Perf (the overdraw law)

Zero new FX classes: launch vents ARE the shipped geyser meshes (slim opaque core +
small additive base flare + rim `burst()` embers). Crown flash = one `burst()` call.
Apex clusters = existing pooled orbs/embers. Any guide arcs = `LineSegments` (exempt).
No new large additive volumes — the ~2-volume budget stays reserved for a boss that
may follow the run. Never animate instanceMatrix per-frame. `tricount --ci` trivially
green (no dragon changes).

---

## BUILD MOVES IN ORDER + THE GATE

**Process (non-negotiable):** every move gets a Fable **pre-assess before** building and
a **harsh-critic checkpoint after**, hard floor **4.2/5**, no cheating the gate. The
owner judges motion/feel on the PR preview. Every move ships flag-gated OFF
(`vault: 0` absent from live config = byte-identical), lands a NEW lesson file
`leapfrog/lessons/<date>-vault-<slug>.md`, and **re-stamps the SW
(`node tools/stamp-sw.mjs`) as the LAST step** before any fly-test ask. Fly-test URL:
`?biome=3&vaultrun` (pin Caldera; communicate the pin, not just the link).

**Move V1 — the naked verb (plumbing + launch + arc).**
`CANYON_MODES` + `canyonTypeWeights.vault: 0` + `?vaultrun`; vault emission (ring
reposition, launch-tagged vents, act-A layout only); runtime schedule anchor; crown
classifier (single generous 0.40 window, no GOOD tier yet); `player.launch` state +
handback; suppression exemption; assist retarget; ceiling exemption; resets everywhere
(run-end/bossStart/reset/resume). *Coexistence:* `vault:0` → `gold-determinism.mjs`
byte-identical; `canyonframe` 12-seed sweep green; `canyonflow`/`canyon`/`hazardskin`/
`smoke` green; `tricount --ci`. *Gate:* Fable pre-assess of this plan's §1–3; post-build
critic flies `?vaultrun` capture strip (launch → apex ring → dive → next crown) ≥4.2 on
**challenge legibility** (can you SEE what timing is demanded?). New headless
`tests/canyonvault.mjs`: arc envelope math (apex height, the §3 crossing table), crown
classification at injected entry times, schedule determinism, reset coverage. ⚠ assert
couplings ACTIVE, not damped ceilings — headless rAF throttling makes damped values
untestable (flow PR-3 lesson).

**Move V2 — the skill (tiers, chain, stakes).**
GOOD/burn tier + consumed latch + roll-into-late-jet; desync acts A/B (schedule offsets
from `seg.seed`); `vaultChain` build/drop/zero + slipstream branch + score multiplier +
HUD pop; ring-miss = chain zero (rings.js vault key). *Coexistence:* all V1 guarantees;
`flowmeter`/`stamina` suites untouched-green. *Gate:* Fable critic scores the FAILURE
loop specifically — is a burn readable as "I was late," is a miss readable as "I never
launched"? ≥4.2. Reach audit: `?debug=reach` vault extension — every apex ring hop
audited against LAUNCH authority (the §3 envelope + `steerRiseMult × safeX` for lateral
offsets), not cruise steering; zero warns across a 12-seed sweep at `lineDesignSpeed`.

**Move V3 — escalation + choice (acts C/finale).**
Gate vents at apex; fork segments (LOW/HIGH vent, both arcs ring-catchable — audit
both); finale 85m chaining + the double-jet; crown narrowing per act; gold spray on
HIGH forks. *Coexistence:* unchanged guarantees; `hazardskin` fairness re-run. *Gate:*
Fable critic plays acts back-to-back: does difficulty ESCALATE (not just vary)? Is the
double-jet a showcase or a coin-flip? ≥4.2. Owner preview ask: "fly three full runs —
tell us where you died, where you flowed, and whether you wanted a fourth."

**Move V4 — feel polish + the ship decision.**
Apex float/handback tuning from preview notes; crown flash/launch trail dressing
(within the perf law); recap line + `vaultChainBest`; ALL-CROWNS bonus. Then the
weight flip is the OWNER's call on the preview build (proposal: `rock 30 / spine 30 /
flow 25 / vault 15`, Caldera-gated so effective frequency is lower). *Gate:* full
suite + Fable ≥4.2 + owner verdict. The weight change is one config line — the
rollback is `vault: 0`, proven byte-identical since V1.

---

## KEY FILES / SYMBOLS

- `js/level.js` — `startCanyon` (:859, type draw :864-878, segments :879-882),
  `CANYON_MODES` (:32), `CANYON_FORCE` (:15-18), `overlayCanyons` (:639),
  `emitSegment` (:776), `makeRockGap` (:946), `canyonRnd` (:70, `^0x2f9b4e17`),
  `overlayBiomeHazards` + canyon filter (:593-629), suppression windows (:744-768),
  `resume` (:980), `REACH_AUDIT`/`auditHop` (:8, :220-238), STRAIT ring clamp (:695).
- `js/hazards.js` — vent cycle (:81-84), jet envelope (:88-93), telegraph (:97-101),
  collision (:116-122), `addHazard` (:45), `resetHazards` (:135). 139 lines total.
- `js/player.js` — `update` (:122), slipstream seam (:157-164), clamps (:171-189),
  `tryRoll` (:110-120), `assistAxes` (:14-32).
- `js/collision.js` — `hitPlayer` (:364), `hit` roll-i-frame skip (:326), ceiling chip
  (:127, the flow exemption to extend).
- `js/config.js` — `canyonTypeWeights` (:174), buffers (:195-196), `canyonGapYLo/Hi`
  `canyonCeilingY` (:207-209), roll keys (:84-87), `FLOW` (:162-169), lane keys (:4-7),
  `hazardBurstDur/Idle/Damage` (:57-59).
- `js/biomes.js` — Caldera `hazard` block (:133), `biomeIndexAt` (:235).
- `js/main.js` — hazard spawn (:292), `bossStart` flush (:548), reset (:1054), chain
  resets (:579, :1645); `js/gameState.js` (:145).
- Tests/tools — `tests/gold-determinism.mjs`, `canyonframe.mjs`, `canyonflow.mjs`,
  `canyon.mjs`, `hazardskin.mjs`, `smoke.mjs`, `run-all.mjs`; `tools/tricount.mjs`,
  `tools/hazshot.mjs` + `archshot.mjs` (capture), `tools/stamp-sw.mjs` (LAST step).
- Docs — `BIOME-DESIGN.md` §5.3/§8/§10, `ROCKRUN-STRAIT-HANDOFF.md` (structure),
  lessons: flow PR-1/PR-3, exit-decompression, restamp-sw, vertical keep-out cone.

## WHAT NOT TO DO

- **No auto-launch, no proximity magnetism, no launch cutscene.** The vent must be
  ENTERED while erupting. Control theft beyond the documented authority damps is the
  "beautiful but boring" failure restated in motion.
- **Never escalate the physics** (impulse/gravity/float) across the run — escalate the
  demands. A verb that changes under the player kills the mastery curve.
- **No new `canyonRnd` draws** beyond 3 + 1/segment; derive from `seg.seed`. No fields
  on fixtured rings/obstacles/golds; ring mutation only inside the active-vault branch.
- **No enclosing additive shell** on any column, ever (§8); no new large additive
  volumes; the boss may need that budget.
- **Never `velocity.x = 0` / `velocity.y = 0` at a soft boundary** the run's end
  re-arms a fatal or chip boundary behind (the flow fatal-wall blocker — use inward/
  downward kicks or eased handback).
- **Don't reuse ambient free-running vent phases for the skill rhythm** — schedule
  from the run-entry anchor or the timing test degenerates into hover-and-wait.
- **Don't exempt the burn inside the vault** "because it's a tool now." The duality is
  the concept; a vault where the jet can't hurt you is a trampoline park.
- **Don't gate the roll out of the run** (it's the GOOD-tier recovery and the apex
  answer) — and don't let roll i-frames grant crown-tier launches (tech must never
  beat timing).
- **Don't ship a persistent vault meter in V1–V3** — the slipstream IS the meter;
  prove the feel first (flow's PR-4 ordering).

## ASSUMPTIONS (flagged; risky ones marked ⚠)

1. ⚠ **The runtime fire-schedule anchor (t0, v0) is a new mechanism** — nothing shipped
   schedules hazards relative to run entry. Deterministic and fixture-invisible by
   construction, but the FEEL (does desync read as rhythm or as randomness?) is
   unproven until V2 preview. Fallback if it fails: author `fireAt` purely from
   distance at fixed design speeds per act (cruder, still deterministic).
2. ⚠ **Repositioning fixtured rings** under the active-vault branch is licensed by the
   STRAIT precedent, but it is the plan's closest approach to the determinism fixture.
   Guard: the mutation must be structurally unreachable when the type never converts
   (branch keyed on the run object, not on config presence), and V1's first CI line is
   the byte-identical fixture with `vault` absent AND with `vault: 0`.
3. ⚠ **Pressure-not-lethal is a bet** that chain-zero + attrition burns sting enough
   for the owner's challenge bar. If preview says "still too soft," the tightening
   dials are burn damage and crown widths — not death states — first.
4. The infinite-height cylinder (no Y test) is treated as a FEATURE (gate vents work at
   apex for free). If gate-vent legibility fails review, adding a Y-band to the vault
   reading only (never the shipped hazard) is a contained change.
5. Speed capture `v0` at the marker crossing assumes the player isn't mid-boost at
   entry; if preview shows entry-boost gaming the schedule, capture a short-window
   average instead.
6. `?canyon=all` cycling to 4 modes and the aurora `forced='flow'` overrides are
   assumed orthogonal (forced flow always wins over a vault-eligible draw — aurora
   blocks are outside Caldera anyway).

## OPEN QUESTIONS FOR THE OWNER

1. **Burn severity in-vault:** keep the shipped 25, or run vault-local 35 so ~3 sloppy
   launches end you? (Plan ships 25; the dial is one config key.)
2. **Floor/sea during dives:** challenge-honest chip (planned) or flow-style exemption?
3. **Ship weight:** is `vault: 15` (Caldera-locked, so rarer in practice) the right
   live share, and does flow give up the points?
4. **Miss legibility:** is ring-miss→chain-zero enough feedback for a dormant crossing,
   or do you want an explicit "VENT MISSED" pop? (Plan: no pop — the silent dead vent
   + slowing world is the read; a pop is noise in a 2s loop.)
5. **The double-jet finale:** ship inside V3, or hold it for a V5 showcase PR after
   you've flown acts A–C?
6. **Economy:** should ALL-CROWNS / `vaultChainBest` feed feats/daily now, or after the
   run earns its slot?
