// FLAP CLEARANCE PROBE — the first gate in this repo that measures the wing IN MOTION.
//
// WHY THIS EXISTS. The owner reported, from play, that the parts joining the trailing edge to the
// body "are like spokes that collide with the body in movement". It was real: a finger raking past
// ~85° about the wrist points backward-inboard, so its bone sweeps through the torso on the
// downstroke. And NOTHING in the harness could have caught it — every other tool here renders or
// measures a SINGLE POSE, and a motion collision cannot appear in a still. `planformprobe` even had
// an assertion attempted for it and withdrawn, because measuring rest geometry cannot tell a finger
// bone from a plagiopatagium corner (see the note in that file).
//
// This samples the rig at the five freeze points `dragon.js` already exposes via
// `?wingDebug=<phase>` — the same hooks `flapstrip` screenshots — and, instead of taking a picture,
// walks the live scene graph in-page and measures the smallest distance from any WING vertex to the
// torso's surface at that vertex's own z-station. Interpenetration is a negative clearance.
//
// The torso is approximated by its own built geometry rather than by a capsule: for each z-slice we
// take the hull's actual max |x| and y-range from the body meshes. That keeps the test honest for a
// creature whose torso is a fixed-polygon loft rather than a tube.
//
//   node reforged/tools/flapclearance.mjs [key] [tier]
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'fornax';
const tier = Number(process.argv[3] ?? 3);
const PHASES = ['glide', 'recovery', 'apex', 'downstroke', 'settle'];

// A wing may legitimately pass close to the flank — it grows from it. What is NOT legitimate is
// passing THROUGH. The floor is a small negative tolerance for the membrane root, which is meant to
// be buried inside the hull (that burial is how the junction seals), and a hard 0 for BONE.
const MEMBRANE_FLOOR = -0.30;   // root burial is intentional and bounded
const BONE_FLOOR = -0.02;       // a bone inside the torso is a collision, full stop

let fail = 0, pass = 0;
const check = (ok, label, detail) => {
  if (ok) { pass++; console.log(`  ✓ ${label}   ${detail ?? ''}`); }
  else { fail++; console.log(`  ✗ ${label}   ${detail ?? ''}`); }
};

console.log(`\nFlap clearance probe — ${key} (tier ${tier})\n${'-'.repeat(72)}`);
console.log('  measuring wing→torso clearance through the flap cycle (the harness is otherwise single-pose)\n');

const results = [];
for (const phase of PHASES) {
  const { page, done } = await boot({
    query: `?debug&wingDebug=${phase}`,
    viewport: { width: 900, height: 600 },
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
      v: 2, embers: 50,
      skins: { owned: ['${key}'], equipped: '${key}' },
      ascension: { tiers: [['${key}', ${tier}]], radiance: [] },
      cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
      flags: { seenFirstSurge: true, hintsSeen: 9 },
      settings: { reticle: false, slowMo: true, qualityOverride: null },
    }))`,
  });
  for (let a = 0; a < 6; a++) {
    await page.click('#btn-start').catch(() => {});
    if (await page.waitForSelector('#btn-start', { state: 'hidden', timeout: 1500 }).then(() => true, () => false)) break;
  }
  await page.waitForTimeout(2200);   // climb into steady flight; the wing is frozen at `phase`

  const r = await page.evaluate(() => {
    const THREE = window.THREE;
    // find the dragon root: the object carrying the wing pivots
    // ⚠ The scene is exposed as `window.__dd.scene` under ?debug — NOT `window.scene`, which I
    // invented and which silently made this tool report "no dragon root" on every phase. A probe
    // that cannot find its subject fails LOUDLY here rather than passing vacuously, which is the
    // only reason the mistake was visible at all.
    const scene = window.__dd?.scene;
    if (!scene) return { error: 'window.__dd.scene not found (is ?debug on?)' };
    let root = null;
    scene.traverse?.((o) => {
      if (root) return;
      let hasPivot = false;
      o.traverse?.((c) => { if (c.userData?.wingRole === 'pivot') hasPivot = true; });
      if (hasPivot && o.parent) root = o;
    });
    if (!root) return { error: 'no dragon root with wingRole pivots' };
    root.updateMatrixWorld(true);

    // Collect torso (non-wing) and wing vertices in the dragon's own frame.
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const body = [], wingMem = [], wingBone = [];
    const v = new THREE.Vector3();
    const underPivot = (o) => { let p = o; while (p) { if (p.userData?.wingRole === 'pivot') return true; p = p.parent; } return false; };
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry?.attributes?.position) return;
      const pos = o.geometry.attributes.position;
      const isWing = underPivot(o);
      const part = o.userData?.fornaxPart;
      const sink = !isWing ? body : (part === 'wing' || part === 'seam' ? wingMem : wingBone);
      const step = Math.max(1, Math.floor(pos.count / 900));   // cap the sample; this runs 5x
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).applyMatrix4(inv);
        sink.push([v.x, v.y, v.z]);
      }
    });
    if (!body.length) return { error: 'no torso geometry found' };

    // Torso surface, per z-slice: max |x| and the y band. A z-slice is honest for a lofted hull.
    const NZ = 28;
    let zMin = Infinity, zMax = -Infinity;
    for (const [, , z] of body) { if (z < zMin) zMin = z; if (z > zMax) zMax = z; }
    const halfW = new Array(NZ).fill(0), yLo = new Array(NZ).fill(Infinity), yHi = new Array(NZ).fill(-Infinity);
    const slot = (z) => Math.min(NZ - 1, Math.max(0, Math.floor(((z - zMin) / (zMax - zMin || 1)) * NZ)));
    for (const [x, y, z] of body) {
      const s = slot(z);
      if (Math.abs(x) > halfW[s]) halfW[s] = Math.abs(x);
      if (y < yLo[s]) yLo[s] = y;
      if (y > yHi[s]) yHi[s] = y;
    }
    // clearance = how far OUTSIDE the hull a point is, at its own z-slice.
    // Negative = inside the torso volume.
    const clr = (p) => {
      const [x, y, z] = p;
      if (z < zMin || z > zMax) return 999;
      const s = slot(z);
      if (!Number.isFinite(yLo[s])) return 999;
      if (y < yLo[s] || y > yHi[s]) return 999;          // above/below the hull entirely — clear
      return Math.abs(x) - halfW[s];
    };
    const worst = (arr) => arr.reduce((m, p) => Math.min(m, clr(p)), 999);
    return { membrane: worst(wingMem), bone: worst(wingBone), nBody: body.length, nMem: wingMem.length, nBone: wingBone.length };
  });
  await done();

  if (r.error) { console.log(`  ✗ ${phase}: ${r.error}`); fail++; continue; }
  results.push({ phase, ...r });
  console.log(`  ${phase.padEnd(11)} membrane ${r.membrane.toFixed(3)}u   bone ${r.bone.toFixed(3)}u`);
}

console.log('');
if (results.length) {
  const wm = Math.min(...results.map((r) => r.membrane));
  const wb = Math.min(...results.map((r) => r.bone));
  const wmP = results.find((r) => r.membrane === wm).phase;
  const wbP = results.find((r) => r.bone === wb).phase;
  check(wb >= BONE_FLOOR, `C1  no BONE penetrates the torso at any flap phase  [≥${BONE_FLOOR}u]`,
    `worst ${wb.toFixed(3)}u at "${wbP}"`);
  check(wm >= MEMBRANE_FLOOR, `C2  membrane root burial stays bounded  [≥${MEMBRANE_FLOOR}u]`,
    `worst ${wm.toFixed(3)}u at "${wmP}"`);
}
console.log('-'.repeat(72));
console.log(fail === 0 ? `PASS — ${pass} clearance targets met` : `FAIL — ${fail} of ${pass + fail} targets missed`);
process.exit(fail === 0 ? 0 : 1);
