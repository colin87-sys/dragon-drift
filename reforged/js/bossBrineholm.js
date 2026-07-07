import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// BRINEHOLM — "The Island That Breathes" (BOSS-DESIGN.md §5b/§5d slot 8, a Tier-3
// CALAMITY). A bound deep-sea LEVIATHAN whose colossal HEAD lunges up out of the
// fog and fills the frame — you fight the FACE, you never see the body (a head
// this size implies a body too vast to show: "never fully on screen" comes free).
//
// SILHOUETTE (§3.1, the translation sheet, foolproof this time):
//   READS AS — a colossal deep-sea leviathan's head lunging up out of the fog.
//   CARRYING CUES (must reach the OUTLINE): (1) the gaping MAW across the lower
//   third — a hard jagged jawline over a glowing gullet; (2) the one heavy-lidded
//   EYE under a jutting brow (the focal, upper); (3) the VERTICAL upward thrust
//   breaking the fog, chains snapped across the snout (the asymmetric scar).
//   ANTI-READS — NOT a ship (the mass is VERTICAL; no horizontal lit line
//   ANYWHERE); NOT VOIDMAW's dead stone mask (this is WET, FLESHY, BREATHING —
//   one living eye + a maw, never hollow sockets); NOT a generic dragon head
//   (kelp-black + abalone bioluminescence in the gullet + gill rakes + barnacles
//   + binding chains = specifically a BOUND DEEP-SEA LEVIATHAN).
//   LIT-EDGE — abalone glow INSIDE the maw + along the gill rakes + the white-hot
//   eye (the one focal). The glowing gullet is the organic lit-edge; NO level line.
//   SCALE — fills the frame vertically at fight distance; the body never appears.
//   HOME — dark biome.
//
// THE EYE (§4b, the sole focal + weak point): a heavy lid grinds up to reveal the
// pale HDR eye + abalone iris; chip damage ONLY lands while it's up (the §5f
// turn-taking tell). The one white eye out-glows the abalone gullet (G1).
//
// BOUND (§5f mercy mechanic): chains bind the MAW/SNOUT — the fight is it
// STRAINING against them. The shackle posts are destructible: break them (parry
// or gunfire) and the freed beast calms in phase 3; leave it bound and it thrashes.
// The ONE scar is a snapped chain across the snout.
//
// ALIVE, NOT A MASK (the one collision watch-item vs VOIDMAW): wet specular skin,
// a breathing jaw + gill flex, the throat-glow pulsing on the TIDAL-DRONE beat,
// the eye tracking under its heavy lid. A living drowned god, never dead stone.
//
// CONTRACT: boss.js stomps `group.rotation` (placeGroup) and `kit.setDissolve`
// owns `group.scale` — every animated part lives on `rig`, the jawPivot, the
// eyeLidPivot, the shacklePivots, or the drift orbiters; never on `group` itself.

export function buildBrineholm(def, quality = 1) {
  const accent = def.accent ?? 0x3ad0b0;   // abalone sea-green — the identity hue
  const accent2 = 0x7d7ad8;                 // nacre-violet — the second bioluminescent tone
  const glow = def.glow ?? 0xbfe6dd;        // pale abalone-white (shield rim / shards)
  const lowQ = quality < 0.75;
  const strip = stripForMerge;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (v) => clamp(v, 0, 1);

  // The shield wraps the WEAK POINT — the eye (focal). hpBarScale counters the big
  // def.scale; hpBarY clears the crown of the head.
  const kit = createBossCommon(def, quality, {
    shieldRadius: 5.6, shieldY: 5.0, hpBarY: 13.5, hpBarZ: 5.0, hpBarScale: 0.6,
    shieldRimStrength: 0.32, shieldCageOpacity: 0.34,
  });
  const { group, track } = kit;
  group.userData.archetype = 'brineholm';
  const rig = new THREE.Group();
  group.add(rig);

  const mergeBh = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildBrineholm: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };
  function tierSplit(g, loY, hiY) {
    const src = g.attributes.position, nsrc = g.attributes.normal;
    const b = { deep: [], mid: [], hi: [] };
    for (let i = 0; i < src.count; i += 3) {
      const cy = (src.getY(i) + src.getY(i + 1) + src.getY(i + 2)) / 3;
      const t = cy < loY ? 'deep' : cy < hiY ? 'mid' : 'hi';
      for (let k = 0; k < 3; k++) b[t].push(i + k);
    }
    const sub = (idxs) => {
      const geo = new THREE.BufferGeometry();
      const a = new Float32Array(idxs.length * 3), nn = new Float32Array(idxs.length * 3);
      for (let j = 0; j < idxs.length; j++) { const i = idxs[j]; a[j * 3] = src.getX(i); a[j * 3 + 1] = src.getY(i); a[j * 3 + 2] = src.getZ(i); nn[j * 3] = nsrc.getX(i); nn[j * 3 + 1] = nsrc.getY(i); nn[j * 3 + 2] = nsrc.getZ(i); }
      geo.setAttribute('position', new THREE.BufferAttribute(a, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nn, 3));
      return geo;
    };
    return { deep: sub(b.deep), mid: sub(b.mid), hi: sub(b.hi) };
  }

  // ==================================================================
  // MATERIALS — WET kelp-black hide (low roughness + a little metal = a wet
  // specular sheen under the front sun; the anti-mask "it's alive" cue), painted
  // value tiers (§3.4), abalone bioluminescence in the gullet + gills.
  // ==================================================================
  const hideDeepMat = track(new THREE.MeshStandardMaterial({ color: 0x070c0b, emissive: 0x060f0d, emissiveIntensity: 0.05, roughness: 0.62, metalness: 0.18, flatShading: true }));
  const hideMat = track(new THREE.MeshStandardMaterial({ color: 0x0c1210, emissive: 0x0a1512, emissiveIntensity: 0.10, roughness: 0.55, metalness: 0.16, flatShading: true }));
  const hideHiMat = track(new THREE.MeshStandardMaterial({ color: 0x16211e, emissive: 0x14231f, emissiveIntensity: 0.14, roughness: 0.5, metalness: 0.15, flatShading: true }));
  // THE GULLET GLOW — the bioluminescent throat (the organic lit-edge inside the
  // maw). Bright abalone, 2-tone; pulses on the breath. NOT white-hot (the eye
  // out-glows it — one focal). Emissive-on-standard, not additive (overdraw, L124).
  const gulletMat = track(new THREE.MeshStandardMaterial({ color: 0x08110f, emissive: accent, emissiveIntensity: 1.25, roughness: 0.6, metalness: 0.0, flatShading: true }));
  const gulletVMat = track(new THREE.MeshStandardMaterial({ color: 0x0a0a14, emissive: accent2, emissiveIntensity: 0.95, roughness: 0.6, metalness: 0.0, flatShading: true }));
  // GILL RAKES — glowing abalone slits on the flanks of the head (the lit-edge).
  const gillMat = track(new THREE.MeshStandardMaterial({ color: 0x08110f, emissive: accent, emissiveIntensity: 0.9, roughness: 0.55, metalness: 0.0, flatShading: true }));
  // TEETH — kelp-dark jagged fangs, silhouetted against the glowing gullet.
  // fangs carry a DIM always-on abalone ember (so the jagged jawline reads as a lit
  // edge at fight distance even in idle — without it the maw is dark-on-dark and the
  // head half-reads as a lone cyclops orb).
  const toothMat = track(new THREE.MeshStandardMaterial({ color: 0x0e1512, emissive: accent, emissiveIntensity: 0.16, roughness: 0.5, metalness: 0.2, flatShading: true }));
  const ironMat = track(new THREE.MeshStandardMaterial({ color: 0x1a1c20, emissive: 0x101216, emissiveIntensity: 0.05, roughness: 0.55, metalness: 0.55, flatShading: true }));
  const cageMat = track(new THREE.LineBasicMaterial({ color: 0x040807, transparent: true, opacity: 0.85, depthWrite: false }));

  // THE EYE (the L142 recipe — lens sclera + iris ring + pupil + proud catchlight).
  const EYE_HOT = 1.5, CORE_HOT = 17.0;
  const EYE_BASE = new THREE.Color(0xd8efe8);
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xd8efe8 })); eyeMat.toneMapped = false; eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const eyeCoreMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff })); eyeCoreMat.toneMapped = false; eyeCoreMat.color.setScalar(CORE_HOT);
  const irisMat = track(new THREE.MeshStandardMaterial({ color: 0x0a1512, emissive: accent, emissiveIntensity: 1.5, roughness: 0.4, metalness: 0.1, flatShading: true }));
  const pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x03110e }));
  const ventMat = track(new THREE.MeshStandardMaterial({ color: 0x0a1512, emissive: accent, emissiveIntensity: 1.3, roughness: 0.5, metalness: 0.0, flatShading: true }));
  const gougeMat = track(new THREE.MeshStandardMaterial({ color: 0x2a3a34, emissive: 0x33463f, emissiveIntensity: 0.22, roughness: 0.7, metalness: 0.0, flatShading: true }));

  // ==================================================================
  // GEOMETRY — the head faces +Z (the player); def.scale (≈1.5) → arena scale.
  // It fills the frame VERTICALLY (head ~24 local tall → ~36 world). The maw is
  // the lower third; the eye is upper; nothing is horizontal.
  // ==================================================================
  const HEAD_HW = 9.0;       // half-width — NARROW (the head thrusts UP, it is not a ball)
  const HEAD_VH = 12.5;      // half-height — TALLER than wide = a vertical leviathan skull
  const HEAD_VD = 8.5;       // half-depth (front→back)

  // ---- THE UPPER SKULL (§5d): a vertically-thrusting cranium with a jutting BROW
  // SHELF over the eye, a projecting SNOUT, and a palate tapering back to the jaw
  // hinge. The FRONT is FLATTENED to a broad face-plane so features (brow, eye,
  // snout, maw) protrude FROM a face — a sphere-front reads as a ball/eyeball (the
  // rejected read). Chunky low-poly facets = carved bone-black, not a smooth orb.
  const skullBase = new THREE.SphereGeometry(1, lowQ ? 18 : 26, lowQ ? 14 : 18);
  {
    const pos = skullBase.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.x *= HEAD_HW; v.y *= HEAD_VH; v.z *= HEAD_VD;
      const ty = v.y / HEAD_VH, tz = v.z / HEAD_VD, tx = v.x / HEAD_HW;
      // FLATTEN THE FACE-PLANE: pull the front bulge back toward a broad plane so
      // the frontal read is a FACE, not a sphere front (kills the eyeball/moon read).
      if (tz > 0.1) v.z -= (tz - 0.1) * (tz - 0.1) * HEAD_VD * 0.6 * (1 - Math.abs(ty) * 0.25);
      // heavy BROW SHELF: a forward overhang across the upper-front with a down-lip
      // at the leading edge — it breaks the top-front outline (a carrying cue). The
      // temples BULGE wider at the brow line so the side-outline knuckles out (not
      // a smooth egg): a bony beast-brow, the eye set deep beneath it.
      if (ty > 0.2 && ty < 0.64 && tz > -0.1) { const b = (ty - 0.2) * (0.64 - ty) * 11; v.z += b * (tz + 0.3) * 1.5; v.y -= Math.max(0, b - 0.5) * 0.7; if (Math.abs(tx) > 0.35 && tz > 0.1) v.x *= 1 + b * 0.16; }
      // SNOUT / upper muzzle: the mid-lower front juts forward over the maw.
      if (ty < 0.06 && ty > -0.6 && tz > 0.0) { v.z += (0.06 - ty) * (tz + 0.1) * 3.4; }
      // TAPER to the jaw hinge: the lower skull narrows + recedes (the roof of the maw).
      if (ty < -0.35) { const k = clamp((-ty - 0.35) / 0.65, 0, 1); v.x *= (1 - k * 0.5); v.z -= k * 2.4; v.y += k * 1.2; }
      // NARROW + SLOPE-BACK the crown so the top comes to a bony ridge and recedes
      // (an angular beast-skull), NOT a full-width smooth dome (the ball read).
      if (ty > 0.5) { const k = clamp((ty - 0.5) / 0.5, 0, 1); v.x *= (1 - k * 0.34); v.z -= k * k * 2.4; }
      // squared cheeks (carved, not round): flatten the flanks.
      if (Math.abs(tx) > 0.5 && Math.abs(ty) < 0.55) v.x *= 0.9;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    skullBase.computeVertexNormals();
    skullBase.deleteAttribute('uv');
  }
  const skullFull = strip(skullBase);
  skullFull.translate(0, 3.6, 0);   // spans world y ≈ −6.2 … +15.8 (crown exits frame-top)
  const skullT = tierSplit(skullFull, 1.0, 8.0);
  const skullDeep = new THREE.Mesh(skullT.deep, hideDeepMat); skullDeep.name = 'brineHead';
  const skullMid = new THREE.Mesh(skullT.mid, hideMat);
  const skullHi = new THREE.Mesh(skullT.hi, hideHiMat);
  rig.add(skullDeep, skullMid, skullHi);

  // ---- THE GULLET — a glowing bioluminescent throat mass behind the teeth (the
  // lit-edge seen through the maw). 2-tone; pulses on the breath in the tick.
  // THE GULLET — a tall glowing throat set in the maw; the dark fangs silhouette
  // in FRONT of it (a fanged glowing maw, not a flat green grin-band). Bright at
  // the core, tapering to a narrow column so it reads as a throat, not a fill.
  const gulletCore = new THREE.Mesh(strip(new THREE.SphereGeometry(4.4, lowQ ? 14 : 20, lowQ ? 10 : 14)), gulletMat);
  gulletCore.name = 'brineGullet';
  gulletCore.scale.set(0.86, 1.25, 0.8);
  gulletCore.position.set(0, -3.7, -2.0);        // raised into the lower third (not cropped at the frame edge)
  rig.add(gulletCore);
  const gulletInner = new THREE.Mesh(strip(new THREE.SphereGeometry(2.6, lowQ ? 12 : 16, lowQ ? 8 : 12)), gulletVMat);
  gulletInner.scale.set(0.82, 1.2, 0.74);
  gulletInner.position.set(0.4, -4.3, -3.2);
  rig.add(gulletInner);

  // ---- THE LOWER JAW (jawPivot) — a chunky jaw mass hinged at the back; it drops
  // to GAPE the maw (the breathing + the §3.5 attack telegraph). Jagged upper edge.
  const jawPivot = new THREE.Group();
  jawPivot.name = 'jawPivot';
  jawPivot.position.set(0, -3.2, -4.2);          // hinge behind the throat (raised — the maw sits in the lower third)
  const jawBase = new THREE.SphereGeometry(1, lowQ ? 18 : 26, lowQ ? 12 : 18);
  {
    const pos = jawBase.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.x *= 9.5; v.y *= 3.0; v.z *= 7.0;
      const tz = v.z / 7.0;
      if (v.y > 0) v.y *= 0.6;                    // flatten the top (the tooth line)
      if (tz > 0.2) v.x *= (1 - (tz - 0.2) * 0.5); // taper the chin forward
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    jawBase.computeVertexNormals();
    jawBase.deleteAttribute('uv');
  }
  const jawGeo = strip(jawBase);
  jawGeo.translate(0, -1.2, 5.0);                 // project the jaw forward from the hinge
  const jawT = tierSplit(jawGeo, -3.5, -1.5);
  const jaw = new THREE.Mesh(jawGeo, hideMat); jaw.name = 'brineJaw';
  jawPivot.add(jaw);
  rig.add(jawPivot);

  // ---- THE TEETH — kelp-dark jagged fangs on the upper jaw (pointing DOWN) and
  // the lower jaw (pointing UP), silhouetted against the glowing gullet. The hard
  // jagged JAWLINE is the load-bearing "maw" silhouette cue.
  const upperTeeth = [], lowerTeeth = [];
  const N_TEETH = lowQ ? 7 : 11;
  // deterministic per-tooth jitter (irregular = predatory; a clean arc = a grin).
  const jit = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
  for (let i = 0; i < N_TEETH; i++) {
    const t = (i / (N_TEETH - 1) - 0.5);          // −0.5..0.5 across
    const x = t * 12.0;
    const z = 5.6 - Math.abs(t) * 2.2;            // near-LEVEL bite line (not an up-curved smile)
    // LONG irregular dark fangs (silhouetted against the deep throat glow) — a few
    // hero fangs hang well into the gape so the maw reads FANGED, not a tidy grin.
    const hU = 2.3 + jit(i) * 2.2 - Math.abs(t) * 0.7;
    const up = strip(new THREE.ConeGeometry(0.6 - Math.abs(t) * 0.14, hU, 5));
    up.rotateX(Math.PI); up.translate(x, -3.0 - hU * 0.5, z);   // hang from the upper jaw (raised bite line)
    upperTeeth.push(up);
    const hL = 1.9 + jit(i + 7) * 1.9 - Math.abs(t) * 0.6;
    const lo = strip(new THREE.ConeGeometry(0.54 - Math.abs(t) * 0.12, hL, 5));
    lo.translate(x * 0.92 + (jit(i + 3) - 0.5) * 0.5, -5.0 + hL * 0.5, z * 0.95);   // rise from the lower jaw
    lowerTeeth.push(lo);
  }
  rig.add(new THREE.Mesh(mergeBh(upperTeeth, 'upperTeeth'), toothMat));
  const lowerToothMesh = new THREE.Mesh(mergeBh(lowerTeeth, 'lowerTeeth'), toothMat);
  jawPivot.add(lowerToothMesh);

  // ---- GILL RAKES — glowing abalone slits on the flanks (the lit-edge + the
  // "it breathes" cue; they flex on the breath in the tick).
  const gillPivots = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = `gillPivot${sx > 0 ? 'R' : 'L'}`;
    pivot.position.set(sx * (HEAD_HW - 1.5), 1.5, 2.0);
    for (let g = 0; g < 3; g++) {
      const slit = new THREE.Mesh(strip(new THREE.BoxGeometry(0.4, 3.2 - g * 0.4, 0.3)), g % 2 ? gillMat : gulletVMat);
      slit.rotation.z = sx * 0.3; slit.position.set(sx * g * 0.9, -g * 0.6, -g * 0.5);
      pivot.add(slit);
    }
    rig.add(pivot);
    gillPivots.push(pivot);
  }

  // ---- THE EYE ASSEMBLY (reused; the sole focal + weak point), seated under the
  // jutting brow, upper-front of the skull, slightly off-centre ("the one eye").
  const EYE_X = 2.4, EYE_Y = 5.6, EYE_Z = 7.6;
  const eyeRig = new THREE.Group();
  eyeRig.name = 'eyeRig';
  eyeRig.position.set(EYE_X, EYE_Y, EYE_Z);
  eyeRig.scale.setScalar(1.7);
  rig.add(eyeRig);
  const socket = new THREE.Mesh(new THREE.CircleGeometry(1.7, lowQ ? 16 : 24), hideDeepMat); socket.name = 'eyeSocket'; socket.position.z = -0.05; eyeRig.add(socket);
  // the sclera is a PALE GLOWING dome (bulged forward, z*0.5) — the pale eye reads
  // as the focal even before the catchlight; the dark pupil is a small slit so the
  // glow, not black, fills the eye.
  const sclGeo = new THREE.SphereGeometry(1.3, 20, 16); sclGeo.scale(1, 1, 0.5);
  const eyeball = new THREE.Mesh(sclGeo, eyeMat); eyeball.name = 'brineEye'; eyeball.position.z = 0.3; eyeRig.add(eyeball);
  const iris = new THREE.Mesh(strip(new THREE.TorusGeometry(0.78, 0.16, 8, lowQ ? 16 : 24)), irisMat); iris.name = 'brineIris'; iris.position.z = 0.82; eyeRig.add(iris);
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.44, lowQ ? 14 : 20), pupilMat); pupil.name = 'brinePupil'; pupil.scale.set(0.62, 1, 1); pupil.position.z = 0.88; pupil.renderOrder = 5; eyeRig.add(pupil);
  // the CATCHLIGHT (the G1 peak): a proud white-hot glint seated in the EXPOSED
  // lower-inner sclera (never under the hood), the single hottest point on-screen.
  const eyeCore = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), eyeCoreMat); eyeCore.name = 'eyeCore'; eyeCore.position.set(-0.2, -0.34, 1.02); eyeCore.renderOrder = 7; eyeRig.add(eyeCore);
  // the heavy hooded brow-LID (rounded, grinds up-and-back).
  const eyeLidPivot = new THREE.Group(); eyeLidPivot.name = 'eyeLidPivot'; eyeLidPivot.position.set(0, 1.7, 1.05);
  const lidParts = [];
  const lid = strip(new THREE.SphereGeometry(1.45, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.62)); lid.scale(1.15, 0.95, 1.0); lid.rotateX(Math.PI); lid.translate(0, -0.5, 0.1); lidParts.push(lid);
  const welt = strip(new THREE.SphereGeometry(0.55, 10, 7)); welt.scale(2.6, 0.7, 0.9); welt.translate(0, 0.15, 0.5); lidParts.push(welt);
  const lidMesh = new THREE.Mesh(mergeBh(lidParts, 'eyelid'), hideHiMat); lidMesh.name = 'eyeLid'; eyeLidPivot.add(lidMesh);
  eyeRig.add(eyeLidPivot);

  // ---- BARNACLE CRUST on the crown + temples (breaks the top edge — knobbly
  // organic outline, not a smooth dome). The crown clusters are the biggest.
  const barnParts = [], barnGlow = [];
  const N_BARN = lowQ ? 9 : 16;
  for (let i = 0; i < N_BARN; i++) {
    const a = (i / N_BARN) * Math.PI * 2;
    const r = 6.5 + (i % 3) * 1.4;
    const crown = Math.max(0, Math.sin(a));                // up-facing → bigger (breaks the crown outline)
    const x = Math.cos(a) * r, y = 10.8 + Math.sin(a) * 4.2 + (i % 2) * 1.0;
    const h = 0.8 + (i % 3) * 0.4 + crown * crown * 3.0;   // crown knobs are tall horns (jagged top outline)
    const c = strip(new THREE.ConeGeometry(0.34 + (i % 2) * 0.14 + crown * 0.3, h, 5));
    c.translate(x * 0.72, y, 2.4 - Math.abs(Math.cos(a)) * 1.6);
    if (i % 4 === 0) barnGlow.push(c); else barnParts.push(c);
  }
  rig.add(new THREE.Mesh(mergeBh(barnParts, 'barnacles'), hideDeepMat));
  if (barnGlow.length) rig.add(new THREE.Mesh(mergeBh(barnGlow, 'barnGlow'), gillMat));

  // ---- THE BLOWHOLE + MIST SPOUT (§3b law-5 — the POSITIVE "leviathan" signal
  // NOTHING else in the roster has; also the TIDAL-DRONE rhythm tell). A paired
  // vent sits on the crown behind the brow; on the exhale beat it SPOUTS a pale
  // vertical mist column that breaks the top of frame — a plume, never a level line.
  const BLOW_Y = 11.4, BLOW_Z = 2.2;   // a touch lower + forward on the crown so the plume stays in the tight fight framing
  const ventRim = [];
  for (const sx of [-1, 1]) { const r = strip(new THREE.TorusGeometry(0.72, 0.3, 6, 10)); r.rotateX(Math.PI / 2 - 0.55); r.scale(1, 1, 0.6); r.translate(sx * 1.15, BLOW_Y, BLOW_Z); ventRim.push(r); }
  rig.add(new THREE.Mesh(mergeBh(ventRim, 'blowRim'), hideHiMat));
  const spoutPivot = new THREE.Group(); spoutPivot.name = 'spoutPivot'; spoutPivot.position.set(0, BLOW_Y + 0.4, BLOW_Z);
  const spoutMat = track(new THREE.MeshBasicMaterial({ color: 0xcfeee6, transparent: true, opacity: 0.0, depthWrite: false }));
  const spoutPuffs = [];
  const N_SPOUT = lowQ ? 6 : 9;
  for (let i = 0; i < N_SPOUT; i++) {
    const puff = new THREE.Mesh(strip(new THREE.SphereGeometry(0.9 + (i % 3) * 0.28, 7, 6)), spoutMat); puff.name = 'spoutPuff';
    puff.userData = { f: i / N_SPOUT, sway: (i % 2 ? 1 : -1) * (0.5 + (i % 3) * 0.22) };
    spoutPivot.add(puff); spoutPuffs.push(puff);
  }
  rig.add(spoutPivot);

  // ---- THE BINDING CHAINS + DESTRUCTIBLE SHACKLE POSTS across the SNOUT (§5f
  // mercy mechanic): the beast strains against them. Break one (parry ×3 or
  // gunfire) → it SNAPS + vents; freed early softens phase 3. Named shacklePivots.
  // Outer-post x pulled in from ±5.5/6.5 (world ±8.25/9.75, ~3 m off the ±13 lane
  // wall — the crash-and-die commit) to ±4.5 (world ±6.75, ~6 m of margin): still
  // a meaningful LATERAL reach, no longer a suicide run. The paint/lance anchor is
  // the post node itself, so it follows this array for free (partWorldPos).
  const SHACKLE_X = [-4.5, 1.5, 4.5];
  const SHACKLE_Y = [-1.5, -2.4, -0.8];
  const shackleRigs = [];
  function buildShacklePost(i, x, y) {
    const pivot = new THREE.Group();
    pivot.name = `shacklePivot${i}`;
    pivot.position.set(x, y, 6.6 - Math.abs(x) * 0.25);   // across the snout front
    const postParts = [];
    const bar = strip(new THREE.CylinderGeometry(0.3, 0.34, 2.6, 6)); bar.rotateZ(Math.PI / 2 + (i - 1) * 0.2); postParts.push(bar);
    const ring = strip(new THREE.TorusGeometry(0.55, 0.15, 5, 10)); ring.rotateY(Math.PI / 2); ring.translate(0, 0, 0.2); postParts.push(ring);
    const postMesh = new THREE.Mesh(mergeBh(postParts, `shacklePost${i}`), ironMat); postMesh.name = `shacklePost${i}`;
    pivot.add(postMesh);
    const chainParts = [];
    for (let c = 0; c < 3; c++) { const link = strip(new THREE.TorusGeometry(0.26, 0.09, 4, 8)); link.rotateX(c % 2 ? Math.PI / 2 : 0); link.translate((c - 1) * 0.7, -0.3 - c * 0.1, 0.3); chainParts.push(link); }
    const chain = new THREE.Mesh(mergeBh(chainParts, `chain${i}`), ironMat); chain.name = `shackleChain${i}`;
    pivot.add(chain);
    rig.add(pivot);
    return { pivot, postMesh, chain, x, y, broken: false, strain: 0 };
  }
  for (let i = 0; i < SHACKLE_X.length; i++) shackleRigs.push(buildShacklePost(i, SHACKLE_X[i], SHACKLE_Y[i]));

  // ---- THE ONE SCAR (§3.6) — a snapped chain fused DIAGONALLY across the snout
  // below the eye (a heavy broken iron half-ring + a raw pale gouge, with an
  // abalone glint on the broken end so the asymmetric scar reaches a lit edge at
  // fight distance) — the ASHTALON lore hook.
  const scarParts = [];
  const scarRing = strip(new THREE.TorusGeometry(0.85, 0.24, 5, 10, Math.PI * 1.25)); scarRing.rotateY(Math.PI / 2); scarRing.rotateZ(0.9); scarRing.translate(EYE_X - 3.6, EYE_Y - 3.4, EYE_Z - 0.4); scarParts.push(scarRing);
  const scarBar = strip(new THREE.CylinderGeometry(0.22, 0.26, 3.4, 6)); scarBar.rotateZ(0.7); scarBar.rotateX(0.2); scarBar.translate(EYE_X - 2.6, EYE_Y - 4.0, EYE_Z + 0.2); scarParts.push(scarBar);
  const scar = new THREE.Mesh(mergeBh(scarParts, 'scar'), ironMat); scar.name = 'brineScar'; rig.add(scar);
  const gouge = new THREE.Mesh(strip(new THREE.BoxGeometry(1.6, 0.34, 0.34)), gougeMat); gouge.name = 'brineGouge'; gouge.position.set(EYE_X - 3.0, EYE_Y - 3.7, EYE_Z + 0.4); gouge.rotation.z = -0.7; rig.add(gouge);
  // the abalone glint on the snapped end (the lit-edge tick that sells the scar).
  const scarGlint = new THREE.Mesh(strip(new THREE.SphereGeometry(0.34, 8, 6)), ventMat); scarGlint.name = 'brineScarGlint'; scarGlint.position.set(EYE_X - 1.9, EYE_Y - 2.9, EYE_Z + 0.5); rig.add(scarGlint);

  // ---- EDGE CAGE over the skull + jaw crests.
  for (const [geoSrc, thresh] of [[skullT.hi, 24], [jawGeo, 26]]) rig.add(new THREE.LineSegments(new THREE.EdgesGeometry(geoSrc, thresh), cageMat));

  // ---- DRIFT ORBITERS (≥2) — rising deep-sea BUBBLES around the head.
  const bubGeo = strip(new THREE.SphereGeometry(0.3, 7, 5));
  const bubMat = track(new THREE.MeshBasicMaterial({ color: 0xbfe6dd, transparent: true, opacity: 0.22, depthWrite: false }));
  const orbiters = [];
  const N_BUB = lowQ ? 3 : 6;
  for (let i = 0; i < N_BUB; i++) {
    const m = new THREE.Mesh(bubGeo, bubMat); m.name = 'driftBubble';
    m.userData = { x: (i / N_BUB - 0.5) * 20, y0: -8 + (i % 3) * 3, z: 4 + (i % 2) * 3, speed: 1.6 + (i % 3) * 0.7, sway: 0.5 + (i % 2) * 0.4, ph: i * 1.7 };
    rig.add(m); orbiters.push(m);
  }

  kit.flashBind(gulletMat, 1.25);
  kit.finalize();

  // ==================================================================
  // ANIMATION — breathing (jaw + gills + throat-glow), the eye weak-point window,
  // the maw-gape telegraph, the shackle strain/break, the dread submerge, the
  // mournful death, and the entrance rise.
  // ==================================================================
  let charge = 0; function setCharge(k) { charge = clamp01(k); }
  let tell = null; function setAttackTell(id) { tell = id || null; }
  let setpieceK = 0, dreadK = 0; function setSetpiece(k, sdef) { setpieceK = clamp01(k); dreadK = (sdef && sdef.dread) ? setpieceK : 0; }

  let eyeUp = 0, eyeUpTarget = 0, eyeAuto = true;
  function setEyeUp(k) { eyeAuto = false; eyeUpTarget = clamp01(k); }
  function eyeIsUp() { return eyeUp > 0.55; }

  let gazeTX = 0, gazeTY = 0, irisLock = false;
  function setGaze(nx, ny) { gazeTX = clamp(nx, -1, 1); gazeTY = clamp(ny, -1, 1); }

  const BLINK_DUR = 0.5; let blinkT = 0, nextBlink = 5 + Math.random() * 4, noticeT = 0;
  function notice() { noticeT = 1.2; blinkT = 0; irisLock = true; }
  let painT = 0, painEase = 0;
  function flash(amt) { kit.flash(amt); }
  function hurt(amt) { if (amt > 0.3) painT = Math.max(painT, 0.35); }

  let entranceU = null;
  function setEntrance(u) { const was = entranceU != null; entranceU = u == null ? null : clamp01(u); if (entranceU != null && !was) { eyeAuto = false; eyeUpTarget = 0; irisLock = false; } }
  function setEntranceSteer() {}

  let shieldClamp = false;
  kit.onShieldChange((v) => { shieldClamp = v; if (v) { eyeAuto = false; eyeUpTarget = 0; } else eyeAuto = true; });

  // §5f DESTRUCTIBLE SHACKLES (reuses slot 6's per-part grammar).
  const brokenShackles = new Set();
  function crackShackle(idx) {
    if (idx == null || idx < 0 || idx >= shackleRigs.length || brokenShackles.has(idx)) return false;
    brokenShackles.add(idx);
    const s = shackleRigs[idx]; s.broken = true;
    const dir = (idx % 2 ? 1 : -1);
    s.postMesh.rotation.set(0, 0, dir * 1.3); s.postMesh.scale.set(0.55, 1, 1); s.postMesh.position.set(dir * 0.5, -0.4, 1.0);
    s.chain.rotation.z = dir * 0.9; s.chain.position.set(dir * 0.4, -1.2, 1.2);
    const jag = new THREE.Mesh(strip(new THREE.ConeGeometry(0.34, 0.7, 5)), ironMat); jag.position.copy(s.pivot.position); jag.position.z += 0.8; jag.rotation.z = 0.4; jag.name = `shackleJag${idx}`; rig.add(jag);
    const ventGroup = new THREE.Group(); ventGroup.name = `shackleVent${idx}`; ventGroup.position.copy(s.pivot.position); ventGroup.position.z += 1.4;
    for (let v = 0; v < 5; v++) { const froth = new THREE.Mesh(strip(new THREE.ConeGeometry(0.36 - v * 0.045, 1.0 + v * 0.4, 6)), ventMat); froth.position.set((v - 2) * 0.26, 0.3 + v * 0.55, 0.1); froth.rotation.z = (v - 2) * 0.15; ventGroup.add(froth); }
    rig.add(ventGroup);
    return true;
  }
  function shackleBroken(idx) { return brokenShackles.has(idx); }
  function liveShackles() { const o = []; for (let i = 0; i < shackleRigs.length; i++) if (!brokenShackles.has(i)) o.push(i); return o; }
  function shackleCount() { return shackleRigs.length; }
  function brokenCount() { return brokenShackles.size; }
  const _sc = def.scale ?? 1.5;
  function shackleHitTest(localX, localY) {
    const wx = localX / _sc, wy = localY / _sc; let best = -1, bd = 3.6;
    for (const i of liveShackles()) { const s = shackleRigs[i]; const d = Math.hypot(wx - s.x, wy - s.y); if (d < bd) { bd = d; best = i; } }
    return best;
  }

  let dyingK = 0;
  function setDissolveEmotive(k) {
    dyingK = clamp01(k);
    const a = dyingK < 0.82 ? 1 : Math.max(0, 1 - (dyingK - 0.82) / 0.18);
    for (const m of kit.mats) { m.transparent = true; const base = m.userData.baseOpacity ?? 1; m.opacity = base * a; if (m.uniforms && m.uniforms.uOpacity) m.uniforms.uOpacity.value = base * a; }
  }

  let eyeGlow = 0, irisAngle = 0, gazeEX = 0, gazeEY = 0, jawOpenK = 0;

  function tickBody(dt, time) {
    // --- TIDAL BREATHING (the slowest idle): the head heaves on the swell; the
    // jaw + gills + throat-glow breathe. The flinch rides on top. ---
    if (painT > 0) painT -= dt;
    painEase += (Math.max(0, painT) - painEase) * Math.min(1, dt * 8);
    const swell = Math.sin(time * 0.32) * 0.5 + Math.sin(time * 0.13) * 0.3;
    const noticeK = noticeT > 0 ? clamp01(noticeT / 0.9) : 0;
    rig.position.y = swell * 0.5 + painEase * Math.sin(time * 30) * 0.4;
    rig.rotation.z = Math.sin(time * 0.22) * 0.008 + painEase * Math.sin(time * 26) * 0.012;
    // the head REARS back hard as an attack winds up — it lifts the chin + throws
    // the maw open toward you, changing the SILHOUETTE (not just the glow; §3.5).
    const rear = charge * 0.5 + noticeK * 0.3;
    rig.rotation.x = Math.sin(time * 0.18) * 0.006 - rear * 0.22;

    // --- THE MAW. Idle = a slow breathing gape; CHARGE/NOTICE = a WIDE gape (the
    // beast exhales — the silhouette telegraph); shield/death = slack. Straining
    // against the chains adds a judder while bound. ---
    const bound = liveShackles().length / Math.max(1, shackleRigs.length);   // 1 fully bound → 0 freed
    // idle = a WIDE-YAWNING surfaced maw — the dominant carrying cue must read at
    // rest as a gaping cavern (deep glowing throat + long fangs), never a closed
    // grin; charge/notice yawn it wider still (the §3.5 telegraph).
    const breathGape = 0.82 + Math.max(0, swell) * 0.16;
    let gapeT = breathGape + charge * 0.55 + noticeK * 0.4 + dreadK * 0.35;
    if (shieldClamp) gapeT = 0.08;
    if (dyingK > 0) gapeT = 0.4 * (1 - dyingK);
    // while BOUND it strains: a fast judder on the gape (the chains fight it)
    gapeT += bound * (charge * 0.3 + 0.04) * Math.sin(time * 9) * 0.5;
    jawOpenK += (gapeT - jawOpenK) * Math.min(1, dt * 5);
    jawPivot.rotation.x = clamp(jawOpenK, 0, 1.5) * 0.95;

    // --- THE GULLET GLOW pulses on the breath; FLARES on the exhale/charge. ---
    const throat = 1.05 + Math.max(0, swell) * 0.4 + charge * 0.85 + noticeK * 0.7 + dreadK * 0.55;
    const throatK = throat * (shieldClamp ? 0.4 : 1) * (1 - dyingK * 0.7);
    gulletMat.emissiveIntensity = 1.5 * throatK;
    gulletVMat.emissiveIntensity = 0.95 * (0.9 + Math.sin(time * 0.8 + 1.4) * 0.16) * (1 + charge * 0.5) * (shieldClamp ? 0.4 : 1) * (1 - dyingK * 0.7);
    // --- THE GILLS flex on the breath + flare on the throat. ---
    for (let g = 0; g < gillPivots.length; g++) {
      const p = gillPivots[g];
      p.scale.y = 1 + Math.max(0, swell) * 0.25 + charge * 0.2;
      p.children.forEach((c, ci) => { c.material.emissiveIntensity = (0.9 - ci * 0.15) * throatK; });
    }

    // --- THE BLOWHOLE SPOUT — a pale mist column that GROWS + brightens on the
    // exhale beat (and hard on charge/notice), rising off the crown. The rhythm
    // tell + the positive "leviathan" read. Fades right out while shielded/dying. ---
    const entSpout = entranceU == null ? 1 : clamp01((entranceU - 0.62) / 0.28);   // spouts as the crown clears the fog
    const spoutPower = clamp((swell > 0 ? swell * 1.3 : 0) + charge * 0.9 + noticeK * 0.7, 0, 1.5) * (shieldClamp ? 0.15 : 1) * (1 - dyingK) * entSpout;
    spoutMat.opacity = clamp(0.06 + spoutPower * 0.3, 0, 0.5);
    const colH = 6 + spoutPower * 6;
    for (let i = 0; i < spoutPuffs.length; i++) {
      const p = spoutPuffs[i], f = p.userData.f;
      p.position.set(Math.sin(time * 1.1 + i) * (0.4 + f * 1.7) + p.userData.sway * f, f * colH, 1.4 + f * 2.2 + Math.cos(time * 0.7 + i) * 0.4);   // leans FORWARD as it rises (stays in the fight framing)
      p.scale.setScalar(clamp(1.15 - f * 0.7, 0.28, 1.15) * (0.55 + spoutPower * 0.6));
    }

    // --- THE EYE WEAK-POINT WINDOW (the sole focal). In-game the CONTROLLER owns
    // the window (setEyeUp: surfaced in the recovery gap, submerged while attacking
    // — the §5f turn-taking tell + the damage gate). When no controller drives it
    // (the studio), the model free-runs the tidal auto-cycle so the captures pose. ---
    if (eyeAuto && entranceU == null && dyingK <= 0) eyeUpTarget = (Math.sin(time * 0.34) > 0.2) ? 1 : 0;
    if (shieldClamp || dyingK > 0.05) eyeUpTarget = 0;
    if (entranceU != null) eyeUpTarget = 0;
    eyeUp += (eyeUpTarget - eyeUp) * Math.min(1, dt * 2.4);

    if (noticeT > 0) noticeT -= dt;
    if (blinkT > 0) blinkT -= dt;
    else if (eyeUp > 0.6 && entranceU == null && dyingK <= 0 && charge < 0.3) { nextBlink -= dt; if (nextBlink <= 0 && noticeT <= 0) { blinkT = BLINK_DUR; nextBlink = 5 + Math.random() * 4; } }
    const blink = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;

    // HEAVY-LIDDED: even fully open the hood keeps the TOP of the eye covered (a
    // lidded ARC, not a full disc — this kills the cyclops/eyeball read). The
    // catchlight sits in the EXPOSED lower sclera so it stays clear. Hood hardest
    // in dread (where a bare circle read worst).
    const lidOpen = clamp(eyeUp - blink * 0.6 + noticeK * 0.45 - dreadK * 0.85, 0, 1.4);
    eyeLidPivot.rotation.x = lidOpen * 0.8;

    let eyeK = eyeUp;
    if (noticeT > 0.4) eyeK = Math.max(eyeK, 1) * 1.3;
    if (dyingK > 0) eyeK *= Math.max(0, 1 - dyingK * 1.5);
    if (shieldClamp) eyeK *= 0.4;
    eyeK *= (1 - blink * 0.85);
    eyeGlow += (eyeK - eyeGlow) * Math.min(1, dt * 6);
    eyeMat.color.copy(EYE_BASE).multiplyScalar(Math.max(0.06, eyeGlow) * EYE_HOT);
    // the catchlight is white-hot whenever it's SHOWN (floored) so the focal always
    // punches ≥250 for G1; it leashes by HIDING under shield/death, not by dimming.
    eyeCoreMat.color.setScalar(CORE_HOT * Math.max(0.6, eyeGlow));
    eyeCore.visible = eyeGlow > 0.3 && dyingK < 0.7;
    pupil.visible = eyeGlow > 0.2; iris.visible = eyeGlow > 0.12;
    irisMat.emissiveIntensity = 0.2 + eyeGlow * 1.5 + noticeK * 1.2;
    eyeball.scale.setScalar(1 + Math.sin(time * 1.6) * 0.03 * eyeGlow + dreadK * 0.12);

    if (!irisLock && eyeUp > 0.6 && entranceU == null) { gazeEX += (gazeTX * 0.55 - gazeEX) * Math.min(1, dt * 1.2); gazeEY += (gazeTY * 0.38 - gazeEY) * Math.min(1, dt * 1.2); }
    iris.position.set(gazeEX, gazeEY, 0.82); pupil.position.set(gazeEX, gazeEY, 0.88);
    eyeCore.position.set(-0.2 + gazeEX, -0.34 + gazeEY, 1.02); eyeball.position.set(gazeEX * 0.35, gazeEY * 0.35, 0.3);
    iris.rotation.z = irisLock ? irisAngle : (irisAngle += dt * 0.15);

    // --- THE SHACKLE POSTS strain as an amber volley charges. ---
    for (let i = 0; i < shackleRigs.length; i++) {
      const s = shackleRigs[i]; if (s.broken) continue;
      const strain = charge * (tell === 'stream' || tell === 'aimed' ? 1 : 0.5) + bound * 0.1;
      s.strain += (strain - s.strain) * Math.min(1, dt * 5);
      s.pivot.rotation.z = Math.sin(time * (7 + i)) * 0.05 * s.strain;
    }

    // --- ENTRANCE: the head INHALES up through the fog (rig.y from deep), the maw
    // parts, the gullet lights, the lid grinds + iris LOCKS at settle — with the
    // canon HESITATION hold near u≈0.5-0.6. ---
    if (entranceU != null) {
      const u = entranceU;
      const holdLo = 0.5, holdHi = 0.6; let rise;
      if (u < holdLo) rise = Math.pow(u / holdLo, 0.8) * 0.62;
      else if (u < holdHi) rise = 0.62;
      else rise = 0.62 + Math.pow((u - holdHi) / (1 - holdHi), 1.4) * 0.38;
      rig.position.y = (rise - 1) * 14;
      jawPivot.rotation.x = (0.1 + clamp01(u - 0.6) * 0.2) * 0.9;
      const litFront = u * 1.3;
      gulletMat.emissiveIntensity = 1.25 * clamp01(litFront);
      gulletVMat.emissiveIntensity = 0.95 * clamp01(litFront - 0.2);
      // Eye OPENS on the HESITATION/slow-mo crest (u 0.58→0.78) as the brow clears
      // the fog — not at settle (owner playtest: "the slow-mo is when his eye should
      // open"). The lid grinds open + iris locks while time is still dilated (the
      // slowWindow runs u 0.4–0.76), so the reveal IS the moment.
      eyeGlow = 0.12 + clamp01((u - 0.58) / 0.18) * 0.2;
      eyeMat.color.copy(EYE_BASE).multiplyScalar(eyeGlow * EYE_HOT);
      eyeCoreMat.color.setScalar(CORE_HOT * eyeGlow * 0.4);
      eyeLidPivot.rotation.x = clamp01((u - 0.58) / 0.2) * 0.4;
      if (u > 0.78 && !irisLock) { irisLock = true; irisAngle = iris.rotation.z; }
    }

    // --- DREAD: SOUNDING — the head SUBMERGES back into the fog + pitches down. ---
    if (dreadK > 0.05) { rig.position.y = -dreadK * 9 + Math.sin(time * 2) * 0.4; rig.rotation.x = dreadK * 0.12; }

    // --- DRIFT BUBBLES rise around the head. ---
    for (const o of orbiters) {
      const u = o.userData;
      const t2 = (time * u.speed + u.ph) % 20;
      o.position.set(u.x + Math.sin(time * u.sway + u.ph) * 1.5, u.y0 + t2 - dyingK * 6, u.z);
      const k = 1 - (t2 / 20);
      o.scale.setScalar(0.5 + k * 0.8);
    }
    bubMat.opacity = 0.22 * (1 - dyingK);
  }

  // Muzzle: the beast EXHALES its volleys/geysers from the MAW (emitter = organ).
  const muzzle = new THREE.Object3D(); muzzle.name = 'brineMaw'; muzzle.position.set(0, -2.5, 5.5); group.add(muzzle);

  const sc = def.scale ?? 1.5;
  // the "never fits" number is now the VERTICAL span (the head thrusts UP — its
  // tallest extent, crown-to-jaw, is the dimension that exceeds the frame).
  function hullLength() { return HEAD_VH * 2 * sc; }        // world span (the "never fits" number)
  function eyeSurfaced() { return eyeUp; }
  function jawOpen() { return jawPivot.rotation.x; }
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
    hullLength, eyeSurfaced, jawOpen, shacklePositions,
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); },
  };
}
