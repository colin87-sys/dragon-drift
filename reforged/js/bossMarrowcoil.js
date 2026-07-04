import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// MARROWCOIL — "What the Sky Could Not Digest" (BOSS-DESIGN.md §5b/§5d slot 4,
// the Tier-2 COLOSSUS after ASHTALON). The bone dragon: a horned skull leading
// SIXTEEN coiling vertebrae — the DOMINANT mass — with a mid-body RIBCAGE the
// rail flies straight through (a clear, ice-blue-rimmed aperture).
//
// SILHOUETTE-FIRST (§3.1): "a colossal bone dragon — a horned skull leading
// sixteen coiling vertebrae, with a ribcage you fly through." The coiling
// vertebral chain is the dominant form; the ribcage barrel is the secondary
// mass + the hook; the horned skull leads. A black fill reads as a coiling
// serpent skeleton, not a mask/ring-eye/raptor.
//
// FOCAL (§3.2): the LURE-LIGHT between the horns is THE brightest point (HDR ×3),
// the two recessed pinlight EYES second (HDR ×2.4), the aperture rim a dim ice
// rim (<half). Everything else is pale bone or near-black carved recess.
//
// PALETTE (registry slot 4, VALUE INVERSION — sanctioned): warm pale BONE
// 0xd8d2c0 self-lit (~75%), near-black desaturated joints/sockets 0x241f1a +
// dark edge-cage painting the CARVED value hierarchy (~20%), ice-blue 0x8fd0ff
// lights hottest (<5%). `gate: { pale: true }` on the def (registry-sanctioned)
// inverts the dark-body law; the dark joints keep it from reading plastic.
//
// THE SCAR (§3.6): the third rib-pair's LEFT rib is snapped at half-arc with a
// jagged dark-marrow end — the memory hook + the lore gap (whose skeleton?).
//
// FACELESS? No — the skull is a face (eyes + hinged jaw), so the §4 charisma
// ladder is built in eye/jaw anatomy behind setGaze/notice:
//   GAZE eyes track + skull tilts · BLINK eyes gutter · CHARGE jaw hinges open +
//   eyes constrict + lure flares · EXPRESSION jaw states + eye intensity ·
//   FLINCH skull recoils + cage flexes · NOTICE eyes snap hot + jaw gapes ·
//   DEATH eyes ease shut, jaw slack, coil limp, lure guttered.
//
// THE COIL: the sixteen vertebrae are RESAMPLED each frame along a CatmullRom
// whose control points run a traveling sine (the coil sweep). THE DREAD (§5f
// "MARROW — The Closing Ribs"): setSetpiece(k) constricts the barrel one ring at
// a time while the coil sweeps — the graze goldmine.
//
// CONTRACT: boss.js stomps group.rotation (placeGroup) + setDissolve owns
// group.scale — every animated part lives on rig / vertebra nodes / pivots.

export function buildBoneCoil(def, quality = 1) {
  const accent = def.accent ?? 0x8fd0ff;   // ice-blue — the cold lights on dead bone
  const glow = def.glow ?? 0xbfe6ff;
  const lowQ = quality < 0.75;

  const kit = createBossCommon(def, quality, { shieldRadius: 4.8, hpBarY: 10.6, hpBarZ: 1.4, hpBarScale: 0.7 });
  const { group, track } = kit;
  group.userData.archetype = 'boneCoil';

  const rig = new THREE.Group();
  rig.position.y = -0.4;
  group.add(rig);

  const strip = stripForMerge;
  const mergeBone = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildBoneCoil: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ---- Painted value tiers (§3.4). Warm pale BONE self-lit (emissive floor) so
  // the sanctioned VALUE INVERSION clears G2 (median ≥150) under hemisphere-only
  // front light; the DARKS (0x241f1a joints/sockets/roots, zero emissive) carve
  // the value hierarchy so the pale mass reads CARVED, not injection-moulded.
  const BONE_EI = 0.95, RIB_EI = 0.82;
  const boneMat = track(new THREE.MeshStandardMaterial({
    color: 0xd8d2c0, emissive: 0xd8d2c0, emissiveIntensity: BONE_EI, roughness: 0.82, metalness: 0.0, flatShading: true,
  }));
  const ribBoneMat = track(new THREE.MeshStandardMaterial({
    color: 0xcfc8b4, emissive: 0xcfc8b4, emissiveIntensity: RIB_EI, roughness: 0.85, metalness: 0.0, flatShading: true,
  }));
  const darkMat = track(new THREE.MeshStandardMaterial({
    color: 0x241f1a, emissive: 0x000000, emissiveIntensity: 0.0, roughness: 0.92, metalness: 0.0, flatShading: true,
  }));
  darkMat.side = THREE.DoubleSide;
  ribBoneMat.side = THREE.DoubleSide;
  // Carved dark seams: an EdgesGeometry cage line on the pale masses.
  const edgeMat = track(new THREE.LineBasicMaterial({ color: 0x140f0b, transparent: true, opacity: 0.85 }));

  // ---------------------------------------------------------------------
  // THE SKULL — an elongated dragon cranium + a long tapered snout + hinged jaw
  // + two horns swept BACK and OUT (dragon horns, not ears). A carved edge cage
  // and deep dark sockets keep it reading as bone, not a box mascot.
  // ---------------------------------------------------------------------
  const skull = new THREE.Group();
  skull.position.set(0, 5.6, 0.9);
  rig.add(skull);

  const CRANIUM_W = 1.7;
  const craniumGeo = (() => {
    // Wedge cranium: wider at the back (brain-case), tapering forward into the
    // snout — a skull profile, not a cube. Built from a back box + a tapered
    // snout box + a blunt muzzle, plus mirrored cheek arches.
    const braincase = strip(new THREE.BoxGeometry(CRANIUM_W, 1.4, 1.3));
    braincase.translate(0, 0.2, -0.55);
    const dome = strip(new THREE.OctahedronGeometry(1.05, lowQ ? 0 : 1));
    dome.scale(CRANIUM_W * 0.5, 0.55, 0.85); dome.translate(0, 0.66, -0.55);
    // Long tapered SNOUT projecting forward (foreshortened from the rail) — the
    // dragon muzzle. Two stacked boxes narrowing toward a blunt nose.
    const snoutA = strip(new THREE.BoxGeometry(1.02, 0.72, 1.5)); snoutA.translate(0, -0.16, 0.75);
    const snoutB = strip(new THREE.BoxGeometry(0.66, 0.5, 1.2)); snoutB.translate(0, -0.24, 1.75);
    const nose = strip(new THREE.BoxGeometry(0.5, 0.4, 0.4)); nose.translate(0, -0.3, 2.45);
    // Cheekbone arches (mirrored relief).
    const cheek = (sx) => { const c = strip(new THREE.BoxGeometry(0.3, 0.72, 1.15)); c.rotateZ(-sx * 0.12); c.translate(sx * (CRANIUM_W * 0.5 + 0.03), -0.08, -0.2); return c; };
    // A ridged brow crest between the horns (centre-line structure, not a flat top).
    const crest = strip(new THREE.BoxGeometry(0.34, 0.4, 1.0)); crest.rotateX(0.2); crest.translate(0, 0.66, 0.1);
    return mergeBone([braincase, dome, snoutA, snoutB, nose, cheek(1), cheek(-1), crest], 'cranium');
  })();
  const craniumMesh = new THREE.Mesh(craniumGeo, boneMat);
  skull.add(craniumMesh);
  // Carved edge cage on the cranium (dark seams — §3.4, gate directive 4).
  skull.add(new THREE.LineSegments(new THREE.EdgesGeometry(craniumGeo, 24), edgeMat));

  // Dark skull recesses: deep EYE SOCKETS (shadow tunnels the pinlights sit in) +
  // nostril pits + under-snout shadow + horn-base sockets — all carved near-black.
  const skullDarkGeo = (() => {
    const parts = [];
    const socket = (sx) => { const s = strip(new THREE.BoxGeometry(0.5, 0.44, 0.6)); s.translate(sx * 0.52, 0.14, 0.32); return s; };
    parts.push(socket(1), socket(-1));
    const nostril = (sx) => { const n = strip(new THREE.BoxGeometry(0.12, 0.14, 0.32)); n.translate(sx * 0.16, -0.26, 2.55); return n; };
    parts.push(nostril(1), nostril(-1));
    const jawline = strip(new THREE.BoxGeometry(0.9, 0.12, 1.9)); jawline.translate(0, -0.5, 0.9);
    parts.push(jawline);
    const hb = (sx) => { const b = strip(new THREE.OctahedronGeometry(0.26, 0)); b.translate(sx * 0.6, 0.78, -0.4); return b; };
    parts.push(hb(1), hb(-1));
    return mergeBone(parts, 'skullDark');
  })();
  skull.add(new THREE.Mesh(skullDarkGeo, darkMat));

  // Hinged JAW (telegraph pivot). A tapered under-jaw slab; the mouth is a dark
  // recessed slot (NOT a front grid of teeth), with a few subtle fang tips only.
  const jawPivot = new THREE.Object3D();
  jawPivot.name = 'jawPivot';
  jawPivot.position.set(0, -0.5, 0.2);
  skull.add(jawPivot);
  const jawGeo = (() => {
    const slab = strip(new THREE.BoxGeometry(0.82, 0.32, 1.85)); slab.translate(0, -0.12, 1.0);
    const chin = strip(new THREE.BoxGeometry(0.5, 0.26, 0.5)); chin.translate(0, -0.18, 2.05);
    // Two subtle fang tips at the front corners only (not a full toothy rectangle).
    const fang = (sx) => { const t = strip(new THREE.ConeGeometry(0.08, 0.3, 4)); t.translate(sx * 0.28, 0.12, 1.9); return t; };
    return mergeBone([slab, chin, fang(1), fang(-1)], 'jaw');
  })();
  jawPivot.add(new THREE.Mesh(jawGeo, boneMat));
  const jawDark = new THREE.Mesh(strip(new THREE.BoxGeometry(0.6, 0.2, 1.3)), darkMat);   // recessed mouth slot
  jawDark.position.set(0, 0.06, 0.95); jawPivot.add(jawDark);

  // ---- HORNS — two tapered TubeGeometry sweeps raked BACK (−z) and OUT (±x)
  // ~0.8 rad off vertical, length ≥1.5×cranium width (dragon horns, not ears).
  function taperTube(geo, curve, tubularSegments, radialSegments, taperFn) {
    const pos = geo.attributes.position, ringVerts = radialSegments + 1;
    for (let i = 0; i <= tubularSegments; i++) {
      const u = i / tubularSegments, c = curve.getPointAt(u), k = taperFn(u);
      for (let j = 0; j < ringVerts; j++) {
        const idx = i * ringVerts + j; if (idx >= pos.count) continue;
        pos.setXYZ(idx, c.x + (pos.getX(idx) - c.x) * k, c.y + (pos.getY(idx) - c.y) * k, c.z + (pos.getZ(idx) - c.z) * k);
      }
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
  }
  const hornTubular = lowQ ? 8 : 14, hornRadial = lowQ ? 5 : 7;
  const makeHornGeo = (sx) => {
    // Base on the cranium back-top; rakes UP a little then hard BACK and OUT so
    // the tip lands well behind the skull (−z 3.4) and out (±x 2.0) — length ~3.6.
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx * 0.6, 0.85, -0.45),
      new THREE.Vector3(sx * 1.35, 1.5, -1.6),
      new THREE.Vector3(sx * 2.0, 1.65, -3.4),
    ]);
    const g = strip(new THREE.TubeGeometry(curve, hornTubular, 0.34, hornRadial, false));
    taperTube(g, curve, hornTubular, hornRadial, (u) => Math.max(0.16, 1 - u * 0.8));
    return g;
  };
  skull.add(new THREE.Mesh(mergeBone([makeHornGeo(1), makeHornGeo(-1)], 'horns'), boneMat));

  // ---- PINLIGHT EYES (§3.2/§4) — tiny HDR ice-blue spheres recessed DEEP in the
  // dark sockets (diameter ≤0.25× socket width). A small saturated halo reads the
  // hollow-set glow. In one `eyes` group so setGaze slides them + the skull carries.
  const EYE_BASE = new THREE.Color(accent);
  const EYE_HOT = 2.4;
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: accent })); eyeMat.toneMapped = false;
  eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const eyeHaloMat = track(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  eyeHaloMat.toneMapped = false; eyeHaloMat.color.copy(EYE_BASE).multiplyScalar(1.25);
  const eyes = new THREE.Group(); eyes.position.copy(skull.position); rig.add(eyes);
  {
    const hl = strip(new THREE.SphereGeometry(0.18, 8, 6)); hl.translate(-0.52, 0.14, 0.5);
    const hr = strip(new THREE.SphereGeometry(0.18, 8, 6)); hr.translate(0.52, 0.14, 0.5);
    eyes.add(new THREE.Mesh(mergeGeometries([hl, hr], false), eyeHaloMat));
  }
  const eyeMeshes = [];
  for (const sx of [-1, 1]) {
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), eyeMat);
    core.position.set(sx * 0.52, 0.14, 0.52); eyes.add(core);   // recessed just inside the 0.6-deep socket
    eyeMeshes.push({ core, sx });
  }

  // ---- THE LURE — the FOCAL (§3.2): an HDR ice-blue teardrop on a bare strand
  // between the horn bases, forward of the skull. The single hottest point (×3).
  const LURE_BASE = new THREE.Color(accent);
  const LURE_HOT = 3.0;
  const lureMat = track(new THREE.MeshBasicMaterial({ color: accent })); lureMat.toneMapped = false;
  lureMat.color.copy(LURE_BASE).multiplyScalar(LURE_HOT);
  const lureHaloMat = track(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  lureHaloMat.toneMapped = false; lureHaloMat.color.copy(LURE_BASE).multiplyScalar(1.5);
  const lure = new THREE.Group();
  lure.position.set(0, 2.5, 1.3);
  skull.add(lure);
  const strandMat = track(new THREE.LineBasicMaterial({ color: 0xcfc8b4, transparent: true, opacity: 0.6 }));
  strandMat.toneMapped = false;
  lure.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.9, -0.6), new THREE.Vector3(0, 0, 0)]), strandMat));
  const lureHalo = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), lureHaloMat); lure.add(lureHalo);
  const lureGeo = (() => {
    const s = strip(new THREE.SphereGeometry(0.24, 10, 8));
    const drip = strip(new THREE.ConeGeometry(0.14, 0.4, 8)); drip.rotateX(Math.PI); drip.translate(0, -0.28, 0);
    return mergeGeometries([s, drip], false) || s;
  })();
  const lureBead = new THREE.Mesh(lureGeo, lureMat); lure.add(lureBead);

  // ---------------------------------------------------------------------
  // THE SPINE — sixteen CHUNKY octahedron VERTEBRAE (r 0.5→0.25 taper, the
  // DOMINANT mass, §3.1) resampled each frame along the coil curve. Each carries
  // 2 short torus-arc RIB STUBS + a near-black JOINT DISC at its top junction, and
  // the pitch exceeds the vertebra width so real VOID gaps separate every bone
  // (anti-sausage). The curve routes the descending tail BEHIND the ribcage (−z)
  // so the fly-through aperture stays clear negative space.
  // ---------------------------------------------------------------------
  const N_VERT = 16;
  // The chain routes: a visible COILING NECK (frontal S) from the skull down to
  // the ribcage; the DORSAL spine then runs BACK along the barrel top (−z, the
  // ribs hang below it); a short TAIL drops off behind. This keeps the fly-through
  // aperture (the barrel centre, below the dorsal spine) clear of the chain.
  const ctrlBase = [
    new THREE.Vector3(0.0, 5.4, 0.6),     // nape under the skull
    new THREE.Vector3(2.4, 3.7, 0.3),     // neck coils right (the visible coil)
    new THREE.Vector3(-2.3, 2.0, 0.1),    // neck coils left
    new THREE.Vector3(1.4, 0.3, -0.3),    // down into the ribcage region
    new THREE.Vector3(-0.8, -1.6, -1.3),  // spine descends BEHIND the barrel (−z, aperture stays clear)
    new THREE.Vector3(0.7, -3.5, -2.0),   // tail, behind
    new THREE.Vector3(0.2, -5.3, -1.6),   // tail tip, behind
  ];
  const ctrlAmp = ctrlBase.map((_, i) => 2.4 * Math.sin(Math.PI * i / (ctrlBase.length - 1)));
  const spineCurve = new THREE.CatmullRomCurve3(ctrlBase.map((p) => p.clone()));
  spineCurve.curveType = 'catmullrom';
  spineCurve.arcLengthDivisions = lowQ ? 32 : 60;   // arc-length LUT resolution (rebuilt each frame for EVEN vertebra pitch)

  const vertDetail = lowQ ? 0 : 1;
  const RIB_ANCHOR = 7;   // the dorsal vertebra the ribcage barrel rides (mid-arc)
  const vertNodes = [];
  // Joint discs on the larger/visible vertebrae (draw budget: the tiny tail-tip
  // junctions rely on the wide gaps instead). A near-black disc between bones.
  const JOINT_ON = new Set([2, 3, 4, 5, 6, 7, 8]);   // dark joints on the visible mid-mass bones (draw budget; tail-tips rely on wide gaps)
  for (let i = 0; i < N_VERT; i++) {
    const t = i / (N_VERT - 1);
    const r = 0.44 - t * 0.22;   // taper 0.44 → 0.22 (chunky bones = the dominant mass; pitch stays > width with a real gap)
    const node = new THREE.Object3D();
    rig.add(node);
    const octa = strip(new THREE.OctahedronGeometry(r, vertDetail));
    // Two short torus-arc rib stubs sweeping out to each side (x/z plane, minimal
    // y-extent so the along-chain vertebra width stays the octahedron diameter).
    const stubR = r * 0.6 + 0.12, stubTube = 0.06, stubArc = Math.PI * 0.5;
    const stub = (sx) => {
      const g = strip(new THREE.TorusGeometry(stubR, stubTube, lowQ ? 4 : 5, lowQ ? 5 : 7, stubArc));
      g.rotateY(Math.PI / 2); g.rotateZ(sx > 0 ? -0.35 : Math.PI + 0.35);
      g.translate(sx * (r * 0.55), -0.04, -0.02);
      return g;
    };
    const vGeo = mergeBone([octa, stub(1), stub(-1)], `vert${i}`);
    vGeo.computeBoundingBox();
    const mesh = new THREE.Mesh(vGeo, boneMat);
    mesh.name = 'vertebra';
    node.add(mesh);
    // Near-black JOINT DISC at the top junction (carved dark seam between bones).
    if (JOINT_ON.has(i)) {
      const disc = new THREE.Mesh(strip(new THREE.CylinderGeometry(r * 0.82, r * 0.82, 0.1, 8)), darkMat);
      disc.position.set(0, r * 0.62, -0.05);
      node.add(disc);
    }
    vertNodes.push({ node, mesh, t, r });
  }

  // ---------------------------------------------------------------------
  // THE RIBCAGE — a coherent BARREL riding the mid-spine (RIB_ANCHOR vertebra),
  // hanging BELOW the dorsal spine so its centre is a CLEAR oval of negative space
  // (≥9 units wide at scale) — the fly-through the rail threads. Five SEPARATE
  // thin torus-arc rib PAIRS (sky between every pair), each a `ribPivot` for the
  // dread constriction, roots anchored up to the spine. The near aperture is
  // rimmed with a faint ice-blue ring so the tunnel reads "go here".
  // ---------------------------------------------------------------------
  const ribcage = new THREE.Group();   // repositioned each frame onto the anchor vertebra (rides the coil, stays connected)
  rig.add(ribcage);
  const N_RING = 5;
  const ribR = 3.9;                     // inner clearance 2·(R−tube) ≈ 7.4 local ≈ 9.6 world @scale — the ≥9 aperture
  const ribTube = 0.18, ribArc = Math.PI * 0.6;
  const ribRadialSeg = lowQ ? 4 : 6, ribTubularSeg = lowQ ? 10 : 16;
  const APERTURE_DY = -ribR * 0.72;     // hang the barrel below the dorsal spine so the spine sits at the ring top
  // One rib = a torus arc centred on the side axis; a PAIR = left + right with the
  // dorsal (spine) + ventral gaps a real ribcage has (sky shows between pairs).
  const makeRibArc = (sx, span = ribArc) => {
    const g = strip(new THREE.TorusGeometry(ribR, ribTube, ribRadialSeg, ribTubularSeg, span));
    g.rotateZ(-span / 2 + (sx > 0 ? 0 : Math.PI));
    return g;
  };
  const ribPivots = [];
  for (let h = 0; h < N_RING; h++) {
    const pivot = new THREE.Object3D();
    pivot.name = 'ribPivot';
    pivot.position.set(0, APERTURE_DY, -0.2 + (h - (N_RING - 1) / 2) * 0.95);   // stacked in depth = a barrel
    ribcage.add(pivot);
    // The scar (§3.6): ring index 2 (the third pair)'s LEFT rib snapped at half-arc.
    const leftSpan = h === 2 ? ribArc * 0.5 : ribArc;
    pivot.add(new THREE.Mesh(mergeBone([makeRibArc(1), makeRibArc(-1, leftSpan)], `ribRing${h}`), ribBoneMat));
    // Jagged dark-marrow stump on the scar rib's broken end (rides its ring).
    if (h === 2) {
      const stump = new THREE.Mesh(strip(new THREE.OctahedronGeometry(0.22, 0)), darkMat);
      const endA = Math.PI - leftSpan / 2 - leftSpan / 2;   // the free (broken) end of the shortened left arc
      stump.position.set(Math.cos(endA) * ribR, Math.sin(endA) * ribR, 0);
      pivot.add(stump);
    }
    ribPivots.push({ pivot, idx: h });
  }
  // Dark rib-ROOT knuckles where every pair meets the dorsal spine — ONE merged
  // dark mesh on the barrel (they sit at the spine, don't constrict; carved joint).
  {
    const roots = [];
    for (let h = 0; h < N_RING; h++) {
      const z = -0.2 + (h - (N_RING - 1) / 2) * 0.95;
      for (const sx of [-1, 1]) { const b = strip(new THREE.OctahedronGeometry(0.16, 0)); b.translate(sx * 0.4, APERTURE_DY + ribR * 0.9, z); roots.push(b); }
    }
    ribcage.add(new THREE.Mesh(mergeBone(roots, 'ribRoots'), darkMat));
  }
  // Ice-blue APERTURE RIM on the near ring — the "fly here" tell (dim, ei-analog
  // via HDR ×1.0, well below the eyes/lure focal). A thin ring at the front mouth.
  const rimMat = track(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
  rimMat.toneMapped = false; rimMat.color.copy(EYE_BASE).multiplyScalar(1.0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(ribR - ribTube, 0.05, 6, 40), rimMat);
  rim.position.set(0, APERTURE_DY, -0.2 + ((N_RING - 1) / 2) * 0.95 + 0.4);   // on the nearest ring's front
  ribcage.add(rim);

  // ---- TAIL BLADE — a flat bone kite off the last vertebra.
  const tail = new THREE.Object3D();
  vertNodes[N_VERT - 1].node.add(tail);
  const tailGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.quadraticCurveTo(0.5, -0.6, 0, -1.7); s.quadraticCurveTo(-0.5, -0.6, 0, 0);
    const g = strip(new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: !lowQ, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1, steps: 1 }));
    g.translate(0, 0, -0.05);
    const ridge = strip(new THREE.BoxGeometry(0.08, 1.3, 0.16)); ridge.translate(0, -0.65, 0.02);
    return mergeGeometries([g, ridge], false) || g;
  })();
  tail.add(new THREE.Mesh(tailGeo, boneMat));

  // ---- ORBITERS — two small pale bone chips (orbiter contract ≥2), dim so they
  // read as shed bone, never rival the focal.
  const chipMat = track(new THREE.MeshStandardMaterial({
    color: 0xb6b0a2, emissive: 0xb6b0a2, emissiveIntensity: 0.5, roughness: 0.9, metalness: 0.0, flatShading: true,
  }));
  const chipGeo = strip(new THREE.OctahedronGeometry(0.19, 0));
  const orbiters = [];
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Mesh(chipGeo, chipMat);
    m.userData = { ang: (i / 2) * Math.PI * 2 + 0.6, radius: 4.8 + i * 0.7, speed: 0.5 + i * 0.18, baseY: -2.0 - i * 1.2, tilt: i * 1.3 };
    rig.add(m);
    orbiters.push(m);
  }

  kit.flashBind(ribBoneMat, RIB_EI);
  kit.finalize();

  // ---------------------------------------------------------------------
  // ANIMATION
  // ---------------------------------------------------------------------
  const COIL_OMEGA = 1.15, COIL_SEP = 1.05;
  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }
  let tell = null;
  function setAttackTell(id) { tell = id || null; }
  let setpieceK = 0, setpieceMode = 'close';
  function setSetpiece(k, spDef) {
    setpieceK = Math.max(0, Math.min(1, k));
    if (spDef && spDef.id === 'ribThread') setpieceMode = 'thread';
    else if (spDef) setpieceMode = 'close';
  }
  let shieldClamp = false, shieldOpenT = 0;
  kit.onShieldChange((v) => { if (v) { shieldClamp = true; return; } if (shieldClamp) { shieldClamp = false; shieldOpenT = 0.25; } });

  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  let lookAwayT = 0, lookAwayX = 0, lookAwayY = 0, nextLookAway = 5 + Math.random() * 6;
  function setGaze(nx, ny) { gazeTX = Math.max(-1, Math.min(1, nx)); gazeTY = Math.max(-1, Math.min(1, ny)); }
  const BLINK_DUR = 0.2;
  let blinkT = 0, nextBlink = 3 + Math.random() * 3;
  let noticeT = 0;
  function notice() { noticeT = 0.9; blinkT = 0; nextBlink = 3; }
  let painT = 0;
  function flinchFlash(amt) { if (amt > 0.3) painT = Math.max(painT, 0.3); kit.flash(amt); }
  let dyingK = 0;
  function setDissolveEmotive(k) { dyingK = Math.max(0, Math.min(1, k)); kit.setDissolve(k); }

  const _v = new THREE.Vector3();
  function tickBody(dt, time) {
    rig.rotation.z = Math.sin(time * 0.4) * 0.02 + Math.sin(time * 0.9) * 0.008;

    // COIL SWEEP: traveling sine through the control points, resample 16 vertebrae.
    const coilAmp = (1 - dyingK * 0.7) * (1 + charge * 0.1);
    const coilRate = time * COIL_OMEGA * (1 - dyingK * 0.6);
    for (let i = 0; i < ctrlBase.length; i++) {
      spineCurve.points[i].x = ctrlBase[i].x + ctrlAmp[i] * coilAmp * Math.sin(i * COIL_SEP - coilRate);
      spineCurve.points[i].y = ctrlBase[i].y + dyingK * (-1.2) * (i / (ctrlBase.length - 1));
    }
    // Resample by ARC LENGTH (updateArcLengths rebuilds the LUT for the mutated
    // points) so the 16 vertebrae space EVENLY — even pitch keeps every bone gap
    // open (pitch > width, the anti-sausage assert) regardless of the coil shape.
    spineCurve.updateArcLengths();
    for (let k = 0; k < N_VERT; k++) { spineCurve.getPointAt(k / (N_VERT - 1), _v); vertNodes[k].node.position.copy(_v); }
    // The ribcage barrel rides the anchor vertebra (stays connected + coherent).
    ribcage.position.copy(vertNodes[RIB_ANCHOR].node.position);

    // Gaze
    nextLookAway -= dt;
    if (lookAwayT > 0) lookAwayT -= dt;
    else if (nextLookAway <= 0 && charge < 0.2 && noticeT <= 0 && dyingK <= 0) {
      lookAwayT = 0.6 + Math.random() * 0.6; lookAwayX = (Math.random() - 0.5) * 1.4; lookAwayY = Math.random() * 0.4 - 0.2; nextLookAway = 5 + Math.random() * 6;
    }
    const gx = lookAwayT > 0 ? lookAwayX : gazeTX, gy = lookAwayT > 0 ? lookAwayY : gazeTY;
    const gLag = (noticeT > 0 || charge > 0.5) ? 9 : 2.4;
    gazeX += (gx - gazeX) * Math.min(1, dt * gLag); gazeY += (gy - gazeY) * Math.min(1, dt * gLag);

    // Blink
    if (blinkT > 0) blinkT -= dt;
    else { nextBlink -= dt; if (nextBlink <= 0 && charge < 0.5 && noticeT <= 0 && dyingK <= 0) { blinkT = BLINK_DUR; nextBlink = 3 + Math.random() * 3; } }
    const blinkProg = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;

    if (painT > 0) painT -= dt;
    if (noticeT > 0) noticeT -= dt;
    if (shieldOpenT > 0) shieldOpenT -= dt;

    skull.rotation.y = gazeX * 0.16; skull.rotation.x = -gazeY * 0.1 + charge * 0.04;
    eyes.rotation.copy(skull.rotation);
    eyes.position.set(skull.position.x, skull.position.y, skull.position.z);

    // JAW (charge telegraph)
    let jawOpen = charge * 0.65;
    if (tell === 'aimed' || tell === 'stream' || tell === 'crossfire') jawOpen = Math.max(jawOpen, charge * 0.8);
    if (noticeT > 0.5) jawOpen = Math.max(jawOpen, 0.75);
    if (setpieceMode === 'thread' && setpieceK > 0) jawOpen = Math.max(jawOpen, setpieceK * 0.85);
    if (painT > 0) jawOpen = Math.max(jawOpen, (painT / 0.3) * 0.5);
    if (dyingK > 0) jawOpen = jawOpen * (1 - dyingK) + 0.5 * dyingK;
    if (shieldClamp) jawOpen = 0.05;
    const jawSpeed = (charge > 0.25 || painT > 0 || shieldClamp) ? 16 : 6;
    jawPivot.rotation.x += (-jawOpen - jawPivot.rotation.x) * Math.min(1, dt * jawSpeed);

    const recoil = (painT > 0 ? painT / 0.3 : 0) * 0.4 + (noticeT > 0.6 ? (noticeT - 0.6) / 0.3 : 0) * 0.3;
    rig.position.z = -recoil; rig.position.y = -0.4 + dyingK * -0.4;

    // Bone dims under shield/death (G6 leash from the body).
    const boneLit = shieldClamp ? 0.5 : (1 - dyingK * 0.55);
    boneMat.emissiveIntensity = BONE_EI * boneLit;
    ribBoneMat.emissiveIntensity = RIB_EI * boneLit;

    // Ice-blue lights: lure hottest, eyes second; flicker; constrict on charge;
    // gutter on blink/death; leash hard under a shield.
    const flick = 0.85 + Math.sin(time * 3.6) * 0.1 + Math.sin(time * 11) * 0.04;
    let eyeK = shieldClamp ? 0.1 : flick * (1 - blinkProg * 0.85) * (1 + charge * 0.5);
    let lureK = shieldClamp ? 0.12 : (0.9 + Math.sin(time * 2.3) * 0.1) * (1 + charge * 0.35);
    if (noticeT > 0) { eyeK *= 1.35; lureK *= 1.35; }
    eyeK *= 1 - dyingK * 0.95; lureK *= 1 - dyingK * 0.9;
    eyeMat.color.copy(EYE_BASE).multiplyScalar(Math.max(0.05, eyeK) * EYE_HOT);
    eyeHaloMat.opacity = Math.max(0.03, 0.5 * eyeK);
    lureMat.color.copy(LURE_BASE).multiplyScalar(Math.max(0.1, lureK) * LURE_HOT);
    lureHaloMat.opacity = Math.max(0.05, 0.6 * lureK * (1 - dyingK * 0.9));
    strandMat.opacity = 0.6 * (1 - dyingK);
    rimMat.opacity = Math.max(0.06, (0.55 + Math.sin(time * 2) * 0.15) * (shieldClamp ? 0.2 : 1) * (1 - dyingK * 0.9));
    for (const e of eyeMeshes) {
      const pin = 1 - charge * 0.35 + dyingK * 0.4;
      e.core.scale.set(pin, pin * (1 - blinkProg * 0.9), pin);
      e.core.position.x = e.sx * 0.52 + gazeX * 0.05;
    }
    lureBead.position.y = Math.sin(time * 1.4) * 0.06 + charge * 0.1;
    lure.scale.setScalar((1 + charge * 0.18) * (1 - dyingK * 0.6));

    // RIBCAGE dread telegraph ("The Closing Ribs"): setSetpiece constricts the
    // rings ONE AT A TIME (staggered), or (thread mode) flares open for the pass.
    for (const rb of ribPivots) {
      const j = rb.idx;
      const breathe = Math.sin(time * 1.1 + j * 0.7) * 0.03;
      let s;
      if (setpieceMode === 'thread' && setpieceK > 0) s = 1 + breathe + setpieceK * 0.08;
      else { const stagger = Math.max(0, Math.min(1, (setpieceK - j * 0.12) / 0.4)); s = 1 + breathe - stagger * 0.5 - charge * 0.05; }
      if (painT > 0) s = Math.max(s, 1 + (painT / 0.3) * 0.14);
      if (shieldClamp) s = 0.9;
      s *= 1 - dyingK * 0.25;
      const es = rb.pivot.scale.x + (s - rb.pivot.scale.x) * Math.min(1, dt * (setpieceK > 0 || charge > 0.25 ? 14 : 5));
      rb.pivot.scale.set(es, es, 1);
    }

    tail.rotation.z = Math.sin(time * COIL_OMEGA - COIL_SEP * 6) * 0.4 * (1 - dyingK * 0.6);

    for (const o of orbiters) {
      const u = o.userData; u.ang += dt * u.speed;
      o.position.set(Math.cos(u.ang) * u.radius, u.baseY + Math.sin(time * 1.2 + u.tilt) * 0.6, -0.8 + Math.sin(u.ang) * u.radius * 0.3);
      o.rotation.x += dt * 1.3; o.rotation.y += dt * 1.0;
    }
  }

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 4.6, 2.6);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge, setAttackTell, setSetpiece,
    setGaze, notice,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: flinchFlash,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); },
  };
}
