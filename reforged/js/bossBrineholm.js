import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// BRINEHOLM — "The Island That Breathes" (BOSS-DESIGN.md §5b/§5d slot 8, a Tier-3
// CALAMITY, the band's RELIEF texture — a breather after THRUMSWARM's pressure).
// A bottom-anchored leviathan: only a whale-back RIDGE, its FIN-SAILS, and one
// surfacing arena-sized EYE ever break the frame. The SotC first-colossus scale
// read — its size IS that it never fully fits the screen (L140/L141: presence is
// span × lit-edge area; this boss's span genuinely EXCEEDS the frame). It is
// SHACKLED, not hostile, and it HESITATES before dying (the §5c relationship beat).
//
// SILHOUETTE-FIRST (§3.1): one sentence — "an island-sized kelp-black ridge
// spanning the frame bottom, one pale eye surfacing along its back." A single
// long low-facet hull lying across the bottom of the frame (~24 local units,
// 8 radial facets), four tapered FIN-SAILS rising/falling on the swells, the
// heavy-lidded EYE that surfaces for the weak-point window, and broken SHACKLE
// POSTS with snapped chain along the ridge (it was BOUND). Distinct from every
// prior slot: not a mask (1), a ring-eye (2), a raptor (3), a skeleton (4),
// twin darts (5), an arch (6), or a swarm (7) — a horizon-anchored leviathan.
//
// THE EYE (§4b, the carrier + the fight): a heavy stone LID grinds up to reveal a
// pale HDR hemisphere + an abalone iris ring, then grinds shut. CHIP DAMAGE ONLY
// LANDS WHILE THE EYE IS UP — the surfacing IS the turn-taking tell (§5f law 5):
// eye up = weak-point exposed, eye down = leviathan submerged/invulnerable. The
// white eye is THE one focal (§3.2); nothing else in the body reaches its value.
//
// PALETTE (registry slot 8): KELP-BLACK hull 0x0c1210 (a true DARK boss — §3.3
// holds, no pale sanction) with ABALONE 2-TONE emissive BANDING running the
// length of the flank (the identity accent — iridescent sheen: a sea-green
// dominant + a nacre-violet second tone). The banding is the LIT-EDGE area that
// sells the near-black hull on every sky (L140: below ~15u of visible mass the
// identity lives on the emitting edge — here the hull is huge, but the banding
// is still what reads at fight distance on the sunset-gold backdrop). The eye is
// pale-white (the one focal). No accent pixel enters danger-magenta (327–357°).
//
// THE SCAR (§3.6, one asymmetric break): the bow bears ONE snapped shackle fused
// into the hull — a torn iron ring + a raw pale gouge where a chain wrenched free
// (the lore hook: "Same forge as the hunter's chains" — the unseen chain-maker,
// tying to ASHTALON; §5b lore web — point, never answer). Everything else on the
// ridge is mirror-symmetric relief.
//
// FACELESS-CARRIER LAW (§4b) — seven channels behind the unchanged hooks:
//   GAZE   — while surfaced, the iris eases toward the player (a slow tide, never
//            the continuous stick-track that is slot 14's claim),
//   BLINK  — the heavy lid dips a beat (the leviathan half-closes),
//   CHARGE — the fin-sails FLARE up on their pivots and the eye grinds fully
//            open as the swell winds up (the telegraph changes the SILHOUETTE),
//   EXPRESSION — how many sails are raised + how open the lid sits = the mood
//            (submerged calm / breathing / straining against the chains),
//   FLINCH — the whole hull heaves and the banding shivers (a struck leviathan),
//   NOTICE — the lid GRINDS open once and the iris LOCKS on you (the §5j settle),
//   DEATH  — it does not explode: the sails fold, the eye eases shut, the banding
//            dims to a last tidal glow and the hull SETTLES back beneath the fog
//            (mournful — the bound thing is finally let go; the hesitation beat).
//
// DESTRUCTIBLE SHACKLE POSTS (§5f CAVE law — mercy as a mechanic): the shackle
// posts are individually breakable (reuses slot 6's per-part hit test). Parry a
// post's amber strain-volley 3× — or land shots on it — and it SNAPS, venting a
// pink SPRAY-SOAK graze beat, and each post freed EARLY softens phase 3 (the
// leviathan strains less). crackShackle() is the per-part target; the model owns
// the visual. The choice is legible: breaking a post visibly vents + unbinds it.
//
// CONTRACT: boss.js stomps `group.rotation` every frame (placeGroup) and
// `kit.setDissolve` owns `group.scale` — every animated part lives on `rig`, the
// finPivots, the eyeLidPivot, the shacklePivots, or the drift orbiters; never on
// `group` itself.

export function buildBrineholm(def, quality = 1) {
  const accent = def.accent ?? 0x3ad0b0;   // abalone sea-green — the dominant banding tone (identity hue)
  const accent2 = 0x7d7ad8;                 // nacre-violet — the second banding tone (the iridescent shift)
  const glow = def.glow ?? 0xbfe6dd;        // pale abalone-white (shield rim / shards / eye backlight)
  const lowQ = quality < 0.75;
  const strip = stripForMerge;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (v) => clamp(v, 0, 1);
  const _white = new THREE.Color(0xffffff);

  // The shield wraps the WEAK POINT — the surfacing eye (focal = weak point,
  // Zelda grammar). The eye sits high on the bow flank; the bubble centres on it.
  // hpBarScale counters the big def.scale so the bar stays at roster width, and
  // hpBarY clears the tallest raised fin-sail.
  const kit = createBossCommon(def, quality, {
    shieldRadius: 5.4, shieldY: 3.0, hpBarY: 7.6, hpBarZ: 2.2, hpBarScale: 0.62,
    // The focal (the eye) sits INSIDE the bubble — leash the rim so it never
    // out-glows the eye (§3.2; the dark faceted cage still reads the shield).
    shieldRimStrength: 0.32, shieldCageOpacity: 0.34,
  });
  const { group, track } = kit;
  group.userData.archetype = 'brineholm';   // guards the legacy-fallback coexist path

  const rig = new THREE.Group();
  group.add(rig);

  const mergeBh = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildBrineholm: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ==================================================================
  // MATERIALS — painted value tiers on KELP-BLACK (§3.4: the sun sits AHEAD, so
  // the front face gets no directional shading; the value hierarchy is authored
  // in the materials, not trusted to lighting). The emissive FLOOR keeps the
  // hull from crushing to a flat black sticker under bloom/ACES (the L105 rule).
  // ==================================================================
  const hullDarkMat = track(new THREE.MeshStandardMaterial({
    color: 0x0c1210, emissive: 0x0a1512, emissiveIntensity: 0.10, roughness: 0.92, metalness: 0.05, flatShading: true,
  }));
  // The upper back / spine one value-step up — reads the arch of the ridge as a
  // lit crest against the fog line rather than one flat black mass (§3.4).
  const hullBackMat = track(new THREE.MeshStandardMaterial({
    color: 0x16211e, emissive: 0x14231f, emissiveIntensity: 0.14, roughness: 0.9, metalness: 0.05, flatShading: true,
  }));
  // The wet lower flank — the darkest tier (the waterline; barnacle relief recesses).
  const hullDeepMat = track(new THREE.MeshStandardMaterial({
    color: 0x070c0b, emissive: 0x060f0d, emissiveIntensity: 0.05, roughness: 0.95, metalness: 0.04, flatShading: true,
  }));
  // ABALONE BANDING — the identity accent. Two emissive tones on near-black glass
  // running the flank; these are the LIT area that carries the read on every sky
  // (kept emissive-on-standard, NOT an additive shell — the overdraw law, L124).
  const bandAMat = track(new THREE.MeshStandardMaterial({
    color: 0x08110f, emissive: accent, emissiveIntensity: 0.85, roughness: 0.55, metalness: 0.0, flatShading: true,
  }));
  const bandBMat = track(new THREE.MeshStandardMaterial({
    color: 0x0a0a14, emissive: accent2, emissiveIntensity: 0.55, roughness: 0.55, metalness: 0.0, flatShading: true,
  }));
  // FIN-SAIL membrane — kelp-black with an abalone-lit trailing edge (built in).
  const sailMat = track(new THREE.MeshStandardMaterial({
    color: 0x0b1513, emissive: 0x0c1a17, emissiveIntensity: 0.16, roughness: 0.8, metalness: 0.05, flatShading: true, side: THREE.DoubleSide,
  }));
  const sailEdgeMat = track(new THREE.MeshStandardMaterial({
    color: 0x09110f, emissive: accent, emissiveIntensity: 0.7, roughness: 0.5, metalness: 0.0, flatShading: true, side: THREE.DoubleSide,
  }));
  // Bound iron — the shackle posts + chain (the darkest hard tier, a cold metal).
  const ironMat = track(new THREE.MeshStandardMaterial({
    color: 0x1a1c20, emissive: 0x101216, emissiveIntensity: 0.05, roughness: 0.55, metalness: 0.55, flatShading: true,
  }));
  // The dark EDGE CAGE — the leading that keeps the faceted hull from reading as
  // a smooth blob at fight distance (the seams between hull plates).
  const cageMat = track(new THREE.LineBasicMaterial({
    color: 0x040807, transparent: true, opacity: 0.9, depthWrite: false,
  }));

  // THE EYE — the focal (§3.2), built with real EYE ANATOMY so it reads as an eye,
  // not a sun: a dark SOCKET POOL (the dread seat, L130) → an abalone IRIS RING (the
  // identity ring) → a dark PUPIL → a tiny offset CATCHLIGHT glint that alone carries
  // the G1 ≥250 pinpoint (a focal peak is scalar × SIZE × unoccluded-proudness, L142 —
  // small + proud, so it's a glint, not a wash). The pale sclera glows CONTAINED (a
  // dread whale-eye, not a searchlight). All eye emissives toneMapped=false so the read
  // survives the no-postfx fallback (L125 law 4); opaque (NOT additive) so they bloom
  // without counting toward the §2 overdraw budget (G7).
  const EYE_HOT = 1.35, CORE_HOT = 13.0;
  const EYE_BASE = new THREE.Color(0xd8efe8);   // pale abalone-white sclera (a contained glow)
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xd8efe8 }));
  eyeMat.toneMapped = false;
  eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const eyeCoreMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  eyeCoreMat.toneMapped = false;
  eyeCoreMat.color.setScalar(CORE_HOT);
  // The abalone IRIS RING — the identity annulus framing the pupil (brighter than
  // the sclera so the sheen ring reads; it LOCKS to a fixed angle at notice/settle).
  const irisMat = track(new THREE.MeshStandardMaterial({
    color: 0x0a1512, emissive: accent, emissiveIntensity: 1.5, roughness: 0.4, metalness: 0.1, flatShading: true,
  }));
  // The dark PUPIL — a near-black disc at the eye's centre (the dread; the eye is
  // not pupil-less light). Sits proud of the sclera so it isn't washed by its bloom.
  const pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x03110e }));

  // ==================================================================
  // GEOMETRY — local units; def.scale (≈1.5) turns them into arena presence.
  // The HULL long axis is X (it lies ACROSS the frame bottom); it faces the
  // player on +Z. HULL_LEN 24 → world ~36 at scale 1.5 (exceeds the ~34-wide
  // portrait envelope at rel 30 — the "never fits the frame" presence claim,
  // the load-bearing number for this boss). The eye + sails rise on +Y.
  // ==================================================================
  const HULL_LEN = 24;                 // full length along X (−12 … +12)
  const HULL_HALF = HULL_LEN / 2;
  const RADIAL = 8;                    // 8 radial facets (the sheet spec)
  const LONG_SEG = lowQ ? 12 : 20;     // length segments (the arch of the back)
  const EYE_X = 3.6;                   // the eye surfaces on the bow third (off-centre)
  const EYE_Y = 3.1, EYE_Z = 3.1;      // high on the front flank, PROUD of the hull flank (~z2.55) toward the player

  // ---- THE HULL: a lofted 8-facet ridge. Built from an 8-radial cylinder along
  // X, then DEFORMED per-vertex into a bottom-anchored whale-back: wider than
  // tall, the top arched (a low crest that peaks toward the bow), the ends
  // tapering to blunt points, the bottom flattened (the waterline). Split into
  // three value tiers by facet-ring band so the ridge reads as a carved arch,
  // not a smooth log (§3.4). ONE draw per tier.
  const profileR = (tx) => {           // radius profile along X (tx ∈ −1..1): blunt-tapered, fuller at the bow
    const t = clamp(tx, -1, 1);
    const taper = Math.pow(1 - t * t, 0.42);           // fuller mid, tapering to the ends
    const bow = 1 + Math.max(0, t) * 0.18;             // the bow (+X) sits a touch fuller (the head)
    return taper * bow;
  };
  const archY = (tx) => Math.sin((clamp(tx, -1, 1) * 0.5 + 0.5) * Math.PI) * 1.2 + Math.max(0, tx) * 0.5;  // the crest of the back

  function hullTierGeos() {
    // Build a raw 8×LONG cylinder along Y, then rotate to X and deform.
    const base = new THREE.CylinderGeometry(2.6, 2.6, HULL_LEN, RADIAL, LONG_SEG, false);
    base.rotateZ(Math.PI / 2);                 // long axis → X
    const pos = base.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const tx = v.x / HULL_HALF;              // −1..1 along the length
      const pr = profileR(tx);
      // cross-section angle (around X): flatten the bottom, widen the sides.
      const ang = Math.atan2(v.y, v.z);        // 0 = +Z (toward player), ±π = −Z
      let ry = v.y, rz = v.z;
      // widen Z (flank breadth), keep Y lower (a ridge wider than tall).
      rz *= 1.35 * pr;
      ry *= 0.82 * pr;
      // flatten the belly: pull the bottom vertices up toward the waterline.
      if (ry < 0) ry *= 0.55;
      // arch the top crest along the length.
      const top = clamp((ry) / 2.4, 0, 1);
      v.y = ry + archY(tx) * top;
      v.z = rz;
      // bank the whole ridge so its lit flank faces the +Z camera a touch.
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    base.computeVertexNormals();
    base.deleteAttribute('uv');
    const g = strip(base);
    // Split by vertex height into deep / dark / back tiers — one geo each. We
    // clone-and-mask by dropping triangles into per-tier arrays via a Y test on
    // the triangle centroid (non-indexed after strip, so 3 verts per tri).
    const src = g.attributes.position;
    const tierArr = { deep: [], dark: [], back: [] };
    for (let i = 0; i < src.count; i += 3) {
      const y0 = src.getY(i), y1 = src.getY(i + 1), y2 = src.getY(i + 2);
      const cy = (y0 + y1 + y2) / 3;
      const tier = cy < -0.4 ? 'deep' : cy < 1.2 ? 'dark' : 'back';
      for (let k = 0; k < 3; k++) tierArr[tier].push(i + k);
    }
    const sub = (idxs) => {
      const geo = new THREE.BufferGeometry();
      const arr = new Float32Array(idxs.length * 3);
      const nrm = new Float32Array(idxs.length * 3);
      const nsrc = g.attributes.normal;
      for (let j = 0; j < idxs.length; j++) {
        const i = idxs[j];
        arr[j * 3] = src.getX(i); arr[j * 3 + 1] = src.getY(i); arr[j * 3 + 2] = src.getZ(i);
        nrm[j * 3] = nsrc.getX(i); nrm[j * 3 + 1] = nsrc.getY(i); nrm[j * 3 + 2] = nsrc.getZ(i);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
      return geo;
    };
    return { deep: sub(tierArr.deep), dark: sub(tierArr.dark), back: sub(tierArr.back), full: g };
  }
  const hullTiers = hullTierGeos();
  const hullDeep = new THREE.Mesh(hullTiers.deep, hullDeepMat);
  hullDeep.name = 'brineHull';
  const hullDark = new THREE.Mesh(hullTiers.dark, hullDarkMat);
  const hullBack = new THREE.Mesh(hullTiers.back, hullBackMat);
  rig.add(hullDeep, hullDark, hullBack);

  // ---- HULL RELIEF (§3.6: authored, mirrored — symmetry reads as intent). Rows
  // of barnacle-clump studs + plate-seam ridges along the flank, spending the
  // Calamity tri surplus (§5g) on carved density, not filler. Mirrored L/R.
  const reliefParts = [];
  const N_CLUMP = lowQ ? 5 : 9;
  for (let i = 0; i < N_CLUMP; i++) {
    const tx = -0.82 + (i / (N_CLUMP - 1)) * 1.64;
    const x = tx * HULL_HALF;
    const pr = profileR(tx);
    for (const sz of [1, -1]) {   // both flanks (mirror)
      const c = strip(new THREE.ConeGeometry(0.28 + (i % 3) * 0.06, 0.5, 5));
      c.rotateX(Math.PI / 2 * sz * 0.6);
      c.translate(x, -0.2 + (i % 2) * 0.5, sz * (2.9 * pr));
      reliefParts.push(c);
    }
  }
  // Plate-seam ridges: shallow bars girdling the hull at intervals (the vertebral
  // banding of the back), dark tier.
  for (let i = 0; i < (lowQ ? 3 : 5); i++) {
    const tx = -0.7 + (i / (lowQ ? 3 : 5)) * 1.4;
    const seam = strip(new THREE.TorusGeometry(2.4 * profileR(tx), 0.12, 4, RADIAL));
    seam.rotateY(Math.PI / 2);
    seam.scale(1, 0.8, 1.35);
    seam.translate(tx * HULL_HALF, 0.2, 0);
    reliefParts.push(seam);
  }
  const relief = new THREE.Mesh(mergeBh(reliefParts, 'relief'), hullDeepMat);
  relief.name = 'hullRelief';
  rig.add(relief);

  // ---- ABALONE BANDING (the identity, §5d) — the iridescent SHEEN. The main
  // waterline runs the full length as ALTERNATING segments of sea-green and
  // nacre-violet (a genuine 2-TONE shimmer, not one flat teal line — CP1 gate
  // concern 3), 2 green : 1 violet so the sea-green stays G3-dominant. A second
  // dimmer green line lower on the flank doubles the lit-edge area (the read that
  // sells the near-black hull on all three skies, L140). Emissive-on-standard,
  // NOT an additive shell (the overdraw law, L124).
  function bandSegs(y, pick, label) {
    const parts = [];
    const segs = lowQ ? 16 : 26;
    for (let i = 0; i < segs; i++) {
      if (!pick(i)) continue;
      const tx = -0.9 + (i / (segs - 1)) * 1.8;
      const pr = profileR(tx);
      const seg = strip(new THREE.BoxGeometry(HULL_LEN / segs * 1.02, 0.34, 0.22));
      seg.translate(tx * HULL_HALF, y + archY(tx) * clamp(y / 2.4, 0, 1) * 0.5, 2.55 * pr);
      parts.push(seg);
    }
    return mergeBh(parts, label);
  }
  // main waterline: 2/3 sea-green + 1/3 nacre-violet, interleaved (the shimmer).
  const bandA = new THREE.Mesh(bandSegs(1.5, (i) => i % 3 !== 2, 'bandGreen'), bandAMat);
  bandA.name = 'abaloneBandA';
  const bandV = new THREE.Mesh(bandSegs(1.5, (i) => i % 3 === 2, 'bandViolet'), bandBMat);
  bandV.name = 'abaloneBandV';
  // second lower line: sparser sea-green (more lit edge, same tone family).
  const bandB = new THREE.Mesh(bandSegs(0.4, (i) => i % 2 === 0, 'bandLower'), bandAMat);
  bandB.name = 'abaloneBandB';
  rig.add(bandA, bandV, bandB);

  // ---- THE FIN-SAILS (4, on named pivots): tapered flat blades rising from the
  // crest of the back at intervals, each on its own pivot so they RISE/FALL on
  // the swell (idle) and FLARE up on the charge telegraph (§3.5 silhouette
  // change — the named-pivot gate finds finPivot0..3). Kelp-black membrane with
  // an abalone-lit trailing edge built in.
  function sailShape(h, w) {
    const s = new THREE.Shape();
    s.moveTo(-w * 0.5, 0);
    s.lineTo(w * 0.5, 0);
    s.lineTo(w * 0.18, h * 0.7);
    s.lineTo(-w * 0.1, h);          // swept-back tip
    s.lineTo(-w * 0.5, h * 0.55);
    s.closePath();
    return s;
  }
  const SAIL_X = [-7.4, -2.6, 2.2, 7.0];
  const SAIL_H = [2.6, 3.6, 4.2, 3.0];
  const SAIL_W = [2.4, 3.0, 3.2, 2.6];
  const finPivots = [];
  for (let i = 0; i < 4; i++) {
    const pivot = new THREE.Group();
    pivot.name = `finPivot${i}`;
    const tx = SAIL_X[i] / HULL_HALF;
    pivot.position.set(SAIL_X[i], 1.4 + archY(tx) * 0.5, 0.1);
    // membrane
    const geo = strip(new THREE.ExtrudeGeometry(sailShape(SAIL_H[i], SAIL_W[i]), {
      depth: 0.16, bevelEnabled: false, steps: 1,
    }));
    geo.translate(0, 0, -0.08);
    const sail = new THREE.Mesh(geo, sailMat);
    sail.name = `finSail${i}`;
    pivot.add(sail);
    // lit trailing edge — a thin blade hugging the swept-back edge
    const edge = strip(new THREE.BoxGeometry(0.14, SAIL_H[i] * 1.02, 0.2));
    edge.translate(-SAIL_W[i] * 0.28, SAIL_H[i] * 0.5, 0.02);
    edge.rotateZ(0.16);
    const edgeMesh = new THREE.Mesh(edge, sailEdgeMat);
    pivot.add(edgeMesh);
    rig.add(pivot);
    finPivots.push(pivot);
  }

  // ---- THE EYE ASSEMBLY. A heavy stone LID (on eyeLidPivot) grinds up to reveal
  // a dark SOCKET POOL (so the eye reads dreadful, never googly — L130), the pale
  // HDR hemisphere, its ultra-hot core, and the abalone iris ring that LOCKS.
  const eyeRig = new THREE.Group();
  eyeRig.name = 'eyeRig';
  eyeRig.position.set(EYE_X, EYE_Y, EYE_Z);
  rig.add(eyeRig);
  // the dark SOCKET POOL — a flat near-black disc set just BEHIND the eye (the
  // dread seat, L130: a bright eye in a dark socket reads dreadful, not googly).
  const socket = new THREE.Mesh(new THREE.CircleGeometry(1.55, lowQ ? 16 : 24), hullDeepMat);
  socket.name = 'eyeSocket';
  socket.position.z = -0.05;
  eyeRig.add(socket);
  // the pale SCLERA — a shallow domed LENS (a flattened sphere), NOT a deep
  // hemisphere: a deep dome's front surface occludes the anatomy behind it, so the
  // sclera is baked flat in z (front pole ~z0.66) and the iris/pupil/catchlight all
  // sit clearly PROUD of it (a contained glow — an eye, not a searchlight).
  const sclGeo = new THREE.SphereGeometry(1.2, 20, 16);
  sclGeo.scale(1, 1, 0.34);                    // flatten front-back into a lens
  const eyeball = new THREE.Mesh(sclGeo, eyeMat);
  eyeball.name = 'brineEye';
  eyeball.position.z = 0.25;
  eyeRig.add(eyeball);
  // the abalone IRIS RING — a bold sheen annulus, proud of the lens (the identity
  // ring; LOCKS at notice/settle).
  const iris = new THREE.Mesh(strip(new THREE.TorusGeometry(0.92, 0.24, 8, lowQ ? 16 : 24)), irisMat);
  iris.name = 'brineIris';
  iris.position.z = 0.7;
  eyeRig.add(iris);
  // the dark PUPIL — a near-black disc inside the iris ring, proud of the sclera
  // (the dread; the eye is not pupil-less light).
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.62, lowQ ? 14 : 20), pupilMat);
  pupil.name = 'brinePupil';
  pupil.position.z = 0.78;
  pupil.renderOrder = 5;
  eyeRig.add(pupil);
  // the CATCHLIGHT glint — a tiny ultra-hot pinpoint offset up-left on the pupil,
  // seated FRONTMOST so nothing occludes it (the G1 ≥250 peak; small = a glint, L142).
  const eyeCore = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), eyeCoreMat);
  eyeCore.name = 'eyeCore';
  eyeCore.position.set(-0.26, 0.28, 0.98);
  eyeCore.renderOrder = 7;
  eyeRig.add(eyeCore);
  // THE HEAVY STONE LID — a thick cowl on eyeLidPivot, hinged ABOVE the eye and
  // seated PROUD (in front of the eye) so when CLOSED it occludes the eye
  // (submerged = invulnerable) and when it lifts (+rot.x → up AND back) it clears
  // the front cleanly, reading as a heavy hooded brow (never a floating slab).
  const eyeLidPivot = new THREE.Group();
  eyeLidPivot.name = 'eyeLidPivot';
  eyeLidPivot.position.set(0, 1.6, 1.15);     // hinges above the eye, at the eye's proud depth
  const lidParts = [];
  // the cowl slab — hangs DOWN from the hinge to cover the eye front, faceted
  const lid = strip(new THREE.BoxGeometry(3.2, 2.8, 0.5));
  lid.translate(0, -1.3, 0);                   // hang below the hinge, over the eye
  lidParts.push(lid);
  // a heavy carved brow ridge along the lid's leading edge (§3.4 weight)
  const brow = strip(new THREE.BoxGeometry(3.5, 0.5, 0.8));
  brow.translate(0, -0.1, 0.3);
  lidParts.push(brow);
  // a shallow chamfer so the closed lid reads as a curved stone eyelid, not a box
  const chamfer = strip(new THREE.BoxGeometry(2.6, 0.7, 0.5));
  chamfer.rotateX(0.4);
  chamfer.translate(0, -2.55, 0.12);
  lidParts.push(chamfer);
  const lidMesh = new THREE.Mesh(mergeBh(lidParts, 'eyelid'), hullBackMat);
  lidMesh.name = 'eyeLid';
  eyeLidPivot.add(lidMesh);
  eyeRig.add(eyeLidPivot);

  // ---- THE SHACKLE POSTS (3, destructible — §5f mercy mechanic). Broken iron
  // posts rising from the back, each with a snapped chain torus + a bound ring,
  // on named shacklePivots (they STRAIN — a small wobble — as the amber volley
  // charges). Parry the strain 3× (or shoot it) → the post SNAPS + vents.
  const SHACKLE_X = [-5.2, 0.4, 5.6];
  const shackleRigs = [];
  function buildShacklePost(i, x) {
    const pivot = new THREE.Group();
    pivot.name = `shacklePivot${i}`;
    const tx = x / HULL_HALF;
    pivot.position.set(x, 1.5 + archY(tx) * 0.5, -0.3);
    // the post
    const postParts = [];
    const post = strip(new THREE.CylinderGeometry(0.28, 0.36, 2.4, 6));
    post.translate(0, 1.2, 0);
    postParts.push(post);
    // a bound ring (shackle) near the top
    const ring = strip(new THREE.TorusGeometry(0.5, 0.14, 5, 10));
    ring.rotateX(Math.PI / 2);
    ring.translate(0, 2.0, 0.2);
    postParts.push(ring);
    const postMesh = new THREE.Mesh(mergeBh(postParts, `shacklePost${i}`), ironMat);
    postMesh.name = `shacklePost${i}`;
    pivot.add(postMesh);
    // a snapped chain hanging off it (a few tori) — the "it was BOUND" read
    const chainParts = [];
    for (let c = 0; c < 3; c++) {
      const link = strip(new THREE.TorusGeometry(0.24, 0.08, 4, 8));
      link.rotateX(c % 2 ? Math.PI / 2 : 0);
      link.translate(0.5 + c * 0.02, 2.0 - c * 0.42, 0.3 + c * 0.06);
      chainParts.push(link);
    }
    const chain = new THREE.Mesh(mergeBh(chainParts, `chain${i}`), ironMat);
    chain.name = `shackleChain${i}`;
    pivot.add(chain);
    rig.add(pivot);
    return { pivot, postMesh, chain, x, broken: false, strain: 0 };
  }
  for (let i = 0; i < SHACKLE_X.length; i++) shackleRigs.push(buildShacklePost(i, SHACKLE_X[i]));

  // ---- THE ONE SCAR (§3.6) — a snapped shackle FUSED into the bow, torn free:
  // a broken half-ring of iron + a raw pale gouge in the hull where the chain
  // wrenched out ("Same forge as the hunter's chains" — the ASHTALON lore hook).
  const scarParts = [];
  const scarRing = strip(new THREE.TorusGeometry(0.6, 0.16, 5, 10, Math.PI * 1.25));   // a BROKEN ring (arc < 2π)
  scarRing.rotateX(Math.PI / 2);
  scarRing.rotateZ(0.6);
  scarRing.translate(9.3, 1.6, 1.6);
  scarParts.push(scarRing);
  const scar = new THREE.Mesh(mergeBh(scarParts, 'scar'), ironMat);
  scar.name = 'brineScar';
  rig.add(scar);
  // the raw pale gouge (a lighter-tier gash — the ONE bright-ish break on the dark hull)
  const gougeMat = track(new THREE.MeshStandardMaterial({
    color: 0x2a3a34, emissive: 0x33463f, emissiveIntensity: 0.22, roughness: 0.85, metalness: 0.0, flatShading: true,
  }));
  const gouge = new THREE.Mesh(strip(new THREE.BoxGeometry(1.3, 0.3, 0.25)), gougeMat);
  gouge.name = 'brineGouge';
  gouge.position.set(9.1, 1.2, 2.35);
  gouge.rotation.z = -0.35;
  rig.add(gouge);
  // A freed-shackle VENT material (pale abalone froth glowing where a post tore
  // free — the SPRAY-SOAK graze marker; below eye intensity so the eye stays the
  // one focal, §3.2). Tracked so the dissolve fades it; reused by crackShackle().
  const ventMat = track(new THREE.MeshStandardMaterial({
    color: 0x0a1512, emissive: accent, emissiveIntensity: 1.3, roughness: 0.5, metalness: 0.0, flatShading: true,
  }));

  // ---- THE EDGE CAGE (§5d): EdgesGeometry over the hull tiers + the sails so
  // the faceted ridge keeps its plate seams at fight distance (a dark line-work
  // over the dark hull — the two-way luminance edge).
  for (const [geoSrc, thresh] of [[hullTiers.full, 24], [hullTiers.back, 24]]) {
    const cage = new THREE.LineSegments(new THREE.EdgesGeometry(geoSrc, thresh), cageMat);
    rig.add(cage);
  }

  // ---- DRIFT ORBITERS (the orbiter contract ≥2; §3.8 satellites stay dark):
  // torn kelp fronds riding the swell. Kept LOW and CLOSE to the waterline so they
  // read as kelp on the hull, never dark chips floating in the empty sky around the
  // silhouette (CP1 gate note: floating debris reads as noise / a second scar).
  const kelpGeo = strip(new THREE.BoxGeometry(0.38, 0.13, 0.8));
  const orbiters = [];
  const N_KELP = lowQ ? 2 : 4;
  for (let i = 0; i < N_KELP; i++) {
    const m = new THREE.Mesh(kelpGeo, i % 2 ? hullDeepMat : hullDarkMat);
    m.name = 'driftKelp';
    m.userData = {
      ang: (i / N_KELP) * Math.PI * 2,
      rx: 6.5 + (i % 3) * 1.6, ry: 0.7 + (i % 2) * 0.35,   // tight ellipse hugging the flank
      cy: -0.6 + (i % 2) * 0.5,                            // low on the flank (near the waterline)
      speed: 0.09 + (i % 3) * 0.03,
      bob: 0.5 + (i % 2) * 0.4,
      spin: 0.18 + (i % 3) * 0.12,
    };
    rig.add(m);
    orbiters.push(m);
  }

  // Hit flash rings the abalone banding (a struck leviathan's sheen flares, never
  // toy-colored) — bound to the brighter band tier's resting emissive.
  kit.flashBind(bandAMat, 0.85);
  kit.finalize();

  // ==================================================================
  // ANIMATION — the tidal breathing, the eye weak-point window, the charge
  // flare, the shackle strain/break, the entrance rise, and the mournful death.
  // ==================================================================
  let charge = 0;
  function setCharge(k) { charge = clamp01(k); }
  let tell = null;
  function setAttackTell(id) { tell = id || null; }
  let setpieceK = 0, dreadK = 0;
  function setSetpiece(k, sdef) {
    setpieceK = clamp01(k);
    dreadK = (sdef && sdef.dread) ? setpieceK : 0;   // Sounding (dread): the dive + geysers
  }

  // THE EYE WEAK-POINT WINDOW (§5f law 5 — the turn-taking tell). eyeUp ∈ 0..1:
  // 0 = submerged (lid shut, eye dark, INVULNERABLE); 1 = surfaced (lid up, eye
  // HDR, weak-point exposed — chip damage only lands here). Driven per-phase by
  // the controller (setEyeUp) OR, absent a driver, a slow autonomous tidal cycle
  // so the studio + a legacy path still surface it. `eyeUpTarget` is the intent;
  // `eyeUp` eases toward it (the lid GRINDS, never snaps).
  let eyeUp = 0, eyeUpTarget = 0, eyeAuto = true;
  function setEyeUp(k) { eyeAuto = false; eyeUpTarget = clamp01(k); }
  function eyeIsUp() { return eyeUp > 0.55; }

  // GAZE — while surfaced the iris eases toward the player (a slow tide, NOT the
  // continuous stick-track that is slot 14's claim; capped rate + only when up).
  let gazeTX = 0, gazeTY = 0, irisLock = false;
  function setGaze(nx, ny) { gazeTX = clamp(nx, -1, 1); gazeTY = clamp(ny, -1, 1); }

  // BLINK — the heavy lid dips a beat (only while surfaced).
  const BLINK_DUR = 0.5;
  let blinkT = 0, nextBlink = 5 + Math.random() * 4;
  let noticeT = 0;
  function notice() { noticeT = 1.2; blinkT = 0; irisLock = true; }

  // FLINCH — the hull heaves + the banding shivers (real damage only).
  let painT = 0, painEase = 0;
  function flash(amt) { kit.flash(amt); }
  function hurt(amt) { if (amt > 0.3) painT = Math.max(painT, 0.35); }

  // §5j THE REEF WAS BREATHING — the entrance clock (null = fight). The crest
  // teases on the swell (setEntrance drives the model's rise + the lid grind +
  // the iris lock at settle). The eye stays SUBMERGED through the rise (a pale
  // glow at the bow); the lid grinds and the iris LOCKS once at settle.
  let entranceU = null;
  function setEntrance(u) {
    const was = entranceU != null;
    entranceU = u == null ? null : clamp01(u);
    if (entranceU != null && !was) { eyeAuto = false; eyeUpTarget = 0; irisLock = false; }
  }
  // The entrance script feeds the dragon-shadow steer (unused for gaze — the eye
  // stays locked forward at settle — but kept for parity with the registry shape).
  function setEntranceSteer() { /* the eye does not track during the entrance (§5d) */ }

  // Shield: the eye leashes — the lid grinds shut, the eye damps (G6), the sails
  // lower (the leviathan pulls under while invulnerable).
  let shieldClamp = false;
  kit.onShieldChange((v) => { shieldClamp = v; if (v) { eyeAuto = false; eyeUpTarget = 0; } else eyeAuto = true; });

  // §5f DESTRUCTIBLE SHACKLE POSTS (the CAVE-law mercy mechanic; reuses slot 6's
  // per-part hit test grammar — crack/live/hitTest/count mirror the pane API).
  const brokenShackles = new Set();
  function crackShackle(idx) {
    if (idx == null || idx < 0 || idx >= shackleRigs.length || brokenShackles.has(idx)) return false;
    brokenShackles.add(idx);
    const s = shackleRigs[idx];
    s.broken = true;
    // the post SNAPS at half height and TOPPLES — the top half tips right over and
    // the chain drops free (an unmistakable unbinding, legible at fight distance).
    const dir = (idx % 2 ? 1 : -1);
    // the post SNAPS and topples FORWARD toward the player (over the crest, not
    // behind it), so the broken stub reads front-on, not lost on the ridge back.
    s.postMesh.rotation.set(-0.9, 0, dir * 0.7);
    s.postMesh.scale.y = 0.55;                  // snapped at half height (a broken stub)
    s.postMesh.position.set(dir * 0.5, -0.6, 1.2);
    // the chain DANGLES free forward rather than vanishing (it visibly hangs off)
    s.chain.rotation.z = dir * 0.9;
    s.chain.position.set(dir * 0.4, -0.9, 1.4);
    // a broken JAG stub at the snap line (dark tier — the raw fracture)
    const jag = new THREE.Mesh(strip(new THREE.ConeGeometry(0.34, 0.7, 5)), ironMat);
    jag.position.copy(s.pivot.position);
    jag.position.y += 0.5; jag.position.z += 1.0;
    jag.rotation.z = 0.4;
    jag.name = `shackleJag${idx}`;
    rig.add(jag);
    // the VENT — a tall bright abalone PLUME spraying UP-AND-FORWARD from the torn
    // stump, PROUD of the crest (z forward) so it reads front-on: the SPRAY-SOAK
    // graze beat marker, findable in a glance, still below eye value.
    const ventGroup = new THREE.Group();
    ventGroup.name = `shackleVent${idx}`;
    ventGroup.position.copy(s.pivot.position);
    ventGroup.position.y += 0.3; ventGroup.position.z += 1.6;   // forward of the crest, unoccluded
    for (let v = 0; v < 5; v++) {
      const froth = new THREE.Mesh(strip(new THREE.ConeGeometry(0.36 - v * 0.045, 1.0 + v * 0.4, 6)), ventMat);
      froth.position.set((v - 2) * 0.26, v * 0.62, 0.1);
      froth.rotation.z = (v - 2) * 0.15;
      ventGroup.add(froth);
    }
    rig.add(ventGroup);
    return true;
  }
  function shackleBroken(idx) { return brokenShackles.has(idx); }
  function liveShackles() { const o = []; for (let i = 0; i < shackleRigs.length; i++) if (!brokenShackles.has(i)) o.push(i); return o; }
  function shackleCount() { return shackleRigs.length; }
  function brokenCount() { return brokenShackles.size; }
  // Per-part hit test (the §5f seam): given a hit in the boss's LOCAL x/y frame
  // (world minus the group origin), return the nearest LIVE shackle post, or -1.
  const _sc = def.scale ?? 1.5;
  function shackleHitTest(localX, localY) {
    const wx = localX / _sc, wy = localY / _sc;
    let best = -1, bd = 3.2;   // within ~3.2 local units of a post top
    for (const i of liveShackles()) {
      const s = shackleRigs[i];
      const d = Math.hypot(wx - s.x, wy - (s.pivot.position.y + 2.0));
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  // EMOTIONAL DEATH (§4b): the leviathan does not explode. The sails fold, the
  // eye eases shut, the banding dims to a last tidal glow, and the hull SETTLES
  // back beneath the fog. A mournful OPACITY fade only at the very end. At k=1
  // every material is transparent (the dissolve test).
  let dyingK = 0;
  function setDissolveEmotive(k) {
    dyingK = clamp01(k);
    const a = dyingK < 0.82 ? 1 : Math.max(0, 1 - (dyingK - 0.82) / 0.18);
    for (const m of kit.mats) {
      m.transparent = true;
      const base = m.userData.baseOpacity ?? 1;
      m.opacity = base * a;
      if (m.uniforms && m.uniforms.uOpacity) m.uniforms.uOpacity.value = base * a;
    }
  }

  let eyeGlow = 0;          // eased eye intensity (0..1)
  let irisAngle = 0;        // the iris ring's live angle (locks at notice/settle)
  let gazeEX = 0, gazeEY = 0;   // eased gaze offset (the pupil/iris/catchlight ride it)

  function tickBody(dt, time) {
    // --- TIDAL BREATHING (the slowest idle in the roster, §5i TIDAL DRONE): the
    // hull heaves on a long swell; ≥2 frequencies (§3.7). The flinch rides on top.
    if (painT > 0) painT -= dt;
    painEase += (Math.max(0, painT) - painEase) * Math.min(1, dt * 8);
    const swell = Math.sin(time * 0.32) * 0.5 + Math.sin(time * 0.13) * 0.3;   // the breath
    rig.position.y = swell * 0.4 + painEase * Math.sin(time * 30) * 0.3;
    rig.rotation.z = Math.sin(time * 0.22) * 0.01 + painEase * Math.sin(time * 26) * 0.012;
    rig.rotation.x = Math.sin(time * 0.18) * 0.006;

    // --- THE FIN-SAILS rise/fall on the swell, phase-lagged bow-to-stern (a wave
    // travelling the back), and FLARE up hard on the charge (the §3.5 telegraph).
    const noticeK = noticeT > 0 ? clamp01(noticeT / 0.9) : 0;    // the notice startle envelope
    for (let i = 0; i < finPivots.length; i++) {
      const p = finPivots[i];
      const wave = Math.sin(time * 0.5 - i * 0.7) * 0.5 + 0.5;   // 0..1 travelling swell
      const base = -0.12 + wave * 0.4;                            // idle: standing sails swaying on the swell
      const flare = charge * 1.1 + dreadK * 0.5 + noticeK * 1.0;  // charge/dread/notice-startle raises them
      const submerge = (shieldClamp ? 0.6 : 0) + dyingK * 1.3;    // fold under shield/death
      p.rotation.x = clamp(base - flare + submerge, -1.4, 0.9);
      p.scale.setScalar(clamp(1 - dyingK * 0.5, 0.4, 1));
    }

    // --- THE EYE WEAK-POINT WINDOW. Autonomous tidal surfacing when no driver
    // (studio/legacy): a slow up/down cycle. Charge forces it fully UP (it must
    // be exposed to be hit as it winds up); shield/death force it DOWN.
    if (eyeAuto && entranceU == null && dyingK <= 0) {
      // a slow ~9s tide: up for a spell, then under.
      eyeUpTarget = (Math.sin(time * 0.34) > 0.2) ? 1 : 0;
    }
    if (charge > 0.15 && !shieldClamp && dyingK <= 0 && entranceU == null) eyeUpTarget = 1;
    if (noticeT > 0 && !shieldClamp && dyingK <= 0 && entranceU == null) eyeUpTarget = 1;   // NOTICE snaps the eye UP
    if (shieldClamp || dyingK > 0.05) eyeUpTarget = 0;
    if (entranceU != null) eyeUpTarget = 0;   // stays submerged through the rise (§5d)
    // the lid GRINDS toward the target (never snaps).
    eyeUp += (eyeUpTarget - eyeUp) * Math.min(1, dt * 2.4);

    // blink (only while surfaced + calm)
    if (noticeT > 0) noticeT -= dt;
    if (blinkT > 0) blinkT -= dt;
    else if (eyeUp > 0.6 && entranceU == null && dyingK <= 0 && charge < 0.3) {
      nextBlink -= dt;
      if (nextBlink <= 0 && noticeT <= 0) { blinkT = BLINK_DUR; nextBlink = 5 + Math.random() * 4; }
    }
    const blink = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;

    // the LID position: submerged (eyeUp 0) = shut over the eye; surfaced (1) =
    // lifted to a HOODED brow; NOTICE flings it WIDE (a startle). A blink dips it
    // partway. rotation.x hinges it up-and-back.
    const lidOpen = clamp(eyeUp - blink * 0.6 + noticeK * 0.45, 0, 1.4);
    eyeLidPivot.rotation.x = lidOpen * 1.15;   // 0 = closed over eye, +1.15 = hooded UP-AND-BACK (clears the front)

    // --- THE EYE glow. Bright only while surfaced (the weak-point read); the
    // catchlight carries the G1 peak. Notice flares it; death eases it out; shield
    // damps (G6). The sclera + iris hide entirely while submerged (a dark eye).
    let eyeK = eyeUp;
    if (noticeT > 0.4) eyeK = Math.max(eyeK, 1) * 1.3;
    if (dyingK > 0) eyeK *= Math.max(0, 1 - dyingK * 1.5);
    if (shieldClamp) eyeK *= 0.4;
    eyeK *= (1 - blink * 0.85);
    eyeGlow += (eyeK - eyeGlow) * Math.min(1, dt * 6);
    eyeMat.color.copy(EYE_BASE).multiplyScalar(Math.max(0.02, eyeGlow) * EYE_HOT);
    eyeCoreMat.color.setScalar(CORE_HOT * Math.max(0.015, eyeGlow));
    eyeCore.visible = eyeGlow > 0.25 && dyingK < 0.7;
    pupil.visible = eyeGlow > 0.2;                       // the pupil hides with the submerged eye
    iris.visible = eyeGlow > 0.12;
    irisMat.emissiveIntensity = 0.2 + eyeGlow * 1.5 + noticeK * 1.2;   // the abalone ring reads while surfaced; FLARES on notice
    eyeball.scale.setScalar(1 + Math.sin(time * 1.6) * 0.03 * eyeGlow + dreadK * 0.12);

    // --- THE GAZE. While surfaced + not locked, the pupil/iris/catchlight ease
    // toward the player (a slow tide, capped rate — never the continuous track that
    // is slot 14's claim). At notice/settle the iris LOCKS (no more tracking).
    if (!irisLock && eyeUp > 0.6 && entranceU == null) {
      gazeEX += (gazeTX * 0.55 - gazeEX) * Math.min(1, dt * 1.2);
      gazeEY += (gazeTY * 0.38 - gazeEY) * Math.min(1, dt * 1.2);
    }
    iris.position.set(gazeEX, gazeEY, 0.7);
    pupil.position.set(gazeEX, gazeEY, 0.78);
    eyeCore.position.set(-0.26 + gazeEX, 0.28 + gazeEY, 0.98);
    eyeball.position.set(gazeEX * 0.35, gazeEY * 0.35, 0.25);
    iris.rotation.z = irisLock ? irisAngle : (irisAngle += dt * 0.15);

    // --- THE SHACKLE POSTS. Live posts STRAIN (a small wobble) as an amber
    // volley charges (the parry read tell); broken posts hang slack. Death sinks
    // the whole rig; the strain eases in the mournful settle.
    for (let i = 0; i < shackleRigs.length; i++) {
      const s = shackleRigs[i];
      if (s.broken) { s.pivot.position.y += (-0.6 - (s.pivot.position.y - (1.5 + archY(s.x / HULL_HALF) * 0.5))) * 0; continue; }
      const strain = charge * (tell === 'stream' || tell === 'aimed' ? 1 : 0.5);
      s.strain += (strain - s.strain) * Math.min(1, dt * 5);
      s.pivot.rotation.z = Math.sin(time * (6 + i)) * 0.05 * s.strain;
      s.pivot.rotation.x = Math.sin(time * 0.4 + i) * 0.03 + s.strain * 0.08;
    }

    // --- THE BANDING sheen. A slow iridescent shimmer travelling the flank (the
    // tidal drone made visible); brightens on charge/dread, dims in shield/death.
    const shimmer = 0.85 + Math.sin(time * 0.8) * 0.12 + Math.sin(time * 1.9) * 0.06;
    const bandK = shimmer * (1 + charge * 0.5 + dreadK * 0.8 + noticeK * 1.1) * (shieldClamp ? 0.45 : 1) * (1 - dyingK * 0.7);
    bandAMat.emissiveIntensity = 0.85 * bandK;
    // the nacre-violet segments shimmer on their OWN phase (a counter-beat sheen)
    // so the waterline reads iridescent 2-tone (CP1 gate concern 3).
    bandBMat.emissiveIntensity = 0.78 * (0.9 + Math.sin(time * 0.8 + 1.6) * 0.16) * (1 + charge * 0.4 + noticeK * 1.1) * (shieldClamp ? 0.45 : 1) * (1 - dyingK * 0.7);
    sailEdgeMat.emissiveIntensity = 0.7 * bandK;

    // --- ENTRANCE: the hull INHALES up through the fog (rig.y from deep), the
    // sails unfold bow-to-stern, the banding lights in a wave, the lid grinds and
    // the iris LOCKS once at settle. Driven off entranceU (the script's clock).
    if (entranceU != null) {
      const u = entranceU;
      // the rise: from deep (well below) up to station, easing, with the canon
      // HESITATION — a held segment near u≈0.55 where the ascent pauses (§5d).
      const holdLo = 0.5, holdHi = 0.6;
      let rise;
      if (u < holdLo) rise = Math.pow(u / holdLo, 0.8) * 0.62;
      else if (u < holdHi) rise = 0.62;                                   // THE HESITATION (held)
      else rise = 0.62 + Math.pow((u - holdHi) / (1 - holdHi), 1.4) * 0.38;
      rig.position.y = (rise - 1) * 10;     // −10 (deep) → 0 (station) with the hold
      // sails unfold bow-to-stern across the rise
      for (let i = 0; i < finPivots.length; i++) {
        const unfold = clamp01((u - 0.15 - i * 0.12) / 0.3);
        finPivots[i].rotation.x = -0.5 * unfold - (1 - unfold) * 1.2;
      }
      // banding lights in a travelling wave
      const litFront = u * 1.3;
      bandAMat.emissiveIntensity = 0.85 * clamp01(litFront) ;
      bandBMat.emissiveIntensity = 0.55 * clamp01(litFront - 0.2);
      // the eye stays a submerged pale GLOW at the bow; the lid grinds + iris
      // LOCKS once at settle (u > 0.9).
      eyeGlow = 0.12 + clamp01((u - 0.9) / 0.1) * 0.2;
      eyeMat.color.copy(EYE_BASE).multiplyScalar(eyeGlow * EYE_HOT);
      eyeCoreMat.color.setScalar(CORE_HOT * eyeGlow * 0.4);
      eyeLidPivot.rotation.x = clamp01((u - 0.9) / 0.1) * 0.4;   // a bare grind (up-and-back)
      if (u > 0.94 && !irisLock) { irisLock = true; irisAngle = iris.rotation.z; }
    }

    // --- DREAD: SOUNDING — the dive. The whole hull sinks and pitches (the
    // leviathan sounds); geyser spawns are engine-side (CP2), the body reads the
    // plunge. Overrides the idle swell while the dread setpiece is live.
    if (dreadK > 0.05) {
      rig.position.y = -dreadK * 4.5 + Math.sin(time * 2) * 0.3;
      rig.rotation.x = dreadK * 0.12;
    }

    // --- DRIFT ORBITERS: slow ellipses + a 2nd-frequency bob; they sink in death.
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed * (1 + painEase);
      o.position.set(
        Math.cos(u.ang) * u.rx,
        u.cy + Math.sin(u.ang * 1.4) * u.ry + Math.sin(time * u.bob + u.ang) * 0.3 - dyingK * (5 + u.cy),
        2.1 + Math.sin(u.ang) * 1.3   // hug the flank (z ~0.8..3.4), never floating far in front
      );
      o.rotation.x += dt * u.spin;
      o.rotation.z += dt * u.spin * 0.7;
    }
  }

  // Muzzle: fire originates at the EYE (emitter = organ, §5f law 7; def.muzzle =
  // 'brineMuzzle'). Geyser curtains spawn off-frame below (engine, CP2); the
  // aimed/stream tide emits from the surfaced eye.
  const muzzle = new THREE.Object3D();
  muzzle.name = 'brineMuzzle';
  muzzle.position.set(EYE_X, EYE_Y, EYE_Z + 1.2);
  group.add(muzzle);

  // ---- §7b per-sheet diagnostics (tests/boss.mjs asserts on them). ----
  const sc = def.scale ?? 1.5;
  function hullLength() { return HULL_LEN * sc; }                          // world span (the "never fits" number)
  function eyeSurfaced() { return eyeUp; }                                 // 0 submerged .. 1 surfaced
  function finRaise() { return finPivots.map((p) => p.rotation.x); }
  function shacklePositions() { return shackleRigs.map((s) => s.x * sc); }

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge,
    setAttackTell,
    setSetpiece,
    setGaze,
    notice,
    setEyeUp, eyeIsUp,
    setEntrance, setEntranceSteer,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash, hurt,
    // §5f destructible sub-parts (the per-part hit test target + the queries).
    crackShackle, shackleBroken, liveShackles, shackleCount, brokenCount, shackleHitTest,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    // §7b diagnostics + studio pins (not part of the controller contract).
    hullLength, eyeSurfaced, finRaise, shacklePositions,
    dispose() {
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    },
  };
}
