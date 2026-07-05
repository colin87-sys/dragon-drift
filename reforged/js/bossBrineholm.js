import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// BRINEHOLM — "The Island That Breathes" (BOSS-DESIGN.md §5b/§5d slot 8, a Tier-3
// CALAMITY, the band's RELIEF texture). A bound ORGANIC LEVIATHAN: an island-sized
// whale that surfaces FACING you. Its scale IS that it never fully fits the frame
// (the SotC first-colossus read). It is SHACKLED, not hostile, and it HESITATES
// before dying (the §5c relationship beat).
//
// ORIENTATION (the load-bearing fix, owner call): the boss faces the player (+Z),
// and the front-on view is the WHOLE fight. So the HEAD + EYE own the +Z face —
// the eye is the dominant focal you actually look at, NOT a detail on a flank.
// The wide barnacled BACK is a low island that spans OFF both frame edges and
// sinks below (bottom-anchored, into the fog) — that is where "never fits the
// frame" lives. First build put the body broadside (a ship's flank); this one
// surfaces the head toward you.
//
// SILHOUETTE-FIRST (§3.1): one sentence — "a kelp-black leviathan head surfacing
// from a barnacled island-back that runs off both edges of the screen, one pale
// lidded eye watching you." Organic, rounded-but-landmarked (brow / blunt snout /
// heavy jaw / dorsal fins / arched back) so it reads as a WHALE, not a blob.
// Distinct from every prior slot: not a mask (1), ring-eye (2), raptor (3),
// skeleton (4), twin darts (5), arch (6), or swarm (7) — a surfacing leviathan.
//
// THE EYE (§4b, the carrier + the fight): a heavy stone-hard LID (a whale's brow)
// grinds up to reveal a pale HDR eye + an abalone iris ring, then grinds shut.
// CHIP DAMAGE ONLY LANDS WHILE THE EYE IS UP — the surfacing IS the turn-taking
// tell (§5f law 5). The white eye is THE one focal (§3.2); it sits front-and-
// upper on the head, dominant in the fight view.
//
// PALETTE (registry slot 8): KELP-BLACK organic hide 0x0c1210 with ABALONE 2-TONE
// bio-luminescent BANDING (sea-green dominant + nacre-violet) — the THROAT PLEATS
// (a rorqual's ventral grooves, under the jaw) and a FLANK stripe down the back.
// The banding is the lit-edge area that sells the near-black hide on every sky
// (L140). The eye is pale-white (the one focal). No accent enters danger-magenta.
//
// THE SCAR (§3.6, one asymmetric break): one snapped shackle fused into the BROW
// beside the eye — a torn iron ring + a raw pale gouge where a chain wrenched free
// ("Same forge as the hunter's chains" — the ASHTALON lore hook, point never answer).
//
// FACELESS-CARRIER LAW (§4b): GAZE (the iris eases toward you while surfaced, a
// slow tide — never continuous tracking, slot 14's claim) / BLINK (the lid dips) /
// CHARGE (the dorsal fins FLARE + the eye grinds fully open) / EXPRESSION (raised
// fins + lid = mood) / FLINCH (the head heaves, banding shivers) / NOTICE (the lid
// FLINGS wide, the iris flares, the fins startle, the banding surges) / DEATH
// (no explosion — the fins fold, the eye eases shut, the banding dims to a last
// tide and the head SETTLES back beneath the fog).
//
// DESTRUCTIBLE SHACKLE POSTS (§5f CAVE law — mercy as a mechanic): the shackle
// posts on its back are individually breakable (reuses slot 6's per-part hit
// test). Parry a post's amber strain-volley 3× (or shoot it) and it SNAPS,
// venting a pink SPRAY-SOAK graze beat; each post freed EARLY softens phase 3.
//
// CONTRACT: boss.js stomps `group.rotation` (placeGroup) and `kit.setDissolve`
// owns `group.scale` — every animated part lives on `rig`, the finPivots, the
// eyeLidPivot, the shacklePivots, or the drift orbiters; never on `group` itself.

export function buildBrineholm(def, quality = 1) {
  const accent = def.accent ?? 0x3ad0b0;   // abalone sea-green — the dominant banding tone (identity hue)
  const accent2 = 0x7d7ad8;                 // nacre-violet — the second banding tone (the iridescent shift)
  const glow = def.glow ?? 0xbfe6dd;        // pale abalone-white (shield rim / shards / eye backlight)
  const lowQ = quality < 0.75;
  const strip = stripForMerge;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (v) => clamp(v, 0, 1);

  // The shield wraps the WEAK POINT — the surfacing eye (focal = weak point). The
  // eye sits high-front on the head; the bubble centres on it. hpBarScale counters
  // the big def.scale so the bar stays roster-width; hpBarY clears the tallest fin.
  const kit = createBossCommon(def, quality, {
    shieldRadius: 5.2, shieldY: 3.4, hpBarY: 8.2, hpBarZ: 4.5, hpBarScale: 0.62,
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
  // Tier-split a deformed geometry into per-height value tiers (one draw each) so
  // the near-black hide reads as a lit, arched form under the front sun (§3.4),
  // not a flat black sticker. Returns { deep, mid, back } non-indexed geos.
  function tierSplit(g, loY, hiY) {
    const src = g.attributes.position, nsrc = g.attributes.normal;
    const buckets = { deep: [], mid: [], back: [] };
    for (let i = 0; i < src.count; i += 3) {
      const cy = (src.getY(i) + src.getY(i + 1) + src.getY(i + 2)) / 3;
      const t = cy < loY ? 'deep' : cy < hiY ? 'mid' : 'back';
      for (let k = 0; k < 3; k++) buckets[t].push(i + k);
    }
    const sub = (idxs) => {
      const geo = new THREE.BufferGeometry();
      const a = new Float32Array(idxs.length * 3), nn = new Float32Array(idxs.length * 3);
      for (let j = 0; j < idxs.length; j++) {
        const i = idxs[j];
        a[j * 3] = src.getX(i); a[j * 3 + 1] = src.getY(i); a[j * 3 + 2] = src.getZ(i);
        nn[j * 3] = nsrc.getX(i); nn[j * 3 + 1] = nsrc.getY(i); nn[j * 3 + 2] = nsrc.getZ(i);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(a, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nn, 3));
      return geo;
    };
    return { deep: sub(buckets.deep), mid: sub(buckets.mid), back: sub(buckets.back) };
  }

  // ==================================================================
  // MATERIALS — painted value tiers on KELP-BLACK organic hide (§3.4).
  // ==================================================================
  const hideDeepMat = track(new THREE.MeshStandardMaterial({   // wet underside / belly (darkest)
    color: 0x070c0b, emissive: 0x060f0d, emissiveIntensity: 0.05, roughness: 0.95, metalness: 0.03, flatShading: true,
  }));
  const hideMat = track(new THREE.MeshStandardMaterial({       // the body of the hide
    color: 0x0c1210, emissive: 0x0a1512, emissiveIntensity: 0.10, roughness: 0.9, metalness: 0.04, flatShading: true,
  }));
  const hideBackMat = track(new THREE.MeshStandardMaterial({   // the lit crest of the back / brow (one step up)
    color: 0x16211e, emissive: 0x14231f, emissiveIntensity: 0.15, roughness: 0.88, metalness: 0.04, flatShading: true,
  }));
  // ABALONE BANDING — the identity. Two emissive tones (sea-green + nacre-violet).
  const bandAMat = track(new THREE.MeshStandardMaterial({
    color: 0x08110f, emissive: accent, emissiveIntensity: 0.85, roughness: 0.55, metalness: 0.0, flatShading: true,
  }));
  const bandBMat = track(new THREE.MeshStandardMaterial({
    color: 0x0a0a14, emissive: accent2, emissiveIntensity: 0.78, roughness: 0.55, metalness: 0.0, flatShading: true,
  }));
  // FLESHY DORSAL FIN — kelp-black membrane with an abalone-lit trailing edge.
  const finMat = track(new THREE.MeshStandardMaterial({
    color: 0x0b1513, emissive: 0x0c1a17, emissiveIntensity: 0.16, roughness: 0.82, metalness: 0.04, flatShading: true, side: THREE.DoubleSide,
  }));
  const finEdgeMat = track(new THREE.MeshStandardMaterial({
    color: 0x09110f, emissive: accent, emissiveIntensity: 0.7, roughness: 0.5, metalness: 0.0, flatShading: true, side: THREE.DoubleSide,
  }));
  // Bound iron — the shackle posts + chain (a cold dark metal).
  const ironMat = track(new THREE.MeshStandardMaterial({
    color: 0x1a1c20, emissive: 0x101216, emissiveIntensity: 0.05, roughness: 0.55, metalness: 0.55, flatShading: true,
  }));
  // The dark EDGE CAGE (keeps the faceted hide from reading as a smooth blob).
  const cageMat = track(new THREE.LineBasicMaterial({
    color: 0x040807, transparent: true, opacity: 0.85, depthWrite: false,
  }));

  // THE EYE materials (the L142 recipe — a lens sclera + iris ring + pupil + a
  // proud offset CATCHLIGHT that alone carries the G1 ≥250 pinpoint). All
  // toneMapped=false (survives the no-postfx fallback, L125 law 4); opaque (NOT
  // additive) so they bloom without counting toward the §2 overdraw budget (G7).
  const EYE_HOT = 1.35, CORE_HOT = 13.0;
  const EYE_BASE = new THREE.Color(0xd8efe8);
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xd8efe8 }));
  eyeMat.toneMapped = false; eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const eyeCoreMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  eyeCoreMat.toneMapped = false; eyeCoreMat.color.setScalar(CORE_HOT);
  const irisMat = track(new THREE.MeshStandardMaterial({
    color: 0x0a1512, emissive: accent, emissiveIntensity: 1.5, roughness: 0.4, metalness: 0.1, flatShading: true,
  }));
  const pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x03110e }));
  // the freed-shackle vent (pale abalone froth) + the raw-gouge tier
  const ventMat = track(new THREE.MeshStandardMaterial({
    color: 0x0a1512, emissive: accent, emissiveIntensity: 1.3, roughness: 0.5, metalness: 0.0, flatShading: true,
  }));
  const gougeMat = track(new THREE.MeshStandardMaterial({
    color: 0x2a3a34, emissive: 0x33463f, emissiveIntensity: 0.22, roughness: 0.85, metalness: 0.0, flatShading: true,
  }));

  // ==================================================================
  // GEOMETRY — local units; def.scale (≈1.5) turns them into arena presence.
  // +Z faces the player. The BODY is a wide low island-back (spans ±BODY_HX →
  // exceeds the frame); the HEAD rises from its front-centre toward the camera.
  // ==================================================================
  const BODY_HX = 13.0;      // half-width of the island-back (×scale ≈ ±19.5 world → off-frame)
  const BODY_HY = 3.4, BODY_HZ = 7.6;
  const BODY_CY = -0.6, BODY_CZ = -2.4;    // low + slightly behind the head

  // ---- THE BODY: a wide, low, arched, barnacled island-back. A deformed sphere:
  // stretched wide, flattened low, the belly deepened (it sinks off-frame/into the
  // fog), a gentle dorsal arch across the span. Split into value tiers.
  const bodyBase = new THREE.SphereGeometry(1, lowQ ? 22 : 32, lowQ ? 14 : 20);
  {
    const pos = bodyBase.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.x *= BODY_HX; v.y *= BODY_HY; v.z *= BODY_HZ;
      if (v.y < 0) v.y *= 1.8;                                   // deepen the belly (bottom-anchored)
      const tx = clamp(v.x / BODY_HX, -1, 1);
      v.y += Math.cos(tx * 1.3) * 1.1 * clamp01(v.y / BODY_HY + 0.3);   // a broad dorsal arch across the back
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    bodyBase.computeVertexNormals();
    bodyBase.deleteAttribute('uv');
  }
  const bodyFull = strip(bodyBase);
  bodyFull.translate(0, BODY_CY, BODY_CZ);
  const bodyT = tierSplit(bodyFull, BODY_CY - 0.6, BODY_CY + 1.6);
  const bodyDeep = new THREE.Mesh(bodyT.deep, hideDeepMat); bodyDeep.name = 'brineHull';
  const bodyMid = new THREE.Mesh(bodyT.mid, hideMat);
  const bodyBack = new THREE.Mesh(bodyT.back, hideBackMat);
  rig.add(bodyDeep, bodyMid, bodyBack);

  // barnacle-clump relief across the back (authored, mirrored — §3.6 intent).
  const reliefParts = [];
  const N_CLUMP = lowQ ? 6 : 11;
  for (let i = 0; i < N_CLUMP; i++) {
    const tx = -0.85 + (i / (N_CLUMP - 1)) * 1.7;
    const x = tx * BODY_HX;
    const topY = BODY_CY + (BODY_HY - Math.abs(tx) * 1.4) + Math.cos(tx * 1.3) * 1.1;   // ride the arched top
    const c = strip(new THREE.ConeGeometry(0.3 + (i % 3) * 0.08, 0.55, 5));
    c.translate(x, topY - 0.2, BODY_CZ + 1.2 + (i % 2) * 1.4);
    reliefParts.push(c);
  }
  const relief = new THREE.Mesh(mergeBh(reliefParts, 'relief'), hideDeepMat);
  relief.name = 'hullRelief';
  rig.add(relief);

  // ---- THE HEAD: a blunt organic leviathan head rising front-centre, facing +Z
  // and tilted up (surfacing, watching you). A deformed ellipsoid (cranium →
  // blunt snout) with a heavy BROW bump over the eye and a lower JAW.
  const HEAD_CY = 2.7, HEAD_CZ = 3.6;
  const headBase = new THREE.SphereGeometry(1, lowQ ? 20 : 28, lowQ ? 14 : 20);
  {
    const pos = headBase.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.x *= 3.5; v.y *= 2.9; v.z *= 4.6;               // width / height / length (snout forward)
      const tz = clamp(v.z / 4.6, -1, 1), ty = v.y / 2.9;
      // blunt-taper the snout toward the camera (a whale muzzle, not a ball)
      if (tz > 0.15) { const s = tz - 0.15; v.x *= (1 - s * 0.45); v.y *= (1 - s * 0.32); }
      // flatten the MELON crown (a broad whale forehead, not a sphere top)
      if (ty > 0.68) v.y = 2.9 * 0.68 + (v.y - 2.9 * 0.68) * 0.55;
      // heavy BROW SHELF jutting forward + up over the eye (the dread whale brow)
      if (ty > 0.3 && tz > -0.1) { v.z += (ty - 0.3) * (tz + 0.1) * 1.6; v.y += (ty - 0.3) * 0.7; }
      // the JAW juts FORWARD + widens at the bottom-front (the maw)
      if (ty < -0.3 && tz > -0.3) { v.z += (-ty - 0.3) * 0.9; v.x *= 1.12; v.y *= 1.08; }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    headBase.computeVertexNormals();
    headBase.deleteAttribute('uv');
  }
  const headFull = strip(headBase);
  headFull.translate(0, HEAD_CY, HEAD_CZ);
  const headT = tierSplit(headFull, HEAD_CY - 1.0, HEAD_CY + 1.4);
  const headDeep = new THREE.Mesh(headT.deep, hideDeepMat); headDeep.name = 'brineHead';
  const headMid = new THREE.Mesh(headT.mid, hideMat);
  const headBrow = new THREE.Mesh(headT.back, hideBackMat);   // the lit brow/crown tier
  rig.add(headDeep, headMid, headBrow);

  // ---- THROAT PLEATS (the abalone banding, ventral) — a rorqual's grooves under
  // the jaw, glowing 2-tone abalone (sea-green + nacre-violet, interleaved 2:1 so
  // the sea-green stays G3-dominant). The lit-edge that carries the near-black
  // head on every sky (L140); emissive-on-standard, not an additive shell (L124).
  function pleatSegs(pick, mat, label) {
    const parts = [];
    const segs = lowQ ? 9 : 15;
    for (let i = 0; i < segs; i++) {
      if (!pick(i)) continue;
      const tx = -0.85 + (i / (segs - 1)) * 1.7;    // across the throat
      const ang = tx * 0.95;                        // fan the grooves around the throat's curve
      const groove = strip(new THREE.BoxGeometry(0.3, 2.0, 0.2));
      groove.rotateX(-0.6);                         // tilt to face down-and-forward
      groove.rotateZ(ang * 0.45);                   // splay outward at the sides
      groove.translate(
        Math.sin(ang) * 2.9,                                  // arc across
        HEAD_CY - 2.0 - Math.abs(tx) * 0.35,                  // dip lower at the throat centre
        HEAD_CZ + 2.7 + Math.cos(ang) * 0.7 - Math.abs(tx) * 0.4,   // wrap: recede at the sides
      );
      parts.push(groove);
    }
    return new THREE.Mesh(mergeBh(parts, label), mat);
  }
  const pleatA = pleatSegs((i) => i % 3 !== 2, bandAMat, 'throatPleatA'); pleatA.name = 'abaloneBandA';
  const pleatV = pleatSegs((i) => i % 3 === 2, bandBMat, 'throatPleatV'); pleatV.name = 'abaloneBandV';
  rig.add(pleatA, pleatV);
  // FLANK STRIPE — a 2-tone abalone line running the length of the island-back's
  // waterline (doubles the lit-edge area; reads the span on the bright skies).
  function flankSegs(pick, mat, label) {
    const parts = [];
    const segs = lowQ ? 16 : 26;
    for (let i = 0; i < segs; i++) {
      if (!pick(i)) continue;
      const tx = -0.92 + (i / (segs - 1)) * 1.84;
      const seg = strip(new THREE.BoxGeometry((BODY_HX * 2 / segs) * 1.05, 0.32, 0.24));
      seg.translate(tx * BODY_HX, BODY_CY + 1.0, BODY_CZ + BODY_HZ * 0.6 * (1 - Math.abs(tx) * 0.5));
      parts.push(seg);
    }
    return new THREE.Mesh(mergeBh(parts, label), mat);
  }
  const flankA = flankSegs((i) => i % 3 !== 2, bandAMat, 'flankA');
  flankA.name = 'abaloneBandFlankA';
  const flankV = flankSegs((i) => i % 3 === 2, bandBMat, 'flankV'); flankV.name = 'abaloneBandFlankV';
  rig.add(flankA, flankV);

  // ---- THE EYE ASSEMBLY (the L142 recipe, proven — reused, scaled up as the big
  // whale eye and seated front-upper on the head). socket → lens sclera → iris
  // ring → pupil → proud catchlight; a heavy brow-LID grinds up/down.
  const EYE_X = 1.2, EYE_Y = 3.3, EYE_Z = 6.7;   // front-upper of the head, the dominant focal
  const eyeRig = new THREE.Group();
  eyeRig.name = 'eyeRig';
  eyeRig.position.set(EYE_X, EYE_Y, EYE_Z);
  eyeRig.scale.setScalar(1.3);                   // the big surfacing eye
  rig.add(eyeRig);
  const socket = new THREE.Mesh(new THREE.CircleGeometry(1.55, lowQ ? 16 : 24), hideDeepMat);
  socket.name = 'eyeSocket'; socket.position.z = -0.05;
  eyeRig.add(socket);
  const sclGeo = new THREE.SphereGeometry(1.2, 20, 16); sclGeo.scale(1, 1, 0.34);
  const eyeball = new THREE.Mesh(sclGeo, eyeMat);
  eyeball.name = 'brineEye'; eyeball.position.z = 0.25;
  eyeRig.add(eyeball);
  const iris = new THREE.Mesh(strip(new THREE.TorusGeometry(0.92, 0.24, 8, lowQ ? 16 : 24)), irisMat);
  iris.name = 'brineIris'; iris.position.z = 0.7;
  eyeRig.add(iris);
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.62, lowQ ? 14 : 20), pupilMat);
  pupil.name = 'brinePupil'; pupil.position.z = 0.78; pupil.renderOrder = 5;
  eyeRig.add(pupil);
  const eyeCore = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), eyeCoreMat);
  eyeCore.name = 'eyeCore'; eyeCore.position.set(-0.26, 0.28, 0.98); eyeCore.renderOrder = 7;
  eyeRig.add(eyeCore);
  // the heavy brow-LID (hinged above, seated proud → covers when closed, lifts
  // up-and-back when it surfaces — a heavy hooded whale brow, never a floating slab).
  const eyeLidPivot = new THREE.Group();
  eyeLidPivot.name = 'eyeLidPivot';
  eyeLidPivot.position.set(0, 1.6, 1.15);
  const lidParts = [];
  const lid = strip(new THREE.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5));
  lid.scale(1.25, 1.1, 0.85); lid.rotateX(Math.PI); lid.translate(0, -0.7, 0.05);
  lidParts.push(lid);
  const browRidge = strip(new THREE.BoxGeometry(3.4, 0.5, 0.9));
  browRidge.rotateX(0.28); browRidge.translate(0, 0.05, 0.35);
  lidParts.push(browRidge);
  const lidMesh = new THREE.Mesh(mergeBh(lidParts, 'eyelid'), hideBackMat);
  lidMesh.name = 'eyeLid';
  eyeLidPivot.add(lidMesh);
  eyeRig.add(eyeLidPivot);

  // ---- THE DORSAL FIN-SAILS (4, fleshy, on named pivots) — curved organic fins
  // marching down the island-back behind/flanking the head. They sway on the
  // swell and FLARE on the charge/notice telegraph (§3.5; the gate finds
  // finPivot0..3). Kelp-black membrane with an abalone-lit leading edge.
  function finShape(h, w) {
    const s = new THREE.Shape();
    s.moveTo(-w * 0.5, 0);
    s.lineTo(w * 0.5, 0);
    s.quadraticCurveTo(w * 0.55, h * 0.55, w * 0.05, h * 0.92);   // curved trailing edge (a hooked dorsal fin)
    s.quadraticCurveTo(-w * 0.15, h * 0.7, -w * 0.5, h * 0.4);
    s.closePath();
    return s;
  }
  const FIN_X = [-9.2, -4.4, 4.8, 9.0];
  const FIN_H = [2.6, 3.6, 4.0, 2.8];
  const FIN_W = [2.2, 2.8, 3.0, 2.4];
  const finPivots = [];
  for (let i = 0; i < 4; i++) {
    const pivot = new THREE.Group();
    pivot.name = `finPivot${i}`;
    const tx = FIN_X[i] / BODY_HX;
    const topY = BODY_CY + (BODY_HY - Math.abs(tx) * 1.4) + Math.cos(tx * 1.3) * 1.1;
    pivot.position.set(FIN_X[i], topY - 0.2, BODY_CZ + 0.4);
    const geo = strip(new THREE.ExtrudeGeometry(finShape(FIN_H[i], FIN_W[i]), { depth: 0.18, bevelEnabled: false, steps: 1, curveSegments: lowQ ? 4 : 7 }));
    geo.translate(0, 0, -0.09);
    const fin = new THREE.Mesh(geo, finMat); fin.name = `finSail${i}`;
    pivot.add(fin);
    const edge = strip(new THREE.BoxGeometry(0.13, FIN_H[i] * 0.95, 0.22));
    edge.translate(FIN_W[i] * 0.34, FIN_H[i] * 0.5, 0.03); edge.rotateZ(-0.14);
    pivot.add(new THREE.Mesh(edge, finEdgeMat));
    rig.add(pivot);
    finPivots.push(pivot);
  }

  // ---- THE SHACKLE POSTS (3, destructible — §5f mercy mechanic). Broken iron
  // posts bound into the back, each with a snapped chain, on named shacklePivots
  // (they STRAIN as the amber volley charges). Parry ×3 (or shoot) → SNAP + vent.
  const SHACKLE_X = [-6.5, 0.5, 7.0];
  const shackleRigs = [];
  function buildShacklePost(i, x) {
    const pivot = new THREE.Group();
    pivot.name = `shacklePivot${i}`;
    const tx = x / BODY_HX;
    const topY = BODY_CY + (BODY_HY - Math.abs(tx) * 1.4) + Math.cos(tx * 1.3) * 1.1;
    pivot.position.set(x, topY - 0.3, BODY_CZ + 1.6);
    const postParts = [];
    const post = strip(new THREE.CylinderGeometry(0.28, 0.36, 2.3, 6)); post.translate(0, 1.15, 0);
    postParts.push(post);
    const ring = strip(new THREE.TorusGeometry(0.5, 0.14, 5, 10)); ring.rotateX(Math.PI / 2); ring.translate(0, 1.95, 0.2);
    postParts.push(ring);
    const postMesh = new THREE.Mesh(mergeBh(postParts, `shacklePost${i}`), ironMat);
    postMesh.name = `shacklePost${i}`;
    pivot.add(postMesh);
    const chainParts = [];
    for (let c = 0; c < 3; c++) {
      const link = strip(new THREE.TorusGeometry(0.24, 0.08, 4, 8));
      link.rotateX(c % 2 ? Math.PI / 2 : 0);
      link.translate(0.5 + c * 0.02, 1.95 - c * 0.42, 0.3 + c * 0.06);
      chainParts.push(link);
    }
    const chain = new THREE.Mesh(mergeBh(chainParts, `chain${i}`), ironMat);
    chain.name = `shackleChain${i}`;
    pivot.add(chain);
    rig.add(pivot);
    return { pivot, postMesh, chain, x, broken: false, strain: 0 };
  }
  for (let i = 0; i < SHACKLE_X.length; i++) shackleRigs.push(buildShacklePost(i, SHACKLE_X[i]));

  // ---- THE ONE SCAR (§3.6) — a snapped shackle fused into the BROW beside the
  // eye (a broken iron half-ring + a raw pale gouge) — the ASHTALON lore hook.
  const scarRing = strip(new THREE.TorusGeometry(0.55, 0.15, 5, 10, Math.PI * 1.25));
  scarRing.rotateX(Math.PI / 2); scarRing.rotateZ(0.6);
  scarRing.translate(EYE_X - 2.6, EYE_Y + 1.4, EYE_Z - 0.6);
  const scar = new THREE.Mesh(mergeBh([scarRing], 'scar'), ironMat);
  scar.name = 'brineScar';
  rig.add(scar);
  const gouge = new THREE.Mesh(strip(new THREE.BoxGeometry(1.1, 0.28, 0.24)), gougeMat);
  gouge.name = 'brineGouge';
  gouge.position.set(EYE_X - 2.2, EYE_Y + 0.9, EYE_Z - 0.1);
  gouge.rotation.z = -0.4;
  rig.add(gouge);

  // ---- THE EDGE CAGE (§5d) over the head + body crests.
  for (const [geoSrc, thresh] of [[headT.back, 24], [bodyT.back, 26]]) {
    rig.add(new THREE.LineSegments(new THREE.EdgesGeometry(geoSrc, thresh), cageMat));
  }

  // ---- DRIFT ORBITERS (≥2; §3.8 satellites stay dark) — torn kelp on the swell,
  // kept LOW + CLOSE to the waterline so they read as kelp, not sky-noise.
  const kelpGeo = strip(new THREE.BoxGeometry(0.38, 0.13, 0.8));
  const orbiters = [];
  const N_KELP = lowQ ? 2 : 4;
  for (let i = 0; i < N_KELP; i++) {
    const m = new THREE.Mesh(kelpGeo, i % 2 ? hideDeepMat : hideMat);
    m.name = 'driftKelp';
    m.userData = {
      ang: (i / N_KELP) * Math.PI * 2,
      rx: 8 + (i % 3) * 2.2, ry: 0.7 + (i % 2) * 0.35,
      cy: BODY_CY + 0.4 + (i % 2) * 0.4,
      speed: 0.09 + (i % 3) * 0.03, bob: 0.5 + (i % 2) * 0.4, spin: 0.18 + (i % 3) * 0.12,
    };
    rig.add(m);
    orbiters.push(m);
  }

  kit.flashBind(bandAMat, 0.85);
  kit.finalize();

  // ==================================================================
  // ANIMATION — the tidal breathing, the eye weak-point window, the fin flare,
  // the shackle strain/break, the entrance rise, and the mournful death.
  // ==================================================================
  let charge = 0;
  function setCharge(k) { charge = clamp01(k); }
  let tell = null;
  function setAttackTell(id) { tell = id || null; }
  let setpieceK = 0, dreadK = 0;
  function setSetpiece(k, sdef) { setpieceK = clamp01(k); dreadK = (sdef && sdef.dread) ? setpieceK : 0; }

  let eyeUp = 0, eyeUpTarget = 0, eyeAuto = true;
  function setEyeUp(k) { eyeAuto = false; eyeUpTarget = clamp01(k); }
  function eyeIsUp() { return eyeUp > 0.55; }

  let gazeTX = 0, gazeTY = 0, irisLock = false;
  function setGaze(nx, ny) { gazeTX = clamp(nx, -1, 1); gazeTY = clamp(ny, -1, 1); }

  const BLINK_DUR = 0.5;
  let blinkT = 0, nextBlink = 5 + Math.random() * 4;
  let noticeT = 0;
  function notice() { noticeT = 1.2; blinkT = 0; irisLock = true; }

  let painT = 0, painEase = 0;
  function flash(amt) { kit.flash(amt); }
  function hurt(amt) { if (amt > 0.3) painT = Math.max(painT, 0.35); }

  let entranceU = null;
  function setEntrance(u) {
    const was = entranceU != null;
    entranceU = u == null ? null : clamp01(u);
    if (entranceU != null && !was) { eyeAuto = false; eyeUpTarget = 0; irisLock = false; }
  }
  function setEntranceSteer() { /* the eye does not track during the entrance (§5d) */ }

  let shieldClamp = false;
  kit.onShieldChange((v) => { shieldClamp = v; if (v) { eyeAuto = false; eyeUpTarget = 0; } else eyeAuto = true; });

  // §5f DESTRUCTIBLE SHACKLE POSTS (reuses slot 6's per-part grammar).
  const brokenShackles = new Set();
  function crackShackle(idx) {
    if (idx == null || idx < 0 || idx >= shackleRigs.length || brokenShackles.has(idx)) return false;
    brokenShackles.add(idx);
    const s = shackleRigs[idx];
    s.broken = true;
    const dir = (idx % 2 ? 1 : -1);
    // the post SNAPS at half height and topples FORWARD toward the player (over
    // the crest, not lost behind it), the chain drops free.
    s.postMesh.rotation.set(-0.9, 0, dir * 0.7);
    s.postMesh.scale.y = 0.55;
    s.postMesh.position.set(dir * 0.5, -0.6, 1.2);
    s.chain.rotation.z = dir * 0.9;
    s.chain.position.set(dir * 0.4, -0.9, 1.4);
    const jag = new THREE.Mesh(strip(new THREE.ConeGeometry(0.34, 0.7, 5)), ironMat);
    jag.position.copy(s.pivot.position); jag.position.y += 0.5; jag.position.z += 1.0; jag.rotation.z = 0.4;
    jag.name = `shackleJag${idx}`;
    rig.add(jag);
    // the VENT — a tall bright abalone PLUME up-and-forward from the stump (the
    // SPRAY-SOAK marker; findable in a glance, still below eye value).
    const ventGroup = new THREE.Group();
    ventGroup.name = `shackleVent${idx}`;
    ventGroup.position.copy(s.pivot.position); ventGroup.position.y += 0.3; ventGroup.position.z += 1.6;
    for (let v = 0; v < 5; v++) {
      const froth = new THREE.Mesh(strip(new THREE.ConeGeometry(0.36 - v * 0.045, 1.0 + v * 0.4, 6)), ventMat);
      froth.position.set((v - 2) * 0.26, v * 0.62, 0.1); froth.rotation.z = (v - 2) * 0.15;
      ventGroup.add(froth);
    }
    rig.add(ventGroup);
    return true;
  }
  function shackleBroken(idx) { return brokenShackles.has(idx); }
  function liveShackles() { const o = []; for (let i = 0; i < shackleRigs.length; i++) if (!brokenShackles.has(i)) o.push(i); return o; }
  function shackleCount() { return shackleRigs.length; }
  function brokenCount() { return brokenShackles.size; }
  const _sc = def.scale ?? 1.5;
  function shackleHitTest(localX, localY) {
    const wx = localX / _sc, wy = localY / _sc;
    let best = -1, bd = 3.4;
    for (const i of liveShackles()) {
      const s = shackleRigs[i];
      const d = Math.hypot(wx - s.x, wy - (s.pivot.position.y + 1.9));
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

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

  let eyeGlow = 0, irisAngle = 0, gazeEX = 0, gazeEY = 0;

  function tickBody(dt, time) {
    // --- TIDAL BREATHING (the slowest idle in the roster, §5i TIDAL DRONE). ---
    if (painT > 0) painT -= dt;
    painEase += (Math.max(0, painT) - painEase) * Math.min(1, dt * 8);
    const swell = Math.sin(time * 0.32) * 0.5 + Math.sin(time * 0.13) * 0.3;
    const noticeK = noticeT > 0 ? clamp01(noticeT / 0.9) : 0;
    // The leviathan REARS its head as an attack winds up (the §3.5 telegraph — a
    // big silhouette change on the head, the dominant mass): rig pitches up + lifts.
    const rear = charge * 0.9 + noticeK * 0.5;
    rig.position.y = swell * 0.4 + painEase * Math.sin(time * 30) * 0.3 + rear * 1.3;
    rig.rotation.z = Math.sin(time * 0.22) * 0.01 + painEase * Math.sin(time * 26) * 0.012;
    rig.rotation.x = Math.sin(time * 0.18) * 0.006 - rear * 0.16;   // rear up

    // --- THE DORSAL FINS sway bow-to-stern on the swell, FLARE hard on charge/notice. ---
    for (let i = 0; i < finPivots.length; i++) {
      const p = finPivots[i];
      const wave = Math.sin(time * 0.5 - i * 0.7) * 0.5 + 0.5;
      const base = -0.1 + wave * 0.35;
      const flare = charge * 1.7 + dreadK * 0.5 + noticeK * 1.1;
      const submerge = (shieldClamp ? 0.6 : 0) + dyingK * 1.3;
      p.rotation.x = clamp(base - flare + submerge, -1.7, 0.9);
      p.scale.setScalar(clamp(1 - dyingK * 0.5, 0.4, 1));
    }

    // --- THE EYE WEAK-POINT WINDOW. ---
    if (eyeAuto && entranceU == null && dyingK <= 0) eyeUpTarget = (Math.sin(time * 0.34) > 0.2) ? 1 : 0;
    if (charge > 0.15 && !shieldClamp && dyingK <= 0 && entranceU == null) eyeUpTarget = 1;
    if (noticeT > 0 && !shieldClamp && dyingK <= 0 && entranceU == null) eyeUpTarget = 1;
    if (shieldClamp || dyingK > 0.05) eyeUpTarget = 0;
    if (entranceU != null) eyeUpTarget = 0;
    eyeUp += (eyeUpTarget - eyeUp) * Math.min(1, dt * 2.4);

    if (noticeT > 0) noticeT -= dt;
    if (blinkT > 0) blinkT -= dt;
    else if (eyeUp > 0.6 && entranceU == null && dyingK <= 0 && charge < 0.3) {
      nextBlink -= dt;
      if (nextBlink <= 0 && noticeT <= 0) { blinkT = BLINK_DUR; nextBlink = 5 + Math.random() * 4; }
    }
    const blink = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;

    // the LID: closed over the eye (submerged) / lifted hooded (surfaced) / flung
    // wide (notice). rotation.x hinges it up-and-back.
    const lidOpen = clamp(eyeUp - blink * 0.6 + noticeK * 0.45, 0, 1.4);
    eyeLidPivot.rotation.x = lidOpen * 1.15;

    // --- THE EYE glow (the catchlight carries the G1 peak). ---
    let eyeK = eyeUp;
    if (noticeT > 0.4) eyeK = Math.max(eyeK, 1) * 1.3;
    if (dyingK > 0) eyeK *= Math.max(0, 1 - dyingK * 1.5);
    if (shieldClamp) eyeK *= 0.4;
    eyeK *= (1 - blink * 0.85);
    eyeGlow += (eyeK - eyeGlow) * Math.min(1, dt * 6);
    eyeMat.color.copy(EYE_BASE).multiplyScalar(Math.max(0.02, eyeGlow) * EYE_HOT);
    eyeCoreMat.color.setScalar(CORE_HOT * Math.max(0.015, eyeGlow));
    eyeCore.visible = eyeGlow > 0.25 && dyingK < 0.7;
    pupil.visible = eyeGlow > 0.2;
    iris.visible = eyeGlow > 0.12;
    irisMat.emissiveIntensity = 0.2 + eyeGlow * 1.5 + noticeK * 1.2;
    eyeball.scale.setScalar(1 + Math.sin(time * 1.6) * 0.03 * eyeGlow + dreadK * 0.12);

    // --- THE GAZE (a slow tide; LOCKS at notice/settle). ---
    if (!irisLock && eyeUp > 0.6 && entranceU == null) {
      gazeEX += (gazeTX * 0.55 - gazeEX) * Math.min(1, dt * 1.2);
      gazeEY += (gazeTY * 0.38 - gazeEY) * Math.min(1, dt * 1.2);
    }
    iris.position.set(gazeEX, gazeEY, 0.7);
    pupil.position.set(gazeEX, gazeEY, 0.78);
    eyeCore.position.set(-0.26 + gazeEX, 0.28 + gazeEY, 0.98);
    eyeball.position.set(gazeEX * 0.35, gazeEY * 0.35, 0.25);
    iris.rotation.z = irisLock ? irisAngle : (irisAngle += dt * 0.15);

    // --- THE SHACKLE POSTS strain as an amber volley charges. ---
    for (let i = 0; i < shackleRigs.length; i++) {
      const s = shackleRigs[i];
      if (s.broken) continue;
      const strain = charge * (tell === 'stream' || tell === 'aimed' ? 1 : 0.5);
      s.strain += (strain - s.strain) * Math.min(1, dt * 5);
      s.pivot.rotation.z = Math.sin(time * (6 + i)) * 0.05 * s.strain;
      s.pivot.rotation.x = Math.sin(time * 0.4 + i) * 0.03 + s.strain * 0.08;
    }

    // --- THE BANDING sheen (the tidal drone made visible; 2-tone shimmer). ---
    const shimmer = 0.85 + Math.sin(time * 0.8) * 0.12 + Math.sin(time * 1.9) * 0.06;
    const bandK = shimmer * (1 + charge * 0.5 + dreadK * 0.8 + noticeK * 1.1) * (shieldClamp ? 0.45 : 1) * (1 - dyingK * 0.7);
    bandAMat.emissiveIntensity = 0.85 * bandK;
    bandBMat.emissiveIntensity = 0.78 * (0.9 + Math.sin(time * 0.8 + 1.6) * 0.16) * (1 + charge * 0.4 + noticeK * 1.1) * (shieldClamp ? 0.45 : 1) * (1 - dyingK * 0.7);
    finEdgeMat.emissiveIntensity = 0.7 * bandK;

    // --- ENTRANCE: the head/back INHALES up through the fog (rig.y from deep),
    // the fins unfold, the banding lights in a wave, the lid grinds + iris LOCKS
    // at settle — with the canon HESITATION hold near u≈0.5-0.6. ---
    if (entranceU != null) {
      const u = entranceU;
      const holdLo = 0.5, holdHi = 0.6;
      let rise;
      if (u < holdLo) rise = Math.pow(u / holdLo, 0.8) * 0.62;
      else if (u < holdHi) rise = 0.62;
      else rise = 0.62 + Math.pow((u - holdHi) / (1 - holdHi), 1.4) * 0.38;
      rig.position.y = (rise - 1) * 10;
      for (let i = 0; i < finPivots.length; i++) {
        const unfold = clamp01((u - 0.15 - i * 0.12) / 0.3);
        finPivots[i].rotation.x = -0.1 * unfold - (1 - unfold) * 1.2;
      }
      const litFront = u * 1.3;
      bandAMat.emissiveIntensity = 0.85 * clamp01(litFront);
      bandBMat.emissiveIntensity = 0.78 * clamp01(litFront - 0.2);
      eyeGlow = 0.12 + clamp01((u - 0.9) / 0.1) * 0.2;
      eyeMat.color.copy(EYE_BASE).multiplyScalar(eyeGlow * EYE_HOT);
      eyeCoreMat.color.setScalar(CORE_HOT * eyeGlow * 0.4);
      eyeLidPivot.rotation.x = clamp01((u - 0.9) / 0.1) * 0.4;
      if (u > 0.94 && !irisLock) { irisLock = true; irisAngle = iris.rotation.z; }
    }

    // --- DREAD: SOUNDING — the dive (the head sinks + pitches down). ---
    if (dreadK > 0.05) {
      rig.position.y = -dreadK * 4.5 + Math.sin(time * 2) * 0.3;
      rig.rotation.x = -dreadK * 0.14;
    }

    // --- DRIFT ORBITERS (kelp on the swell; sink in death). ---
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed * (1 + painEase);
      o.position.set(
        Math.cos(u.ang) * u.rx,
        u.cy + Math.sin(u.ang * 1.4) * u.ry + Math.sin(time * u.bob + u.ang) * 0.3 - dyingK * (5 + u.cy),
        BODY_CZ + BODY_HZ * 0.55 + Math.sin(u.ang) * 1.3
      );
      o.rotation.x += dt * u.spin;
      o.rotation.z += dt * u.spin * 0.7;
    }
  }

  // Muzzle: fire originates at the EYE (emitter = organ, §5f law 7).
  const muzzle = new THREE.Object3D();
  muzzle.name = 'brineMuzzle';
  muzzle.position.set(EYE_X, EYE_Y, EYE_Z + 1.4);
  group.add(muzzle);

  // ---- §7b per-sheet diagnostics. ----
  const sc = def.scale ?? 1.5;
  function hullLength() { return BODY_HX * 2 * sc; }        // world span (the "never fits" number)
  function eyeSurfaced() { return eyeUp; }
  function finRaise() { return finPivots.map((p) => p.rotation.x); }
  function shacklePositions() { return shackleRigs.map((s) => s.x * sc); }

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge, setAttackTell, setSetpiece, setGaze, notice,
    setEyeUp, eyeIsUp,
    setEntrance, setEntranceSteer,
    setHealth: kit.setHealth, setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible, shatterShield: kit.shatterShield,
    flash, hurt,
    crackShackle, shackleBroken, liveShackles, shackleCount, brokenCount, shackleHitTest,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    hullLength, eyeSurfaced, finRaise, shacklePositions,
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); },
  };
}
