// creatureFace — the CHARISMA layer for player creatures: a living face (eyes that
// track with lag, blink, deliberately look away; brows that slant with mood; pupils
// that constrict when alert) mounted on any head. A generic re-implementation of the
// boss gaze/blink/brow/pupil state machine (bossIdol.js charisma pass, L127: "the
// machine is boss-agnostic") — the PATTERN is extracted, not the closure-bound code.
// Pure module: no imports from boss code, no fight logic, spec-driven geometry.
//
// Contract (all additive-nullable at the call sites):
//   const face = buildCreatureFace(spec, def)
//   face.group          — add under the model (positions are model-local via spec)
//   face.tick(dt, t)    — advance gaze lag / blink heartbeat / look-away / brows
//   face.setGaze(nx,ny) — normalized target the pupils chase (steering input)
//   face.notice()       — one-shot alert beat (run start, Surge): pupils pinpoint
//   face.setMood(m)     — 'rest' | 'alert' | 'strain' → brow slant target
//
// spec: { eyeX, eyeY, eyeZ, eyeScale?, browLen?, browLift?, browColor? }
// def:  the dragon def (palette: def.eye for the iris glow, def.eyePupil).
// The dragon faces −z (nose forward); gaze +x = player-right, +y = up.

import * as THREE from 'three';

// L125 law #4: focal glows need HDR overdrive past the 1.0 bloom threshold, with
// toneMapped=false so the read survives the no-postfx fallback.
const EYE_HOT = 2.4;

export function buildCreatureFace(spec, def = {}) {
  const es = spec.eyeScale ?? 1;
  const group = new THREE.Group();
  group.name = 'creatureFace';

  // Eye whites: the def's eye tint pulled halfway to white BEFORE the overdrive —
  // sRGB→linear conversion crushes mid colours (linear 0.55 sRGB ≈ 0.27), so a raw
  // def tint ×2.4 can still land UNDER the 1.0 bloom threshold. Half-white keeps the
  // tint while guaranteeing every channel clears it (the boss used a near-white base
  // for the same reason).
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  eyeMat.toneMapped = false;
  eyeMat.color.set(def.eye ?? 0xffffff).lerp(new THREE.Color(1, 1, 1), 0.5).multiplyScalar(EYE_HOT);
  eyeMat.userData.paletteTier = 'accent';   // C1 palette-law measurement tag
  const pupilMat = new THREE.MeshStandardMaterial({ color: def.eyePupil ?? 0x0a0a0a, roughness: 0.35, metalness: 0 });
  const browMat = new THREE.MeshStandardMaterial({ color: spec.browColor ?? def.horn ?? 0x222222, roughness: 0.8, metalness: 0 });

  // Per-side eye assemblies. Each eye lives in its own socket group whose origin is
  // the EYE CENTRE, so blink (scale.y) crushes about the socket line and never
  // slides down the face (the boss gotcha #3), and the pupil rides inside it.
  const eyeGeo = new THREE.SphereGeometry(0.115 * es, 10, 8);
  const pupilGeo = new THREE.SphereGeometry(0.052 * es, 8, 6);
  const sockets = [], pupils = [], browPivots = [];
  const BROW_BASE = spec.browLift ?? 0.18;   // resting slant (rad); sign per side
  for (const side of [1, -1]) {
    const socket = new THREE.Group();
    socket.position.set(side * spec.eyeX, spec.eyeY, spec.eyeZ);

    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.scale.set(0.74, 1.12, 0.70);          // almond
    eye.rotation.y = side * 0.55;             // wrap the skull
    eye.rotation.z = side * -0.12;
    socket.add(eye);

    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.userData.side = side;
    pupil.userData.rest = new THREE.Vector3(side * 0.05 * es, 0, -0.075 * es);
    pupil.position.copy(pupil.userData.rest);
    socket.add(pupil);
    pupils.push(pupil);

    // Brow: a thin bar on a pivot ABOVE the eye — ±0.3 rad of slant is the whole
    // expression rig (anger/pain/rest), the cheapest emotion in 3D (L127).
    const browLen = (spec.browLen ?? 0.16) * es;
    const brow = new THREE.Mesh(new THREE.BoxGeometry(browLen, 0.028 * es, 0.05 * es), browMat);
    brow.position.x = side * browLen * 0.28;  // bar hangs outward from the pivot
    const pivot = new THREE.Group();
    pivot.position.set(0, 0.115 * es, -0.04 * es);
    pivot.rotation.z = side * BROW_BASE;
    pivot.userData.side = side;
    pivot.add(brow);
    socket.add(pivot);
    browPivots.push(pivot);

    group.add(socket);
    sockets.push(socket);
  }

  // ── state machine (the L127 pattern: lagged gaze + wander, blink heartbeat,
  // one-shot notice, mood brows) ────────────────────────────────────────────────
  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  let lookAwayT = 0, lookAwayX = 0, lookAwayY = 0, nextLookAway = 4 + Math.random() * 5;
  let blinkT = 0, nextBlink = 2.5 + Math.random() * 3.5;
  const BLINK_DUR = 0.22;
  let noticeT = 0;
  let mood = 'rest';

  function setGaze(nx, ny) {
    gazeTX = Math.max(-1, Math.min(1, nx));
    gazeTY = Math.max(-1, Math.min(1, ny));
  }
  function notice() { noticeT = 0.9; blinkT = 0; nextBlink = 1.6; }
  function setMood(m) { mood = m; }

  function tick(dt) {
    // Gaze: lagged pursuit with deliberate look-aways — snap-tracking reads as a
    // turret, lag + wander reads as a MIND (L127).
    nextLookAway -= dt;
    if (lookAwayT > 0) lookAwayT -= dt;
    else if (nextLookAway <= 0 && noticeT <= 0) {
      lookAwayT = 0.7 + Math.random() * 0.6;
      lookAwayX = (Math.random() - 0.5) * 1.6;
      lookAwayY = Math.random() * 0.7 - 0.2;
      nextLookAway = 4 + Math.random() * 5;
    }
    const gx = lookAwayT > 0 ? lookAwayX : gazeTX;
    const gy = lookAwayT > 0 ? lookAwayY : gazeTY;
    const gLag = noticeT > 0 ? 10 : 3.5;      // it locks on when it means it
    gazeX += (gx - gazeX) * Math.min(1, dt * gLag);
    gazeY += (gy - gazeY) * Math.min(1, dt * gLag);
    // pupil x rides toward the gaze; −z keeps it on the eye's front surface
    for (const p of pupils) p.position.set(
      p.userData.rest.x + gazeX * 0.035 * es,
      p.userData.rest.y + gazeY * 0.028 * es,
      p.userData.rest.z);

    // Blink heartbeat (triangle 1→0→1), suppressed during the notice stare.
    if (blinkT > 0) blinkT -= dt;
    else {
      nextBlink -= dt;
      if (nextBlink <= 0 && noticeT <= 0) { blinkT = BLINK_DUR; nextBlink = 2.5 + Math.random() * 3.5; }
    }
    const blinkK = blinkT > 0 ? Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 1;
    for (const s of sockets) s.scale.y = Math.max(0.05, blinkK);

    // Brows: priority notice-anger > mood.
    if (noticeT > 0) noticeT -= dt;
    let browP = 0;
    if (noticeT > 0) browP = -0.28;
    else if (mood === 'alert') browP = -0.16;
    else if (mood === 'strain') browP = 0.24;
    for (const b of browPivots) {
      const target = b.userData.side * (BROW_BASE + browP);
      b.rotation.z += (target - b.rotation.z) * Math.min(1, dt * 9);
    }

    // Pupils: pinpoint on notice (rage tell in every animal, L127).
    const pupilTarget = noticeT > 0 ? 0.55 : 1;
    for (const p of pupils) {
      const s = p.scale.x + (pupilTarget - p.scale.x) * Math.min(1, dt * 8);
      p.scale.setScalar(Math.max(0.01, s));
    }
  }

  return { group, tick, setGaze, notice, setMood };
}
