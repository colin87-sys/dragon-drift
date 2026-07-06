import * as THREE from 'three';
import { registerTorso } from './dragonRecipe.js';
import { makeGlowTexture } from './util.js';
import { applyFresnelRim } from './surface.js';
import { featherGeo, hexRgb } from './dragonParts.js';
import { seg } from './modelDetail.js';
import { sweepProfile } from './dragonSweep.js';

// Torso modules — the dragon's BODY PLAN, the first part extracted behind the
// recipe registry (dragonRecipe.js). A body plan is now DATA: a profile object
// (cross-section stations + neck + fairings + mount points) fed to one generic
// loft. The arrowhead drake and a long serpent are two profiles of the same
// builder, so a genuinely different skeleton drops in without touching the
// wing / tail / head code.
//
// THE ATTACH CONTRACT
// Every torso build returns { group, attach }. `attach` is how the rest of the
// model mounts limbs without knowing which body it's on:
//   attach.wingRoot(side) → {x,y,z}  where a wing pivot sits (mirrored by side)
//   attach.headBase       → {x,y,z}  where the head group is placed
//   attach.tailAnchor     → {y,z}    where the tail group roots
//   attach.keelTopAt(z)   → number   crest height (incl. the torso y-offset) for
//                                      running a spine / ridges down the back
//   attach.tailShift      → number   z-shift already folded into tailAnchor
// The arrow profile reports exactly the constants the legacy builder hard-coded,
// so the shipped roster is pixel-for-pixel unchanged.

const TORSO_Y = 0.2; // the torso mesh sits at y=0.2; spine math adds this in.

// Shared cross-section: keel apex on top, widest at mid-height, rounded belly.
// Ordered CCW looking toward -z so face winding points outward. (Identical to
// the loft the redesign shipped — every membrane dragon reuses this section.)
function bladeRing(w, top, bot) {
  return [
    [0, top], [-w * 0.70, top * 0.30], [-w, -bot * 0.10], [-w * 0.62, -bot * 0.64],
    [0, -bot], [w * 0.62, -bot * 0.64], [w, -bot * 0.10], [w * 0.70, top * 0.30],
  ];
}

// Generic lofted torso from a profile's [z, halfWidth, keelTop, belly] stations.
// `stretch` lengthens ONLY the after-body (stations behind zHold move toward +z)
// so the head/shoulder/wing-root attach zone stays pinned — a longer, sleeker
// drake without fattening it.
function buildTorsoGeometry(profile, stretch = 1) {
  const { stations, zHold, ring = bladeRing } = profile;
  const M = 8;
  const zAt = (z) => (z > zHold ? zHold + (z - zHold) * stretch : z);
  const verts = [];
  for (const [z, w, top, bot] of stations)
    for (const [x, y] of ring(w, top, bot)) verts.push(x, y, zAt(z));
  const idx = [];
  for (let s = 0; s < stations.length - 1; s++) {
    const a0 = s * M, b0 = (s + 1) * M;
    for (let m = 0; m < M; m++) {
      const n = (m + 1) % M;
      idx.push(a0 + m, b0 + m, a0 + n, a0 + n, b0 + m, b0 + n);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// sweptLoft geometry: the SAME loft, but the cross-section is a resampled closed
// Catmull-Rom (rounder at ULTRA, byte-identical at HIGH). Drop-in for the `geoFn`
// arg of buildTorso below — see dragonSweep.js#sweepProfile. (ARROW/SERPENT omit
// `ring`, so resolve the shared bladeRing default here.)
function buildSweptTorsoGeometry(profile, stretch = 1) {
  return sweepProfile({ ...profile, ring: profile.ring || bladeRing }, stretch);
}

// Top-of-keel height at a body z, interpolated over the profile's keel line.
function keelTopFor(profile, z) {
  const pts = profile.keel;
  if (z <= pts[0][0]) return pts[0][1];
  if (z >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    if (z <= pts[i + 1][0]) {
      const t = (z - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
    }
  }
  return pts[pts.length - 1][1];
}

// Body HALF-WIDTH at a body z, interpolated over the profile's stations (column 1
// is halfWidth). The flank counterpart to keelTopFor — lets a surface-following
// decoration (e.g. the shingle scale run) sit on the widest part of the body.
function halfWidthFor(profile, z) {
  const s = profile.stations;
  if (z <= s[0][0]) return s[0][1];
  if (z >= s[s.length - 1][0]) return s[s.length - 1][1];
  for (let i = 0; i < s.length - 1; i++) {
    if (z <= s[i + 1][0]) {
      const t = (z - s[i][0]) / (s[i + 1][0] - s[i][0]);
      return s[i][1] + (s[i + 1][1] - s[i][1]) * t;
    }
  }
  return s[s.length - 1][1];
}

// Pass 2 shoulder skinning — weight each body vertex to a 3-bone skeleton
// [root=0, shoulderL=1, shoulderR=2]. Verts near a wing root get a CAPPED, smoothly
// decaying weight to that side's shoulder bone (the rest stays on the static root),
// so the torso surface bulges with the beat. Side-gated at the midline so the belly
// never drags sideways. Weights sum to 1 (L3); the orchestrator binds the skeleton.
const _sstep = (e0, e1, x) => { let t = (x - e0) / (e1 - e0); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
function writeShoulderWeights(geo, wrR, wrL) {
  const pos = geo.attributes.position;
  const si = new Uint16Array(pos.count * 4);
  const sw = new Float32Array(pos.count * 4);
  const MAXW = 0.34, R = 0.95;                       // cap (a bulge, not a tear) + reach
  for (let i = 0; i < pos.count; i++) {
    const gx = pos.getX(i), gy = pos.getY(i) + TORSO_Y, gz = pos.getZ(i);   // group space
    const right = gx >= 0, w = right ? wrR : wrL;
    const dx = gx - w.x, dy = gy - w.y, dz = gz - w.z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const gate = _sstep(0.04, 0.22, Math.abs(gx));    // midline/belly → 0 (no sideways drag)
    const wS = MAXW * _sstep(R, R * 0.32, d) * gate;  // near a root → up to MAXW, far → 0
    si[i * 4 + 1] = right ? 2 : 1;                     // shoulderR=2 / shoulderL=1 (root=0 implicit)
    sw[i * 4] = 1 - wS; sw[i * 4 + 1] = wS;
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
}

// Assemble torso mesh + wing-root fairings + neck chain into one group, and
// publish the attach contract. bodyMat is the dragon's shared body material;
// the torso clones it DoubleSide so the closed loft is robust to face winding.
function buildTorso(profile, def, model, bodyMat, geoFn = buildTorsoGeometry, opts = {}) {
  const group = new THREE.Group();
  const stretch = model.bodyStretch ?? 1;
  // bodyMesh:false — the UNIFIED HULL build. The torso publishes the full attach
  // contract (neck + mount points + materials + the loft RECIPE) but adds NO body
  // loft mesh and NO wing fairings: the hull builder (dragonUnifiedHull.js) grows
  // the body surface itself, welded to the wing membrane in one continuous skin.
  const bodyMesh = opts.bodyMesh !== false;

  // Broaden the SHOULDER region (additive, default = unchanged) so the wing roots
  // feel anatomically supported. Scales only the shoulder-zone station half-widths
  // and flows through the loft + attach.halfWidthAt; other dragons stay byte-identical.
  const shoulderW = model.shoulderWidthScale ?? 1;
  if (shoulderW !== 1) {
    profile = { ...profile, stations: profile.stations.map(([z, w, t, b]) =>
      [z, (z >= -1.7 && z <= 0.0) ? w * shoulderW : w, t, b]) };
  }

  const torsoMat = bodyMat.clone();
  torsoMat.side = THREE.DoubleSide;
  const torsoGeo = bodyMesh ? geoFn(profile, stretch) : null;
  // POSTURE keel-bend (gate r5 dir 11): spineCurl must bend the VISIBLE body, not just the
  // neck chain + the spinePoints metadata — otherwise the side silhouette's back is a dead
  // flat line (STRAIGHT SPINE). Overlay the same S-wave the spinePoints use (sin over the
  // tail→shoulder z-run) onto the loft verts so the chest drops and the after-body/tail
  // counter-arcs, giving a clear inflection. Additive: spineCurl 0 → geometry byte-identical.
  const sc = model.spineCurl ?? 0;
  if (torsoGeo && sc) {
    torsoGeo.computeBoundingBox();
    const bb = torsoGeo.boundingBox, z0 = bb.min.z, z1 = bb.max.z, dz = (z1 - z0) || 1;
    const amp = sc * 0.24;                       // proud upright S at apex (sc 0.95), curled whelp when <0
    const pos = torsoGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const f = (pos.getZ(i) - z0) / dz;         // 0 tail(+later) → 1 shoulder; matches spinePoints' f
      pos.setY(i, pos.getY(i) + amp * Math.sin(f * Math.PI * 2));
    }
    pos.needsUpdate = true;
    torsoGeo.computeVertexNormals();
  }
  // BELLY PAINT (opt-in model.bellyPaint): vertex-paint the ventral torso with
  // def.belly (a cream two-tone underside — the Charizard read) while the dorsal keeps
  // the body colour. Additive; default off → torsoMat stays single-colour byte-identical.
  if (torsoGeo && model.bellyPaint && def.belly != null) {
    torsoGeo.computeBoundingBox();
    const bbB = torsoGeo.boundingBox, y0 = bbB.min.y, dyB = (bbB.max.y - bbB.min.y) || 1;
    const pos = torsoGeo.attributes.position;
    const cBack = new THREE.Color(def.body ?? 0xffffff), cBelly = new THREE.Color(def.belly), cM = new THREE.Color();
    const cols = [];
    for (let i = 0; i < pos.count; i++) {
      const ny = (pos.getY(i) - y0) / dyB;         // 0 belly → 1 back
      let t = Math.min(1, Math.max(0, (ny - 0.34) / 0.22)); t = t * t * (3 - 2 * t);   // ventral ~35% = belly, smooth blend up the flank
      cM.copy(cBelly).lerp(cBack, t);
      cols.push(cM.r, cM.g, cM.b);
    }
    torsoGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    torsoMat.vertexColors = true;
    torsoMat.color.set(0xffffff);                  // the vertex colours carry the hue now
  }
  // Pass 2 (opt-in): weight the body verts near each wing root to that side's
  // shoulder bone so the torso surface itself bulges with the wingbeat. The bones
  // live in the wing mounts → the orchestrator binds this mesh once both exist.
  if (opts.skinShoulders && torsoGeo) {
    const wrFor = (side) => ({
      x: profile.wingRoot.x * shoulderW * side,
      y: profile.wingRoot.y + (model.wingRootOffset?.y ?? 0),
      z: profile.wingRoot.z + (model.wingRootOffset?.z ?? 0),
    });
    writeShoulderWeights(torsoGeo, wrFor(1), wrFor(-1));
  }
  let torso = null;
  if (bodyMesh) {
    torso = opts.skinShoulders ? new THREE.SkinnedMesh(torsoGeo, torsoMat) : new THREE.Mesh(torsoGeo, torsoMat);
    if (opts.skinShoulders) { torso.frustumCulled = false; torso.name = 'torsoShoulderSkin'; }
    torso.position.y = TORSO_Y;
    group.add(torso);
  }

  // Smooth fairings where the wings attach, so they never look bolted on. The skinned
  // shoulder BRIDGE (dragonWings.js) replaces this STATIC blob with a continuous
  // body-deltoid that follows the wing — so a bridged dragon SKIPS the fairing. The
  // unified HULL subsumes the shoulder entirely (the fleshy arm grows from the loft),
  // so a body-less hull torso SKIPS the fairing too.
  // Otherwise, when the shoulder is widened (shoulderWidthScale) the fairing rides OUT
  // with it (radius + x) so it stays a proud muscular shoulder mound, not buried.
  const bridged = def.parts && def.parts.wings === 'skinnedMembraneBridge';
  const fr = profile.fairing;
  const fScale = shoulderW;
  // squareShoulders (additive, default off): a beveled BLOCK scapula plate instead of
  // the rounded sphere fairing — the ANVIL shoulder read (gate: "two round balls").
  // Chamfered top edge (a scaled cylinder cross-section reads as a bevelled block from
  // rear chase). Default keeps the shipped sphere byte-identical.
  const squareShoulder = !!model.squareShoulders;
  if (bodyMesh && !bridged) for (const s of [-1, 1]) {
    let root;
    if (squareShoulder) {
      // a BEVELED squared scapula (a 6-sided prism reads as a chamfered muscular block
      // from rear chase — never a bare flat cuboid, gate r5 dir 1), broad so the anvil
      // shoulder line reads in the rear silhouette.
      const g = new THREE.CylinderGeometry(fr.r * fScale * 1.15, fr.r * fScale * 1.3, fr.r * fScale * 2.4, 6, 1);
      g.rotateZ(Math.PI / 2);                              // lie the prism along the flank (length in x)
      root = new THREE.Mesh(g, bodyMat);
      root.scale.set(1.0, 0.92, 1.15);
      root.rotation.set(0.0, s * 0.14, s * -0.22);         // cant up-and-out (chamfer read)
      root.position.set(s * fr.pos[0] * fScale * 1.1, fr.pos[1] + fr.r * 0.22, fr.pos[2]);
    } else {
      root = new THREE.Mesh(new THREE.SphereGeometry(fr.r * fScale, seg(9), seg(7)), bodyMat);
      root.scale.set(fr.scale[0], fr.scale[1], fr.scale[2]);
      root.position.set(s * fr.pos[0] * fScale, fr.pos[1], fr.pos[2]);
    }
    group.add(root);
  }

  // Neck chain — slim spheres bridging the torso's neck cap to the head. A
  // hull-grown creature passes opts.neck:false to suppress it (the neck becomes a
  // continuous hull extension instead); the `n &&` guard also makes a profile with
  // no neck spec safe. Default unchanged → the roster stays byte-identical.
  // POSTURE / spine-curl dial (§4/§6 — the one genuinely-missing proportion dial).
  // spineCurl < 0 = a curled, chest-down whelp (neck + head droop); spineCurl > 0 =
  // a proud upright S (neck arcs up). Additive + default 0 → the roster is
  // byte-identical. Applied to the neck chain here + folded into headBase below,
  // and published as parts.spinePoints (the line-of-action assert reads it).
  const spineCurl = model.spineCurl ?? 0;
  const n = profile.neck;
  const neckSegs = model.neckSegments;
  const postureAmp = (n?.yStep ?? 0.08) * (neckSegs || 4) * 0.9;
  const neckArc = (i) => spineCurl * postureAmp * ((i + 1) / Math.max(1, neckSegs)); // grows head-ward
  // neckBlend (additive, default 1 = byte-identical): thickens + elongates the neck
  // spheres so a dense chain fuses into a smooth taper instead of visible beads.
  const nb = model.neckBlend ?? 1;
  if (n && opts.neck !== false) for (let i = 0; i < neckSegs; i++) {
    const neck = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(n.rBase - i * n.rStep, n.rMin) * nb, seg(9), seg(7)), bodyMat);
    neck.scale.set(n.scale[0], n.scale[1], n.scale[2] * (1 + (nb - 1) * 0.6));
    neck.position.set(
      Math.sin(i * n.wobbleFreq) * n.wobbleAmp,
      n.y0 + i * n.yStep + neckArc(i),
      n.z0 + i * n.zStep);
    group.add(neck);
  }

  const wr = profile.wingRoot;
  const hb0 = profile.headBase(neckSegs);
  const hb = { x: hb0.x, y: hb0.y + spineCurl * postureAmp, z: hb0.z };  // posture lifts/drops the head
  const tailShift = (profile.tailShiftRefZ - profile.zHold) * (stretch - 1);

  // parts.spinePoints — the DESIGNED line-of-action polyline (group space, tail→head),
  // published for the §7 line-of-action assert. Sampled from the keel + neck + head
  // with an S-curl overlay (neck arcs one way, the after-body counter-arcs) so the
  // idle spine is an S with ≥1 inflection (law 2), not a dead straight axis.
  const spinePoints = (() => {
    const pts = [];
    const zTail = profile.tailAnchorZ + tailShift;
    pts.push(new THREE.Vector3(0, TORSO_Y + profile.tailAnchorY, zTail));
    for (let i = profile.keel.length - 1; i >= 0; i--) {          // hips → shoulder (z decreasing)
      const [z, y] = profile.keel[i];
      pts.push(new THREE.Vector3(0, TORSO_Y + y, z));
    }
    const nk = profile.neck;
    const nSeg = Math.max(2, neckSegs);
    for (let i = 0; i < nSeg; i += Math.max(1, Math.floor(nSeg / 3))) {
      pts.push(new THREE.Vector3(0, (nk?.y0 ?? 0.3) + i * (nk?.yStep ?? 0.08) + neckArc(i), (nk?.z0 ?? -2) + i * (nk?.zStep ?? -0.36)));
    }
    pts.push(new THREE.Vector3(hb.x, hb.y, hb.z));
    // S-curl overlay: a half-wave along the chain (0 at ends, ± mid) guarantees a
    // curvature sign-change (inflection) whose direction tracks the posture.
    const amp = 0.14 * (0.5 + 0.5 * Math.abs(spineCurl)) * (spineCurl >= 0 ? 1 : -1);
    for (let s = 0; s < pts.length; s++) {
      const f = pts.length > 1 ? s / (pts.length - 1) : 0;         // 0 tail → 1 head
      pts[s].y += amp * Math.sin(f * Math.PI * 2);
    }
    return pts;
  })();

  const attach = {
    wingRoot: (side) => ({ x: wr.x * shoulderW * side, y: wr.y + (model.wingRootOffset?.y ?? 0), z: wr.z + (model.wingRootOffset?.z ?? 0) }),
    headBase: hb,
    tailAnchor: { y: profile.tailAnchorY, z: profile.tailAnchorZ + tailShift },
    keelTopAt: (z) => TORSO_Y + keelTopFor(profile, z),
    // Flank anchors for surface-following decorations (additive + nullable — a
    // torso that omits them just won't carry flank shingles). halfWidthAt → the
    // body's outer x at a z; bodyMidY → world Y of the widest cross-section line.
    halfWidthAt: (z) => halfWidthFor(profile, z),
    bodyMidY: TORSO_Y,
    tailShift,
    // The DoubleSide body material (surface shaders included) so a surface-continuous
    // add-on — e.g. the skinned shoulder bridge — matches the torso exactly (no seam).
    bodyMatDouble: torsoMat,
    // The torso SkinnedMesh (Pass 2) for the orchestrator to bind to the wing
    // shoulder bones — null unless this torso opted into skinShoulders.
    shoulderSkin: opts.skinShoulders ? torso : null,
  };
  // UNIFIED HULL contract (additive + nullable): a body-less torso publishes the
  // loft RECIPE so the hull builder can generate the body surface ITSELF and weld
  // the wing membrane to it as one continuous skin. Uses the FINAL profile (after
  // the shoulderWidthScale munge) so the flank the wing welds to matches the body.
  if (!bodyMesh) {
    const finalProfile = profile;
    attach.loft = {
      makeGeo: () => geoFn(finalProfile, stretch),
      profile: finalProfile,
      stretch,
      TORSO_Y,
      keelTopFor: (z) => keelTopFor(finalProfile, z),
      halfWidthFor: (z) => halfWidthFor(finalProfile, z),
    };
  }
  return { group, attach, spinePoints };
}

// ===========================================================================
// PROFILES
// ===========================================================================
// ARROW — the shipped arrowhead drake. Every constant matches the legacy builder
// exactly (stations, ring, keel line, fairing, neck, head anchor, tail shift) so
// azure/ember/jade/obsidian/pearl/solar render pixel-for-pixel unchanged.
const ARROW_PROFILE = {
  zHold: 0,
  tailShiftRefZ: 1.70,
  tailAnchorY: 0.28,
  tailAnchorZ: 1.15,
  stations: [
    [-3.05, 0.15, 0.10, 0.13], // neck cap (meets the neck chain)
    [-2.45, 0.30, 0.22, 0.24], // neck base
    [-1.65, 0.52, 0.42, 0.38], // fore-shoulder
    [-0.85, 0.66, 0.54, 0.46], // shoulder peak — broadest, tallest keel
    [-0.10, 0.55, 0.45, 0.40], // thorax
    [ 0.60, 0.39, 0.33, 0.29], // waist (clear pinch)
    [ 1.15, 0.29, 0.25, 0.20], // narrow hips
    [ 1.70, 0.17, 0.17, 0.11], // slim tail root
  ],
  keel: [[-2.45, 0.22], [-0.85, 0.54], [-0.10, 0.45], [0.60, 0.33], [1.15, 0.25], [1.70, 0.17]],
  wingRoot: { x: 0.5, y: 0.55, z: -0.25 }, // high on the back — the legacy constant
  fairing: { r: 0.3, scale: [0.86, 0.78, 1.2], pos: [0.46, 0.54, -0.4] },
  neck: {
    rBase: 0.46, rStep: 0.045, rMin: 0.2, scale: [0.8, 0.66, 1.3],
    y0: 0.3, yStep: 0.085, z0: -2.0, zStep: -0.36, wobbleAmp: 0.1, wobbleFreq: 0.8,
  },
  headBase: (neckSegs) => ({ x: 0, y: 0.5 + (neckSegs - 4) * 0.09, z: -3.08 - (neckSegs - 4) * 0.34 }),
};

// SERPENT — a long, slim EASTERN river-dragon body. The first NEW body plan: the
// after-body is stretched ~45% and slimmed ~22%, the keel is lower and flatter,
// and the wing roots / head sit further forward on a longer neck. Wings, tail and
// head mount correctly via the attach contract alone — none of that code knows
// it's now riding a serpent.
const SERPENT_PROFILE = {
  zHold: -0.6,            // hold further forward so the long tail-boom does the stretching
  tailShiftRefZ: 2.40,
  tailAnchorY: 0.24,
  tailAnchorZ: 1.55,
  stations: [
    [-3.30, 0.12, 0.07, 0.10],
    [-2.60, 0.22, 0.15, 0.17],
    [-1.80, 0.34, 0.26, 0.27], // slimmer, longer fore-body (no broad shoulder peak)
    [-0.95, 0.42, 0.32, 0.34],
    [-0.10, 0.40, 0.30, 0.33], // gentle, even girth — a tube, not a blade
    [ 0.80, 0.34, 0.25, 0.28],
    [ 1.70, 0.24, 0.19, 0.18],
    [ 2.55, 0.13, 0.13, 0.09], // very slim, very long tail root
  ],
  keel: [[-2.60, 0.15], [-0.95, 0.32], [-0.10, 0.30], [0.80, 0.25], [1.70, 0.19], [2.55, 0.13]],
  wingRoot: { x: 0.36, y: 0.40, z: -0.45 }, // small wings, forward + low on the slim body
  fairing: { r: 0.24, scale: [0.8, 0.74, 1.25], pos: [0.34, 0.42, -0.5] },
  neck: {
    rBase: 0.36, rStep: 0.026, rMin: 0.16, scale: [0.82, 0.72, 1.45],
    y0: 0.26, yStep: 0.06, z0: -2.2, zStep: -0.42, wobbleAmp: 0.16, wobbleFreq: 0.7,
  },
  headBase: (neckSegs) => ({ x: 0, y: 0.42 + (neckSegs - 4) * 0.07, z: -3.45 - (neckSegs - 4) * 0.40 }),
};

registerTorso('arrow', (def, model, bodyMat) => buildTorso(ARROW_PROFILE, def, model, bodyMat));
registerTorso('serpent', (def, model, bodyMat) => buildTorso(SERPENT_PROFILE, def, model, bodyMat));
// sweptLoft — the arrow body plan rebuilt through sweepProfile() so its cross-
// section ROUNDS on capable devices (ULTRA) while staying byte-identical at HIGH.
// Opt-in per dragon via parts.torso:'sweptLoft' (proving on the hero, Obsidian, first).
registerTorso('sweptLoft', (def, model, bodyMat) =>
  buildTorso(ARROW_PROFILE, def, model, bodyMat, buildSweptTorsoGeometry));
// sweptLoft + Pass-2 shoulder skinning: the body surface bulges with the wingbeat
// (bound to the wing shoulder bones by the orchestrator). Obsidian-only opt-in.
registerTorso('sweptLoftSkinned', (def, model, bodyMat) =>
  buildTorso(ARROW_PROFILE, def, model, bodyMat, buildSweptTorsoGeometry, { skinShoulders: true }));
// unifiedHullTorso — the BODY-LESS torso for the continuous skinned hull. It builds
// the neck + publishes the full attach contract (incl. attach.loft, the body-loft
// recipe), but adds NO body mesh and NO fairings: the hull (dragonUnifiedHull.js)
// grows the body surface itself and welds the wing membrane to it as one skin.
// Obsidian-only opt-in; the rest of the roster is byte-identical.
registerTorso('unifiedHullTorso', (def, model, bodyMat) =>
  buildTorso(ARROW_PROFILE, def, model, bodyMat, buildSweptTorsoGeometry, { bodyMesh: false }));

export { ARROW_PROFILE, SERPENT_PROFILE, buildTorso, bladeRing, keelTopFor, halfWidthFor, TORSO_Y };

// ===========================================================================
// AVIAN — a firebird body plan (the Phoenix, folded out of its bespoke builder).
// ===========================================================================
// A compact egg body + breast swell + a glowing heart-fire core, a back-raked
// feather crown down the spine, and a short avian neck — NOT a lofted reptile
// torso. It owns the firebird body materials (returned so the head/tail share
// them and the rig animates them) and the heart-core + solar-backlight sprites.
// Form level (model.formLevel) drives brightness, feather count and core size.
//
// attach mounts the feather wings high on the shoulders, the beaked head on the
// short neck, and the plume tail off the rump; keelTopAt is a no-op (no dorsal
// spine — the crown is the back read).
function buildAvianTorso(def, model, _bodyMat) {
  const F = model.formLevel ?? (model.spineGlow >= 1 ? 3 : model.spineGlow >= 0.6 ? 2 : model.spineGlow >= 0.25 ? 1 : 0);
  const group = new THREE.Group();
  const spineMats = [];

  const cBody = def.body;
  const cCore = def.coreGlow ?? def.scales;
  const cSeam = def.apexSeam ?? def.wingEmissive;
  const cCrest = def.horn ?? def.scales;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: cBody, roughness: 0.44, metalness: 0.08,
    emissive: cBody, emissiveIntensity: 0.1 + F * 0.1, side: THREE.DoubleSide,
  });
  applyFresnelRim(bodyMat, cSeam);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x221100, emissive: def.eye, emissiveIntensity: 2.2 });
  const tagged = (mat, baseEmissive, baseIntensity) => {
    mat.userData.baseEmissive = baseEmissive;
    mat.userData.baseIntensity = baseIntensity;
    spineMats.push(mat);
    return mat;
  };
  const crestMat = tagged(new THREE.MeshStandardMaterial({
    color: cCrest, emissive: cSeam, emissiveIntensity: 0.8 + F * 0.6, roughness: 0.3, metalness: 0.4,
    side: THREE.DoubleSide,
  }), cSeam, 0.8 + F * 0.6);
  const coreMat = tagged(new THREE.MeshStandardMaterial({
    color: cCore, emissive: cCore, emissiveIntensity: 1.5 + F * 0.9, roughness: 0.3,
  }), cCore, 1.5 + F * 0.9);

  // Body: a compact egg leaning into the flight + a breast swell.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, seg(14), seg(12)), bodyMat);
  body.scale.set(0.8, 0.84, 1.46 + F * 0.08);
  body.position.set(0, 0.5, 0.12);
  group.add(body);
  const breast = new THREE.Mesh(new THREE.SphereGeometry(0.44, seg(12), seg(10)), bodyMat);
  breast.scale.set(0.92, 0.92, 1.05);
  breast.position.set(0, 0.36, -0.5);
  group.add(breast);

  // Heart-fire core mesh: a bright sphere nestled in the chest (blazes on Surge).
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.24 + F * 0.05, seg(12), seg(10)), coreMat);
  heart.position.set(0, 0.48, -0.18);
  group.add(heart);

  // Back crown: a row of back-raked feathers down the spine (firebird read from
  // directly behind). Grows with the form.
  const backN = 3 + F * 2;
  for (let i = 0; i < backN; i++) {
    const t = i / (backN - 1);
    const h = (0.4 + Math.sin(t * Math.PI) * (0.4 + F * 0.18));
    const fe = new THREE.Mesh(featherGeo(h, 0.16 + F * 0.02), crestMat);
    fe.position.set(0, 0.78 + Math.sin(t * Math.PI) * 0.1, -0.7 + t * 1.7);
    fe.rotation.x = -1.15; // rake up-and-back
    group.add(fe);
  }

  // Short avian neck (2 small spheres) — bird, not serpent.
  for (let i = 0; i < 2; i++) {
    const t = (i + 1) / 3;
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.34 - i * 0.06, seg(9), seg(7)), bodyMat);
    n.scale.set(0.82, 0.78, 1.0);
    n.position.set(0, 0.5 + t * 0.22, -0.62 - t * 0.72);
    group.add(n);
  }

  // Soft solar backlight (form 3-4): a divine corona behind the body.
  if (F >= 3) {
    const auraCard = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(def.aura ? hexRgb(def.aura) : hexRgb(cSeam)), transparent: true,
      opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    auraCard.scale.set(4.4, 5.8, 1);
    auraCard.position.set(0, 0.7, 0.25);
    group.add(auraCard);
  }

  // Heart-fire core sprite (white-hot glow that pulses on boost / blazes Surge).
  let coreGlow = null;
  if (def.coreGlow) {
    const lvl = 0.4 + F * 0.2;
    coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(hexRgb(cCore)), transparent: true, opacity: 0.2 + lvl * 0.24,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    coreGlow.scale.setScalar(0.9 + lvl * 0.8);
    coreGlow.position.set(0, 0.48, -0.18);
    coreGlow.layers.set(1);
    coreGlow.userData.base = coreGlow.material.opacity;
    group.add(coreGlow);
  }

  const attach = {
    wingRoot: (side) => ({ x: 0.4 * side, y: 0.62, z: -0.12 }),
    headBase: { x: 0, y: 0.74, z: -1.32 - F * 0.04 },
    tailAnchor: { y: 0.42, z: 0.55 },
    keelTopAt: () => 0,   // no dorsal spine — the crown is the back read
    tailShift: 0,
  };
  // mats override the dragon defaults so the head shares the firebird body/eye
  // material (rig pulse stays consistent); spineMats flare on Rebirth Surge.
  return { group, attach, mats: { bodyMat, eyeMat }, coreGlow, spineMats };
}

registerTorso('avian', buildAvianTorso);
