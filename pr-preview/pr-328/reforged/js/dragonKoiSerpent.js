import * as THREE from 'three';
import { registerTorso } from './dragonRecipe.js';
import { applyFresnelRim } from './surface.js';

// KOI SERPENT — ONE smooth continuous river-serpent tube that UNDULATES via a
// travelling-wave vertex shader (no segments, no beads).
//
// HISTORY: v1 was a rigid loft (dead-stiff). v2 was an overlapping-SPHERE chain driven
// by parts.bodySegs — but stacked spheres read as a bead-chain / "astral worm" (the human
// hated it: "3 worms next to each other"). v3 (this) is a single swept TUBE: rings of
// vertices lofted head→fine-tail into one mesh, bent every frame by a 1-D spine wave in
// the vertex shader (transformed.x += amp·ramp·sin(freq·z + time), ramp 0 at the head →
// 1 at the tail so the head leads and the tail whips). The tail is the tapering rear of
// THIS mesh, so it is continuous by construction. dragon.js ticks parts.bodyWave.uTime.
//
// Reuses the standard attach contract so the silk-fin wings + chin-pearl mount unchanged:
// attach.wingRoot(side), attach.headBase, attach.tailAnchor, attach.halfWidthAt(z).

function buildKoiSerpentTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const spineMats = [];

  const cBody = def.body ?? 0x178a54;
  const cBelly = def.belly ?? 0xa6e2c2;
  const cShadow = model.bodyShadowColor ?? 0x0d5c3a;   // §5d deep-jade value tier (lower flank)
  const cRim = def.apexSeam ?? def.accentHue ?? 0x9ff0c8;
  const cEye = def.eye ?? 0x8ff0c2;

  const scale = model.scale ?? 1;
  // Length tracks the growth arc (jade is the LONG archetype — apex body ~8× the head).
  const lenHint = (model.neckSegments ?? 6) + (model.tailSegments ?? 10);
  const N = Math.max(10, Math.min(40, Math.round(lenHint * (model.bodyLength ?? 1.0))));  // ring count along the body
  const K = Math.max(8, Math.round(model.bodyRadial ?? 12));                              // radial resolution (roundness)
  const leadR = (model.bodyGirth ?? 0.58) * scale;
  const SPACE = model.bodySpacing ?? 1.45;
  const bodyY = 0.5;
  const OVAL_W = model.bodyOvalW ?? 1.14, OVAL_H = model.bodyOvalH ?? 0.9;   // koi cross-section: wider than tall

  // KOI girth profile: plump behind the head, tapering smoothly to a fine tail tip.
  const PEAK = 0.18;
  const girth = (t) => {
    const up = Math.min(t / PEAK, 1);
    const down = Math.max(0, (t - PEAK) / (1 - PEAK));
    return (0.70 + 0.30 * Math.sin(up * Math.PI * 0.5)) * Math.pow(1 - down, 1.3) + 0.05;
  };

  const radii = [];
  for (let i = 0; i < N; i++) radii.push(leadR * girth(N > 1 ? i / (N - 1) : 0));

  // Ring z positions (girth-spaced → the same body length the §4 head:body bands were
  // calibrated against). SPACE spreads the rings; the tube stays continuous regardless.
  const zs = [];
  let z = 0;
  for (let i = 0; i < N; i++) {
    zs.push(z);
    const rNext = radii[i + 1] ?? radii[i] * 0.8;
    z += (radii[i] + rNext) * 0.5 * SPACE;
  }
  // Pin the frame at the SHOULDER (fixed arc behind the head) so head/wing-root/pearl are
  // form-invariant (the §7 motif-drift assert); only the tail grows backward.
  const SHOULDER_ARC = (model.shoulderArc ?? 0.9) * scale;
  let shoulderI = 1;
  while (shoulderI < N - 1 && (zs[shoulderI] - zs[0]) < SHOULDER_ARC) shoulderI++;
  const zAnchor = zs[shoulderI];
  // Resting vertical S (line-of-action §6.4 inflection): neck lifts, mid dips, tail lifts.
  const arcY = (model.bodyArcY ?? 0.14) * leadR * 6;
  const yAt = (t) => bodyY - 0.02 - t * t * (leadR * 0.35) + arcY * Math.sin(t * Math.PI * 2.0);

  const zzOf = (i) => zs[i] - zAnchor;

  // ── Build ONE swept tube: N rings × K radial verts, lofted + capped ──────────────────
  const colBody = new THREE.Color(cBody), colBelly = new THREE.Color(cBelly), colShadow = new THREE.Color(cShadow);
  const positions = [], normals = [], colors = [], indices = [];
  const tmp = new THREE.Color();
  const ringBase = [];   // first vertex index of each ring
  for (let i = 0; i < N; i++) {
    ringBase.push(positions.length / 3);
    const r = radii[i];
    const cy = yAt(N > 1 ? i / (N - 1) : 0);
    const cz = zzOf(i);
    for (let j = 0; j < K; j++) {
      const a = (j / K) * Math.PI * 2;
      const cs = Math.cos(a), sn = Math.sin(a);
      const x = cs * r * OVAL_W, y = sn * r * OVAL_H;
      positions.push(x, cy + y, cz);
      // radial normal (approx; the wave shears it but the rim uses the view-space normal)
      const nx = cs / OVAL_W, ny = sn / OVAL_H; const nl = Math.hypot(nx, ny) || 1;
      normals.push(nx / nl, ny / nl, 0);
      // value ramp keyed on the vertical component (belly at the bottom of the ring)
      if (sn >= 0.05) tmp.copy(colBody);
      else if (sn >= -0.32) tmp.copy(colBody).lerp(colShadow, ((0.05 - sn) / 0.37) * 0.85);
      else tmp.copy(colShadow).lerp(colBelly, Math.min(1, (-0.32 - sn) / 0.5));
      colors.push(tmp.r, tmp.g, tmp.b);
    }
  }
  // ring-to-ring quads
  for (let i = 0; i < N - 1; i++) {
    const a0 = ringBase[i], b0 = ringBase[i + 1];
    for (let j = 0; j < K; j++) {
      const j2 = (j + 1) % K;
      const a = a0 + j, an = a0 + j2, b = b0 + j, bn = b0 + j2;
      indices.push(a, b, bn, a, bn, an);
    }
  }
  // nose cap (fan to a point ahead of ring 0) + tail cap (fan to the tail tip)
  const noseIdx = positions.length / 3;
  positions.push(0, yAt(0), zzOf(0) - radii[0] * 0.9); normals.push(0, 0, -1);
  colors.push(colBody.r, colBody.g, colBody.b);
  const tailIdx = positions.length / 3;
  positions.push(0, yAt(1), zzOf(N - 1) + radii[N - 1] * 1.4); normals.push(0, 0, 1);
  colors.push(colBody.r, colBody.g, colBody.b);
  for (let j = 0; j < K; j++) {
    const j2 = (j + 1) % K;
    indices.push(noseIdx, ringBase[0] + j2, ringBase[0] + j);              // nose fan
    indices.push(tailIdx, ringBase[N - 1] + j, ringBase[N - 1] + j2);      // tail fan
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);

  // Jade hide material — vivid mid-value body, mint belly, a green emissive floor + fresnel
  // rim so it HOLDS jade when the cool studio fill backlights it (never near-black/teal).
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true,
    roughness: def.bodyRoughness ?? 0.5, metalness: def.bodyMetalness ?? 0.02,
    envMapIntensity: def.bodyEnvIntensity ?? 0.55,
    emissive: cBody, emissiveIntensity: model.bodyGlow ?? 0.10,
  });
  applyFresnelRim(bodyMat, cRim, { intensity: model.bodyRim ?? 0.3, power: 3.0 });
  bodyMat.userData.baseEmissive = cBody;
  bodyMat.userData.baseIntensity = model.bodyGlow ?? 0.10;

  const body = new THREE.Mesh(geo, bodyMat);
  body.frustumCulled = false;   // the CPU wave swings verts past the static bounds
  group.add(body);

  // ── CPU travelling-wave data (dragon.js flexes the tube each frame) ──────────────────
  // The undulation is done on the CPU (deterministic + headless-testable, unlike an
  // onBeforeCompile uniform which never compiles in CI): each vertex's x is rewritten to
  // baseX + amp·ramp·sin(freq·z + phase), ramp 0 at the head → 1 at the tail so the head
  // leads and the tail whips. ~N·K verts (one hero dragon) → trivial per frame.
  const leadZ = zzOf(0), lastZ = zzOf(N - 1);
  const vcount = positions.length / 3;
  const baseX = new Float32Array(vcount), baseY = new Float32Array(vcount), spineZ = new Float32Array(vcount), rampA = new Float32Array(vcount);
  const denom = Math.max(0.0001, lastZ - leadZ);
  for (let v = 0; v < vcount; v++) {
    baseX[v] = positions[v * 3]; baseY[v] = positions[v * 3 + 1]; spineZ[v] = positions[v * 3 + 2];
    rampA[v] = 0.12 + 0.88 * Math.min(1, Math.max(0, (spineZ[v] - leadZ) / denom));
  }
  const bodyWave = {
    geo, count: vcount, baseX, baseY, spineZ, ramp: rampA,
    amp: (model.bodyWaveAmp ?? 0.7) * scale,
    ampY: (model.bodyWaveAmpY ?? 0.16) * (model.bodyWaveAmp ?? 0.7) * scale,
    freq: model.bodyWaveFreq ?? 1.0,
    baseSpeed: model.bodyWaveSpeed ?? 3.4,
    phase: 0, spd: 0,
  };

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x203a30, emissive: cEye, emissiveIntensity: 2.2 });

  // Attach contract -----------------------------------------------------------------
  const segmentAnchors = [];
  for (let i = 0; i < N; i++) segmentAnchors.push({ x: 0, y: yAt(N > 1 ? i / (N - 1) : 0), z: zzOf(i), scale: radii[i] / leadR, r: radii[i] });
  const leadR2 = radii[0];
  const sa = segmentAnchors[shoulderI];
  const riderSocket = { x: 0, y: yAt(0.06) + leadR2 * 0.8, z: leadZ + leadR2 * 0.6 };
  const halfWidthAt = (zq) => {
    let best = radii[0], bd = Infinity;
    for (let i = 0; i < N; i++) { const d = Math.abs(zzOf(i) - zq); if (d < bd) { bd = d; best = radii[i]; } }
    return best * OVAL_W;
  };
  const attach = {
    headBase: { x: 0, y: bodyY + 0.04, z: leadZ - leadR2 * 0.7 },
    tailAnchor: { y: yAt(1), z: lastZ + radii[N - 1] * 1.0 },
    riderSocket,
    wingRoot: (side) => ({ x: sa.r * 0.6 * side, y: sa.y + sa.r * 0.55, z: sa.z }),
    sideFinRoots: (side, pairIndex) => {
      const a = segmentAnchors[Math.min(shoulderI + pairIndex * 2, N - 1)];
      return { x: a.r * 0.7 * side, y: a.y + a.r * 0.1, z: a.z };
    },
    halfWidthAt,
    segmentAnchors,
    keelTopAt: () => bodyY + leadR,
    tailShift: 0,
  };

  // Spine polyline (§6.4 / head:body) — the ring centres, head→tail, in group space.
  const spinePoints = segmentAnchors.map((a) => new THREE.Vector3(a.x, a.y, a.z));

  return { group, attach, mats: { bodyMat, eyeMat }, spineMats, spinePoints, bodyWave };
}

registerTorso('koiSerpent', buildKoiSerpentTorso);
