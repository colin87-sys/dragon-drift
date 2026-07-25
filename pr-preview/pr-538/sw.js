// Dragon Drift service worker — network-first with cache fallback.
//
// Strategy rationale (do not change casually):
//   - ONLINE behavior is byte-identical to having no SW (always fetch) → a
//     GitHub Pages deploy takes effect on the very next load. Zero
//     stale-version risk, and correctness never depends on remembering to
//     bump CACHE below.
//   - Every successful same-origin GET is cached, so the LAST fully-fetched
//     version plays OFFLINE (installed-app replay — the whole game is static).
//   - Cache-first / stale-while-revalidate were rejected: with ~45 unhashed
//     files they can serve mixed-version module graphs after a deploy.
// CACHE is an escape hatch: bumping it force-flushes old caches on activate.
const CACHE = 'dd-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      if (res && res.ok) {
        const cache = await caches.open(CACHE);
        cache.put(e.request, res.clone());
      }
      return res;
    } catch {
      const hit = await caches.match(e.request, { ignoreSearch: url.pathname.endsWith('/') });
      if (hit) return hit;
      throw new Error('offline and uncached: ' + url.pathname);
    }
  })());
});
