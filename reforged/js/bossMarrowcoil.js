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

  const kit = createBossCommon(def, quality, { shieldRadius: 4.8, hpBarY: 11.4, hpBarZ: 1.4, hpBarScale: 0.7 });
  const { group, track } = kit;
  group.userData.archetype = 'boneCoil';

  const rig = new THREE.Group();
  rig.name = 'boneRig';   // capture-tool seam: profile crops yaw this (placeGroup owns group, never rig)
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
  // RIB_EI sits well under BONE_EI (gate r4 #7): the rib family reads a clear
  // value step darker/warmer than the vertebra family, not one plastic mass.
  const BONE_EI = 0.95, RIB_EI = 0.62;
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
  skull.position.set(0, 6.9, 1.15);   // leads the (longer, ×1.6-boned) chain; occiput overlaps vertebra 0
  skull.scale.setScalar(1.22);        // head stays the dominant terminal mass over the ×1.6 neck bones (§3.1 ladder)
  rig.add(skull);

  const CRANIUM_W = 1.7;
  // Wedge cranium: wider at the back (brain-case), tapering forward into the
  // snout — a skull profile, not a cube. Sub-parts are kept separate so the
  // dark edge cage can be built WITHOUT the snout: its front-face rim read as a
  // dark screen/second-mouth under the eyes (gate r3 #3).
  const capParts = (() => {   // the brain-case cap (gets the edge cage)
    const braincase = strip(new THREE.BoxGeometry(CRANIUM_W, 1.4, 1.3));
    braincase.translate(0, 0.2, -0.55);
    const dome = strip(new THREE.OctahedronGeometry(1.05, lowQ ? 0 : 1));
    dome.scale(CRANIUM_W * 0.5, 0.55, 0.85); dome.translate(0, 0.66, -0.55);
    const cheek = (sx) => { const c = strip(new THREE.BoxGeometry(0.3, 0.72, 1.15)); c.rotateZ(-sx * 0.12); c.translate(sx * (CRANIUM_W * 0.5 + 0.03), -0.08, -0.2); return c; };
    const crest = strip(new THREE.BoxGeometry(0.34, 0.4, 1.0)); crest.rotateX(0.2); crest.translate(0, 0.66, 0.1);
    return [braincase, dome, cheek(1), cheek(-1), crest];
  })();
  const snoutParts = (() => {   // the muzzle (NO edge cage — plain bone faces)
    const snoutA = strip(new THREE.BoxGeometry(1.02, 0.72, 1.5)); snoutA.translate(0, -0.16, 0.75);
    const snoutB = strip(new THREE.BoxGeometry(0.66, 0.5, 1.2)); snoutB.translate(0, -0.24, 1.75);
    const nose = strip(new THREE.BoxGeometry(0.5, 0.4, 0.4)); nose.translate(0, -0.3, 2.45);
    return [snoutA, snoutB, nose];
  })();
  const capGeo = mergeBone(capParts, 'craniumCap');
  const craniumGeo = mergeBone([capGeo.clone(), ...snoutParts], 'cranium');
  const craniumMesh = new THREE.Mesh(craniumGeo, boneMat);
  skull.add(craniumMesh);
  // Carved edge cage on the BRAIN-CASE only (dark seams — §3.4); the snout's
  // front face stays clean bone (gate r3 #3).
  skull.add(new THREE.LineSegments(new THREE.EdgesGeometry(capGeo, 24), edgeMat));

  // Dark skull recesses: deep EYE SOCKETS (shadow tunnels the pinlights sit in) +
  // nostril pits + under-snout shadow + horn-base sockets — all carved near-black.
  const skullDarkGeo = (() => {
    const parts = [];
    const socket = (sx) => { const s = strip(new THREE.BoxGeometry(0.54, 0.48, 0.62)); s.translate(sx * 0.52, 0.14, 0.34); return s; };
    parts.push(socket(1), socket(-1));
    // Nostrils: thin dark SLITS on the snout TOP surface only (a front-face pit
    // read as googly cartoon eyes — gate directive 5 — so keep them off the face).
    const nostril = (sx) => { const n = strip(new THREE.BoxGeometry(0.09, 0.3, 0.22)); n.translate(sx * 0.12, -0.02, 2.35); return n; };
    parts.push(nostril(1), nostril(-1));
    const jawline = strip(new THREE.BoxGeometry(0.9, 0.12, 1.9)); jawline.translate(0, -0.5, 0.9);
    parts.push(jawline);
    // Horn SOCKETS (gate r3 #1): a dark cylinder r 0.34 × h 0.12 SLEEVING each
    // horn root, oriented along the horn's launch direction, at the root point.
    const hornSocket = (sx) => {
      const c = strip(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 8));
      const dir = new THREE.Vector3(sx * 0.4, 0.85, -0.75).normalize();
      c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
      c.translate(sx * 0.55 + dir.x * 0.1, 0.5 + dir.y * 0.1, -0.2 + dir.z * 0.1);
      return c;
    };
    parts.push(hornSocket(1), hornSocket(-1));
    // Inner-mouth plane (gate r3 #2): a dark cavity box under the snout so the
    // OPEN jaw reads as a dark wedge, never sky showing through the head.
    const mouthCavity = strip(new THREE.BoxGeometry(0.72, 0.26, 1.4)); mouthCavity.translate(0, -0.62, 0.95);
    parts.push(mouthCavity);
    // Mouth BACK-PLANE (gate r4 #6): a tall dark plane recessed behind the front
    // teeth — hidden by the closed jaw, it faces the camera as a solid dark
    // wedge ≥0.5 tall when the jaw hinges open (the front-on charge tell).
    const mouthBack = strip(new THREE.BoxGeometry(0.95, 0.55, 0.18)); mouthBack.translate(0, -0.5, 0.5);   // top sits below the closed jaw line — only the OPEN jaw reveals the wedge
    parts.push(mouthBack);
    // Occipital CONDYLE disc (gate r4 #2): the dark junction where vertebra 0
    // roots inside the skull's back-bottom (bone 0 sits at rig (0,6.35,0.0) —
    // static, since the sweep amplitude is 0 at the nape).
    const condyle = strip(new THREE.CylinderGeometry(0.5, 0.5, 0.16, 8)); condyle.translate(0, -0.55, -1.15);
    parts.push(condyle);
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
    // Full snout width (gate r4 #6) so the open jaw breaks the silhouette front-on.
    const slab = strip(new THREE.BoxGeometry(1.02, 0.32, 1.85)); slab.translate(0, -0.12, 1.0);
    const chin = strip(new THREE.BoxGeometry(0.62, 0.26, 0.5)); chin.translate(0, -0.18, 2.05);
    // Two subtle fang tips at the front corners only (not a full toothy rectangle).
    const fang = (sx) => { const t = strip(new THREE.ConeGeometry(0.08, 0.3, 4)); t.translate(sx * 0.28, 0.12, 1.9); return t; };
    return mergeBone([slab, chin, fang(1), fang(-1)], 'jaw');
  })();
  jawPivot.add(new THREE.Mesh(jawGeo, boneMat));
  // Inner-mouth plane (gate r3 #2): its own deeper near-black 0x1a1214 so the
  // open jaw reads as a dark wedge, distinct from the joint darks.
  const mouthMat = track(new THREE.MeshStandardMaterial({
    color: 0x0a0908, emissive: 0x000000, emissiveIntensity: 0.0, roughness: 0.95, metalness: 0.0, flatShading: true,
  }));
  const jawDark = new THREE.Mesh(strip(new THREE.BoxGeometry(0.95, 0.22, 1.5)), mouthMat);   // wide dark mouth slot riding the jaw (reads front-on when it hinges)
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
  // Gate r3 #1, verbatim: roots at the cranium top corners (±0.55, +0.5, −0.2 —
  // INSIDE the braincase box, weld = overlap ≥0.1), swept BACK 0.8 rad off
  // vertical, radius taper 0.28 → 0.06, ~10 path × 6 radial segments.
  const hornTubular = 10, hornRadial = 6;
  const hornCurve = (sx) => new THREE.CatmullRomCurve3([
    new THREE.Vector3(sx * 0.55, 0.5, -0.2),    // root: inside the cranium top corner
    new THREE.Vector3(sx * 0.95, 1.35, -0.95),  // rises, raking back (~0.8 rad off vertical)
    new THREE.Vector3(sx * 1.3, 1.95, -1.9),
    new THREE.Vector3(sx * 1.5, 2.2, -2.9),     // tip: high and well behind (length ~3.3 ≥ 1.5×W)
  ]);
  const makeHornGeo = (sx) => {
    // TAPER FIRST, strip SECOND: taperTube indexes verts as (tubular+1)×(radial+1)
    // rings, which only holds on the INDEXED TubeGeometry — stripForMerge's
    // toNonIndexed() re-lays verts per-triangle and the ring math then mangles the
    // tube into flat shards (the r3 "paddle horns"/"2.05 clearance" root cause).
    const curve = hornCurve(sx);
    const g = new THREE.TubeGeometry(curve, hornTubular, 0.28, hornRadial, false);
    taperTube(g, curve, hornTubular, hornRadial, (u) => Math.max(0.06 / 0.28, 1 - u * (1 - 0.06 / 0.28)));
    return strip(g);
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
  const eyes = new THREE.Group(); eyes.position.copy(skull.position); eyes.scale.copy(skull.scale); rig.add(eyes);   // mirrors the skull transform so the pinlights stay seated in the scaled sockets
  {
    const hl = strip(new THREE.SphereGeometry(0.22, 8, 6)); hl.translate(-0.52, 0.14, 0.58);
    const hr = strip(new THREE.SphereGeometry(0.22, 8, 6)); hr.translate(0.52, 0.14, 0.58);
    eyes.add(new THREE.Mesh(mergeGeometries([hl, hr], false), eyeHaloMat));
  }
  const eyeMeshes = [];
  for (const sx of [-1, 1]) {
    // Seated PROUD of the socket mouth (+0.06 along the socket normal, gate r3
    // #4) so neither eye can be occluded at 3/4 angles — both CLIP white + bloom
    // in every state. Still ringed by the dark socket box (hollow-set); the lure
    // stays the single hottest point.
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 8), eyeMat);
    core.position.set(sx * 0.52, 0.14, 0.76); eyes.add(core);   // fully proud of the socket mouth — no yaw/pitch/roar angle occludes either eye
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
  // Neck coils down (visible, frontal); the DORSAL spine (vertebrae ~6–10) then
  // rides the CROWN of the rib arch, running back in depth (−z) — the ribs hang
  // from these dorsal bones, framing the fly-through below; the post-cage tail
  // exits REARWARD-DOWN BEHIND the cage, outside the aperture cylinder (gate r4
  // #3: the rail's flight line through the rings stays clear of the boss's own
  // tail). ctrl[0] sits INSIDE the skull's occipital face (gate r4 #2 — vertebra
  // 0 roots in the skull; the condyle disc marks the junction).
  const ctrlBase = [
    new THREE.Vector3(0.0, 6.2, -0.25),   // occiput — vertebra 0 sits 0.3 INSIDE the skull's back-bottom (gate r6 #4)
    new THREE.Vector3(2.3, 4.8, 0.3),     // neck coils right (the visible coil)
    new THREE.Vector3(-2.2, 3.3, 0.2),    // neck coils left
    new THREE.Vector3(0.4, 2.0, 0.55),    // arrives at the ribcage crown (front) — soft turn into the depth run
    new THREE.Vector3(0.3, 1.5, -1.4),    // dorsal rides the crown, running back
    new THREE.Vector3(0.7, 0.9, -4.3),    // dorsal back end (long z run)
    new THREE.Vector3(7.6, -6.4, -8.0),   // tail exits rearward-DOWN-OUT, strictly outside the ring's projected circle even mid-sweep (gate r6 #3)
  ];
  // Sweep amplitude per control point: the NECK and TAIL carry the traveling
  // sine (the serpentine identity motion) while the DORSAL cage section (ctrl
  // 3–5) stays near-noded — the ribcage barrel sweeps as one coherent tunnel
  // instead of fanning into a spiral mid-frame.
  const ctrlAmp = [0, 2.0, 2.4, 0.55, 0.35, 0.7, 0.8];   // tail amp small: its sweep never re-enters the aperture's projected circle
  const spineCurve = new THREE.CatmullRomCurve3(ctrlBase.map((p) => p.clone()));
  spineCurve.curveType = 'catmullrom';
  spineCurve.arcLengthDivisions = lowQ ? 48 : 100;   // arc-length LUT resolution (rebuilt each frame for EVEN vertebra pitch)

  const RIB_V0 = 6;   // first dorsal rib-host vertebra (rings ride 6..10)
  const vertNodes = [];
  for (let i = 0; i < N_VERT; i++) {
    const t = i / (N_VERT - 1);
    const r = 0.85 - t * 0.4;   // gate r6 #1: radius ramp 0.85 → 0.45 — the pale bones ARE the spine mass
    const node = new THREE.Object3D();
    rig.add(node);
    // FLAT octahedron (detail 0 — hard facets), y×0.55 (gate r3 #5a) — local y is
    // the CHAIN AXIS: the mesh is oriented to the curve tangent each frame, so the
    // flattening is along the chain and the fins/stubs stand perpendicular to it.
    // ELONGATED bone (gate r6 #1/#2): along-chain length ≥1.3× radius, so the
    // pale bones nearly fill the pitch and the chain reads as ONE column with
    // thin dark seams — never black rods with pale flakes. Dorsal (rib-host)
    // bones run longer still, buying the ring planes their sky separation.
    const dorsalHost = i > RIB_V0 && i < RIB_V0 + 5;   // bone 6 sits ON the neck->dorsal bend: keep it short so the chord pitch clears it
    const len = 1.3 * r * (dorsalHost ? 1.35 : 1);
    const octa = strip(new THREE.OctahedronGeometry(r, 0));
    octa.scale(1.0, len / (2 * r), 1.0);
    // Rib stubs: short torus arcs laid FLAT in the plane perpendicular to the
    // chain axis, sweeping out to each side — near-zero extent along the chain.
    const stubR = r * 0.75 + 0.2, stubTube = 0.06, stubArc = Math.PI * 0.55;
    const stub = (sx) => {
      const g = strip(new THREE.TorusGeometry(stubR, stubTube, lowQ ? 4 : 5, lowQ ? 6 : 7, stubArc));
      g.rotateX(Math.PI / 2);                        // ring into the plane ⊥ to the chain
      g.rotateY(sx > 0 ? Math.PI * 0.5 : Math.PI);   // aim the arc out to this side, curving back
      g.translate(sx * (r * 0.5), -0.08, -0.05);
      return g;
    };
    const parts = lowQ ? [octa] : [octa, stub(1), stub(-1)];   // stubs are the lowQ drop (§5h ratio)
    // NEURAL SPINE FIN (gate r3 #9): a thin blade standing out of local +z —
    // perpendicular to the chain (the mesh orients to the tangent with +z held
    // toward world-up, so the fins read as a dorsal ridge). Height scales with
    // the bone taper. Vertebrae 2–12; merged into the bone mesh (no extra draw).
    if (!lowQ && i >= 2 && i <= 12) {
      const fh = 0.5 * (r / 0.5);
      const fin = strip(new THREE.BoxGeometry(0.06, 0.3 * (r / 0.5), fh));
      fin.translate(0, 0, r * 0.72 + fh * 0.5);
      parts.push(fin);
    }
    const vGeo = mergeBone(parts, `vert${i}`);
    vGeo.computeBoundingBox();
    const mesh = new THREE.Mesh(vGeo, boneMat);
    mesh.name = 'vertebra';
    node.add(mesh);
    vertNodes.push({ node, mesh, t, r, len });
  }
  // Chain SAMPLING is proportional to bone size (big neck bones take more arc
  // length than tail tips) so the inter-bone gap stays a consistent fraction of
  // each bone's own radius (gate r3 #5c) instead of huge at the tail. The DORSAL
  // bones (6–10, the rib-ring hosts) get extra weight: the rib rings need z-run
  // between their planes (≥1.2× tube diameter of sky) while the visible neck and
  // tail pack tight so bone-disc-bone reads as one articulated column.
  // Station weights = each bone's LENGTH + the 0.15 seam gap (gate r6 #2), and
  // the curve is NORMALISED to that total (below), so consecutive bones sit
  // ≤0.15 apart at rest — one traceable pale column.
  const SEAM = 0.15;
  const chainU = (() => {
    const w = vertNodes.map((v) => v.len + SEAM);
    const u = [0];
    for (let i = 1; i < N_VERT; i++) u.push(u[i - 1] + (w[i - 1] + w[i]) / 2);
    const total = u[N_VERT - 1];
    return u.map((x) => x / total);
  })();
  const CHAIN_LEN = vertNodes.reduce((a, v) => a + v.len + SEAM, 0) * 1.05;   // target curve length (+5% slack: chord pitch under-runs arc length at bends)
  // NORMALISE the curve to the chain length (gate r6 #2): scale every control
  // point about the fixed occiput anchor so the rest-pose arc length equals the
  // bones + seams — gaps come out at ~SEAM everywhere, at any authored curve.
  {
    const probe = new THREE.CatmullRomCurve3(ctrlBase.map((p) => p.clone()));
    probe.arcLengthDivisions = 120;
    const k = CHAIN_LEN / probe.getLength();
    for (let i = 1; i < ctrlBase.length; i++) ctrlBase[i].sub(ctrlBase[0]).multiplyScalar(k).add(ctrlBase[0]);
    for (let i = 0; i < ctrlBase.length; i++) { ctrlAmp[i] *= k; spineCurve.points[i].copy(ctrlBase[i]); }
  }
  const discU = [];   // curve stations of the 15 joint discs (gap midpoints ON the curve)
  for (let i = 0; i < N_VERT - 1; i++) discU.push((chainU[i] + chainU[i + 1]) / 2);
  // THE JOINT-DISC CHAIN (gate r3 #5b): one near-black disc at the MIDPOINT of
  // every inter-bone gap, oriented to the curve tangent, so bone-disc-bone reads
  // as one articulated column. All 15 discs live in ONE dynamic mesh (a manual
  // matrix transform of a cached template each frame — one draw call, no
  // InstancedMesh per L126). Template: an 8-facet squat cylinder.
  const discChain = (() => {
    const tpl = strip(new THREE.CylinderGeometry(1, 1, 1, 8)).toNonIndexed();
    const tplPos = tpl.attributes.position.array.slice();
    const tplNrm = tpl.attributes.normal.array.slice();
    const nV = tplPos.length / 3, nD = N_VERT - 1;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nD * tplPos.length), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nD * tplNrm.length), 3));
    const mesh = new THREE.Mesh(geo, darkMat);
    mesh.frustumCulled = false;   // verts are rewritten per frame; skip stale-bounds culling
    rig.add(mesh);
    return { mesh, geo, tplPos, tplNrm, nV, nD };
  })();

  // ---------------------------------------------------------------------
  // THE RIBCAGE — FIVE separate rib PAIRS, each planted ON a dorsal vertebra
  // (6–10) so the roots ride real bone. Each pair = a left + right torus ARC
  // (arc π·0.6, thin tube) hanging DOWN from the dorsal vertebra, leaving sky
  // between adjacent ribs and a clear ventral gap. The five pairs TAPER in radius
  // (front biggest → back smallest) so, foreshortened along the dorsal-z run,
  // they NEST into a tunnel whose tips outline the ≥9-unit flyable oval — not a
  // single fused tire. A dark socket knob sits at every rib root; the third pair's
  // left rib is SNAPPED (the scar); a faint ice-blue rim centres the aperture.
  // ---------------------------------------------------------------------
  const N_RING = 5;
  const RING_R = [3.9, 3.6, 3.35, 3.1, 2.9];   // front→back taper (nested = reads as ribs; front aperture ≈9 world @scale)
  // Each RIB = a TAPERED, FACETED bone tube (gate r3 #7): a TubeGeometry along a
  // circular arc from its ROOT at the spine (θ≈84°, overlapping the host
  // vertebra) sweeping down-around to a free TIP (θ≈−24°), radius tapering
  // 0.30 root → 0.12 tip, radialSegments 5 so the tube visibly facets. The pair
  // leaves the dorsal notch (where the spine runs) + a ventral gap.
  const ribArc = Math.PI * 0.6;                    // 108° sweep per rib
  const ROOT_TH = Math.PI * (84 / 180);            // root angle (near the spine top)
  const ribTubularSeg = lowQ ? 8 : 12, ribRadialSeg = 5;
  const ribHang = (R) => -R * 0.97;   // ring centre sits so the rib ROOT lands ON the host vertebra
  const makeRibGeo = (R, sx, spanFrac = 1, taperFloor = 0.4) => {
    // Arc curve in the ring's local xy-plane: θ runs root → tip; sx=-1 mirrors.
    const pts = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const th = ROOT_TH - (i / n) * ribArc * spanFrac;
      pts.push(new THREE.Vector3(sx * Math.cos(th) * R, Math.sin(th) * R, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    // Taper BEFORE strip — taperTube's ring indexing only holds on the indexed
    // TubeGeometry (see makeHornGeo).
    const g = new THREE.TubeGeometry(curve, ribTubularSeg, 0.3, ribRadialSeg, false);
    taperTube(g, curve, ribTubularSeg, ribRadialSeg, (u) => Math.max(taperFloor, 1 - u * 0.6));   // 0.30 → 0.12 (a snapped rib keeps a chunky broken end)
    return strip(g);
  };
  const ribPivots = [];
  const ribEnd = (R, sx, spanFrac = 1) => {   // tip position of a rib arc (for caps)
    const th = ROOT_TH - ribArc * spanFrac;
    return [sx * Math.cos(th) * R, Math.sin(th) * R];
  };
  for (let h = 0; h < N_RING; h++) {
    const R = RING_R[h];
    const pivot = new THREE.Object3D();
    pivot.name = 'ribPivot';
    pivot.position.set(0, ribHang(R), 0);    // roots land on the host vertebra above
    vertNodes[RIB_V0 + h].node.add(pivot);   // planted ON a real vertebra (roots ride bone)
    // The scar (§3.6): the THIRD pair (h===2)'s LEFT rib snapped at ~55% arc.
    const leftSpan = h === 2 ? 0.6 : 1;   // gate r6 #5: snapped at 60%
    pivot.add(new THREE.Mesh(mergeBone([makeRibGeo(R, 1), makeRibGeo(R, -1, leftSpan, h === 2 ? 0.7 : 0.4)], `ribRing${h}`), ribBoneMat));
    // Per-ring dark mesh (gate r3 #6/#7 + r4 #7): SOCKET KNOBS (r 0.22) at the
    // two roots — AT the rib/vertebra junction — dark TIP CAPS on the free ends,
    // and an INTERCOSTAL GROOVE line (a thin dark arc recessed along each rib's
    // inner curve) so the big pale arcs read carved, not moulded plastic.
    const darks = [];
    for (const sx of [-1, 1]) {
      const k = strip(new THREE.SphereGeometry(0.22, 6, 5));
      k.translate(sx * Math.cos(ROOT_TH) * R, Math.sin(ROOT_TH) * R, 0);
      darks.push(k);
    }
    for (const sx of [1, -1]) {
      const frac = sx < 0 ? leftSpan : 1;
      const [ex, ey] = ribEnd(R, sx, frac);
      const c = strip(new THREE.OctahedronGeometry(0.15, 0));
      c.translate(ex, ey, 0);
      darks.push(c);
    }
    if (!lowQ) {
      for (const sx of [1, -1]) {   // intercostal groove: a slim dark arc on the inner curve
        const frac = sx < 0 ? leftSpan : 1;
        const gpts = [];
        for (let i = 0; i <= 6; i++) {
          const th = ROOT_TH - (i / 6) * ribArc * frac;
          gpts.push(new THREE.Vector3(sx * Math.cos(th) * (R - 0.24), Math.sin(th) * (R - 0.24), 0.02));
        }
        darks.push(strip(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gpts), 8, 0.05, 3, false)));
      }
    }
    pivot.add(new THREE.Mesh(mergeBone(darks, `ribRoot${h}`), darkMat));
    // THE SCAR (§3.6, gate r4 #5): the snapped rib's marrow — an angled snap-face
    // disc (0.3 rad off the rib axis) with a faint WARM emissive core (0x6a4a30
    // ei 0.35 — dim, well under half the eye intensity per §3 law 2). Its own
    // mesh + material so it is unmistakable at fight hold.
    if (h === 2) {
      const [ex, ey] = ribEnd(R, -1, leftSpan);
      const marrowMat = track(new THREE.MeshStandardMaterial({
        color: 0x3a2f22, emissive: 0x6a4a30, emissiveIntensity: 0.6, roughness: 0.85, metalness: 0.0, flatShading: true,
      }));
      marrowMat.toneMapped = false;   // the warm marrow glow survives the boss-fight grade (gate r6 #5)
      const snapFace = strip(new THREE.CylinderGeometry(0.3, 0.34, 0.16, 7));
      snapFace.rotateZ(0.3 + Math.PI / 2);   // angled 0.3 rad off the rib axis (the jagged break)
      const core = strip(new THREE.SphereGeometry(0.16, 6, 5)); core.translate(0.04, 0, 0.05);
      const marrowMesh = new THREE.Mesh(mergeBone([snapFace, core], 'marrow'), marrowMat);
      marrowMesh.position.set(ex, ey, 0);   // on the MESH (not baked into geometry) so tools can project its world position
      marrowMesh.name = 'marrowScar';       // capture-tool seam: the scar proof crop projects this
      pivot.add(marrowMesh);
    }
    ribPivots.push({ pivot, idx: h, R });
  }
  // Ice-blue APERTURE RIM centred INSIDE the front rib pair (the "fly here" tell,
  // dim — well below the eyes/lure focal). Rides the front dorsal vertebra.
  const rimMat = track(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
  rimMat.toneMapped = false; rimMat.color.copy(EYE_BASE).multiplyScalar(1.0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RING_R[0] - 0.45, 0.05, 6, 40), rimMat);
  rim.position.set(0, ribHang(RING_R[0]), 0.35);
  vertNodes[RIB_V0].node.add(rim);

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

  const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _t = new THREE.Vector3();
  const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _nm = new THREE.Matrix3(), _s = new THREE.Vector3();
  const _bx = new THREE.Vector3(), _bz = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _fwd = new THREE.Vector3(0, 0, 1);
  // Orient local +y along the tangent with local +z held as close to world-up as
  // possible (stable roll — the dorsal fins read as one consistent ridge). Falls
  // back to world-forward when the tangent is near-vertical.
  function orientToTangent(quat, t) {
    const ref = Math.abs(t.dot(_up)) > 0.92 ? _fwd : _up;
    _bz.copy(ref).addScaledVector(t, -ref.dot(t)).normalize();   // ⊥ component of the reference
    _bx.crossVectors(t, _bz).normalize();
    _m.makeBasis(_bx, t, _bz);
    quat.setFromRotationMatrix(_m);
  }
  function tickBody(dt, time) {
    rig.rotation.z = Math.sin(time * 0.4) * 0.02 + Math.sin(time * 0.9) * 0.008;

    // COIL SWEEP: traveling sine through the control points, resample 16 vertebrae.
    const coilAmp = (1 - dyingK * 0.7) * (1 + charge * 0.1);
    const coilRate = time * COIL_OMEGA * (1 - dyingK * 0.6);
    for (let i = 0; i < ctrlBase.length; i++) {
      spineCurve.points[i].x = ctrlBase[i].x + ctrlAmp[i] * coilAmp * Math.sin(i * COIL_SEP - coilRate);
      spineCurve.points[i].y = ctrlBase[i].y + dyingK * (-1.2) * (i / (ctrlBase.length - 1));
    }
    // Resample by ARC LENGTH at the size-proportional stations (chainU) so each
    // bone's gap stays a consistent fraction of its own radius, and ORIENT each
    // bone mesh to the curve tangent (local y = chain axis) with local +z held
    // toward world-up — the articulated column read (gate r3 #5), with the
    // dorsal fins standing up consistently.
    spineCurve.updateArcLengths();
    for (let k = 0; k < N_VERT; k++) {
      spineCurve.getPointAt(chainU[k], _v);
      vertNodes[k].node.position.copy(_v);
      spineCurve.getTangentAt(chainU[k], _t);
      orientToTangent(vertNodes[k].mesh.quaternion, _t);
    }
    // The rib rings are children of the dorsal vertebrae (6–10), so they ride the
    // coil + stay rooted to real bone automatically — no separate placement.
    // JOINT-DISC CHAIN: place a dark disc at each inter-bone gap midpoint,
    // oriented to the local chain direction, radius 0.55× the upper bone's r —
    // one dynamic mesh (verts rewritten from the cached template).
    {
      const pos = discChain.geo.attributes.position.array;
      const nrm = discChain.geo.attributes.normal.array;
      for (let d = 0; d < discChain.nD; d++) {
        // Disc sits ON the curve at the gap-midpoint station (not the chord
        // midpoint — during a hard S-coil the chord midpoint floats off the bone
        // line and the disc read as a detached black chip). Its THICKNESS is the
        // live gap + 0.1 overlap into both bones (the WELD, gate r4 #1): the
        // bone-disc-bone column stays continuous at every sweep phase.
        spineCurve.getPointAt(discU[d], _v);
        spineCurve.getTangentAt(discU[d], _t);
        orientToTangent(_q, _t);
        // THIN flat seam disc (gate r6 #1): fixed 0.12 thickness — the pale bones
        // nearly touch (SEAM spacing), so the disc reads as a carved joint line,
        // never a black rod. Radius ≤0.8× the smaller neighbour.
        const dr = Math.min(vertNodes[d].r, vertNodes[d + 1].r) * 0.75;
        _m.compose(_v, _q, _s.set(dr, 0.12, dr));
        _nm.getNormalMatrix(_m);
        for (let vtx = 0; vtx < discChain.nV; vtx++) {
          const si = vtx * 3, di = (d * discChain.nV + vtx) * 3;
          _v2.set(discChain.tplPos[si], discChain.tplPos[si + 1], discChain.tplPos[si + 2]).applyMatrix4(_m);
          pos[di] = _v2.x; pos[di + 1] = _v2.y; pos[di + 2] = _v2.z;
          _v2.set(discChain.tplNrm[si], discChain.tplNrm[si + 1], discChain.tplNrm[si + 2]).applyMatrix3(_nm).normalize();
          nrm[di] = _v2.x; nrm[di + 1] = _v2.y; nrm[di + 2] = _v2.z;
        }
      }
      discChain.geo.attributes.position.needsUpdate = true;
      discChain.geo.attributes.normal.needsUpdate = true;
    }

    // Gaze
    nextLookAway -= dt;
    if (lookAwayT > 0) lookAwayT -= dt;
    else if (nextLookAway <= 0 && charge < 0.2 && noticeT <= 0 && dyingK <= 0) {
      lookAwayT = 0.6 + Math.random() * 0.6; lookAwayX = (Math.random() - 0.5) * 1.4; lookAwayY = Math.random() * 0.4 - 0.2; nextLookAway = 5 + Math.random() * 6;
    }
    if (charge > 0.4 && lookAwayT > 0) lookAwayT = 0;   // a charging predator locks on — never captured mid-look-away
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

    skull.rotation.y = gazeX * 0.16; skull.rotation.x = -gazeY * 0.1 - charge * 0.15;   // the head REARS BACK as the jaw drops (the roar) — the dark mouth wedge faces the rail (gate r6 #6)
    eyes.rotation.copy(skull.rotation);
    eyes.position.set(skull.position.x, skull.position.y, skull.position.z);

    // JAW (charge telegraph) — hinges wide (≥0.5 rad on a full charge) so the open
    // dark gap reads in silhouette (gate directive 8).
    let jawOpen = charge * 0.9;
    if (tell === 'aimed' || tell === 'stream' || tell === 'crossfire') jawOpen = Math.max(jawOpen, charge * 1.0);
    if (noticeT > 0.5) jawOpen = Math.max(jawOpen, 0.95);
    if (setpieceMode === 'thread' && setpieceK > 0) jawOpen = Math.max(jawOpen, setpieceK * 1.0);
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
  muzzle.position.set(0, 6.4, 2.9);   // at the (raised) skull's maw
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
