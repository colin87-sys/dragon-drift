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
  // ---------------------------------------------------------------------
  // THE SKY-DOME — EMBERTIDE *IS* THE SKY. A large BackSide sphere, camera-POSITION-
  // locked in-game (boss.js copies `camera.position` onto `rig` for `skyReplace` defs,
  // so the dome re-centres on the camera every frame exactly like environment.js's real
  // sky dome — no edges at ANY aspect, and the crest sits on the WORLD horizon and stays
  // there as the chase-cam pitches). Opaque HDR (toneMapped=false → blooms), fog-exempt,
  // depthWrite=false + frustumCulled=false so it never occludes the world props/water and
  // never culls. The vermilion→coral-rose gradient + the bold light-BANDS are mapped by
  // ELEVATION (latitude rings), the hot CREST sits at the horizon, and the bands BOW UP
  // around the face's azimuth ("light pushed aside" = negative relief). It REPLACES the
  // real dome (boss.js crossfades that out — one sky, never two). ZERO additive.
  // ---------------------------------------------------------------------
  const DOME_R = 600;
  const BAND_COUNT = lowQ ? 5 : 7;
  const _bg = new THREE.Color();
  const domeSeg = lowQ ? [60, 36] : [88, 52];   // carries a big share of the ≥90% tri budget (the body)
  const domeGeo = new THREE.SphereGeometry(DOME_R, domeSeg[0], domeSeg[1]);
  {
    const pos = domeGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const e = THREE.MathUtils.clamp(y / DOME_R, -1, 1);   // sin(elevation)
      const elev = Math.asin(e);                             // -π/2 (down) .. +π/2 (zenith)
      const az = Math.atan2(x, -z);                          // 0 = FORWARD (-z) = the face azimuth
      const gt = THREE.MathUtils.smoothstep(e, -0.05, 0.55); // gradient vermilion(horizon)→rose(up)
      _bg.copy(accent).lerp(rose, gt);
      // Bow the BANDS up around the face azimuth (the light parts around the head).
      const bow = Math.exp(-Math.pow(az / 0.55, 2)) * Math.exp(-Math.pow((elev - 0.14) / 0.5, 2)) * 0.4;
      const band = Math.pow(Math.max(0, Math.sin((elev + bow) * BAND_COUNT * 2.6)), 2);
      const crest = Math.exp(-Math.pow((elev - 0.04) / 0.05, 2)) * 1.4;   // the hot horizon band (the surge edge)
      const hdr = 1 + band * 0.7 + crest;
      colors[i * 3] = _bg.r * hdr; colors[i * 3 + 1] = _bg.g * hdr; colors[i * 3 + 2] = _bg.b * hdr;
    }
    domeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
  const domeMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false }));
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.name = 'lightField';        // keep the roster/test organ name (this is the "wall of light")
  dome.frustumCulled = false;
  dome.renderOrder = -20;          // the backdrop draws first
  rig.add(dome);
  const _domeCol = domeMat.color.clone();
  // A slow spin gives the tide MOTION (the latitude bands sweep) without any extra draw
  // or overdraw — the whole sky is alive. Driven in tick.
  const domeSpin = dome;

  // The SCAR (§3.6): the dark leash-notch — a band-shaped dark bar riding the dome OFF
  // the face azimuth (where the face never reaches). The forward lore gap: who leashed
  // EMBERTIDE? → the Apex.
  const scarMat = track(new THREE.MeshBasicMaterial({ color: 0x000000, fog: false, blending: THREE.MultiplyBlending, transparent: true, depthWrite: false }));
  const scar = new THREE.Mesh(strip(new THREE.BoxGeometry(70, 8, 2)), scarMat);
  scar.name = 'leashNotch';
  { const az = -0.95, el = 0.30, r = DOME_R * 0.9;
    scar.position.set(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, -Math.cos(az) * Math.cos(el) * r);
    scar.lookAt(0, scar.position.y, 0); }
  scar.frustumCulled = false;
  scar.renderOrder = -12;
  rig.add(scar);

  // ---------------------------------------------------------------------
  // THE FACE — DARKNESS torn into the light (NOT an object on it). Everything is
  // MULTIPLY-blended: it DARKENS the bands behind it and fades to no-effect at the
  // edges, so the face dissolves into the field with NO perimeter and NO rim. Layered
  // occlusion, darkest at the tears: field(bright) → base shadow → brow/nose/chin
  // masses (darker) → eye-hollows/mouth (pure black). The whole thing overflows.
  // ---------------------------------------------------------------------
  // The face sits at the FORWARD HORIZON inside the dome (on the fight-direction azimuth
  // -z), scaled large to read at that distance, world-oriented (facing +z toward the
  // camera) so it anchors to the world horizon — a colossal face IN the sky, not a panel.
  const FACE_DIST = 520, FACE_SCALE = lowQ ? 6.4 : 7.2, FACE_Y = 44;
  const FACE_Z = -FACE_DIST;   // faceRig base z (the tick surge/death offset from here)
  const EYE_Y = 2.0, EYE_X = 4.2, EYE_Z = 2.6;   // eye-hollow placement (frontal, level, matched, symmetric)
  const faceRig = new THREE.Group();
  faceRig.name = 'faceRig';
  faceRig.position.set(0, FACE_Y, FACE_Z);
  faceRig.scale.setScalar(FACE_SCALE);
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
      // CROWN feather is TIGHTER than the jaw's: above the centre the shadow must
      // dissolve FAST into open sky — a wide 2–15% multiply halo hanging in the sky
      // reads as a translucent PANE once the HDR bloom amplifies it (glaring during
      // the entrance, where the crown pokes above the horizon into empty sky). The
      // jaw keeps the luxurious dissolve into the tide below.
      const ry = y > CY ? 12.5 : 16;
      const d = Math.sqrt((x / rx) ** 2 + ((y - CY) / ry) ** 2);
      // Feather ENDS inside the quad (d=1.0) and rises toward no-effect FAST (the
      // gamma) so the halo hugs the head instead of washing a frame-wide rectangle.
      const f = Math.pow(THREE.MathUtils.smoothstep(d, 0.42, 1.0), 0.7);   // 0 core → 1 rim
      const m = 0.16 + (1 - 0.16) * f;                        // 0.16 core (dark) → 1.0 rim (no effect)
      // Faintly warm shadow (a touch more red kept in the CORE) so the occluded light
      // reads as warm dusk, never a cool/magenta veil. The tint DECAYS WITH the
      // feather: at the rim every channel is EXACTLY 1.0, or the plane tints its
      // whole rectangle a few % and the quad boundary reads as a floating pane
      // (the CP2-A entrance made this glaring — the boundary straddles the open sky).
      col[i * 3] = m;
      col[i * 3 + 1] = m * (1 - 0.015 * (1 - f));
      col[i * 3 + 2] = m * (1 - 0.035 * (1 - f));
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
      // Warm tint decays WITH the feather (rim = exactly 1.0 in every channel —
      // see the base-shadow note: a constant rim tint pane-outlines the quad).
      c[i * 3] = m;
      c[i * 3 + 1] = m * (1 - 0.015 * (1 - f));
      c[i * 3 + 2] = m * (1 - 0.04 * (1 - f));
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
  // The emitter node lives on `group` (the STATION), NOT the camera-locked `rig`, so
  // bullets crest from a sane gameplay position while the VISUAL crest is up in the sky.
  const crestPivot = new THREE.Object3D();
  crestPivot.name = 'crestPivot';
  crestPivot.position.set(0, 6, 0);
  group.add(crestPivot);

  // EMBER MOTES — small opaque HDR points drifting UP the tide (embers; also the
  // handle's `orbiters`, ≥2 by contract). Opaque (no overdraw); they make the wall of
  // light read ALIVE, not a static skybox. They ride the field, BEHIND the face.
  const moteMat = track(new THREE.MeshBasicMaterial({ color: rose.clone().multiplyScalar(2.4), fog: false, toneMapped: false }));
  const moteGeo = new THREE.SphereGeometry(2.4, 7, 6);   // large enough to read across the dome-scale sky
  const orbiters = [];
  const MOTE_SPREAD = 560, MOTE_H = 400, MOTE_Z = -360;
  const moteCount = lowQ ? 8 : 18;   // more embers → the wall reads alive (draws land naturally)
  for (let i = 0; i < moteCount; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat);
    m.userData = { baseX: (i / moteCount - 0.5) * MOTE_SPREAD, phase: i * 1.7, speed: 22 + (i % 3) * 7, sway: 20 + (i % 4) * 8 };
    m.position.set(m.userData.baseX, -40, MOTE_Z);
    m.frustumCulled = false;
    m.renderOrder = -15;   // in the sky, behind the face-shadow
    rig.add(m);
    orbiters.push(m);
  }

  // THE CRUSH STRIPS (CP2-A "the sky crushes the lane") — a ceiling band of light that
  // DESCENDS and a swollen tide-line that RISES when the vertical squeeze fires, pinching
  // the open sky to a band with the face inside it. Opaque HDR gradient (hot at the inner
  // edge, fading to the dome's own gradient outward) → ZERO additive, trivial tris. They
  // ride the camera-locked rig just behind the face plane, ahead of the dome. Parked out
  // of frame (and invisible) until boss.js fires setCrush(1) at the first crescendo set.
  const stripMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false, depthWrite: false }));
  // TALL strips: only the blazing INNER edge is ever in frame — the strip's far edge
  // lives past the frame top / below the sea, so there is never a hard slab line
  // against the dome (the L219 law: the only hard edges are the tears). The whole
  // sky above the pinch reads as the descending wall of light.
  const CRUSH_Z = -560, CRUSH_W = 2400, CRUSH_H = 700;
  function crushStrip(name, inner) {   // inner: -1 = hot edge at the strip's BOTTOM (ceiling), +1 = at its TOP (floor swell)
    const g = new THREE.PlaneGeometry(CRUSH_W, CRUSH_H, lowQ ? 12 : 20, lowQ ? 4 : 6);
    const p = g.attributes.position;
    const c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const ny = (p.getY(i) / (CRUSH_H / 2)) * inner;          // +1 at the hot (inner) edge
      const hot = THREE.MathUtils.smoothstep(ny, 0.62, 1.0);   // the blaze concentrates at the crushing edge
      const body = THREE.MathUtils.smoothstep(ny, -1.0, 1.0);  // a broad lift toward the edge (the mass of light)
      _bg.copy(rose).lerp(accent, 0.15 + hot * 0.75);
      const hdr = 1.02 + body * 0.35 + hot * 1.8;              // far edge ≈ the dome's own register; the edge BLOOMS
      c[i * 3] = _bg.r * hdr; c[i * 3 + 1] = _bg.g * hdr; c[i * 3 + 2] = _bg.b * hdr;
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    const m = new THREE.Mesh(g, stripMat);
    m.name = name;
    m.position.set(0, (CRUSH_H / 2 + 380) * -inner, CRUSH_Z);   // parked: inner edge out of frame
    m.renderOrder = -16;                        // behind the face + motes, in front of the dome
    m.visible = false;
    rig.add(m);
    return m;
  }
  const crushCeil = crushStrip('crushCeil', -1);
  const crushFloor = crushStrip('crushFloor', 1);

  // The dome + face + motes are huge / far — never let the frustum cull them (they ARE
  // the sky). Mirrors the real dome's `sky.frustumCulled = false` (environment.js).
  rig.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });

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
  const faceBaseZ = FACE_Z, faceBaseY = faceRig.position.y;

  // §5j ENTRANCE — *The Sky Comes Loose* (CP2-A). u∈[0,1]: the dome LIFTS bright from
  // an ember seed, the face RISES through the horizon line (submerged → surfaced, the
  // BRINEHOLM rise grammar in sky-scale), and the eye-hollows TEAR OPEN one at a time,
  // then settle on the dragon (the notice pulse fires on the tear edge). Defaults to 1
  // (fully arrived) so the STUDIO / bossgate frames are untouched; boss.js stages 0 at
  // spawn for skyReplace defs and the entrance script drives the clock.
  let entranceU = 1, _entPrev = 1;
  function setEntrance(u) {
    _entPrev = entranceU;
    entranceU = Math.max(0, Math.min(1, u));
    if (entranceU >= 0.70 && _entPrev < 0.70) notice();   // the hollows settle ON you
  }

  // THE LOOM (CP2-A, the owner's "he grows") — each phase the face surfaces CLOSER/
  // LARGER (scale ramp + a slight rise so the chin clears the sea), eased slowly so the
  // growth reads as an approach, not a pop. The "never fits" law binds the FIELD, not
  // the face — capped at +50% so the face stays IN the sky (legibility guard).
  let loomTgt = 0, loomK = 0;
  function setLoom(k) { loomTgt = Math.max(0, Math.min(1, k)); }

  // THE TIDE CRUSH (CP2-A vertical squeeze visual): the ceiling band descends + the
  // tide-line swells up. boss.js fires setCrush(1) with the arena Y-clamp.
  let crushTgt = 0, crushK = 0;
  function setCrush(k) { crushTgt = Math.max(0, Math.min(1, k)); }

  // EXPRESSIONS (CP2-A, the owner's "mix up the face per attack") — §4b attack-tell
  // families, the CRAGHOLD TELL_FAMILY pattern re-expressed as FACE poses. The pose
  // strength rides the CHARGE envelope boss.js already drives (wind-up in, fire out),
  // so every telegraph gets a distinct face and it releases itself on the fire.
  const TELL_FAMILY = {
    aimed: 'narrow', stream: 'narrow',                                        // a glare — it has picked you
    fan: 'flare', spiral: 'flare', spiralStream: 'flare',                     // the tide fans wide
    curtain: 'tear', movingGap: 'tear', tunnel: 'tear', iris: 'tear', secondWave: 'tear',   // the wall arrives — the mouth tears
    crossfire: 'skew',                                                        // reading both flanks at once
  };
  let tellFamily = null, skewSide = 1;
  function setAttackTell(id) {
    tellFamily = id == null ? null : (TELL_FAMILY[id] ?? 'flare');
    if (tellFamily === 'skew') skewSide = _rnd() < 0.5 ? -1 : 1;
  }

  const sstep = THREE.MathUtils.smoothstep;

  function tickBody(dt, time) {
    // GAZE — the face turns its dark regard toward the dragon (lagged; a mind).
    const gLag = (noticeT > 0 || charge > 0.5) ? 10 : 3.5;
    gazeX += (gazeTX - gazeX) * Math.min(1, dt * gLag);
    gazeY += (gazeTY - gazeY) * Math.min(1, dt * gLag);
    faceRig.rotation.y = gazeX * 0.16 * (1 - dyingK);
    faceRig.rotation.x = -gazeY * 0.09 * (1 - dyingK);

    // EXPRESSION FAMILIES — the tell pose rides the CHARGE envelope (in on the wind-up,
    // out on the fire). One family at a time; everything lerp-free because charge itself
    // is eased by the driver.
    const fNarrow = tellFamily === 'narrow' ? charge : 0;
    const fFlare = tellFamily === 'flare' ? charge : 0;
    const fTear = tellFamily === 'tear' ? charge : 0;
    const fSkew = tellFamily === 'skew' ? charge : 0;
    faceRig.rotation.z = fSkew * 0.09 * skewSide * (1 - dyingK);   // the SKEW tilt (crossfire — reading both flanks)

    // CHARGE / NOTICE — the face pushes FURTHER through the light (surges +z, the masses
    // deepen); notice tears the hollows wide. Recoil (flinch) pulls it back briefly.
    if (noticeT > 0) noticeT -= dt;
    if (recoil > 0) recoil = Math.max(0, recoil - dt / 0.3);
    const noticePush = noticeT > 0 ? (noticeT / 1.1) * 1.4 : 0;
    // The face SURGES toward the camera through the light (dome-scale: ×~15 the old planar
    // amounts). Recoil (flinch) pulls it back briefly.
    faceRig.position.z = faceBaseZ + charge * 45 + noticePush * 12 - recoil * 26;
    const deepen = 1 + charge * 0.5 + noticePush * 0.15;
    browPivot.position.z = 0.5 * deepen;
    nosePivot.position.z = 0.7 * deepen + charge * 0.6 + fNarrow * 0.4;   // the glare focuses down the nose ridge
    chinPivot.position.z = 0.5 * deepen;
    // The BROW carries the expression: FLARE lifts it, NARROW drops it into a glare,
    // TEAR sags it as the mouth takes over, SKEW cocks it asymmetric.
    browPivot.position.y = 5.2 + fFlare * 1.0 - fNarrow * 1.3 - fTear * 0.5;
    browPivot.rotation.z = fSkew * 0.14 * skewSide;

    // §5j ENTRANCE — the face rises THROUGH the horizon (submerged → surfaced) and the
    // hollows tear open ONE AT A TIME (left, then right) as it clears the line.
    const entRise = sstep(entranceU, 0.30, 0.78);
    const entSubY = (1 - entRise) * 320;                     // 320 ≈ fully below the horizon at build scale
    const entTearL = sstep(entranceU, 0.56, 0.64);
    const entTearR = sstep(entranceU, 0.68, 0.76);
    const entMouth = sstep(entranceU, 0.82, 0.96);           // the mouth tears LAST, as the fight opens

    // THE LOOM — slow-eased growth toward the phase target (an approach, not a pop).
    loomK += (loomTgt - loomK) * Math.min(1, dt * 0.8);
    const loomE = easeLoom(loomK);
    faceRig.scale.setScalar(FACE_SCALE * (1 + loomE * 0.5));
    const loomRise = loomE * 26;                             // keep the bigger chin clear of the sea

    // Eye-hollows: TEAR OPEN on notice + WIDEN with charge, track the gaze, rare BLINK.
    // The tell families reshape them: FLARE widens further, NARROW squints to slits.
    if (blinkT > 0) blinkT -= dt;
    else { nextBlink -= dt; if (nextBlink <= 0 && charge < 0.4 && dyingK <= 0) { blinkT = BLINK_DUR; nextBlink = 6 + Math.random() * 5; } }
    const blinkK = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;
    const tear = 1 + (noticeT > 0 ? (noticeT / 1.1) * 0.9 : 0) + charge * 0.5 + fFlare * 0.8 - fNarrow * 1.05;
    const openY = tear * (1 - blinkK * 0.92) * (1 - dyingK);
    for (const [pv, sgn, entT] of [[eyeHollow0, -1, entTearL], [eyeHollow1, 1, entTearR]]) {
      pv.scale.set(1 + charge * 0.15 + fFlare * 0.3 - fNarrow * 0.35, Math.max(0.02, openY * entT), 1);
      pv.position.x = sgn * EYE_X + gazeX * 0.5;
      pv.position.y = EYE_Y + gazeY * 0.35;
    }
    // The mouth: TEAR rips it wide (the wall-attack tell), NARROW presses it thin.
    mouthPivot.scale.y = Math.max(0.05, (1 + charge * 0.25 + fTear * 1.5) * (1 - dyingK * 0.8) * entMouth);
    mouthPivot.scale.x = 1 + fTear * 0.4 - fNarrow * 0.2;

    // CHARGE / FLINCH on the SKY: the whole DOME brightens as the crest gathers (charge)
    // and on a hit-flash; a slow spin sweeps the latitude bands so the tide is in MOTION
    // (zero extra draw/overdraw — the whole sky is alive). No translate — it IS the sky.
    // During the ENTRANCE the dome LIFTS from an ember seed to full brightness (the
    // horizon coming loose) — the same multiply, zero extra cost.
    if (flashT > 0) flashT = Math.max(0, flashT - dt * 3);
    domeSpin.rotation.z += dt * (0.010 + charge * 0.02);
    const domeLift = 0.30 + 0.70 * sstep(entranceU, 0.05, 0.55);
    const swell = (1 + Math.sin(time * 0.6) * 0.05 + charge * 0.38 + flashT * 0.5) * domeLift;
    domeMat.color.copy(_domeCol).multiplyScalar(Math.max(0.02, swell * (1 - dyingK * 0.92)));

    // THE CRUSH — the ceiling band descends + the tide-line swells up (slow, dramatic),
    // pinching the open sky to a band with the face inside it. Retreats through death.
    crushK += (crushTgt - crushK) * Math.min(1, dt * 0.9);
    const crushE = crushK * (1 - dyingK);
    const crushOn = crushE > 0.01;
    crushCeil.visible = crushFloor.visible = crushOn;
    if (crushOn) {
      crushCeil.position.y = 520 + (200 - 520) * crushE + Math.sin(time * 1.7) * 6 * crushE;
      crushFloor.position.y = -80 + (30 + 80) * crushE + Math.sin(time * 1.4 + 2) * 4 * crushE;
    }

    // EMBER MOTES — drift UP across the sky, swaying (embers riding the tide). They
    // IGNITE with the entrance lift (dim embers while the sky is still seeding).
    const moteLift = 0.2 + 0.8 * sstep(entranceU, 0.4, 0.8);
    for (const o of orbiters) {
      const u = o.userData;
      const yy = ((time * u.speed + u.phase * 40) % (MOTE_H + 80)) - 60;
      o.position.set(u.baseX + Math.sin(time * 0.5 + u.phase) * u.sway, yy, MOTE_Z);
      const near = 1 - Math.min(1, Math.abs(yy - MOTE_H * 0.35) / (MOTE_H * 0.55));
      o.scale.setScalar((0.6 + near * 0.8) * (1 - dyingK) * moteLift);
    }

    // DEATH sinks the face below the horizon; the ENTRANCE raises it through it; the
    // LOOM lifts it as it grows. One write (the three never fight over the property).
    faceRig.position.y = faceBaseY + loomRise - entSubY - dyingK * 90;
  }
  // Loom easing: gentle start, decisive arrival (the face "surfaces closer").
  function easeLoom(k) { return k * k * (3 - 2 * k); }

  // The handle's front node (FX origin) — at the crest.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 6, 2.0);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    rig,   // the VISUAL sky-dome root — boss.js camera-POSITION-locks this for `def.skyReplace` (one sky)
    setDissolve: setDissolveEmotive,   // kit dissolve + the tide receding / the sky setting
    setCharge,
    setGaze, notice,
    setEntrance,        // §5j The Sky Comes Loose — dome lift + face rise + hollow tears (0→1)
    setLoom,            // CP2-A: per-phase face growth (0→1 across the fight)
    setCrush,           // CP2-A: the vertical-squeeze visual (ceiling descends, tide swells)
    setAttackTell,      // CP2-A: §4b tell families — the face poses per attack family
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: flinch,                     // kit flash + the field shudder / brighten / face recoil
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    dispose() {
      // Sweep BOTH `group` and `rig`: in a live fight boss.js reparents `rig` (the dome +
      // face + motes — the big geometry) out of `group` onto the scene, so a group-only
      // traversal would leak the sky sphere + face every encounter (repeatable in Boss
      // Rush / solo retries). Dedup so the studio path (rig still under group) frees once.
      const seenG = new Set(), seenM = new Set();
      const sweep = (root) => root && root.traverse((o) => {
        if (o.geometry && !seenG.has(o.geometry)) { seenG.add(o.geometry); o.geometry.dispose(); }
        if (o.material && !seenM.has(o.material)) { seenM.add(o.material); o.material.dispose(); }
      });
      sweep(group);
      sweep(rig);
    },
  };
}
