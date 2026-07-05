// tests/starters.mjs — the §7 per-sheet GEOMETRY asserts for the rebuilt starters.
//
// Headless (three-resolver + the tricount DOM shim), built via buildDragonModel +
// ascendedDef per reachable form. Reads the SHEET bands (§3 per-architecture table +
// §5d + §4 growth arc) from a per-dragon SPEC table — NOT the shared §4 defaults —
// plus the assert-metadata handles the builders publish (parts.wingElements /
// spinePoints / motifAnchor) and the RESOLVED def dials. The aesthetics GATE (§8)
// judges the rest in pixels; this suite is the regression guardrail (sausages,
// closed gaps, phantom forms, motif drift, monotonicity, palette carrier).
//
//   node tests/starters.mjs           full coverage (CP2+)
//   node tests/starters.mjs --cp1     apex-form bands only (forms 0-1 build-clean) — §5d CP1 semantics
//
// Only the CURRENTLY-REBUILT starters appear in SPECS; ember/jade join in their slots.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);

const ctx2d = {
  createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {},
  set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {},
};
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };

const THREE = await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');
const { setFlapDebugPose } = await import('../js/dragonDebugPose.js');

const cp1 = process.argv.includes('--cp1');

// ── per-dragon SHEET spec (§3 col + §5d + §4) — bands per reachable form ─────────
const SPECS = {
  azure: {
    architecture: 'blade-feather comb',
    wingElements: 5,                            // §3: 5 feather-blades every form
    triTargets: [2400, 3800, 5200],             // §5d ~targets (draconic-head floor lifts the hatchling; see PR)
    headBody: [[2.0, 2.6], [3.0, 4.2], [4.8, 6.0]],   // §4 head:body (1:X)
    eyeHead: [[0.30, 0.45], [0.20, 0.30], [0.14, 0.185]], // §4 eye diameter : head length
    spanBody: [[1.4, 1.7], [2.0, 2.3], [2.8, 3.2]],   // §3/§4 wingspan : body
    accentHue: 39,                              // gold ~39°
    carrier: 'diffuse',                         // azure: NO accent-hued emissive on the wing
  },
};

let pass = 0, fail = 0;
const fails = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; fails.push(msg); } }
const band = (v, [lo, hi]) => v >= lo && v <= hi;
function hueOf(hex) { const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); return hsl.h * 360; }
function hueDist(a, b) { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }

const V = new THREE.Vector3();
function measure(key, form) {
  const def = ascendedDef(DRAGONS[key], form, 0);
  const { group, parts } = buildDragonModel(def, {});
  const scale = def.model.scale || 1;
  group.updateMatrixWorld(true);
  setFlapDebugPose(parts, 'glide');
  group.updateMatrixWorld(true);
  // body length: the published spine polyline z-range (pre-scale group space).
  const zs = parts.spinePoints.map((p) => p.z);
  const bodyLen = Math.max(...zs) - Math.min(...zs);
  // head length: the SKULL length the head builder publishes (crest excluded).
  const headLen = parts.headLength;
  // wingspan: widest blade tip (world → de-scaled), doubled.
  let mx = 0;
  for (const e of parts.wingElements) { e.tipObj.getWorldPosition(V); mx = Math.max(mx, Math.abs(V.x) / scale); }
  const span = mx * 2;
  // eye diameter from RESOLVED dials (matches dragonDraconicHead.eyeZone geometry).
  const m = def.model;
  const eyeDiam = 0.32 * (m.eyeScale ?? 1) * (1 + (1 - (m.eyeShape ?? 1)) * 0.55);
  // fold contraction.
  setFlapDebugPose(parts, 'fold'); group.updateMatrixWorld(true);
  let fx = 0; for (const e of parts.wingElements) { e.tipObj.getWorldPosition(V); fx = Math.max(fx, Math.abs(V.x) / scale); }
  const foldSpan = fx * 2;
  // spine inflection count.
  const ys = parts.spinePoints.map((p) => p.y);
  let infl = 0; for (let i = 1; i < ys.length - 1; i++) if ((ys[i] - ys[i - 1]) * (ys[i + 1] - ys[i]) < 0) infl++;
  let tris = 0; group.traverse((o) => { if (o.isMesh && o.geometry) { const g = o.geometry; tris += g.index ? g.index.count / 3 : (g.attributes?.position?.count / 3 || 0); } });
  return { def, parts, m, bodyLen, headLen, span, foldSpan, eyeDiam, infl, tris: Math.round(tris),
    headBody: bodyLen / headLen, eyeHead: eyeDiam / headLen, spanBody: span / bodyLen };
}

for (const [key, spec] of Object.entries(SPECS)) {
  const maxT = maxTierFor(key);
  ok(maxT === 2, `${key}: starter caps at form 2 (maxTierFor=${maxT})`);
  const per = [];
  for (let f = 0; f <= maxT; f++) per.push(measure(key, f));

  // Forms that get the full band asserts (CP1 = apex only; forms 0-1 build-clean).
  const bandForms = cp1 ? [maxT] : [0, 1, 2];

  for (let f = 0; f <= maxT; f++) {
    const M = per[f];
    // build-clean: every form must produce geometry + the metadata handles.
    ok(M.parts.wingElements && M.parts.wingElements.length === spec.wingElements,
      `${key} f${f}: wing element count ${M.parts.wingElements?.length} == ${spec.wingElements}`);
    ok(!!M.parts.spinePoints && M.parts.spinePoints.length >= 4, `${key} f${f}: spinePoints published`);
    ok(!!M.parts.motifAnchor, `${key} f${f}: motifAnchor published`);
    ok(M.tris < 6000, `${key} f${f}: under 6000 ceiling (${M.tris})`);

    // wing element progression (swell-then-taper): lengths NOT all equal + a mid peak.
    const lens = M.parts.wingElements.map((e) => e.length);
    const maxLen = Math.max(...lens), minLen = Math.min(...lens);
    ok(maxLen - minLen > 0.05 * maxLen, `${key} f${f}: blade lengths vary (progression, not sawtooth)`);
    const peakIdx = lens.indexOf(maxLen);
    ok(peakIdx > 0 && peakIdx < lens.length - 1, `${key} f${f}: longest blade is mid-fan (swell-then-taper)`);
    // separation: planform gaps > 0 (roots march + z-stagger).
    const roots = M.parts.wingElements.map((e) => e.root);
    let minGap = Infinity;
    for (let i = 1; i < roots.length; i++) minGap = Math.min(minGap, Math.hypot(roots[i].x - roots[i - 1].x, roots[i].z - roots[i - 1].z));
    ok(minGap > 0.05, `${key} f${f}: comb has planform separation (minGap ${minGap.toFixed(2)})`);
    // taper: each blade tapers to a point (length>0) — the geometry is a point at the tip.
    ok(lens.every((l) => l > 0.1), `${key} f${f}: blades have real length`);

    // rig parts + fold contraction ≤ 0.7 of glide.
    ok(!!M.parts.wingPivotL && !!M.parts.wingPivotR, `${key} f${f}: wingPivotL/R exist`);
    ok(M.foldSpan <= 0.72 * M.span, `${key} f${f}: fold contracts span (${(M.foldSpan / M.span).toFixed(2)} ≤ 0.72)`);

    // line of action: ≥1 inflection.
    ok(M.infl >= 1, `${key} f${f}: spine line-of-action has ≥1 inflection (${M.infl})`);

    if (bandForms.includes(f)) {
      ok(band(M.headBody, spec.headBody[f]), `${key} f${f}: head:body 1:${M.headBody.toFixed(2)} in [${spec.headBody[f]}]`);
      ok(band(M.eyeHead, spec.eyeHead[f]), `${key} f${f}: eye:head ${M.eyeHead.toFixed(3)} in [${spec.eyeHead[f]}]`);
      ok(band(M.spanBody, spec.spanBody[f]), `${key} f${f}: span:body ${M.spanBody.toFixed(2)}x in [${spec.spanBody[f]}]`);
    }
  }

  // ── monotonic dials across forms (catches SAME-DRAGON-BIGGER) ──
  const hs = per.map((p) => p.m.headScale ?? 1);
  const es = per.map((p) => p.m.eyeScale ?? 1);
  const sh = per.map((p) => p.m.eyeShape ?? 1);
  ok(hs[0] > hs[1] && hs[1] > hs[2], `${key}: headScale monotonic decreasing (${hs.join(' > ')})`);
  ok(es[0] >= es[1] && es[1] >= es[2], `${key}: eyeScale monotonic non-increasing`);
  ok(sh[0] <= sh[1] && sh[1] <= sh[2], `${key}: eyeShape round→almond monotonic`);
  ok(per[0].headBody < per[1].headBody && per[1].headBody < per[2].headBody, `${key}: head:body monotonic (head shrinks rel. to body)`);
  ok(per[0].eyeHead > per[1].eyeHead && per[1].eyeHead > per[2].eyeHead, `${key}: eye:head monotonic decreasing`);
  ok(per[0].spanBody < per[1].spanBody && per[1].spanBody < per[2].spanBody, `${key}: span:body monotonic increasing`);

  // ── motif anchor: invariant local position (drift ≤0.15) + bloom radius monotonic ──
  const anchors = per.map((p) => p.parts.motifAnchor);
  for (let f = 1; f <= maxT; f++) {
    const drift = anchors[f].local.distanceTo(anchors[0].local);
    ok(drift <= 0.15, `${key} f${f}: motif anchor drift ${drift.toFixed(3)} ≤ 0.15`);
  }
  ok(anchors[0].radius < anchors[1].radius && anchors[1].radius < anchors[2].radius, `${key}: motif bloom radius monotonic increasing`);

  // ── tri budget: monotonic increasing + apex visibly richer + near sheet targets ──
  ok(per[0].tris < per[1].tris && per[1].tris < per[2].tris, `${key}: tris monotonic increasing`);
  ok(per[2].tris >= 1.35 * per[0].tris, `${key}: apex visibly richer than hatchling (${per[2].tris} ≥ 1.35×${per[0].tris})`);
  for (let f = 0; f <= maxT; f++) {
    const tgt = spec.triTargets[f];
    // ±20% where reachable; the hatchling has a fixed draconic-head+torso floor (~2.6k)
    // that lifts it above the ~2.4k target — allow a documented higher ceiling on f0.
    const hi = f === 0 ? tgt * 1.5 : tgt * 1.2;
    ok(per[f].tris >= tgt * 0.8 && per[f].tris <= hi, `${key} f${f}: tris ${per[f].tris} near target ${tgt} (${(per[f].tris / tgt).toFixed(2)}x)`);
  }

  // ── palette carrier (law 9): accentHue set; azure wing has NO accent-hued emissive ──
  ok(DRAGONS[key].accentHue != null, `${key}: def.accentHue set`);
  ok(hueDist(hueOf(DRAGONS[key].accentHue), spec.accentHue) <= 20, `${key}: accentHue within ±20° of ${spec.accentHue}°`);
  if (spec.carrier === 'diffuse') {
    const apex = per[2];
    const wm = apex.parts && buildDragonModel(apex.def, {}).materials.wingMat;
    const emisHue = hueOf(wm.emissive.getHex());
    const emisI = wm.emissiveIntensity;
    ok(emisI < 0.2 || hueDist(emisHue, spec.accentHue) > 20,
      `${key}: no gold emissive on the wing (carrier=diffuse; emisI ${emisI}, hueΔ ${hueDist(emisHue, spec.accentHue).toFixed(0)}°)`);
  }
}

console.log(`\nStarter geometry asserts (§7)${cp1 ? ' — CP1 (apex bands)' : ''}: ${pass} passed, ${fail} failed.`);
if (fail) { for (const f of fails) console.log('  ✗ ' + f); process.exit(1); }
process.exit(0);
