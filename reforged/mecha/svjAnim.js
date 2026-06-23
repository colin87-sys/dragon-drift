// ─────────────────────────────────────────────────────────────────────────────
// SVJ MECHA DRAGON — animation driver.  updateSVJ(group, dt, state)
//
// Motion language: JET, not bird.  The twin thrusters propel it; the wings are
// RIGID aero control blades (aileron/elevator), never a lift-flap.  Mechanical
// "servo" feel — eased moves that settle crisply (exponential damp, no overshoot)
// + a constant engine vibration so it reads as a powered machine.  Plus signature
// TRANSFORM moves: wing tuck on boost, wider battle-mode spread on surge, and the
// thruster pods vector toward turns.
//
// Pure + engine-agnostic: reads only group.userData.anim (handles already built by
// svjDragon.js) and stores its own smoothed state there, so the standalone preview
// and the game call it identically.  No three import needed beyond MathUtils-style
// helpers (kept local so the driver has zero game dependencies).
//
//   state = { speedNorm 0..1, bank -1..1, pitch -1..1, boost 0..1, surge 0..1 }
// ─────────────────────────────────────────────────────────────────────────────
const rad = (d) => d * Math.PI / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
// frame-rate-independent exponential settle (servo-like: eases in, locks, no wobble)
const damp = (a, b, r, dt) => a + (b - a) * (1 - Math.exp(-r * dt));
const TAU = Math.PI * 2;

export function updateSVJ(group, dt, state = {}) {
  const A = group && group.userData && group.userData.anim;
  if (!A) return;
  dt = clamp(dt || 0, 0, 0.05);

  const S = A._s || (A._s = { bank: 0, pitch: 0, boost: 0, surge: 0, eng: 0, idle: 0 });
  if (!A._baseEmi) A._baseEmi = new Map(A.glowMats.map((m) => [m, m.emissiveIntensity]));

  // ── servo-eased flight inputs (different rates = different "weight") ──────────
  S.bank = damp(S.bank, clamp(state.bank ?? 0, -1, 1), 8, dt);
  S.pitch = damp(S.pitch, clamp(state.pitch ?? 0, -1, 1), 7, dt);
  S.boost = damp(S.boost, clamp(state.boost ?? 0, 0, 1), 5, dt);     // heavier spool-up
  S.surge = damp(S.surge, clamp(state.surge ?? 0, 0, 1), 4, dt);
  const spd = clamp(state.speedNorm ?? 0, 0, 1);

  // ── phase clocks: engine RPM (rises with speed + boost) + a slow idle ────────
  S.eng = (S.eng + dt * TAU * (1.1 + 1.8 * spd + 1.4 * S.boost)) % TAU;
  S.idle = (S.idle + dt * TAU * 0.45) % TAU;
  const idleArt = Math.sin(S.idle) * rad(2.5);                       // tiny "active aero" breathing

  // ── WINGS: rigid aero blades — idle + aileron(bank) + elevator(pitch),
  //    plus transform poses: tuck back on boost, wider V on surge. ──────────────
  for (const w of A.wings) {
    const sd = w.userData.side;
    if (w.userData._baseLean === undefined) w.userData._baseLean = w.rotation.z;
    const hinge = w.userData.hinge, outer = w.userData.outer;
    const aileron = S.bank * rad(20);                 // differential (the mir scale.x flips L vs R)
    const elevator = sd * S.pitch * rad(9);           // symmetric (×sd cancels the mirror)
    const idle = sd * idleArt;                        // symmetric breathing
    hinge.rotation.z = idle + elevator + aileron;
    outer.rotation.z = damp(outer.rotation.z, hinge.rotation.z * 0.45, 10, dt);  // blade follows + settles
    // TRANSFORM poses on the wing root:
    w.rotation.z = w.userData._baseLean - sd * (S.surge * rad(13));  // surge → wider battle-mode V
    w.rotation.x = -S.boost * rad(11);                                // boost → tuck/rake back
  }

  // ── THRUSTERS: vector toward the turn + flame on boost/surge ──────────────────
  for (const th of A.thrusters) {
    th.rotation.y = S.bank * rad(12);                 // thrust vectoring (flame is a child → follows)
    th.userData.flame.scale.setScalar(0.04 + S.boost * 1.25 * (1 + 0.15 * Math.sin(S.eng * 2)) + S.surge * 0.7);
  }

  // ── TAIL: stiff mechanical follow-through (traveling wave; lazy base quat so the
  //    static pose is untouched). Sways as a rudder into turns, stiffens on surge. ─
  const segs = A.tailSegs;
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (!seg.userData._baseQuat) seg.userData._baseQuat = seg.quaternion.clone();
    const lag = i * 0.55;
    const sway = (Math.sin(S.eng * 0.5 - lag) * rad(2.0) + S.bank * rad(7) * (0.3 + i * 0.12)) * (1 - S.surge * 0.6);
    const lift = S.pitch * rad(4) * (0.2 + i * 0.1) + S.surge * rad(3);
    seg.quaternion.copy(seg.userData._baseQuat);
    seg.rotateY(sway);
    seg.rotateX(lift);
  }

  // ── GLOW: engine pulse + boost/surge ramp (feeds the game's UnrealBloom) ──────
  const pulse = 1 + 0.12 * Math.sin(S.eng) + 0.5 * S.boost + 1.5 * S.surge;
  for (const [m, base] of A._baseEmi) m.emissiveIntensity = base * pulse;

  // a tiny engine vibration the HOST can read to shake the body (optional)
  A._vibration = Math.sin(S.eng * 3) * 0.004 * (0.4 + spd + S.boost);
}

export default updateSVJ;
