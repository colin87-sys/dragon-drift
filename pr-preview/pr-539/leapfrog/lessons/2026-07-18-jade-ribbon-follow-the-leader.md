# Jade Serpent — the RIBBON body (follow-the-leader spine + steer-curl)

**What we did.** Replaced the jade koi's fixed lateral-sine body wobble with a **follow-the-leader
ribbon**: the head lays down a world-space breadcrumb trail and the body samples that trail at fixed
**arc-length** offsets behind the head, then the whole welded mesh is re-lofted from the resulting
dynamic spine frames every frame. The owner's ask was a gymnast's ribbon — "straight, then twirl,
trails you on command" — and this makes the three asks ONE operation on the head's trajectory:
straight input → straight trail → straight body; a steer → a curvature pulse travels head→tail; a
sustained turn → a curved trail → the body curls.

New files: `reforged/js/ribbonSpine.js` (pure, deterministic sim), `reforged/tests/ribbonmotion.mjs`
(motion proof), `reforged/tools/_ribbonshot.mjs` (in-engine straight/slalom/turn/coil capture).
It is **jade-gated** via `bodyWave.ribbon.active` — every other dragon stays byte-identical on the
sine path.

## The reusable method (any ribbon/serpent/trailing-tail creature)

1. **Decompose at build time, re-loft at run time.** Bake each vertex into `(homeStation,
   offT, offB, offN)` — its offset in that spine station's rest tangent/binormal/up frame. Then a
   single formula rebuilds the entire welded mesh from ANY dynamic frame set:
   `vertex = frame.p + offT·T + offB·B + offN·Nn`. Lock it with an **identity proof** test: re-loft
   from the REST frames must reproduce the baked geometry to float precision (`tests/ribbonspine.mjs`).
   This is what lets you change the MODEL later (length, fins, girth) and have the animation just
   re-bake — the owner asked "if we make it look better will that break the animation?" and the answer
   is no *because* of this decomposition.
2. **Arc-length trail, not a fixed lag.** Record the head into a ring buffer keyed on cumulative arc
   length (only when it moves ≥ `minSample`, decoupling resolution from framerate). Place station `i`
   at `liveHeadArc − segCum[i]` where `segCum` is the REST spine's cumulative gap — so body LENGTH is
   preserved (no stretch) and spacing is conserved.
3. **Parallel-transport frames, NEVER Frenet.** Frenet flips the normal at inflections and blows up at
   zero curvature (the straight rest state). Seed the normal from world-up, then rotate it station→
   station by the minimal rotation between consecutive tangents (Rodrigues) and re-orthonormalise.
4. **Pin station 0 to the head's local rest position (the anchor).** The head is a SEPARATE mesh at a
   fixed local spot; feed the sim `headWorld = group.localToWorld(anchor)` and add the anchor back in
   the world→local fold, or the body detaches from the head and pops on the first frame.

## Two gotchas that cost rounds

- **Double-counted `moved` (arc-length collapse).** When you record the head sample AND compute the
  live-head arc as `hs[head] + moved` in the same tick, a just-recorded sample counts `moved` twice
  and shoves every station one step toward the head — the station-0→1 gap collapses (test showed 81%
  spacing error). Fix: measure the head-to-newest-STORED-sample gap AFTER the record.
- **The bracket must be one-newer-than-`older`, not stale.** In the newest→oldest cursor walk, the
  "newer" interp bracket has to be the sample immediately newer than `older` (or the live head), not
  whatever was left from the previous station — otherwise the interp silently uses a far sample.

## The forward-runner coil trap (and the fix that cleared the gate)

A forward-runner can't trace a circle: holding steer ramps `velocity.x` then **saturates into a
straight diagonal** (and clamps at the lane wall), so the head path curvature is only a transient.
Result: a *sustained* hard turn looked identical to a *momentary* one — the Fable gate failed v2 at
4.1 on exactly this ("COIL == TURN"). A literal 270° spiral is physically unreachable; don't chase it.
**Fix = a steer-curl:** ramp a signed steer signal SLOWLY (≈1 s time-constant, so a flick barely
curls) and add a lateral body offset `curlAmp · curl · (arc/bodyLen)²` — quadratic so the TAIL hooks
most (a J). Zero at rest (straight stays a clean line); blooms only under held steering. That single
lever took COIL from "same picture as TURN" to a distinct ~40°-deeper monotonic J and cleared the gate.

## Fable gate ladder (feel, not just geometry)

Three rounds, harsh fresh critic each time, builder never self-judged, 4.2 bar:
- **v1 3.6 FAIL** — body read as a short "sash" (~3–4 head-lengths); straight had a busy S-wiggle.
- **v2 4.1 FAIL by a hair** — lengthened ~45% (`bodyReach` 8/11/14 → 11/16/20 + a ring-density bump)
  and calmed the swim (lower amp, longer wavelength, crisp head-fade); everything cleared bar EXCEPT
  COIL (indistinguishable from TURN).
- **v3 4.3 PASS** — the steer-curl made COIL a distinct J-hook. ~8–9 head-lengths, four distinct
  silhouettes = the gymnast-ribbon promise kept.

## Harness notes

- Judge motion on the **geometry**, not a critic's single-frame pixels alone: `ribbonmotion.mjs` proves
  R1 path-tracing, R2 arc-length conservation (<3%), R3 straight settle, R5 coil (≥270° when fed a real
  circle — the SIM can, the game can't), determinism. The Fable critic then judges the *feel* from the
  in-engine `_ribbonshot` captures. Two different questions; run both.
- **Headless capture gotchas:** the `#btn-start` CTA has a `breathe` CSS anim, so Playwright's
  actionability "stable" wait times out — fire `document.querySelector('#btn-start').click()` via
  `page.evaluate` and poll `__dd.game.state==='playing'`. And a **DSF-2 clipped screenshot on the live
  canvas can hang** ("fonts loaded" then timeout) while DSF-1 is reliable — capture at deviceScaleFactor 1.

**What it unlocks.** A shape-agnostic ribbon/trail body any long creature can adopt (jade-gated for
now); model beautification is fully separable from motion (re-bake, not re-animate); and the steer-curl
is a general "sustained-input flourish" pattern for any forward-runner that needs a maneuver to read as
more than its transient path.
