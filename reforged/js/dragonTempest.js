import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// THUNDERHEAD TEMPEST — "The gathering storm" (TEMPEST-THUNDERHEAD-BUILDSHEET.md v3).
// A sleek dark-scaled STORM DRAKE (owner-reference-driven, NOT a cloud-mass): a charcoal
// dorsal shell (L 0.20–0.26, never black) over a diffuse pale underbelly, WEARING a live
// near-white energy GARMENT — "the storm WEARS its lightning" (v3 doctrine): the spine
// circuit, sternum veins, horn-crest, and — the HERO — THE STORMFORK wing-frame all
// hum-lit at idle (humFloor 0.30→0.90 up the ladder), the pulseTimer strike is the PEAK
// of the hum (root→tip travel), Surge is the break. Glow on COMPONENTS (strips/frame),
// never surfaces (DRAGON-DESIGN §6). Growth verb: CHARGING. Motif anchor: the sternum
// storm-heart. NOT a Vesper (charcoal ≥0.20, not black; worn-not-withheld), NOT a Solar
// (cool near-white, breathing + striking, not static warm regalia), NOT a Revenant (no
// bone / cage / lantern / bat-membrane — §3 anti-reskin veto). Assembly family:
// billowed/faceted (the smooth-hull organism family is a FORBIDDEN import, tests/starters).
//
// Four self-registering, default-off builders:
//   cumulonimbusTorso · stormforkWings · stormbrowHead · virgaTail
// They reuse the dragonVesper.js PATTERNS (value-band loft, the −anchor tail chain, the
// outer lmirror wing wrapper, the mats factory) with FRESH geometry. Axis: head/forward
// −Z, tail/rear +Z, right +X, up +Y; torso baseline y≈0.15.
//
// BUILD STATE: I2. cumulonimbusTorso is the gated drake body + the worn garment (I1),
// now LEGLESS (owner: no dragon has arms/legs). stormforkWings is the storm BAT-WING
// (I2, owner-directed rebuild off the Revenant phalanx anatomy at Revenant span ×4.1:
// short arm → medial wrist → N drooping FINGER-STRUTS fanning aft, each a kinked glowing
// storm-bolt with forks, welded onto ONE continuous dark storm-cloud membrane; covert row
// + spark motes + carved housings + knife-edge). stormbrowHead + virgaTail are still I0
// STUBS (I3 builds them). The STORM CIRCUIT storm-tick (breathing + strikes + Surge)
// lands at I4 as the single-writer dragon.js addition; the full CHARGING ladder +
// tests/starters.mjs block at I5. The shared strike clock (js/pulseTimer.js) + ?strikePin
// exist (I0); the garment hums via flareMats today (the flare-loop else-branch holds it).
// ═══════════════════════════════════════════════════════════════════════════════

const TORSO_Y = 0.15;
// Palette anchors — CHARCOAL cloud-slate, hue ~222° desat, held in [0.20,0.26] (the
// charcoal-not-black law; these are apex (f3) reference values, the per-form ramp lives
// on the def). Silver-lining rims are DIFFUSE ("the sun behind the cloud"), never emissive.
const CHARCOAL = 0x293040, FLANK = 0x2e3543;   // apex body (flank tier) + one step lighter
const STORM_SHADOW = 0x2a2f3c;                  // dorsal storm-shadow (deepest cloud value)
const BELLY = 0x4a5468;                          // rain-slate belly (banks read)
const SILVER_RIM = 0x9fb0c8;                     // diffuse silver lining — glints, never glows

// hex-lerp — blend two colours by t (value banding tracks the CHARGING ramp).
function lerpHex(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

// The CLOUD material factory — mirrors the vesperMats/sovereignMats STRUCTURE (a
// factory returning flat-shaded mats), never its look. Body law (§B.3): metalness 0,
// roughness 0.85, envIntensity 0.18, emissive 0x000000 (the rig ticks
// bodyMat.emissiveIntensity 0.12→0.35 — black emissive keeps the cloud matte through
// it, the Revenant precedent). The near-white STORM CIRCUIT (arcSeam / arcCore) is NOT
// built here — it lands as flareMats + the guarded storm tick from I4; at I1 the caged
// dynamo's core rides `coreGlow` (opacity) + flareMats (a withheld hue lerp), idling
// DARK (the intermittent identity — "Vesper withholds; Tempest threatens", §C.3.3).
// A faint cool self-scatter FLOOR — the gate-authorized within-law lever (I1 r1): flat
// matte charcoal renders coal-black in shadow because Lambert gives away-facets fill only;
// a tiny uniform hue-matched emissive simulates a cloud's ambient self-scatter so crevices
// don't crush to black. Kept ≤~0.02 contribution + hue-matched so it never reads as GLOW
// (the LED-strip failure mode). NOTE: this revises the future §B.8 "body emissive = 0x000000"
// inventory assert to "≤ a tiny hue-matched floor" — the Fable design gate approved the lever.
// Cool self-scatter FLOOR — lifts the matte charcoal off coal-black so it RENDERS in the 0.20–0.26
// charcoal lane (gate: a body at rendered L 0.11–0.14 reads Vesper-black, failing the anti-Vesper
// separator; matte Lambert on a dark albedo needs this floor to hit the lane). Hue-matched, uniform.
const CLOUD_FLOOR = 0x151b26;

// OWNER-REFERENCE-DRIVEN (reference/tempest-owner-reference.png; the owner-reference-wins
// law, DRAGON-DESIGN §3): the Tempest is NOT a cloud-mass — it is a sleek dark-scaled storm
// DRAKE with a TWO-VALUE body: a near-black charcoal dorsal shell (camouflaged into the storm
// sky) over a BLAZING white-blue EMISSIVE underbelly, a chevron lightning seam where the two
// meet, dark bolt-glyphs knocked out of the glow, a white crest, four legs, and a glowing tail
// tuft. The billowed cloud clover-loft was WRONG at the primitive level and is deleted.
// v3 GARMENT DOCTRINE (§1 law 1, §4a, §5): the storm WEARS its lightning. The body is a charcoal
// dorsal shell over a DIFFUSE pale underbelly (`0x566384`), and the near-white energy CIRCUIT —
// spine seam + branching sternum veins + crest strips + (I2) wing-frame — is worn as hum-lit
// STRIPS (glow on COMPONENTS, never surfaces — DRAGON-DESIGN §6). Accent lane: `arcSeam 0xd9deff`
// (sat≤0.12) + `arcCore 0xf2f4ff` (the ONE true near-white). The strips idle at `humFloor(form)`
// (0.30→0.90) in cruise; the pulseTimer strike + breathing + Surge = the storm tick (I4).
function tempestMats(def, glow = 1) {
  const base = def.body ?? FLANK;                         // per-form charcoal (darkens up the ladder)
  const humFloor = 0.30 + 0.80 * (glow - 0.25);           // {0.25,0.5,0.75,1.0} glow → {0.30,0.50,0.70,0.90} hum
  const std = (color, opts = {}) => { const m = new THREE.MeshStandardMaterial({ color, emissive: opts.emissive ?? CLOUD_FLOOR, emissiveIntensity: opts.ei ?? 1.0, flatShading: true, roughness: opts.rough ?? 0.82, metalness: opts.metal ?? 0.03, side: THREE.DoubleSide, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, depthWrite: opts.depthWrite ?? true }); m.envMapIntensity = 0.2; return m; };
  // The DORSAL SHELL — a lit STEEL-SLATE scale skin in a 3-step value ladder (glow-up: kill flat-black —
  // she must read as structure next to her own lightning, not one coal-black mass). spine = the dark
  // shadow channel (a dark STEEL, not pure black); dorsal = a mid steel lift off the base; flank = a
  // clearly-lit steel facet so the top-lit scales catch a highlight and the body carves.
  const spine = std(lerpHex(base, 0x161d2c, 0.30));       // dark steel channel (was near-black 0x05070c)
  const dorsal = std(lerpHex(base, 0x434f66, 0.16));      // the bodyMat the rig ticks — a mid steel lift
  const flank = std(lerpHex(base, 0x76869f, 0.46));       // lit steel facet (brighter, wider spread)
  // THE PALE UNDERBELLY — DIFFUSE pale storm-slate `0x566384` (the reference's paler chest/belly),
  // lighter than the body but NOT emissive: the glow lives on the vein strips, and the soft halo is
  // ACES bloom off them (§4a: "a uniformly emissive belly surface" is deliberately NOT taken). Three
  // near-value steps so the plated belly still reads carved.
  // gate: 0x566384 rendered as faint NAVY (sat 0.21–0.27) — the reference belly is PALE slate. Lifted
  // + desaturated to a true pale grey-slate so the chest reads pale and gives the veins a bright
  // substrate to sit on (and lifts the ventral half of the body value into the charcoal lane).
  const bellyCore = std(0x7d879c, { emissive: 0x0d1119, rough: 0.7, metal: 0 });   // chest keel (palest)
  const bellyMid = std(0x707a90, { emissive: 0x0d1119, rough: 0.72, metal: 0 });
  const bellyEdge = std(0x646e84, { emissive: 0x0d1119, rough: 0.74, metal: 0 });  // flank/aft edge
  // THE BOLT GLYPHS — dark facets knocked out of the pale belly (a diagonal lightning slash).
  const bolt = std(lerpHex(base, 0x2a3140, 0.5), { emissive: 0x000000 });
  // ── THE WORN CIRCUIT (the garment's near-white glow strips; hum-lit at humFloor) ──
  // gate: the circuit "whispers, doesn't hum" — at ei≈humFloor the strips read as grey stitching in
  // the no-bloom studio. The hum MULTIPLIER is pushed up so the worn circuit reads as clearly-lit
  // near-white even without bloom (in-game bloom then blazes it; the I4 storm tick will cap the
  // peak). This is a studio-legibility lift, not a game-brightness spec.
  // I4 STORM-TICK params: the strike PEAK ceiling ramps with the ladder like humFloor
  // (peak 1.2/1.6/2.0/2.4 for glow 0.25/0.5/0.75/1.0). hum·breathe idles the strip; the
  // pulseTimer strike lifts it toward `peak` (§5a/§5d). Ratio peak/hum ∈ [2.2,4.0] by design.
  const peakFloor = 1.2 + 1.6 * (glow - 0.25);
  // `stormBucket` = the root→tip travel stage (0 root · 1 mid · 2 tips); the storm tick offsets
  // each bucket's strike envelope +0.04·bucket s so the bolt TRAVELS out over ~0.12 s (§5b).
  // `stormCap` = the absolute emissive ceiling (glare discipline §5a); `stormRel` = the idle
  // value-ladder weight (core/heart read brighter, so idle a touch lower to stay under the cap).
  // stormHum = the idle base (humFloor·rel, the value-ladder weight); stormPeak = the strike
  // target (peakFloor·cap/2.4, so the apex form lands exactly on the cap and lower rungs scale
  // down). The tick reads these directly (no form lookup): ei = stormHum·breathe + env·(peak−hum).
  // BLOOM_SCALE: the pre-render caps (2.4/2.0) sit ABOVE the in-game bloom-saturation knee, so at
  // idle the strip cores already clip white and the strike's extra emissive floods the SCENE bloom
  // instead of punching the wire (Fable: "the strike reads as the weather changing, not the circuit
  // firing"). Scaling hum + peak + cap by ONE factor keeps the strike:idle RATIO in band but drops
  // the whole range below the knee, so the strike lands as a CORE brightening on the components.
  const BLOOM_SCALE = 0.6;
  // IDLE_HINT (owner redirect): NORMAL flight is nearly OFF — the lightning colour on the wing/body
  // is only a faint HINT on the dark charcoal frame, so the periodic CRACKLE (the pulseTimer strike
  // flashing it to `peak`) reads as an event — "it's capable of cracking." SURGE then brings it ALIVE
  // (breathing charged lightning). This deliberately REINSTATES the withheld/off idle the buildsheet's
  // §5a "generous garment" doctrine had retired — the owner's live direction outranks the sheet.
  const IDLE_HINT = 0.13;
  const mkStorm = (m, bucket, cap, rel) => { const c = cap * BLOOM_SCALE; const peak = Math.min(c, peakFloor * c / 2.4); m.userData.stormBucket = bucket; m.userData.stormCap = c; m.userData.stormRel = rel; m.userData.stormPeak = peak; m.userData.stormHum = peak * IDLE_HINT; return m; };
  const mkArc = (col, mul, w, bucket, cap, rel) => { const m = std(col, { emissive: col, ei: humFloor * mul, rough: 0.45, metal: 0 }); m.userData.baseEmissive = col; m.userData.baseIntensity = humFloor * mul; m.userData.flareIntensityWeight = w ?? 0.5; return mkStorm(m, bucket, cap, rel); };
  const arcSeam = mkArc(0xd9deff, 2.4, 0.5, 1, 2.4, 1.00);   // the storm-white circuit (spine + sternum veins) — MID bucket
  const arcCore = mkArc(0xf2f4ff, 3.0, 0.5, 2, 2.0, 0.92);   // the ONE true near-white — vein cores + strike-peak tips — TIPS bucket
  // arcBloom — the storm-blue PENUMBRA under each lightning filament (the glow-up: the wing bones stop
  // being flat white tape and gain the Arc Crown's core→bloom→dark structure). A WIDE, DIM, RECESSED
  // storm-blue skirt under the narrow white core so every strut reads white filament → blue haze → dark
  // membrane, not a parallel-edged white strip. Held to the near-white ACCENT LANE (HSV-sat ≤0.16, §9):
  // the falloff is carried by VALUE (dim + wide vs the bright narrow core), not by saturation.
  const arcBloom = mkArc(0xd8e2ff, 1.5, 0.4, 1, 1.9, 0.72);  // the bluest in-lane storm-white, dimmer/lower than the core
  const crest = mkArc(0xd9deff, 2.0, 0.4, 1, 2.0, 0.85);     // the horn-crest strips (a step under the veins) — MID bucket
  // THE STORM-HEART dynamo core — the brightest node, on the coreGlow hook (transparent; opacity
  // ticked). Near-white, hum-lit; ≤15% of cruise emissive (the anti-lantern lock, §3.3). ROOT bucket.
  const heartCore = std(0xd9deff, { emissive: 0xf2f4ff, ei: humFloor * 3.2, rough: 0.4, metal: 0, transparent: true, opacity: 0.7 + 0.2 * glow, depthWrite: false });
  heartCore.userData.baseEmissive = 0xf2f4ff; heartCore.userData.baseIntensity = humFloor * 3.2;
  mkStorm(heartCore, 0, 1.6, 0.75);
  // CARVED-DEPTH tiers (Revenant richness): near-black RECESS walls + a darker SOCKET FLOOR.
  const recess = std(lerpHex(base, 0x000000, 0.55), { emissive: 0x000000, rough: 0.9 });
  const socketFloor = std(0x05070c, { emissive: 0x000000, rough: 0.95 });
  // ── THE STORMFORK WING KIT (I2) ──
  // silverRim — the diffuse "silver lining" cap tier: glints, never glows (metalness 0.06,
  // envMapIntensity 0.3). Keeps every bolt sculpted when the hum is at its floor (f0) and under the
  // warm-gold backdrop stress tile. Rides UNDER the arc overlays on the same crest nodes.
  const silverRim = std(0x9fb0c8, { emissive: 0x0a0e16, ei: 0.4, rough: 0.5, metal: 0.06 }); silverRim.envMapIntensity = 0.3;
  // boltTiers[4] — the OPAQUE matte cloud-membrane the bolt is sewn to (near-black faceted planes,
  // §4b-d, the reference's dark storm-cloth). A dark charcoal base lerped a little toward a muted
  // steel-slate so the inboard bays catch a flat facet-value and the outboard crotch reads darkest.
  // NEVER translucent/additive — the frame owns 100% of the light, the membrane emits nothing.
  const memBase = lerpHex(base, 0x05070c, 0.30);   // darker than the dorsal shell (the recessed floor)
  // glow-up #4: a WIDER value ladder (0.05→0.58 toward a lit steel-blue) so the value-banded bays read as
  // a faceted charged CLOUD — lit taut facets vs dark cups — not one flat near-black plane. A hair more
  // emissive charge (still far under the anti-lantern floor) gives the underside a faint stormlight.
  const boltTiers = [0.58, 0.34, 0.18, 0.05].map((f) => std(lerpHex(memBase, 0x808ea8, f), { emissive: 0x0c1120, ei: 0.55, rough: 0.9, metal: 0 }));
  return { spine, dorsal, flank, bellyCore, bellyMid, bellyEdge, bolt, arcSeam, arcCore, arcBloom, crest, heartCore, recess, socketFloor, silverRim, boltTiers, humFloor, peakFloor };
}

// Deterministic hash jitter (index-seeded — never Math.random, so builds are reproducible).
function jit(i, amp) { const h = Math.sin((i + 1) * 12.9898 + 4.1) * 43758.5453; return (h - Math.floor(h) - 0.5) * 2 * amp; }

// ── THE DRAKE TRUNK + ORGANIZED DETAIL RANKS (richness overhaul, Fable diagnostic I1.5) ──
// The body carries CRAFT the way the shipped Revenant does: ~7 organized geometric RANKS (repeating
// units at fixed pitch) + CARVED DEPTH (a lit rim over a dark sunk floor), NOT paint on a smooth
// loft. Every rank pushes into ONE shared per-material accumulator → still ≤~12 draws for the whole
// torso. Module-level ring helpers so the trunk, the belly deck, and the ranks all share the geometry.
const TRUNK_N = 10;
const JA = 0.04;   // trunk vertex jitter (was 0.10 — that read as a melted balloon; crisp facets now)
function trunkTh(k) { return Math.PI / 2 - (k * 2 * Math.PI / TRUNK_N); }   // k0 top, k5 bottom keel
function trunkPt(s, i, k) {
  const c = Math.cos(trunkTh(k)), sn = Math.sin(trunkTh(k));
  const rY = sn >= 0 ? s.ryU : s.ryD;
  const jx = jit(i * 97 + k * 7, s.rx * JA), jy = jit(i * 131 + k * 13, rY * JA);
  let x = c * s.rx + jx, y = s.cy + sn * rY + jy;
  if (k === 5) y -= s.keel || 0;
  return [x, y, s.z];
}
// a trunk ring point raised outward along the (jitter-free) radial normal by `lift` (for relief)
function trunkRaised(s, i, k, lift) {
  const p = trunkPt(s, i, k);
  const nx = Math.cos(trunkTh(k)) * s.rx, ny = Math.sin(trunkTh(k)) * (Math.sin(trunkTh(k)) >= 0 ? s.ryU : s.ryD);
  const nl = Math.hypot(nx, ny) || 1;
  return [p[0] + (nx / nl) * lift, p[1] + (ny / nl) * lift, p[2]];
}
const triWave = (i) => 2 - Math.abs((i % 4) - 2);            // 0,1,2,1 — the chevron seam march
const ventColsAt = (i) => { const lo = 2 + triWave(i), hi = 8 - triWave(i), set = new Set(); for (let k = lo; k <= hi; k++) set.add(k); return set; };
const bellyBolt = new Set(['2:6', '3:5', '4:4', '5:5', '6:6']);   // the recessed bolt channel facets
// gate fix: +(i%2) makes ADJACENT plates alternate value so the deck doesn't posterise to flat blue tape.
function bellyTier(M, i, k) { const lvl = Math.min(Math.abs(k - 5), 3) + Math.abs(i - 4) * 0.5 + (i % 2) * 0.7; return lvl < 0.7 ? M.bellyCore : lvl < 2.0 ? M.bellyMid : M.bellyEdge; }

// The DARK dorsal shell (spine ridge darkest / flank lit / dorsal mid) — ventral columns are owned
// by the raised belly DECK (addBellyDeck), so this only lays the top ~60% of each ring + the caps.
function addTrunkShell(push, stations, M) {
  const N = TRUNK_N;
  for (let i = 0; i < stations.length - 1; i++) {
    const vc = ventColsAt(i);
    for (let k = 0; k < N; k++) {
      if (vc.has(k)) continue;                              // ventral → the belly deck owns it
      const k1 = (k + 1) % N;
      const A0 = trunkPt(stations[i], i, k), A1 = trunkPt(stations[i], i, k1), B0 = trunkPt(stations[i + 1], i + 1, k), B1 = trunkPt(stations[i + 1], i + 1, k1);
      const mat = (k === 0 || k === 9 || k === 1) ? M.spine : (k === 2 || k === 8) ? M.flank : M.dorsal;
      push(mat, [A0, B1, B0], [A0, A1, B1]);
    }
  }
  for (const [s, i, dir] of [[stations[0], 0, 1], [stations[stations.length - 1], stations.length - 1, -1]]) {
    const c = [0, s.cy - (s.keel || 0) * 0.5, s.z];
    for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; const a = trunkPt(s, i, k), b = trunkPt(s, i, k1); push(M.spine, dir > 0 ? [c, b, a] : [c, a, b]); }
  }
}

// R2 — the STRUCTURED BELLY DECK: the glow ventral is now RAISED armor plates over a dark RECESS
// base, with recessed gutter WALLS around every plate + a dark recessed bolt channel. The chevron
// seam becomes a physical STEP (the plate edge over the shell). Paint → carving.
function addBellyDeck(push, stations, M) {
  const LIFT = 0.05;
  const raised = (i, k) => ventColsAt(i).has(k) && !bellyBolt.has(i + ':' + k) && !(i === 3 || i === 6);   // gutter bands at i=3,6
  const wall = (a, b, c, d) => push(M.recess, [a, b, c], [a, c, d]);
  for (let i = 0; i < stations.length - 1; i++) {
    for (const k of ventColsAt(i)) {
      const k1 = (k + 1) % TRUNK_N;
      const A0 = trunkPt(stations[i], i, k), A1 = trunkPt(stations[i], i, k1), B0 = trunkPt(stations[i + 1], i + 1, k), B1 = trunkPt(stations[i + 1], i + 1, k1);
      if (raised(i, k)) {
        const rA0 = trunkRaised(stations[i], i, k, LIFT), rA1 = trunkRaised(stations[i], i, k1, LIFT), rB0 = trunkRaised(stations[i + 1], i + 1, k, LIFT), rB1 = trunkRaised(stations[i + 1], i + 1, k1, LIFT);
        push(bellyTier(M, i, k), [rA0, rB1, rB0], [rA0, rA1, rB1]);   // the lit glow plate face
        if (!raised(i, k - 1)) wall(A0, B0, rB0, rA0);                // gutter walls to any non-raised neighbour
        if (!raised(i, k + 1)) wall(A1, rA1, rB1, B1);
        if (!raised(i - 1, k)) wall(A0, rA0, rA1, A1);
        if (!raised(i + 1, k)) wall(B0, B1, rB1, rB0);
      } else {
        push(bellyBolt.has(i + ':' + k) ? M.bolt : M.recess, [A0, B1, B0], [A0, A1, B1]);   // recess base / dark bolt channel
      }
    }
  }
}

// R1 — the DORSAL SCUTE + CREST RIDGE (the rear-chase carrier): a rank of ~N units down the spine.
// Crest BLADES over the neck/withers (tall, emissive), peaked SCUTES over the back (charcoal,
// shrinking aft), each with a GAP + a dark under-strip = a free carved recess per unit; the top
// silhouette becomes a serrated rank instead of a bare tube.
function addDorsalRidge(push, stations, M, count) {
  const zTop = -2.20, zEnd = stations[stations.length - 1].z;   // occiput → tail-base (gate: the crest must run up the NECK, the head-crop money surface)
  const sample = (z) => { for (let j = 0; j < stations.length - 1; j++) { const a = stations[j], b = stations[j + 1]; if (z >= a.z && z <= b.z) { const t = (z - a.z) / (b.z - a.z || 1); return { x: 0, y: (a.cy + a.ryU) + ((b.cy + b.ryU) - (a.cy + a.ryU)) * t, w: (a.rx + (b.rx - a.rx) * t) }; } } const l = stations[stations.length - 1]; return { x: 0, y: l.cy + l.ryU, w: l.rx }; };
  for (let u = 0; u < count; u++) {
    const t = u / (count - 1), z = zTop + (zEnd - zTop) * t;
    const at = sample(z), fr = 0.9 - 0.5 * t;               // shrink aft
    if (z < -0.95) {   // NECK/WITHERS → an emissive crest blade (kinked, swept back)
      const len = 0.24 * fr + 0.06, cant = (u % 2 ? 1 : -1) * 0.035;
      const r0 = [cant - 0.03, at.y, z], r1 = [cant + 0.03, at.y, z];
      const kink = [cant, at.y + len * 0.55, z + 0.09], tip = [cant, at.y + len * 0.4, z + len * 0.95];
      push(M.crest, [r0, kink, r1], [r1, kink, tip], [r0, tip, kink]);
    } else {           // BACK → a LIGHTNING-ROD VANE: a tall kinked charcoal bolt-blade with a
      // near-white glow cap + silver-rim leading edge (the shared stormSpike — the SAME bone as the
      // wing struts, so the body speaks the wing's lightning language, not a flat wire). Alternating
      // tall/short = a discharge-array waveform; the deep under-gap is a recess for glow to pool in.
      const alt = (u % 2 === 0);
      const H = (alt ? 0.31 : 0.185) * fr + 0.058;          // glow-up #3: taller vanes — the back reads as a pronounced charged serrated line (holds silhouette mass behind the wings)
      const foot = 0.11 * fr + 0.03, wB = 0.05 * fr + 0.018, lean = 0.05 + 0.03 * (u % 2);
      const a = [0, at.y - 0.012, z - foot * 0.4], b = [0, at.y - 0.012, z + foot];   // short fore-aft footprint, raised H
      const glow = (u % 3 === 0) ? M.arcCore : M.arcSeam;   // brightest vane every 3rd (a value ladder down the rank)
      stormSpike(push, 1, a, b, wB, 0.012, H, M.spine, glow, M.silverRim, 0.66, M.arcBloom);
      // the DEEP under-gap flanking the vane base → a charcoal recess (depth; the trough the spine
      // channel's glow pools into, never a strip on convexity).
      push(M.recess, [[-wB, at.y - 0.03, z + foot * 0.6], [-wB, at.y - 0.012, z - foot * 0.4], [wB, at.y - 0.012, z - foot * 0.4]],
                     [[-wB, at.y - 0.03, z + foot * 0.6], [wB, at.y - 0.012, z - foot * 0.4], [wB, at.y - 0.03, z + foot * 0.6]]);
    }
  }
}

// R3 — the STORM-HEART SOCKET (the carved-recess flagship): a rim ring at the keel surface, a floor
// point sunk INWARD (near-black), a lip flared outward (lit rim) — the Revenant orbit pattern. The
// ember seats at the socket MOUTH behind the lip. 5 charcoal cowl VANES ring it (the caged dynamo).
function addSocket(push, M, cx, cy, cz, r) {
  const nR = 7, rim = [], lip = [];
  for (let k = 0; k < nR; k++) { const a = (k / nR) * Math.PI * 2; rim.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz]); lip.push([cx + Math.cos(a) * r * 1.28, cy + Math.sin(a) * r * 1.05, cz + 0.02]); }
  const floor = [cx, cy - r * 0.15, cz - r * 1.5];          // sunk deep → the interior falls to shadow
  for (let k = 0; k < nR; k++) { const k1 = (k + 1) % nR;
    push(M.socketFloor, [rim[k], rim[k1], floor]);          // rim → deep dark floor cup
    push(M.flank, [rim[k], lip[k1], lip[k]], [rim[k], rim[k1], lip[k1]]);   // rim → lit outward lip
  }
  for (let v = 0; v < 5; v++) {   // caged-dynamo cowl vanes, swept, ringing the mouth
    const a = (v / 5) * Math.PI * 2, inner = r * 1.15, outer = r * 1.7, sw = 0.5;
    const ix = cx + Math.cos(a) * inner, iy = cy + Math.sin(a) * inner, ox = cx + Math.cos(a + sw) * outer, oy = cy + Math.sin(a + sw) * outer;
    push(M.spine, [[ix, iy, cz + 0.03], [ox, oy, cz + 0.03], [(ix + ox) / 2, (iy + oy) / 2, cz + 0.10]]);
  }
  return [cx, cy, cz + 0.03];   // the ember mouth position (behind the lip)
}

// R4 — a LAPPED ARMOR PLATE standing `off` the surface (the standoff gap = a shadow recess), aft
// edge overlapping the next. Cupped 4-quad card in a local frame (centre c, outward n, along-body t).
function addArmorPlate(push, M, c, n, t, halfW, len, mat) {
  const nl = Math.hypot(...n) || 1, tn = [n[0] / nl, n[1] / nl, n[2] / nl];
  const tl = Math.hypot(...t) || 1, tt = [t[0] / tl, t[1] / tl, t[2] / tl];
  const s = [tt[1] * tn[2] - tt[2] * tn[1], tt[2] * tn[0] - tt[0] * tn[2], tt[0] * tn[1] - tt[1] * tn[0]];   // side = t×n
  const P = (u, v, lift) => [c[0] + tt[0] * u + s[0] * v + tn[0] * lift, c[1] + tt[1] * u + s[1] * v + tn[1] * lift, c[2] + tt[2] * u + s[2] * v + tn[2] * lift];
  const off = 0.055, cup = 0.035;   // gate: the standoff GAP is the rank — deepen it so the plate throws a real shadow step
  const fore = P(-len, 0, off), aft = P(len, 0, off + 0.015), l = P(0, -halfW, off + cup), rr = P(0, halfW, off + cup);
  push(mat, [fore, l, rr], [aft, rr, l]);                   // the cupped plate (2 faces, standing proud)
  // dark recessed walls around the plate perimeter = the shadow gap that makes it read as a lapped plate
  push(M.recess, [P(-len, -halfW, 0), fore, l], [P(-len, halfW, 0), rr, fore], [P(len, -halfW, 0), l, aft], [P(len, halfW, 0), aft, rr]);
}

// R5 — a run of small cupped SCALE cards along a body line (the flank plate-scale texture; 2 tris
// each, alternating value). at(t)/n(t)/tan(t) sample the path; cards overlap like shingles.
function addScaleRow(push, M, count, at, nrm, tan, len, wid) {
  for (let u = 0; u < count; u++) {
    const t = u / (count - 1), c = at(t), n = nrm(t), tg = tan(t);
    const nl = Math.hypot(...n) || 1, tn = [n[0] / nl, n[1] / nl, n[2] / nl];
    const tl = Math.hypot(...tg) || 1, tt = [tg[0] / tl, tg[1] / tl, tg[2] / tl];
    const s = [tt[1] * tn[2] - tt[2] * tn[1], tt[2] * tn[0] - tt[0] * tn[2], tt[0] * tn[1] - tt[1] * tn[0]];
    const P = (a, b, h) => [c[0] + tt[0] * a + s[0] * b + tn[0] * h, c[1] + tt[1] * a + s[1] * b + tn[1] * h, c[2] + tt[2] * a + s[2] * b + tn[2] * h];
    const tip = P(len, 0, 0.03), bl = P(-len * 0.4, -wid, 0.055), br = P(-len * 0.4, wid, 0.055);   // stand proud so the edge throws a shadow
    push(u % 2 ? M.flank : M.spine, [bl, tip, br]);          // a cupped scale card (alternating value for the plate read)
    push(M.recess, [bl, br, P(-len * 0.9, 0, 0)]);          // a dark gap under the fore edge = the shadow step (the rank cue)
  }
}

// R7 — THROAT GORGET bands: wide shallow ventral scutes carrying the belly glow up the neck in
// SEGMENTED geometry (so the throat joins the belly system instead of being a bare tube).
function addGorget(push, stations, M) {
  const zs = [-2.16, -2.02, -1.88, -1.74, -1.60];
  const sample = (z) => { for (let j = 0; j < stations.length - 1; j++) { const a = stations[j], b = stations[j + 1]; if (z >= a.z && z <= b.z) { const t = (z - a.z) / (b.z - a.z || 1); return { yb: (a.cy - a.ryD) + ((b.cy - b.ryD) - (a.cy - a.ryD)) * t, w: a.rx + (b.rx - a.rx) * t }; } } return { yb: stations[2].cy - stations[2].ryD, w: stations[2].rx }; };
  // gate fix: the bands must STAND OFF the throat with a dark step behind, or they vanish. Each band is
  // a raised emissive chevron plate + a recessed dark seam aft = a segmented glowing throat (a real rank).
  zs.forEach((z, i) => {
    const s = sample(z), w = s.w * 0.7, y = s.yb;
    const bl = [-w, y + 0.01, z], br = [w, y + 0.01, z], keel = [0, y - 0.04, z + 0.05];   // diffuse pale throat band
    push(M.bellyMid, [bl, keel, br]);
    push(M.recess, [bl, [-w, y + 0.02, z + 0.11], keel], [br, keel, [w, y + 0.02, z + 0.11]]);   // dark recessed seam aft
  });
}

// ── THE WORN CIRCUIT (v3 garment): a thin RIBBON strip of near-white glow riding a polyline of
// body nodes — the spine seam + branching sternum veins. Raised a hair off the surface so it reads
// as a lit strip ON the charcoal/pale body (glow on components, DRAGON-DESIGN §6). arcSeam/arcCore.
function addRibbon(push, mat, pts, halfW, dy = 0.015) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const aL = [a[0] - halfW, a[1] + dy, a[2]], aR = [a[0] + halfW, a[1] + dy, a[2]];
    const bL = [b[0] - halfW, b[1] + dy, b[2]], bR = [b[0] + halfW, b[1] + dy, b[2]];
    push(mat, [aL, bR, bL], [aL, aR, bR]);
  }
}
// THE SPINE CIRCUIT — one near-white seam occiput→tail-root along the dorsal centerline (bucket b2),
// riding the same spine nodes the ridge uses (weld by construction — it can't float off).
function addSpineCircuit(push, stations, M) {
  // The dorsal circuit is NOT a straight surface ribbon (that read as a strip of LEDs and fought the
  // wing's kinked-bolt identity). It's a JAGGING channel that zigzags side-to-side down the spine and
  // sits LOW (dy<0) so the glow pools in the trough BETWEEN the raised vanes — a lightning bolt run
  // down the back, in a recess, not a wire on a tube. Forks a short branch toward each shoulder.
  const sample = (z) => { for (let j = 0; j < stations.length - 1; j++) { const a = stations[j], b = stations[j + 1]; if (z >= a.z && z <= b.z) { const t = (z - a.z) / (b.z - a.z || 1); const L = (p, q) => p + (q - p) * t; return { y: L(a.cy + a.ryU, b.cy + b.ryU), w: L(a.rx, b.rx) }; } } const l = stations[stations.length - 1]; return { y: l.cy + l.ryU, w: l.rx }; };
  const zig = []; let s = 1;
  for (let z = -2.16; z <= 1.55; z += 0.16) { const at = sample(z); zig.push([s * at.w * 0.14, at.y - 0.03, z]); s = -s; }   // low + side-to-side jag = the bolt in the trough
  addRibbon(push, M.arcSeam, zig, 0.026, -0.005);
  // the two shoulder FORKS (branch off toward each wing root — the wing bolts continue INTO the body)
  for (const side of [1, -1]) {
    const at = sample(-1.0);
    push(M.arcSeam, [[side * at.w * 0.12, at.y - 0.03, -1.05], [side * at.w * 0.5, at.y - 0.02, -0.92], [side * at.w * 0.34, at.y - 0.05, -0.88]]);
  }
}
// THE STERNUM VEINS — the branching near-white circuit worn on the pale belly (bucket b1): one
// bright core vein down the ventral centerline dynamo→tail-root + a branch to each wing root + two
// short forked side-veins, all welded to the belly-bottom nodes.
function addSternumVeins(push, stations, M) {
  const sampleB = (z) => { for (let j = 0; j < stations.length - 1; j++) { const a = stations[j], b = stations[j + 1]; if (z >= a.z && z <= b.z) { const t = (z - a.z) / (b.z - a.z || 1); const L = (p, q) => p + (q - p) * t; return { yb: L(a.cy - a.ryD, b.cy - b.ryD), w: L(a.rx, b.rx) }; } } const l = stations[stations.length - 1]; return { yb: l.cy - l.ryD, w: l.rx }; };
  // The bright CORE vein down the keel (dynamo → tail-root) — proud + wide so it reads from the chase.
  const main = []; for (let z = -0.9; z <= 1.5; z += 0.12) { const s = sampleB(z); main.push([0, s.yb + 0.02, z]); }
  addRibbon(push, M.arcCore, main, 0.045, -0.04);
  // Two side veins riding the lower flanks (the chest carries a NETWORK, not one wire — the
  // reference's glowing veined belly), each with a zigzag chest branch toward the core.
  for (const side of [1, -1]) {
    const sideV = []; for (let z = -0.85; z <= 1.1; z += 0.16) { const s = sampleB(z); sideV.push([side * s.w * 0.62, s.yb + s.w * 0.35, z]); }
    addRibbon(push, M.arcSeam, sideV, 0.032, -0.02);
    // zig chest branches: side vein → core, alternating fore/aft (the lightning chest read)
    for (const z of [-0.7, -0.2, 0.35, 0.8]) { const s = sampleB(z); addRibbon(push, M.arcSeam, [[side * s.w * 0.6, s.yb + s.w * 0.32, z], [side * s.w * 0.2, s.yb + 0.03, z + 0.12], [0, s.yb + 0.02, z + 0.02]], 0.02, -0.01); }
    // branch up to each wing root
    const s0 = sampleB(-0.85), sR = sampleB(-1.05);
    addRibbon(push, M.arcSeam, [[side * s0.w * 0.4, s0.yb + 0.06, -0.85], [side * sR.w * 0.7, sR.yb + 0.16, -1.05], [side * 0.28, 0.10, -1.08]], 0.022, -0.01);
  }
}

// ── A minimal faceted tube loft (shared placeholder body element) ────────────
// Stations [{z, rx, ry, cy}] → one flat-shaded octagon tube. The STUB's stand-in
// for the real billowed clover-loft; I1 replaces it with cloverLoft (the knapLoft
// PATTERN + a per-station profile rotation ±10–14° — the diagonal turbulence weave
// that kills both rings AND straight strakes). Kept deliberately simple + solid here.
const OCTA = (() => { const p = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; p.push([Math.cos(a), Math.sin(a)]); } return p; })();
function tubeLoft(stations, mat, cap = true) {
  const N = OCTA.length;
  const P = (s, k) => [OCTA[k][0] * s.rx, s.cy + OCTA[k][1] * s.ry, s.z];
  const tris = [];
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i], b = stations[i + 1];
    for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; tris.push([P(a, k), P(b, k1), P(b, k)], [P(a, k), P(a, k1), P(b, k1)]); }
  }
  if (cap) {
    const f = stations[0], l = stations[stations.length - 1];
    const fc = [0, f.cy, f.z], lc = [0, l.cy, l.z];
    for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; tris.push([fc, P(f, k1), P(f, k)], [lc, P(l, k), P(l, k1)]); }
  }
  return flatTriMesh(tris, mat);
}

// ── TORSO: 'cumulonimbusTorso' (rebuilt to the OWNER REFERENCE — a storm DRAKE) ──
// A sleek dark-scaled drake trunk (deep keeled chest → hard waist tuck → haunch swell) with
// the near-black charcoal dorsal shell over the BLAZING white-blue emissive underbelly (the
// chevron lightning seam + dark bolt glyphs), a white neck crest, and four hanging legs.
// Publishes the FULL attach contract. The STORMFORK wing (I2), stormbrow head + virga fringe
// (I3), and the Storm Circuit + Surge (I4) still land per the increment plan.
function buildCumulonimbusTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const M = tempestMats(def, model.glowLevel ?? 1);
  const heartScale = model.heartScale ?? 1;

  // The drake trunk stations (neck-base → tail-base, + two forward neck rings so the THROAT
  // glow reads). {z, rx, ryU (up), ryD (down), cy, keel}. chest depth ≥ 1.5× waist (Fable).
  // gate r3 fix #3: a DEEP-keeled compact drake (was a shallow horizontal torpedo/eel). The chest
  // rings are big-radius with a real sternum keel slung well below the shoulders; the waist tucks
  // HARD against them (chest depth ≈ 2.9× waist), so the level-glide side profile reads deep-chested.
  // Owner: the body read long/thin/weak. Rebuilt COMPACT + MUSCULAR to the reference — a thick
  // muscular neck, broad deep shoulders, a deep slung chest, a strong (not pinched-weak) waist and a
  // powerful haunch; the whole frame beefier and a touch shorter (a powerful drake, not a tube).
  // Compacted further (Fable: still read long/lean). The NECK is shortened ~20% + bulked, and the
  // mid-torso bulked, so the wing roots sit on a big shoulder-block of visible muscle, not a tube.
  const trunk = [
    { z: -1.98, rx: 0.15, ryU: 0.15, ryD: 0.15, cy: 0.05 },   // neck (short + thick, toward the head)
    { z: -1.66, rx: 0.21, ryU: 0.20, ryD: 0.23, cy: 0.12 },   // lower neck (muscular)
    { z: -1.34, rx: 0.28, ryU: 0.24, ryD: 0.31, cy: 0.17 },   // neck-base / withers (thick)
    { z: -1.04, rx: 0.41, ryU: 0.31, ryD: 0.44, cy: 0.15 },   // shoulder girdle (broad, deep — the wing block)
    { z: -0.68, rx: 0.40, ryU: 0.31, ryD: 0.58, cy: 0.11, keel: 0.17 },  // CHEST KEEL (deep, slung, muscular)
    { z: -0.24, rx: 0.34, ryU: 0.27, ryD: 0.42, cy: 0.15 },   // ribcage end (full-bodied)
    { z: 0.22, rx: 0.24, ryU: 0.21, ryD: 0.24, cy: 0.20 },    // WAIST (a tuck, but strong — not weak)
    { z: 0.66, rx: 0.33, ryU: 0.25, ryD: 0.32, cy: 0.15 },    // haunch swell (powerful)
    { z: 1.08, rx: 0.21, ryU: 0.17, ryD: 0.19, cy: 0.14 },    // pelvis
    { z: 1.46, rx: 0.12, ryU: 0.10, ryD: 0.10, cy: 0.11 },    // tail-base
  ];
  // ONE shared per-material accumulator for the whole torso → still ≤~12 draws with all 7 ranks.
  const byMat = new Map();
  const push = (mat, ...tris) => { let a = byMat.get(mat); if (!a) byMat.set(mat, a = []); for (const t of tris) a.push(t); };

  addTrunkShell(push, trunk, M);        // the dark hull
  addBellyDeck(push, trunk, M);         // R2 — raised glow plates + recessed gutters + bolt channel
  const ridgeN = 13 + Math.round(8 * (model.glowLevel ?? 1));   // R1 — dorsal scute/crest rank, occiput→tail (ladders up)
  addDorsalRidge(push, trunk, M, ridgeN);
  addGorget(push, trunk, M);            // R7 — throat gorget bands (diffuse pale)
  addSpineCircuit(push, trunk, M);      // the worn SPINE seam (near-white, hum-lit)
  addSternumVeins(push, trunk, M);      // the worn STERNUM VEINS (branching near-white circuit)

  // R4 — lapped armor plates over the shoulder girdle + haunch (the two muscle masses).
  for (const side of [1, -1]) {
    for (const z of [-1.2, -0.98, -0.78]) addArmorPlate(push, M, [side * 0.28, 0.27, z], [side * 0.75, 0.5, 0], [0, 0, 1], 0.10, 0.13, M.flank);
    for (const z of [0.56, 0.82]) addArmorPlate(push, M, [side * 0.22, 0.26, z], [side * 0.7, 0.45, 0], [0, 0, 1], 0.09, 0.11, M.flank);
  }

  // R5 — flank scale-plate shingle rows (2 lines per side over the smooth flank wall).
  const lerpStn = (z) => { for (let j = 0; j < trunk.length - 1; j++) { const a = trunk[j], b = trunk[j + 1]; if (z >= a.z && z <= b.z) { const t = (z - a.z) / (b.z - a.z || 1); const L = (p, q) => p + (q - p) * t; return { z, rx: L(a.rx, b.rx), ryU: L(a.ryU, b.ryU), ryD: L(a.ryD, b.ryD), cy: L(a.cy, b.cy), keel: 0 }; } } return trunk[trunk.length - 1]; };
  for (const side of [1, -1]) {
    for (const [k, cnt] of [[2, 11], [3, 10]]) {
      const kk = side > 0 ? k : (TRUNK_N - k);
      const at = (t) => { const z = -1.35 + t * 2.35; return trunkPt(lerpStn(z), 0, kk); };
      const nrm = (t) => { const th = trunkTh(kk); return [Math.cos(th) * side, Math.sin(th) * 0.6, 0]; };
      const tan = () => [0, 0, 1];
      addScaleRow(push, M, Math.round(cnt * (0.6 + 0.4 * (model.glowLevel ?? 1))), at, nrm, tan, 0.075, 0.05);
    }
  }

  // (No legs — no dragon in the roster has arms/legs; the Tempest is a legless wyvern-drake, owner-
  // directed. The reference showed a quadruped, but the owner outranks the reference on game-fit.)

  // R3 — the carved STORM-HEART SOCKET at the sternum (rim + sunk floor + lit lip + cowl vanes).
  const mouth = addSocket(push, M, 0, -0.20, -0.74, 0.11 * (0.8 + 0.3 * heartScale));

  // materialise every rank into ≤~12 meshes (one flatTriMesh per material instance).
  for (const [mat, tris] of byMat) group.add(flatTriMesh(tris, mat));

  // THE STORM-HEART ember — a jittered lump seated at the socket MOUTH behind the lip (the "glow
  // from within" read — not too deep, the no-bloom-studio band). Transparent, on the coreGlow hook.
  const coreGeo = new THREE.OctahedronGeometry(0.075 * (0.7 + 0.5 * heartScale), 0);
  { const pa = coreGeo.attributes.position; for (let vi = 0; vi < pa.count; vi++) { const j = jit(vi * 3, 0.02); pa.setXYZ(vi, pa.getX(vi) + j, pa.getY(vi) + j, pa.getZ(vi) + j); } pa.needsUpdate = true; coreGeo.computeVertexNormals(); }
  const core = new THREE.Mesh(coreGeo, M.heartCore);
  core.position.set(mouth[0], mouth[1], mouth[2]); core.renderOrder = 1;
  core.userData.base = 0.7 + 0.15 * heartScale;
  group.add(core);

  // Motif anchor — the STORM-HEART (fixed at the sternum, never re-hues, §3).
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(0, -0.22, -0.74);
  group.add(motifAnchor);

  // Line-of-action (≥2 inflections: neck rises → chest proud → waist tuck → haunch → tail).
  const spinePoints = [
    new THREE.Vector3(0, 0.05, -2.28), new THREE.Vector3(0, 0.19, -1.5),
    new THREE.Vector3(0, 0.17, -0.28), new THREE.Vector3(0, 0.20, 0.26),
    new THREE.Vector3(0, 0.12, 1.60),
  ];
  const wro = model.wingRootOffset ?? {};
  const attach = {
    wingRoot: (side) => ({ x: 0.30 * side, y: TORSO_Y + 0.30 + (wro.y ?? 0), z: -1.00 + (wro.z ?? 0) }),   // shoulder girdle
    headBase: { x: 0, y: 0.00, z: -2.32 },   // pulled in with the shortened neck (occiput meets neck front)
    tailAnchor: { y: 0.12, z: 1.48 },
    keelTopAt: (z) => TORSO_Y + 0.30 * Math.max(0, 1 - Math.abs(z + 1.0) / 2.4),
    halfWidthAt: (z) => 0.30 * Math.max(0.2, 1 - Math.abs(z + 0.6) / 3.0),
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.52, z: -0.5 },
    motifAnchor,
  };
  // coreGlow = the storm-heart core (the real transparent hook — opacity ticked). flareMats =
  // the belly + crest + heart (Surge-flared, exempt from the warm cruise rim). spineMats [] .
  // flareMats = the worn CIRCUIT (arcSeam veins/spine + arcCore core vein + crest + heart) — hum-lit
  // in cruise (the flare loop's else-branch holds them at userData.baseIntensity = humFloor),
  // Surge-flared, warm-rim-exempt; the belly tiers are now DIFFUSE (glow lives on the strips). The
  // storm tick becomes the single writer at I4 (breathing + strikes). spineMats [] .
  // The near-white CIRCUIT mats go to stormArcMats — the storm tick (dragon.js §5d) is their
  // SINGLE writer (breathe + strikes + Surge). NOT flareMats (else-reset erases the tick) and
  // NOT spineMats (the warm cruise rim is poison for the 255° near-white family).
  return { group, attach, spinePoints, spineMats: [], stormArcMats: [M.arcSeam, M.arcCore, M.arcBloom, M.crest, M.heartCore], mats: { bodyMat: M.dorsal }, coreGlow: core };
}
registerTorso('cumulonimbusTorso', buildCumulonimbusTorso);

// ── WINGS: 'stormforkWings' (the HERO — the storm bat-wing) ────────────────────
// OWNER-DIRECTED REBUILD: a proper BAT WING on the Revenant phalanx anatomy (the roster's
// most anatomically bat-correct wing — `dragonRevenant.js:377`), at Revenant's SPAN (×4.1,
// big + majestic), with the Tempest's own storm identity welded on:
//   • a SHORT 2-bone arm + a MEDIAL wrist K (the struts carry the whole wing);
//   • N long FINGER-STRUTS fanning aft (az 25°→88°) + every tip DROOPING (a ventral dome
//     that cups air, never a raised V), Revenant's FAN/DROOP tables;
//   • but each strut is the Tempest's KINKED GLOWING STORM-BOLT (a hard knuckle-step, not
//     Revenant's smooth bone bézier) — near-white lit cap + charcoal shadow-bevel + silver
//     rim, standing PROUD of the membrane; the outer struts FORK near the tip (the
//     reference's forked-lightning branches);
//   • ONE CONTINUOUS welded membrane (Revenant's loft: chiropatagium + propatagium +
//     brachial-to-body), OPAQUE dark storm-cloud, ventrally cupped + scalloped — NOT a
//     chopped fan of floating bays;
//   • richness ranks: covert flake row, spark-mote constellations, carved fork-node
//     housings, the ventral sag pockets, ONE connected knife-edge.
// Anti-reskin separation from Revenant HELD: Revenant = ivory BONE + green grave-glow +
// open ribcage; Tempest = near-white LIT LIGHTNING struts + charcoal cloud membrane, no
// bone/no green. The frame owns ~100% of the light; the membrane emits nothing.

// deterministic index jitter (never Math.random) for the spark-mote scatter
const wjit = (i, amp) => { const h = Math.sin((i + 1) * 78.233 + 2.7) * 43758.5453; return (h - Math.floor(h) - 0.5) * 2 * amp; };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ── THE SHARED STORM PRIMITIVES (one bone, three body parts, ONE creature — DRY per the head/tail
// spec). stormSpike = a kinked lightning bone: a charcoal tent (shadowed SIDES) + a WIDE near-white
// glow CAP standing proud + a silver rim-cap. It is the wing's finger-strut, the head's crown spike,
// AND the tail's flame-tongue — same primitive, so all three read as the same lightning. stormWeld =
// a small proud near-white HOUSING at a node (the carved-socket move → welded, not floating).
// push(mat, ...tris) accumulates; the caller binds the target group/accumulator.
function stormSpike(push, hs, a, b, wB, wT, lift, sideMat, glowMat, rimMat, cw = 0.76, bloomMat = null) {
  const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1, px = -dz / len, pz = dx / len;
  const aL = [a[0] + px * wB, a[1], a[2] + pz * wB], aR = [a[0] - px * wB, a[1], a[2] - pz * wB];
  const bL = [b[0] + px * wT, b[1], b[2] + pz * wT], bR = [b[0] - px * wT, b[1], b[2] - pz * wT];
  const aT = [a[0], a[1] + lift, a[2]], bT = [b[0], b[1] + lift * 0.45, b[2]];
  if (sideMat) push(sideMat, [aL, bL, bT], [aL, bT, aT], [aR, aT, bT], [aR, bT, bR]);   // shadowed charcoal sides
  const up = 0.008 * hs;
  // a tent CAP at width-fraction `f` of the strut, peaking at (pkB·lift, pkT·lift) — reused for the
  // wide dim bloom skirt and the narrow bright core so a bolt reads CORE→GLOW→DARK (the Arc Crown look).
  const cap = (mat, f, pkB, pkT, u) => {
    const caL = [a[0] + px * wB * f, a[1] + lift * pkB * 0.5 + u, a[2] + pz * wB * f], caR = [a[0] - px * wB * f, a[1] + lift * pkB * 0.5 + u, a[2] - pz * wB * f];
    const cbL = [b[0] + px * wT * f, b[1] + lift * pkT * 0.24 + u, b[2] + pz * wT * f], cbR = [b[0] - px * wT * f, b[1] + lift * pkT * 0.24 + u, b[2] - pz * wT * f];
    const caT = [a[0], a[1] + lift * pkB + u, a[2]], cbT = [b[0], b[1] + lift * pkT * 0.45 + u, b[2]];
    push(mat, [caL, cbT, caT], [caL, cbL, cbT], [caR, caT, cbT], [caR, cbT, cbR]);
    return cbT;
  };
  if (bloomMat) {
    // GLOW-UP: not a flat white strip — a RECESSED white filament in a blue haze. The bloom is WIDE and
    // LOW (fills the channel floor with blue); the core is NARROW and TAPERED and sits below the charcoal
    // wall-tops (recessed, not proud), so the wall shadows flank a bright thread → a discharge, not tape.
    cap(bloomMat, Math.min(1, cw + 0.22), 0.42, 0.18, up * 0.4);           // wide dim blue penumbra (channel floor)
    const cbT = cap(glowMat, cw * 0.42, 0.66, 0.30, up);                    // narrow bright white filament (tapers to a needle at b)
    if (rimMat) push(rimMat, [[a[0] + px * wB * cw * 0.14, a[1] + lift * 0.7 + up * 1.2, a[2] + pz * wB * cw * 0.14], cbT, [a[0] - px * wB * cw * 0.14, a[1] + lift * 0.7 + up * 1.2, a[2] - pz * wB * cw * 0.14]]);
    return;
  }
  const cbT = cap(glowMat, cw, 1.0, 1.0, up);   // legacy single wide cap (call sites that don't pass a bloom)
  if (rimMat) push(rimMat, [[a[0] + px * wB * 0.16, a[1] + lift + up * 1.5, a[2] + pz * wB * 0.16], cbT, [a[0] - px * wB * 0.16, a[1] + lift + up * 1.5, a[2] - pz * wB * 0.16]]);
}
function stormWeld(push, hs, p, r, glowMat) {
  push(glowMat, [[p[0] - r, p[1] + 0.05 * hs, p[2] - r], [p[0] + r, p[1] + 0.05 * hs, p[2] - r], [p[0], p[1] + 0.06 * hs, p[2] + r]]);
}

function buildOneStormforkWing(M, dials) {
  const hs = dials.halfSpan;
  const N = Math.max(2, Math.round(dials.struts));       // finger-struts {2,3,4,5}
  const wristT = dials.wristT ?? 0.40;                   // MEDIAL wrist → short arm, struts carry the wing
  const forkN = Math.max(0, Math.min(N, dials.forkN));   // how many OUTER struts fork near the tip
  const spur = !!dials.spur;                             // a 2nd-order spur on the outermost fork (f3)
  const cD = dials.crescentDepth ?? 1;                   // membrane ventral-billow depth

  const arm = new THREE.Group();    // short arm stub + propatagium + brachial — rides the forearm (`mid`)
  const hand = new THREE.Group();   // struts + chiropatagium — folds at the wrist (`tip`)

  // Per-(group) per-material accumulators → a handful of draws (the batching discipline).
  const accs = new Map();
  const acc = (g) => { let m = accs.get(g); if (!m) accs.set(g, m = new Map()); return m; };
  const push = (g, mat, ...tris) => { const m = acc(g); let a = m.get(mat); if (!a) m.set(mat, a = []); for (const t of tris) a.push(t); };
  const flush = (g) => { const m = accs.get(g); if (!m) return; for (const [mat, tris] of m) g.add(flatTriMesh(tris, mat)); };

  // the wing's finger-strut = the shared stormSpike (charcoal sides + M.spine, near-white glow cap,
  // silver rim); housing = the shared stormWeld. group-bound so the batcher keeps its per-group draws.
  const boltRidge = (g, a, b, wB, wT, lift, glowMat) => stormSpike((mat, ...t) => push(g, mat, ...t), hs, a, b, wB, wT, lift, M.spine, glowMat, M.silverRim, 0.72, M.arcBloom);
  const housing = (g, p, r) => stormWeld((mat, ...t) => push(g, mat, ...t), hs, p, r, M.arcCore);

  // ── THE SHORT ARM — a 2-bone stub, medial wrist K. The reference's leading frame BOWS FORWARD
  // (−Z, toward travel) across the arm to a forward-most APEX at the wrist, then the dominant strut
  // recurves AFT — a graceful swan-neck OGEE (owner: the reference has this curve; ADD it). A mid-
  // waypoint Am splits the forward bow into shallow (~7°) bends so it reads as a smooth arc, and the
  // single reversal vertex sits ONLY at the anatomical wrist knuckle, never mid-arm (no hard kink).
  const K = [wristT * hs, 0.06 * hs, -0.115 * hs];       // wrist = forward-most point (leading-edge apex) — a pronounced swan-neck
  const ROOT = [0, 0, 0], E = [0.14 * hs, 0.025 * hs, -0.05 * hs], Am = [0.30 * hs, 0.05 * hs, -0.10 * hs];
  boltRidge(arm, ROOT, E, 0.085 * hs, 0.075 * hs, 0.06 * hs, M.arcSeam);    // humerus
  boltRidge(arm, E, Am, 0.075 * hs, 0.065 * hs, 0.055 * hs, M.arcSeam);     // radius (forward bow)
  boltRidge(arm, Am, K, 0.065 * hs, 0.05 * hs, 0.05 * hs, M.arcSeam);       // → the forward wrist apex

  // ── THE FINGER-STRUTS — N kinked glowing storm-bolts fanning aft off K + drooping (Revenant
  // FAN/DROOP). Each strut = TWO straight bolt segments K→knuckle→tip: the hard KNUCKLE (the storm
  // kink) replaces Revenant's smooth bone-bow. Sampled along the kinked path so the membrane welds
  // to the bone (the C14 weld — the membrane cannot float off).
  // strut 0 recurves AFT (26°) off the forward wrist apex — the OUTER half of the ogee (with the arm's
  // forward bow it makes the reference's forward-then-back leading-edge curve). The fan rakes aft behind it.
  const FAN = [[26, 1.00], [42, 0.92], [60, 0.74], [76, 0.55], [88, 0.40]];   // [azimuth° aft off K, length× of strut 0]
  // leading strut droops LEAST (top edge bows UP, convex, like the reference); trailing struts droop most,
  // and the SPREAD is wide so the tips sit at very different heights → the SIDE profile scallops (not a slab).
  const DROOP = [0.06, 0.14, 0.22, 0.30, 0.38];   // tip drop below the wrist line, × strut length
  const D2R = Math.PI / 180, L0 = 0.92 * hs, NS = 4;
  const spars = [], forkNodes = [];
  for (let i = 0; i < N; i++) {
    const rowF = i / Math.max(1, N - 1) * (FAN.length - 1), ri = Math.min(FAN.length - 2, Math.floor(rowF)), f = rowF - ri;
    // glow-up: JITTER the fan azimuth ±3.5° and length ±7% off the even table so the rank reads as an
    // organic irregular discharge, not a metronomic comb of equal strips (owner: "flat and regular").
    const az = (FAN[ri][0] + (FAN[ri + 1][0] - FAN[ri][0]) * f) * D2R + (i === 0 ? 0 : wjit(i * 3 + 1, 3.5) * D2R);
    const L = L0 * (FAN[ri][1] + (FAN[ri + 1][1] - FAN[ri][1]) * f) * (1 + (i === 0 ? 0 : wjit(i * 3 + 5, 0.07)));
    const dr = DROOP[Math.min(N - 1, Math.round(rowF))] * L;
    const tip = [K[0] + Math.cos(az) * L, K[1] - dr, K[2] + Math.sin(az) * L];   // XZ from azimuth; Y DROOPS (ventral cup)
    // the KNUCKLE at ~58%: forward-outboard bow in XZ (convex leading edge, Revenant) + a hard Y jog
    // (alternating) = the Tempest storm kink (a stepped bone, not a smooth curve).
    const cdx = tip[0] - K[0], cdz = tip[2] - K[2], clen = Math.hypot(cdx, cdz) || 1;
    // strut 0's forward knuckle bow (0.13) SHAVES the wrist corner: it leaves the apex at only ~12° aft,
    // so the wrist bend is a soft knuckle (~19°) not a snap, and the hard aft sweep happens one joint out.
    const kn = 0.58, bow = (i === 0 ? 0.15 : 0.18) * clen, pfx = cdz / clen, pfz = -cdx / clen, yj = (i === 0 ? -0.02 : (i % 2 ? 1 : -1) * 0.05) * L;
    const Bm = [K[0] + cdx * kn + pfx * bow, K[1] + (tip[1] - K[1]) * kn + yj, K[2] + cdz * kn + pfz * bow];
    const wB = (0.055 * hs * (1 - 0.05 * i) + 0.004) * (i === 0 ? 1 : 1 + wjit(i * 3 + 9, 0.14)), wM = wB * 0.66, lift = 0.075 * hs * (1 - 0.04 * i);
    boltRidge(hand, K, Bm, wB, wM, lift, i === 0 ? M.arcCore : M.arcSeam);            // wrist → knuckle (strut 0 = brightest)
    boltRidge(hand, Bm, tip, wM, 0.008 * hs, lift * 0.7, i === 0 ? M.arcCore : M.arcSeam);   // knuckle → tip
    if (i > 0) housing(hand, Bm, 0.026 * hs * (1 - 0.06 * i));                        // carved knuckle housing (skip the leading strut → clean leading edge, less wrist clutter)
    spars.push([K, lerp3(K, Bm, 0.5), Bm, lerp3(Bm, tip, 0.5), tip]);                 // NS+1 welded samples along the kinked path
    // FORK the OUTER struts near the tip (the reference's forked branches) — a bright prong splaying aft.
    if (i >= N - forkN) {
      const fp = lerp3(Bm, tip, 0.55 + 0.14 * (wjit(i * 5 + 2, 1) * 0.5 + 0.5)), faz = az + (13 + 8 * Math.abs(wjit(i * 5, 1))) * D2R, fl = L * (0.26 + 0.08 * Math.abs(wjit(i * 5 + 4, 1)));
      const fTip = [fp[0] + Math.cos(faz) * fl, fp[1] - 0.05 * fl, fp[2] + Math.sin(faz) * fl];
      boltRidge(hand, fp, fTip, wM * 0.7, 0.006 * hs, lift * 0.6, M.arcCore);
      forkNodes.push(fp);
      if (spur && i === N - 1) {   // a 2nd-order spur off the outermost fork (f3 only)
        const sp = lerp3(fp, fTip, 0.55), saz = faz + 20 * D2R, sl = fl * 0.5;
        boltRidge(hand, sp, [sp[0] + Math.cos(saz) * sl, sp[1] - 0.04 * sl, sp[2] + Math.sin(saz) * sl], wM * 0.5, 0.005 * hs, lift * 0.5, M.arcCore);
      }
    } else if (i > 0) {
      // glow-up: EVERY inner strut (bar the clean leading strut) throws ONE short off-axis prong at a
      // jittered position/angle/width → the whole rank forks like real lightning, not a bare fan.
      const t = 0.52 + 0.22 * (wjit(i * 7 + 3, 1) * 0.5 + 0.5), pp = lerp3(K, tip, t);
      const pdir = wjit(i * 7, 1) > 0 ? 1 : -1, paz = az + pdir * (9 + 9 * Math.abs(wjit(i * 7 + 1, 1))) * D2R, pl = L * (0.13 + 0.06 * Math.abs(wjit(i * 7 + 2, 1)));
      const pTip = [pp[0] + Math.cos(paz) * pl, pp[1] - 0.035 * pl, pp[2] + Math.sin(paz) * pl];
      boltRidge(hand, pp, pTip, wM * 0.52, 0.005 * hs, lift * 0.5, M.arcSeam);
    }
  }
  for (const fn of forkNodes) housing(hand, fn, 0.026 * hs);
  const F0 = spars[0][NS];   // wingtip = strut-0 tip (the leading spar) — tip marker + FX emit point

  // ── THE CHIROPATAGIUM — ONE continuous membrane LOFTED onto the strut spar samples (Revenant's
  // weld): every membrane edge IS a bone node, so it cannot float off. Each bay sags ventrally (−Y),
  // deepest toward the free edge (the dome that cups air), and the free trailing edge scallops toward
  // the wrist. OPAQUE dark storm-cloud (boltTiers), RECESSED below the proud bright struts.
  const bayScallop = [0.34, 0.28, 0.23, 0.17], trailing = [];
  for (let i = 0; i < N - 1; i++) {
    const fa = spars[i], fb = spars[i + 1];
    const chord = Math.hypot(fb[NS][0] - fa[NS][0], fb[NS][1] - fa[NS][1], fb[NS][2] - fa[NS][2]) || 1;
    // aft bays sag DEEPER (a big per-bay differential) so the SIDE profile scallops between the
    // fingers instead of collapsing to one flat sail (gate polish #1).
    // DEEPER scallop differential (glow-up #4 de-plane): the aft bays sag much harder than the inner ones
    // so the SIDE profile scallops between fingers instead of reading as one flat sail.
    const billow = (0.15 + 0.11 * cD) * chord * (0.55 + 0.92 * (i / Math.max(1, N - 2))), scal = bayScallop[Math.min(i, 3)] * (0.6 + 0.45 * cD) * (0.9 + 0.2 * ((i * 0.618) % 1));
    const mid = [];
    for (let k = 0; k <= NS; k++) {
      const saf = k / NS, m = [(fa[k][0] + fb[k][0]) / 2, (fa[k][1] + fb[k][1]) / 2, (fa[k][2] + fb[k][2]) / 2];
      m[1] -= billow * (0.3 + 0.7 * saf);
      if (k > 0) { m[0] += (K[0] - m[0]) * scal * saf; m[1] += (K[1] - m[1]) * scal * saf * 0.4; m[2] += (K[2] - m[2]) * scal * saf; }
      mid.push(m);
    }
    // VALUE-BAND each bay (glow-up #4): not one flat dark tier — the taut ROOT catches light (lighter tier),
    // the deep ventral CUP toward the free edge falls into shadow (darker tier), + the bay gradient + a
    // little jitter → a faceted charged-cloud value field, not black cardstock.
    const vBase = i * 0.5;
    const vi = (kk, d) => M.boltTiers[Math.max(0, Math.min(3, Math.round(vBase + (kk / NS) * 1.7 + d)))];
    for (let k = 0; k < NS; k++) {
      push(hand, vi(k, -0.3 + wjit(i * 11 + k, 0.5)), [fa[k], fa[k + 1], mid[k + 1]], [fa[k], mid[k + 1], mid[k]]);   // leading half (taut, lighter)
      push(hand, vi(k, 0.9 + wjit(i * 11 + k + 50, 0.5)), [mid[k], mid[k + 1], fb[k + 1]], [mid[k], fb[k + 1], fb[k]]);   // trailing half (deep cup, darker)
    }
    if (i === 0) trailing.push(fa[NS]);
    trailing.push(mid[NS], fb[NS]);   // the scalloped distal free edge (for the knife-edge)
  }

  // ── PLAGIOPATAGIUM / BRACHIAL — the inboard membrane sweeps from the arm to a body anchor B, its
  // TRAILING edge a CONCAVE SCALLOP that CONTINUES the outboard bay scallop all the way down to the
  // body (owner: kill the straight inboard "bar" — the WHOLE trailing edge tapers/scallops from the
  // wingtip to the body, one continuous cupped line). Fan from the wrist so it's arm-side (fold-safe).
  const B = [-0.34, -0.42, 0.10], Tlast = spars[N - 1][NS];
  const bz = (a, c, b, t) => { const m = 1 - t; return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1], m * m * a[2] + 2 * m * t * c[2] + t * t * b[2]]; };
  const teMid = lerp3(Tlast, B, 0.5), teCtrl = [teMid[0] + (K[0] - teMid[0]) * 0.45, teMid[1] + (K[1] - teMid[1]) * 0.45 - 0.12 * hs, teMid[2] + (K[2] - teMid[2]) * 0.45];
  // de-plane the inboard brachial (glow-up #4: it was ONE large flat black triangle — the plane whisper).
  // Add a SAGGED mid-ring so the sheet CUPS, and value-band it: taut inner band (root, lighter) vs the deep
  // outer cup (trailing, darker), and wrist (lighter) → body-anchor (darker) — a faceted charged cloud.
  const teN = 5, tePts = [], mPts = [];
  for (let k = 0; k <= teN; k++) { const p = bz(Tlast, teCtrl, B, k / teN); tePts.push(p); const m = lerp3(K, p, 0.55); m[1] -= 0.11 * hs * (0.4 + 0.6 * (k / teN)); mPts.push(m); }
  for (let k = 0; k < teN; k++) {
    const fw = k / teN;   // 0 at the wrist side, 1 at the body anchor
    push(arm, M.boltTiers[Math.max(0, Math.min(3, Math.round(0.2 + 1.1 * fw)))], [K, mPts[k + 1], mPts[k]]);   // inner taut band (lighter)
    push(arm, M.boltTiers[Math.max(0, Math.min(3, Math.round(1.3 + 1.4 * fw)))], [mPts[k], mPts[k + 1], tePts[k + 1]], [mPts[k], tePts[k + 1], tePts[k]]);   // deep cup (darker)
  }
  push(arm, M.boltTiers[0], [ROOT, E, Am], [ROOT, Am, K], [ROOT, K, B]);                     // propatagium hugs the forward arm bow + shoulder fill
  for (let k = 1; k <= teN; k++) trailing.push(tePts[k]);                                   // continue the scalloped trailing polyline (→ knife-edge) down to the body

  // ── COVERT ROW (richness rank) — short angular flakes lapping the UPPER surface along the arm then
  // out over strut 0 (bone → covert → membrane; the layered read the rear-chase cam sees). Charcoal
  // flakes with a near-white tip fleck. On arm inboard, on hand outboard so each folds correctly.
  const covertN = dials.coverts ?? 0;
  for (let i = 0; i < covertN; i++) {
    const t = (i + 0.5) / covertN, onArm = t < 0.4, g = onArm ? arm : hand;
    const p = onArm ? lerp3(ROOT, K, t / 0.4) : lerp3(K, F0, (t - 0.4) / 0.6);
    const sd = 0.035 * hs * (0.6 + ((i * 0.53) % 1)), upf = 0.05 * hs;
    const fl0 = [p[0] - sd, p[1] + upf, p[2] - sd], fl1 = [p[0] + sd, p[1] + upf * 0.8, p[2]], fl2 = [p[0] - sd * 0.4, p[1] + upf * 0.6, p[2] + sd * 1.4];
    push(g, M.flank, [fl0, fl1, fl2]);
    push(g, M.arcSeam, [lerp3(fl0, fl2, 0.6), lerp3(fl1, fl2, 0.6), fl2]);   // near-white tip fleck
  }

  // ── SPARK-MOTE CONSTELLATIONS (richness rank) — tiny near-white flecks clinging to the outer
  // membrane (static charge on the cloud), a size-tier of a few larger "named" sparks. One mesh.
  const sparkN = dials.sparks ?? 0;
  for (let i = 0; i < sparkN && N >= 2; i++) {
    const bi = i % (N - 1), fa = spars[bi], fb = spars[bi + 1], kk = 1.5 + ((i * 0.618) % 1) * (NS - 1.5), k0 = Math.floor(kk), kf = kk - k0;
    const on = lerp3(lerp3(fa[k0], fa[Math.min(NS, k0 + 1)], kf), lerp3(fb[k0], fb[Math.min(NS, k0 + 1)], kf), 0.35 + 0.3 * ((i * 0.37) % 1));
    const c = [on[0] + wjit(i, 0.05 * hs), on[1] - 0.02 * hs + wjit(i * 3, 0.03 * hs), on[2] + wjit(i * 7, 0.05 * hs)];
    const r = (i % 5 === 2 ? 0.03 : 0.014) * hs;
    push(hand, M.arcCore, [[c[0] - r, c[1], c[2]], [c[0] + r, c[1], c[2] - r * 0.6], [c[0], c[1] + 0.02 * hs, c[2] + r]]);
  }

  // ── THE CONNECTED KNIFE-EDGE — ONE thin translucent band just inboard of the WHOLE scalloped
  // distal free edge (the wing's ONLY transparency; per-bay shards banned). Hum-lit near-white.
  if (trailing.length > 1) {
    const et = [], inb = (p) => [p[0] + (K[0] - p[0]) * 0.08, p[1] + (K[1] - p[1]) * 0.08 + 0.006 * hs, p[2] + (K[2] - p[2]) * 0.08];
    for (let s = 0; s < trailing.length - 1; s++) { const a = trailing[s], b = trailing[s + 1], ai = inb(a), bi = inb(b); et.push([a, b, bi], [a, bi, ai]); }
    push(hand, M.edgeMat, ...et);
  }

  flush(arm); flush(hand);
  return { arm, hand, K, tip: F0 };
}

function buildStormforkWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = tempestMats(def, model.glowLevel ?? 1);
  const glow = model.glowLevel ?? 1;
  const struts = glow >= 0.95 ? 5 : Math.max(2, Math.round(model.rays ?? 4));   // finger-struts {2,3,4,5}
  const halfSpan = (model.spanScale ?? 1) * 4.1;   // Revenant parity — the big, majestic span (was 2.3, owner: too small)
  const kinks = Math.max(1, Math.round(model.kinkKnuckles ?? 3));
  const forkN = glow >= 0.95 ? 2 : (kinks >= 3 ? 1 : 0);   // outer struts that fork {0,0,1,2}
  const spur = glow >= 0.95;                               // the 2nd-order spur is f3-only
  const cD = 0.7 + 0.5 * glow;                             // membrane billow depth ladders with the storm
  const coverts = Math.round(4 + 5 * glow);                // covert flakes ladder
  const sparks = Math.round(6 * glow);                     // spark motes ladder
  const dials = { struts, halfSpan, wristT: 0.40, forkN, spur, crescentDepth: cD, coverts, sparks };

  // The rig's single-material wing contract = the inboard membrane tier (OPAQUE matte cloud; the
  // rig's wingMat.opacity / wingMembraneEmissive writes are visually inert — the FRAME owns the
  // light). THE KNIFE-EDGE: hum-lit near-white translucent (the wing's only transparency).
  M.wingMat = M.boltTiers[0];
  M.edgeMat = new THREE.MeshStandardMaterial({ color: 0xc9d0e8, emissive: 0xd9deff, emissiveIntensity: M.humFloor * 0.6, flatShading: true, roughness: 0.5, metalness: 0.04, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });   // dimmer/thinner rim → cloud dominant in daylight (gate polish #2)
  M.edgeMat.envMapIntensity = 0.3; M.edgeMat.userData.baseEmissive = 0xd9deff; M.edgeMat.userData.baseIntensity = M.humFloor * 0.6;
  { const BS = 0.6, cap = 2.0 * BS, peak = Math.min(cap, M.peakFloor * cap / 2.4); M.edgeMat.userData.stormBucket = 2; M.edgeMat.userData.stormCap = cap; M.edgeMat.userData.stormRel = 0.85;   // TIPS bucket — the knife-edge rides the strike out to the wingtip
    M.edgeMat.userData.stormPeak = peak; M.edgeMat.userData.stormHum = peak * 0.13; }   // near-OFF idle hint (IDLE_HINT) — the crackle/surge is the event

  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    const rootC = attach.wingRoot(1);   // build CANONICAL right; left is an outer lmirror wrapper
    const pivot = new THREE.Group(); pivot.position.set(rootC.x, rootC.y, rootC.z); pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    const { arm, hand, K, tip: F0 } = buildOneStormforkWing(M, dials);
    mid.add(arm);                            // short arm + propatagium + brachial ride the forearm
    tip.position.set(K[0], K[1], K[2]);      // wrist fold axis = the medial wrist K (struts + membrane fold here)
    hand.position.set(-K[0], -K[1], -K[2]);  // −anchor → assembled REST pose byte-identical
    tip.add(hand);
    if (side === -1) { const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(pivot); group.add(lmirror); }
    else group.add(pivot);
    const s = side === 1 ? 'R' : 'L';
    // Tip marker — the wingtip (strut-0 tip F0), tracked through the wrist fold (FX emit point).
    const marker = new THREE.Object3D(); marker.position.set(F0[0], F0[1], F0[2]); hand.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip; pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * F0[0], root.y + F0[1], root.z + F0[2]], length: halfSpan, tipObj: marker });
  }
  // flareMats = the wing's hum-lit near-white GARMENT (strut frame + knife-edge) — held at humFloor by
  // the flare loop's else-branch in cruise, Surge-flared, warm-rim-exempt. The I4 storm tick takes
  // over as the single writer (breathing + strikes). NOT in spineMats (that gets the warm rim).
  return { group, spineMats: [], stormArcMats: [M.arcSeam, M.arcCore, M.arcBloom, M.edgeMat], wingMat: M.wingMat,
    parts: { ...pivots, wingElements } };
}
registerWings('stormforkWings', buildStormforkWings);

// ── HEAD: 'stormbrowHead' — the Stormcrown (I3) ────────────────────────────────
// A sleek ELONGATED angular charcoal skull (value-banded knapped wedge, hard dorsal chine — NOT a
// blunt ram-prow, NOT a round cat-head), with the HERO: a fanned CROWN of swept-back near-white
// lightning SPIKES off the occiput (the same stormSpike as the wing struts — one creature), a
// carved socketed near-white almond EYE, a closed sleek maw (carved mouth-line, no fangs), cheek
// facet plates, nostril pits, and the near-white nape MANE continuing the body's spine circuit.
// Glow ONLY on raised components (spike caps / eye / mane blades) — zero emissive on the skull loft.
function buildStormbrowHead(def, model, mats) {
  const group = new THREE.Group();
  const M = tempestMats(def, model.glowLevel ?? 1);
  const hs = model.headScale ?? 1;
  const glow = model.glowLevel ?? 1;
  const eyeMat = mats.eyeMat;
  const byMat = new Map();
  const push = (mat, ...tris) => { let a = byMat.get(mat); if (!a) byMat.set(mat, a = []); for (const t of tris) a.push(t); };

  // ── THE SKULL — an elongated angular wedge (−Z), VALUE-BANDED per column (top spine / flanks
  // flank / underside dorsal) so flat-shading reads it knapped, not a smooth balloon. The single
  // biggest fix over the stub's mono-mat "warm-looking" broad top.
  // Heavier skull + jaw mass + a shorter muzzle so the front end matches the new compact body
  // (Fable polish: the head/neck was the last slightly-lean element).
  const skull = [
    { z: 0.34, rx: 0.18 * hs, ry: 0.22 * hs, cy: 0.06 },   // occiput (crown roots here)
    { z: 0.06, rx: 0.23 * hs, ry: 0.21 * hs, cy: 0.05 },   // brow (heavy, widest; hard chine)
    { z: -0.16, rx: 0.18 * hs, ry: 0.16 * hs, cy: 0.02 },  // eye-ridge / cheek shelf
    { z: -0.42, rx: 0.15 * hs, ry: 0.14 * hs, cy: -0.02 }, // cheek / jowl (full)
    { z: -0.72, rx: 0.10 * hs, ry: 0.095 * hs, cy: -0.05 }, // muzzle (shorter, thicker)
    { z: -0.92, rx: 0.05 * hs, ry: 0.055 * hs, cy: -0.06 }, // blunt angular tip
  ];
  const N = OCTA.length, SP = (s, k) => [OCTA[k][0] * s.rx, s.cy + OCTA[k][1] * s.ry, s.z];
  const band = (k) => (OCTA[k][1] > 0.5 ? M.spine : OCTA[k][1] < -0.5 ? M.dorsal : M.flank);
  for (let i = 0; i < skull.length - 1; i++) { const a = skull[i], b = skull[i + 1];
    for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; push(band(k), [SP(a, k), SP(b, k1), SP(b, k)], [SP(a, k), SP(a, k1), SP(b, k1)]); } }
  { const f = skull[0], l = skull[skull.length - 1], fc = [0, f.cy, f.z], lc = [0, l.cy, l.z];
    for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; push(M.spine, [fc, SP(f, k1), SP(f, k)]); push(M.dorsal, [lc, SP(l, k), SP(l, k1)]); } }
  const headLength = 1.35 * hs;

  // ── THE LOWER JAW — a slim closed wedge slung under the cranium (a sleek maw, no fangs) with a
  // thin dark MOUTH-LINE recess between it and the skull (one carved seam step).
  const jaw = [[0, -0.02 * hs, 0.10], [0, -0.05 * hs, -0.44], [0, -0.06 * hs, -0.80], [0, -0.06 * hs, -1.00]];
  for (let i = 0; i < jaw.length - 1; i++) { const a = jaw[i], b = jaw[i + 1], w = (0.10 - 0.02 * i) * hs, wb = (0.09 - 0.02 * i) * hs;
    push(M.dorsal, [[a[0] - w, a[1], a[2]], [b[0] + wb, b[1], b[2]], [b[0] - wb, b[1], b[2]]], [[a[0] - w, a[1], a[2]], [a[0] + w, a[1], a[2]], [b[0] + wb, b[1], b[2]]]);
    push(M.recess, [[a[0] - w, a[1] + 0.03 * hs, a[2]], [b[0] - wb, b[1] + 0.03 * hs, b[2]], [b[0] - wb, b[1], b[2]]], [[a[0] + w, a[1] + 0.03 * hs, a[2]], [b[0] + wb, b[1], b[2]], [b[0] + wb, b[1] + 0.03 * hs, b[2]]]); }   // dark mouth-line seam

  // ── THE DORSAL CHINE — a rank of raised charcoal facet-scutes down the head-top centerline
  // (brow→nose): breaks the broad smooth top into knapped facets so it doesn't catch the warm
  // key-light as one continuous sheen band (the residual "tan band"), and gives a hard chine + a rank.
  const topY = (z) => { for (let i = 0; i < skull.length - 1; i++) { const p = skull[i], q = skull[i + 1]; if (z <= p.z && z >= q.z) { const t = (p.z - z) / (p.z - q.z || 1); return (p.cy + p.ry) + ((q.cy + q.ry) - (p.cy + p.ry)) * t; } } const l = skull[skull.length - 1]; return l.cy + l.ry; };
  for (let i = 0; i < 10; i++) { const t = i / 9, z = 0.335 - t * 1.29, yT = topY(z), hw = (0.05 - 0.03 * t) * hs, h = (0.032 - 0.016 * t) * hs, mat = i % 2 ? M.dorsal : M.spine;
    const bl = [-hw, yT - 0.006 * hs, z - 0.03], br = [hw, yT - 0.006 * hs, z - 0.03], pk = [0, yT + h, z + 0.02];
    push(mat, [bl, br, pk], [bl, pk, [-hw * 0.5, yT + h * 0.4, z + 0.05]], [br, [hw * 0.5, yT + h * 0.4, z + 0.05], pk]);
    push(M.recess, [bl, [-hw, yT - 0.02 * hs, z + 0.05], br]); }

  // ── THE CROWN (the hero) — swept-back glowing storm-spikes off the occiput; ladder 0/2/4/6.
  // Each = the shared stormSpike (charcoal sides + near-white cap + silver rim), kinked at a
  // knuckle, tip on arcCore (brightest), welded into the skull with stormWeld. Inner pairs tallest
  // + arcCore-glow, outer pairs shorter + arcSeam + splayed wider — a value ladder = depth, not a comb.
  // Blades stand PROUD (rise near-vertical off the dome, THEN sweep back) as a bold fan of distinct
  // blades — the tall inner pair dominant — not a flat thicket along the neck (gate polish).
  const crownN = Math.round(model.maneSpikes ?? 6), HT = [0.34, 0.26, 0.19], AZ = [8, 22, 36];
  for (let p = 0; p < Math.floor(crownN / 2); p++) {
    const h = HT[Math.min(p, 2)] * hs, azd = AZ[Math.min(p, 2)] * Math.PI / 180, glowMat = p === 0 ? M.arcCore : M.arcSeam, w = (0.05 - 0.009 * p) * hs;
    for (const side of [1, -1]) {
      const bx = side * (0.03 + 0.03 * p) * hs, base = [bx, 0.15 * hs, 0.30 * hs];
      const tip = [bx + side * Math.sin(azd) * h, base[1] + h, base[2] + 0.16 * hs];                 // rise (+Y) then a MODEST back-sweep (+Z)
      const Bm = [bx + side * Math.sin(azd) * h * 0.35, base[1] + h * 0.6, base[2] + 0.02 * hs];      // knuckle risen near-vertical, barely back
      stormSpike(push, hs, base, Bm, w, w * 0.72, 0.02 * hs, M.spine, glowMat, M.silverRim, 0.76, M.arcBloom);
      stormSpike(push, hs, Bm, tip, w * 0.72, 0.005 * hs, 0.015 * hs, M.spine, M.arcCore, M.silverRim, 0.76, M.arcBloom);   // tip segment brightest
      stormWeld(push, hs, base, w * 1.2, glowMat);   // welded into the crown, never a floating antenna
    }
  }

  // ── THE CARVED EYE SOCKET + almond eye (the Revenant orbit law: glow from within a housing).
  // socket lip is CHARCOAL (M.dorsal) so the EYE is the only bright thing in the housing; the ember
  // sits at the socket MOUTH (forward + up), clipped by the lip but NOT swallowed by the deep floor.
  const eyeSocket = (cx, cy, cz, r) => { const nR = 6, rim = [], lip = [];
    for (let k = 0; k < nR; k++) { const a = (k / nR) * Math.PI * 2; rim.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz]); lip.push([cx + Math.cos(a) * r * 1.28, cy + Math.sin(a) * r * 1.05, cz - 0.02 * hs]); }
    const floor = [cx, cy, cz + r * 0.7];   // SHALLOW cup — the ember reads, never swallowed
    for (let k = 0; k < nR; k++) { const k1 = (k + 1) % nR; push(M.socketFloor, [rim[k], rim[k1], floor]); push(M.dorsal, [rim[k], lip[k1], lip[k]], [rim[k], rim[k1], lip[k1]]); } };
  eyeMat.emissiveIntensity = 0.7 + 1.6 * glow;
  for (const side of [1, -1]) {
    const cx = side * 0.135 * hs, cy = 0.06 * hs, cz = -0.14 * hs;
    eyeSocket(cx, cy, cz, 0.06 * hs);
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.09 * hs, 0), eyeMat);   // a real bright lozenge, not a pinprick
    eye.scale.set(1.4, 0.7, 1); eye.rotation.y = -side * 0.25;   // almond slit, toed-in forward
    eye.position.set(side * 0.155 * hs, cy, cz - 0.04 * hs); eye.renderOrder = 3;   // PROUD of the narrow skull side (was buried inside), at the socket mouth
    group.add(eye);
  }

  // ── RANKS: cheek/brow facet plates (angularity) + nostril pits (a second carved void).
  for (const side of [1, -1]) {
    addArmorPlate(push, M, [side * 0.16 * hs, 0.10 * hs, 0.0], [side * 0.7, 0.5, 0], [0, 0, 1], 0.06 * hs, 0.10 * hs, M.flank);
    addArmorPlate(push, M, [side * 0.12 * hs, 0.0, -0.34 * hs], [side * 0.7, 0.3, 0], [0, 0, 1], 0.05 * hs, 0.09 * hs, M.flank);
    const nx = side * 0.05 * hs, ny = -0.05 * hs, nz = -0.9 * hs, r = 0.02 * hs;   // nostril pit
    push(M.socketFloor, [[nx - r, ny, nz], [nx + r, ny, nz], [nx, ny + r * 0.5, nz + r * 1.4]]);
  }

  // ── THE NAPE MANE — the near-white lightning mane runs down the THROAT/lower-neck SIDES (continues
  // the body's spine circuit), kept OFF the crown-top so it never crowds the crown base (gate polish).
  for (const side of [1, -1]) {
    const zig = []; for (let i = 0; i <= 5; i++) { const t = i / 5; zig.push([side * (0.06 + 0.02 * (i % 2)) * hs, (-0.02 - 0.06 * t) * hs, (0.26 - t * 0.5) * hs]); }
    addRibbon(push, M.arcSeam, zig, 0.014 * hs, 0.008 * hs);
  }

  for (const [mat, tris] of byMat) group.add(flatTriMesh(tris, mat));
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.set(0, 0.16 * hs, 0.20 * hs); group.add(motifAnchor);
  // flareMats = the crown/mane near-white garment (hum-lit); the eye is EXCLUDED (the fever firewall).
  return { group, spineMats: [], stormArcMats: [M.arcSeam, M.arcCore, M.arcBloom, M.crest], motifAnchor, headLength };
}
registerHead('stormbrowHead', buildStormbrowHead);

// ── TAIL: 'virgaTail' — the storm-stem + the lightning-flame BOLT-TUFT (I3) ─────
// A long faceted charcoal storm-stem on the isBone 4-joint chain, carrying a glowing near-white
// dorsal CREST FRINGE (serrated silhouette the rear-chase sees) + flank scutes, terminating in the
// HERO: a radial near-white lightning-flame BOLT-TUFT (faceted flame-tongues erupting from a socketed
// core node — the point of light the chase cam tracks). Same stormSpike as the wing/crown — one storm.
function buildVirgaTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  const M = tempestMats(def, model.glowLevel ?? 1);
  const glow = model.glowLevel ?? 1;
  const a = anchor ?? { y: 0.12, z: 1.62 };
  const T = (model.tailLength ?? 1) * 2.5 * (model.tailStretch ?? 1);
  const nSeg = Math.round(model.tailSegments ?? 8);
  // glow-up #3 (mass): the tail read as a thin thread under giant wings. Beef the stem ~1.4× and hold mass
  // longer (lower falloff exponent) so the body carries real silhouette PAST the wing roots — a muscular
  // storm-tail, not a rope — while the tip still tapers to a shoulder for the tuft.
  const rAt = (t) => 0.152 * Math.pow(1 - t * 0.80, 0.60) + 0.012;
  const curveY = (t) => -0.05 * T * Math.sin(Math.PI * t * 0.9);   // low counter-drop then flick
  const stem = [];
  for (let i = 0; i <= nSeg; i++) { const t = i / nSeg; stem.push({ z: a.z + t * T, rx: rAt(t), ry: rAt(t), cy: a.y + curveY(t) }); }

  // 4-joint NESTED isBone chain (verbatim splitFan pattern): every piece is
  // position-compensated by −anchor so the assembled REST pose is byte-identical.
  const nChain = 4;
  const jIdx = (j) => Math.min(nSeg, Math.round(j * nSeg / nChain));
  const jAnchor = (j) => { const s = stem[jIdx(j)]; return { x: 0, y: s.cy, z: s.z }; };
  const joints = [];
  { let parent = group, prev = { x: 0, y: 0, z: 0 };
    for (let j = 0; j < nChain; j++) { const an = jAnchor(j); const sg = new THREE.Group(); sg.name = 'tempestTailPivot' + j; sg.position.set(an.x - prev.x, an.y - prev.y, an.z - prev.z); parent.add(sg); joints.push(sg); parent = sg; prev = an; } }
  joints[0].isBone = true;   // drive by ROTATION only (position writes tear a connected loft)
  const jointOf = (z) => { for (let j = nChain - 1; j >= 0; j--) if (z >= jAnchor(j).z - 1e-6) return j; return 0; };
  const chainAdd = (z, mesh) => { const j = jointOf(z), an = jAnchor(j); mesh.position.set(-an.x, -an.y, -an.z); joints[j].add(mesh); return mesh; };
  // per-(joint,material) accumulator → one mesh per joint per mat, all binned via chainAdd (whip-safe).
  const perJ = [];
  const pushJ = (z, mat, ...tris) => { const j = jointOf(z); let m = perJ[j]; if (!m) perJ[j] = m = new Map(); let arr = m.get(mat); if (!arr) m.set(mat, arr = []); for (const t of tris) arr.push(t); };
  const spikeJ = (z, p0, p1, wB, wT, lift, sideMat, glowMat) => stormSpike((mat, ...t) => pushJ(z, mat, ...t), 1.0, p0, p1, wB, wT, lift, sideMat, glowMat, M.silverRim, 0.76, M.arcBloom);

  for (let j = 0; j < nChain; j++) { const i0 = jIdx(j), i1 = jIdx(j + 1); if (i1 > i0) chainAdd(stem[i0].z, tubeLoft(stem.slice(i0, i1 + 1), M.flank, false)); }

  const sampleStem = (t) => { const f = t * nSeg, i = Math.min(nSeg - 1, Math.floor(f)), k = f - i, s0 = stem[i], s1 = stem[i + 1]; return { z: s0.z + (s1.z - s0.z) * k, cy: s0.cy + (s1.cy - s0.cy) * k, r: s0.rx + (s1.rx - s0.rx) * k }; };

  // ── RANK: the dorsal CREST FRINGE — a descending rank of glowing near-white crest blades down the
  // top of the stem (the serrated silhouette + the reference's glowing tail crest), each with a dark
  // under-gap recess. Continues the body's spine circuit aft. Binned per joint (whips with the tail).
  // The SAME lightning-rod vane rank as the torso back, continued down the tail — tall alternating
  // charcoal bolt-blades with a near-white cap + silver rim, RAMPED DOWN toward the tuft (hero
  // hierarchy: the fringe leads the eye to the burst, never competes). This is what turns the "rope"
  // into a spined storm-tail (art-director note).
  const fringeN = Math.max(4, Math.round(5 + 6 * glow));
  for (let i = 0; i < fringeN; i++) { const t = 0.04 + 0.80 * (i / (fringeN - 1)), s = sampleStem(t),
    taper = t > 0.55 ? Math.max(0.16, 1 - (t - 0.55) / 0.45 * 0.9) : 1,   // ramp DOWN over the last stretch → hands off to the tuft
    alt = (i % 2 === 0), H = (alt ? 0.15 : 0.085) * (0.6 + 0.4 * glow) * taper + 0.015, foot = 0.05 * taper + 0.02, yTop = s.cy + s.r * 0.9,
    glowMat = (i % 3 === 0) ? M.arcCore : M.crest;
    spikeJ(s.z, [0, yTop, s.z - foot * 0.35], [0, yTop, s.z + foot], 0.02 * taper + 0.008, 0.004, H, M.spine, glowMat);
    pushJ(s.z, M.recess, [[-0.02, yTop - 0.012, s.z + foot * 0.5], [0.02, yTop - 0.012, s.z + foot * 0.5], [0, yTop - 0.012, s.z - foot * 0.35]]); }

  // ── RANK: flank scute cards — small cupped charcoal cards down each flank (alternating value), a
  // dark shadow gap under each so the stem isn't a bare tube. Binned per joint.
  for (let i = 0; i < fringeN; i++) { const t = 0.08 + 0.78 * (i / (fringeN - 1)), s = sampleStem(t);
    for (const side of [1, -1]) { const cx = side * s.r * 0.85, tip = [cx + side * 0.03, s.cy, s.z + 0.02], bl = [cx - side * 0.01, s.cy + 0.03, s.z - 0.03], br = [cx - side * 0.01, s.cy - 0.03, s.z - 0.03];
      pushJ(s.z, i % 2 ? M.flank : M.spine, [bl, tip, br]); pushJ(s.z, M.recess, [bl, br, [cx - side * 0.03, s.cy, s.z - 0.05]]); } }

  // ── THE HERO — the lightning-flame BOLT-TUFT: a radial spray of faceted flame-tongues erupting
  // from a socketed core at the stem tip. Each tongue is the shared stormSpike INVERTED (arcSeam
  // body + arcCore tip, thin M.spine underside for a facet shadow), splayed in X AND Y + kinked, odd
  // count with ONE dominant center tongue — the point of light. Cool near-white only (no green/warm).
  // Scaled up ~1.8x so the tuft is the single brightest/largest event on the tail (the point of light
  // the chase cam tracks) — it must OUT-shine its own fringe from every glide angle (gate: hero dominance).
  const tip = stem[nSeg], tb = [0, tip.cy, tip.z], tScale = 0.5 + 0.8 * glow, tuftN = Math.max(5, Math.round(4 + 4 * glow));   // glow-up #6: a FULLER splay (was sparse from the chase cam) — broad tongues, more of them
  // socket lip at the tuft base (a bigger housing the tongues erupt from)
  { const nR = 6, r = 0.07 * (0.7 + 0.4 * tScale); const rim = [], lip = [];
    for (let k = 0; k < nR; k++) { const ang = (k / nR) * Math.PI * 2; rim.push([tb[0] + Math.cos(ang) * r, tb[1] + Math.sin(ang) * r, tb[2]]); lip.push([tb[0] + Math.cos(ang) * r * 1.25, tb[1] + Math.sin(ang) * r * 1.05, tb[2] - 0.03]); }
    const floor = [tb[0], tb[1], tb[2] - r * 1.2];
    for (let k = 0; k < nR; k++) { const k1 = (k + 1) % nR; pushJ(tb[2], M.socketFloor, [rim[k], rim[k1], floor]); pushJ(tb[2], M.flank, [rim[k], lip[k1], lip[k]], [rim[k], rim[k1], lip[k1]]); } }
  for (let i = 0; i < tuftN; i++) {
    const isC = i === 0, ang = (i / tuftN) * Math.PI * 2 + 0.4;
    const L = (isC ? 0.55 : 0.26 + 0.30 * ((i * 0.61) % 1)) * tScale, outR = isC ? 0.05 : 0.66;   // shorter + varied → broad flame-tongues, not needles
    const dir = [Math.cos(ang) * outR, 0.32 + Math.sin(ang * 1.3) * 0.5, 0.66], dl = Math.hypot(dir[0], dir[1], dir[2]);
    const tt0 = [tb[0] + dir[0] / dl * L, tb[1] + dir[1] / dl * L, tb[2] + dir[2] / dl * L];
    const curl = 0.16 * L, tt = [tt0[0] + Math.cos(ang + 1.6) * curl, tt0[1] + 0.05 * L, tt0[2] + Math.sin(ang + 1.6) * curl * 0.5];   // a stronger flame CURL (a licking tongue)
    const kn = 0.42, Bm = [tb[0] + (tt[0] - tb[0]) * kn + Math.cos(ang) * 0.12 * L, tb[1] + (tt[1] - tb[1]) * kn + 0.05 * L, tb[2] + (tt[2] - tb[2]) * kn];   // the flame BELLY (low, where the tongue is widest)
    const w = (isC ? 0.14 : 0.11) * (0.7 + 0.4 * tScale);   // BROADER still (Fable: tips read too pointy/bladey)
    spikeJ(tb[2], tb, Bm, w * 0.72, w, 0.012, M.spine, M.arcSeam);   // narrow root → WIDE belly (a leaf/flame)
    spikeJ(tb[2], Bm, tt, w, w * 0.28, 0.008, M.spine, M.arcCore);   // belly → a ROUNDED broad tip (not a needle point), arcCore brightest
  }
  // the ignition CORE node behind the lip (heartCore — the brightest tuft point). Glow-up #6: BIGGER +
  // an always-on soft glow SHELL around it, so the tuft is a hero POINT OF LIGHT the chase cam tracks
  // from every glide angle (the tuft was reading as a sparse splay with no anchor).
  const jt = jointOf(tb[2]), ja = jAnchor(jt);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.10 * (0.7 + 0.5 * tScale), 0), M.heartCore);
  core.position.set(0, 0, 0); chainAdd(tb[2], core).position.set(tb[0] - ja.x, tb[1] - ja.y, tb[2] - ja.z);
  // soft halo shell — a larger, dim, always-lit near-white bloom source (unticked) so the point glows in cruise too
  const halo = new THREE.Mesh(new THREE.OctahedronGeometry(0.185 * (0.7 + 0.5 * tScale), 2),   // detail 2 → a rounded glow, not a hard diamond
    new THREE.MeshBasicMaterial({ color: 0xe8ecff, transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: true }));
  chainAdd(tb[2], halo).position.set(tb[0] - ja.x, tb[1] - ja.y, tb[2] - ja.z);

  // flush every joint's accumulated ranks into one mesh per (joint, material), binned via chainAdd.
  for (let j = 0; j < nChain; j++) { const m = perJ[j]; if (!m) continue; for (const [mat, tris] of m) chainAdd(jAnchor(j).z, flatTriMesh(tris, mat)); }

  return { group, segs: joints, stormArcMats: [M.crest, M.arcSeam, M.arcCore, M.arcBloom] };
}
registerTail('virgaTail', buildVirgaTail);
