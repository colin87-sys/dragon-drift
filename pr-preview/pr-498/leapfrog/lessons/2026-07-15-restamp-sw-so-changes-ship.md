# Re-stamp the service worker or your changes never reach the browser

**What happened.** After a whole session of shipped, tested, pushed work (Frozen hazard
reskins, the Phase Gate revert, the entire Calved Canyon rock run), the owner fly-tested and
**still saw the OLD build** — the spiky cone rock run, build stamp `5e9ce5a0d72c`. Everything
was correct in git and deployed to the preview, but the browser was serving a stale cached
build. The changes had shipped to the server and **not to the user.**

**Root cause.** `reforged/sw.js` is a **cache-first service worker within a content-hashed
`VERSION`** (stamped by `tools/stamp-sw.mjs` from a hash of all 167 assets). The SW serves the
cached copy of every file for its current VERSION; it only re-fetches when VERSION changes.
My session made dozens of code changes but **never re-ran `stamp-sw.mjs`**, so `VERSION`
stayed `4cea050e7636` (stamped in an unrelated old commit). Returning browsers — which already
had the SW installed — kept replaying the cached old modules. The index.html SW logic
(update-on-focus + one-shot reload) only triggers a refresh **when the SW bytes change**, and
they only change when VERSION is re-stamped. No re-stamp → no VERSION change → no update → the
user is frozen on whatever build their SW cached.

**The fix (and the standing rule).** From `reforged/`:
```
node tools/stamp-sw.mjs      # → re-hashes VERSION over current assets, updates sw.js + buildId.js
```
then commit + push `sw.js` + `buildId.js`. VERSION bumped `4cea050e7636 → ff102e445141`; the
SW's focus-update + controllerchange reload now swaps browsers onto the fresh build.

**THE RULE for this repo: re-stamp the SW as the LAST step before telling the owner to
fly-test, any time a shipped asset (js/css/lib/index.html) changed.** It is NOT automatic on
push and NOT part of the preview deploy — it's a manual, committable step (there's already a
prior `7d6da29 Re-stamp service worker … so the fixes actually reach browsers`, so this has
bitten before). A green test suite and a clean `git push` are necessary but NOT sufficient for
delivery — the SW stamp is the difference between "shipped" and "the owner can see it."

**Owner-side, if they're still stuck on an open tab:** the SW re-checks on tab focus and
reloads once, but a hard-refresh / fully closing and reopening the tab (or the PWA) forces it
immediately. On iOS the backgrounded tab may need a full close.

**Second, unrelated gotcha surfaced by the same screenshot:** the Calved Canyon is
**Frozen-only** (`bi===2`) by the agreed Frozen-first rollout — a rock run in any other biome
is still the cone `seaStack` by design. So even on the fresh build, "fly a normal run and hope
to hit the new canyon" fails until you reach the Frozen biome; use `?biome=2&rockrun` to force
it. Communicate biome-scoped changes with the biome pin, not just the raw preview link.
