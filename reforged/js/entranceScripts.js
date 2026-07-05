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
  // HOLLOWGATE's entrance (§5j slot 6, THE DROWNED DOOR) is NOT a scripted flythrough
  // — it needs no camera hijack and no script clock. It is controller-driven in
  // boss.js (the `def.uprootEntrance` path): the warn banner clears, normal play
  // continues while the rail closes on the arch holding its FIXED world spot (the
  // 'loom' phase), and on arrival it rises out of the water (the 'uproot' phase:
  // pose.y sunk→fightHeight + the model's pane-ignition ramp + water spray + a
  // ~0.5s slow-mo hold). So there is no ENTRANCE_SCRIPTS entry for it — the model's
  // setEntrance(u)/setEntranceSteer(nx) ignition rig is driven straight from the
  // controller's uproot clock instead of a path() script.
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
