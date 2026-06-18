// Browser-API shims so three-free game modules (save, missions, weekly,
// milestones, feats defs...) can be imported and unit-tested in plain node.
// Import this BEFORE any game module.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
globalThis.window = globalThis;
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
globalThis.document = { addEventListener: () => {}, hidden: false };
if (!globalThis.window.addEventListener) globalThis.window.addEventListener = () => {};
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

// Simple assertion helpers shared by the node test scripts.
export function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
}
export function assertEq(a, b, msg) {
  if (a !== b) throw new Error(`ASSERT FAILED: ${msg} — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
}
