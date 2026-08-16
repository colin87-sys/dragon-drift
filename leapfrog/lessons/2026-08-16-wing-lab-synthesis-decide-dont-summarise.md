# Wing lab: synthesis means deciding — one exponential, a real arm, and channel separation

**What we did.** Closed the Wing Lab research phase: `reforged/wing-lab/90-SYNTHESIS.md` (the
buildable spec for the fire-dragon wing, every conflict between the six streams resolved) and
`91-CRITIQUE-LOG.md` Round 0 (the baseline verdict on the Tempest/Revenant/Vesper bar).

**What we learned — the reusable patterns:**

1. **Apparent contradictions between research streams usually resolve by separating CHANNELS
   and TERRITORIES, not by averaging.** "75 visible cords" vs "soft translucent sheet" vs
   "93–97% dark": cords are *thickness* (dark in transmission, sheen at grazing, invisible
   front-lit), and they live outboard where the glow is not, while the fire lives inboard where
   the cords are not. Nobody's finding was discarded; each got a channel and a territory.
2. **Two "opposite" shading findings can be one equation.** Hot-slab emission
   ε = 1 − exp(−κd/cosθ) and backlit transmission T = exp(−σd/cosθ) are the two ends of one
   exponential (Kirchhoff, ε = 1 − T). One per-vertex thickness drives both; the fire flares
   edge-on exactly while the sun-glow dims edge-on — free anti-correlated animation.
3. **The vessel doublet resolves "glowing veins are backwards" vs "the vasculature carries the
   heat": the ARTERY glows, the VEIN shades it.** One geometry, both channels, sourced pairing.
4. **Design for the polyline first.** The repo's own measurement (wing edge-on ~40% of the
   beat) means every feature must state its edge-on read or admit it has none — craft on the
   membrane face alone is craft the player misses half the time.
5. **A "directed gaps" register keeps the tagging law honest through synthesis.** Where the
   pack said `unknown`, the spec says DIRECTED with the chosen value — the gap stays visible
   instead of being smoothed into fake confidence.

**The gotcha.** Art guidance can collide with house law: A1's "desynchronise the two wings"
would violate FLAP-DESIGN LAW 5 (banking is pose bias, never an L/R phase delay) and
`wingsymprobe Δ0.000`. Resolve such collisions explicitly in the spec (asymmetry moved into
geometry seed + weathering) — silently following the newer advice would have shipped a
gate-blocking rig desync. Similarly a single search-grade number (the 111.0° elbow ceiling) was
convention-ambiguous; the spec takes the visible law, not the number.

**What it unlocks.** Builders can start I1 (skeleton/silhouette) from `90-SYNTHESIS.md` §3–§5
+ §9 alone; the blind A/B protocol and kill-list (§12, 64 items) are live in the log.
