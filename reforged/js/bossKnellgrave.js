import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// KNELLGRAVE — "the Bound Toll" (BOSS-DESIGN.md §5b/§5d slot 10, the Tier-4
// WORLD-ENDERS band OPENER). A colossal cracked bell hanging from nothing, swinging
// above the lane, with a living BOUND FIGURE as its clapper. The roster's rhythm
// boss: the music DIES and the accelerating TOLL is the only clock.
//
// SILHOUETTE (§3b translation sheet — Fable pre-build sign-off PASS r2):
//   READS AS — a colossal cracked bell hanging from nothing, swinging above you, a
//   bound prisoner inside as its clapper. Stranger test: "a huge hanging bell with
//   someone inside."
//   CARRYING CUES (must reach the OUTLINE): (1) the BELL PROFILE — a big flared-lip
//   cracked bell, the flare curve plus a jagged BITE out of the lip EDGE (the crack
//   notches the outline in pure black fill); (2) the CHAIN as heavy discrete LINKS,
//   in the outline TWO ways — broken shackle-chains draping BELOW the lip (at rest)
//   + the main chain crossing DIAGONALLY toward its far-off-frame pivot on the swing;
//   (3) the BOUND CLAPPER — at swing extremes the phase-lagged clapper PROTRUDES past
//   the lip as a humanoid NOTCH (drooped head + strapped limb).
//   ANTI-READS — NOT a church bell (the jagged lip-bite + candle-slit + protruding
//   clapper); NOT a dome/UFO (the link-chain + diagonal swing); NOT a PENDANT LAMP
//   (heavy links, DEAD-BLACK mouth interior, light escapes ONLY through the slit,
//   humanoid clapper — never a bulb); NOT a JELLYFISH (rigid jagged lip, rigid
//   pendulum, metal links).
//   LIT-EDGE (enforced focal order slit >> clapper-catch >> toll-rings): the VERTICAL
//   candle-slit through the crack is the ONE HDR focal; the clapper head catches
//   candlelight at <= half; the toll ring-walls are BRIEF + value-CAPPED (large-area
//   emitters must never out-bloom the thin slit). Patina-copper body near-black.
//   SCALE — COLOSSAL: baked centred here for the studio; boss.js raises the fight
//   pose so the body sits above y~=22 (only lip + shackle-chains dip into frame).
//   HOME — cool/dark sky (Sunken Sanctuary lore-tenant).
//
// §4b CARRIERS (faceless — the clapper + slit + toll ARE the face): GAZE = the head
// orientation (drooped/away, tilts toward you on notice); BLINK = the slit GUTTERS
// through the crack; CHARGE-TELL = the swing arc WIDENS + the slit BRIGHTENS; the
// three EXPRESSIONS = drooped / lifted-toward-you / straining at the straps; FLINCH =
// the whole bell RINGS on a hit (a reverberation ripple + slit flare); NOTICE = the
// clapper LIFTS ITS HEAD (the roster's darkest notice); DEATH = the crack spreads,
// the candle GUTTERS OUT, the head drops still, the swing decays to silence.
//
// CONTRACT: boss.js stomps `group.rotation` (placeGroup) and `kit.setDissolve` owns
// `group.scale` — every animated part lives on `rig`, `swingPivot` (the pendulum),
// `clapperPivot` (the bound figure), or the toll-ring orbiters; NEVER on `group`.

export function buildKnellgrave(def, quality = 1) {
  const candle = def.accent ?? 0xffd890;   // the pale warm candle — the vertical-slit + ring hue
  const glow = def.glow ?? 0xffe0a8;        // candle-pale (shield rim / shards)
  const lowQ = quality < 0.75;
  const strip = stripForMerge;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (v) => clamp(v, 0, 1);

  // The shield wraps the WEAK POINT — the bell mouth / clapper (the toll organ).
  // hpBarScale counters the big def.scale; hpBarY clears the flared lip beneath the
  // body (the bar rides low, under the overhead mass, where the player is looking).
  const kit = createBossCommon(def, quality, {
    // the shield wraps the MOUTH/CLAPPER (the toll organ — mouth at rig ≈+0.9, the
    // clapper head at ≈−0.9) — kept SMALL + DIM so the faceted CAGE lines (not a
    // bright fresnel sphere) carry the "sealed" read; a bright bubble read as a
    // moon/pearl bigger than the bell (Fable CP1 — the L162 lesson).
    // hpBar: at the overhead station (def.stationY 20) the bar hangs just BELOW the
    // clapper (world ≈15) where the player is actually looking — never off-frame.
    shieldRadius: 3.5, shieldY: -0.8, hpBarY: -4.6, hpBarZ: 4.0, hpBarScale: 0.62,
    shieldRimStrength: 0.16, shieldCageOpacity: 0.46,
  });
  const { group, track } = kit;
  group.userData.archetype = 'boundBell';
  const rig = new THREE.Group();
  group.add(rig);

  const mergeK = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildKnellgrave: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ==================================================================
  // MATERIALS — patina-copper near-black body (§3.3 dark base), painted value
  // tiers (§3.4), the candle living ONLY in the emissive slit / head-catch / rings.
  // ==================================================================
  const patinaDeepMat = track(new THREE.MeshStandardMaterial({ color: 0x121a17, emissive: 0x0c1512, emissiveIntensity: 0.06, roughness: 0.62, metalness: 0.42, flatShading: true }));
  const patinaMat = track(new THREE.MeshStandardMaterial({ color: 0x1a2420, emissive: 0x101a15, emissiveIntensity: 0.08, roughness: 0.56, metalness: 0.46, flatShading: true }));
  const patinaHiMat = track(new THREE.MeshStandardMaterial({ color: 0x27342e, emissive: 0x162019, emissiveIntensity: 0.10, roughness: 0.5, metalness: 0.5, flatShading: true }));
  // the flared LIP catches a touch of the sun (the brightest patina tier, but still
  // dark — the candle-slit stays the focal). A warm bronze undertone reads as metal.
  const lipMat = track(new THREE.MeshStandardMaterial({ color: 0x3a4033, emissive: 0x20180c, emissiveIntensity: 0.12, roughness: 0.44, metalness: 0.62, flatShading: true }));
  // IRON — the chain links + shackle bands (dark cold metal, distinct from the warm patina).
  const ironMat = track(new THREE.MeshStandardMaterial({ color: 0x16181c, emissive: 0x0b0c10, emissiveIntensity: 0.05, roughness: 0.5, metalness: 0.7, flatShading: true }));
  // THE BOUND FIGURE — the clapper: dark, worn, desaturated (a spent prisoner). The
  // head catches candlelight (its own emissive, driven in the tick — the §4b catch).
  const figureMat = track(new THREE.MeshStandardMaterial({ color: 0x241c17, emissive: 0x1a120a, emissiveIntensity: 0.10, roughness: 0.72, metalness: 0.05, flatShading: true }));
  const strapMat = track(new THREE.MeshStandardMaterial({ color: 0x120e0a, emissive: 0x0a0806, emissiveIntensity: 0.04, roughness: 0.6, metalness: 0.35, flatShading: true }));
  const HEAD_BASE = new THREE.Color(candle);
  const headMat = track(new THREE.MeshStandardMaterial({ color: 0x2a2018, emissive: candle, emissiveIntensity: 0.16, roughness: 0.6, metalness: 0.0, flatShading: true }));
  // THE CANDLE-SLIT — the ONE focal: a thin HDR box behind the jagged crack. NOT
  // toneMapped so it punches past the bloom threshold (G1); the light escapes ONLY
  // here (never the dead-black mouth — the anti-lamp guard). Driven hot in the tick.
  const SLIT_BASE = new THREE.Color(candle);
  const slitMat = track(new THREE.MeshBasicMaterial({ color: candle })); slitMat.toneMapped = false; slitMat.color.copy(SLIT_BASE).multiplyScalar(9.0);
  // a soft inner glow bleed around the slit (candle warmth on the crack lips).
  const emberMat = track(new THREE.MeshStandardMaterial({ color: 0x140f08, emissive: candle, emissiveIntensity: 1.1, roughness: 0.7, metalness: 0.0, flatShading: true }));
  // the jagged CRACK line (dark seam that notches into the lit slit).
  const crackLineMat = track(new THREE.LineBasicMaterial({ color: 0x05060a, transparent: true, opacity: 0.9, depthWrite: false }));
  const cageMat = track(new THREE.LineBasicMaterial({ color: 0x070a09, transparent: true, opacity: 0.8, depthWrite: false }));
  // THE TOLL RING-WALLS (orbiters) — the lit MOTION cue + the fairness VISUAL TWIN
  // of the dead music (§5h: a muted player loses nothing). Emissive candle, MODERATE
  // + brief (value-capped so the large ring never out-blooms the thin slit focal).
  // ADDITIVE (pure light, never dark) so an expanding ring can never read as a dark
  // crescent/hook in a pale silhouette (Fable CP1); value-capped in the tick so it
  // stays below the HDR slit focal. Small at rest (G7 counts it at base scale only).
  const ringMat = track(new THREE.MeshBasicMaterial({ color: candle, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));

  // ==================================================================
  // GEOMETRY — built in a swinging rig. "Up" (+y) = the crown + chain vanishing
  // off-frame; "down" (−y) = the flared lip / mouth / clapper; the crack + slit face
  // the player (+z). swingPivot is the pendulum PIVOT (a yoke high above the bell).
  // ==================================================================
  const FACETS = lowQ ? 14 : 20;          // bell radial facets — round enough to read as a bell, not a drum
  const BELL_R = 5.4;                      // flared-lip radius (the widest point)
  const PIVOT_Y = 9.5;                     // the pendulum pivot height (above the bell mass)

  // ---- swingPivot: the pendulum. Everything that swings hangs under it; rotating
  // its z sweeps the whole bell + chain + clapper about the yoke (the §3.5 telegraph).
  const swingPivot = new THREE.Group();
  swingPivot.name = 'swingPivot';
  swingPivot.position.set(0, PIVOT_Y, 0);
  rig.add(swingPivot);

  // ---- THE BELL BODY: three stacked tapered bands + a flared lip. A cracked BITE is
  // taken out of the lip edge on the front-left (the scar that notches the outline).
  // Bands (top→bottom): shoulder (narrow), waist, mouth-flare (widest at the lip).
  // Built as a lathe-like stack of open cones so the mouth interior stays hollow +
  // DEAD BLACK (the anti-lamp guard — no downward glow).
  const bellGroup = new THREE.Group();
  bellGroup.name = 'bellBody';
  bellGroup.position.set(0, -2.0, 0);      // the bell hangs below the pivot
  swingPivot.add(bellGroup);

  const bandParts = [];
  // profile control points (radius, y) from crown down to the flared lip
  const prof = [
    [1.1, 3.2],   // crown cap
    [2.0, 2.6],   // shoulder
    [2.9, 1.0],   // upper waist
    [3.4, -1.2],  // waist
    [3.9, -3.2],  // lower waist
    [5.4, -5.2],  // the FLARE begins
    [5.9, -6.4],  // the flared LIP (widest)
  ];
  // the bell's front-surface radius at a given bellGroup-local y (so the crack + the
  // candle-slit sit PROUD of the curved surface, not buried behind it — the G1 fix).
  const bellRadiusAt = (y) => {
    if (y >= prof[0][1]) return prof[0][0];
    if (y <= prof[prof.length - 1][1]) return prof[prof.length - 1][0];
    for (let i = 0; i < prof.length - 1; i++) {
      const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
      if (y <= y0 && y >= y1) { const t = (y0 - y) / (y0 - y1); return r0 + (r1 - r0) * t; }
    }
    return prof[3][0];
  };
  for (let i = 0; i < prof.length - 1; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
    const seg = strip(new THREE.CylinderGeometry(r0, r1, Math.abs(y0 - y1), FACETS, 1, true));
    seg.translate(0, (y0 + y1) / 2, 0);
    bandParts.push(seg);
  }
  // the crown cap (a small dome closing the top — the chain mounts here)
  const crownCap = strip(new THREE.SphereGeometry(1.15, FACETS, 6, 0, Math.PI * 2, 0, Math.PI * 0.5));
  crownCap.translate(0, 3.2, 0);
  bandParts.push(crownCap);
  const bellMesh = new THREE.Mesh(mergeK(bandParts, 'bellBands'), patinaMat);
  bellMesh.name = 'knellBell';
  bellGroup.add(bellMesh);

  // raised RELIEF bands (the §5g surplus: ornament, not facets) — three proud rings
  // (shoulder / waist / above-lip) that read as bell BANDS at fight distance. No free-
  // floating studs (Fable CP1: they read as noise in the pale test).
  const reliefParts = [];
  for (const [ry, rr, rt] of [[1.4, 3.05, 0.26], [-0.2, 3.6, 0.28], [-3.4, 4.15, 0.26]]) {
    const ring = strip(new THREE.TorusGeometry(rr, rt, 6, lowQ ? 22 : 32));
    ring.rotateX(Math.PI / 2); ring.translate(0, ry, 0);
    reliefParts.push(ring);
  }
  bellGroup.add(new THREE.Mesh(mergeK(reliefParts, 'bellRelief'), patinaHiMat));

  // ---- THE YOKE (headstock) — the heavy iron crossbeam a real cathedral bell hangs
  // from, bolted above the crown; the chain rises from IT (§5g pazzazz pass: mass +
  // credibility at the top of the silhouette). Bolt heads at the beam ends.
  const yokeParts = [];
  const beam = strip(new THREE.BoxGeometry(5.4, 0.85, 1.15)); beam.translate(0, 4.75, 0); yokeParts.push(beam);
  const mountPlate = strip(new THREE.BoxGeometry(1.7, 0.3, 1.5)); mountPlate.translate(0, 5.35, 0); yokeParts.push(mountPlate);
  for (const sx of [-1, 1]) {
    const post = strip(new THREE.BoxGeometry(0.55, 1.3, 0.7)); post.translate(sx * 1.15, 3.9, 0); yokeParts.push(post);
    const bolt = strip(new THREE.CylinderGeometry(0.26, 0.26, 1.5, 6)); bolt.rotateZ(Math.PI / 2); bolt.translate(sx * 2.35, 4.75, 0); yokeParts.push(bolt);
    const cap = strip(new THREE.BoxGeometry(0.5, 1.05, 1.3)); cap.translate(sx * 2.7, 4.75, 0); yokeParts.push(cap);
    const underBolt = strip(new THREE.CylinderGeometry(0.16, 0.16, 1.0, 5)); underBolt.rotateX(Math.PI / 2); underBolt.translate(sx * 1.6, 4.45, 0); yokeParts.push(underBolt);
  }
  bellGroup.add(new THREE.Mesh(mergeK(yokeParts, 'yoke'), ironMat));
  // THE EMPTY HOOK (§3.6-adjacent lore, one asymmetric): a snapped second chain stub +
  // a bare open hook hanging off the beam's far end — something ELSE hung beside the
  // bell once, and it is GONE (an open thread the registry can point at later).
  const hookParts = [];
  const stubLink = strip(new THREE.TorusGeometry(0.34, 0.13, 5, 9)); stubLink.translate(2.15, 4.05, 0); hookParts.push(stubLink);
  const stubHalf = strip(new THREE.TorusGeometry(0.34, 0.13, 5, 9, Math.PI * 1.1)); stubHalf.rotateY(Math.PI / 2); stubHalf.rotateZ(0.5); stubHalf.translate(2.15, 3.4, 0.05); hookParts.push(stubHalf);
  const bareHook = strip(new THREE.TorusGeometry(0.42, 0.14, 5, 9, Math.PI * 1.25)); bareHook.rotateZ(-0.6); bareHook.translate(-2.15, 3.75, 0); hookParts.push(bareHook);
  bellGroup.add(new THREE.Mesh(mergeK(hookParts, 'emptyHook'), ironMat));
  // crown CANNONS — the cast loops on a real bell's crown, under the yoke.
  const cannonParts = [];
  for (const ca of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) {
    const loop = strip(new THREE.TorusGeometry(0.38, 0.14, 5, 9));
    loop.rotateY(ca); loop.translate(Math.sin(ca) * 0.85, 3.95, Math.cos(ca) * 0.85);
    cannonParts.push(loop);
  }
  bellGroup.add(new THREE.Mesh(mergeK(cannonParts, 'crownCannons'), patinaHiMat));

  // ---- THE FRIEZE + NICHE BANDS (§5g: ornament, not facets) — a shoulder band of
  // raised inscription blocks + a waist band of arched funeral niches, both wrapping
  // the body and BROKEN at the crack sector (the frieze itself is interrupted — the
  // damage reads as history). Embedded at the live surface radius (never floating).
  const friezeParts = [];
  const NF = lowQ ? 10 : 14;
  for (let i = 0; i < NF; i++) {
    const a = (i / NF) * Math.PI * 2;
    if (a < 0.35 || a > 5.85) continue;                    // the crack sector stays bare
    const blk = strip(new THREE.BoxGeometry(0.56, 0.78, 0.32));
    blk.rotateY(a);
    const rr = bellRadiusAt(1.6) + 0.06;
    blk.translate(Math.sin(a) * rr, 1.6, Math.cos(a) * rr);
    friezeParts.push(blk);
  }
  bellGroup.add(new THREE.Mesh(mergeK(friezeParts, 'knellFrieze'), patinaHiMat));
  // THE BURIED — the waist band is a PROCESSION of hunched figure reliefs cast into
  // the bell wall ("It Rings for What It Buried" — the buried are ON the bell; the
  // §4.7 fan-art hook + the lore made ornament). Each: a bowed body, a drooped head,
  // folded arms. The procession BREAKS at the crack — the figures nearest the wound
  // are gone (what escaped? the lore gap points at the clapper).
  const buriedParts = [];
  const NB = lowQ ? 6 : 11;
  for (let i = 0; i < NB; i++) {
    const a = (i / NB) * Math.PI * 2 + 0.3;
    if (a < 0.45 || a > 5.75) continue;                     // the crack sector: emptied
    const rr = bellRadiusAt(-2.1) + 0.02;
    const parts = [];
    const body = strip(new THREE.CapsuleGeometry(0.27, 0.85, 2, 6)); body.rotateX(0.22); body.translate(0, -0.1, 0.24); parts.push(body);
    const bHead = strip(new THREE.SphereGeometry(0.19, 6, 5)); bHead.translate(0, 0.62, 0.34); parts.push(bHead);
    const fold = strip(new THREE.BoxGeometry(0.5, 0.16, 0.18)); fold.translate(0, 0.12, 0.42); parts.push(fold);
    for (const p of parts) { p.rotateY(a); p.translate(Math.sin(a) * rr, -2.1, Math.cos(a) * rr); buriedParts.push(p); }
  }
  bellGroup.add(new THREE.Mesh(mergeK(buriedParts, 'theBuried'), patinaHiMat));
  // RIVET STUDS around the relief rings (cast hardware — carved, not scattered).
  const rivetParts = [];
  const NR = lowQ ? 8 : 14;
  for (const [ry, rr0] of [[1.4, 3.05], [-3.4, 4.15]]) {
    for (let i = 0; i < NR; i++) {
      const a = (i / NR) * Math.PI * 2 + 0.1;
      if (a < 0.35 || a > 5.85) continue;
      const riv = strip(new THREE.SphereGeometry(0.14, 5, 4));
      riv.translate(Math.sin(a) * (rr0 + 0.22), ry, Math.cos(a) * (rr0 + 0.22));
      rivetParts.push(riv);
    }
  }
  bellGroup.add(new THREE.Mesh(mergeK(rivetParts, 'knellRivets'), ironMat));
  // BUTTRESS FINS — eight thin cast ribs running the shoulder→waist slope (cathedral
  // verticality; their edges catch rim light as the bell heels on the swing). The
  // crack sector stays bare.
  const finParts = [];
  const NFIN = lowQ ? 6 : 8;
  for (let i = 0; i < NFIN; i++) {
    const a = (i / NFIN) * Math.PI * 2 + 0.42;
    if (a < 0.45 || a > 5.75) continue;
    const fin = strip(new THREE.BoxGeometry(0.24, 4.6, 0.55));
    fin.rotateX(0.21);                                     // follow the profile slope
    fin.rotateY(a);
    const rr = 3.72;
    fin.translate(Math.sin(a) * rr, -0.9, Math.cos(a) * rr);
    finParts.push(fin);
  }
  bellGroup.add(new THREE.Mesh(mergeK(finParts, 'buttressFins'), patinaMat));

  // ---- DRAPED BROKEN CHAINS off the lip rim (chunky — chain-language in the resting
  // outline, away from the crack sector).
  const drapeParts = [];
  for (const [ca, nlk] of [[2.35, 5], [-1.05, 4], [3.6, 3]]) {
    const bx = Math.sin(ca) * 5.3, bz = Math.cos(ca) * 5.3;
    for (let c = 0; c < nlk; c++) {
      const link = strip(new THREE.TorusGeometry(0.42, 0.16, 5, 9));
      if (c % 2) link.rotateY(Math.PI / 2);
      link.translate(bx + Math.sin(ca) * c * 0.06, -6.7 - c * 0.72, bz + Math.cos(ca) * c * 0.06);
      drapeParts.push(link);
    }
  }
  bellGroup.add(new THREE.Mesh(mergeK(drapeParts, 'knellDrapes'), ironMat));

  // ---- CRACK BRANCHES + SPRUNG PLATES — hairline fractures forking off the main
  // crack + a few plates of the bell wall sprung slightly proud along the seam (the
  // bell is coming APART; the plates catch the slit light at their edges).
  const branchPts = [];
  for (const [x0, y0, x1, y1] of [[-0.75, 0.2, -1.7, 0.95], [-0.9, -3.0, -2.0, -3.75], [-0.5, -4.6, 0.35, -5.4]]) {
    branchPts.push(new THREE.Vector3(x0, y0, bellRadiusAt(y0) + 0.08));
    branchPts.push(new THREE.Vector3(x1, y1, bellRadiusAt(y1) + 0.08));
  }
  const branchLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(branchPts), crackLineMat);
  branchLines.name = 'knellCrackBranch';
  bellGroup.add(branchLines);
  const plateParts = [];
  for (const [px, py, prz] of [[-1.5, 0.9, 0.18], [-1.7, -2.3, -0.15], [-0.1, -4.0, 0.22]]) {
    const plate = strip(new THREE.BoxGeometry(0.85, 1.15, 0.18));
    plate.rotateZ(prz);
    plate.rotateY(Math.atan2(px, bellRadiusAt(py)));
    plate.translate(px, py, bellRadiusAt(py) + 0.1);
    plateParts.push(plate);
  }
  const plateMesh = new THREE.Mesh(mergeK(plateParts, 'crackPlates'), patinaHiMat);
  plateMesh.name = 'crackPlates';
  bellGroup.add(plateMesh);

  // the flared LIP as its own lighter-value ring (the brightest patina tier, the
  // widest outline point) + a jagged BITE removed on the front-left (the scar). The
  // bite is faked by omitting a wedge of the lip torus and adding two broken fangs.
  // a BIG jagged BITE is missing from the front-left lip (the §3.6 scar — it must
  // survive the pale silhouette test, Fable CP1). The lip torus is drawn as a ~230°
  // arc so a ~130° wedge is GONE from the front-left, and jagged broken fangs edge it.
  // a partial torus (~230° arc) laid FLAT (horizontal) — a ~130° wedge is GONE from the
  // front-left (the bite). It MUST stay horizontal; the gap is rotated around the rim
  // about Y (rotateZ tilts the whole ring into a slanted arc that reads as a crescent
  // hook — Fable CP1 root cause).
  const lipRing = strip(new THREE.TorusGeometry(5.6, 0.72, 8, lowQ ? 24 : 36, Math.PI * 1.28));
  lipRing.rotateX(Math.PI / 2);           // lay it flat (horizontal ring in the XZ plane)
  lipRing.rotateY(Math.PI * 1.02);        // spin the GAP around the rim to face the front-left (the bite faces the player)
  lipRing.translate(0, -6.4, 0);
  const lipMesh = new THREE.Mesh(lipRing, lipMat); lipMesh.name = 'knellLip';
  bellGroup.add(lipMesh);
  // an INNER lip ring (a second, recessed rim — the wall has thickness; the mouth
  // reads as a real casting, and the ring's shadow gap deepens the mouth's black).
  const lipInner = strip(new THREE.TorusGeometry(4.85, 0.34, 6, lowQ ? 20 : 30, Math.PI * 1.32));
  lipInner.rotateX(Math.PI / 2);
  lipInner.rotateY(Math.PI * 1.0);
  lipInner.translate(0, -6.15, 0);
  bellGroup.add(new THREE.Mesh(lipInner, patinaMat));
  // jagged broken fangs edging the bite (irregular lengths — a torn rim). Placed at the
  // rim radius by angle; the bite sits at the front-left (angles ~200°-320°).
  const fangParts = [];
  for (const fa of [Math.PI * 1.06, Math.PI * 1.18, Math.PI * 1.32, Math.PI * 1.44, Math.PI * 1.58, Math.PI * 1.72]) {
    const fh = 0.6 + ((Math.sin(fa * 5) + 1) * 0.65);   // irregular lengths
    const fang = strip(new THREE.ConeGeometry(0.5, fh, 5));
    fang.rotateX(Math.PI);
    fang.translate(Math.cos(fa) * 5.5, -6.4 - fh * 0.4, Math.sin(fa) * 5.5);
    fangParts.push(fang);
  }
  // lip RIVETS along the surviving rim (cast hardware, skipping the bite arc).
  const NLR = lowQ ? 7 : 12;
  for (let i = 0; i < NLR; i++) {
    const a = (i / NLR) * Math.PI * 2;
    if (a > Math.PI * 0.95 && a < Math.PI * 1.85) continue;   // the bite arc stays bare
    const riv = strip(new THREE.SphereGeometry(0.16, 5, 4));
    riv.translate(Math.cos(a) * 5.6, -5.95, Math.sin(a) * 5.6);
    fangParts.push(riv);
  }
  bellGroup.add(new THREE.Mesh(mergeK(fangParts, 'lipFangs'), lipMat));
  // a DIM ember rim just inside the mouth — the smolder the player glimpses looking UP
  // into the bell on the swing-over pass (≤ half the slit per §3.2; the mouth stays
  // dead-black around it — a smolder inside a void, never a downward lamp-glow).
  const innerRim = strip(new THREE.TorusGeometry(4.5, 0.13, 5, lowQ ? 18 : 26));
  innerRim.rotateX(Math.PI / 2);
  innerRim.translate(0, -5.7, 0);
  bellGroup.add(new THREE.Mesh(innerRim, emberMat));

  // ---- THE CRACK + CANDLE-SLIT (the focal + the §3.6 scar). A jagged vertical crack
  // runs the front-left face; behind it a thin HDR box is the candle-slit — the ONE
  // focal. The crack notches the LIP edge (the bite above). Mouth interior dead black.
  // A jagged VERTICAL crack runs the front-left face; the candle-slit is a stack of
  // thin HDR quads set PROUD of the CURVED bell surface (bellRadiusAt) so it reads
  // THROUGH the crack and is never buried behind the body (the G1 focal fix). The
  // light escapes ONLY here — the mouth interior stays DEAD BLACK (the anti-lamp guard).
  const crackXY = [
    [-0.7, 2.6], [-0.35, 1.4], [-0.75, 0.2], [-0.3, -1.4],
    [-0.9, -3.0], [-0.5, -4.6], [-1.1, -6.2],   // the last point reaches the lip bite
  ];
  const crackPts = crackXY.map(([x, y]) => new THREE.Vector3(x, y, bellRadiusAt(y) + 0.07));
  const crackStrip = new THREE.Line(new THREE.BufferGeometry().setFromPoints(crackPts), crackLineMat);
  crackStrip.name = 'knellCrack';
  bellGroup.add(crackStrip);
  const slitParts = [], emberParts = [];
  for (let i = 0; i < crackXY.length - 1; i++) {
    const [x0, y0] = crackXY[i], [x1, y1] = crackXY[i + 1];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, h = Math.abs(y0 - y1) + 0.5;
    const sSeg = strip(new THREE.BoxGeometry(0.46, h, 0.34)); sSeg.translate(mx, my, bellRadiusAt(my) + 0.18); slitParts.push(sSeg);
    const eSeg = strip(new THREE.BoxGeometry(0.98, h + 0.3, 0.22)); eSeg.translate(mx, my, bellRadiusAt(my) + 0.05); emberParts.push(eSeg);
  }
  const slit = new THREE.Mesh(mergeK(slitParts, 'candleSlit'), slitMat); slit.name = 'knellSlit'; slit.renderOrder = 6;
  bellGroup.add(slit);
  const ember = new THREE.Mesh(mergeK(emberParts, 'crackEmber'), emberMat); ember.name = 'knellEmber';
  bellGroup.add(ember);

  // ---- THE CHAIN vanishing UP off-frame (heavy discrete LINKS — the anti-lamp/UFO
  // guard). Link tori alternate axis (the woven look), from the crown up past the
  // pivot; a LineSegments continues the last links off into nothing. It swings WITH
  // the bell (a child of swingPivot) so on the arc it crosses the frame diagonally.
  const chainParts = [];
  const NLINK = lowQ ? 4 : 7;              // HEAVY links (~1/6 bell width — Fable CP1: not a thread) clearly
                                           // vanishing UP; the presence override absorbs the taller bbox (G4 COM)
  for (let c = 0; c < NLINK; c++) {
    const link = strip(new THREE.TorusGeometry(0.82, 0.3, 6, 12));
    if (c % 2) link.rotateY(Math.PI / 2);   // alternate the weave
    link.translate(0, 5.6 + c * 1.5, 0);    // from the YOKE upward, well-separated
    chainParts.push(link);
  }
  const chainMesh = new THREE.Mesh(mergeK(chainParts, 'mainChain'), ironMat); chainMesh.name = 'knellChain';
  chainMesh.position.copy(bellGroup.position);   // ride the bell so it swings together
  swingPivot.add(chainMesh);
  // a short thread continues the last link off-frame (the "hangs from nothing" tail).
  const chainLinePts = [];
  for (let i = 0; i < 2; i++) chainLinePts.push(new THREE.Vector3((i % 2 ? 0.16 : -0.16), 1.2 + 5.6 + NLINK * 1.5 + i * 1.1, 0));
  const chainLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(chainLinePts), cageMat); chainLine.name = 'knellChainTail';
  swingPivot.add(chainLine);

  // ---- THE BOUND CLAPPER FIGURE (the §4b face + the drawable dread; the boss's soul).
  // CRITICAL READ (Fable CP1): the bell body is a hollow cone whose front WALL occludes
  // anything inside it — so the clapper only reads where it hangs BELOW the lip line
  // (bellGroup y < -6.4). The prisoner is therefore built BIG + LOW: a drooped HEAD +
  // shoulders + bound arms protruding ~2 units below the mouth (it BREAKS the bottom
  // outline in the pale test — the "someone inside" read + the §4b NOTICE carrier). The
  // "bound"/chain read lives ON the figure: heavy iron WRIST CUFFS + short broken chains
  // (no more sub-pixel draping links). Dark at rest; fully lit + straining on the dread
  // card (the awe fix). clapperPivot phase-lags the swing (a real pendulum tongue).
  const clapperPivot = new THREE.Group();
  clapperPivot.name = 'clapperPivot';
  clapperPivot.position.set(0, 1.4, 0.5);   // the hinge, inside the bell crown
  bellGroup.add(clapperPivot);
  // the clapper ROD (the bell's tongue the prisoner is bound to) — from the crown down
  // to the shoulders (the bound BODY is the striker; no separate ball — that read as a
  // second orb and muddled the figure, Fable CP1).
  const rod = strip(new THREE.CylinderGeometry(0.26, 0.2, 8.2, 6)); rod.translate(0, -4.1, 0);
  clapperPivot.add(new THREE.Mesh(rod, ironMat));
  // THE FIGURE — a bound prisoner hanging HEAD-DOWN out of the mouth (the player is
  // BELOW, looking up). The read below the lip, top→bottom: WIDE SHOULDERS emerging from
  // the mouth → a NARROWER ovoid HEAD beneath them → drooping ARMS framing the head →
  // wrist cuffs. The head-vs-shoulder TAPER + the flanking arms are what make it read as
  // a PERSON, not a clapper ball (Fable CP1 blocker). Lip is at clapperPivot-local ≈ -7.8.
  const figParts = [];
  // WIDE SHOULDERS (a broad horizontal slab) — the widest, topmost below-lip mass, sized
  // so the head below it reads clearly NARROWER (the human taper, Fable CP1).
  const shoulders = strip(new THREE.CapsuleGeometry(0.62, 2.2, 4, 9)); shoulders.rotateZ(Math.PI / 2); shoulders.translate(0, -8.15, 0.95); figParts.push(shoulders);
  // a short chest/ribs block linking shoulders → the (lower) head.
  const chest = strip(new THREE.CapsuleGeometry(0.5, 0.7, 3, 8)); chest.translate(0, -8.75, 1.0); figParts.push(chest);
  const figMesh = new THREE.Mesh(mergeK(figParts, 'clapperFigure'), figureMat); figMesh.name = 'knellFigure';
  clapperPivot.add(figMesh);
  // the ARMS on pivots — ANGLED OUT from the shoulders at rest so they read as two
  // distinct STICKS breaking the outline (not hidden behind the body); they WRENCH
  // further out against the wrist cuffs on the strain (a real silhouette change).
  const armPivots = [];
  for (const sx of [-1, 1]) {
    const armPivot = new THREE.Group();
    armPivot.name = `clapperArm${sx > 0 ? 'R' : 'L'}`;
    armPivot.position.set(sx * 1.0, -8.15, 1.0);   // at the shoulder END (wide)
    armPivot.rotation.z = sx * 0.32;               // angled OUT at rest — the sticks break the outline
    const arm = strip(new THREE.CapsuleGeometry(0.22, 2.1, 3, 7)); arm.translate(0, -1.15, 0);
    armPivot.add(new THREE.Mesh(arm, figureMat));
    const cuff = strip(new THREE.TorusGeometry(0.3, 0.13, 5, 10)); cuff.rotateX(Math.PI / 2); cuff.translate(0, -2.25, 0);
    armPivot.add(new THREE.Mesh(cuff, ironMat));
    const cuffChain = [];
    for (let c = 0; c < 2; c++) { const lk = strip(new THREE.TorusGeometry(0.18, 0.07, 4, 8)); if (c % 2) lk.rotateX(Math.PI / 2); lk.translate(0, -2.55 - c * 0.4, 0); cuffChain.push(lk); }
    armPivot.add(new THREE.Mesh(mergeK(cuffChain, `cuffChain${sx}`), ironMat));
    clapperPivot.add(armPivot);
    armPivots.push({ pivot: armPivot, sx, restZ: sx * 0.32 });
  }
  // the binding STRAPS lashing the shoulders/chest to the rod.
  const strapParts = [];
  for (const [sy, ang] of [[-8.0, 0.4], [-8.7, -0.4]]) {
    const strapb = strip(new THREE.BoxGeometry(1.9, 0.3, 1.1));
    strapb.rotateZ(ang); strapb.translate(0, sy, 1.05);
    strapParts.push(strapb);
  }
  clapperPivot.add(new THREE.Mesh(mergeK(strapParts, 'clapperStraps'), strapMat));
  // the DROOPED HEAD (§4b GAZE + NOTICE) — an OVOID (taller than wide, distinct from the
  // shoulders above), the lowest element, on its own pivot so it WRENCHES UP toward the
  // player on notice/dread (a real silhouette change — the roster's darkest notice beat).
  const headPivot = new THREE.Group();
  headPivot.name = 'clapperHead';
  headPivot.position.set(0, -9.8, 1.05);   // bellGroup ≈ -8.4 — clearly below the wide shoulders (head-down)
  clapperPivot.add(headPivot);
  const head = strip(new THREE.SphereGeometry(0.8, lowQ ? 9 : 13, lowQ ? 7 : 10));
  head.scale(0.72, 1.3, 0.8);              // a NARROW OVOID (≈40% of the shoulder width) — the human taper reads
  const headMesh = new THREE.Mesh(head, headMat); headMesh.name = 'knellHeadMesh';
  headMesh.position.y = -0.35;     // droops down out of the mouth at rest
  headMesh.rotation.x = 0.9;
  headPivot.add(headMesh);
  // HANGING HAIR — head-down, so the hair falls TOWARD the player (thin dark strands
  // off the drooped head; the drowned read — §4.7 drawable dread). Rides headPivot so
  // the head-wrench on notice throws the hair back.
  const hairParts = [];
  for (const [hx, hh, ha] of [[-0.26, 0.85, 0.15], [0.05, 1.1, -0.05], [0.28, 0.75, 0.2], [-0.05, 0.95, -0.22]]) {
    const strand = strip(new THREE.ConeGeometry(0.085, hh, 4));
    strand.rotateX(Math.PI); strand.rotateZ(ha);
    strand.translate(hx, -0.85 - hh * 0.4, 0.12);
    hairParts.push(strand);
  }
  headPivot.add(new THREE.Mesh(mergeK(hairParts, 'knellHair'), strapMat));
  // HANDS below the wrist cuffs (small fists — the arms END in something human).
  for (const a of armPivots) {
    const hand = strip(new THREE.SphereGeometry(0.2, 6, 5)); hand.scale(0.9, 1.15, 0.9); hand.translate(0, -2.42, 0);
    a.pivot.add(new THREE.Mesh(hand, figureMat));
  }
  // RIB RIDGES across the chest (three thin arcs — a starved, bound torso).
  const ribParts = [];
  for (let r = 0; r < 3; r++) {
    const rib = strip(new THREE.TorusGeometry(0.62 - r * 0.06, 0.055, 4, 8, Math.PI * 0.9));
    rib.rotateZ(Math.PI * 0.05); rib.rotateY(0.2);
    rib.translate(0, -7.0 - r * 0.42, 1.28);
    ribParts.push(rib);
  }
  clapperPivot.add(new THREE.Mesh(mergeK(ribParts, 'knellRibs'), figureMat));
  // a thin NECK joining the head up to the chest (so head+shoulders read as one body).
  const neck2 = strip(new THREE.CapsuleGeometry(0.24, 0.6, 2, 6)); neck2.translate(0, -9.1, 1.0);
  clapperPivot.add(new THREE.Mesh(neck2, figureMat));
  // an iron COLLAR at the neck (§5g clapper detail — it is COLLARED to the tongue).
  const collar = strip(new THREE.TorusGeometry(0.4, 0.14, 5, 10)); collar.rotateX(Math.PI / 2); collar.translate(0, -9.05, 1.0);
  clapperPivot.add(new THREE.Mesh(collar, ironMat));
  // TATTERED cloth strips hanging off the shoulders/straps (they sway with the swing —
  // free motion pazzazz; dark, they read as rags on a prisoner, never bright).
  const tatParts = [];
  for (const [tx, ty, ta] of [[-0.55, -8.55, 0.3], [0.6, -8.45, -0.25], [0.1, -9.0, 0.12]]) {
    const tat = strip(new THREE.BoxGeometry(0.16, 1.15, 0.05));
    tat.rotateZ(ta); tat.translate(tx, ty - 0.5, 1.18);
    tatParts.push(tat);
  }
  clapperPivot.add(new THREE.Mesh(mergeK(tatParts, 'clapperTatters'), strapMat));

  // ---- THE BELL MOUTH — the toll emitter (def.muzzle = 'bellMouth', §5f law 7). A
  // bare node at the lip opening, facing DOWN+toward the player (where the rings + the
  // aimed/amber volleys are born). Lives on swingPivot so it rides the swing.
  const bellMouth = new THREE.Object3D();
  bellMouth.name = 'bellMouth';
  bellMouth.position.set(0, -8.6, 1.2);    // just below the lip, front
  swingPivot.add(bellMouth);

  // ---- THE TOLL RING-WALLS (orbiters ≥2, tick-animated) — expanding rings born at
  // the mouth on each toll, the fairness VISUAL TWIN of the dead music. iris INVERTED:
  // they grow outward + drop, fade fast (value-capped). Children of rig (they leave
  // the swinging bell behind, expanding into world space).
  const orbiters = [];
  const NRING = lowQ ? 3 : 4;
  const ringGeo = strip(new THREE.TorusGeometry(1.0, 0.1, 4, lowQ ? 20 : 30));
  for (let i = 0; i < NRING; i++) {
    const m = new THREE.Mesh(ringGeo, ringMat);
    m.name = 'tollRing';
    m.rotation.x = Math.PI / 2;
    m.userData = { ph: i / NRING, born: -1 };
    rig.add(m);
    orbiters.push(m);
  }

  // ---- CANDLE EMBER MOTES — tiny additive sparks drifting UP out of the crack (the
  // flame inside is ALIVE; §5g toll spectacle). Small sprites, capped opacity — they
  // ride bellGroup so they swing with the bell. Never near the §2 overdraw cap.
  const moteMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(candle).multiplyScalar(0.9), transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
  const motes = [];
  const N_MOTE = lowQ ? 4 : 10;
  for (let i = 0; i < N_MOTE; i++) {
    const m = new THREE.Mesh(strip(new THREE.SphereGeometry(0.13 + (i % 3) * 0.05, 6, 5)), moteMat);
    m.name = 'candleMote';
    m.userData = { ph: i / N_MOTE, sp: 0.45 + (i % 3) * 0.22, sw: (i % 2 ? 1 : -1) * (0.4 + (i % 3) * 0.2) };
    bellGroup.add(m);
    motes.push(m);
  }

  // ---- SUSPENDED BELL-SHARDS — torn pieces of the wall hanging WEIGHTLESS in an arc
  // off the crack side (authored cluster near the wound, §3 law 6 — never a uniform
  // ring). The World-Enders tell: the bell's own debris stopped obeying gravity. Dark
  // patina chips (≤0.25 emissive per §3 law 8), each slowly tumbling in the tick.
  const bellShards = [];
  const SHARD_SPOTS = [   // authored (azimuth from front-left crack, radius, height) — a shedding arc
    [-0.5, 7.0, -3.0], [-0.9, 7.6, -0.8], [-0.2, 6.8, -5.0], [-1.4, 7.3, -2.0],
    [0.15, 7.1, -4.2], [-1.05, 8.0, -4.6], [-0.65, 6.6, 0.6], [-1.8, 7.5, -0.2],
  ];
  const N_SHARD = lowQ ? 4 : 8;
  for (let i = 0; i < N_SHARD; i++) {
    const [saz, srad, sh] = SHARD_SPOTS[i];
    const geo = strip(new THREE.BoxGeometry(0.55 + (i % 3) * 0.22, 0.8 + (i % 2) * 0.35, 0.14));
    const m = new THREE.Mesh(geo, patinaHiMat);
    m.name = 'bellShard';
    m.userData = { az: saz - 0.19, rad: srad, h: sh, ph: i * 1.31, tum: 0.25 + (i % 3) * 0.12 };
    bellGroup.add(m);
    bellShards.push(m);
  }

  // edge cage over the bell (a dark outline pass — carves the facets on a bright sky).
  bellGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(bellMesh.geometry, 24), cageMat));

  kit.flashBind(emberMat, 1.1);
  kit.finalize();

  // ==================================================================
  // ANIMATION — the pendulum swing (idle 2-freq, WIDENS on charge), the candle-slit
  // gutter/brighten, the clapper head-lift (notice) + strain (dread), the bell-ring
  // flinch, the toll ring-walls, the mournful gutter-out death, and the entrance.
  // ==================================================================
  let charge = 0; function setCharge(k) { charge = clamp01(k); }
  let tell = null; function setAttackTell(id) { tell = id || null; }
  let setpieceK = 0, dreadK = 0; function setSetpiece(k, sdef) { setpieceK = clamp01(k); dreadK = (sdef && sdef.dread) ? setpieceK : 0; }
  // THE RUIN LADDER (§5 escalation — "the bell OPENS across the fight"): ruinK = 1−hp,
  // fed by the controller's setHealth every frame. Phase by phase the crack gapes wider
  // (a thin line → a flood by the final card), the sprung plates lift, the suspended
  // shards drift out, the embers thicken, the prisoner catches more light, and every
  // toll kicks the body harder. The fight builds TOWARD the reveal — transformation as
  // escalation, no second form needed.
  let ruinK = 0;
  function setHealthRuin(frac) { ruinK = clamp01(1 - frac); kit.setHealth(frac); }

  // §4b GAZE — the head orientation. Drooped/away at rest; tilts TOWARD the player as
  // gaze rises (set by the controller; free auto in the studio).
  let gazeTX = 0, gazeTY = 0, gazeEX = 0, gazeEY = 0;
  function setGaze(nx, ny) { gazeTX = clamp(nx, -1, 1); gazeTY = clamp(ny, -1, 1); }

  // §4b NOTICE — the clapper LIFTS ITS HEAD (the roster's darkest notice beat).
  let noticeT = 0;
  function notice() { noticeT = 1.4; }

  // §4b FLINCH — the whole bell RINGS on a hit (a reverberation ripple + slit flare +
  // a kick to the swing). painT drives the ripple; hurt() seeds it.
  let painT = 0, painEase = 0, ringKick = 0;
  function flash(amt) { kit.flash(amt); }
  function hurt(amt) { if (amt > 0.25) { painT = Math.max(painT, 0.4); ringKick = (Math.random() < 0.5 ? -1 : 1) * clamp(amt, 0.3, 1); } }

  // §4b EXPRESSION state 3 (the AWE FIX): mid-fight, the clapper is FULLY revealed
  // STRAINING at its straps as the crack GAPES + the slit goes HDR-wide. Driven by the
  // dread survival card (setSetpiece dread) — the survival card is the prisoner's
  // reveal, not just a rhythm exam.
  // (dreadK, above, is the reveal amount.)

  let entranceU = null;
  function setEntrance(u) { entranceU = u == null ? null : clamp01(u); }
  function setEntranceSteer() {}

  // §5f the granted fight-long silence — the model does NOT own the music; it only
  // publishes the toll BEAT so the controller can kill/quantize (CP2). Exposed so the
  // fairness-twin (the ring-walls) can be fired on the same beat the audio would toll.
  let lastTollAt = -10;
  function tollNow(time) { lastTollAt = time; fireRing(time); }

  // shield clamp: while sealed the toll organ (mouth glow / slit) leashes (G6).
  let shieldClamp = false;
  kit.onShieldChange((v) => { shieldClamp = v; });

  // toll ring-walls: each toll fires a PRIMARY ring + a trailing ECHO (a double
  // wavefront — §5g toll spectacle); each expands + drops + fades fast.
  let ringCursor = 0;
  function fireRing(time) {
    const a = orbiters[ringCursor % orbiters.length];
    a.userData.born = time;
    const b = orbiters[(ringCursor + 1) % orbiters.length];
    b.userData.born = time + 0.14;   // the echo (parked until its birth frame)
    ringCursor += 2;
  }

  let dyingK = 0;
  function setDissolveEmotive(k) {
    dyingK = clamp01(k);
    // the candle GUTTERS OUT (the light dies) as it dies — driven in the tick; the
    // body fades late (a bell + its prisoner going quiet together).
    const a = dyingK < 0.8 ? 1 : Math.max(0, 1 - (dyingK - 0.8) / 0.2);
    for (const m of kit.mats) { m.transparent = true; const base = m.userData.baseOpacity ?? 1; m.opacity = base * a; if (m.uniforms && m.uniforms.uOpacity) m.uniforms.uOpacity.value = base * a; }
  }

  let swingA = 0, autoTollT = 0;
  const SLIT_HOT = 9.0;

  function tickBody(dt, time) {
    // --- THE PENDULUM (idle at 2 frequencies; WIDENS on charge — the §3.5 telegraph
    // that moves the SILHOUETTE). A living, unhurried sway; charge winds the arc up. ---
    if (painT > 0) painT -= dt;
    painEase += (Math.max(0, painT) - painEase) * Math.min(1, dt * 9);
    ringKick *= Math.max(0, 1 - dt * 3);
    const noticeK = noticeT > 0 ? clamp01(noticeT / 1.0) : 0;
    // amplitude: base sway + charge-widened arc + dread (the Last Toll swings hardest)
    const ampTarget = 0.10 + charge * 0.16 + dreadK * 0.10;
    swingA += (ampTarget - swingA) * Math.min(1, dt * 2.5);
    const swing = Math.sin(time * 0.85) * swingA + Math.sin(time * 0.37 + 1.1) * swingA * 0.35;
    if (entranceU == null) {
      swingPivot.rotation.z = swing + ringKick * 0.05 + painEase * Math.sin(time * 40) * 0.02;
      swingPivot.rotation.x = Math.sin(time * 0.5) * 0.015 - charge * 0.05;   // slight fore-aft rear on charge
    }

    // the BELL rears a touch on charge (a persistent silhouette change, robust vs the
    // oscillation — the mouth opens toward the player as the toll winds up).
    bellGroup.rotation.x = charge * 0.1 + dreadK * 0.06;

    // --- THE CANDLE-SLIT: the ONE focal. GUTTERS (flickers) at a rate = tension; the
    // charge-tell BRIGHTENS it; dread gapes it HDR-wide; death GUTTERS IT OUT. ---
    const gutterRate = 5 + charge * 8 + dreadK * 10;
    const gutter = 0.82 + Math.sin(time * gutterRate) * 0.1 + Math.sin(time * gutterRate * 1.7 + 2) * 0.06;
    // dread reveal is the GAPE + the lit figure, NOT brightness (Fable CP1: a brighter
    // bar just reads "lamp turned up") — so the slit brightens only modestly on dread.
    let slitK = gutter * (1 + charge * 0.5 + noticeK * 0.4 + dreadK * 0.28 + ruinK * 0.18);
    if (shieldClamp) slitK *= 0.09;   // the toll organ leashes HARD while sealed — the slit core drops below the
                                       // bloom threshold so the focal cluster shrinks (G6: the bell can't ring while sealed)
    if (dyingK > 0) slitK *= Math.max(0, 1 - dyingK * 1.4);   // guttering out
    slitMat.color.copy(SLIT_BASE).multiplyScalar(Math.max(0.05, slitK) * SLIT_HOT);
    // the crack GAPES WIDER as the fight progresses (the RUIN LADDER: a thin line in
    // P1 → a flood by The Last Toll) and further on dread (the reveal is the widening
    // gap the prisoner strains against, not a floodlight). Width grows more than glow.
    slit.scale.set(1 + ruinK * 1.1 + dreadK * 1.7 + charge * 0.2, 1 + dreadK * 0.1, 1);
    ember.scale.set(1 + ruinK * 0.7 + dreadK * 1.1, 1, 1);
    // the sprung wall plates LIFT off the seam as the bell comes apart.
    plateMesh.scale.setScalar(1 + ruinK * 0.05);
    emberMat.emissiveIntensity = 1.1 * clamp(slitK, 0, 2) * (1 - dyingK * 0.8);

    // --- THE CLAPPER HEAD (§4b GAZE / NOTICE / EXPRESSION). Drooped at rest; LIFTS
    // toward the player on notice; STRAINS up in the dread reveal. ---
    if (noticeT > 0) noticeT -= dt;
    if (entranceU == null && dyingK <= 0.05) {
      gazeEX += (gazeTX - gazeEX) * Math.min(1, dt * 1.5);
      gazeEY += (gazeTY - gazeEY) * Math.min(1, dt * 1.5);
    }
    // head lift: 0 = drooped (rest), 1 = lifted-toward-you (notice), + strain (dread —
    // the prisoner wrenches its head UP to look at you as the crack gapes: the awe beat)
    const lift = clamp(noticeK + dreadK * 1.05, 0, 1.35);
    headPivot.rotation.x = -lift * 1.0;                 // tilt the drooped head UP
    headMesh.rotation.x = 0.8 - lift * 0.8;
    headPivot.rotation.y = gazeEX * 0.5;                 // look toward the player's lane-x
    headPivot.rotation.z = Math.sin(time * 1.3) * 0.04 * (1 - lift) + dreadK * Math.sin(time * 7) * 0.06;   // slack sway / strain judder
    // the figure stays a candle-lit DARK form (a black figure with a warm catch, NOT a
    // glowing orb — Fable CP1): a MODERATE warm catch on the head (brighter when lifted /
    // on the reveal) so the shape reads by silhouette, not by blooming into a pearl.
    headMat.emissiveIntensity = (0.14 + lift * 0.34 + dreadK * 0.42 + ruinK * 0.14) * (shieldClamp ? 0.4 : 1) * (1 - dyingK);
    figureMat.emissiveIntensity = (0.07 + lift * 0.18 + dreadK * 0.42 + ruinK * 0.12) * (shieldClamp ? 0.5 : 1) * (1 - dyingK);
    strapMat.emissiveIntensity = (0.04 + dreadK * 0.35) * (1 - dyingK);
    // dread: the figure DROPS further out of the mouth (fully revealed below the lip) and
    // STRAINS against the straps (a fast judder). notice pulls it out a touch too.
    // notice/dread DROP the figure clear of the lip so the head-lift changes the OUTLINE
    // (not just a lit blob at the rim — Fable CP1).
    clapperPivot.position.y = 1.4 - dreadK * 1.9 - noticeK * 1.3 + dreadK * 0.28 * Math.abs(Math.sin(time * 8));

    // --- THE CLAPPER phase-LAGS the bell swing (a real pendulum tongue) so it
    // PROTRUDES past the lip on the far side of the arc — the humanoid notch. ---
    const lag = Math.sin(time * 0.85 - 0.9) * swingA * 1.5 + Math.sin(time * 0.37 + 0.3) * swingA * 0.5;
    clapperPivot.rotation.z = lag - swingPivot.rotation.z * 0.35;
    // --- THE ARMS strain: slack at rest, PULLING outward + down against the wrist cuffs
    // as it strains (dread/notice) — a visible silhouette change on the reveal. ---
    const strain = clamp(dreadK + noticeK * 0.4, 0, 1.2);
    for (const a of armPivots) {
      a.pivot.rotation.z = a.restZ + a.sx * (strain * 0.55) + a.sx * strain * Math.sin(time * 9) * 0.08;   // wrenched further out, juddering
      a.pivot.rotation.x = strain * 0.3;
    }

    // --- THE TOLL RING-WALLS — expand + drop + fade fast from the mouth (value-capped
    // so they never out-bloom the slit). The fairness VISUAL TWIN of the dead toll. ---
    // studio/no-controller: auto-toll on the accelerating beat so the rings pose + the
    // fairness twin is visible even with no fight driving tollNow().
    // Rings are a TOLL beat, not idle scenery — the auto-toll only fires in ACTIVE
    // states (charge / dread), so the RESTING idle silhouette stays clean (no mid-
    // expansion ring reading as a crescent/hook, Fable CP1). In-game, tollNow() drives
    // a ring on every real toll regardless, so the fairness twin never goes missing.
    autoTollT -= dt;
    const tollActive = charge > 0.05 || dreadK > 0.05;
    if (tollActive && autoTollT <= 0 && entranceU == null && dyingK < 0.7) {
      const beat = 1.5 - charge * 0.4 - dreadK * 0.5;    // the accelerating toll
      autoTollT = Math.max(0.4, beat);
      tollNow(time);
    }
    // IT RINGS — a felt reverberation on every toll: the bell body kicks a ~2% pulse
    // that decays over ~0.35s (the sound made visible on the body itself, §5g).
    const tollK = Math.max(0, 1 - (time - lastTollAt) / 0.35);
    // the kick GROWS with the ruin (past the CP1 2% — a World-Ender's toll is FELT;
    // the CP2 world layer adds the camera/fog flex on the same beat).
    bellGroup.scale.setScalar(1 + tollK * (0.035 + ruinK * 0.03 + dreadK * 0.015));
    const mouthWX = Math.sin(swingPivot.rotation.z) * -8.6;
    for (const m of orbiters) {
      const born = m.userData.born;
      const age = born < 0 ? 99 : time - born;
      if (age >= 0 && age <= 1.1) {
        // LIVE toll: expand + drop from the mouth (the visible ring-wall).
        m.visible = true;
        const k = age / 1.1;
        m.position.set(mouthWX * 0.4, PIVOT_Y - 10.6 - k * 2.2, 1.2);
        m.scale.setScalar(1.0 + k * 7.0);
      } else {
        // PARKED: invisible, but still drifting a hair each tick so the orbiter stays
        // tick-animated (the §6.4 handle contract) without cluttering the idle silhouette.
        m.visible = false;
        m.position.set(m.userData.ph * 1.4 - 0.7, PIVOT_Y - 12.5 + Math.sin(time * 0.6 + m.userData.ph * 6.28) * 0.4, 1.2);
        m.scale.setScalar(0.5);
      }
    }
    // ring material is shared — drive by the YOUNGEST live ring (a brief flash cap).
    let youngest = 2;
    for (const m of orbiters) { if (m.userData.born >= 0) youngest = Math.min(youngest, time - m.userData.born); }
    const ringGlow = youngest < 1.1 ? (1 - youngest / 1.1) : 0;
    // additive candle, value-capped WELL below the HDR slit focal (never out-blooms it).
    ringMat.color.copy(SLIT_BASE).multiplyScalar(0.85);
    ringMat.opacity = ringGlow * 0.5 * (shieldClamp ? 0.4 : 1) * (1 - dyingK);

    // --- CANDLE EMBERS drift up along the crack (the flame is alive; brisker + denser
    // as the fight heats). Each mote loops a rise cycle seeded by its phase. ---
    for (const mo of motes) {
      const u = ((time * mo.userData.sp + mo.userData.ph * 9.7) % 8) / 8;   // 0→1 rise
      mo.position.set(
        -0.6 + Math.sin(time * 1.2 + mo.userData.ph * 11) * (0.35 + u * 0.8) * mo.userData.sw,
        -5.2 + u * 9.5,
        bellRadiusAt(-5.2 + u * 9.5) + 0.45 + u * 0.5);
      mo.scale.setScalar((1 - u * 0.65) * (0.8 + charge * 0.5 + dreadK * 0.7 + ruinK * 0.55));
    }
    moteMat.opacity = 0.45 * (1 - dyingK) * (shieldClamp ? 0.3 : 1) * (0.7 + gutter * 0.3);

    // --- SUSPENDED SHARDS hover + slowly tumble by the crack; on the toll's reverb
    // they shiver, and in the dread they drift OUTWARD (the wound widening). On death
    // they sink with the swing's decay. ---
    for (const sh of bellShards) {
      const u = sh.userData;
      const rr = u.rad + ruinK * 1.2 + dreadK * 1.6 + Math.sin(time * 0.4 + u.ph) * 0.25;
      sh.position.set(
        Math.sin(u.az) * rr,
        u.h + Math.sin(time * 0.55 + u.ph * 2.1) * 0.45 + tollK * Math.sin(time * 40 + u.ph) * 0.12 - dyingK * 6,
        Math.cos(u.az) * rr);
      sh.rotation.x += dt * u.tum * 0.6 * (1 + ruinK);
      sh.rotation.y += dt * u.tum;
    }

    // --- ENTRANCE: the bell fades in ABOVE the frame already mid-swing; the slit
    // snaps on; the clapper LIFTS ITS HEAD at the apex (driven by the controller via
    // setEntrance u + notice()). Here we just hold the swing + fade the slit up. ---
    if (entranceU != null) {
      const u = entranceU;
      // matched to the itLiftsItsHead script clock: the CROSS (u<0.36) swings hard,
      // the APEX (0.36–0.66) is the head-lift in bullet-time, the wheel-down settles.
      swingPivot.rotation.z = Math.sin(u * Math.PI * 2.2) * 0.16 * (1 - u * 0.45);
      const litFront = clamp01((u - 0.12) / 0.38);   // the slit snaps on ACROSS the cross, HDR by the apex
      slitMat.color.copy(SLIT_BASE).multiplyScalar(Math.max(0.05, litFront) * SLIT_HOT);
      const liftE = clamp01((u - 0.42) / 0.22);      // the clapper LIFTS ITS HEAD at the apex
      headPivot.rotation.x = -liftE * 1.05;
      headMat.emissiveIntensity = 0.14 + liftE * 0.55;
      figureMat.emissiveIntensity = 0.07 + liftE * 0.2;   // the straps catch candlelight as it lifts
    }

    // --- DEATH: the crack spreads, the candle GUTTERS OUT, the head drops still, the
    // swing decays to silence (mournful — §4.7). ---
    if (dyingK > 0.05) {
      swingA *= Math.max(0, 1 - dt * 1.5);            // the swing decays
      swingPivot.rotation.z = Math.sin(time * 0.85) * swingA * (1 - dyingK);
      headPivot.rotation.x = clamp(-1.0 + dyingK * 1.4, -1.0, 0.4);   // the head drops for the last time
    }
  }

  const sc = def.scale ?? 1.35;
  function hullLength() { return 24 * sc; }   // the vertical span (the "never fits" number)
  function tollBeat() { return lastTollAt; }

  return {
    group, muzzle: bellMouth, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge, setAttackTell, setSetpiece, setGaze, notice,
    flash, hurt, tollNow,
    setEntrance, setEntranceSteer,
    setHealth: setHealthRuin, setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible, shatterShield: kit.shatterShield,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    hullLength, tollBeat,
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); },
  };
}
