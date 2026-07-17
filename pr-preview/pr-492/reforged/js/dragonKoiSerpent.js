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
  // DORSAL CREST RIBBON (§3a.B) — a slim pale-seafoam value line running crest→tail, PURE
  // diffuse vertex paint (zero emissive, zero geometry — law 12). `rb` defaults 0 → the colour
  // attribute is byte-identical when the dial is absent. Symmetric about the sagittal by angular
  // distance from the dorsal apex; the falloff weights the two straddling columns so the painted
  // centroid stays on-axis at odd K (W3). Retinted into the fan edge row (§3a.A.4) below.
  const rb = model.crestRibbon ?? 0;
  const colCrest = new THREE.Color(model.crestColor ?? 0xbdf5d0);   // P4
  const positions = [], normals = [], colors = [], indices = [];
  const tmp = new THREE.Color();
  const ringBase = [];   // first vertex index of each ring
  for (let i = 0; i < N; i++) {
    ringBase.push(positions.length / 3);
    const r = radii[i];
    const t = N > 1 ? i / (N - 1) : 0;
    const cy = yAt(t);
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
      const dA = Math.abs(a - Math.PI / 2);              // angular distance from the dorsal apex
      if (rb > 0 && dA < 0.38) {
        const taper = t < 0.72 ? 1 : Math.max(0.35, 1 - (t - 0.72) * 2.2);   // narrows into the fan root
        tmp.lerp(colCrest, rb * 0.85 * taper * Math.pow(1 - dA / 0.38, 0.6));
      }
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

  // ── CAUDAL RIVER-VEIL (CP3 apex) — the documented "veil (finned) tail" made LITERAL ──
  // A MEDIAN (sagittal-plane) dorsal+ventral fin flaring over the rear tube. It lives in
  // THIS SAME geometry, so its verts join the bodyWave arrays below and WHIP with the tail
  // for free (zero new tick). Being in the x=0 plane it is EDGE-ON to the rear-chase cam →
  // silhouette-safe; it reads on side / rear-¾ and flickers into view as the tail sweeps.
  // Height clamped ≤ the forward girth (leadR). Both windings so the single-sided body
  // material shows it from either flank. GREEN body/belly ramp only — zero new emissive.
  // ── MOON-TAIL (CP3 glow-up) — the "Koi Lyre" silhouette ──────────────────────────────
  // The tall fan-V above is now ANSWERED below by a veiltail CRESCENT: a modest median
  // dorsal RIDGE + TWIN ventral lobes canted ±out so they splay down-and-out INTO the rear
  // silhouette (the owner relaxed the frozen-outline rule for this pass). All of it lives in
  // THIS tube geometry, emitted before `vcount`, so every lobe WHIPS laterally with the body
  // wave for free — at rear-chase the lower crescents visibly swim. Deep-emerald root → pale-
  // jade silk edge (the fin-ray language), both windings for the single-sided body material.
  const moonTail = model.moonTail ?? model.veilTail ?? 0;
  const cb = model.caudalBloom ?? 0;
  if (cb > 0) {
    // ══ THE GRAND FAN-BLOOM (§3a.A) — the hero ══════════════════════════════════════════
    // A 3-blade split caudal fan — twin canted LYRE crescents (the dominant pair) + a MEDIAN
    // dorsal veil — INDEPENDENTLY station-sampled (M=16, decoupled from the ring count) so the
    // trailing split resolves into countable prongs; it REPLACES the shipped moonTail strips.
    // Emitted into THIS tube's arrays BEFORE the wave snapshot (~line 210), so every fan vert
    // rides bodyWave for free — the proven moonTail trick. `cb` defaults 0 → this branch is
    // skipped and the old strips (below) build byte-identically; the height coefficients are
    // continuous with the old strips at cb→0 so nothing jumps at the ladder's f0→f1 step.
    // ⚠ Silhouette growth here (crescent height ×~1.67 at apex) is OWNER-APPROVAL-REQUIRED (§3a.7).
    const vStartT = 0.5;                          // fan spans the rear ~50% of the body
    const M = 16;                                 // stations across the fan (≥4/feature: the split spans ~3–4)
    const cant = 0.9 - 0.12 * cb;                 // opens the fan wider at apex
    const sinC = Math.sin(cant), cosC = Math.cos(cant);
    const cPale = new THREE.Color(cRim);
    const cRoot = colBody.clone().lerp(colShadow, 0.72);   // deeper emerald root (Fable gate r1: restore the DARK tier so the fan isn't a pale wash)
    const cEdge = colBody.clone().lerp(cPale, 0.78);
    if (rb > 0) cEdge.lerp(colCrest, rb * 0.5);   // the crest ribbon pours into the fan's pale edge (§3a.A.4)
    const cP7 = new THREE.Color(0x9ff0c8), cP5 = new THREE.Color(0x116b45);
    // sample the tube station (cy/cz/rW/rH) by interpolating the two bracketing rings
    const stationOf = (along) => {
      const tt = vStartT + along * (1 - vStartT);
      const fi = Math.min(N - 1, Math.max(0, tt * (N - 1)));
      const i0 = Math.min(N - 2, Math.floor(fi)), i1 = i0 + 1, f = fi - i0;
      const lp = (aa, bb) => aa + (bb - aa) * f;
      return {
        cy: lp(yAt(i0 / (N - 1)), yAt(i1 / (N - 1))),
        cz: lp(zzOf(i0), zzOf(i1)),
        rW: lp(radii[i0] * OVAL_W, radii[i1] * OVAL_W),
        rH: lp(radii[i0] * OVAL_H, radii[i1] * OVAL_H),
      };
    };
    // 3 koi-fin RAYS running root→tip: mask ≈1 on a ray crest, ≈0 in the web between
    const rayMaskAt = (along) => {
      let m = 0;
      for (let r = 0; r < 3; r++) { const d = (along - (0.20 + 0.28 * r)) / 0.09; m += Math.exp(-d * d); }
      return Math.min(1, m);
    };
    // Emit one blade as an M×3 grid (root → mid → edge rows) = 2 height-quads across, both
    // windings (the single-sided body material shows both flanks). rootAt gives the blade root
    // ON the tube surface each station (welded by construction); dir is the unit root→edge
    // growth; nrm is the in-plane normal the mid row carves INWARD along on the webs (crescents
    // only); faceN is the flat lighting normal. Value: dark root → banded mid (pale ray crest /
    // emerald web) → pale edge = core→bloom→dark on the hero element.
    const emitBlade = (rootAt, dir, nrm, hCoef, carve, faceN) => {
      const rowRoot = [], rowMid = [], rowEdge = [];
      for (let m = 0; m < M; m++) {
        const along = m / (M - 1);
        const st = stationOf(along);
        const flare = Math.sin(Math.min(1, Math.pow(along, 0.62)) * Math.PI * 0.99);   // crescent envelope — broadened so the trailing region keeps mass for a 2nd prong
        const wob = 1 + 0.14 * Math.sin(along * Math.PI * 2.6);                        // scalloped edge (shipped)
        const split = 1 - cb * 0.72 * Math.exp(-Math.pow((along - 0.78) / 0.070, 2));   // ONE deep, SHARP V per blade → two countable prongs (Fable gate r1: the notch must read)
        const h = leadR * hCoef * moonTail * flare * wob * split;
        const rm = rayMaskAt(along);
        const root = rootAt(st);
        const ex = root.x + dir.x * h, ey = root.y + dir.y * h;
        const midInset = -cb * 0.12 * h * (1 - rm) * carve;   // webs recede, crests stay AT the envelope (outline never grows)
        const mx = (root.x + ex) * 0.5 + nrm.x * midInset;
        const my = (root.y + ey) * 0.5 + nrm.y * midInset;
        const cMidV = colBody.clone().lerp(cP7, rm * 0.55).lerp(cP5, (1 - rm) * 0.82);
        rowRoot.push(positions.length / 3); positions.push(root.x, root.y, st.cz); normals.push(faceN[0], faceN[1], faceN[2]); colors.push(cRoot.r, cRoot.g, cRoot.b);
        rowMid.push(positions.length / 3);  positions.push(mx, my, st.cz);         normals.push(faceN[0], faceN[1], faceN[2]); colors.push(cMidV.r, cMidV.g, cMidV.b);
        rowEdge.push(positions.length / 3); positions.push(ex, ey, st.cz);         normals.push(faceN[0], faceN[1], faceN[2]); colors.push(cEdge.r, cEdge.g, cEdge.b);
      }
      const stripRow = (lo, hi) => {
        for (let m = 0; m < M - 1; m++) {
          const a = lo[m], b = hi[m], c = lo[m + 1], d = hi[m + 1];
          indices.push(a, b, d, a, d, c);        // front winding
          indices.push(a, d, b, a, c, d);        // back winding (shows from the other flank)
        }
      };
      stripRow(rowRoot, rowMid);
      stripRow(rowMid, rowEdge);
    };
    // median dorsal VEIL — x=0 plane, sagittal-symmetric: NO displacement carve (any x-offset
    // breaks the symmetry, and it is edge-on to the exact-rear cam anyway), value bands only.
    emitBlade((st) => ({ x: 0, y: st.cy + st.rH }), { x: 0, y: 1 }, { x: 0, y: 0 },
      0.68 + 0.44 * cb, 0, [1, 0, 0]);
    // twin ventral LYRE crescents (the DOMINANT pair), canted ±out (the fan that shows in silhouette)
    for (const s of [-1, 1]) {
      emitBlade((st) => ({ x: s * st.rW * 0.32, y: st.cy - st.rH * 0.7 }),
        { x: s * sinC, y: -cosC }, { x: cosC, y: s * sinC },
        1.55 + 1.05 * cb, 1, [cosC, s * sinC, 0]);
    }
  } else if (moonTail > 0) {
    const vStartT = 0.5;                         // moon-tail spans the rear ~50% of the body
    const maxH = leadR * 1.35 * moonTail;
    const cant = 0.9;                            // ~52° off vertical → twin lobes splay down-and-out
    const sinC = Math.sin(cant), cosC = Math.cos(cant);
    const cPale = new THREE.Color(cRim);         // apexSeam pale-jade (the fin-tip silk hue)
    const cRoot = colBody.clone().lerp(colShadow, 0.55), cEdge = colBody.clone().lerp(cPale, 0.78);
    const baseD = [], edgeD = [], rootL = [], edgeL = [], rootR = [], edgeR = [];
    for (let i = 0; i < N; i++) {
      const t = N > 1 ? i / (N - 1) : 0;
      if (t < vStartT) { baseD.push(-1); edgeD.push(-1); rootL.push(-1); edgeL.push(-1); rootR.push(-1); edgeR.push(-1); continue; }
      const along = (t - vStartT) / (1 - vStartT);                         // 0 at moon-tail start → 1 at tail tip
      const flare = Math.sin(Math.min(1, Math.pow(along, 0.5)) * Math.PI * 0.96);   // crescent envelope: swells past mid, sweeps to a point
      const wob = 1 + 0.14 * Math.sin(along * Math.PI * 2.6);              // scalloped trailing edge (a flowing veiltail, not a fence)
      const cy = yAt(t), cz = zzOf(i), rW = radii[i] * OVAL_W, rH = radii[i] * OVAL_H;
      // dorsal median ridge (modest — the tail's top edge)
      const hD = maxH * 0.5 * flare * wob;
      baseD.push(positions.length / 3); positions.push(0, cy + rH, cz); normals.push(0, 1, 0); colors.push(cRoot.r, cRoot.g, cRoot.b);
      edgeD.push(positions.length / 3); positions.push(0, cy + rH + hD, cz); normals.push(0, 1, 0); colors.push(cEdge.r, cEdge.g, cEdge.b);
      // twin ventral crescent lobes, canted ±out (the veiltail that shows in silhouette)
      const hL = maxH * 1.15 * flare * wob;
      for (const s of [-1, 1]) {
        const xr = s * rW * 0.32, yr = cy - rH * 0.7;
        const xe = xr + s * hL * sinC, ye = yr - hL * cosC;
        const root = s < 0 ? rootL : rootR, edge = s < 0 ? edgeL : edgeR;
        root.push(positions.length / 3); positions.push(xr, yr, cz); normals.push(cosC, s * sinC, 0); colors.push(cRoot.r, cRoot.g, cRoot.b);
        edge.push(positions.length / 3); positions.push(xe, ye, cz); normals.push(cosC, s * sinC, 0); colors.push(cEdge.r, cEdge.g, cEdge.b);
      }
    }
    const stripBoth = (bArr, eArr) => {
      for (let i = 0; i < N - 1; i++) {
        if (bArr[i] < 0 || bArr[i + 1] < 0) continue;
        const a = bArr[i], b = eArr[i], c = bArr[i + 1], d = eArr[i + 1];
        indices.push(a, b, d, a, d, c);          // front winding
        indices.push(a, d, b, a, c, d);          // back winding (shows from the other flank)
      }
    };
    stripBoth(baseD, edgeD);
    stripBoth(rootL, edgeL);
    stripBoth(rootR, edgeR);
  }

  // NOTE: the "lateral pearl-line" glow-scutes were removed. They required a SECOND material
  // (a geometry group) on the body mesh, which makes mesh.material an ARRAY — and every
  // procedural dispose path (`preview.js`, `dragon.js`) assumes a SINGLE material and calls
  // `o.material.dispose()`, which throws on an array (it broke shop equip + close). Keeping
  // the koi body single-material matches every existing assumption; the pearl-light read is
  // carried by the pearl + the fin-tip dew gems instead. (They barely read from behind anyway.)

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
  // rampAt(z): the per-vertex wave ramp (0.12 at the head → 1 at the tail), hoisted so a
  // waveRider mesh (the lyre gems, §4.5) rides the SAME formula as the tube — two copies of the
  // wave math is the trail-detach bug.
  const rampAt = (zq) => 0.12 + 0.88 * Math.min(1, Math.max(0, (zq - leadZ) / denom));
  const bodyWave = {
    geo, count: vcount, baseX, baseY, spineZ, ramp: rampA, rampAt,
    amp: (model.bodyWaveAmp ?? 0.7) * scale,
    ampY: (model.bodyWaveAmpY ?? 0.16) * (model.bodyWaveAmp ?? 0.7) * scale,
    freq: model.bodyWaveFreq ?? 1.0,
    baseSpeed: model.bodyWaveSpeed ?? 3.4,
    breath: model.waveBreath ?? 0,   // GLOW-UP: slow breathing meander — the S periodically deepens like a koi coasting
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
