import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { mulberry32 } from './util.js';
import { createBossCommon, makeEnergyShell } from './bossKit.js';

// STORMREND's body — the EYE-OF-THE-STORM MANDALA: "concentric counter-rotating
// rings of storm blades around one huge unblinking eye." Second archetype in the
// system (CP3), built on the exact same bossKit plumbing as bossIdol.js's Hollow
// Idol-Mask, but a totally different silhouette/motion identity: the idol reads
// through a SHAPE telegraph (jaw hinge) and broken negative space (halo gaps,
// eye sockets); the mandala reads through MOTION (three independently spun rings)
// and a SINGLE overwhelming focal point (the eye) that petals shutter over.
//
// HARD DESIGN LAWS (learned the expensive way over 5 idol iteration rounds —
// see LEAPFROG.md): no enclosing fresnel shell around the whole build (reads as
// a teal balloon and kills the silhouette — the ONLY shell here is the small
// eye corona, local to the focal point); the eye is HDR-overdriven so it's
// unambiguously the brightest thing on the boss; the dark storm-metal body is
// split into merged value-tier groups with DIFFERENT base colours/emissive
// intensities (uniform emissive reads as a flat sticker); base colours stay
// near-black desaturated — the teal/gold identity lives in emissive accents,
// not the diffuse colour.
//
// GEOMETRY BUDGET (target ~2,500-3,500 tris @ quality 1, hard ceiling 6,000 —
// tests/boss.mjs). mergeGeometries HARD-FAILS (returns null) on any attribute
// mismatch, so every part strips `uv`/`uv2` and normalises to non-indexed
// before merging (identical `strip()` idiom to bossIdol.js).
//
// CONTRACT: boss.js stomps `group.rotation` every frame (placeGroup) and
// `kit.setDissolve` owns `group.scale` — every animated part here lives on
// `rig` or pivots underneath it, never on `group` itself.

export function buildStormMandala(def, quality = 1) {
  const accent = def.accent ?? 0x2fd8e8;   // storm teal — the identity colour, lives in emissive only
  const glow = def.glow ?? 0xffd870;       // gold storm-light — corona + scar seam only
  const lowQ = quality < 0.75;

  // Shared plumbing — shieldRadius/hpBarY per the brief: the rings are WIDE
  // (ring C's rail sits at r=6.5) so the HP bar floats well clear of the top
  // blade sweep. Note the shield bubble (r=4.8) deliberately sits INSIDE ring C's
  // radius — it wraps the eye/hub/inner rings (the "core" being protected),
  // while the outer storm-blade ring reads as machinery outside the ward, not
  // a body part the shield needs to fully enclose.
  const kit = createBossCommon(def, quality, { shieldRadius: 4.8, hpBarY: 5.2 });
  const { group, track } = kit;
  group.userData.archetype = 'stormMandala';   // guards the legacy-fallback coexist path (tests/boss.mjs)

  const rig = new THREE.Group();
  group.add(rig);

  const rnd = mulberry32(0x57081ae0);

  // Same strip() idiom as bossIdol.js — see that file's header comment for the
  // full mergeGeometries attribute-mismatch rationale.
  const strip = (geo) => {
    geo.deleteAttribute('uv');
    if (geo.attributes.uv2) geo.deleteAttribute('uv2');
    if (geo.index) geo = geo.toNonIndexed();
    return geo;
  };
  const mergeParts = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildStormMandala: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // Depth layout: the eye sits at the true centre; the iris hinge plane sits
  // IN FRONT of the eye (so closed petals actually occlude it via the depth
  // test, not just overlap it in XY); the three vane rings step back in Z as
  // they step out in radius (A closest/smallest → C furthest/largest) so the
  // "concentric layers" read as genuine depth, not a flat decal stack.
  // Round-2 gate: z-steps of 0.2 gave zero parallax — the three rings fused
  // into one flat shard cloud. Deepened to ±~0.5 so the layers visibly slide
  // over each other as they counter-rotate.
  const EYE_Z = 0.5;
  const CORONA_Z = 0.4;
  const IRIS_Z = 0.95;
  const COLLAR_Z = 0.05;
  const RING_Z = { A: 0.45, B: 0.0, C: -0.6 };

  // ---------------------------------------------------------------------
  // VALUE-TIER MATERIALS. Per the design law: 2-3 dark storm-metal tiers with
  // DIFFERENT base colours/emissive intensities, teal identity in emissive
  // only. Each vane ring gets its OWN instance (not shared with the static
  // petal/collar parts of the same tier) specifically so setCharge can ramp
  // each ring's emissive independently — that per-ring telegraph is the whole
  // point of the "storm winding up toward release" read.
  // ---------------------------------------------------------------------
  const petalMat = track(new THREE.MeshStandardMaterial({
    color: 0x0d1418, emissive: accent, emissiveIntensity: 0.06, roughness: 0.55, metalness: 0.35, flatShading: true,
  }));
  const collarMat = track(new THREE.MeshStandardMaterial({
    color: 0x121b20, emissive: accent, emissiveIntensity: 0.12, roughness: 0.5, metalness: 0.35, flatShading: true,
  }));
  const RING_BASE_EI = { A: 0.12, B: 0.06, C: 0.18 };
  const ringAMat = track(new THREE.MeshStandardMaterial({
    color: 0x121b20, emissive: accent, emissiveIntensity: RING_BASE_EI.A, roughness: 0.5, metalness: 0.35, flatShading: true,
  }));
  const ringBMat = track(new THREE.MeshStandardMaterial({
    color: 0x0d1418, emissive: accent, emissiveIntensity: RING_BASE_EI.B, roughness: 0.55, metalness: 0.35, flatShading: true,
  }));
  const ringCMat = track(new THREE.MeshStandardMaterial({
    color: 0x17262b, emissive: accent, emissiveIntensity: RING_BASE_EI.C, roughness: 0.45, metalness: 0.35, flatShading: true,
  }));

  // ---------------------------------------------------------------------
  // EYE CORE — the single brightest thing on the boss (focal-point law).
  // HDR-overdriven copy of the idol's EYE_HOT pattern: the composer renders
  // to a HalfFloat target and the bloom threshold is 1.0 linear (postfx.js
  // UnrealBloomPass arg / :204), so a color multiplied past 1.0 genuinely
  // blooms instead of just looking "bright white" — and toneMapped=false
  // keeps it hot on the no-postfx fallback where materials tone-map
  // individually instead of once in OutputPass.
  // ---------------------------------------------------------------------
  const eyeSeg = lowQ ? [10, 8] : [14, 10];
  const eyeGeo = new THREE.SphereGeometry(1.15, eyeSeg[0], eyeSeg[1]);
  eyeGeo.translate(0, 0, EYE_Z);
  const EYE_BASE = new THREE.Color(0xfff6d8);   // near-white-gold, unblinking
  const EYE_HOT = 2.4;
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xfff6d8 }));
  eyeMat.toneMapped = false;
  eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
  rig.add(eyeMesh);

  // ---------------------------------------------------------------------
  // EYE CORONA — the ONE allowed local shell (law 1 explicitly permits this:
  // small, centred on the focal point, not an enclosing body shell). Gold, so
  // it reads as a second identity colour ringing the eye rather than
  // competing with the eye's own white-hot core.
  // ---------------------------------------------------------------------
  const coronaSeg = lowQ ? [8, 6] : [12, 8];
  const coronaMat = track(makeEnergyShell(glow, { power: 2.0, strength: 0.9 }));
  const coronaGeo = new THREE.SphereGeometry(1.5, coronaSeg[0], coronaSeg[1]);
  coronaGeo.translate(0, 0, CORONA_Z);
  const corona = new THREE.Mesh(coronaGeo, coronaMat);
  rig.add(corona);

  // ---------------------------------------------------------------------
  // IRIS PETALS ×8 — individual pivot meshes (not InstancedMesh: the plan's
  // own risk-mitigation calls this the simpler fallback given the dissolve/
  // tracking constraints, and the stress test found draws this small are
  // noise). Each is a trapezoid wedge extruded thin, hinge edge at LOCAL
  // ORIGIN (x=0, the ring-contact point) with the tip reaching toward the
  // eye at x=-len — so `mesh.rotation.y` alone is the open/close hinge: at
  // rotation.y=0 the wedge lies flat, tip fully extended over the eye
  // (shingled/closed); increasing rotation.y retracts the tip back toward
  // the hinge (radial reach shrinks — open/exposed), matching the brief's
  // "closed = shingled, open = flared outward" read via simple retraction
  // rather than a full 3D flip.
  // ---------------------------------------------------------------------
  const IRIS_HINGE_R = 1.55;
  const PETAL_LEN = 1.3, PETAL_W = 0.62, PETAL_TIP_W = 0.18, PETAL_THICK = 0.10;
  function buildPetalGeo() {
    const shape = new THREE.Shape();
    // Wound CCW (checked via shoelace) so the extrude's front cap normal
    // faces +Z, matching the idol's "front cap faces the winding direction"
    // convention — the petal's visible face must front the camera.
    shape.moveTo(0, -PETAL_W / 2);
    shape.lineTo(0, PETAL_W / 2);
    shape.lineTo(-PETAL_LEN, PETAL_TIP_W / 2);
    shape.lineTo(-PETAL_LEN, -PETAL_TIP_W / 2);
    shape.closePath();
    const geo = strip(new THREE.ExtrudeGeometry(shape, {
      depth: PETAL_THICK, steps: 1, bevelEnabled: false, curveSegments: 1,
    }));
    geo.translate(0, 0, -PETAL_THICK / 2);   // centre the thin slab on the hinge plane
    return geo;
  }
  const petalGeoShared = buildPetalGeo();   // one geometry, 8 mesh instances (cheap draws, one program)
  const petalCount = lowQ ? 6 : 8;
  const petals = [];
  for (let i = 0; i < petalCount; i++) {
    const a = (i / petalCount) * Math.PI * 2;
    const pivot = new THREE.Object3D();
    pivot.position.set(Math.cos(a) * IRIS_HINGE_R, Math.sin(a) * IRIS_HINGE_R, IRIS_Z);
    pivot.rotation.z = a;   // orients local +X outward (radial) and +Y tangential (the hinge axis)
    const mesh = new THREE.Mesh(petalGeoShared, petalMat);
    mesh.name = 'irisPetal';   // tests/tooling seam: the telegraph-silhouette gate finds these by name
    pivot.add(mesh);
    rig.add(pivot);
    petals.push(mesh);
  }

  // ---------------------------------------------------------------------
  // HUB COLLAR + SPOKES — static ring frame behind the petals/eye, merged
  // into one mid-tier draw.
  // ---------------------------------------------------------------------
  const collarTubular = lowQ ? 16 : 24;
  const collarGeo = strip(new THREE.TorusGeometry(1.9, 0.22, 8, collarTubular));
  collarGeo.translate(0, 0, COLLAR_Z);
  const collarParts = [collarGeo];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const spoke = strip(new THREE.BoxGeometry(1.0, 0.18, 0.18));
    spoke.translate(1.4, 0, 0);   // spans radius 0.9→1.9 along local +X before the rotate below
    spoke.rotateZ(a);
    spoke.translate(0, 0, COLLAR_Z);
    collarParts.push(spoke);
  }
  rig.add(new THREE.Mesh(mergeParts(collarParts, 'hub-collar'), collarMat));

  // ---------------------------------------------------------------------
  // VANE RINGS A/B/C — swept storm blades (thin flattened cones), rotated
  // off-tangent so the ring reads as a swirling turbine rather than a radial
  // spike crown. `windDir` flips both the tangent direction and the SWIRL_OFF
  // lean, so ring B genuinely reads as counter-rotating debris against A/C —
  // matching the idle spin signs below (+0.5 / -0.35 / +0.22).
  //
  // Round-2 gate: free-floating blades read as a chaotic shard cloud, not
  // three rings — nothing visually connected the blades of one ring into a
  // wheel. Each ring now merges a thin torus RAIL at its root radius (same
  // material, zero extra draws): three crisp concentric hoops that the blades
  // mount on, which is what makes "concentric counter-rotating rings" legible
  // at fight distance. Blades also slimmed (cone r 0.5 → 0.32 — base width
  // 1.0 filled ~40% of the ring circumference and fused neighbours together)
  // and the ring radii spread further apart so a band of sky shows between
  // each layer.
  // ---------------------------------------------------------------------
  const SWIRL_OFF = THREE.MathUtils.degToRad(35);
  function buildBlade(radius, angle, len, windDir, z) {
    let geo = strip(new THREE.ConeGeometry(0.32, len, 4));
    geo.scale(1, 1, 0.35);         // flatten into a blade cross-section
    geo.translate(0, len / 2, 0);  // root (base) at local origin, tip (apex) at local +Y
    const tangentAngle = angle + windDir * (Math.PI / 2);
    const dirAngle = tangentAngle + windDir * SWIRL_OFF;
    const dir = new THREE.Vector3(Math.cos(dirAngle), Math.sin(dirAngle), 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    geo.applyQuaternion(q);
    geo.translate(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
    return geo;
  }
  // The scar: one blade on ring C snapped down to a short jagged stub instead
  // of a full vane — the asymmetric-scar idiom from the idol's broken horn,
  // transplanted onto "one ring member is damaged" instead of "one head part".
  function buildScarStub(radius, angle, windDir, z) {
    let geo = strip(new THREE.CylinderGeometry(0.22, 0.32, 0.5, 6, 1, false));
    const pos = geo.attributes.position;
    const srnd = mulberry32(0xbadb1ade);
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0.1) {   // jagged break only on the top (broken) ring of verts
        pos.setY(i, pos.getY(i) + (srnd() - 0.5) * 0.22);
        pos.setX(i, pos.getX(i) + (srnd() - 0.5) * 0.08);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    geo.translate(0, 0.25, 0);
    const tangentAngle = angle + windDir * (Math.PI / 2);
    const dir = new THREE.Vector3(Math.cos(tangentAngle), Math.sin(tangentAngle), 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    geo.applyQuaternion(q);
    geo.translate(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
    return geo;
  }
  function buildRing(radius, count, len, windDir, z, scarIdx = -1) {
    const parts = [];
    // The rail hoop — the piece that makes the blades read as ONE wheel.
    const railTubular = lowQ ? 24 : 36;
    const rail = strip(new THREE.TorusGeometry(radius, 0.09, 5, railTubular));
    rail.translate(0, 0, z);
    parts.push(rail);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      parts.push(i === scarIdx
        ? buildScarStub(radius, a, windDir, z)
        : buildBlade(radius, a, len, windDir, z));
    }
    return parts;
  }

  const bladeCounts = lowQ ? { A: 6, B: 8, C: 9 } : { A: 8, B: 10, C: 12 };
  const SCAR_IDX = 0;   // ring C, blade index 0 — the broken vane
  const RING_R = { A: 3.1, B: 4.7, C: 6.5 };

  const ringAPivot = new THREE.Object3D();
  ringAPivot.add(new THREE.Mesh(
    mergeParts(buildRing(RING_R.A, bladeCounts.A, 2.0, 1, RING_Z.A), 'ring-A'), ringAMat));
  rig.add(ringAPivot);

  const ringBPivot = new THREE.Object3D();
  ringBPivot.add(new THREE.Mesh(
    mergeParts(buildRing(RING_R.B, bladeCounts.B, 2.6, -1, RING_Z.B), 'ring-B'), ringBMat));
  rig.add(ringBPivot);

  const ringCPivot = new THREE.Object3D();
  ringCPivot.add(new THREE.Mesh(
    mergeParts(buildRing(RING_R.C, bladeCounts.C, 3.2, 1, RING_Z.C, SCAR_IDX), 'ring-C'), ringCMat));
  rig.add(ringCPivot);

  // GOLD VANE TIPS — ring C's blades get gilt tips (one extra draw, parented
  // to the ring pivot so they ride the spin): a ring of glints circling the
  // outer rim, tying the outer storm wheel to the corona/scar gold without
  // brightening the whole ring. The scar blade gets no tip — it's snapped.
  const tipMat = track(new THREE.MeshStandardMaterial({
    color: 0x2a2415, emissive: glow, emissiveIntensity: 0.85, roughness: 0.4, metalness: 0.5, flatShading: true,
  }));
  const tipParts = [];
  const TIP_LEN = 0.55;
  for (let i = 0; i < bladeCounts.C; i++) {
    if (i === SCAR_IDX) continue;
    const a = (i / bladeCounts.C) * Math.PI * 2;
    // Same orientation math as buildBlade (windDir=1 for ring C) so each tip
    // caps its blade's apex exactly: root at the rail, apex at root + dir*len.
    const dirAngle = a + Math.PI / 2 + SWIRL_OFF;
    const dir = new THREE.Vector3(Math.cos(dirAngle), Math.sin(dirAngle), 0);
    let tip = strip(new THREE.ConeGeometry(0.14, TIP_LEN, 4));
    tip.scale(1, 1, 0.35);
    tip.translate(0, 3.2 - TIP_LEN / 2, 0);   // sit over the blade's outer end
    tip.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
    tip.translate(Math.cos(a) * RING_R.C, Math.sin(a) * RING_R.C, RING_Z.C);
    tipParts.push(tip);
  }
  ringCPivot.add(new THREE.Mesh(mergeParts(tipParts, 'ring-C-tips'), tipMat));

  // STORM ARCS — jagged lightning bolts flickering between the ring rails:
  // the mandala's namesake weather (the first build had rings and an eye but
  // no STORM). Static jagged LineSegments, one per gap span; all the life is
  // in opacity — sin clipped to a high power gives brief sharp flashes, each
  // bolt on its own frequency/phase so the storm CRACKLES instead of
  // blinking in sync. Anchored to the static rig, not the ring pivots:
  // lightning doesn't ride machinery, it jumps between it.
  function buildBolt(r0, r1, ang, zi, zo, seed) {
    const brnd = mulberry32(seed);
    const pts = [];
    const segs = 5;
    let p = new THREE.Vector3(Math.cos(ang) * r0, Math.sin(ang) * r0, zi);
    for (let s = 1; s <= segs; s++) {
      const u = s / segs;
      const r = r0 + (r1 - r0) * u;
      const a2 = ang + (brnd() - 0.5) * 0.22;
      const next = new THREE.Vector3(
        Math.cos(a2) * r, Math.sin(a2) * r,
        zi + (zo - zi) * u + (brnd() - 0.5) * 0.15);
      pts.push(p.x, p.y, p.z, next.x, next.y, next.z);
      p = next;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }
  const boltDefs = [
    { r0: RING_R.A, r1: RING_R.B, zi: RING_Z.A, zo: RING_Z.B, ang: 0.7, f: 2.3, ph: 0.0 },
    { r0: RING_R.B, r1: RING_R.C, zi: RING_Z.B, zo: RING_Z.C, ang: 2.0, f: 2.9, ph: 4.2 },
    { r0: RING_R.A, r1: RING_R.B, zi: RING_Z.A, zo: RING_Z.B, ang: 3.5, f: 1.7, ph: 2.1 },
    { r0: RING_R.B, r1: RING_R.C, zi: RING_Z.B, zo: RING_Z.C, ang: 5.1, f: 1.3, ph: 1.3 },
  ];
  const bolts = [];
  const boltCount = lowQ ? 2 : 4;
  for (let i = 0; i < boltCount; i++) {
    const bd = boltDefs[i];
    // One material per bolt (LineBasic — trivially cheap) so each flashes on
    // its own clock; a shared material would strobe them in lockstep.
    const mat = track(new THREE.LineBasicMaterial({
      color: accent, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    rig.add(new THREE.LineSegments(buildBolt(bd.r0, bd.r1, bd.ang, bd.zi, bd.zo, 0xb017 + i * 97), mat));
    bolts.push({ mat, f: bd.f, ph: bd.ph });
  }

  // Scar seam: short jagged gold lines fanning from the broken vane's root —
  // WebGL ignores linewidth, so bloom (additive blending) is what fattens
  // this into a readable crack, same fallback bossIdol.js documents.
  function buildScarSeam() {
    const scarAngle = (SCAR_IDX / bladeCounts.C) * Math.PI * 2;
    const root = new THREE.Vector3(Math.cos(scarAngle) * RING_R.C, Math.sin(scarAngle) * RING_R.C, RING_Z.C + 0.08);
    const srnd = mulberry32(0xc0ffee11);
    const pts = [];
    for (let b = 0; b < 5; b++) {
      let p = root.clone();
      for (let s = 0; s < 2; s++) {
        const next = p.clone().add(new THREE.Vector3((srnd() - 0.5) * 0.7, (srnd() - 0.5) * 0.7, (srnd() - 0.5) * 0.2));
        pts.push(p.x, p.y, p.z, next.x, next.y, next.z);
        p = next;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }
  const seamMat = track(new THREE.LineBasicMaterial({
    color: glow, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const seams = new THREE.LineSegments(buildScarSeam(), seamMat);
  // Parented to ring C's PIVOT (not the static rig) so the gold crack rides
  // with the broken vane as the ring spins instead of drifting off it.
  ringCPivot.add(seams);

  // ---------------------------------------------------------------------
  // ORBITERS ×3 — keep the ringBlade tori identity from the legacy body, but
  // DARK with a dim teal accent (the idol's round-5 "pale wedge" lesson:
  // bright emissive on small flat-shaded orbiters reads as glitchy pale
  // debris, not intentional FX).
  // ---------------------------------------------------------------------
  const orbiterMat = track(new THREE.MeshStandardMaterial({
    color: 0x0a1013, emissive: accent, emissiveIntensity: 0.25, roughness: 0.35, metalness: 0.4, flatShading: true,
  }));
  const orbiterGeo = new THREE.TorusGeometry(0.62, 0.11, 6, 14);
  const orbiters = [];
  const orbiterCount = lowQ ? 2 : 3;
  for (let i = 0; i < orbiterCount; i++) {
    const m = new THREE.Mesh(orbiterGeo, orbiterMat);
    m.userData = { ang: (i / orbiterCount) * Math.PI * 2, radius: 3.6 + i * 0.4, speed: 1.1 + i * 0.25, baseY: 0, tilt: i * 0.5 };
    rig.add(m);
    orbiters.push(m);
  }

  // Hit flash targets the hub collar material (the static "body" read every
  // ring/petal frames against) — same idiom as the idol binding its base stone.
  kit.flashBind(collarMat, 0.12);

  // Shared plumbing is fully assembled now — cache base opacities + apply the
  // resting scale (finalize() also dev-asserts every material above went
  // through track()).
  kit.finalize();

  // ---------------------------------------------------------------------
  // ANIMATION
  // ---------------------------------------------------------------------
  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  // onShieldChange: "the storm holds its breath" — petals ease closed over
  // the eye, ring spin eases to 0.4x, eye dims. On release, `openKick` gives
  // the petals a brief overshoot PAST their resting angle before settling —
  // the "snap open" read the brief asks for, without a full spring model.
  let shieldOn = false;
  let openKick = 0;
  kit.onShieldChange((v) => {
    shieldOn = v;
    if (!v) openKick = 0.22;   // release: petals fling open past rest, then decay back
  });

  const DANGER_COLOR = new THREE.Color(0xff2b6a);   // danger role-colour (never per-boss)
  const _eyeColor = new THREE.Color();
  let closeAmt = 0;   // 0 = resting-open, 1 = fully shingled closed (eased toward shieldOn target)

  // Round-2: 0.90 rad left the petal tips reaching r≈0.74 — well inside the
  // eye (r 1.15), shuttering most of it at rest. 1.05 pulls the tips out to
  // r≈0.90 so the eye reads as a big hot disc fringed by dark petals instead
  // of a starburst peeking through an aperture.
  const REST_OPEN = 1.05;    // idle petal hinge angle (retracted enough to leave the eye visible)
  const TAU = Math.PI * 2;

  function tickBody(dt, time) {
    // --- Iris petals: ease closeAmt toward the shield target over ~0.35s. ---
    const closeTarget = shieldOn ? 1 : 0;
    const closeRate = dt / 0.35;
    closeAmt = closeAmt < closeTarget
      ? Math.min(closeTarget, closeAmt + closeRate)
      : Math.max(closeTarget, closeAmt - closeRate);
    if (openKick > 0) openKick = Math.max(0, openKick - dt / 0.25);

    const breathe = Math.sin(time * 0.7 * TAU) * 0.04;
    // theta=0 -> tip fully extended over the eye (closed/shingled); larger
    // theta retracts the tip toward the hinge (open/exposed). Charging and
    // the release overshoot both push theta UP (more open); a raised shield
    // scales the whole angle to zero (fully shingled) via closeAmt.
    const theta = Math.max(0, (REST_OPEN + breathe + charge * 0.15 + openKick) * (1 - closeAmt));
    for (const p of petals) p.rotation.y = theta;

    // --- Eye: HDR-overdriven pulse; dims + desaturates toward danger red as
    // charge rises; a raised shield leashes it down to ~0.8 (visibly muted
    // behind the closed petals) regardless of charge. ---
    const pulse = 1 + Math.sin(time * 3 * TAU) * 0.03 + charge * 0.35;
    eyeMesh.scale.setScalar(pulse);
    const activeK = 1;   // full ignition when not shielded (HDR overdrive carries the "unblinking" read)
    const eyeK = THREE.MathUtils.lerp(activeK, 0.8, closeAmt);
    _eyeColor.copy(EYE_BASE).lerp(DANGER_COLOR, charge * 0.85);
    eyeMat.color.copy(_eyeColor).multiplyScalar(eyeK * EYE_HOT);

    // --- Corona: idle pulse at its own frequency + a mild charge swell (the
    // ONE local shell, allowed to react — it's tied to the focal point, not
    // a backdrop flare). ---
    coronaMat.uniforms.uStrength.value = 0.9 + Math.sin(time * 1.7 * TAU) * 0.15 + charge * 0.25;

    // --- Vane rings: idle counter-rotation + charge stagger OUTER-FIRST (the
    // storm winds up inward toward release) + a uniform 0.4x ease while
    // shielded ("holds its breath"). Per-ring emissive ramps on its own
    // stagger so the ring about to matter visibly brightens first. ---
    const kC = charge;
    const kB = Math.max(0, Math.min(1, (charge - 0.33) / 0.67));
    const kA = Math.max(0, Math.min(1, (charge - 0.66) / 0.34));
    const spinMult = (k) => THREE.MathUtils.lerp(1 + 2.5 * k, 0.4, closeAmt);
    ringAPivot.rotation.z += dt * 0.5 * spinMult(kA);
    ringBPivot.rotation.z -= dt * 0.35 * spinMult(kB);
    ringCPivot.rotation.z += dt * 0.22 * spinMult(kC);
    ringAMat.emissiveIntensity = RING_BASE_EI.A + kA * 0.35;
    ringBMat.emissiveIntensity = RING_BASE_EI.B + kB * 0.35;
    ringCMat.emissiveIntensity = RING_BASE_EI.C + kC * 0.35;

    // Scar-seam shimmer (idle, its own frequency) + a shield-strain brighten.
    seamMat.opacity = (0.45 + Math.sin(time * 1.3) * 0.15) + (shieldOn ? 0.25 : 0);

    // Storm arcs: sin clipped to a high power = brief sharp flashes on each
    // bolt's own clock; charging makes the whole storm crackle harder (the
    // arcs join the telegraph without adding any new geometry or fill).
    for (const b of bolts) {
      const s = Math.sin(time * b.f + b.ph);
      b.mat.opacity = Math.pow(Math.max(0, s), 12) * (0.55 + charge * 0.45);
    }

    // Orbiters — legacy loop, unchanged.
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(Math.cos(u.ang) * u.radius, u.baseY + Math.sin(time * 1.6 + u.tilt) * 0.5, Math.sin(u.ang) * u.radius);
      o.rotation.x += dt * 2;
      o.rotation.y += dt * 1.4;
    }
  }

  // Muzzle: bullets originate at the eye.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0, 1.8);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    setDissolve: kit.setDissolve,
    setCharge,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: kit.flash,
    // Write order matches every other archetype: body tick first, kit.tickCommon
    // (flash decay) last so a hit flash always wins on a shared material.
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
