import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// EITHERWING — "the Broken Whole" (BOSS-DESIGN.md §5b/§5d slot 5, the Tier-2
// COLOSSI PEAK and the roster's ONLY multi-body silhouette). Two mirrored
// dart-wraiths orbiting a SHARED EMBER — one eye passed between them.
//
// SILHOUETTE-FIRST (§3.1): one sentence — "two mirrored dart-wraiths orbiting a
// shared ember — one eye passed between them." Each twin is a stretched kite body
// (the dominant mass) + a crescent head fin + two flowing ribbon tails; between
// them rides ONE eye on a beaded thread. Nothing round about the bodies (no
// socket-pair like 1, no orb like 2, no raptor like 3, no skull like 4) — two
// darts and a single travelling eye.
//
// THE EYE (§5d, the hook): a single HDR orb (full rig — iris ring + pupil, the
// EYE_HOT idiom) that physically DETACHES and glides between the twins along a
// beaded LineSegments thread. WHOEVER HOLDS THE EYE FIRES NEXT — the handoff IS
// the charge tell. The eyeless twin is always the DARKER one (a stranger tells
// holder from seeker instantly). The eye is THE focal (§3.2) — the brightest
// thing in every state, white-hot, toneMapped=false so bloom catches it.
//
// PALETTE (registry slot 5): OXBLOOD 0x7a1c18 — a WARM dark red kept clear of
// danger-magenta (0xff2b6a≈342°) by ~20° so the body can never be confused with a
// bullet (§5d OXBLOOD-MAGENTA collision law; bulletcontrast gate) — carried in the
// EMISSIVE rims only (§3 law 3: identity in emissive, the diffuse near-black); the
// rims + shield read AGED SILVER (the second swatch); the eye is white-hot (<5%).
//
// THE SCAR (§3.6, one asymmetric break): the SEEKER twin (twin B, the darker,
// eyeless-at-idle half) wears a SNAPPED outer ribbon — the "broken" in the Broken
// Whole, the memory hook + lore gap (what broke the pair? → feeds slot 12 ONEWING).
//
// FACELESS/DUO CARRIER LAW (§4b) — the handoff IS the character; the seven channels
// live behind the unchanged setGaze/notice hooks:
//   GAZE   — the HELD eye tracks the player with lag,
//   BLINK  — the eye TUCKS shut into its holder's body for a beat,
//   CHARGE — the eye glides to the firing twin + its pupil constricts (the tell),
//   EXPRESSION — three fin/ribbon poses (open-glide / mantle-charge / furl),
//   FLINCH — the holder recoils while the eyeless twin darts protectively closer,
//   NOTICE — both twins snap to face you and the eye pinpoints,
//   DEATH  — the pair BREAKS: the survivor circles its fallen half twice, takes the
//            eye, and FLEES off-frame (mournful, no explosion — it seeds slot 12).
//
// CONTRACT: boss.js stomps `group.rotation` every frame (placeGroup) and
// `kit.setDissolve` owns `group.scale` — every animated part lives on `rig`, the
// two twin pivots, the ribbon lag-pivots, or the eye rig, never on `group` itself.
// The two bodies share ONE hp pool + one bar (zero hit-model work — the craghold
// precedent, §5d); the muzzle node follows the eye-holder.

export function buildTwinWraith(def, quality = 1) {
  const accent = def.accent ?? 0x7a1c18;   // oxblood — identity lives in the emissive rims
  const glow = def.glow ?? 0xc9c1b4;        // aged silver — rims, shield, shards, backlight
  const lowQ = quality < 0.75;
  const strip = stripForMerge;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const easeK = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);   // easeInOut for entrance beats
  const easeBack = (k) => { const c = 1.70158, p = k - 1; return 1 + (c + 1) * p * p * p + c * p * p; };   // easeOutBack: pops past 1 then settles (the materialise "snap into being")

  // Shield wraps whichever body holds the eye — but the kit bubble is centred on
  // the rig origin (the shared ember the twins orbit); the eye-holder is pulled to
  // centre UNDER the bubble when it raises (see onShieldChange), so the centred
  // bubble reads as wrapping the holder without any hit-model work. hpBarY clears
  // the orbiting twins; hpBarScale keeps the shared bar at roster width.
  const kit = createBossCommon(def, quality, { shieldRadius: 4.4, hpBarY: 5.6, hpBarZ: 1.4, hpBarScale: 0.85, shieldRimStrength: 0.07, shieldCageOpacity: 0.55 });
  const { group, track } = kit;
  group.userData.archetype = 'eitherwing';   // guards the legacy-fallback coexist path (tests/boss.mjs)

  const rig = new THREE.Group();
  group.add(rig);

  const mergeOx = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildTwinWraith: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ---- Painted value tiers (the sun can't shade the front face — §3.4). The body
  // diffuse runs near-black; the oxblood identity lives ONLY in the emissive rim
  // strips + the eye. NEUTRAL-dark diffuse (never a saturated red — that reads as
  // the OXBLOOD-MAGENTA collision the §5d sheet + gate flag). Two body tiers: the
  // HOLDER half sits a value step brighter than the SEEKER half (the §7b twin-value
  // law — a stranger tells them apart instantly; the eye-holder logic swaps the
  // dynamic glow on top so "the eyeless twin is always darker" holds live).
  const bodyHolderMat = track(new THREE.MeshStandardMaterial({
    color: 0x1a1210, emissive: accent, emissiveIntensity: 0.10, roughness: 0.82, metalness: 0.1, flatShading: true,
  }));
  const bodySeekerMat = track(new THREE.MeshStandardMaterial({
    color: 0x0d0908, emissive: accent, emissiveIntensity: 0.06, roughness: 0.85, metalness: 0.1, flatShading: true,
  }));
  // LIT-SILHOUETTE LAW (§5d L140): small mass ⇒ the identity is the EDGE. The oxblood
  // rims WIDEN (0.14 bars) and run the FULL kite perimeter + fin outer edge, at TWO value
  // tiers — the HOLDER's outline burns bright (ei 0.9), the SEEKER's is dim (ei 0.45), so
  // a stranger reads which twin is lit from the silhouette alone. Diffuse stays near-black
  // (identity in emissive, §3 law 3); the dark oxblood color keeps ei 0.9 from blooming
  // white (it stays a red EDGE, not a second focal — the eye is the only glow, ONE-GLOW).
  // The rim EMISSIVE is a WARM oxblood 0x93400f (hue ~22°) — 13° warmer than def.accent
  // (0x86200f, ~9°) so that at ei 0.9 the BLOOM halo (which desaturates + ACES-shifts a
  // saturated dark-red toward the 357° edge) stays clear of the danger-magenta band
  // (327–357°) on the dark backdrop — the OXBLOOD-MAGENTA collision the §5d gate law + the
  // REACH note both warn of at ei 0.9. Still oxblood, still within G3's ±25° of the accent.
  const RIM_EMISSIVE = 0x93400f;
  const rimHolderMat = track(new THREE.MeshStandardMaterial({
    color: 0x2a0d0a, emissive: RIM_EMISSIVE, emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.25, flatShading: true,
  }));
  const rimSeekerMat = track(new THREE.MeshStandardMaterial({
    color: 0x1a0806, emissive: RIM_EMISSIVE, emissiveIntensity: 0.6, roughness: 0.55, metalness: 0.2, flatShading: true,
  }));
  // INVERTED-HULL OUTLINE materials (BackSide): a scaled copy of the kite body rendered
  // back-faces-only draws a CONTINUOUS emissive silhouette line around the whole dart from
  // every angle — the "oxblood line-drawing" the LIT-SILHOUETTE law asks for. (Edge-bars on
  // the base octahedron chord INSIDE the detail-3 bulged body and only poke out as scattered
  // dabs — the r-REACH gate flag.) toneMapped stays on; the dark oxblood keeps it a red EDGE.
  const outlineHolderMat = track(new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: RIM_EMISSIVE, emissiveIntensity: 1.15, roughness: 0.6, metalness: 0.0,
    side: THREE.BackSide,
  }));
  const outlineSeekerMat = track(new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: RIM_EMISSIVE, emissiveIntensity: 0.75, roughness: 0.6, metalness: 0.0,
    side: THREE.BackSide,
  }));
  // Aged-silver crescent fins (the cool second swatch), lifted to ei 0.30 (REACH) so the
  // fin planes read as a lit surface at fight distance, still short of the eye.
  const silverMat = track(new THREE.MeshStandardMaterial({
    color: 0x191816, emissive: glow, emissiveIntensity: 0.30, roughness: 0.55, metalness: 0.3, flatShading: true,
  }));   // AGED (tarnished) silver — dark enough to keep the body median low (G2), the fin reads
  silverMat.side = THREE.DoubleSide;
  // The SOCKET rings get their OWN material (not the shared silver) so the empty
  // socket can flare into the mourning glow at the flee-death — the survivor's FACE
  // is the glowing empty ring (CP1 gate directive 5) — without lighting the fins.
  const socketMat = track(new THREE.MeshStandardMaterial({
    color: 0x201d1a, emissive: 0xff7a58, emissiveIntensity: 0.18, roughness: 0.5, metalness: 0.4, flatShading: true,
  }));   // ember-salmon so the dread "split light" + the mourning glow read warm (matches the eye), not silver
  socketMat.side = THREE.DoubleSide;
  // Comet-tail strips carry a warm-oxblood emissive so they read as flowing light-trails —
  // lifted from 0.12/0.08 so the SEEKER's tails don't vanish near-black-on-near-black on the
  // dark sky (the two-body X only read on light skies otherwise — REACH gate directive 4).
  const ribbonMat = track(new THREE.MeshStandardMaterial({
    color: 0x140c0b, emissive: RIM_EMISSIVE, emissiveIntensity: 0.28, roughness: 0.8, metalness: 0.1, flatShading: true,
  }));
  ribbonMat.side = THREE.DoubleSide;
  const ribbonSeekerMat = track(new THREE.MeshStandardMaterial({
    color: 0x0b0605, emissive: RIM_EMISSIVE, emissiveIntensity: 0.20, roughness: 0.82, metalness: 0.1, flatShading: true,
  }));
  ribbonSeekerMat.side = THREE.DoubleSide;

  // ------------------------------------------------------------------
  // THE KITE BODY — a stretched octahedron (~2.2 long, pointing forward +z, the
  // dart), with a raised oxblood SPINE rib (relief, §3.4) and a dark socket boss on
  // the front face where the eye seats when held.
  // ------------------------------------------------------------------
  // PRESENCE r9 (§5d L141): perceived size sums per BODY, not per formation — each twin must
  // pass the boss-test ALONE, so the dart grows again (~9.6 on-screen units at def.scale 1.55).
  const BODY_LEN = 6.2;                 // 4.6 → 6.2 (r9)
  const KITE_W = 2.3, KITE_H = 1.73;    // 1.7/1.28 → 2.3/1.73 (dart proportions held)
  function kiteGeo() {
    const oct = strip(new THREE.OctahedronGeometry(1.0, lowQ ? 1 : 3));   // detail 3 @q1 = carved facets, not a smooth shard (§5g)
    oct.scale(KITE_W / 2, KITE_H / 2, BODY_LEN / 2);   // a broad flat dart (reads as a wing/blade broadside, not a needle)
    return oct;
  }
  function spineRibGeo() {
    // A thin raised keel down the dorsal midline — a value-step relief that keeps
    // the front face from reading as a flat facet at capture scale (§5g richness).
    const g = strip(new THREE.BoxGeometry(0.08, 0.16, BODY_LEN * 0.86));
    g.translate(0, 0.34, 0.1);
    return g;
  }
  // Dorsal micro-vanes + a ventral keel: carved relief merged into the body so the
  // kite reads as a built creature at 30m, not a smooth shard — the §5g "spend the
  // surplus on detail, richer than the Sentinels" directive (draws stay flat: all
  // merged on the body material).
  function dorsalVanesGeo() {
    // A swept DORSAL CREST sail — a row of tapered blades down the spine (the
    // creature's ridge; reads rich in silhouette, §5g "spend on detail/articulation").
    const parts = [];
    const n = lowQ ? 4 : 8;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const z = BODY_LEN * (0.34 - t * 0.7);
      const h = 0.42 - Math.abs(t - 0.35) * 0.4;      // tallest a third of the way back
      const v = strip(new THREE.ConeGeometry(0.11 - t * 0.03, h, 3));
      v.rotateX(-0.7); v.translate(0, 0.4 + h * 0.3, z);
      parts.push(v);
    }
    // A collar ring around the eye socket (frames the eye seat; more front relief).
    const collar = strip(new THREE.TorusGeometry(0.4, 0.06, 6, lowQ ? 12 : 18));
    collar.translate(0, 0.02, BODY_LEN * 0.4);
    parts.push(collar);
    return mergeOx(parts, 'vanes');
  }
  function keelGeo() {
    const parts = [];
    const k = strip(new THREE.ConeGeometry(0.26, BODY_LEN * 0.5, 3));
    k.rotateX(Math.PI / 2); k.rotateY(0.5); k.translate(0, -0.3, 0.1);
    parts.push(k);
    // A pair of flank ridge bars along the belly for facet relief.
    const barL = strip(new THREE.BoxGeometry(0.07, 0.09, BODY_LEN * 0.62)); barL.translate(-0.2, -0.16, 0.05);
    const barR = strip(new THREE.BoxGeometry(0.07, 0.09, BODY_LEN * 0.62)); barR.translate(0.2, -0.16, 0.05);
    parts.push(barL, barR);
    // GILL slits — angled relief bars raked along each flank (§5g carved-detail spend).
    for (let i = 0; i < (lowQ ? 2 : 3); i++) {
      const z = BODY_LEN * (0.1 - i * 0.18);
      const gl = strip(new THREE.BoxGeometry(0.05, 0.34, 0.1)); gl.rotateX(0.5); gl.translate(-KITE_W * 0.42, 0, z);
      const gr = strip(new THREE.BoxGeometry(0.05, 0.34, 0.1)); gr.rotateX(0.5); gr.translate(KITE_W * 0.42, 0, z);
      parts.push(gl, gr);
    }
    return mergeOx(parts, 'keel');
  }

  // Crescent HEAD FIN — a flat arc extruded, swept up off the kite's leading top.
  // The mirror twin's fin curves the OTHER way (the mirrored-character read).
  const finExtrude = { depth: 0.09, bevelEnabled: !lowQ, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1, steps: 1 };
  function crescentShape() {
    const s = new THREE.Shape();
    // A waxing crescent: outer convex sweep, inner concave sweep back to the horn.
    s.moveTo(0, 0);
    s.quadraticCurveTo(0.95, 0.15, 1.15, 1.25);      // outer edge up to the horn tip
    s.quadraticCurveTo(0.55, 0.55, 0.18, 0.15);      // inner concave hollow
    s.lineTo(0, 0);
    return s;
  }
  const crescentGeo = () => {
    // Outer crescent + a smaller INNER vane nested inside it + a spine bar — a
    // built fin, not a flat sticker (the sheet's "fin detail" surplus, §5g).
    const outer = strip(new THREE.ExtrudeGeometry(crescentShape(), finExtrude));
    const innerShape = crescentShape();
    const inner = strip(new THREE.ExtrudeGeometry(innerShape, { ...finExtrude, depth: 0.06 }));
    inner.scale(0.6, 0.6, 1); inner.translate(0.14, 0.08, 0.02);
    const spine = strip(new THREE.BoxGeometry(0.07, 0.9, 0.16)); spine.rotateZ(-0.55); spine.translate(0.45, 0.45, 0);
    return mergeOx([outer, inner, spine], 'crescent');
  };
  // A slim rim bar riding the crescent's outer edge (oxblood — part of the lit silhouette).
  const finRimGeo = () => {
    const g = strip(new THREE.BoxGeometry(0.09, 1.3, 0.14));
    g.rotateZ(-0.5); g.translate(0.85, 0.75, 0.0);
    return g;
  };


  // Dark socket ring on the nose — the eye's seat (empty on the seeker → its FACE
  // is this ring, the holder/seeker tell). A FACETED silver torus (14–16 seg) with
  // one CHIPPED notch bar (the pair is "broken") — §5g relief, CP1 gate directive 3.
  const socketGeo = () => {
    const ring = strip(new THREE.TorusGeometry(0.34, 0.08, lowQ ? 8 : 12, lowQ ? 12 : 16));
    ring.translate(0, 0.02, BODY_LEN * 0.42);
    const notch = strip(new THREE.BoxGeometry(0.14, 0.1, 0.12));   // a chipped bite out of the rim
    notch.translate(0.3, 0.16, BODY_LEN * 0.42);
    return mergeOx([ring, notch], 'socket');
  };

  // ------------------------------------------------------------------
  // A TWIN — the kite + fin + spine + socket, plus TWO ribbon tails, each a chain
  // of tapered segments on LAGGED pivots with a STANDING WAVE base curve (they flow
  // and are never straight — §5d / CP1 gate directive 1). `seeker` paints the darker
  // value tier and gets the ONE scar (a snapped upper tail).
  // ------------------------------------------------------------------
  // A deforming ribbon STRIP: ONE mesh per tail (1 draw) whose vertices are rebuilt each
  // frame from the lagged pivot chain's world positions. The old build used one mesh per
  // segment (40+ draws for four 12-segment tails) — over the ≤30-draw REACH budget; the
  // strip renders the same flowing chain in a single draw. Flat tapered quad-strip,
  // DoubleSide, frustumCulled off (its verts leave the local bounds as it flows).
  function makeTailStrip(segN, lenScale, mat, name) {
    const rings = segN + 1;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rings * 2 * 3), 3));
    const nrm = new Float32Array(rings * 2 * 3);
    for (let i = 0; i < rings * 2; i++) nrm[i * 3 + 1] = 1;   // flat up-normal (emissive carries it; DoubleSide)
    geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    const idx = [];
    for (let i = 0; i < segN; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    if (name) mesh.name = name;   // mat is a shared ribbonMat/ribbonSeekerMat, already tracked at creation
    return { geo, mesh, segN, lenScale };
  }
  // Rebuild a tail strip from its pivot chain (twin-local space). Called each tick after
  // the flow loop has posed the pivots.
  const _wp = new THREE.Vector3();
  const _tan = new THREE.Vector3(), _side = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  const _twinInv = new THREE.Matrix4();
  const _pts = [];
  function updateTailStrip(tail, twin, twinInv) {
    const { geo, segN, lenScale } = tail;
    const segs = tail.segs;
    // Spine points (twin-local): each pivot origin + a final tip off the last pivot.
    for (let i = 0; i < segN; i++) {
      segs[i].pivot.getWorldPosition(_wp);
      (_pts[i] || (_pts[i] = new THREE.Vector3())).copy(_wp).applyMatrix4(twinInv);
    }
    const last = segs[segN - 1].pivot;
    _wp.set(0, 0, -segLen(segN - 1, lenScale)); last.localToWorld(_wp);
    (_pts[segN] || (_pts[segN] = new THREE.Vector3())).copy(_wp).applyMatrix4(twinInv);
    const pos = geo.attributes.position.array;
    for (let i = 0; i <= segN; i++) {
      const p = _pts[i];
      const a = _pts[Math.max(0, i - 1)], b = _pts[Math.min(segN, i + 1)];
      _tan.subVectors(b, a);
      _side.crossVectors(_tan, _up);
      if (_side.lengthSq() < 1e-6) _side.set(1, 0, 0);
      _side.normalize().multiplyScalar(ribbonHalfW(i, segN, lenScale));
      const o = i * 6;
      pos[o] = p.x + _side.x; pos[o + 1] = p.y + _side.y; pos[o + 2] = p.z + _side.z;
      pos[o + 3] = p.x - _side.x; pos[o + 4] = p.y - _side.y; pos[o + 5] = p.z - _side.z;
    }
    geo.attributes.position.needsUpdate = true;
  }

  function buildTwin(sx, seeker) {
    const twin = new THREE.Object3D();
    twin.name = seeker ? 'eitherTwinB' : 'eitherTwinA';
    const bodyMat = seeker ? bodySeekerMat : bodyHolderMat;
    const ribMat = seeker ? ribbonSeekerMat : ribbonMat;
    const rimMatT = seeker ? rimSeekerMat : rimHolderMat;   // LIT-SILHOUETTE value tier
    const outlineMat = seeker ? outlineSeekerMat : outlineHolderMat;
    // §5j MATERIALISE: the twin DISSOLVES in (per-twin opacity 0→1). silverMat/socketMat are
    // shared by both twins, so clone them here — every material the twin draws must fade on its
    // OWN beat (twinA then twinB), independently. The clones mirror the shared emissive each tick.
    const finMat = track(silverMat.clone());
    const sockMat = track(socketMat.clone());

    // Body (merged kite + spine rib + dorsal vanes + keel so all the relief shares
    // the body material — richness without draw inflation, §5g).
    const body = new THREE.Mesh(mergeOx([kiteGeo(), spineRibGeo(), dorsalVanesGeo(), keelGeo()], 'kite'), bodyMat);
    body.name = seeker ? 'eitherTwinBodyB' : 'eitherTwinBodyA';
    twin.add(body);

    // LIT-SILHOUETTE: an inverted-hull OUTLINE (a scaled backface copy of the kite) draws a
    // CONTINUOUS oxblood silhouette line around the dart from every angle — the "oxblood
    // line-drawing" read. The HOLDER's line burns bright, the SEEKER's dim (the value tier
    // reads from the outline alone, even where the near-black body dissolves into the sky).
    const outline = new THREE.Mesh(kiteGeo(), outlineMat);
    outline.scale.setScalar(1.07);
    outline.name = seeker ? 'eitherOutlineB' : 'eitherOutlineA';
    twin.add(outline);

    // Crescent head fin (mirrored on the seeker so the pair reads as mirror-twins). +35%
    // (r9) so it holds its share of the bigger dart's silhouette.
    const fin = new THREE.Mesh(crescentGeo(), finMat);
    fin.name = 'crescentFin';
    fin.scale.set(sx * 1.35, 1.35, 1.35);              // mirror per side (sx) + 35% (r9)
    fin.position.set(sx * 0.12, 0.7, BODY_LEN * 0.16);
    fin.rotation.z = sx * -0.15;
    twin.add(fin);
    // The fin's OUTER edge is oxblood too (part of the lit silhouette) — not silver.
    const finRim = new THREE.Mesh(finRimGeo(), rimMatT);
    finRim.scale.set(sx * 1.35, 1.35, 1.35); finRim.position.copy(fin.position);
    twin.add(finRim);

    // Eye socket on the nose (empty on the seeker → its face; glows in mourning at death).
    const socket = new THREE.Mesh(socketGeo(), sockMat);
    socket.name = 'eyeSocket';
    twin.add(socket);

    // TWO ribbon tails, trailing behind (−z), each a chain of lag pivots. Each tail
    // carries a base PHASE offset (0 vs ~1.2 rad) and an unequal LENGTH scale
    // (1.0× / 0.85×), and each segment sits at a fixed point on a STANDING WAVE —
    // so at ANY capture phase the two tails are curved and NON-parallel, never a
    // pair of straight chopstick rods (CP1 gate directive 1). The tick adds the
    // travelling flow on top, easing (lag) toward it.
    // TWO comet-tails. Each is a chain of lagged pivots (invisible drivers — named
    // ribbonPivot so the telegraph/§7b gate still finds them) PLUS one deforming strip
    // mesh rebuilt from those pivots each tick (1 draw/tail, not 12). The seeker's upper
    // tail is SNAPPED short (4 segs) — the ONE scar (its strip is named eitherScar).
    const ribbons = [];
    for (let t = 0; t < 2; t++) {
      const rootY = t === 0 ? 0.30 : -0.30;            // upper + lower tail (spread for the taller body)
      const tailPhase = t * 1.2;                       // base phase offset between the two tails
      const lenScale = t === 0 ? 1.0 : 0.85;           // unequal tail lengths
      const isScar = seeker && t === 0;
      const segN = isScar ? 4 : RIBBON_SEG;            // the seeker's upper tail is SNAPPED short (the scar)
      let parent = twin;
      const segs = [];
      for (let s = 0; s < segN; s++) {
        const pivot = new THREE.Object3D();
        pivot.name = 'ribbonPivot';                    // the telegraph/§7b gate finds these by name
        pivot.position.set(0, s === 0 ? rootY : 0, s === 0 ? -BODY_LEN * 0.42 : -segLen(s - 1, lenScale));
        // Standing-wave base curve (fixed): adjacent segments differ so the resting
        // ribbon is a meandering S, never a rod.
        const wave = tailPhase + s * 0.55;
        const baseZ = Math.sin(wave) * 0.22;
        const baseX = -0.12 + Math.cos(wave) * 0.14;
        pivot.rotation.set(baseX, 0, baseZ);
        parent.add(pivot);
        segs.push({ pivot, wave, baseZ, baseX, swayZ: baseZ, swayX: baseX });
        parent = pivot;
      }
      const tailMat = isScar ? ribMat : ribMat;        // both share the twin's ribbon material
      const tail = makeTailStrip(segN, lenScale, tailMat, isScar ? 'eitherScar' : null);
      tail.segs = segs;
      twin.add(tail.mesh);
      ribbons.push(tail);
    }

    // Every material this twin draws — set transparent so the §5j materialise can fade each
    // from 0→1 on the twin's own beat (opacity 1 the rest of the time reads as opaque).
    const fadeMats = [bodyMat, outlineMat, rimMatT, finMat, sockMat, ribMat];
    for (const m of fadeMats) m.transparent = true;
    return { twin, body, bodyMat, finMat, sockMat, fadeMats, ribbons, sx, seeker };
  }

  // REACH COMET-TAILS (§5d L140): 12 segments at base segLen 0.95 → ~7–8-unit flowing
  // trails. `segLen` sets the pivot spacing; the tail's total length is their sum
  // (~8.1u at lenScale 1). `lenScale` (tail A 1.0× / tail B 0.85×) keeps the two tails
  // unequal so they never read as parallel rods (CP1 gate directive 1).
  const RIBBON_SEG = lowQ ? 8 : 12;
  function segLen(s, lenScale = 1) { return (1.25 - s * 0.05) * lenScale; }   // r9: base 0.95→1.25 → ~10u light-trails (segment count/taper unchanged)
  // Half-width of the ribbon at ring i (root wide → tip fine), so the strip reads as a
  // real tapering comet-tail, not a slab.
  function ribbonHalfW(i, segN, lenScale) { return (0.30 - (i / segN) * 0.27) * lenScale; }

  const twinA = buildTwin(1, false);    // the HOLDER half (brighter; holds the eye at idle)
  const twinB = buildTwin(-1, true);    // the SEEKER half (darker; the eyeless, scarred twin)
  rig.add(twinA.twin, twinB.twin);

  // ------------------------------------------------------------------
  // THE SHARED EYE — one HDR orb (iris ring + pupil, the EYE_HOT idiom) that rides
  // a beaded LineSegments THREAD strung between the twins' sockets. It DETACHES and
  // glides from holder to seeker; whoever holds it fires next. THE focal (§3.2).
  // ------------------------------------------------------------------
  // The eye is a REAL EYE, structured so a dark PUPIL survives bloom (CP1 gate r2
  // directive 1): a MODERATE-HDR sclera RING (its bloom is a halo, not a flood) +
  // a BIG dark pupil proud of it + a tiny ULTRA-HOT catchlight glint that alone
  // carries the §3.2/G1 focal peak (≥250) in a pinpoint cluster. Sclera dimmed from
  // 6.0→2.1 so its annulus bloom can't fill the pupil centre.
  const EYE_HOT = 2.1;                     // the sclera ring — gentle bloom, never floods the pupil
  const GLINT_HOT = 9.7;                   // the catchlight — the G1 maxLum peak; 9.0→9.7 so it clears ≥250 even on the BRIGHTEST home sky (Amber Wastes diluted the peak to 249; studio cluster stays well under G1's 7% cap)
  const EYE_BASE = new THREE.Color(0xfff2ea);
  const eyeRig = new THREE.Group();
  eyeRig.name = 'eyeRig';
  eyeRig.scale.setScalar(1.3);   // r9: eye rig +30% so it stays the proportional focal on the bigger dart (tick only writes .position, never .scale)
  const orbMat = track(new THREE.MeshBasicMaterial({ color: 0xfff2ea }));
  orbMat.toneMapped = false;
  orbMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.24, lowQ ? 12 : 18, lowQ ? 8 : 14), orbMat);
  eyeRig.add(orb);
  // Iris ring around the orb (the eye reads as an EYE — iris, not a stray bullet).
  // EMBER-SALMON emissive (warmed off rose per CP1 r2 directive 5) so its bloom-mix
  // halo never lands a bright pixel in the danger-magenta band (327–357°).
  const IRIS_EMBER = 0xff7a58;
  const irisMat = track(new THREE.MeshStandardMaterial({
    color: 0x3a1410, emissive: IRIS_EMBER, emissiveIntensity: 0.85, roughness: 0.45, metalness: 0.3, flatShading: true,
  }));
  const irisParts = [strip(new THREE.TorusGeometry(0.32, 0.075, 8, lowQ ? 16 : 24))];
  const nPetal = lowQ ? 6 : 10;
  for (let i = 0; i < nPetal; i++) {
    const a = (i / nPetal) * Math.PI * 2;
    const p = strip(new THREE.ConeGeometry(0.04, 0.15, 3));
    p.rotateX(Math.PI / 2); p.translate(0, 0, -0.075);   // point inward
    p.rotateZ(a); p.translate(Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0);
    irisParts.push(p);
  }
  const iris = new THREE.Mesh(mergeOx(irisParts, 'iris'), irisMat);
  iris.name = 'eyeIris';
  eyeRig.add(iris);
  // The PUPIL — a LARGE dark disc seated PROUD of the sclera so the orb reads as a
  // bright RING around a dark centre, not a uniform ball: bloom emanates from the
  // ring but can't fill the wide dark centre, so the eye keeps a pupil even on the
  // near-dark backdrop (CP1 gate directive 2 — the LOOSE-BULLET fix). renderOrder
  // over the orb so it always occludes the hot centre.
  const pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x140a0a }));
  pupilMat.toneMapped = false;
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 12), pupilMat);   // ~0.83 of the sclera → a big dark disc, only a thin bright ring survives
  pupil.name = 'eyePupil';
  pupil.position.z = 0.16;   // proud ≥0.06 of the sclera front (0.24) → the pupil front sits at ~0.36
  pupil.renderOrder = 6;
  eyeRig.add(pupil);
  // CATCHLIGHT glint — a pinpoint ultra-hot spark on the upper rim of the eye. It
  // alone carries the §3.2/G1 focal peak (≥250) in a tiny cluster, so the sclera can
  // stay dim enough to keep the pupil dark. Reads as a living wet catchlight.
  const glintMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  glintMat.toneMapped = false;
  glintMat.color.setScalar(GLINT_HOT);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), glintMat);
  glint.name = 'eyeGlint';
  glint.position.set(-0.08, 0.09, 0.44);   // upper-left, PROUD OF THE PUPIL (front ~0.36) so it's never occluded
  glint.renderOrder = 7;
  eyeRig.add(glint);
  // §5j: the eye DISSOLVES in with twinA (opacity driven each tick) — transparent so it can.
  orbMat.transparent = irisMat.transparent = pupilMat.transparent = glintMat.transparent = true;
  rig.add(eyeRig);

  // SPLIT CORE — a second HDR eye-core that ignites INSIDE the SEEKER's empty socket
  // during the dread card only ("EITHER/OR — Both Halves at Once": the eye SPLITS its
  // light to BOTH sockets, §5f). White-hot, toneMapped=false — the eye idiom — sized
  // ~75% of the main core; seated at the seeker socket each tick (CP1 r5 directive 1).
  const splitMat = track(new THREE.MeshBasicMaterial({ color: 0xfff1e0 }));
  splitMat.toneMapped = false;
  const splitCore = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), splitMat);
  splitCore.name = 'eyeSplitCore';
  splitCore.visible = false;
  splitCore.renderOrder = 7;
  rig.add(splitCore);

  // The BEADED THREAD — a LineSegments strand strung between the two sockets, with
  // beads, that the eye rides (overdraw-exempt, §2). Rebuilt each frame from the
  // live socket world positions so it always connects the drifting twins.
  const THREAD_BEADS = 14;
  const threadMat = track(new THREE.LineBasicMaterial({
    // LIT-SILHOUETTE: the bead-thread is the THIRD silhouette element (two darts + the line
    // between) and stays ALWAYS visible at silver ~0.6 (§5d L140) so the "one eye, two bodies"
    // read never drops out — even against the brightest biome sky.
    color: new THREE.Color(glow).multiplyScalar(0.6), transparent: true, opacity: 0.62, depthWrite: false,
  }));
  const threadGeo = new THREE.BufferGeometry();
  const threadPos = new Float32Array((THREAD_BEADS - 1) * 2 * 3);   // segment pairs
  threadGeo.setAttribute('position', new THREE.BufferAttribute(threadPos, 3));
  const eyeThread = new THREE.LineSegments(threadGeo, threadMat);
  eyeThread.name = 'eyeThread';
  eyeThread.frustumCulled = false;
  rig.add(eyeThread);

  // BEADS riding the thread, DENSER near the sockets (§5g + CP1 gate directive 3),
  // that SCATTER behind the survivor on the flee (directive 5). A single Points
  // cloud — zero extra draws (not a mesh/line/instanced), positioned per frame.
  const N_BEAD = lowQ ? 8 : 12;
  const beadU = [], beadScatter = [];
  for (let i = 0; i < N_BEAD; i++) {
    // cluster u toward the two ends (near the sockets): map i to a socket-biased curve
    const f = (i + 0.5) / N_BEAD;
    beadU.push(0.5 + Math.sign(f - 0.5) * 0.5 * Math.pow(Math.abs(f - 0.5) * 2, 0.6));
    // a deterministic-ish scatter direction (varied by index; seeded in the studio)
    const a = i * 2.399963, r = 0.4 + (i % 3) * 0.3;
    beadScatter.push([Math.cos(a) * r, 0.4 + (i % 2) * 0.4, Math.sin(a) * r]);
  }
  const beadPos = new Float32Array(N_BEAD * 3);
  const beadGeo = new THREE.BufferGeometry();
  beadGeo.setAttribute('position', new THREE.BufferAttribute(beadPos, 3));
  const beadMat = track(new THREE.PointsMaterial({
    color: new THREE.Color(glow), size: 0.13, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false,
  }));
  const beads = new THREE.Points(beadGeo, beadMat);
  beads.name = 'threadBeads';
  beads.frustumCulled = false;
  rig.add(beads);

  // ------------------------------------------------------------------
  // EMBER MOTES — small dark sparks off the shared ember (the orbiter contract ≥2;
  // §3 law 8: satellites stay DARK, dim ei). They drift near the thread's midpoint.
  // ------------------------------------------------------------------
  // ADDITIVE warm sparks (not opaque boxes): an opaque dark mote reads as a black rectangle
  // on the pale/sunset skies (REACH gate directive 3). Additive blending can only ADD warmth
  // — a faint ember spark on the dark sky, and INVISIBLE (never a dark hole) on bright skies.
  // Dim + tiny so it stays an ember, never a second glow (ONE-GLOW LAW).
  const moteMat = track(new THREE.MeshBasicMaterial({
    color: 0x4a2410, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  moteMat.toneMapped = false;
  const moteGeo = strip(new THREE.OctahedronGeometry(0.1, 0));
  const orbiters = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat);
    m.userData = { ang: (i / 3) * Math.PI * 2, radius: 1.1 + i * 0.3, speed: 0.7 + i * 0.2, tilt: i * 0.8 };
    rig.add(m);
    orbiters.push(m);
  }

  // Hit flash rings the oxblood rim tier (a struck pair flares at its rims, never
  // lights the near-black body toy-red — the craghold/ashtalon lesson transplanted).
  kit.flashBind(outlineHolderMat, 1.15);   // a struck pair flares along its silhouette outline
  kit.finalize();

  // ==================================================================
  // ANIMATION — the figure-eight orbit, the eye handoff, the charisma layer.
  // ==================================================================
  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  let tell = null;
  function setAttackTell(id) { tell = id || null; }

  let setpieceK = 0;
  let dreadSplit = 0;   // >0 only during the DREAD card (setpiece def carries dread:true) → the eye splits its light to BOTH sockets
  function setSetpiece(k, sdef) {
    setpieceK = Math.max(0, Math.min(1, k));
    dreadSplit = (sdef && sdef.dread) ? setpieceK : 0;
  }

  // Eye handoff state: holdT eases 0 (twinA holds) ↔ 1 (twinB holds). The eye seats
  // at the holder's socket; a handoff is a glide across the thread. `handoffFrom`
  // is the value we glide away from so the travel is a full socket-to-socket sweep.
  let holdT = 0;               // 0 = A holds, 1 = B holds (eased display value)
  let holdTarget = 0;
  let handoffTimer = 3.0;      // seconds until the next handoff (the baton beat)
  let debugHold = null;        // test/studio pin: forces holdT to a value
  let entranceU = null;        // §5j THE BATON CROSS: 0..1 entrance clock (null = normal fight); overrides the orbit

  // Figure-eight orbit: the twins ride a lemniscate 180° out of phase around a
  // slowly drifting centre — the fight NEVER stops moving. Kept LOCAL (the group
  // station-keeps; the moving-station setpiece adds the whole-body sweep on top).
  const ORBIT_R = 5.2;   // 2.6 → 5.2 (REACH: crossing span ≈ 23u, ASHTALON-class reach across the portrait)
  let orbitPhase = 0;
  let t0 = null;               // first-tick time → encounter-relative clock (for the intro spread + death)
  let spreadT0 = null;         // fight-start time → the intro-spread clock (reset when the §5j entrance releases, so the twins ease out of the scissor, never snap wide)

  // Charisma state.
  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  let lookAwayT = 0, lookAwayX = 0, lookAwayY = 0, nextLookAway = 5 + Math.random() * 5;
  function setGaze(nx, ny) { gazeTX = Math.max(-1, Math.min(1, nx)); gazeTY = Math.max(-1, Math.min(1, ny)); }
  const BLINK_DUR = 0.26;
  let blinkT = 0, nextBlink = 3.5 + Math.random() * 3;
  let noticeT = 0;
  function notice() { noticeT = 1.0; blinkT = 0; nextBlink = 3; }
  let painT = 0, painTwin = 0;   // painTwin: which half recoils (the holder); the other darts closer
  function flinchFlash(amt) { if (amt > 0.3) { painT = Math.max(painT, 0.34); painTwin = holdT < 0.5 ? 0 : 1; } kit.flash(amt); }

  // EMOTIONAL DEATH (§4b, the beat that seeds slot 12): the pair breaks, the
  // survivor circles its fallen half twice, takes the eye, and FLEES off-frame.
  let dyingK = 0;
  function setDissolveEmotive(k) {
    dyingK = Math.max(0, Math.min(1, k));
    // A MOURNFUL fade, NOT the kit's burn-out (§4b: no explosion). The kit dissolve
    // blows every emissive to white — which whited-out the fleeing survivor and
    // erased its oxblood/silver identity on the pale sheet (CP1 gate directive 5).
    // So we fade OPACITY only (the dissolve test still passes at k=1: all → 0) and
    // leave emissive to the per-frame tick, which keeps the survivor charcoal and
    // confines the glow to the guttering ember at its socket. The flee pose itself
    // (survivor circles the fallen half, takes the eye, flees) is driven in tickBody.
    // BACK-LOADED fade: the survivor stays FULLY OPAQUE through the whole flee (the
    // mourner must be visible — CP1 r2 directive 3), only vanishing in the last beat
    // as it clears the frame. At k=1 everything is transparent (the dissolve test
    // still passes); at the flee capture (k≈0.5) opacity is 1.
    const a = dyingK < 0.82 ? 1 : Math.max(0, 1 - (dyingK - 0.82) / 0.18);
    for (const m of kit.mats) {
      m.transparent = true;
      const base = m.userData.baseOpacity ?? 1;
      m.opacity = base * a;
      if (m.uniforms && m.uniforms.uOpacity) m.uniforms.uOpacity.value = base * a;
    }
  }

  // Shield wraps the eye-holder: pull the holder to the rig centre (under the
  // centred bubble) and freeze the orbit; the seeker retreats outward. The eye
  // leashes dim (G6 — the focal visibly hides when invulnerable).
  let shieldClamp = false;
  kit.onShieldChange((v) => { shieldClamp = v; });

  function socketWorldLocal(twin, out) {
    // The socket sits on the dart's NOSE (local +z); return its position in RIG
    // space (the twins are direct children of rig — quaternion-oriented now).
    out.set(0, 0, BODY_LEN * 0.42).applyQuaternion(twin.quaternion).add(twin.position);
    return out;
  }
  const _sa = new THREE.Vector3(), _sb = new THREE.Vector3(), _eye = new THREE.Vector3();
  const _dir = new THREE.Vector3(), _zAxis = new THREE.Vector3(0, 0, 1), _roll = new THREE.Quaternion();
  function orientDart(twin, pos, cx, cy, time, phase, faceCam) {
    if (faceCam) _dir.set(0, 0, 1);                                   // notice: nose → the player (camera)
    else _dir.set(cx - pos[0], cy - pos[1], -pos[2]).normalize();     // else nose → the shared ember (centre)
    if (_dir.lengthSq() < 1e-6) _dir.set(0, 0, 1);
    twin.quaternion.setFromUnitVectors(_zAxis, _dir);                 // point the long axis at the target
    _roll.setFromAxisAngle(_dir, Math.sin(time * 1.1 + phase) * 0.12);// a slow living roll about the facing axis
    twin.quaternion.premultiply(_roll);
  }

  function tickBody(dt, time) {
    if (t0 == null) t0 = time;
    const age = time - t0;

    // --- Intro spread (the 'both sides' arrival): the twins sweep OUT from centre
    // to their orbit radius over the first ~1.6s (the "both flanks at once" read). --
    // The clock starts when the FIGHT begins (entrance released), NOT at spawn: the
    // §5j entrance dwells ~3.5s in bullet-time, so an age-from-spawn spread would already
    // be 1 when the fight opens — the twins would SNAP from the scissor's converged centre
    // to full orbit radius in one frame (the jarring wide-jump). Basing it on fight-start
    // lets them ease out from where the scissor left them (a boss with no entrance sets
    // spreadT0 on its first tick = spawn, so its behaviour is unchanged).
    if (entranceU != null) spreadT0 = null;                 // entrance owns placement; hold the clock
    else if (spreadT0 == null) spreadT0 = time;             // first fight frame → start the sweep now
    const spread = spreadT0 == null ? 0 : Math.min(1, (time - spreadT0) / 1.6);

    // --- The figure-eight orbit (drifting centre). Frozen under a shield/death. ---
    const moving = !shieldClamp && dyingK <= 0 && entranceU == null;   // freeze the orbit clock during the Baton Cross so the fight starts cleanly from th=0
    if (moving) orbitPhase += dt * (0.55 + charge * 0.25 + setpieceK * 0.3);
    const cx = Math.sin(time * 0.19) * 0.6;            // the slow centre drift
    const cy = Math.sin(time * 0.13) * 0.4;
    // Lemniscate: twin A on one lobe, twin B 180° out of phase (they swap sides).
    // A CONSTANT DEPTH offset (±ZSEP) keeps them apart at the figure-eight node —
    // where both lobes cross — so the twins never collide and the eye-thread length
    // stays > 0 at every orbit phase (§7b). It also gives the pair real depth on the
    // rail (one twin nearer the player through each crossing).
    const ZSEP = 3.4;   // depth offset keeps the twins' inward-facing sockets apart at the figure-eight node.
    // Must exceed the socket forward-offset (BODY_LEN*0.42 ≈ 2.6) or the noses cross and the eye-thread
    // collapses to 0 (§7b). Grew 2.4→3.4 with the r9 body (BODY_LEN 4.6→6.2 pushed the sockets further in).
    const th = orbitPhase;
    // The figure-eight plane is TILTED ~36° so the pair separates VERTICALLY as well
    // as horizontally — they never line up behind each other at the 3/4 view AND their
    // outward-trailing tails never bridge into one connected component (the overlapped-
    // orbit ambiguity, CP1 r6 dir 3 + r7 dir 1: raised 24°→36°). Pure choreography, in-game too.
    const TILT = 0.62, ct = Math.cos(TILT), st = Math.sin(TILT);
    const axr = Math.sin(th) * ORBIT_R * spread, ayr = Math.sin(th * 2) * ORBIT_R * 0.5 * spread;
    const bxr = Math.sin(th + Math.PI) * ORBIT_R * spread, byr = Math.sin((th + Math.PI) * 2) * ORBIT_R * 0.5 * spread;
    const ax = axr * ct - ayr * st, ay = axr * st + ayr * ct;
    const bx = bxr * ct - byr * st, by = bxr * st + byr * ct;

    // EMOTIONAL DEATH (§4b): the pair BREAKS — the fallen half stops at a fixed point
    // and SHRINKS/sinks as it dissolves; the survivor circles ITS FALLEN HALF (two
    // laps), then FLEES off-frame at the very end. This gives TWO distinct studio
    // beats — mid-dissolve (both halves present) vs the lone survivor circling (the
    // fallen shrunk away) — the CP1 r3 directive 1 fix.
    let posA = [cx + ax, cy + ay, ZSEP], posB = [cx + bx, cy + by, -ZSEP];
    let survivorIsA = holdT < 0.5;
    let fallenShrink = 0;
    let entMatA = 1, entMatB = 1;   // §5j materialise scale (1 = fully present outside the entrance)
    if (entranceU != null) {
      // THE BATON CROSS (§5j) — REAR-CAM SEQUENTIAL MATERIALISE. Both twins start INVISIBLE
      // (scale 0). Beat 1: twinA MATERIALISES on the RIGHT (+9), eye ON it — the rear camera
      // focuses on it as it forms. Beat 2: twinB MATERIALISES on the LEFT (−9), the EYE crosses
      // to it and the dragon's head turns to follow it. Beat 3: both SCISSOR forward to the
      // figure-eight's th=0 seat (x→0, y→0, depth→±ZSEP) as the camera eases home and the fight
      // opens (moving is frozen above, so the orbit resumes cleanly from th=0). Group space; the
      // group rides behind the dragon (rel<0) through the reveals, per the script's path().
      const u = entranceU;
      entMatA = easeK(clamp(u / 0.30, 0, 1));                 // twinA DISSOLVES in (opacity 0→1) over beat 1
      entMatB = easeK(clamp((u - 0.34) / 0.30, 0, 1));        // twinB dissolves in over beat 2
      const scissor = easeK(clamp((u - 0.66) / 0.34, 0, 1));   // both sweep to the th=0 seat over beat 3
      const axL = 9 * (1 - scissor);                            // twinA local x: RIGHT (+9) → centre
      const bxL = -9 * (1 - scissor);                           // twinB local x: LEFT (−9) → centre
      const dispY = 1.2 * (1 - scissor);                        // materialise at a display height, settle to 0 as they scissor
      posA = [axL, dispY, ZSEP * scissor]; posB = [bxL, dispY, -ZSEP * scissor];   // gain the ±ZSEP depth only as they scissor to centre (no overlap)
      // The eye is on A through beat 1, crosses to B as B materialises (beat 2, 0.34→0.62) — the
      // dragon's head tracks the LIT twin, so it always looks at the eye. Pinned (no lag/random)
      // so the beaded thread reads as one taut line. Rim IGNITION rides holdT (aHolds, below).
      holdTarget = holdT = easeK(clamp((u - 0.34) / 0.28, 0, 1));
      survivorIsA = holdT < 0.5;
    } else if (dyingK > 0) {
      const circle = age * 2.2;                              // two slow laps as it grieves
      const flee = Math.max(0, dyingK - 0.85) / 0.15;        // stays circling until the very end, THEN leaves
      fallenShrink = clamp((dyingK - 0.3) / 0.4, 0, 1);      // the fallen half dwindles to nothing by ~0.7
      const fp = [-1.1, -0.2 - dyingK * 0.7, -0.5];          // the fallen half stops and sinks (near centre so the flee frames tight)
      const orbR = 2.7 * (1 - clamp((dyingK - 0.4) / 0.6, 0, 0.62));   // the survivor's circle TIGHTENS as it grieves → a compact frame (CP1 r6 dir 1)
      const sv = [
        fp[0] + Math.cos(circle) * orbR * (1 - flee) + flee * 26,
        fp[1] + 0.9 + Math.sin(circle) * orbR * 0.6 * (1 - flee),
        fp[2] + Math.sin(circle) * 1.0 - flee * 6,
      ];
      if (survivorIsA) { posA = sv; posB = fp; } else { posB = sv; posA = fp; }
    } else if (shieldClamp) {
      // SHIELD STAGING (§5f, CP1 gate directive 4): the bubble wraps whichever body
      // HOLDS the eye — the holder pulls to the centred bubble; the SEEKER holds its
      // orbit OUTSIDE the bubble (radius 4.4), so the duo silhouette + the "which
      // half is invulnerable" teaching read both survive the fight's most-stared-at
      // state. NOT both-in-bubble (that killed the read).
      const holderIsA = holdT < 0.5;
      const inb = [0, 0.15, 0.5];                        // holder → centre, under the bubble
      const out = [Math.sin(time * 0.5) * 0.4 + 4.9, 0.5 + Math.sin(time * 0.7) * 0.4, -1.2];   // seeker orbits just OUTSIDE the bubble (|pos|≈5.0 > 4.4) but IN FRAME (CP1 r5 directive 3)
      if (holderIsA) { posA = inb; posB = out; } else { posB = inb; posA = out; }
    }
    twinA.twin.position.set(posA[0], posA[1], posA[2]);
    twinB.twin.position.set(posB[0], posB[1], posB[2]);
    // The FALLEN half shrinks away as it dissolves (the pair breaking); the survivor
    // stays full size and flees intact (§4b, CP1 r3 directive 1). During the §5j entrance the
    // twins MATERIALISE via OPACITY (below) — scale only settles 0.94→1 so it reads as a dissolve-
    // in, NOT an inflate-from-a-dot (the r18 note: the pure scale-pop looked like it was growing).
    twinA.twin.scale.setScalar(entranceU != null ? 0.94 + 0.06 * entMatA : Math.max(0.001, survivorIsA ? 1 : 1 - fallenShrink));
    twinB.twin.scale.setScalar(entranceU != null ? 0.94 + 0.06 * entMatB : Math.max(0.001, survivorIsA ? 1 - fallenShrink : 1));

    // Orient each dart to FACE THE SHARED EMBER (nose → centre): the two darts read
    // broadside (their length across the frame, the dominant mass) with the ember
    // framed between their inward noses, and their ribbon tails trail OUTWARD — the
    // "two mirrored dart-wraiths orbiting a shared ember" one-liner, from every orbit
    // phase. On NOTICE they snap to face the PLAYER instead (nose → camera, +z).
    // NOTICE snaps both to face the player; the DREAD card also LOCKS both facing forward
    // (both halves squared up at you — distinct body language from charge's inward-nosed
    // taut-tail wind-up, REACH gate directive 1).
    const faceCam = noticeT > 0.4 || dreadSplit > 0.3;
    orientDart(twinA.twin, posA, cx, cy, time, 0, faceCam);
    orientDart(twinB.twin, posB, cx, cy, time, Math.PI, faceCam);

    // --- The eye handoff (the charge tell). A handoff crosses on its own baton
    // beat; charging PINS the eye to the firing twin (whoever is about to shoot). --
    handoffTimer -= dt;
    if (entranceU != null) { /* the Baton Cross pins holdT directly — no random handoff */ }
    else if (debugHold != null) { holdTarget = debugHold; }
    else if (charge > 0.15) { /* hold — the tell: the eye stays put on the firer */ }
    else if (handoffTimer <= 0 && moving) { holdTarget = holdTarget < 0.5 ? 1 : 0; handoffTimer = 2.4 + Math.random() * 1.2; }
    const handoffSpeed = charge > 0.15 ? 10 : 3.4;
    holdT += (holdTarget - holdT) * Math.min(1, dt * handoffSpeed);

    // Seat the eye on the thread between the two sockets at the hold fraction.
    socketWorldLocal(twinA.twin, _sa);
    socketWorldLocal(twinB.twin, _sb);
    // §5j MATERIALISE: twinB's socket sits at its full ±9 position even at scale 0, so the
    // thread/beads/eye would stretch to the still-INVISIBLE twin. Pin twinB's thread-end AT
    // twinA until it materialises (entMatB 0→1) — the thread is a zero-length point on twinA
    // through beat 1 (eye rests on A), then GROWS across to twinB as it forms in beat 2.
    if (entranceU != null) _sb.lerp(_sa, 1 - Math.min(1, Math.max(0, entMatB)));
    // FLEE: the thread SNAPS — its far end collapses to a short dangling arc off the
    // survivor's own socket (not spanning to the vanished fallen half across the
    // frame), so the §7c auto-fit frames the LONE survivor + its hollow socket at
    // spec height instead of shrinking it to fit the far-flung span (CP1 r5 dir 2).
    if (dyingK > 0.55) {
      const surv = survivorIsA ? _sa : _sb, far = survivorIsA ? _sb : _sa;
      far.set(surv.x + 0.5, surv.y - 1.3, surv.z + 0.2);   // the snapped end dangles just below the socket
    }
    // Seat the eye at 10–90% of the thread — NEVER flush against a socket. Resting
    // ON a socket buries the orb + catchlight inside the holder's broadside kite body,
    // so the eye vanished from the front + profile angles (it only read in 3/4 + top-
    // down, CP1 r8 dir 3). Floating it ~0.3u off the socket keeps the bloom in open air,
    // readable from every angle, while a full 0→1 handoff still crosses 0.1→0.9 (the §7b
    // travel assert needs ≥0.7·thread; 0.8·thread clears it).
    const eyeF = 0.1 + Math.max(0, Math.min(1, holdT)) * 0.8;
    _eye.copy(_sa).lerp(_sb, eyeF);
    // A gentle arc up off the thread mid-glide (the eye lifts as it crosses).
    const glideLift = Math.sin(Math.max(0, Math.min(1, holdT)) * Math.PI) * (Math.abs(holdTarget - holdT) > 0.05 ? 0.5 : 0.12);
    eyeRig.position.set(_eye.x, _eye.y + glideLift, _eye.z + 0.15);

    // Rebuild the beaded thread from socket to socket (drooping slightly at mid).
    for (let i = 0; i < THREAD_BEADS - 1; i++) {
      const t1 = i / (THREAD_BEADS - 1), t2 = (i + 1) / (THREAD_BEADS - 1);
      const droop = (u) => -Math.sin(u * Math.PI) * 0.25;
      const p1 = _sa.clone().lerp(_sb, t1); p1.y += droop(t1);
      const p2 = _sa.clone().lerp(_sb, t2); p2.y += droop(t2);
      const o = i * 6;
      threadPos[o] = p1.x; threadPos[o + 1] = p1.y; threadPos[o + 2] = p1.z;
      threadPos[o + 3] = p2.x; threadPos[o + 4] = p2.y; threadPos[o + 5] = p2.z;
    }
    threadGeo.attributes.position.needsUpdate = true;

    // Thread beads: seat along the thread, denser near the sockets; on the FLEE they
    // SCATTER (the mournful "beads scattering behind it" read, CP1 gate directive 5).
    const fleeK = dyingK > 0 ? Math.max(0, dyingK - 0.35) / 0.65 : 0;
    for (let i = 0; i < N_BEAD; i++) {
      const u = beadU[i];
      const o = i * 3;
      const sc = beadScatter[i];
      beadPos[o] = _sa.x + (_sb.x - _sa.x) * u + sc[0] * fleeK * (2 + i * 0.3);
      beadPos[o + 1] = _sa.y + (_sb.y - _sa.y) * u - Math.sin(u * Math.PI) * 0.25 + sc[1] * fleeK * (2 + i * 0.2);
      beadPos[o + 2] = _sa.z + (_sb.z - _sa.z) * u + sc[2] * fleeK * (2 + i * 0.3);
    }
    beadGeo.attributes.position.needsUpdate = true;

    // --- The eyeless twin is ALWAYS the darker one: drive the holder's body glow
    // UP and the seeker's DOWN by who holds the eye now (§5d/§7b, live). ---
    const aHolds = 1 - Math.max(0, Math.min(1, holdT));   // 1 when A holds
    twinA.bodyMat.emissiveIntensity = (0.05 + aHolds * 0.22) * (1 - dyingK * 0.8);
    twinB.bodyMat.emissiveIntensity = (0.05 + (1 - aHolds) * 0.22) * (1 - dyingK * 0.8);
    // MOURNING GLOW (flee-death): the shared ember GUTTERS out and the glow retreats
    // into the empty SOCKET rings (HDR ×2.4-ish), the survivor's face — its body
    // stays charcoal (the custom fade never blows emissive) so it reads on the pale
    // sheet too (CP1 gate directive 5). Beads carry the last of the light.
    // Socket glow: the mourning ember at death + the DREAD "split light" (§5f, CP1
    // r3 directive 3). During the dread card BOTH sockets light (~50% of the eye's
    // intensity) — the eye splits its light — so the "Both Halves at Once" card reads
    // in glow before any bullet exists.
    // Idle socket base kept LOW (0.10) so the two seats read as dim HOLLOW rings and the
    // floating white-hot EYE is the sole bright holder-marker — not "two near-identical
    // orange rings" that hid which twin holds the eye (CP1 r8 dir 3). Mourning/dread/notice
    // still tick it up.
    socketMat.emissiveIntensity = 0.10 + dyingK * 2.4 + dreadSplit * 1.1 + (noticeT > 0.4 ? 0.5 : 0);
    beadMat.opacity = 0.85 * (1 - dyingK * 0.3) + fleeK * 0.15;
    // DREAD "split light" (CP1 r5 directive 1): a second HDR core ignites inside the
    // SEEKER's empty socket and the thread beads overdrive to HDR — the eye's light
    // visibly travels the thread to BOTH sockets. The holder core dims to ~0.7× so it
    // reads as SPLIT, not doubled. Off (invisible) outside the dread card.
    if (dreadSplit > 0.05) {
      const seekerSock = aHolds > 0.5 ? _sb : _sa;
      splitCore.visible = true;
      // Seat it PROUD of the seeker socket (toward camera) so the seeker body/collar can't
      // occlude it, and drive it WHITE-HOT (scalar ~9, matching the eye's catchlight) so its
      // bloom cluster peaks ≥240 — a real second core, not a dim socket-ring tint. Prior
      // pass read only 161 lum (a peach C-ring); dread was indistinguishable from charge.
      splitCore.position.set(seekerSock.x, seekerSock.y + 0.04, seekerSock.z + 0.4);
      splitMat.color.setRGB(1, 0.945, 0.878).multiplyScalar(3.2 + dreadSplit * 6.2);
      splitCore.scale.setScalar(0.9 + dreadSplit * 0.6);
      beadMat.color.copy(new THREE.Color(0xffb890)).multiplyScalar(1 + dreadSplit * 2.2);   // light travels the thread
    } else {
      splitCore.visible = false;
      beadMat.color.copy(new THREE.Color(glow));
    }
    // Lift the aged-silver rims + crest so the fleeing MOURNER is a visible BODY on
    // the dark flee frame (not a charcoal ghost) — CP1 r2 directive 3. The diffuse
    // stays charcoal; only the rim/fin emissive rises.
    silverMat.emissiveIntensity = 0.30 + dyingK * 0.4;
    // The rim tiers + the inverted-hull OUTLINE tiers hold their LIT-SILHOUETTE base (holder
    // hot / seeker dim-but-legible) and rise as the mourner flees so the survivor stays a
    // visible line-drawing. The outline is the dominant silhouette edge (directive 2).
    rimHolderMat.emissiveIntensity = 0.9 + dyingK * 0.35;
    rimSeekerMat.emissiveIntensity = 0.6 + dyingK * 0.25;
    outlineHolderMat.emissiveIntensity = 1.15 + dyingK * 0.4;
    outlineSeekerMat.emissiveIntensity = 0.75 + dyingK * 0.3;

    // --- §5j MATERIALISE dissolve. finMat/sockMat are per-twin clones (buildTwin), so mirror the
    // shared silver/socket emissive onto them, then fade EVERY fadeMat by the twin's materialise
    // factor. A fast edge SHIMMER (twinkle that fades out as it solidifies) + a brightening outline
    // sell "materialising into being", not a flat crossfade. Opacity 1 (opaque) outside the entrance. ---
    for (const w of [twinA, twinB]) {
      w.finMat.emissiveIntensity = silverMat.emissiveIntensity;
      w.sockMat.emissiveIntensity = socketMat.emissiveIntensity;
    }
    // Only the ENTRANCE drives opacity; outside it, the boss's own setDissolve (spawn/death,
    // which owns every tracked material's opacity) is left untouched — the materialise finished
    // at opacity 1, so the fight/death fade take over cleanly.
    if (entranceU != null) {
      const shimmer = (mat, ph) => {
        const f = 0.5 + 0.5 * Math.sin(time * 26 + ph);                  // fast twinkle
        return Math.max(0, Math.min(1, mat * (1 - (1 - mat) * 0.55 * f)));  // flickers while forming, → 1 solid
      };
      const oA = shimmer(entMatA, 0), oB = shimmer(entMatB, 3.7);
      for (const m of twinA.fadeMats) m.opacity = oA;
      for (const m of twinB.fadeMats) m.opacity = oB;
      // the resolving EDGE glows brighter the less-formed it is (the shimmer's own light)
      outlineHolderMat.emissiveIntensity += (1 - entMatA) * 1.8;
      outlineSeekerMat.emissiveIntensity += (1 - entMatB) * 1.4;
      const eyeOp = shimmer(entMatA, 1.5);   // the EYE materialises WITH twinA (holder) — never pre-exists
      orbMat.opacity = irisMat.opacity = pupilMat.opacity = glintMat.opacity = eyeOp;
    }

    // --- Gaze: the HELD eye tracks the player with lag + look-aways (a mind, not a
    // turret). Eye-lock hard-tracks during notice/charge. ---
    nextLookAway -= dt;
    if (lookAwayT > 0) lookAwayT -= dt;
    else if (nextLookAway <= 0 && charge < 0.2 && noticeT <= 0 && dyingK <= 0 && entranceU == null) {   // §5j: the eye LOCKS on the dragon through the entrance — no idle look-aways
      lookAwayT = 0.6 + Math.random() * 0.5; lookAwayX = (Math.random() - 0.5) * 1.4; lookAwayY = Math.random() * 0.4 - 0.15;
      nextLookAway = 5 + Math.random() * 5;
    }
    const gx = lookAwayT > 0 ? lookAwayX : gazeTX;
    const gy = lookAwayT > 0 ? lookAwayY : gazeTY;
    const gLag = (noticeT > 0 || charge > 0.5) ? 10 : 4.5;
    gazeX += (gx - gazeX) * Math.min(1, dt * gLag);
    gazeY += (gy - gazeY) * Math.min(1, dt * gLag);

    // --- Blink-analog: the eye TUCKS shut into its holder's body for a beat (the
    // orb shrinks + pulls back toward the socket, the iris closes over it). ---
    if (blinkT > 0) blinkT -= dt;
    else { nextBlink -= dt; if (nextBlink <= 0 && charge < 0.5 && noticeT <= 0 && dyingK <= 0 && entranceU == null) { blinkT = BLINK_DUR; nextBlink = 3.5 + Math.random() * 3; } }
    const blinkProg = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;

    if (painT > 0) painT -= dt;
    if (noticeT > 0) noticeT -= dt;

    // --- The eye brightness/size: white-hot focal in every state; leashes dim under
    // a shield (G6); pupil constricts on charge (the tell); tucks on blink. ---
    const flicker = 0.9 + Math.sin(time * 4.5) * 0.07 + Math.sin(time * 12) * 0.03;
    // Sclera stays MODERATE in every state (the charge tell is the PUPIL + glint, not
    // a sclera blow-up) so its bloom never floods the pupil; dips further mid-glide
    // (CP1 r2 directive 1). The glint carries the G1 focal peak, not the sclera.
    const gliding = Math.abs(holdTarget - Math.max(0, Math.min(1, holdT))) > 0.05;
    // Under shield the eye stays HOT and OPEN — EITHERWING's parry job is ORGAN BREAK on
    // the eye-holder (§5f), so the shielded frame MUST still answer "who fires next": the
    // white-hot orb + catchlight mark the holder inside the leashed (dim-shell) bubble.
    // NOT a dead eye (CP1 r8 dir 1 — the r7 shell-cut inverted the focal into a dead eye).
    let eyeK = shieldClamp ? 0.7 : flicker * (1 + charge * 0.12);
    if (noticeT > 0) eyeK *= 1.4;   // the eye SNAPS bright on notice (the ignition beat — CP1 r4 directive 2)
    if (gliding) eyeK *= 0.78;
    eyeK *= Math.max(0, 1 - dyingK * 1.7);   // the shared ember GUTTERS OUT by the flee (the glow retreats into the socket ring)
    orbMat.color.copy(EYE_BASE).multiplyScalar(Math.max(0.02, eyeK) * EYE_HOT);
    // Under shield the catchlight stays a VISIBLE hot pinpoint (marks the holder — the
    // eye is not dead, CP1 r8 dir 1) but LEASHED to ~0.5 so its bloom cluster stays under
    // 70% of the idle peak (G6 law: the focal damps when invulnerable — you can still see
    // WHO holds the eye, but it reads as banked, not firing).
    glintMat.color.setScalar(GLINT_HOT * Math.max(0.05, (shieldClamp ? 0.62 : 1) * (1 - dyingK) * (dreadSplit > 0.05 ? 0.7 : 1)));
    const tuck = blinkProg * 0.8 + (shieldClamp ? 0.08 : 0);   // barely tucked under shield — the eye stays wide/alert so the holder reads
    // Under shield the orb ENLARGES so the eye is unmistakably the hottest point INSIDE the
    // cage — the caged twin is the parry target, and the bright dotted cage seams must not
    // out-read it (REACH gate directive 5). Glint 0.62× keeps the bloom cluster under G6's leash.
    orb.scale.setScalar(Math.max(0.1, 1 - tuck * 0.7 + (noticeT > 0.5 ? 0.2 : 0) + (shieldClamp ? 0.3 : 0)));
    // ONE-GLOW LAW (§5d L140): outside the dread card the HELD EYE is the pair's only glow.
    // The corona flare is a DREAD-ONLY light (not a per-charge glow) — the normal charge
    // tell is carried by SHAPE (crest rake + taut tails) + the pupil constricting + the eye
    // pinning to the firer, none of which add a second light source. The iris keeps its
    // dim base 0.85 (it's part of the eye), and only blooms wide during dread.
    irisMat.emissiveIntensity = 0.85 + dreadSplit * 1.7 + (shieldClamp ? 0.7 : 0);   // brighter peach ring under shield so the eye reads through the cage (dir 5)
    iris.scale.setScalar(1 + tuck * 0.25 + dreadSplit * 0.28);
    glint.visible = tuck < 0.6 && dyingK < 0.4;   // the catchlight winks out on a blink/tuck, and EARLY in death (the ember guts; the glow retreats to the socket ring)
    // Pupil: constricts on charge/notice (the charge tell), tracks the player, and on
    // a HANDOFF biases toward the RECEIVING twin so the eye LOOKS where it's going
    // (CP1 r2 directive 2). Death dilates it (§4b: dilation = death).
    const pupilBase = 1 - charge * 0.4 - (noticeT > 0.4 ? 0.3 : 0) + dyingK * 0.6;
    pupil.scale.setScalar(Math.max(0.4, pupilBase) * (1 - tuck * 0.5));
    const recv = holdTarget > 0.5 ? _sb : _sa;
    const glideBiasX = gliding ? Math.max(-1, Math.min(1, (recv.x - _eye.x) * 0.6)) * 0.07 : 0;
    pupil.position.set(gazeX * 0.08 + glideBiasX, gazeY * 0.07, 0.16 - tuck * 0.14);
    glint.position.set(-0.09 + gazeX * 0.05, 0.1 + gazeY * 0.04, 0.44);
    // §5j: through the entrance the whole eye TURNS to face the dragon (not just the pupil) — it
    // pivots on the ribbon toward the gaze target as it rides from twinA to twinB, so it stays
    // dragon-facing and readable across the cross. The script feeds a strong dragon-tracking gaze;
    // here the eyeRig tilts with it. Outside the entrance the eye keeps its shipped forward set.
    if (entranceU != null) eyeRig.rotation.set(-gazeY * 0.9 - 0.12, gazeX * 1.1, 0);
    else eyeRig.rotation.set(0, 0, 0);

    // --- The twins' fins/ribbons pose by charge (EXPRESSION, §4b): open-glide idle,
    // mantle on charge (fins rake up + ribbons flare), furl in death. Plus the flinch
    // (the holder recoils; the eyeless twin darts protectively closer). ---
    for (const w of [twinA, twinB]) {
      const isHolder = (w === twinA) ? aHolds > 0.5 : aHolds <= 0.5;
      // Flinch: holder recoils back (−z), the OTHER twin darts toward centre.
      const recoil = (painT > 0 && ((painTwin === 0) === (w === twinA))) ? (painT / 0.34) * 0.6 : 0;
      const dart = (painT > 0 && ((painTwin === 0) !== (w === twinA))) ? (painT / 0.34) * 0.5 : 0;
      w.twin.position.z -= recoil;
      w.twin.position.x *= (1 - dart * 0.4);   // the protective twin pulls inward

      // Ribbon flow: the standing-wave base curve + a TRAVELLING wave (animated)
      // that eases in with LAG so the ribbon trails the body (the §7b flow law).
      // Charge/setpiece flare the amplitude; death furls the tails down.
      // On CHARGE the holder's tail SNAPS TAUT (the standing wave collapses, the ribbon
      // goes rigid/straight — the "about to fire" tension tell, CP1 r7 dir 4); setpiece
      // still flares the amplitude. straighten pulls the base curve + sway toward zero.
      // DREAD vs CHARGE must not look alike (REACH gate directive 1). CHARGE owns the
      // TAUT-TAILS tell — but during the DREAD card the tails FLARE WIDE instead (both
      // twins spread + locked), so the two tells read distinctly. straighten is gated OFF
      // by dreadSplit; the dread flare spreads the chain.
      const straighten = (isHolder ? charge : charge * 0.4) * (1 - dreadSplit);
      const flare = setpieceK * 0.22 + dreadSplit * 0.34;
      // The death FURL curls each joint the SAME way so the ~8-joint chain rolls into a
      // TIGHT COIL near the root by the flee — the extended tails otherwise dominate the
      // §7c auto-fit box and shrink the survivor's body/socket to ~20% (CP1 r7 dir 2+3).
      // Ramp ×1.6 so the coil is complete by the flee capture (dyingK≈0.72).
      const furlK = clamp(dyingK * 1.6, 0, 1);
      for (const tail of w.ribbons) {
        const chain = tail.segs;
        for (let s = 0; s < chain.length; s++) {
          const seg = chain[s];
          const anim = Math.sin(time * 1.7 + seg.wave + w.sx) * (0.1 + flare) * (1 + s * 0.12) * (1 - straighten);
          const furl = furlK * (0.5 + s * 0.06);
          // Cap the PER-JOINT bend to ±0.5 rad so the tail flows as one continuous
          // ribbon; the uniform-sign furl still coils it tight at death.
          const targetZ = clamp(seg.baseZ * (1 - straighten) + anim * (1 - furlK) + furl * 0.6, -0.5, 0.5);
          const targetX = clamp(seg.baseX * (1 - straighten) + anim * 0.5 * (1 - furlK) + furl, -0.5, 0.5);
          const ease = Math.min(1, dt * (2.2 + s * 0.4));   // lag: the tip trails the root
          seg.swayZ += (targetZ - seg.swayZ) * ease;
          seg.swayX += (targetX - seg.swayX) * ease;
          seg.pivot.rotation.z = seg.swayZ;
          seg.pivot.rotation.x = seg.swayX;
        }
      }
      // Fins mantle up on charge; the HOLDER's crest RAKES HARD (−0.75 rad) as it winds
      // to fire (CP1 r7 dir 4 — the raised-crest half of the charge tell); SNAP OPEN
      // ≥0.4 rad on notice (the reveal beat, CP1 r4 dir 2); furl down in death.
      const fin = w.twin.getObjectByName('crescentFin');
      if (fin) fin.rotation.x = -0.1 - charge * 0.75 * (isHolder ? 1 : 0.4) - (noticeT > 0.4 ? 0.55 : 0) + dyingK * 0.5;

      // Rebuild the deforming comet-tail strips from the now-posed pivot chains (1 draw
      // per tail). The twin's own transform (orbit pose + flinch above) is final for this
      // frame, so its world matrix is current.
      w.twin.updateMatrixWorld(true);
      _twinInv.copy(w.twin.matrixWorld).invert();
      for (const tail of w.ribbons) updateTailStrip(tail, w.twin, _twinInv);
    }

    // --- Ember motes drift near the thread midpoint (dark, dim — §3 law 8). They
    // WINK OUT at the flee (dyingK≥0.7) along with the scattered thread beads, so the
    // ONLY debris on the lone-survivor frame is the snapped bead-thread arc off the
    // socket (CP1 r4 directive 4 — the motes read as clinging confetti otherwise).
    const debrisGone = dyingK >= 0.7;
    beads.visible = !debrisGone;
    const mid = _sa.clone().lerp(_sb, 0.5);
    for (const o of orbiters) {
      o.visible = !debrisGone;
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(mid.x + Math.cos(u.ang) * u.radius, mid.y + Math.sin(time + u.tilt) * 0.4, mid.z + Math.sin(u.ang) * u.radius * 0.5);
      o.rotation.x += dt * 1.6; o.rotation.y += dt * 1.2;
    }

    // Idle: a slow shared breath on the rig (root never animates — placeGroup owns it).
    rig.rotation.z = Math.sin(time * 0.4) * 0.01;

    // Muzzle follows the eye-holder (a stable controller ref for FX; §5d).
    const holderPos = aHolds > 0.5 ? twinA.twin.position : twinB.twin.position;
    muzzle.position.set(holderPos.x, holderPos.y, holderPos.z + BODY_LEN * 0.5);
  }

  // Muzzle: fire originates from the eye-holder (updated each tick). On `group`
  // (not `rig`) so it ignores idle motion — the stable controller ref.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0, 2.2);
  group.add(muzzle);

  // ---- §7b per-sheet diagnostics (the builder DECLARES them; tests/boss.mjs
  // asserts on them) + test/studio pins. ----
  function eyeWorldLocalPos() { return eyeRig.position.clone(); }        // eye position in rig space
  function twinSeparation() { return twinA.twin.position.distanceTo(twinB.twin.position); }
  function threadLength() { return _sa.distanceTo(_sb); }                // live socket-to-socket length
  function setDebugHandoff(t) { debugHold = t == null ? null : Math.max(0, Math.min(1, t)); }
  // §5j THE BATON CROSS: the entrance driver sets the 0..1 clock each frame (null = fight).
  // The rig-local x the eye crosses to (twinA RIGHT +8 → twinB LEFT −8) so the driver can
  // feed the ORB's world-x to the camera + the dragon-look strain.
  function setEntrance(u) { entranceU = u == null ? null : Math.max(0, Math.min(1, u)); }
  function entranceEyeLocalX() { return entranceU == null ? 0 : (1 - 2 * easeK(clamp((entranceU - 0.34) / 0.28, 0, 1))) * 9; }
  function twinBodyLum() {
    // The rendered value of each twin body (diffuse + emissive) — the seeker must be
    // measurably darker (§7b). Diffuse luminance + emissive contribution.
    const lum = (m) => { const c = m.color; return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) + m.emissiveIntensity * 0.5; };
    return { A: lum(twinA.bodyMat), B: lum(twinB.bodyMat) };
  }

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge,
    setAttackTell,
    setSetpiece,
    setGaze,
    notice,
    setEntrance, entranceEyeLocalX,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: flinchFlash,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    // §7b diagnostics + test/studio pins (not part of the controller contract).
    eyeWorldLocalPos, twinSeparation, threadLength, setDebugHandoff, twinBodyLum,
    dispose() {
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    },
  };
}
