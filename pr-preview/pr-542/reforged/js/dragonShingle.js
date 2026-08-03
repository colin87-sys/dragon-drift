import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { seg } from './modelDetail.js';

// SHINGLE — the reusable "overlapping curved cards" generator (roadmap #2).
//
// Scales, plates, feathers and fins are all the same idea: many small CUPPED
// cards laid in overlapping rows over a creature, like roof shingles. The Phoenix
// already proves the look by hand (dragonWings.js#buildFeatherWings layers loose
// feather meshes); this generalises it into one system that any creature opts into
// declaratively, and — crucially for mobile — merges a whole run into ONE
// geometry → ONE draw call (the mergeGeometries + in-place bake pattern that
// environment.js#xform uses for its props).
//
// Two pieces:
//   shingleCard(len, wid, opts)  — one cheap hand-built cupped card (1×1 = 2 tris)
//   shingle(opts)                — lay `count` cards (× `rows` bands) along a
//                                  parametric run, bake + merge → { mesh, material }
//
// Detail-aware by construction (L11): card tessellation reads seg(); the COUNT is
// seg()-scaled by the caller, so density tracks the device tier for free. The
// material is ALWAYS supplied by the caller, so this module hard-codes no palette
// and stays placement-agnostic — the orchestrator (dragonModel) owns the policy.

const _UP = new THREE.Vector3(0, 1, 0);

// One cupped card. Built directly in the card's local frame: length along +Z,
// width along ±X (tapering to a small rounded point — never to zero, so no
// degenerate triangles, cf. L3), cupped along +Y (the face normal) by the
// parabolic camber lifted from buildLayeredFin (cup*len*(t−t²) + a spanwise bow).
// A (seg(rows) × seg(cols)) grid → rows*cols*2 triangles (default 1×1 = 2 tris).
// Normals are intentionally NOT computed here — they are recomputed once on the
// merged geometry (a per-card recompute would be wasted work and seam-inconsistent).
export function shingleCard(len, wid, opts = {}) {
  const R = Math.max(1, seg(opts.rows ?? 1));
  const C = Math.max(1, seg(opts.cols ?? 1));
  const cup = opts.cup ?? 0.25;
  const halfBase = wid * 0.5;
  const verts = [];
  const idx = [];
  for (let i = 0; i <= R; i++) {
    const t = i / R;
    const z = t * len;
    const halfW = halfBase * (1 - 0.85 * Math.pow(t, 1.3));   // taper → rounded tip
    for (let j = 0; j <= C; j++) {
      const u = C > 0 ? j / C : 0;
      const x = (u * 2 - 1) * halfW;
      const bow = halfBase > 0 ? (x / halfBase) * (x / halfBase) : 0;
      const y = cup * len * (t - t * t) + cup * 0.4 * bow * len;  // cup up along +Y
      verts.push(x, y, z);
    }
  }
  const cw = C + 1;
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      const a = i * cw + j, b = a + 1, c = a + cw, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx);
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  return g;
}

// Lay a run of cupped cards and merge to ONE mesh. `at(t,row)` gives each card's
// centre, `normalAt(t,row)` the surface normal it cups along, `tangentAt(t,row)`
// (optional) the along-run direction so the card's length lies down the body.
// Every card geometry is transformed IN PLACE (rotate/applyQuaternion/translate —
// never a per-card Mesh transform), so the merge yields a single draw call.
//   opts: { count, rows, at, normalAt, tangentAt, length|lengthAt, width|widthAt,
//           cup, tilt, cardRows, cardCols, material }
// → { mesh, material, geometry, triCount }
export function shingle(opts = {}) {
  const {
    count = 1, rows = 1, material,
    at, normalAt, tangentAt,
    length = 0.3, width = 0.18, lengthAt, widthAt,
    cup = 0.25, tilt = 0.3, cardRows = 1, cardCols = 1,
  } = opts;

  const geos = [];
  const N = new THREE.Vector3(), T = new THREE.Vector3(), X = new THREE.Vector3();
  const mat4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();

  for (let row = 0; row < rows; row++) {
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      const len = lengthAt ? lengthAt(t, row) : length;
      const wid = widthAt ? widthAt(t, row) : width;
      const g = shingleCard(len, wid, { cup, rows: cardRows, cols: cardCols });
      if (tilt) g.rotateX(-tilt);                       // stand the free (tip) edge up

      N.copy(normalAt ? normalAt(t, row) : _UP).normalize();
      if (tangentAt) {
        // Full basis: local +Y → surface normal, local +Z → run tangent.
        T.copy(tangentAt(t, row)).normalize();
        N.addScaledVector(T, -N.dot(T)).normalize();    // re-orthogonalise the normal
        X.crossVectors(N, T).normalize();               // right-handed (X = Y×Z)
        mat4.makeBasis(X, N, T);
        q.setFromRotationMatrix(mat4);
      } else {
        q.setFromUnitVectors(_UP, N);                   // align the face only
      }
      g.applyQuaternion(q);

      const p = at ? at(t, row) : { x: 0, y: 0, z: 0 };
      g.translate(p.x, p.y, p.z);
      geos.push(g);
    }
  }

  const geometry = mergeGeometries(geos);
  // mergeGeometries returns null if the inputs have mismatched attribute sets —
  // every card here is position+index only, so this should never fire; assert it
  // so a future "edge vertex-colour on some cards only" mistake fails loudly.
  if (!geometry) throw new Error('shingle: mergeGeometries returned null (inconsistent card attributes)');
  geometry.computeVertexNormals();                      // once, on the merged result

  const mat = material || new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 });
  const mesh = new THREE.Mesh(geometry, mat);
  const triCount = (geometry.index ? geometry.index.count : geometry.attributes.position.count) / 3;
  return { mesh, material: mat, geometry, triCount };
}
