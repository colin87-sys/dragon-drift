// js/entranceScripts.js — the §5j ENTRANCE_SCRIPTS registry (data + pure math).
//
// Each boss's pre-fight cinematic is DATA here; the SHARED machinery (warn→script
// phase plumbing, skip, slow-mo engage/release, setOvertake feed, HUD hold,
// enterFight handoff, resetBoss abort) stays in boss.js's updateEntrance() driver.
// A script exposes pure functions of the normalized clock `u∈[0,1]`, a `ctx`
// ({AX,AY,S,B} — anchor x/y, side, CONFIG.BOSS), the current `pose`, and `player`.
// Keeping this module free of game/DOM deps lets tests import it directly and pin a
// byte-identical golden (ASHTALON's overtake must never drift — the regression gate).
//
// Coexist: a def without `def.entrance` (and without the legacy `cinematicEntrance`)
// keeps today's plain approach untouched.

const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const L = (a, b, t) => a + (b - a) * t;

export const ENTRANCE_SCRIPTS = {
  // ASHTALON — THE OVERTAKE (§5f exemplar, SHIPPED). Rises from behind-below, sweeps
  // CLOSE past your flank in DEEP bullet-time with the visor locked on you, then wheels
  // 180° to face you as the fight opens. These functions reproduce the shipped
  // updateFlythrough math EXACTLY (tests/entrance.mjs pins it to a golden trace).
  overtake: {
    dur: 1.32,                 // scaled-sec → ~2.5s wall (the pass slow-mo stretches it)
    skipTo: 0.82,              // a tap fast-forwards to the pull-ahead (U3)
    anchorToDragon: true,      // the path is anchored beside the dragon (snapshot player x/y)
    initYaw: Math.PI,          // faces its dive line (visor to the rear camera) until the turn
    eyeLock: true,             // the pupil hard-tracks the dragon through the pass
    announce: { title: '⟲  BEHIND YOU  ⟲', sub: 'THE HUNTER OVERTAKES', tone: 'gold', dur: 2.0 },
    slowWindow: { uIn: 0.30, uOut: 0.58, depth: 0.24 },   // C2 close pass = deep bullet-time
    U: { U1: 0.30, U2: 0.58, U3: 0.82 },
    _seg(u, u0, u1) { return easeInOut(clamp01((u - u0) / (u1 - u0))); },
    path(u, ctx) {
      const { AX, AY, S, B } = ctx, { U1, U2, U3 } = this.U;
      const seg = (a, b) => this._seg(u, a, b);
      let x, y, rel;
      if (u < U1) { const t = seg(0, U1); x = AX + S * L(2, 4, t); y = L(AY - 3, AY + 3, t); rel = L(-15, -3, t); }
      else if (u < U2) { const t = seg(U1, U2); x = AX + S * L(4, 3, t); y = AY + L(3, 3.5, t); rel = L(-3, 3, t); }
      else if (u < U3) { const t = seg(U2, U3); x = L(AX + S * 3, 0, t); y = L(AY + 3.5, B.fightHeight, t); rel = L(3, B.settleGap * 0.7, t); }
      else { const t = seg(U3, 1); x = 0; y = B.fightHeight; rel = L(B.settleGap * 0.7, B.settleGap, t); }
      return { x, y, rel };
    },
    tuck(u) {
      const { U1, U3 } = this.U, seg = (a, b) => this._seg(u, a, b);
      return u < U1 ? seg(0, U1) * 0.85 : u < U3 ? 0.85 : L(0.85, 0, seg(U3, 1));
    },
    // Body flies its dive line (visor to the rear camera) with a slight lean toward the
    // dragon through the pass (≤~12°, the eye-lock angle), then wheels 180° to face you.
    yaw(u, ctx, pose, player) {
      const { U3 } = this.U, seg = (a, b) => this._seg(u, a, b);
      const dx = player.position.x - pose.x;
      const track = u < U3 ? 1 : (1 - seg(U3, 1));
      const lean = clamp(-dx * 0.06, -0.22, 0.22) * track;
      return (u < U3 ? Math.PI : Math.PI * (1 - seg(U3, 1))) + lean;
    },
    // The PUPIL tracks the dragon (eye-lock); eased to centre through the turn.
    gaze(u, ctx, pose, player) {
      const { U3 } = this.U, seg = (a, b) => this._seg(u, a, b);
      const dx = player.position.x - pose.x, dy = player.position.y - pose.y;
      const track = u < U3 ? 1 : (1 - seg(U3, 1));
      return { gx: clamp(-dx / 4, -1, 1) * track, gy: clamp(dy / 4, -1, 1) * track };
    },
    // Camera envelope: feed the cinematic camera the boss's world position. The rear-look
    // pose endpoints / pivot / blend live in cameraController's default overtake state.
    camera(u, pose, player) { return { k: u, bx: pose.x, by: pose.y, bz: -(player.dist + pose.rel) }; },
  },

  // EITHERWING — THE BATON CROSS (§5j slot 5). A REAR-CAM sequential MATERIALISE: both twins
  // start INVISIBLE. The camera wheels to a look-BACK pose and twinA MATERIALISES on the RIGHT
  // with the shared EYE on it — the rear camera FOCUSES on it as it forms (the dragon still
  // faces forward). Then the EYE crosses to twinB as it MATERIALISES on the LEFT, and now the
  // DRAGON turns its head to that one (lookWin ramps on beat 2). Then both SCISSOR forward
  // together into the figure-eight as the camera eases home and the fight opens. The per-twin
  // materialise + eye-cross is choreographed in the eitherwing model's setEntrance(u); this
  // script owns the group's rear approach, the camera focus-pan (fed the LIT twin's world-x as
  // bx), the beat-2 dragon head-turn (lookWin), slow-mo, and banner. eyeLock OFF.
  batonCross: {
    dur: 1.8,                  // ~3.5s wall — three distinct beats (materialise A · materialise B · scissor) need the room
    skipTo: 0.70,              // skip → the scissor/settle (the eye still ends on the LEFT twin)
    anchorToDragon: true,      // the reveal frames the dragon's start position
    initYaw: 0,                // the group stays upright/forward; the twins face inward themselves
    eyeLock: false,
    slowWindow: { uIn: 0.08, uOut: 0.90, depth: 0.40 },   // the whole reveal dwells in bullet-time
    announce: { title: '⟶  TWO HALVES  ⟵', sub: 'ONE EYE BETWEEN THEM', tone: 'gold', dur: 1.8 },
    // The LIT twin's local x (group space): beat 1 = twinA at +9 (RIGHT); beat 2 crosses to
    // twinB at −9 (LEFT) as the eye passes; beat 3 eases to centre as they scissor forward.
    _lit(u) {
      const cross = easeInOut(clamp01((u - 0.34) / 0.28));    // 0 → A (right) · 1 → B (left)
      const settle = easeInOut(clamp01((u - 0.66) / 0.30));   // ease the focus to centre in the scissor
      return L(9, -9, cross) * (1 - settle);
    },
    // The group rides BEHIND the dragon (rel < 0, inside the rear-look camera) through both
    // reveals, then sweeps AHEAD to the fight station as the pair scissor into the figure-eight.
    path(u, ctx) {
      const { AX, AY, B } = ctx;
      const settle = clamp01((u - 0.66) / 0.34);
      const s = settle < 0.5 ? 2 * settle * settle : 1 - Math.pow(-2 * settle + 2, 2) / 2;
      return { x: AX * (1 - s), y: L(AY + 1.5, B.fightHeight, s), rel: L(-9, B.settleGap, s) };
    },
    tuck(u) { return clamp01((u - 0.7) / 0.3) * 0.5; },   // the tails flare as the pair scissor into the fight
    // Drive the model's per-twin materialise + eye-cross + ignition, AND feed the dragon's position
    // in the model's RIG space so the eye can lookAt it (a real facing, not a pupil nudge). Group
    // space: the group sits at `pose` (scale ≈ def.scale); the dragon is at (player − pose) / scale,
    // and its rig-z is pose.rel/scale (group-z = −(dist+rel), dragon-z = −dist). The eye points its
    // front at this every frame, so it keeps looking at the dragon as it rides the thread + passes.
    onFrame(u, ctx, pose, player, model) {
      model.setEntrance?.(u);
      const s = ctx.sc || 1.5;
      model.setEntranceAim?.((player.position.x - pose.x) / s, (player.position.y - pose.y) / s, pose.rel / s);
    },
    onStart(model) { model.setEntrance?.(0); },
    // Feed the LIT twin's world-x as bx so the rear-look camera focus-pans right→left between
    // the two reveals. lookWin stays ~0 through BEAT 1 (the CAMERA reveals twinA; the dragon
    // faces forward), then ramps on BEAT 2 so the DRAGON turns its head to twinB as it forms,
    // easing out through the scissor. (ASHTALON's default single-glance window doesn't fit; it
    // leaves lookWin undefined and keeps its own ramp, so its golden is untouched.) No chaseCam:
    // this uses the rear-look block. pivot 0.70 keeps the look-back through both reveals.
    camera(u, pose, player) {
      const lit = this._lit(u);
      const lookWin = clamp01((u - 0.36) / 0.14) * (1 - clamp01((u - 0.72) / 0.20));
      return {
        k: u, bx: pose.x + lit, by: pose.y + 1.5, bz: -(player.dist + pose.rel),
        pivot: 0.70, blend: 0.24, fov: 82, lookWin,
      };
    },
  },
  // HOLLOWGATE — VIGIL LIGHTS (§5j slot 6, hijack 0s — the fight's camera hijack is
  // BANKED). The dead black arch holds the horizon dead ahead (approachFrom 'ahead'
  // spawns it at rel 150 — the degrade path until the fog-exempt horizon seed ships)
  // and the RAIL closes the distance: the only boss that never comes to you. As it
  // eases to station the rose window IGNITES one pane per slow choir beat, and the
  // LIT pane POOLS toward whichever side the player steers — in DISCRETE wedge-steps
  // sampled on ignition beats ONLY (continuous live stick-tracking is slot 14's
  // exclusive claim; this is architecture ticking, not tracking). The last panes land
  // inside a 0.5× dilate window (camera home — no hijack, no setOvertake: this script
  // has NO camera fn); the hub ignites HOT at the end and the portcullis drops once
  // and LIFTS — a door opening in invitation. The per-pane ignition/pool/portcullis
  // choreography lives in the hollowgate model's setEntrance(u)/setEntranceSteer(nx);
  // this script owns only the approach path, the dilate window, and the steer feed.
  vigilLights: {
    dur: 2.6,                  // no deep hijack dwell — a slow stately close (≈3.6s wall with the dilate)
    skipTo: 0.88,              // a tap fast-forwards to the hub ignition + gate lift
    anchorToDragon: false,     // the arch owns the lane centre; the dragon comes to IT
    initYaw: 0,                // architecture: it faces the lane, always (it never turns)
    eyeLock: false,
    announce: { title: '✛  AHEAD  ✛', sub: 'IT HAS NOT MOVED. NOT ONCE.', tone: 'gold', dur: 2.2 },
    slowWindow: { uIn: 0.62, uOut: 0.88, depth: 0.5 },   // the last three panes land under 0.5× dilate
    // A stately straight-line close from the horizon to station: fast early (the
    // rail eats the distance), easing hard so the last panes ignite near-holding.
    path(u, ctx) {
      const { B } = ctx;
      const t = 1 - Math.pow(1 - clamp01(u / 0.9), 2.2);   // strong ease-out, settled by u=0.9
      return { x: 0, y: B.fightHeight, rel: L(150, B.settleGap, t) };
    },
    tuck() { return 0; },
    yaw() { return 0; },                                    // it holds its facing — stillness is the read
    gaze() { return { gx: 0, gy: 0 }; },                    // the pane rig owns the "look" (setEntranceSteer)
    // Drive the model's pane-ignition clock + feed the STEER sample the ignition
    // beats quantize (player x relative to the lane centre the arch owns).
    onFrame(u, ctx, pose, player, model) {
      model.setEntrance?.(u);
      model.setEntranceSteer?.(clamp((player.position.x - pose.x) / 8, -1, 1));
    },
    onStart(model) { model.setEntrance?.(0); },
    // NO camera fn: hijack 0s — the chase camera never leaves home (BANKED, §5j).
  },

  // BRINEHOLM — THE REEF WAS BREATHING (§5j slot 8, hijack ≤3s @0.35 — spends the
  // roster's ONE "environment wakes" archetype). The crest tease starts AT WARN
  // behind a scoped sub-rig exemption to the group gate (the breathing crest only;
  // CP2 wires the exemption) — a kelp-black ridge parallels the lane just above the
  // fog, lifting and settling on the tidal-drone swells. At fight start setOvertake
  // slews LOW across the wing as the 24-unit hull INHALES up through the fog floor
  // (the model's setEntrance(u) drives the internal rise — sails unfolding
  // bow-to-stern, banding lighting in a wave, the crest exiting frame-top: it never
  // fits). Mid-rise the ascent HOLDS one fixed segment (u≈0.5–0.6) as the dragon's
  // shadow crosses it — the canon HESITATION (BRINEHOLM's relationship beat, §5c).
  // The eye stays SUBMERGED (a pale glow at the bow); the lid grinds and the iris
  // LOCKS once at settle (no continuous tracking). This script owns the approach
  // path, the low camera slew, the dilate window, and the setEntrance clock feed;
  // the rise/unfold/hesitation/lid choreography lives in the model's setEntrance(u).
  reefWasBreathing: {
    dur: 2.4,                  // ~3s wall inside the low-slew dilate — the hijack ceiling (§5j)
    skipTo: 0.82,              // a tap fast-forwards to the settle (the iris still LOCKS)
    anchorToDragon: false,     // the leviathan owns the lane centre; the dragon flew ALONGSIDE it (the crest paralleled the lane)
    initYaw: 0,                // it faces the lane — a leviathan does not turn to you (it hesitates)
    eyeLock: false,            // the eye stays submerged through the rise; it does not track
    announce: { title: '☰  BELOW  ☰', sub: 'THE REEF WAS BREATHING', tone: 'gold', dur: 2.2 },
    slowWindow: { uIn: 0.4, uOut: 0.76, depth: 0.35 },   // the low slew dwells @0.35 across the HESITATION hold
    // The pose holds near STATION while the model's setEntrance(u) rises the hull
    // internally (rig.y from deep → 0, studio-visible): live == studio. A gentle
    // rel settle from a touch further closes the last of the distance as it surfaces.
    // (CP2 may migrate the gross rise to a per-def deepened pose.y from startDepth
    // once the below-horizon-rise engine + widened cull land — the model rise is
    // the CP1 stand-in and already reads correctly live via this onFrame feed.)
    path(u, ctx) {
      const { B } = ctx;
      const t = 1 - Math.pow(1 - clamp01(u / 0.92), 2.0);   // ease-out, settled by u≈0.92
      return { x: 0, y: B.fightHeight, rel: L(B.settleGap * 1.28, B.settleGap, t) };
    },
    tuck() { return 0; },                                    // the hull rise is internal (setEntrance), not a body tuck
    yaw() { return 0; },                                     // it never turns — stillness + the hesitation are the read
    gaze() { return { gx: 0, gy: 0 }; },                     // the eye is submerged; the iris LOCKS at settle (setEntrance)
    // Drive the model's rise + sail-unfold + banding wave + lid grind + iris lock.
    onFrame(u, ctx, pose, player, model) {
      model.setEntrance?.(u);
      model.setEntranceSteer?.(0);   // the eye does not track during the entrance (§5d)
    },
    onStart(model) { model.setEntrance?.(0); },
    // setOvertake slews the camera LOW across the wing (framing the surfacing hull
    // from just above the fog), easing back toward home through the settle. Feeds
    // the boss world position with a LOWERED look target so the rise reads as an
    // ascent past the frame. A shallow pivot keeps the chase framing (no rear look).
    camera(u, pose, player) {
      const rise = clamp01((u - 0.05) / 0.85);
      const low = (1 - rise) * 5.5;                 // start the look LOW (near the fog), rise with the hull
      const home = clamp01((u - 0.82) / 0.18);      // ease back toward the chase framing at the settle
      return {
        k: u, bx: pose.x, by: pose.y - low, bz: -(player.dist + pose.rel),
        pivot: 0.34 * (1 - home), blend: 0.30, fov: L(80, 72, home),
      };
    },
  },
  // THRUMSWARM — THE SHAPE IT REMEMBERS (§5j slot 7, hijack 2.8s @0.24× dilate). The
  // 28 unlit motes converge from AHEAD (approachFrom 'condense' spawns them at rel
  // ~45) and CLICK slot-by-slot into the YOUR-DRAGON formation — a stippled copy of
  // dragon AND rider gliding ahead, visibly discrete points, never a solid fill.
  // The copy's head-cluster performs the ASHTALON glance-back AT you — but the CAMERA
  // STAYS FORWARD (homage, not reuse: do NOT re-run slot 3's rear-view; §5j uniqueness
  // ruling — 7's glance-back is the COPY quoting YOU, camera never moves). So this
  // script has NO camera fn — the whole beat plays in the normal forward view, sold by
  // deep bullet-time as the swarm condenses ahead. The queen's amber eye ignites inside
  // the copy's skull at the end. Do NOT live-mirror input here — the copy holds a
  // NEUTRAL glide (the ring-buffer payoff belongs to the *Your Own Wings* card, §5d).
  // The per-slot condensation clock lives in the thrumswarm model's setEntrance(u).
  shapeItRemembers: {
    dur: 1.5,                  // ~2.8s wall under the deep dilate — the condensation needs the room to CLICK in
    skipTo: 0.86,              // a tap fast-forwards to the settled copy + eye ignition
    anchorToDragon: false,     // the swarm owns the lane centre ahead; it condenses INTO the player's shape
    initYaw: 0,                // the copy glides forward (its head glances back — model-side, not a group yaw)
    eyeLock: false,
    announce: { title: '❈  AHEAD  ❈', sub: 'IT REMEMBERS BEING YOU', tone: 'gold', dur: 2.2 },
    slowWindow: { uIn: 0.15, uOut: 0.86, depth: 0.24 },   // deep bullet-time: the condensation's click-track lands here
    // A convergence from ahead (rel ~45) to station: fast early (the motes rush in),
    // easing hard so the last slots CLICK home near-holding under the dilate.
    path(u, ctx) {
      const { B } = ctx;
      const t = 1 - Math.pow(1 - clamp01(u / 0.9), 2.4);
      return { x: 0, y: B.fightHeight, rel: L(45, B.settleGap, t) };
    },
    tuck() { return 0; },
    yaw() { return 0; },                                    // the group holds forward; the head-glance is model-side
    gaze() { return { gx: 0, gy: 0 }; },                    // the copy holds a neutral glide (no input mirror — §5d)
    // Drive the model's per-slot condensation clock. (No steer feed — the neutral
    // glide is deliberate; setEntranceSteer is a no-op on this model.)
    onFrame(u, ctx, pose, player, model) { model.setEntrance?.(u); },
    onStart(model) { model.setEntrance?.(0); },
    // NO camera fn: the camera STAYS FORWARD (§5j uniqueness ruling — the glance-back is
    // the copy quoting you, never a rear-view hijack). Bullet-time carries the hijack.
  },

  // KARNVOW — IT KEPT COUNT (§5j slot 9). The duelist FADES IN already riding at
  // your shoulder (rel ROCK-STEADY through the whole hold — any rel change would
  // read as slot 3's spent overtake), the cowl turned to you while the stat-taunt
  // lands (boss.js's def.statTaunt seam quotes your REAL ledger and flares the
  // top-killer charm mid-hold — the §5j escalation hinge), then WITHOUT breaking
  // pace the lance snaps low→POINT, it cuts in for a shoulder-brush, wheels, and
  // settles. Zero shots here (Mantis rule); the ONE hold-breaker shot is a
  // SEPARATE beat inside the reveal hold (def.holdBreaker, boss.js).
  itKeptCount: {
    dur: 2.4,                  // ~3.3s wall under the shallow dilate — room for the taunt AND a real wheel
    skipTo: 0.76,              // a tap fast-forwards to the point + cut-in
    anchorToDragon: true,      // it rides at YOUR shoulder (snapshot the dragon's x/y)
    initYaw: Math.PI,          // flies your heading on the fade-in (a rider, not a face-off)
    eyeLock: false,            // the cowl-track is model-side (setGaze) — no pupil hijack
    announce: { title: '⟢  AT YOUR SIDE  ⟢', sub: 'IT KEPT COUNT', tone: 'gold', dur: 2.0 },
    slowWindow: { uIn: 0.22, uOut: 0.72, depth: 0.5 },   // SHALLOW dilate — a held breath, not a dive
    U: { U1: 0.25, U2: 0.68, U3: 0.80 },
    _seg(u, u0, u1) { return easeInOut(clamp01((u - u0) / (u1 - u0))); },
    path(u, ctx) {
      const { AX, AY, S, B } = ctx, { U1, U2, U3 } = this.U, seg = (a, b) => this._seg(u, a, b);
      // rel holds DEAD STEADY at 16 through the fade-in + hold + point; only the
      // final settle recedes to station (receding = taking post, never a pull-ahead).
      // Ride height AY+4: ABOVE the wing line (the owner's screenshot: at +2.5 the
      // dragon's wing crowded the frame and cropped him at the edge).
      let x, y, rel = 16;
      if (u < U1) { const t = seg(0, U1); x = AX + S * L(14, 11.5, t); y = AY + L(4.6, 4.0, t); }         // fade in, drawing level
      else if (u < U2) { const t = seg(U1, U2); x = AX + S * (11.5 + Math.sin(t * Math.PI) * 0.8); y = AY + 4.0; }   // the HOLD (a shallow flank slew)
      else if (u < U3) { const t = seg(U2, U3); x = AX + S * L(11.5, 6, t); y = AY + L(4.0, 3.0, t); }    // the CUT-IN (the shoulder-brush)
      else { const t = seg(U3, 1); x = L(AX + S * 6, 0, t); y = L(AY + 3.0, B.fightHeight, t); rel = L(16, B.settleGap, t); }   // wheel + settle
      return { x, y, rel };
    },
    tuck() { return 0; },
    // THE FACING ARC (owner catch: "materialises with his back to us, then a hop
    // spin"): he fades in on your heading (π), angles IN to a THREE-QUARTER ride
    // (0.62π — cowl, glint and festoon all read through the hold), then wheels the
    // remaining ~112° to face you across the WHOLE settle leg (U3 0.80 → 1.0,
    // ~0.65s wall — a carving turn, not a snap).
    yaw(u) {
      const { U1, U3 } = this.U, seg = (a, b) => this._seg(u, a, b);
      const ride = Math.PI * (1 - 0.38 * seg(0, U1));
      return u < U3 ? ride : ride * (1 - seg(U3, 1));
    },
    // The wheel BANKS — a rider carves its turn (routed to cineRoll by the driver;
    // sin envelope = level at both ends, so the station handoff stays square).
    roll(u) {
      const { U3 } = this.U, seg = (a, b) => this._seg(u, a, b);
      return -Math.sin(seg(U3, 1) * Math.PI) * 0.35;
    },
    // The COWL tracks the dragon the whole ride (the model's setGaze turns the hood
    // + the eye — the hunter sizing you up while it quotes your deaths).
    gaze(u, ctx, pose, player) {
      const dx = player.position.x - pose.x, dy = player.position.y - pose.y;
      return { gx: clamp(-dx / 5, -1, 1), gy: clamp(dy / 5, -1, 1) };
    },
    onStart(model) { model.setEntrance?.(0); model.holdFootwork?.(true); },   // born from nothing; the dart machine sleeps
    onFrame(u, ctx, pose, player, model) {
      const { U2, U3 } = this.U;
      // FADE-IN materialise over the first quarter — setEntrance is VISIBILITY-ONLY
      // (the kit dissolve is a death effect and ghost-washes the paint; gate catch).
      model.setEntrance?.(this._seg(u, 0, 0.22));
      // FOOTWORK SLEEPS through the cinematic (the hop fix): the lance-point beat
      // below trips the dart machine's strike-sidestep rising edge otherwise —
      // the owner's "hop spin". Released on the final frame (fight handoff).
      model.holdFootwork?.(u < 0.995);
      // The lance SNAP low→POINT on the U2 beat (the §4b charge-tell — the amber tip
      // ignites), held through the cut-in, released as it wheels to station. Runs
      // AFTER the driver's setCharge(0), so this write wins the frame.
      const point = u < U2 ? 0 : u < U3 ? this._seg(u, U2, U2 + 0.06) : 1 - this._seg(u, 0.94, 1);
      model.setCharge?.(point);
    },
    // Camera look-target biased toward the lane centre (×0.78): he sits at the frame
    // THIRD, whole figure in frame — dead-centred on pose.x pinned him (and the
    // dragon's wing) at the screen edge (the owner's screenshot).
    camera(u, pose, player) { return { k: u, bx: pose.x * 0.78, by: pose.y, bz: -(player.dist + pose.rel) }; },
  },

  // KNELLGRAVE — IT LIFTS ITS HEAD (§5j slot 10, hijack ~2.6s @0.30 dilate). The music
  // is ALREADY DEAD (killed on the warn-end toll, before this script starts) — the
  // whole entrance plays in the new silence, sold by the toll alone. The bell sweeps
  // PERPENDICULAR across the lane ABOVE the dragon (a cross, never an overtake — only
  // the flared lip + chain dip into frame; the body stays above y≈22, near-plane law).
  // At the apex, bullet-time: the mouth looms at the top of the screen, the candle-slit
  // snaps on HDR, and the bound clapper swings out of the mouth and LIFTS ITS HEAD at
  // you (model-side, driven by setEntrance's clock — the roster's darkest notice beat).
  // Then the bell wheels back + up to the overhead loom (stationY 20), still swinging.
  itLiftsItsHead: {
    dur: 1.6,                  // ~2.6s wall under the @0.30 apex dilate (§5d spec)
    skipTo: 0.72,              // a tap fast-forwards to the wheel-down (the head stays lifted)
    anchorToDragon: false,     // the bell owns the lane's sky; the cross is lane-centred
    initYaw: null,             // placeGroup's face-player default (a bell has no dive line)
    eyeLock: false,
    announce: { title: '◯  ABOVE  ◯', sub: 'IT LIFTS ITS HEAD', tone: 'gold', dur: 2.2 },
    slowWindow: { uIn: 0.36, uOut: 0.66, depth: 0.30 },   // the apex head-lift dwells here
    U: { CROSS: 0.36, APEX: 0.66 },
    _seg(u, u0, u1) { return easeInOut(clamp01((u - u0) / (u1 - u0))); },
    // THE CROSS (u<0.36): the bell sweeps laterally across the lane high overhead
    // (x −26→+8 at y≈24, rel 20 — a pendulum crossing, nothing else in the roster
    // moves PERPENDICULAR over you). THE APEX (0.36–0.66): it swings back to centre
    // and LOOMS (rel 20→13, the mouth filling the frame top) while the clapper lifts
    // its head. THE WHEEL-DOWN (>0.66): back + up to the overhead loom station.
    path(u, ctx) {
      const { B } = ctx, { CROSS, APEX } = this.U, seg = (a, b) => this._seg(u, a, b);
      if (u < CROSS) { const t = seg(0, CROSS); return { x: L(-26, 8, t), y: 24, rel: 20 }; }
      if (u < APEX) { const t = seg(CROSS, APEX); return { x: L(8, 0, t), y: L(24, 22, t), rel: L(20, 13, t) }; }
      const t = seg(APEX, 1); return { x: 0, y: L(22, 20, t), rel: L(13, B.settleGap, t) };
    },
    tuck() { return 0; },      // the swing/head-lift choreography is model-side (setEntrance)
    yaw() { return 0; },       // the bell faces the lane; the pendulum IS the motion
    gaze() { return { gx: 0, gy: 0 }; },   // the head-lift is driven by setEntrance's clock
    onFrame(u, ctx, pose, player, model) { model.setEntrance?.(u); },
    onStart(model) { model.setEntrance?.(0); },
    // Camera: a LIFTED look target (by above the pose's base) pitches the chase cam UP
    // at the crossing bell without a rear view — the §5d "stock overtake framing already
    // pitches up at a y≈24 boss" note. Eases home through the wheel-down.
    camera(u, pose, player) {
      const home = clamp01((u - 0.7) / 0.3);
      return {
        k: u, bx: pose.x, by: pose.y - 3 + home * 3, bz: -(player.dist + pose.rel),
        pivot: 0.26 * (1 - home), blend: 0.30, fov: L(78, 72, home),
      };
    },
  },
};

// Pure per-frame sampler (for tests + any tooling): returns the full frame a script
// produces at `u`, given a fixed ctx + player. Mirrors the driver's call order.
export function entranceFrame(scriptId, u, ctx, player) {
  const s = ENTRANCE_SCRIPTS[scriptId];
  const p = s.path(u, ctx);
  const g = s.gaze(u, ctx, p, player);
  const sw = s.slowWindow;
  return {
    x: p.x, y: p.y, rel: p.rel,
    tuck: s.tuck(u, ctx),
    yaw: s.yaw(u, ctx, p, player),
    gx: g.gx, gy: g.gy,
    slow: (u >= sw.uIn && u < sw.uOut) ? 1 : 0,
  };
}
