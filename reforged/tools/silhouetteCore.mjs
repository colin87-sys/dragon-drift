// Shared core for the silhouette tools: builds a dragon, projects every mesh triangle through a chosen
// camera, and rasterizes the filled silhouette — HEADLESS, no browser, no deps. Plus minimal PNG
// encode/decode (built-in zlib + a CRC32 table) so we can both write silhouettes and read a concept image
// to overlay against. Used by tools/silhouette.mjs (render) and tools/silhouette-overlay.mjs (compare).

import { register } from 'node:module';
import { deflateSync, inflateSync } from 'node:zlib';
register('./three-resolver.mjs', import.meta.url);

// DOM/canvas shim (same as readability.mjs) — building the model touches util.js canvas helpers + save.js.
const ctx2d = {
  createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {},
  set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set shadowColor(v) {}, set shadowBlur(v) {},
};
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {},
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
}
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

export const THREE = await import('three');
export const { DRAGONS } = await import('../js/dragons.js');
export const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');
const { solveWing, phaseCenter } = await import('../js/wingFlapSolver.js');

export const FORM = ['Hatchling', 'Kindled', 'Radiant', 'Eternal'];

// Per-part palette for the colored part-map (Tool B `colorParts`). A distinct flat
// hue per part so the agent can read, by eye, where each module sits and whether
// it's the right size — torso grey, wings cyan/blue, head yellow, tail magenta,
// legs green, surfaceLayers orange. Background stays black.
export const PART_PALETTE = {
  torso: [150, 150, 160], wingL: [60, 220, 255], wingR: [60, 120, 255],
  head: [255, 215, 80], tail: [230, 80, 220], legs: [90, 220, 120],
  surfaceLayers: [255, 150, 60],
};
// Classify a mesh to its part by walking up to the nearest ancestor carrying a
// `userData.part` tag (set centrally in dragonModel.js). Untagged → 'torso', which
// keeps the body loft / neck / any unlabelled decoration in the torso bucket.
function partOf(o) {
  for (let n = o; n; n = n.parent) if (n.userData && n.userData.part) return n.userData.part;
  return 'torso';
}

// Hold the Mk II yoke wing at one flap phase, headless — the SAME chain dragon.js drives (poseY,
// dragon.js:559-571) but NEUTRALISED (no bank/steer/boost), so a static silhouette can match a posed
// concept instead of the flat rest pose. `pose` is a phase name: glide|recovery|apex|downstroke|settle.
function applyPose(parts, flap, pose) {
  if (!flap || !parts || !parts.wingYokeL) return false;
  const ph = phaseCenter(pose, flap), s = solveWing(ph, flap), featR = Math.sin(ph + Math.PI * 0.55);
  const set = (yk, pv, md, tp) => {
    if (!yk) return;
    yk.rotation.set(s.yoke.twist, -0.12 - s.yoke.sweep, s.yoke.elev);          // yoke: elevation + rowing sweep
    if (pv) pv.rotation.set(0.10 + featR * 0.12, -0.12, s.inner.curl);          // inner: curl
    if (md) md.rotation.set(0.02, -s.mid.sweep, s.mid.curl);                    // mid: lagged curl + aft trail
    if (tp) tp.rotation.set(-0.04, 0.07 - s.tip.sweep, s.tip.curl);             // tip: trailing curl
  };
  set(parts.wingYokeR, parts.wingPivotR, parts.wingMidR, parts.wingTipR);
  set(parts.wingYokeL, parts.wingPivotL, parts.wingMidL, parts.wingTipL);
  return true;
}

// Render the filled silhouette of one dragon/form/view into an 8-bit coverage buffer (0 bg, 255 fill).
// perPart   → also accumulate per-part screen + world bounding boxes and derived proportion
//             measurements (wing span, body length, span/body ratio, head box, leg length).
// colorParts→ additionally paint an RGBA part-map (each part its PART_PALETTE hue); implies perPart.
// fov       → override the camera FOV. The 'rear' view defaults to 72 to MATCH the live chase cam
//             (main.js:59 / cameraController.js) so its foreshortening == a real gameplay screenshot
//             (pass 82/86/90 to match a speed/boost/fever shot). Framed views default to 60 (framing only).
export function renderSilhouette({ key, view = 'rear', tier, W, H, pose, hideWings = false, perPart = false, colorParts = false, profile = false, fov }) {
  perPart = perPart || colorParts || profile;
  const maxTier = maxTierFor(key);
  const t = tier != null ? tier : maxTier;
  const camFov = view === 'rear' ? (fov ?? 72) : (fov ?? 60);
  const cam = new THREE.PerspectiveCamera(camFov, W / H, 0.1, 200);
  const def = ascendedDef(DRAGONS[key], t, 0);
  const built = buildDragonModel(def, {});
  const group = built.group;
  if (pose) applyPose(built.parts || {}, def.model.flap, pose);
  // hideWings: drop the wing subtrees so the BODY silhouette can be inspected un-occluded.
  const skip = new Set();
  if (hideWings && built.parts) for (const k of ['wingYokeL', 'wingYokeR', 'wingRigL', 'wingRigR'])
    if (built.parts[k]) built.parts[k].traverse((o) => skip.add(o));
  if (view === 'climb') group.rotation.x = 0.92;          // ~53° nose-up: dorsal back, tail toward the lens
  group.updateMatrixWorld(true);

  if (view === 'rear') {                                  // the REAL chase cam (cameraController.js)
    cam.position.set(0, 3.6, 12.3); cam.lookAt(0, 1.0, -16);
  } else {                                                // framed views: auto-fit to the model bounds
    const box = new THREE.Box3().setFromObject(group), ctr = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const vfov = cam.fov * Math.PI / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * (W / H));
    if (view === 'climb') {
      const fit = Math.max(sz.y * 0.5 / Math.tan(vfov / 2), sz.x * 0.5 / Math.tan(hfov / 2));
      cam.position.set(ctr.x, ctr.y - fit * 0.42, ctr.z + fit * 1.5);
      cam.lookAt(ctr.x, ctr.y + sz.y * 0.18, ctr.z);
    } else {
      // dir = view axis; perpW/perpH = the dims that fill screen-horizontal/vertical (so we fit by what's
      // actually facing the lens). "top" looks straight down → body WIDTH (x) across, LENGTH (z) up-screen.
      let dir, perpW, perpH;
      if (view === 'front') { dir = new THREE.Vector3(0, 0.25, -1); perpW = sz.x; perpH = sz.y; }
      else if (view === 'top') { dir = new THREE.Vector3(0, 1, 0.0001); perpW = sz.x; perpH = sz.z; cam.up.set(0, 0, -1); }
      else if (view === 'threeq') { dir = new THREE.Vector3(0.85, 0.5, 1); perpW = Math.max(sz.x, sz.z); perpH = sz.y; } // REAR-¾-above (tail nearest lens, like the chase cam in a hard bank); +z = tail
      else { dir = new THREE.Vector3(1, 0.18, 0); perpW = sz.z; perpH = sz.y; }   // side; -z = head
      const fit = Math.max(perpH * 0.5 / Math.tan(vfov / 2), perpW * 0.5 / Math.tan(hfov / 2));
      cam.position.copy(ctr).addScaledVector(dir.normalize(), fit * 1.25); cam.lookAt(ctr);
    }
  }
  cam.updateMatrixWorld(true);
  cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  cam.updateProjectionMatrix();

  const buf = new Uint8Array(W * H);
  const rgba = colorParts ? new Uint8Array(W * H * 4) : null;
  const _w = new THREE.Vector3(), _e = new THREE.Vector3(), _n = new THREE.Vector3();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, tris = 0;
  // Per-part accumulators: label → { screen bbox px, pixel count, world aabb }.
  const parts = new Map();
  const partRec = (label) => {
    let r = parts.get(label);
    if (!r) { r = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, px: 0,
      wMinX: Infinity, wMaxX: -Infinity, wMinY: Infinity, wMaxY: -Infinity, wMinZ: Infinity, wMaxZ: -Infinity };
      parts.set(label, r); }
    return r;
  };
  const project = (i, attr, mw) => {
    _w.fromBufferAttribute(attr, i).applyMatrix4(mw);
    _e.copy(_w).applyMatrix4(cam.matrixWorldInverse);
    _n.copy(_w).project(cam);
    return { ez: _e.z, x: (_n.x * 0.5 + 0.5) * W, y: (1 - (_n.y * 0.5 + 0.5)) * H, wx: _w.x, wy: _w.y, wz: _w.z };
  };
  const fillTri = (a, b, c, rec, col, accProf) => {
    // World aabb + the z-slice profile are GEOMETRY properties (camera-independent), so
    // accumulate them BEFORE the near-plane cull → measurements/profile are identical from
    // any render view (the camera only governs the screen rasterization below).
    if (rec) for (const v of [a, b, c]) {
      if (v.wx < rec.wMinX) rec.wMinX = v.wx; if (v.wx > rec.wMaxX) rec.wMaxX = v.wx;
      if (v.wy < rec.wMinY) rec.wMinY = v.wy; if (v.wy > rec.wMaxY) rec.wMaxY = v.wy;
      if (v.wz < rec.wMinZ) rec.wMinZ = v.wz; if (v.wz > rec.wMaxZ) rec.wMaxZ = v.wz;
    }
    // Body cross-section profile: bin the torso's verts by world Z (0.1u slices) and track
    // the width (x) + height (y) of each slice → shows WHERE the body bulges/pinches.
    if (accProf) for (const v of [a, b, c]) {
      const k = Math.round(v.wz / 0.1);
      let p = accProf.get(k);
      if (!p) { p = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }; accProf.set(k, p); }
      if (v.wx < p.minX) p.minX = v.wx; if (v.wx > p.maxX) p.maxX = v.wx;
      if (v.wy < p.minY) p.minY = v.wy; if (v.wy > p.maxY) p.maxY = v.wy;
    }
    if (a.ez > -0.05 || b.ez > -0.05 || c.ez > -0.05) return;   // screen raster: in-front tris only
    const loX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))), hiX = Math.min(W - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
    const loY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))), hiY = Math.min(H - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
    const d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(d) < 1e-9) return;
    for (let y = loY; y <= hiY; y++) for (let x = loX; x <= hiX; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((b.y - c.y) * (px - c.x) + (c.x - b.x) * (py - c.y)) / d;
      const w1 = ((c.y - a.y) * (px - c.x) + (a.x - c.x) * (py - c.y)) / d;
      if (w0 >= 0 && w1 >= 0 && w0 + w1 <= 1) {
        buf[y * W + x] = 255;
        if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (rgba && col) { const d4 = (y * W + x) * 4; rgba[d4] = col[0]; rgba[d4 + 1] = col[1]; rgba[d4 + 2] = col[2]; rgba[d4 + 3] = 255; }
        if (rec) { rec.px++; if (x < rec.minX) rec.minX = x; if (x > rec.maxX) rec.maxX = x; if (y < rec.minY) rec.minY = y; if (y > rec.maxY) rec.maxY = y; }
      }
    }
  };
  const torsoProf = profile ? new Map() : null;
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || skip.has(o)) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index, mw = o.matrixWorld;
    const label = perPart ? partOf(o) : null;
    const rec = perPart ? partRec(label) : null;
    const col = colorParts ? (PART_PALETTE[label] || PART_PALETTE.torso) : null;
    const accProf = (torsoProf && label === 'torso') ? torsoProf : null;
    const tri = (i0, i1, i2) => { fillTri(project(i0, pos, mw), project(i1, pos, mw), project(i2, pos, mw), rec, col, accProf); tris++; };
    if (idx) for (let i = 0; i < idx.count; i += 3) tri(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
    else for (let i = 0; i < pos.count; i += 3) tri(i, i + 1, i + 2);
  });
  const bounds = maxX >= minX ? { minX, maxX, minY, maxY } : null;

  // Roll the per-part accumulators up into clean boxes + derived proportions.
  let perPartBoxes = null, measurements = null;
  if (perPart) {
    perPartBoxes = {};
    for (const [label, r] of parts) {
      if (r.px === 0) continue;
      perPartBoxes[label] = {
        screen: { x0: r.minX, y0: r.minY, x1: r.maxX, y1: r.maxY, px: r.px },
        world: { x: [r.wMinX, r.wMaxX], y: [r.wMinY, r.wMaxY], z: [r.wMinZ, r.wMaxZ],
          size: { x: r.wMaxX - r.wMinX, y: r.wMaxY - r.wMinY, z: r.wMaxZ - r.wMinZ } },
      };
    }
    const wl = perPartBoxes.wingL?.world, wr = perPartBoxes.wingR?.world, body = perPartBoxes.torso?.world;
    const head = perPartBoxes.head?.world, legs = perPartBoxes.legs?.world, tail = perPartBoxes.tail?.world;
    const round = (n) => (n == null || !isFinite(n) ? null : Math.round(n * 1000) / 1000);
    // wing span = full tip-to-tip in world X (both sides if present, else the one side doubled about x=0).
    let wingSpan = null;
    if (wl && wr) wingSpan = Math.max(wr.x[1], wl.x[1]) - Math.min(wr.x[0], wl.x[0]);
    else if (wr) wingSpan = 2 * Math.max(Math.abs(wr.x[0]), Math.abs(wr.x[1]));
    else if (wl) wingSpan = 2 * Math.max(Math.abs(wl.x[0]), Math.abs(wl.x[1]));
    const bodyLength = body ? body.z[1] - body.z[0] : null;
    // The dimensions a REAR silhouette is blind to (wing edge-on, body cross-section):
    // chord = wing fore-aft depth (z), thickness = wing height (y) → "thin sheet vs thick
    // blade"; bodyWidth/Height = the torso cross-section → "chest deep, not flat". These
    // come from the world AABB so they're correct regardless of the render view (read them
    // off a side/top render in practice, where they're not foreshortened).
    const mx = (a, b, f) => (a || b ? Math.max(a ? f(a) : -Infinity, b ? f(b) : -Infinity) : null);
    const wingChord = mx(wl, wr, (w) => w.size.z);
    const wingThickness = mx(wl, wr, (w) => w.size.y);
    const bodyWidth = body ? body.size.x : null, bodyHeight = body ? body.size.y : null;
    measurements = {
      wingSpan: round(wingSpan),
      bodyLength: round(bodyLength),
      wingSpanToBodyRatio: wingSpan && bodyLength ? round(wingSpan / bodyLength) : null,
      wingChord: round(wingChord),
      wingThickness: round(wingThickness),
      // high = thin sheet/membrane, low = thick blade — the "how thick is the wing" answer.
      wingAspect: wingChord && wingThickness ? round(wingChord / wingThickness) : null,
      bodyWidth: round(bodyWidth),
      bodyHeight: round(bodyHeight),
      // >1 = deep/tall chest, <1 = wide/flat — the "chest deep, not flat" answer.
      bodyDepthRatio: bodyHeight && bodyWidth ? round(bodyHeight / bodyWidth) : null,
      headBox: head ? { x: round(head.size.x), y: round(head.size.y), z: round(head.size.z) } : null,
      headToBodyRatio: head && bodyLength ? round(head.size.z / bodyLength) : null,
      tailLength: tail ? round(tail.z[1] - tail.z[0]) : null,
      legLength: legs ? round(legs.y[1] - legs.y[0]) : null,
      legToBodyRatio: legs && bodyLength ? round((legs.y[1] - legs.y[0]) / bodyLength) : null,
    };
  }

  // Body cross-section profile resampled to ~12 even stations head(−Z) → tail(+Z): each is
  // { z, width, height } so a chest→waist→hip pinch is a NUMBER, not just a top-view picture.
  let torsoProfile = null;
  if (torsoProf && torsoProf.size) {
    const round = (n) => (n == null || !isFinite(n) ? null : Math.round(n * 1000) / 1000);
    const bins = [...torsoProf.entries()]
      .map(([k, p]) => ({ z: k * 0.1, width: p.maxX - p.minX, height: p.maxY - p.minY }))
      .filter((b) => isFinite(b.width)).sort((a, b) => a.z - b.z);
    if (bins.length) {
      const N = 12, z0 = bins[0].z, z1 = bins[bins.length - 1].z;
      torsoProfile = [];
      for (let i = 0; i < N; i++) {
        const zt = z0 + (z1 - z0) * (i / (N - 1));
        let best = bins[0], bd = Infinity;
        for (const b of bins) { const dd = Math.abs(b.z - zt); if (dd < bd) { bd = dd; best = b; } }
        torsoProfile.push({ z: round(best.z), width: round(best.width), height: round(best.height) });
      }
    }
  }

  return { buf, rgba, W, H, bounds, tris, parts: perPartBoxes, measurements, torsoProfile,
    name: DRAGONS[key].name || key, formName: FORM[t] || `T${t}` };
}

// --- PNG: CRC32 + chunk framing ----------------------------------------------
const crcTable = (() => { const tb = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); tb[n] = c >>> 0; }
  return tb; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// Encode an RGBA buffer (4 bytes/px) to a PNG (color type 6).
export function pngRGBA(w, h, rgba) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
// Encode an 8-bit coverage buffer to a grayscale PNG (color type 0).
export function pngGray(w, h, gray) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 0;
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w + 1)] = 0; for (let x = 0; x < w; x++) raw[y * (w + 1) + 1 + x] = gray[y * w + x]; }
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Decode a non-interlaced 8-bit PNG (grayscale/RGB/RGBA) → { w, h, rgba } (always 4 bytes/px).
const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); };
export function decodePNG(buf) {
  let p = 8, w = 0, h = 0, ctype = 0, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p); const type = buf.toString('ascii', p + 4, p + 8); const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ctype = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const ch = ctype === 6 ? 4 : ctype === 2 ? 3 : 1;            // RGBA / RGB / gray
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * ch, out = Buffer.alloc(w * h * 4);
  const prev = Buffer.alloc(stride); let q = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[q++]; const cur = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0, b = prev[i], c = i >= ch ? prev[i - ch] : 0; let v = raw[q++];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) v += paeth(a, b, c);
      cur[i] = v & 0xFF;
    }
    for (let x = 0; x < w; x++) {
      const s = x * ch, d = (y * w + x) * 4;
      out[d] = cur[s]; out[d + 1] = ch >= 3 ? cur[s + 1] : cur[s]; out[d + 2] = ch >= 3 ? cur[s + 2] : cur[s]; out[d + 3] = ch === 4 ? cur[s + 3] : 255;
    }
    cur.copy(prev);
  }
  return { w, h, rgba: out };
}
