# JADE SERPENT — RIBBON ANIMATION PLAN

Owner brief: *"This dragon needs to be able to be like a ribbon. Straight, then twirl around, move
flexibly according to direction — an Olympic gymnast twirling a ribbon that trails her on command."*
**This takes priority over how the dragon looks.**

Synthesised from three parallel investigations (a harsh Fable assessment that set the bar, an Opus
algorithm survey, an Opus engine-integration study of the actual code). The three agreed on the
architecture; this doc is the buildable plan.

---

## 1. Why the shipped motion can't be tuned into a ribbon (the diagnosis)

The current body is `arr[3v] = baseX[v] + amp·ramp[v]·sin(freq·spineZ[v] + phase)` — a **fixed lateral
sine** keyed to the baked z-axis (`dragon.js` ~1461-1503; snapshot built in `dragonJadeSerpent.js`
~336-356). Three structural dead-ends, not tuning problems:

1. **Zero trajectory memory.** `phase` comes only from `dt`+speed; steering never enters. Yank the stick
   and the body does byte-identical motion to flying straight. A ribbon *is* memory — the tail occupies
   where the head *was*.
2. **z is frozen; only x/y are rewritten.** The spine can't foreshorten, so it can never fold tighter
   than the baked resting S, and large lateral offset at fixed z *stretches* the tube (a ribbon is
   inextensible — that's what makes coils and whip-cracks read).
3. **The whole tube lives rigidly in the head's frame.** A turn yaws the serpent as one plank with a
   wiggle painted on it. "Straight → twirl" is impossible; straight flight still shows the permanent wave.

**Verdict (Fable):** the shipped model is a decent *swim idle* and can never become ribbon motion. This
is a re-architecture — a **head-path breadcrumb spine** — the only approach that delivers all the required
behaviours within the constraints.

---

## 2. The architecture — arc-length path-history spine, re-lofted per frame

**One idea unifies motion + mesh:** every vertex in the welded mesh (tube, dorsal stripe, web-fans,
leaf-fork tail, whiskers, caps) is currently built as `frame.p + (offset in that frame's T/B/Nn basis)`.
So we **decompose each vertex once at build time into `(homeStation, offT, offB, offN)`**, and then each
frame we (a) compute a fresh set of ~30 spine *frames* from the head's recent path, and (b) re-loft the
entire mesh with ONE uniform formula:

```
vertex = liveFrame[station].p  +  offT·T  +  offB·B  +  offN·Nn
```

Because fans/tail/stripe are carried by their station's full rotating frame (position **and**
orientation), they stay welded and ride the bend — no shear, no detach. No trig in the per-vertex loop
(all curvature lives in the 30 frames), so it's *cheaper* than today's two-sines-per-vertex tick.

### The motion model (fills `liveFrames` each tick) — 5 steps

1. **Head leader from input.** Integrate a clean heading from player steer:
   `headYaw += steerCmd·dt; headPos += forward(headYaw)·speed·dt` (+ pitch for 3D). Optional first-order
   lag `headYaw += (cmd−headYaw)·whipGain·dt` gives overshoot/whip. **Coil is geometric, not a command:**
   constant steer at constant speed = constant-curvature circle → the recorded path *is* a spiral → the
   body coils. Zero steer → straight path → straight body. (We can also just record `player.position`,
   which the group already tracks each frame.)
2. **Arc-length breadcrumb buffer.** Push the head world-pos into a preallocated ring buffer only when it
   has moved `MIN_SAMPLE_DIST` (decouples resolution from framerate/speed), storing cumulative arc length
   `histS`. In-repo precedent to mirror: `bossBullets.js` `ribbonSample()` — but we add the arc-length
   resampling it lacks.
3. **Place stations by arc length (the core).** Station `i` sits `i·SEG` back from the head along the
   recorded polyline; walk the buffer newest→oldest once (monotonic cursor → O(N+samples)), interpolating
   between bracketing samples. This gives **constant segment spacing regardless of speed** — the defining
   fix. Interpolate with **centripetal Catmull-Rom** (reuse `dragonSweep.js` resample utils) so sharp
   corners don't facet.
4. **(Winner only) light PBD smoothing** — 1-2 Gauss-Seidel distance-constraint iterations + a touch of
   Verlet inertia (Müller PBD / XPBD): rounds corners, gives springy ring-out, enforces exact spacing.
   *The fallback ships without this.*
5. **Parallel-transport (rotation-minimising) frames** — NOT Frenet (which flips at inflections and blows
   up at zero curvature = exactly the straight rest state). Seed `normal[0]` from world-up each frame,
   carry it down the spine via Rodrigues rotation between consecutive tangents, re-orthonormalise. Zero
   flips, straight or coiled. Then re-loft (§2 formula).

**Swim, preserved and composed correctly:** keep the travelling-wave swim but apply it as a **lateral
offset along the live frame's binormal, keyed on arc-length (not world z), faded to zero over the first
~4 stations behind the head.** The head-fade keeps the "attached to the pilot" read crisp; the arc-length
key means the wave rides on top of a coil correctly; applied after station placement, it doesn't disturb
arc-length spacing.

**Ship order:** the **fallback (path-history + Catmull-Rom, no PBD)** is the cheapest fully-deterministic
path and is ~90% of the look — ship it first, add the PBD spring pass only if the whip feels rigid.

---

## 3. Engine integration (jade-gated, roster byte-identical)

- **Build time (`dragonJadeSerpent.js` ~341):** add `station:Uint16Array`, `offT/offB/offN:Float32Array`
  (thread a `vertStation.push(i)` in lockstep with every `positions.push`, then one decompose post-pass),
  snapshot `restFrames` + a mutable `liveFrames`, and hang it on the existing wave object:
  `bodyWave.ribbon = { N, count, station, offT, offB, offN, restFrames, liveFrames }`. Keeping `bodyWave`
  published (same `count`) means `starters.mjs` (asserts `bodyWave.count`) stays green with zero edits.
- **Per-frame (`dragon.js` ~1461):** branch `if (bodyWave.ribbon)` → the sim fills `liveFrames`, then the
  uniform re-loft loop writes positions; `else` → the untouched sine loop (every other dragon + a jade
  fallback path). Keep `bodyWave.phase` accumulating (the pearl/tip-gem/chain glow pulses read it). Port
  `jadeWaveRiders` (lyre gems) to the same `(station, offT/B/N)` decomposition so they ride the bend.
- **Pin station 0 + the shoulder frame to `restFrames`** so the head child + rider socket stay glued to
  the neck (they ride the group transform, placed once at `attach.headBase`/`riderSocket`).
- **Safe by construction:** camera (`cameraController.js`) and aim/reticle key only off `player.position`
  (the head at group origin) — a trailing/coiling body never touches them. Collision is a point+radius on
  the player (visual coil ≠ hitbox — same contract as today's sine). All new code is under
  `if (bodyWave.ribbon)` → only jade sets `.ribbon` → the rest of the roster is byte-identical.
- **Perf:** ~900-1000 verts × (9 mul + 6 add, no trig, no branch) + an O(N≈30) sim ≈ **15-25µs/frame**,
  no per-frame allocation (scratch-vector reuse), one `position.needsUpdate` (no `computeVertexNormals` —
  `flatShading` derives normals from positions). Well inside 60fps on weak mobile.
- **Determinism:** pure function of `(dt, steer, speed)` + prior state; no `Math.random`/wall-clock (swim
  uses an owned accumulated sim-time). Feed `restFrames` → output equals baked positions bit-for-bit.
  Use a fixed sim sub-step for the PBD pass so stiffness is dt-independent across machines.

---

## 4. Acceptance rubric (Fable — pass/fail, headless-measurable)

- **R1 Path-tracing:** every spine sample within 0.25 body-radii of the head's historical path at its
  arc-length delay. *(the ribbon property)*
- **R2 Arc-length conservation:** total spine length varies <2% across all manoeuvres.
- **R3 Straight-line settle:** after ≥2 body-lengths straight, lateral deviation decays to the residual
  idle-swim floor (idle swim itself ≤25-30% of current cruise amp — a faint life-sign, not the motion).
- **R4 Steer impulse → travelling S:** one sharp steer = one curvature pulse propagating head→tail at
  flight speed (not simultaneous along the body).
- **R5 Sustained turn → coil:** holding max turn ≥1.5 body-lengths wraps ≥270° of accumulated heading
  into a visible spiral, curvature roughly uniform.
- **R6 Release → tail-last unwind:** centring from a coil unwinds head→tail as each station's delay
  expires (NOT a global lerp-to-straight — that's the rubber-band veto).
- **R7 Smoothness:** per-frame point displacement bounded (no teleports); bend angle clamped (no kinks);
  C1 frames (no twist pops).
- **R8 Welded-appendage carriage:** fans, leaf-fork, wave-rider gems track their stations within 5%
  through a whip (no shear, no detach).

**Vetoes:** rubber-banding (chasing the head's *current* pose, not its *past*), conga-line segmentation,
tail detach/overshoot, kinks/twist-flips (naive Frenet), fan/tail shear (x-offset instead of frame
transport), a body that ignores input, framedrops, or the head visual drifting from the gameplay head.

---

## 5. Staged rollout (a probe gates each increment)

- **Inc 0 — identity scaffold, zero visual change.** Add the metadata arrays + `bodyWave.ribbon`; drive
  the branch with `liveFrames = restFrames`. *Probe:* new `tests/ribbonspine.mjs` asserts
  `reconstruct(restFrames) == baked positions` (<1e-5), no NaN; `starters`/`tricount` unchanged; a jade
  hero shot pixel-identical.
- **Inc 1 — static bend proof.** Feed a hand-authored C-coil frame set. *Probe:* weld invariants (fan
  vert↔station offset constant, head pinned), no NaN; a rendered still showing tube+fans+tail+stripe
  coiled and riding the bend.
- **Inc 2 — swim through the new pipe.** Express the existing sine as a binormal offset on `liveFrames`;
  port wave-riders + keep glow pulses. *Probe:* A/B visual parity vs shipped swim; a `slither.mjs`-style
  numeric test (head anchored, tail full-amp, crest travels).
- **Inc 3 — dynamic follow-the-leader.** Fill `liveFrames` from head-lead + lagged `velocity.x/.y`
  history (the §2 motion model). *Probe:* headless spine-follow test (scripted hard-left→right: tail
  trails with increasing lag, curvature bounded, station 0 pinned, determinism) + the Fable test tapes
  below.
- **Inc 4 — polish + gates.** PBD spring pass if needed; `tricount`/perf budget; **the Fable feel gate**
  on rendered clips.

**Fable sign-off tapes (deterministic scripted input, frames + spine dump):** (1) straight-line settle,
(2) slalom (R1 path-deviation histogram, R4 crest-propagation), (3) turn-in-place coil (≥270°, then
tail-last unwind R6), (4) whip-crack (amplitude vs arc-length, no >30% overshoot), (5) weld-integrity
probe (R8), (6) perf+determinism (≤~1ms deform, zero alloc, repeated-run hash), (7) arc-length trace
(±2% R2).

---

## 6. Starting knobs (from the algorithm survey)

`SEG 0.42` · `NSTATION 30` · `MIN_SAMPLE_DIST 0.10` · `HISTORY_LEN 256` · `whipGain 12/s (crisp)→4/s
(whippy)` · `STIFF 0.45` · `DAMP 0.82` · `CONSTRAINT_ITERS 1` · `SWIM_AMP 0.18` · `SWIM_FREQ 0.9` ·
`SWIM_SPEED 3.0/s` · `headFadeStations 4` · Catmull-Rom α 0.5 (centripetal).

## 7. Sources
Arc-length reparameterisation; path-history/delay-line follower (in-repo `bossBullets.js ribbonSample`);
Verlet (Jakobsen 2001); Position-Based Dynamics (Müller 2007) / XPBD (Macklin 2016); FABRIK (Aristidou
2011); centripetal Catmull-Rom (Yuksel 2011); parallel-transport / rotation-minimising frames (Bishop
1975; Hanson & Ma 1995; double-reflection RMF, Wang 2008).
