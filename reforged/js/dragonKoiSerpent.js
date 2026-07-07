import * as THREE from 'three';
import { registerTorso } from './dragonRecipe.js';
import { applyFresnelRim } from './surface.js';

// KOI SERPENT — a continuous, UNDULATING eastern river-serpent body for jade.
//
// WHY THIS EXISTS: jade was built on the `serpent` LOFT torso — one rigid mesh that
// emits no spine segments, so nothing in the rig can bend it (it read dead-stiff in
// motion), with the fat `sweptTail` bolted on as a SECOND mesh (the visible seam /
// "disjointed tail"). This body is instead a chain of heavily-overlapping smooth
// sections that merge into ONE continuous jade tube tapering to a fine tail — and it
// publishes `bodySegs`, so the shipped lead-first travelling wave (dragon.js) slithers
// it head-to-tail. The TAIL is just the tapering rear of this same chain, so it can
// never detach from the body. No crystal rings/finlets/core sprites — jade is a clean,
// restrained koi (law 12: the chin-pearl is the ONE bloom).
//
// Reuses the standard attach contract so the silk-fin wings + chin-pearl mount exactly
// as before: attach.wingRoot(side), attach.headBase, attach.tailAnchor, attach.halfWidthAt(z).

function buildKoiSerpentTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const spineMats = [];

  const cBody = def.body ?? 0x178a54;
  const cBelly = def.belly ?? 0xa6e2c2;
  const cShadow = model.bodyShadowColor ?? 0x0d5c3a;   // §5d deep-jade value tier (lower flank)
  const cRim = def.apexSeam ?? def.accentHue ?? 0x9ff0c8;
  const cEye = def.eye ?? 0x8ff0c2;

  const scale = model.scale ?? 1;
  // Length tracks the growth arc: forms set neck/tail segment counts; a longer chain =
  // a longer serpent (jade is the LONG one — apex body ~8× the head, vs a winged
  // dragon's ~5×). bodyLength scales the section count; bodySpacing spreads them.
  const lenHint = (model.neckSegments ?? 6) + (model.tailSegments ?? 10);
  const N = Math.max(10, Math.min(28, Math.round(lenHint * (model.bodyLength ?? 1.0))));
  const leadR = (model.bodyGirth ?? 0.58) * scale;      // lead cross-section radius
  const SPACE = model.bodySpacing ?? 1.45;              // >1 spreads sections (still overlapping) → a longer serpent
  const bodyY = 0.5;

  // KOI girth profile: plump behind the head (front third), tapering smoothly to a fine
  // tail tip — the thickness the old fixed `tailGirth` was faking, now a real taper.
  const PEAK = 0.18;                                     // girth peaks ~18% back
  const girth = (t) => {
    const up = Math.min(t / PEAK, 1);
    const down = Math.max(0, (t - PEAK) / (1 - PEAK));
    return (0.70 + 0.30 * Math.sin(up * Math.PI * 0.5)) * Math.pow(1 - down, 1.3) + 0.06;
  };

  const radii = [];
  for (let i = 0; i < N; i++) radii.push(leadR * girth(N > 1 ? i / (N - 1) : 0));

  // Overlapping z positions — each step spreads by the local radius × SPACE. SPACE<2
  // keeps consecutive sections overlapping into a CONTINUOUS tube; higher = longer.
  const zs = [];
  let z = 0;
  for (let i = 0; i < N; i++) {
    zs.push(z);
    const rNext = radii[i + 1] ?? radii[i] * 0.8;
    z += (radii[i] + rNext) * 0.5 * SPACE;
  }
  // FRAME PIN — anchor the coordinate frame at the SHOULDER (a fixed arc-distance behind
  // the head), NOT the chain midpoint. The head + wing-root + chin-pearl then sit at a
  // form-INVARIANT z while only the tail grows backward — so the §7 motif-drift assert
  // holds across the growth arc (a centre pin drifts every anchor as the body lengthens).
  const SHOULDER_ARC = (model.shoulderArc ?? 0.9) * scale;
  let shoulderI = 1;
  while (shoulderI < N - 1 && (zs[shoulderI] - zs[0]) < SHOULDER_ARC) shoulderI++;
  const zAnchor = zs[shoulderI];
  // Resting vertical S (line-of-action): neck lifts, mid dips, tail lifts — a gentle
  // koi S baked into the base Y so the spine polyline has the §6.4 inflection AND the
  // still pose reads as a serpent, not a straight rod. Kept low (never into the sightline).
  const arcY = (model.bodyArcY ?? 0.14) * leadR * 6;
  const yAt = (t) => bodyY - 0.02 - t * t * (leadR * 0.35) + arcY * Math.sin(t * Math.PI * 2.0);

  // Jade hide: vivid mid-value body, pale-mint belly, deep-jade lower-flank shadow tier.
  // A faint GREEN emissive floor + green fresnel rim so the body HOLDS jade when the cool
  // studio fill backlights it (the same fix the fins needed — never drift near-black/teal).
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true,
    roughness: def.bodyRoughness ?? 0.5, metalness: def.bodyMetalness ?? 0.02,
    envMapIntensity: def.bodyEnvIntensity ?? 0.55,
    emissive: cBody, emissiveIntensity: model.bodyGlow ?? 0.10,
  });
  applyFresnelRim(bodyMat, cRim, { intensity: model.bodyRim ?? 0.30, power: 3.0 });
  bodyMat.userData.baseEmissive = cBody;
  bodyMat.userData.baseIntensity = model.bodyGlow ?? 0.10;
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x203a30, emissive: cEye, emissiveIntensity: 2.2 });

  // Per-vertex jade value ramp on a unit-ish sphere, keyed on the vertical normal:
  // dorsal → body, lower flank → deep-jade shadow, ventral → mint belly (smooth blends).
  const colBody = new THREE.Color(cBody), colBelly = new THREE.Color(cBelly), colShadow = new THREE.Color(cShadow);
  function paint(geo, r) {
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const tmp = new THREE.Color();
    for (let v = 0; v < pos.count; v++) {
      const ny = pos.getY(v) / Math.max(0.0001, r);      // -1 (belly) .. +1 (dorsal)
      if (ny >= 0.05) {
        tmp.copy(colBody);
      } else if (ny >= -0.32) {
        const k = (0.05 - ny) / 0.37;                    // body → deep-jade down the flank
        tmp.copy(colBody).lerp(colShadow, k * 0.85);
      } else {
        const k = Math.min(1, (-0.32 - ny) / 0.5);       // deep-jade → mint belly
        tmp.copy(colShadow).lerp(colBelly, k);
      }
      cols[v * 3] = tmp.r; cols[v * 3 + 1] = tmp.g; cols[v * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  }

  const bodySegs = [];
  const segmentAnchors = [];
  for (let i = 0; i < N; i++) {
    const t = N > 1 ? i / (N - 1) : 0;
    const r = radii[i];
    const zz = zs[i] - zAnchor;
    const segY = yAt(t);
    const seg = new THREE.Group();
    seg.position.set(0, segY, zz);
    seg.userData.baseY = segY;

    // Smooth koi cross-section: a touch wider than tall + elongated along the body so
    // neighbours overlap into a flowing tube (not a bead necklace).
    const sphere = new THREE.SphereGeometry(r, 8, 6);
    paint(sphere, r);
    const body = new THREE.Mesh(sphere, bodyMat);
    body.scale.set(1.05, 0.92, 1.18);
    seg.add(body);

    group.add(seg);
    bodySegs.push(seg);
    segmentAnchors.push({ x: 0, y: segY, z: zz, scale: r / leadR, r });
  }

  const leadZ = zs[0] - zAnchor;
  const lastZ = zs[N - 1] - zAnchor;
  const leadR2 = radii[0];

  // Attach contract -----------------------------------------------------------------
  // Head sits just ahead of the lead section; the koiSkull's own neck-blend bridges the
  // small overlap. Wings mount on the upper flank of the shoulder section (z≈0, the pinned
  // frame origin) so the fans hold a form-invariant position. Rider low on the front third.
  const sa = segmentAnchors[shoulderI];
  const riderSocket = { x: 0, y: yAt(0.06) + leadR2 * 0.8, z: leadZ + leadR2 * 0.6 };

  const halfWidthAt = (zq) => {
    // nearest-section radius (accounting for the x-scale of the ellipsoid) for flank layers.
    let best = radii[0], bd = Infinity;
    for (let i = 0; i < N; i++) { const d = Math.abs((zs[i] - zMid) - zq); if (d < bd) { bd = d; best = radii[i]; } }
    return best * 1.05;
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

  // Published spine polyline (§6.4 line-of-action / head:body asserts) — the segment
  // centres from head to tail, in group space.
  const spinePoints = segmentAnchors.map((a) => new THREE.Vector3(a.x, a.y, a.z));

  return { group, attach, mats: { bodyMat, eyeMat }, spineMats, bodySegs, spinePoints };
}

registerTorso('koiSerpent', buildKoiSerpentTorso);
