import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { mulberry32 } from './util.js';
import { makeEnergyShell, createBossCommon } from './bossKit.js';

// VOIDMAW's body — the HOLLOW IDOL-MASK: "a wide shattered stone mask with
// hollow eyes, one broken horn, and a broken halo floating behind it." This is
// the archetype system's hero build (CP2) — it proves that bossKit's shared
// plumbing (HP bar, shield bubble, dissolve, flash) can carry a genuinely
// different silhouette instead of the legacy crystal-core recipe.
//
// SILHOUETTE-FIRST design (per the boss-design research this project is built
// on): one focal point (the eyes — brightest emissive in the whole graph), a
// telegraph that changes the SHAPE of the boss (the jaw hinges open, not just
// glows brighter), and real negative space (the eye sockets are actual holes —
// sky shows through when dormant; the halo is broken arcs with gaps, not a
// closed ring) so the reads survive being reduced to a silhouette at 30m.
//
// GEOMETRY BUDGET (target ~3,100 tris @ quality 1, hard ceiling 6,000 —
// tests/boss.mjs). Every stone-material part is baked (translate/rotate/scale
// on the GEOMETRY, never the mesh transform — those THREE.BufferGeometry
// methods bake via applyMatrix4 internally, same effect as calling it by hand)
// and merged into ONE draw call via mergeGeometries (the dragonHull/dragonTail
// precedent). mergeGeometries HARD-FAILS (returns null) on any attribute-set
// mismatch, so every part strips its `uv` (ExtrudeGeometry carries one; the
// primitive geometries used here don't need it) before merging — see `strip()`.
//
// CONTRACT: boss.js stomps `group.rotation` every frame (placeGroup) and
// `kit.setDissolve` owns `group.scale` — so every animated part here lives on
// `rig` (an inner group) or on pivots underneath it, never on `group` itself.

export function buildIdolMask(def, quality = 1) {
  const accent = def.accent ?? 0xff4488;
  const glow = def.glow ?? 0xff88cc;
  const BASE_SCALE = def.scale ?? 1.5;
  const lowQ = quality < 0.75;

  // Shared plumbing (HP bar, shield bubble + shards, dissolve, flash decay) —
  // see bossKit.js. The mask is wider than the legacy crystal core, so the
  // shield bubble and HP bar float further out to clear the broken horn/halo.
  const kit = createBossCommon(def, quality, { shieldRadius: 4.6, hpBarY: 4.8, baseScale: BASE_SCALE });
  const { group, track } = kit;
  group.userData.archetype = 'idolMask';   // guards the legacy-fallback coexist path (tests/boss.mjs)

  // Every archetype-animated part attaches here, NOT to `group` (see contract above).
  const rig = new THREE.Group();
  group.add(rig);

  // Deterministic scatter (ornament chips, seams, jitter) — same seed every
  // build so the mask reads identically run to run (no per-frame or per-load
  // shape popping) while still looking hand-broken, not radially symmetric.
  const rnd = mulberry32(0x1d017a5c);

  // Strips `uv` (and `uv2`, which ExtrudeGeometry also emits) so every part
  // handed to mergeGeometries carries the exact same attribute SET
  // (position+normal only) — the #1 risk in the plan (mergeGeometries returns
  // null, silently, on any mismatch; there is no error otherwise). It also
  // normalises indexing: three.js's Polyhedron-based geometries (Icosahedron,
  // Octahedron) and ExtrudeGeometry are built NON-indexed while Box/Cylinder/
  // Sphere/Cone/Torus/Tube are indexed — mergeGeometries requires ALL inputs
  // indexed or NONE (a second, less-documented way it silently returns null),
  // so every part is normalised to non-indexed here.
  const strip = (geo) => {
    geo.deleteAttribute('uv');
    if (geo.attributes.uv2) geo.deleteAttribute('uv2');
    if (geo.index) geo = geo.toNonIndexed();
    return geo;
  };

  // ---------------------------------------------------------------------
  // MASK PLATE — an angular THREE.Shape extruded with two REAL hole paths for
  // the eye sockets. Outline wound CCW / holes wound CW (three.js convention
  // for a solid-with-holes shape); holes sit fully inside the outline so
  // earcut triangulates cleanly instead of silently degenerating.
  // ---------------------------------------------------------------------
  function buildMaskShape() {
    const shape = new THREE.Shape();
    // Wide angular pentagonal mask: broad brow (~4.4 units across at the
    // temples) tapering to a narrow chin point — the "wide shattered stone
    // mask" silhouette read at a glance, even reduced to a black shape.
    const outline = [
      [0.00, 2.15], [-0.55, 2.30], [-1.25, 2.05], [-1.95, 1.55], [-2.20, 0.85],
      [-2.05, 0.10], [-2.15, -0.55], [-1.85, -1.25], [-1.55, -1.85], [-1.05, -2.35],
      [-0.45, -2.65], [0.00, -2.75], [0.45, -2.65], [1.05, -2.35], [1.55, -1.85],
      [1.85, -1.25], [2.15, -0.55], [2.05, 0.10], [2.20, 0.85], [1.95, 1.55],
      [1.25, 2.05], [0.55, 2.30],
    ];
    shape.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i][0], outline[i][1]);
    shape.closePath();

    // Angular carved eye-socket hole, ~9 points, wound CW (opposite the
    // outline). `mirror` flips X *and* reverses point order so the mirrored
    // hole stays CW too (mirroring across X alone would flip it to CCW).
    const eyeHole = (cx, cy, mirror) => {
      const rel = [
        [0.00, 0.42], [0.30, 0.30], [0.48, 0.05], [0.38, -0.22], [0.12, -0.40],
        [-0.15, -0.38], [-0.40, -0.15], [-0.46, 0.12], [-0.18, 0.38],
      ];
      const pts = (mirror ? rel.slice().reverse() : rel).map(([x, y]) => [cx + (mirror ? -x : x), cy + y]);
      const path = new THREE.Path();
      path.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
      path.closePath();
      return path;
    };
    shape.holes.push(eyeHole(-1.05, 0.35, false));   // left socket
    shape.holes.push(eyeHole(1.05, 0.35, true));     // right socket (mirrored, still CW)
    return shape;
  }

  const maskGeo = strip(new THREE.ExtrudeGeometry(buildMaskShape(), {
    depth: 1.0, steps: 1, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.18,
    bevelSegments: 2, curveSegments: 1,
  }));
  // Shape was authored with the CCW winding needed for the extrude's cap at
  // z=depth to face +Z (front). Centre the slab on Z=0 so "front toward +z" ==
  // "front toward the player" and the eye-core glow (below, z≈-0.25) sits
  // inside the hollowed socket tunnel rather than in front of the mask.
  maskGeo.translate(0, 0, -0.6);   // front face → z≈0.4, back face → z≈-0.6
  const stoneParts = [maskGeo];

  // ---------------------------------------------------------------------
  // ORNAMENT PLATES — jittered chips scattered in bands (brow / temple /
  // cheek / chin) so the mask reads as carved/assembled stone, not a flat
  // extrude. Alternates box + triangular-prism silhouettes for texture
  // variety at near-zero extra cost.
  // ---------------------------------------------------------------------
  const chipBands = [
    { cx: 0.00, cy: 2.00, sx: 1.55, sy: 0.30 },   // brow ridge
    { cx: -1.85, cy: 0.85, sx: 0.45, sy: 0.85 },  // left temple
    { cx: 1.85, cy: 0.85, sx: 0.45, sy: 0.85 },   // right temple
    { cx: -1.70, cy: -1.00, sx: 0.45, sy: 0.65 }, // left cheek
    { cx: 1.70, cy: -1.00, sx: 0.45, sy: 0.65 },  // right cheek
    { cx: 0.00, cy: -2.10, sx: 0.95, sy: 0.35 },  // chin
  ];
  const chipCount = lowQ ? 10 : 18;
  for (let i = 0; i < chipCount; i++) {
    const band = chipBands[i % chipBands.length];
    const x = band.cx + (rnd() - 0.5) * 2 * band.sx;
    const y = band.cy + (rnd() - 0.5) * 2 * band.sy;
    const z = 0.42 + rnd() * 0.14;         // proud of the mask's front face
    const s = 0.20 + rnd() * 0.22;
    let chip = (i % 2 === 0)
      ? new THREE.BoxGeometry(s, s * (0.7 + rnd() * 0.6), s * 0.6)
      : new THREE.CylinderGeometry(s * 0.5, s * 0.5, s * 0.9, 3);   // triangular prism
    chip = strip(chip);   // strip() may return a NEW geometry (toNonIndexed) — must reassign, not just call
    chip.rotateX((rnd() - 0.5) * 0.6);
    chip.rotateY((rnd() - 0.5) * 0.6);
    chip.rotateZ(rnd() * Math.PI * 2);
    chip.translate(x, y, z);
    stoneParts.push(chip);
  }

  // ---------------------------------------------------------------------
  // HORNS — one intact (tapered TubeGeometry), one snapped stub (jagged-rim
  // cylinder). The asymmetry IS the scar: a mirrored pair of intact horns
  // would read as decoration, not damage.
  // ---------------------------------------------------------------------
  // Manual taper: THREE.TubeGeometry has no built-in radius falloff, so each
  // ring of vertices (generated at u = i/tubularSegments along the curve) is
  // scaled toward the curve's own centreline at that u — thick at the brow,
  // thin at the tip. Mirrors the "in-place bake" idiom used everywhere else
  // in this file, just applied per-ring instead of to the whole geometry.
  function taperTube(geo, curve, tubularSegments, radialSegments, taperFn) {
    const pos = geo.attributes.position;
    const ringVerts = radialSegments + 1;
    for (let i = 0; i <= tubularSegments; i++) {
      const u = i / tubularSegments;
      const c = curve.getPointAt(u);
      const k = taperFn(u);
      for (let j = 0; j < ringVerts; j++) {
        const idx = i * ringVerts + j;
        if (idx >= pos.count) continue;
        pos.setXYZ(idx, c.x + (pos.getX(idx) - c.x) * k, c.y + (pos.getY(idx) - c.y) * k, c.z + (pos.getZ(idx) - c.z) * k);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  const hornCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.85, 1.50, 0.25),   // base: left brow
    new THREE.Vector3(-2.35, 2.60, -0.35),  // sweeps up and back
    new THREE.Vector3(-2.05, 3.55, -1.35),  // tip
  ]);
  const hornTubular = 12, hornRadial = 8;
  const hornGeo = strip(new THREE.TubeGeometry(hornCurve, hornTubular, 0.24, hornRadial, false));
  taperTube(hornGeo, hornCurve, hornTubular, hornRadial, (u) => Math.max(0.16, 1 - u * 0.84));
  stoneParts.push(hornGeo);

  // Snapped stub on the RIGHT brow: a short 6-sided cylinder with its top ring
  // jittered in Y for a jagged break, instead of a clean cut.
  const stubGeo = strip(new THREE.CylinderGeometry(0.24, 0.30, 0.55, 6, 1, false));
  {
    const pos = stubGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0.2) {   // top ring only
        pos.setY(i, pos.getY(i) + (rnd() - 0.5) * 0.28);
        pos.setX(i, pos.getX(i) + (rnd() - 0.5) * 0.06);
      }
    }
    pos.needsUpdate = true;
    stubGeo.computeVertexNormals();
  }
  stubGeo.rotateX(0.12);
  stubGeo.rotateZ(-0.08);
  stubGeo.translate(1.85, 1.55, 0.25);
  stoneParts.push(stubGeo);

  // ---------------------------------------------------------------------
  // HEAD BACK-MASS — two lobes behind the mask, deliberately clear of the
  // two socket sight-lines so the sockets stay real holes with sky visible
  // through them, not a wall of stone one unit back.
  // ---------------------------------------------------------------------
  function jitterVerts(geo, amt, seedRnd) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i,
        pos.getX(i) + (seedRnd() - 0.5) * amt,
        pos.getY(i) + (seedRnd() - 0.5) * amt,
        pos.getZ(i) + (seedRnd() - 0.5) * amt);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
  // Placement is raycast-verified (a grid of front→back rays through each
  // socket must clear the stone — see the CP2 review): the lobes sit at CHEEK
  // height with their tops below the socket band, so the whole crown behind
  // the brow stays hollow — sky through the sockets AND over the brow line,
  // which is what sells "hollow idol" instead of "mask glued onto a head".
  for (const sx of [-1, 1]) {
    const lobe = strip(new THREE.IcosahedronGeometry(0.9, 1));
    jitterVerts(lobe, 0.12, rnd);
    lobe.scale(1.15, 1.25, 0.8);
    lobe.translate(sx * 1.55, -1.55, -1.0);
    stoneParts.push(lobe);
  }

  // ---- Merge every stone part into ONE geometry / ONE draw call ----
  const stoneGeo = mergeGeometries(stoneParts, false);
  if (!stoneGeo) throw new Error('buildIdolMask: stone mergeGeometries returned null (attribute mismatch)');
  const stoneMat = track(new THREE.MeshStandardMaterial({
    color: 0x14101c, emissive: accent, emissiveIntensity: 0.35, roughness: 0.55, metalness: 0.3, flatShading: true,
  }));
  const stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
  rig.add(stoneMesh);

  // ---------------------------------------------------------------------
  // JAW SLAB + TEETH — the attack telegraph. A separate draw (same stone
  // material) parented to a hinge pivot at the chin so `setCharge` can swing
  // it open — a SHAPE change, not just a colour change, per the boss-design
  // brief ("telegraphs that change the silhouette").
  // ---------------------------------------------------------------------
  const jawShape = new THREE.Shape();
  jawShape.moveTo(-1.30, 0.00);
  jawShape.lineTo(1.30, 0.00);
  jawShape.lineTo(0.85, -0.85);
  jawShape.lineTo(-0.85, -0.85);
  jawShape.closePath();
  const jawSlabGeo = strip(new THREE.ExtrudeGeometry(jawShape, {
    depth: 0.45, steps: 1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.06, bevelSegments: 1, curveSegments: 1,
  }));
  jawSlabGeo.translate(0, 0, -0.22);   // hinge edge (top, y=0) sits at the geometry origin
  const jawParts = [jawSlabGeo];
  for (let i = 0; i < 4; i++) {
    const tx = -0.85 + i * (1.70 / 3);
    const tooth = strip(new THREE.ConeGeometry(0.12, 0.34, 4));
    tooth.rotateX(Math.PI);            // apex down
    tooth.translate(tx, -0.02, 0.02);
    jawParts.push(tooth);
  }
  const jawGeo = mergeGeometries(jawParts, false);
  if (!jawGeo) throw new Error('buildIdolMask: jaw mergeGeometries returned null (attribute mismatch)');
  const jawPivot = new THREE.Object3D();
  jawPivot.position.set(0, -1.70, 0.60);
  const jawMesh = new THREE.Mesh(jawGeo, stoneMat);   // shares the stone material — separate draw, same "family"
  jawPivot.add(jawMesh);
  rig.add(jawPivot);

  // ---------------------------------------------------------------------
  // EYE CORES — the single brightest thing on the boss (focal-point law).
  // Sit just behind the socket plane so they read as ignited INSIDE the
  // hollow eyes rather than floating in front of the mask.
  // ---------------------------------------------------------------------
  const eyeSeg = lowQ ? [8, 6] : [10, 8];
  const eyeParts = [];
  for (const sx of [-1, 1]) {
    // r=0.45 vs the ~0.45-"radius" ANGULAR socket: the round core covers the
    // hole's middle while the hole's angular corners stay open — slivers of
    // sky around a hot ember, which is exactly the "ignited inside a hollow
    // socket" read (a bigger sphere would plug the hole and kill the
    // see-through entirely). Recessed to z −0.25 (front face is +0.40) so it
    // sits INSIDE the socket tunnel, not flush with the face.
    const eye = strip(new THREE.SphereGeometry(0.45, eyeSeg[0], eyeSeg[1]));
    eye.translate(sx * 1.05, 0.35, -0.25);
    eyeParts.push(eye);
  }
  const eyeGeo = mergeGeometries(eyeParts, false);
  if (!eyeGeo) throw new Error('buildIdolMask: eye mergeGeometries returned null (attribute mismatch)');
  const EYE_BASE = new THREE.Color(0xfff2ff);
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xfff2ff }));
  const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
  rig.add(eyeMesh);

  // ---------------------------------------------------------------------
  // THROAT GLOW — hidden behind the jaw at rest (opacity 0); floods light
  // through the mouth gap as the jaw hinges open on a charge.
  // ---------------------------------------------------------------------
  const throatGeo = new THREE.ConeGeometry(0.55, 1.0, 10, 1, true);   // open-ended: no caps
  const throatMat = track(new THREE.MeshBasicMaterial({
    color: accent, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  const throat = new THREE.Mesh(throatGeo, throatMat);
  throat.position.set(0, -1.85, 0.15);
  throat.rotation.x = Math.PI * 0.62;   // open (base) end faces down-forward, into the jaw gap
  rig.add(throat);

  // ---------------------------------------------------------------------
  // BROKEN HALO — two disjoint arcs (draw A) + one counter-rotating arc
  // (draw B), all with real gaps (never re-form a full ring — the negative
  // space IS the "broken" read). Torus geometry already lies flat facing +Z,
  // so no extra rotation is needed to face the player.
  // ---------------------------------------------------------------------
  // Fight-distance calibration (three capture rounds): radius 3.4 arcs sat
  // only ~1.2 units off the mask edge (2.2) — bloom fused mask + arcs into
  // one blob. Pushed to 4.0/4.4 there is a clear band of SKY between the
  // mask edge and the arcs, which is what makes "halo floating BEHIND it"
  // legible at 30m. Emissive 0.65 / tube 0.16: bright enough to read as the
  // second accent tier, dim enough that bloom doesn't close the arc gaps.
  const haloMat = track(new THREE.MeshStandardMaterial({
    color: 0x14101c, emissive: accent, emissiveIntensity: 0.65, roughness: 0.5, metalness: 0.3, flatShading: true,
  }));
  const haloTubularA = lowQ ? 14 : 24;
  const arcA1 = strip(new THREE.TorusGeometry(4.0, 0.16, 6, haloTubularA, Math.PI * 0.55));
  arcA1.rotateZ(0.20);
  const arcA2 = strip(new THREE.TorusGeometry(4.0, 0.16, 6, haloTubularA, Math.PI * 0.55));
  arcA2.rotateZ(Math.PI + 0.45);
  const haloAGeo = mergeGeometries([arcA1, arcA2], false);
  if (!haloAGeo) throw new Error('buildIdolMask: halo-A mergeGeometries returned null (attribute mismatch)');
  haloAGeo.translate(0, 0, -1.6);
  const haloA = new THREE.Mesh(haloAGeo, haloMat);
  rig.add(haloA);

  // Outer counter-arc stays inside the kit shield bubble (r 4.6): 4.4 + 0.13
  // tube ≈ 4.53, so a raised shield never clips through the halo.
  const haloTubularB = lowQ ? 12 : 20;
  const haloBGeo = strip(new THREE.TorusGeometry(4.4, 0.13, 6, haloTubularB, Math.PI * 0.4));
  haloBGeo.rotateZ(1.3);
  haloBGeo.translate(0, 0, -1.65);
  const haloB = new THREE.Mesh(haloBGeo, haloMat);
  rig.add(haloB);

  // ---------------------------------------------------------------------
  // CRACK SEAMS — a polyline fan radiating from the snapped horn across the
  // mask front. WebGL ignores `linewidth`, so these are visually 1px on their
  // own; bloom (additive blending) fattens them into a readable crack network
  // — the fallback the plan calls out, and it's cheap (0 tris).
  // ---------------------------------------------------------------------
  function buildSeams(targetSegments) {
    const seamRnd = mulberry32(0x5eed5eed);
    const origin = new THREE.Vector3(1.70, 1.35, 0.44);
    const targets = [
      new THREE.Vector3(0.20, 1.95, 0.44), new THREE.Vector3(-1.20, 1.05, 0.44),
      new THREE.Vector3(0.60, 0.20, 0.44), new THREE.Vector3(1.60, -0.60, 0.44),
      new THREE.Vector3(-0.30, -1.40, 0.44), new THREE.Vector3(1.00, -2.00, 0.44),
      new THREE.Vector3(-1.60, -1.60, 0.44),
    ];
    const perBranch = Math.max(2, Math.round(targetSegments / targets.length));
    const pts = [];
    for (const t of targets) {
      let p = origin.clone();
      for (let s = 0; s < perBranch; s++) {
        const u = (s + 1) / perBranch;
        const next = origin.clone().lerp(t, u);
        next.x += (seamRnd() - 0.5) * 0.18;
        next.y += (seamRnd() - 0.5) * 0.18;
        pts.push(p.x, p.y, p.z, next.x, next.y, next.z);
        p = next;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }
  const seamGeo = buildSeams(lowQ ? 24 : 40);
  // Gold-violet: the crack colour, mixed from the "intact stone" gold toward
  // this boss's violet accent so it reads as part of the SAME break, not a
  // generic damage-red decal.
  const seamColor = new THREE.Color(0xd8b45a).lerp(new THREE.Color(accent), 0.4);
  const seamMat = track(new THREE.LineBasicMaterial({
    color: seamColor, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const seams = new THREE.LineSegments(seamGeo, seamMat);
  rig.add(seams);

  // ---------------------------------------------------------------------
  // FRESNEL SHELL — exactly ONE (stress-test-calibrated cap: body shell +
  // kit shield rim when raised = 2 large additive volumes on screen, max).
  // Scaled to a wide, shallow mask silhouette instead of a sphere.
  // ---------------------------------------------------------------------
  // strength 0.3 / power 3.2 — DOWN from the planned 0.7/2.6: fight-distance
  // captures showed 0.7 + bloom swallowing the whole mask in a violet bubble
  // (it read as a permanently-raised shield, which also destroys the actual
  // shield state's meaning). At 0.3/3.2 the shell is a grazing-angle sheen
  // that gives the stone a void-energy skin without ever beating the eyes.
  const shellMat = track(makeEnergyShell(glow, { power: 3.2, strength: 0.3 }));
  const shellGeo = new THREE.IcosahedronGeometry(3.6, lowQ ? 1 : 2);
  const shell = new THREE.Mesh(shellGeo, shellMat);
  // HUG the mask (~2.7 × 2.9 × 1.8), don't balloon past it: at the planned
  // (1.15, 1.2, 0.7) the shell rim landed on the halo radius and the two
  // bloomed into one pink donut around a blob — the "permanent bubble" read
  // again. Tight against the stone, the fresnel rim outlines the MASK edge
  // itself: a void-energy skin, not a containment field.
  shell.scale.set(0.75, 0.8, 0.5);
  rig.add(shell);

  // ---------------------------------------------------------------------
  // ORBITERS — void chips (contract: ≥2). Animation loop copied from the
  // legacy bossModel.js construct verbatim so the drift read stays familiar
  // across every boss archetype.
  // ---------------------------------------------------------------------
  const voidChipMat = track(new THREE.MeshStandardMaterial({
    color: 0x1a0f26, emissive: glow, emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.4, flatShading: true,
  }));
  const voidChipGeo = new THREE.OctahedronGeometry(0.6, 0);
  const orbiters = [];
  const orbiterCount = lowQ ? 2 : 3;
  for (let i = 0; i < orbiterCount; i++) {
    const m = new THREE.Mesh(voidChipGeo, voidChipMat);
    m.userData = {
      ang: (i / orbiterCount) * Math.PI * 2,
      radius: 3.6 + i * 0.4,
      speed: 1.1 + i * 0.25,
      baseY: 0,
      tilt: i * 0.5,
    };
    rig.add(m);
    orbiters.push(m);
  }

  // Hit flash targets the stone material (the "body" read, same idiom as the
  // legacy core flash).
  kit.flashBind(stoneMat, 0.35);

  // Shared plumbing is fully assembled now — cache base opacities + apply the
  // resting scale (finalize() also dev-asserts every material above went
  // through track()).
  kit.finalize();

  // ---------------------------------------------------------------------
  // ANIMATION
  // ---------------------------------------------------------------------
  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  // onShieldChange: a raised shield clamps the jaw SHUT (a raised shield is a
  // "hold" beat — the open-mouth telegraph would contradict "don't attack me
  // right now") and dims the eyes to a leashed ember instead of full ignition;
  // seams brighten as if the shield strain is stressing the break further.
  let shieldClamp = false;
  kit.onShieldChange((v) => { shieldClamp = v; });

  const ACCENT_COLOR = new THREE.Color(accent);
  const DANGER_COLOR = new THREE.Color(0xff2b6a);   // danger role-colour (never per-boss) — matches the legacy throat idiom
  const _throatColor = new THREE.Color();

  function tickBody(dt, time) {
    // Idle breath-bob: a slow vertical drift so the mask never sits dead
    // still even with no attack in progress (one of the ≥2 idle frequencies).
    rig.position.y = Math.sin(time * 0.45) * 0.15;

    // Halo arcs counter-rotate at different rates — two independent pieces
    // of debris, not one wheel — and NEVER re-form a full ring (each is a
    // partial arc with a permanent gap baked into the geometry).
    haloA.rotation.z += dt * 0.18;
    haloB.rotation.z -= dt * 0.30;

    // Eye flicker: two frequencies (slow ember + fast spark) so it never
    // reads as a metronome; charging brightens further; a raised shield
    // clamps the eyes down to a leashed ~0.5 regardless of charge/flicker.
    const flicker = 0.85 + Math.sin(time * 4.2) * 0.1 + Math.sin(time * 13) * 0.04;
    const eyeK = shieldClamp ? 0.5 : flicker * (1 + charge * 0.3);
    eyeMat.color.copy(EYE_BASE).multiplyScalar(eyeK);

    // Crack-seam shimmer (idle, its own frequency) + a shield-strain brighten.
    seamMat.opacity = (0.35 + Math.sin(time * 1.1) * 0.12) + (shieldClamp ? 0.3 : 0);

    // JAW TELEGRAPH: hinges OPEN as charge rises — a silhouette change, not
    // just a colour flare, per the design brief. Clamped shut while shielded
    // so "wide open mouth" never coincides with "currently invulnerable".
    const jawTarget = shieldClamp ? 0 : -charge * 0.62;
    const tremble = (!shieldClamp && charge > 0.6) ? Math.sin(time * 18) * 0.02 * charge : 0;
    jawPivot.rotation.x = jawTarget + tremble;

    // Throat: dark/invisible at rest (hidden behind the closed jaw anyway),
    // floods accent→danger-magenta and swells into view as the charge nears
    // release. Held dark while shielded (nothing to telegraph).
    throatMat.opacity = shieldClamp ? 0 : charge;
    _throatColor.copy(ACCENT_COLOR).lerp(DANGER_COLOR, charge);
    throatMat.color.copy(_throatColor);

    // Fresnel shell flares hotter mid-charge — the whole body reads as
    // powering up, not just the mouth. Base/pulse match the calmed-down
    // shell material (0.3 base — see the shell comment for why).
    shellMat.uniforms.uStrength.value = 0.3 + Math.sin(time * 2.2) * 0.06 + charge * 0.5;

    // Orbiters — legacy loop, unchanged (drifting void chips).
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(
        Math.cos(u.ang) * u.radius,
        u.baseY + Math.sin(time * 1.6 + u.tilt) * 0.5,
        Math.sin(u.ang) * u.radius
      );
      o.rotation.x += dt * 2;
      o.rotation.y += dt * 1.4;
    }
  }

  // Muzzle: FX/bullets originate at the open jaw. Attached directly to
  // `group` (not `rig`) so it stays a stable reference point for the
  // controller regardless of the breath-bob.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, -1.2, 2.2);
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
    // tickBody first (writes the archetype's own materials/pivots), then
    // kit.tickCommon LAST so its flash decay (tickFlash, inside tickCommon)
    // always wins over anything else touching the same material on this
    // frame — same write-order rule the legacy builder documents.
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
