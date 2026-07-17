import * as THREE from 'three';
import { registerTorso } from './dragonRecipe.js';
import { applyFresnelRim } from './surface.js';

// ─────────────────────────────────────────────────────────────────────────────────────
// JADE SERPENT — a purpose-built koi river-dragon skeleton (IMG_7739).
//
// Fresh bones, not the old koiSerpent tube: the body is lofted along a real SPINE CURVE
// with a proper per-station frame (tangent / up-normal / side-binormal), so
//   • the cross-section rings stay perpendicular to the curve (no z-plane shearing), and
//   • the koi WEB-FANS mount BY THE FRAME (rooted on the side-binormal flank, fanning
//     outward-and-up along the tangent) so they orient correctly all down a coiling body —
//     the thing the wing-pivot rig could never do.
//
// One continuous single-material mesh (vertex-coloured): body tube + the row of broad
// radiating pleated fans + the leaf-fork tail, all emitted into ONE positions/colors/index
// buffer BEFORE the travelling-wave arrays are snapshotted, so every fan and leaf whips with
// the swim wave for free (the moonTail trick, generalised). dragon.js ticks parts.bodyWave.
//
// Publishes the SAME attach + bodyWave contract koiSerpent did, so the head / pearl-wings /
// rig / pearl-chain plumbing all attach unchanged.
// ─────────────────────────────────────────────────────────────────────────────────────

function buildJadeSerpentTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const spineMats = [];

  const cBody = def.body ?? 0x178a54;
  const cBelly = def.belly ?? 0xa6e2c2;
  const cShadow = model.bodyShadowColor ?? 0x0d5c3a;
  const cRim = def.apexSeam ?? def.accentHue ?? 0x9ff0c8;
  const cEye = def.eye ?? 0x8ff0c2;

  const scale = model.scale ?? 1;
  const lenHint = (model.neckSegments ?? 6) + (model.tailSegments ?? 10);
  const N = Math.max(14, Math.min(48, Math.round(lenHint * (model.bodyLength ?? 1.0))));   // ring count
  const K = Math.max(8, Math.round(model.bodyRadial ?? 12));                                // radial resolution
  const leadR = (model.bodyGirth ?? 0.5) * scale;
  const OVAL_W = model.bodyOvalW ?? 1.1, OVAL_H = model.bodyOvalH ?? 0.92;

  // ── The SPINE CURVE (analytic, sinuous). z runs monotonically head→tail (the creature
  // swims FORWARD, so it can't be a folded static coil); the S lives in x (lateral) with a
  // gentle y undulation. Head at t=0 (front), tail at t=1 (back). ────────────────────────
  const TOT = (model.bodyReach ?? 11) * leadR;                     // total body length along z
  const latAmp = (model.bodyLatArc ?? 0.9) * leadR * 6;           // lateral S amplitude
  const latWaves = model.bodyLatWaves ?? 2.2;
  const latPhase = model.bodyLatPhase ?? 0;
  const vertAmp = (model.bodyArcY ?? 0.16) * leadR * 6;
  const droop = leadR * 0.4;
  const bodyY = 0.5;
  const latEnv = (t) => Math.pow(Math.sin(Math.min(1, t * 1.15) * Math.PI), 0.5);   // calm at the head, full mid-body
  const cl = (t) => new THREE.Vector3(
    latAmp * Math.sin(t * Math.PI * latWaves + latPhase) * latEnv(t),
    bodyY - 0.02 - droop * t * t + vertAmp * Math.sin(t * Math.PI * 2.0),
    t * TOT,
  );

  // KOI girth: plump behind the head, tapering smoothly to a fine tail tip.
  const PEAK = 0.16;
  const girth = (t) => {
    const up = Math.min(t / PEAK, 1);
    const down = Math.max(0, (t - PEAK) / (1 - PEAK));
    return (0.68 + 0.32 * Math.sin(up * Math.PI * 0.5)) * Math.pow(1 - down, 1.25) + 0.05;
  };

  // per-station frame: tangent T, side-binormal B (≈horizontal), up-normal Nn — a stable
  // fixed-up frame (T never nears vertical on a mostly-z serpent, so no flips).
  const UP = new THREE.Vector3(0, 1, 0);
  const frames = [];
  for (let i = 0; i < N; i++) {
    const t = N > 1 ? i / (N - 1) : 0;
    const dt = 0.5 / (N - 1);
    const p = cl(t);
    const T = cl(Math.min(1, t + dt)).sub(cl(Math.max(0, t - dt))).normalize();
    const B = new THREE.Vector3().crossVectors(T, UP).normalize();
    const Nn = new THREE.Vector3().crossVectors(B, T).normalize();
    frames.push({ t, p, T, B, Nn, r: leadR * girth(t) });
  }
  // pin the shoulder frame (form-invariant head/wing/pearl anchor)
  let shoulderI = 1;
  const SHOULDER_ARC = (model.shoulderArc ?? 0.9) * scale;
  while (shoulderI < N - 1 && frames[shoulderI].p.distanceTo(frames[0].p) < SHOULDER_ARC) shoulderI++;

  // ── Build the tube: N rings × K verts, oriented in each frame's B–Nn plane ────────────
  const colBody = new THREE.Color(cBody), colBelly = new THREE.Color(cBelly), colShadow = new THREE.Color(cShadow);
  const rb = model.crestRibbon ?? 0;
  const colCrest = new THREE.Color(model.crestColor ?? 0xbdf5d0);
  const positions = [], normals = [], colors = [], indices = [];
  const tmp = new THREE.Color();
  const ringBase = [];
  for (let i = 0; i < N; i++) {
    const f = frames[i];
    ringBase.push(positions.length / 3);
    const rW = f.r * OVAL_W, rH = f.r * OVAL_H;
    for (let j = 0; j < K; j++) {
      const a = (j / K) * Math.PI * 2;
      const cs = Math.cos(a), sn = Math.sin(a);
      // ring vertex = spine point + cos·B·rW + sin·Nn·rH  (cross-section ⟂ the curve)
      const px = f.p.x + cs * rW * f.B.x + sn * rH * f.Nn.x;
      const py = f.p.y + cs * rW * f.B.y + sn * rH * f.Nn.y;
      const pz = f.p.z + cs * rW * f.B.z + sn * rH * f.Nn.z;
      positions.push(px, py, pz);
      const nx = cs * f.B.x + sn * f.Nn.x, ny = cs * f.B.y + sn * f.Nn.y, nz = cs * f.B.z + sn * f.Nn.z;
      const nl = Math.hypot(nx, ny, nz) || 1;
      normals.push(nx / nl, ny / nl, nz / nl);
      // value ramp keyed on the up-component (sin): dorsal body → shadow flank → pale belly
      if (sn >= 0.05) tmp.copy(colBody);
      else if (sn >= -0.32) tmp.copy(colBody).lerp(colShadow, ((0.05 - sn) / 0.37) * 0.85);
      else tmp.copy(colShadow).lerp(colBelly, Math.min(1, (-0.32 - sn) / 0.5));
      // DORSAL CREST RIBBON (a≈π/2) as a HARD 3-BAND spine (reference identity, ~40% of the read):
      // a bright pale-seafoam stripe (top column) bounded IMMEDIATELY by dark-emerald flank columns,
      // nose→tail — a crisp graphic band, not a soft luminance gradient.
      const dA = Math.abs(a - Math.PI / 2);
      if (rb > 0 && sn > 0.1) {
        const taper = f.t < 0.9 ? 1 : Math.max(0.4, 1 - (f.t - 0.9) * 4);
        if (dA < 0.35) tmp.copy(colBody).lerp(colCrest, rb * taper);          // HARD bright pale-mint spine stripe (the top column)
        else tmp.copy(colBody).lerp(colShadow, 0.55 * rb);                    // dark-emerald flank columns framing it
      }
      colors.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let i = 0; i < N - 1; i++) {
    const a0 = ringBase[i], b0 = ringBase[i + 1];
    for (let j = 0; j < K; j++) {
      const j2 = (j + 1) % K;
      indices.push(a0 + j, b0 + j, b0 + j2, a0 + j, b0 + j2, a0 + j2);
    }
  }
  // nose + tail caps
  const f0 = frames[0], fN = frames[N - 1];
  const noseIdx = positions.length / 3;
  const nose = f0.p.clone().addScaledVector(f0.T, -f0.r * 0.9);
  positions.push(nose.x, nose.y, nose.z); normals.push(-f0.T.x, -f0.T.y, -f0.T.z); colors.push(colBody.r, colBody.g, colBody.b);
  const tailIdx = positions.length / 3;
  const tailP = fN.p.clone().addScaledVector(fN.T, fN.r * 1.4);
  positions.push(tailP.x, tailP.y, tailP.z); normals.push(fN.T.x, fN.T.y, fN.T.z); colors.push(colBody.r, colBody.g, colBody.b);
  for (let j = 0; j < K; j++) {
    const j2 = (j + 1) % K;
    indices.push(noseIdx, ringBase[0] + j2, ringBase[0] + j);
    indices.push(tailIdx, ringBase[N - 1] + j, ringBase[N - 1] + j2);
  }

  // ── BODY WEB-FANS — a row of broad radiating pleated koi fans, mounted BY THE FRAME ────
  const cLeadF = new THREE.Color(model.finLeadColor ?? 0x116b45);
  const cMidF = new THREE.Color(model.finMidColor ?? 0x2f9e77);
  const cTipF = new THREE.Color(model.fanTipColor ?? 0xa6ecc2);   // SATURATED pale green-mint (not pale-cyan) — stays green even under cool studio ambient (Fable gate r4)
  const emitFan = (f, s, R, tiltUp) => {
    // fan frame: radial-out = flank-outward (±B) blended up (Nn); spread = along the body (T)
    const ex = f.B.clone().multiplyScalar(s).addScaledVector(f.Nn, tiltUp).normalize();
    const ez = f.T.clone();
    const ey = new THREE.Vector3().crossVectors(ex, ez).normalize();          // fan face normal
    const P0 = f.p.clone().addScaledVector(f.B, s * f.r * OVAL_W * 0.7).addScaledVector(f.Nn, f.r * 0.15);
    const nRf = 3, nAf = 10, hubF = 0.14;
    const halfArc = model.fanSpread ?? 0.9;                          // wide sector → a broad rounded fan
    const pleatAmp = (model.fanPleat ?? 0.08) * R;
    const cup = (model.fanCup ?? 0.14) * R;                          // gentle cup so the fan isn't a flat sail
    const rows = [];
    for (let i = 0; i <= nRf; i++) {
      const u = i / nRf; const row = [];
      for (let j = 0; j <= nAf; j++) {
        const af = j / nAf, fold = (j % 2) * 2 - 1;
        const edge = Math.abs(af - 0.5) * 2;                          // 0 centre → 1 fan edge
        const lx = R * (hubF + (1 - hubF) * u) * (1 - 0.28 * edge * edge);   // ROUND the outer corners → a fan, not a triangle
        const lz = (af - 0.5) * 2 * (R * halfArc * (0.08 + 0.92 * u));       // chord (opens wide + rounded at the arc)
        const ly = pleatAmp * fold * Math.sin(u * Math.PI) + cup * Math.sin(u * Math.PI * 0.5) * (1 - edge * 0.5);   // pleat ridges + a gentle overall cup
        row.push(positions.length / 3);
        positions.push(
          P0.x + ex.x * lx + ey.x * ly + ez.x * lz,
          P0.y + ex.y * lx + ey.y * ly + ez.y * lz,
          P0.z + ex.z * lx + ey.z * ly + ez.z * lz);
        normals.push(ey.x, ey.y, ey.z);
        // ONE green hue ramp: deep-emerald root → mid-jade → pale-seafoam tip (Fable gate r4: the
        // fans must be a single green ramp — NO hue alternation). Pleat + rim contrast is VALUE ONLY.
        const c = cLeadF.clone().lerp(cMidF, Math.min(1, u * 1.9)).lerp(cTipF, Math.max(0, (u - 0.55) / 0.45));
        if (fold < 0) c.multiplyScalar(0.82);                              // receding pleat spokes — DARKER same hue (value, not a teal)
        if (u > 0.92 || edge > 0.92) c.multiplyScalar(0.68);              // dark rim (value) → crisp edge even edge-on
        colors.push(c.r, c.g, c.b);
      }
      rows.push(row);
    }
    for (let i = 0; i < nRf; i++) for (let j = 0; j < nAf; j++) {
      const a = rows[i][j], b = rows[i][j + 1], d = rows[i + 1][j], e = rows[i + 1][j + 1];
      indices.push(a, b, e, a, e, d);        // front winding
      indices.push(a, e, b, a, d, e);        // back winding
    }
  };
  const bodyFins = model.bodyFins ?? 0;
  if (bodyFins > 0) {
    const nFan = Math.max(2, Math.round(model.bodyFinCount ?? 4));
    const finScale = model.bodyFinScale ?? 4.4;
    const tiltUp = model.bodyFinTilt ?? 1.1;                        // how much the fan tips up vs straight out
    for (let k = 0; k < nFan; k++) {
      const kf = nFan > 1 ? k / (nFan - 1) : 0;
      const ft = 0.22 + 0.62 * kf;
      const fi = Math.min(N - 1, Math.max(0, Math.round(ft * (N - 1))));
      const f = frames[fi];
      const R = f.r * finScale * (1 - 0.58 * kf) * bodyFins;         // HIERARCHY: shoulder fan is the hero, stepping down to ~0.42× at the tail (reference law)
      for (const s of [-1, 1]) emitFan(f, s, R, tiltUp);
    }
  }

  // ── LEAF-FORK TAIL — two long pointed koi leaves forking back-out-up from the tail tip ─
  const caudal = model.caudalFork ?? 0;
  if (caudal > 0) {
    const cVein = colBody.clone().lerp(colShadow, 0.5);
    const cBlade = colBody.clone().lerp(new THREE.Color(cRim), 0.62);
    const cLeaf = colBody.clone().lerp(new THREE.Color(cRim), 0.94);
    if (rb > 0) cLeaf.lerp(colCrest, rb * 0.4);
    const Llen = leadR * (1.7 + 3.4 * caudal);   // modest fork — the tail is NOT the hero (Fable gate r2: shoulder fan stays the hero)
    const nU = 8, nV = 4;
    for (const s of [-1, 1]) {
      // leaf axis: mostly BACK (T) with a modest out (±B) + up (Nn) — trails aft, does NOT cross the body
      const D = fN.T.clone().multiplyScalar(0.95).addScaledVector(fN.B, s * 0.34).addScaledVector(fN.Nn, 0.26).normalize();
      const Wd = new THREE.Vector3().crossVectors(D, fN.Nn).normalize();
      const Nl = new THREE.Vector3().crossVectors(D, Wd).normalize();
      const B0 = fN.p.clone().addScaledVector(fN.T, fN.r * 0.4).addScaledVector(fN.B, s * fN.r * 0.22);
      const rows = [];
      for (let iu = 0; iu <= nU; iu++) {
        const u = iu / nU;
        const w = Llen * 0.26 * Math.pow(u + 0.2, 0.4) * Math.pow(1 - u, 0.72);   // WIDE root (visible V-junction) → lanceolate point
        const cam = Llen * 0.05 * Math.sin(u * Math.PI);
        const C = B0.clone().addScaledVector(D, u * Llen).addScaledVector(Nl, cam);
        const row = [];
        for (let iv = 0; iv <= nV; iv++) {
          const v = iv / nV - 0.5;
          row.push(positions.length / 3);
          positions.push(C.x + Wd.x * v * 2 * w, C.y + Wd.y * v * 2 * w, C.z + Wd.z * v * 2 * w);
          normals.push(Nl.x, Nl.y, Nl.z);
          const c = cBlade.clone().lerp(cVein, Math.max(0, 1 - Math.abs(v) * 3) * 0.5 * (1 - u * 0.7));
          c.lerp(cLeaf, Math.pow(u, 1.25));
          colors.push(c.r, c.g, c.b);
        }
        rows.push(row);
      }
      for (let iu = 0; iu < nU; iu++) for (let iv = 0; iv < nV; iv++) {
        const a = rows[iu][iv], b = rows[iu][iv + 1], d = rows[iu + 1][iv], e = rows[iu + 1][iv + 1];
        indices.push(a, b, e, a, e, d);
        indices.push(a, e, b, a, d, e);
      }
    }
    // whisker streamers — 3 curved filaments of DIFFERENT lengths (reference's calligraphic trail,
    // not a fork of straight equal wires). Lengths ≈1.0 / 0.72 / 0.5, spread laterally, each bows.
    const cWhisk = colBody.clone().lerp(new THREE.Color(cRim), 0.5);
    const whiskSpec = [[-0.28, 1.0, 1.0], [0.05, 0.72, -1.0], [0.3, 0.5, 1.0]];   // [lateral spread, lengthMul, bendDir]
    for (const [spread, lenMul, bendDir] of whiskSpec) {
      const s = Math.sign(spread) || 1;
      const D = fN.T.clone().multiplyScalar(1.0).addScaledVector(fN.B, spread * 0.5).addScaledVector(fN.Nn, -0.16).normalize();
      const Wd = new THREE.Vector3().crossVectors(D, fN.Nn).normalize();
      const Wlen = Llen * 1.5 * lenMul;
      const B0 = fN.p.clone().addScaledVector(fN.T, fN.r * 0.5).addScaledVector(fN.B, spread * fN.r);
      const nUw = 9, rowsW = [];
      for (let iu = 0; iu <= nUw; iu++) {
        const u = iu / nUw;
        const w = leadR * 0.055 * Math.pow(1 - u, 0.7) + 0.006;
        const bend = Math.sin(u * Math.PI * 0.9) * Wlen * 0.13 * bendDir;   // a clear single curve, varied per filament
        const C = B0.clone().addScaledVector(D, u * Wlen).addScaledVector(Wd, bend).addScaledVector(fN.Nn, -Math.pow(u, 1.4) * Wlen * 0.1);
        const c = cWhisk.clone().lerp(new THREE.Color(cRim), u * 0.5);
        const r0 = positions.length / 3;
        positions.push(C.x - Wd.x * w, C.y - Wd.y * w, C.z - Wd.z * w); normals.push(fN.Nn.x, fN.Nn.y, fN.Nn.z); colors.push(c.r, c.g, c.b);
        positions.push(C.x + Wd.x * w, C.y + Wd.y * w, C.z + Wd.z * w); normals.push(fN.Nn.x, fN.Nn.y, fN.Nn.z); colors.push(c.r, c.g, c.b);
        rowsW.push(r0);
        if (iu > 0) {
          const p = rowsW[iu - 1], q = rowsW[iu];
          indices.push(p, p + 1, q + 1, p, q + 1, q);
          indices.push(p, q + 1, p + 1, p, q, q + 1);
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, side: THREE.DoubleSide, flatShading: true,   // MATTE, FLAT-SHADED paper-craft jade (reference is faceted planes, not a glossy tube)
    roughness: def.bodyRoughness ?? 0.98, metalness: 0.0,
    envMapIntensity: def.bodyEnvIntensity ?? 0.0,   // ZERO env reflection → no cool sheen band on the tube, no teal tint on the pale fan tips (Fable gate r4)
    emissive: cBody, emissiveIntensity: model.bodyGlow ?? 0.2,   // green self-illumination floor so shadowed fan facets stay GREEN under cool ambient, never drift teal (Fable gate r4)
  });
  // no fresnel rim — the reference read is matte flat-shaded, and the rim highlight was washing
  // out the dorsal stripe at grazing angles (Fable gate r3).
  bodyMat.userData.baseEmissive = cBody;
  bodyMat.userData.baseIntensity = model.bodyGlow ?? 0.1;

  const body = new THREE.Mesh(geo, bodyMat);
  body.frustumCulled = false;
  group.add(body);

  // The shared head builder paints the koi skull from `mats.bodyMat.color` — but the body mesh's
  // material.color is WHITE (its hue lives in the vertex colours), which would paint a WHITE head.
  // Hand the head a jade-COLOURED sibling. Use a DARKER emerald base: the skull lifts its dorsal
  // crown ×1.95, and on the mid-jade body hue that blows out to chartreuse/khaki on the muzzle
  // (Fable gate r2) — a darker base makes ×1.95 land back at mid-jade, keeping the whole head green.
  const headBodyMat = bodyMat.clone();
  headBodyMat.color.set(model.headColor ?? 0x1a9459);   // BODY-value mid-jade so the head reads the same green as the body (Fable gate r3: head was near-black)
  headBodyMat.roughness = 0.98; headBodyMat.envMapIntensity = 0.0;   // matte, no env sheen/olive patch

  // ── travelling-wave data (dragon.js flexes the tube each frame) ───────────────────────
  // Lateral swim added along GLOBAL x + a vertical share along y, keyed to the z position, on
  // top of the baked resting coil (baseX/baseY already hold it). ramp 0.12 head → 1 tail.
  const leadZ = frames[0].p.z, lastZ = frames[N - 1].p.z;
  const vcount = positions.length / 3;
  const baseX = new Float32Array(vcount), baseY = new Float32Array(vcount), spineZ = new Float32Array(vcount), rampA = new Float32Array(vcount);
  const denom = Math.max(0.0001, lastZ - leadZ);
  for (let v = 0; v < vcount; v++) {
    baseX[v] = positions[v * 3]; baseY[v] = positions[v * 3 + 1]; spineZ[v] = positions[v * 3 + 2];
    rampA[v] = 0.12 + 0.88 * Math.min(1, Math.max(0, (spineZ[v] - leadZ) / denom));
  }
  const rampAt = (zq) => 0.12 + 0.88 * Math.min(1, Math.max(0, (zq - leadZ) / denom));
  const bodyWave = {
    geo, count: vcount, baseX, baseY, spineZ, ramp: rampA, rampAt,
    amp: (model.bodyWaveAmp ?? 0.7) * scale,
    ampY: (model.bodyWaveAmpY ?? 0.16) * (model.bodyWaveAmp ?? 0.7) * scale,
    freq: model.bodyWaveFreq ?? 1.0,
    baseSpeed: model.bodyWaveSpeed ?? 3.2,
    breath: model.waveBreath ?? 0,
    phase: 0, spd: 0,
  };

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x203a30, emissive: cEye, emissiveIntensity: 2.2 });

  // ── attach contract (same shape koiSerpent published) ─────────────────────────────────
  const segmentAnchors = [];
  for (let i = 0; i < N; i++) { const f = frames[i]; segmentAnchors.push({ x: f.p.x, y: f.p.y, z: f.p.z, scale: f.r / leadR, r: f.r }); }
  const sa = segmentAnchors[shoulderI];
  const leadR2 = frames[0].r;
  const riderSocket = { x: frames[1].p.x, y: frames[1].p.y + leadR2 * 0.8, z: leadZ + leadR2 * 0.6 };
  const halfWidthAt = (zq) => {
    let best = frames[0].r, bd = Infinity;
    for (let i = 0; i < N; i++) { const d = Math.abs(frames[i].p.z - zq); if (d < bd) { bd = d; best = frames[i].r; } }
    return best * OVAL_W;
  };
  const attach = {
    headBase: { x: frames[0].p.x, y: bodyY + 0.04, z: leadZ - leadR2 * 0.7 },
    tailAnchor: { x: fN.p.x, y: fN.p.y, z: lastZ + fN.r * 1.0 },
    riderSocket,
    wingRoot: (side) => ({ x: sa.x + sa.r * 0.6 * side, y: sa.y + sa.r * 0.55, z: sa.z }),
    sideFinRoots: (side, pairIndex) => {
      const a = segmentAnchors[Math.min(shoulderI + pairIndex * 2, N - 1)];
      return { x: a.x + a.r * 0.7 * side, y: a.y + a.r * 0.1, z: a.z };
    },
    halfWidthAt,
    segmentAnchors,
    keelTopAt: () => bodyY + leadR,
    tailShift: 0,
  };

  const spinePoints = segmentAnchors.map((a) => new THREE.Vector3(a.x, a.y, a.z));

  return { group, attach, mats: { bodyMat: headBodyMat, eyeMat }, spineMats, spinePoints, bodyWave };
}

registerTorso('jadeSerpent', buildJadeSerpentTorso);
