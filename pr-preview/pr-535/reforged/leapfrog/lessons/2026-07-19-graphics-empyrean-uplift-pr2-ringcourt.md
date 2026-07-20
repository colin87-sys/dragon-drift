# EMPYREAN uplift PR-2 — RING COURT: two prop families, the inert-comp discovery, the arch lesson

**What we did** (per `EMPYREAN-UPLIFT-PLAN.md` + the Fable-audited `EMPYREAN-RINGCOURT-REFERENCE.md`):
- **haloShard** — a broken ring-ARCH fragment (~210° sweep, both horns bedded at the waterline, rose on
  ONE low lip, 144 tris) owning the EARLY lane third.
- **shardShrine** — a low crystalline rosette (4 canted blades, dominant ~2× siblings carrying the
  cluster's single thin rose lip, INVERSE crest-lift ladder ≤1.12, ~140 tris) owning the LATE third.
- **The bi===5 composition branch** — the arrival breath, an ~800m squared raised-cosine congregation
  rhythm, and per-archetype `laneBand` weights (early/mid/late). All pure dist/side/slot hashes.
- **Aerial haze** — `propAerial 0.6`, violet drift `0xbfaee8` (recession + depth cue).

**THE DISCOVERY: the Empyrean's `comp` was INERT.** Every empy archetype shipped with
`comp:{floor,sMin,sMax}` — but the writeMatrix composition chain only had branches for bi 2/3/0/4/7.
No `bi === 5` branch existed, so floor/swell/arrivalPark were silently ignored: every slot rendered at
uniform density. That IS the 5.8 review's "early/mid/late nearly interchangeable" and half its "one-prop
monotony". **Lesson: a per-biome config field is only as real as the branch that consumes it — grep the
consumer before trusting a def.** (The PR-5 lesson's "density-follows-framing has its skeleton" was
aspirational; the skeleton had no spine.)

**THE ARCH LESSON (2 gate rounds → the fix).** The reference specced "arc segments, sweep ≥55°". Fable
R1 (4.0): a 75° low arc reads as a pearlshoal MOUND. Deeper sweep (95°) + taller: R2 (4.1) — now it
reads as a straight BLADE, because a shallow arc seen edge-on (random per-instance rotY) collapses to a
line — the FLAP-DESIGN **depth-projection trap** striking prop design. The real fix is not more sweep on
an open arc but a CLOSED-SILHOUETTE form: a ~210° broken ARCH whose aperture + two descending horns
survive EVERY yaw. **Rule of thumb: if a prop's identity lives in its curvature, the curvature must be
closed enough (aperture, gap, ring) to read in silhouette at any azimuth — an open arc's identity is
yaw-fragile.**

**Round-savers.**
- The 4-station shrine: with 3 stations `_bladeInto`'s crown split (`i>=N-2`) makes the whole top half
  rose (candy-dip); the 4th station pins the lip to y0.90→1.0. Same as the choirstones lesson — port the
  station allocation, not just the grammar.
- envcount fails fast on a missing `FOAM_CFG` entry for any new water-standing archetype — add the foam
  seat with the archetype, not after.
- Sweeping obstacles every 400ms DURING capture settle (not only at freeze) prevents the auto-flying
  player crashing mid-burst (the CRASHED!-screen frame).
- CWD drift strikes again: `git add reforged/...` from repo root vs `js/...` from reforged/ — check
  `git status` first; and NEVER grep the stale legacy root `js/` (it silently matches nothing).

**Verify.** Guards green every commit (appshell, gold-determinism, biomecycle 14/0, envcount, tricount,
propclearance, skyprobe). Fable checkpoints: reference audit REVISE-FIRST (8 fixes) → studio rounds
(candy-dip, scatter) → in-biome 4.0 → 4.1 → the arch round. Dark budget ≤0.039 all frames.

**Deferred (owner-visible):** the RING GATE (lane-spanning paired posts) — the audit's highest-risk item;
it needs custom centre-lane placement outside the side-band `place()` system. The monolith hue-ramp +
tip variety also remain. Both are natural PR-3 companions (landmark/sky work touches the same late-band
Mote approach).

**What it unlocks.** The bi===5 comp branch is the biome's composition spine — PR-3/PR-4 tune it instead
of building it; `laneBand` is reusable for any biome's staged identity.
