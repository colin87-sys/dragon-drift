// FORNAX — "The banked furnace" (I1: the char-plate anvil; wings/head/tail still stubbed)
//
// The roster's fire wyvern. Build sheet: reforged/FIRE-WYVERN-BUILDSHEET.md.
// Structural ranges it cites: reforged/DRAGON-ANATOMY-REFERENCE.md.
//
// BUILD STATE
//   I0 ✔ coexist + rig conventions (3-segment wing cascade with −anchor + OUTER lmirror wrapper,
//        nested isBone tail, legs as a torso-internal helper — there is no registerLegs).
//   I1 ✔ THIS INCREMENT — slagAnvilTorso becomes the real char-plate anvil: a forward-massed
//        forged hull with a four-tier value ladder, a lava-lake seam network carved as UNLIT
//        recessed channels, a shallow-S neck loft, and the abducted emberHaunch leg chains.
//        The ATTACH CONTRACT is now full-surface and FREEZES here — I3's head/tail mount through it.
//   I2   the hero wing (low taut crescent + THE NOTCH FLOOR) and the flap.
//   I3   brandSkull / firebrandTail craft.
//   I4   THE STOKE — the first light this creature ever emits.
//
// ⚠ NOTHING IN THIS FILE EMITS. The identity is WITHHELD light: the seams are shadow at I1 and
// only ignite at I4. One emissive pixel here would be the LED-strip tell shipping before the
// creature does. Every dial is nullable + DEFAULT-OFF; only the `fornax` def opts in, so the
// shipped roster builds byte-identically (proved by diffing tricount, not asserted by comment).

import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

const TORSO_Y = 0.2;   // house constant — the torso mesh sits at y=0.2 and spine math adds it in

// --- I2/I3 blockout helper ---------------------------------------------------
// A flat-shaded box. Named so a reader never mistakes stub geometry for authored form.
// The TORSO no longer uses this; the wing/head/tail stubs still do until I2/I3 replace them.
function blockout(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

// --- THE SLAG PROFILE --------------------------------------------------------
// A fixed-polygon cross-section, shared by every loft station. This is what kills the
// "stacked rings" failure BY CONSTRUCTION (DRAGON-DESIGN §2.11): because every station uses the
// same column count, each facet COLUMN becomes a continuous longitudinal strake running the
// length of the hull, and the longitudinal grain dominates any faint transverse station edge.
//
// The shape is a HEAT-SHIELD, deliberately not Vesper's knapped-glass chine: a broad flat dorsal
// DECK (plates lie flat on top, where the rear-high camera sees them), a hard shoulder bevel, a
// wide lateral chine at mid-height, and a tucked belly. Smooth plates between seams — never
// struck flakes, which is Vesper's lane.
const SLAG_PROFILE = [
  [0.22, 0.98],    // k0  dorsal deck  (R of midline)
  [0.62, 0.80],    // k1  shoulder bevel R
  [0.96, 0.34],    // k2  chine apex R — the widest line, and a gen-1 seam runs it
  [0.80, -0.28],   // k3  lower flank R
  [0.38, -0.86],   // k4  belly R
  [-0.38, -0.86],  // k5  belly L
  [-0.80, -0.28],  // k6  lower flank L
  [-0.96, 0.34],   // k7  chine apex L
  [-0.62, 0.80],   // k8  shoulder bevel L
  [-0.22, 0.98],   // k9  dorsal deck L
];

// Per-COLUMN value banding. The area census (director's target 3) falls out of which columns get
// which tier: the two chine + two lower-flank columns are the largest, so they carry the darkest
// char (~55-60%); the belly and shoulder bevels carry the scorch mid (~28%); the narrow dorsal
// deck carries the ash-lit facet (~12%) where top-light actually lands.
function slagBand(M, k) {
  if (k === 0 || k === 9) return M.ashLit;                    // dorsal deck — the lit facet
  if (k === 1 || k === 8) return M.scorch;                    // shoulder bevel
  if (k === 4 || k === 5) return M.scorch;                    // belly — lifted so it never crushes to black
  return M.char;                                              // chine + lower flank — the dark field
}

// --- The fixed-polygon loft --------------------------------------------------
// Stations are {z, rx, ry, cy}; the profile is scaled per station. Triangles are batched BY
// MATERIAL (one mesh per tier) so four value tiers cost four draw calls, not four per station.
function slagLoft(stations, profile, matFor, cap = true) {
  const N = profile.length;
  const P = (s, k) => [profile[k][0] * s.rx, s.cy + profile[k][1] * s.ry, s.z];
  const byMat = new Map();
  const push = (mat, ...tris) => { let a = byMat.get(mat); if (!a) byMat.set(mat, a = []); for (const t of tris) a.push(t); };
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i], b = stations[i + 1];
    for (let k = 0; k < N; k++) {
      const k1 = (k + 1) % N;
      push(matFor(k), [P(a, k), P(b, k1), P(b, k)], [P(a, k), P(a, k1), P(b, k1)]);
    }
  }
  if (cap) {
    const f = stations[0], l = stations[stations.length - 1];
    const fc = [0, f.cy, f.z], lc = [0, l.cy, l.z];
    for (let k = 0; k < N; k++) {
      const k1 = (k + 1) % N;
      push(matFor(k), [fc, P(f, k1), P(f, k)], [lc, P(l, k), P(l, k1)]);
    }
  }
  const g = new THREE.Group();
  for (const [mat, tris] of byMat) g.add(flatTriMesh(tris, mat));
  return g;
}

// Tag every mesh in a subtree with the anatomical part it belongs to. The structural probe reads
// these to measure the HULL's projected area rather than raw vertex counts — without the tag, a
// dense little toe loft outweighs the whole chest and the forward-mass number becomes a lie
// about vertex density instead of a measurement of silhouette.
function tagPart(obj, part) { obj.traverse((o) => { if (o.isMesh) o.userData.fornaxPart = part; }); return obj; }

// --- THE SEAM NETWORK --------------------------------------------------------
// Lava-lake topology (ref §7): FEW LONG CURVING seams bounding LARGE smooth plates. The research
// is explicit that 120° hexagonal cells read as DEAD ROCK — the living-armour read needs
// T-junctions, so the network here is built entirely from T's: two gen-1 longitudinal seams run
// the chine apex columns nose→tail, and every transverse seam TERMINATES on them (a T at each
// end) rather than crossing to make a Y.
//
// A seam is a RECESSED CHANNEL, never a proud rib and never a bright cap (the flat-tape tell,
// AAA-PIPELINE §2.1 — inverted here because at I1 the seam has no light at all). It is drawn as
// one narrow strip in a dedicated tier DARKER than the darkest plate, seated a hair proud of the
// hull only so it does not z-fight; the value does the recessing, and at I4 the same path is
// where THE STOKE runs.
function seamStrip(pts, halfW, mat) {
  const tris = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const A = pts[i], B = pts[i + 1];
    // Ribbon width is taken across the local segment direction, projected into the plane that
    // best shows it: for a longitudinal seam that is X, for a transverse seam it is Z.
    const dz = Math.abs(B[2] - A[2]), dx = Math.abs(B[0] - A[0]) + Math.abs(B[1] - A[1]);
    const wx = dz >= dx ? halfW : 0, wz = dz >= dx ? 0 : halfW;
    const AL = [A[0] - wx, A[1], A[2] - wz], AR = [A[0] + wx, A[1], A[2] + wz];
    const BL = [B[0] - wx, B[1], B[2] - wz], BR = [B[0] + wx, B[1], B[2] + wz];
    tris.push([AL, BR, BL], [AL, AR, BR]);
  }
  return flatTriMesh(tris, mat);
}

// --- The four-tier char value ladder ----------------------------------------
// The AAA value-structure law: a deliberately dark hero is CARVED OUT OF VALUES, never a flat
// silhouette. Four diffuse tiers, and — the finding that reversed the sheet's own first draft —
// char albedo is COOL and never pure black (ref §7: charcoal albedo ≈0.04, linear 0.02-0.045,
// R−B within a couple of steps). ALL the warmth on this creature is EMITTED at I4; none of it is
// painted into the diffuse. That is the whole difference between a banked furnace and a dragon
// somebody tinted orange, and it is why the Ember starter's surface-warm lane stays uncollided.
function fornaxMats(def) {
  const mk = (hex, rough, metal = 0.02) => {
    const m = new THREE.MeshStandardMaterial({
      color: hex, emissive: 0x000000, flatShading: true, roughness: rough, metalness: metal,
    });
    m.envMapIntensity = 0.25;
    return m;
  };
  return {
    // linear ≈ 0.023 — the dark field. Cool-neutral (R−B = 2/255).
    char: mk(def.body ?? 0x2a2a2c, 0.86),
    // linear ≈ 0.042 — scorch mid, still inside the char band.
    scorch: mk(0x3a3a3d, 0.80),
    // linear ≈ 0.091 — the ash-lit facet that catches top light on the dorsal deck.
    ashLit: mk(0x55555a, 0.72),
    // linear ≈ 0.156 — the plate-rim tier. Kept to ≤2% of area (rims only, never faces):
    // the coal-not-torch law says the bright part is the RIM over a dark face.
    rim: mk(0x6e6a66, 0.60, 0.10),
    // The seam channel: DARKER than the darkest plate, so a seam pixel can never read brighter
    // than the plate it divides (director's target 6 — recessed, never proud).
    seam: mk(0x1e1e20, 0.92),
  };
}

// --- TORSO: slagAnvilTorso ---------------------------------------------------
// THE ANVIL. One dominant forged mass, forward-loaded, with root swells that BREAK the outline.
// Station geometry carries the numbers the director set: chest depth 1.65× waist (target 1.6-1.9),
// shoulder width 1.28× hip (target ≥1.25), and NO ventral keel blade — the flight muscle is a
// shallow wrap around the ribcage, because real soarers have shallow keels and flight muscle is
// 20-25% of body mass, not the 40% the sheet's first draft implied.
function buildSlagAnvilTorso(def, model, bodyMat) {
  const group = new THREE.Group();
  const scale = model.anvilScale ?? 1;
  const M = fornaxMats(def);
  const S = (v) => v * scale;

  // Body stations. Three silhouette EVENTS down the dorsal line — shoulder yoke (the high point,
  // the anvil's face), a real waist tuck, a haunch re-swell — because a flat roofline is what
  // makes a body read as a box wearing panels.
  const body = [
    { z: S(-1.45), rx: S(0.26), ry: S(0.30), cy: S(0.20) },   // chest prow
    { z: S(-0.95), rx: S(0.60), ry: S(0.56), cy: S(0.16) },   // SHOULDER YOKE — widest + deepest
    { z: S(-0.35), rx: S(0.50), ry: S(0.46), cy: S(0.19) },
    { z: S(0.20), rx: S(0.35), ry: S(0.34), cy: S(0.20) },    // WAIST tuck (leanest)
    { z: S(0.60), rx: S(0.47), ry: S(0.44), cy: S(0.19) },    // HAUNCH swell — the hip outline event
    // The aft body carries real mass rather than pinching straight to the tail: the probe measured
    // 81.8% of side-view area forward of the hip against a 65-75% target, i.e. a tadpole. Real
    // archosaurs put the fattest caudal segments AFT of the hip, and a heavy aft body is what
    // earns the upright stance. Lengthening here fixed the number honestly; widening the band to
    // let 81.8% "pass" would have been moving the goalpost.
    { z: S(0.90), rx: S(0.42), ry: S(0.40), cy: S(0.180) },
    { z: S(1.20), rx: S(0.31), ry: S(0.30), cy: S(0.165) },
    { z: S(1.50), rx: S(0.19), ry: S(0.17), cy: S(0.155) },
    { z: S(1.70), rx: S(0.11), ry: S(0.10), cy: S(0.150) },   // tail root
  ];
  group.add(tagPart(slagLoft(body, SLAG_PROFILE, (k) => slagBand(M, k)), 'hull'));

  // NECK — 8 stations, a SHALLOW S. Ref §2: 8-9 cervicals, "slightly sinuous"; the joint COUNT is
  // the tell, not the length (birds run 14-15 and a deep S, and a deep S here would read bird).
  const neck = [
    { z: S(-1.50), rx: S(0.26), ry: S(0.30), cy: S(0.200) },
    { z: S(-1.68), rx: S(0.24), ry: S(0.275), cy: S(0.225) },
    { z: S(-1.86), rx: S(0.22), ry: S(0.250), cy: S(0.240) },
    { z: S(-2.04), rx: S(0.205), ry: S(0.230), cy: S(0.235) },
    { z: S(-2.22), rx: S(0.19), ry: S(0.210), cy: S(0.215) },
    { z: S(-2.40), rx: S(0.17), ry: S(0.190), cy: S(0.190) },
    { z: S(-2.58), rx: S(0.15), ry: S(0.170), cy: S(0.170) },
    { z: S(-2.76), rx: S(0.13), ry: S(0.150), cy: S(0.160) },
  ];
  group.add(tagPart(slagLoft(neck, SLAG_PROFILE, (k) => slagBand(M, k), false), 'neck'));

  // Surface point on the hull, pushed a hair proud so a seam never z-fights the plate it divides.
  const all = body.concat(neck).sort((a, b) => a.z - b.z);
  const at = (z) => {
    for (let i = 0; i < all.length - 1; i++) {
      const a = all[i], b = all[i + 1];
      if (z >= a.z && z <= b.z) {
        const t = (z - a.z) / (b.z - a.z || 1);
        return { rx: a.rx + (b.rx - a.rx) * t, ry: a.ry + (b.ry - a.ry) * t, cy: a.cy + (b.cy - a.cy) * t };
      }
    }
    const e = z < all[0].z ? all[0] : all[all.length - 1];
    return { rx: e.rx, ry: e.ry, cy: e.cy };
  };
  const OUT = S(0.006);
  const surf = (z, k) => {
    const s = at(z), p = SLAG_PROFILE[k];
    return [p[0] * (s.rx + OUT), s.cy + p[1] * (s.ry + OUT), z];
  };

  // THE SEAM NETWORK — gen-1 first (widest, longest), then gen-2 subdividing, because crack
  // hierarchy is mandatory: in real cooling crust the older cracks WIDEN while newer ones
  // subdivide the plates between them. A single-generation net of equal-width cracks is the
  // mud-crack tell.
  const w = S(0.006);                                    // hairline unit; gen-1 = 8w, gen-2 = 2.5w
  const seamOn = (model.slagSeams ?? 0) > 0;
  if (seamOn) {
    const nose = S(-2.70), tailEnd = S(1.20);
    // GEN-1 LONGITUDINAL ×2 — the chine apex columns (k2/k7), the strongest lines on the hull.
    // Every transverse seam terminates on these, which is what makes the junctions T's.
    for (const k of [2, 7]) {
      const pts = [];
      for (let z = nose; z <= tailEnd; z += S(0.15)) pts.push(surf(z, k));
      group.add(tagPart(seamStrip(pts, w * 4, M.seam), 'seam'));
    }
    // GEN-1 TRANSVERSE ×3 — shoulder, mid-back, hip. Each is an ARC over the dorsal deck from
    // chine to chine, so it crosses the dorsal midline (the STOKE must be routable tail-ward)
    // and T's into a longitudinal seam at BOTH ends. 3 arcs × 2 ends = 6 T-junctions, 0 Y.
    for (const z of [S(-0.95), S(-0.10), S(0.62)]) {
      const arc = [];
      for (let k = 2; k <= 7; k++) arc.push(surf(z, k));
      group.add(tagPart(seamStrip(arc, w * 4, M.seam), 'seam'));
    }
    // GEN-2 ×4 — shorter flank seams branching off a gen-1 longitudinal and running down toward
    // the belly, subdividing the big chine plates. Deterministic offsets (never Math.random) so
    // the build is reproducible frame to frame and machine to machine.
    const g2 = [[-0.62, 2], [0.30, 2], [-0.62, 7], [0.30, 7]];
    for (const [z0, k0] of g2) {
      const z = S(z0), k1 = k0 === 2 ? 3 : 6, k2 = k0 === 2 ? 4 : 5;
      group.add(tagPart(seamStrip([surf(z, k0), surf(z, k1), surf(z, k2)], w * 1.25, M.seam), 'seam'));
    }
    // GEN-3 hairlines — ULTRA ONLY, and honestly device-scoped rather than context-scoped: there
    // is no shop-vs-game LOD split in this engine (modelDetail.js is a device multiplier), so a
    // low/high device never sees these even in the shop. Stated plainly rather than implied.
    if ((model.slagSeamGen3 ?? 0) > 0) {
      for (const [z0, k0] of [[-1.20, 1], [-0.50, 1], [0.05, 8], [0.85, 8]]) {
        group.add(tagPart(seamStrip([surf(S(z0), k0), surf(S(z0 + 0.18), k0 + 1)], w * 0.5, M.seam), 'seam'));
      }
    }
  }

  // ROOT SWELLS — the humerus root must visibly OUTMASS the femur root (~1.4×). That ordering is
  // inverted vs birds and it is the wyvern's structural tell: the wings ARE the arms, so the
  // shoulder carries the flight load. It is also the fix for the #1 published machine-made-3D
  // giveaway — melted, blobby limb roots that are "impossible to pose". A capped lofted socket
  // reads as a joint awaiting an arm; a smooth fillet reads as an amputation.
  const swell = (x, y, z, r, mat) => {
    const st = [
      { z: z - r * 0.9, rx: r * 0.55, ry: r * 0.55, cy: 0 },
      { z, rx: r, ry: r * 0.92, cy: 0 },
      { z: z + r * 0.9, rx: r * 0.62, ry: r * 0.62, cy: 0 },
    ];
    const g = slagLoft(st, SLAG_PROFILE, () => mat);
    g.position.set(x, y, 0);
    return g;
  };
  const shoulderR = S(0.27), hipR = shoulderR / 1.4;   // the 1.4× law, expressed as the ratio itself
  for (const side of [1, -1]) {
    group.add(tagPart(swell(side * S(0.44), TORSO_Y + S(0.10), S(-0.95), shoulderR, M.scorch), 'shoulderRoot'));
    group.add(tagPart(swell(side * S(0.36), TORSO_Y - S(0.02), S(0.60), hipR, M.char), 'hipRoot'));
  }

  // emberHaunch — a HELPER inside the torso (there is no registerLegs), and a real hip→knee→
  // ankle→toe chain rather than I0's two boxes. Ref §3 overturned the brief here: raptors do NOT
  // tuck in cruise, and for a behind-and-above camera the abducted pose is the only one that puts
  // geometry in the wing–tail WEDGE — tucked is invisible and trailing hides inside the tail
  // outline and reads bird.
  if (model.emberHaunch) {
    for (const side of [1, -1]) {
      const hip = new THREE.Group();
      hip.position.set(side * S(0.34), TORSO_Y - S(0.06), S(0.62));
      hip.rotation.z = side * THREE.MathUtils.degToRad(45);      // hip abduct 45° (band 35-55)
      hip.userData.legRole = 'hip';

      const thighLen = S(0.40);
      const thigh = slagLoft([
        { z: 0, rx: S(0.115), ry: S(0.115), cy: 0 },
        { z: thighLen * 0.55, rx: S(0.095), ry: S(0.095), cy: 0 },
        { z: thighLen, rx: S(0.070), ry: S(0.070), cy: 0 },
      ], SLAG_PROFILE, () => M.char);
      thigh.rotation.x = Math.PI / 2;   // loft runs +z; stand it up so the limb runs down −y
      hip.add(thigh);

      // KNEE — hinged at the end of the thigh, not rotated about its own centre (the I0 bug the
      // director caught). Interior angle 82° (band 70-95): the shank swings forward under the body.
      const knee = new THREE.Group();
      knee.position.y = -thighLen;
      knee.rotation.x = THREE.MathUtils.degToRad(-(180 - 82)) * 0.42;   // partial fold at rest
      knee.userData.legRole = 'knee';
      hip.add(knee);

      const shankLen = S(0.34);
      const shank = slagLoft([
        { z: 0, rx: S(0.072), ry: S(0.072), cy: 0 },
        { z: shankLen, rx: S(0.052), ry: S(0.052), cy: 0 },
      ], SLAG_PROFILE, () => M.char);
      shank.rotation.x = Math.PI / 2;
      knee.add(shank);
      // A greave plate rides the shank in the hull's plate language — one rank, not a picket file.
      const greave = slagLoft([
        { z: shankLen * 0.15, rx: S(0.085), ry: S(0.06), cy: 0 },
        { z: shankLen * 0.62, rx: S(0.065), ry: S(0.045), cy: 0 },
      ], SLAG_PROFILE, () => M.scorch);
      greave.rotation.x = Math.PI / 2;
      knee.add(greave);

      // ANKLE 115° (band 100-130), then a three-toed plated foot. Three toes, not four: a bird
      // foot is the single easiest accidental COCKATRICE misread, which the sheet deliberately
      // overrules period heraldry to avoid.
      const ankle = new THREE.Group();
      ankle.position.y = -shankLen;
      ankle.rotation.x = THREE.MathUtils.degToRad(115 - 90);
      ankle.userData.legRole = 'ankle';
      knee.add(ankle);
      for (let t = -1; t <= 1; t++) {
        const toe = slagLoft([
          { z: 0, rx: S(0.030), ry: S(0.026), cy: 0 },
          { z: S(0.115), rx: S(0.017), ry: S(0.015), cy: 0 },
        ], SLAG_PROFILE, () => M.char);
        toe.rotation.x = Math.PI / 2;
        toe.rotation.z = t * 0.42;
        toe.position.set(t * S(0.035), -S(0.02), -S(0.02));
        ankle.add(toe);
      }
      group.add(tagPart(hip, 'leg'));
    }
  }

  // Spine polyline (world-space) for line-of-action asserts — additive + nullable.
  const spinePoints = [];
  for (const s of all) spinePoints.push(new THREE.Vector3(0, s.cy + s.ry, s.z));

  // Motif anchor — the socket a later increment hangs the identity feature from. Crash-guard:
  // parts read attach.motifAnchor, so it must exist even when nothing uses it yet.
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(0, TORSO_Y + S(0.34), S(-0.95));
  group.add(motifAnchor);

  // ⚠ THE ATTACH CONTRACT — FROZEN AT I1 SIGN-OFF. I3's brandSkull and firebrandTail mount
  // through this, so moving a number after sign-off silently moves their geometry. keelTopAt and
  // halfWidthAt are now real functions OF Z (I0 returned constants, which would have put a spine
  // ridge at a fixed height over a body that changes height).
  //
  // SPAN RECONCILIATION (director's target 14): torso = shoulder(z −0.95) → hip(z +0.60) = 1.55u.
  // The sanctioned rideability band is span:torso 5.0-6.5 (the HONEST figure is 13-15:1, which
  // gives a 70cm torso nobody can sit on). At the 5.5 target that implies a FULL span of ~8.5u,
  // i.e. `wingSpan` (half-span) ≈ 4.26 at I2 — recorded here so I2 lands the band without moving
  // this contract. Engine sanity span:total-body stays ≤2.5 (total body ≈ 4.0u).
  const attach = {
    wingRoot: (side) => ({ x: side * S(0.44), y: TORSO_Y + S(0.14), z: S(-0.95) }),
    headBase: { x: 0, y: TORSO_Y + S(0.16), z: S(-2.86) },
    tailAnchor: { y: S(0.15), z: S(1.70) },
    keelTopAt: (z) => { const s = at(z); return TORSO_Y + s.cy + s.ry; },
    halfWidthAt: (z) => at(z).rx * 0.96,
    bodyMidY: TORSO_Y,
    motifAnchor,
  };

  // coreGlow MUST be null, never a colour (the documented Solar crash, dragonVesper.js:319-321).
  return { group, attach, spinePoints, spineMats: [], mats: { bodyMat: M.char }, coreGlow: null };
}
registerTorso('slagAnvilTorso', buildSlagAnvilTorso);

// --- WINGS: underlitCrescentWings -------------------------------------------
// THE HERO, and therefore the thing I0 must NOT fake: the rig wiring is real here even though the
// membrane is a blockout. I2 builds the low taut crescent (archRise 0.12, wristT 0.30, bay sag
// ≤0.10 chord) and — critically — THE NOTCH FLOOR: digit tips project ≥0.15 bay chord beyond the
// between-tip membrane line, so the taut bays cannot collapse into the plane wing at chase
// distance (audit round 2). None of that exists yet.
function buildUnderlitCrescentWings(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const halfSpan = (model.wingSpan ?? 1.55) * (model.spanScale ?? 1);

  // I0 membrane material: DARK and NON-EMISSIVE. The top membrane stays black through the whole
  // build — `wingMembraneEmissive: 0x000000` on the def is what stops the shared rig's
  // unconditional boost term (dragon.js:1970-1990) lighting the wing TOPS on every boost, which
  // would break the dark-top law outside Surge entirely (audit B3).
  // Cool char, inside the sourced albedo band — NOT warm-tinted. A warm membrane would paint the
  // heat into the diffuse, which is precisely the Ember-starter lane this creature must not
  // collide with: on Fornax every warm photon is EMITTED at I4, never painted.
  const wingMat = new THREE.MeshStandardMaterial({
    color: def.wingInner ?? 0x262629, emissive: 0x000000, flatShading: true, roughness: 0.82,
    metalness: 0.02, side: THREE.DoubleSide, transparent: true, opacity: 0.94,
  });

  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    // Build CANONICAL (+X) for BOTH sides and reflect the LEFT with an OUTER wrapper. The
    // wingParts poser writes IDENTICAL L/R rotations and relies on an outer reflection to make
    // them symmetric; `pivot.scale.x = -1` is flip-then-rotate and desyncs .y/.z (wingsymprobe
    // Δ0.000 → ~3.0). This is the single most-recorded motion bug in the house ledger.
    const rootC = attach.wingRoot(1);
    const pivot = new THREE.Group();
    pivot.position.set(rootC.x, rootC.y, rootC.z);
    pivot.userData.wingRole = 'pivot';

    // 3-segment cascade: pivot = shoulder, mid = forearm (lagged curl), tip = the HAND folding at
    // the wrist. The hand carries the WHOLE connected membrane so the fold never tears it — any
    // geometry spanning the joint must keep all its vertices on one side of it.
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);

    // Carpal knuckle. wristT 0.30 is the sheet's differentiator against Vesper's 0.21 — but it
    // sits at the TOP of the house 0.2-0.3 band, and pulling the wrist INBOARD is what makes the
    // fold read (ref §4.4). I2's flapstrip must confirm the fold survives at 0.30 before the dial
    // locks; if it doesn't, the wrist moves inboard and archRise carries the planform split alone.
    const wristT = model.wristT ?? 0.30;
    const K = [halfSpan * wristT, 0.04, 0.02];

    const arm = new THREE.Group();
    const armBone = blockout(halfSpan * wristT, 0.07, 0.10, wingMat);
    armBone.position.set(halfSpan * wristT * 0.5, 0.02, 0.01);
    arm.add(armBone);
    mid.add(arm);                       // arm rides the forearm

    const hand = new THREE.Group();
    const handSheet = blockout(halfSpan * (1 - wristT), 0.03, 0.62, wingMat);
    handSheet.position.set(halfSpan * wristT + halfSpan * (1 - wristT) * 0.5, 0.04, 0.14);
    hand.add(handSheet);
    tip.position.set(K[0], K[1], K[2]);       // fold axis = the carpal knuckle
    hand.position.set(-K[0], -K[1], -K[2]);   // −anchor → assembled REST pose byte-identical
    tip.add(hand);

    if (side === -1) { const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(pivot); group.add(lmirror); }
    else group.add(pivot);

    const s = side === 1 ? 'R' : 'L';
    // The FX marker rides the FOLDING group (hand), not the body — otherwise trails emit from
    // where the wingtip used to be. It must also duplicate the geometry's own profile.
    const marker = new THREE.Object3D();
    marker.position.set(halfSpan, 0.04, 0.02);
    hand.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip;
    pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * halfSpan, root.y + 0.04, root.z + 0.02], length: halfSpan, tipObj: marker });
  }
  return { group, spineMats, wingMat, parts: { ...pivots, wingElements } };
}
registerWings('underlitCrescentWings', buildUnderlitCrescentWings);

// --- HEAD: brandSkull --------------------------------------------------------
// I3 builds the dorsal-S profile (keel → brow dip → rising occiput) with the single dominant
// backswept occipital pair at 135° and ×0.66 decaying followers. Ref §6's load-bearing finding:
// orbit Ø ≈ 0.20 × skull length and NEGATIVELY allometric — the house instinct to enlarge eyes is
// backwards, and the glare belongs in brow BONE, not eyeball. Marked SETTLED in the sheet so a
// later pass doesn't "fix" the eyes bigger.
function buildBrandSkull(def, model, mats) {
  const group = new THREE.Group();
  const spineMats = [];
  const len = (model.skullLen ?? 0.42) * (model.headScale ?? 1);
  const skull = blockout(len * 0.62, len * 0.58, len, mats.bodyMat);   // W:H ~1.07 (ref §6 target 1.0-1.2)
  group.add(skull);
  // Eyes are NOT in the surge arrays — they are driven separately, and putting them in spineMats
  // is what makes "only the eyes glow in cruise" quietly false.
  const eye = blockout(len * 0.10, len * 0.10, len * 0.08, mats.eyeMat);
  eye.position.set(len * 0.22, len * 0.16, -len * 0.12);
  group.add(eye);
  const eyeL = eye.clone(); eyeL.position.x *= -1; group.add(eyeL);
  return { group, spineMats, headLength: len };
}
registerHead('brandSkull', buildBrandSkull);

// --- TAIL: firebrandTail -----------------------------------------------------
// No spade — the research killed it (Fox-Davies 1909: the barb is "a comparatively recent
// addition"; Tudor dragons "invariably" ended in a smooth blunt point). Silhouette duty moves to
// a dominant+decay dorsal ridge and the terminus is a blunt char-capped FIREBRAND that vents THE
// STOKE at I4. Ref §2: tail length has NO consistent natural relationship to torso — 2.6× is a
// declared composition choice, not a derived number, and the sheet says so.
function buildFirebrandTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  group.position.set(0, anchor.y, anchor.z);
  const nJoints = model.tailJoints ?? 4;
  const segLen = ((model.tailLength ?? 1) * 2.6) / nJoints;

  // NESTED isBone chain — each child offset by the inter-joint vector. joints[0].isBone = true
  // makes it ROTATION-ONLY: position writes tear a connected loft.
  const segs = [];
  let parent = group;
  for (let i = 0; i < nJoints; i++) {
    const j = new THREE.Group();
    j.position.set(0, 0, i === 0 ? 0 : segLen);
    j.isBone = true;
    const taper = 1 - (i / nJoints) * 0.62;   // fattest segments sit AFT of the hip (ref §2)
    const stem = blockout(0.20 * taper, 0.20 * taper, segLen, mats.bodyMat);
    stem.position.z = segLen * 0.5;
    j.add(stem);
    parent.add(j);
    parent = j;
    segs.push(j);
  }
  return { group, segs };
}
registerTail('firebrandTail', buildFirebrandTail);
