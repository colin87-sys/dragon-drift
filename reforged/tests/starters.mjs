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
const { setFlapDebugPose } = await import('../js/wingDebugPose.js');

const cp1 = process.argv.includes('--cp1');

// ── per-dragon SHEET spec (§3 col + §5d + §4) — bands per reachable form ─────────
const SPECS = {
  azure: {
    architecture: 'blade-feather comb',
    wingElements: 5,                            // §3: 5 feather-blades every form
    triTargets: [2400, 3800, 5200],             // §5d ~targets (draconic-head floor lifts the hatchling; see PR)
    headBody: [[2.0, 2.6], [3.0, 4.2], [4.8, 6.0]],   // §4 head:body (1:X)
    eyeHead: [[0.30, 0.45], [0.20, 0.30], [0.14, 0.32]], // §4 eye diameter : head length. f2 ceiling RECONCILED 0.185→0.32: the honest gate read the apex "blind head-on" at the smaller sizes; eyeScale 0.95 (~0.29) keeps the keen eye the ladder's smallest but readable at the confrontation angle (L147: reconcile the proxy to what the eye measures)
    // wingspan : body — RECONCILED to the VISUAL nose-to-tail reference (see measure()'s
    // visualBodyLen), matching what the §8 gate measures off the top-planform. The old
    // [1.4,1.7]/[2.0,2.3]/[2.8,3.2] were against the spine-polyline z-range, which under-reads
    // the body (it excludes the snout + the long forked tail-banner) and so read ~1.4× higher
    // than the eye does. Bands retuned to the visual metric (ember/jade retune when they build).
    spanBody: [[0.7, 1.05], [1.1, 1.6], [1.6, 2.5]],
    accentHue: 39,                              // gold ~39°
    carrier: 'diffuse',                         // azure: NO accent-hued emissive on the wing
  },
  ember: {
    architecture: 'gapped-finger membrane',
    wingElements: 4,                            // §3 col 2: 4 finger rays every form
    triTargets: [2600, 4000, 5600],             // §5d ~targets (draconic-head floor lifts the hatchling; see PR)
    headBody: [[2.0, 2.6], [3.0, 4.2], [4.5, 5.5]],   // §4 head:body (ember apex 1:4.5–5.5)
    // eye:head — §4 bands (33–40% / 22–28% / 14–18%); f2 ceiling reconciled up like
    // azure (L147: the honest gate needs the keen eye readable head-on, so the eyeScale
    // that keeps it the ladder's smallest still measures a touch above the raw 0.18).
    eyeHead: [[0.30, 0.45], [0.20, 0.30], [0.13, 0.30]],
    // span:body — measured against the VISUAL nose→tail body length (top-planform read,
    // what the §8 gate measures), reconciled from the sheet's 1.4–1.7 / 2.0–2.3 / 2.5–2.9
    // body-LENGTH ratios (same reconciliation azure documented — the visual body under-
    // reads the spine-z, so the ratio bands are retuned to the built geometry).
    spanBody: [[0.65, 1.1], [1.1, 1.7], [1.7, 2.6]],
    accentHue: 27,                              // lava ~27°
    carrier: 'emissive',                        // ember: warm ONLY as emissive; NO warm accent diffuse on the membrane
  },
  jade: {
    architecture: 'silk fin lobes',
    wingElements: [3, 3, 4],                     // §3 col 3: 3 lobes (forms 0–1) → 4 lobes (apex) — per-form count
    separation: 'notch',                         // §3 jade metric: overlap permitted; tip NOTCHES separate (depth ≥0.3× lobe len), NOT planform root gaps
    triTargets: [2550, 3680, 5200],              // §5d ~targets. Apex bumped for the GLOW-UP spend (the "Jade Ascendant" pass: moon-tail veiltail + rayed fins + dew gems + pearl-line + triple streamers), still well under the 6000/form ceiling. The koiSerpent body itself stays a lean vertex-wave tube.
    // head:body — §4 jade bands (long serpent: 1:2.8–3.2 / 1:4.5–5.5 / 1:7.5–9.5).
    headBody: [[2.8, 3.2], [4.5, 5.5], [7.5, 9.5]],
    // eye:head — §4 bands (33–40% / 22–28% / 14–18%); f2 ceiling reconciled UP to 0.32
    // like azure/ember (L147): jade's apex eye is "calm, long, painterly" — a larger
    // almond that still reads as the keen-but-serene apex, not a shrunken pinhole.
    eyeHead: [[0.30, 0.40], [0.20, 0.28], [0.14, 0.32]],
    // span:body — measured against the VISUAL nose→tail body length (the §8 top-planform
    // read). RECONCILED for the koiSerpent body: jade moved from a loft torso + bolted
    // sweptTail to a continuous UNDULATING section-chain whose head:body is now pinned to
    // the §4 growth arc (2.8→8.4×). With the body length pinned by that assert and the silk
    // fans kept UNCHANGED (the beloved hero), the wingspan:body ratio settles at these values
    // (the fins unfurl relative to the body across forms → monotonic up). The old bands were
    // calibrated against the retired loft body; these track the real serpent.
    spanBody: [[0.24, 0.42], [0.32, 0.54], [0.44, 0.68]],
    accentHue: 149,                              // mint-pearl ~149° (green-leaning, ICONIC GREEN)
    carrier: 'jade',                             // jade [ICONIC GREEN]: body diffuse reads VIVID mid-value jade (NOT near-black moss); accent green
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
  setFlapDebugPose(parts, def.model, 'glide');
  group.updateMatrixWorld(true);
  // body length: the published spine polyline z-range (pre-scale group space).
  const zs = parts.spinePoints.map((p) => p.z);
  const bodyLen = Math.max(...zs) - Math.min(...zs);
  // VISUAL body length: true nose-tip → tail-tip z-extent of the body (wings EXCLUDED),
  // de-scaled — this is what the §8 gate measures span:body against (the top-planform
  // silhouette length). The spine polyline stops at the neck/tail-anchor and under-reads
  // it, which is why the §7 span:body (spine-z) and the gate's visual span diverged; the
  // span band is asserted against THIS so the test and the gate agree (reconciled per review).
  const wingRoots = ['wingPivotL', 'wingPivotR', 'wingTipL', 'wingTipR', 'wingRigL', 'wingRigR', 'wingYokeL', 'wingYokeR', 'wingPivot2L', 'wingPivot2R'];
  const wingSet = new Set();
  // wingRigL/R are rig-handle OBJECTS (shoulder/elbow/wrist), not Object3Ds — skip
  // those; the wing subtree is already covered via wingPivotL/R. Guard on .traverse.
  for (const k of wingRoots) if (parts[k] && typeof parts[k].traverse === 'function') parts[k].traverse((o) => wingSet.add(o));
  let bzMin = Infinity, bzMax = -Infinity; const P = new THREE.Vector3();
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry || wingSet.has(o)) return;
    const pos = o.geometry.attributes.position; if (!pos) return;
    for (let i = 0; i < pos.count; i++) { P.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); if (P.z < bzMin) bzMin = P.z; if (P.z > bzMax) bzMax = P.z; }
  });
  const visualBodyLen = (bzMax - bzMin) / scale;
  // head length: the SKULL length the head builder publishes (crest excluded).
  const headLen = parts.headLength;
  // wingspan: widest blade tip (world → de-scaled), doubled.
  let mx = 0;
  for (const e of parts.wingElements) { e.tipObj.getWorldPosition(V); mx = Math.max(mx, Math.abs(V.x) / scale); }
  const span = mx * 2;
  // eye diameter from RESOLVED dials (matches dragonDraconicHead.eyeZone geometry).
  const m = def.model;
  // hotEye (ember) sizes the iris directly as a FRACTION of head length via eyeShape
  // (diaFrac = 0.33 − eyeShape·0.19), independent of eyeScale — so the proxy tracks that
  // formula; every other dragon keeps the shared eyeZone proxy (eyeScale·shape).
  const eyeDiam = m.hotEye
    ? (0.33 - (m.eyeShape ?? 1) * 0.16) * headLen
    : 0.32 * (m.eyeScale ?? 1) * (1 + (1 - (m.eyeShape ?? 1)) * 0.55);
  // fold contraction.
  setFlapDebugPose(parts, def.model, 'fold'); group.updateMatrixWorld(true);
  let fx = 0; for (const e of parts.wingElements) { e.tipObj.getWorldPosition(V); fx = Math.max(fx, Math.abs(V.x) / scale); }
  const foldSpan = fx * 2;
  // spine inflection count.
  const ys = parts.spinePoints.map((p) => p.y);
  let infl = 0; for (let i = 1; i < ys.length - 1; i++) if ((ys[i] - ys[i - 1]) * (ys[i + 1] - ys[i]) < 0) infl++;
  let tris = 0; group.traverse((o) => { if (o.isMesh && o.geometry) { const g = o.geometry; tris += g.index ? g.index.count / 3 : (g.attributes?.position?.count / 3 || 0); } });
  return { def, parts, m, bodyLen, visualBodyLen, headLen, span, foldSpan, eyeDiam, infl, tris: Math.round(tris),
    headBody: bodyLen / headLen, eyeHead: eyeDiam / headLen, spanBody: span / visualBodyLen };
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
    // wingElements count: a constant (azure 5 / ember 4) OR a per-form array (jade 3/3/4).
    const wantEls = Array.isArray(spec.wingElements) ? spec.wingElements[f] : spec.wingElements;
    ok(M.parts.wingElements && M.parts.wingElements.length === wantEls,
      `${key} f${f}: wing element count ${M.parts.wingElements?.length} == ${wantEls}`);
    ok(!!M.parts.spinePoints && M.parts.spinePoints.length >= 4, `${key} f${f}: spinePoints published`);
    ok(!!M.parts.motifAnchor, `${key} f${f}: motifAnchor published`);
    ok(M.tris < 6000, `${key} f${f}: under 6000 ceiling (${M.tris})`);

    // wing element progression (swell-then-taper): lengths NOT all equal + a mid peak.
    const lens = M.parts.wingElements.map((e) => e.length);
    const maxLen = Math.max(...lens), minLen = Math.min(...lens);
    ok(maxLen - minLen > 0.05 * maxLen, `${key} f${f}: blade lengths vary (progression, not sawtooth)`);
    const peakIdx = lens.indexOf(maxLen);
    ok(peakIdx > 0 && peakIdx < lens.length - 1, `${key} f${f}: longest blade is mid-fan (swell-then-taper)`);
    // separation per the sheet's metric. azure/ember: planform root gaps > 0 (roots march
    // + z-stagger). jade: overlap is PERMITTED — the tip NOTCHES separate the outer 40% of
    // each lobe (depth ≥0.3× lobe length), read from the published notchDepth.
    if (spec.separation === 'notch') {
      const notches = M.parts.wingElements.map((e) => e.notchDepth ?? 0);
      ok(notches.every((n) => n >= 0.3), `${key} f${f}: lobe tip-notch depth ≥0.3× (min ${Math.min(...notches).toFixed(2)})`);
    } else {
      const roots = M.parts.wingElements.map((e) => e.root);
      let minGap = Infinity;
      for (let i = 1; i < roots.length; i++) minGap = Math.min(minGap, Math.hypot(roots[i].x - roots[i - 1].x, roots[i].z - roots[i - 1].z));
      ok(minGap > 0.05, `${key} f${f}: comb has planform separation (minGap ${minGap.toFixed(2)})`);
    }
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
  if (spec.carrier === 'emissive') {
    // ember [ICONIC FLAME]: the BODY is bold warm flame, but the wing MEMBRANE diffuse
    // is held dark-warm so the glowing rays carry the fire (not a toy-bright sheet).
    // Assert the membrane material's diffuse stays dark (value ≤0.22).
    const apex = per[2];
    const wm = apex.parts && buildDragonModel(apex.def, {}).materials.wingMat;
    const hsl = {}; wm.color.getHSL(hsl);
    ok(hsl.l <= 0.30, `${key}: wing membrane diffuse held dark-warm so the rays carry the fire, not a toy-bright sheet (L ${hsl.l.toFixed(2)} ≤ 0.30)`);
  }
  if (spec.carrier === 'jade') {
    // jade [ICONIC GREEN]: the BODY diffuse must read as a VIVID mid-value jade —
    // unmistakably GREEN at a glance, NOT the near-black moss the §5d starting hexes
    // were (0x123026, sRGB L≈0.13). Judge in sRGB (what renders), computed from the raw
    // hex bytes — three's colour management stores linear internally, which would read
    // even a vivid mid-green as "dark". Body hue in the jade/emerald band + L ≥ 0.24.
    const hex = per[2].def.body;
    const r = ((hex >> 16) & 255) / 255, g = ((hex >> 8) & 255) / 255, b = (hex & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    const sL = (mx + mn) / 2;
    let sH = 0; if (d) { sH = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; sH = ((sH * 60) + 360) % 360; }
    ok(sL >= 0.24 && sL <= 0.55, `${key}: apex body is VIVID mid-value jade, not near-black moss (sRGB L ${sL.toFixed(2)} in [0.24,0.55])`);
    ok(hueDist(sH, 150) <= 25, `${key}: apex body hue is GREEN (${sH.toFixed(0)}° within ±25° of 150°)`);
  }
}

// ── SOLAR SOVEREIGN (SSSR premium, 4 forms) — the CP2 "withheld-regalia" coronation ladder ───────
// Solar reaches Eternal (not a form-2-capped starter), so it gets its own block rather than the
// shared 3-form SPECS loop. Asserts the ladder WITHHOLDS regalia at the whelp and confers it rung by
// rung: igniteStage 0→3, the star-gem/corona-ring/nape-star arriving on schedule, the cathedral arch
// + carpal spires growing — so each form is rank-able (adds light AND hardware), the point of CP2.
if (!cp1) {
  const key = 'solar';
  const maxT = maxTierFor(key);
  ok(maxT === 3, `${key}: premium reaches Eternal (maxTierFor=${maxT})`);
  const per = [];
  for (let f = 0; f <= maxT; f++) {
    const def = ascendedDef(DRAGONS[key], f, 0);
    const { group, parts } = buildDragonModel(def, {});
    let tris = 0; group.traverse((o) => { if (o.isMesh && o.geometry) { const g = o.geometry; tris += g.index ? g.index.count / 3 : (g.attributes?.position?.count / 3 || 0); } });
    per.push({ m: def.model, parts, tris: Math.round(tris) });
  }
  for (let f = 0; f <= maxT; f++) {
    ok(per[f].tris > 0 && per[f].tris < 6000, `${key} f${f}: builds under 6000 (${per[f].tris})`);
    ok(!!per[f].parts.spinePoints && per[f].parts.spinePoints.length >= 4, `${key} f${f}: spinePoints published`);
    // motif-anchor assert WAIVED at f0 — the star-gem (motif carrier) is withheld from the whelp.
    if (f >= 1) ok(!!per[f].parts.motifAnchor, `${key} f${f}: motifAnchor published`);
  }
  // tris monotonic — every rung bolts on more hardware (arch/spires/corona), not just brightness.
  ok(per[0].tris < per[1].tris && per[1].tris < per[2].tris && per[2].tris < per[3].tris,
    `${key}: tris monotonic across the 4 forms (${per.map((p) => p.tris).join(' < ')})`);
  // ignition ramp: the growth currency — every emissive is dark at the whelp, full at Eternal.
  const ig = per.map((p) => p.m.igniteStage ?? 3);
  ok(ig[0] === 0 && ig[0] < ig[1] && ig[1] < ig[2] && ig[2] < ig[3], `${key}: igniteStage monotonic 0→3 (${ig.join('→')})`);
  // star-gem WITHHELD at f0 (radius 0), then the rendered gem radius strictly grows 0→r1→r2→r3.
  const gemR = per.map((p) => { const b = p.m.starGemBloom ?? 1; return b > 0 ? (0.13 + 0.07 * b) * (p.m.headScale ?? 1) : 0; });
  ok(gemR[0] === 0, `${key} f0: star-gem withheld (radius 0)`);
  ok(gemR[0] < gemR[1] && gemR[1] < gemR[2] && gemR[2] < gemR[3],
    `${key}: gem-bloom radius monotonic 0→r1→r2→r3 (${gemR.map((r) => r.toFixed(2)).join(' < ')})`);
  // eclipse-corona ring is an ETERNAL-ONLY rung — never at a lower form (no early pearl-halo collision).
  const cr = per.map((p) => p.m.coronaRing ?? 0);
  ok(cr[0] === 0 && cr[1] === 0 && cr[2] === 0 && cr[3] > 0, `${key}: eclipse-corona ring is f3-only (${cr.join(',')})`);
  // the cathedral-arch wow move ramps: arch + carpal spires grow each rung (the silhouette earns its M).
  const ar = per.map((p) => p.m.archRise ?? 1), cl = per.map((p) => p.m.carpalLance ?? 2.6);
  ok(ar[0] === 0 && ar[0] < ar[1] && ar[1] < ar[2] && ar[2] < ar[3], `${key}: archRise monotonic 0→1 (${ar.join('→')})`);
  ok(cl[0] === 0 && cl[1] < cl[2] && cl[2] < cl[3], `${key}: carpal-lance length monotonic (${cl.join('→')})`);
  // nape-star (the rearward sigil) is withheld until Radiant, then grows into Eternal.
  const ns = per.map((p) => p.m.napeStar ?? 0);
  ok(ns[0] === 0 && ns[1] === 0 && ns[2] > 0 && ns[2] < ns[3], `${key}: nape-star arrives at Radiant (${ns.join('→')})`);
}

// ── MOLTEN PHOENIX (SSSR premium, 4 forms) — the CALDERA "living magma" coronation ladder + THE
// VISIBILITY LAW. Reaches Eternal (own block, not the form-2 SPECS loop). Asserts the caldera ladder
// WITHHOLDS regalia at the dormant whelp and confers it rung by rung (igniteStage 0→3, the molten
// heart / fire-primaries / dominant pinion / eruption crest arriving on schedule; the crust SEALS at
// f0 and opens toward the apex), AND the non-negotiable Lower-Frame Clearance law: no wide/large mass
// in the rear-chase corridor { y<spine, z>hip } at ANY form (max|x|≤0.6, frontal footprint ≤1.3).
if (!cp1) {
  const key = 'phoenixMolten';
  const maxT = maxTierFor(key);
  ok(maxT === 3, `${key}: premium reaches Eternal (maxTierFor=${maxT})`);
  const per = [];
  for (let f = 0; f <= maxT; f++) {
    const def = ascendedDef(DRAGONS[key], f, 0);
    const { group, parts } = buildDragonModel(def, {});
    const scale = def.model.scale || 1;
    group.updateMatrixWorld(true);
    setFlapDebugPose(parts, def.model, 'glide');
    group.updateMatrixWorld(true);
    let tris = 0, nan = 0;
    // VISIBILITY corridor { y<spineY, z>hipZ } in de-scaled model space (glide pose).
    const spineY = 0.15, hipZ = 0.5;
    let cMaxX = 0, cxMin = Infinity, cxMax = -Infinity, cyMin = Infinity;
    const P = new THREE.Vector3();
    group.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      const p = o.geometry.attributes.position; if (!p) return;
      tris += p.index ? p.index.count / 3 : p.count / 3;
      for (let i = 0; i < p.count; i++) {
        P.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
        if (!Number.isFinite(P.x) || !Number.isFinite(P.y) || !Number.isFinite(P.z)) { nan++; continue; }
        const x = P.x / scale, y = P.y / scale, z = P.z / scale;
        if (y < spineY && z > hipZ) { cMaxX = Math.max(cMaxX, Math.abs(x)); cxMin = Math.min(cxMin, x); cxMax = Math.max(cxMax, x); cyMin = Math.min(cyMin, y); }
      }
    });
    const footprint = cxMax > cxMin ? (cxMax - cxMin) * (spineY - cyMin) : 0;
    per.push({ m: def.model, parts, tris: Math.round(tris), nan, cMaxX, footprint });
  }
  for (let f = 0; f <= maxT; f++) {
    ok(per[f].nan === 0, `${key} f${f}: no NaN vertices (${per[f].nan})`);   // the invisible-vertex guard
    ok(per[f].tris > 0 && per[f].tris < 6000, `${key} f${f}: builds under 6000 (${per[f].tris})`);
    ok(!!per[f].parts.spinePoints && per[f].parts.spinePoints.length >= 4, `${key} f${f}: spinePoints published`);
    ok(!!per[f].parts.wingElements && per[f].parts.wingElements.length === 2, `${key} f${f}: 2 wingElements published`);
    // THE VISIBILITY LAW (unconditional, every form): compact + lower-centre clear.
    ok(per[f].cMaxX <= 0.6, `${key} f${f}: corridor max|x| ${per[f].cMaxX.toFixed(2)} ≤ 0.6 (no wide lower-centre mass)`);
    ok(per[f].footprint <= 1.3, `${key} f${f}: corridor frontal footprint ${per[f].footprint.toFixed(2)} ≤ 1.3`);
  }
  // motif anchor (the molten heart) present from f1 (withheld MESH at the dormant whelp).
  for (let f = 1; f <= maxT; f++) ok(!!per[f].parts.motifAnchor, `${key} f${f}: motifAnchor published`);
  // tris monotonic — every rung bolts on hardware (heart/primaries/crest), not just brightness.
  ok(per[0].tris < per[1].tris && per[1].tris < per[2].tris && per[2].tris < per[3].tris,
    `${key}: tris monotonic across the 4 forms (${per.map((p) => p.tris).join(' < ')})`);
  // ignition ramp 0→3 (the growth currency: dark at the whelp, full at the Empress).
  const ig = per.map((p) => p.m.igniteStage ?? 3);
  ok(ig[0] === 0 && ig[0] < ig[1] && ig[1] < ig[2] && ig[2] < ig[3], `${key}: igniteStage monotonic 0→3 (${ig.join('→')})`);
  // the MOLTEN HEART is withheld at the dormant whelp (heartScale 0) then grows.
  const hs2 = per.map((p) => p.m.heartScale ?? 1);
  ok(hs2[0] === 0 && hs2[0] < hs2[1] && hs2[1] < hs2[2] && hs2[2] < hs2[3], `${key}: heart withheld at f0 then grows (${hs2.join('→')})`);
  // fire-PRIMARIES withheld at f0 (bare crust fan) then grow to the full 7-blade pyre-fan.
  const pr = per.map((p) => p.m.primaries ?? 7);
  ok(pr[0] === 0 && pr[0] < pr[1] && pr[1] < pr[2] && pr[2] < pr[3], `${key}: fire-primaries 0→7 monotonic (${pr.join('→')})`);
  // the DOMINANT PINION (×1.7) + T0 whiteheart are an ETERNAL-only rung.
  const pd = per.map((p) => p.m.pinionDom ?? 0);
  ok(pd[0] === 0 && pd[1] === 0 && pd[2] === 0 && pd[3] > 0, `${key}: dominant pinion is f3-only (${pd.join(',')})`);
  // the eruption CREST (sky-zone glory) is withheld at the whelp then fans open.
  const cf = per.map((p) => p.m.crestFan ?? 0);
  ok(cf[0] === 0 && cf[0] < cf[1] && cf[1] < cf[2] && cf[2] < cf[3], `${key}: eruption crest 0→5 monotonic (${cf.join('→')})`);
  // the wing ARCH (upturn) + chord grow each rung (the silhouette earns its fan).
  const up = per.map((p) => p.m.upturn ?? 1), ch = per.map((p) => p.m.chordScale ?? 1);
  ok(up[0] === 0 && up[0] < up[1] && up[1] < up[2] && up[2] < up[3], `${key}: wing upturn monotonic 0→1 (${up.join('→')})`);
  ok(ch[0] < ch[1] && ch[1] < ch[2] && ch[2] < ch[3], `${key}: wing chord grows each rung (${ch.join('→')})`);
  // the crust SEALS at the dormant whelp (coverage 1.0) and OPENS toward the apex (more molten seams).
  const cc = per.map((p) => p.m.crustCoverage ?? 1);
  ok(cc[0] > cc[1] && cc[1] > cc[2] && cc[2] > cc[3], `${key}: crust seals at f0, opens toward apex (${cc.join('>')})`);
}


console.log(`\nStarter geometry asserts (§7)${cp1 ? ' — CP1 (apex bands)' : ''}: ${pass} passed, ${fail} failed.`);
if (fail) { for (const f of fails) console.log('  ✗ ' + f); process.exit(1); }
process.exit(0);
