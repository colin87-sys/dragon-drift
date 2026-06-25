// Dragon Drift (reforged) service worker — NETWORK-FIRST with cache fallback.
//
// Strategy rationale (do not change casually):
//   - ONLINE behavior is byte-identical to having no SW (always fetch) → a
//     GitHub Pages / PR-preview deploy takes effect on the VERY NEXT load. No
//     VERSION stamp to bump, no cache-first staleness, no "your change isn't
//     showing" after a deploy. (This replaced the old content-versioned
//     precache SW, which served a stale cached module graph until its VERSION
//     changed AND the page was reloaded enough times for the new SW to take
//     over — the cause of repeated "it's not updating" confusion.)
//   - Every successful same-origin GET is still cached, so the LAST
//     fully-fetched build plays OFFLINE (installed-app replay — the whole game
//     is static assets).
//   - Cache-first / stale-while-revalidate were rejected: with ~110 unhashed
//     module files they can serve mixed-version module graphs after a deploy.
// CACHE is an escape hatch: bumping it force-flushes old caches on activate.
const CACHE = 'dd-reforged-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);   // flush the old dd-reforged-<hash> precache caches too
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
