// Central tuning constants for Dragon Drift.
export const CONFIG = {
  // Flight lane bounds
  laneHalfWidth: 13,
  laneMinY: 2.5,
  laneMaxY: 22,
  playerRadius: 1.2,

  // Speed system
  baseSpeed: 35,
  boostSpeed: 65,
  orbSpeed: 80,
  orbDuration: 2,
  speedEase: 5,
  lateralSpeed: 24,
  verticalSpeed: 18,
  moveAccel: 6,

  // Time-based speed ramp (separate from distance difficulty)
  speedRampStart: 20,     // seconds before ramp begins
  speedRampEnd: 90,       // seconds to reach max ramp
  speedRampMax: 1.35,     // max multiplier on base/boost speed
  lineDesignSpeed: 80 * 1.35,
  minRewardHopTime: 0.72,
  idealRewardHopTime: 0.85,
  lateGameReachSafety: 0.68,
  gateReachSafety: 0.62,
  boostSteeringBonus: 1.15,

  // Stamina system — boost is a STRATEGIC resource, not a permanent hold. It
  // depletes if you just hold it; normal rings only PARTLY pay for it; perfect
  // rings pay more; speed orbs are the real boost-extender; and Dragon Surge
  // eases the burn but never makes it free. (Per-dragon drain/regen stats still
  // scale these, so the stamina stat actually matters.) Tune by feel.
  staminaMax: 110,
  staminaDrain: 20,
  staminaRegen: 16,
  staminaRegenDelay: 0.8,
  ringStamina: 11,
  perfectRingStaminaBonus: 6,   // perfect rings refund this much ON TOP of ringStamina
  gateStamina: 13,
  orbStamina: 35,
  feverStaminaDrainMult: 0.65,  // Dragon Surge eases the boost burn (× drain, not free)

  // Health / collision
  healthMax: 100,
  obstacleDamage: 25,
  groundDamage: 15,
  invulnTime: 1.0,

  // Biome hazards (dodge-only; BIOME-DESIGN.md §5.3). Each placed vent runs a
  // burst loop on GAME TIME: warn (magenta telegraph, per-biome hazard.warn) →
  // hazardBurstDur (the column is up + lethal) → hazardIdle (dormant), phase-
  // offset per vent so they never fire in lockstep. Damage routes through
  // collision.hitPlayer — zero knockback, a barrel-roll clears it (owner
  // decision #2: hazards never apply force).
  hazardBurstDur: 0.8,   // seconds the erupted column stays lethal
  hazardIdle: 2.6,       // seconds of dormancy between cycles
  hazardDamage: 25,      // same sting as an obstacle; i-frames / a roll dodge it

  // Scoring
  ringScore: 100,
  ringCenterBonus: 50,
  ringCenterRadius: 1.4,
  gateScore: 150,
  comboStep: 0.25,
  comboMax: 5,
  distanceScore: 1,
  milestoneStep: 500,     // distance popup every N metres

  // Near-miss system
  nearMissBonus: 25,
  nearMissCooldown: 1.8,  // seconds before same obstacle can award near-miss again

  // Assist-off score bonuses (settings): flying without the target reticle
  // and/or without last-chance slow-mo pays a permanent score multiplier.
  reticleOffBonus: 0.10,
  slowMoOffBonus: 0.15,
  // Glide Assist (beginner auto-fly): trades a slice of the score multiplier for
  // accessibility — the inverse of the assist-off bonuses above.
  glideAssistScoreMult: 0.7,

  // Barrel roll (dodge move: brief i-frames, near-misses still award)
  rollDuration: 0.45,
  rollCooldown: 1.2,
  rollImpulse: 30,        // lateral velocity kick
  rollInvuln: 0.5,        // i-frame window from roll start
  rollBonus: 50,          // style points × combo

  // Surge phase-through: during Dragon Surge, a well-timed barrel roll shatters
  // through a crystal wall (gate) that would normally crash you. Spends stamina
  // (which is why the stamina budget above is generous) and pays style points.
  phaseStaminaCost: 110 / 3,  // a third of staminaMax → exactly 3 phases per full bar (one per stamina segment)
  phaseBonus: 150,        // style points × combo on a successful (minor) phase
  // Tiered phase feel (modeled on perfect rings): a cleanly-timed roll just before
  // the wall keeps lots of i-frame window left at the crossing → PERFECT; a desperate
  // last-instant roll scrapes through → minor. Forgiving window, like a perfect dodge.
  phasePerfectWindow: 0.18,       // rollInvuln (s) remaining at the wall to count as perfect
  phasePerfectBonus: 200,         // extra style points × combo on a perfect phase
  phasePerfectStaminaRefund: 22,  // refund of the cost on a perfect (net ~18 spent)
  phaseShatterDur: 0.35,          // wall scatter animation length (s)

  // Fever / Dragon Surge
  feverThreshold: 8,      // legacy display fallback
  firstFeverThreshold: 5,
  normalFeverThreshold: 8,
  feverDuration: 8,       // seconds of surge state
  feverMultiplier: 2.0,   // score multiplier during surge

  // Rings
  ringRadius: 3.6,
  ringCatchRadius: 3.9,

  // Gates: the window never shrinks — difficulty moves it off the natural
  // path instead (see level.js).
  gateGapW: 3.8,
  gateGapH: 3.4,

  // Sky Canyon — a twisty rock-run set-piece that OVERLAYS the existing flight
  // path (rock gates framed around already-generated reward rings). Driven by an
  // independent RNG stream + separate output arrays so the base course
  // (rings/obstacles) for any seed stays byte-identical — old challenge links and
  // the gold-determinism fixture are untouched. Rocks are NON-fatal (health
  // damage, roll-clearable) so a canyon is a pressure beat, not a run-ender.
  canyonGapW: 4.4,            // half-width of the safe opening (≥ gateGapW)
  canyonGapH: 3.9,            // half-height of the safe opening (≥ gateGapH)
  canyonThick: 2.2,           // z half-depth of a rock gate (collision + mesh)
  canyonSegments: [9, 13],    // a Rock Run sustains ~9-13 gates of enclosed canyon then opens up
                              // (longer than [8,11] so the weave+boost cadence sustains, fewer dead beats)
  canyonFlowSegments: [12, 16], // a FLOW run (the Rhythm Flow-Tube): 12-16 light-gates ≈ 11-14s of
                              // chain — long enough that "hold the line end-to-end" is a real ask
  // GUARANTEED aurora flow run (supersedes the deferred PR-5 flowBiomeBias): the Aurora Shallows
  // biome always contains exactly one flow run — the dreamy sky + the speed-tube as one signature
  // moment. A canyon is SNAPPED to start at aurora-block-start + offset, its type forced to flow, and
  // no natural canyon may be scheduled within the shadow before it. (level.js snapCanyonToAurora.)
  canyonAuroraFlowOffset: 150,  // injected mouth = auroraBlockStart + this (world already fully aurora at
                                // start; leaves ~1.5-3s of open mirror-sea breath before the Sky-Gate posts)
  canyonAuroraFlowShadow: 3400, // TYPE-forcing pre-roll (spine bleed span): a SPINE run starting within
                                // this before an aurora block would carry into it, so it's converted to
                                // flow (rock uses a 1500 span inline; a run too short to reach keeps its
                                // type → variety preserved). TYPE-only — the natural SCHEDULE is untouched,
                                // so canyon frequency everywhere is unchanged (no desert). 100% coverage
                                // over 400 seeds; ~60% of canyons near the aurora read flow (owner dial).
  canyonAuroraFlowSegments: [12, 12], // fixed 12 (~1050m) so the whole run sits under auroraMix≥~0.85
                                      // even past the exit ramp; [12,13] is a one-number length dial
  canyonFlowFill: 260,        // max ring-gap (m) the flow orb ribbon fills; a wider gap is a genuine
                              // gauntlet bridge (the slalom is its own beat) and stays open. Covers
                              // breath-beat spacings (~192m) with headroom; excludes 300m+ gauntlets.
  // Flow run "carve": the pickup ribbon is a walls-free SLALOM — the biggest banking in
  // the game (rock/spine are wall-/tube-ceilinged; flow's only ceiling is the steering
  // budget). The line sways off the straight ring-to-ring path between gates and pours
  // back to dead-centre AT each ring (a perfect stays flyable). Holding the carve is the
  // mode. Amplitude is slope-budget + orb-clamp-lane trimmed (fair by construction).
  // Set both to 0 for the byte-identical PR-1 straight ribbon (rollback dial).
  canyonFlowWeaveAmp: 7.0,    // lateral carve cap (m); per-half adaptive trim keeps it flyable
  canyonFlowWeaveAmpY: 2.5,   // vertical corkscrew cap (m); apexes cycle x/y for a slow helix
  // Flow run MOMENTUM (PR-3): holding the carve builds game.flowChain, which drives an
  // escalating SLIPSTREAM — the world rushes faster the longer you hold the line, and
  // DROPS (decelerates under you) when you break it. The stakes that make the carve matter.
  // Co-scale law: the slip multiplies speed AND steering (player.js) + divides assistAxes,
  // so every reachability ratio stays exactly valid — the mode is fair by construction.
  FLOW: {
    slipPerChain: 0.015, // slip target = 1 + this × min(flowChain, chainCap)
    chainCap: 20,        // → slip 1.00 … 1.30 (toned from 1.40: on the fastest dragon (Solar)
                         // the slip compounded on the high speed-stat and read TOO fast; 1.30
                         // sits just under spine's 1.325. A pure feel dial — nudge either way.
    chainStep: 0.10,     // flow-local score mult = 1 + this × min(chain, chainCap) → ×1 … ×3
    orbScore: 30,        // score per flow ribbon orb (× chainMult × scoreMult; NOT × fever — no double-dip)
  },
  // Sky Canyon run-type weights (the startCanyon picker draws ONE canyonRnd and maps it
  // through these). flow = the Rhythm Flow-Tube (a walls-free speed showcase). Setting
  // flow:0 renormalizes rock/spine to 50/50 = byte-identical to the pre-flow picker (the
  // rollback dial). The single-draw mapping keeps the canyonRnd stream aligned.
  // rock DISABLED in normal play (owner: the rock run detracts — spine + flow only).
  // The type draw is STILL consumed (rock:0 → r < 0 never hits), so the canyonRnd
  // stream stays aligned; natural rock runs simply remap to spine/flow. The whole
  // rock-run kit (incl. the flag-gated strait2 props-in-lane build) is preserved and
  // returns by restoring a nonzero rock weight. ?canyon=split still forces it for dev.
  canyonTypeWeights: { rock: 0, spine: 35, flow: 30 },
  spineSegments: [15, 19],    // a Dragon Spine Canyon: skull→throat→long rib run→straight boost-out
                              // (longer than [13,16] so it reads as a sustained speed tunnel)
  canyonSpineSlip: 1.325,     // SLIPSTREAM speed-up inside the SPINE speed tunnel (spine only, not
                              // rock). Steering co-scales by the SAME factor so every reachability
                              // ratio (and the whole canyonflow audit) stays exactly valid — the
                              // world rushes faster, the inputs stay identical relative to it.
  canyonSlipEase: 2.0,        // per-second damp rate toward the slip target (smooth in/out at seams)
  canyonSpineSwayAmp: 2.6,    // lateral SWEEP of the rib tube between rings (0 at each ring so a
                              // perfect stays dead-centre; peaks at the seams, sign-flips per section
                              // → one long gentle S-curve, the racing-tunnel feel). Slope-budgeted.
  spineFinaleSegs: 6,         // the closing STRAIGHT rib tunnel — a boost in each segment (~6-8s)
  canyonIntervalBase: 1500,   // metres between canyons (rarer than gauntlets)
  canyonIntervalJitter: 1100,
  canyonFirstAt: 900,         // earliest a canyon can begin (past the tutorial)
  // Decompression buffers: no Phase Gate (crystal wall) in the approach just
  // before a canyon MOUTH, nor for a stretch AFTER the exit — so bursting out of
  // a rib finale at full boost never dumps you straight into a blind, off-line
  // crystal wall (phase-or-crash). The exit buffer is sized so even a speed-stat
  // dragon boosting out (orb speed ~108-125 m/s) meets the next wall in open air,
  // in view, after boost decay has begun (carry ~170-195m + ≥90m readability).
  canyonEntryBuffer: 120,     // metres of gate-free approach before a canyon mouth
  canyonExitBuffer: 400,      // metres of gate-free open air after a canyon exit (400, was
                              // 380/350: as the spine slip dial climbs (now 1.40 → boost-out
                              // peak ~151 m/s) this keeps ~3.4s of readable open air before
                              // the first post-exit crystal wall)
  canyonFadeNear: 1,          // dz where a rock has fully dissolved (at camera)
  canyonFadeFar: 16,          // dz where a rock is fully solid again
  // Vertical limit (active ONLY inside a canyon run): you can't climb over the
  // rock to skip it — flying above the ceiling bounces + chips like the floor.
  // The gap clamp spans the full ring band so the framing always centres on the
  // actual reward ring (a tighter clamp made the skull mouth drift off the ring);
  // the ceiling sits just above the highest ring with a little headroom.
  canyonCeilingY: 21,
  canyonGapYLo: 5.5,
  canyonGapYHi: 19,
  canyonCeilingDamage: 12,    // chip on scraping the ceiling (gentle, like ground)
  // Rock Run "carved slot" (v2): a threaded, gently-swayed single channel (like the
  // ribcage), instead of the old teleporting double-wall slalom with overhead-arch
  // ducks. One axis at a time — the vertical squeeze stays the 'overunder' beat.
  canyonRockV2: true,         // false = byte-identical old stackRun geometry (rollback flip)
  canyonSwayAmp: 6.5,         // sway CAP (m); per-half adaptive trim keeps it under the slope + lane budgets.
                              // High so the weave is FELT — the corner can't be cut (amp > channel half-width).
                              // 6.5 (was 5.5) gives the rock run more banking spectacle where headroom exists;
                              // the solved lane/slope caps still trim it, so the flow audit stays green.
  canyonPinchHalf: 4.0,       // channel half-width at the ring approach (tight so the sway amplitude
                              // exceeds the half-width → the corner physically can't be cut)
  canyonBreathOpen: 1.0,      // extra half-width at the seams. KEPT SMALL so the channel at the sway peak
                              // (the seam) stays NARROWER than the sway amplitude — otherwise the slot opens
                              // exactly where the curve turns and you can fly straight through (self-cancel).
  // Rock-run-LOCAL effective lane half-width. The rock sway amplitude per section-half
  // is min(canyonSwayAmp, aSlope, aLane); MEASURED across 6 seeds, the binding cap is
  // aLane (the lane-margin) on ~81% of halves at the global laneHalfWidth 13 — NOT the
  // slope budget — so WIDENING the rock lane is the real "more banking" lever (mean sway
  // 2.28m→4.41m at 16; aSlope only takes over near 18). This widens ONLY the rock run:
  // the global laneHalfWidth (13) is untouched, so the base course, boss arenas and the
  // spine tube are byte-identical. The widen is pinned to the run INTERIOR — the first
  // entry-half and last exit-half stay at laneHalfWidth so the fatal wall never has to
  // move outward inside the ±40m entry/exit ease bands (canyonMath rockSlicePlan +
  // main.js eased boundary + collision soft-clamp). Set === laneHalfWidth to disable
  // (byte-identical rollback dial, like canyonRockV2).
  canyonRockLaneHalfWidth: 16,

  // Endless generation
  spawnAhead: 500,
  spawnAheadTime: 7,    // minimum reaction seconds; lead = max(spawnAhead, speed×this)
  cullBehind: 80,
  difficultyRamp: 1800,
  pathClearance: 5,
  seed: 1337,

  // Biomes (see biomes.js)
  biomeLength: 1500,      // metres per biome before cycling
  biomeTransition: 150,   // crossfade band at each seam

  // Boss fight — a bullet-hell encounter that OVERLAYS the endless flight (like
  // Sky Canyon): the boss flies in, settles in front and "flies backward" at a
  // fixed player-relative distance while forward motion continues. Bullets close
  // toward the player in the player-relative frame and are dodged in the X/Y lane.
  // Gated by game.inBoss so a normal run is untouched when no boss is active.
  // THE LANCE (lock) layer — the player combat-verb system (combat-verbs SOP §II.3).
  // Legend: LAW = locked (owner sign-off to change); TUNE(range) = adjustable within
  // range without re-approval, provided the sim gates stay green. Neutral at rung 0:
  // a def WITHOUT lock data behaves byte-identically to before this block existed.
  LOCK: {
    // V1 aim-line. Position-match and target-MOTION are different failure axes (L175/L177):
    // the ACQUIRE cone stays tight (it prices exposure — corner 3.68m < grazeR 4.15m) while
    // retention + drain + anchor smoothing make a moving organ holdable, so boss motion never
    // has to be nerfed to fit the aim model.
    coneXY: 2.6,            // LAW — ACQUIRE cone, m/axis at the boss plane; NEVER per-dragon or per-boss
    retentionConeXY: 4.0,   // TUNE(3.5–4.5) — HOLD cone once a dwell is accruing/held: tight to
                            // catch, forgiving to keep (classic aim-assist shape; exposure was
                            // priced at acquisition and drain bounds how long retention coasts)
    dwellTime: 0.35,        // LAW (shared clock: V1 acquire + V2 paint)
    coyote: 0.20,           // TUNE(0.10–0.20) — dwell FREEZES through a cone flicker up to this
    dwellDrainMult: 2.0,    // TUNE(1.5–3.0) — past coyote, dwell DRAINS at this × dt instead of
                            // hard-resetting: progress visibly melts, a swing-through carries
                            // partial credit, and the progress fill teaches "catch it at the
                            // turn" wordlessly
    anchorSmoothT: 0.25,    // LAW — EMA time-constant low-passing the tracked organ's world pos.
                            // §3 law 7 guarantees every boss idles at ≥2 frequencies, so the aim
                            // anchor must chase the organ's centre of motion, not its animation
                            // frame — a raw anchor jitter-breaks locks by construction
    linger: 0.6,            // TUNE(0.4–0.8) — aim-line persistence after leaving the cone
    relockMemoryS: 4.0,     // TUNE(2–6) — SOUND-ONLY window after a held line lets go: re-grabbing
                            // that same organ within it is a "warm" re-acquire (hum suppressed,
                            // lockOn downgraded to a tick — the weave-away-and-back nag fix).
                            // Matched to `decay` (a set stays warm as long as its brands live).
    relockWarmFrac: 0.4,    // TUNE(0–0.6; 0 = off) — GAMEPLAY (owner sign-off, granted): a warm
                            // re-acquire seeds this fraction of the EFFECTIVE dwell need, so weaving
                            // away to DODGE and back costs less than a fresh lock — the attention-
                            // economics fix: dodging no longer taxes the lock. The seed is scaled by
                            // the focus multiplier in lockLayer.js (always `frac` of what you'd owe),
                            // so a focused re-grab is a true 40% discount (~8 frames), NOT the old
                            // ~4-frame snap, and the whole range is safe (seed < need for any frac<1
                            // — no same-frame-lock cliff). First acquisition still pays full dwell;
                            // volley total stays ROI-clamped (volleyRoiFrac). 0 = inert (sound-only).
    paintHopGrace: 0.8,     // TUNE(0.5–1.2) — after a paint the aim RELEASES and the painted
                            // organ can't re-acquire for this long, so the reticle decisively
                            // HOPS to the next unpainted organ (owner playtest: hovering the
                            // painted rib pinned the whole flow — you waited for a second
                            // reticle that could never come). Deliberate refresh = hover past it.
    chipRateMult: 1.15,     // LAW — rider interval ÷ this while the line holds an organ
    exposureTickInterval: 0.8, // TUNE(0.6–1.0)
    exposureTickDmg: 1.0,   // TUNE(0.5–1.5); max 3 ticks per exposure window (LAW)
    quietDwellMult: 0.5,    // LAW — danger-binding: dwell rate while no boss fire is live
    // V2 paint & volley (wired from PR2 — data present now, inert in PR1)
    capByTier: { 1: 0, 2: 3, 3: 5, 4: 6, 5: 6 },  // LAW ladder
    decay: 4.0,             // TUNE(3.0–4.0) — per-lock lifetime WITHOUT a fresh brand; a new
                            // paint/stack now refreshes the whole set (freshenLocks), so this
                            // is the "you stopped branding for 4s → it fizzles" clock, not a
                            // race against building a set (owner playtest: brands unpainted
                            // while flying between BRINEHOLM's spread eye + shackles)
    refreshDwell: 0.15,     // TUNE(0.1–0.2)
    stackMax: 2,            // LAW — per part, tiers ≥3 only
    stripNewestMaxTier: 2,  // LAW — ≤ this tier a hit strips newest only; above strips all
    capFuse: 1.0,           // LAW — delay between reaching cap and auto-release
    lanceDmg: 2.0,          // TUNE(1.2–2.4) — screw #1
    lanceWeight: 0.5,       // LAW — counts HALF toward PART_CRACK_HITS (rider-chip parity)
    lanceStaggerMs: 60,     // LAW
    volleyRoiFrac: 0.10,    // LAW — hard clamp at release: volley total ≤ this × current phase hp
    // WYRMFIRE WISPS (PR4a) — lance-volley flight FX. READS ONLY: vrel and the
    // arrival/damage laws are untouched, so a wisp lands on the same frame the
    // plain lance did (boss.mjs kill-time invariance by construction).
    lanceFanDeg: [65, 115, 15, 165, -35, 215],
                            // LAW — authored launch bearings (degrees, screen plane, 0=+x):
                            // mirrored PAIRS widening around 90° (§3.6 symmetry: authored
                            // placements, never random); index = volley slot i % 6
    lanceFanSpeed: 26,      // TUNE(18–32) — m/s along the fan bearing at release
    lanceHomeDelay: 0.16,   // TUNE(0.10–0.22) — pure-arc seconds before homing engages.
                            // CEILING LAW: flight ≈ (settleGap−1.5)/bossSpeed ≈ 0.55s and
                            // the arrive controller needs ≥0.3s to close fanSpeed×delay
    lanceHomeBlend: 0.15,   // TUNE(0.10–0.25) — steer-gain ramp-in after engage (no elbow)
    lanceSteerGain: 9,      // TUNE(6–12) — arrive gain once engaged (pre-wisp inline was 5)
    lanceCurlRate: 3.2,     // TUNE(2.0–5.0) — rad/s velocity rotation during the arc; sign = i parity
    // THE LUNGE (PR-C, owner's idea): wisps EMERGE lazily then ACCELERATE onto
    // their brand — vrel follows a linear profile p(u) = p0→p1 over the flight.
    // LAW: (p0+p1)/2 === 1 (∫p = 1) so the wisp lands on the IDENTICAL arrival
    // frame as constant speed (L186; enforced by a position-tracking controller
    // in bossBullets — exact under any dt; T-W2/T-W8 are the wall). null = off.
    lungeProfile: [0.4, 1.6],
    // WISP LIGHT-RIBBONS (PR4b — owner: the volley was lost in the bullet sea).
    // The silhouette law: the volley must be the ONLY LINE-class shape among the
    // enemy's dot-class bullets (Panzer Dragoon's homing lasers are persistent
    // curved light-ribbons fading tail-first — the afterimage IS the spectacle).
    // Ribbons replace the PR4a sprite-mote trails (retired).
    ribbonRings: 22,        // LAW — position-history samples per wisp ribbon (~0.37s of path)
    ribbonHalfWMax: 0.26,   // TUNE(0.18–0.34) — head half-width; THIN is the overdraw law
                            // (a thin strip is near-line/exempt; bloom carries the glow)
    ribbonHot: 2.0,         // TUNE(1.2–2.4) — ribbon HDR colour scale (mild bloom, toneMapped off).
                            // Bumped 1.6→2.0: with the head white-wash cut (bossBullets), the
                            // JADE ribbon now carries the wisp's colour identity (owner: "bland
                            // white comets, needs pazzazz") — a hotter jade tail, thin strip so
                            // no extra draw AREA (the overdraw law is area, not intensity)
    headHot: 3.5,           // TUNE(2.5–6) — hot-head HDR scale (the EYE_HOT idiom: the head is
                            // the brightest pixel in its neighbourhood; toneMapped bullets can't compete)
    ribbonFade: 0.35,       // TUNE(0.25–0.6) — tail-first afterimage drain after arrival
    wobbleAmp: 0.85,        // TUNE(0–0.9) — homing snake-wobble (m); DECAYS to 0 before arrival
                            // so the landing law is untouched (T-W2 is the wall). Bumped
                            // 0.55→0.85 (owner: "increase weave" — read the wisps as a
                            // predator snaking onto its prey); LAW: < bossHitRadius/4 (1.05)
    wobbleHz: 3.0,          // TUNE(1.5–4) — snake frequency; phase = volley slot (bumped for
                            // a tighter, more urgent weave to pair with the wider amplitude)
    impactStaggerMs: 40,    // LAW — plural-impact PRESENTATION spacing (damage stays same-frame;
                            // the drum-roll is FX + the lockStrike arpeggio only)
    // ORGAN SHIMMER (PR6, owner design; boosted — owner playtest "let me PICK my
    // prey"): every UNPAINTED paintable organ carries an in-world jade breath —
    // diegetic ("this part is brandable, fly here"), works with or without the
    // reticle, perspective-true. It is the pick-menu: you SEE every target and
    // choose which to fly to (it darkens the instant a target is painted, so the
    // remaining shimmers are what's left to grab). Goes DARK while the organ vents
    // amber (C3 — "can't paint now"), while the boss is deflected (sealed), painted.
    shimmerOpacity: 0.34,   // TUNE(0.06–0.4) — peak breath opacity (boosted from 0.13 to read as a clear "paint here")
    shimmerHz: 2.2,         // TUNE(1.5–4) — breath rate
    tetherOpacity: 0.22,    // TUNE(0.1–0.35) — PR7 in-world attribution line dragon→brand
                            // (additive LineSegments; the line dims with the brand's life)
    paintCooldown: 0.22,    // TUNE(0.15–0.6) — cross-organ paint spacing: min gap between ANY
                            // two paints. Cut from 0.45 (owner playtest: "lag between each pip,
                            // hovering for ages") — still enough to keep back-to-back paints from
                            // reading spammy, but the pip cadence is now snappy on a spread boss
    // V3
    beamAimDisc: 4.0,       // LAW — m; nearest partWorldPos within this of the player line
    beamPartWeight: 1.5,    // TUNE(1.0–2.0)
    tapVolleyMinLocks: 2,   // LAW — case-3 floor
    // V3.E1
    beatWindow: 0.12,       // LAW — ± seconds on getBeatClock()
    beatMult: 1.25,         // LAW — volleys ONLY, never the Surge beam/break
    // UNLEASH PHRASE — BEAT-ALIGNED INHALE (C1, revised in PR-B). The CAP
    // auto-release lands its drop on the song's beat by STRETCHING the inhale to
    // end a void before the beat, then firing immediately (no dead post-fuse hold
    // — the PR9 version of that read as lag; owner playtest). LAW (PR9.1): a
    // MANUAL tap is NEVER delayed — the tap is the player's timing and the E1
    // on-beat bonus is the skill expression; a manual volley's impact roll only
    // snaps to the grid when the tap was PERFECT ("on the beat" is earned). The
    // only behavior-adjacent change: the cap fuse LENGTH flexes ±½ beat and the
    // launch carries the void delay; headless (no clock) → plain capFuse, D=0,
    // byte-identical (T-E2). tap/decay/fork: never delayed.
    releaseQuant: true,     // LAW gate — false = verbatim v1 (plain capFuse, no align)
    releaseGapMs: 60,       // TUNE(40–80) — the riser's silence VOID before the
                            // drop, and the cap launch delay that lands it on the beat
    // THE VISIBLE INHALE (PR-C): the rear-cam charge telegraph while the cap
    // fuse burns — torso arch + wing mantle + jade gather, all driven by fuse01
    // and byte-inert at 0 (the L245 endpoint law).
    inhaleArch: 0.38,       // TUNE(0.2–0.6) — whole-body rear-up at full breath (rad)
    inhaleFlapCalm: 0.6,    // TUNE(0.3–0.8) — flap-rate cut at full breath (wings hold)
    gatherRateHz: 10,       // TUNE(4–12) — gather spark pulses per second (bumped 8→10 so
                            // the convergence reads as a continuous stream, not a stutter)
    gatherCountBase: 4,     // TUNE(1–4) — sparks per pulse ≈ base·pips/2 (6 pips = a storm).
                            // Bumped 2→4 (owner: "can't see much noticeable jade sparks gather")
    // The INHALE riser (C3 — riser→gap→drop, replacing the plain swell): an
    // uplifter bed + sub + an accelerating tick-ratchet whose speed scales
    // SUPER-linearly with the pip count (C4 — a 6-set must not sound like 2×3).
    riserTickBase: 7,       // TUNE(5–10) — ratchet ticks/s at n=3, ramp start
    riserTickPowN: 1.6,     // TUNE(1.2–2.2) — super-linear n exponent on the rate
    riserMaxHoldS: 1.6,     // LAW — plateau ceiling past the fuse (deflect mid-
                            // fuse etc.); the riser self-fades after this so a
                            // stalled release can never strand a drone
    // The IMPACT RUN (C5): strikes climb the LIVE chord (plucks + detonation
    // pops — PR-C), and the run lands as an accelerando roll instead of an even
    // 40ms stagger. The finale is an N-scaled DETONATION (sized by the riser's
    // pow(n/3, riserTickPowN) class knob — no chord, no held voices).
    // Presentation only — damage stays on the arrival frame (L186).
    rollAccel: 0.8,         // TUNE(0.65–0.95) — impact-gap shrink factor per k
    rollMaxS: 0.6,          // LAW — total presentation-roll span ceiling (organ
                            // flash fires on the true arrival frame; past this
                            // the spark/sound drift reads as desync)
    impactDuckAmt: 0.18,    // TUNE(0–0.3; 0 = off) — per-strike music duck via
                            // the pumpGain sidechain node (the L191-safe lane)
    // v3 wisp-impact "destructiveness" (owner: the per-hit landing sounded like a
    // tuned drum roll, not ordnance breaking a target). Added a waveshaped broadband
    // crunch + in-key saw grit + a debris/scorch tail to brandStrike; these tune it.
    strikeCrunchVol: 0.07,  // TUNE(0–0.12) — saturated broadband CRUNCH front level (the main "bite")
    strikeGritDrive: 0.65,  // TUNE(0.4–0.9) — soft-sat drive on the impact grit (>0.8 reads as artifact, not violence)
    strikeDebrisVol: 0.028, // TUNE(0–0.05) — per-hit falling-shard / ember-sizzle debris-tail level
    lanceHoldAmt: 0.32,     // TUNE(0.2–0.45) — Wyrm profile's ONE-per-volley sustained sidechain
                            // hold (deeper than impactDuckAmt: a held hole earns more depth than the
                            // per-hit flutter, and must out-dip the groove's own kick pump)
    // V4
    snapPerVolley: 1,       // LAW — max V4 paints per amber volley; 0 during fever (LAW)
    // V5
    focusArmMs: 300,        // LAW — must stay > tap ceiling 260
    focusDwellMult: 0.5,    // LAW
    // score (embers NEVER)
    paintScore: 10, lanceHitScore: 15, perfectReleaseScore: 150,  // LAW: parry stays score-premier
    // LENS (intervention 3a) — reticle YIELD: while a boss bullet is closing to within
    // `tti` seconds of the player's lane, the aim chrome's GLOW eases back so the threat
    // is the loudest thing at the point of gaze. Presentation only (read by reticle.js
    // under ?lens=2; inert otherwise) — the lock state machine never sees it, and the
    // lock border / dwell fill are never dimmed. tti: 0 disables the yield entirely.
    reticleYield: { tti: 0.9 },
    // SCAR-BURN (docs/lance-progression-redesign.md §4b; owner sign-off 2026-07-10)
    // — the endgame's earned escalation. A deliberate ON-TELL manual release (the
    // volley's `perfect` flag: source 'tap' AND ctx.beatOn on the boss's OWN tell —
    // KNELLGRAVE's toll) of >= `burnFloor` painted pips, on a tier >= `minTier` boss,
    // leaves a burning brand: an EXTRA `frac × volleyTotal` paid over `dur` seconds as
    // scheduled DOT ticks. The cap AUTO-release NEVER burns (the safe fallback); a
    // non-tell tap is today's plain volley. Homed in boss.js (a `burns[]` list off the
    // lockVolley event) — NOT lockLayer (that module owns no game state); ticks pause
    // while deflected and CANCEL on phase-transition (the shield-BREAK at breakShield)
    // + fight teardown. Kind 'lockburn' accrues NO part-crack hits and charges NO
    // meters. Byte-inert below minTier and when frac is 0/absent (tiers 1-3 unchanged).
    // `fracBySlot` ramps by boss (gentle openers; the finale is retuned to ~1/3, §8D).
    // echoDmgMult is the ONEWING spectral-echo dial (later PR), parked with the family.
    scarBurn: {
      minTier: 4,           // LAW — tiers 1-3 byte-identical (no burn)
      burnFloor: 3,         // LAW — min painted pips in the release to earn a burn
      dur: 3.0,             // TUNE(2.0-4.0) — burn lifetime (seconds)
      tickInterval: 0.3,    // TUNE(0.2-0.5) — seconds between burn DOT ticks
      echoDmgMult: 0.5,     // ONEWING spectral echo-pip damage (rung 12): a ghost pip strikes at ×0.5 and prices the ROI clamp by 0.5
      fracBySlot: {         // per-boss burn fraction of the (already ROI-clamped) volley
        knellgrave: 0.25,   // WE opener — gentle
        weftwitch: 0.30,    // WE mid — her music is LIVE, so the perfect release is the normal on-beat tap (no toll-clock analog)
        onewing: 0.30,      // WE late (rung 12) — burn on REAL pips only (ghosts never earn it). ONEWING has LIVE music, so the perfect on-tell release is the normal on-BEAT tap (generic beat clock, not a toll/wind-up analog). 0.30 not 0.35: at 0.35 the P5 full-release edged the deleter line to exactly 1.00 — the SPECTRAL ECHO is ONEWING's escalation, not the burn (lockdps margins)
        // embertide: 0 (beam fork — no burn, its escalation is the fork-extend)
        unmasked: 0.20,     // APEX (rung 14, §8D) — RECKONING-GATED: the finale burn stays LOCKED until all five relics are branded (def.burnGate 'reckoning' → boss.js zeroes the frac until reckoningDone). 0.20 lands ~31.5% of clear pace (~1/3, the owner's target); the formLifebars 240-HP form-bars make its absolute volley numbers the biggest in the game without a dominating share. The RECKONING is the escalation, not the burn dial.
      },
    },
  },

  BOSS: {
    firstAt: 2500,          // metres: earliest a boss can appear
    threadScore: 75,        // §5i.B THREAD-THE-GAP base score per cleanly-threaded wall row (×edge/late/chain)
    interval: 3200,         // metres between encounters
    intervalJitter: 900,
    settleGap: 30,          // metres ahead the boss holds (player-relative frame)
    fightHeight: 13,        // y the boss settles at (above the horizon city, framed on sky)
    warnTime: 2.0,          // warning flashes ALONE first, then the boss flies in
    approachTime: 2.6,      // seconds from spawn-offset to the settle point
    cruiseSpeed: 65,        // player forward speed locked during the fight — boost
                            // pace so flying doesn't feel sluggish (on-rails)
    // Telegraph: the boss visibly charges before each attack (fairness + game feel).
    telegraphInstant: 0.5,  // wind-up for a one-shot volley (aimed / fan / spiral)
    telegraphSustained: 0.7,// longer wind-up for a streamed pattern (tunnel / stream)
    telegraphWall: 0.72,    // longer "brace" for a full 2D wall (curtain) — commit-early
                            // patterns need extra warning since the whole lane fills
    // Bullets (one InstancedMesh of soft round discs — white centre, coloured rim —
    // built on the embers.js pool pattern; normal blend so they read over bloom).
    // Reaction window for an aimed bullet = settleGap / bulletSpeed (≈ 0.88s here);
    // the spiral is slower (×0.78) so it reads as more forgiving.
    bulletPool: 320,
    bulletRadius: 0.55,
    spawnRampT: 0.12,       // seconds a bullet takes to grow from a point to full size at spawn
                            // (kills the "materialises from nowhere" pop up close — L148)
    // Imminent-bullet FLARE window (the time-to-impact depth cue in bossBullets.js).
    // Shipped: heat-only over the last flareTti seconds. The LENS overhaul (?lens=2)
    // widens the window to flareTtiLens AND adds a size POP (flareSizeK, the fraction
    // the disc grows at full flare) so "which hits me first" is a size+heat read at
    // the exact moment it matters — the Enter-the-Gungeon "big fair bullet" lesson.
    // The visual grows BEYOND the hitbox (s.r untouched), so the mismatch is forgiving.
    flareTti: 0.3,          // shipped window (s); LENS is inert unless ?lens=2
    flareTtiLens: 0.45,     // widened window under ?lens=2
    flareSizeK: 0.35,       // disc grows ×(1 + this*flare) under ?lens=2; 0 ⇒ shipped size
    bulletHitScale: 0.62,   // effective player hit radius = playerRadius × this (forgiving)
    bulletSpeed: 28,        // closing speed (m/s) → reaction window ≈ settleGap/speed ≈ 1.07s
    bossSpeed: 52,          // closing speed of a rider/reflected bullet toward the boss
    bulletDamage: 13,      // forgiving: a clean hit stings but a graze-heavy run survives
    bossHitRadius: 4.2,     // how close a boss-ward bullet must be to count as a hit (matches the larger body)
    // Render-order LAW for the fight: NOTHING draws over a bullet. Bullets (outline/
    // body/core) sit at the top of the whole fight-FX stack; every other layer
    // (shadow under the floor, arena walls, shield, surge FX, the focus ring) is
    // beneath them. The boss's own HP bar is UI, not fight FX — it stays at its own
    // 998-1000 band (bossModel.js) outside this table.
    renderTiers: {
      bulletShadow: -1, arenaWall: 2, shield: 3, surgeFx: 4,
      focusTrack: 5, focusFill: 6, focusHead: 7,
      wispRibbon: 12,   // wisp light-ribbons: over boss/shield/surge FX, under every bullet
      bulletOutline: 20, bulletBody: 21, bulletCore: 22,
    },
    // Graze: skimming a bullet (inside the graze band but outside the hit radius)
    // charges Dragon Surge — the "drift" identity transplanted from rings onto
    // danmaku. Band = (hitR, grazeR];  grazeR = playerRadius × grazeScale + bulletRadius.
    grazeScale: 3.0,        // grazeR ≈ 1.2×3.0 + 0.55 ≈ 4.15  (band ≈ [1.29, 4.15]) — skim from further
    grazeScore: 12,         // score per bullet grazed
    grazeGain: 0.34,        // surge-meter fraction per graze (~3 grazes ≈ one gem)
    // Reflect: a barrel roll's i-frames swat REFLECTABLE bullets (amber; the
    // precision aimed/fan shots) back at the boss for bonus damage — defence
    // becomes offence. Graze to charge → roll to parry.
    reflectWindow: 4.5,     // rel-distance ahead within which a rolling player swats a bullet
    reflectDamageMult: 0.35,// reflected bullet damage × vs the boss (normal parry) — a
                            // roll can swat several bullets, so keep per-bullet modest
    reflectPerfectMult: 0.55,// PERFECT parry (swatted right on top of you) — slightly more
    perfectParryRel: 1.8,   // a bullet swatted within this rel = a perfect parry
    parryScore: 120,        // style points per parry (× perfect bonus × streak)
    // Surge hyper: while Dragon Surge is active in a boss the rider double-fires and
    // EVERY bullet becomes reflectable. Surge is MANUAL (unleash with Space / a
    // 2nd-finger tap) and its job is to BURST the per-phase shield.
    surgeRiderMult: 0.5,    // rider fire interval × during Surge (0.5 = twice as fast)
    surgeBeamDamage: 14,    // beam chip when unleashed with NO shield up (shielded → burst)
    shieldDamage: 999,      // a Surge unleash bursts the shield outright (phase advance)
    // Death reward: a defeated boss pays a big score bonus AND a haul of embers.
    defeatEmbers: 60,
    postGrace: 50,          // metres after a boss with rings/orbs only (no hazards) to ease back in
    // Rider auto-attack: a gentle chip (Surge is the real damage — it bursts the
    // per-phase shield); tuned low so you can't brute-force phases with chip alone.
    riderShotInterval: 0.5,
    riderShotDamage: 1.4,
    // Death + reward
    deathTime: 2.6,         // disintegration dissolve length (s)
    defeatScore: 5000,
  },

  // Death freeze-frame
  deathFreezeDuration: 0.45, // seconds of freeze before game-over screen

  // Golden embers: rare seeded comet pickups (variable-ratio spice; uses an
  // RNG stream independent of the course layout so old seeds stay identical)
  goldEmberValue: 25,
  goldEmberInterval: 500,  // metres between spawn opportunities
  goldEmberChance: 0.35,   // roll per opportunity

  // Return triggers
  firstFlightMult: 1.5,    // ember multiplier on the first run each UTC day
  welcomeBackGift: 100,    // embers gifted after a long absence
  welcomeBackGapDays: 5,
  pbMarkerBonus: 10,       // embers for passing your best-distance beacon

  // Juice budget — single source of truth for "how much spectacle per event".
  // hitstopMs: real-time near-freeze (timeScale ~0.05, instant in/out).
  // kick: postfx impulse preset name (postfx.js owns magnitudes; tier1 ×0.5,
  // tier2 no-op). Enforcement (cooldown + max-merge) lives in juice.js so the
  // habituation budget stays a deliberate, auditable decision.
  JUICE: {
    hitstopScale: 0.05,
    hitstopCooldownMs: 180,   // min gap between freezes — habituation guard
    earnPopThreshold: 100,    // score jump in one frame that pops the HUD score
    events: {
      perfect:          { hitstop: 35, kick: null },
      perfectMilestone: { hitstop: 70, kick: 'perfectMilestone' }, // streak 5,10,15…
      goldenEmber:      { hitstop: 80, kick: 'goldenEmber' },
      nearMiss:         { hitstop: 50, kick: null },
      gateThread:       { hitstop: 0,  kick: null },   // camera gateKick instead
      surgeStart:       { hitstop: 0,  kick: 'surgeStart' },
      phase:            { hitstop: 45, kick: null },          // minor phase: light beat
      phasePerfect:     { hitstop: 95, kick: 'surgeStart' },  // perfect phase: big magenta kick
      comboBreak:       { hitstop: 0,  kick: 'comboBreak' },
      death:            { hitstop: 0,  kick: 'death' }, // sustained grade over the freeze
      wispVolley:       { hitstop: 45, kick: 'surgeStart' }, // brand loose: the release beat
                        // (RELEASE only — never hitstop the impacts amid dense bullets)
      wispFinale:       { hitstop: 90, kick: 'wispFinale' }, // PR-B: the reserved lance CLIMAX —
                        // the SECOND authorized lance hitstop (full volleys only); it lands ~0.6s
                        // after the release beat, well past the 180ms cooldown. Sells the "impact".
    },
  },
};
