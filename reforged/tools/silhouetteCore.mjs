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
const { setFlapDebugPose, WING_DEBUG_STATES } = await import('../js/wingDebugPose.js');

export const FORM = ['Hatchling', 'Kindled', 'Radiant', 'Eternal'];
export { WING_DEBUG_STATES };

// The wing-subtree roots across ALL motion paths — used to hide (--no-wings) or isolate
// (--wings-only) the wings. Traversing these covers every wing mesh: pivot/mid/tip hang
// under the yoke (yoke path) or the rig (skinned), or ARE the root (basic direct-pivot).
const WING_ROOTS = ['wingYokeL', 'wingYokeR', 'wingRigL', 'wingRigR',
  'wingPivotL', 'wingPivotR', 'wingPivot2L', 'wingPivot2R'];
function wingMeshSet(parts) {
  const set = new Set();
  if (!parts) return set;
  for (const k of WING_ROOTS) if (parts[k]) parts[k].traverse((o) => set.add(o));
  return set;
}

// Render the filled silhouette of one dragon/form/view into an 8-bit coverage buffer (0 bg, 255 fill).
// pose (glide|recovery|apex|downstroke|settle|fold|bank) freezes the wings at a named pose via the
// SHARED poser (works on EVERY dragon now, not just the yoke path). hideWings drops the wings;
// wingsOnly keeps ONLY the wings (the inverse — for pixel-level gap/scallop judgment).
export function renderSilhouette({ key, view = 'rear', tier, W, H, pose, hideWings = false, wingsOnly = false }) {
  const maxTier = maxTierFor(key);
  const t = tier != null ? tier : maxTier;
  const cam = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
  const def = ascendedDef(DRAGONS[key], t, 0);
  // preview:true OMITS the gameplay aiming-pip (a small always-on-top octahedron on the snout)
  // — otherwise it fills as a detached DIAMOND ahead of the nose in every black-fill and reads
  // as a floating component (gate r5–r7 "floating orb": it was the HUD pip, not head geometry).
  const built = buildDragonModel(def, { preview: true });
  const group = built.group;
  if (pose) setFlapDebugPose(built.parts || {}, def.model, pose);
  // hideWings drops the wing subtrees (isolate the BODY); wingsOnly keeps ONLY them (isolate the
  // wings for gap/scallop judgment). Same wing-mesh set, opposite selection.
  const skip = new Set();
  if ((hideWings || wingsOnly) && built.parts) {
    const wings = wingMeshSet(built.parts);
    if (hideWings) for (const o of wings) skip.add(o);
    else group.traverse((o) => { if ((o.isMesh || o.isSkinnedMesh) && !wings.has(o)) skip.add(o); });
  }
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
      else if (view === 'rearfit') { dir = new THREE.Vector3(0, 0.22, 1); perpW = sz.x; perpH = sz.y; }  // AUTO-FIT rear (behind, +z) — the measurement frame the chase-cam 'rear' clips at apex span (gate r5 dir1)
      else if (view === 'top') { dir = new THREE.Vector3(0, 1, 0.0001); perpW = sz.x; perpH = sz.z; cam.up.set(0, 0, -1); }
      else if (view === 'threeq') { dir = new THREE.Vector3(0.85, 0.5, 1); perpW = Math.max(sz.x, sz.z); perpH = sz.y; } // REAR-¾-above (tail nearest lens, like the chase cam in a hard bank); +z = tail
      else { dir = new THREE.Vector3(1, 0.18, 0); perpW = sz.z; perpH = sz.y; }   // side; -z = head
      const fit = Math.max(perpH * 0.5 / Math.tan(vfov / 2), perpW * 0.5 / Math.tan(hfov / 2));
      cam.position.copy(ctr).addScaledVector(dir.normalize(), fit * 2.45); cam.lookAt(ctr);  // ≥25% margin every edge — the swept apex wing still clipped the side frame at 1.9 (gate r10 dir 5)
    }
  }
  cam.updateMatrixWorld(true);
  cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  cam.updateProjectionMatrix();

  const buf = new Uint8Array(W * H);
  const _w = new THREE.Vector3(), _e = new THREE.Vector3(), _n = new THREE.Vector3();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, tris = 0;
  const project = (i, attr, mw) => {
    _w.fromBufferAttribute(attr, i).applyMatrix4(mw);
    _e.copy(_w).applyMatrix4(cam.matrixWorldInverse);
    _n.copy(_w).project(cam);
    return { ez: _e.z, x: (_n.x * 0.5 + 0.5) * W, y: (1 - (_n.y * 0.5 + 0.5)) * H };
  };
  const fillTri = (a, b, c) => {
    if (a.ez > -0.05 || b.ez > -0.05 || c.ez > -0.05) return;
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
      }
    }
  };
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || skip.has(o)) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index, mw = o.matrixWorld;
    const tri = (i0, i1, i2) => { fillTri(project(i0, pos, mw), project(i1, pos, mw), project(i2, pos, mw)); tris++; };
    if (idx) for (let i = 0; i < idx.count; i += 3) tri(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
    else for (let i = 0; i < pos.count; i += 3) tri(i, i + 1, i + 2);
  });
  const bounds = maxX >= minX ? { minX, maxX, minY, maxY } : null;
  return { buf, W, H, bounds, tris, name: DRAGONS[key].name || key, formName: FORM[t] || `T${t}` };
}

// ── HOLE METRIC ──────────────────────────────────────────────────────────────
// Flood-fill analysis of a filled coverage buffer (0 bg, 255 fill) — the roster's
// MITTEN detector and the Revenant's SKELETON gauge (WRAITH-GRAVELIGHT §B.8). It
// answers "does this silhouette have true interior through-holes, and how big?" —
// the thing a filled-web wing (MITTEN) fails and a bone-lattice must pass.
//
// Method: flood the BACKGROUND (0) inward from every border pixel (4-connectivity)
// → everything reachable is "outside". Any 0 pixel NOT reached is enclosed by fill
// = a true interior HOLE. Label those into connected components (each a distinct
// through-window) and measure. Separately label the FILL (255) into components so
// the "ONE connected outline" law (§4.2) is checkable.
//
// Fractions are taken against the PLANFORM = fill + holes (the solid outline area
// the holes are punched out of), so holeFraction matches the §4.5 ladder's
// "hole-fraction (side)" band {0, .08, .16, .26}. minHoleArea filters rasteriser
// pinholes (default 3px) so a 1px seam gap isn't counted as a design aperture; the
// px-floor caller (§F) then checks each surviving hole against its own threshold.
export function holeMetric(buf, W, H, { minHoleArea = 3, minFillArea = 8 } = {}) {
  const N = W * H;
  const region = new Uint8Array(N);   // 0 = unvisited, 1 = outside-bg, 2 = hole-bg
  const stack = new Int32Array(N);
  // 1) Flood the OUTSIDE background from the border.
  let sp = 0;
  const pushOutside = (i) => { if (buf[i] === 0 && region[i] === 0) { region[i] = 1; stack[sp++] = i; } };
  for (let x = 0; x < W; x++) { pushOutside(x); pushOutside((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { pushOutside(y * W); pushOutside(y * W + (W - 1)); }
  while (sp > 0) {
    const i = stack[--sp], x = i % W, y = (i - x) / W;
    if (x > 0) pushOutside(i - 1);
    if (x < W - 1) pushOutside(i + 1);
    if (y > 0) pushOutside(i - W);
    if (y < H - 1) pushOutside(i + W);
  }
  // 2) Label the remaining background pixels (region 0, buf 0) into hole components.
  const holes = [];
  let holePixels = 0;
  for (let i = 0; i < N; i++) {
    if (buf[i] !== 0 || region[i] !== 0) continue;
    let area = 0, hminX = W, hmaxX = 0, hminY = H, hmaxY = 0;
    region[i] = 2; stack[0] = i; let s = 1;
    while (s > 0) {
      const j = stack[--s], x = j % W, y = (j - x) / W;
      area++; holePixels++;
      if (x < hminX) hminX = x; if (x > hmaxX) hmaxX = x;
      if (y < hminY) hminY = y; if (y > hmaxY) hmaxY = y;
      const nb = (k) => { if (buf[k] === 0 && region[k] === 0) { region[k] = 2; stack[s++] = k; } };
      if (x > 0) nb(j - 1);
      if (x < W - 1) nb(j + 1);
      if (y > 0) nb(j - W);
      if (y < H - 1) nb(j + W);
    }
    holes.push({ area, w: hmaxX - hminX + 1, h: hmaxY - hminY + 1 });
  }
  // 3) Label the FILL into connected components (the outline-connectivity law).
  const fseen = new Uint8Array(N);
  let fillPixels = 0, fillComponents = 0;
  for (let i = 0; i < N; i++) {
    if (buf[i] === 0) continue;
    fillPixels++;
    if (fseen[i]) continue;
    let area = 0;
    fseen[i] = 1; stack[0] = i; let s = 1;
    while (s > 0) {
      const j = stack[--s], x = j % W, y = (j - x) / W;
      area++;
      const nb = (k) => { if (buf[k] !== 0 && !fseen[k]) { fseen[k] = 1; stack[s++] = k; } };
      if (x > 0) nb(j - 1);
      if (x < W - 1) nb(j + 1);
      if (y > 0) nb(j - W);
      if (y < H - 1) nb(j + W);
    }
    if (area >= minFillArea) fillComponents++;   // ignore stray specks
  }
  const bigHoles = holes.filter((h) => h.area >= minHoleArea).sort((a, b) => b.area - a.area);
  const planform = fillPixels + holePixels;
  return {
    fillPixels, holePixels, planform,
    holeFraction: planform > 0 ? holePixels / planform : 0,
    holeCount: bigHoles.length,
    holes: bigHoles,
    largestHole: bigHoles.length ? bigHoles[0].area : 0,
    smallestHole: bigHoles.length ? bigHoles[bigHoles.length - 1].area : 0,
    fillComponents, minHoleArea,
  };
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
