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
  // WING VALUE TIERS (gate directive 4 — no flat-sticker shading, §3.4): three
  // painted charcoal values so the wing reads a hierarchy at 30m, plus the ember
  // smoulder strip. A low ember emissive floor keeps every tier WARM (never the
  // magenta a B>G charcoal reads under a cool sky). Hexes per the gate directive.
  const leadMat = track(new THREE.MeshStandardMaterial({
    color: 0x241a14, emissive: accent, emissiveIntensity: 0.09, roughness: 0.78, metalness: 0.0, flatShading: true,
  }));
  const trailMat = track(new THREE.MeshStandardMaterial({
    color: 0x121012, emissive: accent, emissiveIntensity: 0.06, roughness: 0.82, metalness: 0.0, flatShading: true,
  }));
  const rootMat = track(new THREE.MeshStandardMaterial({
    color: 0x0c0a0c, emissive: accent, emissiveIntensity: 0.05, roughness: 0.85, metalness: 0.0, flatShading: true,
  }));
  // Ember smoulder strips (ei 0.18) — the accent that reads at 30m, not only close.
  const emberStripMat = track(new THREE.MeshStandardMaterial({
    color: 0x2a1006, emissive: accent, emissiveIntensity: 0.18, roughness: 0.5, metalness: 0.2, flatShading: true,
  }));

  // Shared blade machinery (crest fins + wing scythe-blades): a curved tapered
  // scythe, extruded with bevel FACETS, plus a raised central RIB merged in on
  // the same material (relief, §3.4 — no flat stickers, gate directive 7).
  const bladeExtrude = { depth: 0.14, bevelEnabled: !lowQ, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: lowQ ? 1 : 2, steps: 1 };
  const bladeShape = (len, w) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(w * 0.62, len * 0.34, w * 0.18, len * 0.82);   // leading convex edge
    s.lineTo(0, len);                                                 // the point
    s.quadraticCurveTo(-w * 0.5, len * 0.5, -w * 0.5, len * 0.16);    // trailing concave scythe hollow
    s.lineTo(0, 0);
    return s;
  };
  const makeBladeGeo = (len, w) => {
    const g = strip(new THREE.ExtrudeGeometry(bladeShape(len, w), bladeExtrude));
    g.translate(0, 0, -0.07);
    const rib = strip(new THREE.BoxGeometry(Math.max(0.06, w * 0.16), len * 0.6, 0.13));
    rib.translate(0, len * 0.33, 0.085);   // raised spine (2 rib-relief facets)
    return mergeGeometries([g, rib], false) || g;
  };

  // ---------------------------------------------------------------------
  // THE HEAD — a raptor PROW, not a crate (gate directive 1): a cranium wedge
  // LENGTHENED to ~3.4 with a beak projecting forward-DOWN (nose well ahead of
  // the cowl, below the eye-line), a dark visor cowl NARROWER than the head, and
  // two swept-back CREST fins — the 30m read says "head", not "billboard".
  // ---------------------------------------------------------------------
  const PROW_W = 1.44, COWL_W = 1.7;   // cowl ≤ 1.3×prow width (1.87) ✓
  const prowGeo = (() => {
    const oct = strip(new THREE.OctahedronGeometry(1.0, lowQ ? 1 : 2));
    oct.scale(0.72, 0.6, 1.7);           // length 2·1.0·1.7 = 3.4 (the raptor skull)
    oct.translate(0, 0.2, -0.15);
    // BEAK — a hooked cone projecting forward-DOWN, tip ~z2.6 (≥1.0 ahead of the
    // cowl front z1.4) and BELOW the slit line so it never splits the eye.
    const beak = strip(new THREE.ConeGeometry(0.34, 1.5, 4));
    beak.rotateX(Math.PI * 0.56); beak.rotateZ(Math.PI / 4); beak.translate(0, -0.3, 2.05);
    const keel = strip(new THREE.BoxGeometry(0.14, 0.5, 1.4)); keel.translate(0, 0.55, -0.1);
    // Two swept-back crest fins off the cowl top (tapered extrudes, ±0.25 rad).
    const crest = (a) => {
      const c = strip(new THREE.ExtrudeGeometry(bladeShape(1.2, 0.3), { ...bladeExtrude, depth: 0.1 }));
      c.rotateX(0.95); c.rotateZ(a); c.translate(a > 0 ? 0.24 : -0.24, 0.74, 0.15);
      return c;
    };
    return mergeCharcoal([oct, beak, keel, crest(0.25), crest(-0.25)], 'prow');
  })();
  const prow = new THREE.Mesh(prowGeo, charcoalMat);
  rig.add(prow);

  const cowlGeo = (() => {
    // Visor PLATE (dark housing, slit framed in BLACK, §3.2) + a brow & jaw that
    // PROTRUDE forward of it so the slit sits RECESSED in the shadowed groove.
    const plate = strip(new THREE.BoxGeometry(COWL_W, 0.58, 0.26)); plate.translate(0, 0.3, 1.28);
    const brow = strip(new THREE.BoxGeometry(COWL_W + 0.1, 0.24, 0.6)); brow.translate(0, 0.62, 1.42);
    const jaw = strip(new THREE.BoxGeometry(COWL_W - 0.2, 0.2, 0.55)); jaw.translate(0, -0.02, 1.42);
    return mergeCharcoal([plate, brow, jaw], 'cowl');
  })();
  const cowl = new THREE.Mesh(cowlGeo, cowlMat);
  rig.add(cowl);

  // ---------------------------------------------------------------------
  // THE VISOR SLIT — the one focal (§3.2/§4b, gate directive 2): ONE continuous
  // thin molten bar, recessed in the cowl groove, HDR-overdriven ×2.4 with
  // toneMapped=false so it is the single hottest thing on the boss. Width ≤70%
  // of the cowl; NEVER segmentable (no socket-pair — that is slot 1's axis).
  // ---------------------------------------------------------------------
  const SLIT_BASE = new THREE.Color(0xffc07a);   // molten white-orange (directive 2)
  const SLIT_HOT = 2.4;
  const SLIT_W = COWL_W * 0.68;
  const slitMat = track(new THREE.MeshBasicMaterial({ color: 0xffc07a }));
  slitMat.toneMapped = false;
  slitMat.color.copy(SLIT_BASE).multiplyScalar(SLIT_HOT);
  const slit = new THREE.Mesh(new THREE.BoxGeometry(SLIT_W, 0.14, 0.12), slitMat);
  slit.position.set(0, 0.3, 1.34);   // recessed ~0.2 behind the brow/jaw front (z1.55)
  rig.add(slit);
  // Hot core: a small brighter spot that slides WITHIN the slit bounds for the
  // gaze — clamped inside the bar so the slit can never segment into two.
  const coreMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  coreMat.toneMapped = false;
  coreMat.color.setRGB(2.9, 2.5, 2.0);
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.1), coreMat);
  core.position.set(0, 0.3, 1.38);
  const CORE_TRAVEL = SLIT_W * 0.5 - 0.22;   // keep the hot spot off the slit ends
  rig.add(core);

  // ---------------------------------------------------------------------
  // THE WINGS — each a solid inner ROOT PLATE (darkest tier) carrying a COMB of
  // DISTINCT scythe-blades that fan off its leading edge with GAPS (≥4 notches
  // at 30m — not a slab, the mitten failure the gate flagged), ember strips
  // along each blade root, and covert blades at the base on LAG pivots. Blade
  // material is split into a leading tier + trailing tier (painted hierarchy,
  // §3.4). Canonical +X-out build; the left wing is a scale.x=-1 mirror
  // (DoubleSide avoids inverted-normal blackout).
  // ---------------------------------------------------------------------
  leadMat.side = trailMat.side = rootMat.side = emberStripMat.side = THREE.DoubleSide;

  // Root plate: the solid inner wing (a small crescent) — the "arm".
  const rootPlateGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(0.1, -0.5);
    s.quadraticCurveTo(1.5, -0.45, 2.4, 0.85);
    s.quadraticCurveTo(1.7, 0.9, 1.0, 0.7);
    s.quadraticCurveTo(0.4, 0.2, 0.1, -0.5);
    const g = strip(new THREE.ExtrudeGeometry(s, { ...bladeExtrude, depth: 0.2 }));
    g.translate(0, 0, -0.1);
    return g;
  })();

  // Blade comb layout (canonical +X-out): roots MARCH along the leading edge (a
  // wing arm, NOT one point → feathers, not a sunburst); the fan spans ±0.65 rad;
  // lengths swell toward the outer scythe tips; the outer half is the leading tier.
  const N_PRIM = lowQ ? 5 : 6;
  const primRoot = [], primAngle = [], primLen = [], primLead = [];
  for (let i = 0; i < N_PRIM; i++) {
    const t = i / (N_PRIM - 1);
    primRoot.push({ x: 0.85 + t * 2.2, y: 0.05 + t * 1.35 });
    primAngle.push(-0.95 + (t - 0.5) * 1.3);   // mean −0.95, fan ±0.65 rad (directive 3)
    primLen.push(2.6 + Math.sin((0.25 + t * 0.75) * Math.PI) * 1.8);   // 2.6 → ~4.4 outer scythe
    primLead.push(t >= 0.5);                    // outer half = leading tier + ember
  }
  const emberStripGeo = strip(new THREE.BoxGeometry(0.1, 0.95, 0.15));

  function buildWing(sx) {
    const shoulder = new THREE.Object3D();
    shoulder.name = sx < 0 ? 'wingPivotL' : 'wingPivotR';   // telegraph gate finds these by name
    shoulder.position.set(sx * 1.1, 0.28, -0.2);
    if (sx < 0) shoulder.scale.x = -1;   // mirror the canonical (+X-out) build for the left wing
    shoulder.rotation.z = 0;             // pose channel (mantle/tuck)
    rig.add(shoulder);

    shoulder.add(new THREE.Mesh(rootPlateGeo, rootMat));   // solid inner wing

    const blades = [];
    for (let i = 0; i < N_PRIM; i++) {
      const pivot = new THREE.Object3D();
      pivot.name = 'bladePivot';
      pivot.position.set(primRoot[i].x, primRoot[i].y, 0.08 + i * 0.15);   // z-stagger 0.15 (gaps don't self-occlude)
      pivot.rotation.z = primAngle[i];
      shoulder.add(pivot);
      const mesh = new THREE.Mesh(makeBladeGeo(primLen[i], 0.5), primLead[i] ? leadMat : trailMat);
      mesh.rotation.x = 0.1;
      pivot.add(mesh);
      // Ember strip along the blade's root third (ei 0.18 — reads at 30m, the
      // root-crack LineSegments did not).
      const es = new THREE.Mesh(emberStripGeo, emberStripMat);
      es.position.set(0, primLen[i] * 0.22, 0.11);
      pivot.add(es);
      blades.push({ pivot, base: primAngle[i], idx: i, len: primLen[i], isOuter: primLead[i], mesh });
    }

    // Covert blades: 3 short feathers at the wing base on their OWN lag pivots —
    // they trail the wing motion a beat behind (articulation, §5g richness).
    const coverts = [];
    for (let i = 0; i < 3; i++) {
      const cp = new THREE.Object3D();
      cp.name = 'covertPivot';
      cp.position.set(0.3 + i * 0.32, -0.35 - i * 0.1, -0.05 - i * 0.05);
      cp.rotation.z = -1.75 - i * 0.16;   // point down-outward (the base coverts)
      shoulder.add(cp);
      const cm = new THREE.Mesh(makeBladeGeo(1.05 + i * 0.15, 0.38), trailMat);
      cm.rotation.x = 0.1;
      cp.add(cm);
      coverts.push({ pivot: cp, base: cp.rotation.z });
    }

    return { shoulder, blades, coverts, sx, phase: sx < 0 ? 0 : Math.PI };
  }
  const wings = [buildWing(-1), buildWing(1)];

  // THE SCAR (§3.6, gate directive 5): the OUTERMOST LEFT blade is snapped at
  // 50% length with a jagged stump + a hot ember-tip block — a VISIBLE truncation
  // in the idle black fill (left vs right outline). KARNVOW later wears it (§5b).
  {
    const scar = wings[0].blades[N_PRIM - 1];
    scar.mesh.geometry.dispose();
    scar.mesh.geometry = makeBladeGeo(scar.len * 0.5, 0.52);
    scar.mesh.material = leadMat;
    // Jagged torn stump (a 3-sided cone) — not a clean cut.
    const jag = strip(new THREE.ConeGeometry(0.28, 0.42, 3));
    jag.rotateZ(0.5); jag.translate(0, scar.len * 0.5 - 0.05, 0.06);
    scar.pivot.add(new THREE.Mesh(jag, leadMat));
    // The still-smouldering ember tip block (0xffa050 ×1.6, sized ~0.35).
    const stumpMat = track(new THREE.MeshBasicMaterial({ color: 0xffa050 }));
    stumpMat.toneMapped = false; stumpMat.color.setRGB(2.55, 1.6, 0.8);
    const stump = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), stumpMat);
    stump.position.set(0, scar.len * 0.5, 0.06);
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
    // Held between the wings and low, near the body, so the trailers stay
    // ON-FRAME every capture (gate directive 8) rather than orbiting off-screen.
    m.userData = { ang: (i / 3) * Math.PI * 2 + 0.4, radius: 2.0 + i * 0.35, speed: 0.8 + i * 0.22, baseY: -0.6 + i * 0.2, tilt: i * 0.7 };
    rig.add(m);
    orbiters.push(m);
  }

  // Hit flash rings the EMBER smoulder tier (never the charcoal, so a struck
  // hunter flares hot at its wingtips — struck-metal read — instead of lighting
  // the whole dark body toy-orange; the craghold ledger lesson, transplanted).
  kit.flashBind(emberStripMat, 0.18);
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
    slit.scale.y = Math.max(0.06, slitH);   // width (scale.x) stays 1 — the bar never segments (directive 2)
    // Hot core rides the gaze along the slit, CLAMPED inside the bar so the slit
    // never splits into two; hidden while blinking/dying.
    core.position.x = Math.max(-CORE_TRAVEL, Math.min(CORE_TRAVEL, gazeX * 0.55));
    core.position.y = 0.3 + gazeY * 0.05;
    core.visible = blinkProg < 0.6 && dyingK < 0.85;
    const coreK = Math.max(0.1, slitK) * (noticeT > 0 ? 1.3 : 1);
    core.material.color.setRGB(2.9 * coreK, 2.5 * coreK, 2.0 * coreK);

    // Cowl/prow tilt toward the gaze (a subtle head turn); the slit rides along
    // so the eye stays seated in the cowl.
    prow.rotation.y = gazeX * 0.07;
    prow.rotation.x = -gazeY * 0.06 + (charge > 0 && tell === 'tuck' ? charge * 0.12 : 0);
    cowl.rotation.copy(prow.rotation);
    slit.rotation.y = prow.rotation.y; core.rotation.y = prow.rotation.y;

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
          shoulderRot += 0.95 * charge;    // ≥0.8 rad fold at full charge (gate directive 6)
          fanMul = 1 - 0.65 * charge;      // pull the span in (~14 → ≤9)
          rake += 0.3 * charge;
        } else if (gesture === 'flare') {  // spread wide — the fan
          shoulderRot += 0.12 * charge;
          fanMul = 1 + 0.95 * charge;
          rake -= 0.06 * charge;
        } else if (gesture === 'tuck') {   // fold back + down — the committed stoop
          shoulderRot += 1.0 * charge;
          fanMul = 1 - 0.7 * charge;
          rake += 0.5 * charge;
        }
      }

      if (painT > 0 && !shieldClamp && dyingK <= 0) {
        const k = painT / 0.32;
        fanMul = Math.max(fanMul, 1 + 1.1 * k);   // wings flinch OPEN
        shoulderRot += 0.15 * k;
      }

      // Shield raised: both wings lower and CLOSE symmetrically over the body (a
      // gentle, fast-settling fold — the can't-be-hurt read; the slit also
      // leashes dim). Kept modest so it never reaches the HP bar or tilts.
      if (shieldClamp) {
        shoulderRot = -0.45;
        fanMul = 0.4;
        rake = 0.35;
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

      // Ease the shoulder + blades toward targets. The shoulder rotation sits
      // OUTSIDE the wing's scale.x=-1 mirror (THREE applies scale innermost in
      // T·R·S), so it is NOT auto-conjugated like the blade pivots are — the left
      // wing needs the OPPOSITE sign to fold mirror-symmetric with the right.
      const srSign = w.sx < 0 ? -1 : 1;
      const sEase = Math.min(1, dt * 5);
      w.shoulder.rotation.z += (shoulderRot * srSign - w.shoulder.rotation.z) * sEase;
      const fEase = Math.min(1, dt * 6);
      for (const b of w.blades) {
        // Spread the fan around its centre (blade 0 = inner anchor).
        const target = b.base * fanMul + (b.isOuter ? Math.sin(time * 2 + b.idx) * 0.02 : 0);
        b.pivot.rotation.z += (target - b.pivot.rotation.z) * fEase;
        b.mesh.rotation.x += (rake - b.mesh.rotation.x) * fEase;
      }
      // Covert blades LAG the wing raise a beat behind (slower ease).
      const cEase = Math.min(1, dt * 2.6);
      for (const c of w.coverts) {
        const ct = c.base + shoulderRot * 0.5;
        c.pivot.rotation.z += (ct - c.pivot.rotation.z) * cEase;
      }
    }

    // Ember smoulder pulse (its own clock) + death gutter; tickFlash (LAST) wins.
    emberStripMat.emissiveIntensity = (0.18 + Math.sin(time * 1.7) * 0.06) * (1 - dyingK * 0.7);

    // Cinder trailers drift near the body (kept on-frame — dark, dim ei ≤0.25).
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(
        Math.cos(u.ang) * u.radius,
        u.baseY + Math.sin(time * 1.5 + u.tilt) * 0.5,
        -0.6 + Math.sin(u.ang) * u.radius * 0.3,
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
