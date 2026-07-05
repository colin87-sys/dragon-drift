// Node module loader for the smoke test: resolves the browser importmap's
// bare 'three' specifier to the vendored module.
export function resolve(specifier, context, next) {
  if (specifier === 'three') {
    return next(new URL('../../lib/three.module.js', import.meta.url).href, context);
  }
  return next(specifier, context);
}
