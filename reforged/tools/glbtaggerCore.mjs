// Pure geometry core for the GLB PART-TAGGER (tools/glbtagger.html). No DOM, no WebGL — every
// function takes plain typed-arrays so it runs headless (tests/glbtagger.mjs) AND in the browser tool.
// The tool owns the GLTF decode, Three render, orbit UI and clipboard; this file owns the MATH:
// classify a mesh's vertices into body PARTS (body / wings / head / tail) by the SAME geometric gates
// dragonGlb.js uses to drive the wingbeat + slither, then emit the paste-ready `def.glb` block.
//
// WHY THIS EXISTS. An asset-backed dragon (Thundercoil, Ember Monarch, …) is one fused GLB with no
// skeleton — the engine identifies "this vert is a wing / tail" purely from its position in MESH-LOCAL
// space and deforms it in a shader (dragonGlb.js attachBodyDeform). The bbox alone can't tell head from
// tail or dorsal from belly (see glbinspect.mjs), which is what made the Thundercoil orientation a thrash
// (LEAPFROG: wrong rotX sign, belly-up, tail-flaps-with-wings). This core lets the tool SHOW the part
// classification and the wingbeat so a human can correct the gates by eye, then export exact numbers.
//
// ONE SPEC, TWO LANGUAGES. `flapDelta` / `slitherOffset` below mirror the GLSL injected by
// dragonGlb.js attachBodyDeform() — the same mirror tests/wingflap.mjs and tests/slither.mjs already
// assert. `classifyParts`' WING predicate is byte-identical to the flap's `wmask`, so *what the tool
// paints as a wing is exactly what the engine flaps*. If the GLSL changes, update this file to match.

export const PART = { BODY: 0, WING: 1, HEAD: 2, TAIL: 3 };
export const PART_NAME = ['body', 'wing', 'head', 'tail'];
// readable, on-brand part colours (body grey, wings electric, head gold, tail ember)
export const PART_COLOR = [[0.42, 0.46, 0.56], [0.36, 0.70, 1.0], [1.0, 0.80, 0.30], [1.0, 0.42, 0.16]];

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const AXIS = { x: 0, y: 1, z: 2 };

// The third axis — the one that is neither spine nor span (the fore/aft "depth" the flap hinge swings
// through). For span=x, spine=y → depth=z (the Thundercoil case).
export function depthAxis(spanAxis, spineAxis) {
  return ['x', 'y', 'z'].find((a) => a !== spanAxis && a !== spineAxis);
}

// Axis-aligned bounding box of a flat [x,y,z,x,y,z,…] position array.
export function aabb(positions) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3)
    for (let k = 0; k < 3; k++) {
      const v = positions[i + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  const ext = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  return { min, max, ext, center };
}

// Best-effort guess of native orientation from the bbox alone (the glbinspect heuristic): widest axis is
// the WINGSPAN; the longer of the remaining two is the SPINE. Head/tail/dorsal are NOT recoverable from
// the box — the human resolves those in the tool. Returned only to seed the sliders.
export function guessAxes(positions) {
  const { ext } = aabb(positions);
  const order = ['x', 'y', 'z'];
  const span = order[ext.indexOf(Math.max(...ext))];
  const rest = order.filter((a) => a !== span);
  const spine = ext[AXIS[rest[0]]] >= ext[AXIS[rest[1]]] ? rest[0] : rest[1];
  return { spanAxis: span, spineAxis: spine, depth: depthAxis(span, spine), ext };
}

// Default gates seeded from the bbox. Span/spine from guessAxes; hinge at ~30% of the span half-extent
// (Thundercoil: hingeX 0.28 of a 0.95 half-span ≈ 29%); wing band excludes the tail third of the spine;
// head/tail cuts at the outer ~18% of each end. All in RAW mesh-local units so they feed the engine
// shader unchanged.
export function defaultGates(positions) {
  const g = guessAxes(positions);
  const { min, max } = aabb(positions);
  const sMin = min[AXIS[g.spineAxis]], sMax = max[AXIS[g.spineAxis]];
  const spanHalf = Math.max(Math.abs(min[AXIS[g.spanAxis]]), Math.abs(max[AXIS[g.spanAxis]]));
  const span = sMax - sMin;
  return {
    spanAxis: g.spanAxis, spineAxis: g.spineAxis,
    headAtMax: true,               // is the HEAD at the +spine end? (toggle in the tool)
    hingeX: +(spanHalf * 0.30).toFixed(3),
    wingMinS: +(sMin + span * 0.33).toFixed(3),   // wings live above this spine coord (tail excluded)
    headCutS: +(sMax - span * 0.18).toFixed(3),   // s ≥ this (and not wing) ⇒ head
    tailCutS: +(sMin + span * 0.18).toFixed(3),   // s ≤ this (and not wing) ⇒ tail
  };
}

// THE CLASSIFIER. For each vertex decide body/wing/head/tail. The WING test is identical to the engine
// flap's `wmask` (|span| ≥ hingeX AND spine ≥ wingMinS) so the painted wing == the flapped wing. Head/
// tail are the spine ends; everything else is body. headAtMax flips which end is the head. Returns a
// Uint8Array(vertexCount) of PART ids.
export function classifyParts(positions, gates) {
  const n = positions.length / 3;
  const out = new Uint8Array(n);
  const sa = AXIS[gates.spineAxis], pa = AXIS[gates.spanAxis];
  const { headCutS, tailCutS, headAtMax } = gates;
  for (let i = 0; i < n; i++) {
    const s = positions[i * 3 + sa];
    const span = Math.abs(positions[i * 3 + pa]);
    if (span >= gates.hingeX && s >= gates.wingMinS) { out[i] = PART.WING; continue; }
    // head/tail are the two spine ENDS; headAtMax says the head is the +spine end.
    const atHead = headAtMax ? (s >= headCutS) : (s <= tailCutS);
    const atTail = headAtMax ? (s <= tailCutS) : (s >= headCutS);
    out[i] = atHead ? PART.HEAD : atTail ? PART.TAIL : PART.BODY;
  }
  return out;
}

// Per-part vertex counts (for the tool's legend / sanity readout).
export function partCounts(partIds) {
  const c = [0, 0, 0, 0];
  for (let i = 0; i < partIds.length; i++) c[partIds[i]]++;
  return { body: c[0], wing: c[1], head: c[2], tail: c[3] };
}

// Fill a Float32 vertex-colour buffer (3/vert) from part ids — drives the "parts" view in the tool.
export function partColorBuffer(partIds) {
  const col = new Float32Array(partIds.length * 3);
  for (let i = 0; i < partIds.length; i++) {
    const c = PART_COLOR[partIds[i]];
    col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
  }
  return col;
}

// ── DEFORM MIRRORS (one spec with the dragonGlb.js GLSL; see tests/wingflap + slither) ───────────────
// Flap: a vertex wide on the SPAN axis (|a| ≥ hingeX) AND in the front/shoulder spine band (s ≥ minS)
// rotates about a fore/aft hinge (at a = ±hingeX) by fth = −side·amp·sin(phase), swinging the span/depth
// pair. `p.tilt` (radians) then rotates that swing toward the SPINE axis, so the beat can be angled
// fore/aft instead of straight up/down (tilt 0 ⇒ the shipped beat). Body and the coiled tail (s < minS)
// are identity. Returns {da, db, ds} on the (span, depth, spine) axes. Mirrors dragonGlb.js exactly.
export function flapDelta(a, b, s, phase, p) {
  const side = Math.sign(a);
  const mask = (Math.abs(a) >= p.hingeX && s >= p.minS) ? 1 : 0;
  const fth = -side * p.amp * Math.sin(phase) * mask;
  const da0 = a - side * p.hingeX, db0 = b - (p.hingeZ || 0);
  const fc = Math.cos(fth), fs = Math.sin(fth);
  const ndx = (side * p.hingeX + da0 * fc + db0 * fs) - a;
  const ndz = ((p.hingeZ || 0) - da0 * fs + db0 * fc) - b;
  const tilt = p.tilt || 0;
  return { da: ndx, db: ndz * Math.cos(tilt), ds: ndz * Math.sin(tilt) };
}

// Slither: a traveling lateral wave down the spine. Amplitude ramps 0 (head) → 1 (tail); the head is
// anchored. Displaces the SPAN (lateral) axis by amp·spineT·sin(freq·s + waveSpeed·t).
export function slitherSpineT(s, p) {
  return clamp((p.spineMax - s) / Math.max(1e-4, p.spineMax - p.spineMin), 0, 1);
}
export function slitherOffset(s, t, p) {
  return p.amp * slitherSpineT(s, p) * Math.sin(p.freq * s + p.waveSpeed * t);
}

// Apply flap + slither to a COPY of the base positions, in mesh-local space (orientation-independent,
// exactly like the engine applying the deform before the model matrix). Mutates `out`; returns it.
// `cfg` = { spanAxis, spineAxis, flap:{hingeX,hingeZ,amp,minS,phase}|null, slither:{amp,freq,waveSpeed,spineMin,spineMax,phase}|null }.
export function applyDeform(base, out, cfg) {
  const pa = AXIS[cfg.spanAxis], sa = AXIS[cfg.spineAxis];
  const da = AXIS[depthAxis(cfg.spanAxis, cfg.spineAxis)];
  out.set(base);
  const n = base.length / 3;
  for (let i = 0; i < n; i++) {
    const a = base[i * 3 + pa], b = base[i * 3 + da], s = base[i * 3 + sa];
    if (cfg.flap) {
      const d = flapDelta(a, b, s, cfg.flap.phase || 0, cfg.flap);
      out[i * 3 + pa] += d.da; out[i * 3 + da] += d.db; out[i * 3 + sa] += d.ds;
    }
    if (cfg.slither) out[i * 3 + pa] += slitherOffset(s, cfg.slither.phase || 0, cfg.slither);
  }
  return out;
}

// ── EXPORT — the paste-ready def.glb block for dragons.js ─────────────────────────────────────────────
// Maps the tool's measured orientation + gates onto the engine's exact knobs (dragonGlb.js applyGlbTransform
// + the slither/wing config). The flap `minS` is the wing-band cut (gates.wingMinS); the slither spine
// bounds come from the live bbox along the chosen spine axis.
export function buildExport({ key = 'emberMonarch', meshUrl, gates, orient, slither, flap, bbox }) {
  const r3 = (v) => +(+v).toFixed(3);
  const sa = AXIS[gates.spineAxis];
  const sMin = bbox ? r3(bbox.min[sa]) : -1, sMax = bbox ? r3(bbox.max[sa]) : 1;
  const piExpr = (v) => {
    // express a radian value as a tidy Math.PI multiple when it's close to one (matches the roster style)
    const k = v / Math.PI;
    if (Math.abs(k) < 1e-3) return '0';
    if (Math.abs(Math.abs(k) - 1) < 0.04) return k < 0 ? '-Math.PI' : 'Math.PI';
    if (Math.abs(Math.abs(k) - 0.5) < 0.04) return k < 0 ? '-Math.PI/2' : 'Math.PI/2';
    return r3(v).toString();
  };
  const o = orient || {};
  const sl = slither || { amp: 0.10, freq: 8.0, speed: 4.0 };
  const fl = flap || {};
  return `glb: { scale: ${r3(o.scale ?? 3.9)}, rotY: ${piExpr(o.rotY ?? Math.PI)}, rotX: ${piExpr(o.rotX ?? -Math.PI / 2)}, rotZ: ${piExpr(o.rotZ ?? 0)},
  shoulder: [${r3(o.shoulderX ?? 0.3)}, ${r3(o.shoulderY ?? 0.2)}, ${r3(o.shoulderZ ?? -0.4)}], riderAt: [0, 0.9, 0.2],
  fusedWings: true,
  // spine = local ${gates.spineAxis} (head at ${gates.headAtMax ? '+' : '−'}${gates.spineAxis}); span = local ${gates.spanAxis}. Tagged in tools/glbtagger.html.
  slither: { amp: ${r3(sl.amp)}, freq: ${r3(sl.freq)}, speed: ${r3(sl.speed)} },
  wing: { hingeX: ${r3(fl.hingeX ?? gates.hingeX)}, minS: ${r3(fl.minS ?? gates.wingMinS)}, amp: ${r3(fl.amp ?? 0.55)}, tilt: ${piExpr(fl.tilt ?? 0)} } }
// spine bbox on ${gates.spineAxis}: [${sMin}, ${sMax}]   meshUrl: '${meshUrl || `./assets/models/${key}.glb`}'`;
}
