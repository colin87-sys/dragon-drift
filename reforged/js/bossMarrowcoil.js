import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// MARROWCOIL — "What the Sky Could Not Digest" (BOSS-DESIGN.md §5b/§5d slot 4,
// the Tier-2 COLOSSUS after ASHTALON). The bone dragon: a horned skull leading
// SIXTEEN coiling vertebrae, with a mid-body RIBCAGE the rail flies through.
//
// SILHOUETTE-FIRST (§3.1): one sentence — "a colossal bone dragon: a horned
// skull leading sixteen coiling vertebrae, with a ribcage you fly through." The
// skull + the barrel ribcage are the dominant masses; the vertebral chain is the
// connective sweep; the horns/lure crown the head. Nothing like the shattered
// mask (1), the ring-eye (2), or the scythe-raptor (3).
//
// FOCAL (§3.2): the LURE-LIGHT hung between the horns is THE brightest thing —
// an ice-blue teardrop on a bare strand, toneMapped=false, HDR-overdriven. The
// two recessed pinlight EYES are the secondary focal pair. Everything else is
// pale bone or dark socket, so the three ice-blue points own the frame.
//
// PALETTE (registry slot 4, VALUE INVERSION — sanctioned): pale BONE 0xd8d2c0
// self-lit (~75%), VOID gaps + dark sockets/rib-roots painting the carved value
// hierarchy (~20%), ice-blue 0x8fd0ff lights hottest (<5%). The pale body is a
// §3-law-3 exception (`gate: { pale: true }` on the def, registry-sanctioned) —
// it must read CARVED (dark recesses), never a flat plastic sticker.
//
// THE SCAR (§3.6, one asymmetric break): the outermost LEFT rib of the top
// ribcage hoop is snapped short — a cracked bone, the memory hook + lore gap
// (whose skeleton is this? §5b lore web, open for slot 14).
//
// FACELESS? No — MARROWCOIL HAS a face (skull + eyes + hinged jaw), so the §4
// charisma ladder is built directly in eye/jaw anatomy behind the unchanged
// setGaze/notice hooks:
//   GAZE   — the pinlight eyes track the player with lag + the skull tilts,
//   BLINK  — the eyes gutter dark on their own slow clock (the lure keeps lit),
//   CHARGE — the jaw hinges open + the lure flares + the eyes constrict bright,
//   EXPRESSION — jaw states (agape / clenched / slack) + eye intensity,
//   FLINCH — the skull recoils + the jaw snaps + the beads flash,
//   NOTICE — the eyes snap hot + the lure flares + the jaw gapes (fight-start),
//   DEATH  — the eyes ease shut, the jaw goes slack, the coil goes limp, the
//            lure gutters out (a skeleton laid to rest, never an explosion).
//
// THE COIL (the identity motion): the sixteen vertebrae are RESAMPLED every
// frame along a CatmullRom whose control points run a TRAVELING SINE — the coil
// sweep carries the whole chain (and the ribcage riding it) laterally.
//
// THE DREAD MOVE (§5f "MARROW — The Closing Ribs"): setSetpiece(k) constricts
// the ribcage one rib-pair at a time (staggered by hoop) while the coil sweeps —
// the fight's graze goldmine (thread the shrinking aperture).
//
// CONTRACT: boss.js stomps `group.rotation` every frame (placeGroup) and
// `kit.setDissolve` owns `group.scale` — every animated part lives on `rig`, the
// vertebra nodes, the jaw pivot, or the rib pivots, never on `group` itself.

export function buildBoneCoil(def, quality = 1) {
  const accent = def.accent ?? 0x8fd0ff;   // ice-blue — the cold lights on dead bone
  const glow = def.glow ?? 0xbfe6ff;        // paler ice (shield rim / shards / backlight)
  const lowQ = quality < 0.75;

  // Shared plumbing. The shield bubble wraps the skull + upper ribcage (the read
  // vulnerable core); the chain sweeps outside it. hpBarY clears the horns/lure.
  // hpBarY clears the horn tips + lure (local ~8.4) so the red HP-bar fill never
  // blooms onto the pale bone (a warm-on-cool overlap read as a G3 danger-magenta
  // collision); a smaller bar scale keeps its bloom footprint tight.
  const kit = createBossCommon(def, quality, { shieldRadius: 4.6, hpBarY: 10.6, hpBarZ: 1.4, hpBarScale: 0.7 });
  const { group, track } = kit;
  group.userData.archetype = 'boneCoil';   // guards the legacy-fallback coexist path (tests/boss.mjs)

  const rig = new THREE.Group();
  rig.position.y = -0.6;   // drop the chain so the skull+ribcage centre in the portrait envelope
  group.add(rig);

  const strip = stripForMerge;
  const mergeBone = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildBoneCoil: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ---- Painted value tiers (the sun can't shade the front face — §3.4). The
  // BONE runs pale and SELF-LIT (emissive floor) so the sanctioned VALUE
  // INVERSION reads bright (G2 pale: median luma ≥150) under the hemisphere-only
  // front light. The DARKS (sockets, rib-roots, horn-bases, the void gaps
  // between segments) carry NO emissive, so they stay near-black — the carved
  // recesses that keep the pale body from reading as a flat plastic sticker.
  // Bone value: the §5d sheet's 0xd8d2c0 was WARM (R>B); additive ice-blue over
  // a warm-lit body pushed overlaps toward MAGENTA (a G3 danger-band collision).
  // Shipped value is neutralised a touch COOLER (0xd4d5d2) so bone + additive
  // blue stays in the ice family (and reads colder/deader — registry row updated).
  // Emissive floor bumped to 0.9 so the sanctioned PALE body clears G2 (median
  // luma ≥150) under the hemisphere-only front light, without crossing the 1.0
  // bloom threshold (linear ~0.69 × 0.9 = 0.62).
  const BONE_EI = 1.05, RIB_EI = 0.92;   // base emissive floors (dimmed under shield/death in the tick)
  const boneMat = track(new THREE.MeshStandardMaterial({
    color: 0xd4d5d2, emissive: 0xd4d5d2, emissiveIntensity: BONE_EI, roughness: 0.82, metalness: 0.0, flatShading: true,
  }));
  // Second bone tier — the ribcage arcs, a hair dimmer so the cage reads a
  // value-step behind the skull (painted depth, §3.4).
  const ribBoneMat = track(new THREE.MeshStandardMaterial({
    color: 0xc7c9c7, emissive: 0xc7c9c7, emissiveIntensity: RIB_EI, roughness: 0.85, metalness: 0.0, flatShading: true,
  }));
  // The DARKS — sockets, rib-roots, joint knuckles: near-black, ZERO emissive,
  // so they carve shadow lines into the pale body (the value hierarchy).
  const darkMat = track(new THREE.MeshStandardMaterial({
    color: 0x14120f, emissive: 0x000000, emissiveIntensity: 0.0, roughness: 0.9, metalness: 0.0, flatShading: true,
  }));
  darkMat.side = THREE.DoubleSide;
  ribBoneMat.side = THREE.DoubleSide;

  // ---------------------------------------------------------------------
  // THE SKULL — a box CRANIUM (§5d: 1.6w) + a tapered SNOUT + hinged jaw + two
  // curved horn tubes. Built around the origin of a `skull` group that tilts
  // toward the gaze; the eyes + lure hang off it so they turn with the head.
  // ---------------------------------------------------------------------
  const skull = new THREE.Group();
  skull.position.set(0, 6.3, 0.6);   // leads the chain, forward of the nape
  rig.add(skull);

  const CRANIUM_W = 1.95;   // a big solid brain-case (the head is the dominant bone mass + the face read)
  const craniumGeo = (() => {
    // Box cranium, a touch domed (bevel via an octa cap) — the skull's brain-case.
    const box = strip(new THREE.BoxGeometry(CRANIUM_W, 1.5, 1.85));
    box.translate(0, 0.18, -0.4);
    const dome = strip(new THREE.OctahedronGeometry(1.15, lowQ ? 0 : 1));
    dome.scale(CRANIUM_W * 0.52, 0.6, 0.95); dome.translate(0, 0.72, -0.4);
    // Cheek ridges — mirrored raised bone bands (relief, §3.4/§3.6 symmetry).
    const cheek = (sx) => { const c = strip(new THREE.BoxGeometry(0.36, 0.8, 1.3)); c.translate(sx * (CRANIUM_W * 0.5 + 0.02), -0.12, -0.1); return c; };
    // Tapered SNOUT projecting forward to a blunt muzzle (the upper jaw).
    const snout = strip(new THREE.BoxGeometry(1.2, 0.66, 1.75));
    snout.translate(0, -0.2, 1.1);
    const muzzle = strip(new THREE.BoxGeometry(0.78, 0.46, 0.62));
    muzzle.translate(0, -0.28, 2.1);
    // Brow ledge over the sockets (mirrored) — throws a value step above each eye.
    const brow = (sx) => { const b = strip(new THREE.BoxGeometry(0.86, 0.3, 0.6)); b.rotateZ(-sx * 0.18); b.translate(sx * 0.62, 0.5, 0.62); return b; };
    // Upper teeth on the fixed snout (merged into the cranium — same bone mat, one
    // draw) so the closed mouth still reads a bone line above the hinged jaw.
    const upper = [];
    for (let i = 0; i < 5; i++) { const t = strip(new THREE.ConeGeometry(0.09, 0.26, 4)); t.rotateX(Math.PI); t.translate((i - 2) * 0.22, -0.42, 1.9 - i * 0.14); upper.push(t); }
    return mergeBone([box, dome, cheek(1), cheek(-1), snout, muzzle, brow(1), brow(-1), ...upper], 'cranium');
  })();
  skull.add(new THREE.Mesh(craniumGeo, boneMat));

  // Dark skull recesses: the deep EYE SOCKETS (real shadow tunnels the pinlights
  // sit inside) + the nostril pits + the under-snout shadow — all carved dark.
  const skullDarkGeo = (() => {
    const sockets = [];
    const socket = (sx) => { const s = strip(new THREE.BoxGeometry(0.62, 0.52, 0.55)); s.translate(sx * 0.62, 0.18, 0.72); return s; };
    sockets.push(socket(1), socket(-1));
    const nostril = (sx) => { const n = strip(new THREE.BoxGeometry(0.14, 0.16, 0.34)); n.translate(sx * 0.19, -0.28, 2.25); return n; };
    sockets.push(nostril(1), nostril(-1));
    const jawline = strip(new THREE.BoxGeometry(1.05, 0.12, 1.5)); jawline.translate(0, -0.52, 1.05);   // shadow under the snout
    sockets.push(jawline);
    // Dark horn-bases (carved sockets where horn meets bone) — merged into the
    // one skull-dark mesh (same dark mat) rather than their own draw.
    const hb = (sx) => { const b = strip(new THREE.OctahedronGeometry(0.3, 0)); b.translate(sx * 0.68, 0.82, -0.25); return b; };
    sockets.push(hb(1), hb(-1));
    return mergeBone(sockets, 'skullDark');
  })();
  skull.add(new THREE.Mesh(skullDarkGeo, darkMat));

  // Hinged JAW (the telegraph pivot — the gate finds it by name). A tapered bone
  // slab that drops open on charge; a dark inner shadow behind the teeth.
  const jawPivot = new THREE.Object3D();
  jawPivot.name = 'jawPivot';
  jawPivot.position.set(0, -0.42, 0.4);
  skull.add(jawPivot);
  const jawGeo = (() => {
    const slab = strip(new THREE.BoxGeometry(1.0, 0.34, 1.9)); slab.translate(0, -0.14, 1.05);
    const chin = strip(new THREE.BoxGeometry(0.62, 0.28, 0.5)); chin.translate(0, -0.2, 2.05);
    // Teeth: a mirrored row of little bone prisms on the jaw's biting edge.
    const teeth = [];
    for (let i = 0; i < 5; i++) { const t = strip(new THREE.ConeGeometry(0.09, 0.28, 4)); t.translate((i - 2) * 0.22, 0.06, 1.7 - i * 0.14); teeth.push(t); }
    return mergeBone([slab, chin, ...teeth], 'jaw');
  })();
  jawPivot.add(new THREE.Mesh(jawGeo, boneMat));
  const jawDark = new THREE.Mesh(strip(new THREE.BoxGeometry(0.74, 0.16, 1.1)), darkMat);   // mouth shadow
  jawDark.position.set(0, 0.04, 0.85); jawPivot.add(jawDark);

  // ---- HORNS — two curved tapered TubeGeometry sweeps off the cranium (the
  // idol's horn kernel, §5d). They frame the lure and crown the silhouette.
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
  const hornTubular = lowQ ? 8 : 12, hornRadial = lowQ ? 5 : 7;
  const makeHornGeo = (sx) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx * 0.68, 0.85, -0.25),   // base on the cranium top
      new THREE.Vector3(sx * 1.5, 1.95, -0.85),    // sweeps up + OUT (wide, not bunny-parallel) + back
      new THREE.Vector3(sx * 1.35, 3.15, -1.5),    // tip curls rearward
    ]);
    const g = strip(new THREE.TubeGeometry(curve, hornTubular, 0.38, hornRadial, false));
    taperTube(g, curve, hornTubular, hornRadial, (u) => Math.max(0.26, 1 - u * 0.68));
    return g;
  };
  skull.add(new THREE.Mesh(mergeBone([makeHornGeo(1), makeHornGeo(-1)], 'horns'), boneMat));

  // ---------------------------------------------------------------------
  // THE PINLIGHT EYES (§3.2/§4 charisma) — two small HDR ice-blue spheres set
  // DEEP in the dark sockets. A saturated ice-blue halo survives the white bloom
  // (the ASHTALON fringe lesson L137: a bright core drowns a thin fringe, so the
  // halo is sized proud of the core). They live in one `eyes` group so setGaze
  // slides the pair together and the skull tilt carries them.
  // ---------------------------------------------------------------------
  const EYE_BASE = new THREE.Color(accent);
  const EYE_HOT = 2.2;
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: accent })); eyeMat.toneMapped = false;
  eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const eyeHaloMat = track(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  eyeHaloMat.toneMapped = false;
  eyeHaloMat.color.copy(EYE_BASE).multiplyScalar(1.3);
  const eyes = new THREE.Group(); eyes.position.copy(skull.position); rig.add(eyes);
  // Both socket halos share ONE merged mesh (one draw; opacity is shared) — the
  // cores stay separate so gaze slides + charge constricts each pupil.
  {
    const hl = strip(new THREE.SphereGeometry(0.34, 8, 6)); hl.translate(-0.62, 0.18, 0.86);
    const hr = strip(new THREE.SphereGeometry(0.34, 8, 6)); hr.translate(0.62, 0.18, 0.86);
    eyes.add(new THREE.Mesh(mergeGeometries([hl, hr], false), eyeHaloMat));
  }
  const eyeMeshes = [];
  for (const sx of [-1, 1]) {
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), eyeMat);
    core.position.set(sx * 0.62, 0.18, 0.94); eyes.add(core);
    eyeMeshes.push({ core, sx });
  }

  // ---------------------------------------------------------------------
  // THE LURE — the FOCAL (§3.2): an HDR ice-blue teardrop hung on a bare strand
  // (LineSegments) between the horn tips, forward of the skull. The brightest
  // point in every state (above the eyes) — the anglerfish come-hither.
  // ---------------------------------------------------------------------
  const LURE_BASE = new THREE.Color(accent);
  const LURE_HOT = 2.8;
  const lureMat = track(new THREE.MeshBasicMaterial({ color: accent })); lureMat.toneMapped = false;
  lureMat.color.copy(LURE_BASE).multiplyScalar(LURE_HOT);
  const lureHaloMat = track(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  lureHaloMat.toneMapped = false; lureHaloMat.color.copy(LURE_BASE).multiplyScalar(1.4);
  const lure = new THREE.Group();
  lure.position.set(0, 3.05, 1.0);   // between + forward of the horn tips
  skull.add(lure);
  // Strand: a bare bone-white line from the cranium up to the lure (the filament).
  const strandMat = track(new THREE.LineBasicMaterial({ color: 0xc7c9c7, transparent: true, opacity: 0.7 }));
  strandMat.toneMapped = false;
  {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -2.2, -0.3), new THREE.Vector3(0, 0, 0)]);
    lure.add(new THREE.LineSegments(g, strandMat));
  }
  const lureHalo = new THREE.Mesh(new THREE.SphereGeometry(0.44, 10, 8), lureHaloMat); lure.add(lureHalo);
  // Teardrop: a sphere + a small down-cone (the drip) merged — the come-hither bead.
  const lureGeo = (() => {
    const s = strip(new THREE.SphereGeometry(0.26, 10, 8));
    const drip = strip(new THREE.ConeGeometry(0.15, 0.42, 8)); drip.rotateX(Math.PI); drip.translate(0, -0.3, 0);
    return mergeGeometries([s, drip], false) || s;
  })();
  const lureBead = new THREE.Mesh(lureGeo, lureMat); lure.add(lureBead);

  // ---------------------------------------------------------------------
  // THE SPINE — sixteen tapering octahedron VERTEBRAE, each merged with two
  // short torus-arc RIB STUBS (§5d articulation). They are RESAMPLED every frame
  // (tickBody) along the coil curve; here we only build the meshes + nodes and
  // the base control points. Each vertebra reads as a SEPARATE bone: the pitch
  // (centre spacing) exceeds the vertebra width, so real VOID gaps show between
  // them (the anti-sausage law + the dark half of the value hierarchy).
  // ---------------------------------------------------------------------
  const N_VERT = 16;
  // Base control points (x animates in tickBody). A gentle descent from nape to
  // tail; the traveling sine adds the lateral coil sweep at run time.
  const ctrlBase = [
    new THREE.Vector3(0, 5.8, 0.4),    // nape (just under the skull)
    new THREE.Vector3(0, 3.1, 0.0),
    new THREE.Vector3(0, 0.5, -0.3),   // upper ribcage
    new THREE.Vector3(0, -2.1, -0.3),  // lower ribcage
    new THREE.Vector3(0, -4.7, 0.0),
    new THREE.Vector3(0, -7.3, 0.5),   // tail base
  ];
  const ctrlAmp = ctrlBase.map((_, i) => 2.6 * Math.sin(Math.PI * i / (ctrlBase.length - 1)));   // 0 at ends, max mid (amp tuned so the ribcage barrel stays coherent while still sweeping ≥3)
  const spineCurve = new THREE.CatmullRomCurve3(ctrlBase.map((p) => p.clone()));
  spineCurve.curveType = 'catmullrom';

  const vertDetail = lowQ ? 0 : 1;   // OctahedronGeometry(r, detail): 8 → 32 tris
  const vertNodes = [];
  for (let i = 0; i < N_VERT; i++) {
    const t = i / (N_VERT - 1);
    const r = 0.42 - t * 0.22;   // taper 0.42 → 0.20 — beefier bones (more solid pale pixels) while pitch still > width
    const node = new THREE.Object3D();
    rig.add(node);
    // Vertebra core + 2 rib stubs, merged (one bone mesh per node — separate
    // meshes, NO InstancedMesh, phone-verified fine, L126). Rib stubs point
    // outward-and-back in the x/z plane (minimal y-extent, so the along-chain
    // vertebra width stays the octahedron diameter — the pitch>width assert).
    const octa = strip(new THREE.OctahedronGeometry(r, vertDetail));
    const stubR = r * 0.7 + 0.14, stubTube = 0.05, stubArc = Math.PI * 0.55;
    const stub = (sx) => {
      const g = strip(new THREE.TorusGeometry(stubR, stubTube, lowQ ? 4 : 5, lowQ ? 5 : 7, stubArc));
      g.rotateY(Math.PI / 2);                       // arc opens along z
      g.rotateZ(sx > 0 ? -0.5 : Math.PI + 0.5);     // sweep down-and-out to each side
      g.translate(sx * (r * 0.6), -0.02, -0.05);
      return g;
    };
    const vGeo = mergeBone([octa, stub(1), stub(-1)], `vert${i}`);
    vGeo.computeBoundingBox();
    const mesh = new THREE.Mesh(vGeo, boneMat);
    mesh.name = 'vertebra';   // tests/boss.mjs per-sheet geometry gate finds these
    node.add(mesh);
    // Ice-blue GRAZE BEAD on the spine (the "dotted-chain" glow-shape, §5b) — a
    // dim ice pinpoint riding every OTHER vertebra (satellites stay dim, §3.8).
    let bead = null;
    if (i % 3 === 1) {
      const bMat = track(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      bMat.toneMapped = false; bMat.color.copy(EYE_BASE).multiplyScalar(1.15);
      bead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), bMat);
      bead.position.set(0, r + 0.06, 0.02); node.add(bead);
    }
    vertNodes.push({ node, mesh, t, r, bead, baseR: r });
  }

  // ---------------------------------------------------------------------
  // THE RIBCAGE — five long torus-arc rib PAIRS riding the mid-body vertebrae,
  // forming the barrel TUNNEL the rail flies through (§5d/§5c "the fight moves").
  // Each hoop is a `ribPivot` (the telegraph the dread move constricts) parented
  // to a mid vertebra node, so it RIDES the coil sweep for free and stays
  // player-facing (axis ≈ z → the aperture opens toward the rail). Rest inner
  // clearance ≥ 4.5 units at the tightest hoop (the fly-through assert).
  // ---------------------------------------------------------------------
  const ribHoopIdx = [5, 6, 7, 8, 9];                 // the mid vertebrae carrying the cage
  const ribR = [3.1, 3.35, 3.45, 3.3, 3.05];          // barrel bulge; min 3.05 keeps the tightest thread clearance comfortably ≥4.5
  // Arc span π·0.82 (~148°) per rib so the PAIR closes into a near-complete RING
  // (only small dorsal/ventral notches) — front-on the five rings read as a
  // BARREL TUNNEL with an obvious central aperture (the rail flies through), not
  // two open side-combs. (Sheet said π·0.6; widened for the fly-through read —
  // registry row noted.) Thick tube for solid pale mass; clearance 2·(R−tube)≥4.5.
  const ribTube = 0.4, ribArc = Math.PI * 0.82;
  const ribRadialSeg = lowQ ? 5 : 7, ribTubularSeg = lowQ ? 12 : 20;
  const ribPivots = [];
  // One arc = a torus arc; a rib PAIR = left arc (covers upper-left→lower-left)
  // + right arc (mirror), leaving the dorsal (spine) + ventral gaps a real
  // ribcage has. Centre each arc on the horizontal axis so the tube's inner
  // surface (radius R−tube) sits at clearance all the way round the aperture.
  const makeRibArc = (R, sx) => {
    // TorusGeometry arc starts at angle 0 sweeping +arc; centre the span on the
    // side axis (right = 0°, left = 180°) by pre-rotating by −arc/2 then to side.
    const g = strip(new THREE.TorusGeometry(R, ribTube, ribRadialSeg, ribTubularSeg, ribArc));
    g.rotateZ(-ribArc / 2 + (sx > 0 ? 0 : Math.PI));
    return g;
  };
  for (let h = 0; h < ribHoopIdx.length; h++) {
    const R = ribR[h];
    const pivot = new THREE.Object3D();
    pivot.name = 'ribPivot';   // tests/boss.mjs + the dread telegraph find these by name
    pivot.userData.restR = R;  // documented rest radius (the clearance assert re-derives from geometry)
    vertNodes[ribHoopIdx[h]].node.add(pivot);
    pivot.add(new THREE.Mesh(mergeBone([makeRibArc(R, 1), makeRibArc(R, -1)], `ribHoop${h}`), ribBoneMat));
    ribPivots.push({ pivot, R, idx: h });
  }

  // THE SCAR (§3.6, one asymmetric break): snap the outermost LEFT rib of the TOP
  // hoop short — a cracked bone in the idle silhouette (left vs right outline).
  {
    const top = ribPivots[0];
    const arcMesh = top.pivot.children[0];
    arcMesh.geometry.dispose();
    // Rebuild the top hoop with the LEFT arc shortened to ~55% span (the crack).
    const R = top.R;
    const leftShort = strip(new THREE.TorusGeometry(R, ribTube, ribRadialSeg, Math.round(ribTubularSeg * 0.55), ribArc * 0.55));
    leftShort.rotateZ(-ribArc / 2 + Math.PI);
    arcMesh.geometry = mergeBone([makeRibArc(R, 1), leftShort], 'ribHoop0scar');
  }

  // ---- TAIL BLADE — a flat bone KITE off the last vertebra (§5d). Named node so
  // it can flick with the coil in the tick.
  const tail = new THREE.Object3D();
  vertNodes[N_VERT - 1].node.add(tail);
  const tailGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.quadraticCurveTo(0.5, -0.6, 0, -1.8); s.quadraticCurveTo(-0.5, -0.6, 0, 0);
    const g = strip(new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: !lowQ, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1, steps: 1 }));
    g.translate(0, 0, -0.05);
    const spineRidge = strip(new THREE.BoxGeometry(0.08, 1.4, 0.16)); spineRidge.translate(0, -0.7, 0.02);   // raised centre rib
    return mergeGeometries([g, spineRidge], false) || g;
  })();
  tail.add(new THREE.Mesh(tailGeo, boneMat));

  // ---------------------------------------------------------------------
  // ORBITERS — two small pale BONE CHIPS drifting near the chain (orbiter
  // contract ≥2). Self-lit bone (not black) so they read as loose shed ribs, not
  // debris holes — and don't drag the pale-body median. Kept dim + small so they
  // never rival the ice-blue focal (law 8).
  // ---------------------------------------------------------------------
  const chipMat = track(new THREE.MeshStandardMaterial({
    color: 0xb6b4ab, emissive: 0xb6b4ab, emissiveIntensity: 0.55, roughness: 0.88, metalness: 0.0, flatShading: true,
  }));
  const chipGeo = strip(new THREE.OctahedronGeometry(0.2, 0));
  const orbiters = [];
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Mesh(chipGeo, chipMat);
    m.userData = { ang: (i / 2) * Math.PI * 2 + 0.6, radius: 4.4 + i * 0.6, speed: 0.5 + i * 0.18, baseY: -1.5 - i * 1.2, tilt: i * 1.3 };
    rig.add(m);
    orbiters.push(m);
  }

  // Hit flash flares the RIBCAGE bone (a MeshStandard material that responds to
  // emissiveIntensity — the ice-blue focal is unlit Basic, which flashBind can't
  // spike): a struck skeleton flares hot at the cage the player is firing into,
  // localised rather than lighting the whole body.
  kit.flashBind(ribBoneMat, RIB_EI);
  kit.finalize();

  // ---------------------------------------------------------------------
  // ANIMATION — the coil sweep, the jaw/eye/lure charisma, the ribcage constrict.
  // ---------------------------------------------------------------------
  const COIL_OMEGA = 1.15;    // rad/s — one coil period ≈ 5.5s (tests/boss.mjs tick range covers it)
  const COIL_SEP = 1.05;      // phase step down the control chain (the traveling wave)

  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }
  let tell = null;
  function setAttackTell(id) { tell = id || null; }
  // setSetpiece(k, spDef): the controller passes the active setpiece def so the
  // model tells a fly-through pass (cage stays OPEN, jaw gapes as it looms) from
  // the Closing-Ribs dread (cage CONSTRICTS one pair at a time). Debug pins pass
  // no def → keep the last mode (default 'close', so a pinned still shows the
  // dread constriction — the CP2 capture).
  let setpieceK = 0, setpieceMode = 'close';
  function setSetpiece(k, spDef) {
    setpieceK = Math.max(0, Math.min(1, k));
    if (spDef && spDef.id === 'ribThread') setpieceMode = 'thread';
    else if (spDef) setpieceMode = 'close';
  }

  let shieldClamp = false, shieldOpenT = 0;
  kit.onShieldChange((v) => {
    if (v) { shieldClamp = true; return; }
    if (shieldClamp) { shieldClamp = false; shieldOpenT = 0.25; }
  });

  // Charisma state
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
    // Root idle sway (rig, never group) — a slow whole-body drift, 2 freqs (§3.7).
    rig.rotation.z = Math.sin(time * 0.4) * 0.02 + Math.sin(time * 0.9) * 0.008;

    // --- THE COIL SWEEP: run the traveling sine through the control points, then
    // resample the 16 vertebrae along the rebuilt curve. dyingK slows + slackens
    // it (the coil going limp in death). ---
    const coilAmp = (1 - dyingK * 0.7) * (1 + charge * 0.12);
    const coilRate = time * COIL_OMEGA * (1 - dyingK * 0.6);
    for (let i = 0; i < ctrlBase.length; i++) {
      spineCurve.points[i].x = ctrlBase[i].x + ctrlAmp[i] * coilAmp * Math.sin(i * COIL_SEP - coilRate);
      spineCurve.points[i].y = ctrlBase[i].y + dyingK * (-1.2) * (i / (ctrlBase.length - 1));   // sags as it dies
    }
    for (let k = 0; k < N_VERT; k++) {
      const u = k / (N_VERT - 1);
      spineCurve.getPoint(u, _v);
      vertNodes[k].node.position.copy(_v);
    }

    // --- Gaze: lagged pursuit + look-aways (the dead thing sizing you up) ---
    nextLookAway -= dt;
    if (lookAwayT > 0) lookAwayT -= dt;
    else if (nextLookAway <= 0 && charge < 0.2 && noticeT <= 0 && dyingK <= 0) {
      lookAwayT = 0.6 + Math.random() * 0.6; lookAwayX = (Math.random() - 0.5) * 1.4; lookAwayY = Math.random() * 0.4 - 0.2;
      nextLookAway = 5 + Math.random() * 6;
    }
    const gx = lookAwayT > 0 ? lookAwayX : gazeTX;
    const gy = lookAwayT > 0 ? lookAwayY : gazeTY;
    const gLag = (noticeT > 0 || charge > 0.5) ? 9 : 2.4;
    gazeX += (gx - gazeX) * Math.min(1, dt * gLag);
    gazeY += (gy - gazeY) * Math.min(1, dt * gLag);

    // --- Blink-analog: the eyes gutter dark on their own slow clock ---
    if (blinkT > 0) blinkT -= dt;
    else { nextBlink -= dt; if (nextBlink <= 0 && charge < 0.5 && noticeT <= 0 && dyingK <= 0) { blinkT = BLINK_DUR; nextBlink = 3 + Math.random() * 3; } }
    const blinkProg = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;

    if (painT > 0) painT -= dt;
    if (noticeT > 0) noticeT -= dt;
    if (shieldOpenT > 0) shieldOpenT -= dt;

    // --- The skull tilts toward the gaze (a subtle head turn); the eyes + lure
    // ride it because `eyes` mirrors the skull transform. ---
    skull.rotation.y = gazeX * 0.16;
    skull.rotation.x = -gazeY * 0.1 + charge * 0.04;
    eyes.rotation.copy(skull.rotation);
    // eyes group tracks the skull node position (skull may bob); keep them seated.
    eyes.position.set(skull.position.x, skull.position.y, skull.position.z);

    // --- THE JAW (charge telegraph): hinges open on charge/notice, snaps on
    // flinch, goes slack in death. rotation.x negative = gape (the gate asserts
    // it hinges past −0.3 on setCharge(1)). ---
    let jawOpen = charge * 0.6;
    if (tell === 'aimed' || tell === 'stream' || tell === 'crossfire') jawOpen = Math.max(jawOpen, charge * 0.75);
    if (noticeT > 0.5) jawOpen = Math.max(jawOpen, 0.7);
    if (setpieceMode === 'thread' && setpieceK > 0) jawOpen = Math.max(jawOpen, setpieceK * 0.8);   // gapes as it looms in
    if (painT > 0) jawOpen = Math.max(jawOpen, (painT / 0.3) * 0.5);
    if (dyingK > 0) jawOpen = jawOpen * (1 - dyingK) + 0.5 * dyingK;   // slack-jawed in death
    if (shieldClamp) jawOpen = 0.05;   // clamps shut when invulnerable (the leash)
    const jawSpeed = (charge > 0.25 || painT > 0 || shieldClamp) ? 16 : 6;
    jawPivot.rotation.x += (-jawOpen - jawPivot.rotation.x) * Math.min(1, dt * jawSpeed);

    // --- Recoil (flinch/notice): the whole rig kicks back. ---
    const recoil = (painT > 0 ? painT / 0.3 : 0) * 0.4 + (noticeT > 0.6 ? (noticeT - 0.6) / 0.3 : 0) * 0.3;
    rig.position.z = -recoil;
    rig.position.y = -0.6 + dyingK * -0.4;

    // --- The ice-blue lights: the lure is the BRIGHTEST in every state (focal
    // supremacy, §3.2); eyes secondary; both flicker at 2 freqs, constrict bright
    // on charge, gutter dark on blink/death, leash dim under a shield. ---
    // The BONE itself dims under a shield + in death (the skeleton goes cold when
    // invulnerable) — this keeps the bright bone from blooming against the shield
    // bubble and inflating the shielded bright-cluster (the G6 leash from the body
    // side). tickCommon's flash write (ribBoneMat) runs AFTER this and wins on a hit.
    const boneLit = shieldClamp ? 0.5 : (1 - dyingK * 0.55);
    boneMat.emissiveIntensity = BONE_EI * boneLit;
    ribBoneMat.emissiveIntensity = RIB_EI * boneLit;

    // Under a shield the WHOLE ice-blue system guttes cold (the leash, G6): the
    // lights must drop well below the idle bright cluster while invulnerable, so
    // the eyes/lure/beads all crush hard — the skeleton goes dark, not brighter.
    const flick = 0.85 + Math.sin(time * 3.6) * 0.1 + Math.sin(time * 11) * 0.04;
    let eyeK = shieldClamp ? 0.1 : flick * (1 - blinkProg * 0.85) * (1 + charge * 0.5);
    let lureK = shieldClamp ? 0.12 : (0.9 + Math.sin(time * 2.3) * 0.1) * (1 + charge * 0.35);
    if (noticeT > 0) { eyeK *= 1.35; lureK *= 1.35; }
    eyeK *= 1 - dyingK * 0.95; lureK *= 1 - dyingK * 0.9;
    // Flash (tickCommon) writes eyeMat LAST, so a hit flash wins; set the base here.
    eyeMat.color.copy(EYE_BASE).multiplyScalar(Math.max(0.05, eyeK) * EYE_HOT);
    eyeHaloMat.opacity = Math.max(0.04, 0.55 * eyeK);
    lureMat.color.copy(LURE_BASE).multiplyScalar(Math.max(0.1, lureK) * LURE_HOT);
    lureHaloMat.opacity = Math.max(0.05, 0.6 * lureK * (1 - dyingK * 0.9));
    strandMat.opacity = 0.7 * (1 - dyingK);
    // Eye constriction: the cores shrink to hot pins on charge (the tell), swell
    // on death (dilation, §4 ladder). Blink crushes them vertically.
    for (const e of eyeMeshes) {
      const pin = 1 - charge * 0.35 + dyingK * 0.4;
      e.core.scale.set(pin, pin * (1 - blinkProg * 0.9), pin);
      e.core.position.x = e.sx * 0.62 + gazeX * 0.05;   // pupils slide with gaze
    }
    // Lure bob (its own slow clock) + a slight rise on charge (the come-hither).
    lureBead.position.y = Math.sin(time * 1.4) * 0.06 + charge * 0.1;
    lure.scale.setScalar((1 + charge * 0.18) * (1 - dyingK * 0.6));

    // --- THE RIBCAGE (dread telegraph "The Closing Ribs"): setSetpiece(k)
    // constricts the hoops ONE PAIR AT A TIME (staggered by hoop index) toward
    // the spine — the aperture shrinks to a graze-thread. A small idle breathe
    // keeps the cage alive; charge tightens it a touch. Ribs also flex OPEN on a
    // flinch. dyingK slackens them. ---
    for (const rb of ribPivots) {
      const j = rb.idx;
      const breathe = Math.sin(time * 1.1 + j * 0.7) * 0.03;
      let s;
      if (setpieceMode === 'thread' && setpieceK > 0) {
        // Fly-through pass: the cage FLARES a touch wider (never closes) so the
        // aperture is at its most open as the rail threads it.
        s = 1 + breathe + setpieceK * 0.1;
      } else {
        // The Closing Ribs (dread): hoop j constricts as k passes j/5 (one pair at
        // a time — the staggered ritual, the graze goldmine).
        const stagger = Math.max(0, Math.min(1, (setpieceK - j * 0.12) / 0.4));
        s = 1 + breathe - stagger * 0.52 - charge * 0.06;
      }
      if (painT > 0) s = Math.max(s, 1 + (painT / 0.3) * 0.14);   // flinch flexes the cage open
      if (shieldClamp) s = 0.9;                                   // cage folds in a touch under shield
      s *= 1 - dyingK * 0.25;
      const cur = rb.pivot.scale.x;
      const es = cur + (s - cur) * Math.min(1, dt * (setpieceK > 0 || charge > 0.25 ? 14 : 5));
      rb.pivot.scale.set(es, es, 1);   // shrink the aperture in-plane; depth unchanged
    }

    // Graze-bead pulse (the dotted chain) + death gutter; leashes under a shield.
    const beadLeash = shieldClamp ? 0.12 : 1;
    for (const v of vertNodes) {
      if (!v.bead) continue;
      v.bead.material.opacity = (0.6 + Math.sin(time * 2.5 + v.t * 8) * 0.25) * (1 - dyingK * 0.9) * beadLeash;
    }

    // Tail flick — lags the coil a beat (the whip end).
    tail.rotation.z = Math.sin(time * COIL_OMEGA - COIL_SEP * 6) * 0.4 * (1 - dyingK * 0.6);

    // Dark bone chips drift near the chain.
    for (const o of orbiters) {
      const u = o.userData; u.ang += dt * u.speed;
      o.position.set(Math.cos(u.ang) * u.radius, u.baseY + Math.sin(time * 1.2 + u.tilt) * 0.6, -0.8 + Math.sin(u.ang) * u.radius * 0.3);
      o.rotation.x += dt * 1.3; o.rotation.y += dt * 1.0;
    }
  }

  // Muzzle: fire originates from the skull's maw (the hunter's line of sight),
  // on `group` so it ignores idle motion (a stable controller ref).
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 5.6, 2.4);
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
    dispose() {
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    },
  };
}
