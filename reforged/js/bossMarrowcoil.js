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

  const kit = createBossCommon(def, quality, { shieldRadius: 6.0, shieldY: 4.6, hpBarY: 11.4, hpBarZ: 1.4, hpBarScale: 0.7 });
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
    color: 0xe4ded0, emissive: 0xe4ded0, emissiveIntensity: BONE_EI, roughness: 0.82, metalness: 0.0, flatShading: true,   // D6: the SKULL tier — the face leads, lightest bone
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
  skull.name = 'skullGroup';   // viewer focus target
  skull.position.set(0, 6.9, 1.15);   // leads the (longer, ×1.6-boned) chain; occiput overlaps vertebra 0
  skull.scale.setScalar(1.42);   // gate r12 #4: the skull is the dominant terminal mass        // head stays the dominant terminal mass over the ×1.6 neck bones (§3.1 ladder)
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
    const snoutA = strip(new THREE.BoxGeometry(0.92, 0.72, 1.5)); snoutA.translate(0, -0.16, 0.75);
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
    const socket = (sx) => { const s = strip(new THREE.BoxGeometry(0.5, 0.48, 0.62)); s.translate(sx * 0.58, 0.14, 0.34); return s; };   // outboard of the snout eclipse line, inset within the cranium side
    parts.push(socket(1), socket(-1));
    // Nostrils: thin dark SLITS on the snout TOP surface only (a front-face pit
    // read as googly cartoon eyes — gate directive 5 — so keep them off the face).
    const nostril = (sx) => { const n = strip(new THREE.BoxGeometry(0.09, 0.3, 0.22)); n.translate(sx * 0.12, -0.02, 2.35); return n; };
    parts.push(nostril(1), nostril(-1));
    const jawline = strip(new THREE.BoxGeometry(0.9, 0.12, 1.9)); jawline.translate(0, -0.5, 0.9);
    // D6: under-brow + under-cheek recesses — the front face reads carved
    // under the frontal sun (§3.4), not a flat pale box.
    const underBrow = (sx) => { const b = strip(new THREE.BoxGeometry(0.5, 0.07, 0.5)); b.translate(sx * 0.58, -0.11, 0.38); return b; };
    parts.push(underBrow(1), underBrow(-1));
    const underCheek = (sx) => { const b = strip(new THREE.BoxGeometry(0.16, 0.5, 0.9)); b.translate(sx * 0.92, -0.34, -0.2); return b; };
    parts.push(underCheek(1), underCheek(-1));
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
    const condyle = strip(new THREE.CylinderGeometry(0.5, 0.5, 0.16, 8)); condyle.translate(0, -0.33, -1.02);
    parts.push(condyle);
    return mergeBone(parts, 'skullDark');
  })();
  skull.add(new THREE.Mesh(skullDarkGeo, darkMat));

  // r14 gate #3: kill PLASTIC BONE on the skull front. The recess tint is baked
  // as a SHELL of the cranium's OWN triangles — every face whose normal has
  // y < −0.2 or |x| > 0.7 (the under-brow shelf, under-cheek faces and snout
  // side walls, exactly as directed) is copied, pushed 0.012 out along its
  // normal, and painted 0xb8b2a2 unlit so an eyedropper reads the authored
  // value. Hugs the skull perfectly — no jutting overlay plates. Plus the
  // 0x14121c seam ring where the cranium box meets the snout box. One draw.
  {
    const src = craniumGeo.attributes.position;
    const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
    const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3();
    const verts = [], cols = [];
    const RECESS = new THREE.Color(0xb8b2a2);
    for (let f = 0; f < src.count; f += 3) {
      A.fromBufferAttribute(src, f); B.fromBufferAttribute(src, f + 1); C.fromBufferAttribute(src, f + 2);
      n.crossVectors(ab.subVectors(B, A), ac.subVectors(C, A)).normalize();
      if (!(n.y < -0.2 || Math.abs(n.x) > 0.7)) continue;
      if ((A.y + B.y + C.y) / 3 < -0.45) continue;   // leave the jawline/mouth darks alone
      for (const P of [A, B, C]) {
        verts.push(P.x + n.x * 0.012, P.y + n.y * 0.012, P.z + n.z * 0.012);
        cols.push(RECESS.r, RECESS.g, RECESS.b);
      }
    }
    const shell = new THREE.BufferGeometry();
    shell.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    const seam = strip(new THREE.BoxGeometry(0.98, 0.76, 0.05)); seam.translate(0, -0.16, 0.04);   // cranium↔snout seam line
    seam.deleteAttribute('normal'); seam.deleteAttribute('uv');   // match the bare shell for the merge
    const SEAM_C = new THREE.Color(0x14121c);
    for (let i = 0; i < seam.attributes.position.count; i++) cols.push(SEAM_C.r, SEAM_C.g, SEAM_C.b);
    const merged = mergeBone([shell, seam], 'skullRecess');
    merged.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cols), 3));
    const recessMat = track(new THREE.MeshBasicMaterial({ vertexColors: true }));
    skull.add(new THREE.Mesh(merged, recessMat));
  }

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
  const hornTubular = 12, hornRadial = 6;   // D11d: two extra facet cuts along the sweep
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
  const DEATH_EYE = new THREE.Color(0x1a2026);   // r14 gate #4: the dead-socket tone
  const EYE_HOT = 1.6;   // D1: the lure is the ONE focal; the eyes are the bright second tier (≤ half)
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: accent })); eyeMat.toneMapped = false;
  eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const eyeHaloMat = track(new THREE.MeshBasicMaterial({ color: 0x3a5666, transparent: true, opacity: 0.95 }));   // dark IRIS disc — the white core sits centred in it (gate r11 #5)
  eyeHaloMat.toneMapped = false;
  const eyes = new THREE.Group(); eyes.position.copy(skull.position); eyes.scale.copy(skull.scale); rig.add(eyes);   // mirrors the skull transform so the pinlights stay seated in the scaled sockets
  {
    const hl = strip(new THREE.CircleGeometry(0.17, 12)); hl.translate(-0.62, 0.14, 0.66);
    const hr = strip(new THREE.CircleGeometry(0.17, 12)); hr.translate(0.62, 0.14, 0.66);
    eyes.add(new THREE.Mesh(mergeGeometries([hl, hr], false), eyeHaloMat));   // flat IRIS discs — the core stays concentric at every angle (gate r12 #9)
  }
  const eyeMeshes = [];
  for (const sx of [-1, 1]) {
    // Seated PROUD of the socket mouth (+0.06 along the socket normal, gate r3
    // #4) so neither eye can be occluded at 3/4 angles — both CLIP white + bloom
    // in every state. Still ringed by the dark socket box (hollow-set); the lure
    // stays the single hottest point.
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 8), eyeMat);
    core.position.set(sx * 0.62, 0.14, 0.9); eyes.add(core);   // fully proud of the socket mouth — no yaw/pitch/roar angle occludes either eye
    eyeMeshes.push({ core, sx });
  }

  // ---- THE LURE — the FOCAL (§3.2): an HDR ice-blue teardrop on a bare strand
  // between the horn bases, forward of the skull. The single hottest point (×3).
  const LURE_BASE = new THREE.Color(accent);
  const LURE_HOT = 2.4;   // D1: 0xeaf6ff ×2.4 — THE brightest emissive; everything else ≤ half
  const lureMat = track(new THREE.MeshBasicMaterial({ color: 0xeaf6ff })); lureMat.toneMapped = false;   // D1 hex
  lureMat.color.setHex(0xeaf6ff).multiplyScalar(LURE_HOT);
  const lureHaloMat = track(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  lureHaloMat.toneMapped = false; lureHaloMat.color.copy(LURE_BASE).multiplyScalar(1.5);
  const lure = new THREE.Group();
  // r14 gate #1: dropped 0.25u and pulled FORWARD so ≥30% of the teardrop
  // overlaps the cranium silhouette from yaw 0 — hung IN FRONT of bone, not sky.
  const LURE_BASE_POS = new THREE.Vector3(0, 1.05, 0.55);
  lure.position.copy(LURE_BASE_POS);
  skull.add(lure);
  // D1/D9 + r14 gate #1: the STRAND — a 0.05u-wide flat RIBBON pair (LineSegments
  // are sub-pixel-dishonest at fight scale) from each horn tip to the lure, its
  // V-sag rewritten each tick: the sag flattens as charge ramps — the borrowed
  // light visibly feeding the attack (emitter-organ law §5f.7).
  const strandMat = track(new THREE.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.95, side: THREE.DoubleSide }));
  strandMat.toneMapped = false;
  strandMat.color.multiplyScalar(1.2);
  // Cross-ribbon: at each point the strand carries TWO 0.06u bands (one spanning
  // x, one spanning y) so it never collapses edge-on from any review camera.
  const STRAND_PTS = 7, STRAND_W = 0.06;
  const strandGeo = new THREE.BufferGeometry();
  strandGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * STRAND_PTS * 4 * 3), 3));
  {
    const idx = [];
    for (const side of [0, 1]) {
      const base = side * STRAND_PTS * 4;
      for (let i = 0; i < STRAND_PTS - 1; i++) {
        const p = base + i * 4, q = p + 4;
        idx.push(p, p + 1, q, p + 1, q + 1, q);           // x-band quad
        idx.push(p + 2, p + 3, q + 2, p + 3, q + 3, q + 2); // y-band quad
      }
    }
    strandGeo.setIndex(idx);
  }
  const strand = new THREE.Mesh(strandGeo, strandMat);
  strand.frustumCulled = false;
  lure.add(strand);
  const HORN_TIP = new THREE.Vector3(1.5, 2.2, -2.9);   // horn tip in skull space (see hornCurve)
  function updateStrand(chargeK) {
    const pos = strandGeo.attributes.position.array;
    const h = STRAND_W / 2;
    let w = 0;
    for (const sx of [-1, 1]) {
      // catenary-ish run horn-tip → lure; the mid sag flattens on charge.
      const tip = new THREE.Vector3(sx * HORN_TIP.x - lure.position.x, HORN_TIP.y - lure.position.y, HORN_TIP.z - lure.position.z);
      const sag = 0.45 * (1 - chargeK * 0.8);
      for (let i = 0; i < STRAND_PTS; i++) {
        const u = 1 - i / (STRAND_PTS - 1);        // 1 = horn tip, 0 = lure
        // the run BOWS FORWARD (+z) so its middle clears the cranium dome and
        // reads against sky from the rail's yaw-0 view (r14 gate #1)
        const x = tip.x * u, z = tip.z * u + 0.55 * Math.sin(Math.PI * u);
        const y = tip.y * u - sag * Math.sin(Math.PI * u) * 0.8;
        pos[w++] = x - h; pos[w++] = y; pos[w++] = z;
        pos[w++] = x + h; pos[w++] = y; pos[w++] = z;
        pos[w++] = x; pos[w++] = y - h; pos[w++] = z;
        pos[w++] = x; pos[w++] = y + h; pos[w++] = z;
      }
    }
    strandGeo.attributes.position.needsUpdate = true;
  }
  updateStrand(0);
  const lureGeo = (() => {
    const s = strip(new THREE.SphereGeometry(0.28, 10, 8));
    const drip = strip(new THREE.ConeGeometry(0.16, 0.44, 8)); drip.rotateX(Math.PI); drip.translate(0, -0.32, 0);
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
  // Gate r10 #1: the COIL is the identity — the chain visibly ENTERS the cage
  // from above-left, threads it diagonally (the rib rings ride these bones),
  // and EXITS below-right with the tail sweeping far clear of the outline.
  // Bones 0-5 = the visible neck coil (outside), 6-10 = in-cage hosts,
  // 11-15 = the visible tail (outside), kite clearing the cage by >=3.
  const ctrlBase = [
    new THREE.Vector3(0.0, 6.5, -0.1),    // occiput — vertebra 0 intersects the occipital face by >=0.3
    new THREE.Vector3(1.9, 5.1, 0.4),     // neck coils right...
    new THREE.Vector3(-1.9, 3.6, 0.5),    // ...then sweeps LEFT (the S — gentle bend radius: big bones must track it)
    new THREE.Vector3(-1.3, 2.4, 0.8),    // ENTERS the cage from above-LEFT, front
    new THREE.Vector3(0.0, 1.55, -1.6),   // threads the middle, running back
    new THREE.Vector3(3.9, -0.2, -3.9),   // EXITS below-RIGHT, pulled clear of the (smaller) cage
    new THREE.Vector3(12.8, -6.6, -1.4),  // r14 gate #6: +0.8 right/down — the kite blade tip clears the outermost rib arc by ≥1 blade-length of sky
  ];
  const ctrlAmp = [0, 2.5, 2.7, 0.7, 0.4, 1.1, 1.3];   // D5: the sine visibly travels (idle vs coilsweep ≥6% silhouette shift)   // outer coils sweep >=1.5 peak (idle vs coilsweep are different poses); cage section stays noded   // tail amp small: its sweep never re-enters the aperture's projected circle
  const spineCurve = new THREE.CatmullRomCurve3(ctrlBase.map((p) => p.clone()));
  spineCurve.curveType = 'centripetal';   // no overshoot loops at uneven control spacing (uniform catmull was bunching stations at the S-bend)
  spineCurve.arcLengthDivisions = lowQ ? 48 : 100;   // arc-length LUT resolution (rebuilt each frame for EVEN vertebra pitch)

  const RIB_V0 = 5;   // first dorsal rib-host vertebra (rings ride 5..9; bones 10-15 = SIX exit vertebrae below-right, gate r11 #1)
  // UNLIT vertex-colored bone (gate r8 #2): facet values are BAKED, so the carve
  // reads under any light; .color is the live dim channel (shield/death leash).
  const vertMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, color: 0xffffff }));
  // Ribs get the same treatment one value-step warmer/darker (gate r10 #6): the
  // two bone families separate, and every rib visibly facets — no painted streaks.
  const ribVertMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, color: 0xffffff, side: THREE.DoubleSide }));
  // Bake the §1 painted hierarchy per face: colors picked by face normal z
  // (local z faces the rail once oriented) — top/side/underside value split.
  function bakeFacets(geo, topHex, sideHex, botHex) {
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const top = new THREE.Color(topHex), side = new THREE.Color(sideHex), bot = new THREE.Color(botHex);
    const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), N = new THREE.Vector3();
    for (let f = 0; f < pos.count; f += 3) {
      A.fromBufferAttribute(pos, f); B.fromBufferAttribute(pos, f + 1); C.fromBufferAttribute(pos, f + 2);
      N.subVectors(B, A).cross(C.clone().sub(A)).normalize();
      const c = N.z > 0.35 ? top : (N.z < -0.35 ? bot : side);
      for (let k3 = 0; k3 < 3; k3++) { cols[(f + k3) * 3] = c.r; cols[(f + k3) * 3 + 1] = c.g; cols[(f + k3) * 3 + 2] = c.b; }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return geo;
  }
  const vertNodes = [];
  for (let i = 0; i < N_VERT; i++) {
    const t = i / (N_VERT - 1);
    const r = (0.85 - t * 0.4) * 1.15;   // gate r12 #4: spine mass up — the coil must dominate the black fill
    const node = new THREE.Object3D();
    rig.add(node);
    // FLAT octahedron (detail 0 — hard facets), y×0.55 (gate r3 #5a) — local y is
    // the CHAIN AXIS: the mesh is oriented to the curve tangent each frame, so the
    // flattening is along the chain and the fins/stubs stand perpendicular to it.
    // ONE SOLID ELONGATED OCTAHEDRON per bone (gate r7 #1): length 1.4× radius,
    // long axis (local y) laid along the chain by lookAt-style orientation in the
    // tick. Plus the §5d torus-arc RIB-STUB pair — thick enough to read as bone
    // knuckles and widen the column. No plates, no fins.
    const len = (i < 6 ? 1.3 : 1.4) * r;   // neck bones slightly shorter: they track the S-bend curvature without interpenetrating
    const octa = strip(new THREE.OctahedronGeometry(r, 0));
    octa.scale(1.0, len / (2 * r), 1.0);
    octa.rotateY(0.3 * (i % 2 ? 1 : -1));   // ~0.3 rad off-axis alternating — two faces catch different values (gate r10 #1b)
    const stubR = r * 0.7 + 0.18, stubTube = 0.09, stubArc = Math.PI * 0.5;
    const stub = (sx) => {
      const g = strip(new THREE.TorusGeometry(stubR, stubTube, lowQ ? 4 : 5, lowQ ? 6 : 7, stubArc));
      g.rotateX(Math.PI / 2);
      g.rotateY(sx > 0 ? Math.PI * 0.5 : Math.PI);
      g.translate(sx * (r * 0.45), 0, -0.04);
      return g;
    };
    const parts = (lowQ || i < 5) ? [octa] : [octa, stub(1), stub(-1)];   // gate r9 #1: the neck welds as one clean tapering line — no stub debris
    // D11b: dorsal neural-spine fins, vertebrae 4-12, ALTERNATING heights.
    if (!lowQ && i >= 4 && i <= 12) {
      const fh = (i % 2 ? 0.62 : 0.42) * (r / 0.85);
      const fin = strip(new THREE.ConeGeometry(0.09, fh, 4));
      fin.rotateX(Math.PI / 2);
      fin.translate(0, 0, r * 0.7 + fh * 0.45);
      parts.push(fin);
    }
    const vGeo = mergeBone(parts, `vert${i}`);
    bakeFacets(vGeo, 0xd8d2c0, 0xb0aa98, 0x8a8474);
    const mesh = new THREE.Mesh(vGeo, vertMat);
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
  // gate r10 #1: NEGATIVE seam proportional to bone size — adjacent bones
  // INTERSECT by ~20% of their radius (zero background pixels from any angle).
  const SEAM = 0;
  // ABSOLUTE arc-length stations (gate r8 #1): S_i in world units from the
  // occiput. The tick divides by the LIVE curve length each frame, so bone
  // spacing stays CONSTANT at every sweep phase — the traveling sine lengthens
  // the curve, and fractional sampling was stretching the chain apart mid-sweep.
  const chainS = (() => {
    const w = vertNodes.map((v) => v.len - 0.4 * v.r);   // pitch ≈ len − 0.4r → ~20% overlap each side
    const u = [0];
    for (let i = 1; i < N_VERT; i++) u.push(u[i - 1] + (w[i - 1] + w[i]) / 2);
    return u;
  })();
  const chainU = chainS.map((x) => x / chainS[N_VERT - 1]);   // rest-pose fractions (build-time helpers)
  const CHAIN_LEN = vertNodes.reduce((a, v) => a + v.len - 0.4 * v.r, 0) * 1.26;   // target curve length (+6% slack: chord pitch under-runs arc length at bends)
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
  // D11c: GRAZE-BAIT BEADS — 4 dim ice nubs riding vertebrae 3/6/9/12 (the
  // sheet's "graze-bait beads the spine"). ONE mesh, verts rewritten per frame.
  const BEAD_AT = [3, 6, 9, 12];
  const beadChain = (() => {
    const tpl = strip(new THREE.OctahedronGeometry(0.16, 0)).toNonIndexed();
    const tplPos = tpl.attributes.position.array.slice();
    const nV = tplPos.length / 3;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BEAD_AT.length * tplPos.length), 3));
    const beadMat = track(new THREE.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.85 }));
    beadMat.toneMapped = false;
    beadMat.color.multiplyScalar(0.5);   // dim ice — satellite law (§3.8, ei ≤0.25-class)
    const mesh = new THREE.Mesh(geo, beadMat);
    mesh.frustumCulled = false;
    rig.add(mesh);
    return { mesh, geo, tplPos, nV, mat: beadMat };
  })();
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
    const discMat = track(new THREE.MeshStandardMaterial({
      color: 0x1a1614, emissive: 0x000000, emissiveIntensity: 0.0, roughness: 0.95, metalness: 0.0, flatShading: true,
    }));
    const mesh = new THREE.Mesh(geo, discMat);
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
  const RING_R = [3.3, 3.1, 2.95, 2.8, 2.65];   // front->back taper: the corridor recedes (clearance >=4.5 local)
  // D3 (CANONICAL): each rib is its OWN mesh on its OWN ROOT PIVOT
  // (ribPivotL0..4 / ribPivotR0..4). At idle the pairs are the sheet's OPEN
  // arcs (bottom open — the rail enters under them); during the dread card
  // "MARROW — The Closing Ribs" each pivot ROTATES its rib inward up to ~50°,
  // tips approaching within ~0.8u but never welding — the graze goldmine.
  // Rib geometry is built RELATIVE TO ITS ROOT so rotation hinges anatomically.
  const ribArc = Math.PI * 0.6;                    // §5d sheet span — arcs, not hoops
  const ROOT_TH = Math.PI * (84 / 180);            // root angle (at the spine crown)
  const ribTubularSeg = lowQ ? 8 : 12, ribRadialSeg = lowQ ? 5 : 6;
  const ribHang = (R) => -R * 0.97;                // ring centre offset: the root lands ON the host vertebra
  // D6/D11a rib bake: three RIB-tier tones (darkest structural family) as
  // lengthwise bands + a 0x14121c joint tone at the root, and the ridge bevel
  // adds a raised outer spine so the arc reads carved bone, not ribbon.
  const RIB_BANDS = [new THREE.Color(0xd0cab8), new THREE.Color(0xc4beac), new THREE.Color(0xb2ac9a)];
  const RIB_JOINT = new THREE.Color(0x14121c);
  const bakeRib = (geo, rootLocal) => {
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
    for (let f = 0; f < pos.count; f += 3) {
      A.fromBufferAttribute(pos, f); B.fromBufferAttribute(pos, f + 1); C.fromBufferAttribute(pos, f + 2);
      const d = Math.hypot((A.x + B.x + C.x) / 3 - rootLocal.x, (A.y + B.y + C.y) / 3 - rootLocal.y);
      // D4 joint band: the first stretch off the root is near-black; then the
      // three-tone bands cycle down the arc (>=6 visible breaks per rib).
      const c = d < 0.42 ? RIB_JOINT : RIB_BANDS[Math.floor(d / 0.85) % 3];
      for (let k3 = 0; k3 < 3; k3++) { cols[(f + k3) * 3] = c.r; cols[(f + k3) * 3 + 1] = c.g; cols[(f + k3) * 3 + 2] = c.b; }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return geo;
  };
  // One rib: arc from the root (θ=ROOT_TH) sweeping down; geometry RELATIVE to
  // the root point; taper 0.30→0.12; plus the D11a RIDGE BEVEL along the outer
  // edge (a slim tube at R+0.2 merged in — the arc stops reading as ribbon).
  const makeRib = (R, sx, spanFrac = 1, taperFloor = 0.4) => {
    const root = new THREE.Vector3(sx * Math.cos(ROOT_TH) * R, Math.sin(ROOT_TH) * R, 0);
    const arcPts = (rr, zoff) => {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const th = ROOT_TH - (i / 8) * ribArc * spanFrac;
        pts.push(new THREE.Vector3(sx * Math.cos(th) * rr - root.x, Math.sin(th) * rr - root.y, zoff));
      }
      return pts;
    };
    const curve = new THREE.CatmullRomCurve3(arcPts(R, 0));
    const g = new THREE.TubeGeometry(curve, ribTubularSeg, 0.3, ribRadialSeg, false);
    taperTube(g, curve, ribTubularSeg, ribRadialSeg, (u) => Math.max(taperFloor, 1 - u * 0.6));
    const parts = [strip(g)];
    if (!lowQ) {
      const ridgeCurve = new THREE.CatmullRomCurve3(arcPts(R + 0.2, 0));
      const ridge = new THREE.TubeGeometry(ridgeCurve, ribTubularSeg, 0.09, 4, false);
      taperTube(ridge, ridgeCurve, ribTubularSeg, 4, (u) => Math.max(0.4, 1 - u * 0.6));
      parts.push(strip(ridge));
    }
    return bakeRib(mergeBone(parts, 'rib'), new THREE.Vector3(0, 0, 0));
  };
  const ribPivots = [];
  for (let h = 0; h < N_RING; h++) {
    const R = RING_R[h];
    for (const sx of [-1, 1]) {
      const spanFrac = (h === 2 && sx < 0) ? 0.45 : 1;   // D2: the scar rib SNAPS at 45%
      const pivot = new THREE.Object3D();
      pivot.name = `ribPivot${sx < 0 ? 'L' : 'R'}${h}`;   // telegraph gate finds these by name (D3)
      pivot.position.set(sx * Math.cos(ROOT_TH) * R, ribHang(R) + Math.sin(ROOT_TH) * R, 0);   // AT the root, on the host vertebra
      vertNodes[RIB_V0 + h].node.add(pivot);
      pivot.add(new THREE.Mesh(makeRib(R, sx, spanFrac), ribVertMat));
      ribPivots.push({ pivot, idx: h, sx, R });
    }
  }
  // D2 — THE SCAR: the snapped left rib #3. A jagged 3-vertex break face at the
  // stub end, the floating 0.6u orphan fragment below the break, and a COLD
  // marrow seam (0x8fd0ff, dim ×0.5 — satellite law §3.8) along the break face.
  // No yellow, no amber anywhere.
  {
    const R = RING_R[2];
    const scarPivot = ribPivots.find((rp) => rp.idx === 2 && rp.sx < 0).pivot;
    const root = new THREE.Vector3(-Math.cos(ROOT_TH) * R, Math.sin(ROOT_TH) * R, 0);
    const breakTh = ROOT_TH - ribArc * 0.45;
    const breakPos = new THREE.Vector3(-Math.cos(breakTh) * R - root.x, Math.sin(breakTh) * R - root.y, 0);
    // Jagged break face: a squashed 3-sided cone (three hard verts) on the stub end.
    const jag = strip(new THREE.ConeGeometry(0.24, 0.3, 3));
    jag.rotateZ(breakTh - Math.PI / 2);   // points along the broken axis
    jag.translate(breakPos.x, breakPos.y, 0);
    scarPivot.add(new THREE.Mesh(bakeRib(jag, breakPos), ribVertMat));
    // Cold marrow seam — dim ice sliver across the break face (the wound).
    const seamMat = track(new THREE.MeshBasicMaterial({ color: 0x8fd0ff }));
    seamMat.toneMapped = false;
    seamMat.color.multiplyScalar(0.5);   // ei ≈0.25-class: far below the eyes/lure (§3.8)
    const seam = new THREE.Mesh(strip(new THREE.CylinderGeometry(0.16, 0.18, 0.08, 6)), seamMat);
    seam.rotation.z = breakTh;
    seam.position.set(breakPos.x, breakPos.y, 0.06);
    seam.name = 'marrowScar';   // capture-tool focus target
    scarPivot.add(seam);
    // The floating ORPHAN FRAGMENT (r14 gate #5): a 0.6u rib-tone arc chunk that
    // visibly BELONGS to the snapped rib — it starts just past the break, drifts
    // ≤0.5u below the break face, and carries the dark tone ONLY at its broken
    // end (where it tore off), so it reads as the fallen piece, not a glitch chip.
    const fragPts = [];
    const FRAG_SPAN = 0.6 / R;                       // 0.6u of arc
    for (let i = 0; i <= 4; i++) {
      const th = breakTh - 0.03 - (i / 4) * FRAG_SPAN;
      fragPts.push(new THREE.Vector3(-Math.cos(th) * R - root.x, Math.sin(th) * R - root.y - 0.35, 0));
    }
    const frag = strip(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fragPts), 6, 0.15, ribRadialSeg, false));
    {
      const pos = frag.attributes.position;
      const cols = new Float32Array(pos.count * 3);
      const TONE = new THREE.Color(0xc4beac), A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
      for (let f = 0; f < pos.count; f += 3) {
        A.fromBufferAttribute(pos, f); B.fromBufferAttribute(pos, f + 1); C.fromBufferAttribute(pos, f + 2);
        const d = Math.hypot((A.x + B.x + C.x) / 3 - fragPts[0].x, (A.y + B.y + C.y) / 3 - fragPts[0].y);
        const c = d < 0.14 ? RIB_JOINT : TONE;       // dark ONLY at the broken end
        for (let k3 = 0; k3 < 3; k3++) { cols[(f + k3) * 3] = c.r; cols[(f + k3) * 3 + 1] = c.g; cols[(f + k3) * 3 + 2] = c.b; }
      }
      frag.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    }
    scarPivot.add(new THREE.Mesh(frag, ribVertMat));
  }
  // (the aperture rim torus was cut — gate r11 #7: a perfect hoop read as gym
  // equipment; the near-closed arch tips + corridor recession carry the read.)


  // ---- TAIL BLADE — a flat bone kite off the last vertebra.
  const tail = new THREE.Object3D();
  tail.name = 'tailBlade';   // viewer focus target
  vertNodes[N_VERT - 1].node.add(tail);
  const tailGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.quadraticCurveTo(0.5, -0.6, 0, -1.7); s.quadraticCurveTo(-0.5, -0.6, 0, 0);
    const g = strip(new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: !lowQ, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1, steps: 1 }));
    g.translate(0, 0, -0.05);
    const ridge = strip(new THREE.BoxGeometry(0.08, 1.3, 0.16)); ridge.translate(0, -0.65, 0.02);
    return mergeGeometries([g, ridge], false) || g;
  })();
  const tailMat = track(new THREE.MeshBasicMaterial({ color: 0xc4beac }));   // D6: ribs+tail tier (darkest structural bone)
  tail.add(new THREE.Mesh(tailGeo, tailMat));

  // ---- ORBITERS — two small pale bone chips (orbiter contract ≥2), dim so they
  // read as shed bone, never rival the focal.
  const chipMat = track(new THREE.MeshStandardMaterial({
    color: 0x4a463e, emissive: 0x4a463e, emissiveIntensity: 0.08, roughness: 0.9, metalness: 0.0, flatShading: true,
  }));
  const chipGeo = strip(new THREE.OctahedronGeometry(0.19, 0));
  const orbiters = [];
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Mesh(chipGeo, chipMat);
    m.userData = { ang: (i / 2) * Math.PI * 2 + 0.6, radius: 1.5 + i * 0.4, speed: 0.5 + i * 0.18, baseY: 5.6 - i * 1.0, tilt: i * 1.3 };   // circle the neck below the skull (§3 law 8 — never stray tunnel debris)
    rig.add(m);
    orbiters.push(m);
  }

  kit.flashBind(boneMat, BONE_EI);   // hit flash flares the skull/horn bone family
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
      spineCurve.points[i].y = ctrlBase[i].y + dyingK * (-2.2) * (i / (ctrlBase.length - 1));   // D8: the chain sags to rest
    }
    // Resample by ARC LENGTH at the size-proportional stations (chainU) so each
    // bone's gap stays a consistent fraction of its own radius, and ORIENT each
    // bone mesh to the curve tangent (local y = chain axis) with local +z held
    // toward world-up — the articulated column read (gate r3 #5), with the
    // dorsal fins standing up consistently.
    spineCurve.updateArcLengths();
    const liveLen = spineCurve.getLength();
    for (let k = 0; k < N_VERT; k++) {
      spineCurve.getPointAt(Math.min(1, chainS[k] / liveLen), _v);   // absolute stations: constant spacing in EVERY pose
      vertNodes[k].node.position.copy(_v);
    }
    // Orient every bone's LONG AXIS along its chain SEGMENT (lookAt the next
    // bone centre — gate r7 #1): the column reads as end-to-end bones, and the
    // joint discs (below) lie exactly on the same segments.
    for (let k = 0; k < N_VERT; k++) {
      const a = vertNodes[Math.max(0, k - 1)].node.position, b = vertNodes[Math.min(N_VERT - 1, k + 1)].node.position;
      _t.subVectors(b, a).normalize();
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
        // Disc at the CHORD midpoint between consecutive bone centres, axis
        // aligned to the segment (gate r7 #2) — with the welded 0.1 seams the
        // chord midpoints sit on the visual chain at every sweep phase.
        const a = vertNodes[d].node.position, b = vertNodes[d + 1].node.position;
        _v.copy(a).add(b).multiplyScalar(0.5);
        _t.subVectors(b, a).normalize();
        orientToTangent(_q, _t);
        // Encircling COLLAR (gate r10 #2): sized to the bone cross-section AT
        // THE SEAM — the octahedra taper toward their tips, so the meeting
        // waist is ~half the max radius. 1.05× THAT hugs the joint as a ring;
        // sizing to the max radius made collars jut sideways at bends (the
        // r10 'black thorns'). Height 0.1, nothing past the silhouette.
        const dr = Math.min(vertNodes[d].r, vertNodes[d + 1].r) * 0.55;
        _m.compose(_v, _q, _s.set(dr, 0.1, dr));
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
    // D11c: seat the graze beads on their vertebrae (dorsal side, toward +z).
    {
      const pos = beadChain.geo.attributes.position.array;
      for (let bi = 0; bi < BEAD_AT.length; bi++) {
        const vn = vertNodes[BEAD_AT[bi]];
        for (let vtx = 0; vtx < beadChain.nV; vtx++) {
          const si = vtx * 3, di = (bi * beadChain.nV + vtx) * 3;
          pos[di] = beadChain.tplPos[si] + vn.node.position.x;
          pos[di + 1] = beadChain.tplPos[si + 1] + vn.node.position.y;
          pos[di + 2] = beadChain.tplPos[si + 2] + vn.node.position.z + vn.r * 0.9;
        }
      }
      beadChain.geo.attributes.position.needsUpdate = true;
      beadChain.mat.opacity = 0.85 * (1 - dyingK) * (shieldClamp ? 0.15 : 1);
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

    skull.rotation.y = gazeX * 0.16 + charge * 0.06;   // roar yaw kept subtle — D12/r14 #2: charge stays a front elevation; both eyes AND both taut strands read
    skull.rotation.x = -gazeY * 0.1 - charge * 0.15;   // the head REARS BACK as the jaw drops (the roar) — the dark mouth wedge faces the rail (gate r6 #6)
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
    ribVertMat.color.setScalar(0.35 + 0.65 * boneLit);
    vertMat.color.setScalar(0.35 + 0.65 * boneLit);   // baked-facet bones leash on the same channel

    // Ice-blue lights: lure hottest, eyes second; flicker; constrict on charge;
    // gutter on blink/death; leash hard under a shield.
    const flick = 0.85 + Math.sin(time * 3.6) * 0.1 + Math.sin(time * 11) * 0.04;
    let eyeK = shieldClamp ? 0.1 : flick * (1 - blinkProg * 0.85) * (1 + charge * 0.5);
    let lureK = shieldClamp ? 0.12 : (0.9 + Math.sin(time * 2.3) * 0.1) * (1 + charge * 0.5);   // D9: the charge battery ramps ×~1.5
    if (noticeT > 0) { eyeK *= 1.35; lureK *= 1.35; }
    eyeK *= 1 - dyingK * 0.95; lureK *= 1 - Math.min(1, dyingK * 2.5);   // D8: the lure gutters out FIRST
    eyeMat.color.copy(EYE_BASE).multiplyScalar(Math.max(0.05, eyeK) * EYE_HOT);
    // r14 gate #4: dark sockets in death — past dyingK 0.4 the emissive clamps to
    // 0 and the residual disk lerps into socket shadow (0x1a2026), no lit orbs.
    const eyeDead = Math.max(0, Math.min(1, (dyingK - 0.25) / 0.15));
    if (eyeDead > 0) eyeMat.color.lerp(DEATH_EYE, eyeDead);
    if (dyingK >= 0.4) eyeMat.color.copy(DEATH_EYE);
    eyeHaloMat.opacity = Math.max(0.03, 0.5 * eyeK) * (1 - eyeDead);
    lureMat.color.setHex(0xd8ecff).multiplyScalar(Math.max(0.1, lureK) * LURE_HOT);
    lureHaloMat.opacity = Math.max(0.05, 0.6 * lureK * (1 - dyingK * 0.9));
    strandMat.opacity = 0.6 * (1 - dyingK);
    for (const e of eyeMeshes) {
      const pin = 1 - charge * 0.35 + dyingK * 0.4;
      e.core.scale.set(pin, pin * (1 - blinkProg * 0.9), pin);
      e.core.position.x = e.sx * 0.62 + gazeX * 0.04;
    }
    lureBead.position.y = Math.sin(time * 1.4) * 0.06 + charge * 0.1;
    lure.position.x = Math.sin(time * COIL_OMEGA) * 0.12;   // D1: visibly TETHERED — swings with the coil phase
    lure.position.z = LURE_BASE_POS.z + charge * 0.75;   // r14 gate #2: the charge battery pitches AHEAD of the brow so the full teardrop + taut strands are on camera
    updateStrand(charge);
    lure.scale.setScalar((1 + charge * 0.18) * (1 - dyingK * 0.6));

    // RIBCAGE dread telegraph ("The Closing Ribs"): setSetpiece constricts the
    // rings ONE AT A TIME (staggered), or (thread mode) flares open for the pass.
    // THE CLOSING RIBS (D3/D7): each rib ROTATES INWARD on its root pivot —
    // up to ~50° staggered ring by ring, tips approaching but never welding
    // (the 0.8u graze gap is the goldmine). Roots are pinned by construction
    // (the pivots ARE the roots). thread mode flares slightly open; a flinch
    // flexes the cage; death lets the ribs sag outward.
    for (const rb of ribPivots) {
      const j = rb.idx;
      const breathe = Math.sin(time * 1.1 + j * 0.7 + (rb.sx < 0 ? 0.4 : 0)) * 0.02;
      let rot;   // inward-positive target, applied as -sx * rot on the pivot z
      if (setpieceMode === 'thread' && setpieceK > 0) rot = -setpieceK * 0.1 + breathe;
      else {
        const stagger = Math.max(0, Math.min(1, (setpieceK - j * 0.12) / 0.4));
        rot = stagger * 0.87 + charge * 0.05 + breathe;   // 0.87 rad ≈ 50° full close
      }
      if (painT > 0) rot -= (painT / 0.3) * 0.12;
      if (shieldClamp) rot = 0.18;
      rot *= 1 - dyingK;
      if (dyingK > 0) rot -= dyingK * 0.25;   // death: the cage sags open
      const target = -rb.sx * rot;
      rb.pivot.rotation.z += (target - rb.pivot.rotation.z) * Math.min(1, dt * (setpieceK > 0 || charge > 0.25 ? 14 : 5));
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
