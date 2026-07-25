# 2026-07-18 — THE SERPENT MOTION KIT: the ribbon-spine playbook for eel / river-dragon bodies

**Did / learned.** Consolidates the whole Jade Serpent motion campaign (shipped + three post-ship
owner-feel fixes) into ONE reusable playbook. If you are building the motion for any long trailing
creature — serpent, eel, river dragon, kite-tail boss — **read this first**, then the incremental
lessons it links only where you need the forensic detail. The code is `reforged/js/ribbonSpine.js`
(the sim), the jade drive block in `reforged/js/dragon.js` (search `rib.sim`), and the decompose
baking in `reforged/js/dragonJadeSerpent.js` (search `bodyWave.ribbon`).

Incremental lessons this consolidates (link, don't re-read the whole ledger):
`2026-07-18-jade-ribbon-follow-the-leader.md` · `2026-07-18-jade-ribbon-silky-swim-envelope.md` ·
`2026-07-18-jade-ribbon-movement-response.md` · `2026-07-18-jade-ribbon-whip-attack-envelope.md` ·
`2026-07-18-vertical-posture-slew.md` · `2026-07-18-ribbon-vertical-whip-train.md`, plus the
2026-07-17 `jade-*` build-sheet/gate lessons for the model/process side.

---

## 1. THE MODEL — what a "ribbon serpent" motion system IS

**A follow-the-leader spine + layered response.** The head lays down a world-space breadcrumb
trail; the body samples that trail at fixed **arc-length** offsets behind the head; the whole
welded mesh is re-lofted from the resulting dynamic frames every frame. On top of that exact
geometric base you layer the FEEL: an always-on idle swim, an idle-duck for contrast, edge-event
whip pulses, and a sustained-steer curl.

Why this beats a fixed sine (what jade had before): the trail makes the owner's three asks **one
operation on one input** (the head's trajectory) —
- straight input → straight recorded path → the body settles to a clean line;
- a sharp steer → a curvature pulse travels head→tail (the whip);
- a sustained turn → a curved recorded path → the body curls, then unwinds tail-last on release.
A sine can only ever wiggle in place; it cannot trail, coil, or settle, and it is the #1
"procedural snake" cheap-tell.

The sim is **pure + deterministic** (no `Math.random`, no wall clock): same (dt, head path) →
same frames. That is what makes every feel claim in §5 headlessly provable.

## 2. THE FEASIBILITY CEILING — read before you promise anything

A **literal world-space gymnast ribbon** (the body sweeping the stage in big arcs behind the hand)
is **structurally unattainable** in a forward-runner with a re-centering chase cam. Two reasons
(from the Fable feasibility assessment in `2026-07-18-jade-ribbon-movement-response.md`):
1. The chase cam must keep a 35–65 u/s runner near screen-center to be playable — the
   world-translation component of trailing is cancelled on screen by construction.
2. At game speed the head crosses a **whole body-length in ~0.2–0.37 s**, so the body only ever
   holds the last fraction of a second of steering history — physically a shallow ~34° diagonal
   viewed nearly end-on. The ribbon's memory is too short and too straight at speed.

What IS attainable — and what shipped at 4.3/5 — is the **perceptual signature**: contrast
(idle-duck), edge-event (whip pulse), lag (the trail itself), and the sustained-input flourish
(steer-curl). Sell the cues the eye uses to infer "I caused that," not the simulation. Kite tails,
Panzer Dragoon, and Ori all fake it exactly this way. Do NOT spend rounds chasing the literal
ribbon; state this ceiling to the owner up front.

## 3. THE BUILD ORDER — the increments that worked, with shipped dials

Build in this order; each step has a gate you can pass before the next exists.

### 3.1 Decompose at build time, re-loft at run time (the foundation)
In the model builder, bake every vertex ONCE into `(homeStation, offT, offB, offN)` — its offset
in that spine station's rest tangent/binormal/up frame (`dragonJadeSerpent.js`, `stampStation` +
the decompose loop; published as `bodyWave.ribbon = { N, count, station, offT, offB, offN,
restFrames, liveFrames }`). One formula then rebuilds the entire welded mesh (fins, fans, caps,
whiskers included) from ANY frame set:

    vertex = liveFrame[station].p + offT·T + offB·B + offN·Nn

**Gate: the identity proof** (`tests/ribbonspine.mjs`) — re-lofting from the REST frames must
reproduce the baked geometry to float precision, no NaN, valid station indices. This decomposition
is what makes model beautification separable from motion forever: change the mesh, re-bake, the
animation just works.

### 3.2 Arc-length trail + parallel-transport frames (`ribbonSpine.js`)
- **Ring buffer keyed on cumulative arc length** (`HISTORY_LEN 512`), recording the head only when
  it moves ≥ `minSample 0.08` (decouples resolution from framerate). Station `i` sits at
  `liveHeadArc − segCum[i]`, where `segCum` is the REST spine's cumulative gaps — body length is
  preserved exactly (no stretch). Seed the whole history as a straight line behind the head on
  frame one (`seedStraight`) so there is never a garbage first frame.
- **Parallel-transport (rotation-minimising) frames, NEVER Frenet.** Frenet flips the normal at
  inflections and blows up at zero curvature — which is the straight REST state, i.e. it explodes
  at idle. Seed the normal from world-up, then rotate it station→station by the minimal rotation
  between consecutive tangents (Rodrigues) and re-orthonormalise. (Lines 149–192.)
- **Anchor pin.** The head is a separate mesh at a fixed local spot. Pin station 0 to the head's
  local rest position: feed the sim `headWorld = group.localToWorld(anchor)` and add the anchor
  back in the world→local fold (`ribbonToLocal`, inverse group quaternion), or the body detaches
  from the head and pops on frame one.
- Two arc-length gotchas that cost rounds are in §4 (double-count, stale bracket).

**Gate:** `tests/ribbonmotion.mjs` R1–R3 + determinism (numbers in §5).

### 3.3 Idle swim — the 3D travelling wave (and the ENVELOPE, which is the whole game)
A silky travelling S the body ALWAYS carries, keyed on **arc length** (so it rides a coil
correctly), added along the frame's binormal (lateral) + normal (vertical):

    ph   = swimFreq·arc − swimSpeed·t
    wave = sin(ph)·0.78 + sin(ph·0.5 + 0.9)·0.32          ← two harmonics, never a metronome tick
    env  = min(1, i/headFade) · (1 − swimGrow + swimGrow·u)   ← u = arc/bodyLen
    lat  = (swimAmp·duck + driveX)·gain · env · wave        ← vertical same, phase-shifted swimPhaseY

**Shipped jade dials** (`dragon.js` `initRibbonSim` call): `swimAmp 1.2, swimAmpY 0.95,
swimFreq 0.9, swimSpeed 2.7, swimPhaseY 1.5, swimGrow 0.4, headFade 3` (sim defaults differ —
always pass your own).

The lesson that actually killed "stiff" (`jade-ribbon-silky-swim-envelope.md`): **the amplitude
ENVELOPE matters more than raw amplitude.** Three laws:
1. **The wave must ENTER at the neck** — `headFade 3`, so onset is 1–2 stations behind the head
   and the neck carries ~40–55% of the tail's amplitude. A dead front half + whippy tail reads as
   "a car antenna on a fixed base," not silk. (Stations 0–1 stay protected so the body never
   detaches from the head and the rider doesn't buck.)
2. **≥1.5–2 spatial periods on the body** — `swimFreq 0.9` puts ~1.9 periods (two humps) on jade.
   One hump is "a slight bend"; two is a travelling S. The tell that it's truly propagating: over a
   ~500 ms filmstrip the S **reverses handedness** — a static bend with a swishy tip can't do that.
3. **Swell toward the tail** (`swimGrow`) for the whip silhouette, and make it 3D (lateral +
   phase-shifted vertical ≈ soft helix) + two-harmonic so it never reads as a flat metronome.

### 3.4 Movement response — duck, whip, curl (the layered feel)
Root cause of "it doesn't respond, it just coils idly": the input term **added to the same wave the
idle used** — cause and effect indistinguishable by construction. The response must live in a
DIFFERENT visual vocabulary than the idle. Three levers, all shipped:

- **Idle-DUCK (contrast — the enabler).** Smoothed `|steer|` → `steerMag` (fast attack λ8 / slow
  release λ3 in `dragon.js`) fades the idle to ~35% while steering: `duck = 1 − duckAmt·steerMag`,
  `duckAmt 0.65`. Idle untouched at rest; input owns a motion budget idle never touches.
- **Drive swell.** `driveX/driveY` (smoothed λ3 from normalised steer/pitch: `driveXt =
  min(1,|sxN|)·0.9`, `driveYt = min(1,|syN|)·0.45`) swell the wave in the axis you're moving;
  `gain = 1 + speedNorm·0.45` energises with cruise speed. ⚠ Check the duck-inversion law (§4.6):
  `driven + idle·duck` must stay < `idle` per axis (that's why driveY is 0.45, not 0.7).
- **Input-edge WHIP (`ribbonWhip(rib, bAmp, nAmp)`).** A signed travelling Gaussian born at the
  neck, crest riding tail-ward: `pulseSpeed 14` arc-u/s, `pulseWidth 3.2`, `pulseLife 0.9`,
  `pulseAmp 2.2`, pool cap 8, and a **smoothstep ATTACK `pulseAttack 0.15 s`** (non-negotiable —
  §4.2). Trigger (in `dragon.js`): **lateral** on the edge `|dSx| > 0.045`, cooldown 0.13 s, amp
  `sign(dSx)·min(1,|dSx|·7)·pulseAmp` — the short train it makes on the damped ramp reads as an
  intentional serpentine flick and is signed off. **Vertical** arms on a SIGN REVERSAL only
  (`sgnY !== ribLastWhipSignY`, `|dSy| > 0.05`), amp `pulseAmp·0.5`, backstop cooldown 0.30 s —
  a per-ramp-frame vertical train read as erratic (§4.4).
- **Steer-CURL (the sustained-turn "twirl").** A forward-runner saturates into a straight diagonal,
  so a held turn's path curvature is only transient — COIL looked identical to TURN and failed the
  gate at 4.1. Fix: ramp a signed steer signal SLOWLY (`ribbonCurl`, λ1.1 ≈ 1 s time-constant, so a
  flick barely curls) and add `curlAmp·curl·(arc/bodyLen)²` along the binormal — quadratic so the
  TAIL hooks most (a J). `curlAmp 3.6` shipped. Zero at rest: straight stays a clean line.

### 3.5 The shared-controller side: vertical-pose slew (roster-wide)
Not in the ribbon at all, but the long body exposes it first: the dive/climb POSES
(`diveAmount = ss(9,16,−vy)` etc.) driven off raw velocity through a deadzone **flip on fast
reversals** — and the same signal feeds nose, wing tuck/spread, AND the flap gate, so it reads as a
whole-dragon spasm. Fix (shipped, roster-wide): gate the poses on a **slow-engage/fast-release
copy** `vyPose = damp(vyPose, vy, |vy|>|vyPose| ? 3 : 7, dt)` and feed the pitch coupling from
`vySmooth` (λ5) not raw vy; keep head + rider on raw vy so input still *reads* instantly. Details +
roster-safety proof: `2026-07-18-vertical-posture-slew.md`, locked by `tests/pitchslew.mjs`.

## 4. THE FAILURE-MODE REGISTRY — symptom → cause → fix → guard

1. **Arc-length double-count collapse.** *Symptom:* station-0→1 spacing collapses (81% error).
   *Cause:* recording a head sample AND computing live-head arc as `hs[head] + moved` in the same
   tick counts `moved` twice. *Fix:* measure the gap from the newest STORED sample AFTER the
   record. Sibling bug: the interp's "newer" bracket must be one-newer-than-`older` (or the live
   head), never a stale value from the previous station. *Guard:* `ribbonmotion.mjs` R2 (<3%).
2. **Impulse born at full amplitude = single-frame teleport.** *Symptom:* soft input smooth,
   aggressive snaps "stop-motion skip." *Cause:* the whip's `(1 − t/life)` envelope is ≈1 at birth
   → neck goes 0→2.2 u in one frame; hides from gentle testing because gentle input never crosses
   the edge threshold. *Fix:* smoothstep attack over `pulseAttack 0.15 s` (peak envelope velocity
   ~75 ms = still on the "flick" beat; don't go <0.12 or >0.18). *Guard:* the spike ratio in
   `ribbonsmooth.mjs` (§5). Law: **any event layer on top of continuous animation must be born at
   zero and ramped in.**
3. **Pool-eviction pop.** *Symptom:* a second sneaky pop on the 5th+ rapid spawn. *Cause:*
   `shift()` on pool overflow evicts a still-LIVE pulse mid-flight (~0.9 u in one frame). *Fix:*
   size the pool so lifetime-culling always wins (cap 8: 0.13 s cooldown × 0.9 s life → ≤7
   concurrent); keep the shift as a pure safety net. *Guard:* `ribbonsmooth.mjs` wiggle case.
4. **Edge detector on a DAMPED input fires the whole ramp → a whip TRAIN.** *Symptom:* "weird
   erratic movement" on up/down while the spine measures smooth. *Cause:* `player.velocity` is
   exponentially damped, so `|Δinput| > ε` stays true for ~15 frames per flip; with a 0.13 s
   cooldown that's 2–3 same-sign pulses whose Gaussians overlap into a ~2.2 u bump, 4–6 bumps
   aloft on a mash. *Fix:* arm on the **sign reversal** (one pulse per gesture) with a debounce
   backstop — that's the shipped vertical trigger. *Guard:* `ribbonvertical.mjs`
   (pulse-count == reversal-count). Bites any edge-triggered layer: hit-reacts, camera kicks.
5. **Velocity-driven POSE with only a deadzone flips on fast reversals → spasm.** *Symptom:*
   "lunge/spasm" on up↔down mashing; soft input fine. *Cause:* a deadzone has no notion of
   "sustained," and ONE shared dive/climb signal drives nose + wing tuck + wing spread + flap
   gate, so the flip is compound. *Fix:* slow-engage/fast-release smoothed copy (§3.5) — fix the
   SIGNAL, not one consumer. *Guard:* `pitchslew.mjs` (pitch-rate + pose-engagement bars, old-vs-new).
6. **Duck-contrast inversion.** *Symptom:* steering makes the "idle" wave BIGGER, burying the whip
   event. *Cause:* the driven term out-grows the ducked idle: jade vertical was
   `0.95×0.35 + 0.7 ≈ 1.03 > 0.95`. *Fix:* per axis, keep `driven + idle·duck < idle` (driveY
   0.7 → 0.45 gives 0.78 < 0.95). *Guard:* check the inequality whenever you touch any of the
   three dials on an axis.
7. **The camera-choice / depth-projection trap.** *Symptom:* a big lateral S "looks stiff" in a
   capture. *Cause:* a side cam only sees the VERTICAL component — the dominant lateral wave lies
   along the view axis. *Fix:* judge each component from the view that sees it: behind/chase for
   both (it's also the player's seat), top-down for lateral-only, side for vertical-only; and use
   temporal FILMSTRIPS — silkiness is a motion quality one still can't show. Movement RESPONSE
   needs a fixed-lateral tracking cam (`_ribbonresp/_ribbonweave`), because the chase cam
   re-centers the dragon and hides world trailing. Same family as FLAP-DESIGN's depth-projection
   trap: when a critic says "nothing happened," first ask what the camera can even see.

## 5. THE VERIFICATION HARNESS — feel as numbers (run from `reforged/`)

| Test | Locks | Bar (shipped values) |
|---|---|---|
| `tests/ribbonspine.mjs` | identity proof: rest re-loft == baked mesh | float precision, no NaN |
| `tests/ribbonmotion.mjs` | R1 path-trace (coil radius err <0.2) · R2 arc-length (<3%) · R3 straight settle (maxLat <0.05) · R5 coil ≥270° on a fed circle · determinism · **response ratio** | ratio = rear-body peak deviation steering ÷ idle ≥2.5 (ships at ~4.26×: idle 1.09 → steer 4.65) |
| `tests/ribbonsmooth.mjs` | anti-pop | **spike ratio** = frame jump ÷ neighbours', body-relative (subtract head translation): smooth 1.00 · snap 1.03 · wiggle 1.13 (bug was ~25); bare-whip birth 0.30 u (was 2.16) |
| `tests/ribbonvertical.mjs` | one vertical pulse per reversal | 9 pulses for 8 flips; isolated whip bump 0.89 u (diff an on/off run to strip legit path-trailing); lateral suite byte-identical |
| `tests/pitchslew.mjs` | pose slew (roster-wide) | mash: peak pitch rate 3.32→1.04 rad/s, swing 0.99→0.29, pose engagement ≤0.001; committed dive still commits; soft input unchanged |

The reusable metric patterns: **a feel complaint becomes a ratio** (response ratio = "does it
answer my hand"); **smoothness is a spike ratio**, not a max (a big smooth whip is fine, a big
isolated frame is the bug); **isolate an added offset by differencing an on/off run**;
**roster-wide changes prove steady-state + soft-input unchanged alongside the bug metric dropping**.

Capture kit (`reforged/tools/`): `_ribbonshot` (straight/turn/slalom in-engine), `_ribbonside`
(side tracking cam), `_ribbonweave` (fixed-x/y audience cam for trailing), `_ribbonresp` (step-edge
filmstrip for the whip), `_ribbonsnap` (rapid-snap pop repro), `_ribbonvert` (vertical spasm repro).
Headless gotchas: click `#btn-start` via `page.evaluate` (its `breathe` CSS anim breaks Playwright
actionability) and capture at deviceScaleFactor 1 (DSF-2 clipped shots on the live canvas can hang).

**The rule: trust geometry over a critic's pixels; the owner judges feel.** The headless suite
proves the body does the thing; the Fable critic judges whether it *reads* from in-engine captures;
the owner's hands are the final gate. Three different questions — run all three.

## 6. THE PROCESS — Fable gates + the owner-feel loop

- **Fresh harsh critic per round, builder never self-judges, numeric bar 4.2.** The main build took
  3 rounds (3.6 "sash" → 4.1 "COIL==TURN" → 4.3 PASS); the swim rework and response work each
  cleared in 1–2 rounds because the critic was given the right captures (see §4.7). Per
  AAA-PIPELINE, hold to ONE revise round per complaint — keep a fallback dial in reserve (e.g.
  `swimAmpY 0.95→0.85` was held, never needed).
- **The owner-feel loop is where the real bugs live.** All three post-ship fixes came from owner
  play, not critics or tests: "snap = stop-motion" → attack envelope (§4.2/4.3); "up/down =
  lunge/spasm" → pose slew (§4.5); "still erratic on vertical" → whip train + duck inversion
  (§4.4/4.6). Each followed the same loop: **repro tool → root cause in the CODE (not the
  screenshots) → metric that encodes the complaint → fix → regression test that locks it.** Every
  one of those root causes was found by reading the code, not by staring at frames.

## 7. START HERE FOR THE NEXT SERPENT — the checklist

1. Read §2 aloud to whoever asked: no literal world-space ribbon; we sell contrast + edge + lag.
2. Model builder: emit per-station rings, `stampStation` every vertex, decompose to
   `(station, offT, offB, offN)` + `restFrames`, publish `bodyWave.ribbon`. Pass the **identity
   proof** before writing any motion code.
3. Wire the sim: `initRibbonSim` with YOUR dials (start from jade's: §3.3), drive it with
   `headWorld = group.localToWorld(anchor)`, fold back with the inverse group quaternion, re-loft.
   Pass `ribbonmotion` R1–R3.
4. Tune the swim by the three envelope laws (onset at the neck, ≥1.5–2 periods, tail swell);
   verify propagation by the handedness-reversal tell on a behind-cam filmstrip.
5. Add response in order: duck → whip (WITH the attack envelope and per-axis triggers from day
   one — lateral edge-train, vertical sign-reversal) → steer-curl. Check the duck-inversion
   inequality on both axes. Pass response-ratio ≥2.5 and spike-ratio ≈1.
6. Copy the five-test suite + capture tools, rename, re-bar. They replicate the game's drive math —
   keep the constants in sync with `dragon.js` when you retune.
7. Gate: fresh Fable critic on the right cameras, ≥4.2; then the owner flies it.
8. **Scope law:** everything above is gated behind `bodyWave.ribbon.active` — the roster stays
   byte-identical. The ONLY shared piece is the vyPose/vySmooth pose slew (already shipped,
   roster-wide). **Never retune the shared flight controller for your serpent's feel** — jade-scope
   the fix (e.g. vertical busyness → `rib.sim.pulseAmp` / whip cooldowns, NOT the controller); if a
   shared change is truly warranted, prove roster safety numerically (steady-state + soft-input
   unchanged) like `pitchslew.mjs` does.

**→ Systematize.** The kit generalises past serpents: the decompose/re-loft is a shape-agnostic
"animate any welded mesh from spine frames" system; the attack-envelope, sign-reversal-arming,
slow-engage/fast-release, and duck-contrast laws apply to ANY event layer on ANY creature
(hit-reacts, camera kicks, boss tells); the spike-ratio and response-ratio are house metrics for
all future feel work. The registry in §4 is the check-before-you-ship list for any motion layer.

**→ Leapfrog.** The unbuilt levers from the response plan, ranked: lateral-history exaggeration
(~1.7–2× tail-weighted perpendicular amplification), camera complicity (≤10% head off-center on a
steer edge), spring-overshoot chain (the biggest feel win, but it fights length conservation — do
last), head-leads pose. A second ribbon creature (cloud leviathan? banner boss?) should reach
jade's shipped feel in ~2 gates by following §7 — that's the leapfrog this file exists to cash in.
