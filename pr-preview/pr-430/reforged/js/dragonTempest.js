import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// THUNDERHEAD TEMPEST — "The gathering storm" (TEMPEST-THUNDERHEAD-BUILDSHEET.md).
// A living-thundercloud storm drake: billowed CHARCOAL cloud-mass (L 0.20–0.26,
// never black) with diffuse silver-lining rims, a branching near-white STORM
// CIRCUIT that flickers in short live strikes on the pulseTimer clock ("Vesper
// withholds; Tempest THREATENS"), and — the HERO — THE STORMFORK (§D): a wing whose
// skeleton IS a frozen branching lightning bolt (a gull ARCH with 3 kink-knuckles +
// a Y-fork, the circuit's own f2/f3 branches riding the bolt-ridge crests).
// Growth verb: CHARGING. Motif anchor: the sternum dynamo storm-heart. NOT a Vesper
// (charcoal ≥0.20, not black), NOT a Revenant (no bone / cage / lantern / bat-membrane
// — §C.3 anti-reskin guard). Assembly family: billowed/faceted — the smooth-hull
// organism family is a FORBIDDEN import (asserted in tests/starters.mjs §B.8).
//
// Four self-registering, default-off builders (names per the build task):
//   cumulonimbusTorso · stormforkWings · stormbrowHead · virgaTail
// They reuse the dragonVesper.js / dragonRevenant.js PATTERNS (value-band loft, the
// −anchor tail chain, the outer lmirror wing wrapper, the mats factory) with FRESH
// geometry. Axis: head/forward −Z, tail/rear +Z, right +X, up +Y; torso baseline y≈0.15.
//
// BUILD STATE: I0 = STUB. All four builders are minimal charcoal-cloud PLACEHOLDERS
// that satisfy the flap/attach contract (so tricount / dragonstudio / the roster stay
// green and byte-identical) — NO real weather geometry yet. The real parts land per
// §B.7 / §D:  I1 cumulonimbusTorso + the STORM-HEART · I2 stormforkWings (the HERO,
// §D) · I3 stormbrowHead + virgaTail · I4 the STORM CIRCUIT + strikes + Surge +
// the fever firewall · I5 the CHARGING ladder + tests/starters.mjs.
// Everything here is written so I1+ flesh GEOMETRY without rewiring the contract.
// The shared strike clock (js/pulseTimer.js) and ?strikePin already exist (I0).
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
const CLOUD_FLOOR = 0x070a12;

// OWNER-REFERENCE-DRIVEN (reference/tempest-owner-reference.png; the owner-reference-wins
// law, DRAGON-DESIGN §3): the Tempest is NOT a cloud-mass — it is a sleek dark-scaled storm
// DRAKE with a TWO-VALUE body: a near-black charcoal dorsal shell (camouflaged into the storm
// sky) over a BLAZING white-blue EMISSIVE underbelly, a chevron lightning seam where the two
// meet, dark bolt-glyphs knocked out of the glow, a white crest, four legs, and a glowing tail
// tuft. The billowed cloud clover-loft was WRONG at the primitive level and is deleted.
function tempestMats(def) {
  const base = def.body ?? FLANK;                         // per-form charcoal (darkens up the ladder)
  const std = (color, opts = {}) => { const m = new THREE.MeshStandardMaterial({ color, emissive: opts.emissive ?? CLOUD_FLOOR, emissiveIntensity: opts.ei ?? 1.0, flatShading: true, roughness: opts.rough ?? 0.82, metalness: opts.metal ?? 0.03, side: THREE.DoubleSide, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, depthWrite: opts.depthWrite ?? true }); m.envMapIntensity = 0.2; return m; };
  // The DORSAL SHELL — near-black charcoal scale skin (three facet steps for the flat-shaded
  // scale read; the darkest spine, a mid flank, a lit-facet step). The dorsal is SUPPOSED to
  // read dark (it camouflages into the storm sky) — the LIGHT is the emissive belly, not a
  // lifted charcoal (the I1 value tension dissolves: dark dorsal is correct).
  const spine = std(lerpHex(base, 0x05070c, 0.28));       // darkest dorsal ridge
  const dorsal = std(base);                               // the bodyMat the rig ticks
  const flank = std(lerpHex(base, 0x5a6472, 0.34));       // lit flank facet step (cool grey)
  // THE STORM-LIT UNDERBELLY — the identity, as a blue-lavender GRADIENT (gate r3 fix #2: the flat
  // 0xe4ecff@2.6 clipped to pure white, B−R 4 = house-paint; the reference belly is blue-lavender
  // B−R 35–70 with a bright-core→dim-edge falloff). Three tiers, intensities kept BELOW the ACES
  // channel-clip so the blue survives: core (chest), mid, dim edge. Diffuse a mid blue so unlit
  // parts aren't white. ALWAYS ON in cruise (the reference glows continuously — the owner reference
  // overrides the "withheld/intermittent" sheet prose). In flareMats (Surge-flared, warm-rim-exempt).
  const mkBelly = (col, ei) => { const m = std(0x556aa8, { emissive: col, ei, rough: 0.55, metal: 0 }); m.userData.baseEmissive = col; m.userData.baseIntensity = ei; m.userData.flareIntensityWeight = 0.45; return m; };
  // Intensities kept LOW so ACES doesn't desaturate the emissive to white (the channel-clip law,
  // §C.11): a bright blue emissive tonemaps toward white, so the PANEL stays dim-enough to hold its
  // blue and the small storm-heart core (emissive 3.0) is the only near-white hot-spot. In-game
  // bloom re-brightens the panel without re-whitening the hue.
  const bellyCore = mkBelly(0x9ab0f4, 1.2);   // chest centre (B−R 90)
  const bellyMid = mkBelly(0x6f8cf0, 0.95);   // saturated storm-blue body (B−R 129 — pushed hard so it survives the ACES highlight desaturation)
  const bellyEdge = mkBelly(0x5570cc, 0.78);  // deep blue flank/aft edge (B−R 119) — the falloff
  // THE BOLT GLYPHS — dark facets knocked OUT of the glow (a diagonal lightning slash in the panel).
  const bolt = std(lerpHex(base, 0x3a4250, 0.5), { emissive: 0x05070c });
  // THE NECK CREST — back-swept white-blue emissive blades (one step under the belly core).
  const crest = std(0x9aa6d0, { emissive: 0xc7d3fb, ei: 1.5, rough: 0.5, metal: 0 });
  crest.userData.baseEmissive = 0xc7d3fb; crest.userData.baseIntensity = 1.5; crest.userData.flareIntensityWeight = 0.4;
  // THE STORM-HEART core — the brightest ventral point at the sternum, on the coreGlow hook
  // (transparent → the rig breathes its opacity on boost/Surge). Bright in cruise (the reference
  // chest is the hottest spot), blazes on Surge.
  const heartCore = std(0xd9deff, { emissive: 0xf2f4ff, ei: 3.0, rough: 0.4, metal: 0, transparent: true, opacity: 0.85, depthWrite: false });
  heartCore.userData.baseEmissive = 0xf2f4ff; heartCore.userData.baseIntensity = 3.0;
  // CARVED-DEPTH tiers (the Revenant richness trick mine lacked): a near-black RECESS wall (gutter
  // seams between plates, under-scute strips, plate standoff gaps) + an even darker SOCKET FLOOR (the
  // storm-heart orbit interior). Dark floor + lit rim = the "crafted, not smooth" read. Non-emissive.
  const recess = std(lerpHex(base, 0x000000, 0.55), { emissive: 0x000000, rough: 0.9 });
  const socketFloor = std(0x05070c, { emissive: 0x000000, rough: 0.95 });
  return { spine, dorsal, flank, bellyCore, bellyMid, bellyEdge, bolt, crest, heartCore, recess, socketFloor };
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
function bellyTier(M, i, k) { const lvl = Math.min(Math.abs(k - 5), 3) + Math.abs(i - 4) * 0.6; return lvl < 0.7 ? M.bellyCore : lvl < 2.2 ? M.bellyMid : M.bellyEdge; }

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
  const zTop = stations[1].z, zEnd = stations[stations.length - 2].z;   // skip the very nose/tail tips
  const sample = (z) => { for (let j = 0; j < stations.length - 1; j++) { const a = stations[j], b = stations[j + 1]; if (z >= a.z && z <= b.z) { const t = (z - a.z) / (b.z - a.z || 1); return { x: 0, y: (a.cy + a.ryU) + ((b.cy + b.ryU) - (a.cy + a.ryU)) * t, w: (a.rx + (b.rx - a.rx) * t) }; } } const l = stations[stations.length - 1]; return { x: 0, y: l.cy + l.ryU, w: l.rx }; };
  for (let u = 0; u < count; u++) {
    const t = u / (count - 1), z = zTop + (zEnd - zTop) * t;
    const at = sample(z), fr = 0.9 - 0.5 * t;               // shrink aft
    if (z < -0.95) {   // NECK/WITHERS → an emissive crest blade (kinked, swept back)
      const len = 0.24 * fr + 0.06, cant = (u % 2 ? 1 : -1) * 0.035;
      const r0 = [cant - 0.03, at.y, z], r1 = [cant + 0.03, at.y, z];
      const kink = [cant, at.y + len * 0.55, z + 0.09], tip = [cant, at.y + len * 0.4, z + len * 0.95];
      push(M.crest, [r0, kink, r1], [r1, kink, tip], [r0, tip, kink]);
    } else {           // BACK → a peaked charcoal scute (a raised tent-plate) with a dark under-gap
      const hw = 0.05 * fr + 0.02, h = 0.09 * fr + 0.03, back = 0.05;
      const bl = [-hw, at.y - 0.01, z - 0.04], br = [hw, at.y - 0.01, z - 0.04];
      const peak = [0, at.y + h, z + back];
      push(M.spine, [bl, br, peak]);                        // the lit scute roof (two faces)
      push(M.spine, [bl, peak, [-hw * 0.6, at.y + h * 0.4, z + back + 0.04]], [br, [hw * 0.6, at.y + h * 0.4, z + back + 0.04], peak]);
      push(M.recess, [bl, [-hw, at.y - 0.02, z + 0.05], br], [br, [-hw, at.y - 0.02, z + 0.05], [hw, at.y - 0.02, z + 0.05]]);   // dark under-strip (the recess gap)
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
  const off = 0.02, cup = 0.03;
  const fore = P(-len, 0, off), aft = P(len, 0, off + 0.01), l = P(0, -halfW, off + cup), rr = P(0, halfW, off + cup);
  push(mat, [fore, l, rr], [aft, rr, l]);                   // the cupped plate (2 faces)
  push(M.recess, [P(-len, -halfW, 0), fore, P(-len, halfW, 0)]);   // a dark fore-edge gap (standoff shadow)
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
    const tip = P(len, 0, 0.008), bl = P(-len * 0.4, -wid, 0.028), br = P(-len * 0.4, wid, 0.028);
    push(u % 2 ? M.flank : M.dorsal, [bl, tip, br]);        // a cupped scale card, proud of the hull
  }
}

// R6 — a real drake LEG: a lofted teardrop THIGH → knee knuckle → shank → ankle → 4-tri pyramid
// TALONS + a hip cowl plate. Kills the stick-limb / single-tri-claw failure. Static (the legs hang).
function addLeg(push, M, rootX, rootY, rootZ, side, len, fwd) {
  const seg = (x0, y0, z0, r0, x1, y1, z1, r1, mat, sides = 6) => {
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2, a1 = ((k + 1) / sides) * Math.PI * 2;
      const p = (x, y, z, r, ang) => [x + Math.cos(ang) * r, y, z + Math.sin(ang) * r * 1.3];
      push(mat, [p(x0, y0, z0, r0, a), p(x1, y1, z1, r1, a1), p(x1, y1, z1, r1, a)], [p(x0, y0, z0, r0, a), p(x0, y0, z0, r0, a1), p(x1, y1, z1, r1, a1)]);
    }
  };
  const hipX = rootX, hipY = rootY, hipZ = rootZ;
  const kneeX = rootX + side * 0.04, kneeY = rootY - len * 0.46, kneeZ = rootZ + fwd * 0.05;
  const ankY = kneeY - len * 0.40, ankZ = kneeZ + fwd * 0.12;
  const footY = ankY - len * 0.10, footZ = ankZ + fwd * 0.02;
  seg(hipX, hipY, hipZ, len * 0.34, kneeX, kneeY, kneeZ, len * 0.15, M.dorsal);   // teardrop thigh (muscled)
  seg(kneeX, kneeY, kneeZ, len * 0.17, kneeX, kneeY - 0.01, kneeZ, len * 0.15, M.spine, 6);   // knee knuckle
  seg(kneeX, kneeY, kneeZ, len * 0.14, kneeX, ankY, ankZ, len * 0.08, M.dorsal);   // shank
  seg(kneeX, ankY, ankZ, len * 0.09, kneeX, footY, footZ, len * 0.07, M.spine);    // ankle → foot
  // 3 forward talons + 1 rear dewclaw — solid 4-tri pyramids (never single tris)
  const talon = (tx, tz, tl) => { const b0 = [tx - 0.02, footY, footZ], b1 = [tx + 0.02, footY, footZ], b2 = [tx + 0.02, footY, footZ + 0.03], b3 = [tx - 0.02, footY, footZ + 0.03], ap = [tx, footY - tl, footZ + tl * 1.4]; push(M.spine, [b0, b1, ap], [b1, b2, ap], [b2, b3, ap], [b3, b0, ap]); };
  for (let t = -1; t <= 1; t++) talon(kneeX + t * len * 0.06, footZ, len * 0.14);
  talon(kneeX, footZ - 0.04, len * 0.09);   // rear dewclaw
  // hip cowl plate lapping the leg root (hides the intersection + one more shadow gap)
  addArmorPlate(push, M, [hipX, hipY + len * 0.14, hipZ], [side, 0.4, 0], [0, 0, 1], len * 0.13, len * 0.14, M.flank);
}

// R7 — THROAT GORGET bands: wide shallow ventral scutes carrying the belly glow up the neck in
// SEGMENTED geometry (so the throat joins the belly system instead of being a bare tube).
function addGorget(push, stations, M) {
  const zs = [-2.20, -2.05, -1.90, -1.75, -1.60];
  const sample = (z) => { for (let j = 0; j < stations.length - 1; j++) { const a = stations[j], b = stations[j + 1]; if (z >= a.z && z <= b.z) { const t = (z - a.z) / (b.z - a.z || 1); return { yb: (a.cy - a.ryD) + ((b.cy - b.ryD) - (a.cy - a.ryD)) * t, w: a.rx + (b.rx - a.rx) * t }; } } return { yb: stations[2].cy - stations[2].ryD, w: stations[2].rx }; };
  zs.forEach((z, i) => { const s = sample(z), mat = i < 2 ? M.bellyEdge : M.bellyMid, w = s.w * 0.8, y = s.yb + 0.01;
    push(mat, [[-w, y, z], [w, y, z], [0, y - 0.02, z + 0.10]]);   // a shallow overlapping throat band (emissive)
    push(M.recess, [[-w, y, z], [0, y - 0.02, z + 0.10], [-w, y - 0.01, z + 0.12]]);   // a thin dark seam under it
  });
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
  const M = tempestMats(def);
  const heartScale = model.heartScale ?? 1;

  // The drake trunk stations (neck-base → tail-base, + two forward neck rings so the THROAT
  // glow reads). {z, rx, ryU (up), ryD (down), cy, keel}. chest depth ≥ 1.5× waist (Fable).
  // gate r3 fix #3: a DEEP-keeled compact drake (was a shallow horizontal torpedo/eel). The chest
  // rings are big-radius with a real sternum keel slung well below the shoulders; the waist tucks
  // HARD against them (chest depth ≈ 2.9× waist), so the level-glide side profile reads deep-chested.
  const trunk = [
    { z: -2.28, rx: 0.09, ryU: 0.09, ryD: 0.09, cy: 0.05 },   // neck (toward the head)
    { z: -1.92, rx: 0.13, ryU: 0.12, ryD: 0.15, cy: 0.12 },   // lower neck (rising)
    { z: -1.50, rx: 0.19, ryU: 0.16, ryD: 0.22, cy: 0.18 },   // neck-base / withers
    { z: -1.14, rx: 0.32, ryU: 0.22, ryD: 0.34, cy: 0.16 },   // shoulder girdle (widest, deep)
    { z: -0.74, rx: 0.31, ryU: 0.22, ryD: 0.48, cy: 0.13, keel: 0.12 },  // CHEST KEEL (deepest, slung below)
    { z: -0.26, rx: 0.24, ryU: 0.19, ryD: 0.32, cy: 0.16 },   // ribcage end
    { z: 0.28, rx: 0.15, ryU: 0.13, ryD: 0.15, cy: 0.21 },    // WAIST tuck (shallow — the pinch)
    { z: 0.74, rx: 0.25, ryU: 0.18, ryD: 0.24, cy: 0.16 },    // haunch swell
    { z: 1.16, rx: 0.16, ryU: 0.13, ryD: 0.15, cy: 0.15 },    // pelvis
    { z: 1.60, rx: 0.10, ryU: 0.09, ryD: 0.09, cy: 0.11 },    // tail-base
  ];
  // ONE shared per-material accumulator for the whole torso → still ≤~12 draws with all 7 ranks.
  const byMat = new Map();
  const push = (mat, ...tris) => { let a = byMat.get(mat); if (!a) byMat.set(mat, a = []); for (const t of tris) a.push(t); };

  addTrunkShell(push, trunk, M);        // the dark hull
  addBellyDeck(push, trunk, M);         // R2 — raised glow plates + recessed gutters + bolt channel
  const ridgeN = 8 + Math.round(6 * (model.glowLevel ?? 1));   // R1 — dorsal scute/crest rank (ladders up)
  addDorsalRidge(push, trunk, M, ridgeN);
  addGorget(push, trunk, M);            // R7 — throat gorget bands

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

  // R6 — four real legs (thigh loft → knee → shank → ankle → pyramid talons + hip cowl).
  addLeg(push, M, 0.20, -0.32, -0.76, 1, 0.56, 1);
  addLeg(push, M, -0.20, -0.32, -0.76, -1, 0.56, 1);
  addLeg(push, M, 0.21, -0.08, 0.78, 1, 0.52, -1);
  addLeg(push, M, -0.21, -0.08, 0.78, -1, 0.52, -1);

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
    headBase: { x: 0, y: 0.00, z: -2.40 },
    tailAnchor: { y: 0.12, z: 1.56 },
    keelTopAt: (z) => TORSO_Y + 0.30 * Math.max(0, 1 - Math.abs(z + 1.0) / 2.4),
    halfWidthAt: (z) => 0.30 * Math.max(0.2, 1 - Math.abs(z + 0.6) / 3.0),
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.52, z: -0.5 },
    motifAnchor,
  };
  // coreGlow = the storm-heart core (the real transparent hook — opacity ticked). flareMats =
  // the belly + crest + heart (Surge-flared, exempt from the warm cruise rim). spineMats [] .
  return { group, attach, spinePoints, spineMats: [], flareMats: [M.bellyCore, M.bellyMid, M.bellyEdge, M.crest, M.heartCore], mats: { bodyMat: M.dorsal }, coreGlow: core };
}
registerTorso('cumulonimbusTorso', buildCumulonimbusTorso);

// ── WINGS: 'stormforkWings' (the HERO) ────────────────────────────────────────
// STUB (I2 builds it for real, §D): the STORMFORK — a wing whose skeleton IS a frozen
// branching lightning bolt (a gull ARCH with exactly 3 kink-knuckles + a dominant
// Y-fork, cupped opaque membrane bays, silver rim-caps, ONE connected knife-edge). For
// now a bare charcoal ARM + a small decaying ray fan carrying one thin opaque membrane,
// wired into the SAME 3-segment hinge (pivot/mid/tip) + outer-lmirror rig the real wing
// will use — so I2 swaps GEOMETRY without touching the flap contract. NO bolt kinks /
// Y-fork / bays yet; the module-level boltArm waypoint profile lands in I2.
function buildOneStormforkWing(M, dials, wingMat) {
  const arm = new THREE.Group();
  const hand = new THREE.Group();
  const hs = dials.halfSpan, wristT = dials.wristT ?? 0.24;
  const rays = Math.max(2, Math.round(dials.rays));
  // Placeholder leading edge: a shallow gull arch to the carpal, then ease to the tip
  // (I2 replaces this with the piecewise-LINEAR boltArm waypoint function — the 3 kinks).
  const armY = (t) => hs * (0.05 * t + 0.22 * (t <= wristT ? Math.sin((t / wristT) * Math.PI / 2) : 1 - (t - wristT) * 0.12));
  const armZ = (t) => -0.06 + 0.34 * hs * Math.pow(t, 1.05) - 0.10 * hs * Math.sin(Math.PI * t);
  const LE = (t) => [t * hs, armY(t), armZ(t)];
  const K = LE(wristT), F0 = LE(1);
  // Arm bone (root→carpal) as a low tent ridge with a diffuse silver rim-cap crest.
  const ridge = (tgt, a, b, w, lift, mat) => {
    const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1, px = -dz / len, pz = dx / len;
    const aL = [a[0] + px * w, a[1], a[2] + pz * w], aR = [a[0] - px * w, a[1], a[2] - pz * w];
    const aT = [a[0], a[1] + lift, a[2]], bT = [b[0], b[1] + lift * 0.35, b[2]];
    tgt.add(flatTriMesh([[aL, b, bT], [aL, bT, aT], [aR, aT, bT], [aR, bT, b]], mat));
  };
  ridge(arm, LE(0), K, 0.08 * hs, 0.06 * hs, M.silverRim);   // arm crest (silver-lining rim-cap)
  // Rays fan aft from the carpal (dominant + decay ≤0.86×), each a low charcoal tent.
  const lenFrac = [1, 0.80, 0.62, 0.46];
  const phi0 = Math.atan2(F0[2] - K[2], F0[0] - K[0]), r0 = Math.hypot(F0[0] - K[0], F0[2] - K[2]);
  const tips = [F0];
  for (let i = 1; i < rays; i++) {
    const phi = phi0 + 1.0 * (i / (rays - 1)), r = r0 * lenFrac[Math.min(i, lenFrac.length - 1)];
    tips.push([K[0] + Math.cos(phi) * r, K[1] - 0.08 * r, K[2] + Math.sin(phi) * r]);
  }
  for (const tp of tips) ridge(hand, K, tp, 0.05 * hs, 0.05 * hs, M.dorsal);
  // ONE opaque charcoal membrane spanning arm-root → carpal → last ray tip (placeholder
  // sheet; I2 cuts the inward-cupped bays + the Y-fork V-notch). The membrane is OPAQUE
  // matte cloud (the settled opacity law — never translucent bat-skin, §C.3/§D.2c); the
  // rig's wingMat.opacity writes are visually inert by construction (noted, not a bug —
  // the transparent flag is kept so the rig's material drive never throws).
  const root = LE(0), last = tips[tips.length - 1];
  hand.add(flatTriMesh([[root, K, last], [root, last, [last[0] * 0.5 + root[0] * 0.5, root[1] - 0.05 * hs, last[2] * 0.5 + root[2] * 0.5]]], wingMat));
  return { arm, hand, K, tip: F0 };
}

function buildStormforkWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = tempestMats(def);
  const rays = Math.max(2, Math.round(model.rays ?? model.fingers ?? 4));
  const halfSpan = (model.spanScale ?? 1) * 2.3;
  const wristT = model.wristT ?? 0.24;
  const dials = { rays, halfSpan, wristT };

  // The rig's single-material wing contract (dragonModel/dragon.js drive ONE wingMat's
  // opacity/emissive). The Stormfork membrane is OPAQUE matte cloud; emissive black in
  // cruise (the near-white circuit owns the light, on the FRAME, never painted on the
  // sheet). transparent:true is kept so the rig's opacity drive is a no-op, not a throw.
  const wo = def.wingOuter ?? FLANK;
  const wingMat = new THREE.MeshStandardMaterial({ color: lerpHex(wo, STORM_SHADOW, 0.3), emissive: 0x000000, flatShading: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 1.0 });
  wingMat.envMapIntensity = 0.18;

  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    const rootC = attach.wingRoot(1);   // build CANONICAL right; left is an outer lmirror wrapper
    const pivot = new THREE.Group(); pivot.position.set(rootC.x, rootC.y, rootC.z); pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    const { arm, hand, K } = buildOneStormforkWing(M, dials, wingMat);
    mid.add(arm);
    tip.position.set(K[0], K[1], K[2]);      // fold joint = the carpal knuckle (the dominant kink in I2)
    hand.position.set(-K[0], -K[1], -K[2]);  // −anchor → assembled REST pose byte-identical
    tip.add(hand);
    if (side === -1) { const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(pivot); group.add(lmirror); }
    else group.add(pivot);
    const s = side === 1 ? 'R' : 'L';
    // Tip marker — the wingtip (dominant-ray tip F0), tracked through the wrist fold (FX emit point).
    const tipY = halfSpan * (0.05 + 0.22 * (1 - (1 - wristT) * 0.12));
    const marker = new THREE.Object3D();
    marker.position.set(halfSpan, tipY, -0.06 + 0.34 * halfSpan);
    hand.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip; pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * halfSpan, root.y + tipY, root.z + 0.28], length: halfSpan, tipObj: marker });
  }
  return { group, spineMats: [], wingMat, parts: { ...pivots, wingElements } };
}
registerWings('stormforkWings', buildStormforkWings);

// ── HEAD: 'stormbrowHead' ─────────────────────────────────────────────────────
// STUB (I3 builds it for real): a blunt RAM-PROW wedge (the storm leads with its
// forehead — heavy brow shelf, short muzzle, no horns) + two pale arc-white pinpoint
// eyes. I3 adds the true facets, the 2 blunt horn-BOSSES, the swept-back NIMBUS MANE
// (0→2→4→6 up the ladder), the eye:head ladder + the f3 charge-hair. Uses the shared
// eyeMat (def.eye drives its colour) — eyes are the brightest facial point.
function buildStormbrowHead(def, model, mats) {
  const group = new THREE.Group();
  const M = tempestMats(def);
  const hs = model.headScale ?? 1;
  const eyeMat = mats.eyeMat;

  // Blunt ram-prow wedge pointing −Z (heavy brow → short muzzle).
  const skull = [
    { z: 0.28, rx: 0.19 * hs, ry: 0.20 * hs, cy: 0.02 },   // occiput
    { z: -0.02, rx: 0.23 * hs, ry: 0.24 * hs, cy: 0.05 },  // brow shelf (widest, heavy)
    { z: -0.36, rx: 0.16 * hs, ry: 0.15 * hs, cy: -0.01 }, // cheek
    { z: -0.66, rx: 0.09 * hs, ry: 0.09 * hs, cy: -0.05 }, // short muzzle
    { z: -0.84, rx: 0.05 * hs, ry: 0.05 * hs, cy: -0.06 }, // blunt tip
  ];
  group.add(tubeLoft(skull, M.flank));
  const headLength = 1.12 * hs;

  // Pale arc-white pinpoint eyes (def.eye). Seated high on the brow, converged forward.
  // Intensity rises with glowLevel (whelp→apex, the grind reward); eyes are rig-driven
  // separately (kept OUT of every surge/storm array — the fever firewall).
  eyeMat.emissiveIntensity = 0.7 + 1.6 * (model.glowLevel ?? 1);
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.05 * hs, 0), eyeMat);
    eye.position.set(side * 0.15 * hs, 0.09 * hs, -0.10 * hs);   // high on the brow (the brightest facial point)
    group.add(eye);
  }
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.set(0, 0.14 * hs, 0.10 * hs); group.add(motifAnchor);
  return { group, spineMats: [], motifAnchor, headLength };
}
registerHead('stormbrowHead', buildStormbrowHead);

// ── TAIL: 'virgaTail' ─────────────────────────────────────────────────────────
// STUB (I3 builds it for real): a tapering storm-stem on the Vesper isBone 4-joint
// NESTED chain (−anchor rest-pose compensation, rotation-only drive) closing in a small
// nub — the SAME nested-chain pattern as splitFanTail so the rig's travelling-wave
// tailWhip has real joints to walk. I3 adds the VIRGA FRINGE (2→3→4→5 rain-streamer
// wisps) + ONE connected translucent hem band + the f3 arc terminus stud. NO wisps yet.
function buildVirgaTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  const M = tempestMats(def);
  const a = anchor ?? { y: 0.12, z: 1.62 };
  const T = (model.tailLength ?? 1) * 2.5 * (model.tailStretch ?? 1);
  const nSeg = Math.round(model.tailSegments ?? 8);
  const rAt = (t) => 0.11 * Math.pow(1 - t * 0.92, 0.7) + 0.008;   // tapers to ≤0.20× base
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
  for (let j = 0; j < nChain; j++) { const i0 = jIdx(j), i1 = jIdx(j + 1); if (i1 > i0) chainAdd(stem[i0].z, tubeLoft(stem.slice(i0, i1 + 1), M.flank, false)); }

  // Small rain-nub closing the stem (the virga fringe + hem land here in I3).
  const tip = stem[nSeg], tx = 0, ty = tip.cy, tz = tip.z;
  chainAdd(tz, flatTriMesh([
    [[tx, ty + 0.04, tz], [tx - 0.07, ty, tz + 0.10], [tx + 0.07, ty, tz + 0.10]],
    [[tx - 0.07, ty, tz + 0.10], [tx, ty - 0.02, tz + 0.24], [tx + 0.07, ty, tz + 0.10]],
  ], M.belly));

  return { group, segs: joints, accentMats: [] };
}
registerTail('virgaTail', buildVirgaTail);
