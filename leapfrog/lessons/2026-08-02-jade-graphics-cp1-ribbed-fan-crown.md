# Jade premium CP1 — the ribbed FAN-CROWN (flat leaves → pleated koi parasols), Fable 4.3 PASS

**Did.** First checkpoint of the Jade Serpent premium beauty pass (Fable-designed plan). Rewrote the
web-fan builder (`dragonJadeSerpent.js emitFan`) from flat single-surface leaves into a ribbed jade
**fan-crown** — the hero element (jade's answer to the Tempest's storm-wings). Behind a default-off
`fanRays` dial (apex-only for now; other forms/dragons byte-identical). Cleared the harsh Fable gate
at **4.3/5** (bar 4.2) after ONE revise round.

**The build (shipped dials, apex):** `fanRays 7, fanRayRelief 0.22, fanBayDepth 0.13, fanSpread 0.82,
bodyFinScale 5.4`. Each fan = 7 raised, dominant-decay, index-hash-jittered pleat rays radiating from
a dark hub disc, membrane between them, a **gently-scalloped rounded** outer edge, a core→bloom→dark
value triad in the green lane (dark hub + dark bay webs → mid-jade → pale-seafoam crest bloom on the
outer half + a near-white `0xd8fff0` rim), `nRf 4 × nA 22`. **Single-winding** (the material is
`DoubleSide`) — the old fan wastefully emitted both windings, so the ribbing came at *negative* net
tri cost per fan; apex 4392→5064, still under the 6000 ceiling.

**The lesson that cost the first round (2.8 FAIL → 4.3 PASS):** a rib/ray system's SILHOUETTE law.
- **Deep bays = fingers = wrong creature.** v1 used `bayFloorR 0.66` (membrane tip pulled to ~0.5–0.6
  of ray length) + few sharp rays → the fans read as **spiky palm/aloe fronds**, not koi parasols
  (identity axis 2/5, the gate-blocker). The fix: **raise the bay floor to 0.87** (tip at ~0.87 of ray
  length) so the outer edge is a *gently scalloped rounded arc*; use **MORE, WIDER, blunter pleats**
  (5→7 rays, ridge width 0.5→0.62/nRays, length decay 0.85→0.9) — many subtle pleats read "pleated,"
  few sharp spikes read "thorny." That one change took the identity axis **2 → 4.5** in a single round.
- **Rays are INTERIOR relief, not the silhouette.** The ribs must live *in* one continuous fan
  surface (pleat crests + shadow valleys), not BE the fan (a bundle of separate blades). Same law as
  DRAGON-DESIGN's plane-wing / stick-limb kills, applied to fins.
- **Value triad or it collapses at distance.** Dark recessed bays (×0.58 on `1-ridge`) + a visible
  dark hub disc (u<0.2 ×0.4) + outer-half crest bloom + a crisp near-white rim. The RIM is what
  carries the parasol read to chase distance (the Tempest edge-zone trick); the bays mostly compress
  to mid-green at distance — a known residual (cheap future win: +10–15% bay darkening at the inner
  third only).
- **De-blob the row by SPACING, not just scale.** Widening the fan march along the body
  (`ft 0.22+0.62kf → 0.18+0.70kf`) stopped the mid fans fusing into one cabbage; scaling the shoulder
  fan up (+15%) gave chase-distance presence without re-fusing.

**Verify each checkpoint:** `tricount` (budget), `ribbonspine` identity re-bake (the fan re-lofts
through the frozen ribbon — MUST pass), `ribbonmotion/smooth/vertical` + `starters`, and the
`_herojade.mjs` capture kit (chase = player truth · q34 = fan value structure · top = row hierarchy ·
side = edge-on truth). New capture tool: `tools/_herojade.mjs` (apex, DSF1, 4 framed angles).

**Reusable takeaways.** (1) For any procedural fin/fan/frill: the OUTER-EDGE cup depth decides
creature vocabulary — shallow scallop = fan/parasol, deep cut = frond/thorn; tune it FIRST. (2) Ribs
are interior relief on one surface, never a bundle of blades. (3) A value triad needs the RIM to
carry it to gameplay distance; bays alone compress. (4) De-blob a row by spacing before scale. (5)
Motion stays frozen: geometry-only changes in the torso builder re-loft through the ribbon for free —
the identity proof catches any decompose slip.
