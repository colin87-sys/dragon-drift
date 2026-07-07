import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { mulberry32 } from './util.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// EMBERTIDE's body — "THE SKY SET LOOSE": the horizon standing up as a frame-wide
// wall of living light (vermilion→warm-coral-rose) with a colossal FRONTAL FACE
// deforming through it as dark NEGATIVE relief. The World-Enders SPATIAL peak
// (§5b slot 13, the 2nd-to-last boss). 13 is the sky in MAXIMUM MOTION; 14 (THE
// UNMASKED) is the sky perfectly STILL — this boss must be the loudest thing the
// player has seen so the finale's quiet is deafening.
//
// ⚠ THE VALUE INVERSION (owner Decision C; the sanctioned §3-law-2 exception, §4b):
// unlike every other boss (a DARK body with a BRIGHT focal), EMBERTIDE's "body" is
// the BRIGHT field and its focal/identity is the DARKNESS — the dark face + the two
// eye-hollows. The def carries `gate: { inverted: true, frameFill: true }` (the §7b
// override: G1 → dark-focal, G2/G4 exempt).
//
// ⛔ THE OVERDRAW DISCIPLINE (L124/L126 — overdraw is the ONLY real perf cliff, and
// it is EMBERTIDE's genuine risk: a frame-filling boss + the in-game fever/Surge
// volume + the kit shield). The resolution: this model has ZERO large additive
// volumes. The "wall of light" is an OPAQUE HDR-emissive field (it REPLACES the sky
// dome exactly like the dome is opaque — bright color multiplied past 1.0 with
// toneMapped=false blooms through the UnrealBloom pass regardless of blend mode,
// the mandala-eye trick), the dark face is opaque relief, and the edge-light is
// emissive, NOT an additive shell. So the only additive/fresnel volume the G7 gate
// counts is the kit shield (1) — leaving the whole additive budget for the in-game
// fever volume (≤2 total). Everything here is fog-exempt (material.fog=false) for
// the CP2 sky-replacement crossfade.
//
// §3b SILHOUETTE TRANSLATION (rev.2, Fable-gated PASS): reads as "a giant FACE in
// the sky" (two eye-hollows + a MOUTH — the pareidolia triangle), NOT a sunset, NOT
// storm-clouds (the face is ONE connected dark form, no floating blobs), NOT
// BRINEHOLM's solid breaching head (the bands are OCCLUDED/pushed aside by the
// relief — negative relief, not an object in front). See BOSS-DESIGN.md §5d.
//
// CONTRACT: boss.js stomps `group.rotation` every frame (placeGroup) and
// `kit.setDissolve` owns `group.scale` — every animated part lives on `rig` or a
// pivot under it, NEVER on `group` itself.

export function buildEmbertide(def, quality = 1) {
  const accent = new THREE.Color(def.accent ?? 0xff3a1e);   // VERMILION — the tide's deep (bottom) end
  const rose = new THREE.Color(def.glow ?? 0xff7a5e);       // WARM coral-rose — the tide's light (top) end + edge-light
  const RELIEF_DARK = 0x352b22;                              // DESATURATED warm brown (the face base): low saturation
                                                            // (s≈0.36) so lit face pixels never cross the danger-magenta
                                                            // check's s>0.5 gate — a SATURATED dark red/plum face renders
                                                            // in the reserved 327–357° band (G3 fail). Kept ABOVE the
                                                            // near-black hollows so the HOLLOWS stay the DARKEST (G1).
  const lowQ = quality < 0.75;

  // Shared plumbing. The field is frame-wide, so the HP bar + shield are counter-
  // scaled small: the shield wards the FACE (the weak point / focal), not the whole
  // sky. hpBarScale keeps the bar at the roster's usual on-screen width against a
  // boss whose field spans ~80 units.
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
  // THE FIELD — the frame-wide wall of light. ONE opaque plane, vertex-coloured
  // vermilion(bottom)→coral-rose(top) with brighter baked horizontal BAND stripes
  // (the layered tide) and a hot CREST band low in the frame. Opaque + HDR
  // (toneMapped=false, colours baked past 1.0 so the crest/bands bloom) → it reads
  // as the backdrop AND contributes ZERO additive overdraw. The z-sits BEHIND the
  // face so the relief occludes it (light pushed aside = negative relief).
  // lowQ drops the band/segment count (the grandeur dial — never below a legible field).
  // ---------------------------------------------------------------------
  const FIELD_W = 88, FIELD_H = 52, FIELD_Z = -4;
  const BAND_COUNT = lowQ ? 4 : 7;   // staggered light bands — the layered tide (grandeur; watch overdraw — but they're baked into ONE opaque mesh)
  const segX = lowQ ? 24 : 40, segY = lowQ ? 24 : 44;
  const fieldGeo = new THREE.PlaneGeometry(FIELD_W, FIELD_H, segX, segY);
  {
    const pos = fieldGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cTmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const t = THREE.MathUtils.clamp((y + FIELD_H / 2) / FIELD_H, 0, 1);   // 0 bottom → 1 top
      // Base gradient vermilion → coral-rose.
      cTmp.copy(accent).lerp(rose, t);
      // BEND THE BANDS AROUND THE FACE (Fable fix #2 — "light pushed aside" = negative
      // relief, NOT an object in front): near the face column the band PHASE bows
      // UPWARD, so the bright bands arc up and over the head instead of running
      // straight behind it. This is the single cue that separates EMBERTIDE from
      // BRINEHOLM's solid breaching head — the light is visibly displaced by the relief.
      const faceProx = Math.exp(-Math.pow(x / 12, 2)) * Math.exp(-Math.pow(y / 20, 2));
      const tBow = THREE.MathUtils.clamp((y + faceProx * 10 + FIELD_H / 2) / FIELD_H, 0, 1);
      // Baked BAND stripes: a periodic brightening (the tide's layered crests),
      // sharpened so the bands read as EDGES (the §3b "not a smooth gradient" anti-read).
      const band = Math.pow(Math.max(0, Math.sin(tBow * Math.PI * BAND_COUNT)), 3);
      // The hot CREST: a bright swell low in the frame (t≈0.30) — the surge edge.
      const crest = Math.exp(-Math.pow((t - 0.30) / 0.06, 2)) * 0.65;
      // Keep the HDR modest so the field stays SATURATED vermilion→rose (a blow-out to
      // white desaturates the accent hue → G3 fails, and a smooth white wash is the
      // §3b "pretty gradient" anti-read). The bands read as EDGES; only the crest bloom.
      const hdr = 1 + band * 0.5 + crest;   // >1 on the bands/crest → blooms (toneMapped=false)
      colors[i * 3] = cTmp.r * hdr;
      colors[i * 3 + 1] = cTmp.g * hdr;
      colors[i * 3 + 2] = cTmp.b * hdr;
    }
    fieldGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
  const fieldMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false }));
  const field = new THREE.Mesh(fieldGeo, fieldMat);
  field.name = 'lightField';
  field.position.z = FIELD_Z;
  field.renderOrder = -10;   // draws first (it's the backdrop) — nothing hides behind a bullet, but this sits behind the boss
  rig.add(field);

  // The SCAR (§3.6, de-conflicted per the Fable gate): a torn, permanently DARK
  // leash-notch — a HORIZONTAL band-shaped dark bar riding ONE band, off to the
  // side where the FACE never reaches, smaller than the smallest facial feature.
  // The memory hook + the forward lore gap: who/what leashed EMBERTIDE? → the Apex.
  const scarMat = track(new THREE.MeshBasicMaterial({ color: 0x0a0508, fog: false }));
  const scarGeo = strip(new THREE.BoxGeometry(7.5, 0.9, 0.2));
  const scar = new THREE.Mesh(scarGeo, scarMat);
  scar.name = 'leashNotch';
  scar.position.set(-27, 9.5, FIELD_Z + 0.2);
  rig.add(scar);

  // ---------------------------------------------------------------------
  // THE FACE — one CONNECTED dark form deforming through the light (frontal). A
  // base head-shape (the single connected silhouette + overflow read) plus RELIEF
  // masses raised on top (brow / nose / cheeks / jaw — value + self-shadow so it
  // reads as a face, not a flat sticker). Sits IN FRONT of the field so it occludes
  // the bright bands = the light pushed aside. Named movers (browMass/noseMass/
  // chinMass) surge forward on setCharge (the silhouette-changing telegraph, §3.5).
  // ---------------------------------------------------------------------
  const FACE_Z = 1.2;   // in front of the field, toward the player (+z)
  const EYE_Y = 2.2, EYE_X = 4.2, EYE_Z = 2.4;   // eye-hollow placement (frontal, level, matched, symmetric)
  const faceRig = new THREE.Group();     // the whole face; surges forward + turns its regard (setGaze/setCharge)
  faceRig.name = 'faceRig';
  faceRig.position.z = FACE_Z;
  rig.add(faceRig);

  const EMBER_GLOW = 0xd9782e;   // WARM AMBER ember-glow (hue ~22°) — the face's emissive floor. NOT the 7° accent
                                 // (a red emissive pushes lit face pixels into the danger-magenta band); amber reads
                                 // as embers smouldering in the relief AND keeps the face clear of the reserved band.
  const faceMat = track(new THREE.MeshStandardMaterial({
    color: RELIEF_DARK, emissive: EMBER_GLOW, emissiveIntensity: 0.12,   // a warm emissive FLOOR so the darkest face
    roughness: 0.85, metalness: 0.0, flatShading: true, fog: false,      // pixel stays above the pure-black hollows (G1)
  }));

  // Base connected form — a frontal head Shape (wide brow, tapering to a jaw),
  // extruded shallow. This is the ONE continuous dark region (no floating blobs).
  const FW = 9, FTOP = 11, FBOT = -12;   // face half-width + top/bottom (spans a big share of the field height)
  function buildFaceBase() {
    const s = new THREE.Shape();
    s.moveTo(-FW, FTOP * 0.55);
    s.quadraticCurveTo(-FW * 1.05, FTOP, 0, FTOP);          // brow crown
    s.quadraticCurveTo(FW * 1.05, FTOP, FW, FTOP * 0.55);
    s.quadraticCurveTo(FW * 1.08, 0, FW * 0.82, FBOT * 0.5); // cheek down to jaw
    s.quadraticCurveTo(FW * 0.5, FBOT, 0, FBOT);             // jaw to chin
    s.quadraticCurveTo(-FW * 0.5, FBOT, -FW * 0.82, FBOT * 0.5);
    s.quadraticCurveTo(-FW * 1.08, 0, -FW, FTOP * 0.55);
    s.closePath();
    const geo = strip(new THREE.ExtrudeGeometry(s, {
      depth: 1.4, steps: 1, bevelEnabled: !lowQ, bevelThickness: 0.6, bevelSize: 0.5, bevelSegments: 1, curveSegments: lowQ ? 5 : 9,
    }));
    geo.translate(0, 0, -0.7);
    return geo;
  }

  // A relief mass: a rounded box wedge raised toward the player (self-shadowing
  // ridge). `detail` drops at lowQ (the grandeur dial for the face richness).
  function reliefBox(w, h, d, x, y, z) {
    const g = strip(new THREE.BoxGeometry(w, h, d, 1, 1, 1));
    g.translate(x, y, z);
    return g;
  }

  // Merge the base + the QUIET relief (cheeks + jaw + temple) into ONE dark mesh —
  // the connected form. The EXPRESSIVE relief (brow/nose/chin) stay separate named
  // pivots so they can surge on the charge tell.
  const cheekParts = [buildFaceBase()];
  cheekParts.push(reliefBox(6.5, 3.2, 1.6, -4.4, -1.5, 1.0));   // left cheek
  cheekParts.push(reliefBox(6.5, 3.2, 1.6, 4.4, -1.5, 1.0));    // right cheek
  cheekParts.push(reliefBox(5.0, 2.4, 1.4, 0, -8.5, 1.0));      // jaw block (chin base)
  if (!lowQ) {
    cheekParts.push(reliefBox(2.6, 4.5, 1.2, -7.6, 4.2, 0.8));  // left temple
    cheekParts.push(reliefBox(2.6, 4.5, 1.2, 7.6, 4.2, 0.8));   // right temple
  }
  const faceMesh = new THREE.Mesh(mergeParts(cheekParts, 'face-base'), faceMat);
  faceMesh.name = 'faceRelief';
  faceRig.add(faceMesh);

  // ASYMMETRIC edge-RIM (Fable fix #3): light PILING against the relief — thickest/
  // brightest at the brow (where the face pushes hardest out of the light), thinning
  // to NOTHING at the jaw (where the face dissolves back into the tide). A uniform
  // stroke reads as a sticker border; asymmetric piling reads as light displaced.
  // OPAQUE warm-coral HDR-emissive (toneMapped=false → blooms), NOT an additive shell.
  // Vertex-coloured: bright at top → 0 at the bottom.
  const rimGeo = strip(buildFaceBase());
  rimGeo.scale(1.09, 1.07, 1.0);
  rimGeo.translate(0, 0.6, -0.5);   // pushed UP so the piling favours the brow
  {
    const rp = rimGeo.attributes.position;
    const rc = new Float32Array(rp.count * 3);
    const rcol = rose.clone().multiplyScalar(1.9);   // warm coral (not white-cream — keeps it off the pale-gold sibling)
    for (let i = 0; i < rp.count; i++) {
      const yy = rp.getY(i);
      const k = Math.max(0, Math.min(1, (yy - FBOT * 0.35) / (FTOP - FBOT * 0.35)));   // 0 low → 1 high
      const w = k * k;   // steep: the rim vanishes over the jaw, piles at the brow
      rc[i * 3] = rcol.r * w; rc[i * 3 + 1] = rcol.g * w; rc[i * 3 + 2] = rcol.b * w;
    }
    rimGeo.setAttribute('color', new THREE.BufferAttribute(rc, 3));
  }
  const rimMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false, side: THREE.BackSide }));
  const faceRim = new THREE.Mesh(rimGeo, rimMat);
  faceRim.name = 'faceRim';
  faceRig.add(faceRim);

  // A SECOND dark value (Fable fix #6): recess shadows one step darker than the face
  // base but clearly ABOVE the pure-black hollows — so the face reads as SCULPTED
  // relief (field bright > face dark > recess darker > hollows darkest), not a flat
  // fill. Sized to survive rel 30 (big soft masses, not hairline strokes).
  const socketMat = track(new THREE.MeshStandardMaterial({
    color: 0x241708, emissive: EMBER_GLOW, emissiveIntensity: 0.08,  // WARM dark brown (G≥B) + amber floor — a plum/magenta
    roughness: 0.9, metalness: 0.0, flatShading: true, fog: false,   // recess (B>G) would drift into the danger band (G3)
  }));
  const socketGeo = new THREE.SphereGeometry(1.0, lowQ ? 10 : 14, lowQ ? 7 : 10);
  function reliefShadow(w, h, x, y, z) {
    const g = socketGeo.clone(); g.scale(w, h, 0.4); g.translate(x, y, z); return g;
  }
  // Eye-socket recesses (behind the hollows), a brow-ridge shadow, cheek hollows, and
  // nose-side shadows — merged into ONE mid-dark mesh (one draw). z just under the face
  // front so they read as carved-in shadow, over the face base.
  const shadowParts = [
    reliefShadow(3.4, 2.4, -EYE_X, EYE_Y, 2.0), reliefShadow(3.4, 2.4, EYE_X, EYE_Y, 2.0),  // eye sockets
    reliefShadow(9.0, 1.1, 0, 4.0, 2.0),                                                     // brow-ridge shadow
    reliefShadow(2.2, 2.2, -6.0, -1.0, 1.6), reliefShadow(2.2, 2.2, 6.0, -1.0, 1.6),         // cheek hollows
    reliefShadow(1.0, 3.2, -1.7, -1.5, 2.0), reliefShadow(1.0, 3.2, 1.7, -1.5, 2.0),         // nose-side shadows
  ];
  faceRig.add(new THREE.Mesh(mergeParts(shadowParts.map((g) => strip(g)), 'face-shadows'), socketMat));

  // Named EXPRESSIVE relief — brow / nose / chin on pivots (they DEEPEN/surge forward
  // on the charge tell: the face pushing further out of the light).
  const browPivot = new THREE.Object3D(); browPivot.name = 'browMass'; browPivot.position.set(0, 5.4, 1.4);
  browPivot.add(new THREE.Mesh(strip(new THREE.BoxGeometry(14, 2.4, 2.2, 1, 1, 1)), faceMat));
  faceRig.add(browPivot);

  const nosePivot = new THREE.Object3D(); nosePivot.name = 'noseMass'; nosePivot.position.set(0, -0.5, 1.6);
  { // a central vertical wedge (a ridge), apex toward the player — catches a lit edge
    let ng = strip(new THREE.ConeGeometry(1.9, 9.0, 3));
    ng.rotateX(Math.PI / 2);   // point +z (toward player)
    ng.scale(1, 0.5, 1);
    nosePivot.add(new THREE.Mesh(ng, faceMat));
  }
  faceRig.add(nosePivot);

  // The JAW dissolves DOWNWARD into the tide (Fable fix #1 + #4): NO closed bottom
  // outline — instead of a rectangular chin block, tapering dark streaks bleed off the
  // jaw into the field, so the face can't parse as a bounded floating mask. `chinMass`
  // stays a NAMED pivot (a subtle jaw ridge + the streaks) so it still surges on charge.
  const chinPivot = new THREE.Object3D(); chinPivot.name = 'chinMass'; chinPivot.position.set(0, -9.5, 1.0);
  {
    const jawParts = [strip(new THREE.CylinderGeometry(2.6, 1.6, 3.2, lowQ ? 6 : 10, 1))];   // a rounded jaw ridge (no square corners)
    jawParts[0].scale(1, 1, 0.6);
    const streakN = lowQ ? 3 : 5;
    for (let i = 0; i < streakN; i++) {
      const sx = (i / (streakN - 1) - 0.5) * 9;
      const len = 7 + (2 - Math.abs(i - (streakN - 1) / 2)) * 2.5;   // longer near centre
      let sg = strip(new THREE.ConeGeometry(0.9, len, 4));           // a tapering drip (point DOWN into the tide)
      sg.rotateX(Math.PI);
      sg.scale(1, 1, 0.35);
      sg.translate(sx, -2.0 - len / 2, -0.2);
      jawParts.push(sg);
    }
    chinPivot.add(new THREE.Mesh(mergeParts(jawParts, 'jaw-dissolve'), faceMat));
  }
  faceRig.add(chinPivot);

  // ---------------------------------------------------------------------
  // THE DARKEST VALUES — the pareidolia triangle: two EYE-HOLLOWS + a MOUTH. Pure
  // near-black (darker than the RELIEF_DARK face so they win the G1-inverted
  // dark-focal contest), level, matched, symmetric about the vertical axis. The
  // hollows TEAR OPEN on notice() and WIDEN on the charge tell (scale.y); a rare
  // band of light FILLS them (scale.y→~0) = the blink-analog.
  // ---------------------------------------------------------------------
  const hollowMat = track(new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }));
  const hollowSeg = lowQ ? [10, 7] : [16, 11];
  function makeHollow(sx, name) {
    const pivot = new THREE.Object3D();
    pivot.name = name;
    pivot.position.set(sx * EYE_X, EYE_Y, EYE_Z);
    const g = new THREE.SphereGeometry(1.0, hollowSeg[0], hollowSeg[1]);
    g.scale(2.3, 1.5, 0.6);   // an almond (wide, shorter, flat)
    const m = new THREE.Mesh(g, hollowMat);
    pivot.add(m);
    faceRig.add(pivot);
    return pivot;
  }
  const eyeHollow0 = makeHollow(-1, 'eyeHollow0');
  const eyeHollow1 = makeHollow(1, 'eyeHollow1');

  // The MOUTH — the third dark anchor, centred below and between the eyes (the
  // 2-second face guarantee). A dark lens notch; subordinate to the eyes (smaller).
  const mouthPivot = new THREE.Object3D(); mouthPivot.name = 'mouthNotch'; mouthPivot.position.set(0, -6.2, 2.2);
  {
    const mg = new THREE.SphereGeometry(1.0, lowQ ? 10 : 14, lowQ ? 6 : 9);
    mg.scale(3.4, 0.9, 0.5);
    mouthPivot.add(new THREE.Mesh(mg, hollowMat));
  }
  faceRig.add(mouthPivot);

  // ---------------------------------------------------------------------
  // THE CREST — the tide's surge edge (the emitter organ, def.muzzle='crestPivot').
  // A positional node low in the field (bullets crest from here); the visible crest
  // is baked into the field's hot band, so no extra additive geometry.
  // ---------------------------------------------------------------------
  const crestPivot = new THREE.Object3D();
  crestPivot.name = 'crestPivot';
  crestPivot.position.set(0, -FIELD_H * 0.20, 0.5);
  rig.add(crestPivot);

  // ---------------------------------------------------------------------
  // EMBER MOTES — small opaque HDR-emissive points drifting up the tide (thematic
  // embers; also the handle's `orbiters` — the roster contract needs ≥2). Cheap,
  // opaque (no overdraw), animated in tick.
  // ---------------------------------------------------------------------
  const moteMat = track(new THREE.MeshBasicMaterial({ color: rose.clone().multiplyScalar(2.3), fog: false, toneMapped: false }));
  const moteGeo = new THREE.SphereGeometry(0.55, 7, 6);
  const orbiters = [];
  const moteCount = lowQ ? 5 : 11;   // enough embers riding the tide that the field reads ALIVE at fight distance, not a static skybox (Fable fix #5)
  for (let i = 0; i < moteCount; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat);
    m.userData = {
      baseX: (i / moteCount - 0.5) * FIELD_W * 0.8,
      phase: i * 1.7,
      speed: 2.4 + (i % 3) * 0.7,
      sway: 3 + (i % 4),
    };
    m.position.set(m.userData.baseX, -FIELD_H / 2, FIELD_Z + 0.6);
    rig.add(m);
    orbiters.push(m);
  }

  // Hit flash targets the field material's... the field has no emissive; bind the
  // face material (the "alive" dark body — a flash surges its emissive so the whole
  // relief pulses hot for a frame, the field-shudder flinch's colour partner).
  kit.flashBind(faceMat, 0.05);

  kit.finalize();

  // ---------------------------------------------------------------------
  // ANIMATION + THE §4b CHARISMA CHANNELS (the focal is DARKNESS — the sanctioned
  // §3-law-2 exception): GAZE (the hollows track), BLINK (light fills the hollows),
  // CHARGE-TELL (the face SURGES forward, relief deepens, crest gathers), EXPRESSION
  // (submerged / surfacing / hollows-widening), FLINCH (the field SHUDDERS + the
  // face recoils), NOTICE (the hollows TEAR OPEN + settle on you), DEATH (the tide
  // RECEDES — the light drains, the face SINKS below the horizon, the hollows close,
  // the sky SETS).
  // ---------------------------------------------------------------------
  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  // GAZE — the face turns its dark regard toward the dragon (lagged; a mind, not a
  // turret). The eye-hollows lead the turn.
  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  function setGaze(nx, ny) { gazeTX = Math.max(-1, Math.min(1, nx)); gazeTY = Math.max(-1, Math.min(1, ny)); }

  let noticeT = 0;
  function notice() { noticeT = 1.1; }   // the hollows tear open + settle on the dragon

  let shudderT = 0, recoil = 0;   // FLINCH: field shudder + face recoil
  function flinch(amt) { if (amt > 0.3) { shudderT = Math.max(shudderT, 0.35); recoil = Math.max(recoil, 0.4); } kit.flash(amt); }

  let dyingK = 0;   // DEATH: the tide recedes / the sky sets
  function setDissolveEmotive(k) { dyingK = Math.max(0, Math.min(1, k)); kit.setDissolve(k); }

  // BLINK-analog: rare — a band of light closes over the hollows (this thing FIXATES,
  // like Stormrend "the unblinking"; each blink is an event).
  let blinkT = 0;
  const BLINK_DUR = 0.3;
  let nextBlink = 6 + Math.random() * 5;

  const _rnd = mulberry32(0xe3be7de0);
  const fieldBaseX = field.position.x, fieldBaseY = field.position.y;
  const faceBaseZ = FACE_Z, faceBaseY = faceRig.position.y;

  function tickBody(dt, time) {
    // --- GAZE: lagged pursuit; snappier under notice/charge (it locks on). ---
    const gLag = (noticeT > 0 || charge > 0.5) ? 10 : 3.5;
    gazeX += (gazeTX - gazeX) * Math.min(1, dt * gLag);
    gazeY += (gazeTY - gazeY) * Math.min(1, dt * gLag);
    // The face turns its regard; the hollows lead (they shift a touch further).
    faceRig.rotation.y = gazeX * 0.18 * (1 - dyingK);
    faceRig.rotation.x = -gazeY * 0.10 * (1 - dyingK);

    // --- NOTICE / EXPRESSION: how far the face is pushed through the light. Idle =
    // submerged (barely surfaced); charge = surfacing/looming (further out, relief
    // deepening); notice = the hollows tear WIDE. The face SURGES FORWARD on charge
    // — the silhouette-changing charge tell. ---
    if (noticeT > 0) noticeT -= dt;
    if (recoil > 0) recoil = Math.max(0, recoil - dt / 0.3);
    const surge = charge * 3.2;                 // the face pushes out of the light as it charges
    const noticePush = noticeT > 0 ? (noticeT / 1.1) * 1.4 : 0;
    faceRig.position.z = faceBaseZ + surge + noticePush - recoil * 2.0;
    // Relief deepens: brow/nose/chin push further toward the player on charge.
    const deepen = 1 + charge * 0.5 + noticePush * 0.15;
    browPivot.position.z = 1.2 * deepen;
    nosePivot.position.z = 1.6 * deepen + charge * 0.8;
    chinPivot.position.z = 1.0 * deepen;

    // --- Eye-hollows: TEAR OPEN on notice + WIDEN with charge (wrath), track the
    // gaze, and rarely BLINK (light fills them). Kept level + matched + symmetric. ---
    if (blinkT > 0) blinkT -= dt;
    else { nextBlink -= dt; if (nextBlink <= 0 && charge < 0.4 && dyingK <= 0) { blinkT = BLINK_DUR; nextBlink = 6 + Math.random() * 5; } }
    const blinkK = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;   // 0→1→0
    const tear = 1 + (noticeT > 0 ? (noticeT / 1.1) * 0.9 : 0) + charge * 0.5;    // widen
    const openY = tear * (1 - blinkK * 0.92) * (1 - dyingK);   // blink/death close the light over the dark
    for (const [pv, sgn] of [[eyeHollow0, -1], [eyeHollow1, 1]]) {
      pv.scale.set(1 + charge * 0.15, Math.max(0.02, openY), 1);
      pv.position.x = sgn * EYE_X + gazeX * 0.5;
      pv.position.y = EYE_Y + gazeY * 0.35;
    }
    mouthPivot.scale.y = Math.max(0.05, (1 + charge * 0.25) * (1 - dyingK * 0.8));

    // --- CHARGE TELL on the FIELD: the tide CREST GATHERS — the whole wall of light
    // SWELLS UP and out before a big volley (a silhouette-changing telegraph, §3.5 /
    // §4b "the crest gathers"). Off the death path (charge=0 there). ---
    const chargeRise = dyingK <= 0 ? charge * 4.0 : 0;
    // Non-uniform: the tide rises TALLER (scale.y), so the field's ASPECT changes —
    // the silhouette-mask read the auto-framed studio CAN see (a uniform scale
    // normalizes away; an aspect change survives). The face surges independently.
    if (dyingK <= 0) field.scale.set(1, 1 + charge * 0.42, 1);

    // --- FLINCH: the whole light field SHUDDERS on a hit; the face recoiled above. ---
    if (shudderT > 0) {
      shudderT -= dt;
      const s = (shudderT / 0.35);
      field.position.x = fieldBaseX + (_rnd() - 0.5) * 2.4 * s;
      field.position.y = fieldBaseY + chargeRise + (_rnd() - 0.5) * 1.6 * s;
    } else { field.position.x = fieldBaseX; field.position.y = fieldBaseY + chargeRise; }

    // --- The FIELD lives: a slow breathing swell + a charge brighten (the crest
    // gathers before a big volley). Driven on the material colour (opaque HDR). ---
    const swell = 1 + Math.sin(time * 0.8) * 0.06 + charge * 0.35;
    fieldMat.color.setRGB(swell, swell, swell);
    // Keep the face fill at least two value-steps below the field even at full charge
    // (Fable note): a small emissive rise, never enough to spend down the dark identity.
    faceMat.emissiveIntensity = 0.12 + charge * 0.10;
    rimMat.color.setScalar(1 + charge * 0.6 + (noticeT > 0 ? 0.4 : 0));   // brighten the piled rim (vertex colours carry the coral)

    // --- EMBER MOTES: drift UP the tide, swaying, recycling at the crest. ---
    for (const o of orbiters) {
      const u = o.userData;
      const yy = ((time * u.speed + u.phase * 7) % (FIELD_H + 6)) - FIELD_H / 2 - 3;
      o.position.set(u.baseX + Math.sin(time * 0.9 + u.phase) * u.sway, yy, FIELD_Z + 0.6);
      const near = 1 - Math.min(1, Math.abs(yy) / (FIELD_H / 2));   // brightest crossing the mid tide
      o.scale.setScalar((0.7 + near * 0.9) * (1 - dyingK));
    }

    // --- DEATH — the tide RECEDES: the light drains (field dims + slides down), the
    // face SINKS below the horizon line, the hollows close, the sky SETS. ---
    if (dyingK > 0) {
      const d = dyingK;
      field.position.y = fieldBaseY - d * FIELD_H * 0.7;   // the bands drop to the ground line
      faceRig.position.y = faceBaseY - d * 22;             // the face sinks back below the horizon
      fieldMat.color.multiplyScalar(1 - d * 0.9);          // the light drains
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
    setGaze,                           // optional charisma hooks — controller calls with ?.
    notice,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: flinch,                     // kit flash + the field shudder / face recoil
    // Write order matches every archetype: body tick FIRST, kit.tickCommon (flash
    // decay) LAST so a hit flash always wins on the shared face material.
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
