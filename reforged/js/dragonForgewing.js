import * as THREE from 'three';
import { registerWings } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';
import { composeSurface, membraneTransmissionPatch, wingFirePatch, wingEmberPatch } from './dragonSurfaceShader.js';

// ═══════════════════════════════════════════════════════════════════════════════
// BASALT FORGEWING — the WING-LAB test article (wing-lab/90-SYNTHESIS.md, increment I1).
//
// "A bellows, not a lantern: a coal-dark, hand-built storm sail on a basalt-pipe arm."
//
// This module owns ONE part: `basaltForgeWings`. The roster key `forgewing` reuses the
// Thunderhead Tempest's shipped torso/head/tail recipe UNCHANGED, so the only thing that
// differs from the roster's premium bar is the wing — the lab judges a wing, not a dragon.
//
// I1 SCOPE (this file): skeleton · landmarks · planform · flat-tiered bays · hem · claw
// cluster · propatagium · cowl. NO membrane shading, NO fire, NO new flap tuning — those
// are I2 (thickness/cords/transmission), I3 (window/arteries/ash) and I4 (flap/fold).
// The seams those increments need are already cut here and marked `I2:` / `I3:` / `I4:`.
//
// THE THREE MOVES that separate this from every shipped wing (§1):
//  1. THE ARM IS REAL. Wrist at HALF the span (t=0.50), a visible elbow at t=0.28 bent to
//     ~150° included, a genuine propatagium sail filling the shoulder→wrist front, and a
//     clawed carpal hand-cluster as the silhouette's punctuation mark. Every shipped hero
//     is a stub arm with a giant fan (wristT 0.21–0.24); this is an arm with a hand.
//  2. THE FAN OPENS AT THE KNUCKLES, not in the palm. Four near-equal metacarpals leave the
//     carpal block as a narrow bundle; each digit turns out to its full fan azimuth at its
//     MCP. A splayed fan-palm is §12 kill #4.
//  3. THE SPAR IS A PIPE, not a tent. Every bone is a swept 4/5-gon TUBE with two taper
//     regimes (near-parallel inboard, whip outboard, break at the wrist) and knuckle
//     thickenings that read as BUMPS IN THE OUTLINE at elbow/wrist/every MCP + PIP. Edge-on
//     — 40% of the beat — the wing is a knuckled polyline, not a flat blade.
//
// Code idiom is `dragonTempest.js`'s: explicit triangle lists, per-(group,material)
// accumulators flushed into a handful of `flatTriMesh` draws, deterministic index jitter
// (never Math.random), and the −anchor + outer-mirror rigging boilerplate copied verbatim.
// ═══════════════════════════════════════════════════════════════════════════════

// ── tiny vector kit (arrays, not Vector3 — the triangle lists are plain arrays) ──
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const norm3 = (a) => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// deterministic per-index hash jitter (§3 wants ±3° azimuth jitter on digits IV–VI; the
// value-tier field wants an index hash). NEVER Math.random — capture must be reproducible.
const wjit = (i, amp) => { const h = Math.sin((i + 1) * 78.233 + 2.7) * 43758.5453; return (h - Math.floor(h) - 0.5) * 2 * amp; };
const D2R = Math.PI / 180;

// Sample a polyline by normalised ARC LENGTH. Every membrane bay welds to SPAR SAMPLES
// (never to fingertips) — a tip-referenced membrane detaches the moment the spars curve.
function pathSample(nodes, s) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < nodes.length - 1; i++) { const L = len3(sub3(nodes[i + 1], nodes[i])) || 1e-6; segs.push(L); total += L; }
  let want = Math.max(0, Math.min(1, s)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (want <= segs[i] || i === segs.length - 1) return lerp3(nodes[i], nodes[i + 1], Math.max(0, Math.min(1, want / segs[i])));
    want -= segs[i];
  }
  return nodes[nodes.length - 1].slice();
}

// ═══════════════════════════════════════════════════════════════════════════════
// I2 — THE MEMBRANE SURFACE (§6). Everything below this banner is the shading layer:
// the per-vertex optical-thickness payload, the UV atlas the field is drawn in, and
// the ONE generated DataTexture that carries the cord field and the vein doublets.
// ═══════════════════════════════════════════════════════════════════════════════

// ── §6.4 THE UV ATLAS ────────────────────────────────────────────────────────
// `aMem.x` is the TRUE span fraction t (worldX + rootX)/hs — so a rule written in span
// fractions ("no cords inboard of t 0.30") is expressible directly, and it survives any
// rescale. `aMem.y` is a chord coordinate packed into per-surface BANDS, because the
// four membrane surfaces share one field texture and must not read each other's veins.
// Gutters between bands stop bilinear filtering bleeding one band into the next.
const ATLAS = {
  sheet: [0.020, 0.530],    // plagiopatagium + the finger bays (chord/across-bay, LE→TE)
  prop:  [0.580, 0.780],    // the propatagium sail (LE → taut forward edge)
  skirt: [0.800, 0.990],    // the body-frame flank skirt
};
const atlasV = (band, c) => band[0] + (band[1] - band[0]) * Math.max(0, Math.min(1, c));

// ── §6.4 THE FIELD — ONE generated 256×256 R8 DataTexture (65,536 B = the 64 KB cap) ──
// Never a CanvasTexture: builders run headless in node and a 2D context is a stub there,
// so a canvas-rasterised field silently ships as garbage (§11).
//
// It carries TWO things, both as a multiplier on the optical path `d`:
//   • the VEIN DOUBLETS — a Murray tree, taper 0.794 (asymmetric 0.90/0.65 daughters),
//     forks 24°/52°, 4 orders, drawn as artery+vein PAIRS with the vein 1.5× wider and
//     thicker. They are thickness, never light: backlit they subtract from the glow.
//   • the LOW-frequency comb of the cord field — the broken directional grain that
//     survives to chase distance. The fine 1/75-chord cords cannot live in a 256-texel
//     band (1.7 texels per cord); they are the analytic, fwidth-faded term in the shader
//     instead, so they resolve as lines at the 4× crop and fall to tint at distance
//     exactly as A2's Murray cut-off law requires. One texture, one fetch, unchanged budget.
//
// Encoding: byte 0..255 → multiplier 0.55 + b/255 · 2.20 (nominal 1.0 at byte 52).
const FIELD_N = 256;
const F_ENC = (m) => Math.max(0, Math.min(255, Math.round(((m - 0.55) / 2.20) * 255)));
let _memFieldTex = null;

// exact box-filter coverage of a stripe of duty `duty` (fraction of pitch) by a texel
// whose footprint is `fp` pitches — analytic prefiltering, so the comb NEVER aliases and
// its amplitude decays honestly as the texel outruns the line.
function stripeCov(phase, duty, fp) {
  const ph = phase - Math.floor(phase);
  const h = duty * 0.5;
  const lo = Math.max(0.5 - h, ph - fp * 0.5), hi = Math.min(0.5 + h, ph + fp * 0.5);
  return Math.max(0, hi - lo) / Math.max(fp, 1e-6);
}

// ── §6.4 / §7.1 THE VESSEL TREE — generated ONCE, consumed TWICE ─────────────
// I2 grew this Murray tree straight into the field rasteriser. I3 needs the SAME
// lines as geometry (the artery member has to EMIT — §2.4's "one geometry, both
// channels"), and a second tree grown from the same constants would drift the
// moment either copy is touched: the glowing hairline would sit beside a dark
// doublet that is not its own, which is exactly the defect §2.4 forbids.
//
// So the tree is extracted here and returns SEGMENTS in the field's own space —
// `u` IS the span fraction t from the body midline (which is what makes §7.1's
// "every artery terminates before t = 0.60" expressible as one comparison), `c` is
// the chord fraction inside the surface's atlas band. `membraneField()` stamps
// them in array order (identical output to I2, bit for bit); `buildOneForgewing`
// maps the same list onto the ventral surface and lights the artery member.
//
// Taper 0.794 per bifurcation is the symmetric law; the buildable asymmetric pair
// that satisfies it is main 0.90 at 24° / branch 0.65 at 52° (§2.4, total 75.6° —
// inside the sourced 75–100° near-minimum band). Symmetric Y-forks are kill #35.
let _vesselSegs = null;
function vesselSegments() {
  if (_vesselSegs) return _vesselSegs;
  const segs = [];
  const grow = (band, u, c, ang, w, order, seed) => {
    if (order > 4 || w < 0.004 || u > 0.60) return;   // §7.1: every artery terminates before t=0.60
    const len = 0.115 * Math.pow(0.80, order);
    const u1 = u + Math.cos(ang) * len, c1 = c + Math.sin(ang) * len * 2.4;
    segs.push({ band, u0: u, c0: c, u1, c1, w, order });
    if (order === 4) return;
    const side = wjit(seed, 1) > 0 ? 1 : -1;
    grow(band, u1, c1, ang + side * 24 * D2R, w * 0.90, order + 1, seed * 3 + 1);
    grow(band, u1, c1, ang - side * 52 * D2R, w * 0.65, order + 1, seed * 3 + 2);
  };
  // Zone A's window sits in the proximal ventral plagiopatagium triangle; the doublets
  // RADIATE from it (§7.1 zone B) — three trunks, never a loop, never a rim.
  grow(ATLAS.sheet, 0.115, 0.30, 18 * D2R, 0.017, 1, 5);
  grow(ATLAS.sheet, 0.125, 0.56, -6 * D2R, 0.014, 1, 11);
  grow(ATLAS.sheet, 0.150, 0.78, -26 * D2R, 0.011, 1, 17);
  // §5.2: the CEPHALIC doublet runs INSIDE the propatagium along (not on) the leading
  // edge, terminating at the carpal cluster.
  grow(ATLAS.prop, 0.130, 0.42, 4 * D2R, 0.013, 1, 23);
  _vesselSegs = segs;
  return segs;
}

function membraneField() {
  if (_memFieldTex) return _memFieldTex;
  const N = FIELD_N, data = new Uint8Array(N * N);
  const mult = new Float32Array(N * N).fill(1);

  // -- the COMB (low-frequency cord grain) ------------------------------------
  // Territory (§2.2, sourced as the fossil law): NO cords inboard — which is exactly
  // where the forge window lives, so the window stays a clean pane — density ramping to
  // full outboard. Direction rotates perpendicular-to-arm → parallel-to-finger, so the
  // DOMINANT direction through the handwing is SPANWISE (§12 kill #24) and the chordwise
  // regime only ever exists in the sparse ramp-in band.
  const COMB_C = 26;     // combs across the chord at full density (the fine 75/chord field is analytic)
  const COMB_U = 34;     // …and across the span in the proximal perpendicular regime
  for (let j = 0; j < N; j++) {
    const v = (j + 0.5) / N;
    let band = null, c = 0, amp = 0;
    if (v >= ATLAS.sheet[0] && v <= ATLAS.sheet[1]) { band = ATLAS.sheet; amp = 1.0; }
    else if (v >= ATLAS.prop[0] && v <= ATLAS.prop[1]) { band = ATLAS.prop; amp = 0.35; }
    else if (v >= ATLAS.skirt[0] && v <= ATLAS.skirt[1]) { band = ATLAS.skirt; amp = 0.30; }
    if (!band) continue;
    c = (v - band[0]) / (band[1] - band[0]);
    const fpV = (COMB_C / (band[1] - band[0])) / N;     // texel footprint, in pitches
    const fpU = COMB_U / N;
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N;
      const dens = Math.max(0, Math.min(1, (u - 0.30) / 0.35));    // 0 inboard of 0.30, full by 0.65
      if (dens <= 0.001) continue;
      const rot = dens;                                            // perpendicular-to-arm → parallel-to-finger
      const cv = stripeCov(c * COMB_C, 0.30, fpV);
      const cu = stripeCov(u * COMB_U, 0.30, fpU);
      const cov = cv * rot + cu * (1 - rot);
      mult[j * N + i] *= 1 + 0.30 * amp * dens * cov;
    }
  }

  // -- the VEIN DOUBLETS (§6.4) ----------------------------------------------
  // Stamped, not tested per-texel: each segment writes only its own footprint.
  const stamp = (band, u0, c0, u1, c1, wArt) => {
    const v0 = atlasV(band, c0), v1 = atlasV(band, c1);
    const dx = u1 - u0, dy = v1 - v0, L2 = dx * dx + dy * dy || 1e-9;
    const nx = -dy / Math.sqrt(L2), ny = dx / Math.sqrt(L2);
    const bh = (band[1] - band[0]) / (ATLAS.sheet[1] - ATLAS.sheet[0]);
    const wA = wArt * bh, wV = wA * 1.5;             // §2.4: vein 1.45–1.5× the artery
    const off = wA * 1.30;                            // offset ≈ one vessel width
    const pad = wV * 2.2 + off;
    const i0 = Math.max(0, Math.floor((Math.min(u0, u1) - pad) * N)), i1 = Math.min(N - 1, Math.ceil((Math.max(u0, u1) + pad) * N));
    const j0 = Math.max(0, Math.floor((Math.min(v0, v1) - pad) * N)), j1 = Math.min(N - 1, Math.ceil((Math.max(v0, v1) + pad) * N));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const u = (i + 0.5) / N, v = (j + 0.5) / N;
      if (v < band[0] || v > band[1]) continue;
      const t = Math.max(0, Math.min(1, ((u - u0) * dx + (v - v0) * dy) / L2));
      const px = u0 + t * dx, py = v0 + t * dy;
      const s = (u - px) * nx + (v - py) * ny;         // signed distance across the pair
      const n = Math.hypot(u - px, v - py);
      if (n > pad) continue;
      // the ARTERY: thinner, the warmer member (non-emissive until I3 — it is a dark
      // hairline here, and I3 sockets the heat onto this same centreline).
      const a = Math.max(0, 1 - Math.abs(s + off) / wA);
      // the VEIN: wider AND darker — deoxygenated blood absorbs ~10× more red (§2.2), and
      // the venous bed is 80% of the vascular volume. It is the member the eye reads.
      const b = Math.max(0, 1 - Math.abs(s - off) / wV);
      const add = 0.62 * a * a + 1.15 * b * b;
      if (add > 0) mult[j * N + i] *= 1 + add;
    }
  };
  for (const s of vesselSegments()) stamp(s.band, s.u0, s.c0, s.u1, s.c1, s.w);

  for (let k = 0; k < N * N; k++) data[k] = F_ENC(mult[k]);
  const tex = new THREE.DataTexture(data, N, N, THREE.RedFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  _memFieldTex = tex;
  return tex;
}

// ── THE MATERIALS ──────────────────────────────────────────────────────────────
// §5.5 / §12 kill #21: the membrane is THE DARKEST ELEMENT on the dragon (albedo 3–7%,
// warm near-black `#241a16`-class); the bones + ash read LIGHTER. The bone↔membrane
// boundary carries the wing's whole contrast budget. Authored with albedo + roughness 0.38
// + envMapIntensity ≤0.06 TOGETHER (the Revenant 52%-pale lesson: rendered value =
// albedo × lighting, so all three numbers are one decision).
// §7.3: char runs linear 0.0035–0.041, ash 0.049–0.354 — the bone's value structure is a
// 10–100× char→ash ramp with ZERO emissive pixels. That ash is what keeps the wing
// readable in flat daylight and is the direct answer to flat-black poverty.
// I2 — THE BLUE SHEEN, killed as ONE decision. Round 1 logged a broad blue rim-light
// sheen across the ventral hand at apex ("one wing black, the other a blue LED panel").
// It is not an albedo bug: on a dielectric the specular lobe is the LIGHT's colour, not
// the surface's, so a dark warm sheet under a cool rim/fill still returns a wide cyan
// highlight. Albedo, roughness, envMapIntensity and the transmission term are therefore
// authored TOGETHER (the Revenant 52%-pale lesson) and MEASURED (`wingtiers.mjs`):
//   • albedo `#241a16`-class near-black-warm — §5.5's 3–7% reflectance class,
//   • roughness 0.50 — the Director's granted yield off 0.38, spent because 0.38 left a
//     measurable blue lobe on the ventral bays; it spreads the specular instead of
//     concentrating it, at the cost of a little sebum gloss,
//   • envMapIntensity 0.05 — the reflected sky is the other half of the cool cast,
//   • the transmission term supplies the WARM light the sheet is allowed to show.
const MEM_ALBEDO = 0x4b3418;
const MEM_ROUGH = 0.38;
const MEM_ENV = 0.05;
// §5.5: 4 value tiers banded by BILLOW DEPTH (taut-near-spar lightest → deep cup darkest),
// carried as vertex-colour MULTIPLIERS on the one membrane material so the tiers are
// continuous across every lobe seam and cost zero extra draws. The ladder spans 3.2×.
const MEM_TIERS = [1.95, 1.20, 0.66, 0.36];
const MEM_HEM_TIER = 0.30;    // §6.5 the trailing hem is a dark cord, below the darkest field tier

// ═══════════════════════════════════════════════════════════════════════════════
// I3 — THE FIRE (§7). "A bellows, not a lantern."
// ═══════════════════════════════════════════════════════════════════════════════

// §7.1 THE AUTHORED EMITTER. Deep orange, never white — the white in the core is
// made by ACES out of a red channel that is 10× the green and 150× the blue, which
// is what keeps R ≥ G ≥ B strictly true at EVERY value on the ramp (kill #48). An
// authored white core cannot do that: it desaturates the same amount everywhere and
// gives peak saturation to the brightest pixel, which §7.1's canon forbids.
const FIRE_EMISSIVE = 0xff5410;     // linear (1.000, 0.0889, 0.0052) — R ≫ G ≫ B
// The four AUTHORED states (§7.1 / F1 B6). These are RECRUITMENT stages, not a
// slider: a window appears or it does not. `gain` is the per-state master value —
// deliberately a small ladder, because the state read is meant to come from AREA
// (which zones are lit), not from a brightness knob.
const FIRE_STATES = ['cold', 'cruise', 'power', 'ignition'];
const FIRE_GAIN = [0.62, 1.00, 1.10, 1.34];
// §7.2: the artery throb DAMPS to steady-and-brighter under load — flow suppresses
// vasomotion, the sourced counter-intuitive tell. Load is a property of the STATE.
const FIRE_LOAD = [0.0, 0.25, 0.85, 1.0];
// §7.5 embers: brighter with the state, never present at cold (a cold wing sheds no
// firebrands) and blazing at ignition (the F1 burst band).
const EMBER_GAIN = [0.0, 0.40, 0.58, 0.88];

// The per-vertex TEMPERATURE ladder — a scalar multiplier on FIRE_EMISSIVE, so one
// material carries the whole §7.1 band table with no extra draw and no second hue.
// (Measured post-ACES on the stage: 1.35 → luma 0.58, 0.40 → luma 0.26, 40 → white.)
const T_CORE = 150.0;   // 1200–1300 °C — the only pixels allowed to clip
const T_RIM = 1.35;     // the window border, F1's 0.55–0.75 post-tonemap
const T_SEC = 1.90;     // the mid-panel secondary windows (power) — a step BELOW zone A
const T_ART0 = 0.44;    // 900–1100 °C — the artery where it leaves zone A
const T_ART1 = 0.17;    // 650–800 °C — the artery as it dies before t = 0.60
const T_OUT = 0.62;     // the outer-membrane recruit (ignition only)
const T_CAP = 0.34;     // G3 capillary flash (ignition only)

// §7.4 TEMPER — the oxide series, outward from the hot root: grey-black → blue →
// violet → red-brown → golden → bare. LOW-VALUE TINTS, never emitters; this is the
// only legal blue on the creature and it lives on the SKELETON, never on the
// membrane (the B−R guard is a membrane-pixel assertion for exactly this reason).
// The film thickens with temperature AND WITH TIME, so the series encodes HISTORY:
// inner spars have been hot longest and sit further along it than outer ones.
const TEMPER = [
  [0.055, 0.050, 0.046],   // grey-black  >360 °C
  [0.046, 0.062, 0.098],   // blue         290
  [0.062, 0.048, 0.086],   // violet       280
  [0.086, 0.055, 0.038],   // red-brown    240–270
  [0.120, 0.088, 0.040],   // golden       200–240
  [0.060, 0.052, 0.043],   // bare (= the char base, in linear)
];

// A module-level clock for the three §7.2 rhythms. Driven from `onBeforeRender` so
// the wing needs no tick wired into dragon.js (and the shipped roster stays
// byte-identical), and PINNABLE — `globalThis.__wlFireTime` freezes it so a capture
// is deterministic, the same contract the surge montage uses (`__ddSurgeCascadePin`).
function fireClock() {
  const p = (typeof globalThis !== 'undefined') ? globalThis.__wlFireTime : undefined;
  if (typeof p === 'number') return p;
  const t = (typeof performance !== 'undefined' && performance.now) ? performance.now() / 1000 : 0;
  return t % 600;   // wrapped: fract() in the ember shader loses a digit per decade of seconds
}

function forgeMats(def) {
  const solid = (hex, rough, env) => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0.0, flatShading: true, side: THREE.DoubleSide });
    m.envMapIntensity = env;
    return m;
  };
  // ONE membrane material for the whole sheet — plagiopatagium, finger bays, hem,
  // propatagium and the body-frame skirt. Four tier materials became one because §5.4
  // mitigation (2) requires the value ladder to run CONTINUOUSLY across the lobe seams:
  // a per-tier material can only step. Vertex colours carry the tier, `aMem` carries the
  // optical thickness, and the §6.2 patch turns both into light.
  const mem = new THREE.MeshStandardMaterial({
    color: MEM_ALBEDO, roughness: MEM_ROUGH, metalness: 0.0,
    flatShading: true, side: THREE.DoubleSide, vertexColors: true,
  });
  mem.envMapIntensity = MEM_ENV;
  mem.name = 'forge:mem';
  composeSurface(mem, [membraneTransmissionPatch({
    field: membraneField(), ambient: 0.10,
    spec: 0.35, specF90: 0.06, specTint: 0xffc088,
  })]);
  // The GLOBAL fresnel rim (dragon.js `applyRim`) overwrites onBeforeCompile outright, so
  // it would silently delete the transmission patch the moment this wing is equipped in
  // the game — and it would paint the continuous bright outline §12 kill #33 forbids.
  // Claiming the rim slot here makes applyRim a no-op on the membrane, by design.
  mem.userData.__rim = { skipped: 'membrane owns its own §6.3 fringe' };
  const out = {
    mem,
    bone: solid(0x413b34, 0.72, 0.22),     // charcoal-basalt pipe (top of the char band)
    ash: solid(0x7c766c, 0.86, 0.16),      // §7.3 ash dusting — up-facing faces + windward sides ONLY, never a wash
    claw: solid(0x231f1c, 0.34, 0.30),     // near-black horn: thumb claw + the ONE digit-III tip hook
    covert: solid(0x5a5249, 0.80, 0.14),   // the covert rank's lit lap edge — the MID step of bone→covert→ash
    band: solid(0x3a1c12, 0.90, 0.04),     // §9 graded vermilion scale→membrane transition (hairless, sheenless)
    flank: solid(def.body ?? 0x2e2a26, 0.80, 0.18),   // cowl + root fairing + flank ridge = BODY frame, not wing
  };
  out.bone.name = 'forge:bone'; out.ash.name = 'forge:ash'; out.claw.name = 'forge:claw';
  out.covert.name = 'forge:covert';
  out.band.name = 'forge:band'; out.flank.name = 'forge:flank';

  // §7.4 TEMPER — one vertex-coloured material carries the whole oxide series, so
  // six tints cost ONE draw and ZERO extra triangles (the ringed faces are faces the
  // humerus tube already had; they move out of the bone/ash buckets, they are not
  // added). Roughness sits between char and ash: an oxide film is a thin smooth
  // scale, not soot. Non-emissive by construction — kill #48 only ever fires on the
  // thermal ramp, and this is the COMPLEMENT to it, not part of it.
  out.temper = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.52, metalness: 0.0,
    flatShading: true, side: THREE.DoubleSide, vertexColors: true,
  });
  out.temper.envMapIntensity = 0.14;
  out.temper.name = 'forge:temper';

  // ── §7 THE FIRE MATERIAL ────────────────────────────────────────────────────
  // ONE material for zone A, zone B, the secondaries and the outer recruit. Black
  // albedo: a radiator does not have a diffuse read, so a gated-OFF window renders
  // EXACTLY (0,0,0) — which is what makes "emissive fraction of projected area" a
  // measurable number instead of an argument. `flatShading` off: the panes are flat
  // already and per-face normals would cost verts for nothing.
  const fire = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: FIRE_EMISSIVE, emissiveIntensity: 1.0,
    roughness: 1.0, metalness: 0.0, side: THREE.FrontSide, vertexColors: true,
  });
  fire.envMapIntensity = 0.0;
  fire.name = 'forge:fire';
  // THE SHIPPED CONTRACT. `flareMats` mats are reset every frame from these two
  // userData fields by dragon.js's flare loop; without `baseEmissive` the loop
  // resets the emissive to WHITE on frame one and the whole hue law dies in-game.
  fire.userData.baseEmissive = FIRE_EMISSIVE;
  fire.userData.baseIntensity = 1.0;
  composeSurface(fire, [wingFirePatch({ stage: 1, gain: FIRE_GAIN[1], load: FIRE_LOAD[1] })]);

  // ── §7.5 THE EMBERS ─────────────────────────────────────────────────────────
  // Additive, depth-read but not depth-WRITE (an ember is light in the air, not a
  // surface), and its whole life cycle lives in the vertex shader — so 40 rods for
  // the pair cost one draw, no CPU, and are deterministic under a pinned clock.
  const ember = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: 0xffffff, emissiveIntensity: 1.0,
    roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide, vertexColors: true,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  ember.envMapIntensity = 0.0;
  ember.name = 'forge:ember';
  ember.userData.baseEmissive = 0xffffff;
  ember.userData.baseIntensity = 1.0;
  composeSurface(ember, [wingEmberPatch({ gain: EMBER_GAIN[1] })]);

  out.fire = fire; out.ember = ember;
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ONE CANONICAL (+X) WING. Returns { arm, hand, root, frame, K, tip, dump } where
//   arm   → rides `pivot` (humerus + propatagium + plagiopatagium + arm hem + coverts)
//   fore  → rides `mid`  at the ELBOW landmark t=0.28 (forearm + wrist ridge)
//   hand  → rides `tip`  at the WRIST landmark t=0.50 (carpal cluster + digits + bays)
//   root  → rides `pivot` (the muscular root fairing — the one root element that deforms)
//   frame → rides the BODY (scapular cowl + the flank skirt — static through the flap)
//
// I1.1 moved `mid` OFF the pivot and onto the elbow, via the same −anchor trick as the
// wrist (`mid.position = +E`, `fore.position = −E`), so the assembled rest pose is
// byte-identical and the joint now sits at the §3 landmark instead of doubling the
// shoulder. It is driven at AMPLITUDE ZERO for now (`midAmp: 0`, `apexMid: 0` on the def) —
// I4 owns making the elbow flex — but the rig topology is right, so I4's fold is no longer
// blocked on a rig change. The sheets that SPAN the elbow (propatagium, plagiopatagium)
// deliberately stay on `pivot`: a membrane welded across a moving joint tears, and keeping
// them proximal is also what holds the root-drift assertion at zero.
// `dump` carries the pure-math landmark table the verify chain checks against §3.
// ═══════════════════════════════════════════════════════════════════════════════
function buildOneForgewing(M, d) {
  const hs = d.halfSpan;          // semi-span from the BODY MIDLINE (§3: hs = spanScale · 4.2)
  const X0 = d.rootX;             // the torso's published wing root, in model space
  const NDIG = Math.max(2, Math.min(4, d.digits));
  // §7.4: L and R differ by SEED. Weathering asymmetry is free and mandatory; the
  // rig stays Δ0.000 (§2.6 — asymmetry lives in geometry seed and history, never in
  // phase). The seed drives temper-ring placement, ash break-up and the cord-end
  // tooth train; it never moves a joint, a landmark or a spar.
  const seedSide = d.seed ?? 0;
  let propSurface = null;         // the propatagium sail as f(u, r) — filled in §5.2 below

  const arm = new THREE.Group(), fore = new THREE.Group(), hand = new THREE.Group(), root = new THREE.Group(), frame = new THREE.Group();

  // per-(group) per-material accumulators → a handful of draws (the Tempest batching discipline)
  const accs = new Map();
  const push = (g, mat, ...tris) => {
    let m = accs.get(g); if (!m) accs.set(g, m = new Map());
    let a = m.get(mat); if (!a) m.set(mat, a = []);
    for (const t of tris) a.push(t);
  };
  const flush = (g) => { const m = accs.get(g); if (!m) return; for (const [mat, tris] of m) if (tris.length) g.add(flatTriMesh(tris, mat)); };
  const quad = (g, mat, a, b, c, e) => push(g, mat, [a, b, c], [a, c, e]);

  // ── I2: THE MEMBRANE VERTEX (§6.1) ──────────────────────────────────────────
  // A membrane vertex is position + the vec4 `aMem` payload + a tier multiplier:
  //   MV(p, band, chord, d, edge, tier)
  //     p     the position; its span fraction from the BODY MIDLINE becomes aMem.x — the
  //           field UV and every territory rule ("no cords inboard of 0.30", "arteries
  //           die before 0.60") is written against it, so a rescale changes nothing
  //     band  which ATLAS band this surface lives in, chord 0..1 inside it (aMem.y)
  //     d     optical thickness, §6.1's [0.30, 3.60] with nominal 0.90 (aMem.z)
  //     edge  1 on a FREE hem edge — the only place §6.3's Fresnel fringe survives (aMem.w)
  //     tier  index into MEM_TIERS, the front-lit value band (vertex colour)
  const tSpan = (p) => (p[0] + X0) / hs;
  // §9's graded VERMILION BAND, carried in vertex colour instead of one triangle of a
  // separate material: a warm blush over the inboard 0.10–0.42 of the span, where blood
  // first shows through and the scale field dies out. It is also the measured fix for the
  // last surviving cool patch — the root gusset is the ONE place d reaches 3.6, so no
  // transmitted warmth can reach it and its diffuse was left to the stage's blue rim.
  // The GREEN channel is deliberately untouched by the blush, so the harness can read the
  // §5.5 tier straight out of it (a blush on all three would make the tier unmeasurable).
  const BLUSH = [1.46, 1.00, 0.26];
  const MVc = (p, band, chord, d, edge, mul) => {
    const t = Math.max(0, Math.min(1, tSpan(p)));
    const b = 1 - Math.max(0, Math.min(1, (t - 0.10) / 0.32));
    return [p[0], p[1], p[2], t, atlasV(band, chord), Math.max(0.30, Math.min(3.60, d)), edge,
      mul * (1 + (BLUSH[0] - 1) * b), mul, mul * (1 + (BLUSH[2] - 1) * b)];
  };
  const MV = (p, band, chord, d, edge, tier) =>
    MVc(p, band, chord, d, edge, MEM_TIERS[Math.max(0, Math.min(MEM_TIERS.length - 1, tier))]);
  const MVh = MVc;
  const memAcc = new Map();
  const memTri = (g, a, b, c) => { let a2 = memAcc.get(g); if (!a2) memAcc.set(g, a2 = []); a2.push(a, b, c); };
  const memQuad = (g, a, b, c, e) => { memTri(g, a, b, c); memTri(g, a, c, e); };
  const flushMem = (g, tag) => {
    const vs = memAcc.get(g); if (!vs || !vs.length) return;
    const n = vs.length;
    const pos = new Float32Array(n * 3), am = new Float32Array(n * 4), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = vs[i];
      pos[i * 3] = v[0]; pos[i * 3 + 1] = v[1]; pos[i * 3 + 2] = v[2];
      am[i * 4] = v[3]; am[i * 4 + 1] = v[4]; am[i * 4 + 2] = v[5]; am[i * 4 + 3] = v[6];
      col[i * 3] = v[7]; col[i * 3 + 1] = v[8]; col[i * 3 + 2] = v[9];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aMem', new THREE.BufferAttribute(am, 4));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, M.mem);
    mesh.userData.wlSurface = tag || 'membrane';   // harness tag: the tier/polarity probe masks on it
    g.add(mesh);
  };

  // ── I3: THE FIRE / EMBER / TEMPER ACCUMULATORS ──────────────────────────────
  // Same discipline as the membrane: one accumulator per (group, system), flushed
  // into ONE mesh, so the whole §7 fire system costs 2 draws per wing (zone A + B +
  // the recruited stages on `arm`; the ember shed on `hand`) and temper costs 1.
  //
  // A fire vertex is  { p, t (temperature × on FIRE_EMISSIVE), stage, rhythm, phase }.
  // Every triangle carries ONE stage on all three of its verts — the buffer is
  // non-indexed, so a state border is a DISCONTINUITY, which is the whole of §7.1's
  // "an abrupt skip, never feathered" (kill #43) done in geometry rather than
  // begged from a smoothstep.
  const fireAcc = new Map(), embAcc = new Map(), tmpAcc = new Map();
  const fireArea = [0, 0, 0, 0];       // authored surface area per stage → the dump
  const fireMaxT = [0, 0, 0, 0];       // …and how far outboard each stage reaches
  // …and by ZONE, because §7.1's budget table is written per zone (A 2–4%, B 1–3%,
  // C 93–97%) and a state total that lands in band by robbing zone A to pay zone B
  // is a different wing from the one the spec describes.
  const fireZoneArea = { A: 0, B: 0, sec: 0, outer: 0, cap: 0 };
  let fireZone = 'A';
  const triArea = (a, b, c) => 0.5 * len3(cross3(sub3(b, a), sub3(c, a)));
  const FV = (p, temp, stage, rhythm, phase) => ({ p, temp, stage, rhythm, phase });
  const fireTri = (g, A, B, C) => {
    let arr = fireAcc.get(g); if (!arr) fireAcc.set(g, arr = []);
    // the panes are VENTRAL: wind every triangle so its face normal points DOWN, and
    // the FrontSide material then culls it from every dorsal view for free. That is
    // §7.1's withheld radiator as a render state, not as an art note (kill #44).
    const n = cross3(sub3(B.p, A.p), sub3(C.p, A.p));
    if (n[1] > 0) arr.push(A, C, B); else arr.push(A, B, C);
    const st = Math.max(0, Math.min(3, A.stage | 0));
    const ar = triArea(A.p, B.p, C.p);
    fireArea[st] += ar; fireZoneArea[fireZone] += ar;
    for (const v of [A, B, C]) fireMaxT[st] = Math.max(fireMaxT[st], (v.p[0] + X0) / hs);
  };
  const fireQuad = (g, A, B, C, D) => { fireTri(g, A, B, C); fireTri(g, A, C, D); };
  const flushFire = (g, tag) => {
    const vs = fireAcc.get(g); if (!vs || !vs.length) return;
    const n = vs.length;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), af = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const v = vs[i];
      pos[i * 3] = v.p[0]; pos[i * 3 + 1] = v.p[1]; pos[i * 3 + 2] = v.p[2];
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v.temp;
      af[i * 4] = v.stage; af[i * 4 + 1] = v.rhythm; af[i * 4 + 2] = v.phase; af[i * 4 + 3] = v.temp;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aFire', new THREE.BufferAttribute(af, 4));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, M.fire);
    mesh.userData.wlSurface = 'fire';      // the fire probe masks on this
    mesh.onBeforeRender = () => { const u = M.fire.userData.surfaceUniforms; if (u && u.uFireTime) u.uFireTime.value = fireClock(); };
    g.add(mesh);
  };
  const flushEmbers = (g) => {
    const vs = embAcc.get(g); if (!vs || !vs.length) return;
    const n = vs.length;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), ae = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const v = vs[i];
      pos[i * 3] = v.p[0]; pos[i * 3 + 1] = v.p[1]; pos[i * 3 + 2] = v.p[2];
      col[i * 3] = v.c[0]; col[i * 3 + 1] = v.c[1]; col[i * 3 + 2] = v.c[2];
      ae[i * 4] = v.seed; ae[i * 4 + 1] = v.rate; ae[i * 4 + 2] = v.travel; ae[i * 4 + 3] = v.rod;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aEmb', new THREE.BufferAttribute(ae, 4));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, M.ember);
    mesh.frustumCulled = false;            // the pool's verts sit at spawn; the shader flies them
    mesh.renderOrder = 3;
    mesh.userData.wlSurface = 'ember';
    mesh.userData.wlFX = true;             // FX, not silhouette — the black tiles skip it
    mesh.onBeforeRender = () => { const u = M.ember.userData.surfaceUniforms; if (u && u.uEmbTime) u.uEmbTime.value = fireClock(); };
    g.add(mesh);
  };
  // §7.4 temper: per-FACE colour on faces the tube already had, so the oxide series
  // costs one draw and zero triangles.
  const pushTemper = (g, a, b, c, e, col) => {
    let arr = tmpAcc.get(g); if (!arr) tmpAcc.set(g, arr = []);
    for (const p of [a, b, c, a, c, e]) arr.push({ p, col });
  };
  const flushTemper = (g) => {
    const vs = tmpAcc.get(g); if (!vs || !vs.length) return;
    const n = vs.length;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = vs[i].p[0]; pos[i * 3 + 1] = vs[i].p[1]; pos[i * 3 + 2] = vs[i].p[2];
      col[i * 3] = vs[i].col[0]; col[i * 3 + 1] = vs[i].col[1]; col[i * 3 + 2] = vs[i].col[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, M.temper));
  };

  // ── §3 LANDMARKS ─────────────────────────────────────────────────────────────
  // `t` is the fraction of the semi-span measured from the BODY MIDLINE, so a landmark's
  // WORLD x is exactly t·hs; wing-local x is t·hs − X0 (the pivot sits at X0, just inboard
  // of the glenoid, buried in the root fairing — §9 "the glenoid inside the fairing").
  // Gap rhythm root→tip 0.09 · 0.19 · 0.22 · 0.18 · 0.15 · 0.17 — the forearm is the
  // LONGEST gap, two joints live outboard of ⅔ span, nothing is evenly spaced (§12 kill #2).
  const P = (t, y, z) => [t * hs - X0, y * hs, z * hs];
  const S = P(0.090, 0.030, 0.020);    // shoulder / glenoid
  const E = P(0.280, 0.125, 0.005);    // elbow — gull-arch crest; included angle ≈150° (§12 kill #10)
  const K = P(0.500, 0.158, -0.110);   // WRIST / carpal apex — forward-most point of the "‹"
  const MCP3 = P(0.680, 0.150, -0.040);
  const PIP3 = P(0.830, 0.120, 0.050);   // ph2 (0.83→1.00) OUT-RUNS ph1 (0.68→0.83) — §12 kill #3
  const TIP3 = P(1.000, 0.075, 0.170);   // span is PINNED here
  // heraldic back-curved tip hook (≤0.06·hs) — the ONLY claw outboard of the carpal cluster
  const HOOK3 = add3(TIP3, [0.026 * hs, -0.017 * hs, 0.036 * hs]);

  // Leading-edge shape: gull ARCH in Y crest between elbow and wrist, swan-neck OGEE in Z
  // (root → elbow → wrist apex forward-most at −0.11·hs → digit III sweeps back to the tip).
  // In plan it is a "‹", never a monotone backsweep (§12 kill #12).
  const armPath = [S, lerp3(S, E, 0.5), E, lerp3(E, K, 0.5), K];
  const dig3 = [K, MCP3, PIP3, TIP3];

  // ── THE CARPAL BLOCK ─────────────────────────────────────────────────────────
  // The four metacarpal bases sit SIDE BY SIDE across the palm, not on one point: the fan
  // ORIGINS are clustered at the wrist but spread aft/down over a real carpus. This is what
  // gives the armwing a real chord where it meets the hand (a TE that collapses onto the LE
  // at the wrist is a pinch) and is the anatomical answer to §12 kill #17 (no human palm).
  const carpal = (f) => add3(K, [0.020 * hs * f, -0.050 * hs * f, 0.200 * hs * f]);
  const CARP_F = [0, 0.30, 0.65, 1.00];

  // ── THE FAN (§3 table) ───────────────────────────────────────────────────────
  // Length × digit-III spar run · fan azimuth off the LE direction · droop (rad).
  // Dominant + decay, never a picket fence. ±3° DETERMINISTIC azimuth jitter on IV–VI.
  const FAN_LEN = [1.00, 0.84, 0.68, 0.50];
  const FAN_AZ = [0, 24, 43, 61];
  const FAN_DROOP = [0.05, 0.13, 0.22, 0.32];
  const runIII = len3(sub3(TIP3, K));
  const phiIII = Math.atan2(TIP3[2] - K[2], TIP3[0] - K[0]);          // chord azimuth of the dominant digit
  const mcVec = sub3(MCP3, K), mcLen = len3(mcVec);
  const phiPalm = Math.atan2(mcVec[2], mcVec[0]);                      // the palm bundle's azimuth
  const gullDecay = 0.054 * hs;                                        // shared arch decay outboard of the crest

  // Build each digit as a 4-node chain: carpal origin → MCP → PIP → tip.
  const digits = [dig3];
  for (let i = 1; i < NDIG; i++) {
    const az = phiIII + (FAN_AZ[i] + wjit(i * 3 + 1, 3)) * D2R;        // ±3° per §3
    const L = runIII * FAN_LEN[i];
    const R = L * Math.cos(FAN_DROOP[i]);
    const drop = L * Math.sin(FAN_DROOP[i]) + gullDecay * FAN_LEN[i];
    const O = carpal(CARP_F[i]);
    const tip = [K[0] + R * Math.cos(az), K[1] - drop, K[2] + R * Math.sin(az)];
    // metacarpals are NEAR-EQUAL and leave the carpus as a narrow bundle — the fan opens at
    // the KNUCKLES (§12 kill #4). The palm only takes 30% of the digit's fan angle.
    const azP = phiPalm + (FAN_AZ[i] * 0.30) * D2R;
    const mcL = mcLen * (1 - 0.04 * i);                                 // 1.00 / 0.96 / 0.92 — near-equal
    const mcp = [O[0] + mcL * Math.cos(azP), O[1] - 0.020 * hs - 0.012 * hs * i, O[2] + mcL * Math.sin(azP)];
    // ph1 : ph2 = 0.469 : 0.531 — ph2 out-runs ph1 on every digit (the long–short–long rhythm)
    const pip = lerp3(mcp, tip, 0.469);
    const bow = mul3(norm3(cross3(sub3(tip, mcp), [0, 1, 0])), -0.045 * len3(sub3(tip, mcp)));
    digits.push([O, mcp, add3(pip, bow), tip]);
  }
  const tips = digits.map((c) => c[c.length - 1]);
  const W6 = carpal(CARP_F[NDIG - 1]);   // the armwing's outboard trailing corner = the last digit's base

  // ── SPAR TAPER (§4) ──────────────────────────────────────────────────────────
  // TWO regimes, break at the wrist: the inner half BARELY tapers, the outer half is a whip.
  // A straight cone root→tip is ruled out (§12 kill #6). Root diameter 0.137 × root chord
  // → humerus slenderness ≈ 4.3 : 1 (a MAST, not a bone; slenderer than 6:1 is kill #5).
  const TAPER = [[0.09, 1.00], [0.28, 0.86], [0.50, 0.62], [0.77, 0.33], [0.92, 0.15], [1.00, 0.10]];
  const sparF = (t) => {
    if (t <= TAPER[0][0]) return TAPER[0][1];
    for (let i = 0; i < TAPER.length - 1; i++) {
      if (t <= TAPER[i + 1][0]) { const f = (t - TAPER[i][0]) / (TAPER[i + 1][0] - TAPER[i][0]); return TAPER[i][1] + (TAPER[i + 1][1] - TAPER[i][1]) * f; }
    }
    return TAPER[TAPER.length - 1][1];
  };
  const r0 = 0.025 * hs;   // ROOT RADIUS (diameter 0.050·hs ≈ 13.7% of root chord)

  // ── THE PIPE ─────────────────────────────────────────────────────────────────
  // A swept N-gon tube. Not a tent: edge-on (40% of the beat) it has real depth, and where
  // I2/I3 crack or backlight it, the section reads as a TUBE — bright rim, dark core — never
  // a solid rod (§4 / §12 kill #7). Up-facing faces take the ASH material; the rest is char.
  // Knuckles are extra stations with a fattened radius, so the joint is a BUMP IN THE
  // OUTLINE for free (§12 kill #8: the hosepipe arm).
  // `temperF(s, k)` (§7.4, optional) returns an oxide tint for the face at normalised
  // station `s` and facet `k`, or null for bare char. It only ever RE-ROUTES a face
  // the tube was going to draw anyway.
  function tube(g, stations, sides, capMat, seedPhase = 0, temperF = null) {
    const rings = [];
    for (let i = 0; i < stations.length; i++) {
      const p = stations[i].p, r = stations[i].r;
      const dir = norm3(sub3(stations[Math.min(i + 1, stations.length - 1)].p, stations[Math.max(i - 1, 0)].p));
      let up = Math.abs(dir[1]) > 0.92 ? [0, 0, 1] : [0, 1, 0];
      const u = norm3(cross3(dir, up)), v = norm3(cross3(u, dir));
      const ring = [], nrm = [], nrmZ = [];
      const phase = Math.PI / 2 - Math.PI / sides;   // put a FLAT FACE straight up (for the ash)
      for (let k = 0; k < sides; k++) {
        const th = phase + (k / sides) * Math.PI * 2;
        ring.push([p[0] + r * (Math.cos(th) * u[0] + Math.sin(th) * v[0]),
                   p[1] + r * (Math.cos(th) * u[1] + Math.sin(th) * v[1]),
                   p[2] + r * (Math.cos(th) * u[2] + Math.sin(th) * v[2])]);
        const thm = phase + ((k + 0.5) / sides) * Math.PI * 2;
        nrm.push(Math.cos(thm) * u[1] + Math.sin(thm) * v[1]);    // this face's world-Y
        nrmZ.push(Math.cos(thm) * u[2] + Math.sin(thm) * v[2]);   // …and its world-Z (windward = −Z)
      }
      rings.push({ ring, nrm, nrmZ });
    }
    // §7.3: ash settles on UP-FACING dorsal faces and WINDWARD sides — never a uniform wash.
    // The face→material map is decided ONCE, off the mid-station, and then held constant
    // down the whole tube. Deciding it per ring instead lets faces that sit near the
    // threshold flip on and off as the chain curves, which paints a regular tan SAWTOOTH
    // along the bone — a saw blade, not a basalt pipe (it is exactly the "flat-tape bones"
    // cheap tell wearing a different hat, and the first render had it).
    const mid = rings[Math.floor(rings.length / 2)];
    const ashFace = [];
    for (let k = 0; k < sides; k++) ashFace.push(mid.nrm[k] > 0.55 || (mid.nrm[k] > -0.15 && mid.nrmZ[k] < -0.55));
    for (let i = 0; i < rings.length - 1; i++) {
      const A = rings[i], B = rings[i + 1];
      for (let k = 0; k < sides; k++) {
        const k2 = (k + 1) % sides;
        // …and it BREAKS along the length. An unbroken pale strip running the whole bone is
        // FLAT-TAPE BONES — a constant-width near-white quad standing proud on a dark
        // membrane, the tell this repo has already rejected twice. Ash is dust: it sits in
        // runs and the slipstream scours it off the rest, so the dusting is gated by a
        // deterministic low-frequency function (runs of 2–4 quads, ~60% duty) and the bone
        // reads as a mottled basalt pipe instead of white tape on black cardstock.
        const dusted = ashFace[k] && Math.sin(i * 0.9 + k * 2.1 + seedPhase) > -0.15;
        // §7.4: temper rings ride the faces ash did NOT take — the film forms on bare
        // metal, and where ash has settled there is no bare metal to oxidise.
        const tc = dusted ? null : (temperF ? temperF(i / Math.max(1, rings.length - 2), k) : null);
        if (tc) pushTemper(g, A.ring[k], A.ring[k2], B.ring[k2], B.ring[k], tc);
        else quad(g, dusted ? M.ash : M.bone, A.ring[k], A.ring[k2], B.ring[k2], B.ring[k]);
      }
    }
    if (capMat) {   // close the outboard tip so a fingertip is never a hollow straw
      const last = rings[rings.length - 1].ring, c = stations[stations.length - 1].p;
      for (let k = 0; k < sides; k++) push(g, capMat, [last[k], last[(k + 1) % sides], c]);
    }
  }
  // Expand a bone chain into tube stations, fattening a KNUCKLE at each interior node.
  function boned(chain, rAt, knuckle) {
    const st = [];
    for (let i = 0; i < chain.length; i++) {
      const s = i / (chain.length - 1);
      if (i > 0 && i < chain.length - 1) {
        // pre-knuckle / knuckle / post-knuckle: the thickening reads as an outline bump
        st.push({ p: lerp3(chain[i - 1], chain[i], 0.80), r: rAt(s - 0.06) });
        st.push({ p: chain[i], r: rAt(s) * knuckle });
        st.push({ p: lerp3(chain[i], chain[i + 1], 0.20), r: rAt(s + 0.06) });
      } else st.push({ p: chain[i], r: rAt(s) });
    }
    return st;
  }

  // ── THE ARM (humerus + forearm) ──────────────────────────────────────────────
  // Shoulder→elbow→wrist, with the elbow held at ~150° included so the arm NEVER reads
  // straight while the propatagium exists. Split across the elbow joint: the HUMERUS rides
  // `pivot`, the FOREARM rides `fore` (the elbow's −anchor). Both tubes share the fattened
  // elbow ring, and the joint's rotation centre IS that ring, so the knuckle stays closed
  // no matter what I4 later does with the joint.
  {
    const rAt = (t) => r0 * sparF(t);
    const rElbow = rAt(0.280) * 1.42;   // the knuckle thickening — a real bump in the outline
    // §7.4 TEMPER — the oxide series runs OUTWARD from the hot root: grey-black at the
    // glenoid (hottest, and hot longest — the film thickens with temperature AND with
    // time) through blue · violet · red-brown · golden, ending BARE by the elbow. The
    // outer spars are already at "bare" — the end of the series — which is exactly what
    // §7.4 means by the inner spars sitting further along it, and it is why there is no
    // temper out on the fingers. Low-value tints, zero emissive: this is the COOL
    // complement that §7.3 says must exist between systems, and the only legal blue on
    // the creature — it lives on the SKELETON, never on the membrane.
    // The series is a function of the STATION, not of the facet. Letting the facet index
    // pick the colour paints a candy-stripe of blue and violet around the circumference,
    // which at 4× reads as a row of blue teeth — flat-tape bones in a new colour. An oxide
    // film grows in BANDS around a hot bone, so the bands are what gets built; only the
    // band EDGES wander, seeded, and the seed differs L/R so the two wings have different
    // histories (§7.4) while the rig stays Δ0.000.
    const temperArm = (s) => {
      const idx = s * 5.2 + 0.10 + wjit(Math.round(s * 8) + seedSide * 97, 0.45);
      if (idx >= 4.6) return null;                 // bare — hand the face back to the char bucket
      return TEMPER[Math.max(0, Math.min(4, Math.round(idx)))];
    };
    // …and the humerus gets two more stations so the series has somewhere to LIVE. At four
    // stations the tube has three quad rows, i.e. three possible bands, and a six-step
    // series compressed into three steps is not a ring set — it is three arbitrary colours.
    tube(arm, [{ p: S, r: rAt(0.090) }, { p: lerp3(S, E, 0.28), r: rAt(0.143) },
               { p: lerp3(S, E, 0.55), r: rAt(0.195) }, { p: lerp3(S, E, 0.72), r: rAt(0.227) },
               { p: lerp3(S, E, 0.88), r: rAt(0.258) }, { p: E, r: rElbow }], 5, null, 0.4, temperArm);
    tube(fore, [{ p: E, r: rElbow }, { p: lerp3(E, K, 0.14), r: rAt(0.310) },
                { p: lerp3(E, K, 0.62), r: rAt(0.416) }, { p: K, r: rAt(0.500) * 1.30 }], 5, null, 1.1);
    // §4: short raised RIDGES at the high-moment stations (shoulder / elbow / wrist) — the
    // visible answer to thin-wall bracing, and three more bumps on the edge-on polyline.
    const ridge = (g, node, r) => {
      const dir = norm3(sub3(K, S));
      const side = norm3(cross3(dir, [0, 1, 0]));
      const a = add3(node, mul3(dir, -r * 1.5)), b = add3(node, mul3(dir, r * 1.5));
      const top = add3(node, [0, r * 1.75, 0]);
      push(g, M.ash, [a, add3(node, mul3(side, r * 0.9)), top], [add3(node, mul3(side, r * 0.9)), b, top]);
      push(g, M.bone, [a, top, add3(node, mul3(side, -r * 0.9))], [add3(node, mul3(side, -r * 0.9)), top, b]);
    };
    ridge(arm, S, rAt(0.090));
    ridge(arm, E, rAt(0.280) * 0.86);
    ridge(fore, K, rAt(0.500) * 0.62);
  }

  // ── THE DIGITS ───────────────────────────────────────────────────────────────
  // Digit III continues the leading edge and carries the tip hook; IV–VI are thinner.
  const sparSamples = [];      // per-digit spar samples the membrane WELDS to
  const NS = 4;                // spanwise rows per bay
  for (let i = 0; i < NDIG; i++) {
    const chain = digits[i];
    const wScale = i === 0 ? 1 : Math.pow(FAN_LEN[i], 0.5);
    const tOf = (s) => 0.500 + Math.max(0, Math.min(1, s)) * 0.500 * FAN_LEN[i];
    const st = boned(chain, (s) => r0 * sparF(tOf(s)) * wScale, 1.34);
    tube(hand, st, i === 0 ? 5 : 4, M.bone, i * 1.7);
    const samples = [];
    for (let k = 0; k <= NS; k++) samples.push(pathSample(chain, k / NS));
    sparSamples.push({ samples, chain, rAt: (s) => r0 * sparF(tOf(s)) * wScale });
  }
  // THE ONE TIP HOOK — heraldic, back-curved, ≤0.06·hs. Zero claws on trailing fingers,
  // zero bare bone past the hem anywhere else (§3 / §12 kill #16).
  {
    const rT = r0 * sparF(1.0);
    tube(hand, [{ p: TIP3, r: rT }, { p: lerp3(TIP3, HOOK3, 0.55), r: rT * 0.62 }, { p: HOOK3, r: rT * 0.10 }], 4, M.claw);
  }

  // ── THE CARPAL CLAW CLUSTER (§3) ─────────────────────────────────────────────
  // Thumb + 2 stubs, 0.18–0.22 × the digit-III spar run, projecting FORWARD-AND-DOWN —
  // opposed to the swept fingers. This is the silhouette's punctuation mark at mid-span and
  // the only claw on the wing besides the tip hook. It also carries ground contact (§8.3).
  {
    const CLUS = [[-52, 0.22, 0.35, 1], [-22, 0.15, 0.28, 0], [-86, 0.13, 0.40, 0]];
    for (let i = 0; i < Math.min(CLUS.length, 1 + d.clusterStubs); i++) {
      const [azDeg, lf, droop, clawed] = CLUS[i];
      const az = phiIII + azDeg * D2R, L = runIII * lf;
      const R = L * Math.cos(droop), drop = L * Math.sin(droop);
      const base = add3(K, [0.01 * hs, -0.02 * hs, 0.01 * hs]);
      const tip = [base[0] + R * Math.cos(az), base[1] - drop, base[2] + R * Math.sin(az)];
      const mid = add3(lerp3(base, tip, 0.55), [0, 0.02 * hs, 0]);   // a knuckled, not straight, digit
      const rB = r0 * sparF(0.50) * 0.52;
      tube(hand, [{ p: base, r: rB }, { p: mid, r: rB * 0.92 }, { p: tip, r: rB * 0.34 }], 4, clawed ? null : M.bone);
      if (clawed) {   // the ONE carpal claw: a short recurved horn
        const cl = add3(tip, [-0.020 * hs, -0.042 * hs, -0.030 * hs]);
        tube(hand, [{ p: tip, r: rB * 0.34 }, { p: lerp3(tip, cl, 0.5), r: rB * 0.22 }, { p: cl, r: rB * 0.04 }], 4, M.claw);
      }
    }
  }

  // ── THE MEMBRANE ─────────────────────────────────────────────────────────────
  // Bays are PER-FINGER LOBES welded to their own finger's spar samples, overlapping the
  // neighbouring bay by ~9% under the spar's dark side (§5.4). Three mandatory mitigations
  // against the Tempest shard-plate read, all live here:
  //   (1) the overlap hides in the spar shadow line, its seam running ALONG the finger,
  //   (2) value tiers are a function of BILLOW DEPTH, which is continuous across the seam,
  //       so no value step ever marks it,
  //   (3) in flight poses the furl array is identically zero (I4 publishes it; I1 has none),
  //       so the spread wing is one continuous skin to the eye.
  // Camber (§5.3): ventral cup-down, sag NADIR AT 40% CHORD (never mid-chord, never the TE),
  // inboard SOFT (0.08c) and outboard TIGHT (0.045c) — the drum-tight-inner/floppy-outer
  // wing is exactly inverted (§12 kill #27). Every trailing arc is sampled at 8 segments.
  const NC = 8;                       // chordwise columns across the ARMWING (the free trailing arc's segment count)
  const NCB = 16;                     // …and across a finger BAY: 8 master cords need 16 columns (§6.4)
  const OVER = 0.09;                  // the hidden inter-bay overlap (§5.4: 8–10%)
  let dumpPro = null;                 // measured propatagium numbers, for the verify dump
  // §5.5: 4 tiers banded by BILLOW DEPTH — taut-near-spar lightest, deep cup darkest, with
  // index-hash jitter. The ramp is deliberately STEEP (pow 0.45): billow falls to zero at
  // BOTH spars, so a linear ramp paints a two-column pale ribbon straddling every finger —
  // measured on the planform sheet, that reads as a row of light shard plates, not as a
  // sheet catching light beside a bone. The steep ramp keeps the light tier down to the
  // strip immediately against the spar, where the membrane really is taut.
  const tierOf = (billow, maxB, idx) => {
    const q = Math.pow(Math.max(0, Math.min(1, billow / (maxB || 1))), 0.80) * 3 + wjit(idx, 0.42);
    return Math.max(0, Math.min(3, Math.round(q)));
  };
  // sag profile across the chord: peaks at c≈0.4 (w = c^0.72 → 4w(1−w) peaks at c = 0.383)
  const sagShape = (c) => { const w = Math.pow(Math.max(0, Math.min(1, c)), 0.72); return 4 * w * (1 - w); };

  // ── §6.1 THE THICKNESS ATTRIBUTE — the load-bearing float ────────────────────
  // d_geo ∈ [0.30, 3.60] (nominal 0.90), authored as the MAX of four terms and then
  // MULTIPLIED (in the shader, §6.4) by the cord/vein field. The terms are the four
  // places a real membrane's optical path genuinely lengthens:
  // Each returns ZERO outside its own territory, so `max(base, …)` lets the BASE fall to
  // §6.2's 0.5×-nominal pale-amber stretch where nothing thickens the sheet. (Giving each
  // term a 0.90 floor instead would pin the whole wing at nominal and delete the brightest
  // backlit tier — the taut inter-digital stretch — from the spec.)
  const D_ROOT = (t) => 3.60 * Math.max(0, Math.min(1, (0.34 - t) / 0.24));  // gusset → 3.60
  const D_SPAR = (q) => 3.00 * Math.max(0, Math.min(1, 1 - q));   // within one spar radius → 3.00
  const D_CUP = (f) => 1.80 * Math.max(0, Math.min(1, f));        // the deepest sag is the longest path → 1.80
  const D_HEM = (t, f) => f * (1.00 + 1.50 * Math.max(0, Math.min(1, t)));   // the hem band, 1.0 → 2.5 tipward
  // …and the BASE, which is what makes the deepest cup the DARKEST backlit tier while the
  // taut inter-digital stretch is the brightest: the outboard bays are drum-taut and THIN
  // (0.5× nominal = §6.2's pale-amber row), the inboard sheet is soft and nominal.
  // The trailing polyline is collected as TWO RUNS, because between them the free edge is
  // the last digit's BONE (the spar itself is the edge out to tipVI) and the hem must not
  // band across it: run A = the armwing arc B→W6, run B = the bay scallops tipVI→…→tipIII.
  // Each entry carries an inward reference point so the hem can be a constant-width cord.
  const hemArm = [], hemBays = [];

  // -- the ARMWING / plagiopatagium -------------------------------------------
  // THE ROOT, REBUILT (I1.1). The first pass anchored the inboard-aft corner far down the
  // flank, inside the rotating wing group, with a near-straight free edge running to it.
  // That ONE mistake produced three separate symptoms: a square black slab in the pure-black
  // tile, a flat card catching the rim light at apex, and 0.77 u of measured root travel over
  // the beat. It is the shipped Revenant trap: a vertex that must read as attached to the
  // BODY cannot live in a group that ROTATES with the limb.
  //
  // The fix splits the job between the two frames that actually own it:
  //   • the WING sheet's inboard corner sits exactly ON the pivot — the one point a rotation
  //     about the pivot cannot move — so root drift is identically zero, and the root reads
  //     as a CUSP, not a corner: there is no inboard edge to be square;
  //   • flank coverage back to the hip becomes a BODY-FRAME SKIRT (below, in `frame`), which
  //     never rotates, and the wing sheet laps over its forward end.
  // The trailing edge is a quadratic bezier that bows AFT out of that cusp before curving
  // forward into the carpal block, so no run of it is straight and it meets nothing at 90°.
  const RT = [0, 0, 0];                       // inboard-aft cusp — ON the pivot. Drift ≡ 0.
  const armLead = (u) => add3(pathSample(armPath, u), [0, -r0 * sparF(0.09 + u * 0.41) * 0.55, 0]);
  const bez = (a, c, b, t) => { const m = 1 - t; return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0],
    m * m * a[1] + 2 * m * t * c[1] + t * t * b[1], m * m * a[2] + 2 * m * t * c[2] + t * t * b[2]]; };
  const TE_CTRL = [0.160 * hs, -0.028 * hs, 0.440 * hs];   // aft-and-down: the sheet's belly
  const armTrail = (u) => bez(RT, TE_CTRL, W6, u);
  // The plagiopatagium as a FUNCTION of (u, c), factored out of the loft below
  // because I3's forge window and artery lines must land exactly ON that surface,
  // not near it. Two independent copies of one profile formula is the Vesper
  // trail-detach bug wearing a new costume; there is one copy and both consume it.
  const armChord = (u) => len3(sub3(armTrail(u), armLead(u))) || 1e-6;
  const armSurface = (u, c) => {
    const leL = armLead(u), te = armTrail(u);
    const chord = len3(sub3(te, leL)) || 1e-6;
    const p = lerp3(leL, te, c);
    p[1] -= 0.080 * chord * sagShape(c) * (0.35 + 0.65 * u);   // the SOFT inboard sheet (0.08c)
    return p;
  };
  {
    const NU = 8;
    const grid = [], chords = [], raw = [];
    for (let k = 0; k <= NU; k++) {
      const u = k / NU;
      chords.push(armChord(u));
      const row = [], praw = [];
      for (let j = 0; j <= NC; j++) {
        const p = armSurface(u, j / NC);
        praw.push(p); row.push(p);
      }
      grid.push(row); raw.push(praw);
    }
    const maxB = 0.080 * Math.max(...chords);
    // per-vertex §6.1 payload. The plagiopatagium is the SOFT, nominal-thickness sheet
    // (§5.3's anisotropy law: inboard soft, outboard tight) — base 1.00 at the root
    // falling to 0.84 at the wrist, so the value ladder still darkens into the cup.
    const mvAt = (k, j) => {
      const p = grid[k][j], u = k / NU, c = j / NC, t = tSpan(p);
      const base = 1.00 - 0.16 * u;
      const sagN = sagShape(c) * (0.35 + 0.65 * u);
      const qSpar = (c * chords[k]) / (r0 * sparF(0.09 + u * 0.41) * 2.2 || 1e-6);
      const hemF = Math.max(0, (c - 0.86) / 0.14);
      const d = Math.max(base, D_ROOT(t), D_SPAR(qSpar), D_CUP(sagN), D_HEM(t, hemF));
      return MV(p, ATLAS.sheet, c, d, 0, tierOf(chords[k] * 0.080 * sagN, maxB, 613 + k * 13 + j));
    };
    const mv = [];
    for (let k = 0; k <= NU; k++) { const r = []; for (let j = 0; j <= NC; j++) r.push(mvAt(k, j)); mv.push(r); }
    for (let k = 0; k < NU; k++) for (let j = 0; j < NC; j++) {
      if (k === 0) {
        // §9: the scale→membrane transition is a GRADED VERMILION BAND, never a hard straight
        // line where scales stop and membrane starts (§12 kill #31). The body-side triangle of
        // the root strip takes the warm blush, the outboard triangle its membrane tier, so the
        // band ramps instead of ending on an edge. Zero extra triangles. Authored DARK —
        // measured at shop distance, a saturated band is a red stripe painted on the root.
        push(arm, M.band, [raw[k][j], raw[k][j + 1], raw[k + 1][j + 1]]);
        memTri(arm, mv[k][j], mv[k + 1][j + 1], mv[k + 1][j]);
      } else memQuad(arm, mv[k][j], mv[k][j + 1], mv[k + 1][j + 1], mv[k + 1][j]);
    }
    for (let k = 0; k <= NU; k++) hemArm.push({ p: grid[k][NC], ref: grid[k][NC - 1] });
  }

  // -- the HANDWING bays -------------------------------------------------------
  const bayArcs = [];
  for (let i = 0; i < NDIG - 1; i++) {
    const A = sparSamples[i], B = sparSamples[i + 1];
    const sagFrac = 0.052 - 0.004 * i;                     // outboard bays are the tightest
    // §5.4: TE scallop depth is 0.22–0.30 OF BAY WIDTH — an absolute distance, not a
    // fraction of the run back to the wrist. Lerping the free edge toward K (the shipped
    // Tempest move) cuts ~67% of the bay out on a fan this long and strands the fingertips
    // as bare spikes past the hem — §12 kill #16, and the reason the first render failed.
    const bayW = len3(sub3(B.samples[NS], A.samples[NS])) || 1e-6;
    const scallop = (0.22 + 0.03 * i) * bayW;
    const grid = [];
    // §6.4 THE MASTER CORDS. The 8–10 largest cords per outer bay are REAL RELIEF, not
    // shader: a painted cord cannot catch the grazing sheen and cannot put cord-end teeth
    // on the free edge. That needs chord columns to resolve them, so the bays run at
    // NCB = 16 (Nyquist for 8 ridges) against the armwing's 8 — the extra triangles buy
    // EDGES, which is exactly where §11 says to spend them.
    const NMC = 8;
    const cordRelief = (c, s) => 0.0035 * hs * Math.pow(s, 0.7)
      * Math.sin(Math.PI * Math.min(1, c)) * Math.cos(2 * Math.PI * NMC * c);
    // ── R3(b): THE PICKET FENCE, KILLED ──────────────────────────────────────
    // I2 cut the cord-end teeth as a cosine comb — NMC identical triangles at
    // identical pitch and identical height. At 4× that is a machine saw on an
    // article whose entire case is that it is an animal (the flat-tape-bones tell
    // wearing a third costume). The train is now deterministic-JITTERED:
    //   • ±25% PITCH. The bay grid is exactly at Nyquist for 8 teeth (one tooth per
    //     odd column), so a shifted centre cannot be resolved by moving a vertex —
    //     instead each tooth's height is SPLIT across its two neighbouring columns
    //     in proportion to how far its centre has moved, and the apex genuinely
    //     travels along the edge. Same triangle count, real irregularity.
    //   • ±45% HEIGHT, and the whole train decays outboard (bay index) as well as
    //     inboard (the existing s³ ramp).
    //   • an occasional DROPPED tooth — a gap is what a torn fibre net looks like.
    //   • the seed differs L/R (§7.4's mandatory weathering asymmetry). This moves
    //     free-edge vertices by ≤0.02 u; it touches no joint, so the rig symmetry
    //     probe stays Δ0.000 — asymmetry lives in geometry seed and history, never
    //     in the rig (§2.6).
    const TOOTH = [];
    for (let k2 = 0; k2 < NMC; k2++) {
      const j1 = wjit(i * 53 + k2 * 7 + seedSide * 211, 1);
      const j2 = wjit(i * 71 + k2 * 13 + seedSide * 307, 1);
      const dropped = wjit(i * 17 + k2 * 29 + seedSide * 401, 1) > 0.58;
      TOOTH.push({ ctr: (k2 + 0.5) / NMC + j1 * 0.25 / NMC,
        h: dropped ? 0 : (1 + j2 * 0.45) * (1 - 0.30 * k2 / NMC) });
    }
    const toothH = (c) => {
      let v = 0;
      for (const t2 of TOOTH) v += t2.h * Math.max(0, 1 - Math.abs(c - t2.ctr) * NMC * 2);
      return v;
    };
    for (let k = 0; k <= NS; k++) {
      const s = k / NS;
      // the sheet welds to the LOWER flank of each pipe so the bones stand proud above it
      const a = add3(A.samples[k], [0, -A.rAt(s) * 0.55, 0]);
      const b = add3(B.samples[k], [0, -B.rAt(s) * 0.55, 0]);
      const chord = len3(sub3(b, a)) || 1e-6;
      const row = [];
      // columns 0..NCB land exactly on the two spars (c = 0 and c = 1) so every membrane
      // edge IS a bone node; column NCB+1 is the OVERLAP tongue, tapered to zero at the free
      // edge (so no tongue pokes past the tip) and dropped into the spar's shadow line.
      for (let j = 0; j <= NCB + 1; j++) {
        const over = OVER * (1 - Math.pow(s, 1.5));
        const c = j <= NCB ? j / NCB : 1 + over;
        const p = lerp3(a, b, c);
        p[1] -= sagFrac * chord * sagShape(c) * Math.pow(s, 0.6);   // ventral cup, nadir at 40% chord
        p[1] -= cordRelief(c, s);                                   // the master-cord ridges
        if (j > NCB) p[1] -= 0.006 * hs;                            // tuck under the neighbouring lobe
        // the free TE scallop cuts INWARD toward the knuckle (a cupped concave arc, never a
        // convex bump on a plane), deepest mid-bay, fading to zero at both spars and inboard.
        // The cords END on that edge, so it carries fine cord-end TEETH (a tenth of the
        // scallop) — the sourced reason a fibre-netted membrane never has a smooth free edge.
        const teeth = 0.016 * bayW * (1 - 0.18 * i) * Math.pow(s, 3.0)
          * Math.sin(Math.PI * Math.min(1, c)) * toothH(c);
        const sc = scallop * Math.sin(Math.PI * Math.min(1, c)) * Math.pow(s, 2.6) + teeth;
        row.push(add3(p, mul3(norm3(sub3(K, p)), sc)));
      }
      grid.push({ row, chord });
    }
    const maxB = sagFrac * grid[NS].chord;
    // per-vertex §6.1 payload. The finger bays are the DRUM-TAUT, THIN half of §5.3's
    // anisotropy law: base falls to 0.5× nominal outboard, which is §6.2's pale-amber row —
    // the brightest backlit tier lives on the taut inter-digital stretch, and the deep cup
    // (D_CUP → 1.8) is the DARKEST, exactly as the gate requires.
    const mvAt = (k, j) => {
      const g = grid[k], s = k / NS, c = j <= NCB ? j / NCB : 1;
      const p = g.row[j], t = tSpan(p);
      const base = 0.82 - 0.34 * s;
      const cupN = sagShape(c) * Math.pow(s, 0.6);
      const rNear = (c < 0.5 ? A.rAt(s) : B.rAt(s));
      const qSpar = (Math.min(c, 1 - c) * g.chord) / (rNear * 2.2 || 1e-6);
      const hemF = Math.pow(s, 6.0);                       // the hem band hugs the free edge
      const d = Math.max(base, D_ROOT(t), D_SPAR(qSpar), D_CUP(cupN), D_HEM(t, hemF));
      return MV(p, ATLAS.sheet, c, d, 0,
        tierOf(g.chord * sagFrac * cupN, maxB, i * 97 + k * 11 + j));
    };
    const mv = [];
    for (let k = 0; k <= NS; k++) { const r = []; for (let j = 0; j <= NCB + 1; j++) r.push(mvAt(k, j)); mv.push(r); }
    for (let k = 0; k < NS; k++) for (let j = 0; j <= NCB; j++)
      memQuad(hand, mv[k][j], mv[k][j + 1], mv[k + 1][j + 1], mv[k + 1][j]);
    const arc = [];
    for (let j = 0; j <= NCB; j++) arc.push({ p: grid[NS].row[j], ref: grid[NS - 1].row[j] });
    bayArcs.push(arc);
  }
  // assemble the free edge outboard-in: tipVI → tipV → tipIV → tipIII (each bay reversed)
  for (let i = bayArcs.length - 1; i >= 0; i--) {
    const rev = bayArcs[i].slice().reverse();
    for (let j = (i === bayArcs.length - 1 ? 0 : 1); j < rev.length; j++) hemBays.push(rev[j]);
  }

  // ── THE TRAILING HEM (§6.5) ──────────────────────────────────────────────────
  // ONE edge loop just inboard of the whole scalloped free edge — a DARK cord of constant
  // width per station, ramping ×2.5 tipward. Backlit (I2) it is the darkest line on the
  // wing. It is IN-PLANE: the membrane shows ZERO slab thickness at its edge (§12 kill #28),
  // and there is no continuous BRIGHT outline anywhere — chrome is an automatic loss (#33).
  // …and each run rides the group its membrane rides: the armwing hem on `arm`, the bay hem
  // on `hand`. Putting both on `hand` is invisible at rest (the −anchor makes the assembled
  // rest pose byte-identical) and then rips a black streak across the frame the moment the
  // wrist rotates — geometry that spans a joint must keep every vertex on ONE side of it.
  // I2: the hem joined the ONE membrane material. Its darkness is no longer an authored
  // hex — it falls out of the same exp(−σd): the hem band's d runs 1.0 → 2.5 tipward, so
  // backlit its transmitted luminance drops 0.151 → 0.018 and it IS the darkest line on
  // the wing, automatically, in both light regimes. Its outer vertices carry `edge = 1`,
  // the only place §6.3's demoted Fresnel is allowed to fire — hashed at 55% duty, so it
  // is broken hair-sparkle outside a dark hem and can never close into a chrome outline.
  for (const [run, g] of [[hemArm, arm], [hemBays, hand]]) {
    const outer = [], inner = [];
    for (const { p, ref } of run) {
      const t = (p[0] + X0) / hs;                          // span fraction → the ×2.5 ramp
      const w = (0.012 + 0.018 * Math.max(0, Math.min(1, t))) * hs;
      const dir = norm3(sub3(ref, p));
      const q = add3(add3(p, mul3(dir, w)), [0, 0.004 * hs, 0]);
      const d = 1.00 + 1.50 * Math.max(0, Math.min(1, t));
      outer.push(MVh(p, ATLAS.sheet, 1.0, d, 1, MEM_HEM_TIER));
      inner.push(MVh(q, ATLAS.sheet, 0.90, d * 0.86, 0, MEM_HEM_TIER));
    }
    for (let s = 0; s < run.length - 1; s++) {
      memTri(g, outer[s], outer[s + 1], inner[s + 1]);
      memTri(g, outer[s], inner[s + 1], inner[s]);
    }
  }

  // ── THE PROPATAGIUM (§5.2) — the sail nobody ships ───────────────────────────
  // Shoulder → wrist, FORWARD of the arm, depth 0.20 × the local chord AT THE ELBOW
  // (measured off this planform, not assumed). A real cambered triangular sail — not 2-px
  // piping (§12 kill #15) and not the amateur signature of a bare bone with nothing forward
  // of it (§12 kill #14). It is what makes the inboard leading edge bow FORWARD, so the
  // visible LE polyline is a "‹" even though the humerus itself runs nearly straight
  // outboard. Terminates at the carpal cluster.
  {
    const NP = 6;
    // u of the elbow along the arm path, by arc length
    const uE = len3(sub3(E, S)) / (len3(sub3(E, S)) + len3(sub3(K, E)));
    const chordAtElbow = len3(sub3(armTrail(uE), armLead(uE)));
    const depth = 0.20 * chordAtElbow;
    const rows = [[], [], []];
    for (let i = 0; i <= NP; i++) {
      const u = i / NP;
      const le = pathSample(armPath, u);
      const dep = depth * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.90)), 0.85);
      rows[0].push(le);
      rows[1].push([le[0] + 0.015 * dep, le[1] - 0.24 * dep, le[2] - dep * 0.5]);   // cambered (ventral) mid
      rows[2].push([le[0] + 0.030 * dep, le[1] - 0.20 * dep, le[2] - dep]);         // the taut forward edge
    }
    // …and the same sail as a FUNCTION (r ∈ [0,1] : LE spar → taut forward edge), so
    // §7's cephalic artery lands ON the sail instead of near it. One profile, two
    // consumers — see armSurface above for why that rule is not optional here.
    propSurface = (u, r) => {
      const le = pathSample(armPath, u);
      const dep = depth * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.90)), 0.85);
      const a = [le[0] + 0.015 * dep, le[1] - 0.24 * dep, le[2] - dep * 0.5];
      const b = [le[0] + 0.030 * dep, le[1] - 0.20 * dep, le[2] - dep];
      const q = Math.max(0, Math.min(1, r));
      return q <= 0.5 ? lerp3(le, a, q * 2) : lerp3(a, b, (q - 0.5) * 2);
    };
    // §6.2: the propatagium is the THINNEST membrane on the wing (0.42 ≈ 0.5× nominal) —
    // a taut, hero-lit, most-lift-efficient sail — so backlit it is the pale-amber
    // `#D19554` row, the BRIGHTEST tier, against the softer plagiopatagium behind it.
    // Its own band in the field atlas carries the cephalic doublet §5.2 asks for.
    const pmv = [[], [], []];
    for (let r = 0; r < 3; r++) for (let i = 0; i <= NP; i++) {
      const p = rows[r][i], t = tSpan(p);
      const base = 0.42 + 0.10 * (1 - r * 0.5);
      const d = Math.max(base, D_ROOT(t), r === 0 ? D_SPAR(0.15) : 0);   // it wraps the LE spar at r = 0
      // edge = 0 on EVERY row: the propatagium's forward edge is a TENSIONED leading edge,
      // not a free hem, and §6.5 says a leading edge is never emissive-rimmed. The §6.3
      // fringe belongs to the trailing hem alone — put it here and it draws a continuous
      // bright line down the front of the wing, which is kill #33 by another name.
      pmv[r].push(MV(p, ATLAS.prop, r / 2, d, 0, r === 0 ? 1 : 0));
    }
    for (let r = 0; r < 2; r++) for (let i = 0; i < NP; i++)
      memQuad(arm, pmv[r][i], pmv[r][i + 1], pmv[r + 1][i + 1], pmv[r + 1][i]);
    dumpPro = { depth, chordAtElbow };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // I3 — THE FIRE (§7). "A bellows, not a lantern: the furnace lives in one
  // hard-edged window under its arm, and you only see it when the wing rolls."
  //
  // Three laws decide every number below:
  //  · A REAL WING IS A RADIATOR, AND A RADIATOR IS MOSTLY COLD (F1 headline 1).
  //    93–97% of this wing never emits. The budget is a proximal wedge plus a few
  //    vessel lines — never a wash, never the trailing edge (kill #41/#42).
  //  · HEAT LIVES IN DISCRETE WINDOWS WITH HARD EDGES. The elephant-pinna
  //    thermography word is "an abrupt SKIP of temperature": windows appear and
  //    disappear, they never fade in (kill #43). Here that is geometry — a pane
  //    ends, and outside it there is char.
  //  · IT IS VENTRAL, SO THE CHASE CAMERA CANNOT HAVE IT. The anatomical radiator
  //    is the proximal ventral membrane; at cruise the player sees a black wing and
  //    the furnace only flashes on a bank or at the top of the upstroke. Withheld
  //    component glow with a citation behind it (kill #44).
  // ═══════════════════════════════════════════════════════════════════════════
  const VENT = 0.005 * hs;                                   // the radiator sits UNDER the sheet
  const ventral = (p) => [p[0], p[1] - VENT, p[2]];
  const clampT = (t) => Math.max(0.02, Math.min(0.995, t));
  const clampC = (c) => Math.max(0.035, Math.min(0.965, c));
  const fPhase = (seed) => wjit(seed, 0.5) + 0.5;            // deterministic [0,1) rhythm phase
  const bez2 = (p0, cp, p1, t) => { const m = 1 - t; return [
    m * m * p0[0] + 2 * m * t * cp[0] + t * t * p1[0],
    m * m * p0[1] + 2 * m * t * cp[1] + t * t * p1[1]]; };

  // ── ZONE A — THE FORGE WINDOW (2–4% of one wing) ────────────────────────────
  // ONE crisp pane on the proximal ventral plagiopatagium, in the triangle the
  // humerus, the body wall and the first spar close off. Three cusps and three
  // bowed edges: a window with a straight edge or a square corner is a hatch on a
  // machine, and this article's whole case is that it is an animal (kill #66's
  // logic, applied to light instead of to a hem).
  //
  // The pane carries the state ladder inside itself. Its OUTER RING is stage 0 —
  // at cold the core is dark and only the door's seam glows, ~1% of the wing, which
  // is F1's "dim rim only". Everything inboard of that ring is stage 1: at cruise
  // the whole window opens AT ONCE, with a hard border, because that is what a
  // window does. The value inside runs core → bloom → dark (T_CORE → T_RIM) and the
  // rim's value is continuous across the stage seam, so the recruitment step is a
  // change of AREA and never a visible ring inside the pane.
  const WV0 = [0.161, 0.179], WV1 = [0.185, 0.597], WV2 = [0.448, 0.368];
  const winUC = (a, b) => {
    const e0 = bez2(WV0, [0.278, 0.194], WV2, a);        // forward edge, bowed toward the LE
    const e1 = bez2(WV1, [0.309, 0.562], WV2, a);        // aft edge, bowed aft
    const root = bez2(WV0, [0.144, 0.392], WV1, b);      // the root edge, bowed toward the body
    const k = 1 - a;
    return [e0[0] + (e1[0] - e0[0]) * b + k * (root[0] - (WV0[0] + (WV1[0] - WV0[0]) * b)),
      e0[1] + (e1[1] - e0[1]) * b + k * (root[1] - (WV0[1] + (WV1[1] - WV0[1]) * b))];
  };
  const winTemp = (a, b) => {
    const r = Math.min(1, Math.hypot((a - 0.27) / 0.63, (b - 0.44) / 0.68));
    // pow 5.5, not 3.1. ACES compresses so hard that anything past ~55× the base emitter
    // reads as white, so a shallow ramp spends a THIRD of the pane above 0.90 luma and the
    // window becomes a pale egg with an orange edge. The steep ramp keeps the clipped core
    // to ~3% of the pane and puts the rest of it in F1's 0.55–0.85 band: core → bloom →
    // dark inside one pane, with the abrupt skip at its border.
    return T_RIM + (T_CORE - T_RIM) * Math.pow(1 - r, 5.5);
  };
  {
    // Non-uniform cell edges: the rim ring has to be THIN (F1 puts zone A at 2–4% of
    // the wing and the cold state at ~1%, so the ring is about a quarter of the pane),
    // and a uniform 6×6 grid would make it half.
    const WA = [0, 0.105, 0.30, 0.52, 0.72, 0.90, 1.0];
    const WB = [0, 0.115, 0.32, 0.53, 0.74, 0.885, 1.0];
    fireZone = 'A';
    for (let ia = 0; ia < WA.length - 1; ia++) for (let ib = 0; ib < WB.length - 1; ib++) {
      const rim = (ia === 0 || ib === 0 || ib === WB.length - 2);
      const st = rim ? 0 : 1;
      const ph = fPhase(ia * 37 + ib * 11 + 3 + seedSide * 601);   // the plume puffs unevenly
      const V = (a, b) => { const uc = winUC(a, b); return FV(ventral(armSurface(uc[0], uc[1])), winTemp(a, b), st, 0, ph); };
      fireQuad(arm, V(WA[ia], WB[ib]), V(WA[ia], WB[ib + 1]), V(WA[ia + 1], WB[ib + 1]), V(WA[ia + 1], WB[ib]));
    }
  }

  // ── ZONE B — THE ARTERY MEMBERS OF THE DOUBLETS (1–3%) ──────────────────────
  // The SAME Murray tree the I2 field stamped as dark thickness, re-read as
  // geometry and offset onto the artery side of each pair — so every glowing
  // hairline runs against the wider, darker vein that was already there. One
  // doublet, both channels (§2.4): cold and backlit it reads as A2's dark doublet;
  // lit it reads as glowing vasculature with its own built-in shadow line. Nothing
  // here is a rim, nothing loops, and everything dies before t = 0.60 (kills #45/#46).
  //
  // Recruitment is ROOT-FIRST: the proximal half of each line is stage 1 (cruise),
  // the outboard half stage 2 (power). The tip goes dark first, and lights last.
  // The window's OUTLINE in (u, c), used to keep zone B out of zone A: the vessel tree is
  // shared with the I2 field (which must not change), so its trunks start inboard and run
  // straight through the window's territory. Drawn as-is, the artery reads as red pencil
  // strokes ruled ACROSS the forge door — and inside a 0.9-luma pane a 0.26-luma line is
  // invisible anyway, so those pixels bought nothing and cost the read. Zone B now
  // radiates FROM zone A's border outward, which is what "doublets radiating from A" means.
  const winPoly = (() => {
    const P2 = [];
    for (let i2 = 0; i2 <= 12; i2++) P2.push(winUC(i2 / 12, 0));      // forward edge, root → tip
    for (let i2 = 11; i2 >= 0; i2--) P2.push(winUC(i2 / 12, 1));      // aft edge, tip → root
    for (let i2 = 11; i2 >= 1; i2--) P2.push(winUC(0, i2 / 12));      // the bowed root edge, closing
    let cu = 0, cc = 0;
    for (const q of P2) { cu += q[0]; cc += q[1]; }
    cu /= P2.length; cc /= P2.length;
    return P2.map((q) => [cu + (q[0] - cu) * 1.07, cc + (q[1] - cc) * 1.07]);   // a small margin
  })();
  const inWindow = (u, c) => {
    let inside = false;
    for (let i2 = 0, j2 = winPoly.length - 1; i2 < winPoly.length; j2 = i2++) {
      const a = winPoly[i2], b = winPoly[j2];
      if ((a[1] > c) !== (b[1] > c) && u < (b[0] - a[0]) * (c - a[1]) / ((b[1] - a[1]) || 1e-9) + a[0]) inside = !inside;
    }
    return inside;
  };
  const ART_END = 0.58;
  const ART_T0 = 0.115;
  const SHEET_BH = ATLAS.sheet[1] - ATLAS.sheet[0];
  const invT = (surf, t, c) => {
    let a = 0, b = 1;
    for (let it = 0; it < 20; it++) { const m = 0.5 * (a + b); if ((surf(m, c)[0] + X0) / hs < t) a = m; else b = m; }
    return 0.5 * (a + b);
  };
  const sheetAt = (t, c) => armSurface(invT(armSurface, t, c), c);
  const propAt = (t, c) => propSurface(invT(propSurface, t, c), c);
  const artTemp = (t) => T_ART0 + (T_ART1 - T_ART0) * Math.max(0, Math.min(1, (t - ART_T0) / (ART_END - ART_T0)));
  let capStubs = 0;
  fireZone = 'B';
  vesselSegments().forEach((sg, si) => {
    if (sg.u0 >= ART_END) return;
    const isProp = sg.band === ATLAS.prop;
    const at = isProp ? propAt : sheetAt;
    const bh = sg.band[1] - sg.band[0];
    const wA = sg.w * (bh / SHEET_BH), off = wA * 1.30;
    const du = sg.u1 - sg.u0, dv = bh * (sg.c1 - sg.c0);
    const L = Math.hypot(du, dv) || 1e-9;
    const nx = -dv / L, ny = du / L;                    // the pair's cross-direction, in atlas space
    const half = 0.27 * wA;
    // A point on the artery ribbon: `f` along the run, `sgn` across it, `w` the half-width.
    // The `−off` is the load-bearing sign: it is the side the FIELD stamped the artery on,
    // read off the rasteriser instead of guessed, because guessing it wrong lights the
    // wing down its VEINS — kill #34 exactly, and invisible in every still that happens to
    // be lit from the other side. The centreline also BOWS: a seeded lateral arc, zero at
    // both ends. Straight segments meeting at the tree's 24°/52° forks read as a ruled
    // stick figure in red pencil; a real vessel curves between its branch points, and two
    // spans plus a bow is the cheapest thing that stops the line looking DRAWN.
    const artBow = wjit(si * 7 + 3 + seedSide * 23, 0.22) * L;
    const artPt = (t, c, sgn, w, f) => {
      const o = -off + Math.sin(Math.PI * f) * artBow + sgn * w;
      return ventral(at(clampT(t + nx * o), clampC(c + (ny * o) / bh)));
    };
    const edge = (t, c, sgn) => artPt(t, c, sgn, half, 0);
    const tEnd = Math.min(ART_END, sg.u1);
    const fEnd = Math.max(0, Math.min(1, (tEnd - sg.u0) / (du || 1e-9)));
    const at2 = (f) => [sg.u0 + du * f, sg.c0 + (sg.c1 - sg.c0) * f];
    // "the PROXIMAL HALF of the lines lit at cruise, full length at power" (F1 B6) is a
    // statement about the TREE, not about a span coordinate: orders 1–2 are the trunk and
    // its first fork — half the vessel area — and order 3 is the outboard run that the
    // power stroke recruits. Splitting on t instead put 100% of the tree in the cruise
    // state (every segment of a tree that dies at t = 0.33 is "proximal"), which is how a
    // recruitment ladder quietly becomes one always-on state.
    const st = sg.order <= 2 ? 1 : 2;
    const ph = fPhase(si * 13 + 7 + seedSide * 449);
    // Clip the run to the longest stretch that lies OUTSIDE the forge window (see winPoly).
    let f0 = 0, f1 = fEnd, best = -1;
    {
      const NSMP = 9, out = [];
      for (let q = 0; q <= NSMP; q++) {
        const tc = at2((q / NSMP) * fEnd);
        if (isProp) { out.push(true); continue; }            // the sail is nowhere near zone A
        out.push(!inWindow(invT(armSurface, clampT(tc[0]), clampC(tc[1])), tc[1]));
      }
      let run = -1;
      for (let q = 0; q <= NSMP; q++) {
        if (out[q]) { if (run < 0) run = q; if (q - run > best) { best = q - run; f0 = (run / NSMP) * fEnd; f1 = (q / NSMP) * fEnd; } }
        else run = -1;
      }
    }
    const P0 = at2(f0), P1 = at2(f1);
    const T0 = artTemp(P0[0]), T1 = artTemp(P1[0]);
    // Orders 1–3 EMIT; order 4 stays dark thickness in the field only. The dark
    // doublet tree keeps all four orders (§6.4 is untouched) — what is withheld is
    // the LIGHT on the finest one, which is §4's law that G3 capillaries appear only
    // at ignition, and it is also 58 triangles a sub-pixel hairline was not earning.
    // The ribbon TAPERS along its run: a vessel that keeps one width fork to fork is a
    // drawn line, and Murray's law narrows it the whole way.
    if (sg.order <= 3 && best >= 1) {
      const NSP = 2;
      const pt = (f) => [P0[0] + (P1[0] - P0[0]) * f, P0[1] + (P1[1] - P0[1]) * f];
      for (let q = 0; q < NSP; q++) {
        const fa = q / NSP, fb = (q + 1) / NSP;
        const wa = half * (1 - 0.24 * fa), wb = half * (1 - 0.24 * fb);
        const pa = pt(fa), pb = pt(fb);
        const Ta = T0 + (T1 - T0) * fa, Tb = T0 + (T1 - T0) * fb;
        fireQuad(arm,
          FV(artPt(pa[0], pa[1], +1, wa, fa), Ta, st, 1, ph), FV(artPt(pa[0], pa[1], -1, wa, fa), Ta, st, 1, ph),
          FV(artPt(pb[0], pb[1], -1, wb, fb), Tb, st, 1, ph), FV(artPt(pb[0], pb[1], +1, wb, fb), Tb, st, 1, ph));
      }
    }
    const t1 = tEnd, c1 = at2(fEnd)[1];
    // §7.1 IGNITION: "+ capillary generation flashes". A G3 capillary is a stub off a
    // terminal artery, and it exists ONLY in the ignition state — the withheld tier
    // under the withheld tier.
    if (sg.order === 3 && t1 < 0.52 && capStubs < 12) {
      capStubs++; fireZone = 'cap';
      const t2 = Math.min(ART_END, t1 + du * 0.42), c2 = c1 + (sg.c1 - sg.c0) * 0.42;
      const A2 = edge(t2, c2, +0.55), B2 = edge(t2, c2, -0.55);
      const A1b = edge(t1, c1, +0.55), B1b = edge(t1, c1, -0.55);
      fireQuad(arm, FV(A1b, T_CAP, 3, 1, ph), FV(B1b, T_CAP, 3, 1, ph),
        FV(B2, T_CAP * 0.5, 3, 1, ph), FV(A2, T_CAP * 0.5, 3, 1, ph));
      fireZone = 'B';
    }
  });

  // ── THE RECRUITED PANES (§7.1 states 3 and 4) ───────────────────────────────
  // POWER opens 2–4 SECONDARY windows in the mid-panel — window COUNT rises with
  // thermal load, which is the sourced behaviour, not a brightness ramp. IGNITION
  // then recruits the OUTER membrane for ≤0.8 s. Both are lenses: pointed at both
  // ends, no straight run, no corner — and both still die well inboard of t = 0.60,
  // so the distal third and the trailing edge stay the coldest tissue on the animal.
  const lensPane = (u0, c0, rad, aspect, temp, stage, seed) => {
    const LA = [0, 0.26, 0.62, 1.0], LB = [0, 0.34, 0.68, 1.0];
    const surf = (a, b) => {
      const w = Math.pow(Math.sin(Math.PI * Math.pow(a, 0.86)), 0.62);
      return ventral(armSurface(u0 + rad * (a - 0.5), c0 + rad * aspect * w * (b - 0.5)));
    };
    // the value falls from the pane's own core to 55% at its border and then STOPS —
    // the border is the skip; the interior is the value structure.
    const tmp = (a, b) => temp * (0.55 + 0.45 * Math.pow(Math.sin(Math.PI * Math.pow(a, 0.86)), 0.8)
      * (1 - Math.pow(Math.abs(b - 0.5) * 2, 1.8)));
    for (let ia = 0; ia < LA.length - 1; ia++) for (let ib = 0; ib < LB.length - 1; ib++) {
      const ph = fPhase(seed + ia * 23 + ib * 5);
      const V = (a, b) => FV(surf(a, b), tmp(a, b), stage, 0, ph);
      fireQuad(arm, V(LA[ia], LB[ib]), V(LA[ia], LB[ib + 1]), V(LA[ia + 1], LB[ib + 1]), V(LA[ia + 1], LB[ib]));
    }
  };
  // Elongated along the SPAN, never across the chord: every fibre, cord, wrinkle and
  // vessel on this wing runs spanwise (kill #24), and a row of chordwise ovals reads as
  // spots on a leaf rather than as windows in a furnace wall. Sizes and aspects all
  // differ — three identical slots is a vent grille.
  fireZone = 'sec';
  lensPane(0.600, 0.300, 0.265, 0.58, T_SEC, 2, 71 + seedSide * 17);
  lensPane(0.520, 0.645, 0.215, 0.68, T_SEC * 0.86, 2, 131 + seedSide * 17);
  lensPane(0.755, 0.470, 0.200, 0.60, T_SEC * 0.72, 2, 197 + seedSide * 17);
  fireZone = 'outer';
  lensPane(0.845, 0.300, 0.235, 0.56, T_OUT, 3, 251 + seedSide * 17);
  lensPane(0.880, 0.590, 0.190, 0.66, T_OUT * 0.82, 3, 311 + seedSide * 17);
  lensPane(0.730, 0.765, 0.205, 0.60, T_OUT * 0.70, 3, 379 + seedSide * 17);

  // ── §7.5 THE EMBERS — the trailing edge glows NOTHING and sheds EVERYTHING ──
  // Small-diameter material produces embers ~5× faster than large, so firebrands
  // leave from the THIN structures — the trailing scallop tips and the fingertips —
  // and never from the hot root. That resolves the apparent contradiction with zone
  // A: the root is where heat LIVES, the edge is where material LEAVES.
  //
  // Rods at 11.5 : 1 aligned to the relative wind (built as a thin CROSS so the rod
  // reads from above and from the side), two-tone along their length — windward
  // amber ≈1200 °C, lee deep red ≈700 °C — and a NON-MONOTONIC life ramp: +25%
  // through the first 15% of life as the slipstream fans them, only then the decay.
  // Round dots that fade monotonically from spawn are kill #50.
  {
    // 24 rods per wing: 14 always-on (28 for the pair — inside F1's 24–40 cruise band)
    // and 10 more withheld until POWER (48 for the pair at the burst). The recruitment
    // stage is packed into the INTEGER part of the phase seed — the life cycle only
    // ever reads its fraction — so a staged ember costs no extra attribute and no
    // extra draw.
    const NEM = 24, NEM_CRUISE = 14;
    // §7.5 sizes the rod at ~1 × 4 PX. That is a screen measurement, and it is the number
    // the first pass got wrong by 6×: 0.055·hs is 25 px at the chase read and 200 px at the
    // 4× crop, where 24 of them turned into white sticks falling across the frame like
    // rain. At the chase read the dragon fills ~600 px over ~8 units, so 4 px ≈ 0.05 u —
    // 0.013·hs. Small, warm and many reads as a shed; long, bright and parallel reads as a
    // scratched lens.
    const EL = 0.013 * hs, EW = EL / 11.5;               // 11.5 : 1, inside F1's 10–13 : 1
    const WIND = norm3([0.05, 0.44, 1.0]);               // the relative wind, aft and up
    const HOT = [1.00, 0.46, 0.12], LEE = [0.52, 0.060, 0.010];
    for (let i2 = 0; i2 < NEM; i2++) {
      // 3 in 4 off the scalloped free edge, 1 in 4 off a fingertip — both thin, both cold
      const p = (i2 % 4 === 3 && tips.length)
        ? tips[(i2 * 3) % tips.length]
        : hemBays[Math.floor((i2 / NEM) * (hemBays.length - 1))].p;
      const seed = (i2 < NEM_CRUISE ? 1 : 2) + fPhase(i2 * 31 + 5 + seedSide * 137);
      const rate = 1.55 + wjit(i2 * 17 + 3 + seedSide * 211, 0.42);
      const travel = 0.11 * hs * (0.55 + 0.95 * fPhase(i2 * 23 + 11 + seedSide * 53));
      // …and each rod takes its own axis. A firebrand in a turbulent boundary layer is not
      // parallel to its neighbour; 24 rods on one shared vector is a picket fence in the
      // air, which is the same tell the cord-end teeth were just cured of.
      const WD = norm3(add3(WIND, [wjit(i2 * 41 + 9 + seedSide * 83, 0.22),
        wjit(i2 * 59 + 13 + seedSide * 179, 0.20), wjit(i2 * 67 + 21, 0.14)]));
      const e1 = norm3(cross3(WD, [0, 1, 0])), e2 = norm3(cross3(WD, e1));
      const a = add3(p, mul3(WD, -EL * 0.5)), b = add3(p, mul3(WD, EL * 0.5));
      let arr = embAcc.get(hand); if (!arr) embAcc.set(hand, arr = []);
      const EV = (q, off2, c, rod) => arr.push({ p: add3(q, off2), c, seed, rate, travel, rod });
      for (const e of [e1, e2]) {
        const o = mul3(e, EW * 0.5);
        EV(a, o, HOT, 1); EV(a, mul3(o, -1), HOT, 1); EV(b, mul3(o, -1), LEE, 0);
        EV(a, o, HOT, 1); EV(b, mul3(o, -1), LEE, 0); EV(b, o, LEE, 0);
      }
    }
  }

  // ── THE COVERT ROW (§9) ──────────────────────────────────────────────────────
  // ONE organized rank of 8–10 flakes with decaying sizes along the DORSAL arm, terminating
  // at the wrist cluster. I1 shipped them too small and too spread, so only the outermost
  // one cleared the propatagium and read as a single pale chip on the wrist — which is
  // §12 kill #30 (confetti) in miniature. One flake is worse than none. Rebuilt as a real
  // SHINGLED rank: each flake laps ~45% over the next, they sit ON the tube's dorsal face
  // (so they break the bone's outline rather than floating beside it), the sizes decay
  // monotonically outboard, and the rank stops dead at the carpal cluster — a rank has a
  // terminus. Charcoal bodies, ash only on the lapped edge, so the rank reads as relief.
  for (let i = 0; i < d.coverts; i++) {
    const f = i / Math.max(1, d.coverts - 1);
    const u = 0.14 + 0.80 * f;
    const p = pathSample(armPath, u);
    const rHere = r0 * sparF(0.09 + u * 0.41);
    const sz = 0.075 * hs * (1 - 0.46 * f);                    // decaying, and big enough to read
    const dir = norm3(sub3(K, S)), side = norm3(cross3(dir, [0, 1, 0]));
    const base = add3(p, [0, rHere * 0.82, 0]);                // ON the dorsal face of the pipe
    const a = add3(base, mul3(dir, -sz * 0.30));               // the lapped (upstream) edge
    const b = add3(add3(base, mul3(dir, sz * 0.62)), [0, -rHere * 0.10, 0]);   // the free tip, aft
    const c = add3(add3(base, mul3(side, sz * 0.86)), [0, -rHere * 0.55, 0]);  // outboard skirt
    const cIn = add3(add3(base, mul3(side, -sz * 0.34)), [0, -rHere * 0.45, 0]);
    push(arm, M.bone, [a, b, c], [a, cIn, b]);
    // I2 — THE COVERT LAP, value-softened. At 4× the I1 rank read SERRATED: nine full-ash
    // wedges against charcoal is a 5.4× value step repeated nine times, which the eye reads
    // as saw teeth, not as shingles. The lit lap edge is now the MID value (`covert`, one
    // step of a three-value ramp bone→covert→ash instead of two) and its area DECAYS
    // outboard with the flake, so the rank reads as a gradient of overlaps with a terminus.
    push(arm, M.covert, [a, lerp3(a, b, 0.30 - 0.12 * f), lerp3(a, c, 0.30 - 0.12 * f)]);
  }

  // ── THE ROOT (§9): OVERLAP, NEVER WELD ───────────────────────────────────────
  // A muscular root fairing continuous with the flank (the one root element that may deform
  // with the stroke — it is muscle, so it rides the PIVOT), under a scapular COWL plate that
  // rides the BODY frame over the humeral head (static through the flap), plus the raised
  // FLANK LINE running aft to the hip. A wing welded flush into the flank with a hard socket
  // seam and no fairing is §12 kill #18; flight muscle reads in the TORSO, never as biceps
  // on the wing arm (§12 kill #9), so this mass sits inboard of the glenoid, not on the arm.
  //
  // EVERYTHING HERE IS SIZED IN BODY UNITS off the published attach contract — never in hs.
  // These three parts belong to the TORSO's frame, so growing the wing must not grow them
  // (an hs-scaled cowl walks straight off the flank the moment the span dial moves).
  let skirtOuter = null;
  {
    const bw = d.flankHalfWidth;        // torso half-width at the wing root
    const flankAt = d.flankAt;          // wing-local flank point at a wing-local z
    const c0 = [-bw * 0.55, 0.02 * bw, 0], c1 = S;
    const ringAt = (p, rx, ry, rz) => [
      [p[0], p[1] + ry, p[2]], [p[0] + rx * 0.5, p[1] + ry * 0.4, p[2] - rz],
      [p[0] + rx * 0.7, p[1] - ry * 0.5, p[2] - rz * 0.5], [p[0], p[1] - ry, p[2]],
      [p[0] + rx * 0.7, p[1] - ry * 0.5, p[2] + rz * 0.5], [p[0] + rx * 0.5, p[1] + ry * 0.4, p[2] + rz],
    ];
    const R0 = ringAt(c0, bw * 0.45, bw * 0.86, bw * 1.30);
    const R1 = ringAt(lerp3(c0, c1, 0.55), bw * 0.42, bw * 0.70, bw * 0.95);
    const R2 = ringAt(c1, bw * 0.24, bw * 0.40, bw * 0.52);
    for (const [A, Bq] of [[R0, R1], [R1, R2]]) for (let k = 0; k < 6; k++) {
      const k2 = (k + 1) % 6;
      quad(root, k === 0 || k === 1 || k === 5 ? M.ash : M.flank, A[k], A[k2], Bq[k2], Bq[k]);
    }
    // scapular cowl — overlapping knapped flake plates, STATIC in the body frame, lapping
    // OVER the humeral head so the join is an overlap, not a seam that can fail.
    for (let i = 0; i < 3; i++) {
      const b = [-bw * 0.75 + bw * 0.22 * i, bw * 0.62 - bw * 0.10 * i, -bw * 0.95 + bw * 0.88 * i];
      const w = bw * 0.80 * (1 - 0.16 * i), l = bw * 1.05 * (1 - 0.13 * i);
      const p0 = add3(b, [-w * 0.5, 0, -l * 0.5]), p1 = add3(b, [w * 0.9, bw * 0.14, -l * 0.3]);
      const p2 = add3(b, [w * 0.6, bw * 0.05, l * 0.6]), p3 = add3(b, [-w * 0.4, -bw * 0.10, l * 0.4]);
      const apex = add3(b, [w * 0.15, bw * 0.34, 0]);
      push(frame, M.ash, [p0, p1, apex], [p1, p2, apex]);
      push(frame, M.flank, [p2, p3, apex], [p3, p0, apex]);
    }
    // ── THE BODY-FRAME FLANK SKIRT (I1.1) ───────────────────────────────────
    // The wing sheet now stops at a cusp ON the pivot, so flank coverage back to the
    // hip/upper thigh — the Night-Fury trait §9 asks for — is delivered HERE, in the body
    // frame, where it belongs: it never rotates, so it can never peel.
    //
    // The shape is the whole point. A skirt drawn as its own lobe CROSSES the wing's
    // trailing edge in planform, and the union of the two outlines grows sharp notches —
    // measured at 86° / 97° / 100° by `wingquadprobe` on the first attempt. So the skirt is
    // built as a CONTINUATION of the wing's own trailing line instead: its outer edge runs
    // out to the wing TE's aft-most point (where the two curves meet), and only aft of that
    // does it become the silhouette, carrying one unbroken curve down to the hip. Forward of
    // that meeting point it lies UNDER the wing sheet — which is the required overlap.
    const teAft = (() => { let best = armTrail(0); for (let i = 1; i <= 60; i++) { const p = armTrail(i / 60); if (p[2] > best[2]) best = p; } return best; })();
    const A0 = flankAt(0.22), A2 = flankAt(2.45);
    const bz = (a, c, b, t) => { const m = 1 - t; return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0],
      m * m * a[1] + 2 * m * t * c[1] + t * t * b[1], m * m * a[2] + 2 * m * t * c[2] + t * t * b[2]]; };
    // C1 is pulled well OUTBOARD so the skirt's forward half sits deep under the wing sheet:
    // the seam between a rotating frame and a static one is only safe if it is genuinely
    // lapped, and the dump asserts ≥0.15 chord of overlap.
    const C1 = [teAft[0] * 0.90, A0[1] - bw * 1.5, A0[2] + (teAft[2] - A0[2]) * 0.62];
    const C2 = [teAft[0] * 0.52, teAft[1] - bw * 1.6, teAft[2] + (A2[2] - teAft[2]) * 0.34];
    const skOuterAt = (v) => (v <= 0.5 ? bz(A0, C1, teAft, v * 2) : bz(teAft, C2, A2, (v - 0.5) * 2));
    const NSK = 10, skInner = [], skMid = [], skOuter = [];
    for (let i = 0; i <= NSK; i++) {
      const v = i / NSK;
      const o = skOuterAt(v);
      const inn = flankAt(0.22 + v * 2.23);
      skInner.push(inn); skOuter.push(o); skMid.push(add3(lerp3(inn, o, 0.52), [0, -bw * 0.55, 0]));
    }
    // The skirt is membrane over the BODY, so its optical path is effectively infinite:
    // d 2.4 → 2.9 across it means backlit it stays the near-black `#2E0000` row and never
    // competes with the wing sheet's glow — which is what keeps the root reading as one
    // dark mass instead of a lit card (the Round-1 blue door panel, in its second life).
    const sk = (p, c, dd, e) => MVh(p, ATLAS.skirt, c, dd, e, MEM_TIERS[2]);
    for (let i = 0; i < NSK; i++) {
      const rw0 = bw * 0.26, rw1 = bw * 0.26;
      // the raised flank LINE along the skirt's top edge (the anchor line the eye reads)
      quad(frame, M.ash, add3(skInner[i], [0, rw0, 0]), add3(skInner[i + 1], [0, rw1, 0]), skInner[i + 1], skInner[i]);
      // the skirt sheet itself, value-banded so it is not one flat card
      memQuad(frame, sk(skInner[i], 0.02, 2.90, 0), sk(skInner[i + 1], 0.02, 2.90, 0),
        sk(skMid[i + 1], 0.50, 2.60, 0), sk(skMid[i], 0.50, 2.60, 0));
      memQuad(frame, sk(skMid[i], 0.50, 2.60, 0), sk(skMid[i + 1], 0.50, 2.60, 0),
        sk(skOuter[i + 1], 0.98, 2.40, 0), sk(skOuter[i], 0.98, 2.40, 0));
    }
    skirtOuter = skOuter;
  }

  flush(arm); flush(fore); flush(hand); flush(root); flush(frame);
  flushMem(arm); flushMem(hand); flushMem(frame, 'skirt');   // the skirt is body-frame: same material, measured apart
  flushTemper(arm);                                          // §7.4 — the oxide series on the hot root
  flushFire(arm); flushEmbers(hand);                         // §7 — the whole radiator in 2 draws

  // pure-math landmark table — geometry numbers beat rendered pixels (§11 verify chain)
  const dump = {
    hs, rootX: X0,
    landmarks: { shoulder: S, elbow: E, wrist: K, mcp3: MCP3, pip3: PIP3, tip3: TIP3, hook3: HOOK3, carpalVI: W6, bodyAnchor: RT },
    digits, tips, armPath, r0, sparF, propatagium: dumpPro, skirtOuter,
    // §7 authored fire: surface area lit at each recruitment stage, and how far
    // outboard that stage reaches (root-first / tip-last is an ASSERTION, not a hope).
    fire: { area: fireArea.slice(), maxT: fireMaxT.slice(), zone: { ...fireZoneArea },
      vessels: vesselSegments().length, capillaries: capStubs, artEnd: ART_END, vent: VENT },
    fan: { len: FAN_LEN, az: FAN_AZ, droop: FAN_DROOP, runIII, phiIII, mcLen },
    armLead, armTrail,
  };
  return { arm, fore, hand, root, frame, K, E, tip: TIP3, dump };
}

// ═══════════════════════════════════════════════════════════════════════════════
export function buildBasaltForgeWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = forgeMats(def);
  const glow = model.glowLevel ?? 1;
  // §3 sets `hs = spanScale · 4.2` and justifies it as "shipped-premium size (span/body ≥ 1.1)".
  // MEASURED, those two clauses conflict on this torso: 4.2 delivers span/body 0.79 at glide,
  // because the shipped heroes' `halfSpan` dial is NOT their true semi-span — the Tempest's
  // struts fan OUTBOARD of its halfSpan 4.1 and its tip actually lands at 5.33 from the
  // midline (R1 T4 vs T7). Our tip is PINNED at t = 1.0 · hs, so hs is the real semi-span.
  // §12 kill #63 (and the 56%-size lesson it comes from) is an automatic loss, so the LAW
  // wins over the number. §3 was amended after I1 to state the MEASURED outcome instead of a
  // dial: glide span/body must land in 1.10–1.20, hs free. hs = 6.2 is the measured landing
  // spot (`wingdump.mjs`): span/body 1.17 against the bar's 1.18, with §5.1's area shares
  // 7 / 49 / 44 and AR 8.8 at the same time. Every §3 landmark is a FRACTION of hs, so the
  // whole landmark table survives any rescale untouched (the dump still reads Δ0.0000).
  const halfSpan = (model.spanScale ?? 1) * (model.wingHalfSpan ?? 6.2);
  const rootC = attach.wingRoot(1);
  // BODY-FRAME geometry (root fairing, scapular cowl, the raised flank line, and the
  // membrane's inboard anchor) is derived from the torso's PUBLISHED attach contract, never
  // from hs — so moving the span dial can never walk the cowl off the flank, and dropping
  // this wing onto another torso re-seats the root instead of floating it.
  const bw = Math.max(0.12, attach.halfWidthAt ? attach.halfWidthAt(rootC.z) : 0.26);
  const midY = attach.bodyMidY ?? rootC.y;
  const flankAt = (zLocal) => {
    const zm = zLocal + rootC.z;
    const hw = Math.max(0.06, attach.halfWidthAt ? attach.halfWidthAt(zm) : bw);
    const keel = attach.keelTopAt ? attach.keelTopAt(zm) : rootC.y;
    return [hw * 0.92 - rootC.x, midY + (keel - midY) * 0.30 - rootC.y, zLocal];   // a RAISED flank line, above the midline
  };
  const tailZ = (attach.tailAnchor && attach.tailAnchor.z != null) ? attach.tailAnchor.z : rootC.z + 2.4;
  const dials = {
    halfSpan, rootX: rootC.x, flankHalfWidth: bw, flankAt,
    // the plagiopatagium's body anchor, as a fraction of the root→hip run (§9)
    anchorZ: (model.wingAnchorFrac ?? 0.92) * (tailZ - rootC.z),
    digits: Math.max(2, Math.min(4, Math.round(model.wingDigits ?? 4))),
    coverts: Math.max(0, Math.round(model.wingCoverts ?? 9)),
    clusterStubs: Math.max(0, Math.min(2, Math.round(model.wingClusterStubs ?? 2))),
    glow,
  };

  // The rig's single-material wing contract IS the membrane now — one material for the
  // plagiopatagium, the bays, the hem, the propatagium and the skirt, carrying the §6.2
  // transmission patch. The membrane is the DARKEST element on the dragon and carries no
  // emissive of its own — the def pins wingEmissive / wingMembraneEmissive black and it
  // stays that way. I3's radiator is a SEPARATE system in `flareMats` (§7.1): a membrane
  // that glowed would be the lampshade of kill #42, and it would erase the polarity flip
  // the MEMBRANE gate was won on.
  M.wingMat = M.mem;

  // ── §7.1 THE STATE MACHINE ──────────────────────────────────────────────────
  // Four AUTHORED states, not a slider. Switching one flips a uniform, and because
  // every triangle carries its own stage threshold the change is a change of AREA
  // with hard borders — windows appear and disappear (kill #43), root-first and
  // tip-last (kill #44). Published on the wing group so the lab harness and the
  // rig can both drive it; the shipped Surge loop drives the same materials through
  // `flareMats` on top, which is what makes ignition an EVENT rather than a state
  // the wing sits in.
  const fireU = M.fire.userData.surfaceUniforms || {};
  const embU = M.ember.userData.surfaceUniforms || {};
  const setFireState = (name) => {
    const i = Math.max(0, FIRE_STATES.indexOf(name));
    if (fireU.uFireStage) fireU.uFireStage.value = i;
    if (fireU.uFireGain) fireU.uFireGain.value = FIRE_GAIN[i];
    if (fireU.uFireLoad) fireU.uFireLoad.value = FIRE_LOAD[i];
    if (embU.uEmbGain) embU.uEmbGain.value = EMBER_GAIN[i];
    if (embU.uEmbStage) embU.uEmbStage.value = i;
    return FIRE_STATES[i];
  };
  setFireState('cruise');

  const pivots = {}, wingElements = [];
  let dump = null;
  for (const side of [1, -1]) {
    const rt = attach.wingRoot(side);
    const pivot = new THREE.Group(); pivot.position.set(rootC.x, rootC.y, rootC.z); pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    // §7.4: the two wings share every landmark and differ by SEED — temper rings, ash
    // break-up and the cord-end tooth train. Weathering asymmetry is free and mandatory;
    // the rig stays Δ0.000 because the seed never touches a joint (§2.6).
    const built = buildOneForgewing(M, { ...dials, seed: side === 1 ? 0 : 1 });
    dump = built.dump;
    const { arm, fore, hand, root, frame, K, E, tip: F0 } = built;
    // TWO −anchors, one per joint. `mid` sits ON the elbow landmark (t=0.28) and `tip` ON the
    // wrist landmark (t=0.50); each child group carries the matching negative offset, so the
    // assembled rest pose is byte-identical to a rig with both joints collapsed onto the
    // shoulder — you can add a joint to a shipped-looking wing with zero visual regression.
    // That is also the trap: a mis-parented part is INVISIBLE in every still and only rips
    // in motion, so parenting is checked in the cycle strip, never in a pose sheet.
    pivot.add(mid); mid.position.set(E[0], E[1], E[2]);
    mid.add(fore); fore.position.set(-E[0], -E[1], -E[2]);
    fore.add(tip); tip.position.set(K[0], K[1], K[2]);
    tip.add(hand); hand.position.set(-K[0], -K[1], -K[2]);
    pivot.add(arm);                           // humerus + both membranes ride the SHOULDER
    pivot.add(root);                          // the muscular fairing rides the SHOULDER
    // The scapular cowl + the raised flank line ride the BODY frame (static through the
    // flap, §9) — so they are siblings of the pivot, INSIDE the mirror wrapper, never
    // children of it. Build BOTH wings canonical (+X) and mirror the LEFT with an OUTER
    // scale.x = −1 wrapper that PARENTS the pivot: `pivot.scale.x = −1` desyncs
    // rotation.y/.z, and a mirror AND a per-side sign both flip. Use exactly one.
    const still = new THREE.Group(); still.position.set(rootC.x, rootC.y, rootC.z); still.add(frame);
    if (side === -1) { const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(pivot); lmirror.add(still); group.add(lmirror); }
    else { group.add(pivot); group.add(still); }
    const s = side === 1 ? 'R' : 'L';
    const marker = new THREE.Object3D(); marker.position.set(F0[0], F0[1], F0[2]); hand.add(marker);   // FX emit point rides the FOLDING hand
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip; pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [rt.x, rt.y, rt.z], tip: [rt.x + side * F0[0], rt.y + F0[1], rt.z + F0[2]], length: halfSpan, tipObj: marker });
  }
  group.userData.forgewingDump = dump;   // pure-math landmark table for the verify harness
  group.userData.forgeFire = { states: FIRE_STATES.slice(), setState: setFireState, fire: M.fire, ember: M.ember };
  // §7.1 wiring, verbatim from the shipped contract: window + arteries + embers go in
  // `flareMats` — Surge-flared, NEVER rim-lit — and the bones stay out of both (the
  // warm cruise rim on a radiator is the always-on jewellery the bar already loses on).
  // `spineMats` stays empty by design: nothing on this wing takes the cruise rim.
  return { group, spineMats: [], flareMats: [M.fire, M.ember], wingMat: M.wingMat, parts: { ...pivots, wingElements } };
}
registerWings('basaltForgeWings', buildBasaltForgeWings);
