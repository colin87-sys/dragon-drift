import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { mulberry32 } from './util.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// CRAGHOLD's body — the STONE COLOSSUS: "a broad flat-helmed stone head on
// pauldron shoulders, flanked by two enormous detached open hands." Third
// archetype in the system, and the first Tier 2 COLOSSUS (BOSS-DESIGN.md §5/
// §5b slot 3): everything the Sentinels have PLUS a gesture/limb system — the
// two floating HANDS are the fight's telegraphs (point / clench / sweep /
// slam), its poseability, and the diegetic body for the flank-emitter patterns
// (crossfire fires from x≈±10; the hands visually own those muzzles).
//
// SILHOUETTE-FIRST: one sentence — helmed bust + two huge open hands. Few hard
// outline points (flat brim run, twin crown steles, pauldron slabs, mitten-
// blocky hands a 12-year-old can draw). The eyes are hot SLITS under the brim
// shadow at rest; when the helm brim is SHED (phase transition, below) they
// become exposed round eyes — the silhouette itself escalates with the fight.
//
// THE SCAR (one asymmetric break, §3 law 6): the LEFT hand's ring finger is a
// clean-sheared STUMP, and crack seams radiate from it across the palm. Both
// wrists wear SHATTERED SHACKLE CUFFS with broken chain-link stubs — the same
// damage story ("something severed and something broke its chains"), pointed
// at, never answered. Lore gap claimed by registry slots 8 and 9.
//
// PALETTE (registry slot 3): near-black basalt base (~75%), moss-green accent
// emissive (~20%), dark-bronze DIFFUSE trim (cuffs/collar/helm — diffuse so it
// can never collide with Voidmaw's emissive ember at thumbnail size), white-hot
// focal eyes + palm cores (<5%, EYE_HOT overdrive). Danger stays role-magenta.
//
// PHASE TRANSITIONS CHANGE THE SILHOUETTE (Tier 2 contract): the model counts
// shield BREAKS via kit.onShieldChange — break #1 flings both pauldron slabs
// off (narrower shoulders), break #2 cracks the helm brim off (slit eyes become
// exposed round eyes, bigger and hotter). Resting hand grip escalates with the
// sheds: open palms → drumming fingers → clenched fists. All model-side; the
// controller is untouched.
//
// GEOMETRY BUDGET: ~3-4.5k tris @q1 (ceiling 6,000), ~29 visible body draws +
// 4 HP-bar draws vs the ≤34 gate — stone merges into four value-tier draws
// (dark base / mid carve / accent ridge / bronze trim), every part goes through
// stripForMerge (bossKit) before mergeGeometries (silent-null law). Additive
// budget: ZERO enclosing shells — one backlit disc strictly behind the bust
// plane + two SMALL palm-core discs (the "attack originates from named visible
// anatomy" glow). Crack seams are LineSegments (overdraw-exempt).
//
// CONTRACT: boss.js stomps `group.rotation` every frame (placeGroup) and
// `kit.setDissolve` owns `group.scale` — every animated part lives on `rig`,
// the hand roots, or pivots under them, never on `group` itself.

export function buildStoneColossus(def, quality = 1) {
  const accent = def.accent ?? 0x69c94f;   // moss/lichen green — identity lives in emissive
  const glow = def.glow ?? 0xd8f09a;       // pale lichen-gold — shield rim, shards, backlight
  const lowQ = quality < 0.75;

  // Shared plumbing. shieldRadius 4.4 wraps the bust (the hands float OUTSIDE
  // the bubble — deliberate, the mandala's "machinery outside the ward"
  // precedent — and the guard pose below pulls them IN when it rises). The
  // colossus runs def.scale 2.0, so the HP bar counter-scales (0.75 → world
  // width 12, the roster's usual read) — see bossKit's hpBarScale.
  const kit = createBossCommon(def, quality, { shieldRadius: 4.4, hpBarY: 4.6, hpBarZ: 1.6, hpBarScale: 0.75 });
  const { group, track } = kit;
  group.userData.archetype = 'stoneColossus';   // guards the legacy-fallback coexist path (tests/boss.mjs)

  const rig = new THREE.Group();
  group.add(rig);

  // Deterministic jitter — same seed every build (no per-load shape popping).
  const rnd = mulberry32(0xc0105505);
  const j = (amt) => (rnd() - 0.5) * amt;
  const strip = stripForMerge;

  const mergeStone = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildStoneColossus: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };
  const relief = (parts, geo, x, y, z, rz = 0) => {
    geo = strip(geo);
    if (rz) geo.rotateZ(rz);
    geo.translate(x, y, z);
    parts.push(geo);
  };

  // ---- Painted value tiers (the sun can't shade the front face — §3 law 4).
  // Basalt runs COOL near-black; the moss identity is emissive-only.
  const baseParts = [];     // face plate + helm dome + chest — the dark canvas
  const midParts = [];      // steles + cheek plates + neck — carved mid tone
  const accentParts = [];   // brow ledge + keystone chevrons — the lit ridge line
  const bronzeParts = [];   // helm trim + collar — ancient fittings (DIFFUSE bronze)

  // ---------------------------------------------------------------------
  // FACE PLATE — wide angular slab with two REAL slit holes (negative space:
  // sky glows through a dormant socket). Slits slant outer-corner-high so the
  // resting read is a GLARE (the idol's socket lesson). Outline CCW, holes CW.
  // ---------------------------------------------------------------------
  function buildFaceShape() {
    const shape = new THREE.Shape();
    const outline = [
      [0.00, 1.28],
      [-1.60, 1.28], [-2.34, 0.92],                    // flat brow run → hard temple corner
      [-2.46, -0.18],                                  // jaw flare (widest)
      [-1.72, -1.28], [-0.82, -1.74],                  // hard chin taper
      [0.00, -1.88],
      [0.82, -1.74], [1.72, -1.28],
      [2.46, -0.18],
      [2.34, 0.92], [1.60, 1.28],
    ];
    shape.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i][0], outline[i][1]);
    shape.closePath();
    // Slit socket: a long low hexagon, slanted so the temple end rides high.
    // Capture round 1: 0.54×0.17 slits read as SPECKS at fight distance — the
    // eyes lost the brightest-pixel contest. Widened and heightened.
    const slitHole = (cx, cy, mirror) => {
      const W = 0.66, H = 0.22, ROT = -0.14;   // half-extents; left eye's temple (-x) end rises
      const rel = [
        [-W, 0.02], [-W * 0.55, H], [W * 0.55, H],
        [W, -0.02], [W * 0.55, -H], [-W * 0.55, -H],
      ].map(([x, y]) => [x * Math.cos(ROT) - y * Math.sin(ROT), x * Math.sin(ROT) + y * Math.cos(ROT)]);
      // CW winding for holes; mirroring X alone would flip winding, so the
      // mirrored side also reverses point order (idol precedent).
      const pts = (mirror ? rel.slice().reverse() : rel).map(([x, y]) => [cx + (mirror ? -x : x), cy + y]);
      const path = new THREE.Path();
      path.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
      path.closePath();
      return path;
    };
    shape.holes.push(slitHole(-1.18, 0.42, false));
    shape.holes.push(slitHole(1.18, 0.42, true));
    return shape;
  }
  const faceGeo = strip(new THREE.ExtrudeGeometry(buildFaceShape(), {
    depth: 0.9, steps: 1, bevelEnabled: true, bevelThickness: 0.10, bevelSize: 0.14,
    bevelSegments: 2, curveSegments: 1,
  }));
  faceGeo.translate(0, 0, -0.5);   // front face → z≈+0.4
  baseParts.push(faceGeo);

  // HELM DOME — a low wide trapezoid above the brim line; carries the twin
  // crown steles. Buried slightly back so the brim (below) overhangs it.
  {
    const s = new THREE.Shape();
    s.moveTo(-2.42, 0); s.lineTo(-1.92, 1.15); s.lineTo(1.92, 1.15); s.lineTo(2.42, 0);
    s.closePath();
    const dome = strip(new THREE.ExtrudeGeometry(s, {
      depth: 1.05, steps: 1, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.10, bevelSegments: 1, curveSegments: 1,
    }));
    dome.translate(0, 1.42, -0.75);
    baseParts.push(dome);
  }
  // Twin crown STELES — symmetric citadel towers (the colossus's height; the
  // asymmetry budget is spent on the hand, not the crown). Round-1 bulk-up:
  // taller + thicker so they break the outline decisively at 30m.
  for (const sx of [-1, 1]) {
    relief(midParts, new THREE.BoxGeometry(0.62, 1.85, 0.46), sx * 1.30, 3.30, -0.35, sx * -0.05);
    if (!lowQ) relief(accentParts, new THREE.BoxGeometry(0.34, 0.24, 0.30), sx * 1.30, 4.35, -0.35);  // capstone
  }
  // CHEST — a keel wedge under the face + an accent keystone with chevrons.
  relief(baseParts, new THREE.BoxGeometry(3.05, 1.35, 1.05), 0, -2.45, -0.35);
  relief(midParts, new THREE.BoxGeometry(2.10, 0.55, 0.55), 0, -1.80, 0.02);          // neck band
  relief(accentParts, new THREE.BoxGeometry(0.72, 1.00, 0.28), 0, -2.35, 0.30);       // keystone
  if (!lowQ) {
    for (let i = 0; i < 3; i++) {
      relief(accentParts, new THREE.BoxGeometry(0.90 - i * 0.22, 0.10, 0.30), 0, -2.02 - i * 0.28, 0.32);  // chevrons
    }
  }
  // CHEEK PLATES — mirrored guards along the jaw line.
  for (const sx of [-1, 1]) {
    relief(midParts, new THREE.BoxGeometry(0.60, 0.72, 0.26), sx * 1.90, -0.62, 0.38, sx * 0.24);
    relief(midParts, new THREE.BoxGeometry(0.40, 0.50, 0.24), sx * 1.20, -1.24, 0.40, sx * 0.42);
  }
  // Dome relief bands — authored, mirrored (never scattered).
  if (!lowQ) {
    for (const sx of [-1, 1]) {
      relief(midParts, new THREE.BoxGeometry(0.16, 0.95, 0.26), sx * 0.72, 1.92, 0.30, sx * 0.10);
    }
    relief(midParts, new THREE.BoxGeometry(0.16, 1.00, 0.26), 0, 1.95, 0.30);
  }

  // BRONZE fittings (diffuse-bronze tier): helm trim band + gorget collar.
  relief(bronzeParts, new THREE.BoxGeometry(4.05, 0.17, 0.34), 0, 2.50, 0.02);
  {
    const collarTubular = lowQ ? 14 : 24;
    const collar = strip(new THREE.TorusGeometry(1.55, 0.15, 6, collarTubular, Math.PI));
    collar.rotateZ(Math.PI);           // open side up — a gorget under the chin, not a halo
    collar.translate(0, -1.55, 0.30);
    bronzeParts.push(collar);
  }
  if (!lowQ) {
    for (const sx of [-1, 1]) relief(bronzeParts, new THREE.BoxGeometry(0.22, 0.22, 0.36), sx * 2.10, 0.92, 0.36);  // temple rivets
  }

  // Round-1 value fix: 0x15161a + metalness 0.22 lifted pale under the
  // hemisphere light — the basalt must stay a NEAR-BLACK canvas.
  const baseMat = track(new THREE.MeshStandardMaterial({
    color: 0x0e0f12, emissive: accent, emissiveIntensity: 0.05, roughness: 0.7, metalness: 0.15, flatShading: true,
  }));
  const midMat = track(new THREE.MeshStandardMaterial({
    color: 0x23262b, emissive: accent, emissiveIntensity: 0.12, roughness: 0.55, metalness: 0.28, flatShading: true,
  }));
  const accentStoneMat = track(new THREE.MeshStandardMaterial({
    color: 0x2c332c, emissive: accent, emissiveIntensity: 0.18, roughness: 0.5, metalness: 0.3, flatShading: true,
  }));
  const bronzeMat = track(new THREE.MeshStandardMaterial({
    color: 0x4a3a20, emissive: 0xc98a3f, emissiveIntensity: 0.15, roughness: 0.45, metalness: 0.55, flatShading: true,
  }));
  rig.add(new THREE.Mesh(mergeStone(baseParts, 'base-stone'), baseMat));
  rig.add(new THREE.Mesh(mergeStone(midParts, 'mid-stone'), midMat));
  rig.add(new THREE.Mesh(mergeStone(accentParts, 'accent-stone'), accentStoneMat));
  rig.add(new THREE.Mesh(mergeStone(bronzeParts, 'bronze-trim'), bronzeMat));

  // ---------------------------------------------------------------------
  // SHEDDABLE PLATES — pauldrons ×2 + helm brim, each its own mesh with a
  // CLONED (tracked) material so the shed fade never dims the merged tier.
  // Break #1 (first shield break) flings the pauldrons; break #2 flings the
  // brim and the slit eyes become exposed round eyes. Silhouette-changing
  // phase transitions, per the Tier 2 contract.
  // ---------------------------------------------------------------------
  const shedAnims = [];
  function shedPlate(geo, mat, x, y, z, rz, flingDir) {
    geo = strip(geo);
    const m = track(mat);
    m.transparent = true;
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.rotation.z = rz;
    rig.add(mesh);
    shedAnims.push({ mesh, mat: m, dir: flingDir, t: -1, spin: new THREE.Vector3(j(4), j(4), j(4)) });
    return mesh;
  }
  // Round-1 bulk-up: heavier pauldrons + a wider, thicker brim — both must
  // break the outline decisively so their SHED visibly changes the silhouette.
  for (const sx of [-1, 1]) {
    shedPlate(new THREE.BoxGeometry(1.70, 0.62, 1.30), baseMat.clone(), sx * 3.10, -1.35, -0.30, sx * -0.28,
      new THREE.Vector3(sx * 2.2, -0.6, 0.4));
  }
  const brimPlate = shedPlate(new THREE.BoxGeometry(5.95, 0.38, 1.55), midMat.clone(), 0, 1.30, 0.28, 0,
    new THREE.Vector3(0, 1.8, 1.6));
  let shedCount = 0;      // 0 none · 1 pauldrons gone · 2 brim gone (eyes exposed)
  let exposedK = 0;       // eases 0→1 after the brim sheds — drives the slit→round eye change
  function triggerShed(n) {
    if (n === 1) { for (const s of shedAnims.slice(0, 2)) s.t = 0; }
    if (n === 2) { const s = shedAnims[2]; if (s) s.t = 0; }
  }
  function tickSheds(dt) {
    for (const s of shedAnims) {
      if (s.t < 0) continue;
      s.t += dt;
      const k = s.t / 0.9;
      if (k >= 1) { s.mesh.visible = false; s.t = -2; continue; }
      s.mesh.position.addScaledVector(s.dir, dt * 6);
      s.mesh.rotation.x += s.spin.x * dt;
      s.mesh.rotation.y += s.spin.y * dt;
      s.mesh.rotation.z += s.spin.z * dt;
      s.mat.opacity = 1 - k;
    }
  }

  // ---------------------------------------------------------------------
  // EYES — hot slits under the brim shadow (focal-point law: the brightest
  // thing on the boss). Squashed spheres fill the slit holes; eyeGroup.scale.y
  // is the one dial that carries slit-squash × blink × death-close, and eases
  // toward round (1.0) once the brim sheds. Pupils are separate meshes (each
  // constricts about its own centre) riding inside eyeGroup so blinks crush
  // everything about the socket line together.
  // ---------------------------------------------------------------------
  const eyeGroup = new THREE.Group();
  eyeGroup.position.set(0, 0.42, 0.0);   // round 1: forward, at the socket mouth — recessed eyes vanished
  rig.add(eyeGroup);
  const eyeSeg = lowQ ? [9, 7] : [13, 9];
  const eyeParts = [];
  for (const sx of [-1, 1]) {
    const eye = strip(new THREE.SphereGeometry(0.50, eyeSeg[0], eyeSeg[1]));   // round 1: 0.42 read as a speck at 30m
    eye.scale(1.40, 1, 0.75);   // wide — spans the slit
    eye.translate(sx * 1.18, 0, 0);
    eyeParts.push(eye);
  }
  const eyeGeo = mergeGeometries(eyeParts, false);
  if (!eyeGeo) throw new Error('buildStoneColossus: eye mergeGeometries returned null (attribute mismatch)');
  const EYE_BASE = new THREE.Color(0xf2fff0);
  // EYE_HOT overdrive + toneMapped=false: the bloom threshold is 1.0 LINEAR
  // and ACES crushes ≤1.0 to gray — see bossIdol.js's "dead eyes" note.
  const EYE_HOT = 2.4;
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xf2fff0 }));
  eyeMat.toneMapped = false;
  eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  eyeGroup.add(new THREE.Mesh(eyeGeo, eyeMat));
  const pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x0c140c }));
  const pupilGeo = new THREE.SphereGeometry(0.14, lowQ ? 6 : 8, lowQ ? 4 : 6);
  const pupils = [];
  for (const sx of [-1, 1]) {
    const p = new THREE.Mesh(pupilGeo, pupilMat);
    p.userData.sx = sx;
    p.position.set(sx * 1.18, 0, 0.42);
    eyeGroup.add(p);
    pupils.push(p);
  }

  // BROW LEDGE bars — the expression rig (±0.3 rad = glare/anger/pain/sorrow),
  // heavy stone versions of the idol's gilt bars. Named pivots.
  const BROW_BASE = -0.18;
  const browPivots = [];
  const browGeo = strip(new THREE.BoxGeometry(1.30, 0.24, 0.30));
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Object3D();
    pivot.name = 'browPivot';
    pivot.position.set(sx * 1.18, 0.94, 0.40);
    pivot.rotation.z = sx * BROW_BASE;
    pivot.userData.sx = sx;
    pivot.add(new THREE.Mesh(browGeo, accentStoneMat));
    rig.add(pivot);
    browPivots.push(pivot);
  }

  // ---------------------------------------------------------------------
  // THE HANDS — two enormous detached floating hands, the Tier 2 gesture/limb
  // system and the fight's telegraph anatomy. Per hand: a root group (named
  // handL/handR — the drift/guard/setpiece position channel), a wrist pivot
  // (named handPivotL/handPivotR — the orientation channel: point/sweep/slam),
  // digit slabs each on a named fingerPivot (the curl channel — the telegraph-
  // silhouette test gate reads these), a small white-hot PALM CORE (attacks
  // originate from named visible anatomy), and a broken bronze shackle cuff
  // with chain-link stubs. LEFT hand carries THE SCAR: a sheared ring-finger
  // stump merged into the palm, with crack seams radiating from it.
  // World math: roots sit at local ±4.9 → ×def.scale(2) ≈ ±9.8 — visually
  // owning crossfire's fixed ±10 flank emitters. Each hand scales 1.45× as a
  // unit (round-1 capture fix: 1× read as ordinary hands, not colossal ones).
  // ---------------------------------------------------------------------
  const DANGER_COLOR = new THREE.Color(0xff2b6a);   // role colour, never per-boss
  const ACCENT_COLOR = new THREE.Color(accent);
  const coreMat = track(new THREE.MeshBasicMaterial({
    color: accent, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  coreMat.toneMapped = false;
  const _coreColor = new THREE.Color();

  function buildHand(sx) {
    const root = new THREE.Group();
    root.name = sx < 0 ? 'handL' : 'handR';
    root.position.set(sx * 4.9, -0.35, 0.55);
    // Round 1: at 1× the hands read as ordinary hands, not COLOSSAL ones — the
    // hook died at fight distance. The whole hand scales as a unit (only
    // position/rotation are animated below, never scale, so this is safe).
    root.scale.setScalar(1.45);
    rig.add(root);
    const wrist = new THREE.Object3D();
    wrist.name = sx < 0 ? 'handPivotL' : 'handPivotR';
    root.add(wrist);

    // PALM — a bevel-less slab + mirrored knuckle ridges; the left palm merges
    // the STUMP (short jagged nub at the ring slot — the one broken thing).
    const palmParts = [strip(new THREE.BoxGeometry(1.15, 1.55, 0.42))];
    for (let i = 0; i < 2; i++) {
      relief(palmParts, new THREE.BoxGeometry(0.30, 0.16, 0.20), -0.28 + i * 0.40, 0.72, 0.20);
    }
    relief(palmParts, new THREE.BoxGeometry(0.66, 0.28, 0.18), 0, -0.30, 0.24);   // palm heel bar
    if (sx < 0) {
      // The sheared stump: jagged top ring, canted — sits where a third
      // finger's knuckle would be.
      const stump = strip(new THREE.BoxGeometry(0.26, 0.30, 0.34));
      const pos = stump.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) > 0.1) { pos.setY(i, pos.getY(i) + j(0.16)); pos.setX(i, pos.getX(i) + j(0.06)); }
      }
      pos.needsUpdate = true;
      stump.computeVertexNormals();
      stump.rotateZ(0.18);
      stump.translate(0.44, 0.88, 0);
      palmParts.push(stump);
    }
    const palmGeo = mergeGeometries(palmParts, false);
    if (!palmGeo) throw new Error('buildStoneColossus: palm mergeGeometries returned null (attribute mismatch)');
    wrist.add(new THREE.Mesh(palmGeo, midMat));

    // DIGITS — two finger slabs + a thumb, each slab's mesh IS its pivot
    // (geometry translated so the base knuckle sits at the origin; rotation.x
    // is the curl). All named fingerPivot for the telegraph gate.
    const digits = [];
    const digitSpec = [
      { x: -0.32, y: 0.80, w: 0.30, len: 0.98, thumb: false },
      { x: 0.08, y: 0.82, w: 0.30, len: 1.06, thumb: false },
      { x: sx < 0 ? -0.62 : 0.62, y: -0.10, w: 0.26, len: 0.72, thumb: true },
    ];
    for (const d of digitSpec) {
      let geo = strip(new THREE.BoxGeometry(d.w, d.len, 0.36));
      geo.translate(0, d.len / 2, 0);
      const mesh = new THREE.Mesh(geo, midMat);
      mesh.name = 'fingerPivot';
      mesh.position.set(d.thumb ? d.x : d.x * (sx < 0 ? 1 : -1) * -1, d.y, 0);
      if (d.thumb) mesh.rotation.z = sx * -0.85;   // thumb angles outward from the palm edge
      mesh.userData.thumb = d.thumb;
      wrist.add(mesh);
      digits.push(mesh);
    }

    // PALM CORE — the small white-hot emitter glow, recessed into the palm
    // face. Heats accent→danger-magenta with the charge (the throat idiom).
    const core = new THREE.Mesh(new THREE.CircleGeometry(0.30, lowQ ? 10 : 16), coreMat);
    core.position.set(0, 0.10, 0.24);
    wrist.add(core);

    // SHACKLE CUFF — broken bronze arc around the wrist + chain-link stubs
    // (merged into ONE bronze draw per hand). The left chain hangs longer —
    // the same break, told twice.
    const cuffParts = [];
    const cuffTubular = lowQ ? 8 : 12;
    const arc1 = strip(new THREE.TorusGeometry(0.58, 0.13, 5, cuffTubular, Math.PI * 1.15));
    arc1.rotateZ(-0.4);
    const arc2 = strip(new THREE.TorusGeometry(0.58, 0.13, 5, Math.max(4, cuffTubular >> 1), Math.PI * 0.45));
    arc2.rotateZ(Math.PI * 1.05);
    cuffParts.push(arc1, arc2);
    const links = sx < 0 ? 3 : 2;
    for (let i = 0; i < links; i++) {
      relief(cuffParts, new THREE.BoxGeometry(0.16, 0.26, 0.10), sx * 0.52, -0.98 - i * 0.30, 0.05, j(0.6));
    }
    const cuffGeo = mergeGeometries(cuffParts, false);
    if (!cuffGeo) throw new Error('buildStoneColossus: cuff mergeGeometries returned null (attribute mismatch)');
    const cuff = new THREE.Mesh(cuffGeo, bronzeMat);
    cuff.position.set(0, -0.80, 0);
    cuff.rotation.x = Math.PI / 2;
    wrist.add(cuff);

    return { root, wrist, digits, core, sx, baseX: sx * 4.9, baseY: -0.35, baseZ: 0.55, phase: sx < 0 ? 0 : 1.7 };
  }
  const hands = [buildHand(-1), buildHand(1)];

  // CRACK SEAMS — radiating from the stump across the LEFT palm (the scar
  // pointed at, LineSegments = overdraw-free). Lives in the wrist space so it
  // rides every gesture.
  {
    const seamRnd = mulberry32(0x5ca25ca2);
    const origin = new THREE.Vector3(0.44, 0.86, 0.23);
    const targets = [
      new THREE.Vector3(-0.30, 0.60, 0.23), new THREE.Vector3(-0.50, 0.05, 0.23),
      new THREE.Vector3(0.10, -0.45, 0.23), new THREE.Vector3(0.52, -0.10, 0.23),
      new THREE.Vector3(-0.15, -0.72, 0.23),
    ];
    const perBranch = lowQ ? 2 : 4;
    const pts = [];
    for (const t of targets) {
      let p = origin.clone();
      for (let s = 0; s < perBranch; s++) {
        const u = (s + 1) / perBranch;
        const next = origin.clone().lerp(t, u);
        next.x += (seamRnd() - 0.5) * 0.10;
        next.y += (seamRnd() - 0.5) * 0.10;
        pts.push(p.x, p.y, p.z, next.x, next.y, next.z);
        p = next;
      }
    }
    const seamGeo = new THREE.BufferGeometry();
    seamGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const seamColor = new THREE.Color(0xc98a3f).lerp(ACCENT_COLOR, 0.5);
    var seamMat = track(new THREE.LineBasicMaterial({
      color: seamColor, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    hands[0].wrist.add(new THREE.LineSegments(seamGeo, seamMat));
  }

  // BACKLIGHT DISC — strictly behind the bust plane, narrower than the bust's
  // half-width: rim-lights the outline via bloom, never encloses the volume
  // (§3 law: no enclosing shell). Pure ambience, no charge reaction.
  const glowDiscMat = track(new THREE.MeshBasicMaterial({
    color: glow, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(2.45, lowQ ? 10 : 18), glowDiscMat);
  glowDisc.position.set(0, 0.5, -2.05);
  rig.add(glowDisc);

  // ORBITERS — dark masonry chunks (contract ≥2; law 8: satellites stay dark).
  const masonryMat = track(new THREE.MeshStandardMaterial({
    color: 0x101408, emissive: accent, emissiveIntensity: 0.22, roughness: 0.4, metalness: 0.3, flatShading: true,
  }));
  const masonryGeo = strip(new THREE.BoxGeometry(0.55, 0.38, 0.46));
  const orbiters = [];
  const orbiterCount = lowQ ? 2 : 3;
  for (let i = 0; i < orbiterCount; i++) {
    const m = new THREE.Mesh(masonryGeo, masonryMat);
    m.userData = { ang: (i / orbiterCount) * Math.PI * 2, radius: 3.4 + i * 0.5, speed: 0.9 + i * 0.2, baseY: 0.4, tilt: i * 0.6 };
    rig.add(m);
    orbiters.push(m);
  }

  // Hit flash rings the BRONZE fittings, not the base stone: rider fire lands
  // every ~0.5s, and a whole-face flash in a HIGH-luminance green (unlike the
  // idol's dim violet) kept the basalt permanently semi-lit in captures — the
  // "flat pale sticker" failure by another road. The fittings flashing hot
  // reads as struck metal; the brow-pain flinch still sells the hit.
  kit.flashBind(bronzeMat, 0.15);
  kit.finalize();

  // ---------------------------------------------------------------------
  // ANIMATION
  // ---------------------------------------------------------------------
  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  // Optional controller hook (fed alongside setCharge once the controller's
  // attack-tell seam lands): selects which gesture family the hands wind up
  // in. null = the default clench — which is also what the telegraph-
  // silhouette test gate asserts on a bare setCharge(1).
  let tell = null;
  const TELL_FAMILY = {
    aimed: 'point', stream: 'point',
    fan: 'sweep', crossfire: 'sweep',
    spiral: 'spin', spiralStream: 'spin',
    tunnel: 'clench', iris: 'clench',
    curtain: 'slam', movingGap: 'slam', secondWave: 'slam',
  };
  function setAttackTell(id) { tell = id ? (TELL_FAMILY[id] ?? 'clench') : null; }

  // Optional setpiece hook (the crossing pass): k 0→1 spreads the hands wide
  // and splays the fingers — the frame where the player flies BETWEEN them.
  let setpieceK = 0;
  function setSetpiece(k) { setpieceK = Math.max(0, Math.min(1, k)); }

  // Shield: guard pose while raised (hands clasp IN, inside the bubble); each
  // LOWER (= a break) sheds silhouette armor — the phase-transition law.
  let shieldClamp = false;
  kit.onShieldChange((v) => {
    if (v) { shieldClamp = true; return; }
    if (shieldClamp) { shieldClamp = false; shedCount = Math.min(2, shedCount + 1); triggerShed(shedCount); }
  });

  // --- Charisma layer (colossus dials: everything HEAVY and SLOW) ---
  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  let lookAwayT = 0, lookAwayX = 0, lookAwayY = 0;
  let nextLookAway = 5 + Math.random() * 6;
  function setGaze(nx, ny) {
    gazeTX = Math.max(-1, Math.min(1, nx));
    gazeTY = Math.max(-1, Math.min(1, ny));
  }
  let blinkT = 0;
  const BLINK_DUR = 0.34;                        // a heavy lid, not a flutter
  let nextBlink = 6 + Math.random() * 3;         // slow — each blink is an event
  let noticeT = 0;
  function notice() { noticeT = 0.9; blinkT = 0; nextBlink = 3; }
  let painT = 0;
  function flinchFlash(amt) { if (amt > 0.3) painT = Math.max(painT, 0.35); kit.flash(amt); }
  let dyingK = 0;
  function setDissolveEmotive(k) { dyingK = Math.max(0, Math.min(1, k)); kit.setDissolve(k); }

  function tickBody(dt, time) {
    // Idle: a slow tectonic breath-bob + an even slower roll — two
    // frequencies so the mountain never reads as scenery.
    rig.position.y = Math.sin(time * 0.35) * 0.18;
    rig.rotation.z = Math.sin(time * 0.22) * 0.012;
    // Death: the head bows (rig-local — placeGroup owns the world transform).
    rig.rotation.x += ((dyingK * 0.30) - rig.rotation.x) * Math.min(1, dt * 3);

    // Eyes exposed after the brim sheds.
    exposedK += ((shedCount >= 2 ? 1 : 0) - exposedK) * Math.min(1, dt * 2.5);

    // --- Gaze: high-lag pursuit (a mountain turns slowly), deliberate wander ---
    nextLookAway -= dt;
    if (lookAwayT > 0) lookAwayT -= dt;
    else if (nextLookAway <= 0 && charge < 0.2 && noticeT <= 0 && dyingK <= 0) {
      lookAwayT = 0.9 + Math.random() * 0.7;
      lookAwayX = (Math.random() - 0.5) * 1.4;
      lookAwayY = Math.random() * 0.6 - 0.2;
      nextLookAway = 5 + Math.random() * 6;
    }
    const gx = lookAwayT > 0 ? lookAwayX : gazeTX;
    const gy = lookAwayT > 0 ? lookAwayY : gazeTY;
    const gLag = (noticeT > 0 || charge > 0.5) ? 8 : 2.2;
    gazeX += (gx - gazeX) * Math.min(1, dt * gLag);
    gazeY += (gy - gazeY) * Math.min(1, dt * gLag);
    for (const p of pupils) p.position.set(p.userData.sx * 1.18 + gazeX * 0.16, gazeY * 0.10, 0.34);

    // --- Blink × slit-squash × death-close, all about the socket line ---
    if (blinkT > 0) blinkT -= dt;
    else {
      nextBlink -= dt;
      if (nextBlink <= 0 && charge < 0.5 && dyingK <= 0) { blinkT = BLINK_DUR; nextBlink = 6 + Math.random() * 3; }
    }
    const blinkK = blinkT > 0 ? Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 1;
    const slitBase = 0.34 + exposedK * 0.66;   // slits at rest; round once the brim is gone
    const deathLid = 1 - dyingK * 0.95;
    eyeGroup.scale.y = Math.max(0.05, slitBase * Math.min(blinkK, deathLid));

    // --- Brow expression (death sorrow > pain > notice > shield strain > charge > glare) ---
    if (painT > 0) painT -= dt;
    if (noticeT > 0) noticeT -= dt;
    let browP = 0;
    if (dyingK > 0) browP = 0.55 * Math.min(1, dyingK * 2.5);
    else if (painT > 0) browP = 0.30 * (painT / 0.35);
    else if (noticeT > 0) browP = -0.28;
    else browP = shieldClamp ? -0.10 : -0.22 * charge;
    for (const b of browPivots) {
      const target = b.userData.sx * (BROW_BASE + browP);
      b.rotation.z += (target - b.rotation.z) * Math.min(1, dt * 7);
    }

    // --- Pupils: pinpoint rage at notice/charge, blown wide in death ---
    const pupilTarget = dyingK > 0 ? 1.5 : (noticeT > 0 ? 0.5 : 1 - charge * 0.45);
    for (const p of pupils) {
      const s = p.scale.x + (pupilTarget - p.scale.x) * Math.min(1, dt * 7);
      p.scale.setScalar(Math.max(0.01, s));
    }

    // --- Flinch/notice recoil ---
    const recoil = (painT > 0 ? painT / 0.35 : 0) * 0.35 + (noticeT > 0.6 ? (noticeT - 0.6) / 0.3 : 0) * 0.25;
    rig.position.z = -recoil;

    // --- Eye heat: two flicker frequencies; shield leashes to a dim ember;
    // exposed eyes burn hotter; death gutters as the lids close. ---
    const flicker = 0.85 + Math.sin(time * 3.8) * 0.1 + Math.sin(time * 11) * 0.04;
    let eyeK = shieldClamp ? 0.5 : flicker * (1 + charge * 0.3) * (1 + exposedK * 0.2);
    if (noticeT > 0) eyeK *= 1.25;
    eyeK *= 1 - dyingK * 0.4;
    eyeMat.color.copy(EYE_BASE).multiplyScalar(eyeK * EYE_HOT);

    // Seams shimmer on their own clock; shield strain brightens the break.
    seamMat.opacity = (0.35 + Math.sin(time * 1.3) * 0.12) + (shieldClamp ? 0.3 : 0);

    // --- HANDS: rest-drift → gesture wind-up → guard → setpiece → death ---
    // Resting grip escalates with the sheds: open → drumming → fists.
    const gesture = tell ?? 'clench';
    for (let hi = 0; hi < hands.length; hi++) {
      const h = hands[hi];
      // Position channel (root): idle drift around the flank station.
      let tx = h.baseX + Math.sin(time * 0.5 + h.phase) * 0.25 + gazeX * 0.3;
      let ty = h.baseY + Math.sin(time * 0.8 + h.phase) * 0.28;
      let tz = h.baseZ + Math.sin(time * 0.42 + h.phase * 2) * 0.15;
      // Orientation channel (wrist) + curl channel (digits).
      let rx = 0, rz = 0;
      let curl;
      if (shedCount === 0) curl = 0.15;
      else if (shedCount === 1) curl = 0.28;   // per-digit drum added below
      else curl = 0.75;
      if (charge > 0.01 && !shieldClamp && dyingK <= 0) {
        // Wind-up: every family raises the hands; the pose differs.
        ty += charge * 0.5;
        if (gesture === 'clench') curl = curl + (0.95 - curl) * charge;
        else if (gesture === 'point') {
          if (h.sx > 0) { curl = curl * (1 - charge) + 0.05 * charge; rx = -0.55 * charge; }
          else curl = curl + (0.9 - curl) * charge;
        } else if (gesture === 'sweep') {
          curl = curl * (1 - charge) + 0.08 * charge;
          rz = h.sx * 0.5 * charge;
          tx += h.sx * 0.6 * charge;
        } else if (gesture === 'spin') {
          curl = curl + (0.5 - curl) * charge;
          rz = Math.sin(time * 6) * 0.6 * charge;
        } else if (gesture === 'slam') {
          curl = curl * (1 - charge) + 0.05 * charge;
          ty += charge * 1.1;
          rx = 0.7 * charge;
        }
      }
      if (shieldClamp) {
        // Guard: clasp in front of the face, inside the shield bubble.
        tx = h.sx * 1.7; ty = -0.1; tz = 1.5; curl = 0.55; rx = 0; rz = h.sx * 0.2;
      }
      if (setpieceK > 0) {
        // Crossing pass: arms spread WIDE, fingers splayed — the frame the
        // player flies under, between the hands.
        tx += h.sx * 1.8 * setpieceK;
        ty += 0.8 * setpieceK;
        curl = curl * (1 - setpieceK) + 0.05 * setpieceK;
        rz = (rz || 0) + h.sx * 0.3 * setpieceK;
      }
      if (dyingK > 0) {
        // Mournful: hands rise toward the face, then fall slack and drift
        // apart, fingers uncurling — never an explosion.
        const rise = Math.min(1, dyingK * 2.5);
        const fall = Math.max(0, dyingK - 0.45) / 0.55;
        tx = h.baseX + (h.sx * 2.4 - h.baseX) * rise + h.sx * 1.2 * fall;
        ty = h.baseY + 1.0 * rise - 2.4 * fall;
        tz = h.baseZ + 0.7 * rise * (1 - fall);
        curl = 0.4 * (1 - fall) + 0.05;
        rx = 0.3 * fall;
      }
      if (noticeT > 0.5) curl = Math.max(curl, 0.95);   // the notice beat: fists SNAP shut
      const ease = Math.min(1, dt * 4);
      h.root.position.x += (tx - h.root.position.x) * ease;
      h.root.position.y += (ty - h.root.position.y) * ease;
      h.root.position.z += (tz - h.root.position.z) * ease;
      h.wrist.rotation.x += (rx - h.wrist.rotation.x) * Math.min(1, dt * 5);
      h.wrist.rotation.z += (rz - h.wrist.rotation.z) * Math.min(1, dt * 5);
      for (let di = 0; di < h.digits.length; di++) {
        const d = h.digits[di];
        let dCurl = curl;
        if (shedCount === 1 && charge < 0.01 && !shieldClamp && dyingK <= 0 && setpieceK <= 0) {
          dCurl += Math.sin(time * 2.4 + di * 1.9 + h.phase) * 0.18;   // drumming fingers
        }
        if (d.userData.thumb) dCurl *= 0.7;
        d.rotation.x += (dCurl - d.rotation.x) * Math.min(1, dt * 8);
      }
      // Palm cores heat accent→danger with the wind-up (attack anatomy law).
      h.core.scale.setScalar(1 + charge * 0.6 + setpieceK * 0.3);
    }
    _coreColor.copy(ACCENT_COLOR).lerp(DANGER_COLOR, charge);
    coreMat.color.copy(_coreColor).multiplyScalar(1 + charge * 1.4);
    coreMat.opacity = shieldClamp ? 0.25 : 0.75 * (1 - dyingK) * (0.7 + charge * 0.3 + Math.sin(time * 2.1) * 0.08);

    // Backlight disc: slow idle pulse only (never a charge tell).
    glowDiscMat.opacity = 0.26 + Math.sin(time * 0.7) * 0.05;

    // Shed plates fly + fade.
    tickSheds(dt);

    // Orbiters — the legacy drift loop (masonry caught in its gravity).
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(
        Math.cos(u.ang) * u.radius,
        u.baseY + Math.sin(time * 1.4 + u.tilt) * 0.5,
        Math.sin(u.ang) * u.radius
      );
      o.rotation.x += dt * 1.6;
      o.rotation.y += dt * 1.1;
    }
  }

  // Muzzle: bullets/FX originate at the chest keystone line. On `group` (not
  // `rig`) so it ignores the breath-bob — a stable controller reference.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, -0.6, 2.4);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,   // kit dissolve + the mournful-death choreography
    setCharge,
    setAttackTell,                     // optional — gesture family per telegraph (controller ?.-calls)
    setSetpiece,                       // optional — the crossing-pass spread (controller ?.-calls)
    setGaze,
    notice,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: flinchFlash,                // kit flash + the pain flinch
    // tickBody first, kit.tickCommon LAST (its flash decay must win any
    // same-frame write to a shared material — the house write-order rule).
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
