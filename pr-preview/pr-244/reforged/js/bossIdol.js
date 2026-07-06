import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { mulberry32 } from './util.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

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
// and merged via mergeGeometries (the dragonHull/dragonTail precedent) into
// THREE stone draw calls — one per painted value tier (dark base / mid carve /
// bright ridge; see the round-5 note at the merge site) — ~13 fight-visible
// draws total vs the ≤20 gate. mergeGeometries HARD-FAILS (returns null) on
// any attribute-set mismatch, so every part strips its `uv` (ExtrudeGeometry
// carries one; the primitive geometries used here don't need it) before
// merging — see `strip()`.
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

  // Attribute/indexing normalisation before mergeGeometries — shared kit
  // helper (see bossKit.js#stripForMerge for the full silent-null rationale).
  const strip = stripForMerge;

  // ---------------------------------------------------------------------
  // MASK PLATE — an angular THREE.Shape extruded with two REAL hole paths for
  // the eye sockets. Outline wound CCW / holes wound CW (three.js convention
  // for a solid-with-holes shape); holes sit fully inside the outline so
  // earcut triangulates cleanly instead of silently degenerating.
  // ---------------------------------------------------------------------
  function buildMaskShape() {
    const shape = new THREE.Shape();
    // WIDE ANGULAR mask (round-4 gate review): 5.72 across × 3.93 tall
    // (~1.46:1 — width visibly dominates) with LONG STRAIGHT runs: a flat
    // brow, hard temple corners, a cheekbone flare at the widest point, one
    // jagged notch per side, a blunt chin taper. Deliberately FEW points —
    // the first cut's dense 22-gon read as a circle at fight distance; hard
    // edges are what survive 30m.
    const outline = [
      [0.00, 1.75],                                     // brow centre peak
      [-1.10, 1.70], [-2.30, 1.35],                     // flat brow → temple corner
      [-2.86, 0.55],                                    // cheekbone flare (widest)
      [-2.55, -0.20], [-2.75, -0.55],                   // jagged side notch
      [-1.95, -1.35], [-1.15, -1.85], [-0.45, -2.10],   // hard chin taper
      [0.00, -2.18],                                    // chin tip
      [0.45, -2.10], [1.15, -1.85], [1.95, -1.35],
      [2.75, -0.55], [2.55, -0.20],
      [2.86, 0.55],
      [2.30, 1.35], [1.10, 1.70],
    ];
    shape.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i][0], outline[i][1]);
    shape.closePath();

    // Angular SLANTED socket (the character pass): a seven-point heptagon on
    // a tilted ellipse — the outer (temple-side) corner rides high and the
    // inner corner drops, so the resting expression is a GLARE, not the
    // neutral surprise the old round nonagon gave. Points are generated in
    // DECREASING angle order = CW winding (three.js hole convention);
    // `mirror` flips X *and* reverses point order so the mirrored hole stays
    // CW too (mirroring across X alone would flip it to CCW).
    const eyeHole = (cx, cy, mirror) => {
      const A = 0.74, B = 0.46, ROT = -0.35;   // slant: the left eye's -x (temple) end rises
      const rel = [];
      for (let k = 0; k < 7; k++) {
        const t = -k * (Math.PI * 2 / 7);
        const ex = Math.cos(t) * A, ey = Math.sin(t) * B;
        rel.push([ex * Math.cos(ROT) - ey * Math.sin(ROT), ex * Math.sin(ROT) + ey * Math.cos(ROT)]);
      }
      const pts = (mirror ? rel.slice().reverse() : rel).map(([x, y]) => [cx + (mirror ? -x : x), cy + y]);
      const path = new THREE.Path();
      path.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
      path.closePath();
      return path;
    };
    shape.holes.push(eyeHole(-1.30, 0.30, false));   // left socket
    shape.holes.push(eyeHole(1.30, 0.30, true));     // right socket (mirrored, still CW)
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

  // Round-5 gate: ONE merged stone draw with one uniform emissive read as a
  // FLAT STICKER — the extruded front face is a single planar polygon, the
  // sun sits ahead of the player (so the front face gets no directional
  // shading), and uniform emissive flattened whatever facets existed. Fix:
  // PAINT the value hierarchy instead of relying on lighting. Three part
  // groups → three materials (same MeshStandardMaterial program, different
  // color/emissive values): dark desaturated base plate, mid tone for the
  // carved edges (horns + temple/cheek chips), brighter accent for the
  // brow-ridge + chin lines. Costs +2 draw calls (13 visible vs the ≤20
  // gate) and zero extra tris.
  const baseParts = [maskGeo];     // mask plate + back lobes — the dark canvas
  const midParts = [];             // horns + temple/cheek chips — carved mid tone
  const accentParts = [];          // brow-ridge + chin chips — the lit ridge line

  // ---------------------------------------------------------------------
  // CARVED RELIEF — authored, symmetric plates: a mason built this face.
  // (Replaces the jittered chip scatter, which read as random debris
  // speckle at fight distance — randomness reads as noise, symmetry reads
  // as INTENT.) Symmetry law: everything mirrors EXCEPT the snapped-horn
  // side (+x), where the upper cheek guard is cracked in two with a visible
  // gap — the same damage story the stub and the crack seams tell. Tiny
  // deterministic jitter keeps the carving hand-hewn, not CAD-perfect.
  // ---------------------------------------------------------------------
  const j = (amt) => (rnd() - 0.5) * amt;
  const relief = (parts, geo, x, y, z, rz = 0) => {
    geo = strip(geo);
    if (rz) geo.rotateZ(rz);
    geo.translate(x, y, z);
    parts.push(geo);
  };
  // GILT parts render with the halo's gold-emissive material (one extra draw
  // — phone-verified cheap): the idol's gilding survives on the brow and chin,
  // tying the face to the halo/seam gold story. Gilded brows over glaring
  // eyes is the single strongest "ancient wrathful god" cue on the face.
  const giltParts = [];
  // Brow ridge bars — the EXPRESSION RIG (shareability pass). The bars used to
  // be merged into the static gilt draw; they now live on individual pivots so
  // ±0.3 rad of rotation gives the face a full emotional range: glare (rest),
  // anger (charge — steeper), pain (hit flinch — inner ends up), sorrow
  // (death — outer ends collapse). Research note: a face that can CHANGE
  // state is the single strongest fan-art driver; two rotating boxes are the
  // cheapest expression machine in the entire engine. Meshes share the gilt/
  // halo material (created below) — wired up after it exists.
  const BROW_BASE = -0.22;   // resting glare slant (outer end high), per side
  const browPivots = [];
  const browSpec = [];       // deferred: material doesn't exist yet
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Object3D();
    pivot.name = 'browPivot';
    pivot.position.set(sx * 1.28, 1.02 + j(0.03), 0.46);
    pivot.rotation.z = sx * BROW_BASE;
    pivot.userData.sx = sx;
    rig.add(pivot);
    browPivots.push(pivot);
    browSpec.push(pivot);
  }
  // Nose ridge: a vertical prism between the sockets — centre-line structure
  // (a face is read from its centre-line out; the old scatter had none).
  relief(midParts, new THREE.BoxGeometry(0.36, 1.05, 0.34), 0, 0.12, 0.44);
  // Cheek guards: stacked plates tilted with the cheek line. The +x upper
  // guard is the CRACKED one: two offset halves, gap between them.
  relief(midParts, new THREE.BoxGeometry(0.62, 0.70, 0.24), -1.85, -0.55, 0.45, 0.18);
  relief(midParts, new THREE.BoxGeometry(0.30, 0.66, 0.24), 1.68, -0.50, 0.45, -0.30);
  relief(midParts, new THREE.BoxGeometry(0.26, 0.52, 0.24), 2.06, -0.68, 0.43, -0.55);
  for (const sx of [-1, 1]) {
    relief(midParts, new THREE.BoxGeometry(0.44, 0.55, 0.22), sx * 1.12, -1.18, 0.44, sx * -0.35);
  }
  // Temple studs: three small square bosses down each temple edge (skipped
  // at low quality — sub-pixel there anyway).
  if (!lowQ) {
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        relief(midParts, new THREE.BoxGeometry(0.20, 0.20, 0.30), sx * (2.30 - i * 0.16), 0.95 - i * 0.55 + j(0.04), 0.42, j(0.5));
      }
    }
  }
  // Chin plate: an inverted gilt wedge under the mouth line (top radius wide,
  // bottom near-point — tapers downward, no rotation needed).
  relief(giltParts, new THREE.CylinderGeometry(0.30, 0.06, 0.55, 3), 0, -1.62, 0.44);

  // CROWN CREST — three blade fins rising off the brow: the outline's top
  // edge was a featureless flat run. TALL centre fin (the capture pass at
  // fight distance showed 1.05 barely broke the outline — the crown must be
  // unmissable at 1×, not just in zoomed crops); the fin on the snapped side
  // (+x) is clipped short — the damage reaches the crown too. Extruded thin
  // (0.22) and buried mid-plate in z so only the rising blade breaks the
  // silhouette.
  const fin = (h, w) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(0, h); s.lineTo(w / 2, 0); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.22, steps: 1, bevelEnabled: false, curveSegments: 1 });
  };
  relief(accentParts, fin(1.40, 0.60), 0, 1.68, -0.12);
  relief(accentParts, fin(0.85, 0.46), -0.85, 1.60, -0.12, 0.10);
  relief(accentParts, fin(0.38, 0.40), 0.85, 1.58, -0.12, -0.12);

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

  // PROMINENT up-and-back sweep off the left temple corner — the horn must
  // break the mask outline decisively (round-4 rule: the horns carry the
  // asymmetric-scar read at silhouette level, so both have to be obvious).
  const hornCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.20, 1.30, 0.20),   // base: left temple corner
    new THREE.Vector3(-3.15, 2.65, -0.40),  // sweeps up and OUT past the cheekbone flare
    new THREE.Vector3(-2.50, 3.95, -1.30),  // tip curls back in and rearward
  ]);
  const hornTubular = 12, hornRadial = 8;
  // Base radius 0.44 and a shallower taper floor (0.26) — earlier passes
  // (0.30 base / 0.16 floor) thinned to a needle that vanished into the
  // halo-arc linework at fight distance; the design-pass capture still read
  // "stubby lump", so the whole sweep got bigger and wider. Still clearly
  // tapered, just built to be read at 30m, not at arm's length.
  const hornGeo = strip(new THREE.TubeGeometry(hornCurve, hornTubular, 0.44, hornRadial, false));
  taperTube(hornGeo, hornCurve, hornTubular, hornRadial, (u) => Math.max(0.26, 1 - u * 0.74));
  midParts.push(hornGeo);

  // Snapped stub on the RIGHT temple: a short 6-sided cylinder with its top
  // ring jittered in Y for a jagged break, instead of a clean cut. Round-4
  // gate re-review: the first pass (0.36 base radius, 0.65 tall) was legible
  // in isolation but vanished against the halo arc at fight distance — a
  // 4px smudge, not a "clearly breaks the outline" scar. Bulked up (0.52
  // base radius, 1.05 tall, wider jag) and canted further outward so its
  // jagged top silhouettes cleanly past the brow edge instead of hugging it.
  const stubGeo = strip(new THREE.CylinderGeometry(0.40, 0.52, 1.05, 6, 1, false));
  {
    const pos = stubGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0.3) {   // top ring only
        pos.setY(i, pos.getY(i) + (rnd() - 0.5) * 0.42);
        pos.setX(i, pos.getX(i) + (rnd() - 0.5) * 0.10);
      }
    }
    pos.needsUpdate = true;
    stubGeo.computeVertexNormals();
  }
  stubGeo.rotateX(0.12);
  stubGeo.rotateZ(-0.30);   // canted outward (was -0.08) — juts clear of the brow instead of leaning against it
  stubGeo.translate(2.35, 1.65, 0.10);
  midParts.push(stubGeo);

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
  // Round-4 rule: the lobes must ALSO stay inside the front plate's own
  // silhouette (x extent ±1.99 < plate edge ±2.28 at this height) so the
  // depth mass never bulges past the outline and rounds it off.
  for (const sx of [-1, 1]) {
    const lobe = strip(new THREE.IcosahedronGeometry(0.75, 1));
    jitterVerts(lobe, 0.10, rnd);
    lobe.scale(1.05, 1.1, 0.8);
    lobe.translate(sx * 1.2, -1.25, -1.0);
    baseParts.push(lobe);
  }

  // ---- Merge each value group into its own geometry / draw call ----
  // Colors bias toward GRAY-violet (round-5: the old saturated 0x14101c +
  // 0.13 emissive read as a uniform purple cutout) — the STONE is gray, the
  // violet lives in the emissive accents and the halo/seams tier.
  function mergeStone(parts, label) {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildIdolMask: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  }
  const baseMat = track(new THREE.MeshStandardMaterial({
    color: 0x191720, emissive: accent, emissiveIntensity: 0.06, roughness: 0.6, metalness: 0.25, flatShading: true,
  }));
  const midMat = track(new THREE.MeshStandardMaterial({
    color: 0x262230, emissive: accent, emissiveIntensity: 0.12, roughness: 0.55, metalness: 0.3, flatShading: true,
  }));
  const accentStoneMat = track(new THREE.MeshStandardMaterial({
    color: 0x322c3e, emissive: accent, emissiveIntensity: 0.18, roughness: 0.5, metalness: 0.3, flatShading: true,
  }));
  rig.add(new THREE.Mesh(mergeStone(baseParts, 'base-stone'), baseMat));
  rig.add(new THREE.Mesh(mergeStone(midParts, 'mid-stone'), midMat));
  rig.add(new THREE.Mesh(mergeStone(accentParts, 'accent-stone'), accentStoneMat));

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
  jawPivot.name = 'jawPivot';   // tests/tooling seam: the telegraph-silhouette gate finds this by name
  jawPivot.position.set(0, -1.70, 0.60);
  const jawMesh = new THREE.Mesh(jawGeo, baseMat);   // shares the dark base stone — separate draw, same "family"
  jawPivot.add(jawMesh);
  rig.add(jawPivot);

  // ---------------------------------------------------------------------
  // EYE CORES — the single brightest thing on the boss (focal-point law).
  // Sit just behind the socket plane so they read as ignited INSIDE the
  // hollow eyes rather than floating in front of the mask.
  // ---------------------------------------------------------------------
  // The eyes live in a group centred between the sockets so a single
  // scale.y drives BLINKS (crushing eyes + pupils together about the socket
  // line, not about the rig origin). Blinks are the aliveness heartbeat —
  // and eyes closing to slits over sky-holes is a read no flat sprite gets.
  const eyeGroup = new THREE.Group();
  eyeGroup.name = 'focalEye';   // LANCE seam: V1 aim-line target (partWorldPos), byte-neutral metadata
  eyeGroup.position.set(0, 0.30, -0.25);
  rig.add(eyeGroup);
  const eyeSeg = lowQ ? [8, 6] : [10, 8];
  const eyeParts = [];
  for (const sx of [-1, 1]) {
    // r=0.58 (round-4 gate: was 0.45 — too small to win "brightest pixels on
    // the boss" against the widened sockets). Against the ~0.6-"radius"
    // angular socket the round core now fills most of the hole while the
    // socket's angular CORNERS still stay open — a black rim of stone framing
    // a white-hot core, not a sliver of sky around a small ember. Centred on
    // the eyeHole(-1.30, 0.30) / (1.30, 0.30) socket positions above (was
    // drifted off-centre at ±1.05, 0.35 before this pass). Recessed to
    // z −0.25 (front face is +0.40) so it sits INSIDE the socket tunnel, not
    // flush with the face.
    const eye = strip(new THREE.SphereGeometry(0.58, eyeSeg[0], eyeSeg[1]));
    eye.translate(sx * 1.30, 0, 0);   // relative to eyeGroup (which carries the 0.30/-0.25 offset)
    eyeParts.push(eye);
  }
  const eyeGeo = mergeGeometries(eyeParts, false);
  if (!eyeGeo) throw new Error('buildIdolMask: eye mergeGeometries returned null (attribute mismatch)');
  const EYE_BASE = new THREE.Color(0xfff2ff);
  // Round-5 gate ("dead eyes"): at color ≤1.0 the eyes could never win — the
  // bloom threshold is 1.0 in LINEAR light (postfx.js UnrealBloomPass arg 4)
  // and ACES crushes 1.0 to ~0.8 gray, so they read as matte dots while the
  // HP bar outshone them. Two-part fix:
  // 1. EYE_HOT overdrive: tickBody drives color to ~2.4× linear white — the
  //    composer renders into a HalfFloat HDR target, so >1 values survive to
  //    the bloom pass and the eyes genuinely bloom (and ACES maps them to
  //    pure white, the brightest pixels on the boss).
  // 2. toneMapped = false: in the composer path tone mapping happens once,
  //    globally, in OutputPass (per-material toneMapped is a no-op there) —
  //    but on the no-postfx fallback (weak devices, postfx.supported false)
  //    materials DO tone map individually, and this keeps the eyes at full
  //    white there too.
  const EYE_HOT = 2.4;
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xfff2ff }));
  eyeMat.toneMapped = false;
  eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
  eyeGroup.add(eyeMesh);

  // PUPILS — two small void-dark spheres riding the white-hot cores. The
  // anthropomorphism research is unambiguous: eyes that DO things (track the
  // player with a little lag, constrict when charging, dilate in death) are
  // what turn "two glowing dots" into "a mind looking at you". Separate
  // meshes (not merged) because constriction scales each pupil about its own
  // centre; they're children of eyeGroup so blinks crush them with the eyes.
  // r 0.14: big enough to read as a pupil at fight distance, small enough
  // that the resting glare stays WRATHFUL — the first capture pass at 0.17
  // tipped the look-away frames into googly-eyed comedy.
  const pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x140a1e }));
  const pupilGeo = new THREE.SphereGeometry(0.14, 8, 6);
  const pupils = [];
  for (const sx of [-1, 1]) {
    const p = new THREE.Mesh(pupilGeo, pupilMat);
    p.userData.sx = sx;
    p.position.set(sx * 1.30, 0, 0.48);   // embedded in the core's front face
    eyeGroup.add(p);
    pupils.push(p);
  }

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
  // GILDED halo (design pass): emissive biased toward the seam gold instead
  // of pure violet — the halo is the idol's ancient gilding, the same
  // material story as the cracks, and it separates the halo tier from the
  // violet stone accents at a glance.
  // EMBER, not gold (palette separation): both bosses were sharing white+gold
  // accents, which blurs them at thumbnail size — the exact failure mode the
  // shareability research flags for attribution. The idol's metal runs warm
  // ember-orange; Stormrend keeps the pale storm-gold.
  const haloEmissive = new THREE.Color(0xe0913f).lerp(new THREE.Color(accent), 0.25);
  const haloMat = track(new THREE.MeshStandardMaterial({
    color: 0x14101c, emissive: haloEmissive, emissiveIntensity: 0.65, roughness: 0.5, metalness: 0.3, flatShading: true,
  }));
  // Gilt face relief (chin wedge) shares the halo's gold material — one extra
  // draw, and the face's gilding visibly matches the halo's.
  const giltGeo = mergeGeometries(giltParts, false);
  if (!giltGeo) throw new Error('buildIdolMask: gilt mergeGeometries returned null (attribute mismatch)');
  rig.add(new THREE.Mesh(giltGeo, haloMat));
  // Brow bars mount onto their expression pivots now that the gilt material
  // exists (geometry centred on the pivot so rotation.z IS the expression).
  const browGeo = strip(new THREE.BoxGeometry(1.45, 0.24, 0.26));
  for (const pivot of browSpec) pivot.add(new THREE.Mesh(browGeo, haloMat));
  // Debris chunks merged INTO each arc geometry sit in the arc gaps and ride
  // the arc's rotation for free (same draw call, no per-frame work): the
  // halo reads as a shattered sun-disc whose fragments still orbit together.
  const debris = (angles, radius) => angles.map((ang) => {
    let d = strip(new THREE.OctahedronGeometry(0.17 + rnd() * 0.10, 0));
    d.rotateZ(rnd() * Math.PI);
    d.rotateX(rnd() * Math.PI);
    d.translate(Math.cos(ang) * radius, Math.sin(ang) * radius, 0);
    return d;
  });
  const haloTubularA = lowQ ? 14 : 24;
  const arcA1 = strip(new THREE.TorusGeometry(4.0, 0.19, 6, haloTubularA, Math.PI * 0.55));
  arcA1.rotateZ(0.20);
  const arcA2 = strip(new THREE.TorusGeometry(4.0, 0.19, 6, haloTubularA, Math.PI * 0.55));
  arcA2.rotateZ(Math.PI + 0.45);
  // Gap spans (arc A occupies 0.20–1.93 and 3.59–5.32 rad): debris at
  // 2.35/3.05 and 5.75/6.35 sit squarely in the two openings.
  const haloAGeo = mergeGeometries([arcA1, arcA2, ...debris([2.35, 3.05, 5.75, 6.35], 4.0)], false);
  if (!haloAGeo) throw new Error('buildIdolMask: halo-A mergeGeometries returned null (attribute mismatch)');
  haloAGeo.translate(0, 0, -1.6);
  const haloA = new THREE.Mesh(haloAGeo, haloMat);
  rig.add(haloA);

  // Outer counter-arc stays inside the kit shield bubble (r 4.6): 4.4 + 0.15
  // tube ≈ 4.55, so a raised shield never clips through the halo.
  const haloTubularB = lowQ ? 12 : 20;
  const arcB = strip(new THREE.TorusGeometry(4.4, 0.15, 6, haloTubularB, Math.PI * 0.4));
  arcB.rotateZ(1.3);
  const haloBGeo = mergeGeometries([arcB, ...debris([4.3, 5.9], 4.4)], false);
  if (!haloBGeo) throw new Error('buildIdolMask: halo-B mergeGeometries returned null (attribute mismatch)');
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
  const seamColor = new THREE.Color(0xe0913f).lerp(new THREE.Color(accent), 0.35);   // same ember family as the halo/gilt
  const seamMat = track(new THREE.LineBasicMaterial({
    color: seamColor, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const seams = new THREE.LineSegments(seamGeo, seamMat);
  rig.add(seams);

  // ---------------------------------------------------------------------
  // BACKLIGHT GLOW DISC (round-4 gate: REPLACES the old enclosing fresnel
  // shell). The shell wrapped the whole mask volume in an additive bubble —
  // from the real fight camera it swallowed the silhouette and read as "a
  // purple ball with arcs", which is the exact failure the gate called out.
  // A flat disc, strictly BEHIND the mask plane (front face z≈0.4, back
  // z≈-0.6) and narrower than the mask's own half-width (2.86), can only
  // rim-light the outline — glow bleeding around the jagged edges and out
  // through the eye sockets via bloom — instead of enclosing the build. It
  // carries NO charge/shield reaction (directive 5): the halo arcs + eyes
  // are the energy read, this is pure ambience.
  const glowDiscMat = track(new THREE.MeshBasicMaterial({
    color: glow, transparent: true, opacity: 0.30, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  const glowDiscGeo = new THREE.CircleGeometry(2.3, lowQ ? 10 : 18);
  const glowDisc = new THREE.Mesh(glowDiscGeo, glowDiscMat);
  glowDisc.position.set(0, 0, -1.9);
  rig.add(glowDisc);

  // ---------------------------------------------------------------------
  // ORBITERS — void chips (contract: ≥2). Animation loop copied from the
  // legacy bossModel.js construct verbatim so the drift read stays familiar
  // across every boss archetype.
  // ---------------------------------------------------------------------
  // Round-5 gate: at emissive glow(0xc89aff)×0.7 a flat-shaded octahedron
  // facet rendered as a PALE GRAY WEDGE that, drifting past the mask's cheek,
  // read like a glitched beam bolted to the face (the gate's "pale sideways
  // wedge" — it moved between captures, which is how it was identified as an
  // orbiter, not the stub). Dark void chips now: near-black base, dim violet
  // accent emissive — drifting silhouettes, clearly darker than every stone
  // tier and never in competition with the eyes.
  const voidChipMat = track(new THREE.MeshStandardMaterial({
    color: 0x120b1a, emissive: accent, emissiveIntensity: 0.25, roughness: 0.3, metalness: 0.4, flatShading: true,
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

  // Hit flash targets the base stone (the biggest-area "body" read, same
  // idiom as the legacy core flash). Base intensity matches baseMat's 0.06.
  kit.flashBind(baseMat, 0.06);

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

  // --- CHARISMA LAYER (shareability pass) -------------------------------
  // Gaze: the controller feeds normalized player offsets (setGaze); the
  // pupils chase them with LAG — snap-tracking reads as a turret, lagged
  // tracking reads as ATTENTION — and occasionally wander off deliberately
  // (perfect fixation is machine behavior; a mind's gaze drifts).
  let gazeTX = 0, gazeTY = 0;        // controller-fed target
  let gazeX = 0, gazeY = 0;          // lagged current
  let lookAwayT = 0, lookAwayX = 0, lookAwayY = 0;
  let nextLookAway = 4 + Math.random() * 5;
  function setGaze(nx, ny) {
    gazeTX = Math.max(-1, Math.min(1, nx));
    gazeTY = Math.max(-1, Math.min(1, ny));
  }
  // Blink: the aliveness heartbeat. Suppressed at high charge (it STARES
  // while winding up — the not-blinking is itself a tell) and while dying
  // (the final slow close is its own beat, driven by dyingK below).
  let blinkT = 0;
  const BLINK_DUR = 0.22;
  let nextBlink = 2.5 + Math.random() * 3.5;
  // Notice beat: fired once by the controller as the fight opens — pupils
  // snap to pinpoints, brows slam to anger, a brief recoil. Being NOTICED by
  // a giant face is the best free character moment there is.
  let noticeT = 0;
  function notice() { noticeT = 0.9; blinkT = 0; nextBlink = 1.6; }
  // Hit flinch: brows flash to PAIN and the rig recoils — "it can feel" is
  // the empathy switch. Piggybacks on the controller's existing flash calls.
  let painT = 0;
  function flinchFlash(amt) { if (amt > 0.3) painT = Math.max(painT, 0.35); kit.flash(amt); }
  // Death with emotion, not explosion: wrap the kit dissolve so the mask
  // dies mournfully — sorrow brows, eyes easing shut over the sky-holes, jaw
  // falling slack, halo spin winding down. Mournful deaths generate fan art.
  let dyingK = 0;
  function setDissolveEmotive(k) { dyingK = Math.max(0, Math.min(1, k)); kit.setDissolve(k); }

  const ACCENT_COLOR = new THREE.Color(accent);
  const DANGER_COLOR = new THREE.Color(0xff2b6a);   // danger role-colour (never per-boss) — matches the legacy throat idiom
  const _throatColor = new THREE.Color();

  function tickBody(dt, time) {
    // Idle breath-bob: a slow vertical drift so the mask never sits dead
    // still even with no attack in progress (one of the ≥2 idle frequencies).
    rig.position.y = Math.sin(time * 0.45) * 0.15;

    // Halo arcs counter-rotate at different rates — two independent pieces
    // of debris, not one wheel — and NEVER re-form a full ring. In death the
    // spin winds down with the dissolve: the halo dies with it.
    haloA.rotation.z += dt * 0.18 * (1 - dyingK);
    haloB.rotation.z -= dt * 0.30 * (1 - dyingK);

    // --- Gaze: lagged pursuit of the fed target, with deliberate wander ---
    nextLookAway -= dt;
    if (lookAwayT > 0) lookAwayT -= dt;
    else if (nextLookAway <= 0 && charge < 0.2 && noticeT <= 0 && dyingK <= 0) {
      lookAwayT = 0.7 + Math.random() * 0.6;
      lookAwayX = (Math.random() - 0.5) * 1.6;
      lookAwayY = Math.random() * 0.7 - 0.2;
      nextLookAway = 4 + Math.random() * 5;
    }
    const gx = lookAwayT > 0 ? lookAwayX : gazeTX;
    const gy = lookAwayT > 0 ? lookAwayY : gazeTY;
    const gLag = (noticeT > 0 || charge > 0.5) ? 10 : 3.5;   // it LOCKS ON when it means it
    gazeX += (gx - gazeX) * Math.min(1, dt * gLag);
    gazeY += (gy - gazeY) * Math.min(1, dt * gLag);
    for (const p of pupils) p.position.set(p.userData.sx * 1.30 + gazeX * 0.20, gazeY * 0.15, 0.48);

    // --- Blink (triangle 1→0→1) + the dying slow-close ---
    if (blinkT > 0) blinkT -= dt;
    else {
      nextBlink -= dt;
      if (nextBlink <= 0 && charge < 0.5 && dyingK <= 0) { blinkT = BLINK_DUR; nextBlink = 2.5 + Math.random() * 3.5; }
    }
    const blinkK = blinkT > 0 ? Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 1;
    const deathLid = 1 - dyingK * 0.95;
    eyeGroup.scale.y = Math.max(0.05, Math.min(blinkK, deathLid));

    // --- Brow expression (priority: death sorrow > hit pain > notice anger >
    // shield strain > charge anger > resting glare) ---
    if (painT > 0) painT -= dt;
    if (noticeT > 0) noticeT -= dt;
    let browP = 0;   // added slant: negative = angrier (steeper), positive → inner-up pain / outer-collapse sorrow
    if (dyingK > 0) browP = 0.55 * Math.min(1, dyingK * 2.5);
    else if (painT > 0) browP = 0.30 * (painT / 0.35);
    else if (noticeT > 0) browP = -0.28;
    else browP = shieldClamp ? -0.10 : -0.22 * charge;
    for (const b of browPivots) {
      const target = b.userData.sx * (BROW_BASE + browP);
      b.rotation.z += (target - b.rotation.z) * Math.min(1, dt * 9);
    }

    // --- Pupils: pinpoint at notice/charge (a free attack tell — pinpoint =
    // rage in every animal), blown wide in death. ---
    const pupilTarget = dyingK > 0 ? 1.5 : (noticeT > 0 ? 0.5 : 1 - charge * 0.45);
    for (const p of pupils) {
      const s = p.scale.x + (pupilTarget - p.scale.x) * Math.min(1, dt * 8);
      p.scale.setScalar(Math.max(0.01, s));
    }

    // --- Flinch/notice recoil: a local z-nudge on the rig (placeGroup owns
    // the world position; this rides under it). ---
    const recoil = (painT > 0 ? painT / 0.35 : 0) * 0.3 + (noticeT > 0.6 ? (noticeT - 0.6) / 0.3 : 0) * 0.2;
    rig.position.z = -recoil;

    // Eye flicker: two frequencies (slow ember + fast spark) so it never
    // reads as a metronome; charging brightens further; a raised shield
    // clamps the eyes down to a leashed ~0.5 regardless of charge/flicker;
    // death lets the ember gutter down as the lids close.
    const flicker = 0.85 + Math.sin(time * 4.2) * 0.1 + Math.sin(time * 13) * 0.04;
    let eyeK = shieldClamp ? 0.5 : flicker * (1 + charge * 0.3);
    if (noticeT > 0) eyeK *= 1.25;
    eyeK *= 1 - dyingK * 0.4;
    // EYE_HOT overdrive keeps the ember >1.0 linear (bloom threshold) at all
    // idle flicker values; the shield clamp (0.5 × 2.4 = 1.2) stays just at
    // the bloom edge — leashed, visibly dimmer, but never a dead gray dot.
    eyeMat.color.copy(EYE_BASE).multiplyScalar(eyeK * EYE_HOT);

    // Crack-seam shimmer (idle, its own frequency) + a shield-strain brighten.
    seamMat.opacity = (0.35 + Math.sin(time * 1.1) * 0.12) + (shieldClamp ? 0.3 : 0);

    // JAW TELEGRAPH: hinges OPEN as charge rises — a silhouette change, not
    // just a colour flare, per the design brief. Clamped shut while shielded
    // so "wide open mouth" never coincides with "currently invulnerable".
    // In death it falls SLACK — the mournful open, not the threat open.
    const jawTarget = dyingK > 0
      ? -0.35 * Math.min(1, dyingK * 3)
      : (shieldClamp ? 0 : -charge * 0.62);
    const tremble = (!shieldClamp && dyingK <= 0 && charge > 0.6) ? Math.sin(time * 18) * 0.02 * charge : 0;
    jawPivot.rotation.x += (jawTarget + tremble - jawPivot.rotation.x) * Math.min(1, dt * 10);

    // Throat: dark/invisible at rest (hidden behind the closed jaw anyway),
    // floods accent→danger-magenta and swells into view as the charge nears
    // release. Held dark while shielded (nothing to telegraph).
    throatMat.opacity = shieldClamp ? 0 : charge;
    _throatColor.copy(ACCENT_COLOR).lerp(DANGER_COLOR, charge);
    throatMat.color.copy(_throatColor);

    // Backlight disc: a slow idle-only pulse, deliberately NOT driven by
    // charge (round-4 directive 5 — "remove any shell/global flare in
    // setCharge"; the jaw hinge + throat colour are the only charge tells so
    // the mask stays dark and the eyes stay the brightest thing on screen).
    glowDiscMat.opacity = 0.30 + Math.sin(time * 0.8) * 0.05;

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
    setDissolve: setDissolveEmotive,   // kit dissolve + the mournful-death expression ramp
    setCharge,
    setGaze,                           // optional charisma hooks — controller calls with ?.
    notice,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: flinchFlash,                // kit flash + the brow-pain flinch
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
