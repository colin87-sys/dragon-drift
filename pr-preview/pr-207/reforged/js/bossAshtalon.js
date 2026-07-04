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
// FOCAL (§3.2): the VISOR SLIT is THE brightest thing — a single continuous thin
// molten white-orange bar, toneMapped=false, nothing crossing its front plane.
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
//   GAZE   — the whole cowl + slit turn toward the player (a subtle head tilt),
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
  // accents (root-crack strips + scar chunk + visor halo), NEVER the diffuse.
  // NEUTRAL charcoal (|R−B| ≤ 8, ZERO ember floor) — a warm/red diffuse read as
  // saturated OXBLOOD (a §3-law-3 violation, a G2 saturation fail, and a slot-5
  // palette collision the round-4 gate flagged). The capture biome is warm
  // (AMBER WASTES), so a neutral diffuse reads warm-neutral, low-sat.
  const charcoalMat = track(new THREE.MeshStandardMaterial({
    color: 0x16151a, emissive: accent, emissiveIntensity: 0.0, roughness: 0.85, metalness: 0.0, flatShading: true,
  }));
  const cowlMat = track(new THREE.MeshStandardMaterial({
    color: 0x0c0b10, emissive: accent, emissiveIntensity: 0.0, roughness: 0.88, metalness: 0.0, flatShading: true,
  }));
  // WING VALUE TIERS (§3.4 painted hierarchy) — all NEUTRAL charcoal, no ember in
  // the diffuse (gate directive 3). Ember lives only in the strips/scar/visor.
  const leadMat = track(new THREE.MeshStandardMaterial({
    color: 0x1c1a1f, emissive: accent, emissiveIntensity: 0.0, roughness: 0.8, metalness: 0.0, flatShading: true,
  }));
  const trailMat = track(new THREE.MeshStandardMaterial({
    color: 0x141317, emissive: accent, emissiveIntensity: 0.0, roughness: 0.84, metalness: 0.0, flatShading: true,
  }));
  const rootMat = track(new THREE.MeshStandardMaterial({
    color: 0x0d0c11, emissive: accent, emissiveIntensity: 0.0, roughness: 0.86, metalness: 0.0, flatShading: true,
  }));
  // Ember smoulder strips (the wing-root crack lines) — the ONLY ember on the
  // wing, so they carry the accent tier; brightened so G3 still reads ember.
  const emberStripMat = track(new THREE.MeshStandardMaterial({
    color: 0x2a1006, emissive: accent, emissiveIntensity: 0.2, roughness: 0.5, metalness: 0.2, flatShading: true,
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
  // THE HEAD — a raptor PROW, not a crate (gate directives 1 & 3): the cranium
  // sits BEHIND the visor plane (nothing may cross the slit's front), a hooked
  // BEAK projects forward-DOWN and BREAKS the silhouette below the cowl, and two
  // SWEPT-BACK crest fins trail behind the cowl top. Total head span ~4 (nape →
  // beak tip) reads as a head, not a billboard.
  // ---------------------------------------------------------------------
  const PROW_W = 1.5, COWL_W = 1.7;   // cowl ≤ 1.3×prow width ✓
  const prowGeo = (() => {
    // Cranium/skull: mass BEHIND the cowl — its front vertex lands at z≈0.8,
    // well behind the slit plane; its BOTTOM stays above the cowl bottom so only
    // the beak breaks the lower silhouette.
    const oct = strip(new THREE.OctahedronGeometry(1.0, lowQ ? 1 : 2));
    oct.scale(0.72, 0.56, 1.35);
    oct.translate(0, 0.3, -0.55);
    // BEAK — a NARROW 3-sided hook projecting forward-DOWN to a sharp VERTEX
    // (~y−0.7, z2.3) WELL below the cowl bottom (y−0.15): the head's lowest
    // silhouette pixel is a point, not a curve (gate directive 6).
    const beak = strip(new THREE.ConeGeometry(0.26, 1.7, 3));
    beak.rotateX(2.25); beak.rotateZ(0.4); beak.translate(0, -0.35, 1.75);
    const keel = strip(new THREE.BoxGeometry(0.14, 0.5, 1.3)); keel.translate(0, 0.58, -0.5);
    // Two crest fins SWEPT HARD BACK (tips trail well behind the cowl top, apex
    // low, sharp taper — gate directive 5). rotateX −1.2 leans them aft.
    const crest = (a) => {
      const c = strip(new THREE.ExtrudeGeometry(bladeShape(1.15, 0.22), { ...bladeExtrude, depth: 0.09 }));
      c.rotateX(-1.2); c.rotateZ(a); c.translate(a > 0 ? 0.18 : -0.18, 0.58, -0.2);
      return c;
    };
    // Brow relief: a mirrored pair of RAISED charcoal ledges over the visor ends
    // (0.14 thick, protruding well forward of the cowl face so each throws a
    // clear value step at capture scale — §5g face richness, gate dir 5/7).
    const brow = (sx) => {
      const b = strip(new THREE.BoxGeometry(0.42, 0.22, 0.5));
      b.rotateZ(-sx * 0.32); b.translate(sx * 0.6, 0.5, 1.62);
      return b;
    };
    return mergeCharcoal([oct, beak, keel, crest(0.25), crest(-0.25), brow(1), brow(-1)], 'prow');
  })();
  const prow = new THREE.Mesh(prowGeo, charcoalMat);
  rig.add(prow);

  const cowlGeo = (() => {
    // Visor PLATE (dark housing, slit framed in BLACK, §3.2) + a brow & jaw that
    // PROTRUDE forward of it so the slit sits RECESSED in the shadowed groove.
    // The plate front (z1.41) stays BEHIND the slit front (z1.40) at the centre —
    // only the brow (above) and jaw (below) protrude, never across the bar.
    // Visor PLATE pushed BACK (front z≈1.29) so the molten fringe (front z≈1.41)
    // sits clearly PROUD of the dark housing — when the plate was level with the
    // fringe it occluded the orange, leaving only the white core visible (that was
    // the round-4/5 "flat white bar" miss, directive 1).
    const plate = strip(new THREE.BoxGeometry(COWL_W, 0.62, 0.26)); plate.translate(0, 0.3, 1.16);
    // BROW LEDGE: a wide ledge tilted forward-DOWN so its front lip OVERHANGS the
    // slit from ABOVE (lip at y≈0.6, front z≈1.69) — the slit sits RECESSED in a
    // shadowed groove beneath a dark step, but the lip stays clear of the fringe
    // top (y0.58) so it never eats the upper orange band (directive 1 + 3).
    const brow = strip(new THREE.BoxGeometry(COWL_W + 0.16, 0.3, 0.6));
    brow.rotateX(0.34); brow.translate(0, 0.84, 1.46);
    // Central NASAL RIDGE — a forward peak ABOVE the slit that notches the head's
    // top silhouette so it is no longer a flat horizontal edge.
    const ridge = strip(new THREE.BoxGeometry(0.34, 0.36, 0.85));
    ridge.rotateX(0.22); ridge.translate(0, 0.9, 1.42);
    const jaw = strip(new THREE.BoxGeometry(COWL_W - 0.2, 0.2, 0.55)); jaw.translate(0, -0.12, 1.42);
    return mergeCharcoal([plate, brow, ridge, jaw], 'cowl');
  })();
  const cowl = new THREE.Mesh(cowlGeo, cowlMat);
  rig.add(cowl);

  // ---------------------------------------------------------------------
  // THE TORSO / SHOULDER-YOKE (gate directive 2): a broad charcoal chest that
  // BRIDGES the cowl out to both wing shoulders (x≈±1.1), sitting just BEHIND the
  // cowl and slit. Front-on it fills the sky that used to show between each wing
  // root and the head, so the flood-filled silhouette is ONE connected hunter,
  // not a floating head between two detached scythes.
  // ---------------------------------------------------------------------
  const torsoGeo = (() => {
    const chest = strip(new THREE.BoxGeometry(2.9, 1.05, 0.9)); chest.translate(0, -0.04, 0.12);
    // Shoulder pads angled down-out, reaching past the wing roots so the join is solid.
    const yokeL = strip(new THREE.BoxGeometry(1.0, 0.72, 0.7)); yokeL.rotateZ(0.42); yokeL.translate(-1.15, 0.16, 0.05);
    const yokeR = strip(new THREE.BoxGeometry(1.0, 0.72, 0.7)); yokeR.rotateZ(-0.42); yokeR.translate(1.15, 0.16, 0.05);
    // A keeled breast tapering down — gives the hunter a chest and breaks the box bottom.
    const keel = strip(new THREE.ConeGeometry(0.55, 1.15, 4)); keel.rotateX(Math.PI); keel.rotateY(0.78); keel.translate(0, -0.72, 0.42);
    return mergeCharcoal([chest, yokeL, yokeR, keel], 'torso');
  })();
  const torso = new THREE.Mesh(torsoGeo, charcoalMat);
  rig.add(torso);

  // ---------------------------------------------------------------------
  // THE VISOR SLIT — the ONE focal (§3.2/§4b, gate directive 2): a single
  // continuous molten bar, centred on the cowl, recessed in the shadowed groove,
  // toneMapped=false so bloom catches it. NOTHING crosses its front plane. NO
  // separate white core (it read as a second blob) — the bar IS the eye.
  // ---------------------------------------------------------------------
  const SLIT_W = COWL_W * 0.62;                  // ~65% of the cowl width (directive 2)
  // A molten bar = a thin WHITE-HOT core line (the §3.2 focal peak, passes the
  // brightness law) inside a wider ORANGE glow (so it reads MOLTEN, not a pure-
  // white sticker). Both horizontal + concentric → ONE bar, never segmented.
  const slit = new THREE.Group();
  slit.position.set(0, 0.3, 1.34);   // recessed behind the brow/jaw fronts (z1.72)
  // ORANGE molten FRAME — a wide, tall, saturated ember quad that extends well
  // beyond the white core on all sides, so the ring just outside the core reads
  // molten orange (R−B ≥ 60), not white tape (gate directive 4). 0xff5010 stays
  // deep orange even when HDR-boosted (R clips, B stays low).
  const glowMat = track(new THREE.MeshBasicMaterial({ color: 0xff5010 }));
  glowMat.toneMapped = false;
  const GLOW_BASE = new THREE.Color(1.0 * 1.8, 0.31 * 1.8, 0.06 * 1.8);   // (255,143,28) molten orange
  glowMat.color.copy(GLOW_BASE);
  // The molten FRINGE is TALL relative to the white core (0.56 vs 0.11) so a thick
  // band of saturated orange (~0.22 world each side) survives the core's white
  // bloom above and below it — the round-4/5 gate kept reading a flat white bar
  // because the old 0.34 fringe was drowned by the core halo (directive 1).
  // Fringe widened to 1.5× the slit so the full-size core has real TRAVEL room —
  // the voidmaw-style socket: the eye visibly roams within the orange.
  const slitFringe = new THREE.Mesh(new THREE.BoxGeometry(SLIT_W * 1.5, 0.62, 0.09), glowMat);
  slitFringe.position.z = 0.02;
  slit.add(slitFringe);
  // Thin white-hot CORE line inside the orange fringe (the §3.2 focal peak). Kept
  // NARROWER than the fringe on every side so orange caps its ends too, not just
  // its top/bottom — the whole slit reads MOLTEN, never white tape.
  const SLIT_BASE = new THREE.Color(0xffe4c0);
  const SLIT_HOT = 2.6;
  const slitMat = track(new THREE.MeshBasicMaterial({ color: 0xffe4c0 }));
  slitMat.toneMapped = false;
  slitMat.color.copy(SLIT_BASE).multiplyScalar(SLIT_HOT);
  // Thin+bright: peak solidly clears the G1 ≥250 focal law at capture scale, but
  // now ≥0.2 world of orange fringe shows above/below it (directive 1 acceptance).
  // The white-hot CORE — the §3.2 focal peak — kept at full size, but it SLIDES as a
  // whole within the molten orange fringe to act as the PUPIL, pointing at the player
  // (the tracking eye — subtle in the fight, a hard lock during the overtake pass).
  // Travel is bounded so the white core never slides out of the orange fringe.
  const core = new THREE.Mesh(new THREE.BoxGeometry(SLIT_W * 0.7, 0.11, 0.12), slitMat);
  core.position.z = 0.07;
  slit.add(core);
  // Travel bounds: (fringe − core)/2 slack each side, so a full deflection parks the
  // core hard against the fringe edge without ever sliding out of the orange.
  const PUPIL_X = SLIT_W * 0.38, PUPIL_Y = 0.22;
  rig.add(slit);

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
      // Ember strip along the blade's root third — a DIM smoulder line, not a
      // saturated blob. Skipped on the OUTERMOST blade of BOTH wings: the left
      // outer is the snapped scar (its own bright ember), and the right outer must
      // MIRROR that skip or its strip reads as a second asymmetric fleck the gate
      // flagged (directive 4 — exactly one saturated ember blob on the wings).
      const outerMost = i === N_PRIM - 1;
      if (!outerMost) {
        const es = new THREE.Mesh(emberStripGeo, emberStripMat);
        es.position.set(0, primLen[i] * 0.22, 0.11);
        pivot.add(es);
      }
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
    scar.mesh.geometry = makeBladeGeo(scar.len * 0.42, 0.52);   // snapped clearly short vs the right-wing mirror
    scar.mesh.material = leadMat;
    // ONE clean convex ember chunk flush on the snapped end (no jag, no floating
    // flecks). DIM (§3 law 2: never a second focal) — toneMapped emissive kept
    // in the 100–150 captured band, ≤60% of the visor. Sized so it reads on the
    // idle silhouette edge too, not only in charge (gate directive 6).
    const stumpMat = track(new THREE.MeshStandardMaterial({
      color: 0x140702, emissive: 0xff7a2e, emissiveIntensity: 0.6, roughness: 0.6, metalness: 0.1, flatShading: true,
    }));
    const stump = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), stumpMat);
    stump.position.set(0, scar.len * 0.42 - 0.06, 0.02);   // flush on the stump end
    scar.pivot.add(stump);
    scar.scar = true;
  }

  // ---------------------------------------------------------------------
  // CINDER-CHIP TRAILERS — 3 dark cinder chips streaming behind the hunter
  // (orbiter contract ≥2; law 8: satellites stay DARK, dim ember ei ≤0.12).
  // ---------------------------------------------------------------------
  // DARK cinders (§3 law 8: small satellites stay dark) — very low diffuse +
  // emissive so they read as unlit chips, never amber debris/false eyes that
  // rival the scar or visor (gate directive 4: captured luminance ≤110).
  const cinderMat = track(new THREE.MeshStandardMaterial({
    color: 0x060302, emissive: accent, emissiveIntensity: 0.03, roughness: 0.85, metalness: 0.0, flatShading: true,
  }));
  const cinderGeo = strip(new THREE.OctahedronGeometry(0.3, 0));
  const orbiters = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(cinderGeo, cinderMat);
    // Trail LOW and BEHIND the body (never flanking the head symmetrically —
    // that read as a second pair of eyes) but still on-frame.
    m.userData = { ang: (i / 3) * Math.PI * 2 + 0.9, radius: 1.6 + i * 0.4, speed: 0.8 + i * 0.22, baseY: -1.4 - i * 0.25, tilt: i * 0.7 };
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
  // Eye-lock (cinematic overtake): kill the idle look-aways and SNAP the pupil to
  // the fed gaze, so the white core hard-tracks the dragon through the pass.
  let eyeLock = false;
  function setEyeLock(v) { eyeLock = !!v; }
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

    // --- Gaze: high-lag pursuit + look-aways (the hunter sizing you up) — unless
    // eye-locked (cinematic), where it hard-tracks the fed gaze with no wandering.
    nextLookAway -= dt;
    if (lookAwayT > 0) lookAwayT -= dt;
    else if (!eyeLock && nextLookAway <= 0 && charge < 0.2 && noticeT <= 0 && dyingK <= 0) {
      lookAwayT = 0.7 + Math.random() * 0.6;
      lookAwayX = (Math.random() - 0.5) * 1.5;
      lookAwayY = Math.random() * 0.5 - 0.2;
      nextLookAway = 5 + Math.random() * 6;
    }
    const gx = (!eyeLock && lookAwayT > 0) ? lookAwayX : gazeTX;
    const gy = (!eyeLock && lookAwayT > 0) ? lookAwayY : gazeTY;
    const gLag = eyeLock ? 16 : (noticeT > 0 || charge > 0.5) ? 9 : 4.5;   // responsive pursuit; snaps to lock-on when hunting
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
    // The molten HALO leashes hard under a shield (the leash read, G6); but the
    // white-hot CORE stays lit so the focal is the boss's BRIGHTEST point in
    // EVERY state, above the bullets (§3.2 focal supremacy — gate directive 3).
    let haloK = shieldClamp ? 0.22 : flicker * (1 + charge * 0.35);
    let coreK = shieldClamp ? 0.85 : haloK;
    if (noticeT > 0) { haloK *= 1.3; coreK *= 1.3; }
    haloK *= 1 - dyingK * 0.9; coreK *= 1 - dyingK * 0.9;
    slitMat.color.copy(SLIT_BASE).multiplyScalar(Math.max(0.05, coreK) * SLIT_HOT);
    glowMat.color.copy(GLOW_BASE).multiplyScalar(Math.max(0.15, haloK));
    // Vertical thinning: blink crushes it; charge/shield narrow it to a hot line;
    // notice widens. Under shield the eye slits to a bright thread (leash + supremacy).
    let slitH = 1 - blinkProg * 0.85 - charge * 0.4 - (shieldClamp ? 0.4 : 0);
    if (noticeT > 0.5) slitH = 1.25;
    slitH *= 1 - dyingK * 0.9;
    slit.scale.y = Math.max(0.06, slitH);   // width (scale.x) stays 1 — the bar never segments (directive 2)

    // Cowl/prow/slit tilt TOGETHER toward the gaze (a subtle head turn) so the
    // eye stays seated in the cowl and the bar never detaches from the housing.
    prow.rotation.y = gazeX * 0.07;
    prow.rotation.x = -gazeY * 0.06 + (charge > 0 && tell === 'tuck' ? charge * 0.12 : 0);
    cowl.rotation.copy(prow.rotation);
    slit.rotation.y = prow.rotation.y;
    // The white-hot core (the PUPIL) slides within the orange fringe to point AT the
    // player — the tracking eye (subtle in the fight, a hard lock during the pass).
    core.position.x = gazeX * PUPIL_X;
    core.position.y = gazeY * PUPIL_Y;

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
      let shoulderInX = 0;         // inward pull of the shoulder (contracts the span)

      if (charge > 0.001 && !shieldClamp && dyingK <= 0) {
        if (gesture === 'mantle') {        // fold up + PULL IN — a hunched, narrow ready-to-stoop pose
          shoulderRot += 1.5 * charge;     // fold the blades hard up-forward
          fanMul = 1 - 0.8 * charge;       // collapse the fan
          shoulderInX = 1.15 * charge;     // draw the shoulders inward (span ~15 → ≤9, gate directive 2)
          rake += 0.35 * charge;
        } else if (gesture === 'flare') {  // spread wide — the fan
          shoulderRot += 0.12 * charge;
          fanMul = 1 + 0.95 * charge;
          rake -= 0.06 * charge;
        } else if (gesture === 'tuck') {   // fold back + down + in — the committed stoop
          shoulderRot += 1.3 * charge;
          fanMul = 1 - 0.72 * charge;
          shoulderInX = 0.9 * charge;
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
        shoulderInX = 0.5;
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
      // Snap FASTER while charging/shielded so the mantle contraction is fully
      // reached in the brief (rAF-throttled) capture window, not caught mid-ease.
      const poseSpeed = (charge > 0.25 || shieldClamp || setpieceK > 0) ? 20 : 5;
      const sEase = Math.min(1, dt * poseSpeed);
      w.shoulder.rotation.z += (shoulderRot * srSign - w.shoulder.rotation.z) * sEase;
      // Draw the shoulder inward on the folding poses (contracts the tip-to-tip span).
      const targetX = w.sx * (1.1 - shoulderInX);
      w.shoulder.position.x += (targetX - w.shoulder.position.x) * sEase;
      const fEase = Math.min(1, dt * (poseSpeed + 1));
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
    // Dim base (0.2) so the root strips read as a smoulder line, never a saturated
    // orange blob that rivals the ONE scar (directive 4). G3 ember is carried by
    // the molten visor + scar, which have ample margin (was 64% vs 25% needed).
    emberStripMat.emissiveIntensity = (0.2 + Math.sin(time * 1.7) * 0.06) * (1 - dyingK * 0.7);

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
    setEyeLock,
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
