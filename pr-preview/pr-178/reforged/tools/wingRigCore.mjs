// Pure core for the WING-RIG editor (an extension of tools/glbtagger.html). No DOM/WebGL — segmentation
// and joint math live here so they're headless-testable (tests/wingrig.mjs); the tool owns the Three FK
// preview and the handle UI. The idea: the tagger already identifies which verts are WING (the gate box);
// this splits that wing span-wise into N bone segments and places a shoulder→…→tip joint chain, so a
// lagged-whip cascade (the same believable motion the procedural wings use) can drive it.
//
// COORDINATES: everything is mesh-local (the GLB's own base positions), the same frame the gates and the
// shader deform use — orientation (rotX/Y/Z) is a display/placement transform applied AFTER, so the rig is
// orientation-independent (a bone chain tagged here survives any later re-orient/bake).

const AXIS = { x: 0, y: 1, z: 2 };

// Even joint SPAN boundaries from the wing root (hingeX) out to the tip, for `bones` segments.
// Returns bones+1 ascending span values: [hingeX, …, tip]. Custom splits can replace the interior later.
export function evenJointSpans(hingeX, tip, bones) {
  const n = Math.max(1, Math.round(bones));
  const out = [];
  for (let i = 0; i <= n; i++) out.push(+(hingeX + (tip - hingeX) * (i / n)).toFixed(4));
  return out;
}

// Which bone (0…bones-1) owns a vertex at |span| = spanAbs, given ascending joint boundaries.
// Verts inboard of the first joint clamp to bone 0; outboard of the last clamp to the tip bone.
export function boneIndex(spanAbs, jointSpans) {
  const n = jointSpans.length - 1;
  if (spanAbs <= jointSpans[0]) return 0;
  if (spanAbs >= jointSpans[n]) return n - 1;
  for (let i = 0; i < n; i++) if (spanAbs < jointSpans[i + 1]) return i;
  return n - 1;
}

// Assign every WING vertex (partIds[i] === wingPart) to a bone index; non-wing verts get -1.
// `spanAxis` is 'x'|'y'|'z'. Returns Int16Array(vertexCount).
export function assignBones(positions, partIds, wingPart, spanAxis, jointSpans) {
  const pa = AXIS[spanAxis];
  const n = positions.length / 3;
  const out = new Int16Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    if (partIds[i] !== wingPart) continue;
    out[i] = boneIndex(Math.abs(positions[i * 3 + pa]), jointSpans);
  }
  return out;
}

// Per-bone vertex counts (sanity readout; index 0…bones-1, plus `unassigned`).
export function boneCounts(boneIds, bones) {
  const c = new Array(bones).fill(0);
  let un = 0;
  for (let i = 0; i < boneIds.length; i++) { const b = boneIds[i]; if (b < 0) un++; else if (b < bones) c[b]++; }
  return { perBone: c, unassigned: un };
}

// A readable color ramp shoulder→tip (cool→warm), so each segment is distinct in the "Rig" view.
const RIG_RAMP = [[0.36, 0.70, 1.0], [0.45, 0.95, 0.8], [1.0, 0.85, 0.3], [1.0, 0.55, 0.2], [1.0, 0.30, 0.5]];
export function boneColor(i, bones) {
  if (bones <= 1) return RIG_RAMP[0];
  const t = i / (bones - 1) * (RIG_RAMP.length - 1);
  const a = RIG_RAMP[Math.floor(t)], b = RIG_RAMP[Math.min(RIG_RAMP.length - 1, Math.ceil(t))], f = t - Math.floor(t);
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}
export function boneColorBuffer(boneIds, bones) {
  const col = new Float32Array(boneIds.length * 3);
  for (let i = 0; i < boneIds.length; i++) {
    if (boneIds[i] < 0) { col[i * 3] = 0.26; col[i * 3 + 1] = 0.29; col[i * 3 + 2] = 0.35; continue; } // body grey
    const c = boneColor(boneIds[i], bones);
    col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
  }
  return col;
}

// 3D joint positions for ONE wing (the +span side), placed along the span at the shoulder's depth/height.
// joint j sits at: span = jointSpans[j] on the spanAxis, and shoulder[depth]/shoulder[height] on the other
// two axes — i.e. the chain runs straight out along the span from the placed shoulder pivot. side=±1
// mirrors across the span axis. Returns an array of [x,y,z] (mesh-local). The tool can drag these later;
// this is the sensible default chain.
export function jointChain(jointSpans, spanAxis, shoulder, side = 1) {
  const pa = AXIS[spanAxis];
  return jointSpans.map((s) => {
    const p = [shoulder[0], shoulder[1], shoulder[2]];
    p[pa] = side * s;
    return p;
  });
}

// The flap ROTATION AXIS for the cascade, in mesh-local, derived from the same `tilt` the shader uses:
// at tilt 0 the bones rotate about the SPINE axis (wingtip beats through depth); at tilt ±90° the axis
// swings to the DEPTH axis (beat through the spine). Mirrors the shader's beat-plane tilt so the rig and
// the shader agree at N=1. Returns a unit [x,y,z].
export function flapAxis(spineAxis, depthAxis, tilt) {
  const a = [0, 0, 0];
  a[AXIS[spineAxis]] = Math.cos(tilt);
  a[AXIS[depthAxis]] = Math.sin(tilt);
  const L = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / L, a[1] / L, a[2] / L];
}

// Per-bone beat angle at a given phase: a lagged whip — bone i trails bone i-1 by `lag` radians and the
// swing grows toward the tip by `tipBias` (the shoulder leads small, the tip whips). Returns angles[0…N-1].
export function boneAngles(phase, bones, { amp = 0.6, lag = 0.5, tipBias = 0.6 } = {}) {
  const out = [];
  for (let i = 0; i < bones; i++) {
    const grow = 1 + tipBias * (bones > 1 ? i / (bones - 1) : 0);
    out.push(amp * grow * Math.sin(phase - i * lag));
  }
  return out;
}
