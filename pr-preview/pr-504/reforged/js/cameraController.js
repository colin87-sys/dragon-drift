import * as THREE from 'three';
import { damp } from './util.js';
import { CONFIG } from './config.js';
import { getDragonFitSpan } from './dragon.js';

// Chase camera: smooth follow, FOV widens on speed, shakes on damage/crash,
// kicks harder on boost start, tightens during fever.
let camera = null;
const smoothPos = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

const SHAKE_DURATION = 0.45;
let shakeT = 0;
let shakeMag = 0;

// Boost kick: brief forward lurch + FOV spike on boost start
let boostKickT = 0;
const BOOST_KICK_DUR = 0.35;

// Finale punch (PR-B): a sharp forward lurch on the reserved lance-climax hit —
// the camera physically reacts so the finale reads as IMPACT, not just sound.
let punchKickT = 0;
const PUNCH_KICK_DUR = 0.28;

// Inhale pinch (PR-C): a LEVEL channel (not an impulse) — the frame leans in
// with the drawn breath (FOV −2, slight dolly), released the instant the volley
// fires. Fed per-frame from main.js (0 outside a lance fuse / reduced-motion).
let inhaleLevel = 0;

// Roll kick: short camera lean in the roll direction + FOV bump
let rollKickT = 0;
let rollKickDir = 0;
const ROLL_KICK_DUR = 0.5;

// Gate kick: a small forward nudge when a window is threaded
let gateKickT = 0;
const GATE_KICK_DUR = 0.22;

// Death cam: slow ease-out dolly toward the crash during the freeze frame
let deathOn = false;
let deathT = 0;
const DEATH_DUR = 0.45;

// Start-screen showcase orbit
let showcaseAngle = 0;
let swayT = 0;   // WELCOME+HUB §3.3 — clock for the bounded idle SWAY (replaces the 360° turntable)
// Hub framing (WELCOME+HUB §3.1/§3.2): a composed hero read of the dragon. The distance is
// FIT PER-DRAGON from its measured span (getDragonFitSpan) so no form clips (phoenix/tempest
// have huge wingspans) and the starter isn't dwarfed — a fixed radius can't serve both.
const HUB_FOV = 46;      // showcase FOV (was 58 — tighter hero read, still holds the ring-course fill)
const HUB_SWAY = 0.24;   // ±~14° yaw sway (≤ ±15° ceiling, ≥ ±6° floor)
const HUB_R_MIN = 11, HUB_R_MAX = 30;
// Solve the camera distance that frames a dragon of the given span within HUB_FOV, on BOTH axes
// (width needs more distance in portrait, where the horizontal FOV is narrow). Cheap trig.
function hubFitRadius(span, aspect) {
  const tanV = Math.tan(HUB_FOV * 0.5 * Math.PI / 180);
  const distH = span.halfH / (0.66 * tanV);                         // dragon fills ~66% of frame HEIGHT
  const distW = span.halfW / (0.80 * tanV * Math.max(0.4, aspect)); // ~80% of frame WIDTH (side margin)
  return Math.min(HUB_R_MAX, Math.max(HUB_R_MIN, Math.max(distH, distW)));
}
// U12a — menu-as-camera-shot: the hub-orbit ↔ shop-static framing swap is a
// short DOLLY (eased over ~--t-screen), never a hard cut. shopW blends the two
// EXISTING framings; wasShowcase gates the ease to showcase↔showcase frames
// only — entering the showcase from a non-showcase state (pause-shop,
// gameover-shop) still SNAPS to the target pose, exactly as shipped, so the
// camera can never swing through world geometry from a mid-run chase pose.
let shopW = 0;
let wasShowcase = false;
// Splash attract-screen framing: behind the dragon, looking down the course.
let splashT = 0;
// WELCOME+HUB §0.5.c — the one-shot ignite camera PUSH toward the subject, fired on the
// splash wordmark-resolve. Audit blocker #3: punchKick() is consumed only in the chase branch
// AFTER the splash `return`, so it no-ops under splash — this is a net-new decaying term folded
// into the splash branch's own position.set, returning to the LOCKED splash pose.
let splashPushT = 0;
const SPLASH_PUSH_DUR = 0.6;

// First-launch cinematic: a one-time fly-in that glides from a dramatic low,
// wide, far pose into the resting showcase orbit while the FOV narrows.
let introT = 0;
const INTRO_DUR = 2.8;

// Sky Canyon framing: while threading a rock run, pull the cam in a touch (so it
// rides clear of the flanking rock) and widen the FOV (more peripheral read).
// Eased so entering/leaving a canyon never snaps.
let canyonOn = false;
let canyonW = 0;

// Rear-view rule-break beat (ASHTALON §5f): a scripted, announced ~3s swing that
// looks BACK over the dragon's tail at the hunter overtaking from behind, then
// eases forward again. The only camera authored to face backward; a trapezoid
// envelope (ease in / hold / ease out) blends it over the normal chase framing.
let rearT = 0, rearDur = 0;

// Cinematic overtake framing (ASHTALON flythrough): driven per-frame by the boss
// with { k, bx, by, bz } — k is 0..1 progress, b* the boss world position. The
// camera looks BACK and tracks the hunter as it climbs up behind and sweeps past
// (so the look naturally pivots as it crosses you), then blends home to the normal
// forward chase as it pulls ahead. null = inactive.
let overtake = null;

// ── SUNBREAK I4 surge channels ────────────────────────────────────────────────
// trauma² ROTATIONAL shake (Eiserloh; §M.1-8 NEW work — the legacy shake above is translational
// Math.random, the glitch-read Lane D forbids for 3D): trauma ∈[0,1], shake = trauma², applied as
// small camera ROTATIONS (≤~0.9°) after lookAt, driven by seeded incommensurate sine noise
// (deterministic + non-strobing). setSurgeTrauma = a sustained floor (the GATHER ramp); addSurgeTrauma
// = an impulse (the RELEASE spike). Decays ~1.2/s. surgeFov/surgePush: the GATHER tighten/push-in
// and the RELEASE punch ride one offset channel (punch decays fast; tighten follows the setter).
let surgeTrauma = 0;
let surgeTraumaFloor = 0;
let surgeFovOffset = 0;      // applied to targetFov (− tighten / + punch)
let surgeFovTarget = 0;
let surgePushK = 0;
let surgePushTarget = 0;
let surgeNoiseT = 0;
const _trN = (t, f1, f2, p1, p2) => 0.6 * Math.sin(2 * Math.PI * f1 * t + p1) + 0.4 * Math.sin(2 * Math.PI * f2 * t + p2);

export const cameraCtl = {
  splash: false,

  // Toggle the cinematic splash framing (behind the dragon, rings ahead).
  setSplash(on) {
    this.splash = on;
    splashT = 0;
  },

  init(cam, player) {
    camera = cam;
    smoothPos.set(player.position.x, player.position.y + 4.6, player.position.z + 13.2);   // match the raised chase pose
    camera.position.copy(smoothPos);
    camera.lookAt(player.position.x, player.position.y + 0.5, player.position.z - 16);
    deathOn = false;
    deathT = 0;
    gateKickT = 0;
    canyonOn = false;
    canyonW = 0;
  },

  shake(mag = 0.6) {
    shakeT = SHAKE_DURATION;
    shakeMag = mag;
  },

  // I4: sustained trauma floor (GATHER ramp 0.15→0.5) — held while the setter keeps calling.
  setSurgeTrauma(v) { surgeTraumaFloor = Math.max(0, Math.min(1, v)); },
  // I4: trauma impulse (RELEASE spike 1.0) — decays ~1.2/s on the trauma² curve.
  addSurgeTrauma(v) { surgeTrauma = Math.min(1, surgeTrauma + v); },
  // I4: surge FOV offset (deg; − tighten during GATHER, + punch at RELEASE) + camera push-in
  // (0..1 of ~2.6u toward the dragon). The punch decays inside the channel (fast out, ~300ms back).
  setSurgeFov(deg, pushK = surgePushTarget) { surgeFovTarget = deg; surgePushTarget = Math.max(0, Math.min(1, pushK)); },

  boostKick() {
    boostKickT = BOOST_KICK_DUR;
  },

  punchKick() {
    punchKickT = PUNCH_KICK_DUR;
  },

  // WELCOME+HUB §0.5.c — fire the one-shot splash ignite camera push (menu-only).
  splashPush() {
    splashPushT = SPLASH_PUSH_DUR;
  },

  setInhale(x) {
    inhaleLevel = Math.max(0, Math.min(1, x || 0));
  },

  rollKick(dir) {
    rollKickT = ROLL_KICK_DUR;
    rollKickDir = dir;
  },

  gateKick() {
    gateKickT = GATE_KICK_DUR;
  },

  // Toggled by main.js when the player enters/leaves a Sky Canyon run.
  setCanyon(on) {
    canyonOn = on;
  },

  // Fire the rear-view overtake beat (ASHTALON). Eased in/out over ~0.6s at each
  // end; boss.js announces it and holds fire for the swing.
  rearView(dur = 3.0) { rearDur = dur; rearT = dur; },
  get rearActive() { return rearT > 0; },

  // Boss-driven cinematic overtake framing (ASHTALON flythrough). Pass a state
  // object each frame, or null to release back to the normal chase.
  setOvertake(state) { overtake = state; },
  get overtakeActive() { return overtake != null; },
  get overtakeState() { return overtake; },

  // Engaged by finishDeath(); reset free via init() on restart. The
  // revive-accept path never calls finishDeath, so a saved run never dollies.
  deathCam() {
    deathOn = true;
    deathT = 0;
  },

  // First-launch cinematic. skipIntro() lands it instantly (tap-to-skip).
  playIntro() { introT = INTRO_DUR; },
  skipIntro() { introT = 0; },
  get introPlaying() { return introT > 0; },

  update(dt, player, showcase = false, shopMode = false) {
    // Splash attract screen: a LOCKED hero composition behind + above the dragon,
    // looking down the ring course. The framing is essentially still — only an
    // extremely subtle, loop-safe "breath" remains (the world carries the life:
    // dragon idle, water, drifting embers). All sine-driven, so it loops forever
    // with no drift, snap, or reset no matter how long the screen idles.
    if (this.splash) {
      splashT += dt;
      const sx = Math.sin(splashT * 0.80) * 0.07;        // ~8s lateral micro-sway (sub-pixel)
      const sy = Math.sin(splashT * 0.62 + 1.0) * 0.05;  // ~10s vertical float
      const zb = Math.sin(splashT * 0.50) * 0.10;        // tiny in/out breath
      // WELCOME+HUB §0.5.c — one-shot ignite PUSH: a sin-enveloped ~0.85u dolly toward the subject
      // (≈5–6% of the ~14u camera→subject distance), returning to the locked pose as splashPushT→0.
      let pushZ = 0;
      if (splashPushT > 0) {
        splashPushT = Math.max(0, splashPushT - dt);
        pushZ = Math.sin((1 - splashPushT / SPLASH_PUSH_DUR) * Math.PI) * 1.3;
      }
      camera.position.set(
        player.position.x + sx,
        player.position.y + 4.0 + sy,
        player.position.z + 14 + zb - pushZ
      );
      smoothPos.copy(camera.position);
      camera.lookAt(player.position.x + sx * 0.25, player.position.y + 0.6, player.position.z - 30);
      // Breathing zoom: ~±1% FOV around 66°, gently eased so it never reads as
      // a push-in. damp() also smooths the entry from the prior framing.
      const fovTarget = 66 + Math.sin(splashT * 0.70) * 0.7;
      camera.fov = damp(camera.fov, fovTarget, 3, dt);
      camera.updateProjectionMatrix();
      wasShowcase = false;
      return;
    }
    // Start-screen showcase: slow orbit around the live dragon. The SHOP is STATIC
    // (shopMode) — a fixed hero framing, no orbit, so the dragon sits composed in the
    // real environment with the horizon behind it. U12a eases BETWEEN the two
    // framings (both endpoints byte-identical to the shipped poses).
    if (showcase) {
      shopW = wasShowcase ? damp(shopW, shopMode ? 1 : 0, 10, dt) : (shopMode ? 1 : 0);
      wasShowcase = true;
      const w = shopW;
      // The orbit slows to a stop as the shop framing takes over and resumes as
      // it releases — angle continuity, so neither edge of the ease can snap.
      // WELCOME+HUB §3.3 — BOUNDED idle sway instead of a full 360° turntable: the camera
      // arcs within ±HUB_SWAY of dead-ahead (down the ring course), so it NEVER swings behind
      // the dragon into empty sky. The sway freezes as the shop static framing takes over (×(1-w)).
      swayT += dt * (1 - w);
      showcaseAngle = HUB_SWAY * Math.sin(swayT * 0.098);                   // ±~14°, ~64s period
      const hubR = hubFitRadius(getDragonFitSpan(), camera.aspect || 1);    // §3.2 per-dragon fit (no clip)
      const px = player.position.x, py = player.position.y, pz = player.position.z;
      const hx = px + Math.sin(showcaseAngle) * hubR;                       // hub hero pose (fit — no crop)
      const hy = py + 2.6 + Math.sin(swayT * 0.062 + 1.0) * 0.9;            // gentle independent vertical float (liveliness)
      const hz = pz + Math.cos(showcaseAngle) * hubR;
      const sx = px + Math.sin(0.32) * 12.5;                                // shop static pose (gentle 3/4) — byte-identical
      const sy = py + 2.1;
      const sz = pz + Math.cos(0.32) * 12.5;
      const ox = hx + (sx - hx) * w;
      const oy = hy + (sy - hy) * w;
      const oz = hz + (sz - hz) * w;
      let fovTarget = HUB_FOV + (55 - HUB_FOV) * w;                         // hub HUB_FOV → shop 55 (shop endpoint unchanged)
      if (introT > 0 && !shopMode) {
        // Glide in from a low/wide/far pose; the offset decays to nothing as the
        // orbit takes over. damp() keeps it buttery and frame-rate independent.
        introT = Math.max(0, introT - dt);
        const k = introT / INTRO_DUR;     // 1 → 0
        const e = k * k;                  // ease-out emphasis on the settle
        smoothPos.x = damp(smoothPos.x, ox + Math.sin(showcaseAngle + 1.4) * e * 7, 3.2, dt);
        smoothPos.y = damp(smoothPos.y, oy - e * 3.0,  3.2, dt);
        smoothPos.z = damp(smoothPos.z, oz + e * 10.0, 3.2, dt);
        camera.position.copy(smoothPos);
        fovTarget = HUB_FOV + e * 28;     // start wide (cinematic ~74), narrow to the hub HUB_FOV
      } else {
        camera.position.set(ox, oy, oz);
        smoothPos.copy(camera.position);
      }
      // Shop: look a touch BELOW the dragon so it rides higher in the frame, clear of
      // the stats/EQUIP panel that overlays the lower third (blended with the ease).
      camera.lookAt(player.position.x, player.position.y + 0.5 + (-0.9 - 0.5) * w, player.position.z);
      if (Math.abs(camera.fov - fovTarget) > 0.05) {
        camera.fov = damp(camera.fov, fovTarget, 2.5, dt);
        camera.updateProjectionMatrix();
      }
      return;
    }
    wasShowcase = false;   // U12a: any non-showcase frame re-arms the snap-on-entry rule
    // Cinematic overtake framing (ASHTALON flythrough): look BACK and TRACK the
    // hunter as it climbs up behind and sweeps past (the look pivots as it crosses
    // you), then blend home to the normal chase as it pulls ahead. Deterministic,
    // camera-only. rearEnv 1→0 across the pivot moves the camera from an ahead/high
    // "look-back" pose to the normal chase pose.
    if (overtake && !overtake.chaseCam) {
      // §5j chaseCam: a hijack can keep the NORMAL chase camera (spends the hijack
      // "invisibly" — EITHERWING's Baton Cross) while STILL feeding overtakeState so
      // main.js sweeps the dragon's head with the crossing eye. Such a state skips this
      // rear-look block and falls through to the normal chase below.
      // §5j: the rear-look pose endpoints, pivot/blend, look weighting, and FOV target are
      // the DEFAULTS of ASHTALON's overtake — a hijack script can override any of them via
      // its setOvertake state (defaults preserve ASHTALON byte-for-byte; EITHERWING's Baton
      // Cross reuses them wholesale with a chase-identical pose, feeding the ORB's x as bx
      // so the camera pans to hold the crossing eye).
      // Stay locked BACK on it through the whole close pass, then ease home to the forward
      // chase as it pulls ahead and settles. rearEnv 1→0 across the pivot.
      const pivot = overtake.pivot ?? 0.60, blend = overtake.blend ?? 0.32;
      const rearEnv = overtake.k < pivot ? 1 : Math.max(0, 1 - (overtake.k - pivot) / blend);
      const near = overtake.near ?? [0.9, 3.6, 12.3], rear = overtake.rear ?? [0.9, 4.4, -9];   // [xMul, yOff, zOff]
      const nx = player.position.x * near[0], ny = player.position.y + near[1], nz = player.position.z + near[2];
      const rx = player.position.x * rear[0], ry = player.position.y + rear[1], rz = player.position.z + rear[2];
      camera.position.set(nx + (rx - nx) * rearEnv, ny + (ry - ny) * rearEnv, nz + (rz - nz) * rearEnv);
      smoothPos.copy(camera.position);
      // Look at the MIDPOINT of the dragon and the boss (not the boss alone) so BOTH stay
      // in the shot, whatever lane the dragon is in — easing to the normal forward look on return.
      const midY = overtake.midY ?? 1.0, fwd = overtake.forward ?? [0, 1.0, -16];   // fwd = [xOff, yOff, zOff]
      const mx = (player.position.x + overtake.bx) / 2, my = (player.position.y + overtake.by) / 2 + midY, mz = (player.position.z + overtake.bz) / 2;
      const fx = player.position.x + fwd[0], fy = player.position.y + fwd[1], fz = player.position.z + fwd[2];
      lookTarget.set(fx + (mx - fx) * rearEnv, fy + (my - fy) * rearEnv, fz + (mz - fz) * rearEnv);
      camera.lookAt(lookTarget);
      const fovT = overtake.fov ?? 80;
      if (Math.abs(camera.fov - fovT) > 0.1) { camera.fov = damp(camera.fov, fovT, 4, dt); camera.updateProjectionMatrix(); }
      return;
    }
    const speedNorm = Math.min(Math.max((player.speed - 35) / 55, 0), 1);
    canyonW = damp(canyonW, canyonOn ? 1 : 0, 3, dt);
    // A touch further back + higher than before so the (now larger) dragon sits
    // lower in frame and more of the path ahead stays visible. A canyon pulls it
    // ~1.6 closer so the chase cam rides clear of the flanking rock.
    const targetBack = (player.feverActive ? 7.2 : player.boosting ? 8.8 : 13.2) - canyonW * 1.6;
    // Raised + steepened (visibility fix): a deeper look-down puts the dragon LOWER in frame so the
    // path ahead opens ABOVE it, instead of the dragon sitting on the horizon band where obstacles are.
    // All three states scaled together so entering boost/fever doesn't read as a camera dive.
    const targetHeight = player.feverActive ? 3.2 : player.boosting ? 3.9 : 4.6;
    const dx = player.position.x * 0.9;
    smoothPos.x = damp(smoothPos.x, dx,                    4.5, dt);
    smoothPos.y = damp(smoothPos.y, player.position.y + targetHeight, player.boosting ? 6.5 : 4.5, dt);
    smoothPos.z = damp(smoothPos.z, player.position.z + targetBack,  player.boosting ? 12 : 8,   dt);
    camera.position.copy(smoothPos);

    // Boost kick: camera pulls back slightly then snaps forward
    if (boostKickT > 0) {
      boostKickT -= dt;
      const k = (boostKickT / BOOST_KICK_DUR);
      // Push back on start, then settle — gives "punch" feel
      camera.position.z -= Math.sin(k * Math.PI) * 1.4;
      camera.position.y -= Math.sin(k * Math.PI) * 0.25;
    }

    // Finale punch (PR-B): a snappy forward lurch + slight rise on the lance
    // climax — modelled on boostKick's sin envelope, applied after the chase solve.
    if (punchKickT > 0) {
      punchKickT -= dt;
      const e = Math.sin((punchKickT / PUNCH_KICK_DUR) * Math.PI);
      camera.position.z -= e * 1.1;
      camera.position.y += e * 0.12;
    }

    // Gate kick: boost kick's little sibling — threading should *tug*
    if (gateKickT > 0) {
      gateKickT -= dt;
      const k = gateKickT / GATE_KICK_DUR;
      camera.position.z -= Math.sin(k * Math.PI) * 0.5;
    }

    // Death cam: dolly 2m toward the crash + slight sink, holds through the
    // freeze and recap (camera is otherwise static there).
    if (deathOn) {
      deathT = Math.min(deathT + dt, DEATH_DUR);
      const k = 1 - Math.pow(1 - deathT / DEATH_DUR, 3);
      camera.position.z -= k * 2.0;
      camera.position.y -= k * 0.35;
    }

    if (shakeT > 0) {
      shakeT -= dt;
      const k = Math.max(shakeT / SHAKE_DURATION, 0) * shakeMag;
      camera.position.x += (Math.random() * 2 - 1) * k;
      camera.position.y += (Math.random() * 2 - 1) * k;
    }

    // Aim the axis further DOWN toward the path (0.5, was 1.0) so the dragon drops lower in frame and
    // the forward obstacle field reads above its silhouette.
    lookTarget.set(player.position.x, player.position.y + 0.5 + speedNorm * 0.25, player.position.z - 16);
    camera.lookAt(lookTarget);

    // Rear-view overtake beat (ASHTALON §5f): swing AHEAD of and above the dragon
    // and look BACK down the course at the hunter climbing up behind, then ease
    // forward again. Trapezoid envelope (0.6s in / hold / 0.6s out) blends it over
    // the chase framing so the reversal never snaps. Camera-only, deterministic.
    if (rearT > 0) {
      rearT -= dt;
      const env = Math.max(0, Math.min(1, (rearDur - rearT) / 0.6, rearT / 0.6));
      const rz = player.position.z - 9;   // ahead of the dragon (−z), looking back
      camera.position.x += (player.position.x * 0.9 - camera.position.x) * env;
      camera.position.y += (player.position.y + 3.6 - camera.position.y) * env;
      camera.position.z += (rz - camera.position.z) * env;
      const lookZ = player.position.z + (-16) * (1 - env) + 34 * env;   // forward → back
      lookTarget.set(player.position.x, player.position.y + 1.0 + 0.5 * env, lookZ);
      camera.lookAt(lookTarget);
    }

    // Roll lean: applied after lookAt (which resets orientation each frame).
    if (rollKickT > 0) {
      rollKickT -= dt;
      const k = Math.max(rollKickT / ROLL_KICK_DUR, 0);
      camera.rotateZ(rollKickDir * 0.16 * Math.sin(k * Math.PI));
    }

    // I4 trauma² ROTATIONAL shake (after lookAt, like the roll lean): amplitude ≤0.9° at
    // trauma 1, seeded incommensurate sine noise (no Math.random — deterministic, no strobe).
    // The floor (GATHER ramp) self-decays so a stopped ritual never strands a hum; the impulse
    // (RELEASE spike) decays ~1.2/s per the Eiserloh law.
    surgeNoiseT += dt;
    surgeTrauma = Math.max(0, surgeTrauma - dt * 1.2);
    surgeTraumaFloor = Math.max(0, surgeTraumaFloor - dt * 3);
    const _tr = Math.max(surgeTrauma, surgeTraumaFloor);
    if (_tr > 0.001) {
      const sh = _tr * _tr, amp = 0.0157;   // 0.9° max
      camera.rotateZ(amp * sh * _trN(surgeNoiseT, 11.7, 7.3, 0.9, 3.7));
      camera.rotateX(amp * 0.5 * sh * _trN(surgeNoiseT, 9.1, 13.9, 2.2, 5.1));
    }
    // I4 surge FOV/push channel: negative offsets (the GATHER tighten) track the setter; a
    // positive offset is the RELEASE PUNCH — fast attack (~30/s → 85% inside 80ms), then the
    // target self-decays to 0 over ~300ms. Push-in dollies toward the dragon (≤~2.6u).
    surgeFovOffset = damp(surgeFovOffset, surgeFovTarget, surgeFovTarget > surgeFovOffset ? 30 : 9, dt);
    if (surgeFovTarget > 0) surgeFovTarget = Math.max(0, surgeFovTarget - dt * 24);
    surgePushK = damp(surgePushK, surgePushTarget, 6, dt);
    surgePushTarget = Math.max(0, surgePushTarget - dt * 2);   // self-decays; the ritual re-asserts each frame
    if (surgePushK > 0.001) camera.position.z -= surgePushK * 2.6;

    // Inhale pinch (PR-C): lean in with the drawn breath — a small dolly here
    // (after the chase solve, like the kicks) + the FOV squeeze below.
    if (inhaleLevel > 0.001) camera.position.z -= inhaleLevel * 0.3;

    // FOV: base 72, boost → 90, fever → 94 (wider = more intense)
    let targetFov = 72;
    if (player.speedActive) targetFov = 82;
    if (player.boosting) targetFov = 86;
    if (player.feverActive) targetFov = 90;
    if (rollKickT > 0) targetFov += 4;
    targetFov += canyonW * 6; // wider peripheral read while threading rock
    // Spine SPEED TUNNEL: the slipstream punches the FOV wide for the need-for-speed
    // rush (canyonSlip ramps 1→canyonSpineSlip in the spine only, so rock is unaffected).
    // NORMALIZED to the 0→1 slip mix (× 13°) rather than the raw (slip−1): a raw
    // coefficient re-broke into fisheye every time the slip dial climbed (45×0.40=+18°
    // stacked to ~110°). +13° at full slip stays clear of distortion AND is future-proof
    // — cranking canyonSpineSlip never re-tips it.
    targetFov += Math.max(0, Math.min(1, (player.canyonSlip - 1) / Math.max(1e-6, CONFIG.canyonSpineSlip - 1))) * 13;
    targetFov -= inhaleLevel * 2; // PR-C: the inhale pinch (narrow = held breath)
    targetFov += surgeFovOffset;  // I4: GATHER tighten (−5°) / RELEASE punch (+7°, self-decaying)
    if (Math.abs(camera.fov - targetFov) > 0.1) {
      camera.fov = damp(camera.fov, targetFov, surgeFovOffset > 0.5 ? 26 : player.boosting ? 5 : 3, dt);   // I4: the punch attacks fast; tighten/settle keep the cruise rates
      camera.updateProjectionMatrix();
    }
  },

  // Project a WORLD position to screen coords in viewBox PERCENT (0..100), for DOM/SVG
  // overlays that want to anchor on a 3D point (WEFTWITCH's HUD-sew casts from her hands).
  // The reticle.js `.project(camera)` idiom. `behind` = point is behind the camera (hide
  // → caller falls back). Reuses the camera reference this controller already holds.
  worldToScreen(v3, out = {}) {
    if (!camera) { out.behind = true; return out; }
    _proj.copy(v3).project(camera);
    out.x = (_proj.x * 0.5 + 0.5) * 100;
    out.y = (-_proj.y * 0.5 + 0.5) * 100;
    out.behind = _proj.z > 1;
    return out;
  },
};
const _proj = new THREE.Vector3();
