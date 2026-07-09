// ESM resolve hook: map the bare 'three' specifier (used throughout js/) to the
// repo's bundled lib/three.module.js, so the shared model builder imports under
// plain Node — no bundler, no node_modules. Registered by tools/tricount.mjs.
const THREE_URL = new URL('../lib/three.module.js', import.meta.url).href;

export function resolve(specifier, context, nextResolve) {
  if (specifier === 'three') return { url: THREE_URL, shortCircuit: true };
  return nextResolve(specifier, context);
}
