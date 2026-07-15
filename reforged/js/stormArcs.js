// stormArcs.js — the Tempest Surge "ARC CROWN": forked lightning arcs that leap through open air
// between her body parts (wingtip↔wingtip over the back, wingtip→spine, spine→tail, dynamo→wing-root)
// on the thunder beat. Built to the premium Fable pre-assess spec:
//   • PATH: recursive midpoint displacement (NOT a zigzag), jittered split points, a KINK pass (2–3
//     sharp elbows over calm runs), dominant displacement in the camera-facing (up/back) plane.
//   • FORKS: 2–3 thinner branches tapering to a point, biased away from the body.
//   • CROSS-SECTION: two billboarded additive ribbons — a thin white-hot CORE (0xf2f4ff) + a wide soft
//     HALO (0xd9deff, vertex-alpha soft edge). depthWrite off, depthTest on (her wings occlude arcs
//     passing behind → sells "in the air"). One core mesh + one halo mesh, preallocated, zero per-flash
//     alloc. Path FROZEN for its short life (no per-frame vertex crawl); life = the pulseTimer window.
// Deterministic: all randomness via mulberry32 (seeded per window), so `?strikePin` captures reproduce.
import { mulberry32 } from './pulseTimer.js';

// ── a normalized displaced CHANNEL in param space: array of { t, u, v } where a world point is
// A + (B−A)·t + axU·(u·chord) + axV·(v·chord). Midpoint displacement + jittered split + kink pass.
function genChannel(rng, subdiv, R, kinkN) {
  let pts = [{ t: 0, u: 0, v: 0, wj: 1 }, { t: 1, u: 0, v: 0, wj: 1 }];
  for (let lvl = 0; lvl < subdiv; lvl++) {
    const out = [];
    const amp = 0.5 * Math.pow(0.5, lvl) * R;            // macro drift → fine micro-jitter as level rises
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      out.push(a);
      const tt = 0.5 + 0.18 * (rng() - 0.5) * 2;         // jittered split (kills the even-cadence tell)
      const seg = b.t - a.t;
      out.push({ t: a.t + seg * tt,
        u: a.u + (b.u - a.u) * tt + (rng() - 0.5) * 2 * amp * 1.0,   // 70% weight → dominant (camera) plane
        v: a.v + (b.v - a.v) * tt + (rng() - 0.5) * 2 * amp * 0.42,
        wj: 0.62 + rng() * 0.76 });                       // per-point width multiplier → the bolt visibly swells & pinches
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  // KINK pass — pick a few interior points (never adjacent, middle 70%) and violently amplify them.
  const lo = Math.floor(pts.length * 0.15), hi = Math.ceil(pts.length * 0.85);
  let last = -9;
  for (let k = 0; k < kinkN; k++) {
    const idx = lo + Math.floor(rng() * (hi - lo));
    if (idx <= last + 1 || idx <= 0 || idx >= pts.length - 1) continue;
    const m = 1.9 + rng() * 0.5;
    pts[idx].u *= m; pts[idx].v *= m; last = idx;
  }
  return pts;
}

// a FORK: a shorter, rattier channel branching off the main channel at param t0, carrying its own
// normalized offsets relative to the SAME axes. Tapers to a literal point.
function genFork(rng, main, t0, dirSign) {
  // find the main point nearest t0 for the branch origin offset
  let base = main[0];
  for (const p of main) { if (p.t >= t0) { base = p; break; } }
  const len = (0.25 + rng() * 0.20) * (1 - t0);          // 25–45% of the remaining channel
  const n = 5 + Math.floor(rng() * 3);                    // 5–7 points
  const out = [];
  const swing = (0.35 + rng() * 0.35) * dirSign;          // 20–40° away, biased outward
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    // width holds thick over most of the branch then pinches to a point ONLY in the last stretch — so
    // the shaft renders as a solid ribbon (≥2px), never a dotted 1px line, and just the tip tapers away.
    const w = (f < 0.7 ? 1.0 - 0.28 * (f / 0.7) : 0.72 * (1 - (f - 0.7) / 0.3));
    out.push({ t: base.t + len * f,
      u: base.u + swing * len * f + (rng() - 0.5) * 2 * 0.22 * (1 - f) * len,
      v: base.v + (rng() - 0.5) * 2 * 0.14 * (1 - f) * len,
      w });                                               // core width fraction, tapering to a POINT
  }
  return out;
}

// width envelope along t (contact flare at both roots, pinch at the far end) × per-vertex jitter.
function widthAt(t, jit) {
  let e;
  if (t < 0.04) e = 1.6 - (1.6 - 1.0) * (t / 0.04);       // hot contact flare where it roots
  else if (t < 0.15) e = 1.0 + (1.0 - 1.0) * 0;
  else if (t < 0.9) e = 1.0 - (1.0 - 0.75) * ((t - 0.15) / 0.75);
  else e = 0.75 - (0.75 - 0.4) * ((t - 0.9) / 0.1) + (t > 0.96 ? (t - 0.96) / 0.04 * 1.0 : 0);   // pinch → far contact
  return e * (0.88 + jit * 0.24);
}

export function createArcCrown(THREE, opts = {}) {
  const coreColor = new THREE.Color(opts.coreColor ?? 0xf2f4ff);
  // A DEEPLY saturated storm-blue for the corona. The critic's target fringe (~200,215,255) has R pulled
  // BELOW the pink sky (247) — additive light can only brighten, so an additive halo can never read blue
  // over this sky. The halo therefore ALPHA-COMPOSITES this blue (NormalBlending): it TINTS the fringe
  // toward periwinkle, pulling R down, which is the only way to grow a real colored corona over pink.
  const haloColor = new THREE.Color(opts.haloColor ?? 0x5182ff);
  const CORE_W = opts.coreW ?? 0.024, HALO_MUL = 8.5, CORE_I = 3.4;
  const HALO_A = 0.9;                                     // peak corona alpha (normal-blended tint strength)
  const FORK_HALO_MUL = 3.4;                              // forks get a slimmer corona so they glow, not stipple
  const MAXSEG = 640;                                     // total ribbon segments across all live arcs
  const group = new THREE.Group(); group.renderOrder = 6; group.frustumCulled = false;

  const mkMesh = (vertsPerSeg, blending) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXSEG * vertsPerSeg * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAXSEG * vertsPerSeg * 4), 4).setUsage(THREE.DynamicDrawUsage));
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending, depthWrite: false, depthTest: true, side: THREE.DoubleSide, toneMapped: true });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 6;
    return mesh;
  };
  const coreMesh = mkMesh(6, THREE.AdditiveBlending);     // white-hot core, ADDITIVE (2 tris/seg = 6 verts)
  const haloMesh = mkMesh(24, THREE.NormalBlending);      // blue corona, ALPHA-COMPOSITED (core + forks; 3-row soft edge)
  group.add(haloMesh); group.add(coreMesh);   // halo under core

  // preallocated scratch
  const A = new THREE.Vector3(), B = new THREE.Vector3(), chord = new THREE.Vector3(), axU = new THREE.Vector3(),
    axV = new THREE.Vector3(), P = new THREE.Vector3(), Pn = new THREE.Vector3(), seg = new THREE.Vector3(),
    wv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), camL = new THREE.Vector3();
  const worldToLocal = new THREE.Matrix4();

  let live = [];   // active arcs: { channels:[{pts}], getA, getB, born }

  // fire — (re)generate the frozen normalized channels for the chosen routes. `routes` is an array of
  // { getA, getB, forks } whose getA/getB return WORLD Vector3s (sampled fresh here). Seeded → determin.
  function fire(seed, routes) {
    const rng = mulberry32(seed | 0);
    live = routes.map((r) => {
      const long = true;
      const subdiv = 4, R = 0.17 + rng() * 0.05;
      const main = genChannel(rng, subdiv, R, 2 + Math.floor(rng() * 2));
      const channels = [{ pts: main, core: 1.0 }];
      const nF = r.forks ?? 2;
      for (let k = 0; k < nF; k++) channels.push({ pts: genFork(rng, main, 0.25 + rng() * 0.5, k % 2 ? 1 : -1), core: 0.9 });
      return { channels, getA: r.getA, getB: r.getB };
    });
  }

  // render — rebuild the billboarded ribbons from the frozen channels + LIVE endpoints + camera dir,
  // scaled by intensity01 (the pulse env). Called every frame while arcs live. camWorld = camera pos.
  let ci = 0, hi = 0;
  const cpos = coreMesh.geometry.attributes.position.array, ccol = coreMesh.geometry.attributes.color.array;
  const hpos = haloMesh.geometry.attributes.position.array, hcol = haloMesh.geometry.attributes.color.array;
  function pushCoreQuad(a, b, wa, wb, intensity) {
    // a,b are centreline local points; wa,wb the billboard width vectors (already scaled).
    const cr = coreColor.r * CORE_I * intensity, cg = coreColor.g * CORE_I * intensity, cb = coreColor.b * CORE_I * intensity;
    const q = [[a.x - wa.x, a.y - wa.y, a.z - wa.z], [a.x + wa.x, a.y + wa.y, a.z + wa.z], [b.x + wb.x, b.y + wb.y, b.z + wb.z],
      [a.x - wa.x, a.y - wa.y, a.z - wa.z], [b.x + wb.x, b.y + wb.y, b.z + wb.z], [b.x - wb.x, b.y - wb.y, b.z - wb.z]];
    for (const v of q) { if (ci >= MAXSEG * 6) return; cpos[ci * 3] = v[0]; cpos[ci * 3 + 1] = v[1]; cpos[ci * 3 + 2] = v[2]; ccol[ci * 4] = cr; ccol[ci * 4 + 1] = cg; ccol[ci * 4 + 2] = cb; ccol[ci * 4 + 3] = 1; ci++; }
  }
  // Halo is NORMAL-blended: rgb carries the constant blue TINT (0..1), the per-vertex alpha is the
  // soft-edge coverage. Compositing blue over the pink sky pulls the fringe's R down → a real blue corona
  // (additive could only brighten toward white). A hair of intensity feeds the color so it glows at peak.
  function pushHaloTri(p0, p1, p2, a0, a1, a2, intensity) {
    const kb = Math.min(1, 0.78 + 0.30 * intensity);
    const hr = haloColor.r * kb, hg = haloColor.g * kb, hb = haloColor.b * kb;
    const vs = [[p0, a0], [p1, a1], [p2, a2]];
    for (const [p, al] of vs) { if (hi >= MAXSEG * 24) return; hpos[hi * 3] = p.x; hpos[hi * 3 + 1] = p.y; hpos[hi * 3 + 2] = p.z; hcol[hi * 4] = hr; hcol[hi * 4 + 1] = hg; hcol[hi * 4 + 2] = hb; hcol[hi * 4 + 3] = al * intensity * HALO_A; hi++; }
  }
  // emit the 3-row soft-edge corona ribbon for one segment (reused by the main bolt and the forks).
  function pushHaloRibbon(p0, p1, hw0, hw1, intensity) {
    L.copy(p0).addScaledVector(wv, -hw0); Cc.copy(p0); Rr.copy(p0).addScaledVector(wv, hw0);
    Ln.copy(p1).addScaledVector(wv, -hw1); Cn.copy(p1); Rn.copy(p1).addScaledVector(wv, hw1);
    pushHaloTri(L, Cc, Cn, 0, 1, 1, intensity); pushHaloTri(L, Cn, Ln, 0, 1, 0, intensity);
    pushHaloTri(Cc, Rr, Rn, 1, 0, 0, intensity); pushHaloTri(Cc, Rn, Cn, 1, 0, 1, intensity);
  }
  const L = new THREE.Vector3(), Cc = new THREE.Vector3(), Rr = new THREE.Vector3(), Ln = new THREE.Vector3(), Cn = new THREE.Vector3(), Rn = new THREE.Vector3();

  // camDirLocal: a fixed direction toward the chase camera in arc-group-local space (behind + above the
  // dragon). Billboarding against it (rather than a live camera we don't have here) is exact enough — the
  // chase cam holds a near-constant pose relative to the dragon.
  function render(camDirLocal, intensity01) {
    ci = 0; hi = 0;
    camL.copy(camDirLocal).normalize();
    if (intensity01 > 0.001 && live.length) {
      group.updateWorldMatrix(true, false);
      worldToLocal.copy(group.matrixWorld).invert();
      for (const arc of live) {
        A.copy(arc.getA()).applyMatrix4(worldToLocal);
        B.copy(arc.getB()).applyMatrix4(worldToLocal);
        chord.copy(B).sub(A); const clen = chord.length() || 1; chord.multiplyScalar(1 / clen);
        // axU = the perpendicular closest to world-up (arcs bow UP → visible from the chase cam); axV = chord×axU
        axU.copy(up).addScaledVector(chord, -up.dot(chord)); if (axU.lengthSq() < 1e-4) axU.set(1, 0, 0); axU.normalize();
        axV.copy(chord).cross(axU).normalize();
        for (const ch of arc.channels) {
          const pts = ch.pts;
          // build world-local centreline points
          const wpts = pts.map((p) => new THREE.Vector3().copy(A).addScaledVector(chord, p.t * clen).addScaledVector(axU, p.u * clen).addScaledVector(axV, p.v * clen));
          for (let i = 0; i < wpts.length - 1; i++) {
            const p0 = wpts[i], p1 = wpts[i + 1];
            seg.copy(p1).sub(p0).normalize();
            wv.crossVectors(seg, camL); if (wv.lengthSq() < 1e-5) wv.copy(axU); wv.normalize();   // billboard width ⟂ seg & cam
            const t0 = pts[i].t, t1 = pts[i + 1].t;
            const isMain = ch.core >= 1;
            const baseW = (ch.core) * CORE_W * (isMain ? 1 : (pts[i].w ?? 0.5));
            // per-point width jitter (main bolt only) makes the core visibly swell & pinch, killing the
            // constant-3px right-half tell; forks taper via their own `w` fraction, no extra jitter.
            const wjA = isMain ? (pts[i].wj ?? 1) : 1, wjB = isMain ? (pts[i + 1].wj ?? 1) : 1;
            const w0 = baseW * widthAt(t0, ((i * 2654435761) % 100) / 100) * wjA;
            const w1 = baseW * widthAt(t1, ((i * 40503 + 7) % 100) / 100) * wjB;
            // CORE quad
            wa_.copy(wv).multiplyScalar(w0); wb_.copy(wv).multiplyScalar(w1);
            pushCoreQuad(p0, p1, wa_, wb_, intensity01);
            // HALO corona — wide on the main bolt, slimmer on forks (so branches glow, not stipple)
            const hmul = isMain ? HALO_MUL : FORK_HALO_MUL;
            pushHaloRibbon(p0, p1, w0 * hmul, w1 * hmul, intensity01);
          }
        }
      }
    }
    coreMesh.geometry.attributes.position.needsUpdate = true; coreMesh.geometry.attributes.color.needsUpdate = true;
    haloMesh.geometry.attributes.position.needsUpdate = true; haloMesh.geometry.attributes.color.needsUpdate = true;
    coreMesh.geometry.setDrawRange(0, ci); haloMesh.geometry.setDrawRange(0, hi);
    group.visible = ci > 0;
  }
  const wa_ = new THREE.Vector3(), wb_ = new THREE.Vector3();

  function clear() { live = []; ci = 0; hi = 0; coreMesh.geometry.setDrawRange(0, 0); haloMesh.geometry.setDrawRange(0, 0); group.visible = false; }

  return { group, fire, render, clear };
}
