// ─────────────────────────────────────────────────────────────────────────────
// SVJ MECHA DRAGON — animation driver.  updateSVJ(group, dt, state)
//
// Motion language: JET / Lamborghini active-aero, NOT a bird.  The twin thrusters
// propel it; the gold blade-wings are RIGID hard-surface aero blades that STEER
// (differential aileron on bank, symmetric elevator / angle-of-attack on pitch)
// and DEPLOY like active aero (airbrake panels, speed-tuck) — never an organic flap.
// Mechanical "servo" feel: eased moves that settle crisply (exponential damp, no
// wobble) + a constant engine vibration + glow so it always reads as a powered
// machine.  Signature transform moves layer on top: wing speed-tuck on boost, a
// wider battle-mode V + full-system ignition on Dragon Surge, thrust-vectoring pods.
//
// 3-PART WING RIG (per the brief), mapped onto the built model:
//   root = the wing group (w)      → shoulder mount: sweep-back / dihedral / spread
//   mid  = w.userData.hinge        → main blade panel: aileron(bank)+AoA(pitch/brake)
//   tip  = w.userData.outer        → stabiliser: speed-tuck / lift, lagged follow
// Left/right wings are PHASE-LOCKED (one timebase) — no independent flap; banking is
// a mirrored active-aero offset only.
//
// State machine (priority surge > boost > airbrake > pitch/bank overlays > cruise),
// blended smoothly — no snapping, no flap-frequency spikes.
//
//   state = { speedNorm 0..1, bank -1..1, pitch -1..1, boost 0..1, surge 0..1,
//             airbrake 0..1, surgeColor '#rrggbb' }
//
// Pure + engine-agnostic: reads/writes only group.userData.anim (handles built by
// svjDragon.js), mutates existing material Colors in place (no THREE import).
// ─────────────────────────────────────────────────────────────────────────────
const rad = (d) => d * Math.PI / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sat = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// frame-rate-independent exponential settle (servo-like: eases in, locks, no wobble)
const damp = (a, b, r, dt) => a + (b - a) * (1 - Math.exp(-r * dt));
const TAU = Math.PI * 2;

export function updateSVJ(group, dt, state = {}) {
  const A = group && group.userData && group.userData.anim;
  if (!A) return;
  dt = clamp(dt || 0, 0, 0.05);
  const M = A.materials;

  // ── persistent smoothed state + one-time base captures ───────────────────────
  const S = A._s || (A._s = {
    bank: 0, pitch: 0, boost: 0, surge: 0, brake: 0, eng: 0, idle: 0,
    boostWas: false, surgeWas: false, kick: 0, surgeKick: 0, ringT: 0,
  });
  if (!A._init) {
    A._init = true;
    A._baseEmi = new Map(A.glowMats.map((m) => [m, m.emissiveIntensity]));
    // base + target emissive Colors (cloned from the live materials → no THREE import)
    A._red0 = M.red.emissive.clone();
    A._th0 = M.thruster.emissive.clone();
    A._eye0 = M.eye.emissive.clone();
    A._thBoost = M.thruster.emissive.clone().set('#fff2b0');   // white-hot combustion core
    A._surgeHex = null;                                        // (re)built when surgeColor changes
  }
  // surge colour can be overridden per call (default pink/magenta overdrive)
  const surgeHex = state.surgeColor || '#ff2bd0';
  if (surgeHex !== A._surgeHex) {
    A._surgeHex = surgeHex;
    A._surgeCol = M.red.emissive.clone().set(surgeHex);
    A._thSurge = M.thruster.emissive.clone().set(surgeHex);
  }

  // ── servo-eased flight inputs (different rates → different "weight") ──────────
  const tBank = clamp(state.bank ?? 0, -1, 1);
  const tBoost = sat(state.boost ?? 0);
  const tSurge = sat(state.surge ?? 0);
  S.bank = damp(S.bank, tBank, 9, dt);
  S.pitch = damp(S.pitch, clamp(state.pitch ?? 0, -1, 1), 7, dt);
  S.boost = damp(S.boost, tBoost, 6, dt);            // heavier spool-up
  S.surge = damp(S.surge, tSurge, 5, dt);
  S.brake = damp(S.brake, sat(state.airbrake ?? 0), 8, dt);
  const spd = sat(state.speedNorm ?? 0);
  const climb = sat(S.pitch), dive = sat(-S.pitch);

  // ── transform "kicks": a brief servo snap on the boost / surge onset, decays ──
  if (tBoost > 0.5 && !S.boostWas) S.kick = 1;
  if (tSurge > 0.5 && !S.surgeWas) S.surgeKick = 1;
  S.boostWas = tBoost > 0.5; S.surgeWas = tSurge > 0.5;
  S.kick *= Math.exp(-dt / 0.12);                    // ~0.12s anticipation snap
  S.surgeKick *= Math.exp(-dt / 0.16);

  // ── phase clocks: engine RPM (rises with speed+boost) + a slow idle ───────────
  S.eng = (S.eng + dt * TAU * (1.1 + 1.8 * spd + 1.4 * S.boost + 1.0 * S.surge)) % TAU;
  S.idle = (S.idle + dt * TAU * 0.55) % TAU;
  const cruiseW = sat(1 - (S.boost + S.surge));      // idle breathing fades as it locks back
  const idleBreath = Math.sin(S.idle) * rad(2.5) * cruiseW;
  const buzz = Math.sin(S.eng * 7.5) * rad(0.7) * (0.6 * S.boost + S.surge);  // locked-panel vibration

  // ── WINGS — rigid active-aero blades (root sweep · mid steer · tip tuck) ──────
  for (const w of A.wings) {
    const sd = w.userData.side;
    const hinge = w.userData.hinge, outer = w.userData.outer;
    if (w.userData._baseLean === undefined) {
      w.userData._baseLean = w.rotation.z;            // baked dihedral/lean
      w.userData._baseRX = w.rotation.x;
    }
    // ROOT: sweep-back on boost/dive/surge (rake), wider V on surge, open on airbrake
    const sweepBack = -(S.boost * rad(10) + S.surge * rad(8) + dive * rad(6) + S.kick * rad(6));
    const spread = -sd * (S.surge * rad(13) + S.surgeKick * rad(4) + S.brake * rad(6));  // surge/brake = wider
    w.rotation.x = w.userData._baseRX + sweepBack;
    w.rotation.z = w.userData._baseLean + spread - sd * (S.boost * rad(2));               // boost tucks dihedral in

    // MID (main blade panel): differential aileron (bank) about the lean axis,
    // symmetric angle-of-attack (pitch elevator + airbrake + bank-inside open) about x.
    const aileron = S.bank * rad(20);                                // differential (mir flips L vs R)
    const inside = clamp(sd * S.bank, 0, 1);                         // 1 on the wing we bank toward
    const bankOpen = Math.abs(S.bank) * rad(3) + inside * rad(7);    // inside opens 10°, outside 3°
    const aoa = sd * (S.pitch * rad(10) + S.brake * rad(12) + bankOpen);  // ×sd = symmetric through the mirror
    hinge.rotation.z = aileron + sd * idleBreath;
    hinge.rotation.x = aoa;

    // TIP (stabiliser): lift on climb/airbrake, tuck on boost/dive/surge; lagged
    // mechanical secondary settle that follows the panel + a tiny locked-panel buzz.
    const tipTuck = sd * (climb * rad(5) + S.brake * rad(8) - (S.boost * rad(7) + S.surge * rad(10) + dive * rad(5)));
    outer.rotation.x = damp(outer.rotation.x, tipTuck, 10, dt) + buzz;
    outer.rotation.z = damp(outer.rotation.z, hinge.rotation.z * 0.4, 9, dt);

    // wingtip air-slice — a thin streak that flares only on a HARD bank, brighter on
    // the OUTSIDE wing of the turn (clean aero slice, not a spasm).
    if (w.userData.tipTrail) {
      const outside = clamp(-sd * S.bank, 0, 1);                    // 1 on the outer wing
      const hard = sat((Math.abs(S.bank) - 0.55) / 0.45);          // engages past ~0.55 input
      const op = hard * (0.10 + outside * 0.34);
      const tr = w.userData.tipTrail, m = w.userData.tipTrailMat;
      m.opacity = op; tr.visible = op > 0.01;
      tr.scale.set(1, 1, 0.2 + hard * (0.8 + outside * 0.6));
    }
  }

  // ── THRUSTERS — vector toward the turn; flame length/width + colour per mode ───
  // length: idle→boost→surge, longer on climb, narrower+shorter on dive.
  const flameLen = 0.05 + S.boost * 1.55 + S.surge * 1.9 + climb * 0.3 - dive * 0.18;
  const flameW = 0.05 + S.boost * 0.85 + S.surge * 1.0 - dive * 0.18;
  const lenPulse = 1 + 0.12 * Math.sin(S.eng * 2);
  for (const th of A.thrusters) {
    th.rotation.y = S.bank * rad(12);                               // thrust vectoring (flame is a child)
    th.userData.flame.scale.set(Math.max(0.02, flameW), Math.max(0.02, flameW), Math.max(0.02, flameLen * lenPulse));
    th.userData.core.scale.setScalar(0.75 + S.boost * 0.5 + S.surge * 0.8);
  }
  // thruster colour: idle red-orange → white-hot on boost → custom surge colour
  M.thruster.emissive.copy(A._th0).lerp(A._thBoost, sat(S.boost - S.surge)).lerp(A._thSurge, S.surge);

  // ── TAIL — stabiliser/rudder: small sway + bank counter-yaw, straightens on
  //    boost/surge, drops on climb. Traveling wave (lazy base quat = pose intact). ─
  const segs = A.tailSegs;
  const straighten = clamp(1 - Math.max(S.boost * 0.85, S.surge * 0.95), 0.05, 1);
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (!seg.userData._baseQuat) seg.userData._baseQuat = seg.quaternion.clone();
    const lag = i * 0.55, ampUp = 0.3 + i * 0.13;
    const sway = (Math.sin(S.eng * 0.5 - lag) * rad(2.0) - S.bank * rad(8) * ampUp) * straighten;  // counter-yaw into bank
    const lift = (-climb * rad(4) * ampUp + dive * rad(2) * ampUp) * straighten + S.surge * rad(2) * i / segs.length;
    seg.quaternion.copy(seg.userData._baseQuat);
    seg.rotateY(sway);
    seg.rotateX(lift);
  }

  // ── GLOW — engine pulse + speed/boost ramp; airbrake brightens the slashes;
  //    Dragon Surge tints the red accents toward the surge colour + blazes. ───────
  const redPulse = 1 + 0.12 * Math.sin(S.eng) + 0.3 * spd + 0.5 * S.boost + 1.6 * S.surge + 0.8 * S.brake;
  M.red.emissiveIntensity = A._baseEmi.get(M.red) * redPulse;
  M.red.emissive.copy(A._red0).lerp(A._surgeCol, S.surge * 0.75);           // red slashes → surge tint
  M.thruster.emissiveIntensity = A._baseEmi.get(M.thruster) * (1 + 0.15 * Math.sin(S.eng) + 0.6 * S.boost + 1.6 * S.surge);
  M.eye.emissiveIntensity = A._baseEmi.get(M.eye) * (1 + 0.3 * S.surge);
  M.eye.emissive.copy(A._eye0).lerp(A._surgeCol, S.surge * 0.4);

  // ── VFX — tail comet trail, shock rings, surge aura (full-system ignition) ─────
  updateVfx(A, S, dt);

  // ── host outputs: body roll into the bank, pitch with climb/dive + thrust lean,
  //    and a tight engine vibration (the game / preview applies these to the body) ─
  A._bodyRoll = -S.bank * rad(34);
  A._bodyPitch = climb * rad(12) - dive * rad(14) - S.boost * rad(6) - S.surge * rad(8);
  A._bodyYaw = S.bank * rad(6);
  A._vibration = Math.sin(S.eng * 3) * 0.004 * (0.4 + spd + S.boost + S.surge);
}

// ── VFX driver (model owns the meshes; this scales/fades/colours them) ──────────
function updateVfx(A, S, dt) {
  const vfx = A.vfx; if (!vfx) return;
  const hot = Math.max(S.boost, S.surge);

  // tail comet trail — grows + colours toward the surge tint on overdrive
  if (vfx.tailTrail) {
    const len = S.boost * 0.75 + S.surge * 2.2;
    const op = sat(S.boost * 0.5 + S.surge * 0.8);
    vfx.tailTrail.visible = op > 0.01;
    vfx.tailTrail.scale.set(0.7 + S.surge * 0.5, 0.7 + S.surge * 0.5, Math.max(0.001, len));
    vfx.tailMat.opacity = op;
    vfx.tailMat.color.copy(A._red0).lerp(A._surgeCol, S.surge);
  }

  // shock rings — periodic rings spawn behind the thrusters and expand+fade aft.
  // pool reuse: advance every ring's age, recycle the oldest on the spawn interval.
  if (vfx.rings && vfx.rings.length) {
    const active = hot > 0.45;
    const interval = S.surge > 0.3 ? 0.35 : 0.55;
    S.ringT += dt;
    if (active && S.ringT >= interval) {
      S.ringT = 0;
      let oldest = vfx.rings[0];
      for (const r of vfx.rings) if (r.userData._age > oldest.userData._age) oldest = r;
      oldest.userData._age = 0;
    }
    for (const r of vfx.rings) {
      const age = (r.userData._age += dt * 1.8);
      if (age >= 1) { r.visible = false; continue; }
      r.visible = true;
      const s = 0.6 + age * (1.5 + S.surge * 1.0);
      r.scale.set(s, s, s);
      r.position.z = vfx.ringZ + age * 1.4;
      r.material.opacity = (1 - age) * (0.5 + S.surge * 0.5);
      r.material.color.copy(A._th0).lerp(A._surgeCol, S.surge);
    }
  }

  // surge aura — an elongated back-lit shell; appears only on Dragon Surge
  if (vfx.aura) {
    const op = S.surge * 0.35;
    vfx.aura.visible = op > 0.01;
    vfx.auraMat.opacity = op;
    vfx.auraMat.color.copy(A._surgeCol);
    const pulse = 1 + 0.05 * Math.sin(S.eng);
    vfx.aura.scale.set(1.9 * pulse, 1.5 * pulse, 3.6 * pulse);
  }
}

export default updateSVJ;
