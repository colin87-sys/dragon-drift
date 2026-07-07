import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { mulberry32 } from './util.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// EMBERTIDE's body — "THE SKY SET LOOSE": THE HORIZON STANDING UP. A frame-wide
// wall of living light (vermilion→coral-rose light-bands) that FILLS and overflows
// the frame and IS the boss body; a colossal face pushes through it as DARK NEGATIVE
// relief — darkness WITHIN the light, not an object on top of it. The World-Enders
// SPATIAL peak (§5b slot 13, the 2nd-to-last boss).
//
// ⚠ r1 REDESIGN (owner rejected r0 as a floating idol-mask). The figure-ground is
// the whole point and r0 had it backwards: r0 = bright sky GROUND + a discrete lit
// dark mask FIGURE floating on it (rim halo, clean perimeter, downward spikes → it
// read as Voidmaw's mask / BRINEHOLM's solid head). r1 = the bright light-field IS
// the body; the face is DARKNESS torn into that light, with NO rim, NO discrete
// perimeter, NO spikes — its crown and sides DISSOLVE into the light-field / run off
// the edges; only the brow, nose, chin and the two eye-hollows are the hard read.
//
// THE TECHNIQUE that makes "darkness in the light" true (not a dark object on light):
// the face is rendered with **MultiplyBlending** — it DARKENS the light-bands behind
// it (occludes the glow) and fades to no-effect at its edges (dissolving into the
// field). Nothing here is a lit, opaque, rimmed sculpture. The eye-hollows are pure
// black (opaque) — TEARS in the glow, the absolute darkest.
//
// ⛔ OVERDRAW (L124/L126 — the only real perf cliff, EMBERTIDE's genuine risk): the
// field is OPAQUE HDR (blooms via toneMapped=false; replaces the sky dome), the face
// is MULTIPLY, the motes are opaque. ZERO AdditiveBlending/fresnel volumes from the
// model → the whole additive budget (≤2, incl. the in-game fever + kit shield) stays
// free. Everything is fog-exempt (material.fog=false) for the CP2 sky crossfade.
//
// §3b SILHOUETTE TRANSLATION (r1, re-stated in BOSS-DESIGN.md §5d): reads as "the
// HORIZON with a face in it" — NOT a floating mask (Voidmaw), NOT a solid breaching
// head (BRINEHOLM), NOT a plain gradient. The light IS the body; the face is the
// darkness in it.
//
// CONTRACT: boss.js stomps `group.rotation` (placeGroup) and `kit.setDissolve` owns
// `group.scale` — every animated part lives on `rig`/a pivot, NEVER on `group`.

export function buildEmbertide(def, quality = 1) {
  const accent = new THREE.Color(def.accent ?? 0xff3a1e);   // VERMILION — the tide's deep (bottom) end
  const rose = new THREE.Color(def.glow ?? 0xff7a5e);       // WARM coral-rose — the tide's light (top) end
  const lowQ = quality < 0.75;

  // Shared plumbing. The field is frame-wide, so the HP bar + shield are counter-
  // scaled small: the shield wards the FACE (the focal), not the whole sky.
  const kit = createBossCommon(def, quality, {
    shieldRadius: 12, shieldY: 0.5, hpBarY: 15, hpBarZ: 6, hpBarScale: 2.0,
    shieldRimStrength: 0.5, shieldCageOpacity: 0.34,
  });
  const { group, track } = kit;
  group.userData.archetype = 'embertide';   // guards the legacy-fallback coexist path (tests/boss.mjs)

  const rig = new THREE.Group();
  group.add(rig);

  const strip = stripForMerge;
  const mergeParts = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildEmbertide: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ---------------------------------------------------------------------
  // THE FIELD — the frame-wide wall of light, the BODY. ONE opaque plane, vertex-
  // coloured vermilion(bottom)→coral-rose(top) with BOLD structured horizontal
  // light-BANDS (the layered tide, not a soft gradient — the r0 gradient read as a
  // plain sky) and a hot CREST low in the frame. Opaque + HDR (toneMapped=false →
  // blooms) → it reads as the backdrop AND costs ZERO additive overdraw. Sized to
  // OVERFLOW both portrait edges at fight distance (it never fits — the spatial peak).
  // ---------------------------------------------------------------------
  const FIELD_W = 96, FIELD_H = 62, FIELD_Z = -4;
  const BAND_COUNT = lowQ ? 4 : 6;   // bold structured strata (the tide's layers)

  // The band-BOW ("light pushed aside" = negative relief): near the face column the
  // light rises UP, so bands arc up and over the head instead of running straight
  // behind it — the light is visibly displaced (the approved r1 cue). Shared by the
  // base field AND every layered tide-band so the WHOLE wall parts around the face.
  const faceBow = (x, y) => Math.exp(-Math.pow(x / 14, 2)) * Math.exp(-Math.pow(y / 22, 2));
  const _bg = new THREE.Color();
  // The base gradient vermilion→rose at a given world-y (0 bottom → 1 top of the field).
  const baseGrad = (y) => _bg.copy(accent).lerp(rose, THREE.MathUtils.clamp((y + FIELD_H / 2) / FIELD_H, 0, 1));

  // THE BASE FIELD — a smooth vermilion→rose gradient that fills the frame behind the
  // moving tide-bands (so gaps between bands never show dark), with the hot crest baked
  // in + the bow. The bold band STRUCTURE now lives in the separate layered tide-bands
  // below (real, moving geometry — the spatial-peak spectacle), not just baked here.
  const segX = lowQ ? 30 : 48, segY = lowQ ? 34 : 56;
  const fieldGeo = new THREE.PlaneGeometry(FIELD_W, FIELD_H, segX, segY);
  {
    const pos = fieldGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const t = THREE.MathUtils.clamp((y + faceBow(x, y) * 11 + FIELD_H / 2) / FIELD_H, 0, 1);
      baseGrad(y);
      const faintBand = Math.pow(Math.max(0, Math.sin(t * Math.PI * BAND_COUNT)), 2) * 0.22;   // a soft residual band under the tide
      const crest = Math.exp(-Math.pow((t - 0.30) / 0.07, 2)) * 0.7;   // the hot surge edge
      const hdr = 1 + faintBand + crest;
      colors[i * 3] = _bg.r * hdr; colors[i * 3 + 1] = _bg.g * hdr; colors[i * 3 + 2] = _bg.b * hdr;
    }
    fieldGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
  const fieldMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false }));
  const field = new THREE.Mesh(fieldGeo, fieldMat);
  field.name = 'lightField';
  field.position.z = FIELD_Z;
  field.renderOrder = -10;   // the backdrop draws first
  rig.add(field);

  // THE LAYERED TIDE — the bold structured light-bands as REAL, MOVING geometry (the
  // World-Enders spatial-peak spend): N wide opaque band-planes at staggered z, each a
  // bright ridge that fades seamlessly into the base gradient at its top/bottom edges
  // (opaque, no strip seam) and BOWS up around the face. They drift at parallax speeds
  // (see tick) so the wall of light reads as a deep, many-layered tide in motion —
  // still ZERO additive (opaque HDR, blooms via toneMapped=false). The bands REPLACE
  // the sky dome; they never stack a large ADDITIVE volume vs the camera.
  const tideBands = [];
  const tideMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false }));
  const TIDE_N = lowQ ? 3 : 6;
  const bandSegX = lowQ ? 22 : 36, bandSegY = lowQ ? 5 : 8;
  for (let b = 0; b < TIDE_N; b++) {
    const yc = -FIELD_H / 2 + (b + 0.5) / TIDE_N * FIELD_H;   // band centre height
    const halfH = (FIELD_H / TIDE_N) * 0.9;                    // slight overlap → seamless tiling
    const g = new THREE.PlaneGeometry(FIELD_W * 1.02, halfH, bandSegX, bandSegY);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i), ly = pos.getY(i);       // local (ly: -halfH/2..+halfH/2)
      const wy = yc + ly;                              // world y of this vertex
      // Bow the whole band up around the face (displace the geometry, so the arc is real).
      pos.setY(i, ly + faceBow(lx, wy) * 9);
      const ridge = Math.exp(-Math.pow(ly / (halfH * 0.34), 2));   // bright at band centre → 0 at its edges
      baseGrad(wy);
      const hdr = 1 + ridge * 0.95;                    // opaque: edges = base gradient (seamless), centre = a hot band
      col[i * 3] = _bg.r * hdr; col[i * 3 + 1] = _bg.g * hdr; col[i * 3 + 2] = _bg.b * hdr;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, tideMat);
    m.position.set(0, 0, FIELD_Z + 0.4 + b * 0.35);     // staggered z toward the camera (parallax depth)
    m.renderOrder = -9 + b;
    m.userData = { yc, driftAmp: 1.4 + (b % 3) * 0.7, driftSpd: 0.25 + b * 0.06, bobSpd: 0.5 + b * 0.11, phase: b * 1.3 };
    rig.add(m);
    tideBands.push(m);
  }

  // THE CREST — the tide's surge EDGE as real geometry (was a bare node): a wide, hot,
  // bowed band low in the frame that RISES + brightens on the charge tell (the crest
  // gathers before a big volley). Opaque HDR. The emitter organ (crestPivot) rides it.
  const crestMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false }));
  const crestY0 = -FIELD_H * 0.18;
  {
    const cg = new THREE.PlaneGeometry(FIELD_W * 1.02, 9, lowQ ? 30 : 48, lowQ ? 5 : 8);
    const pos = cg.attributes.position;
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i), ly = pos.getY(i);
      pos.setY(i, ly + faceBow(lx, crestY0 + ly) * 7);
      const ridge = Math.exp(-Math.pow(ly / 2.6, 2));
      baseGrad(crestY0 + ly);
      const hdr = 1 + ridge * 1.5;   // the hottest band (the surge edge)
      col[i * 3] = _bg.r * hdr; col[i * 3 + 1] = _bg.g * hdr; col[i * 3 + 2] = _bg.b * hdr;
    }
    cg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var crestStrip = new THREE.Mesh(cg, crestMat);
    crestStrip.name = 'crestStrip';
    crestStrip.position.set(0, crestY0, FIELD_Z + 2.6);
    crestStrip.renderOrder = -3;
    rig.add(crestStrip);
  }

  // The SCAR (§3.6): a torn, permanently DARK leash-notch — a HORIZONTAL band-shaped
  // dark bar riding ONE band, off to the side where the FACE never reaches, smaller
  // than the smallest facial feature. The forward lore gap: who leashed EMBERTIDE? → the Apex.
  const scarMat = track(new THREE.MeshBasicMaterial({ color: 0x000000, fog: false, blending: THREE.MultiplyBlending, transparent: true, depthWrite: false }));
  const scar = new THREE.Mesh(strip(new THREE.BoxGeometry(8, 0.9, 0.2)), scarMat);
  scar.name = 'leashNotch';
  scar.position.set(-30, 11, FIELD_Z + 0.5);
  rig.add(scar);

  // ---------------------------------------------------------------------
  // THE FACE — DARKNESS torn into the light (NOT an object on it). Everything is
  // MULTIPLY-blended: it DARKENS the bands behind it and fades to no-effect at the
  // edges, so the face dissolves into the field with NO perimeter and NO rim. Layered
  // occlusion, darkest at the tears: field(bright) → base shadow → brow/nose/chin
  // masses (darker) → eye-hollows/mouth (pure black). The whole thing overflows.
  // ---------------------------------------------------------------------
  const FACE_Z = 1.2;
  const EYE_Y = 2.0, EYE_X = 4.2, EYE_Z = 2.6;   // eye-hollow placement (frontal, level, matched, symmetric)
  const faceRig = new THREE.Group();
  faceRig.name = 'faceRig';
  faceRig.position.z = FACE_Z;
  rig.add(faceRig);

  // BASE SHADOW — a large head-shaped region of darkened light (multiply), soft-edged
  // so its CROWN and SIDES dissolve into the field (no discrete mask perimeter). Its
  // vertex colour is the multiply factor: dark in the core → 1.0 (no effect) at the
  // rim. Taller than wide (a head), the jaw tapering narrower.
  const BASE_W = 34, BASE_H = 46;
  const baseGeo = new THREE.PlaneGeometry(BASE_W, BASE_H, lowQ ? 28 : 44, lowQ ? 36 : 56);
  {
    const pos = baseGeo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const CY = -1.5;                       // centre slightly low (the face rises from below)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      // Head-shaped elliptical distance, jaw narrower below centre.
      const below = y < CY ? (CY - y) / 15 : 0;
      const rx = 11 * (1 - 0.35 * Math.min(1, below));
      const ry = 16;
      const d = Math.sqrt((x / rx) ** 2 + ((y - CY) / ry) ** 2);
      const f = THREE.MathUtils.smoothstep(d, 0.42, 1.12);   // 0 core → 1 rim
      const m = 0.16 + (1 - 0.16) * f;                        // 0.16 core (dark) → 1.0 rim (no effect)
      // Faintly warm shadow (a touch more red kept in the core) so the occluded light
      // reads as warm dusk, never a cool/magenta veil.
      col[i * 3] = m; col[i * 3 + 1] = m * 0.985; col[i * 3 + 2] = m * 0.965;
    }
    baseGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const baseMat = track(new THREE.MeshBasicMaterial({
    vertexColors: true, fog: false, blending: THREE.MultiplyBlending, transparent: true, depthWrite: false,
  }));
  const faceBase = new THREE.Mesh(baseGeo, baseMat);
  faceBase.name = 'faceRelief';   // the connected dark form (test seam)
  faceBase.position.z = 0.2;
  faceBase.renderOrder = 0;
  faceRig.add(faceBase);

  // The MASS features — brow / nose / chin as DARKER multiply occlusion (shadow-shapes
  // in the glow, the hard read), each on a NAMED pivot that surges forward on the charge
  // tell. Soft, feathered shapes (radial multiply gradient), never a hard-edged block.
  const massMat = track(new THREE.MeshBasicMaterial({
    vertexColors: true, fog: false, blending: THREE.MultiplyBlending, transparent: true, depthWrite: false,
  }));
  // A feathered dark mass: a plane whose multiply factor is dark in the middle → 1.0 at
  // the edge (so it darkens the light where the mass is, with no hard outline).
  function darkMass(w, h, dark, ry = 1) {
    const g = new THREE.PlaneGeometry(w, h, lowQ ? 9 : 15, lowQ ? 9 : 15);
    const p = g.attributes.position;
    const c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const nx = p.getX(i) / (w / 2), ny = p.getY(i) / (h / 2) / ry;
      const d = Math.sqrt(nx * nx + ny * ny);
      const f = THREE.MathUtils.smoothstep(d, 0.15, 1.0);
      const m = dark + (1 - dark) * f;
      c[i * 3] = m; c[i * 3 + 1] = m * 0.985; c[i * 3 + 2] = m * 0.96;
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return g;
  }
  function massPivot(name, x, y, z, geo) {
    const pv = new THREE.Object3D(); pv.name = name; pv.position.set(x, y, z);
    const m = new THREE.Mesh(geo, massMat); m.renderOrder = 1;
    pv.add(m); faceRig.add(pv); return pv;
  }
  const browPivot = massPivot('browMass', 0, 5.2, 0.5, darkMass(19, 5.0, 0.10, 0.8));   // heavy brow bar (wide, low arc)
  const nosePivot = massPivot('noseMass', 0, -1.0, 0.7, darkMass(4.6, 11, 0.06, 1.0));   // central nose ridge (tall, narrow — the deepest)
  const chinPivot = massPivot('chinMass', 0, -10.5, 0.5, darkMass(13, 7, 0.12, 0.9));    // chin/jaw mass low, fading into the tide below

  // RICHER soft relief (owner note: the face must survive motion + a phone screen, not
  // soften into "a smudge with two dots") — extra feathered multiply occlusion tiers
  // that DEEPEN the brow/cheek/temple structure. ALL feathered (radial multiply
  // gradient), NO hard edge, NO rim — they only darken the light a touch more where the
  // bone structure is, so the face reads sculpted in MOTION without becoming an object.
  const reliefTiers = [
    [10, 3.0, 0.30, -0.5, 6.6, 0.45, 1.0],   // brow-ridge undershadow (deepens the brow line)
    [7.5, 5.5, 0.28, -6.2, -3.0, 0.4, 0.9],  // left cheekbone hollow
    [7.5, 5.5, 0.28, 6.2, -3.0, 0.4, 0.9],   // right cheekbone hollow
    [4.2, 8.0, 0.46, -8.4, 4.0, 0.3, 1.3],   // left temple shadow (kept LIGHT — a hard temple column flirts with a mask side-edge)
    [4.2, 8.0, 0.46, 8.4, 4.0, 0.3, 1.3],    // right temple shadow
    [5.5, 3.0, 0.34, 0, -3.6, 0.5, 0.9],     // philtrum / upper-lip shadow (nose→mouth)
  ];
  for (const [w, h, dk, x, y, z, ry] of reliefTiers) {
    const m = new THREE.Mesh(darkMass(w, h, dk, ry), massMat);
    m.position.set(x, y, z); m.renderOrder = 1;
    faceRig.add(m);
  }

  // THE TEARS — the two EYE-HOLLOWS + the MOUTH: pure black, OPAQUE (holes torn in the
  // glow, not sockets on a mask), the absolute DARKEST value (the G1-inverted focal),
  // level / matched / symmetric. The hollows TEAR OPEN on notice + WIDEN on charge; a
  // rare band of light FILLS them (scale.y→~0) = the blink-analog.
  const tearMat = track(new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }));
  const hollowSeg = lowQ ? [12, 8] : [18, 12];
  function makeHollow(sx, name) {
    const pv = new THREE.Object3D(); pv.name = name; pv.position.set(sx * EYE_X, EYE_Y, EYE_Z);
    const g = new THREE.SphereGeometry(1.0, hollowSeg[0], hollowSeg[1]);
    g.scale(2.4, 1.6, 0.5);   // an almond torn open (wide, shorter, flat)
    const m = new THREE.Mesh(g, tearMat); m.renderOrder = 5;
    pv.add(m); faceRig.add(pv); return pv;
  }
  const eyeHollow0 = makeHollow(-1, 'eyeHollow0');
  const eyeHollow1 = makeHollow(1, 'eyeHollow1');

  const mouthPivot = new THREE.Object3D(); mouthPivot.name = 'mouthNotch'; mouthPivot.position.set(0, -6.4, 2.6);
  {
    const mg = new THREE.SphereGeometry(1.0, lowQ ? 12 : 16, lowQ ? 7 : 10);
    mg.scale(3.6, 1.0, 0.5);
    const m = new THREE.Mesh(mg, tearMat); m.renderOrder = 5;
    mouthPivot.add(m);
  }
  faceRig.add(mouthPivot);

  // THE CREST — the tide's surge edge (the emitter organ, def.muzzle='crestPivot'). A
  // positional node low in the field; the visible crest is baked into the field's hot band.
  const crestPivot = new THREE.Object3D();
  crestPivot.name = 'crestPivot';
  crestPivot.position.set(0, -FIELD_H * 0.20, 0.5);
  rig.add(crestPivot);

  // EMBER MOTES — small opaque HDR points drifting UP the tide (embers; also the
  // handle's `orbiters`, ≥2 by contract). Opaque (no overdraw); they make the wall of
  // light read ALIVE, not a static skybox. They ride the field, BEHIND the face.
  const moteMat = track(new THREE.MeshBasicMaterial({ color: rose.clone().multiplyScalar(2.4), fog: false, toneMapped: false }));
  const moteGeo = new THREE.SphereGeometry(0.5, 7, 6);
  const orbiters = [];
  const moteCount = lowQ ? 8 : 18;   // more embers → the wall reads alive (draws land naturally)
  for (let i = 0; i < moteCount; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat);
    m.userData = { baseX: (i / moteCount - 0.5) * FIELD_W * 0.85, phase: i * 1.7, speed: 2.4 + (i % 3) * 0.7, sway: 3 + (i % 4) };
    m.position.set(m.userData.baseX, -FIELD_H / 2, FIELD_Z + 0.6);
    m.renderOrder = -5;   // in the field, behind the face-shadow
    rig.add(m);
    orbiters.push(m);
  }

  kit.finalize();

  // ---------------------------------------------------------------------
  // ANIMATION + THE §4b CHARISMA CHANNELS (the focal is DARKNESS — the sanctioned
  // §3-law-2 exception): GAZE (the hollows track), BLINK (light fills the hollows),
  // CHARGE-TELL (the face pushes further through the light + the tide crest rises
  // TALLER), EXPRESSION (submerged / surfacing / hollows widening), FLINCH (the field
  // shudders + brightens), NOTICE (the hollows tear open + settle on you), DEATH (the
  // tide RECEDES — the light drains, the face SINKS below the horizon, the sky SETS).
  // ---------------------------------------------------------------------
  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  function setGaze(nx, ny) { gazeTX = Math.max(-1, Math.min(1, nx)); gazeTY = Math.max(-1, Math.min(1, ny)); }

  let noticeT = 0;
  function notice() { noticeT = 1.1; }

  let shudderT = 0, recoil = 0, flashT = 0;
  function flinch(amt) { if (amt > 0.3) { shudderT = Math.max(shudderT, 0.35); recoil = Math.max(recoil, 0.4); flashT = Math.max(flashT, 0.5); } kit.flash(amt); }

  let dyingK = 0;
  function setDissolveEmotive(k) { dyingK = Math.max(0, Math.min(1, k)); kit.setDissolve(k); }

  let blinkT = 0;
  const BLINK_DUR = 0.3;
  let nextBlink = 6 + Math.random() * 5;

  const _rnd = mulberry32(0xe3be7de0);
  const fieldBaseX = field.position.x, fieldBaseY = field.position.y;
  const faceBaseZ = FACE_Z, faceBaseY = faceRig.position.y;
  const _fieldCol = fieldMat.color.clone();

  function tickBody(dt, time) {
    // GAZE — the face turns its dark regard toward the dragon (lagged; a mind).
    const gLag = (noticeT > 0 || charge > 0.5) ? 10 : 3.5;
    gazeX += (gazeTX - gazeX) * Math.min(1, dt * gLag);
    gazeY += (gazeTY - gazeY) * Math.min(1, dt * gLag);
    faceRig.rotation.y = gazeX * 0.16 * (1 - dyingK);
    faceRig.rotation.x = -gazeY * 0.09 * (1 - dyingK);

    // CHARGE / NOTICE — the face pushes FURTHER through the light (surges +z, the masses
    // deepen); notice tears the hollows wide. Recoil (flinch) pulls it back briefly.
    if (noticeT > 0) noticeT -= dt;
    if (recoil > 0) recoil = Math.max(0, recoil - dt / 0.3);
    const noticePush = noticeT > 0 ? (noticeT / 1.1) * 1.4 : 0;
    faceRig.position.z = faceBaseZ + charge * 3.0 + noticePush - recoil * 1.8;
    const deepen = 1 + charge * 0.5 + noticePush * 0.15;
    browPivot.position.z = 0.5 * deepen;
    nosePivot.position.z = 0.7 * deepen + charge * 0.6;
    chinPivot.position.z = 0.5 * deepen;

    // Eye-hollows: TEAR OPEN on notice + WIDEN with charge, track the gaze, rare BLINK.
    if (blinkT > 0) blinkT -= dt;
    else { nextBlink -= dt; if (nextBlink <= 0 && charge < 0.4 && dyingK <= 0) { blinkT = BLINK_DUR; nextBlink = 6 + Math.random() * 5; } }
    const blinkK = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;
    const tear = 1 + (noticeT > 0 ? (noticeT / 1.1) * 0.9 : 0) + charge * 0.5;
    const openY = tear * (1 - blinkK * 0.92) * (1 - dyingK);
    for (const [pv, sgn] of [[eyeHollow0, -1], [eyeHollow1, 1]]) {
      pv.scale.set(1 + charge * 0.15, Math.max(0.02, openY), 1);
      pv.position.x = sgn * EYE_X + gazeX * 0.5;
      pv.position.y = EYE_Y + gazeY * 0.35;
    }
    mouthPivot.scale.y = Math.max(0.05, (1 + charge * 0.25) * (1 - dyingK * 0.8));

    // CHARGE TELL on the FIELD: the tide CREST GATHERS — the wall of light rises TALLER
    // (aspect change; a uniform scale auto-frames away in the studio, an aspect change
    // survives). Off the death path (charge=0 there).
    const chargeRise = dyingK <= 0 ? charge * 4.0 : 0;
    if (dyingK <= 0) field.scale.set(1, 1 + charge * 0.4, 1);

    // FLINCH: the whole light field SHUDDERS + BRIGHTENS on a hit (the face recoiled above).
    if (flashT > 0) flashT = Math.max(0, flashT - dt * 3);
    let fx = fieldBaseX, fy = fieldBaseY + chargeRise;
    if (shudderT > 0) { shudderT -= dt; const s = shudderT / 0.35; fx += (_rnd() - 0.5) * 2.6 * s; fy += (_rnd() - 0.5) * 1.8 * s; }
    field.position.x = fx; field.position.y = fy;

    // The FIELD lives: a slow breathing swell + a charge brighten (the crest gathers) +
    // the flinch flash. Driven on the material colour (opaque HDR, multiply-safe).
    const swell = 1 + Math.sin(time * 0.8) * 0.05 + charge * 0.3 + flashT * 0.5;
    fieldMat.color.copy(_fieldCol).multiplyScalar(Math.max(0.02, swell * (1 - dyingK * 0.92)));

    // LAYERED TIDE — parallax drift: each band slides at its own speed + bobs, so the
    // wall of light reads as a DEEP tide in MOTION. Death recedes them with the field.
    const tideDim = 1 - dyingK * 0.92;
    const tideDrop = dyingK > 0 ? -dyingK * FIELD_H * 0.7 : chargeRise * 0.5;
    for (const m of tideBands) {
      const u = m.userData;
      m.position.x = Math.sin(time * u.driftSpd + u.phase) * u.driftAmp;
      m.position.y = tideDrop + Math.sin(time * u.bobSpd + u.phase) * 0.6;
    }
    tideMat.color.setScalar(Math.max(0.02, (1 + charge * 0.25 + flashT * 0.4) * tideDim));

    // CREST — the surge edge RISES + brightens on the charge tell; recedes in death.
    crestStrip.position.y = crestY0 + (dyingK > 0 ? -dyingK * FIELD_H * 0.7 : charge * 3.5 + Math.sin(time * 0.9) * 0.4);
    crestMat.color.setScalar(Math.max(0.02, (1 + charge * 0.6 + flashT * 0.5) * tideDim));

    // EMBER MOTES — drift UP the tide, swaying, recycling at the crest.
    for (const o of orbiters) {
      const u = o.userData;
      const yy = ((time * u.speed + u.phase * 7) % (FIELD_H + 6)) - FIELD_H / 2 - 3;
      o.position.set(u.baseX + Math.sin(time * 0.9 + u.phase) * u.sway, yy, FIELD_Z + 0.6);
      const near = 1 - Math.min(1, Math.abs(yy) / (FIELD_H / 2));
      o.scale.setScalar((0.7 + near * 0.9) * (1 - dyingK));
    }

    // DEATH — the tide RECEDES: the light drains (field dims, above) + slides down, and
    // the face SINKS below the horizon line (the sky sets, §4b DEATH / §4.7).
    if (dyingK > 0) {
      field.position.y = fieldBaseY - dyingK * FIELD_H * 0.7;
      faceRig.position.y = faceBaseY - dyingK * 26;
    } else if (faceRig.position.y !== faceBaseY) {
      faceRig.position.y = faceBaseY;
    }
  }

  // The handle's front node (FX origin) — at the crest.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, -FIELD_H * 0.20, 2.0);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,   // kit dissolve + the tide receding / the sky setting
    setCharge,
    setGaze, notice,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: flinch,                     // kit flash + the field shudder / brighten / face recoil
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
