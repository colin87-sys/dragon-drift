// Headless contract test for the asset-backed (GLB) dragon path (dragonGlb.js).
//
// The GLB itself can't be built without WebGL, but buildGlbDragon's CONTRACT —
// the { group, parts, materials, auraSprite } shape dragon.js consumes every
// frame — is pure scene-graph and IS checkable under plain Node. In Node
// `inBrowser()` is false, so the async GLB swap-in is skipped and the builder
// returns its synchronous placeholder + authored rig: exactly the state the
// engine drives before (and, for headless, instead of) a real mesh load.
//
// This locks the must-return-real invariants that bite at runtime AND the
// hybrid wing invariant: the authored membrane wings live under the flap rig so
// the shipped wingbeat animates an AI body that supplies only a body mesh.
//
//   node tests/glbcontract.mjs
//
// Exit non-zero on any contract violation.

import { register } from 'node:module';

register('../tools/three-resolver.mjs', import.meta.url);

// Minimal DOM/canvas shim (mirrors tools/tricount.mjs) so util.js texture
// helpers don't throw. No renderer, no pixels read. Crucially NO location
// .protocol, so dragonGlb.inBrowser() stays false and the swap-in is skipped.
const ctx2d = {
  createRadialGradient: () => ({ addColorStop() {} }),
  createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {},
  beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {},
  set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {},
  set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {},
};
globalThis.window = globalThis;
globalThis.document = {
  hidden: false, addEventListener() {}, removeEventListener() {},
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }),
};
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };

const { DRAGONS } = await import('../js/dragons.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log(`  ✓ ${msg}`); } else { fail++; console.error(`  ✗ ${msg}`); } };

// The asset-backed dragon(s) in the roster.
const assetKeys = Object.keys(DRAGONS).filter((k) => DRAGONS[k].meshUrl);
ok(assetKeys.length > 0, `roster has at least one asset-backed dragon (${assetKeys.join(', ') || 'none'})`);

for (const key of assetKeys) {
  const def = DRAGONS[key];
  const built = buildDragonModel(def, {});
  ok(built && built.group && built.parts && built.materials, `${key}: returns { group, parts, materials }`);

  // auraSprite is dereferenced UNCONDITIONALLY every frame — must be a real Sprite.
  ok(built.auraSprite && built.auraSprite.isSprite === true, `${key}: auraSprite is a real THREE.Sprite`);
  ok(built.auraSprite.material && 'opacity' in built.auraSprite.material, `${key}: auraSprite.material.opacity exists`);

  // head pivot is rotated every frame — must be a real Object3D.
  ok(built.parts.head && built.parts.head.isObject3D === true, `${key}: parts.head is an Object3D`);

  // flap rig: shoulders drive the wingbeat, and the authored membrane wings must
  // ride under them so an AI body (no wing geometry) still flaps (hybrid).
  for (const side of ['wingRigL', 'wingRigR']) {
    const rig = built.parts[side];
    ok(rig && rig.shoulder && rig.shoulder.isObject3D, `${key}: parts.${side}.shoulder is an Object3D`);
    ok(rig && rig.elbow && rig.wrist, `${key}: parts.${side} exposes elbow + wrist`);
    let authored = null;
    rig.shoulder.traverse((o) => { if (o.name === 'authoredWing') authored = o; });
    ok(authored && authored.isMesh, `${key}: an authored membrane wing rides under ${side}.shoulder`);
  }

  // body material carries the rim/Surge hooks dragon.js drives.
  ok(built.materials.bodyMat && built.materials.bodyMat.isMaterial, `${key}: materials.bodyMat is a real material`);

  // the whole thing is a traversable graph with some geometry (the placeholder).
  let meshes = 0;
  built.group.traverse((o) => { if (o.isMesh) meshes++; });
  ok(meshes > 0, `${key}: group has visible placeholder geometry (${meshes} meshes)`);
}

console.log(`\n${pass} GLB-contract checks passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
