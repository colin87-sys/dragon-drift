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
