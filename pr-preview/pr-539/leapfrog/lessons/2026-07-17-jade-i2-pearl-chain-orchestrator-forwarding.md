# 2026-07-17 — Jade AAA I2: the pearl-chain + the orchestrator-is-the-contract repair

**Did / learned.** Built increment 2 — the LIGHT that travels the torso fan from I1, plus the
rig-wiring bug-class the v2 audit predicted. In `dragonWings.js`, `dragonModel.js`, `dragon.js`:

- **Closed the dead-code forwarding gap (B1).** `buildSilkFinWings` published `pearlMat`/`tipGemMat`
  and `dragon.js` picked them up — but `buildDragonModel`'s TWO return objects (preview + main)
  never forwarded them, so `jadePearlMat`/`jadeTipGemMat` were **always null** and the shipped
  pearl-breath + dew-gem ticks had NEVER run in-game. Forwarded all four jade parts
  (`pearlMat`, `tipGemMat`, `pearlChainMats`, `waveRiders`) through both returns, nullable → the
  roster stays byte-identical. A headless regression assert now guards it (parts non-null +
  `pearlChainMats.length===3` + `waveRiders.length===2` in BOTH returns).
- **The pearl-chain**, written the ONLY way that survives the frame (B2). The shipped pearl/dew
  ticks wrote `emissiveIntensity` directly — which the cruise flare/reset loop (dragon.js:1744)
  clobbers every frame. Rewrote them (and the new chain walk over satellite beads → lyre gems →
  streamer ribbons) to write **`userData.baseIntensity`** off a stored `userData.pulseBase`, so
  the shared loop APPLIES the pulse (cruise shows it, Surge multiplies it). Dropped the fever
  guard — the pulse rides through Surge (the gravePulse precedent). Each link carries its own
  `chainLag` so pearl-light visibly travels rearward.
- **B3 userData stamps.** `finMat`/`finMatRear`/`satMat` shipped WITHOUT
  `userData.baseEmissive/baseIntensity`, so the reset loop rendered them emissive-**white @1.0**
  every cruise frame (a real shipped bug — the fans' green floor was fiction, the beads violated
  "the pearl is the only near-white"). Stamped all three at construction.
- **The lyre gems as `waveRiders` (§4.5).** Two mint octahedra seated over the caudal crescents —
  which sit on the WHIPPING tail (wave ramp ≈0.9). A separate mesh there sits STILL while the tail
  swings ±0.8 world-units → instant severed-appendage read. They ride the SAME wave formula as the
  tube via a **hoisted `rampAt(z)`** exported from the torso (two copies of the formula is the
  detach bug). Parented to the wings builder's top-level group — an identity sibling of the torso
  group — so torso-space rest coords (read via `attach.segmentAnchors`) are valid.
- Streamer material split (`streamerPulse`) so pulsing the ribbons doesn't pulse the rear lobe;
  `lobeBreath` appended to the boost/surge flareOpen so the pectoral fan breathes open on the swim
  crest in CRUISE (wave-locked to the chain — one organism); the §4.4 fever fields (`feverEye` the
  real magenta-leak fix, `feverWing` inert hygiene, `feverWash`).

**Verified:** tricount f0 2510 / f1 4458 / f2 **5396** (+16 lyre gems — exact sheet number), zero
NaN; starters 493/0; roster byte-identical; **19 plumbing asserts pass** (B1 both returns, B2 each
chain link oscillates with its own lag, B3 all spineMats stamped, no jade plumbing leaks to other
dragons); seamprobe PASS (law 12 — zero seams); wingsymprobe **identical to master** (Δ0.162 at
downstroke is a PRE-EXISTING jade lobe-poser residual, not a regression — proven by stashing).

**→ Systematize.** (1) **"X doesn't glow / doesn't animate in-game" is almost always a PUBLISHING
gap, not a shading bug** — a `parts.*` handle is dead until it appears in BOTH `dragonModel.js`
returns; grep the orchestrator before trusting a tick. Bake the both-returns forwarding into a
regression assert so the drop can't recur silently. (2) **The `spineMats` reset loop is a hostile
co-writer:** any custom-timed emissive either stays OUT of spineMats and owns its write after the
loop, OR joins spineMats and writes `userData.baseIntensity` (never `emissiveIntensity`) so the
loop applies it — and MUST carry `userData.baseEmissive/baseIntensity` stamps or it renders white
@1.0. Read `pulseBase` (a separate stored field), not `baseIntensity`, as the pulse base, or the
pulsing output feeds back into itself. (3) **A wave-rider mesh needs the driver's formula HOISTED
and shared** — export `rampAt` from the wave source, don't re-derive it at the rider. (4) When a
probe fails after a change, **stash and re-run on master** before assuming it's yours — identical
numbers = pre-existing.

**→ Leapfrog.** The chain now travels in-game for the first time ever. I3 locks the ladder asserts
(chain-link count {1,1,5}, monotonic dials, fever fields present) + the full battery, and the human
judges the chain-travel SPEED and the first-ever Surge mint on the live PR preview (headless probes
prove the write survives the frame; only the eye sees the travel).
