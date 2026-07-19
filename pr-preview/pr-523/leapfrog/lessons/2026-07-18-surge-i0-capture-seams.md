# 2026-07-18 — SUNBREAK I0: surge capture seams before spectacle

**Did / learned.** Built the tooling floor for the Dragon Surge overhaul BEFORE touching a
pixel of the look. The unleash beam is a one-shot cinematic (`surgeSeq` charge→beam,
`boss.js:updateSurgeBeam`) that a headless screenshot almost always misses. Added a
`__ddSurgeForce`-style capture seam — a normally-undefined global that *pins* the cinematic
to a named beat (`apex` / `beam` / `impact`) or an explicit `{phase,t}` — resolved by
`surgeForceBeat()` at the top of `updateSurgeBeam`. When the global is undefined the helper
returns null and the whole pin path is skipped, so play is byte-identical to the shipped
roster (the exact `__ddArcForce` contract from `dragon.js:1743`). Exposed three `__dd` seams
in `main.js` — `surgeState()` (beat introspection + live `renderer.info.render.calls`),
`surgeSeam(beat)` (arm/clear the pin), `surgeCast()` (start the full charge→beam cinematic
from a fight) — backed by `debugSurgeState`/`debugSurgeCast` exports in `boss.js`. Extended
`tools/surgeshot.mjs` with a `seams` mode that forces a boss fight and stills each pinned
beat, and wrote `tests/surgefx.mjs` as the state-machine baseline (seam dormant by default,
introspection shape stable, pin round-trips with no residue, no cinematic leaks into off
frames, `timeScale` untouched idle).

**Gotcha.** Under swiftshader, `deviceScaleFactor:2` at 1100×720 blows the backbuffer up
enough that the game never reaches `state==='playing'` inside Playwright's default 30s wait —
the montage tool timed out. Full-frame montage stills don't need the retina buffer: dropping to
`dsf:1` at 1280×720 + a 60s `waitForFunction` timeout fixed it. Rule: **retina only for tight
studio crops; full frames stay dsf:1 headless, and every headless wait needs a generous
timeout** (heavy geometry runs ~30s+/frame here). Also: `renderer.info.render.calls` read from a
`page.evaluate` reflects the *last* render, not the pinned frame — fine as a liveness probe, but
the real DC-ceiling assert (I3) must read it right after a forced render.

**→ Systematize.** This is the reusable recipe for **capturing any timed one-shot spectacle
headlessly**: (1) a normally-undefined global that pins the beat (byte-identity for free), (2) a
read-only `state()` introspection export from the owning module, (3) a montage tool that forces
the context and stills each pinned beat, (4) a baseline test asserting the seam is dormant +
round-trips clean. Applies to bosses, dragons, and any future cinematic — the pin lives in the
module that owns the state machine, so the call site never changes. The "off-frames-clean"
proxy (beam can only show via explicit cast/pin; `timeScale===1` idle) is a cheap stand-in for
pixel byte-identity where per-frame hashing is impractical under software-GL (§M.1-10's
retarget: driving-envelope traces over frame hashes).

**→ Leapfrog.** With the beat pin + montage in place, every later increment can be *judged on
real captures against worst-case backgrounds* without banking the Surge meter or flying a live
fight: I1 grades the world-suppression frame, I2 the ignition cascade (ambient `?debug=fever`,
no boss needed), I3 the ribbon beam at `apex`/`beam`/`impact`, I4 the signature APEX frame. The
harness is the thing that makes "a target we measure is a round we don't burn" actually
executable — the machine judge now has eyes on the exact beats the Fable critic will score.
