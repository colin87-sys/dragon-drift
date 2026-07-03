import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { mulberry32 } from './util.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// ASHTALON — "the Ember Hunter" (BOSS-DESIGN.md §5b/§5d slot 3, the first Tier-2
// COLOSSUS after CRAGHOLD's retirement). The first boss that does not wait: a
// charcoal raptor of TWO VAST SCYTHE-WINGS with ONE molten VISOR SLIT in a dark
// cowl. It overtakes from behind, banks wide, and circles between diving passes.
//
// SILHOUETTE-FIRST (§3.1): one sentence — "a charcoal raptor of two vast
// scythe-wings with one molten visor slit." The wings are the dominant mass
// (≥3× the prow); the prow is a small dark wedge carrying the single focal.
// Nothing round: no socket-pair (slot 1), no orb (slot 2) — a horizontal slit.
//
// FOCAL (§3.2): the VISOR SLIT is THE brightest thing — a thin HDR white-orange
// bar, toneMapped=false, overdriven ×2.4, with a hot core that slides for gaze.
// Everything else is charcoal with ember accents ≤0.2 (the smoulder), so the
// slit reads as the one eye of the hunter.
//
// PALETTE (registry slot 3): near-black charcoal 0x121012 base ei 0.02 (~75%),
// ember 0xff6a30 smoulder on the wingtips + root cracks (~20%), white-orange
// slit hottest (<5%). Distinct from every other boss at thumbnail size.
//
// THE SCAR (§3.6, one asymmetric break): the OUTERMOST LEFT blade is snapped at
// half length, its stump still ember-smouldering — the memory hook + lore gap
// (KARNVOW later wears this feather-blade on its trophy chain, §5b lore web).
//
// FACELESS-CARRIER LAW (§4b) — the visor slit + wing language carry all seven
// charisma channels behind the unchanged setGaze/notice hooks:
//   GAZE   — a hot core slides along the slit toward the player (+ cowl tilt),
//   BLINK  — the slit thins to a thread on its own slow clock,
//   CHARGE — wings mantle/flare/tuck per attack + the slit narrows to a hot line,
//   EXPRESSION — three wing poses (mantle=tracking / flare=fan / tuck=committed),
//   FLINCH — wings jerk back + the slit flickers,
//   NOTICE — wings SNAP to full flare + the slit flares white (fight-start beat),
//   DEATH  — the wings furl closed and the slit gutters out (a hunter grounded).
//
// CONTRACT: boss.js stomps `group.rotation` every frame (placeGroup) and
// `kit.setDissolve` owns `group.scale` — every animated part lives on `rig`, the
// wing shoulder pivots, or blade pivots under them, never on `group` itself.

export function buildEmberHunter(def, quality = 1) {
  const accent = def.accent ?? 0xff6a30;   // ember — identity lives in the emissive smoulder
  const glow = def.glow ?? 0xff9a4a;        // warmer ember — shield rim, shards
  const lowQ = quality < 0.75;

  // Shared plumbing. The shield bubble wraps the prow (the vulnerable core); the
  // wings sweep well outside it (machinery-outside-the-ward precedent). hpBarY
  // clears the mantled wingtips.
  const kit = createBossCommon(def, quality, { shieldRadius: 4.0, hpBarY: 6.4, hpBarZ: 1.4, hpBarScale: 0.8 });
  const { group, track } = kit;
  group.userData.archetype = 'emberHunter';   // guards the legacy-fallback coexist path (tests/boss.mjs)

  const rig = new THREE.Group();
  group.add(rig);

  const strip = stripForMerge;
  const mergeCharcoal = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildEmberHunter: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ---- Painted value tiers (the sun can't shade the front face — §3.4). The
  // charcoal runs near-black; the ember identity lives ONLY in the emissive
  // accent tier (wingtip smoulder + root cracks + the slit).
  // Warm charcoal (R≥G≥B): the sheet's 0x121012 has B>G, so warm/red biome
  // ambient tints the big flat wing membrane MAGENTA-hued (a false danger-role
  // collision the gate's G3 flags) — nudged warm so lit charcoal reads ember, not
  // magenta, while staying near-black (§3.3).
  const charcoalMat = track(new THREE.MeshStandardMaterial({
    color: 0x15120d, emissive: accent, emissiveIntensity: 0.07, roughness: 0.82, metalness: 0.0, flatShading: true,
  }));
  const cowlMat = track(new THREE.MeshStandardMaterial({
    color: 0x0b0906, emissive: accent, emissiveIntensity: 0.04, roughness: 0.86, metalness: 0.0, flatShading: true,
  }));
  // Smoulder tier: the ember accent as a DIM glow on the distal wingtips (the
  // "still-smouldering scythe"), kept low (ei 0.18) so the body reads charcoal,
  // never toy-orange (the §3.3 failure the gate's G2 guards).
  const emberMat = track(new THREE.MeshStandardMaterial({
    color: 0x1c0e06, emissive: new THREE.Color(accent), emissiveIntensity: 0.18, roughness: 0.5, metalness: 0.4, flatShading: true,
  }));

  // ---------------------------------------------------------------------
  // PROW — a flattened, stretched octahedron wedge (the fused head/body) with a
  // dark COWL band wrapping its front face and a BROW ledge over the slit (the
  // shadow that keeps the slit dreadful, not googly). Prow = one charcoal draw;
  // cowl+brow = one darker draw.
  // ---------------------------------------------------------------------
  const prowGeo = (() => {
    // The head sits BEHIND the visor plane so NOTHING occludes the molten slit —
    // it must read as ONE continuous bar (a wedge poking through its centre
    // splits it into two eye-slits, the googly failure). No cheek ridges either.
    const oct = strip(new THREE.OctahedronGeometry(1.05, lowQ ? 1 : 2));
    oct.scale(0.7, 0.62, 1.35);          // narrow, only mildly forward
    oct.translate(0, 0.2, -0.25);        // front tip lands ~z1.2, behind the slit (z1.52)
    // A hooked BEAK below the visor (a predator's chin), never in front of the eye.
    const beak = strip(new THREE.ConeGeometry(0.32, 0.9, 4));
    beak.rotateX(Math.PI * 0.62); beak.rotateZ(Math.PI / 4); beak.translate(0, -0.5, 1.2);
    // A keel crest along the top (the raptor ridge) + a nape block behind.
    const keel = strip(new THREE.BoxGeometry(0.14, 0.52, 1.5)); keel.translate(0, 0.56, -0.1);
    const nape = strip(new THREE.BoxGeometry(0.72, 0.62, 0.7)); nape.translate(0, 0.25, -0.85);
    return mergeCharcoal([oct, beak, keel, nape], 'prow');
  })();
  const prow = new THREE.Mesh(prowGeo, charcoalMat);
  rig.add(prow);

  const cowlGeo = (() => {
    // A dark arc band across the prow front (a curved visor housing) + the brow
    // ledge jutting over the slit. Built from a shallow ring of boxes so it
    // wraps the wedge face.
    const parts = [];
    const segs = lowQ ? 5 : 7;
    for (let i = 0; i < segs; i++) {
      const a = (-0.5 + i / (segs - 1)) * 1.7;   // arc across the face
      const b = strip(new THREE.BoxGeometry(0.42, 0.5, 0.26));
      b.rotateZ(a * 0.5);
      b.translate(Math.sin(a) * 1.05, 0.28 + Math.cos(a) * 0.12 - 0.12, 1.32);
      parts.push(b);
    }
    // A dark VISOR PLATE filling the housing behind the slit: the slit reads as
    // a bright core framed in BLACK (§3.2), not washed by the bright horizon
    // glowing through a thin head.
    const plate = strip(new THREE.BoxGeometry(2.3, 0.66, 0.22)); plate.translate(0, 0.26, 1.28);
    parts.push(plate);
    // Brow ledge over the slit (the dread shadow that keeps the eye menacing).
    const brow = strip(new THREE.BoxGeometry(2.35, 0.28, 0.55)); brow.translate(0, 0.66, 1.36);
    parts.push(brow);
    // Under-jaw lip beneath the slit.
    const lip = strip(new THREE.BoxGeometry(1.9, 0.22, 0.46)); lip.translate(0, -0.16, 1.36);
    parts.push(lip);
    return mergeCharcoal(parts, 'cowl');
  })();
  const cowl = new THREE.Mesh(cowlGeo, cowlMat);
  rig.add(cowl);

  // ---------------------------------------------------------------------
  // THE VISOR SLIT — the one focal (§3.2). A thin recessed HDR bar; toneMapped
  // false so bloom catches it in every path; ×2.4 overdrive = THE brightest
  // thing on the boss. A hot CORE rides inside it for gaze (the "pupil").
  // ---------------------------------------------------------------------
  const SLIT_BASE = new THREE.Color(0xffcaa0);   // molten white-orange
  const SLIT_HOT = 2.4;
  const slitMat = track(new THREE.MeshBasicMaterial({ color: 0xffcaa0 }));
  slitMat.toneMapped = false;
  slitMat.color.copy(SLIT_BASE).multiplyScalar(SLIT_HOT);
  // A wide, unmistakable molten bar (still SMALL vs the vast wings — the §3.2
  // focal), proud of the dark plate so nothing occludes it and it frames in black.
  const slitGeo = new THREE.BoxGeometry(2.0, 0.26, 0.14);
  const slit = new THREE.Mesh(slitGeo, slitMat);
  slit.position.set(0, 0.26, 1.52);
  rig.add(slit);
  // Hot core: a brighter block that slides along the slit for the gaze (the
  // "pupil" of the visor) — white-hot, the single hottest point on the boss.
  const coreMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  coreMat.toneMapped = false;
  coreMat.color.setRGB(2.8, 2.4, 1.9);
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.16), coreMat);
  core.position.set(0, 0.26, 1.6);
  rig.add(core);

  // ---------------------------------------------------------------------
  // THE WINGS — 2 shoulder pivots (wingPivotL/R), each a fan of tapered scythe
  // blades on their own pivots (bladePivot) so the flare telegraph can SPREAD
  // them (like a hand's fingers). Blades are extruded triangles; the outer ones
  // are ember-smouldering. Span ~14. This is the dominant silhouette mass.
  // ---------------------------------------------------------------------
  // Wing materials are DoubleSide (flat membranes seen edge-on during banks, and
  // so the LEFT wing can be a scale.x=-1 mirror of the canonical right-facing
  // build without inverted-normal blackout). Cheap opaque overdraw, not additive.
  charcoalMat.side = THREE.DoubleSide;
  emberMat.side = THREE.DoubleSide;

  const extrudeSettings = { depth: 0.13, bevelEnabled: !lowQ, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1, steps: 1 };
  // A tapered scythe feather-blade, pointing +Y, curved (leading convex, trailing
  // concave = the scythe hollow). Used for the primary feather-blades.
  const bladeShape = (len, w) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(w * 0.6, len * 0.34, w * 0.18, len * 0.82);   // leading (convex) edge
    s.lineTo(0, len);                                                // the point
    s.quadraticCurveTo(-w * 0.5, len * 0.5, -w * 0.5, len * 0.16);   // trailing (concave) scythe hollow
    s.lineTo(0, 0);
    return s;
  };
  const makeBladeGeo = (len, w) => {
    const g = new THREE.ExtrudeGeometry(bladeShape(len, w), extrudeSettings);
    g.translate(0, 0, -0.065);
    return g;
  };

  // THE MEMBRANE — one big swept scythe crescent per wing: the VAST wing mass
  // (§3.1 dominant form). Canonical build faces OUT along +X and sweeps UP into a
  // hooked tip; the left wing is a scale.x=-1 mirror. This is what makes the
  // silhouette a raptor's scythe-wing, not a spray of spikes.
  const membraneGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(0.15, -0.7);
    s.quadraticCurveTo(3.1, -0.9, 5.7, 1.9);     // leading edge sweeps out, then up
    s.quadraticCurveTo(6.7, 3.1, 6.2, 4.0);      // the hooked scythe TIP
    s.quadraticCurveTo(3.4, 2.7, 1.5, 1.05);     // concave trailing edge (the scythe hollow)
    s.quadraticCurveTo(0.55, 0.3, 0.15, -0.7);   // close back to the root
    const g = new THREE.ExtrudeGeometry(s, { ...extrudeSettings, depth: 0.18, bevelSize: 0.06 });
    g.translate(0, 0, -0.09);
    return g;
  })();
  // Membrane outline as an ember edge-line (overdraw-exempt glints, §2): the
  // smoulder rides the whole wing edge — the ember identity without diffusing it.
  const membraneEdgeGeo = (() => {
    const pts2 = [[0.15, -0.7], [3.1, -0.55], [5.7, 1.9], [6.2, 4.0], [3.4, 2.7], [1.5, 1.05], [0.15, -0.7]];
    const pts = [];
    for (let i = 0; i < pts2.length - 1; i++) {
      pts.push(pts2[i][0], pts2[i][1], 0.11, pts2[i + 1][0], pts2[i + 1][1], 0.11);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  })();
  const emberEdgeMat = track(new THREE.LineBasicMaterial({
    color: new THREE.Color(accent).multiplyScalar(0.95), transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));

  // PRIMARY feather-blades along the leading edge (canonical +X-out frame): the
  // separated scythe tips that break the outline into feathers, on pivots so the
  // FLARE telegraph spreads them (§5f "full flare = fan"). Outer ones smoulder.
  const N_PRIM = lowQ ? 4 : 6;
  const primRoot = [], primAngle = [], primLen = [];
  for (let i = 0; i < N_PRIM; i++) {
    const t = i / (N_PRIM - 1);
    primRoot.push({ x: 1.3 + t * 4.2, y: 0.35 + t * 1.9 });   // spaced along the leading edge, root→tip
    primAngle.push(-(0.55 + t * 0.45));                        // tip OUTWARD (+X): negative rot.z
    primLen.push(2.1 + t * 2.3);                               // 2.1 → 4.4, the long outer scythe tips
  }

  function buildWing(sx) {
    const shoulder = new THREE.Object3D();
    shoulder.name = sx < 0 ? 'wingPivotL' : 'wingPivotR';   // telegraph-silhouette gate finds these by name
    shoulder.position.set(sx * 1.15, 0.3, -0.2);
    if (sx < 0) shoulder.scale.x = -1;   // mirror the canonical (+X-out) build for the left wing
    shoulder.rotation.z = 0;             // pose channel (mantle/tuck)
    rig.add(shoulder);

    shoulder.add(new THREE.Mesh(membraneGeo, charcoalMat));
    shoulder.add(new THREE.LineSegments(membraneEdgeGeo, emberEdgeMat));

    const blades = [];
    for (let i = 0; i < N_PRIM; i++) {
      const pivot = new THREE.Object3D();
      pivot.name = 'bladePivot';
      pivot.position.set(primRoot[i].x, primRoot[i].y, 0.02 + i * 0.03);
      pivot.rotation.z = primAngle[i];
      shoulder.add(pivot);
      const isOuter = i >= N_PRIM - 2;
      const mesh = new THREE.Mesh(makeBladeGeo(primLen[i], 0.42 - i * 0.03), isOuter ? emberMat : charcoalMat);
      mesh.rotation.x = 0.1;   // slight aft rake
      pivot.add(mesh);
      blades.push({ pivot, base: primAngle[i], idx: i, len: primLen[i], isOuter, mesh });
    }

    return { shoulder, blades, sx, phase: sx < 0 ? 0 : Math.PI };
  }
  const wings = [buildWing(-1), buildWing(1)];

  // THE SCAR (§3.6): the OUTERMOST LEFT primary is snapped at half length, its
  // stump still ember-hot (KARNVOW later wears it — §5b lore web). The one
  // deliberate asymmetric break; both wings are otherwise mirror-symmetric.
  {
    const scar = wings[0].blades[N_PRIM - 1];
    scar.mesh.geometry.dispose();
    scar.mesh.geometry = makeBladeGeo(scar.len * 0.5, 0.46);
    scar.mesh.material = emberMat;
    const stumpMat = track(new THREE.MeshBasicMaterial({ color: 0xffb060 }));
    stumpMat.toneMapped = false; stumpMat.color.setRGB(2.0, 1.1, 0.5);
    const stump = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), stumpMat);
    stump.position.set(0, scar.len * 0.5, 0);
    scar.pivot.add(stump);
    scar.scar = true;
  }

  // ---------------------------------------------------------------------
  // CINDER-CHIP TRAILERS — 3 dark cinder chips streaming behind the hunter
  // (orbiter contract ≥2; law 8: satellites stay DARK, dim ember ei ≤0.12).
  // ---------------------------------------------------------------------
  const cinderMat = track(new THREE.MeshStandardMaterial({
    color: 0x140a06, emissive: accent, emissiveIntensity: 0.12, roughness: 0.5, metalness: 0.3, flatShading: true,
  }));
  const cinderGeo = strip(new THREE.OctahedronGeometry(0.34, 0));
  const orbiters = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(cinderGeo, cinderMat);
    m.userData = { ang: (i / 3) * Math.PI * 2, radius: 3.0 + i * 0.5, speed: 0.8 + i * 0.22, baseY: 0.4, tilt: i * 0.7 };
    rig.add(m);
    orbiters.push(m);
  }

  // Hit flash rings the EMBER smoulder tier (never the charcoal, so a struck
  // hunter flares hot at its wingtips — struck-metal read — instead of lighting
  // the whole dark body toy-orange; the craghold ledger lesson, transplanted).
  kit.flashBind(emberMat, 0.18);
  kit.finalize();

  // ---------------------------------------------------------------------
  // ANIMATION — wing poses (mantle / flare / dive-tuck), the slit charisma, and
  // the idle hunter's beat.
  // ---------------------------------------------------------------------
  // Pose targets, as (shoulderRot, fanMul, rakeX) triples the tell machine blends
  // toward as charge climbs. mantle = fold up-forward + narrow; flare = spread
  // wide; tuck = fold back+down (the committed dive).
  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  let tell = null;
  const TELL_FAMILY = {
    aimed: 'mantle', stream: 'mantle',
    fan: 'flare', spiral: 'flare', spiralStream: 'flare', secondWave: 'flare',
    crossfire: 'flare',
    tunnel: 'tuck', iris: 'tuck', curtain: 'tuck', movingGap: 'tuck',
  };
  function setAttackTell(id) { tell = id ? (TELL_FAMILY[id] ?? 'mantle') : null; }

  let setpieceK = 0;
  function setSetpiece(k) { setpieceK = Math.max(0, Math.min(1, k)); }

  let shieldClamp = false;
  let shieldOpenT = 0;
  kit.onShieldChange((v) => {
    if (v) { shieldClamp = true; return; }
    if (shieldClamp) { shieldClamp = false; shieldOpenT = 0.25; }
  });

  // --- Charisma layer (visor slit + wings) ---
  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  let lookAwayT = 0, lookAwayX = 0, lookAwayY = 0;
  let nextLookAway = 5 + Math.random() * 6;
  function setGaze(nx, ny) {
    gazeTX = Math.max(-1, Math.min(1, nx));
    gazeTY = Math.max(-1, Math.min(1, ny));
  }
  const BLINK_DUR = 0.22;
  let blinkT = 0, nextBlink = 3.5 + Math.random() * 3;
  let noticeT = 0;
  function notice() { noticeT = 0.9; blinkT = 0; nextBlink = 3; }
  let painT = 0;
  function flinchFlash(amt) { if (amt > 0.3) painT = Math.max(painT, 0.32); kit.flash(amt); }
  let dyingK = 0;
  function setDissolveEmotive(k) { dyingK = Math.max(0, Math.min(1, k)); kit.setDissolve(k); }

  function tickBody(dt, time) {
    // Idle: a slow wing-beat glide (root never animates — placeGroup owns it).
    rig.rotation.z = Math.sin(time * 0.5) * 0.015;
    rig.rotation.x += ((dyingK * 0.2) - rig.rotation.x) * Math.min(1, dt * 3);

    // --- Gaze: high-lag pursuit + look-aways (the hunter sizing you up) ---
    nextLookAway -= dt;
    if (lookAwayT > 0) lookAwayT -= dt;
    else if (nextLookAway <= 0 && charge < 0.2 && noticeT <= 0 && dyingK <= 0) {
      lookAwayT = 0.7 + Math.random() * 0.6;
      lookAwayX = (Math.random() - 0.5) * 1.5;
      lookAwayY = Math.random() * 0.5 - 0.2;
      nextLookAway = 5 + Math.random() * 6;
    }
    const gx = lookAwayT > 0 ? lookAwayX : gazeTX;
    const gy = lookAwayT > 0 ? lookAwayY : gazeTY;
    const gLag = (noticeT > 0 || charge > 0.5) ? 9 : 2.4;   // snaps to lock-on when hunting
    gazeX += (gx - gazeX) * Math.min(1, dt * gLag);
    gazeY += (gy - gazeY) * Math.min(1, dt * gLag);

    // --- Blink-analog: the slit thins to a thread on its own slow clock ---
    if (blinkT > 0) blinkT -= dt;
    else {
      nextBlink -= dt;
      if (nextBlink <= 0 && charge < 0.5 && noticeT <= 0 && dyingK <= 0) { blinkT = BLINK_DUR; nextBlink = 3.5 + Math.random() * 3; }
    }
    const blinkProg = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;

    if (painT > 0) painT -= dt;
    if (noticeT > 0) noticeT -= dt;
    if (shieldOpenT > 0) shieldOpenT -= dt;

    // --- The slit: two flicker frequencies + charge flare; narrows on charge
    // (the hunter's eye slitting to a hot line); leashed dim under a shield;
    // gutters out in death. Width (scale.x) is the blink/charge tell. ---
    const flicker = 0.85 + Math.sin(time * 4.2) * 0.1 + Math.sin(time * 13) * 0.04;
    let slitK = shieldClamp ? 0.24 : flicker * (1 + charge * 0.35);
    if (noticeT > 0) slitK *= 1.3;
    slitK *= 1 - dyingK * 0.9;
    slitMat.color.copy(SLIT_BASE).multiplyScalar(Math.max(0.05, slitK) * SLIT_HOT);
    // Vertical thinning: blink crushes it; charge narrows it to a line; notice widens.
    let slitH = 1 - blinkProg * 0.85 - charge * 0.4;
    if (noticeT > 0.5) slitH = 1.25;
    slitH *= 1 - dyingK * 0.9;
    slit.scale.y = Math.max(0.06, slitH);
    // The slit widens horizontally on flare/notice (the hunter's stare broadens).
    const wide = 1 + (tell === 'flare' ? charge * 0.35 : 0) + (noticeT > 0.5 ? 0.3 : 0);
    slit.scale.x = wide;
    // Hot core rides the gaze along the slit; hidden while blinking/dying.
    core.position.x = gazeX * 0.55;
    core.position.y = 0.26 + gazeY * 0.06;
    core.visible = blinkProg < 0.6 && dyingK < 0.85;
    const coreK = Math.max(0.1, slitK) * (noticeT > 0 ? 1.3 : 1);
    core.material.color.setRGB(2.6 * coreK, 2.2 * coreK, 1.7 * coreK);

    // Cowl/prow tilt toward the gaze (the hunter turning its head a touch).
    prow.rotation.y = gazeX * 0.12;
    prow.rotation.x = -gazeY * 0.08 + (charge > 0 && tell === 'tuck' ? charge * 0.12 : 0);
    cowl.rotation.copy(prow.rotation);
    slit.rotation.z = gazeX * 0.04;

    // Recoil (flinch/notice): the whole rig kicks back.
    const recoil = (painT > 0 ? painT / 0.32 : 0) * 0.4 + (noticeT > 0.6 ? (noticeT - 0.6) / 0.3 : 0) * 0.3;
    rig.position.z = -recoil;

    // --- Wings: pose targets blended by charge, plus the idle beat ---
    const gesture = tell ?? 'mantle';
    for (const w of wings) {
      const sx = w.sx;
      // Idle wing-beat: two frequencies, antiphase between wings.
      const beat = Math.sin(time * 1.1 + w.phase) * 0.10 + Math.sin(time * 1.9 + w.phase * 1.6) * 0.05;
      let shoulderRot = beat;      // rotation.z on the shoulder (raise/lower the whole wing)
      let fanMul = 1;              // spread multiplier on the blade fan
      let rake = 0.12;             // per-blade rotation.x (aft rake)

      if (charge > 0.001 && !shieldClamp && dyingK <= 0) {
        if (gesture === 'mantle') {        // fold up-forward, narrow — tracking a target
          shoulderRot += sx * 0.0 + (-0.35) * charge;    // raise both wings up-forward
          fanMul = 1 - 0.45 * charge;
          rake += 0.25 * charge;
        } else if (gesture === 'flare') {  // spread wide — the fan
          shoulderRot += 0.18 * charge;
          fanMul = 1 + 0.9 * charge;
          rake -= 0.06 * charge;
        } else if (gesture === 'tuck') {   // fold back + down — the committed stoop
          shoulderRot += 0.5 * charge;
          fanMul = 1 - 0.6 * charge;
          rake += 0.45 * charge;
        }
      }

      if (painT > 0 && !shieldClamp && dyingK <= 0) {
        const k = painT / 0.32;
        fanMul = Math.max(fanMul, 1 + 1.1 * k);   // wings flinch OPEN
        shoulderRot += 0.15 * k;
      }

      // Shield raised: wings MANTLE fully closed over the prow (the hunter tucks
      // its head under its wings — the can't-be-hurt read).
      if (shieldClamp) {
        shoulderRot = -0.7;
        fanMul = 0.25;
        rake = 0.5;
      } else if (shieldOpenT > 0) {
        shoulderRot += 0.2 * (shieldOpenT / 0.25);   // snap-open overshoot
      }

      // Setpiece (the stooping dive, CP2): wings sweep FULL back + tuck (the dive
      // silhouette) — base pose is inert until the controller drives setpieceK.
      if (setpieceK > 0 && !shieldClamp && dyingK <= 0) {
        shoulderRot += 0.55 * setpieceK;
        fanMul = Math.min(fanMul, 1 - 0.4 * setpieceK);
        rake += 0.5 * setpieceK;
      }

      // Notice beat: wings SNAP to full flare (the reveal spread).
      if (noticeT > 0.5) {
        shoulderRot = 0.25;
        fanMul = 1.9;
        rake = 0.0;
      }

      // Death: the wings furl closed and drop (a hunter grounded, never an explosion).
      if (dyingK > 0) {
        shoulderRot = shoulderRot * (1 - dyingK) + (-0.2) * dyingK;
        fanMul = fanMul * (1 - dyingK) + 0.12 * dyingK;
        rake = rake * (1 - dyingK) + 0.7 * dyingK;
      }

      // Ease the shoulder + blades toward targets.
      const sEase = Math.min(1, dt * 5);
      w.shoulder.rotation.z += (shoulderRot - w.shoulder.rotation.z) * sEase;
      const fEase = Math.min(1, dt * 6);
      for (const b of w.blades) {
        // Spread the fan around its centre (blade 0 = inner anchor).
        const target = b.base * fanMul + (b.isOuter ? Math.sin(time * 2 + b.idx) * 0.02 : 0);
        b.pivot.rotation.z += (target - b.pivot.rotation.z) * fEase;
        b.mesh.rotation.x += (rake - b.mesh.rotation.x) * fEase;
      }
    }

    // Ember smoulder pulse (its own clock) + death gutter; tickFlash (LAST) wins.
    emberMat.emissiveIntensity = (0.15 + Math.sin(time * 1.7) * 0.05) * (1 - dyingK * 0.7);
    emberEdgeMat.opacity = (0.4 + Math.sin(time * 1.3) * 0.14) * (1 - dyingK);

    // Cinder trailers stream behind.
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(
        Math.cos(u.ang) * u.radius,
        u.baseY + Math.sin(time * 1.5 + u.tilt) * 0.5,
        -1.2 + Math.sin(u.ang) * u.radius * 0.4,   // held BEHIND the wings (trailing cinders)
      );
      o.rotation.x += dt * 1.8;
      o.rotation.y += dt * 1.3;
    }
  }

  // Muzzle: fire originates from the visor slit (the hunter's line of sight). On
  // `group` (not `rig`) so it ignores idle motion — a stable controller ref.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.4, 2.2);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge,
    setAttackTell,
    setSetpiece,
    setGaze,
    notice,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: flinchFlash,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
